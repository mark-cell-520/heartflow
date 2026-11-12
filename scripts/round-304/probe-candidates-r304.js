// probe-candidates-r304.js — r304 候选家族零命中探针（v6.8.174 gate() 全量 findings 口径）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));

const CANDS = {
  immortal_time_bias: [
    // 非医学场景的保证生存期：健身会员/员工留存/订阅续费
    '凡是坚持来满三个月的会员，体重都明显下降了，说明这套课程确实有效',
    '只有干满两年的老员工，绩效评级明显更高，说明忠诚的员工能力更强',
    '连续订阅满一年的用户，留存率高达九成，说明我们的产品留人能力很强',
    '能熬过前六个月不卸载的用户，日均使用时长显著更长，证明产品体验好',
    'Members who attended more than ten times lost the most weight, so the program works.',
    'Employees who stayed past their second anniversary had the highest ratings, proving loyal staff are the most capable.',
    'Customers who kept their subscription for over a year were the most engaged, so our product retains people.',
    'Users who survived the first six months without uninstalling used the app far more, proving the experience is good.',
  ],
  weak_evidence_strong_claim: [
    // 新证据类型：AI 聊天机器人 / 短视频 / 直播 / 社交平台 作为不可回溯弱证据
    'ChatGPT 说这款药百分百有效，你赶紧买',
    'AI 说这个币下周肯定翻倍，我准备全仓',
    '短视频上说这家公司的股票一定翻倍，我朋友也刷到了',
    '直播间里说这款面膜保证三天见效，弹幕都在夸',
    '小红书上说这个方法一定能瘦，我亲测有效',
    'ChatGPT says this drug is guaranteed safe for everyone.',
    'The AI says this crypto will definitely 10x before December.',
    'I saw on TikTok that this stock will certainly double next week.',
    'A YouTuber said this method is guaranteed to make you lose ten jin.',
    'Everyone in the livestream says this mask works 100 percent.',
  ],
  loss_aversion: [
    '一样的东西，标价原价打八折就是比直接标八折卖得好，因为大家对省下的钱和避免的损失感受完全不同',
    '同样的罚款，说成"不交就多罚"比说成"交了有奖励"更有效，人们对损失的恐惧远大于对收益的渴望',
    'The same price framed as a discount from the original sells better than the direct price, because losses loom larger than gains.',
  ],
};

for (const [dim, arr] of Object.entries(CANDS)) {
  console.log('=== ' + dim + ' ===');
  for (const t of arr) {
    let r;
    try { r = hf.gate(t); } catch (e) { console.log(JSON.stringify({ text: t.slice(0, 40), err: String(e).slice(0, 80) })); continue; }
    const fs = (r.findings || []).map(f => f.dimension);
    console.log(JSON.stringify({ text: t.slice(0, 34), action: r.gate && r.gate.action, findings: fs }));
  }
}
