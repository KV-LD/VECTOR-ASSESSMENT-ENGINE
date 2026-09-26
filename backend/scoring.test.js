const {
  scoreToLevel,
  calculateScores,
  deriveClass,
  calculateVectorSign,
  generateReport,
  cleanDisplayText
} = require('./scoring');

describe('scoreToLevel', () => {
  test('situational all lowest answers map to Emerging (1)', () => {
    expect(scoreToLevel(5, 'sit', 5)).toBe(1);
  });

  test('situational all highest answers map to Defining (5)', () => {
    expect(scoreToLevel(20, 'sit', 5)).toBe(5);
  });

  test('behavioural mid-range maps to Established (3)', () => {
    // pct = (15-5)/(5*4) = 0.5 → 3
    expect(scoreToLevel(15, 'beh', 5)).toBe(3);
  });
});

describe('VECTOR class and signature', () => {
  function levels(map) {
    const out = {};
    Object.entries(map).forEach(([k, v]) => { out[k] = { level: v, type: 'sit' }; });
    return out;
  }

  test('low Orchestration stays Executor V1', () => {
    const scores = levels({ V: 1, E: 1, C: 1, O: 1, T: 1, R: 1 });
    const { cls, dom } = deriveClass(scores);
    expect(cls).toBe('V1');
    expect(dom).toBe('V');
    expect(calculateVectorSign(scores)).toBe('V1-V');
  });

  test('O >= 2 yields Director V2', () => {
    const scores = levels({ V: 2, E: 2, C: 2, O: 2, T: 2, R: 2 });
    expect(deriveClass(scores).cls).toBe('V2');
  });

  test('E >= 3 and O >= 3 yields Integrator V3', () => {
    const scores = levels({ V: 3, E: 3, C: 3, O: 3, T: 3, R: 3 });
    const { cls, dom } = deriveClass(scores);
    expect(cls).toBe('V3');
    expect(calculateVectorSign(scores)).toBe('V3-V');
  });

  test('spread of 2 or more demotes class', () => {
    const scores = levels({ V: 4, E: 4, C: 1, O: 4, T: 4, R: 4 });
    expect(deriveClass(scores).cls).toBe('V3');
    expect(calculateVectorSign(scores)).toBe('V3-V');
  });

  test('never concatenates dimension scores into a sign', () => {
    const scores = levels({ V: 4, E: 4, C: 3, O: 3, T: 4, R: 4 });
    const sign = calculateVectorSign(scores);
    expect(sign).not.toMatch(/V4E4/);
    expect(sign).toMatch(/^V\d-[VECTOR]$/);
  });
});

describe('cleanDisplayText', () => {
  test('strips UTF-8 dash mojibake including after uppercase', () => {
    expect(cleanDisplayText('needs â€” a technically')).toBe('needs - a technically');
    expect(cleanDisplayText('NEEDS Â€" A TECHNICALLY')).toBe('NEEDS - A TECHNICALLY');
    expect(cleanDisplayText('needs # a technically')).toBe('needs - a technically');
    expect(cleanDisplayText('needs £ a technically')).toBe('needs - a technically');
  });
});

describe('calculateScores from responses', () => {
  test('uses sit vs beh ranges and returns integer levels', () => {
    const questions = [];
    ['V', 'E', 'C'].forEach((d) => {
      for (let i = 1; i <= 5; i++) questions.push({ id: `${d}${i}`, dim: d, type: 'sit' });
    });
    ['O', 'T', 'R'].forEach((d) => {
      for (let i = 1; i <= 5; i++) questions.push({ id: `${d}${i}`, dim: d, type: 'beh' });
    });
    const responses = {};
    questions.forEach((q) => { responses[q.id] = q.type === 'sit' ? 4 : 5; });
    const scores = calculateScores(responses, questions);
    expect(scores.V.level).toBe(5);
    expect(scores.O.level).toBe(5);
    const report = generateReport(scores, responses, { role: 'eng', name: 'Test' });
    expect(report.vector_sign).toBe('V5-O');
    expect(report.vector_class).toBe('V5');
    expect(report.dimension_scores.V).toBe(5);
  });
  test('mixed answers produce different dimension levels and a signature-specific subtitle', () => {
    const questions = [];
    ['V', 'E', 'C'].forEach((d) => {
      for (let i = 1; i <= 5; i++) questions.push({ id: `${d}${i}`, dim: d, type: 'sit' });
    });
    ['O', 'T', 'R'].forEach((d) => {
      for (let i = 1; i <= 5; i++) questions.push({ id: `${d}${i}`, dim: d, type: 'beh' });
    });
    const responses = {};
    questions.forEach((q) => { responses[q.id] = 2; });
    ['V1', 'V2', 'V3', 'V4', 'V5'].forEach((id) => { responses[id] = 4; });
    ['O1', 'O2', 'O3', 'O4', 'O5'].forEach((id) => { responses[id] = 5; });
    const scores = calculateScores(responses, questions);
    expect(scores.V.level).toBeGreaterThan(scores.E.level);
    expect(scores.O.level).toBeGreaterThan(scores.T.level);
    const report = generateReport(scores, responses, { role: 'eng', name: 'Mix' });
    expect(report.vector_sign).toMatch(/^V[1-5]-[VECTOR]$/);
    expect(report.signature_subtitle).toMatch(/Vision Clarity|Orchestration Intelligence/);
    const low = generateReport(
      calculateScores(Object.fromEntries(questions.map((q) => [q.id, 1])), questions),
      {},
      { role: 'eng' }
    );
    expect(report.signature_subtitle).not.toBe(low.signature_subtitle);
  });
});
