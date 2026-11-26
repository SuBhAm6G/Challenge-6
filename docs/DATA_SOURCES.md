# Data Sources, Scientific Guardrails & Provenance

All authoritative sources used by Saansathi are centrally registered in `src/data/sources.ts` (`VALID_EVIDENCE_IDS` in `src/data/evidence-ids.ts`) and validated programmatically by `tests/unit/data/registries.test.ts`.

---

## 1. Authoritative Source Registry

| Source ID             | Organization                                      | Domain Purpose                                                                                                                                       | Mandatory Limitations & Disclosures                                                                                               |
| :-------------------- | :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `cpcb-naqi`           | **Central Pollution Control Board (CPCB), India** | Official India NAQI breakpoints, 6 categories (`Good`–`Severe`), sub-index interpolation, and 3-pollutant coverage rule                              | Official NAQI expects 24h/8h rolling station averages; hourly model forecasts (`1h`) are flagged as indicative estimates          |
| `open-meteo-aq`       | **Open-Meteo (CAMS / Copernicus)**                | Hourly atmospheric concentrations and forecasts for $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, and $\text{O}_3$ | `~11 km` atmospheric model grid; cannot capture hyperlocal street canyons, roadside diesel plumes, or leaf-burning spikes         |
| `who-aqg-2021`        | **World Health Organization (WHO)**               | Scientific pollutant exposure health context and guideline benchmarks                                                                                | Health benchmark reference only; never substituted for CPCB national AQI bands                                                    |
| `epa-air-cleaners`    | **US Environmental Protection Agency (EPA)**      | Portable HEPA/MERV filtration, CADR bedroom coverage estimation, and filter upkeep                                                                   | Adapted for Indian room volumes and power-conscious operation                                                                     |
| `epa-cleaner-room`    | **US Environmental Protection Agency (EPA)**      | Designated low-source cleaner-air room planning during severe particulate episodes                                                                   | Paired with mandatory Indian LPG/PNG/biomass combustion ventilation interlocks                                                    |
| `epa-ozone-caution`   | **US Environmental Protection Agency (EPA)**      | Prohibition of intentional ozone-generating air cleaners in occupied spaces                                                                          | Enforced as a hard exclusion rule across `indoor-engine.ts`, `safety.ts`, and `api/_guardrails.ts`                                |
| `india-ghg-transport` | **WRI India / India GHG Program / TERI & CEA**    | Passenger-km $\text{CO}_2\text{e}$ and tailpipe factors across 12 Indian transport modes                                                             | Average Indian fleet factors (not marginal or telemetry-specific); $\text{PM}_{2.5}$ / $\text{NO}_x$ left `null` where unreliable |

---

## 2. Mathematical & Scientific Invariants

1. **CPCB Linear Sub-Index Interpolation (`src/engines/aqi-subindex.ts`):**
   $$I_p = \frac{I_{\text{Hi}} - I_{\text{Lo}}}{C_{\text{Hi}} - C_{\text{Lo}}} (C_p - C_{\text{Lo}}) + I_{\text{Lo}}$$
   - Carbon monoxide (`co`) arrives from Open-Meteo in $\mu\text{g/m}^3$ and is normalized by dividing by $1000$ to obtain $\text{mg/m}^3$ (`src/providers/open-meteo-schema.ts`, `src/engines/aqi-subindex.ts`).
   - Readings above the `500` Severe breakpoint extrapolate transparently along the Severe slope and append an explicit `cappedAbove500` transparency notice.
2. **Minimum Coverage & Null-Preservation Rule:**
   - Missing or negative pollutant concentrations are strictly omitted—never coerced to `0`.
   - `interpretIndiaNAQI()` flags `minimumCoverageMet = false` whenever fewer than 3 pollutants are present or neither $\text{PM}_{2.5}$ nor $\text{PM}_{10}$ is measured.
3. **Zero Foreign-Scale Substitution:**
   - Open-Meteo's optional `european_aqi` field is stored strictly as secondary metadata (`reportedAqiStandard: 'EUROPEAN_EAQI'`) and is **never** displayed or substituted as India NAQI.
4. **Exposure vs. Emissions Independence (`src/engines/impact-engine.ts`):**
   - Personal inhaled exposure and household avoided $\text{CO}_2\text{e}$ are computed and displayed in separate engines/cards. Missing tailpipe particulate factors (e.g., grid electricity EVs, urban rail, mixed-fleet city buses) remain `null` (`"Omitted (varies)"` in UI).
