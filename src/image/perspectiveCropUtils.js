import { fabric } from 'fabric';
import {
  showNoObjectSelectedWarning,
  showSingleImageWarning,
  showInvalidSelectionWarning,
} from "../utils/uiUtils.js";

// Función simplificada para transformación de perspectiva usando interpolación bilineal
function calculatePerspectiveTransform(srcCorners, dstCorners) {
  // Implementación simplificada usando interpolación bilineal
  // Esta es una aproximación que funciona bien para casos comunes
  
  return {
    transformInverse: (u, v) => {
      // Normalizar las coordenadas de destino (0-1)
      const dstWidth = Math.max(dstCorners[1][0], dstCorners[2][0]) - Math.min(dstCorners[0][0], dstCorners[3][0]);
      const dstHeight = Math.max(dstCorners[2][1], dstCorners[3][1]) - Math.min(dstCorners[0][1], dstCorners[1][1]);
      
      const normalizedU = u / dstWidth;
      const normalizedV = v / dstHeight;
      
      // Interpolación bilineal para encontrar el punto correspondiente en la imagen fuente
      const topLeft = srcCorners[0];
      const topRight = srcCorners[1];
      const bottomRight = srcCorners[2];
      const bottomLeft = srcCorners[3];
      
      // Interpolar en la dirección horizontal para el borde superior e inferior
      const topX = topLeft[0] + normalizedU * (topRight[0] - topLeft[0]);
      const topY = topLeft[1] + normalizedU * (topRight[1] - topLeft[1]);
      
      const bottomX = bottomLeft[0] + normalizedU * (bottomRight[0] - bottomLeft[0]);
      const bottomY = bottomLeft[1] + normalizedU * (bottomRight[1] - bottomLeft[1]);
      
      // Interpolar en la dirección vertical
      const finalX = topX + normalizedV * (bottomX - topX);
      const finalY = topY + normalizedV * (bottomY - topY);
      
      return [finalX, finalY];
    }
  };
}

// --- PERSPECTIVE CROP LOGIC ONLY ---

let perspectiveCorners = [];
let perspectiveLines = [];
let activePerspectiveImage = null;
let inactivatedPerspectiveObjects = [];
let isPerspectiveCropping = false;
let perspectiveCanvasBackground = null;

function createPerspectiveCorner(x, y, index) {
  return new fabric.Circle({
    left: x,
    top: y,
    radius: 8,
    fill: '#007bffcc',
    stroke: 'blue',
    strokeWidth: 2,
    originX: 'center',
    originY: 'center',
    hasControls: false,
    hasBorders: false,
    selectable: true,
    evented: true,
    cornerIndex: index,
    name: `perspectiveCorner${index}`
  });
}

function createPerspectiveLine(corner1, corner2) {
  return new fabric.Line([
    corner1.left, corner1.top,
    corner2.left, corner2.top
  ], {
    stroke: 'blue',
    strokeWidth: 1.5,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false,
    name: 'perspectiveLine'
  });
}

function updatePerspectiveLines(canvas) {
  if (perspectiveLines.length !== 4 || perspectiveCorners.length !== 4) return;

  for (let i = 0; i < 4; i++) {
    const nextIndex = (i + 1) % 4;
    const line = perspectiveLines[i];
    const corner1 = perspectiveCorners[i];
    const corner2 = perspectiveCorners[nextIndex];

    line.set({
      x1: corner1.left,
      y1: corner1.top,
      x2: corner2.left,
      y2: corner2.top
    });
  }
  canvas.requestRenderAll();
}

function setupPerspectiveCornerEvents(canvas) {
  perspectiveCorners.forEach(corner => {
    corner.on('moving', () => {
      updatePerspectiveLines(canvas);
    });
  });
}

function disablePerspectiveOtherObjects(canvas, marginRect) {
  canvas.getObjects().forEach((obj) => {
    const isPerspectiveControl = perspectiveCorners.includes(obj) || perspectiveLines.includes(obj);

    if (!isPerspectiveControl && obj !== marginRect) {
      inactivatedPerspectiveObjects.push({
        object: obj,
        originalOpacity: obj.opacity,
      });

      if (obj !== activePerspectiveImage) {
        obj.set({
          opacity: 0.3,
        });
      }
      
      obj.set({
        selectable: false,
        evented: false,
      });
    }
  });
  canvas.requestRenderAll();
}

function restorePerspectiveOtherObjects(canvas) {
  inactivatedPerspectiveObjects.forEach((item) => {
    // Don't restore properties for background
    if (item.object.name !== "background" && item.object.name !== "perspectiveBackground") {
      item.object.set({
        opacity: item.originalOpacity,
        selectable: true,
        evented: true,
      });
    }
  });
  inactivatedPerspectiveObjects = [];
  canvas.requestRenderAll();
}

function enterPerspectiveCropMode(imgObject, canvas, marginRect, confirmButton, cancelButton, perspectiveButton) {
  activePerspectiveImage = imgObject;
  isPerspectiveCropping = true;

  // Get image bounding rect
  const bounds = imgObject.getBoundingRect();

  // Create 4 corners at the corners of the image
  const topLeft = createPerspectiveCorner(bounds.left, bounds.top, 0);
  const topRight = createPerspectiveCorner(bounds.left + bounds.width, bounds.top, 1);
  const bottomRight = createPerspectiveCorner(bounds.left + bounds.width, bounds.top + bounds.height, 2);
  const bottomLeft = createPerspectiveCorner(bounds.left, bounds.top + bounds.height, 3);

  perspectiveCorners = [topLeft, topRight, bottomRight, bottomLeft];

  // Create lines connecting the corners
  for (let i = 0; i < 4; i++) {
    const nextIndex = (i + 1) % 4;
    const line = createPerspectiveLine(perspectiveCorners[i], perspectiveCorners[nextIndex]);
    perspectiveLines.push(line);
  }

  // Add corners and lines to canvas
  perspectiveCorners.forEach(corner => canvas.add(corner));
  perspectiveLines.forEach(line => canvas.add(line));

  // Bring corners to front
  perspectiveCorners.forEach(corner => corner.bringToFront());

  // Setup corner movement events
  setupPerspectiveCornerEvents(canvas);

  // Disable other objects
  disablePerspectiveOtherObjects(canvas, marginRect);

  canvas.discardActiveObject();
  canvas.requestRenderAll();

  // Show perspective crop control buttons
  confirmButton.style.display = "inline";
  cancelButton.style.display = "inline";
  perspectiveButton.style.display = "none";
}

function initializePerspectiveCrop(canvas, Swal, confirmButton, cancelButton, perspectiveButton, marginRect, rotateCheckbox) {
  const activeObjects = canvas.getActiveObjects();

  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
    return;
  }

  if (activeObjects.length !== 1) {
    showSingleImageWarning();
    return;
  }

  const activeObject = activeObjects[0];
  
  if (activeObject.type !== "image" && activeObject.type !== 'group') {
    showInvalidSelectionWarning();
    return;
  }

  enterPerspectiveCropMode(activeObject, canvas, marginRect, confirmButton, cancelButton, perspectiveButton);
}

function confirmPerspectiveCrop(canvas, marginRect, rotateCheckbox, Swal, confirmButton, cancelButton, perspectiveButton) {
  if (!isPerspectiveCropping || perspectiveCorners.length !== 4 || !activePerspectiveImage) {
    showNoObjectSelectedWarning();
    return;
  }

  try {
    // Mostrar indicador de procesamiento
    Swal.fire({
      title: 'Procesando...',
      text: 'Aplicando transformación de perspectiva',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    // 1. OBTENER COORDENADAS DE LAS ESQUINAS
    const srcCorners = perspectiveCorners.map(corner => [corner.left, corner.top]);

    // 2. CALCULAR DIMENSIONES DE LA IMAGEN DE SALIDA
    const width1 = Math.sqrt(Math.pow(srcCorners[1][0] - srcCorners[0][0], 2) + Math.pow(srcCorners[1][1] - srcCorners[0][1], 2));
    const width2 = Math.sqrt(Math.pow(srcCorners[2][0] - srcCorners[3][0], 2) + Math.pow(srcCorners[2][1] - srcCorners[3][1], 2));
    const destWidth = Math.max(width1, width2);

    const height1 = Math.sqrt(Math.pow(srcCorners[3][0] - srcCorners[0][0], 2) + Math.pow(srcCorners[3][1] - srcCorners[0][1], 2));
    const height2 = Math.sqrt(Math.pow(srcCorners[2][0] - srcCorners[1][0], 2) + Math.pow(srcCorners[2][1] - srcCorners[1][1], 2));
    const destHeight = Math.max(height1, height2);

    // Esquinas del rectángulo de destino (imagen final rectangular)
    const dstCorners = [[0, 0], [destWidth, 0], [destWidth, destHeight], [0, destHeight]];

    // 3. CALCULAR LA MATRIZ DE TRANSFORMACIÓN INVERSA
    const transform = calculatePerspectiveTransform(srcCorners, dstCorners);

    // 4. CREAR UN CANVAS TEMPORAL PARA RENDERIZAR LA NUEVA IMAGEN
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(destWidth);
    tempCanvas.height = Math.round(destHeight);
    const tempCtx = tempCanvas.getContext('2d');

    // 5. OBTENER LOS DATOS DE LA IMAGEN ORIGINAL
    // Primero, necesitamos hacer temporalmente invisibles los controles de perspectiva
    perspectiveCorners.forEach(corner => corner.set({ visible: false }));
    perspectiveLines.forEach(line => line.set({ visible: false }));
    canvas.renderAll(); // Usamos renderAll() para un renderizado síncrono

    // Obtener los datos del canvas completo
    const canvasCtx = canvas.getContext('2d');
    const sourceImageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);

    // Crear los datos de la imagen transformada
    const transformedImageData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);

    // 6. APLICAR TRANSFORMACIÓN PÍXEL A PÍXEL
    for (let y = 0; y < tempCanvas.height; y++) {
      for (let x = 0; x < tempCanvas.width; x++) {
        // Transformar coordenadas inversas para encontrar el píxel fuente
        const sourceCoords = transform.transformInverse(x, y);
        const sourceX = Math.round(sourceCoords[0]);
        const sourceY = Math.round(sourceCoords[1]);

        // Verificar si las coordenadas están dentro del canvas original
        if (sourceX >= 0 && sourceX < canvas.width && sourceY >= 0 && sourceY < canvas.height) {
          const sourceIndex = (sourceY * canvas.width + sourceX) * 4;
          const destIndex = (y * tempCanvas.width + x) * 4;

          // Copiar los valores RGBA
          transformedImageData.data[destIndex] = sourceImageData.data[sourceIndex];     // R
          transformedImageData.data[destIndex + 1] = sourceImageData.data[sourceIndex + 1]; // G
          transformedImageData.data[destIndex + 2] = sourceImageData.data[sourceIndex + 2]; // B
          transformedImageData.data[destIndex + 3] = sourceImageData.data[sourceIndex + 3]; // A
        } else {
          // Píxel fuera del canvas original - establecer como transparente
          const destIndex = (y * tempCanvas.width + x) * 4;
          transformedImageData.data[destIndex + 3] = 0; // A = 0 (transparente)
        }
      }
    }

    // Dibujar la imagen transformada en el canvas temporal
    tempCtx.putImageData(transformedImageData, 0, 0);

    // 7. REEMPLAZAR LA IMAGEN ANTIGUA CON LA NUEVA
    const newImageSrc = tempCanvas.toDataURL();
    const originalId = activePerspectiveImage.id;
    const originalType = activePerspectiveImage.type;
    const wasOriginallyGroup = activePerspectiveImage.originalType === 'group';
    const originalLeft = Math.min(...srcCorners.map(c => c[0]));
    const originalTop = Math.min(...srcCorners.map(c => c[1]));

    // Remover la imagen original
    canvas.remove(activePerspectiveImage);

    // Crear la nueva imagen transformada
    fabric.Image.fromURL(newImageSrc, (newImage) => {
      const newImageProps = {
        id: originalId,
        left: originalLeft + newImage.width / 2,
        top: originalTop + newImage.height / 2,
        originX: 'center',
        originY: 'center',
      };

      if (originalType === 'group' || wasOriginallyGroup) {
        newImageProps.originalType = 'group';
      }
      newImage.set(newImageProps);

      // Configurar controles de rotación según el checkbox
      newImage.setControlsVisibility({
        mtr: rotateCheckbox.checked,
      });

      newImage.setCoords();
      canvas.add(newImage);
      canvas.renderAll();

      // Cerrar el diálogo de "Procesando..." en lugar de mostrar un mensaje de éxito
      Swal.close();

      // Salir del modo de recorte en perspectiva
      exitPerspectiveCropMode(canvas, confirmButton, cancelButton, perspectiveButton, newImage);
    });

  } catch (error) {
    console.error('Error en transformación de perspectiva:', error);
    
    // Restaurar visibilidad de los controles en caso de error
    if (perspectiveCorners.length > 0) {
      perspectiveCorners.forEach(corner => corner.set({ visible: true }));
      perspectiveLines.forEach(line => line.set({ visible: true }));
      canvas.renderAll();
    }

    Swal.fire({
      title: 'Error',
      text: 'Hubo un problema al aplicar la transformación de perspectiva. Por favor, inténtalo de nuevo.',
      icon: 'error'
    });
  }
}

function exitPerspectiveCropMode(canvas, confirmButton, cancelButton, perspectiveButton, newActiveObject = null) {
  // Remove corners and lines from canvas
  perspectiveCorners.forEach(corner => canvas.remove(corner));
  perspectiveLines.forEach(line => canvas.remove(line));

  // Clear arrays
  perspectiveCorners = [];
  perspectiveLines = [];

  isPerspectiveCropping = false;
  
  // Restore other objects before resetting the active image
  restorePerspectiveOtherObjects(canvas);
  
  // Reselect the active image if it still exists
  if (newActiveObject) {
    canvas.setActiveObject(newActiveObject);
  } else if (activePerspectiveImage) {
    canvas.setActiveObject(activePerspectiveImage);
  }
  activePerspectiveImage = null;


  // Hide perspective crop control buttons
  confirmButton.style.display = "none";
  cancelButton.style.display = "none";
  perspectiveButton.style.display = "inline";

  canvas.requestRenderAll();
}

export {
  initializePerspectiveCrop,
  confirmPerspectiveCrop,
  exitPerspectiveCropMode
};