// r540: A 方向改进版探测 —— Set 索引 + 中文标点过滤 + 最大词长限制
const path = require('path');
const fs = require('fs');
const ROOT = process.cwd();

const CJK = /[\u4e00-\u9fff]/;
// 中文标点：作为分隔符（与原 tokenize 把英文标点当分隔符的契约一致）
const ZH_PUNCT = /[\u3000-\u303f\uff00-\uffef\u2018\u2019\u201c\u201d\u2026\u2014\uff0c\u3002\uff01\uff1f\uff1b\uff1a\u300a\u300b\u300c\u300d\u300e\u300f\u3010\u3011\u3001]+/;

function collectDict() {
  const words = new Set();
  const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/core/associative-engine/association-graph.json'), 'utf8'));
  for (const k of Object.keys(g.nodes || {})) words.add(k);
  const np = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/core/associative-engine/narrative-prototypes.json'), 'utf8'));
  for (const p of Object.values(np.prototypes || {})) for (const kw of (p.keywords || [])) words.add(kw);
  const id = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/core/associative-engine/idiom-story-db.json'), 'utf8'));
  for (const sec of ['idioms', 'poetry', 'proverbs']) for (const k of Object.keys(id[sec] || {})) words.add(k);
  return words;
}

const MAX_WORD_LEN = 8;
const DICT = new Set();
for (const w of collectDict()) if (w && w.length <= MAX_WORD_LEN) DICT.add(w);
// 按长度分桶 Set，O(1) 查找；只索引长度 >=2 的词（单字走回退）
const BUCKETS = new Map();
for (const w of DICT) {
  if (w.length < 2) continue;
  if (!BUCKETS.has(w.length)) BUCKETS.set(w.length, new Set());
  BUCKETS.get(w.length).add(w);
}
const LENS = [...BUCKETS.keys()].sort((a, b) => b - a);

function segment(text) {
  const raw = text.split(/[\s,\.!?;:'"()（）【】《》]+/).filter(w => w.length > 0);
  const out = [];
  for (const frag of raw) {
    if (!CJK.test(frag)) { out.push(frag); continue; }
    // 中文标点切成独立片段，逐个处理（保留片段结构，标点本身被丢弃）
    const subFrags = frag.split(ZH_PUNCT).filter(s => s.length > 0);
    for (const sf of subFrags) {
      if (!CJK.test(sf)) { out.push(sf); continue; }
      let i = 0;
      while (i < sf.length) {
        let matched = null;
        for (const len of LENS) {
          if (len > sf.length - i) continue;
          const cand = sf.substr(i, len);
          if (BUCKETS.get(len).has(cand)) { matched = cand; break; }
        }
        if (matched) { out.push(matched); i += matched.length; }
        else { out.push(sf.substr(i, 1)); i += 1; }
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
  '英雄之旅：面对挑战，克服困难，最终蜕变成长',
  '没有标点的中文长句子直接切分测试',
];

console.log('DICT', DICT.size, '| 桶长度', JSON.stringify(LENS), '| 最大', MAX_WORD_LEN);
console.log('=== 改进版分词 ===');
for (const c of cases) {
  console.log('  ' + JSON.stringify(c));
  console.log('    → ' + JSON.stringify(segment(c)) + '  (' + segment(c).length + ')');
}

// 性能：长文本
const long = cases.join('，') + '，'.repeat(200) + cases.join('');
const t0 = Date.now();
const r = segment(long);
console.log('\n性能: ' + long.length + ' 字 → ' + r.length + ' tokens, ' + (Date.now() - t0) + 'ms');
