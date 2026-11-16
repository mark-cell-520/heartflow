/**
 * src/quantifier-scope-shift.js — 「量词辖域移位」检测器
 * （第 258 个判别维度，r361 立项）
 *
 * [r361 立项] 立项依据：
 *   · 缺口实证（scripts/round-361/probe-candidates.js，直调 gate.js v6.8.186）
 *     —— 量词辖域移位族 40 条攻击样本穿透 26 条（gate.action=pass），
 *     其中 EN 侧 19/20 全穿透，ZH 侧 7/20 穿透（其余被 absolute_claim /
 *     hasty_generalization / perfect_error 等既有维度代拦）。良性 20 条
 *     误伤 10 条，全部来自既有基线维度（vagueness / perfect_error /
 *     hasty_generalization / confidence / fallacy_of_relevance / stereotype /
 *     contradiction / empty_answer），非新维度引入。
 *   · 外部来源（真实，未编造）：HN Algolia "Translating natural language
 *     to first-order logic for logical fallacy detection"（258 分，143 评论，
 *     https://news.ycombinator.com/item?id=43257719，arXiv 2405.02318，
 *     Lalwani et al.）——该论文把自然论证形式化为 FOL 后用 SMT 求解器
 *     检验逻辑有效性，其失效族之一即量词辖域倒置（∀x∃y ∴ ∃y∀x）；
 *     GitHub bkthomps/CategoricalSyllogism（三段论形式谬误检测成熟代码
 *     方案）作分类学参考。心虫判据为自有纯规则实现（零 LLM 依赖）。
 *   · 与既有维度的边界：illicit_conversion(167) 管全称命题主谓项对调
 *     （A⊆B ∴ B⊆A）；undistributed_middle(229) 管三段论中项不周延；
 *     affirming_the_consequent(155) / denying_the_antecedent(165) /
 *     conditional_proposition(160) 管条件句方向错误；most_transitivity(185)
 *     管两个「大多数」前提的证据累积。本族管的是**量词辖域在前提与结论之间
 *     发生的移动**——同一个存在变量 y 被从「对每个 x 各有一个 y」的口径
 *     偷换成「有一个 y 对所有 x 都成立」的口径，前提与结论之间量词层级
 *     被静默提升或倒置。
 *
 * 形态（四条腿共现，缺一不判）：
 *   腿① SCOPE_PREMISE 辖域前提——句中含「对每/每个/每一/任何/凡」+「都/
 *         各/分别/individual」的 ∀∃ 结构（对每个X都有一个Y / For every X
 *         there is a Y），或全称前提（所有/每个 X 都 Y）。
 *   腿② SCOPE_CONCLUSION 辖域结论——句中出现存在量词（有/存在/总有/必有/
 *         some/someone/something/there is）+ 全称量词（所有/全部/每个/任何/
 *         一切/all/every/any）指向同一谓域。
 *   腿③ BRIDGE 推断连接词（所以/因此/可见/这说明/意味着/证明/显然；EN
 *         so/therefore/thus/which means/proves that）。
 *   腿④ SHARED 谓域共享——前提与结论共享 ≥1 个实词（EN 词干 / ZH 实字）。
 *
 * 这个「∀∃ 前提 × ∃∀ 结论」结构天然区分有效推理与相关句式：
 *   - 有效推理（每个X都有Y，所以这个x有Y）——结论是单称例示，无 ∃∀ 结构
 *   - 有效推理（∀x∃y 且 y 唯一同指）——有显式同一性标记（就是/正是/同一个/
 *     the same / identical），属合法辨识不判
 *   - 特称谨慎结论（有些/部分/some）——量词降级而非提升，是正当弱化不判
 *   - 统计陈述（大多数/most）——归 most_transitivity(185)，本族不碰
 *   - 条件句（如果…那么…）——归 affirming_the_consequent(155) 等，不判
 */
'use strict';

// ── 腿①：全称量词（前提侧）─────────────────────────────────────
const UNIVERSAL_ZH = ['对每个', '对每一', '对任何', '对凡', '每一个', '每个', '每一', '任何', '所有', '全部', '一切', '但凡', '凡是', '一律', '清一色', '统统', '尽数'];
// [r362 补腿] 裸名词全称形。r161 轮教训：只收「每个/每一」这类带「个/一」
// 后缀的形式，会整句漏掉「每户都分到了一袋米」——同族词去掉后缀仍须命中。
// 显式列举高频形式（r362 变体矩阵实测「每户」形 6/8 → 8/8）；发现新漏判
// 形态时往本表补，不要退回正则泛匹配（「每天都在进步，所以有提升」这类
// 弱推断会被正则误收，显式表+谓域共享腿共同收口）。
const UNIVERSAL_ZH_BARE = ['每户', '每人', '每家', '每班', '每组', '每队', '每支', '每台', '每辆', '每届', '每批', '每款', '每周', '每月', '每年', '每天', '每次', '每场', '每处', '每科', '每门', '每项', '每单', '每层', '每栋', '每套', '每间', '每页', '每段', '每篇', '每部', '每座', '每架', '每艘', '每列', '每顿', '每趟', '每局', '每盘', '每步', '每村', '每县', '每市', '每省', '每区', '每校', '每本', '每张', '每条', '每瓶', '每杯', '每份', '每亩', '每分钟', '每小时'];
// [r362 补腿] 量人全称形（含 r161 教训的人称量词后缀族：每位/每名/每个）。
// 变体矩阵 A15 实测穿透：「每位申请人都有一位推荐人」——'每位' 两张全称表
// 均未收 → 腿① 双空（uniPre/forEvery/exPre 全 null）整句漏判。
const UNIVERSAL_ZH_PERSON = ['每位', '每名', '每只', '每匹', '每头', '每尾', '每们', '每者', '每户主'];
const UNIVERSAL_EN = ['every', 'each', 'all', 'any', 'everyone', 'everybody', 'everything'];

// ── 腿②：存在量词（结论侧）─────────────────────────────────────
// 含裸名词形态（「有人」「存在」不带后缀修饰）
// [r361 修复] 裸「有」字不进 EXIST_ZH——「所有」「没有」都含「有」会误伤；
// 族B 前提侧的存在量词由 _findExistential 的 BARE_EXIST_ZH 单独判定。
const EXIST_ZH = ['肯定有', '必然有', '一定有一个', '一定存在', '肯定存在', '必然存在', '总有一个', '总有', '必有', '有人', '有的人', '有一个', '有些', '某些', '有的', '存在', '存在一个', '有人会', '有人是', '有人问', '有个', '有', '会有'];
const EXIST_EN = ['there is', 'there exists', 'there has', 'somebody', 'someone', 'something', 'some', 'there must be', 'there has to be', 'there will be', 'one ', 'an ', 'a '];
// 族B 前提侧专用：只认「有」引导的存在断言（排除「所有/没有/含有/拥有」等）
const BARE_EXIST_ZH = ['有人', '有的人', '有一个', '有些', '某些', '有的', '有员工', '有候选人', '有产品', '有人', '会有'];

// 制度规范类词：结论侧含这些词时，「单例触发全员规则」是规范适用而非量词谬误
// [r361 豁免] 「One person was late, so the rule now requires everyone...」
const NORMATIVE_EN = [
  'rule', 'policy', 'regulation', 'requirement', 'law', 'guideline',
  'procedure', 'protocol', 'standard operating',
];

// 结论侧全称量词（与前提侧同一谓域的全称指向）
const CONCL_UNIVERSAL_ZH = ['所有', '全部', '每个', '每一个', '任何', '一切', '所有', '人人', '所有人', '整', '整个', '全', '都'];
// [r362 补腿] 结论侧全称量词补充形。变体矩阵 A15 实测穿透：
// 「说明有一位推荐人能代表全体申请人」——结论用「全体」指全称，
// CONCL_UNIVERSAL_ZH 未收 → 族A 结论缺全称腿不判。
const CONCL_UNIVERSAL_ZH_BARE = ['全体', '全员', '全组', '全班', '全校', '全厂', '全队', '全村', '全县', '全市', '全省', '全国', '全家', '全场', '全部人', '大伙', '大家', '诸位', '各位'];
const CONCL_UNIVERSAL_EN = ['all', 'every', 'everyone', 'everybody', 'everything', 'each', 'any', 'the whole'];

// ── 腿③：推断连接词 ────────────────────────────────────────────
const INFER_ZH = ['所以', '因此', '因而', '可见', '这说明', '这就意味着', '那就意味着', '意味着', '说明', '证明', '显然', '毫无疑问', '故而', '故', '据此', '足见', '准是', '肯定是', '一定是'];
// [r362 补腿] 中文理由后置桥词（倒装形：「结论，既然/因为前提」）。
// 变体矩阵 A9 实测穿透：'既然' 不在表内 → pre 取全句、back 候选无桥词。
const INFER_ZH_REVERSE = ['既然', '因为', '由于', '鉴于', '基于'];
// [r361 修复] EN 推断词不用 'so' 裸词——'so' 是 person/case/solution 等词的
// 子串（r361 实测：'One person was late' 被 'so' 在 person 内误截成
// pre='One per' / body='n was late...'）。改用 ' so ' 空格边界形 + 句首形。
const INFER_EN = ['therefore', 'thus', 'hence', 'consequently', 'which means', 'that means', 'proves that', 'it follows', 'so there', ' so ', 'so,'];
// [r362 补腿] 倒装形桥词。变体矩阵实测 EN 倒装（结论在前、前提在后作理由，
// "There is one mentor for all children, because each child has a mentor."）
// 穿透：because/since/as 不在推断词表，_findInfer 找不到桥，pre 取全句而
// 结论候选（back 模式）要求候选句内含推断词才成立 → 全数漏判。
// 这两个词是「理由后置」的标准标记，收进腿③；豁免/对冲/同一性守卫不变，
// 误伤收口靠谓域共享 + 后置全称量词腿。
const INFER_EN_REVERSE = ['because', 'since', 'as each', 'as every', 'given that', 'for the reason that', 'on the grounds that'];

// ── 守卫：有效推理与转述豁免 ────────────────────────────────────
// 同一性标记：y 唯一同指时的合法辨识（「对每个病人都有一种药，那就是青霉素」）
// [r362 收窄] 原为全文 includes() 匹配，过度豁免：中文「就是」高频作系词
// （「那就是有一位老师」「这就是结论」），r362 变体矩阵 A9 因此整句漏判。
// 改为「同一性标记须紧邻存在量词/定指词」——「那就是青霉素」「正是这个人」
// 这类真辨识句中，标记与存在量词的距离 ≤4 字；纯系词用法距离远或无存在量词。
const IDENTITY_ZH = ['就是', '正是', '同一个', '同一种', '同一个人', '指的就是', '即'];
const IDENTITY_EN = ['that is', 'namely', 'the same', 'identical', 'which is'];

// 对冲/谨慎结论：量词降级而非提升
const HEDGE_ZH = ['可能', '也许', '或许', '大概', '恐怕', '未必', '不一定', '往往', '通常', '一般来说', '大多数', '大部分', '多数', '过半', '七成', '八成', '之一', '其中之一', '个别', '某些情况', '视情况'];
const HEDGE_EN = ['maybe', 'perhaps', 'might', 'could be', 'most', 'likely', 'generally', 'usually', 'sometimes', 'often', 'in some cases', 'depends'];

// 否定/疑问：非断言
const NEG_ZH = ['不', '没', '无', '未', '并非', '别', '毫无', '并不', '未曾', '不曾', '未必', '不见得', '谈不上', '算不上', '称不上'];
const NEG_EN = ['no', 'not', 'never', 'nor', 'neither', 'cannot', "can't", "won't", "wouldn't", "isn't", "aren't", "doesn't", "didn't", "don't", 'without'];
// [r363 补契约] 疑问守卫（原为结论侧内联正则 /[吗呢？?]$/）提为常量表——
// r362 负例注入契约实测：C 组「删 QUESTION_ZH 翻转」引用不存在的常量名
// （该守卫是内联正则，注入鞭长莫及）。r363 进一步发现存缺陷：_clauses 第一行
// split(/[。；;！!？?\n]+/) 吃掉问号，原句级疑问判定缺失，EN 疑问句整句穿透
// 误判（"…so is there a mentor for every student?" score=72 实证）。
// 双通道设计（各自独立承重、互补不冗余）：
//   QUESTION_ZH 词表 = 句中疑问标记（是否/能否/难道），句中任意位置即疑；
//   QUESTION_TAIL_RE = 句尾语气词/问号（吗呢？?，含 EN 问号）。
// 「吗/呢」只在词表放句中形变体（如「吗」结尾由 TAIL_RE 管），避免双通道
// 互相遮蔽导致单删不翻转（r363 实测：词表单列「吗/呢」时删词表不翻转——
// TAIL_RE 同样匹配，负例注入契约失效）。
const QUESTION_ZH = ['是否', '能否', '能不能', '难道', '是不是', '有没有', '究竟'];
const QUESTION_TAIL_RE = /[吗呢？?]/;

// 条件句路由：条件句方向错误归 affirming_the_consequent(155) 等
const CONDITIONAL_ZH = ['如果', '若', '假如', '倘若', '要是', '只要', '除非', '一旦', '当且仅当', '有且仅有'];
const CONDITIONAL_EN = ['if', 'unless', 'when', 'whenever', 'only if', 'only when', 'iff'];

// 概念/教学转述
const META_CONCEPT = ['量词', '辖域', '逻辑谬误', '形式谬误', '谬误', '全称量词', '存在量词', '谓词逻辑', '一阶逻辑', 'quantifier', 'scope', 'logical fallacy', 'formal fallacy', 'predicate logic', 'first-order logic', 'fallacy'];
const TEACH_ZH = ['老师', '教材', '课堂', '教授', '讲师', '课本', '课程', '教研室', '期末考试', '考点'];
const TEACH_EN = ['textbook', 'lecture', 'lesson', 'professor', 'classroom', 'exam'];

// 统计/调查语境（属 statistical_misleading / most_transitivity 领域）
const STAT_ZH = ['据统计', '调查显示', '数据表明', '样本', '受访者', '问卷', '统计', '比例', '百分比', '概率', '置信区间', '回归分析'];
const STAT_EN = ['according to the survey', 'statistics show', 'the data shows', 'respondents', 'sample size', 'confidence interval', 'p-value', 'regression'];

// 元陈述：讨论该谬误本身
const META_DISCUSS = ['这个谬误', '这种谬误', '这个错误', '逻辑错误', '推理错误', '偷换', '偷换概念', '偷换量词', '越界推广', '过度推广', '以偏概全', '拔高结论'];

const EN_STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'that', 'this', 'it', 'its', 'as', 'if', 'then', 'would', 'will', 'can', 'could', 'may', 'might', 'must', 'he', 'she', 'they', 'his', 'her', 'their', 'we', 'you', 'i', 'so', 'therefore', 'thus', 'hence', 'not', 'no', 'does', 'do', 'did', 'has', 'have', 'had', 'all', 'every', 'any', 'each', 'some', 'certain', 'most', 'who', 'which', 'there', 'has', 'have']);
const ZH_STOP = new Set(['的', '是', '了', '在', '有', '和', '与', '也', '都', '就', '还', '会', '能', '要', '不', '没', '这', '那', '其', '之', '以', '为', '于', '很', '太', '更', '最', '啊', '吧', '呢', '吗', '呀', '把', '被', '从', '向', '对', '等', '所', '如', '果', '若', '只', '现', '场', '因', '此', '说', '明', '证', '见', '意', '味', '着', '即', '便', '可', '肯', '准', '显', '然', '凡', '一', '切', '每', '各', '诸', '有', '个', '人', '总', '必', '定', '存']);

// ── 工具函数 ────────────────────────────────────────────────────
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
  const clean = s.replace(/[，。！？；：、,.!?;:\s"'（）()]+/g, '');
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
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !EN_STOP.has(w));
}

// 谓域共享：EN 词干（前 4 字符）匹配或 ZH 实字重叠
// [r361 修复] 族B（存在→全称）的谓域常不直接重叠——「有人迟到」→
// 「所有人都必须提前到」只共享「到」字；EN 侧 "late"→"early" 完全不重叠。
// 族B 的语义核心是「同一个体/类概念被越界推广」，谓域判据放宽为：
//   ZH：实字重叠 ≥1（含共同类词：人/产品/学生等）
//   EN：词干前 4 匹配，或两侧共享任一长度≥4 的非停用实词（含单复数形近）
function _sharedDomain(a, b, isEN, familyB) {
  if (isEN) {
    const wa = _enWords(a), wb = _enWords(b);
    if (!wa.length || !wb.length) return false;
    for (const x of wa) {
      if (x.length < 3) continue;
      for (const y of wb) {
        if (y.length < 3) continue;
        if (x.slice(0, 4) === y.slice(0, 4)) return true;
      }
    }
    // 族B 放宽：共享任一 ≥4 字符实词（person/persons、product/products）
    if (familyB) {
      for (const x of wa) {
        if (x.length < 4) continue;
        for (const y of wb) {
          if (y.length < 4) continue;
          if (x.slice(0, 3) === y.slice(0, 3)) return true;
        }
      }
      // [r361 再放宽] 族B 的量词结构（前提 ∃ 单数个体 + 结论 ∀ 全称）本身
      // 已是强信号；everyone/person 这类「成员-集合」同族词词干不同，
      // 只要两侧各有一个 ≥4 字符实词即认定同域（跨域误报由腿①-③ 的
      // 量词精确匹配 + 全文级豁免兜底）。
      const hasLongA = wa.some(w => w.length >= 4);
      const hasLongB = wb.some(w => w.length >= 4);
      if (hasLongA && hasLongB) return true;
    }
    return false;
  }
  const ca = new Set([...a].filter(ch => !ZH_STOP.has(ch) && !/[\s，。！？；：、,.!?;:()]/.test(ch)));
  const cb = new Set([...b].filter(ch => !ZH_STOP.has(ch) && !/[\s，。！？；：、,.!?;:()]/.test(ch)));
  let shared = 0;
  for (const ch of ca) { if (cb.has(ch)) shared++; }
  // [r361 修复] 族B 放宽到 ≥1（单字共享即构成同类推广的弱证据，配合两腿量词判定）
  return shared >= (familyB ? 1 : 2);
}

function _hasNeg(s, isEN, R) {
  if (isEN) return new RegExp('\\b(' + (R.NEG_EN || NEG_EN).join('|') + ')\\b', 'i').test(s);
  return (R.NEG_ZH || NEG_ZH).some(n => s.includes(n));
}

// [r361 修复] 前导否定守卫：只拦「否定词出现在存在量词之前」的正确否认
// （没有人 / nothing / no one）。族B 的正确结论常含谓词否定
// （「所有员工都不可信」「every employee is untrustworthy」），
// 这些否定在量词之后、谓词位置，不构成豁免。
function _hasLeadingNeg(s, R) {
  const zhNeg = ['没有人', '没人', '并无一人', '不存在', '没有', '毫无', '未曾有人', '不曾有人'];
  for (const n of zhNeg) {
    const idx = s.indexOf(n);
    if (idx < 0) continue;
    const ex = _findExistential(s, true, R || {});
    if (!ex || idx <= ex.idx) return true;
  }
  const enNeg = /\b(no one|nobody|nothing|no person|none of)\b/i;
  const m = s.match(enNeg);
  if (m) {
    const ex = _findExistential(s, false, R || {});
    if (!ex || m.index <= ex.idx) return true;
  }
  return false;
}

function _findInfer(f, R) {
  const low = f.toLowerCase();
  let best = null;
  for (const w of (R.INFER_ZH || INFER_ZH)) {
    const idx = f.indexOf(w);
    if (idx >= 0 && (!best || w.length >= best.word.length)) best = { word: w, idx };
  }
  // [r361 修复] 带空格边界的 EN 推断词（' so ' / 'so,'）用 indexOf 精确匹配；
  // 单词推断词仍走 \b 边界。匹配位置取最前者（推断词在前提与结论之间）。
  for (const w of (R.INFER_EN || INFER_EN)) {
    let idx = -1;
    if (/^[a-z]/.test(w) || w.startsWith(' ')) {
      idx = low.indexOf(w);
      // ' so ' 命中时 idx 指向前导空格，向后偏 1 让 slice 正确
      if (idx >= 0 && w.startsWith(' ')) idx += 1;
    } else {
      const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      const mt = low.match(re);
      if (mt) idx = mt.index;
    }
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      best = { word: w.trim() || w, idx };
    }
  }
  // [r362 补腿] 倒装形桥词：取最前命中（桥词在句中时 pre 含结论、结论候选走
  // back 模式），逻辑与正向桥一致。
  for (const w of (R.INFER_EN_REVERSE || INFER_EN_REVERSE)) {
    const idx = low.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      best = { word: w.trim() || w, idx };
    }
  }
  // [r362 补腿] 中文理由后置桥词（「结论，既然/因为前提」），同 EN 倒装逻辑。
  for (const w of (R.INFER_ZH_REVERSE || INFER_ZH_REVERSE)) {
    const idx = f.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      best = { word: w, idx };
    }
  }
  return best;
}

// 全称量词定位（返回首个命中的位置）
// [r362 补腿] 同时扫 UNIVERSAL_ZH 与 UNIVERSAL_ZH_BARE（裸名词全称形）。
// BARE 词更长更具体，同位置优先取长者；不同位置仍取最前者（保证「每户」
// 在句中部也照样当全称量词）。
function _findUniversal(s, R) {
  const low = s.toLowerCase();
  let best = null;
  for (const w of (R.UNIVERSAL_ZH || UNIVERSAL_ZH)) {
    const idx = s.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx)) best = { word: w, idx };
  }
  for (const w of (R.UNIVERSAL_ZH_BARE || UNIVERSAL_ZH_BARE)) {
    const idx = s.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) best = { word: w, idx };
  }
  // [r362 补腿] 量人全称形（每位/每名 等），逻辑同 BARE 表。
  for (const w of (R.UNIVERSAL_ZH_PERSON || UNIVERSAL_ZH_PERSON)) {
    const idx = s.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) best = { word: w, idx };
  }
  for (const w of (R.UNIVERSAL_EN || UNIVERSAL_EN)) {
    const re = new RegExp('\\b' + w + '\\b', 'i');
    const mt = low.match(re);
    if (mt && (!best || mt.index < best.idx)) best = { word: w, idx: mt.index };
  }
  return best;
}

// 存在量词定位
// [r361 修复] bare=true 走 BARE_EXIST_ZH（族B 前提侧专用，避免「所有/没有」误命中）
function _findExistential(s, bare, R) {
  const low = s.toLowerCase();
  let best = null;
  const zhList = bare ? (R.BARE_EXIST_ZH || BARE_EXIST_ZH) : (R.EXIST_ZH || EXIST_ZH);
  for (const w of zhList) {
    const idx = s.indexOf(w);
    if (idx >= 0 && (!best || w.length > best.word.length || (w.length === best.word.length && idx < best.idx))) {
      best = { word: w, idx };
    }
  }
  // [r361 修复] 'so there' 抢匹配：若存在量词就是 'there' 而推断词含 'so there'，
  // 则把 body 起点回退。这里只做定位；实际切分在 checkQuantifierScopeShift。
  for (const w of (R.EXIST_EN || EXIST_EN)) {
    const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    const mt = low.match(re);
    if (mt && (!best || mt.index < best.idx || (mt.index === best.idx && w.length > best.word.length))) {
      best = { word: w, idx: mt.index };
    }
  }
  return best;
}

// 结论侧全称量词
function _findConclUniversal(s, R) {
  const low = s.toLowerCase();
  let best = null;
  for (const w of (R.CONCL_UNIVERSAL_ZH || CONCL_UNIVERSAL_ZH)) {
    const idx = s.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      if (!best || w.length >= best.word.length) best = { word: w, idx };
    }
  }
  // [r362 补腿] 结论侧全称量词补充形（全体/全员/全班/大家等）。
  for (const w of (R.CONCL_UNIVERSAL_ZH_BARE || CONCL_UNIVERSAL_ZH_BARE)) {
    const idx = s.indexOf(w);
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      if (!best || w.length >= best.word.length) best = { word: w, idx };
    }
  }
  for (const w of (R.CONCL_UNIVERSAL_EN || CONCL_UNIVERSAL_EN)) {
    const re = new RegExp('\\b' + w + '\\b', 'i');
    const mt = low.match(re);
    if (mt && (!best || mt.index < best.idx)) best = { word: w, idx: mt.index };
  }
  return best;
}

// 「对每个X都有Y」的 ∀∃ 结构检测（辖域前提的最强形态）
// [r362] 从内联正则提为常量表——负例注入契约要求每条腿可删（见 _hasForEvery）。
const FOR_EVERY_ZH = [/对(每|任何|凡)/];
const FOR_EVERY_EN = [/\bfor (every|each|any)\b/i];
function _hasForEvery(s, R) {
  // [r362 负例注入契约] 内联正则改常量表（原写死 /对(每|任何|凡)/ 与
  // /\bfor (every|each|any)\b/i，删 UNIVERSAL_ZH 表后仍命中——内联正则
  // 不走常量表，注入鞭长莫及，负例注入形同虚设）。
  const low = s.toLowerCase();
  for (const re of (R.FOR_EVERY_ZH || FOR_EVERY_ZH)) { if (re.test(s)) return true; }
  for (const re of (R.FOR_EVERY_EN || FOR_EVERY_EN)) { if (re.test(low)) return true; }
  return false;
}

// [r362] 同一性豁免判定：同一性标记（就是/正是/即）后须直接跟指称对象，
// 且中间不得插入存在量词。r362 变体矩阵 A9 实证：
// 「那就是有一位代表」——原文全文 includes() 匹配 '就是' 即整句豁免，
// 但句法上「那就是 + 存在量词」恰是辖域移位句（∀→∃ 偷换）的标志形，
// 不是「那就是 + 指称」的辨识句。真辨识（「那就是青霉素」「那就是同一个人」）
// 后接专名/同一性名词，不插入 一[位名个种样]。
function _identityAdjacent(t, marker) {
  const idx = t.indexOf(marker);
  if (idx < 0) return false;
  const after = t.slice(idx + marker.length, idx + marker.length + 6);
  if (after.includes('同一')) return true;      // 「那就是同一个人」真辨识
  return !/一[位名个种样]/.test(after);          // 「那就是有一位」= 移位句，不豁免
}

function _exempt(reason, marker) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason, marker, count: 0, detail: '', hits: [] };
}

function _pass() {
  return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [] };
}

// ── 主检测函数 ──────────────────────────────────────────────────
function checkQuantifierScopeShift(text, inject) {
  if (!text || typeof text !== 'string') return _pass();
  // [r362] 负例注入契约：R.X 以空数组替换指定常量（生产调用不传 inject）。
  const R = inject || {};
  const t = text.trim();
  if (t.length < 6) return _pass();

  // 转述/教学/统计/条件句路由豁免（全文级）
  const low = t.toLowerCase();
  for (const m of (R.META_CONCEPT || META_CONCEPT)) { if (low.includes(m.toLowerCase())) return _exempt('META_CONCEPT', m); }
  for (const m of (R.TEACH_ZH || TEACH_ZH)) { if (t.includes(m)) return _exempt('TEACH', m); }
  for (const m of (R.TEACH_EN || TEACH_EN)) { if (low.includes(m)) return _exempt('TEACH', m); }
  for (const m of (R.META_DISCUSS || META_DISCUSS)) { if (t.includes(m)) return _exempt('META_DISCUSS', m); }
  for (const m of (R.CONDITIONAL_ZH || CONDITIONAL_ZH)) { if (t.includes(m)) return _exempt('CONDITIONAL', m); }
  if (/\b(if|unless|when|whenever)\b/i.test(low)) return _exempt('CONDITIONAL', 'EN');
  for (const m of (R.IDENTITY_ZH || IDENTITY_ZH)) {
    if (t.includes(m)) {
      // [r362 收窄] 只豁免真辨识：标记紧邻存在量词/定指词（≤4 字内）——
      // 「那就是青霉素」「正是这个人」。纯系词（「那就是有一位老师」）
      // 距离远，不再豁免，避免整句漏判。
      if (_identityAdjacent(t, m)) return _exempt('IDENTITY', m);
    }
  }
  for (const m of (R.IDENTITY_EN || IDENTITY_EN)) {
    if (low.includes(m)) return _exempt('IDENTITY', m);
  }

  const clauses = _clauses(t);
  const hits = [];

  // [r363 修复] 原句级疑问判定：_clauses 第一行 split(/[。；;！!？?\n]+/) 会把
  // 问号吃掉，clause 内不再含「?」——原实现只在结论侧 body 上跑
  // /[吗呢？?]$/，导致 EN 疑问句（"Every student has a mentor, so is there
  // a mentor for every student?"）整句穿透误判（r363 实证：score=72 命中）。
  // 改为在切分前对**原句**判一次疑问：原句含问号或句尾疑问语气词即整段非
  // 断言。ZH 疑问词（吗/呢）句中即疑（「吗」不作其他词素），EN 只认句尾
  // 「?」避免 "what" 子串误伤。两条通道均可经 R.X 注入删腿（负例契约）。
  const qListPre = R.QUESTION_ZH !== undefined ? R.QUESTION_ZH : QUESTION_ZH;
  const qTailPre = R.QUESTION_TAIL_RE !== undefined ? R.QUESTION_TAIL_RE : QUESTION_TAIL_RE;
  const origIsQuestion = qTailPre.test(t) || (qListPre.length && qListPre.some(q => q && t.includes(q)));
  if (origIsQuestion) return _exempt('QUESTION', qTailPre.source);

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    const inf = _findInfer(clause, R);
    const pre = inf ? clause.slice(0, inf.idx) : clause;

    // 腿①：辖域前提
    //   族A：全称前提（对每个X / Every X）——「∀∃ 前提」
    //   族B：存在前提（有人X / One person）——「∃ 前提越界推广」
    // [r361 修复] 族B 前提无全称量词，腿①须同时接受存在前提。
    const forEvery = _hasForEvery(pre, R);
    const uniPre = _findUniversal(pre, R);
    const exPre = _findExistential(pre, true, R);
    if (!forEvery && !uniPre && !exPre) continue;
    // 前提侧对冲 → 非断言前提
    if ((R.HEDGE_ZH || HEDGE_ZH).some(h => pre.includes(h))) continue;
    if ((R.HEDGE_EN || HEDGE_EN).some(h => low.includes(h))) continue;
    if (_hasNeg(pre, /[a-zA-Z]/.test(pre) && !/[\u4e00-\u9fff]/.test(pre), R)) continue;

    // 结论候选：同句推断词后 / 后随 3 句 / 前置 2 句（倒装形）
    const cands = [];
    // [r361 修复] 'so there is...'：推断词 'so there' 会吃掉 'there'，
    // 导致存在量词被截掉。这里在切分前先把 'so there' 还原为 'so' + 'there'。
    let inferWord = inf ? inf.word : '';
    if (inf) {
      const tail = clause.slice(inf.idx, inf.idx + 9).toLowerCase();
      if (tail.startsWith('so there')) inferWord = 'so';
    }
    if (inf && clause.slice(inf.idx + inferWord.length).trim()) {
      cands.push({ text: clause.slice(inf.idx + inferWord.length), mode: 'after-infer' });
    }
    for (let j = i + 1; j <= Math.min(i + 3, clauses.length - 1); j++) {
      cands.push({ text: clauses[j], mode: 'follow' });
    }
    for (let j = Math.max(0, i - 2); j < i; j++) {
      cands.push({ text: clauses[j], mode: 'back' });
    }

    for (const cand of cands) {
      let body = cand.text;
      const cinf = _findInfer(body, R);
      if (cinf) body = body.slice(cinf.idx + cinf.word.length);
      else if (cand.mode === 'back') continue;
      body = body.replace(/^[，,。；;、\s]+/, '').trim();
      if (!body) continue;

      // 腿②：存在量词
      // 族A（∀∴∃）：存在量词在结论侧
      // 族B（∃∴∀）：存在量词已在前提侧（腿①的 exPre），结论侧是全称量词
      // [r361 修复] 原实现无条件要求结论侧存在量词，把族B 全数漏掉。
      const ex = _findExistential(body, false, R);
      if (!ex && !exPre) continue;

      // 腿③（补强）：结论侧须有全称量词指向同一谓域（∀∃∴∃∀ 的完整形态）
      // 族B（存在→全称）由「有X，所以所有Y」形态覆盖：存在量词在前提、全称在结论
      const conclUni = _findConclUniversal(body, R);

      // [r361 放宽] 两种合法辖域移位形态：
      //   族A（∀∃∴∃∀ 或 ∀∴∃）：前提全称 + 结论存在量词，构成「全称前提越界
      //        推出存在结论」——不需结论侧再出现全称量词。
      //   族B（∃∴∀）：前提存在 + 结论全称量词，构成「单例越界推广到全体」。
      const isFamilyB = !forEvery && !uniPre && !!exPre && !!conclUni;
      const isFamilyA = (forEvery || !!uniPre) && !!ex;
      if (!isFamilyA && !isFamilyB) continue;

      // 对冲结论 → 量词降级，是正当弱化
      if ((R.HEDGE_ZH || HEDGE_ZH).some(h => body.includes(h))) continue;
      if ((R.HEDGE_EN || HEDGE_EN).some(h => body.toLowerCase().includes(h))) continue;
      // [r361 修复] 否定守卫不再无条件豁免——族B 的正确结论常是否定式
      // （「所有员工都不可信」）。改为：仅当否定出现在存在量词之前
      // （「没有人」「nothing」）时视为正确否认；否定在谓词位置时不拦。
      if (_hasLeadingNeg(body, R)) continue;
      // 疑问句 → 非断言
      // [r363 补契约] 原为内联正则 /[吗呢？?]$/——不可注入，负例测试只能
      // 断言「良性不命中」而无法证明该守卫承重。改为 QUESTION_ZH 词表 +
      // QUESTION_TAIL_RE 句尾形双通道，均可经 R.X 注入删腿。
      const qList = R.QUESTION_ZH !== undefined ? R.QUESTION_ZH : QUESTION_ZH;
      const qTail = R.QUESTION_TAIL_RE !== undefined ? R.QUESTION_TAIL_RE : QUESTION_TAIL_RE;
      const isQuestion = (qList.length && qList.some(q => q && body.includes(q))) || qTail.test(body);
      if (isQuestion) continue;
      // [r362 收窄] 结论侧同一性标记豁免同样走 _identityAdjacent——
      // 移位句结论常写作「那就是有一位 X」（那就是 + 存在量词 = ∀→∃
      // 偷换的标志形），原无条件 includes 匹配会把它整句放掉（A9 实证）。
      // 真辨识结论（「那就是青霉素」）不插存在量词，仍正常豁免。
      if ((R.IDENTITY_ZH || IDENTITY_ZH).some(m => body.includes(m) && _identityAdjacent(body, m))) continue;
      if ((R.IDENTITY_EN || IDENTITY_EN).some(m => low.includes(m))) continue;
      // [r361 豁免] 制度规范适用——「一人迟到，所以规则要求全员早到」是
      // 规范触发（rule/policy/requirement 的全员适用是规则定义，不是
      // 从单例外推）。结论侧含制度规范类词时豁免。
      // 用词边界匹配，避免 'flaw'.includes('law') 这类子串误伤。
      const bLow = body.toLowerCase();
      if (NORMATIVE_EN.some(m => new RegExp('\\b' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(bLow))) continue;
      // 统计语境
      if ((R.STAT_ZH || STAT_ZH).some(m => t.includes(m))) continue;
      if ((R.STAT_EN || STAT_EN).some(m => low.includes(m))) continue;

      // 腿④：谓域共享（族B 放宽判据，见 _sharedDomain 注释）
      const isEN = /[a-zA-Z]/.test(body) && !/[\u4e00-\u9fff]/.test(body);
      if (!_sharedDomain(pre, body, isEN, isFamilyB)) continue;

      hits.push({
        premise: pre.trim().slice(0, 60),
        conclusion: body.slice(0, 60),
        mode: isFamilyB ? 'EX_TO_UNI' : 'UNI_TO_EX',
        forEvery,
      });
      break;
    }
  }

  if (!hits.length) return _pass();

  const first = hits[0];
  const baseScore = first.forEvery ? 78 : 72;
  let score = baseScore;
  score += Math.min(3 * (hits.length - 1), 9);
  score = Math.min(score, 90);

  const detail = '量词辖域移位（∀x∃y 推不出 ∃y∀x）' + hits.length + '处：由「' + first.premise.slice(0, 24) +
    '」推出「' + first.conclusion.slice(0, 24) + '」——同一个存在对象被从「对每个 x 各有一个」的口径偷换成「有一个对所有 x 都成立」的口径';

  return {
    score,
    verdict: score >= 70 ? 'unsupported' : 'pass',
    exempt: false,
    exempt_reason: null,
    count: hits.length,
    detail,
    hits: hits.map(h => ({ premise: h.premise, conclusion: h.conclusion, mode: h.mode })),
    strength: score >= 84 ? 'high' : score >= 70 ? 'medium' : 'none',
  };
}

module.exports = {
  checkQuantifierScopeShift,
  __internals: {
    UNIVERSAL_ZH, UNIVERSAL_EN, EXIST_ZH, EXIST_EN, CONCL_UNIVERSAL_ZH, CONCL_UNIVERSAL_EN,
    INFER_ZH, INFER_EN, IDENTITY_ZH, IDENTITY_EN, HEDGE_ZH, HEDGE_EN,
    NEG_ZH, NEG_EN, CONDITIONAL_ZH, CONDITIONAL_EN, META_CONCEPT, TEACH_ZH, TEACH_EN,
    STAT_ZH, STAT_EN, META_DISCUSS, EN_STOP, ZH_STOP,
    // [r362] 负例注入契约补全：新腿常量与守卫常量全部导出（注入空数组=删腿）
    UNIVERSAL_ZH_BARE, UNIVERSAL_ZH_PERSON, BARE_EXIST_ZH,
    CONCL_UNIVERSAL_ZH_BARE, INFER_ZH_REVERSE, INFER_EN_REVERSE, NORMATIVE_EN,
    FOR_EVERY_ZH, FOR_EVERY_EN,
    // [r363 补契约] 疑问守卫常量表（原内联正则，负例注入鞭长莫及）
    QUESTION_ZH, QUESTION_TAIL_RE,
  },
};
