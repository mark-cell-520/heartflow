'use strict';
/**
 * r213 — mediator_confusion（第 210 维度）负例注入测试
 * 承重对象：src/mediator-confusion.js 的判据腿与豁免常量
 * 追责口径：本文件逐常量验证「改任一承重常量必翻转判定」，防止负例补丁式升级。
 * 运行：node test/round-213-mediator-confusion.js
 */
const path = require('path');
const MC = require(path.join(__dirname, '..', 'src', 'mediator-confusion.js'));

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; } else { fail++; console.log('  ❌ ' + name); } };

const { checkMediatorConfusion, __internals } = MC;

// ---- 攻击集（两腿共现：控制/解释 × 效应否定）----
const ATTACKS = [
  // ZH
  '因为患者都吃了止痛药，所以疼痛和骨折没有关系。',
  '控制了消炎药用量之后，炎症和发烧就不相关了。',
  '止痛药完全解释了损伤与痛苦之间的联系。',
  '一旦控制了收入，教育对健康就没有影响了。',
  '因为中介变量是睡眠，所以运动和健康没有因果关系。',
  '消炎药用量可以解释炎症与发烧的关系，所以发烧与炎症无关。',
  '只有吃了止痛药才会不痛，所以疼痛和骨折无关。',
  '把睡眠这个中介因素扣掉之后，运动和抑郁之间就不存在因果了。',
  // EN
  'Once you control for income, education has no effect on health.',
  'Painkillers fully explain the link between injury and suffering.',
  'Exercise reduces depression only because it improves sleep.',
  'After adjusting for the mediator, the treatment is no longer significant.',
  'Since stress works through cortisol, cortisol is the real cause.',
  'The connection between wealth and health is entirely mediated by diet.',
  // 长句 / 带修饰
  '在这项研究中，研究者严格控制了受试者的用药剂量这一中间变量，据此他们认为原始干预对最终结局并没有任何作用。',
  'Because the whole effect flows through trust, and once trust is accounted for the program makes no difference at all.',
];

// ---- 良性集（含边缘良性）----
const BENIGN = [
  // 概念/教学转述
  '睡眠是运动和抑郁之间的中介变量，这有待进一步验证。',
  '中介分析必须区分中介变量和混杂因素。',
  '需要区分中介变量和混杂因素，不能一概控制。',
  'Mediation analysis separates mediators from confounders.',
  // 正确响应形（指出控制中介会切断通道）
  '不能控制中介变量，控制它会切断这条因果通道。',
  'Controlling a mediator blocks the pathway and biases the estimate.',
  // 混杂控制形（控制真正的第三方）
  '这项研究同时控制了年龄、性别等第三方因素。',
  'The model controls for confounders like age and baseline health.',
  // 直接效应仍显著
  '控制收入之后，教育的直接效应仍然显著。',
  '运动改善睡眠，睡眠改善情绪，这是一个合理的中介链条。',
  // 多因陈述（边缘良性）
  '因果链是多因共同起作用的结果，不能控制中间环节就否定上游。',
  '健康是多种因素共同作用的结果。',
  // 观察性数据 / 待验证
  '观察性数据显示用药量与疼痛减轻相关，但因果方向仍待验证。',
  '我们还需要路径分析才能确认这个中介假设。',
  // 对冲 / 疑问
  '控制中介后效应可能减弱，但这不意味着上游无关。',
  '这真的能说明教育对健康没有影响吗？',
  // EN 直接因果（r213 FP 修复项）
  'He passed the exam simply because he studied.',
  'She got the job because she prepared well.',
];

for (const s of ATTACKS) {
  const r = checkMediatorConfusion(s);
  ok(r && r.hit === true, 'attack: ' + s.slice(0, 34));
}
for (const s of BENIGN) {
  const r = checkMediatorConfusion(s);
  ok(r && r.hit !== true, 'benign: ' + s.slice(0, 34));
}

// ---- 常量负例注入（承重翻转）----
const I = __internals();
ok(I && I.CONTROL_ZH && I.NULL_ZH, 'internals 暴露腿常量');

const atkSample = '控制了消炎药用量之后，炎症和发烧就不相关了。';
const enSample  = 'Once you control for income, education has no effect on health.';

if (I && I.CONTROL_ZH && I.NULL_ZH) {
  const zhCtrl = I.CONTROL_ZH.some(re => re.test(atkSample));
  const zhNull = I.NULL_ZH.some(re => re.test(atkSample));
  ok(zhCtrl, 'ZH 腿①常量命中攻击样本（控制/调控/校正…）');
  ok(zhNull, 'ZH 腿②常量命中攻击样本（无关/不相关/没有影响…）');

  const enCtrl = I.CONTROL_EN.some(re => re.test(enSample));
  const enNull = I.NULL_EN.some(re => re.test(enSample));
  ok(enCtrl, 'EN 腿①常量命中攻击样本（control for / adjust for …）');
  ok(enNull, 'EN 腿②常量命中攻击样本（no effect / no relationship …）');

  // 豁免常量不得命中攻击样本
  const exemptZh = (I.EXEMPT_META_ZH || []).some(re => re.test(atkSample));
  ok(!exemptZh, 'ZH 元话语豁免不命中攻击样本（r213 收窄项）');
  const exemptEn = (I.EXEMPT_META_EN || []).some(re => re.test(enSample));
  ok(!exemptEn, 'EN 元话语豁免不命中攻击样本');

  // 豁免常量必须命中教学/概念样本
  const teachSample = '中介分析必须区分中介变量和混杂因素。';
  const teachHit = (I.EXEMPT_META_ZH || []).some(re => re.test(teachSample));
  ok(teachHit, 'ZH 元话语豁免命中教学样本');
}

// ---- 分工边界锁：邻近窗 / 单一腿不判 ----
const noLeg2 = '控制了消炎药用量之后，炎症和发烧的相关性需要进一步确认。';
ok(checkMediatorConfusion(noLeg2).hit !== true, '只有腿①（无效应否定）不判');
const noLeg1 = '炎症和发烧本来就毫无关系，与任何处理都无关。';
ok(checkMediatorConfusion(noLeg1).hit !== true, '只有腿②（无控制动作）不判');

// ---- gate 层接线登记 ----
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const g = gate.gate ? gate.gate(atkSample) : gate(atkSample);
ok(g && g.gate && g.gate.action !== 'pass', 'gate 层攻击样本非 pass');
const findingsDims = ((g && g.findings) || []).map(f => f.dimension);
ok(findingsDims.includes('mediator_confusion'), 'gate findings 含 mediator_confusion');
const gb = gate.gate ? gate.gate('需要区分中介变量和混杂因素，不能一概控制。') : gate('需要区分中介变量和混杂因素，不能一概控制。');
const gbDims = ((gb && gb.findings) || []).map(f => f.dimension);
ok(!gbDims.includes('mediator_confusion'), 'gate 层教学良性不含 mediator_confusion');

// ---- r214 补测：效应消失类腿（vanishes / never causal / 烟消云散）----
ok(checkMediatorConfusion('The apparent effect vanishes once you partial out the mediating steps.').hit === true, '效应消失腿（EN vanishes + partial out）命中');
ok(checkMediatorConfusion('The effect dissipates once you account for the intermediate mechanism.').hit === true, '效应消失腿（EN dissipates + account for）命中');
ok(checkMediatorConfusion('Once you control for income, the upstream cause was never causal at all.').hit === true, 'never causal 腿命中');
ok(checkMediatorConfusion('控制了中间环节之后，之前的关联便荡然无存。').hit === true, '效应消失腿（ZH 荡然无存）命中');
ok(checkMediatorConfusion('扣掉传导路径上的环节后，两者之间的关系已无从谈起。').hit === true, '效应消失腿（ZH 无从谈起）命中');

// ---- r214 修订：反问句豁免不再一刀切 ----
// 原实现整句含 ?/？ 即豁免，导致"用问号包装的断言"逃判
ok(checkMediatorConfusion('难道控制了中间环节之后，还能说上游因素真的起作用了吗？事实上两者再无关系。').hit === true, '反问形攻击（难道+还能说）不豁免');
ok(checkMediatorConfusion('控制了中间环节之后，两者之间还有什么关系可言呢？').hit === true, '反问形攻击（谈何类）不豁免');
// 真询问句仍豁免（无疑问标记 + 两腿齐备时，原判据本会命中，豁免逻辑挡住）
ok(checkMediatorConfusion('请问控制了消炎药用量之后，炎症和发烧是否就不相关了？').hit !== true, '真询问句仍豁免');

// ---- r214：豁免常量不被新腿误触 ----
ok(checkMediatorConfusion('中介变量是因果链上的传递通道，控制它会切断总效应。').hit !== true, '概念转述豁免不被效应消失腿误触');
ok(checkMediatorConfusion('控制了年龄、性别等第三方因素后，暴露与疾病的关联仍然显著。').hit !== true, '混杂控制形不被效应消失腿误触');

console.log(`\nr213 mediator_confusion: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
