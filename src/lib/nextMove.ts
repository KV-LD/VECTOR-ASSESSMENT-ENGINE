import type { DimKey } from './types';

// Technique mapping for lowest dimensions
const TECHNIQUES: Record<DimKey, string> = {
  V: 'Problem Reframing (Archaeology)',
  E: 'Decision Autopsies',
  C: 'Signal Debrief',
  T: 'Trust Ledger Reviews',
  O: 'Prompt Engineering (Orchestration Variant)',
  R: 'Range Assignment'
};

// Level names for target guidance
const LEVEL_NAMES = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Established',
  4: 'Advanced',
  5: 'Defining'
} as const;

// Tie-break order for finding lowest dimension (different from dominant)
const LOWEST_TIE_BREAK: DimKey[] = ['O', 'E', 'V', 'T', 'C', 'R'];

interface NextMoveResult {
  dimension: DimKey;
  currentLevel: number;
  targetLevel: number;
  technique: string;
  instruction: string;
}

export function calculateNextMove(
  scores: Record<DimKey, { level: number }>
): NextMoveResult | null {
  // Check if all dimensions are at max
  const allMax = Object.values(scores).every(s => s.level === 5);
  if (allMax) {
    return null; // All dimensions maxed out
  }

  // Find lowest dimension with tie-break order
  let lowest: DimKey = 'V';
  let lowestLevel = scores.V.level;

  for (const dim of LOWEST_TIE_BREAK) {
    if (scores[dim].level < lowestLevel) {
      lowest = dim;
      lowestLevel = scores[dim].level;
    }
  }

  const targetLevel = Math.min(lowestLevel + 1, 5);
  const technique = TECHNIQUES[lowest];
  const currentLevelName = LEVEL_NAMES[lowestLevel as keyof typeof LEVEL_NAMES];
  const targetLevelName = LEVEL_NAMES[targetLevel as keyof typeof LEVEL_NAMES];

  const instruction = `Your ${lowest} (${getDimensionName(lowest)}) is ${currentLevelName}. Focus on ${technique} to reach ${targetLevelName}.`;

  return {
    dimension: lowest,
    currentLevel: lowestLevel,
    targetLevel,
    technique,
    instruction
  };
}

function getDimensionName(dim: DimKey): string {
  const names: Record<DimKey, string> = {
    V: 'Vision Clarity',
    E: 'Edge Judgment',
    C: 'Context Fluency',
    T: 'Trust Architecture',
    O: 'Orchestration Intelligence',
    R: 'Range'
  };
  return names[dim];
}
