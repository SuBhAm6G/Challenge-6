import type { RoutineRecommendation } from '../domain/routine/types.ts';
import {
  AiChatResponseSchema,
  type AiChatRequest,
  type AiChatResponse,
  type AiContextPackage,
} from './schemas.ts';
import { hasUrgentMedicalSymptoms, sanitizeAiResponse } from './safety.ts';

export interface AssistantTurnResult {
  origin: 'gemini_ai' | 'deterministic_fallback' | 'urgent_medical_redirect';
  response: AiChatResponse;
  safetyWarnings: string[];
  errorDetail?: string;
}

const AI_REQUEST_TIMEOUT_MS = 15000;

export function buildDeterministicFallbackResponse(
  context: AiContextPackage,
  deterministicRoutine: RoutineRecommendation[],
  reason: string,
): AiChatResponse {
  const top = deterministicRoutine.slice(0, 3);
  const aqiLine =
    context.aqiValue !== null
      ? `For ${context.city}, the current ${context.isForecastOrSample} NAQI is ${context.aqiValue} (${context.aqiCategory}${context.dominantPollutant ? `, led by ${context.dominantPollutant}` : ''}).`
      : `Live air-quality data for ${context.city} is currently unavailable.`;

  return {
    summary: `${aqiLine} AI wording is unavailable right now (${reason}), so Saansathi is showing its verified deterministic plan for your household.`,
    recommendations: top.map((r) => ({
      id: r.id,
      action: r.title,
      timing: r.suggestedTiming,
      reason: r.reason,
      exposureConsideration: r.exposureEffect,
      environmentalConsideration: r.environmentalImpact,
      effort: r.effort === 'planned' ? 'moderate_effort' : r.effort,
      confidence: r.confidence,
      evidenceIds: r.evidenceIds,
      caveats: r.caveats,
      alternative: r.alternative?.title,
    })),
    dataLimitations: [
      `Deterministic offline/fallback mode active: ${reason}`,
      context.bestOutdoorWindowLabel
        ? `Lowest model-forecast window: ${context.bestOutdoorWindowLabel}`
        : 'No forecast window verified.',
    ],
    sourceIdsUsed: ['cpcb-naqi', 'epa-air-cleaners', 'india-ghg-transport'],
    disclaimer: 'Deterministic planning fallback—verified local rules only, not medical advice.',
  };
}

export async function askSaansathiAssistant(params: {
  question: string;
  context: AiContextPackage;
  deterministicRoutine: RoutineRecommendation[];
  signal?: AbortSignal;
}): Promise<AssistantTurnResult> {
  if (hasUrgentMedicalSymptoms(params.question)) {
    return {
      origin: 'urgent_medical_redirect',
      safetyWarnings: ['Urgent symptom keywords detected — redirected to medical care.'],
      response: {
        summary:
          'If anyone is experiencing severe breathing difficulty, chest pain, fainting, or sudden worsening respiratory symptoms, please seek immediate medical attention or contact local emergency services (e.g., 112 / 108 in India). Saansathi cannot diagnose symptoms or provide medical care.',
        recommendations: [],
        dataLimitations: ['Saansathi is an environmental planning tool, not a medical service.'],
        sourceIdsUsed: ['cpcb-naqi'],
        disclaimer: 'Seek urgent clinical evaluation for acute respiratory or cardiac symptoms.',
      },
    };
  }

  const payload: AiChatRequest = {
    question: params.question.trim().slice(0, 800),
    context: params.context,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  if (params.signal) {
    params.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errJson = (await res.json().catch(() => null)) as { message?: string } | null;
      const errText = errJson?.message ?? `AI service returned HTTP ${res.status}`;
      return {
        origin: 'deterministic_fallback',
        safetyWarnings: [],
        errorDetail: errText,
        response: buildDeterministicFallbackResponse(
          params.context,
          params.deterministicRoutine,
          errText,
        ),
      };
    }

    const json: unknown = await res.json();
    const parsed = AiChatResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        origin: 'deterministic_fallback',
        safetyWarnings: [],
        errorDetail: 'AI response did not match the required structured schema.',
        response: buildDeterministicFallbackResponse(
          params.context,
          params.deterministicRoutine,
          'Structured response validation failed',
        ),
      };
    }

    const { sanitized, safetyWarnings } = sanitizeAiResponse(parsed.data, params.context);
    return {
      origin: 'gemini_ai',
      response: sanitized,
      safetyWarnings,
    };
  } catch (err) {
    const detail =
      err instanceof DOMException && err.name === 'AbortError'
        ? 'AI request timed out'
        : 'Network connection to AI assistant unavailable';
    return {
      origin: 'deterministic_fallback',
      safetyWarnings: [],
      errorDetail: detail,
      response: buildDeterministicFallbackResponse(
        params.context,
        params.deterministicRoutine,
        detail,
      ),
    };
  } finally {
    clearTimeout(timer);
  }
}
