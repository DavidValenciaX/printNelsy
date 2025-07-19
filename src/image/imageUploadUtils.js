import { fabric } from 'fabric';
import { arrangeImages, sortImages } from '../transform/arrangeUtils.js';
import { resetCustomGridDimensions, initializeGridControls } from '../layout/gridControls.js';

// Variables exportadas para gestión de imágenes
export const originalImages = {};
export const originalGroups = {};
export const imageState = {
  arrangementStatus: "none",
  orientation: "rows",
  order: "forward",
  spacing: 20
};

// Variable para almacenar la referencia al domManager
let domManagerInstance = null;

// Función para establecer la referencia al domManager
export function setDOMManagerInstance(domManager) {
  domManagerInstance = domManager;
}

// Función para actualizar el estado de arreglo
export function setArrangementStatus(status) {
  imageState.arrangementStatus = status;
  
  // Actualizar los botones visuales si hay una instancia del domManager
  if (domManagerInstance) {
    import('../utils/arrangementButtons.js').then(({ updateArrangementButtons }) => {
      updateArrangementButtons(status, domManagerInstance);
    }).catch(error => {
      console.warn('Error updating arrangement buttons:', error);
    });
  }
}

// Función para actualizar el layout
export function setOrientation(orientation) {
  imageState.orientation = orientation;
}

// Función para actualizar la dirección
export function setOrder(order) {
  imageState.order = order;
}

export function setSpacing(spacing) {
  imageState.spacing = parseInt(spacing, 10);
}

/**
 * Checks if the canvas has any image objects.
 * @param {fabric.Canvas} canvas The canvas instance.
 * @returns {boolean} True if the canvas has no images, false otherwise.
 */
function isCanvasEmpty(canvas) {
  return canvas.getObjects().filter((obj) => obj.type === "image" || obj.type === "group").length === 0;
}

/**
 * Configures a fabric image with necessary properties
 * @param {fabric.Image} img The fabric image instance
 * @param {string} imageUrl The image URL
 * @param {boolean} showRotateControl Whether to show rotation controls
 */
function configureImageProperties(img, imageUrl, showRotateControl) {
  if (!img.id) {
    const uniqueId = `image-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    img.id = uniqueId;
  }
  
  img.originalUrl = imageUrl;
  img.setControlsVisibility({
    mtr: showRotateControl,
  });
}

/**
 * Stores original image data for later reference
 * @param {fabric.Image[]} images Array of fabric images
 */
function storeOriginalImageData(images) {
  images.forEach((img) => {
    originalImages[img.id] = {
      url: img.originalUrl,
      width: img.width,
      height: img.height,
      scaleX: img.scaleX,
      scaleY: img.scaleY,
      angle: img.angle,
      left: img.left,
      top: img.top,
    };
  });
}

/**
 * Updates UI controls and arrangement after image processing
 * @param {fabric.Canvas} canvas The canvas instance
 * @param {string} orientation Layout orientation
 * @param {string} order Arrangement order
 */
async function updateUIAfterImageProcessing(canvas, orientation, order) {
  if (domManagerInstance) {
    initializeGridControls(canvas, domManagerInstance);
    if (domManagerInstance.eventManager) {
      domManagerInstance.eventManager.updateLayoutOrientationButtons(orientation);
      domManagerInstance.eventManager.updateOrderButtons(order);
    }
  }
  
  try {
    const { saveCurrentStateToPage } = await import('../canvas/pageUtils.js');
    await saveCurrentStateToPage();
  } catch (error) {
    console.warn('Error guardando estado de página tras carga de imagen:', error);
  }
}

/**
 * Handles the arrangement and finalization of loaded images
 * @param {fabric.Canvas} canvas The canvas instance
 * @param {fabric.Image[]} loadedImages Array of loaded images
 * @param {boolean} canvasWasEmpty Whether canvas was empty before loading
 * @param {number} numFiles Number of files processed
 */
async function finalizeImageProcessing(canvas, loadedImages, canvasWasEmpty, numFiles) {
  resetCustomGridDimensions();

  const orientation = numFiles <= 2 ? "cols" : "rows";
  const order = "forward";

  const sortedImages = sortImages(loadedImages, order);
  arrangeImages(canvas, sortedImages, orientation, null, null, imageState.spacing);

  const arrangementStatus = canvasWasEmpty ? "grid" : "none";
  setArrangementStatus(arrangementStatus);

  imageState.orientation = orientation;
  imageState.order = order;

  await updateUIAfterImageProcessing(canvas, orientation, order);
  storeOriginalImageData(loadedImages);

  if (numFiles === 1 && loadedImages.length === 1) {
    canvas.discardActiveObject();
    canvas.setActiveObject(loadedImages[0]);
    canvas.renderAll();
  }
}

/**
 * Creates a fabric image from a file result
 * @param {string} imageDataUrl The image data URL
 * @param {boolean} showRotateControl Whether to show rotation controls
 * @returns {Promise<fabric.Image>} Promise that resolves to the fabric image
 */
function createFabricImage(imageDataUrl, showRotateControl) {
  return new Promise((resolve) => {
    fabric.Image.fromURL(imageDataUrl, function (img) {
      configureImageProperties(img, imageDataUrl, showRotateControl);
      resolve(img);
    });
  });
}

/**
 * Processes a single image file
 * @param {File} file The image file to process
 * @param {boolean} showRotateControl Whether to show rotation controls
 * @returns {Promise<fabric.Image>} Promise that resolves to the fabric image
 */
function processImageFile(file, showRotateControl) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async function (event) {
      const img = await createFabricImage(event.target.result, showRotateControl);
      resolve(img);
    };
    reader.readAsDataURL(file);
  });
}

async function _processFilesForCanvas(files, canvas, rotateCheckbox) {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    return;
  }

  const canvasWasEmpty = isCanvasEmpty(canvas);
  const showRotateControl = rotateCheckbox.checked;

  try {
    const loadedImages = await Promise.all(
      imageFiles.map(file => processImageFile(file, showRotateControl))
    );

    await finalizeImageProcessing(canvas, loadedImages, canvasWasEmpty, imageFiles.length);
  } catch (error) {
    console.error('Error processing images:', error);
  }
}

// Función principal para manejar la subida de imágenes
export function handleImageUpload(e, canvas, rotateCheckbox) {
  const files = e.target.files;

  // Es una buena práctica verificar si se seleccionaron archivos.
  if (files && files.length > 0) {
    _processFilesForCanvas(files, canvas, rotateCheckbox);
  }

  // Resetea el valor del input de archivo.
  // Esto permite que el evento 'change' se dispare de nuevo si el usuario selecciona el mismo archivo.
  if (e.target) {
    e.target.value = null;
  }
}

// Nueva función para manejar el drop de imágenes
export function handleImageDrop(e, canvas, rotateCheckbox) {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    _processFilesForCanvas(files, canvas, rotateCheckbox);
  }
}