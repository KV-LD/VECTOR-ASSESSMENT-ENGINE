const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const TEAL = rgb(0, 110 / 255, 116 / 255);
const TEAL_DEEP = rgb(0, 79 / 255, 84 / 255);
const BLACK = rgb(35 / 255, 31 / 255, 32 / 255);
const GRAY = rgb(74 / 255, 85 / 255, 104 / 255);
const WHITE = rgb(1, 1, 1);
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const HEADER_H = 188;

function stripHtml(value) {
  return String(value == null ? '' : value)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function wrap(text, font, size, maxWidth) {
  const words = stripHtml(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function neatSign(report) {
  const cls = String((report && report.vector_class) || '').match(/^V[1-5]$/);
  const dom = report && report.dominant && 'VECTOR'.includes(report.dominant) ? report.dominant : '';
  if (cls && dom) return `${cls[0]}-${dom}`;
  const parsed = String((report && report.vector_sign) || '').match(/^(V[1-5])-([VECTOR])$/);
  if (parsed) return `${parsed[1]}-${parsed[2]}`;
  return `${cls ? cls[0] : 'V1'}-${dom || 'V'}`;
}

async function buildReportPdf({ report, name }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 36;
  const maxW = PAGE_W - MARGIN * 2;

  function addPage() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  function ensure(space) {
    if (y - space < MARGIN + 16) addPage();
  }

  function drawLines(lines, font, size, color, lineHeight) {
    lines.forEach((line) => {
      ensure(lineHeight);
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= lineHeight;
    });
  }

  const displayName = stripHtml(name || report.name || 'VECTOR Assessment');
  const role = stripHtml(report.role_label || '');
  const date = new Date(report.timestamp || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const sign = neatSign(report);
  const cls = stripHtml(report.vector_class || 'V1');
  const className = stripHtml(report.class_name || '');
  const classDesc = stripHtml(report.class_desc || report.signature_subtitle || '');

  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: TEAL_DEEP });
  y = PAGE_H - 36;
  page.drawText('VECTOR  Human-AI Capability Profile', {
    x: MARGIN, y, size: 10, font: regular, color: rgb(0.5, 0.88, 0.92)
  });
  y -= 24;
  page.drawText(displayName.slice(0, 70), { x: MARGIN, y, size: 20, font: bold, color: WHITE });
  y -= 16;
  if (role) {
    page.drawText(role, { x: MARGIN, y, size: 10, font: regular, color: rgb(0.85, 0.93, 0.94) });
    y -= 14;
  }
  page.drawText(`Assessment completed: ${date}`, {
    x: MARGIN, y, size: 10, font: regular, color: rgb(0.75, 0.85, 0.87)
  });
  y -= 26;
  page.drawText('VECTOR CLASS', { x: MARGIN, y, size: 8, font: regular, color: rgb(0.6, 0.84, 0.86) });
  page.drawText('VECTOR SIGN', { x: MARGIN + 150, y, size: 8, font: regular, color: rgb(0.6, 0.84, 0.86) });
  y -= 22;
  page.drawText(cls, { x: MARGIN, y, size: 26, font: bold, color: rgb(0.5, 0.88, 0.92) });
  page.drawText(sign, { x: MARGIN + 150, y, size: 26, font: bold, color: rgb(0.5, 0.88, 0.92) });
  const descLines = wrap(classDesc, regular, 10, maxW - 280);
  let descY = y + 22;
  descLines.slice(0, 4).forEach((line) => {
    page.drawText(line, { x: MARGIN + 300, y: descY, size: 10, font: regular, color: WHITE });
    descY -= 12;
  });
  y -= 16;
  page.drawText(className, { x: MARGIN, y, size: 11, font: regular, color: WHITE });

  y = PAGE_H - HEADER_H - 28;

  page.drawText('Dimension profile', { x: MARGIN, y, size: 14, font: bold, color: TEAL });
  y -= 16;
  (report.dimensions || []).forEach((dim) => {
    const title = `${dim.dim}  ${stripHtml(dim.name)}`;
    const level = stripHtml(dim.level_name || '');
    const interp = wrap(dim.interpretation || '', regular, 10, maxW - 16);
    const blockH = 32 + interp.length * 12;
    ensure(blockH + 10);
    page.drawRectangle({
      x: MARGIN - 4,
      y: y - blockH + 16,
      width: maxW + 8,
      height: blockH,
      color: rgb(0.93, 0.96, 0.97),
      borderColor: rgb(0.84, 0.91, 0.92),
      borderWidth: 0.6
    });
    page.drawText(title, { x: MARGIN + 6, y, size: 11, font: bold, color: TEAL });
    const levelWidth = bold.widthOfTextAtSize(level, 11);
    page.drawText(level, { x: MARGIN + maxW - levelWidth - 6, y, size: 11, font: bold, color: TEAL });
    y -= 16;
    interp.forEach((line) => {
      page.drawText(line, { x: MARGIN + 6, y, size: 10, font: regular, color: GRAY });
      y -= 12;
    });
    y -= 14;
  });

  y -= 6;
  ensure(36);
  page.drawText('Profile interpretation', { x: MARGIN, y, size: 14, font: bold, color: TEAL });
  y -= 18;
  const narrative = stripHtml(report.narrative || '');
  const dominant = stripHtml(
    ((report.dimensions || []).find((d) => d.dim === report.dominant) || {}).name || report.dominant || ''
  );
  const extra = `Your dominant dimension is ${dominant}. Your Vector Signature is ${sign}.`;
  drawLines(wrap(`${narrative} ${extra}`.trim(), regular, 10, maxW), regular, 10, BLACK, 13);

  y -= 8;
  ensure(20);
  page.drawText('VECTOR Framework  Krishnan Nilakantan (NK). Free to use with credit.', {
    x: MARGIN, y, size: 8, font: regular, color: GRAY
  });

  return Buffer.from(await pdf.save());
}

module.exports = { buildReportPdf, stripHtml, neatSign };
