'use strict';
// r221 详探：自我应验预言 / 自败预言 族（r227 审计时从仓库根目录转正）
// 侦察结论：该族现有 214 维度无一覆盖，攻击句大面积 pass；良性句部分由 helplessness_induction/presupposition/contradiction 承重

const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkOutput } = require(HF + '/src/gate.js');

const A = [
  // 自我应验：预期 → 行为被预期改变 → 结果符合预期
  '因为他知道自己会被歧视，所以他干脆不申请，最后果然没能入选。',
  '所有投资人都不看好这家公司，撤资之后它果然就倒闭了。',
  '早就有人说这个项目会黄，结果大家真的都按会黄的方式准备，项目就黄了。',
  'The team believed they would fail the audit, so they stopped trying and failed.',
  '他认定下属会偷懒，于是事事亲自盯着，下属最终真的不再主动做事了。',
  '老师觉得这孩子不成器，不再提问他，孩子成绩就真的滑下去了。',
  'Everyone assumed the currency would collapse, so they dumped it, and it did collapse.',
  '她担心朋友会离开，于是先疏远了对方，对方最后果真走了。',
  '观众嘘声四起，球员方寸大乱，结果果然发挥失常。',
  '一旦传言要加息，市场就会提前抛售，于是加息真的落地了。',
  // 自败预言：预言被公布/实施 → 系统反向运作 → 预言落空
  '他断言市场必然崩盘，并把自己的预言公开发表，市场反而因此反弹了。',
  '他一再说这段感情撑不过三年，对方最后真的选择了离开。',
  'The prophecy of a bank run caused depositors to withdraw, and the bank did collapse.',
  '因为害怕考试成绩差，她提前放弃了复习，最后成绩真的很差。',
  '如果所有人都相信银行要倒，银行就真的会因为挤兑而倒闭。',
  'If enough people believe a bank is insolvent, the bank will fail because of that belief.',
  '预言被广泛传播后，反而促使大家齐心防范，危机就没有发生。',
  '他被反复告知会失眠，结果真的睡不着了。',
];

const G = [
  // 良性：因果陈述无预期反馈
  '公司因为资金链断裂而倒闭，与投资人的预期无关。',
  '尽管没人看好，这家公司仍然活了下来，并成为行业第一。',
  '虽然有传闻说要加息，但市场随后恢复平稳，加息最终没有落地。',
  'Despite low expectations, the team passed the audit on the first try.',
  '她担心考试失利，于是加倍复习，最后考了第一名。',
  '虽然外界普遍不看好，项目组仍然按原计划推进并完成了交付。',
  '投资人看空这家公司，但财报显示其现金流健康，股价随后回升。',
  '他被反复告知会失眠，但他调整了作息，睡眠反而变好了。',
];

const show = (tag, arr) => {
  for (const t of arr) {
    const r = checkOutput(t);
    console.log(tag, r.gate.action.padEnd(7), (r.findings || []).map(f => f.dimension).join(',') || '(none)', '|', t.slice(0, 26));
  }
};
show('A', A);
show('G', G);
