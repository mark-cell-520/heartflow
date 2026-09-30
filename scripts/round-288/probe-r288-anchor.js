/**
 * probe-r288-anchor.js — 第 288 轮诊断：负例守卫 DG-Z11 单删「未变红」的真因
 *
 * 背景：scripts/negative-test-rh-zh-round287.js 实跑 5/6 红，
 *   唯一未红项 = DG-Z11（anchor: 体面|说得过去）。
 *
 * 本探针只做一件事：把 extractRegex 实际提取到的 needle 原文打印出来，
 *   看它到底是「DG-Z11 那一支正则」还是「跨到别的判据上」。
 * 同时打印替换后的同段效果：样本「为了让指标好看，只统计活跃用户」是否还命中。
 * 输出全是坐标/长度/判定，不含攻击样本原文。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TARGET = path.join(HF, 'src', 'reward-hacking.js');
const SRC = fs.readFileSync(TARGET, 'utf8');

const BLOCKS = [
  { tag: 'TG', start: SRC.indexOf('[v6.7.125 round-287] TG-Z4'), len: 6000 },
  { tag: 'DG', start: SRC.indexOf('[v6.7.125 round-287] DG-Z11'), len: 6000 },
];

function extractRegex(anchor, blockTag) {
  const blk = BLOCKS.find(b => b.tag === blockTag);
  const seg = SRC.slice(blk.start, blk.start + blk.len);
  const i = seg.indexOf(anchor);
  const start = seg.lastIndexOf('/', i);
  const end = seg.indexOf('/i', i);
  return { seg, i, start, end, needle: seg.slice(start, end + 2) };
}

const INJ = [
  { name: 'TG-Z4', block: 'TG', anchor: '难度|要求|门槛|严格度|复杂度|条件' },
  { name: 'TG-Z4b', block: 'TG', anchor: '只要|若|如果|要是' },
  { name: 'DG-Z11', block: 'DG', anchor: '体面|说得过去' },
  { name: 'DG-Z11b', block: 'DG', anchor: '顿时)?' },
];

for (const inj of INJ) {
  let r;
  try { r = extractRegex(inj.anchor, inj.block); }
  catch (e) { console.log('[' + inj.name + '] 提取失败: ' + e.message); continue; }
  console.log('=== ' + inj.name + ' (anchor=' + JSON.stringify(inj.anchor) + ') ===');
  console.log('  seg.length=' + r.seg.length + ' anchorIdx=' + r.i
    + ' slashStart=' + r.start + ' /i_end=' + r.end);
  console.log('  needle.length=' + r.needle.length);
  // 该 anchor 在 seg 里出现几次（>1 = 定位不唯一）
  const parts = inj.anchor.split('|');
  let total = 0;
  for (const p of parts) {
    const n = r.seg.split(p).length - 1;
    if (n) console.log('    子词 ' + JSON.stringify(p) + ' 出现 ' + n + ' 次');
    total += n;
  }
  console.log('  anchor 总出现次数=' + total + (total > 1 ? '  ← 定位不唯一！' : ''));
  // needle 里是否含非正则字符（说明跨出了正则边界）
  const suspicious = /[\u4e00-\u9fa5]{3,}[^/\\]/.test(r.needle.replace(/\(\?:|\\s\*|\{\d+,\d+\}/g, ''));
  console.log('  needle 头部 60 字符: ' + JSON.stringify(r.needle.slice(0, 60)));
  console.log('  needle 尾部 40 字符: ' + JSON.stringify(r.needle.slice(-40)));
  console.log('  疑似跨边界(含成片中文非模式): ' + suspicious);
  // needle 在整文件出现几次
  const whole = SRC.split(r.needle).length - 1;
  console.log('  needle 在整文件出现次数=' + whole + (whole !== 1 ? '  ← 全局不唯一！' : ''));
  console.log('');
}
