import { getCurrentMarginRect, updateMarginRect } from './../canvas/marginRectManager.js';
import { constrainRotationToMargin } from './../canvas/constraintUtils.js';

// Constants for rotation handling
const LARGE_ANGLE_JUMP_THRESHOLD = 5; // degrees
const INTERPOLATION_STEP_SIZE = 2; // degrees
const ANGLE_WRAP_THRESHOLD = 180; // degrees
const DIRECTION_CLOCKWISE = 'clockwise';
const DIRECTION_COUNTERCLOCKWISE = 'counterclockwise';

/**
 * Normalizes an angle to the range [0, 360)
 * @param {number} angle Angle in degrees
 * @returns {number} Normalized angle
 */
function normalizeAngle(angle) {
  angle = angle % 360;
  return angle < 0 ? angle + 360 : angle;
}

/**
 * Calculates the shortest angular distance between two angles
 * @param {number} from Starting angle
 * @param {number} to Ending angle
 * @returns {number} Shortest delta (positive = clockwise, negative = counterclockwise)
 */
function getShortestAngleDelta(from, to) {
  let delta = to - from;
  
  // Normalize to [-180, 180] to get shortest path
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  
  return delta;
}

/**
 * Checks if two directions are actually different (not just wrap-around artifacts)
 * @param {string} dir1 First direction
 * @param {string} dir2 Second direction
 * @param {number} angleDelta The actual angle delta
 * @returns {boolean} True if this is a real direction change
 */
function isRealDirectionChange(dir1, dir2, angleDelta) {
  if (!dir1 || !dir2) return false;
  
  // If directions are different, check if the delta supports this
  if (dir1 !== dir2) {
    // Real direction change should have a delta that matches the new direction
    const deltaDirection = angleDelta > 0 ? DIRECTION_CLOCKWISE : DIRECTION_COUNTERCLOCKWISE;
    return deltaDirection === dir2;
  }
  
  return false;
}

/**
 * Handles large angle jumps with interpolation to prevent wrap-around bugs
 * @param {fabric.Object} obj The object being rotated
 * @param {number} delta The angle delta
 * @param {number} lastAngle The previous angle
 * @param {number} currentAngle The current angle
 */
function handleLargeAngleJump(obj, delta, lastAngle, currentAngle) {
  const jumpDirection = delta > 0 ? DIRECTION_CLOCKWISE : DIRECTION_COUNTERCLOCKWISE;
  
  // Don't interpolate if object is blocked and user continues same direction (wrap-around)
  const isWrapAround = obj._rotationState === 'blocked' && jumpDirection === obj._lockDir;
  if (isWrapAround) {
    return; // Continue without interpolating to prevent the bug
  }
  
  console.log(`Large angle jump detected: ${delta.toFixed(2)}° (from ${lastAngle.toFixed(2)}° to ${currentAngle.toFixed(2)}°)`);
  
  interpolateAngleSteps(obj, delta, lastAngle, jumpDirection);
}

/**
 * Performs angle interpolation with constraint checking
 * @param {fabric.Object} obj The object being rotated
 * @param {number} delta The total angle delta
 * @param {number} lastAngle The starting angle
 * @param {string} stepDirection The direction of rotation
 */
function interpolateAngleSteps(obj, delta, lastAngle, stepDirection) {
  const steps = Math.ceil(Math.abs(delta) / INTERPOLATION_STEP_SIZE);
  const stepSize = delta / steps;
  
  console.log(`Interpolating ${steps} steps of ${stepSize.toFixed(2)}° each in ${stepDirection} direction`);
  
  for (let i = 1; i <= steps; i++) {
    const intermediateAngle = lastAngle + (stepSize * i);
    
    obj.angle = intermediateAngle;
    obj.setCoords();
    
    constrainRotationToMargin(obj, getCurrentMarginRect(), stepDirection);
    
    if (obj._rotationState === 'blocked') {
      console.log(`Object blocked at intermediate angle: ${intermediateAngle.toFixed(2)}°`);
      break;
    }
  }
}

/**
 * Calculates rotation direction from angle delta
 * @param {number} delta The angle delta
 * @returns {string|null} Direction or null
 */
function calculateDirectionFromDelta(delta) {
  if (Math.abs(delta) <= 0.1) {
    return null; // Below minimum threshold to avoid noise
  }
  
  const direction = delta > 0 ? DIRECTION_CLOCKWISE : DIRECTION_COUNTERCLOCKWISE;
  console.log(direction);
  return direction;
}

/**
 * Detects the rotation direction of a Fabric.js object with improved
 * wrap-around handling to prevent false direction changes.
 * @param {fabric.Object} obj The object being rotated.
 * @returns {string|null} 'clockwise', 'counterclockwise', or null if no direction detected.
 */
function detectRotationDirection(obj) {
  if (typeof obj._angleForDirectionDetection === 'undefined') {
    obj._angleForDirectionDetection = obj.angle;
    return null;
  }
  
  const currentAngle = obj.angle;
  const lastAngle = obj._angleForDirectionDetection;
  const delta = getShortestAngleDelta(lastAngle, currentAngle);
  
  // Handle large angle jumps that need interpolation
  if (Math.abs(delta) > LARGE_ANGLE_JUMP_THRESHOLD) {
    handleLargeAngleJump(obj, delta, lastAngle, currentAngle);
  }
  
  // Store current angle for next event and return direction
  obj._angleForDirectionDetection = obj.angle;
  return calculateDirectionFromDelta(delta);
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
      delete obj._angleDeltaHistory;
    }
    if (updateArrangementStatus) updateArrangementStatus('none');
  });
}

// For backwards-compatibility with legacy imports.
export { updateMarginRect };

/**
 * Test function to verify angle handling works correctly
 * Can be called from console for debugging: testAngleHandling()
 */
function testAngleHandling() {
  console.log('=== Testing Angle Handling ===');
  
  // Test cases that were problematic
  const testCases = [
    { from: 183.79, to: 207.94, expected: 24.15, expectedDir: 'clockwise' },
    { from: 350, to: 10, expected: 20, expectedDir: 'clockwise' },
    { from: 10, to: 350, expected: -20, expectedDir: 'counterclockwise' },
    { from: 0, to: 180, expected: 180, expectedDir: 'clockwise' },
    { from: 180, to: 0, expected: -180, expectedDir: 'counterclockwise' },
    { from: 5, to: -5, expected: -10, expectedDir: 'counterclockwise' }
  ];
  
  testCases.forEach((test, index) => {
    const delta = getShortestAngleDelta(test.from, test.to);
    const direction = delta > 0 ? DIRECTION_CLOCKWISE : DIRECTION_COUNTERCLOCKWISE;
    const deltaOk = Math.abs(delta - test.expected) < 0.1;
    const dirOk = direction === test.expectedDir;
    
    console.log(`Test ${index + 1}: ${test.from}° → ${test.to}°`);
    console.log(`  Expected: ${test.expected}° (${test.expectedDir})`);
    console.log(`  Got: ${delta.toFixed(2)}° (${direction})`);
    console.log(`  Result: ${deltaOk && dirOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  });
  
  // Test the problematic case from the logs
  console.log('=== Problematic Case from Logs ===');
  const problemFrom = 183.79;
  const problemTo = 207.94;
  const problemDelta = getShortestAngleDelta(problemFrom, problemTo);
  console.log(`${problemFrom}° → ${problemTo}°: ${problemDelta.toFixed(2)}°`);
  console.log(`Should be ~24.15° clockwise, got: ${problemDelta.toFixed(2)}° ${problemDelta > 0 ? 'clockwise' : 'counterclockwise'}`);
  
  // Test real vs fake direction changes
  console.log('=== Direction Change Detection ===');
  console.log('Real change (clockwise to counterclockwise with negative delta):');
  console.log('  Result:', isRealDirectionChange('clockwise', 'counterclockwise', -10));
  console.log('Fake change (clockwise to counterclockwise but positive delta - wrap artifact):');
  console.log('  Result:', isRealDirectionChange('clockwise', 'counterclockwise', 20));
}

// Export for debugging
window.testAngleHandling = testAngleHandling;
