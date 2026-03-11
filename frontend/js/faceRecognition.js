class FaceRecognitionService {
    constructor() {
        this.modelsLoaded = false;
        this.detectionOptions = new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 512, 
            scoreThreshold: 0.5 
        });
    }

    async loadModels() {
        if (this.modelsLoaded) return;
        
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            
            this.modelsLoaded = true;
            console.log('Face recognition models loaded');
            showToast('Face recognition ready', 'success');
        } catch (error) {
            console.error('Error loading models:', error);
            showToast('Failed to load face recognition models', 'error');
            throw error;
        }
    }

    async detectFace(videoOrCanvas) {
        if (!this.modelsLoaded) await this.loadModels();
        
        const detection = await faceapi
            .detectSingleFace(videoOrCanvas, this.detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        return detection;
    }

    async detectAllFaces(videoOrCanvas) {
        if (!this.modelsLoaded) await this.loadModels();
        
        const detections = await faceapi
            .detectAllFaces(videoOrCanvas, this.detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        return detections;
    }

    computeAverageDescriptor(descriptors) {
        if (!Array.isArray(descriptors) || descriptors.length === 0) {
            throw new Error('At least one descriptor required');
        }

        const dimensions = descriptors[0].length;
        const sum = new Float32Array(dimensions);

        for (const desc of descriptors) {
            for (let i = 0; i < dimensions; i++) {
                sum[i] += desc[i];
            }
        }

        for (let i = 0; i < dimensions; i++) {
            sum[i] /= descriptors.length;
        }

        return Array.from(sum);
    }

    euclideanDistance(desc1, desc2) {
        let sum = 0;
        for (let i = 0; i < desc1.length; i++) {
            const diff = desc1[i] - desc2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    drawDetection(canvas, detection, match = null) {
        const ctx = canvas.getContext('2d');
        const box = detection.detection.box;
        
        ctx.strokeStyle = match ? '#10b981' : '#6366f1';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        faceapi.draw.drawFaceLandmarks(canvas, [detection]);
        
        if (match) {
            ctx.fillStyle = '#10b981';
            ctx.font = '16px Inter';
            ctx.fillText(
                `${match.name} (${(match.confidence * 100).toFixed(1)}%)`,
                box.x,
                box.y - 10
            );
        }
    }
}

const faceService = new FaceRecognitionService();