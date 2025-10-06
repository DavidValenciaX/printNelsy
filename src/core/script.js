/**
 * Punto de entrada principal de la aplicación
 * Este archivo ahora es mucho más limpio y solo se encarga de inicializar la aplicación
 */
import Swal from "sweetalert2";
// Configuración temprana de eventos pasivos - DEBE EJECUTARSE ANTES DE CUALQUIER IMPORT
import "./earlyConfig.js";

// Importar configuración de Fabric.js
import "./fabricConfig.js";

// Importar la aplicación principal
import { initializeApp, getAppInstance } from "./app.js";
import favicon from "@fortawesome/fontawesome-free/svgs/solid/print.svg";

// Importar el sistema de tabs
import { initializeTabManagers } from "../ui/tabManager.js";
// Redimensionado responsive
import { responsiveResizeAllPages } from "../canvas/pageUtils.js";

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  const faviconLink = document.createElement("link");
  faviconLink.rel = "icon";
  faviconLink.href = favicon;
  faviconLink.type = "image/svg+xml";
  document.head.appendChild(faviconLink);

  try {
    // Inicializar la aplicación principal
    const app = await initializeApp();

    // Inicializar el sistema de tabs
    const tabManagers = initializeTabManagers();
    console.log("✅ Sistema de tabs inicializado");

    // Verificar que la aplicación se inicializó correctamente
    if (app.isHealthy()) {
      // Opcional: Exponer la instancia de la aplicación para debugging
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        window.app = app;
        window.tabs = tabManagers;
      }
    } else {
      console.error("❌ Application failed to start properly");
    }

    // Ajuste responsive inicial
    responsiveResizeAllPages();
  } catch (error) {
    console.error("💥 Fatal error during application initialization:", error);

    // Mostrar error al usuario
    Swal.fire({
      icon: "error",
      title: "Error de Inicialización",
      text: "No se pudo inicializar la aplicación. Por favor, recarga la página.",
      confirmButtonText: "Recargar",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  }
});

// Manejar errores no capturados
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
});

// Cleanup cuando se cierre la página
window.addEventListener("beforeunload", () => {
  const app = getAppInstance();
  if (app) {
    app.destroy();
  }
});

// Debounce util simple
function debounce(fn, delay = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// Redimensionado responsive en cambios de tamaño de ventana
window.addEventListener('resize', debounce(() => {
  responsiveResizeAllPages();
}, 150));
