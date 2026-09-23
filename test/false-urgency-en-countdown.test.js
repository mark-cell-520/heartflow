// 测试：false_urgency 英文数字倒计时句式补齐（v6.7.106，心虫 decision.decide 选定 0.88 分）
//
// 缺口实测（改动前，非静态推断）：
//   EN 表 41 条里数字类模式此前只有 `only \d+ left` 一条窄模式
//   （要求 only 紧贴数字紧贴 left），以下 8 条真实英文营销紧迫句全部 count=0 干净 pass：
//     Only 3 minutes left, act now!
//     Only 2 days left to claim your reward
//     Sale ends in 3 hours
//     This deal expires in 24 hours
//     2 items left in stock
//     Only 10 spots left at 50% off
//     The offer closes in 10 minutes
//     Just 12 hours left to register for the webinar at this rate
//   中文侧同类句式早已覆盖（`仅剩\d+分钟`、`\d+小时后失效`）。
//
// 护栏设计（全部实测印证）：
//   新模式一律要求「营销主体语义」或「零售库存语义」共现。良性时间句式
//   （会议开始/我马上到/构建耗时/作业截止/查余票/调研建议/闭馆/会话过期/
//    待读页数/航班起飞）主语不是 offer/deal/sale/stock，天然不命中。
//   ③④ 刻意排除 tickets/items：实测 `There are only 2 tickets left for the
//   6pm train`（火车余票查询）与 `Only 10 items left on your to-do list`
//   会误命中；tickets/items 只在带 offer/sale/register/stock 主体时才收。
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(HF, 'src/index.js'));
const { gate } = require(path.join(HF, 'src/gate.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { const r = fn(); if (r === true) { pass++; console.log('  ✅ ' + name); }
    else { fail++; console.log('  ❌ ' + name + ' → ' + r); } }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → 异常: ' + e.message); } }
const truthy = v => v ? true : `期望 truthy，实得 ${JSON.stringify(v)}`;
const isZero = v => v === 0 ? true : `期望 0，实得 ${v}`;

console.log('\n[EN 数字倒计时营销紧迫必须命中]');

const MUST_HIT = [
  // ① 营销主体 + 到期动词 + 时长（正/反语序）
  ['营销主体-到期-in 3 hours', 'Sale ends in 3 hours. Get it now.'],
  ['营销主体-到期-in 24 hours', 'This deal expires in 24 hours'],
  ['营销主体-closes in 10 minutes', 'The offer closes in 10 minutes'],
  ['反向语序-in 2 hours ... ends', 'In 2 hours this exclusive offer ends'],
  ['discount 主体', 'The discount ends in 6 days'],
  ['空白-复合主体', 'This promotion is ending in 30 minutes'],
  // ② (only|just) + 数字 + 时间单位 + left/remaining/to go
  ['only 3 minutes left', 'Only 3 minutes left, act now!'],
  ['only 2 days left', 'Only 2 days left to claim your reward'],
  ['just 5 hours remaining', 'Hurry! Just 5 hours remaining at this price'],
  ['only 30 minutes remaining', 'Only 30 minutes remaining to get your bonus'],
  ['just 12 hours left', 'Just 12 hours left to register for the webinar at this rate'],
  ['mins 缩写', 'Only 15 mins left to complete checkout'],
  ['to go 变体', 'Only 5 minutes to go before the price goes up'],
  // ③ 数字 + 剩余量单位（spots/slots/seats/copies/units/places）
  ['10 spots left', 'Only 10 spots left at 50% off'],
  ['3 seats left', 'Only 3 seats left for the masterclass'],
  ['20 copies left', 'Only 20 copies left of this signed edition'],
  // ④ only/just + 数字 + 剩余量单位
  ['just 5 slots left', 'Just 5 slots left in this cohort'],
  ['only 2 places left', 'There are only 2 places left in the program'],
  // ⑤ 库存紧迫（电商 in stock）
  ['2 items left in stock', '2 items left in stock'],
  ['inventory 主体', 'Our inventory has only 7 units left'],
  // ⑥ 营销主体 + 截止日
  ['offer ends tomorrow', 'This offer ends tomorrow at noon'],
  ['sale expires tonight', 'The sale expires tonight'],
  ['deal ends today', 'This deal ends today'],
];
for (const [label, text] of MUST_HIT) {
  t(label, () => truthy(idx.checkFalseUrgency(text).count > 0));
}

console.log('\n[良性时间/票务/任务句式绝不误判]');

const MUST_NOT_HIT = [
  ['会议还有10分钟', 'The meeting starts in 10 minutes.'],
  ['我马上到', "I'll be there in 5 minutes."],
  ['构建耗时', 'The build takes about 30 minutes to complete.'],
  ['作业截止', 'You have 3 days left to finish the assignment before the deadline.'],
  ['火车查余票', 'There are only 2 tickets left for the 6pm train from London to Oxford.'],
  ['调研建议时长', 'We recommend completing the survey within 15 minutes.'],
  ['图书馆闭馆', 'The library closes in 45 minutes.'],
  ['会话过期', 'Your session will expire in 60 minutes for security reasons.'],
  ['待读页数', 'Only 10 pages left to read in this chapter.'],
  ['航班起飞', 'The flight departs in 2 hours.'],
  ['门店营业时间', 'Our store opens at 9am and closes at 6pm daily.'],
  ['早鸟结束-非紧迫', 'The early-bird registration period is over; the standard rate now applies.'],
  ['待办清单', 'Only 10 items left on your to-do list.'],
  ['票已售完陈述', 'All tickets for the concert have been sold out since last week.'],
  ['项目排期', 'The release is scheduled for next Tuesday.'],
  ['会议明天开', 'The standup is tomorrow morning.'],
  ['酒店退房', 'Check-out is at 11am tomorrow.'],
  ['火车到达', 'The train arrives in about 40 minutes.'],
  ['考试时长', 'You have 90 minutes to complete the exam.'],
  ['免费试用结束', 'Your free trial has ended. You can upgrade anytime.'],
];
for (const [label, text] of MUST_NOT_HIT) {
  t(label, () => isZero(idx.checkFalseUrgency(text).count));
}

console.log('\n[中文侧不退化（原 v6.7.70 全部样本]');

const ZH_MUST_HIT = [
  '你必须马上付款，仅剩最后3分钟，错过这次机会再无可能。',
  '仅剩最后5分钟！',
  '活动还剩2小时结束',
  '名额仅剩3个',
  '优惠将在24小时后失效',
  '立刻抢购，手慢无！',
  '最后30秒',
];
for (const text of ZH_MUST_HIT) {
  t('ZH: ' + text.slice(0, 18), () => truthy(idx.checkFalseUrgency(text).count > 0));
}

const ZH_MUST_NOT_HIT = [
  '距离考试还有最后100天，制定复习计划',
  '会议还有5分钟开始，我们准备好了',
  '这个任务最后三天要完成，我安排一下进度',
  '还剩三天年假没用',
  '最后一页 PPT 需要加数据',
];
for (const text of ZH_MUST_NOT_HIT) {
  t('ZH-benign: ' + text.slice(0, 18), () => isZero(idx.checkFalseUrgency(text).count));
}

console.log('\n[gate 端到端：false_urgency 是 REWRITE_DIMS 成员]');

const GATE_REWRITE = [
  'Only 3 minutes left, act now!',
  'Sale ends in 3 hours. Get it now.',
  'Only 10 spots left at 50% off',
  '2 items left in stock',
];
for (const text of GATE_REWRITE) {
  t('gate rewrite + 归因 false_urgency: ' + text.slice(0, 32), () => {
    const g = gate(text);
    if (g.gate && g.gate.action !== 'rewrite') return `gate.action=${g.gate.action}`;
    const dims = (g.findings || []).map(f => f.dimension);
    if (!dims.includes('false_urgency')) return `findings 无 false_urgency（实得 ${dims.join(',') || '空'}）`;
    return true;
  });
}

const GATE_PASS = [
  'The meeting starts in 10 minutes.',
  'There are only 2 tickets left for the 6pm train from London to Oxford.',
  'Only 10 pages left to read in this chapter.',
  'Only 10 items left on your to-do list.',
];
for (const text of GATE_PASS) {
  t('良性句子不得因 false_urgency 改写: ' + text.slice(0, 32), () => {
    const g = gate(text);
    const dims = (g.findings || []).map(f => f.dimension);
    if (dims.includes('false_urgency')) return `误命中 false_urgency，gate=${g.gate && g.gate.action}`;
    return true;
  });
}

console.log('\n[护栏有效性对照：破坏护栏必须真的误命中]');

// 手工构造「去掉库存主体限定」版：证明⑤的 in stock 主体不是摆设
t('对照-去掉 in stock 限定会误伤待办清单', () => {
  const p = /\b(?:only\s+|just\s+)?\d+\s*(?:items?|units?|copies|pairs?|boxes?|kits?)\s+left\b/i;
  const r = 'Only 10 items left on your to-do list.';
  return truthy(p.test(r));
});
t('对照-去掉营销主体限定会误伤火车余票', () => {
  // 若③不排除 tickets（旧版），这句必然命中
  const oldP = /\b\d+\s*(?:spots?|slots?|seats?|tickets?|items?|copies)\s+left\b/i;
  return truthy(oldP.test('There are only 2 tickets left for the 6pm train.'));
});
t('对照-②的时间单位限定是护栏（无单位不命中）', () => {
  const p2 = /\b(?:only|just)\s+\d+\s*(?:minutes?|mins?|hours?|hrs?|days?|weeks?|seconds?|secs?)\s+(?:left|remaining|to go)\b/i;
  return isZero(p2.test('Only 3 spots left for the workshop') ? 1 : 0);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
