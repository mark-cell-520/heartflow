// [v6.7.130 第 300 轮] probe-10-zh-window：剩余 FP 的窗口修正
// 纪律：样本只在本文件出现；只报数字与形状。
// 实装后剩 1 条 FP：「对不上不是查询错，是数据源才是真相」——「查询」落在
// 第二小句（主语是「对不上」），前 12 字窗口没覆盖到。
// 本轮回答：把窗口从「前 12 字」扩到「第一个不是之前的全部内容」能否消掉
// 这条，同时不压任何抽象域真阳（probe-7 已测 V2 反而漏 1 条，需定位是哪条）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

const TECH = /(?:延期|排期|指标|活跃度|拆分|召回率|崩溃|延迟|吞吐|并发量|连接池|缓存|索引|序列化|内存|带宽|QPS|TPS|p99|CPU|错误率|耗时|帧率|渲染|队列|模块|版本|接口|查询|数据源|补丁|回滚|发布|工单|需求|上线|故障|事故|告警|扩容|缩容|限流|降级|熔断|灰度|DAU|GMV|续约率|转化率)/i;

// 现装版本（V1）：前 12 字窗口
function gateV1(t) {
  if (!ppf(t)) return false;
  const subj = t.slice(0, 12);
  return !TECH.test(subj);
}
// 候选（V4）：第一个「不是」之前的全部内容（不设 12 字上限）
function gateV4(t) {
  if (!ppf(t)) return false;
  const head = t.slice(0, 24);
  const cut = head.indexOf('不是');
  const subj = cut === -1 ? head.slice(0, 12) : head.slice(0, cut);
  return !TECH.test(subj);
}

const A = [
  '延期不是排期问题，是需求本质还没定',
  '指标下滑不是投放问题，是这次改动意义不大',
  '对不上不是查询错，是数据源才是真相',
  '活跃度下降不是推荐问题，是产品成长阶段的正常波动',
  '这次拆分不是架构问题，是团队自由度不够',
  '召回率低不是模型问题，是特征才是灵魂',
  '崩溃不是内存问题，是连接池才是答案',
  '延迟不是网络问题，是序列化才是过程',
  '本次延期不是排期问题，是需求本质还没定',
  '这条查询对不上不是语法错，是数据源才是真相',
  '该模块崩溃不是内存问题，是连接池才是答案',
];
const B = [
  '成熟不是终于抵达，是学会与本质共处',
  '成长不是变得世故，是对世界依然保持意义',
  '真正的强大不是无畏，是承认脆弱之后的真相',
  '幸福不是拥有很多，是计较得很少的自由',
  '孤独不是缺陷，是灵魂的底色',
  '时间不是敌人，是成长的礼物',
  '生命不是赛跑，是自由的过程',
  '人这一生不是竞赛，是灵魂的底色',
  // 对抗：抽象主语里含技术词（不得被压制）
  '成熟不是终于抵达，是学会与延迟共处',
  '成长不是变得世故，是终于懂得接口的意义',
];
// 定位 probe-7 里 V2 漏掉的那 1 条
const PROBE7_B_MISS = [
  '成熟不是终于抵达，是学会与本质共处',
  '成长不是变得世故，是对世界依然保持意义',
  '真正的强大不是无畏，是承认脆弱之后的真相',
  '幸福不是拥有很多，是计较得很少的自由',
  '孤独不是缺陷，是灵魂的底色',
  '时间不是敌人，是成长的礼物',
  '生命不是赛跑，是自由的过程',
  '人这一生不是竞赛，是灵魂的底色',
];

for (const [name, gate] of [['V1现装', gateV1], ['V4候选', gateV4]]) {
  const aFp = A.filter(gate).length;
  const bHit = B.filter(gate).length;
  console.log(name + ': A_FP=' + aFp + '/' + A.length + ' | B_HIT=' + bHit + '/' + B.length);
}

console.log('=== V1 vs V4 在 B 组逐条对比（找 V2/V4 压制的那条）===');
for (const s of B) {
  const b = ppf(s), v1 = gateV1(s), v4 = gateV4(s);
  if (b !== v1 || b !== v4) {
    console.log('BASE=' + (b ? 'HIT' : 'miss') + ' V1=' + (v1 ? 'HIT' : '压') + ' V4=' + (v4 ? 'HIT' : '压') + ' | ' + s);
  }
}

console.log('=== A 组逐条（剩余 FP 明细）===');
for (const s of A) {
  console.log('V1=' + (gateV1(s) ? 'FP' : 'ok') + ' V4=' + (gateV4(s) ? 'FP' : 'ok') + ' | ' + s);
}
