/**
 * src/stolen-concept.js
 * [r293] 第 246 维度 stolen_concept（偷取概念谬误）。
 *
 * 形态：援引一个概念来论证，同时否认/否定该概念得以成立所依赖的前提，
 * 再据此否定该概念本身。经典教材形（Ayn Rand / Nathaniel Branden 命名）：
 *   「科学证明不了上帝存在，所以科学一无所用」
 *   「理性不能解释一切，所以理性毫无价值」
 *   「逻辑不能证明逻辑本身，所以逻辑是循环论证、不可信」
 *   「There is no objective truth, therefore science is worthless.」
 *   「Reason cannot justify itself, so reason is groundless.」
 *
 * 判据（三腿共现，缺一不判）：
 *   腿① NEGATE 能力否认——句中某**能力型概念**（科学/理性/逻辑/证据/推理/
 *         真理/观测/实验/演绎/归纳/事实/因果；EN science / reason / logic /
 *         evidence / proof / truth / objective / observation / experiment /
 *         deduction / induction / causality）被一个**能力否认谓语**
 *         （证明不了/解释不了/不能保证/并非万能/有其局限；cannot prove /
 *         cannot explain / is not able to / there is no）描述；
 *   腿② BRIDGE 推论桥——否认之后出现推论连接词（所以/因此/因而/可见/故/
 *         那么/so / therefore / thus / hence）；
 *   腿③ DEMOTE 贬斥结论——结论部分（同句否认谓语之后，或后续 1-2 句）里，
 *         同一概念（或其代词「它/其/此/it/this」）被**贬斥谓语**
 *         （不可信/毫无价值/一无所用/是循环/靠不住；is worthless / is
 *         circular / cannot be trusted）否定。
 *
 * 与正确批评的区分（本族最易混处）：
 *   - 「科学不能证明一切，所以科学只能处理可观测的现象」→ 结论限定范围，
 *     不是否定科学，不判（LIMIT_SCOPE 守卫）
 *   - 「逻辑不能自证，所以逻辑需要预设公理」→ 结论是正面修补，不判
 *     （REPAIR 守卫）
 *   - 「理性有局限，所以我们要谦卑」→ 结论无贬斥谓语，不判
 *   - 「因为科学证明不了神，所以神存在」→ 结论概念非能力概念，不判
 *   - 「用科学暂时解释不了的事来否定科学本身，是偷取概念谬误」→ 元判别
 *     句，不判（META_CONCEPT 守卫）
 *   - 「There is no evidence that science is worthless.」→ 无推论桥且
 *     否认不针对概念能力，不判
 *
 * 守卫常量（全部可被负例注入置空，见 test/round-293-stolen-concept.js）：
 *   META_CONCEPT  谬误概念/教学转述（偷取概念/逻辑谬误/textbook）
 *   LIMIT_SCOPE   范围限定结论（只能/仅/限于/适用范围/only/limited to）
 *   REPAIR        正面修补结论（需要/应当/预设/公理/requires/grounded in）
 *   HEDGE         对冲（可能/也许/或许/maybe/perhaps）
 *   QUESTION      疑问句
 *
 * 决策出处：heartflow_philosophy_decision（type=accelerate / confidence 0.7 /
 * priority 40；rationale 的 cognitiveLoad 与 uncertainty 为 "unknown"）。
 * 候选池：grep -ril 'stolen_concept|偷取概念' src/ → 零覆盖（r293 实测）。
 */
'use strict';

// ── 腿①素材：能力型概念（被援引却又被否认的对象）─────────────────
const CONCEPT_ZH = [
  '科学方法', '科学', '医学方法', '医学', '物理学', '生物学', '心理学', '社会学',
  '历史学', '数学', '统计学', '经济学方法', '经济学',
  '理性思维', '理性', '逻辑', '证据', '实证', '推理',
  '真理', '客观', '客观性', '事实', '观测', '观察', '实验', '演绎', '归纳',
  '经验', '因果律', '因果', '可重复', '可验证', '可证伪', '辩证法',
];
const CONCEPT_EN = [
  'scientific method', 'science', 'scientific', 'medicine', 'medical',
  'physics', 'biology', 'psychology', 'sociology', 'history', 'mathematics',
  'maths', 'statistics', 'economics', 'reason', 'rationality', 'logic',
  'logical', 'evidence', 'proof', 'empiricism', 'empirical', 'truth',
  'objective', 'objectivity', 'observation', 'experiment', 'deduction',
  'induction', 'causality', 'falsifiable', 'reproducible', 'data',
];

// ── 腿①素材：能力否认谓语（否认概念「能做到某事」）─────────────────
const NEGATE_ZH = [
  '证明不了', '无法证明', '不能证明', '不可证明', '证明不出',
  '解释不了', '无法解释', '不能解释', '解释不出',
  '回答不了', '无法回答', '不能回答',
  '观测不到', '不能观测', '无法观测', '不能直接观测',
  '给不出', '无法给出', '不能给出',
  '一无所知', '一无所能', '一无所用', '毫无用处', '没有用处', '没什么用',
  '不能保证', '无法保证', '保证不了',
  '未必可靠', '并非万能', '不是万能', '并不万能',
  '有局限', '有其局限', '局限性', '有边界',
  '无法触及', '触及不了', '推不出', '无法推出', '验证不了', '无法验证',
  '测不出', '测不到', '不能完全', '不能最终', '无法全面', '不能穷尽',
  // 自我奠基否认族——偷取概念谬误的教科书核心句式（概念不能自我奠基
  // → 概念不可信）。r293 变体矩阵实测发现缺口后补入。
  '不能自证', '无法自证', '自证不了', '不能自圆其说', '不能为自己辩护',
  '不能自我奠基', '无法自我奠基', '自我奠基不了', '不能自足', '无法自足',
  '不能证明自身', '不能解释自身', '不能替自己辩护', '不能自我证明',
  '不能自我解释', '不能自我支撑', '不能支撑自身',
];
const NEGATE_EN = [
  'cannot prove', "can't prove", 'unable to prove', 'fails to prove',
  'cannot explain', "can't explain", 'unable to explain', 'fails to explain',
  'cannot guarantee', "can't guarantee", 'is not infallible',
  'is not omniscient', 'is not omnipotent', 'is not perfect',
  'is not able to', 'is incapable of', 'fails to account for',
  'cannot account for', 'cannot tell us', "can't tell us",
  'cannot know', 'is unknowable', 'cannot be known',
  'there is no', 'no such thing as', 'cannot be proven', "can't be proven",
  'does not exist', 'no way to', 'never proves', 'has limits', 'is limited',
  // 自我奠基否认族（EN 侧）：justify / ground / establish itself。
  'cannot justify', "can't justify", 'cannot ground', "can't ground",
  'cannot establish', "can't establish", 'cannot validate', "can't validate",
  'cannot support itself', "can't support itself", 'cannot prove itself',
  "can't prove itself", 'is self-undermining', 'undermines itself',
  'cannot be justified', "can't be justified", 'cannot be grounded',
];

// ── 腿②素材：推论桥 ──────────────────────────────────────────
const BRIDGE_ZH = ['所以', '因此', '因而', '可见', '故', '于是', '那么', '这说明', '也就是说', '正因如此', '足见'];
const BRIDGE_EN = ['so', 'therefore', 'thus', 'hence', 'which means', 'that means', 'implying that', 'implying'];

// ── 腿③素材：贬斥谓语（结论把概念本身否定掉）─────────────────────
const DEMOTE_ZH = [
  '不可信', '不可靠', '靠不住', '不值一提', '毫无价值', '没有价值', '一文不值',
  '毫无用处', '毫无意义', '没有意义', '是迷信', '是盲信', '是循环', '是循环论证',
  '是自证', '是武断', '是自欺', '等于没有', '形同虚设', '别信', '不要信',
  '不必信', '不该信', '不必当真', '不值得信', '没什么价值', '不算什么',
  '无足轻重', '一无所用', '没什么用', '没有用处', '无用', '不成立', '站不住',
  '说不过去', '不算数', '当不得真', '有何用', '有何价值',
  // r293 补词：中置桥探针 A3「足见理性毫不足取」实测漏判——该词族
  // （不足取/不足为信/不足为凭/不足为据）是「结论否定概念」的常用文言形。
  '毫不足取', '不足取', '不足为信', '不足为凭', '不足为据', '岂可尽信',
  '岂足', '焉能尽信', '岂可尽凭',
];
const DEMOTE_EN = [
  'cannot be trusted', "can't be trusted", 'is untrustworthy', 'is unreliable',
  'is worthless', 'is useless', 'is meaningless', 'is circular', 'is groundless',
  'is arbitrary', 'is baseless', 'is self-defeating', 'amounts to nothing',
  'is not trustworthy', 'should not be trusted', 'is not reliable',
  'is no good', 'is of no value', 'is of no use', 'proves nothing',
];

// ── 结论中的概念回指（代词也算回指同一概念）───────────────────────
const PRONOUN_ZH = ['它', '其', '此', '这', '如此'];
const PRONOUN_EN = ['it', 'this', 'that', 'they', 'such'];

// ── 守卫 ──────────────────────────────────────────────────────
const META_CONCEPT = [
  '偷取概念', '偷换概念', '逻辑谬误', '形式谬误', '非形式谬误', '谬误', '悖论',
  '自相矛盾', 'stolen concept', 'logical fallacy', 'fallacy', 'paradox',
  'self-defeating', 'contradiction',
];
const LIMIT_SCOPE = [
  '只能', '仅仅', '仅', '只', '限于', '只适用于', '仅适用于', '在一定范围内',
  '有其适用范围', '适用范围', '边界', '边界在于', 'only', 'merely',
  'limited to', 'within its scope', 'its scope is',
];
const REPAIR = [
  '需要', '应当', '应该', '理应', '必须', '预设', '前提是', '立足于', '依赖于',
  '公理', 'axiom', 'presuppose', 'presupposition', 'requires', 'need',
  'must', 'rest on', 'rests on', 'is grounded', 'grounded in', 'depends on',
];
const HEDGE = ['可能', '也许', '或许', '大概', '恐怕', '未必', '不一定',
  'somewhat', 'perhaps', 'maybe', 'might', 'probably', 'to some extent'];
const QUESTION = ['?', '？'];

function _esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function _re(word) { return new RegExp('\\b' + _esc(word) + '\\b', 'i'); }

function _hasAny(s, list) {
  for (const w of list) {
    if (/^[a-z][a-z\s'-]*$/.test(w)) { if (_re(w).test(s)) return w; }
    else if (s.includes(w)) return w;
  }
  return null;
}

function _findConcept(s, list) {
  for (const c of list) {
    if (/^[a-z][a-z\s-]*$/.test(c)) { if (_re(c).test(s)) return c; }
    else if (s.includes(c)) return c;
  }
  return null;
}

// 句中是否回指某概念（概念原词，或其代词）
function _refersConcept(s, concept, isEN) {
  const pronouns = isEN ? PRONOUN_EN : PRONOUN_ZH;
  const c = _findConcept(s, isEN ? CONCEPT_EN : CONCEPT_ZH);
  if (c) return c;
  if (_hasAny(s, pronouns)) return '<代词回指>';
  return null;
}

function _clauses(t) {
  // EN 缩写保护：cannot / doesn't / isn't / won't 的句点不是句尾。
  const protectedText = t
    .replace(/\bcannot\b/gi, 'CAN_NOT_')
    .replace(/\b(can't|won't|isn't|doesn't|don't|didn't|shouldn't|wouldn't|couldn't|aren't|weren't|hasn't|haven't)\b/gi, m => m.replace(/['’]/g, '_'));
  const parts = protectedText.split(/[。；;！!？?\n]+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    for (const s of p.split(/\.(?=\s|[A-Z"']|$)/).map(x => x.trim()).filter(Boolean)) {
      out.push(s.replace(/CAN_NOT_/g, 'cannot').replace(/([a-z])_([a-z])/gi, (m, a, b) => a + "'" + b));
    }
  }
  return out;
}

// 剥掉结论里的推论连接词前缀（「一切，所以 X」→「X」；
// 「objective truth, therefore X」→「X」）。
// [r293] 中置桥补腿：单句内「能力否认…，所以/说明/足见 X」的中置推论桥
// 原先不剥——A1/A2/A3 实测漏判（见 scripts/round-293/ 探针）：中置桥
// 右侧的结论段残留否认词，被 d.conclusion.includes(n.negate) 判为
// 同串拆解而跳过。修法：先按中置桥切分取右段（取**最后一个**桥的右侧，
// 因为结论永远在最右），再走原有前缀剥离。良性面 11/11 零误伤实测
// （限定/修补类结论 B6/B7 由 LIMIT_SCOPE / REPAIR 守卫照常豁免）。
function _stripBridge(body, isEN) {
  // ── 中置桥：取最后一个推论桥右侧的结论段 ──
  // 中文侧。桥词表与 BRIDGE_ZH 对齐（含「说明」——r293 首版补丁漏了它，
  // 导致 A1/A2 仍漏判，探针 r293-midbridge-probe 复测发现后补入）。
  // 只要求桥**前**有分隔符（逗号/句读/空白）：桥后常直接接句尾结论
  // （「…，说明科学毫无价值」），要求桥后分隔符会漏掉这一族。
  // 桥词前允许指示代词「这/那/其」（「存在，这说明 X」「一切，那说明 X」）——
  // r293 探针 A2 实测：桥前紧贴「这」时 [，,。；;\s] 匹配不到，
  // 需显式纳入 (?：[这那其])?。
  const zhMid = /[，,。；;\s](?:这|那|其)?(?:所以|因此|因而|可见|于是|那么|说明|也就是说|正因如此|足见|故)(?![a-zA-Z])/;
  const zhHit = body.match(zhMid);
  if (zhHit) {
    const tail = body.slice(zhHit.index + zhHit[0].length);
    if (tail.trim()) body = tail;
  }
  // 英文侧（词边界匹配，避免 so 命中 sorry/also）
  const enMid = /[.,;\s]\s*(?:therefore|thus|hence|which means|that means|implying that|implying|so)\b[.,;\s]/i;
  const enHit = body.match(enMid);
  if (enHit) {
    const tail = body.slice(enHit.index + enHit[0].length);
    if (tail.trim()) body = tail;
  }

  let b = body.replace(/^[，,。；;、\s]+/, '');
  b = b.replace(/^[^，,]{0,40}[，,]\s*(?:so|therefore|thus|hence|which means|that means|implying that|implying)\b[，,]?\s*/i, '');
  b = b.replace(/^[^，,]{0,20}[，,]\s*(?:所以|因此|因而|可见|于是|那么|也就是说|正因如此|足见|故)[，,]?\s*/, '');
  b = b.replace(/^(?:所以|因此|因而|可见|于是|那么|也就是说|正因如此|足见|故)\s*/i, '');
  b = b.replace(/^(?:so|therefore|thus|hence|which means|that means)\b[,.]?\s+/i, '');
  return b.trim();
}

function _pass() {
  return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [], strength: 'none' };
}
function _exempt(reason, word) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason + ':' + word, count: 0, detail: '', hits: [], strength: 'none' };
}

function checkStolenConcept(text, inject) {
  const t = typeof text === 'string' ? text : '';
  if (!t.trim()) return _pass();

  const G = {
    META: (inject && inject.META_CONCEPT) || META_CONCEPT,
    HEDGE: (inject && inject.HEDGE) || HEDGE,
    LIMIT: (inject && inject.LIMIT_SCOPE) || LIMIT_SCOPE,
    REPAIR: (inject && inject.REPAIR) || REPAIR,
    QUESTION: (inject && inject.QUESTION) || QUESTION,
  };

  // 全文级守卫
  for (const m of G.META) { if (t.includes(m)) return _exempt('META_CONCEPT', m); }
  for (const m of G.HEDGE) { if (t.includes(m)) return _exempt('HEDGE', m); }
  for (const m of G.QUESTION) { if (t.includes(m)) return _exempt('QUESTION', m); }

  const clauses = _clauses(t);
  const hits = [];

  // 逐句取「能力否认腿」与「贬斥结论腿」，允许两个窗口相距 ≤2 句
  // （支持结论前置的倒装：贬斥在前、能力否认在后，中间以因为/由于连接）。
  const negClauses = [];
  const demClauses = [];
  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    const isEN = /[a-zA-Z]/.test(clause) && !/[\u4e00-\u9fff]/.test(clause);
    const concepts = isEN ? CONCEPT_EN : CONCEPT_ZH;
    const concept = _findConcept(clause, concepts);
    if (!concept) continue;
    const negate = _hasAny(clause, isEN ? NEGATE_EN : NEGATE_ZH);
    if (negate) negClauses.push({ i, clause, isEN, concept, negate });

    // 结论腿：先剥掉句首的推论桥，再找概念回指 + 贬斥谓语
    const body = _stripBridge(clause, isEN);
    if (!body) continue;
    const ref = _refersConcept(body, concept, isEN);
    if (!ref) continue;
    const demote = _hasAny(body, isEN ? DEMOTE_EN : DEMOTE_ZH);
    if (!demote) continue;
    // 范围限定结论不判（「科学只能处理可观测现象」是正确限定）
    if (_hasAny(body, G.LIMIT)) continue;
    // 正面修补结论不判（「逻辑需要预设公理」）
    if (_hasAny(body, G.REPAIR)) continue;
    demClauses.push({ i, clause, isEN, concept, ref, demote, conclusion: body });
  }

  for (const n of negClauses) {
    for (const d of demClauses) {
      if (d.i === n.i && d.conclusion === n.clause) continue;  // 同一串不再自配
      if (Math.abs(d.i - n.i) > 2) continue;                   // 相距过远不判
      // 倒装时结论里不得含该次否认词本身（否则是同句拆解，重复计数）
      if (d.conclusion.includes(n.negate)) continue;
      hits.push({ concept: n.concept, negate: n.negate, demote: d.demote, ref: d.ref, clause: n.clause, conclusion: d.conclusion, mode: d.i >= n.i ? 'forward' : 'inverted' });
      break;
    }
  }

  if (!hits.length) return _pass();

  let score = 78;
  score += Math.min(3 * (hits.length - 1), 9);
  score = Math.min(score, 90);

  const first = hits[0];
  const detail = '偷取概念（援引「' + first.concept + '」却又否认其能力，据此否定「' +
    first.concept + '」本身）' + hits.length + ' 处：先称「' +
    first.clause.slice(0, 24) + '」，再据此断言「' + first.conclusion.slice(0, 20) +
    '」——否认该概念的能力，结论却仍在暗中使用它，自相矛盾';

  return {
    score,
    verdict: score >= 70 ? 'unsupported' : 'pass',
    exempt: false,
    exempt_reason: null,
    count: hits.length,
    detail,
    hits: hits.map(h => ({ concept: h.concept, negate: h.negate, demote: h.demote, ref: h.ref, clause: h.clause, conclusion: h.conclusion })),
    strength: score >= 84 ? 'high' : 'medium',
  };
}

module.exports = {
  checkStolenConcept,
  __internals: {
    CONCEPT_ZH, CONCEPT_EN, NEGATE_ZH, NEGATE_EN, BRIDGE_ZH, BRIDGE_EN,
    DEMOTE_ZH, DEMOTE_EN, PRONOUN_ZH, PRONOUN_EN,
    META_CONCEPT, LIMIT_SCOPE, REPAIR, HEDGE, QUESTION,
  },
};
