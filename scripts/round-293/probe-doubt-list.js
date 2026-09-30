/**
 * r293 探针 2：列出 doubt-engine.js 全部「否定类只列全角」的字符类 + 所属函数
 * 用于精确决定改哪几处（不盲改）。
 */
const fs = require('fs');
const path = require('path');
const F = path.resolve(__dirname, '..', '..', 'src', 'doubt-engine.js');
const P = (...a) => console.log(...a);

const lines = fs.readFileSync(F, 'utf8').split('\n');

// 函数边界
const funcs = [];
lines.forEach((l, i) => {
  const m = l.match(/^function\s+([A-Za-z_$][\w$]*)/);
  if (m) funcs.push({ name: m[1], start: i });
});
function funcOf(lnIdx) {
  let cur = null;
  for (const f of funcs) if (f.start <= lnIdx) cur = f.name;
  return cur || '(top)';
}

// 单行字符类
function findCharClasses(s) {
  const out = []; const n = s.length;
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === '[') {
      let j = i + 1, neg = false;
      if (s[j] === '^') { neg = true; j++; }
      if (s[j] === ']') j++;
      while (j < n && s[j] !== ']') { if (s[j] === '\\') j++; j++; }
      if (j < n) { out.push({ end: j, body: s.slice(i + (neg ? 2 : 1), j), negated: neg }); i = j; }
    } else if (s[i] === '\\') i++;
  }
  return out;
}

let inBlock = false;
const hits = [];
lines.forEach((line, ln) => {
  if (inBlock) { const e = line.indexOf('*/'); if (e === -1) return; line = line.slice(e + 2); inBlock = false; }
  const t = line.trim();
  if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
  if (/\/\*/.test(line)) inBlock = true;

  for (const cls of findCharClasses(line)) {
    if (!cls.negated) continue;
    const hasFWComma = cls.body.includes('\uFF0C');
    const hasHalfComma = cls.body.includes(',');
    const hasFWPeriod = cls.body.includes('\u3002');
    const hasHalfPeriod = cls.body.includes('.');
    if ((hasFWComma && !hasHalfComma) || (hasFWPeriod && !hasHalfPeriod)) {
      hits.push({
        line: ln + 1, fn: funcOf(ln), body: cls.body,
        miss: [
          hasFWComma && !hasHalfComma ? ',' : '',
          hasFWPeriod && !hasHalfPeriod ? '.' : ''
        ].filter(Boolean).join('+'),
        src: line.trim().slice(0, 90)
      });
    }
  }
});

P('══════ r293 探针 2：doubt-engine 否定类半角缺口 ══════');
P(`命中行数: ${hits.length}\n`);
const byFn = {};
for (const h of hits) byFn[h.fn] = (byFn[h.fn] || 0) + 1;
for (const [k, v] of Object.entries(byFn)) P(`  ${k}: ${v}`);
P('');
for (const h of hits) P(`  L${h.line} [${h.fn}] miss=${h.miss} class=[^${h.body}]`);
