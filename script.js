import { zoomIn, zoomOut, applyZoom } from './zoom.js';
import { centerVertically, centerHorizontally } from './center.js';
import { createMasonryColumnsCollage, createMasonryRowsCollage, collageArrange } from './collageUtils.js';
import { 
  setImageSizeInCm
} from './imageSize.js';
import { constrainObjectToMargin } from './constraintUtils.js';
import { printCanvas } from './printUtils.js';
import { deactivateObjects } from './deactivateObjects.js';
import { rotateImage } from './rotateUtils.js';
import { resetActiveImage } from './resetUtils.js';
import { deleteActiveObject } from './deleteUtils.js';
import { scaleUp, scaleDown } from './scaleUtils.js';
import { convertToGrayscale } from './imageEffects.js';
import { arrangeImages } from './arrangeUtils.js';
import { setupMovingEvents, updateMarginRect } from './movingEvents.js';
import { setupScalingEvents, updateMarginRect as updateScalingMarginRect } from './scalingEvents.js';
import { setupRotatingEvents, updateMarginRect as updateRotatingMarginRect } from './rotatingEvents.js';
import { 
  handleImageUpload, 
  originalImages, 
  arrangementStatus, 
  lastLayout, 
  lastDirection,
  setArrangementStatus,
  setLastLayout,
  setLastDirection
} from './imageUploadUtils.js';

const canvasElement = document.getElementById("canvas");
let canvas = new fabric.Canvas("canvas");
const imageLoader = document.getElementById("imageLoader");
const deleteButton = document.getElementById("deleteButton");
const printButton = document.getElementById("printButton");
const cartaButton = document.getElementById("cartaButton");
const oficioButton = document.getElementById("oficioButton");
const a4Button = document.getElementById("a4Button");
const verticalButton = document.getElementById("verticalButton");
const horizontalButton = document.getElementById("horizontalButton");
const rotateButton_p90 = document.getElementById("rotateButton+90");
const rotateButton_n90 = document.getElementById("rotateButton-90");
const resetImageButton = document.getElementById("resetImageButton");
const arrangeButton = document.getElementById("arrangeButton");
const cropButton = document.getElementById("cropButton");
const confirmCropButton = document.getElementById("confirmCrop");
const cancelCropButton = document.getElementById("cancelCrop");
const rotateCheckbox = document.getElementById("rotateControl");
const grayScaleButton = document.getElementById("grayScaleButton");
const scaleUpButton = document.getElementById("scaleUpButton");
const scaleDownButton = document.getElementById("scaleDownButton");
const centerVerticallyButton = document.getElementById(
  "centerVerticallyButton"
);
const centerHorizontallyButton = document.getElementById(
  "centerHorizontallyButton"
);
const setSizeButton = document.getElementById("setSizeButton");
const columnsCollageButton = document.getElementById("columnsCollageButton");
const rowsCollageButton = document.getElementById("rowsCollageButton");
const collageButton = document.getElementById("collageButton");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");

const dpi = 300;
const marginInches = 0.2;
const marginPixels = marginInches * dpi;
const paperSizes = {
  carta: { width: 8.5 * dpi, height: 11 * dpi },
  oficio: { width: 8.5 * dpi, height: 13 * dpi },
  a4: { width: 8.27 * dpi, height: 11.69 * dpi },
};

let marginRect;

let currentSize = "carta";
let isVertical = true;

let cropRect = null;
let activeImage = null;
let inactivatedObjects = [];

function disableOtherObjects() {
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

// Modify the restore function
function restoreOtherObjects() {
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

let isCropping = false;

function enterCropMode(imgObject) {
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
    stroke: "#000",
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    absolutePositioned: true,
    transparentCorners: false,
    cornerColor: "DodgerBlue",
    cornerStyle: "circle",
    cornerSize: 12,
    cornerStrokeColor: "Blue",
  });

  canvas.add(cropRect);

  // Bring both objects to front
  imgObject.bringToFront();
  cropRect.bringToFront();

  // Disable other objects
  disableOtherObjects();

  canvas.setActiveObject(cropRect);

  // Show crop control buttons
  confirmCropButton.style.display = "inline";
  cancelCropButton.style.display = "inline";
  cropButton.style.display = "none";
}

// Add this global variable at the top of your script
let canvasBackground = null;

// Modify the background creation function
function createCanvasBackground() {
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

function confirmCrop() {
  if (!isCropping || !cropRect || !activeImage) {
    Swal.fire({
      text: "Seleccione primero una imagen y active el modo de recorte.",
      icon: "warning",
    });
    return;
  }

  // Get the cropping rect and original image's ID
  const rect = cropRect;
  const img = activeImage;
  const originalId = img.id; // Save original ID

  // Set the crop rect stroke to transparent so that it doesn't bleed into the final image
  rect.set("stroke", "transparent");

  // Create a background to fill the canvas with white color
  createCanvasBackground();

  // Hide other objects
  canvas.getObjects().forEach((obj) => {
    if (
      obj !== cropRect &&
      obj !== marginRect &&
      obj !== activeImage &&
      obj !== canvasBackground
    ) {
      obj.set({
        opacity: 0,
      });
    }
  });

  // Create new cropped image
  const cropped = new Image();
  cropped.src = canvas.toDataURL({
    left: rect.left,
    top: rect.top,
    width: rect.width * rect.scaleX,
    height: rect.height * rect.scaleY,
  });

  cropped.onload = function () {
    // Remove old image and crop rect
    canvas.remove(img);
    canvas.remove(rect);

    // Create and add new cropped image
    const newImage = new fabric.Image(cropped);
    newImage.set({
      id: originalId, // Transfer the original ID
      left: rect.left,
      top: rect.top,
    });

    // Set rotation control visibility based on checkbox state
    newImage.setControlsVisibility({
      mtr: rotateCheckbox.checked,
    });

    newImage.setCoords();
    canvas.add(newImage);
    canvas.renderAll();
  };

  exitCropMode();
}

function exitCropMode() {
  if (cropRect) {
    canvas.remove(cropRect);
    cropRect = null;
  }

  isCropping = false;
  activeImage = null;

  // Restore other objects
  restoreOtherObjects();

  // Hide crop control buttons
  confirmCropButton.style.display = "none";
  cancelCropButton.style.display = "none";
  cropButton.style.display = "inline";
}

function reAddAndArrangeImages(images, currentLayout, currentDirection) {
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

function resizeCanvas(size, orientation = isVertical) {
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
  updateScalingMarginRect(marginRect);
  updateRotatingMarginRect(marginRect);

  // Re-add and re-arrange images using the new function
  reAddAndArrangeImages(images, currentLayout, currentDirection);

  canvas.renderAll();
}

function changeOrientation(vertical) {
  resizeCanvas(currentSize, vertical);
}

scaleUpButton.addEventListener("click", () => scaleUp(canvas, marginRect));
scaleDownButton.addEventListener("click", () => scaleDown(canvas, marginRect));

function selectArrangeImageLayout() {
  // 1. Get all current images
  const images = canvas.getObjects().filter((obj) => obj.type === "image");

  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
  }

  // 2. Remove existing images from canvas
  images.forEach((img) => canvas.remove(img));

  // 3. Define state transitions
  const stateTransitions = {
    "rows-forward": { layout: "rows", direction: "reverse" },
    "rows-reverse": { layout: "cols", direction: "forward" },
    "cols-forward": { layout: "cols", direction: "reverse" },
    "cols-reverse": { layout: "single-column", direction: "forward" },
    "single-column-forward": { layout: "single-column", direction: "reverse" },
    "single-column-reverse": { layout: "single-row", direction: "forward" },
    "single-row-forward": { layout: "single-row", direction: "reverse" },
    "single-row-reverse": { layout: "rows", direction: "forward" }
  };

  const currentState = `${lastLayout}-${lastDirection}`;
  const nextState = stateTransitions[currentState] || { layout: "rows", direction: "forward" };

  setArrangementStatus(arrangeImages(canvas, images, nextState.layout, marginWidth, nextState.direction));
  setLastLayout(nextState.layout);
  setLastDirection(nextState.direction);

  canvas.renderAll();
}

cartaButton.addEventListener("click", () => resizeCanvas("carta"));
oficioButton.addEventListener("click", () => resizeCanvas("oficio"));
a4Button.addEventListener("click", () => resizeCanvas("a4"));
verticalButton.addEventListener("click", () => changeOrientation(true));
horizontalButton.addEventListener("click", () => changeOrientation(false));

imageLoader.addEventListener("change", (e) => handleImageUpload(e, canvas, marginWidth, rotateCheckbox));
resetImageButton.addEventListener("click", () => resetActiveImage(canvas, marginRect, originalImages));
printButton.addEventListener("click", () => printCanvas(canvas, marginRect));
grayScaleButton.addEventListener("click", () => convertToGrayscale(canvas));
rotateButton_p90.addEventListener("click", () => rotateImage(canvas, 90, marginRect));
rotateButton_n90.addEventListener("click", () => rotateImage(canvas, 270, marginRect));
centerVerticallyButton.addEventListener("click", () => centerVertically(canvas));
centerHorizontallyButton.addEventListener("click", () => centerHorizontally(canvas));
deleteButton.addEventListener("click", () => deleteActiveObject(canvas));
confirmCropButton.addEventListener("click", confirmCrop);
cancelCropButton.addEventListener("click", exitCropMode);
arrangeButton.addEventListener("click", selectArrangeImageLayout);
setSizeButton.addEventListener("click", () => setImageSizeInCm({
  canvas,
  widthInput,
  heightInput,
  marginRect,
  paperConfig: { currentSize, isVertical, paperSizes, dpi }
}));
columnsCollageButton.addEventListener("click", () => {
  const newStatus = createMasonryColumnsCollage(canvas, marginRect, Swal);
  if (newStatus) setArrangementStatus(newStatus);
});
rowsCollageButton.addEventListener("click", () => {
  const newStatus = createMasonryRowsCollage(canvas, marginRect, Swal);
  if (newStatus) setArrangementStatus(newStatus);
});
collageButton.addEventListener("click", () => {
  const newStatus = collageArrange(canvas, marginRect, Swal);
  if (newStatus) setArrangementStatus(newStatus);
});
rotateCheckbox.addEventListener("change", function (e) {
  canvas.getObjects().forEach((obj) => {
    if (obj.type === "image") {
      obj.setControlsVisibility({
        mtr: this.checked,
      });
    }
  });
  canvas.requestRenderAll();
});

cropButton.addEventListener("click", function () {
  const activeObjects = canvas.getActiveObjects();

  console.log(activeObjects);

  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  if (activeObjects.length !== 1) {
    Swal.fire({
      text: "Seleccione solo una imagen para recortar.",
      icon: "warning",
    });
    return;
  }

  const activeObject = activeObjects[0];
  if (activeObject.type !== "image") {
    Swal.fire({
      text: "La selección debe ser una imagen válida.",
      icon: "warning",
    });
    return;
  }

  enterCropMode(activeObject);
});

// Add keyboard delete support
document.addEventListener("keydown", function (event) {
  if (event.key === "Delete") {
    deleteActiveObject(canvas);
  }
});

document.body.addEventListener("click", (event) => deactivateObjects(event, canvas));

fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerColor = "limegreen";
fabric.Object.prototype.cornerStrokeColor = "black";
fabric.Object.prototype.cornerStyle = "rect";
fabric.Object.prototype.cornerSize = 12;
const controls = fabric.Object.prototype.controls;
const rotateControls = controls.mtr;
rotateControls.visible = false;

resizeCanvas("carta");

// Calcular el ancho del margen
let marginWidth = (canvas.width - marginRect.width) / 2;

setupMovingEvents(canvas, marginRect);
setupScalingEvents(canvas, marginRect);
setupRotatingEvents(canvas, marginRect, setArrangementStatus);

// Add accessibility improvements: set ARIA labels and focus outlines on interactive elements.
function setupAccessibility() {
  // List all interactive elements by id.
  const elements = [
    printButton,
    deleteButton,
    cropButton,
    confirmCropButton,
    cancelCropButton,
    cartaButton,
    oficioButton,
    a4Button,
    verticalButton,
    horizontalButton,
    rotateButton_p90,
    rotateButton_n90,
    resetImageButton,
    arrangeButton,
    grayScaleButton,
    scaleUpButton,
    scaleDownButton,
    centerVerticallyButton,
    centerHorizontallyButton,
    setSizeButton,
    columnsCollageButton,
    rowsCollageButton,
    collageButton
  ];
  elements.forEach((el) => {
    if (el) {
      // Use innerText or id as descriptive label.
      el.setAttribute(
        "aria-label",
        el.innerText.trim() || el.getAttribute("id")
      );
      // Ensure buttons are focusable with a clear outline
      el.style.outline = "3px solid transparent";
      el.addEventListener("focus", () => {
        el.style.outline = "3px solid #ff0";
      });
      el.addEventListener("blur", () => {
        el.style.outline = "3px solid transparent";
      });
    }
  });
}
setupAccessibility();

window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.applyZoom = applyZoom;
