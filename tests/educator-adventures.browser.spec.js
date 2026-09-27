import {test,expect} from '@playwright/test';
test.use({hasTouch:true,viewport:{width:375,height:812}});
const names={'↑':'up','→':'right','↓':'down','←':'left'},opposite={up:'down',down:'up',left:'right',right:'left'},clockwise={up:'right',right:'down',down:'left',left:'up'};
for(const age of [7,10])test(`age ${age}: return-route source markers track the arrows actually consumed`,async({page})=>{
  await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
  await page.goto('/#directions');await expect(page.locator('.adventure-title')).toBeVisible();
  const shown=(await page.locator('.adventure-direction-clue').allTextContents()).map(symbol=>names[symbol]);
  expect(shown.every(Boolean)).toBe(true);
  let solution=[...shown].reverse().map(value=>opposite[value]);if(age===10)solution=solution.map(value=>clockwise[value]);
  const wrong=Object.keys(opposite).find(value=>value!==solution[0]);
  await page.locator(`[data-direction="${wrong}"]`).tap();await expect(page.locator('.adventure-status')).toHaveClass(/is-retry/);await expect(page.locator('.adventure-direction-clue.is-done')).toHaveCount(0);await expect(page.locator('.is-hint')).toHaveCount(0);
  for(let step=0;step<solution.length;step++){
    await page.locator(`[data-direction="${solution[step]}"]`).tap();
    const marked=await page.locator('.adventure-direction-clue').evaluateAll(nodes=>nodes.map((node,index)=>node.classList.contains('is-done')?index:-1).filter(index=>index>=0));
    expect(marked).toEqual(Array.from({length:step+1},(_,i)=>shown.length-step-1+i));
  }
  await expect(page.locator('.adventure-status')).toHaveClass(/is-success/);await expect(page.locator('.adventure-next')).toHaveClass(/is-ready/);
  await page.locator('.adventure-retry').tap();await expect(page.locator('.adventure-direction-clue.is-done')).toHaveCount(0);
  await page.locator('.adventure-next').tap();await expect(page.locator('.adventure-round')).toContainText('round 2');await expect(page.locator('.adventure-direction-clue.is-done')).toHaveCount(0);
});
