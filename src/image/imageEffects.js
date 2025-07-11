import { showNoObjectSelectedWarning } from "../utils/uiUtils.js";

export function convertToGrayscale(canvas) {
  const activeObjects = canvas
    .getActiveObjects()
    .filter((obj) => obj.type === "image");
  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
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