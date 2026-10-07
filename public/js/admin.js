const API = '';
let allResults = [];
let adminToken = '';

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(screen).classList.add('active');
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      document.getElementById('login-error').textContent = 'Invalid credentials';
      return;
    }
    const data = await res.json();
    adminToken = data.token;
    localStorage.setItem('admin-token', adminToken);
    showScreen('dashboard-screen');
    loadResults();
  } catch (err) {
    document.getElementById('login-error').textContent = 'Error: ' + err.message;
  }
}

async function loadResults() {
  try {
    const res = await fetch(`${API}/api/admin/results`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.ok) {
      logout();
      return;
    }
    const data = await res.json();
    allResults = data.results || [];
    updateStats();
    displayResults(allResults);
  } catch (err) {
    alert('Error loading results: ' + err.message);
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = allResults.length;
  document.getElementById('stat-users').textContent = new Set(allResults.map((r) => r.email)).size;
  const repeats = allResults.filter((r) => Number(r.attempt) > 1).length;
  const latest = allResults.reduce((max, r) => Math.max(max, Number(r.attempt) || 0), 0);
  document.getElementById('stat-repeats').textContent = repeats;
  document.getElementById('stat-latest').textContent = latest;
}

function displayResults(results) {
  const tbody = document.getElementById('table-body');
  if (!results.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#6B7375">No results found</td></tr>';
    return;
  }
  tbody.innerHTML = results.map((r) => `
    <tr>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.role_label || r.role)}</td>
      <td>${escapeHtml(r.attempt)}</td>
      <td><strong style="color:#006E74">${escapeHtml(r.vector_sign)}</strong></td>
      <td>${escapeHtml(r.vector_class)}</td>
      <td>${r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</td>
      <td><button class="btn-print" style="padding:6px 12px" onclick="viewUserAttempts('${escapeHtml(r.email)}')">View</button></td>
    </tr>
  `).join('');
}

function filterResults() {
  const role = document.getElementById('filter-role').value;
  const email = document.getElementById('search-email').value.toLowerCase();
  displayResults(allResults.filter((r) => {
    const matchRole = !role || r.role === role;
    const matchEmail = !email || String(r.email || '').toLowerCase().includes(email);
    return matchRole && matchEmail;
  }));
}

async function viewUserAttempts(email) {
  try {
    const res = await fetch(`${API}/api/admin/users/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    document.getElementById('modalTitle').textContent = `${email} - ${data.count} attempt(s)`;
    document.getElementById('modalBody').innerHTML = (data.attempts || []).map((att) => `
      <div style="margin:12px 0;padding:14px;background:#EEF6F7;border-radius:8px">
        <strong>Attempt ${att.attempt}</strong><br>
        Vector Sign: ${escapeHtml(att.vector_sign)} · Class: ${escapeHtml(att.vector_class)}<br>
        Levels: V ${escapeHtml(att.levels.V)} · E ${escapeHtml(att.levels.E)} · C ${escapeHtml(att.levels.C)} · T ${escapeHtml(att.levels.T)} · O ${escapeHtml(att.levels.O)} · R ${escapeHtml(att.levels.R)}<br>
        ${att.timestamp ? new Date(att.timestamp).toLocaleString() : ''}
      </div>
    `).join('') || '<p>No attempts.</p>';
    document.getElementById('attemptModal').classList.add('open');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function closeModal() {
  document.getElementById('attemptModal').classList.remove('open');
}

async function downloadExcel() {
  try {
    const res = await fetch(`${API}/api/admin/export`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.ok) {
      alert('Error downloading file');
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VECTOR-Assessment-Results.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function logout() {
  localStorage.removeItem('admin-token');
  adminToken = '';
  showScreen('login-screen');
  document.getElementById('admin-email').value = '';
  document.getElementById('admin-password').value = '';
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

window.addEventListener('load', () => {
  const savedToken = localStorage.getItem('admin-token');
  if (savedToken) {
    adminToken = savedToken;
    showScreen('dashboard-screen');
    loadResults();
  }
});
