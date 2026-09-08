// Prompts support a conversation and a strategy, not an age-based assessment.
export const COACHING = {
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
  rhythm:['Look at the pattern. Tap the matching symbols in order.','Say the sequence slowly. You can look again; there is no timer.','Could you turn that pattern into claps and knee taps?','Take turns making a short clapping pattern for someone to copy.'],
  sharing:['Give one object to each friend in turn.','Keep going around the group so each friend receives the same amount. Older puzzles may have leftovers.','How can you check that the shares are fair?','Share a few blocks equally between toy friends.'],
};

export function coachingFor(id, age) {
  const content=COACHING[id] || COACHING[id==='letters'?'uppercase':'counting'];
  return {start:content[0],strategy:content[1],reflect:age<=4?'Point to something you noticed. Tell a grown-up about it.':content[2],offline:content[3],together:age<=4};
}

export function normalizeAdjustments(value, ids) {
  if (!value || typeof value!=='object' || Array.isArray(value)) return {};
  return Object.fromEntries(ids.filter(id=>Number.isInteger(value[id])).map(id=>[id,Math.max(-2,Math.min(2,value[id]))]));
}
