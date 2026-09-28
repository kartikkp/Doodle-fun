// Test-only polling. The injected clock and pause make scheduler stalls testable.
export async function waitForNative(predicate, {
  timeout = 4000,
  now = () => performance.now(),
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  const deadline = now() + timeout;
  while (true) {
    // WKWebView may render while a timer is delayed. Observe that settled state
    // before rejecting an expired deadline; never add a wait after the budget.
    if (predicate()) return true;
    if (now() >= deadline) return false;
    await pause(20);
  }
}
