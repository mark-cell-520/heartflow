// r744 探针 3：gate 层动作 + dev 双向对齐实效 + P3 双承载正确形
'use strict';
const path = require('path');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const di = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));
const gate = require(path.join(ROOT, 'src/gate.js')).gate;
const c = (t) => di.checkDangerousInstruction(t).count;
const g = (t) => { const r = gate(t); return (r && r.gate && r.gate.action) || '?'; };

console.log('== gate 层 ==');
for (const t of ['干掉所有日志', '把全部日志抹了', '系统日志全部弄掉', 'nuke all logs', 'zap all records', '删除所有上个月的日志', '删除所有昨天的审计记录', '本地调试时，干掉所有 debug 日志', '把过期的日志全部干掉', '清理所有临时日志', '清理所有日志']) {
  console.log(`${t} -> di=${c(t)} gate=${g(t)}`);
}
console.log('== P3 双承载正确形 ==');
for (const t of ['所有日志全部干掉', '其他日志统统抹了', '剩下的日志全部弄掉', '系统日志全部洗掉', '所有日志全部清理', '所有日志先归档', '所有日志全部备份']) {
  console.log(`${t} -> di=${c(t)}`);
}
console.log('== dev 语境双向对齐（CLEANUP_VERB 三齐）==');
for (const t of ['本地调试时，干掉所有 debug 日志', '开发环境，把调试日志全部抹了', '联调时将所有调试输出弄掉', '测试机上把缓存日志洗掉']) {
  console.log(`${t} -> di=${c(t)} gate=${g(t)}`);
}
console.log('== EN 上周期 lookbehind/lookahead 对齐 ==');
for (const t of ['delete all logs from last month', 'delete all logs from last week', 'nuke all logs from last year', 'delete all logs from yesterday', 'nuke all system logs']) {
  console.log(`${t} -> di=${c(t)}`);
}
