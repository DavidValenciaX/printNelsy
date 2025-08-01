import { fabric } from 'fabric';
import {
  showNoObjectSelectedWarning,
  showSingleImageWarning,
  showInvalidSelectionWarning,
} from "../utils/uiUtils.js";

// --- NORMAL CROP LOGIC ONLY ---

let cropRect = null;
let activeImage = null;
let inactivatedObjects = [];
let isCropping = false;
let canvasBackground = null;

function disableOtherObjects(canvas, marginRect) {
  canvas.getObjects().forEach((obj) => {
    if (obj !== cropRect && obj !== marginRect) {
      inactivatedObjects.push({
        object: obj,
        originalOpacity: obj.opacity,
      });

      if (obj !== activeImage) {
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

function restoreOtherObjects(canvas) {
  inactivatedObjects.forEach((item) => {
    // Don't restore properties for background
    if (item.object.name !== "background") {
      item.object.set({
        opacity: item.originalOpacity,
        selectable: true,
        evented: true,
      });
    }
  });
  inactivatedObjects = [];
  canvas.requestRenderAll();
}

function enterCropMode(imgObject, canvas, marginRect, confirmCropButton, cancelCropButton, cropButton) {
  activeImage = imgObject;
  isCropping = true;

  // Get image bounding rect
  const bounds = imgObject.getBoundingRect();

  // Create crop rect using bounds
  cropRect = new fabric.Rect({
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    fill: "transparent",
    stroke: "blue",
    strokeWidth: 1.5,
    strokeDashArray: [5, 5],
    absolutePositioned: true,
    transparentCorners: false,
    cornerColor: "#007bffcc",
    cornerStyle: "circle",
    cornerSize: 16,
    cornerStrokeColor: "blue",
    hasBorders: false,
  });

  canvas.add(cropRect);

  // Bring both objects to front
  imgObject.bringToFront();
  cropRect.bringToFront();

  // Disable other objects
  disableOtherObjects(canvas, marginRect);

  canvas.setActiveObject(cropRect);

  // Show crop control buttons
  confirmCropButton.style.display = "inline";
  cancelCropButton.style.display = "inline";
  cropButton.style.display = "none";
}

function createCanvasBackground(canvas) {
  // Remove existing background if it exists
  if (canvasBackground) {
    canvas.remove(canvasBackground);
  }

  canvasBackground = new fabric.Rect({
    left: 0,
    top: 0,
    width: canvas.width,
    height: canvas.height,
    fill: "white",
    selectable: false,
    evented: false,
    name: "background", // Add an identifier
  });

  canvas.add(canvasBackground);
  canvas.sendToBack(canvasBackground);
}

function confirmCrop(canvas, marginRect, rotateCheckbox, Swal, confirmCropButton, cancelCropButton, cropButton) {
  if (!isCropping || !cropRect || !activeImage) {
    showNoObjectSelectedWarning();
    return;
  }

  const rect = cropRect;
  const img = activeImage;
  const originalId = img.id; // Save original ID

  // Guardar escala original para aplicarla al resultado
  const originalScaleX = img.scaleX || 1;
  const originalScaleY = img.scaleY || 1;
  const originalFlipX = !!img.flipX;
  const originalFlipY = !!img.flipY;
  const originalSkewX = img.skewX || 0;
  const originalSkewY = img.skewY || 0;

  // Obtener elemento fuente (alta resolución)
  const srcEl = img._originalElement || img.getElement?.() || img._element;
  if (!srcEl) {
    showInvalidSelectionWarning();
    return;
  }

  // Matriz del objeto e inversa (incluye traslación, escala, rotación, skew)
  const objMatrix = img.calcTransformMatrix();
  const invMatrix = fabric.util.invertTransform(objMatrix);

  // Función para transformar punto canvas -> espacio local del objeto
  const toLocal = (x, y) => fabric.util.transformPoint(new fabric.Point(x, y), invMatrix);

  // Esquinas del rectángulo de recorte en espacio canvas
  const cornersCanvas = [
    new fabric.Point(rect.left, rect.top),
    new fabric.Point(rect.left + rect.getScaledWidth(), rect.top),
    new fabric.Point(rect.left + rect.getScaledWidth(), rect.top + rect.getScaledHeight()),
    new fabric.Point(rect.left, rect.top + rect.getScaledHeight())
  ];

  // Pasar a espacio local del objeto
  const localPts = cornersCanvas.map(p => toLocal(p.x, p.y));

  // Convertir a píxeles de la imagen fuente
  const scaleToSourceX = (srcEl.naturalWidth || srcEl.width) / img.width;
  const scaleToSourceY = (srcEl.naturalHeight || srcEl.height) / img.height;

  const srcPts = localPts.map(p => new fabric.Point(
    (p.x + img.width / 2) * scaleToSourceX,
    (p.y + img.height / 2) * scaleToSourceY
  ));

  // Bounding box del recorte en la imagen fuente
  const minX = Math.max(0, Math.floor(Math.min(...srcPts.map(p => p.x))));
  const minY = Math.max(0, Math.floor(Math.min(...srcPts.map(p => p.y))));
  const maxX = Math.min((srcEl.naturalWidth || srcEl.width), Math.ceil(Math.max(...srcPts.map(p => p.x))));
  const maxY = Math.min((srcEl.naturalHeight || srcEl.height), Math.ceil(Math.max(...srcPts.map(p => p.y))));

  const cropW = Math.max(1, maxX - minX);
  const cropH = Math.max(1, maxY - minY);

  if (cropW <= 1 || cropH <= 1) {
    showInvalidSelectionWarning();
    return;
  }

  // Canvas temporal a resolución nativa
  const off = document.createElement('canvas');
  off.width = cropW;
  off.height = cropH;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(srcEl, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  // Crear imagen recortada
  const newImgEl = new Image();
  newImgEl.onload = function () {
    const newImage = new fabric.Image(newImgEl);

    // Quitar imagen original y el rectángulo de recorte
    canvas.remove(img);
    canvas.remove(rect);

    const originalType = img.type;
    const wasOriginallyGroup = img.originalType === 'group';

    // Centro del rectángulo de recorte en canvas
    const centerCanvas = new fabric.Point(
      rect.left + rect.getScaledWidth() / 2,
      rect.top + rect.getScaledHeight() / 2
    );

    const newImageProps = {
      id: originalId,
      left: centerCanvas.x,
      top: centerCanvas.y,
      originX: 'center',
      originY: 'center',
      angle: img.angle || 0,
      // Mantener transformaciones del original
      scaleX: originalScaleX,
      scaleY: originalScaleY,
      flipX: originalFlipX,
      flipY: originalFlipY,
      skewX: originalSkewX,
      skewY: originalSkewY
    };

    if (originalType === 'group' || wasOriginallyGroup) {
      newImageProps.originalType = 'group';
    }

    newImage.set(newImageProps);

    // Visibilidad del control de rotación según el checkbox
    newImage.setControlsVisibility({ mtr: rotateCheckbox.checked });

    newImage.setCoords();
    canvas.add(newImage);
    canvas.renderAll();

    // Salir de modo recorte
    exitCropMode(canvas, confirmCropButton, cancelCropButton, cropButton);
  };
  newImgEl.src = off.toDataURL('image/png');
}

function exitCropMode(canvas, confirmCropButton, cancelCropButton, cropButton) {
  if (cropRect) {
    canvas.remove(cropRect);
    cropRect = null;
  }

  isCropping = false;
  activeImage = null;

  // Restore other objects
  restoreOtherObjects(canvas);

  // Hide crop control buttons
  confirmCropButton.style.display = "none";
  cancelCropButton.style.display = "none";
  cropButton.style.display = "inline";
}

// Función para inicializar el recorte desde el botón crop
function initializeCrop(canvas, Swal, confirmCropButton, cancelCropButton, cropButton, marginRect, rotateCheckbox) {
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

  enterCropMode(activeObject, canvas, marginRect, confirmCropButton, cancelCropButton, cropButton);
}

export { 
  initializeCrop, 
  confirmCrop, 
  exitCropMode, 
  createCanvasBackground,
  disableOtherObjects,
  restoreOtherObjects
};