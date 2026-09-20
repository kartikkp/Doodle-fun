// Offline, bounded Web Audio voices. No samples, microphone, or network access.
export const TIMBRES = Object.freeze({
  drum:{name:'Drum',symbol:'●',description:'A low, soft boom.'},
  bell:{name:'Bell',symbol:'✧',description:'A clear, ringing sound.'},
  shaker:{name:'Shaker',symbol:'▥',description:'A soft, sandy shh.'},
  wood:{name:'Wood block',symbol:'▰',description:'A short, hollow knock.'},
});
export const MAX_MASTER_GAIN = .18;
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

/** Shared by live playback and OfflineAudioContext signal tests. Returns every
 * source and node so an interrupted route can cancel even future notes. */
export function scheduleSound(context, destination, event, at=context.currentTime) {
  const kind=event.kind||'tone',duration=clamp(Number(event.duration)||.28,.08,.65);
  const frequency=clamp(Number(event.frequency)||392,100,1600);
  const sources=[],nodes=[];
  const voice=(type,freq,peak,decay=duration,ending=null)=>{
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(freq,at);
    if(ending)oscillator.frequency.exponentialRampToValueAtTime(ending,at+decay*.8);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(peak,at+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,at+decay);
    gain.gain.linearRampToValueAtTime(0,at+decay+.012);
    oscillator.connect(gain);gain.connect(destination);
    oscillator.start(at);oscillator.stop(at+decay+.02);
    sources.push(oscillator);nodes.push(oscillator,gain);
  };
  if(kind==='shaker') {
    const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate);
    const samples=buffer.getChannelData(0);let seed=4711;
    for(let i=0;i<samples.length;i++){seed=(seed*1664525+1013904223)>>>0;samples[i]=(seed/4294967296*2-1)*.62;}
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=buffer;filter.type='bandpass';filter.frequency.value=2200;filter.Q.value=.7;
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.7,at+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    source.connect(filter);filter.connect(gain);gain.connect(destination);source.start(at);source.stop(at+duration+.02);
    sources.push(source);nodes.push(source,filter,gain);
  } else if(kind==='drum')voice('sine',150,.85,duration,55);
  else if(kind==='bell'){voice('sine',740,.48,duration);voice('sine',1110,.15,duration*.7);}
  else if(kind==='wood'){voice('sine',450,.7,Math.min(duration,.16));voice('triangle',680,.12,Math.min(duration,.11));}
  else voice('sine',frequency,.7,duration);
  return {sources,nodes,end:at+duration+.03};
}

export function createSoundEngine({onInterrupt=()=>{}}={}) {
  let context=null,master=null,stateHandler=null,volume=.55,generation=0,active=null;
  const release=(job)=>{
    for(const timer of job.timers)clearTimeout(timer);
    for(const source of job.sources){try{source.stop();}catch{/* Already ended. */}}
    for(const node of job.nodes){try{node.disconnect();}catch{/* Already detached. */}}
  };
  function stop() {
    generation++;
    if(active){const job=active;active=null;release(job);job.resolve({status:'cancelled'});}
  }
  function retireContext(expected=context) {
    if(!expected||expected!==context)return;
    // Clear ownership before close: its state event or pending resume may arrive
    // after a later user gesture has already created a replacement context.
    const oldMaster=master,oldHandler=stateHandler;
    context=null;master=null;stateHandler=null;
    if(oldHandler)expected.removeEventListener('statechange',oldHandler);
    try{oldMaster?.disconnect();}catch{/* Already detached. */}
    // WebKit can deliver a delayed output-start event even after close resolves.
    // Keep this guard on the retired context alone so that event re-closes it,
    // without interrupting a replacement context or retaining a global timer.
    let closing=false;
    const closeRetired=()=>{
      if(expected.state==='closed'||closing)return;
      closing=true;
      try{Promise.resolve(expected.close()).then(()=>{closing=false;},()=>{closing=false;});}
      catch{closing=false;/* Its sources and output are already disconnected. */}
    };
    expected.addEventListener('statechange',closeRetired);
    closeRetired();
  }
  function ensureContext() {
    if(context?.state==='closed')retireContext();
    if(!context||context.state==='closed') {
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Audio)throw new Error('Audio is not available in this browser.');
      const created=new Audio();context=created;master=created.createGain();master.gain.value=MAX_MASTER_GAIN*volume;master.connect(created.destination);
      stateHandler=()=>{
        if(context!==created||created.state==='running')return;
        const job=active;
        if(job){active=null;generation++;release(job);job.resolve({status:'failed',reason:'Audio was interrupted. Tap Listen to try again.'});}
        retireContext(created);
        onInterrupt();
      };
      created.addEventListener('statechange',stateHandler);
    }
    return context;
  }
  // Calling resume before the first await preserves Safari's user-gesture grant.
  function play(events,{onEvent=()=>{}}={}) {
    stop();const token=generation;
    let ctx,resuming;
    try {ctx=ensureContext();resuming=ctx.state==='running'?Promise.resolve():ctx.resume();}
    catch(error){retireContext();return Promise.resolve({status:'failed',reason:error.message});}
    return new Promise(resolve=>{
      const job={resolve,sources:[],nodes:[],timers:[],token};active=job;
      const fail=()=>{if(active!==job)return;active=null;release(job);retireContext(ctx);resolve({status:'failed',reason:'Sound could not start. Tap Listen to try again.'});};
      const timeout=setTimeout(fail,2500);job.timers.push(timeout);
      Promise.resolve(resuming).then(()=>{
        if(active!==job||token!==generation)return;
        clearTimeout(timeout);
        if(ctx.state!=='running'||!events.length){fail();return;}
        const start=ctx.currentTime+.035,startedAt=performance.now();let end=start;
        try {
          events.forEach((event,index)=>{
            const at=start+Math.max(0,Number(event.time)||0);
            const voice=scheduleSound(ctx,master,event,at);job.sources.push(...voice.sources);job.nodes.push(...voice.nodes);end=Math.max(end,voice.end);
            job.timers.push(setTimeout(()=>{if(active===job&&ctx.state==='running')onEvent(index);},Math.max(0,(at-ctx.currentTime)*1000)));
          });
        }catch{fail();return;}
        const check=()=>{
          if(active!==job)return;
          if(ctx.state!=='running'){fail();return;}
          if(ctx.currentTime>=end){active=null;release(job);resolve({status:'played'});return;}
          // Some unavailable output devices leave state="running" while the
          // audio clock is frozen. Never grant a heard challenge by wall time.
          if(performance.now()-startedAt>(end-start)*1000+2000){fail();return;}
          job.timers.push(setTimeout(check,25));
        };
        check();
      },fail);
    });
  }
  function suspend() {
    // A queued suspend can finish after the next resume. Retire instead, then
    // create a fresh context only on the next explicit Listen or pad gesture.
    stop();retireContext();
  }
  return {play,stop,suspend,setVolume(value){volume=clamp(Number(value)||.55,.15,.8);if(master)master.gain.setValueAtTime(MAX_MASTER_GAIN*volume,context.currentTime);},get state(){return context?.state||'uninitialized';}};
}
