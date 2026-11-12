// probe-amc-r303.js — average_marginal_conflation 平均≠边际 候选缺口深探
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));

const CANDS = {
  amc_en_avg_output: [
    'The average output is ten units per hour, so one more hour of overtime must add ten more units.',
    'On average each worker produces ten units per shift, so one extra shift must yield ten more units.',
    'Average yield is three tons per mu, so planting one more mu of land must add three tons.',
    'The team averages eight tickets per day, so one more member must close eight more tickets.',
    'Average output per machine is 50 units a day, so running one more machine adds 50 units.',
  ],
  amc_en_avg_noncost: [
    'Our average delivery time is two days, so the next delivery will also take two days.',
    'The average order is worth 200 yuan, so the next customer will spend 200 yuan.',
    'Average session length is 12 minutes, so one more user session will add 12 minutes of engagement.',
    'Average clicks per ad are 3%, so one more thousand impressions will produce 30 more clicks.',
  ],
  amc_zh_avg_output: [
    '平均每小时能生产十件，所以再加班一小时也能多产出十件',
    '每台机器平均一天产五十件，所以再开一台机器就多五十件',
    '团队平均每天处理八单，所以再加一个人就能多处理八单',
    '平均亩产三吨，所以再种一亩地就能多收三吨',
    '平均客单价两百，所以再多来一个顾客就多两百营收',
  ],
  amc_benign: [
    '平均成本是每件十二元，我们需要重新核算边际成本再决定是否增产',
    'On average each unit costs twelve dollars; we need to check the marginal cost before expanding.',
    '平均每小时产出十件，这个数字只反映历史水平',
    'Average output is ten units per hour, which only reflects historical performance.',
    '教材里讲过，平均值不能直接推断边际值',
    'The textbook explains that an average cannot be used to infer the marginal value.',
    '平均亩产三吨可能偏高，也许再种一亩达不到这个数',
    'Average yield of three tons per mu may be optimistic; one more mu might not reach it.',
  ],
};

for (const [dim, arr] of Object.entries(CANDS)) {
  console.log('=== ' + dim + ' ===');
  for (const t of arr) {
    let r;
    try { r = hf.gate(t); } catch (e) { console.log(JSON.stringify({text: t.slice(0,40), err: String(e).slice(0,80)})); continue; }
    const fs = (r.findings || []).map(f => f.dimension);
    console.log(JSON.stringify({ text: t.slice(0, 34), action: r.gate && r.gate.action, findings: fs }));
  }
}
