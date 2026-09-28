/**
 * scripts/round-209/apply3-r209.js
 * 第三处补丁：`records?` → `(?:log|logs|trail|records?|entries)`。
 * 实测（probe-r209-entries.js）：entries 形 3/18 格 pass（删/重置/清 三个
 * 动词），良性 3 条 0 误伤。与 records 同族（审计日志的条目名词），
 * 一并收口，避免留下同形残余格。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = path.join(ROOT, 'src/dangerous-instruction.js');
const src = fs.readFileSync(FILE, 'utf8');

const NEEDLE = '|security\\s+audit\\s+(?:log|logs|trail|records?)';
const ADD = '|security\\s+audit\\s+(?:logs?|trail|records?|entries)';

const n = src.split(NEEDLE).length - 1;
if (n < 1) { console.log('NEEDLE 未找到，终止'); process.exit(1); }
const out = src.split(NEEDLE).join(ADD);
fs.writeFileSync(FILE, out);
console.log(`替换 ${n} 处: records -> records + entries 并合并 log/logs`);
console.log('DONE');
