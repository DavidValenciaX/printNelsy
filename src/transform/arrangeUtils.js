import { roundToDecimals } from './../utils/mathUtils.js';

export function calculateGridDimensions(
  count,
  orientation,
  customRows = null,
  customCols = null
) {
  if (customRows !== null && customCols !== null) {
    return { rows: customRows, cols: customCols };
  }

  let cols, rows;
  if (orientation === "rows") {
    cols = Math.ceil(Math.sqrt(count));
    rows = Math.ceil(count / cols);
  } else if (orientation === "cols") {
    rows = Math.ceil(Math.sqrt(count));
    cols = Math.ceil(count / rows);
  }

  return { rows, cols };
}

export function arrangeImages(
  canvas,
  images,
  orientation,
  marginWidth,
  order = "forward",
  customRows = null,
  customCols = null
) {
  const count = images.length;
  let marginAdjustment = count <= 2 ? 100 : 20;
  const margin = marginWidth + marginAdjustment;

  // Create copy and sort according to order
  const sortedImages = [...images];
  if (order === "reverse") {
    sortedImages.reverse();
  }

  const { rows, cols } = calculateGridDimensions(
    count,
    orientation,
    customRows,
    customCols
  );

  // Adjust cell dimensions based on orientation
  const cellWidth = (canvas.width - margin * 2) / cols;

  const cellHeight = (canvas.height - margin * 2) / rows;

  sortedImages.forEach((img, index) => {
    // Determine row and column without altering permanent id
    let row, col;
    if (orientation === "rows") {
      row = Math.floor(index / cols);
      col = index % cols;
    } else if (orientation === "cols") {
      col = Math.floor(index / rows);
      row = index % rows;
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
  return "grid"; // Return the arrangement status
}

// Nueva función para obtener las dimensiones actuales del grid
export function getCurrentGridDimensions(images, orientation) {
  const count = images.length;
  return calculateGridDimensions(count, orientation);
} 