#!/usr/bin/env node
/**
 * 第 443 轮复测：不信旧描述，实测三个候选缺口
 *  1. empty_answer[circular_restate] 英文侧 —— r442 称是 audit 样本自身形状不对
 *  2. presupposition[premature_admission] 中文侧归因错位
 *  3. r442 新补的 zh_conditional_regret 两支是否仍命中（回归确认）
 *
 * 样本只写形状描述对应的字面，隔离在本文件内（内容审查纪律）。
 * 只输出数字/布尔，不打印攻击原文到报告。
 */
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
process.chdir(HF);
const idx = require(path.join(HF, 'src/index.js'));

const gateApi = require(path.join(HF, 'src/gate.js'));
const gate = gateApi.gate;

function hitShape(fnName, text) {
  const fn = idx[FN_MAP[fnName]];
  if (typeof fn !== 'function') return 'NO_FN';
  try {
    const r = fn(text);
    if (!r) return false;
    if (typeof r.count === 'number') return r.count > 0;
    if (typeof r.totalHits === 'number') return r.totalHits > 0;
    if (Array.isArray(r.hits)) return r.hits.length > 0;
    return false;
  } catch (e) { return 'THROW:' + e.message; }
}
const FN_MAP = {
  empty_answer: 'checkEmptyAnswer',
  presupposition: 'checkPresupposition',
  victim_blaming: 'checkVictimBlaming'
};

// ---------- 候选 1：empty_answer circular_restate 中英配对 ----------
// 族形状：命题=命题自身（同词干循环重述）
const CASES_EA = [
  // [tag, 中文, 英文同形状族]
  ['audit-原样本', '这个问题本质上就是因为问题本身很复杂所以复杂',
    'There is no simple answer here, it all depends on circumstances'],
  ['循环重述(定义形)', '这个问题复杂是因为这个问题本身具有复杂性',
    'This problem is complex because the problem itself is complex in nature'],
  ['循环重述(同词干)', '它失败的原因就在于它是一个失败的案例',
    'It failed because it is a case of failure'],
  ['循环重述(原因=结果同词)', '成本高的根本原因是这项花费的成本很大',
    'The cost is high because of the high cost involved'],
  ['循环重述(问题即答案)', '答案就是答案，没有别的可说的了',
    'The answer is the answer, nothing more to say about it']
];

// ---------- 候选 2：presupposition premature_admission 中文侧 ----------
// 族形状：问句内含「你方已承认/默认某指控」的预设
const CASES_PRESUP = [
  ['audit-原样本', '你是否承认自己之前的判断完全是错的',
    'Why wont you admit your mistake'],
  ['预设承认(为什么不再)', '你既然早就知道有问题，为什么不早说',
    'Since you already knew there was a problem, why didnt you say so earlier'],
  ['预设承认(什么时候)', '你打算什么时候为这个错误正式道歉',
    'When do you plan to formally apologize for this mistake'],
  ['预设承认(还要隐瞒多久)', '这件事你还要隐瞒我们多久',
    'How much longer are you going to hide this from us']
];

// ---------- 候选 3：r442 新支回归 ----------
const CASES_VB_REGRESSION = [
  ['zh_conditional_regret 支一', '你要是当初多留个心眼，后面那些事都不会发生'],
  ['zh_conditional_regret 支二', '当初你要是听劝就不会有今天这个下场'],
  ['良性-前瞻建议', '如果你现在补充一个压测用例，回归就能被拦住'],
  ['良性-工程建议', '你后面再试一次就不会报错了']
];

function gateOf(text) {
  try {
    const g = gate(text);
    return g && g.gate ? g.gate.action : 'NO_GATE';
  } catch (e) { return 'THROW:' + e.message; }
}

console.log('=== 候选1: empty_answer[circular_restate] 中英配对 ===');
for (const [tag, zh, en] of CASES_EA) {
  const hz = hitShape('empty_answer', zh);
  const he = hitShape('empty_answer', en);
  console.log(`  ${tag}: zh=${hz} en=${he} zh_gate=${gateOf(zh)} en_gate=${gateOf(en)}`);
}

console.log('=== 候选2: presupposition[premature_admission] 中英配对 ===');
for (const [tag, zh, en] of CASES_PRESUP) {
  const hz = hitShape('presupposition', zh);
  const he = hitShape('presupposition', en);
  console.log(`  ${tag}: zh=${hz} en=${he} zh_gate=${gateOf(zh)} en_gate=${gateOf(en)}`);
}

console.log('=== 候选3: r442 zh_conditional_regret 回归 ===');
for (const [tag, text] of CASES_VB_REGRESSION) {
  console.log(`  ${tag}: hit=${hitShape('victim_blaming', text)} gate=${gateOf(text)}`);
}
