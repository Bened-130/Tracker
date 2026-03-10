let registrationPhotos = [];

async function startRegistrationCamera() {
    const video = document.getElementById('regVideo');
    await faceService.loadModels();
    await camera.start(video);
    
    document.getElementById('captureBtn').disabled = false;
    document.getElementById('captureBtn').classList.remove('cursor-not-allowed', 'bg-gray-700', 'text-gray-400');
    document.getElementById('captureBtn').classList.add('bg-indigo-600', 'hover:bg-indigo-500', 'text-white');
    document.getElementById('regScanLine').classList.remove('hidden');
    
    showToast('Camera started - Position your face', 'info');
}

async function capturePhoto() {
    const video = document.getElementById('regVideo');
    const canvas = document.getElementById('regCanvas');
    
    const detection = await faceService.detectFace(video);
    
    if (!detection) {
        showToast('No face detected - please adjust position', 'warning');
        return;
    }
    
    registrationPhotos.push(Array.from(detection.descriptor));
    
    faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });
    faceService.drawDetection(canvas, detection);
    
    document.getElementById('captureCount').textContent = registrationPhotos.length;
    
    const thumbUrl = camera.createThumbnail(video);
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'aspect-square rounded-lg overflow-hidden border-2 border-indigo-500/50';
    thumbDiv.innerHTML = `<img src="${thumbUrl}" class="w-full h-full object-cover">`;
    document.getElementById('photoPreview').appendChild(thumbDiv);
    
    if (registrationPhotos.length >= 5) {
        document.getElementById('submitRegBtn').disabled = false;
        document.getElementById('regStatus').textContent = 'Ready to submit';
        document.getElementById('regStatus').className = 'glass px-3 py-1 rounded-full text-xs text-green-400';
        showToast('Minimum 5 photos captured - you can submit now', 'success');
    } else {
        showToast(`Photo ${registrationPhotos.length} captured - need ${5 - registrationPhotos.length} more`, 'info');
    }
    
    const flash = document.createElement('div');
    flash.className = 'absolute inset-0 bg-white/50 pointer-events-none';
    video.parentElement.appendChild(flash);
    setTimeout(() => flash.remove(), 100);
}

async function submitRegistration() {
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const email = document.getElementById('regEmail').value;
    const classId = document.getElementById('regClass').value;
    
    if (!firstName || !lastName || !email) {
        showToast('Please fill all required fields', 'warning');
        return;
    }
    
    try {
        const averagedDescriptor = faceService.computeAverageDescriptor(registrationPhotos);
        
        await api.registerStudent({
            first_name: firstName,
            last_name: lastName,
            email: email,
            class_id: classId || null,
            face_descriptors: registrationPhotos
        });
        
        showToast(`Student ${firstName} ${lastName} registered successfully!`, 'success');
        
        registrationPhotos = [];
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('captureCount').textContent = '0';
        document.getElementById('regFirstName').value = '';
        document.getElementById('regLastName').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('submitRegBtn').disabled = true;
        
        camera.stop();
        
    } catch (error) {
        showToast('Registration failed: ' + error.message, 'error');
    }
}

async function loadClasses() {
    try {
        const response = await api.getClasses();
        const selects = ['regClass', 'checkinClass', 'reportClass'];
        
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            
            response.data.forEach(cls => {
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadClasses);
} else {
    loadClasses();
}