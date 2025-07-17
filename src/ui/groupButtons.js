/**
 * Gestión del estado de los botones de agrupar/desagrupar
 * Se encarga de habilitar/deshabilitar los botones según la selección actual
 */

import { getSelectionInfo } from '../interactions/groupUtils.js';

/**
 * Constantes para el estado de los botones
 */
const BUTTON_STATE = {
  ENABLED: {
    disabled: false,
    opacity: '1',
    cursor: 'pointer'
  },
  DISABLED: {
    disabled: true,
    opacity: '0.5',
    cursor: 'not-allowed'
  }
};

/**
 * Actualiza el estado de los botones de agrupar/desagrupar según la selección actual
 * @param {fabric.Canvas} canvas - Instancia del canvas de Fabric.js
 * @param {Object} domManager - Instancia del gestor de DOM
 */
export function updateGroupButtonsState(canvas, domManager) {
  if (!canvas || !domManager) {
    console.error('Canvas o domManager no válidos para actualizar botones');
    return;
  }

  const groupButton = domManager.get('groupButton');
  const ungroupButton = domManager.get('ungroupButton');

  if (!groupButton || !ungroupButton) {
    console.error('Botones de agrupación no encontrados en el DOM');
    return;
  }

  // Obtener información de la selección actual
  const selectionInfo = getSelectionInfo(canvas);

  // Actualizar estado del botón "Agrupar"
  updateButtonState(groupButton, selectionInfo.canGroup);
  
  // Actualizar estado del botón "Desagrupar"
  updateButtonState(ungroupButton, selectionInfo.canUngroup);

  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    console.debug('📊 Estado de selección:', {
      hasSelection: selectionInfo.hasSelection,
      canGroup: selectionInfo.canGroup,
      canUngroup: selectionInfo.canUngroup,
      selectionType: selectionInfo.selectionType,
      objectCount: selectionInfo.objectCount
    });
  }
}

/**
 * Actualiza el estado visual y funcional de un botón
 * @param {HTMLButtonElement} button - El elemento del botón a actualizar
 * @param {boolean} enabled - Si el botón debe estar habilitado o no
 */
function updateButtonState(button, enabled) {
  if (!button) return;

  const state = enabled ? BUTTON_STATE.ENABLED : BUTTON_STATE.DISABLED;
  
  // Aplicar propiedades del estado
  Object.keys(state).forEach(property => {
    if (property === 'disabled') {
      button.disabled = state[property];
    } else {
      button.style[property] = state[property];
    }
  });

  // Actualizar atributos de accesibilidad
  button.setAttribute('aria-disabled', (!enabled).toString());
  
  // Actualizar título del botón para mejor UX
  if (enabled) {
    // Restaurar título original
    if (button.id === 'groupButton') {
      button.title = 'Agrupar objetos seleccionados';
    } else if (button.id === 'ungroupButton') {
      button.title = 'Desagrupar el grupo seleccionado';
    }
  } else {
    // Título explicativo cuando está deshabilitado
    if (button.id === 'groupButton') {
      button.title = 'Selecciona 2 o más objetos para agrupar';
    } else if (button.id === 'ungroupButton') {
      button.title = 'Selecciona un grupo para desagrupar';
    }
  }
}

/**
 * Inicializa el estado de los botones cuando se carga la aplicación
 * @param {Object} domManager - Instancia del gestor de DOM
 */
export function initializeGroupButtonsState(domManager) {
  if (!domManager) {
    console.error('DomManager no válido para inicializar botones');
    return;
  }

  const groupButton = domManager.get('groupButton');
  const ungroupButton = domManager.get('ungroupButton');

  // Establecer estado inicial (deshabilitado)
  updateButtonState(groupButton, false);
  updateButtonState(ungroupButton, false);

  console.log('✅ Estado inicial de botones de agrupación configurado');
}

/**
 * Maneja la respuesta visual después de una operación de agrupación exitosa
 * @param {fabric.Group} group - El grupo que fue creado
 * @param {Object} domManager - Instancia del gestor de DOM
 */
export function handleGroupCreated(group, domManager) {
  if (!group || !domManager) return;

  // Breve feedback visual
  const groupButton = domManager.get('groupButton');
  if (groupButton) {
    // Efecto visual temporal para confirmar la acción
    groupButton.style.backgroundColor = '#4CAF50';
    setTimeout(() => {
      groupButton.style.backgroundColor = '';
    }, 200);
  }

  console.log('✅ Feedback visual de agrupación completado');
}

/**
 * Maneja la respuesta visual después de una operación de desagrupación exitosa
 * @param {fabric.ActiveSelection} activeSelection - La selección activa resultante
 * @param {Object} domManager - Instancia del gestor de DOM
 */
export function handleGroupUngrouped(activeSelection, domManager) {
  if (!activeSelection || !domManager) return;

  // Breve feedback visual
  const ungroupButton = domManager.get('ungroupButton');
  if (ungroupButton) {
    // Efecto visual temporal para confirmar la acción
    ungroupButton.style.backgroundColor = '#FF9800';
    setTimeout(() => {
      ungroupButton.style.backgroundColor = '';
    }, 200);
  }

  console.log('✅ Feedback visual de desagrupación completado');
} 