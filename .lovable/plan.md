

## Plan for å forenkle og fikse samtale-lasting

### Rotårsak identifisert

Etter analyse av nettverkslogger og kode har jeg funnet **hovedproblemet**:

**`getCachedDialog` oppdaterer state hver gang den kalles**, noe som skaper en ustabil callback som trigger useEffect-loopen på nytt:

```typescript
// I getCachedDialog - oppdaterer state HVER gang:
setDialogCache(prev => ({
  ...prev,
  [conversationId]: updatedDialog  // <-- Trigger re-render
}));
```

Dette, kombinert med at `getCachedDialog` er i useEffect-dependencies, skaper en uendelig render-loop hvor:
1. useEffect kjører -> kaller `getCachedDialog`
2. `getCachedDialog` oppdaterer state -> skaper ny callback-referanse
3. Ny callback-referanse -> trigger useEffect igjen
4. Repeat...

I tillegg er hele cache-systemet unødvendig komplisert for det som egentlig er en enkel operasjon: **hent samtale fra API og vis den**.

### Foreslått løsning: Forenkle hele flyten

I stedet for å fikse det komplekse cache-systemet, bør vi forenkle til en robust og forutsigbar flyt:

**Ny flyt:**
1. Bruker klikker på samtale
2. Sett loading state
3. Hent samtale fra API (alltid)
4. Vis samtale eller feilmelding
5. Ferdig

**Valgfri optimalisering:** Behold enkel preloading for synlige samtaler, men uten kompleks LRU-cache eller timestamp-oppdatering.

### Tekniske endringer

#### Fil 1: `src/hooks/use-dialog-preloader.ts`

**Endring:** Fjern state-oppdatering i `getCachedDialog` - den skal bare lese cache, ikke skrive til den.

```typescript
const getCachedDialog = useCallback((conversationId: string) => {
  // Bare returner data fra cache, IKKE oppdater state
  return dialogCache[conversationId] || undefined;
}, [dialogCache]);
```

#### Fil 2: `src/pages/ClientDashboard.tsx`

**Endring 1:** Forenkle `handleSelectConversation`:
```typescript
const handleSelectConversation = useCallback((conversationId: string) => {
  setSelectedConversation(conversationId);
  
  // Sjekk cache - aksepter også tom array som gyldig cache
  const cachedDialog = getCachedDialog(conversationId);
  if (cachedDialog !== undefined) {
    setDialog(cachedDialog);
    setIsLoadingDialog(false);
  } else {
    setDialog([]);
    setIsLoadingDialog(true);
  }
  // ... rest of preloading logic
}, [...]);
```

**Endring 2:** Fjern `getCachedDialog` fra useEffect dependencies og forenkle logikken:
```typescript
useEffect(() => {
  const fetchDialog = async () => {
    if (!selectedConversation) return;
    
    const organizationId = getEffectiveOrgId();
    if (!organizationId) return;
    
    // Sjekk om samtalen allerede er cachet (inkludert tom array)
    if (isConversationPreloaded(selectedConversation)) {
      const cached = getCachedDialog(selectedConversation);
      if (cached !== undefined) {
        setDialog(cached);
        setIsLoadingDialog(false);
        return;
      }
    }
    
    // Hent fra API
    setIsLoadingDialog(true);
    
    try {
      // ... fetch logic ...
      const data = await response.json();
      setDialog(data);
    } catch (error) {
      console.error('Error fetching dialog:', error);
      toast.error('Kunne ikke laste inn samtale');
      setDialog([]);
    } finally {
      setIsLoadingDialog(false);
    }
  };

  fetchDialog();
}, [selectedConversation, getEffectiveOrgId]);  // Fjernet getCachedDialog og preloadConversations
```

### Filer som endres

| Fil | Endring |
|-----|---------|
| `src/hooks/use-dialog-preloader.ts` | Fjern state-oppdatering i `getCachedDialog` |
| `src/pages/ClientDashboard.tsx` | Forenkle cache-sjekk og fjern ustabile dependencies |

### Testplan

1. Logg inn som hanna@birkebeiner.no
2. Gå til Birken-botten og Samtaler-fanen
3. Klikk på en samtale
4. Verifiser at loading-spinner vises kort
5. Verifiser at samtale-innhold vises (eller "Ingen meldinger" for tomme samtaler)
6. Test rask veksling mellom flere samtaler
7. Verifiser ingen uendelig loading eller hvit skjerm

