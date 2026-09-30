/** r293 探针 4：doubt-engine **正向**标点类的跨形态缺口（探针2只扫了否定类） */
const fs = require('fs');
const path = require('path');
const P = (...a) => console.log(...a);
const F = path.resolve(__dirname, '..', '..', 'src', 'doubt-engine.js');
const lines = fs.readFileSync(F, 'utf8').split('\n');

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

// 标点类的半角孪生映射
const PAIRS = [['\uFF0C', ','], ['\u3002', '.'], ['\uFF01', '!'], ['\uFF1F', '?'], ['\uFF1A', ':'], ['\uFF1B', ';']];
let inBlock = false;
const hits = [];
lines.forEach((line, ln) => {
  if (inBlock) { const e = line.indexOf('*/'); if (e === -1) return; line = line.slice(e + 2); inBlock = false; }
  const t = line.trim();
  if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
  if (/\/\*/.test(line)) inBlock = true;

  for (const cls of findCharClasses(line)) {
    if (cls.negated) continue;
    const b = cls.body;
    // 只关心「主体是中文标点/连接词、规模 <=4」的小类（大的类如 [的，。] 同属此类）
    if (b.length > 6) continue;
    const missing = [];
    for (const [fw, half] of PAIRS) {
      if (b.includes(fw) && !b.includes(half)) {
        const escH = '\\u00' + half.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
        if (b.toUpperCase().includes(escH)) continue;
        missing.push(`${fw === '\uFF0C' ? '逗号' : fw === '\u3002' ? '句号' : fw}缺${JSON.stringify(half)}`);
      }
    }
    if (!missing.length) continue;
    hits.push({ line: ln + 1, body: b, miss: missing.join(','), src: line.trim().slice(0, 100) });
  }
});

P('══════ r293 探针 4：doubt-engine 正向标点类半角缺口 ══════');
P(`命中: ${hits.length}\n`);
for (const h of hits) P(`  L${h.line} [${h.body}] ← ${h.miss}`);
