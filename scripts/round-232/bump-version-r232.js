#!/usr/bin/env node
'use strict';
// r232 版本递增 + 同步：VERSION 6.8.145 → 6.8.146（scripts/sync-version.js
// 只按 VERSION 同步不做递增，故递增在此做）
const fs = require('fs');
const path = require('path');
const root = '/root/hermes1/skills/ai/mark-heartflow-skill';

function bump() {
  const cur = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
  const m = cur.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error('VERSION 形态异常: ' + cur);
  const next = `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
  fs.writeFileSync(path.join(root, 'VERSION'), next + '\n');
  console.log(`VERSION ${cur} → ${next}`);
}
bump();
