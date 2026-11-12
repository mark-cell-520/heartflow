// probe-prototype2-r303.js — F-5 新族三腿原型 v2（腿②' 扩为"one more X"资源形）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const I = require(path.join(ROOT, 'src/average-marginal-conflation.js')).__internals();
const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
const fs = require('fs');

const MARG_ZH = I.MARG_ZH, INCR_ZH = I.INCR_ZH, MARG_EN = I.MARG_EN, INCR_EN = I.INCR_EN;

// ── 腿①' AVG_RATE 产量/效率/速率型平均值 ──
const AVG_RATE_ZH = [
  /平均每(?:小时|分钟|天|日|周|月|年|班|班次|秒)[^。；，]{0,14}(?:生产|产出|产|制造|加工|处理|完成|交付|下线|收|赚|卖出|签)/,
  /平均每(?:台|人|亩|个|条|辆|架|间|位|名|户|家|单|次|件)[^。；，]{0,12}(?:产|生产|产出|处理|完成|交付|收|赚|制造|加工|贡献|带来|登录|点击|购买|付费|复购)/,
  /每(?:台|条|个|辆)(?:机器|设备|产线|工人|员工|地|土地|门店|站点)[^。；，]{0,10}平均[^。；，]{0,10}(?:产|生产|产出|处理|收|下线)/,
  /平均(?:亩产|单产|产能|产量|吞吐量|处理量|产出|效能|人效|时效|工时|响应时间|处理时长|交付周期|交付时间|客单价|转化率|点击率|登录数|活跃数|复购率|进店|客流|在线人数|并发)/,
  /平均(?:每个|每位|每名|每户)?(?:用户|客户|订单|会员|买家|读者|学员|患者|工人|员工|成员|学生|农民|卖家|坐席|销售)[^。；，]{0,14}(?:生产|产出|处理|完成|交付|贡献|带来|购买|消费|点击|登录|付费|复购|签)/,
];
const AVG_RATE_EN = [
  /\baverage\s+(?:output|yield|productivity|throughput|production|volume|capacity|rate|per[- ]unit\s+output)\b/i,
  /\baverage\s+(?:response|delivery|processing|handling|turnaround|session|visit|ticket|order|cycle|lead)\s+(?:time|length)\b/i,
  /\baverages?\s+(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s+(?:units?|tickets?|orders?|items?|clicks?|visits?|sessions?|users?|customers?|deals?|requests?|impressions?|tons?|bushels?|repairs?|calls?)\s+(?:per|a|each|every)\b/i,
  /\b(?:on\s+average|per\s+(?:hour|day|week|month|shift|unit|user|customer|order|machine|acre|worker|rep|agent|server))\b[^.]{0,40}\b(?:produc\w+|yield\w*|process\w*|handl\w+|complet\w+|deliver\w+|clos\w+|serv\w+|ship\w*)\b/i,
  /\baverage\s+(?:clicks?|visits?|sessions?|logins?|signups?|orders?|purchases?|deals?|repairs?|calls?)\s+per\b/i,
];

// ── 腿②' RES 边际/增量资源参照（"one more X" 家族，新腿，不动存量 MARG/INCR）──
const RES_ZH = [
  /(?:再|又|多)(?:开|添|加|招|种|上|增|扩|铺|设|排|安排|投入|购买|采购)[一两三四五几]?(?:台|条|个|辆|架|间|位|名|户|家|亩|批|单|次|人|小时|分钟|天|单位)/,
  /(?:再|多)(?:加班|加时|增产|扩产|放量|加量|追加|加派|抽调)[一两三四五几]?(?:小时|分钟|天|人|班|次|台|条)/,
  /(?:再|又|也)多(?:一|两|几)?(?:个|台|条|辆|架|间|位|名|户|家|人|亩|批|单|次|小时|分钟|天|单位)/,
  /每多(?:一|两|几)?(?:个|台|条|位|名|户|家|人|亩|批|单|次|小时|分钟|天|单位)/,
  /(?:再|多)来(?:一|两|几)?(?:个|位|名|户|家|人|单|批)/,
  /下一(?:个|台|条|位|名|户|家|单|批|次)/,
  /(?:再|多)(?:生产|产|做|造|加工|处理|交付)[一两三四五几]?(?:件|台|个|批|单|单位)/,
];
const RES_EN = [
  /\b(?:one|1|two|2|three|3|another|an?\s+extra|an?\s+additional)\s+more\s+(?:thousand|hundred|million|[\w.,]+\s+)?(?:hour|hours|shift|day|days|week|weeks|machine|machines|server|servers|worker|workers|employee|employees|rep|reps|agent|agents|member|members|person|people|line|lines|unit|units|mu|acre|acres|batch|batches|order|orders|deal|deals|user|users|customer|customers|impression|impressions|click|clicks|request|requests|visit|visits|session|sessions|delivery|deliveries|ticket|tickets|repair|repairs|call|calls)\b/i,
  /\b(?:the|a)\s+next\s+(?:hour|shift|day|week|machine|server|worker|rep|agent|member|person|line|unit|batch|order|deal|user|customer|impression|request|visit|session|delivery|ticket|repair|call)\b/i,
  /\b(?:add|adding|hire|hiring|run|running|open|opening|plant|planting|buy|buying|deploy|deploying|bring|bringing|take|taking|schedule|scheduling)\s+(?:one|1|two|2|another|an?\s+extra|an?\s+additional)\s+(?:more\s+)?(?:hour|hours|shift|day|days|machine|machines|server|servers|worker|workers|rep|reps|member|members|person|people|line|lines|unit|units|acre|acres|batch|order|deal|user|customer|impression|request|session|delivery|ticket)\b/i,
  /\b(?:one|1)\s+extra\s+(?:hour|hours|shift|day|machine|server|worker|rep|member|person|line|unit)\b/i,
];

// ── 腿③' QTY_CONCL 边际侧数量结论 ──
const QTY_CONCL_ZH = [
  /多[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:件|台|个|批|单|吨|斤|公斤|亩|人|次|份|小时|分钟|天|单位|元|块|版|条|种|位|名|户|家|辆|架|间|秒|周|月)/,
  /[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:件|台|个|批|单|吨|斤|公斤|亩|人|次|份|小时|分钟|天|单位|秒|周|月)(?:也|还|照样|同样|一定|肯定)?(?:是|有|保持|维持|不变|照旧)/,
  /[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:次|回)(?:登录|点击|访问|下单|购买|付费|签到|活跃)/,
  /(?:也|就|还|照样|同样|一定|肯定|必然|照样)(?:能|可|会)?(?:多)?(?:产出|生产|产|制造|加工|处理|完成|交付|收|获得|带来|卖掉|签下)/,
];
const QTY_CONCL_EN = [
  /\b(?:must|will|would|should|can|could|shall)\s+(?:also\s+|still\s+|then\s+)?(?:add|yield|produce|deliver|process|handle|close|generate|contribute|bring|serve|ship|give)\s+(?:us\s+|you\s+|them\s+)?(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s*(?:more\s+)?(?:units?|tickets?|orders?|items?|clicks?|visits?|sessions?|tons?|bushels?|dollars?|yuan|hours?|minutes?|days?|deals?|requests?|repairs?|calls?|impressions?)\b/i,
  /\b(?:adds?|adding|yields?|producing|delivering|processing|handling|closing|generating|contributing|bringing|serving|shipping|giving)\s+(?:us\s+|you\s+|them\s+)?(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s*(?:more\s+)?(?:units?|tickets?|orders?|items?|clicks?|visits?|tons?|hours?|minutes?|days?|deals?|requests?|repairs?|calls?)\b/i,
  /\b[\w.,]+\s+more\s+(?:units?|tickets?|orders?|items?|clicks?|visits?|tons?|hours?|minutes?|days?|deals?|requests?|repairs?|calls?|impressions?|sessions?)\b/i,
  /\b(?:also|still|likewise|then)\s+(?:takes?|costs?|runs?|lasts?|needs?)\s+(?:about\s+|roughly\s+|around\s+)?[\w.,]+\s*(?:hours?|minutes?|days?|seconds?)\b/i,
];

const ATTACKS = [
  '平均每小时能生产十件，所以再加班一小时也能多产出十件',
  '每台机器平均一天产五十件，所以再开一台机器就多五十件',
  '平均亩产三吨，所以再种一亩地就能多收三吨',
  '团队平均每天处理八单，所以再加一个人就能多处理八单',
  '平均客单价两百，所以再多来一个顾客就多两百营收',
  '平均响应时间是两秒，所以再多一个用户也还是两秒',
  '平均每个用户每月登录五次，所以每多一个用户就多五次登录',
  '这条产线平均每分钟下线两台，说明再开一条产线就多两台',
  'The average output is ten units per hour, so one more hour of overtime must add ten more units.',
  'On average each worker produces ten units per shift, so one extra shift must yield ten more units.',
  'Average yield is three tons per mu, so planting one more mu of land must add three tons.',
  'The team averages eight tickets per day, so one more member must close eight more tickets.',
  'Average output per machine is 50 units a day, so running one more machine adds 50 units.',
  'Average clicks per ad are 3%, so one more thousand impressions will produce 30 more clicks.',
  'Average session length is 12 minutes, so one more user session adds 12 minutes of engagement.',
  'Our average delivery time is two days, so the next delivery will also take two days.',
  'On average each rep closes two deals a week, so one more rep should close two more deals.',
  'Average throughput is 40 requests per second, so one more server will handle 40 more requests.',
];

const BENIGN = [
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
  '平均每个用户每月登录五次，这是上季度的统计口径',
  'Average logins per user per month were five last quarter, according to the report.',
  '平均处理时长三分钟，如果需要压缩到两分钟得单独测算',
  'The average ticket takes three minutes; cutting it to two needs a separate measurement.',
  '平均一次培训要两天，这是过去十二期的平均水平',
  'On average a training run takes two days, based on the last twelve cohorts.',
  '平均每小时进店三十人，周末会更多一些',
  'On average thirty people walk in per hour, and weekends see somewhat more.',
  '平均产能利用率七成，产能瓶颈在注塑工序',
  'Average capacity utilisation is 70%, and the bottleneck is the injection-moulding step.',
  '平均响应时间两秒，这是监控面板上的历史均值',
  'Average response time is two seconds, as shown on the monitoring dashboard.',
  '我们平均每天发一版，发布节奏由值班表决定',
  'We ship once a day on average; the release cadence is set by the on-call rota.',
  '平均每单运费五元，运费政策写在帮助中心',
  'Average shipping cost is five yuan per order, and the policy is documented in the help centre.',
  '新员工平均三周上手，这取决于培训体系而不是个人',
  'New hires take three weeks on average to ramp up, which depends on the training programme.',
  '平均订单金额两百元，与去年持平',
  'Average order value is 200 yuan, flat year on year.',
  '实验达到统计显著（p=0.03），效应量为 0.2 个标准差，属于小效应，需要更大样本确认。',
  '根据成本加成定价，这批货的出厂价是每件三十七块五，含原材料、人工和合理利润。',
  'The comparable sales in the neighborhood averaged around 480k, and the formal valuation came in at 495k.',
];

// 官方垂直良性语料
let VB = [];
try {
  const cats = vb.CATEGORIES || {};
  for (const k of Object.keys(cats)) {
    const list = cats[k];
    if (Array.isArray(list)) for (const t of list) if (typeof t === 'string') VB.push(t);
  }
} catch (_) {}
console.log('vertical-benign corpus size =', VB.length);

function anyHit(list, text) { for (const re of list) { if (re.test(text)) return true; } return false; }
function isZh(t) { return /[\u4e00-\u9fff]/.test(t); }

let ok = 0;
for (const t of ATTACKS) {
  const zh = isZh(t);
  const l1 = anyHit(zh ? AVG_RATE_ZH : AVG_RATE_EN, t);
  const l2 = anyHit(zh ? RES_ZH.concat(MARG_ZH, INCR_ZH) : RES_EN.concat(MARG_EN, INCR_EN), t);
  const l3 = anyHit(zh ? QTY_CONCL_ZH : QTY_CONCL_EN, t);
  if (l1 && l2 && l3) ok++;
  console.log(JSON.stringify({ l1, l2, l3, all: l1 && l2 && l3, text: t.slice(0, 42) }));
}
console.log('--- ATTACKS all3 = ' + ok + '/' + ATTACKS.length);

let fp = 0, fpVB = 0;
for (const t of BENIGN) {
  const zh = isZh(t);
  const l1 = anyHit(zh ? AVG_RATE_ZH : AVG_RATE_EN, t);
  const l2 = anyHit(zh ? RES_ZH.concat(MARG_ZH, INCR_ZH) : RES_EN.concat(MARG_EN, INCR_EN), t);
  const l3 = anyHit(zh ? QTY_CONCL_ZH : QTY_CONCL_EN, t);
  if (l1 && l2 && l3) { fp++; console.log('FP-HAND:', t.slice(0, 60)); }
}
console.log('--- BENIGN(hand) all3 FP = ' + fp + '/' + BENIGN.length);
for (const t of VB) {
  const zh = isZh(t);
  const l1 = anyHit(zh ? AVG_RATE_ZH : AVG_RATE_EN, t);
  const l2 = anyHit(zh ? RES_ZH.concat(MARG_ZH, INCR_ZH) : RES_EN.concat(MARG_EN, INCR_EN), t);
  const l3 = anyHit(zh ? QTY_CONCL_ZH : QTY_CONCL_EN, t);
  if (l1 && l2 && l3) { fpVB++; console.log('FP-VB:', t.slice(0, 70)); }
}
console.log('--- BENIGN(vertical official) all3 FP = ' + fpVB + '/' + VB.length);
