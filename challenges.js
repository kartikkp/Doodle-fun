import {getProfile,readStore,writeStore} from './core.js';

export const CHALLENGE_INFO={
  compare:{title:'More, less, same',icon:'⚖',skill:'COMPARE QUANTITIES',intro:'Look at both groups. Which one fits the question?'},
  'number-order':{title:'Number stepping stones',icon:'↗',skill:'NUMBER ORDER',intro:'Start with the smallest number. Keep going up.'},
  subtraction:{title:'Take away',icon:'🍓',skill:'SUBTRACTION',intro:'Some berries went into the picnic basket. How many are left?'},
  'number-bonds':{title:'Missing number',icon:'◒',skill:'PARTS & WHOLES',intro:'Two parts make one whole. Find the missing part.'},
  'ten-frame':{title:'Fill the frame',icon:'▦',skill:'FIVE, TEN & TWENTY',intro:'Tap spaces to fill them. Make the number shown.'},
  'letter-match':{title:'Letter buddies',icon:'Aa',skill:'UPPERCASE & LOWERCASE',intro:'Find the big and small forms of the same letter.'},
  'word-build':{title:'Build a word',icon:'✎',skill:'LETTER SEQUENCES',intro:'Choose the letters in order to build the picture word.'},
};
const WORD_BANK={
  little:[['cat','🐱','A furry friend that says meow.'],['dog','🐶','A furry friend that barks.'],['sun','☀️','It shines in the daytime sky.'],['bus','🚌','A big vehicle that carries people.']],
  explorer:[['fish','🐟','It swims with fins.'],['duck','🦆','A bird that says quack.'],['moon','🌙','You can see it in the night sky.'],['star','⭐','It twinkles in the sky.'],['frog','🐸','It hops and says ribbit.']],
  maker:[['apple','🍎','A crisp fruit that grows on a tree.'],['rocket','🚀','A vehicle that travels into space.'],['planet','🪐','A world that travels around a star.'],['rabbit','🐰','An animal with long ears that hops.'],['flower','🌸','It blooms on a plant.']],
};
function shuffled(values,seed=1) {
  const result=[...values];let state=(Math.abs(seed)+1)>>>0;
  for(let i=result.length-1;i>0;i--){state=(state*1664525+1013904223)>>>0;const j=state%(i+1);[result[i],result[j]]=[result[j],result[i]];}
  if(result.length>1&&result.every((value,i)=>value===values[i]))result.push(result.shift());
  return result;
}
function numberChoices(answer,max,tier,seed) {
  const count=tier==='little'?3:4,values=new Set([answer]);
  for(let difference=1;values.size<count;difference++)for(const value of [answer-difference,answer+difference])if(value>=0&&value<=max&&values.size<count)values.add(value);
  return shuffled([...values],seed);
}
export function generateChallenge(id,profile,round=0) {
  const tier=profile.tier||'explorer',max=tier==='little'?5:tier==='maker'?20:10,n=Math.max(0,Math.floor(round)||0),seed=n*17+5;
  if(id==='compare') {
    const left=(n*(tier==='little'?1:tier==='maker'?5:3)+(tier==='little'?2:tier==='maker'?13:6))%(max+1);
    const right=n%3===2?left:(left+1+(n%Math.max(1,max-1)))%(max+1),direction=tier==='little'||n%2===0?'more':'fewer';
    const answer=left===right?'same':(direction==='more'?left>right:left<right)?'left':'right';
    return {id,tier,left,right,direction,answer,prompt:`Which group has ${direction}?`,help:'Count each group. If both have the same number, choose Same amount.'};
  }
  if(id==='number-order') {
    const length=tier==='little'?3:tier==='maker'?6:5,step=tier==='maker'&&n%2===1?2:1;
    const start=(n+(tier==='maker'?5:0))%(max-(length-1)*step+1);
    const sequence=Array.from({length},(_,i)=>start+i*step);
    return {id,tier,sequence,tiles:shuffled(sequence,seed),prompt:'Smallest to biggest',help:`Start with ${sequence[0]}. Then look for the smallest number left.`};
  }
  if(id==='subtraction') {
    const start=tier==='little'?3+n%3:tier==='maker'?12+n%9:5+n%6;
    const removed=tier==='little'?(n%4===3?start:1+n%Math.min(2,start)):(n*3+(tier==='maker'?5:2))%(start+1),answer=start-removed;
    return {id,tier,start,removed,answer,choices:numberChoices(answer,max,tier,seed),prompt:`${start} − ${removed} = ?`,help:`Start with ${start}. ${removed} crossed-out ${removed===1?'berry went':'berries went'} into the basket. Count the berries without a cross.`};
  }
  if(id==='number-bonds') {
    const total=tier==='little'?3+n%3:tier==='maker'?11+n%10:6+n%5;
    const part=(n*3+(tier==='maker'?6:2))%(total+1),answer=total-part;
    return {id,tier,total,part,answer,choices:numberChoices(answer,max,tier,seed),prompt:`${part} + ? = ${total}`,help:`Make ${total} altogether. You already have ${part}. Count how many empty dots need a buddy.`};
  }
  if(id==='ten-frame') {
    const size=tier==='little'?5:tier==='maker'?20:10,target=(n*(tier==='little'?1:tier==='maker'?5:3)+(tier==='little'?3:tier==='maker'?13:7))%(size+1);
    return {id,tier,size,target,answer:target,prompt:`Make ${target}`,help:`Each row holds 5. ${size>=10?'Two rows hold 10. ':''}Fill ${target} ${target===1?'space':'spaces'}. Tap a filled space to undo it.`};
  }
  if(id==='letter-match') {
    const length=tier==='little'?2:tier==='maker'?6:4,bank=tier==='maker'?'bdpqmnagertfhsuvwyxzociklj':'abcdefghijklmnopqrstuvwxyz';
    const pairs=Array.from({length},(_,i)=>bank[(n*2+i)%bank.length]);
    return {id,tier,pairs,upper:pairs.map(ch=>ch.toUpperCase()),lower:shuffled(pairs,seed),prompt:'Find the letter partners',help:tier==='little'?'The small guide on each card shows its partner. Tap a big letter and its small letter.':'Tap a big letter, then the small form of the same letter. You can start on either side.'};
  }
  if(id==='word-build') {
    const [word,picture,clue]=WORD_BANK[tier][n%WORD_BANK[tier].length];
    const letters=[...word],tiles=shuffled(letters.map((letter,index)=>({letter,index})),seed);
    return {id,tier,word,picture,clue,tiles,prompt:'Build the picture word',help:tier==='little'?`The word is ${word}. Match ${letters.join(', ')}, in that order.`:'Look at the picture and its clue. Hear the word or show its letters whenever you want a hint. Choose each letter in order.'};
  }
  throw new Error(`Unknown challenge: ${id}`);
}

function el(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function button(label,className,action) {const node=el('button',className,label);node.type='button';node.addEventListener('click',action);return node;}
function visualDots(amount,{crossed=0,known=null,berries=false}={}) {
  const dots=el('div',`challenge-dots${berries?' challenge-berries':''}`);dots.setAttribute('role','img');
  dots.setAttribute('aria-label',crossed?`${amount} berries, ${crossed} crossed out`:`${amount} dots${known!==null?`, ${known} filled`:''}`);
  if(amount===0)dots.append(el('span','challenge-empty','Empty · 0'));
  for(let i=0;i<amount;i++){const dot=el('span',`challenge-dot${i>=amount-crossed?' is-crossed':''}${known!==null&&i>=known?' is-empty':''}`,berries?'●':'');dot.setAttribute('aria-hidden','true');dots.append(dot);}
  return dots;
}

export function createChallenges(container,{getSettings,onBack=()=>{},onNotice=()=>{},onProgress=()=>{}}) {
  let opened=false,id='compare',profile=getProfile(getSettings()),round=0,question,done=false,steps=[],cells=new Set(),matched=new Set(),selection=null,showHelp=false,feedback;
  const stored=readStore('challenges-progress-v1',{});
  const saved=stored&&typeof stored==='object'&&!Array.isArray(stored)?Object.fromEntries(Object.entries(stored).filter(([key,value])=>value===true&&Object.keys(CHALLENGE_INFO).some(id=>key.startsWith(`${id}:`))).slice(0,1000)):{};
  function report(){onProgress({completedCount:Object.keys(saved).length,source:'challenges'});}
  function say(text) {if(!getSettings().sound||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(text);speech.rate=.8;speech.lang='en-US';window.speechSynthesis.speak(speech);}
  function stopSpeech(){if('speechSynthesis'in window)window.speechSynthesis.cancel();}
  function message(text,success=false) {feedback.textContent=text;feedback.classList.toggle('is-complete',success);}
  function complete(text='You did it! Take a moment to enjoy your discovery.') {
    if(done)return;done=true;saved[`${id}:${profile.tier}:${round%60}`]=true;writeStore('challenges-progress-v1',saved);report();
    container.querySelectorAll('[data-answer],[data-tile],[data-cell],[data-letter]').forEach(node=>node.disabled=true);
    message(text,true);container.querySelector('.challenge-new').textContent='Play another round →';
  }
  function reset() {stopSpeech();question=generateChallenge(id,profile,round);done=false;steps=[];cells.clear();matched.clear();selection=null;showHelp=profile.tier==='little';render();}
  function render() {
    const info=CHALLENGE_INFO[id];container.replaceChildren();container.classList.add('challenges-screen');container.dataset.challengeId=id;
    const header=el('header','activity-header challenge-header'),heading=el('div','challenge-heading');
    heading.append(el('p','challenge-eyebrow',info.skill),el('h1','',info.title));
    const back=button('← Home','button',()=>{close();onBack();});back.setAttribute('aria-label','Back to activities');
    header.append(back,heading,el('span','challenge-support',`${profile.name} · No rush`));container.append(header);
    const body=el('div','activity-body challenge-body'),card=el('section','challenge-card'),side=el('aside','challenge-side');
    const topline=el('div','challenge-topline');topline.append(el('span','challenge-round',`ROUND ${round+1}`),el('span','challenge-icon',info.icon));card.append(topline);
    const prompt=el('h2','challenge-prompt',question.prompt);prompt.dataset.testid='challenge-prompt';card.append(prompt,el('p','challenge-intro',info.intro));
    const play=el('div','challenge-play');play.dataset.testid='challenge-play';card.append(play);
    if(id==='compare')renderCompare(play);
    if(id==='number-order')renderSequence(play);
    if(id==='subtraction')renderSubtraction(play);
    if(id==='number-bonds')renderBonds(play);
    if(id==='ten-frame')renderFrame(play);
    if(id==='letter-match')renderLetters(play);
    if(id==='word-build')renderWord(play);
    feedback=el('p','challenge-feedback','Take your time. You can try as many times as you like.');feedback.dataset.testid='challenge-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');card.append(feedback);
    const footer=el('div','challenge-footer');footer.append(button('↺ Try this round again','button',reset),button('New round →','button button-primary challenge-new',()=>{round++;reset();}));card.append(footer);
    const help=el('div','challenge-help');help.append(el('span','challenge-help-star','✦'),el('h2','','A little help'),el('p','',question.help));
    if(getSettings().sound&&'speechSynthesis'in window)help.append(button('♪ Hear it','button',()=>say(`${question.prompt}. ${id==='word-build'?`The word is ${question.word}.`:question.help}`)));
    side.append(help,el('p','challenge-grownup',profile.tier==='little'?'Explore together: point, count, and say the sounds. There’s no need to read on your own.':'A hint is always welcome. Discover the pattern, then try another round.'));
    body.append(card,side);container.append(body);
  }
  function numericAnswers(play,answer,max=profile.numberMax) {
    const choices=el('div','challenge-answers');choices.setAttribute('role','group');choices.setAttribute('aria-label','Choose a number');
    for(const value of question.choices||numberChoices(answer,max,profile.tier,round+7)) {
      const choice=button(String(value),'challenge-answer',()=>{
        if(done)return;
        if(value===answer){choice.classList.add('is-correct');complete(`${answer} — you found it! ${id==='subtraction'?`${question.start} − ${question.removed} = ${answer}.`:id==='number-bonds'?`${question.part} + ${answer} = ${question.total}.`:''}`);}
        else{choice.classList.add('is-retry');message('Good thinking. Look at the picture and try another number.');}
      });choice.dataset.answer=String(value);choice.setAttribute('aria-label',`Answer ${value}`);choices.append(choice);
    }
    play.append(choices);
  }
  function renderCompare(play) {
    const groups=el('div','challenge-compare-groups');
    for(const [label,value,tone]of [['A',question.left,'purple'],['B',question.right,'green']]) {
      const group=el('div',`challenge-quantity is-${tone}`);group.append(el('span','challenge-group-name',`Group ${label}`),visualDots(value),el('strong','challenge-quantity-number',String(value)));groups.append(group);
    }
    play.append(groups);
    const answers=el('div','challenge-compare-answers');
    for(const [value,label]of [['left','← Group A'],['same','= Same amount'],['right','Group B →']]) {
      const choice=button(label,'button challenge-compare-choice',()=>{if(done)return;if(value===question.answer){choice.classList.add('is-correct');complete(question.answer==='same'?`${question.left} and ${question.right} are the same amount!`:`Group ${value==='left'?'A':'B'} has ${question.direction}. You found it!`);}else message('Count each group again. Look for the group with '+question.direction+', or choose Same amount.');});choice.dataset.answer=value;answers.append(choice);
    }
    play.append(answers);
  }
  function renderSequence(play) {
    const slots=el('div','challenge-slots');slots.setAttribute('aria-label','Your number path');
    question.sequence.forEach((number,i)=>{const slot=el('span','challenge-slot',profile.tier==='little'?String(number):'·');slot.dataset.slot=String(i);slots.append(slot);});play.append(slots);
    const hint=el('p','challenge-action-hint',profile.tier==='little'?`First find ${question.sequence[0]}.`:'Choose the smallest number first.');play.append(hint);
    const tiles=el('div','challenge-tiles');
    for(const value of question.tiles){const tile=button(String(value),'challenge-tile',()=>{
      if(done)return;
      if(value===question.sequence[steps.length]){steps.push(value);tile.disabled=true;tile.classList.add('is-used');const slot=slots.children[steps.length-1];slot.textContent=String(value);slot.classList.add('is-filled');if(steps.length===question.sequence.length)complete('A beautiful number path! You put every number in order.');else{hint.textContent=profile.tier==='little'?`Next find ${question.sequence[steps.length]}.`:'Now find the smallest number left.';message('That’s the next stepping stone. Keep going.');}}
      else message('Look for the smallest number you haven’t used yet. You can try again.');
    });tile.dataset.tile=String(value);tile.setAttribute('aria-label',`Number ${value}`);tiles.append(tile);}play.append(tiles);
  }
  function renderSubtraction(play) {
    const picture=el('div','challenge-picnic');picture.append(visualDots(question.start,{crossed:question.removed,berries:true}),el('p','challenge-picture-caption',`${question.removed} ${question.removed===1?'berry':'berries'} taken away`));play.append(picture);numericAnswers(play,question.answer);
  }
  function renderBonds(play) {
    const whole=el('div','challenge-whole');whole.append(el('span','','ALTOGETHER'),el('strong','',String(question.total)));play.append(whole);
    const parts=el('div','challenge-bond-parts'),known=el('div','challenge-bond-part'),missing=el('div','challenge-bond-part is-missing');
    known.append(el('strong','',String(question.part)),visualDots(question.part));missing.append(el('strong','','?'),el('span','','Find this part'));parts.append(known,el('span','challenge-plus','+'),missing);play.append(parts);
    const support=el('div','challenge-bond-support');support.hidden=!showHelp;support.append(visualDots(question.total,{known:question.part}),el('p','challenge-picture-caption','The empty dots are the missing part.'));play.append(support);
    const hintButton=button(showHelp?'Hide the picture hint':'Show a picture hint','button challenge-hint-button',()=>{showHelp=!showHelp;support.hidden=!showHelp;hintButton.textContent=showHelp?'Hide the picture hint':'Show a picture hint';hintButton.setAttribute('aria-expanded',String(showHelp));});hintButton.setAttribute('aria-expanded',String(showHelp));play.append(hintButton);numericAnswers(play,question.answer);
  }
  function renderFrame(play) {
    const frames=el('div','challenge-frames');frames.setAttribute('aria-label',`${question.size}-space frame`);
    for(let group=0;group<Math.ceil(question.size/10);group++) {
      const frame=el('div','challenge-frame');frame.setAttribute('role','group');frame.setAttribute('aria-label',question.size===5?'Five frame':`Ten frame ${group+1}`);
      for(let index=group*10;index<Math.min(question.size,group*10+10);index++){
        const cell=button('','challenge-cell',()=>{if(done)return;if(cells.has(index))cells.delete(index);else cells.add(index);cell.classList.toggle('is-filled',cells.has(index));cell.setAttribute('aria-pressed',String(cells.has(index)));counter.textContent=`${cells.size} filled · Make ${question.target}`;});cell.dataset.cell=String(index);cell.setAttribute('aria-label',`Space ${index+1}`);cell.setAttribute('aria-pressed','false');frame.append(cell);
      }frames.append(frame);
    }
    const counter=el('p','challenge-frame-count',`0 filled · Make ${question.target}`);counter.setAttribute('aria-live','polite');play.append(frames,counter);
    const check=button('Check my frame','button button-primary',()=>{if(done)return;if(cells.size===question.target)complete(`${question.target} ${question.target===1?'space':'spaces'} filled. You matched the number!`);else message(cells.size<question.target?`You have ${cells.size}. Add ${question.target-cells.size} more ${question.target-cells.size===1?'dot':'dots'}.`:`You have ${cells.size}. Tap ${cells.size-question.target} filled ${cells.size-question.target===1?'space':'spaces'} to take some away.`);});play.append(check);
  }
  function renderLetters(play) {
    const pairs=el('div','challenge-letter-columns');
    for(const [side,letters]of [['upper',question.upper],['lower',question.lower]]) {
      const column=el('div','challenge-letter-column');column.append(el('p','challenge-column-label',side==='upper'?'BIG LETTERS':'small letters'));
      for(const letter of letters) {
        const card=button('','challenge-letter',()=>chooseLetter(letter,side,card));card.dataset.letter=letter;card.dataset.side=side;card.setAttribute('aria-label',`${side==='upper'?'Big':'Small'} letter ${letter}`);card.setAttribute('aria-pressed','false');card.append(el('strong','',letter));
        if(profile.tier==='little')card.append(el('small','',`↔ ${side==='upper'?letter.toLowerCase():letter.toUpperCase()}`));column.append(card);
      }pairs.append(column);
    }play.append(pairs);
  }
  function chooseLetter(letter,side,card) {
    if(done||matched.has(letter.toLowerCase()))return;
    if(!selection||selection.side===side) {
      container.querySelectorAll('.challenge-letter.is-selected').forEach(node=>{node.classList.remove('is-selected');node.setAttribute('aria-pressed','false');});selection={letter,side,card};card.classList.add('is-selected');card.setAttribute('aria-pressed','true');message(`Find ${side==='upper'?'small':'big'} ${side==='upper'?letter.toLowerCase():letter.toUpperCase()}.`);return;
    }
    if(selection.letter.toLowerCase()===letter.toLowerCase()) {
      matched.add(letter.toLowerCase());for(const node of [selection.card,card]){node.classList.remove('is-selected');node.classList.add('is-matched');node.setAttribute('aria-pressed','true');node.disabled=true;}selection=null;
      if(matched.size===question.pairs.length)complete('All the letters found their partners!');else message(`${letter.toUpperCase()} and ${letter.toLowerCase()} are partners. Find another pair.`);
    }else{selection.card.classList.remove('is-selected');selection.card.setAttribute('aria-pressed','false');selection=null;message('Those letters have different names. Choose a big letter and try its small partner.');}
  }
  function renderWord(play) {
    const picture=el('div','challenge-word-picture',question.picture);picture.setAttribute('role','img');picture.setAttribute('aria-label',question.word);play.append(picture,el('p','challenge-word-clue',question.clue));
    const model=el('p','challenge-word-model',question.word);model.hidden=!showHelp;model.setAttribute('aria-label',`Word model: ${question.word}`);play.append(model);
    const hint=button(showHelp?'Hide the word hint':'Show the word hint','button challenge-hint-button',()=>{showHelp=!showHelp;model.hidden=!showHelp;hint.textContent=showHelp?'Hide the word hint':'Show the word hint';hint.setAttribute('aria-expanded',String(showHelp));});hint.setAttribute('aria-expanded',String(showHelp));if(profile.tier!=='little')play.append(hint);
    const slots=el('div','challenge-slots challenge-word-slots');slots.setAttribute('aria-label','Your word');[...question.word].forEach((letter,i)=>{const slot=el('span','challenge-slot',profile.tier==='little'?letter:'·');slot.dataset.slot=String(i);slots.append(slot);});play.append(slots);
    const tiles=el('div','challenge-tiles');
    for(const {letter,index}of question.tiles){const tile=button(letter,'challenge-tile',()=>{
      if(done)return;
      if(letter===question.word[steps.length]){steps.push(letter);tile.disabled=true;tile.classList.add('is-used');const slot=slots.children[steps.length-1];slot.textContent=letter;slot.classList.add('is-filled');if(steps.length===question.word.length)complete(`You built ${question.word}! Say the word, then try another picture.`);else message('That letter fits. What comes next?');}
      else{showHelp=true;model.hidden=false;hint.textContent='Hide the word hint';hint.setAttribute('aria-expanded','true');message('Let’s look at the word together. Find the next letter in the model.');}
    });tile.dataset.tile=String(index);tile.dataset.character=letter;tile.setAttribute('aria-label',`Letter ${letter}`);tiles.append(tile);}play.append(tiles);
  }
  function open(nextId='compare') {id=CHALLENGE_INFO[nextId]?nextId:'compare';profile=getProfile(getSettings());round=0;opened=true;reset();report();}
  function close(){opened=false;stopSpeech();}
  function settingsChanged(){profile=getProfile(getSettings());if(opened){round=0;reset();}}
  return {open,close,settingsChanged};
}
