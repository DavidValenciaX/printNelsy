/**
 * Utilidades para copiar y pegar imágenes en el canvas
 */
import { constrainObjectToMargin } from './constraintUtils.js';

let clipboardData = null;

/**
 * Copia el objeto activo o selección múltiple al portapapeles interno
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 */
export async function copySelection(canvas) {
  const activeObjects = canvas.getActiveObjects();
  
  if (activeObjects.length === 0) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        text: "Seleccione primero una o más imágenes para copiar.",
        icon: "warning"
      });
    }
    return;
  }

  try {
    // Serializar todos los objetos seleccionados con todas las propiedades necesarias
    const serializedObjects = [];
    
    for (const obj of activeObjects) {
      // Para imágenes, incluir todas las propiedades importantes
      if (obj.type === 'image') {
        const objectData = obj.toObject([
          'id', 'src', 'crossOrigin', 'filters', 'originalUrl',
          'opacity', 'visible', 'shadow', 'clipPath'
        ]);

        const transform = obj.calcTransformMatrix();
        const decomposed = fabric.util.qrDecompose(transform);

        objectData.left = decomposed.translateX;
        objectData.top = decomposed.translateY;
        objectData.angle = decomposed.angle;
        objectData.scaleX = decomposed.scaleX;
        objectData.scaleY = decomposed.scaleY;
        
        objectData.flipX = false;
        objectData.flipY = false;

        serializedObjects.push(objectData);
      } else {
        // Para otros tipos de objetos, usar serialización estándar
        const objectData = obj.toObject(['id']);
        serializedObjects.push(objectData);
      }
    }
    
    clipboardData = {
      type: activeObjects.length > 1 ? 'multiple' : 'single',
      objects: serializedObjects,
      timestamp: Date.now()
    };

    console.log('Objetos copiados al portapapeles interno:', clipboardData);
    console.log('Objetos individuales:', serializedObjects);
    
  } catch (error) {
    console.error('Error al copiar:', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        text: "Error al copiar la selección",
        icon: "error"
      });
    }
  }
}

/**
 * Pega los objetos del portapapeles interno al canvas
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes para constrainer
 */
export async function pasteSelection(canvas, marginRect) {
  try {
    // Primero intentar pegar desde el portapapeles del sistema
    const systemPaste = await pasteFromSystemClipboard(canvas, marginRect);
    if (systemPaste) {
      return;
    }

    // Si no hay nada en el portapapeles del sistema, usar el interno
    if (!clipboardData || !clipboardData.objects || clipboardData.objects.length === 0) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          text: "No hay nada en el portapapeles para pegar.",
          icon: "warning"
        });
      }
      return;
    }

    canvas.discardActiveObject();

    // Crear todos los objetos pegados
    const pastedObjects = [];
    
    for (const objData of clipboardData.objects) {
      const clonedObject = await createObjectFromData(objData);
      if (clonedObject) {
        // Offset para evitar solapamiento
        clonedObject.set({
          left: clonedObject.left + 20,
          top: clonedObject.top + 20
        });
        
        constrainObjectToMargin(clonedObject, marginRect);
        canvas.add(clonedObject);
        pastedObjects.push(clonedObject);
      }
    }
    
    // Seleccionar todos los objetos pegados
    if (pastedObjects.length > 1) {
      const selection = new fabric.ActiveSelection(pastedObjects, {
        canvas: canvas,
      });
      canvas.setActiveObject(selection);
    } else if (pastedObjects.length === 1) {
      canvas.setActiveObject(pastedObjects[0]);
    }

    canvas.renderAll();
    console.log(`${pastedObjects.length} objetos pegados desde el portapapeles interno`);

  } catch (error) {
    console.error('Error al pegar:', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        text: "Error al pegar desde el portapapeles",
        icon: "error"
      });
    }
  }
}

/**
 * Pega una imagen desde el portapapeles del sistema
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 */
async function pasteFromSystemClipboard(canvas, marginRect) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      return false;
    }

    const clipboardItems = await navigator.clipboard.read();

    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type.startsWith('image/')) {
          const blob = await clipboardItem.getType(type);
          const imageUrl = URL.createObjectURL(blob);

          fabric.Image.fromURL(imageUrl, function(img) {
            // Generar un ID único para la imagen pegada
            img.set({
              id: 'pasted_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              left: canvas.width / 2,
              top: canvas.height / 2,
              originX: 'center',
              originY: 'center'
            });

            // Escalar la imagen si es muy grande
            const maxWidth = canvas.width * 0.8;
            const maxHeight = canvas.height * 0.8;

            if (img.width > maxWidth || img.height > maxHeight) {
              const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
              img.scale(scale);
            }

            constrainObjectToMargin(img, marginRect);
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();

            // Limpiar URL temporal
            URL.revokeObjectURL(imageUrl);

            console.log('Imagen pegada desde el portapapeles del sistema');

            if (typeof Swal !== 'undefined') {
              Swal.fire({
                text: "Imagen pegada desde el portapapeles",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
              });
            }
          });

          return true;
        }
      }
    }

    return false;

  } catch (error) {
    console.log('No se pudo acceder al portapapeles del sistema:', error);
    return false;
  }
}

/**
 * Crea un objeto fabric.js desde datos serializados
 * @param {Object} objData - Datos del objeto serializado
 */
async function createObjectFromData(objData) {
  return new Promise((resolve) => {
    try {
      // Método mejorado para recrear objetos
      if (objData.type === 'image') {
        // Para imágenes, usar fromURL con la src original para mantener la integridad
        const imageUrl = objData.src || objData.originalUrl;
        if (!imageUrl) {
          console.error('No se encontró URL de imagen en los datos:', objData);
          resolve(null);
          return;
        }

        fabric.Image.fromURL(imageUrl, function(clonedObj) {
          if (clonedObj) {
            // Generar nuevo ID para evitar duplicados
            const newId = (objData.id || 'unknown') + '_copy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            
            // Aplicar solo las propiedades seguras y necesarias
            const safeProps = {
              id: newId,
              left: objData.left || 0,
              top: objData.top || 0,
              scaleX: objData.scaleX || 1,
              scaleY: objData.scaleY || 1,
              angle: objData.angle || 0,
              flipX: objData.flipX || false,
              flipY: objData.flipY || false,
              opacity: objData.opacity !== undefined ? objData.opacity : 1,
              visible: objData.visible !== undefined ? objData.visible : true
            };
            
            clonedObj.set(safeProps);
            
            // Mantener la URL original si existe
            if (objData.originalUrl) {
              clonedObj.originalUrl = objData.originalUrl;
            }
            
            // Aplicar filtros si existen
            if (objData.filters && Array.isArray(objData.filters)) {
              clonedObj.filters = objData.filters;
              clonedObj.applyFilters();
            }
            
            resolve(clonedObj);
          } else {
            console.error('No se pudo crear la imagen desde la URL:', imageUrl);
            resolve(null);
          }
        });
      } else {
        // Para otros tipos de objetos, usar enlivenObjects
        fabric.util.enlivenObjects([objData], function(clonedObjects) {
          const clonedObj = clonedObjects[0];
          if (clonedObj) {
            // Generar nuevo ID para evitar duplicados
            const newId = (objData.id || 'unknown') + '_copy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            clonedObj.set({ id: newId });
            resolve(clonedObj);
          } else {
            console.error('No se pudo crear el objeto desde los datos:', objData);
            resolve(null);
          }
        });
      }
    } catch (error) {
      console.error('Error al crear objeto desde datos:', error);
      resolve(null);
    }
  });
}

// Variable para evitar múltiples registros de eventos
let clipboardEventsInitialized = false;

/**
 * Configura los eventos de teclado para copiar y pegar
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 */
export function setupClipboardEvents(canvas, marginRect) {
  // Evitar múltiples registros de eventos
  if (clipboardEventsInitialized) {
    console.log('Clipboard events already initialized, skipping...');
    return;
  }

  document.addEventListener('keydown', function clipboardKeyHandler(event) {
    // Verificar que no estemos en un input o textarea
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.contentEditable === 'true'
    )) {
      return;
    }

    // Ctrl+C - Copiar
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      copySelection(canvas);
    }
    
    // Ctrl+V - Pegar
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      pasteSelection(canvas, marginRect);
    }
  });

  clipboardEventsInitialized = true;
  console.log('Clipboard events initialized');
}

/**
 * Limpia el portapapeles interno
 */
export function clearClipboard() {
  clipboardData = null;
}

/**
 * Obtiene información del portapapeles actual (para debugging)
 */
export function getClipboardInfo() {
  return clipboardData;
} 