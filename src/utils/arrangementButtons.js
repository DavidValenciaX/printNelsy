/**
 * Gestiona el estado visual de los botones de organización (arrangement)
 */

const ARRANGEMENT_BUTTON_MAP = {
  'none': null, // No hay botón específico para "none"
  'grid': 'gridArrangeButton',
  'columns-collage': 'columnsCollageButton',
  'rows-collage': 'rowsCollageButton',
  'collage': 'collageButton'
};

/**
 * Actualiza el estado visual de los botones de arrangement
 * @param {string} status - El estado actual del arrangement
 * @param {DOMManager} domManager - Instancia del gestor DOM
 */
export function updateArrangementButtons(status, domManager) {
  // Remover la clase active de todos los botones de arrangement
  Object.values(ARRANGEMENT_BUTTON_MAP).forEach(buttonId => {
    if (buttonId) {
      const button = domManager.get(buttonId);
      if (button) {
        button.classList.remove('active');
      }
    }
  });

  // Agregar la clase active al botón correspondiente al estado actual
  const activeButtonId = ARRANGEMENT_BUTTON_MAP[status];
  if (activeButtonId) {
    const activeButton = domManager.get(activeButtonId);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
}

/**
 * Obtiene el mapeo de estados a IDs de botones
 * @returns {Object} El mapeo de estados a IDs de botones
 */
export function getArrangementButtonMap() {
  return { ...ARRANGEMENT_BUTTON_MAP };
} 