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
    console.log(`[Debug] Iniciando procesamiento full-res para imagen ID: ${imageObject.id || 'N/A'}`);

    const originalElement = imageObject.getElement();
    const originalWidth = imageObject.width;
    const originalHeight = imageObject.height;

    if (!originalWidth || !originalHeight) {
      console.error('[Debug] Las dimensiones originales de la imagen no son válidas.');
      return reject(new Error('Dimensiones de imagen originales no válidas.'));
    }

    console.log(`[Debug] Dimensiones originales: ${originalWidth}x${originalHeight}`);

    // Crear un canvas estático temporal fuera de pantalla
    const tempCanvas = new fabric.StaticCanvas(null, {
      width: originalWidth,
      height: originalHeight,
    });

    console.log('[Debug] Canvas temporal creado.');

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
      console.log('[Debug] Forzando backend de filtro a Canvas2D para procesamiento de alta resolución.');

      tempImage.applyFilters();
      console.log('[Debug] Filtro de escala de grises aplicado a la imagen temporal con backend Canvas2D.');

    } catch (e) {
      console.error('[Debug] Error al aplicar filtros con backend Canvas2D:', e);
      // Asegurarse de restaurar el backend incluso si hay un error
      fabric.filterBackend = originalBackend;
      return reject(e);
    } finally {
      // Restaurar el backend de filtro original para no afectar otras operaciones
      fabric.filterBackend = originalBackend;
      console.log('[Debug] Backend de filtro restaurado al original.');
    }

    // Añadir la imagen al canvas temporal para poder exportarla
    tempCanvas.add(tempImage);
    tempCanvas.renderAll();
    console.log('[Debug] Imagen temporal renderizada en canvas temporal.');

    // Exportar el resultado a un dataURL
    const dataURL = tempCanvas.toDataURL({
      format: 'png', // Usar PNG para preservar la transparencia
      quality: 1,    // Máxima calidad
    });
    console.log('[Debug] DataURL generado desde el canvas temporal.');

    // Liberar recursos del canvas temporal
    tempCanvas.dispose();

    // Crear la imagen final a partir del dataURL
    fabric.Image.fromURL(dataURL, (newGrayscaleImage) => {
      if (!newGrayscaleImage) {
        console.error('[Debug] Error al crear la imagen final desde el DataURL.');
        return reject(new Error('No se pudo crear la imagen en escala de grises.'));
      }
      
      console.log('[Debug] Nueva imagen en escala de grises creada a partir del DataURL.');
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

  console.log(`[Debug] Propiedades transferidas a la nueva imagen ID: ${newImage.id}.`);
  console.log(`[Debug] Escala final: X=${newImage.scaleX}, Y=${newImage.scaleY}`);

  const imageIndex = canvas.getObjects().indexOf(oldImage);
  canvas.remove(oldImage);
  console.log('[Debug] Imagen antigua eliminada del canvas.');

  if (imageIndex !== -1) {
    canvas.insertAt(newImage, imageIndex);
  } else {
    canvas.add(newImage);
  }

  canvas.setActiveObject(newImage);
  canvas.renderAll();
  console.log('[Debug] Nueva imagen añadida al canvas y establecida como activa.');
}


/**
 * Convierte las imágenes seleccionadas a escala de grises usando un método robusto
 * que procesa la imagen a resolución completa para evitar problemas de calidad y recortes.
 * @param {fabric.Canvas} canvas - El canvas de fabric.js
 */
export async function convertToGrayscale(canvas) {
  const activeObjects = canvas.getActiveObjects().filter((obj) => obj.type === 'image');

  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
    return;
  }

  console.log(`[Debug] Iniciando conversión a escala de grises para ${activeObjects.length} imagen(es).`);

  for (const imageObject of activeObjects) {
    try {
      const newGrayscaleImage = await applyGrayscaleToFullResolution(imageObject);
      replaceImageOnCanvas(canvas, imageObject, newGrayscaleImage);
      console.log(`[Debug] Imagen ID ${imageObject.id} procesada y reemplazada exitosamente.`);
    } catch (error) {
      console.error(`Error al procesar la imagen ID ${imageObject.id}:`, error);
      // Opcional: notificar al usuario sobre el fallo de una imagen específica
    }
  }

  console.log('[Debug] Proceso de conversión a escala de grises finalizado.');
} 