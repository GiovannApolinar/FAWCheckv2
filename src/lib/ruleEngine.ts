import type { AssessmentEvaluation, EvaluateSaveRequest, SymptomInput } from '@/lib/api';

type RuleEvaluationResult = {
  score: number;
  responseBand: string;
  ruleBasis: string;
  usedFallback: boolean;
};

const SHOT_HOLE_BANDS = new Set([
  'none',
  'few_lt5',
  'several_6_8',
  'many_8_10',
  'several_whorl_furl',
  'most_whorl_furl',
]);

const LESION_BANDS = new Set([
  'none',
  'few_small_upto_1_3cm',
  'several_large_gt2_5cm',
  'many_all_sizes',
]);

const HOLE_BANDS = new Set(['none', 'few_small_mid', 'several_large', 'many_mid_large']);
const WHORL_FURL_BANDS = new Set(['none', 'partial', 'almost_total']);

function normalize(value: string, allowed: Set<string>, fallback: string): string {
  const normalized = value.trim().toLowerCase();
  if (allowed.has(normalized)) {
    return normalized;
  }

  return fallback;
}

export function mapResponseBand(score: number): string {
  if (score === 1) {
    return 'Highly resistant';
  }

  if (score <= 3) {
    return 'Resistant';
  }

  if (score <= 5) {
    return 'Partially resistant';
  }

  if (score <= 7) {
    return 'Susceptible';
  }

  return 'Highly susceptible';
}

export function evaluateRuleScore(symptoms: SymptomInput): RuleEvaluationResult {
  const shotHoleLeafBand = normalize(symptoms.shotHoleLeafBand, SHOT_HOLE_BANDS, 'none');
  const elongatedLesionBand = normalize(symptoms.elongatedLesionBand, LESION_BANDS, 'none');
  const holeBand = normalize(symptoms.holeBand, HOLE_BANDS, 'none');
  const whorlFurlDestruction = normalize(symptoms.whorlFurlDestruction, WHORL_FURL_BANDS, 'none');
  const olderLeavesWithPinholeCount = Math.max(0, Math.min(2, symptoms.olderLeavesWithPinholeCount));

  if (whorlFurlDestruction === 'almost_total' && symptoms.plantDying) {
    return {
      score: 9,
      responseBand: mapResponseBand(9),
      ruleBasis: 'Whorl/furl leaves almost totally destroyed and plant dying.',
      usedFallback: false,
    };
  }

  if (
    elongatedLesionBand === 'many_all_sizes' &&
    shotHoleLeafBand === 'most_whorl_furl' &&
    holeBand === 'many_mid_large'
  ) {
    return {
      score: 8,
      responseBand: mapResponseBand(8),
      ruleBasis: 'Many elongated lesions and many mid/large holes on most whorl/furl leaves.',
      usedFallback: false,
    };
  }

  if (
    elongatedLesionBand === 'many_all_sizes' &&
    shotHoleLeafBand === 'several_whorl_furl' &&
    holeBand === 'several_large'
  ) {
    return {
      score: 7,
      responseBand: mapResponseBand(7),
      ruleBasis: 'Many elongated lesions with several large holes on several whorl/furl leaves.',
      usedFallback: false,
    };
  }

  if (
    shotHoleLeafBand === 'several_whorl_furl' &&
    (elongatedLesionBand === 'several_large_gt2_5cm' || holeBand === 'several_large')
  ) {
    return {
      score: 6,
      responseBand: mapResponseBand(6),
      ruleBasis: 'Several large elongated lesions and/or several large holes on whorl/furl leaves.',
      usedFallback: false,
    };
  }

  if (
    shotHoleLeafBand === 'many_8_10' &&
    elongatedLesionBand === 'several_large_gt2_5cm' &&
    holeBand === 'few_small_mid'
  ) {
    return {
      score: 5,
      responseBand: mapResponseBand(5),
      ruleBasis: 'Elongated lesions on 8-10 leaves plus few small/mid holes from whorl/furl leaves.',
      usedFallback: false,
    };
  }

  if (
    shotHoleLeafBand === 'several_6_8' ||
    (elongatedLesionBand === 'few_small_upto_1_3cm' && holeBand === 'few_small_mid')
  ) {
    return {
      score: 4,
      responseBand: mapResponseBand(4),
      ruleBasis: 'Several shot-hole injuries (6-8 leaves) and/or few small elongated lesions with small holes.',
      usedFallback: false,
    };
  }

  if (shotHoleLeafBand === 'few_lt5' && holeBand === 'few_small_mid') {
    return {
      score: 3,
      responseBand: mapResponseBand(3),
      ruleBasis: 'Several shot-hole injuries on a few leaves with small circular hole damage.',
      usedFallback: false,
    };
  }

  if (
    (olderLeavesWithPinholeCount === 1 || olderLeavesWithPinholeCount === 2) &&
    shotHoleLeafBand === 'none' &&
    elongatedLesionBand === 'none' &&
    holeBand === 'none'
  ) {
    return {
      score: 2,
      responseBand: mapResponseBand(2),
      ruleBasis: 'Few pinholes observed on 1-2 older leaves.',
      usedFallback: false,
    };
  }

  if (
    !symptoms.leafFeedingDamage &&
    olderLeavesWithPinholeCount === 0 &&
    shotHoleLeafBand === 'none' &&
    elongatedLesionBand === 'none' &&
    holeBand === 'none' &&
    whorlFurlDestruction === 'none' &&
    !symptoms.plantDying
  ) {
    return {
      score: 1,
      responseBand: mapResponseBand(1),
      ruleBasis: 'No visible leaf-feeding damage.',
      usedFallback: false,
    };
  }

  let fallbackScore = 1;

  if (symptoms.leafFeedingDamage) {
    fallbackScore = Math.max(fallbackScore, 2);
  }

  if (olderLeavesWithPinholeCount > 0) {
    fallbackScore = Math.max(fallbackScore, 2);
  }

  const shotHoleWeight: Record<string, number> = {
    none: 1,
    few_lt5: 3,
    several_6_8: 4,
    many_8_10: 5,
    several_whorl_furl: 6,
    most_whorl_furl: 8,
  };

  const lesionWeight: Record<string, number> = {
    none: 1,
    few_small_upto_1_3cm: 4,
    several_large_gt2_5cm: 6,
    many_all_sizes: 8,
  };

  const holeWeight: Record<string, number> = {
    none: 1,
    few_small_mid: 3,
    several_large: 6,
    many_mid_large: 8,
  };

  const whorlWeight: Record<string, number> = {
    none: 1,
    partial: 7,
    almost_total: 9,
  };

  fallbackScore = Math.max(fallbackScore, shotHoleWeight[shotHoleLeafBand] ?? 1);
  fallbackScore = Math.max(fallbackScore, lesionWeight[elongatedLesionBand] ?? 1);
  fallbackScore = Math.max(fallbackScore, holeWeight[holeBand] ?? 1);
  fallbackScore = Math.max(fallbackScore, whorlWeight[whorlFurlDestruction] ?? 1);

  if (symptoms.plantDying) {
    fallbackScore = Math.max(fallbackScore, 9);
  }

  fallbackScore = Math.max(1, Math.min(9, fallbackScore));

  return {
    score: fallbackScore,
    responseBand: mapResponseBand(fallbackScore),
    ruleBasis:
      `Fallback weighted score used due mixed/non-canonical symptom combination: ` +
      `shot_holes=${shotHoleLeafBand}, lesions=${elongatedLesionBand}, holes=${holeBand}, whorl_furl=${whorlFurlDestruction}.`,
    usedFallback: true,
  };
}

export function buildProvisionalResponse(request: EvaluateSaveRequest): AssessmentEvaluation {
  const rule = evaluateRuleScore(request.symptoms);

  const flags = ['inference_unavailable'];
  if (rule.usedFallback) {
    flags.push('rule_fallback_used');
  }

  return {
    ruleScore: rule.score,
    finalScore: rule.score,
    responseBand: rule.responseBand,
    finalConfidence: 'provisional',
    finalConfidencePercent: 41,
    flags,
    explanation:
      `Final score follows the Prasanna guide: ${rule.score} (${rule.responseBand}). ${rule.ruleBasis} ` +
      `Advisory image signal unavailable while offline.`,
  };
}
