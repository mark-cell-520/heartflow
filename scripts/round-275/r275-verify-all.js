'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const CASES = [
  // [dim, text, expectHit]
  ['reverse_causation', '戴OK镜的孩子视力问题更严重，可见OK镜加剧了视力问题。', true],
  ['reverse_causation', '理赔过的车主出险更频繁，可见理赔诱发了更多事故。', true],
  ['reverse_causation', '戴助听器的老人听力问题更严重，这说明戴助听器引发了听力问题。', true],
  ['reverse_causation', '拄拐的老人更容易摔倒受伤，所以拄拐让老人更容易受伤。', true],
  ['reverse_causation', '被反诈宣传的居民被骗更多，这说明反诈宣传招来了更多被骗。', true],
  ['reverse_causation', '强制戒毒的人复发率更高，这说明戒毒治疗助长了复发。', true],
  ['reverse_causation', 'People with hearing aids report worse hearing outcomes, so hearing aids contribute to hearing problems.', true],
  ['reverse_causation', 'Users who installed anti-fraud apps get defrauded more often, meaning the apps attract more fraud.', true],
  ['reverse_causation', 'Patients in drug rehab show higher relapse rates, which shows rehab drives more relapse.', true],
  ['selection_bias', '样本只扒了超话里的铁粉发言，结论却说成是全民意见。', true],
  ['selection_bias', '数据全部捞自直播间的弹幕，由此得出的结论适用于全网用户。', true],
  ['selection_bias', '只翻了推荐流的评论，就据此断言所有观众都喜欢这个产品。', true],
  ['selection_bias', '反馈全都摘自知乎的回答，于是作者宣称结论具有普适性。', true],
  ['selection_bias', '只筛出来自提名名单的作品，评审结论就被拔高成了全行业的标杆。', true],
  ['selection_bias', '问卷只回收了县城小学生的答卷，却要推广到全国所有学生。', true],
  ['selection_bias', 'The comments were scraped only from the fan subreddit, yet the author claims they represent all viewers.', true],
  ['selection_bias', 'Feedback mined exclusively from the livestream chat is described as the taste of the entire audience.', true],
  ['counterfactual_overclaim', '早年间若是换了赛道，今天铁定是另一番局面。', true],
  ['counterfactual_overclaim', '那晚要是听了劝，现在铁定不至于这么惨。', true],
  ['counterfactual_overclaim', '如果那天多留一手，今天准能全身而退。', true],
  ['counterfactual_overclaim', '当初若是没接这个项目，现在公司铁定还在。', true],
  ['counterfactual_overclaim', 'Had we taken the deal back then, success was guaranteed.', true],
  ['counterfactual_overclaim', 'If we had switched tracks at the start, we would certainly be a different company today.', true],
  ['counterfactual_overclaim', 'Had we stayed in the market, failure was certain to come anyway.', true],
  ['unfalsifiable_confirmation', '涨了是我眼光准，跌了是市场还没睡醒。', true],
  ['unfalsifiable_confirmation', '成了是教主英明，败了是信徒心不诚。', true],
  ['unfalsifiable_confirmation', '这个预言应验了说明我功力深，没应验说明你诚意不足。', true],
  ['unfalsifiable_confirmation', 'If the plan works, it proves my instincts; if it fails, the market just wasn’t ready.', true],
  ['unfalsifiable_confirmation', 'Either the model fits or it doesn’t — both outcomes confirm my theory.', true],
  ['unfalsifiable_confirmation', 'Whether the treatment helps or not, it validates my judgment call.', true],
];
let ok = 0, bad = 0;
for (const [dim, s, expect] of CASES) {
  const r = gate(s);
  const carries = (r.findings || []).some(f => f.dimension === dim);
  const pass = carries === expect;
  if (pass) ok++; else bad++;
  console.log((pass ? 'PASS ' : 'FAIL ') + dim + ' | ' + r.gate.action + ' | ' + s.slice(0, 46));
}
console.log('=== ' + ok + '/' + CASES.length + ' 通过, ' + bad + ' 失败');
