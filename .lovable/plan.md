

## Plan for å fikse hvit skjerm ved valg av samtale i samtaleloggen

### Problemanalyse

Etter grundig analyse av koden har jeg identifisert **tre samvirkende problemer** som fører til hvit skjerm:

#### Problem 1: Race condition i dialog-lasting

Når bruker klikker på en samtale skjer følgende:

1. `handleSelectConversation` kalles og sjekker om samtalen er cachet via `getCachedDialog`
2. Hvis cachet: setter `dialog` og `isLoadingDialog(false)`
3. Deretter trigger `useEffect` for `fetchDialog` (linje 324-373)
4. `fetchDialog` kaller også `getCachedDialog` - men hvis cachen finnes, returnerer den tidlig uten å gjøre noe

**Problemet**: `getCachedDialog` oppdaterer state internt (linje 193-201 i use-dialog-preloader.ts), som kan trigge re-renders og race conditions mellom state-oppdateringer.

#### Problem 2: Tom dialog vises som hvit skjerm

I `ConversationDialog.tsx` (linje 387-394):
```typescript
} : (
  <div className="space-y-4">
    {filteredDialog.map((message, index) => (
      <div key={index}>{renderMessage(message, index)}</div>
    ))}
  </div>
)
```

Hvis `dialog` er tom (`[]`) mens `isLoading` er `false` og `selectedConversation` finnes, vises bare en tom div - altså hvit skjerm uten noen indikasjon til brukeren.

#### Problem 3: Manglende feilhåndtering for preload-abort

Når `preloadConversations` kalles (linje 161-186 i use-dialog-preloader.ts), aborteres **alle** pågående forespørsler inkludert den som kanskje laster samtalen brukeren nettopp valgte. Dette kan føre til at dialogen aldri lastes ferdig.

### Løsningsplan

#### Trinn 1: Forbedre `handleSelectConversation` i ClientDashboard.tsx

Endre logikken til å være mer robust:

```typescript
const handleSelectConversation = useCallback((conversationId: string) => {
  setSelectedConversation(conversationId);
  
  // Sjekk cache først
  const cachedDialog = getCachedDialog(conversationId);
  if (cachedDialog && cachedDialog.length > 0) {
    setDialog(cachedDialog);
    setIsLoadingDialog(false);
  } else {
    // Sett loading state - dialog vil bli lastet i useEffect
    setDialog([]);
    setIsLoadingDialog(true);
  }
  
  // Resten av preload-logikken...
}, [...]);
```

#### Trinn 2: Fikse `fetchDialog` useEffect

Endre sjekken for å håndtere edge cases:

```typescript
useEffect(() => {
  const fetchDialog = async () => {
    if (!selectedConversation) return;
    
    const organizationId = getEffectiveOrgId();
    if (!organizationId) return;
    
    // Sjekk om vi allerede har dialog data lastet
    // Dette forhindrer dobbel-lasting, men sørger for at vi faktisk har data
    const cachedDialog = getCachedDialog(selectedConversation);
    if (cachedDialog && cachedDialog.length > 0) {
      // Sett dialog eksplisitt for å sikre at vi har dataen
      setDialog(cachedDialog);
      setIsLoadingDialog(false);
      return;
    }
    
    // Sett loading state eksplisitt
    setIsLoadingDialog(true);
    
    try {
      // ... fetch logikk ...
    } catch (error) {
      console.error('Error fetching dialog:', error);
      toast.error('Kunne ikke laste inn samtale');
      setDialog([]); // Tøm dialog ved feil
    } finally {
      setIsLoadingDialog(false);
    }
  };

  fetchDialog();
}, [selectedConversation, getEffectiveOrgId, getCachedDialog, preloadConversations]);
```

#### Trinn 3: Legg til tom-tilstand i ConversationDialog.tsx

Vis en melding når dialogen er tom:

```typescript
{isLoading ? (
  <div className="h-full flex flex-col items-center justify-center absolute inset-0">
    <Loader size="lg" />
    <p className="mt-4 text-gray-500 text-sm">Laster samtale...</p>
  </div>
) : !selectedConversation ? (
  <div className="h-full flex items-center justify-center text-gray-500">
    Velg en samtale for å se meldinger
  </div>
) : filteredDialog.length === 0 ? (
  <div className="h-full flex items-center justify-center text-gray-500">
    Ingen meldinger i denne samtalen
  </div>
) : (
  <div className="space-y-4">
    {filteredDialog.map((message, index) => (
      <div key={index}>{renderMessage(message, index)}</div>
    ))}
  </div>
)}
```

#### Trinn 4: Forbedre preload-logikk for å ikke avbryte aktiv samtale-lasting

I `preloadConversations` bør vi ikke avbryte forespørsler for samtalen som brukeren aktivt ser på. Dette krever å holde styr på hvilken samtale som er "aktiv".

### Filer som må endres

| Fil | Endring |
|-----|---------|
| `src/pages/ClientDashboard.tsx` | Forbedre `handleSelectConversation` og `fetchDialog` useEffect |
| `src/components/conversations/ConversationDialog.tsx` | Legg til håndtering av tom dialog |
| `src/hooks/use-dialog-preloader.ts` | Valgfritt: Forbedre for å ikke avbryte aktiv samtale |

### Testplan

1. Logg inn som hanna@birkebeiner.no
2. Gå til Birken-botten dashboard
3. Naviger til Samtaler-fanen
4. Klikk på en samtale som IKKE har "Lastet" badge
5. Verifiser at loading-spinneren vises
6. Verifiser at samtale-innholdet lastes inn
7. Klikk på en samtale som HAR "Lastet" badge
8. Verifiser at innholdet vises umiddelbart
9. Test rask veksling mellom flere samtaler

