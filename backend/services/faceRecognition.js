class FaceRecognitionService {
    computeAverageDescriptor(descriptors) {
        if (!Array.isArray(descriptors) || descriptors.length === 0) {
            throw new Error('At least one descriptor required');
        }

        const dimensions = descriptors[0].length;
        const sum = new Float32Array(dimensions);

        for (const desc of descriptors) {
            if (desc.length !== dimensions) {
                throw new Error('All descriptors must have same dimensions');
            }
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
        if (desc1.length !== desc2.length) {
            throw new Error('Descriptors must have same length');
        }

        let sum = 0;
        for (let i = 0; i < desc1.length; i++) {
            const diff = desc1[i] - desc2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    findBestMatch(queryDescriptor, students, threshold = 0.6) {
        let bestMatch = null;
        let bestDistance = Infinity;

        for (const student of students) {
            if (!student.face_descriptors) continue;

            try {
                const storedDescriptor = typeof student.face_descriptors === 'string' 
                    ? JSON.parse(student.face_descriptors)
                    : student.face_descriptors;

                const distance = this.euclideanDistance(queryDescriptor, storedDescriptor);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = student;
                }
            } catch (error) {
                console.error(`Error comparing with student ${student.student_id}:`, error);
                continue;
            }
        }

        if (bestMatch && bestDistance < threshold) {
            return {
                student: bestMatch,
                distance: bestDistance,
                confidence: 1 - bestDistance
            };
        }

        return null;
    }

    isValidDescriptor(descriptor) {
        return Array.isArray(descriptor) 
            && descriptor.length === 128 
            && descriptor.every(n => typeof n === 'number' && !isNaN(n));
    }

    normalize(descriptor) {
        const magnitude = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0));
        return descriptor.map(val => val / magnitude);
    }
}

module.exports = new FaceRecognitionService();