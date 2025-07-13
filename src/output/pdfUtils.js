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