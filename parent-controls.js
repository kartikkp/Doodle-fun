import {readStore,writeStore} from './core.js';
import {recordHint,getCurrentRound,subscribeProgress} from './progression.js';

const STORE='parent-controls-v1',ITERATIONS=100000;
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=value=>Uint8Array.from(value.match(/../g)||[],byte=>parseInt(byte,16));
const randomHex=length=>hex(crypto.getRandomValues(new Uint8Array(length)));
export function normalizeParentControls(value) {
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const valid=input.credential && /^[a-f0-9]{32}$/.test(input.credential.salt) && /^[a-f0-9]{64}$/.test(input.credential.hash) && /^[a-f0-9]{64}$/.test(input.credential.recoveryHash);
  return {version:1,hints:['on','ask','off'].includes(input.hints)?input.hints:'on',lockSettings:input.lockSettings===true,kidSafe:input.kidSafe===true&&Boolean(valid),credential:valid?{salt:input.credential.salt,hash:input.credential.hash,recoveryHash:input.credential.recoveryHash}:null,failures:Number.isSafeInteger(input.failures)?Math.min(5,Math.max(0,input.failures)):0,retryAfter:Number.isFinite(input.retryAfter)?Math.min(Date.now()+30000,Math.max(0,input.retryAfter)):0};
}
async function derive(secret,salt) {
  if(!globalThis.crypto?.subtle)throw new Error('PIN protection is unavailable on this device.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),'PBKDF2',false,['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:unhex(salt),iterations:ITERATIONS,hash:'SHA-256'},key,256)));
}
export async function makeParentCredential(pin,recoveryCode,salt=randomHex(16)) {
  if(!/^\d{4,6}$/.test(pin))throw new Error('Choose a PIN with 4 to 6 digits.');
  return {salt,hash:await derive(pin,salt),recoveryHash:await derive(recoveryCode.replace(/[-–—\s]/g,'').toUpperCase(),salt)};
}
export async function verifyParentSecret(credential,secret,recovery=false) {
  if(!credential)return false;
  const value=recovery?secret.replace(/[-–—\s]/g,'').toUpperCase():secret;
  const actual=await derive(value,credential.salt),expected=recovery?credential.recoveryHash:credential.hash;
  let difference=actual.length^expected.length;
  for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return difference===0;
}

export const HINT_SELECTOR='[data-hint],.challenge-hint-button,.discover-hint,.adventure-hint,[data-listening-hint],.listening-hint,.learn-hint,.learn-demo,details.challenge-help>summary,details.learn-help>summary,details.adventure-help>summary,details.listening-help>summary';

export function createParentControls({onChange=()=>{},onNotice=()=>{},onRelock=()=>{}}={}) {
  let preferences=normalizeParentControls(readStore(STORE,null)),pending=null,settingsSession=false,grant=null,epoch=0;
  const bypass=new WeakSet();
  const panel=document.getElementById('parent-controls-panel');
  panel.innerHTML=`<h3>Kid-safe play</h3><label class="parent-lock-option"><input id="parent-kid-safe" type="checkbox"> Require a parent PIN to return to the activity menu</label><p class="coach-small">While on, sharing and outside websites stay closed, and age and difficulty changes need your PIN. Drawing, activity modes, instructions and sound replay stay available.</p><p class="coach-small">This does not lock the Home gesture, app switching, or browser controls. On iPhone or iPad, a grown-up must start Guided Access to keep the device in Doodle Fun.</p><button class="button" type="button" data-open-guided>How to use Guided Access</button><h3 class="parent-hints-heading">Hints & grown-up controls</h3><label class="settings-field" for="hint-policy">Learning hints<select id="hint-policy"><option value="on">Available when requested</option><option value="ask">Ask a grown-up for a PIN</option><option value="off">Hints off</option></select></label><p class="coach-small">Instructions, spoken questions and sound replay stay available. Worked examples and Coach strategies follow this choice.</p><label class="parent-lock-option"><input id="parent-lock-settings" type="checkbox"> Lock age and difficulty changes with the PIN</label><div class="parent-control-actions"><button class="button" id="parent-pin-setup" type="button">Set a parent PIN</button><button class="button" id="parent-pin-remove" type="button">Remove PIN</button></div><p class="parent-controls-status" role="status"></p>`;
  const dialog=document.createElement('dialog');dialog.className='settings-dialog pin-dialog';dialog.id='parent-pin-dialog';dialog.setAttribute('aria-labelledby','parent-pin-title');
  dialog.innerHTML=`<form id="parent-pin-form" novalidate><div class="dialog-heading"><div><span class="eyebrow">FOR A GROWN-UP</span><h2 id="parent-pin-title">Parent PIN</h2></div><button class="icon-button" type="button" data-pin-cancel aria-label="Cancel parent PIN">×</button></div><p id="parent-pin-purpose"></p><label class="settings-field" for="parent-pin-input" id="parent-pin-label">Your PIN</label><input id="parent-pin-input" type="password" inputmode="numeric" autocomplete="off" maxlength="6"><div id="parent-pin-confirm-row"><label class="settings-field" for="parent-pin-confirm">Enter it again</label><input id="parent-pin-confirm" type="password" inputmode="numeric" autocomplete="off" maxlength="6"></div><p id="parent-pin-error" role="alert"></p><div class="parent-actions"><button class="button" type="button" data-pin-cancel>Cancel</button><button class="button button-primary" type="submit" id="parent-pin-submit">Continue</button></div><button class="coach-reset" type="button" id="parent-pin-recover">Use my recovery code</button></form>`;
  document.body.append(dialog);
  const $=id=>document.getElementById(id),status=panel.querySelector('.parent-controls-status');
  const roundScope=()=>{const round=getCurrentRound();return round?`${round.mode}:${round.age}:${round.step}:${round.roundKey}`:`${location.hash}:creative`;};
  function publish(previous=preferences){document.body.dataset.helpPolicy=preferences.hints;document.body.dataset.kidSafe=String(preferences.kidSafe);render();onChange(preferences,previous);}
  function save(next){const previous=preferences;if(!writeStore(STORE,next)){writeStore(STORE,previous);throw new Error('This device could not save the controls. Free some storage and try again.');}preferences=normalizeParentControls(next);publish(previous);}
  function render(){ $('parent-kid-safe').checked=preferences.kidSafe;$('hint-policy').value=preferences.hints;$('parent-lock-settings').checked=preferences.lockSettings||preferences.kidSafe;$('parent-lock-settings').disabled=!preferences.credential||preferences.kidSafe;$('parent-pin-setup').textContent=preferences.credential?'Change parent PIN':'Set a parent PIN';$('parent-pin-remove').hidden=!preferences.credential;status.textContent=preferences.credential?'PIN saved on this device. Keep your recovery code somewhere safe.':'An optional PIN protects hint choices. Your drawings and medals stay on this device.';}
  function settle(value){const current=pending;pending=null;epoch++;$('parent-pin-input').value='';$('parent-pin-confirm').value='';$('parent-pin-submit').disabled=false;dialog.close();current?.resolve(value);}
  function prompt({setup=false,kidSafe=false,purpose='Unlock grown-up controls'}={}) {
    if(pending)return Promise.resolve(false);
    return new Promise(resolve=>{pending={resolve,setup,kidSafe,recovery:false};$('parent-pin-title').textContent=setup?'Choose a parent PIN':'Ask a grown-up';$('parent-pin-purpose').textContent=setup?'Use 4–6 digits. A recovery code will let you reset this PIN without losing artwork or progress.':purpose;$('parent-pin-label').textContent=setup?'New PIN':'Parent PIN';$('parent-pin-input').type='password';$('parent-pin-input').inputMode='numeric';$('parent-pin-input').maxLength=6;$('parent-pin-confirm-row').hidden=!setup;$('parent-pin-recover').hidden=setup;$('parent-pin-recover').disabled=false;$('parent-pin-error').textContent='';$('parent-pin-submit').textContent=setup?'Save PIN':'Continue';$('parent-pin-submit').disabled=false;dialog.showModal();$('parent-pin-input').focus();});
  }
  async function authorize(purpose){return preferences.credential?prompt({purpose}):true;}
  async function settingsAction(action,{opening=false}={}) {
    const route=location.hash;
    if(preferences.credential&&!settingsSession&&(opening||preferences.lockSettings||preferences.kidSafe)) {
      if(!await authorize('Enter your PIN to change grown-up settings.'))return false;
    }
    if(route!==location.hash||document.hidden)return false;
    if(opening)settingsSession=true;
    action();return true;
  }
  // This protects app navigation only. iOS system controls require Guided Access.
  async function requestExit(action) {
    const route=location.hash;
    if(preferences.kidSafe&&!await authorize('Enter your PIN to return to the activity menu.'))return false;
    if(route!==location.hash||document.hidden)return false;
    action();return true;
  }
  async function setKidSafe(enabled) {
    const route=location.hash;
    if(preferences.credential&&!settingsSession&&!await authorize('Enter your PIN to change kid-safe play.'))return false;
    if(route!==location.hash||document.hidden)return false;
    if(enabled&&!preferences.credential)return prompt({setup:true,kidSafe:true});
    try {save({...preferences,kidSafe:enabled});return true;}
    catch(error){onNotice(error.message);return false;}
  }
  async function requestHint(action){
    if(preferences.hints==='off'){onNotice('Hints are turned off in Grown-ups. You can keep trying or choose another activity.');return false;}
    const scope=roundScope(),route=location.hash;
    if(preferences.hints==='ask'&&grant!==scope){
      if(!preferences.credential){onNotice('A grown-up needs to set up the hint PIN.');return false;}
      if(!await authorize('Enter your PIN to allow hints for this round.'))return false;
      if(scope!==roundScope()||route!==location.hash||document.hidden)return false;
      grant=scope;
    }
    recordHint();action();return true;
  }
  function relock({closeDialogs=false}={}){grant=null;settingsSession=false;if(pending)settle(false);if(closeDialogs){for(const id of ['guided-access-dialog','privacy-dialog','support-dialog','grownups-dialog'])document.getElementById(id)?.close();document.getElementById('coach-dialog')?.close();document.querySelector('[aria-label="Save your parent recovery code"]')?.close();}onRelock();}
  $('parent-pin-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!pending||pending.processing)return;
    const current=pending,token=epoch,input=$('parent-pin-input').value,recovering=pending.recovery;
    if(preferences.retryAfter>Date.now()){$('parent-pin-error').textContent='Please wait a little before trying again.';return;}
    if(current.setup&&input!==$('parent-pin-confirm').value){$('parent-pin-error').textContent='The two PINs do not match.';return;}
    current.processing=true;$('parent-pin-submit').disabled=true;$('parent-pin-recover').disabled=true;$('parent-pin-error').textContent='';
    try {
      if(current.setup){
        const recovery=randomHex(6).toUpperCase(),credential=await makeParentCredential(input,recovery);
        if(pending!==current||token!==epoch)return;
        save({...preferences,credential,lockSettings:true,kidSafe:current.kidSafe||preferences.kidSafe,failures:0,retryAfter:0});settingsSession=true;
        settle(true);showRecovery(recovery);
      } else {
        const correct=await verifyParentSecret(preferences.credential,input,recovering);
        if(pending!==current||token!==epoch)return;
        if(!correct){const failures=preferences.failures+1;save({...preferences,failures:failures>=5?0:failures,retryAfter:failures>=5?Date.now()+30000:0});$('parent-pin-error').textContent=failures>=5?'Please wait 30 seconds before another try.':'That did not match. Ask your grown-up to try again.';$('parent-pin-input').value='';return;}
        if(recovering){save({...preferences,credential:null,hints:'on',lockSettings:false,kidSafe:false,failures:0,retryAfter:0});grant=null;settingsSession=false;settle(false);onNotice('Parent controls reset. Artwork and progress are safe. Set a new PIN in Grown-ups.');}
        else {save({...preferences,failures:0,retryAfter:0});settle(true);}
      }
    }catch(error){if(pending===current)$('parent-pin-error').textContent=error.message;}
    finally {if(pending===current){current.processing=false;$('parent-pin-submit').disabled=false;$('parent-pin-recover').disabled=false;}}
  });
  function showRecovery(code){
    const box=document.createElement('dialog');box.className='settings-dialog';box.setAttribute('aria-label','Save your parent recovery code');box.innerHTML='<h2>Keep your recovery code</h2><p class="settings-intro">Write this down somewhere only a grown-up can find. It resets parent controls without deleting drawings or medals.</p><output class="parent-recovery-code"></output><p class="coach-small">This is a household control. Removing the app or clearing its data also removes local settings.</p><button type="button" class="button button-primary">I saved the code</button>';box.querySelector('output').textContent=code.match(/.{1,4}/g).join('–');box.querySelector('button').onclick=()=>box.close();box.addEventListener('close',()=>box.remove());document.body.append(box);box.showModal();
  }
  dialog.querySelectorAll('[data-pin-cancel]').forEach(button=>button.addEventListener('click',()=>settle(false)));
  dialog.addEventListener('cancel',event=>{event.preventDefault();settle(false);});dialog.addEventListener('close',()=>{if(!dialog.open&&pending)settle(false);});
  $('parent-pin-recover').addEventListener('click',()=>{if(!pending||pending.processing)return;pending.recovery=true;$('parent-pin-label').textContent='Recovery code';$('parent-pin-purpose').textContent='Reset the PIN, hints and kid-safe play. Your drawings and practice stay safe.';$('parent-pin-input').type='text';$('parent-pin-input').inputMode='text';$('parent-pin-input').maxLength=20;$('parent-pin-input').value='';$('parent-pin-error').textContent='';$('parent-pin-recover').hidden=true;$('parent-pin-input').focus();});
  $('parent-kid-safe').addEventListener('change',()=>{const enabled=$('parent-kid-safe').checked;render();setKidSafe(enabled);});
  $('parent-pin-setup').addEventListener('click',async()=>{if(preferences.credential&&!settingsSession&&!await authorize('Enter your current PIN before changing it.'))return;await prompt({setup:true});});
  $('parent-pin-remove').addEventListener('click',async()=>{if(!settingsSession&&!await authorize('Enter your PIN to remove parent protection.'))return;try{save({...preferences,credential:null,lockSettings:false,kidSafe:false,hints:preferences.hints==='ask'?'on':preferences.hints,failures:0,retryAfter:0});relock();}catch(error){onNotice(error.message);}});
  $('hint-policy').addEventListener('change',async()=>{const next=$('hint-policy').value;render();if(preferences.credential&&!settingsSession&&!await authorize('Enter your PIN to change hint choices.'))return;if(next==='ask'&&!preferences.credential&&!await prompt({setup:true}))return;try{save({...preferences,hints:next});grant=null;}catch(error){onNotice(error.message);}});
  $('parent-lock-settings').addEventListener('change',async()=>{const next=$('parent-lock-settings').checked;render();if(preferences.credential&&!settingsSession&&!await authorize('Enter your PIN to change the difficulty lock.'))return;try{save({...preferences,lockSettings:next});}catch(error){onNotice(error.message);}});
  document.addEventListener('click',event=>{
    const target=event.target.closest?.(HINT_SELECTOR);if(!target||target.closest('#parent-controls-panel,#parent-pin-dialog'))return;
    if(target.tagName==='SUMMARY'&&target.parentElement.open)return;
    if(bypass.has(target)){bypass.delete(target);return;}
    if(preferences.hints==='on'){recordHint();return;}
    event.preventDefault();event.stopImmediatePropagation();
    requestHint(()=>{if(!target.isConnected)return;bypass.add(target);target.click();});
  },true);
  const background=()=>relock({closeDialogs:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)background();});window.addEventListener('pagehide',background);window.addEventListener('doodle-native-inactive',background);window.addEventListener('hashchange',background);
  let observedScope=roundScope();subscribeProgress(()=>{const next=roundScope();if(next!==observedScope){observedScope=next;grant=null;if(pending&&!pending.setup)settle(false);if(preferences.hints==='ask')document.getElementById('coach-dialog')?.close();onRelock();}});
  render();document.body.dataset.helpPolicy=preferences.hints;document.body.dataset.kidSafe=String(preferences.kidSafe);
  return {get preferences(){return {...preferences};},settingsAction,requestHint,requestExit,setKidSafe,relock,closeSettings:()=>{settingsSession=false;},refresh:()=>publish()};
}
