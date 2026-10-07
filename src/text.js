function cleanDisplayText(value) {
  let s = String(value == null ? '' : value);
  s = s.replace(/Â€["”]|Â€[“”"'˜™]|â€[”–—“”˜™]|â€\u009d/gi, ' - ');
  s = s.replace(/â€”|â€“|â€œ|â€\u009d|â€™|â€˜|â€¦/g, ' - ');
  s = s.replace(/[\u2014\u2013\u2015\u2012\u2010]/g, ' - ');
  s = s.replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/\u00a0/g, ' ');
  s = s.replace(/[€£]/g, ' - ');
  s = s.replace(/Â/g, '');
  s = s.replace(/\s*-\s*/g, ' - ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^-\s*/, '').replace(/\s*-$/, '');
  return s;
}

function cleanQuestions(questions) {
  return (questions || []).map((q) => ({
    ...q,
    text: cleanDisplayText(q.text),
    opts: (q.opts || []).map((o) => ({ ...o, t: cleanDisplayText(o.t) }))
  }));
}

module.exports = { cleanDisplayText, cleanQuestions };
