const API = '/.netlify/functions/api';

async function call(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

const api = {
  health: () => call('/health'),
  getClasses: () => call('/classes'),
  getStudents: () => call('/students'),
  registerStudent: (data) => call('/students', { method: 'POST', body: JSON.stringify(data) }),
  markAttendance: (sessionId, face) => call('/attendance/mark', { method: 'POST', body: JSON.stringify({ session_id: sessionId, face_descriptor: face }) })
};

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:20px;right:20px;padding:15px 25px;border-radius:8px;color:white;z-index:9999;${type==='error'?'background:#ef4444;':'background:#10b981;'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}