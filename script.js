import { zoomIn, zoomOut, applyZoom } from './zoom.js';
import { centerVertically, centerHorizontally } from './center.js';
import { createMasonryColumnsCollage, createMasonryRowsCollage, collageArrange } from './collageUtils.js';
import { 
  setImageSizeInCm
} from './imageSize.js';
import { printCanvas } from './printUtils.js';
import { deactivateObjects } from './deactivateObjects.js';
import { rotateImage } from './rotateUtils.js';
import { resetActiveImage } from './resetUtils.js';
import { deleteActiveObject } from './deleteUtils.js';
import { scaleUp, scaleDown } from './scaleUtils.js';
import { convertToGrayscale } from './imageEffects.js';
import { setupMovingEvents } from './movingEvents.js';
import { setupScalingEvents } from './scalingEvents.js';
import { setupRotatingEvents } from './rotatingEvents.js';
import { 
  handleImageUpload, 
  originalImages,
  setArrangementStatus
} from './imageUploadUtils.js';
import { 
  initializeCrop, 
  confirmCrop, 
  exitCropMode
} from './cropUtils.js';
import { 
  resizeCanvas, 
  changeOrientation, 
  paperSizes, 
  dpi, 
  getCurrentSize, 
  getIsVertical 
} from './canvasResizeUtils.js';
import { selectArrangeImageLayout } from './layoutSelector.js';

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

const marginInches = 0.2;
const marginPixels = marginInches * dpi;

let marginRect;
let marginWidth;

scaleUpButton.addEventListener("click", () => scaleUp(canvas, marginRect));
scaleDownButton.addEventListener("click", () => scaleDown(canvas, marginRect));

cartaButton.addEventListener("click", () => {
  const result = resizeCanvas("carta", canvas, marginRect);
  marginRect = result.marginRect;
  marginWidth = result.marginWidth;
});
oficioButton.addEventListener("click", () => {
  const result = resizeCanvas("oficio", canvas, marginRect);
  marginRect = result.marginRect;
  marginWidth = result.marginWidth;
});
a4Button.addEventListener("click", () => {
  const result = resizeCanvas("a4", canvas, marginRect);
  marginRect = result.marginRect;
  marginWidth = result.marginWidth;
});
verticalButton.addEventListener("click", () => {
  const result = changeOrientation(true, canvas, marginRect);
  marginRect = result.marginRect;
  marginWidth = result.marginWidth;
});
horizontalButton.addEventListener("click", () => {
  const result = changeOrientation(false, canvas, marginRect);
  marginRect = result.marginRect;
  marginWidth = result.marginWidth;
});

imageLoader.addEventListener("change", (e) => handleImageUpload(e, canvas, marginWidth, rotateCheckbox));
resetImageButton.addEventListener("click", () => resetActiveImage(canvas, marginRect, originalImages));
printButton.addEventListener("click", () => printCanvas(canvas, marginRect));
grayScaleButton.addEventListener("click", () => convertToGrayscale(canvas));
rotateButton_p90.addEventListener("click", () => rotateImage(canvas, 90, marginRect));
rotateButton_n90.addEventListener("click", () => rotateImage(canvas, 270, marginRect));
centerVerticallyButton.addEventListener("click", () => centerVertically(canvas));
centerHorizontallyButton.addEventListener("click", () => centerHorizontally(canvas));
deleteButton.addEventListener("click", () => deleteActiveObject(canvas));
confirmCropButton.addEventListener("click", () => confirmCrop(canvas, marginRect, rotateCheckbox, Swal, confirmCropButton, cancelCropButton, cropButton));
cancelCropButton.addEventListener("click", () => exitCropMode(canvas, confirmCropButton, cancelCropButton, cropButton));
arrangeButton.addEventListener("click", () => selectArrangeImageLayout(canvas, marginWidth, Swal));
setSizeButton.addEventListener("click", () => setImageSizeInCm({
  canvas,
  widthInput,
  heightInput,
  marginRect,
  paperConfig: { currentSize: getCurrentSize(), isVertical: getIsVertical(), paperSizes, dpi }
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
  initializeCrop(canvas, Swal, confirmCropButton, cancelCropButton, cropButton, marginRect, rotateCheckbox);
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

// Inicializar canvas con tamaño carta
const initialResult = resizeCanvas("carta", canvas, marginRect);
marginRect = initialResult.marginRect;
marginWidth = initialResult.marginWidth;

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
