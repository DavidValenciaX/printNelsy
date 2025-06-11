import { constrainObjectToMargin } from './../canvas/constraintUtils.js';

const SCALE_FACTOR = 0.01;

function scaleUp(canvas, marginRect) {
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

function scaleDown(canvas, marginRect) {
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

export { scaleUp, scaleDown }; 