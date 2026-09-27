import {readStore,writeStore} from './core.js';

// Additive storage: original engine progress remains previous practice, never
// retrospectively converted into accuracy medals.
export const SCORE_VERSION=1;
const STORE='medal-progress-v1',listeners=new Set();
const EXCLUDED=new Set(['draw','coloring','beat-maker','mirror-free','mirrorfree']);
const COMPLEX=new Set(['memory','maze','directions','make-a-shape','picture-sequence','sharing','letter-match','word-build','word-tracing','melody-echo','beat-studio']);
const rank=Object.freeze(Object.assign(Object.create(null),{bronze:1,silver:2,gold:3}));
const clamp=value=>Math.max(2,Math.min(10,Math.round(Number(value)||6)));
const validMode=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,59}$/.test(value);
const keyFor=(mode,age,step)=>`${mode}:${clamp(age)}:${clamp(step)}:v${SCORE_VERSION}`;
const copy=value=>JSON.parse(JSON.stringify(value));
let current=null;
const stored=readStore(STORE,null);
const state={version:SCORE_VERSION,entries:Object.create(null)};
if(stored?.version===SCORE_VERSION&&stored.entries&&typeof stored.entries==='object'&&!Array.isArray(stored.entries)) {
  for(const [key,value]of Object.entries(stored.entries).slice(0,4000)) {
    if(!value||!validMode(value.mode)||EXCLUDED.has(value.mode)||key!==keyFor(value.mode,value.age,value.step))continue;
    const required=roundsRequired(value.mode,value.step);
    if(!Number.isSafeInteger(value.cursor)||value.cursor<0||!Number.isSafeInteger(value.attempt)||value.attempt<1)continue;
    const rounds=Object.create(null);
    for(const [id,round]of Object.entries(value.rounds||{}).slice(0,1000))if(id.length<=180&&round&&typeof round==='object')rounds[id]={mistake:round.mistake===true,hint:round.hint===true,done:round.done===true};
    const seen=Array.isArray(value.seen)?value.seen.filter(id=>typeof id==='string'&&id.length<=180).slice(-2000):[];
    const result=value.result&&rank[value.result.medal]&&value.result.total===required&&Number.isInteger(value.result.clean)&&value.result.clean>=0&&value.result.clean<=required?copy(value.result):null;
    state.entries[key]={mode:value.mode,age:clamp(value.age),step:clamp(value.step),required,cursor:value.cursor,attempt:value.attempt,rounds,seen,bestMedal:rank[value.bestMedal]?value.bestMedal:null,result,skips:Math.max(0,Math.min(required,Number(value.skips)||0))};
  }
}
export function roundsRequired(mode,step) {return COMPLEX.has(mode)?3:clamp(step)<=3?3:clamp(step)<=5?4:5;}
function entry(mode,age,step,create=false) {
  if(!validMode(mode)||EXCLUDED.has(mode))return null;
  const key=keyFor(mode,age,step);
  if(!state.entries[key]&&create)state.entries[key]={mode,age:clamp(age),step:clamp(step),required:roundsRequired(mode,step),cursor:0,attempt:1,rounds:Object.create(null),seen:[],bestMedal:null,result:null,skips:0};
  return state.entries[key]||null;
}
function view(value,mode,age,step) {
  const completed=value?Object.values(value.rounds).filter(round=>round.done).length:0;
  return {mode:value?.mode??mode,age:value?.age??clamp(age),step:value?.step??clamp(step),completed,required:value?.required??roundsRequired(mode,step),bestMedal:value?.bestMedal??null,result:value?.result?copy(value.result):null,nextStep:value?.bestMedal==='gold'&&value.step<10?value.step+1:null,sessionId:value?.attempt??1,rounds:value?copy(value.rounds):{},cursor:value?.cursor??0};
}
function publish() {writeStore(STORE,state);const snapshot=getProgress();for(const callback of listeners){try{callback(snapshot);}catch{/* A progress display cannot interrupt play. */}}}
export function getCurrentRound(){return current?{...current}:null;}
export function getProgress(){return {version:SCORE_VERSION,currentRound:getCurrentRound(),entries:Object.fromEntries(Object.entries(state.entries).map(([key,value])=>[key,view(value)]))};}
export function getModeProgress(mode,age=6,step=age){return view(entry(mode,age,step),mode,age,step);}
export function getRoundCursor(mode,age=6,step=age){return entry(mode,age,step)?.cursor??0;}
export function subscribeProgress(callback){listeners.add(callback);return()=>listeners.delete(callback);}
function freshSet(value){value.attempt++;value.rounds=Object.create(null);value.skips=0;}
export function beginRound({mode,age=6,step=age,roundKey,scored=true,automaticSets=true}={}) {
  if(!validMode(mode)){current=null;return null;}
  const previous=current;
  current={mode,age:clamp(age),step:clamp(step),roundKey:String(roundKey??'0').slice(0,180),scored:scored===true&&!EXCLUDED.has(mode)};
  const changed=JSON.stringify(previous)!==JSON.stringify(current);
  if(!current.scored){if(changed)publish();return getCurrentRound();}
  const value=entry(mode,age,step,true),id=current.roundKey;
  const seed=Number(id);if(Number.isSafeInteger(seed)&&seed>=0)value.cursor=Math.max(value.cursor,seed);
  if(!value.rounds[id]&&!value.seen.includes(id)) {
    if(Object.values(value.rounds).filter(round=>round.done).length>=value.required){
      if(!automaticSets){if(changed)publish();return getCurrentRound();}
      freshSet(value);
    }
    // Skipping an unfinished question cannot improve the set's perfect score.
    // Leaving and returning to the same round is harmless.
    if(previous?.scored&&previous.mode===mode&&previous.age===current.age&&previous.step===current.step&&previous.roundKey!==id&&value.rounds[previous.roundKey]&&!value.rounds[previous.roundKey].done)value.skips=Math.min(value.required,value.skips+1);
    value.rounds[id]={mistake:false,hint:false,done:false};
  }
  if(changed)publish();
  return getCurrentRound();
}
function active(){if(!current?.scored)return null;const value=entry(current.mode,current.age,current.step);const round=value?.rounds[current.roundKey];return value&&round&&!round.done&&Object.values(value.rounds).filter(item=>item.done).length<value.required?{value,round}:null;}
export function recordMistake(){const item=active();if(item&&!item.round.mistake){item.round.mistake=true;publish();}}
export function recordHint(){const item=active();if(item&&!item.round.hint){item.round.hint=true;publish();}}
export function completeRound(){
  const item=active();if(!item)return current?getModeProgress(current.mode,current.age,current.step):null;
  const {value,round}=item;round.done=true;
  value.seen.push(current.roundKey);value.seen=value.seen.slice(-2000);
  const seed=Number(current.roundKey);if(Number.isSafeInteger(seed)&&seed>=0)value.cursor=Math.max(value.cursor,seed+1);else value.cursor++;
  const completed=Object.values(value.rounds).filter(item=>item.done);
  if(completed.length===value.required){
    const clean=Math.max(0,completed.filter(item=>!item.mistake&&!item.hint).length-value.skips);
    const medal=clean===value.required?'gold':clean===value.required-1?'silver':'bronze';
    value.result={medal,clean,total:value.required,sessionId:value.attempt};
    if((rank[medal]||0)>(rank[value.bestMedal]||0))value.bestMedal=medal;
  }
  publish();return getModeProgress(value.mode,value.age,value.step);
}
export function beginNewAttempt({mode=current?.mode,age=current?.age,step=current?.step}={}) {
  const value=entry(mode,age,step);if(!value||Object.values(value.rounds).filter(round=>round.done).length<value.required)return null;
  // Finite banks (letters/words) may be practiced again through an explicit
  // fresh-set action. Retries and reloads never take this path. The controller
  // must also clear its local answers before starting the first new round.
  freshSet(value);value.seen=[];value.cursor++;current=null;publish();return getModeProgress(mode,age,step);
}
