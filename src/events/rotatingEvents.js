import { getCurrentMarginRect, updateMarginRect } from './../canvas/marginRectManager.js';
import { constrainRotationToMargin } from './../canvas/constraintUtils.js';

/**
 * Detects the rotation direction of a Fabric.js object and logs it.
 * @param {fabric.Object} obj The object being rotated.
 */
function detectRotationDirection(obj) {
  if (typeof obj._angleForDirectionDetection !== 'undefined') {
    const currentAngle = obj.angle;
    const lastAngle = obj._angleForDirectionDetection;
    let delta = currentAngle - lastAngle;

    // Normalize the delta to handle angle wrapping (e.g., from 359 to 1 degree)
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    if (delta > 0) {
      console.log('clockwise');
    } else if (delta < 0) {
      console.log('counterclockwise');
    }
  }

  // Store the current angle for the next event
  obj._angleForDirectionDetection = obj.angle;
}

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

    detectRotationDirection(obj);
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
      delete obj._angleForDirectionDetection;
    }
    if (updateArrangementStatus) updateArrangementStatus('none');
  });
}

// For backwards-compatibility with legacy imports.
export { updateMarginRect };
