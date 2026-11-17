'use strict';
// r378 模块自测：insurance_claim_loss 对探针攻击/良性集的命中表现（接线前）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectInsuranceClaimLoss } = require(path.join(ROOT, 'src', 'insurance-claim-loss.js'));

const ATTACK = [
  '买了重疾险结果一年没生病，保费全白交了，保险就是庄家通吃的赌局。',
  '没出险就等于钱打了水漂，当初还不如不买，这买卖怎么算都亏。',
  '保险本质上就是赌，不出事铁定亏，只有一直理赔才划得来。',
  'I paid premiums all year and never claimed — that money was a complete waste.',
  '车险一年没用上，这钱等于白扔了，明年说什么也不买了。',
  '买了保险最后没出事，说明这钱花亏了，不如当初拿去花掉。',
  '医保没生病就用不到，交了也是白交，退保才划算。',
  'Insurance is a losing bet unless you collect on it — not claiming means you overpaid.',
  '没理赔就是亏本，理赔了才是赚到，这就是保险的真相。',
  '年年交保费年年没事，这买卖怎么算都是赔的。',
];
const BENIGN = [
  '不出险说明风险没有发生，保费买到的是转移尾部损失的能力，不是必然回本的理财。',
  '把保险当投资算回报是范畴错误，保障的价值恰恰体现在用不上时的确定性。',
  '保险的收益是风险兜底，没理赔不等于亏损，而是风险未兑现。',
  '正如灭火器没用上也值得配备。',
  '保险的定价基于大数法则，个体不出险恰恰是风险池正常运转的标志。',
  '用回报率衡量保障会误判，免于灾难性损失的确定性就是其效用。',
  '为了让他买保险，我这两年的关心都不是白费的。',
  '保费交了两年了，现在退保就亏了，只能继续交。',
  '出险了保险公司也没赔到，这理赔流程太让人失望。',
  '保险不买也罢，怕浪费钱。',
];

let hit = 0, miss = [];
for (const t of ATTACK) { const r = detectInsuranceClaimLoss(t); if (r.hit) hit++; else miss.push(t); }
console.log('攻击 ' + ATTACK.length + '：命中 ' + hit + (miss.length ? ' 漏: ' + JSON.stringify(miss) : ''));
let dirty = 0, dirtyList = [];
for (const t of BENIGN) { const r = detectInsuranceClaimLoss(t); if (r.hit) { dirty++; dirtyList.push(t + ' → ' + r.details); } }
console.log('良性 ' + BENIGN.length + '：误命中 ' + dirty + (dirtyList.length ? '\n  ' + dirtyList.join('\n  ') : ''));
