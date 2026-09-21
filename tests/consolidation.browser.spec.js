import {test,expect} from '@playwright/test';
import {ACTIVITIES,ACTIVITY_MODES,getFamily} from '../catalog.js';
import {coachingFor} from '../coaching.js';

for(const age of [2,6,10])test(`age ${age}: every family mode opens from its card with its own Coach`,async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:375,height:667});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.locator(`[data-age="${age}"]`).click();
  await expect(page.locator('.activity-card')).toHaveCount(21);
  for(const family of ACTIVITIES){
    await page.locator(`#card-${family.id}`).click();
    for(const mode of family.modes){
      if(family.modes.length>1)await page.locator(`[data-activity-mode="${mode.id}"]`).click();
      await expect(page.locator('body')).toHaveAttribute('data-activity',mode.id);
      if(mode.id==='coloring'){
        await expect(page.locator('.draw-template-dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('.draw-template-dialog')).toBeHidden();
      }
      await expect(page.getByRole('heading',{name:family.title,exact:true})).toBeVisible();
      if(family.modes.length>1)await expect(page.locator(`[data-activity-mode="${mode.id}"]`)).toHaveAttribute('aria-pressed','true');
      await page.locator('#coach-open').click();
      await expect(page.locator('#coach-title')).toHaveText(family.title);
      await expect(page.locator('#coach-start')).toHaveText(coachingFor(mode.id,age).start);
      await page.locator('#coach-done').click();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    }
    await page.getByRole('button',{name:/^Back to (home|activities)$/}).click();
    await expect(page.locator(`#card-${family.id}`)).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test('all original exercise links still resolve to their family and keep saved support by mode',async({page})=>{
  test.setTimeout(90000);
  await page.addInitScript(()=>{
    localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:6,level:'auto'}));
    localStorage.setItem('doodle-fun:v2:activity-support-v1',JSON.stringify({addition:-1,subtraction:2}));
  });
  for(const mode of ACTIVITY_MODES.filter(mode=>mode.engine!=='listening')){
    await page.goto(`/#${mode.id}`);
    await expect(page.locator('body')).toHaveAttribute('data-activity',mode.id);
    if(mode.id==='coloring'){
      await expect(page.locator('.draw-template-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
    }
    await expect(page.getByRole('heading',{name:getFamily(mode.id).title,exact:true})).toBeVisible();
  }
  await page.goto('/#number-stories');
  await page.locator('#coach-open').click();
  await expect(page.locator('#coach-level')).toContainText('practice step 5');
  await page.locator('#coach-done').click();
  await page.locator('[data-activity-mode="subtraction"]').click();
  await page.locator('#coach-open').click();
  await expect(page.locator('#coach-level')).toContainText('practice step 8');
});

test('legacy tabs and their initial defaults keep the actual game difficulty aligned with Coach',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:new URLSearchParams(location.search).get('legacy')==='little'?2:6,level:'auto'})));
  await page.goto('/#numbers');
  await page.locator('#coach-open').click();
  await page.locator('#coach-harder').click();await page.locator('#coach-harder').click();
  await page.locator('#coach-done').click();
  await expect(page.locator('.learn-support')).toContainText('Practice 8');
  await page.getByRole('button',{name:'Add together',exact:true}).click();
  await expect(page.locator('.learn-support')).toContainText('Practice 6');
  await page.locator('#coach-open').click();
  await expect(page.locator('#coach-level')).toContainText('practice step 6');
  await page.locator('#coach-done').click();
  await page.getByRole('button',{name:'Count dots',exact:true}).click();
  await expect(page.locator('.learn-support')).toContainText('Practice 8');
  await page.goto('/?legacy=letters#letters');
  await page.locator('#coach-open').click();await page.locator('#coach-harder').click();
  await page.locator('#coach-done').click();
  await page.locator('[data-learn-set="lower"]').click();
  await expect(page.locator('.learn-support')).toContainText('Practice 6');
  await page.goto('/?legacy=little#letters');
  await page.locator('#coach-open').click();
  await expect(page.locator('#coach-start')).toHaveText(coachingFor('prewriting',2).start);
});
