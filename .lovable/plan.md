

## Plan: Forenkle caching og UI

### Endring 1: Forenkle cache-strategi i `use-dialog-preloader.ts`

**Nåværende oppførsel:**
- `maxCacheSize = 200`
- `cleanupCache()` kjører etter hver preload
- Kompleks LRU-logikk med `accessedAt` timestamps

**Ny strategi:**
- Fjern `maxCacheSize` helt
- Fjern `cleanupCache()` funksjon
- Preload kun de første 25 samtalene (styres fra `ClientDashboard`)
- La cache vokse naturlig uten opprydding - samtaler forblir cached til unmount

| Fil | Endring |
|-----|---------|
| `src/hooks/use-dialog-preloader.ts` | Fjern `cleanupCache`, `maxCacheSize`, og `accessedAt` logikk |
| `src/pages/ClientDashboard.tsx` | Begrens preloading til 25 samtaler |

**Ny forenklet kode:**
```typescript
// preloadConversations - uten cleanup
const preloadConversations = useCallback((conversationIds: string[]) => {
  conversationIds.forEach(id => {
    if (!dialogCacheRef.current[id] && !pendingQueue.current.has(id)) {
      pendingQueue.current.add(id);
    }
  });
  
  if (!processingRef.current && pendingQueue.current.size > 0) {
    queueTimer.current = window.setTimeout(processQueue, 0);
  }
  // FJERNET: cleanupCache() - la cache være i fred
}, [processQueue]);
```

### Endring 2: Fjern "+" fra samtaler-header

| Fil | Linje | Endring |
|-----|-------|---------|
| `src/components/conversations/ConversationList.tsx` | 123 | Fjern `{hasMore ? "+" : ""}` |

**Fra:**
```tsx
Samtaler ({conversations.length}{hasMore ? "+" : ""})
```

**Til:**
```tsx
Samtaler ({conversations.length})
```

### Endring 3: Fjern "resultater per side" velger

Fjern hele Select-komponenten for itemsPerPage (linje 266-281) og lås verdien til 100.

**Fjernes helt:**
```tsx
<div className="flex items-center justify-between mb-2">
  <span className="text-sm text-gray-500">Resultater per side:</span>
  <Select value={String(itemsPerPage)} onValueChange={...}>
    ...
  </Select>
</div>
```

**itemsPerPage forblir fast på 100** (bare fjern Select, behold `useState(100)`).

### Sammendrag av endringer

| Fil | Endring |
|-----|---------|
| `src/hooks/use-dialog-preloader.ts` | Fjern `maxCacheSize`, `cleanupCache`, og `accessedAt` timestamp-logikk |
| `src/pages/ClientDashboard.tsx` | Begrens preloading til `.slice(0, 25)` |
| `src/components/conversations/ConversationList.tsx` | Fjern "+" fra header, fjern "resultater per side" Select |

### Forventet resultat

- De første 25 samtalene preloades og forblir i cache permanent
- Ingen komplisert opprydding eller LRU-logikk
- Enklere UI uten unødvendige valg
- Bedre ytelse med mindre overhead

