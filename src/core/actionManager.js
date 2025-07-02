// Import all action functions
import { zoomIn, zoomOut, applyZoom } from '../output/zoom.js';
import { centerVertically, centerHorizontally } from '../transform/center.js';
import { createMasonryColumnsCollage, createMasonryRowsCollage, collageArrange } from '../layout/collageUtils.js';
import { setImageSizeInCm } from '../image/imageSize.js';
import { printCanvas } from '../output/printUtils.js';
import { downloadAsPDF } from '../output/pdfUtils.js';
import { deactivateObjects } from '../interactions/deactivateObjects.js';
import { rotateImage } from '../transform/rotateUtils.js';
import { resetActiveImage } from '../image/resetUtils.js';
import { deleteActiveObject } from '../interactions/deleteUtils.js';
import { scaleUp, scaleDown } from '../transform/scaleUtils.js';
import { convertToGrayscale } from '../image/imageEffects.js';
import { 
  handleImageUpload, 
  handleImageDrop,
  originalImages,
  setArrangementStatus
} from '../image/imageUploadUtils.js';
import { 
  initializeCrop, 
  confirmCrop, 
  exitCropMode
} from '../image/cropUtils.js';
import { 
  resizeCanvas, 
  changeOrientation
} from '../canvas/canvasResizeUtils.js';
import { selectArrangeImageLayout } from '../layout/layoutSelector.js';
import { 
  copySelection, 
  pasteSelection, 
  pasteFromSystemOnly,
  setupClipboardEvents, 
  clearClipboard 
} from '../interactions/clipboardUtils.js';

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
  downloadAsPDF = downloadAsPDF;
  handleImageUpload = handleImageUpload;
  handleImageDrop = handleImageDrop;

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

  // Clipboard actions
  copySelection = copySelection;
  pasteSelection = pasteSelection;
  pasteFromSystemOnly = pasteFromSystemOnly;
  setupClipboardEvents = setupClipboardEvents;
  clearClipboard = clearClipboard;

  // Global window actions for zoom (backwards compatibility)
  exposeGlobalZoomActions() {
    window.zoomIn = this.zoomIn;
    window.zoomOut = this.zoomOut;
    window.applyZoom = this.applyZoom;
  }
} 