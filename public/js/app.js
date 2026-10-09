const state = {
  currentQ: 0,
  answers: {},
  userData: {},
  questions: []
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function interleave(qs) {
  const byDim = {};
  qs.forEach((q) => {
    if (!byDim[q.dim]) byDim[q.dim] = [];
    byDim[q.dim].push(q);
  });
  Object.keys(byDim).forEach((d) => { byDim[d] = shuffle(byDim[d]); });
  const result = [];
  const dims = shuffle(Object.keys(byDim));
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of dims) {
      if (byDim[d].length > 0) {
        if (result.length === 0 || result[result.length - 1].dim !== d) {
          result.push(byDim[d].shift());
          changed = true;
        }
      }
    }
  }
  Object.values(byDim).forEach((arr) => arr.forEach((q) => result.push(q)));
  return result;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function profileReady() {
  return ['nameInput', 'emailInput', 'empInput'].every((id) => document.getElementById(id).value.trim())
    && document.getElementById('roleSelect').value;
}

function checkForm() {
  const otpReady = document.getElementById('otpInput').value.trim().length === 6;
  document.getElementById('otpBtn').disabled = !profileReady();
  document.getElementById('startBtn').disabled = !profileReady() || !otpReady;
}

function collectProfile() {
  return {
    name: document.getElementById('nameInput').value.trim(),
    email: document.getElementById('emailInput').value.trim(),
    emp_id: document.getElementById('empInput').value.trim(),
    role: document.getElementById('roleSelect').value
  };
}

function showError(message) {
  const el = document.getElementById('formError');
  el.textContent = message;
  el.style.display = 'block';
}

async function requestOtp() {
  const profile = collectProfile();
  if (!profile.name || !profile.email || !profile.emp_id || !profile.role) {
    showError('Please complete all fields before starting.');
    return;
  }
  document.getElementById('formError').style.display = 'none';
  document.getElementById('otpBtn').disabled = true;
  try {
    const res = await fetch((API || '') + '/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not send code');
    document.getElementById('otpHint').textContent = data.devOtp
      ? (data.message + ' Your code is shown below.')
      : (data.message || 'Enter the code sent to your email.');
    document.getElementById('otpDigits').textContent = data.devOtp || '------';
    if (data.devOtp) document.getElementById('otpInput').value = data.devOtp;
    document.getElementById('otpInput').focus();
  } catch (err) {
    showError(err.message);
  }
  checkForm();
}

async function startAssessment() {
  state.userData = collectProfile();
  const otp = document.getElementById('otpInput').value.trim();
  if (!state.userData.name || !state.userData.email || !state.userData.emp_id || !state.userData.role || otp.length !== 6) {
    showError('Please complete all fields before starting.');
    return;
  }
  try {
    const verifyRes = await fetch((API || '') + '/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.userData.email, otp })
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) throw new Error(verifyData.error || 'Invalid code');
    localStorage.setItem('token', verifyData.token);

    const qRes = await fetch((API || '') + '/api/questions/' + state.userData.role);
    const bank = await qRes.json();
    if (!qRes.ok || !Array.isArray(bank) || !bank.length) {
      throw new Error(bank.error || 'Question bank missing.');
    }
    state.questions = interleave(bank);
    state.currentQ = 0;
    state.answers = {};
    showScreen('assessment');
    renderQ();
  } catch (err) {
    showError(err.message);
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function renderQ() {
  const q = state.questions[state.currentQ];
  const pct = Math.round((state.currentQ / state.questions.length) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = (state.currentQ + 1) + ' / ' + state.questions.length;
  const ans = state.answers[q.id];
  const selectedLetter = state.answers['_sel_' + q.id];
  const isLast = state.currentQ === state.questions.length - 1;
  const optHtml = q.opts.map((o) =>
    `<div class="opt-item${ans === o.s && selectedLetter === o.l ? ' selected' : ''}" data-id="${escapeHtml(q.id)}" data-score="${o.s}" data-letter="${escapeHtml(o.l)}"><div class="opt-badge">${escapeHtml(o.l)}</div><div class="opt-text">${escapeHtml(o.t)}</div></div>`
  ).join('');
  document.getElementById('questionCard').innerHTML = `
    <div class="q-accent"></div>
    <div class="q-num">Question ${state.currentQ + 1} of ${state.questions.length}</div>
    <div class="q-text">${escapeHtml(q.text)}</div>
    <div class="q-instruction">${q.type === 'sit'
      ? 'Choose the option that most closely describes what you would actually do.'
      : 'Select the statement that most accurately describes you as you are today - not as you aspire to be.'}</div>
    <div class="options-wrap">${optHtml}</div>
    <div class="q-nav">
      <button class="btn-back" id="btnBack" style="${state.currentQ === 0 ? 'visibility:hidden' : ''}">Back</button>
      <button class="btn-next${ans !== undefined ? ' ready' : ''}" id="btnNext">${isLast ? 'View My Report' : 'Next'}</button>
    </div>`;
  document.querySelectorAll('.opt-item').forEach((el) => {
    el.addEventListener('click', () => selectAns(el.dataset.id, Number(el.dataset.score), el.dataset.letter, el));
  });
  document.getElementById('btnBack').addEventListener('click', goBack);
  document.getElementById('btnNext').addEventListener('click', nextQ);
}

function selectAns(id, score, letter, el) {
  state.answers[id] = score;
  state.answers['_sel_' + id] = letter;
  document.querySelectorAll('.opt-item').forEach((o) => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btnNext').classList.add('ready');
}

function nextQ() {
  if (state.answers[state.questions[state.currentQ].id] === undefined) return;
  if (state.currentQ < state.questions.length - 1) {
    state.currentQ += 1;
    renderQ();
    window.scrollTo(0, 0);
  } else {
    submitAssessment();
  }
}

function goBack() {
  if (state.currentQ > 0) {
    state.currentQ -= 1;
    renderQ();
  }
}

function restart() {
  state.currentQ = 0;
  state.answers = {};
  state.questions = [];
  ['nameInput', 'emailInput', 'empInput', 'otpInput'].forEach((id) => { document.getElementById(id).value = ''; });
  document.getElementById('roleSelect').value = '';
  document.getElementById('otpHint').textContent = 'Complete your details, then send a code. The code appears here in large type when email is not configured.';
  document.getElementById('otpDigits').textContent = '------';
  document.getElementById('otpBtn').disabled = true;
  document.getElementById('startBtn').disabled = true;
  document.getElementById('formError').style.display = 'none';
  localStorage.removeItem('token');
  showScreen('welcome');
}

async function submitAssessment() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Session expired. Return to the start screen and verify your email code again.');
    return;
  }
  const responses = {};
  const choices = {};
  Object.keys(state.answers).forEach((k) => {
    if (k.indexOf('_') !== 0) responses[k] = state.answers[k];
  });
  Object.keys(state.answers).forEach((k) => {
    if (k.indexOf('_sel_') === 0) choices[k.slice(5)] = state.answers[k];
  });
  try {
    const saveRes = await fetch((API || '') + '/api/assessments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ responses, choices, userData: state.userData })
    });
    const saveData = await saveRes.json().catch(() => ({}));
    if (!saveRes.ok || !saveData.report) {
      throw new Error(saveData.error || ('Save failed (' + saveRes.status + ')'));
    }
    renderReport(saveData.report, saveData.warning);
  } catch (err) {
    alert('Could not generate the report or update Excel.\n\nClose data/assessments.xlsx if it is open in Excel, keep npm start running, then complete the assessment again.\n\n' + err.message);
  }
}

function neatVectorSign(r) {
  const clsMatch = String((r && r.vector_class) || '').match(/^V[1-5]$/);
  const dom = r && r.dominant && 'VECTOR'.includes(r.dominant) ? r.dominant : '';
  if (clsMatch && dom) return clsMatch[0] + '-' + dom;
  const parsed = String((r && r.vector_sign) || '').match(/^(V[1-5])\s*-?\s*([VECTOR])$/);
  if (parsed) return parsed[1] + '-' + parsed[2];
  return (clsMatch ? clsMatch[0] : 'V1') + '-' + (dom || 'V');
}

function renderReport(r, warning) {
  state.lastReport = r;
  const now = new Date(r.timestamp || Date.now());
  const ds = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const sign = neatVectorSign(r);
  const cls = String(r.vector_class || sign.split('-')[0] || 'V1');
  document.getElementById('rName').textContent = state.userData.name;
  document.getElementById('rRole').textContent = r.role_label || state.userData.role;
  document.getElementById('rCalibration').textContent = 'Assessment calibrated for ' + (r.role_label || state.userData.role) + ' professionals';
  document.getElementById('rDate').textContent = 'Assessment completed: ' + ds;
  document.getElementById('rClass').textContent = cls;
  document.getElementById('rClassName').textContent = r.class_name || '';
  document.getElementById('rSig').textContent = sign;
  document.getElementById('rSigInterp').textContent = r.signature_subtitle || ((r.class_name || '') + ' - ' + (r.class_desc || ''));

  const banner = document.getElementById('saveBanner');
  if (warning) {
    banner.textContent = warning;
    banner.classList.add('warn');
  } else {
    banner.textContent = '';
    banner.classList.remove('warn');
  }

  const dimRows = (r.dimensions || []).map((d) =>
    `<div class="dim-row"><div class="dim-row-top"><div class="dim-letter">${escapeHtml(d.dim)}</div><div class="dim-name-wrap"><div class="dim-fullname">${escapeHtml(d.name)}</div><div class="dim-level-name">${escapeHtml(d.level_name || '')}</div></div><div class="dim-level-badge">${escapeHtml(d.level_name || '')}</div></div><div class="dim-interpretation">${escapeHtml(d.interpretation || '')}</div></div>`
  ).join('');
  const scale = r.class_scale || [];
  const scaleNodes = scale.map((item) => {
    const active = item.id === r.vector_class;
    return `<div class="scale-node${active ? ' active' : ''}"><div class="scale-v">${escapeHtml(item.id)}</div><div class="scale-n">${escapeHtml(item.name)}</div></div>`;
  }).join('');
  const strengths = r.strengths || [];
  const gaps = r.gaps || [];
  const move = r.next_move || {};
  const nextCls = r.next_class;
  const domName = escapeHtml(((r.dimensions || []).find((d) => d.dim === r.dominant) || {}).name || r.dominant || '');
  document.getElementById('reportBody').innerHTML = `
    <div class="r-section"><div class="r-section-title">Dimension Profile</div><div class="dim-grid">${dimRows}</div></div>
    <div class="r-section"><div class="r-section-title">Profile Interpretation</div><div class="narrative-card"><p>${r.narrative || ''}</p><p>Your dominant dimension is <strong>${domName}</strong> - the capability that most defines your current contribution in human-AI work. Your Vector Signature of <strong>${escapeHtml(sign)}</strong> identifies a practitioner whose most reliable differentiator is ${escapeHtml(r.dominant_blurb || '')}.</p></div></div>
    <div class="r-section"><div class="r-section-title">Characteristic Profile</div><div class="sb-grid"><div class="sb-card"><div class="sb-title">Established strengths</div>${strengths.length ? strengths.map((d) => `<div class="sb-item"><strong>${escapeHtml(d.name)}</strong> - ${escapeHtml(d.level_name)}</div>`).join('') : '<div class="sb-item">Continue developing across all dimensions to establish clear strengths.</div>'}</div><div class="sb-card"><div class="sb-title">Development priorities</div>${gaps.length ? gaps.map((d) => `<div class="sb-item"><strong>${escapeHtml(d.name)}</strong> - ${escapeHtml(d.level_name)} - primary development target</div>`).join('') : '<div class="sb-item">Your profile is strong across dimensions. Focus on advancing your highest dimensions toward Defining.</div>'}</div></div></div>
    <div class="r-section"><div class="r-section-title">Next Vector Move</div><div class="dev-card"><div class="dev-move">${escapeHtml(move.title || '')}</div><div class="dev-desc">${escapeHtml(move.desc || '')}</div><div class="dev-practice-label">RECOMMENDED PRACTICE</div><div class="dev-practice">${escapeHtml(move.practice || '')}</div><div class="dev-timeline">${escapeHtml(move.timeline || '')}</div></div></div>
    <div class="r-section"><div class="r-section-title">VECTOR Scale</div><div class="scale-track">${scaleNodes}</div><div class="scale-desc">You are assessed at <strong>${escapeHtml(r.vector_class)} - ${escapeHtml(r.class_name || '')}</strong>. ${nextCls ? 'The next classification is <strong>' + escapeHtml(nextCls) + ' - ' + escapeHtml(r.next_class_name || '') + '</strong>. The Next Vector Move above is the specific practice that closes the gap.' : 'You are at the highest VECTOR classification.'}</div></div>`;
  showScreen('report');
}

function reportBaseName() {
  const name = (state.userData.name || 'assessment').replace(/[^\w\- ]+/g, '').trim() || 'assessment';
  return 'VECTOR-Report-' + name.replace(/\s+/g, '-');
}

function pdfStyles() {
  return `
    * { box-sizing: border-box; }
    .pdf-root { width: 720px; background: #ffffff; color: #231F20; font-family: "Source Sans 3", Arial, sans-serif; }
    .pdf-hero { background: #006E74; color: #fff; padding: 22px 24px 18px; }
    .pdf-kicker { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #7FE0EA; margin-bottom: 8px; }
    .pdf-name { font-family: "Source Serif 4", Georgia, serif; font-size: 26px; line-height: 1.2; margin: 0 0 6px; }
    .pdf-meta { font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.5; }
    .pdf-signbox { display: flex; gap: 24px; margin-top: 16px; }
    .pdf-signbox div { min-width: 140px; }
    .pdf-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #9ad7de; margin-bottom: 4px; }
    .pdf-big { font-family: "Source Serif 4", Georgia, serif; font-size: 34px; color: #7FE0EA; line-height: 1; }
    .pdf-interp { font-size: 13px; line-height: 1.45; color: #fff; max-width: 360px; }
    .pdf-body { padding: 18px 24px 12px; }
    .pdf-h { font-family: "Source Serif 4", Georgia, serif; font-size: 16px; color: #006E74; margin: 16px 0 8px; }
    .pdf-p { font-size: 12px; line-height: 1.55; margin: 0 0 10px; }
    .pdf-dim { border: 1px solid #D5E8EA; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
    .pdf-dim-top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
    .pdf-dim-name { font-size: 13px; font-weight: 600; color: #006E74; }
    .pdf-dim-level { font-size: 12px; color: #006E74; }
    .pdf-dim-text { font-size: 11px; line-height: 1.45; color: #4A5568; }
    .pdf-two { display: flex; gap: 10px; }
    .pdf-two > div { flex: 1; border: 1px solid #D5E8EA; border-radius: 8px; padding: 10px 12px; }
    .pdf-two h4 { margin: 0 0 6px; font-size: 12px; }
    .pdf-two p { margin: 0 0 6px; font-size: 11px; line-height: 1.4; }
    .pdf-move { background: #006E74; color: #fff; border-radius: 8px; padding: 12px 14px; }
    .pdf-move h3 { font-family: "Source Serif 4", Georgia, serif; font-size: 16px; color: #7FE0EA; margin: 0 0 6px; }
    .pdf-move p { font-size: 11px; line-height: 1.45; margin: 0 0 8px; color: rgba(255,255,255,0.9); }
    .pdf-scale { display: flex; gap: 6px; margin: 8px 0; }
    .pdf-scale span { flex: 1; text-align: center; border: 1px solid #D5E8EA; border-radius: 6px; padding: 6px 4px; font-size: 11px; }
    .pdf-scale span.on { background: #EEF6F7; color: #006E74; font-weight: 700; }
    .pdf-foot { font-size: 10px; color: #6B7375; border-top: 1px solid #D5E8EA; padding: 10px 24px 16px; line-height: 1.5; }
  `;
}

function buildPdfDocument(r) {
  const sign = neatVectorSign(r);
  const name = escapeHtml(state.userData.name || r.name || '');
  const role = escapeHtml(r.role_label || state.userData.role || '');
  const date = new Date(r.timestamp || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dims = (r.dimensions || []).map((d) => `
    <div class="pdf-dim">
      <div class="pdf-dim-top">
        <div class="pdf-dim-name">${escapeHtml(d.dim)} · ${escapeHtml(d.name)}</div>
        <div class="pdf-dim-level">${escapeHtml(d.level_name || '')}</div>
      </div>
      <div class="pdf-dim-text">${escapeHtml(d.interpretation || '')}</div>
    </div>`).join('');
  const strengths = (r.strengths || []).map((d) => `<p><strong>${escapeHtml(d.name)}</strong> - ${escapeHtml(d.level_name)}</p>`).join('')
    || '<p>Continue developing across all dimensions.</p>';
  const gaps = (r.gaps || []).map((d) => `<p><strong>${escapeHtml(d.name)}</strong> - ${escapeHtml(d.level_name)}</p>`).join('')
    || '<p>Profile is strong across dimensions.</p>';
  const move = r.next_move || {};
  const scale = (r.class_scale || []).map((item) =>
    `<span class="${item.id === r.vector_class ? 'on' : ''}">${escapeHtml(item.id)} ${escapeHtml(item.name)}</span>`
  ).join('');
  const root = document.createElement('div');
  root.className = 'pdf-root';
  root.innerHTML = `
    <style>${pdfStyles()}</style>
    <div class="pdf-hero">
      <div class="pdf-kicker">VECTOR Human-AI Capability Profile</div>
      <h1 class="pdf-name">${name}</h1>
      <div class="pdf-meta">${role}<br>Assessment completed: ${escapeHtml(date)}</div>
      <div class="pdf-signbox">
        <div>
          <div class="pdf-label">VECTOR Class</div>
          <div class="pdf-big">${escapeHtml(r.vector_class || '')}</div>
          <div class="pdf-meta">${escapeHtml(r.class_name || '')}</div>
        </div>
        <div>
          <div class="pdf-label">VECTOR Sign</div>
          <div class="pdf-big">${escapeHtml(sign)}</div>
        </div>
        <div class="pdf-interp">${escapeHtml(r.signature_subtitle || r.class_desc || '')}</div>
      </div>
    </div>
    <div class="pdf-body">
      <div class="pdf-h">Profile interpretation</div>
      <div class="pdf-p">${r.narrative || ''}</div>
      <div class="pdf-h">Dimension profile</div>
      ${dims}
      <div class="pdf-h">Characteristic profile</div>
      <div class="pdf-two"><div><h4>Established strengths</h4>${strengths}</div><div><h4>Development priorities</h4>${gaps}</div></div>
      <div class="pdf-h">Next VECTOR move</div>
      <div class="pdf-move">
        <h3>${escapeHtml(move.title || '')}</h3>
        <p>${escapeHtml(move.desc || '')}</p>
        <p><strong>Recommended practice.</strong> ${escapeHtml(move.practice || '')}</p>
        <p>${escapeHtml(move.timeline || '')}</p>
      </div>
      <div class="pdf-h">VECTOR scale</div>
      <div class="pdf-scale">${scale}</div>
      <p class="pdf-p">Assessed at <strong>${escapeHtml(r.vector_class || '')} - ${escapeHtml(r.class_name || '')}</strong>.</p>
    </div>
    <div class="pdf-foot">VECTOR Framework © Krishnan Nilakantan (NK). Free to use with credit.</div>
  `;
  return root;
}

function downloadPdf(filename) {
  const report = state.lastReport;
  if (!report) return Promise.reject(new Error('No report to download'));
  const doc = buildPdfDocument(report);
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:0;top:0;width:720px;background:#fff;z-index:-1;';
  holder.appendChild(doc);
  document.body.appendChild(holder);
  return window.html2pdf().set({
    margin: [8, 8, 8, 8],
    filename,
    image: { type: 'jpeg', quality: 0.96 },
    html2canvas: { scale: 1.4, useCORS: true, backgroundColor: '#ffffff', windowWidth: 720 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css'] }
  }).from(doc).save().then(function () {
    holder.remove();
  }, function () {
    holder.remove();
    throw new Error('pdf failed');
  });
}

function downloadReport(ev) {
  if (ev) ev.preventDefault();
  if (window.__vectorDownloading) return;
  window.__vectorDownloading = true;
  const btn = document.getElementById('downloadReportBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Preparing PDF...'; }
  const pdfName = reportBaseName() + '.pdf';
  const finish = function () {
    window.__vectorDownloading = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Download as PDF'; }
  };
  const run = window.html2pdf ? downloadPdf(pdfName) : Promise.reject(new Error('pdf library missing'));
  run.then(finish, function () {
    window.print();
    finish();
  });
}

document.getElementById('downloadReportBtn').addEventListener('click', downloadReport);
checkForm();
