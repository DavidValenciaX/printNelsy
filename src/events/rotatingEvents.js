import { getCurrentMarginRect, updateMarginRect } from './../canvas/marginRectManager.js';
import { constrainRotationToMargin } from './../canvas/constraintUtils.js';

// Constants for rotation handling
const LARGE_ANGLE_JUMP_THRESHOLD = 5; // degrees
const INTERPOLATION_STEP_SIZE = 2; // degrees
const ANGLE_WRAP_THRESHOLD = 180; // degrees
const DIRECTION_CLOCKWISE = 'clockwise';
const DIRECTION_COUNTERCLOCKWISE = 'counterclockwise';

/**
 * Detects the rotation direction of a Fabric.js object with interpolation
 * to handle large angle jumps during fast rotations.
 * @param {fabric.Object} obj The object being rotated.
 * @returns {string|null} 'clockwise', 'counterclockwise', or null if no direction detected.
 */
function detectRotationDirection(obj) {
  let direction = null;
  
  if (typeof obj._angleForDirectionDetection !== 'undefined') {
    const currentAngle = obj.angle;
    const lastAngle = obj._angleForDirectionDetection;
    let delta = currentAngle - lastAngle;

    // Normalize the delta to handle angle wrapping (e.g., from 359 to 1 degree)
    if (delta > ANGLE_WRAP_THRESHOLD) {
      delta -= 360;
    } else if (delta < -ANGLE_WRAP_THRESHOLD) {
      delta += 360;
    }

    // Check for large angle jumps that need interpolation
    const isLargeJump = Math.abs(delta) > LARGE_ANGLE_JUMP_THRESHOLD;
    
    if (isLargeJump) {
      console.log(`Large angle jump detected: ${delta.toFixed(2)}°, applying interpolation`);
      
      // Calculate interpolation steps
      const steps = Math.ceil(Math.abs(delta) / INTERPOLATION_STEP_SIZE);
      const stepSize = delta / steps;
      const stepDirection = stepSize > 0 ? DIRECTION_CLOCKWISE : DIRECTION_COUNTERCLOCKWISE;
      
      // Process each intermediate angle
      for (let i = 1; i <= steps; i++) {
        const intermediateAngle = lastAngle + (stepSize * i);
        
        // Temporarily set the intermediate angle
        obj.angle = intermediateAngle;
        obj.setCoords();
        
        // Apply constraints at each step
        constrainRotationToMargin(obj, getCurrentMarginRect(), stepDirection);
        
        // Break early if object gets blocked to avoid unnecessary processing
        if (obj._rotationState === 'blocked') {
          console.log(`Object blocked at intermediate angle: ${intermediateAngle.toFixed(2)}°`);
          break;
        }
      }
    }

    // Determine final direction
    if (delta > 0) {
      direction = DIRECTION_CLOCKWISE;
      console.log(DIRECTION_CLOCKWISE);
    } else if (delta < 0) {
      direction = DIRECTION_COUNTERCLOCKWISE;
      console.log(DIRECTION_COUNTERCLOCKWISE);
    }
  }

  // Store the current angle for the next event
  obj._angleForDirectionDetection = obj.angle;
  
  return direction;
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
    console.log('angle', obj.angle);
    const direction = detectRotationDirection(obj);
    constrainRotationToMargin(obj, getCurrentMarginRect(), direction);
    canvas.renderAll();
  });

  // Reset transient angle accumulator once the user releases the mouse.
  canvas.on('object:modified', (e) => {
    const obj = e.target;
    if (obj) {
      delete obj._lastAngle;
      delete obj._rotationState;
      delete obj._collisionDetails;
      delete obj._lockDir;
      delete obj._angleForDirectionDetection;
      delete obj._directionHistory;
    }
    if (updateArrangementStatus) updateArrangementStatus('none');
  });
}

// For backwards-compatibility with legacy imports.
export { updateMarginRect };
