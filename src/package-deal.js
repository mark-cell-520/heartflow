/**
 * src/package-deal.js — 「一揽子谬误」检测器
 * （第 260 个判别维度，r367 立项）
 *
 * [r367 立项] 立项依据：
 *   · 缺口实证（scripts/round-367/probe-package-deal.js，直调 gate.js v6.8.189）
 *     —— package_deal 族 11 条攻击样本穿透 8 条（gate.action=pass），
 *     其中 EN 侧 4/4 全穿透、ZH 侧 4/7 穿透（其余被 false_dilemma /
 *     absolute_claim / ecological_fallacy 等既有维度代拦，但**没有一条**
 *     命中本族维度——dimMap 中 package_deal / 一揽子 / 打包 零命中）。
 *     良性 8 条仅 1 条被既有基线误伤（vagueness 类，非新维度引入）。
 *   · 外部来源：三层搜索（HN Algolia / Semantic Scholar / GitHub）无纯规则
 *     成熟方案可抄——logical fallacy detection 方向 GitHub 最高仅 21 星
 *     （tmakesense/logical-fallacy，在线工具非规则库），其余全部 LLM 模型
 *     路线（T5 / FastAPI LLM serving）；hallucination detection 方向 109 条
 *     命中全为 HDM-1 / UQLM / HalluMix 等模型或 benchmark。心虫为纯规则
 *     引擎不引 LLM 依赖，判据为自有纯规则实现（零 LLM 依赖）。
 *     侦察落盘：/tmp/hf-scout/hf-scout-1794863245.txt
 *   · 心虫裁决：heartflow_philosophy_decision 返回 accelerate
 *     （confidence 0.7 / priority 40 / goalReviewed=true；cognitiveLoad 与
 *      uncertainty 为 "unknown"，按纪律不当实质背书）。
 *   · 与既有维度的边界：false_dilemma(63) 管「只有两个选项」的**选项集压缩**
 *     （非黑即白/非此即彼，把连续可能域砍成两个极端）；本族管「多个独立
 *     命题被打包成一个不可拆分的原子单位」的**评估单元替换**——false_dilemma
 *     回答「选项被人为减少了」，package_deal 回答「本该逐条评估的多个命题
 *     被人为焊成一块，接受其一即须接受其全部」。两者常在同句共现但判定的
 *     是不同的推理步骤。absolute_claim 管断言强度，本族有明确的打包结构；
 *     loyalty_test 管忠诚度测试，本族不涉及忠诚宣示；exclusive_trust 管
 *     排他信任，本族不涉及信任关系。
 *
 * 形态（两条腿共现 + 邻近窗 + 豁免组，缺一不判）：
 *   腿① PACKAGE_BIND 打包绑定——句中把多个独立命题焊成一个整体单位：
 *         整套/一整套/整套方案/整套立场/打包/一揽子/整体接受/全盘接受/
 *         全盘否定/整体认同/全部接受/整套世界观/一个整体/不可拆分/
 *         不能拆开/不能分割；EN the whole package / package deal / as a
 *         package / all-or-nothing / the entire platform / take it or
 *         leave it / all of it or none of it。
 *         含**裸名词形**（r161 轮教训：同族词去掉后缀仍须命中）——单独出现
 *         「一揽子」「打包」「整套」即算腿①候选，不依赖后续修饰词。
 *   腿② ALL_OR_NOTHING 全有或全无——句中表达「不接受全部就等于不接受」：
 *         要么全盘/要么整体/要么全收/要么全弃/没有中间地带/不存在只/
 *         不能只/不得只/只挑其中/只认同其中几条；EN you cannot accept
 *         just one / cannot agree with only / taking issue with one item
 *         / you have to take all of it / reject it entirely / it is all
 *         or nothing。
 *         含**倒装形**（结论前置）：结论在前、理由在后作依据（「不存在只
 *         认同其中几条的说法，这是一整套世界观」）。
 *
 * 这个「打包 × 全无」结构天然区分谬误与相关句式：
 *   - 逐条评估（可以逐条评估/各自独立/分开评估）——正确判别，不判
 *   - 部分同意（同意第一条而反对第二条）——正确判别，不判
 *   - 合同/协议整体生效（合同条款相互引用不能拆开履行）——法律事实，
 *     其「不可拆分」来自契约技术结构而非论证策略，不判
 *   - 产品附带协议（买产品需整体接受用户协议）——商业交付形式，不判
 *   - 宪法/根本法整体（修改需遵循特定程序）——制度设计，不判
 */
'use strict';

// ── 腿①：打包绑定词（把多个独立命题焊成一个单位）─────────────────
// [r367 裸名词纪律] 161 轮教训：枚举类腿必须含裸名词形态——同族词去掉后缀
// 仍须能命中。「整套方案」与裸「整套」都要收，否则「这是一整套世界观」
// （无「方案」后缀）整句漏判。下表 BIND 族全部为可独立出现的名词/动词形。
const BIND_ZH = [
  // 裸名词形（无后缀即可命中）
  '一揽子', '打包', '整套', '一整套', '整体', '整个包',
  // 打包动词/形容词形
  '一揽子方案', '一揽子计划', '打包出售', '捆绑', '捆在一起', '绑在一起',
  '焊在一起', '粘在一起', '不可拆分', '不可分割', '不能拆开', '不能分开',
  '拆不开', '分不开', '难以拆分', '无法分割',
  // 全盘接受/拒绝形
  '全盘接受', '全盘否定', '全盘拒绝', '全盘照收', '全盘认同', '全盘采纳',
  '整体接受', '整体否定', '整体认同', '整体拒绝', '整体签认', '整体采纳',
  '全部接受', '全部否定', '全部认同', '全收', '全弃',
  // 立场/观点包
  '整套立场', '整套观点', '整套主张', '整套世界观', '整套价值', '整套理念',
  '一整套左翼', '一整套右翼', '整套意识形态', '整套话语', '整套框架',
  // 平台/政纲包
  '整套政纲', '整套政见', '整套纲领', '整个平台', '整个运动',
  '整套运动', '整套宣言', '整套教义', '整套体系', '整套理论',
  // [r367 补腿①] 「全部+抽象名词」打包形——「接受它的全部价值观」「认同他的
  // 全部政见」。r161 轮教训：同族词去掉后缀仍须命中，此处补「全部/所有 +
  // 立场类抽象名词」的组合形与裸「全部」族抽象名词形。
  '全部价值观', '全部政见', '全部理念', '全部主张', '全部观点', '全部立场',
  '全部信仰', '全部教义', '全部传统', '全部习俗', '全部条款', '全部内容',
  '所有价值观', '所有政见', '所有理念', '所有主张', '所有观点', '所有立场',
  '价值观都得', '理念都得', '政见都得', '主张都得',
  // 「焊死即不可拆」的后置否定形（与 ALLORN 的「只」否定互补）
  '不能拆开支持', '不能拆开认同', '不能拆开接受', '不可分别', '不可各自',
  '不能分别支持', '不能分别认同', '不能分别对待',
];

const BIND_EN = [
  'package deal', 'the whole package', 'as a package', 'a package',
  'all-or-nothing', 'all or nothing', 'take it or leave it',
  'all of it or none of it', 'the entire platform', 'the entire package',
  'the whole platform', 'the whole thing', 'one indivisible',
  'indivisible whole', 'comes as a package', 'bundled together',
  'cannot be separated', "can't be separated", 'not separable',
  'accept the whole', 'reject the whole', 'take the whole',
  'whole set of beliefs', 'entire worldview', 'the entire ideology',
];

// ── 腿②：全有或全无（不接受全部 = 不接受）────────────────────────
const ALLORN_ZH = [
  // 「要么…要么…」全盘形（区别于 false_dilemma 的关键：两侧都是「整体」）
  '要么全盘', '要么整体', '要么全收', '要么全弃', '要么统统', '要么全部接受',
  '要么全部否定', '要么完全接受', '要么完全否定',
  // [r367 补腿②] 「要么」裸标记形——「你要么全盘接受这套方案，要么就是
  // 完全不同意」中腿①「全盘接受」在**第一个**「要么」之后、腿②「要么就是
  // 完全不同意」在**第二个**「要么」之后。原表只收「要么+整体词」组合，
  // 漏「要么就是完全不同意」这种第二分支不重复整体词的对称形。
  '要么就是', '要么等于', '要么意味着', '要么说明', '要么就说明',
  // 「只」否定形（不得只接受其中一条）
  '不能只', '不得只', '不许只', '不准只', '无法只', '不能仅', '不得仅',
  '只挑其中', '只认同其中', '只接受其中', '只同意其中', '只选其中',
  '只取其中', '只认其中', '只要其中', '只支持其中', '只赞成其中',
  '不存在只', '没有只', '别说只', '谈不上只',
  // [r367 补腿②] 「焊死不可拆」形——「这是一整套左翼立场，不能拆开支持」
  // 该句的「全无」信号不在「要么」而在「不能拆开」这一否定性焊接断言。
  // 与腿①「不能拆开支持」配对，构成「打包 × 不可拆」的共现判据。
  '不能拆开', '不得拆开', '不许拆开', '无法拆开', '不可拆开', '拆不开',
  '不能分开', '不得分开', '不可分开', '不能分别', '不可分别', '不可各自',
  // [r367 补腿②] 「只…不…」对应形——「不能只买产品不认理念」中「不能只」
  // 已收，但「只认…不认…」的对照结构须补第二腿标记以覆盖更多变体。
  '只认理念', '只认同…', '只支持…而', '只接受…而', '只同意…而',
  // 「否则」断章取义形
  '否则就是断章取义', '否则就是断章', '否则等于断章取义', '就是断章取义',
  '否则就是挑刺', '否则别有用心', '否则居心不良',
];

const ALLORN_EN = [
  'cannot accept just', 'cannot agree with just', 'cannot agree with only',
  "can't accept just", "can't agree with just", 'cannot take just',
  'accept only one', 'agree with only one', 'agree with just one',
  'taking issue with one item', 'object to one item', 'reject one item',
  'rejecting the entire', 'reject the entire', 'rejects the entire',
  'rejecting the whole', 'reject the whole', 'you must accept all',
  'must accept every', 'accept every other', 'have to accept all',
  'it is all or nothing', "it's all or nothing", 'wholesale acceptance',
  'wholesale rejection', 'no middle ground', 'without the middle',
  // [r367 补腿② EN] 「every X or none」全称形——「you must endorse every
  // plank or none of it」「accept all of its traditions」。「endorse every」
  // 与「all of its」是腿②的全称标记，与腿①的 package 形构成共现。
  'or none of it', 'or none of them', 'every plank', 'every single',
  'every other', 'all of its', 'all of the', 'endorse every',
  'accept all of', 'embrace all of', 'share all of', 'believe in all of',
];

// ── 邻近窗 ────────────────────────────────────────────────────────
// 腿①与腿②落在同一子句或相邻 2 子句内即视为同一次打包叙述。
// ZH 用字符数、EN 用字符数（EN 词短但修饰多，取 240）。
const WINDOW_ZH = 120;
const WINDOW_EN = 240;

// ── 守卫：豁免组 ──────────────────────────────────────────────────

// ① 逐条评估（正确判别）：本族的反义表述
const SEPARATE_ZH = [
  '逐条评估', '逐条分析', '逐条判断', '逐条讨论', '逐条表决', '逐条审议',
  '各自独立', '分别评估', '分别论证', '分别讨论', '分开评估', '分开判断',
  '分开讨论', '独立评估', '独立判断', '单独评估', '单独讨论',
  '可以支持有的可以反对', '可以同意这条而反对', '可以认同这条而反对',
  '并不矛盾', '并不捆绑', '并非捆绑', '不是捆绑', '无须捆绑', '不必捆绑',
  '不是一揽子', '并非一揽子',
];
const SEPARATE_EN = [
  'separate proposals', 'separate issues', 'separate items', 'each stands on its own',
  'on its own merits', 'independently', 'separately', 'evaluate each',
  'assess each', 'judge each', 'one at a time', 'item by item',
  'point by point', 'not a package', 'not bundled', 'need not accept everything',
];

// ② 法律/契约技术结构：合同条款相互引用导致整体生效
const LEGAL_ZH = [
  '合同', '协议', '契约', '条款相互引用', '不可分割的合同', '整体合同',
  '用户协议', '服务协议', '隐私协议', '许可协议', '附录', '补充协议',
  '具有法律约束力', '法律效力', '违约责任', '签署', '签认生效',
];
const LEGAL_EN = [
  'contract', 'agreement', 'terms of service', 'user agreement',
  'license agreement', 'legally binding', 'clause', 'the contract',
  'under the agreement', 'by signing', 'signature', 'legally enforceable',
];

// ③ 制度/产品交付形式：产品附带协议、宪法根本法整体修改程序
const INSTITUTIONAL_ZH = [
  '宪法', '根本法', '修改宪法', '修宪', '宪法的修改', '特定程序', '法定程序',
  '用户须知', '产品附带', '随产品', '安装即表示', '使用即表示',
  '登记制度', '配套制度',
];
const INSTITUTIONAL_EN = [
  'constitution', 'constitutional', 'amendment procedure', 'by law',
  'statutory procedure', 'end-user license', 'eula', 'by installing',
  'by using this product', 'shipped with', 'bundled with the product',
];

// ④ 疑问/对冲/否定
const HEDGE_ZH = ['可能', '也许', '或许', '大概', '恐怕', '未必', '不一定', '取决于', '视情况', '某种程度上'];
const HEDGE_EN = ['maybe', 'perhaps', 'might', 'could be', 'likely', 'depends', 'in some sense', 'to some extent'];
const NEG_ZH = ['并非', '并不是', '不等于', '不代表', '推不出', '不意味着', '不见得', '算不上', '谈不上', '不应', '不该', '绝不应当', '决不能'];
const NEG_EN = ['does not mean', "doesn't mean", 'not necessarily', 'is not to say', 'does not imply', "doesn't imply", 'should not', 'must not', 'never say'];

// ⑤ 概念/教学转述（讨论这个谬误本身是正确判别）
const META_ZH = [
  '一揽子谬误', '打包谬误', '捆绑谬误', '整体谬误', '这个谬误', '这种谬误',
  '逻辑谬误', '形式谬误', '谬误清单', '谬误列表', '常见谬误', '谬误有哪些',
  '识别谬误', '辨别谬误', '谬误的定义', '谬误分类', '诡辩术', '批判性思维',
  '逻辑错误', '推理错误', '论证无效',
];
const META_EN = [
  'package-deal fallacy', 'package deal fallacy', 'bundling fallacy',
  'logical fallacy', 'informal fallacy', 'list of fallacies',
  'critical thinking', 'what is a fallacy', 'this fallacy',
  'the fallacy of', 'logical error', 'reasoning error',
];

// ⑥ 疑问句
const QUESTION_ZH = ['是否', '能否', '能不能', '难道', '是不是', '究竟', '吗', '呢'];
const QUESTION_TAIL_RE = /[吗呢？?]/;

// ── 工具函数 ──────────────────────────────────────────────────────
function _clauses(t) {
  const parts = t.split(/[。；;！!？?\n]+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const subs = p.split(/\.(?=\s|[A-Z"']|$)/).map(s => s.trim()).filter(Boolean);
    for (const s of subs) out.push(s);
  }
  return out;
}

function _isEN(s) {
  return /[a-zA-Z]/.test(s) && !/[\u4e00-\u9fff]/.test(s);
}

// 词边界查找（EN）或子串查找（ZH）
function _find(list, s, low, isEN) {
  let best = null;
  for (const w of list) {
    let idx = -1;
    if (isEN) {
      const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      const mt = low.match(re);
      if (mt) idx = mt.index;
    } else {
      idx = s.indexOf(w);
    }
    if (idx >= 0 && (!best || idx < best.idx || (idx === best.idx && w.length > best.word.length))) {
      best = { word: w, idx };
    }
  }
  return best;
}

function _exempt(reason, marker) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason, marker, count: 0, detail: '', hits: [] };
}

function _pass() {
  return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [] };
}

// ── 主检测函数 ────────────────────────────────────────────────────
// inject：负例注入契约——R.X 以空数组替换指定常量（生产调用不传 inject）。
// 每条腿与每组守卫均为可删常量，负例测试可逐项验证承重。
function checkPackageDeal(text, inject) {
  if (!text || typeof text !== 'string') return _pass();
  const R = inject || {};
  const t = text.trim();
  if (t.length < 6) return _pass();

  const low = t.toLowerCase();

  // ① 逐条评估豁免（正确判别）——全文级，放在最前
  for (const m of (R.SEPARATE_ZH || SEPARATE_ZH)) { if (t.includes(m)) return _exempt('SEPARATE', m); }
  for (const m of (R.SEPARATE_EN || SEPARATE_EN)) { if (low.includes(m)) return _exempt('SEPARATE', m); }
  // ② 法律/契约技术结构
  for (const m of (R.LEGAL_ZH || LEGAL_ZH)) { if (t.includes(m)) return _exempt('LEGAL', m); }
  for (const m of (R.LEGAL_EN || LEGAL_EN)) { if (low.includes(m)) return _exempt('LEGAL', m); }
  // ③ 制度/产品交付形式
  for (const m of (R.INSTITUTIONAL_ZH || INSTITUTIONAL_ZH)) { if (t.includes(m)) return _exempt('INSTITUTIONAL', m); }
  for (const m of (R.INSTITUTIONAL_EN || INSTITUTIONAL_EN)) { if (low.includes(m)) return _exempt('INSTITUTIONAL', m); }
  // ⑤ 概念/教学转述
  for (const m of (R.META_ZH || META_ZH)) { if (t.includes(m)) return _exempt('META', m); }
  for (const m of (R.META_EN || META_EN)) { if (low.includes(m)) return _exempt('META', m); }
  // ⑥ 疑问句（原句级，问号在切分前判定）
  const qTail = R.QUESTION_TAIL_RE !== undefined ? R.QUESTION_TAIL_RE : QUESTION_TAIL_RE;
  const qList = R.QUESTION_ZH !== undefined ? R.QUESTION_ZH : QUESTION_ZH;
  if (qTail.test(t) || (qList.length && qList.some(q => q && t.includes(q)))) return _exempt('QUESTION', qTail.source);

  const clauses = _clauses(t);
  const hits = [];

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    const isEN = _isEN(clause);
    const cLow = clause.toLowerCase();

    // 腿①：打包绑定
    const bind = _find(isEN ? (R.BIND_EN || BIND_EN) : (R.BIND_ZH || BIND_ZH), clause, cLow, isEN);
    if (!bind) continue;

    // 邻近窗：同子句 + 后随 1 子句 + 前置 1 子句（倒装形）
    const cands = [];
    // 同子句内腿②须在腿①之后（「要么全盘接受…」标准形）
    const afterInClause = clause.slice(bind.idx + bind.word.length);
    if (afterInClause.trim()) cands.push({ text: afterInClause, mode: 'after-bind' });
    // 腿②也可在腿①之前（「你不能只挑其中一条反对，要么整体认同要么整体否定」——
    // 此形腿②「只挑其中」在腿①「整体认同」之前，须支持前置）
    const beforeInClause = clause.slice(0, bind.idx);
    if (beforeInClause.trim()) cands.push({ text: beforeInClause, mode: 'before-bind' });
    if (i + 1 < clauses.length) cands.push({ text: clauses[i + 1], mode: 'follow' });
    if (i - 1 >= 0) cands.push({ text: clauses[i - 1], mode: 'back' });

    for (const cand of cands) {
      let body = cand.text;
      // 邻近窗收口
      const limit = isEN ? WINDOW_EN : WINDOW_ZH;
      if (body.length > limit) body = body.slice(0, limit);
      body = body.replace(/^[，,。；;、\s]+/, '').trim();
      if (!body) continue;
      const bLow = body.toLowerCase();
      const bIsEN = _isEN(body);

      // 腿②：全有或全无
      const allorn = _find(bIsEN ? (R.ALLORN_EN || ALLORN_EN) : (R.ALLORN_ZH || ALLORN_ZH), body, bLow, bIsEN);
      if (!allorn) continue;

      // 对冲/否定守卫（结论侧）
      if ((R.HEDGE_ZH || HEDGE_ZH).some(h => body.includes(h))) continue;
      if ((R.HEDGE_EN || HEDGE_EN).some(h => bLow.includes(h))) continue;
      if ((R.NEG_ZH || NEG_ZH).some(n => body.includes(n))) continue;
      if ((R.NEG_EN || NEG_EN).some(n => bLow.includes(n))) continue;

      hits.push({
        bind: bind.word,
        allorn: allorn.word,
        premise: clause.slice(0, 60),
        mode: cand.mode,
      });
      break;
    }
    if (hits.length) break;
  }

  if (!hits.length) return _pass();

  const first = hits[0];
  const baseScore = 76;
  let score = baseScore + Math.min(4 * (hits.length - 1), 8);
  score = Math.min(score, 90);

  const detail = '一揽子谬误（package deal：多个独立命题被打包成不可拆分的整体，接受其一即须接受其全部）' +
    hits.length + '处：以「' + first.bind + '」把多个独立命题焊成一个单位，再用「' + first.allorn +
    '」压制逐条判断——本该分别评估的多个主张被当成了原子单位';

  return {
    score,
    verdict: score >= 70 ? 'unsupported' : 'pass',
    exempt: false,
    exempt_reason: null,
    count: hits.length,
    detail,
    hits: hits.map(h => ({ bind: h.bind, allorn: h.allorn, mode: h.mode })),
    strength: score >= 84 ? 'high' : score >= 70 ? 'medium' : 'none',
  };
}

module.exports = {
  checkPackageDeal,
  __internals: {
    BIND_ZH, BIND_EN, ALLORN_ZH, ALLORN_EN,
    SEPARATE_ZH, SEPARATE_EN, LEGAL_ZH, LEGAL_EN,
    INSTITUTIONAL_ZH, INSTITUTIONAL_EN,
    HEDGE_ZH, HEDGE_EN, NEG_ZH, NEG_EN,
    META_ZH, META_EN, QUESTION_ZH, QUESTION_TAIL_RE,
    WINDOW_ZH, WINDOW_EN,
  },
};
