import { roundToDecimals } from './../utils/mathUtils.js';

export function arrangeImages(canvas, images, orientation, marginWidth, order = "forward", customRows = null, customCols = null) {
  const count = images.length;
  let marginAdjustment = count <= 2 ? 100 : 20;
  const margin = marginWidth + marginAdjustment;

  // Create copy and sort according to order
  const sortedImages = [...images];
  if (order === "reverse") {
    sortedImages.reverse();
  }

  let cols, rows;
  // Add single-column and single-row layout options
  if (orientation === "single-column") {
    cols = 1;
    rows = count;
  } else if (orientation === "single-row") {
    cols = count;
    rows = 1;
  } else if (orientation === "rows") {
    if (customRows !== null && customCols !== null) {
      rows = customRows;
      cols = customCols;
    } else {
      cols = Math.ceil(Math.sqrt(count));
      rows = Math.ceil(count / cols);
    }
  } else if (orientation === "cols") {
    if (customRows !== null && customCols !== null) {
      rows = customRows;
      cols = customCols;
    } else {
      rows = Math.ceil(Math.sqrt(count));
      cols = Math.ceil(count / rows);
    }
  }

  // Adjust cell dimensions based on orientation
  const cellWidth =
    orientation === "single-row"
      ? (canvas.width - margin * 2) / count
      : (canvas.width - margin * 2) / cols;

  const cellHeight =
    orientation === "single-column"
      ? (canvas.height - margin * 2) / count
      : (canvas.height - margin * 2) / rows;

  sortedImages.forEach((img, index) => {
    // Determine row and column without altering permanent id
    let row, col;
    if (orientation === "rows") {
      row = Math.floor(index / cols);
      col = index % cols;
    } else if (orientation === "cols") {
      col = Math.floor(index / rows);
      row = index % rows;
    } else if (orientation === "single-column") {
      col = 0;
      row = index;
    } else if (orientation === "single-row") {
      col = index;
      row = 0;
    }

    let realImageWidth = img.width * img.scaleX;
    let realImageHeight = img.height * img.scaleY;
    let bounds = img.getBoundingRect();

    let roundedBoundsWidth = roundToDecimals(bounds.width, 2);
    let roundedImageWidth = roundToDecimals(realImageWidth, 2);
    const offsetWidthImageBound = roundToDecimals(
      roundedBoundsWidth - roundedImageWidth,
      2
    );

    let roundedBoundsHeight = roundToDecimals(bounds.height, 2);
    let roundedImageHeight = roundToDecimals(realImageHeight, 2);
    const offsetHeightImageBound = roundToDecimals(
      roundedBoundsHeight - roundedImageHeight,
      2
    );

    const scaleFactor = Math.min(
      (cellWidth - margin - offsetWidthImageBound) / img.width,
      (cellHeight - margin - offsetHeightImageBound) / img.height
    );

    img.scale(scaleFactor);
    img.set({
      left: margin + col * cellWidth + cellWidth / 2,
      top: margin + row * cellHeight + cellHeight / 2,
      originX: "center",
      originY: "center",
    });

    // originalImages is kept intact with the original information
    canvas.add(img);
  });

  canvas.renderAll();
  return "grid"; // Return the arrangement status
}

// Nueva función para obtener las dimensiones actuales del grid
export function getCurrentGridDimensions(images, orientation) {
  const count = images.length;
  
  let cols, rows;
  if (orientation === "single-column") {
    cols = 1;
    rows = count;
  } else if (orientation === "single-row") {
    cols = count;
    rows = 1;
  } else if (orientation === "rows") {
    cols = Math.ceil(Math.sqrt(count));
    rows = Math.ceil(count / cols);
  } else if (orientation === "cols") {
    rows = Math.ceil(Math.sqrt(count));
    cols = Math.ceil(count / rows);
  }
  
  return { rows, cols };
} 