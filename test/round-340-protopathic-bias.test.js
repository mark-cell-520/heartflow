// round-340: protopathic bias 用药先于确诊倒置框（reverse_causation 主判据 D）
//
// 背景：r340 立项探针五候选定拨（coordination/agent4/probes/r340-probe-candidates.js），
// B 候选「protopathic bias」以 5/6 穿透 + 4/4 良性零误伤胜出（A per-protocol 4/8、
// C length-time 1/6 被 immortal_time_bias 覆盖、D 截断轴 4/6、E recall bias 4/6
// 且良性 3/4 有存量 cum_hoc 误伤，均放弃）。穿透根因：疾病早期症状促使就医用药，
// 用药先于确诊，攻击句把该时间差当成「用药导致该病」的证据——时序标记
// （确诊前/before diagnosis）与疾病名词（发病/disease）均不在存量任何腿。
//
// 本测试锁定：
//   1) 判据 D 攻击命中（ZH 6 + EN 5，含探针穿透句与逐组独担句）；
//   2) 良性零误伤（对冲/否定/概念/证据语境 9 条）；
//   3) gate 层可达性（action=verify + reverse_causation 归因）；
//   4) 负例注入：8 个新词表逐腿删条 + 全空 + 2 个豁免承重，全部翻转；
//   5) 存量回归：r174/r266/r299/r316 攻击句仍命中。
'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const mod = require(path.join(ROOT, 'src/reverse-causation.js'));
const hit = (t, inj) => mod.checkReverseCausation(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. ZH 攻击 6/6 ────────────────────────────────────────────────
const ZH_ATTACK = [
  // 探针穿透句（基线 pass → 本轮必须命中）
  '得病的人病发前普遍服用过这个药，足以证明服药是发病的原因。',
  '这些患者在确诊前一年内大量使用该药物，因此该药物是致病因素。',
  // 逐组独担句（时序标记/药物名词/归因断言/疾病名词各换形）
  '长期吃止痛片的人后来都得了胃病，发病前就在吃，说明止痛片是发病的诱因。',
  '确诊前长期服用该药物，后来普遍患病，这是患病的元凶。',
  '起病前他一直在服用这种草药，因此这种草药是致病的根源。',
  '这些患者确诊之前都在挂水，所以挂水用的药物是病情的元凶。',
];
t('ZH protopathic 攻击 6/6', () => {
  const miss = ZH_ATTACK.filter((s) => !hit(s));
  assert.strictEqual(miss.length, 0, '以下 ZH 攻击句漏判:\n' + miss.join('\n'));
});

// ─── 2. EN 攻击 5/5 ────────────────────────────────────────────────
const EN_ATTACK = [
  // 探针穿透句
  'Patients who developed the disease had all been taking this drug in the year before diagnosis, so the drug causes it.',
  'Most of those diagnosed had used the medication beforehand, which shows the medication led to the disease.',
  'The drug use preceded the diagnosis, so it must be the cause.',
  // 语序/标记变体（before the disease was diagnosed / is the cause 前置形）
  'She had been taking the medication before the disease was diagnosed, so the medication caused her illness.',
  'Those patients had taken the medication before diagnosis, and now the medication is the cause of their disease.',
];
t('EN protopathic 攻击 5/5', () => {
  const miss = EN_ATTACK.filter((s) => !hit(s));
  assert.strictEqual(miss.length, 0, '以下 EN 攻击句漏判:\n' + miss.join('\n'));
});

// ─── 3. 良性零误伤 9/9 ─────────────────────────────────────────────
const BENIGN = [
  // 对冲（早期症状促使用药的正确方向陈述）
  '确诊前用药可能是疾病早期症状促使就医开药，需要厘清因果方向再下结论。',
  // 推理否定 + 概念转述
  '用药早于诊断不等于用药致病，可能是原发症状导致用药，属反向因果。',
  '确诊前服药不能说明服药导致发病，早期症状才是用药的原因。',
  // 无归因断言（相关≠归因）
  '确诊前服用阿司匹林很常见，这是患者对早期症状的自我药疗，与后续确诊的疾病无关。',
  // 证据语境（前瞻研究）
  '服药时间早于确诊时间并不构成因果证据，需要前瞻性队列研究验证。',
  // EN：无归因断言 / 概念讨论（protopathic 元豁免）
  'Drug use before diagnosis may reflect early symptoms of the disease, not causation.',
  'Preceding drug use could be protopathic bias — the illness itself prompted the prescription.',
  'Protopathic bias means the disease itself prompted the prescription before diagnosis, so the drug appears to cause the disease.',
  'Before diagnosis many patients take antacids for early symptoms; this is a well-known protopathic pattern.',
];
t('良性零误伤 9/9', () => {
  const fp = BENIGN.filter((s) => hit(s));
  assert.strictEqual(fp.length, 0, '以下良性句被误判:\n' + fp.join('\n'));
});

// ─── 4. gate 层可达性 ──────────────────────────────────────────────
t('gate 层可达性（verify + reverse_causation 归因）', () => {
  const main = require(path.join(ROOT, 'src/gate.js'));
  for (const s of [ZH_ATTACK[0], ZH_ATTACK[3], EN_ATTACK[0], EN_ATTACK[2]]) {
    const r = main.gate(s);
    assert.ok(r && r.gate, 'gate() 未返回结果: ' + s);
    assert.strictEqual(r.gate.action, 'verify', 'action 非 verify: ' + s + ' → ' + r.gate.action);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert.ok(dims.includes('reverse_causation'), 'findings 缺 reverse_causation: ' + s + ' → ' + JSON.stringify(dims));
  }
});

// ─── 5. 负例注入：逐腿删条，守卫必须变红 ──────────────────────────
// 每条注入配对「只经该腿命中」的攻击样本（探针穿透句 + 逐组独担句），
// 删词表后必须由 hit 翻转为 miss（断言失败而非加载崩溃）。
const NEG = [
  { name: 'PRE_USE_ZH 时序标记(zh)', key: 'PRE_USE_ZH', samples: [ZH_ATTACK[0], ZH_ATTACK[4]] },
  { name: 'PRE_USE_EN 时序标记(en)', key: 'PRE_USE_EN', samples: [EN_ATTACK[1], EN_ATTACK[2]] },
  { name: 'MED_ZH 药物名词(zh)', key: 'MED_ZH', samples: [ZH_ATTACK[2]] },
  { name: 'MED_EN 药物名词(en)', key: 'MED_EN', samples: [EN_ATTACK[4]] },
  { name: 'ATTRIB_ZH 归因断言(zh)', key: 'ATTRIB_ZH', samples: [ZH_ATTACK[3]] },
  { name: 'ATTRIB_EN 归因断言(en)', key: 'ATTRIB_EN', samples: [EN_ATTACK[2]] },
  { name: 'PROT_DISEASE_ZH 疾病名词(zh)', key: 'PROT_DISEASE_ZH', samples: [ZH_ATTACK[5]] },
  { name: 'PROT_DISEASE_EN 疾病名词(en)', key: 'PROT_DISEASE_EN', samples: [EN_ATTACK[3]] },
];
for (const n of NEG) {
  t('负例注入-' + n.name, () => {
    const inj = {}; inj[n.key] = [];
    const still = n.samples.filter((s) => hit(s, inj));
    assert.strictEqual(still.length, 0, '删 ' + n.key + ' 后仍命中（该腿非承重或其他判据代拦）:\n' + still.join('\n'));
  });
}

// 全空注入：判据 D 八表全清，全部攻击样本必须 miss
// （证明无 A/B/C 判据代拦——这些样本在基线即穿透，只可能由 D 收）
t('负例注入-判据 D 八表全空', () => {
  const inj = {};
  for (const k of ['PRE_USE_ZH', 'PRE_USE_EN', 'MED_ZH', 'MED_EN', 'ATTRIB_ZH', 'ATTRIB_EN', 'PROT_DISEASE_ZH', 'PROT_DISEASE_EN']) inj[k] = [];
  const all = [...ZH_ATTACK, ...EN_ATTACK];
  const still = all.filter((s) => hit(s, inj));
  assert.strictEqual(still.length, 0, '八表全空后仍命中:\n' + still.join('\n'));
});

// 豁免承重证明：抹掉元豁免/否定豁免后，对应良性句必须变红
const NEVER = /(?!x)x/; // 永假正则
t('负例注入-EXEMPT_META_EN 概念豁免承重', () => {
  const s = 'Protopathic bias means the disease itself prompted the prescription before diagnosis, so the drug appears to cause the disease.';
  // 基线：元豁免保护，概念句不命中
  assert.ok(!hit(s), '含 protopathic 概念词的良性句未命中（元豁免误伤面过大）');
  // 抹掉元豁免后必须变红——证明该豁免是承重的
  assert.ok(hit(s, { EXEMPT_META_EN: [NEVER] }), '抹掉元豁免后概念句未变红（豁免非承重）');
});
t('负例注入-EXEMPT_NEG_ZH 否定豁免承重', () => {
  const s = '确诊前服药不能说明服药导致发病，早期症状才是用药的原因。';
  assert.ok(!hit(s), '否定良性句未命中（否定豁免失效）');
  assert.ok(hit(s, { EXEMPT_NEG_ZH: [NEVER] }), '抹掉否定豁免后良性句未变红（豁免非承重）');
});

// ─── 6. 存量回归：r174/r266/r299/r316 攻击句仍命中 ────────────────
const LEGACY = [
  '住院患者的死亡率明显更高，所以住院本身增加了死亡风险。',
  '戴头盔的骑手出车祸更多，这说明戴头盔会引发事故。',
  '报警越多的社区犯罪率越高，说明报警反而会招来犯罪。',
  '吃保健品的人群死亡率更高，所以吃保健品造成了死亡。',
  '报备人数多的楼栋阳性也更多，可见报备招来了阳性。',
  'Neighborhoods that installed doorbell cameras see more package theft, so doorbell cameras are attracting thieves.',
  'Warehouses with cameras installed report more thefts, which suggests the cameras are drawing thieves.',
  'Patients who were hospitalized had much higher mortality, so hospitalization itself increases the risk of death.',
];
t('存量回归 8/8 仍命中', () => {
  const miss = LEGACY.filter((s) => !hit(s));
  assert.strictEqual(miss.length, 0, '以下存量攻击句漏判（r340 改坏存量腿）:\n' + miss.join('\n'));
});

// ─── 7. 存量良性仍零误伤（r266/r299/r316 良性集抽样）────────────────
const LEGACY_BENIGN = [
  '住院治疗降低了死亡率，这是有随机对照试验支持的。',
  '阳性率是根据检测覆盖人口计算的，不是检测本身制造了阳性。',
  '隔离点越多恰恰说明疫情越重，这是按疫情密度调配的。',
  'Residents started panic buying after the storm warning, and the city opened emergency supply points.',
  'Cameras are required by the new ordinance for all ground-floor retail spaces.',
];
t('存量良性零误伤 5/5', () => {
  const fp = LEGACY_BENIGN.filter((s) => hit(s));
  assert.strictEqual(fp.length, 0, '以下存量良性句被误判:\n' + fp.join('\n'));
});

if (fails.length) {
  console.error('FAIL:\n - ' + fails.join('\n - '));
  process.exit(1);
}
console.log('✓ round-340-protopathic-bias 全部通过 (' + pass + ' 断言)');
console.log('round-340-protopathic-bias: ' + pass + ' 通过, 0 失败, 共 ' + pass + ' 个');
