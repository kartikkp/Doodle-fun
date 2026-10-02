import {test,expect} from '@playwright/test';
import {makeParentCredential} from '../parent-controls.js';

const prefix='doodle-fun:v2:',pin='473829',recovery='ABCD1234ABCD';
const credential=await makeParentCredential(pin,recovery);
async function seed(page,{kidSafe=true,native=false,lockSettings=false}={}){
  await page.addInitScript(({prefix,credential,kidSafe,native,lockSettings})=>{
    if(!sessionStorage.getItem('kid-safe-seeded')){
      localStorage.setItem(prefix+'parent-controls-v1',JSON.stringify({version:1,hints:'on',lockSettings,kidSafe,credential,failures:0,retryAfter:0}));
      sessionStorage.setItem('kid-safe-seeded','true');
    }
    window.outside=[];
    window.open=(...args)=>window.outside.push(args);
    if(native)window.webkit={messageHandlers:{doodleNative:{postMessage:message=>window.outside.push(message)}}};
  },{prefix,credential,kidSafe,native,lockSettings});
}
async function unlock(page,value=pin){
  await expect(page.locator('#parent-pin-dialog')).toBeVisible();
  await page.locator('#parent-pin-input').fill(value);await page.locator('#parent-pin-submit').click();
  await expect(page.locator('#parent-pin-dialog')).toBeHidden();
}
async function cancel(page){await page.locator('#parent-pin-dialog [data-pin-cancel]').last().click();}
async function controls(page){return page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'parent-controls-v1')),prefix);}

test.use({viewport:{width:390,height:844}});

test('first-use setup is optional, can be skipped, and stays available in Grown-ups',async({page})=>{
  await page.goto('/');await expect(page.locator('#kid-safe-onboarding')).toBeVisible();
  await page.locator('#kid-safe-skip').click();await page.reload();await expect(page.locator('#kid-safe-onboarding')).toBeHidden();
  await page.locator('#card-draw').click();await page.locator('.draw-back').click();await expect(page.locator('#home-screen')).toBeVisible();await expect(page.locator('#parent-pin-dialog')).toBeHidden();
  await page.locator('#grownups-open').click();await expect(page.locator('#parent-kid-safe')).not.toBeChecked();
  await page.locator('#parent-kid-safe').check();await cancel(page);await expect(page.locator('#parent-kid-safe')).not.toBeChecked();
});

test('cancelled setup preserves the offer; successful setup saves PIN and recovery without leaving an adult session unlocked',async({page})=>{
  await page.goto('/');await page.locator('#kid-safe-setup').click();await cancel(page);await expect(page.locator('#kid-safe-onboarding')).toBeVisible();
  await page.locator('#kid-safe-setup').click();await page.locator('#parent-pin-input').fill(pin);await page.locator('#parent-pin-confirm').fill('1111');await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-error')).toContainText('do not match');
  await page.locator('#parent-pin-confirm').fill(pin);await page.locator('#parent-pin-submit').click();await expect(page.locator('.parent-recovery-code')).toBeVisible();await page.getByRole('button',{name:'I saved the code'}).click();
  expect(await controls(page)).toMatchObject({kidSafe:true,lockSettings:true});await expect(page.locator('#kid-safe-onboarding')).toBeHidden();
  await page.locator('#grownups-open').click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();await cancel(page);
  await page.reload();await expect(page.locator('#kid-safe-onboarding')).toBeHidden();await page.locator('#card-draw').click();await page.locator('.draw-back').click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();
});

test('failed setup storage never claims that kid-safe play was enabled',async({page})=>{
  await page.goto('/');await page.locator('#kid-safe-setup').click();await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('full');};});
  await page.locator('#parent-pin-input').fill(pin);await page.locator('#parent-pin-confirm').fill(pin);await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-error')).toContainText('could not save');await cancel(page);
  await expect(page.locator('body')).toHaveAttribute('data-kid-safe','false');await expect(page.locator('#kid-safe-onboarding')).toBeVisible();
});

for(const [route,back] of [['draw','.draw-back'],['uppercase','.learn-back'],['shape-match','.discover-back'],['compare','#challenges-view [aria-label="Back to activities"]'],['size-order','.adventure-back'],['sound-match','#listening-view [aria-label="Back to activities"]'],['mirror-mosaic','.studio-back']]){
  test(`${route}: returning to the menu requires a fresh PIN and cancellation keeps the activity`,async({page})=>{
    await seed(page);await page.goto('/#'+route);await page.locator(back).click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();await expect(page.locator('body')).toHaveAttribute('data-activity',route);
    await page.locator('#parent-pin-input').fill('0000');await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-error')).toContainText('did not match');await cancel(page);
    await expect(page.locator('body')).toHaveAttribute('data-activity',route);await page.locator(back).click();await unlock(page);await expect(page.locator('#home-screen')).toBeVisible();
    await page.evaluate(route=>{location.hash=route;},route);await page.locator(back).click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();
  });
}

test('Back, empty and unknown home hashes cannot bypass the PIN',async({page})=>{
  await seed(page);await page.goto('/');await page.locator('#card-draw').click();await page.goBack();await expect(page.locator('#parent-pin-dialog')).toBeVisible();await cancel(page);await expect(page.locator('.draw-canvas')).toBeVisible();
  for(const hash of ['#home','','#unknown','#main-content']){
    await page.evaluate(hash=>{location.hash=hash;},hash);await expect(page.locator('#parent-pin-dialog')).toBeVisible();await cancel(page);await expect(page.locator('.draw-canvas')).toBeVisible();
  }
});

test('Forward to an earlier approved Home still requires a new PIN',async({page})=>{
  await seed(page);await page.goto('/#draw');await page.locator('.draw-back').click();await unlock(page);await expect(page.locator('#home-screen')).toBeVisible();
  await page.goBack();await expect(page.locator('.draw-canvas')).toBeVisible();
  await page.goForward();await expect(page.locator('#parent-pin-dialog')).toBeVisible();await cancel(page);await expect(page.locator('.draw-canvas')).toBeVisible();
});

test('cancelled exits preserve drawing pixels and undo; drawing modes remain usable',async({page})=>{
  await seed(page);await page.goto('/#draw');const canvas=page.locator('.draw-canvas');await canvas.click({position:{x:70,y:70}});const art=await canvas.evaluate(el=>el.toDataURL());
  await page.locator('.draw-back').click();await cancel(page);expect(await canvas.evaluate(el=>el.toDataURL())).toBe(art);await expect(page.locator('.draw-undo')).toBeEnabled();
  await page.locator('[data-activity-mode="coloring"]').click();await expect(page.locator('#parent-pin-dialog')).toBeHidden();await expect(page.locator('body')).toHaveAttribute('data-activity','coloring');
});

for(const native of [false,true]){
  test(`${native?'native':'browser'}: locked exports and websites never leave the app`,async({page})=>{
    await seed(page,{native});await page.goto('/#draw');await page.locator('.draw-save').click();await expect(page.locator('#app-notice')).toContainText('keeps sharing and websites closed');await expect(page.locator('#parent-gate')).toBeHidden();await expect(page.locator('.draw-export-dialog')).toBeHidden();expect(await page.evaluate(()=>window.outside)).toEqual([]);
    await page.locator('.draw-back').click();await unlock(page);await page.locator('.home-footer [data-open-info="support"]').click();await page.getByRole('button',{name:'Visit support website'}).click();expect(await page.evaluate(()=>window.outside)).toEqual([]);await expect(page.locator('#parent-gate')).toBeHidden();
  });
}

test('kid-safe settings override an unlocked difficulty choice; disabling it restores existing share checks',async({page})=>{
  await seed(page);await page.goto('/');await page.locator('[data-age="8"]').click();await expect(page.locator('#parent-pin-dialog')).toBeVisible();await cancel(page);
  await page.locator('#grownups-open').click();await unlock(page);await page.locator('#parent-kid-safe').uncheck();await expect(page.locator('#parent-kid-safe')).not.toBeChecked();await page.locator('#settings-done').click();
  expect((await controls(page)).kidSafe).toBe(false);await page.locator('#card-draw').click();await page.locator('.draw-save').click();await expect(page.locator('#parent-gate')).toBeVisible();
});

test('recovery clears kid-safe controls without deleting drawing data',async({page})=>{
  await seed(page);await page.goto('/#draw');const canvas=page.locator('.draw-canvas');await canvas.click({position:{x:70,y:70}});const art=await canvas.evaluate(el=>el.toDataURL());await page.locator('.draw-back').click();
  await page.locator('#parent-pin-recover').click();await page.locator('#parent-pin-input').fill(recovery);await page.locator('#parent-pin-submit').click();await expect(page.locator('#parent-pin-dialog')).toBeHidden();expect((await controls(page)).kidSafe).toBe(false);expect(await canvas.evaluate(el=>el.toDataURL())).toBe(art);
  await page.locator('.draw-back').click();await expect(page.locator('#home-screen')).toBeVisible();
});

test('backgrounding and newer navigation invalidate slow exit validation',async({page})=>{
  await seed(page);await page.goto('/#draw');await page.locator('.draw-back').click();await page.locator('#parent-pin-input').fill(pin);
  await page.evaluate(()=>{document.querySelector('#parent-pin-form').requestSubmit();dispatchEvent(new Event('doodle-native-inactive'));});await expect(page.locator('#parent-pin-dialog')).toBeHidden();await expect(page.locator('.draw-canvas')).toBeVisible();
  await page.locator('.draw-back').click();await page.locator('#parent-pin-input').fill(pin);await page.evaluate(()=>{document.querySelector('#parent-pin-form').requestSubmit();location.hash='coloring';});await expect(page.locator('body')).toHaveAttribute('data-activity','coloring');await expect(page.locator('#parent-pin-dialog')).toBeHidden();
});

test('Guided Access help is offline, honest about device restrictions and fits a small screen',async({page,context})=>{
  await page.setViewportSize({width:320,height:568});await page.goto('/');await context.setOffline(true);await page.locator('#kid-safe-onboarding [data-open-guided]').click();const help=page.locator('#guided-access-dialog');await expect(help).toBeVisible();await expect(help).toContainText('cannot stop the Home gesture');await expect(help).toContainText('Leave Touch on');await expect(help).toContainText('Crash Detection');expect(await help.evaluate(el=>el.scrollWidth>el.clientWidth+1)).toBe(false);
  await page.locator('#guided-access-close').click();await expect(page.locator('#kid-safe-onboarding [data-open-guided]')).toBeFocused();
});
