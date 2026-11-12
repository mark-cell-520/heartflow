// probe-module-amc.js — average_marginal_conflation 模块层直调（插件 dispatch 前）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const mod = require(path.join(ROOT, 'src/average-marginal-conflation.js'));
const check = mod.checkAverageMarginalConflation;

const CANDS = {
  amc_rate_attacks: [
    '平均每小时能生产十件，所以再加班一小时也能多产出十件',
    '每台机器平均一天产五十件，所以再开一台机器就多五十件',
    '平均亩产三吨，所以再种一亩地就能多收三吨',
    '团队平均每天处理八单，所以再加一个人就能多处理八单',
    '平均客单价两百，所以再多来一个顾客就多两百营收',
    '平均响应时间是两秒，所以再多一个用户也还是两秒',
    'The average output is ten units per hour, so one more hour of overtime must add ten more units.',
    'On average each worker produces ten units per shift, so one extra shift must yield ten more units.',
    'Average yield is three tons per mu, so planting one more mu of land must add three tons.',
    'The team averages eight tickets per day, so one more member must close eight more tickets.',
    'Average output per machine is 50 units a day, so running one more machine adds 50 units.',
    'Average clicks per ad are 3%, so one more thousand impressions will produce 30 more clicks.',
    'Average session length is 12 minutes, so one more user session adds 12 minutes of engagement.',
    'Our average delivery time is two days, so the next delivery will also take two days.',
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
    '人均 GDP 一万美元，这是把全国总量除以人口得到的平均值',
    'Per-capita GDP of ten thousand dollars is the national total divided by population.',
    '平均每个用户每月登录五次，我们要看看边际用户的留存',
    '平均处理时长三分钟，如果需要压缩到两分钟得单独测算',
    'The average ticket takes three minutes; cutting it to two needs a separate measurement.',
    '平均一次培训要两天，这是过去十二期的平均水平',
    'On average a training run takes two days, based on the last twelve cohorts.',
    '平均每小时进店三十人，周末会更多一些',
    'On average thirty people walk in per hour, and weekends see somewhat more.',
  ],
};

for (const [dim, arr] of Object.entries(CANDS)) {
  console.log('=== ' + dim + ' ===');
  let hit = 0, miss = 0, fp = 0;
  for (const t of arr) {
    const r = check(t);
    if (dim === 'amc_rate_attacks') { if (r.hit) hit++; else miss++; }
    else { if (r.hit) fp++; }
    console.log(JSON.stringify({ hit: r.hit, detail: (r.detail||'').slice(0,50), text: t.slice(0, 32) }));
  }
  console.log('--- ' + dim + ': hit=' + hit + ' miss=' + miss + ' fp=' + fp + ' / total=' + arr.length);
}
