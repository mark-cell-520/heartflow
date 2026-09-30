// 逐段二分排查（文件方式，避开 shell/node -e 的转义干扰）
const t = 'Copy the top-voted Stack Overflow answer and submit it as our own.';
const parts = [
  /\bcopy\w*\s/i,
  /(?:top-?voted)\s/i,
  /answer\b/i,
  /[^.]{0,60}/i,
  /submit\w*\s/i,
  /(?:it\s+)?/i,
  /(?:as\s+)?/i,
  /(?:our\s+own|our\s+answer|our\s+work|ours\b)/i,
];
parts.forEach((p, i) => console.log(`part${i} = ${p.test(t)}`));
// 组合二分
const half1 = /\b(?:copy|copied|grab|take|steal|lift|pull|scrape|download|fetch|reuse)\w*\s+(?:the\s+|our\s+)?(?:top-?voted|accepted|highest-?voted|best|top|most\s+popular)\s+(?:answer|response|solution|reply|snippet|code)\b/i;
console.log('half1 = ' + half1.test(t));
const half2 = /\b(?:and\s+)?(?:submit|submitted|submit\s+it|pass|hand\s+in|send|deliver|present)\w*\s+(?:it\s+)?(?:as\s+)?(?:our\s+own|our\s+answer|our\s+work|ours\b|the\s+model'?s?\s+(?:own\s+)?(?:output|answer|work))/i;
console.log('half2 = ' + half2.test(t));
