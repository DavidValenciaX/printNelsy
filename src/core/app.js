import { DOMManager } from './domManager.js';
import { CanvasManager } from './canvasManager.js';
import { ActionManager } from './actionManager.js';
import { EventManager } from './eventManager.js';
import { setupAccessibility } from '../utils/accessibilityUtils.js';

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
      console.log('Initializing Print Image App...');
      
      // Initialize modules in order
      this.initializeModules();
      
      // Setup application
      this.setupApplication();
      
      // Setup events
      this.setupEvents();
      
      // Setup accessibility
      this.setupAccessibility();
      
      this.isInitialized = true;
      console.log('Print Image App initialized successfully');
      
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
  }

  setupApplication() {
    // Setup canvas events that require setArrangementStatus
    this.modules.canvas.setupCanvasEvents(this.modules.actions.setArrangementStatus);
    
    // Expose global zoom actions for backwards compatibility
    this.modules.actions.exposeGlobalZoomActions();
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
    
    console.log('Print Image App destroyed');
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