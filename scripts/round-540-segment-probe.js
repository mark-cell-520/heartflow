// r540: A 方向可行性探测 —— 用引擎自带数据文件当词表，验证中文最长匹配分词
const path = require('path');
const fs = require('fs');
const ROOT = process.cwd();

// 收集引擎自带词表（零依赖：不引第三方词典）
function collectDict() {
  const words = new Set();
  // 1) association-graph.json 的 2045 个节点 key
  const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/core/associative-engine/association-graph.json'), 'utf8'));
  for (const k of Object.keys(g.nodes || {})) words.add(k);
  // 2) narrative-prototypes.json 的 keywords
  const np = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/core/associative-engine/narrative-prototypes.json'), 'utf8'));
  for (const p of Object.values(np.prototypes || {})) for (const kw of (p.keywords || [])) words.add(kw);
  // 3) idiom-story-db.json 的中文 key
  const id = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/core/associative-engine/idiom-story-db.json'), 'utf8'));
  for (const sec of ['idioms', 'poetry', 'proverbs']) for (const k of Object.keys(id[sec] || {})) words.add(k);
  return words;
}

const DICT = collectDict();
const BY_LEN = new Map();
for (const w of DICT) {
  if (!w) continue;
  if (!BY_LEN.has(w.length)) BY_LEN.set(w.length, []);
  BY_LEN.get(w.length).push(w);
}
const SORTED_LENS = [...BY_LEN.keys()].sort((a, b) => b - a);

const CJK = /[\u4e00-\u9fff]/;

function segment(text) {
  // 第一步：按空白与英文/通用标点切分（保留原 tokenize 契约，英文样本零影响）
  const raw = text.split(/[\s,\.!?;:'"()（）【】《》]+/).filter(w => w.length > 0);
  const out = [];
  for (const frag of raw) {
    if (!CJK.test(frag)) { out.push(frag); continue; }
    // 第二步：中文片段做最长匹配（贪心，从最长词往最短试）
    let i = 0;
    while (i < frag.length) {
      let matched = null;
      for (const len of SORTED_LENS) {
        if (i + len > frag.length) continue;
        const cand = frag.substr(i, len);
        if (BY_LEN.get(len).includes(cand)) { matched = cand; break; }
      }
      if (matched) { out.push(matched); i += matched.length; }
      else {
        // 单字回退
        out.push(frag.substr(i, 1));
        i += 1;
      }
    }
  }
  return out;
}

const cases = [
  '我现在压力很大，心里很乱，不知道该怎么办。',
  '我现在很迷茫，需要突破困境的方法',
  '守株待兔是不劳而获',
  '我在学习新知识，努力进步',
  '代码 函数 变量',
  'This is a mix 中文 test.',
  '我感到非常愤怒和绝望，想要放弃',
];

console.log('词表大小 =', DICT.size, '| 词长分布 =', SORTED_LNS_DEBUG_LABEL(SORTED_LENS));
function SORTED_LNS_DEBUG_LABEL(l) { return JSON.stringify(l.slice(0, 8)); }
console.log('=== 分词实测 ===');
for (const c of cases) {
  const w = segment(c);
  console.log('  ' + JSON.stringify(c));
  console.log('    → ' + JSON.stringify(w) + '  (' + w.length + ' tokens)');
}

console.log('\n=== 对比：原 tokenize ===');
for (const c of cases) {
  console.log('  ' + JSON.stringify(c) + ' → ' + JSON.stringify(c.split(/[\s,\.!?;:'"()（）【】《》]+/).filter(w => w.length > 0)));
}
