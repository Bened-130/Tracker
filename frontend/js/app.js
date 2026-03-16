/**
 * Shared Application Logic
 */

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadClasses();
  checkAuth();
  initMobileMenu();
});

// Mobile menu toggle
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

// Load classes into all dropdowns
async function loadClasses() {
  const selects = document.querySelectorAll('.class-select');
  if (!selects.length) return;

  try {
    const response = await api.getClasses();
    const classes = response.data || [];

    selects.forEach(select => {
      // Keep first option
      const firstOption = select.options[0];
      select.innerHTML = '';
      select.appendChild(firstOption);

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

// Check authentication status
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    document.body.classList.add('authenticated');
  }
}

// Logout helper
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Format helpers
function formatTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);