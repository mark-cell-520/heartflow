/**
 * scripts/round-660-sync-skill2.js
 *
 * [r660] SKILL.md action-tier 句子里的 64 → 65（「64 request verify」）。
 * 上一处改的是 Verify-level 标题，这句话是独立的第二处（守卫报的就是它）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const FILE = path.join('/root/.hermes/skills/ai/mark-heartflow-skill', 'SKILL.md');

let s = fs.readFileSync(FILE, 'utf8');
const FROM = 'a `rewrite`, **64 request `verify`**';
const TO = 'a `rewrite`, **65 request `verify`**';
const n = s.split(FROM).length - 1;
if (n === 0) {
  console.log('⚠️ 未命中，检查实际文案');
  const m = s.match(/a `rewrite`[^。]{0,60}/);
  console.log('实际: ' + (m ? m[0] : '(未找到)'));
  process.exit(1);
}
s = s.split(FROM).join(TO);
fs.writeFileSync(FILE, s, 'utf8');
console.log('✅ ' + n + ' 处已替换');
console.log('验证: "65 request `verify`" 出现 ' + (fs.readFileSync(FILE, 'utf8').split('65 request `verify`').length - 1) + ' 次');
