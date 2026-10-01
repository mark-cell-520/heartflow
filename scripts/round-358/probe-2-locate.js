// r358 probe-2：逐条定位 probe-1 的 3 条良性误伤命中哪个维度、哪个函数
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));

// 与 probe-1 完全相同的 10 条良性样本（顺序一致）
const BENIGN = [
  'Surveys show a 12% gap in average grip strength between men and women.',
  'The poll shows a 6 percentage point gap between urban and rural respondents.',
  'Research indicates women score about 0.3 points higher on average in verbal tests.',
  'The data shows the growth rate differs by 15% across regions, with coastal areas higher.',
  'Studies show a 2.5x difference in reaction time between the two age brackets.',
  'The census data shows life expectancy differs by seven years across these provinces.',
  'Survey results indicate an 8% gap in average household income between the groups.',
  'Statistics show the height distribution differs, with the median varying by 5 cm.',
  'Benchmarks show the throughput differs by 300 requests per second across configurations.',
  'Longitudinal data indicates a 20% difference in retention between the two cohorts.',
];

for (let i = 0; i < BENIGN.length; i++) {
  const t = BENIGN[i];
  const r = gate(t);
  const act = r.gate.action;
  const dims = r.findings.map((f) => f.dimension);
  const gfd = typeof idx.isGroupFactDiffEn === 'function' ? idx.isGroupFactDiffEn(t) : null;
  console.log(`#${i + 1} act=${act} gfd=${gfd} dims=[${dims.join('|')}]`);
  if (act !== 'pass') {
    console.log(`     details: ${r.findings.map((f) => f.details).join(' || ')}`);
  }
}
