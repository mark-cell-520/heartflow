'use strict';
// r174 接线脚本：第 172 维度 reverse_causation（因果倒置）一次接齐九处。
// 用法：/root/.local/bin/node scripts/round-174-wire.js [--dry]
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'src', 'index.js');
const DRY = process.argv.includes('--dry');

let src = fs.readFileSync(FILE, 'utf8');
const orig = src;
const edits = [];

function replace(anchor, addition, label) {
  const idx = src.indexOf(anchor);
  if (idx < 0) { console.error('ANCHOR NOT FOUND: ' + label); process.exit(1); }
  if (src.indexOf(anchor) !== idx) { console.error('ANCHOR NOT UNIQUE: ' + label); process.exit(1); }
  const at = idx + anchor.length;
  src = src.slice(0, at) + addition + src.slice(at);
  edits.push(label);
}

// 1) require
replace(
  "const { checkClusteringIllusion } = require('./clustering-illusion.js');\n",
  "// [r174] 第 172 维度 reverse_causation（因果倒置/反向因果：把对后果的应对\n" +
  "// 行为当成后果本身的原因——住院患者死亡率更高所以住院增加死亡风险）。\n" +
  "// 判据反应型行为×相关框腿×因果归因腿两腿共现；细节见 src/reverse-causation.js。\n" +
  "const { checkReverseCausation } = require('./reverse-causation.js');\n",
  'require'
);

// 2) 计算点
replace(
  "  const clu = _applyPedagogyRelaxation(checkClusteringIllusion(_normText), \"clustering_illusion\", pedagogyRelaxation);\n",
  "  // [r174] 第 172 维度 reverse_causation（因果倒置）计算点。\n" +
  "  // 同 r173 先例：九处一次接齐，漏一处 gate.action 恒 pass。\n" +
  "  const rcau = _applyPedagogyRelaxation(checkReverseCausation(_normText), \"reverse_causation\", pedagogyRelaxation);\n",
  'compute'
);

// 3) allDims
replace(
  "    {score: clu.score, name:'clustering_illusion'},\n",
  "    // [r174] 第 172 维度 reverse_causation 参与判定（因果倒置）。\n" +
  "    // 同 r173 先例：dimMap 与 allDims 必须两处都接。\n" +
  "    {score: rcau.score, name:'reverse_causation'},\n",
  'allDims'
);

// 4) dimMap
replace(
  "    clustering_illusion: clu,\n",
  "    // [r174] 第 172 维度 reverse_causation（因果倒置×\n" +
  "    // 反应型行为×相关框腿×因果归因腿）。\n" +
  "    reverse_causation: rcau,\n",
  'dimMap'
);

// 5) DIM_GUIDANCE
replace(
  "    'clustering_illusion': \"不得",
  "    'reverse_causation': \"PLACEHOLDER\",\n    'clustering_illusion': \"不得",
  'DIM_GUIDANCE-marker'
);

// 6) VERIFY_DIMS
replace(
  "    'clustering_illusion',\n",
  "    // [r174] 第 172 维度 reverse_causation（因果倒置）登记。\n" +
  "    // verify 级——「把后果的应对行为当成后果的原因」需要补的是方向判据\n" +
  "    //（该行为发生在后果之前还是之后、有没有对照组、机制是什么），单句也\n" +
  "    // 可能是正确方向的陈述、随机对照证据或概念教学。与 r161-r173\n" +
  "    // 同口径只登记 VERIFY。\n" +
  "    'reverse_causation',\n",
  'VERIFY_DIMS'
);

// 7) dimensions
replace(
  "      clustering_illusion: clu,\n",
  "      // [r174] 第 172 维度 reverse_causation（因果倒置）。\n" +
  "      // 同 r173 先例：九处一次接齐，漏一处 dimensions 读数缺键。\n" +
  "      reverse_causation: rcau,\n",
  'dimensions'
);

// 8) summary
replace(
  "      clu.count ? clu.count + ' 处集群错觉' : '',\n",
  "      // [r174] 第 172 维度 reverse_causation 补登记 summary\n" +
  "      // （同上先例：不进 summary 读方看不到命中）。\n" +
  "      rcau.count ? rcau.count + ' 处因果倒置' : '',\n",
  'summary'
);

// 9) module.exports
replace(
  "  checkClusteringIllusion,\n",
  "  // [r174] 第 172 维度 reverse_causation 导出（同先例，\n" +
  "  // 漏导出会让测试与 MCP handler 拿不到单维函数）。\n" +
  "  checkReverseCausation,\n",
  'exports'
);

if (src === orig) { console.error('NO CHANGE'); process.exit(1); }
if (DRY) { console.log('DRY RUN OK, edits: ' + edits.join(',')); process.exit(0); }
fs.writeFileSync(FILE, src);
console.log('WIRED: ' + edits.join(', '));
