import {beginRound,recordMistake,recordHint,completeRound,getRoundCursor} from './progression.js';
import { getProfile, readStore, writeStore } from './core.js';
import { canSpeak, requestSpeech, stopSpeaking } from './speech.js';
import { objectArt } from './activity-art.js';
import { createSoundEngine } from './audio.js';

export const ADVENTURE_IDS=['size-order','picture-sequence','directions','make-a-shape','rhythm','sharing'];
export const ADVENTURE_TITLES={'size-order':'Growing garden','picture-sequence':'Story steps',directions:'Follow the arrows','make-a-shape':'Shape builder',rhythm:'Tap the pattern',sharing:'Fair shares'};
const DIRECTIONS={up:{symbol:'↑',dx:0,dy:-1},right:{symbol:'→',dx:1,dy:0},down:{symbol:'↓',dx:0,dy:1},left:{symbol:'←',dx:-1,dy:0}};
const BEATS=[{id:'clap',name:'Clap',emoji:'👏'},{id:'tap',name:'Tap',emoji:'👆'},{id:'stomp',name:'Stomp',emoji:'🦶'},{id:'rest',name:'Rest',emoji:'✋'}];
const FRIENDS=[{name:'Bunny',emoji:'🐰'},{name:'Bear',emoji:'🐻'},{name:'Cat',emoji:'🐱'},{name:'Frog',emoji:'🐸'}];
const STORIES=[
  {name:'A flower grows',steps:[['seed','Start with a seed','🌰'],['water','Water the seed','💧'],['sprout','A sprout appears','🌱'],['plant','Leaves grow bigger','🪴'],['flower','A flower blooms','🌻']]},
  {name:'A picnic plan',steps:[['bread','Put down bread','🍞'],['cheese','Add the cheese','🧀'],['sandwich','Close the sandwich','🥪'],['pack','Pack the picnic','🧺'],['eat','Enjoy the picnic','😋']]},
  {name:'Build then launch a paper plane',steps:[['paper','Start with a flat sheet','📄'],['fold','Fold the sheet','📐'],['plane','The paper plane is ready','✈️'],['launch','Launch the plane','🫳'],['land','The plane lands','🛬']]},
  {name:'A frozen juice pop',steps:[['juice','Pour juice into a mold','🧃'],['stick','Put a stick in the juice','🥢'],['freezer','Freeze the mold','❄️'],['ice-pop','Take out the frozen pop','🍧'],['melt','The pop melts in the warmth','💧']]},
  {name:'Build a tower, then rebuild it',steps:[['blocks','Start with loose blocks','🧱'],['base','Set a wide base','▰'],['tower','Stack the tower','🏗️'],['fall','The tower falls','💥'],['rebuild','Use the fallen blocks to rebuild','🧱']]},
];
export function adventureConfig(value=6) {
  const age=Math.max(2,Math.min(10,Math.round(Number(value)||6))),i=age-2;
  const arrays={sizeCount:[2,3,3,4,4,5,5,6,6],sizeGap:[30,18,16,13,11,10,9,8,7],storyCount:[2,2,3,3,4,4,4,5,5],grid:[3,3,3,4,4,4,5,5,5],directionSteps:[1,2,2,3,3,4,4,5,6],vertices:[3,3,4,4,5,6,4,5,6],decoys:[0,0,0,0,0,0,1,2,3],beatLength:[2,3,3,4,5,5,6,7,8],beatPads:[2,2,3,3,3,4,4,4,4],groups:[2,2,2,3,3,3,4,4,4],perGroup:[1,2,3,2,3,4,3,3,4],remainder:[0,0,0,0,0,0,0,2,3]};
  return {age,model:false,...Object.fromEntries(Object.entries(arrays).map(([key,values])=>[key,values[i]]))};
}
function shuffle(items,random) { const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy; }
export function buildAdventureRound(id,age=6,index=0,random=Math.random) {
  const config=adventureConfig(age);age=config.age;
  if(id==='size-order') {
    const descending=age>=5&&index%2===1,base=2+index%4;
    const pieces=Array.from({length:config.sizeCount},(_,i)=>{
      const value=base+i*2,size=24+i*14;
      if(age<=5)return{id:String(i),size,name:`Flower ${i+1}`,value};
      if(age===6)return{id:String(i),size:50,name:`${value} cm`,value,measure:`${value} cm`};
      if(age===7)return{id:String(i),size:50,name:`${value-1} cm + 1 cm`,value,measure:`${value-1} + 1 cm`};
      if(age===8)return{id:String(i),size:50,name:i%2?`${value*10} mm`:`${value} cm`,value,measure:i%2?`${value*10} mm`:`${value} cm`};
      const width=2+i%3,height=base+i,area=width*height,perimeter=2*(width+height);
      return{id:String(i),size:50,name:`${width} cm by ${height} cm`,value:age===9?area:perimeter,measure:`${width} × ${height} cm`,width,height};
    });
    // Older dimension pairs use distinct metric values, avoiding arbitrary ties.
    if(age>=9){const used=new Set();pieces.forEach((piece,i)=>{piece.width=2+i%2;piece.height=base+i*3;piece.value=age===9?piece.width*piece.height:2*(piece.width+piece.height);while(used.has(piece.value)){piece.height++;piece.value=age===9?piece.width*piece.height:2*(piece.width+piece.height);}used.add(piece.value);piece.name=`${piece.width} cm by ${piece.height} cm`;piece.measure=`${piece.width} × ${piece.height} cm`;});}
    const ordered=[...pieces].sort((a,b)=>a.value-b.value);if(descending)ordered.reverse();
    return {id,age,index,config,pieces:shuffle(pieces,random),solution:ordered.map(piece=>piece.id),descending,metric:age<=5?'size':age<=8?'length':age===9?'area':'perimeter',objective:age<=5?`Grow from ${descending?'big to small':'small to big'}.`:`Order by ${age<=8?'length':age===9?'area':'perimeter'}, ${descending?'greatest to least':'least to greatest'}.`,instructions:age<=5?'Compare the flowers before choosing.':age===6?'Read the length labels; the diagrams are the same size.':age===7?'Add each pair of lengths before comparing.':age===8?'Use the same unit: 10 millimeters make 1 centimeter.':age===9?'Each card describes a rectangle. Area is the space inside: width × height.':'Each card describes a rectangle. Perimeter is the distance around all four sides.'};
  }
  if(id==='picture-sequence') {
    const story=STORIES[(index+Math.max(0,age-4))%STORIES.length],indices=config.storyCount===2?[0,4]:config.storyCount===3?[0,2,4]:config.storyCount===4?[0,1,2,4]:[0,1,2,3,4];
    const pieces=indices.map(i=>({id:story.steps[i][0],name:story.steps[i][1],emoji:story.steps[i][2]})),reverse=age>=8&&index%2===1;
    const solution=pieces.map(piece=>piece.id);if(reverse)solution.reverse();
    if(age>=7)pieces.push({id:'unrelated',name:'Tie a shoe',emoji:'👟',unrelated:true});
    return {id,age,index,config,name:story.name,pieces:shuffle(pieces,random),solution,reverse,instructions:`${reverse?'Retell backwards: choose what happened last, then work back to the beginning.':'Tell the story from start to finish.'}${age>=7?' One picture is unrelated; leave it out.':''}`};
  }
  if(id==='directions') {
    const size=config.grid,start=Math.floor(size/2)*size+Math.floor(size/2),commands=[],positions=[start];let position=start,last='';
    for(let i=0;i<config.directionSteps;i++) {
      const candidates=Object.keys(DIRECTIONS).filter(dir=>{const {dx,dy}=DIRECTIONS[dir],x=position%size+dx,y=Math.floor(position/size)+dy;return x>=0&&x<size&&y>=0&&y<size&&(i!==config.directionSteps-1||y*size+x!==start)&&(!last||dir!==({up:'down',down:'up',left:'right',right:'left'}[last]));});
      const next=shuffle(candidates,random)[0],{dx,dy}=DIRECTIONS[next];position+=dx+dy*size;commands.push(next);positions.push(position);last=next;
    }
    const opposite={up:'down',down:'up',left:'right',right:'left'},clockwise={up:'right',right:'down',down:'left',left:'up'},counterclockwise={up:'left',left:'down',down:'right',right:'up'},mirror={up:'up',down:'down',left:'right',right:'left'};
    const task=age<=6?'follow':age===7?'return':age===8?'rotate':age===9?'mirror':'rotate-return';
    const givenCommands=task==='return'?[...commands].reverse().map(value=>opposite[value]):task==='rotate'?commands.map(value=>counterclockwise[value]):task==='mirror'?commands.map(value=>mirror[value]):task==='rotate-return'?[...commands].reverse().map(value=>opposite[counterclockwise[value]]):commands;
    return {id,age,index,config,size,start,goal:position,commands,positions,givenCommands,task};
  }
  if(id==='make-a-shape') {
    const count=age===5?4:age===6?3:age>=8?4:config.vertices,angle=(count===4?-Math.PI/4:-Math.PI/2)+(age>=6?index%4*Math.PI/12:0);
    let vertices=Array.from({length:count},(_,i)=>({id:String(i),x:50+36*Math.cos(angle+i*Math.PI*2/count),y:50+36*Math.sin(angle+i*Math.PI*2/count)}));
    let name=({3:'triangle',4:'square',5:'pentagon',6:'hexagon'})[count];
    if(age===5||age===8||age===10&&index%2){vertices=[{id:'0',x:15,y:25},{id:'1',x:85,y:25},{id:'2',x:85,y:75},{id:'3',x:15,y:75}];name='rectangle';}
    if(age===9){vertices=[{id:'0',x:50,y:12},{id:'1',x:86,y:50},{id:'2',x:50,y:88},{id:'3',x:14,y:50}];name='rhombus';}
    const inner=[[50,40],[40,58],[60,58]].slice(0,age===3?1:age>=6?Math.max(1,config.decoys):0).map(([x,y],i)=>({id:String(count+i),x,y}));
    const objective=age<=4?`Build a ${name}.`:age===5?'Build a rectangle with two long and two short sides.':age===6?'Build a triangle, whatever way it is turned.':age===7?`Build a closed shape with ${count} straight sides.`:age===8?'Build a quadrilateral with four square corners.':age===9?'Build a rhombus: all four sides have equal length.':`Build ${name==='square'?'a rectangle with all four sides equal':'a rectangle with two long and two short sides'}.`;
    return {id,age,index,config,vertices,dots:[...vertices,...inner],name,objective,solution:vertices.map(v=>v.id)};
  }
  if(id==='rhythm') {
    const pads=BEATS.slice(0,config.beatPads),unit=shuffle(pads,random).slice(0,age<=3?2:age<=6?3:4);
    const forms=age<=3?[0,1]:age===4?[0,0,1]:age===5?[0,1,2]:age===6?[0,1,1,2]:[0,1,0,2,3];
    const sequence=Array.from({length:config.beatLength},(_,i)=>unit[forms[(i+index)%forms.length]%unit.length].id);
    const task=age<=6?'copy':age===7?'remember':age===8?'reverse':age===9?'swap':'reverse-swap';
    const swapped=sequence.map(value=>value==='clap'?'tap':value==='tap'?'clap':value),solution=task==='reverse'?[...sequence].reverse():task==='swap'?swapped:task==='reverse-swap'?[...swapped].reverse():sequence;
    return {id,age,index,config,pads,sequence,solution,task};
  }
  if(id==='sharing') {const groups=age<=4?2:age<=7?2+(index%2):3+(index%2),each=age===2?1:age===3?1+index%2:age===4?2+index%2:age===5?2+index%3:age===6?3+index%3:age===7?2+index%4:3+index%3,remainder=age>=9?1+index%(groups-1):0;const reasoning=age===9?{prompt:'How many more cookies would make one extra whole cookie for every friend?',answer:String(groups-remainder),choices:Array.from({length:groups},(_,i)=>String(i+1)),explanation:`One full round needs ${groups} cookies. There are ${remainder} left, so ${groups-remainder} more complete the round.`}:age===10?{prompt:`If the ${remainder} leftover ${remainder===1?'cookie is':'cookies are'} cut equally between ${groups} friends, what fraction of one extra cookie does each friend get?`,answer:`${remainder}/${groups}`,choices:Array.from({length:groups},(_,i)=>`${i+1}/${groups}`),explanation:`Split each leftover cookie into ${groups} equal parts. Each friend gets ${remainder} of those parts: ${remainder}/${groups} of a cookie.`}:null;return {id,age,index,config,friends:FRIENDS.slice(0,groups),each,remainder,total:groups*each+remainder,reasoning};}
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
function emoji(value,id) { const node=el('span','adventure-emoji');const art=id&&objectArt(id);if(art)node.innerHTML=art;else node.textContent=value;node.setAttribute('aria-hidden','true');return node; }
function flower(size) { const node=el('span','adventure-flower');node.innerHTML=objectArt('flower');node.style.width=`${size}px`;node.style.height=`${size}px`;node.style.display='inline-block';node.setAttribute('aria-hidden','true');return node; }
function progressStore() { const stored=readStore('adventures-progress-v1',{});return Object.fromEntries(ADVENTURE_IDS.map(id=>[id,Number.isSafeInteger(stored?.[id])?Math.max(0,Math.min(100000,stored[id])):0])); }
export function createAdventures(container,{getSettings,getTitle=()=>null,onBack=()=>{},onNotice=()=>{},onProgress=()=>{}}) {
  let active=false,id='size-order',profile=getProfile(getSettings()),state,progress=progressStore();const sessions=new Map();
  let audioEpoch=0,patternPlaying=false;
  const engine=createSoundEngine({onInterrupt:()=>suspendAudio()});
  function suspendAudio(){audioEpoch++;engine.suspend();patternPlaying=false;if(active&&id==='rhythm')render();}
  function playSounds(events){
    stopSpeaking();const token=++audioEpoch;
    return engine.play(events).then(result=>{
      if(token===audioEpoch&&active&&id==='rhythm'&&result.status==='failed')tell('Sound could not play. Check your device volume and try Listen again. You can still follow the pictures.','retry');
      return {status:token===audioEpoch?result.status:'cancelled'};
    });
  }
  container.classList.add('adventure-screen');
  container.innerHTML=`<header class="activity-header adventure-header"><button class="icon-button adventure-back" aria-label="Back to activities">←</button><div><p class="adventure-eyebrow">TRY A LITTLE ADVENTURE</p><h1 class="adventure-title"></h1></div><button class="icon-button adventure-hear" aria-label="Hear the instructions">♪</button></header><div class="adventure-main"><p class="adventure-round"></p><h2 class="adventure-objective" tabindex="-1"></h2><p class="adventure-instructions"></p><div class="adventure-play"></div><p class="adventure-status" role="status" aria-live="polite"></p><div class="adventure-footer"><button class="button adventure-hint">✦ Hint</button><button class="button adventure-retry">↶ Try again</button><button class="button button-primary adventure-next">Next <span aria-hidden="true">→</span></button></div></div>`;
  const $=selector=>container.querySelector(selector),play=$('.adventure-play'),status=$('.adventure-status');
  function say(text){if(active)requestSpeech(text);}
  function report(){onProgress({source:'adventures',completedCount:Object.values(progress).reduce((sum,count)=>sum+count,0)});}
  function fresh(index=getRoundCursor(id,profile.age,profile.challengeAge),round=buildAdventureRound(id,profile.challengeAge,index)){return{index,round,placed:[],path:['0'],position:round.start,step:0,done:false,reasoning:false,recorded:false,message:'',kind:'',showModel:false,ready:id!=='rhythm'||round.age<=6,sharing:{counts:Array(round.friends?.length||0).fill(0),leftover:0,remaining:round.total},moves:[]};}
  function session(){const key=`${id}:${profile.age}:${profile.challengeAge}`;if(!sessions.has(key))sessions.set(key,fresh());state=sessions.get(key);}
  function tell(text,kind=''){state.message=text;state.kind=kind;status.textContent=text;status.className=`adventure-status ${kind?`is-${kind}`:''}`;}
  function complete(text){state.done=true;completeRound();if(!state.recorded){state.recorded=true;progress[id]=Math.min(100000,progress[id]+1);writeStore('adventures-progress-v1',progress);report();}tell(`✓ ${text}`,'success');}
  function picture(piece){if(id!=='size-order')return emoji(piece.emoji,piece.id==='plane'?'paper-plane':piece.id);const node=el('span','adventure-measure');if(piece.measure){const diagram=el('span','adventure-measure-art');diagram.setAttribute('aria-hidden','true');diagram.style.width='64px';diagram.style.height='48px';diagram.innerHTML=state.round.metric==='length'?'<svg viewBox="0 0 100 70"><rect x="5" y="22" width="90" height="26" rx="3" fill="#e8bd56" stroke="#493b36" stroke-width="3"/><path d="M20 22v12m15-12v8m15-8v12m15-12v8m15-8v12" stroke="#493b36" stroke-width="3"/></svg>':'<svg viewBox="0 0 100 70"><rect x="10" y="12" width="80" height="46" fill="#d7eaf4" stroke="#31557b" stroke-width="4"/></svg>';node.append(diagram,el('strong','adventure-measure-label',piece.measure));}else node.append(flower(piece.size));return node;}
  function setObjective(title,instructions){$('.adventure-objective').textContent=title;$('.adventure-instructions').textContent=instructions;}
  function choosePiece(value){if(state.done)return;const next=sequenceStep(state.round.solution,state.placed,value);if(next===state.placed){recordMistake();tell(id==='size-order'?(state.round.metric==='size'?'Compare the flowers still waiting. Which size comes next?':`Compare the ${state.round.metric} measurements. Which belongs next?`):'Look at what happens before and after this step. Try another picture.','retry');return;}state.placed=next;if(next.length===state.round.solution.length)complete(id==='size-order'?(state.round.metric==='size'?'Your flowers are all in size order!':`Your ${state.round.metric} measurements are in order!`):'You put the whole story in order!');else tell('That fits. What comes next?');render();}
  function renderOrdering(){
    const round=state.round;
    setObjective(id==='size-order'?round.objective:round.name,round.instructions+(id==='size-order'&&round.age>=6?' Use the measurements; diagrams are not to scale.':''));
    if(state.showModel){const model=el('div','adventure-model');model.setAttribute('aria-label','Order to explore together');round.solution.forEach(value=>{const piece=round.pieces.find(item=>item.id===value),slot=el('div','adventure-model-piece');slot.append(picture(piece));if(id==='picture-sequence')slot.append(el('span','',piece.name));model.append(slot);});play.append(model);}
    const slots=el('div','adventure-order-slots');round.solution.forEach((_,index)=>{const slot=el('div','adventure-order-slot');slot.setAttribute('aria-label',`Position ${index+1}`);slot.append(el('span','adventure-slot-number',String(index+1)));const piece=round.pieces.find(piece=>piece.id===state.placed[index]);if(piece)slot.append(picture(piece));else slot.append(el('span','adventure-placeholder',index===state.placed.length?'?':'·'));slots.append(slot);});play.append(slots);
    const choices=el('div',`adventure-pieces ${id==='picture-sequence'?'adventure-story-pieces':''}`);round.pieces.forEach((piece,index)=>{const node=btn('', 'adventure-piece',()=>choosePiece(piece.id));node.dataset.piece=piece.id;node.setAttribute('aria-label',id==='size-order'&&!piece.measure?`Flower in spot ${index+1}`:piece.name);node.disabled=state.placed.includes(piece.id)||state.done;node.append(picture(piece),el('span','',id==='size-order'?piece.measure?'Measurement':'Flower':piece.name));choices.append(node);});play.append(choices);
  }
  function direction(value){if(state.done)return;const round=state.round;if(round.commands[state.step]!==value){recordMistake();tell('Check the route rule and try another direction. Hint can help when you choose it.','retry');return;}state.step++;state.position=round.positions[state.step];if(state.step===round.commands.length)complete('You followed the directions all the way to the star!');else tell('One step closer. Use the route rule for your next move.');render();}
  function renderDirections(){
    const round=state.round;const rules={follow:'Follow the arrows in order. One arrow means one square.',return:'These arrows describe the outward trip. Make the return trip: reverse their order and use each opposite direction.',rotate:'Turn every shown arrow a quarter-turn clockwise, then follow your new route.',mirror:'Reflect the shown route left to right: swap left and right; keep up and down.', 'rotate-return':'First make the return route (reverse order and opposite directions). Then turn that route a quarter-turn clockwise.'};setObjective('Help Fox reach the star.',rules[round.task]);
    const clues=el('div','adventure-directions-clues');round.givenCommands.forEach((value,index)=>{const completed=(round.task==='return'||round.task==='rotate-return'?round.givenCommands.length-1-index:index)<state.step;const node=el('span',`adventure-direction-clue ${completed?'is-done':''} ${round.task==='follow'&&index===state.step?'is-current':''}`,DIRECTIONS[value].symbol);node.setAttribute('aria-label',`${index+1}: ${value}${completed?', done':''}`);clues.append(node);});play.append(clues);
    const grid=el('div','adventure-direction-grid');grid.style.setProperty('--grid',round.size);grid.setAttribute('aria-label','Fox map');for(let i=0;i<round.size**2;i++){const cell=el('div','adventure-direction-cell');if(i===state.position||i===round.goal){cell.innerHTML=objectArt(i===state.position?'fox':'star');cell.querySelector('svg').style.width='80%';cell.querySelector('svg').style.height='80%';}cell.dataset.position=String(i);cell.dataset.current=String(i===state.position);grid.append(cell);}play.append(grid);
    const controls=el('div','adventure-arrows');Object.entries(DIRECTIONS).forEach(([value,{symbol}])=>{const node=btn(symbol,`button adventure-arrow adventure-${value}`,()=>direction(value));node.dataset.direction=value;node.setAttribute('aria-label',`Move ${value}`);node.disabled=state.done;controls.append(node);});play.append(controls);
  }
  function vertex(value){if(state.done)return;const next=shapeStep(state.round,state.path,value);if(next===state.path){recordMistake();tell('Go around the outside edge. Skip the dots inside the shape.','retry');return;}state.path=next;if(next.length===state.round.vertices.length+1)complete(`You built a ${state.round.name} with ${state.round.vertices.length} sides!`);else tell(next.length===state.round.vertices.length?'One last side: return to the starting dot.':'Keep joining the outside corners.');render();}
  function renderShape(){
    const round=state.round;setObjective(round.objective,'Start at the star. Choose corners that fit the rule and close the shape. Hint can show its outline.');
    const plane=el('div','adventure-shape-plane'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
    const outline=document.createElementNS(svg.namespaceURI,'polygon');outline.setAttribute('points',round.vertices.map(v=>`${v.x},${v.y}`).join(' '));outline.setAttribute('class','adventure-shape-guide');if(state.showModel)svg.append(outline);
    const trail=document.createElementNS(svg.namespaceURI,'polyline');trail.setAttribute('points',state.path.map(id=>round.vertices.find(v=>v.id===id)).map(v=>`${v.x},${v.y}`).join(' '));trail.setAttribute('class','adventure-shape-trail');svg.append(trail);plane.append(svg);
    round.dots.forEach(dot=>{const node=btn(dot.id==='0'?'★':round.age<=5?String(Number(dot.id)+1):'●',`adventure-vertex ${state.path.at(-1)===dot.id?'is-current':''}`,()=>vertex(dot.id));node.dataset.vertex=dot.id;node.setAttribute('aria-label',`Dot ${Number(dot.id)+1}${dot.id==='0'?', start':''}`);node.style.left=`${dot.x}%`;node.style.top=`${dot.y}%`;node.disabled=state.done;plane.append(node);});play.append(plane,el('p','adventure-note',`${Math.min(state.path.length-1,round.vertices.length)} of ${round.vertices.length} sides joined`));
  }
  function beat(value){
    if(state.done||!state.ready||patternPlaying)return;
    playSounds([{kind:value,duration:.24}]);
    const next=sequenceStep(state.round.solution,state.placed,value);
    if(next===state.placed){recordMistake();tell('Take your time. Look at the next picture, or use Hint to see the pattern.','retry');return;}
    state.placed=next;
    if(next.length===state.round.solution.length){
      const text='You played the whole pattern at your own pace!';complete(text,false);

    }else tell('Keep your pattern going.');render();
  }
  function renderRhythm(){
    const round=state.round;const rule=({copy:'Copy the picture pattern.',remember:'Remember and copy the pattern.',reverse:'Play the pattern in reverse order.',swap:'Copy the order, but swap Clap and Tap. Keep Stomp and Rest unchanged.','reverse-swap':'Play in reverse order and swap Clap with Tap. Keep Stomp and Rest unchanged.'})[round.task];setObjective(rule,state.ready?'Use the rule to play. Each action has its own sound; Rest is quiet. There is no timing score.':'Study or listen to the pattern, then tap Ready. Use the rule above for your response.');
    const controls=el('div','adventure-audio-controls');
    const listen=btn(patternPlaying?'Stop pattern':'Listen to pattern','button adventure-listen',()=>{
      if(patternPlaying){suspendAudio();return;}
      const played=playSounds(round.sequence.map((kind,i)=>({kind,time:i*.55,duration:.24}))),token=audioEpoch;
      patternPlaying=true;render();played.then(result=>{if(token!==audioEpoch||!active||id!=='rhythm')return;patternPlaying=false;render();if(result.status==='played')tell('Your turn. Follow the pictures or try remembering the pattern.');});
    });controls.append(listen);play.append(controls,el('p','adventure-note','Use your device’s volume buttons for sound.'));
    const sequence=el('div','adventure-beat-sequence');round.sequence.forEach((value,index)=>{const shown=state.showModel||index<state.placed.length?round.solution[index]:value,pad=round.pads.find(pad=>pad.id===shown),visible=round.age<=6||!state.ready||state.showModel||index<state.placed.length;const node=el('span',`adventure-beat-token ${index<state.placed.length?'is-done':''} ${index===state.placed.length?'is-current':''}`,visible?pad.emoji:'·');if(visible){node.replaceChildren(emoji(pad.emoji,pad.id));}node.dataset.step=String(index);node.setAttribute('aria-label',visible?`${index+1}: ${pad.name}`:`Step ${index+1}, hidden`);sequence.append(node);});play.append(sequence);
    if(!state.ready)play.append(btn('Ready · try the pattern','button button-primary adventure-ready',()=>{state.ready=true;state.showModel=false;tell('Play what you remember. Hint can show the pattern again.');render();}));
    const pads=el('div','adventure-beat-pads');round.pads.forEach(pad=>{const node=btn('','adventure-beat-pad',()=>beat(pad.id));node.dataset.beat=pad.id;node.setAttribute('aria-label',pad.name);node.disabled=!state.ready||state.done||patternPlaying;node.append(emoji(pad.emoji,pad.id),el('strong','',pad.name));pads.append(node);});play.append(pads);
    if(round.pads.length===4)play.append(el('p','adventure-note','Rest means a quiet moment. Tap the hand when the pattern shows it.'));
  }
  function give(basket){if(state.done||state.reasoning)return;const next=sharingStep(state.round,state.sharing,basket);if(next===state.sharing){tell('All the cookies have a place. Check your shares or undo a cookie.');return;}state.moves.push(basket);state.sharing=next;tell(`${next.remaining} ${next.remaining===1?'cookie still needs':'cookies still need'} a place.`);render();}
  function renderSharing(){
    const round=state.round;setObjective(`Share ${round.total} cookies fairly.`,round.remainder?'Give every friend the same amount. Put any cookies that cannot make another equal round into Left over.':'Tap a friend to give one cookie. Give everyone the same amount.');
    const pool=el('div','adventure-cookie-pool');pool.setAttribute('aria-label',`${state.sharing.remaining} cookies to share`);for(let i=0;i<state.sharing.remaining;i++)pool.append(emoji('🍪','cookie'));if(!state.sharing.remaining)pool.append(el('span','','Every cookie has a place'));play.append(pool);
    const baskets=el('div','adventure-share-baskets');round.friends.forEach((friend,index)=>{const node=btn('','adventure-share-basket',()=>give(String(index)));node.dataset.basket=String(index);node.setAttribute('aria-label',`Give a cookie to ${friend.name}`);node.disabled=state.done||state.reasoning;node.append(emoji(friend.emoji,friend.name.toLowerCase()),el('strong','',friend.name));const treats=el('span','adventure-cookies');for(let i=0;i<state.sharing.counts[index];i++)treats.append(emoji('🍪','cookie'));if(state.showModel)for(let i=state.sharing.counts[index];i<round.each;i++)treats.append(el('span','adventure-cookie-guide','○'));node.append(treats,el('span','adventure-cookie-count',String(state.sharing.counts[index])));baskets.append(node);});
    if(round.remainder){const node=btn('','adventure-share-basket adventure-leftover',()=>give('leftover'));node.dataset.basket='leftover';node.setAttribute('aria-label','Put a cookie in Left over');node.disabled=state.done||state.reasoning;node.append(emoji('🫙'),el('strong','','Left over'),el('span','',`${state.sharing.leftover} cookies`));baskets.append(node);}play.append(baskets);
    if(state.reasoning){const panel=el('section','adventure-share-question');panel.append(el('h3','',round.reasoning.prompt));const choices=el('div','adventure-share-actions');for(const value of round.reasoning.choices){const choice=btn(value,'button adventure-reasoning-choice',()=>{if(state.done)return;if(value===round.reasoning.answer){complete(round.reasoning.explanation);render();}else {recordMistake();tell('Check how the leftovers relate to the number of friends. Try again or ask for a hint.','retry');}});choice.dataset.basket=`reason-${value}`;choice.disabled=state.done;choices.append(choice);}panel.append(choices);play.append(panel);}
    const actions=el('div','adventure-share-actions');const undo=btn('↶ Undo a cookie','button adventure-share-undo',()=>{const basket=state.moves.pop();if(basket==='leftover')state.sharing.leftover--;else state.sharing.counts[Number(basket)]--;state.sharing.remaining++;state.done=false;state.reasoning=false;tell('One cookie is back. Try a different friend.');render();});undo.disabled=!state.moves.length;const check=btn('Check the shares','button button-primary adventure-check',()=>{if(fairSharing(round,state.sharing)){if(round.reasoning){state.reasoning=true;tell('The whole shares are equal. Now use the leftovers to solve one more question.');}else complete(`Fair shares! Each friend has ${round.each}.`);render();}else {recordMistake();tell(state.sharing.remaining?'Keep sharing the cookies that are waiting.':'Compare the friends. Fair shares means the same amount for everyone. Undo a cookie or ask for a hint.','retry');}});check.disabled=state.done||state.reasoning;actions.append(undo,check);play.append(actions);
  }
  function render(){beginRound({mode:id,age:profile.age,step:profile.challengeAge,roundKey:String(state.index)});
    $('.adventure-title').textContent=getTitle() || ADVENTURE_TITLES[id];$('.adventure-round').textContent=`${profile.name} · round ${state.index+1}`;$('.adventure-hear').disabled=!canSpeak();play.replaceChildren();container.dataset.adventure=id;
    if(id==='size-order'||id==='picture-sequence')renderOrdering();else if(id==='directions')renderDirections();else if(id==='make-a-shape')renderShape();else if(id==='rhythm')renderRhythm();else renderSharing();
    tell(state.message||'Explore one step at a time. Hint is here whenever you need it.',state.kind);$('.adventure-next').classList.toggle('is-ready',state.done);
  }
  function hint(){
    if(!active||state.done)return;recordHint();suspendAudio();const round=state.round;let text='',target;
    if(id==='size-order'||id==='picture-sequence'){state.showModel=true;render();const piece=round.pieces.find(piece=>piece.id===round.solution[state.placed.length]);target=`[data-piece="${piece.id}"]`;text=id==='size-order'?(round.metric==='size'?`Compare the flowers still waiting. Choose the ${round.descending?'largest':'smallest'} one next.`:`Work out each ${round.metric}. Choose the ${round.descending?'greatest':'least'} remaining ${round.metric}; the outlined card comes next.`):`Next: ${piece.name.toLowerCase()}. Follow the picture story above.`;}
    else if(id==='directions'){const direction=round.commands[state.step];target=`[data-direction="${direction}"]`;text=`The next arrow points ${direction}. Tap that arrow once.`;}
    else if(id==='make-a-shape'){state.showModel=true;render();const direction=state.path.length===1?1:Number(state.path[1])===1?1:-1,next=(Number(state.path.at(-1))+direction+round.vertices.length)%round.vertices.length;target=`[data-vertex="${next}"]`;text=state.path.length===round.vertices.length?'Close the shape by returning to the starting star.':'Follow the outline around the outside. The outlined corner comes next.';}
    else if(id==='rhythm'){state.showModel=true;render();const pad=round.pads.find(pad=>pad.id===round.solution[state.placed.length]);target=`[data-beat="${pad.id}"]`;text=`Look at the pattern again. ${pad.name} comes next. Play at your own pace.`;}
    else if(state.reasoning){target=`[data-basket="reason-${round.reasoning.answer}"]`;text=round.reasoning.explanation;}
    else {state.showModel=true;render();const smallest=Math.min(...state.sharing.counts),index=smallest<round.each?state.sharing.counts.indexOf(smallest):-1;target=index>=0?`[data-basket="${index}"]`:'[data-basket="leftover"]';text=`Give one to each friend in turn. Each friend needs ${round.each}${round.remainder?`, and ${round.remainder} stay in Left over`:''}. You can undo cookies to make the shares equal.`;}
    play.querySelectorAll('.is-hint').forEach(node=>node.classList.remove('is-hint'));play.querySelector(target)?.classList.add('is-hint');tell(text,'hint');
  }
  function clearHints(){
    stopSpeaking();if(!active)return;
    state.showModel=false;
    if(state.kind==='hint'){state.message='Keep working at your own pace.';state.kind='';}
    suspendAudio();if(id!=='rhythm')render();
  }
  $('.adventure-back').addEventListener('click',onBack);$('.adventure-hear').addEventListener('click',()=>{suspendAudio();say(`${$('.adventure-objective').textContent} ${$('.adventure-instructions').textContent}`);});$('.adventure-hint').addEventListener('click',hint);
  $('.adventure-next').addEventListener('click',()=>{suspendAudio();state=fresh(state.index+1);sessions.set(`${id}:${profile.age}:${profile.challengeAge}`,state);render();$('.adventure-objective').focus({preventScroll:true});});
  $('.adventure-retry').addEventListener('click',()=>{suspendAudio();const recorded=state.recorded;state=fresh(state.index,state.round);state.recorded=recorded;sessions.set(`${id}:${profile.age}:${profile.challengeAge}`,state);render();tell('A fresh start. Take it one step at a time.');});
  document.addEventListener('keydown',event=>{if(!active||id!=='directions'||event.target.closest?.('dialog,input,select,textarea'))return;const value={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];if(value){event.preventDefault();direction(value);}});
  report();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendAudio();});
  globalThis.addEventListener?.('pagehide',suspendAudio);globalThis.addEventListener?.('doodle-native-inactive',suspendAudio);
  return {open(next){if(!ADVENTURE_IDS.includes(next))throw new Error(`Unknown adventure: ${next}`);active=true;id=next;profile=getProfile(getSettings());session();render();},close(){active=false;suspendAudio();stopSpeaking();},settingsChanged(){const next=getProfile(getSettings()),changed=next.challengeAge!==profile.challengeAge||next.age!==profile.age;profile=next;if(!getSettings().sound)stopSpeaking();if(active){if(changed){suspendAudio();session();render();}else $('.adventure-hear').disabled=!canSpeak();}},hint,clearHints,suspendAudio};
}
