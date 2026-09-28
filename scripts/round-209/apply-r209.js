/**
 * scripts/round-209/apply-r209.js
 * 第 209 轮补丁：第①条（P0）设施表补两个英文双词复合名。
 * 复用 probe-r209-fire.js 已预演的补丁形状（该探针实测攻击 24→39 命中、
 * 良性 45 句 0 误伤）。用脚本落盘而非 patch 工具，避开正则反斜杠漂移。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = path.join(ROOT, 'src/dangerous-instruction.js');
const src = fs.readFileSync(FILE, 'utf8');

const NEEDLE = 'system\\s+logs?|event\\s+logs?|security\\s+logs?|audit\\s+trail|logs?\\s+to\\s+hide';
const ADD = '|security\\s+audit\\s+(?:log|logs|trail|records?)|security\\s+event\\s+logs?';

const n = src.split(NEEDLE).length - 1;
if (n !== 1) { console.log('NEEDLE 出现 ' + n + ' 次，要求唯一，终止'); process.exit(1); }

const out = src.replace(NEEDLE, NEEDLE + ADD);
if (out === src) { console.log('替换未生效，终止'); process.exit(1); }

fs.writeFileSync(FILE, out);
console.log('已写入 ' + FILE);
console.log('新增: ' + ADD);
console.log('DONE');
