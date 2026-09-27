import {getProfile, readStore, writeStore} from './core.js';
import {createSoundEngine, TIMBRES} from './audio.js';
import {beginRound, recordMistake, recordHint, completeRound, getRoundCursor} from './progression.js';

export const STUDIO_IDS=['mirror-mosaic','balance-lab','measure-pour','beat-maker'];
const TITLES={'mirror-mosaic':'Mirror mosaic','balance-lab':'Balance workshop','measure-pour':'Measure & pour','beat-maker':'Beat maker'};
const COLORS=['Empty','Coral','Ocean','Gold','Leaf'];
const MARKS=['','●','◆','★','▲'];
const clampAge=value=>Math.max(2,Math.min(10,Math.round(Number(value)||6)));
const clone=value=>JSON.parse(JSON.stringify(value));

export function studioConfig(value=6) {
  const age=clampAge(value);
  return {age,gridSize:age<=3?2:age<=6?4:6,colors:age<=3?1:age<=5?2:age<=7?3:4,
    steps:age<=4?4:age<=7?8:16,tracks:age<=4?2:age<=7?3:4};
}

export function mirrorSource(size,axis,index) {
  const row=Math.floor(index/size),col=index%size,half=size/2;
  return (axis==='vertical'?row:Math.min(row,size-1-row))*size+(axis==='horizontal'?col:Math.min(col,size-1-col));
}

export function buildStudioRound(id,value=6,index=0) {
  const config=studioConfig(value),age=config.age;
  if(id==='mirror-mosaic') {
    const size=config.gridSize,axis=age>=8?'both':age>=5&&index%2?'horizontal':'vertical';
    const solution=Array(size*size).fill(0),sources=[];
    for(let cell=0;cell<solution.length;cell++)if(mirrorSource(size,axis,cell)===cell)sources.push(cell);
    sources.forEach((cell,i)=>{solution[cell]=i===0||((i+index)%3!==2)?1+(i+index)%config.colors:0;});
    for(let cell=0;cell<solution.length;cell++)solution[cell]=solution[mirrorSource(size,axis,cell)];
    return {id,age,index,...config,size,axis,sources,solution};
  }
  if(id==='balance-lab') {
    const unknown=age>=8,target=age<=3?age-1:age<=5?3+index%3:age<=7?5+index%4:6+index%6;
    const mystery=unknown?2+index%4:0;
    const fixed=unknown?[{value:mystery,mystery:true},{value:target-mystery}]:age<=4?Array.from({length:target},()=>({value:1})):[{value:target}];
    return {id,age,index,target,fixed,mystery,weights:age<=2?[1]:age<=4?[1,2]:age<=6?[1,2,3]:[1,2,5],maxPieces:12};
  }
  if(id==='measure-pour') {
    const sets=[[2,1],[3,2],[4,3,1],[5,3,2],[6,4,3],[7,4,3],[6,4,3],[8,5,3],[9,5,4]];
    const capacities=sets[age-2],target=[1,2,2,1,1,2,index%2?3:1,index%2?4:2,index%2?3:2][age-2];
    return {id,age,index,capacities,initial:capacities.map((capacity,i)=>i===0?capacity:0),targetJug:1,target,denominator:age<=7?1:age===8?2:4};
  }
  if(id==='beat-maker')return {id,age,index,...config,instruments:Object.keys(TIMBRES).slice(0,config.tracks)};
  throw new Error(`Unknown studio: ${id}`);
}

export function setMirrorTile(round,tiles,cell,color,free=false) {
  if(!Number.isInteger(cell)||cell<0||cell>=tiles.length||!Number.isInteger(color)||color<0||color>round.colors||(!free&&round.sources.includes(cell)))return tiles;
  const next=[...tiles];
  if(free){const source=mirrorSource(round.size,round.axis,cell);next.forEach((_,i)=>{if(mirrorSource(round.size,round.axis,i)===source)next[i]=color;});}
  else next[cell]=color;
  return next;
}
export const mirrorComplete=(round,tiles)=>tiles.length===round.solution.length&&tiles.every((value,i)=>value===round.solution[i]);
export function balanceTotals(pans){return pans.map(pan=>pan.reduce((sum,piece)=>sum+piece.value,0));}
export function balanceComplete(pans){const [left,right]=balanceTotals(pans);return left>0&&left===right;}
export function addBalanceWeight(round,pans,pan,value) {
  if(![0,1].includes(pan)||!round.weights.includes(value)||pans[pan].length>=round.maxPieces)return pans;
  return pans.map((pieces,i)=>i===pan?[...pieces,{value}]:pieces);
}
export function pourTransfer(round,amounts,from,to) {
  if(!Number.isInteger(from)||!Number.isInteger(to)||from===to||from<0||to<0||from>=amounts.length||to>=amounts.length)return amounts;
  const moved=Math.min(amounts[from],round.capacities[to]-amounts[to]);
  if(moved<=0)return amounts;
  return amounts.map((amount,i)=>amount+(i===from?-moved:i===to?moved:0));
}
export function solvePour(round) {
  const queue=[{amounts:round.initial,moves:[]}],seen=new Set([round.initial.join(',')]);
  for(let n=0;n<queue.length;n++){
    const {amounts,moves}=queue[n];if(amounts[round.targetJug]===round.target)return moves;
    for(let from=0;from<amounts.length;from++)for(let to=0;to<amounts.length;to++){
      const next=pourTransfer(round,amounts,from,to),key=next.join(',');
      if(!seen.has(key)){seen.add(key);queue.push({amounts:next,moves:[...moves,[from,to]]});}
    }
  }
  return null;
}
export function measureLabel(units,denominator=1) {
  if(denominator===1)return String(units);
  const whole=Math.floor(units/denominator),remainder=units%denominator;
  if(!remainder)return String(whole);
  const fraction=denominator===2?'½':({1:'¼',2:'½',3:'¾'})[remainder];
  return `${whole||''}${fraction}`;
}
export function normalizeBeatPattern(value,round) {
  return {tempo:Math.max(60,Math.min(180,Number.isFinite(value?.tempo)?Math.round(value.tempo):96)),
    notes:round.instruments.map((_,track)=>Array.from({length:round.steps},(_,step)=>value?.notes?.[track]?.[step]===true))};
}
export function beatEvents(round,pattern) {
  const events=[],duration=60/pattern.tempo;
  for(let step=0;step<round.steps;step++){
    events.push({kind:'rest',time:step*duration,duration:.08,step});
    round.instruments.forEach((kind,track)=>{if(pattern.notes[track][step])events.push({kind,time:step*duration,duration:Math.min(.25,duration*.8),step});});
  }
  // Keep the final step visible for its complete beat, including an empty step.
  events.push({kind:'rest',time:round.steps*duration-.08,duration:.08,step:round.steps-1});
  return events;
}

const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
function button(text,cls,action){const node=el('button',cls,text);node.type='button';node.addEventListener('click',action);return node;}

export function createStudioPlay(container,{getSettings,getTitle=()=>null,onBack=()=>{},onNotice=()=>{},onProgress=()=>{}}) {
  let active=false,id='mirror-mosaic',profile=getProfile(getSettings()),state,playing=false,audioEpoch=0;
  const sessions=new Map(),counts=readStore('studio-progress-v1',{});
  const engine=createSoundEngine({onInterrupt:()=>suspendAudio()});
  container.classList.add('studio-screen');
  container.innerHTML='<header class="activity-header studio-header"><button class="icon-button studio-back" aria-label="Back to activities">←</button><div><p class="studio-eyebrow">MAKE · TRY · DISCOVER</p><h1 class="studio-title"></h1></div></header><div class="studio-main"><p class="studio-round"></p><h2 class="studio-objective" tabindex="-1"></h2><p class="studio-instructions"></p><div class="studio-play"></div><p class="studio-status" role="status" aria-live="polite"></p><div class="studio-footer"><button class="button studio-hint" data-hint>✦ Hint</button><button class="button studio-undo">↶ Undo</button><button class="button studio-reset">Start again</button><button class="button button-primary studio-check">Check</button><button class="button studio-next">New challenge →</button></div></div>';
  const $=selector=>container.querySelector(selector),play=$('.studio-play');
  const key=()=>`${id}:${profile.age}:${profile.challengeAge}`;
  const beatKey=()=>`beat-maker-pattern-v1:${profile.challengeAge}`;
  function fresh(index=0,free=false){const round=buildStudioRound(id,profile.challengeAge,index);return {round,index,free,done:false,recorded:false,selected:id==='mirror-mosaic'?1:id==='balance-lab'?1:null,history:[],message:'',kind:'',page:0,
    tiles:id==='mirror-mosaic'?round.solution.map((color,cell)=>round.sources.includes(cell)&&!free?color:0):[],
    pans:id==='balance-lab'?[round.fixed.map(piece=>({...piece,fixed:true})),[]]:[[],[]],
    amounts:id==='measure-pour'?[...round.initial]:[],pattern:id==='beat-maker'?normalizeBeatPattern(readStore(beatKey(),null),round):null};}
  function startScore(){beginRound({mode:id,age:profile.age,step:profile.challengeAge,roundKey:String(state.index),scored:id!=='beat-maker'&&!state.free});}
  function tell(message,kind=''){state.message=message;state.kind=kind;$('.studio-status').textContent=message;$('.studio-status').className=`studio-status ${kind?`is-${kind}`:''}`;}
  function remember(){state.history.push(clone({tiles:state.tiles,pans:state.pans,amounts:state.amounts,pattern:state.pattern}));if(state.history.length>80)state.history.shift();state.done=false;}
  function saveBeat(){if(id==='beat-maker')writeStore(beatKey(),state.pattern);}
  function changed(message='Try your idea, then Check.'){state.done=false;tell(message);render();}
  function suspendAudio(){audioEpoch++;playing=false;engine.suspend();if(active&&id==='beat-maker')render();}
  function playAudio(events){suspendAudio();const token=++audioEpoch;playing=true;render();engine.play(events,{onEvent:index=>{
    if(!active||token!==audioEpoch||id!=='beat-maker')return;
    const step=events[index].step;container.querySelectorAll('[data-beat-step]').forEach(node=>node.classList.toggle('is-playing',Number(node.dataset.beatStep)===step));
    const marker=$('.studio-playhead');if(marker)marker.textContent=`Playing step ${(step??0)+1} of ${state.round.steps}`;
  }}).then(result=>{if(!active||token!==audioEpoch||id!=='beat-maker')return;playing=false;tell(result.status==='failed'?'Sound could not start. Your pattern is saved; tap Play to try again.':'Your pattern is ready to change or play again.',result.status==='failed'?'retry':'');render();});}
  function objective(title,instructions){$('.studio-objective').textContent=title;$('.studio-instructions').textContent=instructions;}
  function palette(){const row=el('div','studio-palette');for(let color=0;color<=state.round.colors;color++){
    const tile=button(`${MARKS[color]||'×'} ${color?COLORS[color]:'Erase'}`,'studio-color',()=>{state.selected=color;render();});tile.dataset.color=String(color);tile.setAttribute('aria-pressed',String(state.selected===color));row.append(tile);
  }return row;}
  function renderMirror(){const round=state.round;
    objective(state.free?'Create a mirror picture.':round.axis==='both'?'Make all four parts reflect.':'Complete the mirror picture.',state.free?'Pick a color, then tap anywhere. Its reflections appear too. Every design is welcome.':'Choose a color, then tap the empty side. Keep matching tiles equally far from the mirror line. Erase removes a tile.');
    const toggle=button(state.free?'Return to challenge':'Create freely','button studio-free',()=>{state=fresh(state.index,!state.free);sessions.set(key(),state);startScore();render();});play.append(toggle,palette());
    const grid=el('div',`studio-mirror-grid axis-${round.axis}`);grid.style.setProperty('--grid-size',round.size);grid.setAttribute('aria-label','Mirror picture');
    state.tiles.forEach((color,cell)=>{
      const source=!state.free&&round.sources.includes(cell),row=Math.floor(cell/round.size),col=cell%round.size;
      const node=source?el('div','studio-mirror-cell is-source'):button('','studio-mirror-cell',()=>{const next=setMirrorTile(round,state.tiles,cell,state.selected,state.free);if(next!==state.tiles){remember();state.tiles=next;changed(state.free?'Your picture reflects across the line.':'Your tile is in place. Check when you are ready.');}});
      node.dataset.cell=String(cell);node.dataset.color=String(color);const mark=el('span','studio-tile-mark',MARKS[color]||'·');mark.style.transform=`scale(${round.axis!=='horizontal'&&col>=round.size/2?-1:1},${round.axis!=='vertical'&&row>=round.size/2?-1:1})`;node.append(mark);node.setAttribute('aria-label',`${source?'Model':'Your picture'}, row ${row+1}, column ${col+1}: ${COLORS[color]}`);
      if((round.axis==='vertical'||round.axis==='both')&&col===round.size/2-1)node.classList.add('mirror-edge-right');
      if((round.axis==='horizontal'||round.axis==='both')&&row===round.size/2-1)node.classList.add('mirror-edge-bottom');grid.append(node);
    });play.append(grid,el('p','studio-caption',state.free?'Mirrors repeat your choices. Try turning the little shapes into a creature.':'The filled model squares stay still. Dotted squares are yours to change.'));
  }
  function renderBalance(){const round=state.round,[left,right]=balanceTotals(state.pans),difference=Math.sign(left-right);
    objective('Make the pans balance.','Choose a weight, then tap a pan to add it. Tap a weight you added to take it back. Different combinations can balance.');
    if(round.mystery){const evidence=el('div','studio-evidence');evidence.append(el('strong','',`Mystery clue: one ? box balances ${round.mystery} unit blocks.`));const icons=el('div','studio-unit-clue','?  =  '+Array(round.mystery).fill('■').join(' '));icons.setAttribute('aria-hidden','true');evidence.append(icons);play.append(evidence);}
    const palette=el('div','studio-palette');round.weights.forEach(value=>{const node=button(`${value} ${value===1?'unit':'units'}`,'studio-weight',()=>{state.selected=value;render();});node.dataset.weight=String(value);node.setAttribute('aria-pressed',String(state.selected===value));palette.append(node);});play.append(palette);
    const beam=el('div','studio-balance-beam');beam.style.setProperty('--tilt',`${difference*-6}deg`);beam.setAttribute('aria-hidden','true');beam.append(el('span','studio-beam-bar'),el('span','studio-fulcrum','▲'));play.append(beam);
    const pans=el('div','studio-pans');state.pans.forEach((pieces,pan)=>{const holder=el('section','studio-pan');holder.dataset.side=String(pan);holder.style.transform=`translateY(${difference*(pan===0?6:-6)}px)`;const add=button(`+ ${pan===0?'Left':'Right'} pan`,'studio-pan-add',()=>{const next=addBalanceWeight(round,state.pans,pan,state.selected);if(next===state.pans){tell('This pan is full. Take a weight back or use Undo.');return;}remember();state.pans=next;changed('Watch the balance change. Keep trying, then Check.');});add.dataset.pan=String(pan);holder.append(add);const tray=el('div','studio-pan-pieces');
      pieces.forEach((piece,index)=>{const label=piece.mystery?'?':String(piece.value);const item=piece.fixed?el('span','studio-block is-fixed',label):button(label,'studio-block',()=>{remember();state.pans=state.pans.map((items,i)=>i===pan?items.filter((_,j)=>j!==index):items);changed('Weight taken back.');});item.setAttribute('aria-label',piece.fixed?`${piece.mystery?'Mystery':piece.value+' unit'} starting weight`:`Remove ${piece.value} units from ${pan===0?'left':'right'} pan`);tray.append(item);});holder.append(tray);pans.append(holder);});
    play.append(pans,el('p','studio-balance-observation',left===right?'The pans are level.':left>right?'The left pan is heavier and hangs lower.':'The right pan is heavier and hangs lower.'),el('p','studio-caption','Starting weights stay on the left pan. Additions to either pan are reversible.'));
  }
  function renderPour(){const round=state.round,unit=round.denominator===1?'cup':`${measureLabel(1,round.denominator)} cup`;
    objective(`Measure ${measureLabel(round.target,round.denominator)} ${round.target===round.denominator?'cup':'cups'} in jug B.`,`Tap a source jug, then a different destination to pour. Pouring stops when the source is empty or the destination is full. Each mark is ${unit}.`);
    const jugs=el('div','studio-jugs');round.capacities.forEach((capacity,jug)=>{
      const name=String.fromCharCode(65+jug),amount=state.amounts[jug];const node=button('','studio-jug',()=>{
        if(state.selected===null){state.selected=jug;tell(`Jug ${name} selected. Tap another jug to pour into it.`);render();return;}
        if(state.selected===jug){state.selected=null;tell('Source cleared. Choose any jug.');render();return;}
        const from=state.selected,next=pourTransfer(round,state.amounts,from,jug);state.selected=null;
        if(next===state.amounts){tell('No water can move: choose a source with water and a destination with space.');render();return;}
        remember();const moved=state.amounts[from]-next[from];state.amounts=next;changed(`${measureLabel(moved,round.denominator)} cups moved from ${String.fromCharCode(65+from)} to ${name}. No water was lost.`);
      });node.dataset.jug=String(jug);node.setAttribute('aria-pressed',String(state.selected===jug));node.setAttribute('aria-label',`Jug ${name}, ${measureLabel(amount,round.denominator)} of ${measureLabel(capacity,round.denominator)} cups${jug===round.targetJug?', target jug':''}`);
      node.append(el('strong','',`Jug ${name}`));const well=el('span','studio-jug-well'),picture=el('span','studio-jug-picture');picture.style.height=`${capacity/Math.max(...round.capacities)*180}px`;picture.style.setProperty('--fill',`${amount/capacity*100}%`);picture.style.setProperty('--marks',capacity);picture.setAttribute('aria-hidden','true');picture.append(el('span','studio-water'));
      if(jug===round.targetJug){const line=el('span','studio-jug-target');line.style.bottom=`${round.target/capacity*100}%`;picture.append(line);}
      well.append(picture);node.append(well,el('span','studio-jug-amount',`${measureLabel(amount,round.denominator)} / ${measureLabel(capacity,round.denominator)} cups`));jugs.append(node);
    });play.append(jugs,el('p','studio-caption',`Total water: ${measureLabel(round.initial[0],round.denominator)} cups. The dashed line marks the goal in jug B. Undo takes back one pour.`));
  }
  function renderBeat(){const round=state.round,pattern=state.pattern,start=state.page*4;
    objective('Make a beat that is yours.','Tap squares to add or remove sounds. Empty squares are pauses. Tap an instrument to preview it. Play starts your whole pattern.');
    const transport=el('div','studio-transport');const startButton=button('▶ Play','button button-primary studio-beat-play',()=>playAudio(beatEvents(round,state.pattern)));startButton.disabled=playing;
    const stop=button('■ Stop','button studio-beat-stop',()=>{suspendAudio();tell('Stopped. Your pattern is saved.');});stop.disabled=!playing;transport.append(startButton,stop);play.append(transport);
    const tempo=el('div','studio-tempo');const adjust=delta=>{suspendAudio();remember();state.pattern.tempo=Math.max(60,Math.min(180,state.pattern.tempo+delta));saveBeat();render();};
    const slower=button('− Slower','button',()=>adjust(-12)),faster=button('+ Faster','button',()=>adjust(12));slower.disabled=pattern.tempo<=60;faster.disabled=pattern.tempo>=180;tempo.append(slower,el('span','',`${pattern.tempo} beats / min`),faster);play.append(tempo);
    if(round.steps>4){const paging=el('div','studio-pages');for(let page=0;page<round.steps/4;page++){const node=button(`${page*4+1}–${page*4+4}`,'button',()=>{state.page=page;render();});node.setAttribute('aria-label',`Show steps ${page*4+1} to ${page*4+4}`);node.setAttribute('aria-pressed',String(state.page===page));paging.append(node);}play.append(paging);}
    const score=el('div','studio-sequencer');round.instruments.forEach((kind,track)=>{
      const row=el('div','studio-track');const preview=button(`${TIMBRES[kind].symbol} ${TIMBRES[kind].name}`,'studio-instrument',()=>playAudio([{kind,duration:.25,step:0}]));preview.setAttribute('aria-label',`Preview ${TIMBRES[kind].name}`);row.append(preview);
      const steps=el('div','studio-steps');for(let step=start;step<start+4;step++){const node=button(String(step+1),'studio-beat-cell',()=>{suspendAudio();remember();state.pattern.notes[track][step]=!state.pattern.notes[track][step];saveBeat();tell('Pattern saved on this device.');render();});node.dataset.track=String(track);node.dataset.beatStep=String(step);node.setAttribute('aria-label',`${TIMBRES[kind].name}, step ${step+1}`);node.setAttribute('aria-pressed',String(pattern.notes[track][step]));steps.append(node);}row.append(steps);score.append(row);
    });play.append(score,el('p','studio-playhead',playing?'Playing your pattern…':`${round.steps} steps · ${round.tracks} instruments`),el('p','studio-caption','Saved automatically on this device. Make, listen, and change it: there is no right answer.'));
  }
  function render(){if(!active||!state)return;$('.studio-title').textContent=getTitle()||TITLES[id];$('.studio-round').textContent=id==='beat-maker'?'Creative studio · saved locally':state.free?'Creative studio':`Challenge ${state.index+1} · level ${profile.challengeAge}`;play.replaceChildren();
    ({'mirror-mosaic':renderMirror,'balance-lab':renderBalance,'measure-pour':renderPour,'beat-maker':renderBeat})[id]();
    const free=state.free||id==='beat-maker';$('.studio-check').hidden=free;$('.studio-next').hidden=free;$('.studio-check').disabled=state.done;$('.studio-next').classList.toggle('is-ready',state.done);$('.studio-undo').disabled=!state.history.length;$('.studio-reset').textContent=id==='beat-maker'?'Clear pattern':'Start again';tell(state.message,state.kind);
  }
  function check(){if(state.done||state.free||id==='beat-maker')return;const valid=id==='mirror-mosaic'?mirrorComplete(state.round,state.tiles):id==='balance-lab'?balanceComplete(state.pans):state.amounts[state.round.targetJug]===state.round.target;
    if(!valid){recordMistake();tell(id==='mirror-mosaic'?'Some tiles do not yet match the reflection. Compare color and distance from the line.':id==='balance-lab'?'The pans are not balanced yet. Add or take back a weight, then try Check again.':'Jug B does not yet reach the target line. Try another pour or Undo.','retry');return;}
    const priorCursor=getRoundCursor(id,profile.age,profile.challengeAge);completeRound();state.done=true;if(!state.recorded&&getRoundCursor(id,profile.age,profile.challengeAge)>priorCursor){state.recorded=true;counts[id]=(Number(counts[id])||0)+1;writeStore('studio-progress-v1',counts);onProgress({source:'studio-play',completedCount:Object.values(counts).reduce((sum,count)=>sum+(Number(count)||0),0)});}
    tell(id==='mirror-mosaic'?'✓ Your tiles make a reflection!':id==='balance-lab'?'✓ The different combinations have equal weight!':'✓ You measured the target without losing water!','success');render();
  }
  function hint(){if(!active)return;recordHint();
    const text=id==='mirror-mosaic'?(state.free?'Place a tile near the mirror line, then one farther away. Their partners move the same distance on the other side.':'Choose one model tile. Count its spaces from the mirror line; its partner needs the same distance and color.'):id==='balance-lab'?'Look at the lower pan: it is heavier. Add to the lighter pan or take back a weight you added to the heavier pan.':id==='measure-pour'?'Compare the empty space in a jug with the water in your source. A pour always fills the destination or empties the source.': 'Try one sound at the start and a different sound later. Leave a square empty for a pause, then Play and change your idea.';
    tell(text,'hint');
  }
  function open(nextId){if(!STUDIO_IDS.includes(nextId))throw new Error(`Unknown studio: ${nextId}`);if(active)suspendAudio();id=nextId;profile=getProfile(getSettings());active=true;container.hidden=false;const cursor=getRoundCursor(id,profile.age,profile.challengeAge);if(!sessions.has(key())||sessions.get(key()).index<cursor)sessions.set(key(),fresh(cursor));state=sessions.get(key());startScore();render();}
  function close(){suspendAudio();active=false;container.hidden=true;}
  $('.studio-back').addEventListener('click',onBack);$('.studio-hint').addEventListener('click',hint);$('.studio-check').addEventListener('click',check);
  $('.studio-undo').addEventListener('click',()=>{if(!state.history.length)return;suspendAudio();const previous=state.history.pop();Object.assign(state,previous);state.done=false;state.selected=id==='measure-pour'?null:state.selected;saveBeat();tell('Your last change was undone.');render();});
  $('.studio-reset').addEventListener('click',()=>{suspendAudio();remember();const reset=fresh(state.index,state.free);state.tiles=reset.tiles;state.pans=reset.pans;state.amounts=reset.amounts;state.selected=reset.selected;if(id==='beat-maker')state.pattern=normalizeBeatPattern({tempo:state.pattern.tempo},state.round);saveBeat();tell('Ready to try again. Undo can restore your work.');render();});
  $('.studio-next').addEventListener('click',()=>{suspendAudio();state=fresh(state.index+1);sessions.set(key(),state);startScore();render();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendAudio();});globalThis.addEventListener?.('pagehide',suspendAudio);
  return {open,close,settingsChanged(){if(active)open(id);},hint,suspendAudio};
}
