/**
 * API Service - Netlify Functions Version
 */

const API_BASE = '/.netlify/functions/api';

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// API Methods
const api = {
  // Health check
  health: () => apiCall('/health'),

  // Students
  getStudents: () => apiCall('/students'),
  getStudent: (id) => apiCall(`/students/${id}`),
  registerStudent: (data) => apiCall('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Attendance
  markAttendance: (sessionId, faceDescriptor) => apiCall('/attendance/mark', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      face_descriptor: faceDescriptor
    })
  }),
  getSessionAttendance: (sessionId) => apiCall(`/attendance/session/${sessionId}`),
  markManualAttendance: (data) => apiCall('/attendance/manual', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Classes
  getClasses: () => apiCall('/classes'),
  getClass: (id) => apiCall(`/classes/${id}`),
  createClass: (data) => apiCall('/classes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Reports
  getDailyReport: (sessionId) => apiCall(`/reports/daily/${sessionId}`),
  getRosterReport: (sessionId) => apiCall(`/reports/roster/${sessionId}`),
  getMonthlyReport: (classId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/reports/monthly/${classId}?${query}`);
  }
};

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: #10b981;' : 
      type === 'error' ? 'background: #ef4444;' : 
      type === 'warning' ? 'background: #f59e0b;' : 'background: #4f46e5;'}
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}