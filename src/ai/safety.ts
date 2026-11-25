import { VALID_SOURCE_IDS } from '../data/sources.ts';
import type { AiChatResponse, AiContextPackage } from './schemas.ts';

const PROHIBITED_PATTERNS: readonly { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b(use|buy|try|run)\s+(an?\s+)?ozone\s+generator\b/i,
    reason:
      'Removed unsafe ozone-generator suggestion (US EPA prohibits occupied ozone air cleaners).',
  },
  {
    pattern:
      /\b(stop|discontinue|change|increase|decrease)\s+(your\s+)?(inhaler|medication|steroid|medicine|dose)\b/i,
    reason: 'Removed medication modification advice; consult a clinician for medical decisions.',
  },
  {
    pattern: /\bseal\s+(the\s+)?kitchen\b.*\b(gas|stove|burner|heater)\b/i,
    reason: 'Removed unsafe instruction to seal a room containing active fuel combustion.',
  },
  {
    pattern: /\breduces?\s+(city|citywide)\s+aqi\s+by\s+\d+/i,
    reason: 'Removed unsupported claim of measurable citywide AQI reduction from one household.',
  },
];

const URGENT_SYMPTOM_PATTERN =
  /\b(chest pain|fainting|cannot breathe|can't breathe|severe breathlessness|blue lips|wheezing badly)\b/i;

export function hasUrgentMedicalSymptoms(userMessage: string): boolean {
  return URGENT_SYMPTOM_PATTERN.test(userMessage);
}

/**
 * Validates AI responses against deterministic safety boundaries and registry citations.
 */
export function sanitizeAiResponse(
  raw: AiChatResponse,
  context: AiContextPackage,
): { sanitized: AiChatResponse; safetyWarnings: string[] } {
  const safetyWarnings: string[] = [];

  const filterText = (text: string): string => {
    let clean = text;
    for (const rule of PROHIBITED_PATTERNS) {
      if (rule.pattern.test(clean)) {
        safetyWarnings.push(rule.reason);
        clean = clean.replace(rule.pattern, '[Removed by safety guardrail]');
      }
    }
    return clean;
  };

  const validRecs = raw.recommendations
    .filter((rec) => {
      // Prevent recommending vigorous outdoor cycling/running when AQI > 250
      if (
        context.aqiValue !== null &&
        context.aqiValue > 250 &&
        /\b(cycle|cycling|jog|run|marathon|outdoor sprint)\b/i.test(rec.action) &&
        !/\b(avoid|skip|replace|indoor|instead)\b/i.test(rec.action)
      ) {
        safetyWarnings.push(
          `Blocked outdoor vigorous activity suggestion ("${rec.action}") during ${context.aqiCategory} AQI.`,
        );
        return false;
      }
      return true;
    })
    .map((rec) => ({
      ...rec,
      action: filterText(rec.action),
      reason: filterText(rec.reason),
      exposureConsideration: filterText(rec.exposureConsideration),
      environmentalConsideration: filterText(rec.environmentalConsideration),
      evidenceIds: rec.evidenceIds.filter((id) => VALID_SOURCE_IDS.has(id)),
      safetyNote: rec.safetyNote ? filterText(rec.safetyNote) : undefined,
    }));

  const sourceIdsUsed = raw.sourceIdsUsed.filter((id) => VALID_SOURCE_IDS.has(id));

  return {
    sanitized: {
      ...raw,
      summary: filterText(raw.summary),
      recommendations: validRecs,
      sourceIdsUsed: sourceIdsUsed.length > 0 ? sourceIdsUsed : ['cpcb-naqi'],
      disclaimer:
        'Environmental planning guidance only—not medical advice. Verified readings and emission factors come from Saansathi’s deterministic engine.',
    },
    safetyWarnings,
  };
}
