
## Plan: Fiks meldingsvisning ved å korrigere data-mapping fra Voiceflow Analytics API

### Rotårsak identifisert

Backend (edge function) henter data korrekt - loggene viser:
```
Successfully fetched transcript 697cbd48ba54f2000746a048, logs items: 97
```

Men frontend viser "Ingen meldinger i denne samtalen" fordi **data-strukturen fra ny API matcher ikke hva frontend forventer**.

### Detaljert analyse

**Voiceflow ny API format:**

```text
For bot-meldinger (trace):
{
  "type": "trace",
  "data": { "message": "Hei! Hvordan kan jeg hjelpe deg?" },
  "createdAt": "..."
}

For bruker-input (action):
{
  "type": "action",
  "data": { "action": "user_input", "payload": "Hei, jeg trenger hjelp" },
  "createdAt": "..."
}
```

**Hva frontend forventer (legacy format):**

```text
For bot-meldinger (type: 'text'):
message.payload.payload.message = "Hei! Hvordan kan jeg hjelpe deg?"

For bruker-input (type: 'request'):
message.payload.payload.query = "Hei, jeg trenger hjelp"
ELLER
message.payload.payload.label = "Hei, jeg trenger hjelp"
```

**Problemet:**
- For `action` type: Voiceflow API returnerer `data.payload = "tekst"`, men frontend leser `data.query` eller `data.label`
- Mappingen i edge function kopierer bare `log.data` uten å transformere til legacy-struktur

### Losning: Forbedre transformasjonen i edge function

Oppdater `supabase/functions/get-transcript/index.ts` til a transformere data korrekt:

```text
For trace-type (bot-melding):
- Hvis log.data.message finnes: behold som er
- Ellers: pakk log.data inn i { message: log.data }

For action-type (bruker-input):
- Sett query = log.data.payload (brukerens tekst)
- Behold action-info for debugging
```

**Ny transformasjonslogikk:**
```typescript
const transformedLogs = logs.map((log: any) => {
  const mappedType = mapLogType(log.type);
  
  let payload;
  if (log.type === 'trace') {
    // Bot message - extract message property
    const message = typeof log.data === 'string' 
      ? log.data 
      : log.data?.message || log.data?.text || JSON.stringify(log.data);
    payload = { payload: { message } };
  } else if (log.type === 'action') {
    // User input - map payload to query
    const query = typeof log.data === 'string'
      ? log.data
      : log.data?.payload || log.data?.query || log.data?.label || '';
    payload = { payload: { query } };
  } else {
    // Other types - pass through
    payload = { payload: log.data };
  }
  
  return {
    type: mappedType,
    startTime: log.createdAt,
    payload
  };
});
```

### Filer som endres

| Fil | Endring |
|-----|---------|
| `supabase/functions/get-transcript/index.ts` | Forbedre transformasjonslogikk for a mappe ny API-format til legacy-format |

### Forventet resultat
- Bot-meldinger vises korrekt med gront bakgrunn
- Bruker-meldinger vises korrekt med gul bakgrunn
- Timestamps vises
- Samtalehistorikk scrolles til nyeste sesjon
