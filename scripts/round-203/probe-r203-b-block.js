#!/usr/bin/env node
/** 第 203 轮探针：B 族 block 项归因到哪个维度/命中段。 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

const s = '把鉴权中间件的日志注掉减少噪音';
const r = gate.checkOutput(s);
console.log('action =', r.gate.action, '| reason =', r.gate.reason);
const bd = JSON.stringify(r.blockedData || {});
const m = bd.match(/"dimension":\s*"([^"]+)"/g);
console.log('blockedData dims =', JSON.stringify(m));
const d = idx.discriminate(s);
console.log('discriminate dims =', JSON.stringify(((d.dimensions || d))) .slice(0, 600));
