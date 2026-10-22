// 测试：false_urgency 倒计时补漏（v6.7.70，心虫 decision.decide 选定第二优先）
// 关键设计：区分「紧迫胁迫话术」与「正常时间安排」——
// "仅剩最后3分钟，错过再无可能" 是胁迫；"距离考试还有最后100天" 是计划。
// 因此长单位（天/周/月/年）必须与胁迫性后果共现才命中，短单位（分钟/小时）直接命中。
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(HF, 'src/index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { const r = fn(); if (r === true) { pass++; console.log('  ✅ ' + name); }
    else { fail++; console.log('  ❌ ' + name + ' → ' + r); } }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → 异常: ' + e.message); }
}
const truthy = v => v ? true : `期望 truthy，实得 ${JSON.stringify(v)}`;

console.log('\n[紧迫胁迫话术必须命中]');

const MUST_HIT = [
  ['实测漏判样本', '你必须马上付款，仅剩最后3分钟，错过这次机会再无可能。'],
  ['仅剩最后5分钟', '仅剩最后5分钟！'],
  ['还剩N小时结束', '活动还剩2小时结束'],
  ['名额仅剩N个', '名额仅剩3个'],
  ['错过再无优惠', '错过这次再无优惠'],
  ['立即确认订单', '请立即确认您的订单'],
  ['N小时后失效', '优惠将在24小时后失效'],
  ['立刻抢购', '立刻抢购，手慢无！'],
  ['务必尽快回复', '务必尽快回复'],
  ['最后30秒', '最后30秒'],
  ['本期仅剩N天', '本期仅剩1天'],
  ['剩下不到N分钟', '本次活动剩下不到10分钟'],
];
for (const [label, text] of MUST_HIT) {
  t(label, () => truthy(idx.checkFalseUrgency(text).count > 0));
}

console.log('\n[正常时间安排绝不误判]');

const MUST_NOT_HIT = [
  ['考试倒计时100天', '距离考试还有最后100天，制定复习计划'],
  ['会议还有5分钟', '会议还有5分钟开始，我们准备好了'],
  ['任务最后三天', '这个任务最后三天要完成，我安排一下进度'],
  ['截止日期', '项目截止日期是下周五'],
  ['最后再确认一次', '我最后再确认一次需求文档'],
  ['最后一章', '最后一章的内容需要润色'],
  ['最后一步', '最后一步是部署到生产环境'],
  ['剩下两个bug', '剩下两个 bug 没修完'],
  ['还剩三天年假', '还剩三天年假没用'],
  ['请确认方案', '请确认一下这个方案是否可行'],
  ['请确认会议时间', '请确认会议时间'],
  ['回复客户邮件', '回复客户邮件时要注意语气'],
  ['决定周末去哪', '决定周末去哪里玩'],
  ['总结讨论', '最后我们总结一下今天的讨论'],
  ['最后一页PPT', '最后一页 PPT 需要加数据'],
  ['优惠券已过期', '这个优惠券已经过期了，不能用'],
  ['文件已失效', '文件已失效，需要重新上传'],
  ['天气', '请问今天天气怎么样，我需要决定是否出门带伞'],
];
for (const [label, text] of MUST_NOT_HIT) {
  t(label, () => idx.checkFalseUrgency(text).count === 0 ? true : `误报 count=${idx.checkFalseUrgency(text).count}`);
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
