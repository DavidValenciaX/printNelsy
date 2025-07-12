import { fabric } from 'fabric';
import Swal from 'sweetalert2';

/**
 * Utilidades para copiar y pegar imágenes en el canvas
 */
import { constrainObjectToMargin } from './../canvas/constraintUtils.js';

let clipboardData = null;
let lastSystemClipboardCheck = null;
let lastClipboardAccess = 0;
let lastInternalCopy = 0;

/**
 * Convierte un blob a base64
 * @param {Blob} blob - Blob a convertir
 * @returns {Promise<string>} URL data en formato base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
    
    const copyTimestamp = Date.now();
    lastInternalCopy = copyTimestamp;
    
    clipboardData = {
      type: activeObjects.length > 1 ? 'multiple' : 'single',
      objects: serializedObjects,
      timestamp: copyTimestamp,
      source: 'internal' // Marcar como copia interna
    };
    
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
    // Verificar si hay contenido en ambos portapapeles
    const hasInternalClipboard = clipboardData?.objects?.length > 0;
    const systemClipboardInfo = await checkSystemClipboardContent();
    
    // Determinar cuál usar basado en cronología y preferencias
    let useSystemClipboard = false;
    
    if (systemClipboardInfo.hasContent) {
      if (!hasInternalClipboard) {
        // Solo hay contenido en el sistema
        useSystemClipboard = true;
        console.log('Solo hay contenido en portapapeles del sistema');
      } else {
        // Hay contenido en ambos, comparar timestamps con lógica mejorada
        const internalTimestamp = clipboardData.timestamp;
        const systemTimestamp = systemClipboardInfo.estimatedTimestamp;
        const currentTime = Date.now();
        
        // Priorizar siempre el contenido interno si es reciente (menos de 10 segundos)
        const timeSinceInternalCopy = currentTime - internalTimestamp;
        
        if (timeSinceInternalCopy < 10000) {
          console.log('Priorizando copia interna reciente (menos de 10 segundos)');
          useSystemClipboard = false;
          // Solo usar sistema si es mucho más nuevo
        } else if (systemTimestamp > internalTimestamp + 2000) {
          useSystemClipboard = true;
          console.log('Contenido del sistema es mucho más reciente que copia interna antigua');
        } else {
          console.log('Manteniendo contenido interno por ser similar en tiempo');
        }
      }
    } else if (!hasInternalClipboard) {
      // No hay contenido en ninguno
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          text: "No hay nada en el portapapeles para pegar.",
          icon: "warning"
        });
      }
      return;
    }
    
    // Pegar según la decisión
    if (useSystemClipboard) {
      const systemPaste = await pasteFromSystemClipboard(canvas, marginRect);
      if (systemPaste) {
        return;
      }
      // Si falla el sistema pero hay interno, usar interno como fallback
      if (!hasInternalClipboard) {
        return;
      }
      console.log('Falló pegado del sistema, usando portapapeles interno como fallback');
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
 * Verifica el contenido del portapapeles del sistema y estima si es más reciente
 * @returns {Object} Información sobre el contenido del sistema
 */
async function checkSystemClipboardContent() {
  try {
    if (!navigator.clipboard?.read) {
      return { hasContent: false, estimatedTimestamp: 0 };
    }

    const clipboardItems = await navigator.clipboard.read();
    
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type.startsWith('image/')) {
          // Hay una imagen en el portapapeles del sistema
          const currentTime = Date.now();
          
          if (!lastSystemClipboardCheck) {
            // Primera vez que detectamos contenido, asumir que es reciente
            lastSystemClipboardCheck = {
              hasContent: true,
              timestamp: currentTime
            };
            return { hasContent: true, estimatedTimestamp: currentTime };
          }
          
          // Verificar si el contenido cambió o si ha pasado suficiente tiempo
          // para considerar que es una nueva acción de copiado
          try {
            const blob = await clipboardItem.getType(type);
            const contentHash = blob.size + '_' + blob.type + '_' + blob.lastModified;
            
            // Si el contenido es diferente, definitivamente es nuevo
            if (lastSystemClipboardCheck.contentHash !== contentHash) {
              lastSystemClipboardCheck = {
                hasContent: true,
                timestamp: currentTime,
                contentHash: contentHash
              };
              return { hasContent: true, estimatedTimestamp: currentTime };
            }
            
            // Si es el mismo contenido, verificar si ha pasado tiempo significativo
            // desde la última verificación o si detectamos un evento de copiado reciente
            const timeSinceLastCheck = currentTime - lastClipboardAccess;
            const timeSinceLastClipboard = currentTime - lastSystemClipboardCheck.timestamp;
            const timeSinceLastCopyEvent = currentTime - lastSystemCopyEvent;
            
            // Solo considerar como nueva acción de copiado si ha pasado mucho tiempo
            // y no hay copias internas recientes (ser muy conservador)
            const timeSinceInternalCopy = currentTime - lastInternalCopy;
            
            // Solo actualizar timestamp si no hay copias internas recientes (más de 5 segundos)
            // y ha pasado tiempo suficiente desde la última detección
            if (timeSinceInternalCopy > 5000 && timeSinceLastClipboard > 3000) {
              console.log('Detectando posible recopiado del mismo contenido (sin actividad interna reciente)');
              lastSystemClipboardCheck = {
                hasContent: true,
                timestamp: currentTime,
                contentHash: contentHash
              };
              return { hasContent: true, estimatedTimestamp: currentTime };
            }
            
            // Mismo contenido y poco tiempo, usar timestamp anterior
            return { 
              hasContent: true, 
              estimatedTimestamp: lastSystemClipboardCheck.timestamp 
            };
          } catch (error) {
            console.error('Error leyendo el contenido del portapapeles:', error);
            // Si no podemos leer el contenido, asumir que hay contenido reciente
            return { hasContent: true, estimatedTimestamp: currentTime };
          }
        }
      }
    }
    
    // No hay imágenes en el portapapeles del sistema
    lastSystemClipboardCheck = { hasContent: false, timestamp: Date.now() };
    return { hasContent: false, estimatedTimestamp: 0 };
    
  } catch (error) {
    console.log('No se pudo verificar el portapapeles del sistema:', error);
    return { hasContent: false, estimatedTimestamp: 0 };
  } finally {
    // Actualizar el timestamp de acceso
    lastClipboardAccess = Date.now();
  }
}

/**
 * Pega específicamente desde el portapapeles del sistema
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 */
export async function pasteFromSystemOnly(canvas, marginRect) {
  const result = await pasteFromSystemClipboard(canvas, marginRect);
  if (!result) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        text: "No hay imágenes en el portapapeles del sistema.",
        icon: "warning"
      });
    }
  }
  return result;
}

/**
 * Pega una imagen desde el portapapeles del sistema
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 */
async function pasteFromSystemClipboard(canvas, marginRect) {
  try {
    if (!navigator.clipboard?.read) {
      return false;
    }

    const clipboardItems = await navigator.clipboard.read();

    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type.startsWith('image/')) {
          const blob = await clipboardItem.getType(type);
          
          // Convertir blob a base64 para persistencia
          const base64Data = await blobToBase64(blob);
          
          fabric.Image.fromURL(base64Data, function(img) {
            // Generar un ID único para la imagen pegada
            img.set({
              id: 'pasted_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              left: canvas.width / 2,
              top: canvas.height / 2,
              originX: 'center',
              originY: 'center'
            });

            // Guardar la URL base64 como originalUrl para referencia futura
            img.originalUrl = base64Data;

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

            console.log('Imagen pegada desde el portapapeles del sistema');
            
            // Actualizar el timestamp del sistema cuando se pega exitosamente
            lastSystemClipboardCheck = {
              hasContent: true,
              timestamp: Date.now(),
              contentHash: blob.size + '_' + blob.type
            };
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
        // Para imágenes, priorizar originalUrl si existe, sino usar src
        let imageUrl = objData.originalUrl || objData.src;
        
        // Si la src es un blob revocado, usar solo originalUrl
        if (objData.src?.startsWith('blob:') && objData.originalUrl) {
          imageUrl = objData.originalUrl;
        }
        
        if (!imageUrl) {
          console.error('No se encontró URL de imagen válida en los datos:', objData);
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
let lastSystemCopyEvent = 0;

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

  // Nota: Removido el listener del evento 'copy' para evitar interferencias

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
    
    // Ctrl+V - Pegar (prioridad a portapapeles interno)
    if ((event.ctrlKey || event.metaKey) && event.key === 'v' && !event.shiftKey) {
      event.preventDefault();
      pasteSelection(canvas, marginRect);
    }
    
    // Ctrl+Shift+V - Pegar específicamente desde portapapeles del sistema
    if ((event.ctrlKey || event.metaKey) && event.key === 'V' && event.shiftKey) {
      event.preventDefault();
      pasteFromSystemOnly(canvas, marginRect);
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
  lastSystemClipboardCheck = null;
  lastClipboardAccess = 0;
  lastSystemCopyEvent = 0;
  lastInternalCopy = 0;
}

/**
 * Obtiene información del portapapeles actual (para debugging)
 */
export function getClipboardInfo() {
  return clipboardData;
} 