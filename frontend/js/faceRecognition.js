/**
 * Face Recognition Service
 * 
 * Wrapper for face-api.js to handle face detection and descriptor extraction.
 */

const faceService = {
  modelsLoaded: false,
  
  // Model URLs from CDN
  modelUrl: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model',

  // Load models
  async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelUrl)
      ]);
      
      this.modelsLoaded = true;
      console.log('Face-api models loaded');
    } catch (error) {
      console.error('Failed to load face-api models:', error);
      throw new Error('Face recognition models failed to load');
    }
  },

  // Detect face and get descriptor
  async detectFace(videoOrImage) {
    await this.loadModels();
    
    const detection = await faceapi
      .detectSingleFace(videoOrImage, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection;
  },

  // Draw detection on canvas
  drawDetection(canvas, detection, label = '') {
    const ctx = canvas.getContext('2d');
    const dims = faceapi.matchDimensions(canvas, video, true);
    const resized = faceapi.resizeResults(detection, dims);
    
    // Draw box
    const box = resized.detection.box;
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Draw label
    if (label) {
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(box.x, box.y - 25, box.width, 25);
      ctx.fillStyle = 'white';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(label, box.x + box.width / 2, box.y - 7);
    }
  },

  // Create thumbnail from video
  createThumbnail(video, size = 100) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.8);
  }
};