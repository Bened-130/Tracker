document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized');
  loadClasses();
  checkAuth();
  initMobileMenu();
});

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

async function loadClasses() {
  const selects = document.querySelectorAll('.class-select');
  if (!selects.length) return;

  console.log('Loading classes...');

  try {
    // Test health first
    const health = await api.health();
    console.log('Health check:', health);

    if (health.database !== 'connected') {
      console.error('Database not connected:', health.dbError);
      showToast('Database connection failed: ' + (health.dbError || 'Unknown error'), 'error');
      selects.forEach(select => {
        select.innerHTML = '<option value="">Database error</option>';
        select.disabled = true;
      });
      return;
    }

    // Fetch classes
    const response = await api.getClasses();
    console.log('Classes loaded:', response);
    
    const classes = response.data || [];

    selects.forEach(select => {
      select.innerHTML = '<option value="">Select a class</option>';
      
      if (classes.length === 0) {
        select.innerHTML += '<option value="" disabled>No classes available</option>';
      } else {
        classes.forEach(cls => {
          const option = document.createElement('option');
          option.value = cls.class_id;
          option.textContent = cls.class_name;
          select.appendChild(option);
        });
      }
    });
    
    if (classes.length === 0) {
      showToast('No classes found. Please create classes in Supabase.', 'warning');
    }
    
  } catch (error) {
    console.error('Failed to load classes:', error);
    showToast('Failed to load classes: ' + error.message, 'error');
    
    selects.forEach(select => {
      select.innerHTML = '<option value="">Error loading</option>';
      select.disabled = true;
    });
  }
}

function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    document.body.classList.add('authenticated');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

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