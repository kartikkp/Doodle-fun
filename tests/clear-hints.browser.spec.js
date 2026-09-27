import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {generateChallenge} from '../challenges.js';
import {buildAdventureRound} from '../adventures.js';
import {buildListeningRound} from '../listening.js';
import {getProfile} from '../core.js';

// Exercise the controller API directly, independently of modal/lifecycle
// behavior that deliberately suspends listening rounds in the complete app.
async function controller(page,engine,mode,age){
  const allowed=new Set(['challenges.js','discovery.js','adventures.js','listening.js','progression.js','core.js','speech.js','activity-art.js','audio.js']);
  await page.route('**/__clear-hints/*',async route=>{
    const file=new URL(route.request().url()).pathname.split('/').at(-1);
    if(file==='index.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><style>[hidden]{display:none!important}button{min-width:48px;min-height:48px}</style><main id="game"></main>'});
    if(!allowed.has(file))return route.abort();
    return route.fulfill({contentType:'text/javascript',body:await readFile(new URL(`../${file}`,import.meta.url),'utf8')});
  });
  await page.goto('/__clear-hints/index.html');
  await page.evaluate(async({engine,mode,age})=>{
    Math.random=()=>0.314159;
    const module=await import(`/__clear-hints/${engine}.js`),progression=await import('/__clear-hints/progression.js');
    const name={challenges:'createChallenges',discovery:'createDiscovery',adventures:'createAdventures',listening:'createListening'}[engine];
    window.fixture=module[name](document.getElementById('game'),{getSettings:()=>({age,sound:false})});
    window.score=()=>progression.getModeProgress(mode,age,age);window.fixture.open(mode);
  },{engine,mode,age});
}
const score=page=>page.evaluate(()=>window.score());
const clear=page=>page.evaluate(()=>window.fixture.clearHints());

test('clearing challenge help preserves the partial word and scored evidence',async({page})=>{
  await controller(page,'challenges','word-build',4);
  const q=generateChallenge('word-build',getProfile({age:4}),0);
  await page.locator(`[data-character="${q.word[0]}"]`).first().click();
  await page.getByRole('button',{name:'Show next letter',exact:true}).click();
  await page.locator('.challenge-help summary').click();
  await expect(page.locator('.challenge-word-model')).toBeVisible();
  const before=await score(page);await clear(page);
  await expect(page.locator('.challenge-word-model')).toBeHidden();
  await expect(page.locator('.challenge-help')).not.toHaveAttribute('open','');
  await expect(page.locator('.challenge-slot.is-filled')).toHaveText(q.word[0]);
  await expect(page.locator('.is-suggested')).toHaveCount(0);
  expect(await score(page)).toEqual(before);
});

test('clearing memory help keeps child-opened cards and hides hint-opened cards',async({page})=>{
  await controller(page,'discovery','memory',4);
  await page.locator('[data-card="0"]').click();await page.locator('.discover-hint').click();
  const before=await score(page);await clear(page);
  await expect(page.locator('[data-card="0"]')).toHaveClass(/is-open/);
  await expect(page.locator('.is-hint')).toHaveCount(0);expect(await score(page)).toEqual(before);
  await page.locator('.discover-restart').click();await page.locator('.discover-hint').click();
  await expect(page.locator('.discover-memory-card.is-open')).toHaveCount(1);
  await clear(page);await expect(page.locator('.discover-memory-card.is-open')).toHaveCount(0);
  expect((await score(page)).rounds['0'].hint).toBe(true);
});

test('clearing adventure models preserves the ordered pictures and round',async({page})=>{
  await controller(page,'adventures','picture-sequence',4);
  const q=buildAdventureRound('picture-sequence',4,0,()=>0.314159);
  await page.locator(`[data-piece="${q.solution[0]}"]`).click();
  const first=await page.locator('.adventure-order-slot').first().innerHTML();
  await page.locator('.adventure-hint').click();await expect(page.locator('.adventure-model')).toBeVisible();
  const before=await score(page);await clear(page);
  await expect(page.locator('.adventure-model')).toHaveCount(0);await expect(page.locator('.is-hint')).toHaveCount(0);
  expect(await page.locator('.adventure-order-slot').first().innerHTML()).toBe(first);expect(await score(page)).toEqual(before);
});

test('clearing a listening model preserves a partial melody and heard clue',async({page})=>{
  await controller(page,'listening','melody-echo',2);
  const q=buildListeningRound('melody-echo',2,0);
  await page.locator('[data-listening-listen]').click();await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','ready');
  await page.locator(`[data-listening-pad="${q.sequence[0]}"]`).click();
  await expect(page.locator('.listening-echo-slot.is-filled')).toHaveCount(1);
  await page.locator('[data-listening-hint]').click();await expect(page.locator('[data-listening-model]')).toBeVisible();
  const before=await score(page);await clear(page);
  await expect(page.locator('[data-listening-model]')).toBeHidden();await expect(page.locator('.listening-echo-slot.is-filled')).toHaveCount(1);
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','ready');expect(await score(page)).toEqual(before);
  await page.locator(`[data-listening-pad="${q.sequence[1]}"]`).click();await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','complete');
});
