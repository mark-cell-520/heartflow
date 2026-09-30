// round-299 probe-7：终版候选压测（三族，中文 r297 分界线方法论 EN 移植）
//   E1 伪辩证 + B 侧本体论词表（含扩展词）
//   E2 抽象主语域 × 系词 × 具象比喻物
//   E3 引导式主语（the real question / what matters）+ not A but B
// 同时用 20 条工程真句 + 12 条普通抽象陈述测误伤；再叠 12 条中性内容做误伤抽查。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const ONTO = 'soul|spirit|essence|meaning|purpose|truth|journey|destiny|echo|silence|shadow|mirror|door|bridge|gift|tyranny|compass|home|destination|awakening|wholeness|vulnerability|humanity|courage|uncertainty|depth|being|becoming|presence|grace|wonder|worth|currenc\\w+|language|teacher|garden|river|storm|mountain|ocean|fire|light|darkness|curiosity|humility|stillness|longing|silence|solitude|tenderness';

const E1 = new RegExp('\\b(?:is|are|was|were)\\s+(?:not|n\'t|never)\\s+[^.,;:]{2,70}?[,;]\\s*(?:it\\s+is|it\'s|but|rather|it\\s+means)?\\s*(?:about\\s+|in\\s+)?[^.,;:]{2,60}\\b(?:' + ONTO + ')\\b', 'i');
const E2 = new RegExp('\\b(?:time|life|silence|growth|loneliness|freedom|happiness|maturity|patience|fear|hope|courage|memory|age|love|grief|death|childhood|youth|trust)\\b[^.,;:]{0,20}\\b(?:is|are|was|were)\\b[^.,;:]{0,40}\\b(?:tyranny|journey|map|answer|answers|mirror|prison|gift|currenc\\w+|language|bridge|door|window|room|road|echo|teacher|thief|garden|river|mountain|ocean|storm|fire|light|darkness|shadow|home|power)\\b', 'i');
const E3 = new RegExp('\\b(?:the\\s+)?(?:real|key|fundamental|only|hardest)\\s+(?:question|problem|challenge|issue|test)\\s+is\\s+(?:not|n\'t)\\s+[^.,;:]{2,60}?[,;]?\\s*(?:but|rather|it\\s+is)\\s+[^.,;:]{2,50}', 'i');

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
const POS_MET = [
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
  'The real challenge is not choosing a framework but keeping the team productive.',
  'The hardest problem is not writing the code, it is maintaining it over years.',
  'The key issue is not performance but correctness of the implementation.',
  'The real question is not whether to migrate, it is when to start.',
  'What changed is not the API surface but the default timeout value.',
  'Our real bottleneck is not CPU usage, it is disk wait time.',
  'The fundamental issue is not the bug itself but the missing test coverage.',
  'The real test is not load but correctness under edge cases.',
  'The problem is not that it is slow, it is that it fails silently.',
  'The difference is not speed, it is the memory footprint under load.',
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

const groups = [['E1', E1], ['E2', E2], ['E3', E3], ['E1+E2', null], ['E1+E2+E3', null]];
const allNeg = NEG_ENG.concat(NEG_PLAIN);
for (const [name, re] of groups) {
  const test = (s) => {
    if (name === 'E1+E2') return E1.test(s) || E2.test(s);
    if (name === 'E1+E2+E3') return E1.test(s) || E2.test(s) || E3.test(s);
    return re.test(s);
  };
  const a = POS_PD.filter(test).length;
  const b = POS_MET.filter(test).length;
  const fp = allNeg.filter(test);
  console.log(name + ' | 伪辩证 ' + a + '/' + POS_PD.length +
    ' | 比喻 ' + b + '/' + POS_MET.length +
    ' | 总召回 ' + (a + b) + '/' + (POS_PD.length + POS_MET.length) +
    ' | 误伤 ' + fp.length + '/' + allNeg.length);
  fp.forEach((s, i) => console.log('    FP[' + i + '] ' + s.slice(0, 70)));
}
