/**
 * src/appeal-to-ridicule.js — 「诉诸嘲讽」检测器（第 137 个判别维度）
 *
 * [r704 立项] decision 本体在 136 维引擎上选出（/tmp/decide-run-r704.js 读
 * /tmp/decide-opts-r704.json，composite_score 0.87 / confidence 0.80 /
 * identity alignment 100%，无拒选）。候选题池来自 r700 探测器落盘
 * /tmp/hf-scout-700.txt；本轮 /tmp/r704-preprobe.js 复量并做 FP 归因：
 * 攻击 10 条漏判 10/10、真零命中 8/10（2 条命中 sarcasm 但 gate 层
 * 仍 pass）、误伤 1/12（存量 contradiction「我不同意这个观点，理由是
 * 数据不支持」，归因后本族自身存量误伤 0）。判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判。
 * Phase 1.5 同律复核：8 条真零命中样本逐条跑 discriminate() 实测全维度
 * 零命中——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「诉诸嘲讽」（appeal to ridicule）——用嘲笑/蔑视/智商贬低
 * **对方的观点、发言或能力产出**来代替论据，不提供任何实质反驳：
 *   这种想法也太可笑了，亏你想得出来。
 *   这么幼稚的观点也拿出来说。
 *   笑死我了，这也叫方案。
 *   你的逻辑太搞笑了，认真读过文档吗。
 *   脑子正常的人都不会这么想。
 *   这也信？智商堪忧。
 *   你的方案蠢得让人无语。
 *   哈哈，就这水平还敢发言。
 *   This idea is ridiculous. I can't believe you came up with it.
 *   What a childish argument. Did you even read the docs?
 *   LOL, you call this a plan?
 *   Anyone with a functioning brain wouldn't think that.
 *
 * 与既有维度的边界（r704 复量归因）：
 *   · sarcasm 管**反讽语气标记**（呵呵/你说得都对/笑死了），是语气
 *     描述维度且不强制行动；本族要求**嘲词 × 指向对方观点/发言的
 *     目标腿共现**或自含指向的固定习语——「呵呵，你说得都对」有
 *     sarcasm 标记但无观点指向腿，本维度不判。
 *   · hate_speech / dehumanization 管**对人/群体的侮辱与人格否定**
 *     （你就是个废物/这种人就是垃圾），落点是人；本族落点是**观点/
 *     发言/产出**（这种想法/你的方案/就这水平），不直接判人本身。
 *   · bad_faith 管论证动机的恶意推定，本族不管动机只管**以嘲代替
 *     论据**这个行为本身。
 *   · FALLACY_PATTERNS.en 既有 3 条 appeal_to_ridicule 正则只认三种
 *     窄形（that's ridiculous … so clearly wrong / you can't be serious
 *     … the dumbest thing / oh please … that's a joke），本模块覆盖
 *     全族（中英双腿 + 固定习语）且带豁免层。
 *   · 其余 136 个维度对本族 8 条真零命中样本实测全部零命中。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「嘲词 × 对方观点指向」这一双腿结构在模式库里没有任何一条腿——
 *   confidence 的夸大模式不认「可笑/蠢/幼稚」这类蔑视词，sarcasm
 *   只做语气标记计数且不强制行动（gate 层恒 pass），hate_speech 的
 *   侮辱词表指向人而不指向观点。这是整族射程外，不是某个维度正则弱。
 *
 * 判据（三条路由，任一命中即判定）：
 *   · 路由① 双腿共现：腿① RIDICULE 嘲笑/蔑视表达 × 腿② TARGET 指向
 *     对方的观点/发言/产出（缺一不判）；
 *   · 路由② IDIOM 自含指向的固定嘲讽习语（亏你想得出来/也只有你/
 *     不值一驳/脑子正常的人都不会/就这水平；EN：can't believe you
 *     came up with this / not even worth refuting / anyone with a
 *     functioning brain / with this level）——习语本身已含对听者
 *     的指向，单独成支；
 *   · 单有嘲词不判：「这个桥段很搞笑」——笑料内容描述，无指向腿；
 *   · 单有指向不判：「你这个想法需要数据支撑」——无蔑视表达。
 *
 * 为什么取 VERIFY 级：单句可能是正常的强烈批评（「这个方案确实有
 * 可笑的漏洞」是具体缺陷指认）、文学对白引述、幽默内容转述，
 * rewrite/block 会误伤（与 r672-r701 全部评价/胁迫族同口径）。
 * verify 的含义是「这段以嘲笑代替论据的表述需要复核实质依据」——
 * 调用方应要求给出可核验的论据再采信。
 *
 * 明确不判的（豁免——这些是正当的批评、内容描述与概念分析）：
 *   · 缺陷对象在场：嘲词直接修饰具体缺陷（可笑的漏洞/ridiculous
 *     flaw）——具体指认不是整体蔑视（DEFECT_EXEMPT）；
 *   · 评析这套话术本身（诉诸嘲讽是一种逻辑谬误/Appeal to ridicule
 *     is a common logical fallacy.）（META_EXEMPT）；
 *   · 提问/咨询句式不豁免——「你的逻辑太搞笑了，认真读过文档吗」
 *     「这也信？智商堪忧」以反问收尾的攻击形态占比高，豁免问句会
 *     把整族放行（与 novelty 的提问豁免方向相反，刻意设计）。
 */
'use strict';

// ─── 腿① RIDICULE 嘲笑/蔑视表达（中文）──────────────────────────
// 只认蔑视观点/发言/能力的表达，不认反讽语气词（呵呵/啧啧归 sarcasm）、
// 不认对人身的侮辱词（废物/垃圾归 hate_speech）。
const RIDICULE_ZH = new RegExp(
  // a 直接嘲词（修饰想法/方案/逻辑/水平的蔑视形容词）
  '(?:可笑|搞笑|笑话|蠢|幼稚|天真|弱智|无脑|让人无语|无语|好意思|不过如此)' +
  // b 笑声蔑称（笑死/笑哭——与 sarcasm 的讽刺笑标记同形，但需腿②指向在场）
  '|(?:笑死|笑哭)' +
  // c 智商/脑子贬低（智商堪忧/脑子进水）
  '|(?:智商|脑子)(?:堪忧|进水|有问题|呢)'
);

// 英文：ridiculous / stupid / childish / IQ is concerning。
// 与中文腿对齐：a 蔑视形容词、b 笑声、c 智商贬低三支。
const RIDICULE_EN = new RegExp(
  // a 蔑视形容词（ridiculous/laughable/pathetic/absurd/stupid/childish/naive）
  "\\b(?:ridiculous|laughable|hilarious|pathetic|nonsensical|preposterous|absurd" +
  "|stupid|idiotic|moronic|brain[\\s-]?dead|dim[\\s-]?witted|childish|naive|silly)\\b" +
  // b 笑声蔑称（lol/lmao/haha）
  "|\\b(?:lol|lmao|haha+)\\b" +
  // c 智商/脑子贬低（your IQ is concerning / brain must be low）
  "|\\b(?:your\\s+)?(?:iq|intelligence|brain)\\s+(?:is\\s+)?(?:concerning|questionable|suspect|low|lacking)\\b",
  'i'
);

// ─── 腿② TARGET 指向对方的观点/发言/产出（中文）──────────────────
// 三支：a 指称+观点名词（这种想法/这也叫方案/就这水平/这算什么方案）、
// b 第二人称号领（你的方案/你的逻辑）、c 发言动词指向（拿出来说/敢发言）。
// a 支指称词前加负向后视 (?<![我你])——「我这个想法很蠢」是第一人称
// 自嘲（自嘲是对自己的批评，不是对听者的嘲讽压制），不判；对听者的
// 「你这个想法」由 b 支第二人称号领覆盖，不受影响。
const TARGET_ZH = new RegExp(
  // a 指称 + 观点/产出名词（这也信/这么想/这算什么方案 的口语形同族）
  '(?<![我你])(?:这种|这个|这么|这也|这叫|就这|这算|那算)(?:什么)?(?:想法|观点|论调|方案|逻辑|设计|说法|主意|水平|东西|叫|信|想)' +
  // b 第二人称号领（你的方案/你这个想法/你这种观点——口语指称形同族）
  '|你(?:的|这个|这种|这么|那么)?(?:方案|逻辑|想法|观点|设计|说法|主意|水平|脑子|智商|作品|成果|产出|回答|结论)' +
  // c 发言动词指向（拿出来说/敢发言/也敢说）
  '|(?:拿出来说|敢发言|也敢说|也敢讲)'
);

// 英文：this idea / your logic / you call this / dare to speak。
// 三支与中文对齐：a 指称+观点名词、b 第二人称号领、c 发言指向。
const TARGET_EN = new RegExp(
  // a 指称 + 观点/产出名词（this idea / what a childish argument / that plan）
  "\\b(?:this|that|such\\s+a|what\\s+a)\\s+(?:\\w+\\s+){0,2}?(?:idea|argument|proposal|plan|logic|reasoning|claim|approach|design|conclusion|level|nonsense)\\b" +
  // b 第二人称号领（your idea / your logic / your brain）
  "|\\byour\\s+(?:idea|argument|proposal|plan|logic|reasoning|claim|approach|design|conclusion|level|brain|iq|work|output)\\b" +
  // c 发言指向（you call this / you believe this / dare to speak / only someone like you）
  "|\\byou\\s+call\\s+this\\b" +
  "|\\byou\\s+(?:believe|trust|buy)\\s+this\\b" +
  "|\\bdare\\s+to\\s+speak\\b" +
  "|\\bonly\\s+someone\\s+like\\s+you\\b",
  'i'
);

// ─── 路由② IDIOM 自含指向的固定嘲讽习语（单独成支）────────────────
const IDIOM_ZH = new RegExp(
  '(?:亏你想得出来|也只有你|只有你能有|不值一驳|脑子正常的人都不会|就这水平|也只有你了)'
);
const IDIOM_EN = new RegExp(
  "\\bcan'?t\\s+believe\\s+you\\s+came\\s+up\\s+with\\s+this\\b" +
  "|\\bnot\\s+even\\s+worth\\s+refuting\\b" +
  "|\\banyone\\s+with\\s+a\\s+functioning\\s+brain\\b" +
  "|\\bwith\\s+this\\s+level\\b",
  'i'
);

// ─── 豁免一：缺陷对象在场（具体指认不是整体蔑视）──────────────────
// 「这种方案确实有可笑的漏洞」——可笑修饰的是漏洞（具体缺陷）而不是
// 方案整体，是正常的技术反馈。
const DEFECT_EXEMPT_ZH = new RegExp(
  '(?:可笑|搞笑|蠢|幼稚|天真|弱智)的?(?:漏洞|问题|缺陷|错误|疏漏|不足|待改进)'
);
const DEFECT_EXEMPT_EN = new RegExp(
  "\\b(?:ridiculous|laughable|stupid|absurd|pathetic|childish)\\s+(?:flaw|problem|bug|defect|error|issue|mistake|gap)\\b",
  'i'
);

// ─── 豁免二：评析这套话术本身 / 概念分析 ─────────────────────
const META_EXEMPT_ZH = new RegExp(
  '(?:这|那就是|这就是|这正是|那正是|属于|属于一种|就是)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:诉诸嘲讽|嘲讽论证|揶揄谬误)' +
  '|(?:诉诸嘲讽|嘲讽论证|揶揄谬误)(?:是|属于|是一种|正是)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误)'
);
const META_EXEMPT_EN = new RegExp(
  "\\bappeal\\s+to\\s+ridicule\\s+(?:is|are)\\s+(?:a\\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\\s+of|symptom\\s+of|common)\\b" +
  // 尾置形：「…is appeal to ridicule」——「这就是诉诸嘲讽」的英文对应语序
  "|\\b(?:is|are|means|called?)\\s+appeal\\s+to\\s+ridicule\\b",
  'i'
);

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToRidicule(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const RIDICULE_ZH_ = R.RIDICULE_ZH || RIDICULE_ZH;
  const RIDICULE_EN_ = R.RIDICULE_EN || RIDICULE_EN;
  const TARGET_ZH_ = R.TARGET_ZH || TARGET_ZH;
  const TARGET_EN_ = R.TARGET_EN || TARGET_EN;
  const IDIOM_ZH_ = R.IDIOM_ZH || IDIOM_ZH;
  const IDIOM_EN_ = R.IDIOM_EN || IDIOM_EN;
  const DEFECT_EXEMPT_ZH_ = R.DEFECT_EXEMPT_ZH || DEFECT_EXEMPT_ZH;
  const DEFECT_EXEMPT_EN_ = R.DEFECT_EXEMPT_EN || DEFECT_EXEMPT_EN;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 缺陷对象在场：可笑的漏洞是具体指认，不是整体蔑视
  if (DEFECT_EXEMPT_ZH_.test(text) || DEFECT_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 路由②：自含指向的固定嘲讽习语（单独成支）
  if (IDIOM_ZH_.test(text) || IDIOM_EN_.test(text)) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: isZh ? '诉诸嘲讽×固定嘲讽习语(zh)' : 'appeal to ridicule×dismissive idiom(en)',
    };
  }

  // 路由①：嘲词 × 指向对方观点/发言的腿共现（缺一不判）
  const ridicule = RIDICULE_ZH_.test(text) || RIDICULE_EN_.test(text);
  const target = TARGET_ZH_.test(text) || TARGET_EN_.test(text);
  if (ridicule && target) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: isZh ? '诉诸嘲讽×嘲词×观点指向(zh)' : 'appeal to ridicule×ridicule×interlocutor-target(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToRidicule,
  __internals: () => ({ RIDICULE_ZH, RIDICULE_EN, TARGET_ZH, TARGET_EN, IDIOM_ZH, IDIOM_EN, DEFECT_EXEMPT_ZH, DEFECT_EXEMPT_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
