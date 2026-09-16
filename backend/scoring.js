// VECTOR scoring - matches VECTOR_PRD and the interactive assessment prototype.
// Situational items (V, E, C) use scores 1/2/4; behavioural items (O, T, R) use 1–5.

const DIM_ORDER = ['V', 'E', 'C', 'O', 'T', 'R'];
const DIM_LEVELS = ['', 'Emerging', 'Developing', 'Established', 'Advanced', 'Defining'];
const DIM_NAMES = {
  V: 'Vision Clarity',
  E: 'Edge Judgment',
  C: 'Context Fluency',
  T: 'Trust Architecture',
  O: 'Orchestration Intelligence',
  R: 'Range'
};
const DIM_COLORS = {
  V: '#1A6BAF',
  E: '#C9A84C',
  C: '#0D6E6E',
  T: '#6B4FAF',
  O: '#2E75B6',
  R: '#2D7D5A'
};
const CLASSES = {
  V1: { name: 'Executor', desc: 'You use AI. AI does not yet fully use you.' },
  V2: { name: 'Director', desc: 'You tell AI what to do - and know when it is wrong.' },
  V3: { name: 'Integrator', desc: 'You and AI together outperform either separately.' },
  V4: { name: 'Architect', desc: 'You design the system others perform in.' },
  V5: { name: 'Multiplier', desc: "Your Vector raises everyone else's." }
};
const ROLE_LABELS = {
  eng: 'Software Engineer / Technology',
  con: 'Consultant / Strategy',
  fin: 'Finance / Risk',
  hr: 'HR / L&D / People',
  del: 'Delivery / Project Management'
};

const SIT_DIMS = new Set(['V', 'E', 'C']);

function dimType(dim) {
  return SIT_DIMS.has(dim) ? 'sit' : 'beh';
}

function scoreToLevel(total, type, count) {
  if (!count) return 1;
  const pct = type === 'sit' ? (total - count) / (count * 3) : (total - count) / (count * 4);
  if (pct < 0.2) return 1;
  if (pct < 0.4) return 2;
  if (pct < 0.65) return 3;
  if (pct < 0.85) return 4;
  return 5;
}

function questionsForRole(role) {
  const QB = require('./questions');
  return QB[role] || [];
}

function calculateScores(responses, questions) {
  const qs = questions && questions.length
    ? questions
    : Object.keys(responses).map((id) => ({ id, dim: id.charAt(0), type: dimType(id.charAt(0)) }));

  const out = {};
  DIM_ORDER.forEach((d) => {
    const dimQs = qs.filter((q) => q.dim === d);
    const type = (dimQs[0] && dimQs[0].type) || dimType(d);
    const count = dimQs.length || 1;
    const total = dimQs.reduce((sum, q) => sum + (parseInt(responses[q.id], 10) || 1), 0);
    const level = scoreToLevel(total, type, count);
    out[d] = { level, type, total, count };
  });
  return out;
}

function deriveClass(scores) {
  const O = scores.O.level;
  const E = scores.E.level;
  const V = scores.V.level;
  const R = scores.R.level;
  const all = Object.values(scores).map((s) => s.level);
  const mx = Math.max(...all);
  const mn = Math.min(...all);
  let cls = 'V1';
  if (O >= 2) cls = 'V2';
  if (E >= 3 && O >= 3) cls = 'V3';
  if (V >= 4 && E >= 4 && O >= 4) cls = 'V4';
  if (V >= 5 && E >= 5 && O >= 5 && R >= 5) cls = 'V5';
  if (mx - mn >= 2 && cls !== 'V1') {
    const ord = ['V1', 'V2', 'V3', 'V4', 'V5'];
    const i = ord.indexOf(cls);
    if (i > 0) cls = ord[i - 1];
  }
  const dom = Object.entries(scores).reduce((a, b) => (b[1].level > a[1].level ? b : a))[0];
  return { cls, dom };
}

function calculateVectorSign(scores) {
  const derived = scores && scores.cls && scores.dom
    ? scores
    : deriveClass(scores);
  const cls = String(derived.cls || '').match(/^V[1-5]$/) ? derived.cls : 'V1';
  const dom = 'VECTOR'.includes(derived.dom) ? derived.dom : 'V';
  return `${cls}-${dom}`;
}

function cleanDisplayText(value) {
  let s = String(value == null ? '' : value);
  s = s.replace(/Â€["”]|Â€[“”"'˜™]|â€[”–—“”˜™]|â€\u009d/gi, ' - ');
  s = s.replace(/â€”|â€“|â€œ|â€\u009d|â€™|â€˜|â€¦/g, ' - ');
  s = s.replace(/[\u2014\u2013\u2015\u2012\u2010]/g, ' - ');
  s = s.replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/\u00a0/g, ' ');
  s = s.replace(/[€£#]/g, ' - ');
  s = s.replace(/Â/g, '');
  s = s.replace(/\s*-\s*/g, ' - ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^-\s*/, '').replace(/\s*-$/, '');
  return s;
}

function assignVectorClass(scores) {
  return deriveClass(scores).cls;
}

function getDimInterp(dim, level) {
  const d = {
    V: {
      1: 'You tend to engage AI with the problem as stated, without first reframing the underlying question. The quality of AI output you produce is bounded by the quality of the brief you receive - significant value is being left on the table.',
      2: 'You occasionally question whether the right problem has been framed before engaging AI. This instinct is present and valuable. The development priority is making it systematic rather than occasional.',
      3: 'You consistently reframe problems before AI engagement, and this reframing meaningfully changes what AI produces. Your Vision Clarity is a reliable professional asset.',
      4: 'Your ability to define the right problem before AI engages is a differentiating capability. You see past the stated brief to the underlying question, and AI output produced under your direction is notably more targeted and useful as a result.',
      5: 'Vision Clarity at the Defining level means you set the standard for how problems are framed in your organization. Others adopt your framing instinct because it consistently produces better outcomes.'
    },
    E: {
      1: 'In ambiguous or high-pressure situations you tend to defer - either accepting AI output without systematic evaluation or escalating judgment calls to others. Edge Judgment develops through deliberate practice at the boundary of your confidence.',
      2: 'You are developing the awareness to recognize when situations require your judgment rather than AI confidence. The gap between awareness and action is your primary development target.',
      3: 'Your Edge Judgment is a genuine organizational asset. You make calls in ambiguous situations, own the consequence, and your peers recognize that you can be trusted to act at the point where AI reaches its limit.',
      4: 'Edge Judgment at the Advanced level means you operate reliably in the territory most challenging for AI - high stakes, incomplete information, time pressure. Your decisions in these moments are sought out by others.',
      5: 'Your Edge Judgment is field-defining. You have developed the capacity to decide with precision where others hesitate, and your pattern recognition in ambiguous situations is demonstrably superior to both AI models and less experienced colleagues.'
    },
    C: {
      1: 'Your attention in professional interactions tends toward content and outcome rather than relational dynamics and contextual signals. Context Fluency at this level means important signals are present and available but not yet being systematically read.',
      2: 'You notice some of the signals beneath the surface of professional interactions - the emotional temperature, the power dynamics, the unsaid. Building a structured reflection habit will accelerate development significantly.',
      3: 'You read organizational and interpersonal contexts reliably. What you notice regularly informs how you act, and the people around you benefit from your contextual intelligence even when it is not explicitly named.',
      4: 'Context Fluency at the Advanced level means you see what others miss and act on it in ways that shape outcomes. Your ability to read rooms, relationships, and organizational dynamics is a recognized capability.',
      5: 'Your Context Fluency is exceptional. You perceive the signals that determine whether a project, relationship, or organizational initiative succeeds or fails - and your interventions based on that perception are consistently consequential.'
    },
    T: {
      1: 'Trust in your key relationships tends to develop reactively rather than by design. Trust Architecture at this level means you respond to trust as it emerges rather than actively creating the conditions for it to grow.',
      2: 'You are developing awareness of trust dynamics in your relationships and beginning to respond to shifts as you notice them. The transition from reactive to proactive trust management is the key next step.',
      3: 'You actively manage trust in your key relationships - monitoring its trajectory, investing in it deliberately, and adjusting your behavior in response to what you observe. This is a genuine professional asset in AI-augmented delivery contexts.',
      4: 'Trust Architecture at the Advanced level means clients and colleagues extend greater autonomy to you over time because your reliability and integrity are demonstrably consistent. You make AI-augmented delivery feel safe.',
      5: 'Your Trust Architecture capability is exceptional. The relationships you build and maintain are characterized by a quality of trust that enables work others cannot access.'
    },
    O: {
      1: 'Your current relationship with AI is primarily transactional - you prompt and use output without systematic direction or evaluation. Orchestration Intelligence at this level is the starting point for deliberate development.',
      2: 'You are developing a directional relationship with AI - framing before prompting, iterating when output falls short. This is a meaningful transition from transactional to intentional.',
      3: 'Your Orchestration Intelligence is established. You direct AI with purpose, evaluate output critically, and consistently produce better outcomes through human-AI collaboration than either you or AI could produce independently.',
      4: 'Orchestration Intelligence at the Advanced level means the human-AI units you operate within perform at a ceiling that others cannot reach. Your direction of AI is recognizably more sophisticated, targeted, and consequential.',
      5: 'Your Orchestration Intelligence is field-defining. You architect human-AI collaboration at the organizational level. The standards you set become the standards others aspire to.'
    },
    R: {
      1: 'Your work currently operates primarily within your primary domain of expertise. Range at this level reflects focused depth - valuable in its own right, but increasingly insufficient as AI makes deep single-domain expertise more abundant.',
      2: 'You engage with adjacent domains when required and make occasional contributions outside your primary expertise. Building deliberate cross-domain practice will accelerate Range development significantly.',
      3: 'Your Range is established. You operate credibly and contribute genuinely across multiple domains, and the distance between domains is a source of insight rather than hesitation.',
      4: 'Range at the Advanced level means you are sought out for perspectives outside your primary domain because your cross-domain contribution is recognized as genuinely valuable.',
      5: 'Your Range is exceptional. You operate with credibility across domains that most professionals would consider incompatible, and the cross-domain synthesis you produce is a distinctive and rare organizational asset.'
    }
  };
  return (d[dim] && d[dim][level]) || '';
}

function getProfileNarrative(scores, cls) {
  const dom = Object.entries(scores).reduce((a, b) => (b[1].level > a[1].level ? b : a))[0];
  const weak = Object.entries(scores).reduce((a, b) => (b[1].level < a[1].level ? b : a))[0];
  const n = {
    V1: `This profile reflects a practitioner at the beginning of their Human-AI collaboration journey. The dimensions that determine your Vector are all actively developing - and all are developable through deliberate practice. <strong>Orchestration Intelligence is your highest-leverage starting point</strong>: the practitioner who learns to direct AI with intent, rather than use it as a sophisticated search engine, activates all other VECTOR dimensions more rapidly. The transition from V1 to V2 is achievable within weeks for someone who practices deliberately.`,
    V2: `This profile reflects a practitioner who has moved beyond transactional AI use and is developing genuine directional capability. You know when AI is wrong more often than you accept output without question, and you have begun developing the framing and evaluation habits that characterize high-Vector work. <strong>The gap between V2 and V3 is the most consequential in the VECTOR scale</strong> - it is where AI use becomes AI collaboration, where the ceiling of the Human-AI unit genuinely rises because of your presence. That transition is unlocked by developing <strong>${DIM_NAMES[weak]}</strong> from its current level to Established.`,
    V3: `This profile reflects a practitioner who has achieved genuine Human-AI integration. You and AI together produce outcomes that neither could reach independently - and this is not yet common. <strong>Your ${DIM_NAMES[dom]} is your signature dimension</strong>: the capability that most defines your current contribution and most differentiates you from practitioners at lower Vector classes. The path to V4 is less a personal development journey than a contribution shift: not just directing AI yourself, but designing how others in your team and organization direct AI.`,
    V4: `This profile reflects a practitioner operating at the architecture level - you design the conditions in which others perform at higher Vector. <strong>This is a rare capability</strong>, and organizations that have practitioners at this level and deploy them well hold a genuine competitive advantage. Your role is not simply to perform but to raise the ceiling of every Human-AI unit you touch. The distance from V4 to V5 is not a personal development journey - it is a field contribution journey.`,
    V5: `This profile reflects an exceptional practitioner - one whose Vector raises everyone else's. <strong>V5 is rare by design</strong>: it describes individuals whose presence, thinking, and frameworks elevate the field, not just their immediate organization. The V5 practitioner's most important contribution is the development of V4s: the deliberate investment in others' capability that multiplies your Vector beyond your own direct work.`
  };
  return n[cls] || n.V2;
}

function getNextMove(scores, cls) {
  const weak = Object.entries(scores).reduce((a, b) => (b[1].level < a[1].level ? b : a))[0];
  const m = {
    V1: {
      title: 'Build deliberate AI direction habits',
      desc: 'Your highest-leverage development priority is moving from transactional to directional AI use. The V1 to V2 transition begins with one daily practice.',
      practice: 'After every significant AI engagement, before moving to the next task, write three sentences: What did I ask for? What did I get? What would have made my direction more precise? This reflection habit, maintained consistently for 30 days, produces more Vector development than any formal training program.',
      timeline: 'Expected movement to V2: 8 to 12 weeks of deliberate daily practice.'
    },
    V2: {
      title: `Develop ${DIM_NAMES[weak]} to Established`,
      desc: `The gap between V2 and V3 is unlocked by your lowest dimension - ${DIM_NAMES[weak]}. This is your Next Vector Move. Not six things. This one specific thing, developed deliberately.`,
      practice: weak === 'E'
        ? 'Before escalating any ambiguous situation this week: attempt three directed iterations. If all three fail to resolve the ambiguity, then escalate. Name your reasoning explicitly each time.'
        : weak === 'V'
          ? 'Before every significant AI engagement this week: write one paragraph. What problem are we actually solving - not what were we asked, but what are we actually solving, and why does the answer matter? Five minutes. Non-negotiable.'
          : 'After every significant client or stakeholder meeting: spend 10 minutes answering these questions in writing. What was the emotional temperature? At what moment did it shift? Who was not speaking - and what were they communicating? What signal did I miss?',
      timeline: 'Expected movement to V3: 12 to 18 weeks of consistent deliberate practice.'
    },
    V3: {
      title: 'Design how others work with AI - not just how you work with it',
      desc: 'The V3 to V4 transition is a contribution shift. Your next move is to take ownership of one team-level AI practice and set a standard that others follow.',
      practice: 'Identify one specific AI direction practice that produces measurably better outcomes in your own work. This week: document it clearly enough that a colleague could replicate it without asking you questions. Share it in your next team meeting.',
      timeline: 'Expected V4 readiness: 6 to 12 months of sustained system-level contribution.'
    },
    V4: {
      title: 'Make your frameworks travel beyond your immediate context',
      desc: 'The distance from V4 to V5 is measured not by personal capability but by field-level impact. Your frameworks need to travel further than your direct influence.',
      practice: 'Choose one framework or standard you have developed for Human-AI collaboration. This quarter: publish it, teach it to a group beyond your immediate team, and measure whether others adopt it without your presence.',
      timeline: 'V5 is a recognition milestone. It emerges from sustained V4 contribution at organizational and field scale.'
    },
    V5: {
      title: 'Sustain and multiply your field-level contribution',
      desc: 'At V5, the development question shifts entirely. It is about how many V4s you can develop and how far your frameworks travel.',
      practice: 'Identify three practitioners in your organization with V4 potential. Design one specific development intervention for each. Deliver it personally. Measure whether their Vector class moves as a result.',
      timeline: 'The V5 contribution is ongoing and not time-bounded.'
    }
  };
  return m[cls] || m.V2;
}

function dominantBlurb(dom) {
  const map = {
    V: 'the precision with which you define problems before AI engages',
    E: 'the quality of judgment you bring to the moments AI cannot resolve',
    C: 'the contextual intelligence you apply to signals AI cannot sense',
    T: 'the deliberate architecture of trust in AI-augmented delivery',
    O: 'the intentionality and precision with which you direct AI toward outcomes',
    R: 'the breadth of domain contexts you can operate across with genuine contribution'
  };
  return map[dom] || '';
}

function generateReport(scores, _responses, extras = {}) {
  const { cls, dom } = deriveClass(scores);
  const cd = CLASSES[cls];
  const vectorSign = `${cls}-${dom}`;
  const levels = {};
  DIM_ORDER.forEach((d) => { levels[d] = scores[d].level; });

  const dimensions = DIM_ORDER.map((d) => ({
    dim: d,
    name: DIM_NAMES[d],
    level: scores[d].level,
    level_name: DIM_LEVELS[scores[d].level],
    color: DIM_COLORS[d],
    interpretation: getDimInterp(d, scores[d].level)
  }));

  const strengths = DIM_ORDER.filter((d) => scores[d].level >= 3).slice(0, 3);
  const gaps = DIM_ORDER.filter((d) => scores[d].level <= 2).slice(0, 3);
  const classOrd = ['V1', 'V2', 'V3', 'V4', 'V5'];
  const nextCls = classOrd[classOrd.indexOf(cls) + 1] || null;

  return {
    vector_sign: vectorSign,
    vector_class: cls,
    dominant: dom,
    class_name: cd.name,
    class_desc: cd.desc,
    dimension_scores: levels,
    dimensions,
    strengths: strengths.map((d) => ({ dim: d, name: DIM_NAMES[d], level_name: DIM_LEVELS[scores[d].level] })),
    gaps: gaps.map((d) => ({ dim: d, name: DIM_NAMES[d], level_name: DIM_LEVELS[scores[d].level] })),
    narrative: getProfileNarrative(scores, cls),
    dominant_blurb: dominantBlurb(dom),
    next_move: getNextMove(scores, cls),
    next_class: nextCls,
    next_class_name: nextCls ? CLASSES[nextCls].name : null,
    role_label: ROLE_LABELS[extras.role] || extras.role || '',
    name: extras.name || '',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  calculateScores,
  calculateVectorSign,
  assignVectorClass,
  deriveClass,
  generateReport,
  cleanDisplayText,
  scoreToLevel,
  questionsForRole,
  CLASSES,
  DIM_LEVELS,
  DIM_NAMES,
  DIM_ORDER,
  DIM_COLORS,
  ROLE_LABELS
};
