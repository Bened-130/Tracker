// frontend/js/api.js
// Central API client - all HTTP requests go through here

// Change this after deploying backend
const API_BASE_URL = 'http://localhost:3000/api';
// After deployment: 'https://your-backend.vercel.app/api'

class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
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
            showToast(error.message, 'error');
            throw error;
        }
    }

    // Students
    async getStudents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/students?${query}`);
    }

    async registerStudent(studentData) {
        return this.request('/students', {
            method: 'POST',
            body: studentData
        });
    }

    // Attendance
    async markAttendance(data) {
        return this.request('/attendance/mark', {
            method: 'POST',
            body: data
        });
    }

    async getSessionAttendance(sessionId) {
        return this.request(`/attendance/session/${sessionId}`);
    }

    // Classes
    async getClasses() {
        return this.request('/classes');
    }

    // Reports
    async getDailyReport(sessionId) {
        return this.request(`/reports/daily/${sessionId}`);
    }

    async getRosterReport(sessionId) {
        return this.request(`/reports/roster/${sessionId}`);
    }

    async getMonthlyReport(classId, startDate, endDate) {
        return this.request(`/reports/monthly/${classId}?start_date=${startDate}&end_date=${endDate}`);
    }
}

// Create global instance
const api = new ApiService();

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}