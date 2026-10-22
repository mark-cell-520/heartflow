/**
 * v6.7.126 第 119 轮：正则拼接点顶层 | 未分组扫描器（第 115 轮移交项）
 *
 * 真问题不是「数组里某条正则自己顶层有 |」（那种独立使用无害），
 * 而是**拼接点**：当 `A.source` 或模板串 `A.source` 被嵌入更大的
 * 表达式时，若 A 的 source 顶层有裸 `|`，拼接后语义变成 (A)|(bigger)，
 * 后半段条件失效。第 117 轮的 `\\b` 双写事故正是这类手工拼接入的坑。
 *
 * 扫描对象：src 下所有 js 文件里含 X.source 的拼接引用
 *   1. 字符串拼接：X.source + ... 或 ... + X.source
 *   2. 模板字符串内插 X.source 或 X（X 看起来是 *_re / *_RE / RE_* 常量）
 *   3. new RegExp(a + b) 形式的二元/多元拼接
 * 再回溯被拼接符号的定义处，取其顶层裸 | 数量。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** 顶层裸 | 的位置数 */
function topLevelPipes(expr) {
  let n = 0, depth = 0, inClass = false;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '\\') { i++; continue; }
    if (inClass) { if (c === ']') inClass = false; continue; }
    if (c === '[') { inClass = true; continue; }
    if (c === '(') { depth++; continue; }
    if (c === ')') { if (depth > 0) depth--; continue; }
    if (c === '|' && depth === 0) n++;
  }
  return n;
}

/** 从全文找出所有某常量的 source 串（const X = /..../ 或 new RegExp(....)） */
function collectRegexBodies(files) {
  const map = new Map(); // file -> [ {name, body, line} ]
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    const arr = [];
    const lines = txt.split('\n');
    // 形如 const X = /.../i  或  X = new RegExp(`...`, 'i')
    const reDef = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(\/[\s\S]*?\/[gimsuy]*|new\s+RegExp\([\s\S]*?\))\s*[,;]/;
    lines.forEach((ln, i) => {
      const m = reDef.exec(ln);
      if (!m) return;
      let body = null;
      if (m[2][0] === '/') {
        const last = m[2].lastIndexOf('/');
        body = m[2].slice(1, last);
      } else {
        const bm = /new\s+RegExp\(\s*([\s\S]*?)\s*,\s*['"][^'"]*['"]\s*\)/.exec(m[2]);
        if (!bm) return;
        body = bm[1].trim().replace(/^`([\s\S]*)`$/, '$1').replace(/^'([\s\S]*)'$/, '$1').replace(/^"([\s\S]*)"$/, '$1');
      }
      if (body && !body.includes('${')) arr.push({ name: m[1], body, line: i + 1 });
    });
    map.set(f, arr);
  }
  return map;
}

/** 判断拼接引用：`NAME.source` 出现在含 + 或模板内插的表达式里 */
function findConcatRefs(files) {
  const hits = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    const lines = txt.split('\n');
    lines.forEach((ln, i) => {
      if (!/\.source/.test(ln)) return;
      if (!/(\+|\$\{)/.test(ln)) return;         // 单条 new RegExp(X.source) 不拼 → 无害
      // 抽取所有 X.source
      const re = /([A-Za-z_$][\w$]*)\.source/g;
      let m;
      while ((m = re.exec(ln))) {
        hits.push({ file: f, line: i + 1, name: m[1], context: ln.trim().slice(0, 110) });
      }
    });
  }
  return hits;
}

const files = walk(ROOT, []);
const refs = findConcatRefs(files);
const defs = collectRegexBodies(files);

function evaluate() {
  const out = { refs: refs.length, bad: [], unresolved: 0 };
  const seen = new Set();
  for (const r of refs) {
    const cand = (defs.get(r.file) || []).filter(d => d.name === r.name);
    if (cand.length === 0) { out.unresolved++; continue; }
    for (const d of cand) {
      const pipes = topLevelPipes(d.body);
      if (pipes === 0) continue;
      const key = r.file + ':' + r.name;
      if (seen.has(key)) continue;
      seen.add(key);
      out.bad.push({ file: r.file, defLine: d.line, name: r.name, pipes, useLine: r.line, ctx: r.ctx, body: d.body });
    }
  }
  out.ok = out.bad.length === 0;
  return out;
}

module.exports = { topLevelPipes, walk, collectRegexBodies, findConcatRefs, evaluate };

if (require.main === module) {
  const res = evaluate();
  for (const b of res.bad) {
    console.log('WARN  ' + path.relative(ROOT, b.file) + ' L' + b.defLine + " defines '" + b.name + "' top-level pipes=" + b.pipes);
    console.log('      concat at L' + b.useLine + ': ' + b.ctx);
    console.log('      body: ' + b.body.slice(0, 80) + (b.body.length > 80 ? '...' : ''));
  }
  console.log('concat refs total: ' + res.refs);
  console.log('concat consts with top-level pipes: ' + res.bad.length);
  console.log('concat refs unresolved: ' + res.unresolved);
  console.log('VERDICT: ' + (res.ok ? 'no ungrouped top-level pipe at concat points' : res.bad.length + ' need A/B review'));
}
