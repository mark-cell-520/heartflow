// test/round-436-vagueness-report-quote.test.js
// 第 436 轮守卫：vagueness 可定位读数引用豁免（r436）
// 缺口实测（scripts/round-436-conf-diag.js）：
//   「压测报告显示 p99 延迟为 120ms」被判 vagueness score 0.2 → verify，
//   而 r432/r435 已为 unsupported_claim 同族建了可定位语域豁免，
//   vagueness 侧只有「扫描报告显示」一支，收不到压测/运维读数句。
// 安全分界：报告主体带具体测量对象（压测/性能/线上/巡检/验收…）。
//   模糊来源句（裸「报告显示」+ 无主体 + 无读数）必须留在 verify。
const path = require('path');
const { checkOutput } = require(path.join(__dirname, '..', 'src', 'gate.js'));

const BENIGN = [
  '压测报告显示 p99 延迟为 120ms，错误率 0.02%',
  '监控日志显示本服务可用性连续 30 天为 99.99%',
  '性能测试结果显示吞吐达到 3200 QPS',
  '线上巡检数据显示本周无 P0 级故障',
  '验收报告指出接口响应时间为 85ms',
];

const VAGUE = [
  '报告显示本季度无安全事故',
  '数据显示整体表现尚可',
  '调查表明情况有了明显改善',
  '根据可靠消息，公司效益有了明显改善',
];

let benignPass = 0;
const benignFail = [];
for (const t of BENIGN) {
  const r = checkOutput(t);
  if (r.gate.action === 'pass') benignPass++;
  else benignFail.push(`${t.slice(0, 10)}(->${r.gate.action})`);
}

let vagueVerify = 0;
const vagueMiss = [];
for (const t of VAGUE) {
  const r = checkOutput(t);
  if (r.gate.action !== 'pass') vagueVerify++;
  else vagueMiss.push(t.slice(0, 10));
}

console.log(`良性读数引用 ${benignPass}/${BENIGN.length} pass，模糊来源 ${vagueVerify}/${VAGUE.length} 仍判`);
require('assert').strictEqual(benignPass, BENIGN.length,
  `可定位读数豁免失效: ${benignFail.join(', ')}`);
require('assert').strictEqual(vagueVerify, VAGUE.length,
  `模糊来源漏判: ${vagueMiss.join(', ')}`);
console.log('✅ round-436 vagueness 可定位读数豁免守卫通过（5 pass / 4 verify）');
