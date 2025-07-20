import { hideGridLines, restoreGridLines } from '../layout/gridControls.js';

const PRINT_RESOLUTION_DPI = 300;
const SCREEN_DPI = 96;
const SCALE_FACTOR = PRINT_RESOLUTION_DPI / SCREEN_DPI;

export function printCanvas(canvas, marginRect) {
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

  const windowContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir Canvas</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                @page {
                    margin: 0;
                    size: auto;
                }
                html, body {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                }
                body {
                    text-align: center;
                }
                img {
                    max-width: 100%;
                    max-height: 100%;
                    display: block;
                    margin: 0 auto;
                }
            </style>
        </head>
        <body>
            <img src="${dataUrl}">
        </body>
        </html>`;

  const printWin = window.open("", "", "width=800,height=600");
  printWin.document.documentElement.innerHTML = windowContent;
  printWin.setTimeout(function () {
    printWin.focus();
    printWin.print();
    printWin.close();
    
    // Restore margin visibility
    marginRect.opacity = originalOpacity;
    
    // Restore grid lines visibility
    restoreGridLines(canvas, gridLinesOpacities);
    
    canvas.renderAll();
  }, 250);
}

/**
 * Imprime todos los canvas de todas las páginas
 * @param {Array} allPages - Array de todas las páginas del sistema
 */
export function printAllPages(allPages) {
  if (!allPages || allPages.length === 0) {
    console.warn('No hay páginas para imprimir');
    return;
  }

  

  // Procesar cada página y recopilar las imágenes
  const pageImages = [];
  const originalStates = [];

  // Preparar todas las páginas para impresión
  allPages.forEach((page, index) => {
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

    pageImages.push(dataUrl);
  });

  // Crear HTML con todas las páginas
  const imagesHtml = pageImages
    .map((dataUrl, index) => `<img src="${dataUrl}" style="page-break-after: always; max-width: 100%; max-height: 100%; display: block; margin: 0 auto;">`)
    .join('\n');

  const windowContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Imprimir Todas las Páginas</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            @page {
                margin: 0;
                size: auto;
            }
            html, body {
                margin: 0;
                padding: 0;
                height: 100%;
            }
            body {
                text-align: center;
            }
            img {
                max-width: 100%;
                max-height: 100vh;
                display: block;
                margin: 0 auto;
                page-break-after: always;
            }
            img:last-child {
                page-break-after: avoid;
            }
        </style>
    </head>
    <body>
        ${imagesHtml}
    </body>
    </html>`;

  const printWin = window.open("", "", "width=800,height=600");
  printWin.document.documentElement.innerHTML = windowContent;
  
  printWin.setTimeout(function () {
    printWin.focus();
    printWin.print();
    printWin.close();
    
    // Restaurar estado original de todas las páginas
    allPages.forEach((page, index) => {
      const { fabricCanvas, marginRect } = page;
      const { originalOpacity, gridLinesOpacities } = originalStates[index];
      
      marginRect.opacity = originalOpacity;
      restoreGridLines(fabricCanvas, gridLinesOpacities);
      fabricCanvas.renderAll();
    });
  }, 250);
} 