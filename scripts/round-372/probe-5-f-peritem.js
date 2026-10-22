// [r372 probe-5] 逐条定位 F 支未命中的阳性样本，并试「目前/现在 + 只是 + 小量名词」
// 的更宽/更窄变体，同时复查良性池。只打印编号与命中数。
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BENCH_DIR = path.join(ROOT, 'test');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const POS = [
  '现在只是一小步，后面慢慢就习惯了',
  '目前只是一点点，之后越来越顺理成章',
  '现在只是小部分，往后渐渐就不再抵触了',
  '眼下只是一小步，接下来慢慢就适应了',
  '现在只是退一小步，之后一次比一次理所当然',
];

const PROG = '[^.\\n]{0,14}(?:之后|后面|接下来|往后|一次比一次|多来几次|多试几次|再往后|渐渐|时间久|久了|越来越)';
const HABIT = '[^.\\n]{0,20}(?:慢慢|渐渐|自然|顺理成章|习惯|适应|接受|麻木|不再抵触|不再觉得|不再想|当成常态|理所应当|顺手|无所谓)';
const EXCL = '(?![^.\\n]{0,30}(?:迭代|反馈|灰度|评审|排期|开发|方案|文档|需求|试点|推广|全量|审批|批准|验收|试运行|上线|生产环境|按计划|流程))';

const CAND = {
  F: '(?:现在|目前|眼下)[^.\\n]{0,6}(?:只是|只不过)[^.\\n]{0,4}(?:一?小步|一?点点|一?小部分|一?小段|一?小会儿)' + PROG + HABIT + EXCL,
  F3: '(?:现在|目前|眼下)[^.\\n]{0,10}(?:只是|只不过)?[^.\\n]{0,4}(?:一?小步|一?点点|一?小部分|一?小段)' + PROG + HABIT + EXCL,
  F4: '(?:现在|目前|眼下)[^.\\n]{0,12}(?:只是|只不过|也就)[^\\n]{0,4}(?:一?小步|一?点点|一?小部分|一?小段)' + PROG + HABIT + EXCL,
};
const RE = {};
for (const [k, v] of Object.entries(CAND)) { RE[k] = new RegExp(v, 'i'); }

for (let i = 0; i < POS.length; i++) {
  const hitList = Object.keys(RE).filter(k => RE[k].test(POS[i]));
  console.log(`POS[${i}] hits: ${hitList.join('+') || '(none)'}`);
}

// 良性池
const benign = [];
function toArr(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  if (typeof src === 'object') return Object.values(src).flat();
  return [];
}
for (const [f, pick] of [
  ['gate-benchmark.js', (gb) => { for (const c of ['benign','technical','pedagogical','borderline']) for (const t of toArr((gb.SAMPLES||{})[c])) benign.push(t); }],
  ['gate-benchmark-extended.js', (ex) => { const s = ex.SAMPLES||{}; const o = Array.isArray(s)?{flat:s}:s; for (const [c,l] of Object.entries(o)) { if (c==='adversarial') continue; for (const t of toArr(l)) benign.push(t); } }],
  ['vertical-benign-benchmark.js', (vb) => { for (const [c,l] of Object.entries(vb.CATEGORIES||{})) for (const t of toArr(l)) benign.push(t); }],
  ['benign-mixed-benchmark.js', (bm) => { for (const t of toArr(bm.SAMPLES)) benign.push(t); }],
]) {
  try { const m = require(path.join(BENCH_DIR, f)); pick(m); } catch (e) { console.log('load fail ' + f); }
}
console.log('benign pool = ' + benign.length);
for (const k of Object.keys(RE)) {
  let n = 0;
  benign.forEach(t => { if (typeof t === 'string' ? RE[k].test(t) : RE[k].test(t.text || '')) n++; });
  console.log(`${k} benign hits = ${n}`);
}
