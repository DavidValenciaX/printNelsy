// Functions for flipping objects on the canvas

export function flipHorizontal(canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    // Assuming Swal is globally available or imported elsewhere
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  activeObject.set('flipX', !activeObject.flipX);
  activeObject.setCoords();
  canvas.renderAll();
}

export function flipVertical(canvas) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    // Assuming Swal is globally available or imported elsewhere
    Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
    return;
  }

  activeObject.set('flipY', !activeObject.flipY);
  activeObject.setCoords();
  canvas.renderAll();
}
