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

  const marginRight  = marginRect.left + marginRect.width;
  const marginBottom = marginRect.top  + marginRect.height;

  // Helper that checks if the object is fully contained in the margins.
  function isValid() {
    const br = obj.getBoundingRect(true);
    return (
      br.left               >= marginRect.left  &&
      br.top                >= marginRect.top   &&
      br.left  + br.width   <= marginRight      &&
      br.top   + br.height  <= marginBottom
    );
  }

  const proposedAngle = obj.angle; // Current angle coming from the event (°)

  // First time we see this object while rotating ⇒ initialise reference angle.
  if (typeof obj._lastAngle === "undefined") {
    obj._lastAngle = proposedAngle;
    return; // Nothing else to do, the object started inside the margins.
  }

  const lastValidAngle = obj._lastAngle;

  // Fast path: proposed angle is already valid → just update reference.
  if (isValid()) {
    obj._lastAngle = proposedAngle;
    return;
  }

  // Slow path: proposed angle makes the object exceed the margins.
  // Perform a binary search (interpolation) between the last known good angle
  // and the invalid proposed one to find the closest valid value.
  let low = 0;     // Corresponds to lastValidAngle (t = 0)
  let high = 1;    // Corresponds to proposedAngle   (t = 1)
  const tolerance = 0.002; // Controls precision of the search (ratio, not °)
  let finalAngle = lastValidAngle;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const testAngle = lastValidAngle + mid * (proposedAngle - lastValidAngle);

    obj.angle = testAngle;
    obj.setCoords();

    if (isValid()) {
      low = mid;            // Valid → move lower bound towards proposed angle
      finalAngle = testAngle;
    } else {
      high = mid;           // Invalid → bring upper bound down
    }
  }

  // Apply the best valid angle found.
  obj.angle = finalAngle;
  obj.setCoords();
} 