/**
 * Matrix Transform & Complex Fractals Sandbox Application
 * Zero-dependency interactive visual mathematics playground.
 */

// ============================================================================
// 1. TABS SYSTEM INITIALIZATION
// ============================================================================
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(`${tabId}-tab`);
      if (activePane) {
        activePane.classList.add('active');
        if (tabId === 'vector') resizeVectorCanvas();
        if (tabId === 'fractal') resizeFractalCanvas();
      }
    });
  });
}

// ============================================================================
// 2. 2D LINEAR TRANSFORMATIONS GRID VISUALIZER
// ============================================================================
const vCanvas = document.getElementById('vector-canvas');
let vCtx = null;
if (vCanvas) vCtx = vCanvas.getContext('2d');

let gridScale = 50; // 50 pixels = 1 coordinate unit
let matrix = { a: 1.0, b: 0.5, c: 0.0, d: 1.0 };
let animMatrix = { a: 1.0, b: 0.0, c: 0.0, d: 1.0 }; // Interpolated state
let animationId = null;

function resizeVectorCanvas() {
  if (!vCanvas) return;
  const rect = vCanvas.parentNode.getBoundingClientRect();
  vCanvas.width = rect.width;
  vCanvas.height = rect.height;
  drawVectors();
}

// Draw the Grid and Basis Vectors
function drawVectors() {
  if (!vCtx) return;
  const w = vCanvas.width;
  const h = vCanvas.height;
  const cx = w / 2;
  const cy = h / 2;

  vCtx.clearRect(0, 0, w, h);

  // Helper to draw grid lines
  const drawGrid = (mat, color, isBold = false) => {
    vCtx.strokeStyle = color;
    vCtx.lineWidth = isBold ? 1.5 : 0.6;
    
    const maxGridLines = 15;
    
    // Draw horizontal & vertical grid mesh
    for (let x = -maxGridLines; x <= maxGridLines; x++) {
      // Draw grid line for constant X (varying Y from -15 to 15)
      vCtx.beginPath();
      for (let y = -maxGridLines; y <= maxGridLines; y++) {
        // Warp coordinate: X = x*a + y*b, Y = x*c + y*d
        const tx = (x * mat.a + y * mat.b) * gridScale + cx;
        const ty = cy - (x * mat.c + y * mat.d) * gridScale;
        if (y === -maxGridLines) vCtx.moveTo(tx, ty);
        else vCtx.lineTo(tx, ty);
      }
      vCtx.stroke();
    }

    for (let y = -maxGridLines; y <= maxGridLines; y++) {
      // Draw grid line for constant Y (varying X from -15 to 15)
      vCtx.beginPath();
      for (let x = -maxGridLines; x <= maxGridLines; x++) {
        const tx = (x * mat.a + y * mat.b) * gridScale + cx;
        const ty = cy - (x * mat.c + y * mat.d) * gridScale;
        if (x === -maxGridLines) vCtx.moveTo(tx, ty);
        else vCtx.lineTo(tx, ty);
      }
      vCtx.stroke();
    }
  };

  // Helper to draw a vector arrow
  const drawArrow = (vx, vy, color, label, width = 3) => {
    const tx = vx * gridScale + cx;
    const ty = cy - vy * gridScale;

    vCtx.strokeStyle = color;
    vCtx.fillStyle = color;
    vCtx.lineWidth = width;

    // Draw main shaft
    vCtx.beginPath();
    vCtx.moveTo(cx, cy);
    vCtx.lineTo(tx, ty);
    vCtx.stroke();

    // Draw Arrowhead
    const angle = Math.atan2(cy - ty, tx - cx);
    const arrowSize = 8;
    vCtx.beginPath();
    vCtx.moveTo(tx, ty);
    vCtx.lineTo(tx - arrowSize * Math.cos(angle - Math.PI / 6), ty + arrowSize * Math.sin(angle - Math.PI / 6));
    vCtx.lineTo(tx - arrowSize * Math.cos(angle + Math.PI / 6), ty + arrowSize * Math.sin(angle + Math.PI / 6));
    vCtx.fill();

    // Draw Vector label
    if (label) {
      vCtx.font = '700 13px "JetBrains Mono", monospace';
      vCtx.fillText(label, tx + 10 * Math.cos(angle), ty - 10 * Math.sin(angle) + 4);
    }
  };

  // 1. Draw original background grid (Subtle gray/blue)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  drawGrid({ a: 1, b: 0, c: 0, d: 1 }, isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)');

  // 2. Draw original Basis area (Unit square)
  vCtx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.03)';
  vCtx.beginPath();
  vCtx.moveTo(cx, cy);
  vCtx.lineTo(1 * gridScale + cx, cy);
  vCtx.lineTo(1 * gridScale + cx, cy - 1 * gridScale);
  vCtx.lineTo(cx, cy - 1 * gridScale);
  vCtx.closePath();
  vCtx.fill();

  // 3. Draw original basis vectors î and ĵ
  drawArrow(1, 0, '#3b82f6', 'î', 2);
  drawArrow(0, 1, '#10b981', 'ĵ', 2);

  // 4. Draw transformed grid space (morphed orange)
  drawGrid(animMatrix, isDark ? 'rgba(255, 122, 89, 0.16)' : 'rgba(255, 122, 89, 0.12)', true);

  // 5. Draw transformed unit area (parallelogram)
  vCtx.fillStyle = 'rgba(255, 122, 89, 0.09)';
  vCtx.beginPath();
  vCtx.moveTo(cx, cy);
  vCtx.lineTo(animMatrix.a * gridScale + cx, cy - animMatrix.c * gridScale);
  vCtx.lineTo((animMatrix.a + animMatrix.b) * gridScale + cx, cy - (animMatrix.c + animMatrix.d) * gridScale);
  vCtx.lineTo(animMatrix.b * gridScale + cx, cy - animMatrix.d * gridScale);
  vCtx.closePath();
  vCtx.fill();

  // 6. Draw transformed basis vectors M*î and M*ĵ
  drawArrow(animMatrix.a, animMatrix.c, '#ff7a59', 'M·î', 4);
  drawArrow(animMatrix.b, animMatrix.d, '#f857a6', 'M·ĵ', 4);
}

// Calculate Determinant & explain areas
function calculateDeterminant() {
  const det = matrix.a * matrix.d - matrix.b * matrix.c;
  const detLabel = document.getElementById('matrix-det');
  const explanation = document.getElementById('det-explanation');

  if (!detLabel || !explanation) return;

  const rounded = Math.round(det * 100) / 100;
  detLabel.textContent = `det(M) = ${rounded}`;

  if (Math.abs(rounded) < 0.001) {
    explanation.textContent = "Area collapsed to 0! Matrix is singular (line/point).";
    explanation.style.color = '#ef4444';
  } else if (rounded < 0) {
    explanation.textContent = `Orientation is reversed! Area scale factor is ${Math.abs(rounded)}.`;
    explanation.style.color = '#ff9e80';
  } else {
    explanation.textContent = `Grid area scaled by factor of ${rounded}.`;
    explanation.style.color = 'var(--text-secondary)';
  }
}

// Smooth Grid Morphing Animation
function triggerTransformAnimation() {
  if (animationId) cancelAnimationFrame(animationId);

  const duration = 1500; // 1.5 seconds
  const start = performance.now();
  
  const startA = animMatrix.a;
  const startB = animMatrix.b;
  const startC = animMatrix.c;
  const startD = animMatrix.d;

  const animate = (timestamp) => {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Easing function (easeOutExpo)
    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

    animMatrix.a = startA + (matrix.a - startA) * ease;
    animMatrix.b = startB + (matrix.b - startB) * ease;
    animMatrix.c = startC + (matrix.c - startC) * ease;
    animMatrix.d = startD + (matrix.d - startD) * ease;

    drawVectors();

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      animationId = null;
    }
  };

  animationId = requestAnimationFrame(animate);
}

function initVectorEvents() {
  const inputA = document.getElementById('mat-a');
  const inputB = document.getElementById('mat-b');
  const inputC = document.getElementById('mat-c');
  const inputD = document.getElementById('mat-d');
  const animateBtn = document.getElementById('animate-transform-btn');
  const presets = document.querySelectorAll('[data-matrix]');

  if (!inputA) return;

  const updateMatrixValues = () => {
    matrix.a = parseFloat(inputA.value) || 0;
    matrix.b = parseFloat(inputB.value) || 0;
    matrix.c = parseFloat(inputC.value) || 0;
    matrix.d = parseFloat(inputD.value) || 0;
    calculateDeterminant();
    triggerTransformAnimation();
  };

  [inputA, inputB, inputC, inputD].forEach(input => {
    input.addEventListener('input', updateMatrixValues);
  });

  if (animateBtn) {
    animateBtn.addEventListener('click', () => {
      // Reset animMatrix to Identity, then run smooth morph to target
      animMatrix = { a: 1.0, b: 0.0, c: 0.0, d: 1.0 };
      triggerTransformAnimation();
    });
  }

  // Handle Preset Clicks
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const vals = btn.dataset.matrix.split(',').map(Number);
      inputA.value = vals[0];
      inputB.value = vals[1];
      inputC.value = vals[2];
      inputD.value = vals[3];
      updateMatrixValues();
    });
  });

  // Initial trigger
  updateMatrixValues();
}


// ============================================================================
// 3. COMPLEX FRACTALS GENERATOR ENGINES
// ============================================================================
const fCanvas = document.getElementById('fractal-canvas');
let fCtx = null;
if (fCanvas) fCtx = fCanvas.getContext('2d');

let isMandelbrot = true;
let maxIterations = 40;
let fractalHue = 280; // Default Neon violet
let juliaC = { r: -0.7, i: 0.27015 };

// Coordinate View Bounds
let view = {
  minR: -2.0,
  maxR: 1.0,
  minI: -1.2,
  maxI: 1.2
};

function resizeFractalCanvas() {
  if (!fCanvas) return;
  const rect = fCanvas.parentNode.getBoundingClientRect();
  // Fixed canvas pixels size buffer for high fluid framerates
  fCanvas.width = 500;
  fCanvas.height = 380;
  drawFractal();
}

// Render Complex numbers Recursively (Double Loop Raw Pixels Buffer)
function drawFractal() {
  if (!fCtx) return;

  const spinner = document.getElementById('render-spinner');
  if (spinner) spinner.classList.remove('hidden');

  // Async defer for smooth main-thread slider responsiveness
  setTimeout(() => {
    const w = fCanvas.width;
    const h = fCanvas.height;
    const imgData = fCtx.createImageData(w, h);
    const data = imgData.data;

    const rRange = view.maxR - view.minR;
    const iRange = view.maxI - view.minI;

    // Double loop across every single pixel coordinate
    for (let x = 0; x < w; x++) {
      // Map screen X coordinate to Complex Real boundary
      const cr0 = view.minR + (x / w) * rRange;

      for (let y = 0; y < h; y++) {
        // Map screen Y coordinate to Complex Imaginary boundary
        const ci0 = view.maxI - (y / h) * iRange;

        let zr = isMandelbrot ? 0 : cr0;
        let zi = isMandelbrot ? 0 : ci0;
        let cr = isMandelbrot ? cr0 : juliaC.r;
        let ci = isMandelbrot ? ci0 : juliaC.i;

        let n = 0;
        let zr2 = zr * zr;
        let zi2 = zi * zi;

        // Recursive Mandelbrot/Julia formula: Zn+1 = Zn^2 + C
        while (zr2 + zi2 <= 4.0 && n < maxIterations) {
          zi = 2.0 * zr * zi + ci;
          zr = zr2 - zi2 + cr;
          zr2 = zr * zr;
          zi2 = zi * zi;
          n++;
        }

        // Color Mapping
        const pixelIdx = (x + y * w) * 4;

        if (n === maxIterations) {
          // Inside boundary -> Black
          data[pixelIdx] = 11;     // R
          data[pixelIdx + 1] = 15; // G
          data[pixelIdx + 2] = 25; // B
          data[pixelIdx + 3] = 255;// Alpha
        } else {
          // Escape count maps to dynamic HSL
          const hue = (n * 8 + fractalHue) % 360;
          const lightness = 40 + (n / maxIterations) * 30;
          
          // Fast HSL to RGB approximation
          const cVal = (1 - Math.abs(2 * (lightness / 100) - 1)) * 0.9;
          const xVal = cVal * (1 - Math.abs(((hue / 60) % 2) - 1));
          const mVal = (lightness / 100) - cVal / 2;

          let r1 = 0, g1 = 0, b1 = 0;
          if (hue < 60) { r1 = cVal; g1 = xVal; }
          else if (hue < 120) { r1 = xVal; g1 = cVal; }
          else if (hue < 180) { g1 = cVal; b1 = xVal; }
          else if (hue < 240) { g1 = xVal; b1 = cVal; }
          else if (hue < 300) { r1 = xVal; b1 = cVal; }
          else { r1 = cVal; b1 = xVal; }

          data[pixelIdx] = Math.floor((r1 + mVal) * 255);
          data[pixelIdx + 1] = Math.floor((g1 + mVal) * 255);
          data[pixelIdx + 2] = Math.floor((b1 + mVal) * 255);
          data[pixelIdx + 3] = 255;
        }
      }
    }

    fCtx.putImageData(imgData, 0, 0);
    if (spinner) spinner.classList.add('hidden');
  }, 16);
}

function initFractalEvents() {
  const fSelect = document.getElementById('fractal-select');
  const juliaContainer = document.getElementById('julia-params-container');
  const crSlider = document.getElementById('julia-cr');
  const crVal = document.getElementById('cr-val');
  const ciSlider = document.getElementById('julia-ci');
  const ciVal = document.getElementById('ci-val');
  const iterSlider = document.getElementById('fractal-iter');
  const iterVal = document.getElementById('iter-val');
  const hueSlider = document.getElementById('fractal-color');
  const hueVal = document.getElementById('hue-val');
  const resetBtn = document.getElementById('reset-fractal');
  const presets = document.querySelectorAll('.fractal-preset');

  if (!fSelect) return;

  // Track Select box toggles
  fSelect.addEventListener('change', (e) => {
    isMandelbrot = e.target.value === 'mandelbrot';
    
    if (isMandelbrot) {
      juliaContainer.classList.add('hidden');
      view = { minR: -2.0, maxR: 1.0, minI: -1.2, maxI: 1.2 };
    } else {
      juliaContainer.classList.remove('hidden');
      view = { minR: -1.5, maxR: 1.5, minI: -1.2, maxI: 1.2 };
    }
    drawFractal();
  });

  // Track Julia real slider
  crSlider.addEventListener('input', (e) => {
    juliaC.r = parseFloat(e.target.value) / 100;
    crVal.textContent = juliaC.r;
    drawFractal();
  });

  // Track Julia imaginary slider
  ciSlider.addEventListener('input', (e) => {
    juliaC.i = parseFloat(e.target.value) / 100;
    ciVal.textContent = juliaC.i;
    drawFractal();
  });

  // Track Iteration slider
  iterSlider.addEventListener('input', (e) => {
    maxIterations = parseInt(e.target.value);
    iterVal.textContent = maxIterations;
    drawFractal();
  });

  // Track Color theme slider
  hueSlider.addEventListener('input', (e) => {
    fractalHue = parseInt(e.target.value);
    
    // Map numerical slider to named themes
    let name = "Custom";
    if (fractalHue < 40) name = "Cyberpunk Orange";
    else if (fractalHue < 100) name = "Golden Hour";
    else if (fractalHue < 170) name = "Acid Emerald";
    else if (fractalHue < 250) name = "Electric Teal";
    else if (fractalHue < 310) name = "Neon Violet";
    else name = "Cosmic Rose";

    hueVal.textContent = name;
    drawFractal();
  });

  // Handle julia presets
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const vals = btn.dataset.params.split(',').map(Number);
      juliaC.r = vals[0];
      juliaC.i = vals[1];
      
      // Switch to Julia mode
      fSelect.value = 'julia';
      isMandelbrot = false;
      juliaContainer.classList.remove('hidden');
      view = { minR: -1.5, maxR: 1.5, minI: -1.2, maxI: 1.2 };
      
      crSlider.value = Math.round(vals[0] * 100);
      ciSlider.value = Math.round(vals[1] * 100);
      
      crVal.textContent = vals[0];
      ciVal.textContent = vals[1];
      
      drawFractal();
    });
  });

  // Handle coordinates reset
  resetBtn.addEventListener('click', () => {
    if (isMandelbrot) {
      view = { minR: -2.0, maxR: 1.0, minI: -1.2, maxI: 1.2 };
    } else {
      view = { minR: -1.5, maxR: 1.5, minI: -1.2, maxI: 1.2 };
    }
    drawFractal();
  });

  // ZOOM & PAN MECHANICS FOR FRACTAL canvas
  let isDraggingFractal = false;
  let dragStart = { x: 0, y: 0 };

  const wrapper = fCanvas.parentNode;

  wrapper.addEventListener('mousedown', (e) => {
    isDraggingFractal = true;
    dragStart = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingFractal) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    dragStart = { x: e.clientX, y: e.clientY };

    const rRange = view.maxR - view.minR;
    const iRange = view.maxI - view.minI;

    // Convert pixel offsets to complex bounds ratios
    const rShift = (dx / fCanvas.width) * rRange;
    const iShift = (dy / fCanvas.height) * iRange;

    view.minR -= rShift;
    view.maxR -= rShift;
    view.minI += iShift;
    view.maxI += iShift;

    drawFractal();
  });

  window.addEventListener('mouseup', () => {
    isDraggingFractal = false;
  });

  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Find zoom center relative to the canvas pixels coords
    const rect = fCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const rRange = view.maxR - view.minR;
    const iRange = view.maxI - view.minI;

    // Zoom factor scaling
    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
    
    // Zoom focus center mapped on Complex space
    const focusR = view.minR + (mx / rect.width) * rRange;
    const focusI = view.maxI - (my / rect.height) * iRange;

    // Apply scaling around target focus coordinate
    view.minR = focusR - (focusR - view.minR) * zoomFactor;
    view.maxR = focusR + (view.maxR - focusR) * zoomFactor;
    view.minI = focusI - (focusI - view.minI) * zoomFactor;
    view.maxI = focusI + (view.maxI - focusI) * zoomFactor;

    drawFractal();
  });
}


// ============================================================================
// 4. MAIN LOAD BOOTSTRAP
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  
  // Start Vectors visualizer
  initVectorEvents();
  resizeVectorCanvas();
  
  // Start Fractals visualizer
  initFractalEvents();
  resizeFractalCanvas();

  window.addEventListener('resize', () => {
    const currentTab = document.querySelector('.tab-btn.active').dataset.tab;
    if (currentTab === 'vector') resizeVectorCanvas();
    if (currentTab === 'fractal') resizeFractalCanvas();
  });
});
