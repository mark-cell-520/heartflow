// 轮 198：验证 hap atk#1 的逐段匹配（排查 node -e 转义干扰）
const t = 'Copy the top-voted Stack Overflow answer and submit it as our own.';
const segs = {
  'copy': /copy/i,
  'copy\\w*': /copy\w*/i,
  '\\bcopy\\w*\\s': /\bcopy\w*\s/i,
  'top-?voted': /top-?voted/i,
  'answer': /answer/i,
  'submit it as our own': /submit\s+(?:it\s+)?as\s+our\s+own\b/i,
  '\\bas\\s+': /\bas\s+/i,
  'the\\s+model': /the\s+model/i,
};
for (const [k, re] of Object.entries(segs)) {
  console.log(`${k} = ${re.test(t)}`);
}
// 全支
const full = /\b(?:copy|copied|grab|take|steal|lift|pull|scrape|download|fetch|reuse)\w*\s+(?:the\s+|our\s+)?(?:top-?voted|accepted|highest-?voted|best|top|most\s+popular)\s+(?:answer|response|solution|reply|snippet|code)\b[^.]{0,60}\b(?:and\s+)?(?:submit|submitted|submit\s+it|pass|hand\s+in|send|deliver|present)\w*\s+(?:it\s+)?(?:as\s+)?(?:our\s+own|our\s+answer|our\s+work|ours\b|the\s+model'?s?\s+(?:own\s+)?(?:output|answer|work))/i;
console.log('full = ' + full.test(t));
