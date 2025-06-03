import { radToDeg, calculateDistance } from './mathUtils.js';

let currentMarginRect;
let isMouseDown = false;
let clockwise = false;
let accumulatedRestrictedAngle = 0;
let angleDiff = 0;
let activeRestriction = null;

export function setupRotatingEvents(canvas, marginRect, updateArrangementStatus = null) {
  // Store the reference to marginRect
  currentMarginRect = marginRect;

  canvas.on("mouse:down", function () {
    isMouseDown = true;
  });

  canvas.on("mouse:up", function () {
    isMouseDown = false;
  });

  canvas.on("object:rotating", function (event) {
    const obj = event.target;
    obj.setCoords();

    // Initialize accumulated angle if not exists
    if (typeof obj.previousAngle === "undefined") {
      obj.previousAngle = 0;
    }

    // Get current angle and calculate direction
    const currentAngle = obj.angle;

    // Detect direction and full rotations
    angleDiff = currentAngle - obj.previousAngle;

    // Handle angle wrap-around
    if (angleDiff > 270) {
      angleDiff -= 360; // Counter-clockwise wrap from 0 to 359
    } else if (angleDiff < -270) {
      angleDiff += 360; // Clockwise wrap from 359 to 0
    }

    clockwise = angleDiff > 0;

    // Store current angle for next comparison
    obj.previousAngle = currentAngle;

    let TOP = obj.top;
    let LEFT = obj.left;

    let TL = obj.aCoords.tl;
    let TR = obj.aCoords.tr;
    let BL = obj.aCoords.bl;
    let BR = obj.aCoords.br;

    let realObjectWidth = obj.width * obj.scaleX;
    let realObjectHeight = obj.height * obj.scaleY;

    let diagAngle = Math.atan(realObjectHeight / realObjectWidth);
    let complementDiagAngle = Math.PI / 2 - diagAngle;

    // Calculate margins from canvas edges
    const leftMargin = currentMarginRect.left;
    const rightMargin = currentMarginRect.left + currentMarginRect.width;
    const topMargin = currentMarginRect.top;
    const bottomMargin = currentMarginRect.top + currentMarginRect.height;

    // This function restricts the rotation of the object if it is exceeding the margins while it is rotating
    function checkRotating() {
      if (!isMouseDown) {
        activeRestriction = null;
      }

      if (!activeRestriction) {
        accumulatedRestrictedAngle = 0;
        if (isMouseDown && TR.x > rightMargin && clockwise) {
          activeRestriction = "TR_RIGHT_CW";
        } else if (isMouseDown && BR.x > rightMargin && !clockwise) {
          activeRestriction = "BR_RIGHT_CCW";
        } else if (isMouseDown && TL.x > rightMargin && clockwise) {
          activeRestriction = "TL_RIGHT_CW";
        } else if (isMouseDown && TR.x > rightMargin && !clockwise) {
          activeRestriction = "TR_RIGHT_CCW";
        } else if (isMouseDown && BL.x > rightMargin && clockwise) {
          activeRestriction = "BL_RIGHT_CW";
        } else if (isMouseDown && TL.x > rightMargin && !clockwise) {
          activeRestriction = "TL_RIGHT_CCW";
        } else if (isMouseDown && BR.x > rightMargin && clockwise) {
          activeRestriction = "BR_RIGHT_CW";
        } else if (isMouseDown && BL.x > rightMargin && !clockwise) {
          activeRestriction = "BL_RIGHT_CCW";
        } else if (isMouseDown && BR.y > bottomMargin && clockwise) {
          activeRestriction = "BR_BOTTOM_CW";
        } else if (isMouseDown && BL.y > bottomMargin && !clockwise) {
          activeRestriction = "BL_BOTTOM_CCW";
        } else if (isMouseDown && TR.y > bottomMargin && clockwise) {
          activeRestriction = "TR_BOTTOM_CW";
        } else if (isMouseDown && BR.y > bottomMargin && !clockwise) {
          activeRestriction = "BR_BOTTOM_CCW";
        } else if (isMouseDown && TL.y > bottomMargin && clockwise) {
          activeRestriction = "TL_BOTTOM_CW";
        } else if (isMouseDown && TR.y > bottomMargin && !clockwise) {
          activeRestriction = "TR_BOTTOM_CCW";
        } else if (isMouseDown && BL.y > bottomMargin && clockwise) {
          activeRestriction = "BL_BOTTOM_CW";
        } else if (isMouseDown && TL.y > bottomMargin && !clockwise) {
          activeRestriction = "TL_BOTTOM_CCW";
        } else if (isMouseDown && TL.x < leftMargin && !clockwise) {
          activeRestriction = "TL_LEFT_CCW";
        } else if (isMouseDown && BL.x < leftMargin && clockwise) {
          activeRestriction = "BL_LEFT_CW";
        } else if (isMouseDown && BL.x < leftMargin && !clockwise) {
          activeRestriction = "BL_LEFT_CCW";
        } else if (isMouseDown && BR.x < leftMargin && clockwise) {
          activeRestriction = "BR_LEFT_CW";
        } else if (isMouseDown && BR.x < leftMargin && !clockwise) {
          activeRestriction = "BR_LEFT_CCW";
        } else if (isMouseDown && TR.x < leftMargin && clockwise) {
          activeRestriction = "TR_LEFT_CW";
        } else if (isMouseDown && TR.x < leftMargin && !clockwise) {
          activeRestriction = "TR_LEFT_CCW";
        } else if (isMouseDown && TL.x < leftMargin && clockwise) {
          activeRestriction = "TL_LEFT_CW";
        } else if (isMouseDown && TL.y < topMargin && clockwise) {
          activeRestriction = "TL_TOP_CW";
        } else if (isMouseDown && TR.y < topMargin && !clockwise) {
          activeRestriction = "TR_TOP_CCW";
        } else if (isMouseDown && BL.y < topMargin && clockwise) {
          activeRestriction = "BL_TOP_CW";
        } else if (isMouseDown && TL.y < topMargin && !clockwise) {
          activeRestriction = "TL_TOP_CCW";
        } else if (isMouseDown && BR.y < topMargin && clockwise) {
          activeRestriction = "BR_TOP_CW";
        } else if (isMouseDown && BL.y < topMargin && !clockwise) {
          activeRestriction = "BL_TOP_CCW";
        } else if (isMouseDown && TR.y < topMargin && clockwise) {
          activeRestriction = "TR_TOP_CW";
        } else if (isMouseDown && BR.y < topMargin && !clockwise) {
          activeRestriction = "BR_TOP_CCW";
        }
      }

      switch (activeRestriction) {
        case "TR_RIGHT_CW": {
          console.log("TR right margin rotating clockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.x > rightMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_RIGHT_CCW";
          }
          break;
        }

        case "BR_RIGHT_CCW": {
          console.log("BR right margin rotating counterclockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = 2 * Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.x > rightMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_RIGHT_CW";
          }
          break;
        }

        case "TL_RIGHT_CW": {
          console.log("TL right margin rotating clockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.x > rightMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_RIGHT_CCW";
          }
          break;
        }

        case "TR_RIGHT_CCW": {
          console.log("TR right margin rotating counterclockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.x > rightMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_RIGHT_CW";
          }
          break;
        }

        case "BL_RIGHT_CW": {
          console.log("BL right margin rotating clockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.x > rightMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_RIGHT_CCW";
          }
          break;
        }

        case "TL_RIGHT_CCW": {
          console.log("TL right margin rotating counterclockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.x > rightMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_RIGHT_CW";
          }
          break;
        }

        case "BR_RIGHT_CW": {
          console.log("BR right margin rotating clockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.x > rightMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_RIGHT_CCW";
          }
          break;
        }

        case "BL_RIGHT_CCW": {
          console.log("BL right margin rotating counterclockwise");
          let co = rightMargin - obj.left;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.x > rightMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_RIGHT_CW";
          }
          break;
        }

        case "BR_BOTTOM_CW": {
          console.log("BR bottom margin rotating clockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.y > bottomMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_BOTTOM_CCW";
          }
          break;
        }

        case "BL_BOTTOM_CCW": {
          console.log("BL bottom margin rotating counterclockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = 2 * Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.y > bottomMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_BOTTOM_CW";
          }
          break;
        }

        case "TR_BOTTOM_CW": {
          console.log("TR bottom margin rotating clockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.y > bottomMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_BOTTOM_CCW";
          }
          break;
        }

        case "BR_BOTTOM_CCW": {
          console.log("BR bottom margin rotating counterclockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.y > bottomMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_BOTTOM_CW";
          }
          break;
        }

        case "TL_BOTTOM_CW": {
          console.log("TL bottom margin rotating clockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.y > bottomMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_BOTTOM_CCW";
          }
          break;
        }

        case "TR_BOTTOM_CCW": {
          console.log("TR bottom margin rotating counterclockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.y > bottomMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_BOTTOM_CW";
          }
          break;
        }

        case "BL_BOTTOM_CW": {
          console.log("BL bottom margin rotating clockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.y > bottomMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_BOTTOM_CCW";
          }
          break;
        }

        case "TL_BOTTOM_CCW": {
          console.log("TL bottom margin rotating counterclockwise");
          let co = bottomMargin - obj.top;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.y > bottomMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_BOTTOM_CW";
          }
          break;
        }

        case "TL_LEFT_CCW": {
          console.log("TL left margin rotating counterclockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = 2 * Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.x < leftMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_LEFT_CW";
          }
          break;
        }

        case "BL_LEFT_CW": {
          console.log("BL left margin rotating clockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.x < leftMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_LEFT_CCW";
          }
          break;
        }

        case "BL_LEFT_CCW": {
          console.log("BL left margin rotating counterclockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.x < leftMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_LEFT_CW";
          }
          break;
        }

        case "BR_LEFT_CW": {
          console.log("BR left margin rotating clockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.x < leftMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_LEFT_CCW";
          }
          break;
        }

        case "BR_LEFT_CCW": {
          console.log("BR left margin rotating counterclockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.x < leftMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_LEFT_CW";
          }
          break;
        }

        case "TR_LEFT_CW": {
          console.log("TR left margin rotating clockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.x < leftMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_LEFT_CCW";
          }
          break;
        }

        case "TR_LEFT_CCW": {
          console.log("TR left margin rotating counterclockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.x < leftMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_LEFT_CW";
          }
          break;
        }

        case "TL_LEFT_CW": {
          console.log("TL left margin rotating clockwise");
          let co = obj.left - leftMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.x < leftMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_LEFT_CCW";
          }
          break;
        }

        case "TL_TOP_CW": {
          console.log("TL top margin rotating clockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.y < topMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_TOP_CCW";
          }
          break;
        }

        case "TR_TOP_CCW": {
          console.log("TR top margin rotating counterclockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = 2 * Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.y < topMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_TOP_CW";
          }
          break;
        }

        case "BL_TOP_CW": {
          console.log("BL top margin rotating clockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TL.y < topMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TL_TOP_CCW";
          }
          break;
        }

        case "TL_TOP_CCW": {
          console.log("TL top margin rotating counterclockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = Math.PI / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.y < topMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_TOP_CW";
          }
          break;
        }

        case "BR_TOP_CW": {
          console.log("BR top margin rotating clockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BL.y < topMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BL_TOP_CCW";
          }
          break;
        }

        case "BL_TOP_CCW": {
          console.log("BL top margin rotating counterclockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - diagAngle;
          let restrictedAngle = Math.PI - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.y < topMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_TOP_CW";
          }
          break;
        }

        case "TR_TOP_CW": {
          console.log("TR top margin rotating clockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle >= 360) {
            accumulatedRestrictedAngle -= 360;
          }

          if (accumulatedRestrictedAngle > 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (BR.y < topMargin && !clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "BR_TOP_CCW";
          }
          break;
        }

        case "BR_TOP_CCW": {
          console.log("BR top margin rotating counterclockwise");
          let co = obj.top - topMargin;
          let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
          let marginAngle = Math.asin(co / hypotenuse);
          let innerAngle = marginAngle - complementDiagAngle;
          let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

          accumulatedRestrictedAngle += angleDiff;

          // Update full rotations
          while (accumulatedRestrictedAngle <= -360) {
            accumulatedRestrictedAngle += 360;
          }

          if (accumulatedRestrictedAngle < 0) {
            obj.angle = radToDeg(restrictedAngle);
          } else if (TR.y < topMargin && clockwise) {
            accumulatedRestrictedAngle = 0;
            activeRestriction = "TR_TOP_CW";
          }
          break;
        }

        default:
          // Handle default case
          break;
      }
    }

    checkRotating();

    obj.setCoords();
    canvas.renderAll();
  });

  canvas.on("object:modified", function (e) {
    // Reset restrictions
    activeRestriction = null;
    // Update arrangement status if callback is provided
    if (updateArrangementStatus) {
      updateArrangementStatus("none");
    }
  });
}

export function updateMarginRect(marginRect) {
  currentMarginRect = marginRect;
} 