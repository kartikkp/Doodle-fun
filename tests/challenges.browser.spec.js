import {test,expect} from '@playwright/test';
import {CHALLENGE_INFO,generateChallenge} from '../challenges.js';
import {getProfile} from '../core.js';

async function start(page,id,age) {
  await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
  await page.goto(`/#${id}`);
  await expect(page.getByRole('heading',{name:CHALLENGE_INFO[id].title,exact:true})).toBeVisible();
  return generateChallenge(id,getProfile({age}),0);
}
async function passed(page) {await expect(page.getByTestId('challenge-feedback')).toHaveClass(/is-complete/);}
test('320px phones keep twenty-frame and dense word, case and subtraction controls inside the screen',async({page})=>{
  await page.setViewportSize({width:320,height:568});
  for(const id of ['ten-frame','subtraction','word-build','letter-match']) {
    await start(page,id,10);
    if(id==='ten-frame')await expect(page.locator('.challenge-intro')).toContainText('Leave the number of empty spaces shown');
    if(id==='subtraction')await expect(page.locator('.challenge-intro')).toContainText('how many were taken away');
    if(id==='word-build') {
      const tops=await page.locator('.challenge-word-slots .challenge-slot').evaluateAll(slots=>slots.map(slot=>slot.getBoundingClientRect().top));
      expect(new Set(tops).size,'all eight spelling spaces stay in one reading line').toBe(1);
    }
    const layout=await page.locator('.challenges-screen').evaluate(screen=>({
      width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      controls:[...screen.querySelectorAll('button')].filter(button=>button.getClientRects().length).map(button=>{const rect=button.getBoundingClientRect();return {label:button.getAttribute('aria-label')||button.textContent,left:rect.left,right:rect.right,width:rect.width,height:rect.height};}),
      frames:[...screen.querySelectorAll('.challenge-frame')].map(frame=>{const rect=frame.getBoundingClientRect();return {left:rect.left,right:rect.right,width:rect.width};}),
    }));
    expect(layout.scrollWidth,`${id}: page width`).toBeLessThanOrEqual(layout.width);
    for(const control of layout.controls) {
      expect(control.left,`${id}: ${control.label} left edge`).toBeGreaterThanOrEqual(0);
      expect(control.right,`${id}: ${control.label} right edge`).toBeLessThanOrEqual(layout.width);
      expect(control.width,`${id}: ${control.label} width`).toBeGreaterThanOrEqual(48);
      expect(control.height,`${id}: ${control.label} height`).toBeGreaterThanOrEqual(48);
    }
    for(const frame of layout.frames){expect(frame.left).toBeGreaterThanOrEqual(0);expect(frame.right).toBeLessThanOrEqual(layout.width);}
  }
});
for(const age of [2,3,4,5,6,7,8,9,10]) {
  test.describe(`challenge play at age ${age}`,()=>{
    test.use({viewport:age%3===0?{width:844,height:390}:age%3===1?{width:820,height:1180}:{width:375,height:812}});
    test('comparison permits a retry and rewards the correct quantity relation',async({page})=>{
      const q=await start(page,'compare',age);
      await page.locator(`[data-answer="${q.answer==='same'?'left':'same'}"]`).click();
      await expect(page.getByTestId('challenge-feedback')).not.toHaveClass(/is-complete/);
      await page.locator(`[data-answer="${q.answer}"]`).click();
      if(q.followup){await expect(page.getByTestId('challenge-feedback')).not.toHaveClass(/is-complete/);await page.locator(`[data-follow-answer="${q.followup.choices.find(value=>value!==q.followup.answer)}"]`).click();await page.locator(`[data-follow-answer="${q.followup.answer}"]`).click();}
      await passed(page);
      await page.getByRole('button',{name:'Play another round →',exact:true}).click();
      await expect(page.getByTestId('challenge-feedback')).not.toHaveClass(/is-complete/);
    });
    test('number order needs the whole ordered sequence',async({page})=>{
      const q=await start(page,'number-order',age);
      await page.locator(`[data-tile="${q.sequence.at(-1)}"]`).click();await expect(page.locator('.challenge-slot.is-filled')).toHaveCount(0);
      for(const number of q.sequence)await page.locator(`[data-tile="${number}"]`).click();await passed(page);
      await expect(page.locator('.challenge-slot.is-filled')).toHaveCount(q.sequence.length);
    });
    test('subtraction models the groups and accepts the requested unknown',async({page})=>{
      const q=await start(page,'subtraction',age);await expect(page.locator('.challenge-dot.is-crossed')).toHaveCount(q.removed);
      await page.locator(`[data-answer="${q.choices.find(value=>value!==q.answer)}"]`).click();await expect(page.getByTestId('challenge-feedback')).not.toHaveClass(/is-complete/);
      await page.locator(`[data-answer="${q.answer}"]`).click();await passed(page);
    });
    test('missing parts give an optional counting picture and verify the complete whole',async({page})=>{
      const q=await start(page,'number-bonds',age);
      await page.locator(`[data-answer="${q.choices.find(value=>value!==q.answer)}"]`).click();
      await expect(page.locator('.challenge-bond-support')).toBeVisible();
      await expect(page.locator('.challenge-bond-support .challenge-dot.is-empty')).toHaveCount(q.answer);
      await page.locator(`[data-answer="${q.answer}"]`).click();await passed(page);
    });
    test('frames allow changing a dot and require the exact target',async({page})=>{
      const q=await start(page,'ten-frame',age);await expect(page.locator('[data-cell]')).toHaveCount(q.size);
      await page.getByRole('button',{name:'Check my frame',exact:true}).click();await expect(page.getByTestId('challenge-feedback')).not.toHaveClass(/is-complete/);
      await page.locator('[data-cell="0"]').click();await page.locator('[data-cell="0"]').click();await expect(page.locator('[data-cell="0"]')).toHaveAttribute('aria-pressed','false');
      for(let i=0;i<q.target;i++)await page.locator(`[data-cell="${i}"]`).click();
      await page.getByRole('button',{name:'Check my frame',exact:true}).click();await passed(page);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    });
    test('letter partners recover from a mismatch and require every case pair',async({page})=>{
      const q=await start(page,'letter-match',age);
      if(q.pairs.length>1){await page.locator(`[data-letter="${q.pairs[0].toUpperCase()}"]`).click();await page.locator(`[data-letter="${q.pairs[1]}"]`).click();}
      else await page.getByRole('button',{name:'Show partners',exact:true}).click();
      await expect(page.locator('.challenge-letter.is-matched')).toHaveCount(0);
      for(const letter of q.pairs){await page.locator(`[data-letter="${letter.toUpperCase()}"]`).click();await page.locator(`[data-letter="${letter}"]`).click();}
      await passed(page);await expect(page.locator('.challenge-letter.is-matched')).toHaveCount(q.pairs.length*2);
    });
    test('word building handles hints and repeated letter tiles without reusing a tile',async({page})=>{
      const q=await start(page,'word-build',age);
      if(age<=4)await expect(page.locator('.challenge-word-model')).toBeVisible();else await expect(page.locator('.challenge-word-model')).toBeHidden();
      const wrong=q.tiles.find(tile=>tile.letter!==q.word[0]);await page.locator(`[data-tile="${wrong.index}"]`).click();await expect(page.locator('.challenge-word-model')).toBeVisible();
      for(const letter of q.word)await page.locator(`[data-character="${letter}"]:not(:disabled)`).first().click();
      await passed(page);await expect(page.locator('.challenge-slot.is-filled')).toHaveCount(q.word.length);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    });
  });
}

test('read-aloud toggles preserve an in-progress sequence and frame',async({page})=>{
  await start(page,'number-order',6);const q=generateChallenge('number-order',getProfile({age:6}));
  await page.locator(`[data-tile="${q.sequence[0]}"]`).click();
  await page.locator('#coach-sound').click();
  await expect(page.locator('.challenge-slot.is-filled')).toHaveCount(1);
  await expect(page.locator('[data-challenge-speech]')).toBeVisible();
  for(const number of q.sequence.slice(1))await page.locator(`[data-tile="${number}"]`).click();await passed(page);
  await page.goto('/#ten-frame');await page.locator('[data-cell="0"]').click();
  await page.locator('#coach-sound').click();await expect(page.locator('[data-cell="0"]')).toHaveAttribute('aria-pressed','true');
});
