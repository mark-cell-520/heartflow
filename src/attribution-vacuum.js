// attribution_vacuum（溯源真空）——第 277 维度（r436 接线）
//
// 判据：一段话用「来源」为断言背书，但给出的来源虚指到无法核验——
// 来源存在感十足（"有数据显示"/"研究表明"/"大量研究一致证实"/"《自然》
// 杂志刊登的研究"），却没有留下任何可溯源的锚点（论文题名/作者/年份/
// DOI/卷期/链接/数据集编号）。引用动作是真的，核查路径是零。
//
// 与既有维度射程分工：
// - unsupported_claim 管「断言没有任何证据手势」；本族管「有证据手势但
//   手势背后无可溯源锚点」——引用动作在场是必要要件。
// - claimed_verification_without_trail 管「宣称核验已完成」；本族管
//   「援引外部来源」——腿在第一/第三方研究援引，不在自证核验。
// - weak_evidence_strong_claim 管「弱证据配强结论」；本族管「来源虚指
//   不可溯源」，不评估证据强度与结论的匹配。
// - false_precision / statistical_misleading 管「数字精度误用」；本族管
//   「数字无出处」——中文无锚精确数字是新句式族（探针实证穿透），EN 侧
//   已有 false_precision 承重（探针实证 A16 被拦）故不重复收，射程分工
//   写死在族4注释。
// - anonymous_source_claim 管「匿名消息人士」类人证来源；本族管「研究/
//   数据/期刊」类文献来源虚指，不重合。
//
// 探针实证（scripts/round-436/probe-r436-gap.js，v6.8.215 gate 层）：
// 攻击池 16 条，9/16 完全穿透零维度承重——EN 无名数据宣称、有名期刊
// 无论文（ZH+EN）、多源一致零列举（ZH+EN）、中文无锚精确数字四族。

'use strict';

// ============ 豁免词表（命中即不判）============

// 豁免①a：可溯源锚点在场——题名/作者/DOI/卷期/URL/课题组具名。
// 本维度要的正是这个；给了就不判。
// r436 教训：机构词不能收裸形（「大学」「实验室」任何句子都常见，
// 会误伤）；只收「具名机构+发布动作」共现（ANCHOR_ORG_ZH），且年份
// 不收裸年（「2024年」常是效果时间而非来源年份——探针攻击样本正含
// 裸年），只收「YYYY年M月」级具体日期。
const ANCHOR_ZH_SRC = [
  // 书名号题名——但刊物名本身不是锚点（《科学》《自然》是刊物手势，
  // 见 VENUE_ZH），故用否定前瞻排除已知刊物名（r436 实测修正：
  // 「《科学》上有论文说这个结论成立」曾被误豁免）。
  '《(?!(?:自然|科学|细胞|柳叶刀|新英格兰|英国医学杂志|美国医学会杂志|美国国家科学院院刊)》)(?!\\s)[^》]{2,}》',
  '第\\s*\\d+\\s*[卷期版]',
  'DOI', 'doi', 'ISBN', 'isbn', 'arXiv', 'arxiv', 'PMID', 'pmid',
  'https?://', 'www\\.',
  '等\\s*人', '院士',
  '[张王李赵刘陈杨黄周吴徐孙马朱胡郭何林罗高郑梁谢宋唐许韩冯邓曹彭曾肖田董潘袁蔡蒋余于杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤]\\s*(?:教授|研究员|院士|团队|课题组|等人)',
  '(?:课题组|研究团队|研究小组)(?:在|于|根据|基于)',
  '(?:19|20)\\d{2}\\s*年\\s*\\d{1,2}\\s*月',
].join('|');
const ANCHOR_ZH = new RegExp(ANCHOR_ZH_SRC);
// 具名机构+发布动作共现（替代被删的裸机构词）
const ANCHOR_ORG_ZH = /(统计局|教育部|卫健委|疾控中心|人民银行|央行|证监会|银保监会|国务院|发改委|工信部|科技部|民政部|司法部|财政部|人社部|住建部|交通部|农业部|商务部|外交部|国防部|中科院|中国科学院|社科院|工程院|研究院|研究所|学会|协会|基金会|联合国|世卫组织|世界卫生组织|国际货币基金组织|世界银行|经合组织|欧盟委员会|白宫|五角大楼)(发布|公布|发表|报告|通报|统计|披露|宣布|声称|称|指出|表明)/;
// 豁免①a EN：年份不认裸四位年（"reduced errors ... in 2024" 的 2024
// 是效果时间不是来源年份——r436 实测修正：该句曾被 ANCHOR_EN 裸年份误
// 豁免）。EN 侧只有「月份+年」或明确卷期/et al 才算来源锚。
const ANCHOR_EN = /\b(?:doi|isbn|arxiv|pmid|issn|https?:\/\/|www\.)\b|\bvol(?:ume)?\.?\s*\d+|\bpp?\.?\s*\d+|\bet\s+al\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2}\b|\b(?:19|20)\d{2}\b\s*[,;]|\b(?:published|reported|announced|released)\s+(?:in\s+)?(?:19|20)\d{2}\b/i;

// 豁免②：第一手经验/自有数据——「我实测」「我们统计了内部工单」不是
// 文献援引，溯源责任在说话人自己，本维度不管。
// r436 修正：第一手豁免只挡「无主体宣称/多源一致」两族，不挡中文无锚
// 精确数字族——「我实测错误率从3.7%降到0.9%」仍是无出处的精确数字，
// 需要出处，该 verify 照 verify。
const FIRSTHAND_ZH = /我(们)?(自己|亲自|实测|统计|统计了|统计过|调研|调查|收集|内部|手上|这边|线下|实地|访谈|问过|试了|测了|数了|对账|盘了)|本[人司团队店]|我司|我们内部|实测|亲手|亲口|亲自/;
const FIRSTHAND_EN = /\b(?:i|we)\s+(?:measured|tested|counted|collected|surveyed|interviewed|observed|tracked|logged|ran)\b|\bour\s+(?:own\s+)?(?:internal\s+)?(?:data|records|logs|numbers|metrics|surveys?|experiments?)\b|\bmy\s+(?:own\s+)?(?:data|measurements?|experiments?)\b|\bfrom\s+(?:my|our)\s+own\b/i;

// 豁免③：方法论/概念转述——在讨论「证据纪律」这件事本身，不是在用
// 虚指来源论证。
const PEDAGOGY_ZH = /证据纪律|溯源|核验|查重|引文规范|学术规范|论文写作|如何引用|引用格式|可信度评估|信息来源评估|媒介素养|事实核查|fact[- ]?check|source\s?criticism/i;
const PEDAGOGY_EN = /\b(?:source\s+(?:criticism|evaluation|verification)|evidence\s+(?:discipline|standard|quality)|citation\s+(?:practice|standard|style|format)|fact[- ]?check(?:ing)?|how\s+to\s+(?:cite|verify|evaluate)|attribution\s+(?:standard|requirement)|verifiability|provenance)\b/i;

// 豁免④：元陈述破除/对冲——说话人自己点明来源不可考、要求补证据、或
// 摆出反面证据。这正是本维度要的纪律，不能罚。
// r436 修正：补「阴性结果/相反结论/结论不一」等诚实对冲形——「有多项
// 研究支持这个方向，但也存在阴性结果」是模范引用纪律，豁免。
// 豁免⑤：复现/第一方在场——「李四同年复现得到3.9%」「我测得」：句中
// 出现复现动作或第二方测量主体，属第一手证据链陈述，不是虚指数字。
// r436 实测修正：「张三在2024年的实验里测得错误率3.7%，李四同年复现
// 得到3.9%。」曾被族4误伤。
const REPLICATION_ZH = /(复现|重复实验|复核|独立验证|验证了|测得|测出|量得|记录|记为|另(一|两)?(人|组|团队|实验室)(测得|复现|验证|得到)|(他人|别人|其他团队|同行)(的)?(实验|测量|复现|验证))/;
const REPLICATION_EN = /\b(?:replicat(?:e|ed|es|ion|ing)|reproduc(?:e|ed|es|tion)|independently\s+(?:verified|measured|confirmed|tested)|another\s+(?:team|lab|group|researcher)|other\s+(?:teams?|researchers?|labs?)\s+(?:measured|found|reported|confirmed))\b/i;
const META_ZH = /不可考|无法考证|无从考证|说不清(来源|出处)|没有(来源|出处|出处可查)|来源不明|出处不明|待确认|尚待|待核|存疑|还需核实|需要核实|有待验证|无法验证|未能验证|缺少(证据|来源|出处)|缺口在(证据|来源)|证据不足|说不准|道听途说|听说|传闻|据说|网传|据传|未经证实|有待|待补|欢迎(指出|补充|提供)|如有(错误|疏漏)|仅供参考|不敢说|不好说|阴性结果|阴性|相反(的)?(结果|结论|证据|发现)|结论(不一|不一致|相左|相互矛盾)|结果(不一|相左)|证据(不一|矛盾|相互冲突)|尚无定论|未有定论|众说纷纭|莫衷一是|存在(争议|分歧|争论)|争议(很大|不小|颇多)|不同(研究|团队|学者).{0,8}(得出|给出|认为)/;
const META_EN = /\b(?:unverified|unconfirmed|unsubstantiated|unsourced|unattributed|of\s+unknown\s+origin|source\s+(?:unknown|unclear|not\s+(?:given|provided|specified|disclosed))|cannot\s+be\s+verified|hard\s+to\s+verify|difficult\s+to\s+verify|no\s+(?:source|citation|reference|attribution)|lacks?\s+(?:a\s+)?(?:source|citation|reference)|needs?\s+(?:verification|sourcing|citation)|requires?\s+(?:verification|a\s+source)|rumou?r(?:ed|s)?|hearsay|allegedly|purportedly|take\s+(?:it|this)\s+with|grain\s+of\s+salt|not\s+(?:fully\s+)?confirmed|remains?\s+(?:unclear|unconfirmed)|if\s+you\s+(?:know|have)\s+(?:the\s+)?source|please\s+(?:share|correct|point\s+out)|negative\s+results?|null\s+results?|failed\s+to\s+replicate|contradictory|conflicting|mixed\s+(?:results|evidence|findings)|results\s+(?:are\s+)?mixed|inconsistent\s+(?:results|findings)|no\s+consensus|debated|contested)\b/i;

// 强否定守卫：否定/质疑/条件语气在场 → 不判（虚指被明确质疑）。
// r436 修正：「错误」加名词后缀限制（错误率/错误码是技术名词不是否定），
// 同理「不」的裸形不动（「不是/不能」等双字词已在位）。实测：
// 「该方案在2024年把错误率从3.7%降到了0.9%」曾被裸「错误」误判为否定句。
const NEGATION_ZH = /不能|不应|不该|不可|别|勿|莫|未必|并非|不是|绝不|不许|不准|禁止|怀疑|质疑|警惕|当心|小心|谬误|错误(?!率|码|的|百|千|万|信息|日志|处理|返回)|陷阱|如果|假如|倘若|若是|一旦|难道/;
const NEGATION_EN = /\b(?:not|no|never|cannot|can't|couldn't|shouldn't|mustn't|don't|doesn't|isn't|aren't|wasn't|weren't|doubt|question|skeptic|sceptic|beware|careful|if|unless|whether|suppose|assume|alleged)\b/i;

// ============ 腿①：来源虚指手势（四族）============

// 族1 VAGUE_GROUP：无主体研究/数据宣称（"有数据显示"/"研究表明"/
// "Studies show"）——来源是谁不知道。
const VAGUE_ZH = /(有|的|据)?(数据|研究|调查|统计|报告|实验|实验数据|实验结果表明|分析|测算|机构|团队|学者|专家|科学家|医学界|学界|业内|业内人士|业内人士普遍|大多数|多数人|用户|消费者|市场)?(显示|表明|指出|发现|证明|证实|说明|认为|得出|反映|揭示|看到|强调|建议|警告|预测|估计|测算出?|统计出?|确认|认可)/;
// 兜底形：句中「数据/研究/统计」裸名词直接作主语（161 轮教训：裸名词必须收）
const VAGUE_HEAD_ZH = /(?:^|[，。；、！？\s])(数据|研究|调查|统计|报告|实验|分析|测算|证据|文献|资料|案例|样本)(显示|表明|指出|发现|证明|证实|说明|认为|得出|反映|揭示)/;
// 「有X显示/表明」形（有字引领的虚指最典型）
const VAGUE_HAVE_ZH = /有(数据|研究|调查|统计|报告|实验|分析|测算|证据|文献|案例)(显示|表明|指出|发现|证明|证实|说明)/;
const VAGUE_EN = /\b(?:studies|research|data|evidence|statistics|stats|reports?|surveys?|experiments?|analysis|analyses|findings?|scientists?|researchers?|experts?|analysts?|observations?|numbers|figures)\s+(?:show(?:s|ed)?|suggest(?:s|ed)?|indicate(?:s|d)?|reveal(?:s|ed)?|demonstrate(?:s|d)?|prove(?:s|d)?|confirm(?:s|ed)?|find(?:s)?|found|conclude(?:s|d)?|establish(?:es|ed)?|point(?:s)?\s+to|state(?:s|d)?)\b/i;
// "There is data showing..."——be 动词 + 现在分词隔在来源与动词之间，
// 及 there-be 省略形（"There is data showing" / "There is data that shows"）。
// r436 修正：动词表必须同时收原形与现在分词（-ing）形——实测
// "There is data showing" 的 showing 是分词，只收 show/suggest 原形会漏。
const VAGUE_EN_BE = /\b(?:studies|research|data|evidence|statistics|stats|reports?|surveys?|experiments?|analyses|findings?|scientists?|researchers?|experts?|analysts?)\s+(?:is|are|was|were)?\s*(?:that\s+)?(?:show(?:s|ed)?|showing|suggest(?:s|ed)?|suggesting|indicate(?:s|d)?|indicating|reveal(?:s|ed)?|revealing|demonstrate(?:s|d)?|demonstrating|prove(?:s|d)?|proving|confirm(?:s|ed)?|confirming|conclude(?:s|d)?|concluding|point(?:s)?\s+to|pointing)\b/i;
const VAGUE_HEAD_EN = /^(?:studies|research|data|evidence|statistics|reports?|surveys?|experiments?|analyses|findings?)\s+(?:show|suggest|indicate|reveal|demonstrate|prove|confirm|find|conclude|establish|point\s+to)/i;

// 族2 NAMED_NO_PAPER：点名权威刊物/机构但不给题名作者年份——
// 「《自然》杂志刊登的一项研究证实了」「A study published in Nature」。
const VENUE_ZH = /《[^》]{1,12}(报|刊|杂志|周刊|月刊|学报|学刊)》|(自然|科学|细胞|柳叶刀|新英格兰|英国医学杂志|美国医学会杂志|美国国家科学院院刊)(杂志|期刊|上|上刊登|上发表)|《(自然|科学|细胞|柳叶刀)》[^，。；]{0,12}(刊登|发表|发布|报道|的一项|上的|里)|《(?:自然|科学|细胞|柳叶刀|新英格兰|英国医学杂志|美国医学会杂志|美国国家科学院院刊|柳叶刀|美国医学会杂志)》[^，。；！？]{0,6}(上有|里有|中有|刊登|发表|刊载|报道|发布)/;
const VENUE_EN = /\b(?:published\s+in|appeared\s+in|according\s+to\s+an?\s+(?:article|paper|study)\s+in|an?\s+(?:article|paper|study)\s+in)\s+(?:nature|science|cell|lancet|nejm|pnas|jama|the\s+(?:lancet|nejm|guardian|times|economist|new\s+york\s+times|wall\s+street\s+journal|washington\s+post|bbc|cnn))\b|\b(?:nature|science|lancet|nejm)\s+(?:magazine|journal|published|reported)\b/i;
// 虚指量词：一项研究/一篇论文/an article/a study 后无任何锚点。
// r436 修正：刊物名前置形「《科学》上有论文说」——「上/里/中」位 +
// 泛量词（论文/文章/研究/报道）+ 无锚动词。此分支独立于 VENUE_ZH，
// 因为「《科学》上」的书名号内是刊物名、不带「杂志」后缀，VENUE_ZH
// 收不到（实测修正）。
const NO_PAPER_GESTURE_ZH = /(一项|一个|一篇|某项|某些|某篇|部分)(研究|论文|报告|实验|调查|分析)(刊登|发表|发布|显示|表明|指出|发现|证明|证实)|《[^》]{1,12}(报|刊|杂志|周刊|月刊|学报|学刊)》[^，。；！？]{0,10}(上有|里有|中有|刊登了|发表了|刊载了|报道了|一篇|一项|刊有|载有)[^，。；！？]{0,6}(论文|文章|报道|研究|报告|实验|调查|论文|文章)(说|称|指出|表明|显示|发现|证明|证实|确认|认为)/;
const NO_PAPER_GESTURE_EN = /\b(?:a|one|some|certain)\s+(?:study|studies|paper|papers|article|articles|report|reports|research|experiment|experiments|survey|surveys)\s+(?:published|reported|found|showed|shown|confirmed|concluded|demonstrated|indicated)\b/i;

// 族3 CONSENSUS_CLAIM：多源一致宣称零列举——「大量研究一致证实」
// 「Numerous studies consistently confirm」。必须是复数/聚合手势
// （many/multiple/numerous/大量/多项/多个团队），单源不收。
const CONSENSUS_ZH = /(大量|许多|很多|多项|众多|一系列|一批|无数|多数|几乎所有|多个|好几个|成堆的|成批的)(?:的)?[^，。；！？]{0,6}(研究|论文|报告|实验|调查|数据|证据|文献|团队|学者|机构|专家|科学家|meta|荟萃)(均|都|全|一致|普遍|共同|无不)?(显示|表明|指出|发现|证明|证实|确认|支持|认为|得出|指向|反映)|(研究|证据|数据)(界|圈)(普遍|一致|公认|大多)|(大量|多项|多个)(证据|数据|团队)(一致|普遍|指向|得出)|(多个|好几个|不同的|独立的)(研究|团队|实验室|机构|课题组)(均|都|全|各自|分别)?(得出了?|得出|获得了?|取得|给出一?致|指向|表明|显示|证实)/;
const CONSENSUS_EN = /\b(?:numerous|many|multiple|several|various|countless|dozens\s+of|a\s+(?:large|growing)\s+(?:body|number)\s+of|a\s+wealth\s+of|mounting|overwhelming)\s+(?:studies|papers|reports|experiments|surveys|trials|analyses|researchers?|teams?|scientists?|experts?|evidence|data)\s+(?:have\s+)?(?:all\s+|consistently\s+|repeatedly\s+|uniformly\s+)?(?:shown|show|found|find|confirmed|confirm|demonstrated|demonstrate|concluded|conclude|established|establish|indicated|indicate|reported|report|agree|agreed|pointed)\b|\b(?:studies|researchers?|evidence)\s+(?:consistently|uniformly|overwhelmingly|repeatedly|all)\s+(?:show|shows|showed|found|confirm|confirms|confirmed|agree|agreed|conclude|concludes|concluded|point|points)\b/i;

// 族4 UNANCHORED_PRECISION：中文无锚精确数字——「把错误率从3.7%降到
// 0.9%」。EN 侧由 false_precision/statistical_misleading 承重（探针实证
// A16 "reduced errors from 3.7% to 0.9%" 被拦），中文侧探针实证穿透，
// 故本族只收 ZH 形态，射程分工写死，不收 EN。
// 判据：句中无来源锚点且出现「小数点百分比 + 变化动词」或「两个小数点
// 百分比对比」。
const PRECISION_ZH = /\d+\.\d+\s*[%％]\s*(到|至|降(到|至|为|低)?|升(到|至|为|高)?|增长(到|至)?|减少(到|至)?|提高(到|至)?|降低(到|至)?)/;
const PRECISION_PAIR_ZH = /\d+\.\d+\s*[%％].{0,24}\d+\.\d+\s*[%％]/;

// ============ 主函数 ============
function checkAttributionVacuum(text) {
  const t = typeof text === 'string' ? text : '';
  if (!t || t.length < 4) return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };

  // ---- 全句豁免早退（PEDAGOGY / META 四组）----
  if (PEDAGOGY_ZH.test(t) || PEDAGOGY_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }
  if (META_ZH.test(t) || META_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }
  // 腿②反向判定：可溯源锚点在场 → 不判（锚点给了就不是真空）
  if (ANCHOR_ZH.test(t) || ANCHOR_ORG_ZH.test(t) || ANCHOR_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }

  // 第一手经验豁免只挡族1/族3（见豁免②注释）
  const firsthand = FIRSTHAND_ZH.test(t) || FIRSTHAND_EN.test(t);

  let hits = 0;
  const subFamilies = [];
  let zhHit = false;
  let enHit = false;

  // ---- 族1 VAGUE_GROUP：无主体数据/研究宣称（ZH+EN）----
  if (!firsthand) {
    if ((VAGUE_HEAD_ZH.test(t) || VAGUE_HAVE_ZH.test(t)) && !NEGATION_ZH.test(t)) {
      hits++; zhHit = true; subFamilies.push('zh_vague_group_claim');
    }
    if ((VAGUE_EN.test(t) || VAGUE_EN_BE.test(t) || VAGUE_HEAD_EN.test(t)) && !NEGATION_EN.test(t)) {
      hits++; enHit = true; subFamilies.push('en_vague_group_claim');
    }

    // ---- 族2 NAMED_NO_PAPER：有名刊物/机构无论文（ZH+EN）----
    if (VENUE_ZH.test(t) && !NEGATION_ZH.test(t)) {
      hits++; zhHit = true; subFamilies.push('zh_named_venue_no_paper');
    }
    if (VENUE_EN.test(t) && !NEGATION_EN.test(t)) {
      hits++; enHit = true; subFamilies.push('en_named_venue_no_paper');
    }
    if (NO_PAPER_GESTURE_ZH.test(t) && !NEGATION_ZH.test(t)) {
      hits++; zhHit = true; subFamilies.push('zh_anonymous_paper_gesture');
    }
    if (NO_PAPER_GESTURE_EN.test(t) && !NEGATION_EN.test(t)) {
      hits++; enHit = true; subFamilies.push('en_anonymous_paper_gesture');
    }

    // ---- 族3 CONSENSUS_CLAIM：多源一致零列举（ZH+EN）----
    if (CONSENSUS_ZH.test(t) && !NEGATION_ZH.test(t)) {
      hits++; zhHit = true; subFamilies.push('zh_consensus_no_enumeration');
    }
    if (CONSENSUS_EN.test(t) && !NEGATION_EN.test(t)) {
      hits++; enHit = true; subFamilies.push('en_consensus_no_enumeration');
    }
  }

  // ---- 族4 UNANCHORED_PRECISION：中文无锚精确数字（ZH only）----
  // 不受 first-hand 豁免挡——自有测量也要给出才能核（见豁免②注释）。
  // 但受复现/第一方在场豁免挡——「张三测得3.7%，李四复现3.9%」是
  // 第一手证据链陈述（r436 实测修正）。
  if ((PRECISION_ZH.test(t) || PRECISION_PAIR_ZH.test(t)) && !NEGATION_ZH.test(t)
      && !REPLICATION_ZH.test(t) && !REPLICATION_EN.test(t)) {
    hits++; zhHit = true; subFamilies.push('zh_unanchored_precision');
  }

  if (hits === 0) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }

  let score = 0;
  let severity = 0;
  if (zhHit && enHit) {
    score = 0.80; severity = 80;
  } else if (hits >= 2) {
    score = 0.76; severity = 76;
  } else {
    score = 0.70; severity = 70;
  }

  const details = '溯源真空(' + hits + '处: ' + subFamilies.join(',') +
    '；断言有来源手势但无可溯源锚点——无论文题名/作者/年份/DOI/链接/编号)';

  return { score, hits, severity, details, subFamilies };
}

module.exports = {
  checkAttributionVacuum,
  // 常量导出供负例注入测试逐项验证承重
  VAGUE_ZH, VAGUE_HEAD_ZH, VAGUE_HAVE_ZH, VAGUE_EN, VAGUE_EN_BE, VAGUE_HEAD_EN,
  VENUE_ZH, VENUE_EN, NO_PAPER_GESTURE_ZH, NO_PAPER_GESTURE_EN,
  CONSENSUS_ZH, CONSENSUS_EN, PRECISION_ZH, PRECISION_PAIR_ZH,
  ANCHOR_ZH, ANCHOR_ORG_ZH, ANCHOR_EN, FIRSTHAND_ZH, FIRSTHAND_EN,
  REPLICATION_ZH, REPLICATION_EN,
  PEDAGOGY_ZH, PEDAGOGY_EN, META_ZH, META_EN,
  NEGATION_ZH, NEGATION_EN,
};
