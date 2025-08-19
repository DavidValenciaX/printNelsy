export function createMasonryColumnsCollage(canvas, marginRect, Swal) {
    const images = canvas.getObjects().filter((obj) => obj.type === "image" || obj.type === "group");
    if (images.length === 0) {
      Swal.fire({
        text: "Debe haber al menos una imagen en el canvas.",
        icon: "warning",
      });
      return null;
    }
  
    const N = images.length;
    const M = Math.max(2, Math.floor(Math.sqrt(N))); // Number of columns
    const gap = 10; // Horizontal gap between columns
    const vertical_gap = 10; // Vertical gap between images
    const W = (marginRect.width - (M - 1) * gap) / M; // Width of each column
  
    // Step 1: Scale images to fit column width
    images.forEach((img) => {
      img.angle = 0;
      const scale = W / img.width;
      img.scaleX = scale;
      img.scaleY = scale;
      img.setCoords();
    });
  
    // Step 2: Sort images by scaled height (descending)
    const sortedImages = images.slice().sort((a, b) => {
      const H_a = a.height * a.scaleY;
      const H_b = b.height * b.scaleY;
      return H_b - H_a;
    });
  
    // Step 3: Initialize column data
    const columnHeights = new Array(M).fill(0); // Total height of each column
    const columnImages = new Array(M).fill().map(() => []); // Images in each column
  
    // Step 4: Place images in columns
    sortedImages.forEach((img) => {
      // Find the column with the smallest current height
      const minHeight = Math.min(...columnHeights);
      const k = columnHeights.indexOf(minHeight);
      // Calculate position
      const left = marginRect.left + k * (W + gap) + W / 2;
      const H_i = img.height * img.scaleY;
      const top = marginRect.top + columnHeights[k] + H_i / 2;
      img.set({
        left: left,
        top: top,
        originX: "center",
        originY: "center",
      });
      img.setCoords();
      // Update column height and store image
      columnHeights[k] += H_i + vertical_gap;
      columnImages[k].push(img);
    });
  
    // Step 5: Adjust columns exceeding max height
    const maxAllowedHeight = marginRect.height; // Corrected to marginRect.height
  
    columnHeights.forEach((height, k) => {
      const numImages = columnImages[k].length;
      if (numImages === 0) return;
  
      // Calculate total gaps and original image heights
      const totalGaps = (numImages - 1) * vertical_gap;
      const totalImageHeight = height - numImages * vertical_gap; // Subtract gaps added during placement
  
      const availableHeight = maxAllowedHeight - totalGaps;
  
      if (totalImageHeight > availableHeight) {
        const scaleFactor = availableHeight / totalImageHeight;
        let currentTop = marginRect.top;
  
        // Adjust each image in the column
        columnImages[k].forEach((img) => {
          // Apply scaling
          img.scaleX *= scaleFactor;
          img.scaleY *= scaleFactor;
          // Recalculate height after scaling
          const H_i = img.height * img.scaleY;
          // Set new vertical position
          img.set({
            top: currentTop + H_i / 2,
            originX: "center",
            originY: "center",
          });
          img.setCoords();
          // Update position for the next image
          currentTop += H_i + vertical_gap;
        });
      }
    });
  
    // Step 6: Render the updated canvas
    canvas.renderAll();
    // Set flag to indicate collage arrangement
    return "columns-collage";
  }
  
  