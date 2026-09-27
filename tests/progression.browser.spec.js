import {test,expect} from '@playwright/test';
import {generateChallenge} from '../challenges.js';
import {buildDiscoveryRound} from '../discovery.js';
import {buildAdventureRound} from '../adventures.js';
import {buildListeningRound} from '../listening.js';
import {getProfile} from '../core.js';

async function start(page,mode,age){
  await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
  await page.goto(`/#${mode}`);
}
async function saved(page,mode,age,step=age){return page.evaluate(({mode,age,step})=>JSON.parse(localStorage.getItem('doodle-fun:v2:medal-progress-v1'))?.entries[`${mode}:${age}:${step}:v1`],{mode,age,step});}

test('comparison medals preserve retry mistakes and improve only on a fresh set',async({page})=>{
  await start(page,'compare',2);
  for(let index=0;index<6;index++){
    const q=generateChallenge('compare',getProfile({age:2}),index);
    if(index===0){
      await page.locator(`[data-answer="${q.answer==='left'?'right':'left'}"]`).click();
      await page.getByRole('button',{name:'Try this round again'}).click();
    }
    await page.locator(`[data-answer="${q.answer}"]`).click();
    if(index===2){const value=await saved(page,'compare',2);expect(value.bestMedal).toBe('silver');expect(value.result.clean).toBe(2);}
    if(index!==5)await page.locator('.challenge-new').click();
  }
  expect((await saved(page,'compare',2)).bestMedal).toBe('gold');
  await page.getByRole('button',{name:'Try this round again'}).click();
  const q=generateChallenge('compare',getProfile({age:2}),5);
  await page.locator(`[data-answer="${q.answer}"]`).click();
  expect((await saved(page,'compare',2)).result.sessionId).toBe(2);
  await page.reload();
  await expect(page.locator('.challenge-round')).toHaveText('ROUND 7');
  expect((await saved(page,'compare',2)).bestMedal).toBe('gold');
});

test('memory exploration is not an incorrect answer',async({page})=>{
  const q=buildDiscoveryRound('memory',4,0);
  await start(page,'memory',4);
  const different=q.cards.findIndex(card=>card.id!==q.cards[0].id);
  await page.locator('[data-card="0"]').click();await page.locator(`[data-card="${different}"]`).click();
  await page.getByRole('button',{name:'Turn them over'}).click();
  for(const id of new Set(q.cards.map(card=>card.id))){
    const pair=q.cards.map((card,index)=>card.id===id?index:-1).filter(index=>index>=0);
    for(const index of pair)await page.locator(`[data-card="${index}"]`).click();
  }
  await expect(page.locator('.discover-status')).toHaveClass(/is-success/);
  expect((await saved(page,'memory',4)).rounds['0']).toEqual({mistake:false,hint:false,done:true});
});

test('an incorrect route command remains recorded after restarting the adventure',async({page})=>{
  const q=buildAdventureRound('directions',3,0);
  await start(page,'directions',3);
  const wrong=['up','down','left','right'].find(value=>value!==q.commands[0]);
  await page.locator(`[data-direction="${wrong}"]`).click();
  await page.locator('.adventure-retry').click();
  for(const value of q.commands)await page.locator(`[data-direction="${value}"]`).click();
  await expect(page.locator('.adventure-status')).toHaveClass(/is-success/);
  expect((await saved(page,'directions',3)).rounds['0']).toEqual({mistake:true,hint:false,done:true});
});

test('listening playback and replay keep the same scored attempt',async({page})=>{
  const q=buildListeningRound('sound-match',2,0);
  await start(page,'sound-match',2);
  await page.locator('[data-listening-listen]').click();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','ready');
  const wrong=q.choices.find(value=>value!==q.answer);
  await page.locator(`[data-listening-answer="${wrong}"]`).click();
  await page.locator('[data-listening-listen]').click();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','ready');
  await page.locator(`[data-listening-answer="${q.answer}"]`).click();
  await expect(page.locator('.listening-screen')).toHaveAttribute('data-listening-state','complete');
  expect((await saved(page,'sound-match',2)).rounds['0']).toEqual({mistake:true,hint:false,done:true});
});
