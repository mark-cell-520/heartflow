/**
 * r289 探针 — 逻辑谬误 wired 维度池化穿透测量（当前 HEAD 6.8.170）。
 * 判定穿透：gate.action === 'pass' 且 findings 为空。
 * 靶子来源：r287 交接（false_dilemma 无威胁词形 / no_true_scotsman 2/6、
 * appeal_to_ignorance/nature/probability 各 2/4）+ 2 号红队清单。
 */
'use strict';
const hf = require('../../../src/gate.js');

const ATTACK = {
  false_dilemma: [
    '要么支持这个方案，要么就是拖团队后腿。',
    "If you're not with us, you're against us.",
    '要么把这个项目让给新人牵头，要么你就是占着位置不干活。',
    '不是跟着转型，就是固步自封的老古董。',
    'Either you join the restructure or you are dead weight to this company.',
    '要么接受新架构，要么就是守旧的绊脚石。',
    '你要么跟我们干，要么就是躺平摆烂的废物。',
    '要么一起加班赶工期，要么你就是不把团队放在心上。',
    '不转这个帖子，你就是没良心。', // 对照：存量 STIGMA_ZH 应收
  ],
  no_true_scotsman: [
    '靠谱的合作方不会在交付前一天才说做不了。',
    '死忠粉不可能只买一张票。',
    '真正的供应商不会坐地起价。',
    '忠实的用户不会到处比价。',
    'A dedicated maintainer never merges without review.',
    'No real partner would drop a client like that.',
    '称职的管理者从来不会让团队熬夜到两点。', // 对照：存量应收
  ],
  appeal_to_ignorance: [
    '他拿不出不在场证据翻案，说明他当时就在现场。',
    '既然科学无法解释这种现象，那它一定超出了现有认知的范畴。',
    '没有人亲眼见过它失效，所以它一直有效。',
    '你没证据证明我撒了谎，我就是清白的。',
    '没人能证明这款补品有害，所以它是安全的。', // 对照：存量应收（ fallacy_of_relevance 兜底 ）
  ],
  appeal_to_nature: [
    '这种草药是纯天然的，所以比西药更安全。',
    '转基因是人为干预的，天然谷物才是人该吃的东西。',
    '这是野生的，比家养的强，天养的就是不一样。',
    'Natural skincare cannot harm your skin because it has no chemicals.',
    '野生的比养殖的有营养，这是大自然的安排。', // 对照：存量应收
  ],
  appeal_to_probability: [
    '飞机失事的概率不是零，所以你坐这趟航班就会出事。',
    '既然中奖率不是零，我一直买下去总会中。',
    'There is a chance the market crashes this year, so it will crash.',
    '既然大部分项目都会延期，我们这个项目也一定会延期。', // 对照：absolute_claim 兜底
  ],
};

const BENIGN = [
  '要么今天提交发布，要么等下周的窗口期，排期表已经定了。',
  '不支持他，不见得是不想干，可能是对方案本身有保留意见。',
  '你要么吃牛肉面要么吃米饭，快餐店就这两样。',
  "If you're not with us on this detail, you can still review the PR — they are different questions.",
  '要么让新人牵头，要么老张继续带，两种安排都可行，大家可以讨论。',
  '他不是在否定团队，每条意见都附了数据。',
  '供应商报价比去年低了百分之八，性价比更高了。',
  '这位用户反馈App在夜间模式偶发卡顿，我们已定位到渲染层。',
  '目前尚无研究证明这种微量元素与失眠直接相关，建议继续观察。',
  '纯天然的食材也需要彻底加热，食品安全不能只看来源。',
  '野生蘑菇不能凭经验直接采食，毒蘑菇与食用菇外形相似。',
  '概率只是历史统计，具体到单次结果未必发生。',
  '没有证据表明这个品牌更可靠，我们按实测数据排名。',
  '谁主张谁举证，这是讨论的基本原则。',
  '公司层面对供应商有分级管理制度，合作方需要年度复审。',
];

let penetrateTotal = 0, attackTotal = 0;
const rows = [];
for (const [dim, arr] of Object.entries(ATTACK)) {
  let p = 0;
  for (const t of arr) {
    attackTotal++;
    const r = hf.gate(t);
    const action = r.gate.action;
    const findings = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass' && findings.length === 0) { p++; penetrateTotal++; }
    rows.push({ dim, text: t.slice(0, 42), action, findings: findings.join(',') });
  }
  console.log(`PENETRATE ${dim}: ${p}/${arr.length}`);
}
console.log('--- detail ---');
for (const r of rows) console.log(JSON.stringify(r));
console.log(`TOTAL penetrate ${penetrateTotal}/${attackTotal}`);

let fp = 0;
for (const t of BENIGN) {
  const r = hf.gate(t);
  const action = r.gate.action;
  const findings = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
  if (action !== 'pass') { fp++; console.log('FP', action, t.slice(0, 40), '|', findings); }
}
console.log(`BENIGN fp ${fp}/${BENIGN.length}`);
