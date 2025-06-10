// Import all action functions
import { zoomIn, zoomOut, applyZoom } from './zoom.js';
import { centerVertically, centerHorizontally } from './center.js';
import { createMasonryColumnsCollage, createMasonryRowsCollage, collageArrange } from './collageUtils.js';
import { setImageSizeInCm } from './imageSize.js';
import { printCanvas } from './printUtils.js';
import { deactivateObjects } from './deactivateObjects.js';
import { rotateImage } from './rotateUtils.js';
import { resetActiveImage } from './resetUtils.js';
import { deleteActiveObject } from './deleteUtils.js';
import { scaleUp, scaleDown } from './scaleUtils.js';
import { convertToGrayscale } from './imageEffects.js';
import { 
  handleImageUpload, 
  originalImages,
  setArrangementStatus
} from './imageUploadUtils.js';
import { 
  initializeCrop, 
  confirmCrop, 
  exitCropMode
} from './cropUtils.js';
import { 
  resizeCanvas, 
  changeOrientation
} from './canvasResizeUtils.js';
import { selectArrangeImageLayout } from './layoutSelector.js';

/**
 * Centraliza todas las acciones de la aplicación
 */
export class ActionManager {
  constructor() {
    // Expose original images for access
    this.originalImages = originalImages;
  }

  // Zoom actions
  zoomIn = zoomIn;
  zoomOut = zoomOut;
  applyZoom = applyZoom;

  // Positioning actions
  centerVertically = centerVertically;
  centerHorizontally = centerHorizontally;

  // Collage actions
  createMasonryColumnsCollage = createMasonryColumnsCollage;
  createMasonryRowsCollage = createMasonryRowsCollage;
  collageArrange = collageArrange;

  // Size actions
  setImageSizeInCm = setImageSizeInCm;
  scaleUp = scaleUp;
  scaleDown = scaleDown;

  // File actions
  printCanvas = printCanvas;
  handleImageUpload = handleImageUpload;

  // Object actions
  deactivateObjects = deactivateObjects;
  deleteActiveObject = deleteActiveObject;
  resetActiveImage = resetActiveImage;

  // Transform actions
  rotateImage = rotateImage;
  convertToGrayscale = convertToGrayscale;

  // Crop actions
  initializeCrop = initializeCrop;
  confirmCrop = confirmCrop;
  exitCropMode = exitCropMode;

  // Canvas actions
  resizeCanvas = resizeCanvas;
  changeOrientation = changeOrientation;

  // Layout actions
  selectArrangeImageLayout = selectArrangeImageLayout;

  // Status management
  setArrangementStatus = setArrangementStatus;

  // Global window actions for zoom (backwards compatibility)
  exposeGlobalZoomActions() {
    window.zoomIn = this.zoomIn;
    window.zoomOut = this.zoomOut;
    window.applyZoom = this.applyZoom;
  }
} 