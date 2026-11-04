/**
 * test/round-211-hypostatization.js — 第 208 维度 hypostatization
 * （实体化/拟人化谬误：把抽象实体当作有意志能行动的主体并以其行动承重
 * 结论）测试。
 *
 * 结构（同 r209/r210 先例）：
 *   ① 模块级攻击命中（中英双语、裸名词、带修饰、倒装、长句变体）
 *   ② 模块级良性放行（概念转述/明示修辞/主体性否认/谚语/孤立套话/趋势句）
 *   ③ 负例注入：逐常量替换为空数组，验证承重（同族攻击必须翻面）
 *   ④ gate 级矩阵：攻击非 pass 且 findings 承重 + 良性全 pass
 */
'use strict';
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { checkHypostatization, __internals } = require(path.join(ROOT, 'src/hypostatization.js'));
const { gate } = require(path.join(ROOT, 'src/gate.js'));

// ─── ① 攻击变体矩阵（模块级，同族 ≥5：中英双语/裸名词/带修饰/倒装/长句）──
const ATTACKS = [
  // 裸名词 + 紧邻主体行动词 + 结论承重
  '历史会惩罚那些忘记过去的人，所以我们必须按老规矩来。',
  '市场不会允许这种价格长期存在，因此泡沫一定会破。',
  '资本知道什么时候该撤退，所以它早就放弃了这块业务。',
  // 带修饰（终究会/绝不会）+ 后果分句形 INF
  '时代终究不会等待犹豫不决的人，现在不转型就会被淘汰。',
  // 倒装/长句（抽象实体后置出现）
  '面对这场危机，社会选择了沉默，这说明默认的态度就是同意。',
  // 英文
  'The market will punish anyone who doubts this strategy.',
  'History will judge those who stood in the way of progress.',
  'Society will not tolerate this behavior, so we must conform.',
  // R2 判定型分支（裸断言）
  '大自然终将审判人类的贪婪行径。',
  '数据知道用户真正想要什么，因此必须按它的推荐来。',
];

// ─── ② 良性样本（含边缘良性）────────────────────────────────────────
const BENIGN = [
  // 概念/教学转述
  '这是典型的实体化谬误：把抽象概念当成能行动的实体。',
  '哲学课讲过，实体化是把抽象概念当作具体事物的错误。',
  // 明示修辞标记
  '市场参与者整体表现出恐慌情绪，这是拟人化的说法。',
  // 主体性否认（本族要保护的行为）
  '历史是由具体的人的行动构成的，它没有意志。',
  // 谚语格言
  '古人云，善有善报，恶有恶报。',
  // 孤立套话（无 INF 承重）
  '正义会迟到但不会缺席。',
  // 趋势句/功能句（无主体行动词）
  '市场在上升，投资者情绪乐观。',
  '系统会自动降级并记录日志，不涉及人工干预。',
  // 经济分析缩略（止步于描述，无 INF）
  '市场选择了降价，这是供需变化的结果。',
  // 英文良性
  'These numbers reflect the market, which is made of real participants.',
  'The system responds to input within 50 milliseconds.',
];

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ok - ${name}`); }
  catch (e) { failed++; console.log(`  FAIL - ${name}: ${e.message}`); }
}

console.log('== ① 攻击变体矩阵（模块级）==');
ATTACKS.forEach((t, i) => {
  check(`attack[${i}] hit`, () => {
    const r = checkHypostatization(t);
    assert.ok(r.hit, `未命中: ${t}`);
    assert.ok(r.detail.length > 0, 'detail 为空');
  });
});

console.log('== ② 良性样本（模块级）==');
BENIGN.forEach((t, i) => {
  check(`benign[${i}] pass`, () => {
    const r = checkHypostatization(t);
    assert.ok(!r.hit, `误命中: ${t} (${r.detail})`);
  });
});

console.log('== ③ 负例注入（逐常量承重）==');
const I = __internals();
// 每个常量给出「注入空数组后必须翻面的攻击样本」
const INJECTION_CASES = [
  ['ABS_ZH', '历史会惩罚那些忘记过去的人，所以我们必须按老规矩来。'],
  ['ABS_ZH', '时代终究不会等待犹豫不决的人，现在不转型就会被淘汰。'],
  ['AGENCY_ZH', '资本知道什么时候该撤退，所以它早就放弃了这块业务。'],
  ['INF_ZH', '市场不会允许这种价格长期存在，因此泡沫一定会破。'],
  ['STRONG_ZH', '大自然终将审判人类的贪婪行径。'],
  // 豁免腿注入：样本须**同时含判据腿与豁免标记**——抽掉豁免必须转为命中
  ['EXEMPT_META_ZH', '逻辑课上分析过一个句子：市场不会允许这种价格长期存在，因此泡沫一定会破——这是实体化的典型案例。'],
  ['EXEMPT_FIG_ZH', '某种意义上，市场知道投资者想要什么，所以它总会提前反应。'],
  ['EXEMPT_DENIAL_ZH', '资本并没有意志，它不会选择，所以不要把资本想象成有主意的猎手。'],
  ['EXEMPT_PROVERB_ZH', '俗话说，市场总会惩罚投机者，所以不要心存侥幸。'],
  // EN：判据腿样本避开 R2 强动词（否则双腿重叠无法验证单腿承重）
  ['ABS_EN', 'The market knows what investors want, so it always reacts first.'],
  ['AGENCY_EN', 'The market knows what investors want, so it always reacts first.'],
  ['INF_EN', 'The market knows what investors want, so it always reacts first.'],
  // R2 专属样本（无 INF，只走 STRONG 分支）
  ['STRONG_EN', 'History will judge those who stood in the way of progress.'],
  ['EXEMPT_DENIAL_EN', "The market doesn't actually choose winners, so don't personify it."],
];
INJECTION_CASES.forEach(([key, sample]) => {
  check(`inject ${key}`, () => {
    const base = checkHypostatization(sample);
    assert.ok(I[key] && I[key].length > 0, `常量 ${key} 未导出`);
    const flipped = checkHypostatization(sample, { [key]: [] });
    if (key.startsWith('EXEMPT_')) {
      // 豁免腿抽掉 → 攻击形必须转为命中（证明豁免承重）
      assert.ok(!base.hit, `豁免在场时仍命中: ${sample}`);
      assert.ok(flipped.hit, `抽掉豁免 ${key} 后未命中: ${sample}`);
    } else {
      // 判据腿抽掉 → 必须转为不命中（证明判据腿承重）
      assert.ok(base.hit, `注入前未命中: ${sample}`);
      assert.ok(!flipped.hit, `抽掉判据腿 ${key} 后仍命中: ${sample}`);
    }
  });
});
// 每个判据常量至少被一条注入用例覆盖（防新增常量无测试）
['ABS_ZH','ABS_EN','AGENCY_ZH','AGENCY_EN','STRONG_ZH','STRONG_EN','INF_ZH','INF_EN'].forEach(key => {
  check(`coverage ${key}`, () => {
    assert.ok(INJECTION_CASES.some(([k]) => k === key), `常量 ${key} 无负例注入覆盖`);
  });
});

console.log('== ④ gate 级矩阵 ==');
const GATE_ATTACKS = [
  '历史会惩罚那些忘记过去的人，所以我们必须按老规矩来。',
  '市场不会允许这种价格长期存在，因此泡沫一定会破。',
  '资本知道什么时候该撤退，所以它早就放弃了这块业务。',
  '时代终究不会等待犹豫不决的人，现在不转型就会被淘汰。',
  '数据知道用户真正想要什么，因此必须按它的推荐来。',
  'The market will punish anyone who doubts this strategy.',
  'History will judge those who stood in the way of progress.',
];
GATE_ATTACKS.forEach((t, i) => {
  check(`gate attack[${i}]`, () => {
    const r = gate(t);
    assert.notStrictEqual(r.gate.action, 'pass', `gate 放行攻击样本: ${t}`);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(dims.includes('hypostatization'), `hypostatization 未承重: ${dims.join(',')}`);
  });
});
const GATE_BENIGN = [
  '这是典型的实体化谬误：把抽象概念当成能行动的实体。',
  '历史是由具体的人的行动构成的，它没有意志。',
  '正义会迟到但不会缺席。',
  '市场在上升，投资者情绪乐观。',
  'These numbers reflect the market, which is made of real participants.',
  '市场选择了降价，这是供需变化的结果。',
];
GATE_BENIGN.forEach((t, i) => {
  check(`gate benign[${i}]`, () => {
    const r = gate(t);
    assert.strictEqual(r.gate.action, 'pass', `良性样本被拦: ${t} -> ${r.gate.action} (${(r.findings||[]).map(f=>f.dimension).join(',')})`);
  });
});

console.log(`\nround-211-hypostatization: ${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
