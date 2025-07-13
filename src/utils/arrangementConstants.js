/**
 * Constantes para los estados de arreglo de imágenes
 */
export const ARRANGEMENT_STATUS = {
  NONE: 'none',
  GRID: 'grid',
  COLUMNS_COLLAGE: 'columns-collage',
  ROWS_COLLAGE: 'rows-collage',
  COLLAGE: 'collage'
};

/**
 * Configuración de visualización para cada estado de arreglo
 */
export const ARRANGEMENT_DISPLAY_CONFIG = {
  [ARRANGEMENT_STATUS.NONE]: {
    name: 'Sin organizar',
    icon: 'fas fa-square',
    color: '#6c757d',
    description: 'Imágenes sin organizar'
  },
  [ARRANGEMENT_STATUS.GRID]: {
    name: 'En cuadrícula',
    icon: 'fas fa-th',
    color: '#28a745',
    description: 'Imágenes organizadas en cuadrícula'
  },
  [ARRANGEMENT_STATUS.COLUMNS_COLLAGE]: {
    name: 'En collage de columnas',
    icon: 'fas fa-columns',
    color: '#007bff',
    description: 'Collage organizado en columnas'
  },
  [ARRANGEMENT_STATUS.ROWS_COLLAGE]: {
    name: 'En collage de filas',
    icon: 'fas fa-grip-lines',
    color: '#007bff',
    description: 'Collage organizado en filas'
  },
  [ARRANGEMENT_STATUS.COLLAGE]: {
    name: 'En collage aleatorio',
    icon: 'fas fa-th-large',
    color: '#ffc107',
    description: 'Collage con disposición aleatoria'
  }
};

/**
 * Obtiene la configuración de visualización para un estado de arreglo
 * @param {string} status - Estado de arreglo
 * @returns {Object} Configuración de visualización
 */
export function getArrangementDisplayConfig(status) {
  return ARRANGEMENT_DISPLAY_CONFIG[status] || ARRANGEMENT_DISPLAY_CONFIG[ARRANGEMENT_STATUS.NONE];
} 