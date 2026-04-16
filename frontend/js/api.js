const API = '/.netlify/functions/api';

async function call(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

const api = {
  // Health Check
  health: () => call('/health'),

  // Classes & General
  getClasses: () => call('/classes'),
  getStudents: () => call('/students'),

  // Student endpoints
  registerStudent: (data) => call('/students', { method: 'POST', body: JSON.stringify(data) }),
  markAttendance: (sessionId, face) => call('/attendance/mark', { method: 'POST', body: JSON.stringify({ session_id: sessionId, face_descriptor: face }) }),
  getStudentResults: (studentId) => call(`/student/${studentId}/results`),
  getStudentAssignments: (studentId) => call(`/student/${studentId}/assignments`),
  getStudentTimetable: (studentId) => call(`/student/${studentId}/timetable`),
  getStudentFees: (studentId) => call(`/student/${studentId}/fees`),

  // Admin endpoints
  getFinancialSummary: () => call('/admin/financial-summary'),
  getAllStudents: () => call('/admin/students'),
  getNotifications: () => call('/admin/notifications'),

  // Teacher endpoints
  getTeacherAssignments: (teacherId) => call(`/teacher/${teacherId}/assignments`),
  createAssignment: (data) => call('/teacher/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => call(`/teacher/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id) => call(`/teacher/assignments/${id}`, { method: 'DELETE' }),
  getAttendanceReport: (startDate, endDate) => call(`/teacher/attendance?from=${startDate}&to=${endDate}`),

  // Parent endpoints
  getChildResults: (childId) => call(`/parent/child/${childId}/results`),
  sendMessage: (message) => call('/parent/messages', { method: 'POST', body: JSON.stringify(message) }),

  // Fees/Payments
  processFeePayment: (data) => call('/payments/process', { method: 'POST', body: JSON.stringify(data) }),
  getAllFees: () => call('/fees')
};

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  const bgColor = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1';
  t.style.cssText = `position:fixed;bottom:20px;right:20px;padding:15px 25px;border-radius:8px;color:white;z-index:9999;background:${bgColor};font-weight:600;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}