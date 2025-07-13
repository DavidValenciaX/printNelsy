import { getArrangementDisplayConfig } from './arrangementConstants.js';

/**
 * Gestiona el indicador visual del estado de arreglo
 */
export class ArrangementIndicator {
  constructor(domManager) {
    this.domManager = domManager;
    this.currentStatus = 'none';
    this.isInitialized = false;
  }

  /**
   * Inicializa el indicador
   */
  initialize() {
    if (this.isInitialized) return;
    
    this.indicatorElement = this.domManager.get('arrangementIndicator');
    this.iconElement = this.domManager.get('arrangementIcon');
    this.textElement = this.domManager.get('arrangementText');
    
    if (!this.indicatorElement || !this.iconElement || !this.textElement) {
      console.warn('ArrangementIndicator: No se encontraron los elementos DOM necesarios');
      return;
    }

    // Configurar estado inicial
    this.updateDisplay('none');
    this.isInitialized = true;
  }

  /**
   * Actualiza el estado del indicador
   * @param {string} status - Nuevo estado de arreglo
   */
  updateStatus(status) {
    if (!this.isInitialized) {
      console.warn('ArrangementIndicator: No está inicializado');
      return;
    }

    this.currentStatus = status;
    this.updateDisplay(status);
  }

  /**
   * Actualiza la visualización del indicador
   * @param {string} status - Estado de arreglo
   */
  updateDisplay(status) {
    const config = getArrangementDisplayConfig(status);
    
    if (!this.indicatorElement || !this.iconElement || !this.textElement) {
      return;
    }

    // Actualizar icono
    this.iconElement.className = `${config.icon} indicator-icon`;
    
    // Actualizar texto
    this.textElement.textContent = config.name;
    
    // Actualizar color del indicador
    this.indicatorElement.style.setProperty('--indicator-color', config.color);
    
    // Actualizar título para accesibilidad
    this.indicatorElement.title = config.description;
    
    // Agregar clase para estado específico
    this.indicatorElement.className = `arrangement-indicator arrangement-${status}`;
  }

  /**
   * Obtiene el estado actual
   * @returns {string} Estado actual
   */
  getCurrentStatus() {
    return this.currentStatus;
  }

  /**
   * Muestra u oculta el indicador
   * @param {boolean} show - Si mostrar o no el indicador
   */
  setVisibility(show) {
    if (!this.indicatorElement) return;
    
    this.indicatorElement.style.display = show ? 'flex' : 'none';
  }
}

// Instancia global del indicador
let indicatorInstance = null;

/**
 * Obtiene la instancia del indicador
 * @returns {ArrangementIndicator|null} Instancia del indicador
 */
export function getIndicatorInstance() {
  return indicatorInstance;
}

/**
 * Inicializa el indicador global
 * @param {DOMManager} domManager - Gestor DOM
 */
export function initializeArrangementIndicator(domManager) {
  if (!indicatorInstance) {
    indicatorInstance = new ArrangementIndicator(domManager);
  }
  indicatorInstance.initialize();
  return indicatorInstance;
}

/**
 * Actualiza el estado del indicador global
 * @param {string} status - Nuevo estado de arreglo
 */
export function updateArrangementIndicator(status) {
  if (indicatorInstance) {
    indicatorInstance.updateStatus(status);
  }
} 