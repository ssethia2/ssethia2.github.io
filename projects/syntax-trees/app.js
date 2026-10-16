/**
 * Syntax tree visualizer UI.
 *
 * Web adaptation of the original openFrameworks renderer
 * (github.com/ssethia2/SyntaxTrees, src/cpp/src/ofApp.cpp), rendering the
 * X-bar tree as SVG instead of a desktop canvas.
 */

import { createTree } from './tree.js';
import { tagSentence, parseTags } from './tagger.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const LEVEL_HEIGHT = 64;   // Vertical distance between tree levels
const WORD_OFFSET = 36;    // Distance from a head node to its word
const PADDING = 32;        // Outer padding of the drawing
const MIN_LEAF_WIDTH = 56; // Minimum horizontal space per leaf

// --- Layout ------------------------------------------------------------

function leafWidth(node) {
  const labelLen = Math.max(node.label.length, (node.word || '').length);
  return Math.max(MIN_LEAF_WIDTH, labelLen * 10 + 24);
}

function children(node) {
  return [node.left, node.right].filter(Boolean);
}

/**
 * First pass: compute the width of each subtree.
 */
function measure(node) {
  const kids = children(node);
  if (kids.length === 0) {
    node.width = leafWidth(node);
    return node.width;
  }
  node.width = Math.max(
    kids.reduce((sum, kid) => sum + measure(kid), 0),
    leafWidth(node)
  );
  return node.width;
}

/**
 * Second pass: assign x/y coordinates, centering parents over children.
 */
function position(node, x0, depth, maxDepth) {
  node.depth = depth;
  node.y = PADDING + depth * LEVEL_HEIGHT;
  maxDepth.value = Math.max(maxDepth.value, depth);

  const kids = children(node);
  if (kids.length === 0) {
    node.x = x0 + node.width / 2;
    return;
  }

  const kidsWidth = kids.reduce((sum, kid) => sum + kid.width, 0);
  let cx = x0 + (node.width - kidsWidth) / 2;
  for (const kid of kids) {
    position(kid, cx, depth + 1, maxDepth);
    cx += kid.width;
  }
  node.x = (kids[0].x + kids[kids.length - 1].x) / 2;
}

// --- SVG rendering -------------------------------------------------------

function svgEl(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function drawNode(svg, node) {
  for (const kid of children(node)) {
    svg.appendChild(svgEl('line', {
      x1: node.x, y1: node.y + 6,
      x2: kid.x, y2: kid.y - 16,
      class: 'tree-edge'
    }));
    drawNode(svg, kid);
  }

  const isHead = children(node).length === 0;
  const labelClass = node.label.endsWith('P') || node.label === 'S' ? 'tree-label-phrase'
    : node.label.endsWith("'") ? 'tree-label-bar'
    : 'tree-label-head';

  const text = svgEl('text', {
    x: node.x, y: node.y,
    'text-anchor': 'middle',
    class: `tree-label ${labelClass}`
  });
  text.textContent = node.label;
  svg.appendChild(text);

  // Surface word hangs below its head node
  if (isHead && node.word) {
    svg.appendChild(svgEl('line', {
      x1: node.x, y1: node.y + 6,
      x2: node.x, y2: node.y + WORD_OFFSET - 14,
      class: 'tree-edge tree-edge-word'
    }));
    const word = svgEl('text', {
      x: node.x, y: node.y + WORD_OFFSET,
      'text-anchor': 'middle',
      class: 'tree-label tree-word'
    });
    word.textContent = node.word;
    svg.appendChild(word);
  }
}

function renderTree(root, container) {
  container.innerHTML = '';

  const maxDepth = { value: 0 };
  measure(root);
  position(root, PADDING, 0, maxDepth);

  const width = root.width + PADDING * 2;
  const height = PADDING * 2 + maxDepth.value * LEVEL_HEIGHT + WORD_OFFSET + 16;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width, height,
    role: 'img',
    'aria-label': 'X-bar theory syntax tree'
  });

  drawNode(svg, root);
  container.appendChild(svg);
}

// --- UI wiring -----------------------------------------------------------

function showMessage(container, message) {
  container.innerHTML = `<p class="tree-message">${message}</p>`;
}

function renderTokenChips(tagged, container) {
  container.innerHTML = '';
  if (!tagged.some(t => t.word)) return;

  for (const { word, tag } of tagged) {
    const chip = document.createElement('span');
    chip.className = 'token-chip';
    chip.innerHTML = `${word} <span class="token-tag">${tag}</span>`;
    container.appendChild(chip);
  }
}

function init() {
  const input = document.getElementById('sentence-input');
  const drawBtn = document.getElementById('draw-btn');
  const treeContainer = document.getElementById('tree-container');
  const chipsContainer = document.getElementById('token-chips');
  const modeBtns = document.querySelectorAll('.mode-btn');
  const exampleBtns = document.querySelectorAll('.example-btn');

  let mode = 'sentence';

  const draw = () => {
    const raw = input.value.trim();
    chipsContainer.innerHTML = '';

    if (!raw) {
      showMessage(treeContainer, 'Type a sentence above to draw its syntax tree.');
      return;
    }

    let tagged;
    if (mode === 'tags') {
      tagged = parseTags(raw);
      if (!tagged) {
        showMessage(treeContainer, 'Tags mode accepts only: D, N, V, Adj, Adv, P (space-separated).');
        return;
      }
    } else {
      tagged = tagSentence(raw);
      if (tagged.length === 0) {
        showMessage(treeContainer, 'No words found — try a simple English sentence.');
        return;
      }
    }

    const root = createTree(tagged);
    renderTokenChips(tagged, chipsContainer);
    renderTree(root, treeContainer);
  };

  drawBtn.addEventListener('click', draw);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') draw();
  });

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
      input.placeholder = mode === 'tags'
        ? 'e.g. D Adj N V P D N'
        : 'e.g. The quick brown fox jumps over the lazy dog';
    });
  });

  exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const exampleMode = btn.dataset.mode || 'sentence';
      const modeBtn = document.querySelector(`.mode-btn[data-mode="${exampleMode}"]`);
      if (modeBtn) modeBtn.click();
      input.value = btn.dataset.text;
      draw();
    });
  });

  showMessage(treeContainer, 'Type a sentence above to draw its syntax tree.');
}

document.addEventListener('DOMContentLoaded', init);
