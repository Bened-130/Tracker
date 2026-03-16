/**
 * Shared Application Logic
 */

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized');
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
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }
}

// Load classes into all dropdowns with error handling
async function loadClasses() {
  const selects = document.querySelectorAll('.class-select');
  if (!selects.length) {
    console.log('No class selects found on page');
    return;
  }

  console.log('Loading classes...');

  try {
    // First check health endpoint
    const health = await api.health();
    console.log('Health check:', health);

    if (health.database !== 'connected') {
      console.error('Database not connected');
      showToast('Warning: Database connection issue', 'warning');
    }

    // Fetch classes
    const response = await api.getClasses();
    console.log('Classes response:', response);
    
    const classes = response.data || [];
    console.log('Classes loaded:', classes.length);

    if (classes.length === 0) {
      console.warn('No classes returned from API');
      showToast('No classes found. Please create a class first.', 'warning');
    }

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
      
      console.log('Populated select with', classes.length, 'classes');
    });
    
  } catch (error) {
    console.error('Failed to load classes:', error);
    showToast('Failed to load classes: ' + error.message, 'error');
    
    // Show error in dropdowns
    selects.forEach(select => {
      select.innerHTML = '<option value="">Error loading classes</option>';
      select.disabled = true;
    });
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