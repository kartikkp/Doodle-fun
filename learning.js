import {getProfile, readStore, writeStore} from './core.js';
import {getLearningItems, evaluateTrace, samplePath, pathLength, buildQuantityQuestion} from './learning-data.js';

const SVG_NS='http://www.w3.org/2000/svg';
const SETS=[['shapes','First lines'],['upper','ABC'],['lower','abc'],['words','Words'],['nums','123']];
const STORE_KEY='learning-progress-v1';
function element(tag,className,text) {
  const node=document.createElement(tag);
  if(className) node.className=className;
  if(text!==undefined) node.textContent=text;
  return node;
}
function button(text,className,action) {
  const node=element('button',className,text);node.type='button';node.addEventListener('click',action);return node;
}
function svgElement(tag,attrs={}) {
  const node=document.createElementNS(SVG_NS,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  return node;
}
function pathData(points) {return points.map(([x,y],i)=>`${i?'L':'M'}${x*1000},${y*1000}`).join(' ');}
function safeProgress() {
  const value=readStore(STORE_KEY,{});
  if(!value || typeof value!=='object' || Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value).filter(([key,value])=>
    /^(shapes|upper|lower|words|nums|count|add|groups):[a-zA-Z0-9-]+$/.test(key) && value===true).slice(0,250));
}

export function createLearning(container,{getSettings,onBack=()=>{},onNotice=()=>{},onProgress=()=>{}}) {
  let opened=false,kind='letters',set=null,index=0,ink=[],activePointer=null,activePath=null,done=false;
  let animation=0,demoRunning=false,profile=getProfile(getSettings()),saved=safeProgress();
  let svg,inkLayer,guideLayer,markers,trail,status,checkButton,showButton,clearButton,prevButton,nextButton,picker,itemLabel,example;
  let countValue=0,countMode='count',countRound=0,countAnswered=false,countMarked=new Map(),countButtons=[];
  let pageMode='trace';
  const report=()=>onProgress({completedCount:Object.keys(saved).length});
  const item=()=>getLearningItems(set)[index];
  const key=()=>`${set}:${item().ch}`;
  const mark=progressKey=>{if(!saved[progressKey]){saved[progressKey]=true;writeStore(STORE_KEY,saved);report();}};
  const speak=text=>{
    if(!getSettings().sound || !('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(text);speech.rate=.82;speech.lang='en-US';window.speechSynthesis.speak(speech);
  };
  const stopSpeech=()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();};
  function stopDemo() {
    cancelAnimationFrame(animation);animation=0;demoRunning=false;
    if(trail)trail.replaceChildren();
    if(showButton){showButton.textContent='▶ Show me';showButton.setAttribute('aria-pressed','false');}
  }
  function releasePointer() {
    const pointer=activePointer;activePointer=null;activePath=null;
    if(svg && pointer!==null && svg.hasPointerCapture?.(pointer))svg.releasePointerCapture(pointer);
  }
  function clearTransient() {stopDemo();releasePointer();stopSpeech();}
  function updateStatus(text,success=false) {
    if(!status)return;
    status.textContent=text;status.classList.toggle('is-complete',success);
  }
  function tracingHint() {
    const current=item();
    if(saved[key()])return `You practiced ${current.label||current.ch}! Try it again, or pick the next one.`;
    return set==='shapes'?'Start at 1 and follow the soft path. Take your time.':'Start at each number. Follow the soft paths with your finger or Pencil.';
  }
  function render() {
    clearTransient();container.replaceChildren();container.classList.add('learning-screen');
    const header=element('header','activity-header learn-header');
    const back=button('← Home','button learn-back',()=>{close();onBack();});back.setAttribute('aria-label','Back to home');
    const heading=element('div','learn-heading');heading.append(element('p','learn-eyebrow',kind==='numbers'?'COUNT • NOTICE • LEARN':'TRACE • DISCOVER • GROW'),element('h1','',kind==='numbers'?'Number explorers':'Letter adventures'));
    const support=element('span','learn-support',`${profile.name} · No rush`);
    header.append(back,heading,support);container.append(header);
    const body=element('div','activity-body learn-body');
    if(kind==='numbers') {
      const modes=element('div','learn-tabs');modes.setAttribute('role','group');modes.setAttribute('aria-label','Number activities');
      for(const [value,label]of [['count','Count & play'],['trace','Trace numbers']]) {
        const tab=button(label,'button learn-tab',()=>{pageMode=value;ink=[];done=false;render();});tab.setAttribute('aria-pressed',String(pageMode===value));modes.append(tab);
      }
      body.append(modes);
    }
    container.append(body);
    if(pageMode==='count')renderCount(body);else renderTrace(body);
  }
  function renderTrace(body) {
    const tabs=element('div','learn-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Practice sets');
    for(const [value,label]of SETS) {
      const tab=button(label,'button learn-tab',()=>{set=value;index=0;ink=[];done=false;render();});
      tab.setAttribute('aria-pressed',String(set===value));tab.dataset.learnSet=value;tabs.append(tab);
    }
    body.append(tabs);
    const layout=element('div','learn-trace-layout'),workspace=element('section','learn-trace-card'),side=element('aside','learn-side');
    workspace.setAttribute('aria-label','Tracing practice');
    const top=element('div','learn-card-heading');itemLabel=element('h2','learn-item-title');example=element('p','learn-example');top.append(itemLabel,example);workspace.append(top);
    const board=element('div','learn-board');
    svg=svgElement('svg',{viewBox:'0 0 1000 1000',preserveAspectRatio:'xMidYMid meet','aria-label':'Trace the guide with a finger or Pencil',role:'img','data-testid':'trace-board'});
    const guides=svgElement('g',{'aria-hidden':'true'});
    for(const y of set==='words'?[362,462,594,654]:set==='lower'?[180,430,760,910]:[180,500,820])guides.append(svgElement('line',{x1:100,x2:900,y1:y,y2:y,stroke:'#e7edf5','stroke-width':3,'stroke-dasharray':y===500||y===430||y===462?'12 14':'none'}));
    guideLayer=svgElement('g',{'class':'learn-guide-layer'});inkLayer=svgElement('g',{'class':'learn-ink-layer'});trail=svgElement('g',{'class':'learn-demo-layer'});markers=svgElement('g',{'class':'learn-marker-layer'});
    svg.append(guides,guideLayer,inkLayer,trail,markers);board.append(svg);workspace.append(board);
    const tools=element('div','learn-tools');
    showButton=button('▶ Show me','button',()=>demoRunning?stopDemo():showDemo());showButton.setAttribute('aria-pressed','false');
    clearButton=button('↺ Start again','button',()=>{stopDemo();releasePointer();ink=[];done=false;drawInk();paintMarkers();updateStatus(tracingHint());checkButton.disabled=false;});
    checkButton=button('Check tracing','button button-primary',()=>checkTrace(true));
    tools.append(showButton,clearButton,checkButton);workspace.append(tools);
    status=element('p','learn-feedback');status.setAttribute('role','status');status.setAttribute('aria-live','polite');workspace.append(status);
    const sideTitle=element('div','learn-side-title');sideTitle.append(element('h2','',set==='shapes'?'Pick a path':set==='words'?'Try a word':'Pick your next one'),element('span','learn-subtle','Every set is open to explore'));
    side.append(sideTitle);
    picker=element('div','learn-picker');picker.setAttribute('role','group');picker.setAttribute('aria-label','Choose what to trace');
    getLearningItems(set).forEach((current,i)=>{
      const choice=button(current.label||current.ch,'learn-choice',()=>selectItem(i));choice.dataset.learnItem=current.ch;picker.append(choice);
    });side.append(picker);
    const help=element('div','learn-help');help.append(element('span','learn-help-icon','✦'),element('h3','','Small steps, big discoveries'),element('p','',set==='words'?'Trace each letter, then say the whole word. Lift your finger between numbered strokes.':'Follow one path at a time. Lift your finger between strokes. A little practice is a big win.'));
    if(getSettings().sound && 'speechSynthesis' in window)help.append(button('♪ Hear it','button learn-listen',()=>speak(set==='shapes'?item().word:set==='words'?`The word is ${item().word}. ${[...item().ch].join(', ')}.`:`${item().ch}. ${item().word}.`)));
    side.append(help);
    const navigation=element('div','learn-navigation');
    prevButton=button('← Previous','button',()=>selectItem(index-1));nextButton=button('Next →','button button-primary',()=>selectItem(index+1));navigation.append(prevButton,nextButton);side.append(navigation);
    layout.append(workspace,side);body.append(layout);
    svg.addEventListener('pointerdown',pointerDown);svg.addEventListener('pointermove',pointerMove);svg.addEventListener('pointerup',pointerUp);svg.addEventListener('pointercancel',pointerCancel);svg.addEventListener('lostpointercapture',pointerCancel);
    paintItem();
  }
  function selectItem(newIndex) {
    if(newIndex<0||newIndex>=getLearningItems(set).length)return;
    clearTransient();index=newIndex;ink=[];done=false;paintItem();
    picker.children[index]?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  }
  function paintItem() {
    const current=item();
    itemLabel.textContent=set==='shapes'?current.label:set==='words'?`Write “${current.ch}”`:`Trace ${current.ch}`;
    example.textContent=set==='nums'?`${current.word} · ${current.ch==='0'?'an empty group':`${current.ch} ${current.ch==='1'?'dot':'dots'}`}`:`${current.em} ${current.word}`;
    guideLayer.replaceChildren(...current.strokes.map(path=>svgElement('path',{d:pathData(path),fill:'none',stroke:'#e1dffb','stroke-width':traceTolerance()*1500,'stroke-linecap':'round','stroke-linejoin':'round'})));
    drawInk();paintMarkers();
    [...picker.children].forEach((choice,i)=>{
      const record=getLearningItems(set)[i],practiced=Boolean(saved[`${set}:${record.ch}`]);
      choice.classList.toggle('is-practiced',practiced);choice.setAttribute('aria-pressed',String(i===index));choice.setAttribute('aria-label',`${record.label||record.ch}${practiced?', practiced':''}`);
    });
    prevButton.disabled=index===0;nextButton.disabled=index===getLearningItems(set).length-1;checkButton.disabled=done;
    updateStatus(done?'Beautiful practice! Your paths are complete. Pick another when you’re ready.':tracingHint(),done);
  }
  function traceTolerance(){return profile.traceTolerance*(set==='words'?.55:1);}
  function paintMarkers() {
    markers.replaceChildren();if(done)return;
    const starts=item().strokes.map(path=>path[0]),placed=[],radius=set==='words'?30:36;
    starts.forEach(([x,y],i)=>{
      const close=starts.filter(([otherX,otherY])=>Math.hypot(x-otherX,y-otherY)<radius*.0025);
      let cx=x*1000,cy=y*1000;
      if(close.length>1) {
        const rank=starts.slice(0,i).filter(([otherX,otherY])=>Math.hypot(x-otherX,y-otherY)<radius*.0025).length;
        cx+=(rank-(close.length-1)/2)*(radius*2+10);cy-=radius*1.7;
      }
      while(placed.some(point=>Math.hypot(cx-point[0],cy-point[1])<radius*2+7))cy-=radius*2+10;
      placed.push([cx,cy]);
      if(Math.hypot(cx-x*1000,cy-y*1000)>1)markers.append(svgElement('line',{x1:cx,y1:cy,x2:x*1000,y2:y*1000,stroke:'#8c83c8','stroke-width':4}));
      markers.append(svgElement('circle',{cx,cy,r:radius,fill:'#5754d6',stroke:'white','stroke-width':5}));
      const label=svgElement('text',{x:cx,y:cy+1,'text-anchor':'middle','dominant-baseline':'central',fill:'white','font-size':set==='words'?38:42,'font-weight':800});label.textContent=String(i+1);markers.append(label);
    });
  }
  function drawInk() {
    inkLayer.replaceChildren(...ink.map(path=>svgElement('path',{d:pathData(path.length===1?[path[0],[path[0][0]+.0001,path[0][1]]]:path),fill:'none',stroke:'#5754d6','stroke-width':set==='words'?12:profile.tier==='little'?25:19,'stroke-linecap':'round','stroke-linejoin':'round'})));
  }
  function position(event) {
    const rect=svg.getBoundingClientRect(),side=Math.min(rect.width,rect.height),x=(event.clientX-rect.left-(rect.width-side)/2)/side,y=(event.clientY-rect.top-(rect.height-side)/2)/side;
    // Keep true out-of-board coordinates: clamping would turn an off-canvas
    // scribble into valid edge ink. The SVG clips their visual representation.
    return [x,y];
  }
  function pointerDown(event) {
    if(activePointer!==null||event.isPrimary===false||event.button!==0||done)return;
    event.preventDefault();stopDemo();activePointer=event.pointerId;svg.setPointerCapture(event.pointerId);activePath=[position(event)];ink.push(activePath);drawInk();
  }
  function pointerMove(event) {
    if(event.pointerId!==activePointer||!activePath)return;
    event.preventDefault();
    const events=event.getCoalescedEvents?.()||[event];
    for(const sample of events.length?events:[event]) {
      const point=position(sample),last=activePath.at(-1);
      if(Math.hypot(point[0]-last[0],point[1]-last[1])>.002)activePath.push(point);
    }
    drawInk();
  }
  function pointerUp(event) {
    if(event.pointerId!==activePointer)return;
    pointerMove(event);releasePointer();checkTrace(false);
  }
  function pointerCancel(event) {
    if(event.pointerId!==activePointer)return;
    // A cancelled gesture is discarded so OS navigation or rotation cannot
    // accidentally earn credit for an unfinished stroke.
    if(activePath)ink=ink.filter(path=>path!==activePath);
    releasePointer();drawInk();
  }
  function checkTrace(explicit) {
    if(done)return;
    const result=evaluateTrace(item().strokes,ink,{tolerance:traceTolerance(),coverage:profile.traceCoverage,precision:profile.tracePrecision});
    if(result.passed) {
      done=true;mark(key());paintItem();updateStatus('Beautiful practice! Your paths are complete. Pick another when you’re ready.',true);return;
    }
    if(explicit) {
      if(result.reason==='precision'||result.reason==='extra-ink')updateStatus('Good exploring! Tap Start again, then follow the soft paths slowly.');
      else if(!ink.length||result.reason==='keep-going')updateStatus('You can do it. Start at 1 and follow the path all the way.');
      else updateStatus(`${result.completed} of ${item().strokes.length} paths traced. Follow the remaining soft paths to finish.`);
    } else if(result.completed)updateStatus(`${result.completed} of ${item().strokes.length} paths traced. Keep going at your own pace.`);
  }
  function showDemo() {
    releasePointer();stopDemo();demoRunning=true;showButton.textContent='■ Stop guide';showButton.setAttribute('aria-pressed','true');
    const paths=item().strokes.map(path=>samplePath(path,.007));
    const total=paths.reduce((sum,path)=>sum+pathLength(path),0),duration=Math.max(2500,Math.min(9000,total*2400));
    const start=performance.now(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    updateStatus('Watch the glowing path. Start at each number and follow along when you’re ready.');
    if(reduced) {
      trail.replaceChildren(...paths.map(path=>svgElement('path',{d:pathData(path),fill:'none',stroke:'#159b83','stroke-width':set==='words'?13:22,'stroke-linecap':'round','stroke-linejoin':'round'})));
      updateStatus('Follow the green paths from each number. Tap Stop guide when you’re ready.');return;
    }
    const tick=now=>{
      if(!opened||!demoRunning)return;
      const amount=Math.min(1,(now-start)/duration),progress=amount*total;let used=0;
      trail.replaceChildren();
      for(const path of paths) {
        const length=pathLength(path),fraction=Math.max(0,Math.min(1,(progress-used)/length));used+=length;
        if(fraction<=0)continue;
        const partial=path.slice(0,Math.max(2,Math.ceil(path.length*fraction)));
        trail.append(svgElement('path',{d:pathData(partial),fill:'none',stroke:'#159b83','stroke-width':set==='words'?13:22,'stroke-linecap':'round','stroke-linejoin':'round'}));
        if(fraction<1&&!reduced){const [x,y]=partial.at(-1);trail.append(svgElement('circle',{cx:x*1000,cy:y*1000,r:19,fill:'#ffcb66',stroke:'white','stroke-width':5}));}
      }
      if(amount<1)animation=requestAnimationFrame(tick);else{stopDemo();updateStatus('Your turn! Start at 1. You can watch the guide again any time.');}
    };
    animation=requestAnimationFrame(tick);
  }
  function nextCount() {
    countRound++;countValue=(countValue+(profile.numberMax<=5?1:5))%(profile.numberMax+1);countAnswered=false;countMarked.clear();render();
  }
  function renderCount(body) {
    const layout=element('div','learn-count-layout'),card=element('section','learn-count-card'),side=element('aside','learn-count-side');
    const modeButtons=element('div','learn-tabs');modeButtons.setAttribute('role','group');modeButtons.setAttribute('aria-label','Choose number challenge');
    for(const [mode,label]of [['count','Count dots'],['add','Add together'],['groups','Equal groups']]) {
      const choice=button(label,'button learn-tab',()=>{countMode=mode;countAnswered=false;countMarked.clear();render();});choice.setAttribute('aria-pressed',String(countMode===mode));modeButtons.append(choice);
    }
    card.append(modeButtons);
    const variant=countRound+(profile.tier==='maker'&&countMode==='groups'?7:0);
    const question=buildQuantityQuestion(countValue,countMode,profile.numberMax,variant);
    card.append(element('p','learn-eyebrow',`NUMBER DETECTIVE · ROUND ${countRound+1}`),element('h2','learn-count-prompt',question.prompt));
    const frames=element('div','learn-count-frames');frames.dataset.testid='quantity-frame';frames.dataset.quantity=String(question.answer);
    let dotOffset=0;
    const frame=(value)=>{
      const box=element('div','learn-dot-frame');box.setAttribute('role','group');box.setAttribute('aria-label',value===0?'An empty dot frame':'Dots to count');
      if(value===0)box.append(element('span','learn-empty-frame','Empty!'));
      for(let i=0;i<value;i++) {
        const dotIndex=dotOffset++,dot=button(countMarked.has(dotIndex)?String(countMarked.get(dotIndex)):'','learn-count-dot',()=>{
          if(countMarked.has(dotIndex))return;
          countMarked.set(dotIndex,countMarked.size+1);dot.textContent=String(countMarked.size);dot.classList.add('is-counted');dot.setAttribute('aria-pressed','true');dot.setAttribute('aria-label',`Counted ${countMarked.size}`);
        });
        dot.setAttribute('aria-label',countMarked.has(dotIndex)?`Counted ${countMarked.get(dotIndex)}`:`Count dot ${dotIndex+1}`);dot.setAttribute('aria-pressed',String(countMarked.has(dotIndex)));dot.classList.toggle('is-counted',countMarked.has(dotIndex));box.append(dot);
      }
      return box;
    };
    if(countMode==='groups') {
      frames.classList.add('learn-equal-groups');
      for(let group=0;group<question.groups;group++) {
        const wrapper=element('div','learn-equal-group');wrapper.append(element('p','',`Group ${group+1}`),frame(question.each));frames.append(wrapper);
      }
    }else if(countMode==='add'){frames.classList.add('learn-add-frames');frames.append(frame(question.left),element('span','learn-count-plus','+'),frame(question.right));}else frames.append(frame(question.answer));
    card.append(frames,element('p','learn-count-hint',question.answer===0?'An empty group has zero things.':'Tip: tap each dot as you count.'));
    const answers=element('div','learn-answers');answers.setAttribute('role','group');answers.setAttribute('aria-label','Choose your answer');
    const choiceCount=profile.tier==='little'?3:4,values=new Set([question.answer]);
    for(let distance=1;values.size<choiceCount;distance++) {
      for(const candidate of [question.answer-distance,question.answer+distance])if(candidate>=0&&candidate<=profile.numberMax&&values.size<choiceCount)values.add(candidate);
    }
    const choices=[...values].sort((a,b)=>((a*13+countRound*11)%17)-((b*13+countRound*11)%17));
    countButtons=choices.map(value=>{
      const answer=button(String(value),'learn-answer',()=>{
        if(countAnswered)return;
        if(value===question.answer){countAnswered=true;answer.classList.add('is-correct');countButtons.forEach(button=>button.disabled=true);mark(`${countMode}:${question.answer}`);updateStatus(`${value} — you found it! ${countMode==='add'?`${question.left} + ${question.right} = ${value}.`:countMode==='groups'?`${question.groups} × ${question.each} = ${value}.`:'Great counting.'}`,true);}
        else{answer.disabled=true;answer.classList.add('is-retry');updateStatus('Let’s count together. Tap the dots one by one, then try another number.');}
      });answer.setAttribute('aria-label',`Answer ${value}`);if(countAnswered){answer.disabled=true;answer.classList.toggle('is-correct',value===question.answer);}answers.append(answer);return answer;
    });card.append(answers);
    status=element('p','learn-feedback');status.setAttribute('role','status');status.setAttribute('aria-live','polite');card.append(status);
    updateStatus(countAnswered?`${question.answer} — you found it! Great counting.`:'Choose a number. There’s plenty of time.',countAnswered);
    card.append(button('Next puzzle →','button button-primary learn-next-puzzle',nextCount));
    const help=element('div','learn-help');help.append(element('span','learn-help-icon','✿'),element('h2','','Numbers are everywhere'),element('p','',countMode==='groups'?'Each group has the same number. Try counting by groups, then tap every dot to check your total.':countMode==='add'?'Count the first group. Count the second group. How many are there altogether?':'Touch one dot for each number you say. The last number tells you how many.'));
    if(getSettings().sound&&'speechSynthesis' in window)help.append(button('♪ Read the question','button',()=>speak(question.spoken)));
    side.append(help);
    const range=element('div','learn-range');range.append(element('p','learn-eyebrow','YOUR EXPLORING RANGE'),element('strong','',`0–${profile.numberMax}`),element('p','',`Gentle practice for ${profile.name.toLowerCase()}. Change the practice level from Home whenever you like.`));side.append(range);
    side.append(button('Try writing a number →','button',()=>{set='nums';index=Math.min(countValue,9);pageMode='trace';ink=[];done=false;render();}));
    layout.append(card,side);body.append(layout);
  }
  function open(requestedKind='letters') {
    profile=getProfile(getSettings());opened=true;kind=requestedKind==='numbers'||requestedKind==='count'?'numbers':'letters';
    if(kind==='numbers'){set='nums';index=0;pageMode='count';countMode=profile.tier==='maker'?'groups':'count';countValue=profile.tier==='little'?0:profile.tier==='maker'?8:3;countRound=0;countAnswered=false;countMarked.clear();}
    else{set=SETS.some(([value])=>value===profile.defaultSet)?profile.defaultSet:'upper';index=0;pageMode='trace';}
    ink=[];done=false;render();report();
  }
  function close() {opened=false;clearTransient();}
  function settingsChanged() {
    profile=getProfile(getSettings());if(!opened)return;
    countValue=Math.min(countValue,profile.numberMax);countAnswered=false;countMarked.clear();done=false;render();
  }
  return {open,close,settingsChanged};
}
