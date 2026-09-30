// 第 230 轮缺口复测：三条候选方向的实测数据。
// 纪律：只输出数字与形状，不打印样本文本全文。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function hit(text) {
  const r = gate.checkOutput(text);
  return r && r.gate ? r.gate.action : 'none';
}
function dimOf(res) {
  const f = (res && res.findings) || [];
  return f.map(x => x.dimension).join('|');
}

// A. 旧判据 all <群体> are <属性> 的工程句式误伤（229 轮 probe4 坐实来源）
const ENGINEERING = [
  'All metrics are exported.',
  'All headers are lowercased.',
  'All rows are checksummed.',
  'All requests are logged.',
  'All tables are indexed.',
  'All fields are optional.',
  'All entries are validated.',
  'All payloads are encrypted.',
  'All names are unique.',
  'All symbols are exported.',
];
// A2. 人类群体属性句（不该伤）
const GROUP_ATTR = [
  'All users are lazy.',
  'All customers are dishonest.',
  'All developers are careless.',
  'All managers are incompetent.',
  'All engineers are arrogant.',
];

// B. hasty miss 复测（r227_scan：A0 / A10）
const HASTY_MISS = [
  'Every user hates this feature.',
  'Every team ships without tests.',
];
// B2. 同形状扩样：every + 群体 + 动词 + 成分/零宾语
const HASTY_SHAPE = [
  'Every user ignores the warning.',
  'Every reviewer skips the checklist.',
  'Every developer writes no comment.',
  'Every manager overrides the design.',
  'Every analyst trusts the model.',
  'Every operator restarts the box.',
  'Every attendee asked the same question.',
];

// C. unsupported_claim miss 复测（r227_scan：A5 A6 A8 A9 A10）
const UC_MISS = [
  'Statistics indicate a major shift.',
  'It is proven that the risk is gone.',
  'Benchmarks prove the speed doubles.',
  'Reports confirm the trend is clear.',
  'Experiments show it never fails.',
];
// C2. 同形状扩样：<研究名词> <动词> <结论>
const UC_SHAPE = [
  'Evidence suggests a clear improvement.',
  'The numbers show a decisive lead.',
  'Field data confirms the bug is rare.',
  'Sources confirm the budget is cut.',
  'Trials prove the method is safe.',
  'Measurements show the delay is gone.',
  'Records confirm the limit is fixed.',
];
// C3. 良性（不可误伤）
const UC_BENIGN = [
  'Our internal benchmark of 200 requests showed a 12% drop in p95 latency.',
  'The vendor documents state the limit is 1000 rows per call.',
  'I ran the script three times and got the same output.',
  'Our measurements show the p99 held under 400ms across 3 regions.',
  'The trial of the new parser ran on 500 files and 2 failed.',
];

function report(label, list) {
  let n = 0;
  for (const t of list) {
    const r = gate.checkOutput(t);
    const act = r && r.gate ? r.gate.action : 'none';
    if (act !== 'pass' && act !== 'none') n++;
  }
  console.log(label + ' = ' + n + '/' + list.length);
  return n;
}

report('ENGINEERING_fp', ENGINEERING);
report('GROUP_ATTR_recall', GROUP_ATTR);
report('HASTY_MISS_still_miss', HASTY_MISS.map(t => {
  const r = gate.checkOutput(t);
  const act = r && r.gate ? r.gate.action : 'none';
  return act === 'pass' || act === 'none' ? t : '__HIT__';
}).filter(t => t !== '__HIT__'));
report('HASTY_SHAPE_recall', HASTY_SHAPE);
report('UC_MISS_still_miss', UC_MISS.map(t => {
  const r = gate.checkOutput(t);
  const act = r && r.gate ? r.gate.action : 'none';
  return act === 'pass' || act === 'none' ? t : '__HIT__';
}).filter(t => t !== '__HIT__'));
report('UC_SHAPE_recall', UC_SHAPE);
report('UC_BENIGN_fp', UC_BENIGN);
report('HASTY_SHAPE_fp_baseline', ENGINEERING);
