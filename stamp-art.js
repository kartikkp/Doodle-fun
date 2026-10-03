import {objectArt} from './activity-art.js';

// Stable names and order preserve all 20 supplies. Existing saved drawings are
// pixels and require no migration. No platform emoji artwork is copied here.
export const STAMPS = Object.freeze([
  ['star','Star'], ['rainbow','Rainbow'], ['unicorn','Unicorn'], ['dog','Dog'],
  ['cat','Cat'], ['butterfly','Butterfly'], ['flower','Flower'], ['lollipop','Lollipop'],
  ['pizza','Pizza'], ['celebration','Celebration'], ['rocket','Rocket'], ['love','Heart'],
  ['shining-star','Shining star'], ['flame','Flame'], ['alien','Alien'], ['fox','Fox'],
  ['ice-cream','Ice cream'], ['guitar','Guitar'], ['wave','Wave'], ['lion','Lion'],
].map(([id,name])=>Object.freeze({id,name})));

export function stampArt(id) {
  if(!STAMPS.some(stamp=>stamp.id===id))return '';
  // Explicit dimensions also give WebKit a dependable SVG image intrinsic size.
  return objectArt(id).replace('<svg ', '<svg width="100" height="100" ');
}

export function prepareStampImages(ImageClass=globalThis.Image) {
  const images=new Map();
  for(const {id} of STAMPS) {
    const image=new ImageClass();
    image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(stampArt(id))}`;
    images.set(id,image);
  }
  return images;
}

export function stampImageReady(image) {
  return Boolean(image?.complete && image.naturalWidth>0 && image.naturalHeight>0);
}
