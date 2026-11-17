'use strict';
// r378 扩族义务批量同步：GATE_FAMS 33→34 / plugin.FAMILIES 38→39 /
// version 1.14.0→1.15.0（round-295 已单独手工更新——它的计数断言带长注释）。
const fs = require('fs');
const path = require('path');
const ROOT = '/data/home/heartflow/test';

const COUNT_FILES = [
  'round-364-jevons-paradox.test.js',
  'round-367-price-control.test.js',
  'round-368-mercantilism.test.js',
  'round-369-paradox-of-thrift.test.js',
  'round-371-decoy-effect.test.js',
  'round-372-healthy-user-bias.test.js',
  'round-373-extraordinary-claims.test.js',
  'round-374-stock-flow-conflation.test.js',
  'round-375-government-household-analogy.test.js',
];
const report = [];
for (const f of COUNT_FILES) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/assert\.strictEqual\(GATE_FAMS\.length, 33,/g, 'assert.strictEqual(GATE_FAMS.length, 34,');
  s = s.replace(/assert\.strictEqual\(plugin\.FAMILIES\.length, 38,/g, 'assert.strictEqual(plugin.FAMILIES.length, 39,');
  s = s.replace(/assert\.strictEqual\(plugin\.version, '1\.14\.0'/g, "assert.strictEqual(plugin.version, '1.15.0'");
  s = s.replace(/r377 linear_tax_revenue 1'/g, "r377 linear_tax_revenue 1 + r378 insurance_claim_loss 1'");
  s = s.replace(/money_creation 1 \+ r377 linear_tax_revenue 1;/g, 'money_creation 1 + r377 linear_tax_revenue 1 + r378 insurance_claim_loss 1;');
  if (s !== before) { fs.writeFileSync(p, s); report.push(f + ' updated'); } else report.push(f + ' NO-OP');
}

// r376：gate 33→34 / plugin 38→39 / version 1.14.0→1.15.0（标题注释同步）
{
  const p = path.join(ROOT, 'round-376-money-creation.test.js');
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace('assert.strictEqual(gate.FAMILIES.length, 33);', 'assert.strictEqual(gate.FAMILIES.length, 34);');
  s = s.replace('assert.strictEqual(plugin.FAMILIES.length, 38);', 'assert.strictEqual(plugin.FAMILIES.length, 39);');
  s = s.replace("T('D2 插件 version 1.14.0'", "T('D2 插件 version 1.15.0（r378 再 bump）'");
  s = s.replace("assert.strictEqual(plugin.version, '1.14.0');", "assert.strictEqual(plugin.version, '1.15.0');");
  fs.writeFileSync(p, s);
  report.push('round-376 updated');
}

// r377：D1 38→39/econ 32→33/set 38→39、D2 version、D3 gate 33→34
{
  const p = path.join(ROOT, 'round-377-linear-tax-revenue.test.js');
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace("T('D1 插件族表 38 族：32 econ + 6 stats，key 唯一', () => {\n  assert.strictEqual(plugin.FAMILIES.length, 38);\n  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 32);",
    "T('D1 插件族表 39 族：33 econ + 6 stats，key 唯一', () => {\n  assert.strictEqual(plugin.FAMILIES.length, 39);\n  assert.strictEqual(plugin.FAMILIES.filter(f => f.group === 'econ').length, 33);");
  s = s.replace('assert.strictEqual(new Set(keys).size, 38);\n  assert.ok(keys.includes(\'linear_tax_revenue\'));',
    "assert.strictEqual(new Set(keys).size, 39);\n  assert.ok(keys.includes('linear_tax_revenue') && keys.includes('insurance_claim_loss'));");
  s = s.replace("T('D2 插件 version 1.14.0', () => {\n  assert.strictEqual(plugin.version, '1.14.0');",
    "T('D2 插件 version 1.15.0（r378 再 bump）', () => {\n  assert.strictEqual(plugin.version, '1.15.0');");
  s = s.replace("T('D3 gate 桥族表 33 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 33);",
    "T('D3 gate 桥族表 34 族', () => {\n  assert.strictEqual(gate.FAMILIES.length, 34);");
  fs.writeFileSync(p, s);
  report.push('round-377 updated');
}
console.log(report.join('\n'));
