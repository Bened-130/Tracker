/**
 * API Service - Netlify Functions Version with Error Handling
 */

const API_BASE = '/.netlify/functions/api';

// Helper for API calls with detailed error handling
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
    console.log('API Call:', { url, method: options.method || 'GET' });
    
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log('API Response:', { status: response.status, success: data.success });
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
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
  // Remove existing toasts
  const existing = document.querySelectorAll('.toast');
  existing.forEach(t => t.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    color: white;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 400px;
    word-wrap: break-word;
    ${type === 'success' ? 'background: linear-gradient(135deg, #10b981, #059669);' : 
      type === 'error' ? 'background: linear-gradient(135deg, #ef4444, #dc2626);' : 
      type === 'warning' ? 'background: linear-gradient(135deg, #f59e0b, #d97706);' : 
      'background: linear-gradient(135deg, #6366f1, #4f46e5);'}
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}