import {test,expect} from '@playwright/test';
import {STAMPS} from '../stamp-art.js';

const paper=page=>page.locator('.draw-canvas');
const snapshot=page=>paper(page).evaluate(node=>node.toDataURL());
async function paperReady(page){
  await expect(paper(page)).toBeVisible();
  await expect.poll(()=>paper(page).evaluate(node=>{
    const b=node.getBoundingClientRect(),size=Math.min(2400,Math.round(b.width*Math.min(window.devicePixelRatio||1,3)));
    return size>100&&node.width===size&&node.height===size;
  })).toBe(true);
}
async function start(page){
  await page.setViewportSize({width:820,height:1180});
  await page.goto('/#draw');await paperReady(page);
}
async function place(page,name,x=.5,y=.5){
  await page.getByRole('button',{name:'Stamps',exact:true}).click();
  await page.getByRole('button',{name:`${name} stamp`,exact:true}).click();
  const b=await paper(page).boundingBox();await page.mouse.click(b.x+b.width*x,b.y+b.height*y);
}
async function exportPNG(page){
  await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true});});
  await page.locator('.draw-save').click();await expect(page.locator('#parent-gate')).toBeVisible();
  const [a,b]=(await page.locator('#parent-question').textContent()).match(/\d+/g).map(Number);
  await page.locator('#parent-answer').fill(String(a*b));
  await page.locator('#parent-form').getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.draw-export-image')).toBeVisible();
  await expect.poll(()=>page.locator('.draw-export-image').evaluate(img=>img.naturalWidth)).toBe(1536);
}

test('all 20 vectors match their picker and exported PNG, with exact undo and redo',async({page})=>{
  test.setTimeout(120000);await start(page);
  await page.getByRole('button',{name:/^Medium brush,/}).click();
  await paper(page).evaluate(node=>{
    window.stampTestPoints=[];
    node.addEventListener('pointerdown',event=>{const b=node.getBoundingClientRect();window.stampTestPoints.push({x:(event.clientX-b.x)*1536/b.width,y:(event.clientY-b.y)*1536/b.height});});
  });
  const brush=Number((await page.locator('.draw-size[aria-pressed="true"]').getAttribute('aria-label')).match(/\d+$/)[0]);
  const blank=await snapshot(page),placements=[];
  for(const [i,{name}] of STAMPS.entries()){
    const x=.14+(i%5)*.18,y=.18+Math.floor(i/5)*.2;
    await page.getByRole('button',{name:'Stamps',exact:true}).click();
    const choice=page.getByRole('button',{name:`${name} stamp`,exact:true});
    const svg=await choice.locator('svg').evaluate(node=>node.outerHTML);
    expect(svg).not.toMatch(/<text|<image/);
    await choice.click();const before=await snapshot(page);
    const b=await paper(page).boundingBox();await page.mouse.click(b.x+b.width*x,b.y+b.height*y);
    const after=await snapshot(page);expect(after,name).not.toBe(before);
    await page.getByRole('button',{name:'Undo last action',exact:true}).click();expect(await snapshot(page)).toBe(before);
    await page.getByRole('button',{name:'Redo last action',exact:true}).click();expect(await snapshot(page)).toBe(after);
    const point=await page.evaluate(()=>window.stampTestPoints.at(-1));
    placements.push({svg,...point,size:(brush*2+30)*1536/600});
  }
  expect(await snapshot(page)).not.toBe(blank);await exportPNG(page);
  const result=await page.locator('.draw-export-image').evaluate(async(img,placements)=>{
    const actual=document.createElement('canvas');actual.width=actual.height=1536;
    const ctx=actual.getContext('2d');ctx.drawImage(img,0,0);
    const expected=document.createElement('canvas');expected.width=expected.height=1536;
    const want=expected.getContext('2d');want.fillStyle='#fff';want.fillRect(0,0,1536,1536);
    for(const {svg,x,y,size} of placements){
      const stamp=new Image();await new Promise((yes,no)=>{stamp.onload=yes;stamp.onerror=no;stamp.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;});
      want.drawImage(stamp,x-size/2,y-size/2,size,size);
    }
    const a=ctx.getImageData(0,0,1536,1536).data,b=want.getImageData(0,0,1536,1536).data;
    let different=0,max=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d)different++;max=Math.max(max,d);}
    return {max,different};
  },placements);
  // PNG premultiplication can round antialiased channels, but moved/missing
  // shapes and a platform emoji substitution must fail this pixel comparison.
  expect(result.max).toBeLessThanOrEqual(1);expect(result.different).toBeLessThan(30000);
});

test('slow stamp preparation never queues a late mark after leaving or Undo',async({page})=>{
  await page.addInitScript(()=>{
    const NativeImage=window.Image;window.heldStampLoads=[];window.heldStampImages=[];
    const source=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
    window.Image=function(...args){
      const image=new NativeImage(...args);
      Object.defineProperty(image,'src',{
        get(){return source.get.call(image);},
        set(value){if(value.startsWith('data:image/svg+xml')){window.heldStampImages.push(image);window.heldStampLoads.push(()=>source.set.call(image,value));}else source.set.call(image,value);},
      });
      return image;
    };
  });
  await start(page);const blank=await snapshot(page);await place(page,'Star');
  await expect(page.locator('.draw-draft-status')).toContainText('still preparing');
  expect(await snapshot(page)).toBe(blank);await expect(page.locator('.draw-undo')).toBeDisabled();
  await page.locator('.draw-back').click();
  await page.evaluate(()=>{for(const load of window.heldStampLoads)load();});
  await expect.poll(()=>page.evaluate(()=>window.heldStampImages.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  await page.goto('/#draw');await paperReady(page);
  expect(await snapshot(page)).toBe(blank);
  await place(page,'Star');expect(await snapshot(page)).not.toBe(blank);
});

test('legacy pixel drafts survive vector stamping, undo, reload and export',async({page})=>{
  await page.addInitScript(()=>{
    const key='doodle-fun:v2:drawing-draft-v2';if(localStorage.getItem(key))return;
    const c=document.createElement('canvas');c.width=c.height=1536;const ctx=c.getContext('2d');
    ctx.fillStyle='#337799';ctx.fillRect(120,180,200,140);
    localStorage.setItem(key,JSON.stringify({version:2,png:c.toDataURL(),name:'Earlier drawing',hasWork:true}));
  });
  await start(page);await expect(page.locator('.draw-paper-name')).toHaveText('Earlier drawing');
  const original=await snapshot(page);await place(page,'Unicorn');expect(await snapshot(page)).not.toBe(original);
  await page.locator('.draw-undo').click();expect(await snapshot(page)).toBe(original);
  await page.locator('.draw-back').click();await page.reload();await page.goto('/#draw');
  await paperReady(page);
  await expect(page.locator('.draw-paper-name')).toHaveText('Earlier drawing');expect(await snapshot(page)).toBe(original);
  await exportPNG(page);
  const pixel=await page.locator('.draw-export-image').evaluate(img=>{const c=document.createElement('canvas');c.width=c.height=1536;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return [...ctx.getImageData(200,200,1,1).data];});
  expect(pixel).toEqual([51,119,153,255]);
});
