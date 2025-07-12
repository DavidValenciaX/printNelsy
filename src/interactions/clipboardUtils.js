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
 * Determina qué portapapeles usar basado en contenido y timestamps
 * @param {Object|null} clipboardData - Datos del portapapeles interno
 * @param {Object} systemClipboardInfo - Información del portapapeles del sistema
 * @returns {string} 'system', 'internal', o 'none'
 */
function determineClipboardSource(clipboardData, systemClipboardInfo) {
  const hasInternalClipboard = clipboardData?.objects?.length > 0;
  const hasSystemClipboard = systemClipboardInfo.hasContent;
  
  if (!hasSystemClipboard && !hasInternalClipboard) {
    return 'none';
  }
  
  if (hasSystemClipboard && !hasInternalClipboard) {
    return 'system';
  }
  
  if (!hasSystemClipboard && hasInternalClipboard) {
    return 'internal';
  }
  
  // Ambos tienen contenido, decidir por timestamp
  const internalTimestamp = clipboardData.timestamp;
  const systemTimestamp = systemClipboardInfo.estimatedTimestamp;
  const timeSinceInternalCopy = Date.now() - internalTimestamp;
  
  // Usar sistema solo si es mucho más nuevo que copia interna "antigua"
  if (timeSinceInternalCopy >= 10000 && systemTimestamp > internalTimestamp + 2000) {
    return 'system';
  }
  
  return 'internal';
}

/**
 * Crea y posiciona objetos pegados en el canvas
 * @param {fabric.Canvas} canvas - Instancia del canvas
 * @param {Array} objectsData - Datos de los objetos a crear
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 * @returns {Promise<Array>} Array de objetos creados
 */
async function createAndPositionObjects(canvas, objectsData, marginRect) {
  const pastedObjects = [];
  
  for (const objData of objectsData) {
    const clonedObject = await createObjectFromData(objData);
    if (clonedObject) {
      clonedObject.set({
        left: clonedObject.left + 20,
        top: clonedObject.top + 20
      });
      
      constrainObjectToMargin(clonedObject, marginRect);
      canvas.add(clonedObject);
      pastedObjects.push(clonedObject);
    }
  }
  
  return pastedObjects;
}

/**
 * Selecciona los objetos pegados en el canvas
 * @param {fabric.Canvas} canvas - Instancia del canvas
 * @param {Array} pastedObjects - Objetos a seleccionar
 */
function selectPastedObjects(canvas, pastedObjects) {
  if (pastedObjects.length > 1) {
    const selection = new fabric.ActiveSelection(pastedObjects, {
      canvas: canvas,
    });
    canvas.setActiveObject(selection);
  } else if (pastedObjects.length === 1) {
    canvas.setActiveObject(pastedObjects[0]);
  }
}

/**
 * Pega los objetos del portapapeles interno al canvas
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes para constrainer
 */
export async function pasteSelection(canvas, marginRect) {
  try {
    const systemClipboardInfo = await checkSystemClipboardContent();
    const clipboardSource = determineClipboardSource(clipboardData, systemClipboardInfo);
    
    if (clipboardSource === 'none') {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          text: "No hay nada en el portapapeles para pegar.",
          icon: "warning"
        });
      }
      return;
    }
    
    // Intentar pegar desde sistema si es la fuente elegida
    if (clipboardSource === 'system') {
      const systemPaste = await pasteFromSystemClipboard(canvas, marginRect);
      if (systemPaste) {
        return;
      }
      
      // Si falla el sistema pero hay interno, usar interno como fallback
      if (!clipboardData?.objects?.length) {
        return;
      }
      console.log('Falló pegado del sistema, usando portapapeles interno como fallback');
    }

    // Pegar desde portapapeles interno
    canvas.discardActiveObject();
    const pastedObjects = await createAndPositionObjects(canvas, clipboardData.objects, marginRect);
    selectPastedObjects(canvas, pastedObjects);
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

// Constants for clipboard timeouts
const CLIPBOARD_TIMEOUTS = {
  INTERNAL_COPY_THRESHOLD: 5000,
  CLIPBOARD_RECHECK_THRESHOLD: 3000
};

/**
 * Creates a standardized clipboard result object
 * @param {boolean} hasContent - Whether clipboard has content
 * @param {number} timestamp - Timestamp of the content
 * @returns {Object} Clipboard result object
 */
function createClipboardResult(hasContent, timestamp = 0) {
  return { hasContent, estimatedTimestamp: timestamp };
}

/**
 * Searches for image content in system clipboard
 * @returns {Promise<Object>} Object with found status and clipboard item info
 */
async function findImageInClipboard() {
  const clipboardItems = await navigator.clipboard.read();
  
  for (const clipboardItem of clipboardItems) {
    for (const type of clipboardItem.types) {
      if (type.startsWith('image/')) {
        return { found: true, item: clipboardItem, type };
      }
    }
  }
  
  return { found: false };
}

/**
 * Handles first-time clipboard content detection
 * @param {number} currentTime - Current timestamp
 * @returns {Object} Clipboard result for first-time detection
 */
function handleFirstTimeDetection(currentTime) {
  lastSystemClipboardCheck = {
    hasContent: true,
    timestamp: currentTime
  };
  return createClipboardResult(true, currentTime);
}

/**
 * Generates a content hash for clipboard content
 * @param {Blob} blob - Blob content from clipboard
 * @returns {string} Content hash
 */
function generateContentHash(blob) {
  return `${blob.size}_${blob.type}_${blob.lastModified}`;
}

/**
 * Determines if timestamp should be updated based on time thresholds
 * @param {number} timeSinceLastClipboard - Time since last clipboard check
 * @param {number} timeSinceInternalCopy - Time since last internal copy
 * @returns {boolean} Whether to update timestamp
 */
function shouldUpdateTimestamp(timeSinceLastClipboard, timeSinceInternalCopy) {
  return timeSinceInternalCopy > CLIPBOARD_TIMEOUTS.INTERNAL_COPY_THRESHOLD && 
         timeSinceLastClipboard > CLIPBOARD_TIMEOUTS.CLIPBOARD_RECHECK_THRESHOLD;
}

/**
 * Processes clipboard content and determines if it's new
 * @param {ClipboardItem} clipboardItem - Clipboard item to process
 * @param {string} type - MIME type of the content
 * @param {number} currentTime - Current timestamp
 * @returns {Promise<Object>} Clipboard result after processing
 */
async function processClipboardContent(clipboardItem, type, currentTime) {
  try {
    const blob = await clipboardItem.getType(type);
    const contentHash = generateContentHash(blob);
    
    // Check if content changed
    if (lastSystemClipboardCheck.contentHash !== contentHash) {
      lastSystemClipboardCheck = {
        hasContent: true,
        timestamp: currentTime,
        contentHash: contentHash
      };
      return createClipboardResult(true, currentTime);
    }
    
    // Check if enough time has passed to consider it new
    const timeSinceLastClipboard = currentTime - lastSystemClipboardCheck.timestamp;
    const timeSinceInternalCopy = currentTime - lastInternalCopy;
    
    if (shouldUpdateTimestamp(timeSinceLastClipboard, timeSinceInternalCopy)) {
      console.log('Detectando posible recopiado del mismo contenido (sin actividad interna reciente)');
      lastSystemClipboardCheck = {
        hasContent: true,
        timestamp: currentTime,
        contentHash: contentHash
      };
      return createClipboardResult(true, currentTime);
    }
    
    return createClipboardResult(true, lastSystemClipboardCheck.timestamp);
    
  } catch (error) {
    console.error('Error leyendo el contenido del portapapeles:', error);
    return createClipboardResult(true, currentTime);
  }
}

/**
 * Verifica el contenido del portapapeles del sistema y estima si es más reciente
 * @returns {Promise<Object>} Información sobre el contenido del sistema
 */
async function checkSystemClipboardContent() {
  try {
    if (!navigator.clipboard?.read) {
      return createClipboardResult(false);
    }

    const imageSearch = await findImageInClipboard();
    
    if (!imageSearch.found) {
      lastSystemClipboardCheck = { hasContent: false, timestamp: Date.now() };
      return createClipboardResult(false);
    }

    const currentTime = Date.now();
    
    if (!lastSystemClipboardCheck) {
      return handleFirstTimeDetection(currentTime);
    }
    
    return await processClipboardContent(imageSearch.item, imageSearch.type, currentTime);
    
  } catch (error) {
    console.log('No se pudo verificar el portapapeles del sistema:', error);
    return createClipboardResult(false);
  } finally {
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
              id: 'pasted_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
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
            const newId = (objData.id || 'unknown') + '_copy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
            
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
            const newId = (objData.id || 'unknown') + '_copy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
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