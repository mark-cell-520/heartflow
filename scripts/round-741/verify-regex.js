const fs = require('fs');
const s = fs.readFileSync('C:/Users/USER782663/heartflow-engine/src/dangerous-instruction.js', 'utf8');
const m = s.match(/const DI_RETENTION_WINDOW = [^\n]+/)[0];
console.log('literal len', m.length);
const bsN = '[^。' + String.fromCharCode(92) + 'n.]';
console.log('contains [^。\\n.] (backslash-n):', m.includes(bsN));
const bsBsN = '[^。' + String.fromCharCode(92) + String.fromCharCode(92) + 'n.]';
console.log('contains [^。\\\\n.] (double backslash):', m.includes(bsBsN));
const rawNewline = '[^。' + String.fromCharCode(10) + '.]';
console.log('contains raw newline class:', m.includes(rawNewline));
// 实际编译验证：取该行 eval 成正则并测关键样本
const re = eval(m.replace(/^const DI_RETENTION_WINDOW = /, '').replace(/;$/, ''));
console.log('regex flags:', re.flags, 'source head:', re.source.slice(0, 30));
const cases = [
  ['A1', '，只保留最近 7 天的', true],
  ['B2', '只保留最近30天的记录，把其他', true],
  ['C1', '，除了最近7天的', true],
  ['C2', '，除最近30天的记录之外', true],
  ['C5', '，唯独最近7天的保留', true],
  ['D1', '，只保留近30天的', true],
  ['D2', '，只保留前3天的', true],
  ['D3', '，仅保留近两周的', true],
  ['E2', ' other than the last 7 days', true],
  ['K1', '，只保留最近一小时的操作', false],
  ['K3', '只保留最近一小时的记录，把其他', false],
  ['K4', '，除了最近一分钟的', false],
  ['K5', '，只保留最近 5 分钟的', false],
  ['K8', ' except the last 5 minutes', false],
  ['G6', ' keeping only the last 30 days', true],
];
let bad = 0;
for (const [tag, t, want] of cases) {
  const got = re.test(t);
  if (got !== want) { bad++; console.log(`  ** ${tag} got=${got} want=${want}  ${JSON.stringify(t)}`); }
}
console.log(bad === 0 ? 'REGEX-UNIT ALL OK' : `REGEX-UNIT ${bad} MISMATCH`);
