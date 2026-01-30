

## Plan: Fiks samtalevisning med riktig Voiceflow Analytics API-format

### Problemanalyse

**Feil 1: Feil property-navn for samtaleinnhold**
- Edge function logger: `data.history?.length` 
- Ny API returnerer: `data.transcript.logs`
- Frontend leser: `data?.history`

**Feil 2: Feil meldingsformat**
- Gammel format: `{ type: "text", payload: { payload: { message: "..." } } }`
- Ny format: `{ type: "trace", data: { message: "..." }, createdAt: "..." }`

**Feil 3: Kun 100 samtaler**
- Voiceflow API maks er 100 per request
- Trenger paginering for å hente flere

### Løsning

#### Trinn 1: Oppdater edge function `get-transcript`

**Fil:** `supabase/functions/get-transcript/index.ts`

Endre respons-håndtering:
```typescript
const data = await voiceflowResponse.json();
// Ny API returnerer { transcript: { logs: [...] } }
console.log(`Successfully fetched transcript ${transcriptId}, logs items: ${data.transcript?.logs?.length || 0}`);

// Transformer logs til gammelt format for bakoverkompatibilitet
const transformedLogs = (data.transcript?.logs || []).map((log: any) => ({
  type: mapLogType(log.type),
  startTime: log.createdAt,
  payload: {
    payload: log.data
  }
}));

return new Response(
  JSON.stringify({ history: transformedLogs, transcript: data.transcript }),
  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

Type-mapping funksjon:
```typescript
function mapLogType(logType: string): string {
  switch (logType) {
    case 'trace': return 'text';
    case 'action': return 'request';
    default: return logType;
  }
}
```

#### Trinn 2: Oppdater edge function `get-transcripts` for paginering

**Fil:** `supabase/functions/get-transcripts/index.ts`

Legg til støtte for å hente flere sider automatisk eller returnere paginerings-info:
```typescript
// Returner også total count og paginerings-info
return new Response(
  JSON.stringify({
    transcripts: data.transcripts,
    hasMore: data.transcripts?.length === take,
    skip: skip,
    take: take
  }),
  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

#### Trinn 3: Oppdater `use-dialog-preloader.ts`

Sørg for at preloader også bruker transformert respons:
```typescript
// Data er allerede transformert av edge function
const historyData = data?.history || [];
```

### Filer som må endres

| Fil | Endring |
|-----|---------|
| `supabase/functions/get-transcript/index.ts` | Les `transcript.logs`, transformer til gammelt format |
| `supabase/functions/get-transcripts/index.ts` | Legg til paginerings-info |
| `src/hooks/use-dialog-preloader.ts` | Verifiser at den bruker `data.history` |

### Ny API-mapping

| Ny API felt | Gammel format | Beskrivelse |
|-------------|---------------|-------------|
| `transcript.logs` | `history` | Array med meldinger |
| `log.type = "trace"` | `type = "text"` | Bot-melding |
| `log.type = "action"` | `type = "request"` | Bruker-input |
| `log.data.message` | `payload.payload.message` | Meldingstekst |
| `log.createdAt` | `startTime` | Tidsstempel |

### Forventet resultat
- Samtaler viser faktisk innhold
- Meldinger formateres riktig (bot vs bruker)
- Timestamps vises korrekt
- Preloading fungerer

