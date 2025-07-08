import { getCurrentMarginRect, updateMarginRect } from './../canvas/marginRectManager.js';
import { constrainRotationToMargin } from './../canvas/constraintUtils.js';

/**
 * Registers a generic rotation handler that guarantees the rotated object
 * remains inside the printable margins no matter which corner is involved or
 * in which direction the user rotates it.
 *
 * This implementation delegates the heavy-lifting to
 * `constrainRotationToMargin` (see `constraintUtils.js`) which already applies
 * a binary-search strategy analogous to the one used for scaling
 * constraints. This keeps the event logic extremely small, fully generic and
 * very easy to reason about compared with the former thousands-of-lines of
 * bespoke maths.
 *
 * @param {fabric.Canvas} canvas                     The Fabric.js canvas.
 * @param {Object}        marginRect                 `{left, top, width, height}` rect that defines printable area.
 * @param {Function?}     updateArrangementStatus    Optional callback to signal arrangement-UI state.
 */
export function setupRotatingEvents(canvas, marginRect, updateArrangementStatus = null) {
  // Make margin rect globally accessible for other helpers (moving/scaling).
  updateMarginRect(marginRect);

  // Main rotation constraint.
  canvas.on('object:rotating', (e) => {
    const obj = e.target;

    constrainRotationToMargin(obj, getCurrentMarginRect());
    canvas.renderAll();
  });

  // Reset transient angle accumulator once the user releases the mouse.
  canvas.on('object:modified', (e) => {
    const obj = e.target;
    if (obj) {
      delete obj._lastAngle;
      delete obj._rotationState;
      delete obj._collisionDetails;
    }
    if (updateArrangementStatus) updateArrangementStatus('none');
  });
}

// For backwards-compatibility with legacy imports.
export { updateMarginRect };
