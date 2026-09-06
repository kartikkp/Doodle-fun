import {test,expect} from '@playwright/test';

const sizes=[['small iPhone',375,667],['iPhone',390,844],['iPad portrait',820,1180],['iPad landscape',1180,820],['iPhone landscape',844,390]];
for(const [name,width,height] of sizes) {
  test(`${name}: every activity opens for every age band without overflow`,async({page})=>{
    await page.setViewportSize({width,height});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/');
    for(const age of [3,6,9]) {
      await page.locator(`[data-age="${age}"]`).click();
      for(const route of ['draw','coloring','letters','numbers']) {
        await page.locator(`#card-${route}`).click();
        const view=page.locator(route==='draw'||route==='coloring'?'#drawing-view':'#learning-view');
        await expect(view).toBeVisible();
        await expect(view.locator('h1')).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        // Close any newly opened template selector before returning home.
        await page.keyboard.press('Escape');
        await view.getByRole('button',{name:/Back to (home|activities)/}).click();
        await expect(page.locator('#home-screen')).toBeVisible();
      }
    }
    expect(errors).toEqual([]);
  });
}

test('grown-up settings persist and support can override age without locks',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Grown-ups',exact:true}).click();
  await page.locator('#support-level').selectOption('little');
  await page.locator('#age-plus').click();
  await page.locator('#settings-sound').check();
  await page.locator('#settings-done').click();
  await page.reload();
  await page.getByRole('button',{name:'Grown-ups',exact:true}).click();
  await expect(page.locator('#child-age-output')).toHaveText('7');
  await expect(page.locator('#support-level')).toHaveValue('little');
  await expect(page.locator('#settings-sound')).toBeChecked();
  await page.keyboard.press('Escape');
  await page.locator('#card-letters').click();
  await expect(page.locator('[data-learn-set=lower]')).toBeEnabled();
  await expect(page.locator('[data-learn-set=nums]')).toBeEnabled();
});

test('malformed persisted settings and unavailable storage do not block play',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:{valueOf:1,toString:1}}));
    localStorage.setItem('doodle-fun:v2:home-progress',JSON.stringify({completedCount:{valueOf:1,toString:1}}));
    localStorage.setItem('doodle-fun:v2:learning-progress-v1','null');
    Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.locator('[data-age="3"]').click();
  await page.locator('#card-letters').click();
  await expect(page.locator('[data-learn-set=shapes]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:/Back to (home|activities)/}).click();
  await page.locator('#card-draw').click();
  await expect(page.locator('.draw-canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('browser history and rapid navigation recover the correct activity',async({page})=>{
  await page.goto('/');
  await page.locator('#card-draw').click();
  await expect(page.locator('#drawing-view')).toBeVisible();
  await page.getByRole('button',{name:/Back to (home|activities)/}).click();
  await page.locator('#card-letters').click();
  await expect(page.locator('#learning-view')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#home-screen')).toBeVisible();
  await page.goForward();
  await expect(page.locator('#learning-view')).toBeVisible();
});

test('mobile scroll remains enabled outside drawing surfaces and zoom is not disabled',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const viewport=await page.locator('meta[name=viewport]').getAttribute('content');
  expect(viewport).not.toContain('user-scalable=no');
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).touchAction)).not.toBe('none');
  await page.locator('#card-numbers').scrollIntoViewIfNeeded();
  await expect(page.locator('#card-numbers')).toBeInViewport();
  const labels=await page.locator('.age-option strong,.age-option small,.card-bottom p').evaluateAll(els=>els.map(el=>parseFloat(getComputedStyle(el).fontSize)));
  expect(Math.min(...labels)).toBeGreaterThanOrEqual(12);
});

test('real touch taps can select a color, make a mark, and undo on a phone',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/#draw');
  const canvas=page.locator('.draw-canvas');
  await expect(canvas).toBeVisible();
  await page.getByRole('button',{name:'Orange',exact:true}).tap();
  const box=await canvas.boundingBox();
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  await expect(page.locator('.draw-undo')).toBeEnabled();
  await page.locator('.draw-undo').tap();
  await expect(page.locator('.draw-redo')).toBeEnabled();
  await context.close();
});
