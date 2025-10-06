import { fabric } from 'fabric';
import Swal from 'sweetalert2';
import { arrangeImages, sortImages } from '../transform/arrangeUtils.js';
import { randomCollageArrange } from '../layout/randomCollage.js';
import { createMasonryColumnsCollage } from '../layout/masonryColumnsCollage.js';
import { createMasonryRowsCollage } from '../layout/masonryRowsCollage.js';
import { constrainObjectToMargin } from './constraintUtils.js';
import { updateMarginRect } from './marginRectManager.js';
import { getCustomGridDimensions, updateGridVisualization } from '../layout/gridControls.js';
import { 
  imageState,
  setArrangementStatus
} from '../image/imageUploadUtils.js';

// Constantes de configuración del papel
const dpi = 300;
const marginInches = 0.2;
const marginPixels = marginInches * dpi;
const paperSizes = {
  carta: { width: 8.5 * dpi, height: 11 * dpi },
  oficio: { width: 8.5 * dpi, height: 13 * dpi },
  a4: { width: 8.27 * dpi, height: 11.69 * dpi },
};

// Variables de estado del canvas
let currentSize = "carta";
let isVertical = true;

// Funciones getter/setter para el estado
export function getCurrentSize() {
  return currentSize;
}

export function getIsVertical() {
  return isVertical;
}

export function setCurrentSize(size) {
  currentSize = size;
}

export function setIsVertical(vertical) {
  isVertical = vertical;
}

function reAddAndArrangeImages(images, currentOrientation, currentOrder, canvas, marginRect) {
  if (images.length === 0) {
    setArrangementStatus('none');
    updateGridVisualization(canvas, isVertical);
    return;
  }

  // Obtener dimensiones personalizadas de los grid controls si están disponibles
  const customDimensions = getCustomGridDimensions();
  
  const arrangementStrategies = {
    "grid": () => {
      const sortedImages = sortImages(images, currentOrder);
      setArrangementStatus(arrangeImages(
        canvas, 
        sortedImages, 
        currentOrientation, 
        customDimensions.rows,
        customDimensions.cols,
        imageState.spacing
      ));
    },
    "columns-collage": () => {
      images.forEach((img) => canvas.add(img));
      const newStatus = createMasonryColumnsCollage(canvas, marginRect, Swal);
      if (newStatus) setArrangementStatus(newStatus);
    },
    "rows-collage": () => {
      images.forEach((img) => canvas.add(img));
      const newStatus = createMasonryRowsCollage(canvas, marginRect, Swal);
      if (newStatus) setArrangementStatus(newStatus);
    },
    "collage": () => {
      images.forEach((img) => canvas.add(img));
      const newStatus = randomCollageArrange(canvas, marginRect, Swal);
      if (newStatus) setArrangementStatus(newStatus);
    },
    "none": () => {
      images.forEach((img) => {
        canvas.add(img);
        constrainObjectToMargin(img, marginRect);
      });
    }
  };

  const strategy = arrangementStrategies[imageState.arrangementStatus];
  if (strategy) strategy();

  updateGridVisualization(canvas, isVertical);
}

export function resizeCanvas(size, canvas, marginRect, orientation = isVertical) {
  // Store current canvas state
  const images = canvas.getObjects().filter((obj) => obj.type === "image" || obj.type === "group");
  const currentOrientation = imageState.orientation || (images.length <= 2 ? "cols" : "rows");
  const currentOrder = "forward";

  // Remove all images from canvas
  images.forEach((img) => canvas.remove(img));

  // Update canvas dimensions
  currentSize = size;
  isVertical = orientation;
  const scale = 0.3;
  let width = paperSizes[size].width;
  let height = paperSizes[size].height;

  if (!isVertical) {
    [width, height] = [height, width];
  }

  canvas.setWidth(width * scale);
  canvas.setHeight(height * scale);

  // Update margin rectangle
  if (marginRect) {
    canvas.remove(marginRect);
  }

  marginRect = new fabric.Rect({
    width: width * scale - 2 * marginPixels * scale,
    height: height * scale - 2 * marginPixels * scale,
    left: marginPixels * scale,
    top: marginPixels * scale,
    fill: "transparent",
    stroke: "gray",
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false,
  });

  canvas.add(marginRect);
  
  // Update the marginRect reference in movingEvents and scalingEvents
  updateMarginRect(marginRect);

  // Calcular el ancho del margen
  const marginWidth = (canvas.width - marginRect.width) / 2;

  // Re-add and re-arrange images using the new function
  reAddAndArrangeImages(images, currentOrientation, currentOrder, canvas, marginRect);
  
  return { marginRect, marginWidth };
}

export function changeOrientation(vertical, canvas, marginRect) {
  return resizeCanvas(currentSize, canvas, marginRect, vertical);
}

/**
 * Redimensiona solo el canvas y marginRect sin reorganizar las imágenes
 * @param {string} size - Tamaño del papel  
 * @param {fabric.Canvas} canvas - Instancia del canvas
 * @param {fabric.Rect} marginRect - Rectángulo de margen actual
 * @param {boolean} orientation - Orientación (true = vertical, false = horizontal)
 * @returns {Object} Nuevo marginRect y marginWidth
 */
export function resizeCanvasOnly(size, canvas, marginRect, orientation = isVertical) {
  // SCROLL DEBUG: Obtener estado del container antes del resize
  
  // NO MODIFICAR las variables globales aquí - esto es solo para redimensionar un canvas específico
  // Las variables globales se actualizan en syncGlobalStatesWithCurrentPage
  const targetOrientation = orientation;
  const scale = 0.3;
  let width = paperSizes[size].width;
  let height = paperSizes[size].height;

  if (!targetOrientation) {
    [width, height] = [height, width];
  }

  canvas.setWidth(width * scale);
  canvas.setHeight(height * scale);

  // Update margin rectangle
  if (marginRect) {
    canvas.remove(marginRect);
  }

  const newMarginRect = new fabric.Rect({
    width: width * scale - 2 * marginPixels * scale,
    height: height * scale - 2 * marginPixels * scale,
    left: marginPixels * scale,
    top: marginPixels * scale,
    fill: "transparent",
    stroke: "gray",
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false,
  });

  canvas.add(newMarginRect);
  
  // Update the marginRect reference in movingEvents and scalingEvents
  updateMarginRect(newMarginRect);

  // Calcular el ancho del margen
  const marginWidth = (canvas.width - newMarginRect.width) / 2;
  
  return { marginRect: newMarginRect, marginWidth };
}

// Exportar constantes y variables para uso externo
export { paperSizes, dpi, marginInches, marginPixels }; 