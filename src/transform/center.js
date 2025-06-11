// Functions for centering objects on the canvas

/**
 * Centers selected images vertically on the canvas
 * @param {fabric.Canvas} canvas - The fabric.js canvas instance
 */
export function centerVertically(canvas) {
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

/**
 * Centers selected images horizontally on the canvas
 * @param {fabric.Canvas} canvas - The fabric.js canvas instance
 */
export function centerHorizontally(canvas) {
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