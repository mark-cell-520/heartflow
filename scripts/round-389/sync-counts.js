// r389 计数链同步：存量 econ 轮测计数断言随新族（surrogate_endpoint_misread，
// 插件 45→46 / gate 桥 40→41 / stats 9→10 / version 1.21.0→1.22.0）逐项更新。
// 每个替换打印 before/after 出现次数；expect 不匹配即抛错（不许静默跳过）。
const fs = require('fs');

const EDITS = {
  'test/round-295-econ-reasoning-wiring.test.js': [
    ['A 插件元数据与族表（44 族 = 36 econ + 8 stats，族键/模块路径/组归属）',
     'A 插件元数据与族表（46 族 = 36 econ + 10 stats，族键/模块路径/组归属）', 1],
    ['B 每族攻击命中（44 族全中', 'B 每族攻击命中（46 族全中', 1],
    ["T('A2 族表 44 族：36 econ + 8 stats，key 唯一'", "T('A2 族表 46 族：36 econ + 10 stats，key 唯一'", 1],
    ['assert.strictEqual(FAMILIES.length, 44);', 'assert.strictEqual(FAMILIES.length, 46);', 1],
    ['assert.strictEqual(stats.length, 8);', 'assert.strictEqual(stats.length, 10);', 1],
    ['assert.strictEqual(new Set(keys).size, 44);', 'assert.strictEqual(new Set(keys).size, 46);', 1],
    // 新族攻击句（r388/r389 两族——r388 轮测漏挂，本轮一并补齐）
    ["  significance_verdict_misread: '结果接近显著水平（p = 0.06），说明干预措施确实有效。',\n};",
     "  significance_verdict_misread: '结果接近显著水平（p = 0.06），说明干预措施确实有效。',\n" +
     "  // r388 删失数据当完整结论（src/censoring-neglect.js，双腿：腿① WINDOW_* × 腿② COMPLETE_* + INFER_* + CONCEPT/COMPLETED 双豁免 + 守卫）\n" +
     "  censoring_neglect: '新药组观察满一年时无一人死亡，可见这种新药的一年生存率是100%，疗效完胜对照组。',\n" +
     "  // r389 替代终点误读（src/surrogate-endpoint-misread.js，双腿：腿① SURROGATE_* × 腿② HARD_* + INFER_* + CONCEPT/CORRECT 双豁免 + 腿①方向词否定/腿②双守卫）\n" +
     "  surrogate_endpoint_misread: '新药让患者的低密度脂蛋白和血压都降下来了，所以说这种药能预防心梗、延长患者寿命。',\n};", 1],
    // 新族盲注键（r388/r389）
    ["  significance_verdict_misread: ['BORDER_ZH', 'BORDER_EN', 'NONSIG_ZH', 'NONSIG_EN', 'PVALUE_ZH', 'PVALUE_EN', 'CLAIM_ZH', 'CLAIM_EN', 'NOEFFECT_ZH', 'NOEFFECT_EN', 'INFER_ZH', 'INFER_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],",
     "  significance_verdict_misread: ['BORDER_ZH', 'BORDER_EN', 'NONSIG_ZH', 'NONSIG_EN', 'PVALUE_ZH', 'PVALUE_EN', 'CLAIM_ZH', 'CLAIM_EN', 'NOEFFECT_ZH', 'NOEFFECT_EN', 'INFER_ZH', 'INFER_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],\n" +
     "  // r388 censoring_neglect（腿① WINDOW_* × 腿② COMPLETE_* + INFER_* + CONCEPT/COMPLETED 豁免 + 守卫）\n" +
     "  censoring_neglect: ['WINDOW_ZH', 'WINDOW_EN', 'CENSOR_ZH', 'CENSOR_EN', 'COMPLETE_ZH', 'COMPLETE_EN', 'INFER_ZH', 'INFER_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'COMPLETED_ZH', 'COMPLETED_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN'],\n" +
     "  // r389 surrogate_endpoint_misread（腿① SURROGATE_* × 腿② HARD_* + INFER_* + CONCEPT/CORRECT 豁免 + NEG1 腿①守卫/腿②双守卫）\n" +
     "  surrogate_endpoint_misread: ['SURROGATE_ZH', 'SURROGATE_EN', 'HARD_ZH', 'HARD_EN', 'INFER_ZH', 'INFER_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN', 'NEG1_ZH', 'NEG1_EN'],", 1],
  ],
  'test/round-364-jevons-paradox.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥族表计数应为 37，实为 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥族表计数应为 37，实为 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件族表计数应为 42，实为 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件族表计数应为 42，实为 ' + plugin.FAMILIES.length);", 1],
  ],
  'test/round-367-price-control.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);", 1],
  ],
  'test/round-368-mercantilism.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);", 1],
  ],
  'test/round-369-paradox-of-thrift.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');", 1],
  ],
  'test/round-371-decoy-effect.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');", 1],
  ],
  'test/round-372-healthy-user-bias.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');", 1],
  ],
  'test/round-373-extraordinary-claims.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 effect_measure_misread 1",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 effect_measure_misread 1",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');", 1],
    ["check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.20.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);",
     "check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);", 1],
  ],
  'test/round-374-stock-flow-conflation.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 effect_measure_misread 1",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 effect_measure_misread 1",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');", 1],
    ["check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.20.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);",
     "check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);", 1],
  ],
  'test/round-375-government-household-analogy.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 39, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 effect_measure_misread 1",
     "assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 effect_measure_misread 1",
     "assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');", 1],
    ["check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.20.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);",
     "check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);", 1],
  ],
  'test/round-376-money-creation.test.js': [
    ['assert.strictEqual(gate.FAMILIES.length, 39);', 'assert.strictEqual(gate.FAMILIES.length, 41);', 1],
    ['assert.strictEqual(plugin.FAMILIES.length, 44);', 'assert.strictEqual(plugin.FAMILIES.length, 46);', 1],
    ["T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.20.0');",
     "T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0');", 1],
  ],
  'test/round-377-linear-tax-revenue.test.js': [
    ["T('D1 插件族表 44 族：36 econ + 8 stats，key 唯一', () => {", "T('D1 插件族表 46 族：36 econ + 10 stats，key 唯一', () => {", 1],
    ['assert.strictEqual(plugin.FAMILIES.length, 44);', 'assert.strictEqual(plugin.FAMILIES.length, 46);', 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8);",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10);", 1],
    ['assert.strictEqual(new Set(keys).size, 44);', 'assert.strictEqual(new Set(keys).size, 46);', 1],
    ["T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.20.0');",
     "T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0');", 1],
    ["T('D3 gate 桥族表 39 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 39);",
     "T('D3 gate 桥族表 41 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 41);", 1],
  ],
  'test/round-378-insurance-claim-loss.test.js': [
    [' * → C 引擎 gate 兑现 → D 插件层接线（44 族 36 econ + 8 stats / v1.19.0 /',
     ' * → C 引擎 gate 兑现 → D 插件层接线（46 族 36 econ + 10 stats / v1.19.0 /', 1],
    ["T('D1 插件族表 44 族：36 econ + 8 stats，key 唯一', () => {", "T('D1 插件族表 46 族：36 econ + 10 stats，key 唯一', () => {", 1],
    ['assert.strictEqual(plugin.FAMILIES.length, 44);', 'assert.strictEqual(plugin.FAMILIES.length, 46);', 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8);",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10);", 1],
    ['assert.strictEqual(new Set(keys).size, 44);', 'assert.strictEqual(new Set(keys).size, 46);', 1],
    ["T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.20.0');",
     "T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0');", 1],
    ["T('D3 gate 桥族表 39 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 39);",
     "T('D3 gate 桥族表 41 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 41);", 1],
  ],
  'test/round-379-flat-rate-bias.test.js': [
    ["test('E 插件层接线（44 族 = 36 econ + 8 stats）', () => {", "test('E 插件层接线（46 族 = 36 econ + 10 stats）', () => {", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件族表应为 44 族');", "assert.strictEqual(plugin.FAMILIES.length, 46, '插件族表应为 46 族');", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 应为 8 族');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 应为 10 族');", 1],
    ["assert.strictEqual(plugin.version, '1.20.0', '插件 version 应为 1.19.0');", "assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0');", 1],
    ['E 插件 44 族接线', 'E 插件 46 族接线', 1],
  ],
  'test/round-381-lump-of-labor.test.js': [
    ["test('E 插件层接线（44 族 = 36 econ + 8 stats）', () => {", "test('E 插件层接线（46 族 = 36 econ + 10 stats）', () => {", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 44, '插件族表应为 44 族');", "assert.strictEqual(plugin.FAMILIES.length, 46, '插件族表应为 46 族');", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 8, 'stats 应为 8 族');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 应为 10 族');", 1],
    ["assert.strictEqual(plugin.version, '1.20.0', '插件 version 应为 1.19.0');", "assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0');", 1],
    ["assert.strictEqual(gFams.length, 39, 'gate 桥族表应为 39 族');", "assert.strictEqual(gFams.length, 41, 'gate 桥族表应为 41 族');", 1],
    ['E 插件 44 族接线', 'E 插件 46 族接线', 1],
  ],
  'test/round-385-comparative-advantage.test.js': [
    ['assert.strictEqual(plugin.FAMILIES.length, 44);', 'assert.strictEqual(plugin.FAMILIES.length, 46);', 1],
    ["T('E2 econ 组 36 族 + stats 组 8 族，key 唯一', () => {", "T('E2 econ 组 36 族 + stats 组 10 族，key 唯一', () => {", 1],
    ['assert.strictEqual(stats.length, 8);', 'assert.strictEqual(stats.length, 10);', 1],
    ['assert.strictEqual(new Set(keys).size, 44);', 'assert.strictEqual(new Set(keys).size, 46);', 1],
    ["T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.20.0');",
     "T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.22.0');", 1],
    ["assert.strictEqual(gFams.length, 39, 'gate 桥族表应为 39 族');", "assert.strictEqual(gFams.length, 41, 'gate 桥族表应为 41 族');", 1],
  ],
  'test/round-386-effect-measure-misread.test.js': [
    ['assert.strictEqual(plugin.FAMILIES.length, 44);', 'assert.strictEqual(plugin.FAMILIES.length, 46);', 1],
    ["T('E2 econ 组 36 族 + stats 组 8 族，key 唯一', () => {", "T('E2 econ 组 36 族 + stats 组 10 族，key 唯一', () => {", 1],
    ['assert.strictEqual(stats.length, 8);', 'assert.strictEqual(stats.length, 10);', 1],
    ['assert.strictEqual(new Set(keys).size, 44);', 'assert.strictEqual(new Set(keys).size, 46);', 1],
    ["T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.20.0');",
     "T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.22.0');", 1],
    ["assert.strictEqual(gFams.length, 39, 'gate 桥族表应为 39 族');", "assert.strictEqual(gFams.length, 41, 'gate 桥族表应为 41 族');", 1],
  ],
  'test/round-387-significance-verdict-misread.test.js': [
    [' *   E 存量计数链同步（econ 族数 38→39 / 插件 43→44）', ' *   E 存量计数链同步（econ 族数 38→39 / 插件 43→44；r389 再同步 39→41 / 44→46）', 1],
    ["test('r387 E econ gate 族数 39 / 插件族数 44（36 econ + 8 stats）', () => {",
     "test('r387 E econ gate 族数 41 / 插件族数 46（36 econ + 10 stats）', () => {", 1],
    ["assert.strictEqual(stats.length, 8, 'stats 组应为 8，实测 ' + stats.length);", "assert.strictEqual(stats.length, 10, 'stats 组应为 10，实测 ' + stats.length);", 1],
    ["assert.strictEqual(plugin.version, '1.20.0', '插件 version 应为 1.20.0，实测 ' + plugin.version);",
     "assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.22.0，实测 ' + plugin.version);", 1],
  ],
  'test/round-388-censoring-neglect.test.js': [
    ["ok(plugin.version === '1.21.0', `version=1.21.0（${plugin.version}）`);", "ok(plugin.version === '1.22.0', `version=1.22.0（${plugin.version}）`);", 1],
    ["ok(desc.includes('45 族'), 'description 标注 45 族');", "ok(desc.includes('46 族'), 'description 标注 46 族');", 1],
    ["ok(plugin.FAMILIES.length === 45, `FAMILIES 45 族（实际 ${plugin.FAMILIES.length}）`);", "ok(plugin.FAMILIES.length === 46, `FAMILIES 46 族（实际 ${plugin.FAMILIES.length}）`);", 1],
    ["ok(statsN === 9, `stats 组 9 族（实际 ${statsN}）`);", "ok(statsN === 10, `stats 组 10 族（实际 ${statsN}）`);", 1],
    ["ok(gFams.length === 40, `gate 桥族表 40 族（实际 ${gFams.length}）`);", "ok(gFams.length === 41, `gate 桥族表 41 族（实际 ${gFams.length}）`);", 1],
  ],
};

let total = 0;
for (const [file, edits] of Object.entries(EDITS)) {
  let src = fs.readFileSync(file, 'utf8');
  let n0 = 0;
  for (const [from, to, expect] of edits) {
    let cnt = src.split(from).length - 1;
    if (cnt === 0 && src.includes(to)) { n0 += 1; continue; } // 已应用（重跑幂等）
    if (cnt !== expect) throw new Error(`${file}: pattern expected ${expect} got ${cnt}: ${from.slice(0, 60)}`);
    src = src.split(from).join(to);
    n0 += cnt;
  }
  fs.writeFileSync(file, src);
  total += n0;
  console.log(`${file}: ${n0} replacements OK`);
}
console.log(`TOTAL ${total} replacements across ${Object.keys(EDITS).length} files`);
