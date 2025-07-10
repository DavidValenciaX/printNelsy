/**
 * Constrains an object to stay within the margin boundaries
 */
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
 * The unblocking logic has been enhanced to require that the object:
 * 1. Is fully inside the margins
 * 2. Has the same corner closest to the original margin that caused the collision
 * 3. Has reversed its rotation direction from when the collision occurred
 *
 * @param {fabric.Object} obj           The Fabric.js object being rotated.
 * @param {Object}       marginRect    The margin rectangle with `{left, top, width, height}`.
 * @param {string|null}  direction     The current rotation direction ('clockwise', 'counterclockwise', or null).
 */
export function constrainRotationToMargin(obj, marginRect, direction = null) {
  // Ensure coordinates are up-to-date before validation.
  obj.setCoords();

  const isValid = () => isObjectWithinMargin(obj, marginRect);

  const proposedAngle = obj.angle; // Current angle from the event (°)

  // Initialize for first-time rotation.
  if (typeof obj._lastAngle === 'undefined') {
    obj._lastAngle = proposedAngle;
    obj._rotationState = 'unblocked'; // Initial state
    return;
  }

  // --- State Machine ---

  if (obj._rotationState === 'blocked') {
    // We are currently constrained.
    // Tentatively apply the user's desired angle to see if it's valid.
    obj.angle = proposedAngle;
    obj.setCoords();

    if (isValid()) {
      // The user rotated back into a valid position.
      // Enhanced unblocking logic: check all three conditions
      const { corner: originalCorner, margin: originalMargin } = obj._collisionDetails;
      const closestCornerNow = getClosestCornerToMargin(obj, originalMargin, marginRect);
      
      // Check if rotation direction has been reversed
      const reversed = direction && obj._lockDir && (direction !== obj._lockDir);
      
      // All three conditions must be met to unblock
      const inside = true; // Already verified by isValid() above
      const sameCorner = closestCornerNow === originalCorner;
      
      // NEW: Check if the current angle is reasonably close to the blocked angle.
      // This prevents unblocking when the object is rotated ~180 degrees, which can
      // create a symmetric valid state that we want to avoid.
      let angleDelta = proposedAngle - obj._lastAngle;
      if (angleDelta > 180) {
        angleDelta -= 360;
      } else if (angleDelta < -180) {
        angleDelta += 360;
      }
      const isRotationNearby = Math.abs(angleDelta) < 90; // Prevent 180-degree flips
      
      if (inside && reversed && sameCorner && isRotationNearby) {
        // The object unblocked correctly: inside + reversed direction + same corner
        console.log(
          `Rotation unblocked: Object re-entered correctly. ` +
          `Direction changed from '${obj._lockDir}' to '${direction}', ` +
          `corner '${originalCorner}' still closest to margin '${originalMargin}'.`
        );
        obj._rotationState = 'unblocked';
        obj._lastAngle = proposedAngle; // Update reference angle.
        delete obj._lockDir; // Clear lock direction
      } else {
        // One or more conditions not met, keep blocked
        let reason = [];
        if (!sameCorner) {
          reason.push(`corner changed from '${originalCorner}' to '${closestCornerNow}'`);
        }
        if (!reversed) {
          reason.push(`direction not reversed (lock: '${obj._lockDir}', current: '${direction}')`);
        }
        if (!isRotationNearby) {
          reason.push(`rotation has flipped by ~180 degrees`);
        }
        
        console.log(
          `Rotation still blocked: Object is inside but ${reason.join(' and ')}.`
        );
        // Revert to the last valid "wall" angle
        obj.angle = obj._lastAngle;
      }
    } else {
      // Still invalid, remain blocked and revert to the last good angle.
      obj.angle = obj._lastAngle;
    }
    // 'unblocked': We are currently moving freely.
  } else if (!isValid()) {
    // We just hit a boundary.
    obj._rotationState = 'blocked';

    // --- DEBUG: Identify which corner and margin are involved ---
    const collisionDetails = findCollisionDetails(obj, marginRect);
    if (collisionDetails) {
      obj._collisionDetails = collisionDetails;
      console.log(
        `Rotation blocked: Corner '${collisionDetails.corner}' crossed margin '${collisionDetails.margin}'.`
      );
    }
    
    // Store the rotation direction that caused the collision
    if (direction) {
      obj._lockDir = direction;
      console.log(`Lock direction stored: ${direction}`);
    }
    // --- END DEBUG ---

    // Find the angle just before we became invalid.
    const lastValidAngle = obj._lastAngle;
    const finalAngle = findClosestValidAngle(
      obj,
      isValid,
      lastValidAngle,
      proposedAngle
    );

    console.log(`Objeto bloqueado en ángulo: ${finalAngle.toFixed(2)}°`);

    obj.angle = finalAngle;
    obj._lastAngle = finalAngle; // This is the new "wall".
  } else {
    // Still valid, just update our last known good position.
    obj._lastAngle = proposedAngle;
  }

  // Apply the best valid angle found.
  obj.setCoords();
}