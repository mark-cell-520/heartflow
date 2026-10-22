/** r599 最小复测：continuous-learner 对同一认知盲区是否重复灌库 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { lessonBank } = require(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const lbPath = require.resolve(path.join(ROOT, 'src/cortex/lesson-bank.js'));
const curDir = path.join(ROOT, 'data');

// 用临时副本测，不污染真实记忆库
const fs = require('node:fs');
const bankSrc = fs.readFileSync(lbPath, 'utf8');
// 找到数据文件路径
const m = /this\.dataFile\s*=\s*(.+)/.exec(bankSrc) || /dataFile\s*[:=]\s*(.+)/.exec(bankSrc);
console.log('dataFile 定位:', m ? m[1].trim().slice(0, 120) : '未找到');

// 直接数库里 auto_reflection 条目
if (typeof lessonBank.load === 'function') lessonBank.load();
const refl = lessonBank.lessons.filter(l => l.trigger === 'auto_reflection');
console.log('当前 auto_reflection 条数:', refl.length);
console.log('其中 confidence_gap 型:', refl.filter(l => String(l.content).includes('[confidence_gap]')).length);

// 归一化（去掉 think#NNN 与输入前缀）后的唯一形状数
const norm = new Set(refl.map(l =>
  String(l.content).replace(/think#\d+/g, 'N').replace(/对「[\s\S]*?」置信度仅 [\d.]+/, '对「X」置信度仅 C')));
console.log('归一化唯一形状数:', norm.size, '（=1 说明 160 条全是同一个盲区的重复记录）');
