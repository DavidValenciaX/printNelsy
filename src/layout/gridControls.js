import { arrangeImages, getCurrentGridDimensions } from '../transform/arrangeUtils.js';
import { imageState, setArrangementStatus } from '../image/imageUploadUtils.js';

// Constantes para los límites del grid
const MIN_ROWS = 1;
const MIN_COLS = 1;
const MAX_ROWS = 20;
const MAX_COLS = 20;

// Estado actual del grid personalizado
let currentCustomRows = null;
let currentCustomCols = null;

/**
 * Actualiza los displays de filas y columnas en la UI
 */
export function updateGridDisplays(rows, cols, domManager) {
  const rowsDisplay = domManager.get('rowsDisplay');
  const colsDisplay = domManager.get('colsDisplay');
  
  if (rowsDisplay) rowsDisplay.textContent = rows;
  if (colsDisplay) colsDisplay.textContent = cols;
}

/**
 * Actualiza el estado de los botones de incremento/decremento
 */
export function updateGridControlButtons(rows, cols, imageCount, domManager) {
  const increaseRowsButton = domManager.get('increaseRowsButton');
  const decreaseRowsButton = domManager.get('decreaseRowsButton');
  const increaseColsButton = domManager.get('increaseColsButton');
  const decreaseColsButton = domManager.get('decreaseColsButton');
  
  // Deshabilitar botones según los límites y la cantidad de imágenes
  if (increaseRowsButton) {
    increaseRowsButton.disabled = rows >= MAX_ROWS || (rows >= imageCount);
  }
  if (decreaseRowsButton) {
    decreaseRowsButton.disabled = rows <= MIN_ROWS || ((rows - 1) * cols < imageCount);
  }
  if (increaseColsButton) {
    increaseColsButton.disabled = cols >= MAX_COLS || (cols >= imageCount);
  }
  if (decreaseColsButton) {
    decreaseColsButton.disabled = cols <= MIN_COLS || (rows * (cols - 1) < imageCount);
  }
}

/**
 * Muestra u oculta los controles de grid según el estado de arreglo
 */
export function toggleGridControlsVisibility(domManager) {
  const gridControlsGroup = domManager.get('gridControlsGroup');
  const isGridArrangement = imageState.arrangementStatus === 'grid' && 
                           (imageState.lastLayout === 'rows' || imageState.lastLayout === 'cols');
  
  if (gridControlsGroup) {
    gridControlsGroup.style.display = isGridArrangement ? 'flex' : 'none';
  }
}

/**
 * Inicializa los controles de grid con los valores actuales
 */
export function initializeGridControls(canvas, domManager) {
  const images = canvas.getObjects().filter(obj => obj.type === 'image');
  
  if (images.length === 0) {
    toggleGridControlsVisibility(domManager);
    return;
  }
  
  const isGridArrangement = imageState.arrangementStatus === 'grid' && 
                           (imageState.lastLayout === 'rows' || imageState.lastLayout === 'cols');
  
  if (isGridArrangement) {
    // Si no tenemos dimensiones personalizadas, calcular las actuales y guardarlas
    if (currentCustomRows === null && currentCustomCols === null) {
      const dimensions = getCurrentGridDimensions(images, imageState.lastLayout);
      currentCustomRows = dimensions.rows;
      currentCustomCols = dimensions.cols;
    }
    
    // Usar las dimensiones personalizadas (ya sean las que teníamos o las que acabamos de calcular)
    updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
    updateGridControlButtons(currentCustomRows, currentCustomCols, images.length, domManager);
  }
  
  toggleGridControlsVisibility(domManager);
}

/**
 * Incrementa el número de filas
 */
export function increaseRows(canvas, marginWidth, domManager) {
  const images = canvas.getObjects().filter(obj => obj.type === 'image');
  if (images.length === 0) return;
  
  const newRows = Math.min(currentCustomRows + 1, MAX_ROWS);
  if (newRows === currentCustomRows) return; // No cambió
  
  currentCustomRows = newRows;
  
  // Remover imágenes del canvas
  images.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  setArrangementStatus(arrangeImages(
    canvas, 
    images, 
    imageState.lastLayout, 
    marginWidth, 
    imageState.lastDirection,
    currentCustomRows,
    currentCustomCols
  ));
  
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, images.length, domManager);
}

/**
 * Decrementa el número de filas
 */
export function decreaseRows(canvas, marginWidth, domManager) {
  const images = canvas.getObjects().filter(obj => obj.type === 'image');
  if (images.length === 0) return;
  
  const newRows = Math.max(currentCustomRows - 1, MIN_ROWS);
  if (newRows === currentCustomRows) return; // No cambió
  
  currentCustomRows = newRows;
  
  // Remover imágenes del canvas
  images.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  setArrangementStatus(arrangeImages(
    canvas, 
    images, 
    imageState.lastLayout, 
    marginWidth, 
    imageState.lastDirection,
    currentCustomRows,
    currentCustomCols
  ));
  
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, images.length, domManager);
}

/**
 * Incrementa el número de columnas
 */
export function increaseCols(canvas, marginWidth, domManager) {
  const images = canvas.getObjects().filter(obj => obj.type === 'image');
  if (images.length === 0) return;
  
  const newCols = Math.min(currentCustomCols + 1, MAX_COLS);
  if (newCols === currentCustomCols) return; // No cambió
  
  currentCustomCols = newCols;
  
  // Remover imágenes del canvas
  images.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  setArrangementStatus(arrangeImages(
    canvas, 
    images, 
    imageState.lastLayout, 
    marginWidth, 
    imageState.lastDirection,
    currentCustomRows,
    currentCustomCols
  ));
  
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, images.length, domManager);
}

/**
 * Decrementa el número de columnas
 */
export function decreaseCols(canvas, marginWidth, domManager) {
  const images = canvas.getObjects().filter(obj => obj.type === 'image');
  if (images.length === 0) return;
  
  const newCols = Math.max(currentCustomCols - 1, MIN_COLS);
  if (newCols === currentCustomCols) return; // No cambió
  
  currentCustomCols = newCols;
  
  // Remover imágenes del canvas
  images.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  setArrangementStatus(arrangeImages(
    canvas, 
    images, 
    imageState.lastLayout, 
    marginWidth, 
    imageState.lastDirection,
    currentCustomRows,
    currentCustomCols
  ));
  
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, images.length, domManager);
}

/**
 * Resetea las dimensiones personalizadas del grid
 */
export function resetCustomGridDimensions() {
  currentCustomRows = null;
  currentCustomCols = null;
}

/**
 * Obtiene las dimensiones personalizadas actuales
 */
export function getCustomGridDimensions() {
  return {
    rows: currentCustomRows,
    cols: currentCustomCols
  };
} 