import { DOMManager } from './domManager.js';
import { CanvasManager } from './canvasManager.js';
import { ActionManager } from './actionManager.js';
import { EventManager } from './eventManager.js';
import { setupAccessibility } from '../utils/accessibilityUtils.js';
import { setDOMManagerInstance } from '../image/imageUploadUtils.js';

/**
 * Clase principal de la aplicación que orquesta todos los módulos
 */
export class PrintImageApp {
  constructor() {
    this.isInitialized = false;
    this.modules = {};
  }

  async initialize() {
    try {
      
      // Initialize modules in order
      this.initializeModules();
      
      // Setup application
      this.setupApplication();
      
      // Setup events
      this.setupEvents();
      
      // Setup accessibility
      this.setupAccessibility();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize Print Image App:', error);
      throw error;
    }
  }

  initializeModules() {
    // Initialize DOM Manager
    this.modules.dom = new DOMManager();
    
    // Initialize Canvas Manager
    const canvasElement = this.modules.dom.get('canvasElement');
    this.modules.canvas = new CanvasManager(canvasElement);
    
    // Initialize Action Manager
    this.modules.actions = new ActionManager();
    
    // Initialize Event Manager
    this.modules.events = new EventManager(
      this.modules.dom,
      this.modules.canvas,
      this.modules.actions
    );
    this.modules.dom.setEventManager(this.modules.events);
  }

  updateArrangement(status) {
    this.modules.actions.setArrangementStatus(status);
    this.modules.actions.toggleGridControlsVisibility(this.modules.canvas.getCanvas(), this.modules.dom);
  }

  setupApplication() {
    // Setup canvas events that require setArrangementStatus and UI updates
    const onArrangeUpdate = () => {
      if (this.modules.events) {
        this.modules.events.updateLayoutOrientationButtons();
        this.modules.events.updateOrderButtons();
      }
    };
    this.modules.canvas.setupCanvasEvents(this.updateArrangement.bind(this), onArrangeUpdate);
    
    // Set the DOM manager instance for arrangement button updates
    setDOMManagerInstance(this.modules.dom);
    
    // Initialize arrangement buttons to reflect the initial state
    this.initializeArrangementButtons();
    
    // Expose global zoom actions for backwards compatibility
    this.modules.actions.exposeGlobalZoomActions();
  }

  async initializeArrangementButtons() {
    try {
      const { updateArrangementButtons } = await import('../utils/arrangementButtons.js');
      const { imageState } = await import('../image/imageUploadUtils.js');
      updateArrangementButtons(imageState.arrangementStatus, this.modules.dom);
      
      // También inicializar el estado de la UI para la primera página
      await this.initializePageUIState();
    } catch (error) {
      console.warn('Error initializing arrangement buttons:', error);
    }
  }

  /**
   * Inicializa el estado de la UI para la primera página
   */
  async initializePageUIState() {
    try {
      const { updateUIButtonsForCurrentPage } = await import('../canvas/pageUtils.js');
      // Pequeño delay para asegurar que todos los módulos estén inicializados
      setTimeout(() => {
        updateUIButtonsForCurrentPage();
      }, 100);
    } catch (error) {
      console.warn('Error initializing page UI state:', error);
    }
  }

  setupEvents() {
    // Initialize all event listeners
    this.modules.events.initializeAllEvents();
  }

  setupAccessibility() {
    setupAccessibility();
  }

  // Public API methods for external access
  getCanvas() {
    return this.modules.canvas?.getCanvas();
  }

  getCanvasManager() {
    return this.modules.canvas;
  }

  getDOMManager() {
    return this.modules.dom;
  }

  getActionManager() {
    return this.modules.actions;
  }

  getEventManager() {
    return this.modules.events;
  }

  // Cleanup method
  destroy() {
    if (this.modules.events) {
      this.modules.events.removeAllEventBindings();
    }
    
    if (this.modules.canvas) {
      this.modules.canvas.destroy();
    }
    
    // Clear modules
    this.modules = {};
    this.isInitialized = false;
  }

  // Health check
  isHealthy() {
    return this.isInitialized && 
           this.modules.dom && 
           this.modules.canvas && 
           this.modules.actions && 
           this.modules.events;
  }
}

// Global instance for easy access (optional)
let appInstance = null;

export function getAppInstance() {
  return appInstance;
}

export function initializeApp() {
  if (!appInstance) {
    appInstance = new PrintImageApp();
  }
  return appInstance.initialize().then(() => appInstance);
}

export function destroyApp() {
  if (appInstance) {
    appInstance.destroy();
    appInstance = null;
  }
} 