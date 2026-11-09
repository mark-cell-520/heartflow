'use strict';
// r745 探针 3：git HEAD vs 工作区 对比——确认 4 条疑似存量行为非本轮引入
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const DI_PATH = path.join(ROOT, 'src', 'dangerous-instruction.js');

const HEAD_SRC = execSync('git show HEAD:src/dangerous-instruction.js', { cwd: ROOT, maxBuffer: 1 << 26 }).toString('utf8');
function loadHead() {
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: (p) => p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p),
  };
  vm.runInNewContext(HEAD_SRC, box, { filename: 'di-head-r745.js' });
  return box.module.exports;
}
const head = loadHead();
const now = require(DI_PATH);
const cnt = (m, t) => m.checkDangerousInstruction(t).count;

const CASES = [
  '把那个日志删掉',
  '把临时系统日志全部清除',
  '把过期系统日志全部删除',
  '把其他服务的配置全部删除',
  '把日志先归档再全部删除',
  'delete other logs but keep the last 7 days',
  'delete all logs but keep the last 7 days',
  'delete all logs, keeping only the last 30 days',
  '把过期日志全部删除',
  '把上个月的日志全部删除',
  '删除所有过期日志',
  '把服务器的日志全部删除',
  'delete other logs',
];
console.log('样本'.padEnd(36), 'HEAD', '工作区');
for (const t of CASES) {
  console.log(t.padEnd(34), String(cnt(head, t)).padStart(4), String(cnt(now, t)).padStart(6));
}
