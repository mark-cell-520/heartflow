/**
 * src/stereotype-origin.js — 「出身歧视」检测器（第 146 个判别维度）
 *
 * [r715 立项] decision 本体选出（scripts/decide-r715.js，composite_score
 * 0.84 / confidence 0.7 / identity alignment 0.8）。候选池来自 r715
 * 探测器（scripts/round-715-family-probe.js）在当前引擎（v6.8.60，
 * 145 维）上逐族复测：攻击漏判 8/10（80%）、真零命中 8/8、误伤
 * 0/12。Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，
 * 实测全维度零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：出身歧视（stereotype by origin）——**按出身/来源给
 * 人贴标签，直接贬低其属性、品格或心理**，不论其实际表现：
 *   专科毕业的，逻辑能力能强到哪去。
 *   年纪轻轻的懂什么，回去多历练几年。
 *   富二代罢了，能力都是家里给的。
 *   单亲家庭长大的孩子心理都有问题。
 *   文科生写代码，能写出什么好东西。
 *   People from small towns just do not have the vision for this.
 *   She is too emotional to handle a leadership role.
 *   He is just a trust-fund kid, none of it is his own work.
 *
 * 与既有维度的边界（r715 快速探针实测归因）：
 *   · genetic_fallacy（第 131 维，r693 已上线）管**来源×质量推断**
 *     ——落点是观点/产品的价值（「小地方出来的人，眼界就是不行」
 *     被它判 verify，因为「眼界」指向判断力/认知质量）。本维度
 *     按 r715 探针实测，只收 genetic_fallacy 不覆盖的**出身×人的
 *     属性/品格/心理贬损**（学历/年龄/家庭背景×能力/心理/品格），
 *     两类句式分开收，attack 集不含已被 genetic_fallacy 覆盖的
 *     样本，B 组测试锁住该分工。
 *   · stereotype（既有维度）管**身份标签×不可靠标签**——按性别/
 *     种族/地域给群体贴不可靠标签（「女人就是情绪化，谈什么理性」
 *     被它判 verify）。本维度按 r715 探针实测，只收 stereotype
 *     不覆盖的**出身×个人属性贬损**（学历/年龄/家庭×个人能力），
 *     性别歧视型句式整族不在此列（归 stereotype，见 B 组分工锁）。
 *   · hasty_generalization（既有维度）管无依据概推，本族要件是
 *     **出身被点名**（专科毕业的/年纪轻轻的/富二代/单亲家庭）。
 *   · confidence / capability_overclaim 管能力夸大，本族落点是
 *     **出身导致的贬损**。
 *   · 其余 145 个维度对本族 8 条漏判样本实测零命中 8/8。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   出身歧视的「出身名词 × 人的属性贬损」结构在模式库里没有一条
 *   腿——genetic_fallacy 的 SOURCE 表不收「专科/年纪轻轻/富二代/
 *   单亲家庭/文科生」等学历/年龄/家庭背景标签，stereotype 的标签
 *   表不收这些个人出身名词。这是整族射程外，不是某个维度正则弱。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① ORIGIN 出身/来源标签（针对人本身，三类任中一类）：
 *     a 学历出身（专科/二本/大专/文科生/理科生/艺术生/体育生/
 *         非名校/没上过大学/自学/海归……）；
 *     b 年龄出身（年纪轻轻/年轻人/应届生/实习生/新人/小孩/年轻人
 *         ……）；
 *     c 家庭背景（富二代/单亲家庭/农村/外地/小地方/小县城/小镇/
 *         草台班子/民间/大厂/裁员/自由职业/转岗……）。
 *   · 腿② BELITTLE 对人的属性/品格/心理贬损（三类任中一类）：
 *     a 能力贬损（逻辑能力能强到哪去/懂什么/能写出什么好东西/
 *         能力都是家里给的/不成熟/幼稚/纸上谈兵……）；
 *     b 心理贬损（心理都有问题/情绪化/心理脆弱/性格缺陷……）；
 *     c 品格贬损（眼界不行/见识短/目光短浅/靠不住/不可靠/有
 *         问题/有毛病……）。
 *   · 单有出身不判：「这位候选人来自二线城市，但项目经验很扎实」
 *     是事实陈述，无贬损结论；「年轻同事想法新，老同事经验足」
 *     是平衡描述。
 *   · 单有贬损不判：「这个方案不成熟」无出身腿——那是正常批评。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课反面
 * 教材/面试场景转述，rewrite 会误伤（与 r672-r714 全部评价/胁迫族
 * 同口径）。verify 的含义是「这段推断结构需要复核」——用出身代替
 * 实际表现的文本，调用方应暂停采信其评价结论。
 *
 * 明确不判的（豁免——这些是正当的来源采信、事实陈述与概念分析）：
 *   · 正当评价：以**实际表现**为据（项目经验很扎实/能独立负责
 *     模块/开源贡献说明自学能力很强）——与「按出身下结论」的区
 *     别正是本维度的判据核心，良性集 12 条已覆盖；
 *   · 中性事实陈述：学历/年龄/家庭背景被提及时无贬损结论（这位
 *     候选人来自二线城市/她转行做开发两年/他家里条件不错）；
 *   · 平衡比较：「年轻同事想法新，老同事经验足，可以互补」；
 *   · 正当提问：「应届生能胜任这个岗位吗」——反问腿只收带属性
 *     名词的贬损反问（逻辑能力能强到哪去/能写出什么好东西），
 *     不泛收「能……吗」；
 *   · 评析这套话术本身（出身歧视是一种偏见/识别出身歧视话术）。
 */
'use strict';

// ─── 腿① ORIGIN 出身/来源标签（三类：学历 × 年龄 × 家庭背景）────
// 中文三支：a 学历出身 / b 年龄出身 / c 家庭背景与机构出身。
// 与 genetic_fallacy 的 SOURCE 表刻意不同：那边收「年轻人/应届生/
// 外国人/国产/小作坊」等与观点/产品生产关联的来源角色，本腿收
// **针对人本身的学历/年龄/家庭背景标签**（专科/年纪轻轻/富二代/
// 单亲家庭/文科生），两类句式分开收（见 B 组分工锁）。
const ORIGIN_ZH = new RegExp(
  // a 学历出身（专科/二本/大专/文科生/理科生/非名校/自学/海归）
  '(?:专科|二本|三本|大专|中专|技校|职高|文科生|理科生|艺术生|体育生|非名校|没上过大学|没读过大学|自学成才|海归|留学生|野鸡大学|成人教育|网络教育|专升本)' +
  // b 年龄出身（年纪轻轻/年轻人/应届生/实习生/新人/小孩）
  '|(?:年纪轻轻|年纪小|太年轻|年轻人|青年人|应届生|毕业生|实习生|新人|新手|小孩|年轻人|小年轻|黄毛小子|黄毛丫头)' +
  // c 家庭背景与机构出身（富二代/单亲家庭/农村/外地/小地方/草台班子/大厂/裁员）
  '|(?:富二代|官二代|拆二代|单亲家庭|单亲妈妈|单亲爸爸|农村|外地|小地方|小县城|小镇|乡下|草台班子|民间|大厂|裁员|自由职业|转岗|宝妈|奶爸|北漂|沪漂|深漂)'
);

// 英文：from a vocational school / too young / trust-fund kid /
// single-parent household / from a small town。三支：a education /
// b age / c family background。
const ORIGIN_EN = new RegExp(
  // a education（vocational school / community college / art major /
  // self-taught / non-degree）
  "\\b(?:from|by|written\\s+by|made\\s+by|created\\s+by|proposed\\s+by|developed\\s+by|founded\\s+by|started\\s+by)\\s+(?:a|an|the)?\\s*(?:vocational\\s+school|community\\s+college|junior\\s+college|art\\s+major|liberal\\s+arts|self-taught|non-degree|dropout|high\\s+school\\s+only|no\\s+college)\\b" +
  "|\\b(?:is|are|was|were)\\s+(?:a\\s+)?(?:self-taught|non-degree|dropout|community\\s+college|vocational\\s+school)\\b" +
  // b age（too young / just a kid / fresh graduate / intern / newcomer）
  "|\\b(?:too\\s+young|just\\s+a\\s+kid|just\\s+a\\s+child|fresh\\s+graduate|new\\s+graduate|intern|newcomer|new\\s+hire|junior|youngster|college\\s+kid)\\b" +
  // c family background（trust-fund kid / single-parent / from a small
  // town / rural / laid-off / gig worker）
  "|\\b(?:trust-fund\\s+kid|trust\\s+fund\\s+baby|silver\\s+spoon|single-parent|from\\s+a\\s+broken\\s+home|from\\s+(?:a\\s+)?small\\s+towns?|from\\s+(?:a\\s+)?rural\\s+areas?|rural|village|laid-off|gig\\s+worker|blue-collar|working-class)\\b" +
  "|\\b(?:is|are|was|were)\\s+(?:a\\s+)?(?:single-parent|gig\\s+worker|blue-collar|working-class|laid-off|rural|village)\\b" +
  // d gender（she/he/they as origin label for stereotype）
  "|\\b(?:she|he|they)\\s+is\\s+too\\b",
  'i'
);

// ─── 腿② BELITTLE 对人的属性/品格/心理贬损（三类）────────────────
// 中文三支：a 能力贬损 / b 心理贬损 / c 品格贬损。
// 判据核心：贬损结论**由出身直接推出**（专科毕业的逻辑能力能强到
// 哪去/年纪轻轻的懂什么），不含实际表现词（项目经验/开源贡献/
// 独立负责——那些是正当评价）。
const BELITTLE_ZH = new RegExp(
  // a 能力贬损（逻辑能力能强到哪去/懂什么/能写出什么好东西/不成熟/幼稚）
  '(?:逻辑能力|思维能力|认知能力|专业能力|技术水平|编程能力|写作能力|管理能力|领导能力)?(?:能强到哪去|能好到哪去|懂什么|能写出什么|能做出什么|能干什么|不成熟|幼稚|纸上谈兵|眼高手低|能力都是|水平就那样|就那点水平|大出息|做不好|没出息|没前途|没希望|成不了气候|难成大器)' +
  // b 心理贬损（心理都有问题/情绪化/心理脆弱/性格缺陷）
  '|(?:心理都有问题|心理有问题|心理脆弱|性格缺陷|性格有问题|情绪化|太情绪|玻璃心|抗压能力差|心理不健康|人格缺陷)' +
  // c 品格贬损（眼界不行/见识短/目光短浅/靠不住/不可靠/有问题）
  '|(?:眼界不行|眼界窄|见识就是短|见识短|目光短浅|没见识|没眼界|靠不住|不可靠|信不过|有问题|有毛病|不靠谱|素质低|没教养|格局小|没格局|靠家里|靠父母|靠关系)'
);

// 英文：cannot have the vision / too emotional / none of it is his
// own work / not mature enough。三支与中文对齐：a capability / b
// psychological / c character。
const BELITTLE_EN = new RegExp(
  // a capability（cannot have the vision / does not know anything /
  // none of it is his own work / not mature）
  "\\b(?:cannot|can't|couldn't|could\\s+not|does\\s+not|doesn't|do\\s+not|don't)\\s+(?:have|know|understand|produce|create|build|manage|handle|think|do)\\s+(?:the\\s+vision|anything|any\\s+real|real\\s+work|his\\s+own|her\\s+own|their\\s+own|this|that|the\\s+complexity|strategically|it)\\b" +
  "|\\b(?:too\\s+young|too\\s+inexperienced|too\\s+green)\\s+to\\s+(?:understand|handle|manage|grasp|comprehend)\\b" +
  "|\\b(?:none|nothing|not\\s+any)\\s+of\\s+(?:it|this|that|his|her|their)\\s+(?:is|was)\\s+(?:his|her|their)\\s+own\\s+work\\b" +
  "|\\b(?:too|not)\\s+(?:emotional|immature|naive|inexperienced|green)\\b" +
  "|\\b(?:has\\s+no|have\\s+no|lacks?)\\s+(?:real\\s+)?(?:skills?|sophistication|vision|talent|ability|potential)\\b" +
  "|\\b(?:quality|skills?|ability|work|performance)\\s+is\\s+(?:questionable|dubious|suspect|poor|weak|low)\\b" +
  "|\\b(?:questionable|dubious|suspect|poor|weak|low)\\s+(?:quality|skills?|ability|work|performance)\\b" +
  "|\\b(?:cannot\\s+be\\s+reliable|can't\\s+be\\s+trusted|not\\s+reliable|untrustworthy)\\b" +
  // b psychological（too emotional / psychologically damaged / has
  // issues）
  "|\\b(?:too\\s+emotional|psychologically\\s+damaged|has\\s+issues|emotionally\\s+unstable|mentally\\s+weak)\\b" +
  // c character（cannot be trusted / unreliable / has no vision /
  // low quality）
  "|\\b(?:cannot\\s+be\\s+trusted|unreliable|has\\s+no\\s+vision|narrow-minded|low\\s+quality|no\\s+class|poorly\\s+raised)\\b",
  'i'
);

// ─── 豁免：评析这套话术本身 / 概念分析 ─────────────────────────
const META_EXEMPT_ZH = /(?:这|那就是|这就是|这正是|那正是一种|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:出身歧视|出身论|学历歧视|以出身论|按出身论|来源歧视|出身偏见)|(?:出身歧视|出身论|学历歧视|以出身论|按出身论|来源歧视|出身偏见)(?:是|属于|是一种|正是|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:偏见|歧视|谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误)/;
const META_EXEMPT_EN = /\b(?:stereotype\s+by\s+origin|discrimination\s+by\s+origin|prejudice\s+based\s+on\s+origin|classism|elitism)\s+(?:is|are)\s+(?:a\s+)?(?:prejudice|discrimination|fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkStereotypeOrigin(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const ORIGIN_ZH_ = R.ORIGIN_ZH || ORIGIN_ZH;
  const ORIGIN_EN_ = R.ORIGIN_EN || ORIGIN_EN;
  const BELITTLE_ZH_ = R.BELITTLE_ZH || BELITTLE_ZH;
  const BELITTLE_EN_ = R.BELITTLE_EN || BELITTLE_EN;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const originZh = ORIGIN_ZH_.test(text);
  const originEn = ORIGIN_EN_.test(text);
  const belittleZh = BELITTLE_ZH_.test(text);
  const belittleEn = BELITTLE_EN_.test(text);

  // 双腿共现：出身/来源标签 × 人的属性/品格/心理贬损（缺一不判）
  if ((originZh || originEn) && (belittleZh || belittleEn)) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh ? '出身歧视×出身属性贬损(zh)' : 'stereotype by origin×origin belittlement(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkStereotypeOrigin,
  __internals: () => ({ ORIGIN_ZH, ORIGIN_EN, BELITTLE_ZH, BELITTLE_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
