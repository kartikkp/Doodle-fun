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

for(const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:667,height:375},{width:1024,height:768}])test(`practice modes remain reachable beside progress at ${viewport.width}×${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await page.addInitScript(()=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:10,level:'auto'})));await page.goto('/#word-tracing');
  const rail=page.locator('#activity-mode-bar'),coach=page.locator('#activity-coach-bar'),first=rail.getByRole('button',{name:'First lines',exact:true});
  await expect(first).toBeAttached();const r=await rail.boundingBox(),c=await coach.boundingBox();
  if(viewport.width<=650&&viewport.height>viewport.width){
    expect(r.width).toBeGreaterThanOrEqual(viewport.width-24);expect(c.y).toBeGreaterThanOrEqual(r.y+r.height);
  }else expect(Math.abs(c.y-r.y)).toBeLessThan(3);
  await page.screenshot({path:test.info().outputPath('practice-navigation.png')});
  await first.scrollIntoViewIfNeeded();const f=await first.boundingBox();expect(f.width).toBeGreaterThanOrEqual(48);expect(f.height).toBeGreaterThanOrEqual(48);expect(f.x).toBeGreaterThanOrEqual(r.x-.5);expect(f.x+f.width).toBeLessThanOrEqual(r.x+r.width+.5);
  await first.tap();await expect(page).toHaveURL(/#prewriting$/);await expect(page.getByTestId('trace-board')).toBeVisible();
  await page.locator('#journey-open').tap();await expect(page.locator('#journey-dialog')).toBeVisible();await page.locator('#journey-done').tap();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(viewport.width===320){
    // Replay the native failure's measured 89px choice and 214px Coach/progress
    // area. Host fonts can otherwise make the old row just barely fit on Linux.
    // Only the negative control fixes these sizes; production above uses its
    // actual geometry and must support the full-size target and a real tap.
    await page.addStyleTag({content:'.activity-navigation{flex-wrap:nowrap!important}.activity-navigation .activity-mode-bar:not([hidden]){flex:1 1 0!important}.activity-navigation:has(.activity-mode-bar:not([hidden])) .activity-coach-bar{flex:0 0 214px!important;min-width:214px!important}.activity-mode[data-activity-mode="prewriting"]{width:89px!important;min-width:89px!important}'});
    await first.scrollIntoViewIfNeeded();const crowded=await rail.boundingBox(),clipped=await first.boundingBox();
    expect(clipped.width).toBeGreaterThanOrEqual(48);expect(clipped.height).toBeGreaterThanOrEqual(48);
    expect(crowded.width).toBeLessThan(clipped.width);
    const visibleWidth=Math.max(0,Math.min(crowded.x+crowded.width,clipped.x+clipped.width)-Math.max(crowded.x,clipped.x));
    expect(visibleWidth).toBeLessThan(clipped.width);
    await test.info().attach('practice-rail-geometry',{body:JSON.stringify({production:{rail:r,choice:f},negativeControl:{rail:crowded,choice:clipped,visibleWidth}},null,2),contentType:'application/json'});
  }
});

for(const viewport of [{width:320,height:568},{width:375,height:667}])for(const mode of ['draw','coloring'])test(`creative paper keeps usable space without a progress row: ${mode} at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);await page.addInitScript(()=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:10,level:'auto'})));await page.goto('/#'+mode);if(mode==='coloring')await page.locator('.draw-template-card').first().tap();
  const paper=page.locator('.draw-canvas'),rail=page.locator('#activity-mode-bar'),coach=page.locator('#activity-coach-bar');await expect(paper).toBeVisible();await expect(page.locator('#journey-open')).toBeHidden();
  await expect.poll(async()=>(await paper.boundingBox()).width).toBeGreaterThan(120);const r=await rail.boundingBox(),c=await coach.boundingBox();expect(Math.abs(c.y-r.y)).toBeLessThan(3);
  const before=await paper.evaluate(node=>node.toDataURL());await paper.tap({position:{x:30,y:40}});expect(await paper.evaluate(node=>node.toDataURL())).not.toBe(before);await page.getByRole('button',{name:'Undo last action',exact:true}).tap();expect(await paper.evaluate(node=>node.toDataURL())).toBe(before);
  await page.screenshot({path:test.info().outputPath('creative-paper.png')});
  if(viewport.width===320){
    // The first navigation fix wrapped creative controls unnecessarily.
    await page.addStyleTag({content:'.activity-navigation{flex-wrap:wrap!important}.activity-navigation .activity-mode-bar:not([hidden]){flex:1 0 100%!important}.activity-navigation:has(.activity-mode-bar:not([hidden])) .activity-coach-bar{flex:1 0 100%!important}'});
    await expect.poll(async()=>(await paper.boundingBox()).width).toBeLessThanOrEqual(120);
  }
});

test('compact coloring preserves paper space with wider system-font metrics',async({page})=>{
  await page.setViewportSize({width:320,height:568});
  await page.addInitScript(()=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:10,level:'auto'})));
  await page.goto('/#coloring');await page.locator('.draw-template-card').first().tap();
  // Verdana reproduces the hosted WebKit wrapping that left only 117px of paper.
  await page.addStyleTag({content:'body{font-family:Verdana,sans-serif!important}'});
  const paper=page.locator('.draw-canvas');
  await expect.poll(async()=>(await paper.boundingBox()).width).toBeGreaterThan(120);
  const fixed=await paper.boundingBox();
  await expect(page.locator('.draw-challenge')).toBeVisible();
  await expect(page.getByRole('button',{name:'Try another drawing idea'})).toBeVisible();
  const before=await paper.evaluate(node=>node.toDataURL());await paper.tap({position:{x:30,y:40}});
  expect(await paper.evaluate(node=>node.toDataURL())).not.toBe(before);
  await page.getByRole('button',{name:'Undo last action',exact:true}).tap();expect(await paper.evaluate(node=>node.toDataURL())).toBe(before);
  await page.screenshot({path:test.info().outputPath('compact-coloring-wide-font.png')});
  // Restoring the caption must consume the same space the paper loses. Fonts
  // change the added row height, so measure that cost instead of assuming 16px.
  const prompt=page.locator('.draw-prompt'),fixedPrompt=await prompt.boundingBox();
  await page.addStyleTag({content:'.draw-prompt-label{display:inline!important}'});
  await expect(page.locator('.draw-prompt-label')).toBeVisible();
  await expect.poll(async()=>(await prompt.boundingBox()).height-fixedPrompt.height).toBeGreaterThan(1);
  await expect.poll(async()=>fixed.width-(await paper.boundingBox()).width).toBeGreaterThan(1);
  await expect.poll(async()=>Math.abs((fixed.width-(await paper.boundingBox()).width)-((await prompt.boundingBox()).height-fixedPrompt.height))).toBeLessThanOrEqual(1);
  await test.info().attach('compact-coloring-caption-geometry',{body:JSON.stringify({fixed:{paper:fixed,prompt:fixedPrompt},restored:{paper:await paper.boundingBox(),prompt:await prompt.boundingBox()}},null,2),contentType:'application/json'});
});
