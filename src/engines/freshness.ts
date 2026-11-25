import type { AirQualityReading, FreshnessStatus } from '../domain/air-quality/types.ts';

export interface FreshnessEvaluation {
  status: FreshnessStatus;
  label: string;
  detail: string;
  ageMinutes: number | null;
  isStaleOrUncertain: boolean;
}

export function evaluateReadingFreshness(
  reading: AirQualityReading | null,
  nowMs: number = Date.now(),
): FreshnessEvaluation {
  if (!reading) {
    return {
      status: 'unavailable',
      label: 'Data unavailable',
      detail: 'No verified reading or saved reading is currently available for this location.',
      ageMinutes: null,
      isStaleOrUncertain: true,
    };
  }

  if (reading.sourceType === 'sample_data') {
    return {
      status: 'unavailable',
      label: 'Sample Demo Data',
      detail: 'Synthetic demonstration scenario — not a live measurement.',
      ageMinutes: 0,
      isStaleOrUncertain: true,
    };
  }

  const refTime = Date.parse(reading.retrievalTime || reading.observationTime);
  if (Number.isNaN(refTime)) {
    return {
      status: 'stale',
      label: 'Timestamp unclear',
      detail: 'Stored reading is missing a valid timestamp.',
      ageMinutes: null,
      isStaleOrUncertain: true,
    };
  }

  const ageMinutes = Math.max(0, Math.round((nowMs - refTime) / 60000));

  if (reading.forecastVsObserved === 'forecast') {
    if (ageMinutes <= 90) {
      return {
        status: 'forecast',
        label: 'Model Forecast (Recent)',
        detail: `Retrieved ${ageMinutes} min ago from ~11 km grid model.`,
        ageMinutes,
        isStaleOrUncertain: false,
      };
    }
    if (ageMinutes <= 360) {
      return {
        status: 'delayed',
        label: 'Cached Forecast (Delayed)',
        detail: `Retrieved ${Math.round(ageMinutes / 60)}h ago; refresh when online.`,
        ageMinutes,
        isStaleOrUncertain: true,
      };
    }
    return {
      status: 'last_known',
      label: 'Last Known Forecast (Stale)',
      detail: `Saved ${Math.round(ageMinutes / 60)}h ago; treat as historical context only.`,
      ageMinutes,
      isStaleOrUncertain: true,
    };
  }

  if (ageMinutes <= 60) {
    return {
      status: 'recent',
      label: 'Updated recently',
      detail: `Retrieved ${ageMinutes} min ago.`,
      ageMinutes,
      isStaleOrUncertain: false,
    };
  }
  if (ageMinutes <= 180) {
    return {
      status: 'delayed',
      label: 'Delayed',
      detail: `Last updated ${Math.round(ageMinutes / 60)}h ago.`,
      ageMinutes,
      isStaleOrUncertain: true,
    };
  }
  if (ageMinutes <= 1440) {
    return {
      status: 'last_known',
      label: 'Last known reading',
      detail: `Saved ${Math.round(ageMinutes / 60)}h ago.`,
      ageMinutes,
      isStaleOrUncertain: true,
    };
  }

  return {
    status: 'stale',
    label: 'Stale saved reading',
    detail: `Saved ${Math.round(ageMinutes / 1440)} day(s) ago; refresh needed.`,
    ageMinutes,
    isStaleOrUncertain: true,
  };
}
