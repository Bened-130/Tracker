/**
 * Face Recognition Service - Fixed for Netlify
 */

const faceService = {
  modelsLoaded: false,
  modelLoadError: false,
  
  // Use a more reliable CDN
  modelUrl: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model',

  // Load models with better error handling
  async loadModels() {
    if (this.modelsLoaded) return true;
    if (this.modelLoadError) throw new Error('Models previously failed to load');
    
    try {
      console.log('Loading face-api models...');
      
      // Load models sequentially to avoid race conditions
      await faceapi.nets.tinyFaceDetector.loadFromUri(this.modelUrl);
      console.log('✓ TinyFaceDetector loaded');
      
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelUrl);
      console.log('✓ FaceLandmark68Net loaded');
      
      await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelUrl);
      console.log('✓ FaceRecognitionNet loaded');
      
      this.modelsLoaded = true;
      console.log('All models loaded successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to load face-api models:', error);
      this.modelLoadError = true;
      throw new Error(`Face recognition models failed to load: ${error.message}`);
    }
  },

  // Detect face with better error handling
  async detectFace(videoOrImage) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }
    
    // Ensure video is ready
    if (videoOrImage.readyState < 2) {
      console.log('Video not ready yet, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.detectFace(videoOrImage);
    }
    
    try {
      const detection = await faceapi
        .detectSingleFace(videoOrImage, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,  // Smaller = faster but less accurate
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection;
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  },

  // Draw detection on canvas - FIXED dimension handling
  drawDetection(canvas, detection, label = '') {
    if (!detection) return;
    
    const ctx = canvas.getContext('2d');
    
    // Match canvas to video dimensions
    const video = document.getElementById('video');
    if (video && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get detection box
    const box = detection.detection.box;
    
    // Draw box with glow effect
    ctx.save();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#4f46e5';
    ctx.shadowBlur = 10;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.restore();
    
    // Draw label
    if (label) {
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(box.x, box.y - 30, box.width, 30);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, box.x + box.width / 2, box.y - 10);
    }
    
    // Draw landmark points
    if (detection.landmarks) {
      const landmarks = detection.landmarks.positions;
      ctx.fillStyle = '#10b981';
      for (const point of landmarks) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  },

  // Create thumbnail from video
  createThumbnail(video, size = 100) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw center crop
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - minDim) / 2;
    const sy = (video.videoHeight - minDim) / 2;
    
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.8);
  },
  
  // Check if models are ready
  isReady() {
    return this.modelsLoaded;
  }
};