import { constrainObjectToMargin } from './../canvas/constraintUtils.js';
import { getCurrentMarginRect, updateMarginRect } from './../canvas/marginRectManager.js';

export function setupMovingEvents(canvas, marginRect) {
  // Store the reference to marginRect in the centralized manager
  updateMarginRect(marginRect);

  canvas.on("object:moving", function (e) {
    constrainObjectToMargin(e.target, getCurrentMarginRect());
  });
}

// Re-export updateMarginRect for backward compatibility
export { updateMarginRect }; 