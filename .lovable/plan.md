## Plan: Fikse QnA-lagring og statistikk

Jeg har sporet begge feilene til to ulike årsaker.

### Hva som er galt

**1. QnA / kunnskapsbase ("network error")**

Den nylige sikkerhetsmigreringen fjernet `SELECT`-rettigheten på kolonnen `voiceflow_api_key` for både `authenticated` og `anon`. Frontend henter API-nøkkelen direkte fra `organizations`-tabellen mange steder, og når det spørres etter `voiceflow_api_key` kommer den nå tilbake som `null` → koden kaster "Kunne ikke hente Voiceflow API nøkkel", som vises som en generell feil. Dette rammer:

- Opprette/oppdatere QnA (`QASourceFormContainer`, `CreateFAQDialog`)
- Laste opp URL-kilder (`URLSourceFormContainer`)
- Laste opp fil-kilder (`FileSourceFormContainer`)
- Hente/slette eksisterende kilder (`KnowledgeBase.tsx`)

I tillegg er disse kallene `fetch('https://api.voiceflow.com/...')` direkte fra nettleseren, noe som er sårbart for CORS og eksponerer nøkkelen — riktig løsning er å gå via en edge-funksjon uansett.

**2. Statistikk oppdaterer seg ikke**

Voiceflow har deprekert v1 av Analytics API. Vår `get-voiceflow-analytics` edge-funksjon kaller fortsatt `https://analytics-api.voiceflow.com/v1/query/usage` med det gamle skjemaet `{ query: [{ name, filter }] }`. Den nye API-en er `v2` med et annet request/response-skjema:

```
POST https://analytics-api.voiceflow.com/v2/query/usage
{ "data": { "name": "interactions", "filter": { projectID, startTime, endTime } } }
→ { "result": { "items": [{ "period": "...", "count": 0, ... }], "cursor": 0 } }
```

Endepunktet returnerer nå én rad per periode (ikke ett totaltall), så telleren må summeres på klientsiden.

### Hva jeg gjør

**A. Ny edge-funksjon `voiceflow-kb` (proxy for kunnskapsbasen)**

En enkelt funksjon som tar `action` i body og utfører den mot Voiceflow med server-side API-nøkkel:

| action | Beskrivelse |
|--------|-------------|
| `list_docs` | Hent alle KB-dokumenter (paginert) |
| `get_doc` | Hent chunks for ett dokument |
| `delete_doc` | Slett ett dokument |
| `upload_qa` | Lag/oppdater Q&A-tabell (med `overwrite`) |
| `upload_url` | Last opp URL-kilde |
| `upload_file` | Last opp fil-kilde (multipart videresending) |

Funksjonen henter `voiceflow_api_key` via `service_role`, validerer at brukeren tilhører organisasjonen, og videresender til Voiceflow.

**B. Frontend bruker den nye edge-funksjonen**

Erstatter alle `supabase.from('organizations').select('voiceflow_api_key')` + `fetch('api.voiceflow.com/...')` i disse filene med `supabase.functions.invoke('voiceflow-kb', { body: { action, ... } })`:

- `src/components/KnowledgeBase.tsx`
- `src/components/knowledge-base/source-forms/QASourceFormContainer.tsx`
- `src/components/knowledge-base/source-forms/URLSourceFormContainer.tsx`
- `src/components/knowledge-base/source-forms/FileSourceFormContainer.tsx`
- `src/components/home/CreateFAQDialog.tsx`

**C. Oppgradere `get-voiceflow-analytics` til v2**

- URL: `/v1/query/usage` → `/v2/query/usage`
- Body: `{ data: { name, filter: { projectID, startTime, endTime } } }`
- Parse: summer `result.items[].count` for totaler; grupper på `period`-dato for `daily_*`-modus (fjerner dermed N parallelle dag-kall — én forespørsel dekker hele perioden).
- Bevarer eksisterende `queryType`-API mot frontend slik at `useStatistics` ikke trenger endringer.
- For `top_intents`: bruker samme v2-endepunkt med `name: "top_intents"` og mapper responsstrukturen riktig.

### Filer som endres

| Fil | Endring |
|-----|---------|
| `supabase/functions/voiceflow-kb/index.ts` | Ny KB-proxy |
| `supabase/config.toml` | Registrer `voiceflow-kb` |
| `supabase/functions/get-voiceflow-analytics/index.ts` | v1 → v2, ny response-parsing |
| `src/components/KnowledgeBase.tsx` | Bruk edge-funksjon |
| `src/components/knowledge-base/source-forms/QASourceFormContainer.tsx` | Bruk edge-funksjon |
| `src/components/knowledge-base/source-forms/URLSourceFormContainer.tsx` | Bruk edge-funksjon |
| `src/components/knowledge-base/source-forms/FileSourceFormContainer.tsx` | Bruk edge-funksjon |
| `src/components/home/CreateFAQDialog.tsx` | Bruk edge-funksjon |

### Bieffekter / fordeler

- API-nøkkelen lekker ikke lenger til klienten (sikkerhet).
- Slipper CORS-problemer fra `api.voiceflow.com`.
- Statistikk-funksjonen blir raskere (én v2-forespørsel per metrikk i stedet for én per dag).
