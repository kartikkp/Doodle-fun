import {nativeBridge} from './parental-gate.js';

// Read-only native session status. A false value says nothing about whether
// Guided Access is enabled in Settings; the browser cannot query either state.
export function guidedAccessStatus(active,{native=false,pinSaved=false}={}) {
  const pin=pinSaved?'Doodle Fun PIN saved. ':'';
  if(!native)return pin+'This browser cannot check Guided Access. Follow the device steps below.';
  if(active===true)return pin+'Guided Access session active. End the session before opening Settings.';
  if(active===false)return pin+'Guided Access session not active. Start it after returning to Doodle Fun; it may already be set up in Settings.';
  return pin+'Guided Access session status unavailable. Follow the device steps below.';
}

export function createGuidedAccessGuide(parentControls) {
  const $=id=>document.getElementById(id),dialog=$('guided-access-dialog');
  const steps=[...dialog.querySelectorAll('[data-guided-step]')];
  let step=0,returnTo=null,active;
  function renderStatus(){
    const text=guidedAccessStatus(active,{native:Boolean(nativeBridge()),pinSaved:Boolean(parentControls.preferences.credential)});
    $('guided-access-status').textContent=text;
    $('guided-access-home-status').textContent=text;
    $('guided-access-reminder').hidden=!parentControls.preferences.kidSafe;
  }
  function renderStep(){
    steps.forEach((section,index)=>section.hidden=index!==step);
    $('guided-access-progress').textContent=`Step ${step+1} of ${steps.length}`;
    $('guided-access-back').hidden=step===0;
    $('guided-access-next').hidden=step===steps.length-1;
    $('guided-access-next').textContent=step===0?'Next: start in Doodle Fun':'Next: how to end';
    $('guided-access-done').hidden=step!==steps.length-1;
    $('guided-access-step-title-'+(step+1)).focus({preventScroll:true});
    dialog.scrollTop=0;
  }
  function open(button,{afterSetup=false}={}){
    returnTo=button;step=0;
    $('guided-access-intro').textContent=afterSetup
      ?'Your Doodle Fun PIN is saved. One more step keeps the device in this app: set up Apple’s Guided Access.'
      :'Your Doodle Fun PIN protects controls inside the app. Apple’s Guided Access separately keeps the device in one app.';
    renderStatus();if(!dialog.open)dialog.showModal();renderStep();
  }
  function openAfterSetup(){
    parentControls.closeSettings();
    open($('grownups-open'),{afterSetup:true});
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-open-guided]');if(!button)return;
    // Reentry with a saved PIN requires the current grown-up authorization.
    parentControls.settingsAction(()=>{open(button);parentControls.closeSettings();},{opening:true});
  });
  for(const id of ['guided-access-close','guided-access-done'])$(id).addEventListener('click',()=>dialog.close());
  $('guided-access-back').addEventListener('click',()=>{step=Math.max(0,step-1);renderStep();});
  $('guided-access-next').addEventListener('click',()=>{step=Math.min(steps.length-1,step+1);renderStep();});
  dialog.addEventListener('close',()=>{
    parentControls.closeSettings();
    const target=returnTo?.isConnected&&!returnTo.closest('[hidden]')?returnTo:$('grownups-open');
    target.focus({preventScroll:true});
  });
  window.addEventListener('doodle-native-guided-access',event=>{
    if(typeof event.detail?.active!=='boolean')return;
    active=event.detail.active;renderStatus();
  });
  // Never carry an active-session claim through an interruption before UIKit
  // reports a fresh value on returning to the foreground.
  const invalidate=()=>{active=undefined;renderStatus();};
  window.addEventListener('doodle-native-inactive',invalidate);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)invalidate();});
  renderStatus();
  return {openAfterSetup,refresh:renderStatus};
}
