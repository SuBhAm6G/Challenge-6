import { INDOOR_ACTION_LIBRARY } from '../data/indoor-actions.ts';
import type { AirQualityForecast, AQIResult } from '../domain/air-quality/types.ts';
import type { IndoorAction, IndoorProfile, VentilationGuidance } from '../domain/indoor/types.ts';
import { findBestOutdoorWindows, formatHourRange } from './activity-window.ts';

/**
 * Evaluates ventilation trade-offs honestly: balances outdoor particle infiltration
 * against indoor combustion (gas/biomass) and CO buildup safety.
 */
export function evaluateVentilationGuidance(
  indoor: IndoorProfile,
  outdoorAqi: AQIResult,
  forecast: AirQualityForecast | null,
): VentilationGuidance {
  const aqi = outdoorAqi.value;
  const bestWindow = findBestOutdoorWindows(forecast)[0];
  const hasCombustionFuel =
    indoor.cookingFuel === 'lpg_gas' ||
    indoor.cookingFuel === 'piped_gas' ||
    indoor.cookingFuel === 'biomass' ||
    indoor.cookingFuel === 'mixed';

  const combustionSafetyWarning = hasCombustionFuel
    ? 'Safety rule: Never seal kitchens or rooms with gas stoves, gas geysers, or fuel heaters airtight. Keep an exhaust fan on or crack a window while flames are lit to prevent CO and NO₂ buildup.'
    : 'Ensure rooms remain comfortable and not overly stuffy; brief cross-ventilation during cleaner hours prevents stale indoor air.';

  if (aqi === null) {
    return {
      status: 'uncertain',
      headline: 'Outdoor air status unavailable — ventilate cautiously',
      explanation:
        'Without verified outdoor AQI, avoid leaving windows wide open during visible morning/evening haze, but always keep kitchen exhaust/airflow open during cooking.',
      combustionSafetyWarning,
    };
  }

  if (aqi <= 100) {
    return {
      status: 'ventilate_now',
      headline: 'Cross-ventilate rooms now while outdoor air is relatively clean',
      explanation: `Outdoor NAQI is ${aqi} (${outdoorAqi.category}). Opening opposite windows for 20–30 minutes helps flush indoor cooking fumes, CO₂, and lingering dust.`,
      combustionSafetyWarning,
    };
  }

  if (aqi <= 200) {
    return {
      status: 'selective_window',
      headline: 'Ventilate briefly after cooking; close facing busy roads during rush hour',
      explanation: `Outdoor NAQI is Moderate (${aqi}). Prioritize kitchen ventilation while cooking and brief midday cross-breezes rather than leaving traffic-facing windows open all day.`,
      combustionSafetyWarning,
      recommendedWindowText: bestWindow
        ? `Best forecast window: ${formatHourRange(bestWindow.startHour, bestWindow.endHour)} (est. NAQI ~${bestWindow.averageEstimatedAqi})`
        : undefined,
    };
  }

  return {
    status: 'close_and_minimize',
    headline: 'Limit outdoor air entry during peaks; ventilate briefly only in cleaner midday dips',
    explanation: `Outdoor NAQI is ${aqi} (${outdoorAqi.category}). Keeping exterior doors/windows latched reduces outdoor PM2.5 entry—provided indoor smoke sources (incense, coils, frying without exhaust) are kept off.`,
    combustionSafetyWarning,
    recommendedWindowText:
      bestWindow && indoor.canOpenWindowsSafely
        ? `If air feels stuffy, brief 10–15 min airing is best around ${formatHourRange(bestWindow.startHour, bestWindow.endHour)} (est. NAQI ~${bestWindow.averageEstimatedAqi}).`
        : undefined,
  };
}

/**
 * Selects and prioritizes safe, budget-aware indoor air actions.
 * Enforces safety invariants: never recommends ozone generators or unsafe sealing.
 */
export function generateIndoorActions(
  indoor: IndoorProfile,
  outdoorAqi: AQIResult,
): IndoorAction[] {
  const aqi = outdoorAqi.value ?? 250;
  const actions: IndoorAction[] = [];

  for (const template of INDOOR_ACTION_LIBRARY) {
    // Hard invariant: never emit anything promoting ozone generators
    if (template.title.toLowerCase().includes('use ozone')) {
      continue;
    }

    if (template.id === 'indoor-stop-burning') {
      const priority = indoor.burningSources.length > 0 || aqi > 200 ? 'high' : 'medium';
      actions.push({ ...template, priority });
      continue;
    }

    if (template.id === 'indoor-kitchen-exhaust') {
      const priority =
        !indoor.hasKitchenExhaustOrChimney || indoor.cookingFuel !== 'electric_induction'
          ? 'high'
          : 'medium';
      actions.push({ ...template, priority });
      continue;
    }

    if (template.id === 'indoor-hepa-placement') {
      if (indoor.hasAirPurifier) {
        const cadrNote =
          indoor.purifierCadrKnown && indoor.purifierCadrM3h
            ? ` Your configured unit (${indoor.purifierCadrM3h} m³/h CADR) suits roughly ${Math.round(indoor.purifierCadrM3h / 12)} m² at ~4–5 air changes/hour.`
            : ' Check your unit’s CADR against your bedroom floor area.';
        actions.push({
          ...template,
          whatToDo: template.whatToDo + cadrNote,
          priority: aqi > 200 ? 'high' : 'medium',
        });
      } else if (indoor.budget === 'moderate' || indoor.budget === 'flexible') {
        actions.push({
          ...template,
          title:
            'If buying an air cleaner, choose True HEPA sized by CADR—never an ionizer/ozone unit',
          priority: 'standard',
        });
      }
      continue;
    }

    if (template.id === 'indoor-cleaner-room') {
      actions.push({
        ...template,
        priority: aqi > 200 ? 'high' : 'standard',
      });
      continue;
    }

    if (template.id === 'indoor-door-sealing') {
      if (aqi > 150) {
        actions.push({ ...template, priority: 'high' });
      }
      continue;
    }

    actions.push(template);
  }

  const order = { high: 0, medium: 1, standard: 2 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]);
}
