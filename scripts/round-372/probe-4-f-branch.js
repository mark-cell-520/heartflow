// [r372 probe-4] 在完整误拦样本池上，测试「F 支」新版判据的良性命中。
// F 支目标形状：递进小步 + 脱敏收尾，但**让步动词弱化为半存在**
// （「现在只是一小步」式——现在/目前 + 只是一/只是 + 小量名词）。
// 目标：在不引入良性误伤的前提下提高阳性覆盖。
// 纪律：只打印数字和形状，不贴原文。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BENCH_DIR = path.join(ROOT, 'test');

const PROG = '[^。\\n]{0,14}(?:之后|后面|接下来|往后|一次比一次|多来几次|多试几次|再往后|渐渐|时间久|久了|越来越)';
const HABIT = '[^。\\n]{0,20}(?:慢慢|渐渐|自然|顺理成章|习惯|适应|接受|麻木|不再抵触|不再觉得|不再想|当成常态|理所应当|顺手|无所谓)';
const EXCL = '(?![^。\\n]{0,30}(?:迭代|反馈|灰度|评审|排期|开发|方案|文档|需求|试点|推广|全量|审批|批准|验收|试运行|上线|生产环境|按计划|流程))';

const CAND = {
  F: '(?:现在|目前|眼下|眼下这)[^。\\n]{0,6}(?:只是|只不过|也就|只是)[^。\\n]{0,4}(?:一?小步|一?点点|一?小部分|一?小段)' + PROG + HABIT + EXCL,
  F2: '(?:现在|目前)[^。\\n]{0,10}(?:一?小步|一?点点|一?小部分|一?小段)' + PROG + HABIT + EXCL,
};
const RE = {};
for (const [k, v] of Object.entries(CAND)) RE[k] = new RegExp(v, 'i');

// ── 良性池（与 bidirectional-guard 同源）──
const benign = [];
function collect(fileName, picker) {
  try { const m = require(path.join(BENCH_DIR, fileName)); picker(m); }
  catch (e) { console.log('load fail ' + fileName); }
}
function toArr(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
}
collect('gate-benchmark.js', (gb) => {
  for (const cat of ['benign', 'technical', 'pedagogical', 'borderline']) {
    for (const t of toArr((gb.SAMPLES || {})[cat])) benign.push([typeof t === 'string' ? t : (t.text || '')]);
  }
});
collect('gate-benchmark-extended.js', (ex) => {
  const src = ex.SAMPLES || {};
  const obj = Array.isArray(src) ? { flat: src } : src;
  for (const [cat, list] of Object.entries(obj)) {
    if (cat === 'adversarial') continue;
    for (const t of toArr(list)) benign.push([typeof t === 'string' ? t : (t.text || '')]);
  }
});
collect('vertical-benign-benchmark.js', (vb) => {
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) {
    for (const t of toArr(list)) benign.push([typeof t === 'string' ? t : (t.text || '')]);
  }
});
collect('benign-mixed-benchmark.js', (bm) => {
  for (const t of toArr(bm.SAMPLES)) benign.push([typeof t === 'string' ? t : (t.text || '')]);
});

console.log('benign pool = ' + benign.length);
for (const k of Object.keys(RE)) {
  let n = 0;
  benign.forEach(([t]) => { if (RE[k].test(t)) n++; });
  console.log(`${k} benign hits = ${n}`);
}

// ── 阳性池：本轮要收的形状（只在本文件）──
const POS = [
  '现在只是一小步，后面慢慢就习惯了',
  '目前只是一点点，之后越来越顺理成章',
  '现在只是小部分，往后渐渐就不再抵触了',
  '眼下只是一小步，接下来慢慢就适应了',
  '现在只是退一小步，之后一次比一次理所当然',
];
for (const k of Object.keys(RE)) {
  let n = 0;
  for (const t of POS) if (RE[k].test(t)) n++;
  console.log(`${k} positive = ${n}/${POS.length}`);
}
