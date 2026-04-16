// Student Dashboard Script
let studentData = null;

async function loadResults() {
  try {
    const res = await fetch('/api/student/results');
    const results = await res.json();
    
    if (Array.isArray(results)) {
      const grid = document.getElementById('resultsGrid');
      grid.innerHTML = results.map(result => `
        <div class="card">
          <h3>${result.subject}</h3>
          <div class="value">${result.grade}</div>
          <div class="subtitle">Grade received</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading results:', error);
  }
}

async function loadAssignments() {
  try {
    const res = await fetch('/api/student/assignments');
    const assignments = await res.json();
    
    if (Array.isArray(assignments)) {
      const grid = document.getElementById('assignmentsGrid');
      grid.innerHTML = assignments.map(assignment => `
        <div class="card">
          <h3>${assignment.title}</h3>
          <div class="value">Due</div>
          <div class="subtitle">${new Date(assignment.due_date).toLocaleDateString()}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading assignments:', error);
  }
}

async function loadTimetable() {
  try {
    const res = await fetch('/api/student/timetable');
    const timetable = await res.json();
    
    if (Array.isArray(timetable)) {
      const grid = document.getElementById('timetableGrid');
      grid.innerHTML = timetable.map(item => `
        <div class="card">
          <h3>${item.day}</h3>
          <div class="value">${item.subject}</div>
          <div class="subtitle">${item.time}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading timetable:', error);
  }
}

async function loadFees() {
  try {
    const res = await fetch('/api/student/fees');
    const fees = await res.json();
    
    if (Array.isArray(fees)) {
      const grid = document.getElementById('feesGrid');
      grid.innerHTML = fees.map(fee => `
        <div class="card">
          <h3>Total Due</h3>
          <div class="value">$${fee.amount.toFixed(2)}</div>
          <div class="subtitle">Paid: $${fee.paid.toFixed(2)}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading fees:', error);
  }
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    
    // Add active to clicked tab
    e.target.classList.add('active');
    const tabName = e.target.dataset.tab;
    document.getElementById(`${tabName}-tab`).style.display = 'block';
    
    // Load data for tab
    switch(tabName) {
      case 'results':
        loadResults();
        break;
      case 'assignments':
        loadAssignments();
        break;
      case 'timetable':
        loadTimetable();
        break;
      case 'fees':
        loadFees();
        break;
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  loadResults();
});
