// round-299 probe-4：EN 候选判据 × 误伤压测（照搬中文 r297 方法论：
// 本体论词表 + 结构条件 + 跨距上限三层，逐层测正例召回与误伤数）
// 纪律：样本只在此文件，输出只报数字。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

// ── 候选正则（C1/C1b 伪辩证族，C2/C2b 跨域系词比喻族）──────────────────
const CANDIDATES = {
  // C1：伪辩证 + B 侧本体论/抽象词表 + 跨距上限 40
  C1: /\bis\s+(?:not|n't)\s+[^.,;:]{2,50}?[,;]?\s*(?:it|it's|it\s+is|but|rather)\s+(?:is|was|means|about)\s+[^.,;:]{2,40}\b(?:soul|spirit|essence|meaning|purpose|truth|journey|destiny|echo|silence|shadow|mirror|door|bridge|gift|currenc\w+|tyranny|compass|home|destination|awakening|wholeness|vulnerability|humanity|courage)\b/i,
  // C1b：同 C1，但把「系词」要求放宽到 after-comma 任意续接
  C1b: /\bnot\s+[^.,;:]{2,60}?[,;]\s*(?:it\s+is|it's|but)\s+[^.,;:]{2,40}\b(?:soul|spirit|essence|meaning|purpose|truth|journey|destiny|echo|silence|shadow|mirror|door|bridge|gift|tyranny|compass|home|destination|awakening|wholeness|vulnerability)\b/i,
  // C2：跨域系词比喻（抽象主语表 × 系词 × 比喻物表，跨距上限 30）
  C2: /^(?:[^.]{0,24})?\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|love|trust|grief|death|childhood|youth)\b[^.]{0,18}\b(?:is|are|was|were)\b[^.]{0,30}\b(?:tyranny|journey|map|answer|mirror|shadow|prison|gift|currenc\w+|language|bridge|door|window|room|road|echo|silence|teacher|thief|garden|river|mountain|ocean|storm|fire)\b[^.]{0,20}$/i,
  // C2b：抽象主语 × 系词 × 比喻物，不限句尾位置
  C2b: /\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|grief)\b[^.]{0,18}\b(?:is|are)\b[^.]{0,30}\b(?:tyranny|journey|map|answer|mirror|prison|gift|currenc\w+|language|bridge|door|window|echo|teacher|thief|garden|river|storm)\b/i,
};

// ── 样本组 ────────────────────────────────────────────────────────────────
const POS_PD = [ // 伪辩证真阳
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
const POS_METAPHOR = [ // 存在论比喻真阳
  'Time is the gentlest tyranny.',
  'Life is a journey without a map.',
  'Silence is the loudest answer.',
  'Patience is a quiet kind of power.',
  'Fear is a shadow that never leaves your side.',
  'Hope is the smallest light in the longest night.',
  'Loneliness is a room you furnish alone.',
  'Memory is a garden you never stop weeding.',
];
const NEG_ENG = [ // 工程归因真阴
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
const NEG_PLAIN = [ // 普通抽象陈述真阴
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
  const fp = [], miss = [];
  for (const s of POS_PD) if (re.test(s)) a++; else miss.push(s);
  for (const s of POS_METAPHOR) if (re.test(s)) b++;
  for (const s of NEG_ENG) if (re.test(s)) { c++; fp.push(s); }
  for (const s of NEG_PLAIN) if (re.test(s)) { d++; fp.push(s); }
  console.log(name + ' | 伪辩证真阳 ' + a + '/' + POS_PD.length +
    ' | 比喻真阳 ' + b + '/' + POS_METAPHOR.length +
    ' | 工程误伤 ' + c + '/' + NEG_ENG.length +
    ' | 普通陈述误伤 ' + d + '/' + NEG_PLAIN.length +
    ' | 总误伤 ' + (c + d) + '/' + (NEG_ENG.length + NEG_PLAIN.length));
}
