// ============================================
// AUTHENTICATION & ROLE MANAGEMENT
// ============================================

let selectedRole = null;

// Demo user credentials
const DEMO_USERS = {
    admin: {
        email: 'admin@school.com',
        password: 'admin123',
        name: 'Administrator'
    },
    teacher: {
        email: 'teacher@school.com',
        password: 'teacher123',
        name: 'John Teacher'
    },
    student: {
        email: 'student@school.com',
        password: 'student123',
        name: 'Jane Student'
    },
    parent: {
        email: 'parent@school.com',
        password: 'parent123',
        name: 'Parent Guardian'
    }
};

// ROLE-BASED DASHBOARD MAPPING
const ROLE_DASHBOARDS = {
    admin: '/admin-dashboard.html',
    teacher: '/teacher-dashboard.html',
    student: '/student-dashboard.html',
    parent: '/parent-portal.html'
};

// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================

class AuthManager {
    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('authToken', btoa(JSON.stringify(user))); // Simple token
    }

    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    static getUserRole() {
        return localStorage.getItem('userRole');
    }

    static isAuthenticated() {
        return localStorage.getItem('authToken') !== null;
    }

    static logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    }

    static getCurrentDashboard() {
        const role = this.getUserRole();
        return ROLE_DASHBOARDS[role] || '/login.html';
    }
}

// ============================================
// UI INTERACTIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (AuthManager.isAuthenticated()) {
        const dashboard = AuthManager.getCurrentDashboard();
        window.location.href = dashboard;
        return;
    }

    // Role button handlers
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', selectRole);
    });

    // Form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Clear errors on input
    document.getElementById('email').addEventListener('focus', clearError);
    document.getElementById('password').addEventListener('focus', clearError);
});

// Role Selection
function selectRole(e) {
    e.preventDefault();
    
    // Remove active state from all buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active state to clicked button
    e.target.classList.add('active');
    selectedRole = e.target.dataset.role;
    
    // Clear role error
    const roleError = document.getElementById('roleError');
    roleError.style.display = 'none';
}

// Clear Errors
function clearError() {
    document.getElementById('emailError').style.display = 'none';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
}

// Validate Email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    // Reset messages
    clearError();
    document.getElementById('loginSuccess').style.display = 'none';
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.getElementById('loginBtn');

    // Validation
    let hasError = false;

    if (!selectedRole) {
        document.getElementById('roleError').style.display = 'block';
        hasError = true;
    }

    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        document.getElementById('emailError').style.display = 'block';
        hasError = true;
    } else if (!validateEmail(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email';
        document.getElementById('emailError').style.display = 'block';
        hasError = true;
    }

    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        document.getElementById('passwordError').style.display = 'block';
        hasError = true;
    }

    if (hasError) return;

    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check demo credentials
        const demoUser = DEMO_USERS[selectedRole];
        
        if (email === demoUser.email && password === demoUser.password) {
            // Login success
            const user = {
                id: `${selectedRole}_001`,
                name: demoUser.name,
                email: email,
                role: selectedRole,
                loginTime: new Date().toISOString()
            };

            AuthManager.setUser(user);

            // Show success message
            const successMsg = document.getElementById('loginSuccess');
            successMsg.textContent = `Welcome ${user.name}!`;
            successMsg.style.display = 'block';

            // Redirect after success
            setTimeout(() => {
                const dashboard = AuthManager.getCurrentDashboard();
                window.location.href = dashboard;
            }, 800);

        } else {
            // Invalid credentials
            document.getElementById('loginError').textContent = 'Invalid email or password for this role';
            document.getElementById('loginError').style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }

    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginError').textContent = 'An error occurred. Please try again.';
        document.getElementById('loginError').style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// ============================================
// ROLE-BASED PAGE ACCESS CONTROL
// ============================================

function requireAuth() {
    if (!AuthManager.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function requireRole(...allowedRoles) {
    if (!AuthManager.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }

    const userRole = AuthManager.getUserRole();
    if (!allowedRoles.includes(userRole)) {
        alert(`Access denied. This page requires ${allowedRoles.join(' or ')} role.`);
        window.location.href = AuthManager.getCurrentDashboard();
        return false;
    }
    return true;
}

// ============================================
// SETUP LOGOUT BUTTON IN NAVIGATION
// ============================================

function setupLogoutButton() {
    // Create logout button if it doesn't exist
    let logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn && AuthManager.isAuthenticated()) {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            logoutBtn = document.createElement('li');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.innerHTML = `
                <a href="#" class="nav-link" onclick="handleLogout(event)">
                    Logout (${AuthManager.getUserRole().toUpperCase()})
                </a>
            `;
            navLinks.appendChild(logoutBtn);
        }
    }
}

function handleLogout(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        AuthManager.logout();
    }
}

// Call setup function when page loads if authenticated
if (AuthManager.isAuthenticated()) {
    document.addEventListener('DOMContentLoaded', setupLogoutButton);
}

// ============================================
// ROLE-SPECIFIC NAVIGATION SETUP
// ============================================

function setupRoleBasedNavigation() {
    if (!AuthManager.isAuthenticated()) return;

    const userRole = AuthManager.getUserRole();
    const navLinks = document.querySelectorAll('.nav-links a');

    // Define role-specific accessible pages
    const ROLE_PAGES = {
        admin: ['admin-dashboard', 'dashboard', 'reports'],
        teacher: ['teacher-dashboard', 'dashboard', 'classes', 'reports', 'attendance'],
        student: ['student-dashboard', 'student-checkin', 'checkin', 'dashboard'],
        parent: ['parent-portal', 'reports', 'dashboard']
    };

    const allowedPages = ROLE_PAGES[userRole] || [];

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const isAllowed = allowedPages.some(page => href.includes(page));
        
        // Hide unauthorized pages
        if (!isAllowed && !href.includes('index') && !href.includes('login')) {
            link.parentElement.style.display = 'none';
        }
    });

    setupLogoutButton();
}

// ============================================
// AUTO-SETUP ON DOM LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (document.location.pathname !== '/login.html' && 
        !document.location.pathname.endsWith('login.html')) {
        requireAuth();
        setupRoleBasedNavigation();
    }
});
