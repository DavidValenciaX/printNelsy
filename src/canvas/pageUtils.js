import { fabric } from 'fabric';
import { resizeCanvas, getCurrentSize, getIsVertical } from './canvasResizeUtils.js';

// Estado global para manejar múltiples páginas
const PAGE_STATE = {
  pages: [], // Array de objetos { canvasElement, fabricCanvas, marginRect, marginWidth, pageSettings }
  currentPageIndex: 0,
  nextPageId: 1
};

/**
 * Obtiene la configuración por defecto para una nueva página
 * @returns {Object} Configuración por defecto
 */
function getDefaultPageSettings() {
  return {
    orientation: true, // vertical
    paperSize: 'carta',
    arrangement: {
      status: 'none',
      orientation: 'rows',
      order: 'forward',
      spacing: 20,
      customRows: null,
      customCols: null
    }
  };
}

/**
 * Obtiene la configuración actual de los estados globales
 * @returns {Object} Configuración actual
 */
function getCurrentGlobalSettings() {
  const currentSize = getCurrentSize();
  const currentOrientation = getIsVertical();
  
  // Usar valores por defecto si no se puede acceder a imageState
  // (imageState se importará dinámicamente donde sea necesario)
  return {
    orientation: currentOrientation,
    paperSize: currentSize,
    arrangement: {
      status: 'none', // Se actualizará dinámicamente cuando sea necesario
      orientation: 'rows', 
      order: 'forward',
      spacing: 20
    }
  };
}

/**
 * Obtiene la configuración actual de los estados globales de forma asíncrona
 * @returns {Promise<Object>} Configuración actual
 */
async function getCurrentGlobalSettingsAsync() {
  const currentSize = getCurrentSize();
  const currentOrientation = getIsVertical();
  
  let arrangementSettings = {
    status: 'none',
    orientation: 'rows',
    order: 'forward', 
    spacing: 20,
    customRows: null,
    customCols: null
  };

  try {
    const { imageState } = await import('../image/imageUploadUtils.js');
    const { getCustomGridDimensions } = await import('../layout/gridControls.js');
    
    const customDimensions = getCustomGridDimensions();
    
    arrangementSettings = {
      status: imageState.arrangementStatus || 'none',
      orientation: imageState.orientation || 'rows',
      order: imageState.order || 'forward',
      spacing: imageState.spacing || 20,
      customRows: customDimensions.rows,
      customCols: customDimensions.cols
    };
  } catch (error) {
    console.warn('No se pudo obtener imageState:', error);
  }
  
  return {
    orientation: currentOrientation,
    paperSize: currentSize,
    arrangement: arrangementSettings
  };
}

/**
 * Crea un elemento de título para una página
 * @param {number} pageNumber - Número de la página
 * @returns {HTMLElement} Elemento del título
 */
function createPageTitle(pageNumber) {
  const titleElement = document.createElement('div');
  titleElement.className = 'page-title';
  titleElement.textContent = `Página ${pageNumber}`;
  return titleElement;
}

/**
 * Actualiza los títulos de todas las páginas
 */
function updateAllPageTitles() {
  PAGE_STATE.pages.forEach((page, index) => {
    const canvasContainer = page.canvasElement?.closest('.canvas-container');
    if (canvasContainer) {
      const existingTitle = canvasContainer.querySelector('.page-title');
      if (existingTitle) {
        existingTitle.textContent = `Página ${index + 1}`;
      }
    }
  });
}

/**
 * Crea una nueva página en el canvas
 * @param {fabric.Canvas} currentCanvas - Instancia del canvas actual (para referencia)
 */
export function createNewPage(currentCanvas) {
  
  
  try {
    // Obtener el contenedor padre de páginas
    const pagesContainer = document.getElementById('pages-container');
    if (!pagesContainer) {
      console.error('No se encontró el contenedor de páginas');
      return;
    }

    // Crear contenedor individual para el nuevo canvas
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    
    // Crear título de página
    const pageNumber = PAGE_STATE.pages.length + 1;
    const pageTitle = createPageTitle(pageNumber);
    
    // Crear nuevo elemento canvas
    const newCanvasElement = document.createElement('canvas');
    const canvasId = `canvas-page-${PAGE_STATE.nextPageId}`;
    newCanvasElement.id = canvasId;
    
    // Añadir el título y el canvas al contenedor individual
    canvasContainer.appendChild(pageTitle);
    canvasContainer.appendChild(newCanvasElement);
    
    // Añadir el contenedor individual al contenedor padre
    pagesContainer.appendChild(canvasContainer);
    
    // Crear nueva instancia de Fabric.js para este canvas
    const newFabricCanvas = new fabric.Canvas(canvasId);
    
    // Obtener configuración actual para heredar en la nueva página
    const currentSettings = getCurrentGlobalSettings();
    
    // Aplicar redimensionamiento al nuevo canvas usando la configuración actual
    const result = resizeCanvas(currentSettings.paperSize, newFabricCanvas, null, currentSettings.orientation);
    
    // Configurar propiedades del canvas
    setupCanvasProperties(newFabricCanvas);
    
    // Crear objeto de página con configuración
    const newPage = {
      canvasElement: newCanvasElement,
      fabricCanvas: newFabricCanvas,
      marginRect: result.marginRect,
      marginWidth: result.marginWidth,
      pageId: PAGE_STATE.nextPageId,
      pageSettings: { ...currentSettings } // Heredar configuración actual
    };
    
    // Añadir a la lista de páginas
    PAGE_STATE.pages.push(newPage);
    PAGE_STATE.nextPageId++;
    
    // Cambiar el índice actual a la nueva página
    PAGE_STATE.currentPageIndex = PAGE_STATE.pages.length - 1;
    

    
    // Actualizar información de páginas en la UI
    updatePageInfo();
    
    // Sincronizar estados y UI para la nueva página ANTES del scroll
    syncGlobalStatesWithCurrentPage()
      .then(() => updateUIButtonsForCurrentPage())
      .then(() => {
        // Hacer scroll después de que la sincronización esté completa
        setTimeout(() => {
          const pagesContainer = document.getElementById('pages-container');
          if (pagesContainer) {
            // Usar calculateScrollPositionForPage para evitar problemas con offsetTop
            const targetScrollTop = calculateScrollPositionForPage(PAGE_STATE.currentPageIndex);
            
            
            pagesContainer.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
            
          }
        }, 50);
      })
      .catch(error => console.warn('Error sincronizando estados en nueva página:', error));
    
    return newPage;
    
  } catch (error) {
    console.error('Error al crear nueva página:', error);
  }
}

/**
 * Configura las propiedades básicas del canvas
 * @param {fabric.Canvas} canvas - Instancia del canvas de Fabric.js
 */
function setupCanvasProperties(canvas) {
  // Configuraciones básicas del canvas
  canvas.selection = true;
  canvas.preserveObjectStacking = true;
  canvas.imageSmoothingEnabled = false;
}

/**
 * Hace scroll hacia una página específica
 * @param {Object} page - Objeto de página
 */
function scrollToPage(page) {
  if (page?.canvasElement) {
    const pagesContainer = document.getElementById('pages-container');
    
    if (pagesContainer) {
      // Obtener la posición relativa del canvas dentro del contenedor
      const canvasContainer = page.canvasElement.closest('.canvas-container');
      
      if (canvasContainer) {
        const scrollOffset = canvasContainer.offsetTop;
        const targetScrollTop = Math.max(0, scrollOffset - 20);
        
        // Hacer scroll suave dentro del contenedor con un pequeño margen
        pagesContainer.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        
      } else {
        console.warn('⚠️ SCROLL DEBUG: No se encontró canvasContainer');
      }
    } else {
      // Fallback al comportamiento anterior
      page.canvasElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  } else {
    console.warn('❌ SCROLL DEBUG: page o page.canvasElement no válido');
  }
}

/**
 * Obtiene todas las páginas creadas
 * @returns {Array} Array de objetos de página
 */
export function getAllPages() {
  return PAGE_STATE.pages;
}

/**
 * Obtiene el índice de la página actual
 * @returns {number} Índice de la página actual
 */
export function getCurrentPageIndex() {
  return PAGE_STATE.currentPageIndex;
}

/**
 * Obtiene la página actual
 * @returns {Object|null} Objeto de página actual o null
 */
export function getCurrentPage() {
  return PAGE_STATE.pages[PAGE_STATE.currentPageIndex] || null;
}

/**
 * Establece la página actual por índice
 * @param {number} index - Índice de la página
 */
export function setCurrentPage(index) {
  if (index >= 0 && index < PAGE_STATE.pages.length) {
    PAGE_STATE.currentPageIndex = index;

  }
}

/**
 * Elimina una página específica
 * @param {number} pageIndex - Índice de la página a eliminar
 */
export function deletePage(pageIndex) {
  if (pageIndex >= 0 && pageIndex < PAGE_STATE.pages.length) {
    const page = PAGE_STATE.pages[pageIndex];
    
    // Dispose del canvas de Fabric.js
    if (page.fabricCanvas) {
      page.fabricCanvas.dispose();
    }
    
    // Remover elemento DOM completo (contenedor que incluye título y canvas)
    const canvasContainer = page?.canvasElement?.closest('.canvas-container');
    if (canvasContainer?.parentNode) {
      canvasContainer.parentNode.removeChild(canvasContainer);
    }
    
    // Remover de la lista
    PAGE_STATE.pages.splice(pageIndex, 1);
    
    // Ajustar índice actual si es necesario
    if (PAGE_STATE.currentPageIndex >= pageIndex && PAGE_STATE.currentPageIndex > 0) {
      PAGE_STATE.currentPageIndex--;
    }
    
    // Actualizar títulos de todas las páginas después de eliminar
    updateAllPageTitles();
    

  }
}

/**
 * Inicializa el estado de páginas con el canvas principal
 * @param {fabric.Canvas} mainCanvas - Canvas principal
 * @param {Object} marginRect - Rectángulo de margen
 * @param {number} marginWidth - Ancho del margen
 */
export function initializePageState(mainCanvas, marginRect, marginWidth) {
  const mainCanvasElement = document.getElementById('canvas');
  
  if (mainCanvasElement && mainCanvas) {
    // El contenedor que encontramos es el de Fabric. Necesitamos su padre.
    const canvasContainer = mainCanvasElement.closest('.canvas-container');
    if (canvasContainer) {
      // El contenedor que encontramos es el de Fabric. Necesitamos su padre.
      const pageCanvasContainer = canvasContainer.parentElement;
      if (pageCanvasContainer) {
        const existingTitle = pageCanvasContainer.querySelector('.page-title');
        if (!existingTitle) {
          const pageTitle = createPageTitle(1);
          // Insertamos el título antes del contenedor de Fabric
          pageCanvasContainer.insertBefore(pageTitle, canvasContainer);
        }
      }
    }
    
    // Obtener configuración inicial (por defecto)
    const initialSettings = getDefaultPageSettings();
    
    const mainPage = {
      canvasElement: mainCanvasElement,
      fabricCanvas: mainCanvas,
      marginRect: marginRect,
      marginWidth: marginWidth,
      pageId: 0,
      pageSettings: { ...initialSettings }
    };
    
    PAGE_STATE.pages = [mainPage];
    PAGE_STATE.currentPageIndex = 0;
    

    updatePageInfo();
  }
}

/**
 * Calcula la posición de scroll correcta para una página específica
 * Método alternativo cuando offsetTop no funciona correctamente
 * @param {number} pageIndex - Índice de la página (0-based)
 * @returns {number} Posición de scroll calculada para centrar la página
 */
function calculateScrollPositionForPage(pageIndex) {
  const pagesContainer = document.getElementById('pages-container');
  if (!pagesContainer) return 0;
  
  const allCanvasContainers = pagesContainer.querySelectorAll('.canvas-container');
  if (pageIndex < 0 || pageIndex >= allCanvasContainers.length) {
    return 0;
  }
  
  // Obtener el estilo computado del contenedor para el gap y padding
  const containerStyle = getComputedStyle(pagesContainer);
  const gapValue = parseFloat(containerStyle.gap) || 20;
  const paddingTop = parseFloat(containerStyle.paddingTop) || 8;
  
  let position = paddingTop;
  // Sumar las alturas de todos los contenedores anteriores + el gap
  for (let i = 0; i < pageIndex; i++) {
    const container = allCanvasContainers[i];
    if (container) {
      position += container.offsetHeight + gapValue;
    }
  }
  
  // Obtener el contenedor de la página target para centrarlo
  const targetContainer = allCanvasContainers[pageIndex];
  if (targetContainer) {
    const containerHeight = targetContainer.offsetHeight;
    const viewportHeight = pagesContainer.clientHeight;
    
    // Calcular la posición para centrar la página en la vista
    const centeredPosition = position + (containerHeight / 2) - (viewportHeight / 2);
    
    // Asegurarse de que no vaya más allá de los límites válidos
    const maxScroll = pagesContainer.scrollHeight - pagesContainer.clientHeight;
    const finalPosition = Math.max(0, Math.min(centeredPosition, maxScroll));
    

    
    return finalPosition;
  }
  
  // Fallback al método anterior si no se puede obtener el contenedor
  return Math.max(0, position - 10);
}

/**
 * Navega a la página anterior
 */
export async function goToPreviousPage() {
  if (PAGE_STATE.currentPageIndex > 0) {

    
    const targetPageIndex = PAGE_STATE.currentPageIndex - 1;
    
    // Calcular la posición de scroll ANTES de cualquier cambio de estado
    const targetScrollTop = calculateScrollPositionForPage(targetPageIndex);
    
    PAGE_STATE.currentPageIndex--;
    updatePageInfo();
    
    await syncGlobalStatesWithCurrentPage();
    
    await updateUIButtonsForCurrentPage();
    
    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) {
      pagesContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }
}

/**
 * Navega a la página siguiente
 */
export async function goToNextPage() {
  if (PAGE_STATE.currentPageIndex < PAGE_STATE.pages.length - 1) {
    const targetPageIndex = PAGE_STATE.currentPageIndex + 1;
    
    // Calcular la posición de scroll ANTES de cualquier cambio de estado
    const targetScrollTop = calculateScrollPositionForPage(targetPageIndex);
    
    PAGE_STATE.currentPageIndex++;
    updatePageInfo();
    
    await syncGlobalStatesWithCurrentPage();
    
    await updateUIButtonsForCurrentPage();

    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) {
      pagesContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }
}

/**
 * Hace scroll hacia la página actual
 */
export function scrollToCurrentPage() {
  const currentPageIndex = getCurrentPageIndex();
  const targetScrollTop = calculateScrollPositionForPage(currentPageIndex);
  
  const pagesContainer = document.getElementById('pages-container');
  if (pagesContainer) {
    pagesContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }
}

/**
 * Actualiza la información de página en la UI
 */
export function updatePageInfo() {
  const pageInfoElement = document.getElementById('pageInfo');
  const prevButton = document.getElementById('prevPageButton');
  const nextButton = document.getElementById('nextPageButton');
  const deleteButton = document.getElementById('deletePageButton');
  
  if (pageInfoElement) {
    const currentPageNum = PAGE_STATE.currentPageIndex + 1;
    const totalPages = PAGE_STATE.pages.length;
    pageInfoElement.textContent = `Página ${currentPageNum} de ${totalPages}`;
  }
  
  // Actualizar estado de botones de navegación
  if (prevButton) {
    prevButton.disabled = PAGE_STATE.currentPageIndex === 0;
  }
  
  if (nextButton) {
    nextButton.disabled = PAGE_STATE.currentPageIndex === PAGE_STATE.pages.length - 1;
  }
  
  // El botón eliminar solo está disponible si hay más de una página
  if (deleteButton) {
    deleteButton.disabled = PAGE_STATE.pages.length <= 1;
  }
}

/**
 * Elimina la página actual
 */
export async function deleteCurrentPage() {
  if (PAGE_STATE.pages.length <= 1) {
    console.warn('No se puede eliminar la única página');
    return false;
  }
  
  const currentIndex = PAGE_STATE.currentPageIndex;
  deletePage(currentIndex);
  
  // Ajustar índice actual si es necesario
  if (PAGE_STATE.currentPageIndex >= PAGE_STATE.pages.length) {
    PAGE_STATE.currentPageIndex = PAGE_STATE.pages.length - 1;
  }
  
  scrollToCurrentPage();
  updatePageInfo();
  
  // NUEVA FUNCIONALIDAD: Sincronizar estados y UI después de eliminar
  await syncGlobalStatesWithCurrentPage();
  updateUIButtonsForCurrentPage();
  
  return true;
}

/**
 * Obtiene el número total de páginas
 * @returns {number} Número total de páginas
 */
export function getTotalPages() {
  return PAGE_STATE.pages.length;
}

/**
 * Verifica si una página es la primera
 * @returns {boolean} True si es la primera página
 */
export function isFirstPage() {
  return PAGE_STATE.currentPageIndex === 0;
}

/**
 * Verifica si una página es la última
 * @returns {boolean} True si es la última página
 */
export function isLastPage() {
  return PAGE_STATE.currentPageIndex === PAGE_STATE.pages.length - 1;
}

/**
 * Sincroniza los estados globales con la configuración de la página actual
 * @returns {Promise<void>} Promesa que se resuelve cuando la sincronización está completa
 */
export async function syncGlobalStatesWithCurrentPage() {
  const currentPage = getCurrentPage();
  if (!currentPage?.pageSettings) {
    return;
  }

  const { pageSettings } = currentPage;

  
  try {
    // Sincronizar estados de canvas
    const { setCurrentSize, setIsVertical, getCurrentSize, getIsVertical, resizeCanvasOnly } = await import('./canvasResizeUtils.js');
    
    // Verificar si necesitamos redimensionar el canvas
    const currentSize = getCurrentSize();
    const currentOrientation = getIsVertical();
    const needsResize = currentSize !== pageSettings.paperSize || currentOrientation !== pageSettings.orientation;
    
    
    if (needsResize) {

      
      // Obtener la aplicación para acceder al canvas y marginRect
      const { getAppInstance } = await import('../core/app.js');
      const app = getAppInstance();
      
      if (app?.modules?.canvas) {
        const canvas = app.modules.canvas.getCanvas();
        const currentMarginRect = app.modules.canvas.getMarginRect();
        
        // Usar resizeCanvasOnly para no reorganizar las imágenes
        const result = resizeCanvasOnly(pageSettings.paperSize, canvas, currentMarginRect, pageSettings.orientation);
        app.modules.canvas.updateMargins(result.marginRect, result.marginWidth);
        
        // IMPORTANTE: Actualizar las variables globales DESPUÉS del redimensionamiento
        setCurrentSize(pageSettings.paperSize);
        setIsVertical(pageSettings.orientation);
        

      }
    } else {

      // Asegurar que las variables globales estén sincronizadas
      setCurrentSize(pageSettings.paperSize);
      setIsVertical(pageSettings.orientation);
    }

    // Sincronizar estados de imagen
    const { imageState } = await import('../image/imageUploadUtils.js');

    
    imageState.arrangementStatus = pageSettings.arrangement.status;
    imageState.orientation = pageSettings.arrangement.orientation;
    imageState.order = pageSettings.arrangement.order;
    imageState.spacing = pageSettings.arrangement.spacing;
    


    // Sincronizar dimensiones personalizadas del grid
    const { setCustomGridDimensions } = await import('../layout/gridControls.js');
    

    
    // Asegurar que las dimensiones sean null en lugar de undefined
    const customRows = pageSettings.arrangement.customRows ?? null;
    const customCols = pageSettings.arrangement.customCols ?? null;
    
    setCustomGridDimensions(customRows, customCols);
    

  } catch (error) {
    console.warn('❌ Error sincronizando estados globales:', error);
  }
}

/**
 * Actualiza todos los botones de la UI según la página actual
 */
export async function updateUIButtonsForCurrentPage() {
  const currentPage = getCurrentPage();
  if (!currentPage?.pageSettings) {

    return;
  }

  const { pageSettings } = currentPage;


  try {
    const { getAppInstance } = await import('../core/app.js');
    const app = getAppInstance();
    if (!app) {
      console.warn('No se pudo obtener la instancia de la aplicación');
      return;
    }

    if (app.modules.events) {
      const eventManager = app.modules.events;
      

      eventManager.updateOrientationButtons(pageSettings.orientation);
      eventManager.updatePaperSizeButtons(pageSettings.paperSize);
      eventManager.updateLayoutOrientationButtons(pageSettings.arrangement.orientation);
      eventManager.updateOrderButtons(pageSettings.arrangement.order);
    }

    if (app.modules.dom) {
      try {
        const { updateArrangementButtons } = await import('../utils/arrangementButtons.js');

        updateArrangementButtons(pageSettings.arrangement.status, app.modules.dom);
      } catch (error) {
        console.warn('Error actualizando botones de arrangement:', error);
      }
    }

    if (app.modules.canvas && app.modules.dom) {
      try {
        const { toggleGridControlsVisibility, initializeGridControls, updateGridVisualization } = await import('../layout/gridControls.js');
        const canvas = app.modules.canvas.getCanvas();
        const domManager = app.modules.dom;
        

        
        if (pageSettings.arrangement.status === 'grid') {
          initializeGridControls(canvas, domManager, pageSettings.orientation);
          updateGridVisualization(canvas, pageSettings.orientation);
        } else {
          toggleGridControlsVisibility(canvas, domManager, pageSettings.orientation);
        }
      } catch (error) {
        console.warn('Error actualizando grid-controls:', error);
      }
    }
  } catch (error) {
    console.warn('Error obteniendo instancia de la aplicación:', error);
  }
}

/**
 * Guarda el estado actual en la página actual
 */
export async function saveCurrentStateToPage() {
  const currentPage = getCurrentPage();
  if (!currentPage) return;

  // Obtener estados actuales y guardarlos en la página
  const currentSettings = await getCurrentGlobalSettingsAsync();
  currentPage.pageSettings = { ...currentSettings };
  

}

// Función de depuración de scroll removida para limpiar logs

