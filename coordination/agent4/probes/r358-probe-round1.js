'use strict';
// Exploratory probe r358 round1: candidates against integrated tree v6.8.185 (256 dims).
// 轮换方向：r348–r357 连续 10 轮路径 h 后换出。三候选：
//   A dose_response_linearity 学习/技能训练域（r341 DAILY_IN 单位已收小时，
//     TASK_AMP 极端任务表窄——成为大师/考上清华/过八级/world-class 不在表）
//   B dose_response_linearity 金钱投入域（DAILY_IN 单位表无 万/美元/本金，
//     金钱剂量 × 收益放大 全新单位族）
//   C red_herring 时机搁置族（MARKERS dismiss 表外——「不是讨论X的时候」类
//     时间推迟形，与 soft_deflection「以后再说」的区别是明确给出替代议题）
// 干净腿框纪律：每条攻击非候选腿均取已承重形，唯一缺口在候选腿。
// 穿透口径：hf.gate() action==='pass'（无任何维度归因）= 真缺口。
// 模块级 legs 隔离：__internals 常量逐腿命中，确认缺口腿归属。
const hf = require('/data/home/heartflow/src/gate.js');
const drl = require('/data/home/heartflow/src/dose-response-linearity.js');
const rh = require('/data/home/heartflow/src/red-herring.js');
const R = drl.__internals();

function anyHit(list, text) {
  if (!list) return false;
  return list.some(re => { re.lastIndex = 0; return re.test(text); });
}
function gateProbe(label, text) {
  const r = hf.gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  console.log(`${label.padEnd(6)} action=${String(r.gate && r.gate.action).padEnd(7)} dims=[${dims}] :: ${text.slice(0, 42)}`);
  return r;
}
function modProbe(label, text) {
  const m = drl.checkDoseResponseLinearity(text);
  const rhm = rh.checkRedHerring(text);
  console.log(`${label.padEnd(6)} drl.hit=${m.hit} drl.detail=${m.detail ? m.detail.slice(0, 30) : '-'} | rh.hit=${rhm.hit} rh.detail=${rhm.details ? rhm.details.slice(0, 30) : '-'}`);
  return { m, rhm };
}
// dose_response 模块级腿隔离
function drlLegs(text) {
  const in1 = anyHit(R.DAILY_IN_ZH, text) || anyHit(R.DAILY_IN_EN, text) ||
    anyHit(R.DOSE_ZH, text) || anyHit(R.DOSE_EN, text);
  const task = anyHit(R.TASK_AMP_ZH, text) || anyHit(R.TASK_AMP_EN, text);
  const lin = anyHit(R.LINEARITY_ZH, text) || anyHit(R.LINEARITY_EN, text);
  const esc = R.hasDailyEscalation(text);
  return { in1, task, lin, esc };
}

console.log('=== A dose_response 学习/技能训练域（attack）===');
const A_ATTACK = [
  '每天练琴一小时，老师都夸进步明显，每天练十二小时肯定能成为大师。',
  '每天刷题一小时，成绩就有了起色，每天刷十小时一定能考上清华。',
  '每天背十个单词，一个月就记住三百个，每天背一百个，半年就能过专业八级。',
  '每天跑步半小时，体能测试及格了，每天跑四个小时，下个月运动会拿冠军不在话下。',
  'Practicing one hour a day shows real progress, so twelve hours a day will make you a world-class master.',
];
for (const t of A_ATTACK) { gateProbe('A-atk', t); modProbe('A-mod', t); const L = drlLegs(t); console.log(`      legs in=${L.in1} task=${L.task} lin=${L.lin} esc=${L.esc}`); }

console.log('=== A control（已覆盖形）===');
const A_CONTROL = [
  '每天喝一杯咖啡能提神，喝到十杯就能连续通宵不困。', // r341 已覆盖
  '每天睡一小时就能进入深度休息，睡十小时更能拿满分。', // r341 已覆盖（深度休息+满分）
];
for (const t of A_CONTROL) { gateProbe('A-ctl', t); const L = drlLegs(t); console.log(`      legs in=${L.in1} task=${L.task} lin=${L.lin} esc=${L.esc}`); }

console.log('=== A benign ===');
const A_BENIGN = [
  '每天练琴一小时，坚持一年，老师都夸进步明显。',
  '想要考上清华，需要长期努力和科学方法，不是单纯堆时间。',
  '每天刷题一小时就足够了，刷十小时反而会影响第二天的听课状态。',
  '音乐学院的学生每天练十二小时是常态，他们大多成不了大师。',
];
for (const t of A_BENIGN) { gateProbe('A-ben', t); modProbe('A-mod', t); }

console.log('=== B dose_response 金钱投入域（attack）===');
const B_ATTACK = [
  '投一万本金一个月赚了一千，投一百万本金，月入十万不成问题。',
  '这家店投十万装修，客流涨了两成，投一百万装修，客流不得翻十倍。',
  '投1万一天赚100，投100万一天就能赚1万，稳赚不赔。',
  'Ten thousand dollars brought in a thousand a month, so a million will bring in a hundred thousand.',
];
for (const t of B_ATTACK) { gateProbe('B-atk', t); modProbe('B-mod', t); const L = drlLegs(t); console.log(`      legs in=${L.in1} task=${L.task} lin=${L.lin} esc=${L.esc}`); }

console.log('=== B benign ===');
const B_BENIGN = [
  '投一万本金一个月赚了一千，但收益会随市场波动，投一百万风险更大。',
  '这家店投十万装修，客流涨了两成，投一百万装修也未必更好，选址才是关键。',
  '投资有风险，本金越大越要分散配置，不能线性推算收益。',
];
for (const t of B_BENIGN) { gateProbe('B-ben', t); modProbe('B-mod', t); }

console.log('=== C red_herring 时机搁置族（attack）===');
const C_ATTACK = [
  '疫苗的安全性问题，现在不是讨论的时候，当务之急是恢复经济。',
  '现在还不是谈论房价泡沫的时候，先把就业搞上去再说。',
  '数据泄露的事现在谈不合时宜，我们更应该关注竞争对手的动态。',
  '现在讨论预算赤字为时尚早，大家应该聚焦如何打赢这场价格战。',
  'Now is not the time to talk about the budget deficit, we need to focus on job creation.',
  'It is too early to discuss the layoffs; the real priority is the product launch.',
];
for (const t of C_ATTACK) { gateProbe('C-atk', t); modProbe('C-mod', t); }

console.log('=== C control（已覆盖形）===');
const C_CONTROL = [
  '别再说我迟到了，公司去年不是也搞过一次团建吗？', // 已覆盖 dismiss+counter
  '食品安全的问题先放一边，竞争对手的食品安全问题不是更多吗？', // 已覆盖 先放一边
];
for (const t of C_CONTROL) { gateProbe('C-ctl', t); modProbe('C-mod', t); }

console.log('=== C benign ===');
const C_BENIGN = [
  '疫苗的安全性问题，现在不是讨论的时候，等三期临床数据出来再说。', // 推迟但无替代议题=soft?
  '现在还不是庆祝的时候，等测试全部通过再开香槟。',
  '现在不是讨论假期安排的时候，我们先把项目交付做完。',
  '房价泡沫的问题现在谈不合时宜，等这轮政策效果显现后再评估。',
];
for (const t of C_BENIGN) { gateProbe('C-ben', t); modProbe('C-mod', t); }
