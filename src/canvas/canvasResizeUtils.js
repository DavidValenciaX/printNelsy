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

// Calcula una escala responsive basada en el ancho disponible del viewport,
// descontando sidebars y paddings relevantes. Evita medir elementos que
// dependen del tamaño del canvas para no crear retroalimentación.
function getContainerAvailableWidth(canvas) {
  try {
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

    // Medir sidebars solo si están visibles
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');
    const isVisible = (el) => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const leftW = isVisible(leftSidebar) ? leftSidebar.getBoundingClientRect().width : 0;
    const rightW = isVisible(rightSidebar) ? rightSidebar.getBoundingClientRect().width : 0;

    // Paddings de contenedores principales
    const mainContent = document.getElementById('main-content');
    const mainPadding = mainContent ? (() => {
      const cs = getComputedStyle(mainContent);
      return (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    })() : 0;

    const pagesContainer = document.getElementById('pages-container');
    const pagesPadding = pagesContainer ? (() => {
      const cs = getComputedStyle(pagesContainer);
      return (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    })() : 0;

    // Gap aproximado entre columnas dentro de .main-container
    const MAIN_GAP_APPROX = 16; // 1rem aprox

    // Calcular ancho disponible partiendo del viewport
    let available = viewportWidth - leftW - rightW - mainPadding - pagesPadding - MAIN_GAP_APPROX;

    // Normalizar: no permitir negativos y nunca exceder el viewport real
    // Evitamos el mínimo fijo (p.e. 480) para que en móviles muy estrechos
    // el canvas pueda adaptarse sin desbordar.
    available = Math.max(0, Math.min(available, viewportWidth - 16));

    console.debug('[Canvas] Medición de ancho disponible (viewport-based)', {
      viewportWidth,
      available,
      leftSidebarWidth: leftW,
      rightSidebarWidth: rightW,
      mainPadding,
      pagesPadding,
      pagesContainerClientWidth: pagesContainer?.clientWidth || null
    });
    return available || viewportWidth - 16;
  } catch (e) {
    console.debug('[Canvas] getContainerAvailableWidth error', e);
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    return Math.max(0, vw - 16);
  }
}

function getResponsiveScaleForWidth(paperWidthPx, canvas) {
  const baseScale = 0.3; // escala preferida para pantallas amplias
  const SMALL_WIDTH = 1200;
  const available = getContainerAvailableWidth(canvas);

  if ((window.innerWidth || available) <= SMALL_WIDTH) {
    // En pantallas pequeñas, llenar el ancho del contenedor manteniendo proporción
    return Math.min(available / paperWidthPx, 1);
  }

  // En pantallas grandes, usar la escala base pero nunca desbordar el contenedor
  return Math.min(baseScale, available / paperWidthPx);
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
  let width = paperSizes[size].width;
  let height = paperSizes[size].height;

  if (!isVertical) {
    [width, height] = [height, width];
  }

  const scale = getResponsiveScaleForWidth(width, canvas);
  const availableWidth = getContainerAvailableWidth(canvas);
  console.info('[Canvas] Escala responsive aplicada', {
    paperSize: size,
    orientation: isVertical ? 'vertical' : 'horizontal',
    dpi,
    paperWidthPx: width,
    paperHeightPx: height,
    availableContainerWidthPx: availableWidth,
    scale,
    canvasWidthPx: Math.round(width * scale),
    canvasHeightPx: Math.round(height * scale)
  });
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
  let width = paperSizes[size].width;
  let height = paperSizes[size].height;

  if (!targetOrientation) {
    [width, height] = [height, width];
  }

  const scale = getResponsiveScaleForWidth(width, canvas);
  const availableWidth = getContainerAvailableWidth(canvas);
  console.info('[Canvas] Escala responsive aplicada (solo canvas)', {
    paperSize: size,
    orientation: targetOrientation ? 'vertical' : 'horizontal',
    dpi,
    paperWidthPx: width,
    paperHeightPx: height,
    availableContainerWidthPx: availableWidth,
    scale,
    canvasWidthPx: Math.round(width * scale),
    canvasHeightPx: Math.round(height * scale)
  });
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