'use strict';
// r337: variant matrix for the three new no_true_scotsman families.
// Attack variants must hit the module; benign variants must not.
// Usage: node scripts/round-337/r337-matrix.js
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const ntsMod = require(path.join(ROOT, 'src', 'no-true-scotsman.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (s) => ntsMod.checkNoTrueScotsman(s).score > 0;

const ATTACK = [
  // 家族 A · 商业角色变体（中英、带修饰、长句、倒装）
  '真正的供应商从来不会坐地起价，这是行业底线。',
  '一个合格的渠道商是不会窜货的，乱价的就是行业罪人。',
  '靠谱的服务商不会拖延工期——拖进度的那种外包团队就该淘汰。',
  '讲规矩的代理商不会跨区抛货，这一点没什么可辩的。',
  'A real supplier never raises prices mid-contract, no matter what.',
  'No true vendor would ever hide its supply chain from customers.',
  'Trustworthy franchisees simply do not deviate from the manual.',
  'A dependable contractor never misses the agreed deadline, period.',
  // 家族 B · 新 authenticity 标记变体
  '靠得住的朋友绝不会在关键时刻掉链子。',
  '信得过的队友从来不会把集体成果说成自己的。',
  '入流的厂商从来不在包装上做手脚。',
  '说得过去的领导不会把锅甩给下属，他这次就是没担当。',
  'A dependable friend never lets you down when it matters most.',
  'A trustworthy employee would never leak internal documents.',
  'Stand-up colleagues do not rat out their teammates, ever.',
  // 家族 C · 经典裸否认形变体
  'No true fan leaves after one bad season.',
  'No true artist copies references, period.',
  'No real programmer uses an IDE these days.',
];

const BENIGN = [
  // 商业角色无驱逐断言
  '真正的供应商需要具备完整的资质文件。',
  '合格的渠道商应该遵守区域销售政策。',
  '靠谱的服务商会主动同步项目进度。',
  'A real supplier should certify components before shipping.',
  'Trustworthy vendors publish audit reports every year.',
  // 新标记无驱逐断言
  '靠得住的朋友会在你需要的时候出现。',
  'A dependable friend checks in during tough times.',
  // 单腿防御：无 auth 腿
  '他不会拖延工期，因为团队一向高效。',
  'No consensus exists on the cause of the anomaly.',
  // 概念转述/定义先行
  '这是无真正的苏格兰人谬误：先把「真正的供应商」立起来再开除反例',
  '先定义「靠谱的服务商」指什么，再讨论他算不算',
];

let aOk = 0, bOk = 0;
for (const s of ATTACK) {
  const ok = hit(s);
  const r = gate.checkOutput(s);
  const dims = (r.findings || []).map((f) => f.dimension);
  const g = r.gate.action !== 'pass' && dims.includes('no_true_scotsman');
  if (ok) aOk++;
  if (g) aOk++;
  console.log(JSON.stringify({ mod: ok, gate: g, text: s.slice(0, 42) }));
}
for (const s of BENIGN) {
  const ok = !hit(s);
  if (ok) bOk++;
  console.log(JSON.stringify({ clean: ok, text: s.slice(0, 42) }));
}
console.log('ATTACK module+gate: ' + aOk + '/' + (ATTACK.length * 2));
console.log('BENIGN clean: ' + bOk + '/' + BENIGN.length);
process.exit(aOk === ATTACK.length * 2 && bOk === BENIGN.length ? 0 : 1);
