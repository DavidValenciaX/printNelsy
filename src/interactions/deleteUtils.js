import { showNoObjectSelectedWarning } from "../utils/uiUtils.js";
import Swal from 'sweetalert2';

export function deleteActiveObject(canvas) {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) {
    showNoObjectSelectedWarning();
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