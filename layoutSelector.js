import { arrangeImages } from './arrangeUtils.js';
import { 
  lastLayout, 
  lastDirection,
  setArrangementStatus,
  setLastLayout,
  setLastDirection
} from './imageUploadUtils.js';

export function selectArrangeImageLayout(canvas, marginWidth, Swal) {
  // 1. Get all current images
  const images = canvas.getObjects().filter((obj) => obj.type === "image");

  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
  }

  // 2. Remove existing images from canvas
  images.forEach((img) => canvas.remove(img));

  // 3. Define state transitions
  const stateTransitions = {
    "rows-forward": { layout: "rows", direction: "reverse" },
    "rows-reverse": { layout: "cols", direction: "forward" },
    "cols-forward": { layout: "cols", direction: "reverse" },
    "cols-reverse": { layout: "single-column", direction: "forward" },
    "single-column-forward": { layout: "single-column", direction: "reverse" },
    "single-column-reverse": { layout: "single-row", direction: "forward" },
    "single-row-forward": { layout: "single-row", direction: "reverse" },
    "single-row-reverse": { layout: "rows", direction: "forward" }
  };

  const currentState = `${lastLayout}-${lastDirection}`;
  const nextState = stateTransitions[currentState] || { layout: "rows", direction: "forward" };

  setArrangementStatus(arrangeImages(canvas, images, nextState.layout, marginWidth, nextState.direction));
  setLastLayout(nextState.layout);
  setLastDirection(nextState.direction);

  canvas.renderAll();
} 