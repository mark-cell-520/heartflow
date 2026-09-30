/**
 * r292 探针 9：否定字符类「半角孪生漏列」全库扫描
 *
 * 探针 8 定位到的真缺口形态（与 291 轮正向钩子问题互为镜像）：
 *   PSEUDO_PHILOSOPHY_ZH 行 8692：`[^。，]{1,8}`
 *   否定类里只列了全角逗号 U+FF0C，没列半角 U+002C。
 *   因 pipeline 入口 NFKC 会把全角折成半角（管线跑的一定是半角），
 *   所以「全角原文」过 gate 直调时被这个否定类挡住（漏判），
 *   而「经管线 NFKC」的半角文本反而命中 —— 两种入口判词分裂。
 *
 * 本探针把这类「否定类只列全角、未列半角孪生」的不对称全库扫出。
 *
 * 只输出文件:行号 + 字符类结构，不输出中文原文。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const P = (...a) => console.log(...a);

// NFKC 会折叠的全角 → 半角孪生对（实测自 probe-r292-twin.js）
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

/**
 * 找出源码文本中的所有字符类（含否定），返回 [start, end, body, negated]
 * 逐字符扫描，正确处理 \[ \] 转义
 */
function findCharClasses(s) {
  const out = [];
  const n = s.length;
  for (let i = 0; i < n - 1; i++) {
    if (s[i] !== '\\' && s[i] === '[') {
      let j = i + 1, neg = false;
      if (s[j] === '^') { neg = true; j++; }
      if (s[j] === ']') j++;  // 否定类将 ] 作为首字符的字面量
      while (j < n && s[j] !== ']') { if (s[j] === '\\') j++; j++; }
      if (j < n) {
        out.push({ start: i, end: j, body: s.slice(i + (neg ? 2 : 1), j), negated: neg, raw: s.slice(i, j + 1) });
        i = j;
      }
    } else if (s[i] === '\\') i++;
  }
  return out;
}

const files = walk(SRC);
const hits = [];
const perFile = {};
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  let inBlock = false;
  for (let ln = 0; ln < lines.length; ln++) {
    let line = lines[ln];
    if (inBlock) { const e = line.indexOf('*/'); if (e === -1) continue; line = line.slice(e + 2); inBlock = false; }
    const t = line.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
    if (/\/\*/.test(line)) inBlock = true;
    for (const cls of findCharClasses(line)) {
      if (!cls.negated) continue;  // 只关心否定类
      const body = cls.body;
      // 否定类里出现全角字符，但其半角孪生不在类内 → 不对称
      const missing = [];
      for (const [fw, half] of Object.entries(FOLD)) {
        if (!body.includes(fw)) continue;
        if (body.includes(half)) continue;
        // 也接受 \uXXXX 写法
        const esc = '\\u' + fw.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        const escH = '\\u' + half.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        if (body.toUpperCase().includes(escH)) continue;
        missing.push({ fw, half });
      }
      if (missing.length) {
        const rel = path.relative(ROOT, f);
        hits.push({ file: rel, line: ln + 1, missing: missing.map(m => `U+${m.fw.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}→'${m.half}'`) });
        perFile[rel] = (perFile[rel] || 0) + 1;
      }
    }
    if (inBlock) continue;
  }
}

P('══════ r292 探针 9：否定类半角孪生漏列扫描 ══════');
P(`扫描文件: ${files.length}  命中不对称: ${hits.length} 处\n`);
P('── 按文件汇总 ──');
for (const [f, n] of Object.entries(perFile).sort((a, b) => b[1] - a[1])) P(`  ${f}: ${n}`);
P('');
P('── 明细（字符类结构，不含中文原文）──');
for (const h of hits) P(`  ${h.file}:${h.line}  漏列: ${h.missing.join(', ')}`);
P('');
P(`合计 ${hits.length} 处否定类只列全角未列半角。`);
