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
import { TabManager, initializeTabManagers } from "../ui/tabManager.js";
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
    let tabManagers = initializeTabManagers();
    console.log("✅ Sistema de tabs inicializado");

    // Unificar pestañas en una sola sección debajo del canvas en pantallas pequeñas
    const SMALL_WIDTH = 1200;

    function createCombinedTabsContainer() {
      const pagesContainer = document.getElementById("pages-container");
      if (!pagesContainer) return null;

      let bottomTabs = document.getElementById("bottomTabs");
      if (!bottomTabs) {
        bottomTabs = document.createElement("div");
        bottomTabs.id = "bottomTabs";
        bottomTabs.className = "button-container";

        const header = document.createElement("div");
        header.className = "tabs-header";
        const content = document.createElement("div");
        content.className = "tabs-content";

        bottomTabs.appendChild(header);
        bottomTabs.appendChild(content);

        pagesContainer.insertAdjacentElement("afterend", bottomTabs);

        // Convertir en overlay deslizante en pantallas pequeñas
        bottomTabs.classList.add("overlay");
        bottomTabs.classList.remove("open");
      }
      return bottomTabs;
    }

    function moveTabsToCombined(sidebar, combined, origin) {
      if (!sidebar || !combined) return;
      const header = sidebar.querySelector(".tabs-header");
      const content = sidebar.querySelector(".tabs-content");
      const combinedHeader = combined.querySelector(".tabs-header");
      const combinedContent = combined.querySelector(".tabs-content");

      if (!header || !content || !combinedHeader || !combinedContent) return;

      Array.from(header.querySelectorAll(".tab-button")).forEach((btn) => {
        btn.setAttribute("data-origin", origin);
        combinedHeader.appendChild(btn);
      });

      Array.from(content.querySelectorAll(".tab-panel")).forEach((panel) => {
        panel.setAttribute("data-origin", origin);
        combinedContent.appendChild(panel);
      });
    }

    function moveTabsBackFromCombined(combined) {
      if (!combined) return;
      const left = document.getElementById("leftSidebar");
      const right = document.getElementById("rightSidebar");
      if (!left || !right) return;

      const leftHeader = left.querySelector(".tabs-header");
      const leftContent = left.querySelector(".tabs-content");
      const rightHeader = right.querySelector(".tabs-header");
      const rightContent = right.querySelector(".tabs-content");

      const combinedHeader = combined.querySelector(".tabs-header");
      const combinedContent = combined.querySelector(".tabs-content");

      if (!leftHeader || !leftContent || !rightHeader || !rightContent || !combinedHeader || !combinedContent) return;

      Array.from(combinedHeader.querySelectorAll(".tab-button")).forEach((btn) => {
        const origin = btn.getAttribute("data-origin");
        if (origin === "left") leftHeader.appendChild(btn);
        else if (origin === "right") rightHeader.appendChild(btn);
        btn.removeAttribute("data-origin");
      });

      Array.from(combinedContent.querySelectorAll(".tab-panel")).forEach((panel) => {
        const origin = panel.getAttribute("data-origin");
        if (origin === "left") leftContent.appendChild(panel);
        else if (origin === "right") rightContent.appendChild(panel);
        panel.removeAttribute("data-origin");
      });
    }

    let combinedTabsManager = null;

    function enableCombinedTabs() {
      if (combinedTabsManager) return;
      const leftSidebar = document.getElementById("leftSidebar");
      const rightSidebar = document.getElementById("rightSidebar");
      if (!leftSidebar || !rightSidebar) return;

      try {
        tabManagers.left?.destroy();
        tabManagers.right?.destroy();
      } catch (e) {
        console.warn("No se pudieron destruir los managers anteriores:", e);
      }

      const combined = createCombinedTabsContainer();
      if (!combined) return;

      moveTabsToCombined(leftSidebar, combined, "left");
      moveTabsToCombined(rightSidebar, combined, "right");

      leftSidebar.style.display = "none";
      rightSidebar.style.display = "none";

      combinedTabsManager = new TabManager("bottomTabs");
      combinedTabsManager.restoreLastActiveTab();
      console.log("✅ Pestañas combinadas debajo del canvas");

      // Asegurar que el panel comienza oculto y el toggle sincronizado
      const toggleBtn = document.getElementById('toggleTabsButton');
      const combinedEl = document.getElementById('bottomTabs');
      combinedEl?.classList.remove('open');
      toggleBtn?.setAttribute('aria-expanded', 'false');
    }

    function disableCombinedTabs() {
      const leftSidebar = document.getElementById("leftSidebar");
      const rightSidebar = document.getElementById("rightSidebar");
      const combined = document.getElementById("bottomTabs");

      if (!combined) return;

      try { combinedTabsManager?.destroy(); } catch (e) {}
      combinedTabsManager = null;

      moveTabsBackFromCombined(combined);

      if (leftSidebar) leftSidebar.style.display = "";
      if (rightSidebar) rightSidebar.style.display = "";

      combined.remove();

      tabManagers = initializeTabManagers();
      console.log("↩️ Pestañas restauradas en paneles izquierdo y derecho");
    }

    // Estado inicial
    if (window.innerWidth <= SMALL_WIDTH) {
      enableCombinedTabs();
    }

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
// Redimensionado responsive + combinación/restauración de pestañas en cambios de tamaño
window.addEventListener('resize', debounce(() => {
  responsiveResizeAllPages();
  const SMALL_WIDTH = 1200;
  // Ejecutar combinación/restauración según ancho
  if (window.innerWidth <= SMALL_WIDTH) {
    // Ejecutar dentro de DOMContentLoaded para acceso a managers; si aún no están, ignorar
    if (document.getElementById('bottomTabs')) {
      // ya combinado; nada
    } else {
      // Intentar combinar si el app ya inicializó
      const event = new Event('combineTabsRequest');
      window.dispatchEvent(event);
    }
  } else {
    // Si existe combinado, solicitar restauración
    if (document.getElementById('bottomTabs')) {
      const event = new Event('restoreTabsRequest');
      window.dispatchEvent(event);
    }
  }
}, 150));

// Hooks simples para permitir que el bloque de inicialización escuche solicitudes
window.addEventListener('combineTabsRequest', () => {
  try {
    // Buscar funciones definidas en el ámbito de DOMContentLoaded a través de atributos en window
    // Como fallback, se intenta combinar desde aquí si ya existen los sidebars
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');
    const pagesContainer = document.getElementById('pages-container');
    if (!leftSidebar || !rightSidebar || !pagesContainer) return;
    // Si ya existe, no repetir
    if (document.getElementById('bottomTabs')) return;
    // Crear contenedor combinado básico
    const bottomTabs = document.createElement('div');
    bottomTabs.id = 'bottomTabs';
    bottomTabs.className = 'button-container';
    const header = document.createElement('div');
    header.className = 'tabs-header';
    const content = document.createElement('div');
    content.className = 'tabs-content';
    bottomTabs.appendChild(header);
    bottomTabs.appendChild(content);
    pagesContainer.insertAdjacentElement('afterend', bottomTabs);

    // Estilo overlay deslizante
    bottomTabs.classList.add('overlay');
    bottomTabs.classList.remove('open');
    // Mover elementos
    [
      { el: leftSidebar, origin: 'left' },
      { el: rightSidebar, origin: 'right' }
    ].forEach(({ el, origin }) => {
      const h = el.querySelector('.tabs-header');
      const c = el.querySelector('.tabs-content');
      if (h && c) {
        Array.from(h.querySelectorAll('.tab-button')).forEach((btn) => {
          btn.setAttribute('data-origin', origin);
          header.appendChild(btn);
        });
        Array.from(c.querySelectorAll('.tab-panel')).forEach((panel) => {
          panel.setAttribute('data-origin', origin);
          content.appendChild(panel);
        });
      }
      el.style.display = 'none';
    });

    // Limpiar clases 'active' y listeners previos en el contenedor combinado
    const combinedHeader = bottomTabs.querySelector('.tabs-header');
    const combinedContent = bottomTabs.querySelector('.tabs-content');
    combinedHeader.querySelectorAll('.tab-button').forEach((btn) => {
      btn.classList.remove('active');
      const clone = btn.cloneNode(true);
      // conservar atributos
      Array.from(btn.attributes).forEach(attr => {
        if (!clone.hasAttribute(attr.name)) clone.setAttribute(attr.name, attr.value);
      });
      btn.replaceWith(clone);
    });
    combinedContent.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.remove('active');
    });

    // Inicializar manager simple (único) para las pestañas combinadas
    try {
      const tm = new TabManager('bottomTabs');
      tm.restoreLastActiveTab();
    } catch (e) {}
  } catch (e) {}
});

window.addEventListener('restoreTabsRequest', () => {
  try {
    const combined = document.getElementById('bottomTabs');
    const left = document.getElementById('leftSidebar');
    const right = document.getElementById('rightSidebar');
    if (!combined || !left || !right) return;
    const leftHeader = left.querySelector('.tabs-header');
    const leftContent = left.querySelector('.tabs-content');
    const rightHeader = right.querySelector('.tabs-header');
    const rightContent = right.querySelector('.tabs-content');
    const combinedHeader = combined.querySelector('.tabs-header');
    const combinedContent = combined.querySelector('.tabs-content');
    Array.from(combinedHeader.querySelectorAll('.tab-button')).forEach((btn) => {
      const origin = btn.getAttribute('data-origin');
      if (origin === 'left') leftHeader.appendChild(btn);
      else if (origin === 'right') rightHeader.appendChild(btn);
      btn.removeAttribute('data-origin');
    });
    Array.from(combinedContent.querySelectorAll('.tab-panel')).forEach((panel) => {
      const origin = panel.getAttribute('data-origin');
      if (origin === 'left') leftContent.appendChild(panel);
      else if (origin === 'right') rightContent.appendChild(panel);
      panel.removeAttribute('data-origin');
    });
    left.style.display = '';
    right.style.display = '';
    combined.remove();

    // Limpiar clases 'active' y listeners duplicados en ambos contenedores
    [left, right].forEach((container) => {
      const header = container.querySelector('.tabs-header');
      const content = container.querySelector('.tabs-content');
      header?.querySelectorAll('.tab-button').forEach((btn) => {
        btn.classList.remove('active');
        const clone = btn.cloneNode(true);
        Array.from(btn.attributes).forEach(attr => {
          if (!clone.hasAttribute(attr.name)) clone.setAttribute(attr.name, attr.value);
        });
        btn.replaceWith(clone);
      });
      content?.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.remove('active');
      });
    });

    // Re-inicializar los TabManagers para cada sidebar asegurando una tab activa
    try {
      const leftTM = new TabManager('leftSidebar');
      const rightTM = new TabManager('rightSidebar');
      leftTM.restoreLastActiveTab();
      rightTM.restoreLastActiveTab();
    } catch (e) {}
  } catch (e) {}
});

// Toggle del panel de tabs en pantallas pequeñas
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleTabsButton');
  const SMALL_WIDTH = 1200;

  function updateToggleVisibility() {
    if (!toggleBtn) return;
    toggleBtn.style.display = window.innerWidth <= SMALL_WIDTH ? 'flex' : 'none';
  }

  updateToggleVisibility();

  toggleBtn?.addEventListener('click', () => {
    const combined = document.getElementById('bottomTabs');
    if (!combined) return;
    const isOpen = combined.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  window.addEventListener('resize', debounce(updateToggleVisibility, 150));
});
