import { arrangeImages } from './arrangeUtils.js';
import { createMasonryColumnsCollage, createMasonryRowsCollage } from './collageUtils.js';
import { constrainObjectToMargin } from './constraintUtils.js';
import { updateMarginRect } from './marginRectManager.js';
import { 
  arrangementStatus, 
  lastLayout,
  setArrangementStatus
} from './imageUploadUtils.js';

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

function reAddAndArrangeImages(images, currentLayout, currentDirection, canvas, marginRect, marginWidth) {
  if (images.length > 0) {
    if (arrangementStatus === "grid") {
      // Arrange images in grid layout
      setArrangementStatus(arrangeImages(canvas, images, currentLayout, marginWidth, currentDirection));
    } else if (arrangementStatus === "columns-collage") {
      // Re-add images and create collage
      images.forEach((img) => canvas.add(img));
      const newStatus = createMasonryColumnsCollage(canvas, marginRect, Swal);
      if (newStatus) setArrangementStatus(newStatus);
    } else if (arrangementStatus === "rows-collage") {
      // Re-add images and create collage
      images.forEach((img) => canvas.add(img));
      const newStatus = createMasonryRowsCollage(canvas, marginRect, Swal);
      if (newStatus) setArrangementStatus(newStatus);
    }
    else if (arrangementStatus === "none") {
      // Re-add images and keep their positions.
      images.forEach((img) => {
        canvas.add(img);
        // Constrain image position within the new margin
        constrainObjectToMargin(img, marginRect);
      });
    }
  }
}

export function resizeCanvas(size, canvas, marginRect, orientation = isVertical) {
  // Store current canvas state
  const images = canvas.getObjects().filter((obj) => obj.type === "image");
  const currentLayout = lastLayout || (images.length <= 2 ? "cols" : "rows");
  const currentDirection = "forward";

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
  reAddAndArrangeImages(images, currentLayout, currentDirection, canvas, marginRect, marginWidth);

  canvas.renderAll();
  
  return { marginRect, marginWidth };
}

export function changeOrientation(vertical, canvas, marginRect) {
  return resizeCanvas(currentSize, canvas, marginRect, vertical);
}

// Exportar constantes y variables para uso externo
export { paperSizes, dpi, marginInches, marginPixels }; 