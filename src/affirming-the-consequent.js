/**
 * src/affirming-the-consequent.js
 * [r725] 第 155 维度 affirming_the_consequent（肯定后件谬误）。
 *
 * 形态：如果 P 则 Q；Q 在场，所以 P——把结果当证据倒推原因。
 *   「如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的」
 *   「努力的人都会早起；他天天早起，所以他很努力」
 *   「Good code has tests. This module has tests, so the code is good.」
 *
 * 判据（双腿共现，缺一不判）：
 *   腿① COND 条件/规则句——如果X则Y / X都会Y / X会Y / X has Y / 英文裸规则句
 *   腿② BACKWARD 后件重现×推断词×前件肯定结论——按推断词切分事实句，
 *        前半须含腿①后件关键词、后半须回指腿①前件关键词。
 *        这个切分天然区分三种有效推理：
 *        - modus ponens（P→Q, P∴Q）：事实句回指前件、结论出后件 → 不判
 *        - modus tollens（P→Q, ¬Q∴¬P）：后件被否定或无重现 → 不判
 *        - 归纳/举证不足：后件未原样重现 → 不判
 *
 * 守卫常量（全部可被负例注入，见 scripts/negative-test-affirming-the-consequent.js）：
 *   NEG_ZH / NEG_EN  后件或前件被否定 → 有效推理，不判
 *   HEDGE            对冲/充分性否定（可能/未必/必要不充分/not sufficient）→ 不判
 *   META_CONCEPT     谬误概念转述 → 不判
 *   TEACH            教学转述 → 不判
 *   EVIDENCE         证据语境讨论（孤证/证据不足/cannot prove）→ 不判
 *
 * 决策出处：scripts/decide-r725.js，decision 本体一次选中无打平
 * （composite 0.86 / confidence 0.86 / identity_alignment 0.8）。
 * 候选池来自 scripts/round-725-family-probe.js 在 v6.8.72 / 154 维引擎实测：
 * 攻击漏判 14/15（93%）全池最高、误伤 0/8、漏判中真零命中 14/14。
 */
'use strict';

// ── 腿①：条件/规则句标记 ──────────────────────────────
// 条件连接词（如果 X，（那么/则/就）Y）
const COND_IF = ['如果', '若', '只要', '要是', '倘若', '倘使', '假如', '假使', '设若', '一旦', 'if', 'when', 'whenever', 'provided', 'unless'];
// 全称规则标记（X 都会/都/皆 Y）
const COND_UNIVERSAL = ['都会有', '都会', '才有', '方能', '才有可能', '必然', '注定', '皆', '都'];
// 「会」条件标记（X 会 Y，隐含条件结果）
const COND_HUI = ['会'];

// ── 腿②：推断连接词（事实 → 结论）──────────────────────
const INFER_ZH = ['足以证明', '这就说明', '这就证明', '足以见', '显然是', '肯定是', '准是', '意味着', '说明', '证明', '可见', '所以', '因此', '就是说'];
const INFER_EN = ['so', 'therefore', 'thus', 'which means', 'that means', 'proves that', 'proof that', 'it follows', 'consequently', 'hence'];

// ── 守卫 ──────────────────────────────────────────────
const NEG_ZH = ['没', '无', '未', '并非', '不是', '不', '别', '毫无', '并不'];
const NEG_EN = ['no', 'not', 'never', 'nor', 'neither', 'cannot'];
const HEDGE = ['可能', '也许', '未必', '不一定', '之一', '其中之一', '还要看', '不能反推', '说明不了', '必要不充分', '或然', '难以证明', '不必然', 'perhaps', 'maybe', 'might', 'could be', 'not sufficient', 'not conclusive', 'cannot conclude'];
const META_CONCEPT = ['肯定后件', '逆命题', '充分必要', '逻辑谬误', '形式谬误', '谬误', 'affirming the consequent', 'formal fallacy', 'logical fallacy', 'fallacy'];
const TEACH = ['老师', '教材', '课堂', '教授', '讲师', '课本', '课程', '教研室', 'textbook', 'lecture', 'lesson', 'professor'];
const EVIDENCE = ['证据不足', '证据不充分', '无法证明', '孤证', '需要更多证据', '尚待', '存疑', '不能证明', 'not enough evidence', 'insufficient evidence', 'cannot prove', 'yet to be proven'];

// 英文停用词（回指匹配时过滤）
const EN_STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'that', 'this', 'it', 'its', 'as', 'if', 'then', 'would', 'will', 'can', 'could', 'may', 'might', 'must', 'he', 'she', 'they', 'his', 'her', 'their', 'we', 'you', 'i', 'so', 'therefore', 'thus', 'hence', 'not', 'no', 'does', 'do', 'did', 'has', 'have', 'had']);

// 中文虚字（子串全虚则丢弃）
const ZH_STOP = new Set(['的', '是', '了', '在', '有', '和', '与', '也', '都', '就', '还', '会', '能', '要', '不', '没', '这', '那', '其', '之', '以', '为', '于', '很', '太', '更', '最', '啊', '吧', '呢', '吗', '呀', '把', '被', '从', '向', '对', '等', '所', '如', '果', '若', '只', '现', '场', '所', '因', '此', '说', '明', '证', '见', '意', '味', '着', '即', '便', '可', '肯', '准', '显', '然']);

function _clauses(t) {
  const parts = t.split(/[。；;！!？?\n]+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    // 英文句点二次切分（保留缩写宽容：只切 ". " 后接大写/引号形态）
    const subs = p.split(/\.(?=\s|[A-Z"']|$)/).map(s => s.trim()).filter(Boolean);
    for (const s of subs) out.push(s);
  }
  return out;
}

// 中文关键词：2-4 字滑窗子串（全虚则弃）；片段 ≤2 字时保留原文
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

// 英文关键词：实词
function _enWords(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 1 && !EN_STOP.has(w));
}

// 回指匹配：先连续子串/整词，再非停用字重叠回退
// （「犯这种错」vs「犯了这个错」中间插入字，连续匹配会 MISS，共享实字兜底）
// 否定检测用整段——modus tollens 的事实句本质是否定后件（「现场没有痕迹」），
// 否定词与关键词的距离不固定（「does not look nervous」隔 6 字符），窄窗会漏。
function _matchIn(s, kws, isEN, negs) {
  if (negs.some(n => s.includes(n))) return null;
  for (const k of kws) {
    if (s.includes(k)) return k;
  }
  if (isEN) {
    const sWords = new Set(_enWords(s));
    for (const k of kws) { if (sWords.has(k)) return k; }
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

// 从条件句切分前件 A / 后件 B；end = B 在句内的结束下标（其后内容归事实句）
function _parseCondition(c) {
  // B 截断到首个逗号或首个推断词（先到者）——条件句与事实句可能同句仅逗号分隔
  function cutB(from) {
    let end = c.length;
    const comma = c.slice(from).search(/[，,]/);
    if (comma >= 0) end = Math.min(end, from + comma);
    const inf = _findInfer(c.slice(from));
    if (inf) end = Math.min(end, from + inf.idx);
    return end;
  }
  // ① 条件连接词型（大小写不敏感）
  for (const m of COND_IF) {
    const idx = c.toLowerCase().indexOf(m.toLowerCase());
    if (idx < 0) continue;
    const rest = c.slice(idx + m.length);
    // 连接词后按首个逗号切 A/B；无逗号则按「那么/则/就」切，再无则后半段
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
    const type = m === 'if' || m === 'when' || m === 'whenever' || m === 'provided' || m === 'unless' ? 'EN_RULE' : 'COND_IF';
    return { A, B: c.slice(from, end), type, end };
  }
  // ② 全称规则型
  for (const m of COND_UNIVERSAL) {
    const idx = c.indexOf(m);
    if (idx < 0) continue;
    const A = c.slice(0, idx);
    const from = idx + m.length;
    const end = cutB(from);
    if (A.trim() && c.slice(from, end).trim()) return { A, B: c.slice(from, end), type: 'COND_UNIVERSAL', end };
  }
  // ③ 「会」条件型（中文，无连接词无都会）
  for (const m of COND_HUI) {
    const hui = c.indexOf(m);
    if (hui <= 0) continue;
    const A = c.slice(0, hui);
    const from = hui + m.length;
    const end = cutB(from);
    if (A.trim() && c.slice(from, end).trim()) return { A, B: c.slice(from, end), type: 'COND_HUI', end };
  }
  // ④ 英文规则句：X has/have Y
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
  // ⑤ 英文裸规则句：前 2 词 = A，其余 = B（Successful founders read a lot.）
  // 不要求首字母大写——判别入口的 text-normalizer 归一化会把英文小写化
  // （v6.7.70 对抗混淆归一化），大写要求会让归一化后全部 MISS。
  const w = c.split(/\s+/).filter(Boolean);
  if (/[a-zA-Z]/.test(c) && w.length >= 3 && !INFER_EN.some(x => c.toLowerCase().includes(x))) {
    const A = w.slice(0, 2).join(' ');
    const from = c.indexOf(w[2]);
    const end = cutB(from);
    if (_enWords(A).length && _enWords(c.slice(from, end)).length) return { A, B: c.slice(from, end), type: 'EN_BARE', end };
  }
  return null;
}

// 找事实句中的推断词（长词优先）
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

function checkAffirmingTheConsequent(text) {
  const t = typeof text === 'string' ? text : '';
  if (!t.trim()) {
    return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [], strength: 'none' };
  }

  // 全文级豁免
  for (const m of META_CONCEPT) { if (t.includes(m)) return _exempt('META_CONCEPT', m); }
  for (const m of TEACH) { if (t.includes(m)) return _exempt('TEACH', m); }
  for (const m of EVIDENCE) { if (t.includes(m)) return _exempt('EVIDENCE', m); }

  const clauses = _clauses(t);
  const hits = [];

  for (let i = 0; i < clauses.length; i++) {
    const cond = _parseCondition(clauses[i]);
    if (!cond || !cond.B.trim()) continue;
    const isEN = cond.type === 'EN_RULE' || cond.type === 'EN_BARE' || cond.type === 'COND_IF' && /\b(if|when|provided|unless)\b/i.test(clauses[i]);
    const kA = isEN ? _enWords(cond.A) : _zhKeywords(cond.A);
    const kB = isEN ? _enWords(cond.B) : _zhKeywords(cond.B);
    if (!kA.length || !kB.length) continue;
    const negs = isEN ? NEG_EN : NEG_ZH;

    // 向后看至多 3 句找倒推事实句；同句 B 之后的剩余也是候选（全逗号无分句标点时）
    const cands = [];
    const sameAfter = clauses[i].slice(cond.end).replace(/^[，,。；;\s]+/, '');
    if (sameAfter.trim()) cands.push(sameAfter);
    for (let j = i + 1; j <= Math.min(i + 3, clauses.length - 1); j++) cands.push(clauses[j]);
    for (const f of cands) {
      const infer = _findInfer(f);
      if (!infer) continue;
      const pre = f.slice(0, infer.idx);
      const post = f.slice(infer.idx + infer.word.length);
      // 判定式：前半含后件关键词（且未被否定）；后半回指前件关键词（且未被否定）
      const bInPre = _matchIn(pre, kB, isEN, negs);
      const aInPost = _matchIn(post, kA, isEN, negs);
      if (!bInPre || !aInPost) continue;
      // HEDGE 守卫（句中或全文）
      if (HEDGE.some(h => f.includes(h) || t.includes(h))) continue;
      hits.push({ clause: clauses[i], fact: f, type: cond.type, A: cond.A.trim(), B: cond.B.trim() });
      break; // 每个条件句只记一处
    }
  }

  if (!hits.length) {
    return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [], strength: 'none' };
  }

  const baseScore = { COND_IF: 70, COND_UNIVERSAL: 74, COND_HUI: 66, EN_RULE: 70, EN_BARE: 70 };
  let score = 0;
  for (const h of hits) score = Math.max(score, (baseScore[h.type] || 66) + 4);
  score += Math.min(4 * (hits.length - 1), 18);
  score = Math.min(score, 92);

  const first = hits[0];
  const detail = '肯定后件（把结果当证据倒推原因）' + hits.length + '处：「' + first.B.slice(0, 24) +
    '」在场就断言「' + first.A.slice(0, 24) + '」——后件成立不能反推前件成立';
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

function _exempt(reason, word) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason + ':' + word, count: 0, detail: '', hits: [], strength: 'none' };
}

module.exports = {
  checkAffirmingTheConsequent,
  __internals: {
    COND_IF, COND_UNIVERSAL, COND_HUI,
    INFER_ZH, INFER_EN,
    NEG_ZH, NEG_EN, HEDGE, META_CONCEPT, TEACH, EVIDENCE,
    EN_STOP, ZH_STOP,
  },
};
