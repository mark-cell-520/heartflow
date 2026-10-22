// 第 149 轮探针 A：reward_hacking 中英侧规则数程序化对比
// 用法：node scripts/round-149/probe-r149-cmp.js
// 只输出数字与族名，不输出样本原文。
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../../src/reward-hacking.js'), 'utf8');

// 提取每个族的正则条数（中英文区块分别统计）
// 表格形态：`  <family>: [ ... ],`
// 注释块 `// ─── 中文侧` / `// 英文侧` 划分区块。
function scanFamilies(label) {
  const lines = src.split('\n');
  const result = {};
  let cur = null;
  let inZh = false; // 从第 60 行左右中文侧开始
  let side = 'other';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 区块切换：注释里带「中文侧」「英文侧」标记
    if (/中文侧/.test(line)) side = 'zh';
    if (/英文侧/.test(line)) side = 'en';
    const m = line.match(/^\s{2}([a-z_][a-z0-9_]*):\s*\[\s*$/);
    if (m) {
      cur = m[1];
      result[cur] = result[cur] || { zh: 0, en: 0, other: 0 };
      result[cur][side] = (result[cur][side] || 0) + 0; // 初始化
      result[cur].__side = side;
      continue;
    }
    if (cur && /^\s{2}([a-z_][a-z0-9_]*):\s*\[/.test(line)) {
      // 单行族（如 condition_tuning: 0.75, 在权重表）——跳过
      if (/\.75|\.8|\.7|0\.\d+,/.test(line)) { cur = null; continue; }
    }
    if (cur && /^\s*\/.*[,;]?\s*$/.test(line) === false && /^\s*\//.test(line)) {
      // 注释不算
    }
    if (cur) {
      // 数这一行的正则开头数
      const hits = (line.match(/^\s*,?\s*\/(?![\/*]).*\/[gimsuy]*,\s*$/g) || []).length;
      if (hits > 0) {
        const s = result[cur].__side || 'other';
        result[cur][s] += hits;
      }
    }
    // 族结束：遇到 `  ],`
    if (cur && /^\s{2}\],\s*$/.test(line)) {
      cur = null;
    }
  }
  return result;
}

const fams = scanFamilies();
const names = Object.keys(fams).sort();
console.log('=== 第 149 轮 中英侧规则数对比 ===');
console.log('族名'.padEnd(28) + '中文侧  英文侧  其他');
let focus = ['condition_tuning', 'eval_ruleset_masking', 'covert_deception', 'eval_input_shortcut', 'proxy_fetch_code', 'test_gaming', 'task_substitution', 'metric_substitution', 'reward_function_edit', 'self_referential_loop'];
for (const n of names) {
  const f = fams[n];
  const star = focus.includes(n) ? ' <<<' : '';
  console.log(n.padEnd(28) + String(f.zh).padStart(4) + String(f.en).padStart(7) + String(f.other).padStart(6) + star);
}
console.log('');
console.log('=== 间隙（英文侧 > 中文侧 的族，按差值排序）===');
const gaps = names.map(n => ({ n, gap: fams[n].en - fams[n].zh }))
  .filter(x => x.gap > 0)
  .sort((a, b) => b.gap - a.gap);
for (const g of gaps) {
  console.log(g.n.padEnd(28) + ' 差值 +' + g.gap + (focus.includes(g.n) ? ' <<<' : ''));
}
