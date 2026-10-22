/**
 * src/genetic-fallacy.js — 「起源谬误」检测器（第 131 个判别维度）
 *
 * [r693 立项] decision 本体在 130 维引擎上选出（/tmp/decide-run-693.js 读
 * /tmp/decide-opts-693.json，composite_score 0.94 / identity alignment
 * 100%，无拒选）。探测器 scripts/round-693-family-probe.js（落盘
 * /tmp/hf-scout-693.txt，判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判）：攻击 10 条漏判 10/10（100%）、
 * 真零命中 10/10、误伤 0/16（良性集按 r691 交接簿要求扩到 16 条，
 * 含审计报告/同行评审/官方统计/进口设备等正当来源采信）。
 * Phase 1.5 同律复核：10 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 10/10——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「起源谬误」（genetic fallacy，按来源出身判好坏）——观点/
 * 产品/人的**来源、出身、年代、身份**被点名，然后**由来源本身直接推出
 * 质量或价值结论**，完全不检验内容。这不是合理的资历参考，而是用
 * 「谁说的/哪来的/什么时候的」代替「说得对不对」：
 *   这个观点是年轻人提出的，肯定不成熟。
 *   外国人写的书，能适合中国国情吗。
 *   小作坊生产的，质量能好到哪去。
 *   他没上过名牌大学，观点不值得听。
 *   这理论是两百年前提出的，早就过时了。
 *   农村来的见识短，别听他的。
 *   大厂裁员出来的人，能力肯定有问题。
 *
 * 与既有维度的边界（r693 探测器实测归因）：
 *   · stereotype（既有维度）管**来源歧视性评价**——按性别/种族/地域
 *     给人或群体贴不可靠标签（「女人写的代码可靠性不如男人」已被它判
 *     verify）。本维度按 r691 交接簿要求只收**来源-质量推断**：来源是
 *     年龄/资历/年代/机构/产地，结论指向观点或产品本身的价值。两类
 *     句式分开收，attack 集不含性别歧视型样本，B 组测试锁住该分工。
 *   · appeal_to_tradition（既有维度）管**诉诸传统**（老祖宗传下来的
 *     就是好），本族是**以出身年代为由的贬损**（两百年前的所以过时），
 *     方向相反；两者都命中时取各自的 action，不冲突。
 *   · hasty_generalization（既有维度）管无依据概推，本族要件是
 *     **来源被点名**（谁提出的/哪生产的/什么年代的）。
 *   · confidence / capability_overclaim 管能力夸大，本族落点是
 *     **来源导致的贬损**。
 *   · 其余 130 个维度对本族 10 条漏判样本实测全部零命中。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   起源谬误的「来源名词 × 质量贬损」结构在模式库里没有任何一条腿——
 *   standard_shift 只认验收动词、stereotype 只认身份标签、sunk_cost
 *   只认沉没成本句式。这是整族射程外，不是某个维度正则弱。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① SOURCE 来源点名（三类任中一类）：
 *     a 人群身份（年轻人/应届生/实习生/没上过名牌大学/大厂裁员出来的/
 *         外国人/国产/小作坊/外行/业余/自学……）；
 *     b 年代时间（两百年前/上个世纪/古代/老祖宗/很早以前……）；
 *     c 地域机构出身（农村/外地/小作坊/草台班子……归入 a/c 合并表）。
 *   · 腿② QUALITY 质量贬损推断（三类任中一类）：
 *     a 直接贬损（不成熟/不可靠/不值得(听)/好不到哪去/过时/见识短/
 *         有问题/纸上谈兵……）；
 *     b 比较贬损（不如进口的成熟/比不上正规的/比不了名牌的……）；
 *     c 反问贬损（能适合……吗/能好到哪去/靠得住吗/凭什么……）。
 *   · 单有来源不判：「应届生经验少一些，但学习能力强」是事实陈述，
 *     无贬损结论；「进口设备和国产设备各有优势」是平衡比较。
 *   · 单有贬损不判：「这个方案不成熟」无来源腿——那是正常批评。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课反面
 * 教材/面试场景转述，rewrite 会误伤（与 r672-r692 全部评价/胁迫族
 * 同口径）。verify 的含义是「这段推断结构需要复核」——用出身代替
 * 内容的文本，调用方应暂停采信其评价结论。
 *
 * 明确不判的（豁免——这些是正当的来源采信、事实陈述与概念分析）：
 *   · 正当来源采信：以**验证过程**为据（经过审计/同行评审/临床验证/
 *     官方统计/检测认证）——与「按身份下结论」的区别正是本维度的判据
 *     核心，良性集 16 条已覆盖；
 *   · 中性事实陈述：年龄/年代/产地被提及时无贬损结论（这个理论有两
 *     百年历史，但至今仍是基础/老系统运行了十年，迁移前要评估风险）；
 *   · 正当提问：「应届生能胜任这个岗位吗」——反问腿只收带质量名词的
 *     贬损反问（能适合……吗/能好到哪去/靠得住吗），不泛收「能……吗」；
 *   · 平衡比较：「进口设备和国产设备各有优势，要按实测数据选型」；
 *   · 评析这套话术本身（起源谬误是一种逻辑谬误/识别起源谬误）。
 */
'use strict';

// ─── 腿① SOURCE 来源点名（三类合并：人群身份 × 年代时间 × 出身机构）──
// 中文三支：a 人群身份 / b 年代时间 / c 出身机构与产地。
// 与 stereotype 的标签表刻意不同：那边收性别/种族/年龄泛称，本腿收
// **与观点或产品生产直接关联的来源角色**（提出的/写的/生产的/创办的），
// 性别歧视型句式整族不在此列（归 stereotype，见 B 组分工锁）。
const SOURCE_ZH = new RegExp(
  // a 人群身份（提出者/生产者/者的身份）
  '(?:年轻人|青年人|应届生|毕业生|新人|实习生|新手|小孩|年轻人|女生|男生|女人|男人|业余人|外行人|外行|非专业|自学(?:成才)?(?:的|者)?|没上过|非名校|专科生|二本|大专生|海归|外国人|老外|转岗|自由职业|大厂|裁员|草台班子|民间)' +
  // c 出身机构与产地（农村/外地/小作坊/国产/进口）
  '|(?:农村|外地|小地方|小县城|小镇|乡镇企业|小作坊|小厂|山寨|国产|进口|舶来|土产)' +
  // b 年代时间（多少年前/上个世纪/古代/老祖宗）
  '|(?:\\d+\\s*年前|上百年来|几百年前|两百年前|几十年前|很早以前|远古|古代|古时候|老祖宗|祖传|明清|清代|明代|元代|唐宋|唐朝|宋朝|清朝|明朝|民国|上个世纪|上世纪|旧社会|当年|那一年代)'
);

// 英文：from a freshman / written by an intern / made by a small workshop /
// from two centuries ago。三支：a person-status / b era / c origin place。
const SOURCE_EN = new RegExp(
  // a person-status（freshman/intern/amateur/outsider/...）
  "\\b(?:from|by|written\\s+by|made\\s+by|created\\s+by|proposed\\s+by|developed\\s+by|founded\\s+by|started\\s+by)\\s+(?:a|an|the)?\\s*(?:freshman|sophomore|intern|newbie|beginner|rookie|amateur|outsider|foreigner|dropout|self-taught|non-professional|mom-and-pop|garage|newcomer|new arrival|recent graduate|junior|youngster|college kid|folk remedy|folk wisdom|homemade|backyard)\\b" +
  // c origin place（small workshop/small town/rural/village）
  "|\\b(?:from|made\\s+(?:in|by)|built\\s+by|manufactured\\s+by|produced\\s+(?:in|by)|out\\s+of)\\s+(?:a|an|the)?\\s*(?:small\\s+town|village|rural\\s+area|small\\s+workshop|garage|backwater)\\b" +
  // b era（two centuries ago / last century / ancient / ancestors）
  "|\\b(?:from|of|dat(?:es|ing|ed)\\s+back\\s+to)\\s+(?:\\d+\\s+(?:decades|centuries)\\s+ago|the\\s+last\\s+century|ancient\\s+times|our\\s+ancestors|the\\s+old\\s+days)\\b" +
  // d standalone 起源形容词（无介词：A folk remedy ...）
  "|\\b(?:folk|homemade|backyard|hand-me-down|old-fashioned|domestic|imported)\\b",
  'i'
);

// ─── 腿② QUALITY 质量贬损推断（三类）────────────────────────────
// 中文三支：a 直接贬损形容词 / b 比较贬损 / c 反问贬损。
// 判据核心：贬损结论**由来源直接推出**（肯定不成熟/早就过时了），
// 不含验证过程词（证伪/推翻/实验/数据/证据——那些是正当评估）。
const QUALITY_ZH = new RegExp(
  // a 直接贬损结论（不成熟/不可靠/不值得听/好不到哪去/过时/见识短/有问题）
  '(?:肯定|一定|绝对|注定|势必|想必|多半|恐怕|自然|根本|向来|一贯)?(?:不成熟|不可靠|不可信|不足为信|不足为凭|不值一提|不值得|好不到哪去|靠不住|没保障|没保证|有问题|有毛病|见识短|目光短浅|浅薄|幼稚|片面|偏激|过时|落伍|落后|被淘汰|不行|不可取|纸上谈兵|站不住脚)' +
  // b 比较贬损（不如进口的成熟/比不上正规的/比不了名牌的——宾语必须是来源类名词）
  '|(?:肯定|一定|绝对|多半)?(?:不如|比不上|比不了|差(?:得)?(?:太)?远|逊色(?:于)?)(?:进口|国产|名牌|正规|专业|大厂|国外|西方|古人|前人|人工|天然|化学|科班)' +
  // c 反问贬损（能适合……吗/能好到哪去/靠得住吗/凭什么——只收带质量名词的反问）
  '|(?:能|可|怎么可能|凭什么|怎么能|哪能)(?:适合|适应|好|可靠|信|成熟|专业|正规|拿得出手|上台面)[^。？?]{0,6}(?:吗|么|呢|哪去)?？?' +
  '|(?:靠得住|信得过|值得听|值得信|拿得出手|入流)(?:吗|么|呢)'
);

// 英文：cannot be worth much / is definitely outdated / inferior to / not even read。
// 三支与中文对齐：a negative adjectives / b comparative inferiority /
// c rhetorical dismissal。
const QUALITY_EN = new RegExp(
  // a negative adjectives（cannot be worth / is definitely outdated / unreliable）
  "\\b(?:cannot|can't|couldn't|could\\s+not|must\\s+not|would\\s+not|won't|will\\s+not|is\\s+not|are\\s+not|isn't|aren't)\\s+(?:be\\s+|really\\s+|truly\\s+)?(?:worth|mature|reliable|trustworthy|trusted|relied\\s+on|credible|valid|sound|useful|relevant|taken\\s+seriously)\\b" +
  "|\\b(?:is|are)\\s+(?:definitely|certainly|obviously|surely|inherently|simply)\\s+(?:outdated|obsolete|immature|unreliable|inferior|flawed|naive)\\b" +
  "|\\b(?:outdated|obsolete|immature|unreliable)\\b" +
  // b comparative inferiority（inferior to / no better than / not as good as）
  "|\\binferior\\s+to\\b|\\bno\\s+better\\s+than\\b|\\bnot\\s+as\\s+(?:good|reliable|mature|credible)\\s+as\\b" +
  // c rhetorical dismissal（how could ... be / not even worth reading / can it be trusted）
  "|\\bhow\\s+(?:could|can)\\s+(?:a|an|the)?\\s*\\w+\\s+(?:from|by)\\b[^.]{0,40}?\\b(?:be|matter)\\b" +
  "|\\bnot\\s+even\\s+(?:worth\\s+)?(?:read|reads|reading|listening\\s+to|considering|bothering)\\b" +
  "|\\bcan\\s+(?:a|an|the)?\\s*\\w+\\s+(?:from|by)\\b[^.]{0,30}?\\b(?:be\s+)?(?:trusted|relied\\s+on|taken\\s+seriously)\\b",
  'i'
);

// ─── 豁免：评析这套话术本身 / 概念分析 ─────────────────────────
const META_EXEMPT_ZH = /(?:这|那就是|这就是|这正是|那正是一种|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型|明显)?(?:起源谬误|基因谬误|诉诸出身|以出身论|来源歧视|出身论)|(?:起源谬误|基因谬误|genetic\s*fallacy|诉诸出身|以出身论|来源歧视|出身论)(?:是|属于|是一种|正是|属于|属于一种)(?:一种|典型的|常见的|经典的|隐性|常见|典型)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|歧视|偏见)/;
const META_EXEMPT_EN = /\b(?:genetic\s+fallacy|fallacy\s+of\s+genesis|appeal\s+to\s+origin|argument\s+from\s+origin)\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkGeneticFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SOURCE_ZH_ = R.SOURCE_ZH || SOURCE_ZH;
  const SOURCE_EN_ = R.SOURCE_EN || SOURCE_EN;
  const QUALITY_ZH_ = R.QUALITY_ZH || QUALITY_ZH;
  const QUALITY_EN_ = R.QUALITY_EN || QUALITY_EN;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const sourceZh = SOURCE_ZH_.test(text);
  const sourceEn = SOURCE_EN_.test(text);
  const qualityZh = QUALITY_ZH_.test(text);
  const qualityEn = QUALITY_EN_.test(text);

  // 双腿共现：来源点名 × 质量贬损推断（缺一不判）
  if ((sourceZh || sourceEn) && (qualityZh || qualityEn)) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh ? '起源谬误×来源质量推断(zh)' : '起源谬误×来源质量推断(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkGeneticFallacy,
  __internals: () => ({ SOURCE_ZH, SOURCE_EN, QUALITY_ZH, QUALITY_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
