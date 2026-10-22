#!/usr/bin/env node
/* r623 更精确：探 think-pipeline 的 hookBus 变量名与插件注册点 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const tp = fs.readFileSync(path.join(ROOT, 'src/core/think-pipeline.js'), 'utf8');
console.log('=== think-pipeline hookBus 相关 ===');
tp.split('\n').forEach((l, i) => {
  if (/hookBus|_hookBus|plugins?\.|loadPlugin|registerPlugin/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 140));
  }
});

const hb = fs.readFileSync(path.join(ROOT, 'src/core/hooks'), { encoding: 'utf8' }) ;
// 读目录列表
try {
  const files = fs.readdirSync(path.join(ROOT, 'src/core/hooks'));
  console.log('=== src/core/hooks files ===', files.join(', '));
} catch (e) { console.log('no hooks dir'); }

// engine-dispatcher 的路由
const ed = fs.readFileSync(path.join(ROOT, 'src/core/engine-dispatcher.js'), 'utf8');
console.log('=== engine-dispatcher 是否引用 plugin ===');
ed.split('\n').forEach((l, i) => {
  if (/plugin|sycophan/.test(l)) console.log((i + 1) + ': ' + l.trim().slice(0, 140));
});
