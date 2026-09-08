// TEST ONLY. esbuild bundles this into the isolated XCTest host, never the app.
// Expected trace geometry/question data come from source modules; actions target
// the independently packaged index.html and assertions inspect rendered results.
import {ACTIVITIES} from '../../../catalog.js';
import {getLearningItems} from '../../../learning-data.js';
import {getProfile} from '../../../core.js';
import {generateChallenge} from '../../../challenges.js';
import discoveryAdventures from './native-discovery-adventures.js';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const visible = node => Boolean(node && node.getClientRects().length && !node.closest('[hidden]'));
const complete = selector => document.querySelector(selector)?.classList.contains('is-complete');

function context(id, age) {
  const steps = [];
  let assertions = 0;
  const qa = {
    id, age, steps,
    assert(value, message) { assertions++; if (!value) throw new Error(`[age ${age} / ${id}] ${message}`); },
    check(label) { steps.push(label); },
    el(selector, scope=document) { const node=scope.querySelector(selector); qa.assert(node, `Missing ${selector}`); return node; },
    all(selector, scope=document) { return [...scope.querySelectorAll(selector)]; },
    text(selector) { return qa.el(selector).textContent.trim(); },
    click(target) {
      const node=typeof target==='string'?qa.el(target):target;
      qa.assert(node && visible(node), `Control is hidden or absent: ${typeof target==='string'?target:node?.outerHTML?.slice(0,160)}`);
      qa.assert(!node.disabled, `Control is disabled: ${node.getAttribute('aria-label')||node.textContent}`);
      const modal=[...document.querySelectorAll('dialog[open]')].at(-1);
      qa.assert(!modal||modal.contains(node),'Actions must stay inside the open modal');
      node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
      node.click();
    },
    button(label, scope=document) {
      const node=qa.all('button',scope).find(button=>visible(button)&&(button.textContent.trim()===label||button.getAttribute('aria-label')===label));
      qa.assert(node, `Missing button: ${label}`); return node;
    },
    async waitFor(predicate, label, timeout=4000) {
      const end=performance.now()+timeout;
      while(performance.now()<end) { if(predicate()) return; await pause(20); }
      qa.assert(false, `Timed out: ${label}`);
    },
    get assertions() { return assertions; },
  };
  return qa;
}

// Synthetic events have no browser-owned active pointer, so capture would throw.
// Scope the adapter to this board and test pointer ID, restore it immediately,
// and let all production drawing/tracing event handlers and validators execute.
// Actual touch, capture and rotation are covered separately by XCUITest.
function pointerPath(qa, board, points, {cancel=false}={}) {
  qa.assert(points.length>0, 'Pointer path must have points');
  board.scrollIntoView({block:'center',behavior:'instant'});
  const rect=board.getBoundingClientRect();
  qa.assert(rect.width>40 && rect.height>40, 'Drawing board must have real layout');
  const syntheticID=90210;
  const originals = new Map();
  const captured = new Set();
  for(const name of ['setPointerCapture','hasPointerCapture','releasePointerCapture']) {
    originals.set(name,Object.getOwnPropertyDescriptor(board,name));
    const browserMethod=board[name]?.bind(board);
    board[name]=pointerID=>{
      if(pointerID!==syntheticID) return browserMethod?.(pointerID);
      if(name==='setPointerCapture')captured.add(pointerID);
      if(name==='releasePointerCapture')captured.delete(pointerID);
      if(name==='hasPointerCapture')return captured.has(pointerID);
    };
  }
  const side=Math.min(rect.width,rect.height);
  const project=([x,y])=>board instanceof SVGElement
    ? [rect.left+(rect.width-side)/2+x*side,rect.top+(rect.height-side)/2+y*side]
    : [rect.left+x*rect.width,rect.top+y*rect.height];
  const dispatch=(type,point)=>{
    const [clientX,clientY]=project(point);
    board.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:syntheticID,pointerType:'touch',isPrimary:true,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX,clientY,pressure:.5}));
  };
  try {
    dispatch('pointerdown',points[0]);
    for(let i=1;i<points.length;i++)dispatch('pointermove',points[i]);
    dispatch(cancel?'pointercancel':'pointerup',points.at(-1));
  } finally {
    for(const [name,descriptor]of originals) {
      if(descriptor)Object.defineProperty(board,name,descriptor);else delete board[name];
    }
  }
}

async function trace(qa) {
  const [set,ch]=({prewriting:['shapes','line'],uppercase:['upper','A'],lowercase:['lower','g'],'word-tracing':['words','cat'],'number-tracing':['nums','0']})[qa.id];
  qa.assert(qa.el(`[data-learn-set="${set}"]`).getAttribute('aria-pressed')==='true','Catalog route selects the requested trace set');
  qa.click(`[data-learn-item="${ch}"]`);
  qa.click(qa.button('Check tracing'));
  qa.assert(!complete('.learn-feedback'),'An empty tracing must not complete');
  const board=qa.el('[data-testid="trace-board"]');
  pointerPath(qa,board,[[.02,.02]]);
  qa.click(qa.button('Check tracing'));
  qa.assert(!complete('.learn-feedback'),'An unrelated tap must not complete tracing');
  qa.check('empty and off-guide marks rejected');
  qa.click(qa.button('↺ Start again'));
  qa.click(qa.button('▶ Show me'));
  await qa.waitFor(()=>qa.all('.learn-demo-layer path').length>0,'animated tracing guide');
  qa.click(qa.button('■ Stop guide'));
  qa.assert(qa.all('.learn-demo-layer path').length===0,'Stopped guide leaves no stale demonstration');
  const item=getLearningItems(set).find(item=>item.ch===ch);
  pointerPath(qa,board,item.strokes[0].slice(0,Math.max(1,Math.floor(item.strokes[0].length/2))),{cancel:true});
  qa.assert(qa.all('.learn-ink-layer path').length===0,'Cancelled tracing gesture must not count as practice');
  qa.check('guide and cancelled-stroke recovery');
  for(const path of item.strokes)pointerPath(qa,board,path);
  if(!qa.button('Check tracing').disabled)qa.click(qa.button('Check tracing'));
  qa.assert(complete('.learn-feedback'),'Accurate full guide must complete');
  qa.assert(qa.el(`[data-learn-item="${ch}"]`).classList.contains('is-practiced'),'Completed item is visibly marked practiced');
  qa.check('real tracing validator accepts complete guide');
  const before=qa.text('.learn-item-title');
  const next=qa.button('Next →');
  qa.assert(!next.disabled,'Another tracing item is available');
  qa.click(next);
  qa.assert(qa.text('.learn-item-title')!==before,'Next selects a different item');
  qa.assert(!complete('.learn-feedback') && qa.all('.learn-ink-layer path').length===0,'Next starts with fresh uncompleted ink');
  qa.click(`[data-learn-item="${ch}"]`);
  qa.assert(qa.text('.learn-feedback').includes('You practiced'),'Returning to the item retains visible practice credit');
  qa.check('next item and retained practice credit');
}

async function quantity(qa) {
  const mode=({counting:'Count dots',addition:'Add together','equal-groups':'Equal groups'})[qa.id];
  qa.assert(qa.button(mode).getAttribute('aria-pressed')==='true','Correct number mode selected');
  const answer=Number(qa.el('[data-testid="quantity-frame"]').dataset.quantity);
  qa.assert(qa.all('.learn-count-dot').length===answer,'Answer quantity equals actual visible dot count');
  if(qa.id==='equal-groups') {
    const sizes=qa.all('.learn-equal-group').map(group=>group.querySelectorAll('.learn-count-dot').length);
    qa.assert(sizes.length>0&&sizes.every(size=>size===sizes[0]),'Each equal group contains the same amount');
    const prompt=qa.text('.learn-count-prompt').match(/^(\d+) groups of (\d+)\. How many\?$/);
    qa.assert(prompt&&Number(prompt[1])===sizes.length&&Number(prompt[2])===sizes[0],'Printed group counts match the actual groups and their contents');
    qa.assert(Number(prompt[1])*Number(prompt[2])===answer,'Printed equal-group question yields the accepted total');
  } else if(qa.id==='addition') {
    const prompt=qa.text('.learn-count-prompt');
    qa.assert(/^\d+(?: \+ \d+){1,2} = \?$/.test(prompt),'Addition has a readable numeric question');
    const operands=prompt.replace(' = ?','').split(' + ').map(Number);
    const frames=qa.all('.learn-dot-frame').map(frame=>frame.querySelectorAll('.learn-count-dot').length);
    qa.assert(operands.join(',')===frames.join(','),'Every printed addition operand matches its own dot frame');
    qa.assert(operands.reduce((total,value)=>total+value,0)===answer,'Printed addition question yields the accepted total');
  }
  const wrong=qa.all('.learn-answer').find(button=>Number(button.textContent)!==answer);
  qa.click(wrong);
  qa.assert(!complete('.learn-feedback')&&qa.text('.learn-feedback').includes('try another number'),'Wrong quantity gives recoverable feedback');
  if(answer>0) {
    qa.click(qa.all('.learn-count-dot')[answer-1]);
    qa.assert(qa.all('.learn-count-dot')[answer-1].textContent==='1','First tapped dot receives ordinal one');
  }
  qa.click('.learn-count-coach');
  qa.assert(qa.all('.learn-count-dot.is-counted').length===answer,'Counting hint covers every dot');
  qa.check('wrong answer, one-to-one counting and visual hint');
  qa.click(qa.all('.learn-answer').find(button=>Number(button.textContent)===answer));
  qa.assert(complete('.learn-feedback'),'Correct quantity completes puzzle');
  qa.assert(qa.all('.learn-answer').every(button=>button.disabled),'A completed puzzle cannot be answered twice');
  qa.click('.learn-next-puzzle');
  qa.assert(!complete('.learn-feedback'),'Next puzzle resets completion');
  qa.assert(qa.all('.learn-count-dot.is-counted').length===0,'Next puzzle has fresh counting marks');
  qa.check('completion, duplicate protection and next puzzle');
}

async function challenge(qa) {
  const q=generateChallenge(qa.id,getProfile({age:qa.age}),0);
  const feedback=()=>complete('.challenge-feedback');
  const wrongNumeric=()=>qa.click(`[data-answer="${q.choices.find(value=>value!==q.answer)}"]`);
  if(qa.id==='compare') {
    const groups=qa.all('.challenge-quantity');
    qa.assert(groups[0].querySelectorAll('.challenge-dot').length===q.left&&groups[1].querySelectorAll('.challenge-dot').length===q.right,'Comparison quantities match their visible dots');
    qa.click(`[data-answer="${q.answer==='same'?'left':'same'}"]`);
    qa.assert(!feedback()&&!qa.el('.challenge-comparison-model').hidden,'Wrong comparison reveals a pairing model without credit');
    qa.click('.challenge-hint-button');
    qa.click(`[data-answer="${q.answer}"]`);
    if(q.followup) {
      qa.assert(!feedback(),'Difference follow-up is required before credit');
      qa.click(`[data-follow-answer="${q.followup.choices.find(value=>value!==q.followup.answer)}"]`);
      qa.assert(!feedback(),'Wrong difference cannot complete');
      qa.click(`[data-follow-answer="${q.followup.answer}"]`);
    }
  } else if(qa.id==='number-order') {
    qa.click(`[data-tile="${q.sequence.at(-1)}"]`);
    qa.assert(qa.all('.challenge-slot.is-filled').length===0,'Out-of-order tile does not fill a slot');
    qa.click('.challenge-hint-button');
    qa.assert(qa.el(`[data-tile="${q.sequence[0]}"]`).classList.contains('is-suggested'),'Hint identifies first legal number');
    for(const number of q.sequence)qa.click(`[data-tile="${number}"]`);
    qa.assert(qa.all('.challenge-slot.is-filled').map(slot=>Number(slot.textContent)).join(',')===q.sequence.join(','),'Rendered sequence follows the requested order');
  } else if(qa.id==='subtraction'||qa.id==='number-bonds') {
    if(qa.id==='subtraction')qa.assert(qa.all('.challenge-dot.is-crossed').length===q.removed,'Crossed-out objects show the removed quantity');
    wrongNumeric();qa.assert(!feedback(),'Wrong numeric answer does not complete');
    if(qa.id==='number-bonds') {
      qa.assert(!qa.el('.challenge-bond-support').hidden,'Wrong missing part reveals the picture');
      qa.assert(qa.all('.challenge-bond-support .challenge-dot.is-empty').length===q.answer,'Empty dots represent the actual missing part');
    } else qa.click('.challenge-hint-button');
    qa.click(`[data-answer="${q.answer}"]`);
  } else if(qa.id==='ten-frame') {
    qa.assert(qa.all('[data-cell]').length===q.size,'Frame capacity matches the age configuration');
    qa.click(qa.button('Check my frame'));qa.assert(!feedback(),'Empty frame is not a correct nonzero target');
    qa.click('[data-cell="0"]');qa.click('[data-cell="0"]');
    qa.assert(qa.el('[data-cell="0"]').getAttribute('aria-pressed')==='false','A dot can be removed by tapping it again');
    qa.click('.challenge-hint-button');
    for(let i=0;i<q.target;i++)qa.click(`[data-cell="${i}"]`);
    qa.click(qa.button('Check my frame'));
    qa.assert(qa.all('[data-cell][aria-pressed="true"]').length===q.target,'Exact filled amount is visible');
  } else if(qa.id==='letter-match') {
    if(q.pairs.length>1) {
      qa.click(`[data-letter="${q.pairs[0].toUpperCase()}"]`);qa.click(`[data-letter="${q.pairs[1]}"]`);
      qa.assert(qa.all('.challenge-letter.is-matched').length===0,'Different letters do not match');
    }
    qa.click('.challenge-hint-button');
    qa.assert(qa.all('.challenge-partner-model').every(visible),'All partner models become available');
    for(const letter of q.pairs) { qa.click(`[data-letter="${letter.toUpperCase()}"]`);qa.click(`[data-letter="${letter}"]`); }
    qa.assert(qa.all('.challenge-letter.is-matched').length===q.pairs.length*2,'Every letter pair is matched');
  } else if(qa.id==='word-build') {
    qa.assert(visible(qa.el('.challenge-word-model'))===(qa.age<=4),'Youngest children receive a visible word model');
    const wrong=q.tiles.find(tile=>tile.letter!==q.word[0]);
    qa.click(`[data-tile="${wrong.index}"]`);
    qa.assert(visible(qa.el('.challenge-word-model'))&&!feedback(),'Wrong first letter reveals the word model without credit');
    qa.click(qa.button('Show next letter'));
    for(const letter of q.word)qa.click(qa.all(`[data-character="${letter}"]`).find(button=>!button.disabled));
    qa.assert(qa.all('.challenge-slot.is-filled').map(slot=>slot.textContent.toLowerCase()).join('')===q.word,'Every displayed spelling slot is correct, including repeated letters');
  }
  qa.check('incorrect attempt and contextual support');
  qa.assert(feedback(),'Correct full solution completes the challenge');
  qa.assert(qa.all('[data-answer],[data-follow-answer],[data-tile],[data-cell],[data-letter]').every(node=>node.disabled),'Completed actions are disabled against duplicate credit');
  qa.click('.challenge-new');
  qa.assert(!feedback()&&qa.text('.challenge-round')==='ROUND 2','Next round starts fresh');
  qa.check('complete solution, duplicate protection and next round');
}

async function creative(qa) {
  const canvas=qa.el('.draw-canvas');
  const canvasReady=()=>{
    const size=Math.min(2400,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,3)));
    return size>100&&canvas.width===size&&canvas.height===size&&!qa.el('.draw-new').disabled;
  };
  await qa.waitFor(canvasReady,'creative canvas backing size matches its actual layout');
  // Coloring opens a chooser. Choose a real age-independent page through its UI.
  if(qa.id==='coloring') {
    if(!qa.el('.draw-template-dialog').open)qa.click('.draw-templates');
    qa.assert(qa.all('.draw-template-card').length===9,'All nine coloring pages are offered');
    qa.click('button.draw-template-card[aria-label^="Color Sunshine"]');
    if(qa.el('.draw-confirm-dialog').open)qa.click('[data-replace]');
    qa.assert(qa.text('.draw-paper-name').includes('Sunshine'),'Selected coloring page is shown');
    qa.check('coloring page chooser and rendered outline');
  }
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  await qa.waitFor(canvasReady,'stable canvas after page selection');
  const draftKey='doodle-fun:v2:drawing-draft-v2';
  const startingDraft=JSON.parse(localStorage.getItem(draftKey)||'null')?.png;
  const snapshot=()=>canvas.toDataURL('image/png');
  const before=snapshot();
  if(qa.id==='coloring') {
    qa.click('button.draw-tool[data-tool="fill"]');
    qa.assert(qa.el('button.draw-tool[data-tool="fill"]').getAttribute('aria-pressed')==='true','Fill becomes the selected drawing tool');
    pointerPath(qa,canvas,[[.04,.04]]);
  } else {
    qa.click('button.draw-tool[data-tool="pen"]');
    qa.assert(qa.el('button.draw-tool[data-tool="pen"]').getAttribute('aria-pressed')==='true','Pen becomes the selected drawing tool');
    pointerPath(qa,canvas,Array.from({length:18},(_,i)=>[.2+i*.025,.3+i*.019]));
  }
  const after=snapshot();
  qa.assert(after!==before,'Real canvas pixels change after creative input');
  qa.click('.draw-undo');qa.assert(snapshot()===before,'Undo restores previous canvas pixels');
  qa.click('.draw-redo');qa.assert(snapshot()===after,'Redo restores the creative input');
  qa.check('canvas input, exact undo and redo');
  qa.click('.draw-new');qa.assert(qa.el('.draw-confirm-dialog').open,'New picture asks before replacing work');
  qa.click('[data-keep]');qa.assert(snapshot()===after,'Keep drawing preserves the picture');
  qa.click('.draw-new');qa.click('[data-replace]');
  qa.assert(snapshot()!==after,'Confirmed new picture creates a fresh canvas');
  qa.click('.draw-undo');qa.assert(snapshot()===after,'Undo can recover a replaced picture');
  qa.check('new-picture cancellation, replacement and recovery');
  await qa.waitFor(()=>{
    const png=JSON.parse(localStorage.getItem(draftKey)||'null')?.png;
    return png&&png!==startingDraft&&qa.text('.draw-draft-status').includes('saved');
  },'latest creative draft and visible saved status',5000);
  const saved=JSON.parse(localStorage.getItem(draftKey));
  const restored=new Image();let decoded=false,decodeError=false;
  restored.onload=()=>{decoded=true;};restored.onerror=()=>{decodeError=true;};restored.src=saved.png;
  await qa.waitFor(()=>decoded||decodeError,'decode actual persisted PNG');
  qa.assert(decoded&&!decodeError,'Saved draft contains a decodable image');
  const comparison=document.createElement('canvas');comparison.width=canvas.width;comparison.height=canvas.height;
  const rendered=comparison.getContext('2d');rendered.fillStyle='#fff';rendered.fillRect(0,0,comparison.width,comparison.height);
  rendered.drawImage(restored,0,0,comparison.width,comparison.height);
  qa.assert(comparison.toDataURL('image/png')===snapshot(),'Persisted draft pixels match the final recovered picture');
  qa.assert(qa.text('.draw-draft-status').includes('saved'),'Saved draft is communicated visibly');
  qa.check('local draft saved');
}

const handlers={...discoveryAdventures,draw:creative,coloring:creative};
for(const id of ['prewriting','uppercase','lowercase','word-tracing','number-tracing'])handlers[id]=trace;
for(const id of ['counting','addition','equal-groups'])handlers[id]=quantity;
for(const id of ['compare','number-order','subtraction','number-bonds','ten-frame','letter-match','word-build'])handlers[id]=challenge;

globalThis.__doodleNativeQA=async({id,age})=>{
  const qa=context(id,age);
  const begin=performance.now();
  const runtimeErrors=[];
  const recordError=event=>runtimeErrors.push(String(event.message||event.reason||event.error||'Unknown script error'));
  addEventListener('error',recordError);addEventListener('unhandledrejection',recordError);
  try {
    qa.assert(ACTIVITIES.length===30 && ACTIVITIES.every(activity=>handlers[activity.id]),'All 30 activity handlers are packaged');
    const activity=ACTIVITIES.find(activity=>activity.id===id);
    qa.assert(activity&&age>=2&&age<=10,'Known activity and supported exact age');
    qa.assert(location.protocol==='file:','The activity must run from the native offline bundle');
    qa.assert(Boolean(window.webkit?.messageHandlers?.doodleNative),'Actual native bridge must be present');
    qa.assert(qa.el(`[data-age="${age}"]`).getAttribute('aria-pressed')==='true','Requested exact age is selected after settings reload');
    qa.click(`#card-${id}`);
    await qa.waitFor(()=>location.hash===`#${id}`&&visible(document.querySelector('#coach-open')),'native activity route');
    const heading=activity.engine==='learning'?(activity.kind==='numbers'?'Number explorers':'Letter adventures'):activity.title;
    qa.assert(qa.all('h1').some(node=>visible(node)&&node.textContent.trim()===heading),'Expected user-visible activity heading is rendered');
    if(id==='coloring') {
      qa.assert(qa.el('.draw-template-dialog').open,'Coloring opens its page chooser');
      qa.click(qa.button('Close coloring pages'));
    }
    qa.click('#coach-open');
    qa.assert(qa.el('#coach-dialog').open&&qa.text('#coach-start').length>0,'Coach has an actual starting instruction');
    qa.click('#coach-close');
    qa.check('exact age, activity launch and coaching');
    await handlers[id](qa);
    qa.assert(document.documentElement.scrollWidth<=innerWidth+1,'Activity does not create horizontal page overflow');
    const back=qa.all('button').find(button=>visible(button)&&['Back to activities','Back to home'].includes(button.getAttribute('aria-label')));
    qa.click(back);
    await qa.waitFor(()=>visible(document.querySelector(`#card-${id}`))&&!visible(document.querySelector('#coach-open')),'return to activity catalog');
    qa.check('return navigation');
    qa.assert(runtimeErrors.length===0,`No uncaught browser errors: ${runtimeErrors.join('; ')}`);
    return {id,age,status:'passed',assertions:qa.assertions,steps:qa.steps,elapsedMs:Math.round(performance.now()-begin),interaction:'Native WKWebView DOM actions; drawing/tracing use synthetic pointers with scoped capture adapter. Trusted simulator finger gestures are tested separately.'};
  } catch(error) {
    return {id,age,status:'failed',assertions:qa.assertions,steps:qa.steps,error:String(error.message||error),stack:error.stack,runtimeErrors,route:location.hash,visibleText:document.body.innerText.slice(0,6000),elapsedMs:Math.round(performance.now()-begin)};
  } finally {removeEventListener('error',recordError);removeEventListener('unhandledrejection',recordError);}
};
