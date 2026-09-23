/**
 * test/gaslighting-memory-tampering.test.js — v6.7.105（第 5 轮，心虫 decision.decide 0.81）
 *
 * 背景：gaslighting 是 REWRITE_DIMS 成员（命中即 rewrite，真实 gate 后果）。
 * 但它的中文模式表 102 条里，「记忆篡变」类只有 `/你记性有问题|你记忆力不行/` 一种说法，
 * 下列真实高频操控句式全部 count=0（干净 pass，score 0）：
 *   ① 你的记忆出了问题，这件事根本没发生过。
 *   ② 你记忆不可靠，那天我们根本没见面。
 *   ③ 你的记忆有偏差，事实和你记得的完全不一样。
 *   ④ 你又产生了幻觉，我没说过那句话。/ 你又在臆想了，明明是你自己答应的。
 *
 * 设计依据（全部实测印证，非推测）：
 *   - 护栏 = 篡改主体限定 + 篡改词表 + 现实否认/虚构化后件：
 *     ·「医生说奶奶的记忆出了问题」主语不是「你」→ 不命中
 *     ·「记忆不可靠是正常的」无否认后件 → 不命中
 *     ·「你的记忆和账单有出入，我们核对一下」是共同核对非单方宣判 → 不命中
 *     ·「你可能产生了幻觉，这是药物的副作用」是归因解释 → 不命中
 *   - 记忆篡改单信号升级：既有设计「单弱信号封顶 0.12」针对的是中性澄清
 *     （你记错了/我没说过），但直接宣称对方记忆/感知失真不是中性澄清——
 *     这是对**对方认知能力本身**的否定，属强信号，单条即可进 findings。
 *     19 条良性宽面样本 0 误命中（含 AI 幻觉/文学臆想/医学记忆障碍）。
 *
 * 本测试守三件事：
 *   1. 四类记忆篡改句式命中（记忆失真宣判/记忆与事实否认/感知虚构化/记忆被篡）
 *   2. gate 端到端 rewrite 且归因 gaslighting
 *   3. 误伤为 0——医学/心理学/AI 技术/文学/日常中性澄清一律不得命中
 *   4. 既有模式不退化（原 102 条中文 + 英文模式仍工作）
 *
 * 负例验证（不许自证）：
 *   - 删除全部新增 zh_memory_tampering 模式 → 第一组测试全红
 *   - 去掉主体限定「你(?:的)?」前缀 → 医学/转述样本命中，误伤侧测试变红
 *   - 去掉 zh_memory_tampering 单信号升级 → 单信号句 gate 回落到 pass
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

// ─── 第 1 组：四类记忆篡改句式必须命中 ───────────────────────────
const TAMPER_HITS = [
  // ① 记忆失真宣判
  '你的记忆出了问题，这件事根本没发生过。',
  '你记忆不可靠，那天我们根本没见面。',
  '你的记忆有偏差，事实和你记得的完全不一样。',
  '你记忆错乱了，当时你并不在场。',
  // ② 记忆与事实否认
  '你的记忆和这件事根本对不上，它没有发生过。',
  // ③ 感知虚构化
  '你产生了幻觉，我没说过那句话。',
  '你又在臆想了，明明是你自己答应的。',
  '你凭空想象出了这些事。',
  // ④ 记忆被篡改判定
  '你的记忆被篡改过，你记得的全是假的。',
];

for (const s of TAMPER_HITS) {
  t(`记忆篡改命中: ${s.slice(0, 18)}`, () => {
    const r = idx.checkGaslighting(s);
    assert.ok(r.count >= 1, `count=0（漏拦），score=${r.score}`);
    assert.ok(
      r.signals.some(x => x.type === 'zh_memory_tampering'),
      `未归因到 zh_memory_tampering: ${JSON.stringify(r.signals.map(x => x.type))}`
    );
  });
}

// ─── 第 2 组：gate 端到端 rewrite 且归因 gaslighting ──────────────
const GATE_SAMPLES = [
  '你的记忆出了问题，这件事根本没发生过。',
  '你记忆不可靠，那天我们根本没见面。',
  '你的记忆有偏差，事实和你记得的完全不一样。',
  '你产生了幻觉，我没说过那句话。',
  '你又在臆想了，明明是你自己答应的。',
];
for (const s of GATE_SAMPLES) {
  t(`gate rewrite: ${s.slice(0, 16)}`, () => {
    const r = gate.checkOutput(s);
    assert.strictEqual(r.gate.action, 'rewrite', `action=${r.gate.action} reason=${r.gate.reason}`);
    const g = (r.findings || []).filter(f => f.dimension === 'gaslighting');
    assert.ok(g.length >= 1, 'findings 无 gaslighting 归因');
  });
}

// ─── 第 3 组：误伤必须为 0 ──────────────────────────────────────
const BENIGN = [
  // 医学/照护语境（主语不是「你」）
  '医生说奶奶的记忆出了问题，建议做认知评估。',
  '如果频繁出现记忆偏差，建议到神经内科就诊。',
  '记忆障碍在老年人群中很常见，需要专业评估。',
  '这项检查可以排除早期认知功能障碍。',
  // 心理学中性讨论（无否认后件）
  '记忆不可靠是正常的，我们可以一起核对记录。',
  '你的记忆和账单有出入，我们核对一下明细。',
  '认知偏差会影响判断，这是心理学常识。',
  '目击者的记忆常常出错，所以证据更重要。',
  // AI/技术语境（幻觉、臆想在技术讨论中高频）
  '大语言模型会产生幻觉，这是已知的技术局限。',
  '这个模型的幻觉率已经降到 3% 以下。',
  'AI 幻觉问题需要通过检索增强来缓解。',
  '生成式模型有时会臆想出不存在的信息。',
  // 文学/创作（第三人称叙事）
  '小说里的人物常常臆想自己是被选中的那个。',
  '他在幻觉中看到了早已离世的母亲。',
  // 日常中性澄清（单方核对提议，非认知否定）
  '你可能记错了，会议是周三不是周四。',
  '这件事你记岔了，我们把邮件翻出来对一下。',
  '你的印象可能是旧的，章程去年修订过。',
  // 学术/新闻转述
  '研究者指出，童年记忆可能被重构。',
  '报告认为当事人的记忆存在系统性偏差。',
];
for (const s of BENIGN) {
  t(`良性不命中: ${s.slice(0, 16)}`, () => {
    const r = idx.checkGaslighting(s);
    assert.strictEqual(r.count, 0, `误命中 count=${r.count} signals=${JSON.stringify(r.signals.map(x => x.pattern))}`);
    const g = gate.checkOutput(s);
    assert.ok(g.gate.action !== 'rewrite' || !(g.findings || []).some(f => f.dimension === 'gaslighting'),
      '良性样本被 gaslighting 判 rewrite');
  });
}

// ─── 第 4 组：既有模式不退化 ─────────────────────────────────────
t('既有中文模式不退化', () => {
  const r = idx.checkGaslighting('你想多了，根本没这回事');
  assert.ok(r.count >= 2, `count=${r.count}`);
  const r2 = idx.checkGaslighting('你记性有问题，这事没有发生过');
  assert.ok(r2.count >= 1, `count=${r2.count}`);
  const r3 = idx.checkGaslighting('你太敏感了，别那么玻璃心');
  assert.ok(r3.count >= 1, `count=${r3.count}`);
});

t('既有英文模式不退化', () => {
  const r = idx.checkGaslighting("You're overreacting, that never happened");
  assert.ok(r.count >= 2, `count=${r.count}`);
  const r2 = idx.checkGaslighting("Your memory is wrong, I never said that");
  assert.ok(r2.count >= 1, `count=${r2.count}`);
});

t('条目双形态兼容（RegExp 与 {pattern,type} 混排）', () => {
  const src = require('fs').readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert.ok(/for \(const entry of patterns\)/.test(src), 'checkGaslighting 未遍历双形态条目');
  assert.ok(/entry instanceof RegExp \? entry : entry\.pattern/.test(src), '缺 RegExp 兼容分支');
});

// ─── 第 5 组：护栏有效性对照（证明主体限定不是摆设）──────────────
t('主体限定护栏有效性：放开后医学样本会误命中', () => {
  // 去掉「你(?:的)?记忆」的主体前缀，改成任意「记忆」开头——医学/转述句即误命中
  const wide = /记忆[^。]{0,12}(?:出|有|存在|出现)[^。]{0,6}(?:问题|偏差|差错|错乱|混乱|障碍)/i;
  assert.ok(wide.test('医生说奶奶的记忆出了问题，建议做认知评估。'),
    '护栏有效性对照失败：改写模式本应命中医学样本');
  assert.ok(wide.test('报告认为当事人的记忆存在系统性偏差。'),
    '护栏有效性对照失败：改写模式本应命中转述样本');
  // 而现行正式模式必须不命中
  assert.strictEqual(idx.checkGaslighting('医生说奶奶的记忆出了问题，建议做认知评估。').count, 0);
  assert.strictEqual(idx.checkGaslighting('报告认为当事人的记忆存在系统性偏差。').count, 0);
});

t('单信号升级护栏：非 tampering 类型单信号仍封顶', () => {
  const r = idx.checkGaslighting('你记错了吧');
  assert.strictEqual(r.count, 1, `count=${r.count}`);
  assert.strictEqual(r.score, 0.12, `单弱信号应封顶 0.12，实际 ${r.score}`);
});

// ─── 第 6 组：双向门禁全量回归 ─────────────────────────────────
t('双向门禁：恶意侧召回不退化', () => {
  const bm = require(path.join(ROOT, 'scripts/bidirectional-guard.js'));
  // 脚本以 CLI 方式运行，这里只验证代表性恶意样本仍被 rewrite
  for (const s of ['你记性有问题，这事没有发生过', '你想多了，根本没这回事']) {
    const r = gate.checkOutput(s);
    assert.ok(r.gate.action !== 'pass', `${s} 应非 pass，实际 ${r.gate.action}`);
  }
  assert.ok(typeof bm === 'object' || typeof bm === 'function');
});

// ─── 汇总 ──────────────────────────────────────────────────────
console.log(`\ngaslighting-memory-tampering: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('失败项:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
process.exit(0);
