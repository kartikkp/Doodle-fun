import {getProfile,readStore,writeStore,normalizeSettings} from './core.js';
import {createDrawing} from './draw.js';
import {createLearning} from './learning.js';
import {createDiscovery} from './discovery.js';
import {createChallenges} from './challenges.js';
import {createAdventures} from './adventures.js';
import {createListening} from './listening.js';
import {ACTIVITIES,ACTIVITY_MODES,CATEGORIES,getActivity,getFamily} from './catalog.js';
import {coachingFor,normalizeAdjustments} from './coaching.js';
import {canSpeak,speak,stopSpeaking} from './speech.js';
import {openExternalURL} from './parental-gate.js';

let settings = normalizeSettings(readStore('settings', null));
let drawing, learning, discovery, challenges, adventures, listening, activeRoute = 'home', navigationId = 0, noticeTimer, filter = 'all';
const adjustments = normalizeAdjustments(readStore('activity-support-v1',{}),ACTIVITY_MODES.map(a=>a.id));
const $ = id => document.getElementById(id);
const home = $('home-screen'), drawView = $('drawing-view'), learnView = $('learning-view');
const discoveryView = $('discovery-view'), challengesView = $('challenges-view');
const adventuresView = $('adventures-view'), listeningView = $('listening-view');
const modeBar = $('activity-mode-bar');
const settingsDialog = $('grownups-dialog');
let informationReturn = null;
const getSettings = () => ({...settings,challengeOffset:adjustments[activeRoute] || 0});
const getTitle = () => ['letters','numbers'].includes(location.hash.slice(1)) ? null : getFamily(activeRoute)?.title || null;
const soundIcon = enabled => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 5-6 4H2v6h3l6 4V5Z"/>${enabled?'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>'}</svg>`;
function notice(message) {
  if (!message) return;
  $('app-notice').textContent = message;
  $('app-notice').hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => $('app-notice').hidden = true, 4200);
}
function renderProgress(value) {
  const counts = readStore('activity-progress-sources', {});
  const sources = counts && typeof counts==='object' && !Array.isArray(counts) ? counts : {};
  if (value && typeof value==='object' && Number.isFinite(value.completedCount) && value.completedCount>=0) {
    sources[value.source || 'learning'] = value.completedCount;
    writeStore('activity-progress-sources', sources);
  }
  const count = Object.values(sources).filter(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0).reduce((a,b)=>a+b,0);
  $('home-progress').textContent = count ? `${count} little ${count === 1 ? 'win' : 'wins'}` : 'Every try counts';
  $('home-progress-sub').textContent = count ? 'Look what you’re learning!' : 'Play at your own pace';
}
function renderCatalog() {
  const tier=getProfile(settings).tier;
  $('activity-filters').innerHTML=CATEGORIES.map(category=>`<button class="activity-filter" type="button" data-filter="${category.id}" aria-pressed="${filter===category.id}"><span aria-hidden="true">${category.icon}</span>${category.label}</button>`).join('');
  const homeOrder=settings.age<=4 ? ['draw','sound-match','shape-match','counting','ordering','memory','trails','sorting','picture-sequence','melody-echo'] : settings.age<=7 ? ['draw','melody-echo','patterns','word-build','sharing','make-a-shape','pitch-path','number-stories','beat-studio','maze'] : ['draw','beat-studio','maze','melody-echo','pitch-path','word-build','sharing','number-stories','patterns','picture-sequence'];
  const visible=ACTIVITIES.filter(activity=>filter==='all'||activity.category===filter);
  if(filter==='all')visible.sort((a,b)=>(homeOrder.includes(a.id)?homeOrder.indexOf(a.id):99)-(homeOrder.includes(b.id)?homeOrder.indexOf(b.id):99));
  $('activity-count').textContent=`${visible.length} activities`;
  $('activity-guidance').textContent=tier==='little'?'Big targets, small steps. Explore words and number puzzles together.':tier==='explorer'?'Try a new idea. Hints and practice are always here.':'More to think about. Take your time and try a new challenge.';
  const classes={create:'card-draw',letters:'card-letters',numbers:'card-numbers',discover:'card-color',listen:'card-listen'};
  $('activity-grid').innerHTML=visible.map(activity=>`<a class="activity-card ${classes[activity.category]}" id="card-${activity.id}" href="#${activity.id}" data-engine="${activity.engine}"><div class="card-topline"><span class="skill-tag">${CATEGORIES.find(c=>c.id===activity.category).label}</span><span class="card-arrow" aria-hidden="true">↗</span></div><div class="card-picture" aria-hidden="true"><span class="catalog-icon${activity.icon.length>3?' catalog-word':''}">${activity.icon}</span></div><div class="card-bottom"><div><h3>${activity.title}</h3><p>${activity.description}</p></div></div><div class="card-footnote">${activity.skill}${activity.modes.length>1?`<span class="card-mode-count">${activity.modes.length} ways to play</span>`:''}</div></a>`).join('');
}
function learningModeChanged({set,mode,pageMode}) {
  const next=pageMode==='trace' ? {shapes:'prewriting',upper:'uppercase',lower:'lowercase',words:'word-tracing',nums:'number-tracing'}[set] : {count:'counting',add:'addition',groups:'equal-groups'}[mode];
  // Broad legacy pages keep their original tabs; update coaching without
  // replacing their in-progress exercise. Managed links navigate to a family.
  if (['letters','numbers'].includes(location.hash.slice(1))) {
    if(next){activeRoute=next;renderCoach();}
  } else if(next) location.hash=next;
}
function renderModeBar() {
  const family=getFamily(activeRoute),managed=!['letters','numbers'].includes(location.hash.slice(1));
  modeBar.hidden=!family || family.modes.length<2 || !managed;
  modeBar.replaceChildren();
  if(modeBar.hidden)return;
  modeBar.setAttribute('aria-label',`${family.title} practice modes`);
  for(const mode of family.modes) {
    const button=document.createElement('button');button.type='button';button.className='activity-mode';
    button.dataset.activityMode=mode.id;button.textContent=mode.label;
    button.setAttribute('aria-pressed',String(mode.id===activeRoute));
    const preset=ACTIVITY_MODES.find(item=>item.id===mode.id)?.options?.set;
    if(preset)button.dataset.learnSet=preset;
    button.addEventListener('click',()=>{location.hash=mode.id;});modeBar.append(button);
  }
  requestAnimationFrame(()=>{const selected=modeBar.querySelector('[aria-pressed="true"]');if(selected)modeBar.scrollLeft=Math.max(0,selected.offsetLeft-modeBar.offsetLeft-12);});
}
// Measure the shared navigation so the canvas keeps its full usable height.
new ResizeObserver(()=>document.documentElement.style.setProperty('--activity-nav-height',`${$('activity-coach-bar').getBoundingClientRect().height+modeBar.getBoundingClientRect().height}px`)).observe(modeBar);
new ResizeObserver(()=>document.documentElement.style.setProperty('--activity-nav-height',`${$('activity-coach-bar').getBoundingClientRect().height+modeBar.getBoundingClientRect().height}px`)).observe($('activity-coach-bar'));
new MutationObserver(()=>{if(document.querySelector('dialog[open]'))listening?.suspendAudio();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});

function renderSettings() {
  const profile = getProfile(settings);
  document.querySelectorAll('.age-option').forEach(button => {
    const age = Number(button.dataset.age);
    const selected = settings.age === age;
    button.setAttribute('aria-pressed',String(selected));
  });
  $('age-description').textContent = settings.level === 'auto' ? `Age ${settings.age} · adjust each game with Coach` : `${profile.name} support · age ${settings.age}`;
  $('child-age').value = settings.age;
  $('child-age-output').value = settings.age;
  $('age-minus').disabled = settings.age <= 2;
  $('age-plus').disabled = settings.age >= 10;
  $('support-level').value = settings.level;
  $('settings-sound').checked = settings.sound;
  $('sound-toggle').innerHTML = soundIcon(settings.sound);
  $('sound-toggle').setAttribute('aria-pressed',String(settings.sound));
  $('sound-toggle').setAttribute('aria-label',settings.sound ? 'Turn off read aloud' : 'Turn on read aloud');
  $('parent-guidance').textContent = {
    little:'Explore marks, colors, shapes, and small groups together. Words and arithmetic are optional shared practice. A model, demonstration, or your voice can help.',
    explorer:'Connect letters with familiar words. Count objects together and ask how your child found an answer. Use Show me in tracing activities whenever it helps.',
    maker:'Explore number relationships, longer patterns, memory, and spelling. Invite your child to explain a strategy or tell a story about a drawing. Adjust support whenever needed.',
  }[profile.tier];
  renderCatalog();
  renderCoach();
}
function updateSettings(patch) {
  settings = normalizeSettings({...settings,...patch});
  writeStore('settings',settings);
  renderSettings();
  if('age' in patch || 'level' in patch) drawing?.settingsChanged();
  learning?.settingsChanged();
  discovery?.settingsChanged();
  challenges?.settingsChanged();
  adventures?.settingsChanged();
  listening?.settingsChanged();
  if (!settings.sound) stopSpeaking();
}
function activeController() {
  return {drawing,learning,discovery,challenges,adventures,listening}[getActivity(activeRoute)?.engine];
}
function renderCoach() {
  const activity=getActivity(activeRoute), profile=getProfile(getSettings());
  $('activity-coach-bar').hidden=!activity;
  if(!activity) return;
  const tips=coachingFor(activeRoute,profile.challengeAge);
  $('coach-summary').textContent=`Age ${settings.age} · ${tips.together?'Play together': 'Your pace'}`;
  $('coach-title').textContent=getTitle() || activity.title;
  $('coach-together').textContent=tips.together?'Try this together. A grown-up can read the clues and model the first step.':'Take your time. Use a hint whenever it helps.';
  for(const key of ['start','strategy','reflect','offline']) $(`coach-${key}`).textContent=tips[key];
  const offset=adjustments[activeRoute] || 0;
  $('coach-level').textContent=`Starting age ${settings.age} · practice step ${profile.challengeAge}${offset?' · adjusted for this game':''}`;
  $('coach-easier').disabled=offset<=-2 || profile.challengeAge<=2;
  $('coach-harder').disabled=offset>=2 || profile.challengeAge>=10;
  $('coach-reset').hidden=!offset;
  $('coach-hear').disabled=!canSpeak();
  $('coach-hear').textContent=settings.sound?'Hear these tips':'Read these tips to me';
  $('coach-sound').innerHTML=soundIcon(settings.sound);
  $('coach-sound').setAttribute('aria-pressed',String(settings.sound));
  $('coach-sound').setAttribute('aria-label',settings.sound?'Turn off read aloud':'Turn on read aloud');
  $('coach-hint').hidden=!activeController()?.hint && !['drawing','learning'].includes(activity.engine);
}
function changeChallenge(offset) {
  adjustments[activeRoute]=offset;
  writeStore('activity-support-v1',adjustments);
  activeController()?.settingsChanged();
  renderCoach();
}
function goHome() { location.hash='home'; }
function route() {
  const nav = ++navigationId;
  const requested = location.hash.slice(1) || 'home';
  const activity = getActivity(requested,settings.age);
  const previous=activeRoute;
  const next=activity?.id || 'home';
  stopSpeaking();
  $('coach-dialog').close();
  drawing?.close(); learning?.close(); discovery?.close(); challenges?.close(); adventures?.close(); listening?.close();
  activeRoute=next;
  home.hidden=next!=='home';
  for(const view of [drawView,learnView,discoveryView,challengesView,adventuresView,listeningView]) view.hidden=true;
  document.body.dataset.activity=next;
  try {
    if(activity?.engine==='drawing') {
      drawing ||= createDrawing(drawView,{getSettings,getTitle,onBack:goHome,onNotice:notice});
      drawView.hidden=false; drawing.open({coloring:next==='coloring'});
    } else if(activity?.engine==='learning') {
      learning ||= createLearning(learnView,{getSettings,getTitle,onModeChange:learningModeChanged,onBack:goHome,onNotice:notice,onProgress:renderProgress});
      learnView.hidden=false; learning.open(activity.kind,{...activity.options,managedModes:Boolean(activity.familyId)});
    } else if(activity?.engine==='discovery') {
      discovery ||= createDiscovery(discoveryView,{getSettings,getTitle,onBack:goHome,onNotice:notice,onProgress:renderProgress});
      discoveryView.hidden=false; discovery.open(next);
    } else if(activity?.engine==='challenges') {
      challenges ||= createChallenges(challengesView,{getSettings,getTitle,onBack:goHome,onNotice:notice,onProgress:renderProgress});
      challengesView.hidden=false; challenges.open(next);
    } else if(activity?.engine==='adventures') {
      adventures ||= createAdventures(adventuresView,{getSettings,getTitle,onBack:goHome,onNotice:notice,onProgress:renderProgress});
      adventuresView.hidden=false; adventures.open(next);
    }
    if(activity?.engine==='listening') {
      listening ||= createListening(listeningView,{getSettings,onBack:goHome,onNotice:notice,onProgress:renderProgress});
      listeningView.hidden=false; listening.open(next);
    }
    renderModeBar();renderCoach();
    document.title=activity ? `${getTitle() || activity.title} · Doodle Fun` : 'Doodle Fun · Play, create & learn';
    window.scrollTo(0,0);
    if(next==='home') {
      renderProgress();
      if(nav>1) ($(`card-${getFamily(previous)?.id || previous}`) || $('main-content')).focus({preventScroll:false});
    }
  } catch(error) {
    console.error('Activity could not open:',error);
    history.replaceState(null,'','#home');activeRoute='home';document.body.dataset.activity='home';
    home.hidden=false;
    for(const view of [drawView,learnView,discoveryView,challengesView,adventuresView,listeningView]) view.hidden=true;
    renderModeBar();renderCoach();
    notice('Something interrupted this activity. Choose it again to retry.');
  }
}
$('activity-filters').addEventListener('click',event=>{
  const button=event.target.closest('[data-filter]');
  if(!button)return;
  filter=button.dataset.filter;renderCatalog();
  document.querySelector(`[data-filter="${filter}"]`).focus({preventScroll:true});
});

document.querySelectorAll('.age-option').forEach(button => button.addEventListener('click',() => updateSettings({age:Number(button.dataset.age),level:'auto'})));
$('sound-toggle').addEventListener('click',() => { updateSettings({sound:!settings.sound}); notice(settings.sound ? 'Read aloud is on. Tap “Hear it” in an activity.' : 'Read aloud is off.'); });
$('grownups-open').addEventListener('click',() => {renderSettings();settingsDialog.showModal();});
$('settings-done').addEventListener('click',() => settingsDialog.close());
settingsDialog.addEventListener('click',e => {if(e.target===settingsDialog){const r=settingsDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settingsDialog.close();}});
$('age-minus').addEventListener('click',()=>updateSettings({age:settings.age-1}));
$('age-plus').addEventListener('click',()=>updateSettings({age:settings.age+1}));
$('support-level').addEventListener('change',e=>updateSettings({level:e.target.value}));
$('settings-sound').addEventListener('change',e=>updateSettings({sound:e.target.checked}));
document.querySelectorAll('[data-open-info]').forEach(button => button.addEventListener('click', () => {
  informationReturn = button;
  $(button.dataset.openInfo + '-dialog').showModal();
}));
document.querySelectorAll('[data-close-info]').forEach(button => button.addEventListener('click', () => $(button.dataset.closeInfo + '-dialog').close()));
for (const id of ['privacy-dialog', 'support-dialog']) {
  $(id).addEventListener('close', () => informationReturn?.focus({preventScroll:true}));
  $(id).addEventListener('click', event => {
    const link = event.target.closest('a[href], [data-external-url]');
    if (!link) return;
    event.preventDefault();
    openExternalURL(link.dataset.externalUrl || link.href).catch(() => notice('The website could not open. Please try again.'));
  });
}
window.addEventListener('doodle-native-external', event => {
  if (event.detail?.status === 'failed') notice('The website could not open. Please try again.');
});
window.addEventListener('hashchange',route);
$('coach-open').addEventListener('click',()=>{listening?.suspendAudio();renderCoach();$('coach-dialog').showModal();});
for(const id of ['coach-close','coach-done']) $(id).addEventListener('click',()=>{$('coach-dialog').close();stopSpeaking();});
$('coach-easier').addEventListener('click',()=>changeChallenge((adjustments[activeRoute] || 0)-1));
$('coach-harder').addEventListener('click',()=>changeChallenge((adjustments[activeRoute] || 0)+1));
$('coach-reset').addEventListener('click',()=>changeChallenge(0));
$('coach-sound').addEventListener('click',()=>updateSettings({sound:!settings.sound}));
$('coach-hear').addEventListener('click',()=>{listening?.suspendAudio();if(!settings.sound)updateSettings({sound:true});const tips=coachingFor(activeRoute,getProfile(getSettings()).challengeAge);speak(`${tips.start} ${tips.strategy} ${tips.reflect}`);});
$('coach-hint').addEventListener('click',()=>{
  $('coach-dialog').close();
  const controller=activeController();
  if(controller?.hint)controller.hint();
  else if(getActivity(activeRoute)?.engine==='learning') learnView.querySelector('.learn-demo, .learn-hint')?.click();
  else notice(coachingFor(activeRoute,getProfile(getSettings()).challengeAge).strategy);
});
window.addEventListener('pagehide',()=>{stopSpeaking();drawing?.close();learning?.close();discovery?.close();challenges?.close();adventures?.close();listening?.close();});
window.addEventListener('pageshow',event=>{if(event.persisted)route();});
renderSettings();renderProgress();route();
// The built app includes every activity. This worker also keeps reloads available offline.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Offline copy unavailable:',error.message)));
}
