// [v6.7.130 第 299 轮] guard: doubt-ppf-en-ontological-r299
// 守卫目标：PSEUDO_PROFUNDITY_PATTERNS.en 新增的 E1/E2 两条 EN 判据。
// 口径：一律以线上 gate（checkOutput→findings）为准，不用离线正则复刻
//（probe-14 踩过坑：手抄正则与线上不一致，会造出假通过）。
// 分组与标称值来自 probe-17 线上实测 + probe-7 的 0/42 误伤：
//   ① E1 伪辩证真阳：5/5 命中（BASE 实测 5 条）
//   ② E2 跨域比喻真阳：8/8 命中
//   ③ 工程归因真阴：0/20 命中
//   ④ 普通陈述真阴：0/12 命中
// 判据失效条件：任一组命中数脱离标称值 → 该组全红。
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

// ① E1 伪辩证真阳（probe-17 线上实测命中的 5 条）
const POS_PD = [
  'Maturity is not about finally arriving, it is about learning to live with uncertainty.',
  'Loneliness is not a flaw, it is the background color of the soul.',
  'True strength is not the absence of fear, but continuing after admitting vulnerability.',
  'Freedom is not doing whatever you want, it is being able to bear every consequence.',
  'Age is not a number, it is a depth of memory.',
];
// ② E2 跨域比喻真阳（8/8）
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
// ③ 工程归因真阴（0/20）
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
// ④ 普通抽象陈述真阴（0/12）
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

const pdHit = POS_PD.filter(ppf).length;
const metHit = POS_MET.filter(ppf).length;
const fpEng = NEG_ENG.filter(ppf).length;
const fpPlain = NEG_PLAIN.filter(ppf).length;

// [v6.7.130 第 300 轮] 补 run-all 收集器要求的「N 通过, M 失败」汇总行。
// 上一版只打分组数字，全量跑时被判为「静默」（2 失败实为格式问题）。
// 口径：每组一个断言，4 组 = 4 个断言。
const totalAssert = 4;
const failedAssert =
  (pdHit === POS_PD.length ? 0 : 1) +
  (metHit === POS_MET.length ? 0 : 1) +
  (fpEng === 0 ? 0 : 1) +
  (fpPlain === 0 ? 0 : 1);

assert.strictEqual(pdHit, POS_PD.length,
  `E1 伪辩证真阳应 ${POS_PD.length}/${POS_PD.length}，实际 ${pdHit}`);
assert.strictEqual(metHit, POS_MET.length,
  `E2 跨域比喻真阳应 ${POS_MET.length}/${POS_MET.length}，实际 ${metHit}`);
assert.strictEqual(fpEng, 0, `工程归因真阴误伤 ${fpEng}/${NEG_ENG.length}，应 0`);
assert.strictEqual(fpPlain, 0, `普通陈述真阴误伤 ${fpPlain}/${NEG_PLAIN.length}，应 0`);

console.log('✅ ppf-en-ontological-r299 全通过');
console.log(`   E1 伪辩证: ${pdHit}/${POS_PD.length}`);
console.log(`   E2 跨域比喻: ${metHit}/${POS_MET.length}`);
console.log(`   工程真阴误伤: ${fpEng}/${NEG_ENG.length}`);
console.log(`   普通陈述误伤: ${fpPlain}/${NEG_PLAIN.length}`);
console.log(`${totalAssert - failedAssert} 通过, ${failedAssert} 失败`);
