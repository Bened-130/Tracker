// Face recognition math utilities
export function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function averageDescriptors(descriptors) {
  if (!descriptors || descriptors.length === 0) return null;
  
  const length = descriptors[0].length;
  const avg = new Array(length).fill(0);
  
  for (const desc of descriptors) {
    for (let i = 0; i < length; i++) {
      avg[i] += desc[i];
    }
  }
  
  return avg.map(val => val / descriptors.length);
}