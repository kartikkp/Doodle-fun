import {getProfile,readStore,writeStore,normalizeSettings} from './core.js';
import {createDrawing} from './draw.js';
import {createLearning} from './learning.js';
import {createDiscovery} from './discovery.js';
import {createChallenges} from './challenges.js';
import {createAdventures} from './adventures.js';
import {createListening} from './listening.js';
import {ACTIVITIES,ACTIVITY_MODES,CATEGORIES,getActivity,getFamily} from './catalog.js';
import {coachingFor,coachingText,normalizeAdjustments} from './coaching.js';
import {activityArt,appearanceBand} from './activity-art.js';
import {canSpeak,requestSpeech,prepareSpeech,stopSpeaking} from './speech.js';
import {openExternalURL,setExternalActionGuard,cancelParentAction} from './parental-gate.js';
import {createStudioPlay} from './studio-play.js';
import {createParentControls} from './parent-controls.js';
import {createGuidedAccessGuide} from './guided-access.js';
import {beginRound,getCurrentRound,getModeProgress,subscribeProgress} from './progression.js';

let settings = normalizeSettings(readStore('settings', null));
let drawing, learning, discovery, challenges, adventures, listening, studio, activeRoute = 'home', navigationId = 0, noticeTimer, filter = 'all';
const adjustments = normalizeAdjustments(readStore('activity-support-v1',{}),ACTIVITY_MODES.map(a=>a.id));
const $ = id => document.getElementById(id);
const home = $('home-screen'), drawView = $('drawing-view'), learnView = $('learning-view');
const discoveryView = $('discovery-view'), challengesView = $('challenges-view');
const adventuresView = $('adventures-view'), listeningView = $('listening-view');
const studioView=$('studio-view');
const modeBar = $('activity-mode-bar');
const settingsDialog = $('grownups-dialog');
let informationReturn = null, coachSpeechToken=0, coachSpeaking=false;
const rawSteps=readStore('practice-steps-v1',{});
const practiceSteps=rawSteps&&typeof rawSteps==='object'&&!Array.isArray(rawSteps)?Object.fromEntries(Object.entries(rawSteps).filter(([key,value])=>ACTIVITY_MODES.some(mode=>Array.from({length:9},(_,i)=>`${mode.id}:${i+2}`).includes(key))&&Number.isInteger(value)&&value>=2&&value<=10)):{};
const getSettings = () => ({...settings,challengeOffset:adjustments[activeRoute] || 0,practiceStep:practiceSteps[`${activeRoute}:${settings.age}`]});
const parentControls=createParentControls({onKidSafeReady:()=>guidedAccess.openAfterSetup(),onNotice:notice,onChange:(next,previous)=>{stopCoachSpeech();if(next.kidSafe&&!previous.kidSafe){cancelParentAction();document.querySelector('.draw-export-dialog')?.close();}if(next.hints!==previous.hints){activeController()?.clearHints?.();$('coach-dialog').close();}guidedAccess.refresh();renderCoach();},onRelock:()=>{if(parentControls.preferences.hints!=='on')activeController()?.clearHints?.();}});
setExternalActionGuard(()=>{
  if(!parentControls.preferences.kidSafe)return true;
  notice('Kid-safe play keeps sharing and websites closed. A grown-up can turn it off in Grown-ups with the PIN.');
  return false;
});
const setupCard=$('kid-safe-onboarding');
setupCard.hidden=readStore('kid-safe-setup-v1',false)===true||Boolean(parentControls.preferences.credential);
function finishKidSafeSetup() {
  if(!writeStore('kid-safe-setup-v1',true)){
    $('kid-safe-setup-status').textContent='This choice could not be saved. You can keep playing; setup may appear next time.';
    return;
  }
  setupCard.hidden=true;
}
$('kid-safe-skip').addEventListener('click',finishKidSafeSetup);
$('kid-safe-setup').addEventListener('click',async()=>{
  $('kid-safe-setup').disabled=true;
  try {if(await parentControls.setKidSafe(true)){parentControls.closeSettings();finishKidSafeSetup();}}
  finally {$('kid-safe-setup').disabled=false;}
});
const guidedAccess=createGuidedAccessGuide(parentControls);
let acceptedHash=location.hash||'#home',approvedHomeNavigation=null;
const clearHomeApproval=()=>{approvedHomeNavigation=null;};
window.addEventListener('pagehide',clearHomeApproval);
window.addEventListener('doodle-native-inactive',clearHomeApproval);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearHomeApproval();});
const getTitle = () => ['letters','numbers'].includes(location.hash.slice(1)) ? null : getFamily(activeRoute)?.title || null;
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
function familyCopy(activity,age) {
  const revised={};
  const copy=(id,description,skill)=>revised[id]={description,skill};
  if(filter==='create')copy('beat-studio','Make a beat, leave pauses, and play your pattern.','Music & creative composition');
  else if(age>=4)copy('beat-studio','Copy short and long gaps at your tempo.','Rhythm & relative timing');
  if(age>=5)copy('sound-match','Remember a sound’s place in a sequence.','Listening & sound order');
  if(age>=6) {
    copy('counting','Combine place-value units. Build an amount.','Place value & number structure');
    copy('ordering','Use measurements and order number steps.','Measurement & number order');
    copy('shape-match','Use shape clues and explore color changes.','Geometry & color relationships');
    copy('patterns','Find the missing picture in a pattern.','Pattern rules & prediction');
    copy('sorting','Sort by the rule on each round.','Classification & number rules');
    copy('memory','Remember cards and match their meanings.','Memory & relationships');
  }
  if(age>=7) {
    copy('letter-match',({7:'Connect words with rhyming sounds.',8:'Connect prefixes with their meanings.',9:'Connect suffixes with their meanings.',10:'Connect word roots with their meanings.'})[age],'Word sounds & meanings');
    copy('picture-sequence','Sequence events and spot the extra picture.','Causal order & relevance');
    copy('maze','Plan checkpoint paths and changed routes.','Route planning & transformations');
    copy('melody-echo','Remember melodies and action patterns.','Listening & sequence memory');
  }
  if(age>=8) {
    copy('draw','Plan a picture, palette, or visual story.','Art & visual communication');
    copy('trails','Practice longer labels, words, and numerals.','Handwriting & spacing');
    copy('word-build','Solve word clues and choose the letters.','Vocabulary & spelling');
    copy('number-stories','Combine numbers and find missing amounts.','Place value & missing operands');
    copy('compare','Compare place values and reason about amounts.','Number comparison');
    copy('shape-match','Investigate shape properties and color relations.','Geometry & color relationships');
    copy('odd-one-out','Find the value that breaks the number rule.','Number properties');
    copy('make-a-shape','Build shapes from their defining properties.','Geometric construction');
    copy('melody-echo','Remember melodies and transform action patterns.','Listening & transformations');
  }
  if(age>=9) {
    copy('counting',age===10?'Regroup decimal units. Build fraction amounts.':'Count fractional units. Build equivalent fractions.','Units & fractions');
    copy('sharing','Multiply groups and reason about fair shares.','Multiplication & division');
    copy('patterns','Find missing numbers using changing rules.','Arithmetic patterns');
    copy('compare',age===10?'Compare decimals, then find the difference.':'Compare numbers, then find the difference.','Comparison & difference');
    copy('ordering',age===10?'Compare perimeters and order decimals.':'Compare areas and order number steps.','Measurement & number order');
    copy('memory',age===10?'Remember and match equivalent fractions.':'Match multiplication expressions and products.','Memory & number relationships');
  }
  if(age===10) {
    copy('number-stories','Combine decimals and find missing amounts.','Decimal relationships');
    copy('sorting','Sort fractions by their value compared with half.','Fraction benchmarks');
    copy('odd-one-out','Find the fraction that breaks the value rule.','Fraction equivalence');
  }
  return revised[activity.id] || activity;
}
function renderCatalog() {
  const profile=getProfile(settings),tier=profile.tier;
  $('activity-filters').innerHTML=CATEGORIES.map(category=>`<button class="activity-filter" type="button" data-filter="${category.id}" aria-pressed="${filter===category.id}"><span aria-hidden="true">${({all:'✦',create:'✎',letters:'Aa',numbers:'123',discover:'◇',listen:'♪'})[category.id]}</span>${category.label}</button>`).join('');
  const homeOrder=settings.age<=4 ? ['draw','mirror-mosaic','shape-match','balance-lab','counting','measure-pour','memory','trails','ordering','sorting','sound-match','picture-sequence'] : settings.age<=7 ? ['draw','mirror-mosaic','balance-lab','measure-pour','word-build','patterns','sharing','beat-studio','maze'] : ['draw','mirror-mosaic','number-stories','balance-lab','patterns','measure-pour','memory','compare','maze','beat-studio'];
  const visible=ACTIVITIES.filter(activity=>filter==='all'||activity.category===filter||(filter==='create'&&activity.id==='beat-studio'));
  if(filter==='all'||filter==='create')visible.sort((a,b)=>Number(b.id==='draw')-Number(a.id==='draw'));
  if(filter==='all')visible.sort((a,b)=>(homeOrder.includes(a.id)?homeOrder.indexOf(a.id):99)-(homeOrder.includes(b.id)?homeOrder.indexOf(b.id):99));
  $('activity-count').textContent=`${visible.length} activities`;
  $('activity-guidance').textContent=tier==='little'?'Big targets, small steps. Explore words and number puzzles together.':tier==='explorer'?'Try a new idea. Create, explore, and learn at your own pace.':'Try number reasoning, word relationships, rule puzzles and memory challenges. Tracing remains here for handwriting practice.';
  const classes={create:'card-draw',letters:'card-letters',numbers:'card-numbers',discover:'card-color',listen:'card-listen'};
  $('activity-grid').innerHTML=visible.map(activity=>{const copy=familyCopy(activity,profile.challengeAge);return `<a class="activity-card ${classes[activity.category]}" id="card-${activity.id}" href="#${filter==='create'&&activity.id==='beat-studio'?'beat-maker':activity.id}" data-engine="${activity.engine}" data-family="${activity.id}"><div class="card-topline"><span class="skill-tag">${CATEGORIES.find(c=>c.id===activity.category).label}</span><span class="card-arrow" aria-hidden="true">↗</span></div><div class="card-picture" aria-hidden="true">${activityArt(activity.id,{age:settings.age})}</div><div class="card-bottom"><div><h3>${activity.title}</h3><p>${copy.description}</p></div></div><div class="card-footnote">${copy.skill}${activity.modes.length>1?`<span class="card-mode-count">${activity.modes.length} ways to play</span>`:''}</div></a>`;}).join('');
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
// Include responsive and safe-area padding in both observation and measurement.
new ResizeObserver(()=>document.documentElement.style.setProperty('--activity-nav-height',`${$('activity-navigation').getBoundingClientRect().height}px`)).observe($('activity-navigation'),{box:'border-box'});
new MutationObserver(()=>{if(document.querySelector('dialog[open]')){stopCoachSpeech();listening?.suspendAudio();adventures?.suspendAudio();studio?.suspendAudio();}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});

function renderSettings() {
  const profile = getProfile(settings);
  document.body.dataset.appearanceAge=String(settings.age);
  document.body.dataset.appearanceBand=appearanceBand(settings.age);
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
  $('parent-guidance').textContent = {
    little:'Explore marks, colors, shapes, and small groups together. Words and arithmetic are optional shared practice. A model, demonstration, or your voice can help.',
    explorer:'Connect letters with familiar words. Count objects together and ask how your child found an answer. Use Show me in tracing activities whenever it helps.',
    maker:'Explore number relationships, longer patterns, memory, and spelling. Invite your child to explain a strategy or tell a story about a drawing. Adjust support whenever needed.',
  }[profile.tier];
  renderCatalog();
  renderCoach();
}
function updateSettings(patch) {
  stopCoachSpeech();
  settings = normalizeSettings({...settings,...patch});
  writeStore('settings',settings);
  renderSettings();
  if('age' in patch || 'level' in patch) drawing?.settingsChanged();
  learning?.settingsChanged();
  discovery?.settingsChanged();
  challenges?.settingsChanged();
  adventures?.settingsChanged();
  listening?.settingsChanged();
  studio?.settingsChanged();
  if(parentControls.preferences.hints!=='on')activeController()?.clearHints?.();
  renderJourney();
}
function activeController() {
  return {drawing,learning,discovery,challenges,adventures,listening,studio}[getActivity(activeRoute)?.engine];
}
function renderCoach() {
  const activity=getActivity(activeRoute), profile=getProfile(getSettings());
  $('activity-coach-bar').hidden=!activity;
  $('activity-navigation').hidden=!activity;
  if(!activity) return;
  const tips=coachingFor(activeRoute,profile.challengeAge);
  $('coach-summary').textContent=`Age ${settings.age}${profile.challengeAge!==settings.age?` · practice step ${profile.challengeAge}`:''} · ${tips.together?'Play together': 'Your pace'}`;
  $('coach-title').textContent=getTitle() || activity.title;
  const foundations=['prewriting','uppercase','lowercase','word-tracing','number-tracing'];
  $('coach-together').textContent=tips.together?'Try this together. A grown-up can read the clues and model the first step.':settings.age>=9&&foundations.includes(activeRoute)?'This is foundation practice at any age. For a bigger thinking challenge, try Number stories, Pattern parade, or Memory garden.':'Take your time. Use a hint whenever it helps.';
  for(const key of ['start','strategy','reflect','offline']) $(`coach-${key}`).textContent=tips[key];
  const offset=profile.challengeAge-settings.age;
  $('coach-level').textContent=`Starting age ${settings.age} · practice step ${profile.challengeAge}${offset?' · adjusted for this game':''}`;
  $('coach-easier').disabled=profile.challengeAge<=2;
  $('coach-harder').disabled=profile.challengeAge>=10;
  $('coach-reset').hidden=!offset;
  $('coach-hear').disabled=!canSpeak();
  if(!coachSpeaking)$('coach-hear').textContent='Hear these tips';
  const hintsOff=parentControls.preferences.hints==='off';
  $('coach-hint').hidden=hintsOff||(!activeController()?.hint&&!['drawing','learning'].includes(activity.engine));
  for(const id of ['coach-strategy','coach-reflect','coach-offline'])$(id).parentElement.closest('.coach-tip,.parent-note').hidden=hintsOff;
  $('coach-hear').hidden=hintsOff;
  if(hintsOff)$('coach-together').textContent='Hints are turned off. The instructions are here whenever you need them.';
}
function changeChallenge(step) {
  stopCoachSpeech();
  const key=`${activeRoute}:${settings.age}`;
  if(step===null){delete practiceSteps[key];delete adjustments[activeRoute];writeStore('activity-support-v1',adjustments);}
  else practiceSteps[key]=Math.max(2,Math.min(10,step));
  writeStore('practice-steps-v1',practiceSteps);
  parentControls.relock();activeController()?.settingsChanged();if(parentControls.preferences.hints!=='on')activeController()?.clearHints?.();renderCoach();renderJourney();
}
function renderJourney() {
  const current=getCurrentRound(),visible=current?.scored&&activeRoute!=='home'&&getActivity(activeRoute)?.engine!=='drawing';
  $('journey-open').hidden=!visible;
  if(!visible){$('journey-dialog').close();return;}
  const progress=getModeProgress(current.mode,current.age,current.step),medal=progress.bestMedal;
  $('journey-open').textContent=medal?`${medal[0].toUpperCase()+medal.slice(1)} · My progress`:`My progress · ${progress.completed}/${progress.required}`;
  $('journey-title').textContent=getTitle()||getActivity(current.mode)?.title||'Your learning journey';
  $('journey-level').textContent=`Starting age ${current.age} · practice step ${current.step}. Each set has ${progress.required} rounds.`;
  $('journey-medal').textContent=({gold:'★',silver:'★',bronze:'★'})[medal]||'◇';$('journey-medal').dataset.medal=medal||'none';
  $('journey-result').textContent=medal?`Best medal: ${medal[0].toUpperCase()+medal.slice(1)}`:'A little practice, one round at a time.';
  $('journey-count').textContent=progress.completed===progress.required?`Set complete: ${progress.result?.medal||'well done'}. Your next round starts a fresh set.`:`${progress.completed} of ${progress.required} rounds complete. You can leave and return at any time.`;
  const fresh=activeController()?.canStartPracticeSet?.()===true;
  $('journey-fresh').hidden=!fresh;
  if(fresh)$('journey-count').textContent=`Set complete: ${progress.result?.medal||'well done'}. Start a fresh set to practice these items again.`;
  $('journey-next').hidden=!progress.nextStep;$('journey-next').dataset.step=String(progress.nextStep||'');
}
function goHome() { location.hash='home'; }
function route() {
  const requested=location.hash.slice(1)||'home';
  const activity=getActivity(requested,settings.age);
  const next=activity?.id||'home';
  const approved=approvedHomeNavigation?.from===activeRoute&&location.hash==='#home';approvedHomeNavigation=null;
  if(parentControls.preferences.kidSafe&&activeRoute!=='home'&&next==='home'&&!approved){
    // Undo the URL change before prompting: no controller is closed, no draft is
    // reloaded, and replaceState does not trigger a second hashchange/relock.
    history.replaceState(null,'',acceptedHash);
    parentControls.requestExit(()=>{approvedHomeNavigation={from:activeRoute};location.hash='home';});
    return;
  }
  acceptedHash=location.hash||'#home';
  const nav = ++navigationId;
  clearTimeout(noticeTimer);
  $('app-notice').hidden = true;
  $('app-notice').textContent = '';
  const previous=activeRoute;
  stopCoachSpeech();
  $('coach-dialog').close();$('journey-dialog').close();parentControls.relock();
  drawing?.close(); learning?.close(); discovery?.close(); challenges?.close(); adventures?.close(); listening?.close(); studio?.close();
  activeRoute=next;
  if(!activity||activity.engine==='drawing')beginRound({mode:next,age:settings.age,step:settings.age,scored:false});
  home.hidden=next!=='home';
  for(const view of [drawView,learnView,discoveryView,challengesView,adventuresView,listeningView,studioView]) view.hidden=true;
  document.body.dataset.activity=next;
  document.body.dataset.family=getFamily(next)?.id || '';
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
    if(activity?.engine==='studio'){studio ||= createStudioPlay(studioView,{getSettings,getTitle,onBack:goHome,onNotice:notice,onProgress:renderProgress});studioView.hidden=false;studio.open(next);}
    if(parentControls.preferences.hints!=='on')activeController()?.clearHints?.();
    renderModeBar();renderCoach();renderJourney();
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
    for(const view of [drawView,learnView,discoveryView,challengesView,adventuresView,listeningView,studioView]) view.hidden=true;
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

document.querySelectorAll('.age-option').forEach(button=>button.addEventListener('click',()=>parentControls.settingsAction(()=>updateSettings({age:Number(button.dataset.age),level:'auto'}))));
$('grownups-open').addEventListener('click',()=>parentControls.settingsAction(()=>{renderSettings();settingsDialog.showModal();},{opening:true}));
settingsDialog.addEventListener('close',()=>parentControls.closeSettings());
$('settings-done').addEventListener('click',() => settingsDialog.close());
settingsDialog.addEventListener('click',e => {if(e.target===settingsDialog){const r=settingsDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settingsDialog.close();}});
$('age-minus').addEventListener('click',()=>parentControls.settingsAction(()=>updateSettings({age:settings.age-1})));
$('age-plus').addEventListener('click',()=>parentControls.settingsAction(()=>updateSettings({age:settings.age+1})));
$('support-level').addEventListener('change',e=>{const level=e.target.value;renderSettings();parentControls.settingsAction(()=>updateSettings({level}));});
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
$('coach-open').addEventListener('click',()=>{const open=()=>{listening?.suspendAudio();studio?.suspendAudio();renderCoach();prepareSpeech(coachingText(activeRoute,getProfile(getSettings()).challengeAge));$('coach-dialog').showModal();};if(parentControls.preferences.hints==='off')open();else parentControls.requestHint(open);});
for(const id of ['coach-close','coach-done']) $(id).addEventListener('click',()=>{$('coach-dialog').close();stopSpeaking();});
$('coach-easier').addEventListener('click',()=>parentControls.settingsAction(()=>changeChallenge(getProfile(getSettings()).challengeAge-1)));
$('coach-harder').addEventListener('click',()=>parentControls.settingsAction(()=>changeChallenge(getProfile(getSettings()).challengeAge+1)));
$('coach-reset').addEventListener('click',()=>parentControls.settingsAction(()=>changeChallenge(null)));
function stopCoachSpeech(message='') {
  coachSpeechToken++;coachSpeaking=false;stopSpeaking();
  $('coach-hear').textContent='Hear these tips';$('coach-speech-status').textContent=message;
}
$('coach-dialog').addEventListener('close',()=>stopCoachSpeech());
$('coach-hear').addEventListener('click',()=>{
  if(coachSpeaking){stopCoachSpeech('Spoken help stopped.');return;}
  listening?.suspendAudio();adventures?.suspendAudio();
  const token=++coachSpeechToken;coachSpeaking=true;
  $('coach-hear').textContent='Stop spoken help';$('coach-speech-status').textContent='Preparing spoken help…';
  requestSpeech(coachingText(activeRoute,getProfile(getSettings()).challengeAge),{onStart:()=>{if(token===coachSpeechToken)$('coach-speech-status').textContent='Playing spoken help…';}}).then(result=>{
    if(token!==coachSpeechToken)return;
    coachSpeaking=false;$('coach-hear').textContent='Hear these tips';
    $('coach-speech-status').textContent=result.status==='played'&&result.source==='clip'?'Spoken help finished.':result.status==='requested'?'Spoken help requested.':result.status==='cancelled'?'Spoken help stopped.':'Spoken help could not play. Try Hear again.';
  });
});
$('coach-hint').addEventListener('click',()=>{
  $('coach-dialog').close();
  const controller=activeController();
  if(controller?.hint)controller.hint();
  else if(getActivity(activeRoute)?.engine==='learning') learnView.querySelector('.learn-demo, .learn-hint')?.click();
  else notice(coachingFor(activeRoute,getProfile(getSettings()).challengeAge).strategy);
});
window.addEventListener('pagehide',()=>{studio?.close();stopSpeaking();drawing?.close();learning?.close();discovery?.close();challenges?.close();adventures?.close();listening?.close();});
window.addEventListener('pageshow',event=>{if(event.persisted)route();});
subscribeProgress(()=>renderJourney());
$('journey-open').addEventListener('click',()=>{renderJourney();$('journey-dialog').showModal();});
for(const id of ['journey-close','journey-done'])$(id).addEventListener('click',()=>$('journey-dialog').close());
$('journey-fresh').addEventListener('click',()=>{const controller=activeController();if(!controller?.canStartPracticeSet?.())return;$('journey-dialog').close();parentControls.relock();controller.startPracticeSet();renderJourney();});
$('journey-next').addEventListener('click',()=>parentControls.settingsAction(()=>{const step=Number($('journey-next').dataset.step);$('journey-dialog').close();if(step>=2&&step<=10)changeChallenge(step);}));
renderSettings();renderProgress();route();
// The built app includes every activity. This worker also keeps reloads available offline.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Offline copy unavailable:',error.message)));
}
