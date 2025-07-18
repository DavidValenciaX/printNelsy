import { arrangeImages, getCurrentGridDimensions, sortImages } from '../transform/arrangeUtils.js';
import { imageState, setArrangementStatus, setSpacing } from '../image/imageUploadUtils.js';
import { fabric } from 'fabric';
import { getCurrentMarginRect } from '../canvas/marginRectManager.js';

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
export function toggleGridControlsVisibility(canvas, domManager) {
  const gridControlsGroup = domManager.get('gridControlsGroup');
  
  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  const objectCount = objects.length;

  const isGridArrangement = imageState.arrangementStatus === 'grid' && 
                           (imageState.orientation === 'rows' || imageState.orientation === 'cols');
  
  const shouldShow = isGridArrangement && objectCount > 1;

  if (gridControlsGroup) {
    gridControlsGroup.style.display = shouldShow ? 'flex' : 'none';
  }
  updateGridVisualization(canvas);
}

/**
 * Inicializa los controles de grid con los valores actuales
 */
export function initializeGridControls(canvas, domManager) {
  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  
  if (objects.length === 0) {
    toggleGridControlsVisibility(canvas, domManager);
    return;
  }
  
  const isGridArrangement = imageState.arrangementStatus === 'grid' && 
                           (imageState.orientation === 'rows' || imageState.orientation === 'cols');
  
  if (isGridArrangement) {
    // Si no tenemos dimensiones personalizadas, calcular las actuales y guardarlas
    if (currentCustomRows === null && currentCustomCols === null) {
      const dimensions = getCurrentGridDimensions(objects, imageState.orientation);
      currentCustomRows = dimensions.rows;
      currentCustomCols = dimensions.cols;
    }
    
    // Usar las dimensiones personalizadas (ya sean las que teníamos o las que acabamos de calcular)
    updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
    updateGridControlButtons(currentCustomRows, currentCustomCols, objects.length, domManager);
  }
  
  // Actualizar controles de espaciado
  const spacingRange = domManager.get('spacingRange');
  const spacingDisplay = domManager.get('spacingDisplay');
  if (spacingRange) spacingRange.value = imageState.spacing;
  if (spacingDisplay) spacingDisplay.textContent = imageState.spacing;

  toggleGridControlsVisibility(canvas, domManager);
}

/**
 * Incrementa el número de filas
 */
export function increaseRows(canvas, domManager) {
  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  if (objects.length === 0) return;
  
  const newRows = Math.min(currentCustomRows + 1, MAX_ROWS);
  if (newRows === currentCustomRows) return; // No cambió
  
  currentCustomRows = newRows;
  
  // Remover imágenes del canvas
  objects.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  const sortedObjects = sortImages(objects, imageState.order);
  setArrangementStatus(arrangeImages(
    canvas, 
    sortedObjects, 
    imageState.orientation, 
    currentCustomRows,
    currentCustomCols,
    imageState.spacing
  ));
  
  updateGridVisualization(canvas);
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, objects.length, domManager);
}

/**
 * Decrementa el número de filas
 */
export function decreaseRows(canvas, domManager) {
  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  if (objects.length === 0) return;
  
  const newRows = Math.max(currentCustomRows - 1, MIN_ROWS);
  if (newRows === currentCustomRows) return; // No cambió
  
  currentCustomRows = newRows;
  
  // Remover imágenes del canvas
  objects.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  const sortedObjects = sortImages(objects, imageState.order);
  setArrangementStatus(arrangeImages(
    canvas, 
    sortedObjects, 
    imageState.orientation, 
    currentCustomRows,
    currentCustomCols,
    imageState.spacing
  ));
  
  updateGridVisualization(canvas);
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, objects.length, domManager);
}

/**
 * Incrementa el número de columnas
 */
export function increaseCols(canvas, domManager) {
  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  if (objects.length === 0) return;
  
  const newCols = Math.min(currentCustomCols + 1, MAX_COLS);
  if (newCols === currentCustomCols) return; // No cambió
  
  currentCustomCols = newCols;
  
  // Remover imágenes del canvas
  objects.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  const sortedObjects = sortImages(objects, imageState.order);
  setArrangementStatus(arrangeImages(
    canvas, 
    sortedObjects, 
    imageState.orientation, 
    currentCustomRows,
    currentCustomCols,
    imageState.spacing
  ));
  
  updateGridVisualization(canvas);
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, objects.length, domManager);
}

/**
 * Decrementa el número de columnas
 */
export function decreaseCols(canvas, domManager) {
  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  if (objects.length === 0) return;
  
  const newCols = Math.max(currentCustomCols - 1, MIN_COLS);
  if (newCols === currentCustomCols) return; // No cambió
  
  currentCustomCols = newCols;
  
  // Remover imágenes del canvas
  objects.forEach(img => canvas.remove(img));
  
  // Reorganizar con las nuevas dimensiones
  const sortedObjects = sortImages(objects, imageState.order);
  setArrangementStatus(arrangeImages(
    canvas, 
    sortedObjects, 
    imageState.orientation, 
    currentCustomRows,
    currentCustomCols,
    imageState.spacing
  ));
  
  updateGridVisualization(canvas);
  updateGridDisplays(currentCustomRows, currentCustomCols, domManager);
  updateGridControlButtons(currentCustomRows, currentCustomCols, objects.length, domManager);
}

/**
 * Resetea las dimensiones personalizadas del grid
 */
export function resetCustomGridDimensions() {
  currentCustomRows = null;
  currentCustomCols = null;
  setSpacing(20);
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

/**
 * Actualiza el espaciado entre imágenes en el grid
 */
export function updateImageSpacing(canvas, domManager, spacing) {
  setSpacing(spacing);

  const spacingDisplay = domManager.get('spacingDisplay');
  if (spacingDisplay) spacingDisplay.textContent = spacing;

  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  if (objects.length === 0 || imageState.arrangementStatus !== 'grid') return;

  // Remover imágenes para reorganizar
  objects.forEach(img => canvas.remove(img));

  const customDimensions = getCustomGridDimensions();
  const sortedObjects = sortImages(objects, imageState.order);

  setArrangementStatus(arrangeImages(
    canvas,
    sortedObjects,
    imageState.orientation,
    customDimensions.rows,
    customDimensions.cols,
    imageState.spacing
  ));

  updateGridVisualization(canvas);
}

// --- Grid Visualization Logic ---

/**
 * Removes the grid lines from the canvas.
 * @param {fabric.Canvas} canvas The canvas instance.
 */
function removeGrid(canvas) {
  const gridLines = canvas.getObjects('line').filter(obj => obj.isGridLine);
  gridLines.forEach(line => canvas.remove(line));
}

/**
 * Draws a grid on the canvas based on the specified rows and columns.
 * @param {fabric.Canvas} canvas The canvas instance.
 * @param {number} rows The number of rows.
 * @param {number} cols The number of columns.
 * @param {fabric.Rect} marginRect The margin rectangle defining the grid area.
 */
function drawGrid(canvas, rows, cols, marginRect) {
  if (!marginRect || (rows <= 1 && cols <= 1)) {
    return;
  }

  const cellWidth = marginRect.width / cols;
  const cellHeight = marginRect.height / rows;

  // Draw vertical lines
  for (let i = 1; i < cols; i++) {
    const x = marginRect.left + i * cellWidth;
    const line = new fabric.Line([x, marginRect.top, x, marginRect.top + marginRect.height], {
      stroke: 'gray',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      isGridLine: true
    });
    canvas.add(line);
  }

  // Draw horizontal lines
  for (let i = 1; i < rows; i++) {
    const y = marginRect.top + i * cellHeight;
    const line = new fabric.Line([marginRect.left, y, marginRect.left + marginRect.width, y], {
      stroke: 'gray',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      isGridLine: true
    });
    canvas.add(line);
  }
}

/**
 * Updates the grid visualization on the canvas based on the current arrangement state.
 * @param {fabric.Canvas} canvas The canvas instance.
 */
export function updateGridVisualization(canvas) {
  removeGrid(canvas);

  const marginRect = getCurrentMarginRect();
  if (!marginRect) return;

  const objects = canvas.getObjects().filter(obj => obj.type === 'image' || obj.type === 'group');
  const isGridArrangement = imageState.arrangementStatus === 'grid' &&
                           (imageState.orientation === 'rows' || imageState.orientation === 'cols');

  if (isGridArrangement && objects.length > 0) {
    const customDimensions = getCustomGridDimensions();
    let dims;
    if (customDimensions.rows !== null && customDimensions.cols !== null) {
      dims = { rows: customDimensions.rows, cols: customDimensions.cols };
    } else {
      dims = getCurrentGridDimensions(objects, imageState.orientation);
    }
    drawGrid(canvas, dims.rows, dims.cols, marginRect);
  }

  canvas.renderAll();
} 

/**
 * Gets all grid lines from the canvas
 * @param {fabric.Canvas} canvas The canvas instance.
 * @returns {fabric.Line[]} Array of grid line objects
 */
export function getGridLines(canvas) {
  return canvas.getObjects('line').filter(obj => obj.isGridLine);
}

/**
 * Hides grid lines temporarily by setting their opacity to 0
 * @param {fabric.Canvas} canvas The canvas instance.
 * @returns {Object[]} Array of objects with line reference and original opacity
 */
export function hideGridLines(canvas) {
  const gridLines = getGridLines(canvas);
  const originalOpacities = [];
  
  gridLines.forEach(line => {
    originalOpacities.push({
      line: line,
      opacity: line.opacity
    });
    line.opacity = 0;
  });
  
  return originalOpacities;
}

/**
 * Restores grid lines opacity to their original values
 * @param {fabric.Canvas} canvas The canvas instance.
 * @param {Object[]} originalOpacities Array of objects with line reference and original opacity
 */
export function restoreGridLines(canvas, originalOpacities) {
  originalOpacities.forEach(({ line, opacity }) => {
    line.opacity = opacity;
  });
} 