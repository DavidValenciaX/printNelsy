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

export function sortImages(images, order = "forward") {
  // Primero, ordena por un criterio estable como el ID para asegurar un orden canónico
  const sortedById = [...images].sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  if (order === "reverse") {
    sortedById.reverse();
  }
  return sortedById;
}

export function arrangeImages(
  canvas,
  images,
  orientation,
  customRows = null,
  customCols = null,
  imageSpacing = 20
) {
  const count = images.length;

  const marginRect = getCurrentMarginRect();
  if (!marginRect) {
    console.error("Margin rect not found for arranging images. Layout may be incorrect.");
    return null; // Return null to indicate error
  }

  const { rows, cols } = calculateGridDimensions(
    count,
    orientation,
    customRows,
    customCols
  );

  const cellWidth = marginRect.width / cols;
  const cellHeight = marginRect.height / rows;

  images.forEach((img, index) => {
    let row, col;
    if (orientation === "rows") {
      row = Math.floor(index / cols);
      col = index % cols;
    } else if (orientation === "cols") {
      col = Math.floor(index / rows);
      row = index % rows;
    }

    const availableWidth = cellWidth - imageSpacing;
    const availableHeight = cellHeight - imageSpacing;

    // Reset angle to 0 unless it's a multiple of 90
    const currentAngle = roundToDecimals(img.angle || 0, 0);
    const newAngle = currentAngle % 90 === 0 ? currentAngle : 0;

    // Determine effective dimensions based on the final orthogonal rotation
    const isSideways = Math.abs(newAngle) % 180 === 90;
    const imageEffectiveWidth = isSideways ? img.height : img.width;
    const imageEffectiveHeight = isSideways ? img.width : img.height;

    // Calculate scale factor to fit the image within the cell
    const scaleFactor = Math.min(
      availableWidth / imageEffectiveWidth,
      availableHeight / imageEffectiveHeight
    );

    img.scale(scaleFactor);

    img.set({
      left: marginRect.left + col * cellWidth + cellWidth / 2,
      top: marginRect.top + row * cellHeight + cellHeight / 2,
      originX: "center",
      originY: "center",
      angle: newAngle,
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