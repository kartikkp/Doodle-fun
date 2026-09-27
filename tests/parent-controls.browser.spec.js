import {test,expect} from '@playwright/test';
import {makeParentCredential} from '../parent-controls.js';

const prefix='doodle-fun:v2:',pin='473829',recovery='ABCD1234ABCD';
const credential=await makeParentCredential(pin,recovery);
async function seed(page,hints='ask',lockSettings=true){
  await page.addInitScript(({prefix,credential,hints,lockSettings})=>{
    if(!sessionStorage.getItem('parent-test-seeded')){
      localStorage.setItem(prefix+'settings',JSON.stringify({age:10,level:'auto',sound:false}));
      localStorage.setItem(prefix+'parent-controls-v1',JSON.stringify({version:1,hints,lockSettings,credential,failures:0,retryAfter:0}));
      sessionStorage.setItem('parent-test-seeded','true');
    }
  },{prefix,credential,hints,lockSettings});
}
async function unlock(page,value=pin){await expect(page.locator('#parent-pin-dialog')).toBeVisible();await page.locator('#parent-pin-input').fill(value);await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-dialog')).toBeHidden();}
async function grownups(page){await page.locator('#grownups-open').click();await unlock(page);await expect(page.locator('#grownups-dialog')).toBeVisible();}

test.use({viewport:{width:390,height:844}});

test('set and recover a PIN through the UI without clearing artwork or progress',async({page})=>{
  await page.goto('/');await page.locator('#grownups-open').click();await page.locator('#parent-pin-setup').click();
  await page.locator('#parent-pin-input').fill(pin);await page.locator('#parent-pin-confirm').fill('1111');await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-error')).toContainText('do not match');
  await page.locator('#parent-pin-confirm').fill(pin);await page.locator('#parent-pin-submit').click();
  const code=await page.locator('.parent-recovery-code').innerText();await page.getByRole('button',{name:'I saved the code'}).click();
  await page.locator('#hint-policy').selectOption('ask');await page.locator('#settings-done').click();
  const saved=await page.evaluate(prefix=>localStorage.getItem(prefix+'parent-controls-v1'),prefix);expect(saved).not.toContain(pin);expect(saved).not.toContain(code.replaceAll('–',''));
  await page.evaluate(prefix=>{localStorage.setItem(prefix+'drawing-draft-v2','preserve-artwork');localStorage.setItem(prefix+'activity-progress-sources','{"learning":7}');},prefix);
  await page.locator('#grownups-open').click();await page.locator('#parent-pin-input').fill('0000');await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-error')).toContainText('did not match');
  await page.locator('#parent-pin-recover').click();await page.locator('#parent-pin-input').fill(code);await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-dialog')).toBeHidden();
  const state=await page.evaluate(prefix=>({controls:JSON.parse(localStorage.getItem(prefix+'parent-controls-v1')),art:localStorage.getItem(prefix+'drawing-draft-v2'),progress:localStorage.getItem(prefix+'activity-progress-sources')}),prefix);
  expect(state.controls).toMatchObject({hints:'on',credential:null,lockSettings:false});expect(state.art).toBe('preserve-artwork');expect(state.progress).toBe('{"learning":7}');
});

test('hint policy blocks every engine reveal path while instructions and sound replay remain available',async({page})=>{
  await seed(page,'off');
  for(const [id,selector]of [['uppercase','[data-hint]'],['compare','.challenge-hint-button'],['shape-match','.discover-hint'],['size-order','.adventure-hint'],['sound-match','[data-listening-hint]'],['mirror-mosaic','.studio-hint']]){
    await page.goto('/#'+id);const hint=page.locator(selector).first();await expect(hint).toBeHidden();await hint.dispatchEvent('click');await expect(page.locator('#parent-pin-dialog')).toBeHidden();
    const ledger=await page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'medal-progress-v1')),prefix);expect(Object.values(ledger.entries).flatMap(entry=>Object.values(entry.rounds)).some(round=>round.hint)).toBe(false);
    await page.locator('#coach-open').click();await expect(page.locator('#coach-start')).toBeVisible();await expect(page.locator('#coach-strategy')).toBeHidden();await expect(page.locator('#coach-hint')).toBeHidden();await page.locator('#coach-done').click();
    if(id==='sound-match')await expect(page.locator('.listening-listen')).toBeVisible();
    if(id==='shape-match')await expect(page.locator('.discover-hear')).toBeVisible();
  }
});

test('approval is round scoped; cancelling, revisiting a letter and native background require a new PIN',async({page})=>{
  await seed(page);await page.goto('/#uppercase');await page.locator('[data-learn-item="A"]').click();await page.getByRole('button',{name:'▶ Show me',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.learn-demo-layer')).toBeEmpty();
  await page.getByRole('button',{name:'▶ Show me',exact:true}).click();await unlock(page);await expect(page.getByRole('button',{name:'■ Stop guide',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'■ Stop guide',exact:true}).click();await expect(page.locator('#parent-pin-dialog')).toBeHidden();
  await page.locator('[data-learn-item="B"]').click();await page.locator('[data-learn-item="A"]').click();await page.getByRole('button',{name:'▶ Show me',exact:true}).click();await unlock(page);
  await page.evaluate(()=>dispatchEvent(new Event('doodle-native-inactive')));await expect(page.locator('.learn-demo-layer')).toBeEmpty();await page.getByRole('button',{name:'▶ Show me',exact:true}).click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();
});

test('native background closes approved settings and Coach and cannot preserve a settings bypass',async({page})=>{
  await seed(page);await page.goto('/');await grownups(page);await page.locator('#age-minus').click();await expect(page.locator('#child-age-output')).toHaveText('9');
  await page.evaluate(()=>dispatchEvent(new Event('doodle-native-inactive')));await expect(page.locator('#grownups-dialog')).toBeHidden();await page.locator('[data-age="8"]').click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('[data-age="9"]')).toHaveAttribute('aria-pressed','true');
  await page.goto('/#word-build');await page.locator('#coach-open').click();await unlock(page);await expect(page.locator('#coach-dialog')).toBeVisible();await page.evaluate(()=>dispatchEvent(new Event('doodle-native-inactive')));await expect(page.locator('#coach-dialog')).toBeHidden();await page.locator('#coach-open').click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();
});

test('turning hints off hides an existing word model and preserves placed letters and attempt history',async({page})=>{
  await seed(page,'on');await page.goto('/#word-build');await page.getByRole('button',{name:'Show the word hint',exact:true}).click();await expect(page.locator('.challenge-word-model')).toBeVisible();
  const first=await page.locator('.challenge-word-model').innerText();const letter=first.trim()[0];await page.locator(`[data-character="${letter}"]`).first().click();const placed=await page.locator('.challenge-play').innerText();
  // Grown-ups is reachable through the home header without navigating away.
  await page.evaluate(()=>document.querySelector('#grownups-open').click());await unlock(page);await page.locator('#hint-policy').selectOption('off');await page.locator('#settings-done').click();
  await expect(page.locator('.challenge-word-model')).toBeHidden();await expect(page.locator(`[data-character="${letter}"]`).first()).toBeDisabled();expect(placed).toContain(letter);
  const ledger=await page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'medal-progress-v1')),prefix);expect(Object.values(ledger.entries)[0].rounds['0'].hint).toBe(true);
});

test('cancelled asynchronous PIN validation cannot unlock after navigation',async({page})=>{
  await seed(page);await page.goto('/#compare');await page.locator('.challenge-hint-button').first().click();await page.locator('#parent-pin-input').fill(pin);
  await page.evaluate(()=>{document.querySelector('#parent-pin-form').requestSubmit();location.hash='shape-match';});await expect(page.locator('#parent-pin-dialog')).toBeHidden();await page.locator('.discover-hint').click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();
});

test('PIN setup works from the downloadable offline file',async({page})=>{
  await page.goto(new URL('../dist/index.html',import.meta.url).href);await page.locator('#grownups-open').click();await page.locator('#parent-pin-setup').click();await page.locator('#parent-pin-input').fill(pin);await page.locator('#parent-pin-confirm').fill(pin);await page.locator('#parent-pin-submit').click();await expect(page.locator('.parent-recovery-code')).toBeVisible();
});

test('repeated wrong PINs impose a short wait that survives reopening the prompt',async({page})=>{
  await seed(page);await page.goto('/#compare');await page.locator('.challenge-hint-button').first().click();
  for(let attempt=0;attempt<5;attempt++){
    await page.locator('#parent-pin-input').fill('0000');await page.locator('#parent-pin-submit').click();
    await expect(page.locator('#parent-pin-error')).toContainText(attempt===4?'wait 30 seconds':'did not match');
  }
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.locator('.challenge-hint-button').first().click();await page.locator('#parent-pin-input').fill(pin);await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-error')).toContainText('wait a little');await expect(page.locator('#parent-pin-dialog')).toBeVisible();
});

test('failed storage cannot silently replace or enable parent controls',async({page})=>{
  await page.goto('/');await page.locator('#grownups-open').click();await page.locator('#parent-pin-setup').click();
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('Quota exceeded');};});
  await page.locator('#parent-pin-input').fill(pin);await page.locator('#parent-pin-confirm').fill(pin);await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-error')).toContainText('could not save');await expect(page.locator('#parent-pin-dialog')).toBeVisible();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('#hint-policy')).toHaveValue('on');await expect(page.locator('#parent-pin-setup')).toHaveText('Set a parent PIN');
});

test('a cached activity cannot restore its earlier model after hints are disabled on Home',async({page})=>{
  await seed(page,'on');await page.goto('/#size-order');await page.locator('.adventure-hint').click();await expect(page.locator('.adventure-model')).toBeVisible();
  await page.locator('.adventure-back').click();await grownups(page);await page.locator('#hint-policy').selectOption('off');await page.locator('#settings-done').click();
  await page.locator('#card-ordering').click();await expect(page.locator('.adventure-model')).toHaveCount(0);await expect(page.locator('.adventure-hint')).toBeHidden();
});
