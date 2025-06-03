let currentMarginRect;

export function setupScalingEvents(canvas, marginRect) {
  // Store the reference to marginRect
  currentMarginRect = marginRect;

  canvas.on("object:scaling", function (e) {
    let obj = e.target;
    obj.setCoords();

    const marginRight = currentMarginRect.left + currentMarginRect.width;
    const marginBottom = currentMarginRect.top + currentMarginRect.height;

    // Function to check if the object's bounding rect is within margins.
    function isValidState() {
      let br = obj.getBoundingRect(true);
      return (
        br.left >= currentMarginRect.left &&
        br.top >= currentMarginRect.top &&
        br.left + br.width <= marginRight &&
        br.top + br.height <= marginBottom
      );
    }

    // Save the proposed (current) state.
    const proposedScaleX = obj.scaleX;
    const proposedScaleY = obj.scaleY;
    const proposedLeft = obj.left;
    const proposedTop = obj.top;

    // If no last valid state exists, initialize it with the current state.
    if (typeof obj._lastScaleX === "undefined") {
      obj._lastScaleX = proposedScaleX;
      obj._lastScaleY = proposedScaleY;
      obj._lastLeft = proposedLeft;
      obj._lastTop = proposedTop;
    }

    const lastValidScaleX = obj._lastScaleX;
    const lastValidScaleY = obj._lastScaleY;
    const lastValidLeft = obj._lastLeft;
    const lastValidTop = obj._lastTop;

    // If the current state is valid, simply update the last valid state.
    if (isValidState()) {
      obj._lastScaleX = proposedScaleX;
      obj._lastScaleY = proposedScaleY;
      obj._lastLeft = proposedLeft;
      obj._lastTop = proposedTop;
    } else {
      // The state is invalid. Use binary search to find the largest valid interpolation factor (t)
      // between the last valid state (t = 0) and the current state (t = 1).
      let low = 0,
        high = 1;
      const tolerance = 0.005;
      let finalScaleX = lastValidScaleX,
        finalScaleY = lastValidScaleY,
        finalLeft = lastValidLeft,
        finalTop = lastValidTop;

      while (high - low > tolerance) {
        let mid = (low + high) / 2;
        // Interpolate state between last valid and proposed.
        let testScaleX =
          lastValidScaleX + mid * (proposedScaleX - lastValidScaleX);
        let testScaleY =
          lastValidScaleY + mid * (proposedScaleY - lastValidScaleY);
        let testLeft = lastValidLeft + mid * (proposedLeft - lastValidLeft);
        let testTop = lastValidTop + mid * (proposedTop - lastValidTop);

        // Apply the test state temporarily.
        obj.scaleX = testScaleX;
        obj.scaleY = testScaleY;
        obj.left = testLeft;
        obj.top = testTop;
        obj.setCoords();

        if (isValidState()) {
          // The candidate state is valid, so move the lower bound closer to the proposed state.
          low = mid;
          finalScaleX = testScaleX;
          finalScaleY = testScaleY;
          finalLeft = testLeft;
          finalTop = testTop;
        } else {
          // The candidate state is invalid; reduce the upper bound.
          high = mid;
        }
      }

      // Set the object to the best valid state determined.
      obj.scaleX = finalScaleX;
      obj.scaleY = finalScaleY;
      obj.left = finalLeft;
      obj.top = finalTop;
      obj.setCoords();
    }

    canvas.renderAll();
  });
}

export function updateMarginRect(marginRect) {
  currentMarginRect = marginRect;
} 