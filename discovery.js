import { getProfile, readStore, writeStore } from './core.js';

export const DISCOVERY_IDS = ['shape-match', 'color-match', 'patterns', 'sorting', 'odd-one-out', 'memory', 'maze'];
const META = {
  'shape-match': ['Shape detective', 'Look closely. Find the shape.', '◇'],
  'color-match': ['Color buddies', 'Look for a matching color.', '●'],
  patterns: ['Pattern parade', 'What comes next?', '✦'],
  sorting: ['Sort it out', 'Find a home for every picture.', '▧'],
  'odd-one-out': ['Spot the difference', 'One picture has something different.', '◉'],
  memory: ['Memory garden', 'Turn two cards. Find a matching pair.', '❀'],
  maze: ['Little pathfinder', 'Help Bunny find the carrot.', '↝'],
};
const SHAPES = [
  { id: 'circle', name: 'Circle', clue: 'It is round, with no corners.', svg: '<circle cx="50" cy="50" r="35"/>' },
  { id: 'square', name: 'Square', clue: 'It has four equal sides and four square corners.', svg: '<rect x="18" y="18" width="64" height="64" rx="2"/>' },
  { id: 'triangle', name: 'Triangle', clue: 'It has three sides and three corners.', svg: '<path d="M50 12 90 85H10Z"/>' },
  { id: 'rectangle', name: 'Rectangle', clue: 'It has four square corners. This one is longer than it is tall.', svg: '<rect x="9" y="28" width="82" height="44" rx="2"/>' },
  { id: 'oval', name: 'Oval', clue: 'It is a stretched circle, with no corners.', svg: '<ellipse cx="50" cy="50" rx="42" ry="27"/>' },
  { id: 'star', name: 'Star', clue: 'It has five points.', svg: '<path d="m50 7 13 28 31 4-23 22 6 32-27-15-27 15 6-32L6 39l31-4Z"/>' },
  { id: 'pentagon', name: 'Pentagon', clue: 'It has five straight sides.', svg: '<path d="m50 9 41 30-16 48H25L9 39Z"/>' },
  { id: 'hexagon', name: 'Hexagon', clue: 'It has six straight sides.', svg: '<path d="M28 12h44l22 38-22 38H28L6 50Z"/>' },
];
const COLORS = [
  { id: 'red', name: 'Red', color: '#db5058' }, { id: 'blue', name: 'Blue', color: '#398ace' },
  { id: 'yellow', name: 'Yellow', color: '#edc93e' }, { id: 'green', name: 'Green', color: '#389365' },
  { id: 'orange', name: 'Orange', color: '#eb9037' }, { id: 'purple', name: 'Purple', color: '#825abe' },
  { id: 'pink', name: 'Pink', color: '#e591be' }, { id: 'brown', name: 'Brown', color: '#926445' },
  { id: 'navy', name: 'Navy blue', color: '#253b74' }, { id: 'turquoise', name: 'Turquoise', color: '#2ca5a2' },
];
const TOKENS = [
  { id: 'sun', name: 'Sun', emoji: '☀️' }, { id: 'moon', name: 'Moon', emoji: '🌙' },
  { id: 'star', name: 'Star', emoji: '⭐' }, { id: 'flower', name: 'Flower', emoji: '🌸' },
  { id: 'leaf', name: 'Leaf', emoji: '🍃' }, { id: 'rainbow', name: 'Rainbow', emoji: '🌈' },
];
const MEMORY = [
  { id: 'cat', name: 'Cat', emoji: '🐱' }, { id: 'frog', name: 'Frog', emoji: '🐸' },
  { id: 'fox', name: 'Fox', emoji: '🦊' }, { id: 'butterfly', name: 'Butterfly', emoji: '🦋' },
  { id: 'bee', name: 'Bee', emoji: '🐝' }, { id: 'ladybug', name: 'Ladybug', emoji: '🐞' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰' }, { id: 'owl', name: 'Owl', emoji: '🦉' },
];
export function discoveryConfig(tier) {
  return ({ little: { choices: 3, memoryPairs: 2, mazeSize: 4, sortCategories: 2 }, explorer: { choices: 4, memoryPairs: 4, mazeSize: 5, sortCategories: 3 }, maker: { choices: 6, memoryPairs: 6, mazeSize: 6, sortCategories: 3 } })[tier] || discoveryConfig('explorer');
}
function shuffle(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1)))); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function choicesFor(target, pool, count, random) { return shuffle([target, ...shuffle(pool.filter(item => item.id !== target.id), random).slice(0, count - 1)], random); }
export function makeMaze(size, random = Math.random) {
  const cells = Array.from({ length: size * size }, () => []), visited = new Set([0]), stack = [0];
  while (stack.length) {
    const current = stack[stack.length - 1], x = current % size, y = Math.floor(current / size);
    const candidates = [x > 0 ? current - 1 : -1, x < size - 1 ? current + 1 : -1, y > 0 ? current - size : -1, y < size - 1 ? current + size : -1].filter(next => next >= 0 && !visited.has(next));
    if (!candidates.length) { stack.pop(); continue; }
    const next = shuffle(candidates, random)[0];
    cells[current].push(next); cells[next].push(current); visited.add(next); stack.push(next);
  }
  // Put the carrot at the farthest reachable cell, never next to the start.
  const distances = Array(size * size).fill(-1), queue = [0]; distances[0] = 0;
  for (let i = 0; i < queue.length; i++) for (const next of cells[queue[i]]) if (distances[next] < 0) { distances[next] = distances[queue[i]] + 1; queue.push(next); }
  return { size, cells, start: 0, goal: distances.indexOf(Math.max(...distances)) };
}
export function mazeStep(maze, path, next) {
  return Number.isInteger(next) && maze.cells[path[path.length - 1]]?.includes(next) ? [...path, next] : path;
}
export function buildDiscoveryRound(id, tier = 'explorer', index = 0, random = Math.random) {
  const config = discoveryConfig(tier);
  if (id === 'shape-match' || id === 'color-match') {
    const pool = id === 'shape-match' ? SHAPES.slice(0, tier === 'little' ? 3 : tier === 'explorer' ? 6 : 8) : COLORS.slice(0, tier === 'little' ? 6 : tier === 'explorer' ? 8 : 10);
    const target = pool[((index % pool.length) + pool.length) % pool.length];
    return { id, tier, target, choices: choicesFor(target, pool, config.choices, random), answer: target.id };
  }
  if (id === 'patterns') {
    const forms = tier === 'little' ? [[0, 1]] : tier === 'explorer' ? [[0, 1], [0, 0, 1], [0, 1, 2]] : [[0, 0, 1], [0, 1, 2], [0, 0, 1, 1], [0, 1, 1, 2]];
    const form = forms[index % forms.length], symbols = shuffle(TOKENS, random), repeat = form.map(i => symbols[i]);
    const length = tier === 'little' ? 4 + index % 2 : repeat.length * 2;
    const sequence = Array.from({ length }, (_, i) => repeat[i % repeat.length]), target = repeat[length % repeat.length];
    return { id, tier, repeat, sequence, target, choices: choicesFor(target, TOKENS, tier === 'little' ? 3 : 4, random), answer: target.id };
  }
  if (id === 'sorting') {
    const categories = tier === 'maker' ? [
      { id: 'land', name: 'On land', emoji: '🛣️', items: [['car', 'Car', '🚗'], ['bus', 'Bus', '🚌'], ['bike', 'Bicycle', '🚲']] },
      { id: 'air', name: 'In the air', emoji: '☁️', items: [['plane', 'Airplane', '✈️'], ['helicopter', 'Helicopter', '🚁'], ['small-plane', 'Small plane', '🛩️']] },
      { id: 'water', name: 'On water', emoji: '🌊', items: [['sailboat', 'Sailboat', '⛵'], ['canoe', 'Canoe', '🛶'], ['ship', 'Ship', '🚢']] },
    ] : [
      { id: 'animals', name: 'Animals', emoji: '🐾', items: [['cat', 'Cat', '🐱'], ['dog', 'Dog', '🐶'], ['fish', 'Fish', '🐟']] },
      { id: 'fruit', name: 'Fruit', emoji: '🍎', items: [['apple', 'Apple', '🍎'], ['banana', 'Banana', '🍌'], ['pear', 'Pear', '🍐']] },
      { id: 'vehicles', name: 'Vehicles', emoji: '🛞', items: [['car', 'Car', '🚗'], ['bus', 'Bus', '🚌'], ['bike', 'Bicycle', '🚲']] },
    ].slice(0, config.sortCategories);
    return { id, tier, categories: categories.map(({ items, ...category }) => category), items: shuffle(categories.flatMap(category => category.items.map(([itemId, name, emoji]) => ({ id: itemId, name, emoji, category: category.id }))), random) };
  }
  if (id === 'odd-one-out') {
    const property = tier === 'little' ? 'color' : tier === 'explorer' ? ['color', 'shape'][index % 2] : ['shape', 'number'][index % 2];
    const count = tier === 'little' ? 3 : tier === 'explorer' ? 4 : 6;
    const same = property === 'color' ? COLORS[index % 4] : property === 'shape' ? SHAPES[index % 5] : { id: 'four', name: '4 dots', dots: 4 };
    const different = property === 'color' ? COLORS[(index + 1) % 4] : property === 'shape' ? SHAPES[(index + 1) % 5] : { id: 'five', name: '5 dots', dots: 5 };
    const items = shuffle(Array.from({ length: count }, (_, i) => ({ id: String(i), value: i === 0 ? different : same })), random);
    return { id, tier, property, same, different, choices: items, answer: '0' };
  }
  if (id === 'memory') {
    const pairs = shuffle(MEMORY, random).slice(0, config.memoryPairs);
    return { id, tier, pairs: config.memoryPairs, cards: shuffle(pairs.flatMap(item => [{ ...item, key: `${item.id}-a` }, { ...item, key: `${item.id}-b` }]), random) };
  }
  if (id === 'maze') return { id, tier, ...makeMaze(config.mazeSize, random) };
  throw new Error(`Unknown discovery activity: ${id}`);
}

const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
function button(label, className, action) { const node = element('button', className, label); node.type = 'button'; node.addEventListener('click', action); return node; }
function shapePicture(shape) {
  const wrap = element('span', 'discover-shape');
  wrap.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${shape.svg}</svg>`;
  return wrap;
}
function tokenPicture(item) {
  if (item.svg) return shapePicture(item);
  if (item.color) { const swatch = element('span', 'discover-swatch'); swatch.style.background = item.color; swatch.setAttribute('aria-hidden', 'true'); return swatch; }
  if (item.dots) { const dots = element('span', 'discover-dot-group'); dots.setAttribute('aria-hidden', 'true'); for (let i = 0; i < item.dots; i++) dots.append(element('i')); return dots; }
  const emoji = element('span', 'discover-emoji', item.emoji); emoji.setAttribute('aria-hidden', 'true'); return emoji;
}
function getProgress() {
  const stored = readStore('discovery-progress-v1', {});
  return Object.fromEntries(DISCOVERY_IDS.map(id => [id, typeof stored?.[id] === 'number' && Number.isFinite(stored[id]) ? Math.max(0, Math.min(100000, Math.floor(stored[id]))) : 0]));
}
export function createDiscovery(container, { getSettings, onBack = () => {}, onNotice = () => {}, onProgress = () => {} }) {
  const sessions = new Map();
  let currentId = 'shape-match', profile = getProfile(getSettings()), current, active = false, progress = getProgress();
  let title, objective, play, status, nextButton, restartButton, hearButton, counter;
  container.classList.add('discover-screen');
  container.innerHTML = `<header class="activity-header discover-header"><button class="icon-button discover-back" aria-label="Back to activities">←</button><div class="discover-heading"><p class="discover-eyebrow">LITTLE DISCOVERIES</p><h1 class="discover-title"></h1></div><button class="button discover-hear" aria-label="Hear the instructions">♪ <span>Hear it</span></button></header><div class="discover-main"><div class="discover-intro"><span class="discover-activity-icon" aria-hidden="true"></span><div><p class="discover-level"></p><h2 class="discover-objective"></h2></div></div><div class="discover-play"></div><div class="discover-feedback"><p class="discover-status" role="status" aria-live="polite"></p><p class="discover-round-count"></p></div><div class="discover-footer"><button class="button discover-restart">↶ Start again</button><button class="button button-primary discover-next">New round <span aria-hidden="true">→</span></button></div></div>`;
  const $ = selector => container.querySelector(selector);
  title = $('.discover-title'); objective = $('.discover-objective'); play = $('.discover-play'); status = $('.discover-status');
  nextButton = $('.discover-next'); restartButton = $('.discover-restart'); hearButton = $('.discover-hear'); counter = $('.discover-round-count');
  function speak(text) { if (!active || !getSettings().sound || !('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .82; window.speechSynthesis.speak(utterance); }
  function report() { onProgress({ source: 'discovery', completedCount: Object.values(progress).reduce((sum, count) => sum + count, 0) }); }
  function fresh(index = 0) { return { index, round: buildDiscoveryRound(currentId, profile.tier, index), done: false, recorded: false, selected: null, sorted: new Set(), flipped: [], matched: new Set(), path: [0], message: '', feedback: '' }; }
  function getSession() { const key = `${currentId}:${profile.tier}`; if (!sessions.has(key)) sessions.set(key, fresh()); current = sessions.get(key); }
  function message(text, kind = '') { current.message = text; current.feedback = kind; status.textContent = text; status.className = `discover-status ${kind ? `is-${kind}` : ''}`; }
  function complete(text) {
    current.done = true;
    if (!current.recorded) { current.recorded = true; progress[currentId] = Math.min(100000, progress[currentId] + 1); writeStore('discovery-progress-v1', progress); report(); }
    message(`✓ ${text}`, 'success'); nextButton.classList.add('is-ready'); speak(text); updateCounter();
  }
  function updateCounter() { counter.textContent = `${progress[currentId]} ${progress[currentId] === 1 ? 'discovery' : 'discoveries'} made`; }
  function choiceButton(item, label, action) { const node = button('', 'discover-choice', action); node.dataset.choice = item.id; node.setAttribute('aria-label', label); node.append(tokenPicture(item), element('span', 'discover-choice-label', item.name)); return node; }
  function selectChoice(value, node) {
    if (current.done) return;
    if (value !== current.round.answer) {
      node.classList.add('is-try'); node.setAttribute('aria-label', `${node.dataset.label || node.getAttribute('aria-label')}. Try another picture`);
      message(currentId === 'patterns' ? 'Have another look at the part that repeats.' : currentId === 'odd-one-out' ? `Look for a different ${current.round.property}. You can try again.` : 'Take another look. You can try again.', 'retry');
      return;
    }
    node.classList.remove('is-try'); node.classList.add('is-correct');
    const text = currentId === 'shape-match' ? `${current.round.target.name}! ${current.round.target.clue}` : currentId === 'color-match' ? `${current.round.target.name} matches! You found the same color.` : currentId === 'patterns' ? `${current.round.target.name} comes next. The pattern repeats!` : `You spotted the different ${current.round.property}!`;
    complete(text);
    play.querySelectorAll('[data-choice]').forEach(button => { button.disabled = true; });
  }
  function renderChoices() {
    const round = current.round, stage = element('div', 'discover-choice-stage');
    if (currentId === 'shape-match' || currentId === 'color-match') {
      objective.textContent = currentId === 'shape-match' ? `Find the ${round.target.name.toLowerCase()}.` : `Find this color: ${round.target.name.toLowerCase()}.`;
      const model = element('div', `discover-model ${currentId === 'shape-match' && profile.tier !== 'little' ? 'discover-model-clue' : ''}`);
      if (currentId === 'color-match' || profile.tier === 'little') model.append(tokenPicture(round.target));
      else model.append(element('span', 'discover-model-spark', '◇'));
      const words = element('div'); words.append(element('strong', '', currentId === 'shape-match' ? round.target.name : 'Match the swatch'), element('p', '', currentId === 'shape-match' ? round.target.clue : 'Look at the colors and their names.')); model.append(words); stage.append(model);
    } else if (currentId === 'patterns') {
      objective.textContent = 'Which picture comes next?';
      const line = element('div', 'discover-pattern-strip'); line.setAttribute('role', 'list'); line.setAttribute('aria-label', 'Pattern to complete');
      round.sequence.forEach((item, index) => { const token = element('div', 'discover-pattern-token'); token.setAttribute('role', 'listitem'); token.setAttribute('aria-label', `${index + 1}: ${item.name}`); token.append(tokenPicture(item)); line.append(token); });
      const blank = element('div', 'discover-pattern-token discover-pattern-blank', '?'); blank.setAttribute('aria-label', 'What comes next?'); line.append(blank); stage.append(line);
      stage.append(element('p', 'discover-tip', profile.tier === 'little' ? 'Look, say the pictures, then keep it going.' : 'Find the repeating part. Then choose the next picture.'));
    } else {
      objective.textContent = `Find the different ${round.property}.`;
      stage.append(element('p', 'discover-tip', `All but one have the same ${round.property}. Which one stands out?`));
    }
    const grid = element('div', `discover-choice-grid ${round.choices.length > 4 ? 'discover-six' : ''}`); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Choose an answer');
    round.choices.forEach((entry, index) => {
      const item = currentId === 'odd-one-out' ? entry.value : entry;
      const label = currentId === 'odd-one-out' ? `Picture ${index + 1}: ${item.name}` : item.name;
      const node = choiceButton(item, label, () => selectChoice(entry.id, node)); node.dataset.choice = entry.id; node.dataset.label = label;
      if (currentId === 'odd-one-out') node.querySelector('.discover-choice-label').textContent = `${index + 1}. ${item.name}`;
      if (current.done) { node.disabled = true; if (entry.id === round.answer) node.classList.add('is-correct'); }
      grid.append(node);
    });
    stage.append(grid); play.append(stage);
  }
  function renderSorting() {
    const round = current.round;
    objective.textContent = profile.tier === 'maker' ? 'Where does each vehicle travel?' : 'Put each picture in its basket.';
    play.append(element('p', 'discover-tip', '1. Tap a picture.   2. Tap its basket.'));
    const items = element('div', 'discover-sort-items'); items.setAttribute('role', 'group'); items.setAttribute('aria-label', 'Pictures to sort');
    round.items.forEach(item => {
      const node = button('', `discover-sort-item ${current.sorted.has(item.id) ? 'is-sorted' : ''}`, () => {
        current.selected = item.id; message(`${item.name} is ready. Tap its basket.`); render();
      }); node.dataset.item = item.id; node.setAttribute('aria-label', `${item.name}${current.sorted.has(item.id) ? ', sorted' : ''}`); node.setAttribute('aria-pressed', String(current.selected === item.id)); node.disabled = current.sorted.has(item.id);
      node.append(tokenPicture(item), element('span', '', item.name)); if (current.sorted.has(item.id)) node.append(element('span', 'discover-tick', '✓')); items.append(node);
    });
    const baskets = element('div', 'discover-baskets'); baskets.style.setProperty('--baskets', round.categories.length);
    round.categories.forEach(category => {
      const node = button('', 'discover-basket', () => {
        if (current.done) return;
        const selected = round.items.find(item => item.id === current.selected);
        if (!selected) { message('Choose a picture first, then tap its basket.', 'retry'); return; }
        if (selected.category !== category.id) { const correct = round.categories.find(c => c.id === selected.category); message(`${selected.name} belongs in “${correct.name}”. Try that basket.`, 'retry'); return; }
        current.sorted.add(selected.id); current.selected = null;
        if (current.sorted.size === round.items.length) complete('Every picture has a home. Lovely sorting!');
        else message(`${selected.name} found its basket. Choose another picture.`, 'success');
        render();
      }); node.dataset.category = category.id; node.setAttribute('aria-label', `${category.name} basket`); node.disabled = current.done;
      const sorted = round.items.filter(item => item.category === category.id && current.sorted.has(item.id));
      node.append(tokenPicture(category), element('strong', '', category.name));
      const collection = element('span', 'discover-basket-collection', sorted.length ? sorted.map(item => item.emoji).join(' ') : '＋'); collection.setAttribute('aria-hidden', 'true'); node.append(collection); baskets.append(node);
    });
    play.append(items, baskets, element('p', 'discover-tip', `${current.sorted.size} of ${round.items.length} pictures sorted`));
  }
  function renderMemory() {
    const round = current.round;
    objective.textContent = `Find ${round.pairs} matching pairs.`;
    play.append(element('p', 'discover-tip', 'Tap two cards. Remember where the pictures live.'));
    const grid = element('div', `discover-memory-grid ${round.pairs === 2 ? 'discover-memory-small' : ''}`);
    round.cards.forEach((card, index) => {
      const faceUp = current.flipped.includes(index) || current.matched.has(card.id), matched = current.matched.has(card.id);
      const node = button('', `discover-memory-card ${faceUp ? 'is-open' : ''} ${matched ? 'is-matched' : ''}`, () => {
        if (current.done || current.flipped.length === 2 || current.flipped.includes(index) || current.matched.has(card.id)) return;
        current.flipped.push(index);
        if (current.flipped.length === 2) {
          const [a, b] = current.flipped.map(i => round.cards[i]);
          if (a.id === b.id) {
            current.matched.add(a.id); current.flipped = [];
            if (current.matched.size === round.pairs) complete('You found every pair. What a memory!');
            else message(`A pair of ${a.name.toLowerCase()} pictures! Keep exploring.`, 'success');
          } else message('Two different pictures. Look carefully, then turn them over.', 'retry');
        } else message(`${card.name}. Can you find its matching picture?`);
        render();
      });
      node.dataset.card = String(index); node.dataset.matched = String(matched); node.setAttribute('aria-label', `Card ${index + 1}, ${matched ? `matched ${card.name}` : faceUp ? card.name : 'face down'}`);
      node.disabled = matched || faceUp || current.flipped.length === 2 || current.done;
      if (faceUp) { node.append(tokenPicture(card)); if (matched) node.append(element('span', 'discover-tick', '✓')); }
      else { node.append(element('span', 'discover-card-flower', '✿'), element('span', 'discover-card-number', String(index + 1))); }
      grid.append(node);
    });
    play.append(grid, element('p', 'discover-tip', `${current.matched.size} of ${round.pairs} pairs found`));
    if (current.flipped.length === 2) {
      const reset = button('↶ Turn them over', 'button discover-memory-hide', () => { current.flipped = []; message('Try another pair. The pictures stay in the same places.'); render(); });
      play.append(reset); reset.focus({ preventScroll: true });
    }
  }
  function moveMaze(next) {
    if (current.done) return;
    const path = mazeStep(current.round, current.path, next);
    if (path === current.path) { message('Follow a glowing square next to Bunny. Watch for the walls.', 'retry'); return; }
    current.path = path;
    if (next === current.round.goal) complete('Bunny found the carrot. You followed the whole trail!');
    else message('Keep going! Tap a glowing square or use the arrows.');
    render();
  }
  function renderMaze() {
    const round = current.round, position = current.path[current.path.length - 1];
    objective.textContent = 'Guide Bunny to the carrot.';
    play.append(element('p', 'discover-tip', 'Tap a glowing neighbor. You can also use the arrow buttons.'));
    const layout = element('div', 'discover-maze-layout'), board = element('div', 'discover-maze-grid'); board.style.setProperty('--maze-size', round.size); board.setAttribute('aria-label', 'Bunny maze');
    round.cells.forEach((neighbors, index) => {
      const x = index % round.size, y = Math.floor(index / round.size), possible = round.cells[position].includes(index);
      const node = button('', `discover-maze-cell ${possible && !current.done ? 'is-neighbor' : ''} ${current.path.includes(index) ? 'is-trail' : ''} ${index === position ? 'is-bunny' : ''}`, () => moveMaze(index));
      node.dataset.cell = String(index); node.dataset.neighbors = neighbors.join(','); node.dataset.goal = String(index === round.goal); node.dataset.current = String(index === position);
      node.setAttribute('aria-label', `Row ${y + 1}, column ${x + 1}${index === position ? ', Bunny' : index === round.goal ? ', carrot' : possible ? ', next step' : ''}`);
      node.tabIndex = index === position ? 0 : -1;
      node.style.borderTopColor = neighbors.includes(index - round.size) ? 'transparent' : '#657387';
      node.style.borderBottomColor = neighbors.includes(index + round.size) ? 'transparent' : '#657387';
      node.style.borderLeftColor = x > 0 && neighbors.includes(index - 1) ? 'transparent' : '#657387';
      node.style.borderRightColor = x < round.size - 1 && neighbors.includes(index + 1) ? 'transparent' : '#657387';
      node.textContent = index === position ? '🐰' : index === round.goal ? '🥕' : possible && !current.done ? '·' : current.path.includes(index) ? '·' : '';
      board.append(node);
    });
    const controls = element('div', 'discover-maze-controls');
    const arrows = element('div', 'discover-maze-arrows');
    [['up', '↑', position - round.size], ['left', '←', position - 1], ['down', '↓', position + round.size], ['right', '→', position + 1]].forEach(([direction, symbol, next]) => {
      const node = button(symbol, `button discover-arrow discover-${direction}`, () => moveMaze(next)); node.setAttribute('aria-label', `Move ${direction}`); node.disabled = current.done || !round.cells[position].includes(next); arrows.append(node);
    });
    const undo = button('↶ One step back', 'button discover-maze-undo', () => { current.path.pop(); current.done = false; message('One step back. Find your next turn.'); render(); }); undo.disabled = current.path.length <= 1;
    controls.append(arrows, undo, element('p', 'discover-tip', 'Follow the open paths. Take your time.')); layout.append(board, controls); play.append(layout);
  }
  function render() {
    const meta = META[currentId]; title.textContent = meta[0]; $('.discover-activity-icon').textContent = meta[2]; $('.discover-level').textContent = `${profile.name} · round ${current.index + 1}`;
    hearButton.disabled = !getSettings().sound || !('speechSynthesis' in window); hearButton.title = hearButton.disabled ? 'Turn on sound from the home screen to hear instructions' : 'Hear these instructions';
    play.replaceChildren(); nextButton.classList.toggle('is-ready', current.done); container.dataset.discovery = currentId;
    if (currentId === 'sorting') renderSorting(); else if (currentId === 'memory') renderMemory(); else if (currentId === 'maze') renderMaze(); else renderChoices();
    message(current.message || meta[1], current.feedback); updateCounter();
  }
  $('.discover-back').addEventListener('click', onBack);
  hearButton.addEventListener('click', () => speak(`${objective.textContent} ${$('.discover-tip')?.textContent || ''}`));
  nextButton.addEventListener('click', () => { const key = `${currentId}:${profile.tier}`; current = fresh(current.index + 1); sessions.set(key, current); render(); objective.focus({ preventScroll: true }); });
  restartButton.addEventListener('click', () => { const { round, index, recorded } = current; current = { ...fresh(index), round, recorded }; sessions.set(`${currentId}:${profile.tier}`, current); render(); message('A fresh start. Have another go.'); });
  objective.tabIndex = -1;
  document.addEventListener('keydown', event => {
    if (!active || currentId !== 'maze' || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) || event.target.closest?.('dialog, input, select, textarea')) return;
    event.preventDefault(); const position = current.path[current.path.length - 1], offset = { ArrowUp: -current.round.size, ArrowDown: current.round.size, ArrowLeft: -1, ArrowRight: 1 }[event.key]; moveMaze(position + offset);
  });
  function settingsChanged() { const next = getProfile(getSettings()), tierChanged = next.tier !== profile.tier; profile = next; if (!getSettings().sound && 'speechSynthesis' in window) window.speechSynthesis.cancel(); if (active) { if (tierChanged) getSession(); render(); } }
  report();
  return {
    open(id) { if (!DISCOVERY_IDS.includes(id)) throw new Error(`Unknown discovery activity: ${id}`); active = true; currentId = id; profile = getProfile(getSettings()); getSession(); render(); },
    close() { active = false; if ('speechSynthesis' in window) window.speechSynthesis.cancel(); },
    settingsChanged,
  };
}
