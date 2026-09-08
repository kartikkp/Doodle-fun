import { getProfile, readStore, writeStore } from './core.js';
import { canSpeak, speak, stopSpeaking } from './speech.js';

export const ADVENTURE_IDS=['size-order','picture-sequence','directions','make-a-shape','rhythm','sharing'];
export const ADVENTURE_TITLES={'size-order':'Growing garden','picture-sequence':'Story steps',directions:'Follow the arrows','make-a-shape':'Shape builder',rhythm:'Tap the pattern',sharing:'Fair shares'};
const DIRECTIONS={up:{symbol:'↑',dx:0,dy:-1},right:{symbol:'→',dx:1,dy:0},down:{symbol:'↓',dx:0,dy:1},left:{symbol:'←',dx:-1,dy:0}};
const BEATS=[{id:'clap',name:'Clap',emoji:'👏'},{id:'tap',name:'Tap',emoji:'👆'},{id:'stomp',name:'Stomp',emoji:'🦶'},{id:'rest',name:'Rest',emoji:'✋'}];
const FRIENDS=[{name:'Bunny',emoji:'🐰'},{name:'Bear',emoji:'🐻'},{name:'Cat',emoji:'🐱'},{name:'Frog',emoji:'🐸'}];
const STORIES=[
  {name:'A flower grows',steps:[['seed','Start with a seed','🌰'],['water','Water the seed','💧'],['sprout','A sprout appears','🌱'],['plant','Leaves grow bigger','🪴'],['flower','A flower blooms','🌻']]},
  {name:'A picnic plan',steps:[['bread','Put down bread','🍞'],['cheese','Add the cheese','🧀'],['sandwich','Close the sandwich','🥪'],['pack','Pack the picnic','🧺'],['eat','Enjoy the picnic','😋']]},
];
export function adventureConfig(value=6) {
  const age=Math.max(2,Math.min(10,Math.round(Number(value)||6))),i=age-2;
  const arrays={sizeCount:[2,3,3,4,4,5,5,6,6],sizeGap:[30,18,16,13,11,10,9,8,7],storyCount:[2,2,3,3,4,4,4,5,5],grid:[3,3,3,4,4,4,5,5,5],directionSteps:[1,2,2,3,3,4,4,5,6],vertices:[3,3,4,4,5,6,4,5,6],decoys:[0,0,0,0,0,0,1,2,3],beatLength:[2,3,3,4,5,5,6,7,8],beatPads:[2,2,3,3,3,4,4,4,4],groups:[2,2,2,3,3,3,4,4,4],perGroup:[1,2,3,2,3,4,3,3,4],remainder:[0,0,0,0,0,0,0,2,3]};
  return {age,model:age<=4,...Object.fromEntries(Object.entries(arrays).map(([key,values])=>[key,values[i]]))};
}
function shuffle(items,random) { const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy; }
export function buildAdventureRound(id,age=6,index=0,random=Math.random) {
  const config=adventureConfig(age);age=config.age;
  if(id==='size-order') {
    const pieces=Array.from({length:config.sizeCount},(_,i)=>({id:String(i),size:18+i*config.sizeGap,name:`Flower ${i+1}`}));
    const descending=age>=8&&index%2===1,solution=pieces.map(piece=>piece.id);if(descending)solution.reverse();
    return {id,age,index,config,pieces:shuffle(pieces,random),solution,descending};
  }
  if(id==='picture-sequence') {
    const story=STORIES[index%STORIES.length],indices=config.storyCount===2?[0,4]:config.storyCount===3?[0,2,4]:config.storyCount===4?[0,1,2,4]:[0,1,2,3,4];
    const pieces=indices.map(i=>({id:story.steps[i][0],name:story.steps[i][1],emoji:story.steps[i][2]}));
    return {id,age,index,config,name:story.name,pieces:shuffle(pieces,random),solution:pieces.map(piece=>piece.id)};
  }
  if(id==='directions') {
    const size=config.grid,start=Math.floor(size/2)*size+Math.floor(size/2),commands=[],positions=[start];let position=start,last='';
    for(let i=0;i<config.directionSteps;i++) {
      const candidates=Object.keys(DIRECTIONS).filter(dir=>{const {dx,dy}=DIRECTIONS[dir],x=position%size+dx,y=Math.floor(position/size)+dy;return x>=0&&x<size&&y>=0&&y<size&&(i!==config.directionSteps-1||y*size+x!==start)&&(!last||dir!==({up:'down',down:'up',left:'right',right:'left'}[last]));});
      const next=shuffle(candidates,random)[0],{dx,dy}=DIRECTIONS[next];position+=dx+dy*size;commands.push(next);positions.push(position);last=next;
    }
    return {id,age,index,config,size,start,goal:position,commands,positions};
  }
  if(id==='make-a-shape') {
    const count=config.vertices,angle=count===4?-Math.PI/4:-Math.PI/2;
    const vertices=Array.from({length:count},(_,i)=>({id:String(i),x:50+36*Math.cos(angle+i*Math.PI*2/count),y:50+36*Math.sin(angle+i*Math.PI*2/count)}));
    const inner=[[50,40],[40,58],[60,58]].slice(0,config.decoys).map(([x,y],i)=>({id:String(count+i),x,y}));
    const name=({3:'triangle',4:'square',5:'pentagon',6:'hexagon'})[count];
    return {id,age,index,config,vertices,dots:[...vertices,...inner],name,solution:vertices.map(v=>v.id)};
  }
  if(id==='rhythm') {
    const pads=BEATS.slice(0,config.beatPads),unit=shuffle(pads,random).slice(0,age<=3?2:age<=6?3:4);
    const sequence=Array.from({length:config.beatLength},(_,i)=>unit[i%unit.length].id);
    return {id,age,index,config,pads,sequence,solution:sequence};
  }
  if(id==='sharing') return {id,age,index,config,friends:FRIENDS.slice(0,config.groups),each:config.perGroup,remainder:config.remainder,total:config.groups*config.perGroup+config.remainder};
  throw new Error(`Unknown adventure: ${id}`);
}
export function sequenceStep(solution,placed,value) { return solution[placed.length]===value?[...placed,value]:placed; }
export function shapeStep(round,path,value) {
  if(!round.solution.includes(value)||path.length>round.vertices.length)return path;
  const count=round.vertices.length,current=Number(path.at(-1));
  if(path.length===1) return [(current+1)%count,(current+count-1)%count].includes(Number(value))?[...path,value]:path;
  const direction=Number(path[1])===1?1:-1,expected=(current+direction+count)%count;
  return Number(value)===expected?[...path,value]:path;
}
export function sharingStep(round,state,basket) {
  if(state.remaining<=0)return state;
  if(basket==='leftover')return round.remainder>0?{...state,leftover:state.leftover+1,remaining:state.remaining-1}:state;
  const index=Number(basket);if(!Number.isInteger(index)||index<0||index>=round.friends.length)return state;
  const counts=[...state.counts];counts[index]++;
  return {...state,counts,remaining:state.remaining-1};
}
export function fairSharing(round,state) { return state.remaining===0&&state.leftover===round.remainder&&state.counts.length===round.friends.length&&state.counts.every(count=>count===round.each); }

function el(tag,cls,text) { const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; }
function btn(label,cls,action) { const node=el('button',cls,label);node.type='button';node.addEventListener('click',action);return node; }
function emoji(value) { const node=el('span','adventure-emoji',value);node.setAttribute('aria-hidden','true');return node; }
function flower(size) { const node=el('span','adventure-flower','✿');node.style.fontSize=`${size}px`;node.setAttribute('aria-hidden','true');return node; }
function progressStore() { const stored=readStore('adventures-progress-v1',{});return Object.fromEntries(ADVENTURE_IDS.map(id=>[id,Number.isSafeInteger(stored?.[id])?Math.max(0,Math.min(100000,stored[id])):0])); }
export function createAdventures(container,{getSettings,onBack=()=>{},onNotice=()=>{},onProgress=()=>{}}) {
  let active=false,id='size-order',profile=getProfile(getSettings()),state,progress=progressStore();const sessions=new Map();
  container.classList.add('adventure-screen');
  container.innerHTML=`<header class="activity-header adventure-header"><button class="icon-button adventure-back" aria-label="Back to activities">←</button><div><p class="adventure-eyebrow">TRY A LITTLE ADVENTURE</p><h1 class="adventure-title"></h1></div><button class="icon-button adventure-hear" aria-label="Hear the instructions">♪</button></header><div class="adventure-main"><p class="adventure-round"></p><h2 class="adventure-objective" tabindex="-1"></h2><p class="adventure-instructions"></p><div class="adventure-play"></div><p class="adventure-status" role="status" aria-live="polite"></p><div class="adventure-footer"><button class="button adventure-hint">✦ Hint</button><button class="button adventure-retry">↶ Try again</button><button class="button button-primary adventure-next">Next <span aria-hidden="true">→</span></button></div></div>`;
  const $=selector=>container.querySelector(selector),play=$('.adventure-play'),status=$('.adventure-status');
  function say(text){if(active&&getSettings().sound)speak(text);}
  function report(){onProgress({source:'adventures',completedCount:Object.values(progress).reduce((sum,count)=>sum+count,0)});}
  function fresh(index=0,round=buildAdventureRound(id,profile.challengeAge,index)){return{index,round,placed:[],path:['0'],position:round.start,step:0,done:false,recorded:false,message:'',kind:'',showModel:round.config.model,ready:id!=='rhythm'||round.age<=6,sharing:{counts:Array(round.friends?.length||0).fill(0),leftover:0,remaining:round.total},moves:[]};}
  function session(){const key=`${id}:${profile.challengeAge}`;if(!sessions.has(key))sessions.set(key,fresh());state=sessions.get(key);}
  function tell(text,kind=''){state.message=text;state.kind=kind;status.textContent=text;status.className=`adventure-status ${kind?`is-${kind}`:''}`;}
  function complete(text){state.done=true;if(!state.recorded){state.recorded=true;progress[id]=Math.min(100000,progress[id]+1);writeStore('adventures-progress-v1',progress);report();}tell(`✓ ${text}`,'success');say(text);}
  function picture(piece){return id==='size-order'?flower(piece.size):emoji(piece.emoji);}
  function setObjective(title,instructions){$('.adventure-objective').textContent=title;$('.adventure-instructions').textContent=instructions;}
  function choosePiece(value){if(state.done)return;const next=sequenceStep(state.round.solution,state.placed,value);if(next===state.placed){tell(id==='size-order'?'Compare the flowers still waiting. Which size comes next?':'Look at what happens before and after this step. Try another picture.','retry');return;}state.placed=next;if(next.length===state.round.solution.length)complete(id==='size-order'?'Your flowers are all in size order!':'You put the whole story in order!');else tell('That fits. What comes next?');render();}
  function renderOrdering(){
    const round=state.round;
    setObjective(id==='size-order'?`Grow from ${round.descending?'big to small':'small to big'}.`:round.name,id==='size-order'?'Tap the flowers in size order. They are the same kind of flower.':'Tap the pictures to tell this little story from start to finish.');
    if(state.showModel){const model=el('div','adventure-model');model.setAttribute('aria-label','Order to explore together');round.solution.forEach(value=>{const piece=round.pieces.find(item=>item.id===value),slot=el('div','adventure-model-piece');slot.append(picture(piece));if(id==='picture-sequence')slot.append(el('span','',piece.name));model.append(slot);});play.append(model);}
    const slots=el('div','adventure-order-slots');round.solution.forEach((_,index)=>{const slot=el('div','adventure-order-slot');slot.setAttribute('aria-label',`Position ${index+1}`);slot.append(el('span','adventure-slot-number',String(index+1)));const piece=round.pieces.find(piece=>piece.id===state.placed[index]);if(piece)slot.append(picture(piece));else slot.append(el('span','adventure-placeholder',index===state.placed.length?'?':'·'));slots.append(slot);});play.append(slots);
    const choices=el('div',`adventure-pieces ${id==='picture-sequence'?'adventure-story-pieces':''}`);round.pieces.forEach((piece,index)=>{const node=btn('', 'adventure-piece',()=>choosePiece(piece.id));node.dataset.piece=piece.id;node.setAttribute('aria-label',id==='size-order'?`Flower in spot ${index+1}`:piece.name);node.disabled=state.placed.includes(piece.id)||state.done;node.append(picture(piece),el('span','',id==='size-order'?'Flower':piece.name));choices.append(node);});play.append(choices);
  }
  function direction(value){if(state.done)return;const round=state.round;if(round.commands[state.step]!==value){tell('Look at the next arrow. Try the direction it points.','retry');return;}state.step++;state.position=round.positions[state.step];if(state.step===round.commands.length)complete('You followed the directions all the way to the star!');else tell('One step closer. Follow the next arrow.');render();}
  function renderDirections(){
    const round=state.round;setObjective('Help Fox follow the arrows.','Tap the direction buttons in the order shown. One arrow means one square.');
    const clues=el('div','adventure-directions-clues');round.commands.forEach((value,index)=>{const node=el('span',`adventure-direction-clue ${index<state.step?'is-done':''} ${index===state.step?'is-current':''}`,DIRECTIONS[value].symbol);node.setAttribute('aria-label',`${index+1}: ${value}${index<state.step?', done':''}`);clues.append(node);});play.append(clues);
    const grid=el('div','adventure-direction-grid');grid.style.setProperty('--grid',round.size);grid.setAttribute('aria-label','Fox map');for(let i=0;i<round.size**2;i++){const cell=el('div','adventure-direction-cell',i===state.position?'🦊':i===round.goal?'⭐':'');cell.dataset.position=String(i);cell.dataset.current=String(i===state.position);grid.append(cell);}play.append(grid);
    const controls=el('div','adventure-arrows');Object.entries(DIRECTIONS).forEach(([value,{symbol}])=>{const node=btn(symbol,`button adventure-arrow adventure-${value}`,()=>direction(value));node.dataset.direction=value;node.setAttribute('aria-label',`Move ${value}`);node.disabled=state.done;controls.append(node);});play.append(controls);
  }
  function vertex(value){if(state.done)return;const next=shapeStep(state.round,state.path,value);if(next===state.path){tell('Go around the outside edge. Skip the dots inside the shape.','retry');return;}state.path=next;if(next.length===state.round.vertices.length+1)complete(`You built a ${state.round.name} with ${state.round.vertices.length} sides!`);else tell(next.length===state.round.vertices.length?'One last side: return to the starting dot.':'Keep joining the outside corners.');render();}
  function renderShape(){
    const round=state.round;setObjective(`Build a ${round.name}.`,round.config.decoys?'Start at the star. Join the outside corners and return to the start. Leave the inside dots alone.':'Start at the star. Tap the next corner, go around the shape, and come back to the start.');
    const plane=el('div','adventure-shape-plane'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
    const outline=document.createElementNS(svg.namespaceURI,'polygon');outline.setAttribute('points',round.vertices.map(v=>`${v.x},${v.y}`).join(' '));outline.setAttribute('class','adventure-shape-guide');svg.append(outline);
    const trail=document.createElementNS(svg.namespaceURI,'polyline');trail.setAttribute('points',state.path.map(id=>round.vertices.find(v=>v.id===id)).map(v=>`${v.x},${v.y}`).join(' '));trail.setAttribute('class','adventure-shape-trail');svg.append(trail);plane.append(svg);
    round.dots.forEach(dot=>{const node=btn(dot.id==='0'?'★':round.age<=5?String(Number(dot.id)+1):'●',`adventure-vertex ${state.path.at(-1)===dot.id?'is-current':''}`,()=>vertex(dot.id));node.dataset.vertex=dot.id;node.setAttribute('aria-label',`Dot ${Number(dot.id)+1}${dot.id==='0'?', start':''}`);node.style.left=`${dot.x}%`;node.style.top=`${dot.y}%`;node.disabled=state.done;plane.append(node);});play.append(plane,el('p','adventure-note',`${Math.min(state.path.length-1,round.vertices.length)} of ${round.vertices.length} sides joined`));
  }
  function beat(value){if(state.done||!state.ready)return;const next=sequenceStep(state.round.solution,state.placed,value);if(next===state.placed){tell('Take your time. Look at the next picture, or use Hint to see the pattern.','retry');return;}state.placed=next;if(next.length===state.round.solution.length)complete('You played the whole pattern at your own pace!');else tell('Keep your pattern going.');render();}
  function renderRhythm(){
    const round=state.round;setObjective('Tap your own little beat.',state.ready?'Tap the picture buttons in order. There is no rush and no timing score.':'Look at the pattern. Tap Ready when you want to try remembering it.');
    const sequence=el('div','adventure-beat-sequence');round.sequence.forEach((value,index)=>{const pad=round.pads.find(pad=>pad.id===value),visible=round.age<=6||!state.ready||state.showModel||index<state.placed.length;const node=el('span',`adventure-beat-token ${index<state.placed.length?'is-done':''} ${index===state.placed.length?'is-current':''}`,visible?pad.emoji:'·');node.dataset.step=String(index);node.setAttribute('aria-label',visible?`${index+1}: ${pad.name}`:`Step ${index+1}, hidden`);sequence.append(node);});play.append(sequence);
    if(!state.ready)play.append(btn('Ready · try the pattern','button button-primary adventure-ready',()=>{state.ready=true;state.showModel=false;tell('Play what you remember. Hint can show the pattern again.');render();}));
    const pads=el('div','adventure-beat-pads');round.pads.forEach(pad=>{const node=btn('','adventure-beat-pad',()=>beat(pad.id));node.dataset.beat=pad.id;node.setAttribute('aria-label',pad.name);node.disabled=!state.ready||state.done;node.append(emoji(pad.emoji),el('strong','',pad.name));pads.append(node);});play.append(pads);
    if(round.pads.length===4)play.append(el('p','adventure-note','Rest means a quiet moment. Tap the hand when the pattern shows it.'));
  }
  function give(basket){if(state.done)return;const next=sharingStep(state.round,state.sharing,basket);if(next===state.sharing){tell('All the cookies have a place. Check your shares or undo a cookie.');return;}state.moves.push(basket);state.sharing=next;tell(`${next.remaining} ${next.remaining===1?'cookie still needs':'cookies still need'} a place.`);render();}
  function renderSharing(){
    const round=state.round;setObjective(`Share ${round.total} cookies fairly.`,round.remainder?'Give every friend the same amount. Put any cookies that cannot make another equal round into Left over.':'Tap a friend to give one cookie. Give everyone the same amount.');
    const pool=el('div','adventure-cookie-pool');pool.setAttribute('aria-label',`${state.sharing.remaining} cookies to share`);for(let i=0;i<state.sharing.remaining;i++)pool.append(emoji('🍪'));if(!state.sharing.remaining)pool.append(el('span','','Every cookie has a place'));play.append(pool);
    const baskets=el('div','adventure-share-baskets');round.friends.forEach((friend,index)=>{const node=btn('','adventure-share-basket',()=>give(String(index)));node.dataset.basket=String(index);node.setAttribute('aria-label',`Give a cookie to ${friend.name}`);node.disabled=state.done;node.append(emoji(friend.emoji),el('strong','',friend.name));const treats=el('span','adventure-cookies');for(let i=0;i<state.sharing.counts[index];i++)treats.append(emoji('🍪'));if(round.config.model)for(let i=state.sharing.counts[index];i<round.each;i++)treats.append(el('span','adventure-cookie-guide','○'));node.append(treats,el('span','adventure-cookie-count',String(state.sharing.counts[index])));baskets.append(node);});
    if(round.remainder){const node=btn('','adventure-share-basket adventure-leftover',()=>give('leftover'));node.dataset.basket='leftover';node.setAttribute('aria-label','Put a cookie in Left over');node.disabled=state.done;node.append(emoji('🫙'),el('strong','','Left over'),el('span','',`${state.sharing.leftover} cookies`));baskets.append(node);}play.append(baskets);
    const actions=el('div','adventure-share-actions');const undo=btn('↶ Undo a cookie','button adventure-share-undo',()=>{const basket=state.moves.pop();if(basket==='leftover')state.sharing.leftover--;else state.sharing.counts[Number(basket)]--;state.sharing.remaining++;state.done=false;tell('One cookie is back. Try a different friend.');render();});undo.disabled=!state.moves.length;const check=btn('Check the shares','button button-primary adventure-check',()=>{if(fairSharing(round,state.sharing)){complete(`Fair shares! Each friend has ${round.each}${round.remainder?`, with ${round.remainder} left over`:''}.`);render();}else tell(state.sharing.remaining?'Keep sharing the cookies that are waiting.':'Compare the friends. Fair shares means the same amount for everyone. Undo a cookie or ask for a hint.','retry');});check.disabled=state.done;actions.append(undo,check);play.append(actions);
  }
  function render(){
    $('.adventure-title').textContent=ADVENTURE_TITLES[id];$('.adventure-round').textContent=`${profile.name} · round ${state.index+1}`;$('.adventure-hear').disabled=!getSettings().sound||!canSpeak();play.replaceChildren();container.dataset.adventure=id;
    if(id==='size-order'||id==='picture-sequence')renderOrdering();else if(id==='directions')renderDirections();else if(id==='make-a-shape')renderShape();else if(id==='rhythm')renderRhythm();else renderSharing();
    tell(state.message||'Explore one step at a time. Hint is here whenever you need it.',state.kind);$('.adventure-next').classList.toggle('is-ready',state.done);
  }
  function hint(){
    if(!active||state.done)return;const round=state.round;let text='',target;
    if(id==='size-order'||id==='picture-sequence'){state.showModel=true;render();const piece=round.pieces.find(piece=>piece.id===round.solution[state.placed.length]);target=`[data-piece="${piece.id}"]`;text=id==='size-order'?`Compare the flowers still waiting. Choose the ${round.descending?'largest':'smallest'} one next.`:`Next: ${piece.name.toLowerCase()}. Follow the picture story above.`;}
    else if(id==='directions'){const direction=round.commands[state.step];target=`[data-direction="${direction}"]`;text=`The next arrow points ${direction}. Tap that arrow once.`;}
    else if(id==='make-a-shape'){const direction=state.path.length===1?1:Number(state.path[1])===1?1:-1,next=(Number(state.path.at(-1))+direction+round.vertices.length)%round.vertices.length;target=`[data-vertex="${next}"]`;text=state.path.length===round.vertices.length?'Close the shape by returning to the starting star.':'Follow the outline around the outside. The outlined corner comes next.';}
    else if(id==='rhythm'){state.showModel=true;render();const pad=round.pads.find(pad=>pad.id===round.sequence[state.placed.length]);target=`[data-beat="${pad.id}"]`;text=`Look at the pattern again. ${pad.name} comes next. Play at your own pace.`;}
    else {const smallest=Math.min(...state.sharing.counts),index=smallest<round.each?state.sharing.counts.indexOf(smallest):-1;target=index>=0?`[data-basket="${index}"]`:'[data-basket="leftover"]';text=`Give one to each friend in turn. Each friend needs ${round.each}${round.remainder?`, and ${round.remainder} stay in Left over`:''}. You can undo cookies to make the shares equal.`;}
    play.querySelectorAll('.is-hint').forEach(node=>node.classList.remove('is-hint'));play.querySelector(target)?.classList.add('is-hint');tell(text,'hint');say(text);
  }
  $('.adventure-back').addEventListener('click',onBack);$('.adventure-hear').addEventListener('click',()=>say(`${$('.adventure-objective').textContent} ${$('.adventure-instructions').textContent}`));$('.adventure-hint').addEventListener('click',hint);
  $('.adventure-next').addEventListener('click',()=>{state=fresh(state.index+1);sessions.set(`${id}:${profile.challengeAge}`,state);render();$('.adventure-objective').focus({preventScroll:true});});
  $('.adventure-retry').addEventListener('click',()=>{const recorded=state.recorded;state=fresh(state.index,state.round);state.recorded=recorded;sessions.set(`${id}:${profile.challengeAge}`,state);render();tell('A fresh start. Take it one step at a time.');});
  document.addEventListener('keydown',event=>{if(!active||id!=='directions'||event.target.closest?.('dialog,input,select,textarea'))return;const value={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];if(value){event.preventDefault();direction(value);}});
  report();
  return {open(next){if(!ADVENTURE_IDS.includes(next))throw new Error(`Unknown adventure: ${next}`);active=true;id=next;profile=getProfile(getSettings());session();render();},close(){active=false;stopSpeaking();},settingsChanged(){const next=getProfile(getSettings()),changed=next.challengeAge!==profile.challengeAge;profile=next;if(!getSettings().sound)stopSpeaking();if(active){if(changed){session();render();}else $('.adventure-hear').disabled=!getSettings().sound||!canSpeak();}},hint};
}
