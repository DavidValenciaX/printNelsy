import { constrainObjectToMargin, scaleToFitWithinMargin } from './../canvas/constraintUtils.js';

export function rotateImage(canvas, deg, marginRect) {
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