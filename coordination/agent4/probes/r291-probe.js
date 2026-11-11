/**
 * r291 候选族穿透预探针（当前 HEAD 6.8.171，r289 已上线）。
 * 判定穿透：gate.action === 'pass' 且 findings 为空。
 * 靶子来源：r289 交接（no_true_scotsman 4/7 剩余 / appeal_to_nature 3/5 /
 * appeal_to_ignorance 2/5 / false_dilemma 品质标签表外扩形）+ 本轮自建候选：
 *   · appeal_to_nature「非自然/人工干预即有害」反向族（JSDoc 已声明射程）
 *   · appeal_to_nature 自然性裸存在句（这是野生的/那是土鸡）
 *   · appeal_to_ignorance 第三人称举证倒置形（没人证明他错→他无罪）
 *   · false_dilemma 品质标签表外扩（不懂事/不合群/不够朋友）
 *   · no_true_scotsman HEDGE_RE「不可能」假豁免穿透
 */
'use strict';
const hf = require('../../../src/gate.js');

const ATTACK = {
  appeal_to_nature: [
    '这种草药是纯天然的，所以比西药更安全。',
    '转基因是人为干预的，天然谷物才是人该吃的东西。',
    '这是野生的，比家养的强，天养的就是不一样。',
    'Natural skincare cannot harm your skin because it has no chemicals.',
    '野生的比养殖的有营养，这是大自然的安排。', // 对照：存量应收（r257）
    // 本轮新候选：非自然即有害反向族
    '转基因食品是人为干预的产物，长期吃必然出问题。',
    '这个成分是工业合成的，不是天然提取的，用久了一定伤身体。',
    'Conventional produce is artificially ripened, so it cannot be good for you.',
    '人工饲养的禽类生长周期被化学手段缩短，营养肯定不如跑山鸡。',
    '这酒是工业勾兑的，比不上自家粮谷酿的纯粮食酒。',
    // 本轮新候选：自然性裸存在句
    '那是山里放养的土鸡，比饲料鸡有营养。',
    '这是刚捞上来的河鱼，比冻货鲜甜。',
    // 本轮新候选：EN 反向族
    'Anything synthesized in a lab is inherently less safe than what nature made.',
  ],
  no_true_scotsman: [
    '靠谱的合作方不会在交付前一天才说做不了。',
    '死忠粉不可能只买一张票。', // HEDGE_RE 假豁免穿透验证（不可能含「可能」）
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
    '没人能证明这款补品有害，所以它是安全的。', // 对照：存量应收
    // 本轮新候选：第三人称举证倒置形
    '没人能证明他偷了东西，所以他就是清白的，你们没有理由再怀疑他。',
    '既然没人拿得出他造假的证据，那就该照他说的办。',
    'No one has proven this chemical dangerous, so it is safe to use.',
  ],
  false_dilemma: [
    // r289 后剩余穿透（表外扩品质标签）
    '不转发就是不懂事。',
    '不参加这次团建，就是不合群。',
    '连这个都不支持，你根本不够意思。',
    '要么签字，要么就是不讲义气。',
    // r289 对照（存量应被 r289 收）
    '不转这个帖子，你就是没良心。',
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
  // 本轮新良性候选（防误伤对照）
  '实验室对比了合成路径与天然提取路线的成本与纯度，数据显示合成路线更稳定。',
  '工业蒸馏与农家自榨的油在酸价指标上各有优劣，要看检测报告。',
  '这篇综述指出目前尚无定论，需要更多随机对照试验。',
  '疑罪从无是刑事诉讼的基本原则，检方需要拿出充分证据。',
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
    rows.push({ dim, text: t.slice(0, 30), action, findings: findings.join(',') });
  }
  console.log('PENETRATE ' + dim + ': ' + p + '/' + arr.length);
}
let fp = 0;
for (const t of BENIGN) {
  const r = hf.gate(t);
  const action = r.gate.action;
  const findings = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
  if (action !== 'pass' || findings.length > 0) {
    fp++;
    console.log('FP ' + action + ' ' + t.slice(0, 30) + ' | [' + findings.join(',') + ']');
  }
}
console.log('TOTAL penetrate ' + penetrateTotal + '/' + attackTotal);
console.log('BENIGN fp ' + fp + '/' + BENIGN.length);
console.log('--- detail ---');
for (const r of rows) console.log(JSON.stringify(r));
