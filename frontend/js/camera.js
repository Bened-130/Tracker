class CameraService {
    constructor() {
        this.stream = null;
        this.videoElement = null;
    }

    async start(videoElement, options = {}) {
        this.videoElement = videoElement;
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    ...options.video
                },
                audio: false
            });
            
            videoElement.srcObject = this.stream;
            
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve(this.stream);
                };
            });
        } catch (error) {
            console.error('Camera error:', error);
            showToast('Camera access denied. Please allow camera permissions.', 'error');
            throw error;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    captureFrame(canvas, video) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    createThumbnail(video, size = 100) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, size, size);
        return canvas.toDataURL('image/jpeg');
    }
}

const camera = new CameraService();