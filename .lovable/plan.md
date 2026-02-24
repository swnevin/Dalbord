

## Plan: Datofilter for samtaler

Legge til en datovelger i samtale-panelet slik at du kan filtrere samtaler etter en egendefinert periode, uten a matte bla manuelt.

### Hvordan det fungerer

Voiceflow sitt API stotter allerede `startDate` og `endDate` som filtreringsparametere. Vi trenger bare a koble dette opp i frontend og edge-funksjonen.

### Endringer

**1. ConversationList.tsx - Legge til datovelger i filterpanelet**
- Legge til en datopicker-rad under de eksisterende filterknappene (Alle / Gjennomgatte / Lagrede)
- To datovelgere: "Fra" og "Til" med Popover + Calendar-komponent
- En "Nullstill"-knapp for a fjerne datofilteret
- Datoene sendes oppover via nye props

**2. ClientDashboard.tsx - Haandtere datotilstand og sende til API**
- Ny state for `dateFilter: { from?: Date, to?: Date }`
- Sende datofilter til `get-transcripts` edge-funksjonen
- Nullstille samtaler og laste pa nytt nar datofilter endres

**3. supabase/functions/get-transcripts/index.ts - Videresende datofilter til Voiceflow**
- Lese `startDate` og `endDate` fra request body
- Sende disse videre i POST-bodyen til Voiceflow sitt Analytics API

### UI-skisse

```text
+------------------------------------------+
| Samtaler (42)                    [<] [>]  |
+------------------------------------------+
| [Sok...]                            [i]  |
+------------------------------------------+
| [Alle samtaler] [Gjennomgatte] [Lagrede] |
+------------------------------------------+
| Fra: [01.01.2025]  Til: [24.02.2025]  [x]|  <-- NY RAD
+------------------------------------------+
| Samtale 1...                              |
| Samtale 2...                              |
+------------------------------------------+
```

### Teknisk detalj

Voiceflow API-kall endres fra:
```typescript
// Navarende
body: JSON.stringify({})

// Nytt
body: JSON.stringify({
  ...(startDate && { startDate }),
  ...(endDate && { endDate })
})
```

### Filer som endres

| Fil | Endring |
|-----|---------|
| `src/components/conversations/ConversationList.tsx` | Legge til datopicker-rad med Fra/Til-kalendere |
| `src/pages/ClientDashboard.tsx` | Ny state for datofilter, re-fetch ved endring |
| `supabase/functions/get-transcripts/index.ts` | Videresende startDate/endDate til Voiceflow API |

