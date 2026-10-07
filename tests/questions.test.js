const { bank, ROLES, questionsForRole } = require('../src/questions');
const { cleanDisplayText } = require('../src/text');

describe('question bank', () => {
  test('has five roles of 30 questions', () => {
    expect(ROLES).toEqual(['eng', 'con', 'fin', 'hr', 'del']);
    ROLES.forEach((role) => {
      const qs = questionsForRole(role);
      expect(qs).toHaveLength(30);
      const dims = qs.map((q) => q.dim).sort().join('');
      expect(qs.filter((q) => q.type === 'sit')).toHaveLength(15);
      expect(qs.filter((q) => q.type === 'beh')).toHaveLength(15);
      expect(new Set(qs.map((q) => q.id)).size).toBe(30);
      expect(dims).toContain('V');
    });
    expect(Object.keys(bank).sort()).toEqual([...ROLES].sort());
  });

  test('display copy has no dash mojibake', () => {
    ROLES.forEach((role) => {
      questionsForRole(role).forEach((q) => {
        expect(q.text).not.toMatch(/â€|Â€|Â/);
        expect(cleanDisplayText(q.text)).toBe(q.text);
        q.opts.forEach((o) => {
          expect(o.t).not.toMatch(/â€|Â€|Â/);
        });
      });
    });
  });
});
