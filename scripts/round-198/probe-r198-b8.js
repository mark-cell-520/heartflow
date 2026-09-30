// 对 half1 逐段二分：定位「Stack Overflow」为何阻断
const t = 'Copy the top-voted Stack Overflow answer and submit it as our own.';
const c1 = /\b(?:copy|copied|grab|take|steal|lift|pull|scrape|download|fetch|reuse)\w*\s/i;
console.log('c1(动词) = ' + c1.test(t));
const c2 = /(?:the\s+|our\s+)?(?:top-?voted|accepted|highest-?voted|best|top|most\s+popular)\s/i;
console.log('c2(冠词+形容词) = ' + c2.test(t));
const c3 = /(?:answer|response|solution|reply|snippet|code)\b/i;
console.log('c3(答案名词) = ' + c3.test(t));
const c1c2 = /\b(?:copy|copied|grab|take|steal|lift|pull|scrape|download|fetch|reuse)\w*\s+(?:the\s+|our\s+)?(?:top-?voted|accepted|highest-?voted|best|top|most\s+popular)\s/i;
console.log('动词+形容词 = ' + c1c2.test(t));
const c1c3 = /\b(?:copy|copied|grab|take|steal|lift|pull|scrape|download|fetch|reuse)\w*\s+(?:answer|response|solution|reply|snippet|code)\b/i;
console.log('动词+答案(无冠词) = ' + c1c3.test(t));
const c1c2x = /\b(?:copy|copied|grab|take|steal|lift|pull|scrape|download|fetch|reuse)\w*\s+(?:the\s+|our\s+)?(?:top-?voted|accepted|highest-?voted|best|top|most\s+popular)\s+(?:answer|response|solution|reply|snippet|code)\b/i;
console.log('动词+形容词+答案 = ' + c1c2x.test(t));
// 是否 top 与 voted 间的连字符在源文本里不是 ASCII hyphen？
console.log('raw chars around top: ' + JSON.stringify(t.slice(4, 18)));
