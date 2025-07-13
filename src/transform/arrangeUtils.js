import { roundToDecimals } from './../utils/mathUtils.js';
import { getCurrentMarginRect } from '../canvas/marginRectManager.js';

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
  const sortedImages = [...images];
  if (order === "reverse") {
    sortedImages.reverse();
  }

  const marginRect = getCurrentMarginRect();
  if (!marginRect) {
    console.error("Margin rect not found for arranging images. Layout may be incorrect.");
    return "grid"; 
  }

  const imageSpacing = 20;

  const { rows, cols } = calculateGridDimensions(
    count,
    orientation,
    customRows,
    customCols
  );

  const cellWidth = marginRect.width / cols;
  const cellHeight = marginRect.height / rows;

  sortedImages.forEach((img, index) => {
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

    const availableWidth = cellWidth - imageSpacing - offsetWidthImageBound;
    const availableHeight = cellHeight - imageSpacing - offsetHeightImageBound;

    // We need to check against the original image dimensions, not the scaled ones
    const scaleFactor = Math.min(
      availableWidth / img.width,
      availableHeight / img.height
    );

    img.scale(scaleFactor);

    img.set({
      left: marginRect.left + col * cellWidth + cellWidth / 2,
      top: marginRect.top + row * cellHeight + cellHeight / 2,
      originX: "center",
      originY: "center",
    });

    canvas.add(img);
  });
  return "grid"; // Return the arrangement status
}

// Nueva función para obtener las dimensiones actuales del grid
export function getCurrentGridDimensions(images, orientation) {
  const count = images.length;
  return calculateGridDimensions(count, orientation);
} 