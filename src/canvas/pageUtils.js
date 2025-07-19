import { fabric } from 'fabric';
import { resizeCanvas, getCurrentSize, getIsVertical } from './canvasResizeUtils.js';

// Estado global para manejar múltiples páginas
const PAGE_STATE = {
  pages: [], // Array de objetos { canvasElement, fabricCanvas, marginRect, marginWidth }
  currentPageIndex: 0,
  nextPageId: 1
};

/**
 * Crea una nueva página en el canvas
 * @param {fabric.Canvas} currentCanvas - Instancia del canvas actual (para referencia)
 */
export function createNewPage(currentCanvas) {
  console.log('Creando una nueva página...');
  
  try {
    // Obtener el contenedor de canvas
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      console.error('No se encontró el contenedor del canvas');
      return;
    }

    // Crear nuevo elemento canvas
    const newCanvasElement = document.createElement('canvas');
    const canvasId = `canvas-page-${PAGE_STATE.nextPageId}`;
    newCanvasElement.id = canvasId;
    
    // Añadir margen superior para separar las páginas
    newCanvasElement.style.marginTop = '20px';
    newCanvasElement.style.display = 'block';
    
    // Añadir el nuevo canvas al contenedor
    canvasContainer.appendChild(newCanvasElement);
    
    // Crear nueva instancia de Fabric.js para este canvas
    const newFabricCanvas = new fabric.Canvas(canvasId);
    
    // Configurar el nuevo canvas con las mismas dimensiones que el actual
    const currentSize = getCurrentSize();
    const currentOrientation = getIsVertical();
    
    // Aplicar redimensionamiento al nuevo canvas
    const result = resizeCanvas(currentSize, newFabricCanvas, null, currentOrientation);
    
    // Configurar propiedades del canvas
    setupCanvasProperties(newFabricCanvas);
    
    // Crear objeto de página
    const newPage = {
      canvasElement: newCanvasElement,
      fabricCanvas: newFabricCanvas,
      marginRect: result.marginRect,
      marginWidth: result.marginWidth,
      pageId: PAGE_STATE.nextPageId
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
  
  // Configurar controles de objeto
  fabric.Object.prototype.set({
    transparentCorners: false,
    cornerColor: '#007acc',
    cornerStyle: 'circle',
    cornerSize: 8,
    borderColor: '#007acc',
    borderScaleFactor: 1.5,
  });
}

/**
 * Hace scroll hacia una página específica
 * @param {Object} page - Objeto de página
 */
function scrollToPage(page) {
  if (page?.canvasElement) {
    page.canvasElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
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
    const mainPage = {
      canvasElement: mainCanvasElement,
      fabricCanvas: mainCanvas,
      marginRect: marginRect,
      marginWidth: marginWidth,
      pageId: 0
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
export function goToPreviousPage() {
  if (PAGE_STATE.currentPageIndex > 0) {
    PAGE_STATE.currentPageIndex--;
    scrollToCurrentPage();
    updatePageInfo();
    console.log(`Navegando a página anterior: ${PAGE_STATE.currentPageIndex + 1}`);
  }
}

/**
 * Navega a la página siguiente
 */
export function goToNextPage() {
  if (PAGE_STATE.currentPageIndex < PAGE_STATE.pages.length - 1) {
    PAGE_STATE.currentPageIndex++;
    scrollToCurrentPage();
    updatePageInfo();
    console.log(`Navegando a página siguiente: ${PAGE_STATE.currentPageIndex + 1}`);
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
export function deleteCurrentPage() {
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

