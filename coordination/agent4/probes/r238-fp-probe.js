// r238 FP 压力 + 攻击鲁棒性二轮探针（agent-4）
// 目的：在定夺候选族之前，用高难度良性句（概念讨论/正确分析/方案句/对冲研究结论）
//       测量各候选族领地被既有维度纠缠的程度；同时补测攻击句措辞鲁棒性。
// 运行：node coordination/agent4/probes/r238-fp-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// 高难度良性：同领域正确推理形/学术讨论形/解决方案形。期望 pass。
const hardBenigns = [
  // B 公地悲剧领地
  ['B 公地悲剧', 'BB5-ZH', '公地悲剧指的是无主资源容易被过度使用，哈丁1968年提出这个概念，至今仍有争议。'],
  ['B 公地悲剧', 'BB6-ZH', '牧场公有确实诱发了过度放牧，后来实行承包到户，退化才止住。'],
  ['B 公地悲剧', 'BB7-ZH', '公共资源治理有奥斯特罗姆总结的自主治理范式，并非必然走向悲剧。'],
  ['B 公地悲剧', 'BB8-EN', 'Overfishing depleted the stock because no single fisherman had an incentive to conserve—the textbook commons problem.'],
  ['B 公地悲剧', 'BB9-EN', 'The village manages its commons through quotas and rotation, which has avoided depletion.'],
  // C 道德风险领地
  ['C 道德风险', 'BC5-ZH', '道德风险是保险市场的经典问题，通常靠免赔额和共付率来缓解。'],
  ['C 道德风险', 'BC6-ZH', '有兜底不等于会放任冒险，监管配套跟上，风险并不必然上升。'],
  ['C 道德风险', 'BC7-EN', 'Moral hazard arises when the insured cannot be perfectly monitored; deductibles are the standard answer.'],
  ['C 道德风险', 'BC8-ZH', '失业保险可能延长求职时间，不过实证研究对这个结论并不一致。'],
  ['C 道德风险', 'BC9-ZH', '银行知道自己可能被救助，所以监管才要求更高的资本充足率。'],
  // D 节俭悖论领地
  ['D 节俭悖论', 'BD4-ZH', '节俭过头会抑制消费，所以提振内需要靠增加居民收入。'],
  ['D 节俭悖论', 'BD5-ZH', '全民储蓄为工业化提供了资金积累，东亚模式早期就是这么起步的。'],
  ['D 节俭悖论', 'BD6-EN', 'Paradox of thrift: saving is prudent for each household, but if everyone does it, aggregate demand falls.'],
  ['D 节俭悖论', 'BD7-ZH', '家庭储蓄增加意味着未来消费能力增强，这是跨期资源配置。'],
  ['D 节俭悖论', 'BD8-EN', 'Higher household saving funds investment through the banking system—a standard growth channel.'],
  // E 价格即质量领地
  ['E 价格即质量', 'BE4-ZH', '一分钱一分货在信息不对称时往往是有效的经验法则。'],
  ['E 价格即质量', 'BE5-ZH', '这款贵主要是品牌溢价，不代表质量更好。'],
  ['E 价格即质量', 'BE6-EN', 'Price signals quality when search costs are high; that is the economics of signaling.'],
  // A 框架效应领地（观察者形，正确描述效应本身）
  ['A 框架效应', 'BA6-ZH', '同一个统计数据换个说法，人的选择就会变，这是营销和公共沟通里要警惕的。'],
  ['A 框架效应', 'BA7-EN', 'People choose differently when the same statistic is framed as survival versus mortality—framing works.'],
];

// 攻击鲁棒性：换措辞/加修饰/倒装/英混的同族攻击，期望 pass（零命中延续）。
const attacks2 = [
  ['B 公地悲剧', 'B7-ZH', '这片林子的野菜是大家一起采的，谁采得多谁占便宜，采秃了也是全体村民一起承受。'],
  ['B 公地悲剧', 'B8-ZH', '公共车位不收费，每位车主都想方设法长时间占着，最后谁也别想停上车。'],
  ['B 公地悲剧', 'B9-EN', 'Since the fishery is open to all, every boat that fishes harder this season profits more, and the depleted stock is everyone’s problem.'],
  ['B 公地悲剧', 'B10-EN', 'The river is a free dumping ground, so each factory that discharges more saves on treatment costs while the pollution is shared by all.'],
  ['C 道德风险', 'C7-ZH', '有了存款保险，储户就专挑利息最高、风险最大的小银行存钱，反正兑付有国家信用担保。'],
  ['C 道德风险', 'C8-ZH', '学生贷款有政府担保，学校就敢随便涨学费，学生还不上来是多年以后的社会问题。'],
  ['C 道德风险', 'C9-EN', 'With deposit insurance in place, savers chase the riskiest banks offering the highest rates—the guarantee covers them either way.'],
  ['C 道德风险', 'C10-EN', 'Once student loans are government-backed, colleges raise tuition freely; defaults become a public problem later.'],
  ['D 节俭悖论', 'D6-ZH', '节俭是美德，全民都勒紧裤腰带过日子，社会总财富就会增加。'],
  ['D 节俭悖论', 'D7-ZH', '人人都把钱攥在手里不花，市场上的钱变多了，买卖自然更兴旺。'],
  ['D 节俭悖论', 'D8-EN', 'If every family pinches pennies and holds back spending, the nation’s wealth will grow.'],
  ['E 价格即质量', 'E7-ZH', '这条项链标价九万九，价钱摆在这里，工艺和材质不需要怀疑。'],
  ['E 价格即质量', 'E8-EN', 'A $900 hourly rate speaks for itself—you cannot question the expertise at that price.'],
];

function run(rows, tag, wantPass) {
  const byFam = new Map();
  for (const [fam, id, text] of rows) {
    let action, dims;
    try {
      const r = hf.gate(text);
      action = r.gate ? r.gate.action : r.action;
      dims = (r.findings || []).map(f => f.dimension).join(',');
    } catch (e) { action = 'ERROR:' + e.message; dims = ''; }
    if (!byFam.has(fam)) byFam.set(fam, { pass: 0, other: 0, detail: [] });
    const rec = byFam.get(fam);
    if (action === 'pass') rec.pass++; else rec.other++;
    rec.detail.push(`    ${id} [${action}]${dims ? ' 承重:' + dims : ''}`);
  }
  console.log(`=== ${tag} ===`);
  for (const [fam, rec] of byFam) {
    const total = rec.pass + rec.other;
    console.log(`  ${fam}: pass=${rec.pass}/${total}${wantPass ? '  ← 被既有维度误伤数' : '  ← 零命中(穿过引擎)数'}`);
    for (const line of rec.detail) console.log(line);
  }
}

run(hardBenigns, '高难度良性（pass=正确放行）', true);
run(attacks2, '攻击鲁棒性（pass=穿过引擎=零命中延续）', false);

console.log('=== 汇总 ===');
let hp = 0; const hflag = [];
for (const [f, id, text] of hardBenigns) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action;
    if (a === 'pass') hp++; else hflag.push(`${id}[${a}]${(r.findings||[]).map(x=>x.dimension).join(',')}`);
  } catch (e) {}
}
console.log(`  高难度良性: ${hp}/${hardBenigns.length} 正确放行`);
if (hflag.length) console.log('  被既有维度代拦: ' + hflag.join(' | '));
let ap = 0;
for (const [f, id, text] of attacks2) {
  try { const r = hf.gate(text); const a = r.gate ? r.gate.action : r.action; if (a === 'pass') ap++; } catch (e) {}
}
console.log(`  攻击鲁棒性: ${ap}/${attacks2.length} 穿过引擎`);
