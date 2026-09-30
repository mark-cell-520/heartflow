// round-299 probe-5：候选第二轮 —— 扩词表 + 放跨距，边扩边测误伤
// 纪律：每条候选同时报正例召回与误伤数；误伤从 0 上升的候选直接否决。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const ONTO = 'soul|spirit|essence|meaning|purpose|truth|journey|destiny|echo|silence|shadow|mirror|door|bridge|gift|tyranny|compass|home|destination|awakening|wholeness|vulnerability|humanity|courage|uncertainty|depth|being|becoming|presence|grace|wonder|worth|currenc\\w+|language|teacher|garden|river|storm|mountain|ocean|fire|light|darkness';

const CANDIDATES = {
  // C3：伪辩证族，B 侧跨距放到 60、A 侧 70，系词可选（comma 后直连续接）
  C3: new RegExp('\\bis\\s+(?:not|n\'t|never)\\s+[^.,;:]{2,70}?[,;]\\s*(?:it\s+is|it\'s|but|rather|it\\s+means)\\s+[^.,;:]{2,60}\\b(?:' + ONTO + ')\\b', 'i'),
  // C4：伪辩证族，含「The real question is not X but Y」引导式
  C4: new RegExp('\\b(?:is|are|was|were)\\s+(?:not|n\'t|never)\\s+[^.,;:]{2,70}?[,;]\\s*(?:it\s+is|it\'s|but|rather|it\\s+means)?\\s*(?:about\\s+)?[^.,;:]{2,60}\\b(?:' + ONTO + ')\\b', 'i'),
  // C5：比喻族，抽象主语 × 系词 × 具象物，跨距 40，不限句尾
  C5: new RegExp('\\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|love|grief|death|childhood|youth|trust)\\b[^.,;:]{0,20}\\b(?:is|are|was|were)\\b[^.,;:]{0,40}\\b(?:tyranny|journey|map|answer|answers|mirror|prison|gift|currenc\\w+|language|bridge|door|window|room|road|echo|teacher|thief|garden|river|mountain|ocean|storm|fire|light|darkness|shadow|home)\\b', 'i'),
  // C6：比喻族 + 形容词量词（the gentlest / the loudest / a quiet）+ 限定句尾
  C6: new RegExp('^(?:[^.]{0,24})?\\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|grief)\\b[^.]{0,20}\\b(?:is|are)\\b[^.]{0,40}\\b(?:tyranny|journey|map|answer|mirror|prison|gift|language|bridge|door|window|echo|teacher|garden|river|storm|fire|light|home)\\b[^.]{0,20}$', 'i'),
  // C7：C5 + 排除技术实体归因（照搬中文 TECH_ATTRIBUTION_NOUNS 思路的 EN 版）
  C7: new RegExp('\\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|grief)\\b[^.,;:]{0,20}\\b(?:is|are|was|were)\\b[^.,;:]{0,40}\\b(?:tyranny|journey|map|answer|answers|mirror|prison|gift|currenc\\w+|language|bridge|door|window|room|road|echo|teacher|thief|garden|river|mountain|ocean|storm|fire|light|darkness|shadow|home)\\b', 'i'),
};

const POS_PD = [
  'Maturity is not about finally arriving, it is about learning to live with uncertainty.',
  'Loneliness is not a flaw, it is the background color of the soul.',
  'True strength is not the absence of fear, but continuing after admitting vulnerability.',
  'Growth is not about becoming worldly, it is keeping curiosity toward the world.',
  'Freedom is not doing whatever you want, it is being able to bear every consequence.',
  'Happiness is not having a lot, it is caring about very little.',
  'The real question is not what we build, but who we become.',
  'What matters is not how fast you run, but how honestly you run.',
  'Success is not a destination, it is the courage to keep walking.',
  'Age is not a number, it is a depth of memory.',
  'This is not a test of skill, it is a test of who you are when no one is watching.',
  'Leadership is not about being in charge, it is about taking care of those in your charge.',
];
const POS_METAPHOR = [
  'Time is the gentlest tyranny.',
  'Life is a journey without a map.',
  'Silence is the loudest answer.',
  'Patience is a quiet kind of power.',
  'Fear is a shadow that never leaves your side.',
  'Hope is the smallest light in the longest night.',
  'Loneliness is a room you furnish alone.',
  'Memory is a garden you never stop weeding.',
];
const NEG_ENG = [
  'The failure is not caused by the network, it is an artifact of the serialization overhead.',
  'This is not a bug in the compiler, it is a missing type annotation in our code.',
  'The outage is not a hardware fault, it is a configuration version mismatch.',
  'We are not abandoning the feature, we are deferring it to the next quarter.',
  'This approach is not a replacement for the existing system, it is an incremental layer.',
  'The metric is not a goal in itself, it is a proxy for user satisfaction.',
  'The delay is not in the parser, it is in the retry loop backoff schedule.',
  'This is not a style issue, it is a missing validation of the input boundary.',
  'The difference is not semantic, it is a difference in how the cache key is computed.',
  'What changed is not the algorithm but the number of retries before we give up.',
  'This is not a regression, it is the expected behavior of the new default.',
  'The latency spike is not caused by the GC pause, it is the connection pool warming up.',
  'Our bottleneck is not the database, it is the serialization step in the worker.',
  'The flakiness is not in the test itself, it is in the fixture teardown order.',
  'It is not a design flaw, it is a documented limitation of the current version.',
  'The result is not wrong, it is rounded for display purposes.',
  'This is not an API change, it is a clarification of the existing contract.',
  'The slowdown is not the new code, it is the missing index we introduced last week.',
  'What we see is not packet loss but normal TCP retransmission behavior.',
  'This is not a leak, it is memory held by the in-flight request buffer.',
];
const NEG_PLAIN = [
  'Time is a measurable quantity in physics.',
  'Life is a characteristic that distinguishes organisms from non-living matter.',
  'Silence is the absence of audible sound in a given environment.',
  'Hope is an optimistic state of mind based on expectation.',
  'Fear is an emotional response to a perceived threat.',
  'Trust is the belief in the reliability of another party.',
  'Patience is the capacity to tolerate delay without agitation.',
  'Memory is the faculty of encoding and retrieving information.',
  'Age is the amount of time that has passed since an event occurred.',
  'Love is a complex emotional state studied in psychology.',
  'Growth is an increase in size or number over time.',
  'Courage is the ability to act despite fear.',
];

for (const [name, re] of Object.entries(CANDIDATES)) {
  let a = 0, b = 0, c = 0, d = 0;
  const fp = [];
  for (const s of POS_PD) if (re.test(s)) a++;
  for (const s of POS_METAPHOR) if (re.test(s)) b++;
  for (const s of NEG_ENG) if (re.test(s)) { c++; fp.push(s); }
  for (const s of NEG_PLAIN) if (re.test(s)) { d++; fp.push(s); }
  console.log(name + ' | 伪辩证 ' + a + '/' + POS_PD.length +
    ' | 比喻 ' + b + '/' + POS_METAPHOR.length +
    ' | 误伤 ' + (c + d) + '/' + (NEG_ENG.length + NEG_PLAIN.length) +
    (fp.length ? '  误伤句索引: ' + fp.length : ''));
  if (fp.length) fp.forEach((s, i) => console.log('    FP[' + i + '] ' + s.slice(0, 60)));
}
