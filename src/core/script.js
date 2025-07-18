/**
 * Punto de entrada principal de la aplicación
 * Este archivo ahora es mucho más limpio y solo se encarga de inicializar la aplicación
 */
import Swal from 'sweetalert2';
import { initializeApp, getAppInstance } from './app.js';
import favicon from '@fortawesome/fontawesome-free/svgs/solid/print.svg';

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const faviconLink = document.createElement('link');
  faviconLink.rel = 'icon';
  faviconLink.href = favicon;
  faviconLink.type = 'image/svg+xml';
  document.head.appendChild(faviconLink);

  try {
    // Inicializar la aplicación principal
    const app = await initializeApp();
    
    // Verificar que la aplicación se inicializó correctamente
    if (app.isHealthy()) {
      
      // Opcional: Exponer la instancia de la aplicación para debugging
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.app = app;
      }
    } else {
      console.error('❌ Application failed to start properly');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during application initialization:', error);
    
    // Mostrar error al usuario
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
