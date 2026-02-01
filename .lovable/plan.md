

## Plan: Fiks tooltip og optimaliser statistikklasting

### Del 1: Fiks "Verdi:" som vises to ganger

**Problem:**
I TimeSeriesChart.tsx brukes en formatter som returnerer `Verdi: {value}`, men ChartTooltipContent viser allerede verdien automatisk, noe som gir duplikat.

**Løsning:**
Fjerne formatter-propen og bruke en enkel custom tooltip i stedet som bare viser datoen og verdien en gang.

| Fil | Endring |
|-----|---------|
| TimeSeriesChart.tsx | Erstatte ChartTooltip med en enkel custom tooltip-komponent som kun viser dato og verdi |

---

### Del 2: Optimaliser statistikklasting

**Nåværende problem:**
Edge funksjonen `get-voiceflow-analytics` gjør ett API-kall til Voiceflow FOR HVER DAG i perioden:
- 7 dager = 14 API-kall (7 for interaksjoner + 7 for sesjoner)
- 30 dager = 60 API-kall
- 90 dager = 180 API-kall

Dette er årsaken til treg lasting.

**Løsningsalternativer:**

| Alternativ | Beskrivelse | Fordel | Ulempe |
|------------|-------------|--------|--------|
| A: Parallelle API-kall | Kjøre alle daglige API-kall samtidig i stedet for sekvensielt | Mye raskere (alle kall samtidig) | Kan ramme rate limits |
| B: Batch med retry | Kjøre i batches på 5-10 kall med kort pause mellom | God balanse | Fortsatt noe ventetid |
| C: Caching i database | Lagre Voiceflow-data i Supabase og kun hente nye data | Superrask etter første gang | Mer kompleks å implementere |

**Anbefalt tilnærming: Alternativ A med fallback til B**
Bruke `Promise.all()` for å kjøre alle daglige Voiceflow API-kall parallelt i stedet for sekvensielt. Dette vil dramatisk redusere lastetiden fra ca. 30+ sekunder til under 5 sekunder for en 30-dagers periode.

---

### Teknisk implementasjon

**1. TimeSeriesChart.tsx - Fiks tooltip**
```tsx
// Erstatt den nåværende ChartTooltip med en enkel custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-sm">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};
```

**2. get-voiceflow-analytics/index.ts - Parallelle kall**
```typescript
// I stedet for:
while (currentDate <= end) {
  // sekvensielt kall per dag
}

// Bruk:
const datePromises = daysToFetch.map(date => 
  fetch('voiceflow-api', options)
);
const results = await Promise.all(datePromises);
```

---

### Forventet forbedring

| Periode | Før (sekvensiell) | Etter (parallell) |
|---------|-------------------|-------------------|
| 7 dager | ~7-10 sek | ~1-2 sek |
| 30 dager | ~30-45 sek | ~2-4 sek |
| 90 dager | ~90-120 sek | ~3-6 sek |

---

### Filer som endres

1. `src/components/statistics/TimeSeriesChart.tsx` - Custom tooltip uten duplikat
2. `supabase/functions/get-voiceflow-analytics/index.ts` - Parallelle API-kall

