import {test,expect} from '@playwright/test';
import {getProfile} from '../core.js';
import {generateChallenge} from '../challenges.js';

for(const age of [9,10])for(const viewport of [{width:375,height:812},{width:812,height:375}]) {
  test(`age ${age} place-value games complete every unknown on ${viewport.width}px phones`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
    for(const id of ['subtraction','number-bonds','compare','number-order']) {
      await page.goto(`/#${id}`);
      for(let round=0;round<3;round++) {
        const q=generateChallenge(id,getProfile({age}),round),feedback=page.getByTestId('challenge-feedback');
        await expect(page.getByTestId('challenge-prompt')).toHaveText(q.prompt);
        await expect(feedback).not.toHaveClass(/is-complete/);
        await expect(page.locator('.challenge-dot,.challenge-pair-row')).toHaveCount(0);
        if(id==='compare') {
          await expect(page.locator('.challenge-comparison-model')).toBeHidden();
          await page.locator(`[data-answer="${q.answer==='same'?'left':'same'}"]`).click();
          await expect(feedback).not.toHaveClass(/is-complete/);
          await page.locator(`[data-answer="${q.answer}"]`).click();
          await expect(feedback).not.toHaveClass(/is-complete/);
          await page.locator(`[data-follow-answer="${q.followup.choices.find(value=>value!==q.followup.answer)}"]`).click();
          await expect(feedback).not.toHaveClass(/is-complete/);
          await page.locator(`[data-follow-answer="${q.followup.answer}"]`).click();
        } else if(id==='number-order') {
          await page.locator(`[data-tile="${q.sequence.at(-1)}"]`).click();
          await expect(page.locator('.challenge-slot.is-filled')).toHaveCount(0);
          for(const value of q.sequence)await page.locator(`[data-tile="${value}"]`).click();
          await expect(page.locator('.challenge-slot.is-filled')).toHaveText(q.sequence.map(String));
        } else {
          await expect(page.getByTestId('place-value-strategy')).toBeHidden();
          const fields=id==='subtraction'?page.locator('.challenge-calculation-part > strong'):page.locator('.challenge-whole > strong,.challenge-bond-part > strong');
          await expect(fields).toHaveText(id==='subtraction'?['start','removed','remaining'].map(key=>q.ask===key?'?':String(q[key])):[q.ask==='total'?'?':String(q.total),q.ask==='first'?'?':String(q.firstPart),q.ask==='second'?'?':String(q.secondPart)]);
          await page.locator(`[data-answer="${q.choices.find(value=>value!==q.answer)}"]`).click();
          await expect(feedback).not.toHaveClass(/is-complete/);
          await expect(feedback).toContainText('Check:');
          await page.getByRole('button',{name:'Show a place-value strategy',exact:true}).click();
          await expect(page.getByTestId('place-value-strategy')).toBeVisible();
          await expect(feedback).not.toHaveClass(/is-complete/);
          await page.locator(`[data-answer="${q.answer}"]`).click();
          await expect(feedback).toContainText(id==='subtraction'?`${q.start} − ${q.removed} = ${q.remaining}`:`${q.firstPart} + ${q.secondPart} = ${q.total}`);
        }
        await expect(feedback).toHaveClass(/is-complete/);
        const layout=await page.locator('#challenges-view').evaluate(screen=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,controls:[...screen.querySelectorAll('button')].filter(node=>node.getClientRects().length).map(node=>{const r=node.getBoundingClientRect();return {label:node.textContent,left:r.left,right:r.right,width:r.width,height:r.height};}),disabled:[...screen.querySelectorAll('[data-answer],[data-follow-answer],[data-tile]')].every(node=>node.disabled)}));
        expect(layout.disabled).toBe(true);expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
        for(const control of layout.controls){expect(control.left,control.label).toBeGreaterThanOrEqual(0);expect(control.right,control.label).toBeLessThanOrEqual(layout.width);expect(control.width,control.label).toBeGreaterThanOrEqual(48);expect(control.height,control.label).toBeGreaterThanOrEqual(48);}
        await page.getByRole('button',{name:'Play another round →',exact:true}).click();
      }
    }
  });
}
