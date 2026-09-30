// 探针：定位 dropped 判据为何不吃 "every user is not a fool."。
// 二分法：把判据尾部从词表处截断，逐段放宽看哪一段开始拒绝 not。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const IDX = 4919;
const line = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8').split('\n')[IDX];
const m = line.match(/\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)/);
const body = m[1];

const DROPPED = body.replace("(?!not\\b|n't\\b)", '');
const S = 'every user is not a fool.';

// 从尾部开始逐段去掉末尾约束，测试 S 是否开始匹配
let re = new RegExp(DROPPED, 'i');
console.log('full            ' + re.test(S));

// 去掉尾部句读锚点
const noTail = DROPPED.replace(/\(\?=\\s\*\(\?:\[\.\,\;\:\!\?\]\|\$\)\)$/, '');
console.log('noTail applied=' + (noTail !== DROPPED));
if (noTail !== DROPPED) {
  try { console.log('noTail          ' + new RegExp(noTail, 'i').test(S)); }
  catch (e) { console.log('noTail COMPILE_ERR ' + e.message.slice(0, 60)); }
}

// 只保留判据前缀（every...users?） + is/are + 空白，看裸前缀是否匹配 S
const prefixMatch = body.match(/^(.*?)\\s\+\(\?:is\|are\)/);
if (prefixMatch) {
  const pre = prefixMatch[1] + '\\s+(?:is|are)\\s+';
  try { console.log('prefixOnly      ' + new RegExp(pre, 'i').test(S)); }
  catch (e) { console.log('prefix COMPILE_ERR ' + e.message.slice(0, 80)); }
}

// 检查 is\s+ 后到词表之间的原文
const afterIs = body.slice(body.indexOf('(?:is|are)'));
console.log('AFTER_IS_RAW ' + afterIs.slice(0, 120));
