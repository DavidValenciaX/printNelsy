import { zoomIn, zoomOut, applyZoom } from './zoom.js';
import { centerVertically, centerHorizontally } from './center.js';
import { 
  radToDeg, 
  roundToDecimals, 
  calculateDistance
} from './mathUtils.js';
import { createMasonryColumnsCollage, createMasonryRowsCollage, collageArrange } from './collageUtils.js';
import { 
  setImageSizeInCm
} from './imageSize.js';
import { constrainObjectToMargin } from './constraintUtils.js';
import { printCanvas } from './printUtils.js';

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

function deactivateObjects(event) {
  // Si event.target es nulo, deseleccionar directamente
  if (!event.target) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    return;
  }

  const canvasElement = canvas.getElement();
  const isOnCanvasElement = event.target === canvasElement;
  const isOnFabricControls =
    event.target.classList.contains("canvas-container") ||
    event.target.classList.contains("upper-canvas") ||
    event.target.classList.contains("lower-canvas");
  const isOnButton =
    event.target.tagName === "BUTTON" ||
    event.target.closest("button") !== null;

  const isOnCheckbox =
    event.target.tagName === "INPUT" && event.target.type === "checkbox";

  const isOnInputNumber =
    event.target.tagName === "INPUT" && event.target.type === "number";

  const isOnCheckBoxLabel =
    event.target.tagName === "LABEL" &&
    event.target.htmlFor === "rotateControl";

  if (
    !isOnCanvasElement &&
    !isOnFabricControls &&
    !isOnButton &&
    !isOnCheckbox &&
    !isOnCheckBoxLabel &&
    !isOnInputNumber
  ) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
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

  // Re-add and re-arrange images based on the current arrangement status
  if (images.length > 0) {
    if (arrangementStatus === "grid") {
      // Arrange images in grid layout
      arrangeImages(images, currentLayout, currentDirection);
    } else if (arrangementStatus === "columns-collage") {
      // Re-add images and create collage
      images.forEach((img) => canvas.add(img));
      const newStatus = createMasonryColumnsCollage(canvas, marginRect, Swal);
      if (newStatus) arrangementStatus = newStatus;
    } else if (arrangementStatus === "rows-collage") {
      // Re-add images and create collage
      images.forEach((img) => canvas.add(img));
      const newStatus = createMasonryRowsCollage(canvas, marginRect, Swal);
      if (newStatus) arrangementStatus = newStatus;
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

  canvas.renderAll();
}

function changeOrientation(vertical) {
  resizeCanvas(currentSize, vertical);
}

// Add this at the top with other variables
const originalImages = {};
// New global flag to track canvas arrangement state: 'none', 'grid', or 'collage'
let arrangementStatus = "none";

function handleImageUpload(e) {
  const files = e.target.files;

  // Es una buena práctica verificar si se seleccionaron archivos.
  if (!files || files.length === 0) {
    // Resetea el valor del input incluso si no se seleccionaron archivos (ej. el usuario canceló el diálogo).
    // Esto asegura que una futura selección del mismo archivo (después de una cancelación) funcione.
    if (e.target) {
      e.target.value = null;
    }
    return;
  }

  const loadedImages = [];
  let processedCount = 0;
  const numFilesToProcess = files.length; // Guardar la cantidad original de archivos a procesar.

  for (const element of files) {
    const file = element;
    const reader = new FileReader();
    reader.onload = function (event) {
      fabric.Image.fromURL(event.target.result, function (img) {
        // Asignar un id único permanente si no lo tiene
        if (!img.id) {
          const uniqueId = `image-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 11)}`;
          img.id = uniqueId;
        }
        // Guardar la URL de origen
        img.originalUrl = event.target.result;

        img.setControlsVisibility({
          mtr: rotateCheckbox.checked,
        });

        loadedImages.push(img);
        processedCount++;

        if (processedCount === numFilesToProcess) {
          // Primero, se organiza el layout de las imágenes
          if (numFilesToProcess <= 2) {
            arrangeImages(loadedImages, "cols", "forward");
            lastLayout = "cols";
            lastDirection = "forward";
          } else {
            arrangeImages(loadedImages, "rows", "forward");
            lastLayout = "rows";
            lastDirection = "forward";
          }

          // Luego, se guardan los datos originales ya con sus valores de top, left, scaleX y scaleY actualizados
          loadedImages.forEach((loadedImgInstance) => { // Renombrado img a loadedImgInstance para evitar confusión de scope
            originalImages[loadedImgInstance.id] = {
              url: loadedImgInstance.originalUrl,
              width: loadedImgInstance.width,
              height: loadedImgInstance.height,
              scaleX: loadedImgInstance.scaleX,
              scaleY: loadedImgInstance.scaleY,
              angle: loadedImgInstance.angle,
              left: loadedImgInstance.left,
              top: loadedImgInstance.top,
            };
          });

          // Seleccionar automáticamente si solo hay una imagen
          if (numFilesToProcess === 1 && loadedImages.length === 1) { // Asegurarse que loadedImages[0] existe
            canvas.discardActiveObject();
            canvas.setActiveObject(loadedImages[0]);
            canvas.renderAll(); // Asegurar renderizado después de seleccionar
          }
        }
      });
    };
    reader.readAsDataURL(file);
  }

  // **LA CORRECCIÓN PRINCIPAL ESTÁ AQUÍ**
  // Resetea el valor del input de archivo.
  // Esto permite que el evento 'change' se dispare de nuevo si el usuario selecciona el mismo archivo.
  if (e.target) {
    e.target.value = null;
  }
}

function arrangeImages(images, orientation, order = "forward") {
  const count = images.length;
  let marginAdjustment = count <= 2 ? 100 : 20;
  const margin = marginWidth + marginAdjustment;

  // Create copy and sort according to order
  const sortedImages = [...images];
  if (order === "reverse") {
    sortedImages.reverse();
  }

  let cols, rows;
  // Add single-column and single-row layout options
  if (orientation === "single-column") {
    cols = 1;
    rows = count;
  } else if (orientation === "single-row") {
    cols = count;
    rows = 1;
  } else if (orientation === "rows") {
    cols = Math.ceil(Math.sqrt(count));
    rows = Math.ceil(count / cols);
  } else if (orientation === "cols") {
    rows = Math.ceil(Math.sqrt(count));
    cols = Math.ceil(count / rows);
  }

  // Adjust cell dimensions based on orientation
  const cellWidth =
    orientation === "single-row"
      ? (canvas.width - margin * 2) / count
      : (canvas.width - margin * 2) / cols;

  const cellHeight =
    orientation === "single-column"
      ? (canvas.height - margin * 2) / count
      : (canvas.height - margin * 2) / rows;

  sortedImages.forEach((img, index) => {
    // Determine row and column without altering permanent id
    let row, col;
    if (orientation === "rows") {
      row = Math.floor(index / cols);
      col = index % cols;
    } else if (orientation === "cols") {
      col = Math.floor(index / rows);
      row = index % rows;
    } else if (orientation === "single-column") {
      col = 0;
      row = index;
    } else if (orientation === "single-row") {
      col = index;
      row = 0;
    }

    let realImageWidth = img.width * img.scaleX;
    let realImageHeight = img.height * img.scaleY;
    let bounds = img.getBoundingRect();

    let roundedBoundsWidth = roundToDecimals(bounds.width, 2);
    let roundedImageWidth = roundToDecimals(realImageWidth, 2);
    const offsetWidthImageBound = roundToDecimals(
      roundedBoundsWidth - roundedImageWidth,
      2
    );

    let roundedBoundsHeight = roundToDecimals(bounds.height, 2);
    let roundedImageHeight = roundToDecimals(realImageHeight, 2);
    const offsetHeightImageBound = roundToDecimals(
      roundedBoundsHeight - roundedImageHeight,
      2
    );

    const scaleFactor = Math.min(
      (cellWidth - margin - offsetWidthImageBound) / img.width,
      (cellHeight - margin - offsetHeightImageBound) / img.height
    );

    img.scale(scaleFactor);
    img.set({
      left: margin + col * cellWidth + cellWidth / 2,
      top: margin + row * cellHeight + cellHeight / 2,
      originX: "center",
      originY: "center",
    });

    // originalImages is kept intact with the original information
    canvas.add(img);
  });

  canvas.renderAll();
  // Set flag to indicate grid arrangement
  arrangementStatus = "grid";
}

// Reset active image to its original state
function resetActiveImage() {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  // Iterate over each selected image
  activeObjects.forEach((activeObject) => {
    if (!originalImages[activeObject?.id]) {
      Swal.fire({
        text: `No se pudo restablecer la imagen con id ${
          activeObject.id || "n/a"
        }.`,
        icon: "warning",
      });
      return;
    }

    const original = originalImages[activeObject.id];

    fabric.Image.fromURL(original.url, function (img) {
      // Apply original properties to the new image
      img.set({
        id: activeObject.id,
        scaleX: original.scaleX,
        scaleY: original.scaleY,
        angle: 0,
        left: original.left,
        top: original.top,
        originX: "center",
        originY: "center",
      });

      // Si la imagen queda fuera del canvas, se reubica dentro de los márgenes.
      img = constrainObjectToMargin(img, marginRect);

      // Replace old image with the new one
      canvas.remove(activeObject);
      canvas.add(img);
      canvas.renderAll();
    });
  });
  // Clear active selection once reset is complete
  canvas.discardActiveObject();
}

function scaleToFitWithinMargin(obj, marginRect) {
  obj.setCoords();
  const br = obj.getBoundingRect();
  // Si el objeto ya cabe completamente en el margen, no se hace nada.
  if (br.width <= marginRect.width && br.height <= marginRect.height) {
    return;
  }
  // Calcula el factor de escala mínimo necesario para que br quepa en marginRect.
  const scaleFactor = Math.min(
    marginRect.width / br.width,
    marginRect.height / br.height
  );
  // Aplica el factor a la escala actual.
  obj.scaleX *= scaleFactor;
  obj.scaleY *= scaleFactor;
  // Reposiciona para que quede dentro del margen.
  constrainObjectToMargin(obj, marginRect);
  obj.setCoords();
}

function rotateImage(deg) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  activeObject.rotate((activeObject.angle + deg) % 360);
  activeObject.setCoords();

  // Primero se reubica dentro del margen.
  constrainObjectToMargin(activeObject, marginRect);
  // Si el objeto sigue excediendo, se reduce su escala.
  scaleToFitWithinMargin(activeObject, marginRect);

  canvas.renderAll();
}

function deleteActiveObject() {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  Swal.fire({
    title: "Confirmación",
    text: "¿Está seguro de eliminar las imágenes?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  });
}

function convertToGrayscale() {
  const activeObjects = canvas
    .getActiveObjects()
    .filter((obj) => obj.type === "image");
  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }
  activeObjects.forEach((obj) => {
    // Ensure filters property is initialized
    obj.filters = obj.filters || [];
    obj.filters.push(new fabric.Image.filters.Grayscale());
    obj.applyFilters();
  });
  canvas.renderAll();
}

const SCALE_FACTOR = 0.01;

function scaleUp() {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  // Calcular el centro actual de la selección
  const center = activeObject.getCenterPoint();

  // Compute the intended multiplier (uniformly applied to both scaleX and scaleY)
  const intendedMultiplier =
    (activeObject.scaleX + SCALE_FACTOR) / activeObject.scaleX;

  // Obtener el bounding rect actual
  const currentBR = activeObject.getBoundingRect();

  // Margen: límites de la zona en la que se permiten los objetos
  const leftBound = marginRect.left;
  const rightBound = marginRect.left + marginRect.width;
  const topBound = marginRect.top;
  const bottomBound = marginRect.top + marginRect.height;

  // Determinar el multiplicador máximo basado en cada lado, usando el centro calculado
  const maxMultiplierLeft = ((center.x - leftBound) * 2) / currentBR.width;
  const maxMultiplierRight = ((rightBound - center.x) * 2) / currentBR.width;
  const maxMultiplierTop = ((center.y - topBound) * 2) / currentBR.height;
  const maxMultiplierBottom = ((bottomBound - center.y) * 2) / currentBR.height;

  // El multiplicador permitido es el menor de los anteriores
  const allowedMultiplier = Math.min(
    maxMultiplierLeft,
    maxMultiplierRight,
    maxMultiplierTop,
    maxMultiplierBottom
  );

  // Seleccionar el multiplicador final
  const finalMultiplier = Math.min(intendedMultiplier, allowedMultiplier);

  // Si no se puede escalar más, salir
  if (finalMultiplier <= 1) return;

  // Aplicar la escala y reubicar usando el centro original
  activeObject.scaleX *= finalMultiplier;
  activeObject.scaleY *= finalMultiplier;
  activeObject.set({
    left: center.x,
    top: center.y,
    originX: "center",
    originY: "center",
  });

  constrainObjectToMargin(activeObject, marginRect);
  canvas.renderAll();
}

function scaleDown() {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  // Obtiene el centro actual de la selección (ya sea individual o múltiple)
  const center = activeObject.getCenterPoint();

  const currentScaleX = activeObject.scaleX;
  const currentScaleY = activeObject.scaleY;
  // Prevenir escala menor a 0.1 para evitar que el objeto desaparezca
  if (currentScaleX > 0.1 && currentScaleY > 0.1) {
    activeObject.scaleX = currentScaleX - SCALE_FACTOR;
    activeObject.scaleY = currentScaleY - SCALE_FACTOR;

    // Reposicionar el objeto usando su centro actual como referencia
    activeObject.set({
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
    });

    constrainObjectToMargin(activeObject, marginRect);
    canvas.renderAll();
  }
}

let lastLayout = "rows"; // Track layout type (rows/cols)
let lastDirection = "forward"; // Track direction (forward/reverse)

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

  arrangeImages(images, nextState.layout, nextState.direction);
  lastLayout = nextState.layout;
  lastDirection = nextState.direction;

  canvas.renderAll();
}

cartaButton.addEventListener("click", () => resizeCanvas("carta"));
oficioButton.addEventListener("click", () => resizeCanvas("oficio"));
a4Button.addEventListener("click", () => resizeCanvas("a4"));
verticalButton.addEventListener("click", () => changeOrientation(true));
horizontalButton.addEventListener("click", () => changeOrientation(false));

imageLoader.addEventListener("change", handleImageUpload);
resetImageButton.addEventListener("click", resetActiveImage);
printButton.addEventListener("click", () => printCanvas(canvas, marginRect));
grayScaleButton.addEventListener("click", convertToGrayscale);
rotateButton_p90.addEventListener("click", () => rotateImage(90));
rotateButton_n90.addEventListener("click", () => rotateImage(270));
centerVerticallyButton.addEventListener("click", () => centerVertically(canvas));
centerHorizontallyButton.addEventListener("click", () => centerHorizontally(canvas));
deleteButton.addEventListener("click", deleteActiveObject);
confirmCropButton.addEventListener("click", confirmCrop);
cancelCropButton.addEventListener("click", exitCropMode);
scaleUpButton.addEventListener("click", scaleUp);
scaleDownButton.addEventListener("click", scaleDown);
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
  if (newStatus) arrangementStatus = newStatus;
});
rowsCollageButton.addEventListener("click", () => {
  const newStatus = createMasonryRowsCollage(canvas, marginRect, Swal);
  if (newStatus) arrangementStatus = newStatus;
});
collageButton.addEventListener("click", () => {
  const newStatus = collageArrange(canvas, marginRect, Swal);
  if (newStatus) arrangementStatus = newStatus;
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
    deleteActiveObject();
  }
});

document.body.addEventListener("click", (event) => deactivateObjects(event));

fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerColor = "limegreen";
fabric.Object.prototype.cornerStrokeColor = "black";
fabric.Object.prototype.cornerStyle = "rect";
fabric.Object.prototype.cornerSize = 12;
const controls = fabric.Object.prototype.controls;
const rotateControls = controls.mtr;
rotateControls.visible = false;

canvas.on("object:moving", function (e) {
  constrainObjectToMargin(e.target, marginRect);
});

let isMouseDown = false;

canvas.on("mouse:down", function () {
  isMouseDown = true;
});

canvas.on("mouse:up", function () {
  isMouseDown = false;
});

// From here, the code for rotating restrictions is added

let clockwise = false;

let accumulatedRestrictedAngle = 0;

let angleDiff = 0;

let activeRestriction = null;

canvas.on("object:rotating", function (event) {
  const obj = event.target;
  obj.setCoords();

  // Initialize accumulated angle if not exists
  if (typeof obj.previousAngle === "undefined") {
    obj.previousAngle = 0;
  }

  // Get current angle and calculate direction
  const currentAngle = obj.angle;

  // Detect direction and full rotations
  angleDiff = currentAngle - obj.previousAngle;

  // Handle angle wrap-around
  if (angleDiff > 270) {
    angleDiff -= 360; // Counter-clockwise wrap from 0 to 359
  } else if (angleDiff < -270) {
    angleDiff += 360; // Clockwise wrap from 359 to 0
  }

  clockwise = angleDiff > 0;

  // Store current angle for next comparison
  obj.previousAngle = currentAngle;

  let TOP = obj.top;
  let LEFT = obj.left;

  let TL = obj.aCoords.tl;
  let TR = obj.aCoords.tr;
  let BL = obj.aCoords.bl;
  let BR = obj.aCoords.br;

  let realObjectWidth = obj.width * obj.scaleX;
  let realObjectHeight = obj.height * obj.scaleY;

  let diagAngle = Math.atan(realObjectHeight / realObjectWidth);

  let complementDiagAngle = Math.PI / 2 - diagAngle;

  // Calculate margins from canvas edges
  const leftMargin = marginRect.left;
  const rightMargin = marginRect.left + marginRect.width;
  const topMargin = marginRect.top;
  const bottomMargin = marginRect.top + marginRect.height;

  // This function restricts the rotation of the object if it is exceeding the margins while it is rotating
  function checkRotating(point) {
    if (!isMouseDown) {
      activeRestriction = null;
    }

    if (!activeRestriction) {
      accumulatedRestrictedAngle = 0;
      if (isMouseDown && TR.x > rightMargin && clockwise) {
        activeRestriction = "TR_RIGHT_CW";
      } else if (isMouseDown && BR.x > rightMargin && !clockwise) {
        activeRestriction = "BR_RIGHT_CCW";
      } else if (isMouseDown && TL.x > rightMargin && clockwise) {
        activeRestriction = "TL_RIGHT_CW";
      } else if (isMouseDown && TR.x > rightMargin && !clockwise) {
        activeRestriction = "TR_RIGHT_CCW";
      } else if (isMouseDown && BL.x > rightMargin && clockwise) {
        activeRestriction = "BL_RIGHT_CW";
      } else if (isMouseDown && TL.x > rightMargin && !clockwise) {
        activeRestriction = "TL_RIGHT_CCW";
      } else if (isMouseDown && BR.x > rightMargin && clockwise) {
        activeRestriction = "BR_RIGHT_CW";
      } else if (isMouseDown && BL.x > rightMargin && !clockwise) {
        activeRestriction = "BL_RIGHT_CCW";
      } else if (isMouseDown && BR.y > bottomMargin && clockwise) {
        activeRestriction = "BR_BOTTOM_CW";
      } else if (isMouseDown && BL.y > bottomMargin && !clockwise) {
        activeRestriction = "BL_BOTTOM_CCW";
      } else if (isMouseDown && TR.y > bottomMargin && clockwise) {
        activeRestriction = "TR_BOTTOM_CW";
      } else if (isMouseDown && BR.y > bottomMargin && !clockwise) {
        activeRestriction = "BR_BOTTOM_CCW";
      } else if (isMouseDown && TL.y > bottomMargin && clockwise) {
        activeRestriction = "TL_BOTTOM_CW";
      } else if (isMouseDown && TR.y > bottomMargin && !clockwise) {
        activeRestriction = "TR_BOTTOM_CCW";
      } else if (isMouseDown && BL.y > bottomMargin && clockwise) {
        activeRestriction = "BL_BOTTOM_CW";
      } else if (isMouseDown && TL.y > bottomMargin && !clockwise) {
        activeRestriction = "TL_BOTTOM_CCW";
      } else if (isMouseDown && TL.x < leftMargin && !clockwise) {
        activeRestriction = "TL_LEFT_CCW";
      } else if (isMouseDown && BL.x < leftMargin && clockwise) {
        activeRestriction = "BL_LEFT_CW";
      } else if (isMouseDown && BL.x < leftMargin && !clockwise) {
        activeRestriction = "BL_LEFT_CCW";
      } else if (isMouseDown && BR.x < leftMargin && clockwise) {
        activeRestriction = "BR_LEFT_CW";
      } else if (isMouseDown && BR.x < leftMargin && !clockwise) {
        activeRestriction = "BR_LEFT_CCW";
      } else if (isMouseDown && TR.x < leftMargin && clockwise) {
        activeRestriction = "TR_LEFT_CW";
      } else if (isMouseDown && TR.x < leftMargin && !clockwise) {
        activeRestriction = "TR_LEFT_CCW";
      } else if (isMouseDown && TL.x < leftMargin && clockwise) {
        activeRestriction = "TL_LEFT_CW";
      } else if (isMouseDown && TL.y < topMargin && clockwise) {
        activeRestriction = "TL_TOP_CW";
      } else if (isMouseDown && TR.y < topMargin && !clockwise) {
        activeRestriction = "TR_TOP_CCW";
      } else if (isMouseDown && BL.y < topMargin && clockwise) {
        activeRestriction = "BL_TOP_CW";
      } else if (isMouseDown && TL.y < topMargin && !clockwise) {
        activeRestriction = "TL_TOP_CCW";
      } else if (isMouseDown && BR.y < topMargin && clockwise) {
        activeRestriction = "BR_TOP_CW";
      } else if (isMouseDown && BL.y < topMargin && !clockwise) {
        activeRestriction = "BL_TOP_CCW";
      } else if (isMouseDown && TR.y < topMargin && clockwise) {
        activeRestriction = "TR_TOP_CW";
      } else if (isMouseDown && BR.y < topMargin && !clockwise) {
        activeRestriction = "BR_TOP_CCW";
      }
    }

    switch (activeRestriction) {
      case "TR_RIGHT_CW": {
        console.log("TR right margin rotating clockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.x > rightMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;

          activeRestriction = "BR_RIGHT_CCW";
        }

        break;
      }

      case "BR_RIGHT_CCW": {
        console.log("BR right margin rotating counterclockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = 2 * Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.x > rightMargin && clockwise) {
          accumulatedRestrictedAngle = 0;

          activeRestriction = "TR_RIGHT_CW";
        }

        break;
      }

      case "TL_RIGHT_CW": {
        console.log("TL right margin rotating clockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.x > rightMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;

          activeRestriction = "TR_RIGHT_CCW";
        }
        break;
      }

      case "TR_RIGHT_CCW": {
        console.log("TR right margin rotating counterclockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.x > rightMargin && clockwise) {
          accumulatedRestrictedAngle = 0;

          activeRestriction = "TL_RIGHT_CW";
        }

        break;
      }

      case "BL_RIGHT_CW": {
        console.log("BL right margin rotating clockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.x > rightMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TL_RIGHT_CCW";
        }
        break;
      }

      case "TL_RIGHT_CCW": {
        console.log("TL right margin rotating counterclockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.x > rightMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_RIGHT_CW";
        }
        break;
      }

      case "BR_RIGHT_CW": {
        console.log("BR right margin rotating clockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.x > rightMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_RIGHT_CCW";
        }
        break;
      }

      case "BL_RIGHT_CCW": {
        console.log("BL right margin rotating counterclockwise");
        let co = rightMargin - obj.left;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.x > rightMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BR_RIGHT_CW";
        }
        break;
      }

      case "BR_BOTTOM_CW": {
        console.log("BR bottom margin rotating clockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.y > bottomMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_BOTTOM_CCW";
        }
        break;
      }

      case "BL_BOTTOM_CCW": {
        console.log("BL bottom margin rotating counterclockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = 2 * Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.y > bottomMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BR_BOTTOM_CW";
        }
        break;
      }

      case "TR_BOTTOM_CW": {
        console.log("TR bottom margin rotating clockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.y > bottomMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BR_BOTTOM_CCW";
        }
        break;
      }

      case "BR_BOTTOM_CCW": {
        console.log("BR bottom margin rotating counterclockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.y > bottomMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TR_BOTTOM_CW";
        }
        break;
      }

      case "TL_BOTTOM_CW": {
        console.log("TL bottom margin rotating clockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.y > bottomMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TR_BOTTOM_CCW";
        }
        break;
      }

      case "TR_BOTTOM_CCW": {
        console.log("TR bottom margin rotating counterclockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.y > bottomMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TL_BOTTOM_CW";
        }
        break;
      }

      case "BL_BOTTOM_CW": {
        console.log("BL bottom margin rotating clockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.y > bottomMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TL_BOTTOM_CCW";
        }
        break;
      }

      case "TL_BOTTOM_CCW": {
        console.log("TL bottom margin rotating counterclockwise");
        let co = bottomMargin - obj.top;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.y > bottomMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_BOTTOM_CW";
        }
        break;
      }

      case "TL_LEFT_CCW": {
        console.log("TL left margin rotating counterclockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = 2 * Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.x < leftMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_LEFT_CW";
        }
        break;
      }

      case "BL_LEFT_CW": {
        console.log("BL left margin rotating clockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.x < leftMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TL_LEFT_CCW";
        }
        break;
      }

      case "BL_LEFT_CCW": {
        console.log("BL left margin rotating counterclockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.x < leftMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BR_LEFT_CW";
        }
        break;
      }

      case "BR_LEFT_CW": {
        console.log("BR left margin rotating clockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.x < leftMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_LEFT_CCW";
        }
        break;
      }

      case "BR_LEFT_CCW": {
        console.log("BR left margin rotating counterclockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.x < leftMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TR_LEFT_CW";
        }
        break;
      }

      case "TR_LEFT_CW": {
        console.log("TR left margin rotating clockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.x < leftMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BR_LEFT_CCW";
        }
        break;
      }

      case "TR_LEFT_CCW": {
        console.log("TR left margin rotating counterclockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.x < leftMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TL_LEFT_CW";
        }
        break;
      }

      case "TL_LEFT_CW": {
        console.log("TL left margin rotating clockwise");
        let co = obj.left - leftMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.x < leftMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TR_LEFT_CCW";
        }
        break;
      }

      case "TL_TOP_CW": {
        console.log("TL top margin rotating clockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.y < topMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TR_TOP_CCW";
        }
        break;
      }

      case "TR_TOP_CCW": {
        console.log("TR top margin rotating counterclockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = 2 * Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.y < topMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TL_TOP_CW";
        }
        break;
      }

      case "BL_TOP_CW": {
        console.log("BL top margin rotating clockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TL.y < topMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TL_TOP_CCW";
        }
        break;
      }

      case "TL_TOP_CCW": {
        console.log("TL top margin rotating counterclockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TL.x, TL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = Math.PI / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.y < topMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_TOP_CW";
        }
        break;
      }

      case "BR_TOP_CW": {
        console.log("BR top margin rotating clockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BL.y < topMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BL_TOP_CCW";
        }
        break;
      }

      case "BL_TOP_CCW": {
        console.log("BL top margin rotating counterclockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BL.x, BL.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - diagAngle;
        let restrictedAngle = Math.PI - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.y < topMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BR_TOP_CW";
        }
        break;
      }

      case "TR_TOP_CW": {
        console.log("TR top margin rotating clockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, TR.x, TR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 + innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle >= 360) {
          accumulatedRestrictedAngle -= 360;
        }

        if (accumulatedRestrictedAngle > 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (BR.y < topMargin && !clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "BR_TOP_CCW";
        }
        break;
      }

      case "BR_TOP_CCW": {
        console.log("BR top margin rotating counterclockwise");
        let co = obj.top - topMargin;
        let hypotenuse = calculateDistance(LEFT, TOP, BR.x, BR.y);
        let marginAngle = Math.asin(co / hypotenuse);
        let innerAngle = marginAngle - complementDiagAngle;
        let restrictedAngle = (3 * Math.PI) / 2 - innerAngle;

        accumulatedRestrictedAngle += angleDiff;

        // Update full rotations
        while (accumulatedRestrictedAngle <= -360) {
          accumulatedRestrictedAngle += 360;
        }

        if (accumulatedRestrictedAngle < 0) {
          obj.angle = radToDeg(restrictedAngle);
        } else if (TR.y < topMargin && clockwise) {
          accumulatedRestrictedAngle = 0;
          activeRestriction = "TR_TOP_CW";
        }
        break;
      }

      default:
        // Handle default case
        break;
    }
  }

  checkRotating();

  obj.setCoords();
  canvas.renderAll();
});

canvas.on("object:modified", function (e) {
  // Reset restrictions
  activeRestriction = null;
  arrangementStatus = "none";
});

canvas.on("object:scaling", function (e) {
  let obj = e.target;
  obj.setCoords();

  const marginRight = marginRect.left + marginRect.width;
  const marginBottom = marginRect.top + marginRect.height;

  // Function to check if the object's bounding rect is within margins.
  function isValidState() {
    let br = obj.getBoundingRect(true);
    return (
      br.left >= marginRect.left &&
      br.top >= marginRect.top &&
      br.left + br.width <= marginRight &&
      br.top + br.height <= marginBottom
    );
  }

  // Save the proposed (current) state.
  const proposedScaleX = obj.scaleX;
  const proposedScaleY = obj.scaleY;
  const proposedLeft = obj.left;
  const proposedTop = obj.top;

  // If no last valid state exists, initialize it with the current state.
  if (typeof obj._lastScaleX === "undefined") {
    obj._lastScaleX = proposedScaleX;
    obj._lastScaleY = proposedScaleY;
    obj._lastLeft = proposedLeft;
    obj._lastTop = proposedTop;
  }

  const lastValidScaleX = obj._lastScaleX;
  const lastValidScaleY = obj._lastScaleY;
  const lastValidLeft = obj._lastLeft;
  const lastValidTop = obj._lastTop;

  // If the current state is valid, simply update the last valid state.
  if (isValidState()) {
    obj._lastScaleX = proposedScaleX;
    obj._lastScaleY = proposedScaleY;
    obj._lastLeft = proposedLeft;
    obj._lastTop = proposedTop;
  } else {
    // The state is invalid. Use binary search to find the largest valid interpolation factor (t)
    // between the last valid state (t = 0) and the current state (t = 1).
    let low = 0,
      high = 1;
    const tolerance = 0.005;
    let finalScaleX = lastValidScaleX,
      finalScaleY = lastValidScaleY,
      finalLeft = lastValidLeft,
      finalTop = lastValidTop;

    while (high - low > tolerance) {
      let mid = (low + high) / 2;
      // Interpolate state between last valid and proposed.
      let testScaleX =
        lastValidScaleX + mid * (proposedScaleX - lastValidScaleX);
      let testScaleY =
        lastValidScaleY + mid * (proposedScaleY - lastValidScaleY);
      let testLeft = lastValidLeft + mid * (proposedLeft - lastValidLeft);
      let testTop = lastValidTop + mid * (proposedTop - lastValidTop);

      // Apply the test state temporarily.
      obj.scaleX = testScaleX;
      obj.scaleY = testScaleY;
      obj.left = testLeft;
      obj.top = testTop;
      obj.setCoords();

      if (isValidState()) {
        // The candidate state is valid, so move the lower bound closer to the proposed state.
        low = mid;
        finalScaleX = testScaleX;
        finalScaleY = testScaleY;
        finalLeft = testLeft;
        finalTop = testTop;
      } else {
        // The candidate state is invalid; reduce the upper bound.
        high = mid;
      }
    }

    // Set the object to the best valid state determined.
    obj.scaleX = finalScaleX;
    obj.scaleY = finalScaleY;
    obj.left = finalLeft;
    obj.top = finalTop;
    obj.setCoords();
  }

  canvas.renderAll();
});

resizeCanvas("carta");

// Calcular el ancho del margen

let marginWidth = (canvas.width - marginRect.width) / 2;

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
