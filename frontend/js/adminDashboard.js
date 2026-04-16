// Admin Dashboard Script
let financialData = null;
let notificationsData = [];

async function loadFinancialData() {
  try {
    // Load financial summary
    const feesRes = await fetch('/api/fees');
    const fees = await feesRes.json();
    
    if (Array.isArray(fees)) {
      const totalDue = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
      const totalPaid = fees.reduce((sum, f) => sum + (f.paid || 0), 0);
      const totalPending = totalDue - totalPaid;
      const collectionRate = totalDue > 0 ? ((totalPaid / totalDue) * 100).toFixed(1) : 0;

      financialData = {
        totalDue,
        totalPaid,
        totalPending,
        collectionRate,
        allFees: fees
      };

      // Update UI
      document.getElementById('totalDue').textContent = `$${totalDue.toFixed(2)}`;
      document.getElementById('totalPaid').textContent = `$${totalPaid.toFixed(2)}`;
      document.getElementById('totalPending').textContent = `$${totalPending.toFixed(2)}`;
      document.getElementById('collectionRate').textContent = `${collectionRate}%`;

      // Populate payments table
      const tbody = document.getElementById('paymentsBody');
      tbody.innerHTML = fees.slice(0, 10).map(fee => `
        <tr>
          <td>${fee.student_name || 'N/A'}</td>
          <td>$${fee.amount.toFixed(2)}</td>
          <td>${new Date(fee.payment_date).toLocaleDateString()}</td>
          <td><span class="badge ${fee.status === 'paid' ? 'badge-paid' : 'badge-pending'}">${fee.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading financial data:', error);
  }
}

async function loadNotifications() {
  try {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    
    if (Array.isArray(data)) {
      notificationsData = data;
      
      const tbody = document.getElementById('notificationsBody');
      tbody.innerHTML = data.slice(0, 10).map(notif => `
        <tr>
          <td>${notif.message}</td>
          <td><span class="badge" style="background: rgba(99, 102, 241, 0.2); color: var(--primary);">${notif.type}</span></td>
          <td>${new Date(notif.created_at).toLocaleDateString()}</td>
          <td><span class="badge" style="background: rgba(100, 200, 100, 0.2); color: #10b981;">Delivered</span></td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Subscribe to real-time updates
function subscribeToUpdates() {
  // This would connect to WebSocket or Supabase realtime
  console.log('Subscribing to real-time payment updates...');
  
  // Reload data every 30 seconds
  setInterval(() => {
    loadFinancialData();
    loadNotifications();
  }, 30000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadFinancialData();
  loadNotifications();
  subscribeToUpdates();
});
