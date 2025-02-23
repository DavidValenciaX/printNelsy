let currentZoom = 1;
const zoomFactor = 0.1;
const maxZoom = 2;
const minZoom = 0.5;

function zoomIn() {
  if (currentZoom < maxZoom) {
    currentZoom += zoomFactor;
    applyZoom();
  }
}

function zoomOut() {
  if (currentZoom > minZoom) {
    currentZoom -= zoomFactor;
    applyZoom();
  }
}

function applyZoom() {
    const mainContent = document.getElementById("main-content");
    // Anchor scaling from the top center
    mainContent.style.transformOrigin = "top center";
    mainContent.style.transform = `scale(${currentZoom})`;
  
    // Adjust vertical position if the top is off-screen
    const rect = mainContent.getBoundingClientRect();
    if (rect.top < 0) {
      // Shift main-content down so that it is fully visible
      mainContent.style.position = "relative";
      mainContent.style.top = `${-rect.top}px`;
    } else {
      mainContent.style.top = "0";
    }
  }

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

let currentSize = "carta";
let isVertical = true;
let marginRect;

let cropRect = null;
let activeImage = null;
let isCropping = false;
let inactivatedObjects = [];

function createMasonryCollage() {
  const images = canvas.getObjects("image");
  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
  }

  const N = images.length;
  const M = Math.max(2, Math.floor(Math.sqrt(N))); // Number of columns
  const gap = 10; // Horizontal gap between columns
  const vertical_gap = 10; // Vertical gap between images
  const W = (marginRect.width - (M - 1) * gap) / M; // Width of each column

  // Step 1: Scale images to fit column width
  images.forEach((img) => {
    img.angle = 0;
    const scale = W / img.width;
    img.scaleX = scale;
    img.scaleY = scale;
    img.setCoords();
  });

  // Step 2: Sort images by scaled height (descending)
  const sortedImages = images.slice().sort((a, b) => {
    const H_a = a.height * a.scaleY;
    const H_b = b.height * b.scaleY;
    return H_b - H_a;
  });

  // Step 3: Initialize column data
  const columnHeights = new Array(M).fill(0); // Total height of each column
  const columnImages = new Array(M).fill().map(() => []); // Images in each column

  // Step 4: Place images in columns
  sortedImages.forEach((img) => {
    // Find the column with the smallest current height
    const minHeight = Math.min(...columnHeights);
    const k = columnHeights.indexOf(minHeight);
    // Calculate position
    const left = marginRect.left + k * (W + gap) + W / 2;
    const H_i = img.height * img.scaleY;
    const top = marginRect.top + columnHeights[k] + H_i / 2;
    img.set({
      left: left,
      top: top,
      originX: "center",
      originY: "center",
    });
    img.setCoords();
    // Update column height and store image
    columnHeights[k] += H_i + vertical_gap;
    columnImages[k].push(img);
  });

  // Step 5: Adjust columns exceeding max height
  const maxAllowedHeight = marginRect.height; // Corrected to marginRect.height

  columnHeights.forEach((height, k) => {
    const numImages = columnImages[k].length;
    if (numImages === 0) return;

    // Calculate total gaps and original image heights
    const totalGaps = (numImages - 1) * vertical_gap;
    const totalImageHeight = height - numImages * vertical_gap; // Subtract gaps added during placement

    const availableHeight = maxAllowedHeight - totalGaps;

    if (totalImageHeight > availableHeight) {
      const scaleFactor = availableHeight / totalImageHeight;
      let currentTop = marginRect.top;

      // Adjust each image in the column
      columnImages[k].forEach((img) => {
        // Apply scaling
        img.scaleX *= scaleFactor;
        img.scaleY *= scaleFactor;
        // Recalculate height after scaling
        const H_i = img.height * img.scaleY;
        // Set new vertical position
        img.set({
          top: currentTop + H_i / 2,
          originX: "center",
          originY: "center",
        });
        img.setCoords();
        // Update position for the next image
        currentTop += H_i + vertical_gap;
      });
    }
  });

  // Step 6: Render the updated canvas
  canvas.renderAll();
  // Set flag to indicate collage arrangement
  arrangementStatus = "collage";
}

function setImageSizeInCm() {
  const activeObjects = canvas.getActiveObjects();
  const selectedImages = activeObjects.filter((obj) => obj.type === "image");

  if (selectedImages.length === 0) {
    Swal.fire({
      text: "Seleccione primero una o más imágenes.",
      icon: "warning",
    });
    return;
  }

  // Sólo se descarta la selección si son varias imágenes
  if (selectedImages.length > 1) {
    canvas.discardActiveObject();
  }

  selectedImages.forEach((obj) => {
    if (obj.type === "image") {
      // Ensure origin is set to center for individual scaling
      obj.set({
        originX: "center",
        originY: "center",
      });
      setSingleImageSizeInCm(obj);
    }
  });

  widthInput.value = "";
  heightInput.value = "";
}

function setSingleImageSizeInCm(selectedImage) {
  // Obtener los valores de ancho y alto ingresados
  const widthInputValue = widthInput.value;
  const heightInputValue = heightInput.value;

  // Ajustar dimensiones del papel según orientación
  let paperWidth = paperSizes[currentSize].width;
  let paperHeight = paperSizes[currentSize].height;
  if (!isVertical) {
    [paperWidth, paperHeight] = [paperHeight, paperWidth];
  }

  // Se utilizan escalas separadas para ancho y alto
  const canvasScaleX = canvas.getWidth() / paperWidth;
  const canvasScaleY = canvas.getHeight() / paperHeight;

  const originalTop = selectedImage.top;
  const originalLeft = selectedImage.left;
  const originalScaleX = selectedImage.scaleX;
  const originalScaleY = selectedImage.scaleY;

  let newScaleX = originalScaleX;
  let newScaleY = originalScaleY;
  let updated = false;

  if (widthInputValue) {
    const cmWidth = parseFloat(widthInputValue);
    if (isNaN(cmWidth) || cmWidth <= 0) {
      Swal.fire({
        text: "Introduzca una anchura válida en centímetros.",
        icon: "warning",
      });
      widthInput.value = "";
      return;
    }
    const targetWidthPixels = (cmWidth / 2.54) * dpi;
    newScaleX = (targetWidthPixels * canvasScaleX) / selectedImage.width;
    updated = true;
  }
  if (heightInputValue) {
    const cmHeight = parseFloat(heightInputValue);
    if (isNaN(cmHeight) || cmHeight <= 0) {
      Swal.fire({
        text: "Introduzca una altura válida en centímetros.",
        icon: "warning",
      });
      heightInput.value = "";
      return;
    }
    const targetHeightPixels = (cmHeight / 2.54) * dpi;
    newScaleY = (targetHeightPixels * canvasScaleY) / selectedImage.height;
    updated = true;
  }
  if (!updated) {
    Swal.fire({
      text: "Introduzca al menos una medida válida.",
      icon: "warning",
    });
    widthInput.value = "";
    heightInput.value = "";
    return;
  }

  // Aplica las nuevas escalas
  selectedImage.scaleX = newScaleX;
  selectedImage.scaleY = newScaleY;
  selectedImage.setCoords();

  // Se recalcula primero el bounding rect y se intenta ajustar
  let br = selectedImage.getBoundingRect();
  if (
    br.left < marginRect.left ||
    br.top < marginRect.top ||
    br.left + br.width > marginRect.left + marginRect.width ||
    br.top + br.height > marginRect.top + marginRect.height
  ) {
    constrainObjectToMargin(selectedImage, marginRect);
    // Recalcula el bounding rect luego de ajustar la posición
    br = selectedImage.getBoundingRect();
  }

  // Si tras el ajuste la imagen sigue saliéndose, se revierte al estado original
  if (
    br.left < marginRect.left ||
    br.top < marginRect.top ||
    br.left + br.width > marginRect.left + marginRect.width ||
    br.top + br.height > marginRect.top + marginRect.height
  ) {
    selectedImage.top = originalTop;
    selectedImage.left = originalLeft;
    selectedImage.scaleX = originalScaleX;
    selectedImage.scaleY = originalScaleY;
    selectedImage.setCoords();
    Swal.fire({
      text: "El tamaño deseado excede el límite de los márgenes.",
      icon: "warning",
    });
    canvas.renderAll();
    return;
  }

  canvas.renderAll();
}

function centerVertically() {
  const activeObjects = canvas.getActiveObjects();
  const selectedImages = activeObjects.filter((obj) => obj.type === "image");

  if (selectedImages.length === 0) {
    Swal.fire({
      text: "Seleccione primero una o más imágenes.",
      icon: "warning",
    });
    return;
  }

  // Si se han seleccionado varias imágenes, se descarta el objeto activo para tratar cada una individualmente
  if (selectedImages.length > 1) {
    canvas.discardActiveObject();
  }

  const canvasHeight = canvas.getHeight();
  const centerY = canvasHeight / 2;

  selectedImages.forEach((image) => {
    image.set({
      top: centerY,
      originY: "center",
    });
    image.setCoords();
  });

  canvas.renderAll();
}

function centerHorizontally() {
  const activeObjects = canvas.getActiveObjects();
  const selectedImages = activeObjects.filter((obj) => obj.type === "image");

  if (selectedImages.length === 0) {
    Swal.fire({
      text: "Seleccione primero una o más imágenes.",
      icon: "warning",
    });
    return;
  }

  // Si se han seleccionado varias imágenes, se descarta el objeto activo para tratar cada una individualmente
  if (selectedImages.length > 1) {
    canvas.discardActiveObject();
  }

  const canvasWidth = canvas.getWidth();
  const centerX = canvasWidth / 2;

  selectedImages.forEach((image) => {
    image.set({
      left: centerX,
      originX: "center",
    });
    image.setCoords();
  });

  canvas.renderAll();
}

const SCALE_FACTOR = 0.01;

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

function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

function radToDeg(radians) {
  return radians * (180 / Math.PI);
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
    } else if (arrangementStatus === "collage") {
      // Re-add images and create collage
      images.forEach((img) => canvas.add(img));
      createMasonryCollage();
    } else if (arrangementStatus === "none") {
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
  const loadedImages = [];
  let processedCount = 0;

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

        if (processedCount === files.length) {
          // Primero, se organiza el layout de las imágenes
          if (files.length <= 2) {
            arrangeImages(loadedImages, "cols", "forward");
            lastLayout = "cols";
            lastDirection = "forward";
          } else {
            arrangeImages(loadedImages, "rows", "forward");
            lastLayout = "rows";
            lastDirection = "forward";
          }

          // Luego, se guardan los datos originales ya con sus valores de top, left, scaleX y scaleY actualizados
          loadedImages.forEach((img) => {
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

          // Seleccionar automáticamente si solo hay una imagen
          if (files.length === 1) {
            canvas.discardActiveObject();
            canvas.setActiveObject(loadedImages[0]);
            canvas.renderAll();
          }
        }
      });
    };
    reader.readAsDataURL(file);
  }
}

// Función para redondear a un número específico de decimales
function roundToDecimals(value, decimals) {
  return Number(value.toFixed(decimals));
}

function arrangeImages(images, orientation, order = "forward") {
  const count = images.length;
  let marginAdjustment = count <= 2 ? 100 : 20;
  const margin = marginWidth + marginAdjustment;

  // Crear copia y ordenar según order
  const sortedImages = [...images];
  if (order === "reverse") {
    sortedImages.reverse();
  }

  let cols, rows;
  if (orientation === "rows") {
    cols = Math.ceil(Math.sqrt(count));
    rows = Math.ceil(count / cols);
  } else if (orientation === "cols") {
    rows = Math.ceil(Math.sqrt(count));
    cols = Math.ceil(count / rows);
  }

  const cellWidth = (canvas.width - margin * 2) / cols;
  const cellHeight = (canvas.height - margin * 2) / rows;

  sortedImages.forEach((img, index) => {
    // Determinar fila y columna sin alterar el id permanente
    let row, col;
    if (orientation === "rows") {
      row = Math.floor(index / cols);
      col = index % cols;
    } else if (orientation === "cols") {
      col = Math.floor(index / rows);
      row = index % rows;
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

    // Se mantiene originalImages intacto con la información original
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

function printCanvas() {
  // Store original opacity
  const originalOpacity = marginRect.opacity;

  // Make margin invisible for printing
  marginRect.opacity = 0;
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 1 / canvas.getZoom(),
  });

  const windowContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir Canvas</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                @page {
                    margin: 0;
                    size: auto;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                img {
                    width: 100%;
                    height: auto;
                    display: block;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <img src="${dataUrl}">
        </body>
        </html>`;

  const printWin = window.open("", "", "width=800,height=600");
  printWin.document.open();
  printWin.document.write(windowContent);
  printWin.document.close();
  printWin.setTimeout(function () {
    printWin.focus();
    printWin.print();
    printWin.close();
    marginRect.opacity = originalOpacity;
    canvas.renderAll();
  }, 250);
}

function rotateImage(deg) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  activeObject.rotate((activeObject.angle + deg) % 360);
  activeObject.setCoords();
  constrainObjectToMargin(activeObject, marginRect);
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

function calculateDistance(x1, y1, x2, y2) {
  // Calculate the difference in x and y coordinates
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Use Pythagorean theorem to calculate distance
  return Math.sqrt(dx * dx + dy * dy);
}

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

  // 3. Determine next arrangement state
  if (lastLayout === "rows" && lastDirection === "forward") {
    arrangeImages(images, "rows", "reverse");
    lastLayout = "rows";
    lastDirection = "reverse";
  } else if (lastLayout === "rows" && lastDirection === "reverse") {
    arrangeImages(images, "cols", "forward");
    lastLayout = "cols";
    lastDirection = "forward";
  } else if (lastLayout === "cols" && lastDirection === "forward") {
    arrangeImages(images, "cols", "reverse");
    lastLayout = "cols";
    lastDirection = "reverse";
  } else {
    arrangeImages(images, "rows", "forward");
    lastLayout = "rows";
    lastDirection = "forward";
  }

  canvas.renderAll();
}

cartaButton.addEventListener("click", () => resizeCanvas("carta"));
oficioButton.addEventListener("click", () => resizeCanvas("oficio"));
a4Button.addEventListener("click", () => resizeCanvas("a4"));
verticalButton.addEventListener("click", () => changeOrientation(true));
horizontalButton.addEventListener("click", () => changeOrientation(false));

imageLoader.addEventListener("change", handleImageUpload);
resetImageButton.addEventListener("click", resetActiveImage);
printButton.addEventListener("click", printCanvas);
grayScaleButton.addEventListener("click", convertToGrayscale);
rotateButton_p90.addEventListener("click", () => rotateImage(90));
rotateButton_n90.addEventListener("click", () => rotateImage(270));
centerVerticallyButton.addEventListener("click", centerVertically);
centerHorizontallyButton.addEventListener("click", centerHorizontally);
deleteButton.addEventListener("click", deleteActiveObject);
confirmCropButton.addEventListener("click", confirmCrop);
cancelCropButton.addEventListener("click", exitCropMode);
scaleUpButton.addEventListener("click", scaleUp);
scaleDownButton.addEventListener("click", scaleDown);
arrangeButton.addEventListener("click", selectArrangeImageLayout);
setSizeButton.addEventListener("click", setImageSizeInCm);
collageButton.addEventListener("click", createMasonryCollage);

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

function constrainObjectToMargin(obj, marginRect) {
  obj.setCoords();

  let objPoints = [
    obj.aCoords.tl,
    obj.aCoords.tr,
    obj.aCoords.br,
    obj.aCoords.bl,
  ];
  let marginRight = marginRect.left + marginRect.width;
  let marginBottom = marginRect.top + marginRect.height;

  let offsetX = 0,
    offsetY = 0;

  objPoints.forEach(function (point) {
    if (point.x < marginRect.left) {
      offsetX = Math.max(offsetX, marginRect.left - point.x);
    }
    if (point.x > marginRight) {
      offsetX = Math.min(offsetX, marginRight - point.x);
    }
    if (point.y < marginRect.top) {
      offsetY = Math.max(offsetY, marginRect.top - point.y);
    }
    if (point.y > marginBottom) {
      offsetY = Math.min(offsetY, marginBottom - point.y);
    }
  });

  if (offsetX !== 0 || offsetY !== 0) {
    obj.left += offsetX;
    obj.top += offsetY;
    obj.setCoords();
  }

  return obj;
}

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
		printButton, deleteButton, cropButton, confirmCropButton, cancelCropButton,
		cartaButton, oficioButton, a4Button, verticalButton, horizontalButton,
		rotateButton_p90, rotateButton_n90, resetImageButton, arrangeButton,
		grayScaleButton, scaleUpButton, scaleDownButton, centerVerticallyButton,
		centerHorizontallyButton, setSizeButton, collageButton
	];
	elements.forEach(el => {
		if (el) {
			// Use innerText or id as descriptive label.
			el.setAttribute('aria-label', el.innerText.trim() || el.getAttribute('id'));
			// Ensure buttons are focusable with a clear outline
			el.style.outline = '3px solid transparent';
			el.addEventListener('focus', () => {
				el.style.outline = '3px solid #ff0';
			});
			el.addEventListener('blur', () => {
				el.style.outline = '3px solid transparent';
			});
		}
	});
}
setupAccessibility();