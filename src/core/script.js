/**
 * Punto de entrada principal de la aplicación
 * Este archivo ahora es mucho más limpio y solo se encarga de inicializar la aplicación
 */
import '../utils/globals.js'; // Importar librerías globales
import { initializeApp, getAppInstance } from './app.js';

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inicializar la aplicación principal
    const app = await initializeApp();
    
    // Verificar que la aplicación se inicializó correctamente
    if (app.isHealthy()) {
      console.log('✅ Application started successfully');
      
      // Opcional: Exponer la instancia de la aplicación para debugging
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.app = app;
        console.log('🔧 Development mode: app instance available at window.app');
      }
    } else {
      console.error('❌ Application failed to start properly');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during application initialization:', error);
    
    // Mostrar error al usuario si SweetAlert está disponible
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error de Inicialización',
        text: 'No se pudo inicializar la aplicación. Por favor, recarga la página.',
        confirmButtonText: 'Recargar',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    }
  }
});

// Manejar errores no capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Cleanup cuando se cierre la página
window.addEventListener('beforeunload', () => {
  const app = getAppInstance();
  if (app) {
    app.destroy();
  }
});
