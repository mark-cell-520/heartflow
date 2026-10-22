/**
 * src/appeal-to-novelty.js — 「诉诸新潮」检测器（第 135 个判别维度）
 *
 * [r699 立项] decision 本体在 134 维引擎上选出（/tmp/decide-run.js 读
 * /tmp/decide-opts.json，composite_score 0.91 / confidence 0.90 /
 * identity alignment 100%，无拒选）。探测器证据：r698 落盘
 * /tmp/hf-scout-698.txt + 本轮 /tmp/round-699-reprobe.js 双确认
 * （判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算
 * 漏判）：攻击 10 条漏判 10/10（100%）、真零命中 10/10、误伤 0/12。
 * Phase 1.5 同律复核：10 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 10/10——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「诉诸新潮」（appeal to novelty，新的就是好的）——仅凭
 * **新/近期/刚发布**这一个属性，就推出**质量优越或旧的该弃用**的
 * 结论，没有任何实测数据、依据或条件说明：
 *   这是最新的框架，肯定比老框架好。
 *   刚发布的模型一定比上一代强。
 *   用新技术就对了，老方法早就过时了。
 *   这是 2026 年的新方案，旧方案可以扔了。
 *   最新的算法肯定更先进，直接用。
 *   这个工具是今年才出的，肯定好用。
 *   The latest framework is definitely better than the old one.
 *   The model that just came out must be stronger than the previous one.
 *
 * 与既有维度的边界（r699 复量归因）：
 *   · confidence 管**断言强度**（肯定/绝对/一定），本维度要求**新潮
 *     标记在场**——「肯定好用」若无新潮腿是普通夸大，归 confidence。
 *   · genetic_fallacy（r693）管**以来源年代为由的贬损**（两百年前的
 *     所以过时），方向相反：本族是**以新为由的褒扬**，且右腿是优越
 *     断言或弃旧劝告，不是来源-质量推断。
 *   · appeal_to_tradition（既有维度）管**诉诸传统**（老祖宗传下来的
 *     就是好），本族方向相反——以新为由的褒扬。
 *   · hasty_generalization 管无依据概推，本族要件是「新」这个属性
 *     被当成质量判据。
 *   · capability_overclaim 管能力夸大，本族落点是新潮属性而非能力。
 *   · 其余 134 个维度对本族 10 条漏判样本实测全部零命中。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「新潮标记 × 无依据优越断言」这一双腿结构在模式库里没有任何
 *   一条腿——confidence 的夸大模式不认「最新/刚发布」这类时间属性
 *   名词，genetic_fallacy 只收以旧为由的贬损、不收以新为由的褒扬。
 *   这是整族射程外，不是某个维度正则弱。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① NOVELTY 新潮标记（在场即算）：最新/刚发布/新技术/新版本/
 *     新框架/新模型/新系统/新方案/新款/今年才出/刚出来/刚上线/新一代/
 *     新版/新出的/新推出的；EN：latest / newest / just released / just
 *     came out / brand-new / newly released / the new version。
 *   · 腿② SUPERIOR 无依据优越断言（三类任中一类）：
 *     a 比较优越（肯定/一定/势必/注定 + 比老/比旧/比上一代/比之前的
 *         + 好/强/先进/靠谱/稳定）；
 *     b 绝对优越（肯定/一定 + 更先进/更好用/更靠谱/修复了所有问题/
 *         碾压/吊打/完胜）；
 *     c 贬旧劝告（老方法早就过时了/旧方案可以扔了/老框架该淘汰了/
 *         买新不买旧/别用旧的了 + 用新/买新/换新 或直接祈使）。
 *   · 单有新潮不判：「这是最新的框架，但我们还没有实测数据」——
 *     那是正常的事实陈述，优越断言缺位。
 *   · 单有优越不判：「这个方案肯定好」——无新潮腿，归 confidence。
 *
 * 为什么取 VERIFY 级：单句可能是正常的技术选型讨论（新框架确实解决
 * 了旧框架的特定问题）、产品发布转述、文学对白，rewrite/block 会误伤
 * （与 r672-r698 全部评价/胁迫族同口径）。verify 的含义是「这段以新
 * 代旧的推论需要复核依据」——调用方应要求给出实测数据再采信。
 *
 * 明确不判的（豁免——这些是正当的陈述、提问与概念分析）：
 *   · 提问句式：如何选择/怎么选/哪个更好/该不该升级（疑问是咨询不是
 *     断言，「最新的框架一定比老框架好吗？」是求知）；
 *   · 依据在场：实测/数据/基准/发布说明/changelog/benchmark/论文/
 *     测试报告（有出处的版本对比是引用不是盲信）；
 *   · 平衡比较：各有优势/各有利弊/按需选择/看场景（双向陈述不是
 *     单边盲信）；
 *   · 评析这套话术本身（诉诸新潮是一种谬误/识别诉诸新潮）。
 */
'use strict';

// ─── 腿① NOVELTY 新潮标记（中文）──────────────────────────────
// 只认「新/近期」属性名词，不认质量词——质量断言在腿②。
const NOVELTY_ZH = new RegExp(
  '(?:最新|最近|全新|新一代|新版|新版本|新出的|新推出|新发布|刚发布|刚推出|刚上线|刚出来|今年才出|新框架|新模型|新系统|新方案|新技术|新方法|新算法|新工具|新款|新品|新功能|新特性|新架构|新设计|新硬件|新芯片|新手机|新电脑|新设备|新产品|新软件|新平台|新框架|新引擎|新引擎)' +
  '|(?:才|刚)(?:出来|发布|推出|上线|问世|上市)' +
  '|(?:今年|今年刚|今年才)(?:出|发布|推出|上市|问世)' +
  '|(?:最新|最近)(?:的|版|版)?(?:一|这)?(?:代|款|版|批|次|期)'
);

// 英文：latest / newest / just released / brand-new / newly released。
// 与中文腿对齐：只认新潮属性名词。
const NOVELTY_EN = new RegExp(
  "\\b(?:latest|newest|newest\\s+version|just\\s+released|just\\s+came\\s+out|just\\s+launched|just\\s+announced" +
  "|brand[\\s-]?new|newly\\s+released|newly\\s+launched|the\\s+new\\s+(?:version|model|framework|release|generation)" +
  "|freshly\\s+released|newly\\s+announced" +
  "|\\bnew\\s+(?:technology|method|approach|framework|model|system|version|tool|algorithm|solution|design|architecture|process|pipeline)\\b" +
  "|\\bthe\\s+new\\s+one\\b)\\b",
  'i'
);

// ─── 腿② SUPERIOR 无依据优越断言（三类）────────────────────────
// 中文三支：a 比较优越 / b 绝对优越 / c 贬旧劝告。
const SUPERIOR_ZH = new RegExp(
  // a 比较优越（肯定/一定/势必 + 比老/比旧/比上一代 + 好/强/先进/靠谱）
  '(?:肯定|一定|势必|注定|必定|必然|自然|绝对)(?:比|较)' +
  '|(?:肯定|一定|势必|注定|必定)(?:会)?比(?:老|旧|上一代|之前的|以前的|原先的)?[^。]{0,8}(?:好|强|先进|靠谱|稳定|快|省)' +
  // a2 比较词前置形（比老框架好/比上一代强——无情态动词的比较结论）
  '|比(?:老|旧|上一代|之前的|以前的|原先的|过去)[^。]{0,8}(?:好|强|先进|靠谱|稳定)' +
  // b 绝对优越（肯定/一定 + 更先进/更好用/修复了所有问题/碾压/完胜）
  '|(?:肯定|一定|势必|注定|必定|必然|绝对|百分百)(?:更)?(?:先进|好用|靠谱|管用|有效|强大|优秀|出色|完美)' +
  '|(?:肯定|一定|绝对)(?:修复|解决)了(?:所有|全部|一切)(?:问题|bug|缺陷|漏洞)' +
  '|(?:碾压|吊打|完胜|秒杀|甩开|超越)(?:老|旧|上一代|之前)' +
  // b2 颠覆旧认知（肯定推翻/改写了以前的结论/共识——新潮推翻型）
  '|(?:肯定|一定|势必|注定|必定|必然|绝对)(?:会)?(?:推翻|颠覆|改写|否定|打破)了?(?:以前|过去|以往|先前|原来|旧)(?:的)?(?:结论|认知|认识|共识|观念|做法|经验|理论)' +
  // c 贬旧劝告（老方法早就过时了/旧方案可以扔了/买新不买旧 + 用新/买新）
  '|(?:老|旧)(?:方法|方案|技术|框架|系统|版本|设备|工具|做法|思路|观念)[^。]{0,10}(?:早就|已经|早)(?:过时|淘汰|落伍|落后|不行了|没用了|该扔|该换|该丢)' +
  '|(?:旧|老)(?:方案|方法|技术|框架|系统|版本|设备|工具)[^。]{0,6}(?:可以|该|应该|得)(?:扔|丢|弃|淘汰|换掉|替换|放弃)' +
  '|(?:买新不买旧|用新不用旧|喜新厌旧)[^。]{0,6}(?:新款|新品|新的)?(?:肯定|一定|准)?' +
  '|(?:直接|赶紧|赶快|马上)(?:用新|买新|换新|上新|升级到新)' +
  '|(?:别|不要|不用)(?:再)?(?:用|买|守)(?:旧|老)的'
);

// 英文：definitely better than the old one / must be stronger /
// the old methods are obsolete / just use the new one。
// 三支与中文对齐：a comparative / b absolute / c obsolete-dismissal。
const SUPERIOR_EN = new RegExp(
  // a comparative（definitely/must + better/stronger/advanced + than the old）
  "\\b(?:definitely|surely|certainly|undoubtedly|obviously|clearly|must\\s+be|is\\s+guaranteed\\s+to\\s+be)\\s+" +
  "(?:better|stronger|faster|more\\s+advanced|more\\s+reliable|more\\s+stable|superior)\\s+than\\s+(?:the\\s+)?(?:old|previous|last|earlier|legacy)\\b" +
  // a2 comparative without modal（better than the old one——直接比较结论）
  "|\\b(?:better|stronger|faster|more\\s+advanced|more\\s+reliable)\\s+than\\s+(?:the\\s+)?(?:old|previous|last|earlier|legacy)\\s+(?:one|version|model|framework|system)\\b" +
  // b absolute（definitely fixes all problems / outperforms / crushes）
  "|\\b(?:definitely|certainly|surely|absolutely|guaranteed\\s+to)\\s+(?:fix|fixes|solve|solves|resolve)[^.]{0,20}?(?:all|every)\\s+(?:problem|issue|bug|flaw)" +
  // b2 无情态宣告形（fixes all the problems——无 definitely 也构成无依据绝对优越）
  "|\\b(?:fixes?|solves?|resolves?|addresses?)\\s+(?:all|every)\\s+(?:the\\s+)?(?:problems?|issues?|bugs?|flaws?)\\b" +
  "|\\b(?:outperforms|dominates|obsoletes|replaces)\\s+(?:the\\s+)?(?:old|previous|legacy|entire)\\b" +
  // c obsolete-dismissal（the old methods are obsolete / throw out the old / just use the new）
  "|\\b(?:the\\s+)?(?:old|previous|legacy|outdated)\\s+(?:methods?|approach(?:es)?|ways?|solutions?|system|framework|version)\\s+" +
  "(?:is|are)\\s+(?:obsolete|dead|done\\s+for|no\\s+longer|outdated)\\b" +
  "|\\b(?:throw|toss|discard|drop|abandon|get\\s+rid\\s+of)\\s+(?:out\\s+)?(?:the\\s+)?(?:old|previous|legacy)\\b" +
  "|\\bjust\\s+(?:use|buy|get|switch\\s+to|adopt)\\s+(?:the\\s+)?(?:new|latest|newest)\\b" +
  "|\\b(?:buy|get)\\s+(?:the\\s+)?(?:new|newest|latest)\\s+(?:one|version|model)\\b",
  'i'
);

// ─── 豁免一：提问句式（咨询选型是求知不是断言）────────────────
const QUESTION_EXEMPT = /(?:如何|怎么|怎样|该不该|要不要|哪个|哪种|哪款|是不是|能不能|值不值得|凭什么)(?:选择|挑选|选型|选|升级|更新|换代|对比|比较)?[^。]{0,12}(?:框架|模型|系统|方案|技术|版本|工具|设备|新品|新款|新产品|软件)?[^。]{0,6}[?？]|(?:how|which|what|should\\s+i|is\\s+it|does\\s+the)[^.]{0,40}[?]/i;

// ─── 豁免二：依据在场（实测/数据/发布说明——有出处的版本对比是引用）──
const EVIDENCE_EXEMPT = /(?:实测|测试数据|测试报告|基准测试|基准数据|benchmark|跑分|压测|数据表明|数据显示|发布说明|更新日志|changelog|release\\s+notes|论文|研究报告|同行评审|peer[\\s-]?review|临床|审计报告|统计(?:数据|结果)|实验(?:数据|结果)|对照组|样本量)/i;

// ─── 豁免三：平衡比较（各有优势/按需选择——双向陈述不是单边盲信）────
const BALANCE_EXEMPT = /(?:各有优势|各有利弊|各有千秋|各有长短|势均力敌|不相上下|按需选择|按场景|看场景|视场景|取决于|分情况|具体问题具体分析|没有绝对|不能一概而论|both\\s+have|each\\s+has\\s+its|it\\s+depends|trade[\\s-]?off)/i;

// ─── 豁免四：评析这套话术本身 / 概念分析 ─────────────────────
const META_EXEMPT_ZH = /(?:这|那就是|这就是|这正是|那正是一种|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:诉诸新潮|喜新厌旧|盲目追新|唯新是图|新潮谬误|appeal\\s*to\\s*novelty)|(?:诉诸新潮|喜新厌旧|盲目追新|唯新是图|新潮谬误)(?:是|属于|是一种|正是)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误)/;
const META_EXEMPT_EN = /\bappeal\s+to\s+novelty\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToNovelty(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const NOVELTY_ZH_ = R.NOVELTY_ZH || NOVELTY_ZH;
  const NOVELTY_EN_ = R.NOVELTY_EN || NOVELTY_EN;
  const SUPERIOR_ZH_ = R.SUPERIOR_ZH || SUPERIOR_ZH;
  const SUPERIOR_EN_ = R.SUPERIOR_EN || SUPERIOR_EN;
  const QUESTION_EXEMPT_ = R.QUESTION_EXEMPT || QUESTION_EXEMPT;
  const EVIDENCE_EXEMPT_ = R.EVIDENCE_EXEMPT || EVIDENCE_EXEMPT;
  const BALANCE_EXEMPT_ = R.BALANCE_EXEMPT || BALANCE_EXEMPT;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 提问句式：如何选择/怎么选——求知不是断言
  if (QUESTION_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 依据在场：有实测/发布说明的版本对比是引用不是盲信
  if (EVIDENCE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 平衡比较：各有优势/按需选择——双向陈述不是单边盲信
  if (BALANCE_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const noveltyZh = NOVELTY_ZH_.test(text);
  const noveltyEn = NOVELTY_EN_.test(text);
  const superiorZh = SUPERIOR_ZH_.test(text);
  const superiorEn = SUPERIOR_EN_.test(text);

  // 双腿共现：新潮标记 × 无依据优越断言（缺一不判）
  if ((noveltyZh || noveltyEn) && (superiorZh || superiorEn)) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: isZh ? '诉诸新潮×新潮标记×无依据优越(zh)' : 'appeal to novelty×novelty×unfounded superiority(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkAppealToNovelty,
  __internals: () => ({ NOVELTY_ZH, NOVELTY_EN, SUPERIOR_ZH, SUPERIOR_EN, QUESTION_EXEMPT, EVIDENCE_EXEMPT, BALANCE_EXEMPT, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
