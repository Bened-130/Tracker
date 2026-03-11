// backend/services/faceRecognition.js
// Face recognition and matching algorithms

class FaceRecognitionService {
    /**
     * Compute average of multiple 128D face descriptors
     * Used when registering a student with multiple photos
     */
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

    /**
     * Calculate Euclidean distance between two face descriptors
     * Lower distance = more similar faces
     */
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

    /**
     * Find best matching student from database
     * Returns match only if distance is below threshold (0.6)
     */
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

        // Only return if confidence is good enough (distance < 0.6)
        if (bestMatch && bestDistance < threshold) {
            return {
                student: bestMatch,
                distance: bestDistance,
                confidence: 1 - bestDistance
            };
        }

        return null;
    }
}

// Export singleton instance
module.exports = new FaceRecognitionService();