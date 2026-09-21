import test from 'node:test';
import assert from 'node:assert/strict';
import {LISTENING_IDS,LISTENING_INFO,soundProfile,buildListeningRound,evaluateBeat} from '../listening.js';
import {getProfile} from '../core.js';
import {TIMBRES,MAX_MASTER_GAIN,createSoundEngine} from '../audio.js';

test('four sound activities and all nine effective-age profiles have distinct, bounded challenges',()=>{
  assert.equal(new Set(LISTENING_IDS).size,4);
  const profiles=Array.from({length:9},(_,i)=>soundProfile(getProfile({age:i+2})));
  assert.equal(new Set(profiles.map(p=>JSON.stringify({...p,age:0}))).size,9);
  assert.equal(soundProfile(getProfile({age:10,challengeOffset:-2})).age,8);
  assert.equal(soundProfile(getProfile({age:2,level:'maker'})).age,9);
  assert.equal(soundProfile(-5).age,2);assert.equal(soundProfile(900).age,10);
  assert.ok(MAX_MASTER_GAIN<=.2);
  profiles.forEach(p=>{assert.ok(p.padCount<=5);assert.ok(p.melodyLength<=6);assert.ok(p.beatCount<=7);assert.ok(p.timbreChoices<=4);});
});
test('every generated sound, pitch, melody and rhythm is internally correct across ages and rounds',()=>{
  for(let age=2;age<=10;age++)for(let round=0;round<24;round++)for(const id of LISTENING_IDS) {
    const q=buildListeningRound(id,getProfile({age}),round);assert.equal(q.age,age);assert.ok(LISTENING_INFO[id].title);assert.ok(q.events.length>=1);
    for(const [index,event] of q.events.entries()){assert.ok(event.duration>0&&event.duration<=.65);assert.ok(event.time>=0);if(index)assert.ok(event.time>q.events[index-1].time);if(event.kind==='tone')assert.ok(event.frequency>=100&&event.frequency<=1600);else assert.ok(TIMBRES[event.kind]);}
    if(id==='sound-match'){assert.equal(q.sounds[q.position],q.answer);assert.ok(q.choices.includes(q.answer));assert.deepEqual(q.events.map(e=>e.kind),q.sounds);}
    if(id==='pitch-path'){
      assert.ok(q.choices.includes(q.answer));const changes=q.frequencies.slice(1).map((f,i)=>Math.sign(f-q.frequencies[i]));
      if(q.answer==='up')assert.ok(changes.every(c=>c===1));if(q.answer==='down')assert.ok(changes.every(c=>c===-1));if(q.answer==='same')assert.ok(changes.every(c=>c===0));
      if(q.answer==='hill'||q.answer==='valley'){assert.ok(changes.includes(1)&&changes.includes(-1));assert.equal(changes.find(c=>c!==0),q.answer==='hill'?1:-1);}
    }
    if(id==='melody-echo'){assert.equal(q.sequence.length,q.profile.melodyLength);q.sequence.forEach((pad,i)=>{assert.ok(pad>=0&&pad<q.frequencies.length);assert.equal(q.events[i].frequency,q.frequencies[pad]);});assert.ok(new Set(q.sequence).size>1);}
    if(id==='beat-studio'){assert.equal(q.times.length,q.profile.beatCount);q.gaps.forEach((gap,i)=>assert.ok(Math.abs(q.times[i+1]-q.times[i]-gap)<1e-9));if(age>3)assert.equal(new Set(q.gapUnits).size,2);}
  }
});
test('pitch challenge narrows intervals, expands contours and never reveals a default older-child melody model',()=>{
  assert.ok(soundProfile(2).pitchSemitones>soundProfile(10).pitchSemitones);
  assert.equal(soundProfile(2).contourChoices.length,2);assert.equal(soundProfile(10).contourChoices.length,5);
  assert.equal(soundProfile(2).modelByDefault,true);for(let age=3;age<=10;age++)assert.equal(soundProfile(age).modelByDefault,false);
  for(const age of [2,5,8,10]){const seen=new Set(Array.from({length:25},(_,round)=>buildListeningRound('pitch-path',age,round).answer));assert.deepEqual(seen,new Set(soundProfile(age).contourChoices));}
});
test('beat evaluator accepts matching relative gaps at different tempos and unlimited first-tap delay',()=>{
  for(let age=2;age<=10;age++) {
    const q=buildListeningRound('beat-studio',age);
    for(const scale of [.7,1,1.8]){const taps=q.times.map(t=>500000+t*1000*scale);assert.equal(evaluateBeat(taps,q.gaps,q.profile).passed,true,`age ${age}, tempo ${scale}`);}
    const wobble=q.times.map((t,i)=>9000+t*1000+(i%2?35:-20));assert.equal(evaluateBeat(wobble,q.gaps,q.profile).passed,true,`age ${age}, modest relative jitter`);
    assert.equal(evaluateBeat(q.times.slice(1).map(t=>t*1000),q.gaps,q.profile).passed,false);
    assert.equal(evaluateBeat([...q.times.map(t=>t*1000),99999],q.gaps,q.profile).passed,false);
  }
});
test('beat evaluator rejects a uniform or reversed-gap stream in older tasks, while toddlers can count untimed',()=>{
  for(let age=4;age<=10;age++) {
    const q=buildListeningRound('beat-studio',age),uniform=q.times.map((_,i)=>i*650);
    assert.equal(evaluateBeat(uniform,q.gaps,q.profile).passed,false,`uniform age ${age}`);
    const reversed=[0];q.gapUnits.forEach(unit=>reversed.push(reversed.at(-1)+(unit===1?2:1)*550));
    assert.equal(evaluateBeat(reversed,q.gaps,q.profile).passed,false,`inverse gap age ${age}`);
    assert.equal(evaluateBeat(q.times.map((_,i)=>i*50),q.gaps,q.profile).passed,false);
  }
  assert.equal(evaluateBeat([0,12000],[.65],soundProfile(2)).passed,true);
  assert.equal(evaluateBeat([0,600,9000],[.65,.65],soundProfile(3)).passed,true);
  assert.equal(evaluateBeat([1,1],[.65],soundProfile(2)).passed,false);
  assert.equal(evaluateBeat([0,NaN],[.65],soundProfile(2)).passed,false);
});

// State/lifecycle tests only. Real signal generation is checked independently
// with the browser's live analyser and OfflineAudioContext.
function audioLifecycle(t,plans=[]) {
  let now=0,nextTimer=0;const timers=new Map(),contexts=[];
  t.mock.method(globalThis,'setTimeout',(fn,delay=0)=>{const id=++nextTimer;timers.set(id,{at:now+delay,fn});return id;});
  t.mock.method(globalThis,'clearTimeout',id=>timers.delete(id));
  t.mock.method(performance,'now',()=>now);
  const parameter=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class ControlledContext {
    constructor(){this.plan=plans[contexts.length]||{};this.state=this.plan.resume?'suspended':'running';this.createdAt=now;this.destination={};this.listeners=new Set();this.recordedListeners=[];this.sources=[];this.closeCalls=0;this.suspendCalls=0;contexts.push(this);}
    get currentTime(){return this.plan.stalled||this.state!=='running'?0:(now-this.createdAt)/1000;}
    addEventListener(type,fn){assert.equal(type,'statechange');this.listeners.add(fn);this.recordedListeners.push(fn);}
    removeEventListener(type,fn){assert.equal(type,'statechange');this.listeners.delete(fn);}
    emit(){for(const listener of this.listeners)listener();}
    createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
    createOscillator(){const source={frequency:parameter(),connect(){},disconnect(){},start(){},stopCalls:0,stop(){this.stopCalls++;}};this.sources.push(source);return source;}
    resume(){if(this.plan.resume==='reject')return Promise.reject(new Error('Output unavailable'));if(this.plan.resume==='pending')return new Promise(resolve=>{this.finishResume=()=>{this.state='running';this.emit();resolve();};});this.state='running';return Promise.resolve();}
    suspend(){this.suspendCalls++;return new Promise(resolve=>setTimeout(()=>{this.state='suspended';this.emit();resolve();},80));}
    close(){this.closeCalls++;return new Promise(resolve=>setTimeout(()=>{this.state='closed';this.emit();resolve();},80));}
  }
  const original=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
  Object.defineProperty(globalThis,'AudioContext',{configurable:true,writable:true,value:ControlledContext});
  t.after(()=>{if(original)Object.defineProperty(globalThis,'AudioContext',original);else delete globalThis.AudioContext;});
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  async function advance(milliseconds){await flush();const end=now+milliseconds;for(;;){const entry=[...timers.entries()].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;now=entry[1].at;timers.delete(entry[0]);entry[1].fn();await flush();}now=end;await flush();}
  return {contexts,advance,flush};
}
const shortTone=[{kind:'tone',duration:.08}];

function replaceGlobal(t,name,value) {
  const original=Object.getOwnPropertyDescriptor(globalThis,name);
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
  t.after(()=>{if(original)Object.defineProperty(globalThis,name,original);else delete globalThis[name];});
}
function nativePreparation(t) {
  const requests=[];
  replaceGlobal(t,'webkit',{messageHandlers:{doodleAudio:{postMessage(message){
    let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
    requests.push({message,resolve,reject});return promise;
  }}}});
  return requests;
}

for(const firstReady of ['native','context'])test(`native preparation and context resume both finish before scheduling, ${firstReady} first`,async t=>{
  const clock=audioLifecycle(t,[{resume:'pending'}]),requests=nativePreparation(t);
  const engine=createSoundEngine();let settled=false,pulses=0;
  engine.setVolume(.6);
  assert.equal(requests.length,0,'creating or configuring an engine must not activate native audio');
  assert.equal(clock.contexts.length,0,'opening a game must not create an audio context');
  const result=engine.play(shortTone,{onEvent:()=>pulses++});result.then(()=>{settled=true;});
  assert.equal(requests.length,1,'native preparation starts before play returns');
  assert.deepEqual(requests[0].message,{type:'prepareGameAudio'});
  assert.equal(clock.contexts.length,1,'context construction stays in the original gesture');
  const context=clock.contexts[0];
  assert.equal(typeof context.finishResume,'function','resume starts before native preparation is awaited');
  if(firstReady==='native')requests[0].resolve({ok:true});else context.finishResume();
  await clock.advance(100);
  assert.equal(context.sources.length,0,'neither readiness signal alone may schedule a sound');
  assert.equal(pulses,0);assert.equal(settled,false);
  if(firstReady==='native')context.finishResume();else requests[0].resolve({ok:true});
  await clock.advance(200);
  assert.equal((await result).status,'played');assert.equal(pulses,1);assert.ok(context.sources.length>0);
});

for(const outcome of ['false','rejected','timeout'])test(`native preparation ${outcome} fails without scheduling and a new tap can recover`,async t=>{
  const clock=audioLifecycle(t),requests=nativePreparation(t),engine=createSoundEngine();let pulses=0;
  const result=engine.play(shortTone,{onEvent:()=>pulses++});
  if(outcome==='false')requests[0].resolve({ok:false,reason:'Output is unavailable'});
  if(outcome==='rejected')requests[0].reject(new Error('Native preparation failed'));
  await clock.advance(outcome==='timeout'?2600:100);
  assert.equal((await result).status,'failed');
  const old=clock.contexts[0];assert.equal(old.sources.length,0);assert.equal(pulses,0);
  assert.ok(old.closeCalls>0,'failed preparation retires the context');
  const retry=engine.play(shortTone);
  assert.equal(requests.length,2,'a new explicit attempt requests native output again');
  requests[0].resolve({ok:true});await clock.advance(100);
  assert.equal(old.sources.length,0,'a late success from the failed attempt cannot schedule notes');
  assert.equal(clock.contexts[1].sources.length,0,'retry must wait for its own native reply');
  requests[1].resolve({ok:true});await clock.advance(200);
  assert.equal((await retry).status,'played');assert.equal(pulses,0);
});

for(const action of ['stop','suspend'])test(`a native reply after ${action} cannot revive or complete the next attempt`,async t=>{
  const clock=audioLifecycle(t),requests=nativePreparation(t),engine=createSoundEngine();let oldPulses=0,nextPulses=0,nextSettled=false;
  const first=engine.play(shortTone,{onEvent:()=>oldPulses++});await clock.flush();
  engine[action]();assert.equal((await first).status,'cancelled');
  const next=engine.play(shortTone,{onEvent:()=>nextPulses++});next.then(()=>{nextSettled=true;});
  requests[0].resolve({ok:true});await clock.advance(100);
  assert.equal(oldPulses,0);assert.equal(nextPulses,0);assert.equal(nextSettled,false);
  assert.ok(clock.contexts.every(context=>context.sources.length===0));
  requests[1].resolve({ok:true});await clock.advance(200);
  assert.equal((await next).status,'played');assert.equal(nextPulses,1);assert.equal(oldPulses,0);
});

test('an unsupported browser audio-session preference does not block gesture playback',async t=>{
  const clock=audioLifecycle(t);let preferences=0;
  replaceGlobal(t,'navigator',{audioSession:{set type(value){assert.equal(value,'playback');preferences++;throw new Error('Unsupported audio-session preference');}}});
  const engine=createSoundEngine();assert.equal(preferences,0);assert.equal(clock.contexts.length,0);
  const result=engine.play(shortTone);
  assert.equal(preferences,1,'session preference is requested only on play');
  assert.equal(clock.contexts.length,1,'unsupported preference must not defer context creation');
  await clock.advance(200);assert.equal((await result).status,'played');
});

test('suspension retires the context before immediate replay; late old state events cannot interrupt the fresh job',async t=>{
  const clock=audioLifecycle(t,[{},{resume:'pending'}]);let interruptions=0;
  const engine=createSoundEngine({onInterrupt:()=>interruptions++});
  const first=engine.play(shortTone);await clock.advance(200);assert.equal((await first).status,'played');
  const preview=engine.play(shortTone);await clock.advance(200);assert.equal((await preview).status,'played');
  assert.equal(clock.contexts.length,1,'ordinary per-note playback must reuse the context');
  const old=clock.contexts[0],cancelled=engine.play(shortTone);await clock.flush();engine.suspend();
  assert.equal((await cancelled).status,'cancelled');assert.equal(old.closeCalls,1);assert.equal(old.suspendCalls,0);
  assert.equal(old.listeners.size,1,'only the retired-context close guard remains');assert.equal(engine.state,'uninitialized');assert.ok(old.sources.every(source=>source.stopCalls>0));
  const next=engine.play(shortTone);assert.equal(clock.contexts.length,2,'create the replacement synchronously on the next play');
  await clock.flush();old.state='suspended';for(const listener of old.recordedListeners)listener();
  clock.contexts[1].finishResume();
  await clock.advance(200);assert.equal((await next).status,'played');assert.equal(interruptions,0);
});

test('a pending resume times out and retires; a late resolution cannot complete or cancel the next audible attempt',async t=>{
  const clock=audioLifecycle(t,[{resume:'pending'},{}]);const engine=createSoundEngine();let pulses=0;
  const failed=engine.play(shortTone,{onEvent:()=>pulses++});await clock.advance(2600);
  assert.equal((await failed).status,'failed');const old=clock.contexts[0];assert.equal(old.closeCalls,1);assert.equal(old.sources.length,0);assert.equal(pulses,0);
  const retry=engine.play(shortTone);await clock.flush();old.finishResume();for(const listener of old.recordedListeners)listener();
  await clock.advance(200);assert.equal((await retry).status,'played');assert.equal(clock.contexts.length,2);assert.equal(old.sources.length,0);assert.equal(pulses,0);
  assert.equal(old.state,'closed','late resume must leave the retired context closed');
});

test('a delayed running event after close re-closes only the retired context and preserves new playback',async t=>{
  const clock=audioLifecycle(t);let interruptions=0;
  const engine=createSoundEngine({onInterrupt:()=>interruptions++});
  const first=engine.play(shortTone);await clock.advance(200);assert.equal((await first).status,'played');
  const old=clock.contexts[0];engine.suspend();await clock.advance(100);
  assert.equal(old.state,'closed');assert.equal(old.closeCalls,1);
  const next=engine.play([{kind:'tone',duration:.65}]);await clock.flush();
  // WebKit can deliver a delayed output-start event after close has resolved.
  old.state='running';old.emit();old.emit();
  await clock.advance(100);
  assert.equal(old.closeCalls,2,'duplicate state delivery needs only one new close');
  assert.equal(old.state,'closed');assert.equal(clock.contexts[1].closeCalls,0);
  assert.equal(engine.state,'running');assert.equal(interruptions,0);
  await clock.advance(650);assert.equal((await next).status,'played');
});

test('frozen running clocks and rejected resumes retire failed contexts so an explicit retry can recover',async t=>{
  const clock=audioLifecycle(t,[{stalled:true},{resume:'reject'},{}]);const engine=createSoundEngine();
  const stalled=engine.play(shortTone);await clock.advance(2300);assert.equal((await stalled).status,'failed');assert.equal(clock.contexts[0].closeCalls,1);
  const rejected=engine.play(shortTone);await clock.flush();assert.equal((await rejected).status,'failed');assert.equal(clock.contexts[1].closeCalls,1);
  const retry=engine.play(shortTone);await clock.advance(200);assert.equal((await retry).status,'played');assert.equal(clock.contexts.length,3);
});

test('ordinary stop cancels nodes but preserves the reusable context; suspension before first play creates none',async t=>{
  const clock=audioLifecycle(t);const engine=createSoundEngine();engine.suspend();assert.equal(clock.contexts.length,0);
  const first=engine.play(shortTone);await clock.flush();engine.stop();assert.equal((await first).status,'cancelled');
  assert.equal(clock.contexts[0].closeCalls,0);const next=engine.play(shortTone);await clock.advance(200);assert.equal((await next).status,'played');assert.equal(clock.contexts.length,1);
});
