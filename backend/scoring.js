// VECTOR Scoring Engine
// Calculates dimension scores and assigns vector class

const DIM_LEVELS = ["", "Emerging", "Developing", "Established", "Advanced", "Defining"];
const CLASSES = {
  V1: { name: "Executor", desc: "You use AI. AI does not yet fully use you." },
  V2: { name: "Director", desc: "You tell AI what to do — and know when it is wrong." },
  V3: { name: "Integrator", desc: "You and AI together outperform either separately." },
  V4: { name: "Architect", desc: "You design the system others perform in." },
  V5: { name: "Multiplier", desc: "Your Vector raises everyone else's." }
};

function calculateScores(responses) {
  // responses = { question_id: score, ... }
  const dimScores = { V: 0, E: 0, C: 0, T: 0, O: 0, R: 0 };
  const dimCounts = { V: 0, E: 0, C: 0, T: 0, O: 0, R: 0 };

  // Aggregate scores by dimension
  for (const [questionId, score] of Object.entries(responses)) {
    const dim = questionId.charAt(0); // V, E, C, T, O, R
    if (dimScores[dim] !== undefined) {
      dimScores[dim] += parseInt(score);
      dimCounts[dim]++;
    }
  }

  // Calculate averages (1-5 scale)
  const avgScores = {};
  for (const dim in dimScores) {
    avgScores[dim] = Math.round((dimScores[dim] / dimCounts[dim]) * 10) / 10;
  }

  return avgScores;
}

function calculateVectorSign(dimScores) {
  // Vector sign is string of 6 letters (one per dimension: V, E, C, T, O, R)
  // Each mapped to level 1-5 (or custom logic from PRD)
  const dims = ['V', 'E', 'C', 'T', 'O', 'R'];
  let vectorSign = '';

  for (const dim of dims) {
    const score = dimScores[dim];
    const level = Math.min(5, Math.max(1, Math.round(score)));
    vectorSign += `${dim}${level}`;
  }

  return vectorSign;
}

function assignVectorClass(dimScores) {
  // Logic: Average of all dimensions determines class
  const avgAll = Object.values(dimScores).reduce((a, b) => a + b, 0) / 6;

  if (avgAll < 1.5) return 'V1';
  if (avgAll < 2.5) return 'V2';
  if (avgAll < 3.5) return 'V3';
  if (avgAll < 4.5) return 'V4';
  return 'V5';
}

function generateReport(dimScores, responses) {
  const vectorSign = calculateVectorSign(dimScores);
  const vectorClass = assignVectorClass(dimScores);
  const className = CLASSES[vectorClass].name;
  const classDesc = CLASSES[vectorClass].desc;

  return {
    vector_sign: vectorSign,
    vector_class: vectorClass,
    class_name: className,
    class_desc: classDesc,
    dimension_scores: {
      V: dimScores.V,
      E: dimScores.E,
      C: dimScores.C,
      T: dimScores.T,
      O: dimScores.O,
      R: dimScores.R
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  calculateScores,
  calculateVectorSign,
  assignVectorClass,
  generateReport,
  CLASSES,
  DIM_LEVELS
};
