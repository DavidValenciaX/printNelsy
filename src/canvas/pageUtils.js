import { fabric } from 'fabric';
import { resizeCanvas, getCurrentSize, getIsVertical } from './canvasResizeUtils.js';
import Swal from 'sweetalert2';

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
    const canvasContainer = page.canvasElement?.closest('.page-container');
    if (canvasContainer) {
      const existingTitle = canvasContainer.querySelector('.page-title');
      if (existingTitle) {
        existingTitle.textContent = `Página ${index + 1}`;
        
        // Aplicar clase inactive a las páginas que no son la actual
        if (index === PAGE_STATE.currentPageIndex) {
          existingTitle.classList.remove('inactive');
        } else {
          existingTitle.classList.add('inactive');
        }
      }
    }
  });
}

/**
 * Crea los elementos DOM para una nueva página
 * @param {number} pageNumber - Número de la página
 * @returns {Object} Objeto con los elementos creados
 */
function createPageElements(pageNumber) {
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'page-container';

  const pageTitle = createPageTitle(pageNumber);
  const newCanvasElement = document.createElement('canvas');
  const canvasId = `canvas-page-${PAGE_STATE.nextPageId}`;
  newCanvasElement.id = canvasId;

  canvasContainer.appendChild(pageTitle);
  canvasContainer.appendChild(newCanvasElement);

  return { canvasContainer, newCanvasElement, canvasId };
}

/**
 * Crea el objeto de página con toda la configuración
 * @param {HTMLElement} newCanvasElement - Elemento canvas
 * @param {fabric.Canvas} newFabricCanvas - Instancia de Fabric.js
 * @param {Object} result - Resultado del redimensionamiento
 * @param {Object} currentSettings - Configuración actual
 * @returns {Object} Objeto de página
 */
function createPageObject(newCanvasElement, newFabricCanvas, result, currentSettings) {
  return {
    canvasElement: newCanvasElement,
    fabricCanvas: newFabricCanvas,
    marginRect: result.marginRect,
    marginWidth: result.marginWidth,
    pageId: PAGE_STATE.nextPageId,
    pageSettings: { ...currentSettings }
  };
}

/**
 * Maneja la sincronización y scroll después de crear una página
 * @param {number} pageIndex - Índice de la página
 */
async function handlePostPageCreation(pageIndex) {
  try {
    await syncGlobalStatesWithCurrentPage();
    await updateUIButtonsForCurrentPage();
    await new Promise(resolve => setTimeout(resolve, 150));

    const targetScrollTop = await calculateScrollPositionSafely(pageIndex);
    const pagesContainer = document.getElementById('pages-container');

    if (pagesContainer) {
      pagesContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  } catch (error) {
    console.warn('Error sincronizando estados en nueva página:', error);
  }
}

/**
 * Crea una nueva página en el canvas
 * @param {fabric.Canvas} currentCanvas - Instancia del canvas actual (para referencia)
 */
export function createNewPage(currentCanvas) {
  const pagesContainer = document.getElementById('pages-container');
  if (!pagesContainer) {
    console.error('No se encontró el contenedor de páginas');
    return;
  }

  try {
    const pageNumber = PAGE_STATE.pages.length + 1;
    const { canvasContainer, newCanvasElement, canvasId } = createPageElements(pageNumber);

    pagesContainer.appendChild(canvasContainer);

    const newFabricCanvas = new fabric.Canvas(canvasId);
    const currentSettings = getCurrentGlobalSettings();
    const result = resizeCanvas(currentSettings.paperSize, newFabricCanvas, null, currentSettings.orientation);

    setupCanvasProperties(newFabricCanvas);

    const newPage = createPageObject(newCanvasElement, newFabricCanvas, result, currentSettings);

    PAGE_STATE.pages.push(newPage);
    PAGE_STATE.nextPageId++;
    PAGE_STATE.currentPageIndex = PAGE_STATE.pages.length - 1;

    updatePageInfo();
    handlePostPageCreation(PAGE_STATE.currentPageIndex);

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
      const canvasContainer = page.canvasElement.closest('.page-container');
      
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
    updatePageInfo(); // Actualiza la información de página y los títulos
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
    const canvasContainer = page?.canvasElement?.closest('.page-container');
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
    // Buscar el contenedor de página que contiene el canvas
    const pageContainer = mainCanvasElement.closest('.page-container');
    if (pageContainer) {
      // Verificar si ya existe un título en este contenedor
      const existingTitle = pageContainer.querySelector('.page-title');
      if (!existingTitle) {
        const pageTitle = createPageTitle(1);
        // La primera página siempre es activa
        pageTitle.classList.remove('inactive');
        
        // Buscar el canvas-container que Fabric.js crea
        const canvasContainer = mainCanvasElement.closest('.canvas-container');
        // Insertar el título antes del canvas-container
        pageContainer.insertBefore(pageTitle, canvasContainer);
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
 * Asegura que el cálculo de scroll se realice con dimensiones actualizadas
 * @param {number} pageIndex - Índice de la página a calcular
 * @returns {Promise<number>} Promesa que resuelve con la posición de scroll calculada
 */
function calculateScrollPositionSafely(pageIndex) {
  const pagesContainer = document.getElementById('pages-container');
  if (!pagesContainer) return Promise.resolve(0);
  
  // Forzar actualización de layout antes del cálculo
  pagesContainer.getBoundingClientRect();
  
  // Pequeña pausa para permitir que el layout se estabilice
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { // Doble RAF para mayor estabilidad
        // Verificar si todos los contenedores tienen offsetTop válido
        const allContainers = pagesContainer.querySelectorAll('.page-container');
        
        for (let i = 0; i <= pageIndex && i < allContainers.length; i++) {
          if (allContainers[i].offsetTop <= 0 && i > 0) {
            console.warn(`⚠️ Contenedor ${i} no tiene offsetTop válido: ${allContainers[i].offsetTop}`);
            break;
          }
        }
        
        const scrollPosition = calculateScrollPositionForPage(pageIndex);
        resolve(scrollPosition);
      });
    });
  });
}

/**
 * Calcula la posición centrada para un contenedor
 * @param {number} containerTop - Posición superior del contenedor
 * @param {number} containerHeight - Altura del contenedor
 * @param {number} viewportHeight - Altura del viewport
 * @param {number} maxScroll - Scroll máximo permitido
 * @returns {number} Posición calculada
 */
function calculateCenteredPosition(containerTop, containerHeight, viewportHeight, maxScroll) {
  if (containerHeight <= viewportHeight) {
    const centeredPosition = containerTop - (viewportHeight - containerHeight) / 2;
    return Math.max(0, Math.min(centeredPosition, maxScroll));
  }
  return Math.max(0, Math.min(containerTop, maxScroll));
}

/**
 * Obtiene la altura de un contenedor, con fallback manual
 * @param {HTMLElement} container - Elemento contenedor
 * @returns {number} Altura calculada
 */
function getContainerHeight(container) {
  if (container.offsetHeight > 0) {
    return container.offsetHeight;
  }

  const title = container.querySelector('.page-title');
  const canvas = container.querySelector('canvas');
  const titleHeight = title ? title.offsetHeight : 30;
  const canvasHeight = canvas ? canvas.offsetHeight : 600;

  return titleHeight + canvasHeight;
}

/**
 * Calcula la posición usando offsetTop (método preferido)
 * @param {HTMLElement} targetContainer - Contenedor objetivo
 * @param {HTMLElement} pagesContainer - Contenedor de páginas
 * @returns {number|null} Posición calculada o null si no es válida
 */
function calculateUsingOffsetTop(targetContainer, pagesContainer) {
  if (targetContainer.offsetTop <= 0) return null;

  const containerTop = targetContainer.offsetTop;
  const containerHeight = targetContainer.offsetHeight;
  const viewportHeight = pagesContainer.clientHeight;
  const maxScroll = pagesContainer.scrollHeight - pagesContainer.clientHeight;

  return calculateCenteredPosition(containerTop, containerHeight, viewportHeight, maxScroll);
}

/**
 * Calcula la posición manualmente (método fallback)
 * @param {number} pageIndex - Índice de la página
 * @param {NodeList} allCanvasContainers - Todos los contenedores
 * @param {HTMLElement} targetContainer - Contenedor objetivo
 * @param {HTMLElement} pagesContainer - Contenedor de páginas
 * @returns {number} Posición calculada
 */
function calculateManually(pageIndex, allCanvasContainers, targetContainer, pagesContainer) {
  const containerStyle = getComputedStyle(pagesContainer);
  const gapValue = parseFloat(containerStyle.gap) || 20;
  const paddingTop = parseFloat(containerStyle.paddingTop) || 8;
  
  let position = paddingTop;

  for (let i = 0; i < pageIndex; i++) {
    const container = allCanvasContainers[i];
    if (container) {
      const containerHeight = getContainerHeight(container);
      position += containerHeight + gapValue;
    }
  }

  const containerHeight = getContainerHeight(targetContainer);
  const viewportHeight = pagesContainer.clientHeight;
  const maxScroll = pagesContainer.scrollHeight - pagesContainer.clientHeight;

  return calculateCenteredPosition(position, containerHeight, viewportHeight, maxScroll);
}

/**
 * Calcula la posición de scroll correcta para una página específica
 * @param {number} pageIndex - Índice de la página (0-based)
 * @returns {number} Posición de scroll calculada para centrar la página
 */
function calculateScrollPositionForPage(pageIndex) {
  const pagesContainer = document.getElementById('pages-container');
  if (!pagesContainer) return 0;

  const allCanvasContainers = pagesContainer.querySelectorAll('.page-container');
  if (pageIndex < 0 || pageIndex >= allCanvasContainers.length) {
    return 0;
  }

  const targetContainer = allCanvasContainers[pageIndex];
  if (!targetContainer) return 0;

  // Intentar método preferido usando offsetTop
  const offsetTopResult = calculateUsingOffsetTop(targetContainer, pagesContainer);
  if (offsetTopResult !== null) {
    return offsetTopResult;
  }

  // Fallback: cálculo manual
  return calculateManually(pageIndex, allCanvasContainers, targetContainer, pagesContainer);
}

/**
 * Navega a la página anterior
 */
export async function goToPreviousPage() {
  if (PAGE_STATE.currentPageIndex > 0) {
    const targetPageIndex = PAGE_STATE.currentPageIndex - 1;
    
    PAGE_STATE.currentPageIndex--;
    updatePageInfo();
    
    await syncGlobalStatesWithCurrentPage();
    await updateUIButtonsForCurrentPage();
    
    // Calcular scroll después de la sincronización para tener dimensiones correctas
    const targetScrollTop = await calculateScrollPositionSafely(targetPageIndex);
    
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
    
    PAGE_STATE.currentPageIndex++;
    updatePageInfo();
    
    await syncGlobalStatesWithCurrentPage();
    await updateUIButtonsForCurrentPage();

    // Calcular scroll después de la sincronización para tener dimensiones correctas
    const targetScrollTop = await calculateScrollPositionSafely(targetPageIndex);

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
export async function scrollToCurrentPage() {
  const currentPageIndex = getCurrentPageIndex();
  const targetScrollTop = await calculateScrollPositionSafely(currentPageIndex);
  
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
  
  // Actualizar los títulos de las páginas para reflejar la página activa
  updateAllPageTitles();
}

/**
 * Elimina la página actual
 */
export async function deleteCurrentPage() {
  if (PAGE_STATE.pages.length <= 1) {
    console.warn('No se puede eliminar la única página');
    return false;
  }
  
  // Mostrar alerta de confirmación antes de eliminar
  const result = await Swal.fire({
    title: "Confirmación",
    text: "¿Está seguro de eliminar la página actual?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  
  if (!result.isConfirmed) {
    return false;
  }
  
  const currentIndex = PAGE_STATE.currentPageIndex;
  deletePage(currentIndex);
  
  // Ajustar índice actual si es necesario
  if (PAGE_STATE.currentPageIndex >= PAGE_STATE.pages.length) {
    PAGE_STATE.currentPageIndex = PAGE_STATE.pages.length - 1;
  }
  
  updatePageInfo();
  
  // NUEVA FUNCIONALIDAD: Sincronizar estados y UI después de eliminar
  await syncGlobalStatesWithCurrentPage();
  updateUIButtonsForCurrentPage();
  
  await scrollToCurrentPage();
  
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
 * Maneja el redimensionamiento del canvas si es necesario
 * @param {Object} pageSettings - Configuración de la página
 * @param {Function} setCurrentSize - Función para establecer el tamaño
 * @param {Function} setIsVertical - Función para establecer la orientación
 */
async function handleCanvasResize(pageSettings, setCurrentSize, setIsVertical) {
  const { getCurrentSize, getIsVertical, resizeCanvasOnly } = await import('./canvasResizeUtils.js');

  const currentSize = getCurrentSize();
  const currentOrientation = getIsVertical();
  const needsResize = currentSize !== pageSettings.paperSize || currentOrientation !== pageSettings.orientation;

  if (needsResize) {
    const { getAppInstance } = await import('../core/app.js');
    const app = getAppInstance();

    if (app?.modules?.canvas) {
      const canvas = app.modules.canvas.getCanvas();
      const currentMarginRect = app.modules.canvas.getMarginRect();

      const result = resizeCanvasOnly(pageSettings.paperSize, canvas, currentMarginRect, pageSettings.orientation);
      app.modules.canvas.updateMargins(result.marginRect, result.marginWidth);
    }
  }

  setCurrentSize(pageSettings.paperSize);
  setIsVertical(pageSettings.orientation);
}

/**
 * Sincroniza los estados de imagen con la configuración de la página
 * @param {Object} pageSettings - Configuración de la página
 */
async function syncImageStates(pageSettings) {
  const { imageState } = await import('../image/imageUploadUtils.js');

  imageState.arrangementStatus = pageSettings.arrangement.status;
  imageState.orientation = pageSettings.arrangement.orientation;
  imageState.order = pageSettings.arrangement.order;
  imageState.spacing = pageSettings.arrangement.spacing;
}

/**
 * Sincroniza las dimensiones del grid personalizado
 * @param {Object} pageSettings - Configuración de la página
 */
async function syncGridDimensions(pageSettings) {
  const { setCustomGridDimensions } = await import('../layout/gridControls.js');

  const customRows = pageSettings.arrangement.customRows ?? null;
  const customCols = pageSettings.arrangement.customCols ?? null;

  setCustomGridDimensions(customRows, customCols);
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
    const { setCurrentSize, setIsVertical } = await import('./canvasResizeUtils.js');

    await handleCanvasResize(pageSettings, setCurrentSize, setIsVertical);
    await syncImageStates(pageSettings);
    await syncGridDimensions(pageSettings);

  } catch (error) {
    console.warn('❌ Error sincronizando estados globales:', error);
  }
}

/**
 * Actualiza los botones de eventos de la aplicación
 * @param {Object} eventManager - Gestor de eventos
 * @param {Object} pageSettings - Configuración de la página
 */
function updateEventButtons(eventManager, pageSettings) {
  eventManager.updateOrientationButtons(pageSettings.orientation);
  eventManager.updatePaperSizeButtons(pageSettings.paperSize);
  eventManager.updateLayoutOrientationButtons(pageSettings.arrangement.orientation);
  eventManager.updateOrderButtons(pageSettings.arrangement.order);
}

/**
 * Actualiza los botones de arrangement
 * @param {Object} domManager - Gestor del DOM
 * @param {Object} pageSettings - Configuración de la página
 */
async function updateArrangementUI(domManager, pageSettings) {
  try {
    const { updateArrangementButtons } = await import('../utils/arrangementButtons.js');
    updateArrangementButtons(pageSettings.arrangement.status, domManager);
  } catch (error) {
    console.warn('Error actualizando botones de arrangement:', error);
  }
}

/**
 * Actualiza los controles del grid
 * @param {Object} canvas - Canvas de Fabric.js
 * @param {Object} domManager - Gestor del DOM
 * @param {Object} pageSettings - Configuración de la página
 */
async function updateGridControls(canvas, domManager, pageSettings) {
  try {
    const { toggleGridControlsVisibility, initializeGridControls, updateGridVisualization } = await import('../layout/gridControls.js');

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
      updateEventButtons(app.modules.events, pageSettings);
    }

    if (app.modules.dom) {
      await updateArrangementUI(app.modules.dom, pageSettings);
    }

    if (app.modules.canvas && app.modules.dom) {
      const canvas = app.modules.canvas.getCanvas();
      await updateGridControls(canvas, app.modules.dom, pageSettings);
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

