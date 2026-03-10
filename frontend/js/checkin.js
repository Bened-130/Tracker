let isCheckinActive = false;
let detectionInterval = null;

async function startCheckinCamera() {
    const video = document.getElementById('checkinVideo');
    await faceService.loadModels();
    await camera.start(video);
    
    isCheckinActive = true;
    showToast('Check-in camera started', 'success');
    
    detectionInterval = setInterval(async () => {
        if (!isCheckinActive) return;
        await processCheckinFrame(video);
    }, 1000);
}

function stopCheckinCamera() {
    isCheckinActive = false;
    if (detectionInterval) clearInterval(detectionInterval);
    camera.stop();
    document.getElementById('detectionOverlays').innerHTML = '';
    showToast('Camera stopped', 'info');
}

async function processCheckinFrame(video) {
    if (video.paused || video.ended) return;
    
    const canvas = document.getElementById('checkinCanvas');
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
    
    const detections = await faceService.detectAllFaces(video);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    const overlayDiv = document.getElementById('detectionOverlays');
    overlayDiv.innerHTML = '';
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const detection of resizedDetections) {
        const box = detection.detection.box;
        
        const faceDiv = document.createElement('div');
        faceDiv.className = 'face-overlay';
        faceDiv.style.left = `${box.x}px`;
        faceDiv.style.top = `${box.y}px`;
        faceDiv.style.width = `${box.width}px`;
        faceDiv.style.height = `${box.height}px`;
        
        overlayDiv.appendChild(faceDiv);
        
        if (detection.descriptor) {
            try {
                const mockMatch = await simulateMatch(detection.descriptor);
                
                if (mockMatch && mockMatch.distance < 0.6) {
                    faceDiv.classList.add('matched');
                    await markAttendance(mockMatch);
                } else {
                    faceDiv.classList.add('unknown');
                }
            } catch (error) {
                console.error('Matching error:', error);
            }
        }
    }
}

async function simulateMatch(descriptor) {
    const mockStudents = [
        { student_id: 1, first_name: 'Alice', last_name: 'Johnson' },
        { student_id: 2, first_name: 'Bob', last_name: 'Smith' }
    ];
    
    const randomStudent = mockStudents[Math.floor(Math.random() * mockStudents.length)];
    const mockDistance = 0.3 + Math.random() * 0.3;
    
    return {
        student: randomStudent,
        distance: mockDistance,
        confidence: 1 - mockDistance
    };
}

async function markAttendance(match) {
    const sessionId = document.getElementById('checkinClass').value;
    if (!sessionId) return;
    
    const recentList = document.getElementById('recentVerifications');
    const existing = Array.from(recentList.children).find(el => 
        el.textContent.includes(match.student.first_name)
    );
    
    if (existing) return;
    
    try {
        const result = await api.markAttendance({
            session_id: parseInt(sessionId),
            face_descriptor: Array.from(new Float32Array(128).map(() => Math.random()))
        });
        
        showVerificationResult(match.student, match.confidence);
        addToRecentVerifications(match.student, match.confidence);
        
    } catch (error) {
        if (error.message.includes('already marked')) {
            showToast(`${match.student.first_name} already checked in`, 'info');
        }
    }
}

function showVerificationResult(student, confidence) {
    const resultDiv = document.getElementById('verificationResult');
    const iconDiv = document.getElementById('resultIcon');
    const textDiv = document.getElementById('resultText');
    const subtextDiv = document.getElementById('resultSubtext');
    
    resultDiv.classList.remove('hidden');
    iconDiv.className = 'w-12 h-12 rounded-full flex items-center justify-center bg-green-500/20';
    iconDiv.innerHTML = '<i data-lucide="check" class="w-6 h-6 text-green-400"></i>';
    textDiv.textContent = `${student.first_name} ${student.last_name}`;
    textDiv.className = 'font-bold text-lg text-green-400';
    subtextDiv.textContent = `Confidence: ${(confidence * 100).toFixed(1)}% • ${new Date().toLocaleTimeString()}`;
    
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => {
        resultDiv.classList.add('hidden');
    }, 3000);
}

function addToRecentVerifications(student, confidence) {
    const container = document.getElementById('recentVerifications');
    const div = document.createElement('div');
    div.className = 'glass p-3 rounded-xl flex items-center gap-3 slide-in';
    div.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <i data-lucide="check" class="w-5 h-5 text-green-400"></i>
        </div>
        <div class="flex-1">
            <p class="font-medium text-sm">${student.first_name} ${student.last_name}</p>
            <p class="text-xs text-gray-400">Just now</p>
        </div>
        <div class="text-xs text-green-400 font-mono">${(1-confidence).toFixed(2)}</div>
    `;
    container.insertBefore(div, container.firstChild);
    if (window.lucide) lucide.createIcons();
    
    const presentCounter = document.getElementById('todayPresent');
    if (presentCounter) {
        presentCounter.textContent = parseInt(presentCounter.textContent) + 1;
    }
}