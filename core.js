export const STORAGE_PREFIX = 'doodle-fun:v2:';
export const DEFAULT_SETTINGS = Object.freeze({ age:6, level:'auto', sound:false, challengeOffset:0 });
const memory = new Map();

export function readStore(key, fallback) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_PREFIX + key);
    if (raw !== null && raw !== undefined) return JSON.parse(raw);
  } catch { /* Private browsing, storage policies and malformed data must not block play. */ }
  return memory.has(key) ? memory.get(key) : fallback;
}

export function writeStore(key, value) {
  memory.set(key, value);
  try { globalThis.localStorage?.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); return Boolean(globalThis.localStorage); }
  catch { return false; }
}

export function normalizeSettings(input) {
  const value = input && typeof input === 'object' ? input : {};
  const age = (typeof value.age === 'number' || (typeof value.age === 'string' && value.age.trim())) ? Number(value.age) : NaN;
  const offset = (typeof value.challengeOffset==='number'||(typeof value.challengeOffset==='string'&&value.challengeOffset.trim()))?Number(value.challengeOffset):NaN;
  return {
    age:Number.isFinite(age) ? Math.min(10, Math.max(2, Math.round(age))) : 6,
    level:['auto','little','explorer','maker'].includes(value.level) ? value.level : 'auto',
    sound:value.sound === true,
    challengeOffset:Number.isFinite(offset)?Math.max(-2,Math.min(2,Math.round(offset))):0,
  };
}

export function getProfile(settings = DEFAULT_SETTINGS) {
  const {age, level, challengeOffset} = normalizeSettings(settings);
  const baseAge=level==='auto'?age:{little:3,explorer:6,maker:9}[level];
  const challengeAge=Math.max(2,Math.min(10,baseAge+challengeOffset));
  const tier=challengeAge<=4?'little':challengeAge<=7?'explorer':'maker';
  const profiles = {
    little:{name:'Little learner',sizes:[14,28,44],brush:28,colorCount:8,traceTolerance:.065,traceCoverage:.72,tracePrecision:.5,numberMax:5,defaultSet:'shapes'},
    explorer:{name:'Explorer',sizes:[6,14,28],brush:14,colorCount:12,traceTolerance:.045,traceCoverage:.8,tracePrecision:.6,numberMax:10,defaultSet:'upper'},
    maker:{name:'Big thinker',sizes:[3,7,14,28],brush:7,colorCount:15,traceTolerance:.032,traceCoverage:.88,tracePrecision:.7,numberMax:20,defaultSet:'words'},
  };
  const index=challengeAge-2;
  const byAge={
    numberMax:[3,4,5,8,10,12,15,20,20],
    choiceCount:[2,2,3,3,4,4,4,4,4],
    traceTolerance:[.085,.075,.065,.055,.045,.040,.036,.032,.028],
    traceCoverage:[.60,.66,.72,.76,.80,.82,.85,.88,.90],
    tracePrecision:[.42,.46,.50,.55,.60,.63,.66,.70,.74],
    sequenceLength:[2,3,3,4,5,5,6,6,6],
    letterPairs:[1,2,3,3,4,4,5,6,6],
    memoryPairs:[2,2,3,3,4,4,5,6,6],
    mazeSize:[3,3,4,4,5,5,6,6,6],
    frameSize:[5,5,5,10,10,20,20,20,20],
    wordLength:[2,3,3,3,4,4,5,6,8],
  };
  return {tier,age,challengeAge,challengeOffset,...profiles[tier],...Object.fromEntries(Object.entries(byAge).map(([key,values])=>[key,values[index]])),modelByDefault:challengeAge<=4};
}
