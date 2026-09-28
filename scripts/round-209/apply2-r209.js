/**
 * scripts/round-209/apply2-r209.js
 * 第二处补丁：`security event log(s)` 复数形。第一版只收 `security\s+event\s+logs?`
 * （log + 可选 s），但复数实际写作 `events log` —— audit 侧同理，
 * 第一版已收 `(?:log|logs|trail|records?)` 但 event 侧漏了 events。
 * 与 probe 实测一致：残余 3 格全部是 `the security events log`。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILE = path.join(ROOT, 'src/dangerous-instruction.js');
const src = fs.readFileSync(FILE, 'utf8');

const NEEDLE = '|security\\s+event\\s+logs?';
const ADD = '|security\\s+events?\\s+logs?';

const n = src.split(NEEDLE).length - 1;
if (n < 1) { console.log('NEEDLE 未找到，终止'); process.exit(1); }
const out = src.split(NEEDLE).join(ADD);
fs.writeFileSync(FILE, out);
console.log(`替换 ${n} 处: ${NEEDLE} -> ${ADD}`);
console.log('DONE');
