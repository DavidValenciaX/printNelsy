import { fabric } from 'fabric';
import { constrainObjectToMargin } from './../canvas/constraintUtils.js';
import { showNoObjectSelectedWarning } from '../utils/uiUtils.js';
import { originalGroups } from './imageUploadUtils.js';
import Swal from 'sweetalert2';

export function resetActiveImage(canvas, marginRect, originalImages) {
  console.log('Executing resetActiveImage...');
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
    return;
  }

  // Iterate over each selected image
  activeObjects.forEach((activeObject) => {
    console.log(`[resetActiveImage] Processing object: ID=${activeObject?.id}, Type=${activeObject?.type}`);
    if (activeObject.type === 'group') {
        console.warn('[resetActiveImage] Skipped group object inside a selection. Groups should be reset individually.');
        return;
    }
    if (!originalImages[activeObject?.id]) {
      console.error(`[resetActiveImage] Original data not found for image ID: ${activeObject?.id}`);
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

      // Preservar la visibilidad de los controles
      if (activeObject._controlsVisibility) {
        img.setControlsVisibility(activeObject._controlsVisibility);
      }

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

/**
 * Restablece el grupo activo a su estado original
 * @param {fabric.Canvas} canvas - Instancia del canvas
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 * @param {Object} originalGroups - Objeto con los datos originales de los grupos
 */
export function resetActiveGroup(canvas, marginRect, originalGroups) {
  console.log('Executing resetActiveGroup...');
  const activeObject = canvas.getActiveObject();

  console.log(`[resetActiveGroup] Processing object: ID=${activeObject?.id}, Type=${activeObject?.type}`);
  // Verificar que hay un objeto seleccionado y que es un grupo
  if (!activeObject || activeObject.type !== 'group') {
    Swal.fire({
      text: 'Por favor, selecciona un grupo para restablecer.',
      icon: 'info',
    });
    return;
  }

  // Verificar que el grupo tiene datos originales guardados
  if (!originalGroups[activeObject.id]) {
    console.error(`[resetActiveGroup] Original data not found for group ID: ${activeObject.id}`);
    Swal.fire({
      text: `No se pudo restablecer el grupo con id ${
        activeObject.id || "n/a"
      }. No se encontraron datos originales.`,
      icon: 'warning',
    });
    return;
  }

  const original = originalGroups[activeObject.id];

  console.log(`[resetActiveGroup] Estado original encontrado:`, original);

  try {
    // Restablece las propiedades principales del grupo
    activeObject.set({
      left: original.left,
      top: original.top,
      scaleX: original.scaleX,
      scaleY: original.scaleY,
      angle: original.angle,
      originX: original.originX,
      originY: original.originY,
      // Restaurar propiedades de transformación visual
      flipX: original.flipX || false,
      flipY: original.flipY || false,
    });

    // Restablece las propiedades de los objetos dentro del grupo
    if (original.objects && activeObject._objects) {
      original.objects.forEach((originalObj, index) => {
        const currentObj = activeObject._objects[index];
        if (currentObj && currentObj.id === originalObj.id) {
          // Propiedades básicas
          currentObj.set({
            left: originalObj.left,
            top: originalObj.top,
            scaleX: originalObj.scaleX,
            scaleY: originalObj.scaleY,
            angle: originalObj.angle,
            // Restaurar propiedades de transformación visual
            flipX: originalObj.flipX || false,
            flipY: originalObj.flipY || false,
          });

          // Para imágenes, restaurar filtros si existen
          if (currentObj.type === 'image' && originalObj.filters) {
            console.log(`[resetActiveGroup] Restaurando filtros para imagen ID: ${currentObj.id}`, originalObj.filters);
            // Limpiar filtros actuales
            currentObj.filters = [];
            
            // Restaurar filtros originales
            if (originalObj.filters.length > 0) {
              originalObj.filters.forEach(filterData => {
                let filter = null;
                
                // Recrear el filtro según su tipo
                if (filterData.type === 'Grayscale' || filterData.type === 'fabric.Image.filters.Grayscale') {
                  filter = new fabric.Image.filters.Grayscale();
                }
                // Aquí se pueden agregar más tipos de filtros si es necesario
                
                if (filter) {
                  currentObj.filters.push(filter);
                }
              });
              
              // Aplicar los filtros restaurados
              currentObj.applyFilters();
            }
          }
        }
      });
    }

    // Asegurar que el grupo esté dentro de los márgenes
    const constrainedGroup = constrainObjectToMargin(activeObject, marginRect);

    // Actualizar coordenadas y renderizar
    constrainedGroup.setCoords();
    canvas.renderAll();

    Swal.fire({
      text: 'Grupo restablecido a su estado original.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (error) {
    console.error('Error al restablecer el grupo:', error);
    Swal.fire({
      text: 'Error al restablecer el grupo. Inténtalo de nuevo.',
      icon: 'error',
    });
  }
}

export function resetActiveObject(canvas, marginRect, originalImages, originalGroups) {
  const activeObject = canvas.getActiveObject();

  if (!activeObject) {
    showNoObjectSelectedWarning();
    return;
  }

  console.log(`[resetActiveObject] Dispatching reset for object Type: ${activeObject.type}, ID: ${activeObject.id}`);

  if (activeObject.type === 'group') {
    resetActiveGroup(canvas, marginRect, originalGroups);
  } else if (activeObject.type === 'image' || activeObject.type === 'activeSelection') {
    resetActiveImage(canvas, marginRect, originalImages);
  } else {
    Swal.fire({
      text: 'El objeto seleccionado no se puede restablecer.',
      icon: 'info',
    });
  }
}