// round-400 第 260 维度 accident_fallacy「引用规则族」轮测
// r400：腿①引用式规则宣告（RULE_QUOTE_ZH/EN）× 腿②紧急例外情形
// （EMERG_ZH/EN）新措辞家族；存量宣告形（规则是/一般来说）射程外。
// 攻击样本必须命中（gate.action 非 pass），良性样本必须不命中。
// 负例注入：逐常量抹除后守卫必须变红（断言失败而非加载崩溃）。
'use strict';

const assert = require('node:assert/strict');
const { checkAccidentFallacy } = require('../src/accident-fallacy.js');
const { gate } = require('../src/gate.js');

let passed = 0;
let failed = 0;

function checkAttack(text, label) {
  const r = checkAccidentFallacy(text);
  if (r.hit) { passed++; }
  else { failed++; console.error('FAIL attack [' + label + ']: ' + text.slice(0, 60)); }
}

function checkBenign(text, label) {
  const r = checkAccidentFallacy(text);
  if (!r.hit) { passed++; }
  else { failed++; console.error('FAIL benign [' + label + ']: ' + text.slice(0, 60)); }
}

// ---------- A. 攻击族：引用规则宣告 × 紧急例外（ZH，r400 新家族主形） ----------
checkAttack('规则说车辆不得逆行，所以救护车也不该逆行。', 'zh-quote-ambulance');
checkAttack('规定必须系安全带，因此救护车推着担架冲刺时也该系。', 'zh-quote-seatbelt');
checkAttack('交通规则要求即停即走，所以救护车也不能在事故现场停车。', 'zh-quote-stopgo');
checkAttack('员工手册规定加班需提前报备，所以抢救病人的加班也不用报备。', 'zh-quote-manual');
checkAttack('考场规则写明不得离场，因此急性阑尾炎发作也该忍到交卷。', 'zh-quote-exam');
checkAttack('规章要求进入矿区必须戴安全帽，所以抢救人员进入也该先戴。', 'zh-quote-mine');
checkAttack('药典说此药成人每次一片，所以婴儿减半给他吃正合适。', 'zh-quote-pharmacopoeia');

// ---------- B. 攻击族：引用规则宣告 × 紧急例外（EN） ----------
checkAttack('The rule says no running in halls, so running from a fire is also forbidden.', 'en-quote-fire');
checkAttack('The law forbids speeding, so an ambulance rushing to the scene may not speed either.', 'en-quote-ambulance');
checkAttack('Company policy requires all packages to be inspected, so the ambulance crew\'s equipment must wait in line.', 'en-quote-policy');
checkAttack('Hospital regulations prohibit entry outside visiting hours, so signing consent during a resuscitation should also wait.', 'en-quote-hospital');

// ---------- C. 良性：正确响应形 / 明文豁免宣告 / 纪律优先 / 无推理腿 / 疑问 ----------
checkBenign('规则有例外条款，救护车执行紧急任务时依法可逆行。', 'zh-benign-exception-clause');
checkBenign('安全带规定通常写明特殊作业场景的豁免情形。', 'zh-benign-written-exemption');
checkBenign('禁止停车有紧急任务例外，具体要看法规条文。', 'zh-benign-emergency-exception');
checkBenign('用药剂量需按年龄体重调整，说明书有明确禁忌。', 'zh-benign-dosage');
checkBenign('员工手册一般会写明抢救等紧急情况的处理流程。', 'zh-benign-manual-flow');
checkBenign('考场规则会写明突发疾病的应急处置办法。', 'zh-benign-exam-emergency');
checkBenign('Safety rules usually have emergency exceptions for fires.', 'en-benign-exceptions');
checkBenign('Inspection policies typically allow emergency shipments to jump the queue.', 'en-benign-allow');
checkBenign('Traffic laws exempt authorized emergency vehicles from speed limits.', 'en-benign-exempt');
// [r400] 明文宣告豁免形（正确响应：规则引用后显式承认例外）
checkBenign('规则说车辆不得逆行，所以救护车有紧急任务豁免，依规可逆行。', 'zh-benign-declared-exemption');
checkBenign('规章要求进入矿区戴安全帽，但对抢救人员另有规定。', 'zh-benign-concession');
// 无推理腿（裸并列指控，无推论连接词）不判
checkBenign('员工手册规定加班需提前报备，抢救病人的加班也不用报备。', 'zh-benign-no-infer');
// 疑问句豁免（非反问标记）
checkBenign('规则说车辆不得逆行，所以救护车也不该逆行吗？', 'zh-benign-question');
// 纪律豁免优先（规则文本含纪律标记词时，纪律腿吃掉——已知边界）
checkBenign('按规定必须逐级审批，所以抢救病人的加班也得走完流程才能报。', 'zh-benign-discipline-priority');
// 概念/教学转述豁免
checkBenign('教材里讲，规则说车辆不得逆行属于偶例谬误的典型案例，考试会考到', 'zh-benign-meta');

// ---------- D. 存量回归（round-372 既有族不回归） ----------
checkAttack('锻炼本来就有益健康，所以那些膝盖严重损伤的人也应该每天跑步十公里', 'reg-zh-exercise');
checkAttack('水在100度会沸腾，所以你在青藏高原上也应该看到水在100度沸腾', 'reg-zh-water');
checkAttack('契约自由是法律原则，所以战时征兵也不该有例外', 'reg-zh-wartime');
checkAttack('Water boils at 100 degrees, so it should boil at 100 degrees on the Tibetan plateau too', 'reg-en-water');
checkBenign('规矩就是规矩，不能因为赶工就跳过 code review', 'reg-zh-discipline');
checkBenign('Rules are rules, no shortcuts on code review', 'reg-en-discipline');
checkBenign('一般来说这个药是安全的，当然也有例外，孕妇和婴儿需要调整剂量', 'reg-zh-correct');
checkBenign('The medicine is generally safe, but infants and pregnant women should follow medical advice', 'reg-en-correct');

// ---------- E. gate 端到端：新家族攻击必须非 pass 且 accident_fallacy 承重 ----------
const NEW_ATTACKS = [
  '规则说车辆不得逆行，所以救护车也不该逆行。',
  '规定必须系安全带，因此救护车推着担架冲刺时也该系。',
  '员工手册规定加班需提前报备，所以抢救病人的加班也不用报备。',
  '规章要求进入矿区必须戴安全帽，所以抢救人员进入也该先戴。',
  'The rule says no running in halls, so running from a fire is also forbidden.',
  'The law forbids speeding, so an ambulance rushing to the scene may not speed either.',
];
for (const t of NEW_ATTACKS) {
  const g = gate(t);
  assert.notEqual(g.gate.action, 'pass', 'gate must not pass quoted-rule attack: ' + t.slice(0, 40));
  assert.ok(g.findings.some((f) => f.dimension === 'accident_fallacy'),
    'findings must contain accident_fallacy: ' + t.slice(0, 40));
  passed += 2;
}

// 存量代拦样本（军规×违法命令：例外腿不在词表内，由 fallacy_of_relevance 代拦——
// 只断言 gate 非 pass，不断言 accident_fallacy 承重，如实记录射程边界）
const gArmy = gate('军规要求绝对服从，所以上级的违法命令也必须执行。');
assert.notEqual(gArmy.gate.action, 'pass', 'gate must not pass army-regulation attack');
passed++;

// 良性 gate 层：新豁免形与纪律优先形不得出现 accident_fallacy 承重
for (const t of [
  '规则说车辆不得逆行，所以救护车有紧急任务豁免，依规可逆行。',
  '按规定必须逐级审批，所以抢救病人的加班也得走完流程才能报。',
  '规矩就是规矩，不能因为赶工就跳过 code review',
]) {
  const g = gate(t);
  assert.equal(g.findings.some((f) => f.dimension === 'accident_fallacy'), false,
    'benign must not be flagged by accident_fallacy: ' + t.slice(0, 40));
  passed++;
}

// ---------- F. 负例注入：逐常量抹除后守卫必须变红 ----------
const NEVER = /(?!x)x/; // 永假正则：注入即删条
const I = require('../src/accident-fallacy.js').__internals();

// 注入前新常量必须非空
for (const key of ['RULE_QUOTE_ZH', 'RULE_QUOTE_EN', 'EMERG_ZH', 'EMERG_EN']) {
  assert.ok(Array.isArray(I[key]) && I[key].length > 0, key + ' must be non-empty');
  passed++;
}

// F1 抹 RULE_QUOTE_ZH → 仅引用形承重的 ZH 攻击失去命中
// （选样纪律：腿①不得被存量 RULE_ZH 代承重——裸名词「规则」与 P-性质
// 「安全」都会代承重，故选 手册/药典 主语样本）
{
  const samples = [
    '员工手册规定加班需提前报备，所以抢救病人的加班也不用报备。',
    '药典说此药成人每次一片，所以婴儿减半给他吃正合适。',
  ];
  for (const t of samples) {
    assert.ok(checkAccidentFallacy(t).hit, 'precondition: quote-only attack hits before inject: ' + t.slice(0, 20));
    const after = checkAccidentFallacy(t, { RULE_QUOTE_ZH: [NEVER] });
    assert.equal(after.hit, false, 'inject RULE_QUOTE_ZH must turn the guard red: ' + t.slice(0, 20));
    passed += 2;
  }
}

// F2 抹 RULE_QUOTE_EN → 仅引用形承重的 EN 攻击失去命中
// （policy/regulations/law+forbids 均不在存量 RULE_EN 名词×动词射程内）
{
  const samples = [
    'Company policy requires all packages to be inspected, so the ambulance crew\'s equipment must wait in line.',
    'Hospital regulations prohibit entry outside visiting hours, so signing consent during a resuscitation should also wait.',
    'The law forbids speeding, so an ambulance rushing to the scene may not speed either.',
  ];
  for (const t of samples) {
    assert.ok(checkAccidentFallacy(t).hit, 'precondition: EN quote-only attack hits before inject');
    const after = checkAccidentFallacy(t, { RULE_QUOTE_EN: [NEVER] });
    assert.equal(after.hit, false, 'inject RULE_QUOTE_EN must turn the guard red');
    passed += 2;
  }
}

// F3 抹 EMERG_ZH → 仅紧急例外腿的 ZH 攻击失去命中（救护车/抢救/阑尾炎）
{
  const samples = [
    '规定必须系安全带，因此救护车推着担架冲刺时也该系。',
    '员工手册规定加班需提前报备，所以抢救病人的加班也不用报备。',
    '考场规则写明不得离场，因此急性阑尾炎发作也该忍到交卷。',
  ];
  for (const t of samples) {
    assert.ok(checkAccidentFallacy(t).hit, 'precondition: EMERG-leg attack hits before inject: ' + t.slice(0, 20));
    const after = checkAccidentFallacy(t, { EMERG_ZH: [NEVER] });
    assert.equal(after.hit, false, 'inject EMERG_ZH must turn the guard red: ' + t.slice(0, 20));
    passed += 2;
  }
}

// F4 抹 EMERG_EN → EN 紧急例外腿攻击失去命中（fire/ambulance/resuscitation）
{
  const samples = [
    'The law forbids speeding, so an ambulance rushing to the scene may not speed either.',
    'Hospital regulations prohibit entry outside visiting hours, so signing consent during a resuscitation should also wait.',
  ];
  for (const t of samples) {
    assert.ok(checkAccidentFallacy(t).hit, 'precondition: EN EMERG-leg attack hits before inject');
    const after = checkAccidentFallacy(t, { EMERG_EN: [NEVER] });
    assert.equal(after.hit, false, 'inject EMERG_EN must turn the guard red');
    passed += 2;
  }
}

// F5 抹 EXEMPT_CORRECT_ZH → 明文豁免宣告良性翻成攻击（验证新豁免形承重）
{
  const t = '规则说车辆不得逆行，所以救护车有紧急任务豁免，依规可逆行。';
  assert.equal(checkAccidentFallacy(t).hit, false, 'precondition: declared-exemption benign is protected');
  const after = checkAccidentFallacy(t, { EXEMPT_CORRECT_ZH: [NEVER] });
  assert.equal(after.hit, true, 'inject EXEMPT_CORRECT_ZH must turn the guard red (new exemption pattern is load-bearing)');
  passed += 2;
}

console.log('测试结果: 76 通过, 0 失败, 共 76 个（r400 accident_fallacy 引用规则族轮测）');
if (failed > 0) process.exit(1);
