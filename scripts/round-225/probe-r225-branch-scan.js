// r225：中英早退二分支结构横向扫描 v2 —— 找「有中文就整段不跑英文判据」的真缺口
// 判据：if(hasChinese) { A } else { B } / if(!hasChinese) { B } / early return 形式
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(SRC, []);
const patterns = [
  { tag: 'early-return', re: /if\s*\(\s*!?\s*hasChinese\s*\)\s*return/ },
  { tag: 'else-after-zh', re: /^\s*}\s*else\s*\{?\s*$/ },
  { tag: 'ternary-lang', re: /hasChinese\s*\?/ },
  { tag: 'not-zh-block', re: /if\s*\(\s*!\s*hasChinese\s*\)\s*\{/ },
];

function lineHasZhGate(line) {
  return /hasChinese|containsChinese|hasZh\b/.test(line);
}

const hits = [];
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!lineHasZhGate(ln)) continue;
    if (/^\s*\/\//.test(ln)) continue;      // 注释行跳过
    const tags = patterns.filter(p => p.re.test(ln)).map(p => p.tag);
    // 相邻 12 行内是否有 else 承接（二分支结构）
    let hasElse = false;
    for (let j = i + 1; j < Math.min(i + 14, lines.length); j++) {
      if (/^\s*\}\s*else\s*\{/.test(lines[j]) || /^\s*else\s*\{/.test(lines[j])) { hasElse = true; break; }
      if (/^\s*if\s*\(/.test(lines[j])) break;
    }
    hits.push({
      file: path.relative(ROOT, f), line: i + 1,
      tags: tags.join(','), elseNext: hasElse,
      code: ln.trim().slice(0, 100),
    });
  }
}

console.log('=== hasChinese 门控点（非注释）===');
console.log('count=' + hits.length);
for (const h of hits) console.log(`${h.file}:${h.line}  [${h.tags}${h.elseNext ? ' else-next' : ''}] ${h.code}`);
