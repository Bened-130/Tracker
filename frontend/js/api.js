/**
 * API Service
 * 
 * Handles all communication with the backend.
 * Change API_BASE_URL when deploying.
 */

// ============================================
// CONFIGURATION - UPDATE THIS WHEN DEPLOYING
// ============================================

// Local development
// const API_BASE_URL = 'http://localhost:3000/api';

// Production (update after backend deployment)
const API_BASE_URL = 'https://your-backend-url.vercel.app/api';

// ============================================
// API SERVICE CLASS
// ============================================

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Make HTTP request to API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
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
            this.showError(error.message);
            throw error;
        }
    }

    // ============================================
    // STUDENT ENDPOINTS
    // ============================================

    async getStudents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/students?${query}`);
    }

    async getStudent(id) {
        return this.request(`/students/${id}`);
    }

    async registerStudent(studentData) {
        return this.request('/students', {
            method: 'POST',
            body: studentData
        });
    }

    // ============================================
    // ATTENDANCE ENDPOINTS
    // ============================================

    async markAttendance(sessionId, faceDescriptor) {
        return this.request('/attendance/mark', {
            method: 'POST',
            body: {
                session_id: sessionId,
                face_descriptor: faceDescriptor
            }
        });
    }

    async getSessionAttendance(sessionId) {
        return this.request(`/attendance/session/${sessionId}`);
    }

    // ============================================
    // CLASS ENDPOINTS
    // ============================================

    async getClasses() {
        return this.request('/classes');
    }

    async getClass(id) {
        return this.request(`/classes/${id}`);
    }

    // ============================================
    // REPORT ENDPOINTS
    // ============================================

    async getDailyReport(sessionId) {
        return this.request(`/reports/daily/${sessionId}`);
    }

    async getRosterReport(sessionId) {
        return this.request(`/reports/roster/${sessionId}`);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    showError(message) {
        if (window.showToast) {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }
}

// Create global instance
const api = new ApiService();