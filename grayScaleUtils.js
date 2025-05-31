export function convertToGrayscale(canvas) {
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