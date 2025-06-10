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
    // Serializar todos los objetos seleccionados individualmente
    const serializedObjects = activeObjects.map(obj => obj.toObject(['id']));
    
    clipboardData = {
      type: activeObjects.length > 1 ? 'multiple' : 'single',
      objects: serializedObjects
    };

    // También intentar copiar al portapapeles del sistema si es posible
    await copyToSystemClipboard(canvas);

    console.log('Objetos copiados al portapapeles');
    
    // Mostrar notificación opcional
    if (typeof Swal !== 'undefined') {
      const message = activeObjects.length > 1 ? 
        `${activeObjects.length} imágenes copiadas` : 
        'Imagen copiada';
      
      Swal.fire({
        text: message,
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    }

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
    if (!clipboardData) {
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
    console.log('Objetos pegados desde el portapapeles');

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
 * Copia la selección actual al portapapeles del sistema como imagen
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 */
async function copyToSystemClipboard(canvas) {
  try {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    // Crear un canvas temporal para la selección
    let bounds;
    if (activeObjects.length === 1) {
      bounds = activeObjects[0].getBoundingRect();
    } else {
      // Calcular bounds que contengan todos los objetos
      bounds = activeObjects.reduce((acc, obj) => {
        const objBounds = obj.getBoundingRect();
        if (!acc) return objBounds;
        
        return {
          left: Math.min(acc.left, objBounds.left),
          top: Math.min(acc.top, objBounds.top),
          width: Math.max(acc.left + acc.width, objBounds.left + objBounds.width) - Math.min(acc.left, objBounds.left),
          height: Math.max(acc.top + acc.height, objBounds.top + objBounds.height) - Math.min(acc.top, objBounds.top)
        };
      }, null);
    }

    // Exportar como imagen
    const dataURL = canvas.toDataURL({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      format: 'png'
    });

    // Convertir a blob y copiar al portapapeles
    const canvas2 = document.createElement('canvas');
    const ctx = canvas2.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = async () => {
        canvas2.width = img.width;
        canvas2.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas2.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            resolve(true);
          } catch (error) {
            console.log('No se pudo copiar al portapapeles del sistema:', error);
            resolve(false);
          }
        }, 'image/png');
      };
      img.src = dataURL;
    });

  } catch (error) {
    console.log('Error al copiar al portapapeles del sistema:', error);
    return false;
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
  return new Promise((resolve, reject) => {
    try {
      // Usar enlivenObjects para todos los tipos de objetos
      fabric.util.enlivenObjects([objData], function(clonedObjects) {
        const clonedObj = clonedObjects[0];
        if (clonedObj) {
          // Generar nuevo ID para evitar duplicados
          const newId = (objData.id || 'unknown') + '_copy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          clonedObj.set({
            id: newId
          });
          resolve(clonedObj);
        } else {
          console.error('No se pudo crear el objeto desde los datos:', objData);
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error al crear objeto desde datos:', error);
      resolve(null);
    }
  });
}



/**
 * Configura los eventos de teclado para copiar y pegar
 * @param {fabric.Canvas} canvas - Instancia del canvas de fabric.js
 * @param {fabric.Rect} marginRect - Rectángulo de márgenes
 */
export function setupClipboardEvents(canvas, marginRect) {
  document.addEventListener('keydown', function(event) {
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
}

/**
 * Limpia el portapapeles interno
 */
export function clearClipboard() {
  clipboardData = null;
} 