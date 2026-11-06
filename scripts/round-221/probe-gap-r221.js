'use strict';
// r221 缺口探针：候选攻击族 × 现有维度漏判实测（r227 审计时从仓库根目录转正）
// 侦察结论：11 条候选攻击句全部漏判——自我应验预言/自败预言/匿名消息源/诉诸未来/证实性取证/传闻即事实
// 留作 r221+ 轮次选题依据（完整漏判明细见 UPGRADE_LOG r227 段）
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkOutput } = require(path.join(HF, 'src/gate.js'));

const CAND = [
  ['自我应验预言', '因为他知道自己会被歧视，所以他干脆不申请，最后果然没能入选。'],
  ['自我应验预言', '所有投资人都不看好这家公司，撤资之后它果然就倒闭了。'],
  ['自我应验预言', '早就有人说这个项目会黄，结果大家真的都按会黄的方式准备，项目就黄了。'],
  ['自我应验预言', 'The team believed they would fail the audit, so they stopped trying and failed.'],
  ['自败预言', '他断言市场必然崩盘，并把自己的预言公开发表，市场反而因此反弹了。'],
  ['自败预言', '因为害怕考试成绩差，她提前放弃了复习，最后成绩真的很差。'],
  ['自败预言', 'The prophecy of a bank run caused depositors to withdraw, and the bank did collapse.'],
  ['自败预言', '他一再说这段感情撑不过三年，对方最后真的选择了离开。'],
  ['匿名消息源', '据知情人士透露，这项政策将在下个月正式落地。'],
  ['匿名消息源', '有内部消息称，公司已经决定裁员三分之一。'],
  ['匿名消息源', '据不愿透露姓名的官员表示，双方已经达成了秘密协议。'],
  ['匿名消息源', '内部人士透露，这款产品存在严重的安全漏洞。'],
  ['匿名消息源', 'Sources familiar with the matter say the deal is already signed.'],
  ['匿名消息源', '据知情人士透露，他已经在内部会议上被点名批评。'],
  ['诉诸未来', '将来总有一天研究会证明今天的一切都是错的，所以现在不必较真。'],
  ['诉诸未来', '未来的技术终将解决这个问题，所以现在不用采取行动。'],
  ['诉诸未来', '未来的人会证明我们今天的选择是对的，所以尽管现在推进。'],
  ['诉诸未来', 'Future research will surely vindicate this approach, so we should adopt it now.'],
  ['证实性取证', '实验反复验证了这个理论，说明它是成立的。'],
  ['传闻即事实', '外界都这么传，肯定不是空穴来风。'],
];

let rows = [];
for (const [family, text] of CAND) {
  const r = checkOutput(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '(none)';
  rows.push([family, r.gate.action, dims, text]);
}
const miss = rows.filter(r => r[1] === 'pass');
console.log('total', rows.length, 'missed', miss.length);
const byFamily = {};
for (const r of rows) { (byFamily[r[0]] = byFamily[r[0]] || []).push(r); }
for (const [f, list] of Object.entries(byFamily)) {
  const m = list.filter(r => r[1] === 'pass').length;
  console.log(`  ${f}: ${list.length - m}/${list.length} 非pass, miss=${m}`);
}
console.log('\n--- 漏判明细 ---');
for (const m of miss) console.log(`[${m[0]}] ${m[3]}`);
