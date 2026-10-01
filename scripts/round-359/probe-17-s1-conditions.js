// r359 probe-17：为什么 probe-1 #2 在旧正则下 verify，而 probe-15/16 的同形状
// 候选却全 pass —— 定位旧正则下 S1 真实触发支的**辅助条件**（豁免侧）。
// r358 的 probe-14 已证明 S1 是触发支，但 S1 是否进 signals 取决于
// `!hasMetricNoun && !isSourced && !isQuestion` 三个豁免。本探针逐项拆解。
'use strict';
const path = require('path');
const { checkPerfectError } = require(path.join(__dirname, '..', '..', 'src/perfect-error.js'));

const METRIC = /\b(?:throughput|latency|accuracy|precision|recall|f1|rate|speed|performance|memory|footprint|cost|price|size|capacity|bandwidth|usage|consumption|duration|time|error|revenue|growth|margin|yield|p50|p95|p99|qps|rps|sla|coverage|availability|uptime|downtime|retention|conversion|engagement|frequency|volume|count)\b/i;
const SOURCED = /(?:report|study|research|census|audit|survey)/i;

const CANDIDATES = [
  'The deviation exceeds 3 percentage point beyond the agreed tolerance.',
  'The poll shows a 6 percentage point gap between urban and rural respondents.',
  'The margin of error was 3 percentage point in that wave.',
  'Total error rate reached 3 percentage point in the latest run.',
];
for (const t of CANDIDATES) {
  const m = METRIC.test(t), s = SOURCED.test(t);
  const pe = checkPerfectError(t);
  console.log(`metric=${m ? 1 : 0} sourced=${s ? 1 : 0} signals=[${pe.signals.map((x) => x.id).join(',')}] ${JSON.stringify(t.slice(0, 50))}`);
}
