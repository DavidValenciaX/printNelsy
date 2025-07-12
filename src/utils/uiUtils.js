import Swal from 'sweetalert2';

const MESSAGES = {
  SELECT_IMAGE_FIRST: "Seleccione primero una imagen.",
  SELECT_ONE_IMAGE_ONLY: "Seleccione solo una imagen para recortar.",
  INVALID_SELECTION: "La selección debe ser una imagen válida.",
};

const ICONS = {
  WARNING: "warning",
};

export function showNoObjectSelectedWarning() {
  Swal.fire({ text: MESSAGES.SELECT_IMAGE_FIRST, icon: ICONS.WARNING });
}

export function showSingleImageWarning() {
  Swal.fire({ text: MESSAGES.SELECT_ONE_IMAGE_ONLY, icon: ICONS.WARNING });
}

export function showInvalidSelectionWarning() {
  Swal.fire({ text: MESSAGES.INVALID_SELECTION, icon: ICONS.WARNING });
} 