import { getAppInstance } from '../core/app.js';

const MOVEMENT_SPEED = 2; // Píxeles por pulsación de tecla

function handleKeyDown(e) {
    const app = getAppInstance();
    if (!app) return;

    const canvas = app.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    let needsRender = false;

    switch (e.key) {
        case 'ArrowUp':
            activeObject.top -= MOVEMENT_SPEED;
            needsRender = true;
            break;
        case 'ArrowDown':
            activeObject.top += MOVEMENT_SPEED;
            needsRender = true;
            break;
        case 'ArrowLeft':
            activeObject.left -= MOVEMENT_SPEED;
            needsRender = true;
            break;
        case 'ArrowRight':
            activeObject.left += MOVEMENT_SPEED;
            needsRender = true;
            break;
    }

    if (needsRender) {
        activeObject.setCoords();
        canvas.renderAll();
        e.preventDefault(); // Evitar el comportamiento predeterminado (como el scroll)
    }
}

export function initializeKeyboardInteractions() {
    window.addEventListener('keydown', handleKeyDown);
} 