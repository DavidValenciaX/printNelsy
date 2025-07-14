import { showNoObjectSelectedWarning } from "../utils/uiUtils.js";
import Swal from 'sweetalert2';
import { toggleGridControlsVisibility } from '../layout/gridControls.js';
import { setArrangementStatus } from '../image/imageUploadUtils.js';

export function deleteActiveObject(canvas, domManager) {
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
      
      // Check if canvas is now empty and update arrangement status
      const remainingImages = canvas.getObjects().filter(obj => obj.type === 'image');
      if (remainingImages.length === 0) {
        setArrangementStatus('none');
      }
      
      toggleGridControlsVisibility(canvas, domManager);
    }
  });
} 