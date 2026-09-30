// round-299 probe-8：E3 引导式族的第二轮机会 —— 加中文 r297 已验证的
// 「B 侧本体论词表 + 逗号负向前瞻」条件，看误伤能否压到 0。
// 若仍误伤 → 否决 E3，本轮只上 E1+E2。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const ONTO = 'soul|spirit|essence|meaning|purpose|truth|journey|destiny|echo|silence|shadow|mirror|door|bridge|gift|tyranny|compass|home|destination|awakening|wholeness|vulnerability|humanity|courage|uncertainty|depth|being|becoming|presence|grace|wonder|worth|currenc\\w+|language|teacher|garden|river|storm|mountain|ocean|fire|light|darkness|curiosity|humility|stillness|longing|solitude|tenderness|becom\\w+|witness|beholder|measure';

// E3b：引导式 + B 侧本体论词表 + 逗号负向前览
const E3b = new RegExp('\\b(?:the\\s+)?(?:real|key|fundamental|only|hardest|deeper)\\s+(?:question|problem|challenge|issue|test|work|lesson)\\s+is\\s+(?:not|n\'t)\\s+[^.,;:]{2,60}?[,;]?\\s*(?:but|rather|it\\s+is)\\s+[^.,;:]{2,60}\\b(?:' + ONTO + ')\\b(?!\\s*[,.])', 'i');

// E1 的引导式变体：B 侧词表不变，只在主语侧加升格引导词（不带本体论词要求的宽松版）
const E1g = new RegExp('\\b(?:real|key|fundamental|only|hardest|deeper)\\s+(?:question|problem|challenge|issue|test|work|lesson)\\b[^.,;:]{0,30}\\b(?:is|are)\\s+(?:not|n\'t)\\s+[^.,;:]{2,70}?[,;]\\s*(?:it\\s+is|it\'s|but|rather|it\\s+means)?\\s*(?:about\\s+|in\\s+)?[^.,;:]{2,60}\\b(?:' + ONTO + ')\\b', 'i');

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
  'The fundamental issue is not the bug itself but the missing test coverage.',
  'The real test is not load but correctness under edge cases.',
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
const allNeg = NEG_ENG.concat(NEG_PLAIN);
for (const [name, re] of [['E3b', E3b], ['E1g', E1g]]) {
  const a = POS_PD.filter(s => re.test(s)).length;
  const fp = allNeg.filter(s => re.test(s));
  console.log(name + ' | 伪辩证真阳 ' + a + '/' + POS_PD.length + ' | 误伤 ' + fp.length + '/' + allNeg.length);
  fp.forEach((s, i) => console.log('    FP[' + i + '] ' + s.slice(0, 72)));
}
