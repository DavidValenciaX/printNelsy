let currentZoom = 1;
const zoomFactor = 0.1;
const maxZoom = 2;
const minZoom = 0.5;

function zoomIn() {
  if (currentZoom < maxZoom) {
    currentZoom += zoomFactor;
    applyZoom();
  }
}

function zoomOut() {
  if (currentZoom > minZoom) {
    currentZoom -= zoomFactor;
    applyZoom();
  }
}

function applyZoom() {
  const mainContent = document.getElementById("main-content");
  // Anchor scaling from the top center
  mainContent.style.transformOrigin = "top center";
  mainContent.style.transform = `scale(${currentZoom})`;

  // Adjust vertical position if the top is off-screen
  const rect = mainContent.getBoundingClientRect();
  if (rect.top < 0) {
    // Shift main-content down so that it is fully visible
    mainContent.style.position = "relative";
    mainContent.style.top = `${-rect.top}px`;
  } else {
    mainContent.style.top = "0";
  }
}

const canvasElement = document.getElementById("canvas");
let canvas = new fabric.Canvas("canvas");
const imageLoader = document.getElementById("imageLoader");
const deleteButton = document.getElementById("deleteButton");
const printButton = document.getElementById("printButton");
const cartaButton = document.getElementById("cartaButton");
const oficioButton = document.getElementById("oficioButton");
const a4Button = document.getElementById("a4Button");
const verticalButton = document.getElementById("verticalButton");
const horizontalButton = document.getElementById("horizontalButton");
const rotateButton_p90 = document.getElementById("rotateButton+90");
const rotateButton_n90 = document.getElementById("rotateButton-90");
const resetImageButton = document.getElementById("resetImageButton");
const arrangeButton = document.getElementById("arrangeButton");
const cropButton = document.getElementById("cropButton");
const confirmCropButton = document.getElementById("confirmCrop");
const cancelCropButton = document.getElementById("cancelCrop");
const rotateCheckbox = document.getElementById("rotateControl");
const grayScaleButton = document.getElementById("grayScaleButton");
const scaleUpButton = document.getElementById("scaleUpButton");
const scaleDownButton = document.getElementById("scaleDownButton");
const centerVerticallyButton = document.getElementById(
  "centerVerticallyButton"
);
const centerHorizontallyButton = document.getElementById(
  "centerHorizontallyButton"
);
const setSizeButton = document.getElementById("setSizeButton");
const columnsCollageButton = document.getElementById("columnsCollageButton");
const rowsCollageButton = document.getElementById("rowsCollageButton");
const collageButton = document.getElementById("collageButton");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");

const dpi = 300;
const marginInches = 0.2;
const marginPixels = marginInches * dpi;
const paperSizes = {
  carta: { width: 8.5 * dpi, height: 11 * dpi },
  oficio: { width: 8.5 * dpi, height: 13 * dpi },
  a4: { width: 8.27 * dpi, height: 11.69 * dpi },
};

let currentSize = "carta";
let isVertical = true;
let marginRect;

let cropRect = null;
let activeImage = null;
let isCropping = false;
let inactivatedObjects = [];

function createMasonryColumnsCollage() {
  const images = canvas.getObjects("image");
  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
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
  arrangementStatus = "columns-collage";
}

function createMasonryRowsCollage() {
  const images = canvas.getObjects("image");
  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
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
  arrangementStatus = "rows-collage";
}

function collageArrange() {
  const images = canvas.getObjects("image");
  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
  }

  // Class definitions for collage layout
  class Photo {
    constructor(fabricImage, w, h, orientation = 0) {
      this.fabricImage = fabricImage;
      this.w = w;
      this.h = h;
      this.orientation = orientation;
      this.offset_w = 0.5;
      this.offset_h = 0.5;
    }
    
    get ratio() {
      return this.h / this.w;
    }
  }

  class Cell {
    constructor(parents, photo) {
      this.parents = parents;
      this.photo = photo;
      this.extent = null;
      this.h = this.w * this.wantedRatio;
    }
    
    get x() {
      return this.parents[0].x;
    }
    
    get y() {
      let prev = null;
      for (const c of this.parents[0].cells) {
        if (this === c) {
          if (prev) {
            return prev.y + prev.h;
          }
          return 0;
        }
        prev = c;
      }
      return 0;
    }
    
    get w() {
      return this.parents.reduce((sum, c) => sum + c.w, 0);
    }
    
    get ratio() {
      return this.h / this.w;
    }
    
    get wantedRatio() {
      return this.photo.ratio;
    }
    
    scale(alpha) {
      this.h *= alpha;
    }
    
    isExtended() {
      return this.extent !== null;
    }
    
    isExtension() {
      return false;
    }
    
    contentCoords() {
      let x, y, w, h;
      
      // If the contained image is too thick to fit
      if (this.wantedRatio < this.ratio) {
        h = this.h;
        w = this.h / this.wantedRatio;
        y = this.y;
        x = this.x - (w - this.w) / 2.0;
      } 
      // If the contained image is too tall to fit
      else if (this.wantedRatio > this.ratio) {
        w = this.w;
        h = this.w * this.wantedRatio;
        x = this.x;
        y = this.y - (h - this.h) / 2.0;
      } else {
        w = this.w;
        h = this.h;
        x = this.x;
        y = this.y;
      }
      
      return [x, y, w, h];
    }
    
    topNeighbor() {
      let prev = null;
      for (const c of this.parents[0].cells) {
        if (this === c) {
          return prev;
        }
        prev = c;
      }
      return null;
    }
    
    bottomNeighbor() {
      let prev = null;
      for (let i = this.parents[0].cells.length - 1; i >= 0; i--) {
        const c = this.parents[0].cells[i];
        if (this === c) {
          return prev;
        }
        prev = c;
      }
      return null;
    }
  }

  class CellExtent {
    constructor(cell) {
      this.origin = cell;
      this.origin.extent = this;
    }
    
    get parents() {
      return [this.origin.parents[1]];
    }
    
    get photo() {
      return this.origin.photo;
    }
    
    get y() {
      return this.origin.y;
    }
    
    get h() {
      return this.origin.h;
    }
    
    get x() {
      return this.parents[0].x;
    }
    
    get w() {
      return this.parents[0].w;
    }
    
    scale(alpha) {
      // No scaling needed for extents
    }
    
    isExtended() {
      return false;
    }
    
    isExtension() {
      return true;
    }
    
    topNeighbor() {
      let prev = null;
      for (const c of this.parents[0].cells) {
        if (this === c) {
          return prev;
        }
        prev = c;
      }
      return null;
    }
    
    bottomNeighbor() {
      let prev = null;
      for (let i = this.parents[0].cells.length - 1; i >= 0; i--) {
        const c = this.parents[0].cells[i];
        if (this === c) {
          return prev;
        }
        prev = c;
      }
      return null;
    }
  }

  class Column {
    constructor(parent, w) {
      this.parent = parent;
      this.cells = [];
      this.w = w;
    }
    
    get h() {
      if (this.cells.length === 0) {
        return 0;
      }
      return this.cells[this.cells.length - 1].y + this.cells[this.cells.length - 1].h;
    }
    
    get x() {
      let x = 0;
      for (const c of this.parent.cols) {
        if (this === c) {
          break;
        }
        x += c.w;
      }
      return x;
    }
    
    scale(alpha) {
      this.w *= alpha;
      for (const c of this.cells) {
        c.scale(alpha);
      }
    }
    
    leftNeighbor() {
      let prev = null;
      for (const c of this.parent.cols) {
        if (this === c) {
          return prev;
        }
        prev = c;
      }
      return null;
    }
    
    rightNeighbor() {
      let prev = null;
      for (let i = this.parent.cols.length - 1; i >= 0; i--) {
        const c = this.parent.cols[i];
        if (this === c) {
          return prev;
        }
        prev = c;
      }
      return null;
    }
    
    adjustHeight(targetH) {
      // Group class for handling cell groups
      class Group {
        constructor(y) {
          this.y = y;
          this.h = 0;
          this.cells = [];
        }
      }
      
      const groups = [new Group(0)];
      for (const c of this.cells) {
        // While a cell extent is not reached, keep adding cells to the group
        if (!c.isExtension()) {
          groups[groups.length - 1].cells.push(c);
        } else {
          // Close current group and create a new one
          groups[groups.length - 1].h = c.y - groups[groups.length - 1].y;
          groups.push(new Group(c.y + c.h));
        }
      }
      groups[groups.length - 1].h = targetH - groups[groups.length - 1].y;
      
      // Adjust height for each group independently
      for (const group of groups) {
        if (group.cells.length === 0) continue;
        
        const totalHeight = group.cells.reduce((sum, c) => sum + c.h, 0);
        if (totalHeight === 0) continue;
        
        const alpha = group.h / totalHeight;
        for (const c of group.cells) {
          c.h = c.h * alpha;
        }
      }
    }
  }

  class Page {
    constructor(w, targetRatio, noCols) {
      this.targetRatio = targetRatio;
      const colW = w / noCols;
      this.cols = [];
      for (let i = 0; i < noCols; i++) {
        this.cols.push(new Column(this, colW));
      }
    }
    
    get w() {
      return this.cols.reduce((sum, c) => sum + c.w, 0);
    }
    
    get h() {
      return Math.max(...this.cols.map(c => c.h), 0);
    }
    
    get ratio() {
      return this.h / this.w;
    }
    
    scale(alpha) {
      for (const c of this.cols) {
        c.scale(alpha);
      }
    }
    
    scaleToFit(maxW, maxH = null) {
      if (maxH === null || this.w * maxH > this.h * maxW) {
        this.scale(maxW / this.w);
      } else {
        this.scale(maxH / this.h);
      }
    }
    
    nextFreeCol() {
      const heights = this.cols.map(c => c.h);
      const minimum = Math.min(...heights);
      const candidates = this.cols.filter(c => c.h === minimum);
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    addCellSingleCol(col, photo) {
      col.cells.push(new Cell([col], photo));
    }
    
    addCellMultiCol(col1, col2, photo) {
      const cell = new Cell([col1, col2], photo);
      const extent = new CellExtent(cell);
      col1.cells.push(cell);
      col2.cells.push(extent);
    }
    
    addCell(photo) {
      const col = this.nextFreeCol();
      const left = col.leftNeighbor();
      const right = col.rightNeighbor();
      
      if (2 * Math.random() > photo.ratio) {
        if (left && Math.abs(col.h - left.h) < 0.5 * col.w) {
          return this.addCellMultiCol(left, col, photo);
        } else if (right && Math.abs(col.h - right.h) < 0.5 * col.w) {
          return this.addCellMultiCol(col, right, photo);
        }
      }
      
      this.addCellSingleCol(col, photo);
    }
    
    removeEmptyCols() {
      let i = 0;
      while (i < this.cols.length) {
        if (this.cols[i].cells.length === 0) {
          this.cols.splice(i, 1);
        } else {
          i++;
        }
      }
    }
    
    removeBottomHoles() {
      for (const col of this.cols) {
        if (col.cells.length <= 1) continue;
        
        const cell = col.cells[col.cells.length - 1];
        
        // Case A: If cell is not extended/extension
        if (!cell.isExtended() && !cell.isExtension()) {
          const topNeighbor = cell.topNeighbor();
          // Case A1: top neighbor is extended to right
          if (topNeighbor && topNeighbor.isExtended() && 
              topNeighbor.extent && 
              !topNeighbor.extent.bottomNeighbor()) {
            // Extend cell to right
            if (col.rightNeighbor()) {
              const extent = new CellExtent(cell);
              col.rightNeighbor().cells.push(extent);
              cell.parents = [col, col.rightNeighbor()];
            }
          }
          // Case A2: top neighbor is extension from left
          else if (topNeighbor && topNeighbor.isExtension() && 
                  topNeighbor.origin && 
                  !topNeighbor.origin.bottomNeighbor()) {
            // Extend cell to left
            if (col.leftNeighbor()) {
              col.cells.splice(col.cells.indexOf(cell), 1);
              col.leftNeighbor().cells.push(cell);
              const extent = new CellExtent(cell);
              col.cells.push(extent);
              cell.parents = [col.leftNeighbor(), col];
            }
          }
        }
        // Case B: If cell is extended
        else if (cell.isExtended() && !cell.extent.bottomNeighbor()) {
          const extentTopNeighbor = cell.extent.topNeighbor();
          // Case B1: extent's top neighbor is extended to right
          if (extentTopNeighbor && extentTopNeighbor.isExtended() && 
              extentTopNeighbor.extent && 
              !extentTopNeighbor.extent.bottomNeighbor()) {
            // Move cell to right
            const rightCol = col.rightNeighbor();
            const rightRightCol = rightCol?.rightNeighbor();
            if (rightCol && rightRightCol) {
              col.cells.splice(col.cells.indexOf(cell), 1);
              rightCol.cells.splice(rightCol.cells.indexOf(cell.extent), 1);
              rightCol.cells.push(cell);
              rightRightCol.cells.push(cell.extent);
              cell.parents = [rightCol, rightRightCol];
            }
          }
          // Case B2: cell's top neighbor is extension from left
          else if (cell.topNeighbor() && cell.topNeighbor().isExtension() &&
                  cell.topNeighbor().origin && 
                  !cell.topNeighbor().origin.bottomNeighbor()) {
            // Move cell to left
            const rightCol = col.rightNeighbor();
            const leftCol = col.leftNeighbor();
            if (rightCol && leftCol) {
              col.cells.splice(col.cells.indexOf(cell), 1);
              rightCol.cells.splice(rightCol.cells.indexOf(cell.extent), 1);
              leftCol.cells.push(cell);
              col.cells.push(cell.extent);
              cell.parents = [leftCol, col];
            }
          }
        }
      }
    }
    
    adjustColsHeights() {
      const targetH = this.w * this.targetRatio;
      for (const c of this.cols) {
        c.adjustHeight(targetH);
      }
    }
    
    adjust() {
      this.removeEmptyCols();
      this.removeBottomHoles();
      this.adjustColsHeights();
    }
  }

  // Calculate target aspect ratio based on canvas dimensions
  const targetRatio = marginRect.height / marginRect.width;
  
  // Calculate number of columns based on number of images
  const noCols = Math.max(2, Math.min(4, Math.floor(Math.sqrt(images.length))));
  
  // Create page for collage
  const page = new Page(marginRect.width, targetRatio, noCols);
  
  // Create Photo objects
  const photos = images.map(img => {
    // Use actual dimensions and account for scaling
    const w = img.width * img.scaleX;
    const h = img.height * img.scaleY;
    return new Photo(img, w, h, img.angle);
  });
  
  // Add photos to page
  photos.forEach(photo => {
    page.addCell(photo);
  });
  
  // Adjust page layout
  page.adjust();
  
  // Scale page to fit within margins
  page.scaleToFit(marginRect.width, marginRect.height);
  
  // Apply calculated positions to fabric.js canvas objects
  for (const col of page.cols) {
    for (const cell of col.cells) {
      // Skip extension cells - they're just placeholders
      if (cell.isExtension()) continue;
      
      const [x, y, w, h] = cell.contentCoords();
      const fabricImage = cell.photo.fabricImage;
      
      // Scale image to fit cell
      const scaleX = w / fabricImage.width;
      const scaleY = h / fabricImage.height;
      
      // Position image accounting for canvas scale
      fabricImage.set({
        left: marginRect.left + x,
        top: marginRect.top + y,
        scaleX: scaleX,
        scaleY: scaleY,
        originX: 'left',
        originY: 'top',
        angle: 0, // Reset rotation
      });
      
      fabricImage.setCoords();
    }
  }
  
  canvas.renderAll();
  arrangementStatus = "collage";
}

function setImageSizeInCm() {
  const activeObjects = canvas.getActiveObjects();
  const selectedImages = activeObjects.filter((obj) => obj.type === "image");

  if (selectedImages.length === 0) {
    Swal.fire({
      text: "Seleccione primero una o más imágenes.",
      icon: "warning",
    });
    return;
  }

  // Sólo se descarta la selección si son varias imágenes
  if (selectedImages.length > 1) {
    canvas.discardActiveObject();
  }

  selectedImages.forEach((obj) => {
    if (obj.type === "image") {
      // Ensure origin is set to center for individual scaling
      obj.set({
        originX: "center",
        originY: "center",
      });
      setSingleImageSizeInCm(obj);
    }
  });

  widthInput.value = "";
  heightInput.value = "";
}

function setSingleImageSizeInCm(selectedImage) {
  // Obtener los valores de ancho y alto ingresados
  const widthInputValue = widthInput.value;
  const heightInputValue = heightInput.value;
  const maintainAspect = document.getElementById(
    "maintainAspectCheckbox"
  ).checked;

  // Ajustar dimensiones del papel según orientación
  let paperWidth = paperSizes[currentSize].width;
  let paperHeight = paperSizes[currentSize].height;
  if (!isVertical) {
    [paperWidth, paperHeight] = [paperHeight, paperWidth];
  }
  // Se utilizan escalas separadas para ancho y alto
  const canvasScaleX = canvas.getWidth() / paperWidth;
  const canvasScaleY = canvas.getHeight() / paperHeight;

  const originalTop = selectedImage.top;
  const originalLeft = selectedImage.left;
  const originalScaleX = selectedImage.scaleX;
  const originalScaleY = selectedImage.scaleY;

  let newScaleX = originalScaleX;
  let newScaleY = originalScaleY;
  let updated = false;

  // Si se debe mantener la relación de aspecto,
  // se utiliza la medida ingresada (si está) para calcular un factor uniforme.
  if (maintainAspect) {
    if (widthInputValue) {
      const cmWidth = parseFloat(widthInputValue);
      if (isNaN(cmWidth) || cmWidth <= 0) {
        Swal.fire({
          text: "Introduzca una anchura válida en centímetros.",
          icon: "warning",
        });
        widthInput.value = "";
        return;
      }
      const targetWidthPixels = (cmWidth / 2.54) * dpi;
      const uniformScale =
        (targetWidthPixels * canvasScaleX) / selectedImage.width;
      newScaleX = uniformScale;
      newScaleY = uniformScale;
      updated = true;
    } else if (heightInputValue) {
      const cmHeight = parseFloat(heightInputValue);
      if (isNaN(cmHeight) || cmHeight <= 0) {
        Swal.fire({
          text: "Introduzca una altura válida en centímetros.",
          icon: "warning",
        });
        heightInput.value = "";
        return;
      }
      const targetHeightPixels = (cmHeight / 2.54) * dpi;
      const uniformScale =
        (targetHeightPixels * canvasScaleY) / selectedImage.height;
      newScaleX = uniformScale;
      newScaleY = uniformScale;
      updated = true;
    }
  } else {
    if (widthInputValue) {
      const cmWidth = parseFloat(widthInputValue);
      if (isNaN(cmWidth) || cmWidth <= 0) {
        Swal.fire({
          text: "Introduzca una anchura válida en centímetros.",
          icon: "warning",
        });
        widthInput.value = "";
        return;
      }
      const targetWidthPixels = (cmWidth / 2.54) * dpi;
      newScaleX = (targetWidthPixels * canvasScaleX) / selectedImage.width;
      updated = true;
    }
    if (heightInputValue) {
      const cmHeight = parseFloat(heightInputValue);
      if (isNaN(cmHeight) || cmHeight <= 0) {
        Swal.fire({
          text: "Introduzca una altura válida en centímetros.",
          icon: "warning",
        });
        heightInput.value = "";
        return;
      }
      const targetHeightPixels = (cmHeight / 2.54) * dpi;
      newScaleY = (targetHeightPixels * canvasScaleY) / selectedImage.height;
      updated = true;
    }
  }

  if (!updated) {
    Swal.fire({
      text: "Introduzca al menos una medida válida.",
      icon: "warning",
    });
    widthInput.value = "";
    heightInput.value = "";
    return;
  }

  // Aplica las nuevas escalas
  selectedImage.scaleX = newScaleX;
  selectedImage.scaleY = newScaleY;
  selectedImage.setCoords();

  // Se recalcula primero el bounding rect y se intenta ajustar
  let br = selectedImage.getBoundingRect();
  if (
    br.left < marginRect.left ||
    br.top < marginRect.top ||
    br.left + br.width > marginRect.left + marginRect.width ||
    br.top + br.height > marginRect.top + marginRect.height
  ) {
    constrainObjectToMargin(selectedImage, marginRect);
    // Recalcula el bounding rect luego de ajustar la posición
    br = selectedImage.getBoundingRect();
  }

  // Si tras el ajuste la imagen sigue saliéndose, se revierte al estado original
  if (
    br.left < marginRect.left ||
    br.top < marginRect.top ||
    br.left + br.width > marginRect.left + marginRect.width ||
    br.top + br.height > marginRect.top + marginRect.height
  ) {
    selectedImage.top = originalTop;
    selectedImage.left = originalLeft;
    selectedImage.scaleX = originalScaleX;
    selectedImage.scaleY = originalScaleY;
    selectedImage.setCoords();
    Swal.fire({
      text: "El tamaño deseado excede el límite de los márgenes.",
      icon: "warning",
    });
    canvas.renderAll();
    return;
  }

  canvas.renderAll();
}

function centerVertically() {
  const activeObjects = canvas.getActiveObjects();
  const selectedImages = activeObjects.filter((obj) => obj.type === "image");

  if (selectedImages.length === 0) {
    Swal.fire({
      text: "Seleccione primero una o más imágenes.",
      icon: "warning",
    });
    return;
  }

  // Si se han seleccionado varias imágenes, se descarta el objeto activo para tratar cada una individualmente
  if (selectedImages.length > 1) {
    canvas.discardActiveObject();
  }

  const canvasHeight = canvas.getHeight();
  const centerY = canvasHeight / 2;

  selectedImages.forEach((image) => {
    image.set({
      top: centerY,
      originY: "center",
    });
    image.setCoords();
  });

  canvas.renderAll();
}

function centerHorizontally() {
  const activeObjects = canvas.getActiveObjects();
  const selectedImages = activeObjects.filter((obj) => obj.type === "image");

  if (selectedImages.length === 0) {
    Swal.fire({
      text: "Seleccione primero una o más imágenes.",
      icon: "warning",
    });
    return;
  }

  // Si se han seleccionado varias imágenes, se descarta el objeto activo para tratar cada una individualmente
  if (selectedImages.length > 1) {
    canvas.discardActiveObject();
  }

  const canvasWidth = canvas.getWidth();
  const centerX = canvasWidth / 2;

  selectedImages.forEach((image) => {
    image.set({
      left: centerX,
      originX: "center",
    });
    image.setCoords();
  });

  canvas.renderAll();
}

const SCALE_FACTOR = 0.01;

function disableOtherObjects() {
  canvas.getObjects().forEach((obj) => {
    if (obj !== cropRect && obj !== marginRect) {
      inactivatedObjects.push({
        object: obj,
        originalOpacity: obj.opacity,
      });

      if (obj !== activeImage) {
        obj.set({
          opacity: 0.3,
        });
      }
      obj.set({
        selectable: false,
        evented: false,
      });
    }
  });
  canvas.requestRenderAll();
}

// Modify the restore function
function restoreOtherObjects() {
  inactivatedObjects.forEach((item) => {
    // Don't restore properties for background
    if (item.object.name !== "background") {
      item.object.set({
        opacity: item.originalOpacity,
        selectable: true,
        evented: true,
      });
    }
  });
  inactivatedObjects = [];
  canvas.requestRenderAll();
}

function enterCropMode(imgObject) {
  activeImage = imgObject;
  isCropping = true;

  // Get image bounding rect
  const bounds = imgObject.getBoundingRect();

  // Create crop rect using bounds
  cropRect = new fabric.Rect({
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    fill: "transparent",
    stroke: "#000",
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    absolutePositioned: true,
    transparentCorners: false,
    cornerColor: "DodgerBlue",
    cornerStyle: "circle",
    cornerSize: 12,
    cornerStrokeColor: "Blue",
  });

  canvas.add(cropRect);

  // Bring both objects to front
  imgObject.bringToFront();
  cropRect.bringToFront();

  // Disable other objects
  disableOtherObjects();

  canvas.setActiveObject(cropRect);

  // Show crop control buttons
  confirmCropButton.style.display = "inline";
  cancelCropButton.style.display = "inline";
  cropButton.style.display = "none";
}

// Add this global variable at the top of your script
let canvasBackground = null;

// Modify the background creation function
function createCanvasBackground() {
  // Remove existing background if it exists
  if (canvasBackground) {
    canvas.remove(canvasBackground);
  }

  canvasBackground = new fabric.Rect({
    left: 0,
    top: 0,
    width: canvas.width,
    height: canvas.height,
    fill: "white",
    selectable: false,
    evented: false,
    name: "background", // Add an identifier
  });

  canvas.add(canvasBackground);
  canvas.sendToBack(canvasBackground);
}

function confirmCrop() {
  if (!isCropping || !cropRect || !activeImage) {
    Swal.fire({
      text: "Seleccione primero una imagen y active el modo de recorte.",
      icon: "warning",
    });
    return;
  }

  // Get the cropping rect and original image's ID
  const rect = cropRect;
  const img = activeImage;
  const originalId = img.id; // Save original ID

  // Set the crop rect stroke to transparent so that it doesn't bleed into the final image
  rect.set("stroke", "transparent");

  // Create a background to fill the canvas with white color
  createCanvasBackground();

  // Hide other objects
  canvas.getObjects().forEach((obj) => {
    if (
      obj !== cropRect &&
      obj !== marginRect &&
      obj !== activeImage &&
      obj !== canvasBackground
    ) {
      obj.set({
        opacity: 0,
      });
    }
  });

  // Create new cropped image
  const cropped = new Image();
  cropped.src = canvas.toDataURL({
    left: rect.left,
    top: rect.top,
    width: rect.width * rect.scaleX,
    height: rect.height * rect.scaleY,
  });

  cropped.onload = function () {
    // Remove old image and crop rect
    canvas.remove(img);
    canvas.remove(rect);

    // Create and add new cropped image
    const newImage = new fabric.Image(cropped);
    newImage.set({
      id: originalId, // Transfer the original ID
      left: rect.left,
      top: rect.top,
    });

    // Set rotation control visibility based on checkbox state
    newImage.setControlsVisibility({
      mtr: rotateCheckbox.checked,
    });

    newImage.setCoords();
    canvas.add(newImage);
    canvas.renderAll();
  };

  exitCropMode();
}

function exitCropMode() {
  if (cropRect) {
    canvas.remove(cropRect);
    cropRect = null;
  }

  isCropping = false;
  activeImage = null;

  // Restore other objects
  restoreOtherObjects();

  // Hide crop control buttons
  confirmCropButton.style.display = "none";
  cancelCropButton.style.display = "none";
  cropButton.style.display = "inline";
}

function deactivateObjects(event) {
  // Si event.target es nulo, deseleccionar directamente
  if (!event.target) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    return;
  }

  const canvasElement = canvas.getElement();
  const isOnCanvasElement = event.target === canvasElement;
  const isOnFabricControls =
    event.target.classList.contains("canvas-container") ||
    event.target.classList.contains("upper-canvas") ||
    event.target.classList.contains("lower-canvas");
  const isOnButton =
    event.target.tagName === "BUTTON" ||
    event.target.closest("button") !== null;

  const isOnCheckbox =
    event.target.tagName === "INPUT" && event.target.type === "checkbox";

  const isOnInputNumber =
    event.target.tagName === "INPUT" && event.target.type === "number";

  const isOnCheckBoxLabel =
    event.target.tagName === "LABEL" &&
    event.target.htmlFor === "rotateControl";

  if (
    !isOnCanvasElement &&
    !isOnFabricControls &&
    !isOnButton &&
    !isOnCheckbox &&
    !isOnCheckBoxLabel &&
    !isOnInputNumber
  ) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }
}

function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

function radToDeg(radians) {
  return radians * (180 / Math.PI);
}

function resizeCanvas(size, orientation = isVertical) {
  // Store current canvas state
  const images = canvas.getObjects().filter((obj) => obj.type === "image");
  const currentLayout = lastLayout || (images.length <= 2 ? "cols" : "rows");
  const currentDirection = "forward";

  // Remove all images from canvas
  images.forEach((img) => canvas.remove(img));

  // Update canvas dimensions
  currentSize = size;
  isVertical = orientation;
  const scale = 0.3;
  let width = paperSizes[size].width;
  let height = paperSizes[size].height;

  if (!isVertical) {
    [width, height] = [height, width];
  }

  canvas.setWidth(width * scale);
  canvas.setHeight(height * scale);

  // Update margin rectangle
  if (marginRect) {
    canvas.remove(marginRect);
  }

  marginRect = new fabric.Rect({
    width: width * scale - 2 * marginPixels * scale,
    height: height * scale - 2 * marginPixels * scale,
    left: marginPixels * scale,
    top: marginPixels * scale,
    fill: "transparent",
    stroke: "gray",
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false,
  });

  canvas.add(marginRect);

  // Re-add and re-arrange images based on the current arrangement status
  if (images.length > 0) {
    if (arrangementStatus === "grid") {
      // Arrange images in grid layout
      arrangeImages(images, currentLayout, currentDirection);
    } else if (arrangementStatus === "columns-collage") {
      // Re-add images and create collage
      images.forEach((img) => canvas.add(img));
      createMasonryColumnsCollage();
    } else if (arrangementStatus === "rows-collage") {
      // Re-add images and create collage
      images.forEach((img) => canvas.add(img));
      createMasonryRowsCollage();
    }
    else if (arrangementStatus === "none") {
      // Re-add images and keep their positions.
      images.forEach((img) => {
        canvas.add(img);
        // Constrain image position within the new margin
        constrainObjectToMargin(img, marginRect);
      });
    }
  }

  canvas.renderAll();
}

function changeOrientation(vertical) {
  resizeCanvas(currentSize, vertical);
}

// Add this at the top with other variables
const originalImages = {};
// New global flag to track canvas arrangement state: 'none', 'grid', or 'collage'
let arrangementStatus = "none";

function handleImageUpload(e) {
  const files = e.target.files;
  const loadedImages = [];
  let processedCount = 0;

  for (const element of files) {
    const file = element;
    const reader = new FileReader();
    reader.onload = function (event) {
      fabric.Image.fromURL(event.target.result, function (img) {
        // Asignar un id único permanente si no lo tiene
        if (!img.id) {
          const uniqueId = `image-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 11)}`;
          img.id = uniqueId;
        }
        // Guardar la URL de origen
        img.originalUrl = event.target.result;

        img.setControlsVisibility({
          mtr: rotateCheckbox.checked,
        });

        loadedImages.push(img);
        processedCount++;

        if (processedCount === files.length) {
          // Primero, se organiza el layout de las imágenes
          if (files.length <= 2) {
            arrangeImages(loadedImages, "cols", "forward");
            lastLayout = "cols";
            lastDirection = "forward";
          } else {
            arrangeImages(loadedImages, "rows", "forward");
            lastLayout = "rows";
            lastDirection = "forward";
          }

          // Luego, se guardan los datos originales ya con sus valores de top, left, scaleX y scaleY actualizados
          loadedImages.forEach((img) => {
            originalImages[img.id] = {
              url: img.originalUrl,
              width: img.width,
              height: img.height,
              scaleX: img.scaleX,
              scaleY: img.scaleY,
              angle: img.angle,
              left: img.left,
              top: img.top,
            };
          });

          // Seleccionar automáticamente si solo hay una imagen
          if (files.length === 1) {
            canvas.discardActiveObject();
            canvas.setActiveObject(loadedImages[0]);
            canvas.renderAll();
          }
        }
      });
    };
    reader.readAsDataURL(file);
  }
}

// Función para redondear a un número específico de decimales
function roundToDecimals(value, decimals) {
  return Number(value.toFixed(decimals));
}

function arrangeImages(images, orientation, order = "forward") {
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
    cols = Math.ceil(Math.sqrt(count));
    rows = Math.ceil(count / cols);
  } else if (orientation === "cols") {
    rows = Math.ceil(Math.sqrt(count));
    cols = Math.ceil(count / rows);
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
  // Set flag to indicate grid arrangement
  arrangementStatus = "grid";
}

// Reset active image to its original state
function resetActiveImage() {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  // Iterate over each selected image
  activeObjects.forEach((activeObject) => {
    if (!originalImages[activeObject?.id]) {
      Swal.fire({
        text: `No se pudo restablecer la imagen con id ${
          activeObject.id || "n/a"
        }.`,
        icon: "warning",
      });
      return;
    }

    const original = originalImages[activeObject.id];

    fabric.Image.fromURL(original.url, function (img) {
      // Apply original properties to the new image
      img.set({
        id: activeObject.id,
        scaleX: original.scaleX,
        scaleY: original.scaleY,
        angle: 0,
        left: original.left,
        top: original.top,
        originX: "center",
        originY: "center",
      });

      // Si la imagen queda fuera del canvas, se reubica dentro de los márgenes.
      img = constrainObjectToMargin(img, marginRect);

      // Replace old image with the new one
      canvas.remove(activeObject);
      canvas.add(img);
      canvas.renderAll();
    });
  });
  // Clear active selection once reset is complete
  canvas.discardActiveObject();
}

function printCanvas() {
  // Store original opacity
  const originalOpacity = marginRect.opacity;

  // Make margin invisible for printing
  marginRect.opacity = 0;
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 1 / canvas.getZoom(),
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
  printWin.document.open();
  printWin.document.write(windowContent);
  printWin.document.close();
  printWin.setTimeout(function () {
    printWin.focus();
    printWin.print();
    printWin.close();
    marginRect.opacity = originalOpacity;
    canvas.renderAll();
  }, 250);
}

function scaleToFitWithinMargin(obj, marginRect) {
  obj.setCoords();
  const br = obj.getBoundingRect();
  // Si el objeto ya cabe completamente en el margen, no se hace nada.
  if (br.width <= marginRect.width && br.height <= marginRect.height) {
    return;
  }
  // Calcula el factor de escala mínimo necesario para que br quepa en marginRect.
  const scaleFactor = Math.min(
    marginRect.width / br.width,
    marginRect.height / br.height
  );
  // Aplica el factor a la escala actual.
  obj.scaleX *= scaleFactor;
  obj.scaleY *= scaleFactor;
  // Reposiciona para que quede dentro del margen.
  constrainObjectToMargin(obj, marginRect);
  obj.setCoords();
}

function rotateImage(deg) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  activeObject.rotate((activeObject.angle + deg) % 360);
  activeObject.setCoords();

  // Primero se reubica dentro del margen.
  constrainObjectToMargin(activeObject, marginRect);
  // Si el objeto sigue excediendo, se reduce su escala.
  scaleToFitWithinMargin(activeObject, marginRect);

  canvas.renderAll();
}

function deleteActiveObject() {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  Swal.fire({
    title: "Confirmación",
    text: "¿Está seguro de eliminar las imágenes?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  });
}

function convertToGrayscale() {
  const activeObjects = canvas
    .getActiveObjects()
    .filter((obj) => obj.type === "image");
  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }
  activeObjects.forEach((obj) => {
    // Ensure filters property is initialized
    obj.filters = obj.filters || [];
    obj.filters.push(new fabric.Image.filters.Grayscale());
    obj.applyFilters();
  });
  canvas.renderAll();
}

function calculateDistance(x1, y1, x2, y2) {
  // Calculate the difference in x and y coordinates
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Use Pythagorean theorem to calculate distance
  return Math.sqrt(dx * dx + dy * dy);
}

function scaleUp() {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  // Calcular el centro actual de la selección
  const center = activeObject.getCenterPoint();

  // Compute the intended multiplier (uniformly applied to both scaleX and scaleY)
  const intendedMultiplier =
    (activeObject.scaleX + SCALE_FACTOR) / activeObject.scaleX;

  // Obtener el bounding rect actual
  const currentBR = activeObject.getBoundingRect();

  // Margen: límites de la zona en la que se permiten los objetos
  const leftBound = marginRect.left;
  const rightBound = marginRect.left + marginRect.width;
  const topBound = marginRect.top;
  const bottomBound = marginRect.top + marginRect.height;

  // Determinar el multiplicador máximo basado en cada lado, usando el centro calculado
  const maxMultiplierLeft = ((center.x - leftBound) * 2) / currentBR.width;
  const maxMultiplierRight = ((rightBound - center.x) * 2) / currentBR.width;
  const maxMultiplierTop = ((center.y - topBound) * 2) / currentBR.height;
  const maxMultiplierBottom = ((bottomBound - center.y) * 2) / currentBR.height;

  // El multiplicador permitido es el menor de los anteriores
  const allowedMultiplier = Math.min(
    maxMultiplierLeft,
    maxMultiplierRight,
    maxMultiplierTop,
    maxMultiplierBottom
  );

  // Seleccionar el multiplicador final
  const finalMultiplier = Math.min(intendedMultiplier, allowedMultiplier);

  // Si no se puede escalar más, salir
  if (finalMultiplier <= 1) return;

  // Aplicar la escala y reubicar usando el centro original
  activeObject.scaleX *= finalMultiplier;
  activeObject.scaleY *= finalMultiplier;
  activeObject.set({
    left: center.x,
    top: center.y,
    originX: "center",
    originY: "center",
  });

  constrainObjectToMargin(activeObject, marginRect);
  canvas.renderAll();
}

function scaleDown() {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  // Obtiene el centro actual de la selección (ya sea individual o múltiple)
  const center = activeObject.getCenterPoint();

  const currentScaleX = activeObject.scaleX;
  const currentScaleY = activeObject.scaleY;
  // Prevenir escala menor a 0.1 para evitar que el objeto desaparezca
  if (currentScaleX > 0.1 && currentScaleY > 0.1) {
    activeObject.scaleX = currentScaleX - SCALE_FACTOR;
    activeObject.scaleY = currentScaleY - SCALE_FACTOR;

    // Reposicionar el objeto usando su centro actual como referencia
    activeObject.set({
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
    });

    constrainObjectToMargin(activeObject, marginRect);
    canvas.renderAll();
  }
}

let lastLayout = "rows"; // Track layout type (rows/cols)
let lastDirection = "forward"; // Track direction (forward/reverse)

function selectArrangeImageLayout() {
  // 1. Get all current images
  const images = canvas.getObjects().filter((obj) => obj.type === "image");

  if (images.length === 0) {
    Swal.fire({
      text: "Debe haber al menos una imagen en el canvas.",
      icon: "warning",
    });
    return;
  }

  // 2. Remove existing images from canvas
  images.forEach((img) => canvas.remove(img));

  // 3. Determine next arrangement state
  if (lastLayout === "rows" && lastDirection === "forward") {
    arrangeImages(images, "rows", "reverse");
    lastLayout = "rows";
    lastDirection = "reverse";
  } else if (lastLayout === "rows" && lastDirection === "reverse") {
    arrangeImages(images, "cols", "forward");
    lastLayout = "cols";
    lastDirection = "forward";
  } else if (lastLayout === "cols" && lastDirection === "forward") {
    arrangeImages(images, "cols", "reverse");
    lastLayout = "cols";
    lastDirection = "reverse";
  } else if (lastLayout === "cols" && lastDirection === "reverse") {
    arrangeImages(images, "single-column", "forward");
    lastLayout = "single-column";
    lastDirection = "forward";
  } else if (lastLayout === "single-column" && lastDirection === "forward") {
    arrangeImages(images, "single-column", "reverse");
    lastLayout = "single-column";
    lastDirection = "reverse";
  } else if (lastLayout === "single-column" && lastDirection === "reverse") {
    arrangeImages(images, "single-row", "forward");
    lastLayout = "single-row";
    lastDirection = "forward";
  } else if (lastLayout === "single-row" && lastDirection === "forward") {
    arrangeImages(images, "single-row", "reverse");
    lastLayout = "single-row";
    lastDirection = "reverse";
  } else {
    arrangeImages(images, "rows", "forward");
    lastLayout = "rows";
    lastDirection = "forward";
  }

  canvas.renderAll();
}

cartaButton.addEventListener("click", () => resizeCanvas("carta"));
oficioButton.addEventListener("click", () => resizeCanvas("oficio"));
a4Button.addEventListener("click", () => resizeCanvas("a4"));
verticalButton.addEventListener("click", () => changeOrientation(true));
horizontalButton.addEventListener("click", () => changeOrientation(false));

imageLoader.addEventListener("change", handleImageUpload);
resetImageButton.addEventListener("click", resetActiveImage);
printButton.addEventListener("click", printCanvas);
grayScaleButton.addEventListener("click", convertToGrayscale);
rotateButton_p90.addEventListener("click", () => rotateImage(90));
rotateButton_n90.addEventListener("click", () => rotateImage(270));
centerVerticallyButton.addEventListener("click", centerVertically);
centerHorizontallyButton.addEventListener("click", centerHorizontally);
deleteButton.addEventListener("click", deleteActiveObject);
confirmCropButton.addEventListener("click", confirmCrop);
cancelCropButton.addEventListener("click", exitCropMode);
scaleUpButton.addEventListener("click", scaleUp);
scaleDownButton.addEventListener("click", scaleDown);
arrangeButton.addEventListener("click", selectArrangeImageLayout);
setSizeButton.addEventListener("click", setImageSizeInCm);
columnsCollageButton.addEventListener("click", createMasonryColumnsCollage);
rowsCollageButton.addEventListener("click", createMasonryRowsCollage);
collageButton.addEventListener("click", collageArrange);
rotateCheckbox.addEventListener("change", function (e) {
  canvas.getObjects().forEach((obj) => {
    if (obj.type === "image") {
      obj.setControlsVisibility({
        mtr: this.checked,
      });
    }
  });
  canvas.requestRenderAll();
});

cropButton.addEventListener("click", function () {
  const activeObjects = canvas.getActiveObjects();

  console.log(activeObjects);

  if (activeObjects.length === 0) {
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  if (activeObjects.length !== 1) {
    Swal.fire({
      text: "Seleccione solo una imagen para recortar.",
      icon: "warning",
    });
    return;
  }

  const activeObject = activeObjects[0];
  if (activeObject.type !== "image") {
    Swal.fire({
      text: "La selección debe ser una imagen válida.",
      icon: "warning",
    });
    return;
  }

  enterCropMode(activeObject);
});

// Add keyboard delete support
document.addEventListener("keydown", function (event) {
  if (event.key === "Delete") {
    deleteActiveObject();
  }
});

document.body.addEventListener("click", (event) => deactivateObjects(event));

fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerColor = "limegreen";
fabric.Object.prototype.cornerStrokeColor = "black";
fabric.Object.prototype.cornerStyle = "rect";
fabric.Object.prototype.cornerSize = 12;
const controls = fabric.Object.prototype.controls;
const rotateControls = controls.mtr;
rotateControls.visible = false;

function constrainObjectToMargin(obj, marginRect) {
  obj.setCoords();

  let objPoints = [
    obj.aCoords.tl,
    obj.aCoords.tr,
    obj.aCoords.br,
    obj.aCoords.bl,
  ];
  let marginRight = marginRect.left + marginRect.width;
  let marginBottom = marginRect.top + marginRect.height;

  let offsetX = 0,
    offsetY = 0;

  objPoints.forEach(function (point) {
    if (point.x < marginRect.left) {
      offsetX = Math.max(offsetX, marginRect.left - point.x);
    }
    if (point.x > marginRight) {
      offsetX = Math.min(offsetX, marginRight - point.x);
    }
    if (point.y < marginRect.top) {
      offsetY = Math.max(offsetY, marginRect.top - point.y);
    }
    if (point.y > marginBottom) {
      offsetY = Math.min(offsetY, marginBottom - point.y);
    }
  });

  if (offsetX !== 0 || offsetY !== 0) {
    obj.left += offsetX;
    obj.top += offsetY;
    obj.setCoords();
  }

  return obj;
}

canvas.on("object:moving", function (e) {
  constrainObjectToMargin(e.target, marginRect);
});

canvas.on("object:modified", function (e) {
  // Reset restrictions
  activeRestriction = null;
  arrangementStatus = "none";
});

resizeCanvas("carta");

// Calcular el ancho del margen

let marginWidth = (canvas.width - marginRect.width) / 2;

// Add accessibility improvements: set ARIA labels and focus outlines on interactive elements.
function setupAccessibility() {
  // List all interactive elements by id.
  const elements = [
    printButton,
    deleteButton,
    cropButton,
    confirmCropButton,
    cancelCropButton,
    cartaButton,
    oficioButton,
    a4Button,
    verticalButton,
    horizontalButton,
    rotateButton_p90,
    rotateButton_n90,
    resetImageButton,
    arrangeButton,
    grayScaleButton,
    scaleUpButton,
    scaleDownButton,
    centerVerticallyButton,
    centerHorizontallyButton,
    setSizeButton,
    columnsCollageButton,
    rowsCollageButton,
    collageButton
  ];
  elements.forEach((el) => {
    if (el) {
      // Use innerText or id as descriptive label.
      el.setAttribute(
        "aria-label",
        el.innerText.trim() || el.getAttribute("id")
      );
      // Ensure buttons are focusable with a clear outline
      el.style.outline = "3px solid transparent";
      el.addEventListener("focus", () => {
        el.style.outline = "3px solid #ff0";
      });
      el.addEventListener("blur", () => {
        el.style.outline = "3px solid transparent";
      });
    }
  });
}
setupAccessibility();
