import { fabric } from 'fabric';
import { arrangeImages, sortImages } from '../transform/arrangeUtils.js';
import { resetCustomGridDimensions } from '../layout/gridControls.js';

// Variables exportadas para gestión de imágenes
export const originalImages = {};
export const imageState = {
  arrangementStatus: "none",
  orientation: "rows",
  order: "forward"
};

// Variable para almacenar la referencia al domManager
let domManagerInstance = null;

// Función para establecer la referencia al domManager
export function setDOMManagerInstance(domManager) {
  domManagerInstance = domManager;
}

// Función para actualizar el estado de arreglo
export function setArrangementStatus(status) {
  imageState.arrangementStatus = status;
  
  // Actualizar los botones visuales si hay una instancia del domManager
  if (domManagerInstance) {
    import('../utils/arrangementButtons.js').then(({ updateArrangementButtons }) => {
      updateArrangementButtons(status, domManagerInstance);
    }).catch(error => {
      console.warn('Error updating arrangement buttons:', error);
    });
  }
}

// Función para actualizar el layout
export function setOrientation(orientation) {
  imageState.orientation = orientation;
}

// Función para actualizar la dirección
export function setOrder(order) {
  imageState.order = order;
}

/**
 * Checks if the canvas has any image objects.
 * @param {fabric.Canvas} canvas The canvas instance.
 * @returns {boolean} True if the canvas has no images, false otherwise.
 */
function isCanvasEmpty(canvas) {
  return canvas.getObjects("image").length === 0;
}

function _processFilesForCanvas(files, canvas, rotateCheckbox) {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    return;
  }

  const loadedImages = [];
  let processedCount = 0;
  const numFilesToProcess = imageFiles.length;

  for (const file of imageFiles) {
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
          const canvasWasEmpty = isCanvasEmpty(canvas);

          // Reset custom grid dimensions when loading new images
          resetCustomGridDimensions();

          // Determine layout for the new images
          const orientation = numFilesToProcess <= 2 ? "cols" : "rows";
          const order = "forward";

          // Arrange the new images on the canvas. This function adds them.
          const sortedImages = sortImages(loadedImages, order);
          arrangeImages(canvas, sortedImages, orientation);

          // Set the final arrangement status based on whether the canvas was initially empty.
          if (canvasWasEmpty) {
            setArrangementStatus("grid");
          } else {
            setArrangementStatus("none");
          }

          // Update the last layout properties regardless
          imageState.orientation = orientation;
          imageState.order = order;

          // Update order buttons UI
          if (domManagerInstance?.eventManager) {
            domManagerInstance.eventManager.updateOrderButtons(imageState.order);
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
}

// Función principal para manejar la subida de imágenes
export function handleImageUpload(e, canvas, rotateCheckbox) {
  const files = e.target.files;

  // Es una buena práctica verificar si se seleccionaron archivos.
  if (files && files.length > 0) {
    _processFilesForCanvas(files, canvas, rotateCheckbox);
  }

  // Resetea el valor del input de archivo.
  // Esto permite que el evento 'change' se dispare de nuevo si el usuario selecciona el mismo archivo.
  if (e.target) {
    e.target.value = null;
  }
}

// Nueva función para manejar el drop de imágenes
export function handleImageDrop(e, canvas, rotateCheckbox) {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    _processFilesForCanvas(files, canvas, rotateCheckbox);
  }
}