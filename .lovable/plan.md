

## Plan: Fiks preloading-persistens og samtale-lasting

### Problem 1: Preloading forsvinner etter ~30 sekunder

**Årsak identifisert:**
- `maxCacheSize = 25` i `use-dialog-preloader.ts` (linje 13)
- `cleanupCache()` kjører etter hver preload og sletter gamle samtaler
- Når en samtale slettes fra cache, fjernes den også fra `preloadedConversations` Set
- Resultat: Etter 25+ samtaler er preloadet, begynner de første å forsvinne

**Løsning:**
Øk `maxCacheSize` og gjør den konfigurerbar basert på antall samtaler som vises.

### Problem 2: "Resultater per side" laster ikke flere samtaler

**Årsak identifisert:**
1. `ClientDashboard.tsx` linje 289-291 har **hardkodet** `take: 100`:
```typescript
const { data, error } = await supabase.functions.invoke('get-transcripts', {
  body: { take: 100, skip: 0 }  // Alltid 100!
});
```

2. `itemsPerPage` i `ConversationList` er **lokal state** som kun styrer paginering av allerede lastede samtaler
3. Ingen kobling mellom "Resultater per side" og API-kallet

**Løsning:**
Legg til en "Last flere samtaler" knapp + mulighet til å konfigurere initial lasting.

### Implementasjonsplan

#### Fil 1: `src/hooks/use-dialog-preloader.ts`

| Endring | Beskrivelse |
|---------|-------------|
| Øk `maxCacheSize` | Fra 25 til 100 som default |
| Fjern aggressiv cache-cleanup | La samtaler forbli i cache til komponent unmountes |

```typescript
// Linje 13-14: Øk default cache size
maxCacheSize = 100  // Var 25
```

#### Fil 2: `src/pages/ClientDashboard.tsx`

| Endring | Beskrivelse |
|---------|-------------|
| Legg til `totalLoaded` state | Tracker hvor mange samtaler som er lastet |
| Legg til `hasMore` state | Fra API respons |
| Ny funksjon `loadMoreConversations` | Laster neste batch |
| Pass props til ConversationList | Kommuniser lasting-status |

```typescript
// Nye states
const [totalLoaded, setTotalLoaded] = useState(0);
const [hasMore, setHasMore] = useState(false);
const [isLoadingMore, setIsLoadingMore] = useState(false);

// Modifiser fetchConversations
const { data, error } = await supabase.functions.invoke('get-transcripts', {
  body: { take: 100, skip: 0 }
});
setHasMore(data?.hasMore || false);
setTotalLoaded(transcripts.length);

// Ny funksjon
const loadMoreConversations = async () => {
  setIsLoadingMore(true);
  const { data, error } = await supabase.functions.invoke('get-transcripts', {
    body: { take: 100, skip: totalLoaded }
  });
  // Append til eksisterende conversations
  setConversations(prev => [...prev, ...newTranscripts]);
  setHasMore(data?.hasMore || false);
  setTotalLoaded(prev => prev + newTranscripts.length);
  setIsLoadingMore(false);
};
```

#### Fil 3: `src/components/conversations/ConversationList.tsx`

| Endring | Beskrivelse |
|---------|-------------|
| Legg til props for lasting | `hasMore`, `onLoadMore`, `isLoadingMore` |
| Legg til "Last flere" knapp | Under pagination |
| Vis total antall lastet | I header |

```typescript
// Nye props
hasMore: boolean;
onLoadMore: () => void;
isLoadingMore: boolean;
totalAvailable?: number;

// I UI - etter pagination
{hasMore && (
  <Button 
    onClick={onLoadMore} 
    disabled={isLoadingMore}
    className="w-full mt-2"
  >
    {isLoadingMore ? "Laster..." : "Last flere samtaler"}
  </Button>
)}
```

### Forenklet alternativ

For å holde det enkelt kan vi:
1. Bare øke `maxCacheSize` til 500
2. Endre hardkodet `take: 100` til `take: 500` for å laste flere fra start
3. Fjerne paginering og bare vise alle

### Anbefalt tilnærming (balanse mellom enkelhet og funksjonalitet)

1. **Øk cache size** til 200 (dobbelt av max visning)
2. **Legg til "Last flere" knapp** som henter neste 100 samtaler
3. **Vis totalt antall** i header: "Samtaler (100 av flere)"

### Forventet resultat

- Preloading-indikatorer forblir stabile for alle lastede samtaler
- Bruker kan laste flere samtaler ved behov
- Tydelig feedback om hvor mange samtaler som er lastet

