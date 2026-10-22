// r547 探针：Boundary 族（互斥分项之和在 100% 边界附近 × 全覆盖表述）
// 目的：实测 percentage_overflow 未覆盖的边界形状是否穿过硬闸门。
// 样本全部隔离在本文件内，禁止回贴到报告（451 纪律）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

// 族 A：分项之和明显低于 100%，却声称覆盖全部
const A = [
  'A 方案占 40%，B 方案占 30%，两者合计已覆盖全部客户场景。',
  '预算的 35% 用于研发，25% 用于市场，合计覆盖了所有部门的需求。',
  '调研中 30% 的用户选择 A，20% 选择 B，两项合计涵盖全部受访者。',
  '45% of the budget goes to marketing and 30% goes to R&D, covering all needs.',
  '第一梯队占 20%，第二梯队占 25%，两者相加覆盖全部学员。',
  '营收 30% 来自北美，25% 来自欧洲，合计已占比全部市场。',
  '技术栈 15% 用 Rust，20% 用 Go，合计覆盖所有生产服务。',
  '工单的 10% 来自投诉，15% 来自咨询，加起来就是全部来源。',
  '流量 25% 来自搜索，20% 来自社交，合计占据全部渠道。',
  '参与者的 40% 是男生，35% 是女生，两者合计即为全部人员。',
];

// 族 B：分项之和恰好 100%，却声称除此之外还有额外分项
const B = [
  'A 占 50%，B 占 50%，此外还有 8% 的样本未纳入统计。',
  '预算 60% 给人力，40% 给设备，另外 10% 用于未列明用途。',
  '男性占 55%，女性占 45%，此外还有 7% 的受访者选择了其他性别。',
  '50% chose A, 50% chose B, and another 12% remained uncounted.',
  '甲部门占 45%，乙部门占 55%，此外还有 6% 属于未归类人员。',
  '营收 50% 来自线上，50% 来自线下，另有 9% 来自未统计渠道。',
  '支持者占 48%，反对者占 52%，此外还有 5% 的人表示中立。',
  '第一梯队占 33%，第二梯队占 34%，第三梯队占 33%，还有 5% 未分组。',
  '研发 50%，市场 50%，剩下 15% 花在其他地方。',
  '中国学生占 50%，印度学生占 50%，另有 10% 来自其他国家。',
];

// 族 C（对照，必须是合法句 → 零误伤）
const C = [
  'A 占 50%，B 占 50%，合计覆盖全部受访者。',
  '研发 60%，市场 40%，这是预算的全部分配。',
  '准确率 95%，覆盖率 90%，召回率 88%。',
  '团队 50% 是工程师，50% 是设计师，共十人。',
  '男性占 55%，女性占 45%，与人口普查数据一致。',
  '50% chose A, 50% chose B, all respondents accounted for.',
  '搜索流量占 60%，社交占 40%，合计全部来源。',
  '第一梯队 33%，第二梯队 34%，第三梯队 33%，抽样误差 1%。',
  '去年增长 20%，今年增长 25%，趋势稳定。',
  '每天登录用户 80%，每周登录 95%，月活 99%。',
];

function gateHit(text) {
  const r = checkOutput(text);
  return {
    action: r.gate && r.gate.action,
    dims: (r.findings || []).map(f => f.dimension),
  };
}

const ACT = i => (i === 'pass' ? '·' : i === 'verify' ? '~' : 'X');

// 族 A：合法宣称全覆盖但分项不足 → 期望被抓住（verify/rewrite）
console.log('=== 族 A：分项和 < 100% 却声称全覆盖 ===');
let aHit = 0;
for (const t of A) { const g = gateHit(t); const caught = g.action !== 'pass'; if (caught) aHit++;
  console.log(`${ACT(g.action)} [${g.action}] dims=${g.dims.join(',') || 'none'}`); }
console.log(`族 A 捕获 ${aHit}/${A.length}`);

// 族 B：sum == 100 但有额外未列明分项 → 期望被抓住
console.log('=== 族 B：和恰 100% 却声称还有额外分项 ===');
let bHit = 0;
for (const t of B) { const g = gateHit(t); const caught = g.action !== 'pass'; if (caught) bHit++;
  console.log(`${ACT(g.action)} [${g.action}] dims=${g.dims.join(',') || 'none'}`); }
console.log(`族 B 捕获 ${bHit}/${B.length}`);

// 族 C：合法句 → 期望全部 pass
console.log('=== 族 C：良性对照（期望零误伤）===');
let cFalse = 0;
for (const t of C) { const g = gateHit(t); if (g.action !== 'pass') cFalse++;
  console.log(`${ACT(g.action)} [${g.action}] dims=${g.dims.join(',') || 'none'}`); }
console.log(`族 C 误伤 ${cFalse}/${C.length}`);

console.log('=== 判定 ===');
console.log(`族 A 穿闸 ${A.length - aHit}/${A.length} | 族 B 穿闸 ${B.length - bHit}/${B.length} | 族 C 误伤 ${cFalse}/${C.length}`);
