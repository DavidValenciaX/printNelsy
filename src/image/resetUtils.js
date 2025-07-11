import { constrainObjectToMargin } from './../canvas/constraintUtils.js';
import { showNoObjectSelectedWarning } from '../utils/uiUtils.js';

export function resetActiveImage(canvas, marginRect, originalImages) {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
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