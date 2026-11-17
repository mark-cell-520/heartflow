'use strict';
// r378 接线自测：gate 桥 34 族 / 插件 39 族（33 econ + 6 stats）/ v1.15.0，
// 攻击句经 gate 聚合后 econ_reasoning_gate 归因 insurance_claim_loss 子族。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const gateMod = require(path.join(ROOT, 'src', 'econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

let fails = 0;
function ok(cond, msg) { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) fails++; }

ok(gateMod.FAMILIES.length === 34, 'gate 桥族表 ' + gateMod.FAMILIES.length + ' ≠ 34');
ok(plugin.FAMILIES.length === 39, '插件族表 ' + plugin.FAMILIES.length + ' ≠ 39');
ok(plugin.FAMILIES.filter(f => f.group === 'econ').length === 33, 'econ 族 ' + plugin.FAMILIES.filter(f => f.group === 'econ').length + ' ≠ 33');
ok(plugin.version === '1.15.0', '插件 version ' + plugin.version + ' ≠ 1.15.0');
ok(new Set(plugin.FAMILIES.map(f => f.key)).size === plugin.FAMILIES.length, '族键有重复');

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
let gateHit = 0;
for (const t of ATTACK) {
  const r = gcheck(t);
  const action = r.gate ? r.gate.action : r.action;
  const g = gateMod.checkEconReasoningGate(t);
  const sub = g.families ? g.families.map(x => x.key) : [];
  const good = action !== 'pass' && sub.includes('insurance_claim_loss');
  if (good) gateHit++;
  else console.log('    ✗ 未达: ' + t.slice(0, 30) + ' action=' + action + ' subs=' + JSON.stringify(sub));
}
ok(gateHit === ATTACK.length, 'gate 层攻击 ' + gateHit + '/' + ATTACK.length + ' 归因本族');

let dirty = 0;
for (const t of BENIGN) {
  const r = plugin.analyze(t);
  const hit = (r.families || []).some(f => f.key === 'insurance_claim_loss');
  if (hit) { dirty++; console.log('    ✗ 良性误命中: ' + t.slice(0, 30)); }
}
ok(dirty === 0, '插件层良性误命中 ' + dirty + '/' + BENIGN.length);

console.log(fails === 0 ? '=== 接线自测全绿 ===' : '=== 接线自测有 ' + fails + ' 项失败 ===');
process.exit(fails === 0 ? 0 : 1);
