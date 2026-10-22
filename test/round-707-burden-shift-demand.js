/**
 * test/round-707-burden-shift-demand.js
 *
 * [r707] appeal_to_ignorance（第 62 维度）补「举证倒置-需求形」句式族 TDD 测试。
 *
 * 背景：r707 decision 本体在四候选间选中（/tmp/decide-run-707.js 读
 * /tmp/decide-opts-707.json，composite_score 0.93 / confidence 0.92 /
 * identity alignment 100%；第一次调用拒选 options_indistinguishable，
 * 按期望收益确定性补判据后第二次收敛）。轮前探测器 /tmp/r707-preprobe.js
 * （中文）+ /tmp/r707-en-probe.js（英文）实测：中文 7/10 漏判、英文
 * 5/10 漏判，穿过闸门样本全部零维度命中；良性误伤 0/12。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族），不新增维度
 * 编号——src/appeal-to-ignorance.js 的 JSDoc 首行声明射程本就含「举证
 * 责任倒置」，缺口是原实现只覆盖推定形（I1 举证责任 × I2 推定成立），
 * 需求形（不推定成立，把「先拿出证据/反证」设为质疑前提，达不到就取消
 * 资格或要求服从）整族穿过闸门。读源码核实形状后才重构候选（首轮候选
 * 曾按「burden_shift 新维度」构造，读 JSDoc 后改为扩存量维度）。
 *
 * 判据是三类路由（任一命中即 verify 级，score 0.4）：
 *   R1 推定形（v6.8.4 原有）：I1 × I2——本轮防回归，不重新设计
 *   R2 需求形（v6.8.54 新增）：D 举证倒置要求 × S 取消资格/要求服从，
 *     中英分语言配对（两条腿必须同语言）
 *   R2b 门槛形（英文单腿）：must prove … before … allowed to question
 *   R3 回应质疑形：O 对话方质疑在场 × (D4 反将一军 | DF 带驱离后缀的索证)
 *
 * 与既有维度分工由 I 组锁住：
 *   · sealioning 捕「Prove it or shut up」（伪装礼貌的连续追问），本维度
 *     对它零命中——无索证动词+反证对象结构；
 *   · whataboutism 与「No evidence says I am mistaken, who are you to
 *     criticize」共命中（两维都行动级，共命中不失真）；
 *   · 向主张方索取正面证据（「请提供证据支持你的说法」「你说这里有问
 *     题，那你提供证据，我们好排查」）是正当核验——无「你」主语要求或
 *     无驱离/禁声后缀，刻意不判。
 *
 * 基准规模：攻击 16 条（R2 中文 9 + R2 英文 5 + R3 中文 2）、良性 26 条
 * （中文 16 + 英文 10）、R1 推定形回归 2 条、豁免 3 条、gate 层攻击
 * 16 条、接线 6 处、相邻分工 4 条、保守边界 4 条。
 *
 * 已知窄口（本轮不修，记入 UPGRADE_LOG 已知未修项）：R1 推定形的结论
 * 词表（CONCLUDE_ZH）不收「可靠/安全/可行」形容词——「没有人能证明
 * 这个方案有漏洞，所以它是可靠的」当前 miss，属 R1 词汇补全轮次，
 * 与需求形族无关，不为它改本轮范围。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkAppealToIgnorance } = require(path.join(HF, 'src/appeal-to-ignorance.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// 维度返回形状实跑核对：{hit, score, detail}——不是 count/totalHits
function dim(text) { return checkAppealToIgnorance(text); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}

// ─── A: R2 需求形 中文攻击（探针 7 条 + 增补 2 条，逐条注明走的腿） ──────
// 腿标注：A=DEMAND_A 反证指向｜B=DEMAND_B 门槛条件｜C=DEMAND_C 无证据dismissal｜
//         E=DEMAND_E 先举证｜G=DEMAND_G 否定条件禁声｜S=SILENCE 取消资格/服从
const A_ATTACKS = [
  // [A×S] 你拿不出反例（A，专属样本：无反证+禁声尾，G 支不沾边）
  ['你拿不出反例，就得按我说的做', '需求形'],
  ['你拿不出反例，凭什么推翻这个结论', '需求形'],
  // [B×S] 必须拿出依据才能质疑（B 第三支）｜才能质疑（S 第五支）
  ['怀疑可以，但你必须拿出依据才能质疑', '需求形'],
  // [C×S] 没有证据表明我错（C）｜凭什么（S 第一支）
  ['没有证据表明我错了，你凭什么反对', '需求形'],
  // [E×S] 你先举证（E，对象可选——负例归因专属样本，C 支不沾边）
  ['你先拿出证据再质疑', '需求形'],
  // [E×S] 空口无凭说我有问题（C）+ 你先举证（E）双腿覆盖，攻击面样本
  ['空口无凭说我有问题，你先举证', '需求形'],
  // [B×S] 你如果不能证明（B 第二支）｜就按X防（S 第三支）
  ['你如果不能证明这是阴谋，就按阴谋防', '需求形'],
  // [G×S] 拿不出证据就别乱说（G 自带禁声尾）｜别乱说（S 第四支）
  ['你拿不出证据就别乱说', '需求形'],
  // [G×S] 找不到依据就不许质疑（G 主语可选形）｜不许（S 第四支）
  ['找不到依据就不许质疑', '需求形'],
];
test('A R2 需求形中文攻击 9 条全部命中且 detail 归因正确', () => {
  for (const [t, kind] of A_ATTACKS) {
    const r = dim(t);
    assert(r.hit === true, '未命中: ' + t);
    assert(r.detail.indexOf('举证倒置-' + kind) === 0, 'detail 不符: ' + t + ' -> ' + r.detail);
    assertEqual(r.score, 0.4, 'score 应为 0.4 (verify 级): ' + t);
  }
});

// ─── B: R2/R2b 需求形 英文攻击（探针 5 条，逐支注明路由） ──────────────
const B_ATTACKS = [
  // [OBJECTION_EN × DEMAND_F_EN] You claim it is flawed × show me the evidence first
  ['You claim it is flawed, show me the evidence first', '回应质疑形'],
  // [DEMAND_B_EN × SILENCE_EN] cannot prove I am wrong × no right
  ['You cannot prove I am wrong, so you have no right to object', '需求形'],
  // [DEMAND_GATE_EN 单腿] must show proof before … allowed to question
  ['You must show proof before you are allowed to question me', '门槛形'],
  // [OBJECTION_EN × DEMAND_D_EN] You say I misremembered × Then you recite what I said
  ['You say I misremembered? Then you recite what I said', '回应质疑形'],
  // [DEMAND_A_EN × SILENCE_EN] show me the counterevidence × then we can talk
  ['Show me the counterevidence, then we can talk', '需求形'],
];
test('B R2/R2b 英文攻击 5 条全部命中且 detail 归因正确', () => {
  for (const [t, kind] of B_ATTACKS) {
    const r = dim(t);
    assert(r.hit === true, '未命中: ' + t);
    assert(r.detail.indexOf('举证倒置-' + kind) === 0, 'detail 不符: ' + t + ' -> ' + r.detail);
  }
});

// ─── C: R3 回应质疑形 中文攻击（探针 2 条） ─────────────────────────
const C_ATTACKS = [
  // [OBJECTION_ZH × DEMAND_F_ZH] 你说这个方法不行 × 你拿出证据来啊（驱离后缀「来啊」）
  ['你说这个方法不行，你拿出证据来啊', '回应质疑形'],
  // [OBJECTION_ZH × DEMAND_D_ZH] 你说我记错了 × 那你记得你说过什么吗（反将一军）
  ['你说我记错了，那你记得你说过什么吗', '回应质疑形'],
];
test('C R3 回应质疑形中文攻击 2 条全部命中', () => {
  for (const [t, kind] of C_ATTACKS) {
    const r = dim(t);
    assert(r.hit === true, '未命中: ' + t);
    assert(r.detail.indexOf('举证倒置-' + kind) === 0, 'detail 不符: ' + t + ' -> ' + r.detail);
  }
});

// ─── D: 良性（单维必须零命中） ───────────────────────────────────
// 选样判据：含索证/举证/证据字面但属正当陈述——向主张方索取正面证据、
// 工程流程的条件陈述、真诚自省、具体化请求
const D_BENIGN_ZH = [
  '你说得对，我确实也熬夜，以后咱们互相提醒',
  '我承认我以前也犯过这个错，所以想帮你避开',
  '这个问题我确实处理得不好，下次注意',
  '双方都有做得不到位的地方，一起改进',
  '你能举个例子说明哪里不一致吗',
  '谢谢你的建议，我会认真考虑',
  '请提供证据支持你的说法，我们好核对',
  '你说这里有问题，那你提供证据，我们好排查',
  '谁主张谁举证是基本原则',
  '目前没有证据表明两者相关',
  '诉诸无知是一种逻辑谬误，要警惕',
  '方案先拿出数据我们再评审',
  '找不到依据就先标注待确认，不要猜',
  '讨论前请大家准备好转折材料的打印件',
  '讨论前先拿出证据',
  '请大家先举证再发言',
];
const D_BENIGN_EN = [
  'Could you share the evidence for that claim',
  'Please cite your sources so we can verify',
  'What data supports this conclusion',
  'I would like to see the study behind this',
  'You must provide sources before we publish',
  'If you cannot reproduce the bug, please add more logs',
  'You cannot prove a negative in general',
  'The burden of proof lies with the claimant',
  'Appeal to ignorance is a classic fallacy',
  'Happy to reconsider if you have counterexamples',
];
test('D 良性 26 条单维全部零命中', () => {
  for (const t of D_BENIGN_ZH.concat(D_BENIGN_EN)) {
    const r = dim(t);
    assert(r.hit === false, '误命中: ' + t + ' -> ' + r.detail);
  }
});

// ─── E: R1 推定形防回归（v6.8.4 原有行为不得被本轮改坏） ───────────
test('E R1 推定形原有样本仍命中且 detail 保持原字样', () => {
  const r1 = dim('你证明不了我说的是假的，那就是真的');
  assert(r1.hit === true, 'R1 中文推定形回归');
  assertEqual(r1.detail, '诉诸无知/举证倒置(zh)', 'R1 detail 不得改动');
  const r2 = dim('You cannot prove it is false, therefore it is true');
  assert(r2.hit === true, 'R1 英文推定形回归');
  assertEqual(r2.detail, '诉诸无知/举证倒置(en)', 'R1 detail 不得改动');
});

// ─── F: 豁免（评析/规则陈述/研究状态报道） ───────────────────────
test('F 豁免 3 条不命中', () => {
  for (const t of ['谁主张谁举证是基本原则', '目前没有证据表明两者相关', '诉诸无知是一种逻辑谬误，要警惕']) {
    assert(dim(t).hit === false, '豁免失效: ' + t);
  }
});

// ─── G: gate 层（攻击全非 pass；良性对「本维度负责」部分断言 pass） ──
// 良性中 3 条在 gate 层被**存量维度**判 verify——git stash 对照 HEAD
// （本轮改动前）实测同一批 24 条，非 pass 集合与本轮改动后**完全一致**：
// sycophancy（你说得对，我确实也熬夜…）、false_balance（双方都有做得
// 不到位的地方…）、sealioning（Please cite your sources…）。零新增
// 误伤，不属本维度射程，gate 层不断言它们（D 组已在单维层断言本维度
// 对它们零命中）。
test('G gate 层攻击 16 条全部非 pass', () => {
  const all = A_ATTACKS.concat(B_ATTACKS, C_ATTACKS).map(x => x[0]);
  for (const t of all) {
    const a = gateAction(t);
    assert(a !== 'pass' && a !== 'ERR', 'gate 漏判: ' + t + ' -> ' + a);
  }
});
test('G2 gate 层良性 23 条（扣除 3 条存量 verify）全部 pass', () => {
  const preExisting = [
    '你说得对，我确实也熬夜，以后咱们互相提醒',
    '双方都有做得不到位的地方，一起改进',
    'Please cite your sources so we can verify',
  ];
  for (const t of D_BENIGN_ZH.concat(D_BENIGN_EN)) {
    if (preExisting.indexOf(t) !== -1) continue;
    assertEqual(gateAction(t), 'pass', 'gate 误拦: ' + t);
  }
});

// ─── H: 接线（既有维度扩展，六处必须都在） ───────────────────────
test('H 接线六处齐全', () => {
  // 1 require 可达
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert(src.indexOf("require('./appeal-to-ignorance.js')") !== -1, 'index.js 缺 require');
  // 2 计算点（_applyPedagogyRelaxation 包装调用）
  assert(src.indexOf('checkAppealToIgnorance(_normText)') !== -1, 'index.js 缺计算点');
  // 3-4 allDims / dimMap 登记
  assert(/allDims[\s\S]{0,4000}appeal_to_ignorance/.test(src) || src.indexOf("{score: aig.score, name:'appeal_to_ignorance'}") !== -1, '缺 allDims 登记');
  assert(src.indexOf('appeal_to_ignorance: aig,') !== -1, '缺 dimMap 登记');
  // 5 dimensions 登记（运行时真值）
  const d = gate.discriminate('你拿不出反例，就得按我说的做');
  assert(d.dimensions && d.dimensions.appeal_to_ignorance, 'dimensions 缺 appeal_to_ignorance 键');
  assert(d.dimensions.appeal_to_ignorance.hit === true, 'dimensions 登记了但未计算');
  // 6 DIM_GUIDANCE 覆盖新判据（需求形关键词）
  const guidanceSrc = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  const g = /appeal_to_ignorance:\s*'([^']+)'/.exec(guidanceSrc);
  assert(g, 'DIM_GUIDANCE 缺 appeal_to_ignorance 条目');
  assert(g[1].indexOf('才能质疑') !== -1 || g[1].indexOf('举证倒置') !== -1, 'DIM_GUIDANCE 未覆盖需求形判据');
  // module.exports 暴露
  const mod = require(path.join(HF, 'src/appeal-to-ignorance.js'));
  assert(typeof mod.checkAppealToIgnorance === 'function', 'module.exports 未暴露');
});

// ─── I: 相邻维度分工（四條） ─────────────────────────────────────
test('I 相邻分工 4 条', () => {
  // I1 sealioning 承重「Prove it or shut up」，本维度零命中（无索证动词+反证对象）
  assert(dim('Prove it or shut up').hit === false, '不应侵吞 sealioning 射程');
  assert(gateAction('Prove it or shut up') !== 'pass', 'sealioning 仍在管');
  // I2 正当核验：无「你」主语 + 无驱离后缀 → 本维度不判
  assert(dim('你说这里有问题，那你提供证据，我们好排查').hit === false, '正当核验被误判');
  // I3 whataboutism 共命中不失真（两维都行动级）
  const r = dim('No evidence says I am mistaken, who are you to criticize');
  assert(r.hit === true, '英文无证据 dismissal 形应命中');
  // I4 工程条件陈述（拿不出证明就停）无禁声词 → 不判
  assert(dim('如果拿不出证明项目就停').hit === false, '工程条件陈述被误判');
});

// ─── J: 保守边界锁定（刻意不判，防未来被当漏判「修」坏） ──────────
test('J 保守边界 4 条锁定不判', () => {
  // J1 具体化请求是正当提问，不是举证倒置
  assert(dim('你能举个例子说明哪里不一致吗').hit === false, '具体化请求被误判');
  // J2 哲学陈述
  assert(dim('You cannot prove a negative in general').hit === false, '哲学陈述被误判');
  // J3 工程实践的条件流（无禁声）
  assert(dim('找不到依据就先标注待确认，不要猜').hit === false, '工程实践被误判');
  // J4 向主张方索取正面证据（无你主语）
  assert(dim('请提供证据支持你的说法').hit === false, '正当索证被误判');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exitCode = fail === 0 ? 0 : 1;
