export function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
  return radians * (180 / Math.PI);
}

export function roundToDecimals(value, decimals) {
  return Number(value.toFixed(decimals));
}

export function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * AABB overlap test with padding
 * @param {Object} a - First bounding rectangle
 * @param {Object} b - Second bounding rectangle  
 * @param {number} padding - Safety gap between bounding boxes
 * @returns {boolean} - True if rectangles overlap
 */
export function checkOverlap(a, b, padding = 2) {
  return !(
    a.left + a.width + padding <= b.left ||
    b.left + b.width + padding <= a.left ||
    a.top + a.height + padding <= b.top ||
    b.top + b.height + padding <= a.top
  );
} 