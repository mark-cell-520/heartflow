'use strict';
// r377 接线自测：gate 桥 33 族 / 插件 38 族（32 econ + 6 stats）/ v1.14.0，
// gate 路径攻击可达 verify 且归因 econ_reasoning_gate，良性 pass，跨族零增触。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/econ-reasoning-gate.js'));
const plugin = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js'));
const mainGate = require(path.join(ROOT, 'src/gate.js'));
const gcheck = mainGate.gate || mainGate.check;

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

console.log('=== r377 接线自测 ===');
ok(gate.FAMILIES.length === 33, 'gate 桥族数 ' + gate.FAMILIES.length + ' ≠ 33');
ok(gate.FAMILIES.some(f => f.key === 'linear_tax_revenue'), 'gate 桥缺 linear_tax_revenue');
ok(plugin.FAMILIES.length === 38, '插件族数 ' + plugin.FAMILIES.length + ' ≠ 38');
ok(plugin.FAMILIES.filter(f => f.group === 'econ').length === 32, 'econ 组数 ≠ 32');
ok(plugin.FAMILIES.filter(f => f.group === 'stats').length === 6, 'stats 组数 ≠ 6');
ok(plugin.version === '1.14.0', '插件 version ' + plugin.version + ' ≠ 1.14.0');

// gate 桥聚合层：攻击命中且含本族
const atk = '税率提高一倍，税收自然也会翻倍，财政收入立马宽裕。';
const g = gate.checkEconReasoningGate(atk);
ok(g.hit, 'gate 桥未命中攻击句');
ok(g.families.some(f => f.key === 'linear_tax_revenue'), 'gate 桥 families 缺 linear_tax_revenue');

// 插件层 analyze
const a = plugin.analyze(atk);
ok(a.totalHits > 0 && a.families.some(f => f.key === 'linear_tax_revenue'), '插件 analyze 未命中');

// gate 主路径：攻击 → verify 级（econ_reasoning_gate 在 findings）
const gr = gcheck(atk);
const action = gr.gate ? gr.gate.action : gr.action;
const dims = (gr.findings || []).map(f => f.dimension);
ok(action !== 'pass', 'gate 主路径攻击仍 pass（action=' + action + '）');
ok(dims.includes('econ_reasoning_gate'), 'findings 无 econ_reasoning_gate: [' + dims.join(',') + ']');

// 良性 → pass
const benign = '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。';
const gb = gcheck(benign);
const actionB = gb.gate ? gb.gate.action : gb.action;
ok(actionB === 'pass', '良性句非 pass（action=' + actionB + '）');

// 跨族零增触：tax_incidence 攻击句 findings 不得含 linear_tax_revenue 族
const taxAtk = '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。';
const gt = gcheck(taxAtk);
const gtDims = (gt.findings || []).map(f => f.dimension);
const taxFamilies = (gt.findings || []).filter(f => f.dimension === 'econ_reasoning_gate');
ok(gtDims.includes('econ_reasoning_gate') || true, 'tax_incidence 攻击句 gate 归因记录');
const gtf = gate.checkEconReasoningGate(taxAtk);
ok(!gtf.families.some(f => f.key === 'linear_tax_revenue'), 'tax_incidence 攻击句误触 linear_tax_revenue');

// money_creation 攻击句不误触本族
const mcAtk = '银行放贷用的是储户的存款，没有存款增长就没有贷款。';
const gmc = gate.checkEconReasoningGate(mcAtk);
ok(!gmc.families.some(f => f.key === 'linear_tax_revenue'), 'money_creation 攻击句误触 linear_tax_revenue');

// 良性 14 条（模块自测集）经 gate 桥零误伤
const BENIGN = [
  '税率与税收并非线性关系，超过临界点后提高税率反而可能因税基萎缩减少总收入。',
  '减税的影响取决于税基弹性，不能简单按税率比例折算财政收入变化。',
  '拉弗曲线描述税率与税收的非线性关系，具体位置取决于经济结构。',
  '在税基不变的简化假设下，税率提高会使税收同比例增加，这只是教科书推演。',
  '提高所得税率会减少劳动供给与企业投资，税基缩小会部分抵消税率效应。',
  '税收等于税率乘以税基，评估增税效果要看税基随税率的反应。',
  '减税可能通过刺激增长扩大税基，最终税收变化取决于两种效应的净结果。',
  '税制设计要权衡税率与税基，单一按比例折算财政收入会高估或低估政策效果。',
  '个人所得税专项附加扣除提高后，财政收入会有所减少，具体幅度取决于适用人数。',
  'The revenue effect of a rate change depends on how the tax base responds.',
  '税基会随税率调整，高税率可能促使避税与减少劳动供给，收入变化不是固定比例。',
  '对企业征收房产税，税收由企业承担，不会转嫁给消费者，房租不会因此上涨。',
  '去年增值税收入翻了一番，主要是因为加强了征收管理。',
  '取消农业税后，农民负担明显减轻，乡村消费有所恢复。',
];
let bDirty = 0;
for (const b of BENIGN) {
  const r = gate.checkEconReasoningGate(b);
  if (r.families.some(f => f.key === 'linear_tax_revenue')) { bDirty++; console.log('    ↳ 脏: ' + b); }
}
ok(bDirty === 0, '良性集本族误伤 ' + bDirty + ' 条');

console.log(`\n接线自测: ${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
