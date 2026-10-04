// test/round-436-bilingual-metric-quote.test.js
// 第 436 轮负例守卫：unsupported_claim / perfect_error 的可定位语域豁免（中文侧）
//
// 背景缺口（实测 scripts/round-436-recheck.js）：
//   ① normalize() 会 lowercase，中文句里的「SLA」被归一成「sla」，
//      r435 加的三条豁免正则（大小写敏感）全部失配 → 良性句仍 verify；
//   ② perfect_error 的 M435_METRIC_CTX_ZH 池缺「同比/环比/较上期」与
//      「承担/分成/责任」统计口径词，单 S1 假精确的统计报表句进 findings；
//   ③ SOURCE_ANCHOR_ZH 只认章节/表图/数据集编号，不认「压测报告」这类
//      可定位的运维读数出处。
//
// 守卫要求：7 条良性句 pass，4 条编造攻击仍 verify，删条变异变红。
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '..', 'src', 'gate.js'));

// 良性：数据可定位到可复现出处（法规/SLA/合同条款/统计报表/压测报告）
const BENIGN = [
  '可用性达到 99.95%，符合 SLA 要求',
  '同比增长 18%，环比下降 2%，整体平稳',
  '合同约定各承担 50% 的责任',
  '与上年同期相比增长 12%，较上期回落 3%',
  '据测试报告，服务可用性达到 99.95%',
  '本季度故障率下降到 0.3%，可用性 99.9%',
  '根据当地法规，这类数据需要留档三年',
];

// 攻击：无出处的编造数字（必须留在 verify）
const ATTACK = [
  '该产品销量增长了 1234%，市场反应极为热烈',
  '用户满意度达到 99.99%，几乎无人不满',
  '效率提升了 40%，成本下降 25%，收益翻倍',
  '市场份额达到 87.3%',
];

let benignPass = 0;
const benignFail = [];
for (const t of BENIGN) {
  const r = checkOutput(t);
  if (r.gate.action === 'pass') benignPass++;
  else benignFail.push(`${t.slice(0, 12)}(->${r.gate.action})`);
}

let attackVerify = 0;
const attackMiss = [];
for (const t of ATTACK) {
  const r = checkOutput(t);
  if (r.gate.action === 'verify' || r.gate.action === 'rewrite' || r.gate.action === 'block') attackVerify++;
  else attackMiss.push(t.slice(0, 12));
}

console.log(`良性 ${benignPass}/${BENIGN.length} pass，攻击 ${attackVerify}/${ATTACK.length} 被拦`);

require('assert').strictEqual(benignPass, BENIGN.length,
  `良性豁免失效: ${benignFail.join(', ')}`);
require('assert').strictEqual(attackVerify, ATTACK.length,
  `编造句漏判: ${attackMiss.join(', ')}`);
console.log('✅ round-436 双语可定位语域豁免守卫通过（7 pass / 4 verify）');
