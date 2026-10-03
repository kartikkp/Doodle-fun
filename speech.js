import {beginAudioStartup} from './audio-startup.js';
// Spoken help starts only from a Hear button. Clips are recorded at build time;
// no child's text or audio is sent to a service while the app is being used.
const clipPattern=/^data:audio\/(?:wav|x-wav|mpeg|mp4|aac|ogg);base64,([A-Za-z0-9+/=]+)$/;
let generation=0,current=null;

export const normalizeSpeechText=text=>String(text??'').trim().replace(/\s+/g,' ');

export function canSpeak() {
  return Boolean(globalThis.webkit?.messageHandlers?.doodleNative || globalThis.speechSynthesis ||
    ((globalThis.AudioContext||globalThis.webkitAudioContext) && Object.values(globalThis.__DOODLE_VOICE_CLIPS__||{}).some(value=>typeof value==='string'&&clipPattern.test(value))));
}

// Silent resource preparation is independent of output activation. Keep only
// four decoded clips (at most 16 MiB) in memory; never persist decoded audio.
const preparedClips=new Map(),MAX_PREPARED_CLIPS=4,MAX_PREPARED_BYTES=16*1024*1024;
let pendingDecodes=0;const MAX_PENDING_DECODES=2;
// Cold simulator decoding has taken 14.26s. This is a separate, cancellable UI
// resource-preparation ceiling, not a larger playback-start watchdog.
export const CLIP_PREPARATION_LIMIT=30000;
function clipBytes(data) {
  const match=typeof data==='string'&&data.match(clipPattern);
  if(!match)return null;
  const binary=globalThis.atob(match[1]);return Uint8Array.from(binary,char=>char.charCodeAt(0));
}
function decodeClip(context,data,onDecoded=()=>{}) {
  return new Promise(resolve=>{
    let settled=false;
    const complete=result=>{if(settled)return;settled=true;clearTimeout(timer);resolve(result);};
    const timer=setTimeout(()=>complete({status:'failed',reason:'decode-timeout'}),CLIP_PREPARATION_LIMIT);
    try {
      const bytes=clipBytes(data);
      if(!bytes){onDecoded();complete({status:'failed',reason:'invalid-clip'});return;}
      Promise.resolve(context.decodeAudioData(bytes.buffer)).then(buffer=>{
        onDecoded();complete(buffer&&Number.isFinite(buffer.duration)&&buffer.duration>0?{status:'ready',buffer}:{status:'failed',reason:'invalid-clip'});
      },()=>{onDecoded();complete({status:'failed',reason:'invalid-clip'});});
    }catch{onDecoded();complete({status:'failed',reason:'invalid-clip'});}
  });
}
function prepareClip(data) {
  const Offline=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
  if(!Offline)return null;
  const cached=preparedClips.get(data);
  if(cached?.decoder===Offline){preparedClips.delete(data);preparedClips.set(data,cached);return cached.promise;}
  if(pendingDecodes>=MAX_PENDING_DECODES)return Promise.resolve({status:'failed',reason:'decode-busy'});
  try {
    // OfflineAudioContext cannot send sound to the speakers. Do not render,
    // resume, create sources, request native activation, or create a live context.
    const context=new Offline(1,1,24000),entry={decoder:Offline,promise:null,bytes:0};
    pendingDecodes++;
    entry.promise=decodeClip(context,data,()=>{pendingDecodes--;}).then(result=>{
      if(preparedClips.get(data)!==entry)return result;
      if(result.status!=='ready'){preparedClips.delete(data);return result;}
      entry.bytes=(result.buffer.length||Math.ceil(result.buffer.duration*24000))*(result.buffer.numberOfChannels||1)*4;
      let bytes=[...preparedClips.values()].reduce((total,item)=>total+item.bytes,0);
      while(preparedClips.size>MAX_PREPARED_CLIPS||bytes>MAX_PREPARED_BYTES){const [key,old]=preparedClips.entries().next().value;preparedClips.delete(key);bytes-=old.bytes;}
      return result;
    });
    preparedClips.set(data,entry);
    while(preparedClips.size>MAX_PREPARED_CLIPS)preparedClips.delete(preparedClips.keys().next().value);
    return entry.promise;
  }catch{return null;}
}
export function prepareSpeech(value) {
  const text=normalizeSpeechText(value).slice(0,2000),data=globalThis.__DOODLE_VOICE_CLIPS__?.[text];
  if(typeof data!=='string'||!clipPattern.test(data))return Promise.resolve({status:'unavailable'});
  return prepareClip(data)||Promise.resolve({status:'unavailable'});
}

function closeContext(context) {
  if(!context)return;
  // A pending resume can arrive after cancellation. A retired context never
  // regains output ownership, even if WebKit delivers that state change late.
  let closing=false;
  const close=()=>{
    if(context.state==='closed'||closing)return;
    closing=true;
    try{Promise.resolve(context.close()).then(()=>{closing=false;},()=>{closing=false;});}
    catch{closing=false;}
  };
  context.addEventListener('statechange',close);close();
}

function release(job) {
  clearTimeout(job.timer);
  job.startup?.cancel();job.startup=null;
  job.removeVoiceListener?.();
  if(job.utterance){job.utterance.onend=null;job.utterance.onerror=null;}
  if(job.source){job.source.onended=null;try{job.source.stop();}catch{}try{job.source.disconnect();}catch{}}
  try{job.output?.disconnect();}catch{}
  if(job.context&&job.stateListener)job.context.removeEventListener('statechange',job.stateListener);
  closeContext(job.context);
}

function finish(job,result) {
  if(current!==job)return;
  current=null;release(job);job.resolve(result);
}

export function stopSpeaking() {
  generation++;
  if(current)finish(current,{status:'cancelled'});
  try{globalThis.speechSynthesis?.cancel();}catch{}
  try{globalThis.webkit?.messageHandlers?.doodleNative?.postMessage({type:'stopSpeaking'});}catch{}
}

function fallback(job) {
  if(current!==job||job.token!==generation)return;
  if(globalThis.document?.hidden){finish(job,{status:'cancelled'});return;}
  release(job);job.source=null;job.output=null;job.context=null;job.stateListener=null;
  const native=globalThis.webkit?.messageHandlers?.doodleNative;
  if(native){
    try{native.postMessage({type:'speak',text:job.text});finish(job,{status:'requested',source:'device'});return;}catch{}
  }
  const synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance;
  if(!synth||!Utterance){finish(job,{status:'unavailable'});return;}
  const start=()=>{
    if(current!==job||job.token!==generation)return true;
    const voices=synth.getVoices?.()||[];
    // Web fallback remains on-device. Do not choose a remote browser voice.
    const voice=voices.find(voice=>voice.localService&&/^en[-_]US$/i.test(voice.lang)) || voices.find(voice=>voice.localService&&/^en(?:[-_]|$)/i.test(voice.lang));
    if(!voice)return false;
    clearTimeout(job.timer);job.removeVoiceListener?.();job.removeVoiceListener=null;
    const utterance=new Utterance(job.text);job.utterance=utterance;
    utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.95;
    utterance.onend=()=>finish(job,{status:'played',source:'device'});
    utterance.onerror=()=>finish(job,{status:'failed',source:'device'});
    try{synth.speak(utterance);}catch{finish(job,{status:'failed',source:'device'});}
    return true;
  };
  if(start())return;
  // Some browsers publish their local voice list asynchronously. This wait is
  // tied to the original Hear request and is cancelled by the same lifecycle.
  synth.addEventListener?.('voiceschanged',start);
  job.removeVoiceListener=()=>synth.removeEventListener?.('voiceschanged',start);
  job.timer=setTimeout(()=>finish(job,{status:'unavailable'}),1000);
}

export function requestSpeech(value,{onStart=()=>{}}={}) {
  const text=normalizeSpeechText(value).slice(0,2000);
  stopSpeaking();
  if(!text||globalThis.document?.hidden)return Promise.resolve({status:'unavailable'});
  const token=generation;
  return new Promise(resolve=>{
    const job={token,text,resolve,context:null,source:null,output:null,timer:null,startup:null};current=job;
    const data=globalThis.__DOODLE_VOICE_CLIPS__?.[text],match=typeof data==='string'&&data.match(clipPattern);
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!match||!Audio){fallback(job);return;}
    const owned=()=>current===job&&job.token===generation&&!globalThis.document?.hidden;
    try{
      // Validate before acquiring output. Invalid resources may use the explicit
      // Hear request's device-voice fallback, never a remote URL.
      clipBytes(data);
      const context=new Audio();job.context=context;
      job.stateListener=()=>{if(current===job&&(job.source||job.outputReady)&&context.state!=='running')finish(job,{status:'cancelled'});};
      context.addEventListener('statechange',job.stateListener);
      job.startup=beginAudioStartup(context,{isCurrent:owned,startTimeout:5000});
      const decoded=prepareClip(data)||decodeClip(context,data);
      const outputReady=job.startup.ready.then(result=>{
        if(!owned()){if(current===job)finish(job,{status:'cancelled'});return result;}
        if(result.status!=='ready')finish(job,{status:'failed',source:'clip'});
        else job.outputReady=true;
        return result;
      });
      // Decode latency never consumes the output-start deadline. A cold Hear
      // can wait for the same silent preparation already started by Coach.
      Promise.all([outputReady,decoded]).then(([startup,clip])=>{
        if(current!==job||job.context!==context)return;
        if(!owned()){finish(job,{status:'cancelled'});return;}
        if(startup.status!=='ready'||context.state!=='running'){finish(job,{status:'failed',source:'clip'});return;}
        if(clip.status!=='ready'){
          if(clip.reason==='invalid-clip')fallback(job);
          else finish(job,{status:'failed',source:'clip'});
          return;
        }
        const buffer=clip.buffer,source=context.createBufferSource(),output=context.createGain();job.source=source;job.output=output;
        source.buffer=buffer;output.gain.value=1;source.connect(output);output.connect(context.destination);
        source.onended=()=>finish(job,{status:'played',source:'clip'});
        source.start();onStart();
        job.timer=setTimeout(()=>finish(job,{status:'failed',source:'clip'}),Math.ceil(buffer.duration*1000)+2000);
      }).catch(()=>{if(current===job)finish(job,{status:'failed',source:'clip'});});
    }catch{fallback(job);}
  });
}

// Kept for callers migrating from the previous API; this never reads an opt-in
// setting. Every call site must still be an explicit Hear action.
export {requestSpeech as speak};

globalThis.addEventListener?.('pagehide',stopSpeaking);
globalThis.addEventListener?.('hashchange',stopSpeaking);
globalThis.addEventListener?.('doodle-native-inactive',stopSpeaking);
globalThis.document?.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeaking();});
