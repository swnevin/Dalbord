

## Plan: Løs CORS-feil ved å opprette edge function proxy for transkripsjoner

### Rotårsak dokumentert

**Problem**: Alle forespørsler til `https://analytics-api.voiceflow.com/v1/transcript/{id}` feiler med "Failed to fetch".

**Årsak**: Voiceflow sin Analytics API tillater IKKE direkte forespørsler fra nettlesere (CORS-blokkering). Nettverksloggene viser at forespørslene blir blokkert før de når serveren.

**Bevis fra loggene**:
```
Request: GET https://analytics-api.voiceflow.com/v1/transcript/6977ba97dccb326054abf4e9?filterConversation=false
Error: Failed to fetch  <-- CORS-blokkert
```

### Løsning: Bruk Supabase Edge Function som proxy

```text
+--------+     CORS OK      +----------------+    Ingen CORS    +-------------+
| Browser| ---------------> | Edge Function  | ---------------> | Voiceflow   |
|        | <--------------- | (Supabase)     | <--------------- | API         |
+--------+                  +----------------+                   +-------------+
```

### Tekniske endringer

#### Trinn 1: Opprett ny edge function `get-transcript`

**Fil:** `supabase/functions/get-transcript/index.ts`

Denne funksjonen vil:
- Motta transcriptID fra frontend
- Autentisere brukeren
- Hente organisasjonens Voiceflow-credentials
- Kalle Voiceflow Analytics API server-side (ingen CORS)
- Returnere data til frontend

#### Trinn 2: Oppdater `ClientDashboard.tsx`

Endre fra:
```typescript
const response = await fetch(
  `https://analytics-api.voiceflow.com/v1/transcript/${selectedConversation}?filterConversation=false`,
  { headers: { Authorization: org.voiceflow_api_key } }
);
```

Til:
```typescript
const { data, error } = await supabase.functions.invoke('get-transcript', {
  body: { transcriptId: selectedConversation }
});
```

#### Trinn 3: Oppdater `use-dialog-preloader.ts`

Samme endring for preloading-logikken.

### Filer som opprettes/endres

| Fil | Handling |
|-----|----------|
| `supabase/functions/get-transcript/index.ts` | Opprett ny edge function |
| `src/pages/ClientDashboard.tsx` | Bruk edge function i stedet for direkte API-kall |
| `src/hooks/use-dialog-preloader.ts` | Bruk edge function i stedet for direkte API-kall |

### Forventet resultat
- Ingen CORS-feil
- Samtaler lastes korrekt
- Sikker autentisering (brukeren må være logget inn)
- Voiceflow API-nøkkel eksponeres ikke i nettleseren

