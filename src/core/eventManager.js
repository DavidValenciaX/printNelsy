import { initializeKeyboardInteractions } from '../interactions/keyboardInteractions.js';

/**
 * Gestiona todos los event listeners de la aplicación
 */
export class EventManager {
  constructor(domManager, canvasManager, actions) {
    this.dom = domManager;
    this.canvasManager = canvasManager;
    this.actions = actions;
    this.eventBindings = new Map();
  }

  initializeAllEvents() {
    this.initializeFileEvents();
    this.initializePaperSizeEvents();
    this.initializeOrientationEvents();
    this.initializeTransformEvents();
    this.initializePositionEvents();
    this.initializeSizeEvents();
    this.initializeImageOperationEvents();
    this.initializeClipboardEvents();
    this.initializeCropEvents();
    this.initializeCollageEvents();
    this.initializeGlobalEvents();
    this.initializeKeyboardEvents();
  }

  initializeFileEvents() {
    this.addEventBinding('imageLoader', 'change', (e) => 
      this.actions.handleImageUpload(e, this.canvasManager.getCanvas(), this.canvasManager.getMarginWidth(), this.dom.get('rotateCheckbox'))
    );
    
    this.addEventBinding('downloadPdfButton', 'click', () =>
      this.actions.downloadAsPDF(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );

    this.addEventBinding('printButton', 'click', () => 
      this.actions.printCanvas(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );
  }

  updatePaperSizeButtons(selectedSize) {
    const paperSizes = ['carta', 'oficio', 'a4'];
    paperSizes.forEach(size => {
      const button = this.dom.get(`${size}Button`);
      if (button) {
        if (size === selectedSize) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    });
  }

  updateOrientationButtons(isVertical) {
    const verticalButton = this.dom.get('verticalButton');
    const horizontalButton = this.dom.get('horizontalButton');

    if (verticalButton && horizontalButton) {
      if (isVertical) {
        verticalButton.classList.add('active');
        horizontalButton.classList.remove('active');
      } else {
        verticalButton.classList.remove('active');
        horizontalButton.classList.add('active');
      }
    }
  }

  initializePaperSizeEvents() {
    const paperSizes = ['carta', 'oficio', 'a4'];
    
    paperSizes.forEach(size => {
      this.addEventBinding(`${size}Button`, 'click', () => {
        const result = this.actions.resizeCanvas(size, this.canvasManager.getCanvas(), this.canvasManager.getMarginRect());
        this.canvasManager.updateMargins(result.marginRect, result.marginWidth);
        this.updatePaperSizeButtons(size);
      });
    });

    this.updatePaperSizeButtons('carta');
  }

  initializeOrientationEvents() {
    this.addEventBinding('verticalButton', 'click', () => {
      const result = this.actions.changeOrientation(true, this.canvasManager.getCanvas(), this.canvasManager.getMarginRect());
      this.canvasManager.updateMargins(result.marginRect, result.marginWidth);
      this.updateOrientationButtons(true);
    });

    this.addEventBinding('horizontalButton', 'click', () => {
      const result = this.actions.changeOrientation(false, this.canvasManager.getCanvas(), this.canvasManager.getMarginRect());
      this.canvasManager.updateMargins(result.marginRect, result.marginWidth);
      this.updateOrientationButtons(false);
    });

    this.updateOrientationButtons(true);
  }

  initializeTransformEvents() {
    this.addEventBinding('rotateButton_p90', 'click', () => 
      this.actions.rotateImage(this.canvasManager.getCanvas(), 90, this.canvasManager.getMarginRect())
    );
    
    this.addEventBinding('rotateButton_n90', 'click', () => 
      this.actions.rotateImage(this.canvasManager.getCanvas(), 270, this.canvasManager.getMarginRect())
    );

    this.addEventBinding('rotateCheckbox', 'change', (e) => {
      const canvas = this.canvasManager.getCanvas();
      canvas.getObjects().forEach((obj) => {
        if (obj.type === "image") {
          obj.setControlsVisibility({
            mtr: e.target.checked,
          });
        }
      });
      canvas.requestRenderAll();
    });

    this.addEventBinding('resetImageButton', 'click', () => 
      this.actions.resetActiveImage(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect(), this.actions.originalImages)
    );
  }

  initializePositionEvents() {
    this.addEventBinding('centerVerticallyButton', 'click', () => 
      this.actions.centerVertically(this.canvasManager.getCanvas())
    );
    
    this.addEventBinding('centerHorizontallyButton', 'click', () => 
      this.actions.centerHorizontally(this.canvasManager.getCanvas())
    );
    
    this.addEventBinding('arrangeButton', 'click', () => 
      this.actions.selectArrangeImageLayout(this.canvasManager.getCanvas(), this.canvasManager.getMarginWidth(), Swal)
    );
  }

  initializeSizeEvents() {
    this.addEventBinding('scaleUpButton', 'click', () => 
      this.actions.scaleUp(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );
    
    this.addEventBinding('scaleDownButton', 'click', () => 
      this.actions.scaleDown(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );

    this.addEventBinding('setSizeButton', 'click', () => 
      this.actions.setImageSizeInCm({
        canvas: this.canvasManager.getCanvas(),
        widthInput: this.dom.get('widthInput'),
        heightInput: this.dom.get('heightInput'),
        marginRect: this.canvasManager.getMarginRect(),
        paperConfig: this.canvasManager.getPaperConfig()
      })
    );
  }

  initializeImageOperationEvents() {
    this.addEventBinding('grayScaleButton', 'click', () => 
      this.actions.convertToGrayscale(this.canvasManager.getCanvas())
    );
    
    this.addEventBinding('deleteButton', 'click', () => 
      this.actions.deleteActiveObject(this.canvasManager.getCanvas())
    );
  }

  initializeClipboardEvents() {
    this.addEventBinding('copyButton', 'click', () => 
      this.actions.copySelection(this.canvasManager.getCanvas())
    );
    
    this.addEventBinding('pasteButton', 'click', () => 
      this.actions.pasteSelection(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );
  }

  initializeCropEvents() {
    this.addEventBinding('cropButton', 'click', () => 
      this.actions.initializeCrop(
        this.canvasManager.getCanvas(), 
        Swal, 
        this.dom.get('confirmCropButton'), 
        this.dom.get('cancelCropButton'), 
        this.dom.get('cropButton'), 
        this.canvasManager.getMarginRect(), 
        this.dom.get('rotateCheckbox')
      )
    );

    this.addEventBinding('confirmCropButton', 'click', () => 
      this.actions.confirmCrop(
        this.canvasManager.getCanvas(), 
        this.canvasManager.getMarginRect(), 
        this.dom.get('rotateCheckbox'), 
        Swal, 
        this.dom.get('confirmCropButton'), 
        this.dom.get('cancelCropButton'), 
        this.dom.get('cropButton')
      )
    );

    this.addEventBinding('cancelCropButton', 'click', () => 
      this.actions.exitCropMode(
        this.canvasManager.getCanvas(), 
        this.dom.get('confirmCropButton'), 
        this.dom.get('cancelCropButton'), 
        this.dom.get('cropButton')
      )
    );
  }

  initializeCollageEvents() {
    this.addEventBinding('columnsCollageButton', 'click', () => {
      const newStatus = this.actions.createMasonryColumnsCollage(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect(), Swal);
      if (newStatus) this.actions.setArrangementStatus(newStatus);
    });

    this.addEventBinding('rowsCollageButton', 'click', () => {
      const newStatus = this.actions.createMasonryRowsCollage(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect(), Swal);
      if (newStatus) this.actions.setArrangementStatus(newStatus);
    });

    this.addEventBinding('collageButton', 'click', () => {
      const newStatus = this.actions.collageArrange(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect(), Swal);
      if (newStatus) this.actions.setArrangementStatus(newStatus);
    });
  }

  initializeGlobalEvents() {
    // Setup clipboard keyboard events
    this.actions.setupClipboardEvents(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect());

    // Drag and drop events for image upload
    document.body.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.add('drag-over');
    });

    document.body.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.remove('drag-over');
    });

    document.body.addEventListener('drop', (e) => 
      this.actions.handleImageDrop(e, this.canvasManager.getCanvas(), this.canvasManager.getMarginWidth(), this.dom.get('rotateCheckbox'))
    );

    // Keyboard events
    document.addEventListener("keydown", (event) => {
      if (event.key === "Delete") {
        this.actions.deleteActiveObject(this.canvasManager.getCanvas());
      }
    });

    // Body click events
    document.body.addEventListener("click", (event) => 
      this.actions.deactivateObjects(event, this.canvasManager.getCanvas())
    );
  }

  initializeKeyboardEvents() {
    initializeKeyboardInteractions();
  }

  addEventBinding(elementKey, event, handler) {
    const element = this.dom.get(elementKey);
    if (element) {
      element.addEventListener(event, handler);
      
      // Store binding for potential cleanup
      if (!this.eventBindings.has(elementKey)) {
        this.eventBindings.set(elementKey, []);
      }
      this.eventBindings.get(elementKey).push({ event, handler });
    } else {
      console.warn(`Element ${elementKey} not found for event binding`);
    }
  }

  removeEventBindings(elementKey) {
    const element = this.dom.get(elementKey);
    const bindings = this.eventBindings.get(elementKey);
    
    if (element && bindings) {
      bindings.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventBindings.delete(elementKey);
    }
  }

  removeAllEventBindings() {
    this.eventBindings.forEach((_, elementKey) => {
      this.removeEventBindings(elementKey);
    });
  }
} 