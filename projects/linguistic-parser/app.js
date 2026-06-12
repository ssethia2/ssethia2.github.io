/**
 * Linguistic Syntax Tree & IPA Vocalizer Application
 * Zero-dependency client-side NLP and acoustic synthesis sandbox.
 */

// ============================================================================
// 0. CSS VARIABLE HELPER FOR CANVAS
// ============================================================================
// Canvas 2D API cannot resolve CSS custom properties (var(--x)).
// This helper reads computed styles from the document root.
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

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
        // Trigger canvas resize fits when tab is made active
        if (tabId === 'syntax') resizeTreeCanvas();
        if (tabId === 'ipa') resizeWaveCanvas();
      }
    });
  });
}

// ============================================================================
// 2. CONTEXT-FREE GRAMMAR & SYNTAX TREE PARSER
// ============================================================================

// Grammar Rules for Parts-Of-Speech Tagging
const posLexicon = {
  // Determiners
  'the': 'Det', 'a': 'Det', 'an': 'Det', 'this': 'Det', 'that': 'Det',
  'some': 'Det', 'every': 'Det', 'each': 'Det', 'my': 'Det', 'his': 'Det',
  'her': 'Det', 'our': 'Det', 'their': 'Det', 'its': 'Det', 'no': 'Det',
  'any': 'Det', 'all': 'Det',

  // Adjectives
  'senior': 'Adj', 'beautiful': 'Adj', 'elegant': 'Adj', 'creative': 'Adj', 'human': 'Adj',
  'structural': 'Adj', 'linguistics': 'Adj', 'mathematical': 'Adj', 'full-stack': 'Adj',
  'big': 'Adj', 'blue': 'Adj', 'red': 'Adj', 'small': 'Adj', 'large': 'Adj',
  'fast': 'Adj', 'slow': 'Adj', 'old': 'Adj', 'new': 'Adj', 'good': 'Adj',
  'bad': 'Adj', 'long': 'Adj', 'short': 'Adj', 'young': 'Adj', 'tall': 'Adj',
  'dark': 'Adj', 'bright': 'Adj', 'hot': 'Adj', 'cold': 'Adj', 'nice': 'Adj',
  'pretty': 'Adj', 'happy': 'Adj', 'sad': 'Adj', 'funny': 'Adj', 'smart': 'Adj',
  'great': 'Adj', 'soft': 'Adj', 'hard': 'Adj', 'quick': 'Adj',

  // Nouns
  'developer': 'N', 'applications': 'N', 'connections': 'N', 'customer': 'N',
  'language': 'N', 'theorems': 'N', 'proofs': 'N', 'equations': 'N', 'mathematics': 'N',
  'satvik': 'N', 'hubspot': 'N', 'uiuc': 'N', 'soccer': 'N', 'piano': 'N',
  'dog': 'N', 'cat': 'N', 'man': 'N', 'woman': 'N', 'child': 'N', 'children': 'N',
  'house': 'N', 'car': 'N', 'tree': 'N', 'city': 'N', 'world': 'N', 'book': 'N',
  'people': 'N', 'school': 'N', 'food': 'N', 'water': 'N', 'time': 'N', 'day': 'N',
  'year': 'N', 'way': 'N', 'thing': 'N', 'life': 'N', 'hand': 'N', 'head': 'N',
  'eye': 'N', 'room': 'N', 'story': 'N', 'team': 'N', 'game': 'N', 'system': 'N',
  'program': 'N', 'code': 'N', 'data': 'N', 'user': 'N', 'page': 'N', 'site': 'N',
  'server': 'N', 'network': 'N', 'software': 'N', 'engineer': 'N', 'student': 'N',
  'teacher': 'N', 'friend': 'N', 'computer': 'N',

  // Verbs
  'built': 'V', 'scales': 'V', 'explores': 'V', 'proves': 'V', 'creates': 'V', 'develops': 'V',
  'loves': 'V', 'plays': 'V', 'watches': 'V', 'is': 'V', 'are': 'V', 'writes': 'V',
  'run': 'V', 'runs': 'V', 'ran': 'V', 'eat': 'V', 'eats': 'V', 'ate': 'V',
  'go': 'V', 'goes': 'V', 'went': 'V', 'see': 'V', 'sees': 'V', 'saw': 'V',
  'make': 'V', 'makes': 'V', 'made': 'V', 'take': 'V', 'takes': 'V', 'took': 'V',
  'give': 'V', 'gives': 'V', 'gave': 'V', 'know': 'V', 'knows': 'V', 'knew': 'V',
  'think': 'V', 'thinks': 'V', 'thought': 'V', 'come': 'V', 'comes': 'V', 'came': 'V',
  'want': 'V', 'wants': 'V', 'like': 'V', 'likes': 'V', 'use': 'V', 'uses': 'V',
  'find': 'V', 'finds': 'V', 'found': 'V', 'tell': 'V', 'tells': 'V', 'told': 'V',
  'ask': 'V', 'asks': 'V', 'work': 'V', 'works': 'V', 'call': 'V', 'calls': 'V',
  'try': 'V', 'tries': 'V', 'need': 'V', 'needs': 'V', 'feel': 'V', 'feels': 'V',
  'become': 'V', 'becomes': 'V', 'leave': 'V', 'leaves': 'V', 'put': 'V', 'puts': 'V',
  'read': 'V', 'reads': 'V', 'keep': 'V', 'keeps': 'V', 'let': 'V', 'lets': 'V',
  'begin': 'V', 'begins': 'V', 'show': 'V', 'shows': 'V', 'hear': 'V', 'hears': 'V',
  'move': 'V', 'moves': 'V', 'live': 'V', 'lives': 'V', 'walk': 'V', 'walks': 'V',
  'stand': 'V', 'stands': 'V', 'lose': 'V', 'loses': 'V', 'pay': 'V', 'pays': 'V',
  'build': 'V', 'builds': 'V', 'play': 'V', 'write': 'V'
};

// Context-aware fallback tagger when the lexicon misses a word
function guessTag(word, index, totalWords, taggedSoFar) {
  const clean = word.toLowerCase().trim();
  if (posLexicon[clean]) return posLexicon[clean];

  // Determine what the preceding tag was (if available)
  const prevTag = (taggedSoFar && taggedSoFar.length > 0)
    ? taggedSoFar[taggedSoFar.length - 1].tag
    : null;

  // Verb-like endings (past tense / progressive)
  if (clean.endsWith('ed') || clean.endsWith('ing')) return 'V';

  // Adjective-like endings
  if (clean.endsWith('ful') || clean.endsWith('ive') || clean.endsWith('al') || clean.endsWith('ic')
      || clean.endsWith('ous') || clean.endsWith('ish') || clean.endsWith('less') || clean.endsWith('able')
      || clean.endsWith('ible')) return 'Adj';

  // Words ending in 's' — use context to disambiguate noun vs verb
  if (clean.endsWith('s')) {
    // After a Det or Adj the word is almost certainly a (plural) Noun
    if (prevTag === 'Det' || prevTag === 'Adj') return 'N';
    // Right after a Noun it is likely a Verb ("the dog runs")
    if (prevTag === 'N') return 'V';
    // At position 0 it is likely a subject Noun
    if (index === 0) return 'N';
    // Fallback: if early in sentence lean Noun, else Verb
    return (index < totalWords / 2) ? 'N' : 'V';
  }

  // Words ending in 'ly' are adverbs — tag as Adj for simplicity
  if (clean.endsWith('ly')) return 'Adj';

  // If the word follows a Det or Adj, it is probably a Noun
  if (prevTag === 'Det' || prevTag === 'Adj') return 'N';

  // Default to Noun for unknown words
  return 'N';
}

// Context-Free Parsing: Sentence -> NP VP
// NP -> (Det)? (Adj)* N
// VP -> V NP
function parseSentence(sentence) {
  const cleanSentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  if (!cleanSentence) return null;

  const words = cleanSentence.split(/\s+/);
  const total = words.length;
  
  // Tag all words with context awareness
  const taggedWords = [];
  words.forEach((word, idx) => {
    let tag = guessTag(word, idx, total, taggedWords);
    taggedWords.push({ word, tag });
  });

  // Group tags into Phrases
  // Step 1: Group noun phrase blocks
  // Find Verb split index
  let verbIdx = taggedWords.findIndex(tw => tw.tag === 'V');
  if (verbIdx === -1) {
    // If no verb, try to guess or split half
    verbIdx = Math.max(1, Math.floor(total / 2));
  }

  const subjectSlice = taggedWords.slice(0, verbIdx);
  const predicateSlice = taggedWords.slice(verbIdx);

  // Parse Noun Phrase (NP) for Subject
  const buildNP = (slice) => {
    const children = [];
    slice.forEach(item => {
      children.push({
        tag: item.tag,
        label: item.tag,
        children: [{ tag: 'Word', label: item.word }]
      });
    });
    return {
      tag: 'NP',
      label: 'NP',
      children: children
    };
  };

  const subjectNP = buildNP(subjectSlice);

  // Parse Verb Phrase (VP) for Predicate (Verb + NP object)
  const verbNode = predicateSlice[0];
  const objectSlice = predicateSlice.slice(1);

  const verbChild = {
    tag: 'V',
    label: verbNode ? verbNode.tag : 'V',
    children: [{ tag: 'Word', label: verbNode ? verbNode.word : '' }]
  };

  const vpChildren = [verbChild];
  if (objectSlice.length > 0) {
    vpChildren.push(buildNP(objectSlice));
  }

  const predicateVP = {
    tag: 'VP',
    label: 'VP',
    children: vpChildren
  };

  // Compile final Sentence Root
  return {
    tag: 'S',
    label: 'S (Sentence)',
    children: [subjectNP, predicateVP]
  };
}

// Tree Rendering Engine
let treeZoom = 1;
let treePan = { x: 0, y: 0 };
let isDraggingTree = false;
let startDrag = { x: 0, y: 0 };
let treeRoot = null;

const canvas = document.getElementById('tree-canvas');
let ctx = null;

if (canvas) {
  ctx = canvas.getContext('2d');
}

function resizeTreeCanvas() {
  if (!canvas) return;
  const rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  drawTree();
}

// Draw Branching Grammar Nodes
function drawTree() {
  if (!ctx || !treeRoot) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  
  // Apply Zoom & Pan
  ctx.translate(canvas.width / 2 + treePan.x, 80 + treePan.y);
  ctx.scale(treeZoom, treeZoom);

  // Calculate layout bounds recursively
  const nodeRadius = 24;
  const levelHeight = 85;

  // Measure tree sizes
  function measureNodeWidth(node) {
    if (!node.children || node.children.length === 0) return 60;
    let sum = 0;
    node.children.forEach(child => {
      sum += measureNodeWidth(child);
    });
    return Math.max(sum, 70);
  }

  // Resolve text color for leaf labels from CSS variable (with fallback)
  const textPrimary = cssVar('--text-primary') || '#1a1a2e';

  // Draw node recursively
  function drawNode(node, x, y, widthAllocated) {
    const isLeaf = !node.children || node.children.length === 0;

    // Node connector lines
    if (node.children) {
      let offsetAccum = -widthAllocated / 2;
      node.children.forEach(child => {
        const childWidth = measureNodeWidth(child);
        const childX = x + offsetAccum + childWidth / 2;
        const childY = y + levelHeight;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(childX, childY - 10);
        ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 2;
        ctx.stroke();

        drawNode(child, childX, childY, childWidth);
        offsetAccum += childWidth;
      });
    }

    // Draw Capsule Node or Word Leaf
    if (node.tag === 'Word') {
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.fillStyle = textPrimary;
      ctx.textAlign = 'center';
      ctx.fillText(`"${node.label}"`, x, y + 6);
    } else {
      // Background bubble
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      
      // Dynamic node colors based on Tag
      let nodeColor = '#6b7280';
      if (node.tag === 'S') nodeColor = '#4facfe';
      else if (node.tag === 'NP') nodeColor = '#3b82f6';
      else if (node.tag === 'VP') nodeColor = '#10b981';
      else if (node.tag === 'Det') nodeColor = '#ef4444';
      else if (node.tag === 'Adj') nodeColor = '#f59e0b';
      else if (node.tag === 'N') nodeColor = '#8b5cf6';
      else if (node.tag === 'V') nodeColor = '#ec4899';

      ctx.fillStyle = nodeColor;
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node label
      ctx.font = '700 11px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, x, y + 4);
    }
  }

  const rootWidth = measureNodeWidth(treeRoot);
  drawNode(treeRoot, 0, 0, rootWidth);
  ctx.restore();
}

function initParserEvents() {
  const sentenceInput = document.getElementById('sentence-input');
  const errorOverlay = document.getElementById('tree-overlay-error');
  const resetBtn = document.getElementById('reset-tree-zoom');
  const presetBtns = document.querySelectorAll('.preset-btn');

  if (!sentenceInput) return;

  const handleParse = (text) => {
    try {
      const parsed = parseSentence(text);
      if (parsed) {
        treeRoot = parsed;
        errorOverlay.classList.add('hidden');
        drawTree();
      } else {
        errorOverlay.classList.remove('hidden');
      }
    } catch (e) {
      errorOverlay.classList.remove('hidden');
    }
  };

  // Live input parse handler
  sentenceInput.addEventListener('input', (e) => {
    handleParse(e.target.value);
  });

  // Preset clicks
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sentenceInput.value = btn.textContent;
      handleParse(btn.textContent);
    });
  });

  // Reset zoom view
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      treeZoom = 1;
      treePan = { x: 0, y: 0 };
      drawTree();
    });
  }

  // Mouse pan triggers
  const wrapper = canvas.parentNode;
  wrapper.addEventListener('mousedown', (e) => {
    isDraggingTree = true;
    startDrag = { x: e.clientX - treePan.x, y: e.clientY - treePan.y };
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingTree) return;
    treePan.x = e.clientX - startDrag.x;
    treePan.y = e.clientY - startDrag.y;
    drawTree();
  });

  window.addEventListener('mouseup', () => {
    isDraggingTree = false;
  });

  // Mouse wheel zoom triggers
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.05;
    if (e.deltaY < 0) {
      treeZoom = Math.min(2.5, treeZoom + zoomIntensity);
    } else {
      treeZoom = Math.max(0.4, treeZoom - zoomIntensity);
    }
    drawTree();
  });

  // Initial trigger
  handleParse(sentenceInput.value);
}


// ============================================================================
// 3. IPA PHONETIC SOUNDBOARD SYNTHESIZER
// ============================================================================

// IPA vowels & formants definitions
// Formants (F1, F2) define vowel acoustic qualities
const vowels = [
  { char: "i", name: "Front Close", f1: 280, f2: 2250, type: "vowel" }, // ee
  { char: "u", name: "Back Close", f1: 320, f2: 800, type: "vowel" },   // oo
  { char: "ɑ", name: "Back Open", f1: 750, f2: 1100, type: "vowel" },   // ah
  { char: "æ", name: "Front Open", f1: 650, f2: 1700, type: "vowel" },   // ae
  { char: "ɔ", name: "Back Mid-Open", f1: 570, f2: 840, type: "vowel" }, // aw
  { char: "e", name: "Front Mid-Close", f1: 360, f2: 2000, type: "vowel"} // ey
];

// IPA consonants definitions
const consonants = [
  { char: "s", name: "Alveolar Fricative", method: "noise", filterFreq: 6000, type: "consonant" },
  { char: "f", name: "Labiodental Fricative", method: "noise", filterFreq: 3000, type: "consonant" },
  { char: "p", name: "Bilabial Plosive", method: "pop", pitch: 80, type: "consonant" },
  { char: "k", name: "Velar Plosive", method: "pop", pitch: 180, type: "consonant" },
  { char: "ʃ", name: "Postalveolar Fricative", method: "noise", filterFreq: 4500, type: "consonant" },
  { char: "ð", name: "Dental Fricative", method: "buzz", filterFreq: 220, type: "consonant" },
  { char: "ŋ", name: "Velar Nasal", method: "nasal", filterFreq: 280, type: "consonant" }
];

let audioCtx = null;
let analyserNode = null;
let waveCanvas = document.getElementById('wave-canvas');
let waveCtx = null;
let waveAnimFrameId = null;

if (waveCanvas) {
  waveCtx = waveCanvas.getContext('2d');
}

function resizeWaveCanvas() {
  if (!waveCanvas) return;
  const rect = waveCanvas.parentNode.getBoundingClientRect();
  waveCanvas.width = rect.width;
  waveCanvas.height = rect.height;
  drawOscilloscope();
}

// Oscilloscope Real-Time Drawer
function drawOscilloscope() {
  if (!waveCtx || !analyserNode) return;

  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Resolve canvas colors once from CSS variables (with hardcoded fallbacks)
  const bgColor = cssVar('--bg-secondary') || '#1e1e2e';
  const strokeColor = cssVar('--accent-primary') || '#4facfe';

  const draw = () => {
    waveAnimFrameId = requestAnimationFrame(draw);
    analyserNode.getByteTimeDomainData(dataArray);

    waveCtx.fillStyle = bgColor;
    waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);

    waveCtx.lineWidth = 2;
    waveCtx.strokeStyle = strokeColor;
    waveCtx.beginPath();

    const sliceWidth = waveCanvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * waveCanvas.height) / 2;

      if (i === 0) {
        waveCtx.moveTo(x, y);
      } else {
        waveCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    waveCtx.lineTo(waveCanvas.width, waveCanvas.height / 2);
    waveCtx.stroke();
  };

  if (!waveAnimFrameId) draw();
}

// Initialize Web Audio Engine
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.connect(audioCtx.destination);
    
    // Kickstart scope redraw
    resizeWaveCanvas();
    drawOscilloscope();
  }
  // Resume context if browser suspended it (autoplay protections)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Formant Filter Vowel Synthesizer
// Simulates voice tracts by filtering saw-tooth waves through parallel formant bandpasses
function playVowel(item) {
  const ctx = getAudioContext();
  const time = ctx.currentTime;
  const pitchSlider = document.getElementById('synth-pitch');
  const resonanceSlider = document.getElementById('synth-vowel-gain');
  
  const baseFreq = pitchSlider ? parseInt(pitchSlider.value) : 120;
  const vowelGainFactor = resonanceSlider ? parseInt(resonanceSlider.value) / 100 : 0.8;

  // Pulse Oscillator Source (Larynx vocal cords simulation)
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(baseFreq, time);

  // Vibrato (Gently modulates voice pitch for warmth)
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 5.5; // 5.5Hz modulation
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 1.5;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);

  // Master Vowel Envelope
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, time);
  masterGain.gain.linearRampToValueAtTime(vowelGainFactor * 0.15, time + 0.08); // Attack
  masterGain.gain.setValueAtTime(vowelGainFactor * 0.15, time + 0.35);          // Sustain
  masterGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);             // Release

  // Formants (Bandpass filters F1 & F2)
  // Formant 1
  const filter1 = ctx.createBiquadFilter();
  filter1.type = 'bandpass';
  filter1.frequency.setValueAtTime(item.f1, time);
  filter1.Q.setValueAtTime(8, time);

  // Formant 2
  const filter2 = ctx.createBiquadFilter();
  filter2.type = 'bandpass';
  filter2.frequency.setValueAtTime(item.f2, time);
  filter2.Q.setValueAtTime(10, time);

  // Route connections (parallel filtration)
  osc.connect(filter1);
  osc.connect(filter2);

  filter1.connect(masterGain);
  filter2.connect(masterGain);

  masterGain.connect(analyserNode);

  // Start & Terminate Nodes
  vibrato.start(time);
  osc.start(time);
  
  vibrato.stop(time + 0.5);
  osc.stop(time + 0.5);
}

// Dynamic white noise synthesizer
function generateWhiteNoise(ctx) {
  const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds buffer
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Synthesize friction or explosive bursts
function playConsonant(item) {
  const ctx = getAudioContext();
  const time = ctx.currentTime;

  if (item.method === 'noise') {
    // Fricatives (Sibilance [s], [f], [sh])
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = generateWhiteNoise(ctx);

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.setValueAtTime(item.filterFreq, time);
    bpFilter.Q.setValueAtTime(item.char === 's' ? 4 : 2, time);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.08, time + 0.05);
    env.gain.setValueAtTime(0.08, time + 0.25);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);

    noiseSource.connect(bpFilter);
    bpFilter.connect(env);
    env.connect(analyserNode);

    noiseSource.start(time);
    noiseSource.stop(time + 0.4);
  } 
  else if (item.method === 'pop') {
    // Plosives ([p], [k])
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(item.pitch, time);
    osc.frequency.exponentialRampToValueAtTime(10, time + 0.04);

    const popNoise = ctx.createBufferSource();
    popNoise.buffer = generateWhiteNoise(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(item.pitch * 2.5, time);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.18, time + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    osc.connect(env);
    popNoise.connect(noiseFilter);
    noiseFilter.connect(env);

    env.connect(analyserNode);

    osc.start(time);
    popNoise.start(time);
    osc.stop(time + 0.08);
    popNoise.stop(time + 0.08);
  }
  else if (item.method === 'buzz') {
    // Voiced Fricative ([ð])
    const noise = ctx.createBufferSource();
    noise.buffer = generateWhiteNoise(ctx);
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = item.filterFreq * 10;

    const buzz = ctx.createOscillator();
    buzz.type = 'sawtooth';
    buzz.frequency.value = item.filterFreq;

    const buzzFilter = ctx.createBiquadFilter();
    buzzFilter.type = 'lowpass';
    buzzFilter.frequency.value = item.filterFreq * 1.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.08, time + 0.05);
    env.gain.setValueAtTime(0.08, time + 0.22);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    noise.connect(noiseFilter);
    buzz.connect(buzzFilter);
    
    noiseFilter.connect(env);
    buzzFilter.connect(env);
    
    env.connect(analyserNode);

    noise.start(time);
    buzz.start(time);
    
    noise.stop(time + 0.35);
    buzz.stop(time + 0.35);
  }
  else if (item.method === 'nasal') {
    // Nasals ([ŋ])
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 130;

    const nasalFilter = ctx.createBiquadFilter();
    nasalFilter.type = 'bandpass';
    nasalFilter.frequency.setValueAtTime(item.filterFreq, time);
    nasalFilter.Q.value = 8;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.12, time + 0.08);
    env.gain.setValueAtTime(0.12, time + 0.28);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

    osc.connect(nasalFilter);
    nasalFilter.connect(env);
    env.connect(analyserNode);

    osc.start(time);
    osc.stop(time + 0.4);
  }
}

// Populate the visual HTML Soundboard Grids
function populateSoundboard() {
  const vGrid = document.querySelector('.vowels-grid');
  const cGrid = document.querySelector('.consonants-grid');

  if (!vGrid || !cGrid) return;

  const buildKey = (item) => {
    const key = document.createElement('div');
    key.className = 'ipa-key';
    key.innerHTML = `
      <span class="ipa-char">[${item.char}]</span>
      <span class="ipa-name">${item.name}</span>
    `;

    key.addEventListener('click', () => {
      key.classList.add('playing');
      setTimeout(() => key.classList.remove('playing'), 400);

      if (item.type === 'vowel') {
        playVowel(item);
      } else {
        playConsonant(item);
      }
    });

    return key;
  };

  vowels.forEach(v => vGrid.appendChild(buildKey(v)));
  consonants.forEach(c => cGrid.appendChild(buildKey(c)));
}

// Bind sliders value updates
function initSynthSliders() {
  const pitchSlider = document.getElementById('synth-pitch');
  const pVal = document.getElementById('pitch-val');
  const gainSlider = document.getElementById('synth-vowel-gain');
  const gVal = document.getElementById('gain-val');

  if (pitchSlider && pVal) {
    pitchSlider.addEventListener('input', (e) => {
      pVal.textContent = `${e.target.value}Hz`;
    });
  }

  if (gainSlider && gVal) {
    gainSlider.addEventListener('input', (e) => {
      gVal.textContent = `${e.target.value}%`;
    });
  }
}


// ============================================================================
// 4. MAIN LOAD BOOTSTRAP
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  
  // Initialize Parser
  initParserEvents();
  resizeTreeCanvas();
  
  // Initialize Soundboard
  populateSoundboard();
  initSynthSliders();
  resizeWaveCanvas();

  window.addEventListener('resize', () => {
    const currentTab = document.querySelector('.tab-btn.active').dataset.tab;
    if (currentTab === 'syntax') resizeTreeCanvas();
    if (currentTab === 'ipa') resizeWaveCanvas();
  });
});
