import { arrangeImages } from './arrangeUtils.js';

// Variables exportadas para gestión de imágenes
export const originalImages = {};
export const imageState = {
  arrangementStatus: "none",
  lastLayout: "rows",
  lastDirection: "forward"
};

// Función para actualizar el estado de arreglo
export function setArrangementStatus(status) {
  imageState.arrangementStatus = status;
}

// Función para actualizar el layout
export function setLastLayout(layout) {
  imageState.lastLayout = layout;
}

// Función para actualizar la dirección
export function setLastDirection(direction) {
  imageState.lastDirection = direction;
}

function _processFilesForCanvas(files, canvas, marginWidth, rotateCheckbox) {
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
          // Primero, se organiza el layout de las imágenes
          if (numFilesToProcess <= 2) {
            imageState.arrangementStatus = arrangeImages(canvas, loadedImages, "cols", marginWidth, "forward");
            imageState.lastLayout = "cols";
            imageState.lastDirection = "forward";
          } else {
            imageState.arrangementStatus = arrangeImages(canvas, loadedImages, "rows", marginWidth, "forward");
            imageState.lastLayout = "rows";
            imageState.lastDirection = "forward";
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
export function handleImageUpload(e, canvas, marginWidth, rotateCheckbox) {
  const files = e.target.files;

  // Es una buena práctica verificar si se seleccionaron archivos.
  if (files && files.length > 0) {
    _processFilesForCanvas(files, canvas, marginWidth, rotateCheckbox);
  }

  // Resetea el valor del input de archivo.
  // Esto permite que el evento 'change' se dispare de nuevo si el usuario selecciona el mismo archivo.
  if (e.target) {
    e.target.value = null;
  }
}

// Nueva función para manejar el drop de imágenes
export function handleImageDrop(e, canvas, marginWidth, rotateCheckbox) {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    _processFilesForCanvas(files, canvas, marginWidth, rotateCheckbox);
  }
}