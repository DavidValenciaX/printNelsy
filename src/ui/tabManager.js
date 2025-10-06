/**
 * Tab Manager - Sistema de gestión de pestañas para la UI
 * Maneja la navegación y el estado de las pestañas en los paneles laterales
 */

export class TabManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container con ID "${containerId}" no encontrado`);
      return;
    }

    this.tabs = new Map();
    this.activeTab = null;
    this.init();
  }

  /**
   * Inicializa el sistema de tabs
   */
  init() {
    // Buscar todos los botones de tab
    const tabButtons = this.container.querySelectorAll('.tab-button');
    const tabPanels = this.container.querySelectorAll('.tab-panel');

    // Registrar cada tab
    tabButtons.forEach((button, index) => {
      const tabId = button.getAttribute('data-tab');
      const panel = this.container.querySelector(`[data-panel="${tabId}"]`);

      if (panel) {
        this.tabs.set(tabId, {
          button,
          panel,
          index
        });

        // Agregar event listener
        button.addEventListener('click', () => this.switchTab(tabId));
      }
    });

    // Activar la primera tab por defecto
    if (this.tabs.size > 0) {
      const firstTabId = Array.from(this.tabs.keys())[0];
      this.switchTab(firstTabId);
    }

    // Agregar soporte para atajos de teclado
    this.setupKeyboardShortcuts();
  }

  /**
   * Cambia a una pestaña específica
   * @param {string} tabId - ID de la pestaña a activar
   */
  switchTab(tabId) {
    if (!this.tabs.has(tabId)) {
      console.warn(`Tab "${tabId}" no encontrada`);
      return;
    }

    // Desactivar tab actual
    if (this.activeTab) {
      const currentTab = this.tabs.get(this.activeTab);
      currentTab.button.classList.remove('active');
      currentTab.panel.classList.remove('active');
    }

    // Activar nueva tab
    const newTab = this.tabs.get(tabId);
    newTab.button.classList.add('active');
    newTab.panel.classList.add('active');

    this.activeTab = tabId;

    // Emitir evento personalizado
    this.emitTabChange(tabId);

    // Guardar preferencia en localStorage
    this.saveTabPreference(tabId);
  }

  /**
   * Obtiene el ID de la tab activa
   * @returns {string|null}
   */
  getActiveTab() {
    return this.activeTab;
  }

  /**
   * Navega a la siguiente tab
   */
  nextTab() {
    if (!this.activeTab) return;

    const tabIds = Array.from(this.tabs.keys());
    const currentIndex = tabIds.indexOf(this.activeTab);
    const nextIndex = (currentIndex + 1) % tabIds.length;

    this.switchTab(tabIds[nextIndex]);
  }

  /**
   * Navega a la tab anterior
   */
  previousTab() {
    if (!this.activeTab) return;

    const tabIds = Array.from(this.tabs.keys());
    const currentIndex = tabIds.indexOf(this.activeTab);
    const previousIndex = currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1;

    this.switchTab(tabIds[previousIndex]);
  }

  /**
   * Configura atajos de teclado para navegación entre tabs
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Tab: siguiente pestaña
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          this.previousTab();
        } else {
          this.nextTab();
        }
      }

      // Números 1-9: cambiar a tab específica
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        const tabIndex = parseInt(e.key) - 1;
        const tabIds = Array.from(this.tabs.keys());
        if (tabIndex < tabIds.length) {
          e.preventDefault();
          this.switchTab(tabIds[tabIndex]);
        }
      }
    });
  }

  /**
   * Emite un evento personalizado cuando cambia la tab
   * @param {string} tabId - ID de la tab activada
   */
  emitTabChange(tabId) {
    const event = new CustomEvent('tabchange', {
      detail: { tabId, container: this.container.id }
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Guarda la preferencia de tab en localStorage
   * @param {string} tabId - ID de la tab a guardar
   */
  saveTabPreference(tabId) {
    const storageKey = `tabPreference_${this.container.id}`;
    localStorage.setItem(storageKey, tabId);
  }

  /**
   * Carga la preferencia de tab desde localStorage
   * @returns {string|null}
   */
  loadTabPreference() {
    const storageKey = `tabPreference_${this.container.id}`;
    return localStorage.getItem(storageKey);
  }

  /**
   * Restaura la última tab activa desde localStorage
   */
  restoreLastActiveTab() {
    const savedTab = this.loadTabPreference();
    if (savedTab && this.tabs.has(savedTab)) {
      this.switchTab(savedTab);
    }
  }

  /**
   * Habilita o deshabilita una tab
   * @param {string} tabId - ID de la tab
   * @param {boolean} enabled - true para habilitar, false para deshabilitar
   */
  setTabEnabled(tabId, enabled) {
    if (!this.tabs.has(tabId)) return;

    const tab = this.tabs.get(tabId);
    tab.button.disabled = !enabled;

    if (!enabled && this.activeTab === tabId) {
      // Si se deshabilita la tab activa, cambiar a la primera disponible
      const enabledTabs = Array.from(this.tabs.entries()).filter(
        ([_, tab]) => !tab.button.disabled
      );
      if (enabledTabs.length > 0) {
        this.switchTab(enabledTabs[0][0]);
      }
    }
  }

  /**
   * Agrega una insignia/badge a una tab (ej: número de notificaciones)
   * @param {string} tabId - ID de la tab
   * @param {string|number} badge - Contenido del badge
   */
  addBadge(tabId, badge) {
    if (!this.tabs.has(tabId)) return;

    const tab = this.tabs.get(tabId);
    let badgeElement = tab.button.querySelector('.tab-badge');

    if (!badgeElement) {
      badgeElement = document.createElement('span');
      badgeElement.className = 'tab-badge';
      tab.button.appendChild(badgeElement);
    }

    badgeElement.textContent = badge;
    badgeElement.style.display = badge ? 'inline-block' : 'none';
  }

  /**
   * Elimina el badge de una tab
   * @param {string} tabId - ID de la tab
   */
  removeBadge(tabId) {
    if (!this.tabs.has(tabId)) return;

    const tab = this.tabs.get(tabId);
    const badgeElement = tab.button.querySelector('.tab-badge');

    if (badgeElement) {
      badgeElement.remove();
    }
  }

  /**
   * Destruye el tab manager y limpia los event listeners
   */
  destroy() {
    this.tabs.forEach(({ button }) => {
      button.replaceWith(button.cloneNode(true));
    });
    this.tabs.clear();
    this.activeTab = null;
  }
}

/**
 * Inicializa los tab managers para los paneles izquierdo y derecho
 * @returns {Object} Objeto con los managers de tabs
 */
export function initializeTabManagers() {
  const leftTabManager = new TabManager('leftSidebar');
  const rightTabManager = new TabManager('rightSidebar');

  // Restaurar últimas tabs activas
  leftTabManager.restoreLastActiveTab();
  rightTabManager.restoreLastActiveTab();

  // Event listeners para cambios de tab
  document.getElementById('leftSidebar')?.addEventListener('tabchange', (e) => {
    console.log(`Tab izquierda cambiada a: ${e.detail.tabId}`);
  });

  document.getElementById('rightSidebar')?.addEventListener('tabchange', (e) => {
    console.log(`Tab derecha cambiada a: ${e.detail.tabId}`);
  });

  return {
    left: leftTabManager,
    right: rightTabManager
  };
}
