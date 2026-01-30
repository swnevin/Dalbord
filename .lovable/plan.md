
## Plan: Forenkling og robustifisering av samtale-lasting

### Problemanalyse

Jeg har identifisert flere problemer med nåværende preloading-system:

**Problem 1: Race conditions mellom cache og direkte henting**
- `handleSelectConversation` sjekker `getCachedDialog()` 
- Samtidig kjører `useEffect` på linje 322-358 som **også** henter samtalen
- Begge skriver til `setDialog()`, som kan føre til konflikt

**Problem 2: Cache-invalidering**
- `dialogCache` i `useDialogPreloader` bruker `useState`
- `getCachedDialog` har `[dialogCache]` som dependency i `useCallback`
- Men `processQueue` har også `[dialogCache]` som dependency
- Dette kan føre til stale closures hvor gammel cache-referanse brukes

**Problem 3: Abort-logikk kan forstyrre lasting**
- `preloadConversations` kaller `abortControllerRef.current.abort()` hver gang den kalles
- Hvis bruker klikker på en samtale som allerede er i køen, blir den aborted
- Ny henting starter ikke fordi systemet tror den allerede er cachet

**Problem 4: Evig loop når samtale ikke finnes i cache**
- `fetchDialog` useEffect avhenger av `[selectedConversation, isConversationPreloaded, dialogCache]`
- Når `dialogCache` oppdateres av preloaderen, kjører `fetchDialog` igjen
- Hvis samtalen ikke er preloaded, starter ny henting
- Ny henting oppdaterer dialog-state, men ikke cache...

### Foreslått løsning: Forenkling

Fjern kompleksiteten ved å:
1. Ha **én kilde til sannhet** for samtale-lasting
2. Forenkle preloading til kun å være en optimalisering, ikke kritisk path
3. Unngå race conditions

### Implementasjonsplan

**Fil: `src/pages/ClientDashboard.tsx`**

1. **Fjern dobbel-lastingslogikk**
   - `handleSelectConversation` skal sette loading state og sjekke cache
   - `useEffect` for `fetchDialog` skal **kun** laste hvis samtalen ikke er cachet

2. **Fikse dependency-problemet**
   - Fjern `dialogCache` fra useEffect dependencies
   - Bruk `isConversationPreloaded` + `getCachedDialog` kun i handleSelectConversation

```text
Ny handleSelectConversation:
1. Sett selectedConversation
2. Sjekk cache - hvis funnet, bruk den og sett isLoadingDialog = false
3. Hvis ikke cachet, sett isLoadingDialog = true (useEffect tar over)
4. Start preloading av andre samtaler (med delay)

Ny fetchDialog useEffect:
1. Avhenger KUN av selectedConversation
2. Sjekk om samtalen allerede er lastet (dialog.length > 0 og ikke loading)
3. Hvis ikke, hent fra API
```

**Fil: `src/hooks/use-dialog-preloader.ts`**

3. **Robust queue-håndtering**
   - Ikke abort pågående requests når nye legges til køen
   - Legg til retry-logikk ved feil
   - Bruk `useRef` for cache for å unngå stale closures

4. **Forenklet preload-funksjon**
   - Fjern abort av pågående requests (la dem fullføre)
   - Kun abort ved unmount

### Kodeendringer

| Fil | Endring |
|-----|---------|
| `src/pages/ClientDashboard.tsx` | Fjern `dialogCache` fra useEffect dependencies, forenkle lastingslogikk |
| `src/hooks/use-dialog-preloader.ts` | Fjern unødvendig abort-logikk, bruk refs for stabil cache-referanse |

### Teknisk implementasjon

```typescript
// ClientDashboard.tsx - Ny fetchDialog useEffect
useEffect(() => {
  const fetchDialog = async () => {
    if (!selectedConversation) return;
    
    // Hvis vi allerede laster, ikke start ny henting
    if (isLoadingDialog) return;
    
    // Hvis vi har data (ikke tom array), ikke hent på nytt
    if (dialog.length > 0) return;
    
    setIsLoadingDialog(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-transcript', {
        body: { transcriptId: selectedConversation }
      });

      if (error) throw error;
      setDialog(data?.history || []);
    } catch (error) {
      console.error('Error fetching dialog:', error);
      toast.error('Kunne ikke laste inn samtale');
      setDialog([]);
    } finally {
      setIsLoadingDialog(false);
    }
  };

  fetchDialog();
}, [selectedConversation]); // Kun selectedConversation som dependency!
```

```typescript
// use-dialog-preloader.ts - Forenklet preloadConversations
const preloadConversations = useCallback((conversationIds: string[]) => {
  // IKKE abort pågående requests - la dem fullføre
  
  // Legg til køen kun de som ikke er cachet
  conversationIds.forEach(id => {
    if (!dialogCacheRef.current[id] && !pendingQueue.current.has(id)) {
      pendingQueue.current.add(id);
    }
  });
  
  // Start processing hvis ikke allerede i gang
  if (!processingRef.current && pendingQueue.current.size > 0) {
    processQueue();
  }
}, [processQueue]);
```

### Forventet resultat

- Preloading-indikatorer forblir stabile
- Ingen evig loop ved åpning av samtaler
- Cache brukes korrekt når tilgjengelig
- Fallback til API-henting fungerer pålitelig
