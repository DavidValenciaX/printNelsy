import { arrangeImages, sortImages } from './../transform/arrangeUtils.js';
import { 
  imageState,
  setArrangementStatus,
  setOrientation,
  setOrder
} from '../image/imageUploadUtils.js';
import { getCustomGridDimensions, initializeGridControls } from './gridControls.js';

export function applyGridArrangement(canvas, domManager) {
  const images = canvas.getObjects().filter((obj) => obj.type === "image");
  if (images.length === 0) {
    return;
  }

  images.forEach((img) => canvas.remove(img));

  const customDimensions = getCustomGridDimensions();
  const sortedImages = sortImages(images, imageState.order);

  setArrangementStatus(arrangeImages(
    canvas, 
    sortedImages, 
    imageState.orientation,
    customDimensions.rows,
    customDimensions.cols
  ));
  
  initializeGridControls(canvas, domManager);
  canvas.renderAll();
}

export function setOrientationLayout(canvas, domManager, orientation) {
  setOrientation(orientation);
  applyGridArrangement(canvas, domManager);
}

export function changeOrderLayout(canvas, domManager) {
  const nextOrder = imageState.order === 'forward' ? 'reverse' : 'forward';
  setOrder(nextOrder);
  applyGridArrangement(canvas, domManager);
} 