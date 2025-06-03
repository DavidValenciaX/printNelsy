import { arrangeImages } from './arrangeUtils.js';

// Variables exportadas para gestión de imágenes
export const originalImages = {};
export let arrangementStatus = "none";
export let lastLayout = "rows";
export let lastDirection = "forward";

// Función para actualizar el estado de arreglo
export function setArrangementStatus(status) {
  arrangementStatus = status;
}

// Función para actualizar el layout
export function setLastLayout(layout) {
  lastLayout = layout;
}

// Función para actualizar la dirección
export function setLastDirection(direction) {
  lastDirection = direction;
}

// Función principal para manejar la subida de imágenes
export function handleImageUpload(e, canvas, marginWidth, rotateCheckbox) {
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
            arrangementStatus = arrangeImages(canvas, loadedImages, "cols", marginWidth, "forward");
            lastLayout = "cols";
            lastDirection = "forward";
          } else {
            arrangementStatus = arrangeImages(canvas, loadedImages, "rows", marginWidth, "forward");
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

  // Resetea el valor del input de archivo.
  // Esto permite que el evento 'change' se dispare de nuevo si el usuario selecciona el mismo archivo.
  if (e.target) {
    e.target.value = null;
  }
} 