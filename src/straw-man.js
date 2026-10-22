/**
 * src/straw-man.js — 「稻草人谬误」检测器（第 138 个判别维度）
 *
 * [r705 立项] decision 本体在 137 维引擎上选出（/tmp/decide-run-r705.js 读
 * /tmp/decide-opts-r705.json，composite_score 0.89 / confidence 0.85 /
 * identity alignment 100%，无拒选）。候选题池来自 r700 探测器落盘
 * /tmp/hf-scout-700.txt；本轮 /tmp/r705-preprobe.js 复量并做 FP 归因：
 * 攻击 10 条漏判 7/10、真零命中 7/7、良性误伤 1/12（存量 contradiction
 * 「这句的意思是不是指接口会变慢」，归因后本族自身存量误伤 0）。
 * 判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算
 * 漏判。Phase 1.5 同律复核：7 条真零命中样本逐条跑 discriminate() 实测
 * 全维度零命中——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「稻草人谬误」（straw man）——把对方的立场**转述成一个
 * 极端化/歪曲的版本**，再对这个假靶子反驳或贬损，从不回应对方真实
 * 的观点：
 *   你无非就是想说不用加班，那公司业绩谁来管。
 *   你意思就是让我别努力了，躺平算了。
 *   你不就是想说不花钱就能解决问题，太天真了。
 *   你这么说无非是想否定我们团队所有的努力。
 *   你的意思是我以前做的都是错的，只有你对。
 *   你不就是嫌我管得多，那以后我什么都不管了。
 *   你不就是想说领导决策都有问题吗。
 *   So you're just saying we shouldn't work overtime, then who's going
 *   to manage the numbers?
 *   You mean I should just stop trying and give up altogether.
 *   You're basically saying we can solve it without money. How naive.
 *   Aren't you just saying the leadership's decisions are all flawed?
 *
 * 与既有维度的边界（r705 复量归因）：
 *   · fallacies 维度的 FALLACY_PATTERNS 既有 3 条 straw_man 正则只认
 *     窄形转述（「你的意思就是说…但这显然」「按你的逻辑…那岂不是」
 *     「你以为…其实根本不是」；EN：so what you're saying is…that's
 *     ridiculous），本模块覆盖全族（强归谬形/弱转述形 × 反驳尾巴/
 *     绝对化负面归述）且带豁免层。
 *   · bad_faith 的 strawman_impose/forced/attack 管**元话语描述**
 *     （「把对方没说过的话安到他头上」「put words in their mouth」），
 *     本族管**实际说出的稻草人句式**，两者不重叠。
 *   · contradiction 管跨句自相矛盾，本族不管矛盾只管**转述歪曲 +
 *     反驳**这个行为本身。
 *   · 其余 137 个维度对本族 7 条真零命中样本实测全部零命中。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「归谬转述标记 × 反驳尾巴」这一双腿结构在模式库里没有任何一条
 *   腿——FALLACY_PATTERNS 的 straw_man 只认带「但这显然/那岂不是」
 *   显式转折的窄形，而口语里绝大多数稻草人是「你无非就是想说 X，
 *   那 Y 谁来管」这种**无显式转折词**的形态，整族射程外。
 *
 * 判据（两条路由，任一命中即判定）：
 *   · 路由① 强归谬形 ATTRIB_STRONG ×（反驳尾巴 REFUTE 或绝对化
 *     负面归述 ABSOLUTE_NEG）共现；
 *   · 路由② 弱转述形 ATTRIB_WEAK × 反驳尾巴 REFUTE 共现——
 *     「你的意思是…」单独出现是良性确认问句（「你的意思是需要先跑
 *     测试再上线吗」），必须有反驳尾巴才判；
 *   · 绝对化负面归述只与强归谬形配对——「你的意思是所有测试都要
 *     重跑吗」这种带绝对词的良性确认问句不判（攻击形「你不就是
 *     想说领导决策都有问题吗」靠强标记 × 都有问题命中）。
 *
 * 为什么取 VERIFY 级：单句可能是正常的强烈反驳（「按你的逻辑，这
 * 个方案第三步推不出来」是具体推演质疑）、文学对白引述、谬误
 * 案例分析复盘，rewrite/block 会误伤（与 r672-r704 全部评价/胁迫
 * 族同口径）。verify 的含义是「这段把对方立场歪曲后反驳的表述需要
 * 先确认对方真实立场」——调用方应要求贴出原话再讨论。
 *
 * 明确不判的（豁免——这些是正当的确认、澄清与概念分析）：
 *   · 良性确认问句：弱转述形 + 无反驳尾巴（「你的意思是需要先跑
 *     测试再上线吗」「这句的意思是不是指接口会变慢」「Do you mean
 *     we should run the tests first?」）；
 *   · 评析这套话术本身（稻草人谬误是常见的逻辑谬误/This is a
 *     straw man fallacy.）（META_EXEMPT）；
 *   · 无转述标记的反驳/批评（「我不同意这个观点，理由是数据不
 *     支持」——直接反驳不是稻草人，稻草人的定义性特征是**先歪曲
 *     转述**）。
 */
'use strict';

// ─── 腿① ATTRIB 转述标记（把对方立场归述，中文）────────────────────
// 强归谬形：带「无非/就是/不就是/按你的逻辑」这类归谬强调——说话者
// 不是在确认理解，而是在断言「说到底你就是这个意思」。
const ATTRIB_STRONG_ZH = new RegExp(
  // a 你(们) + [强调词] + 就是/不就是 + 想/要 + 言说动词
  '(?:你|你们)(?:们)?(?:无非|不过|说到底|根本上|左右)?(?:就是|不就是|是)?(?:想|要)?(?:说|表达|认为|承认|证明|怪|嫌|否定)' +
  // b 你这么/这样说 + [无非] + 是想/就是想
  '|你(?:们)?(?:这么|这样)(?:说|讲)(?:无非)?(?:是想|就是想|难道是想)' +
  // c 按你的意思/逻辑/说法/这套理论
  '|按你的(?:意思|逻辑|说法|这套(?:说法|理论|逻辑|思路))' +
  // d 照你这么说/照你的逻辑
  '|照你(?:这么|的)(?:说|逻辑|意思|讲|理论)' +
  // e 你的逻辑就是/岂不是/看来
  '|你的逻辑(?:就是|岂不是|看来|来讲)'
);
// 弱转述形：中性转述确认——单独出现是良性澄清问句。
const ATTRIB_WEAK_ZH = new RegExp(
  '(?:你|你们)(?:的)?意思(?:是|就是|是说)?' +
  '|你想说的是' +
  '|你的说法(?:是|就是)'
);

// 英文腿与中文对齐：强归谬形（just saying / so you're saying / by your
// logic）与弱转述形（what you mean is / you mean）两支。
const ATTRIB_STRONG_EN = new RegExp(
  // a you're just saying / you're basically saying / aren't you just saying
  "\\byou(?:'re| are)? (?:just |only |basically |simply )?(?:saying|arguing|claiming|implying)\\b" +
  "|\\baren'?t you (?:just |only |basically )?(?:saying|arguing|claiming)\\b" +
  // b so you're saying / so what you're saying is
  "|\\bso you(?:'re| are) saying\\b" +
  "|\\bso what you(?:'re| are) saying is\\b" +
  // c by your logic / according to your logic / so by that logic
  "|\\b(?:so )?by (?:your|that) logic\\b" +
  // d you're just arguing that
  "|\\byou(?:'re| are) just arguing\\b",
  'i'
);
const ATTRIB_WEAK_EN = new RegExp(
  "\\bwhat you mean is\\b" +
  "|\\byou mean (?:that |we should |i )\\b" +
  "|\\byou(?:'re| are) implying (?:that )?\\b",
  'i'
);

// ─── 腿② REFUTE 反驳/贬损尾巴（中文）────────────────────────────────
const REFUTE_ZH = new RegExp(
  // a 反问/威胁反驳：那…谁来管/凭什么/岂不是/干脆/什么都不…
  '(?:那|这样的话|这样下去|照这样|再这样)[^。]{0,16}(?:谁来|凭什么|怎么说|怎么算|岂不是|不如|干脆|什么都不|都不|也别|拉倒|你负责|谁负责|你担得起|负得了责|担待不起)' +
  // a2 无那前缀形：我们干脆X/不如X
  '|(?:我们|大家|大伙|咱们)?(?:干脆|不如)[^。]{0,14}(?:算了|得了|直接|别|不)' +
  // b 贬损定性：太天真了/太幼稚/想得美
  '|太(?:天真|幼稚|简单|想当然|片面)了?' +
  '|想得(?:太|倒也)?(?:美|简单|天真|容易)' +
  // c 反诘对立：只有你对/就你对/你最懂
  '|(?:只有你|就你)(?:对|行|正确|靠谱|厉害|懂|高明)' +
  '|(?:你最懂|你最高明|全对都在你|道理都在你)' +
  // d 放弃贬损：躺平算了/摆烂/破罐子破摔
  '|(?:躺平|摆烂|破罐子破摔)(?:算了|去吧|呗)?'
);
// 英文反驳尾巴：who's going to / how naive / only you are right /
// give up altogether 四支与中文对齐。
const REFUTE_EN = new RegExp(
  // a 反问/威胁：then who's going to / might as well / so I'll just
  "\\b(?:so |then )?who(?:'s| is)? going to\\b" +
  "|\\bmight as well (?:just )?\\b" +
  "|\\bso i(?:'ll| will)? just\\b" +
  "|\\bfrom now on i(?:'ll| will)? just\\b" +
  "|\\bthen what(?:'s| is) the point\\b" +
  // b 贬损定性：how naive / that's so childish
  "|\\b(?:how|that'?s so|so) (?:naive|childish|simplistic|silly)\\b" +
  // c 反诘对立：only you are right / you're the only one
  "|\\bonly you(?:'re| are)? right\\b" +
  "|\\byou(?:'re| are) the only (?:one|right one)\\b" +
  // d 放弃贬损：give up altogether / lie down and quit
  "|\\b(?:give up (?:trying |altogether)|lie (?:down|flat) and (?:give up|quit))\\b",
  'i'
);

// ─── 腿②' ABSOLUTE_NEG 绝对化负面归述（只与强归谬形配对，中文）──────
// 转述内容里的极端化负面定性——稻草人把对方立场夸成「全都错/全盘
// 否定」。良性确认问句用弱转述形，不走这条路。
const ABSOLUTE_NEG_ZH = new RegExp(
  // a 都/全 + [是/有/要/会] + 负面定性词
  '(?:都|全|统统|从来|永远|一律)(?:是|有|要|会)?(?:错|不对|不行|成问题|有问题|假的|谎言|垃圾|一无是处)' +
  // b 所有/全部 + 付出类名词 + 否定/抹杀/白费
  '|(?:所有|全部|一切)(?:的)?(?:努力|付出|成果|决定|选择|判断|心血)(?:都)?(?:是|被)?(?:否定|抹杀|白费|作废|推翻|没用)' +
  // c 否定/抹杀/推翻 + 所有/全部
  '|(?:否定|抹杀|推翻|无视)[^。]{0,8}(?:所有|全部|一切|整个|整支|全组|全队|全员)' +
  // b2 名词在前形：付出/努力 + 都/全 + 白费/作废
  '|(?:付出|努力|心血|成果|投入)(?:全都|都|全)(?:白费|白干|作废|打了水漂|喂了狗|没用)' +
  // d 完全/根本 + 负面定性
  '|(?:完全|根本)(?:不可行|不对|错了|是错的|站不住|不成立|没道理)'
);
// 英文绝对化负面归述：everything I did was wrong / are all flawed /
// negate all our effort / completely unworkable。
const ABSOLUTE_NEG_EN = new RegExp(
  "\\b(?:everything|all) (?:i |you |we |they )?(?:did|do|done|said)\\b[^.]{0,24}\\b(?:was|is|were) (?:wrong|a mistake|mistaken|flawed|invalid)\\b" +
  "|\\b(?:are|is|were|was) all (?:wrong|flawed|broken|mistaken|invalid)\\b" +
  "|\\bnegat\\w+[^.]{0,30}\\ball (?:the|our|their|your)\\b" +
  "|\\bcompletely (?:unworkable|wrong|invalid|baseless|pointless)\\b",
  'i'
);

// ─── 豁免：评析这套话术本身 / 概念分析 ────────────────────────────
const META_EXEMPT_ZH = new RegExp(
  '(?:这|那就是|这就是|这正是|那正是|属于|属于一种|就是|犯了|这是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:稻草人|稻草人谬误|稻草人论证|稻草人谬说)' +
  '|(?:稻草人|稻草人谬误|稻草人论证|稻草人谬说)(?:是|属于|是一种|正是|这叫|那就是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误)'
);
const META_EXEMPT_EN = new RegExp(
  "\\bstraw ?man (?:fallacy|argument|technique|rhetoric)\\b" +
  "|\\b(?:is|are|called?|committing a|a) straw ?man\\b",
  'i'
);

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkStrawMan(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const STRONG_ZH_ = R.ATTRIB_STRONG_ZH || ATTRIB_STRONG_ZH;
  const WEAK_ZH_ = R.ATTRIB_WEAK_ZH || ATTRIB_WEAK_ZH;
  const STRONG_EN_ = R.ATTRIB_STRONG_EN || ATTRIB_STRONG_EN;
  const WEAK_EN_ = R.ATTRIB_WEAK_EN || ATTRIB_WEAK_EN;
  const REFUTE_ZH_ = R.REFUTE_ZH || REFUTE_ZH;
  const REFUTE_EN_ = R.REFUTE_EN || REFUTE_EN;
  const ABS_ZH_ = R.ABSOLUTE_NEG_ZH || ABSOLUTE_NEG_ZH;
  const ABS_EN_ = R.ABSOLUTE_NEG_EN || ABSOLUTE_NEG_EN;
  const META_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_ZH_.test(text) || META_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const strong = STRONG_ZH_.test(text) || STRONG_EN_.test(text);
  const weak = WEAK_ZH_.test(text) || WEAK_EN_.test(text);
  const refute = REFUTE_ZH_.test(text) || REFUTE_EN_.test(text);
  const absNeg = ABS_ZH_.test(text) || ABS_EN_.test(text);

  // 路由①：强归谬形 ×（反驳尾巴 或 绝对化负面归述）
  if (strong && (refute || absNeg)) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: /[\u4e00-\u9fff]/.test(text) ? '稻草人谬误×强归谬转述×反驳/绝对化归述(zh)' : 'straw man×dismissive-attribution×refutation/absolute-distortion(en)',
    };
  }
  // 路由②：弱转述形 × 反驳尾巴（无尾巴的弱转述是良性确认问句，不判）
  if (weak && refute) {
    return {
      hit: true,
      score: 0.55,
      count: 1,
      detail: /[\u4e00-\u9fff]/.test(text) ? '稻草人谬误×中性转述×反驳尾巴(zh)' : 'straw man×neutral-restatement×refutation(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkStrawMan,
  __internals: () => ({ ATTRIB_STRONG_ZH, ATTRIB_WEAK_ZH, ATTRIB_STRONG_EN, ATTRIB_WEAK_EN, REFUTE_ZH, REFUTE_EN, ABSOLUTE_NEG_ZH, ABSOLUTE_NEG_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
