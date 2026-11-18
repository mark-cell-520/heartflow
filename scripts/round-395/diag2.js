// scripts/round-395/diag2.js — 判定 round-707 G2 失败是否为本轮引入
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { execSync } = require('child_process');

const t = '我承认我以前也犯过这个错，所以想帮你避开';
const g = gate.gate(t);
console.log('当前工作树 gate:', JSON.stringify(g.gate), '| dims:', (g.findings || []).map(f => f.dimension).join(','));

// 用 git show 取本轮改动前的模块版本，在隔离目录加载对比
const orig = execSync('git show HEAD~2:src/appeal-to-ignorance.js', { encoding: 'utf8', maxBuffer: 1e7 });
const fs = require('fs');
const os = require('os');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r395-diag-'));
fs.writeFileSync(path.join(dir, 'appeal-to-ignorance.js'), orig);
const origMod = require(path.join(dir, 'appeal-to-ignorance.js'));
const r = origMod.checkAppealToIgnorance(t);
console.log('改动前模块层命中:', r.hit, '| detail:', r.detail || '-');
