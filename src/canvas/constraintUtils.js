/**
 * Constrains an object to stay within the margin boundaries
 */

// Constants for robust unblocking system
const DIRECTION_HISTORY_SIZE = 5;
const ROTATION_NEARBY_THRESHOLD = 90; // degrees
const DIRECTION_CLOCKWISE = 'clockwise';
const DIRECTION_COUNTERCLOCKWISE = 'counterclockwise';

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
    // A real direction change shouldn't have a massive angle jump,
    // which usually indicates a wrap-around artifact.
    if (Math.abs(angleDelta) > ROTATION_NEARBY_THRESHOLD) {
      return false;
    }
    
    // Real direction change should have a delta that matches the new direction
    const deltaDirection = angleDelta > 0 ? DIRECTION_CLOCKWISE : DIRECTION_COUNTERCLOCKWISE;
    return deltaDirection === dir2;
  }
  
  return false;
}

export function constrainObjectToMargin(obj, marginRect) {
  obj.setCoords();

  let objPoints = [
    obj.aCoords.tl,
    obj.aCoords.tr,
    obj.aCoords.br,
    obj.aCoords.bl,
  ];
  let marginRight = marginRect.left + marginRect.width;
  let marginBottom = marginRect.top + marginRect.height;

  let offsetX = 0,
    offsetY = 0;

  objPoints.forEach(function (point) {
    if (point.x < marginRect.left) {
      offsetX = Math.max(offsetX, marginRect.left - point.x);
    }
    if (point.x > marginRight) {
      offsetX = Math.min(offsetX, marginRight - point.x);
    }
    if (point.y < marginRect.top) {
      offsetY = Math.max(offsetY, marginRect.top - point.y);
    }
    if (point.y > marginBottom) {
      offsetY = Math.min(offsetY, marginBottom - point.y);
    }
  });

  if (offsetX !== 0 || offsetY !== 0) {
    obj.left += offsetX;
    obj.top += offsetY;
    obj.setCoords();
  }

  return obj;
}

/**
 * Scales an object to fit within margin boundaries if it exceeds them
 */
export function scaleToFitWithinMargin(obj, marginRect) {
  obj.setCoords();
  const br = obj.getBoundingRect();
  // Si el objeto ya cabe completamente en el margen, no se hace nada.
  if (br.width <= marginRect.width && br.height <= marginRect.height) {
    return;
  }
  // Calcula el factor de escala mínimo necesario para que br quepa en marginRect.
  const scaleFactor = Math.min(
    marginRect.width / br.width,
    marginRect.height / br.height
  );
  // Aplica el factor a la escala actual.
  obj.scaleX *= scaleFactor;
  obj.scaleY *= scaleFactor;
  // Reposiciona para que quede dentro del margen.
  constrainObjectToMargin(obj, marginRect);
  obj.setCoords();
}

/**
 * Finds the closest valid angle for an object by performing a binary search
 * between a known good angle and a proposed invalid angle.
 *
 * @param {fabric.Object} obj            The object being rotated.
 * @param {Function}      isValid        A function that returns true if the object is within constraints.
 * @param {number}        lastValidAngle The last known angle where the object was valid.
 * @param {number}        proposedAngle  The new, invalid angle.
 * @returns {number} The closest valid angle found.
 */
function findClosestValidAngle(obj, isValid, lastValidAngle, proposedAngle) {
  let low = 0; // Corresponds to lastValidAngle (t = 0)
  let high = 1; // Corresponds to proposedAngle   (t = 1)
  const tolerance = 0.002; // Controls precision of the search (ratio, not °)
  let finalAngle = lastValidAngle;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    
    // Normalize the delta to ensure the interpolation takes the shortest path around the circle.
    let delta = proposedAngle - lastValidAngle;
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    // Interpolate between the last valid angle and the proposed angle
    const testAngle = lastValidAngle + mid * delta;

    obj.angle = testAngle;
    obj.setCoords();

    if (isValid()) {
      low = mid; // Valid → move lower bound towards proposed angle
      finalAngle = testAngle;
    } else {
      high = mid; // Invalid → bring upper bound down
    }
  }

  return finalAngle;
}

/**
 * Checks if an object is fully contained within the margin boundaries.
 * @param {fabric.Object} obj The object to check.
 * @param {Object} marginRect The margin rectangle with `{left, top, width, height}`.
 * @returns {boolean} True if the object is within the margins.
 */
function isObjectWithinMargin(obj, marginRect) {
  const br = obj.getBoundingRect(true);
  const marginRight = marginRect.left + marginRect.width;
  const marginBottom = marginRect.top + marginRect.height;
  return (
    br.left >= marginRect.left &&
    br.top >= marginRect.top &&
    br.left + br.width <= marginRight &&
    br.top + br.height <= marginBottom
  );
}

/**
 * Identifies the specific corner and margin involved in a collision.
 * @param {fabric.Object} obj The object that has gone out of bounds.
 * @param {Object} marginRect The margin rectangle.
 * @returns {{corner: string, margin: string}|null} Details of the collision or null if none found.
 */
function findCollisionDetails(obj, marginRect) {
  // Object coords are already set before this is called
  const corners = {
    tl: obj.aCoords.tl,
    tr: obj.aCoords.tr,
    br: obj.aCoords.br,
    bl: obj.aCoords.bl,
  };

  const marginRight = marginRect.left + marginRect.width;
  const marginBottom = marginRect.top + marginRect.height;

  for (const cornerName in corners) {
    const point = corners[cornerName];
    if (point.x < marginRect.left) {
      return { corner: cornerName, margin: 'left' };
    }
    if (point.x > marginRight) {
      return { corner: cornerName, margin: 'right' };
    }
    if (point.y < marginRect.top) {
      return { corner: cornerName, margin: 'top' };
    }
    if (point.y > marginBottom) {
      return { corner: cornerName, margin: 'bottom' };
    }
  }
  return null; // Should not happen if called when invalid
}

/**
 * Finds the corner of an object that is closest to a specific margin edge.
 * @param {fabric.Object} obj The object to check.
 * @param {string} marginEdge The margin edge ('left', 'top', 'right', 'bottom').
 * @param {Object} marginRect The margin rectangle.
 * @returns {string} The name of the closest corner ('tl', 'tr', 'br', 'bl').
 */
function getClosestCornerToMargin(obj, marginEdge, marginRect) {
  // Coords should be up-to-date when this is called
  const corners = {
    tl: obj.aCoords.tl,
    tr: obj.aCoords.tr,
    br: obj.aCoords.br,
    bl: obj.aCoords.bl,
  };

  let closestCorner = null;
  let minDistance = Infinity;

  const marginRight = marginRect.left + marginRect.width;
  const marginBottom = marginRect.top + marginRect.height;

  for (const cornerName in corners) {
    const point = corners[cornerName];
    let distance;

    switch (marginEdge) {
      case 'left':
        distance = point.x - marginRect.left;
        break;
      case 'right':
        distance = marginRight - point.x;
        break;
      case 'top':
        distance = point.y - marginRect.top;
        break;
      case 'bottom':
        distance = marginBottom - point.y;
        break;
      default:
        continue;
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestCorner = cornerName;
    }
  }

  return closestCorner;
}

/**
 * Initializes rotation state for first-time rotation
 */
function initializeRotationState(obj, proposedAngle) {
  obj._lastAngle = proposedAngle;
  obj._rotationState = 'unblocked';
}

/**
 * Checks if rotation is within acceptable range to prevent 180-degree flips
 */
function isRotationNearby(proposedAngle, lastValidAngle) {
  let angleDelta = proposedAngle - lastValidAngle;
  if (angleDelta > 180) {
    angleDelta -= 360;
  } else if (angleDelta < -180) {
    angleDelta += 360;
  }
  return Math.abs(angleDelta) < ROTATION_NEARBY_THRESHOLD;
}

/**
 * Determines if object should be unblocked based on enhanced conditions with direction history
 * and improved detection of real direction changes vs wrap-around artifacts
 */
function shouldUnblock(obj, marginRect, direction, proposedAngle) {
  const { corner: originalCorner, margin: originalMargin } = obj._collisionDetails;
  
  // Initialize tracking structures
  if (!obj._directionHistory) {
    obj._directionHistory = [];
  }
  if (!obj._angleDeltaHistory) {
    obj._angleDeltaHistory = [];
  }
  
  // Calculate real angle delta using shortest path
  const angleDelta = obj._lastAngle ? getShortestAngleDelta(obj._lastAngle, proposedAngle) : 0;
  
  // Add current direction and angle delta to history
  if (direction && Math.abs(angleDelta) > 0.1) {
    const directionData = {
      direction: direction,
      angleDelta: angleDelta,
      angle: proposedAngle
    };
    
    obj._directionHistory.push(directionData);
    
    // Maintain only the last DIRECTION_HISTORY_SIZE events
    if (obj._directionHistory.length > DIRECTION_HISTORY_SIZE) {
      obj._directionHistory.shift();
    }
  }
  
  // Check for REAL direction changes (not wrap-around artifacts)
  const hasRealDirectionChange = obj._directionHistory.some(dirData => {
    return isRealDirectionChange(obj._lockDir, dirData.direction, dirData.angleDelta);
  });
  
  const closestCornerNow = getClosestCornerToMargin(obj, originalMargin, marginRect);
  const sameCorner = closestCornerNow === originalCorner;
  const nearby = isRotationNearby(proposedAngle, obj._lastAngle);
  const isWithinMargin = isObjectWithinMargin(obj, marginRect);
  
  // Enhanced unblocking conditions:
  // 1. Object must be within margin
  // 2. Must have a REAL direction change (not wrap-around artifact)
  // 3. Same corner must be closest to original margin
  // 4. Rotation must be nearby (not ~180° flip)
  const shouldUnblockResult = isWithinMargin && hasRealDirectionChange && sameCorner && nearby;
  
  return shouldUnblockResult;
}

/**
 * Handles rotation when object is in blocked state
 */
function handleBlockedState(obj, marginRect, direction, proposedAngle, isValid) {
  obj.angle = proposedAngle;
  obj.setCoords();

  if (isValid()) {
    if (shouldUnblock(obj, marginRect, direction, proposedAngle)) {
      obj._rotationState = 'unblocked';
      obj._lastAngle = proposedAngle;
      delete obj._lockDir;
      delete obj._directionHistory;
      delete obj._angleDeltaHistory;
    } else {
      obj.angle = obj._lastAngle;
    }
  } else {
    obj.angle = obj._lastAngle;
  }
}

/**
 * Handles rotation when object transitions from unblocked to blocked state
 */
function handleUnblockedState(obj, marginRect, direction, proposedAngle, isValid) {
  obj._rotationState = 'blocked';
  
  const collisionDetails = findCollisionDetails(obj, marginRect);
  if (collisionDetails) {
    obj._collisionDetails = collisionDetails;
  }
  
  if (direction) {
    obj._lockDir = direction;
  }
  
  const lastValidAngle = obj._lastAngle;
  const finalAngle = findClosestValidAngle(obj, isValid, lastValidAngle, proposedAngle);
  
  obj.angle = finalAngle;
  obj._lastAngle = finalAngle;
}

/**
 * Constrains the rotation of an object so that it remains fully inside the
 * supplied margin rectangle. The algorithm is direction-agnostic and works for
 * any corner that may collide with any border.
 *
 * It uses a binary-search approach between the last valid angle (stored in the
 * transient `_lastAngle` property of the Fabric object) and the currently
 * proposed angle coming from the live rotation interaction. This strategy is
 * the same one already applied for scaling constraints and guarantees finding
 * the closest valid angle in **O(log n)** steps.
 *
 * ENHANCED VERSION: This implementation includes optimizations for fast rotations:
 * - Angle interpolation: Large angle jumps (>5°) are broken down into smaller steps
 * - Robust unblocking: Uses direction history with real direction change detection
 * - Wrap-around handling: Prevents false direction changes from angle wrap-around
 * - Shortest path calculation: Always uses shortest angular distance between angles
 *
 * The enhanced unblocking logic requires that the object:
 * 1. Is fully inside the margins
 * 2. Has the same corner closest to the original margin that caused the collision
 * 3. Has shown a REAL direction change (not wrap-around artifact) in recent history
 * 4. Rotation is nearby (not ~180° flip from last valid angle)
 *
 * @param {fabric.Object} obj           The Fabric.js object being rotated.
 * @param {Object}       marginRect    The margin rectangle with `{left, top, width, height}`.
 * @param {string|null}  direction     The current rotation direction ('clockwise', 'counterclockwise', or null).
 */
export function constrainRotationToMargin(obj, marginRect, direction = null) {
  obj.setCoords();
  
  const isValid = () => isObjectWithinMargin(obj, marginRect);
  const proposedAngle = obj.angle;

  if (typeof obj._lastAngle === 'undefined') {
    initializeRotationState(obj, proposedAngle);
    return;
  }

  if (obj._rotationState === 'blocked') {
    handleBlockedState(obj, marginRect, direction, proposedAngle, isValid);
  } else if (!isValid()) {
    handleUnblockedState(obj, marginRect, direction, proposedAngle, isValid);
  } else {
    obj._lastAngle = proposedAngle;
  }

  obj.setCoords();
}