

## Plan: Implementer lokal lagring av samtale-tags

### Problemanalyse

**Rotårsak:**
Voiceflow har lansert et nytt transcript-system. Det gamle v2 API-et med `report_tag` er deprecated og returnerer `500 Internal Server Error` når man prøver å markere samtaler.

**Nåværende flyt som feiler:**
1. Bruker klikker på bookmark/check-ikon
2. Frontend kaller Voiceflow API: `PUT .../report_tag/system.saved`
3. Voiceflow returnerer `500: "add tag error"`
4. Ingenting skjer i UI

### Løsning

Lagre tags lokalt i Supabase-databasen i stedet for å bruke Voiceflow.

---

### Del 1: Database

**Ny tabell: `conversation_tags`**

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid | Primærnøkkel |
| organization_id | uuid | Kobling til organisasjon |
| transcript_id | text | Voiceflow samtale-ID |
| tag | text | 'saved' eller 'reviewed' |
| created_at | timestamp | Tidspunkt for markering |

Inkluderer Row Level Security slik at brukere kun ser tags for sin egen organisasjon.

---

### Del 2: Edge Function

**Ny: `toggle-conversation-tag`**

Enkel toggle-logikk:
- Hvis tag finnes: Slett den (fjern markering)
- Hvis tag ikke finnes: Opprett den (legg til markering)
- Returner oppdatert status til frontend

---

### Del 3: Frontend

**Fil: `src/pages/ClientDashboard.tsx`**

1. **Ved oppstart:** Hent alle tags fra Supabase og merge med samtalelisten
2. **Ved klikk på ikon:** Kall edge function i stedet for Voiceflow API
3. **Oppdater UI:** Vis endringen umiddelbart basert på respons

---

### Forventet resultat

- Klikk på bookmark-ikon markerer samtalen som "lagret" (rød farge)
- Klikk på check-ikon markerer samtalen som "gjennomgått" (grønn farge)
- Filtrering på "Lagrede" og "Gjennomgåtte" viser riktige samtaler
- Tags persisteres permanent i databasen

---

### Teknisk sammendrag

| Komponent | Endring |
|-----------|---------|
| Supabase | Ny tabell `conversation_tags` med RLS |
| Edge Function | Ny `toggle-conversation-tag` |
| ClientDashboard.tsx | Oppdater `toggleTag` og `fetchConversations` |

