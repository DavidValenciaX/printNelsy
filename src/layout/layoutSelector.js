import Swal from 'sweetalert2';
import { arrangeImages, sortImages } from './../transform/arrangeUtils.js';
import { 
  imageState,
  setArrangementStatus,
  setOrientation,
  setOrder
} from '../image/imageUploadUtils.js';
import { getCustomGridDimensions, initializeGridControls, resetCustomGridDimensions } from './gridControls.js';

export function applyGridArrangement(canvas, domManager) {
  const images = canvas.getObjects().filter((obj) => obj.type === "image" || obj.type === "group");
  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
  }
  
  // Primero, resetea las dimensiones personalizadas para forzar el recálculo
  resetCustomGridDimensions();

  images.forEach((img) => canvas.remove(img));

  const customDimensions = getCustomGridDimensions();
  const sortedImages = sortImages(images, imageState.order);

  setArrangementStatus(arrangeImages(
    canvas, 
    sortedImages, 
    imageState.orientation,
    customDimensions.rows,
    customDimensions.cols,
    imageState.spacing
  ));
  
  initializeGridControls(canvas, domManager);
  canvas.renderAll();
}

export function setOrientationLayout(canvas, domManager, orientation) {
  setOrientation(orientation);
  applyGridArrangement(canvas, domManager);
}

export function setOrderLayout(canvas, domManager, order) {
  setOrder(order);
  applyGridArrangement(canvas, domManager);
} 