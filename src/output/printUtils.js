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