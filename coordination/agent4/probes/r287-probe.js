/**
 * r286 探针 v2 — 用 hf.gate() 取 findings 归因维度。
 * 判定穿透：gate.action === 'pass' 且 findings 为空。
 */
'use strict';
const hf = require('../../../src/gate.js');

const ATTACK = {
  false_dilemma: [
    '这事没有对错，只有立场——你不跟我们一条心，那就是对面的人。',
    '要么全力配合，要么干脆散伙，反正没有第三种可能。',
    '他不是在质疑方案，他是在否定整个团队，这两者你总得选一个信。',
    'You are either part of the solution or part of the problem.',
    '在这个节骨眼上，挺他就是挺公司，掂量着办吧。',
    '不接受这个安排，就是不想在公司干了，对吧？',
    '要么按这个流程走，要么后面出了事别来找我。',
    '他这人不是朋友就是陌生人，没有中间状态。',
  ],
  no_true_scotsman: [
    '称职的管理者从来不会让团队熬夜到两点。',
    '靠谱的合作方不会在交付前一天才说做不了。',
    '有格局的领导不会计较一单半单的得失。',
    'A real foodie would never eat at a chain restaurant.',
    '死忠粉不可能只买一张票。',
    '真心想改的人，不需要别人反复提醒。',
  ],
  appeal_to_ignorance: [
    '没人能证明这款补品有害，所以它是安全的。',
    '既然科学无法解释这种现象，那它一定超出了现有认知的范畴。',
    'No one has ever proven that ghosts do not exist, so they must be real.',
    '他拿不出不在场证据翻案，说明他当时就在现场。',
  ],
  appeal_to_nature: [
    '这种草药是纯天然的，所以比西药更安全。',
    '转基因是人为干预的，天然谷物才是人该吃的东西。',
    'It is all natural ingredients, so it cannot be bad for you.',
    '野生的比养殖的有营养，这是大自然的安排。',
  ],
  appeal_to_probability: [
    '既然大部分项目都会延期，我们这个项目也一定会延期。',
    '飞机失事的概率不是零，所以你坐这趟航班就会出事。',
    'There is a chance the market crashes this year, so it will crash.',
    '既然中奖率不是零，我一直买下去总会中。',
  ],
  conditional_transposition: [
    '只有努力才能成功，他很努力，所以他一定会成功。',
    '只有缴费才能参赛，他没参赛，说明他没缴费。',
    'Only members can enter. He entered, so he must be a member.',
    '只有review过的代码才能合并，这段代码没合并，说明它没被review过。',
  ],
};

const BENIGN = [
  '路口目前封闭了直行，只能左转或右转，这是交通管制安排。',
  '要么今天提交发布，要么等下周的窗口期，排期表已经定了。',
  '他爱读书是出了名的，一年能看一百多本，涉猎很杂。',
  '如果明天下雨，运动会就取消，通知会提前发到群里。',
  '传统节日有丰富的民俗活动，各地的具体形式不太一样。',
  '连着几周都没下雨，气象预报说下周降水概率明显上升。',
  '目前尚无研究证明这种微量元素与失眠直接相关，建议继续观察。',
  '纯天然的食材也需要彻底加热，食品安全不能只看来源。',
  '样本量只有三个，还不足以支撑任何结论，需要扩样。',
  '只有签字盖章之后合同才生效，这是流程规定，不是刁难。',
  '这个世界还有很多不公，所以我们更要把手上的事做好。',
  '新方案能覆盖九成场景，剩余一成可以后续迭代处理。',
  '体重是连续变化的，不存在某一个精确的临界点。',
  '公司的植树活动每年都办，员工参与的积极性很高。',
  '他不是在挑刺，每条意见都附了复现步骤和日志。',
  '信任是合作的基础，但合作不代表要放弃独立判断。',
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
