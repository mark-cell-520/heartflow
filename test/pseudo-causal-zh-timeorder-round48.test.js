'use strict';
// 第48轮 主测试：pseudo_causal 中文「时间先后冒充因果」族
// 跑法: node test/pseudo-causal-zh-timeorder-round48.test.js
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');
const { checkOutput } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/gate.js');

// ── 攻击集：24 条白话伪因果（改前 23/24 漏判，gate 全 pass）──
const ATTACK = [
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。',
  '自从换了新领导，业绩就一路下滑，显然是新领导把团队带崩了。',
  '自从公司开始抓考勤，离职率就降了，说明抓考勤确实有用。',
  '他一来我们组项目就延期了，看来他就是问题所在。',
  '这部剧播出后当地旅游就火了，可见这部剧带火了整座城市。',
  '换了新 Logo 之后销量起来了，说明新 Logo 是成功的。',
  '去年开始用新系统，从那以后事故就没再出过，可见新系统解决了安全隐患。',
  '自从老板每天早会后，迟到的人就少了，说明早会制度立竿见影。',
  '这次促销一结束，退货量就上来了，显然促销把不合适的人吸引来了。',
  '调整了首页布局之后留存就涨了，证明之前的布局确实有问题。',
  '我把闹钟提前半小时后，上班就不再迟到了，可见闹钟是关键。',
  '团队加了新人之后，代码缺陷率下降了，说明新人培训起了作用。',
  '自从搬进了新办公室，大家的加班反而变少了，看来环境改善提高了效率。',
  '上了新考勤机以来，没人再忘打卡了，说明机器比制度管用。',
  '这两次延期都发生在你值班那周，所以问题就出在你身上。',
  '前年亏今年赚，中间只差了一次团建，显然是团建把士气带起来了。',
  '昨天改了配置，今天服务就稳了，说明就是配置的问题。',
  '自从改了餐标，食堂抱怨少了，可见抱怨都是钱没给够。',
  '他接手后投诉立刻少了，说明前任主管根本不会管理。',
  '发布新版本后崩溃率下降，证明是旧版本的锅。',
  '改了标题风格之后阅读量翻倍，可见读者就吃这一套。',
  '换了供应商之后交期变短，说明这家供应商明显更专业。',
  '下雨天的销售额总是低，所以天气直接决定了我们的业绩。',
  '周一出事故最多，可见周一大家状态最差。'
];
// ── 良性集：30 条（对冲/机制/数字指标/统计谦辞四类）──
const BENIGN = [
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据。',
  '换了新领导之后业绩有变化，但这几个月市场环境也变了很多，不好归因。',
  '考勤收紧后离职率有下降，同期也普调了薪资，两件事混在一起还看不出主因。',
  '项目延期发生在他加入之后，但他只负责后端，延期主要在前端联调。',
  '旅游热度上升与剧的播出时间接近，但同期还有免门票政策，权重待评估。',
  '新 Logo 上线和销量回暖都发生在三季度，我们还做了两轮促销，需要拆开看。',
  '崩溃率下降与发版时间重合，不过同期还换了机器，不能直接归因。',
  '早会后迟到变少，也可能是天气变冷大家出门更早了。',
  '改配置后服务变稳，我怀疑跟当晚流量下降也有关，需要再观察。',
  '换了供应商后交期变短，今年整体物流都比去年通畅。',
  '采用新架构后请求 Latency 从 800ms 降到 120ms。',
  '这个版本发布后崩溃率从 2.1% 降到 0.4%。',
  '改版之后日活从 3 万涨到 4.5 万。',
  '灰度上线后转化率提升了 30%。',
  '去年导入新 CRM 后，销售人均单量提升了 1.8 倍。',
  '算法调整后检索准确率从 71% 提到 79%。',
  '六点之后地铁明显宽松很多。',
  '大雨之后水库水位涨了两米。',
  '国庆假期之后机票价格普遍回落。',
  '考试结束后图书馆的空位就多了。',
  '我们给查询加了索引，Explain 显示扫描行数从 120 万降到 3 千，慢查询随之消失。',
  '增加了缓存之后接口耗时降到 40ms，因为重复计算被省掉了。',
  '把超时从 30s 改成 5s，用户投诉中「转圈」的描述少了很多。',
  '加了单元测试之后线上回滚次数下降，边界 case 在提测前就被挡住了。',
  '换上 SSD 后编译时间从 14 分钟降到 3 分钟。',
  '灰度只放 5% 流量，有问题可以立刻关掉。',
  '上线后我们盯着看板守了半小时，没有异常再走人。',
  '发版后先观察 24 小时，指标不动再回滚。',
  '周一的事故率最高，p<0.05，样本 14 个月。',
  '下雨天销售额低，r=-0.62，是强相关不是因果。'
];
// ── 英文不受影响（本族只判中文）──
const EN_SAMPLES = [
  'After the migration, error rates dropped, so the migration fixed it.',
  'Since the new lead joined, performance has been declining.'
];

let pass = 0, fail = 0;
const errors = [];

// 1) 维度函数层：攻击必须命中 count>0 且 score>0
let dimHit = 0;
for (const s of ATTACK) {
  const r = idx.checkPseudoCausal(s);
  if (r.count > 0 && r.score > 0) dimHit++;
  else errors.push('攻击维度漏判: ' + s);
}
if (dimHit === ATTACK.length) { pass++; console.log('  ✅ 攻击维度命中 ' + dimHit + '/' + ATTACK.length); }
else { fail++; console.log('  ❌ 攻击维度命中 ' + dimHit + '/' + ATTACK.length); }

// 2) gate 层：攻击必须非 pass
let gateHit = 0;
for (const s of ATTACK) {
  const g = checkOutput(s);
  if (g.gate.action !== 'pass') gateHit++;
  else errors.push('攻击 gate 漏判: ' + s);
}
if (gateHit === ATTACK.length) { pass++; console.log('  ✅ 攻击 gate 非pass ' + gateHit + '/' + ATTACK.length); }
else { fail++; console.log('  ❌ 攻击 gate 非pass ' + gateHit + '/' + ATTACK.length); }

// 3) 良性维度层：0 误伤（本维度 count 必须为 0）
let dimFp = [];
BENIGN.forEach((s, i) => {
  const r = idx.checkPseudoCausal(s);
  if (r.count > 0) dimFp.push('#' + i + ' count=' + r.count + ' hits=' + JSON.stringify(r.hits) + ' :: ' + s.slice(0, 24));
});
if (dimFp.length === 0) { pass++; console.log('  ✅ 良性维度零误伤 ' + BENIGN.length + '/' + BENIGN.length); }
else { fail++; console.log('  ❌ 良性维度误伤 ' + dimFp.length); dimFp.forEach(e => console.log('     ' + e)); }

// 4) 新增函数存在且英文直接跳过（守卫只作用于中文）
const enSkips = EN_SAMPLES.every(s => idx.checkCausalOverclaimZh(s).count === 0);
if (enSkips) { pass++; console.log('  ✅ 英文样本本族不判 (checkCausalOverclaimZh 返回 0)'); }
else { fail++; console.log('  ❌ 英文样本被本族误判'); }

// 5) 良性在 gate 层不因本维度升级（不得出现 pseudo_causal finding）
let gateFp = [];
BENIGN.forEach((s, i) => {
  const g = checkOutput(s);
  const dims = (g.findings || []).map(f => f.dimension);
  if (dims.includes('pseudo_causal')) gateFp.push('#' + i + ' :: ' + s.slice(0, 24));
});
if (gateFp.length === 0) { pass++; console.log('  ✅ 良性 gate 不出现 pseudo_causal finding'); }
else { fail++; console.log('  ❌ 良性 gate 被本维度命中 ' + gateFp.length); gateFp.forEach(e => console.log('     ' + e)); }

for (const e of errors) console.log('     ' + e);
console.log(`\npseudo-causal-zh-timeorder-round48: ${pass}/5 passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
