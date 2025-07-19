import { jsPDF } from 'jspdf';
import { hideGridLines, restoreGridLines } from '../layout/gridControls.js';

const PRINT_RESOLUTION_DPI = 300;
const SCREEN_DPI = 96;
const SCALE_FACTOR = PRINT_RESOLUTION_DPI / SCREEN_DPI;

export function downloadAsPDF(canvas, marginRect) {
  // Store original opacity
  const originalOpacity = marginRect.opacity;
  
  // Hide grid lines and store their original opacities
  const gridLinesOpacities = hideGridLines(canvas);

  // Make margin invisible for printing
  marginRect.opacity = 0;
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: SCALE_FACTOR / canvas.getZoom(),
  });

    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: [canvas.width, canvas.height]
    });

    doc.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
    doc.save('canvas.pdf');

  // Restore margin visibility
  marginRect.opacity = originalOpacity;
  
  // Restore grid lines visibility
  restoreGridLines(canvas, gridLinesOpacities);
  
  canvas.renderAll();
}

/**
 * Descarga todas las páginas como un PDF multipágina
 * @param {Array} allPages - Array de todas las páginas del sistema
 */
export function downloadAllPagesAsPDF(allPages) {
  if (!allPages || allPages.length === 0) {
    console.warn('No hay páginas para exportar a PDF');
    return;
  }

  console.log(`Exportando ${allPages.length} páginas a PDF...`);

  // Procesar cada página
  const originalStates = [];
  let doc = null;

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

    // Crear o configurar el documento PDF
    if (pageIndex === 0) {
      // Primera página: crear el documento
      const orientation = fabricCanvas.width > fabricCanvas.height ? 'l' : 'p';
      doc = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: [fabricCanvas.width, fabricCanvas.height]
      });
      doc.addImage(dataUrl, 'PNG', 0, 0, fabricCanvas.width, fabricCanvas.height);
    } else {
      // Páginas siguientes: añadir nueva página
      const orientation = fabricCanvas.width > fabricCanvas.height ? 'l' : 'p';
      doc.addPage([fabricCanvas.width, fabricCanvas.height], orientation);
      doc.addImage(dataUrl, 'PNG', 0, 0, fabricCanvas.width, fabricCanvas.height);
    }
  });

  // Guardar el PDF
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  doc.save(`todas-las-paginas-${timestamp}.pdf`);

  // Restaurar estado original de todas las páginas
  allPages.forEach((page, index) => {
    const { fabricCanvas, marginRect } = page;
    const { originalOpacity, gridLinesOpacities } = originalStates[index];
    
    marginRect.opacity = originalOpacity;
    restoreGridLines(fabricCanvas, gridLinesOpacities);
    fabricCanvas.renderAll();
  });

  console.log('PDF multipágina generado exitosamente');
} 