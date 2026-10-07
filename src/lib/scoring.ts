import type { Question, DimKey, VectorClass } from './types';

// Dimension order for tie-breaking in dominant dimension
const DIM_ORDER: DimKey[] = ['V', 'E', 'C', 'T', 'O', 'R'];

// Level names for reporting
const LEVEL_NAMES = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Established',
  4: 'Advanced',
  5: 'Defining'
} as const;

// VECTOR class definitions
const CLASSES = {
  V1: { name: 'Executor', desc: 'You use AI. AI does not yet fully use you.' },
  V2: { name: 'Director', desc: 'You tell AI what to do — and know when it is wrong.' },
  V3: { name: 'Integrator', desc: 'You and AI together outperform either separately.' },
  V4: { name: 'Architect', desc: 'You design the system others perform in.' },
  V5: { name: 'Multiplier', desc: "Your Vector raises everyone else's." }
} as const;

interface DimensionScore {
  level: number;
  type: 'sit' | 'beh';
  raw_sum: number;
  count: number;
}

type DimensionScores = Record<DimKey, DimensionScore>;

export function calculateDimensionLevels(
  questions: Question[],
  answers: Record<string, number>
): DimensionScores {
  const scores: DimensionScores = {
    V: { level: 1, type: 'sit', raw_sum: 0, count: 0 },
    E: { level: 1, type: 'sit', raw_sum: 0, count: 0 },
    C: { level: 1, type: 'sit', raw_sum: 0, count: 0 },
    T: { level: 1, type: 'beh', raw_sum: 0, count: 0 },
    O: { level: 1, type: 'beh', raw_sum: 0, count: 0 },
    R: { level: 1, type: 'beh', raw_sum: 0, count: 0 }
  };

  // Aggregate scores by dimension
  for (const q of questions) {
    const score = answers[q.id];
    if (score !== undefined) {
      scores[q.dim].raw_sum += score;
      scores[q.dim].count += 1;
    }
  }

  // Calculate levels using formulas
  for (const dim of DIM_ORDER) {
    const s = scores[dim];
    if (s.count === 0) continue;

    const avg = s.raw_sum / s.count;
    let level: number;

    if (s.type === 'sit') {
      // Situational: (sum-5)/15
      const normalized = (s.raw_sum - s.count * 1) / (s.count * 3); // (sum - min) / (max - min)
      level = normalizedToLevel(normalized);
    } else {
      // Behavioral: (sum-5)/20
      const normalized = (s.raw_sum - s.count * 1) / (s.count * 4); // (sum - min) / (max - min)
      level = normalizedToLevel(normalized);
    }

    scores[dim].level = level;
  }

  return scores;
}

function normalizedToLevel(normalized: number): number {
  if (normalized < 0.20) return 1;
  if (normalized < 0.40) return 2;
  if (normalized < 0.65) return 3;
  if (normalized < 0.85) return 4;
  return 5;
}

export function deriveVectorClass(scores: DimensionScores): { class: VectorClass; floorCheckApplied: boolean } {
  const V = scores.V.level;
  const E = scores.E.level;
  const O = scores.O.level;
  const R = scores.R.level;

  let cls: VectorClass = 'V1';

  if (O >= 2) cls = 'V2';
  if (E >= 3 && O >= 3) cls = 'V3';
  if (V >= 4 && E >= 4 && O >= 4) cls = 'V4';
  if (V >= 5 && E >= 5 && O >= 5 && R >= 5) cls = 'V5';

  // Floor check: if max-min >= 2 and class != V1, drop one class
  const levels = Object.values(scores).map(s => s.level);
  const max = Math.max(...levels);
  const min = Math.min(...levels);
  let floorCheckApplied = false;

  if (max - min >= 2 && cls !== 'V1') {
    const classOrder: VectorClass[] = ['V1', 'V2', 'V3', 'V4', 'V5'];
    const idx = classOrder.indexOf(cls);
    if (idx > 0) {
      cls = classOrder[idx - 1];
      floorCheckApplied = true;
    }
  }

  return { class: cls, floorCheckApplied };
}

export function getDominantDimension(scores: DimensionScores): DimKey {
  let dominant: DimKey = 'V';
  let maxLevel = scores.V.level;

  for (const dim of DIM_ORDER.slice(1)) {
    if (scores[dim].level > maxLevel) {
      dominant = dim;
      maxLevel = scores[dim].level;
    }
  }

  return dominant;
}

export function generateVectorSignature(cls: VectorClass, dominant: DimKey): string {
  return `${cls}-${dominant}`;
}

export function getClassInfo(cls: VectorClass) {
  return CLASSES[cls];
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level as keyof typeof LEVEL_NAMES] || 'Unknown';
}
