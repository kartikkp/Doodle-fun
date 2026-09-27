// Spoken help starts only from a Hear button. Clips are recorded at build time;
// no child's text or audio is sent to a service while the app is being used.
const clipPattern=/^data:audio\/(?:wav|x-wav|mpeg|mp4|aac|ogg);base64,([A-Za-z0-9+/=]+)$/;
let generation=0,current=null;

export const normalizeSpeechText=text=>String(text??'').trim().replace(/\s+/g,' ');

export function canSpeak() {
  return Boolean(globalThis.webkit?.messageHandlers?.doodleNative || globalThis.speechSynthesis ||
    ((globalThis.AudioContext||globalThis.webkitAudioContext) && Object.values(globalThis.__DOODLE_VOICE_CLIPS__||{}).some(value=>typeof value==='string'&&clipPattern.test(value))));
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

export function requestSpeech(value) {
  const text=normalizeSpeechText(value).slice(0,2000);
  stopSpeaking();
  if(!text||globalThis.document?.hidden)return Promise.resolve({status:'unavailable'});
  const token=generation;
  return new Promise(resolve=>{
    const job={token,text,resolve,context:null,source:null,output:null,timer:null};current=job;
    const data=globalThis.__DOODLE_VOICE_CLIPS__?.[text],match=typeof data==='string'&&data.match(clipPattern);
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!match||!Audio){fallback(job);return;}
    try{
      const binary=globalThis.atob(match[1]),bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
      try{const session=globalThis.navigator?.audioSession;if(session&&session.type!=='playback')session.type='playback';}catch{}
      const native=globalThis.webkit?.messageHandlers?.doodleAudio;
      const prepared=Promise.resolve(native?native.postMessage({type:'prepareGameAudio'}):{ok:true}).catch(()=>({ok:false}));
      const context=new Audio();job.context=context;
      job.stateListener=()=>{if(current===job&&job.source&&context.state!=='running')finish(job,{status:'cancelled'});};
      context.addEventListener('statechange',job.stateListener);
      // Resume happens in the Hear click stack; decoding and the native reply
      // may finish later, but neither may revive a cancelled request.
      const resumed=context.state==='running'?Promise.resolve():context.resume();
      let decoded;
      try{decoded=context.decodeAudioData(bytes.buffer);}catch(error){decoded=Promise.reject(error);}
      job.timer=setTimeout(()=>fallback(job),5000);
      Promise.all([prepared,resumed,decoded]).then(([preparation,,buffer])=>{
        if(current!==job||job.token!==generation||job.context!==context)return;
        if(globalThis.document?.hidden){finish(job,{status:'cancelled'});return;}
        if(preparation?.ok!==true||context.state!=='running'||!buffer||!Number.isFinite(buffer.duration)||buffer.duration<=0){fallback(job);return;}
        clearTimeout(job.timer);
        const source=context.createBufferSource(),output=context.createGain();job.source=source;job.output=output;
        source.buffer=buffer;output.gain.value=1;source.connect(output);output.connect(context.destination);
        source.onended=()=>finish(job,{status:'played',source:'clip'});
        source.start();
        job.timer=setTimeout(()=>finish(job,{status:'failed',source:'clip'}),Math.ceil(buffer.duration*1000)+2000);
      }).catch(()=>{if(job.context===context)fallback(job);});
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
