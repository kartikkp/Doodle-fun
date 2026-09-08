import {test,expect} from '@playwright/test';
import {ADVENTURE_IDS} from '../adventures.js';
test.use({hasTouch:true,viewport:{width:375,height:812}});
async function hint(page){await page.locator('.adventure-hint').tap();await expect(page.locator('.adventure-status')).toHaveClass(/is-hint/);}
async function solve(page,id){
  for(let step=0;step<32;step++){
    if(await page.locator('.adventure-next.is-ready').count())return;
    if(id==='sharing'){
      const remaining=await page.locator('.adventure-cookie-pool').getAttribute('aria-label');
      if(remaining==='0 cookies to share'){await page.locator('.adventure-check').tap();continue;}
    }
    await hint(page);
    const selector={'size-order':'data-piece','picture-sequence':'data-piece',directions:'data-direction','make-a-shape':'data-vertex',rhythm:'data-beat',sharing:'data-basket'}[id];
    await page.locator(`.adventure-play .is-hint[${selector}]`).tap();
  }
  throw new Error(`Could not solve ${id}`);
}
for(let age=2;age<=10;age++)for(const id of ADVENTURE_IDS){
  test(`age ${age}: ${id} wrong attempt, hint, completion, replay, and next`,async({page})=>{
    await page.addInitScript(value=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:value,level:'auto',sound:false})),age);
    await page.goto(`/#${id}`);await expect(page.locator('.adventure-title')).toBeVisible();
    if(await page.locator('.adventure-ready').count())await page.locator('.adventure-ready').tap();
    await hint(page);
    // Read-aloud changes must preserve both the board and the contextual hint.
    if(age===6){
      const before=await page.locator('.adventure-play').innerHTML();
      await page.locator('#coach-sound').tap();
      await expect(page.locator('.adventure-status')).toHaveClass(/is-hint/);
      expect(await page.locator('.adventure-play').innerHTML()).toBe(before);
      await page.locator('#coach-sound').tap();
    }
    if(id==='sharing')await page.locator('.adventure-check').tap();
    else{
      const selector={'size-order':'data-piece','picture-sequence':'data-piece',directions:'data-direction','make-a-shape':'data-vertex',rhythm:'data-beat'}[id];
      // The start dot is never a valid first edge; the opposite perimeter direction is valid.
      if(id==='make-a-shape')await page.locator('[data-vertex="0"]').tap();
      else await page.locator(`[${selector}]:enabled:not(.is-hint)`).first().tap();
    }
    await expect(page.locator('.adventure-status')).toHaveClass(/is-retry/);
    await expect(page.locator('.adventure-next')).not.toHaveClass(/is-ready/);
    await solve(page,id);await expect(page.locator('.adventure-next')).toHaveClass(/is-ready/);
    await expect(page.locator('.adventure-status')).toHaveClass(/is-success/);
    const progress=await page.evaluate(id=>JSON.parse(localStorage.getItem('doodle-fun:v2:adventures-progress-v1'))[id],id);expect(progress).toBe(1);
    await page.locator('.adventure-retry').tap();await expect(page.locator('.adventure-next')).not.toHaveClass(/is-ready/);
    await page.locator('.adventure-next').tap();await expect(page.locator('.adventure-round')).toContainText('round 2');
    const layout=await page.locator('#adventures-view').evaluate(root=>({overflow:document.documentElement.scrollWidth>innerWidth,targets:[...root.querySelectorAll('button')].filter(node=>node.getBoundingClientRect().width>0).map(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}))}));
    expect(layout.overflow).toBe(false);for(const target of layout.targets){expect(target.width).toBeGreaterThanOrEqual(47.5);expect(target.height).toBeGreaterThanOrEqual(47.5);}
  });
}
