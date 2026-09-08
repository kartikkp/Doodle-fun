import {test,expect} from '@playwright/test';
import {DISCOVERY_IDS} from '../discovery.js';
test.use({hasTouch:true,viewport:{width:375,height:812}});
for(let age=2;age<=10;age++)for(const id of DISCOVERY_IDS){
  test(`age ${age}: ${id} hint, incorrect attempt, recovery and next`,async({page})=>{
    await page.addInitScript(value=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:value,level:'auto',sound:false})),age);
    await page.goto(`/#${id}`);await expect(page.locator('.discover-title')).toBeVisible();
    const hint=async()=>{await page.locator('.discover-hint').tap();await expect(page.locator('.discover-status')).toHaveClass(/is-hint/);};
    if(['shape-match','color-match','patterns','odd-one-out'].includes(id)){
      let answer;
      if(id==='shape-match'||id==='color-match')answer=id==='shape-match'?'circle':'red';
      else if(id==='patterns')answer=(await page.locator('.discover-pattern-token').first().getAttribute('aria-label')).split(': ')[1];
      else answer='0';
      const correct=id==='patterns'?page.getByRole('button',{name:answer,exact:true}):page.locator(`[data-choice="${answer}"]`);
      const value=await correct.getAttribute('data-choice');await page.locator(`[data-choice]:not([data-choice="${value}"])`).first().tap();
      await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);await hint();await correct.tap();
    }else if(id==='sorting'){
      await hint();await page.locator('.is-hint[data-item]').tap();await hint();await page.locator('[data-category]:not(.is-hint)').first().tap();await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
      for(let i=0;i<14&&!(await page.locator('.discover-next.is-ready').count());i++){await hint();if(await page.locator('[data-item][aria-pressed="true"]').count()===0)await page.locator('.is-hint[data-item]').tap();await hint();await page.locator('.is-hint[data-category]').tap();}
    }else if(id==='memory'){
      await hint();await page.locator('[data-card]:enabled:not(.is-hint)').first().tap();await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);await hint();await page.locator('.discover-memory-hide').tap();
      for(let i=0;i<7&&!(await page.locator('.discover-next.is-ready').count());i++){await hint();await page.locator('.is-hint[data-card]').tap();}
    }else{
      await page.locator('[data-cell="0"]').tap();await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
      for(let i=0;i<36&&!(await page.locator('.discover-next.is-ready').count());i++){await hint();await page.locator('.is-hint[data-cell]').tap();}
    }
    await expect(page.locator('.discover-next')).toHaveClass(/is-ready/);await expect(page.locator('.discover-status')).toHaveClass(/is-success/);
    await page.locator('.discover-restart').tap();await expect(page.locator('.discover-next')).not.toHaveClass(/is-ready/);
    await page.locator('.discover-next').tap();await expect(page.locator('.discover-level')).toContainText('round 2');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  });
}
