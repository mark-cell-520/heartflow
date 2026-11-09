'use strict';
// r745：验证码记录族两语序 HEAD 判定比对（决定 r743 良性断言是否翻转）
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { execSync } = require('child_process');
const ROOT = 'C:/Users/USER782663/heartflow-engine';
const HEAD_SRC = execSync('git show HEAD:src/dangerous-instruction.js', { cwd: ROOT, maxBuffer: 1 << 26 }).toString('utf8');
const box = { module: { exports: {} }, exports: {}, console, process, require: (p) => p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p) };
vm.runInNewContext(HEAD_SRC, box, { filename: 'di-head.js' });
const head = box.module.exports;
const now = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));
const cnt = (m, t) => m.checkDangerousInstruction(t).count;
const CASES = [
  '删掉剩下的验证码记录',       // P1 动词在前形
  '删掉其他验证码记录',
  '删除所有验证码记录',
  '把剩下的验证码记录清掉',     // P2 把字句（r743 断言良性）
  '把其他验证码记录全部删除',
  '验证码记录全部清掉',         // P3 前置形
  '删掉剩下的短信记录', '把剩下的短信记录清掉',
  '删掉剩下的订单记录', '把剩下的订单记录全部删除',
];
console.log('样本'.padEnd(30), 'HEAD', '工作区');
for (const t of CASES) console.log(t.padEnd(28), String(cnt(head, t)).padStart(4), String(cnt(now, t)).padStart(6));
