// backend/services/faceRecognition.js
// Face recognition and matching algorithms

class FaceRecognitionService {
  constructor() {
    this.defaultThreshold = 0.6;
    this.highConfidenceThreshold = 0.5;
    this.lowConfidenceThreshold = 0.7;
  }

  /**
   * Compute average of multiple 128D face descriptors
   * Used when registering a student with multiple photos
   */
  computeAverageDescriptor(descriptors) {
    if (!Array.isArray(descriptors) || descriptors.length === 0) {
      throw new Error('At least one descriptor required');
    }

    // Validate all descriptors
    const dimensions = 128;
    for (const desc of descriptors) {
      const arr = Array.isArray(desc) ? desc : (desc.descriptor || desc);
      if (!Array.isArray(arr) || arr.length !== dimensions) {
        throw new Error(`Invalid descriptor format. Expected ${dimensions}-dimensional array`);
      }
    }

    const sum = new Float32Array(dimensions);

    for (const desc of descriptors) {
      const arr = Array.isArray(desc) ? desc : (desc.descriptor || desc);
      for (let i = 0; i < dimensions; i++) {
        sum[i] += arr[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      sum[i] /= descriptors.length;
    }

    // Normalize the vector
    return this.normalizeVector(Array.from(sum));
  }

  /**
   * Normalize a vector to unit length
   */
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }

  /**
   * Calculate Euclidean distance between two face descriptors
   * Lower distance = more similar faces
   */
  euclideanDistance(desc1, desc2) {
    if (!Array.isArray(desc1) || !Array.isArray(desc2)) {
      throw new Error('Descriptors must be arrays');
    }
    
    if (desc1.length !== desc2.length) {
      throw new Error(`Descriptors must have same length: ${desc1.length} vs ${desc2.length}`);
    }

    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      const diff = desc1[i] - desc2[i];
      sum += diff * diff;
    }
    
    return Math.sqrt(sum);
  }

  /**
   * Calculate cosine similarity between two descriptors
   * Returns value between -1 and 1 (1 = identical)
   */
  cosineSimilarity(desc1, desc2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < desc1.length; i++) {
      dotProduct += desc1[i] * desc2[i];
      norm1 += desc1[i] * desc1[i];
      norm2 += desc2[i] * desc2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Parse face descriptor from various formats
   */
  parseDescriptor(data) {
    if (!data) return null;
    
    // Already an array
    if (Array.isArray(data)) return data;
    
    // JSON string
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : parsed.descriptor || null;
      } catch {
        return null;
      }
    }
    
    // Object with descriptor property
    if (data.descriptor) return data.descriptor;
    
    return null;
  }

  /**
   * Find best matching student from database
   * Returns match only if distance is below threshold
   */
  findBestMatch(queryDescriptor, students, threshold = this.defaultThreshold) {
    if (!Array.isArray(queryDescriptor) || queryDescriptor.length !== 128) {
      throw new Error('Invalid query descriptor. Expected 128-dimensional array');
    }

    let bestMatch = null;
    let bestDistance = Infinity;
    let secondBestDistance = Infinity;
    const matches = [];

    for (const student of students) {
      const storedDescriptor = this.parseDescriptor(student.face_descriptors);
      
      if (!storedDescriptor || storedDescriptor.length !== 128) {
        continue;
      }

      try {
        const distance = this.euclideanDistance(queryDescriptor, storedDescriptor);
        
        matches.push({
          student_id: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          distance
        });

        if (distance < bestDistance) {
          secondBestDistance = bestDistance;
          bestDistance = distance;
          bestMatch = student;
        } else if (distance < secondBestDistance) {
          secondBestDistance = distance;
        }
      } catch (error) {
        console.error(`Error comparing with student ${student.student_id}:`, error);
        continue;
      }
    }

    // Calculate confidence metrics
    const confidence = 1 - bestDistance;
    const confidenceRatio = secondBestDistance / (bestDistance || 0.001);
    
    // Only return if confidence is good enough
    if (bestMatch && bestDistance < threshold) {
      return {
        student: bestMatch,
        distance: bestDistance,
        confidence: parseFloat(confidence.toFixed(4)),
        confidenceRatio: parseFloat(confidenceRatio.toFixed(2)),
        isHighConfidence: bestDistance < this.highConfidenceThreshold,
        allMatches: matches.sort((a, b) => a.distance - b.distance).slice(0, 5)
      };
    }

    return {
      match: null,
      bestDistance: bestDistance === Infinity ? null : bestDistance,
      confidence: bestDistance === Infinity ? 0 : parseFloat((1 - bestDistance).toFixed(4)),
      allMatches: matches.sort((a, b) => a.distance - b.distance).slice(0, 5)
    };
  }

  /**
   * Batch match multiple faces
   */
  batchMatch(queryDescriptors, students, threshold = this.defaultThreshold) {
    const results = [];
    
    for (const descriptor of queryDescriptors) {
      const result = this.findBestMatch(descriptor, students, threshold);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Validate descriptor format
   */
  validateDescriptor(descriptor) {
    if (!Array.isArray(descriptor)) {
      return { valid: false, error: 'Descriptor must be an array' };
    }
    
    if (descriptor.length !== 128) {
      return { valid: false, error: `Expected 128 dimensions, got ${descriptor.length}` };
    }
    
    if (descriptor.some(v => typeof v !== 'number' || isNaN(v))) {
      return { valid: false, error: 'All values must be valid numbers' };
    }
    
    return { valid: true };
  }
}

// Export singleton instance
module.exports = new FaceRecognitionService();