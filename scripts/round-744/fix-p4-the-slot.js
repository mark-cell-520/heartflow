// r744 一次性修补脚本：P4 量词后 the 槽可达（字面替换，非正则）
// 修复前：nuke all the logs / delete all the logs 漏放（the 在量词后不可达）
// 修复后：量词后 (?:the\s+)? 独立槽，原 all other logs / all the other logs 仍匹配
'use strict';
const fs = require('fs');
const P = 'C:/Users/USER782663/heartflow-engine/src/dangerous-instruction.js';
const OLD = '(?:all|every|each|any|the\\s+entire|the\\s+rest\\s+of(?:\\s+the)?)\\s+(?:(?:the\\s+)?(?:other|remaining|rest)\\s+)?';
const NEW = '(?:all|every|each|any|the\\s+entire|the\\s+rest\\s+of(?:\\s+the)?)\\s+(?:the\\s+)?(?:(?:other|remaining|rest)\\s+)?';
const s = fs.readFileSync(P, 'utf8');
const n = s.split(OLD).length - 1;
if (n !== 1) { console.error('anchor count != 1:', n); process.exit(1); }
fs.writeFileSync(P, s.replace(OLD, NEW));
console.log('P4 the-slot patched OK');
