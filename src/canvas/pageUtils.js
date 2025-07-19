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
 * Crea una nueva página en el canvas
 * @param {fabric.Canvas} currentCanvas - Instancia del canvas actual (para referencia)
 */
export function createNewPage(currentCanvas) {
  console.log('Creando una nueva página...');
  
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
    
    // Crear nuevo elemento canvas
    const newCanvasElement = document.createElement('canvas');
    const canvasId = `canvas-page-${PAGE_STATE.nextPageId}`;
    newCanvasElement.id = canvasId;
    
    // Añadir el canvas al contenedor individual
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
    
    console.log(`Nueva página creada con ID: ${canvasId}`, newPage);
    
    // Scroll hacia la nueva página
    scrollToPage(newPage);
    
    // Actualizar información de páginas en la UI
    updatePageInfo();
    
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
        
        // Hacer scroll suave dentro del contenedor con un pequeño margen
        pagesContainer.scrollTo({
          top: Math.max(0, scrollOffset - 20),
          behavior: 'smooth'
        });
      }
    } else {
      // Fallback al comportamiento anterior
      page.canvasElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
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
    console.log(`Página actual cambiada a índice: ${index}`);
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
    
    // Remover elemento DOM
    if (page?.canvasElement?.parentNode) {
      page.canvasElement.parentNode.removeChild(page.canvasElement);
    }
    
    // Remover de la lista
    PAGE_STATE.pages.splice(pageIndex, 1);
    
    // Ajustar índice actual si es necesario
    if (PAGE_STATE.currentPageIndex >= pageIndex && PAGE_STATE.currentPageIndex > 0) {
      PAGE_STATE.currentPageIndex--;
    }
    
    console.log(`Página eliminada en índice: ${pageIndex}`);
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
    
    console.log('Estado de páginas inicializado con canvas principal');
    updatePageInfo();
  }
}

/**
 * Navega a la página anterior
 */
export async function goToPreviousPage() {
  if (PAGE_STATE.currentPageIndex > 0) {
    console.log('⬅️ INICIANDO navegación a página anterior');
    PAGE_STATE.currentPageIndex--;
    updatePageInfo();
    
    console.log('🔄 PASO 1: Sincronizando estados...');
    // NUEVA FUNCIONALIDAD: Sincronizar estados y UI
    await syncGlobalStatesWithCurrentPage();
    
    console.log('🎨 PASO 2: Actualizando UI...');
    await updateUIButtonsForCurrentPage();
    
    // Mover el scroll al final para asegurar que se ejecuta después de los cambios de UI
    scrollToCurrentPage();
    
    console.log(`✅ COMPLETADA navegación a página: ${PAGE_STATE.currentPageIndex + 1}`);
  }
}

/**
 * Navega a la página siguiente
 */
export async function goToNextPage() {
  if (PAGE_STATE.currentPageIndex < PAGE_STATE.pages.length - 1) {
    console.log('➡️ INICIANDO navegación a página siguiente');
    PAGE_STATE.currentPageIndex++;
    updatePageInfo();
    
    console.log('🔄 PASO 1: Sincronizando estados...');
    // NUEVA FUNCIONALIDAD: Sincronizar estados y UI
    await syncGlobalStatesWithCurrentPage();
    
    console.log('🎨 PASO 2: Actualizando UI...');
    await updateUIButtonsForCurrentPage();

    // Mover el scroll al final para asegurar que se ejecuta después de los cambios de UI
    scrollToCurrentPage();
    
    console.log(`✅ COMPLETADA navegación a página: ${PAGE_STATE.currentPageIndex + 1}`);
  }
}

/**
 * Hace scroll hacia la página actual
 */
export function scrollToCurrentPage() {
  const currentPage = getCurrentPage();
  if (currentPage) {
    scrollToPage(currentPage);
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
  
  console.log(`Página eliminada. Nueva página actual: ${PAGE_STATE.currentPageIndex + 1}`);
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
    console.log('❌ No hay página actual o pageSettings');
    return;
  }

  const { pageSettings } = currentPage;
  console.log('🔄 Sincronizando estados para página:', pageSettings);
  
  try {
    // Sincronizar estados de canvas
    const { setCurrentSize, setIsVertical, getCurrentSize, getIsVertical, resizeCanvasOnly } = await import('./canvasResizeUtils.js');
    
    // Verificar si necesitamos redimensionar el canvas
    const currentSize = getCurrentSize();
    const currentOrientation = getIsVertical();
    const needsResize = currentSize !== pageSettings.paperSize || currentOrientation !== pageSettings.orientation;
    
    console.log('📏 Estados actuales del canvas:', { currentSize, currentOrientation });
    console.log('📏 Estados objetivo de la página:', { paperSize: pageSettings.paperSize, orientation: pageSettings.orientation });
    console.log('📏 ¿Necesita redimensionar?', needsResize);
    
    if (needsResize) {
      console.log('🔧 Redimensionando canvas para coincidir con la página...');
      
      // Obtener la aplicación para acceder al canvas y marginRect
      const { getAppInstance } = await import('../core/app.js');
      const app = getAppInstance();
      
      if (app?.modules?.canvas) {
        const canvas = app.modules.canvas.getCanvas();
        const currentMarginRect = app.modules.canvas.getMarginRect();
        
        // Usar resizeCanvasOnly para no reorganizar las imágenes
        const result = resizeCanvasOnly(pageSettings.paperSize, canvas, currentMarginRect, pageSettings.orientation);
        app.modules.canvas.updateMargins(result.marginRect, result.marginWidth);
        
        console.log('✅ Canvas redimensionado correctamente sin reorganizar imágenes');
      }
    } else {
      console.log('➡️ No se necesita redimensionar el canvas');
      setCurrentSize(pageSettings.paperSize);
      setIsVertical(pageSettings.orientation);
    }

    // Sincronizar estados de imagen
    const { imageState } = await import('../image/imageUploadUtils.js');
    console.log('🖼️ Estados de imagen antes:', {
      status: imageState.arrangementStatus,
      orientation: imageState.orientation,
      order: imageState.order,
      spacing: imageState.spacing
    });
    
    imageState.arrangementStatus = pageSettings.arrangement.status;
    imageState.orientation = pageSettings.arrangement.orientation;
    imageState.order = pageSettings.arrangement.order;
    imageState.spacing = pageSettings.arrangement.spacing;
    
    console.log('🖼️ Estados de imagen después:', {
      status: imageState.arrangementStatus,
      orientation: imageState.orientation,
      order: imageState.order,
      spacing: imageState.spacing
    });

    // Sincronizar dimensiones personalizadas del grid
    const { setCustomGridDimensions, getCustomGridDimensions } = await import('../layout/gridControls.js');
    
    console.log('🎯 Dimensiones personalizadas antes:', getCustomGridDimensions());
    console.log('🎯 Estableciendo dimensiones personalizadas:', pageSettings.arrangement.customRows, pageSettings.arrangement.customCols);
    
    setCustomGridDimensions(
      pageSettings.arrangement.customRows, 
      pageSettings.arrangement.customCols
    );
    
    console.log('🎯 Dimensiones personalizadas después:', getCustomGridDimensions());
    console.log('✅ Estados sincronizados correctamente para la página actual');
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
    console.log('❌ No hay página actual o pageSettings en updateUIButtonsForCurrentPage');
    return;
  }

  const { pageSettings } = currentPage;
  console.log('🎨 Actualizando UI para página con configuración:', pageSettings);

  try {
    const { getAppInstance } = await import('../core/app.js');
    const app = getAppInstance();
    if (!app) {
      console.warn('No se pudo obtener la instancia de la aplicación');
      return;
    }

    if (app.modules.events) {
      const eventManager = app.modules.events;
      
      console.log('🔘 Actualizando botones de UI básicos');
      eventManager.updateOrientationButtons(pageSettings.orientation);
      eventManager.updatePaperSizeButtons(pageSettings.paperSize);
      eventManager.updateLayoutOrientationButtons(pageSettings.arrangement.orientation);
      eventManager.updateOrderButtons(pageSettings.arrangement.order);
    }

    if (app.modules.dom) {
      try {
        const { updateArrangementButtons } = await import('../utils/arrangementButtons.js');
        console.log('🔘 Actualizando botones de arrangement para:', pageSettings.arrangement.status);
        updateArrangementButtons(pageSettings.arrangement.status, app.modules.dom);
      } catch (error) {
        console.warn('Error actualizando botones de arrangement:', error);
      }
    }

    if (app.modules.canvas && app.modules.dom) {
      try {
        const { toggleGridControlsVisibility, initializeGridControls, updateGridVisualization, getCustomGridDimensions } = await import('../layout/gridControls.js');
        const canvas = app.modules.canvas.getCanvas();
        const domManager = app.modules.dom;
        
        console.log('🎛️ Actualizando grid-controls');
        console.log('📊 Arrangement status:', pageSettings.arrangement.status);
        console.log('📏 Orientación del papel:', pageSettings.orientation);
        console.log('🎯 Dimensiones actuales antes de actualizar UI:', getCustomGridDimensions());
        
        if (pageSettings.arrangement.status === 'grid') {
          console.log('✅ Es arrangement grid, inicializando controles');
          initializeGridControls(canvas, domManager, pageSettings.orientation);
          console.log('🎨 Llamando updateGridVisualization con orientación:', pageSettings.orientation);
          updateGridVisualization(canvas, pageSettings.orientation);
        } else {
          console.log('⏸️ No es arrangement grid, solo actualizando visibilidad');
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
  
  console.log('Estado guardado en página actual:', currentPage.pageSettings);
}

