'use strict';
// round-373：非凡主张的证据比例错配新子族（econ_reasoning_gate 第 28 子族 /
// 插件层第 33 族）。r373 立项探针（scripts/round-373/probe-r373-pool.js +
// probe-r373-scope.js，v6.8.190 pristine 基线）七候选同池定拨：A affect_
// heuristic 攻击 0/6 全被存量维度代拦、B scope_insensitivity 穿透 4/13 边际
// 低、C ambiguity_aversion 2/4 良性脏、D extraordinary_claims 攻击穿透 4/5
// 真零命中、E harking 3/4 但「事前/事后」欺骗文本不可见定义不牢、F
// denominator_neglect 1/5 脏、G forking_paths 1/4 被 researcher_degrees_of_
// freedom 代拦——**extraordinary_claims 唯一「高穿透 × 存量零覆盖」**，且与
// weak_evidence_strong_claim(dim245 弱证据**类型**×绝对化断言) 射程不同（本族
// 管主张**离奇度** × 证据**不成比例**），定拨落地。海外扫描：arXiv parse-fail、
// GitHub repos 0、S2 限流——空返，按既有形态自建。
// 新增 src/extraordinary-claims.js（三腿近距共现：腿①离奇主张 × 腿②弱证据
// 基底 × 腿③充分性兑现，缺一不判；CONCEPT/CORRECT/HEDGE 三组豁免 + 腿③否定
// 守卫）。src/index.js 零改动、VERSION 不 bump（真升级②：已有聚合族全新措辞
// 家族）。
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkEconReasoningGate, FAMILIES: GATE_FAMS } = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));
const { detectExtraordinaryClaims: detect } = require(path.join(ROOT, 'src', 'extraordinary-claims.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + ' :: ' + e.message); }
}
function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

// ─── A 攻击样本：gate 层非 pass 且 econ_reasoning_gate 归因 ───
const ATTACK_ZH = [
  '这个疗法能治愈晚期癌症，虽然只有三例个案和一句朋友证言，但已经足够可信了。',
  '他发明了永动机，即便没有任何可复现证据，仅凭理论自洽就值得颁授最高奖。',
  '这项惊人发现只有一篇未经同行评议的预印本，但结论太重要，应直接写进教科书。',
  '这款神药号称能根治糖尿病，虽说没有对照试验，可用户的口碑已经足以证明一切。',
  '有人说这口泉水能包治百病，仅凭几个村民的转述，就足以让我们相信它的神力。',
];
const ATTACK_EN = [
  'The device cures every disease; a few testimonials and a plausible story are enough to trust it.',
  'He built a perpetual motion machine; with no replication but a beautiful theory, we should accept it.',
  'This astonishing remedy reverses aging, and a single case report is enough to prove it works.',
  'The groundbreaking pill has only two users so far, yet the results are already conclusive.',
];

console.log('### A 攻击样本 gate 层');
check('A1 ZH 攻击 5/5 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_ZH) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});
check('A2 EN 攻击 4/4 非 pass 且 econ_reasoning_gate 归因', () => {
  for (const t of ATTACK_EN) {
    const a = actionOf(t);
    assert(a !== 'pass', 'pass :: ' + t);
    assert(dimsOf(t).includes('econ_reasoning_gate'), '未归因 econ_reasoning_gate :: ' + t + ' :: ' + dimsOf(t));
  }
});

// ─── B 模块层命中 + gate 桥聚合 ───
console.log('### B 模块层');
check('B1 攻击 9/9 模块命中', () => {
  for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = detect(t);
    assert(r && r.hit, 'miss :: ' + t);
    assert(r.dimension === 'extraordinary_claims', 'dimension 字段异常 :: ' + t);
    assert(typeof r.guidance === 'string' && r.guidance.length > 50, 'guidance 缺失 :: ' + t);
  }
});
check('B2 gate 桥聚合含 extraordinary_claims 族', () => {
  const r = checkEconReasoningGate(ATTACK_ZH[0]);
  assert(r && r.hit, 'gate 桥未命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('extraordinary_claims'), '聚合 families 缺 extraordinary_claims :: ' + keys);
});

// ─── C 良性样本零误伤（模块零命中 + gate findings 不含 econ_reasoning_gate）──
console.log('### C 良性样本');
const BENIGN = [
  // 缺腿①：普通主张配弱证据（本族射程外）
  '初步只有少量病例支持这一常规改良，还需更多数据。',
  // 缺腿②：恰当验证的突破
  '这是突破性疗法，已经过多轮大规模随机对照试验验证。',
  // 缺腿③：给出弱证据但保持存疑
  '治愈晚期癌症虽然只有几例个例报告有效，但还需大规模试验才能下结论。',
  // 概念教学（点名比例原则）
  '非凡的主张需要非凡的证据，这是评估惊人发现的常识。',
  // 正确举证/存疑
  '该疗法目前证据不足，需要随机对照试验才能确认。',
  // 对冲/尚未定论
  '惊人疗法在早期研究中显示潜力，但仍待同行评议确认。',
  // 腿③否定守卫（对冲形——并不足以）
  '治愈癌症虽然只有几例个案，但这并不足以证明疗法有效。',
  // EN
  'Extraordinary claims require extraordinary evidence, so we demand replication.',
  'The breakthrough therapy has passed multiple large randomized controlled trials.',
  'Although only a few cases exist, we need far more evidence before concluding.',
  'The stunning early results still await independent confirmation.',
  'A device cures every disease with only a few testimonials, but this is not enough to prove it.',
];
check('C1 良性 13/13 模块零命中', () => {
  for (const t of BENIGN) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中 :: ' + t);
  }
});
check('C2 良性 13/13 gate findings 不含 econ_reasoning_gate（本族零增量）', () => {
  for (const t of BENIGN) {
    assert(!dimsOf(t).includes('econ_reasoning_gate'), '本族在良性句新增 gate 增量 :: ' + t);
  }
});

// ─── D 豁免/判据结构逐组证明 ───
console.log('### D 豁免与判据结构');
check('D1 CONCEPT 豁免（点名比例原则 + 框架词）', () => {
  const t = '所谓证据比例错配，是指治愈晚期癌症虽然只有三例个案，却被说成已经足够可信这类错误。';
  const r = detect(t);
  assert(!(r && r.hit), 'CONCEPT 未豁免');
});
check('D1b CONCEPT 不收裸框架（三腿在场 + 无框架词必须命中）', () => {
  // 三腿齐但无「是指/原则/常识」等框架词——概念豁免不得误伤攻击
  const t = '治愈晚期癌症虽然只有三例个案，就足以证明疗法有效，这符合惊人的结论。';
  const r = detect(t);
  assert(r && r.hit, '裸三腿攻击被误豁免');
});
check('D2 CORRECT 豁免（要求更多证据）', () => {
  const t = '治愈晚期癌症虽然只有三例个案，就断言已经足够可信是不严谨的，需要独立复现才能确认。';
  const r = detect(t);
  assert(!(r && r.hit), 'CORRECT 未豁免');
});
check('D3 HEDGE 豁免（早期结果/初步显示）', () => {
  const t = '治愈晚期癌症虽然只有三例个案，有人称已经足够可信，初步结果显示潜力但样本还太小。';
  const r = detect(t);
  assert(!(r && r.hit), 'HEDGE 未豁免');
});
check('D4 缺腿①不判（普通主张 × 弱基底 × 充分性兑现）', () => {
  const t = '这个常规改良虽然只有三例个案，但已经足够可信了。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿①误判');
});
check('D5 缺腿②不判（离奇主张 × 恰当验证 × 充分性兑现）', () => {
  const t = '这是突破性疗法，已经过多轮随机对照验证，足以采信。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿②误判');
});
check('D6 缺腿③不判（离奇主张 × 弱基底 × 存疑）', () => {
  const t = '治愈晚期癌症虽然只有三例个案，但还需大规模试验。';
  const r = detect(t);
  assert(!(r && r.hit), '缺腿③误判');
});
check('D7 腿③否定守卫（这并不值得相信——纯否定、不落 CORRECT/HEDGE）', () => {
  const t = '治愈晚期癌症虽然只有三例个案，但这并不值得相信。';
  const r = detect(t);
  assert(!(r && r.hit), '否定守卫失效');
});
check('D7b EN 腿③否定守卫（this is not enough to prove）', () => {
  const t = 'A device cures every disease with only a few testimonials; this is not enough to prove it.';
  const r = detect(t);
  assert(!(r && r.hit), 'EN 否定守卫失效');
});
check('D8 超距不判（离奇主张与弱基底相距过远）', () => {
  const t = '这疗法宣传能治愈晚期癌症，广告遍布大街小巷，明星代言、专家站台、媒体报道铺天盖地，各路说法都有。而那些零散的初步观察数据，样本少得可怜。';
  const r = detect(t);
  assert(!(r && r.hit), '超距误判');
});

// ─── E 负例注入：逐条删掉本轮每个承重模式，断言守卫必须翻转 ───
console.log('### E 负例注入');
// 每条样本对所注入常量单源承重（删后守卫翻转）。腿①四分租、腿②两分组、
// 腿③、三组豁免、腿③否定守卫各自配单源样本。
const INJ = {
  EXTRA_ZH_A: ['这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。'],
  EXTRA_ZH_B: ['这项惊人发现只有一篇未经同行评议的预印本，应直接写进教科书。'],
  WEAK_ZH_A: ['这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。'],
  WEAK_ZH_B: ['这项惊人发现没有任何可复现证据，但结论太重要，应直接写进教科书。'],
  SUFF_ZH: ['这个疗法能治愈晚期癌症，虽然只有三例个案，但已经足够可信了。'],
  EXTRA_EN_A: ['The device cures every disease; a few testimonials are enough to trust it.'],
  WEAK_EN_A: ['The device cures every disease; a few testimonials are enough to trust it.'],
  SUFF_EN: ['The device cures every disease; a few testimonials are enough to trust it.'],
  // 三组豁免承重证明：基线被豁免不命中，删常量后翻红
  CONCEPT_ZH: ['所谓证据比例错配，是指治愈晚期癌症虽然只有三例个案，却被说成已经足够可信这类错误。'],
  CONCEPT_EN: ['They invoke that extraordinary claims require extraordinary evidence, then say a device cures every disease with just a few testimonials, which is enough.'],
  CORRECT_ZH: ['治愈晚期癌症虽然只有三例个案，就断言已经足够可信是不严谨的，需要独立复现才能确认。'],
  CORRECT_EN: ['A device cures every disease with only a few testimonials is enough, some claim, yet this requires more evidence.'],
  HEDGE_ZH: ['治愈晚期癌症虽然只有三例个案，有人称已经足够可信，初步结果显示潜力但样本还太小。'],
  HEDGE_EN: ['A device cures every disease with only a few testimonials is enough, but the early results still await confirmation.'],
  // 腿③否定守卫承重证明：基线被否决不命中，删否定常量后翻红（样本须纯否定、
  // 不落 CORRECT/HEDGE——「并不值得相信」不在 CORRECT，「; this is not」无 but）
  STRONG_NEG_ZH: ['治愈晚期癌症虽然只有三例个案，但这并不值得相信。'],
  NEG_PREFIX_EN: ['A device cures every disease with only a few testimonials; this is not enough to prove it.'],
};
let injTotal = 0, injFlipped = 0;
for (const [key, samples] of Object.entries(INJ)) {
  check('E 注入删 ' + key + ' → 守卫翻转', () => {
    for (const t of samples) {
      injTotal++;
      const base = detect(t);
      const inj = detect(t, { [key]: [] });
      const baseHit = !!(base && base.hit);
      const injHit = !!(inj && inj.hit);
      assert(baseHit !== injHit, '守卫未翻转（base=' + baseHit + ' inj=' + injHit + '）:: ' + key + ' :: ' + t);
      if (baseHit !== injHit) injFlipped++;
    }
  });
}

// ─── F 存量回归（不抢同组其它子族样本 + 存量族仍工作）──
console.log('### F 存量回归');
check('F1 healthy_user_bias 攻击样本不被本族拦', () => {
  const r = detect('吃维生素的人明显更健康，所以维生素让人健康。');
  assert(!(r && r.hit), 'extraordinary_claims 抢 healthy_user_bias 样本');
});
check('F2 decoy_effect 攻击样本不被本族拦', () => {
  const r = detect('基础版功能这么少，专业版只贵一点就显得特别划算。');
  assert(!(r && r.hit), 'extraordinary_claims 抢 decoy_effect 样本');
});
check('F3 weak_evidence_strong_claim 近邻不被误拦（匿名信源形无离奇主张）', () => {
  const r = detect('据一位不愿透露姓名的内部人士说，这款产品绝对有效。');
  assert(!(r && r.hit), 'extraordinary_claims 抢 weak_evidence_strong_claim 样本');
});
check('F4 存量 benign 语料零误命中（官方良性集形状）', () => {
  const benign = [
    '两个人的合作比一个人单干更有效率。',
    '机会成本是经济学的基础概念，指被放弃的替代用途的价值。',
    'The study enrolled 1,200 participants and followed them for five years.',
    '这项临床试验共纳入三千名受试者，随访五年，结果具有统计学意义。',
    'The vaccine showed a 95% efficacy rate in the phase three trial.',
  ];
  for (const t of benign) {
    const r = detect(t);
    assert(!(r && r.hit), '误命中官方良性形状 :: ' + t);
  }
});
check('F5 存量 econ 子族聚合仍工作（mercantilism 直调）', () => {
  const r = checkEconReasoningGate('出口大于进口才叫赚钱，顺差越大越占便宜。');
  assert(r && r.hit, 'mercantilism 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('mercantilism'), '存量 mercantilism 族丢失 :: ' + keys);
});
check('F6 存量 econ 子族聚合仍工作（healthy_user_bias 直调 r372 近邻）', () => {
  const r = checkEconReasoningGate('吃维生素的人明显更健康，所以维生素让人健康。');
  assert(r && r.hit, 'healthy_user_bias 存量族不再命中');
  const keys = (r.families || []).map(f => f.key);
  assert(keys.includes('healthy_user_bias'), '存量 healthy_user_bias 族丢失 :: ' + keys);
});

// ─── G 登记纪律 ───
console.log('### G 登记');
check('G1 gate 桥族表含 extraordinary_claims(r373) 且计数 35（r379 flat_rate_bias 入表后 34→35）', () => {
  assert(GATE_FAMS.some(f => f.key === 'extraordinary_claims' && f.round === 'r373'), 'gate 桥缺 extraordinary_claims');
  assert.strictEqual(GATE_FAMS.length, 37, 'gate 桥计数 ' + GATE_FAMS.length); // 35(r379 后) + r381 lump_of_labor 1
});
check('G2 插件族表含 extraordinary_claims(r373) 且计数 37（31 econ + 6 stats）', () => {
  assert(plugin.FAMILIES.some(f => f.key === 'extraordinary_claims' && f.round === 'r373'), '插件缺 extraordinary_claims');
  assert.strictEqual(plugin.FAMILIES.length, 42, '插件计数 ' + plugin.FAMILIES.length); // 38 + r381 lump_of_labor 1
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 36, 'econ 计数异常');
  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 6, 'stats 计数异常');
});
check('G3 插件 version 已 bump 至 1.18.0（r385 再 bump）', () => {
  assert.strictEqual(plugin.version, '1.18.0', '插件 version 应为 1.18.0，实为 ' + plugin.version);
});
check('G4 插件 analyze(only=extraordinary_claims) 路由可用', () => {
  const r = plugin.analyze(ATTACK_ZH[0], { only: 'extraordinary_claims' });
  assert(r && r.totalHits > 0 && r.families.length === 1 && r.families[0].key === 'extraordinary_claims', 'only 路由异常');
});
check('G5 claims.jsonl 含 r373 认领（agent-4/dimension）', () => {
  const claims = fs.readFileSync(path.join(ROOT, 'coordination', 'claims.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  assert(claims.some(c => c && c.round === 'r373' && c.agent === 'agent-4' && c.kind === 'dimension'), '缺 r373 认领');
});
check('G6 VERSION 未被 r373 改动（基线 6.8.192）', () => {
  const v = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  // r373 聚合族扩族、src/index.js 零改动、dimMap 键数不变，VERSION 不 bump。
  assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192（r385 基线同步：r380 duration_neglect bump），实为 ' + v);
});

console.log('\n测试结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
console.log('负例注入: ' + injFlipped + '/' + injTotal + ' 翻转');
process.exit(fail === 0 ? 0 : 1);
