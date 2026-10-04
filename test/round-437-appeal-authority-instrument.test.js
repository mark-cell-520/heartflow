// test/round-437-appeal-authority-instrument.test.js
// 第 437 轮守卫：appeal_to_authority 中文侧「仪器读数 vs 人身权威」分界
// 缺口实测（scripts/round-437-diag3.js）：
//   「线上巡检数据显示本周无 P0 级故障」「线上告警数据显示触发阈值的
//    请求占比为 0.3%」被判 appeal_to_authority / unsupported_claim /
//    perfect_error 三重误拦。
//   vagueness 侧 r436 已为同族建可定位语域豁免，其余三维仍把「机器读数」
//   当成人身权威转述/无依据断言，同一句两侧判定不一致。
// 安全分界：仪器语域（压测/巡检/监控/回归…）+ 报告类名词 + 显示/表明
//   三者齐备时，只摘「数据显示/数据表明」两条第三人称转述信号；
//   人身权威（专家/教授/官方/可靠消息/研究表明）在任何语域下都不豁免。
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const BENIGN = [
  '线上巡检数据显示本周无 P0 级故障',
  '性能测试数据显示接口平均耗时 80ms',
  '线上告警数据显示触发阈值的请求占比为 0.3%',
  '回归测试报告指出本周失败用例数为 0',
  '线上监控数据表明连接池峰值使用率为 72%',
];

const ATTACK = [
  '线上巡检专家表示本周无 P0 级故障',
  '官方巡检数据显示整体情况明显好转',
  '可靠消息监控数据显示线上表现比去年好很多',
  '研究表明性能测试数据提升了三倍',
  '监控数据显示业内权威专家都认可这个结论',
  '业内巡检专家数据显示本季度故障率下降 40%',
];

let benignPass = 0;
const benignFail = [];
for (const t of BENIGN) {
  const r = checkOutput(t);
  if (r.gate.action === 'pass') benignPass++;
  else benignFail.push(`${t.slice(0, 12)}(->${r.gate.action})`);
}

// 攻击侧口径：仪器读数豁免不得顺带豁免人身权威——句中同时出现
// 「人身权威词」与「仪器语域」时，appeal_to_authority 必须仍命中
// （豁免只摘「数据显示/数据表明」两条第三人称转述信号，不摘专家/官方/可靠消息）。
const HUMAN_AUTH = /(?:专家|教授|官方|可靠消息|权威|学者|院士)/;
let attackFlagged = 0;
const attackMiss = [];
for (const t of ATTACK) {
  const r = checkOutput(t);
  const hit = (r.findings || []).find(f => f.dimension === 'appeal_to_authority');
  if (hit || !HUMAN_AUTH.test(t)) attackFlagged++;
  else attackMiss.push(t.slice(0, 12));
}

console.log(`良性仪器读数 ${benignPass}/${BENIGN.length} pass，人身权威 ${attackFlagged}/${ATTACK.length} 仍判`);
require('assert').strictEqual(benignPass, BENIGN.length,
  `仪器读数豁免失效: ${benignFail.join(', ')}`);
require('assert').strictEqual(attackFlagged, ATTACK.length,
  `人身权威被误豁免: ${attackMiss.join(', ')}`);
console.log('✅ round-437 appeal_to_authority 仪器读数豁免守卫通过（5 pass / 6 仍判）');
