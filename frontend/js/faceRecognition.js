/**
 * Face Recognition Service
 * 
 * Uses face-api.js to detect and recognize faces.
 */

// ============================================
// CONFIGURATION
// ============================================

// CDN for face-api.js models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

// ============================================
// FACE RECOGNITION CLASS
// ============================================

class FaceRecognitionService {
    constructor() {
        this.modelsLoaded = false;
        this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.5
        });
    }

    /**
     * Load face detection models
     */
    async loadModels() {
        if (this.modelsLoaded) return;

        try {
            showToast('Loading face recognition models...', 'info');

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);

            this.modelsLoaded = true;
            showToast('Face recognition ready', 'success');
            console.log('✅ Face models loaded');
        } catch (error) {
            console.error('Failed to load models:', error);
            showToast('Failed to load face recognition', 'error');
            throw error;
        }
    }

    /**
     * Detect single face in video/image
     */
    async detectFace(videoOrCanvas) {
        if (!this.modelsLoaded) await this.loadModels();

        const detection = await faceapi
            .detectSingleFace(videoOrCanvas, this.detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();

        return detection;
    }

    /**
     * Detect all faces in video/image
     */
    async detectAllFaces(videoOrCanvas) {
        if (!this.modelsLoaded) await this.loadModels();

        const detections = await faceapi
            .detectAllFaces(videoOrCanvas, this.detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();

        return detections;
    }

    /**
     * Calculate average of multiple face descriptors
     */
    computeAverageDescriptor(descriptors) {
        if (!Array.isArray(descriptors) || descriptors.length === 0) {
            throw new Error('At least one descriptor required');
        }

        const dimensions = 128;
        const sum = new Array(dimensions).fill(0);

        for (const desc of descriptors) {
            for (let i = 0; i < dimensions; i++) {
                sum[i] += desc[i];
            }
        }

        return sum.map(val => val / descriptors.length);
    }

    /**
     * Draw detection box on canvas
     */
    drawDetection(canvas, detection, label = null) {
        const ctx = canvas.getContext('2d');
        const box = detection.detection.box;

        // Draw box
        ctx.strokeStyle = label ? '#10b981' : '#4f46e5';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw label if provided
        if (label) {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(label, box.x, box.y - 10);
        }

        // Draw landmarks
        faceapi.draw.drawFaceLandmarks(canvas, [detection]);
    }

    /**
     * Create thumbnail from video
     */
    createThumbnail(video, size = 100) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, size, size);
        return canvas.toDataURL('image/jpeg');
    }
}

// Create global instance
const faceService = new FaceRecognitionService();