import {test,expect} from '@playwright/test';

test.use({hasTouch:true,viewport:{width:375,height:812}});
async function open(page,id,age){
  await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
  await page.goto(`/#${id}`);await expect(page.locator('.discover-title')).toBeVisible();
}
async function layout(page){
  const measurement=await page.locator('#discovery-view').evaluate(view=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...view.querySelectorAll('button')].map(b=>b.getBoundingClientRect()).filter(r=>r.width>0).map(r=>[r.width,r.height])}));
  expect(measurement.overflow).toBe(false);
  for(const [width,height]of measurement.buttons){expect(width).toBeGreaterThanOrEqual(47.5);expect(height).toBeGreaterThanOrEqual(47.5);}
}
function route(cells,start,goal){const queue=[[start]],seen=new Set([start]);for(let i=0;i<queue.length;i++){const path=queue[i],cell=path.at(-1);if(cell===goal)return path;for(const next of cells[cell].neighbors)if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}}throw new Error('Unreachable maze objective');}

for(const age of [9,10]){
  test(`age ${age}: infer varied number rules, retry, hint, replay and advance`,async({page})=>{
    await page.setViewportSize({width:320,height:568});await open(page,'patterns',age);
    await expect(page.locator('.discover-status')).toHaveText('Find the number that fits the rule.');
    const examples=age===9?[
      ['4','7','?','13','16','19','22','10'],['5','10','?','40','80','160','320','20'],
      ['6','11','?','18','20','25','27','13'],['7','13','19','25','?','37','43','31'],
    ]:[
      ['4','9','?','12','10','15','13','7'],['5','7','?','14','19','25','32','10'],
      ['6','12','?','18','15','30','27','9'],['7','15','13','21','?','27','25','19'],
    ];
    for(let i=0;i<examples.length;i++){
      const [a,b,c,d,e,f,g,answer]=examples[i];
      await expect(page.locator('.discover-pattern-token')).toHaveText([a,b,c,d,e,f,g]);
      await expect(page.locator('.discover-objective')).toHaveText('Which number is missing?');
      const target=page.getByRole('button',{name:answer,exact:true});
      await page.locator('[data-choice]').filter({hasNotText:answer}).first().tap();
      await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);await expect(page.locator('.discover-next')).not.toHaveClass(/is-ready/);
      await page.locator('.discover-hint').tap();await expect(page.locator('.discover-status')).toContainText('Rule:');
      await expect(page.locator('.discover-status')).toContainText(`missing number is ${answer}.`);
      await expect(page.locator('.discover-next')).not.toHaveClass(/is-ready/);
      await target.tap();await expect(page.locator('.discover-status')).toHaveClass(/is-success/);
      await expect(page.locator('.discover-round-count')).toHaveText(`${i+1} ${i?'discoveries':'discovery'} made`);
      if(i===0){await page.locator('.discover-restart').tap();await target.tap();await expect(page.locator('.discover-round-count')).toHaveText('1 discovery made');}
      await layout(page);await page.locator('.discover-next').tap();await expect(page.locator('.discover-level')).toContainText(`round ${i+2}`);
    }
    await page.setViewportSize({width:844,height:390});await layout(page);
  });

  test(`age ${age}: memory matches values rather than identical cards`,async({page})=>{
    await page.setViewportSize({width:320,height:568});await open(page,'memory',age);
    await expect(page.locator('.discover-objective')).toContainText(age===9?'multiplication':'fractions');
    await page.locator('.discover-hint').tap();
    await page.locator('[data-card]:enabled:not(.is-hint)').first().tap();
    await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);await expect(page.locator('.discover-memory-card.is-open')).toHaveCount(2);
    await page.locator('.discover-memory-hide').tap();await expect(page.locator('.discover-memory-card.is-open')).toHaveCount(0);
    for(let i=0;i<6;i++){
      await page.locator('.discover-hint').tap();
      const first=(await page.locator('.discover-memory-card.is-open:not(.is-matched) .discover-number').textContent()).trim();
      const partner=page.locator('.is-hint[data-card]');await partner.tap();
      const faces=await page.locator('.discover-memory-card.is-matched .discover-number').allTextContents();
      expect(faces).toHaveLength((i+1)*2);
      const value=text=>text.includes('×')?text.split('×').map(Number).reduce((a,b)=>a*b):text.includes('/')?text.split('/').map(Number).reduce((a,b)=>a/b):Number(text);
      expect(faces.filter(face=>value(face)===value(first))).toHaveLength(2);
      expect(new Set(faces).size).toBe(faces.length);
    }
    await expect(page.locator('.discover-next')).toHaveClass(/is-ready/);await layout(page);
    const markersClear=await page.locator('.discover-memory-card.is-matched').evaluateAll(cards=>cards.every(card=>{const value=card.querySelector('.discover-number').getBoundingClientRect(),tick=card.querySelector('.discover-tick').getBoundingClientRect();return tick.bottom<=value.top||tick.left>=value.right||tick.right<=value.left;}));
    expect(markersClear).toBe(true);
    await page.locator('.discover-restart').tap();await expect(page.locator('[data-card]:enabled')).toHaveCount(12);await expect(page.locator('.discover-round-count')).toHaveText('1 discovery made');
    await page.locator('.discover-next').tap();await expect(page.locator('.discover-level')).toContainText('round 2');
    await page.setViewportSize({width:844,height:390});await layout(page);
  });

  test(`age ${age}: maze requires ordered checkpoints and supports undo without duplicate credit`,async({page})=>{
    test.setTimeout(90000);
    await page.setViewportSize({width:320,height:568});await open(page,'maze',age);
    await expect(page.locator('.discover-status')).toHaveText('Visit each checkpoint in order, then find the carrot.');
    const cells=await page.locator('[data-cell]').evaluateAll(nodes=>nodes.map(n=>({cell:Number(n.dataset.cell),neighbors:n.dataset.neighbors.split(',').map(Number),goal:n.dataset.goal==='true',checkpoint:Number(n.dataset.checkpoint)||0})));
    const checkpoints=cells.filter(c=>c.checkpoint).sort((a,b)=>a.checkpoint-b.checkpoint).map(c=>c.cell),goal=cells.find(c=>c.goal).cell;
    expect(checkpoints).toHaveLength(age-8);expect(cells).toHaveLength(36);
    await page.locator('[data-cell="0"]').tap();await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
    const walk=async path=>{for(const cell of path.slice(1))await page.locator(`[data-cell="${cell}"]`).tap();};
    if(age===10){
      await walk(route(cells,0,goal));await expect(page.locator('.discover-next')).not.toHaveClass(/is-ready/);
      await expect(page.locator('.discover-status')).toContainText('before finishing at the carrot');
      await page.locator('.discover-restart').tap();
      await walk(route(cells,0,checkpoints[1]));await expect(page.locator('.discover-checkpoint.is-visited')).toHaveCount(0);await page.locator('.discover-restart').tap();
    }
    let position=0;
    for(let i=0;i<checkpoints.length;i++){
      await walk(route(cells,position,checkpoints[i]));await expect(page.locator('.discover-checkpoint.is-visited')).toHaveCount(i+1);
      await page.locator('.discover-maze-undo').tap();await expect(page.locator('.discover-checkpoint.is-visited')).toHaveCount(i);
      await page.locator('.discover-hint').tap();await expect(page.locator('.discover-status')).toContainText(`checkpoint ${i+1}`);
      await page.locator('.is-hint[data-cell]').tap();await expect(page.locator('.discover-checkpoint.is-visited')).toHaveCount(i+1);position=checkpoints[i];
    }
    await expect(page.locator('.discover-next')).not.toHaveClass(/is-ready/);
    await walk(route(cells,position,goal));await expect(page.locator('.discover-next')).toHaveClass(/is-ready/);await expect(page.locator('.discover-round-count')).toHaveText('1 discovery made');
    await page.locator('.discover-maze-undo').tap();await page.locator(`[data-cell="${goal}"]`).tap();await expect(page.locator('.discover-round-count')).toHaveText('1 discovery made');
    await layout(page);await page.locator('.discover-restart').tap();await expect(page.locator('.discover-checkpoint.is-visited')).toHaveCount(0);await expect(page.locator('[data-current="true"]')).toHaveAttribute('data-cell','0');
    await page.locator('.discover-next').tap();await expect(page.locator('.discover-level')).toContainText('round 2');
    await page.setViewportSize({width:844,height:390});await layout(page);
  });
}
