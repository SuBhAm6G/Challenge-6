import type {
  AirQualityForecast,
  AirQualityReading,
  AQIResult,
  IndiaAQICategory,
} from '../domain/air-quality/types.ts';
import type { AlertPreferences, CleanAirAlert } from '../domain/alerts/types.ts';
import { findBestOutdoorWindows, formatHourRange } from './activity-window.ts';

function getCategoryRank(category: IndiaAQICategory): number {
  switch (category) {
    case 'Good':
      return 1;
    case 'Satisfactory':
      return 2;
    case 'Moderate':
      return 3;
    case 'Poor':
      return 4;
    case 'Very Poor':
      return 5;
    case 'Severe':
      return 6;
  }
}

export interface AlertEvaluationInput {
  reading: AirQualityReading | null;
  aqiResult: AQIResult;
  previousCategory: IndiaAQICategory | null;
  forecast: AirQualityForecast | null;
  preferences: AlertPreferences;
  hasAirPurifier: boolean;
  nowIso?: string;
}

/**
 * Evaluates valid alert conditions without notification spam or fear-inducing language.
 * Deduplicates by stable dedupKey.
 */
export function evaluateCleanAirAlerts(input: AlertEvaluationInput): CleanAirAlert[] {
  if (!input.preferences.enabled || !input.reading) {
    return [];
  }

  const nowIso = input.nowIso ?? new Date().toISOString();
  const isSample = input.reading.sourceType === 'sample_data';
  const isForecast = input.reading.forecastVsObserved === 'forecast';
  const alerts: CleanAirAlert[] = [];
  const seenKeys = new Set<string>();

  const pushAlert = (alert: CleanAirAlert) => {
    if (seenKeys.has(alert.dedupKey)) return;
    seenKeys.add(alert.dedupKey);
    alerts.push(alert);
  };

  const currentCat = input.aqiResult.category;
  const thresholdRank = getCategoryRank(input.preferences.notifyOnCategoryAtOrAbove);

  if (currentCat && getCategoryRank(currentCat) >= thresholdRank) {
    const worsened =
      input.previousCategory !== null &&
      getCategoryRank(currentCat) > getCategoryRank(input.previousCategory);

    const dateBucket = nowIso.slice(0, 13);
    pushAlert({
      id: `alert-cat-${currentCat}-${dateBucket}`,
      dedupKey: `cat-${input.reading.city}-${currentCat}-${dateBucket}`,
      type: 'aqi_category_worsened',
      severity: getCategoryRank(currentCat) >= 5 ? 'high' : 'caution',
      title: isSample
        ? `Sample Alert: ${currentCat} air quality (${input.aqiResult.value} NAQI)`
        : `${input.reading.city}: ${currentCat} air quality (${input.aqiResult.value} NAQI)`,
      message: worsened
        ? `Conditions shifted from ${input.previousCategory} to ${currentCat} based on ${input.reading.sourceName}.`
        : `Current ${isForecast ? 'forecast' : 'reading'} is in the ${currentCat} range.`,
      nextStep:
        'Review My Routine to move vigorous outdoor activity indoors and check kitchen/source controls.',
      isForecastBased: isForecast,
      dataTimestamp: input.reading.observationTime,
      sourceName: input.reading.sourceName,
      createdAt: nowIso,
    });
  }

  if (
    input.preferences.notifyOnForecastShift &&
    input.forecast &&
    input.forecast.hourly.length > 4
  ) {
    const spikePoint = input.forecast.hourly.slice(0, 12).find((pt) => {
      return pt.estimatedIndiaNaqi !== null && pt.estimatedIndiaNaqi >= 301;
    });
    const bestWindow = findBestOutdoorWindows(input.forecast)[0];

    if (spikePoint) {
      const spikeHour = new Date(spikePoint.timestamp).getHours();
      const dateBucket = nowIso.slice(0, 10);
      pushAlert({
        id: `alert-spike-${dateBucket}-${spikeHour}`,
        dedupKey: `spike-${input.reading.city}-${dateBucket}-${spikeHour}`,
        type: 'forecast_spike_ahead',
        severity: 'caution',
        title: `Forecast indicates higher smog around ${formatHourRange(spikeHour, (spikeHour + 1) % 24)}`,
        message: `Model forecast projects NAQI near ${spikePoint.estimatedIndiaNaqi} (${spikePoint.estimatedCategory}).`,
        nextStep: bestWindow
          ? `Consider scheduling essential outdoor errands around ${formatHourRange(bestWindow.startHour, bestWindow.endHour)} instead.`
          : 'Batch outdoor errands earlier and close exterior doors during the peak hours.',
        isForecastBased: true,
        dataTimestamp: spikePoint.timestamp,
        sourceName: input.forecast.sourceName,
        createdAt: nowIso,
      });
    }
  }

  if (input.hasAirPurifier && input.preferences.lastFilterReminderIso) {
    const lastCheck = Date.parse(input.preferences.lastFilterReminderIso);
    const daysSince = Number.isNaN(lastCheck)
      ? 0
      : (Date.parse(nowIso) - lastCheck) / (1000 * 60 * 60 * 24);
    if (daysSince >= 14) {
      pushAlert({
        id: 'alert-purifier-maintenance',
        dedupKey: `purifier-maint-${nowIso.slice(0, 10)}`,
        type: 'indoor_maintenance_due',
        severity: 'info',
        title: 'Pre-filter dust check due (14+ days)',
        message:
          'Vacuuming or wiping your purifier outer pre-filter mesh keeps airflow steady during heavy winter dust.',
        nextStep: 'Inspect the outer mesh today and mark your check complete in Indoor Air.',
        isForecastBased: false,
        dataTimestamp: nowIso,
        sourceName: 'Local Household Schedule',
        createdAt: nowIso,
      });
    }
  }

  return alerts;
}
