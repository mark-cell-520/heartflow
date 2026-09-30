/**
 * round-292 探针 1：全角标点在正则字面量中的系统性分布扫描
 *
 * 背景（r291 已坐实的真缺口类型）：
 *   pipeline.js:71-75 入口对输入做 NFKC —— 全角逗号「，」(U+FF0C) 折成半角「,」。
 *   而模式库里大量正则正向钩全角标点（如 `，?`）。
 *   结果：同一句文本，「直调 discriminate(原文)」命中，但「checkOutput → runPipeline → NFKC」漏判。
 *   r291 修了 pseudo_profundity 度量辩证族 1 支，属单点补丁。
 *
 * 本探针要回答：这类跨形态不对称在全库有多大面积？
 *
 * 安全纪律：只输出标点种类 / 行号 / 上下文形状，绝不输出中文原文。
 */

const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const SRC_DIR = path.join(REPO, 'src');

// ── 1. 提取所有 JS 源文件中的正则字面量（去注释）──
function stripComments(src) {
  // 去块注释
  let out = src.replace(/\/\*[\s\S]*?\*\//g, '');
  // 去行注释（粗略：不考虑字符串内含 //，正则区会被后面再次识别）
  out = out.replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
  return out;
}

/**
 * 用状态机提取正则字面量。无法区分除号与正则开头，
 * 故采用保守策略：仅当 `/` 前是 `( , = : [ ! & | ? { ; return` 或行首时视为正则起点。
 */
function extractRegexLiterals(src) {
  const results = [];
  const lines = src.split('\n');
  let inBlock = false;
  for (let ln = 0; ln < lines.length; ln++) {
    let line = lines[ln];
    // 跳过块注释区间
    if (inBlock) {
      const end = line.indexOf('*/');
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlock = false;
    }
    // 去掉行注释（保守：仅当 // 前不是 : 或 \）
    const stripped = line.replace(/(^|[^:\\])\/\/.*$/, '$1');
    if (/\/\*/.test(stripped)) inBlock = true;
    // 找正则起点
    const startRe = /(^|[(,=:[!&|?{;\s])\/(?![/*])/g;
    let m;
    while ((m = startRe.exec(stripped)) !== null) {
      const startIdx = m.index + m[1].length;
      // 扫描到未被转义的 /
      let i = startIdx + 1;
      let inClass = false;
      let literal = '';
      while (i < stripped.length) {
        const ch = stripped[i];
        if (ch === '\\') { literal += ch + (stripped[i + 1] || ''); i += 2; continue; }
        if (ch === '[') inClass = true;
        if (ch === ']') inClass = false;
        if (ch === '/' && !inClass) break;
        literal += ch;
        i++;
      }
      if (i >= stripped.length) break; // 跨行正则，跳过（模式库多单行）
      results.push({ line: ln + 1, literal, flags: '' });
      startRe.lastIndex = i;
    }
    if (inBlock) continue;
  }
  return results;
}

// ── 2. 全角标点表：NFKC 会折叠的那些 ──
const FULLWIDTH_MAP = {
  '\uFF0C': ',',   // ，
  '\u3002': '.',   // 。
  '\uFF1B': ';',   // ；
  '\uFF1A': ':',   // ：
  '\uFF01': '!',   // ！
  '\uFF1F': '?',   // ？
  '\uFF08': '(',
  '\uFF09': ')',
  '\u300A': '<',
  '\u300B': '>',
  '\uFF5E': '~',
  '\u2014': '-',
  '\u2026': '.',   // … → 三字符但简记
  '\u3001': ',',   // 、
};

function walk(dir) {
  const acc = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) acc.push(...walk(p));
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

const files = walk(SRC_DIR);
const perFile = {};
const punctTally = {};
let totalRegex = 0;
let totalWithFW = 0;
// 区分：正向钩子 vs 否定字符类内（否定类是「排除」，NFKC 后半角不在排除表 → 变宽松，不构成漏判）
const positiveHits = [];
const negClassOnly = [];

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const regexes = extractRegexLiterals(src);
  let fileCount = 0, fileFW = 0;
  for (const r of regexes) {
    totalRegex++;
    fileCount++;
    // 检测正则文本中出现的全角标点
    const found = [];
    for (const [fw] of Object.entries(FULLWIDTH_MAP)) {
      if (r.literal.includes(fw)) found.push(fw);
    }
    if (!found.length) continue;
    fileFW++;
    totalWithFW++;
    for (const fw of found) {
      punctTally[fw] = punctTally[fw] || { total: 0, files: new Set() };
      punctTally[fw].total++;
      punctTally[fw].files.add(path.relative(path.join(__dirname, '..', '..'), f));
    }
    // 判断该全角标点是否处于否定字符类 [^...] 内
    // 粗略：取该字符前最近的 '[' 与 '^' 关系
    let anyPositive = false;
    for (const fw of found) {
      const idx = r.literal.indexOf(fw);
      const before = r.literal.slice(0, idx);
      // 找最后一个未闭合的字符类起点
      let classStart = -1, caret = false;
      for (let k = 0; k < before.length; k++) {
        if (before[k] === '\\') { k++; continue; }
        if (before[k] === '[') { classStart = k; caret = before[k + 1] === '^'; }
        else if (before[k] === ']') { classStart = -1; caret = false; }
      }
      if (classStart === -1 || !caret) anyPositive = true;
    }
    (anyPositive ? positiveHits : negClassOnly).push({
      file: path.relative(path.join(__dirname, '..', '..'), f),
      line: r.line,
      fw: found.map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')),
      shape: r.literal.length > 60 ? r.literal.slice(0, 60) + '…(' + r.literal.length + ')' : r.literal,
    });
  }
  if (fileFW) perFile[path.relative(REPO, f)] = { regex: fileCount, withFW: fileFW };
}

const P = (...a) => console.log(...a);

P('══════ r292 探针 1：全角标点 × 正则字面量 分布 ══════');
P(`扫描文件数: ${files.length}  正则字面量总数: ${totalRegex}`);
P(`含全角标点的正则: ${totalWithFW}`);
P('');
P('── 按文件分布（仅列含全角标点的）──');
for (const [f, c] of Object.entries(perFile).sort((a, b) => b[1].withFW - a[1].withFW)) {
  P(`  ${f}: ${c.withFW}/${c.regex}`);
}
P('');
P('── 按标点汇总 ──');
for (const [fw, c] of Object.entries(punctTally).sort((a, b) => b[1].total - a[1].total)) {
  P(`  U+${fw.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} (${fw}) → NFKC 后 '${FULLWIDTH_MAP[fw]}'  出现 ${c.total} 次  分布于 ${[...c.files].join(', ')}`);
}
P('');
P('── 正向钩子（NFKC 折叠后可能漏判，需逐一实测）──');
P(`  共 ${positiveHits.length} 支`);
for (const h of positiveHits) {
  P(`  ${h.file}:${h.line}  [${h.fw.join(' ')}]  ${JSON.stringify(h.shape)}`);
}
P('');
P('── 仅否定字符类内（NFKC 后变宽松，不构成漏判，仅潜在误伤面）──');
P(`  共 ${negClassOnly.length} 支`);
for (const h of negClassOnly) {
  P(`  ${h.file}:${h.line}  [${h.fw.join(' ')}]  ${JSON.stringify(h.shape)}`);
}
