// Add accessibility improvements: set ARIA labels and focus outlines on interactive elements.
export function setupAccessibility() {
  // Get all interactive elements by id.
  const imageLoader = document.getElementById("imageLoader");
  const printButton = document.getElementById("printButton");
  const deleteButton = document.getElementById("deleteButton");
  const cropButton = document.getElementById("cropButton");
  const confirmCropButton = document.getElementById("confirmCrop");
  const cancelCropButton = document.getElementById("cancelCrop");
  const downloadPdfButton = document.getElementById("downloadPdfButton");
  const cartaButton = document.getElementById("cartaButton");
  const oficioButton = document.getElementById("oficioButton");
  const a4Button = document.getElementById("a4Button");
  const verticalButton = document.getElementById("verticalButton");
  const horizontalButton = document.getElementById("horizontalButton");
  const rotateButton_p90 = document.getElementById("rotateButton+90");
  const rotateButton_n90 = document.getElementById("rotateButton-90");
  const resetImageButton = document.getElementById("resetImageButton");
  const arrangeButton = document.getElementById("arrangeButton");
  const grayScaleButton = document.getElementById("grayScaleButton");
  const scaleUpButton = document.getElementById("scaleUpButton");
  const scaleDownButton = document.getElementById("scaleDownButton");
  const centerVerticallyButton = document.getElementById("centerVerticallyButton");
  const centerHorizontallyButton = document.getElementById("centerHorizontallyButton");
  const setSizeButton = document.getElementById("setSizeButton");
  const columnsCollageButton = document.getElementById("columnsCollageButton");
  const rowsCollageButton = document.getElementById("rowsCollageButton");
  const collageButton = document.getElementById("collageButton");

  // List all interactive elements
  const elements = [
    imageLoader,
    printButton,
    deleteButton,
    cropButton,
    confirmCropButton,
    cancelCropButton,
    downloadPdfButton,
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