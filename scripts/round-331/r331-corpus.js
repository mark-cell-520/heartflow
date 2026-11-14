'use strict';
// r331 官方四基准良性语料全量模块级直调（immortal_time_bias 路径 e/f）
// + 攻击集模块级归因核对（每条攻击必须命中且归因到预期路径）。
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const { checkImmortalTimeBias } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));

function flatten(mod) {
  const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  return out.filter(s => typeof s === 'string');
}
let n = 0, fp = 0; const hits = [];
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
    n++;
    const r = checkImmortalTimeBias(s);
    if (r.hit) { fp++; hits.push(`[${f}] ${s.slice(0, 70)}`); }
  }
}
console.log(`corpus: ${n} 条, FP ${fp}`);
for (const h of hits) console.log('FP:', h);

// ── 攻击集模块级归因核对 ──
const attacks = [
  ['e', '筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。'],
  ['e', '早筛组患者的五年生存率明显更高，因为能被早期筛出来的癌症本身就是进展慢的惰性肿瘤。'],
  ['f', '体检筛查出来的结节多数终生不会恶变，可见筛查改善了患者的生存结局。'],
  ['e', '普筛检出的病例以温和型为主，这类病灶发展缓慢，因此筛查组的生存数据更好看。'],
  ['e', '筛查能优先找到那些不怎么进展的病灶，所以筛查组的生存率显著高于没筛查的人。'],
  ['e', '乳腺筛查查出的肿瘤往往是懒癌，所以坚持做筛查的人活得更久。'],
  ['f', '早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。'],
  ['f', '体检把很多终生不会有症状的微小病灶也找了出来，它们都被计入了筛查的救治成果。'],
  ['f', '筛查发现的早期病例里有很多本来不需要治疗，把它们的"治愈"算进去，筛查的收益极其可观。'],
  ['f', '基因检测查出的高危结节绝大多数永远不会癌变，这些检出案例说明检测拯救了生命。'],
  ['e', 'Cancers found by screening are mostly slow-growing indolent tumors, so screened patients naturally survive longer — screening works.'],
  ['e', 'The screened group has much better survival because screening preferentially detects slow-progressing disease.'],
  ['f', 'Most of the lesions screening picks up would never have caused any symptoms, and counting them as cured proves screening saves lives.'],
  ['f', 'A large share of screen-detected cancers never would have progressed, so the improvement in screened patients proves the program works.'],
];
let ok = 0;
for (const [want, t] of attacks) {
  const r = checkImmortalTimeBias(t);
  const got = r.detail.includes('病程长度偏误') || r.detail.includes('length-time-bias') ? 'e'
    : r.detail.includes('过度诊断') || r.detail.includes('overdiagnosis') ? 'f' : '?';
  const mark = r.hit && got === want ? 'OK' : 'MISMATCH';
  if (mark === 'OK') ok++;
  console.log(`[${mark}] want=${want} got=${got} hit=${r.hit} :: ${t.slice(0, 34)}`);
}
console.log(`attacks: ${ok}/${attacks.length} 归因正确`);
process.exit(fp === 0 && ok === attacks.length && n >= 360 ? 0 : 1);
