// TEST ONLY: real packaged studio controllers, driven through their visible DOM.
// Generated round data supplies expectations; it does not mutate production state.
import {buildStudioRound,mirrorSource,solveBalance,solvePour} from '../../../studio-play.js';

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const score=qa=>Object.values(JSON.parse(localStorage.getItem('doodle-fun:v2:medal-progress-v1')||'{"entries":{}}').entries).find(entry=>entry.mode===qa.id&&entry.age===qa.age&&entry.step===qa.age);
const completed=qa=>Object.values(score(qa)?.rounds||{}).filter(round=>round.done).length;

async function tactile(qa){
  const round=buildStudioRound(qa.id,qa.age,0),view=qa.el('#studio-view');
  const find=selector=>qa.el(selector,view),click=selector=>qa.click(find(selector));
  const success=()=>find('.studio-status').classList.contains('is-success');
  qa.assert(find('.studio-round').textContent.includes(`level ${qa.age}`),'The studio uses the selected exact-age starting step');
  click('.studio-check');qa.assert(!success(),'The incomplete starting puzzle cannot earn completion');
  qa.assert(find('.studio-status').classList.contains('is-retry'),'Check offers recoverable feedback');
  const unchanged=find('.studio-play').innerHTML;click('.studio-hint');
  qa.assert(find('.studio-status').classList.contains('is-hint'),'An explicit hint displays a strategy');
  qa.assert(find('.studio-play').innerHTML===unchanged,'Hints do not place tiles, move weights, or pour water');
  qa.check('explicit wrong check and requested non-solving hint');

  if(qa.id==='mirror-mosaic'){
    qa.assert(qa.all('.studio-mirror-cell',view).length===round.size*round.size,'Mirror grid size matches the age');
    qa.assert(qa.all('.studio-mirror-cell.is-source',view).length===round.sources.length,'Model tiles stay distinct from editable tiles');
    for(let color=1;color<=round.colors;color++){
      click(`.studio-palette [data-color="${color}"]`);
      for(let cell=0;cell<round.solution.length;cell++)if(!round.sources.includes(cell)&&round.solution[cell]===color)click(`button[data-cell="${cell}"]`);
    }
    qa.assert(qa.all('.studio-mirror-cell',view).every((tile,cell)=>Number(tile.dataset.color)===round.solution[cell]),'The visible tile colors form the actual reflection');
  }else if(qa.id==='balance-lab'){
    qa.assert(qa.all('.studio-block.is-fixed',view).length===round.fixed.length,'The starting weights stay on the left');
    if(round.mystery)qa.assert(find('.studio-evidence').textContent.includes(String(round.mystery)),'Unknown-weight evidence is available without an answer button');
    const solution=solveBalance(round);qa.assert(solution?.length>0,'The weight target and age-specific constraints have a legal solution');
    for(const weight of solution){click(`[data-weight="${weight}"]`);click('[data-pan="1"]');}
    const right=qa.all('[data-side="1"] .studio-block',view).reduce((sum,piece)=>sum+Number(piece.textContent),0);
    qa.assert(right===round.target,'The visible right weights equal the full left-side amount');
    qa.assert(find('.studio-balance-observation').textContent.includes('level'),'The balance visibly becomes level before Check');
  }else{
    qa.assert(qa.all('[data-jug]',view).length===round.capacities.length,'The correct number of measured jugs is available');
    const moves=solvePour(round);qa.assert(moves?.length>0,'The measured target is reachable through legal transfers');
    for(const [from,to]of moves){click(`[data-jug="${from}"]`);click(`[data-jug="${to}"]`);}
    qa.assert(find('.studio-caption').textContent.includes('Total water:'),'Conserved total water stays visible throughout pouring');
    qa.assert(qa.all('[data-jug][aria-pressed="true"]',view).length===0,'A completed transfer clears its source selection');
  }
  qa.assert(!success(),'Exploration alone does not mark a scored round complete');
  qa.check('age-appropriate tactile construction through visible controls');
  click('.studio-check');qa.assert(success(),'The constructed solution passes the real studio validator');
  qa.assert(find('.studio-check').disabled,'Completion disables duplicate checking');
  qa.assert(completed(qa)===1,'Exactly one scored round is recorded');
  const entry=score(qa),result=Object.values(entry.rounds).find(value=>value.done);
  qa.assert(result.mistake&&result.hint,'Completed history retains the earlier check mistake and requested hint');
  qa.check('real validation and honest completion history');

  click('.studio-reset');qa.assert(!success()&&!find('.studio-check').disabled,'Reset reopens the puzzle');
  click('.studio-undo');click('.studio-check');qa.assert(success(),'Undo restores the completed construction after reset');
  qa.assert(completed(qa)===1,'Rechecking restored work cannot duplicate medal credit');
  click('.studio-next');qa.assert(find('.studio-round').textContent.includes('Challenge 2'),'The next challenge has a fresh stable round key');
  qa.assert(!success()&&!find('.studio-check').disabled,'The new challenge starts unfinished');
  qa.check('reset, undo, replay protection, and next challenge');

  if(qa.id==='mirror-mosaic'){
    click('.studio-free');qa.assert(find('.studio-check').hidden,'Free mirror creation has no correctness check');
    const nextRound=buildStudioRound(qa.id,qa.age,1),cell=1,source=mirrorSource(nextRound.size,nextRound.axis,cell);
    const expected=nextRound.solution.filter((_,index)=>mirrorSource(nextRound.size,nextRound.axis,index)===source).length;
    click(`button[data-cell="${cell}"]`);const copies=qa.all('.studio-mirror-cell[data-color="1"]',view).length;
    qa.assert(copies===expected,'Free creation places the correct reflection orbit for this age and axis');
    click('.studio-undo');qa.assert(qa.all('.studio-mirror-cell[data-color="1"]',view).length===0,'Free mirror work is reversible');
    qa.assert(completed(qa)===1,'Open creation never adds a scored completion');
    click('.studio-free');qa.check('ungraded symmetric creation and recovery');
  }
  const undersized=qa.all('button',view).map(button=>button.getBoundingClientRect()).filter(rect=>rect.width>0&&(rect.width<47.5||rect.height<47.5));
  qa.assert(undersized.length===0,'Every visible studio action retains a 48-point touch target');
}

async function beatMaker(qa){
  const round=buildStudioRound(qa.id,qa.age),view=qa.el('#studio-view'),contexts=[];
  const find=selector=>qa.el(selector,view),click=selector=>qa.click(find(selector));
  const originalAudio=globalThis.AudioContext,originalWebkitAudio=globalThis.webkitAudioContext,Native=originalAudio||originalWebkitAudio;
  qa.assert(Boolean(Native),'WKWebView provides its real Web Audio implementation');
  function ObservedAudio(...args){const audio=new Native(...args);contexts.push(audio);return audio;}
  ObservedAudio.prototype=Native.prototype;Object.setPrototypeOf(ObservedAudio,Native);
  globalThis.AudioContext=ObservedAudio;if(originalWebkitAudio)globalThis.webkitAudioContext=ObservedAudio;
  const storageKey=`doodle-fun:v2:beat-maker-pattern-v1:${qa.age}`;
  const saved=()=>JSON.parse(localStorage.getItem(storageKey)||'null');
  try{
    qa.assert(find('.studio-check').hidden&&find('.studio-next').hidden,'The beat composer is ungraded');
    qa.assert(qa.all('.studio-track',view).length===round.tracks,'Age selects the intended instrument-track count');
    qa.assert(find('.studio-playhead').textContent.includes(`${round.steps} steps`),'Age selects the intended full pattern length');
    click('[data-track="0"][data-beat-step="0"]');
    if(round.steps>4)qa.click(qa.button(`Show steps ${round.steps-3} to ${round.steps}`,view));
    click(`[data-track="${round.tracks-1}"][data-beat-step="${round.steps-1}"]`);
    qa.assert(saved().notes[0][0]&&saved().notes[round.tracks-1][round.steps-1],'Both the first and final pattern positions persist locally');
    qa.assert(contexts.length===0,'Editing a rhythm creates no sound context');
    qa.check('age-sized sequencer, silent editing, and local persistence');
    qa.click(qa.button('+ Faster',view));qa.assert(saved().tempo===108,'Tempo edits are included in the saved pattern');
    const before=JSON.stringify(saved());click('.studio-reset');qa.assert(saved().notes.every(track=>track.every(note=>!note)),'Clear removes every note across all pages');
    click('.studio-undo');qa.assert(JSON.stringify(saved())===before,'Undo recovers the complete saved rhythm and tempo');
    click('.studio-hint');qa.assert(JSON.stringify(saved())===before,'A requested creative suggestion never rewrites the rhythm');
    qa.assert(!score(qa),'Free music composition never creates a medal entry');
    qa.check('tempo, reversible clear, non-solving guidance, and no correctness grading');

    // This DOM fixture is not a trusted touch or a speaker-output test. It
    // verifies real native audio context lifecycle during an explicit request,
    // including cancellation while WebKit is still granting playback access.
    click('.studio-beat-play');qa.assert(contexts.length===1,'An explicit Play request creates one real audio context');
    click('.studio-beat-stop');await qa.waitFor(()=>contexts.every(audio=>audio.state==='closed'),'stopped beat context closes');
    qa.assert(!find('.studio-beat-play').disabled,'Stopped audio remains available for an explicit replay');
    qa.assert(JSON.stringify(saved())===before,'Stopping audio preserves the pattern');
    qa.check('explicit playback request and pending-startup cancellation');
    click('.studio-beat-play');
    qa.click(qa.button('Back to activities',view));await qa.waitFor(()=>document.body.dataset.activity==='home','composer navigation home');
    await qa.waitFor(()=>contexts.every(audio=>audio.state==='closed'),'navigation retires every beat context');
    qa.click('#card-beat-studio');await qa.waitFor(()=>document.body.dataset.activity==='beat-studio','beat family return');
    qa.click('[data-activity-mode="beat-maker"]');await qa.waitFor(()=>document.body.dataset.activity==='beat-maker','composer mode return');
    qa.assert(!find('.studio-beat-play').disabled,'Returning never resumes playback automatically');
    qa.assert(JSON.stringify(saved())===before,'Leaving and returning preserves saved music');
    await pause(30);qa.assert(contexts.length===2,'Returning requires another explicit gesture before creating sound');
    qa.check('navigation cancellation and quiet pattern recovery');
  }finally{
    globalThis.AudioContext=originalAudio;globalThis.webkitAudioContext=originalWebkitAudio;
  }
}

export default {'mirror-mosaic':tactile,'balance-lab':tactile,'measure-pour':tactile,'beat-maker':beatMaker};
