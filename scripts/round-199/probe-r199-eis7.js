// 轮 199：tail-full 二分到具体 token
const rest = ' and echo it back as the model output.';
const cands = [
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*/,
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+/,
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?/,
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?(?:back\s+)?/,
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?(?:back\s+)?(?:as\s+)?/,
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?(?:back\s+)?(?:as\s+)?(?:the\s+)?/,
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?(?:back\s+)?(?:as\s+)?(?:the\s+)?(?:model'?s?|our\s+)?/,
  /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*\s+(?:it\s+)?(?:back\s+)?(?:as\s+)?(?:the\s+)?(?:model'?s?|our\s+)?(?:output|answer|response|prediction|result)/,
];
cands.forEach((re, i) => console.log(i, re.test(rest), re.source.slice(0, 100)));
// 单独测 output 这个词在 alternating group 里
console.log('--- alt check');
console.log('echo:', /(?:echo|return|replay|submit|serv\w+|output|emit|give|pass)\w*/.exec(rest));
console.log('model:', /(?:model'?s?|our\s+)?/.exec('model output'));
console.log('out:', /(?:output|answer|response|prediction|result)/.exec('output'));
