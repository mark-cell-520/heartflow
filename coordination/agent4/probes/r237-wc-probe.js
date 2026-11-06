// r237 赢家诅咒 winner's curse 专项探针 + FP 压力（agent-4）
// 判定：攻击族 gate.action==='pass' = 穿过引擎（零命中证据）；
//       疑难良性 gate.action==='pass' = 不误伤。
// 运行：node coordination/agent4/probes/r237-wc-probe.js
'use strict';
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

// 攻击族：竞标/拍卖/投标胜利 → 推断标的物价值/自己判断正确
const attacks = [
  ['WC-ZH', '竞标赢了说明这块地就值这个价，我们的判断得到了验证。'],
  ['WC-ZH', '这次中标证明我们的报价是合理的，业主认可这个成本。'],
  ['WC-ZH', '能拍下这幅画，说明它确实被低估了，我们捡了漏。'],
  ['WC-ZH', '招标排名第一，说明我们的方案性价比最高。'],
  ['WC-ZH', '竞得这块地意味着市场认可这个价格，值。'],
  ['WC-ZH', '出价最高还赢了，只能说明这东西真的好。'],
  ['WC-EN', 'We won the auction, which confirms the asset is worth what we paid.'],
  ['WC-EN', 'Winning the bid proves our price was fair and the client accepted the cost.'],
  ['WC-EN', 'We outbid everyone, so the painting was clearly undervalued—a real bargain.'],
  ['WC-EN', 'Coming out on top in the tender shows our offer had the best value.'],
];

// FP 压力：同领域疑难良性（正确推理/谦逊表述/非竞价语境/正当评价）
const benigns = [
  ['BL-ZH', '竞标成功只说明我们出价最高，不等于估值正确，还要留足安全边际。'],
  ['BL-ZH', '赢了拍卖不等于捡漏，赢家往往是最乐观的那个，要防赢家诅咒。'],
  ['BL-ZH', '中标之后先核算成本，价格是竞争出来的，不是价值算出来的。'],
  ['BL-ZH', '我们以低于评估价的价格中标，预算省下来了，按合同履约即可。'],
  ['BL-ZH', '出价前要做尽调，报价高低和资产好坏是两回事。'],
  ['BL-EN', 'Winning the auction only means we bid highest, not that the price was right.'],
  ['BL-EN', 'The winner is usually the most optimistic bidder, so we should guard against the winner’s curse.'],
  ['BL-EN', 'We won the tender at below assessment price; now we just deliver the contract.'],
];

// 边界锁：邻近既有维度领地，须保持既有行为（不被本族设计 encroach 的证据）
const boundaries = [
  ['BD-wealth', '他这么有钱，说明他的判断肯定没错。'],           // appeal_to_wealth 领地
  ['BD-conf', '我对这个项目有十足的信心，肯定能成。'],           // confidence 领地
];

function scan(rows, tag) {
  console.log(`=== ${tag} ===`);
  let pass = 0;
  for (const [id, text] of rows) {
    let action, dims;
    try {
      const r = hf.gate(text);
      action = r.gate ? r.gate.action : r.action;
      dims = (r.findings || []).map(f => f.dimension).join(',');
    } catch (e) { action = 'ERROR:' + e.message; dims = ''; }
    if (action === 'pass') pass++;
    console.log(`  ${id} [${action}]${dims ? ' 承重:' + dims : ''}  ${text.slice(0, 34)}`);
  }
  console.log(`  → ${tag}: pass=${pass}/${rows.length}`);
}
scan(attacks, '攻击族（pass=零命中）');
scan(benigns, '疑难良性（pass=不误伤）');
scan(boundaries, '边界锁（记录既有行为）');
