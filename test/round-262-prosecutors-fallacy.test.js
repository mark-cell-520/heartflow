'use strict';
/**
 * test/round-262-prosecutors-fallacy.test.js
 * [r262] prosecutors_fallacy（第 222 维度）「定性稀有度 × 定罪结论」新措辞
 * 家族扩展（真升级②，live 生效，维度计数 229 不变，src/index.js 零改动）。
 *
 * 新增腿①（定性稀有，无显式微小概率数字）：
 *   一辈子难遇 / 千载难逢·百年难遇 / 凤毛麟角 / 微乎其微·少之又少·屈指可数 /
 *   吻合度·匹配度 这么高 / 亿万人里才有一个；
 *   EN once-in-a-lifetime / extraordinarily…rare / degree of match so high /
 *   vanishingly rare。
 * 新增腿②（定罪确定形 / 排除形 / 铁证形）：
 *   嫌疑几乎可以确定 / 几乎可以确定是他 / 除了他不可能有别人 / 舍他其谁 /
 *   可以当铁证 / 不可能是别人干的；
 *   EN it has to be him / no one else could / leaves no one else / ironclad
 *   evidence / almost certainly confirmed his guilt。
 * HEDGE_ZH 修复：「不可能」是确定性/排除标记而非对冲，对「可能」加
 *   (?<！不) 负回顾（r262 前「不可能」被 可能(?!...) 吞掉致排除形全漏）。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条承重
 * （marker 唯一性自检 + 旧分支不受影响对照）+ HEDGE 修复承重。
 */
const assert = require('assert');
const { detectProsecutorsFallacy, __internals } = require('../src/prosecutors-fallacy.js');
const { gate } = require('../src/gate.js');
const detect = (t) => detectProsecutorsFallacy(t);

// ─── 1. 新攻击矩阵（定性稀有 × 定罪结论，中英双语）────────────────
const NEW_ATTACKS = [
  '如此罕见的特征组合都出现了，嫌疑几乎可以确定。',
  '这种巧合一辈子遇一次都难，除了他不可能有别人。',
  '吻合度这么高，法庭上完全可以当铁证。',
  '匹配概率低到这种地步，不可能是别人干的。',
  '这种特征组合凤毛麟角，除了他不可能有第二个。',
  '亿万人里才有一个的吻合，舍他其谁。',
  '这种概率微乎其微，除了他不会是别人。',
  'This combination is once in a lifetime, so it has to be him.',
  'Such an extraordinarily rare match leaves no one else as a possibility.',
  'The degree of match is so high it amounts to ironclad evidence of his guilt.',
];
for (const t of NEW_ATTACKS) {
  const r = detect(t);
  assert.strictEqual(r.hit, true, '应命中新攻击句: ' + t);
  assert.strictEqual(r.dimension, 'prosecutors_fallacy');
  assert.ok(r.count >= 1 && r.evidence.length >= 1, 'count/evidence 非空: ' + t);
  assert.ok(r.severity >= 55 && r.severity <= 90, 'severity 区间: ' + t);
  assert.ok(typeof r.guidance === 'string' && r.guidance.includes('先验概率'), 'guidance: ' + t);
}
console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（定性稀有×定罪结论）');

// ─── 2. 新良性样本（有腿①但无定罪腿 / 正确证伪 / 医学统计）──────────
const NEW_BENIGN = [
  '这是一种罕见病，需要专家进一步会诊。',
  '他的吻合度很高，但还需结合其他证据综合判断，不能单独定罪。',
  '这种巧合虽然罕见，但在大样本里并不奇怪。',
  '罕见的现象往往有罕见的解释，先别急着下结论。',
  '这种错误一辈子遇一次都难，但这次真的发生了。',
  '他的成绩凤毛麟角，是全班唯一的满分。',
  'Rare diseases often go undiagnosed for years.',
  'The match is strong but not sufficient to convict on its own.',
  'Such a rare event warrants a careful re-examination of the assumptions.',
  'This coincidence is extraordinarily rare, yet perfectly innocent.',
];
for (const t of NEW_BENIGN) {
  assert.strictEqual(detect(t).hit, false, '不应命中新良性句: ' + t);
}
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤（有稀有腿无定罪腿不触发）');

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ─────────────
for (const t of [
  '如此罕见的特征组合都出现了，嫌疑几乎可以确定。',
  '这种巧合一辈子遇一次都难，除了他不可能有别人。',
  '这种特征组合凤毛麟角，除了他不可能有第二个。',
  'This combination is once in a lifetime, so it has to be him.',
  'The degree of match is so high it amounts to ironclad evidence of his guilt.',
]) {
  const r = gate(t);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + t);
  const f = (r.findings || []).find(x => x.dimension === 'prosecutors_fallacy');
  assert.ok(f, 'findings 应含 prosecutors_fallacy: ' + t);
  assert.ok(f.severity >= 55, 'gate finding severity: ' + t);
}
console.log('✓ gate 层接线 5/5 新攻击非 pass 且 findings 含本维');

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
for (const t of [
  '这是一种罕见病，需要专家进一步会诊。',
  '这种错误一辈子遇一次都难，但这次真的发生了。',
  'The match is strong but not sufficient to convict on its own.',
]) {
  const r = gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'prosecutors_fallacy');
  assert.ok(!f, '新良性不应触发本维: ' + t);
}
console.log('✓ gate 层新良性 3/3 无本维误伤');

// ─── 5. HEDGE_ZH 修复承重：「不可能」非对冲 ───────────────────────
// r262 前 HEDGE_ZH 的 可能(?!...) 子句把「不可**能**」误判为对冲，吞掉排除形
// 定罪腿；修复后（(?<！不) 负回顾）排除形正常命中。
for (const t of [
  '匹配的概率是百万分之一，除了他不可能有别人。',
  '匹配的概率是百万分之一，不可能是别人干的。',
]) {
  assert.strictEqual(detect(t).hit, true, '「不可能」应为确定性/排除标记而非对冲: ' + t);
}
// 对照：真正的结论腿对冲（他可能有罪）仍正常豁免
assert.strictEqual(detect('匹配概率是百万分之一，他可能有罪，但还需核实。').hit, false, '真对冲仍豁免');
console.log('✓ HEDGE_ZH 修复：「不可能」排除形命中，真对冲（可能有罪）仍豁免');

// ─── 6. 逐新模式注入-删条承重 + 旧分支不受影响 ────────────────────
// 每条新模式配一个**仅依赖该模式**的攻击句（另一条腿取既有模式），删该模式
// 后攻击须转 miss（承重），且旧攻击在删后仍命中（旧分支不受影响）。
const INJECTIONS = [
  // 腿① 中文（marker → 该模式 .source 唯一子串；攻击句刻意避开既有超宽腿①：
  //   亿?[里挑]?挑?一(裸一)、罕见/稀少/稀有、概率·几率·巧合+数词、吻合+概率）
  { arr: 'RARE_MATCH_ZH', marker: '一辈子', atk: '毕生难遇的情形，因此他几乎肯定有罪。' },
  { arr: 'RARE_MATCH_ZH', marker: '千载难逢', atk: '千载难逢的情形，因此他几乎肯定有罪。' },
  { arr: 'RARE_MATCH_ZH', marker: '凤毛麟角', atk: '凤毛麟角的情形，因此他几乎肯定有罪。' },
  { arr: 'RARE_MATCH_ZH', marker: '微乎其微', atk: '这种可能性微乎其微，因此他几乎肯定有罪。' },
  { arr: 'RARE_MATCH_ZH', marker: '这么样', atk: '指纹吻合度这么高，因此他几乎肯定有罪。' },
  // 腿① 英文（避开裸 match/coincidence/result/finding/outcome 兜底）
  { arr: 'RARE_MATCH_EN', marker: 'lifetime', atk: 'This combination is once in a lifetime, so he is almost certainly guilty.' },
  { arr: 'RARE_MATCH_EN', marker: 'extraordinarily', atk: 'This profile is extraordinarily rare, so he is almost certainly guilty.' },
  { arr: 'RARE_MATCH_EN', marker: 'extent', atk: 'The degree of match is so high that he is almost certainly guilty.' },
  { arr: 'RARE_MATCH_EN', marker: 'vanishingly', atk: 'The event is vanishingly rare, so he is almost certainly guilty.' },
  // 腿② 中文（腿①取既有「百万分之一」）
  { arr: 'GUILT_INFERENCE_ZH', marker: '定案', atk: '匹配的概率是百万分之一，嫌疑几乎可以确定。' },
  { arr: 'GUILT_INFERENCE_ZH', marker: '认定)(?:是他', atk: '匹配的概率是百万分之一，几乎可以确定是他。' },
  { arr: 'GUILT_INFERENCE_ZH', marker: '断不会', atk: '匹配的概率是百万分之一，除了他不可能有别人。' },
  { arr: 'GUILT_INFERENCE_ZH', marker: '舍他其谁', atk: '匹配的概率是百万分之一，舍他其谁。' },
  { arr: 'GUILT_INFERENCE_ZH', marker: '呈堂铁供', atk: '匹配的概率是百万分之一，法庭上可以当铁证。' },
  { arr: 'GUILT_INFERENCE_ZH', marker: '下手的', atk: '匹配的概率是百万分之一，不可能是别人干的。' },
  // 腿② 英文（腿①取既有 one-in-a-million / 裸 match）
  { arr: 'GUILT_INFERENCE_EN', marker: '(?:him|her)', atk: 'The DNA match has a one-in-a-million probability, so it has to be him.' },
  { arr: 'GUILT_INFERENCE_EN', marker: 'no\\s+one', atk: 'A one-in-a-billion match means no one else can have done it.' },
  { arr: 'GUILT_INFERENCE_EN', marker: 'leaves', atk: 'The match is one in a million and leaves no one else as a possibility.' },
  { arr: 'GUILT_INFERENCE_EN', marker: 'ironclad', atk: 'A one-in-a-billion DNA match is ironclad evidence of his guilt.' },
  { arr: 'GUILT_INFERENCE_EN', marker: 'culpability', atk: 'The one-in-a-million match almost certainly confirmed his guilt.' },
];
const OLD_CTRL = 'DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。';
let injected = 0;
for (const c of INJECTIONS) {
  const full = __internals()[c.arr];
  const uniq = full.filter(re => re.source.includes(c.marker));
  assert.strictEqual(uniq.length, 1, 'marker 须唯一命中一条模式 [' + c.marker + '] 实中 ' + uniq.length);
  // 正向：完整表下该攻击命中
  assert.strictEqual(detect(c.atk).hit, true, '正向命中: ' + c.marker);
  // 删条：注入去掉该模式的表 → 攻击转 miss（承重证明）
  const inj = {};
  inj[c.arr] = full.filter(re => !re.source.includes(c.marker));
  assert.strictEqual(detectProsecutorsFallacy(c.atk, inj).hit, false, '删 [' + c.marker + '] 后攻击须转 miss');
  // 旧分支不受影响：删后旧攻击（用既有模式）仍命中
  assert.strictEqual(detectProsecutorsFallacy(OLD_CTRL, inj).hit, true, '删 [' + c.marker + '] 后旧攻击仍命中（旧分支不受影响）');
  injected++;
}
console.log('✓ 逐新模式注入 ' + injected + ' 个：' + injected + ' 个变红，0 个未变红（marker 唯一性自检 + 旧分支不受影响对照）');

// 收尾：无全局状态变更（注入为逐次调用参数，不修改模块常量）
assert.strictEqual(detect(OLD_CTRL).hit, true, '收尾自检：旧攻击在无注入下仍命中');
console.log('\n全部断言通过（prosecutors_fallacy 第 222 维度 · r262 定性稀有度×定罪结论扩展）');
