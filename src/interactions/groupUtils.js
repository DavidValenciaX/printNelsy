/**
 * Utilidades para agrupar y desagrupar objetos en el canvas
 * Usa las capacidades nativas de Fabric.js para mantener la consistencia
 */

import { fabric } from 'fabric';

/**
 * Constantes para la gestión de grupos
 */
const GROUP_CONFIG = {
  // Configuración por defecto para grupos
  DEFAULT_PROPS: {
    cornerColor: 'blue',
    cornerStrokeColor: 'darkblue',
    borderColor: 'blue',
    cornerSize: 6,
    transparentCorners: false,
    cornerStyle: 'rect'
  },
  // Restricciones que se aplicarán a los grupos
  CONSTRAINTS: {
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
    lockUniScaling: false
  }
};

/**
 * Agrupa los objetos seleccionados en el canvas
 * @param {fabric.Canvas} canvas - Instancia del canvas de Fabric.js
 * @returns {fabric.Group|null} - El grupo creado o null si no es posible agrupar
 */
export function groupSelectedObjects(canvas) {
  if (!canvas) {
    console.error('Canvas no válido para agrupar objetos');
    return null;
  }

  const activeSelection = canvas.getActiveObject();
  
  // Verificar que hay una ActiveSelection (múltiples objetos seleccionados)
  if (!activeSelection || activeSelection.type !== 'activeSelection') {
    console.warn('No hay múltiples objetos seleccionados para agrupar');
    return null;
  }

  // Verificar que hay al menos 2 objetos
  if (!activeSelection._objects || activeSelection._objects.length < 2) {
    console.warn('Se necesitan al menos 2 objetos para crear un grupo');
    return null;
  }

  try {
    // Convertir la selección activa a un grupo usando el método nativo de Fabric.js
    const group = activeSelection.toGroup();
    
    // Aplicar configuración personalizada al grupo
    group.set({
      ...GROUP_CONFIG.DEFAULT_PROPS,
      ...GROUP_CONFIG.CONSTRAINTS
    });

    // Asegurar que el grupo sea seleccionable y movible
    group.setCoords();
    
    // Renderizar el canvas para reflejar los cambios
    canvas.renderAll();
    
    console.log('✅ Objetos agrupados exitosamente:', group);
    return group;
    
  } catch (error) {
    console.error('❌ Error al agrupar objetos:', error);
    return null;
  }
}

/**
 * Desagrupa el grupo seleccionado, convirtiendo sus objetos en elementos individuales
 * @param {fabric.Canvas} canvas - Instancia del canvas de Fabric.js
 * @returns {fabric.ActiveSelection|null} - La selección activa con los objetos desagrupados o null
 */
export function ungroupActiveObject(canvas) {
  if (!canvas) {
    console.error('Canvas no válido para desagrupar objetos');
    return null;
  }

  const activeObject = canvas.getActiveObject();
  
  // Verificar que el objeto activo es un grupo
  if (!activeObject || activeObject.type !== 'group') {
    console.warn('El objeto seleccionado no es un grupo válido para desagrupar');
    return null;
  }

  try {
    // Convertir el grupo a una selección activa usando el método nativo de Fabric.js
    const activeSelection = activeObject.toActiveSelection();
    
    // Renderizar el canvas para reflejar los cambios
    canvas.renderAll();
    
    console.log('✅ Grupo desagrupado exitosamente:', activeSelection);
    return activeSelection;
    
  } catch (error) {
    console.error('❌ Error al desagrupar objetos:', error);
    return null;
  }
}

/**
 * Verifica si el objeto actual puede ser agrupado
 * @param {fabric.Canvas} canvas - Instancia del canvas de Fabric.js
 * @returns {boolean} - true si se puede agrupar, false en caso contrario
 */
export function canGroupObjects(canvas) {
  if (!canvas) return false;
  
  const activeSelection = canvas.getActiveObject();
  return activeSelection && 
         activeSelection.type === 'activeSelection' && 
         activeSelection._objects && 
         activeSelection._objects.length >= 2;
}

/**
 * Verifica si el objeto actual puede ser desagrupado
 * @param {fabric.Canvas} canvas - Instancia del canvas de Fabric.js
 * @returns {boolean} - true si se puede desagrupar, false en caso contrario
 */
export function canUngroupObject(canvas) {
  if (!canvas) return false;
  
  const activeObject = canvas.getActiveObject();
  return activeObject && activeObject.type === 'group';
}

/**
 * Obtiene información sobre el estado actual de la selección
 * @param {fabric.Canvas} canvas - Instancia del canvas de Fabric.js
 * @returns {Object} - Información sobre la selección actual
 */
export function getSelectionInfo(canvas) {
  if (!canvas) {
    return { hasSelection: false, canGroup: false, canUngroup: false };
  }

  const activeObject = canvas.getActiveObject();
  
  return {
    hasSelection: !!activeObject,
    canGroup: canGroupObjects(canvas),
    canUngroup: canUngroupObject(canvas),
    selectionType: activeObject ? activeObject.type : null,
    objectCount: activeObject?._objects ? activeObject._objects.length : 0
  };
} 