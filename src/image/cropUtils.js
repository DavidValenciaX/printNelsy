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

  // 1. Get the original image element from the fabric object
  const originalImageElement = img.getElement();

  // 2. Calculate the transformation from canvas coordinates to the image's local coordinates
  const imgMatrix = img.calcTransformMatrix();
  const invImgMatrix = fabric.util.invertTransform(imgMatrix);

  // 3. Define the crop rectangle's corners in canvas coordinates
  const cropTlPoint = new fabric.Point(rect.left, rect.top);
  const cropBrPoint = new fabric.Point(rect.left + rect.getScaledWidth(), rect.top + rect.getScaledHeight());

  // 4. Transform the crop rectangle's corners to the image's local coordinates
  const localTl = fabric.util.transformPoint(cropTlPoint, invImgMatrix);
  const localBr = fabric.util.transformPoint(cropBrPoint, invImgMatrix);

  // 5. Calculate the crop parameters (x, y, width, height) relative to the original image's dimensions
  // This assumes the image's origin is at its center.
  const cropX = localTl.x + img.width / 2;
  const cropY = localTl.y + img.height / 2;
  const cropWidth = localBr.x - localTl.x;
  const cropHeight = localBr.y - localTl.y;

  // 6. Create a temporary canvas to perform the high-quality crop
  const tempCanvasEl = document.createElement('canvas');
  tempCanvasEl.width = cropWidth;
  tempCanvasEl.height = cropHeight;
  const tempCtx = tempCanvasEl.getContext('2d');

  // 7. Draw the cropped portion of the original image onto the temporary canvas
  tempCtx.drawImage(
    originalImageElement,
    cropX, cropY,       // Start clipping from this point on the source image
    cropWidth, cropHeight, // The width and height of the clipped part
    0, 0,               // Place the clipped part at this point on the destination canvas
    cropWidth, cropHeight  // The width and height to draw the image on the destination canvas
  );

  // 8. Get the data URL of the cropped image from the temporary canvas
  const dataUrl = tempCanvasEl.toDataURL();

  const cropped = new Image();
  cropped.src = dataUrl;

  cropped.onload = function () {
    // Remove old image and crop rect
    canvas.remove(img);
    canvas.remove(rect);

    const originalType = img.type;
    const wasOriginallyGroup = img.originalType === 'group';

    // Create and add new cropped image
    const newImage = new fabric.Image(cropped);

    // Calculate the correct scale to make the new image fit the crop rectangle's size
    const newScaleX = rect.getScaledWidth() / newImage.width;
    const newScaleY = rect.getScaledHeight() / newImage.height;

    const newImageProps = {
      id: originalId, // Transfer the original ID
      left: rect.left + rect.getScaledWidth() / 2,
      top: rect.top + rect.getScaledHeight() / 2,
      originX: 'center',
      originY: 'center',
      scaleX: newScaleX,
      scaleY: newScaleY,
    };
    if (originalType === 'group' || wasOriginallyGroup) {
      newImageProps.originalType = 'group';
    }
    newImage.set(newImageProps);


    // Set rotation control visibility based on checkbox state
    newImage.setControlsVisibility({
      mtr: rotateCheckbox.checked,
    });

    newImage.setCoords();
    canvas.add(newImage);
    canvas.renderAll();
  };

  exitCropMode(canvas, confirmCropButton, cancelCropButton, cropButton);
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