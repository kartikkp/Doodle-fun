import {beginRound,recordMistake,recordHint,completeRound,getRoundCursor} from './progression.js';
import {getProfile,readStore,writeStore} from './core.js';
import {objectArt} from './activity-art.js';
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
  9:[['careful','◇','Taking time to avoid a mistake or danger.'],['hopeful','☀','Expecting something good to happen.'],['rebuild','▧','To construct something again after it was damaged.'],['unkind','◒','Not considerate of another person’s feelings.'],['predict','↗','To say what you think will happen next.'],['fearless','☆','Showing courage instead of being afraid.']],
  10:[['fraction','◒','A number that describes part of a whole.'],['electric','ϟ','Powered by a flow of charge, like a plugged-in lamp.'],['boundary','▧','A dividing line at the edge of an area.'],['symmetry','◇','A property of a shape whose two halves match when folded.'],['evidence','⌕','Facts or observations that support an explanation.'],['decision','↗','A choice made after thinking about the possibilities.']],
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
function placeValueChoices(answer,max,profile,seed) {
  const count=profile.choiceCount??4,values=new Set([answer]);
  // Reserve a same-ones error before nearby answers can fill every slot. A
  // child must check the tens/hundreds instead of solving by the last digit.
  const placeError=shuffled([10,-10,100,-100,20,-20],seed).map(difference=>answer+difference).find(value=>value>=0&&value<=max);
  if(count>1&&placeError!==undefined)values.add(placeError);
  for(const difference of shuffled([10,1,100,20,2],seed))for(const value of [answer+difference,answer-difference])if(value>=0&&value<=max&&values.size<count)values.add(value);
  return shuffled([...values],seed+1);
}
function expandedNumber(number) {
  const hundreds=Math.floor(number/100)*100,tens=Math.floor(number%100/10)*10,ones=number%10;
  return [hundreds,tens,ones].filter(Boolean).join(' + ')||'0';
}
function olderMath(id,profile,age,n,seed) {
  const maxValue=age===8?99:age===9?499:999,common={id,tier:profile.tier,age,model:'place-value',maxValue};
  if(id==='compare') {
    const left=age===8?24+n*13%60:age===9?124+n*37%290:224+n*71%680;
    const gap=(age===8?[1,10,21]:[1,10,100,21])[n%(age===8?3:4)];
    const right=n%3===2?left:Math.max(0,Math.min(maxValue,left+(Math.floor(n/2)%2?-gap:gap))),direction=n%2?'fewer':'more';
    const answer=left===right?'same':(direction==='more'?left>right:left<right)?'left':'right',difference=Math.abs(left-right);
    return {...common,left,right,direction,answer,followup:age>=9?{answer:difference,choices:placeValueChoices(difference,maxValue,profile,seed+2)}:null,prompt:`Which number is ${direction==='more'?'greater':'smaller'}?`,intro:age>=9?'Compare the place values. Then work out the difference.':'Use tens and ones to compare the two numbers.',help:'Compare from the largest place: hundreds, then tens, then ones. Stop at the first different digit. Equal digits in every place mean equal numbers.',strategy:`A: ${expandedNumber(left)}. B: ${expandedNumber(right)}. Compare the largest place first. For the difference, subtract the smaller number from the larger number.`};
  }
  if(id==='number-order') {
    const length=profile.sequenceLength??6,step=(age===8?[2,5,10]:age===9?[5,10,25]:[7,12,25,50])[n%(age===10?4:3)];
    const spread=(length-1)*step,minimum=age===8?12:age===9?105:210,start=minimum+(n*17)%(maxValue-minimum-spread+1);
    const sequence=Array.from({length},(_,i)=>start+i*step),direction=age>=9&&n%2===0?'down':'up';if(direction==='down')sequence.reverse();
    return {...common,sequence,tiles:shuffled(sequence,seed),direction,step,prompt:direction==='down'?'Biggest to smallest':'Smallest to biggest',intro:`Put all the numbers in order. This path crosses ${age===8?'tens':'tens and hundreds'}.`,help:'Compare the largest place first. When those digits match, compare the next place. Look for the size of the gap between neighbors.'};
  }
  if(id==='subtraction') {
    const start=age===8?42+n*7%50:age===9?132+n*31%350:412+n*43%570;
    const removed=age===8?17+n*3%20:age===9?57+n*17%70:157+n*19%160,remaining=start-removed;
    const ask=age===10?['removed','remaining','start'][n%3]:age===9&&n%2===1?'removed':'remaining',answer={start,removed,remaining}[ask];
    const prompt=`${ask==='start'?'?':start} − ${ask==='removed'?'?':removed} = ${ask==='remaining'?'?':remaining}`;
    const help=ask==='start'?'The starting amount includes what was taken away and what remains. Which operation puts those parts back together?':ask==='removed'?'Find the gap between the starting amount and the amount left. You can count up or subtract.':'Work in hundreds, tens and ones. You may need to exchange one ten for ten ones, or one hundred for ten tens. Check with addition.';
    const strategy=ask==='start'?`Combine ${removed} (${expandedNumber(removed)}) and ${remaining} (${expandedNumber(remaining)}). Regroup when a place reaches ten.`:ask==='removed'?`Start at ${remaining} and count up to ${start}. Try a jump to the next ten, then use tens or hundreds. Add the jumps.`:`Start with ${expandedNumber(start)}. Take away ${expandedNumber(removed)}. If a place is too small, exchange from the place to its left.`;
    return {...common,start,removed,remaining,ask,answer,choices:placeValueChoices(answer,maxValue,profile,seed),prompt,intro:ask==='start'?'Find the starting amount before some were taken away.':ask==='removed'?'Find how many were taken away.':'Use place value to find what remains.',help,strategy};
  }
  if(id==='number-bonds') {
    const total=age===8?42+n*7%50:age===9?143+n*29%340:413+n*41%570;
    const firstPart=age===8?17+n*3%20:age===9?58+n*13%70:168+n*17%160,secondPart=total-firstPart;
    const ask=age>=9?['second','first','total'][n%3]:'second',part=ask==='first'?secondPart:firstPart,answer={first:firstPart,second:secondPart,total}[ask];
    const prompt=`${ask==='first'?'?':firstPart} + ${ask==='second'?'?':secondPart} = ${ask==='total'?'?':total}`;
    return {...common,total,part,firstPart,secondPart,ask,answer,choices:placeValueChoices(answer,maxValue,profile,seed),prompt,intro:ask==='total'?'Combine the parts. Regroup to find the whole.':'Find the missing part. Use the whole to check your answer.',help:ask==='total'?'Add the ones, then the tens, then the hundreds. Ten ones make a ten; ten tens make a hundred.':'A whole is made of both parts. Find the gap from the known part to the whole, then check by adding the parts.',strategy:ask==='total'?`Break the parts into place values: ${firstPart} = ${expandedNumber(firstPart)}; ${secondPart} = ${expandedNumber(secondPart)}. Combine the matching places.`:`Count up from ${part} to ${total}, using convenient tens and hundreds. Add your jumps. Or subtract ${part} from ${total}.`};
  }
  return null;
}
function generateBaseChallenge(id,profile,round=0) {
  const age=profile.challengeAge??profile.age??({little:3,explorer:6,maker:9}[profile.tier]||6);
  const tier=profile.tier||'explorer',max=profile.numberMax??[3,4,5,8,10,12,15,20,20][age-2],n=Math.max(0,Math.floor(round)||0),seed=n*17+age;
  const common={id,tier,age};
  if(age>=8){const question=olderMath(id,profile,age,n,seed);if(question)return question;}
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
    const size=profile.frameSize??(age<=4?5:age<=6?10:20);let target=(n+Math.ceil(max*.65))%(max+1);const empty=size-target;
    let ask=age===10&&n%2===0?'empty':'filled',prompt=`Make ${target}`,intro='Tap spaces to build the amount. Work it out before you check.',help=`A full row holds five. Count full rows, then the extra spaces. The whole frame has ${size} spaces.`;
    if(age===5&&n%2){ask='empty';prompt=`Leave ${empty} spaces empty`;}
    if(age===6){const part=Math.floor(target/2);prompt=`Make ${part} + ${target-part}`;}
    if(age===7){const whole=target+3+n%5;prompt=`${whole} − ${whole-target}: build what remains`;}
    if(age===8){prompt=`Fill ${target}/20 of the frame`;help='The denominator is the number of equal spaces in the whole. The numerator tells how many of those spaces to fill.';}
    if(age===9){prompt=`Fill ${target*2}/40 of this 20-space frame`;help='Find an equivalent fraction with twenty as the denominator. Change the numerator by the same factor.';}
    if(age===10){const denominator=[4,5,10][n%3],first=1+Math.floor(n/3)%(denominator-1),firstSpaces=first*20/denominator,second=1+n*7%(19-firstSpaces);target=firstSpaces+second;prompt=`${ask==='empty'?'Leave':'Fill'} ${first}/${denominator} + ${second}/20 of the frame${ask==='empty'?' empty':''}`;help='Rename both fractions as twentieths, then add their numerators. Check whether the question asks for filled or empty spaces.';}
    const answer=age===10&&ask==='empty'?size-target:target;
    return {...common,size,target:answer,empty:size-answer,ask,answer,prompt,intro,help};
  }
  if(id==='letter-match') {
    const length=profile.letterPairs??3;
    if(age>=7) {
      const banks={
        7:[['rain','train'],['light','night'],['bear','chair'],['boat','coat'],['moon','spoon'],['tree','bee'],['blue','shoe'],['cake','snake']],
        8:[['un-','not'],['re-','again'],['pre-','before'],['mis-','wrongly'],['dis-','opposite of'],['sub-','under'],['over-','too much'],['bi-','two']],
        9:[['-ful','full of'],['-less','without'],['-er','person who does'],['-ment','result or process'],['-able','can be'],['-ness','state of being'],['-ly','in a certain way'],['-ology','study of']],
        10:[['spect','look'],['port','carry'],['struct','build'],['aud','hear'],['tele','far'],['graph','write'],['photo','light'],['bio','life'],['chrono','time'],['geo','earth']]
      };
      const bank=banks[age],relationships=Array.from({length},(_,i)=>{const [upper,lower]=bank[(n*3+i)%bank.length];return {upper,lower,key:upper};});
      return {...common,pairs:relationships.map(pair=>pair.key),relationships,upper:shuffled(relationships.map(pair=>pair.upper),seed+1),lower:shuffled(relationships.map(pair=>pair.lower),seed),labels:{upper:age===7?'WORD':age===8?'PREFIX':age===9?'SUFFIX':'ROOT',lower:age===7?'RHYMING PARTNER':'MEANING'},prompt:age===7?'Connect the rhyming words':age===8?'Match each prefix to its meaning':age===9?'Match each suffix to its meaning':'Connect word roots and meanings',intro:age===7?'Listen to the ending sounds, not just the last letter.':'Use word parts to work out meaning.',help:age===7?'Say each word slowly. Rhyming partners share the ending sound.':'Think of a word that uses the part. For example, think about what changes when that part is added.'};
    }
    const bank=age>=6?'bdpqmnagertfhsuvwyxzociklj':'abcdefghijklmnopqrstuvwxyz';
    const pairs=Array.from({length},(_,i)=>bank[(n*2+i+Math.max(0,age-5))%bank.length]),upper=shuffled(pairs.map(ch=>ch.toUpperCase()),seed+3);
    return {...common,pairs,upper,lower:shuffled(pairs,seed),prompt:'Find the letter partners',help:'A capital and a little letter share a name. Compare their shapes. Request Show partners if you want a model.'};
  }
  if(id==='word-build') {
    const [word,picture,clue]=WORD_BANK[age][n%WORD_BANK[age].length];
    const letters=[...word],distractorCount=age===4||age>=7?(age===10?2:1):0;
    const distractors=[...'abcdefghijklmnopqrstuvwxyz'].filter(letter=>!word.includes(letter)).slice(n%10,n%10+distractorCount);
    const tiles=shuffled([...letters.map((letter,index)=>({letter,index})),...distractors.map((letter,index)=>({letter,index:letters.length+index,distractor:true}))],seed);
    return {...common,word,picture,clue,tiles,prompt:age>=8?'Solve the clue and build the word':'Build the picture word',help:age<=4?`Explore together: the word is ${word}. Match ${letters.join(', ')}, in that order. Reading on your own is not needed.`:age===10?'Look for smaller words or familiar letter groups inside the long word. Build one part, then the next. A word model is always available.':'Say the picture word. Find its first letter, then move across the word one letter at a time. Show the word hint to check any letter.'};
  }
  throw new Error(`Unknown challenge: ${id}`);
}

export function generateChallenge(id,profile,round=0) {
  const q=generateBaseChallenge(id,profile,round);
  if(q.age!==10||q.model!=='place-value')return q;
  const label=n=>(n/100).toFixed(2);
  // Store hundredths as integers so exact-value checks never depend on binary
  // floating point. Only presentation and strategy use decimal notation.
  return {...q,answerScale:100,prompt:q.prompt.replace(/\d+/g,n=>label(Number(n))),
    intro:id==='number-order'?'Order decimal amounts. Compare whole units, then tenths and hundredths.':id==='compare'?'Compare the decimal amounts, then find their difference.':q.intro,
    help:'Line up the decimal points. Compare or combine matching places: ones, tenths, then hundredths. Ten hundredths make one tenth.',
    strategy:id==='compare'?`Compare ${label(q.left)} and ${label(q.right)} from left to right. For the difference, subtract the smaller amount from the larger.`:id==='number-order'?'Check ones first. If those are equal, compare tenths and then hundredths.':`Keep every digit in its place. Exchange one tenth for ten hundredths if needed. Use the opposite operation to check the missing amount.`};
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

export function createChallenges(container,{getSettings,getTitle=()=>null,onBack=()=>{},onNotice=()=>{},onProgress=()=>{}}) {
  let opened=false,id='compare',profile=getProfile(getSettings()),round=0,question,done=false,steps=[],cells=new Set(),matched=new Set(),selection=null,showHelp=false,feedback;
  const stored=readStore('challenges-progress-v1',{});
  const saved=stored&&typeof stored==='object'&&!Array.isArray(stored)?Object.fromEntries(Object.entries(stored).filter(([key,value])=>value===true&&Object.keys(CHALLENGE_INFO).some(id=>key.startsWith(`${id}:`))).slice(0,1000)):{};
  function report(){onProgress({completedCount:Object.keys(saved).length,source:'challenges'});}
  const numberLabel=value=>question?.answerScale===100?(value/100).toFixed(2):String(value);
  function say(text) {if(canSpeak())speakText(text);}
  function stopSpeech(){stopSpeaking();}
  function message(text,success=false) {feedback.textContent=text;feedback.classList.toggle('is-complete',success);}
  function complete(text='You did it! Take a moment to enjoy your discovery.') {
    if(done)return;done=true;completeRound();saved[`${id}:age${profile.challengeAge}:${round%60}`]=true;writeStore('challenges-progress-v1',saved);report();
    container.querySelectorAll('[data-answer],[data-follow-answer],[data-tile],[data-cell],[data-letter]').forEach(node=>node.disabled=true);
    message(text,true);container.querySelector('.challenge-new').textContent='Play another round →';
  }
  function reset() {stopSpeech();question=generateChallenge(id,profile,round);done=false;steps=[];cells.clear();matched.clear();selection=null;showHelp=false;render();}
  function render() {
    beginRound({mode:id,age:profile.age,step:profile.challengeAge,roundKey:String(round)});
    const info=CHALLENGE_INFO[id];container.replaceChildren();container.classList.add('challenges-screen');container.dataset.challengeId=id;
    const header=el('header','activity-header challenge-header'),heading=el('div','challenge-heading');
    heading.append(el('p','challenge-eyebrow',info.skill),el('h1','',getTitle() || info.title));
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
    const help=el('details','challenge-help');help.append(el('summary','','Hint · a strategy'),el('p','',question.help));help.addEventListener('toggle',()=>{if(help.open&&help.isConnected&&opened)recordHint();});
    const hear=button('♪ Hear it','button',()=>say(id==='word-build'?`Build the word for this clue. ${question.clue}`:question.prompt));hear.dataset.challengeSpeech='';hear.hidden=!canSpeak();hear.textContent='♪';hear.setAttribute('aria-label','Hear the question');header.append(hear);
    side.append(help,el('p','challenge-grownup',profile.tier==='little'?'Explore together: point, count, and say the sounds. There’s no need to read on your own.':'A hint is always welcome. Discover the pattern, then try another round.'));
    body.append(card,side);container.append(body);
  }
  function numericAnswers(play,answer,max=profile.numberMax) {
    const choices=el('div','challenge-answers');choices.setAttribute('role','group');choices.setAttribute('aria-label','Choose a number');
    for(const value of question.choices||numberChoices(answer,max,profile,round+7)) {
      const choice=button(numberLabel(value),'challenge-answer',()=>{
        if(done)return;
        if(value===answer){choice.classList.add('is-correct');complete(`${numberLabel(answer)} — you found it! ${id==='subtraction'?`${numberLabel(question.start)} − ${numberLabel(question.removed)} = ${numberLabel(question.remaining)}.`:id==='number-bonds'?`${numberLabel(question.firstPart??question.part)} + ${numberLabel(question.secondPart??answer)} = ${numberLabel(question.total)}.`:''}`);}
        else{
          recordMistake();choice.classList.add('is-retry');
          message(`You chose ${numberLabel(value)}. That does not fit yet. Try again, or open Hint for a strategy.`);
        }
      });choice.dataset.answer=String(value);choice.setAttribute('aria-label',`Answer ${numberLabel(value)}`);choices.append(choice);
    }
    play.append(choices);
  }
  function renderStrategy(play) {
    const support=el('div','challenge-place-support',question.strategy);support.hidden=true;support.dataset.testid='place-value-strategy';
    const toggle=button('Show a place-value strategy','button challenge-hint-button',()=>{support.hidden=!support.hidden;if(!support.hidden)recordHint();toggle.textContent=support.hidden?'Show a place-value strategy':'Hide the strategy';toggle.setAttribute('aria-expanded',String(!support.hidden));});toggle.setAttribute('aria-expanded','false');
    play.append(toggle,support);
  }
  function renderCompare(play) {
    const older=question.model==='place-value';
    const groups=el('div','challenge-compare-groups');
    for(const [label,value,tone]of [['A',question.left,'purple'],['B',question.right,'green']]) {
      const group=el('div',`challenge-quantity is-${tone}`);group.append(el('span','challenge-group-name',`${older?'Number':'Group'} ${label}`));if(!older)group.append(visualDots(value));group.append(el('strong','challenge-quantity-number',numberLabel(value)));groups.append(group);
    }
    play.append(groups);
    const model=el('div','challenge-comparison-model');model.hidden=true;
    const paired=Math.min(question.left,question.right),difference=Math.abs(question.left-question.right);
    for(let i=0;!older&&i<Math.max(question.left,question.right);i++) {
      const row=el('div','challenge-pair-row');row.append(el('span','',i<question.left?'●':''),el('span','',i<question.right?'●':''));model.append(row);
    }
    model.append(el('p','challenge-picture-caption',older?question.strategy:difference?`${paired} pairs. Group ${question.left>question.right?'A':'B'} has ${difference} extra ${difference===1?'dot':'dots'}.`:'Every dot has a partner. Both groups have the same amount.'));play.append(model);
    const reveal=()=>{recordHint();model.hidden=false;message(older?question.help:difference?`Pair the dots. Group ${question.left>question.right?'A':'B'} has ${difference} left over, so it has more. The other group has fewer.`:'Each dot in A has a partner in B. Nothing is left over, so choose Same amount.');};
    play.append(button(older?'Compare place values':'Line up the dots','button challenge-hint-button',reveal));
    const answers=el('div','challenge-compare-answers');
    const comparisonComplete=value=>{
      const explanation=question.answer==='same'?`${numberLabel(question.left)} and ${numberLabel(question.right)} are the same amount!`:older?`Number ${value==='left'?'A':'B'} is ${question.direction==='more'?'greater':'smaller'}.`:`Group ${value==='left'?'A':'B'} has ${question.direction}.`;
      if(!question.followup){complete(explanation);return;}
      answers.querySelectorAll('button').forEach(button=>button.disabled=true);
      const followup=el('div','challenge-difference');followup.append(el('h3','',older?'What is the difference?':'How many extra dots are left over?'));
      const choices=el('div','challenge-answers');for(const amount of question.followup.choices){const choice=button(numberLabel(amount),'challenge-answer',()=>{if(done)return;if(amount===question.followup.answer){choice.classList.add('is-correct');complete(`${explanation} The difference is ${numberLabel(amount)}: ${numberLabel(Math.max(question.left,question.right))} − ${numberLabel(Math.min(question.left,question.right))} = ${numberLabel(amount)}.`);}else{recordMistake();message(older?'Subtract the smaller number from the larger. Try counting up in tens and ones to check the gap.':'Pair each dot first. Then count only the dots without a partner to find the difference.');}});choice.dataset.followAnswer=String(amount);choice.setAttribute('aria-label',`Difference ${numberLabel(amount)}`);choices.append(choice);}followup.append(choices);play.append(followup);message(explanation+(older?' One more step: find the difference.':' One more step: find how many extra dots there are.'));
    };
    for(const [value,label]of [['left',older?'← Number A':'← Group A'],['same','= Same amount'],['right',older?'Number B →':'Group B →']]) {
      const choice=button(label,'button challenge-compare-choice',()=>{if(done)return;if(value===question.answer){choice.classList.add('is-correct');comparisonComplete(value);}else {recordMistake();message("That does not fit the question yet. Compare again, or ask for a hint.");}});choice.dataset.answer=value;answers.append(choice);
    }
    play.append(answers);
  }
  function renderSequence(play) {
    const slots=el('div','challenge-slots');slots.setAttribute('aria-label','Your number path');
    if(question.model==='place-value')slots.classList.add('challenge-number-slots');
    question.sequence.forEach((number,i)=>{const slot=el('span','challenge-slot','·');slot.dataset.slot=String(i);slots.append(slot);});play.append(slots);
    const direction=question.direction==='down'?'biggest':'smallest';
    const hint=el('p','challenge-action-hint',`Choose the ${direction} number first.`);play.append(hint);
    const showNext=()=>{if(done)return;recordHint();const next=question.sequence[steps.length];container.querySelector(`[data-tile="${next}"]`).classList.add('is-suggested');message(`${steps.length?`After ${numberLabel(steps.at(-1))},`:'Start here:'} choose ${numberLabel(next)}. ${question.step>1?`This path moves ${numberLabel(question.step)} at a time.`:`It is the ${direction} number left.`}`);};
    play.append(button('Show my next step','button challenge-hint-button',showNext));
    const tiles=el('div','challenge-tiles');
    for(const value of question.tiles){const tile=button(numberLabel(value),'challenge-tile',()=>{
      if(done)return;
      if(value===question.sequence[steps.length]){steps.push(value);tile.disabled=true;tile.classList.remove('is-suggested');tile.classList.add('is-used');const slot=slots.children[steps.length-1];slot.textContent=numberLabel(value);slot.classList.add('is-filled');if(steps.length===question.sequence.length)complete(`You put every number in order, moving ${question.direction==='down'?'down':'up'} the path!`);else{hint.textContent=`Now find the ${direction} number left.`;message(`${numberLabel(value)} fits here. Keep moving ${question.direction==='down'?'down':'up'}.`);}}
      else {recordMistake();message("That does not fit here yet. Try again, or request the next-step hint.");}
    });tile.dataset.tile=String(value);tile.setAttribute('aria-label',`Number ${numberLabel(value)}`);tiles.append(tile);}play.append(tiles);
  }
  function renderSubtraction(play) {
    if(question.model==='place-value') {
      const parts=el('div','challenge-calculation-parts');
      for(const [key,label]of [['start','START'],['removed','TAKE AWAY'],['remaining','LEFT']]){const part=el('div',`challenge-calculation-part${question.ask===key?' is-missing':''}`);part.append(el('span','',label),el('strong','',question.ask===key?'?':numberLabel(question[key])));parts.append(part);}
      play.append(parts);renderStrategy(play);numericAnswers(play,question.answer,question.maxValue);return;
    }
    const picture=el('div','challenge-picnic');picture.append(visualDots(question.start,{crossed:question.removed,berries:true}),el('p','challenge-picture-caption',question.ask==='removed'?`We started with ${numberLabel(question.start)}. ${numberLabel(question.remaining)} are left. Find how many went away.`:`${numberLabel(question.removed)} ${question.removed===1?'berry':'berries'} taken away`));play.append(picture,button('Show what to count','button challenge-hint-button',hint));numericAnswers(play,question.answer);
  }
  function renderBonds(play) {
    if(question.model==='place-value') {
      const whole=el('div','challenge-whole');whole.append(el('span','','WHOLE'),el('strong','',question.ask==='total'?'?':numberLabel(question.total)));play.append(whole);
      const parts=el('div','challenge-bond-parts');for(const [index,key]of ['first','second'].entries()){if(index)parts.append(el('span','challenge-plus','+'));const part=el('div',`challenge-bond-part${question.ask===key?' is-missing':''}`);part.append(el('span','','PART'),el('strong','',question.ask===key?'?':numberLabel(question[`${key}Part`])));parts.append(part);}play.append(parts);
      renderStrategy(play);numericAnswers(play,question.answer,question.maxValue);return;
    }
    const whole=el('div','challenge-whole');whole.append(el('span','','ALTOGETHER'),el('strong','',numberLabel(question.total)));play.append(whole);
    const parts=el('div','challenge-bond-parts'),known=el('div','challenge-bond-part'),missing=el('div','challenge-bond-part is-missing');
    known.append(el('strong','',String(question.part)),visualDots(question.part));missing.append(el('strong','','?'),el('span','','Find this part'));parts.append(known,el('span','challenge-plus','+'),missing);play.append(parts);
    const support=el('div','challenge-bond-support');support.hidden=!showHelp;support.append(visualDots(question.total,{known:question.part}),el('p','challenge-picture-caption','The empty dots are the missing part.'));play.append(support);
    const hintButton=button(showHelp?'Hide the picture hint':'Show a picture hint','button challenge-hint-button',()=>{showHelp=!showHelp;if(showHelp)recordHint();support.hidden=!showHelp;hintButton.textContent=showHelp?'Hide the picture hint':'Show a picture hint';hintButton.setAttribute('aria-expanded',String(showHelp));});hintButton.setAttribute('aria-expanded',String(showHelp));play.append(hintButton);numericAnswers(play,question.answer);
  }
  function renderFrame(play) {
    const frames=el('div','challenge-frames');frames.setAttribute('aria-label',`${question.size}-space frame`);
    for(let group=0;group<Math.ceil(question.size/10);group++) {
      const frame=el('div','challenge-frame');frame.setAttribute('role','group');frame.setAttribute('aria-label',question.size===5?'Five frame':`Ten frame ${group+1}`);
      for(let index=group*10;index<Math.min(question.size,group*10+10);index++){
        const cell=button('','challenge-cell',()=>{if(done)return;if(cells.has(index))cells.delete(index);else cells.add(index);cell.classList.remove('is-suggested');cell.classList.toggle('is-filled',cells.has(index));cell.setAttribute('aria-pressed',String(cells.has(index)));counter.textContent=question.age<=5||showHelp?`${cells.size} filled · ${question.size-cells.size} empty`:'Check your model when ready';});cell.dataset.cell=String(index);cell.setAttribute('aria-label',`Space ${index+1}`);cell.setAttribute('aria-pressed','false');frame.append(cell);
      }frames.append(frame);
    }
    const counter=el('p','challenge-frame-count',question.age<=5?'0 filled':'Build your model, then check');counter.setAttribute('aria-live','polite');play.append(frames,counter);
    play.append(button('Show a frame strategy','button challenge-hint-button',hint));
    const check=button('Check my frame','button button-primary',()=>{if(done)return;if(cells.size===question.target)complete(question.ask==='empty'?`${question.target} filled and ${question.empty} empty. You left exactly ${question.empty} spaces!`:`${question.target} ${question.target===1?'space':'spaces'} filled. You matched the number!`);else {recordMistake();message('Your frame does not match yet. Check the question and try again. Hint is available when you want it.');}});play.append(check);
  }
  function renderLetters(play) {
    const pairs=el('div','challenge-letter-columns');
    for(const [side,letters]of [['upper',question.upper],['lower',question.lower]]) {
      const column=el('div','challenge-letter-column');column.append(el('p','challenge-column-label',question.labels?.[side]||(side==='upper'?'BIG LETTERS':'small letters')));
      for(const letter of letters) {
        const record=question.relationships?.find(pair=>pair[side]===letter),partner=record?record[side==='upper'?'lower':'upper']:side==='upper'?letter.toLowerCase():letter.toUpperCase();
        const card=button('','challenge-letter',()=>chooseLetter(letter,side,card));card.dataset.letter=letter;card.dataset.side=side;card.setAttribute('aria-label',question.relationships?letter:`${side==='upper'?'Big':'Small'} letter ${letter}`);card.setAttribute('aria-pressed','false');card.append(el('strong','',letter));
        const model=el('small','challenge-partner-model',`↔ ${partner}`);model.hidden=!showHelp;card.append(model);column.append(card);
      }pairs.append(column);
    }play.append(pairs);
    play.append(button('Show partners','button challenge-hint-button',()=>{recordHint();container.querySelectorAll('.challenge-partner-model').forEach(node=>node.hidden=false);message('The partner models are now visible. Look at the relationship, then try each pair.');}));
  }
  function pairKey(letter,side) {return question.relationships?.find(pair=>pair[side]===letter)?.key??letter.toLowerCase();}
  function chooseLetter(letter,side,card) {
    const key=pairKey(letter,side);
    if(done||matched.has(key))return;
    if(!selection||selection.side===side) {
      container.querySelectorAll('.challenge-letter.is-selected').forEach(node=>{node.classList.remove('is-selected');node.setAttribute('aria-pressed','false');});selection={letter,side,card,key};card.classList.add('is-selected');card.setAttribute('aria-pressed','true');message('Find its partner in the other column.');return;
    }
    if(selection.key===key) {
      matched.add(key);for(const node of [selection.card,card]){node.classList.remove('is-selected');node.classList.add('is-matched');node.setAttribute('aria-pressed','true');node.disabled=true;}selection=null;
      if(matched.size===question.pairs.length)complete('Every pair connects! You found all the relationships.');else message('That pair fits. Find another relationship.');
    }else{recordMistake();selection.card.classList.remove('is-selected');selection.card.setAttribute('aria-pressed','false');selection=null;message('Those do not form a pair yet. Try again, or request the partner hint.');}
  }
  function renderWord(play) {
    const picture=el('div','challenge-word-picture',question.picture);const art=objectArt(question.word,{age:profile.age});if(art)picture.innerHTML=art;picture.setAttribute('role','img');picture.setAttribute('aria-label',question.age>=8?'Word clue illustration':question.word);play.append(picture,el('p','challenge-word-clue',question.clue));
    const model=el('p','challenge-word-model',question.word);model.hidden=!showHelp;model.setAttribute('aria-label',`Word model: ${question.word}`);play.append(model);
    const hint=button(showHelp?'Hide the word hint':'Show the word hint','button challenge-hint-button',()=>{showHelp=!showHelp;if(showHelp)recordHint();model.hidden=!showHelp;hint.textContent=showHelp?'Hide the word hint':'Show the word hint';hint.setAttribute('aria-expanded',String(showHelp));});hint.setAttribute('aria-expanded',String(showHelp));play.append(hint);
    const slots=el('div','challenge-slots challenge-word-slots');slots.setAttribute('aria-label','Your word');[...question.word].forEach((letter,i)=>{const slot=el('span','challenge-slot','·');slot.dataset.slot=String(i);slots.append(slot);});play.append(slots);
    const tiles=el('div','challenge-tiles');
    const showNext=()=>{if(done)return;recordHint();showHelp=true;model.hidden=false;hint.textContent='Hide the word hint';hint.setAttribute('aria-expanded','true');const next=question.word[steps.length];container.querySelector(`[data-character="${next}"]:not(:disabled)`).classList.add('is-suggested');message(`The word is ${question.word}. ${steps.length?`You have ${steps.join('')}. `:''}Find ${next} for space ${steps.length+1}.`);};
    play.append(button('Show next letter','button challenge-hint-button',showNext));
    for(const {letter,index}of question.tiles){const tile=button(letter,'challenge-tile',()=>{
      if(done)return;
      if(letter===question.word[steps.length]){steps.push(letter);tile.disabled=true;tile.classList.remove('is-suggested');tile.classList.add('is-used');const slot=slots.children[steps.length-1];slot.textContent=letter;slot.classList.add('is-filled');if(steps.length===question.word.length)complete(`You built ${question.word}! Say the word, then try another picture.`);else message(`${letter} fits in space ${steps.length}. Move to the next letter in the word.`);}
      else {recordMistake();message("That does not fit here yet. Try again, or request the next-step hint.");}
    });tile.dataset.tile=String(index);tile.dataset.character=letter;tile.setAttribute('aria-label',`Letter ${letter}`);tiles.append(tile);}play.append(tiles);
  }
  function open(nextId='compare') {id=CHALLENGE_INFO[nextId]?nextId:'compare';profile=getProfile(getSettings());round=getRoundCursor(id,profile.age,profile.challengeAge);opened=true;reset();report();}
  function close(){opened=false;stopSpeech();}
  function hint() {
    if(!opened||done)return;recordHint();
    if(question.model==='place-value'&&['subtraction','number-bonds'].includes(id)) {
      const support=container.querySelector('.challenge-place-support');if(support.hidden)container.querySelector('.challenge-hint-button').click();message(question.help);
    }else if(id==='subtraction') {
      const dots=[...container.querySelectorAll('.challenge-berries .challenge-dot')].filter(dot=>dot.classList.contains('is-crossed')===(question.ask==='removed'));
      dots.forEach((dot,i)=>{dot.textContent=String(i+1);dot.classList.add('is-numbered');});message(question.help+' The dots to count now have number labels.');
    }else if(id==='ten-frame') {
      const needsMore=cells.size<question.target,index=needsMore?Array.from({length:question.size},(_,i)=>i).find(i=>!cells.has(i)):[...cells].at(-1);
      if(cells.size===question.target){message('Your frame has the right amount. Press Check my frame to check your work.');return;}
      container.querySelector(`[data-cell="${index}"]`).classList.add('is-suggested');message(`${question.help} ${needsMore?'Fill':'Empty'} the highlighted space, then check how many you have.`);
    }else if(id==='number-bonds') {
      const support=container.querySelector('.challenge-bond-support');support.hidden=false;showHelp=true;const button=container.querySelector('.challenge-hint-button');button.textContent='Hide the picture hint';button.setAttribute('aria-expanded','true');message(question.help+' The empty dots show the missing part.');
    }else {
      const label={compare:question.model==='place-value'?'Compare place values':'Line up the dots','number-order':'Show my next step','letter-match':'Show partners','word-build':'Show next letter'}[id];
      [...container.querySelectorAll('button')].find(button=>button.textContent===label)?.click();
    }
  }
  function settingsChanged(){const next=getProfile(getSettings()),changed=next.challengeAge!==profile.challengeAge||next.age!==profile.age;profile=next;if(!opened)return;if(changed){round=getRoundCursor(id,profile.age,profile.challengeAge);reset();}else container.querySelectorAll('[data-challenge-speech]').forEach(node=>node.hidden=!canSpeak());}
  return {open,close,settingsChanged,hint};
}
