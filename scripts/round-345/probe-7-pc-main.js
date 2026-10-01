// r345 probe-7：检查 PSEUDO_CAUSAL_ZH 主表（不含 ⑩支）对本族是否有判据。
// 关键发现线索：PC_OTHERFACTOR_ZH 含「因为」——会把「因为…」开头的全族误判为对冲。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');

const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
const m = src.match(/const PSEUDO_CAUSAL_ZH = \[([\s\S]*?)\n\];/);
if (!m) { console.log('PSEUDO_CAUSAL_ZH 提取失败'); process.exit(1); }
const SANDBOX = { RegExp, PC_SEQ_ZH: /自从|之后/, PC_ATTRIB_ZH: /显然/ };
const PATS = vm.runInNewContext('([' + m[1] + '])', SANDBOX);
console.log('主表判据条数 =', PATS.length);

const SAMPLES = [
  '他成功就是因为他每天都早起',
  '股价上涨是因为我穿了幸运色',
  '项目能成是因为我那天朝东边拜了拜',
  '他成功了因为他每天都早起',
  '股价涨是因为我穿了幸运色',
];

for (let i = 0; i < PATS.length; i++) {
  const hits = SAMPLES.filter(s => { try { return PATS[i].test(s); } catch (_) { return false; } });
  console.log(`  #${i + 1} 命中 ${hits.length}/${SAMPLES.length}`);
}
