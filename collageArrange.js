import { checkOverlap } from './mathUtils.js';

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
  const images = canvas.getObjects('image');
  if (images.length === 0) {
    Swal.fire({ text: 'Debe haber al menos una imagen en el canvas.', icon: 'warning' });
    return;
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
  const images = canvas.getObjects('image');
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