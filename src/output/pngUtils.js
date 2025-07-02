export function downloadAsPNG(canvas, marginRect) {
  // Store original opacity
  const originalOpacity = marginRect.opacity;

  // Make margin invisible for download
  marginRect.opacity = 0;
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 1 / canvas.getZoom(),
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "canvas.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Restore margin visibility
  marginRect.opacity = originalOpacity;
  canvas.renderAll();
} 