import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForNative} from '../ios/DoodleFunTests/Fixtures/native-wait.js';

test('native readiness checks the rendered state when a scheduler stall delays its next poll', async () => {
  let clock = 0, pauses = 0;
  const checks = [];
  const ready = await waitForNative(() => {
    checks.push(clock);
    return clock >= 3900; // The page became ready inside the original 4s budget.
  }, {
    now: () => clock,
    pause: async ms => { assert.equal(ms, 20); pauses++; clock = 4500; },
  });
  assert.equal(ready, true);
  assert.deepEqual(checks, [0, 4500]);
  assert.equal(pauses, 1, 'A late ready state does not trigger another wait or action retry.');
});

test('native readiness still fails after the same 4s deadline if the late wake sees an unready page', async () => {
  let clock = 0, pauses = 0;
  const checks = [];
  const ready = await waitForNative(() => { checks.push(clock); return false; }, {
    now: () => clock,
    pause: async () => { pauses++; clock = 4500; },
  });
  assert.equal(ready, false);
  assert.deepEqual(checks, [0, 4500]);
  assert.equal(pauses, 1, 'A failed deadline must not add a retry or extend its budget.');
});

test('native readiness returns immediately for ready pages and stops unready pages at the deadline', async () => {
  let clock = 0, pauses = 0;
  const options = {now: () => clock, pause: async ms => { clock += ms; pauses++; }};
  assert.equal(await waitForNative(() => true, options), true);
  assert.equal(pauses, 0);
  assert.equal(await waitForNative(() => false, options), false);
  assert.equal(clock, 4000);
  assert.equal(pauses, 200);
});
