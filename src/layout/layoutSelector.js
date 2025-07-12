import { arrangeImages } from './../transform/arrangeUtils.js';
import { 
  imageState,
  setArrangementStatus,
  setLastLayout,
  setLastDirection
} from '../image/imageUploadUtils.js';
import { resetCustomGridDimensions, getCustomGridDimensions } from './gridControls.js';

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
    "cols-reverse": { layout: "rows", direction: "forward" },
  };

  const currentState = `${imageState.lastLayout}-${imageState.lastDirection}`;
  const nextState =
    stateTransitions[currentState] || { layout: "rows", direction: "forward" };

  // Obtener dimensiones personalizadas de los grid controls si están disponibles
  const customDimensions = getCustomGridDimensions();

  // Solo resetear dimensiones personalizadas si no están definidas
  if (customDimensions.rows === null && customDimensions.cols === null) {
    resetCustomGridDimensions();
  }

  setArrangementStatus(arrangeImages(
    canvas, 
    images, 
    nextState.layout, 
    marginWidth, 
    nextState.direction,
    customDimensions.rows,
    customDimensions.cols
  ));
  setLastLayout(nextState.layout);
  setLastDirection(nextState.direction);

  canvas.renderAll();
} 