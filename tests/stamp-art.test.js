import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STAMPS,stampArt,prepareStampImages,stampImageReady} from '../stamp-art.js';

test('all 20 familiar stamps have distinct self-contained project vectors',()=>{
  assert.deepEqual(STAMPS.map(s=>s.name),['Star','Rainbow','Unicorn','Dog','Cat','Butterfly','Flower','Lollipop','Pizza','Celebration','Rocket','Heart','Shining star','Flame','Alien','Fox','Ice cream','Guitar','Wave','Lion']);
  assert.equal(new Set(STAMPS.map(s=>s.id)).size,20);
  assert.equal(new Set(STAMPS.map(s=>stampArt(s.id))).size,20);
  for(const {id} of STAMPS){
    const art=stampArt(id);
    assert.match(art,/<svg width="100" height="100" /);
    assert.match(art,/viewBox="0 0 100 100"/);
    assert.doesNotMatch(art,/<(?:text|image|foreignObject|script)\b|(?:href|url)\s*[=(]/i);
    assert.doesNotMatch(art,/\p{Extended_Pictographic}/u);
  }
  assert.equal(stampArt('unknown'),'');
});

test('cached stamp images need a successful decode and never fetch remote artwork',()=>{
  class Image {complete=false;naturalWidth=0;naturalHeight=0;}
  const images=prepareStampImages(Image);
  assert.equal(images.size,20);
  for(const {id} of STAMPS){
    const image=images.get(id);
    assert.equal(image.src,`data:image/svg+xml;charset=utf-8,${encodeURIComponent(stampArt(id))}`);
    assert.equal(stampImageReady(image),false);
    image.complete=true;assert.equal(stampImageReady(image),false);
    image.naturalWidth=image.naturalHeight=100;assert.equal(stampImageReady(image),true);
  }
  assert.equal(stampImageReady(undefined),false);
});

test('drawing exports contain vector stamp pixels without a platform emoji-font fallback',async()=>{
  const source=await readFile(new URL('../draw.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/Apple Color Emoji|Segoe UI Emoji|fillText\(/);
  assert.match(source,/stampImageReady\(image\)/);
  assert.match(source,/ctx\.drawImage\(image,p\.x-size\/2,p\.y-size\/2,size,size\)/);
});
