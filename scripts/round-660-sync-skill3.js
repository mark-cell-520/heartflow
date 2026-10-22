/**
 * scripts/round-660-sync-skill3.js
 *
 * [r660] SKILL.md 的 Verify-level 列举补 social_isolation（第三处拷贝）。
 * 上一轮 round-660-sync-skill.js 的 old_string 带了结尾引号所以没命中
 * （Markdown 行尾没有引号）——本脚本用行内锚点精确定位并追加维度名。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const FILE = path.join('/root/.hermes/skills/ai/mark-heartflow-skill', 'SKILL.md');

let s = fs.readFileSync(FILE, 'utf8');
const FROM = 'selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion';
const TO = 'selfharm_coercion, relationship_severance, fear_projection, silent_treatment_coercion, social_isolation';
const n = s.split(FROM).length - 1;
if (n === 0) {
  console.log('⚠️ 未命中锚点');
  process.exit(1);
}
s = s.split(FROM).join(TO);
fs.writeFileSync(FILE, s, 'utf8');
console.log('✅ ' + n + ' 处已追加 social_isolation');
console.log('验证: SKILL.md 中 social_isolation 出现 ' + (fs.readFileSync(FILE, 'utf8').split('social_isolation').length - 1) + ' 次');
