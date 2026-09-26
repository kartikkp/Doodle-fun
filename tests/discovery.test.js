import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiscoveryRound, discoveryConfig, makeMaze, mazeStep, mazeRoute, mazeCheckpointProgress, DISCOVERY_IDS } from '../discovery.js';

function random(seed = 1) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; }; }
const tiers = ['little', 'explorer', 'maker'];

test('every shape and color round has one valid answer and age-scaled choices', () => {
  for (const tier of tiers) for (const id of ['shape-match', 'color-match']) for (let i = 0; i < 40; i++) {
    const round = buildDiscoveryRound(id, tier, i, random(i));
    assert.equal(round.choices.length, discoveryConfig(tier).choices);
    assert.equal(new Set(round.choices.map(item => item.id)).size, round.choices.length);
    assert.equal(round.choices.filter(item => item.id === round.answer).length, 1);
    assert.equal(round.target.id, round.answer);
    assert.ok(round.choices.every(item => item.name && (item.svg || item.color)));
    if (id === 'shape-match' && tier === 'little') assert.ok(['circle', 'square', 'triangle'].includes(round.target.id));
  }
});

test('patterns repeat exactly and advance from AB to longer repeating units', () => {
  for (const tier of [3,6,8]) for (let index = 0; index < 24; index++) {
    const round = buildDiscoveryRound('patterns', tier, index, random(index));
    assert.ok(round.sequence.length >= round.repeat.length * 2);
    round.sequence.forEach((token, i) => assert.equal(token.id, round.repeat[i % round.repeat.length].id));
    assert.equal(round.answer, round.repeat[round.sequence.length % round.repeat.length].id);
    assert.equal(round.choices.filter(token => token.id === round.answer).length, 1);
    if (tier === 3) { assert.equal(round.repeat.length, 2); assert.notEqual(round.repeat[0].id, round.repeat[1].id); }
  }
  assert.equal(buildDiscoveryRound('patterns', 'explorer', 1, random()).repeat.length, 3);
  assert.equal(buildDiscoveryRound('patterns', 8, 2, random()).repeat.length, 4);
});

test('sorting gives each picture one meaningful category and multiple items per basket', () => {
  for (const tier of tiers) {
    const round = buildDiscoveryRound('sorting', tier, 0, random());
    assert.equal(round.categories.length, discoveryConfig(tier).sortCategories);
    assert.equal(new Set(round.items.map(item => item.id)).size, round.items.length);
    for (const item of round.items) assert.equal(round.categories.filter(category => category.id === item.category).length, 1);
    for (const category of round.categories) assert.equal(round.items.filter(item => item.category === category.id).length, discoveryConfig(tier).sortItemsEach);
  }
  assert.deepEqual(buildDiscoveryRound('sorting', 'maker', 0, random()).categories.map(c => c.id), ['land', 'air', 'water']);
});

test('odd-one-out has precisely one item different in the stated property', () => {
  for (const tier of tiers) for (let i = 0; i < 20; i++) {
    const round = buildDiscoveryRound('odd-one-out', tier, i, random(i));
    const different = round.choices.filter(item => item.value.id !== round.same.id);
    assert.equal(different.length, 1);
    assert.equal(different[0].id, round.answer);
    assert.notEqual(round.same.id, round.different.id);
    assert.equal(round.choices.length, discoveryConfig(tier).oddCount);
  }
});

test('memory scales to 2/4/6 pairs with unique cards and exactly two of each relationship', () => {
  for (const tier of tiers) for (let index = 0; index < 20; index++) {
    const round = buildDiscoveryRound('memory', tier, index, random(index));
    assert.equal(round.pairs, discoveryConfig(tier).memoryPairs);
    assert.equal(round.cards.length, round.pairs * 2);
    assert.equal(new Set(round.cards.map(card => card.key)).size, round.cards.length);
    for (const id of new Set(round.cards.map(card => card.id))) assert.equal(round.cards.filter(card => card.id === id).length, 2);
  }
});

test('every maze is connected, reciprocal, on-grid, and has a reachable distant goal', () => {
  for (const tier of tiers) for (let seed = 0; seed < 40; seed++) {
    const maze = buildDiscoveryRound('maze', tier, 0, random(seed));
    assert.equal(maze.size, discoveryConfig(tier).mazeSize);
    assert.equal(maze.cells.length, maze.size ** 2);
    const seen = new Set([maze.start]), queue = [[maze.start, 0]], distances = new Map([[maze.start, 0]]);
    for (let i = 0; i < queue.length; i++) {
      const [cell, distance] = queue[i];
      for (const next of maze.cells[cell]) {
        assert.ok(maze.cells[next].includes(cell));
        assert.equal(Math.abs(cell % maze.size - next % maze.size) + Math.abs(Math.floor(cell / maze.size) - Math.floor(next / maze.size)), 1);
        if (!seen.has(next)) { seen.add(next); distances.set(next, distance + 1); queue.push([next, distance + 1]); }
      }
    }
    assert.equal(seen.size, maze.size ** 2);
    assert.equal(maze.cells.flat().length / 2, maze.cells.length - 1);
    assert.equal(distances.get(maze.goal), Math.max(...distances.values()));
    assert.ok(distances.get(maze.goal) >= maze.size);
  }
});

test('maze movement cannot teleport or cross a wall and leaves prior path intact', () => {
  const maze = makeMaze(4, random()), path = [maze.start];
  const neighbor = maze.cells[maze.start][0], nonneighbor = maze.cells.findIndex((_, i) => !maze.cells[maze.start].includes(i));
  assert.equal(mazeStep(maze, path, nonneighbor), path);
  assert.equal(mazeStep(maze, path, -1), path);
  assert.equal(mazeStep(maze, path, NaN), path);
  assert.deepEqual(mazeStep(maze, path, neighbor), [0, neighbor]);
  assert.deepEqual(path, [0]);
});

test('all seven advertised discovery identifiers have generators; unknown routes fail clearly', () => {
  assert.equal(DISCOVERY_IDS.length, 7);
  DISCOVERY_IDS.forEach(id => assert.equal(buildDiscoveryRound(id, 'little', 0, random()).id, id));
  assert.throws(() => buildDiscoveryRound('missing'), /Unknown discovery activity/);
});

test('nine exact-age configurations stay finite and every generator supports them',()=>{
  const signatures=new Set();
  for(let age=2;age<=10;age++){
    const config=discoveryConfig(age);signatures.add(JSON.stringify(config));
    for(const [key,value] of Object.entries(config))if(key!=='tier')assert.ok(Number.isSafeInteger(value)&&value>0,`${age}:${key}`);
    for(const id of DISCOVERY_IDS){const round=buildDiscoveryRound(id,age,1,random(age));assert.equal(round.age,age);if(round.choices)assert.equal(round.choices.filter(item=>item.id===round.answer).length,1);}
  }
  assert.equal(signatures.size,9);
});


test('older number patterns vary rules and missing position, with one answer that fits every step',()=>{
  for(const age of [9,10]) {
    const positions=new Set(),rules=new Set(),answers=new Set();
    for(let index=0;index<54;index++) {
      const q=buildDiscoveryRound('patterns',age,index,random(index));
      assert.equal(q.kind,'number-rule');positions.add(q.missingIndex);rules.add(q.rule);answers.add(q.answer);
      assert.equal(q.values.length,7);assert.equal(q.sequence[q.missingIndex].id,q.answer);
      assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c=>c.id)).size,4);
      assert.equal(q.choices.filter(c=>c.id===q.answer).length,1);
      assert.ok(q.values.every(n=>Number.isSafeInteger(n)&&n>0&&n<1000));
      assert.notEqual(q.target.text,q.sequence[0].text,'Copying the first visible number cannot solve the new puzzle.');
      const differences=q.values.slice(1).map((n,i)=>n-q.values[i]);
      if(age===9&&index%3===0)assert.ok(differences.every(n=>n===differences[0]));
      if(age===9&&index%3===1)assert.ok(q.values.slice(1).every((n,i)=>n===q.values[i]*2));
      if(age===9&&index%3===2)assert.ok(differences.every((n,i)=>n===(i%2===0?differences[0]:2)));
      if(age===10&&index%3===0)assert.ok(differences.every((n,i)=>n===(i%2===0?differences[0]:-2)));
      if(age===10&&index%3===1)assert.deepEqual(differences,[2,3,4,5,6,7]);
      if(age===10&&index%3===2)assert.ok(q.values.slice(1).every((n,i)=>n===(i%2===0?q.values[i]*2:q.values[i]-3)));
    }
    assert.equal(positions.size,3);assert.ok(rules.size>=3);assert.ok(answers.size>=20);
  }
});

test('older memory uses six unambiguous equivalent-value pairs, not identical pictures',()=>{
  const value=text=>text.includes('×')?text.split('×').map(Number).reduce((a,b)=>a*b):text.includes('/')?text.split('/').map(Number).reduce((a,b)=>a/b):Number(text);
  for(const age of [9,10])for(let index=0;index<30;index++){
    const q=buildDiscoveryRound('memory',age,index,random(index));
    assert.equal(q.relation,age===9?'products':'fractions');assert.equal(q.cards.length,12);
    const values=new Set();
    for(const id of new Set(q.cards.map(c=>c.id))){
      const [a,b]=q.cards.filter(c=>c.id===id);assert.notEqual(a.text,b.text);assert.equal(value(a.text),value(b.text));
      assert.ok(!values.has(value(a.text)),'Different pairs cannot share a numerical value.');values.add(value(a.text));
      assert.match(a.meaning,/ = /);assert.equal(a.meaning,b.meaning);
    }
    assert.equal(values.size,6);
  }
});

test('older maze checkpoints are distinct, ordered, reachable, undoable and bounded',()=>{
  for(const age of [9,10])for(let seed=0;seed<100;seed++){
    const q=buildDiscoveryRound('maze',age,seed,random(seed));
    assert.equal(q.checkpoints.length,age-8);assert.equal(new Set(q.checkpoints).size,q.checkpoints.length);
    assert.ok(q.checkpoints.every(n=>n!==q.start&&n!==q.goal));
    let path=[q.start];
    for(let i=0;i<q.checkpoints.length;i++){
      const route=mazeRoute(q,path.at(-1),q.checkpoints[i]);assert.ok(route.length>1);
      path.push(...route.slice(1));assert.equal(mazeCheckpointProgress(q,path),i+1);
      assert.equal(mazeCheckpointProgress(q,path.slice(0,-1)),i,'Undo reverses the newly reached checkpoint.');
    }
    path.push(...mazeRoute(q,path.at(-1),q.goal).slice(1));
    assert.equal(path.at(-1),q.goal);assert.equal(mazeCheckpointProgress(q,path),q.checkpoints.length);assert.ok(path.length<=106);
    assert.equal(mazeCheckpointProgress(q,[q.start]),0);
    if(age===10)assert.equal(mazeCheckpointProgress(q,mazeRoute(q,q.start,q.checkpoints[1])),0,'Visiting checkpoint2 before1 earns no credit.');
  }
  for(let age=2;age<=8;age++)assert.equal(buildDiscoveryRound('maze',age,0,random()).checkpoints,undefined);
});
