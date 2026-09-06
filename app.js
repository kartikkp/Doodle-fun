import {getProfile,readStore,writeStore,normalizeSettings} from './core.js';

let settings = normalizeSettings(readStore('settings', null));
let drawing, learning, activeRoute = 'home', navigationId = 0, noticeTimer;
const $ = id => document.getElementById(id);
const home = $('home-screen'), drawView = $('drawing-view'), learnView = $('learning-view');
const settingsDialog = $('grownups-dialog');
const getSettings = () => ({...settings});
const soundIcon = enabled => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 5-6 4H2v6h3l6 4V5Z"/>${enabled?'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>'}</svg>`;
function notice(message) {
  if (!message) return;
  $('app-notice').textContent = message;
  $('app-notice').hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => $('app-notice').hidden = true, 4200);
}
function renderProgress(value) {
  const raw = typeof value === 'object' && value ? value.completedCount : value;
  const count = typeof raw === 'number' ? raw : NaN;
  if (!Number.isFinite(count) || count < 0) return;
  writeStore('home-progress', count);
  $('home-progress').textContent = count ? `${count} little ${count === 1 ? 'win' : 'wins'}` : 'Every try counts';
  $('home-progress-sub').textContent = count ? 'Look what you’re learning!' : 'Play at your own pace';
}
function renderSettings() {
  const profile = getProfile(settings);
  document.querySelectorAll('.age-option').forEach(button => {
    const age = Number(button.dataset.age);
    const selected = settings.age <= 4 ? age === 3 : settings.age <= 7 ? age === 6 : age === 9;
    button.setAttribute('aria-pressed',String(selected));
  });
  $('age-description').textContent = settings.level === 'auto' ? 'A little help, a little challenge.' : `${profile.name} support · age ${settings.age}`;
  $('child-age').value = settings.age;
  $('child-age-output').value = settings.age;
  $('age-minus').disabled = settings.age <= 2;
  $('age-plus').disabled = settings.age >= 10;
  $('support-level').value = settings.level;
  $('settings-sound').checked = settings.sound;
  $('sound-toggle').innerHTML = soundIcon(settings.sound);
  $('sound-toggle').setAttribute('aria-pressed',String(settings.sound));
  $('sound-toggle').setAttribute('aria-label',settings.sound ? 'Turn off read aloud' : 'Turn on read aloud');
  const copy = {
    little:{letters:'Big lines for little hands.',letterHint:'Lines, shapes & first letters',numbers:'A few things. Lots to discover.',numberHint:'Count small groups & trace numbers',drawing:'Make a mark. See what happens.',drawHint:'Big brushes & simple color play',parent:'Explore marks, lines, and small groups together. Naming colors or counting a few objects is enough. There is no need to finish a letter.'},
    explorer:{letters:'Follow a line. Find a letter.',letterHint:'Big letters, little letters & words',numbers:'Count, trace & discover.',numberHint:'Counting, numerals & a little adding',drawing:'Dream it. Draw it.',drawHint:'Colors, stamps & endless ideas',parent:'Connect letters with familiar words. Count the objects together and invite your child to explain their drawing. “Show me” gives a tracing demonstration.'},
    maker:{letters:'Little letters. Bigger ideas.',letterHint:'Word practice & careful letter shapes',numbers:'Think it through. Try it out.',numberHint:'Bigger counts & number puzzles',drawing:'Draw a story only you can tell.',drawHint:'Details, patterns & creative challenges',parent:'Use drawing prompts to tell a story or explore a pattern. Word tracing supports handwriting practice; invite a sentence or story off-screen too. Number challenges add a little reasoning.'},
  }[profile.tier];
  $('letters-description').textContent=copy.letters;
  $('letters-hint').textContent=copy.letterHint;
  $('numbers-description').textContent=copy.numbers;
  $('numbers-hint').textContent=copy.numberHint;
  $('draw-description').textContent=copy.drawing;
  $('draw-hint').textContent=copy.drawHint;
  $('parent-guidance').textContent=copy.parent;
}
function updateSettings(patch) {
  settings = normalizeSettings({...settings,...patch});
  writeStore('settings',settings);
  renderSettings();
  drawing?.settingsChanged();
  learning?.settingsChanged();
  if (!settings.sound) globalThis.speechSynthesis?.cancel();
}
function goHome() { location.hash='home'; }
async function route() {
  const nav = ++navigationId;
  const requested = location.hash.slice(1) || 'home';
  const next = ['draw','coloring','letters','numbers'].includes(requested) ? requested : 'home';
  drawing?.close(); learning?.close();
  activeRoute = next;
  home.hidden = next !== 'home'; drawView.hidden = true; learnView.hidden = true;
  document.body.dataset.activity = next;
  try {
    if (next==='draw'||next==='coloring') {
      if (!drawing) {
        const {createDrawing} = await import('./draw.js');
        if (nav !== navigationId) return;
        drawing = createDrawing(drawView,{getSettings,onBack:goHome,onNotice:notice});
      }
      if (nav !== navigationId) return;
      drawView.hidden=false;
      drawing.open({coloring:next==='coloring'});
    } else if(next==='letters'||next==='numbers') {
      if (!learning) {
        const {createLearning} = await import('./learning.js');
        if (nav !== navigationId) return;
        learning = createLearning(learnView,{getSettings,onBack:goHome,onNotice:notice,onProgress:renderProgress});
      }
      if (nav !== navigationId) return;
      learnView.hidden=false;
      learning.open(next);
    }
    document.title = next==='home' ? 'Doodle Fun · Play, create & learn' : `${{draw:'Doodle studio',coloring:'Color & create',letters:'Letter adventures',numbers:'Number explorers'}[next]} · Doodle Fun`;
    window.scrollTo(0,0);
    if(next==='home') {
      renderProgress(readStore('home-progress',0));
      if (nav > 1) $('main-content').focus({preventScroll:true});
    }
  } catch(error) {
    if (nav !== navigationId) return;
    console.error('Activity could not open:',error);
    home.hidden=false; drawView.hidden=true; learnView.hidden=true;
    notice('That activity could not open. Please reload and try again.');
  }
}

document.querySelectorAll('.age-option').forEach(button => button.addEventListener('click',() => updateSettings({age:Number(button.dataset.age),level:'auto'})));
$('sound-toggle').addEventListener('click',() => { updateSettings({sound:!settings.sound}); notice(settings.sound ? 'Read aloud is on. Tap “Hear it” in an activity.' : 'Read aloud is off.'); });
$('grownups-open').addEventListener('click',() => {renderSettings();settingsDialog.showModal();});
$('settings-done').addEventListener('click',() => settingsDialog.close());
settingsDialog.addEventListener('click',e => {if(e.target===settingsDialog){const r=settingsDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settingsDialog.close();}});
$('age-minus').addEventListener('click',()=>updateSettings({age:settings.age-1}));
$('age-plus').addEventListener('click',()=>updateSettings({age:settings.age+1}));
$('support-level').addEventListener('change',e=>updateSettings({level:e.target.value}));
$('settings-sound').addEventListener('change',e=>updateSettings({sound:e.target.checked}));
window.addEventListener('hashchange',route);
window.addEventListener('pagehide',()=>{drawing?.close();learning?.close();});
window.addEventListener('pageshow',event=>{if(event.persisted)route();});
renderSettings();renderProgress(readStore('home-progress',0));route();
