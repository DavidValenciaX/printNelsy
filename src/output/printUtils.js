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

  // Procesar cada página y recopilar las imágenes con su orientación
  const pageImages = [];
  const originalStates = [];

  // Preparar todas las páginas para impresión
  allPages.forEach((page, index) => {
    const { fabricCanvas, marginRect, pageSettings } = page;
    
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

    // Determinar orientación de la página
    const isVertical = pageSettings?.orientation !== false; // Por defecto vertical si no se especifica
    pageImages.push({ dataUrl, isVertical });
  });

  // Crear HTML con todas las páginas, aplicando orientación específica
  const imagesHtml = pageImages
    .map(({ dataUrl, isVertical }, index) => {
      const pageBreakStyle = index < pageImages.length - 1 ? 'page-break-after: always;' : '';
      const orientationClass = isVertical ? 'page-vertical' : 'page-horizontal';
      const pageClass = isVertical ? '' : `page-${index + 1}`;
      
      return `<div class="page-container ${orientationClass} ${pageClass}" style="${pageBreakStyle}">
        <img src="${dataUrl}" style="max-width: 100%; max-height: 100vh; display: block; margin: 0 auto;">
      </div>`;
    })
    .join('\n');

  // Crear estilos CSS dinámicos para orientación de página
  const orientationStyles = pageImages
    .map(({ isVertical }, index) => {
      if (!isVertical) {
        return `@page page-${index + 1} { size: landscape; }`;
      }
      return '';
    })
    .filter(style => style !== '')
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
            ${orientationStyles}
            html, body {
                margin: 0;
                padding: 0;
                height: 100%;
            }
            body {
                text-align: center;
            }
            .page-container {
                width: 100%;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .page-vertical {
                /* Orientación vertical por defecto */
            }
            .page-horizontal {
                /* Para páginas horizontales, ajustar el tamaño */
                width: 100vh;
                height: 100%;
            }
            .page-horizontal img {
                max-width: 100vh;
                max-height: 100%;
            }
            img {
                max-width: 100%;
                max-height: 100vh;
                display: block;
                margin: 0 auto;
            }
            .page-container:last-child {
                page-break-after: avoid;
            }
            @media print {
                .page-container {
                    page-break-inside: avoid;
                }
                .page-horizontal {
                    /* En impresión, usar orientación landscape para páginas horizontales */
                    page-break-before: always;
                }
                .page-horizontal:first-child {
                    page-break-before: avoid;
                }
                /* Aplicar orientación específica para cada página horizontal */
                ${pageImages.map(({ isVertical }, index) => 
                  !isVertical ? `.page-${index + 1} { page: page-${index + 1}; }` : ''
                ).filter(style => style !== '').join('\n')}
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