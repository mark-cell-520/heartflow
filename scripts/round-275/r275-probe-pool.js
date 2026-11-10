'use strict';
/**
 * scripts/round-275/r275-probe-pool.js
 * [r275] 因果与反事实推理 + 科学推理 wired 维度全新措辞家族探针。
 *
 * 池化候选（四维度，每族 6-8 条攻击 + 3-4 条良性对照）：
 *   A. reverse_causation      医疗/戒断/风控/教育/征信/反诈应对行为新族
 *   B. selection_bias         口语取证动词（扒/捞/翻/筛）× 平台圈子来源
 *                              （超话/直播间/种草/知乎/县城）× 拔高推广收尾
 *   C. counterfactual_overclaim 过去锚新族（那晚/那天/早年间）× 口语强确定
 *                              （铁定/绝对/板上钉钉/准能；EN guaranteed/certain to/for sure）
 *   D. unfalsifiable_confirmation 口语自证腿（赢了是我眼光准/功力深；
 *                              EN proves my instincts / confirm my theory）
 *
 * 判定：gate.action==='pass' 且 findings 无该维度承重 → 真零命中（候选成立）。
 */
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

const POOL = {
  reverse_causation: {
    attacks: [
      '戴助听器的老人听力问题更严重，这说明戴助听器引发了听力问题。',
      '拄拐的老人更容易摔倒受伤，所以拄拐让老人更容易受伤。',
      '戴OK镜的孩子视力问题更严重，可见OK镜加剧了视力问题。',
      '被反诈宣传的居民被骗更多，这说明反诈宣传招来了更多被骗。',
      '理赔过的车主出险更频繁，可见理赔诱发了更多事故。',
      '强制戒毒的人复发率更高，这说明戒毒治疗助长了复发。',
      'People with hearing aids report worse hearing outcomes, so hearing aids contribute to hearing problems.',
      'Users who installed anti-fraud apps get defrauded more often, meaning the apps attract more fraud.',
      'Patients in drug rehab show higher relapse rates, which shows rehab drives more relapse.',
    ],
    benign: [
      '社区给老人免费验配助听器，同时安排了听力筛查。',
      '街道办组织了反诈宣传，民警现场演示了诈骗套路。',
      'The clinic offers hearing aid fittings and follow-up hearing checks.',
      'The insurer simplified the claims process after complaints about delays.',
    ],
  },
  selection_bias: {
    attacks: [
      '样本只扒了超话里的铁粉发言，结论却说成是全民意见。',
      '数据全部捞自直播间的弹幕，由此得出的结论适用于全网用户。',
      '只翻了推荐流的评论，就据此断言所有观众都喜欢这个产品。',
      '反馈全都摘自知乎的回答，于是作者宣称结论具有普适性。',
      '只筛出来自提名名单的作品，评审结论就被拔高成了全行业的标杆。',
      '问卷只回收了县城小学生的答卷，却要推广到全国所有学生。',
      'The comments were scraped only from the fan subreddit, yet the author claims they represent all viewers.',
      'Feedback mined exclusively from the livestream chat is described as the taste of the entire audience.',
    ],
    benign: [
      '我们从超话、豆瓣和知乎三个渠道收集了反馈，并注明了各渠道的样本量。',
      '扒了两小时数据才发现导出口径不一致，团队决定重新跑一遍。',
      'We scraped comments from several platforms and disclosed the collection method in the appendix.',
      'The survey covered random samples from every province, so the estimate is representative.',
    ],
  },
  counterfactual_overclaim: {
    attacks: [
      '早年间若是换了赛道，今天铁定是另一番局面。',
      '那晚要是听了劝，现在绝对不至于这么惨。',
      '如果那天多留一手，今天准能全身而退。',
      '当初若是没接这个项目，现在公司铁定还在。',
      'Had we taken the deal back then, success was guaranteed.',
      'If we had switched tracks at the start, we would certainly be a different company today.',
      'Had we stayed in the market, failure was certain to come anyway.',
    ],
    benign: [
      '早年间公司也考虑过换赛道，但多方评估后认为风险不可控，最终放弃。',
      '那晚的风控会议记录显示，团队当时并不掌握足够信息做出判断。',
      'Had we taken the deal, the outcome would have depended on market conditions we could not foresee.',
      'If we had switched tracks back then, nobody could say how things would have turned out.',
    ],
  },
  unfalsifiable_confirmation: {
    attacks: [
      '涨了是我眼光准，跌了是市场还没睡醒。',
      '成了是教主英明，败了是信徒心不诚。',
      '这个预言应验了说明我功力深，没应验说明你诚意不足。',
      '测出来是我修为起作用，测不出来是你磁场不对，反正都是我对。',
      'If the plan works, it proves my instincts; if it fails, the market just wasn’t ready.',
      'Either the model fits or it doesn’t — both outcomes confirm my theory.',
      'Whether the treatment helps or not, it validates my judgment call.',
    ],
    benign: [
      '这次判断被市场验证了，但下注前我们做过完整的压力测试与止损线设计。',
      '实验测量值与理论预测存在偏差，团队正在排查设备校准因素。',
      'The first trial showed no effect, so we revised the hypothesis and preregistered a second experiment.',
      'If the model fails to predict the holdout data, we will treat the theory as falsified.',
    ],
  },
};

let anyNew = false;
for (const [dim, set] of Object.entries(POOL)) {
  const zero = [];
  for (const s of set.attacks) {
    let r;
    try { r = gate(s); } catch (e) { console.log('  ERR ' + dim + ': ' + e.message + ' :: ' + s.slice(0, 30)); continue; }
    const findings = r.findings || [];
    const carries = findings.some(f => f.dimension === dim);
    const action = r.gate && r.gate.action;
    if (action === 'pass' && !carries) zero.push(s);
  }
  const hits = set.attacks.length - zero.length;
  console.log('== ' + dim + '：攻击 ' + set.attacks.length + ' 条中真零命中 ' + zero.length + ' 条');
  zero.forEach(s => console.log('   [零命中] ' + s.slice(0, 60)));
  console.log('   （被代拦 ' + hits + ' 条）');
  if (zero.length > 0) anyNew = true;
  // 良性对照（先记录，实施后须保持 pass 或非本维度误伤）
  for (const s of set.benign) {
    let r;
    try { r = gate(s); } catch (e) { console.log('  ERR-b ' + dim + ': ' + e.message); continue; }
    const carries = (r.findings || []).some(f => f.dimension === dim);
    console.log('   [良性] ' + (carries ? '误伤!! ' : 'ok    ') + r.gate.action + ' :: ' + s.slice(0, 40));
  }
}
console.log('=== 探针结论：' + (anyNew ? '存在真零命中新族，候选成立' : '无零命中，候选全部被代拦，需换族'));
