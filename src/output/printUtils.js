const PRINT_RESOLUTION_DPI = 300;
const SCREEN_DPI = 96;
const SCALE_FACTOR = PRINT_RESOLUTION_DPI / SCREEN_DPI;

export function printCanvas(canvas, marginRect) {
  // Store original opacity
  const originalOpacity = marginRect.opacity;

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
                body {
                    margin: 0;
                    padding: 0;
                }
                img {
                    width: 100%;
                    height: auto;
                    display: block;
                    margin: 0;
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
    marginRect.opacity = originalOpacity;
    canvas.renderAll();
  }, 250);
} 