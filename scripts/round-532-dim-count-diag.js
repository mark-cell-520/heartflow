// r532: 诊断「文档宣称 76 vs 运行时 dimMap 75」的口径差
// 输出：dimMap 键集 vs AGENTS.md 列举名集的双向差集
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const ROOT = __HF;

const { discriminate } = require(path.join(ROOT, 'src/index.js'));
const d = discriminate('neutral baseline text');
const dimMapKeys = Object.keys(d.dimensions || {});
const kset = new Set(dimMapKeys);

const agents = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
// 抓取正文里所有 snake_case 的维度名（排除代码/路径噪声）
const docNames = new Set();
for (const m of agents.matchAll(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g)) docNames.add(m[1]);

// 已知别名（文档用旧名/简称，引擎用正式键）
const ALIAS = {
  bullshit: 'bullshit_recognition',
  appeal_to_authority: 'appeal_to_authority_boost',
};

console.log('dimMap 键数 =', dimMapKeys.length);
console.log('文档列举 snake_case 名数 =', docNames.size);

console.log('\n—— 文档有、dimMap 无（含别名换算后仍无）——');
for (const n of [...docNames].sort()) {
  const real = ALIAS[n] || n;
  if (!kset.has(real)) console.log('  MISSING:', n, '→', real);
}

console.log('\n—— dimMap 有、文档未列举 ——');
for (const k of dimMapKeys) {
  if (!docNames.has(k)) console.log('  UNDOCUMENTED:', k);
}

console.log('\n—— 别名核对 ——');
for (const [a, b] of Object.entries(ALIAS)) {
  console.log(`  文档 ${a} / 引擎 ${b} / dimMap含引擎键=${kset.has(b)}`);
}

// tier 集合核对
const idx = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
for (const label of ['BLOCK_DIMS', 'REWRITE_DIMS', 'VERIFY_DIMS']) {
  const m = idx.match(new RegExp(`const ${label} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  const arr = m ? (m[1].match(/['"][a-z_]+['"]/g) || []).map(s => s.slice(1, -1)) : [];
  const notInMap = arr.filter(x => !kset.has(x));
  console.log(`\n${label} = ${arr.length} 项；不在 dimMap 的: ${JSON.stringify(notInMap)}`);
}

// 检查 ai_writing_tell / agency_deflection / multi_turn_escalation 在引擎里的存在形态
for (const name of ['ai_writing_tell', 'agency_deflection', 'multi_turn_escalation', 'goal_misalignment']) {
  const hits = [];
  const re = new RegExp(name, 'g');
  let mm;
  while ((mm = re.exec(idx)) !== null) {
    const line = idx.slice(0, mm.index).split('\n').length;
    hits.push(line);
    if (hits.length > 12) break;
  }
  console.log(`\n${name}: src/index.js 出现 ${hits.length} 处 行号 ${hits.slice(0, 12).join(',')}`);
}
