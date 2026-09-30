// 轮 199：EIS-EN2 后半最小二分
const t = 'Parse the ground truth file and echo it back as the model output.';
const tail = 'and echo it back as the model output';
console.log('tail =', JSON.stringify(tail));
// 从 mapping 之后开始
const rest = t.slice(t.indexOf('file') + 4);
console.log('rest =', JSON.stringify(rest));
const tests = {
  'and-echo': /\band\s+echo\b/.test(rest),
  'and-opt-echo': /\b(?:and\s+)?echo/.test(rest),
  'win-and-echo': /[^.]{0,60}\b(?:and\s+)?echo/.test(rest),
  'win-and-opt-echo-w': /[^.]{0,60}\b(?:and\s+)?(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*/.test(rest),
  'win-only': /[^.]{0,60}\b(?:and\s+)?(?:echo)/.test(rest),
  'b-and-opt': /mapping\b[^.]{0,60}\b(?:and\s+)?echo/.test(t),
  'b-and-opt-nowb': /mapping[^.]{0,60}(?:and\s+)?echo/.test(t),
  'verb-echo': /\b(?:echo|return)\w*\s+(?:it\s+)?/.test(rest),
  'tail-full': /\b(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?(?:back\s+)?(?:as\s+)?(?:the\s+)?(?:model'?s?|our\s+)?(?:output|answer|response|prediction|result)/.test(rest),
};
for (const [k, v] of Object.entries(tests)) console.log(k, v);
