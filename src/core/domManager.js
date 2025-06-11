/**
 * Gestiona todas las referencias DOM de la aplicación
 */
export class DOMManager {
  constructor() {
    this.elements = this.initializeElements();
  }

  initializeElements() {
    return {
      // Canvas
      canvasElement: document.getElementById("canvas"),
      
      // File operations
      imageLoader: document.getElementById("imageLoader"),
      printButton: document.getElementById("printButton"),
      
      // Paper size buttons
      cartaButton: document.getElementById("cartaButton"),
      oficioButton: document.getElementById("oficioButton"),
      a4Button: document.getElementById("a4Button"),
      
      // Orientation buttons
      verticalButton: document.getElementById("verticalButton"),
      horizontalButton: document.getElementById("horizontalButton"),
      
      // Transform controls
      rotateButton_p90: document.getElementById("rotateButton+90"),
      rotateButton_n90: document.getElementById("rotateButton-90"),
      rotateCheckbox: document.getElementById("rotateControl"),
      resetImageButton: document.getElementById("resetImageButton"),
      
      // Positioning controls
      centerVerticallyButton: document.getElementById("centerVerticallyButton"),
      centerHorizontallyButton: document.getElementById("centerHorizontallyButton"),
      arrangeButton: document.getElementById("arrangeButton"),
      
      // Size controls
      scaleUpButton: document.getElementById("scaleUpButton"),
      scaleDownButton: document.getElementById("scaleDownButton"),
      setSizeButton: document.getElementById("setSizeButton"),
      widthInput: document.getElementById("widthInput"),
      heightInput: document.getElementById("heightInput"),
      maintainAspectCheckbox: document.getElementById("maintainAspectCheckbox"),
      
      // Image operations
      grayScaleButton: document.getElementById("grayScaleButton"),
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
      collageButton: document.getElementById("collageButton")
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