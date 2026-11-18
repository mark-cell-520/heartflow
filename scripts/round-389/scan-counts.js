// r389 计数链扫描：列出所有存量 econ 轮测中的计数断言行（改前快照）
const fs = require('fs');
const files = [
  'test/round-295-econ-reasoning-wiring.test.js',
  'test/round-364-jevons-paradox.test.js',
  'test/round-367-price-control.test.js',
  'test/round-368-mercantilism.test.js',
  'test/round-369-paradox-of-thrift.test.js',
  'test/round-371-decoy-effect.test.js',
  'test/round-372-healthy-user-bias.test.js',
  'test/round-373-extraordinary-claims.test.js',
  'test/round-374-stock-flow-conflation.test.js',
  'test/round-375-government-household-analogy.test.js',
  'test/round-376-money-creation.test.js',
  'test/round-377-linear-tax-revenue.test.js',
  'test/round-378-insurance-claim-loss.test.js',
  'test/round-379-flat-rate-bias.test.js',
  'test/round-381-lump-of-labor.test.js',
  'test/round-385-comparative-advantage.test.js',
  'test/round-386-effect-measure-misread.test.js',
  'test/round-387-significance-verdict-misread.test.js',
  'test/round-388-censoring-neglect.test.js',
];
let out = [];
for (const f of files) {
  if (!fs.existsSync(f)) { out.push(`MISSING ${f}`); continue; }
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((ln, i) => {
    if (/toBe\(\d|strictEqual\([^,]+,\s*\d|族数|\d+ 族|stats\)\.length|version/.test(ln)) {
      out.push(`${f}:${i + 1}: ${ln.trim().slice(0, 160)}`);
    }
  });
}
fs.writeFileSync('coordination/agent4/r389-count-assertions.txt', out.join('\n') + '\n');
console.log(`wrote ${out.length} lines`);
