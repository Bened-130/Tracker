async function loadClasses() {
  const selects = document.querySelectorAll('.class-select');
  if (!selects.length) return;

  try {
    const res = await api.getClasses();
    console.log('Classes response:', res);
    
    const classes = res.data || [];
    
    selects.forEach(sel => {
      sel.innerHTML = '<option value="">Select a class</option>';
      classes.forEach(c => {
        sel.innerHTML += `<option value="${c.class_id}">${c.class_name}</option>`;
      });
    });
    
    if (classes.length === 0) {
      showToast('No classes found. Run SQL setup.', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Failed to load classes', 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadClasses);