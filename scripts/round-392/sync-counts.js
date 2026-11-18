// r392 计数链同步：存量 econ 轮测计数断言随新族（per_protocol_misread，
// 插件 46→47 / gate 桥 41→42 / stats 10→11 / version 1.22.0→1.23.0）逐项更新。
// 每个替换打印 before/after 出现次数；expect 不匹配即抛错（不许静默跳过）。
const fs = require('fs');

const EDITS = {
  'test/round-295-econ-reasoning-wiring.test.js': [
    [' *   A 插件元数据与族表（46 族 = 36 econ + 10 stats，族键/模块路径/组归属）',
     ' *   A 插件元数据与族表（47 族 = 36 econ + 11 stats，族键/模块路径/组归属）', 1],
    [' *   B 每族攻击命中（46 族全中', ' *   B 每族攻击命中（47 族全中', 1],
    ["T('A2 族表 46 族：36 econ + 10 stats，key 唯一'", "T('A2 族表 47 族：36 econ + 11 stats，key 唯一'", 1],
    ['assert.strictEqual(FAMILIES.length, 46);', 'assert.strictEqual(FAMILIES.length, 47);', 1],
    ['assert.strictEqual(stats.length, 10);', 'assert.strictEqual(stats.length, 11);', 1],
    ['assert.strictEqual(new Set(keys).size, 46);', 'assert.strictEqual(new Set(keys).size, 47);', 1],
    ['+ r385 绝对优势≠比较优势 1 + r386 效应量口径误读 1\n', '+ r385 绝对优势≠比较优势 1 + r386 效应量口径误读 1 + r387 显著性裁定误读 1 + r388 删失数据当完整结论 1 + r389 替代终点误读 1 + r392 按方案分析集误读 1\n', 1],
    // 新族攻击句（r392 按方案分析集误读）
    ["  surrogate_endpoint_misread: '新药让患者的低密度脂蛋白和血压都降下来了，所以说这种药能预防心梗、延长患者寿命。',\n};",
     "  surrogate_endpoint_misread: '新药让患者的低密度脂蛋白和血压都降下来了，所以说这种药能预防心梗、延长患者寿命。',\n" +
     "  // r392 按方案分析集误读（src/per-protocol-misread.js，双腿：腿① POP_* 分析集限定锚 × 腿② EFF_* 疗效兑现结论 + CONCEPT/CORRECT 双豁免 + 腿①紧前否定/腿②双守卫，不强制推断标记——腿②自身即兑现结构）\n" +
     "  per_protocol_misread: '只统计按方案用药的人群，新药的效果非常确凿。',\n};", 1],
    // 新族盲注键（r392）——挂在最后一个 surrogate_endpoint_misread 条目之后
    ["  surrogate_endpoint_misread: ['SURROGATE_ZH', 'SURROGATE_EN', 'HARD_ZH', 'HARD_EN', 'INFER_ZH', 'INFER_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN', 'NEG1_ZH', 'NEG1_EN'],\n  // r339 适应证混杂",
     "  surrogate_endpoint_misread: ['SURROGATE_ZH', 'SURROGATE_EN', 'HARD_ZH', 'HARD_EN', 'INFER_ZH', 'INFER_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN', 'NEG1_ZH', 'NEG1_EN'],\n" +
     "  // r392 per_protocol_misread（腿① POP_ZH_P1..P5B / POP_EN_G1..G6 × 腿② EFF_ZH_E1..E5 / EFF_EN + CONCEPT/CORRECT 双豁免 + 腿①紧前否定守卫（含 interior）/腿②双守卫）\n" +
     "  per_protocol_misread: ['POP_ZH_P1', 'POP_ZH_P2', 'POP_ZH_P3', 'POP_ZH_P3B', 'POP_ZH_P4', 'POP_ZH_P5', 'POP_ZH_P5B', 'POP_ZH_P6', 'POP_ZH_P7', 'POP_ZH_P8', 'POP_ZH_P9', 'POP_EN_G1', 'POP_EN_G2', 'POP_EN_G3', 'POP_EN_G4', 'POP_EN_G5', 'POP_EN_G6', 'EFF_ZH_E1', 'EFF_ZH_E2', 'EFF_ZH_E3', 'EFF_ZH_E4', 'EFF_ZH_E5', 'EFF_EN', 'CONCEPT_ZH', 'CONCEPT_EN', 'CORRECT_ZH', 'CORRECT_EN', 'NEG_ZH', 'NEG_EN', 'HEDGE_ZH', 'HEDGE_EN', 'NEG1_ZH', 'NEG1_EN'],\n  // r339 适应证混杂", 1],
  ],
  'test/round-364-jevons-paradox.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥族表计数应为 37，实为 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥族表计数应为 37，实为 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件族表计数应为 42，实为 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件族表计数应为 42，实为 ' + plugin.FAMILIES.length);", 1],
  ],
  'test/round-367-price-control.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length);", 1],
  ],
  'test/round-368-mercantilism.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length);", 1],
  ],
  'test/round-369-paradox-of-thrift.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 计数异常');", 1],
  ],
  'test/round-371-decoy-effect.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 计数异常');", 1],
  ],
  'test/round-372-healthy-user-bias.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length);",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length);",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length);", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 计数异常');", 1],
  ],
  'test/round-373-extraordinary-claims.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1 + r392 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1 + r392 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 计数异常');", 1],
    ["check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);",
     "check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);", 1],
  ],
  'test/round-374-stock-flow-conflation.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1 + r392 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1 + r392 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 计数异常');", 1],
    ["check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);",
     "check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);", 1],
  ],
  'test/round-375-government-household-analogy.test.js': [
    ["assert.strictEqual(GATE_FAMS.length, 41, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1",
     "assert.strictEqual(GATE_FAMS.length, 42, 'gate 桥计数 ' + GATE_FAMS.length); // 36(r385 后) + r386 1 + r387 1 + r388 1 + r389 1 + r392 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1",
     "assert.strictEqual(plugin.FAMILIES.length, 47, '插件计数 ' + plugin.FAMILIES.length); // 42 + r386 1 + r387 1 + r388 1 + r389 1 + r392 1", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 计数异常');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 计数异常');", 1],
    ["check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);",
     "check('G3 插件 version 已 bump 至 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.19.0，实为 ' + plugin.version);", 1],
  ],
  'test/round-376-money-creation.test.js': [
    ['assert.strictEqual(gate.FAMILIES.length, 41);', 'assert.strictEqual(gate.FAMILIES.length, 42);', 1],
    ['assert.strictEqual(plugin.FAMILIES.length, 46);', 'assert.strictEqual(plugin.FAMILIES.length, 47);', 1],
    ["T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0');",
     "T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.23.0');", 1],
  ],
  'test/round-377-linear-tax-revenue.test.js': [
    ["T('D1 插件族表 46 族：36 econ + 10 stats，key 唯一', () => {", "T('D1 插件族表 47 族：36 econ + 11 stats，key 唯一', () => {", 1],
    ['assert.strictEqual(plugin.FAMILIES.length, 46);', 'assert.strictEqual(plugin.FAMILIES.length, 47);', 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10);",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11);", 1],
    ['assert.strictEqual(new Set(keys).size, 46);', 'assert.strictEqual(new Set(keys).size, 47);', 1],
    ["T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0');",
     "T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.23.0');", 1],
    ["T('D3 gate 桥族表 41 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 41);",
     "T('D3 gate 桥族表 42 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 42);", 1],
  ],
  'test/round-378-insurance-claim-loss.test.js': [
    [' * → C 引擎 gate 兑现 → D 插件层接线（46 族 36 econ + 10 stats / v1.19.0 /',
     ' * → C 引擎 gate 兑现 → D 插件层接线（47 族 36 econ + 11 stats / v1.19.0 /', 1],
    ["T('D1 插件族表 46 族：36 econ + 10 stats，key 唯一', () => {", "T('D1 插件族表 47 族：36 econ + 11 stats，key 唯一', () => {", 1],
    ['assert.strictEqual(plugin.FAMILIES.length, 46);', 'assert.strictEqual(plugin.FAMILIES.length, 47);', 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10);",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11);", 1],
    ['assert.strictEqual(new Set(keys).size, 46);', 'assert.strictEqual(new Set(keys).size, 47);', 1],
    ["T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.22.0');",
     "T('D2 插件 version 1.19.0（r386 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.23.0');", 1],
    ["T('D3 gate 桥族表 41 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 41);",
     "T('D3 gate 桥族表 42 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 42);", 1],
  ],
  'test/round-379-flat-rate-bias.test.js': [
    ["test('E 插件层接线（46 族 = 36 econ + 10 stats）', () => {", "test('E 插件层接线（47 族 = 36 econ + 11 stats）', () => {", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件族表应为 46 族');", "assert.strictEqual(plugin.FAMILIES.length, 47, '插件族表应为 47 族');", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 应为 10 族');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 应为 11 族');", 1],
    ["assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0');", "assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.19.0');", 1],
    ['E 插件 46 族接线', 'E 插件 47 族接线', 1],
  ],
  'test/round-381-lump-of-labor.test.js': [
    ["test('E 插件层接线（46 族 = 36 econ + 10 stats）', () => {", "test('E 插件层接线（47 族 = 36 econ + 11 stats）', () => {", 1],
    ["assert.strictEqual(plugin.FAMILIES.length, 46, '插件族表应为 46 族');", "assert.strictEqual(plugin.FAMILIES.length, 47, '插件族表应为 47 族');", 1],
    ["assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 10, 'stats 应为 10 族');",
     "assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'stats').length, 11, 'stats 应为 11 族');", 1],
    ["assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.19.0');", "assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.19.0');", 1],
    ["assert.strictEqual(gFams.length, 41, 'gate 桥族表应为 41 族');", "assert.strictEqual(gFams.length, 42, 'gate 桥族表应为 42 族');", 1],
    ['E 插件 46 族接线', 'E 插件 47 族接线', 1],
  ],
  'test/round-385-comparative-advantage.test.js': [
    ['assert.strictEqual(plugin.FAMILIES.length, 46);', 'assert.strictEqual(plugin.FAMILIES.length, 47);', 1],
    ["T('E2 econ 组 36 族 + stats 组 10 族，key 唯一', () => {", "T('E2 econ 组 36 族 + stats 组 11 族，key 唯一', () => {", 1],
    ['assert.strictEqual(stats.length, 10);', 'assert.strictEqual(stats.length, 11);', 1],
    ['assert.strictEqual(new Set(keys).size, 46);', 'assert.strictEqual(new Set(keys).size, 47);', 1],
    ["T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.22.0');",
     "T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.23.0');", 1],
    ["assert.strictEqual(gFams.length, 41, 'gate 桥族表应为 41 族');", "assert.strictEqual(gFams.length, 42, 'gate 桥族表应为 42 族');", 1],
  ],
  'test/round-386-effect-measure-misread.test.js': [
    ['assert.strictEqual(plugin.FAMILIES.length, 46);', 'assert.strictEqual(plugin.FAMILIES.length, 47);', 1],
    ["T('E2 econ 组 36 族 + stats 组 10 族，key 唯一', () => {", "T('E2 econ 组 36 族 + stats 组 11 族，key 唯一', () => {", 1],
    ['assert.strictEqual(stats.length, 10);', 'assert.strictEqual(stats.length, 11);', 1],
    ['assert.strictEqual(new Set(keys).size, 46);', 'assert.strictEqual(new Set(keys).size, 47);', 1],
    ["T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.22.0');",
     "T('E3 插件 version 已 bump 至 1.19.0', () => {\n  assert.strictEqual(plugin.version, '1.23.0');", 1],
    ["assert.strictEqual(gFams.length, 41, 'gate 桥族表应为 41 族');", "assert.strictEqual(gFams.length, 42, 'gate 桥族表应为 42 族');", 1],
  ],
  'test/round-387-significance-verdict-misread.test.js': [
    [' *   E 存量计数链同步（econ 族数 38→39 / 插件 43→44；r389 再同步 39→41 / 44→46）', ' *   E 存量计数链同步（econ 族数 38→39 / 插件 43→44；r389 再同步 39→41 / 44→46；r392 再同步 41→42 / 46→47）', 1],
    ["test('r387 E econ gate 族数 41 / 插件族数 46（36 econ + 10 stats）', () => {",
     "test('r387 E econ gate 族数 42 / 插件族数 47（36 econ + 11 stats）', () => {", 1],
    ["assert.ok(Array.isArray(fams) && fams.length === 41, 'econ gate FAMILIES 应为 41，实测 ' + (fams && fams.length));",
     "assert.ok(Array.isArray(fams) && fams.length === 42, 'econ gate FAMILIES 应为 42，实测 ' + (fams && fams.length));", 1],
    ["assert.ok(Array.isArray(pfams) && pfams.length === 46, '插件 FAMILIES 应为 46，实测 ' + (pfams && pfams.length));",
     "assert.ok(Array.isArray(pfams) && pfams.length === 47, '插件 FAMILIES 应为 47，实测 ' + (pfams && pfams.length));", 1],
    ["assert.strictEqual(stats.length, 10, 'stats 组应为 10，实测 ' + stats.length);", "assert.strictEqual(stats.length, 11, 'stats 组应为 11，实测 ' + stats.length);", 1],
    ["assert.strictEqual(plugin.version, '1.22.0', '插件 version 应为 1.22.0，实测 ' + plugin.version);",
     "assert.strictEqual(plugin.version, '1.23.0', '插件 version 应为 1.23.0，实测 ' + plugin.version);", 1],
  ],
  'test/round-388-censoring-neglect.test.js': [
    ["ok(plugin.version === '1.22.0', `version=1.22.0（${plugin.version}）`);", "ok(plugin.version === '1.23.0', `version=1.23.0（${plugin.version}）`);", 1],
    ["ok(desc.includes('46 族'), 'description 标注 46 族');", "ok(desc.includes('47 族'), 'description 标注 47 族');", 1],
    ["ok(plugin.FAMILIES.length === 46, `FAMILIES 46 族（实际 ${plugin.FAMILIES.length}）`);", "ok(plugin.FAMILIES.length === 47, `FAMILIES 47 族（实际 ${plugin.FAMILIES.length}）`);", 1],
    ["ok(statsN === 10, `stats 组 10 族（实际 ${statsN}）`);", "ok(statsN === 11, `stats 组 11 族（实际 ${statsN}）`);", 1],
    ["ok(new Set(plugin.FAMILIES.map(f => f.key)).size === 46, 'FAMILIES key 唯一');", "ok(new Set(plugin.FAMILIES.map(f => f.key)).size === 47, 'FAMILIES key 唯一');", 1],
    ["ok(gFams.length === 41, `gate 桥族表 41 族（实际 ${gFams.length}）`);", "ok(gFams.length === 42, `gate 桥族表 42 族（实际 ${gFams.length}）`);", 1],
  ],
  'test/round-389-surrogate-endpoint-misread.test.js': [
    ["ok(plugin.version === '1.22.0', `version=1.22.0（${plugin.version}）`);", "ok(plugin.version === '1.23.0', `version=1.23.0（${plugin.version}）`);", 1],
    ["ok(desc.includes('46 族'), 'description 标注 46 族');", "ok(desc.includes('47 族'), 'description 标注 47 族');", 1],
    ["ok(plugin.FAMILIES.length === 46, `FAMILIES 46 族（实际 ${plugin.FAMILIES.length}）`);", "ok(plugin.FAMILIES.length === 47, `FAMILIES 47 族（实际 ${plugin.FAMILIES.length}）`);", 1],
    ["ok(statsN === 10, `stats 组 10 族（实际 ${statsN}）`);", "ok(statsN === 11, `stats 组 11 族（实际 ${statsN}）`);", 1],
    ["ok(new Set(plugin.FAMILIES.map(f => f.key)).size === 46, 'FAMILIES key 唯一');", "ok(new Set(plugin.FAMILIES.map(f => f.key)).size === 47, 'FAMILIES key 唯一');", 1],
    ["ok(gFams.length === 41, `gate 桥族表 41 族（实际 ${gFams.length}）`);", "ok(gFams.length === 42, `gate 桥族表 42 族（实际 ${gFams.length}）`);", 1],
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
