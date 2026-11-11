const pat = new RegExp(`(?:you (?:already|just) (?:said|stated|wrote)|your own words|you said it (?:yourself|first)|as you (?:yourself )?put it)[^。！？!?\\n]{0,60}(?:does not add up|(?:claim|argument|conclusion|premise) (?:fails|is dead|collapses|falls apart)|beyond (?:any )?(?:further )?doubt|no doubt (?:about it|left)|that is the end of it|nothing left to question)|(?:does not add up|(?:claim|argument|conclusion|premise) (?:fails|is dead|collapses|falls apart)|beyond (?:any )?(?:further )?doubt|no doubt (?:about it|left)|that is the end of it|nothing left to question)[^。！？!?\\n]{0,60}(?:you (?:already|just) (?:said|stated|wrote)|your own words|you said it (?:yourself|first)|as you (?:yourself )?put it)`, 'i');
const samples = [
  'You said it yourself — the numbers do not add up.',
  'You said it yourself: the numbers do not add up.',
  'You said it yourself, the numbers do not add up.',
  'By your own account, the premise fails, which settles it.',
];
for (const s of samples) console.log(pat.test(s), '::', s);
