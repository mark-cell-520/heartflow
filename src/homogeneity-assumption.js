/**
 * src/homogeneity-assumption.js — 「群体同质性假设」检测器（第 271 维度）
 * r404 新建：真升级① 新判别维度（两腿判据 + 豁免表 + 负例注入测试逐常量验证承重）
 *
 * 立项来源（阶段1 研究 + 缺口实证）：
 *   阶段1 三层搜索：HN Algolia 空返、Semantic Scholar parse-fail、GitHub
 *   unsupported claim 相关仓库最高仅 3 星（YucongDuan/DIKWP-ProofLedger-OS ★3、
 *   eldoctorams/djehuty-proof ★1）——不构成成熟方案参考，按既有形态自建。
 *   多候选族穿透探针（scripts/round-404/probe-r404-multi.js，8 族同池）：
 *     A 诉诸沉默 / B 历史类比滥用 / C 诉诸直觉 / E 诉诸个人经验 /
 *     F 时间倒置论证 / G 诉诸自然节奏 —— 均被存量维度 4/5 代拦；
 *     D 预测不可证伪 2/5、H 同质性假设 2/5 部分穿透。
 *   H 族深探（probe-r404-H.js，15 变体）：穿透 11/15，存量维度零专门覆盖。
 *
 * 辨别的族：群体同质性假设（homogeneity assumption / group homogeneity
 * overreach）——文本以**单一共享属性**（同年龄/同学校/同村/同城/同病/
 * 同星座/同岗位/同团队/同届/同乡）为由，推断**群体所有成员在某一维度上
 * 无差异**（都一样/全都/完全相同/没有区别/差不多/identical/all the same），
 * 而不承认群体内部的结构性差异。这是统计学上的「忽略组内方差」
 * （within-group variance neglect）在自然语言推理中的形态：一个群体标签
 * 只说明成员共享一个分类坐标，不说明他们在结果变量上收敛。
 *
 * 判据（两腿共现 + 邻近窗 + 豁免表，缺一不判）：
 *   腿① SHARED_ATTR 共享属性载体在场——群体标签 + 同一性量词；
 *   腿② HOMOGENEITY 同质推断断言在场——无差异/都一样/完全相同/identical/
 *     all the same / no difference。
 *   两腿落在 80 字（EN 220 字符）邻近窗内即构成一次同质化推断。
 *
 * 与既有维度的边界（r404 归因）：
 *   · hasty_generalization（dim 5 族）管「少数样本 → 全称结论」——必须有
 *     样本腿；本族不需要任何样本，「同一个村的村民」零观察即可推断，
 *     共享属性本身即被当作充分依据（探针攻击 11/15 穿透证明射程不重叠）。
 *   · stereotype（dim 61）管刻板印象**内容**（对某群体的固定负面/正面
 *     描摹）；本族管推理**结构**（共享属性 → 无差异），可对正面属性成立
 *     （「同一所学校毕业的人都很优秀」）。
 *   · sorites_fallacy（dim 212）管模糊边界连锁（秃头悖误式量级渐变）；
 *     本族不涉及量级渐变，是成员间差异抹除。
 *   · whole_part_transfer（dim 170）管整体属性移到部分；本族方向相反——
 *     是把部分成员的**共同标签**扩成成员的**相同表现**。
 *   · ecological_fallacy（dim 211）管群体级统计量推到个体；本族是个体
 *     标签（同村/同校）推到成员间无差异，不经过群体统计量。
 *
 * verify 级：单句可能是统计口径的正确转述（同质性经检验成立）、他人偏见
 * 引述、或作者正要批判该假设；verify 的含义是「这个以共享属性为据的同质
 * 推断没有给出组内方差证据，需要成员级数据才能采信」。
 *
 * 明确不判（豁免）：
 *   ① 差异承认/组内方差在场（差异/差别/区别/各有不同/参差不齐/不一/
 *      方差/离散/个体差异/因人而异/不尽相同/并非都一样；
 *      EN differ/differences/vary/variation/variance/dispersion/not
 *      identical/individual differences）——正在承认组内差异，是正确判别；
 *   ② 统计检验口径（经检验/统计显著/同质性检验/方差分析/ANOVA/一致性
 *      检验；EN statistically / tested / homogeneity test / ANOVA）——有
 *      检验依据的同质陈述是正当推断；
 *   ③ 元陈述破除（同质性假设/群体同质/homogeneity assumption/
 *      group homogeneity / overgeneralization）——正在指出本谬误本身；
 *   ④ 法律/规则明文（同一/同等……规定/应当/必须/享有同等权利；
 *      EN entitled to the same rights / treated equally under the
 *      law）——规范性平等是制度陈述不是经验推断；
 *   ⑤ 疑问句（含 ?/？）与对冲（可能/也许/或许/大概/似乎/好像）。
 */

'use strict';

// ── 腿① SHARED_ATTR：共享属性载体（群体标签 + 同一性量词）──────────────
// r161 教训：枚举腿必须收裸名词形态——「同村」「同校」「同届」去掉任何
// 修饰仍应命中，故以「同X」构词整体入表。
const SHARED_ATTR_ZH = /同一(?:个?|所|届|批|期|班|区|县|市|省|国|族|家|类|型|款|条|款)?(?:年龄|岁|年纪|学校|大学|学院|班级|班|届|专业|村|村庄|镇|县|市|省|国|国家|地区|地方|民族|家族|家庭|父母|姓氏|星座|属相|生肖|岗位|职位|部门|公司|单位|团队|小组|群|类|类型|疾病|病|诊断|症状|药|方案|标准|规格|型号|批次|水平|层次|阶层|阶级|身份|背景|学历|文凭|证书|资质|经历|年代|年份|时代|时期|阶段)|同(?:岁|年|月|日|届|批|期|班|校|村|镇|县|市|省|国|族|家|类|型|条|款|级|层|阶|科|门|专业|行|业|职|位|部门|公司|单位|团队|组|群|类|病|症|药|方|案|标|准|规格|型号|批次|水平|层次|阶层|阶级|身份|背景|学历|文凭|证书|资质|经历|年代|年份|时代|时期|阶段)|同龄人|同龄|同届|同校|同班|同村|同乡|同行|同专业|同病|同症|同药|同方|同案|同标|同准|同型|同款|同批|同级|同层|同阶|同科|同门|同行|同业|同职|同位|同部门|同公司|同单位|同团队|同组|同群|同类|同族|同家|同国|同省|同市|同县|同镇|同年代|同年份|同时代|同时期|同阶段|同背景|同学历|同文凭|同证书|同资质|同经历|同身份|同阶层|同阶级|同星座|同属相|同生肖|同姓氏|同家庭|同父母|同年龄|同岁|同年级|同属|同属于|同为一个|同一个|(?:90后|00后|80后|70后|60后|95后|10后|05后|z世代|Z世代)|(?:村民|乡民|镇民|市民|村民|校友|同学|同僚|同事|室友|家丁|族人|同胞|同门|师兄弟|师姐妹)(?:们)?(?:都)?(?:是)?(?:同|一样)|(?:一个|这个|那个|这条|同条)(?:村|村庄|镇|县|市|省|区|街道|小区|社区|楼|栋|单元)(?:的|里)?(?:人|村民|居民|住户|人家|市民)|(?:一个|这所|那所|同所)(?:学校|大学|学院|中学|小学|班级|专业|系)(?:的|里)?(?:人|学生|学员|毕业生|同学|校友)|(?:同一?|这|那)(?:个)?(?:公司|单位|企业|工厂|部门|团队|小组|科室|车间|班组)(?:的|里|中)?(?:人|员工|职员|同事|成员|工人)|(?:同一?|这|那)(?:个)?(?:岗位|职位|工种|职业)(?:的|上)?(?:人|员工|从业者|职员)|(?:同一?|这|那)(?:个)?(?:届|批|期|班|年级|专业|学科)(?:的)?(?:人|学生|学员|毕业生|同学|考生)|(?:共享|共有)(?:的)?(?:属性|特征|标签|身份|背景|来源)|共同的(?:身份|背景|来源|出身|籍贯|民族|星座)|都是(?:同校|同班|同届|同村|同乡|同龄|同行|同专业|同校毕业|同班同学|同乡)|来自于同一|来自同一|同一批(?:人|学生|患者|员工|毕业生|学员)|同一所(?:学校|大学|学院)/;
const SHARED_ATTR_EN = /\b(?:the\s+)?same\s+(?:age|age\s+group|generation|cohort|school|university|college|class|graduating\s+class|major|village|town|city|province|country|nation|ethnic\s+group|family|surname|zodiac|job\s+title|position|department|company|firm|team|group|category|disease|diagnosis|symptom|condition|drug|treatment|protocol|standard|model|batch|tier|level|stratum|class|background|credential|degree|diploma|qualification|experience|era|decade|period|stage)\b|\b(?:born\s+in\s+the\s+same|from\s+the\s+same|from\s+that|of\s+the\s+same|members?\s+of\s+the\s+same|share\s+the\s+same|sharing\s+the\s+same|with\s+the\s+same|share\s+a\s+common|graduates?\s+(?:from|of)\s+(?:the\s+same|that))\b|\bsame\s+(?:diagnosis|condition|background|age\s+cohort|job|role)\b|\ball\s+(?:gen\s?z|millennials|boomers|from\s+\w+)\b|\b(?:gen\s?z|millennials?|boomers?)\b(?:\s+(?:consumers?|people|workers?|students?|buyers?|graduates?))?/i;

// ── 腿② HOMOGENEITY：同质推断断言（无差异断言）─────────────────────
// 收「都一样/完全相同/毫无差别/一模一样/都差不多/不存在差异」等形态，
// 含 EN 的 identical / all the same / no difference / equally。
const HOMOGENEITY_ZH = /都(?:是)?(?:一样|一个样|一模一样|完全相同|差不多|大同小异|相似|类似|相当|不相上下)|完全(?:相同|一样|一致|统一|相似)|完全没(?:有)?(?:区别|差别|差异|不同)|毫无(?:区别|差别|差异|二致)|一模(?:一样|不差)|没(?:有)?(?:任何)?(?:区别|差别|差异)|不存在(?:任何)?(?:区别|差别|差异)|并(?:无|没有)(?:区别|差别|差异|不同)|(?:没有|无)(?:差别|区别)|均(?:为|是|属)?(?:同一|一致|相同)|(?:每|各)(?:个|位|人|者|成员)(?:都)?(?:一样|相同|一致|不相上下|相似|类似)|(?:能力|水平|素质|想法|看法|观点|性格|命运|表现|行为|消费|需求|发展|轨迹|收入|成绩)(?:都)?(?:是)?(?:一样|相同|差不多|相当|相似|类似|不相上下)|千人(?:一面|一律)|(?:看|问|问一)?(?:一)?(?:个)?(?:人|学员|学生|村民|患者|成员)(?:就)?(?:够|行|可以|足以)|招(?:谁|哪个)(?:都)?(?:一样|可以|行)|(?:命运|轨迹)(?:都)?(?:差不多|大致相同|类似)|(?:性格|想法|命运|水平|能力|消费)(?:都)?(?:相似|类似|差不多)|(?:问|看)(?:一?个?)(?:人|村民|学生|患者|成员)(?:就)?(?:够|可以|行|足以|知道)|都(?:会|能|要|爱|喜欢|倾向|习惯)?(?:这样|如此|一样)(?:消费|生活|工作|思考|做事|行为|反应|表现|选择|决策)|都(?:喜欢|爱|倾向|习惯)(?:这样|如此)(?:消费|生活|工作|思考|做事|选择)|(?:消费|生活|工作|思考|行为)(?:方式|模式|习惯)(?:都)?(?:一样|相同|相似)/;
const HOMOGENEITY_EN = /\b(?:are|is|were|has|have)\s+(?:all\s+)?(?:exactly\s+)?(?:the\s+same|identical|interchangeable|equivalent|no\s+different|similar|alike)\b|\b(?:has|have)\s+(?:an?\s+)?(?:the\s+)?same\s+(?:skill|ability|level|background|education|training|qualification|capability|performance)\b|\ball\s+(?:\w+\s+){0,3}?(?:behave|act|think|respond|perform|look|are|share|have)\s+(?:the\s+same|identically|alike|similarly|in\s+the\s+same\s+way)\b|\b(?:behave|act|think|respond|perform)\s+(?:in\s+)?(?:exactly\s+)?the\s+same\s+way\b|\bthink\s+alike\b|\breact\s+identically\b|\brespond\s+the\s+same\s+way\b|\bno\s+(?:real\s+)?(?:difference|differences|distinction|variation)\b|\b(?:not|n't)\s+(?:any\s+)?different\b|\bwithout\s+(?:exception|distinction|difference)\b|\bone\s+size\s+fits\s+all\b|\bindistinguishable\s+(?:from\s+each\s+other|in\s+this\s+regard)\b|\ball\s+equally\s+(?:qualified|capable|skilled|competent|suited)\b|\bequally\s+(?:qualified|capable|skilled|competent|suited)\b|\bany\s+one\s+of\s+them\s+(?:is|will\s+do)\b|\ball\s+(?:share|have)\s+similar\s+(?:values?|traits?|skills?|levels?|backgrounds?)\b|\brequire\s+(?:an?\s+)?identical\s+(?:treatment|approach|response)\b|\bsimilar\s+(?:values?|skill\s+levels?|ability)\s+across\b/i;

// ── 豁免组①：差异承认 / 组内方差在场（正确判别，不判）────────────────
// 注意负向语境排除：「毫无差别/没有差别/并无差别/毫无区别/没有区别/毫无
// 差异/并无二致」是**否认差异**的同质推断形态（腿②同族），不是差异承认——
// 裸词「差别/区别/差异」若直接收会把这些攻击句整句放过（r404 实测：
// 「同乡之间毫无差别，想法完全一致。」被豁免组①误触）。故先做否定前缀
// 剥离，只对正向承认语境生效。
const _DIFF_NEG_ZH = /(?:毫无|没有|并无|全无|毫无任何|不存在任何?)(?:的)?(?:差别|区别|差异|不同)/g;
function diffAckZH(text) {
  const masked = text.replace(_DIFF_NEG_ZH, '＿');
  return /差异|差别|区别|各有不同|参差不齐|不齐|不一|方差|离散|个体差异|因人而异|不尽相同|并非都|并不都|未必都|不一定都|各有千秋|各有特点|不尽一致|分化|分层|不统一|多样性|多元|异质性|各有各的|不尽一样|未必相同|并不相同/.test(masked);
}
const DIFF_ACK_ZH = /差异|差别|区别|各有不同|参差不齐|不齐|不一|方差|离散|个体差异|因人而异|不尽相同|并非都|并不都|未必都|不一定都|各有千秋|各有特点|不尽一致|分化|分层|不统一|多样性|多元|异质性|各有各的|不尽一样|未必相同|并不相同/;
const DIFF_ACK_EN = /\bdiffer(?:s|ent|ences)?\b|\bvar(?:y|ies|iation|iance)\b|\bdispersion\b|\bindividual\s+differences\b|\bheterogene\w+\b|\bnot\s+(?:all\s+)?(?:identical|the\s+same|alike)\b|\bdiverse\b|\bheterogeneous\b/i;

// ── 豁免组②：统计检验口径（有依据的同质陈述）──────────────────────
const STAT_TEST_ZH = /经(?:检验|测试|统计)|统计(?:显著|学上|意义)|同质性(?:检验|检验)|方差分析|ANOVA|一致性(?:检验|系数)|信度|效度|卡方|p\s*[<＜=＝]\s*0?\.\d|置信区间|标准误|回归(?:显著|系数)/;
const STAT_TEST_EN = /\bstatistically\s+(?:significant|tested|indistinguishable|equivalent)\b|\bhomogeneity\s+test\b|\bANOVA\b|\bchi-?squared?\b|\bp\s*[<≤=]\s*0?\.\d+\b|\bconfidence\s+interval\b|\bstandard\s+error\b|\bhomoscedastic\w+\b/i;

// ── 豁免组③：元陈述破除（指出本谬误本身）────────────────────────
const META_ZH = /同质性假设|群体同质|同质化(?:假设|谬误|问题)|一概而论|以偏概全|刻板印象|群体(?:同质|内差异)|组内(?:方差|差异)|(?:这|那是|属于)(?:一种)?(?:同质性|一概而论)/;
const META_EN = /\bhomogeneity\s+assumption\b|\bgroup\s+homogeneity\b|\bovergeneraliz\w+\b|\bstereotyp\w+\b|\bwithin-?group\s+(?:variance|differences?)\b|\bthis\s+(?:assumption|fallacy|generalization)\b/i;

// ── 豁免组④：法律/规则明文的规范性平等（制度陈述非经验推断）────────
const LEGAL_ZH = /享有同等|同等(?:权利|待遇|地位|机会)|一律平等|平等(?:对待|权利|机会)|法律面前|同工同酬|同等条件|对等(?:对待|原则)|按规定|应当|必须|明文规定|依法/;
const LEGAL_EN = /\bentitled\s+to\s+(?:the\s+same|equal)\b|\bequal\s+(?:rights?|treatment|opportunit\w+|protection)\b|\btreated\s+equally\b|\bunder\s+the\s+law\b|\bequal\s+pay\s+for\s+equal\s+work\b|\bshall\s+be\s+(?:treated|considered)\s+equally\b/i;

// ── 豁免组⑤：疑问句 + 对冲 ────────────────────────────────────────
const HEDGE_ZH = /可能|也许|或许|大概|似乎|好像|说不定|有待|存疑|未必|不见得|难说/;
const HEDGE_EN = /\bmaybe\b|\bperhaps\b|\bmight\b|\bprobably\b|\bseems?\b|\bappears?\b|\bcould\s+be\b|\bnot\s+necessarily\b/i;

// 邻近窗：中文 80 字，EN 220 字符（同 goal_drift 口径放大——同质性推断
// 的腿①标签与腿②断言之间常有较长修饰链）
const WIN_ZH = 80;
const WIN_EN = 220;

/**
 * 主检测函数。
 * @param {string} text 归一化后的文本
 * @returns {{score:number, hit:boolean, detail:string, spans?:Array}}
 */
function checkHomogeneityAssumption(text) {
  if (typeof text !== 'string' || text.length < 4) {
    return { score: 0, hit: false, detail: '' };
  }

  const isEN = /[\x20-\x7F]{12,}/.test(text) && !/[\u4e00-\u9fa5]/.test(text.slice(0, 40));

  // ① 句级豁免：差异承认（整句放过——承认组内差异即正确判别）
  if (isEN) {
    if (DIFF_ACK_EN.test(text)) return { score: 0, hit: false, detail: 'exempt:diff-ack' };
  } else {
    if (diffAckZH(text)) return { score: 0, hit: false, detail: 'exempt:diff-ack' };
  }

  // ② 统计检验口径
  if (isEN ? STAT_TEST_EN.test(text) : STAT_TEST_ZH.test(text)) {
    return { score: 0, hit: false, detail: 'exempt:stat-test' };
  }
  // ③ 元陈述破除
  if (isEN ? META_EN.test(text) : META_ZH.test(text)) {
    return { score: 0, hit: false, detail: 'exempt:meta' };
  }
  // ④ 法律/规范平等
  if (isEN ? LEGAL_EN.test(text) : LEGAL_ZH.test(text)) {
    return { score: 0, hit: false, detail: 'exempt:legal' };
  }
  // ⑤ 疑问句 + 对冲
  if (/[?？]/.test(text)) return { score: 0, hit: false, detail: 'exempt:question' };
  if (isEN ? HEDGE_EN.test(text) : HEDGE_ZH.test(text)) {
    return { score: 0, hit: false, detail: 'exempt:hedge' };
  }

  // 定位腿①位置（全部命中取首个，另记录命中词）
  const re1 = isEN ? SHARED_ATTR_EN : SHARED_ATTR_ZH;
  const re2 = isEN ? HOMOGENEITY_EN : HOMOGENEITY_ZH;
  const win = isEN ? WIN_EN : WIN_ZH;

  const m1 = re1.exec(text);
  if (!m1) return { score: 0, hit: false, detail: '' };
  const m2 = re2.exec(text);
  if (!m2) return { score: 0, hit: false, detail: '' };

  // 邻近窗校验：两腿必须在窗内（任一跳转到另一腿都在窗内）
  const d = Math.abs(m1.index - m2.index);
  if (d > win) return { score: 0, hit: false, detail: `far:${d}>${win}` };

  // 命中性量化：短腿词（≤2 字符 ZH / ≤4 字符 EN）降权，防「同」类泛词误触
  const w1 = m1[0].length;
  const w2 = m2[0].length;
  const minLen = isEN ? 4 : 2;
  const thin = (isEN ? w1 < 5 : w1 <= 2) || (isEN ? w2 < 6 : w2 <= 2);
  if (thin && d > Math.floor(win / 2)) {
    return { score: 0, hit: false, detail: `thin:${w1}/${w2}` };
  }

  const score = Math.min(0.9, 0.55 + 0.05 * Math.min(4, Math.floor((w1 + w2) / 8)));
  return {
    score,
    hit: true,
    detail: `同质性假设: "${m1[0].slice(0, 14)}" × "${m2[0].slice(0, 14)}" (间距${d})`,
    spans: [
      { leg: 'shared_attr', index: m1.index, text: m1[0].slice(0, 30) },
      { leg: 'homogeneity', index: m2.index, text: m2[0].slice(0, 30) },
    ],
  };
}

module.exports = {
  checkHomogeneityAssumption,
  SHARED_ATTR_ZH, SHARED_ATTR_EN,
  HOMOGENEITY_ZH, HOMOGENEITY_EN,
  DIFF_ACK_ZH, DIFF_ACK_EN,
  STAT_TEST_ZH, STAT_TEST_EN,
  META_ZH, META_EN,
  LEGAL_ZH, LEGAL_EN,
  HEDGE_ZH, HEDGE_EN,
  WIN_ZH, WIN_EN,
};
