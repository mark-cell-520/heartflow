/**
 * src/conditional-transposition.js — 「条件概率换位」检测器
 * （第 215 个判别维度，r228 由 agent-4 起草、r249 由 1 号接线登记，
 * 编号已终态落地；8 处 src/index.js 接线由 1 号主力补全，接线规格见
 * coordination/reports/r228-dimension-agent4.md §五。另 3 个已起草维度
 * zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220) 经核查至今仍未接线（src/index.js
 * 零命中），故本模块按 VERIFY_DIMS 登记序稳取 215，「三老模块先接、
 * 顺延 216」的情形未发生，编号终态无歧义。）
 *
 * [r228 立项] r220 零命中探针遗留候选 H 族（coordination/agent4/probes/
 * r220-zerohit-probe.output.txt，v6.8.144 实测 H1/H2 gate.action=pass 且
 * 零维度承重）。r228 复探针（coordination/agent4/probes/
 * r228-zerohit-probe.js，10 攻击 + 7 良性，v6.8.144 实测输出见同目录
 * .output.txt）：8/10 攻击完全穿引擎（另 2 条被非维度泛化层 rewrite/
 * verify 但 findings 为空、零维度承重），良性侧 3 条 verify 亦为预存
 * 泛化层行为、零维度承重。v6.8.145（审计实例补接线 sorites/
 * researcher_degrees/monocausal 三维度后）复跑：攻击仍 8/10 pass、
 * 良性仍 3/7 verify 且全部 dims=[]——零命中结论在当前引擎成立
 * （coordination/agent4/probes/r228-zerohit-probe-v145.output.txt）。覆盖度检查：illicit_conversion（第 167 维）
 * 只管**全称量词的逻辑换位**（所有A是B→所有B是A），base_rate_neglect
 * （第 169 维）只管「阳性信号×高置信结论」且**无数值条件结构**，
 * affirming_the_consequent 只管逻辑蕴涵式——src/ 下没有任何维度判
 * 「同一个概率数值在条件方向翻转后被原样沿用」。
 *
 * 外部来源：空返，按既有形态自建。r228 海外扫描（原始证据
 * coordination/agent4/scout/）：arXiv 短语精确查询两次超时（0 字节
 * 响应）；GitHub repos "prosecutor fallacy"/"confusion of the inverse"
 * 共 2 条（cboettig/prosecutors-fallacy 2★ 是 early-warning 预测市场
 * 笔记本、lorarjohns/prosecutors_fallacy 0★），"base rate fallacy"
 * 11 条全是课堂演示/可视化/R 分析代码（0★），均非可集成的纯规则文本
 * 检测模块；Semantic Scholar 无有效计数。判据为心虫自有纯规则实现
 * （家族定义取自 confusion of the inverse / prosecutor's fallacy 的
 * 标准统计学描述：P(证据|情形) 与 P(情形|证据) 是两个不同的量）。
 *
 * 辨别的族：条件概率换位（confusion of the inverse / prosecutor's
 * fallacy 的结构形）——拿**一个方向的条件概率数值**，在**方向翻转
 * 后原样沿用**：先把「证据在无辜者中出现的概率」说成百万分之一，
 * 再据此推出「被告无辜的概率」也是百万分之一。两个概率一个是
 * P(E|I) 一个是 P(I|E)，数值相同纯属换位，不是推论：
 *   证据在无辜者身上出现的概率只有百万分之一，所以被告无辜的几率
 *     也只有百万分之一。
 *   在守法者中，这个账户模式出现的概率是十万分之一，因此有这种账户
 *     模式的人是守法者的概率也是十万分之一。
 *   健康人群里携带该基因的概率只有百分之一，所以携带该基因的人是
 *     健康人的概率也只有百分之一。
 *   The match has a 1-in-a-million chance if he is innocent, so there
 *     is only a 1-in-a-million chance he is innocent.
 *   Only 0.1% of healthy people carry this marker, so only 0.1% of
 *     people carrying this marker are healthy.
 *
 * 为什么这是判别者的核心缺口：这是法庭统计学里最经典的推理事故
 * （检察官谬误）。P(E|I) 可以由物证鉴定直接测出（无辜者中吻合的
 * 比例），P(I|E) 却取决于基础概率——罕见特征下前者极小推不出后者
 * 极小。把鉴定所的似然数字洗成后验结论，会让「物证罕见」冒充
 * 「被告有罪」，且该结构在医学筛查、风控标记、基因携带等场景通用。
 *
 * 与既有维度的边界（r228 归因）：
 *   · illicit_conversion（第 167 维）管**全称量词的逻辑换位**（所有
 *     A是B→所有B是A），命题级无数值；本族管**概率数值在条件方向
 *     翻转后原样沿用**，核心签名是「同一数值出现两次 + 一次在条件
 *     框内、一次在推断词后」。
 *   · base_rate_neglect（第 169 维）管「阳性信号×高置信结论」的
 *     后验跳跃，全程可无数字；本族**必须有概率数值（或极值标记）
 *     两腿同一**，错在换位不在忽略基数。
 *   · affirming_the_consequent 管逻辑蕴涵式误推；本族是概率条件
 *     的数值换位，不涉及若P则Q的命题形式。
 *   · appeal_to_probability（第 152 维）管「基数/重复→一定发生」；
 *     本族两个概率陈述都在场，错在方向不在规模。
 *
 * 判据（换位签名，四要件共现，缺一不判）：
 *   ① 数值两现：同一个概率数值（百万分之一=one in a million=1e-6，
 *      0.1%=千分之一）或同一个极值标记（微乎其微/extremely small）
 *      在文中出现两次；
 *   ② 腿① FWD 条件框：前一个数值落在**条件/人群框**内（在X中/X里/
 *      X身上、如果X、若X、假设X、X中+概率词；EN among X / in X /
 *      of X / if X / given X / when X）；
 *   ③ 腿② INV 推断结论：后一个数值落在**结论性推断词**之后（所以/
 *      因此/因而/据此/可见/那么/这说明/意味着/足以证明；EN so/
 *      therefore/thus/hence/which means/that means）；
 *   ④ 实体回指：腿①条件框的实体词（无罪者→无辜、守法者→守法、
 *      healthy→healthy）必须出现在推断词之后的结论子句里——换位的
 *      本质就是**条件与结论的主体互换**（P(E|I) 说成了 P(I|E)），
 *      纯复述（「如果他没准备，通过的可能性极低，所以通过的可能性
 *      也极低」）因实体不回指而不判。
 *   否定守卫：推断词前 8 字/14 字符内、或结论数值前 8 字/14 字符内
 *     出现否定标记（不能/并非/不等于/推不出；EN not/cannot/does
 *      not）→ 是正确判别，不判。
 *
 * 为什么取 VERIFY 级：单句也可能是对两个总体的分别实测报告、课堂
 * 案例、新闻报道转述，或「同值两总体」的正当陈述（两批差错率都
 *      是2%且分别测得）。verify 的含义是「这段文本把一个方向的概率
 * 数值原样用在了反方向，需要回到基础概率与似然/后验的区别重新
 * 核实」——调用方应要求分别给出两个方向各自的测量依据，而不是
 * 接受数值换位得出的结论。
 *
 * 明确不判的（豁免）：
 *   · 基础概率语言在场（基础概率/基准率/先验概率/患病率/假阳性率/
 *     阳性预测值/贝叶斯；EN base rate / prior probability /
 *     prevalence / false positive / positive predictive / Bayes）：
 *     陈述概率原理或引述谬误概念，是在破除或分析它；
 *   · 正确判别标记（不能换算/不能反向/不能据此/推不出/并不意味着/
 *     不等于/是两回事；EN does not transpose / cannot be inferred /
 *     not the same as）——指出换位不成立正是本族要教的判别动作；
 *   · 教学/概念转述（教学/课堂/教材/论文/称为/定义为/概念/谬误/
 *     例子；EN textbook / lecture / teaching / fallacy / prosecutor's
 *     fallacy / confusion of the inverse / cognitive bias）；
 *   · 估计/抽样语言（预计/估计/抽样/样本/约有/测算；EN expected /
 *     estimated / approximately / survey / sample / projected）——
 *     结论带估计语气时更可能是分别测算而非换位；
 *   · 疑问句（含 ?/？）——但反问标记（难道/岂/何尝/岂不是；EN isn't
 *     it / how else / what else）不豁免：用问号包装的断言仍是断言。
 *
 * [r265] 全新措辞家族扩展（真升级②，live 生效，维度计数不变）：
 * r265 池化探针（coordination/agent4/probes/r265-probe-pool.js，v6.8.156
 * 实测）本维度 4/4 攻击全穿透（gate.action=pass 且零维度承重，全池最高），
 * 落地：
 *   · 新 token 种 kind='prop'（定性比例两现）：ZH_PROP_RES（大多数/过半/
 *     多数/大半/绝大多数，归一化剥离「占了/占」前缀，两侧须同一比例词）
 *     + EN_PROP_RES（most/majority）——原实现只收「数值 + 极值」两种
 *     token，同一换位签名换一身非数字措辞即可穿过；
 *   · FRAME_ZH += F-Z4「对X来说/而言/来讲」条件框——探针实测「对这批
 *     志愿者来说，大多数人都出现了缓解；因此对于出现缓解的人……」穿透
 *     （限定人群的「对X来说」框形原不在 FRAME_ZH）。
 *   良性侧：无数字形不降低判别强度（仍要求同词两现 + 框内前数 + 推断词
 *   后数 + 实体回指四要件），5 条新良性（含「但城市学生的录取率要用总体
 *   分母算」「that does not mean」）零误伤。
 */
'use strict';

// ─── 中文概率数值抽取（归一化到 (0,1) 的数值）────────────────────
const ZH_SCALE = { '百': 100, '千': 1000, '万': 10000, '十万': 100000, '百万': 1000000, '千万': 10000000, '亿': 100000000 };
const ZH_DIGIT = { '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };

function zhNum(s) {
  if (/^\d+(?:\.\d+)?$/.test(s)) return parseFloat(s);
  if (s === '十') return 10;
  let m = /^([一二两三四五六七八九])?十([一二两三四五六七八九])?$/.exec(s);
  if (m) return (m[1] ? ZH_DIGIT[m[1]] : 1) * 10 + (m[2] ? ZH_DIGIT[m[2]] : 0);
  if (ZH_DIGIT[s] != null) return ZH_DIGIT[s];
  return null;
}

const ZH_VALUE_RES = [
  { re: /(百万|千万|亿|十万|万|千|百)分之一/g, to: (m) => 1 / ZH_SCALE[m[1]] },
  { re: /百分之([0-9]+(?:\.[0-9]+)?|[一二两三四五六七八九]十[一二两三四五六七八九]?|[一二两三四五六七八九])/g, to: (m) => { const n = zhNum(m[1]); return n == null ? null : n / 100; } },
  { re: /([0-9]+(?:\.[0-9]+)?)\s*[%％]/g, to: (m) => parseFloat(m[1]) / 100 },
  { re: /千分之([0-9]+(?:\.[0-9]+)?|[一二两三四五六七八九])/g, to: (m) => { const n = zhNum(m[1]); return n == null ? null : n / 1000; } },
  { re: /万分之([0-9]+(?:\.[0-9]+)?|[一二两三四五六七八九])/g, to: (m) => { const n = zhNum(m[1]); return n == null ? null : n / 10000; } },
  { re: /([0-9]+(?:\.[0-9]+)?)\s*‰/g, to: (m) => parseFloat(m[1]) / 1000 },
];

// ─── 英文概率数值抽取 ────────────────────────────────────────────
const EN_NUM_WORD = {
  // [r249] 补全 11-100 词形（原先只到 ten，导致
  // "ninety-five percent" 一类整族无法解析）。
  zero: 0, once: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  a: 1, an: 1,
};
const EN_SCALE = { hundred: 100, thousand: 1000, million: 1000000, billion: 1000000000 };

const EN_VALUE_RES = [
  {
    re: /\b(once|one|two|three|four|five|six|seven|eight|nine|ten|\d+(?:\.\d+)?)[\s-]in[\s-](a[\s-]|an[\s-]|one[\s-]|ten[\s-]|\d+[\s-])?(hundred[\s-])?(thousand|million|billion)\b/gi,
    to: (m) => {
      const num = /^\d/.test(m[1]) ? parseFloat(m[1]) : EN_NUM_WORD[m[1].toLowerCase()];
      let mid = 1;
      if (m[2]) { const t = m[2].replace(/[\s-]/g, '').toLowerCase(); mid = /^\d/.test(t) ? parseFloat(t) : (EN_NUM_WORD[t] || 1); }
      const hundred = m[3] ? 100 : 1;
      const scale = EN_SCALE[m[4].toLowerCase()];
      if (num == null || mid == null || !scale) return null;
      return num / (mid * hundred * scale);
    },
  },
  { re: /\b(\d+(?:\.\d+)?)\s*%/g, to: (m) => parseFloat(m[1]) / 100 },
  // [r249] 英文 percent 词汇形（"95 percent" / "ninety-five percent"）：
  // r249 变体矩阵实测发现英文侧只收 "%" 符号形，最常见的
  // "the test is positive 95 percent of the time" 整族漏判——
  // 同一形状在中文侧由「百分之N」覆盖，英文侧原本不对称。
  // 这是本维度英文腿的句式族缺口，不是负例补丁。
  { re: /\b(\d+(?:\.\d+)?)\s+percent\b/gi, to: (m) => parseFloat(m[1]) / 100 },
  { re: /\b(zero|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s+percent\b/gi, to: (m) => (EN_NUM_WORD[m[1].toLowerCase()] || 0) / 100 },
];

// ─── 极值标记族（无数字形的两腿同一标记）────────────────────────
const EXTREME_ZH = [
  /微乎其微/, /几乎不可能/, /几乎为零/, /接近于零|接近零/, /希望渺茫/, /微不足道/,
  /概率极低|几率极低/, /可能性极小|概率极小|几率极小/, /极其微小|极小|极其小/,
];
const EXTREME_EN = [
  /extremely\s+(?:small|unlikely|improbable)/i,
  /very\s+unlikely|highly\s+unlikely|most\s+unlikely/i,
  /vanishingly\s+small/i, /practically\s+(?:zero|impossible)/i,
  /close\s+to\s+zero/i, /almost\s+impossible/i, /slim\s+to\s+none/i,
  /negligible/i, /minuscule/i,
];

// ─── [r265] 定性比例标记族（无数字形的比例两现）────────────────────
// r265 池化探针实测（四攻击全穿透）：本维度原只收「数值 + 极值」两种
// token，「占了多数 / most」类定性比例的原样沿用完全无覆盖——同一换位
// 签名换一身非数字措辞即可穿过。归一化剥离前缀（占了/占），要求两侧
// 同一比例词（多数 ≠ 大多数，从严）。
const ZH_PROP_RES = [
  { re: /(?:占了|占)?(大多数|过半|多数|大半|绝大多数)/g, to: (m) => m[1] },
];
const EN_PROP_RES = [
  { re: /\b(most|majority)\b/gi, to: (m) => m[1].toLowerCase() },
];

// ─── 腿① 条件/人群框（ent 组为实体）──────────────────────────────
const FRAME_ZH = [
  // F-Z1 在X中/里/身上/内部/之列
  { re: /在([^，。；！？,;!?]{2,16}?)(?:中|当中|里|内部|之列|身上)/g, ent: 1 },
  // F-Z2 如果/若/假设/倘若/要是 X（至标点或 时/的话 止）
  { re: /(?:如果|若|假设|倘若|要是)([^，。；！？,;!?]{2,24}?)(?=时|的话|，|,|。|；)/g, ent: 1 },
  // F-Z3 X中/里 + 24 字内出现概率词（无介词的人群框架形）
  { re: /([\u4e00-\u9fff]{2,12})(?:中|里)(?=[^，。；！？]{0,24}(?:概率|几率|可能性))/g, ent: 1 },
  // [r265] F-Z4 对X来说/而言/来讲——r265 池化探针实测「对这批志愿者
  // 来说，大多数人都出现了缓解；因此对于出现缓解的人……」穿透：限定
  // 人群的「对X来说」框形原不在 FRAME_ZH
  { re: /对([^，。；！？,;!?]{2,16}?)(?:来说|而言|来讲)/g, ent: 1 },
];
const FRAME_EN = [
  // F-E1 among/in/of/if/given/when/for + 至多 7 词的实体短语
  // （r228 实测：5 词帽会漏 "given that the account belongs to a
  //   law-abiding citizen" 这类长条件实体）
  { re: /\b(?:among|in|of|if|given|when|for)\s+((?:[a-z'-]+\s+){0,6}[a-z'-]+)/gi, ent: 1 },
];

// ─── 腿② 结论性推断词 ───────────────────────────────────────────
const INFER_ZH = /所以|因此|因而|据此|故而|可见|那么|这说明|这意味着|足以证明|说明|意味着|表明/;
const INFER_EN = /\b(?:so|therefore|thus|hence|consequently|which\s+means|that\s+means|it\s+follows|this\s+shows|this\s+means|means\s+that|shows\s+that)\b/i;

// ─── 否定守卫（窗口化）──────────────────────────────────────────
// 注意（r228 实测教训）：NEG_EN 不得收录 unlikely——"highly unlikely"
// 本身是极值标记（EXTREME_EN），收录它会令守卫在标记自身上下文误触发，
// 把无数值形攻击放跑（A11 实测）。ZH 侧 NEG_ZH 与 EXTREME_ZH 无同类碰撞。
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|不会|不是说|不能说|谈不上|并没有|也不存在|不等于|推不出|无法据此|难以|难以据此/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|neither|nor|no\s+longer|far\s+from)\b/i;

// ─── 豁免一：基础概率语言（计及基础概率的正确分析/破除此族的概念陈述）──
// 注意（r228 实测教训）：裸词「假阳性/false positive」会造成误豁免——
// 攻击腿①「健康者中假阳性出现的概率是百万分之一」天然含该词。只保留
// 复合形式（假阳性率/false positive rate/阳性预测值），裸词不收。
const EXEMPT_BASERATE_ZH = [
  /基础概率|基准率|基本率|先验概率|先验|患病率|发病率|假阳性率|假阴性率|真阳性|阳性预测值|阴性预测值|贝叶斯|似然/,
];
const EXEMPT_BASERATE_EN = [
  /\bbase\s+rate\b/i, /\bprior\s+probability\b/i, /\bprevalence\b/i, /\bBayes\b/i,
  /\bfalse\s+positive\s+rate\b/i, /\bpositive\s+predictive\b/i, /\bnegative\s+predictive\b/i,
];

// ─── 豁免二：正确判别标记（指出换位不成立正是要教的判别动作）────────
const EXEMPT_CORRECT_ZH = [
  /不能换算|不能反向|不能据此|不能直接|推不出|并不意味着|不等于|不代表|不足以|无法据此|难以据此|并非一回事|是两回事|两个概率|两个方向/,
];
const EXEMPT_CORRECT_EN = [
  /does\s+not\s+transpose|doesn'?t\s+transpose/i,
  /cannot\s+be\s+(?:inferred|transposed|equated|converted|flipped)/i,
  /not\s+the\s+same\s+(?:probability|thing|quantity)/i,
  /do\s+not\s+(?:transpose|equate)/i,
];

// ─── 豁免三：教学/概念转述 ───────────────────────────────────────
const EXEMPT_META_ZH = [
  /教学|课堂|教科书|教材|讲座|教案|习题|论文|文献|称为|定义为|概念|所谓|是指|悖论|谬误|误区|常见错误|认知偏误|思维陷阱|统计素养|例子|案例/,
];
const EXEMPT_META_EN = [
  /\btextbook\b/i, /\blecture\b/i, /\bteaching\b/i, /\bfor\s+example\b/i,
  /\bfallacy\b/i, /\bmisconception\b/i, /\bcognitive\s+bias\b/i,
  /prosecutor'?s\s+fallacy/i, /confusion\s+of\s+the\s+inverse/i, /inverse\s+fallacy/i,
];

// ─── 豁免四：估计/抽样语言 ───────────────────────────────────────
const EXEMPT_ESTIMATE_ZH = [
  /预计|估计|抽样|样本|约有|大约|大致|粗略|测算|推算|统计显示|统计表明|调查显示|调研显示|估算/,
];
const EXEMPT_ESTIMATE_EN = [
  /\bexpected\b/i, /\bestimated\b/i, /\bapproximately\b/i, /\broughly\b/i,
  /\bsurvey\b/i, /\bsample[ds]?\b/i, /\bprojected\b/i, /\bforecast\b/i,
];

// ─── 实体回指的停用词（EN）与泛用二元组（ZH）────────────────────
const STOP_EN = new Set(('he she it they we you i me him her them us my your his its our their ' +
  'the a an of in on for to and or that this these those is are was were be been being will would ' +
  'shall should can could may might must do does did have has had not no as at by with from if when ' +
  'given among so than then there here what which who whom whose how all any both each few more most ' +
  'other some such only own same too very just also about into over under again once one two three ' +
  'four five six seven eight nine ten hundred thousand million billion').split(/\s+/));

const GENERIC_ZH_BIGRAM = new Set(('他是 这是 那是 还是 就是 一个 这个 那个 我们 你们 他们 她们 它们 ' +
  '可以 不是 没有 的人 人群 时候 什么 怎么 这样 那样 如果 因为 所以 因此 而且 但是 不过 或者 ' +
  '以及 对于 关于 通过 进行 相关 存在 出现 具有 属于 用于 以来 以后 以前 之后 之前 其中 当中 ' +
  '上的 下的 内的 外的 大的 小的 高的 低的 好的 坏的 真的 假的 可能 概率 几率 中出现').split(/\s+/));

// 邻近窗（中文按字、英文按字符）
const WIN_FRAME_VAL_ZH = 80;    // 腿①条件框 ↔ 前数（双向）
const WIN_FRAME_VAL_EN = 200;
const WIN_INFER_TAIL_ZH = 60;   // 推断词 → 后数
const WIN_INFER_TAIL_EN = 160;
const WIN_TAIL_ZH = 40;         // 结论子句尾（后数之后再取一段做实体回指）
const WIN_TAIL_EN = 120;
const WIN_NEG_ZH = 8;
const WIN_NEG_EN = 14;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 全文扫描所有命中的位置（global 安全）
function allIdx(list, text) {
  const out = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ idx: m.index, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return out;
}

// 概率数值 / 极值标记 token 抽取
function extractTokens(text, isZh, R) {
  const out = [];
  const vres = isZh ? (R.ZH_VALUE_RES || ZH_VALUE_RES) : (R.EN_VALUE_RES || EN_VALUE_RES);
  for (const { re, to } of vres) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      let v = null;
      try { v = to(m); } catch (e) { v = null; }
      if (v == null || !isFinite(v) || v <= 0 || v >= 1) continue;
      out.push({ kind: 'value', v, idx: m.index, end: m.index + m[0].length, raw: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  const eres = isZh ? (R.EXTREME_ZH || EXTREME_ZH) : (R.EXTREME_EN || EXTREME_EN);
  for (const hit of allIdx(eres, text)) {
    out.push({ kind: 'extreme', v: hit.text.replace(/\s+/g, ' ').toLowerCase(), idx: hit.idx, end: hit.idx + hit.text.length, raw: hit.text });
  }
  // [r265] 定性比例 token（kind='prop'）：归一化后的同一比例词两现
  const pres = isZh ? (R.ZH_PROP_RES || ZH_PROP_RES) : (R.EN_PROP_RES || EN_PROP_RES);
  for (const { re, to } of pres) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      let v = null;
      try { v = to(m); } catch (e) { v = null; }
      if (!v) continue;
      out.push({ kind: 'prop', v, idx: m.index, end: m.index + m[0].length, raw: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  // 去重：同一正则族可能重叠命中同一处（如「百分之一」同时被
  // /X分之一/ 与 /百分之N/ 命中），按 kind+idx+raw 去重
  const seen = new Set();
  const dedup = [];
  for (const t of out) {
    const key = t.kind + '|' + t.idx + '|' + t.raw;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(t);
  }
  dedup.sort((a, b) => a.idx - b.idx);
  return dedup;
}

// 腿① 条件/人群框（含实体）
function findFrames(text, isZh, R) {
  const list = isZh ? (R.FRAME_ZH || FRAME_ZH) : (R.FRAME_EN || FRAME_EN);
  const out = [];
  for (const f of list) {
    const reG = new RegExp(f.re.source, f.re.flags.includes('g') ? f.re.flags : f.re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      const entity = m[f.ent] || '';
      if (entity && entity.length >= 2) {
        out.push({ start: m.index, end: m.index + m[0].length, entity });
      }
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return out;
}

// 实体回指词：中文取实体二元组（滤泛用），英文取 ≥3 字母实词（滤停用）
function entityTokens(entity, isZh) {
  if (isZh) {
    const out = [];
    for (let i = 0; i + 2 <= entity.length; i++) {
      const b = entity.slice(i, i + 2);
      if (!GENERIC_ZH_BIGRAM.has(b)) out.push(b);
    }
    return out;
  }
  return entity.toLowerCase().split(/[^a-z'-]+/).filter(w => w.length >= 3 && !STOP_EN.has(w));
}

// 窗口化否定守卫：位置前 n 字/字符内不得有否定标记
// （R 为负例注入对象：NEG_ZH/NEG_EN 可被替换以验证守卫承重）
function negatedBefore(text, idx, isZh, R) {
  if (idx < 0) return false;
  const n = isZh ? WIN_NEG_ZH : WIN_NEG_EN;
  const pre = text.slice(Math.max(0, idx - n), idx);
  if (isZh) return (R && R.NEG_ZH ? R.NEG_ZH : NEG_ZH).test(pre);
  return (R && R.NEG_EN ? R.NEG_EN : NEG_EN).test(pre);
}

// 推断词全部命中位置
function findInfers(text, isZh, R) {
  const re = isZh ? pickRe(R.INFER_ZH, INFER_ZH) : pickRe(R.INFER_EN, INFER_EN);
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 同一 token：数值相等（相对容差）或极值/比例标记同一
function sameToken(t1, t2) {
  if (t1.kind !== t2.kind) return false;
  if (t1.kind === 'value') {
    const scale = Math.max(1, Math.abs(t1.v), Math.abs(t2.v));
    return Math.abs(t1.v - t2.v) <= 1e-9 * scale;
  }
  return t1.v === t2.v;
}

// 结论子句起点：推断词前最后一个分隔符之后。结论的主语可能出现在
// 推断词之前（"the probability that X is Y is therefore also V"），
// 只从推断词之后开会漏掉回指实体（r228 H10 实测教训）。
function clauseStart(text, fromIdx, isZh) {
  const DELIM = /[。；;！？!?，,\n]/g;
  let last = -1;
  let m;
  DELIM.lastIndex = 0;
  while ((m = DELIM.exec(text)) !== null) {
    if (m.index >= fromIdx) break;
    last = m.index;
  }
  const back = isZh ? 60 : 160;
  return Math.max(last + 1, fromIdx - back);
}

// 单语言侧的换位签名搜索
function findSignatures(text, isZh, R) {
  const tokens = extractTokens(text, isZh, R);
  if (tokens.length < 2) return [];
  const frames = findFrames(text, isZh, R);
  const infers = findInfers(text, isZh, R);
  const winFV = isZh ? WIN_FRAME_VAL_ZH : WIN_FRAME_VAL_EN;
  const winIT = isZh ? WIN_INFER_TAIL_ZH : WIN_INFER_TAIL_EN;
  const winTail = isZh ? WIN_TAIL_ZH : WIN_TAIL_EN;
  const sigs = [];

  for (const inf of infers) {
    for (const t2 of tokens) {
      if (t2.idx <= inf.idx || t2.idx - inf.end > winIT) continue;          // 后数须在推断词后
      if (negatedBefore(text, inf.idx, isZh, R) || negatedBefore(text, t2.idx, isZh, R)) continue; // 否定守卫
      for (const t1 of tokens) {
        if (t1.idx >= inf.idx) continue;                                    // 前数须在推断词前
        if (!sameToken(t1, t2)) continue;                                   // 要件① 数值两现同一
        for (const fr of frames) {
          const fm = (fr.start + fr.end) / 2, tm = (t1.idx + t1.end) / 2;
          if (Math.abs(fm - tm) > winFV) continue;                          // 要件② 前数在条件框内
          const toks = entityTokens(fr.entity, isZh);
          if (toks.length === 0) continue;
          const cs = clauseStart(text, inf.idx, isZh);
          const clause = text.slice(cs, Math.min(text.length, t2.idx + winTail));
          if (!toks.some(t => clause.includes(t))) continue;                // 要件④ 实体回指
          sigs.push({ t1, t2, entity: fr.entity, inferIdx: inf.idx });
          break;
        }
        if (sigs.length) break;
      }
      if (sigs.length) break;
    }
    if (sigs.length >= 3) break;
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkConditionalTransposition(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免：仅当句中无反问标记时豁免（用问号包装的断言仍是断言）
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|谁不知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }

  // 豁免一/二/三/四（任一命中即不判——基础概率语言、正确判别标记、
  // 教学转述、估计抽样语气都是在破除或分析本族，不是运用它）
  if (anyHit(R.EXEMPT_BASERATE_ZH || EXEMPT_BASERATE_ZH, text) || anyHit(R.EXEMPT_BASERATE_EN || EXEMPT_BASERATE_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_ESTIMATE_ZH || EXEMPT_ESTIMATE_ZH, text) || anyHit(R.EXEMPT_ESTIMATE_EN || EXEMPT_ESTIMATE_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 双语双跑：中文侧与英文侧各自搜索换位签名（混排文本两侧都可能承重）
  const sigs = [
    ...findSignatures(text, true, R).map(s => ({ ...s, lang: 'zh' })),
    ...findSignatures(text, false, R).map(s => ({ ...s, lang: 'en' })),
  ];
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const shown = s.t1.kind === 'value'
    ? '概率值 ' + s.t1.raw + ' → ' + s.t2.raw
    : s.t1.kind === 'prop'
      ? '定性比例「' + s.t1.raw + '」两现'
      : '极值标记「' + s.t1.raw + '」两现';
  return {
    hit: true,
    score: 0.6,
    count: sigs.length,
    detail: s.lang === 'zh'
      ? '条件概率换位：' + shown + ' 在条件框「' + s.entity + '」与推断结论间原样沿用(zh)'
      : 'conditional transposition: ' + shown + ' reused verbatim across the conditional frame "' + s.entity + '" and the inferred conclusion(en)',
  };
}

module.exports = {
  checkConditionalTransposition,
  __internals: () => ({
    ZH_VALUE_RES, EN_VALUE_RES, EXTREME_ZH, EXTREME_EN,
    ZH_PROP_RES, EN_PROP_RES,
    FRAME_ZH, FRAME_EN, INFER_ZH, INFER_EN, NEG_ZH, NEG_EN,
    EXEMPT_BASERATE_ZH, EXEMPT_BASERATE_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_ESTIMATE_ZH, EXEMPT_ESTIMATE_EN,
  }),
};
