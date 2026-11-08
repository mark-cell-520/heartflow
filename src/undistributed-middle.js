/**
 * src/undistributed-middle.js — 「中项不周延」检测器
 * （第 229 个判别维度，r253 立项）
 *
 * [r253 立项] decision 本体在当前引擎（v6.8.151，228 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项依据：
 *   · 缺口实证（/tmp/hf-r253/probe.js，直调 gate.js v6.8.151）：本族 8 条
 *     攻击样本中英文两条**真零命中**（gate.action=pass，零维度代拦）——
 *     "All cats are mammals. All dogs are mammals. Therefore, cats are
 *     dogs." 与 "Every rose is a plant. Every oak is a plant. Therefore,
 *     roses are oaks."；中文 6 条虽被 stereotype/perfect_error 代拦，但
 *     归因维度均非本族设计判据（代拦维度判的是「刻板印象」「过度断言」，
 *     不是「三段论中项不周延」），且代拦在本族英文侧完全不存在。
 *     这是 r207 立项时即记录的缺口（src/might-makes-right.js 第 16 行
 *     注释："undistributed_middle 2/4"），本轮首次实现为独立维度。
 *   · 外部来源（真实，未编造）：HN Algolia "Translating natural language
 *     to first-order logic for logical fallacy detection"（258 分，
 *     https://news.ycombinator.com/item?id=43257719，arXiv 2405.02318，
 *     Lalwani et al.）——该论文把自然论证形式化为 FOL 后用 SMT 求解器
 *     检验逻辑有效性，其有效性判定的核心失效族之一即中项不周延
 *     （undistributed middle）；GitHub tmakesense/logical-fallacy（21★）
 *     与 bkthomps/CategoricalSyllogism（三段论形式谬误检测的成熟代码
 *     方案）作分类学参考。心虫判据为自有纯规则实现（零 LLM 依赖）。
 *     侦察落盘 /tmp/hf-scout-hn.txt、/tmp/hf-scout-gh.json。
 *
 * 辨别的族：中项不周延（undistributed middle term / fallacy of the
 * undistributed middle）——三段论 AAA-2 型无效式。两段全称前提共享同
 * 一个谓项（中项 M），中项在两个前提里都只做肯定命题的谓项、**从未
 * 周延**（从未覆盖自己的全部外延），于是两段前提的交集可以为空：
 *   「所有猫都是哺乳动物，所有狗都是哺乳动物，所以猫是狗。」
 *   「所有苹果都是水果，所有香蕉都是水果，所以苹果是香蕉。」
 *   「所有马克思主义者都反对资本主义，所有自由主义者都反对资本主义，
 *     所以马克思主义者是自由主义者。」
 *   All cats are mammals. All dogs are mammals. Therefore, cats are dogs.
 *   Every rose is a plant. Every oak is a plant. Therefore, roses are oaks.
 *
 * 形式说明：中项 M 是两段前提的连接点。若 M 至少在一个前提中周延
 * （如「所有 M 都是 S」形式——M 作主项覆盖全部），则 S 与 P 的真关
 * 系被约束；若 M 在两前提中都只是谓项（「所有S是M」「所有P是M」），
 * M 的外延可以包含互不相交的两群对象，S 与 P 的关系完全未被约束——
 * 结论「S 是 P」是**无据等同**。本族在自然语言里的高频形态是把两个
 * 不同事物归入同一个大箩筐，再据此宣称它们是一类。
 *
 * 与既有维度的边界（r253 归因，刻意错开）：
 *   · illicit_conversion（第167维）管**全称换位**（所有A是B∴所有B是
 *     A），单前提主谓对调；本族是**双前提共享谓项**、结构是三段链
 *     （两个前提+一个等同结论），不对调任何主谓项。
 *   · affirming_the_consequent / denying_the_antecedent /
 *     conditional_transposition 管**条件句**方向错误；本族句中无条件
 *     句，是**量词+等同**错误。
 *   · most_transitivity（第185维）管「大多数」量词的三段链；本族量词是
 *     **全称**（所有/全部/凡是/all/every），且结论是**主项等同**而非
 *     「大多数」传递。
 *   · whole_part_transfer（第170维）管部分/整体属性跨层搬运；本族两个
 *     主项是**平级并列**关系，不涉及部分-整体层级。
 *   · false_equivalence 管**不恰当的类比**；本族不是类比，是**形式无
 *     效的三段论**。
 *   · hasty_generalization 管**证据不足的归纳**；本族两段前提本身可
 *     以为真，问题在**推理形式**无效，不在证据量。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① P1+P2 两段全称前提共享谓项（中项）：两个片段均为
 *     「全称量词 + 主项 + 肯定谓词标记 + 谓项」，两段**主项不同**、
 *     **谓项相同**（中项不周延：两段里它都只作谓项）。
 *   · 腿② C 结论主项等同：结论段把 P1 的主项与 P2 的主项**判为同
 *     一类/同一种**（所以A是B / A和B是同一种 / A就是B / therefore
 *     A are B / so A is a B…）。
 *   · 位置：结论跟在两前提之后（跟句模式），或结论带推断词前置
 *     （倒装模式「所以C，因为P1、P2」）。
 *   · 豁免（全部可负例注入置空）：META_CONCEPT 谬误/中项/三段论概念
 *     转述与教学、TEACH 教学语境、HEDGE 对冲结论（可能/也许/maybe）、
 *     疑问句、正当的**同箩筐并列陈述**（结论只说「都是M」不说「A是
 *     B」——「猫和狗都是哺乳动物」是正确陈述，不判）。
 *
 * 为什么取 VERIFY 级：结论本身**偶然可能为真**（猫与狗确实都是哺乳
 * 动物，只是「所以猫是狗」这个推理无效；另有真的同种重合情形，如
 * 「所有番茄都是水果，所有西红柿都是水果，所以西红柿是番茄」——
 * 前提与结论都真，但推理形式仍无效，正确性来自定义而非三段论）。
 * verify 的含义是「该等同结论缺少有效推理支撑，需补上周延中项或其
 * 他证据」。与 r206-r232 同口径只登记 VERIFY。
 */
'use strict';

// ─── 腿①：全称量词（中文，裸名词形态；161 轮教训：去后缀仍命中）────────
// 不限句首（「显然所有…」「数据显示凡是…」前缀常见），取片段内首次出现。
// 顺序即优先：长的在前（所有 先于 所；全部 先于 全）。
const UNIV_ZH = [
  /(?:所有|全部|凡是|凡|一切|任何|每个|每一|个个|统统|皆|清一色)(?:的)?/,
];

const UNIV_EN = [
  /\b(?:all|every|each|any)\s+(?:the\s+)?(?:single\s+)?/i,
];

// ─── 腿①：肯定谓词标记（主项与谓项的分界）────────────────────────────
// 中文：肯定判断的系词与等同标记。刻意不收「有/为」——同 most-transitivity
// 的处理：「有害」「认为」「为民」里它们不是谓词标记。
const COPULA_ZH = [
  /都是/, /皆是/, /全是/, /均是/, /都属于/, /就是/, /乃是/, /属于/,
  /都/, /是/, /会/, /能/, /可以/, /能够/, /将/, /在/, /也/, /还/,
  /就/, /才/, /便/, /被/, /把/, /让/, /使/, /即/, /得/, /已/, /仍然/, /依然/,
  /仍旧/, /仍/, /正/, /刚刚/, /再/, /又/, /予以/, /加以/, /得以/, /来着/,
];

const COPULA_EN = [
  /\s+(?:are|is)\s+/i, /\s+(?:were|was)\s+/i,
  // r253：主谓结构 "All sedans have four doors" / "Every oak has leaves"
  /\s+(?:have|has)\s+/i,
];

// ─── 腿②：结论主项等同标记（中文）──────────────────────────────────────
// 两段不同主项被判为同一类/同一种。含裸名词形态（「A是B」无修饰）。
const IDENT_ZH = [
  /所以[^。；，,]{0,24}?(?:是|属于|属于是|就是|乃是|归入|算作|归为)/,
  /(?:因此|故而|可见|可知|这说明|这表明)[^。；，,]{0,24}?(?:是|属于|就是)/,
  /^[^。；，,]{0,24}?(?:和|与|跟|同)[^。；，,]{0,24}?(?:是|属于)(?:同|一样|同样)/,
  /(?:是|属于)(?:同一|同一种|一类|同样的|一样的)/,
  /(?:同|一样|同样)[^。；，,]{0,12}(?:种|类|东西|物种|类别)/,
  /(?:根本|完全|压根|本质上)(?:是|就是)(?:一样|同一|一回事)/,
  /(?:等于|等同于|无异于|不啻于)/,
  /(?:一回事|一码事|同一回事)/,
];

// ─── 腿②：结论主项等同标记（英文）──────────────────────────────────────
const IDENT_EN = [
  /\b(?:therefore|thus|so|hence|then)\b[^.]{0,60}?\b(?:is|are)\s+(?:a|an|the|same)\b/i,
  // r253：补无冠词形态 "Therefore, cats are dogs" / "so roses are oaks"
  /\b(?:therefore|thus|so|hence|then)\b[, ]+[a-z][a-z\s]{0,30}?\b(?:is|are)\s+[a-z][a-z\s]{0,30}?[.?]?$/i,
  /\b(?:is|are)\s+(?:the\s+same(?:\s+(?:kind|type|thing|species))?|a\s+(?:kind|type|subset)\s+of)\b/i,
  /\b(?:therefore|thus|so|hence)\b[^.]{0,40}?\bsame\s+(?:thing|kind|type|category)\b/i,
  /\b(?:amounts?\s+to|is\s+equivalent\s+to|are\s+equivalent\s+to)\b/i,
];

// ─── 豁免表（负例注入可置空）───────────────────────────────────────────
// 谬误概念转述/教学（「中项不周延是指…」「undistributed middle is a
// fallacy」）——讨论谬误本身不是犯谬误。
const META_CONCEPT = [
  /中项不周延/, /中项/, /三段论/, /周延/, /大项/, /小项/,
  /谬误/, / fallacy/, /syllogis/i, / undistributed /i,
];

// 教学语境（课本/课堂/作业/例题/讲解）。
// r253 教训：首版收了裸名词「教材」「学生」——但它们是本族攻击样例的
// 高频主项（「所有教材都通俗易懂」「所有学生都要复习」），整句级豁免
// 把攻击全误杀（实测 6/13 MISS 的成因之一）。教学语境判定只收**句法
// 性/动词性**标记（例如、举例、例题、讲解、课本里、课堂上），不收可
// 当主语用的裸名词。
const TEACH = [
  /例如/, /比如/, /举例/, /举个/, /例题/, /课本里/, /教材里/, /课堂上/, /课堂里/,
  /老师(?:说|讲|在)/, /学生(?:问|答|在)/, /作业里/, /习题/, /讲解/, /假设/, /设想/, /反例/,
  /(?:for|as an?)\s+example/i, /for instance/i, /suppose/i, /consider/i, /in (?:this|the) (?:lecture|class|textbook)/i,
];

// 对冲结论——概率化/限定化的结论不作谬误判定（「可能」「也许」把等同
// 断言降级为假设，本族判的是**无据等同断言**）。
const HEDGE = [
  /可能/, /也许/, /大概/, /或许/, /未必/, /不一定/, /恐怕/, /看来/,
  /似乎/, /好像/, /估计/, /八成/, /倾向于/,
  /\bmaybe\b/i, /\bperhaps\b/i, /\bpossibly\b/i, /\bmight\b/i, /\bprobably\b/i,
  /\bit seems\b/i, /\bappears\b/i,
];

// 疑问句——提问不是等同断言。
function _isQuestion(text) {
  return /[?？]/.test(text) || /^(?:请问|试问|难道|是否|是不是|能不能|为什么|怎么)/.test(text.trim());
}

// [r253 修复 · 2026-11-08 每日审计] 未命中返回值。
// 引擎惯例：维度函数永不返回 null，未命中返回零分对象（对照
// src/false-memory-transplant.js 等）。src/index.js 的 dimMap 对所有维度
// 一律无条件读 `.score`，返回 null 会让 checkOutput 在**任何**不命中输入
// 上抛 TypeError（实测：bin/verify.js 15/16、guard-abilities 全崩）。
function _MISS() {
  return { hit: false, score: 0, detail: '', count: 0, name: 'undistributed_middle' };
}

// ─── 片段切分：把文本切成可分析的子句（按句读与推断词）──────────────────
// 中文三段论的标准书写是逗号分句（「所有猫都是哺乳动物，所有狗都是哺
// 乳动物，所以猫是狗」），r253 首版只按句末标点切导致整句一段、谓项
// 把后续子句全吞——攻击 0/13 全漏。故中文按句内停顿（逗号/冒号）与句末
// 标点同级切分。
// 英文反过来：三段论用句号分句，逗号是**句内**停顿（"Therefore, cats
// are dogs" 被逗号切开后 IDENT_EN 的 therefore…is 跨段模式失效），
// 故英文只按句末标点切。
function _splitClauses(text, isEN) {
  const s = String(text || '');
  const segs = isEN
    ? s.split(/[.;!?\n]+|(?<=[.]) /).map(x => x.trim()).filter(Boolean)
    : s.split(/[。；;!！?？\n]+|(?<=[.]) |[，,：:]/).map(x => x.trim()).filter(Boolean);
  return segs;
}

// ─── 解析一段「全称量词 + 主项 + 谓词标记 + 谓项」─────────────────────
// 返回 { subject, predicate } 或 null。谓项必须非空（中项素材在谓项里）。
function _parseUniversal(seg, UNIV, COPULA, isEN) {
  if (isEN) {
    const m = seg.match(new RegExp(UNIV[0].source + '([a-z][a-z\\s-]{1,40}?)\\s+(?:are|is|were|was|have|has)\\s+([a-z][a-z\\s-]{1,40})', 'i'));
    if (!m) return null;
    const subject = m[1].trim().replace(/\s+/g, ' ');
    const predicate = m[2].trim().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '');
    if (!subject || !predicate) return null;
    return { subject: subject.toLowerCase(), predicate: predicate.toLowerCase() };
  }
  for (const q of UNIV) {
    const qm = seg.match(q);
    if (!qm) continue;
    const after = seg.slice(qm.index + qm[0].length);
    // 找第一个谓词标记
    let cut = -1, cutLen = 0;
    for (const c of COPULA) {
      const cm = after.match(c);
      if (cm && (cut === -1 || cm.index < cut)) { cut = cm.index; cutLen = cm[0].length; }
    }
    if (cut === -1) continue;
    const subject = after.slice(0, cut).trim();
    const predicate = after.slice(cut + cutLen).trim().replace(/[。，、；！？,.;:!?]+$/, '');
    if (!subject || !predicate) continue;
    return { subject, predicate };
  }
  return null;
}

// ─── 关键词归一化：中文取 2-gram 集合（含单字主项；r253 教训：单字主项
// 「猫/狗/A」是最高频形态，纯 2-gram 对单字串产出空集导致 touches 判负），
// 英文取实词集合 ──────────────────────────────────────────────────────
function _grams(s, isEN) {
  if (isEN) {
    const stop = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'to', 'is', 'are', 'and', 'or', 'that', 'this', 'it', 'as', 'by', 'for', 'with', 'all', 'every', 'each', 'any', 'single', 'therefore', 'thus', 'hence', 'so', 'then']);
    return new Set(String(s).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 1 && !stop.has(w)));
  }
  const clean = String(s).replace(/[^一-龥A-Za-z]/g, '');
  const out = new Set();
  for (let i = 0; i + 2 <= clean.length; i++) out.add(clean.slice(i, i + 2));
  // 单字/单字母主项兜底（猫、狗、A、甲）——直接入集，保证 touches 判正
  if (clean.length === 1) out.add(clean);
  if (out.size === 0 && clean.length) out.add(clean);
  return out;
}

function _share(a, b) {
  for (const x of a) if (b.has(x)) return true;
  return false;
}

// 单向包含判定：短串（≤2 字的主项，如「猫」「狗」「A」）视为长串的
// 子串命中。r253 教训：纯 2-gram 集合比较时，单字主项「猫」的集合是
// {猫}，结论段「所以猫是狗」的集合是 {所以,以猫,猫是,是狗}——两者零
// 交集，touches 判负导致攻击全漏。故对短串走子串判定。
// 注意：长串（≥3 字）**不**走 2-gram 交集判定——「马克思主义者」与
// 「自由主义者」只共享「主义」两字就会被误判为同一主项（r253 实测），
// 那是两个不同主项。长串只做精确包含（一个含另一个才算同主项）。
function _mention(short, long) {
  if (!short || !long) return false;
  const cleanS = String(short).replace(/[^一-龥A-Za-z]/g, '');
  const cleanL = String(long).replace(/[^一-龥A-Za-z]/g, '');
  if (!cleanS || !cleanL) return false;
  if (cleanS === cleanL) return true;
  if (cleanS.length <= 2) return cleanL.includes(cleanS);
  return cleanL.includes(cleanS);
}

// 结论是否提及主项（touches 判定）。与 sameSubject 的区别：结论段允许
// 同义换词（「参加马拉松的人」→结论「马拉松选手」），故长主项也走
// 2-gram 交集；短主项（≤2 字）走子串。r253 教训：只用精确包含时
// 「马拉松选手是越野赛选手」对不上「参加马拉松的人」。
function _mentionConcl(subject, conclSeg, isEN) {
  const cleanS = String(subject).replace(/[^一-龥A-Za-z]/g, '');
  const cleanL = String(conclSeg).replace(/[^一-龥A-Za-z]/g, '');
  if (!cleanS || !cleanL) return false;
  if (cleanL.includes(cleanS)) return true;
  if (isEN) {
    const stop = new Set(['the','a','an','of','in','on','to','is','are','and','or','that','this','it','as','by','for','with','all','every','each','any','single','therefore','thus','hence','so','then']);
    // r253 教训：英文分词必须用**原始串**（保留空格）——上面 cleanS/cleanL
    // 会把空格一并删掉，"So a sedan is a coupe" 变成无分隔的单串
    // "soasedanisacoupe"，分词失效导致单复数归一无从命中。
    const gs = new Set(String(subject).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 1 && !stop.has(w)));
    const gc = new Set(String(conclSeg).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 1 && !stop.has(w)));
    // r253：单复数归一（sedans → sedan），"So a sedan is a coupe" 的结论
    // 用单数、前提用复数，词级集合不匹配会漏。
    const norm = w => w.replace(/(?:es|s)$/, '');
    const gsn = new Set([...gs].map(norm));
    let n = 0; for (const w of gsn) if (gc.has(w) || [...gc].some(c => norm(c) === w)) n++;
    return gsn.size > 0 && n >= 1;
  }
  const gs = _grams(cleanS, false), gc = _grams(cleanL, false);
  let n = 0; for (const w of gs) if (gc.has(w)) n++;
  // r253 教训：马拉松案「参加马拉松的人」→结论「马拉松选手」是同义换词，
  // grams 交集 2/5；半数阈值(3) 会漏。touches 只用于排除「结论在说别
  // 的事」，阈值放宽到 ≥1 个 gram 命中。
  return gs.size > 0 && n >= 1;
}
/**
 * 主检测函数。返回 { score, name, hit, detail, legs }（命中）或零分对象
 * { hit:false, score:0, ... }（未命中）——**永不返回 null**，引擎 dimMap
 * 对所有维度无条件读 `.score`（见 _MISS 注释）。
 * 负例注入测试通过把常量置空验证每条腿承重。
 */
function checkUndistributedMiddle(text) {
  const raw = String(text || '');
  if (!raw || raw.length < 8) return _MISS();
  if (_isQuestion(raw)) return _MISS();

  const isEN = /[a-zA-Z]{3,}/.test(raw) && !/[\u4e00-\u9fa5]/.test(raw);
  const segs = _splitClauses(raw, isEN);
  if (segs.length < 3) return _MISS();

  // 豁免：谬误概念转述 / 教学语境 / 对冲结论（整句级）
  for (const re of META_CONCEPT) if (re.test(raw)) return _MISS();
  for (const re of TEACH) if (re.test(raw)) return _MISS();
  for (const re of HEDGE) if (re.test(raw)) return _MISS();

  const UNIV = isEN ? UNIV_EN : UNIV_ZH;
  const COPULA = isEN ? COPULA_EN : COPULA_ZH;

  // 解析所有全称前提段
  const premises = [];
  for (const seg of segs) {
    const p = _parseUniversal(seg, UNIV, COPULA, isEN);
    if (p) premises.push({ seg, ...p });
  }
  if (premises.length < 2) return _MISS();

  // 找一对「主项不同、谓项相同」的前提（中项不周延）。
  // 主项「不同」= 互相不包含（双向包含才算同一主项）。r253 教训：
  // ①「马克思主义者」vs「自由主义者」只共享「主义」2-gram，若用
  // grams 交集判相同会把两个不同主项误判为同一主项；②「现实主义
  // 作品」是「批判现实主义作品」的子串，单向包含只能说明**父子关
  // 系**（批判现实主义作品 ⊂ 现实主义作品），仍是两个不同主项——
  // 单向包含同样不能判相同。故「相同」必须双向包含。
  let pair = null;
  for (let i = 0; i < premises.length && !pair; i++) {
    for (let j = i + 1; j < premises.length && !pair; j++) {
      const a = premises[i], b = premises[j];
      const sameSubject = a.subject === b.subject
        || (_mention(a.subject, b.subject) && _mention(b.subject, a.subject));
      const samePredicate = a.predicate === b.predicate
        || _share(_grams(a.predicate, isEN), _grams(b.predicate, isEN));
      // 主项必须不同（同主项两段是复述，不是三段论）、谓项必须相同（共享中项）
      if (!sameSubject && samePredicate) pair = { a, b };
    }
  }
  if (!pair) return _MISS();

  // 腿②：结论段存在主项等同，且结论提到两个主项之一（或两者的并集）
  const conclSegs = segs.slice(segs.indexOf(pair.b.seg) + 1);
  let identSeg = null;
  const IDENT = isEN ? IDENT_EN : IDENT_ZH;
  for (const seg of conclSegs) {
    for (const re of IDENT) {
      if (re.test(seg)) { identSeg = seg; break; }
    }
    if (identSeg) break;
  }
  if (!identSeg) return _MISS();

  // 结论必须触及两个前提的主项之一（否则是别处的等同断言，与本族无关）。
  // r253：单字/双字主项（猫/狗/A型）走子串判定，长主项走 2-gram 交集。
  const touchesA = _mentionConcl(pair.a.subject, identSeg, isEN);
  const touchesB = _mentionConcl(pair.b.subject, identSeg, isEN);
  if (!touchesA && !touchesB) return _MISS();
  const gC = _grams(identSeg, isEN);

  // 豁免：正当的「同箩筐并列陈述」——结论只说两者都属于中项（「A和B都是
  // M」），没有宣称 A 是 B。判定：结论段若**整段只是复述谓项**（谓项
  // grams 覆盖结论主体）且**不含**跨主项的等同动词（A是B / A和B是同一
  // 种），不判。
  // r253 教训：首版只要 _share(gP,gC) 就进豁免检查，而「马克思主义者是
  // 自由主义者」与谓项「反对资本主义」共享「主义」2-gram，被误判为同箩
  // 筐复述而全数误杀。修正：要求谓项与结论的**覆盖度**足够高（谓项
  // grams 是结论 grams 的子集级占比），复述型结论（「猫和狗都是哺乳
  // 动物」）谓项覆盖率 100%，而「是自由主义者」覆盖率极低。
  const gP = _grams(pair.a.predicate, isEN);
  let overlap = 0;
  for (const x of gP) if (gC.has(x)) overlap++;
  const coverage = gP.size ? overlap / gP.size : 0;
  if (coverage >= 0.6) {
    const crossIdent = isEN
      ? /\b(?:is|are)\s+(?:a|an|the)\s+(?:same|kind|type)/i.test(identSeg)
      : /(?:是|属于)(?:同|一样|同样|一回|一码)|同一种|一类|同样的|一样的/.test(identSeg);
    // crossIdent 不成立时，还要看结论是不是「A和B都是M」的并列复述形态
    const coListed = isEN
      ? /\bboth\b/i.test(identSeg)
      : /(?:和|与|跟|同)[^。]{0,12}(?:都|皆)/.test(identSeg);
    if (!crossIdent && !coListed) return _MISS();
  }

  return {
    score: 0.72,
    name: 'undistributed_middle',
    hit: true,
    detail: `中项不周延：两段全称前提共享谓项「${pair.a.predicate}」但主项不同（「${pair.a.subject}」/「${pair.b.subject}」），中项在两个前提中都只作谓项未周延，推不出主项等同${isEN ? '(en)' : ''}`,
    legs: {
      premise1: pair.a.seg, premise2: pair.b.seg, conclusion: identSeg,
      undistributedMiddle: pair.a.predicate,
    },
  };
}

module.exports = {
  checkUndistributedMiddle,
  // 导出常量供负例注入测试逐条置空验证承重
  UNIV_ZH, UNIV_EN, COPULA_ZH, COPULA_EN, IDENT_ZH, IDENT_EN,
  META_CONCEPT, TEACH, HEDGE,
};
