

## Plan: Filtrer ut debug-traces fra samtalevisning

### Problemet

Samtalevisningen viser unodvendig system-informasjon:
- "1 variable changed"
- "successfully executed"  
- "resolved None (legacy nlu)"
- "command jump matched - navigating to next path"

Dette er fordi Voiceflow trace-objekter har ulike `data.type`-verdier:

| data.type | Beskrivelse | Skal vises? |
|-----------|-------------|-------------|
| `speak` | Bot snakker til bruker | Ja |
| `text` | Tekstmelding til bruker | Ja |
| `debug` | Intern debug-info | Nei |
| `block` | Blokk-navigasjon | Nei |
| `flow` | Flow-navigasjon | Nei |
| `path` | Path-navigasjon | Nei |
| `no-reply` | Ingen respons | Nei |

Problemet er at debug-traces har `data.payload.message` med debug-teksten, og `extractStringValue()` fanger dette opp som en gyldig melding.

### Losning

Oppdater `supabase/functions/get-transcript/index.ts`:

1. **Sjekk `data.type` for** i `extractStringValue()` - kun returnere melding hvis typen er `speak` eller `text`
2. **Eksplisitt blokkere** debug, block, flow, path, no-reply traces

```text
Ny logikk i extractStringValue():

function extractStringValue(data: any): string | null {
  // Kun tillat speak/text typer fra Voiceflow
  const allowedTypes = ['speak', 'text'];
  const blockedTypes = ['debug', 'block', 'flow', 'path', 'no-reply', 'visual', 'carousel', 'card'];
  
  if (data?.type && blockedTypes.includes(data.type)) {
    return null; // Blokker eksplisitt
  }
  
  if (data?.type && allowedTypes.includes(data.type)) {
    return data.payload?.message || null;
  }
  
  // Fallback for andre strukturer
  ...
}
```

### Fil som endres

| Fil | Endring |
|-----|---------|
| `supabase/functions/get-transcript/index.ts` | Legg til whitelist/blacklist for trace-typer, kun inkluder `speak`/`text` meldinger |

### Teknisk implementasjon

```typescript
function extractStringValue(data: any): string | null {
  if (typeof data === 'string') return data;
  if (data === null || data === undefined) return null;
  
  // BLOCKED trace types - never display these
  const blockedTypes = ['debug', 'block', 'flow', 'path', 'no-reply', 'visual', 'carousel', 'card', 'choice', 'end'];
  if (data.type && blockedTypes.includes(data.type)) {
    return null;
  }
  
  // ALLOWED trace types - only these should show messages
  const allowedTypes = ['speak', 'text'];
  if (data.type && allowedTypes.includes(data.type)) {
    if (typeof data.payload?.message === 'string') {
      return data.payload.message;
    }
    return null;
  }
  
  // If no type specified, try direct message properties (rare case)
  if (typeof data.message === 'string') return data.message;
  if (typeof data.text === 'string') return data.text;
  
  return null;
}
```

### Forventet resultat

- Kun faktiske bot-meldinger vises (type `speak`/`text`)
- Debug-info som "1 variable changed" filtreres bort
- System-navigasjon som "command jump matched" filtreres bort
- Bruker-input vises fortsatt korrekt

