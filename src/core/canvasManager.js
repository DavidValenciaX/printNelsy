import { fabric } from 'fabric';
import { 
  resizeCanvas, 
  changeOrientation,
  dpi, 
  getCurrentSize, 
  getIsVertical,
  paperSizes
} from '../canvas/canvasResizeUtils.js';
import { setupMovingEvents } from '../events/movingEvents.js';
import { setupScalingEvents } from '../events/scalingEvents.js';
import { setupRotatingEvents } from '../events/rotatingEvents.js';
import { setupSkewingEvents } from '../events/skewingEvents.js';
import { initializePageState, getCurrentPage, getAllPages } from '../canvas/pageUtils.js';
import { configureCanvas } from './fabricConfig.js';

/**
 * Gestiona el canvas y sus configuraciones
 */
export class CanvasManager {
  constructor(canvasElement) {
    this.canvas = new fabric.Canvas("canvas");
    this.marginRect = null;
    this.marginWidth = null;
    
    this.initializeCanvas();
    this.setupCanvasProperties();
    this.initializePageSystem();
  }

  initializeCanvas() {
    // Inicializar canvas con tamaño carta por defecto
    const initialResult = resizeCanvas("carta", this.canvas, this.marginRect);
    this.marginRect = initialResult.marginRect;
    this.marginWidth = initialResult.marginWidth;
  }

  setupCanvasProperties() {
    // Aplicar configuración específica del canvas
    configureCanvas(this.canvas);
  }

  initializePageSystem() {
    // Inicializar el sistema de páginas con el canvas principal
    initializePageState(this.canvas, this.marginRect, this.marginWidth);
  }

  setupCanvasEvents(updateArrangement, onArrangeUpdate) {
    setupMovingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
    setupScalingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
    setupRotatingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
    setupSkewingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
  }

  getCanvas() {
    // Devolver el canvas de la página actual
    const currentPage = getCurrentPage();
    return currentPage ? currentPage.fabricCanvas : this.canvas;
  }

  getMarginRect() {
    // Devolver el marginRect de la página actual
    const currentPage = getCurrentPage();
    return currentPage ? currentPage.marginRect : this.marginRect;
  }

  getMarginWidth() {
    // Devolver el marginWidth de la página actual
    const currentPage = getCurrentPage();
    return currentPage ? currentPage.marginWidth : this.marginWidth;
  }

  updateMargins(marginRect, marginWidth) {
    // Actualizar márgenes en la página actual
    const currentPage = getCurrentPage();
    if (currentPage) {
      currentPage.marginRect = marginRect;
      currentPage.marginWidth = marginWidth;
    }
    
    // También actualizar las referencias locales (para compatibilidad)
    this.marginRect = marginRect;
    this.marginWidth = marginWidth;
  }

  getPaperConfig() {
    return {
      currentSize: getCurrentSize(),
      isVertical: getIsVertical(),
      dpi: dpi,
      paperSizes: paperSizes
    };
  }

  resizeCanvas(size) {
    const currentCanvas = this.getCanvas();
    const currentMarginRect = this.getMarginRect();
    const result = resizeCanvas(size, currentCanvas, currentMarginRect);
    this.updateMargins(result.marginRect, result.marginWidth);
    return result;
  }

  changeOrientation(isVertical) {
    const currentCanvas = this.getCanvas();
    const currentMarginRect = this.getMarginRect();
    const result = changeOrientation(isVertical, currentCanvas, currentMarginRect);
    this.updateMargins(result.marginRect, result.marginWidth);
    return result;
  }

  // Nuevos métodos para manejar el sistema de páginas
  getAllPages() {
    return getAllPages();
  }

  getCurrentPage() {
    return getCurrentPage();
  }

  destroy() {
    // Destruir todos los canvas de todas las páginas
    const pages = getAllPages();
    pages.forEach(page => {
      if (page.fabricCanvas) {
        page.fabricCanvas.dispose();
      }
    });
    
    // También destruir el canvas principal si existe
    if (this.canvas) {
      this.canvas.dispose();
    }
  }
} 