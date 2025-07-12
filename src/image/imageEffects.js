import { fabric } from 'fabric';
import { showNoObjectSelectedWarning } from "../utils/uiUtils.js";

// Constantes para el manejo de límites del canvas
const MAX_CANVAS_DIMENSION = 32767;     // Límite máximo de dimensión en píxeles
const MAX_CANVAS_AREA = 268435456;      // Límite máximo de área total (16384 x 16384)
const MAX_SAFE_TILE_SIZE = 4096;        // Tamaño máximo seguro por tile
const OPTIMAL_TILE_SIZE = 2048;         // Tamaño óptimo por tile

/**
 * Verifica si una imagen es demasiado grande para procesamiento directo con Canvas2D
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @returns {boolean} True si la imagen es demasiado grande
 */
function isImageTooLargeForCanvas2D(width, height) {
  const area = width * height;
  const exceedsArea = area > MAX_CANVAS_AREA;
  const exceedsDimension = width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION;
  
  if (exceedsArea || exceedsDimension) {
    console.warn(`Imagen demasiado grande para Canvas2D: ${width}x${height} (área: ${area})`);
    return true;
  }
  
  return false;
}

/**
 * Calcula el tamaño óptimo de tiles para una imagen
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @returns {Object} Objeto con tileWidth y tileHeight
 */
function calculateOptimalTileSize(width, height) {
  let tileWidth = Math.min(width, OPTIMAL_TILE_SIZE);
  let tileHeight = Math.min(height, OPTIMAL_TILE_SIZE);
  
  // Asegurar que el área del tile no exceda el límite
  while (tileWidth * tileHeight > MAX_CANVAS_AREA / 4) {
    tileWidth = Math.floor(tileWidth * 0.8);
    tileHeight = Math.floor(tileHeight * 0.8);
  }
  
  // Asegurar dimensiones mínimas
  tileWidth = Math.max(tileWidth, 256);
  tileHeight = Math.max(tileHeight, 256);
  
  console.info(`Tamaño óptimo de tile calculado: ${tileWidth}x${tileHeight}`);
  return { tileWidth, tileHeight };
}

/**
 * Procesa una imagen grande por secciones (tiles) para aplicar escala de grises
 * @param {fabric.Image} image - La imagen a procesar
 * @returns {Promise<string>} Promise que resuelve con el data URL de la imagen procesada
 */
function processImageByTiles(image) {
  return new Promise((resolve, reject) => {
    try {
      const originalElement = image.getElement();
      const scaledWidth = Math.round(Math.abs(image.width * image.scaleX));
      const scaledHeight = Math.round(Math.abs(image.height * image.scaleY));
      
      console.info(`Procesando imagen por tiles: ${scaledWidth}x${scaledHeight}`);
      
      // Calcular tamaño óptimo de tiles
      const { tileWidth, tileHeight } = calculateOptimalTileSize(scaledWidth, scaledHeight);
      
      // Crear canvas final para combinar todos los tiles
      const finalCanvas = document.createElement('canvas');
      const finalContext = finalCanvas.getContext('2d');
      finalCanvas.width = scaledWidth;
      finalCanvas.height = scaledHeight;
      
      // Calcular número de tiles necesarios
      const tilesX = Math.ceil(scaledWidth / tileWidth);
      const tilesY = Math.ceil(scaledHeight / tileHeight);
      const totalTiles = tilesX * tilesY;
      
      console.info(`Procesando ${totalTiles} tiles (${tilesX}x${tilesY})`);
      
      let processedTiles = 0;
      
      // Procesar cada tile
      for (let tileY = 0; tileY < tilesY; tileY++) {
        for (let tileX = 0; tileX < tilesX; tileX++) {
          // Calcular dimensiones del tile actual
          const startX = tileX * tileWidth;
          const startY = tileY * tileHeight;
          const actualTileWidth = Math.min(tileWidth, scaledWidth - startX);
          const actualTileHeight = Math.min(tileHeight, scaledHeight - startY);
          
          // Crear canvas para este tile
          const tileCanvas = document.createElement('canvas');
          const tileContext = tileCanvas.getContext('2d');
          tileCanvas.width = actualTileWidth;
          tileCanvas.height = actualTileHeight;
          
          // Dibujar la porción de la imagen correspondiente a este tile
          tileContext.drawImage(
            originalElement,
            (startX / scaledWidth) * image.width,     // sx
            (startY / scaledHeight) * image.height,   // sy
            (actualTileWidth / scaledWidth) * image.width,  // sWidth
            (actualTileHeight / scaledHeight) * image.height, // sHeight
            0, 0,                                     // dx, dy
            actualTileWidth, actualTileHeight         // dWidth, dHeight
          );
          
          // Procesar este tile aplicando escala de grises
          const imageData = tileContext.getImageData(0, 0, actualTileWidth, actualTileHeight);
          const data = imageData.data;
          
          // Aplicar conversión a escala de grises
          for (let i = 0; i < data.length; i += 4) {
            const grayValue = Math.round(
              data[i] * 0.299 +      // R
              data[i + 1] * 0.587 +  // G
              data[i + 2] * 0.114    // B
            );
            
            data[i] = grayValue;     // R
            data[i + 1] = grayValue; // G
            data[i + 2] = grayValue; // B
            // data[i + 3] permanece igual (alpha)
          }
          
          // Aplicar los datos procesados al tile
          tileContext.putImageData(imageData, 0, 0);
          
          // Copiar el tile procesado al canvas final
          finalContext.drawImage(tileCanvas, startX, startY);
          
          processedTiles++;
          console.info(`Tile procesado: ${processedTiles}/${totalTiles}`);
        }
      }
      
      console.info(`Procesamiento por tiles completado: ${processedTiles}/${totalTiles} tiles`);
      
      // Devolver el data URL del canvas final
      resolve(finalCanvas.toDataURL());
      
    } catch (error) {
      console.error('Error en procesamiento por tiles:', error);
      reject(error);
    }
  });
}

/**
 * Aplica filtro de escala de grises usando Canvas2D con procesamiento por tiles para imágenes grandes
 * @param {fabric.Image} image - La imagen a filtrar
 * @returns {Promise<void>} Promise que resuelve cuando el filtro se aplica
 */
function applyGrayscaleWithCanvas2D(image) {
  return new Promise((resolve, reject) => {
    try {
      // Calcular las dimensiones escaladas reales
      const scaledWidth = Math.round(Math.abs(image.width * image.scaleX));
      const scaledHeight = Math.round(Math.abs(image.height * image.scaleY));
      
      console.info(`Aplicando filtro Canvas2D: ${scaledWidth}x${scaledHeight}`);
      
      // Verificar si la imagen es demasiado grande para procesamiento directo
      if (isImageTooLargeForCanvas2D(scaledWidth, scaledHeight)) {
        console.info('Imagen demasiado grande, procesando por tiles...');
        
        // Procesar por tiles
        processImageByTiles(image)
          .then(dataUrl => {
            console.info('Imagen procesada por tiles, creando nueva imagen fabric...');
            
            // Crear nueva imagen fabric con el resultado
            fabric.Image.fromURL(dataUrl, function(newImg) {
              // Transferir propiedades importantes de la imagen original
              newImg.set({
                left: image.left,
                top: image.top,
                scaleX: 1,
                scaleY: 1,
                angle: image.angle,
                originX: image.originX,
                originY: image.originY,
                id: image.id,
                selectable: image.selectable,
                evented: image.evented
              });
              
              // Obtener referencia al canvas y reemplazar la imagen
              const canvas = image.canvas;
              if (canvas) {
                canvas.remove(image);
                canvas.add(newImg);
                canvas.setActiveObject(newImg);
                canvas.renderAll();
                console.info('Imagen reemplazada exitosamente');
              }
              
              resolve();
            });
          })
          .catch(error => {
            console.error('Error en procesamiento por tiles:', error);
            reject(error);
          });
        
        return;
      }
      
      // Procesamiento directo para imágenes más pequeñas
      console.info('Procesando imagen directamente...');
      
      // Crear un canvas temporal para el procesamiento
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      
      // Configurar el canvas temporal con el tamaño escalado
      tempCanvas.width = scaledWidth;
      tempCanvas.height = scaledHeight;
      
      // Dibujar la imagen original con el tamaño escalado
      const originalElement = image.getElement();
      tempContext.drawImage(originalElement, 0, 0, scaledWidth, scaledHeight);
      
      // Obtener los datos de la imagen
      const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      
      console.info(`Procesando ${data.length / 4} píxeles...`);
      
      // Aplicar conversión a escala de grises
      for (let i = 0; i < data.length; i += 4) {
        // Usar la fórmula estándar para escala de grises: 0.299*R + 0.587*G + 0.114*B
        const grayValue = Math.round(
          data[i] * 0.299 + 
          data[i + 1] * 0.587 + 
          data[i + 2] * 0.114
        );
        
        data[i] = grayValue;     // R
        data[i + 1] = grayValue; // G
        data[i + 2] = grayValue; // B
        // data[i + 3] permanece igual (alpha)
      }
      
      // Aplicar los datos modificados al canvas
      tempContext.putImageData(imageData, 0, 0);
      
      console.info('Conversión a escala de grises completada, creando nueva imagen fabric...');
      
      // Crear una nueva imagen fabric con el resultado
      fabric.Image.fromURL(tempCanvas.toDataURL(), function(newImg) {
        // Transferir propiedades importantes de la imagen original
        // Como ya escalamos la imagen en el canvas, establecemos scale en 1
        newImg.set({
          left: image.left,
          top: image.top,
          scaleX: 1,
          scaleY: 1,
          angle: image.angle,
          originX: image.originX,
          originY: image.originY,
          id: image.id,
          selectable: image.selectable,
          evented: image.evented
        });
        
        // Obtener referencia al canvas
        const canvas = image.canvas;
        if (canvas) {
          // Reemplazar la imagen original con la nueva
          canvas.remove(image);
          canvas.add(newImg);
          canvas.setActiveObject(newImg);
          canvas.renderAll();
          console.info('Imagen reemplazada exitosamente');
        }
        
        resolve();
      });
      
    } catch (error) {
      console.error('Error al aplicar filtro de escala de grises con Canvas2D:', error);
      reject(error);
    }
  });
}

/**
 * Convierte las imágenes seleccionadas a escala de grises
 * Usa Canvas2D como método principal para máxima confiabilidad
 * @param {fabric.Canvas} canvas - El canvas de fabric.js
 */
export function convertToGrayscale(canvas) {
  const activeObjects = canvas
    .getActiveObjects()
    .filter((obj) => obj.type === "image");
    
  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
    return;
  }
  
  console.info(`Iniciando conversión a escala de grises para ${activeObjects.length} imagen(es)`);
  
  let processedCount = 0;
  const totalImages = activeObjects.length;
  
  // Procesar cada imagen de forma secuencial para evitar problemas de memoria
  const processNextImage = (index) => {
    if (index >= totalImages) {
      console.info(`Conversión completada: ${processedCount}/${totalImages} imágenes procesadas`);
      return;
    }
    
    const obj = activeObjects[index];
    const scaledWidth = Math.round(Math.abs(obj.width * obj.scaleX));
    const scaledHeight = Math.round(Math.abs(obj.height * obj.scaleY));
    
    console.info(`Procesando imagen ${index + 1}/${totalImages}: ${scaledWidth}x${scaledHeight} píxeles`);
    
    applyGrayscaleWithCanvas2D(obj)
      .then(() => {
        processedCount++;
        console.info(`Imagen ${index + 1} procesada exitosamente`);
        // Procesar la siguiente imagen
        processNextImage(index + 1);
      })
      .catch(error => {
        console.error(`Error al procesar imagen ${index + 1}:`, error);
        // Continuar con la siguiente imagen aunque esta falle
        processNextImage(index + 1);
      });
  };
  
  // Iniciar el procesamiento
  processNextImage(0);
} 