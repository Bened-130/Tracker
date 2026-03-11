const API_BASE_URL = 'http://localhost:3000/api';
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

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

    async markAttendance(data) {
        return this.request('/attendance/mark', {
            method: 'POST',
            body: data
        });
    }

    async getSessionAttendance(sessionId) {
        return this.request(`/attendance/session/${sessionId}`);
    }

    async getClasses() {
        return this.request('/classes');
    }

    async getDailyReport(sessionId) {
        return this.request(`/reports/daily/${sessionId}`);
    }

    async getRosterReport(sessionId) {
        return this.request(`/reports/roster/${sessionId}`);
    }

    async getMonthlyReport(classId, startDate, endDate) {
        return this.request(`/reports/monthly/${classId}?start_date=${startDate}&end_date=${endDate}`);
    }

    async exportReport(type, format, filters) {
        const query = new URLSearchParams(filters).toString();
        window.open(`${API_BASE_URL}/reports/export/${type}/${format}?${query}`, '_blank');
    }
}

const api = new ApiService();

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-indigo-500'
    };
    
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    
    toast.className = `${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-x-full`;
    toast.innerHTML = `
        <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
        <span class="font-medium">${message}</span>
    `;
    
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}