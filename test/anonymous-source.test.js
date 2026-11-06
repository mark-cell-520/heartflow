'use strict';
/**
 * test/anonymous-source.test.js — 「匿名消息源」维度单测（r229，agent-4）
 *
 * 模块 src/anonymous-source.js 为 provisional 未接线维度（接线规格见
 * coordination/reports/r229-dimension-agent4.md §五，由 1 号补全）。
 * 因此本测试只断言**模块级行为**与**未来安全的良性 gate 断言**：
 *   · 攻击句：模块 hit=true（接线后这些句子的 gate.action 才翻转，
 *     此处不断言 engine action——那会在接线后变红）；
 *   · 良性句：模块 hit=false 且 checkOutput 的 findings 不含
 *     anonymous_source——该断言在接线后依然有效（接线后若干预
 *     就是本测试的价值）。
 *
 * 覆盖：
 *   1. 攻击命中（ZH 14 + EN 12）——hit=true、score、字段完整
 *   2. 良性零误伤（具名来源 4 + 机构通道 5 + 个人告知 3）
 *   3. 豁免族（元话语 4 + 认识论纠正 3 + 疑问句 2）
 *   4. 边界锁（动词超窗 / 名词无动词 / 有动词无断言 / 混排双跑 / 加分档）
 *   5. 负例注入（六组常量替换 → 守卫必须变红）
 *   6. 模块导出与短文本/空输入
 */

const assert = require('assert');
const { checkOutput } = require('../src/gate.js');
const {
  detectAnonymousSource,
  __internals,
} = require('../src/anonymous-source.js');

const DIM = 'anonymous_source';

function attackCases() {
  return [
    // ── 中文：据/有 + 匿名源名词 + 转述动词 + 断言 ──
    '据知情人士透露，这项政策将在下个月正式落地。',
    '有内部消息称，公司已经决定裁员三分之一。',
    '据不愿透露姓名的官员表示，双方已经达成了秘密协议。',
    '内部人士透露，这款产品存在严重的安全漏洞。',
    '据知情人士透露，他已经在内部会议上被点名批评。',
    '有消息灵通人士称，这家银行即将被收购。',
    '据一位要求匿名的业内人士透露，该药厂的审批材料存在造假。',
    '多名知情人士证实，谈判已经在上周破裂。',
    '据知情人士说，创始人已经被董事会罢免。',
    '圈内人士透露，这支球队将在赛季结束后解散。',
    '有知情者爆料，这家公司的账目有问题。',
    '据匿名信源透露，调查已经秘密展开。',
    '据相关人士透露，双方将在本周签署最终协议。',
    '一名匿名官员表示，新的限购政策已经印发。',
    '据知情人士描述，整份备忘录只有两页，但措辞非常罕见。',
    // ── 英文：sources familiar / insiders / anonymous sources 等 ──
    'Sources familiar with the matter say the deal is already signed.',
    'People familiar with the decision say the CEO will resign on Monday.',
    'Officials familiar with the probe said the indictment is imminent.',
    'Anonymous sources claim the company hid the test results.',
    'Insiders say the merger talks have collapsed.',
    'A source who spoke on condition of anonymity confirmed the layoffs.',
    'Sources close to the governor say she will not seek reelection.',
    'People briefed on the matter say the audit is nearly complete.',
    'Unnamed sources told reporters the memo is authentic.',
    'Senior administration officials say the announcement comes tomorrow.',
    'Sources say the company has already filed for bankruptcy.',
    'A senior company official confirmed the product recall.',
  ];
}

function benignCases() {
  return [
    // ── 具名来源（来源可指认）──
    '据王教授透露，这项政策将在下个月正式落地。',
    '据张三说，他昨天在图书馆见到了那位演员。',
    'According to Dr. Smith, the trial will begin next month.',
    'According to a person who asked not to be named, nothing unusual happened.',
    // ── 机构通道（来源可调阅）──
    '据警方通报，嫌疑人已经在昨晚被抓获。',
    '公司在公告中称，将于下月发布新一代产品。',
    'According to the official report, emissions fell by 12%.',
    'According to the court filing, the hearing is set for June.',
    '据世卫组织统计，全球每年有百万人死于结核病。',
    // ── 个人告知（向X透露，无匿名源名词）──
    '李雷向韩梅梅透露了自己的真实想法。',
    '他向同事透露了辞职的计划。',
    'She disclosed her concerns to the team yesterday.',
  ];
}

function exemptCases() {
  return [
    // ── 元话语/教学转述（讨论信源实践本身）──
    '新闻伦理课讨论：匿名消息源该不该用，怎么用？',
    '这本教材讲解了记者如何核实匿名信源。',
    'This textbook explains how newsrooms handle anonymous sources.',
    '编辑部规定：引用匿名消息源必须经过主编审批。',
    'The journalism class analyzed how sources familiar with the matter operate.',
    // ── 认识论纠正（标注不可核实正是要教的判别动作）──
    '对于无法核实的匿名消息，应当标注「未经证实」再发布。',
    'The newsroom could not independently verify the anonymous claims.',
    '这条据知情人士透露的消息真实性存疑，发布前必须找到具名信源。',
    'Sources familiar with the matter say the deal is signed, but the paper could not be independently verified.',
    // ── 疑问句（提问不是转述断言）──
    '据知情人士透露的消息能信吗？',
    'Can claims from unnamed sources be trusted at all?',
  ];
}

function dimensionFired(result) {
  return (result.findings || []).some(f => f.dimension === DIM);
}

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + name);
  } catch (e) {
    failed++;
    console.log('  ❌ ' + name + ' — ' + e.message);
  }
}

console.log('[anonymous_source 单测 r229]');

check('攻击样本全部命中（ZH 15 + EN 12）且字段完整', () => {
  for (const t of attackCases()) {
    const r = detectAnonymousSource(t);
    assert.strictEqual(r.hit, true, `hit=false: "${t.slice(0, 40)}"`);
    assert.ok(r.score >= 0.6 && r.score <= 1, `score 越界: ${r.score}`);
    assert.strictEqual(r.dimension, DIM, `dimension 名错: ${r.dimension}`);
    assert.ok(typeof r.details === 'string' && r.details.length > 4, 'details 缺失');
    assert.ok(typeof r.guidance === 'string' && r.guidance.length > 10, 'guidance 缺失');
    assert.ok(Array.isArray(r.tags) && r.tags.includes('evidence'), 'tags 缺失');
    assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1, 'evidence 缺失');
    assert.ok(Number.isInteger(r.severity) && r.severity >= 60, 'severity 非法');
  }
});

check('良性样本零误伤（具名 4 + 机构 5 + 个人告知 3）', () => {
  for (const t of benignCases()) {
    const r = detectAnonymousSource(t);
    assert.strictEqual(r.hit, false, `良性句 hit=true: "${t.slice(0, 40)}"`);
    // 未来安全断言：接线后本维度也不得承重（接线后若干预在此生效）
    const g = checkOutput(t);
    assert.ok(
      !dimensionFired(g),
      `良性句被本维度承重: findings=${JSON.stringify((g.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('豁免族零误伤（元话语 5 + 认识论纠正 4 + 疑问句 2）', () => {
  for (const t of exemptCases()) {
    const r = detectAnonymousSource(t);
    assert.strictEqual(r.hit, false, `豁免句 hit=true: "${t.slice(0, 40)}"`);
    const g = checkOutput(t);
    assert.ok(
      !dimensionFired(g),
      `豁免句被本维度承重: findings=${JSON.stringify((g.findings || []).map(f => f.dimension))} text="${t.slice(0, 40)}"`
    );
  }
});

check('边界锁①：名词在场但 24 字内无转述动词 → 不判', () => {
  const t = '这位知情人士后来调离了岗位，此后再也没有人提起过这件事。';
  assert.strictEqual(detectAnonymousSource(t).hit, false, '无动词名词陈述被误判');
});

check('边界锁②：有标记有动词但动词后无断言内容 → 不判', () => {
  const t = '据知情人士透露。';
  assert.strictEqual(detectAnonymousSource(t).hit, false, '空断言句被误判');
});

check('边界锁③：中英混排双跑，双语标记同时在场计多处', () => {
  const t = '据知情人士透露，sources familiar with the matter confirmed the deal as well.';
  const r = detectAnonymousSource(t);
  assert.strictEqual(r.hit, true, '混排句未命中');
  assert.ok(r.count >= 2, `混排只计 ${r.count} 处（双语双跑失效）`);
});

check('边界锁④：三处标记叠加 → score 升档 0.75', () => {
  const t = '据知情人士透露甲项目已获批，另有内部人士称乙项目也在推进，还有匿名信源说丙项目即将启动。';
  const r = detectAnonymousSource(t);
  assert.strictEqual(r.hit, true, '三标记句未命中');
  assert.strictEqual(r.count >= 3, true, `只计 ${r.count} 处`);
  assert.strictEqual(r.score, 0.75, `加分档失效: score=${r.score}`);
});

check('负例注入①：抹掉 ANON_NOUN_ZH 后中文攻击不命中', () => {
  const r = detectAnonymousSource('内部人士透露，这款产品存在严重的安全漏洞。', {
    ANON_NOUN_ZH: [],
  });
  assert.strictEqual(r.hit, false, '腿①名词族抹除后仍命中（配对逻辑失效）');
});

check('负例注入②：抹掉 ANON_MARK_EN 后英文攻击不命中', () => {
  const r = detectAnonymousSource('Sources familiar with the matter say the deal is already signed.', {
    ANON_MARK_EN: [],
  });
  assert.strictEqual(r.hit, false, '腿①英文标记族抹除后仍命中（配对逻辑失效）');
});

check('负例注入③：抹掉 VERB_ZH 后中文攻击不命中', () => {
  const r = detectAnonymousSource('据知情人士透露，这项政策将在下个月正式落地。', {
    VERB_ZH: /(?!x)x/,
  });
  assert.strictEqual(r.hit, false, '腿②中文动词抹除后仍命中（配对逻辑失效）');
});

check('负例注入④：抹掉 VERB_EN 后英文攻击不命中', () => {
  const r = detectAnonymousSource('Insiders say the merger talks have collapsed.', {
    VERB_EN: /(?!x)x/,
  });
  assert.strictEqual(r.hit, false, '腿②英文动词抹除后仍命中（配对逻辑失效）');
});

check('负例注入⑤：抹掉 EXEMPT_META_ZH 后元话语句变红（证明豁免承重）', () => {
  const t = '编辑部分析了据知情人士透露这类报道的风险。';
  assert.strictEqual(detectAnonymousSource(t).hit, false, '豁免未生效（基线应放行）');
  const r = detectAnonymousSource(t, { EXEMPT_META_ZH: [] });
  assert.strictEqual(r.hit, true, '豁免抹除后元话语句仍未命中（豁免常量空转）');
});

check('负例注入⑥：抹掉 EXEMPT_CORRECT_EN 后纠正句变红（证明豁免承重）', () => {
  const t = 'Sources familiar with the matter say the deal is signed, but the paper could not be independently verified.';
  assert.strictEqual(detectAnonymousSource(t).hit, false, '豁免未生效（基线应放行）');
  const r = detectAnonymousSource(t, { EXEMPT_CORRECT_EN: [] });
  assert.strictEqual(r.hit, true, '豁免抹除后纠正句仍未命中（豁免常量空转）');
});

check('模块导出完整（detectAnonymousSource + __internals 关键常量）', () => {
  assert.strictEqual(typeof detectAnonymousSource, 'function');
  const I = __internals();
  for (const k of ['ANON_NOUN_ZH', 'ANON_QUAL_ZH', 'ANON_MARK_EN', 'VERB_ZH', 'VERB_EN',
    'EXEMPT_META_ZH', 'EXEMPT_META_EN', 'EXEMPT_CORRECT_ZH', 'EXEMPT_CORRECT_EN']) {
    assert.ok(I[k] != null, `__internals 缺 ${k}`);
  }
});

check('短文本/空输入不崩溃', () => {
  assert.strictEqual(detectAnonymousSource('').hit, false);
  assert.strictEqual(detectAnonymousSource(null).hit, false);
  assert.strictEqual(detectAnonymousSource('据知情人士').hit, false);
  assert.strictEqual(detectAnonymousSource(undefined).hit, false);
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
