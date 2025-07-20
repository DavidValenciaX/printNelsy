export function deactivateObjects(event, canvas) {
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
    event.target.classList.contains("page-container") ||
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