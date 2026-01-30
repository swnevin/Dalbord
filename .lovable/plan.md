

## Plan: Bytt til riktig Voiceflow Transcripts API

### Rotårsak
Applikasjonen bruker **Legacy Transcripts API** (`api.voiceflow.com/v2/transcripts/...`) som returnerer tomme arrays. Den nye **Transcripts API** (`analytics-api.voiceflow.com/v1/transcript/...`) returnerer faktisk samtaleinnhold i `history`-arrayen.

### Løsning

#### Trinn 1: Oppdater API-endepunkt for å hente samtale-detaljer

**Fil:** `src/pages/ClientDashboard.tsx`

Endre fra:
```typescript
const response = await fetch(
  `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${selectedConversation}`,
  {
    headers: {
      accept: 'application/json',
      Authorization: org.voiceflow_api_key,
    },
  }
);
const data = await response.json();
setDialog(data);
```

Til:
```typescript
const response = await fetch(
  `https://analytics-api.voiceflow.com/v1/transcript/${selectedConversation}?filterConversation=false`,
  {
    headers: {
      accept: 'application/json',
      Authorization: org.voiceflow_api_key,
    },
  }
);
const data = await response.json();
// Ny API returnerer history-array med samtaledata
setDialog(data.history || []);
```

#### Trinn 2: Oppdater preloader med samme API-endepunkt

**Fil:** `src/hooks/use-dialog-preloader.ts`

Samme endring for preload-funksjonen.

#### Trinn 3: Oppdater eventuelle andre API-kall

Sjekk og oppdater:
- Samtaleliste-henting (kan fortsatt bruke legacy hvis den fungerer)
- Sletting av samtaler (sjekk om ny API har dette)

### Tekniske detaljer

| Funksjon | Gammelt endepunkt | Nytt endepunkt |
|----------|-------------------|----------------|
| Hent samtale | `api.voiceflow.com/v2/transcripts/{projectID}/{transcriptID}` | `analytics-api.voiceflow.com/v1/transcript/{transcriptID}` |
| Respons-struktur | `[]` (array direkte) | `{ transcript: {...}, history: [...] }` |

### Filer som må endres

| Fil | Endring |
|-----|---------|
| `src/pages/ClientDashboard.tsx` | Bytt API-endepunkt for fetchDialog |
| `src/hooks/use-dialog-preloader.ts` | Bytt API-endepunkt for preloading |

### Testplan
1. Logg inn som hanna@birkebeiner.no
2. Gå til Birken-botten > Samtaler
3. Klikk på en samtale
4. Verifiser at samtaleinnhold faktisk vises
5. Sjekk at meldingene vises riktig (format kan ha endret seg)

