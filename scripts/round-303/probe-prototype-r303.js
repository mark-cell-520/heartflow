// probe-prototype-r303.js — F-5 新族正则原型验证（引擎未改，纯常量层）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const hf = require(path.join(ROOT, 'src/gate.js'));

// ── 原型常量（与将写入 src/average-marginal-conflation.js 的一致）──
const AVG_RATE_ZH = [
  /平均(?:每小时|每天|每月|每周|每年|每分钟|每秒|单位时间|班次|天|月|年)[^。；，]{0,12}(?:生产|产出|产|制造|加工|处理|完成|交付|制造出|做出)/,
  /平均每(?:小时|天|月|周|年|班|台|人|亩|件|个|单|次)[^。；，]{0,10}(?:产|生产|产出|处理|完成|交付|收|赚|制造|加工)/,
  /每(?:台|人|亩|条|个|辆)(?:机器|设备|产线|工人|员工|地|土地)[^。；，]{0,10}平均[^。；，]{0,8}(?:产|生产|产出|处理|收)/,
  /平均(?:亩产|单产|产能|产量|吞吐|处理量|产出|效能|人效|时效|工时|响应时间|处理时长|交付周期|进店|客流|转化|点击|登录|活跃)/,
  /平均(?:每个|每位|每名)?(?:用户|客户|订单|会员|买家|读者|学员|患者|工人|员工|成员|学生|农民|卖家)[^。；，]{0,12}(?:生产|产出|处理|完成|交付|贡献|带来|购买|消费|点击|登录|付费|复购)/,
];
const AVG_RATE_EN = [
  /\baverage\s+(?:output|yield|productivity|throughput|production|volume|capacity|rate)\b/i,
  /\baverage\s+(?:response|delivery|processing|handling|turnaround|session|visit|ticket|order|cycle)\s+(?:time|length)\b/i,
  /\baverages?\s+(?:about\s+)?[\w.]+\s+(?:units?|tickets?|orders?|items?|clicks?|visits?|sessions?|users?|customers?)\s+(?:per|a|each|every)\b/i,
  /\b(?:on\s+average|per\s+(?:hour|day|week|month|shift|unit|user|customer|order|machine|acre|worker))\b[^.]{0,30}\b(?:produc\w+|yield\w*|process\w*|handl\w+|complet\w+|deliver\w+|clos\w+)\b/i,
  /\baverage\s+(?:clicks?|visits?|sessions?|logins?|signups?|orders?|purchases?)\s+per\b/i,
];
const QTY_CONCL_ZH = [
  /(?:也|就|还|同样|一定|肯定|必然|照样)(?:能|可|会)?(?:多)?(?:产出|生产|产|制造|加工|处理|完成|交付|收|获得|带来)[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:件|台|个|批|单|吨|斤|公斤|亩|人|次|份|小时|分钟|天|单位|元|块)/,
  /多(?:产出|生产|产|处理|完成|交付|收|获得|带来)[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:件|台|个|批|单|吨|斤|公斤|亩|人|次|份|单位)/,
  /(?:也|就|还|照样|同样|一定|肯定)(?:能|可|会)?(?:是|有|保持|维持)[\u4e00-\u9fff0-9一二三四五六七八九十百千万两]*(?:件|台|个|批|单|吨|人|次|秒|分钟|小时|天)/,
];
const QTY_CONCL_EN = [
  /\b(?:must|will|would|should|can|could)\s+(?:also\s+)?(?:add|yield|produce|deliver|process|handle|close|generate|contribute|bring)\s+(?:about\s+)?[\w.,]+\s*(?:more\s+)?(?:units?|tickets?|orders?|items?|clicks?|visits?|sessions?|tons?|bushels?|dollars?|yuan|hours?|minutes?|days?)\b/i,
  /\b(?:adds?|adding|yields?|producing|delivering|processing|handling|closing|generating)\s+(?:about\s+)?[\w.,]+\s*(?:more\s+)?(?:units?|tickets?|orders?|items?|clicks?|visits?|tons?|hours?|minutes?)\b/i,
  /\b(?:also|still|likewise)\s+(?:takes?|costs?|runs?|lasts?)\s+(?:about\s+)?[\w.,]+\s*(?:hours?|minutes?|days?|seconds?)\b/i,
];

const ATTACKS = [
  ['zh1','平均每小时能生产十件，所以再加班一小时也能多产出十件'],
  ['zh2','每台机器平均一天产五十件，所以再开一台机器就多五十件'],
  ['zh3','平均亩产三吨，所以再种一亩地就能多收三吨'],
  ['zh4','团队平均每天处理八单，所以再加一个人就能多处理八单'],
  ['zh5','平均客单价两百，所以再多来一个顾客就多两百营收'],
  ['zh6','平均响应时间是两秒，所以再多一个用户也还是两秒'],
  ['zh7','平均每个用户每月登录五次，所以每多一个用户就多五次登录'],
  ['zh8','这条产线平均每分钟下线两台，说明再开一条产线就多两台'],
  ['en1','The average output is ten units per hour, so one more hour of overtime must add ten more units.'],
  ['en2','On average each worker produces ten units per shift, so one extra shift must yield ten more units.'],
  ['en3','Average yield is three tons per mu, so planting one more mu of land must add three tons.'],
  ['en4','The team averages eight tickets per day, so one more member must close eight more tickets.'],
  ['en5','Average output per machine is 50 units a day, so running one more machine adds 50 units.'],
  ['en6','Average clicks per ad are 3%, so one more thousand impressions will produce 30 more clicks.'],
  ['en7','Average session length is 12 minutes, so one more user session adds 12 minutes of engagement.'],
  ['en8','Our average delivery time is two days, so the next delivery will also take two days.'],
  ['en9','On average each rep closes two deals a week, so one more rep should close two more deals.'],
  ['en10','Average throughput is 40 requests per second, so one more server will handle 40 more requests.'],
];

const BENIGN = [
  ['b1','平均成本是每件十二元，我们需要重新核算边际成本再决定是否增产'],
  ['b2','On average each unit costs twelve dollars; we need to check the marginal cost before expanding.'],
  ['b3','平均每小时产出十件，这个数字只反映历史水平'],
  ['b4','Average output is ten units per hour, which only reflects historical performance.'],
  ['b5','教材里讲过，平均值不能直接推断边际值'],
  ['b6','The textbook explains that an average cannot be used to infer the marginal value.'],
  ['b7','平均亩产三吨可能偏高，也许再种一亩达不到这个数'],
  ['b8','Average yield of three tons per mu may be optimistic; one more mu might not reach it.'],
  ['b9','人均 GDP 一万美元，这是把全国总量除以人口得到的平均值'],
  ['b10','Per-capita GDP of ten thousand dollars is the national total divided by population.'],
  ['b11','平均每个用户每月登录五次，这是上季度的统计口径'],
  ['b12','Average logins per user per month were five last quarter, according to the report.'],
  ['b13','平均处理时长三分钟，如果需要压缩到两分钟得单独测算'],
  ['b14','The average ticket takes three minutes; cutting it to two needs a separate measurement.'],
  ['b15','平均一次培训要两天，这是过去十二期的平均水平'],
  ['b16','On average a training run takes two days, based on the last twelve cohorts.'],
  ['b17','平均每小时进店三十人，周末会更多一些'],
  ['b18','On average thirty people walk in per hour, and weekends see somewhat more.'],
  ['b19','平均产能利用率七成，产能瓶颈在注塑工序'],
  ['b20','Average capacity utilisation is 70%, and the bottleneck is the injection-moulding step.'],
  ['b21','平均响应时间两秒，这是监控面板上的历史均值'],
  ['b22','Average response time is two seconds, as shown on the monitoring dashboard.'],
  ['b23','我们平均每天发一版，发布节奏由值班表决定'],
  ['b24','We ship once a day on average; the release cadence is set by the on-call rota.'],
  ['b25','平均每单运费五元，运费政策写在帮助中心'],
  ['b26','Average shipping cost is five yuan per order, and the policy is documented in the help centre.'],
  ['b27','新员工平均三周上手，这取决于培训体系而不是个人'],
  ['b28','New hires take three weeks on average to ramp up, which depends on the training programme.'],
  ['b29','平均订单金额两百元，与去年持平'],
  ['b30','Average order value is 200 yuan, flat year on year.'],
];

function anyHit(list, text) { for (const re of list) { if (re.test(text)) return true; } return false; }
function isZh(t) { return /[\u4e00-\u9fff]/.test(t); }

console.log('=== 攻击族：三腿命中（腿①AVG_RATE × 腿②MARG/INCR 已有 × 腿③QTY_CONCL 新）===');
// 复用既有 MARG/INCR 腿（从模块 __internals 取，确保一致）
const I = require(path.join(ROOT, 'src/average-marginal-conflation.js')).__internals();
const MARG_ZH = I.MARG_ZH, INCR_ZH = I.INCR_ZH, MARG_EN = I.MARG_EN, INCR_EN = I.INCR_EN;
let a1=0,a2=0,a3=0;
for (const [k,t] of ATTACKS) {
  const zh = isZh(t);
  const l1 = anyHit(zh ? AVG_RATE_ZH : AVG_RATE_EN, t);
  const l2 = anyHit(zh ? MARG_ZH.concat(INCR_ZH) : MARG_EN.concat(INCR_EN), t);
  const l3 = anyHit(zh ? QTY_CONCL_ZH : QTY_CONCL_EN, t);
  if (l1) a1++; if (l2) a2++; if (l3) a3++;
  console.log(JSON.stringify({k, l1, l2, l3, all: l1&&l2&&l3, text: t.slice(0,40)}));
}
console.log('--- attacks: leg1='+a1+'/'+ATTACKS.length+' leg2='+a2+'/'+ATTACKS.length+' leg3='+a3+'/'+ATTACKS.length);

console.log('=== 良性族：三腿命中数（越少越好）===');
let bAll=0, b1=0,b2=0,b3=0;
for (const [k,t] of BENIGN) {
  const zh = isZh(t);
  const l1 = anyHit(zh ? AVG_RATE_ZH : AVG_RATE_EN, t);
  const l2 = anyHit(zh ? MARG_ZH.concat(INCR_ZH) : MARG_EN.concat(INCR_EN), t);
  const l3 = anyHit(zh ? QTY_CONCL_ZH : QTY_CONCL_EN, t);
  if (l1) b1++; if (l2) b2++; if (l3) b3++;
  if (l1&&l2&&l3) bAll++;
  console.log(JSON.stringify({k, l1, l2, l3, text: t.slice(0,40)}));
}
console.log('--- benign: leg1='+b1+'/'+BENIGN.length+' leg2='+b2+'/'+BENIGN.length+' leg3='+b3+'/'+BENIGN.length+' all3='+bAll);
