/**
 * scan-cjk-word-boundary.js — 全仓扫「中文词面 + \b」静默失模式
 *
 * 失模式定义（第 126/127 轮两次咬到的根因）：
 *   JS 正则的 `\b` 只对 ASCII \w 定义。当 `\b` 的边界位置贴的是汉字时，
 *   该 `\b` 永远不成立 —— 中文候选词被包在 `\b(?:…)\b` 里时，尾部 `\b` 永不匹配，
 *   结果是「写了正则、单测不报、门禁不红、但中文侧 0 命中」的静默失效。
 *
 * 两种形态：
 *   1) 紧邻型：\b 与 CJK 直接相邻（\b中文、中文\b）
 *   2) 组内型：\b(?:…|中文|…) ，\b 的保护范围包住含 CJK 的候选分支
 *
 * 用法：node scripts/scan-cjk-word-boundary.js [--json]
 * 输出：每条形如 file:line  col  形态  摘录
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIRS = [path.join(ROOT, 'src')];
const SCAN_EXTS = new Set(['.js']);

const CJK = /[\u4e00-\u9fff\u3400-\u4dbf]/;
// 允许清单：这些位置的 \b 经过人工复核是安全的（ASCII-only 候选，或已显式拆支）
// 形式：'文件相对路径:行号'
const ALLOWLIST = new Set([
  // 第 128 轮复核确认：buildAsciiOrChineseBranches 生成的 ASCII 支，\b 保护的是纯 ASCII 候选
]);

function* walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (SCAN_EXTS.has(path.extname(e.name))) yield p;
  }
}

/** 找出所有「正则字面量」文本区段（含 new RegExp 字符串），返回 {start,end,text} */
function extractRegexSpans(src) {
  const spans = [];
  // 1) /.../flags 字面量：粗判——前一位不是标识符字符，避免吃掉除号
  const lit = /\/(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\n\[])+\/[gimsuyvd]*/g;
  let m;
  while ((m = lit.exec(src)) !== null) {
    const before = src[m.index - 1];
    if (before && /[A-Za-z0-9_$)\]]/.test(before)) continue;
    spans.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  // 2) new RegExp('...') / RegExp("...")：字符串参数整段纳入
  const str = /new\s+RegExp\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
  while ((m = str.exec(src)) !== null) {
    spans.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return spans;
}

/** 从 m.start 处的 \b 出发，若紧跟组开括号则返回组的配对闭括号下标，否则 null */
function groupEndAfterWordBoundary(text, i) {
  // text[i] === '\\', text[i+1] === 'b'
  let j = i + 2;
  while (j < text.length && /\s/.test(text[j])) j++;
  if (text[j] !== '(') return null;
  // 跳过 (?= (?! (?: (?< 等前缀
  if (text[j + 1] === '?') {
    if (text[j + 2] === '<' && (text[j + 3] === '=' || text[j + 3] === '!')) j += 4;
    else if (text[j + 2] === ':' || text[j + 2] === '=' || text[j + 2] === '!') j += 3;
  }
  let depth = 0;
  for (let k = j; k < text.length; k++) {
    const c = text[k];
    if (c === '\\') { k++; continue; }
    if (c === '[') { // 跳过字符类
      let d = 1;
      for (let x = k + 1; x < text.length && d > 0; x++) {
        if (text[x] === '\\') { x++; continue; }
        if (text[x] === '[') d++;
        if (text[x] === ']') d--;
        k = x;
      }
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return k; }
  }
  return null;
}

/**
 * 逐行剥离注释（行注释）。保留缩进与长度以便定位。
 * 做法：扫描时跟踪本行的字符串状态，遇到 // 且在字符串外才视为注释起点。
 * 块注释按「/* 到 *​/」跨行处理，用行级状态机避免跨行错位。
 */
function stripComments(src) {
  const lines = src.split('\n');
  const out = [];
  let inBlock = false;
  for (const line of lines) {
    if (inBlock) {
      const end = line.indexOf('*/');
      if (end === -1) { out.push(''); continue; }
      const rest = line.slice(end + 2);
      const lead = ' '.repeat(end + 2);
      out.push(lead + stripLineComment(rest));
      inBlock = false;
      continue;
    }
    const bs = line.indexOf('/*');
    const lc = stripLineComment(line);
    if (bs !== -1) {
      const end = line.indexOf('*/', bs + 2);
      if (end === -1) {
        inBlock = true;
        out.push(stripLineComment(line.slice(0, bs)));
        continue;
      }
      out.push(stripLineComment(line.slice(0, bs) + ' '.repeat(end + 2 - bs) + line.slice(end + 2)));
      continue;
    }
    out.push(lc);
  }
  return out.join('\n');
}

/** 去掉单行里的 // 注释；感知单/双/反引号字符串 */
function stripLineComment(line) {
  let q = null;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (q) {
      if (c === '\\') { i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '/' && line[i + 1] === '/') {
      return line.slice(0, i).replace(/\S/g, ' ') || ' '.repeat(line.length);
    }
  }
  return line;
}

function scanFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const src = stripComments(raw);
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const out = [];
  for (const span of extractRegexSpans(src)) {
    const text = span.text;
    const lineOf = pos => src.slice(0, pos).split('\n').length;
    for (let i = 0; i < text.length - 1; i++) {
      if (text[i] !== '\\' || text[i + 1] !== 'b') continue;
      // 1) 紧邻型：\b 右侧紧贴 CJK
      if (CJK.test(text[i + 2] || '')) {
        out.push({ file: rel, line: lineOf(span.start + i), kind: 'adjacent',
          snippet: text.slice(Math.max(0, i - 12), i + 16) });
      }
      // 2) 组内型：\b 的保护范围（组内）含 CJK
      const end = groupEndAfterWordBoundary(text, i);
      if (end !== null) {
        const inner = text.slice(i + 3, end);
        if (CJK.test(inner)) {
          out.push({ file: rel, line: lineOf(span.start + i), kind: 'grouped',
            snippet: text.slice(Math.max(0, i - 8), Math.min(text.length, end + 6)) });
        }
      }
    }
  }
  return out;
}

const hits = [];
for (const d of SRC_DIRS) for (const f of walk(d)) hits.push(...scanFile(f));

const key = h => `${h.file}:${h.line}`;
const visible = hits.filter(h => !ALLOWLIST.has(key(h)));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ total: hits.length, visible: visible.length, hits: visible }, null, 1));
} else {
  for (const h of visible) console.log(`${h.file}:${h.line}  ${h.kind}  ${h.snippet}`);
  console.log(`cjk-word-boundary scan: ${hits.length} candidate(s), ${visible.length} after allowlist`);
}
process.exit(visible.length === 0 ? 0 : 1);
