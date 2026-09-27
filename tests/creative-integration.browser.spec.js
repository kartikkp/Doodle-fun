import {test,expect} from '@playwright/test';
import {buildStudioRound,solvePour,solveBalance} from '../studio-play.js';
import {getLearningItems} from '../learning-data.js';

test.use({viewport:{width:390,height:844},hasTouch:true});
for(let age=2;age<=10;age++)test(`age ${age}: drawing stays first and all new bundled studios support touch play`,async({page})=>{
  await page.goto('/');await page.locator(`[data-age="${age}"]`).tap();await expect(page.locator('.activity-card').first()).toHaveAttribute('id','card-draw');
  await page.locator('#card-draw').tap();await expect(page.locator('.draw-canvas')).toBeVisible();await expect(page.locator('#journey-open')).toBeHidden();
  for(const id of ['mirror-mosaic','balance-lab','measure-pour']){
    await page.goto('/#'+id);await expect(page.locator('#studio-view')).toBeVisible();await expect(page.locator('#journey-open')).toBeVisible();const round=buildStudioRound(id,age);
    if(id==='mirror-mosaic'){
      for(let color=1;color<=round.colors;color++){
        await page.locator(`.studio-palette [data-color="${color}"]`).tap();
        for(let cell=0;cell<round.solution.length;cell++)if(!round.sources.includes(cell)&&round.solution[cell]===color)await page.locator(`button[data-cell="${cell}"]`).tap();
      }
    }else if(id==='balance-lab'){
      for(const value of solveBalance(round)){
        await page.locator(`[data-weight="${value}"]`).tap();await page.locator('[data-pan="1"]').tap();
      }
    }else for(const[from,to]of solvePour(round)){await page.locator(`[data-jug="${from}"]`).tap();await page.locator(`[data-jug="${to}"]`).tap();}
    await page.locator('.studio-check').tap();await expect(page.locator('.studio-status')).toHaveClass(/is-success/);
    await page.locator('#journey-open').tap();await expect(page.locator('#journey-count')).toContainText('1 of');await expect(page.locator('#journey-level')).toContainText(`Starting age ${age} · practice step ${age}`);await page.locator('#journey-done').tap();
  }
  await page.goto('/#home');await page.locator('[data-filter="create"]').tap();await page.locator('#card-beat-studio').tap();await expect(page).toHaveURL(/#beat-maker$/);await expect(page.locator('#journey-open')).toBeHidden();
  await page.locator('[data-track="0"][data-beat-step="0"]').tap();await expect(page.locator('[data-track="0"][data-beat-step="0"]')).toHaveAttribute('aria-pressed','true');await page.reload();await expect(page.locator('[data-track="0"][data-beat-step="0"]')).toHaveAttribute('aria-pressed','true');
});

test('practice steps persist separately for each age and mode across the full range',async({page})=>{
  await page.goto('/');await page.locator('[data-age="6"]').tap();await page.locator('#card-counting').tap();await page.locator('#coach-open').tap();
  for(let step=5;step>=2;step--){await page.locator('#coach-easier').tap();await expect(page.locator('#coach-level')).toContainText(`practice step ${step}`);}
  await expect(page.locator('#coach-easier')).toBeDisabled();await page.locator('#coach-done').tap();await page.reload();await page.locator('#coach-open').tap();await expect(page.locator('#coach-level')).toContainText('Starting age 6 · practice step 2');await page.locator('#coach-done').tap();
  await page.goto('/');await page.locator('[data-age="7"]').tap();await page.locator('#card-counting').tap();await page.locator('#coach-open').tap();await expect(page.locator('#coach-level')).toContainText('Starting age 7 · practice step 7');await page.locator('#coach-done').tap();
  await page.goto('/#balance-lab');await page.locator('#coach-open').tap();for(let step=8;step<=10;step++)await page.locator('#coach-harder').tap();await expect(page.locator('#coach-harder')).toBeDisabled();await expect(page.locator('#coach-level')).toContainText('Starting age 7 · practice step 10');
});

test('Numbers triangle labels fit in both pans; the original narrow layout fails this geometry check',async({page})=>{
  await page.goto('/');await page.locator('[data-age="10"]').tap();
  const fit=()=>page.locator('#card-compare svg').evaluate(svg=>{
    const pans=[...svg.querySelectorAll('[data-scale-pan]')];
    return ['245','254'].map((value,i)=>{
      const node=[...svg.querySelectorAll('text')].find(n=>n.textContent===value),b=node.getBBox();
      return [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].every(([x,y])=>pans[i].isPointInFill(new DOMPoint(x,y)));
    });
  });
  expect(await fit()).toEqual([true,true]);
  await page.locator('#card-compare svg').evaluate(svg=>{
    svg.querySelector('[data-scale-pan="left"]').setAttribute('d','M53 54 27 101H79Z');svg.querySelector('[data-scale-pan="right"]').setAttribute('d','M188 54 162 101h52Z');
    for(const node of svg.querySelectorAll('text'))if(['245','254'].includes(node.textContent)){node.setAttribute('y','89');node.setAttribute('font-size','19');}
  });
  expect(await fit()).toContain(false);
});

test('a completed tracing set offers a real fresh attempt through My progress',async({page})=>{
  const ids=getLearningItems('words',10).slice(0,3).map(item=>`words:${item.ch}`);
  await page.addInitScript(ids=>{
    const prefix='doodle-fun:v2:';localStorage.setItem(prefix+'settings',JSON.stringify({age:10,level:'auto'}));
    localStorage.setItem(prefix+'activity-progress-sources','{"learning":7}');
    localStorage.setItem(prefix+'learning-progress-v1',JSON.stringify(Object.fromEntries([...ids,'upper:A','upper:B','upper:C','upper:D'].map(id=>[id,true]))));
    localStorage.setItem(prefix+'medal-progress-v1',JSON.stringify({version:1,entries:{'word-tracing:10:10:v1':{mode:'word-tracing',age:10,step:10,cursor:3,attempt:1,rounds:Object.fromEntries(ids.map(id=>[id,{done:true,hint:true,mistake:false}])),seen:ids,bestMedal:'bronze',result:{medal:'bronze',clean:0,total:3,sessionId:1}}}}));
  },ids);
  await page.goto('/#word-tracing');await page.locator('#journey-open').tap();await expect(page.locator('#journey-result')).toHaveText('Best medal: Bronze');await expect(page.locator('#journey-fresh')).toBeVisible();await page.locator('#journey-fresh').tap();
  await page.locator('#journey-open').tap();await expect(page.locator('#journey-count')).toContainText('0 of 3');await expect(page.locator('#journey-fresh')).toBeHidden();await expect(page.locator('#journey-result')).toHaveText('Best medal: Bronze');await page.locator('#journey-done').tap();
  await expect(page.locator('.learn-ink-layer')).toBeEmpty();expect(await page.evaluate(()=>localStorage.getItem('doodle-fun:v2:activity-progress-sources'))).toBe('{"learning":7}');
});
