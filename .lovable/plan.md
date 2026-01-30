

## Plan for å fikse "Cannot read properties of null (reading 'signal')" i dialog-preloader

### Problem
Når brukeren velger en samtale i samtale-loggen for "Birken-botten", vises ingenting fordi dialog-preloaderen krasjer med feilen `TypeError: Cannot read properties of null (reading 'signal')`.

### Rotarsak
Det er en race condition i `use-dialog-preloader.ts`:

1. Når `preloadConversations()` kalles, aborteres eventuelle pågående forespørsler og `abortControllerRef.current` settes til `null`
2. Deretter kalles `processQueue()` som oppretter en ny `AbortController` 
3. Men hvis `preloadConversations()` kalles igjen før fetch-kallet starter (f.eks. når bruker klikker på en samtale), nullstilles controlleren igjen
4. Når koden prøver å bruke `abortControllerRef.current.signal`, er verdien `null`

### Losning

**Fil: `src/hooks/use-dialog-preloader.ts`**

1. **Opprette AbortController lokalt i processQueue**
   - I stedet for å bruke en delt ref som kan nullstilles eksternt, oppretter vi en lokal AbortController for hver forespørsel
   - Ref-en brukes kun til å holde styr på den aktive controlleren for abort-formål

2. **Legge til null-sjekk for signal**
   - Før vi bruker `signal`, sjekker vi at controlleren fortsatt eksisterer
   - Hvis den er null, avbryter vi prosessen tidlig

3. **Forbedre cleanup-logikk**
   - Sørge for at `processingRef` settes til false ved alle exit-punkter
   - Legge til bedre feilhåndtering

### Tekniske endringer

```typescript
// I processQueue funksjonen - endre rekkefølgen og legge til null-sjekk:

const processQueue = useCallback(async () => {
  if (!organizationId || processingRef.current || pendingQueue.current.size === 0) return;
  
  processingRef.current = true;
  
  // Opprett AbortController FØRST, før noe asynkront skjer
  const localAbortController = new AbortController();
  abortControllerRef.current = localAbortController;
  
  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    if (timeSinceLastRequest < 300) {
      await new Promise(resolve => setTimeout(resolve, 300 - timeSinceLastRequest));
    }
    
    // Sjekk om vi ble avbrutt under ventetiden
    if (localAbortController.signal.aborted) {
      return;
    }
    
    const nextId = pendingQueue.current.values().next().value;
    if (!nextId) {
      return;
    }
    pendingQueue.current.delete(nextId);
    
    // ... resten av logikken, bruk localAbortController.signal i fetch
    
    const response = await fetch(
      `https://api.voiceflow.com/v2/transcripts/${org.voiceflow_project_id}/${nextId}`,
      {
        headers: { /* ... */ },
        signal: localAbortController.signal  // Bruk lokal referanse
      }
    );
    
    // ...
  } catch (error) {
    // Håndter abort
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Preloading request aborted');
    } else {
      console.error('Error preloading dialog:', error);
    }
  } finally {
    processingRef.current = false;
    // ... resten av finally-logikken
  }
}, [organizationId, dialogCache]);
```

### Testplan
1. Logg inn som hanna@birkebeiner.no
2. Ga til Birken-botten dashboard
3. Naviger til Samtaler-fanen
4. Klikk på en hvilken som helst samtale
5. Verifiser at samtale-innholdet lastes inn korrekt uten feilmeldinger i konsollen

