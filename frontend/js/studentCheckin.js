// Student Check-in Script
let stream = null;
let cameraActive = false;

const video = document.getElementById('cameraVideo');
const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const statusDiv = document.getElementById('statusDiv');
const statusText = document.getElementById('statusText');

// Start Camera
startBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });
    
    video.srcObject = stream;
    cameraActive = true;
    startBtn.style.display = 'none';
    captureBtn.style.display = 'block';
    
    showStatus('Camera started. Click Capture Face when ready.', 'info');
  } catch (error) {
    console.error('Camera error:', error);
    showStatus('Failed to access camera. Check browser permissions.', 'error');
  }
});

// Capture Face
captureBtn.addEventListener('click', async () => {
  try {
    // Get video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      // Send to backend for face recognition
      const formData = new FormData();
      formData.append('image', blob);
      
      try {
        const res = await fetch('/api/student/checkin', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          showStatus('✓ Attendance marked successfully!', 'success');
          captureBtn.disabled = true;
          setTimeout(() => {
            window.location.href = 'student-dashboard.html';
          }, 2000);
        } else {
          showStatus('Face not recognized. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Check-in error:', error);
        showStatus('Check-in failed. Please try again.', 'error');
      }
    });
  } catch (error) {
    console.error('Capture error:', error);
    showStatus('Failed to capture image.', 'error');
  }
});

function showStatus(message, type) {
  statusText.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});
