// Test-bundle-only native WKWebView gameplay. These handlers operate the same
// visible DOM controls a child sees; they do not read engine state or storage.
const discoveryIDs = ['shape-match', 'color-match', 'patterns', 'sorting', 'odd-one-out', 'memory', 'maze'];
const adventureIDs = ['size-order', 'picture-sequence', 'directions', 'make-a-shape', 'rhythm', 'sharing'];
const actionAttribute = {
  'size-order': 'data-piece', 'picture-sequence': 'data-piece',
  directions: 'data-direction', 'make-a-shape': 'data-vertex',
  rhythm: 'data-beat', sharing: 'data-basket',
};

function assert(qa, condition, message) {
  qa.assert(condition, `Age ${qa.age}, ${qa.id}: ${message}`);
}
function ready(qa, engine) { return qa.el(`.${engine}-next`).classList.contains('is-ready'); }
function roundNumber(qa, selector) {
  const match = qa.text(selector).match(/round (\d+)/i);
  assert(qa, Boolean(match), 'the current round number is visible');
  return Number(match[1]);
}
async function feedback(qa, engine, kind) {
  await qa.waitFor(() => qa.el(`.${engine}-status`).classList.contains(`is-${kind}`), `${qa.id} ${kind} feedback`);
  assert(qa, qa.text(`.${engine}-status`).trim().length > 10, `${kind} feedback explains the next step`);
}
async function hint(qa, engine) {
  await qa.click(`.${engine}-hint`);
  await feedback(qa, engine, 'hint');
}

// Solve recognition from visible names/models, and the pattern from the
// repeating unit revealed by the real Hint control. No answer IDs are assumed.
function discoveryAnswer(qa) {
  const choices = qa.all('.discover-play [data-choice]');
  const choiceName = node => node.querySelector('.discover-choice-label').textContent.replace(/^\d+\.\s*/, '');
  let name;
  if (qa.id === 'shape-match') name = qa.text('.discover-model strong');
  else if (qa.id === 'color-match') name = qa.text('.discover-objective').replace(/^Find this color:\s*/i, '').replace(/\.$/, '');
  else if (qa.id === 'patterns') {
    const unit = qa.all('.discover-pattern-token.is-hint');
    const shown = qa.all('.discover-pattern-token:not(.discover-pattern-blank)');
    assert(qa, unit.length >= 2 && unit.length < shown.length, 'Hint highlights a repeating unit');
    name = unit[shown.length % unit.length].getAttribute('aria-label').replace(/^\d+: /, '');
  } else {
    const names = choices.map(choiceName);
    const unique = names.filter(value => names.filter(other => other === value).length === 1);
    assert(qa, unique.length === 1, 'exactly one picture differs on the stated property');
    name = unique[0];
  }
  const answer = choices.find(node => choiceName(node).toLowerCase() === name.toLowerCase());
  assert(qa, Boolean(answer), 'the answer described by the visible model is an available choice');
  return answer;
}

async function solveDiscovery(qa) {
  if (['shape-match', 'color-match', 'patterns', 'odd-one-out'].includes(qa.id)) {
    await hint(qa, 'discover');
    await qa.click(discoveryAnswer(qa));
    return;
  }
  const limit = qa.id === 'maze' ? 37 : qa.id === 'sorting' ? 14 : 7;
  for (let step = 0; step < limit && !ready(qa, 'discover'); step++) {
    await hint(qa, 'discover');
    if (qa.id === 'sorting') {
      if (!qa.all('.discover-play [data-item][aria-pressed="true"]').length) {
        await qa.click('.discover-play .is-hint[data-item]');
        await hint(qa, 'discover');
      }
      await qa.click('.discover-play .is-hint[data-category]');
    } else if (qa.id === 'memory') await qa.click('.discover-play .is-hint[data-card]');
    else await qa.click('.discover-play .is-hint[data-cell]');
  }
  assert(qa, ready(qa, 'discover'), 'the complete board is solvable through the offered hints');
}

function assertDiscoveryReset(qa) {
  assert(qa, !ready(qa, 'discover'), 'replay starts an unfinished round');
  if (qa.id === 'sorting') assert(qa, qa.all('.discover-play [data-item]').every(node => !node.disabled), 'all sorting items return for replay');
  else if (qa.id === 'memory') assert(qa, qa.all('.discover-play [data-card]').every(node => !node.disabled && node.getAttribute('aria-label').includes('face down')), 'all memory cards return face down');
  else if (qa.id === 'maze') assert(qa, qa.el('.discover-play [data-current="true"]').dataset.cell === '0', 'Bunny returns to the maze entrance');
  else assert(qa, qa.all('.discover-play [data-choice]').every(node => !node.disabled && !node.classList.contains('is-correct')), 'choices are available again');
}

async function discovery(qa) {
  assert(qa, qa.text('.discover-title').trim().length > 0, 'activity title is visible');
  const beforeRound = roundNumber(qa, '.discover-level');
  const beforeCount = Number.parseInt(qa.text('.discover-round-count'), 10);
  assert(qa, Number.isFinite(beforeCount), 'completion count is a finite number');
  if (qa.id === 'memory') {
    const pairs = [2, 2, 3, 3, 4, 4, 5, 6, 6][qa.age - 2];
    assert(qa, qa.all('.discover-play [data-card]').length === pairs * 2, 'pair count matches the selected exact age');
  }
  if (qa.id === 'maze') {
    const side = [3, 3, 4, 4, 5, 5, 6, 6, 6][qa.age - 2];
    assert(qa, qa.all('.discover-play [data-cell]').length === side ** 2, 'maze dimensions match the selected exact age');
  }

  await hint(qa, 'discover');
  if (['shape-match', 'color-match', 'patterns', 'odd-one-out'].includes(qa.id)) {
    const answer = discoveryAnswer(qa);
    await qa.click(qa.all('.discover-play [data-choice]').find(node => node !== answer));
  } else if (qa.id === 'sorting') {
    await qa.click('.discover-play .is-hint[data-item]');
    await hint(qa, 'discover');
    await qa.click('.discover-play [data-category]:not(.is-hint)');
  } else if (qa.id === 'memory') {
    // Hint exposes one card and marks its partner. Another enabled card is
    // necessarily a mismatch; the same revealed card cannot be selected twice.
    assert(qa, qa.el('.discover-play .is-open[data-card]').disabled, 'a face-up card cannot match itself');
    await qa.click('.discover-play [data-card]:enabled:not(.is-hint)');
  } else await qa.click('.discover-play [data-current="true"]');
  await feedback(qa, 'discover', 'retry');
  assert(qa, !ready(qa, 'discover'), 'an incorrect attempt cannot finish the round');
  qa.check('Incorrect attempt gives a useful retry');

  if (qa.id === 'memory') {
    assert(qa, qa.all('.discover-play .is-open[data-card]').length === 2, 'the mismatch remains visible for inspection');
    await qa.click('.discover-memory-hide');
    assert(qa, qa.all('.discover-play .is-open[data-card]').length === 0, 'Turn them over clears the mismatch');
  }
  await solveDiscovery(qa);
  await feedback(qa, 'discover', 'success');
  assert(qa, ready(qa, 'discover'), 'success makes the next round ready');
  assert(qa, Number.parseInt(qa.text('.discover-round-count'), 10) === beforeCount + 1, 'completion is recorded once');
  if (qa.id === 'sorting') assert(qa, qa.all('.discover-play [data-item]').every(node => node.classList.contains('is-sorted')), 'every picture was sorted');
  if (qa.id === 'memory') assert(qa, qa.all('.discover-play [data-card]').every(node => node.dataset.matched === 'true'), 'every pair was matched');
  if (qa.id === 'maze') assert(qa, qa.el('.discover-play [data-current="true"]').dataset.goal === 'true', 'Bunny physically reaches the carrot square');
  qa.check('Hint-assisted full round completed');

  await qa.click('.discover-restart');
  assertDiscoveryReset(qa);
  assert(qa, roundNumber(qa, '.discover-level') === beforeRound, 'replay keeps the same round');
  assert(qa, Number.parseInt(qa.text('.discover-round-count'), 10) === beforeCount + 1, 'replay does not award another completion');
  qa.check('Replay resets the board without duplicate progress');
  await qa.click('.discover-next');
  assertDiscoveryReset(qa);
  assert(qa, roundNumber(qa, '.discover-level') === beforeRound + 1, 'New round advances the round number');
  qa.check('New round opens a fresh playable board');
}

async function solveAdventure(qa) {
  for (let step = 0; step < 32 && !ready(qa, 'adventure'); step++) {
    if (qa.id === 'sharing' && qa.el('.adventure-cookie-pool').getAttribute('aria-label') === '0 cookies to share') {
      await qa.click('.adventure-check');
      continue;
    }
    await hint(qa, 'adventure');
    await qa.click(`.adventure-play .is-hint[${actionAttribute[qa.id]}]`);
  }
  assert(qa, ready(qa, 'adventure'), 'the entire adventure is solvable through its visible hints');
}

function assertAdventureReset(qa) {
  assert(qa, !ready(qa, 'adventure'), 'replay starts an unfinished round');
  if (['size-order', 'picture-sequence'].includes(qa.id)) assert(qa, qa.all('.adventure-play [data-piece]').every(node => !node.disabled), 'every piece is available again');
  else if (qa.id === 'directions') assert(qa, qa.all('.adventure-direction-clue.is-done').length === 0, 'no direction is marked complete');
  else if (qa.id === 'make-a-shape') assert(qa, qa.text('.adventure-note').startsWith('0 of '), 'the shape starts with zero joined sides');
  else if (qa.id === 'rhythm') assert(qa, qa.all('.adventure-beat-token.is-done').length === 0, 'the tap pattern starts at its first step');
  else {
    assert(qa, qa.all('.adventure-cookie-count').every(node => node.textContent === '0'), 'all friends begin with no cookies');
    assert(qa, Number.parseInt(qa.el('.adventure-cookie-pool').getAttribute('aria-label'), 10) > 0, 'cookies are available for sharing again');
  }
}

async function adventure(qa) {
  assert(qa, qa.text('.adventure-title').trim().length > 0, 'activity title is visible');
  const beforeRound = roundNumber(qa, '.adventure-round');
  if (qa.id === 'sharing') {
    const totals = [2, 4, 6, 6, 9, 12, 12, 14, 19];
    const count = Number.parseInt(qa.el('.adventure-cookie-pool').getAttribute('aria-label'), 10);
    assert(qa, Number.isFinite(count) && count === totals[qa.age - 2], 'a finite cookie total matches the exact age');
    assert(qa, !qa.text('.adventure-objective').includes('NaN'), 'the sharing objective never contains NaN');
  }
  if (qa.all('.adventure-ready').length) {
    await qa.click('.adventure-ready');
    assert(qa, qa.all('.adventure-beat-token').every(node => node.getAttribute('aria-label').includes('hidden')), 'Ready hides the older-child memory pattern');
  }
  await hint(qa, 'adventure');
  if (qa.id === 'sharing') await qa.click('.adventure-check');
  else if (qa.id === 'make-a-shape') await qa.click('.adventure-play [data-vertex="0"]');
  else await qa.click(`.adventure-play [${actionAttribute[qa.id]}]:enabled:not(.is-hint)`);
  await feedback(qa, 'adventure', 'retry');
  assert(qa, !ready(qa, 'adventure'), 'an incorrect attempt cannot complete the adventure');
  qa.check('Incorrect attempt gives a useful retry');
  await solveAdventure(qa);
  await feedback(qa, 'adventure', 'success');
  if (qa.id === 'sharing') {
    const shares = qa.all('.adventure-cookie-count').map(node => Number(node.textContent));
    assert(qa, shares.length >= 2 && shares.every(count => count > 0 && count === shares[0]), 'each friend receives the same positive share');
    assert(qa, qa.el('.adventure-cookie-pool').getAttribute('aria-label') === '0 cookies to share', 'every cookie has a place');
  }
  qa.check('Hint-assisted full round completed');
  await qa.click('.adventure-retry');
  assertAdventureReset(qa);
  assert(qa, roundNumber(qa, '.adventure-round') === beforeRound, 'Try again keeps the same round');
  qa.check('Try again resets the board');
  await qa.click('.adventure-next');
  assertAdventureReset(qa);
  assert(qa, roundNumber(qa, '.adventure-round') === beforeRound + 1, 'Next advances to a new round');
  qa.check('Next opens a fresh playable board');
}

export default Object.fromEntries([
  ...discoveryIDs.map(id => [id, discovery]),
  ...adventureIDs.map(id => [id, adventure]),
]);
