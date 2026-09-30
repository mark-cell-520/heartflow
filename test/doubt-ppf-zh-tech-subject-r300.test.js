// test/doubt-ppf-zh-tech-subject-r300.test.js
// [v6.7.130 第 300 轮] guard: 主语技术域排除闸门
// 判据来源：src/index.js 8781 行「不是A，是B」老判据 B 侧本体论词表在中文
// 工程语言里被当普通修饰语用，probe-4 实测误伤面 8/9。
// 接线：checkPseudoProfundity 内 isTechSubject() 前置闸门。
// 标称值来自 scripts/round-300/probe-6~probe-11 线上实测：
//   ① 技术主语工程真句放行 12/12（probe-6 A 组）
//   ② 带前缀技术主语放行 4/4（probe-5 C 组）
//   ③ 抽象域真阳召回不掉（标称 8/10，probe-11 实测）
//   ④ 商业真句 0 误伤（probe-6 C 组 4 条）
//   ⑤ 对抗样本：技术词落在非主语位置的抽象域真阳不被压制（probe-7 D 组）
// 失效条件：任一组脱离标称值 → 该组全红。
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

// ── ① 技术主语工程真句（必须放行）──
// B 侧落「本质/意义/真相/成长/自由/灵魂/答案/过程」等词表内既有词，
// 主语是可测量技术实体 → 工程归因，不是本体论升格。
const NEG_TECH_SUBJ = [
  '延期不是排期问题，是需求本质还没定。',
  '指标下滑不是投放问题，是这次改动意义不大。',
  '活跃度下降不是推荐问题，是产品成长阶段的正常波动。',
  '这次拆分不是架构问题，是团队自由度不够。',
  '召回率低不是模型问题，是特征才是灵魂。',
  '崩溃不是内存问题，是连接池才是答案。',
  '延迟不是网络问题，是序列化才是过程。',
  '模块报错不是框架的问题，是数据源才是真相。',
  '版本发布不是流程问题，是需求边界本身没定清。',
  '故障复盘不是人的问题，是灰度策略本身有漏洞。',
  '扩容不是资源问题，是索引策略才是瓶颈。',
  '限流触发不是流量问题，是熔断阈值设得过低。',
];

// ── ② 带前缀技术主语（probe-5 C 组：白名单主语方案正是死在这里）──
const NEG_PREFIXED = [
  '本次延期不是排期问题，是需求本质还没定。',
  '这次拆分不是架构问题，是团队自由度不够的根源。',
  '该模块崩溃不是内存问题，是连接池才是答案。',
  '这条查询对不上不是语法错，是数据源才是真相。',
];

// ── ③ 商业主语（probe-6 C 组：未扩表，BASE 即 0 误伤，防回归）──
const NEG_BIZ = [
  '续约率低不是产品问题，是客户对价格太计较。',
  '转化下降不是素材问题，是新用户对品类不好奇。',
  'DAU 下滑不是功能问题，是入口太深。',
  'GMV 未达标不是流量问题，是客单价策略失误。',
];

// ── ④ 抽象域真阳（probe-11 实测 BASE 即命中的 7 条，闸门后必须仍命中）──
// 排除「成熟…是学会与延迟共处」：该句 BASE 即 miss（probe-12 实测），
// 属既有漏检不属回归；对抗组另立 ⑦。
const POS_ABS = [
  '成熟不是终于抵达，是学会与本质共处。',
  '成长不是变得世故，是对世界依然保持意义。',
  '真正的强大不是无畏，是承认脆弱之后的真相。',
  '幸福不是拥有很多，是计较得很少的自由。',
  '孤独不是缺陷，是灵魂的底色。',
  '生命不是赛跑，是自由的过程。',
  '人这一生不是竞赛，是灵魂的底色。',
];

// ── ⑦ 有效对抗样本（probe-12 筛出：BASE 命中 + 技术词落在非主语位置）──
// 这 4 条的 B 侧/非主语位置含「接口/限流/重构/回滚」等技术词，
// 而主语是抽象域（成长/成熟/强大）→ 闸门绝不能因句中含技术词就压制。
const POS_ADVERSARIAL = [
  '成长不是变得世故，是终于懂得接口的意义。',
  '成熟不是终于抵达，是终于学会与限流的自己和解。',
  '成长不是变得世故，是看懂每一次重构的意义。',
  '强大不是不跌倒，是每次回滚后依然选择发布。',
];

// ── ⑤ 老族防回归：带「而是」分支不受主语闸门影响（r296/r297 已收形状）──
const POS_ERSHI = [
  '这不是简单的技术问题，而是整个行业维度的认知出现了系统性的偏差。',
  '这不是甲的问题，而是认知维度的局限。',
];

// ── ⑥ r298 防回归：「本身」自指形态工程归因真句仍须放行 ──
const NEG_BENSHEN = [
  '这不是某个人的错，是系统设计本身有缺陷。',
  '这个差异不是算法的，是数据采集口径本身不同。',
  '延迟不是带宽造成的，是压缩算法本身的开销。',
];

const groups = [
  ['① 技术主语工程真句放行', NEG_TECH_SUBJ, false],
  ['② 带前缀技术主语放行', NEG_PREFIXED, false],
  ['③ 商业主语真句放行', NEG_BIZ, false],
  ['④ 抽象域真阳召回', POS_ABS, true],
  ['⑤ 「而是」老族防回归', POS_ERSHI, true],
  ['⑥ 「本身」形态防回归放行', NEG_BENSHEN, false],
  ['⑦ 有效对抗样本不被压制', POS_ADVERSARIAL, true],
];

let pass = 0, fail = 0;
for (const [label, list, expect] of groups) {
  const got = list.filter(ppf).length;
  const want = expect ? list.length : 0;
  const ok = got === want;
  if (ok) pass++; else { fail++; console.error('  FAIL: ' + label + ' 期望 ' + want + '/' + list.length + '，实际 ' + got + '/' + list.length); }
  console.log((ok ? '  ✅ ' : '  🔴 ') + label + ' = ' + got + '/' + list.length + (expect ? '（应全命中）' : '（应全放行）'));
}

// 汇总断言：工程/商业真句零误伤、抽象域/老族/对抗组真阳不掉
const allNeg = NEG_TECH_SUBJ.concat(NEG_PREFIXED, NEG_BIZ, NEG_BENSHEN);
const allPos = POS_ABS.concat(POS_ERSHI, POS_ADVERSARIAL);
assert.strictEqual(allNeg.filter(ppf).length, 0,
  '工程/商业真句误伤 ' + allNeg.filter(ppf).length + '/' + allNeg.length + '，应 0');
assert.strictEqual(allPos.filter(t => !ppf(t)).length, 0,
  '真阳漏检 ' + allPos.filter(t => !ppf(t)).length + '/' + allPos.length + '，应 0');

console.log('\n✅ doubt-ppf-zh-tech-subject-r300 全通过');
console.log('   断言通过: ' + pass + '/' + groups.length);
// [v6.7.130 第 300 轮] run-all 收集器要求的「N 通过, M 失败」汇总行。
// 口径：每组一个断言（该组全部样本判定正确才算通过）。
console.log(`${pass} 通过, ${fail} 失败`);
assert.strictEqual(fail, 0, 'doubt-ppf-zh-tech-subject-r300: ' + fail + ' 个分组失败');
