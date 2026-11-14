'use strict';
// r335 官方四基准良性语料全量模块级直调（immortal_time_bias 路径 g）
// 只计路径 (g)（Will Rogers）命中——路径 (a)-(f) 的命中是既有基线。
// + 攻击集模块层归因核对（每条攻击必须命中且归因到路径 g）。
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const { checkImmortalTimeBias } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));

function flatten(mod) {
  const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  return out.filter(s => typeof s === 'string');
}
let n = 0, fp = 0, base = 0; const hits = [];
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
    n++;
    const r = checkImmortalTimeBias(s);
    if (r.hit) {
      if (r.detail.includes('Will Rogers') || r.detail.includes('will-rogers')) { fp++; hits.push(`[g][${f}] ${s.slice(0, 70)}`); }
      else base++;
    }
  }
}
console.log(`corpus: ${n} 条, 路径(g) FP ${fp}, 既有路径(a-f)基线命中 ${base}`);
for (const h of hits) console.log('FP:', h);

// ── 攻击集模块层归因核对 ──
const attacks = [
  ['g', '新的分期标准把一部分晚期患者重新划入中期，早期和中期生存率都上升了，说明新标准显著改善了预后。'],
  ['g', '医院把重症病人转到合作病区后，两个病区的死亡率都下降了，可见本院的 ICU 救治水平很高。'],
  ['g', '重新编班后，把成绩垫底的学生分出去，快班和慢班的平均分都提高了，这说明分层教学立竿见影。'],
  ['g', '新评级模型把部分 B 级客户上调到 A 级，A 级和 B 级的违约率都下降了，证明风控模型升级有效。'],
  ['g', '保险新政把健康人群分到优质池后，两个池子的赔付率都下降了，说明定价改革成功了。'],
  ['g', '公司把绩效垫底的员工调到其他组，两个组的满意度都上升了，说明这次调整立竿见影。'],
  ['g', '新医保目录把高价药剔除出去后，两个批次的报销比例都提高了，说明控费成效显著。'],
  ['g', '把差生剥离出去单独组班之后，两个班的平均分都上升了，可见因材施教取得了成功。'],
  ['g', '修订后的分级标准把一批中等风险客户升级到低风险档，两档的坏账率都下降了，说明新模型更加科学。'],
  ['g', '竞赛组委会把强队调入甲组，甲乙两组的胜率都提高了，证明分组改革明显改善了比赛质量。'],
  ['g', '院方把术后感染病人转移到专科病区，本院区和合作病区的感染率都下降了，可见管理升级成效显著。'],
  ['g', '新规将垫底商家移出推荐池后，首页和推荐池的转化率都上升了，说明平台治理见效了。'],
  ['g', 'Under the new staging criteria, some advanced cases were reclassified as intermediate, and survival rates rose in both groups — proof the new protocol works.'],
  ['g', 'After transferring the sickest patients to another ward, mortality rates dropped in both wards, showing excellent care.'],
  ['g', 'Re-bucketing the worst accounts into a new tier lowered the default rate in both tiers, so the new risk model works.'],
  ['g', 'Moving the failing students to a separate class raised the average scores in both classes, demonstrating the tracking reform succeeded.'],
  ['g', 'The insurer moved healthy policyholders into a preferred pool, and loss rates fell in both pools — evidence the repricing worked.'],
  ['g', 'Under the revised TNM criteria many patients were restaged to earlier stages, and five-year survival improved in both stages, proving the new standard is more accurate.'],
  ['g', 'After the weakest performers were reassigned to another team, satisfaction rose in both teams, showing the reorganization paid off.'],
  ['g', 'Promoting the riskiest borrowers from subprime to prime lowered delinquency in both buckets, so the new underwriting model is effective.'],
];
let ok = 0;
for (const [want, t] of attacks) {
  const r = checkImmortalTimeBias(t);
  const got = (r.detail.includes('Will Rogers') || r.detail.includes('will-rogers')) ? 'g' : '?';
  const mark = r.hit && got === want ? 'OK' : 'MISMATCH';
  if (mark === 'OK') ok++;
  console.log(`[${mark}] want=${want} got=${got} hit=${r.hit} :: ${t.slice(0, 34)}`);
}
console.log(`attacks: ${ok}/${attacks.length} 归因正确`);
process.exit(fp === 0 && ok === attacks.length && n >= 360 ? 0 : 1);
