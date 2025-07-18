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

import { checkOverlap } from './../utils/mathUtils.js';

/**
 * Random collage WITHOUT OVERLAPS
 * ----------------------------------------------------------
 *  • fills the marginRect area with pictures of random sizes
 *  • uses rejection‑sampling + progressive shrinking
 *  • guarantees that no two bounding boxes intersect
 *  • keeps originX / originY at centre (as the rest of the UI does)
 *
 *  Drop‑in replacement for the previous collageArrange()
 */
export function collageArrange(canvas, marginRect, Swal) {
  const images = canvas.getObjects().filter((obj) => obj.type === 'image' || obj.type === 'group');
  if (images.length === 0) {
    Swal.fire({ text: 'Debe haber al menos una imagen en el canvas.', icon: 'warning' });
    return null; // Return null to indicate error
  }

  const config = {
    PADDING: 2,
    MAX_TRIES: 150,
    SHRINK: 0.92,
    MIN_SIZE: 20,
    availW: marginRect.width,
    availH: marginRect.height
  };

  let success = false;
  let globalTargetArea = config.availW * config.availH * 0.80;

  while (!success) {
    const result = attemptCollageLayout(images, globalTargetArea, config, canvas, marginRect);
    success = result.success;
    
    if (!success) {
      globalTargetArea *= 0.92;
    }
  }

  canvas.renderAll();
  optimizeCollageSize(canvas, marginRect);
  centerImages(canvas, marginRect);
  optimizeCollageSize(canvas, marginRect);
  return 'collage'; // Return the arrangement status
}

function attemptCollageLayout(images, globalTargetArea, config, canvas, marginRect) {
  const placedRects = [];
  canvas.remove(...images);

  const shuffled = images.slice().sort(() => 0.5 - Math.random());
  const idealArea = globalTargetArea / shuffled.length;

  for (const img of shuffled) {
    const placed = placeImageWithRetry(img, idealArea, placedRects, config, marginRect);
    if (!placed) {
      return { success: false };
    }
    canvas.add(img);
  }

  return { success: true };
}

function placeImageWithRetry(img, idealArea, placedRects, config, marginRect) {
  const { w, h } = calculateImageSize(img, idealArea, config);
  
  img.set({ 
    scaleX: w / img.width, 
    scaleY: h / img.height, 
    angle: 0,
    originX: 'center', 
    originY: 'center' 
  });

  // Try initial placement
  if (tryPlaceImage(img, w, h, placedRects, config, marginRect)) {
    return true;
  }

  // If failed, try shrinking and placing
  return shrinkAndPlace(img, placedRects, config, marginRect);
}

function calculateImageSize(img, idealArea, config) {
  const area = idealArea * (0.55 + 1.1 * Math.random());
  const ar = img.height / img.width;
  let w = Math.sqrt(area / ar);
  let h = w * ar;

  const maxSide = Math.min(config.availW, config.availH) * 0.70;
  if (w > maxSide) {
    const f = maxSide / w;
    w *= f;
    h *= f;
  }
  if (h > maxSide) {
    const f = maxSide / h;
    w *= f;
    h *= f;
  }

  return { w, h };
}

function tryPlaceImage(img, w, h, placedRects, config, marginRect) {
  for (let tries = 0; tries < config.MAX_TRIES; tries++) {
    const cx = marginRect.left + w / 2 + (Math.random() * (config.availW - w));
    const cy = marginRect.top + h / 2 + (Math.random() * (config.availH - h));
    const rect = makeRect(img, cx, cy);

    if (!placedRects.some(pr => checkOverlap(pr, rect, config.PADDING))) {
      img.set({ left: cx, top: cy });
      placedRects.push(rect);
      return true;
    }
  }
  return false;
}

function shrinkAndPlace(img, placedRects, config, marginRect) {
  while (true) {
    img.scaleX *= config.SHRINK;
    img.scaleY *= config.SHRINK;
    
    const w = img.width * img.scaleX;
    const h = img.height * img.scaleY;

    if (w < config.MIN_SIZE || h < config.MIN_SIZE) {
      return false;
    }

    if (tryPlaceImage(img, w, h, placedRects, config, marginRect)) {
      return true;
    }
  }
}

function makeRect(img, cx, cy) {
  const w = img.width * img.scaleX;
  const h = img.height * img.scaleY;
  return { left: cx - w / 2, top: cy - h / 2, width: w, height: h };
}

/**
 * Check if image overlaps with any other image
 */
function checkOverlapWithOthers(targetImg, images, marginRect) {
  const targetRect = makeRectFromImage(targetImg);
  
  return images.some(img => {
    if (img === targetImg) return false;
    const imgRect = makeRectFromImage(img);
    return checkOverlap(targetRect, imgRect, 2);
  });
}

/**
 * Check if image exceeds margin boundaries
 */
function exceedsMargin(img, marginRect) {
  const rect = makeRectFromImage(img);
  return (
    rect.left < marginRect.left ||
    rect.top < marginRect.top ||
    rect.left + rect.width > marginRect.left + marginRect.width ||
    rect.top + rect.height > marginRect.top + marginRect.height
  );
}

/**
 * Create bounding rect from fabric image
 */
function makeRectFromImage(img) {
  const w = img.width * img.scaleX;
  const h = img.height * img.scaleY;
  return { 
    left: img.left - w / 2, 
    top: img.top - h / 2, 
    width: w, 
    height: h 
  };
}

/**
 * Try to scale image from a specific corner direction
 */
function tryDirectionalScaling(img, direction, growthFactor, images, marginRect) {
  const currentState = {
    scaleX: img.scaleX,
    scaleY: img.scaleY,
    left: img.left,
    top: img.top
  };

  const currentW = img.width * img.scaleX;
  const currentH = img.height * img.scaleY;
  
  const newScaleX = img.scaleX * (1 + growthFactor);
  const newScaleY = img.scaleY * (1 + growthFactor);
  const newW = img.width * newScaleX;
  const newH = img.height * newScaleY;
  
  const deltaW = newW - currentW;
  const deltaH = newH - currentH;
  
  let newLeft = img.left;
  let newTop = img.top;
  
  // Adjust position based on corner direction
  switch (direction) {
    case 1: // Top-left: grow right and down
      newLeft += deltaW / 2;
      newTop += deltaH / 2;
      break;
    case 2: // Top-right: grow left and down
      newLeft -= deltaW / 2;
      newTop += deltaH / 2;
      break;
    case 3: // Bottom-right: grow left and up
      newLeft -= deltaW / 2;
      newTop -= deltaH / 2;
      break;
    case 4: // Bottom-left: grow right and up
      newLeft += deltaW / 2;
      newTop -= deltaH / 2;
      break;
  }

  img.set({ scaleX: newScaleX, scaleY: newScaleY, left: newLeft, top: newTop });
  img.setCoords();

  if (exceedsMargin(img, marginRect) || checkOverlapWithOthers(img, images, marginRect)) {
    img.set(currentState);
    img.setCoords();
    return false;
  }
  return true;
}

/**
 * Attempt to grow an image in all directions
 */
function attemptImageGrowth(img, images, marginRect) {
  const MAX_ITERATIONS = 100;
  const GROWTH_FACTOR = 0.02;
  let hasImprovement = false;

  for (let direction = 1; direction <= 4; direction++) {
    let canGrow = true;
    let iterations = 0;

    while (canGrow && iterations < MAX_ITERATIONS) {
      if (tryDirectionalScaling(img, direction, GROWTH_FACTOR, images, marginRect)) {
        hasImprovement = true;
      } else {
        canGrow = false;
      }
      iterations++;
    }
  }
  return hasImprovement;
}

/**
 * Optimizes the size of images in a collage arrangement to maximize space usage
 * while maintaining no overlaps and staying within margins.
 * Uses directional scaling from each corner for more precise space utilization.
 */
function optimizeCollageSize(canvas, marginRect) {
  const images = canvas.getObjects().filter((obj) => obj.type === 'image' || obj.type === 'group');
  if (images.length === 0) return;

  let globalImprovement = true;
  let passCount = 0;

  while (globalImprovement && passCount < 3) {
    globalImprovement = false;
    
    // Sort images by current size (smaller first for better optimization)
    const sortedImages = images.slice().sort((a, b) => {
      const areaA = (a.width * a.scaleX) * (a.height * a.scaleY);
      const areaB = (b.width * b.scaleX) * (b.height * b.scaleY);
      return areaA - areaB;
    });

    // Try to grow each image in all directions
    for (const img of sortedImages) {
      if (attemptImageGrowth(img, images, marginRect)) {
        globalImprovement = true;
      }
    }
    
    passCount++;
  }

  canvas.renderAll();
}

/**
 * PHASE 3: CENTER IMAGES
 * Moves each image towards the center of the canvas both horizontally and vertically
 * while respecting boundaries and avoiding overlaps with other images.
 */
function centerImages(canvas, marginRect) {
  const images = canvas.getObjects().filter((obj) => obj.type === 'image' || obj.type === 'group');
  if (images.length === 0) return;

  // Calculate canvas centers
  const centerX = marginRect.left + marginRect.width / 2;
  const centerY = marginRect.top + marginRect.height / 2;

  const MOVEMENT_STEP = 1; // Pixels to move per iteration
  const MAX_ITERATIONS = 1000; // Prevent infinite loops

  let globalMovement = true;
  let iterations = 0;

  while (globalMovement && iterations < MAX_ITERATIONS) {
    globalMovement = false;

    for (const img of images) {
      const moved = attemptCenterMovement(img, centerX, centerY, images, marginRect, MOVEMENT_STEP);
      if (moved) {
        globalMovement = true;
      }
    }

    iterations++;
  }

  canvas.renderAll();
}

/**
 * Attempts to move an image towards the center of the canvas
 * @param {fabric.Image} img - The image to move
 * @param {number} centerX - Horizontal center of the canvas
 * @param {number} centerY - Vertical center of the canvas
 * @param {Array} images - All images in the canvas
 * @param {Object} marginRect - Canvas boundaries
 * @param {number} step - Movement step size
 * @returns {boolean} - True if the image was moved, false otherwise
 */
function attemptCenterMovement(img, centerX, centerY, images, marginRect, step) {
  let moved = false;

  // Store current position
  const currentLeft = img.left;
  const currentTop = img.top;

  // Determine movement direction towards center
  const horizontalDirection = Math.sign(centerX - img.left);
  const verticalDirection = Math.sign(centerY - img.top);

  // Try horizontal movement
  if (horizontalDirection !== 0) {
    const newLeft = img.left + (horizontalDirection * step);
    img.set({ left: newLeft });
    img.setCoords();

    if (exceedsMargin(img, marginRect) || checkOverlapWithOthers(img, images, marginRect)) {
      // Revert horizontal movement
      img.set({ left: currentLeft });
      img.setCoords();
    } else {
      moved = true;
    }
  }

  // Try vertical movement
  if (verticalDirection !== 0) {
    const newTop = img.top + (verticalDirection * step);
    img.set({ top: newTop });
    img.setCoords();

    if (exceedsMargin(img, marginRect) || checkOverlapWithOthers(img, images, marginRect)) {
      // Revert vertical movement
      img.set({ top: currentTop });
      img.setCoords();
    } else {
      moved = true;
    }
  }

  return moved;
} 