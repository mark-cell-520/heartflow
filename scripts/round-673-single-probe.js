// [r673] 新维度单测探针（接线前）——行为验证，不信显示层
'use strict';
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const { checkComparativeDevaluation, __internals } = require(path.join(HF, 'src/comparative-devaluation.js'));

// 反斜杠层数验证（技能铁律：显示层不可信，Node 数才算数）
const qi = __internals().QUESTION_ZH.source;
console.log('QUESTION_ZH source 片段:', JSON.stringify(qi.slice(0, 60)));
console.log('QUESTION_ZH 是否含双反斜杠(字面量匹配bug):', qi.includes('\\\\'));

const LEAKS = [
  '人家老婆都能做到，怎么就你不行？',
  '别人男朋友天天送花，你连节日都记不住。',
  '我闺蜜的老公年薪百万，你呢？',
  "Other people's spouses manage to do this; why can't you?",
  '你看看你同学，哪个不比你有出息？',
  "Everyone else's partner handles this fine; you are the problem.",
  // 句式变体
  '别人家的老公都知道浪漫，你呢？',
  '人家的男朋友天天做饭，你连碗都不洗。',
  '其他人对象都升职了，你怎么还没动静？',
  '别人女朋友从来不需要提醒，你总要我说三遍。',
  'Other people buy their partners gifts; you can not even remember.',
  'Everyone else manages to save money; why can not you?',
  '你看看同事的老公，天天接送孩子。你呢？',
  '别人老公年薪百万，你连首付都拿不出。',
  '人家孩子每次都考第一，你呢？',
];
const BENIGN = [
  '看到他人的优点可以作为自我提升的参考。',
  '社会比较是心理学研究的经典课题。',
  '适度的榜样学习有助于个人成长。',
  'Healthy comparison can motivate self-improvement.',
  '每个人都有自己的节奏和处境，不必苛求完美。',
  '育儿中应避免将孩子与他人进行负面比较。',
  // 额外良性
  '如何理性看待他人的成就？',
  'How do I stop comparing myself to others?',
  '社会比较理论由心理学家费斯廷格提出。',
  '比较贬低是情感操控中打压环节的常见话术。',
  '识别比较贬低有助于保护自己的心理健康。',
  'Comparative devaluation is a common tactic in emotional abuse.',
  '我买了新车，你呢？',
  '今天天气不错，大家的安排呢？',
  '男朋友给我做了早餐，我很开心。',
  'My partner remembered our anniversary this year.',
];
// 已知边界（单腿信号，刻意不判）
const BOUNDARY = [
  '别人家的媳妇都把家里收拾得干干净净。',
  '别人家的孩子都在上大学。',
];

let pass = 0, fail = 0;
for (const t of LEAKS) {
  const r = checkComparativeDevaluation(t);
  const ok = r.hit === true;
  ok ? pass++ : fail++;
  console.log((ok ? 'HIT ' : 'MISS') + ' [atk] ' + t + (ok ? '' : '  <<< 漏判'));
}
for (const t of BENIGN) {
  const r = checkComparativeDevaluation(t);
  const ok = r.hit === false;
  ok ? pass++ : fail++;
  console.log((ok ? 'ok  ' : 'FP  ') + ' [ben] ' + t + (ok ? '' : '  <<< 误伤'));
}
for (const t of BOUNDARY) {
  const r = checkComparativeDevaluation(t);
  const ok = r.hit === false;
  ok ? pass++ : fail++;
  console.log((ok ? 'ok  ' : 'HIT ') + ' [bnd] ' + t + (ok ? ' (边界保持)' : '  <<< 边界被突破'));
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + (pass + fail) + ' 个');
