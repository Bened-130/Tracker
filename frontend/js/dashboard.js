async function loadDashboardStats() {
    try {
        const students = await api.getStudents({ limit: 1 });
        document.getElementById('totalStudents').textContent = students.count || 50;
        
        initClassChart();
        startActivityFeed();
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

function initClassChart() {
    const ctx = document.getElementById('classChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Math 101', 'Physics', 'Comp Sci', 'Literature', 'Chemistry'],
            datasets: [{
                label: 'Attendance %',
                data: [92, 88, 95, 85, 90],
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            }
        }
    });
}

function startActivityFeed() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    
    setInterval(() => {
        if (feed.children.length > 10) {
            feed.removeChild(feed.lastChild);
        }
        
        const activities = [
            { name: 'Emma Wilson', action: 'checked in', class: 'Math 101' },
            { name: 'James Brown', action: 'was marked late', class: 'Physics' },
            { name: 'Sophie Lee', action: 'checked in', class: 'Comp Sci' }
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const div = document.createElement('div');
        div.className = 'glass p-3 rounded-xl flex items-center gap-3 slide-in';
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <i data-lucide="user" class="w-4 h-4 text-indigo-400"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium">${activity.name} <span class="text-gray-400">${activity.action}</span></p>
                <p class="text-xs text-gray-500">${activity.class} • Just now</p>
            </div>
        `;
        feed.insertBefore(div, feed.firstChild);
        if (window.lucide) lucide.createIcons();
        
    }, 5000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboardStats);
} else {
    loadDashboardStats();
}