import { getProfile, readStore, writeStore } from './core.js';
import { TEMPLATES } from './templates.js';

const SIDE = 1536;
const DRAFT_KEY = 'drawing-draft-v2';
const COLORS = [
  ['#ed6676', 'Coral'], ['#ef9a40', 'Orange'], ['#f3ca49', 'Yellow'],
  ['#4eae80', 'Green'], ['#4b9fd7', 'Blue'], ['#7662c5', 'Purple'],
  ['#eb8dbc', 'Pink'], ['#25364a', 'Ink'], ['#ffffff', 'White'],
  ['#8c6548', 'Brown'], ['#49b9b4', 'Turquoise'], ['#a5c958', 'Lime'],
  ['#b23f71', 'Berry'], ['#f7b79c', 'Peach'], ['#9aa5b5', 'Gray'],
];
const STAMPS = [
  ['⭐', 'Star'], ['🌈', 'Rainbow'], ['🦄', 'Unicorn'], ['🐶', 'Dog'],
  ['🐱', 'Cat'], ['🦋', 'Butterfly'], ['🌸', 'Flower'], ['🍭', 'Lollipop'],
  ['🍕', 'Pizza'], ['🎉', 'Celebration'], ['🚀', 'Rocket'], ['❤️', 'Heart'],
  ['🌟', 'Shining star'], ['🔥', 'Flame'], ['👾', 'Alien'], ['🦊', 'Fox'],
  ['🍦', 'Ice cream'], ['🎸', 'Guitar'], ['🌊', 'Wave'], ['🦁', 'Lion'],
];
export const DRAWING_IDEAS = {
  2:['Make a big mark. Try another color beside it.','Tap to make dots, then slide to make a line.','Make a long line and a short line together.'],
  3:['Make a big circle and a little circle.','Draw a face with eyes and a mouth.','Make three colorful dots. Count them together.'],
  4:['Build a flower with a circle and lines.','Draw a person. Tell someone what they are doing.','Make a pattern of dots and lines.'],
  5:['Build an animal from circles and triangles.','Draw a garden with five different flowers.','Make a picture with something above and something below.'],
  6:['Invent a friendly creature. Add details that show where it lives.','Draw the same tree in two different seasons.','Make a repeating border around a picture.'],
  7:['Draw a place with something near and something far away.','Show what happens before and after a surprise in two pictures.','Make both butterfly wings follow the same pattern.'],
  8:['Design a planet. Add details that help its creatures live there.','Tell a story in three pictures: beginning, middle, end.','Use warm and cool colors to show two different moods.'],
  9:['Show the same place from above and from the side.','Design an invention and label the parts that make it work.','Make a creature whose outline is symmetrical, then add a surprise.'],
  10:['Plan a three-panel comic. Show emotion through poses and details.','Draw a landscape with foreground, middle ground, and background.','Design a helpful invention. Show a problem and how your idea solves it.'],
};
export function drawingIdeas(age) { return DRAWING_IDEAS[Math.max(2,Math.min(10,Math.round(age)||6))]; }

export const COLORING_IDEAS = {
  2:['Pick a color. Tap a big space. Name the color together.','Try one color, then choose another. Watch what changes.'],
  3:['Give a big space and a little space different colors.','Find two spaces you want to make the same color.'],
  4:['Use three colors. Tell someone what is in your picture.','Add a row of colorful dots with the Pen.'],
  5:['Make a repeating color pattern in your picture.','Color the picture, then draw something beside it.'],
  6:['Choose three colors that belong together in your picture.','Color a scene, then add details that tell us where it is.'],
  7:['Use sunny colors to show a cheerful mood.','Use blue, green, and purple to make a calm color plan.'],
  8:['Choose where the light comes from. Add a few darker details.','Give the main part a bold color and the background a quieter color.'],
  9:['Use a small color palette. Repeat one color to connect the picture.','Add a background that makes your subject stand out.'],
  10:['Choose a main color, a second color, and one accent. Make each one count.','Use color and extra details to turn this picture into a story.'],
};
export function coloringIdeas(age) { return COLORING_IDEAS[Math.max(2,Math.min(10,Math.round(age)||6))]; }

/** Flood a connected region, comparing its visible color against white paper.
 * The fixed-size queue prevents repeated neighbor allocations on large fills.
 */
export function floodFillPixels(image, x, y, fill, tolerance = 30) {
  const { data, width, height } = image;
  x = Math.floor(x); y = Math.floor(y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= width || y >= height) return false;
  const start = y * width + x;
  const visible = (i, channel) => Math.round(data[i + channel] * data[i + 3] / 255 + 255 - data[i + 3]);
  const at = start * 4;
  const target = [visible(at, 0), visible(at, 1), visible(at, 2)];
  if (target.every((v, i) => v === fill[i])) return false;
  const matches = pixel => {
    const i = pixel * 4;
    return Math.abs(visible(i, 0) - target[0]) <= tolerance &&
      Math.abs(visible(i, 1) - target[1]) <= tolerance &&
      Math.abs(visible(i, 2) - target[2]) <= tolerance;
  };
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let tail = 1;
  queue[0] = start; visited[start] = 1;
  const add = pixel => {
    if (!visited[pixel] && matches(pixel)) {
      visited[pixel] = 1;
      queue[tail++] = pixel;
    }
  };
  for (let head = 0; head < tail; head++) {
    const pixel = queue[head], i = pixel * 4, col = pixel % width;
    data[i] = fill[0]; data[i + 1] = fill[1]; data[i + 2] = fill[2]; data[i + 3] = 255;
    if (col > 0) add(pixel - 1);
    if (col < width - 1) add(pixel + 1);
    if (pixel >= width) add(pixel - width);
    if (pixel < width * (height - 1)) add(pixel + width);
  }
  return true;
}

/** Exact synchronous pixel patches, bounded by both bytes and action count. */
export function createPixelHistory({ maxBytes = 32 * 1024 * 1024, maxActions = 30 } = {}) {
  let past = [], future = [];
  const bytes = () => [...past, ...future].reduce((sum, patch) => sum + patch.before.byteLength + patch.after.byteLength, 0);
  return {
    push(before, after, metadata = {}) {
      const { width, height } = before;
      let left = width, top = height, right = -1, bottom = -1;
      for (let pixel = 0; pixel < width * height; pixel++) {
        const i = pixel * 4;
        if (before.data[i] !== after.data[i] || before.data[i + 1] !== after.data[i + 1] ||
            before.data[i + 2] !== after.data[i + 2] || before.data[i + 3] !== after.data[i + 3]) {
          const x = pixel % width, y = Math.floor(pixel / width);
          left = Math.min(left, x); top = Math.min(top, y);
          right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
      }
      if (right < 0) return false;
      const w = right - left + 1, h = bottom - top + 1;
      const a = new Uint8ClampedArray(w * h * 4), b = new Uint8ClampedArray(w * h * 4);
      for (let row = 0; row < h; row++) {
        const from = ((top + row) * width + left) * 4;
        a.set(before.data.subarray(from, from + w * 4), row * w * 4);
        b.set(after.data.subarray(from, from + w * 4), row * w * 4);
      }
      future = [];
      past.push({ x: left, y: top, width: w, height: h, before: a, after: b, ...metadata });
      while (past.length > 1 && (past.length > maxActions || bytes() > maxBytes)) past.shift();
      return true;
    },
    undo() { const patch = past.pop(); if (patch) future.push(patch); return patch; },
    redo() { const patch = future.pop(); if (patch) past.push(patch); return patch; },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    get byteLength() { return bytes(); },
  };
}

export function createDrawing(container, { getSettings, onBack, onNotice = () => {} }) {
  container.classList.add('drawing-screen');
  container.innerHTML = `
    <header class="activity-header draw-header">
      <button class="icon-button draw-back" aria-label="Back to activities">←</button>
      <div class="draw-heading"><p class="draw-eyebrow">MAKE SOMETHING YOU</p><h1 class="draw-title">Doodle studio</h1></div>
      <button class="button button-primary draw-save"><span aria-hidden="true">↗</span> Save</button>
    </header>
    <div class="draw-prompt"><span class="draw-prompt-icon" aria-hidden="true">✦</span><div><span class="draw-prompt-label">A little inspiration</span><p class="draw-challenge"></p></div><button class="icon-button draw-shuffle" aria-label="Try another drawing idea">↻</button></div>
    <div class="draw-workspace">
      <div class="draw-paper-region">
        <div class="draw-paper"><canvas class="draw-canvas" aria-label="Drawing paper. Draw using your finger, Apple Pencil, or mouse."></canvas></div>
        <p class="draw-paper-note"><span class="draw-paper-name">Your imagination goes here</span><span class="draw-draft-status" role="status">Finger or Pencil · make your mark</span></p>
      </div>
      <aside class="draw-controls" aria-label="Art supplies">
        <div class="draw-tools" role="group" aria-label="Drawing tools">
          <button class="draw-tool" data-tool="pen" aria-pressed="true"><span aria-hidden="true">✎</span>Pen</button>
          <button class="draw-tool" data-tool="eraser" aria-pressed="false"><span aria-hidden="true">▱</span>Eraser</button>
          <button class="draw-tool" data-tool="fill" aria-pressed="false"><span aria-hidden="true">◕</span>Fill</button>
          <button class="draw-tool" data-tool="stamp" aria-pressed="false"><span aria-hidden="true">☆</span>Stamps</button>
        </div>
        <div class="draw-supply-row"><span class="draw-control-label">Color</span><div class="draw-colors" role="group" aria-label="Paint colors"></div></div>
        <div class="draw-supply-row draw-size-row"><span class="draw-control-label">Size</span><div class="draw-sizes" role="group" aria-label="Brush sizes"></div></div>
        <div class="draw-actions" role="group" aria-label="Paper actions">
          <button class="button draw-undo" aria-label="Undo last action"><span aria-hidden="true">↶</span><span>Undo</span></button>
          <button class="button draw-redo" aria-label="Redo last action"><span aria-hidden="true">↷</span><span>Redo</span></button>
          <button class="button draw-templates" aria-label="Choose a coloring page" title="Choose a coloring page"><span aria-hidden="true">▧</span><span>Pages</span></button>
          <button class="button draw-new" aria-label="Start a new drawing" title="Start a new drawing"><span aria-hidden="true">＋</span><span>New</span></button>
        </div>
      </aside>
    </div>
    <dialog class="draw-dialog draw-template-dialog" aria-labelledby="draw-pages-title"><div class="draw-dialog-heading"><div><p class="draw-eyebrow">A PICTURE TO MAKE YOUR OWN</p><h2 id="draw-pages-title">Pick a coloring page</h2></div><button class="icon-button" data-close aria-label="Close coloring pages">×</button></div><p class="draw-dialog-description">Choose any picture. The simplest pages come first for little artists.</p><div class="draw-template-grid"></div></dialog>
    <dialog class="draw-dialog draw-stamp-dialog" aria-labelledby="draw-stamps-title"><div class="draw-dialog-heading"><div><p class="draw-eyebrow">LITTLE EXTRAS, BIG IDEAS</p><h2 id="draw-stamps-title">Pick a stamp</h2></div><button class="icon-button" data-close aria-label="Close stamps">×</button></div><p class="draw-dialog-description">Then tap your paper to place it.</p><div class="draw-stamp-grid"></div></dialog>
    <dialog class="draw-dialog draw-confirm-dialog" aria-labelledby="draw-confirm-title"><h2 id="draw-confirm-title">Start a fresh picture?</h2><p>Your current picture will be replaced. Save it first if you want to keep it. You can also use Undo to bring it back.</p><div class="draw-confirm-actions"><button class="button" data-keep>Keep drawing</button><button class="button button-primary" data-replace>Start fresh</button></div></dialog>
    <dialog class="draw-dialog draw-export-dialog" aria-labelledby="draw-export-title"><div class="draw-dialog-heading"><h2 id="draw-export-title">Your masterpiece</h2><button class="icon-button" data-close aria-label="Close saved picture">×</button></div><p>Touch and hold the picture to save it, or use the download button.</p><img class="draw-export-image" alt="Your finished drawing"><a class="button button-primary draw-download" download="my-doodle.png">Download PNG</a></dialog>`;
  const $ = selector => container.querySelector(selector);
  const canvas = $('.draw-canvas');
  const display = canvas.getContext('2d');
  const art = document.createElement('canvas'); art.width = art.height = SIDE;
  const ctx = art.getContext('2d', { willReadFrequently: true });
  const history = createPixelHistory();
  let coloringMode = false, profile, tool = 'pen', color = COLORS[0][0], brush = 20, stamp = STAMPS[0][0];
  let pointer = null, beforeStroke = null, lastPoint = null, artName = '', hasWork = false;
  let revision = 0, saveTimer, pendingReplacement, challengeIndex = 0, active = false;
  let restoring = false, ready = false, exportURL;

  function tell(message) { $('.draw-draft-status').textContent = message; onNotice(message); }
  function render() {
    display.clearRect(0, 0, canvas.width, canvas.height);
    display.fillStyle = '#fff'; display.fillRect(0, 0, canvas.width, canvas.height);
    display.drawImage(art, 0, 0, canvas.width, canvas.height);
    $('.draw-paper-name').textContent = artName || 'Your imagination goes here';
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const size = Math.min(2400, Math.round(rect.width * Math.min(window.devicePixelRatio || 1, 3)));
    if (canvas.width !== size || canvas.height !== size) canvas.width = canvas.height = size;
    render();
  }
  function updateHistory() {
    $('.draw-undo').disabled = !history.canUndo || restoring;
    $('.draw-redo').disabled = !history.canRedo || restoring;
    container.querySelectorAll('.draw-save, .draw-new, .draw-template-card').forEach(button => { button.disabled = restoring; });
  }
  function persist() {
    clearTimeout(saveTimer);
    if (!ready || restoring || pointer !== null) return;
    try {
      const png = art.toDataURL('image/png');
      // Leave room for settings and learning progress in small storage quotas.
      if (png.length > 2500000) { $('.draw-draft-status').textContent = 'Save a PNG to keep this detailed picture'; return; }
      const stored = writeStore(DRAFT_KEY, { png, name: artName, hasWork, version: 2 });
      $('.draw-draft-status').textContent = stored === false ? 'Save a PNG to keep your picture' : 'Draft saved on this device';
    } catch { $('.draw-draft-status').textContent = 'Save a PNG to keep your picture'; }
  }
  function changed() {
    revision++; render(); updateHistory();
    clearTimeout(saveTimer); saveTimer = setTimeout(persist, 650);
  }
  function transaction(action, { name = artName, work = true } = {}) {
    if (restoring) return;
    finishPointer();
    const before = ctx.getImageData(0, 0, SIDE, SIDE), oldName = artName, oldWork = hasWork;
    action();
    if (history.push(before, ctx.getImageData(0, 0, SIDE, SIDE), { oldName, newName: name, oldWork, newWork: work })) {
      artName = name; hasWork = work; changed();
    }
  }
  function applyPatch(patch, undo) {
    if (!patch) return;
    ctx.putImageData(new ImageData(undo ? patch.before : patch.after, patch.width, patch.height), patch.x, patch.y);
    artName = undo ? patch.oldName : patch.newName;
    hasWork = undo ? patch.oldWork : patch.newWork;
    changed();
  }
  function setTool(next) {
    finishPointer(); tool = next;
    container.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tool === tool)));
    canvas.dataset.tool = tool;
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * SIDE / rect.width, y: (event.clientY - rect.top) * SIDE / rect.height,
      pressure: event.pointerType === 'pen' && event.pressure > 0 ? .35 + Math.min(1, event.pressure) * 1.2 : 1 };
  }
  function mark(from, to) {
    ctx.save();
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineCap = ctx.lineJoin = 'round';
    const width = brush * SIDE / 600 * to.pressure * (tool === 'eraser' ? 2 : 1);
    ctx.lineWidth = width;
    if (from) { ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(to.x, to.y, width / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function finishPointer(event) {
    if (pointer === null || (event && event.pointerId !== pointer)) return;
    const id = pointer; pointer = null;
    if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
    if (beforeStroke) {
      if (history.push(beforeStroke, ctx.getImageData(0, 0, SIDE, SIDE), { oldName: artName, newName: artName, oldWork: hasWork, newWork: true })) {
        hasWork = true; changed();
      }
      beforeStroke = null;
    } else {
      // A fill or stamp may be held longer than the draft debounce.
      clearTimeout(saveTimer); saveTimer = setTimeout(persist, 650);
    }
    lastPoint = null;
  }
  canvas.addEventListener('pointerdown', event => {
    if (restoring || pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    const p = point(event);
    if (tool === 'fill') {
      transaction(() => {
        const pixels = ctx.getImageData(0, 0, SIDE, SIDE);
        const rgba = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
        if (floodFillPixels(pixels, p.x, p.y, rgba)) ctx.putImageData(pixels, 0, 0);
      });
      pointer = event.pointerId; canvas.setPointerCapture(event.pointerId);
    } else if (tool === 'stamp') {
      transaction(() => { ctx.save(); ctx.font = `${(brush * 2 + 30) * SIDE / 600}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(stamp, p.x, p.y); ctx.restore(); });
      pointer = event.pointerId; canvas.setPointerCapture(event.pointerId);
    } else {
      pointer = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      beforeStroke = ctx.getImageData(0, 0, SIDE, SIDE);
      lastPoint = p; mark(null, p); render();
    }
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer || !beforeStroke) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.() || [];
    for (const sample of events.length ? events : [event]) {
      const next = point(sample); mark(lastPoint, next); lastPoint = next;
    }
    render();
  });
  // A canceled gesture keeps its visible marks as one undoable action.
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, finishPointer));
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  canvas.addEventListener('touchstart', event => event.preventDefault(), { passive: false });

  function showDialog(dialog) {
    finishPointer();
    if (dialog.open) return;
    dialog.showModal();
  }
  container.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  });
  function replacePicture(action) {
    if (restoring) return;
    if (!hasWork) { action(); return; }
    pendingReplacement = action;
    showDialog($('.draw-confirm-dialog'));
  }
  $('.draw-confirm-dialog [data-keep]').addEventListener('click', () => { pendingReplacement = null; $('.draw-confirm-dialog').close(); });
  $('.draw-confirm-dialog [data-replace]').addEventListener('click', () => {
    const action = pendingReplacement; pendingReplacement = null;
    $('.draw-confirm-dialog').close(); action?.();
  });
  function selectTemplate(template) {
    $('.draw-template-dialog').close();
    replacePicture(() => {
      transaction(() => { ctx.clearRect(0, 0, SIDE, SIDE); template.fn(ctx, SIDE, SIDE); }, { name: template.name, work: true });
      setTool('fill'); tell('Pick a color, then tap inside the picture.');
    });
  }
  function buildTemplates() {
    const grid = $('.draw-template-grid'); grid.replaceChildren();
    const order = profile.tier === 'little' ? [0, 7, 6, 1, 2, 3, 4, 5, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    order.forEach(index => {
      const template = TEMPLATES[index], button = document.createElement('button');
      button.className = 'draw-template-card'; button.setAttribute('aria-label', `Color ${template.name}`);
      const preview = document.createElement('canvas'); preview.width = preview.height = 180; preview.setAttribute('aria-hidden', 'true');
      const previewCtx = preview.getContext('2d'); previewCtx.fillStyle = '#fff'; previewCtx.fillRect(0, 0, 180, 180); template.fn(previewCtx, 180, 180);
      const label = document.createElement('span'); label.textContent = template.name;
      button.append(preview, label); button.addEventListener('click', () => selectTemplate(template)); grid.append(button);
    });
  }
  STAMPS.forEach(([emoji, name]) => {
    const button = document.createElement('button'); button.className = 'draw-stamp-choice';
    button.textContent = emoji; button.setAttribute('aria-label', `${name} stamp`);
    button.addEventListener('click', () => { stamp = emoji; setTool('stamp'); $('.draw-stamp-dialog').close(); tell(`${name} stamp ready. Tap the paper!`); });
    $('.draw-stamp-grid').append(button);
  });
  function updateChallenge() {
    const ideas = (coloringMode ? coloringIdeas : drawingIdeas)(profile.challengeAge || profile.age);
    $('.draw-challenge').textContent = ideas[challengeIndex % ideas.length];
  }
  function settingsChanged() {
    finishPointer(); profile = getProfile(getSettings());
    const colors = COLORS.slice(0, profile.colorCount || 12);
    if (!colors.some(([hex]) => hex === color)) color = colors[0][0];
    const row = $('.draw-colors'); row.replaceChildren();
    colors.forEach(([hex, name]) => {
      const button = document.createElement('button'); button.className = 'draw-color';
      button.style.setProperty('--paint', hex); button.setAttribute('aria-label', name);
      button.setAttribute('aria-pressed', String(color === hex));
      button.addEventListener('click', () => {
        color = hex; if (tool === 'eraser') setTool('pen');
        row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      }); row.append(button);
    });
    const sizes = profile.sizes || [8, 18, 32];
    brush = sizes.includes(profile.brush) ? profile.brush : sizes[Math.floor(sizes.length / 2)];
    const sizesRow = $('.draw-sizes'); sizesRow.replaceChildren();
    sizes.forEach((size, index) => {
      const button = document.createElement('button'); button.className = 'draw-size';
      button.setAttribute('aria-label', `${['Small', 'Medium', 'Large'][index] || `Size ${index + 1}`} brush, ${size}`);
      button.setAttribute('aria-pressed', String(size === brush));
      const dot = document.createElement('span'); dot.style.width = dot.style.height = `${Math.min(27, Math.max(5, size * .65))}px`; button.append(dot);
      button.addEventListener('click', () => { brush = size; sizesRow.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); }); sizesRow.append(button);
    });
    updateChallenge(); buildTemplates(); updateHistory();
  }
  $('.draw-shuffle').addEventListener('click', () => { challengeIndex++; updateChallenge(); });
  $('.draw-back').addEventListener('click', () => { finishPointer(); persist(); onBack(); });
  $('.draw-undo').addEventListener('click', () => { finishPointer(); applyPatch(history.undo(), true); });
  $('.draw-redo').addEventListener('click', () => { finishPointer(); applyPatch(history.redo(), false); });
  $('.draw-new').addEventListener('click', () => replacePicture(() => transaction(() => ctx.clearRect(0, 0, SIDE, SIDE), { name: '', work: false })));
  $('.draw-templates').addEventListener('click', () => showDialog($('.draw-template-dialog')));
  container.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
    setTool(button.dataset.tool);
    if (tool === 'stamp') showDialog($('.draw-stamp-dialog'));
  }));
  function showExport(blob) {
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = URL.createObjectURL(blob);
    $('.draw-export-image').src = exportURL; $('.draw-download').href = exportURL;
    showDialog($('.draw-export-dialog'));
  }
  $('.draw-save').addEventListener('click', async () => {
    finishPointer();
    const button = $('.draw-save'); button.disabled = true;
    try {
      const output = document.createElement('canvas'); output.width = output.height = SIDE;
      const out = output.getContext('2d'); out.fillStyle = '#fff'; out.fillRect(0, 0, SIDE, SIDE); out.drawImage(art, 0, 0);
      const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create picture');
      const native = globalThis.webkit?.messageHandlers?.doodleNative;
      if (native) {
        native.postMessage({type:'shareImage',dataURL:output.toDataURL('image/png'),name:'my-doodle.png'});
        return;
      }
      const file = new File([blob], 'my-doodle.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'My doodle' }); tell('Your picture is ready to keep!'); }
        catch (error) { if (error.name !== 'AbortError') showExport(blob); }
      } else showExport(blob);
    } catch { tell('Your drawing is safe here. Please try Save again.'); }
    finally { button.disabled = false; }
  });
  window.addEventListener('doodle-native-share', event => {
    if(event.detail?.status==='failed') tell('Your drawing is safe here. Please try Save again.');
    else if(event.detail?.status==='completed') tell('Your picture is ready to keep!');
  });
  document.addEventListener('keydown', event => {
    if (!active || container.querySelector('dialog[open]') || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
    event.preventDefault(); finishPointer(); applyPatch(event.shiftKey ? history.redo() : history.undo(), !event.shiftKey);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { finishPointer(); persist(); } });
  window.addEventListener('pagehide', () => { finishPointer(); persist(); });
  window.addEventListener('blur', () => finishPointer());
  const observer = new ResizeObserver(resize); observer.observe($('.draw-paper'));
  const draft = readStore(DRAFT_KEY, null);
  if (draft?.version === 2 && typeof draft.png === 'string' && draft.png.startsWith('data:image/png;base64,') && draft.png.length < 2500000) {
    restoring = true;
    const image = new Image();
    image.onload = () => {
      if (image.width === SIDE && image.height === SIDE && revision === 0) {
        ctx.drawImage(image, 0, 0); artName = typeof draft.name === 'string' ? draft.name.slice(0, 80) : ''; hasWork = Boolean(draft.hasWork);
        $('.draw-draft-status').textContent = 'Your last picture is ready';
      }
      restoring = false; ready = true; updateHistory(); render();
    };
    image.onerror = () => { restoring = false; ready = true; updateHistory(); };
    image.src = draft.png;
  } else ready = true;
  settingsChanged(); updateHistory();
  return {
    open({ coloring = false } = {}) {
      active = true; coloringMode = coloring; settingsChanged();
      $('.draw-title').textContent = coloring ? 'Color & create' : 'Doodle studio';
      requestAnimationFrame(resize);
      if (coloring) showDialog($('.draw-template-dialog'));
    },
    close() { active = false; finishPointer(); persist(); container.querySelectorAll('dialog[open]').forEach(dialog => dialog.close()); },
    hint() { tell(coloringMode ? "Pick Fill, then tap inside a space. Use Pen for details and Undo to try another color." : "Pick Pen and a color. Make a line or a shape. Undo lets you try another way."); },
    settingsChanged,
  };
}
