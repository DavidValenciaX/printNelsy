import { fabric } from 'fabric';

/**
 * Configuración global para Fabric.js
 * Maneja eventos pasivos y optimizaciones de rendimiento
 */
export function configureFabricJS() {
  // Configurar constantes para mejorar el rendimiento
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.cornerColor = "limegreen";
  fabric.Object.prototype.cornerStrokeColor = "black";
  fabric.Object.prototype.cornerStyle = "rect";
  fabric.Object.prototype.cornerSize = 12;
  
  // Deshabilitar controles de rotación por defecto
  const controls = fabric.Object.prototype.controls;
  if (controls.mtr) {
    controls.mtr.visible = false;
  }

  // Deshabilitar completamente el zoom con rueda del mouse
  // Reemplazar el método _onMouseWheel con una función vacía
  fabric.Canvas.prototype._onMouseWheel = function(e) {
    // No hacer nada - esto deshabilita completamente el zoom con rueda del mouse
    return false;
  };
}

/**
 * Configuración específica para el canvas
 * @param {fabric.Canvas} canvas - Instancia del canvas
 */
export function configureCanvas(canvas) {
  // Configurar otras optimizaciones
  canvas.selection = true;
  canvas.preserveObjectStacking = true;
  
  // Asegurar que el zoom con rueda del mouse esté deshabilitado
  canvas.on('mouse:wheel', function(opt) {
    // No hacer nada - esto deshabilita completamente el zoom con rueda del mouse
    return false;
  });
}

// Ejecutar configuración global inmediatamente
configureFabricJS(); 