import { radToDeg, calculateDistance } from './mathUtils.js';
import { getCurrentMarginRect, updateMarginRect } from './marginRectManager.js';

/**
 * Consolidated, DRY implementation that keeps the original behaviour but removes
 * ~800 lines of duplicated maths/boiler‑plate.
 */
export function setupRotatingEvents(canvas, marginRect, updateArrangementStatus = null) {
  // 1️⃣  State ----------------------------------------------------------------
  let isMouseDown = false;
  const state = {
    clockwise: false,
    accumulated: 0,
    angleDiff: 0,
    active: null,
  };

  // 2️⃣  Store margins in central manager ------------------------------------
  updateMarginRect(marginRect);

  // 3️⃣  Pointer state --------------------------------------------------------
  canvas.on('mouse:down', () => { isMouseDown = true; });
  canvas.on('mouse:up',   () => { isMouseDown = false; });

  // 4️⃣  Main rotate handler --------------------------------------------------
  canvas.on('object:rotating', (evt) => {
    const obj = evt.target;
    obj.setCoords();

    // ---- Angle diff + CW/CCW detection -------------------------------------
    if (typeof obj.previousAngle === 'undefined') obj.previousAngle = 0;
    const currentAngle       = obj.angle;
    state.angleDiff          = getAngleDiff(currentAngle, obj.previousAngle);
    state.clockwise          = state.angleDiff > 0;
    obj.previousAngle        = currentAngle;

    // ---- Geometry helpers ---------------------------------------------------
    const { left: L, top: T } = obj;
    const { tl: TL, tr: TR, bl: BL, br: BR } = obj.aCoords;
    const corners = { TL, TR, BL, BR };

    const realW = obj.width  * obj.scaleX;
    const realH = obj.height * obj.scaleY;
    const diagAngle           = Math.atan(realH / realW);
    const complementDiagAngle = Math.PI / 2 - diagAngle;

    const m        = getCurrentMarginRect();
    const margins  = {
      left:   m.left,
      right:  m.left + m.width,
      top:    m.top,
      bottom: m.top  + m.height,
    };

    // ---- Restriction lifecycle ---------------------------------------------
    if (!state.active) state.accumulated = 0;      // reset acc. store when free
    if (!isMouseDown) state.active = null;         // mouse released ⇒ free

    if (!state.active && isMouseDown) {
      state.active = detectRestriction(corners, margins, state.clockwise);
    }

    if (state.active) {
      handleRestriction({
        code:  state.active,
        obj,
        corners,
        margins,
        diagAngle,
        complementDiagAngle,
        state,
      });
    }

    obj.setCoords();
    canvas.renderAll();
  });

  // 5️⃣  Finalise -------------------------------------------------------------
  canvas.on('object:modified', () => {
    state.active = null;
    if (updateArrangementStatus) updateArrangementStatus('none');
  });
}

// -----------------------------------------------------------------------------
// 📦  General‑purpose helpers
// -----------------------------------------------------------------------------
const PI2 = 2 * Math.PI;

function getAngleDiff(current, previous) {
  let diff = current - previous;
  if (diff > 270)  diff -= 360;  // wrap CW
  if (diff < -270) diff += 360;  // wrap CCW
  return diff;
}

function getCo(side, obj, m) {
  switch (side) {
    case 'right':  return m.right  - obj.left;
    case 'left':   return obj.left - m.left;
    case 'bottom': return m.bottom - obj.top;
    case 'top':    return obj.top  - m.top;
    default:       return 0;
  }
}

// -----------------------------------------------------------------------------
// 🔁  Re‑usable maths for *every* restriction case
// -----------------------------------------------------------------------------
function restrictedAngle({ base, sign, inner }) {
  return base + sign * inner;
}

function computeInnerAngle({ co, hyp, diagOffset }) {
  const marginAngle = Math.asin(co / hyp);
  return marginAngle - diagOffset;
}

// -----------------------------------------------------------------------------
// 🧠  Active restriction processing (one function instead of 40 duplicated blocks)
// -----------------------------------------------------------------------------
function handleRestriction({ code, obj, corners, margins, diagAngle, complementDiagAngle, state }) {
  const meta = RESTRICTION_META[code];
  if (!meta) return; // safety

  const cornerPoint = corners[meta.corner];
  const diagOffset  = meta.diag === 'diag' ? diagAngle : complementDiagAngle;

  const co  = getCo(meta.side, obj, margins);
  const hyp = calculateDistance(obj.left, obj.top, cornerPoint.x, cornerPoint.y);
  const innerAngle = computeInnerAngle({ co, hyp, diagOffset });
  const angleRad   = restrictedAngle({ base: meta.base, sign: meta.sign, inner: innerAngle });

  // ---- Accumulated rotation bookkeeping ------------------------------------
  state.accumulated += state.angleDiff;
  if (state.accumulated >=  360) state.accumulated -= 360;
  if (state.accumulated <= -360) state.accumulated += 360;

  const allow = (meta.threshold === 'positive' && state.accumulated > 0) ||
                (meta.threshold === 'negative' && state.accumulated < 0);

  if (allow) {
    obj.angle = radToDeg(angleRad);
  } else {
    // When we ‘bounce’ back across the margin we seamlessly swap handler
    if (shouldSwitch(meta.opposite, corners, margins, state.clockwise)) {
      state.accumulated = 0;
      state.active      = meta.opposite;
    }
  }
}

// -----------------------------------------------------------------------------
// 🔍  Detect which restriction should become active (formerly 32 if‑clauses)
// -----------------------------------------------------------------------------
function detectRestriction(corners, margins, cw) {
  // Constantes para generar detección automáticamente
  const SIDES = ['right', 'bottom', 'left', 'top'];
  const CORNERS = ['TR', 'BR', 'BL', 'TL'];   // orden horario
  
  // Qué coordenada comparar y con qué margen
  const SIDE_CHECK = {
    right : (p, m) => p.x > m.right,
    left  : (p, m) => p.x < m.left,
    bottom: (p, m) => p.y > m.bottom,
    top   : (p, m) => p.y < m.top,
  };

  // Buscamos en orden horario / antihorario según cw
  const order = cw ? CORNERS : [...CORNERS].reverse();

  for (const side of SIDES) {
    for (const corner of order) {
      const point = corners[corner];
      if (SIDE_CHECK[side](point, margins)) {
        return `${corner}_${side.toUpperCase()}_${cw ? 'CW':'CCW'}`;
      }
    }
  }
  return null;
}

function shouldSwitch(code, corners, margins, cw) {
  return code && detectRestriction(corners, margins, cw) === code;
}

// -----------------------------------------------------------------------------
// 📋  Generated metadata factory – eliminates all magic number duplication
// -----------------------------------------------------------------------------
function buildRestrictionMeta() {
  const P = Math.PI;
  const PI2 = 2 * Math.PI;
  
  // Mapeo directo consolidado - elimina la duplicación pero mantiene la precisión
  const CONFIGS = {
    // RIGHT side
    'TR_right': { base: [0, P/2], diag: ['complement', 'diag'], opposite: ['BR_RIGHT_CCW', 'TL_RIGHT_CW'] },
    'BR_right': { base: [3*P/2, PI2], diag: ['diag', 'complement'], opposite: ['BL_RIGHT_CCW', 'TR_RIGHT_CW'] },
    'TL_right': { base: [P/2, P], diag: ['diag', 'complement'], opposite: ['TR_RIGHT_CCW', 'BL_RIGHT_CW'] },
    'BL_right': { base: [P, 3*P/2], diag: ['complement', 'diag'], opposite: ['TL_RIGHT_CCW', 'BR_RIGHT_CW'] },
    
    // BOTTOM side
    'BR_bottom': { base: [0, P/2], diag: ['diag', 'complement'], opposite: ['BL_BOTTOM_CCW', 'TR_BOTTOM_CW'] },
    'BL_bottom': { base: [3*P/2, PI2], diag: ['complement', 'diag'], opposite: ['TL_BOTTOM_CCW', 'BR_BOTTOM_CW'] },
    'TR_bottom': { base: [P/2, P], diag: ['complement', 'diag'], opposite: ['BR_BOTTOM_CCW', 'TL_BOTTOM_CW'] },
    'TL_bottom': { base: [P, 3*P/2], diag: ['diag', 'complement'], opposite: ['TR_BOTTOM_CCW', 'BL_BOTTOM_CW'] },
    
    // LEFT side
    'TL_left': { base: [3*P/2, PI2], diag: ['diag', 'complement'], opposite: ['TR_LEFT_CCW', 'BL_LEFT_CW'] },
    'BL_left': { base: [0, P/2], diag: ['complement', 'diag'], opposite: ['TL_LEFT_CCW', 'BR_LEFT_CW'] },
    'BR_left': { base: [P/2, P], diag: ['diag', 'complement'], opposite: ['BL_LEFT_CCW', 'TR_LEFT_CW'] },
    'TR_left': { base: [P, 3*P/2], diag: ['complement', 'diag'], opposite: ['BR_LEFT_CCW', 'TL_LEFT_CW'] },
    
    // TOP side
    'TL_top': { base: [0, P/2], diag: ['diag', 'complement'], opposite: ['TR_TOP_CCW', 'BL_TOP_CW'] },
    'TR_top': { base: [3*P/2, PI2], diag: ['complement', 'diag'], opposite: ['BR_TOP_CCW', 'TL_TOP_CW'] },
    'BL_top': { base: [P/2, P], diag: ['complement', 'diag'], opposite: ['TL_TOP_CCW', 'BR_TOP_CW'] },
    'BR_top': { base: [P, 3*P/2], diag: ['diag', 'complement'], opposite: ['BL_TOP_CCW', 'TR_TOP_CW'] },
  };

  const meta = {};
  const SIGN = { CW: +1, CCW: -1 };
  const THRESH = { CW: 'positive', CCW: 'negative' };

  // Generar todos los códigos a partir del mapeo consolidado
  Object.entries(CONFIGS).forEach(([key, config]) => {
    const [corner, side] = key.split('_');
    
    ['CW', 'CCW'].forEach((dir, idx) => {
      const code = `${corner}_${side.toUpperCase()}_${dir}`;
      
      meta[code] = {
        corner,
        side,
        base: config.base[idx],
        sign: SIGN[dir],
        diag: config.diag[idx],
        opposite: config.opposite[idx],
        threshold: THRESH[dir],
      };
    });
  });

  return meta;
}

const RESTRICTION_META = buildRestrictionMeta();

// -----------------------------------------------------------------------------
// Re‑export for external callers that relied on the old API -------------------
export { updateMarginRect };
