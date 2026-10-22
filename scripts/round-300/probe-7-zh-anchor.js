// [v6.7.130 第 300 轮] probe-7-zh-anchor：误伤归因到具体正则 + 三种闸门锚定对比
// 纪律：样本只在本文件出现；只报数字与形状。
// probe-6 发现 V1（前 12 字窗口）能把 A 组 12/12 压到 0，但锚定宽松——
// 「对不上不是查询错」里「查询」在 A 侧中段而非主语。实装前必须回答两问：
//   ① probe-4 的 8 条 FP 究竟由哪条正则产出（决定闸门加在哪一层）
//   ② 三种锚定（前12字窗口 / 真正主语段 / 整句）哪种既不增误伤也不掉召回
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const src = require(path.join(ROOT, 'src/index.js'));
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}

// ── ① 误伤归因：正则数组未导出，改用 readFile + eval 在隔离作用域取数组 ──
const fs = require('fs');
const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const mArr = idxSrc.match(/const PSEUDO_PHILOSOPHY_ZH = \[([\s\S]*?)\n\];/);
if (!mArr) { console.log('未定位到 PSEUDO_PHILOSOPHY_ZH 定义'); process.exit(1); }
const PP = eval('[[' + mArr[1] + ']]').map(x => (x instanceof RegExp ? x : null)).filter(Boolean);
const PP_RAW = eval('[[' + mArr[1] + ']]');
console.log('正则条目数=' + PP.length + ' / 总条目=' + PP_RAW.length);
const FP_SAMPLES = [
  '延期不是排期问题，是需求本质还没定',
  '指标下滑不是投放问题，是这次改动意义不大',
  '对不上不是查询错，是数据源才是真相',
  '活跃度下降不是推荐问题，是产品成长阶段的正常波动',
  '这次拆分不是架构问题，是团队自由度不够',
  '召回率低不是模型问题，是特征才是灵魂',
  '崩溃不是内存问题，是连接池才是答案',
  '延迟不是网络问题，是序列化才是过程',
];
console.log('=== ① FP 归因到正则下标 ===');
const attrib = {};
for (const s of FP_SAMPLES) {
  const hits = [];
  for (let i = 0; i < PP.length; i++) if (PP[i].test(s)) hits.push(i);
  attrib[s] = hits;
  console.log('idx=' + JSON.stringify(hits) + ' | ' + s);
}
const idxSet = {};
for (const k in attrib) for (const i of attrib[k]) idxSet[i] = (idxSet[i] || 0) + 1;
console.log('idx_分布=' + JSON.stringify(idxSet));

// ── ② 三种锚定方式对比 ──
const TECH_SUBJECT = /(?:延期|排期|指标|活跃度|拆分|召回率|崩溃|延迟|吞吐|并发|连接池|缓存|索引|序列化|内存|带宽|QPS|TPS|p99|CPU|错误率|耗时|帧率|渲染|队列|模块|版本|接口|查询|数据源|补丁|回滚|发布|工单|需求|上线|故障|事故|告警|扩容|缩容|限流|降级|熔断|灰度)/;

// V1：前 12 字窗口（probe-6 已测：A 12/12→0，B 不变）
function gateV1(t) {
  if (!ppf(t)) return false;
  const m = t.match(/^([^。！？\n]{0,12})/);
  return !(m && TECH_SUBJECT.test(m[1]));
}
// V2：真正主语段 = 第一个「不是」之前的全部内容
function gateV2(t) {
  if (!ppf(t)) return false;
  const m = t.match(/^([^。！？\n]{0,24}?)不是/);
  return !(m && TECH_SUBJECT.test(m[1]));
}
// V3：整句（与 r297 TECH_ATTRIBUTION_NOUNS 同款作用域）
function gateV3(t) {
  if (!ppf(t)) return false;
  return !TECH_SUBJECT.test(t);
}

const A = FP_SAMPLES.concat([
  '本次延期不是排期问题，是需求本质还没定',
  '这条查询对不上不是语法错，是数据源才是真相',
  '该模块崩溃不是内存问题，是连接池才是答案',
]);
const B = [
  '成熟不是终于抵达，是学会与本质共处',
  '成长不是变得世故，是对世界依然保持意义',
  '真正的强大不是无畏，是承认脆弱之后的真相',
  '幸福不是拥有很多，是计较得很少的自由',
  '孤独不是缺陷，是灵魂的底色',
  '时间不是敌人，是成长的礼物',
  '生命不是赛跑，是自由的过程',
  '人这一生不是竞赛，是灵魂的底色',
];
// 对抗真阳：技术词出现在非主语位置（不得被闸门无辜压制）
const C = [
  ['技术词在A侧', '成熟不是终于抵达，是学会与不确定这台机器共舞'],
  ['技术词在B侧', '幸福不是拥有很多，是不做连接池的奴隶'],
  ['主语即技术词但真阳', '崩溃不是终点，是灵魂重建的开始'],
  ['主语即技术词但真阳2', '延迟不是敌人，是让人清醒的礼物'],
];

for (const [name, gate] of [['V1前12字', gateV1], ['V2真正主语', gateV2], ['V3整句', gateV3]]) {
  const aFp = A.filter(gate).length;
  const bHit = B.filter(gate).length;
  const cLoss = C.filter(([, s]) => ppf(s) && !gate(s)).length;
  console.log('=== ' + name + ' === A_FP=' + aFp + '/' + A.length +
    ' | B_HIT=' + bHit + '/' + B.length + ' | 对抗组被压=' + cLoss + '/' + C.length);
}

console.log('=== 对抗组明细（BASE 命中但闸门压制的 = 真损失）===');
for (const [tag, s] of C) {
  const base = ppf(s);
  const v1 = gateV1(s), v2 = gateV2(s), v3 = gateV3(s);
  console.log([tag, 'BASE=' + (base ? 'HIT' : 'miss'), 'V1=' + (v1 ? 'HIT' : '压'), 'V2=' + (v2 ? 'HIT' : '压'), 'V3=' + (v3 ? 'HIT' : '压')].join(' | ') + ' | ' + s);
}
