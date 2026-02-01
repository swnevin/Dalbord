

## Plan: Renere og mer moderne linjediagrammer

### Endringer som skal gjøres

**Visuell forbedring av alle tre linjediagram-komponenter:**

| Endring | Beskrivelse |
|---------|-------------|
| Gradient/fade under linjen | Legger til et `<defs>` element med `<linearGradient>` og bruker `<Area>` komponent fra Recharts for en subtil fade fra linjefargen ned til transparent |
| Fjerne prikker som standard | Setter `dot={false}` på alle `<Line>` komponenter slik at prikkene skjules |
| Vise prikk ved hover | Beholder `activeDot={{ r: 6 }}` slik at prikken vises når man hovrer over et punkt |
| Mykere kurver | Beholder `type="monotone"` for jevne kurver |

---

### Filer som endres

**1. `src/components/statistics/TimeSeriesChart.tsx`**
- Importere `Area` og `defs` fra Recharts
- Legge til gradient-definisjon
- Legge til `<Area>` under linjen med gradient-fill
- Sette `dot={false}` på `<Line>`

**2. `src/components/statistics/FeedbackChart.tsx`**
- Samme endringer for alle tre linjer (happy, neutral, sad)
- Tre separate gradienter med matchende farger

**3. `src/components/statistics/SuccessVsFallbackChart.tsx`**
- Samme endringer for begge linjer (successful, fallback)
- To separate gradienter

---

### Teknisk eksempel

```tsx
// Gradient-definisjon
<defs>
  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="#28483F" stopOpacity={0.3}/>
    <stop offset="95%" stopColor="#28483F" stopOpacity={0}/>
  </linearGradient>
</defs>

// Area med gradient-fill (under linjen)
<Area
  type="monotone"
  dataKey="value"
  stroke="none"
  fill="url(#colorValue)"
/>

// Linje uten prikker (vises kun ved hover)
<Line
  type="monotone"
  dataKey="value"
  stroke="#28483F"
  strokeWidth={2}
  dot={false}
  activeDot={{ r: 6 }}
/>
```

---

### Resultat

- Cleanere utseende uten forstyrrende prikker
- Profesjonell gradient-fade under linjene
- Interaktivitet beholdes - prikk vises ved hover
- Konsistent stil på tvers av alle grafer

