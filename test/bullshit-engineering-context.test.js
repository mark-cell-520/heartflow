/**
 * test/bullshit-engineering-context.test.js — v6.7.103（第 3 轮，心虫 decision.decide 0.91）
 *
 * 背景：bullshit_recognition 是 REWRITE_DIMS 成员，但它的英文 buzzword 词表里
 * 混进了 4 个**正当工程动词**（scale/optimize/leverage/pivot）。这 4 个词单独
 * 命中时 score=0.1（进不了 findings 的 0.15 门槛，pass）；两个一叠加就到 0.2
 * → 进 findings → bullshit 命中 REWRITE_DIMS → 纯良性英文工程句被判 rewrite：
 *
 *   "We should scale the service and optimize the query to reduce latency"
 *   "The team decided to pivot the roadmap and leverage the existing API layer"
 *
 * 双向门禁 326 条良性样本里 0 条含 2 个英文 buzzword，所以这个误拦从词表建立
 * 起就没被抓到过（静态差集测不出来，必须用真实工程句式去撞）。
 *
 * 本测试守三件事：
 *   1. 工程动词不计入空话浓度（count/score 与 buzzword 解耦）
 *   2. 真空话不受影响（召回不退化：3+ 种不同 buzzword 仍 rewrite）
 *   3. count 按**去重词种**计——同一个词重复两次不翻倍（颗粒度反复用的良性句）
 *
 * 负例验证（不许自证）：把 checkBullshitRecognition 的词表/计数逻辑回退到
 * 改动前形态（工程动词进 buzzword 表 + count=bs.length），本文件大量测试变红；
 * 反之把工程共现豁免整体删掉，误拦侧测试也必须变红。
 */

'use strict';
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

let passed = 0;
let failed = 0;
const failures = [];

function t(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; failures.push(`${name}: ${e.message}`); }
}

const { checkBullshitRecognition } = idx;
assert(typeof checkBullshitRecognition === 'function', 'checkBullshitRecognition 必须导出');

// ═══════════════════════════════════════════════════════════════
// 一、工程动词单独记账，不进 buzzword 浓度
// ═══════════════════════════════════════════════════════════════

const ENG_VERBS = ['scale', 'optimize', 'leverage', 'pivot'];

t('4 个工程动词都在独立记账表里', () => {
  const r = checkBullshitRecognition('We should scale and optimize the service, leverage the API, pivot the design.');
  const names = (r.engineering_verbs || []).map(x => x.pattern.toLowerCase()).sort();
  assert.deepStrictEqual(names, ['leverage', 'optimize', 'pivot', 'scale'],
    `engineering_verbs 应含全部 4 个，实得 ${JSON.stringify(names)}`);
});

t('工程动词不计入 count（单条 0.1，进不了 findings 门槛）', () => {
  for (const v of ENG_VERBS) {
    const r = checkBullshitRecognition(`We should ${v} the service to reduce user latency.`);
    assert.strictEqual(r.count, 0, `"${v}" 不该计入空话种数，count=${r.count}`);
    assert.strictEqual(r.score, 0, `"${v}" 不该产生空话分，score=${r.score}`);
    assert.strictEqual(r.bs.length, 0, `"${v}" 不该进 buzzword 命中表`);
  }
});

t('4 个工程动词全叠加仍 count=0（纯工程句）', () => {
  const r = checkBullshitRecognition('Scale the cluster, optimize the cache index, pivot the shard key, then validate throughput.');
  assert.strictEqual(r.count, 0, `4 个工程动词叠加 count 应 0，实得 ${r.count}`);
  assert.strictEqual(r.score, 0, `4 个工程动词叠加 score 应 0，实得 ${r.score}`);
});

t('工程动词派生词不受 \b 影响（scalable/optimizer 也不该算/该算）', () => {
  // scalable cache / query optimizer 是典型良性工程名词；
  // 词边界保证 scale 不匹配 scalable，optimize 不匹配 optimizer。
  const r = checkBullshitRecognition('A scalable cache with a query optimizer reduces latency.');
  assert.strictEqual(r.count, 0, `派生词不该触发空话，count=${r.count}`);
});

t('工程动词与真空话混现时只算空话（最长匹配优先剔除超串）', () => {
  const r = checkBullshitRecognition('We should scale the service and make a real paradigm shift with synergy.');
  assert.strictEqual(r.count, 2, `只该计 paradigm shift + synergy，实得 ${r.count}`);
  const names = r.hit_spans.map(x => x.pattern.toLowerCase()).sort();
  assert.deepStrictEqual(names, ['paradigm shift', 'synergy'],
    `paradigm 是 paradigm shift 的超串，被覆盖后不该再计一种，实得 ${JSON.stringify(names)}`);
  // bs 是原始命中（未剔重），保留供审计，不影响 count
  assert.ok(r.bs.length >= 2, 'bs 保留原始命中供审计');
});

// ═══════════════════════════════════════════════════════════════
// 二、误拦侧：良性工程句不得判 rewrite（核心回归哨兵）
// ═══════════════════════════════════════════════════════════════

const BENIGN_ENG = [
  'We should scale the service and optimize the query to reduce latency for users.',
  'The team decided to pivot the roadmap and leverage the existing API layer.',
  'To scale this system we optimize the hot path and pivot the design if benchmarks regress.',
  'We optimized the index to reduce query latency, and we will scale out the read replicas.',
  'Scale the cluster, optimize the cache index, pivot the shard key, then validate throughput.',
  '我们要 scale 这个服务并 optimize 数据库索引，降低 p99 延迟。',
  'Let us optimize the index to improve performance. We can scale out later.',
  'To scale this system we optimize the hot path and reduce allocations. The team will pivot if benchmarks show regressions.',
];

for (const text of BENIGN_ENG) {
  t(`良性工程句 pass/verify：${text.slice(0, 46)}…`, () => {
    const r = gate.checkOutput(text);
    assert.ok(['pass', 'verify'].includes(r.gate.action),
      `纯工程句不得判 ${r.gate.action}（${r.gate.reason}）：${text}`);
  });
}

t('中文高频重复词不翻倍：颗粒度用两次仍是良性', () => {
  const text = '需求颗粒度太粗，拆细到二级颗粒度。';
  const r = gate.checkOutput(text);
  assert.ok(['pass', 'verify'].includes(r.gate.action),
    `颗粒度重复使用是正常需求表达，不得判 ${r.gate.action}`);
  assert.strictEqual(checkBullshitRecognition(text).count, 1, '同一词种只计一次');
});

t('中文新增 buzzword 单次命中不 rewrite（拉新/裂变等业务词常见）', () => {
  const cases = [
    '本季度拉新成本控制在 45 元，环比下降 12%。',
    '活动上线首日裂变系数 1.8，新增用户 2.3 万。',
    '促销组合拳已确定：满减加赠品，转化率预计提升 8%。',
    '新能源汽车赛道竞争激烈，2025 年渗透率 58%。',
    '数据中台已上线，报表从 3 天缩短到 2 小时。',
    '在协作工具市场我们的生态位偏上游，API 调用量占比第一。',
    '硬件业务是第二增长曲线，营收占比 23%。',
    '项目的顶层设计经过三轮评审，范围已锁定。',
    '品牌经过半年积累已形成增长势能，复购率 34%。',
  ];
  for (const text of cases) {
    const r = gate.checkOutput(text);
    assert.ok(['pass', 'verify'].includes(r.gate.action),
      `业务词单次命中不得 rewrite（${r.gate.action}）：${text}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// 三、召回侧：真空话仍然 rewrite（不得因放宽而退化）
// ═══════════════════════════════════════════════════════════════

const BULLSHIT_EN = [
  'We need to think outside the box and make a paradigm shift with true synergy.',
  'This is a game-changing, revolutionary, transformative paradigm shift for the industry.',
  'Let us leverage our core competencies moving forward at the end of the day.',
  'Our holistic next level synergistic deep dive will be a quantum leap.',
  'We will disrupt the market with a groundbreaking world class best in class product.',
  'It is a paradigm shift: synergy meets holistic transformation at scale.',
];

for (const text of BULLSHIT_EN) {
  t(`真空话仍 rewrite：${text.slice(0, 44)}…`, () => {
    const r = gate.checkOutput(text);
    assert.strictEqual(r.gate.action, 'rewrite',
      `真空话必须 rewrite，实得 ${r.gate.action}（${r.gate.reason}）：${text}`);
    assert.ok(r.findings.some(f => f.dimension === 'bullshit'),
      'findings 里必须出现 bullshit 维度');
  });
}

const BULLSHIT_ZH = [
  '说白了就是赋能抓手闭环，底层逻辑就是降维打击。',
  '一切都是最好的安排，格局打开，提升认知，实现觉醒与顿悟。',
  '我们要抓住真正的抓手，把中台和私域全部打通，形成组合拳，抢占赛道，积累势能。',
];

for (const text of BULLSHIT_ZH) {
  t(`中文真空话仍 rewrite：${text.slice(0, 40)}…`, () => {
    const r = gate.checkOutput(text);
    assert.strictEqual(r.gate.action, 'rewrite',
      `中文真空话必须 rewrite，实得 ${r.gate.action}（${r.gate.reason}）：${text}`);
  });
}

t('中文新增 buzzword 至少 3 种叠加才 rewrite（新增词单独不拦）', () => {
  const two = checkBullshitRecognition('抓手是供应链效率，组合拳包括满减和赠品。');
  assert.strictEqual(two.count, 2, `2 种应计 2，实得 ${two.count}`);
  assert.strictEqual(two.score, 0.2, `2 种 score 应 0.2，实得 ${two.score}`);
});

t('score 封顶 0.6（空话再多也不是安全红线）', () => {
  const r = checkBullshitRecognition('赋能闭环颗粒度降维打击底层逻辑认知升级觉醒共振能量频率磁场修炼道法术器顿悟开悟涅槃');
  assert.ok(r.score <= 0.6, `score 不得超过 0.6，实得 ${r.score}`);
});

// ═══════════════════════════════════════════════════════════════
// 四、双向门禁铁律：改动不得恶化误拦基线
// ═══════════════════════════════════════════════════════════════

t('双向门禁良性侧无 block/rewrite 由 bullshit 引起（基线 0 条）', () => {
  const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
  const benign = [];
  for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
    for (const s of (gb.SAMPLES[cat] || [])) {
      const text = typeof s === 'string' ? s : (s.text || s.input || '');
      if (text) benign.push(text);
    }
  }
  assert.ok(benign.length >= 70, `良性样本应 >= 70，实得 ${benign.length}`);
  let bsFlagged = 0;
  for (const text of benign) {
    const r = gate.checkOutput(text);
    if ((r.gate.action === 'rewrite' || r.gate.action === 'block')
        && r.findings.some(f => f.dimension === 'bullshit')) {
      bsFlagged++;
    }
  }
  assert.strictEqual(bsFlagged, 0, `不得有良性样本因 bullshit 被判改写，实得 ${bsFlagged} 条`);
});

console.log(`\n${'='.repeat(60)}`);
console.log(`bullshit-engineering-context: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
console.log('全部通过');
