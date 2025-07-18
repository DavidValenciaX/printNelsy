import { fabric } from 'fabric';
import { showNoObjectSelectedWarning } from "../utils/uiUtils.js";

/**
 * Aplica un filtro de escala de grises a una imagen de alta resolución fuera de la pantalla
 * para preservar la calidad original y evitar recortes en imágenes escaladas.
 *
 * @param {fabric.Image} imageObject - El objeto de imagen de fabric a procesar.
 * @returns {Promise<fabric.Image>} Una promesa que se resuelve con el nuevo objeto de imagen en escala de grises.
 */
function applyGrayscaleToFullResolution(imageObject) {
  return new Promise((resolve, reject) => {

    const originalElement = imageObject.getElement();
    const originalWidth = imageObject.width;
    const originalHeight = imageObject.height;

    if (!originalWidth || !originalHeight) {
      console.error('[Debug] Las dimensiones originales de la imagen no son válidas.');
      return reject(new Error('Dimensiones de imagen originales no válidas.'));
    }

    // Crear un canvas estático temporal fuera de pantalla
    const tempCanvas = new fabric.StaticCanvas(null, {
      width: originalWidth,
      height: originalHeight,
    });

    // Crear una nueva instancia de imagen a partir del elemento original para el canvas temporal
    const tempImage = new fabric.Image(originalElement, {
      left: 0,
      top: 0,
      width: originalWidth,
      height: originalHeight,
      scaleX: 1,
      scaleY: 1,
    });

    // Aplicar el filtro de escala de grises a la imagen en el canvas temporal
    tempImage.filters.push(new fabric.Image.filters.Grayscale());

    // Forzar el uso del backend de Canvas2D para el filtrado.
    // Esto es crucial para imágenes muy grandes que pueden exceder el límite de textura de WebGL,
    // lo que causaría que la imagen se recorte. El backend 2D es más lento pero más robusto.
    const originalBackend = fabric.filterBackend;
    try {
      fabric.filterBackend = new fabric.Canvas2dFilterBackend();

      tempImage.applyFilters();

    } catch (e) {
      // Asegurarse de restaurar el backend incluso si hay un error
      fabric.filterBackend = originalBackend;
      return reject(e);
    } finally {
      // Restaurar el backend de filtro original para no afectar otras operaciones
      fabric.filterBackend = originalBackend;
    }

    // Añadir la imagen al canvas temporal para poder exportarla
    tempCanvas.add(tempImage);
    tempCanvas.renderAll();

    // Exportar el resultado a un dataURL
    const dataURL = tempCanvas.toDataURL({
      format: 'png', // Usar PNG para preservar la transparencia
      quality: 1,    // Máxima calidad
    });

    // Liberar recursos del canvas temporal
    tempCanvas.dispose();

    // Crear la imagen final a partir del dataURL
    fabric.Image.fromURL(dataURL, (newGrayscaleImage) => {
      if (!newGrayscaleImage) {
        return reject(new Error('No se pudo crear la imagen en escala de grises.'));
      }
      
      resolve(newGrayscaleImage);
    });
  });
}

/**
 * Reemplaza una imagen en el canvas por una nueva, preservando todas las transformaciones y propiedades.
 * @param {fabric.Canvas} canvas - El canvas principal.
 * @param {fabric.Image} oldImage - La imagen a reemplazar.
 * @param {fabric.Image} newImage - La nueva imagen.
 */
function replaceImageOnCanvas(canvas, oldImage, newImage) {
  // Preservar todas las propiedades clave de la imagen original
  newImage.set({
    left: oldImage.left,
    top: oldImage.top,
    scaleX: oldImage.scaleX,
    scaleY: oldImage.scaleY,
    angle: oldImage.angle,
    flipX: oldImage.flipX,
    flipY: oldImage.flipY,
    originX: oldImage.originX,
    originY: oldImage.originY,
    skewX: oldImage.skewX,
    skewY: oldImage.skewY,
    id: oldImage.id, // Mantener el ID original
    selectable: oldImage.selectable,
    evented: oldImage.evented,
    // Copiar otras propiedades personalizadas si las hubiera
    ...oldImage.customProps,
  });

  // Preservar la visibilidad de los controles
  if (oldImage._controlsVisibility) {
    newImage.setControlsVisibility(oldImage._controlsVisibility);
  }

  const imageIndex = canvas.getObjects().indexOf(oldImage);
  canvas.remove(oldImage);

  if (imageIndex !== -1) {
    canvas.insertAt(newImage, imageIndex);
  } else {
    canvas.add(newImage);
  }

  canvas.setActiveObject(newImage);
  canvas.renderAll();
}


/**
 * Convierte las imágenes seleccionadas a escala de grises usando un método robusto
 * que procesa la imagen a resolución completa para evitar problemas de calidad y recortes.
 * @param {fabric.Canvas} canvas - El canvas de fabric.js
 */
export async function convertToGrayscale(canvas) {
  const activeObjects = canvas.getActiveObjects();

  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
    return;
  }

  const imagesToProcess = [];

  // Recorrer todos los objetos activos y extraer las imágenes
  activeObjects.forEach(obj => {
    if (obj.type === 'image') {
      imagesToProcess.push(obj);
    } else if (obj.type === 'group') {
      // Si es un grupo, añadir todas las imágenes que contiene
      obj.getObjects('image').forEach(imageInGroup => {
        imagesToProcess.push(imageInGroup);
      });
    }
  });

  if (imagesToProcess.length === 0) {
    showNoObjectSelectedWarning(); // O un mensaje más específico
    return;
  }

  for (const imageObject of imagesToProcess) {
    try {
      const newGrayscaleImage = await applyGrayscaleToFullResolution(imageObject);
      
      // Si la imagen estaba en un grupo, no la reemplazamos directamente en el canvas
      if (imageObject.group) {
        // Este es un caso complejo. La forma más segura es recrear el grupo.
        // Por ahora, simplemente aplicaremos el filtro sin reemplazar, 
        // lo que puede no funcionar como se espera con el método actual.
        // La solución ideal es más compleja.
        // Solución simple (puede no ser visualmente correcta sin recrear el grupo):
        const originalFilters = imageObject.filters || [];
        imageObject.filters = [...originalFilters, new fabric.Image.filters.Grayscale()];
        imageObject.applyFilters();
      } else {
        replaceImageOnCanvas(canvas, imageObject, newGrayscaleImage);
      }

    } catch (error) {
      console.error(`Error al procesar la imagen ID ${imageObject.id}:`, error);
    }
  }
  
  canvas.renderAll();
} 