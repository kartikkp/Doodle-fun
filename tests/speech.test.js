import test from 'node:test';
import assert from 'node:assert/strict';
import {canSpeak,normalizeSpeechText,prepareSpeech,requestSpeech,stopSpeaking,CLIP_PREPARATION_LIMIT} from '../speech.js';

const clip='data:audio/wav;base64,AAAA';
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
function setup(t,{resumePending=false,decodePending=false,decodeFails=false,native=true}={}) {
  const original=new Map(),messages=[],contexts=[],utterances=[],voiceListeners=new Set();
  const set=(key,value)=>{if(!original.has(key))original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
  class Context {
    constructor(){this.state='suspended';this.destination={};this.listeners=new Set();this.sources=[];contexts.push(this);}
    addEventListener(type,callback){this.listeners.add(callback);}
    removeEventListener(type,callback){this.listeners.delete(callback);}
    emit(){for(const listener of this.listeners)listener();}
    resume(){this.resumeCalled=true;const done=()=>{this.state='running';this.emit();};if(resumePending)return new Promise(resolve=>{this.resumeNow=()=>{done();resolve();};});done();return Promise.resolve();}
    close(){this.state='closed';this.emit();return Promise.resolve();}
    decodeAudioData(bytes){assert.ok(bytes instanceof ArrayBuffer);if(decodeFails)return Promise.reject(new Error('Invalid clip'));if(decodePending)return new Promise(resolve=>{this.decodeNow=()=>resolve({duration:.3});});return Promise.resolve({duration:.3});}
    createBufferSource(){const source={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};this.sources.push(source);return source;}
    createGain(){return {gain:{value:0},connect(){},disconnect(){}};}
  }
  const synth={voices:[{name:'Local',lang:'en-US',localService:true}],getVoices(){return this.voices;},cancel(){},speak(utterance){utterances.push(utterance);},addEventListener(type,callback){voiceListeners.add(callback);},removeEventListener(type,callback){voiceListeners.delete(callback);}};
  set('AudioContext',Context);set('webkitAudioContext',undefined);set('OfflineAudioContext',undefined);set('webkitOfflineAudioContext',undefined);set('__DOODLE_VOICE_CLIPS__',{'Hello, learner.':clip});
  set('document',{hidden:false});set('navigator',{audioSession:{type:'auto'}});
  set('speechSynthesis',synth);set('SpeechSynthesisUtterance',class{constructor(text){this.text=text;}});
  set('webkit',native?{messageHandlers:{doodleNative:{postMessage:message=>messages.push(message)},doodleAudio:{postMessage:message=>{messages.push(message);return Promise.resolve({ok:true});}}}}:undefined);
  t.after(()=>{stopSpeaking();for(const [key,descriptor] of original){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
  return {set,messages,contexts,utterances,synth,voiceListeners};
}

test('clip availability and normalized lookup do not start playback or read legacy preferences',async t=>{
  const state=setup(t);state.set('localStorage',{getItem(){throw new Error('Do not consult opt-in preferences');}});
  assert.equal(normalizeSpeechText('  Hello,\n learner.  '),'Hello, learner.');assert.equal(canSpeak(),true);
  assert.equal(state.contexts.length,0);assert.deepEqual(state.messages,[]);
  const played=requestSpeech('  Hello,\n learner.  ');assert.equal(state.contexts.length,1);assert.equal(state.contexts[0].resumeCalled,true);
  await flush();const source=state.contexts[0].sources[0];assert.equal(source.started,true);source.onended();
  assert.deepEqual(await played,{status:'played',source:'clip'});assert.equal(state.contexts[0].state,'closed');
  assert.equal(state.messages.filter(message=>message.type==='speak').length,0);
});

test('clip waits for native activation as well as same-gesture resume and decode',async t=>{
  const state=setup(t,{resumePending:true,decodePending:true});let ready;
  webkit.messageHandlers.doodleAudio.postMessage=()=>new Promise(resolve=>{ready=resolve;});
  const played=requestSpeech('Hello, learner.'),context=state.contexts[0];
  assert.equal(context.resumeCalled,true);context.decodeNow();context.resumeNow();await flush();assert.equal(context.sources.length,0);
  ready({ok:true});await flush();assert.equal(context.sources[0].started,true);context.sources[0].onended();assert.equal((await played).source,'clip');
});

test('cancelling during pending resume/decode cannot start or fall back later',async t=>{
  const state=setup(t,{resumePending:true,decodePending:true});const played=requestSpeech('Hello, learner.'),context=state.contexts[0];
  stopSpeaking();assert.deepEqual(await played,{status:'cancelled'});context.decodeNow();context.resumeNow();await flush();
  assert.equal(context.state,'closed');assert.equal(context.sources.length,0);assert.equal(state.messages.filter(message=>message.type==='speak').length,0);
});

test('a hidden document cannot start delayed playback even before its visibility callback runs',async t=>{
  const state=setup(t,{decodePending:true});const played=requestSpeech('Hello, learner.');
  document.hidden=true;state.contexts[0].decodeNow();await flush();assert.deepEqual(await played,{status:'cancelled'});
  assert.equal(state.contexts[0].sources.length,0);assert.equal(state.messages.filter(message=>message.type==='speak').length,0);
});

test('a newer Hear cancels the old clip and its late work cannot interrupt the new one',async t=>{
  const state=setup(t,{decodePending:true});const first=requestSpeech('Hello, learner.'),second=requestSpeech('Hello, learner.');
  assert.deepEqual(await first,{status:'cancelled'});state.contexts[0].decodeNow();await flush();assert.equal(state.contexts[0].sources.length,0);
  state.contexts[1].decodeNow();await flush();const source=state.contexts[1].sources[0];assert.equal(source.started,true);source.onended();assert.equal((await second).source,'clip');
});

test('clip interruption cancels without spoken fallback; another tap can try again',async t=>{
  const state=setup(t);const first=requestSpeech('Hello, learner.');await flush();const context=state.contexts[0];
  context.state='suspended';context.emit();assert.deepEqual(await first,{status:'cancelled'});assert.equal(context.sources[0].stopped,true);
  assert.equal(state.messages.filter(message=>message.type==='speak').length,0);
  const second=requestSpeech('Hello, learner.');await flush();state.contexts[1].sources[0].onended();assert.equal((await second).status,'played');
});

test('dynamic text and an invalid clip fall back only for the explicit request',async t=>{
  const state=setup(t,{decodeFails:true});
  assert.deepEqual(await requestSpeech('Find 18 plus 7.'),{status:'requested',source:'device'});assert.equal(state.contexts.length,0);
  assert.deepEqual(await requestSpeech('Hello, learner.'),{status:'requested',source:'device'});
  assert.deepEqual(state.messages.filter(message=>message.type==='speak').map(message=>message.text),['Find 18 plus 7.','Hello, learner.']);
  assert.equal(state.contexts[0].state,'closed');
});

test('malformed base64 and synchronous decoder failure cannot leave an unhandled resume rejection',async t=>{
  const state=setup(t);state.set('__DOODLE_VOICE_CLIPS__',{'Hello, learner.':'data:audio/wav;base64,A'});
  assert.equal((await requestSpeech('Hello, learner.')).source,'device');assert.equal(state.contexts.length,0);
  state.set('__DOODLE_VOICE_CLIPS__',{'Hello, learner.':clip});
  AudioContext.prototype.resume=()=>Promise.reject(new Error('Resume denied'));
  AudioContext.prototype.decodeAudioData=()=>{throw new Error('Synchronous decode failure');};
  assert.deepEqual(await requestSpeech('Hello, learner.'),{status:'failed',source:'clip'});assert.equal(state.contexts[0].state,'closed');
});

test('native denial reports an honest failure without scheduling or silently changing the requested audio',async t=>{
  const state=setup(t);webkit.messageHandlers.doodleAudio.postMessage=()=>Promise.resolve({ok:false});
  assert.deepEqual(await requestSpeech('Hello, learner.'),{status:'failed',source:'clip'});assert.equal(state.contexts[0].sources.length,0);
  assert.equal(state.messages.filter(message=>message.type==='speak').length,0);
});

test('decode resource timeout fails without TTS, and late completion cannot restart playback',async t=>{
  const state=setup(t,{native:false,decodePending:true}),timers=new Map();let next=0;
  state.set('setTimeout',(callback,delay)=>{timers.set(++next,{callback,delay});return next;});state.set('clearTimeout',id=>timers.delete(id));
  const played=requestSpeech('Hello, learner.');await flush();
  const timeout=[...timers.values()].find(timer=>timer.delay===CLIP_PREPARATION_LIMIT);assert.ok(timeout);timeout.callback();await flush();
  assert.deepEqual(await played,{status:'failed',source:'clip'});assert.equal(state.utterances.length,0);
  state.contexts[0].decodeNow();await flush();assert.equal(state.contexts[0].sources.length,0);assert.equal(state.contexts[0].state,'closed');
});

test('a stalled clip cannot leave spoken help pending forever or repeat the phrase automatically',async t=>{
  const state=setup(t),timers=new Map();let next=0;
  state.set('setTimeout',callback=>{timers.set(++next,callback);return next;});state.set('clearTimeout',id=>timers.delete(id));
  const played=requestSpeech('Hello, learner.');await flush();assert.equal(state.contexts[0].sources[0].started,true);
  [...timers.values()][0]();assert.deepEqual(await played,{status:'failed',source:'clip'});
  assert.equal(state.contexts[0].sources[0].stopped,true);assert.equal(state.messages.filter(message=>message.type==='speak').length,0);
});

test('browser fallback selects an offline English voice and preserves the question',async t=>{
  const state=setup(t,{native:false});state.synth.voices.unshift({name:'Remote',lang:'en-US',localService:false});
  const played=requestSpeech('Which number is 12?');assert.equal(state.utterances.length,1);assert.equal(state.utterances[0].text,'Which number is 12?');
  assert.equal(state.utterances[0].voice.localService,true);state.utterances[0].onend();assert.deepEqual(await played,{status:'played',source:'device'});
});

test('late local voice availability cannot restart a cancelled request',async t=>{
  const state=setup(t,{native:false});state.synth.voices=[];const played=requestSpeech('Which number is 12?');
  const callback=[...state.voiceListeners][0];assert.ok(callback);stopSpeaking();assert.deepEqual(await played,{status:'cancelled'});
  state.synth.voices=[{lang:'en-US',localService:true}];callback();assert.equal(state.utterances.length,0);assert.equal(state.voiceListeners.size,0);
});

test('empty, hidden, remote-URL and missing-backend requests never fetch or autoplay',async t=>{
  const state=setup(t);state.set('fetch',()=>{throw new Error('Speech must not fetch at runtime');});
  assert.deepEqual(await requestSpeech('  '),{status:'unavailable'});document.hidden=true;assert.deepEqual(await requestSpeech('Hello, learner.'),{status:'unavailable'});
  document.hidden=false;state.set('__DOODLE_VOICE_CLIPS__',{'Remote':'https://example.com/voice.mp3'});
  assert.equal((await requestSpeech('Remote')).source,'device');assert.equal(state.contexts.length,0);
  state.set('webkit',undefined);state.set('speechSynthesis',undefined);state.set('AudioContext',undefined);
  assert.equal(canSpeak(),false);assert.deepEqual(await requestSpeech('Hello.'),{status:'unavailable'});
});

function fakeClock(state){
  let now=0,next=0;const timers=new Map();
  state.set('setTimeout',(callback,delay=0)=>{timers.set(++next,{callback,at:now+delay});return next;});state.set('clearTimeout',id=>timers.delete(id));
  return {async advance(amount){await flush();const end=now+amount;for(;;){const timer=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!timer)break;now=timer[1].at;timers.delete(timer[0]);timer[1].callback();await flush();}now=end;await flush();}};
}

for(const delay of [5398,14260])test(`cold decoding at ${delay}ms cannot consume the healthy output-start deadline`,async t=>{
  const state=setup(t,{decodePending:true}),clock=fakeClock(state);let settled=false,starts=0;
  const played=requestSpeech('Hello, learner.',{onStart:()=>starts++});played.then(()=>{settled=true;});
  await clock.advance(delay);assert.equal(settled,false);assert.equal(starts,0);assert.equal(state.contexts[0].state,'running');assert.equal(state.messages.some(message=>message.type==='speak'),false);
  state.contexts[0].decodeNow();await flush();assert.equal(starts,1);assert.equal(state.contexts[0].sources.length,1);state.contexts[0].sources[0].onended();assert.deepEqual(await played,{status:'played',source:'clip'});
});

test('output interruption during silent decoding cancels without fallback or revival',async t=>{
  const state=setup(t,{decodePending:true});const played=requestSpeech('Hello, learner.');await flush();
  const context=state.contexts[0];context.state='suspended';context.emit();assert.deepEqual(await played,{status:'cancelled'});
  context.decodeNow();await flush();assert.equal(context.sources.length,0);assert.equal(state.messages.some(message=>message.type==='speak'),false);
});

function offlineDecoder(state,{pending=false,fail=false,length=7200}={}){
  const decoders=[];
  class Offline {
    constructor(channels,length,rate){assert.deepEqual([channels,length,rate],[1,1,24000]);decoders.push(this);}
    decodeAudioData(){this.calls=(this.calls||0)+1;if(fail)return Promise.reject(new Error('Invalid'));
      if(pending)return new Promise(resolve=>{this.finish=()=>resolve({duration:.3,length,numberOfChannels:1});});
      return Promise.resolve({duration:.3,length,numberOfChannels:1});}
    resume(){throw Error('Silent preparation must not resume');}
    createBufferSource(){throw Error('Silent preparation must not create a source');}
    startRendering(){throw Error('Silent preparation must not render');}
  }
  state.set('OfflineAudioContext',Offline);return decoders;
}

test('Coach predecode stays silent and coalesces with immediate Hear and repeated playback',async t=>{
  const state=setup(t),decoders=offlineDecoder(state,{pending:true});
  const prepared=prepareSpeech('Hello, learner.');const duplicate=prepareSpeech('Hello, learner.');assert.equal(decoders.length,1);assert.equal(state.contexts.length,0);assert.deepEqual(state.messages,[]);
  const played=requestSpeech('Hello, learner.');await flush();assert.equal(decoders.length,1);assert.equal(state.contexts[0].sources.length,0);
  decoders[0].finish();await prepared;await duplicate;await flush();state.contexts[0].sources[0].onended();assert.equal((await played).source,'clip');
  const second=requestSpeech('Hello, learner.');await flush();assert.equal(decoders.length,1);state.contexts[1].sources[0].onended();assert.equal((await second).source,'clip');
});

test('cancelled predecode can only populate the bounded cache, never revive sound',async t=>{
  const state=setup(t),decoders=offlineDecoder(state,{pending:true});prepareSpeech('Hello, learner.');const played=requestSpeech('Hello, learner.');
  stopSpeaking();assert.deepEqual(await played,{status:'cancelled'});decoders[0].finish();await flush();assert.equal(state.contexts[0].sources.length,0);assert.equal(state.messages.some(message=>message.type==='speak'),false);
});

test('silent cache bounds concurrent decoding and retains at most four completed clips',async t=>{
  const state=setup(t),decoders=offlineDecoder(state,{pending:true});
  const clips=Object.fromEntries(Array.from({length:6},(_,i)=>['Clip '+i,'data:audio/wav;base64,'+btoa(String(i))]));state.set('__DOODLE_VOICE_CLIPS__',clips);
  const first=prepareSpeech('Clip 0'),second=prepareSpeech('Clip 1');assert.equal(decoders.length,2);assert.deepEqual(await prepareSpeech('Clip 2'),{status:'failed',reason:'decode-busy'});assert.equal(decoders.length,2);
  decoders[0].finish();decoders[1].finish();await first;await second;
  for(let i=2;i<6;i++){const task=prepareSpeech('Clip '+i);decoders.at(-1).finish();await task;}
  const again=prepareSpeech('Clip 0');assert.equal(decoders.length,7,'the oldest retained clip was evicted');decoders.at(-1).finish();await again;
});

test('failed silent decode is evicted and can be retried, without warming device speech',async t=>{
  const state=setup(t),decoders=offlineDecoder(state,{fail:true});assert.equal((await prepareSpeech('Hello, learner.')).status,'failed');assert.equal((await prepareSpeech('Hello, learner.')).status,'failed');assert.equal(decoders.length,2);assert.deepEqual(state.messages,[]);assert.equal(state.contexts.length,0);
});


test('silent cache enforces its 16 MiB PCM byte limit before the entry-count limit',async t=>{
  const state=setup(t),decoders=offlineDecoder(state,{length:2200000});
  state.set('__DOODLE_VOICE_CLIPS__',{'Large one':'data:audio/wav;base64,QQ==','Large two':'data:audio/wav;base64,Qg=='});
  await prepareSpeech('Large one');await prepareSpeech('Large two');assert.equal(decoders.length,2);
  await prepareSpeech('Large one');assert.equal(decoders.length,3,'two 8.8 MB buffers exceed the retained PCM cap');
  assert.equal(state.contexts.length,0);assert.deepEqual(state.messages,[]);
});

test('timed-out offline decoders hold their slots until real settlement, then new preparation can recover',async t=>{
  const state=setup(t),clock=fakeClock(state),decoders=offlineDecoder(state,{pending:true});
  state.set('__DOODLE_VOICE_CLIPS__',{'One':'data:audio/wav;base64,MQ==','Two':'data:audio/wav;base64,Mg==','Three':'data:audio/wav;base64,Mw=='});
  const first=prepareSpeech('One'),second=prepareSpeech('Two');await clock.advance(CLIP_PREPARATION_LIMIT);
  assert.deepEqual(await first,{status:'failed',reason:'decode-timeout'});assert.deepEqual(await second,{status:'failed',reason:'decode-timeout'});
  assert.deepEqual(await prepareSpeech('Three'),{status:'failed',reason:'decode-busy'});assert.equal(decoders.length,2);
  decoders[0].finish();decoders[1].finish();await flush();const third=prepareSpeech('Three');assert.equal(decoders.length,3);decoders[2].finish();assert.equal((await third).status,'ready');
  assert.equal(state.contexts.length,0);assert.deepEqual(state.messages,[]);
});

test('a shared pending cache entry cannot revive superseded or backgrounded Hear requests',async t=>{
  const state=setup(t),decoders=offlineDecoder(state,{pending:true});
  const first=requestSpeech('Hello, learner.'),second=requestSpeech('Hello, learner.');assert.equal(decoders.length,1);assert.deepEqual(await first,{status:'cancelled'});
  await flush();document.hidden=true;decoders[0].finish();await flush();assert.deepEqual(await second,{status:'cancelled'});assert.ok(state.contexts.every(context=>context.sources.length===0));
  document.hidden=false;const third=requestSpeech('Hello, learner.');await flush();assert.equal(decoders.length,1);state.contexts[2].sources[0].onended();assert.deepEqual(await third,{status:'played',source:'clip'});
});
