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
  const originalId = img.id;

  // Elemento fuente (máxima resolución disponible)
  const srcEl = img._originalElement || img.getElement?.() || img._element;
  if (!srcEl) {
    showInvalidSelectionWarning();
    return;
  }

  // Tamaños y factores de escala para ir de unidades canvas -> píxeles fuente
  const imgNatW = (srcEl.naturalWidth || srcEl.width);
  const imgNatH = (srcEl.naturalHeight || srcEl.height);
  const scaledW = Math.max(1, img.getScaledWidth());
  const scaledH = Math.max(1, img.getScaledHeight());
  const factorX = imgNatW / scaledW;
  const factorY = imgNatH / scaledH;

  const cropWCanvas = rect.getScaledWidth();
  const cropHCanvas = rect.getScaledHeight();
  const offW = Math.max(1, Math.round(cropWCanvas * factorX));
  const offH = Math.max(1, Math.round(cropHCanvas * factorY));

  if (offW <= 1 || offH <= 1) {
    showInvalidSelectionWarning();
    return;
  }

  // Canvas temporal basado en Fabric para renderizar SOLO la imagen activa
  const tmpCanvas = new fabric.StaticCanvas(null, {
    width: offW,
    height: offH,
    enableRetinaScaling: false,
  });
  tmpCanvas.backgroundColor = 'white';

  // Considerar el viewport actual (zoom/pan) del canvas principal
  const vt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
  const scaledVT = [
    vt[0] * factorX,
    vt[1] * factorX,
    vt[2] * factorY,
    vt[3] * factorY,
    (vt[4] - rect.left) * factorX,
    (vt[5] - rect.top) * factorY,
  ];
  tmpCanvas.setViewportTransform(scaledVT);

  // Clonar la imagen activa con todas sus transformaciones/efectos
  img.clone((clone) => {
    // Asegurar misma visibilidad de control luego en el resultado
    tmpCanvas.add(clone);
    tmpCanvas.renderAll();

    // Exportar exactamente la región recortada a alta resolución
    const dataUrl = tmpCanvas.toDataURL({ format: 'png' });

    const newImgEl = new Image();
    newImgEl.onload = function () {
      // Eliminar original y rectángulo de recorte
      canvas.remove(img);
      canvas.remove(rect);

      const originalType = img.type;
      const wasOriginallyGroup = img.originalType === 'group';

      // Colocar centrado donde estaba el recuadro, sin duplicar rotación
      const newImage = new fabric.Image(newImgEl, {
        id: originalId,
        left: rect.left + cropWCanvas / 2,
        top: rect.top + cropHCanvas / 2,
        originX: 'center',
        originY: 'center',
        angle: 0,
        // Escalamos inversamente para que el tamaño visual coincida con el rectángulo de recorte
        scaleX: 1 / factorX,
        scaleY: 1 / factorY,
      });

      if (originalType === 'group' || wasOriginallyGroup) {
        newImage.set('originalType', 'group');
      }

      newImage.setControlsVisibility({ mtr: rotateCheckbox.checked });

      newImage.setCoords();
      canvas.add(newImage);
      canvas.renderAll();

      // Salir de modo recorte
      exitCropMode(canvas, confirmCropButton, cancelCropButton, cropButton);
    };
    newImgEl.src = dataUrl;
  });
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