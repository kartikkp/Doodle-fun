// Approval belongs to one action and is never stored or reused.
const EXTERNAL_URLS = new Set([
  'https://kartikkp.github.io/Doodle-fun/privacy.html',
  'https://kartikkp.github.io/Doodle-fun/support.html',
  'https://github.com/kartikkp/Doodle-fun/issues',
  'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
]);
let pending = null, initialized = false;
const element = id => document.getElementById(id);
export const nativeBridge = () => globalThis.webkit?.messageHandlers?.doodleNative;

export function cancelParentAction() {
  if (!pending) return;
  const { resolve } = pending;
  pending = null;
  element('parent-answer').value = '';
  element('parent-gate').close();
  resolve(false);
}

function newChallenge() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  const left = 12 + values[0] % 8, right = 12 + values[1] % 8;
  pending.answer = left * right;
  element('parent-question').textContent = `${left} × ${right} = ?`;
  element('parent-answer').value = '';
}

function initialize() {
  if (initialized) return;
  initialized = true;
  const dialog = element('parent-gate');
  element('parent-cancel').addEventListener('click', cancelParentAction);
  dialog.addEventListener('cancel', event => { event.preventDefault(); cancelParentAction(); });
  dialog.addEventListener('close', () => { if (!dialog.open) cancelParentAction(); });
  element('parent-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!pending) return;
    const input = element('parent-answer').value.trim();
    if (!/^\d{3}$/.test(input) || Number(input) !== pending.answer) {
      newChallenge();
      element('parent-error').textContent = 'That answer did not match. Ask a grown-up to try this new question.';
      element('parent-answer').focus();
      return;
    }
    const { action, resolve, reject } = pending;
    pending = null;
    element('parent-answer').value = '';
    dialog.close();
    // Invoke in the trusted submit event so Safari retains user activation for
    // the share sheet or new tab. No reusable authorization token is exposed.
    try { Promise.resolve(action()).then(() => resolve(true), reject); }
    catch (error) { reject(error); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelParentAction(); });
  window.addEventListener('pagehide', cancelParentAction);
  window.addEventListener('hashchange', cancelParentAction);
}

export function requestParentAction(action, purpose = 'share a picture outside Doodle Fun') {
  initialize();
  if (pending) return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    pending = { action, resolve, reject, answer: null };
    element('parent-purpose').textContent = `A grown-up can help you ${purpose}.`;
    element('parent-error').textContent = '';
    newChallenge();
    element('parent-gate').showModal();
    element('parent-answer').focus();
  });
}

export function openExternalURL(url) {
  if (!EXTERNAL_URLS.has(url)) return Promise.resolve(false);
  const native = nativeBridge();
  if (native) {
    native.postMessage({ type: 'openExternalURL', url });
    return Promise.resolve(true);
  }
  return requestParentAction(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, 'open a website outside Doodle Fun');
}
