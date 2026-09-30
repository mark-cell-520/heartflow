// [v6.7.130 第 300 轮] probe-6-zh-negate：技术主语排除闸门的分界线测试
// 纪律：样本只在本文件出现；只报数字与形状。
// probe-5 结论：纯白名单主语不可行 —— 技术主语加「这次/本次」前缀仍 FP（4/4），
// 伪哲理加「真正的/所谓」前缀反而 miss（3/3）。白名单会把带前缀真阳挡掉。
// 本轮改测**排除法**：主语落在技术/工程实体词表内即不判 pseudo_profundity。
// 依据：r297 已有同款 TECH_ATTRIBUTION_NOUNS 闸门实测有效（0/32）。
// 关键差异：r297 闸门排除的是 B 侧归因对象，本方案排除的是**主语**。
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

// 候选主语技术词表 —— 覆盖 probe-4/5 实测 FP 主语 + 常见工程/商业主语
const TECH_SUBJECT = /(?:延期|排期|指标|活跃度|拆分|召回率|崩溃|延迟|吞吐|并发|连接池|缓存|索引|序列化|内存|带宽|QPS|TPS|p99|CPU|错误率|耗时|帧率|渲染|队列|模块|版本|接口|查询|数据源|补丁|回滚|发布|工单|需求|排期|上线|故障|事故|告警|扩容|缩容|限流|降级|熔断|灰度)/;

function ppfWithGate(t) {
  const base = ppf(t);
  if (!base) return false;
  // 只取「不是」之前的主语段（跨距 12，与 8792 判据一致）
  const m = t.match(/^([^。！？\n]{0,12})/);
  const subj = m ? m[1] : '';
  return !TECH_SUBJECT.test(subj);
}

// A. 技术主语 FP 组（probe-5 B/C 两组，共 12 条）
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
  '这次拆分不是架构问题，是团队自由度不够的根源',
];
// B. 抽象域真阳（probe-5 A 组 7 条 + D 组带前缀 4 条，共 11 条）
const B = [
  '成熟不是终于抵达，是学会与本质共处',
  '成长不是变得世故，是对世界依然保持意义',
  '真正的强大不是无畏，是承认脆弱之后的真相',
  '幸福不是拥有很多，是计较得很少的自由',
  '孤独不是缺陷，是灵魂的底色',
  '时间不是敌人，是成长的礼物',
  '生命不是赛跑，是自由的过程',
  '真正的强大不是无畏，是承认脆弱之后的继续',
  '所谓成熟不是终于抵达，是学会与不确定共处',
  '真正的幸福不是拥有很多，是计较得很少',
  '人这一生不是竞赛，是灵魂的底色',
];
// C. 商业真句（主语是商业域而非技术域，测排除闸门是否该扩到商业主语）
const C = [
  '续约率低不是产品问题，是客户对价格太计较',
  '转化下降不是素材问题，是新用户对品类不好奇',
  'DAU 下滑不是功能问题，是入口太深',
  'GMV 未达标不是流量问题，是客单价策略失误',
];

console.log('=== A. 技术主语 FP 组（排除闸门后目标 0）===');
let aFp = 0;
for (const s of A) { const h = ppfWithGate(s); if (h) aFp++; console.log(['闸门后=' + (h ? 'FP' : 'ok'), 'BASE=' + (ppf(s) ? 'FP' : 'ok')].join(' | ')); }
console.log('A_FP_AFTER_GATE=' + aFp + '/' + A.length);

console.log('=== B. 抽象域真阳（排除闸门后目标不掉）===');
let bHit = 0;
for (const s of B) { const h = ppfWithGate(s); if (h) bHit++; console.log(['闸门后=' + (h ? 'HIT' : 'miss'), 'BASE=' + (ppf(s) ? 'HIT' : 'miss')].join(' | ')); }
console.log('B_HIT_AFTER_GATE=' + bHit + '/' + B.length);

console.log('=== C. 商业主语（BASE vs 闸门后）===');
for (const s of C) console.log(['BASE=' + (ppf(s) ? 'FP' : 'ok'), '闸门后=' + (ppfWithGate(s) ? 'FP' : 'ok')].join(' | ') + ' | ' + s);

// D. 边界：技术词表是否误伤「技术词出现在非主语位置」的伪哲理
const D = [
  ['技术词在谓语', '成熟不是终于抵达，是学会与不确定共处这台机器'],
  ['技术词在主语但属真阳', '崩溃不是终点，是灵魂重建的开始'],
];
console.log('=== D. 边界样本 ===');
for (const [tag, s] of D) console.log([tag, 'BASE=' + (ppf(s) ? 'FP/HIT' : 'ok'), '闸门后=' + (ppfWithGate(s) ? 'FP/HIT' : 'ok')].join(' | ') + ' | ' + s);
