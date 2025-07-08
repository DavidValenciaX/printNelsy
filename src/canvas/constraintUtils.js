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
    // Interpolate between the last valid angle and the proposed angle
    const testAngle = lastValidAngle + mid * (proposedAngle - lastValidAngle);

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
 * @param {fabric.Object} obj           The Fabric.js object being rotated.
 * @param {Object}       marginRect    The margin rectangle with `{left, top, width, height}`.
 */
export function constrainRotationToMargin(obj, marginRect) {
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
      obj._rotationState = 'unblocked';
      obj._lastAngle = proposedAngle; // Update reference angle.
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
    // --- END DEBUG ---

    // Find the angle just before we became invalid.
    const lastValidAngle = obj._lastAngle;
    const finalAngle = findClosestValidAngle(
      obj,
      isValid,
      lastValidAngle,
      proposedAngle
    );

    obj.angle = finalAngle;
    obj._lastAngle = finalAngle; // This is the new "wall".
  } else {
    // Still valid, just update our last known good position.
    obj._lastAngle = proposedAngle;
  }

  // Apply the best valid angle found.
  obj.setCoords();
}