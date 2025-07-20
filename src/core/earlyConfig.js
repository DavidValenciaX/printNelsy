/**
 * Configuración temprana para interceptar eventos wheel
 * Este archivo debe ejecutarse ANTES de cualquier import de Fabric.js
 */

// Interceptar addEventListener para usar eventos pasivos cuando sea apropiado
const originalAddEventListener = EventTarget.prototype.addEventListener;

EventTarget.prototype.addEventListener = function(type, listener, options) {
  // Para eventos de wheel, usar passive: true por defecto
  if (type === 'wheel' && !options) {
    options = { passive: true };
  }
  
  return originalAddEventListener.call(this, type, listener, options);
};

console.log('✅ Configuración temprana de eventos pasivos aplicada'); 