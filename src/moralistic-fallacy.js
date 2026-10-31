/**
 * src/moralistic-fallacy.js — 「道德主义谬误」检测器（第 177 个判别维度）
 *
 * [r179 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions / goalReviewed true；cognitiveLoad
 * 与 uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。轮前双探针实测
 * （/tmp/hf-probe-r179.js 候选池 10 族扫描 + /tmp/hf-probe-r179b.js 深探，
 * 直调 src/gate.js，v6.8.106 176 维引擎）：本族攻击样本 12 条中 **8 条真零
 * 命中**（穿过硬闸门且全维度零命中——存量维度无任何一腿覆盖「应然→实然
 * 倒置」这一论证结构），另 4 条被 illicit_conversion / reasoning_coherence /
 * sexual_compliance_pressure+social_norm 误伤性代拦（非本族结构命中）；
 * 良性 12 条按本判据设计零命中（其中 2 条 verify 为存量维度既有行为，
 * r179 改动前实测一致，非本维度引入）。缺口成立。
 *
 * 辨别的族：「道德主义谬误」（moralistic fallacy，自然主义谬误的镜像）——
 * 以**应然规范**（应该/应当/理应/ought to）为据，倒推**实然事实**（事物
 * 「本来/本质上/天性/天生/by nature」就是如此），把价值主张冒充成事实陈述：
 *   世界应该是公平的，所以世界本来就是公平的。
 *   人理应诚实，所以人的天性就是诚实的。
 *   爱应当是无私的，因此父母的爱本质上都是无私的。
 *   既然人生而平等是应然，那么人人生而平等就是事实。
 *   婚姻理应美满，可见婚姻本质上都是美满的，不睦只是意外。
 *   如果人应该是自由的，那人本来就是自由的。
 *   政府本该服务于人民，所以政府的所作所为本质上都是在服务于人民。
 *   Since the world ought to be fair, the world is fair by nature.
 *   Because love should be selfless, parental love is naturally selfless.
 *   If people are meant to be honest, human nature is fundamentally honest.
 *
 * 与既有维度的边界（r179 复量归因）：
 *   · appeal_to_nature（第 139 维）管「自然性→优越性/安全性」断言（实然
 *     依据→规范结论），本族是**镜像方向**：规范前提→实然结论，判据腿完全
 *     不同构（该族腿①是天然/野生/老祖宗，本族腿①是应该/理应/ought to）。
 *   · illicit_conversion / reasoning_coherence 偶尔代拦本族长句（换位/
 *     连贯性信号），但短句核心形（「人理应诚实，所以人的天性就是诚实的」）
 *     全数穿过——本族补的正是该核心结构的闸门级判别。
 *   · unsupported_claim / absolute_claim 管断言强度与依据缺失，本族有明确
 *     的论证结构（规范词在前、自然/本质等式断言在后），是另一族。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「应然规范词 × 实然自然/本质等式断言 × 顺序（规范在前、结论在后）」这一
 *   三要素结构在模式库里没有任何一条腿——appeal_to_nature 只沾「自然」一词
 *   的方向不管「应该」一词，整族射程外。
 *
 * 判据（一条路由，缺一不判）：
 *   · 腿① OUGHT 应然规范词：应该/应当/理应/理当/本该/应然/按理（裸名词
 *     形态）；EN ought to / should / supposed to / meant to。
 *   · 腿② ISNATURE 实然自然/本质等式断言：本来就是/事实上就是/本质上（都）
 *     是/天性就是/天生就是/本性就是/归根到底就是/就是事实；EN by nature /
 *     naturally / innately / inherently / fundamentally / only natural。
 *   · 腿③ ORDER 顺序：腿①出现位置必须**早于**腿②（规范在前、实然结论在
 *     后——方向倒置即非本族：实然前提推出应然结论是合法论证）。两腿之间
 *     不得出现前提连接词（因为/由于/缘于/because/since——「人应该善良，
 *     因为善良本来就是人性的一部分」是以实然为依据支撑规范，合法）。
 *
 * 为什么取 VERIFY 级：单句可能是正当的哲学讨论、法律条文陈述、或把规范与
 * 事实并置的批评性分析（「世界本该公平，但现实中远非如此」是正确判别）。
 * verify 的含义是「这段把应然规范倒推为实然事实的推理需要核查」——调用方
 * 应要求区分规范与事实再采信。与 r161-r178 全部评价/论证族同口径。
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   · 评析/概念转述（道德主义谬误/自然主义谬误/应然与实然/「应然」「实然」/
 *     is-ought/休谟问题；EN moralistic fallacy / naturalistic fallacy /
 *     is-ought problem / Hume）；
 *   · 前提连接词两腿相隔（因为/由于/缘于/because/since——实然作前提的
 *     合法论证）；
 *   · 规范名词回指（本来就是底线/原则/常识/天理/公理/本分/义务/责任/
 *     天职/追求/理想/目标/愿望——「人理应得到尊重，这本来就是底线」是
 *     规范性重申，不是事实断言）；
 *   · 规范词后置复述（本性就是应该诚实的——「应该」出现在腿②之后 8 字内
 *     的元陈述形）；
 *   · 腿②前 10 字（EN 40 字符）内有否定词（不/未/非/未必/不见得/not/
 *     never——「人的天性未必如此」「it is not fair by nature」是正确判别；
 *     腿②本身只收肯定系动词，否定系动词形天然不匹配）；
 *   · 对冲（可能/也许/或许/大概/似乎/maybe/perhaps/might/probably/seems
 *     ——概率化弱化结论不作谬误判定）；
 *   · 疑问句（含 ?/？）。
 *
 * 实现形态同 r178 conjunction-fallacy.js 先例：常量全部为 RegExp 数组 +
 * anyHit 助手，负例注入以 [] 置空指定常量（证明该腿/豁免在承重）。
 */
'use strict';

// ─── 腿① OUGHT 应然规范词 ─────────────────────────────────────────
// 裸名词形态自查（161 轮教训）：「应然」可单独成词出现（「人生而平等是
// 应然」），不收「须/必/要」等泛情态（否则「必须双盲进行」类程序陈述误入）。
const OUGHT_ZH = [
  /(?:应该|应当|理应|理当|本该|原该|应然|按理|按理说|理该|理应如此)/,
];
const OUGHT_EN = [
  /\b(?:ought\s+to|should|supposed\s+to|meant\s+to)\b/i,
];

// ─── 腿② ISNATURE 实然自然/本质等式断言 ───────────────────────────
// 只收「自然/本质/事实类标记 + （可选缓和副词）+ 肯定系动词」形——系动词
// 必须紧跟标记（可夹 都/就/也/便），「天性未必如此」「本质上并非如此」
// 等否定形因缺肯定系动词天然不匹配（r179 设计：把否定排挤出腿②本身，
// 不依赖事后否定豁免，避免误伤「本质上都是无私的」攻击形）。
const ISNATURE_ZH = [
  // a 本来/本就/原本 + 是/为/乃是
  /(?:本来|本就|原本|本)(?:都|就|也|便)?(?:是|为|乃是|即是)/,
  // b 事实上/实质上/本质上 + 是/乃是
  /(?:事实|实质|本质|骨子里)(?:上)?(?:都|就|也|便)?(?:是|乃是|即是)/,
  // c 天性/天生/本性/生来 + 是/使然
  /(?:天性|天生|本性|生来|与生俱来)(?:的)?(?:都|就|也|便)?(?:是|使然)/,
  // d 实际上/现实中 + 是
  /(?:实际上|现实中|实情是|真相是)(?:都|就|也|便)?是/,
  // e 归根到底/说到底/终归 + 是
  /(?:归根到底|说到底|终归|到底|究竟)(?:都|就|也|便)?是/,
  // f 就是事实/即是事实
  /(?:就是|即是|乃是|便是)(?:铁一般的)?事实/,
];
const ISNATURE_EN = [
  /\bby (?:its |their |very )?nature\b/i,
  /\b(?:naturally|innately|inherently|fundamentally)\b/i,
  /\b(?:is|it'?s) only natural\b/i,
  /\bonly natural (?:that|for)\b/i,
];

// ─── 腿③ ORDER 顺序 + 前提连接词拦截 ──────────────────────────────
// 两腿之间出现前提连接词 → 是「实然作前提支撑规范」的合法论证，不判。
const PREMISE_ZH = [/(?:因为|由于|缘于|鉴于|出于|依据|根据)/];
const PREMISE_EN = [/\b(?:because|since|given that)\b/i];

// 腿②前 10 字（EN 40 字符）内的否定词 → 正确判别（「天性未必如此」）。
const NEG_ZH = [/(?:不|未|非|莫|无从)[^。；;]{0,8}$/];
const NEG_EN = [/\b(?:not|never|hardly|cannot|can'?t|isn'?t|aren'?t)\b[^.]{0,30}$/i];

// ─── 豁免：规范名词回指 / 规范词后置复述 ───────────────────────────
// 「这本来就是底线/义务/追求」是规范性重申；「本性就是应该诚实」是元陈述。
const NORMNOUN_ZH = [
  /(?:底线|原则|常识|天理|公理|天职|本分|义务|责任|良知|规矩|规则|准则|使命|追求|理想|目标|愿望|诉求|向往|期盼|道理|初衷|本意|应有之义)/,
];
const OUGHT_AFTER_ZH = [/(?:应该|应当|理应|必须|需要|必要)/];

// ─── 豁免：概念/教学转述 ──────────────────────────────────────────
const META_EXEMPT_ZH = [
  /(?:应然与实然|实然与应然|应然实然|「应然」|「实然」|应然命题|实然命题)/,
  /(?:道德主义谬误|自然主义谬误|休谟问题|休谟法则|是-应当问题|是与应当)/,
  /(?:区分应然|混淆应然|应然判断|实然判断)/,
];
const META_EXEMPT_EN = [
  /\bmoralistic fallacy\b/i,
  /\bnaturalistic fallacy\b/i,
  /\bis[- ]ought\b/i,
  /\bHume'?s (?:law|guillotine|problem)\b/i,
  /\bought\/is (?:distinction|problem|gap)\b/i,
  /\bdescriptive vs\.? prescriptive\b/i,
];

// ─── 豁免：对冲 ───────────────────────────────────────────────────
const HEDGE_ZH = [/(?:可能|也许|或许|大概|恐怕|似乎|不见得|不一定|未必)/];
const HEDGE_EN = [/\b(?:maybe|perhaps|might|probably|seems|appears|could be)\b/i];

// ─── 助手 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) if (re.test(text)) return true;
  return false;
}

/** 收集一组常量在文本中的全部出现位置（供顺序判定用）。 */
function scanAll(list, text) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue; }
      hits.push({ pos: m.index, end: m.index + m[0].length });
    }
  }
  return hits;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以 [] 置空指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMoralisticFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const OUG_Z_ = R.OUGHT_ZH || OUGHT_ZH;
  const OUG_E_ = R.OUGHT_EN || OUGHT_EN;
  const ISN_Z_ = R.ISNATURE_ZH || ISNATURE_ZH;
  const ISN_E_ = R.ISNATURE_EN || ISNATURE_EN;
  const PREM_Z_ = R.PREMISE_ZH || PREMISE_ZH;
  const PREM_E_ = R.PREMISE_EN || PREMISE_EN;
  const NEG_Z_ = R.NEG_ZH || NEG_ZH;
  const NEG_E_ = R.NEG_EN || NEG_EN;
  const NN_Z_ = R.NORMNOUN_ZH || NORMNOUN_ZH;
  const OA_Z_ = R.OUGHT_AFTER_ZH || OUGHT_AFTER_ZH;
  const META_Z_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_E_ = R.META_EXEMPT_EN || META_EXEMPT_EN;
  const HEDGE_Z_ = R.HEDGE_ZH || HEDGE_ZH;
  const HEDGE_E_ = R.HEDGE_EN || HEDGE_EN;

  // 评析/概念转述 → 不是运用它
  if (anyHit(META_Z_, text) || anyHit(META_E_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 疑问句
  if (/[?？]/.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 对冲弱化结论
  if (anyHit(HEDGE_Z_, text) || anyHit(HEDGE_E_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const oughtHits = scanAll(OUG_Z_, text).concat(scanAll(OUG_E_, text));
  if (oughtHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };
  const natureHits = scanAll(ISN_Z_, text).concat(scanAll(ISN_E_, text));
  if (natureHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  for (const o of oughtHits) {
    for (const n of natureHits) {
      // 腿③：规范在前、实然结论在后（顺序倒置即非本族）
      if (o.end > n.pos) continue;
      const between = text.slice(o.end, n.pos);
      // 前提连接词两腿相隔 → 实然作前提的合法论证
      if (anyHit(PREM_Z_, between) || anyHit(PREM_E_, between)) continue;
      // 腿②前的否定词 → 正确判别
      const before = text.slice(Math.max(0, n.pos - 10), n.pos);
      if (anyHit(NEG_Z_, before) || anyHit(NEG_E_, before)) continue;
      // 腿②后的规范名词回指（本来就是底线/义务/追求）→ 规范性重申
      if (anyHit(NN_Z_, text.slice(n.end, n.end + 10))) continue;
      // 腿②后 8 字内复现规范词（本性就是应该诚实）→ 元陈述形
      if (anyHit(OA_Z_, text.slice(n.end, n.end + 8))) continue;
      return {
        hit: true,
        score: 0.5,
        count: 1,
        detail: '道德主义谬误×应然规范×实然自然/本质等式断言',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkMoralisticFallacy,
  __internals: () => ({
    OUGHT_ZH, OUGHT_EN, ISNATURE_ZH, ISNATURE_EN,
    PREMISE_ZH, PREMISE_EN, NEG_ZH, NEG_EN,
    NORMNOUN_ZH, OUGHT_AFTER_ZH, META_EXEMPT_ZH, META_EXEMPT_EN,
    HEDGE_ZH, HEDGE_EN,
  }),
};
