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
function detectRestriction(c, m, cw) {
  const r = [
    { ok: c.TR.x > m.right  &&  cw, code: 'TR_RIGHT_CW'  },
    { ok: c.BR.x > m.right  && !cw, code: 'BR_RIGHT_CCW' },
    { ok: c.TL.x > m.right  &&  cw, code: 'TL_RIGHT_CW'  },
    { ok: c.TR.x > m.right  && !cw, code: 'TR_RIGHT_CCW' },
    { ok: c.BL.x > m.right  &&  cw, code: 'BL_RIGHT_CW'  },
    { ok: c.TL.x > m.right  && !cw, code: 'TL_RIGHT_CCW' },
    { ok: c.BR.x > m.right  &&  cw, code: 'BR_RIGHT_CW'  },
    { ok: c.BL.x > m.right  && !cw, code: 'BL_RIGHT_CCW' },

    { ok: c.BR.y > m.bottom &&  cw, code: 'BR_BOTTOM_CW' },
    { ok: c.BL.y > m.bottom && !cw, code: 'BL_BOTTOM_CCW'},
    { ok: c.TR.y > m.bottom &&  cw, code: 'TR_BOTTOM_CW' },
    { ok: c.BR.y > m.bottom && !cw, code: 'BR_BOTTOM_CCW'},
    { ok: c.TL.y > m.bottom &&  cw, code: 'TL_BOTTOM_CW' },
    { ok: c.TR.y > m.bottom && !cw, code: 'TR_BOTTOM_CCW'},
    { ok: c.BL.y > m.bottom &&  cw, code: 'BL_BOTTOM_CW' },
    { ok: c.TL.y > m.bottom && !cw, code: 'TL_BOTTOM_CCW'},

    { ok: c.TL.x < m.left   && !cw, code: 'TL_LEFT_CCW'  },
    { ok: c.BL.x < m.left   &&  cw, code: 'BL_LEFT_CW'   },
    { ok: c.BL.x < m.left   && !cw, code: 'BL_LEFT_CCW'  },
    { ok: c.BR.x < m.left   &&  cw, code: 'BR_LEFT_CW'   },
    { ok: c.BR.x < m.left   && !cw, code: 'BR_LEFT_CCW'  },
    { ok: c.TR.x < m.left   &&  cw, code: 'TR_LEFT_CW'   },
    { ok: c.TR.x < m.left   && !cw, code: 'TR_LEFT_CCW'  },
    { ok: c.TL.x < m.left   &&  cw, code: 'TL_LEFT_CW'   },

    { ok: c.TL.y < m.top    &&  cw, code: 'TL_TOP_CW'    },
    { ok: c.TR.y < m.top    && !cw, code: 'TR_TOP_CCW'   },
    { ok: c.BL.y < m.top    &&  cw, code: 'BL_TOP_CW'    },
    { ok: c.TL.y < m.top    && !cw, code: 'TL_TOP_CCW'   },
    { ok: c.BR.y < m.top    &&  cw, code: 'BR_TOP_CW'    },
    { ok: c.BL.y < m.top    && !cw, code: 'BL_TOP_CCW'   },
    { ok: c.TR.y < m.top    &&  cw, code: 'TR_TOP_CW'    },
    { ok: c.BR.y < m.top    && !cw, code: 'BR_TOP_CCW'   },
  ].find(r => r.ok);
  return r ? r.code : null;
}

function shouldSwitch(code, corners, margins, cw) {
  return code && detectRestriction(corners, margins, cw) === code;
}

// -----------------------------------------------------------------------------
// 📋  Static metadata – one place for all the magic numbers
// -----------------------------------------------------------------------------
const RESTRICTION_META = (() => {
  const P  = Math.PI;
  return {
    //   code               corner side   base       sign diag          opposite           threshold
    TR_RIGHT_CW:  { corner:'TR', side:'right',  base:0,       sign:+1, diag:'complement', opposite:'BR_RIGHT_CCW',  threshold:'positive' },
    BR_RIGHT_CCW: { corner:'BR', side:'right',  base:PI2,     sign:-1, diag:'complement', opposite:'TR_RIGHT_CW',   threshold:'negative' },
    TL_RIGHT_CW:  { corner:'TL', side:'right',  base:P/2,     sign:+1, diag:'diag',       opposite:'TR_RIGHT_CCW',  threshold:'positive' },
    TR_RIGHT_CCW: { corner:'TR', side:'right',  base:P/2,     sign:-1, diag:'diag',       opposite:'TL_RIGHT_CW',   threshold:'negative' },
    BL_RIGHT_CW:  { corner:'BL', side:'right',  base:P,       sign:+1, diag:'complement', opposite:'TL_RIGHT_CCW',  threshold:'positive' },
    TL_RIGHT_CCW: { corner:'TL', side:'right',  base:P,       sign:-1, diag:'complement', opposite:'BL_RIGHT_CW',   threshold:'negative' },
    BR_RIGHT_CW:  { corner:'BR', side:'right',  base:3*P/2,   sign:+1, diag:'diag',       opposite:'BL_RIGHT_CCW',  threshold:'positive' },
    BL_RIGHT_CCW: { corner:'BL', side:'right',  base:3*P/2,   sign:-1, diag:'diag',       opposite:'BR_RIGHT_CW',   threshold:'negative' },

    BR_BOTTOM_CW: { corner:'BR', side:'bottom', base:0,       sign:+1, diag:'diag',       opposite:'BL_BOTTOM_CCW', threshold:'positive' },
    BL_BOTTOM_CCW:{ corner:'BL', side:'bottom', base:PI2,     sign:-1, diag:'diag',       opposite:'BR_BOTTOM_CW',  threshold:'negative' },
    TR_BOTTOM_CW: { corner:'TR', side:'bottom', base:P/2,     sign:+1, diag:'complement', opposite:'BR_BOTTOM_CCW', threshold:'positive' },
    BR_BOTTOM_CCW:{ corner:'BR', side:'bottom', base:P/2,     sign:-1, diag:'complement', opposite:'TR_BOTTOM_CW',  threshold:'negative' },
    TL_BOTTOM_CW: { corner:'TL', side:'bottom', base:P,       sign:+1, diag:'diag',       opposite:'TR_BOTTOM_CCW', threshold:'positive' },
    TR_BOTTOM_CCW:{ corner:'TR', side:'bottom', base:P,       sign:-1, diag:'diag',       opposite:'TL_BOTTOM_CW',  threshold:'negative' },
    BL_BOTTOM_CW: { corner:'BL', side:'bottom', base:3*P/2,   sign:+1, diag:'complement', opposite:'TL_BOTTOM_CCW', threshold:'positive' },
    TL_BOTTOM_CCW:{ corner:'TL', side:'bottom', base:3*P/2,   sign:-1, diag:'complement', opposite:'BL_BOTTOM_CW',  threshold:'negative' },

    TL_LEFT_CCW:  { corner:'TL', side:'left',   base:PI2,     sign:-1, diag:'complement', opposite:'BL_LEFT_CW',    threshold:'negative' },
    BL_LEFT_CW:   { corner:'BL', side:'left',   base:0,       sign:+1, diag:'complement', opposite:'TL_LEFT_CCW',   threshold:'positive' },
    BL_LEFT_CCW:  { corner:'BL', side:'left',   base:P/2,     sign:-1, diag:'diag',       opposite:'BR_LEFT_CW',    threshold:'negative' },
    BR_LEFT_CW:   { corner:'BR', side:'left',   base:P/2,     sign:+1, diag:'diag',       opposite:'BL_LEFT_CCW',   threshold:'positive' },
    BR_LEFT_CCW:  { corner:'BR', side:'left',   base:P,       sign:-1, diag:'complement', opposite:'TR_LEFT_CW',    threshold:'negative' },
    TR_LEFT_CW:   { corner:'TR', side:'left',   base:P,       sign:+1, diag:'complement', opposite:'BR_LEFT_CCW',   threshold:'positive' },
    TR_LEFT_CCW:  { corner:'TR', side:'left',   base:3*P/2,   sign:-1, diag:'diag',       opposite:'TL_LEFT_CW',    threshold:'negative' },
    TL_LEFT_CW:   { corner:'TL', side:'left',   base:3*P/2,   sign:+1, diag:'diag',       opposite:'TR_LEFT_CCW',   threshold:'positive' },

    TL_TOP_CW:    { corner:'TL', side:'top',    base:0,       sign:+1, diag:'diag',       opposite:'TR_TOP_CCW',    threshold:'positive' },
    TR_TOP_CCW:   { corner:'TR', side:'top',    base:PI2,     sign:-1, diag:'diag',       opposite:'TL_TOP_CW',     threshold:'negative' },
    BL_TOP_CW:    { corner:'BL', side:'top',    base:P/2,     sign:+1, diag:'complement', opposite:'TL_TOP_CCW',    threshold:'positive' },
    TL_TOP_CCW:   { corner:'TL', side:'top',    base:P/2,     sign:-1, diag:'complement', opposite:'BL_TOP_CW',     threshold:'negative' },
    BR_TOP_CW:    { corner:'BR', side:'top',    base:P,       sign:+1, diag:'diag',       opposite:'BL_TOP_CCW',    threshold:'positive' },
    BL_TOP_CCW:   { corner:'BL', side:'top',    base:P,       sign:-1, diag:'diag',       opposite:'BR_TOP_CW',     threshold:'negative' },
    TR_TOP_CW:    { corner:'TR', side:'top',    base:3*P/2,   sign:+1, diag:'complement', opposite:'BR_TOP_CCW',    threshold:'positive' },
    BR_TOP_CCW:   { corner:'BR', side:'top',    base:3*P/2,   sign:-1, diag:'complement', opposite:'TR_TOP_CW',     threshold:'negative' },
  };
})();

// -----------------------------------------------------------------------------
// Re‑export for external callers that relied on the old API -------------------
export { updateMarginRect };
