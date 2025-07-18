import Swal from 'sweetalert2';

/**
 * Function to validate size input
 */
function validateSizeInput(value, dimension) {
  if (!value) {
    return { isValid: true, value: null, isEmpty: true };
  }
  
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed <= 0) {
    Swal.fire({
      text: `Introduzca una ${dimension} válida en centímetros.`,
      icon: "warning",
    });
    return { isValid: false, value: null, isEmpty: false };
  }
  return { isValid: true, value: parsed, isEmpty: false };
}

function calculateNewScales(selectedImage, widthCm, heightCm, maintainAspect, canvasScaleX, canvasScaleY, dpi) {
  const originalScaleX = selectedImage.scaleX;
  const originalScaleY = selectedImage.scaleY;
  let newScaleX = originalScaleX;
  let newScaleY = originalScaleY;

  if (maintainAspect) {
    if (widthCm) {
      const targetWidthPixels = (widthCm / 2.54) * dpi;
      const uniformScale = (targetWidthPixels * canvasScaleX) / selectedImage.width;
      newScaleX = uniformScale;
      newScaleY = uniformScale;
    } else if (heightCm) {
      const targetHeightPixels = (heightCm / 2.54) * dpi;
      const uniformScale = (targetHeightPixels * canvasScaleY) / selectedImage.height;
      newScaleX = uniformScale;
      newScaleY = uniformScale;
    }
  } else {
    if (widthCm) {
      const targetWidthPixels = (widthCm / 2.54) * dpi;
      newScaleX = (targetWidthPixels * canvasScaleX) / selectedImage.width;
    }
    if (heightCm) {
      const targetHeightPixels = (heightCm / 2.54) * dpi;
      newScaleY = (targetHeightPixels * canvasScaleY) / selectedImage.height;
    }
  }

  return { newScaleX, newScaleY };
}

function applyScalesWithConstraints(selectedImage, newScaleX, newScaleY, originalState, marginRect) {
  selectedImage.scaleX = newScaleX;
  selectedImage.scaleY = newScaleY;
  selectedImage.setCoords();

  let br = selectedImage.getBoundingRect();
  if (
    br.left < marginRect.left ||
    br.top < marginRect.top ||
    br.left + br.width > marginRect.left + marginRect.width ||
    br.top + br.height > marginRect.top + marginRect.height
  ) {
    constrainObjectToMargin(selectedImage, marginRect);
    br = selectedImage.getBoundingRect();
  }

  // Check if still exceeds margins after constraint
  if (
    br.left < marginRect.left ||
    br.top < marginRect.top ||
    br.left + br.width > marginRect.left + marginRect.width ||
    br.top + br.height > marginRect.top + marginRect.height
  ) {
    // Revert to original state
    selectedImage.top = originalState.top;
    selectedImage.left = originalState.left;
    selectedImage.scaleX = originalState.scaleX;
    selectedImage.scaleY = originalState.scaleY;
    selectedImage.setCoords();
    
    Swal.fire({
      text: "El tamaño deseado excede el límite de los márgenes.",
      icon: "warning",
    });
    return false;
  }
  return true;
}

function setSingleImageSizeInCm(selectedImage, inputElements, maintainAspect, paperOptions, canvasDetails) {
  const { widthInput, heightInput } = inputElements;
  const { currentSize, isVertical, paperSizes } = paperOptions;
  const { canvas, marginRect, dpi } = canvasDetails;

  const widthInputValue = widthInput.value;
  const heightInputValue = heightInput.value;

  // Validate inputs
  const widthResult = validateSizeInput(widthInputValue, "anchura");
  const heightResult = validateSizeInput(heightInputValue, "altura");
  
  if (!widthResult.isValid || !heightResult.isValid) {
    widthInput.value = "";
    heightInput.value = "";
    return;
  }

  const widthCm = widthResult.value;
  const heightCm = heightResult.value;

  if (!widthCm && !heightCm) {
    Swal.fire({
      text: "Introduzca al menos una medida válida.",
      icon: "warning",
    });
    return;
  }

  // Calculate canvas scales
  let paperWidth = paperSizes[currentSize].width;
  let paperHeight = paperSizes[currentSize].height;
  if (!isVertical) {
    [paperWidth, paperHeight] = [paperHeight, paperWidth];
  }
  const canvasScaleX = canvas.getWidth() / paperWidth;
  const canvasScaleY = canvas.getHeight() / paperHeight;

  // Store original state
  const originalState = {
    top: selectedImage.top,
    left: selectedImage.left,
    scaleX: selectedImage.scaleX,
    scaleY: selectedImage.scaleY
  };

  // Calculate new scales
  const { newScaleX, newScaleY } = calculateNewScales(
    selectedImage, widthCm, heightCm, maintainAspect, canvasScaleX, canvasScaleY, dpi
  );

  // Apply scales with constraint checking
  const success = applyScalesWithConstraints(selectedImage, newScaleX, newScaleY, originalState, marginRect);
  
  if (success) {
    canvas.renderAll();
  }
}

function setImageSizeInCm({ canvas, widthInput, heightInput, marginRect, paperConfig }) {
  if (!paperConfig) {
    console.error("paperConfig is not defined. Cannot set image size.");
    Swal.fire({
      text: "Error de configuración: no se pudo obtener la configuración del papel.",
      icon: "error",
    });
    return;
  }
  const { currentSize, isVertical, paperSizes, dpi } = paperConfig;
  const activeObjects = canvas.getActiveObjects();
  const selectedImages = activeObjects.filter((obj) => obj.type === "image" || obj.type === "group");

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

  const maintainAspect = document.getElementById("maintainAspectCheckbox").checked;

  selectedImages.forEach((obj) => {
    if (obj.type === "image" || obj.type === "group") {
      // Para los grupos, debemos obtener el punto central antes de cambiar el origen
      // para evitar que el objeto se desplace. Luego establecemos el origen y
      // lo reposicionamos en su centro calculado.
      if (obj.type === 'group') {
        const centerPoint = obj.getCenterPoint();
        obj.set({
          originX: "center",
          originY: "center",
          left: centerPoint.x,
          top: centerPoint.y,
        });
        obj.setCoords(); // Recalcular coordenadas después de reposicionar
      } else {
        // Para imágenes individuales, basta con establecer el origen
        obj.set({
          originX: "center",
          originY: "center",
        });
      }

      setSingleImageSizeInCm(
        obj, 
        { widthInput, heightInput }, 
        maintainAspect, 
        { currentSize, isVertical, paperSizes }, 
        { canvas, marginRect, dpi }
      );
    }
  });

  widthInput.value = "";
  heightInput.value = "";
}

// Import required function
import { constrainObjectToMargin } from './../canvas/constraintUtils.js';

export {
  setImageSizeInCm,
  setSingleImageSizeInCm,
  calculateNewScales,
  applyScalesWithConstraints,
  validateSizeInput
}; 