#!/usr/bin/env node
/**
 * scripts/round-650-append-log.js
 *
 * [r650] 把本轮报告插到 UPGRADE_LOG.md 最前面（该文件是倒序：最新在上）。
 * 报告正文独立放在 scripts/round-650-report.md，避免 heredoc/引号问题。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const logPath = path.join(HF, 'UPGRADE_LOG.md');
const reportPath = path.join(HF, 'scripts/round-650-report.md');

const report = fs.readFileSync(reportPath, 'utf8');
const old = fs.readFileSync(logPath, 'utf8');

if (old.includes('# 第 650 轮报告')) {
  console.log('⚠️  UPGRADE_LOG.md 已含第 650 轮报告，跳过（幂等）');
  process.exit(0);
}

fs.writeFileSync(logPath, report + '\n' + old);
console.log('✅ UPGRADE_LOG.md 已插入第 650 轮报告（' + report.length + ' 字符）');
