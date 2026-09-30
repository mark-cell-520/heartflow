/**
 * r292 探针 2：精确测量 pipeline 入口归一化的实际折叠集
 * + 判别全角钩子是否带半角孪生（真正的漏判风险面）
 *
 * 安全纪律：只输出码位/文件名/行号/形状，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

// ── A. 精确折叠集：对每个候选全角/弯引号字符跑 pipeline 同款归一化 ──
// pipeline.js:71-75 的实际逻辑：
//   if (/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) input = input.normalize('NFKC').replace(...)
function pipeNormalize(input) {
  if (/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) {
    return input.normalize('NFKC')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
  }
  return input;
}

const CANDIDATES = [
  ['\uFF0C', '全角逗号'], ['\u3001', '顿号'], ['\uFF01', '全角叹号'], ['\uFF1F', '全角问号'],
  ['\uFF1A', '全角冒号'], ['\uFF1B', '全角分号'], ['\uFF08', '全角左括号'], ['\uFF09', '全角右括号'],
  ['\uFF5E', '全角波浪'], ['\u300A', '左书名号'], ['\u300B', '右书名号'], ['\u2014', '破折号'],
  ['\u2026', '省略号'], ['\u3002', '句号'], ['\u2018', '左弯引号'], ['\u2019', '右弯引号'],
  ['\u201C', '左双弯引号'], ['\u201D', '右双弯引号'], ['\u00A0', 'NBSP'],
  ['\uFF0D', '全角连字符'], ['\uFF3B', '全角左方括号'], ['\uFF3D', '全角右方括号'],
  ['\uFF05', '全角百分号'], ['\uFF06', '全角&'], ['\uFF0B', '全角加号'],
  ['\u2013', 'en dash'], ['\u2212', 'minus sign'], ['\u02BC', 'modifier apostrophe'],
];

console.log('══════ A. 归一化实际折叠集（用 pipeline 同款函数实测）══════');
const folded = [];
for (const [ch, name] of CANDIDATES) {
  const out = pipeNormalize(ch);
  const changed = out !== ch;
  if (changed) folded.push({ ch, name, out });
  console.log(`  U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} ${name}  → ${changed ? `U+${out.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}` : '(不变)'}`);
}
console.log(`\n  实际会被折叠的：${folded.map(f => 'U+' + f.ch.codePointAt(0).toString(16).toUpperCase()).join(' ')}`);
console.log(`  共 ${folded.length} / ${CANDIDATES.length} 个候选字符\n`);

// ── B. 逐出现点分析：全角钩子是否带半角孪生 ──
const SRC = path.join(REPO, 'src');

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

function extractRegexLiterals(src) {
  const results = [];
  const lines = src.split('\n');
  let inBlock = false, inStr = null;
  for (let ln = 0; ln < lines.length; ln++) {
    let line = lines[ln];
    if (inBlock) { const e = line.indexOf('*/'); if (e === -1) continue; line = line.slice(e + 2); inBlock = false; }
    // 跳过纯注释行
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
    const stripped = line.replace(/(^|[^:\\])\/\/.*$/, '$1');
    const startRe = /(^|[(,=:[!&|?{;\s])\/(?![/*])/g;
    let m;
    while ((m = startRe.exec(stripped)) !== null) {
      const si = m.index + m[1].length;
      let i = si + 1, inClass = false, lit = '';
      while (i < stripped.length) {
        const ch = stripped[i];
        if (ch === '\\') { lit += ch + (stripped[i + 1] || ''); i += 2; continue; }
        if (ch === '[') inClass = true;
        if (ch === ']') inClass = false;
        if (ch === '/' && !inClass) break;
        lit += ch; i++;
      }
      if (i >= stripped.length) break;
      results.push({ line: ln + 1, lit });
      startRe.lastIndex = i;
    }
    if (inBlock) continue;
  }
  return results;
}

// 折叠集 → 半角孪生
const TWIN = {};
for (const f of folded) TWIN[f.ch] = f.out;

/**
 * 分析某个全角字符的每一次出现：
 *   - 若在否定字符类 [^...] 内 → 折半角后脱离否定表，只会变宽松（潜在误伤，非漏判）
 *   - 若在正向字符类 [...] 内 → 检查类内是否有半角孪生
 *   - 若在类外（裸字符或 alternation）→ 检查该 alternation 是否有半角孪生
 *   returns: 'twin'（已带孪生，安全） | 'orphan'（漏判风险） | 'no-risk'
 */
function classifyOccurrence(lit, ch) {
  const twin = TWIN[ch];
  if (!twin) return 'no-risk';
  const idxs = [];
  for (let i = 0; i < lit.length; i++) if (lit[i] === ch) idxs.push(i);
  if (!idxs.length) return 'no-risk';

  // 建立字符类区间表
  const classes = [];
  let cs = -1;
  for (let i = 0; i < lit.length; i++) {
    if (lit[i] === '\\') { i++; continue; }
    if (lit[i] === '[') { cs = i; }
    else if (lit[i] === ']' && cs !== -1) { classes.push([cs, i]); cs = -1; }
  }
  const inClassAt = (i) => classes.find(([a, b]) => i > a && i < b);

  for (const idx of idxs) {
    const cls = inClassAt(idx);
    if (cls) {
      const body = lit.slice(cls[0] + 1, cls[1]);
      const negated = body[0] === '^';
      if (negated) continue; // 否定类：非漏判
      // 正向类：查孪生
      if (body.includes(twin)) continue;
      // 别名检测：\uXXXX 转义写法
      const esc = '\\u' + twin.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      if (body.toUpperCase().includes(esc)) continue;
      return 'orphan';
    } else {
      // 类外：找所在 alternation 分支
      let bs = 0, be = lit.length;
      for (let i = idx - 1; i >= 0; i--) { if (lit[i] === '|') { bs = i + 1; break; } if (lit[i] === '(') { bs = i + 1; break; } if (lit[i] === ')') break; }
      for (let i = idx + 1; i < lit.length; i++) { if (lit[i] === '|' || lit[i] === ')') { be = i; break; } }
      const branch = lit.slice(bs, be);
      // 分支内是否含孪生字符或孪生的字符类
      if (branch.includes(twin)) continue;
      const esc = '\\u' + twin.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      if (branch.toUpperCase().includes(esc)) continue;
      // 分支本身是否只是一个「可选单字符」占位（如 `，?` 或 `[，。]?`）—— 这种孤儿最危险
      return 'orphan';
    }
  }
  return 'twin';
}

const files = walk(SRC);
const allRegex = [];
for (const f of files) allRegex.push({ file: path.relative(REPO, f), regexes: extractRegexLiterals(fs.readFileSync(f, 'utf8')) });

const orphans = [];
const twinCounts = {};
let totalTwin = 0, totalOrphan = 0;
for (const { file, regexes } of allRegex) {
  for (const r of regexes) {
    let hasTwin = false, hasOrphan = false;
    for (const ch of Object.keys(TWIN)) {
      if (!r.lit.includes(ch)) continue;
      const c = classifyOccurrence(r.lit, ch);
      if (c === 'twin') { hasTwin = true; totalTwin++; }
      else if (c === 'orphan') {
        hasOrphan = true; totalOrphan++;
        if (!twinCounts[ch]) twinCounts[ch] = 0;
        twinCounts[ch]++;
      }
    }
    if (hasOrphan) orphans.push({ file, line: r.line, lit: r.lit });
  }
}

console.log('══════ B. 全角钩子 × 半角孪生 分析 ══════');
console.log(`  带半角孪生的出现点: ${totalTwin}  孤儿出现点（漏判风险）: ${totalOrphan}`);
console.log('\n  按码位汇总孤儿数:');
for (const [ch, n] of Object.entries(twinCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`    U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} → '${TWIN[ch]}'  孤儿 ${n} 处`);
}
console.log(`\n── 孤儿正则清单（${orphans.length} 支）──`);
for (const o of orphans) {
  const shape = o.lit.length > 110 ? o.lit.slice(0, 110) + `…(${o.lit.length})` : o.lit;
  console.log(`  ${o.file}:${o.line}  ${JSON.stringify(shape)}`);
}
console.log('\n(清单含描述性中文属安全——为便于逐支修复，形状以码位与结构为主)');
