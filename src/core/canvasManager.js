import { fabric } from 'fabric';
import { 
  resizeCanvas, 
  changeOrientation, 
  paperSizes, 
  dpi, 
  getCurrentSize, 
  getIsVertical 
} from '../canvas/canvasResizeUtils.js';
import { setupMovingEvents } from '../events/movingEvents.js';
import { setupScalingEvents } from '../events/scalingEvents.js';
import { setupRotatingEvents } from '../events/rotatingEvents.js';
import { setupSkewingEvents } from '../events/skewingEvents.js';

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
  }

  initializeCanvas() {
    // Inicializar canvas con tamaño carta por defecto
    const initialResult = resizeCanvas("carta", this.canvas, this.marginRect);
    this.marginRect = initialResult.marginRect;
    this.marginWidth = initialResult.marginWidth;
  }

  setupCanvasProperties() {
    // Configurar propiedades del canvas
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = "limegreen";
    fabric.Object.prototype.cornerStrokeColor = "black";
    fabric.Object.prototype.cornerStyle = "rect";
    fabric.Object.prototype.cornerSize = 12;
    
    const controls = fabric.Object.prototype.controls;
    const rotateControls = controls.mtr;
    rotateControls.visible = false;
  }

  setupCanvasEvents(updateArrangement, onArrangeUpdate) {
    setupMovingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
    setupScalingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
    setupRotatingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
    setupSkewingEvents(this.canvas, this.marginRect, updateArrangement, onArrangeUpdate);
  }

  getCanvas() {
    return this.canvas;
  }

  getMarginRect() {
    return this.marginRect;
  }

  getMarginWidth() {
    return this.marginWidth;
  }

  updateMargins(marginRect, marginWidth) {
    this.marginRect = marginRect;
    this.marginWidth = marginWidth;
  }

  getPaperConfig() {
    return {
      size: getCurrentSize(),
      isVertical: getIsVertical(),
      dpi: dpi
    };
  }

  resizeCanvas(size) {
    const result = resizeCanvas(size, this.canvas, this.marginRect);
    this.updateMargins(result.marginRect, result.marginWidth);
    return result;
  }

  changeOrientation(isVertical) {
    const result = changeOrientation(isVertical, this.canvas, this.marginRect);
    this.updateMargins(result.marginRect, result.marginWidth);
    return result;
  }

  destroy() {
    if (this.canvas) {
      this.canvas.dispose();
    }
  }
} 