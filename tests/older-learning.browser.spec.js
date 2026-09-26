import {test,expect} from '@playwright/test';

// Solve the displayed equation independently; do not import its generator or use
// the quantity frame's internal answer to decide which button completes a round.
function solvePrintedPrompt(prompt,id) {
  if(id==='addition') {
    const equation=prompt.match(/^(\d+(?: \+ \d+){1,2}) = \?$/);
    expect(equation,'addition shows its complete operands').not.toBeNull();
    const operands=equation[1].split(' + ').map(Number);
    return {answer:operands.reduce((sum,operand)=>sum+operand,0),numbers:operands,equation:equation[1]};
  }
  const equation=prompt.match(/^(\d+) groups of (\d+)\. How many\?$/);
  expect(equation,'equal groups shows both factors').not.toBeNull();
  const groups=Number(equation[1]),each=Number(equation[2]);
  return {answer:groups*each,numbers:[groups,each],equation:`${groups} × ${each}`};
}

for(const age of [9,10])for(const viewport of [{width:375,height:812},{width:812,height:375}]) {
  test(`age ${age} independently solves addition and groups on ${viewport.width}px phones`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
    for(const id of ['addition','equal-groups']) {
      await page.goto(`/#${id}`);
      await expect(page.locator(`[data-activity-mode="${id}"]`)).toHaveAttribute('aria-pressed','true');
      const seen=new Set();
      for(let round=0;round<3;round++) {
        const prompt=await page.locator('.learn-count-prompt').innerText(),q=solvePrintedPrompt(prompt,id),feedback=page.locator('.learn-feedback');
        expect(seen.has(prompt),'new rounds vary the actual equation').toBe(false);seen.add(prompt);
        if(id==='addition') {expect(q.answer).toBeGreaterThan(20);expect(q.numbers.every(number=>number>=10)).toBe(true);}
        else if(age===9)expect(q.numbers.every(number=>number>=4)).toBe(true);
        else expect(q.numbers[1]).toBeGreaterThanOrEqual(12);
        await expect(feedback).not.toHaveClass(/is-complete/);
        await expect(page.getByTestId('quantity-frame')).toHaveAttribute('data-quantity',String(q.answer));
        await expect(page.getByTestId('quantity-frame')).toHaveAttribute('data-representation','place-value');
        await expect(page.locator('.learn-count-dot')).toHaveCount(0);
        await expect(page.locator('.learn-place-strategy')).toBeHidden();
        await expect(page.locator('.learn-number-card')).toHaveText(id==='addition'?q.numbers.map(String):[q.equation]);
        const choices=(await page.locator('.learn-answer').allTextContents()).map(Number);
        expect(new Set(choices).size).toBe(choices.length);expect(choices.filter(value=>value===q.answer)).toHaveLength(1);
        expect(choices.filter(value=>value!==q.answer&&value%10===q.answer%10).length,'at least two alternatives require checking more than the ones digit').toBeGreaterThanOrEqual(2);
        const range=await page.locator('.learn-range strong').innerText(),max=Number(range.split('–')[1]);
        expect(choices.every(value=>Number.isInteger(value)&&value>=0&&value<=max),'all choices stay in the shown practice range').toBe(true);
        const wrong=choices.find(value=>value!==q.answer);
        await page.getByRole('button',{name:`Answer ${wrong}`,exact:true}).click();
        await expect(feedback).not.toHaveClass(/is-complete/);
        await expect(feedback).toContainText(`You chose ${wrong}.`);
        await page.getByRole('button',{name:'Show counting steps',exact:true}).click();
        await expect(page.locator('.learn-place-strategy')).toBeVisible();
        await expect(feedback).not.toHaveClass(/is-complete/);
        await page.getByRole('button',{name:`Answer ${q.answer}`,exact:true}).click();
        await expect(feedback).toHaveClass(/is-complete/);
        await expect(feedback).toContainText(`${q.equation} = ${q.answer}`);
        for(const button of await page.locator('.learn-answer').all())await expect(button).toBeDisabled();
        const layout=await page.locator('#learning-view').evaluate(screen=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,controls:[...screen.querySelectorAll('button')].filter(node=>node.getClientRects().length).map(node=>{const r=node.getBoundingClientRect();return {label:node.textContent,left:r.left,right:r.right,width:r.width,height:r.height};})}));
        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
        for(const control of layout.controls){expect(control.left,control.label).toBeGreaterThanOrEqual(0);expect(control.right,control.label).toBeLessThanOrEqual(layout.width);expect(control.width,control.label).toBeGreaterThanOrEqual(48);expect(control.height,control.label).toBeGreaterThanOrEqual(48);}
        await page.getByRole('button',{name:'Next puzzle →',exact:true}).click();
        await expect(feedback).not.toHaveClass(/is-complete/);
        await expect(page.locator('.learn-place-strategy')).toBeHidden();
      }
    }
    expect(errors).toEqual([]);
  });
}
