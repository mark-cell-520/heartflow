'use strict';
// r385 扩族义务：把本轮新增 comparative_advantage 子族引起的计数链
// (gate 36→37 / 插件 41→42 / econ 35→36 / 插件 version 1.17.0→1.18.0)
// 同步进存量 econ 轮测；另同步远端 r380 duration_neglect 造成的 VERSION
// 基线漂移 6.8.190→6.8.192（属既有基线维护，非本轮增量，仅在 VERSION 断言行/
// check 标题上改，绝不触碰头部注释里的 "v6.8.190 pristine 基线" 历史叙述）。
// round-295 需补 comparative_advantage 的 ATTACK 样本 + INJECT_KEY（否则
// section B/E 遍历全族时会 undefined/crash）。
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const TEST = path.join(ROOT, 'test');

const FILES = [
  'round-295-econ-reasoning-wiring.test.js',
  'round-364-jevons-paradox.test.js',
  'round-367-price-control.test.js',
  'round-368-mercantilism.test.js',
  'round-369-paradox-of-thrift.test.js',
  'round-371-decoy-effect.test.js',
  'round-372-healthy-user-bias.test.js',
  'round-373-extraordinary-claims.test.js',
  'round-374-stock-flow-conflation.test.js',
  'round-375-government-household-analogy.test.js',
  'round-376-money-creation.test.js',
  'round-377-linear-tax-revenue.test.js',
  'round-378-insurance-claim-loss.test.js',
  'round-379-flat-rate-bias.test.js',
  'round-381-lump-of-labor.test.js',
];

// 计数链断言值 + 消息（所有文件通用；每项 [old,new,期望最少命中数]）
const COMMON = [
  ['GATE_FAMS.length, 36', 'GATE_FAMS.length, 37', 0],
  ['gate.FAMILIES.length, 36', 'gate.FAMILIES.length, 37', 0],
  ['plugin.FAMILIES.length, 41', 'plugin.FAMILIES.length, 42', 0],
  ['FAMILIES.length, 41)', 'FAMILIES.length, 42)', 0],
  ["plugin.FAMILIES.filter(f => f.group === 'econ').length, 35", "plugin.FAMILIES.filter(f => f.group === 'econ').length, 36", 0],
  ['econ.length, 35', 'econ.length, 36', 0],
  ["plugin.version, '1.17.0'", "plugin.version, '1.18.0'", 0],
  // 断言消息字面量（失败时才显示，但仍同步以保持准确）
  ['插件族表应为 41 族', '插件族表应为 42 族', 0],
  ['econ 应为 35 族', 'econ 应为 36 族', 0],
  ['插件 version 应为 1.17.0', '插件 version 应为 1.18.0', 0],
  ['1.17.0（r381 再 bump）', '1.18.0（r385 再 bump）', 0],
  // key 唯一性计数（new Set(keys).size 应等于总族数）
  ['new Set(keys).size, 41', 'new Set(keys).size, 42', 0],
  // round-381 用局部变量 gFams（非 GATE_FAMS）
  ['gFams.length, 36', 'gFams.length, 37', 0],
  ['gate 桥族表应为 36 族', 'gate 桥族表应为 37 族', 0],
  // 标题/头部注释里的族计数（cosmetic，保持与断言一致）
  ['插件族表 41 族：35 econ + 6 stats', '插件族表 42 族：36 econ + 6 stats', 0],
  ['gate 桥族表 36 族', 'gate 桥族表 37 族', 0],
  ['（41 族 35 econ + 6 stats / v1.17.0 /', '（42 族 36 econ + 6 stats / v1.18.0 /', 0],
  ['gate 桥 36 族）', 'gate 桥 37 族）', 0],
  ['（41 族 = 35 econ + 6 stats）', '（42 族 = 36 econ + 6 stats）', 0],
  ['E 插件 41 族接线', 'E 插件 42 族接线', 0],
  // VERSION 基线漂移断言行（r380 duration_neglect 6.8.190→6.8.192）
  ["assert.strictEqual(v, '6.8.190', 'VERSION 应为 6.8.190，实为 ' + v);",
   "assert.strictEqual(v, '6.8.192', 'VERSION 应为 6.8.192（r385 基线同步：r380 duration_neglect bump），实为 ' + v);", 0],
  ['（r370 bump 后基线同步为 6.8.190）', '（r385 基线同步：r380 bump 至 6.8.192）', 0],
  ['（基线 6.8.190）', '（基线 6.8.192）', 0],
];

// round-295 专属：标题/头部注释计数 + 补族
const R295 = [
  ['A2 族表 41 族：35 econ + 6 stats', 'A2 族表 42 族：36 econ + 6 stats', 1],
  ['（41 族 = 35 econ + 6 stats', '（42 族 = 36 econ + 6 stats', 1],
  ['（41 族全中', '（42 族全中', 1],
  // 族清单尾注补 r385
  ['+ r379 固定费率偏误 1 + r381 劳动总量谬误 1', '+ r379 固定费率偏误 1 + r381 劳动总量谬误 1 + r385 绝对优势≠比较优势 1', 1],
];

// round-295 需新增的两条（攻击样本 + 注入键）——插在 lump_of_labor 之后
const R295_ATTACK_ANCHOR = "  lump_of_labor: '机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的，自动化的尽头是大大规模失业。',";
// 上面 anchor 若与磁盘不完全一致会漏插，下面用更短的唯一子串兜底
const R295_ATTACK_ANCHOR2 = "  lump_of_labor: '机器人每取代一个岗位";
const R295_ATTACK_ADD = "  comparative_advantage: 'A国在粮食和工业品上的生产效率都全面高于B国，所以A国根本没必要和B国开展贸易。',";

const R295_INJECT_ANCHOR = "  lump_of_labor: ['JOBS_ZH', 'JOBS_EN', 'FIXED_ZH_F1', 'FIXED_ZH_F2', 'FIXED_ZH_F3', 'FIXED_ZH_F4', 'FIXED_ZH_F5', 'FIXED_EN_F1', 'FIXED_EN_F2', 'FIXED_EN_F3', 'FIXED_EN_F4', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],";
const R295_INJECT_ADD = "  comparative_advantage: ['ADV_ZH_F1', 'ADV_ZH_F2', 'ADV_ZH_F3', 'ADV_ZH_F4', 'ADV_ZH_F5', 'ADV_EN_F1', 'ADV_EN_F2', 'ADV_EN_F3', 'ADV_EN_F4', 'ADV_EN_F5', 'NOGAIN_ZH_F1', 'NOGAIN_ZH_F2', 'NOGAIN_ZH_F3', 'NOGAIN_ZH_F4', 'NOGAIN_EN_F1', 'NOGAIN_EN_F2', 'NOGAIN_EN_F3', 'NOGAIN_EN_F4', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],";

function applyRepls(text, repls, label) {
  const report = [];
  for (const [oldStr, newStr, minHits] of repls) {
    let count = 0;
    // 全文替换（这些字面量在各自文件里唯一或需多处同步）
    const parts = text.split(oldStr);
    count = parts.length - 1;
    if (count > 0) text = parts.join(newStr);
    if (minHits > 0 && count < minHits) {
      report.push(`  !! ${label} 期望≥${minHits} 实得 ${count}: ${JSON.stringify(oldStr.slice(0, 40))}`);
    }
  }
  return { text, report };
}

let anyMiss = false;
for (const f of FILES) {
  const fp = path.join(TEST, f);
  let text = fs.readFileSync(fp, 'utf8');
  const before = text;
  const r1 = applyRepls(text, COMMON, f);
  text = r1.text;
  let report = r1.report;
  if (f === 'round-295-econ-reasoning-wiring.test.js') {
    const r2 = applyRepls(text, R295, f);
    text = r2.text;
    report = report.concat(r2.report);
    // 插 ATTACK 样本
    if (text.includes('comparative_advantage:')) {
      report.push('  (round-295 comparative_advantage 已存在，跳过插入)');
    } else {
      const idx = text.indexOf(R295_INJECT_ANCHOR) >= 0 ? text.indexOf(R295_INJECT_ANCHOR) : text.indexOf(R295_ATTACK_ANCHOR2);
      // 攻击样本：找 lump_of_labor 攻击句行末插入
      const atkLineEnd = text.indexOf(R295_ATTACK_ANCHOR2);
      if (atkLineEnd < 0) { report.push('  !! 找不到 ATTACK lump_of_labor 锚'); anyMiss = true; }
      else {
        const lineEnd = text.indexOf('\n', atkLineEnd);
        text = text.slice(0, lineEnd + 1) + R295_ATTACK_ADD + '\n' + text.slice(lineEnd + 1);
      }
      // 注入键：找 lump_of_labor INJECT 行末插入
      const injIdx = text.indexOf(R295_INJECT_ANCHOR);
      if (injIdx < 0) { report.push('  !! 找不到 INJECT lump_of_labor 锚'); anyMiss = true; }
      else {
        const lineEnd = text.indexOf('\n', injIdx);
        text = text.slice(0, lineEnd + 1) + R295_INJECT_ADD + '\n' + text.slice(lineEnd + 1);
      }
    }
  }
  if (text !== before) {
    fs.writeFileSync(fp, text, 'utf8');
    const changed = report.filter(x => !x.startsWith('  ('));
    console.log(`OK   ${f}${changed.length ? '' : ' (仅插入)'}`);
    report.forEach(x => console.log(x));
  } else {
    console.log(`NONE ${f} (无变化)`);
  }
}
console.log(anyMiss ? '\n** 有锚未命中，请检查 **' : '\n迁移完成');
