import { constrainObjectToMargin } from './constraintUtils.js';

let currentMarginRect;

export function setupMovingEvents(canvas, marginRect) {
  // Store the reference to marginRect
  currentMarginRect = marginRect;

  canvas.on("object:moving", function (e) {
    constrainObjectToMargin(e.target, currentMarginRect);
  });
}

export function updateMarginRect(marginRect) {
  currentMarginRect = marginRect;
} 