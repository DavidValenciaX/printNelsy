import { getAppInstance } from '../core/app.js';

/**
 * Flips the active object on the specified axis.
 * @param {'flipX' | 'flipY'} axis - The axis to flip the object on.
 */
function flipObject(axis) {
    const app = getAppInstance();
    if (!app) return;

    const canvas = app.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
        Swal.fire({ text: "Seleccione primero una imagen.", icon: "warning" });
        return;
    }

    activeObject.set(axis, !activeObject.get(axis));
    canvas.renderAll();
}

/**
 * Flips the active object horizontally.
 */
export function flipHorizontal() {
    flipObject('flipY');
}

/**
 * Flips the active object vertically.
 */
export function flipVertical() {
    flipObject('flipX');
} 