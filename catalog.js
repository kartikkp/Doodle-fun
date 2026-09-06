// Each card opens a specific task. Individual letters and coloring pages stay inside their activity.
export const ACTIVITIES = [
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
];
export const CATEGORIES = [
  {id:'all',label:'All activities',icon:'✦'},
  {id:'create',label:'Create',icon:'🖍️'},
  {id:'letters',label:'Letters',icon:'Aa'},
  {id:'numbers',label:'Numbers',icon:'123'},
  {id:'discover',label:'Discover',icon:'🧩'},
];
export function getActivity(id) {
  if(id==='letters') return {id,title:'Letter adventures',engine:'learning',kind:'letters'};
  if(id==='numbers') return {id,title:'Number explorers',engine:'learning',kind:'numbers'};
  return ACTIVITIES.find(activity=>activity.id===id);
}
