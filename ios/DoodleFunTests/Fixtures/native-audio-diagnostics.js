// Opt-in QA observer injected only into an isolated DEBUG copy. Never bundled in the app.
(() => {
  const events = [], contexts = new WeakMap(), decodedContexts = new WeakMap(), startupTimers = new Map();
  let nextContext = 0, nextSource = 0, nextTimer = 0;
  const record = (event, detail = {}) => {
    if (events.length >= 500) return;
    const entry = {event, at: performance.now(), wall: Date.now(), ...detail};
    events.push(entry);
    try { window.webkit.messageHandlers.doodleQASpeech.postMessage(entry); } catch {}
  };
  globalThis.__DOODLE_SPEECH_QA__ = events;
  const errorFields = error => ({errorName: String(error?.name || '').slice(0, 64)});
  const contextFields = context => ({context: contexts.get(context), state: context.state, currentTime: context.currentTime});
  const observeContext = context => {
    if (contexts.has(context)) return;
    contexts.set(context, ++nextContext);
    record('context-created', contextFields(context));
    context.addEventListener('statechange', () => record('context-statechange', contextFields(context)));
  };
  const observePromise = (promise, resolved, rejected) => {
    if (promise && typeof promise.then === 'function') promise.then(resolved, rejected);
  };
  const constructors = new Map();
  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const Native = globalThis[name];
    if (!Native) continue;
    let Wrapped = constructors.get(Native);
    if (!Wrapped) {
      Wrapped = new Proxy(Native, {construct(target, args, newTarget) {
        const context = Reflect.construct(target, args, newTarget === Wrapped ? target : newTarget);
        observeContext(context);
        return context;
      }});
      constructors.set(Native, Wrapped);
      for (const method of ['resume', 'decodeAudioData', 'close']) {
        const original = Native.prototype[method];
        if (!original) continue;
        Native.prototype[method] = function (...args) {
          observeContext(this);
          record(`${method}-called`, {...contextFields(this), ...(method === 'decodeAudioData' ? {bytes: args[0]?.byteLength} : {})});
          let result;
          try { result = Reflect.apply(original, this, args); }
          catch (error) { record(`${method}-threw`, {...contextFields(this), ...errorFields(error)}); throw error; }
          if (method === 'decodeAudioData' && result && typeof result === 'object') decodedContexts.set(result, this);
          observePromise(result,
            value => record(`${method}-resolved`, {...contextFields(this), ...(method === 'decodeAudioData' ? {duration: value?.duration, sampleRate: value?.sampleRate} : {})}),
            error => record(`${method}-rejected`, {...contextFields(this), ...errorFields(error)}));
          return result;
        };
      }
      const createBufferSource = Native.prototype.createBufferSource;
      Native.prototype.createBufferSource = function (...args) {
        observeContext(this);
        const source = Reflect.apply(createBufferSource, this, args), sourceId = ++nextSource, context = this;
        record('source-created', {...contextFields(context), source: sourceId});
        source.addEventListener('ended', () => record('source-ended', {...contextFields(context), source: sourceId}));
        for (const method of ['start', 'stop']) {
          const original = source[method];
          source[method] = function (...values) {
            record(`source-${method}`, {...contextFields(context), source: sourceId, duration: source.buffer?.duration});
            return Reflect.apply(original, this, values);
          };
        }
        return source;
      };
    }
    globalThis[name] = Wrapped;
    record('context-hook-installed', {name, installed: globalThis[name] === Wrapped});
  }
  // WK message-handler lookups can yield new wrapper objects. Observe the
  // original prepared promise at the existing three-input speech join instead
  // of replacing the bridge. No promise or fulfillment value is substituted.
  const originalAll = Promise.all;
  Promise.all = function (input) {
    const context = Array.isArray(input) ? decodedContexts.get(input[2]) : undefined;
    const result = Reflect.apply(originalAll, this, arguments);
    if (context && input.length === 3) {
      observePromise(input[0],
        value => record('preparation-resolved', {...contextFields(context), ok: value?.ok === true, reason: String(value?.reason || '').slice(0, 64)}),
        error => record('preparation-rejected', {...contextFields(context), ...errorFields(error)}));
      observePromise(result,
        values => record('startup-join-resolved', {...contextFields(context), ok: values[0]?.ok === true, duration: values[2]?.duration}),
        error => record('startup-join-rejected', {...contextFields(context), ...errorFields(error)}));
    }
    return result;
  };
  const originalSet = globalThis.setTimeout, originalClear = globalThis.clearTimeout;
  globalThis.setTimeout = function (callback, delay, ...args) {
    if (Number(delay) !== 5000 || typeof callback !== 'function') return Reflect.apply(originalSet, this, [callback, delay, ...args]);
    const timer = ++nextTimer;
    record('startup-timer-scheduled', {timer, delay});
    const observed = function (...values) { record('startup-timer-fired', {timer}); return Reflect.apply(callback, this, values); };
    const handle = Reflect.apply(originalSet, this, [observed, delay, ...args]);
    startupTimers.set(handle, timer);
    return handle;
  };
  globalThis.clearTimeout = function (handle) {
    if (startupTimers.has(handle)) { record('startup-timer-cleared', {timer: startupTimers.get(handle)}); startupTimers.delete(handle); }
    return Reflect.apply(originalClear, this, [handle]);
  };
  for (const event of ['pagehide', 'hashchange', 'doodle-native-inactive']) addEventListener(event, () => record(event, {hidden: document.hidden}));
  document.addEventListener('visibilitychange', () => record('visibilitychange', {hidden: document.hidden}));
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#coach-hear')) record('hear-click', {trusted: event.isTrusted});
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    const status = document.querySelector('#coach-speech-status');
    if (!status) { record('coach-status-missing'); return; }
    const states = {'Playing spoken help…':'playing', 'Spoken help finished.':'finished', 'Spoken help requested.':'requested', 'Spoken help stopped.':'stopped', 'Spoken help could not play. Try Hear again.':'failed', '':'empty'};
    new MutationObserver(() => record('coach-status', {status: states[status.textContent] || 'other'})).observe(status, {childList: true, subtree: true, characterData: true});
    record('coach-status-observer-ready');
  });
  record('observer-ready');
})();
