/**
 * Main Application JavaScript
 * 
 * Shared functionality across all pages.
 */

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

function showToast(message, type = 'info') {
    // Create container if doesn't exist
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icons[type]}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// NAVIGATION ACTIVE STATE
// ============================================

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ============================================
// DATE FORMATTING
// ============================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// LOADING STATES
// ============================================

function showLoading(element, text = 'Loading...') {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.innerHTML = `<span class="spinner"></span> ${text}`;
}

function hideLoading(element) {
    element.disabled = false;
    element.textContent = element.dataset.originalText || 'Submit';
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    
    // Load classes into select dropdowns if they exist
    loadClassOptions();
});

// ============================================
// LOAD CLASS OPTIONS
// ============================================

async function loadClassOptions() {
    const selects = document.querySelectorAll('.class-select');
    if (selects.length === 0) return;

    try {
        const response = await api.getClasses();
        const classes = response.data;

        selects.forEach(select => {
            // Keep first option (placeholder)
            const placeholder = select.options[0];
            select.innerHTML = '';
            select.appendChild(placeholder);

            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.class_id;
                option.textContent = cls.class_name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Failed to load classes:', error);
    }
}