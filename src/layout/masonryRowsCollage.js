export function createMasonryRowsCollage(canvas, marginRect, Swal) {
    const images = canvas.getObjects().filter((obj) => obj.type === "image" || obj.type === "group");
    if (images.length === 0) {
      Swal.fire({
        text: "Debe haber al menos una imagen en el canvas.",
        icon: "warning",
      });
      return null;
    }
  
    const N = images.length;
    const M = Math.max(2, Math.floor(Math.sqrt(N))); // Number of rows
    const gap = 10; // Vertical gap between rows
    const horizontal_gap = 10; // Horizontal gap between images
    const H = (marginRect.height - (M - 1) * gap) / M; // Height of each row
  
    // Step 1: Scale images to fit row height
    images.forEach((img) => {
      img.angle = 0;
      const scale = H / img.height;
      img.scaleX = scale;
      img.scaleY = scale;
      img.setCoords();
    });
  
    // Step 2: Sort images by scaled width (descending)
    const sortedImages = images.slice().sort((a, b) => {
      const W_a = a.width * a.scaleX;
      const W_b = b.width * b.scaleX;
      return W_b - W_a;
    });
  
    // Step 3: Initialize row data
    const rowWidths = new Array(M).fill(0); // Total width of each row
    const rowImages = new Array(M).fill().map(() => []); // Images in each row
  
    // Step 4: Place images in rows
    sortedImages.forEach((img) => {
      // Find the row with the smallest current width
      const minWidth = Math.min(...rowWidths);
      const k = rowWidths.indexOf(minWidth);
      // Calculate position
      const top = marginRect.top + k * (H + gap) + H / 2;
      const W_i = img.width * img.scaleX;
      const left = marginRect.left + rowWidths[k] + W_i / 2;
      img.set({
        left: left,
        top: top,
        originX: "center",
        originY: "center",
      });
      img.setCoords();
      // Update row width and store image
      rowWidths[k] += W_i + horizontal_gap;
      rowImages[k].push(img);
    });
  
    // Step 5: Adjust rows exceeding max width
    const maxAllowedWidth = marginRect.width;
  
    rowWidths.forEach((width, k) => {
      const numImages = rowImages[k].length;
      if (numImages === 0) return;
  
      // Calculate total gaps and original image widths
      const totalGaps = (numImages - 1) * horizontal_gap;
      const totalImageWidth = width - numImages * horizontal_gap; // Subtract gaps added during placement
  
      const availableWidth = maxAllowedWidth - totalGaps;
  
      if (totalImageWidth > availableWidth) {
        const scaleFactor = availableWidth / totalImageWidth;
        let currentLeft = marginRect.left;
  
        // Adjust each image in the row
        rowImages[k].forEach((img) => {
          // Apply scaling
          img.scaleX *= scaleFactor;
          img.scaleY *= scaleFactor;
          // Recalculate width after scaling
          const W_i = img.width * img.scaleX;
          // Set new horizontal position
          img.set({
            left: currentLeft + W_i / 2,
            originX: "center",
            originY: "center",
          });
          img.setCoords();
          // Update position for the next image
          currentLeft += W_i + horizontal_gap;
        });
      }
    });
  
    // Step 6: Render the updated canvas
    canvas.renderAll();
    // Set flag to indicate collage arrangement
    return "rows-collage";
  }