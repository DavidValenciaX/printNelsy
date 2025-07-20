import { fabric } from 'fabric';
import { constrainObjectToMargin } from './../canvas/constraintUtils.js';
import { showNoObjectSelectedWarning } from '../utils/uiUtils.js';
import { originalGroups } from './imageUploadUtils.js';
import Swal from 'sweetalert2';

async function restoreGroupFromData(originalGroupData, canvas, marginRect, rotateCheckbox) {
  if (!originalGroupData?.objects || !Array.isArray(originalGroupData.objects)) {
    console.error('[restoreGroupFromData] Datos del grupo original no válidos:', originalGroupData);
    throw new Error('Datos del grupo original no válidos');
  }

  

  try {
    // Cargar todas las imágenes del grupo de forma secuencial para mejor control
    const loadedObjects = [];
    
    for (const objData of originalGroupData.objects) {
      if (objData.type === 'image' && objData.originalUrl) {
        try {
          const img = await new Promise((resolve, reject) => {
            fabric.Image.fromURL(objData.originalUrl, (loadedImg) => {
              // Configurar todas las propiedades del objeto original
              loadedImg.set({
                id: objData.id,
                left: objData.left,
                top: objData.top,
                scaleX: objData.scaleX,
                scaleY: objData.scaleY,
                angle: objData.angle,
                width: objData.width,
                height: objData.height,
                flipX: objData.flipX || false,
                flipY: objData.flipY || false,
                originX: 'center',
                originY: 'center'
              });

              // Restaurar filtros si existen
              if (objData.filters && objData.filters.length > 0) {
                loadedImg.filters = [];
                objData.filters.forEach(filterData => {
                  if (filterData.type === 'Grayscale' || filterData.type === 'fabric.Image.filters.Grayscale') {
                    loadedImg.filters.push(new fabric.Image.filters.Grayscale());
                  }
                });
                loadedImg.applyFilters();
              }

              // Configurar controles de rotación
              if (rotateCheckbox) {
                loadedImg.setControlsVisibility({
                  mtr: rotateCheckbox.checked,
                });
              }

              resolve(loadedImg);
            }, { 
              crossOrigin: 'anonymous',
              // Manejar errores de carga
              onError: () => {
                console.error(`Error al cargar imagen con URL: ${objData.originalUrl}`);
                reject(new Error(`No se pudo cargar la imagen: ${objData.originalUrl}`));
              }
            });
          });
          
          loadedObjects.push(img);
        } catch (error) {
          console.error(`Error al restaurar objeto ${objData.id}:`, error);
          throw error;
        }
      }
    }

    if (loadedObjects.length === 0) {
      throw new Error('No se pudieron cargar objetos válidos para el grupo');
    }



    // Crear el grupo con los objetos cargados
    const newGroup = new fabric.Group(loadedObjects, {
      id: originalGroupData.id,
      left: originalGroupData.left,
      top: originalGroupData.top,
      scaleX: originalGroupData.scaleX,
      scaleY: originalGroupData.scaleY,
      angle: originalGroupData.angle,
      originX: originalGroupData.originX,
      originY: originalGroupData.originY,
      flipX: originalGroupData.flipX || false,
      flipY: originalGroupData.flipY || false,
    });

    // Aplicar restricciones de margen
    const constrainedGroup = constrainObjectToMargin(newGroup, marginRect);
    
    // Añadir al canvas y configurar coordenadas
    canvas.add(constrainedGroup);
    constrainedGroup.setCoords();
    

    return constrainedGroup;

  } catch (error) {
    console.error('[restoreGroupFromData] Error al restaurar el grupo:', error);
    throw error;
  }
}

export async function resetActiveImage(canvas, marginRect, originalImages, originalGroups, rotateCheckbox) {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
    return;
  }

  // Procesar objetos de forma secuencial para evitar problemas de concurrencia
  for (const activeObject of activeObjects) {


    try {
      // Si la imagen fue originalmente un grupo recortado
      if (activeObject.originalType === 'group') {
        const originalGroup = originalGroups[activeObject.id];
        if (originalGroup) {

          
          // Remover el objeto actual antes de restaurar el grupo
          canvas.remove(activeObject);
          
          // Restaurar el grupo
          await restoreGroupFromData(originalGroup, canvas, marginRect, rotateCheckbox);
          
          // Continuar con el siguiente objeto
          continue;
        } else {
          console.error(`[resetActiveImage] Original data not found for group ID: ${activeObject.id}`);
          Swal.fire({
            text: `No se pudo restablecer el grupo recortado con id ${activeObject.id || "n/a"}. No se encontraron datos originales.`,
            icon: "warning",
          });
          continue;
        }
      }

      // Si es un grupo normal, saltarlo (debería usar resetActiveGroup)
      if (activeObject.type === 'group') {

        continue;
      }

      // Reseteo normal de imagen
      if (!originalImages[activeObject?.id]) {
        console.error(`[resetActiveImage] Original data not found for image ID: ${activeObject?.id}`);
        Swal.fire({
          text: `No se pudo restablecer la imagen con id ${
            activeObject.id || "n/a"
          }.`,
          icon: "warning",
        });
        continue;
      }

      const original = originalImages[activeObject.id];

      // Crear promesa para la carga de imagen
      await new Promise((resolve, reject) => {
        fabric.Image.fromURL(original.url, function (img) {
          try {
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
            } else if (rotateCheckbox) {
              img.setControlsVisibility({
                mtr: rotateCheckbox.checked,
              });
            }

            // Si la imagen queda fuera del canvas, se reubica dentro de los márgenes.
            const constrainedImg = constrainObjectToMargin(img, marginRect);

            // Replace old image with the new one
            canvas.remove(activeObject);
            canvas.add(constrainedImg);
            canvas.renderAll();
            
            resolve();
          } catch (error) {
            reject(error);
          }
        }, {
          crossOrigin: 'anonymous',
          onError: () => {
            reject(new Error(`Error al cargar imagen: ${original.url}`));
          }
        });
      });

    } catch (error) {
      console.error(`[resetActiveImage] Error processing object ${activeObject.id}:`, error);
      Swal.fire({
        text: `Error al restablecer el objeto con id ${activeObject.id || "n/a"}: ${error.message}`,
        icon: "error",
      });
    }
  }

  // Clear active selection once reset is complete
  canvas.discardActiveObject();
  canvas.renderAll();
}

/**
 * Restablece el grupo activo a su estado original
 * @param {fabric.Canvas} canvas - Instancia del canvas
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 * @param {Object} originalGroups - Objeto con los datos originales de los grupos
 */
export function resetActiveGroup(canvas, marginRect, originalGroups) {
  const activeObject = canvas.getActiveObject();
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
            }
            // Aplicar los filtros restaurados (o la ausencia de ellos)
            currentObj.applyFilters();
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

export async function resetActiveObject(canvas, marginRect, originalImages, originalGroups, rotateCheckbox) {
  const activeObject = canvas.getActiveObject();

  if (!activeObject) {
    showNoObjectSelectedWarning();
    return;
  }

  

  try {
    if (activeObject.type === 'group') {
      resetActiveGroup(canvas, marginRect, originalGroups);
    } else if (activeObject.type === 'image' || activeObject.type === 'activeSelection') {
      await resetActiveImage(canvas, marginRect, originalImages, originalGroups, rotateCheckbox);
    } else {
      Swal.fire({
        text: 'El objeto seleccionado no se puede restablecer.',
        icon: 'info',
      });
    }
  } catch (error) {
    console.error('[resetActiveObject] Error during reset operation:', error);
    Swal.fire({
      text: 'Error al restablecer el objeto. Inténtalo de nuevo.',
      icon: 'error',
    });
  }
}