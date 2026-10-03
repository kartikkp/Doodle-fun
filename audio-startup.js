// Coordinate output readiness without owning sources or the context lifetime.
// Keep this call in the original click stack: both WebKit's gesture grant and
// the native playback-session request must begin before any await.
export function beginAudioStartup(context,{isCurrent=()=>true,startTimeout=2500,prepareTimeout=10000}={}) {
  let settled=false,nativeReady=false,prepareTimer=null,startTimer=null;
  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  const finish=status=>{
    if(settled)return;
    settled=true;
    clearTimeout(prepareTimer);clearTimeout(startTimer);
    context.removeEventListener('statechange',stateChanged);
    resolveReady({status});
  };
  const current=()=>{
    if(settled)return false;
    if(!isCurrent()){finish('cancelled');return false;}
    return true;
  };
  function stateChanged() {
    if(!current())return;
    if(context.state==='closed'||context.state==='interrupted'){finish('failed');return;}
    // Initial suspension is expected while the native session is activating.
    if(nativeReady&&context.state==='running')finish('ready');
  }
  const startWatchdog=()=>{
    startTimer=setTimeout(()=>{if(current())finish('failed');},startTimeout);
  };
  const resume=()=>{
    try{return Promise.resolve(context.resume());}
    catch(error){return Promise.reject(error);}
  };
  const request={ready,cancel:()=>finish('cancelled')};
  if(!current())return request;
  context.addEventListener('statechange',stateChanged);
  try {
    const session=globalThis.navigator?.audioSession;
    if(session&&session.type!=='playback')session.type='playback';
  } catch { /* This preference is optional in browsers without Audio Session support. */ }

  let native,preparing;
  try {
    native=globalThis.webkit?.messageHandlers?.doodleAudio;
    if(native) {
      prepareTimer=setTimeout(()=>{if(current())finish('failed');},prepareTimeout);
      preparing=Promise.resolve(native.postMessage({type:'prepareGameAudio'}));
    }
  } catch(error) { preparing=Promise.reject(error); }
  nativeReady=!native&&!preparing;
  if(nativeReady)startWatchdog();
  // Do not await native preparation before this first resume. Its promise may
  // remain pending even after the native session has successfully activated.
  const resuming=current()&&context.state!=='running'?resume():Promise.resolve();
  resuming.then(stateChanged,()=>{
    if(!current())return;
    // A pre-activation rejection does not preclude the one native-ready retry.
    if(nativeReady&&!preparing) {
      if(context.state==='running')finish('ready');else finish('failed');
    }
  });
  if(preparing)preparing.then(prepared=>{
    if(!current())return;
    clearTimeout(prepareTimer);prepareTimer=null;
    if(prepared?.ok!==true){finish('failed');return;}
    nativeReady=true;
    startWatchdog();
    stateChanged();
    if(!current())return;
    if(context.state!=='suspended'){finish('failed');return;}
    // Exactly one post-activation request, still owned by this user gesture.
    // Proven running state may finish readiness without either resume settling.
    resume().then(stateChanged,()=>{
      if(!current())return;
      if(context.state==='running')finish('ready');else finish('failed');
    });
  },()=>{if(current())finish('failed');});
  else stateChanged();
  return request;
}
