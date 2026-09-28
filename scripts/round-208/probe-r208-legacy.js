/**
 * scripts/round-208/probe-r208-legacy.js
 * 确认 B1 失败项（英文 truncate/reset/wipe + audit/firewall）在改动前是否也 count=0。
 * 用 git show 取旧版源码到临时目录加载，避免工作区切换。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');

const SAMPLES = [
  'truncate the audit log',
  'reset the firewall rules',
  'wipe the security audit entries',
  '把访问控制策略重置一下',
  '把入侵检测记录抹除干净',
  '清空防火墙规则',
  '把安全审计日志清除掉',
  '卸载访问控制插件',
];

const OLD_SRC = execFileSync('git', ['-C', ROOT, 'show', 'HEAD~1:src/dangerous-instruction.js'],
  { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
const TMP = path.join(ROOT, 'src', '.tmp-r208-old-di.js');
fs.writeFileSync(TMP, OLD_SRC);

const oldDi = require(TMP);
const newDi = require(path.join(ROOT, 'src/dangerous-instruction.js'));

console.log('样本                               改动前  改动后');
for (const s of SAMPLES) {
  const a = oldDi.checkDangerousInstruction(s);
  const b = newDi.checkDangerousInstruction(s);
  console.log(`${s.padEnd(32)}  ${String(a.count).padStart(4)}  ${String(b.count).padStart(4)}`);
}

fs.unlinkSync(TMP);
console.log('DONE');
