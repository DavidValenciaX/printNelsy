import { hideGridLines, restoreGridLines } from '../layout/gridControls.js';

const PRINT_RESOLUTION_DPI = 300;
const SCREEN_DPI = 96;
const SCALE_FACTOR = PRINT_RESOLUTION_DPI / SCREEN_DPI;

export function downloadAsPNG(canvas, marginRect) {
  // Store original opacity
  const originalOpacity = marginRect.opacity;
  
  // Hide grid lines and store their original opacities
  const gridLinesOpacities = hideGridLines(canvas);

  // Make margin invisible for download
  marginRect.opacity = 0;
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: SCALE_FACTOR / canvas.getZoom(),
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "canvas.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Restore margin visibility
  marginRect.opacity = originalOpacity;
  
  // Restore grid lines visibility
  restoreGridLines(canvas, gridLinesOpacities);
  
  canvas.renderAll();
}

/**
 * Descarga todas las páginas como archivos PNG individuales
 * @param {Array} allPages - Array de todas las páginas del sistema
 */
export function downloadAllPagesAsPNG(allPages) {
  if (!allPages || allPages.length === 0) {
    console.warn('No hay páginas para exportar a PNG');
    return;
  }

  console.log(`Exportando ${allPages.length} páginas a PNG...`);

  const originalStates = [];
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

  allPages.forEach((page, pageIndex) => {
    const { fabricCanvas, marginRect } = page;
    
    // Guardar estado original
    const originalOpacity = marginRect.opacity;
    const gridLinesOpacities = hideGridLines(fabricCanvas);
    originalStates.push({ originalOpacity, gridLinesOpacities });

    // Ocultar elementos no imprimibles
    marginRect.opacity = 0;
    fabricCanvas.renderAll();

    // Generar imagen de la página
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: SCALE_FACTOR / fabricCanvas.getZoom(),
    });

    // Crear enlace de descarga
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `pagina-${pageIndex + 1}-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Restaurar estado original de todas las páginas
  allPages.forEach((page, index) => {
    const { fabricCanvas, marginRect } = page;
    const { originalOpacity, gridLinesOpacities } = originalStates[index];
    
    marginRect.opacity = originalOpacity;
    restoreGridLines(fabricCanvas, gridLinesOpacities);
    fabricCanvas.renderAll();
  });

  console.log(`${allPages.length} archivos PNG generados exitosamente`);
} 