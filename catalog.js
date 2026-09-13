// Modes retain their original routes and progress. Home cards group related practice.
export const ACTIVITY_MODES = [
  {id:'draw', title:'Doodle studio', category:'create', icon:'🖍️', description:'Turn an idea into a picture.', skill:'Creative expression', engine:'drawing'},
  {id:'coloring', title:'Color & create', category:'create', icon:'🌈', description:'Give nine pictures your colors.', skill:'Color & fine motor play', engine:'drawing'},
  {id:'prewriting', title:'Line & shape trails', category:'letters', icon:'〰', description:'Follow loops, lines, and shapes.', skill:'Control & coordination', engine:'learning', kind:'letters', options:{set:'shapes'}},
  {id:'uppercase', title:'Big letter trails', category:'letters', icon:'A', description:'Learn how capital letters form.', skill:'Uppercase handwriting', engine:'learning', kind:'letters', options:{set:'upper'}},
  {id:'lowercase', title:'Little letter trails', category:'letters', icon:'b', description:'Practice curves and little letters.', skill:'Lowercase handwriting', engine:'learning', kind:'letters', options:{set:'lower'}},
  {id:'word-tracing', title:'Word trails', category:'letters', icon:'cat', description:'Join letters into familiar words.', skill:'Word handwriting', engine:'learning', kind:'letters', options:{set:'words'}},
  {id:'number-tracing', title:'Number trails', category:'numbers', icon:'3', description:'Draw each numeral from 0 to 9.', skill:'Numeral formation', engine:'learning', kind:'letters', options:{set:'nums'}},
  {id:'counting', title:'Count with me', category:'numbers', icon:'🫐', description:'Touch each dot. Find how many.', skill:'One-to-one counting', engine:'learning', kind:'numbers', options:{mode:'count'}},
  {id:'addition', title:'Add together', category:'numbers', icon:'+', description:'Bring two groups together.', skill:'Adding with objects', engine:'learning', kind:'numbers', options:{mode:'add'}},
  {id:'equal-groups', title:'Equal groups', category:'numbers', icon:'🍒', description:'Discover the same amount in each.', skill:'Repeated equal quantities', engine:'learning', kind:'numbers', options:{mode:'groups'}},
  {id:'shape-match', title:'Shape detective', category:'discover', icon:'△', description:'Find the shape that matches.', skill:'Shape recognition', engine:'discovery'},
  {id:'color-match', title:'Color buddies', category:'discover', icon:'🎨', description:'Find a partner for each color.', skill:'Color recognition', engine:'discovery'},
  {id:'patterns', title:'Pattern parade', category:'discover', icon:'🔶', description:'Discover what comes next.', skill:'Patterns & prediction', engine:'discovery'},
  {id:'sorting', title:'Sort it out', category:'discover', icon:'🧺', description:'Give each thing a place to belong.', skill:'Classifying & grouping', engine:'discovery'},
  {id:'odd-one-out', title:'Spot the difference', category:'discover', icon:'🔍', description:'Find the one that is different.', skill:'Observe & compare', engine:'discovery'},
  {id:'memory', title:'Memory garden', category:'discover', icon:'🌻', description:'Turn cards and find the pairs.', skill:'Visual memory', engine:'discovery'},
  {id:'maze', title:'Little pathfinder', category:'discover', icon:'🧭', description:'Help Bunny find the carrot.', skill:'Planning & spatial thinking', engine:'discovery'},
  {id:'compare', title:'More, less, same', category:'numbers', icon:'⚖️', description:'Compare two groups of objects.', skill:'Comparing quantities', engine:'challenges'},
  {id:'number-order', title:'Number stepping stones', category:'numbers', icon:'👣', description:'Put numbers in growing order.', skill:'Number sequences', engine:'challenges'},
  {id:'subtraction', title:'Take away', category:'numbers', icon:'−', description:'See what is left when some go.', skill:'Subtracting with objects', engine:'challenges'},
  {id:'number-bonds', title:'Missing number', category:'numbers', icon:'🧩', description:'Find the part that makes the whole.', skill:'Part–whole relationships', engine:'challenges'},
  {id:'ten-frame', title:'Fill the frame', category:'numbers', icon:'▦', description:'Make an amount, one dot at a time.', skill:'Five & ten structure', engine:'challenges'},
  {id:'letter-match', title:'Letter buddies', category:'letters', icon:'Aa', description:'Pair big letters with little ones.', skill:'Letter case recognition', engine:'challenges'},
  {id:'word-build', title:'Build a word', category:'letters', icon:'🧱', description:'Choose letters to make a word.', skill:'Letter order & spelling', engine:'challenges'},
  {id:'size-order', title:'Growing garden', category:'discover', icon:'🌱', description:'Arrange flowers from small to big.', skill:'Size & ordering', engine:'adventures'},
  {id:'picture-sequence', title:'Story steps', category:'discover', icon:'📖', description:'Put a familiar story in order.', skill:'Sequence & explain', engine:'adventures'},
  {id:'directions', title:'Follow the arrows', category:'discover', icon:'↗', description:'Follow clues, one move at a time.', skill:'Directions & planning', engine:'adventures'},
  {id:'make-a-shape', title:'Shape builder', category:'discover', icon:'⬡', description:'Join corners to build an outline.', skill:'Geometry & spatial reasoning', engine:'adventures'},
  {id:'rhythm', title:'Tap the pattern', category:'discover', icon:'🥁', description:'Copy a sequence at your own pace.', skill:'Sequence memory', engine:'adventures'},
  {id:'sharing', title:'Fair shares', category:'numbers', icon:'🍓', description:'Give each friend an equal share.', skill:'Sharing & remainders', engine:'adventures'},
  {id:'sound-match', title:'Sound detective', category:'listen', icon:'🔔', description:'Listen closely and find a sound.', skill:'Hearing sound differences', engine:'listening'},
  {id:'pitch-path', title:'Higher or lower', category:'listen', icon:'🎵', description:'Follow where the notes go.', skill:'Pitch & listening', engine:'listening'},
  {id:'melody-echo', title:'Melody echo', category:'listen', icon:'🎹', description:'Hear a tune. Play it back.', skill:'Listening & musical memory', engine:'listening'},
  {id:'beat-studio', title:'Beat studio', category:'listen', icon:'🥁', description:'Listen, then make your own beat.', skill:'Rhythm & coordination', engine:'listening'},
];

const family=(id,title,category,icon,description,skill,modes)=>({
  id,title,category,icon,description,skill,
  engine:ACTIVITY_MODES.find(mode=>mode.id===modes[0][0]).engine,
  modes:modes.map(([id,label])=>({id,label})),
});
const single=id=>{const mode=ACTIVITY_MODES.find(mode=>mode.id===id);return family(id,mode.title,mode.category,mode.icon,mode.description,mode.skill,[[id,mode.title]]);};
export const ACTIVITIES = [
  family('draw','Doodle studio','create','🖍️','Draw freely or color a picture.','Drawing, coloring & imagination',[['draw','Free draw'],['coloring','Coloring pages']]),
  family('trails','Trail studio','letters','〰','Lines, letters, words, and numbers.','Handwriting & coordination',[['uppercase','ABC'],['lowercase','abc'],['prewriting','First lines'],['word-tracing','Words'],['number-tracing','123']]),
  single('letter-match'), single('word-build'),
  family('counting','Count & make','numbers','🫐','Count objects. Build an amount.','Counting & number structure',[['counting','Count objects'],['ten-frame','Build an amount']]),
  family('number-stories','Number stories','numbers','🧩','Join, take away, or find a part.','Number relationships',[['addition','Join together'],['subtraction','Take away'],['number-bonds','Missing part']]),
  family('sharing','Groups & sharing','numbers','🍓','Make fair shares and equal groups.','Equal groups & fair sharing',[['sharing','Share fairly'],['equal-groups','Count groups']]),
  single('compare'),
  family('ordering','Put it in order','discover','🌱','Arrange sizes or number steps.','Comparing & ordering',[['size-order','Sizes'],['number-order','Numbers']]),
  family('shape-match','Shape & color detective','discover','🎨','Match a shape or a color.','Noticing & matching',[['shape-match','Shapes'],['color-match','Colors']]),
  single('patterns'), single('sorting'), single('odd-one-out'), single('memory'),
  family('maze','Pathfinder','discover','🧭','Find a path or follow a route.','Directions & spatial planning',[['maze','Find a path'],['directions','Follow arrows']]),
  single('picture-sequence'), single('make-a-shape'),
  single('sound-match'), single('pitch-path'),
  family('melody-echo','Melody echo','listen','🎹','Hear a tune. Play it back.','Listening & sequence memory',[['melody-echo','Listen & echo'],['rhythm','Picture practice']]),
  single('beat-studio'),
];
export const CATEGORIES = [
  {id:'all',label:'All activities',icon:'✦'},
  {id:'create',label:'Create',icon:'🖍️'},
  {id:'letters',label:'Letters',icon:'Aa'},
  {id:'numbers',label:'Numbers',icon:'123'},
  {id:'discover',label:'Discover',icon:'🧩'},
  {id:'listen',label:'Listen',icon:'♪'},
];
export function getFamily(id) {
  return ACTIVITIES.find(activity=>activity.id===id || activity.modes.some(mode=>mode.id===id));
}
export function getActivity(id, age=6) {
  // Original broad links keep their existing practice tabs and age defaults.
  if(id==='letters') return {id,title:'Letter adventures',engine:'learning',kind:'letters'};
  if(id==='numbers') return {id,title:'Number explorers',engine:'learning',kind:'numbers'};
  const family=ACTIVITIES.find(activity=>activity.id===id);
  const route=family ? id==='trails' ? age<=4?'prewriting':age>=8?'word-tracing':'uppercase' : family.modes[0].id : id;
  const mode=ACTIVITY_MODES.find(activity=>activity.id===route);
  return mode && {...mode,familyId:getFamily(route).id};
}
