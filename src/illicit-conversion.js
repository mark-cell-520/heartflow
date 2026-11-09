/**
 * src/illicit-conversion.js
 * [r168] 第 167 维度 illicit_conversion（不当换位谬误）。
 *
 * 形态：所有 A 都是 B，所以所有 B 都是 A——把单向包含关系反转成双向。
 *   「所有猫都是动物，所以动物都是猫」
 *   「畅销的车都省油，所以省油的车都畅销」
 *   「爱国者都支持国产，所以支持国产的都是爱国者」
 *   「All squares are rectangles, so all rectangles are squares.」
 *   「Every poet loves language, so everyone who loves language is a poet.」
 *
 * 判据（双腿共现，缺一不判）：
 *   腿① PREMISE 全称肯定前提——带全称量词（所有/全部/任何/每个/每一/凡/
 *       一切/一律）或裸「都」形的 A⊆B 陈述；EN: all/every/any/each A are B
 *       或裸名词句 A are B。切出主项 A 与谓项 B。
 *   腿② CONVERSION 换位结论——推断词（所以/因此/可见/这说明/so/therefore）
 *       之后（或紧跟的下一句）出现一个以 B 为主项、以 A 为谓项的陈述，
 *       即把前提的主谓项对调后全称化。
 *
 * 这个「主谓对调」结构天然区分有效推理与相关句式：
 *   - 特称换位（有些A是B ∴ 有些B是A）：有效，不判
 *   - 否定换位（所有A都不是B ∴ 所有B都不是A）：有效，不判
 *   - 单称例示（所有A都是B ∴ 这个a是B）：结论主项回指 A 不回指 B，不判
 *   - 有效三段论（所有M都是X，所有Y都是M ∴ Y都是X）：结论主项是第二前提的
 *     主项、谓项是第一前提的谓项，两腿都对不上，不判
 *   - 前提重述（所有A都是B ∴ A都是B）：方向未对调，不判
 *
 * 守卫常量（全部可被负例注入置空，见 test/round-168-illicit-conversion.js）：
 *   PARTICULAR     特称量词（有些/某些/部分/个别/有的/some/certain）——有效换位
 *   HEDGE          对冲/宽泛量（可能/也许/往往/通常/大多数/maybe/most）
 *   NEG_ZH/NEG_EN  否定词——否定换位有效、否定结论是正确的换位否认
 *   BICONDITIONAL  双条件（当且仅当/iff）——双条件下换位有效
 *   SYMMETRIC      对称关系（同一/等同于/互为/equivalent/identical）
 *   META_CONCEPT   谬误概念转述（不当换位/换位命题/逻辑谬误/illicit conversion）
 *   TEACH          教学转述（老师/教材/课堂/textbook）
 *   EVIDENCE       证据语境讨论（孤证/证据不足/insufficient evidence）
 *
 * 决策出处：heartflow_philosophy_decision（type=accelerate / confidence 0.7 /
 * priority 40；rationale 的 cognitiveLoad 与 uncertainty 为 "unknown"）。
 * 候选池来自 /tmp/r168-gap-probe.js 在当前 v6.8.95 / 166 维引擎实测：
 * 换位攻击族 8 条 7 条真零命中（仅 1 条被 stereotype/perfect_error 代拦）；
 * 对照候选中项不周延族仅 2/8 零命中（多被 affirming_the_consequent 代拦），
 * 故选换位族。 affirming_the_consequent(155) 管 Q∴P，denying_the_antecedent(165)
 * 管 ¬P∴¬Q，conditional_proposition(160) 管 ¬B⇒¬A，本族管 B⊇A 的主谓对调。
 */
'use strict';

// ── 腿①：全称量词与存在/特称量词 ─────────────────────────────
const UNIVERSAL_ZH = ['所有', '全部', '任何', '每一个', '每个', '每一', '凡', '一切', '一律', '毫无例外', '但凡'];
// [r266 新增族] 后置全称量词（主语之后的「清一色/统统/尽数」：
// 「入围的清一色是优等生」= 所有入围的都是优等生）。不收「无一」——
// 否定全称的换位（无S是P ↔ 无P是S）是有效推理，语义上不属本族。
const POST_UNIVERSAL_ZH = ['清一色', '统统', '尽数', '全数'];
const UNIVERSAL_EN = ['all', 'every', 'any', 'each'];
const PARTICULAR = ['有些', '某些', '部分', '个别', '有的', '有一些', '一部分', 'some', 'certain', 'several'];

// ── 腿②：推断连接词 ───────────────────────────────────────────
const INFER_ZH = ['足以证明', '这就说明', '那就意味着', '这就意味着', '显然是', '肯定是', '准是', '意味着', '说明', '证明', '可见', '所以', '因此', '就是说', '故'];
const INFER_EN = ['so', 'therefore', 'thus', 'which means', 'that means', 'proves that', 'it follows', 'consequently', 'hence'];
// 前提标记（倒装形「所以结论，因为前提」的路由）
const PREMISE_MARKERS = ['因为', '由于', '鉴于', 'because', 'since'];

// ── 守卫 ──────────────────────────────────────────────────────
const NEG_ZH = ['没', '无', '未', '并非', '不是', '不', '别', '毫无', '并不', '未曾', '不曾', '未必'];
const NEG_EN = ['no', 'not', 'never', 'nor', 'neither', 'cannot', "can't", "won't", "wouldn't", "isn't", "aren't", "doesn't", "didn't", "don't", 'without'];
const HEDGE = ['可能', '也许', '或许', '大概', '恐怕', '未必', '不一定', '之一', '其中之一', '往往', '通常', '一般来说', '多数', '大多数', '大部分', '大多', 'perhaps', 'maybe', 'might', 'could be', 'most', 'likely', 'generally'];
const BICONDITIONAL = ['当且仅当', '有且仅有', '唯有', 'iff', 'if and only if', 'only if', 'only when', '必要且充分', '充要条件'];
const SYMMETRIC = ['同一', '等同于', '互为', 'equivalent', 'identical', 'is the same as', 'the same as'];
const META_CONCEPT = ['不当换位', '换位不当', '换位法', '换位命题', '逆命题', '逻辑谬误', '形式谬误', '谬误', 'illicit conversion', 'logical fallacy', 'formal fallacy', 'fallacy'];
const TEACH = ['老师', '教材', '课堂', '教授', '讲师', '课本', '课程', '教研室', 'textbook', 'lecture', 'lesson', 'professor'];
const EVIDENCE = ['证据不足', '证据不充分', '无法证明', '孤证', '需要更多证据', '尚待', '存疑', '不能证明', 'not enough evidence', 'insufficient evidence', 'cannot prove', 'yet to be proven'];

const EN_STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'that', 'this', 'it', 'its', 'as', 'if', 'then', 'would', 'will', 'can', 'could', 'may', 'might', 'must', 'he', 'she', 'they', 'his', 'her', 'their', 'we', 'you', 'i', 'so', 'therefore', 'thus', 'hence', 'not', 'no', 'does', 'do', 'did', 'has', 'have', 'had', 'all', 'every', 'any', 'each', 'some', 'certain', 'most', 'who', 'which']);
const ZH_STOP = new Set(['的', '是', '了', '在', '有', '和', '与', '也', '都', '就', '还', '会', '能', '要', '不', '没', '这', '那', '其', '之', '以', '为', '于', '很', '太', '更', '最', '啊', '吧', '呢', '吗', '呀', '把', '被', '从', '向', '对', '等', '所', '如', '果', '若', '只', '现', '场', '因', '此', '说', '明', '证', '见', '意', '味', '着', '即', '便', '可', '肯', '准', '显', '然', '凡', '一', '切', '每', '各', '诸']);

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

// 关键词匹配：连续子串 → EN 词集 → EN 前4词干（rain/rains/rained 归一）→ ZH 实字重叠回退
function _matchKw(s, kws, isEN) {
  for (const k of kws) { if (s.includes(k)) return k; }
  if (isEN) {
    const sWords = new Set(_enWords(s));
    for (const k of kws) { if (sWords.has(k)) return k; }
    for (const w of sWords) {
      if (w.length < 4) continue;
      const stem = w.slice(0, 4);
      for (const k of kws) { if (k.length >= 4 && k.slice(0, 4) === stem) return k; }
    }
    return null;
  }
  const sChars = new Set([...s].filter(ch => !ZH_STOP.has(ch) && !/[\s，。！？；：、,.!?;:()]/.test(ch)));
  // 单字谓项回退：结论谓项只有 1 个实字时允许被前提关键词反向包含（飞 ⊆ 会飞的）
  if (sChars.size === 1) {
    const ch = [...sChars][0];
    for (const k of kws) { if (k.length > 1 && k.includes(ch)) return k; }
  }
  for (const k of kws) {
    const kc = [...k].filter(ch => !ZH_STOP.has(ch));
    if (kc.length < 2) continue;
    const shared = kc.filter(ch => sChars.has(ch));
    if (shared.length >= 2 && shared.length / kc.length >= 0.5) return k;
  }
  return null;
}

function _hasNeg(s, isEN) {
  if (isEN) return new RegExp('\\b(' + NEG_EN.join('|') + ')\\b', 'i').test(s);
  return NEG_ZH.some(n => s.includes(n));
}

function _findInfer(f) {
  const low = f.toLowerCase();
  let best = null;
  for (const w of INFER_ZH) {
    const idx = f.indexOf(w);
    if (idx >= 0 && (!best || w.length >= best.word.length)) best = { word: w, idx };
  }
  for (const w of INFER_EN) {
    const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    const mt = low.match(re);
    if (mt && (!best || mt.index < best.idx)) best = { word: w, idx: mt.index };
  }
  return best;
}

// 前提标记查找（倒装形路由：「所以B都是A，因为所有A都是B」）
function _findPremiseMarker(f) {
  const low = f.toLowerCase();
  let best = null;
  for (const w of PREMISE_MARKERS) {
    const idx = /^[a-z]+$/.test(w) ? low.indexOf(w) : f.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx)) best = { word: w, idx };
  }
  return best;
}

// ── 腿①：全称肯定前提解析 ──────────────────────────────────────
const COPULA = ['都是', '皆是', '全是', '均是', '都属于', '属于', '乃是', '就是', '为', '是'];

function _findCopula(rest) {
  let best = null;
  for (const w of COPULA) {
    const idx = rest.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      if (!best || w.length >= best.word.length) best = { word: w, idx };
    }
  }
  return best;
}

function _stripLead(s) {
  return s.replace(/^[，,。；;、\s]+/, '').replace(/^(?:的|是|为)/, '').trim();
}

function _parsePremise(c) {
  const isENText = /[a-zA-Z]/.test(c) && !/[\u4e00-\u9fff]/.test(c);
  if (isENText) {
    for (const u of UNIVERSAL_EN) {
      const re = new RegExp('\\b' + u + '\\s+(.+?)\\s+(?:are|is)\\s+(.+)$', 'i');
      const mt = c.match(re);
      if (mt) {
        const A = mt[1].trim(), B = mt[2].trim();
        if (_enWords(A).length && _enWords(B).length) return { A, B, type: 'EN_QUANT' };
      }
    }
    // 无系词动词前提：All top coders read source code / Every poet loves language
    for (const u of UNIVERSAL_EN) {
      const re = new RegExp('\\b' + u + '\\s+(.+?)\\s+\\w+s\\s+(.+)$', 'i');
      const mt = c.match(re);
      if (mt) {
        const A = mt[1].trim(), B = mt[2].trim();
        if (_enWords(A).length && _enWords(B).length) return { A, B, type: 'EN_QUANT' };
      }
    }
    // [r266 新增族] 后置全称修饰：The inductees are without exception top performers
    const mExc = c.match(/^(.+?)\s+(?:are|is)\s+without\s+exception\s+(.+)$/i);
    if (mExc) {
      const A = mExc[1].trim(), B = mExc[2].trim();
      if (_enWords(A).length && _enWords(B).length) return { A, B, type: 'EN_QUANT' };
    }
    const bare = c.match(/^(.+?)\s+(?:are|is)\s+(.+)$/i);
    if (bare) {
      const A = bare[1].trim(), B = bare[2].trim();
      if (_enWords(A).length >= 1 && _enWords(B).length) return { A, B, type: 'EN_BARE' };
    }
    const bareV = c.match(/^(.+?)\s+\w+s\s+(.+)$/i);
    if (bareV) {
      const A = bareV[1].trim(), B = bareV[2].trim();
      if (_enWords(A).length >= 1 && _enWords(B).length) return { A, B, type: 'EN_BARE' };
    }
    return null;
  }
  // 显式全称量词
  for (const u of UNIVERSAL_ZH) {
    const idx = c.indexOf(u);
    if (idx < 0) continue;
    const rest = c.slice(idx + u.length);
    const di = rest.indexOf('都');
    if (di > 0) {
      const A = _stripLead(rest.slice(0, di));
      const B = _stripLead(rest.slice(di + 1).replace(/^(?:是|为|属于|乃是)/, ''));
      if (A && B) return { A, B, type: 'QUANT' };
    }
    const cop = _findCopula(rest);
    if (cop && cop.idx > 0) {
      const A = rest.slice(0, cop.idx).trim();
      const B = rest.slice(cop.idx + cop.word.length).trim();
      if (A && B) return { A, B, type: 'QUANT' };
    }
  }
  // [r266 新增族] 后置全称量词形：A + 清一色/统统/尽数/全数 + (是|为) B
  // （「入围的清一色是优等生」= 所有入围的都是优等生；结论侧同步见
  //  _parseConversion 的同族路由）
  for (const u of POST_UNIVERSAL_ZH) {
    const idx = c.indexOf(u);
    if (idx <= 0) continue;
    const A = _stripLead(c.slice(0, idx));
    const rest = c.slice(idx + u.length).replace(/^(?:是|为|属于|乃是|都能|皆为|全是)/, '');
    const B = _stripLead(rest);
    if (A && B) return { A, B, type: 'QUANT' };
  }
  // 裸「都」形：A 都(是) B
  let from = 0, di;
  while ((di = c.indexOf('都', from)) >= 0) {
    const A = _stripLead(c.slice(0, di));
    const B = _stripLead(c.slice(di + 1).replace(/^(?:是|为|属于|乃是)/, ''));
    if (A && B) return { A, B, type: 'DOU' };
    from = di + 1;
  }
  return null;
}

// ── 腿②：换位结论解析（主项/谓项切分，量词可选）────────────────
function _parseConversion(c) {
  const isENText = /[a-zA-Z]/.test(c) && !/[\u4e00-\u9fff]/.test(c);
  if (isENText) {
    for (const u of UNIVERSAL_EN) {
      const re = new RegExp('\\b' + u + '\\s+(.+?)\\s+(?:are|is)\\s+(.+)$', 'i');
      const mt = c.match(re);
      if (mt) {
        const S = mt[1].trim(), P = mt[2].trim();
        if (_enWords(S).length && _enWords(P).length) return { S, P, universal: true, type: 'EN_QUANT' };
      }
    }
    const bare = c.match(/^(.+?)\s+(?:are|is)\s+(.+)$/i);
    if (bare) {
      const S = bare[1].trim(), P = bare[2].trim();
      if (_enWords(S).length && _enWords(P).length) return { S, P, universal: true, type: 'EN_BARE' };
    }
    return null;
  }
  let universal = false;
  let body = c;
  for (const u of UNIVERSAL_ZH) {
    const idx = body.indexOf(u);
    if (idx >= 0) { universal = true; body = body.slice(idx + u.length); break; }
  }
  // [r266 新增族] 后置全称量词结论形：S + 清一色/统统/尽数/全数 + 谓词
  // （「优等生清一色能入围」——S 在量词之前，谓词可为动词短语）
  for (const u of POST_UNIVERSAL_ZH) {
    const idx = body.indexOf(u);
    if (idx <= 0) continue;
    const S = _stripLead(body.slice(0, idx));
    const P = _stripLead(body.slice(idx + u.length).replace(/^(?:是|为|属于|乃是)/, ''));
    if (S && P) return { S, P, universal: true, type: 'QUANT' };
  }
  const di = body.indexOf('都');
  if (di > 0) {
    universal = true;
    const S = _stripLead(body.slice(0, di));
    const P = _stripLead(body.slice(di + 1).replace(/^(?:是|为|属于|乃是)/, ''));
    if (S && P) return { S, P, universal, type: 'DOU' };
  }
  const cop = _findCopula(body);
  if (cop && cop.idx > 0) {
    const S = _stripLead(body.slice(0, cop.idx));
    const P = _stripLead(body.slice(cop.idx + cop.word.length));
    if (S && P) return { S, P, universal, type: 'COPULA' };
  }
  return null;
}

// 结论候选是否携带显式全称标记（裸跟句需要它才敢当结论）
function _hasUniversalMarker(c) {
  if (UNIVERSAL_ZH.some(u => c.includes(u))) return true;
  // [r266 新增族] 后置全称量词同样算显式全称标记
  if (POST_UNIVERSAL_ZH.some(u => c.includes(u))) return true;
  if (UNIVERSAL_EN.some(u => new RegExp('\\b' + u + '\\b', 'i').test(c))) return true;
  return c.includes('都');
}

function _exempt(reason, word) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason + ':' + word, count: 0, detail: '', hits: [], strength: 'none' };
}

function _pass() {
  return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [], strength: 'none' };
}

// 裸谓词前提回退切分：pre 无系词/量词/都 时（「坚持锻炼的人免疫力强」），
// 按结论主项/谓项关键词在 pre 中出现的位置切出 A 与 B。
function _splitBare(pre, S, P, isEN) {
  if (!pre || !pre.trim()) return null;
  if (isEN) {
    const words = pre.split(/\s+/).filter(Boolean);
    for (let k = 1; k < words.length; k++) {
      const a1 = words.slice(0, k).join(' '), b1 = words.slice(k).join(' ');
      if (_matchKw(a1, [P], true) && _matchKw(b1, [S], true)) return { A: a1, B: b1 };
      const a2 = words.slice(k).join(' '), b2 = words.slice(0, k).join(' ');
      if (_matchKw(a2, [P], true) && _matchKw(b2, [S], true)) return { A: a2, B: b2 };
    }
    return null;
  }
  const clean = pre.replace(/[，。！？；：、,.!?;:()\s]+/g, '');
  for (let p = 2; p <= clean.length - 1; p++) {
    const a1 = clean.slice(0, p), b1 = clean.slice(p);
    if (_matchKw(a1, [P], false) && _matchKw(b1, [S], false)) return { A: a1, B: b1 };
    const a2 = clean.slice(p), b2 = clean.slice(0, p);
    if (_matchKw(a2, [P], false) && _matchKw(b2, [S], false)) return { A: a2, B: b2 };
  }
  return null;
}

function checkIllicitConversion(text) {
  const t = typeof text === 'string' ? text : '';
  if (!t.trim()) return _pass();

  // 全文级守卫（顺序：概念/教学/证据/双条件/对称关系）
  for (const m of META_CONCEPT) { if (t.includes(m)) return _exempt('META_CONCEPT', m); }
  for (const m of TEACH) { if (t.includes(m)) return _exempt('TEACH', m); }
  for (const m of EVIDENCE) { if (t.includes(m)) return _exempt('EVIDENCE', m); }
  for (const m of BICONDITIONAL) { if (t.toLowerCase().includes(m.toLowerCase())) return _exempt('BICONDITIONAL', m); }
  for (const m of SYMMETRIC) { if (t.toLowerCase().includes(m.toLowerCase())) return _exempt('SYMMETRIC', m); }

  const clauses = _clauses(t);
  const hits = [];

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    // 前提 = 推断词之前的部分；同句推断词之后的部分是结论候选
    const inf = _findInfer(clause);
    const pre = inf ? clause.slice(0, inf.idx) : clause;
    let prem = _parsePremise(pre);
    if (prem && (!prem.A.trim() || !prem.B.trim())) prem = null;
    // 倒装形路由：结论在前、前提在后（「所以B都是A，因为所有A都是B」）
    let preFromMarker = null;
    if (!prem) {
      const pm = _findPremiseMarker(clause);
      if (pm) {
        const tail = clause.slice(pm.idx + pm.word.length);
        const p2 = _parsePremise(tail);
        if (p2 && p2.A.trim() && p2.B.trim()) preFromMarker = { text: tail, prem: p2 };
      }
    }
    const activePrem = prem || (preFromMarker && preFromMarker.prem) || null;
    const activePre = prem ? pre : (preFromMarker ? preFromMarker.text : pre);

    // 结论候选：同句推断词后 / 后随 3 句 / 前置 2 句（倒装形）
    const cands = [];
    if (inf && clause.slice(inf.idx + inf.word.length).trim()) {
      cands.push({ text: clause.slice(inf.idx + inf.word.length), mode: 'after-infer' });
    }
    for (let j = i + 1; j <= Math.min(i + 3, clauses.length - 1); j++) {
      cands.push({ text: clauses[j], mode: 'follow' });
    }
    for (let j = Math.max(0, i - 2); j < i; j++) {
      cands.push({ text: clauses[j], mode: 'back' });
    }

    for (const cand of cands) {
      let body = cand.text;
      const cinf = _findInfer(body);
      if (cinf) body = body.slice(cinf.idx + cinf.word.length);
      else if (cand.mode === 'back') continue;
      // 结论候选里再出现前提标记（「所以B都是A，因为所有A都是B」同句）→ 截到标记前
      const pmBody = _findPremiseMarker(body);
      if (pmBody) body = body.slice(0, pmBody.idx);
      body = body.replace(/^[，,。；;、\s]+/, '').trim();
      if (!body) continue;
      // 裸跟句（无推断词）须自带全称标记才敢当结论；倒装句必须带推断词
      if (!cinf && cand.mode === 'follow' && !_hasUniversalMarker(body)) continue;
      const conv = _parseConversion(body);
      if (!conv) continue;
      const isEN = (activePrem && (activePrem.type === 'EN_QUANT' || activePrem.type === 'EN_BARE'))
        || (/[a-zA-Z]/.test(body) && !/[\u4e00-\u9fff]/.test(body));
      // 特称/对冲/否定/疑问 → 有效换位、正确否认或非断言，不判
      if (PARTICULAR.some(p => body.toLowerCase().includes(p))) continue;
      if (HEDGE.some(h => body.includes(h))) continue;
      if (_hasNeg(body, isEN)) continue;
      if (/[吗呢？?]$/.test(body)) continue;
      // 前提：优先解析形，退回裸谓词切分（「坚持锻炼的人免疫力强」）
      let A, B, type;
      if (activePrem) { A = activePrem.A; B = activePrem.B; type = activePrem.type; }
      else {
        const bare = _splitBare(activePre, conv.S, conv.P, isEN);
        if (!bare) continue;
        A = bare.A; B = bare.B; type = 'BARE';
      }
      if (HEDGE.some(h => A.includes(h) || B.includes(h))) continue;
      const kA = isEN ? _enWords(A) : _zhKeywords(A);
      const kB = isEN ? _enWords(B) : _zhKeywords(B);
      if (!kA.length || !kB.length) continue;
      // 方向判定：主项回指谓项 B、谓项回指主项 A；方向未对调（前提重述）不判
      const subjToB = _matchKw(conv.S, kB, isEN);
      const predToA = _matchKw(conv.P, kA, isEN);
      if (!subjToB || !predToA) continue;
      const subjToA = _matchKw(conv.S, kA, isEN);
      const predToB = _matchKw(conv.P, kB, isEN);
      if (subjToA && predToB) continue;
      hits.push({ premise: activePre.trim(), conclusion: body, type, A: A.trim(), B: B.trim() });
      break;
    }
  }

  if (!hits.length) return _pass();

  const baseScore = { QUANT: 74, DOU: 72, EN_QUANT: 72, EN_BARE: 70 };
  let score = 0;
  for (const h of hits) score = Math.max(score, baseScore[h.type] || 70);
  score += Math.min(3 * (hits.length - 1), 9);
  score = Math.min(score, 90);

  const first = hits[0];
  const detail = '不当换位（所有A都是B推不出所有B都是A）' + hits.length + '处：由「' + first.A.slice(0, 20) +
    '」都属于「' + first.B.slice(0, 20) + '」，反推「' + first.B.slice(0, 16) + '」都属于「' + first.A.slice(0, 16) + '」——单向包含反转不成双向';
  return {
    score,
    verdict: score >= 70 ? 'unsupported' : 'pass',
    exempt: false,
    exempt_reason: null,
    count: hits.length,
    detail,
    hits: hits.map(h => ({ premise: h.premise, conclusion: h.conclusion, type: h.type })),
    strength: score >= 84 ? 'high' : score >= 70 ? 'medium' : 'none',
  };
}

module.exports = {
  checkIllicitConversion,
  __internals: {
    UNIVERSAL_ZH, UNIVERSAL_EN, PARTICULAR,
    INFER_ZH, INFER_EN, PREMISE_MARKERS,
    NEG_ZH, NEG_EN, HEDGE, BICONDITIONAL, SYMMETRIC, META_CONCEPT, TEACH, EVIDENCE,
    EN_STOP, ZH_STOP,
  },
};
