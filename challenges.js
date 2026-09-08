import {getProfile,readStore,writeStore} from './core.js';
import {canSpeak,speak as speakText,stopSpeaking} from './speech.js';

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
  2:[['ox','🐂','A strong farm animal.'],['up','⬆️','The arrow points this way.']],
  3:[['cat','🐱','A furry friend that says meow.'],['dog','🐶','A furry friend that barks.'],['sun','☀️','It shines in the daytime sky.']],
  4:[['bus','🚌','A big vehicle that carries people.'],['hat','🎩','You can wear this on your head.'],['hen','🐔','A bird that can lay eggs.']],
  5:[['cat','🐱','A furry friend that says meow.'],['fox','🦊','An animal with a bushy tail.'],['pig','🐷','A farm animal that says oink.']],
  6:[['fish','🐟','It swims with fins.'],['duck','🦆','A bird that says quack.'],['moon','🌙','You can see it in the night sky.']],
  7:[['star','⭐','It twinkles in the sky.'],['frog','🐸','It hops and says ribbit.'],['tree','🌳','A tall plant with a trunk and branches.']],
  8:[['apple','🍎','A crisp fruit that grows on a tree.'],['tiger','🐯','A large cat with stripes.'],['train','🚂','It travels on rails.']],
  9:[['rocket','🚀','A vehicle that travels into space.'],['planet','🪐','A world that travels around a star.'],['rabbit','🐰','An animal with long ears that hops.'],['flower','🌸','It blooms on a plant.']],
  10:[['sunshine','☀️','Warm light from the sun.'],['starfish','⭐🐟','A sea animal whose name joins star and fish.'],['snowball','❄️⚪','A ball made of snow.'],['notebook','📝','A book of blank pages for notes.']],
};
function shuffled(values,seed=1) {
  const result=[...values];let state=(Math.abs(seed)+1)>>>0;
  for(let i=result.length-1;i>0;i--){state=(state*1664525+1013904223)>>>0;const j=state%(i+1);[result[i],result[j]]=[result[j],result[i]];}
  if(result.length>1&&result.every((value,i)=>value===values[i]))result.push(result.shift());
  return result;
}
function numberChoices(answer,max,profile,seed) {
  const count=Math.min(max+1,profile.choiceCount??(profile.tier==='little'?3:4)),values=new Set([answer]);
  for(let difference=1;values.size<count;difference++)for(const value of [answer-difference,answer+difference])if(value>=0&&value<=max&&values.size<count)values.add(value);
  return shuffled([...values],seed);
}
export function generateChallenge(id,profile,round=0) {
  const age=profile.challengeAge??profile.age??({little:3,explorer:6,maker:9}[profile.tier]||6);
  const tier=profile.tier||'explorer',max=profile.numberMax??[3,4,5,8,10,12,15,20,20][age-2],n=Math.max(0,Math.floor(round)||0),seed=n*17+age;
  const common={id,tier,age};
  if(id==='compare') {
    const left=(n+Math.max(1,Math.floor(max*.6)))%(max+1);
    const right=n%3===2?left:(left+1+n%Math.max(1,max-1))%(max+1),direction=age<=3||n%2===0?'more':'fewer';
    const answer=left===right?'same':(direction==='more'?left>right:left<right)?'left':'right';
    const difference=Math.abs(left-right);
    return {...common,left,right,direction,answer,followup:age===10?{answer:difference,choices:numberChoices(difference,max,profile,seed+2)}:null,prompt:`Which group has ${direction}?`,help:'Line up one dot from A with one dot from B. A group with dots left over has more. If no dots are left over, the amounts are the same.'};
  }
  if(id==='number-order') {
    const length=profile.sequenceLength??[2,3,3,4,5,5,6,6,6][age-2],step=age===10?(n%2?2:3):age===9||(age===8&&n%2===1)?2:1;
    const spread=(length-1)*step,start=(n+(age>=8?3:0))%Math.max(1,max-spread+1);
    const sequence=Array.from({length},(_,i)=>start+i*step);
    if((age===4||age===7)&&sequence.at(-1)<max)sequence[sequence.length-1]++;
    const direction=age===10&&n%2===0?'down':'up';if(direction==='down')sequence.reverse();
    return {...common,sequence,tiles:shuffled(sequence,seed),direction,step,prompt:direction==='down'?'Biggest to smallest':'Smallest to biggest',intro:direction==='down'?'Start with the biggest number. Move down the number path.':'Start with the smallest number. Keep going up.',help:`Start with ${sequence[0]}. ${step>1?`Move ${step} at a time. `:''}Look for the ${direction==='down'?'biggest':'smallest'} number left.`};
  }
  if(id==='subtraction') {
    const minimum=Math.max(2,Math.ceil(max*.6)),start=minimum+n%(max-minimum+1);
    const removed=age<=3?(n%4===3?start:1):age<=5?(n%4===3?start:1+n%Math.min(3,start)):(n*3+Math.max(2,Math.floor(max*.35)))%(start+1);
    const remaining=start-removed,ask=age===10&&n%2===0?'removed':'remaining',answer=ask==='removed'?removed:remaining;
    return {...common,start,removed,remaining,ask,answer,choices:numberChoices(answer,max,profile,seed),prompt:ask==='removed'?`${start} − ? = ${remaining}`:`${start} − ${removed} = ?`,intro:ask==='removed'?'We know how many berries are left. Find how many were taken away.':CHALLENGE_INFO.subtraction.intro,help:ask==='removed'?`Start with ${start}; ${remaining} are left. Count the crossed-out berries to find how many were taken away.`:`Start with ${start}. Cross out ${removed}. Touch and count only the berries without a cross to find what remains.`};
  }
  if(id==='number-bonds') {
    const minimum=Math.max(2,Math.ceil(max*.6)),total=age===10?20:minimum+n%(max-minimum+1),part=(n+Math.max(1,Math.floor(total*.55)))%(total+1),answer=total-part;
    return {...common,total,part,answer,choices:numberChoices(answer,max,profile,seed),prompt:`${part} + ? = ${total}`,help:`The whole is ${total}. One part is ${part}. Start at ${part} and count on until ${total}; each extra count belongs to the missing part.`};
  }
  if(id==='ten-frame') {
    const size=profile.frameSize??(age<=4?5:age<=6?10:20),target=(n+Math.ceil(max*.65))%(max+1),empty=size-target,ask=age===10&&n%2===0?'empty':'filled';
    return {...common,size,target,empty,ask,answer:target,prompt:ask==='empty'?`Leave ${empty} spaces empty`:`Make ${target}`,intro:ask==='empty'?'Tap to fill or empty spaces. Leave the number of empty spaces shown.':CHALLENGE_INFO['ten-frame'].intro,help:ask==='empty'?`There are ${size} spaces. Leave ${empty} empty and fill the rest. Count the empty spaces to check.`:`Each row holds 5. ${size>=10?'Two rows hold 10. ':''}Fill ${target} spaces from left to right. Count full rows first, then the extra dots.`};
  }
  if(id==='letter-match') {
    const length=profile.letterPairs??[1,2,3,3,4,4,5,6,6][age-2],bank=age>=7?'bdpqmnagertfhsuvwyxzociklj':'abcdefghijklmnopqrstuvwxyz';
    const pairs=Array.from({length},(_,i)=>bank[(n*2+i+Math.max(0,age-5))%bank.length]);
    const upper=pairs.map(ch=>ch.toUpperCase());
    return {...common,pairs,upper:age===10?shuffled(upper,seed+3):upper,lower:shuffled(pairs,seed),prompt:'Find the letter partners',help:age<=4?'Use the little partner model on each card. Say the letter name together, then tap its big and small forms.':'A big and a small letter share a name. Select a card, then look for its partner. Use Show partners if you want to see a model.'};
  }
  if(id==='word-build') {
    const [word,picture,clue]=WORD_BANK[age][n%WORD_BANK[age].length];
    const letters=[...word],distractorCount=age===4||age>=7?(age===10?2:1):0;
    const distractors=[...'abcdefghijklmnopqrstuvwxyz'].filter(letter=>!word.includes(letter)).slice(n%10,n%10+distractorCount);
    const tiles=shuffled([...letters.map((letter,index)=>({letter,index})),...distractors.map((letter,index)=>({letter,index:letters.length+index,distractor:true}))],seed);
    return {...common,word,picture,clue,tiles,prompt:'Build the picture word',help:age<=4?`Explore together: the word is ${word}. Match ${letters.join(', ')}, in that order. Reading on your own is not needed.`:age===10?'Look for smaller words or familiar letter groups inside the long word. Build one part, then the next. A word model is always available.':'Say the picture word. Find its first letter, then move across the word one letter at a time. Show the word hint to check any letter.'};
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
  function say(text) {if(getSettings().sound&&canSpeak())speakText(text);}
  function stopSpeech(){stopSpeaking();}
  function message(text,success=false) {feedback.textContent=text;feedback.classList.toggle('is-complete',success);}
  function complete(text='You did it! Take a moment to enjoy your discovery.') {
    if(done)return;done=true;saved[`${id}:age${profile.challengeAge}:${round%60}`]=true;writeStore('challenges-progress-v1',saved);report();
    container.querySelectorAll('[data-answer],[data-follow-answer],[data-tile],[data-cell],[data-letter]').forEach(node=>node.disabled=true);
    message(text,true);container.querySelector('.challenge-new').textContent='Play another round →';
  }
  function reset() {stopSpeech();question=generateChallenge(id,profile,round);done=false;steps=[];cells.clear();matched.clear();selection=null;showHelp=profile.challengeAge<=4;render();}
  function render() {
    const info=CHALLENGE_INFO[id];container.replaceChildren();container.classList.add('challenges-screen');container.dataset.challengeId=id;
    const header=el('header','activity-header challenge-header'),heading=el('div','challenge-heading');
    heading.append(el('p','challenge-eyebrow',info.skill),el('h1','',info.title));
    const back=button('← Home','button',()=>{close();onBack();});back.setAttribute('aria-label','Back to activities');
    header.append(back,heading,el('span','challenge-support',`Practice ${profile.challengeAge} · No rush`));container.append(header);
    const body=el('div','activity-body challenge-body'),card=el('section','challenge-card'),side=el('aside','challenge-side');
    const topline=el('div','challenge-topline');topline.append(el('span','challenge-round',`ROUND ${round+1}`),el('span','challenge-icon',info.icon));card.append(topline);
    const prompt=el('h2','challenge-prompt',question.prompt);prompt.dataset.testid='challenge-prompt';card.append(prompt,el('p','challenge-intro',question.intro||info.intro));
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
    const hear=button('♪ Hear it','button',()=>say(`${question.prompt}. ${id==='word-build'?`The word is ${question.word}.`:question.help}`));hear.dataset.challengeSpeech='';hear.hidden=!getSettings().sound||!canSpeak();help.append(hear);
    side.append(help,el('p','challenge-grownup',profile.tier==='little'?'Explore together: point, count, and say the sounds. There’s no need to read on your own.':'A hint is always welcome. Discover the pattern, then try another round.'));
    body.append(card,side);container.append(body);
  }
  function numericAnswers(play,answer,max=profile.numberMax) {
    const choices=el('div','challenge-answers');choices.setAttribute('role','group');choices.setAttribute('aria-label','Choose a number');
    for(const value of question.choices||numberChoices(answer,max,profile,round+7)) {
      const choice=button(String(value),'challenge-answer',()=>{
        if(done)return;
        if(value===answer){choice.classList.add('is-correct');complete(`${answer} — you found it! ${id==='subtraction'?`${question.start} − ${question.removed} = ${question.remaining}.`:id==='number-bonds'?`${question.part} + ${answer} = ${question.total}.`:''}`);}
        else{
          choice.classList.add('is-retry');
          if(id==='subtraction') {
            const dots=[...container.querySelectorAll('.challenge-berries .challenge-dot')].filter(dot=>dot.classList.contains('is-crossed')===(question.ask==='removed'));
            dots.forEach((dot,i)=>{dot.textContent=String(i+1);dot.classList.add('is-numbered');});
            message(`You chose ${value}. ${question.ask==='removed'?'Count the crossed-out berries; those are the ones taken away.':'Skip the crossed-out berries. Count only the berries still at the picnic.'} I numbered them to help you check.`);
          } else {
            container.querySelector('.challenge-bond-support').hidden=false;showHelp=true;
            const hint=container.querySelector('.challenge-hint-button');hint.textContent='Hide the picture hint';hint.setAttribute('aria-expanded','true');
            message(`You chose ${value}. ${question.part} plus ${value} makes ${question.part+value}; our whole is ${question.total}. Count the empty dots to find the part we still need.`);
          }
        }
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
    const model=el('div','challenge-comparison-model');model.hidden=true;
    const paired=Math.min(question.left,question.right),difference=Math.abs(question.left-question.right);
    for(let i=0;i<Math.max(question.left,question.right);i++) {
      const row=el('div','challenge-pair-row');row.append(el('span','',i<question.left?'●':''),el('span','',i<question.right?'●':''));model.append(row);
    }
    model.append(el('p','challenge-picture-caption',difference?`${paired} pairs. Group ${question.left>question.right?'A':'B'} has ${difference} extra ${difference===1?'dot':'dots'}.`:'Every dot has a partner. Both groups have the same amount.'));play.append(model);
    const reveal=()=>{model.hidden=false;message(difference?`Pair the dots. Group ${question.left>question.right?'A':'B'} has ${difference} left over, so it has more. The other group has fewer.`:'Each dot in A has a partner in B. Nothing is left over, so choose Same amount.');};
    play.append(button('Line up the dots','button challenge-hint-button',reveal));
    const answers=el('div','challenge-compare-answers');
    const comparisonComplete=value=>{
      const explanation=question.answer==='same'?`${question.left} and ${question.right} are the same amount!`:`Group ${value==='left'?'A':'B'} has ${question.direction}.`;
      if(!question.followup){complete(explanation);return;}
      answers.querySelectorAll('button').forEach(button=>button.disabled=true);
      const followup=el('div','challenge-difference');followup.append(el('h3','','How many extra dots are left over?'));
      const choices=el('div','challenge-answers');for(const amount of question.followup.choices){const choice=button(String(amount),'challenge-answer',()=>{if(done)return;if(amount===question.followup.answer){choice.classList.add('is-correct');complete(`${explanation} The difference is ${amount}: ${Math.max(question.left,question.right)} − ${Math.min(question.left,question.right)} = ${amount}.`);}else{reveal();message(`Pair each dot first. Then count only the dots without a partner to find the difference.`);}});choice.dataset.followAnswer=String(amount);choice.setAttribute('aria-label',`Difference ${amount}`);choices.append(choice);}followup.append(choices);play.append(followup);message(explanation+' One more step: find how many extra dots there are.');
    };
    for(const [value,label]of [['left','← Group A'],['same','= Same amount'],['right','Group B →']]) {
      const choice=button(label,'button challenge-compare-choice',()=>{if(done)return;if(value===question.answer){choice.classList.add('is-correct');comparisonComplete(value);}else reveal();});choice.dataset.answer=value;answers.append(choice);
    }
    play.append(answers);
  }
  function renderSequence(play) {
    const slots=el('div','challenge-slots');slots.setAttribute('aria-label','Your number path');
    question.sequence.forEach((number,i)=>{const slot=el('span','challenge-slot',profile.tier==='little'?String(number):'·');slot.dataset.slot=String(i);slots.append(slot);});play.append(slots);
    const direction=question.direction==='down'?'biggest':'smallest';
    const hint=el('p','challenge-action-hint',profile.tier==='little'?`First find ${question.sequence[0]}.`:`Choose the ${direction} number first.`);play.append(hint);
    const showNext=()=>{if(done)return;const next=question.sequence[steps.length];container.querySelector(`[data-tile="${next}"]`).classList.add('is-suggested');message(`${steps.length?`After ${steps.at(-1)},`:'Start here:'} choose ${next}. ${question.step>1?`This path moves ${question.step} at a time.`:`It is the ${direction} number left.`}`);};
    play.append(button('Show my next step','button challenge-hint-button',showNext));
    const tiles=el('div','challenge-tiles');
    for(const value of question.tiles){const tile=button(String(value),'challenge-tile',()=>{
      if(done)return;
      if(value===question.sequence[steps.length]){steps.push(value);tile.disabled=true;tile.classList.remove('is-suggested');tile.classList.add('is-used');const slot=slots.children[steps.length-1];slot.textContent=String(value);slot.classList.add('is-filled');if(steps.length===question.sequence.length)complete(`You put every number in order, moving ${question.direction==='down'?'down':'up'} the path!`);else{hint.textContent=profile.tier==='little'?`Next find ${question.sequence[steps.length]}.`:`Now find the ${direction} number left.`;message(`${value} fits here. Keep moving ${question.direction==='down'?'down':'up'}.`);}}
      else showNext();
    });tile.dataset.tile=String(value);tile.setAttribute('aria-label',`Number ${value}`);tiles.append(tile);}play.append(tiles);
  }
  function renderSubtraction(play) {
    const picture=el('div','challenge-picnic');picture.append(visualDots(question.start,{crossed:question.removed,berries:true}),el('p','challenge-picture-caption',question.ask==='removed'?`We started with ${question.start}. ${question.remaining} are left. Find how many went away.`:`${question.removed} ${question.removed===1?'berry':'berries'} taken away`));play.append(picture,button('Show what to count','button challenge-hint-button',hint));numericAnswers(play,question.answer);
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
        const cell=button('','challenge-cell',()=>{if(done)return;if(cells.has(index))cells.delete(index);else cells.add(index);cell.classList.remove('is-suggested');cell.classList.toggle('is-filled',cells.has(index));cell.setAttribute('aria-pressed',String(cells.has(index)));counter.textContent=question.ask==='empty'?`${cells.size} filled · ${question.size-cells.size} empty`:`${cells.size} filled · Make ${question.target}`;});cell.dataset.cell=String(index);cell.setAttribute('aria-label',`Space ${index+1}`);cell.setAttribute('aria-pressed','false');frame.append(cell);
      }frames.append(frame);
    }
    const counter=el('p','challenge-frame-count',question.ask==='empty'?`0 filled · ${question.size} empty`:`0 filled · Make ${question.target}`);counter.setAttribute('aria-live','polite');play.append(frames,counter);
    play.append(button('Show a frame strategy','button challenge-hint-button',hint));
    const check=button('Check my frame','button button-primary',()=>{if(done)return;if(cells.size===question.target)complete(question.ask==='empty'?`${question.target} filled and ${question.empty} empty. You left exactly ${question.empty} spaces!`:`${question.target} ${question.target===1?'space':'spaces'} filled. You matched the number!`);else message((question.ask==='empty'?`${question.size-cells.size} spaces are empty; we want ${question.empty}. `:'')+(cells.size<question.target?`You have ${cells.size}. Add ${question.target-cells.size} more ${question.target-cells.size===1?'dot':'dots'}.`:`You have ${cells.size}. Tap ${cells.size-question.target} filled ${cells.size-question.target===1?'space':'spaces'} to take some away.`));});play.append(check);
  }
  function renderLetters(play) {
    const pairs=el('div','challenge-letter-columns');
    for(const [side,letters]of [['upper',question.upper],['lower',question.lower]]) {
      const column=el('div','challenge-letter-column');column.append(el('p','challenge-column-label',side==='upper'?'BIG LETTERS':'small letters'));
      for(const letter of letters) {
        const card=button('','challenge-letter',()=>chooseLetter(letter,side,card));card.dataset.letter=letter;card.dataset.side=side;card.setAttribute('aria-label',`${side==='upper'?'Big':'Small'} letter ${letter}`);card.setAttribute('aria-pressed','false');card.append(el('strong','',letter));
        const model=el('small','challenge-partner-model',`↔ ${side==='upper'?letter.toLowerCase():letter.toUpperCase()}`);model.hidden=!showHelp;card.append(model);column.append(card);
      }pairs.append(column);
    }play.append(pairs);
    play.append(button('Show partners','button challenge-hint-button',()=>{container.querySelectorAll('.challenge-partner-model').forEach(node=>node.hidden=false);message('Each card now shows its partner. Say the letter name, then match the two forms.');}));
  }
  function chooseLetter(letter,side,card) {
    if(done||matched.has(letter.toLowerCase()))return;
    if(!selection||selection.side===side) {
      container.querySelectorAll('.challenge-letter.is-selected').forEach(node=>{node.classList.remove('is-selected');node.setAttribute('aria-pressed','false');});selection={letter,side,card};card.classList.add('is-selected');card.setAttribute('aria-pressed','true');message(`Find ${side==='upper'?'small':'big'} ${side==='upper'?letter.toLowerCase():letter.toUpperCase()}.`);return;
    }
    if(selection.letter.toLowerCase()===letter.toLowerCase()) {
      matched.add(letter.toLowerCase());for(const node of [selection.card,card]){node.classList.remove('is-selected');node.classList.add('is-matched');node.setAttribute('aria-pressed','true');node.disabled=true;}selection=null;
      if(matched.size===question.pairs.length)complete('All the letters found their partners!');else message(`${letter.toUpperCase()} and ${letter.toLowerCase()} are partners. Find another pair.`);
    }else{const wanted=selection.letter.toLowerCase();selection.card.classList.remove('is-selected');selection.card.setAttribute('aria-pressed','false');selection=null;container.querySelectorAll('.challenge-partner-model').forEach(node=>node.hidden=false);message(`${wanted.toUpperCase()} and ${wanted} share a name. Look at the small partner models on the cards and try that pair.`);}
  }
  function renderWord(play) {
    const picture=el('div','challenge-word-picture',question.picture);picture.setAttribute('role','img');picture.setAttribute('aria-label',question.word);play.append(picture,el('p','challenge-word-clue',question.clue));
    const model=el('p','challenge-word-model',question.word);model.hidden=!showHelp;model.setAttribute('aria-label',`Word model: ${question.word}`);play.append(model);
    const hint=button(showHelp?'Hide the word hint':'Show the word hint','button challenge-hint-button',()=>{showHelp=!showHelp;model.hidden=!showHelp;hint.textContent=showHelp?'Hide the word hint':'Show the word hint';hint.setAttribute('aria-expanded',String(showHelp));});hint.setAttribute('aria-expanded',String(showHelp));if(profile.tier!=='little')play.append(hint);
    const slots=el('div','challenge-slots challenge-word-slots');slots.setAttribute('aria-label','Your word');[...question.word].forEach((letter,i)=>{const slot=el('span','challenge-slot',profile.tier==='little'?letter:'·');slot.dataset.slot=String(i);slots.append(slot);});play.append(slots);
    const tiles=el('div','challenge-tiles');
    const showNext=()=>{if(done)return;showHelp=true;model.hidden=false;hint.textContent='Hide the word hint';hint.setAttribute('aria-expanded','true');const next=question.word[steps.length];container.querySelector(`[data-character="${next}"]:not(:disabled)`).classList.add('is-suggested');message(`The word is ${question.word}. ${steps.length?`You have ${steps.join('')}. `:''}Find ${next} for space ${steps.length+1}.`);};
    play.append(button('Show next letter','button challenge-hint-button',showNext));
    for(const {letter,index}of question.tiles){const tile=button(letter,'challenge-tile',()=>{
      if(done)return;
      if(letter===question.word[steps.length]){steps.push(letter);tile.disabled=true;tile.classList.remove('is-suggested');tile.classList.add('is-used');const slot=slots.children[steps.length-1];slot.textContent=letter;slot.classList.add('is-filled');if(steps.length===question.word.length)complete(`You built ${question.word}! Say the word, then try another picture.`);else message(`${letter} fits in space ${steps.length}. Move to the next letter in the word.`);}
      else showNext();
    });tile.dataset.tile=String(index);tile.dataset.character=letter;tile.setAttribute('aria-label',`Letter ${letter}`);tiles.append(tile);}play.append(tiles);
  }
  function open(nextId='compare') {id=CHALLENGE_INFO[nextId]?nextId:'compare';profile=getProfile(getSettings());round=0;opened=true;reset();report();}
  function close(){opened=false;stopSpeech();}
  function hint() {
    if(!opened||done)return;
    if(id==='subtraction') {
      const dots=[...container.querySelectorAll('.challenge-berries .challenge-dot')].filter(dot=>dot.classList.contains('is-crossed')===(question.ask==='removed'));
      dots.forEach((dot,i)=>{dot.textContent=String(i+1);dot.classList.add('is-numbered');});message(question.help+' The dots to count now have number labels.');
    }else if(id==='ten-frame') {
      const needsMore=cells.size<question.target,index=needsMore?Array.from({length:question.size},(_,i)=>i).find(i=>!cells.has(i)):[...cells].at(-1);
      if(cells.size===question.target){message('Your frame has the right amount. Press Check my frame to check your work.');return;}
      container.querySelector(`[data-cell="${index}"]`).classList.add('is-suggested');message(`${question.help} ${needsMore?'Fill':'Empty'} the highlighted space, then check how many you have.`);
    }else if(id==='number-bonds') {
      const support=container.querySelector('.challenge-bond-support');support.hidden=false;showHelp=true;const button=container.querySelector('.challenge-hint-button');button.textContent='Hide the picture hint';button.setAttribute('aria-expanded','true');message(question.help+' The empty dots show the missing part.');
    }else {
      const label={compare:'Line up the dots','number-order':'Show my next step','letter-match':'Show partners','word-build':'Show next letter'}[id];
      [...container.querySelectorAll('button')].find(button=>button.textContent===label)?.click();
    }
  }
  function settingsChanged(){const next=getProfile(getSettings()),changed=next.challengeAge!==profile.challengeAge;profile=next;if(!opened)return;if(changed){round=0;reset();}else container.querySelectorAll('[data-challenge-speech]').forEach(node=>node.hidden=!getSettings().sound||!canSpeak());if(!getSettings().sound)stopSpeech();}
  return {open,close,settingsChanged,hint};
}
