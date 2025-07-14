import { constrainObjectToMargin } from './../canvas/constraintUtils.js';
import { getCurrentMarginRect, updateMarginRect } from './../canvas/marginRectManager.js';

export function setupMovingEvents(canvas, marginRect, updateArrangementStatus = null, onArrangeUpdate = () => {}) {
  // Store the reference to marginRect in the centralized manager
  updateMarginRect(marginRect);

  canvas.on("object:moving", function (e) {
    constrainObjectToMargin(e.target, getCurrentMarginRect());
  });

  canvas.on('object:modified', () => {
    if (updateArrangementStatus) {
      updateArrangementStatus('none');
      onArrangeUpdate();
    }
  });
}

// Re-export updateMarginRect for backward compatibility
export { updateMarginRect }; 