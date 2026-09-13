import {getProfile,readStore,writeStore} from './core.js';
import {createSoundEngine,TIMBRES} from './audio.js';
import {stopSpeaking} from './speech.js';

export const LISTENING_INFO = Object.freeze({
  'sound-match':{title:'Sound detective',symbol:'◉',skill:'SOUND EXPLORATION'},
  'pitch-path':{title:'Higher or lower',symbol:'↗',skill:'PITCH & DIRECTION'},
  'melody-echo':{title:'Melody echo',symbol:'♫',skill:'LISTEN & REMEMBER'},
  'beat-studio':{title:'Beat studio',symbol:'●',skill:'RHYTHM & PATTERNS'},
});
export const LISTENING_IDS=Object.freeze(Object.keys(LISTENING_INFO));
export const LISTENING_TITLES=Object.freeze(Object.fromEntries(LISTENING_IDS.map(id=>[id,LISTENING_INFO[id].title])));
const CONTOURS={up:{label:'Goes up',symbol:'↗'},down:{label:'Goes down',symbol:'↘'},same:{label:'Stays the same',symbol:'→'},hill:{label:'Up, then down',symbol:'↗↘'},valley:{label:'Down, then up',symbol:'↘↗'}};
const PAD_SYMBOLS=['●','◆','▲','★','■'];
const PAD_COLORS=['#8266c7','#32869c','#bd684e','#977120','#468563'];
const boundedAge=value=>Math.max(2,Math.min(10,Math.round(Number(value)||6)));
export function soundProfile(value=6) {
  const age=boundedAge(value&&typeof value==='object'?(value.challengeAge??value.age):value),i=age-2;
  return {age,timbreChoices:[2,2,3,3,4,4,4,4,4][i],soundLength:[1,2,2,2,2,3,3,4,4][i],
    pitchSteps:[2,2,2,3,3,4,3,4,5][i],pitchSemitones:[12,9,7,5,4,3,3,2,1][i],
    contourChoices:age<=3?['up','down']:age<=7?['up','down','same']:['up','down','same','hill','valley'],
    padCount:[2,3,3,4,4,4,5,5,5][i],melodyLength:[2,2,3,3,4,4,5,5,6][i],
    melodyStep:[12,7,5,5,4,3,3,2,2][i],noteSpacing:[.68,.64,.61,.58,.55,.52,.50,.47,.44][i],
    beatCount:[2,3,3,4,4,5,5,6,7][i],beatUnit:[.65,.65,.58,.56,.54,.52,.50,.48,.46][i],
    beatTolerance:[1,1,.50,.46,.42,.38,.35,.32,.30][i],countOnly:age<=3,modelByDefault:age===2};
}
function shuffle(values,seed) {
  const list=[...values];let n=(seed+31)>>>0;
  for(let i=list.length-1;i>0;i--){n=(n*1664525+1013904223)>>>0;const j=n%(i+1);[list[i],list[j]]=[list[j],list[i]];}
  return list;
}
export function buildListeningRound(id,profile=6,round=0) {
  if(!LISTENING_IDS.includes(id))throw new Error(`Unknown listening activity: ${id}`);
  const p=soundProfile(profile),n=Math.max(0,Math.floor(Number(round)||0)),common={id,age:p.age,round:n,profile:p};
  if(id==='sound-match') {
    const bank=['drum','bell','shaker','wood'];
    const choices=shuffle(bank.slice(0,p.timbreChoices),n+p.age),answer=choices[n%choices.length];
    const sounds=Array.from({length:p.soundLength},(_,i)=>p.age<=4?answer:choices[(i+n+1)%choices.length]);
    const position=p.age>=8&&n%2===1?0:sounds.length-1;sounds[position]=answer;
    return {...common,choices,answer,sounds,position,events:sounds.map((kind,i)=>({kind,time:i*.58,duration:.30})),
      prompt:p.age<=4?'Which sound did you hear?':`Which sound came ${position===0?'first':'last'}?`,
      intro:p.age<=4?'Listen. Try each sound, then choose its partner.':`Remember the ${position===0?'first':'last'} sound. Explore the choices before you choose.`,
      help:`${TIMBRES[answer].description} Listen again, then compare the sound buttons. The hint model names it ${TIMBRES[answer].name}.`};
  }
  if(id==='pitch-path') {
    const answer=p.contourChoices[n%p.contourChoices.length],length=p.pitchSteps,base=280+(n%3)*35;
    const steps=Array.from({length},(_,i)=>answer==='same'?0:answer==='up'?i:answer==='down'?length-1-i:answer==='hill'?Math.min(i,length-1-i)*2:-Math.min(i,length-1-i)*2);
    const frequencies=steps.map(step=>base*2**(step*p.pitchSemitones/12));
    return {...common,answer,choices:[...p.contourChoices],frequencies,events:frequencies.map((frequency,i)=>({kind:'tone',frequency,time:i*p.noteSpacing,duration:.30})),
      prompt:'Which way did the sounds move?',intro:'Listen to the whole little tune. Follow the sound with your hand.',
      help:`Try humming along. ${CONTOURS[answer].label}. The arrow model shows the path; replay it and follow with a finger.`};
  }
  if(id==='melody-echo') {
    const frequencies=Array.from({length:p.padCount},(_,i)=>220*2**(i*p.melodyStep/12));
    const sequence=Array.from({length:p.melodyLength},(_,i)=>(n+i+(i>1&&i%3===2?1:0))%p.padCount);
    return {...common,frequencies,sequence,events:sequence.map((pad,i)=>({kind:'tone',frequency:frequencies[pad],time:i*p.noteSpacing,duration:.28})),
      prompt:'Listen, then play it back',intro:p.modelByDefault?'Explore together. Match the sounds and the little picture model.':'Listen first. Remember the order, then play the tone pads. You can replay as often as you like.',
      help:'Listen to one tone at a time. The picture model shows the pad order. Play slowly; matching the timing is not needed.'};
  }
  const gapUnits=Array.from({length:p.beatCount-1},(_,i)=>p.countOnly?1:((i+n)%3===1?2:1));
  if(!p.countOnly&&!gapUnits.includes(2))gapUnits[gapUnits.length-1]=2;
  const gaps=gapUnits.map(unit=>unit*p.beatUnit),times=[0];gaps.forEach(gap=>times.push(times.at(-1)+gap));
  return {...common,gapUnits,gaps,times,events:times.map(time=>({kind:'drum',time,duration:.16})),
    prompt:p.countOnly?'Copy the drum taps':'Copy the spaces between taps',
    intro:p.countOnly?'Listen and count together. Tap the drum the same number of times, at any speed.': 'Listen for short and long spaces. Start whenever you are ready; your own steady speed is welcome.',
    help:p.countOnly?`There are ${p.beatCount} taps. Count one picture for each tap; no timing is checked.`:'A long space is about twice a short space. Say “tap, wait” through the model, then copy its short and long gaps.'};
}

// Absolute start time and overall tempo are ignored; only relative spaces count.
export function evaluateBeat(taps,gaps,profile) {
  const p=soundProfile(profile);
  if(!Array.isArray(taps)||taps.length!==gaps.length+1)return {passed:false,reason:'count'};
  if(taps.some(value=>!Number.isFinite(value)))return {passed:false,reason:'timing'};
  const actual=taps.slice(1).map((value,i)=>(value-taps[i])/1000);
  if(actual.some(value=>value<=0))return {passed:false,reason:'timing'};
  if(p.countOnly)return {passed:true,reason:'count'};
  if(actual.some(value=>value<.12))return {passed:false,reason:'timing'};
  const tempo=actual.reduce((a,b)=>a+b,0)/gaps.reduce((a,b)=>a+b,0);
  const errors=actual.map((value,i)=>Math.abs(value-gaps[i]*tempo)/(gaps[i]*tempo));
  // This also rejects a uniform stream when the target contains long spaces.
  const short=actual.filter((_,i)=>gaps[i]===Math.min(...gaps)),long=actual.filter((_,i)=>gaps[i]>Math.min(...gaps));
  const contrast=!long.length||long.reduce((a,b)=>a+b,0)/long.length>short.reduce((a,b)=>a+b,0)/short.length*1.22;
  return {passed:contrast&&errors.every(error=>error<=p.beatTolerance),reason:'timing',errors};
}
function el(tag,className,text) {const node=document.createElement(tag);node.className=className||'';if(text!==undefined)node.textContent=text;return node;}
function btn(text,action,className='') {const node=el('button',`listening-button ${className}`,text);node.type='button';node.addEventListener('click',action);return node;}
function safeProgress() {
  const saved=readStore('listening-progress-v1',{}),stars={};
  if(saved?.version===1&&saved.stars&&typeof saved.stars==='object')for(const [key,value] of Object.entries(saved.stars).slice(0,1200))if(value===true&&/^(sound-match|pitch-path|melody-echo|beat-studio):(2|3|4|5|6|7|8|9|10):\d{1,4}$/.test(key))stars[key]=true;
  return {version:1,stars};
}
export function createListening(container,{getSettings=()=>({age:6}),onBack=()=>{},onNotice=()=>{},onProgress=()=>{}}={}) {
  let id=null,profile=null,question=null,round=0,epoch=0,heard=false,busy=false,previewBusy=false,complete=false,model=false,sequence=[],taps=[],activePulse=-1;
  const savedAudio=readStore('listening-audio-v1',{});
  const audioPreferences=savedAudio&&typeof savedAudio==='object'&&!Array.isArray(savedAudio)?savedAudio:{};
  let feedback='Tap Listen when you are ready.',helpText='',soundOn=audioPreferences.enabled!==false;
  let volume=Math.max(.15,Math.min(.8,Number(audioPreferences.volume)||.55));
  const progress=safeProgress();
  const engine=createSoundEngine({onInterrupt:()=>{if(id)suspendAudio();}});engine.setVolume(volume);
  function settingsAudio(){writeStore('listening-audio-v1',{enabled:soundOn,volume});}
  function cancel(){epoch++;engine.stop();busy=false;previewBusy=false;activePulse=-1;}
  function reset(message='Tap Listen when you are ready.') {cancel();heard=false;complete=false;sequence=[];taps=[];feedback=message;}
  function suspendAudio(){if(!id)return;cancel();engine.suspend();if(!complete){heard=false;sequence=[];taps=[];feedback='Sound paused. Tap Listen when you are ready to continue.';}render();}
  function failAudio(reason){heard=false;busy=false;previewBusy=false;sequence=[];taps=[];feedback=reason||'Sound paused. Tap Listen to try again.';render();}
  function win() {
    if(complete||!heard||!soundOn)return;
    complete=true;feedback=id==='beat-studio'?(profile.countOnly?'You matched every drum tap!':'You copied the short and long spaces!'):id==='melody-echo'?'You played the whole melody in order!':'You listened and found the sound!';
    const key=`${id}:${profile.age}:${round}`;
    if(!progress.stars[key]){progress.stars[key]=true;writeStore('listening-progress-v1',progress);onProgress({source:'listening',completedCount:Object.keys(progress.stars).length});}
    render();
  }
  function listen() {
    if(!soundOn){feedback='Turn game sound on, then tap Listen.';render();return;}
    stopSpeaking();
    reset();const token=epoch;busy=true;feedback='Listening…';render();
    engine.play(question.events,{onEvent:index=>{if(token!==epoch)return;activePulse=index;paintPulse();}}).then(result=>{
      if(token!==epoch||!id)return;busy=false;activePulse=-1;
      if(result.status!=='played'){failAudio(result.reason);return;}
      heard=true;feedback=id==='beat-studio'?'Your turn. Tap the drum, then check your beat.':id==='melody-echo'?'Your turn. Play the tone pads in order.':'Your turn. Explore the sounds or choose your answer.';render();
    });
  }
  function paintPulse(){container.querySelectorAll('[data-listening-pulse]').forEach((node,i)=>node.classList.toggle('is-active',busy&&i===activePulse));}
  function preview(event,after=()=>{}) {
    if(!soundOn){feedback='Turn game sound on to explore the sounds.';render();return;}
    if(busy||complete)return;
    stopSpeaking();
    const token=epoch;previewBusy=true;render();
    engine.play([event]).then(result=>{
      if(token!==epoch||!id)return;
      if(result.status==='cancelled')return;
      previewBusy=false;if(result.status!=='played'){failAudio(result.reason);return;}after();render();
    });
  }
  function choose(value) {
    if(!heard||busy||previewBusy||complete||!soundOn)return;
    if(value===question.answer){win();return;}
    feedback=id==='pitch-path'?'Try listening again. Follow each sound up or down with your hand.':'Try comparing the sounds again. Use Hear on a choice before choosing it.';render();
  }
  function melodyPad(pad) {
    if(previewBusy)return;
    preview({kind:'tone',frequency:question.frequencies[pad],duration:.18},()=>{
      if(!heard){feedback='That is this pad’s sound. Tap Listen to hear the melody.';return;}
      if(pad!==question.sequence[sequence.length]){sequence=[];feedback='Let’s try that melody again. Replay it, or use the picture hint. Start with its first sound.';return;}
      sequence.push(pad);feedback=`${sequence.length} of ${question.sequence.length} tones played.`;
      if(sequence.length===question.sequence.length)win();
    });
  }
  function drumTap() {
    if(!heard||busy||complete||!soundOn)return;
    const time=performance.now();if(taps.length&&time-taps.at(-1)<95)return;
    if(taps.length>=question.times.length+2){feedback='Try again to start a fresh beat.';render();return;}
    taps.push(time);feedback=`${taps.length} drum ${taps.length===1?'tap':'taps'}. Check when you are finished.`;
    preview({kind:'drum',duration:.13});render();
  }
  function checkBeat(){if(!heard||busy||previewBusy||complete||!soundOn)return;const result=evaluateBeat(taps,question.gaps,profile);if(result.passed){win();return;}feedback=result.reason==='count'?`Listen for ${question.times.length} taps. You made ${taps.length}. Tap Try again for a fresh turn.`:'You have the taps. Listen for the longer spaces, then try a fresh beat at your own speed.';render();}
  function hint(){if(!id)return;cancel();model=true;helpText=question.help;feedback=heard?'The hint is here. Replay whenever you want.':'The hint is here. Tap Listen to hear it before your turn.';render();}
  function next(){round=(round+1)%10000;question=buildListeningRound(id,profile,round);model=profile.modelByDefault;helpText='';reset();render();}

  function renderModel(parent) {
    const area=el('div','listening-model');area.dataset.listeningModel='';area.hidden=!model;
    if(id==='sound-match')area.append(el('strong','',`Listen for ${TIMBRES[question.answer].name}: ${TIMBRES[question.answer].description}`));
    else if(id==='pitch-path')area.append(el('strong','',`${CONTOURS[question.answer].symbol} ${CONTOURS[question.answer].label}`));
    else if(id==='melody-echo') {
      area.setAttribute('aria-label',`Tone model: ${question.sequence.map(p=>p+1).join(', ')}`);
      question.sequence.forEach(pad=>{const item=el('span','listening-model-note',`${PAD_SYMBOLS[pad]} ${pad+1}`);item.style.setProperty('--pad-color',PAD_COLORS[pad]);area.append(item);});
    } else {
      const items=el('div','listening-beat-model');
      question.times.forEach((_,i)=>{if(i)items.append(el('span',`listening-gap ${question.gapUnits[i-1]===2?'is-long':''}`,profile.countOnly?'':question.gapUnits[i-1]===2?'long':'short'));items.append(el('span','listening-beat-dot',String(i+1)));});area.append(items);
    }
    parent.append(area);
  }
  function renderPlay(parent) {
    if(id==='sound-match') {
      const choices=el('div','listening-sound-choices');
      question.choices.forEach(kind=>{
        const card=el('div','listening-sound-card');card.append(el('span','listening-instrument',TIMBRES[kind].symbol),el('strong','',TIMBRES[kind].name));
        const hear=btn(`Hear ${TIMBRES[kind].name}`,()=>preview({kind,duration:.30}));hear.dataset.listeningPreview=kind;hear.disabled=busy||previewBusy||complete||!soundOn;
        const chooseButton=btn(`Choose ${TIMBRES[kind].name}`,()=>choose(kind),'listening-choice');chooseButton.dataset.listeningAnswer=kind;chooseButton.disabled=!heard||busy||previewBusy||complete||!soundOn;
        card.append(hear,chooseButton);choices.append(card);
      });parent.append(choices);
    } else if(id==='pitch-path') {
      const choices=el('div','listening-path-choices');question.choices.forEach(value=>{
        const choice=btn('',()=>choose(value),'listening-path');choice.append(el('span','listening-path-icon',CONTOURS[value].symbol),el('span','',CONTOURS[value].label));choice.dataset.listeningAnswer=value;choice.disabled=!heard||busy||complete||!soundOn;choices.append(choice);
      });parent.append(choices);
    } else if(id==='melody-echo') {
      const slots=el('div','listening-echo-slots');slots.setAttribute('aria-label',`${sequence.length} of ${question.sequence.length} tones played`);
      question.sequence.forEach((_,i)=>slots.append(el('span',`listening-echo-slot ${i<sequence.length?'is-filled':''}`,i<sequence.length?PAD_SYMBOLS[sequence[i]]:'·')));parent.append(slots);
      const pads=el('div','listening-pads');question.frequencies.forEach((_,pad)=>{
        const button=btn('',()=>melodyPad(pad),'listening-pad');button.setAttribute('aria-label',`Tone ${pad+1}`);button.dataset.listeningPad=pad;button.style.setProperty('--pad-color',PAD_COLORS[pad]);button.append(el('span','',PAD_SYMBOLS[pad]),el('small','',`Tone ${pad+1}`));button.disabled=busy||previewBusy||complete||!soundOn;pads.append(button);
      });parent.append(pads);
    } else {
      const drum=btn('',event=>{if(event.detail===0)drumTap();},'listening-drum');drum.setAttribute('aria-label','Tap drum');drum.dataset.listeningDrum='';drum.append(el('span','','●'),el('strong','','Tap drum'));drum.disabled=!heard||busy||complete||!soundOn;
      drum.addEventListener('pointerdown',event=>{if(event.isPrimary!==false&&event.button===0){event.preventDefault();drumTap();}});
      const beats=el('div','listening-taps',`${taps.length} ${taps.length===1?'tap':'taps'}`);beats.dataset.listeningTapCount='';
      const check=btn('Check my beat',checkBeat,'listening-primary');check.dataset.listeningCheck='';check.disabled=!heard||busy||previewBusy||complete||!soundOn;parent.append(drum,beats,check);
    }
  }
  function render() {
    if(!id)return;
    const screen=el('section','listening-screen');screen.dataset.listeningState=complete?'complete':busy?'playing':heard?'ready':'waiting';screen.dataset.listeningId=id;screen.dataset.listeningPreviewBusy=String(previewBusy);
    const header=el('header','activity-header listening-header'),back=btn('←',onBack);back.setAttribute('aria-label','Back to activities');
    const heading=el('div','listening-heading');heading.append(el('p','listening-eyebrow',LISTENING_INFO[id].skill),el('h1','',LISTENING_INFO[id].title));header.append(back,heading);screen.append(header);
    const body=el('div','listening-body'),main=el('div','listening-main'),side=el('aside','listening-side');
    const audioControls=el('div','listening-audio-controls');
    const toggle=btn(`Game sound ${soundOn?'on':'off'}`,()=>{soundOn=!soundOn;settingsAudio();suspendAudio();feedback=soundOn?'Game sound is on. Tap Listen.':'Game sound is off. Turn it on when you want to listen.';render();});toggle.dataset.listeningSound='';toggle.setAttribute('aria-pressed',String(soundOn));audioControls.append(toggle);
    const volumeLabel=el('label','listening-volume','Gentle volume'),slider=el('input');slider.type='range';slider.min='.15';slider.max='.8';slider.step='.05';slider.value=String(volume);slider.setAttribute('aria-label','Game volume');slider.addEventListener('input',()=>{volume=Number(slider.value);engine.setVolume(volume);settingsAudio();});volumeLabel.append(slider);audioControls.append(volumeLabel);main.append(audioControls);
    main.append(el('p','listening-age',`Age ${profile.age} · Your pace`),el('h2','listening-prompt',question.prompt),el('p','listening-intro',question.intro));
    const listenButton=btn(busy?'Listening…':previewBusy?'Hearing a sound…':'Listen',listen,'listening-listen listening-primary');listenButton.dataset.listeningListen='';listenButton.disabled=busy||previewBusy||!soundOn;main.append(listenButton);
    const pulses=el('div','listening-pulses');pulses.setAttribute('aria-hidden','true');question.events.forEach((_,i)=>{const pulse=el('span',`listening-pulse ${i===activePulse?'is-active':''}`);pulse.dataset.listeningPulse='';pulses.append(pulse);});main.append(pulses);
    const status=el('p',`listening-feedback ${complete?'is-complete':''}`,feedback);status.dataset.testid='listening-feedback';status.setAttribute('role','status');status.setAttribute('aria-live','polite');main.append(status);renderModel(main);renderPlay(main);
    const actions=el('div','listening-actions');actions.append(btn('Try again',()=>{reset();render();}),btn('New round',next));main.append(actions);
    side.append(el('div','listening-side-icon',LISTENING_INFO[id].symbol),el('h2','','A little listening help'),el('p','',helpText||'Listen as often as you like. Explore each sound, then have a go. There is no timer.'));
    const hintButton=btn('Show a hint',hint);hintButton.dataset.listeningHint='';side.append(hintButton,el('p','listening-small',profile.age<=3?'Explore together with a grown-up. Picture help is welcome; reading alone is not needed.':'Need a different challenge? Your Coach can make this activity easier or harder.'),el('p','listening-small','Game sound is separate from Read aloud. Nothing records your voice.'));
    body.append(main,side);screen.append(body);container.replaceChildren(screen);
  }
  const onVisibility=()=>{if(document.hidden)suspendAudio();};document.addEventListener('visibilitychange',onVisibility);globalThis.addEventListener?.('pagehide',suspendAudio);
  return {open(nextId='sound-match') {cancel();id=LISTENING_IDS.includes(nextId)?nextId:'sound-match';profile=soundProfile(getProfile(getSettings()));round=0;question=buildListeningRound(id,profile,round);model=profile.modelByDefault;helpText='';reset();render();},
    close(){cancel();engine.suspend();id=null;container.replaceChildren();},
    settingsChanged(){if(!id)return;const nextProfile=soundProfile(getProfile(getSettings()));if(nextProfile.age!==profile.age){profile=nextProfile;round=0;question=buildListeningRound(id,profile,round);model=profile.modelByDefault;helpText='';reset();}render();},hint,suspendAudio};
}
