/**
 * src/denying-the-antecedent.js
 * [r166] 第 165 维度 denying_the_antecedent（否定前件谬误）。
 *
 * 形态：如果 P 则 Q；并非 P，所以并非 Q——否定前件，得出后件也不成立。
 *   「如果下雨，运动会就取消；今天没下雨，所以运动会不取消」
 *   「努力的人都会早起；他根本不努力，所以他不会早起」
 *   「If it rains, the match will be cancelled. It did not rain, so the match is not cancelled.」
 *
 * 判据（双腿共现，缺一不判）：
 *   腿① COND 条件/规则句（复用 affirming-the-consequent 的解析）——如果X则Y /
 *       X都会Y / X会Y / EN: if…then / X has Y / 英文裸规则句。切出前件 A / 后件 B。
 *   腿② ANTECEDENT_DENY 否定前件×否定后件结论——按推断词（所以/因此/说明/so/
 *       therefore）切分事实句：前半须回指腿①**前件 A** 且被否定（¬P），后半须回指
 *       腿①**后件 B** 且被否定（¬Q）。这个「¬P ∴ ¬Q」结构天然区分三种有效/相关推理：
 *       - modus ponens（P→Q, P∴Q）：前后件皆肯定，无否定 → 不判
 *       - modus tollens（P→Q, ¬Q∴¬P）：事实句否定的是**后件 B**、结论否定的是
 *         **前件 A**——与 ¬P∴¬Q 方向相反，且 A≠B 关键词不交叉 → 不判
 *       - affirming the consequent（P→Q, Q∴P）：后件在场肯定前件，无否定 → 不判
 *
 * 守卫常量（全部可被负例注入置空，见 test/round-166-denying-the-antecedent.js）：
 *   BICONDITIONAL  双条件（当且仅当/唯有/iff/if and only if）——双条件下 ¬P∴¬Q 有效
 *   NEGATION_FLIP  否定翻转（不意味着/不代表/does not mean）——正确指出推理无效，不判
 *   HEDGE          对冲/充分性否定（可能/未必/必要不充分/not sufficient）→ 不判
 *   META_CONCEPT   谬误概念转述（否定前件/逆否/formal fallacy）→ 不判
 *   TEACH          教学转述 → 不判
 *   EVIDENCE       证据语境讨论（孤证/证据不足/cannot prove）→ 不判
 *
 * 决策出处：scripts/decide-r166.js（heartflow_philosophy_decision，type=accelerate /
 * confidence 0.7 / priority 40）。候选池来自 /tmp/r166-gap-probe.js 在当前 v6.8.93 /
 * 164 维引擎实测：否定前件攻击族 8 条漏判 5 条真零命中（含全部英文与规范「如果…就」
 * 条件形），3 条被 fallacies 部分拦（都/都会 全称形）；良性 modus ponens / 双条件当前
 * pass。affirming_the_consequent(155) 管 Q∴P，conditional_proposition(160) 管 ¬B⇒¬A
 * （结论落前件），本族管 ¬P⇒¬Q（结论落后件）——三者演绎方向互异。
 */
'use strict';

// ── 腿①：条件/规则句标记（同 affirming-the-consequent）──────────
const COND_IF = ['如果', '若', '只要', '要是', '倘若', '倘使', '假如', '假使', '设若', '一旦', 'if', 'when', 'whenever', 'provided', 'unless'];
const COND_UNIVERSAL = ['都会有', '都会', '才有', '方能', '才有可能', '必然', '注定', '皆', '都'];
const COND_HUI = ['会'];

// ── 腿②：推断连接词（¬P → ¬Q）──────────────────────────────────
const INFER_ZH = ['足以证明', '这就说明', '这就证明', '足以见', '显然是', '肯定是', '准是', '意味着', '说明', '证明', '可见', '所以', '因此', '就是说'];
const INFER_EN = ['so', 'therefore', 'thus', 'which means', 'that means', 'proves that', 'proof that', 'it follows', 'consequently', 'hence'];

// ── 守卫 ──────────────────────────────────────────────────────
const NEG_ZH = ['没', '无', '未', '并非', '不是', '不', '别', '毫无', '并不', '未曾', '不曾'];
const NEG_EN = ['no', 'not', 'never', 'nor', 'neither', 'cannot', "can't", "won't", "wouldn't", "isn't", "aren't", "doesn't", "didn't", "don't", 'without'];
const BICONDITIONAL = ['当且仅当', '有且仅有', '唯有', '方才', 'iff', 'if and only if', 'only if', 'only when', '必要且充分', '充要条件'];
const NEGATION_FLIP = ['不意味着', '不代表', '不等于', '并不能说明', '推不出', '无法推出', 'does not mean', "doesn't mean", 'does not imply', "doesn't imply", 'cannot infer', 'no valid inference'];
const HEDGE = ['可能', '也许', '未必', '不一定', '之一', '其中之一', '还要看', '不能反推', '说明不了', '必要不充分', '或然', '难以证明', '不必然', 'perhaps', 'maybe', 'might', 'could be', 'not sufficient', 'not conclusive', 'cannot conclude'];
const META_CONCEPT = ['否定前件', '逆否命题', '充分必要', '逻辑谬误', '形式谬误', '谬误', 'denying the antecedent', 'formal fallacy', 'logical fallacy', 'fallacy'];
const TEACH = ['老师', '教材', '课堂', '教授', '讲师', '课本', '课程', '教研室', 'textbook', 'lecture', 'lesson', 'professor'];
const EVIDENCE = ['证据不足', '证据不充分', '无法证明', '孤证', '需要更多证据', '尚待', '存疑', '不能证明', 'not enough evidence', 'insufficient evidence', 'cannot prove', 'yet to be proven'];

const EN_STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'that', 'this', 'it', 'its', 'as', 'if', 'then', 'would', 'will', 'can', 'could', 'may', 'might', 'must', 'he', 'she', 'they', 'his', 'her', 'their', 'we', 'you', 'i', 'so', 'therefore', 'thus', 'hence', 'not', 'no', 'does', 'do', 'did', 'has', 'have', 'had']);
const ZH_STOP = new Set(['的', '是', '了', '在', '有', '和', '与', '也', '都', '就', '还', '会', '能', '要', '不', '没', '这', '那', '其', '之', '以', '为', '于', '很', '太', '更', '最', '啊', '吧', '呢', '吗', '呀', '把', '被', '从', '向', '对', '等', '所', '如', '果', '若', '只', '现', '场', '所', '因', '此', '说', '明', '证', '见', '意', '味', '着', '即', '便', '可', '肯', '准', '显', '然']);

function _clauses(t) {
  const parts = t.split(/[。；;！!？?\n]+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const subs = p.split(/\.(?=\s|[A-Z"']|$)/).map(s => s.trim()).filter(Boolean);
    for (const s of subs) out.push(s);
  }
  return out;
}

function _zhKeywords(s) {
  const clean = s.replace(/[，。！？；：、,.!?;:""''（）()\s]+/g, '');
  if (!clean) return [];
  if (clean.length <= 2) return [clean];
  const set = new Set();
  for (let len = 2; len <= 4 && len <= clean.length; len++) {
    for (let i = 0; i + len <= clean.length; i++) {
      const sub = clean.slice(i, i + len);
      let allStop = true;
      for (const ch of sub) { if (!ZH_STOP.has(ch)) { allStop = false; break; } }
      if (!allStop) set.add(sub);
    }
  }
  return [...set];
}

function _enWords(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 1 && !EN_STOP.has(w));
}

// 否定检测：EN 用词边界（避免 'no' 命中 know/another）；ZH 用字符集。
// 直接引用 NEG_ZH / NEG_EN 数组——负例注入置空可验证「否定」判据承重。
function _hasNeg(s, isEN) {
  if (isEN) return new RegExp('\\b(' + NEG_EN.join('|') + ')\\b', 'i').test(s);
  return NEG_ZH.some(n => s.includes(n));
}

// 关键词匹配：连续子串 → EN 词集 → EN 前4词干（ rain/rains/rained 归一 ）→ ZH 实字重叠回退
function _matchKw(s, kws, isEN) {
  for (const k of kws) { if (s.includes(k)) return k; }
  if (isEN) {
    const sWords = new Set(_enWords(s));
    for (const k of kws) { if (sWords.has(k)) return k; }
    // 前 4 词干归一（应对英文时态/单复数变形：rains↔rain↔rained, cancelled↔cancel）
    for (const w of sWords) {
      if (w.length < 4) continue;
      const stem = w.slice(0, 4);
      for (const k of kws) { if (k.length >= 4 && k.slice(0, 4) === stem) return k; }
    }
    return null;
  }
  const sChars = new Set([...s].filter(ch => !ZH_STOP.has(ch) && !/[\s，。！？；：、,.!?;:()]/.test(ch)));
  for (const k of kws) {
    const kc = [...k].filter(ch => !ZH_STOP.has(ch));
    if (kc.length < 2) continue;
    const shared = kc.filter(ch => sChars.has(ch));
    if (shared.length >= 2 && shared.length / kc.length >= 0.5) return k;
  }
  return null;
}

// 否定前件腿：片段须命中关键词**且**被否定
function _matchNegIn(s, kws, isEN) {
  if (!_hasNeg(s, isEN)) return null;
  return _matchKw(s, kws, isEN);
}

function _parseCondition(c) {
  function cutB(from) {
    let end = c.length;
    const comma = c.slice(from).search(/[，,]/);
    if (comma >= 0) end = Math.min(end, from + comma);
    const inf = _findInfer(c.slice(from));
    if (inf) end = Math.min(end, from + inf.idx);
    return end;
  }
  for (const m of COND_IF) {
    const idx = c.toLowerCase().indexOf(m.toLowerCase());
    if (idx < 0) continue;
    const rest = c.slice(idx + m.length);
    const comma = rest.search(/[，,]/);
    let A, from;
    if (comma >= 0) { A = rest.slice(0, comma); from = idx + m.length + comma + 1; }
    else {
      let li = -1, link = '';
      for (const l of ['那么', '则', '就']) { const p = rest.indexOf(l); if (p >= 0) { li = p; link = l; break; } }
      if (li >= 0) { A = rest.slice(0, li); from = idx + m.length + li + link.length; }
      else { A = rest; from = c.length; }
    }
    const end = cutB(from);
    const type = /^(if|when|whenever|provided|unless)$/i.test(m) ? 'EN_RULE' : 'COND_IF';
    return { A, B: c.slice(from, end), type, end };
  }
  for (const m of COND_UNIVERSAL) {
    const idx = c.indexOf(m);
    if (idx < 0) continue;
    const A = c.slice(0, idx);
    const from = idx + m.length;
    const end = cutB(from);
    if (A.trim() && c.slice(from, end).trim()) return { A, B: c.slice(from, end), type: 'COND_UNIVERSAL', end };
  }
  for (const m of COND_HUI) {
    const hui = c.indexOf(m);
    if (hui <= 0) continue;
    const A = c.slice(0, hui);
    const from = hui + m.length;
    const end = cutB(from);
    if (A.trim() && c.slice(from, end).trim()) return { A, B: c.slice(from, end), type: 'COND_HUI', end };
  }
  for (const m of ['has', 'have', 'implies', 'means', 'indicates']) {
    const re = new RegExp('\\b' + m + '\\b');
    const mt = c.match(re);
    if (mt) {
      const A = c.slice(0, mt.index);
      const from = mt.index + m.length;
      const end = cutB(from);
      if (_enWords(A).length && _enWords(c.slice(from, end)).length) return { A, B: c.slice(from, end), type: 'EN_RULE', end };
    }
  }
  const w = c.split(/\s+/).filter(Boolean);
  if (/[a-zA-Z]/.test(c) && w.length >= 3 && !INFER_EN.some(x => c.toLowerCase().includes(x))) {
    const A = w.slice(0, 2).join(' ');
    const from = c.indexOf(w[2]);
    const end = cutB(from);
    if (_enWords(A).length && _enWords(c.slice(from, end)).length) return { A, B: c.slice(from, end), type: 'EN_BARE', end };
  }
  return null;
}

function _findInfer(f) {
  const low = f.toLowerCase();
  let best = null;
  for (const w of INFER_ZH) {
    const idx = f.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      if (!best || w.length >= best.word.length) best = { word: w, idx };
    }
  }
  for (const w of INFER_EN) {
    const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    const mt = low.match(re);
    if (mt && (!best || mt.index < best.idx)) best = { word: w, idx: mt.index };
  }
  return best;
}

function _exempt(reason, word) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason + ':' + word, count: 0, detail: '', hits: [], strength: 'none' };
}

function _pass() {
  return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [], strength: 'none' };
}

function checkDenyingTheAntecedent(text) {
  const t = typeof text === 'string' ? text : '';
  if (!t.trim()) return _pass();

  // 全文级守卫（顺序：概念/教学/证据/否定翻转/双条件/对冲）
  for (const m of META_CONCEPT) { if (t.includes(m)) return _exempt('META_CONCEPT', m); }
  for (const m of TEACH) { if (t.includes(m)) return _exempt('TEACH', m); }
  for (const m of EVIDENCE) { if (t.includes(m)) return _exempt('EVIDENCE', m); }
  for (const m of NEGATION_FLIP) { if (t.includes(m)) return _exempt('NEGATION_FLIP', m); }
  for (const m of BICONDITIONAL) { if (t.toLowerCase().includes(m.toLowerCase())) return _exempt('BICONDITIONAL', m); }
  for (const m of HEDGE) { if (t.includes(m)) return _exempt('HEDGE', m); }

  const clauses = _clauses(t);
  const hits = [];

  for (let i = 0; i < clauses.length; i++) {
    const cond = _parseCondition(clauses[i]);
    if (!cond || !cond.B.trim() || !cond.A.trim()) continue;
    const isEN = cond.type === 'EN_RULE' || cond.type === 'EN_BARE' || (cond.type === 'COND_IF' && /\b(if|when|provided|unless)\b/i.test(clauses[i]));
    const kA = isEN ? _enWords(cond.A) : _zhKeywords(cond.A);
    const kB = isEN ? _enWords(cond.B) : _zhKeywords(cond.B);
    if (!kA.length || !kB.length) continue;

    // 向后看至多 3 句找 ¬P∴¬Q 事实句；同句 B 之后的剩余也是候选
    const cands = [];
    const sameAfter = clauses[i].slice(cond.end).replace(/^[，,。；;\s]+/, '');
    if (sameAfter.trim()) cands.push(sameAfter);
    for (let j = i + 1; j <= Math.min(i + 3, clauses.length - 1); j++) cands.push(clauses[j]);
    for (const f of cands) {
      const infer = _findInfer(f);
      if (!infer) continue;
      const pre = f.slice(0, infer.idx);
      const post = f.slice(infer.idx + infer.word.length);
      // 判定式：前半回指**前件 A** 且被否定（¬P）；后半回指**后件 B** 且被否定（¬Q）
      const aNegInPre = _matchNegIn(pre, kA, isEN);
      const bNegInPost = _matchNegIn(post, kB, isEN);
      if (!aNegInPre || !bNegInPost) continue;
      // 句内对冲守卫
      if (HEDGE.some(h => f.includes(h))) continue;
      hits.push({ clause: clauses[i], fact: f, type: cond.type, A: cond.A.trim(), B: cond.B.trim() });
      break; // 每个条件句只记一处
    }
  }

  if (!hits.length) return _pass();

  const baseScore = { COND_IF: 70, COND_UNIVERSAL: 74, COND_HUI: 66, EN_RULE: 70, EN_BARE: 68 };
  let score = 0;
  for (const h of hits) score = Math.max(score, (baseScore[h.type] || 66) + 4);
  score += Math.min(4 * (hits.length - 1), 18);
  score = Math.min(score, 92);

  const first = hits[0];
  const detail = '否定前件（并非P所以并非Q的无效演绎）' + hits.length + '处：由「' + first.A.slice(0, 20) +
    '」不成立，断言「' + first.B.slice(0, 24) + '」也不成立——前件不成立推不出后件不成立';
  return {
    score,
    verdict: score >= 70 ? 'unsupported' : 'pass',
    exempt: false,
    exempt_reason: null,
    count: hits.length,
    detail,
    hits: hits.map(h => ({ clause: h.clause, fact: h.fact, type: h.type })),
    strength: score >= 84 ? 'high' : score >= 70 ? 'medium' : 'none',
  };
}

module.exports = {
  checkDenyingTheAntecedent,
  __internals: {
    COND_IF, COND_UNIVERSAL, COND_HUI,
    INFER_ZH, INFER_EN,
    NEG_ZH, NEG_EN, BICONDITIONAL, NEGATION_FLIP, HEDGE, META_CONCEPT, TEACH, EVIDENCE,
    EN_STOP, ZH_STOP,
  },
};
