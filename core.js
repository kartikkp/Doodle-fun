export const STORAGE_PREFIX = 'doodle-fun:v2:';
export const DEFAULT_SETTINGS = Object.freeze({ age:6, level:'auto', sound:false });
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
  return {
    age:Number.isFinite(age) ? Math.min(10, Math.max(2, Math.round(age))) : 6,
    level:['auto','little','explorer','maker'].includes(value.level) ? value.level : 'auto',
    sound:value.sound === true,
  };
}

export function getProfile(settings = DEFAULT_SETTINGS) {
  const {age, level} = normalizeSettings(settings);
  const tier = level === 'auto' ? (age <= 4 ? 'little' : age <= 7 ? 'explorer' : 'maker') : level;
  const profiles = {
    little:{name:'Little learner',sizes:[14,28,44],brush:28,colorCount:8,traceTolerance:.065,traceCoverage:.72,tracePrecision:.5,numberMax:5,defaultSet:'shapes'},
    explorer:{name:'Explorer',sizes:[6,14,28],brush:14,colorCount:12,traceTolerance:.045,traceCoverage:.8,tracePrecision:.6,numberMax:10,defaultSet:'upper'},
    maker:{name:'Big thinker',sizes:[3,7,14,28],brush:7,colorCount:15,traceTolerance:.032,traceCoverage:.88,tracePrecision:.7,numberMax:20,defaultSet:'words'},
  };
  return { tier, age, ...profiles[tier] };
}
