// Keep opt-in read aloud available inside both Safari and the offline iOS app.
export function canSpeak() {
  return Boolean(globalThis.webkit?.messageHandlers?.doodleNative || globalThis.speechSynthesis);
}
export function stopSpeaking() {
  globalThis.speechSynthesis?.cancel();
  globalThis.webkit?.messageHandlers?.doodleNative?.postMessage({type:'stopSpeaking'});
}
export function speak(text) {
  stopSpeaking();
  const native = globalThis.webkit?.messageHandlers?.doodleNative;
  if (native) { native.postMessage({type:'speak',text:String(text).slice(0,2000)}); return; }
  if (!globalThis.speechSynthesis || !globalThis.SpeechSynthesisUtterance) return;
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.rate = .82;
  globalThis.speechSynthesis.speak(utterance);
}
