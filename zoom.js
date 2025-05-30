export let currentZoom = 1;
export const zoomFactor = 0.1;
export const maxZoom = 2;
export const minZoom = 0.5;

export function zoomIn() {
  if (currentZoom < maxZoom) {
    currentZoom += zoomFactor;
    applyZoom();
  }
}

export function zoomOut() {
  if (currentZoom > minZoom) {
    currentZoom -= zoomFactor;
    applyZoom();
  }
}

export function applyZoom() {
  const mainContent = document.getElementById("main-content");
  // Anchor scaling from the top center
  mainContent.style.transformOrigin = "top center";
  mainContent.style.transform = `scale(${currentZoom})`;

  // Adjust vertical position if the top is off-screen
  const rect = mainContent.getBoundingClientRect();
  if (rect.top < 0) {
    // Shift main-content down so that it is fully visible
    mainContent.style.position = "relative";
    mainContent.style.top = `${-rect.top}px`;
  } else {
    mainContent.style.top = "0";
  }
} 