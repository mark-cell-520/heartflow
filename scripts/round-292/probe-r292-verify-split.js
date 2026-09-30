/**
 * r292 探针 10（终判）：否定类漏列 → 真实判词分裂 的实证筛选
 *
 * 探针 9 静态找出 356 处「否定类只列全角、未列半角孪生」。
 * 但静态不对称 ≠ 真实分裂。本探针做实证筛选：
 *   对每个命中处，取「该行正则」+ 用该正则自身的中文片段构造候选文本，
 *   分别用 全角分隔符 / NFKC 后半角分隔符 跑 regex.test()。
 *   test 结果改变 = 这个不对称在正则层就是真的。
 *
 * 只输出文件:行号 / 方向 / 数量，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const P = (...a) => console.log(...a);

function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}
const FOLD = {
  '\uFF0C': ',', '\uFF01': '!', '\uFF1F': '?', '\uFF1A': ':', '\uFF1B': ';',
  '\uFF08': '(', '\uFF09': ')', '\uFF5E': '~', '\uFF0D': '-', '\uFF3B': '[',
  '\uFF3D': ']', '\uFF05': '%', '\uFF06': '&', '\uFF0B': '+',
};
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}
function findCharClasses(s) {
  const out = []; const n = s.length;
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === '[') {
      let j = i + 1, neg = false;
      if (s[j] === '^') { neg = true; j++; }
      if (s[j] === ']') j++;
      while (j < n && s[j] !== ']') { if (s[j] === '\\') j++; j++; }
      if (j < n) { out.push({ start: i, end: j, body: s.slice(i + (neg ? 2 : 1), j), negated: neg }); i = j; }
    } else if (s[i] === '\\') i++;
  }
  return out;
}
function zhChunks(s) {
  const out = []; let cur = '';
  for (const ch of s) {
    if (/[\u4e00-\u9fff]/.test(ch)) cur += ch;
    else if (cur) { if (cur.length >= 2) out.push(cur); cur = ''; }
  }
  if (cur.length >= 2) out.push(cur);
  return out;
}

const files = walk(SRC);
const real = [];
for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
  const lines = src.split('\n');
  let inBlock = false;
  for (let ln = 0; ln < lines.length; ln++) {
    let line = lines[ln];
    if (inBlock) { const e = line.indexOf('*/'); if (e === -1) continue; line = line.slice(e + 2); inBlock = false; }
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
    if (/\/\*/.test(line)) inBlock = true;
    for (const cls of findCharClasses(line)) {
      if (!cls.negated) continue;
      const missing = [];
      for (const [fw, half] of Object.entries(FOLD)) {
        if (!cls.body.includes(fw) || cls.body.includes(half)) continue;
        const escH = '\\u' + half.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        if (cls.body.toUpperCase().includes(escH)) continue;
        missing.push({ fw, half });
      }
      if (!missing.length) continue;
      // ── 实证：取本行所有正则，用自身中文片段做分隔符差分 ──
      const reSrc = [];
      const reAll = /\/((?:[^\/\\\n]|\\.)+)\/([gimsuy]*)/g;
      let m;
      while ((m = reAll.exec(line)) !== null) reSrc.push({ src: m[1], flags: m[2] });
      let confirmed = false, dir = null;
      for (const r of reSrc) {
        let re; try { re = new RegExp(r.src, r.flags.replace('g', '')); } catch (_) { continue; }
        const chunks = zhChunks(r.src);
        if (chunks.length < 2) continue;
        for (const sep of ['\uFF0C', '\uFF01', '\uFF1F', '\uFF1A', '\uFF1B', '\u3001', '\uFF08', '\uFF09']) {
          if (!cls.body.includes(sep)) continue;
          const cand = chunks.join(sep) + '\u3002';
          const a = re.test(cand), b = re.test(pipeNormalize(cand));
          if (a !== b) { confirmed = true; dir = a === false && b === true ? 'FW漏判/折叠后命中' : 'FW命中/折叠后漏判'; break; }
        }
        if (confirmed) break;
      }
      if (confirmed) real.push({ file: path.relative(ROOT, f), line: ln + 1, fw: missing.map(x => 'U+' + x.fw.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')).join(','), dir });
    }
    if (inBlock) continue;
  }
}

P('══════ r292 探针 10：否定类漏列的实证筛选 ══════');
P(`实证确认分裂: ${real.length} 处\n`);
const byDir = {};
for (const r of real) byDir[r.dir] = (byDir[r.dir] || 0) + 1;
P('── 按方向汇总 ──');
for (const [d, n] of Object.entries(byDir)) P(`  ${d}: ${n}`);
P('');
P('── 明细 ──');
for (const r of real) P(`  ${r.file}:${r.line}  ${r.fw}  ${r.dir}`);
