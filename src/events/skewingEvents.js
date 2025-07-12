import { getCurrentMarginRect, updateMarginRect } from './../canvas/marginRectManager.js';
import { constrainObjectToMargin } from './../canvas/constraintUtils.js';

// Constants for skewing constraints
const SKEW_TOLERANCE = 0.005; // Precision for binary search

/**
 * Validates if an object is within the margin boundaries after a transformation
 * @param {fabric.Object} obj The object to validate
 * @param {Object} marginRect The margin rectangle
 * @returns {boolean} True if object is within margins
 */
function isObjectWithinMargins(obj, marginRect) {
  obj.setCoords();
  const boundingRect = obj.getBoundingRect(true);
  const marginRight = marginRect.left + marginRect.width;
  const marginBottom = marginRect.top + marginRect.height;
  
  return (
    boundingRect.left >= marginRect.left &&
    boundingRect.top >= marginRect.top &&
    boundingRect.left + boundingRect.width <= marginRight &&
    boundingRect.top + boundingRect.height <= marginBottom
  );
}

/**
 * Applies a full transformation state to an object
 * @param {fabric.Object} obj The object to apply the state to
 * @param {Object} state The state with skew, position, and scale
 */
function applyTransformState(obj, state) {
  obj.set({
    skewX: state.skewX,
    skewY: state.skewY,
    left: state.left,
    top: state.top,
    scaleX: state.scaleX,
    scaleY: state.scaleY
  });
  obj.setCoords();
}

/**
 * Creates a full transform state object from current object properties
 * @param {fabric.Object} obj The object to extract state from
 * @returns {Object} State object with skew, position, and scale
 */
function createTransformState(obj) {
  return {
    skewX: obj.skewX,
    skewY: obj.skewY,
    left: obj.left,
    top: obj.top,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY
  };
}

/**
 * Interpolates between two transform states
 * @param {Object} fromState Starting state
 * @param {Object} toState Target state
 * @param {number} t Interpolation factor (0-1)
 * @returns {Object} Interpolated state
 */
function interpolateTransformState(fromState, toState, t) {
  return {
    skewX: fromState.skewX + t * (toState.skewX - fromState.skewX),
    skewY: fromState.skewY + t * (toState.skewY - fromState.skewY),
    left: fromState.left + t * (toState.left - fromState.left),
    top: fromState.top + t * (toState.top - fromState.top),
    scaleX: fromState.scaleX + t * (toState.scaleX - fromState.scaleX),
    scaleY: fromState.scaleY + t * (toState.scaleY - fromState.scaleY)
  };
}

/**
 * Finds the closest valid transform state using binary search
 * @param {fabric.Object} obj The object being transformed
 * @param {Object} lastValidState The last known valid state
 * @param {Object} proposedState The proposed new state
 * @param {Object} marginRect The margin rectangle
 * @returns {Object} The closest valid transform state
 */
function findClosestValidState(obj, lastValidState, proposedState, marginRect) {
  let low = 0;
  let high = 1;
  let finalState = { ...lastValidState };
  
  const maxIterations = Math.ceil(Math.log2(1 / SKEW_TOLERANCE));
  
  for(let i = 0; i < maxIterations && high - low > SKEW_TOLERANCE; i++) {
    const mid = (low + high) / 2;
    const testState = interpolateTransformState(lastValidState, proposedState, mid);
    
    applyTransformState(obj, testState);
    
    if (isObjectWithinMargins(obj, marginRect)) {
      low = mid;
      finalState = { ...testState };
    } else {
      high = mid;
    }
  }
  
  return finalState;
}

/**
 * Handles skewing constraints by managing the full transform state
 * @param {fabric.Object} obj The object being skewed
 * @param {Object} marginRect The margin rectangle
 */
function constrainSkewToMargin(obj, marginRect) {
  const proposedState = createTransformState(obj);
  
  if (!obj._lastValidTransformState) {
    obj._lastValidTransformState = { ...proposedState };
    return;
  }
  
  if (isObjectWithinMargins(obj, marginRect)) {
    obj._lastValidTransformState = { ...proposedState };
    return;
  }
  
  const validState = findClosestValidState(
    obj, 
    obj._lastValidTransformState, 
    proposedState, 
    marginRect
  );
  
  applyTransformState(obj, validState);
  obj._lastValidTransformState = { ...validState };
  
  constrainObjectToMargin(obj, marginRect);
}

/**
 * Sets up skewing event handlers for the canvas
 * @param {fabric.Canvas} canvas The fabric canvas
 * @param {Object} marginRect The margin rectangle
 */
export function setupSkewingEvents(canvas, marginRect) {
  updateMarginRect(marginRect);
  
  canvas.on("object:skewing", function (e) {
    const obj = e.target;
    const currentMarginRect = getCurrentMarginRect();
    
    try {
      constrainSkewToMargin(obj, currentMarginRect);
    } catch (error) {
      console.error('Error during skewing constraint:', error);
      constrainObjectToMargin(obj, currentMarginRect);
    }
    
    canvas.renderAll();
  });
  
  canvas.on("object:modified", function (e) {
    const obj = e.target;
    if (obj?._lastValidTransformState) {
      delete obj._lastValidTransformState;
    }
  });
}

export { updateMarginRect }; 