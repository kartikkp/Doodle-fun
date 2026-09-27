import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudioRound,studioConfig,mirrorSource,setMirrorTile,mirrorComplete,addBalanceWeight,balanceTotals,balanceComplete,pourTransfer,solvePour,measureLabel,normalizeBeatPattern,beatEvents} from '../studio-play.js';

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
  test(`studio age ${age}: balances accept equivalent combinations without changing starting weights`,()=>{
    for(let index=0;index<6;index++){
      const round=buildStudioRound('balance-lab',age,index),pans=[round.fixed.map(piece=>({...piece,fixed:true})),[]];let units=pans;
      assert.equal(balanceComplete(pans),false);
      for(let unit=0;unit<round.target;unit++)units=addBalanceWeight(round,units,1,1);
      assert.equal(balanceComplete(units),true);assert.deepEqual(balanceTotals(units),[round.target,round.target]);assert.deepEqual(units[0],pans[0]);
      if(round.weights.includes(2)){let alternate=addBalanceWeight(round,pans,1,2);for(let unit=2;unit<round.target;unit++)alternate=addBalanceWeight(round,alternate,1,1);assert.equal(balanceComplete(alternate),true);assert.notDeepEqual(alternate[1],units[1]);}
      if(round.mystery)assert.equal(round.fixed[0].value,round.mystery);
    }
  });
  test(`studio age ${age}: measured pours are solvable and conserve integer water units`,()=>{
    for(let index=0;index<6;index++){
      const round=buildStudioRound('measure-pour',age,index),moves=solvePour(round);assert.ok(moves?.length,'a nontrivial solution exists');let amounts=round.initial;
      for(const [from,to]of moves){const before=[...amounts];amounts=pourTransfer(round,amounts,from,to);assert.equal(amounts.reduce((a,b)=>a+b),round.initial[0]);assert.ok(amounts.every((amount,i)=>Number.isInteger(amount)&&amount>=0&&amount<=round.capacities[i]));assert.deepEqual(before.reduce((a,b)=>a+b),round.initial[0]);}
      assert.equal(amounts[round.targetJug],round.target);assert.strictEqual(pourTransfer(round,amounts,0,0),amounts);
    }
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
