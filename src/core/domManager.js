/**
 * Gestiona todas las referencias DOM de la aplicación
 */
export class DOMManager {
  constructor() {
    this.elements = {

      // Canvas
      canvas: document.getElementById("canvas"),

      // File operations
      imageLoader: document.getElementById("imageLoader"),
      printButton: document.getElementById("printButton"),
      downloadPdfButton: document.getElementById("downloadPdfButton"),
      downloadPngButton: document.getElementById("downloadPngButton"),

      // Paper size buttons
      verticalButton: document.getElementById("verticalButton"),
      horizontalButton: document.getElementById("horizontalButton"),
      cartaButton: document.getElementById("cartaButton"),
      oficioButton: document.getElementById("oficioButton"),
      a4Button: document.getElementById("a4Button"),

      // Size controls
      scaleUpButton: document.getElementById("scaleUpButton"),
      scaleDownButton: document.getElementById("scaleDownButton"),
      widthInput: document.getElementById("widthInput"),
      heightInput: document.getElementById("heightInput"),
      setSizeButton: document.getElementById("setSizeButton"),
      centerVerticallyButton: document.getElementById("centerVerticallyButton"),
      centerHorizontallyButton: document.getElementById("centerHorizontallyButton"),

      // Positioning controls
      arrangeButton: document.getElementById("arrangeButton"),
      "rotateButton_p90": document.getElementById("rotateButton+90"),
      "rotateButton_n90": document.getElementById("rotateButton-90"),
      flipHorizontalButton: document.getElementById("flipHorizontalButton"),
      flipVerticalButton: document.getElementById("flipVerticalButton"),
      rotateCheckbox: document.getElementById("rotateControl"),

      // Image operations
      grayScaleButton: document.getElementById("grayScaleButton"),
      resetImageButton: document.getElementById("resetImageButton"),
      deleteButton: document.getElementById("deleteButton"),
      
      // Clipboard operations
      copyButton: document.getElementById("copyButton"),
      pasteButton: document.getElementById("pasteButton"),
      
      // Crop controls
      cropButton: document.getElementById("cropButton"),
      confirmCropButton: document.getElementById("confirmCrop"),
      cancelCropButton: document.getElementById("cancelCrop"),
      
      // Collage controls
      columnsCollageButton: document.getElementById("columnsCollageButton"),
      rowsCollageButton: document.getElementById("rowsCollageButton"),
      collageButton: document.getElementById("collageButton"),
      maintainAspectCheckbox: document.getElementById("maintainAspectCheckbox"),
      
      // Grid controls
      gridControlsGroup: document.getElementById("gridControlsGroup"),
      increaseRowsButton: document.getElementById("increaseRowsButton"),
      decreaseRowsButton: document.getElementById("decreaseRowsButton"),
      increaseColsButton: document.getElementById("increaseColsButton"),
      decreaseColsButton: document.getElementById("decreaseColsButton"),
      rowsDisplay: document.getElementById("rowsDisplay"),
      colsDisplay: document.getElementById("colsDisplay")
    };
  }

  get(elementKey) {
    return this.elements[elementKey];
  }

  getMultiple(elementKeys) {
    return elementKeys.reduce((acc, key) => {
      acc[key] = this.elements[key];
      return acc;
    }, {});
  }

  addElement(key, selector) {
    this.elements[key] = document.getElementById(selector) || document.querySelector(selector);
    return this.elements[key];
  }
} 