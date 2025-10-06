import { initializeKeyboardInteractions } from '../interactions/keyboardInteractions.js';
import Swal from 'sweetalert2';
import { imageState } from '../image/imageUploadUtils.js';
import { groupSelectedObjects, ungroupActiveObject } from '../interactions/groupUtils.js';
import { updateGroupButtonsState, initializeGroupButtonsState, handleGroupCreated, handleGroupUngrouped } from '../ui/groupButtons.js';
import { paperSizes, getCurrentSize } from '../canvas/canvasResizeUtils.js';

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

  /**
   * Guarda automáticamente el estado actual en la página actual
   * Esta función se llama después de cambios de configuración importantes
   */
  async autoSaveCurrentPageState() {
    try {
      const { saveCurrentStateToPage } = await import('../canvas/pageUtils.js');
      await saveCurrentStateToPage();
    } catch (error) {
      console.warn('Error al guardar automáticamente el estado de la página:', error);
    }
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
    this.initializeGridControlEvents();
    this.initializeGroupEvents();
    this.initializeGlobalEvents();
    this.initializeKeyboardEvents();
  }

  initializeFileEvents() {
    this.addEventBinding('imageLoader', 'change', (e) => {
      this.actions.handleImageUpload(e, this.canvasManager.getCanvas(), this.dom.get('rotateCheckbox'));
    });
    
    this.addEventBinding('downloadPdfButton', 'click', () =>
      this.actions.downloadAsPDF(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );

    this.addEventBinding('downloadPngButton', 'click', () =>
      this.actions.downloadAsPNG(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );

    this.addEventBinding('printButton', 'click', () => 
      this.actions.printCanvas(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect())
    );

    this.addEventBinding('newPageButton', 'click', () => 
      this.actions.createNewPage(this.canvasManager.getCanvas())
    );

    this.addEventBinding('prevPageButton', 'click', async () => 
      await this.actions.goToPreviousPage()
    );

    this.addEventBinding('nextPageButton', 'click', async () => 
      await this.actions.goToNextPage()
    );

    this.addEventBinding('deletePageButton', 'click', async () => 
      await this.actions.deleteCurrentPage()
    );

    // Eventos para botones de múltiples páginas
    this.addEventBinding('printAllPagesButton', 'click', () => 
      this.actions.printAllPages(this.canvasManager.getAllPages())
    );

    this.addEventBinding('downloadAllPdfButton', 'click', () =>
      this.actions.downloadAllPagesAsPDF(this.canvasManager.getAllPages())
    );

    this.addEventBinding('downloadAllPngButton', 'click', () =>
      this.actions.downloadAllPagesAsPNG(this.canvasManager.getAllPages())
    );
  }

  updatePaperSizeButtons(selectedSize) {
    Object.keys(paperSizes).forEach(size => {
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

  updateOrderButtons(selectedOrder) {
    const forwardButton = this.dom.get('forwardOrderButton');
    const reverseButton = this.dom.get('reverseOrderButton');

    if (forwardButton && reverseButton) {
      if (imageState.arrangementStatus !== 'grid') {
        forwardButton.classList.remove('active');
        reverseButton.classList.remove('active');
        return;
      }

      if (selectedOrder === 'forward') {
        forwardButton.classList.add('active');
        reverseButton.classList.remove('active');
      } else {
        forwardButton.classList.remove('active');
        reverseButton.classList.add('active');
      }
    }
  }

  initializePaperSizeEvents() {
    Object.keys(paperSizes).forEach(size => {
      // Registrar el elemento dinámico por si aún no está en el mapa
      this.dom.addElement(`${size}Button`, `${size}Button`);

      this.addEventBinding(`${size}Button`, 'click', async () => {
        const result = this.actions.resizeCanvas(size, this.canvasManager.getCanvas(), this.canvasManager.getMarginRect());
        this.canvasManager.updateMargins(result.marginRect, result.marginWidth);
        this.updatePaperSizeButtons(size);
        
        // Auto-guardar estado después del cambio
        await this.autoSaveCurrentPageState();
      });
    });

    // Establecer activo según el tamaño actual
    this.updatePaperSizeButtons(getCurrentSize());
  }

  initializeOrientationEvents() {
    this.addEventBinding('verticalButton', 'click', async () => {
      const result = this.actions.changeOrientation(true, this.canvasManager.getCanvas(), this.canvasManager.getMarginRect());
      this.canvasManager.updateMargins(result.marginRect, result.marginWidth);
      this.updateOrientationButtons(true);
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.addEventBinding('horizontalButton', 'click', async () => {
      const result = this.actions.changeOrientation(false, this.canvasManager.getCanvas(), this.canvasManager.getMarginRect());
      this.canvasManager.updateMargins(result.marginRect, result.marginWidth);
      this.updateOrientationButtons(false);
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.updateOrientationButtons(true);
  }

  updateLayoutOrientationButtons(selectedOrientation) {
    const rowsButton = this.dom.get('rowsLayoutButton');
    const colsButton = this.dom.get('colsLayoutButton');

    if (rowsButton && colsButton) {
      // Si el arrangement no es 'grid', no mostrar ningún botón como activo
      if (imageState.arrangementStatus !== 'grid') {
        rowsButton.classList.remove('active');
        colsButton.classList.remove('active');
        return;
      }

      if (selectedOrientation === 'rows') {
        rowsButton.classList.add('active');
        colsButton.classList.remove('active');
      } else {
        rowsButton.classList.remove('active');
        colsButton.classList.add('active');
      }
    }
  }

  initializeTransformEvents() {
    this.addEventBinding('rotateButton_p90', 'click', () => 
      this.actions.rotateImage(this.canvasManager.getCanvas(), 90, this.canvasManager.getMarginRect())
    );
    
    this.addEventBinding('rotateButton_n90', 'click', () => 
      this.actions.rotateImage(this.canvasManager.getCanvas(), 270, this.canvasManager.getMarginRect())
    );

    this.addEventBinding('flipHorizontalButton', 'click', () =>
      this.actions.flipHorizontal()
    );

    this.addEventBinding('flipVerticalButton', 'click', () =>
      this.actions.flipVertical()
    );

    this.addEventBinding('rotateCheckbox', 'change', (e) => {
      const canvas = this.canvasManager.getCanvas();
      canvas.getObjects().forEach((obj) => {
        if (obj.type === "image" || obj.type === "group") {
          obj.setControlsVisibility({
            mtr: e.target.checked,
          });
        }
      });
      canvas.requestRenderAll();
    });

    this.addEventBinding('resetImageButton', 'click', async () => {
      try {
        await this.actions.resetActiveObject(
          this.canvasManager.getCanvas(), 
          this.canvasManager.getMarginRect(), 
          this.actions.originalImages, 
          this.actions.originalGroups,
          this.dom.get('rotateCheckbox')
        );
      } catch (error) {
        console.error('Error during reset operation:', error);
      }
    });
  }

  initializePositionEvents() {
    this.addEventBinding('centerVerticallyButton', 'click', () => 
      this.actions.centerVertically(this.canvasManager.getCanvas())
    );
    
    this.addEventBinding('centerHorizontallyButton', 'click', () => 
      this.actions.centerHorizontally(this.canvasManager.getCanvas())
    );
    
    this.addEventBinding('rowsLayoutButton', 'click', async () => {
      this.actions.setOrientationLayout(this.canvasManager.getCanvas(), this.dom, 'rows');
      this.updateLayoutOrientationButtons('rows');
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.addEventBinding('colsLayoutButton', 'click', async () => {
      this.actions.setOrientationLayout(this.canvasManager.getCanvas(), this.dom, 'cols');
      this.updateLayoutOrientationButtons('cols');
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.addEventBinding('forwardOrderButton', 'click', async () => {
      this.actions.setOrderLayout(this.canvasManager.getCanvas(), this.dom, 'forward');
      this.updateOrderButtons('forward');
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.addEventBinding('reverseOrderButton', 'click', async () => {
      this.actions.setOrderLayout(this.canvasManager.getCanvas(), this.dom, 'reverse');
      this.updateOrderButtons('reverse');
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.updateLayoutOrientationButtons(imageState.orientation);
    this.updateOrderButtons(imageState.order);
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
      this.actions.deleteActiveObject(this.canvasManager.getCanvas(), this.dom)
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
        this.dom.get('rotateCheckbox'),
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

    // Perspective crop events
    this.addEventBinding('perspectiveCropButton', 'click', () => 
      this.actions.initializePerspectiveCrop(
        this.canvasManager.getCanvas(), 
        Swal, 
        this.dom.get('confirmPerspectiveCropButton'), 
        this.dom.get('cancelPerspectiveCropButton'), 
        this.dom.get('perspectiveCropButton'), 
        this.canvasManager.getMarginRect(), 
        this.dom.get('rotateCheckbox')
      )
    );

    this.addEventBinding('confirmPerspectiveCropButton', 'click', () => 
      this.actions.confirmPerspectiveCrop(
        this.canvasManager.getCanvas(), 
        this.canvasManager.getMarginRect(), 
        this.dom.get('rotateCheckbox'), 
        Swal, 
        this.dom.get('confirmPerspectiveCropButton'), 
        this.dom.get('cancelPerspectiveCropButton'), 
        this.dom.get('perspectiveCropButton')
      )
    );

    this.addEventBinding('cancelPerspectiveCropButton', 'click', () => 
      this.actions.exitPerspectiveCropMode(
        this.canvasManager.getCanvas(), 
        this.dom.get('confirmPerspectiveCropButton'), 
        this.dom.get('cancelPerspectiveCropButton'), 
        this.dom.get('perspectiveCropButton')
      )
    );
  }

  initializeCollageEvents() {
    this.addEventBinding('gridArrangeButton', 'click', async () => {
      this.actions.resetCustomGridDimensions();
      this.actions.applyGridArrangement(this.canvasManager.getCanvas(), this.dom);
      this.actions.toggleGridControlsVisibility(this.canvasManager.getCanvas(), this.dom);
      this.updateLayoutOrientationButtons(imageState.orientation);
      this.updateOrderButtons(imageState.order);
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.addEventBinding('columnsCollageButton', 'click', async () => {
      const newStatus = this.actions.createMasonryColumnsCollage(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect(), Swal);
      if (newStatus) this.actions.setArrangementStatus(newStatus);
      this.actions.toggleGridControlsVisibility(this.canvasManager.getCanvas(), this.dom);
      this.updateLayoutOrientationButtons();
      this.updateOrderButtons();
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.addEventBinding('rowsCollageButton', 'click', async () => {
      const newStatus = this.actions.createMasonryRowsCollage(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect(), Swal);
      if (newStatus) this.actions.setArrangementStatus(newStatus);
      this.actions.toggleGridControlsVisibility(this.canvasManager.getCanvas(), this.dom);
      this.updateLayoutOrientationButtons();
      this.updateOrderButtons();
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });

    this.addEventBinding('collageButton', 'click', async () => {
      const newStatus = this.actions.randomCollageArrange(this.canvasManager.getCanvas(), this.canvasManager.getMarginRect(), Swal);
      if (newStatus) this.actions.setArrangementStatus(newStatus);
      this.actions.toggleGridControlsVisibility(this.canvasManager.getCanvas(), this.dom);
      this.updateLayoutOrientationButtons();
      this.updateOrderButtons();
      
      // Auto-guardar estado después del cambio
      await this.autoSaveCurrentPageState();
    });
  }

  initializeGridControlEvents() {
    this.addEventBinding('increaseRowsButton', 'click', () => {
      this.actions.increaseRows(this.canvasManager.getCanvas(), this.dom);
    });

    this.addEventBinding('decreaseRowsButton', 'click', () => {
      this.actions.decreaseRows(this.canvasManager.getCanvas(), this.dom);
    });

    this.addEventBinding('increaseColsButton', 'click', () => {
      this.actions.increaseCols(this.canvasManager.getCanvas(), this.dom);
    });

    this.addEventBinding('decreaseColsButton', 'click', () => {
      this.actions.decreaseCols(this.canvasManager.getCanvas(), this.dom);
    });
    
    this.addEventBinding('spacingRange', 'input', (e) => {
      this.actions.updateImageSpacing(this.canvasManager.getCanvas(), this.dom, parseInt(e.target.value, 10));
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

    document.body.addEventListener('drop', (e) => {
      this.actions.handleImageDrop(e, this.canvasManager.getCanvas(), this.dom.get('rotateCheckbox'));
    });

    // Keyboard events
    document.addEventListener("keydown", (event) => {
      if (event.key === "Delete") {
        this.actions.deleteActiveObject(this.canvasManager.getCanvas(), this.dom);
      }
    });

    // Body click events
    document.body.addEventListener("click", (event) => 
      this.actions.deactivateObjects(event, this.canvasManager.getCanvas())
    );
  }

  initializeGroupEvents() {
    // Inicializar estado de botones de agrupación
    initializeGroupButtonsState(this.dom);

    // Event listeners para los botones de agrupar/desagrupar
    this.addEventBinding('groupButton', 'click', () => {
      const canvas = this.canvasManager.getCanvas();
      const group = groupSelectedObjects(canvas);
      
      if (group) {
        handleGroupCreated(group, this.dom);
        // Actualizar estado de botones después de agrupar
        updateGroupButtonsState(canvas, this.dom);
      }
    });

    this.addEventBinding('ungroupButton', 'click', () => {
      const canvas = this.canvasManager.getCanvas();
      const activeSelection = ungroupActiveObject(canvas);
      
      if (activeSelection) {
        handleGroupUngrouped(activeSelection, this.dom);
        // Actualizar estado de botones después de desagrupar
        updateGroupButtonsState(canvas, this.dom);
      }
    });

    // Event listeners para eventos de selección del canvas
    const canvas = this.canvasManager.getCanvas();
    if (canvas) {
      // Actualizar estado cuando cambie la selección
      canvas.on('selection:created', () => {
        updateGroupButtonsState(canvas, this.dom);
      });

      canvas.on('selection:updated', () => {
        updateGroupButtonsState(canvas, this.dom);
      });

      canvas.on('selection:cleared', () => {
        updateGroupButtonsState(canvas, this.dom);
      });

      // Actualizar estado cuando se agreguen o quiten objetos
      canvas.on('object:added', () => {
        updateGroupButtonsState(canvas, this.dom);
      });

      canvas.on('object:removed', () => {
        updateGroupButtonsState(canvas, this.dom);
      });
    }
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