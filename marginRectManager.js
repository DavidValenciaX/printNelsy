let currentMarginRect = null;

/**
 * Updates the current margin rectangle reference used across all event modules
 * @param {fabric.Rect} marginRect - The margin rectangle object
 */
export function updateMarginRect(marginRect) {
  currentMarginRect = marginRect;
}

/**
 * Gets the current margin rectangle reference
 * @returns {fabric.Rect|null} The current margin rectangle
 */
export function getCurrentMarginRect() {
  return currentMarginRect;
} 