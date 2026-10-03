// Bundled vector artwork. These drawings are decoration, never an answer key.
const ink='#294552', cream='#fffaf0', coral='#ed8a70', gold='#efc566', teal='#65ad9d', blue='#77a9cf', violet='#a895cd';
const path=(d,fill='none',extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const rect=(x,y,w,h,fill,rx=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const line=(x,y,a,b)=>`<path d="M${x} ${y}L${a} ${b}" fill="none"/>`;
const text=(x,y,value,size=27,fill=ink)=>`<text x="${x}" y="${y}" fill="${fill}" stroke="none" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="${size}" font-weight="700">${value}</text>`;
const star=(x=50,y=48,r=29)=>path(Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,k=i%2?r*.46:r;return`${i?'L':'M'}${(x+Math.cos(a)*k).toFixed(2)} ${(y+Math.sin(a)*k).toFixed(2)}`;}).join('')+'Z',gold);
const face=(age,x=50,y=54)=>age<=7?`<g stroke-width="2">${circle(x-9,y,1.7,ink)}${circle(x+9,y,1.7,ink)}${path(`M${x-5} ${y+8}q5 4 10 0`)}</g>`:'';
const wheels=()=>circle(29,76,9,ink)+circle(74,76,9,ink)+circle(29,76,3,cream)+circle(74,76,3,cream);
const aliases={bunny:'rabbit',animals:'rabbit',fruit:'apple',vehicles:'car',unrelated:'shoe','small-plane':'airplane',sailboat:'ship',cherry:'cherries',strawberry:'berry',woodblock:'wood',boat:'ship',plane:'airplane',bike:'bicycle',train:'rail',metro:'rail',tram:'rail',pack:'basket',eat:'picnic',heart:'love'};
export function appearanceBand(value=6){const age=Math.max(2,Math.min(10,Math.round(Number(value)||6)));return age<=4?'preschool':age<=7?'early':'studio';}
function drawing(id,age){
  switch(id){
    case 'sun':return circle(50,50,22,gold)+Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return line(50+Math.cos(a)*31,50+Math.sin(a)*31,50+Math.cos(a)*40,50+Math.sin(a)*40);}).join('')+face(age,50,48);
    case 'moon':return path('M68 15C23 8 7 57 36 78c17 13 41 7 51-8C51 79 31 41 68 15Z',gold);
    case 'star':return star()+face(age,50,45);
    case 'flower':return path('M50 82V46')+path('M49 70C25 70 22 53 27 52c15-1 23 8 22 18Z',teal)+Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return circle(50+Math.cos(a)*19,36+Math.sin(a)*19,15,coral);}).join('')+circle(50,36,11,gold);
    case 'leaf':return path('M23 75C7 38 33 17 80 18c2 41-15 67-57 57Z',teal)+path('M19 82 64 35m-25 26 2-22m10 10 17 1');
    case 'rainbow':return [coral,gold,teal,blue].map((c,i)=>`<path d="M${12+i*10} 73a${38-i*10} ${38-i*10} 0 0 1 ${76-i*20} 0" fill="none" stroke="${c}" stroke-width="10"/>`).join('')+path('M10 79h82');
    case 'rabbit':case 'cat':case 'fox':case 'bear':case 'owl':case 'dog':case 'lion':{
      const color=id==='fox'?coral:id==='bear'||id==='dog'?'#c89c72':id==='lion'?gold:id==='owl'?violet:cream;
      const ears=id==='rabbit'?`<ellipse cx="36" cy="25" rx="10" ry="22" fill="${cream}"/><ellipse cx="64" cy="25" rx="10" ry="22" fill="${cream}"/>`:id==='dog'?`<ellipse cx="23" cy="43" rx="12" ry="25" fill="#876448"/><ellipse cx="77" cy="43" rx="12" ry="25" fill="#876448"/>`:id==='bear'?circle(26,27,14,color)+circle(74,27,14,color):path('M21 43 19 12 44 31M56 31 81 12 80 43',color);
      return (id==='lion'?circle(50,50,41,coral):'')+ears+`<ellipse cx="50" cy="56" rx="34" ry="30" fill="${color}"/>`+(id==='owl'?circle(37,50,14,cream)+circle(63,50,14,cream):'')+circle(37,50,3,ink)+circle(63,50,3,ink)+path('m46 61 4 4 4-4Z',ink)+path('M50 65v7m-7-1q7 7 14 0');
    }
    case 'frog':return circle(30,33,14,teal)+circle(70,33,14,teal)+`<ellipse cx="50" cy="56" rx="37" ry="27" fill="${teal}"/>`+circle(30,32,7,cream)+circle(70,32,7,cream)+circle(30,32,3,ink)+circle(70,32,3,ink)+path('M34 60q16 16 32 0');
    case 'butterfly':return path('M47 45C7 1 2 41 24 55 2 91 36 93 48 64M53 45C93 1 98 41 76 55 98 91 64 93 52 64',violet)+rect(46,37,8,38,ink)+path('M49 39 39 24m12 15 10-15');
    case 'bee':return ` <ellipse cx="36" cy="31" rx="17" ry="14" fill="${cream}"/><ellipse cx="66" cy="31" rx="17" ry="14" fill="${cream}"/><ellipse cx="50" cy="57" rx="31" ry="22" fill="${gold}"/>`+path('M40 37v40m18-40v40','none','stroke-width="9"')+circle(75,53,2,ink);
    case 'ladybug':return circle(50,54,31,coral)+circle(50,22,12,ink)+line(50,26,50,86)+[[-13,-10],[13,-10],[-16,13],[16,13]].map(([x,y])=>circle(50+x,52+y,6,ink)).join('');
    case 'car':case 'bus':return path(id==='bus'?'M12 28h74v43H12Z':'M12 49h13l13-22h27l16 23h10v22H10Z',id==='bus'?gold:coral)+rect(38,32,20,17,cream,2)+(id==='bus'?rect(16,33,16,17,cream,2)+rect(63,33,17,17,cream,2):'')+wheels();
    case 'bicycle':return circle(23,69,18,cream)+circle(78,69,18,cream)+path('m23 69 18-30 17 30H23l20-21h25l10 21M34 35h15m12-10h13l-6 23','none','stroke-width="4"');
    case 'airplane':return path('m49 10 9 31 33 20-2 10-32-11-1 20 11 7v7L50 90l-17 4v-7l11-7-1-20-32 11-2-10 33-20Z',blue);
    case 'helicopter':return path('M35 39h26c20 0 25 36 5 36H33L11 56V43l19 8Z',teal)+rect(54,44,19,17,cream,5)+path('M47 39V24M15 24h67M34 81h46m-39-7v7m24-7v7');
    case 'ship':return path('M10 63h80L76 82H26Z',blue)+rect(26,48,41,14,cream,2)+path('M49 15v44M45 19 16 52h29Z',coral)+path('M55 23 77 53H55Z',gold)+path('M10 88q10 6 20 0t20 0t20 0t20 0');
    case 'rail':return rect(22,13,56,64,teal,14)+rect(30,25,40,24,cream,4)+circle(35,63,4,gold)+circle(65,63,4,gold)+path('m33 78-12 15m46-15 12 15M26 88h48');
    case 'apple':return path('M50 31C18 11 8 49 26 78c13 18 18 7 24 7s14 11 26-7c20-32 5-66-26-47Z',coral)+path('M50 32 48 16')+path('M51 23c11-21 27-10 23-7-7 13-17 13-23 7Z',teal);
    case 'banana':return path('M18 17c9 46 34 51 63 16C76 88 13 87 13 38Z',gold)+path('M23 24c4 37 26 46 48 31');
    case 'pear':return path('M49 18C29 17 37 35 26 48 2 83 29 91 50 90s48-12 21-43C60 32 68 18 49 18Z',teal)+path('m50 18 5-11');
    case 'berry':return path('M18 34h64C80 64 60 87 50 92 36 86 19 64 18 34Z',coral)+path('m49 35-29-8 15-4-6-11 21 10 20-10-5 14 16 2Z',teal)+[30,45,60,73].map((x,i)=>path(`m${x} ${46+i%2*8} 2 4m${x-1} ${63+i%2*8} 2 3`)).join('');
    case 'cherries':return path('M30 66Q31 33 63 13q-2 27 8 47')+circle(28,70,18,coral)+circle(72,70,18,coral)+path('M62 14Q82 8 90 26 72 34 62 14Z',teal);
    case 'carrot':return path('M30 30 70 46 34 92Z',coral)+path('M49 35 52 11m-6 20L33 12m20 24 17-16','none',`stroke="${teal}" stroke-width="6"`)+path('m39 52 10 5m-12 7 7 3');
    case 'cookie':return circle(50,50,35,'#e2b47c')+[[34,30],[66,31],[50,47],[30,62],[67,64],[49,74]].map(([x,y])=>circle(x,y,4,'#72513d')).join('');
    case 'seed':return path('M51 82C13 69 21 32 60 18c32 26 28 57-9 64Z','#c69b6d')+path('M40 74q-4-29 19-47');
    case 'water':return path('M50 8C38 29 19 45 19 62a31 31 0 0 0 62 0C81 46 61 25 50 8Z',blue)+path('M33 59q-3 15 10 19');
    case 'sprout':case 'plant':return path('M50 83V39')+path('M49 52C17 55 16 26 21 24c24 0 32 13 28 28Z',teal)+path('M51 38C51 13 71 11 82 14 83 31 67 43 51 38Z',teal)+(id==='plant'?path('m27 65 8 28h31l8-28Z',coral):path('M19 87q31-9 62 0'));
    case 'bread':case 'sandwich':return path('M19 49C3 36 19 16 32 19q18-14 36 0c17-5 30 19 13 30v34H19Z',gold)+path('M25 50v25h50V50','none','stroke="#c69659"')+(id==='sandwich'?path('M23 60h54','none','stroke="#65ad9d" stroke-width="8"')+path('M23 68h54','none','stroke="#ed8a70" stroke-width="6"'):'');
    case 'cheese':return path('M14 45 70 16 88 74H14Z',gold)+path('m14 45 56-4 18 33')+circle(41,61,5,cream)+circle(68,61,4,cream);
    case 'basket':case 'picnic':return path('M19 44h62l-8 43H27Z','#d9ad76')+path('M30 44C30 5 70 5 70 44M37 46l3 38m10-38v39m13-38-3 38M25 62h52')+(id==='picnic'?rect(30,27,19,20,coral,6)+path('m54 44 2-28 13 2-3 26Z',gold):'');
    case 'drum':return path('M17 37v38c0 19 66 19 66 0V37Z',coral)+path('m20 43 14 35 16-34 17 35 13-36',cream)+`<ellipse cx="50" cy="36" rx="33" ry="13" fill="${cream}"/>`+path('m26 15 28 28m22-28L51 40','none','stroke-width="6"');
    case 'bell':return path('M24 60c8-8 7-19 7-27 0-28 38-28 38 0 0 8-1 19 7 27l8 12H16Z',gold)+circle(50,80,8,ink)+path('M16 72h68M43 8h14');
    case 'shaker':return ` <ellipse cx="50" cy="37" rx="27" ry="31" fill="${teal}"/>`+rect(44,59,12,34,'#d9ad76',5)+path('M25 34h50M26 42h48','none','stroke="#fffaf0" stroke-width="5"')+circle(40,20,3,gold)+circle(59,20,3,gold);
    case 'wood':return rect(12,39,76,37,'#cc9e6b',7)+rect(23,51,54,10,ink,3)+path('m31 14 42 24','none','stroke="#8d6648" stroke-width="6"')+circle(29,13,7,gold);
    case 'clap':return path('M43 79 17 52c-6-7 0-13 6-9l9 7L19 24c-4-8 5-12 9-5l19 28 4-24c2-9 13-6 11 3l-6 37Z',gold)+path('m58 81 27-31c5-7-2-14-8-7l-9 9 10-30c3-9-7-12-10-4L58 40',cream)+path('M42 14 38 6m15 7V4m12 10 5-7');
    case 'tap':return path('M30 83V54c0-8 11-8 11 0V22c0-9 12-9 12 0v24c14-8 28 2 25 15l-6 22Z',gold)+path('M25 14 17 9m16-3V1m30 9 7-6')+path('M18 90h65');
    case 'stomp':return path('M27 10h30l4 44 20 10c14 8 9 24-4 24H19V70l8-7Z',blue)+path('M20 79h66M37 53h19m-19-9h18m-17-9h16')+path('M11 93h79','none','stroke-width="4"');
    case 'rest':return path('M27 57V29c0-8 11-8 11 0V18c0-9 12-9 12 0v-4c0-9 12-9 12 0v7c0-8 11-8 11 0v32l6-10c5-8 15-2 10 6L74 78c-7 13-30 17-41 1L18 60c-7-9 3-16 9-8Z',teal);
    case 'fish':return path('M20 49C38 17 72 23 85 49 69 77 36 79 20 49L6 28v43Z',blue)+circle(69,43,3,ink)+path('M57 28q-9 22 0 44');
    case 'canoe':return path('M9 57q40 15 82 0L77 77H23Z','#ce9b68')+path('m31 19 43 62','none','stroke-width="5"')+path('m66 76 8-7 16 17-7 7Z',gold);
    case 'paper':return path('M23 12h41l16 18v60H23Z',cream)+path('M64 12v19h16M33 46h35M33 59h35M33 72h23');
    case 'fold':return path('M18 17h64v66H18Z',cream)+path('M18 17 82 83','none','stroke-dasharray="4 5"')+path('M18 17v66h64Z','#dcebe6')+path('M61 25q20 2 12 26m0 0-2-11m2 11 10-6');
    case 'paper-plane':return path('M8 33 90 13 58 86 43 57Z',cream)+path('M90 13 43 57l15 29M43 57l-4 19 13-7');
    case 'launch':return path('M9 45 72 20 53 75 37 54Z',cream)+path('M72 20 37 54M3 77l16-9m-6 20 16-10','none','stroke-width="3"')+path('M76 60h16m-7-8 8 8-8 8');
    case 'land':return path('M14 41 87 20 64 80 46 58Z',cream)+path('M87 20 46 58M9 86h82')+path('M22 15v17m-6-6 6 6 6-6');
    case 'juice':return path('M26 35h48l-6 53H33Z',cream)+path('m31 51 4 33h31l4-33Z',coral)+path('M18 9h26v23H18Z',gold)+path('M37 32 43 45','none','stroke="#ed8a70" stroke-width="4"');
    case 'stick':return path('M26 35h48l-6 53H33Z',cream)+path('m31 51 4 33h31l4-33Z',coral)+rect(45,12,10,63,'#c89c72',3);
    case 'freezer':return rect(16,8,68,85,'#dbe9ee',7)+path('M16 41h68M26 20v11m0 22v22')+path('M57 51v29m-13-22 26 15m-26 0 26-15','none','stroke="#77a9cf" stroke-width="3"');
    case 'ice-pop':return rect(44,61,12,33,'#c89c72',5)+path('M25 38a25 25 0 0 1 50 0v35H25Z',coral)+path('M35 37v24M48 32v29','none','stroke="#ffd8bc" stroke-width="4"');
    case 'melt':return ` <ellipse cx="49" cy="79" rx="36" ry="12" fill="${coral}"/>`+rect(44,23,12,58,'#c89c72',4)+path('M36 54c-18-12-25 8-16 18 13 11 34 12 47 6 14-11-1-18-11-13Z',coral)+circle(81,26,12,gold);
    case 'blocks':return rect(10,17,30,27,coral,3)+rect(59,20,27,27,teal,3)+rect(20,61,31,29,gold,3)+rect(67,63,25,25,blue,3);
    case 'base':return rect(7,62,28,27,coral,3)+rect(36,62,28,27,gold,3)+rect(65,62,28,27,teal,3)+rect(38,17,25,25,blue,3)+path('M8 93h85');
    case 'tower':return rect(7,65,28,27,coral,3)+rect(36,65,28,27,gold,3)+rect(65,65,28,27,teal,3)+rect(23,37,27,27,blue,3)+rect(51,37,27,27,coral,3)+rect(38,9,27,27,teal,3);
    case 'fall':return rect(5,67,27,26,coral,3)+rect(34,66,28,27,gold,3)+path('m69 57 26 11-11 24-25-11Z',teal)+path('m26 15 25 9-9 26-26-9Z',blue)+path('M70 13v21m-8-8 8 8 8-8');
    case 'rebuild':return rect(5,65,28,27,coral,3)+rect(34,65,28,27,gold,3)+rect(63,65,28,27,teal,3)+rect(34,37,28,27,blue,3)+path('M18 46C5 10 83 7 83 39m-8-8 8 8 8-8');
    case 'shoe':return path('M14 41h29l16 18 29 7c13 5 7 23-4 23H12Z',blue)+path('M12 78h79m-47-23 11-8m-3 17 11-8m-29-3q16-22 22-11M34 53q-4-21-15-14c-7 5 5 13 15 14');
    case 'rocket':return path('M50 8C19 29 28 61 35 73h30C72 56 80 29 50 8Z',cream)+circle(50,38,12,blue)+path('m34 53-16 25 18-6m29-19 17 25-18-6',coral)+path('M42 77 50 96l9-19',gold);
    case 'love':return path('M50 84 16 51C-1 21 27 4 50 28 74 4 103 23 84 52Z',coral);
    // Project-authored stamp illustrations. Keep exportable artwork independent
    // of device emoji fonts; the same paths draw the picker and the saved PNG.
    case 'unicorn':return path('M24 89V62C9 39 32 20 53 24l20 14 14 25-17 12-13-16-5 30Z',cream)+path('M49 25 56 5 64 31Z',gold)+path('M29 29C5 41 13 67 25 77l-5 14h20V58l9-21Z',violet)+path('m40 29-7-16 20 13',cream)+circle(63,45,3,ink)+path('M74 65h8');
    case 'lollipop':return path('m49 56-8 37','none','stroke="#c89c72" stroke-width="8"')+circle(53,34,27,coral)+path('M40 34c-1-17 26-18 28-2 2 23-35 24-39 4','none','stroke="#fffaf0" stroke-width="6"')+path('M53 26c12 0 11 14 1 14','none','stroke="#efc566" stroke-width="5"');
    case 'pizza':return path('M18 24Q51 7 85 25L48 91Z',gold)+path('M18 24Q51 7 85 25','none','stroke="#c89c72" stroke-width="12"')+circle(43,35,6,coral)+circle(63,44,6,coral)+circle(46,62,6,coral)+path('m30 30 5 6m21-9 6 3m-7 42 5-8','none','stroke="#65ad9d" stroke-width="3"');
    case 'celebration':return path('m14 89 13-48 32 32Z',gold)+path('m23 57 24 8m-29 5 16 9','none','stroke="#ed8a70" stroke-width="5"')+path('M41 51c-17-29 19-17 4-39M53 61c31 4 6-28 33-26M59 43l17-20','none','stroke="#65ad9d" stroke-width="4"')+circle(28,17,4,coral)+circle(83,62,5,violet)+path('m65 9 8 4m-9 62 4 8','none','stroke="#77a9cf" stroke-width="5"');
    case 'shining-star':return star(49,54,27)+path('M49 8v10M11 32l9 5m61-9-8 7M8 70l11-3m60 7 10 4','none','stroke="#efc566" stroke-width="5"');
    case 'flame':return path('M49 8C58 33 80 38 79 61 81 99 18 100 19 65c0-16 11-20 13-38l10 18C52 34 43 23 49 8Z',coral)+path('M50 48C59 64 66 64 65 76c-1 22-34 18-32 0 1-10 10-13 17-28Z',gold);
    case 'alien':return path('M20 39h10V26h40v13h10v34H68v13H55V74H45v12H32V73H20Z',violet)+path('M30 26 21 12m49 14 9-14','none','stroke-width="5"')+rect(30,43,13,13,cream,2)+rect(57,43,13,13,cream,2)+path('M40 65h20');
    case 'ice-cream':return path('m27 51 24 43 22-43Z','#d9ad76')+path('m36 61 26 12M43 78l22-15')+path('M24 49C4 36 28 24 32 22 24 4 58 1 61 18 82 10 99 40 77 49Z',coral)+path('M25 49h51','none','stroke="#fffaf0" stroke-width="6"')+circle(43,16,3,cream);
    case 'guitar':return path('M40 45C8 33 1 67 24 86c24 20 51-2 34-25L79 33l-12-9Z','#d9ad76')+path('m67 25 13-17 14 11-15 16Z',teal)+circle(39,63,10,ink)+path('m32 69 49-50','none','stroke="#fffaf0" stroke-width="2"')+path('m20 75 13 11','none','stroke-width="5"');
    case 'wave':return path('M8 80C21 70 22 15 56 13c27-2 37 23 25 39-1-21-23-22-25-6-2 17 25 27 36 21v19H8Z',blue)+path('M37 38c8-28 48-22 47 3C68 28 57 34 56 46','none','stroke="#fffaf0" stroke-width="7"')+path('M14 89h76','none','stroke="#65ad9d" stroke-width="5"');
    default:return '';
  }
}
export function objectArt(id,{age=6}={}){const key=aliases[id]||id,content=drawing(key,Number(age)||6);return content?`<svg class="object-art" data-art="${key}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`:'';}
function item(id,x,y,size=65,age=6){return `<g transform="translate(${x} ${y}) scale(${size/100})">${drawing(aliases[id]||id,age)}</g>`;}
function tile(x,y,value,fill=cream,w=43){return rect(x,y,w,48,fill,9)+text(x+w/2,y+33,value,25);}
export function activityArt(id,{age=6}={}){
  id=String(id).replace(/[^a-z0-9-]/g,'');
  const mature=Number(age)>=8;let content='';
  switch(id){
    case 'draw':content=path('M59 140 80 19m100 121L153 19M66 119h102','none','stroke="#c89c72" stroke-width="8"')+rect(65,24,107,94,cream,5)+path('M82 94q20-49 38-17t34-22','none',`stroke="${coral}" stroke-width="9"`)+circle(95,51,12,gold)+path('m181 102 18-62 10 3-18 62Z',teal);break;
    case 'trails':content=rect(23,18,194,120,cream,12)+path('M46 102c-21-85 81-78 65-18s83 42 76-44','none',`stroke="${teal}" stroke-width="14"`)+path('M46 102c-21-85 81-78 65-18s83 42 76-44','none','stroke="#fffaf0" stroke-width="3" stroke-dasharray="4 7"')+circle(46,102,7,coral)+star(187,38,13);break;
    case 'letter-match':content=tile(48,43,'A',gold,61)+tile(127,59,'a',teal,61)+path('M105 105q14 15 30 0');break;
    case 'word-build':content=item('cat',86,4,71,age)+tile(36,89,'c',gold)+tile(98,89,'a',cream)+tile(160,89,'t',teal);break;
    case 'counting':content=rect(22,81,125,53,cream,10)+Array.from({length:5},(_,i)=>circle(37+i*24,107,8,i<3?coral:'#e9e6df')).join('')+item('apple',35,20,57,age)+item('apple',98,19,57,age)+tile(167,83,mature?'20':'3',gold);break;
    case 'number-stories':content=rect(38,19,164,47,cream,10)+text(120,52,mature?'145':'7',29)+path('m120 66-49 23m49-23 49 23')+tile(43,88,mature?'87':'3',teal,65)+tile(132,88,'?',gold,65);break;
    case 'sharing':content=Array.from({length:3},(_,i)=>rect(23+i*69,50,58,78,cream,9)+Array.from({length:4},(_,j)=>circle(39+i*69+j%2*25,71+Math.floor(j/2)*33,7,coral)).join('')).join('')+path('M33 30h174m-174-5v10m174-10v10');break;
    case 'compare':content=path('M120 30v106M53 54h135',cream)+path('M53 54 15 116H91Z',cream,'data-scale-pan="left"')+path('M188 54 150 116h76Z',cream,'data-scale-pan="right"')+circle(120,28,9,gold)+path('M88 139h64','none','stroke-width="7"')+text(53,104,mature?'245':'5',mature?18:25)+text(188,104,mature?'254':'8',mature?18:25);break;
    case 'ordering':content=rect(27,99,37,32,teal)+rect(80,77,37,54,blue)+rect(133,51,37,80,violet)+rect(186,28,28,103,coral)+path('M25 140h194');break;
    case 'shape-match':content=circle(66,63,30,coral)+rect(113,30,64,59,teal,6)+path('m109 133 33-58 33 58Z',gold)+item('wood',18,100,42,age);break;
    case 'patterns':content=path('M24 106h191')+(mature?tile(21,47,'4',cream)+tile(75,47,'9',teal)+tile(129,47,'?',gold)+tile(183,47,'12',cream):item('leaf',18,35,65,age)+item('flower',79,35,65,age)+item('leaf',140,35,65,age));break;
    case 'sorting':content=rect(21,68,88,65,cream,10)+rect(131,68,88,65,cream,10)+item('apple',25,73,48,age)+item('pear',62,68,48,age)+item('car',138,73,73,age)+path('m71 32-10 20m114-20 10 20');break;
    case 'odd-one-out':content=circle(57,53,19,teal)+circle(109,53,19,teal)+path('m160 34 23 38h-46Z',coral)+circle(137,100,28,'#fffaf0')+circle(137,100,19,'#e1f1ed')+path('m159 122 20 20','none','stroke-width="9"')+path('m131 92 14 18h-28Z',coral);break;
    case 'memory':content=rect(28,26,75,104,teal,12)+path('M43 53h45m-45 15h45','none','stroke="#bde0d6"')+rect(132,26,75,104,cream,12)+(mature?text(169,89,'½',45):item('flower',135,46,67,age))+item('leaf',42,80,39,age);break;
    case 'maze':content=rect(28,20,184,118,cream,10)+path('M58 21v30h35v28h36m-70 58v-29h37m114-57h-42v27m-33 31h42V80M129 21v30')+path('M43 35v59h67v30h83','none',`stroke="${teal}" stroke-width="7" stroke-dasharray="2 10"`)+circle(43,35,8,coral)+star(193,122,11);break;
    case 'picture-sequence':content=rect(18,37,62,86,cream,8)+rect(89,28,62,95,cream,8)+rect(160,18,62,105,cream,8)+item('seed',25,65,45,age)+item('sprout',94,47,52,age)+item('flower',162,38,58,age);break;
    case 'make-a-shape':content=rect(31,18,179,126,cream,10)+Array.from({length:12},(_,i)=>circle(54+i%4*43,40+Math.floor(i/4)*40,3,'#d6dedc')).join('')+path('M54 120 98 40 184 120Z','none',`stroke="${teal}" stroke-width="7"`)+circle(54,120,7,gold)+circle(98,40,7,gold)+circle(184,120,7,gold);break;
    case 'sound-match':content=item('drum',18,55,92,age)+item('bell',109,18,84,age)+item('shaker',172,67,65,age);break;
    case 'pitch-path':content=path('M31 25v107h187')+path('M48 108 89 78l40 8 38-51 33 11','none',`stroke="${teal}" stroke-width="6"`)+[[48,108],[89,78],[129,86],[167,35],[200,46]].map(([x,y])=>circle(x,y,9,gold)).join('');break;
    case 'melody-echo':content=[coral,gold,teal,blue,violet].map((c,i)=>rect(24+i*40,28+i*9,31,102-i*9,c,9)+circle(40+i*40,44+i*9,3,ink)).join('')+path('m37 14 144 119','none','stroke="#c69b6d" stroke-width="7"')+circle(184,135,9,cream);break;
    case 'mirror-mosaic':content=rect(22,22,196,116,cream,10)+path('M120 22v116','none','stroke-dasharray="5 5"')+[[62,49],[89,78],[62,107],[178,49],[151,78],[178,107]].map(([x,y],i)=>rect(x-11,y-11,22,22,[teal,coral,gold][i%3],3)).join('');break;
    case 'balance-lab':content=path('M120 40v94M48 64h144M87 138h66','none','stroke-width="5"')+path('M23 98h55l-6 18H29Z',teal)+path('M159 98h55l-6 18h-43Z',blue)+rect(32,72,35,25,gold)+rect(164,78,18,19,coral)+rect(187,78,18,19,coral);break;
    case 'measure-pour':content=path('M36 25h59v110H36Z',cream)+path('M143 54h61v81h-61Z',cream)+path('M38 73h55v60H38Z',blue)+path('M145 102h57v31h-57Z',teal)+path('M40 48h15m-15 24h15m-15 24h15m93-17h15m-15 25h15');break;
    case 'beat-studio':content=item('drum',61,17,122,age)+circle(28,79,5,gold)+circle(210,48,5,teal)+path('M25 114h20m152-11h19');break;
    default:content=star(120,78,39);
  }
  const backdrop=mature?path('M16 144H226M16 16v128','none','stroke="#dbe5e0" stroke-width="1.5"'):`<ellipse cx="121" cy="88" rx="109" ry="66" fill="#ffffff55" stroke="none"/>`;
  return `<svg class="activity-art" data-family-art="${id}" viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${ink}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${backdrop}${content}</svg>`;
}
