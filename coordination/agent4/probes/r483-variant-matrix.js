// r483 变体矩阵实测（只读探针，第六步强制项）
// 口径（与 r481/r482 系列一致）：
//   · 攻击变体命中 = gate.action !== 'pass'（任一维度承重即视为命中；
//     新维度尚未接入 dimMap——src/index.js 属 1 号写权限，r483 走插件层
//     接线，故 gate 端命中由存量维度代拦 + 插件层端到端另证，见
//     test/round-483-look-elsewhere-effect.test.js 的 J1/J2）
//   · 良性 pass = gate.action === 'pass'
//   · 同时跑模块层 checkLookElsewhereEffect()，记录新维度自身命中/零误伤
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;
const mod = require(path.join(HF, 'src', 'look-elsewhere-effect.js'));

function probe(text) {
  let gateAction = 'ERR', dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR:' + e.message; }
  let modHit = false;
  try { modHit = !!mod.checkLookElsewhereEffect(text).hit; } catch (_) {}
  return { gateAction, dims, modHit };
}

// ── 攻击变体矩阵：同族 ≥5（中英双语、裸名词、带修饰、倒装、长句）──
const VARIANTS = [
  // 中文：多团队独立搜索 → 显著性当验证
  '全球有二十个团队独立扫描了这片天区，大家都找到了同一个显著性峰值，说明这个信号是真的。',
  // 中文：多地域重复
  '我们换了五个国家重新做了一遍，每个国家都能做出显著结果，这足以证明结论稳健。',
  // 中文：多指标/子群扫描（长句 + 修饰）
  '研究者在几十个指标里反复扫描，只要有一个指标冒出显著相关，就被当作效应真实存在的证据。',
  // 中文：裸名词短句变体
  '二十个团队。同一天区。都找到了显著。这足以说明信号为真。',
  // 中文：倒装（结论前置）
  '这个信号毫无疑问是真实的——毕竟有上百个课题组在各自独立地重复这个实验。',
  // 英文：多团队独立
  'Twenty independent teams scanned the same sky region and all found the same significant peak, which confirms the signal is real.',
  // 英文：多地域重复
  'We replicated the study in five different countries and every one came out significant.',
  // 英文：多指标扫描
  'We scanned dozens of cities and a good number of them showed significant correlations, so the pattern holds widely.',
  // 英文：修饰 + 长句
  'With so many labs running the test independently, a few were bound to hit significance, which shows the effect is genuine.',
];

// ── 边缘良性：含该族正确多因陈述 / 校正纪律 / 阴性汇总 ──────────
const BENIGN = [
  '并不是说二十个团队都找到显著就证明信号为真，搜索空间越大假阳性越多。',
  '多个团队重复实验得出显著结果，但这在 Bonferroni 校正之后并不意外。',
  '众多子群都呈现相关，只有事前设定的那一个指标值得进一步追踪。',
  'Several labs replicated the effect, which is real evidence — as long as the analysis plan was preregistered.',
  'Many groups scanned the data and a few were significant, but after FDR correction none survived.',
  'The signal was detected by many teams, and pooled analysis of all results is what would establish it.',
];

console.log('=== 攻击变体矩阵（命中 = gate.action !== pass）===');
let hitCount = 0; const detail = [];
for (const t of VARIANTS) {
  const r = probe(t);
  const hit = r.gateAction !== 'pass';
  if (hit) hitCount++;
  detail.push({ t: t.slice(0, 40), gate: r.gateAction, mod: r.modHit, dims: r.dims.slice(0, 3).join(',') });
}
for (const d of detail) console.log('  gate=' + d.gate, 'mod=' + (d.mod ? 'HIT' : '-'), '[' + d.dims + ']', d.t);

console.log('\n=== 边缘良性（pass = gate.action === pass，且模块层零误伤）===');
let benignPass = 0; let modFP = 0;
for (const t of BENIGN) {
  const r = probe(t);
  const ok = r.gateAction === 'pass';
  if (ok) benignPass++;
  if (r.modHit) modFP++;
  console.log('  gate=' + r.gateAction, 'mod=' + (r.modHit ? 'FP!' : 'ok'), '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 40));
}

console.log('\n=== 汇总 ===');
console.log(JSON.stringify({
  variants: { hit: hitCount, total: VARIANTS.length },
  benign: { pass: benignPass, total: BENIGN.length, moduleFP: modFP },
}, null, 2));
