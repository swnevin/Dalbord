

## Plan: Fiks meldingsvisning - Korriger Voiceflow trace-struktur-parsing

### Problemet identifisert

Edge function-loggene viser konsekvent:
- **"Transformed 0 displayable messages from 35 logs"**
- **"Transformed 1 displayable messages from 86 logs"**

Fra 86 raw logs blir kun 1 melding ekstrahert! Problemet er at Voiceflow Analytics API bruker en **nestet struktur** for traces:

```text
Forventet struktur (det vi lettet etter):
{
  "type": "trace",
  "data": { "message": "Hei!" }
}

Faktisk struktur (det Voiceflow returnerer):
{
  "type": "trace",
  "data": {
    "type": "speak",           <-- Nestet type!
    "payload": {
      "message": "Hei!"        <-- Nestet payload!
    }
  }
}
```

### Losning

Oppdater `extractStringValue()` i edge function til a handtere den nestede strukturen:

**Fil:** `supabase/functions/get-transcript/index.ts`

**Endringer:**
1. Sjekk for `data.type` (speak, text, visual)
2. Les meldinger fra `data.payload.message`
3. Handter action-typer som har `data.payload` som streng

### Ny transformasjonslogikk

```typescript
function extractStringValue(data: any): string | null {
  if (typeof data === 'string') return data;
  if (data === null || data === undefined) return null;
  
  // NYTT: Sjekk for nestet trace-struktur fra Voiceflow
  // Format: { type: "speak", payload: { message: "..." } }
  if (data.type === 'speak' || data.type === 'text') {
    if (typeof data.payload?.message === 'string') {
      return data.payload.message;
    }
  }
  
  // Sjekk direkte message-property
  if (typeof data.message === 'string') return data.message;
  if (typeof data.text === 'string') return data.text;
  
  // Sjekk payload.message
  if (typeof data.payload?.message === 'string') return data.payload.message;
  
  // Skip metadata-objekter
  const metadataKeys = ['browser_url', 'trace', 'debug', 'path', 'blockID', 'diagramID'];
  const keys = Object.keys(data);
  const hasOnlyMetadata = keys.every(key => 
    metadataKeys.includes(key) || typeof data[key] === 'object'
  );
  if (hasOnlyMetadata) return null;
  
  return null;
}
```

### For action-typer (bruker-input)

```typescript
// Ny logikk for a finne brukerens input
let query: string | null = null;
if (typeof log.data === 'string') {
  query = log.data;
} else if (typeof log.data?.payload === 'string') {
  query = log.data.payload;
} else if (log.data?.type === 'intent' && log.data?.payload?.query) {
  // Intent-basert input
  query = log.data.payload.query;
} else if (log.data?.type === 'launch') {
  // Skip launch events - de er ikke brukermeldinger
  return null;
}
```

### Fil som endres

| Fil | Endring |
|-----|---------|
| `supabase/functions/get-transcript/index.ts` | Oppdater `extractStringValue()` til a handtere nestet trace-struktur, legg til stotte for `speak`/`text` typer med `payload.message` |

### Debug-logging (midlertidig)

For a verifisere strukturen legger vi til logging av forste 3 logs:

```typescript
// Debug: Log first few raw logs to understand structure
if (logs.length > 0) {
  console.log('Sample log structure:', JSON.stringify(logs.slice(0, 3), null, 2));
}
```

### Forventet resultat

- Alle bot-meldinger (speak/text traces) vises korrekt
- Bruker-input vises korrekt
- Metadata-traces filtreres fortsatt bort
- Loggene viser "Transformed X displayable messages" med X mye hoyere enn for

