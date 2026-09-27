import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudioRound,studioConfig,mirrorSource,setMirrorTile,mirrorComplete,addBalanceWeight,balanceTotals,balanceComplete,solveBalance,pourTransfer,solvePour,measureLabel,normalizeBeatPattern,beatEvents} from '../studio-play.js';

for(let age=2;age<=10;age++){
  test(`studio age ${age}: reflection is constructible, source immutable, and free creation symmetric`,()=>{
    for(let index=0;index<6;index++){
      const round=buildStudioRound('mirror-mosaic',age,index),initial=round.solution.map((value,cell)=>round.sources.includes(cell)?value:0);let tiles=initial;
      assert.equal(mirrorComplete(round,tiles),false);
      for(let cell=0;cell<tiles.length;cell++){
        if(round.sources.includes(cell))assert.strictEqual(setMirrorTile(round,tiles,cell,0),tiles);
        else tiles=setMirrorTile(round,tiles,cell,round.solution[cell]);
      }
      assert.equal(mirrorComplete(round,tiles),true);
      const created=setMirrorTile(round,Array(tiles.length).fill(0),tiles.length-1,1,true);
      created.forEach((value,cell)=>assert.equal(value,created[mirrorSource(round.size,round.axis,cell)]));
      assert.strictEqual(setMirrorTile(round,tiles,-1,1),tiles);
    }
  });
  test(`studio age ${age}: balance equations and piece constraints have a legal solution`,()=>{
    for(let index=0;index<200;index++){
      const round=buildStudioRound('balance-lab',age,index),pans=[round.fixed.map(piece=>({...piece,fixed:true})),[]];let solution=pans;
      assert.equal(balanceComplete(pans,round),false);
      const weights=solveBalance(round);assert.ok(weights?.length,'a legal solution exists');
      for(const weight of weights)solution=addBalanceWeight(round,solution,1,weight);
      assert.equal(balanceComplete(solution,round),true);assert.deepEqual(balanceTotals(solution),[round.target,round.target]);assert.deepEqual(solution[0],pans[0]);
      if(round.clue)assert.equal(round.clue.copies*round.mystery+round.clue.extra,round.clue.total);
      if(round.pieceCount){
        assert.equal(solution[1].length,round.pieceCount);assert.strictEqual(addBalanceWeight(round,solution,1,1),solution);assert.strictEqual(addBalanceWeight(round,pans,0,1),pans);
        const repeatedUnits=[pans[0],Array.from({length:round.target},()=>({value:1}))];assert.equal(balanceComplete(repeatedUnits,round),false);
      }else{
        let units=pans;for(let unit=0;unit<round.target;unit++)units=addBalanceWeight(round,units,1,1);assert.equal(balanceComplete(units,round),true);
      }
      if(round.weightKinds)assert.equal(new Set(weights).size,round.weightKinds);
    }
  });
  test(`studio age ${age}: measured pours are solvable and conserve integer water units`,()=>{
    for(let index=0;index<12;index++){
      const round=buildStudioRound('measure-pour',age,index),moves=solvePour(round);assert.ok(moves?.length,'a nontrivial solution exists');let amounts=round.initial;
      if(age>=6)assert.ok(moves.length>=[4,6,6,8,10][age-6],`age ${age} round ${index} retains a multi-pour planning task`);
      for(const [from,to]of moves){const before=[...amounts];amounts=pourTransfer(round,amounts,from,to);assert.equal(amounts.reduce((a,b)=>a+b),round.initial[0]);assert.ok(amounts.every((amount,i)=>Number.isInteger(amount)&&amount>=0&&amount<=round.capacities[i]));assert.deepEqual(before.reduce((a,b)=>a+b),round.initial[0]);}
      assert.equal(amounts[round.targetJug],round.target);assert.strictEqual(pourTransfer(round,amounts,0,0),amounts);
    }
    const setLength=age<=3?3:age<=5?4:5,problems=Array.from({length:setLength},(_,index)=>{const round=buildStudioRound('measure-pour',age,index);return JSON.stringify([round.capacities,round.initial,round.targetJug,round.target]);});
    assert.equal(new Set(problems).size,setLength,'a practice set contains different problems');
  });
  test(`studio age ${age}: sequencer events retain rests, tempo, and track positions`,()=>{
    const round=buildStudioRound('beat-maker',age),pattern=normalizeBeatPattern(null,round),config=studioConfig(age);
    assert.equal(pattern.notes.length,config.tracks);assert.equal(pattern.notes[0].length,config.steps);
    pattern.notes[0][0]=true;pattern.notes.at(-1)[config.steps-1]=true;const events=beatEvents(round,pattern),notes=events.filter(event=>event.kind!=='rest');
    assert.equal(notes.length,2);assert.equal(notes[0].time,0);assert.equal(notes[1].step,config.steps-1);assert.equal(notes[1].kind,round.instruments.at(-1));assert.ok(events.some(event=>event.kind==='rest'&&event.step===1));
    assert.equal(normalizeBeatPattern({tempo:999,notes:[['true',true]]},round).tempo,180);assert.equal(normalizeBeatPattern({notes:[['true',true]]},round).notes[0][0],false);
  });
}
test('fraction labels represent the same conserved units without floating point rounding',()=>{
  assert.equal(measureLabel(1,2),'½');assert.equal(measureLabel(3,2),'1½');assert.equal(measureLabel(2,4),'½');assert.equal(measureLabel(7,4),'1¾');assert.equal(measureLabel(8,4),'2');
});

test('older reflection tasks use distinct coordinate transformations without hiding the model',()=>{
  assert.equal(buildStudioRound('mirror-mosaic',8).axis,'both');
  assert.equal(buildStudioRound('mirror-mosaic',9).axis,'diagonal');
  assert.equal(buildStudioRound('mirror-mosaic',10).axis,'diagonal-both');
  for(const age of [9,10])for(let index=0;index<12;index++){
    const round=buildStudioRound('mirror-mosaic',age,index),size=round.size;
    assert.ok(round.sources.length>0&&round.sources.length<size*size);
    for(let row=0;row<size;row++)for(let col=0;col<size;col++){
      assert.equal(round.solution[row*size+col],round.solution[col*size+row]);
      if(age===10)assert.equal(round.solution[row*size+col],round.solution[(size-1-col)*size+size-1-row]);
    }
  }
});
test('age ten balance rejects equal mass with the wrong number or kinds of weights',()=>{
  const round=buildStudioRound('balance-lab',10,2),left=round.fixed.map(piece=>({...piece,fixed:true}));
  assert.equal(round.target,8);
  assert.equal(balanceComplete([left,[{value:2},{value:2},{value:2},{value:2}]],round),false);
  assert.equal(balanceComplete([left,[{value:5},{value:2},{value:1}]],round),false);
  assert.equal(balanceComplete([left,[{value:5},{value:1},{value:1},{value:1}]],round),true);
});
