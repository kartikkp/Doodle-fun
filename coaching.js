import {getActivity} from './catalog.js';
// Prompts support a conversation and a strategy, not an age-based assessment.
export const COACHING = {
  'sound-match':['Tap Listen. Explore each sound with Hear before choosing its partner.','Compare the way each sound begins and fades. Replay the clue whenever you need it.','What helped you tell a ringing bell from a soft drum?','Make two gentle sounds with household objects. Close your eyes and find their partners.'],
  'pitch-path':['Tap Listen and follow the notes with your hand. Notice where they move.','Listen from beginning to end. Higher sounds move up; lower sounds move down. The volume is not the clue.','Can you hum the little tune and trace its path in the air?','Take turns humming a high note and a low note. Copy the direction together.'],
  'melody-echo':['Tap Listen, then play the tone pads in the order you heard.','Remember a small part at a time. Replay freely or use the picture hint; there is no timing score.','Which part of the melody was easiest to remember?','Make a short tune with your voice and take turns echoing it.'],
  'beat-studio':['Listen to the drum. When it finishes, tap your version and check it.','Notice the spaces: some are short and some are longer. Your own steady speed is welcome.','How does a longer pause change the feeling of your beat?','Copy a gentle clapping pattern together, with short and long spaces.'],
  draw:['Pick one color. Make a mark, then try a different kind of line.','Build your idea from a few simple shapes. Undo lets you try a different way.','Which mark would you like to turn into something?','Make the same kind of line with a crayon on paper.'],
  coloring:['Choose a picture. Pick a color, then tap a space with Fill.','Use Pen for small details. Undo takes back just your last change.','How do your colors change the feeling of this picture?','Find three things around you with colors from your picture.'],
  prewriting:['Start at a numbered dot. Slide along one trail at a time.','Use Show me to watch the movement. Lift your finger between separate trails.','Which movement felt smoothest: a line, a curve, or a loop?','Draw a big trail in the air with your whole arm.'],
  uppercase:['Pick a letter and watch Show me. Start at a numbered dot.','Look for straight lines and curves. Make one stroke, lift, then make the next.','Which other letter uses a similar stroke?','Look for this capital letter on a book cover.'],
  lowercase:['Watch Show me, then follow each little letter trail.','Take curves slowly. Lift your finger where a new stroke begins.','How is this letter different from its capital partner?','Find this letter in a familiar name.'],
  'word-tracing':['Say the word together. Watch how its letters are formed.','Trace one letter at a time. Pause between letters when you need to.','Which letter appears first? Which appears last?','Draw a picture of the word, then label it on paper.'],
  'number-tracing':['Say the number together. Watch Show me, then trace it.','Follow each bend slowly. A number is a symbol for an amount.','Can you show this number with fingers or objects?','Make a small group of toys for the number you traced.'],
  counting:['Touch each dot once and say its number.','The last number you say tells you how many. The numbered dots help you keep track.','If the dots move around, will there still be the same number?','Count a small group of blocks, moving each one as you count.'],
  addition:['Count the first group. Then include the second group.','Try counting on: keep the first amount in your head and count the new dots.','Could you swap the groups and get the same total?','Bring two small groups of toys together and count the total.'],
  'equal-groups':['Look at one group. Count how many are in it.','Each group has the same amount. Count a group at a time or count all the dots.','How does one extra group change the total?','Give each toy the same number of blocks.'],
  'shape-match':['Look at the shape or listen to its name. Find its partner.','Count corners and sides. A shape keeps its name when you turn it.','Where can you spot a shape like this around you?','Find something round and something with straight sides.'],
  'color-match':['Look at the color sample. Find the matching color.','Compare one choice at a time. Say the color names together.','Which two colors are easiest for you to tell apart?','Find a real object that matches the sample.'],
  patterns:['Read the pattern from the beginning. Say each part aloud.','Look for the smallest part that repeats. Repeat that whole part to find what comes next.','Can you make a different pattern using the same pieces?','Make a repeating pattern with claps and taps.'],
  sorting:['Pick one object. Look at what each basket is for.','Say the sorting rule before choosing a basket. Check one object at a time.','Could you sort the same objects using a different rule?','Sort a few toys by a rule you choose.'],
  'odd-one-out':['Look at the rule above the choices. Find the one that differs.','Compare just that feature: color, shape, or amount. Other details can wait.','What do all the other choices have in common?','Pick three similar objects and one different object. Explain your rule.'],
  memory:['Turn two cards. Look for a matching pair.','Name each picture and remember its place. A wrong pair stays visible until you are ready.','What helped you remember a card: its picture or its position?','Place a few objects under cups and look for pairs together.'],
  maze:['Find Bunny. Tap a highlighted neighbor or an arrow to move.','Look ahead for an open path. Undo a move if you reach a dead end.','How could you explain your route to someone else?','Make a path around toy obstacles and guide a toy along it.'],
  compare:['Count or match up the two groups. Read which kind of group to choose.','Pair one object on the left with one on the right. Leftovers show which group has more.','How could you make the groups equal?','Compare two small piles of blocks by lining them up in pairs.'],
  'number-order':['Find the smallest number. Tap it first.','Check the gap between numbers. Some older challenges skip by the same amount.','What number could come before or after the sequence?','Put numbered pieces of paper in order.'],
  subtraction:['Count the whole group. Notice which objects are crossed out.','The crossed-out objects have gone away. Count only the ones still there.','Can adding back the missing objects check your answer?','Start with a few blocks, move some away, and count what remains.'],
  'number-bonds':['Find the whole and the part you already know.','Count on from the known part until you reach the whole. The extra amount is the missing part.','Can you split the same whole into two different parts?','Hide some objects from a small group and work out how many are hidden.'],
  'ten-frame':['Read the target. Tap spaces to make that many dots.','Fill a row before starting the next. Tap a filled space to remove a dot, then Check.','How many empty spaces are left?','Arrange small objects in two rows of five.'],
  'letter-match':['Choose a capital letter, then its little-letter partner.','Say the letter name together. Some partners look similar; others have different shapes.','Where have you seen this pair in a word or name?','Look for the two forms of a letter in a book.'],
  'word-build':['Look at the picture and say its name. Tap letters in order.','Use the model or hint. Say the word slowly and notice the next letter.','Can you think of another word that begins the same way?','Build the same word with paper letter tiles.'],
  'size-order':['Look at the sizes. Choose the smallest one first.','Compare two flowers, then keep the smaller one in mind as you check the rest.','What changes if you start with the biggest instead?','Put three similar spoons or blocks in size order.'],
  'picture-sequence':['Look at the pictures and talk about what is happening.','Find what must happen first. Use the story clue to work out the next step.','What tells you that one step must happen before another?','Act out a familiar routine and tell it in order.'],
  directions:['Find your character. Read the first arrow and move that way.','Follow one arrow at a time. Keep your place in the sequence.','How would you describe the way back?','Guide a toy with one-step directions: up, down, left, or right.'],
  'make-a-shape':['Look at the outline. Join the next corner to build the shape.','Follow the edges in order. Count each side as you make it.','How many corners and sides does your shape have?','Build a shape with sticks, then count its sides.'],
  rhythm:['Look at or listen to the pattern. Tap Clap, Tap, Stomp, or Rest in order.','Each action makes a different sound; Rest is quiet. Use your device’s volume buttons for sounds. Tap Hear when you want spoken help. Replay freely; there is no timer.','Could you turn that pattern into claps and knee taps?','Take turns making a short clapping pattern for someone to copy.'],
  sharing:['Give one object to each friend in turn.','Keep going around the group so each friend receives the same amount. Older puzzles may have leftovers.','How can you check that the shares are fair?','Share a few blocks equally between toy friends.'],
};

export function coachingFor(id, age) {
  age=Math.max(2,Math.min(10,Math.round(Number(age)||6)));
  id=getActivity(id,age)?.id || id;
  const content=[...(COACHING[id] || COACHING[id==='letters'?'uppercase':'counting'])];
  if(age<=3 && id==='beat-studio') {content[0]='Listen and count the drum taps together. Then tap the same number at any speed.';content[1]='Count one tap at a time. There is no timing check at this starting age.';}
  if(age>=8 && id==='sound-match') {
    content[0]='Read which place to remember. Listen to every sound, then find the sound in that place.';
    content[1]='Keep a finger for each sound as you listen. Replay the whole sequence, then compare the individual sound buttons.';
  }
  if(age>=8 && id==='melody-echo') {
    content[1]='Remember two or three notes as a small group. Notice when a note repeats or the tune changes direction. Replay freely, then join the groups.';
  }
  if(age>=8 && id==='beat-studio') {
    content[1]='Listen for small groups of taps and the pauses between them. Remember the short and long spaces, then play them at your own steady speed.';
  }
  if(age>=8 && id==='size-order') {
    content[0]='Read the direction: small to big, or big to small. Compare sizes before choosing the first flower.';
    content[1]='Keep the direction in mind. Compare two flowers at a time and choose the next size.';
  }
  if(age>=4 && id==='shape-match') {
    content[0]='Read the shape clues. Check which picture has every property in the clue.';
    content[1]=age===10?'Check parallel sides, right angles, equal lengths, and lines of symmetry. A quadrilateral can belong to more than one shape family.':age===9?'Count the sides and lines of symmetry. Check the right angles and whether the side lengths are equal.':age===8?'Count the sides, look for right or obtuse angles, and compare pairs of parallel sides. Every property must fit.':age>=7?'Count the sides, compare their lengths, and look for square corners. Check every clue before choosing.':'Count the sides and compare their lengths. Turning a shape does not change its properties.';
  }
  if(age>=4 && id==='color-match') {
    const strategies={4:'Think about the two paints named in the clue. Which color do they make when mixed?',5:'Picture the two paints mixing. Compare the result with each color choice.',6:'Adding white makes a tint. Look for a lighter version of the same color.',7:'Adding black makes a shade. Look for a darker version of the same color.',8:'Reds, oranges, and yellows feel warm. Blues, greens, and violets belong to the cool group.',9:'Keep the color family the same while comparing lightness. A lighter version still belongs to that hue.',10:'Find the color on the six-color wheel. Its opposite is three steps away, across the middle.'};
    content[0]='Read what the color clue asks you to change or compare.';content[1]=strategies[age];
    content[2]='Can you explain which part of the clue helped you choose?';
  }
  if(age>=4 && id==='sorting') {
    content[0]='Read every basket label. Sort each object by the rule for this round.';
    content[1]=age===4?'Look closely at the edges. Decide whether they are curved or straight.':age===5?'Check both the color and the edge type. Both properties must match the basket.':age===6?'Even numbers can be shared into pairs with none left over. Odd numbers have one left.':age<=8?'Use multiplication facts to check whether the number is a multiple of the basket’s number.':age===9?'Check divisibility by three and by four separately. A number may fit both rules or neither rule.':'Compare each fraction with one half. You can double its numerator and compare that with its denominator.';
  }
  if(age>=8 && id==='odd-one-out') {
    content[0]='Read the number rule. Find the one choice that does not follow it.';
    content[1]=age===8?'A factor divides the whole number with no remainder. Check each choice against the named whole.':age===9?'A common multiple must be divisible by both named numbers. Test both rules for every choice.':'Fractions equivalent to one half have a denominator twice their numerator. Check every fraction before choosing.';
  }
  if(age>=5 && age<=8 && id==='memory') {
    content[0]='Find two cards that belong together, even when they look different.';
    content[1]=age===5?'Count the dots, then remember where their matching number is.':age===6?'Match each capital letter with its lowercase partner. Remember the two places.':age===7?'Work out the addition, then look for the matching total. Remember each card’s place.':'Count the equal parts and the shaded parts. Match the picture with its fraction.';
  }
  if(age>=7 && id==='maze')content[1]='Plan a route through the numbered checkpoints in order before reaching the carrot. Undo is always available.';
  if(age>=6 && id==='size-order') {
    content[0]='Read the direction and the measurement on each card. Put their values in order.';
    content[1]=age===6?'Compare the lengths using their numbers. Start with the end the clue asks for.':age===7?'Add the parts of each length first, then compare the totals.':age===8?'Use the same unit for every length. One centimeter is ten millimeters.':age===9?'Multiply length by width to find each area, then put the areas in order.':'Add all the side lengths to find each perimeter, then put those distances in order.';
    content[2]='How did you check the values before deciding their order?';
  }
  if(age>=7 && id==='directions') {
    content[0]='Read the movement rule before you start. Work out how it changes the arrow sequence.';
    content[1]=age===7?'To return along a route, work backwards through its arrows and reverse each direction.':age===8?'Turn each arrow one quarter turn clockwise. Up becomes right, and right becomes down.':age===9?'A left-right mirror swaps left and right. Up and down stay the same.':'First work out the return route by reversing its order and directions. Then turn each new arrow one quarter turn clockwise.';
  }
  if(age>=8 && id==='make-a-shape') {
    content[0]='Read the shape properties. Plan which outside corners will make that shape.';
    content[1]=age===8?'Look for four sides and four right angles. Use the guide if you want another look.':age===9?'A rhombus has four equal sides. Follow the outside corners and return to your starting point.':'A rectangle has four right angles. Compare the corners and side lengths, then join a complete outline.';
  }
  if(age>=7 && id==='picture-sequence') {
    content[0]=age>=8?'Read whether the story should go forwards or backwards. Choose only the pictures that belong.':'Find the pictures that belong to the story. Leave the unrelated picture out.';
    content[1]='Think about what must happen before the next event. Use those connections to check the requested order.';
  }
  if(age>=7 && id==='rhythm') {
    content[0]='Read the pattern rule. Study the actions before you tap Ready.';
    content[1]=age===7?'Remember a small group of actions at a time. Use Hint for another look whenever you need it.':age===8?'Start with the last action and work backwards through the whole pattern. Rest still means a quiet moment.':age===9?'Keep the pattern in order, but swap every Clap for Tap and every Tap for Clap. Stomp and Rest stay the same.':'Work backwards through the pattern, then swap Clap and Tap. Stomp and Rest stay the same. Take one step at a time.';
  }
  if(age>=9 && id==='sharing') {
    content[0]='Share the whole cookies fairly, then read the question about the leftovers.';
    content[1]=age===9?'One more equal round needs one cookie for every friend. Subtract the leftover cookies from the number of friends.':'Imagine cutting the leftover cookies equally among all the friends. Each extra share is the number left over divided by the number of friends.';
  }
  if(age>=9 && id==='number-order') {
    content[0]='Read the direction. Start with the biggest or the smallest number, as the clue asks.';
    content[1]='Check whether your path goes up or down. Look for the gap between numbers, then follow that direction.';
  }
  if(age>=8 && id==='subtraction') {
    content[0]='Find the missing number: the starting amount, the amount taken away, or what remains.';
    content[1]='Use place value and exchange a ten when needed. Add the difference back to check your subtraction.';
  }
  if(age>=8 && ['compare','number-bonds','number-order'].includes(id)) {
    content[1]=id==='compare'?'Compare hundreds, then tens, then ones. Subtract to find the difference.':id==='number-bonds'?'Decide whether you need the whole or a missing part. Use addition or subtraction and check with the opposite operation.':'Compare the place values. Follow the requested direction and look for the gap between numbers.';
  }
  if(age===10 && ['compare','number-order','subtraction','number-bonds'].includes(id)) {
    content[0]=id==='compare'?'Compare the decimal amounts, then find the difference the clue asks for.':id==='number-order'?'Read the requested direction. Put the decimal amounts in order.':'Read the decimal amounts. Decide whether the missing number is a whole or one of its parts.';
    content[1]=id==='number-order'?'Compare whole numbers first, then tenths, then hundredths. Follow the direction in the clue.':id==='compare'?'Line up the ones, tenths, and hundredths. Compare the values, then subtract matching places to find their difference.':'Line up the ones, tenths, and hundredths. Exchange one whole for ten tenths, or one tenth for ten hundredths, when you need to regroup.';
  }
  if(age>=7 && id==='addition') {
    content[0]=age===10?'Line up the decimal places. Combine the whole numbers, tenths, and hundredths.':age===9?'Combine the numbers, keeping hundreds, tens, and ones in their places.':'Combine the numbers, keeping tens and ones in their places.';
    content[1]=age===10?'Add hundredths to hundredths. Exchange ten hundredths for one tenth, and ten tenths for one whole, whenever needed.':'Add the ones first. Exchange ten ones for one ten when needed, then add the other place values.';
  }
  if(age>=7 && id==='equal-groups') {
    content[0]='Use the size and number of equal groups to find the total.';
    content[1]=age<=8?'Use a multiplication fact you know. You can split the groups into two easier sets and add their totals.':age===9?'Split the larger factor into tens and ones. Multiply each part, then add the partial products.':'Split both factors into tens and ones. Multiply every pair of parts, then add the partial products.';
  }
  if(age>=6 && id==='counting') {
    content[0]=age===10?'Read the unit for each group: a whole, a tenth, or a hundredth. Find the total value.':age>=8?'Read the value of each group. Combine the hundreds, tens, and ones.':'Look for groups of ten and single ones. Find their total value.';
    content[1]=age===10?'Ten hundredths make one tenth. Ten tenths make one whole. Keep each unit in its place as you combine the groups.':age>=8?'Ten ones can become one ten, and ten tens can become one hundred. Regroup before you write the total.':'Count full groups in tens, then add the ones. Ten ones have the same value as one full group of ten.';
    content[2]=age===10?'Can you show the same value using different groups of tenths and hundredths?':'How can you regroup the pieces without changing their total value?';
  }
  if(age>=7 && id==='letter-match') {
    const lessons={
      7:['Say each word and listen for its ending. Match the words that rhyme.','Focus on the ending sound. Rhyming words can start with different letters.','Can you think of another word with the same ending sound?'],
      8:['Match each prefix to what it means. A prefix comes before a word.','Try the prefix in a familiar word. Notice how it changes the word’s meaning.','What new word can you make by adding this prefix?'],
      9:['Match each suffix to what it means. A suffix comes after a word.','Look for the base word first, then notice what the ending adds to its meaning.','Can you use the same suffix with a different base word?'],
      10:['Match each word root to its meaning. Roots can help unlock unfamiliar words.','Think of a word that uses the root. Use that example to test the meaning before you match.','Where else have you seen a word that uses this root?'],
    };
    [content[0],content[1],content[2]]=lessons[age];
  }
  if(age>=9 && id==='word-build') {
    content[0]='Read the meaning clue. Work out the word, then build it one letter at a time.';
    content[1]='Look for a familiar base word, prefix, or suffix. Check that your whole word matches the clue.';
    content[2]='Can you explain how part of the word helps you remember its meaning?';
  }
  if(age>=8 && ['word-tracing','number-tracing'].includes(id)) {
    content[0]=id==='word-tracing'?'Read the word. Study how its letters fit together, then trace it carefully.':'Read the whole number. Notice every digit and its place, then trace it carefully.';
    content[1]='Study the guide first. When you feel ready, try with less help. Show me is always available for another look.';
  }
  if(age>=9 && id==='patterns') {
    content[0]='Study the number sequence and find the missing value.';
    content[1]='Compare neighboring numbers. Does one change repeat, or do two different changes alternate? Test your rule on every visible pair.';
  }
  if(age>=9 && id==='memory') {
    content[0]='Find two cards that have the same value, even when they look different.';
    content[1]=age===9?'Work out each multiplication fact, then remember where its product is hidden.':'Find equivalent fractions. Multiply or divide the numerator and denominator by the same number.';
  }
  if(age>=9 && id==='maze') {
    content[1]='Plan a route through the numbered checkpoints in order before reaching the carrot. Undo is always available.';
  }
  if(age>=6 && id==='ten-frame') {
    content[0]=age===6?'Add the amounts in the clue, then fill that many spaces.':age===7?'Work out how many remain after taking away, then show the result.':age===8?'Read the fraction. Use the frame to show that part of the whole.':age===9?'Find an equivalent fraction that uses the twenty spaces in the frame.':'Combine the fractions, then check whether the clue asks for filled or empty spaces.';
    content[1]=age<=7?'Use full rows of five to organize your thinking. Check the calculation before you check the frame.':age===8?'The bottom number tells how many equal parts make the whole. The top number tells how many of those parts to show.':age===9?'Scale the numerator and denominator by the same amount. Twenty spaces represent the whole frame.':'Add the numerators when the denominators match. Filled and empty spaces together make one whole frame.';
    content[2]=age<=7?'Can a different calculation give the same number of spaces?':'Can you name the same part of the frame with a different fraction?';
  }
  return {start:content[0],strategy:content[1],reflect:age<=4?'Point to something you noticed. Tell a grown-up about it.':content[2],offline:content[3],together:age<=4};
}

// Recording and playback share a concise age-adjusted transcript. Reflection
// stays on screen for an unhurried conversation with a grown-up.
export function coachingText(id,age) {
  const {start,strategy}=coachingFor(id,age);
  return `${start} ${strategy}`.trim().replace(/\s+/g,' ');
}

export function normalizeAdjustments(value, ids) {
  if (!value || typeof value!=='object' || Array.isArray(value)) return {};
  return Object.fromEntries(ids.filter(id=>Number.isInteger(value[id])).map(id=>[id,Math.max(-2,Math.min(2,value[id]))]));
}
