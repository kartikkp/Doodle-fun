import {test,expect} from '@playwright/test';

const paper=page=>page.locator('.draw-canvas');
const snapshot=page=>paper(page).evaluate(node=>node.toDataURL());
async function start(page,age=10){await page.setViewportSize({width:820,height:1180});await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto'})),age);await page.goto('/#draw');await expect(paper(page)).toBeVisible();}
async function tools(page){await page.getByRole('button',{name:'More art supplies',exact:true}).click();}
async function choose(page,tool){await tools(page);await page.locator(`[data-tool="${tool}"]`).click();}
async function stroke(page,from=[.2,.3],to=[.4,.6]){const b=await paper(page).boundingBox();await page.mouse.move(b.x+b.width*from[0],b.y+b.height*from[1]);await page.mouse.down();await page.mouse.move(b.x+b.width*to[0],b.y+b.height*to[1],{steps:9});await page.mouse.up();}
async function pixel(page,x,y){return paper(page).evaluate((node,[x,y])=>[...node.getContext('2d').getImageData(Math.round(node.width*x),Math.round(node.height*y),1,1).data],[x,y]);}

for(const age of [3,6,10])test(`age ${age}: richer supplies preserve the four foundation tools`,async({page})=>{
  await start(page,age);for(const tool of ['pen','eraser','fill','stamp'])await expect(page.locator(`[data-tool="${tool}"]`)).toBeVisible();
  await tools(page);for(const tool of ['marker','ellipse','rectangle']){if(age>=5)await expect(page.locator(`[data-tool="${tool}"]`)).toBeVisible();else await expect(page.locator(`[data-tool="${tool}"]`)).toBeHidden();}
  if(age>=8){await expect(page.locator('[data-tool="line"]')).toBeVisible();await expect(page.getByLabel('Stroke opacity',{exact:true})).toBeVisible();}else await expect(page.locator('[data-tool="line"]')).toBeHidden();
  await expect(page.getByLabel('Pencil only on paper',{exact:true})).toBeVisible();
  for(const control of await page.locator('.draw-extra-dialog button:visible').all()){const box=await control.boundingBox();expect(box.width).toBeGreaterThanOrEqual(48);expect(box.height).toBeGreaterThanOrEqual(48);}
});

test('rectangle preview leaves one shape and one exact undo action',async({page})=>{
  await start(page);const blank=await snapshot(page);await choose(page,'rectangle');await stroke(page,[.2,.25],[.7,.65]);
  expect(await pixel(page,.2,.45)).not.toEqual([255,255,255,255]);expect(await pixel(page,.4,.4)).toEqual([255,255,255,255]);
  const shape=await snapshot(page);await page.getByRole('button',{name:'Undo last action',exact:true}).click();expect(await snapshot(page)).toBe(blank);
  await page.getByRole('button',{name:'Redo last action',exact:true}).click();expect(await snapshot(page)).toBe(shape);
});

test('translucent mirrored line stays uniform and undo restores both halves',async({page})=>{
  await start(page);await tools(page);await page.getByLabel('Stroke opacity',{exact:true}).evaluate(node=>{node.value='50';node.dispatchEvent(new Event('input',{bubbles:true}));});await page.getByRole('button',{name:'Mirror drawing',exact:true}).click();await page.locator('[data-tool="line"]').click();
  const blank=await snapshot(page);await stroke(page,[.2,.3],[.2,.7]);
  const left=await pixel(page,.2,.5),right=await pixel(page,.8,.5);expect(left).toEqual(right);expect(left[1]).toBeGreaterThan(160);expect(left[1]).toBeLessThan(200);
  await page.getByRole('button',{name:'Undo last action',exact:true}).click();expect(await snapshot(page)).toBe(blank);
  await page.getByRole('button',{name:'Redo last action',exact:true}).click();expect(await pixel(page,.2,.5)).toEqual(left);
});

// Synthetic events exercise the input policy in both engines. Real Pencil
// pressure and platform palm rejection are a separate physical-iPad check.
async function inputs(page,events){await paper(page).evaluate((node,events)=>{node.setPointerCapture=()=>{};const b=node.getBoundingClientRect();for(const {type,x,y,id=1,kind='pen',pressure=.5} of events)node.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:kind,isPrimary:true,button:0,buttons:type==='pointerup'?0:1,pressure,clientX:b.x+b.width*x,clientY:b.y+b.height*y,bubbles:true}));},events);}
test('Pencil-only ignores a palm arriving first while pen pressure and cancellation still work',async({page})=>{
  await start(page);await tools(page);await page.getByLabel('Pencil only on paper',{exact:true}).check();await page.getByRole('button',{name:'Close art supplies',exact:true}).click();const blank=await snapshot(page);
  await inputs(page,[{type:'pointerdown',kind:'touch',id:9,x:.7,y:.2},{type:'pointermove',kind:'touch',id:9,x:.7,y:.8}]);expect(await snapshot(page)).toBe(blank);
  await inputs(page,[{type:'pointerdown',x:.2,y:.3,pressure:.1},{type:'pointermove',x:.4,y:.3,pressure:.1},{type:'pointercancel',x:.4,y:.3,pressure:.1}]);
  await inputs(page,[{type:'pointerdown',id:2,x:.2,y:.6,pressure:1},{type:'pointermove',id:2,x:.4,y:.6,pressure:1},{type:'pointerup',id:2,x:.4,y:.6,pressure:1}]);
  const widths=await paper(page).evaluate(node=>{const c=node.getContext('2d');return [.3,.6].map(y=>{let n=0;for(let i=-40;i<=40;i++){const p=c.getImageData(node.width*.3,node.height*y+i,1,1).data;if(p[1]<240)n++;}return n;});});expect(widths[1]).toBeGreaterThan(widths[0]*1.8);
  expect(await pixel(page,.7,.5)).toEqual([255,255,255,255]);await expect(page.getByRole('button',{name:'Undo last action',exact:true})).toBeEnabled();
});

test('coalesced pen samples include the bend instead of shortcutting across it',async({page})=>{
  await start(page);await inputs(page,[{type:'pointerdown',x:.2,y:.2}]);
  await paper(page).evaluate(node=>{const b=node.getBoundingClientRect(),eventAt=(x,y)=>new PointerEvent('pointermove',{pointerId:1,pointerType:'pen',pressure:.5,clientX:b.x+b.width*x,clientY:b.y+b.height*y});const last=eventAt(.7,.7);Object.defineProperty(last,'getCoalescedEvents',{value:()=>[eventAt(.2,.7),last]});node.dispatchEvent(last);});
  await inputs(page,[{type:'pointerup',x:.7,y:.7}]);expect(await pixel(page,.2,.5)).not.toEqual([255,255,255,255]);expect(await pixel(page,.45,.45)).toEqual([255,255,255,255]);
});
