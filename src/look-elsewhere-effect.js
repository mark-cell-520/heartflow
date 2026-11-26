/**
 * src/look-elsewhere-effect.js — 「look-elsewhere effect / 多重搜索下的
 * 假阳性误读」检测器
 * （provisional 第 297 个判别维度，r483 起草；src/index.js 接线由 1 号主力
 * 登记，dispatch 经插件层 src/plugins/look-elsewhere-effect-check/，
 * 同 r294/r295/r296 先例）
 *
 * [r483 立项] 候选池穿透实测 coordination/agent4/r483-probe-pool.js
 * （v6.8.241 gate() 口径，输出 coordination/agent4/r483-probe-pool.output.txt）：
 *   · A look-elsewhere 多团队/多地域/多指标独立显著性：穿透 **5/9**；
 *   · B 未校正多重比较（存量 p-hacking 对照）：穿透 2/6；
 *   · C 巧合≠噪声（存量 clustering 对照）：穿透 2/2；
 *   · D 事后选指标（存量 RDF 对照）：穿透 2/2；
 *   · E 多人共识=证据（存量对照）：穿透 1/2。
 * 良性基线 6 条：本族零误伤（3 条被存量维度代拦，与本族无关）。
 *
 * 辨别的族：look-elsewhere effect（look-elsewhere effect / multiple
 * comparisons / trials factor / garden of forking paths 的**读数端**）——
 * 文本先**陈述搜索空间的宽度**（多方独立搜索、多地重复、多指标扫描、
 * 大量重复实验），再据此**把某处撞出的显著性当作「信号为真」「独立
 * 验证」「不是噪声」「结论稳健」的证据**，完全不提「搜索次数越多，
 * 假阳性率越高」：
 *   全球有二十个团队独立扫描了这片天区，大家都找到了同一个显著性峰值，
 *     说明这个信号是真的。
 *   我们换了五个国家重新做了一遍，每个国家都能做出显著结果，这足以证明
 *     结论稳健。
 *   Twenty independent teams scanned the same sky region and all found the
 *     same significant peak, which confirms the signal is real.
 *   With so many groups running the test, a few are bound to hit significance
 *     — which shows the effect is genuine.
 *
 * 为什么现有维度拦不住：
 *   · p-hacking（第 58 维度族）腿①是**流程被结果反向决定**（事后选指标/
 *     采到显著为止/择优报告），腿②显著性封装；本族**没有任何流程污染
 *     标记**——它甚至以「独立」「交叉验证」自居，问题在于搜索空间的
 *     宽度被完全忽视。存量对本族 EN 形大面积穿透（探针 A：EN 3/4 穿透）。
 *   · clustering_illusion（第 171 维度）腿①聚集陈述腿②显著性归因
 *     （巧合/蹊跷/邪门），本族不依赖聚集语义、结论也不是「反常」而是
 *     「真实/稳健/已验证」。
 *   · researcher_degrees_of_freedom（第 26 维度族）管**分析流程**被结果
 *     反向决定（假设时点/终点选择/停止规则），本族管的是**多次独立搜索
 *     下假阳性率升高被忽视**——搜索者之间甚至互不知晓。
 *   · cherry_picking（第 180 维度）管取证范围被裁剪，本族范围恰恰是
 *     「很宽」，裁剪方向相反。
 *   · base_rate_neglect（第 169 维度）管阳性信号无视先验，本族不涉及
 *     先验概率、涉及的是 trials factor（搜索次数）。
 *
 * 判据（双腿 AND + 邻近窗 + 三类豁免 + 否定守卫，缺一不判）：
 *   ① 腿① SEARCH 搜索空间宽度陈述——多方独立（N 个团队/机构/实验室/
 *      课题组/研究者/小组 + 独立/分别/各自）、多地域重复（N 个国家/城市/
 *      地区）、多指标/多子群扫描（N 个指标/子群/参数/组合/变量 + 扫/试/
 *      测）、大量重复实验（N 次重复实验/检验/测试）；EN 同构。
 *   ② 腿② SIGNIF 显著性当验证断言——信号为真/是真的/真实存在/不是噪声/
 *      不是偶然/交叉验证/说明这不是噪声/证明结论稳健/足以证明/这正说明/
 *      还能是偶然吗/效应真实/规律普遍成立；EN confirms / is real / must be
 *      real / genuine / cannot be chance / proves / confirms / which shows /
 *      so it must be / robust。
 *   ③ 两腿间距 ≤ 同窗（ZH 80 字 / EN 220 字符），方向不限——本族攻击
 *      惯用「先铺陈搜索宽度、后下显著性结论」的长句结构。
 *   ④ 腿①腿②均查紧邻否定前缀。
 *   ⑤ 豁免 A 校正纪律在场（Bonferroni/FDR/假发现率/多重比较校正/
 *      trials factor/后验概率/校正后/prespecified/preregistered/corrected
 *      p-value）——做了校正的陈述正是本维度要教的判别动作。
 *   ⑥ 豁免 B 收敛/阴性结果在场（也有团队报告阴性/结论不一致/ pooled all
 *      results / did not replicate /  pooled/分层分析）——把全部结果都
 *      计入的汇总不是拿阳性当验证。
 *   ⑦ 豁免 C 概念评析（look-elsewhere effect / 多重比较/搜索空间/trials
 *      factor——讨论这个概念本身不是运用它）。
 *
 * verify 级——单句可能是对多重比较问题的**正确描述与批评**（「并不是说
 * 二十个团队都找到显著就证明信号为真，搜索空间越大假阳性越多」正是本族
 * 要教的判别动作）、论文方法学转述、或统计学课堂案例。verify 的含义是
 * 「这个以搜索宽度支撑的显著性断言没有给出 trials factor 校正，采信前
 * 必须补上多重比较校正/先验概率/阴性结果汇总」。
 */
'use strict';

// ─── 数量词（腿①限定「宽度」的量化落点，防裸词泛化）──────────────────
// 收中英文数字 + 概数量词；「够多/足够多」由 SEARCH_ZH 的独立族覆盖。
const NUM_ZH = '(?:\\d+|若干|几十|数十|上百|数百|上千|好几|许多|很多|众多|不少|大量|多个|多少|十几|数(?:十|百|千|万)|[一二两三四五六七八九十百千万]+)';
const NUM_EN = '(?:\\d+|dozens of|hundreds of|thousands of|many|numerous|several|multiple|lots of|a good number of|a few of the)';

// ─── 腿①：搜索空间宽度（中文）────────────────────────────
const SEARCH_ZH = new RegExp([
  // a 多方独立搜索：N + 搜索主体 + 独立/分别/各自 + 搜索动词
  `${NUM_ZH}(?:个|家|组|名|位)?(?:团队|机构|实验室|课题组|研究者|小组|队伍|学者|分析团队|科研团队|医院|大学)`,
  '(?:不同|多个|数个|数个|若干)(?:的)?(?:分析)?(?:团队|机构|实验室|课题组|研究者|小组|队伍)',
  '(?:不同|多个|数个)(?:国家|城市|地区|场景|指标|子群|参数|变量)',
  '(?:独立|分别|各自|分别地|先后)(?:地)?(?:扫描|搜索|检索|排查|检验|测试|测量|分析|翻来覆去|反复|重复|做过|进行)',
  '(?:翻来覆去|反复|反复地|来回|轮番)(?:地)?(?:检验|测试|扫描|验证|分析|试)',
  // b 多地域/多场景重复
  `${NUM_ZH}(?:个|座|所)?(?:国家|城市|地区|省份|场景|样本群|批次|医院|学校|公司)`,
  // c 多指标/多子群/多参数扫描
  `${NUM_ZH}(?:个|种|类|组|条|批)?(?:指标|子群|参数|组合|变量|维度|口径|切分|窗口|阈值|模型|方案|配方|饮食|变量组合)`,
  '(?:扫|扫描|扫出|试|测试|测|检验|比对|跑)(?:了|过|出)?(?:一下|一遍|下来)?',
  // d 大量重复实验/检验
  `${NUM_ZH}(?:次|回|轮)(?:重复)?(?:实验|检验|测试|试验|重复|复制)`,
  // e 概数宽度（不依赖具体数字）
  '(?:这么|那么)(?:多|些)(?:团队|机构|实验室|课题组|研究者|小组|队伍|城市|国家|指标|子群|参数|重复|检验|尝试)',
  '指标?够多|搜索范围够大|扫描范围够大|试了这么多种',
  '搜索空间|扫描范围|检验次数|尝试次数|重复次数',
].join('|'));

// ─── 腿①：搜索空间宽度（英文）────────────────────────────
const SEARCH_EN = new RegExp([
  '\\b(?:twenty|thirty|forty|fifty|hundred|thousand|dozens of|hundreds of|many|numerous|multiple|several|\\d+)\\s+(?:\\w+\\s+){0,2}(?:teams?|groups?|labs?|laboratories|researchers?|institutions?|investigators?|analysts?|squads?)\\b',
  '\\b(?:independent|separately|independently)\\s+(?:\\w+\\s+){0,2}(?:scanned?|scanning|searched?|searching|tested?|testing|examined?|analy[sz]ed?|replicated?|replicating|ran|run|found|reported)\\b',
  '\\b(?:multiple|several|different|various|numerous)\\s+(?:research\\s+|analysis\\s+)?(?:teams?|groups?|labs?|laboratories|researchers?|investigators?)\\s+(?:\\w+\\s+){0,2}(?:independently|separately|each|all\\b)',
  '\\b(?:replicated?|repeated|reran|re-?ran|scanned?|tested?|tried)\\s+(?:\\w+\\s+){0,2}(?:in|across|over)\\s+(?:\\w+\\s+){0,2}(?:countries|nations|cities|regions|sites|labs?|populations|cohorts?)\\b',
  '\\b(?:scanned|searched|tried|tested|examined|analy[sz]ed|explored|screened)\\s+(?:\\w+\\s+){0,2}(?:dozens|hundreds|thousands|many|numerous|several|multiple|\\d+|a good number of)\\s+(?:\\w+\\s+){0,2}(?:metrics?|subgroups?|parameters?|combinations?|variables?|dimensions?|specifications?|models?|variants?|thresholds?|windows?|slices?|settings?|cutoffs?|cities|countries|regions|sites|datasets?|markets|segments)\\b',
  '\\b(?:dozens|hundreds|thousands|many|numerous|several|multiple|\\d+)\\s+of\\s+(?:\\w+\\s+){0,2}(?:metrics?|subgroups?|parameters?|combinations?|variables?|dimensions?|specifications?|models?|variants?|thresholds?|windows?|slices?|settings?|cutoffs?|cities|countries|regions|sites|datasets?|markets|segments)\\b',
  '\\b(?:so|that)\\s+many\\s+(?:\\w+\\s+){0,2}(?:teams?|groups?|labs?|researchers?|tries|attempts|runs|comparisons?)\\b',
  '\\b(?:search|scan)\\s+(?:space|range)\\b',
  '\\btrials?\\s+factor\\b',
  '\\bmany\\s+(?:independent\\s+)?(?:groups?|teams?|labs?)\\b',
].join('|'), 'i');

// ─── 腿②：显著性当验证（中文）────────────────────────────
const SIGNIF_ZH = new RegExp([
  '(?:信号|结果|效应|现象|规律|峰值|相关|结论)(?:是|看来是|看起来是|确实是|的确是)?(?:真的|真实(?:的|存在)?|为真|成立)',
  '(?:这|那|足以)?说明(?:这个)?(?:信号|效应|结果|现象|规律)(?:是)?(?:真的|真实)',
  '(?:这|这正|这就|恰恰)?(?:足以)?证明(?:了)?(?:结论|信号|效应|结果)?(?:稳健|真实|为真|成立|可靠)',
  '交叉验证(?:说明|表明|证明)(?:这|那)?(?:不是|绝非|并非)(?:噪声|偶然|巧合)',
  '(?:这|那)?(?:还|岂)(?:能|可能)(?:是|算)(?:偶然|巧合|噪声)',
  '(?:绝不|绝不是|绝非|不可能)(?:是|只是|属于)(?:噪声|偶然|巧合|运气)',
  '(?:不是|绝非|并非)(?:噪声|偶然|巧合|随机波动)',
  '(?:规律|效应|相关性)(?:普遍)?(?:成立|存在|真实)',
  '(?:验证|证实|确认)(?:了|这个|该)?(?:信号|效应|结论|假设)',
  '(?:足以|充分)(?:说明|证明|证实)(?:该|这个|此)?(?:效应|规律|结论|信号)',
  '(?:多数|大多数|大部分)(?:团队|实验室|机构|课题组|研究者)(?:都)?(?:验证|支持|确认|复现)(?:了)?(?:它|这个|该)',
  '(?:重复|实验|检验)(?:次数)?(?:足够|这么)(?:多|充分)',
  // r483 补族：多方各自「撞到显著」的陈述（配腿①即成本族攻击）
  '(?:报告|发现|得到|得出|做出|呈现|显示|测出|跑出|找到)(?:了|出)?(?:显著|显著性|阳性)',
  '扫出(?:了)?(?:显著|显著性)|检出(?:了)?显著|挖出(?:了)?显著',
  '总有一个(?:能|会)?(?:中|中奖|命中|显著)',
  '(?:每个|各个|各国|各城市|各子群|都|皆|无一例外)(?:都|亦|也)?(?:能)?(?:做出|得到|呈现|显示|测出|报告)(?:显著|显著性)',
].join('|'));

// ─── 腿②：显著性当验证（英文）────────────────────────────
const SIGNIF_EN = new RegExp([
  '\\b(?:which|that)\\s+(?:confirms?|proves?|shows?|demonstrates?|means?)\\b',
  '\\b(?:so|thus|therefore|hence)\\s+(?:it|the effect|the signal|the result|the pattern)\\s+(?:must|has to|is)\\s+(?:be\\b)?\\s*(?:real|genuine|true|robust|solid)',
  '\\b(?:confirms?|proves?|demonstrates?)\\s+(?:that\\s+)?(?:the\\s+)?(?:signal|effect|result|finding|pattern|conclusion)\\s+(?:is|was)?\\s*(?:real|genuine|true|robust|solid)',
  "\\b(?:must|has to|cannot|can'?t|could not|couldn'?t)\\s+(?:be\\s+)?(?:real|genuine|true|chance|random|a coincidence|noise)\\b",
  '\\b(?:is|are)\\s+(?:real|genuine)\\s+(?:evidence|proof)\\b',
  "\\b(?:not|cannot be|can'?t be|isn'?t|is not)\\s+(?:just\\s+)?(?:noise|chance|random|a coincidence|coincidental)\\b",
  '\\b(?:independent|cross)[- ]?(?:validation|verification|confirmation)\\b',
  '\\b(?:proves?|shows?|confirms?|demonstrates?)\\s+(?:the\\s+)?(?:effect|hypothesis|signal|pattern)\\s+(?:is|holds?|stands?)\\b',
  '\\b(?:is|are)\\s+(?:enough|sufficient)\\s+to\\s+(?:confirm|prove|establish|show)\\b',
  '\\b(?:the\\s+)?(?:effect|signal|pattern|result)\\s+(?:is|holds?|proved|confirmed)\\b',
  '\\bwith\\s+(?:that|so)\\s+many\\s+(?:tries|attempts|runs|trials|comparisons)\\b',
  // r483 补族：came out significant / were significant / reported significant
  '\\b(?:came|turned|come|comes|turning)\\s+out\\s+(?:\\w+\\s+){0,2}significant\\b',
  '\\b(?:were|was|are|is)\\s+(?:statistically\\s+)?significant\\b',
  '\\b(?:reported|found|got|obtained|produced|yielded|showed|show|shows|displayed|exhibited)\\s+(?:a\\s+|an\\s+)?(?:statistically\\s+)?significant\\b',
  '\\bsignificant\\s+(?:correlations?|effects?|results?|differences?|associations?)\\b',
  '\\breported\\s+significance\\b',
  '\\bindependently\\s+(?:reported|found)\\s+(?:the\\s+)?same\\b',
  '\\bsignificance\\s+(?:kept|keeps|just\\s+keeps)\\s+(?:showing|show)\\s+up\\b',
  // r483 补族：signal/effect is confirmed / verified / validated
  '\\b(?:signal|effect|result|finding|pattern|conclusion|peak)\\s+(?:is|was|has been|have been)\\s+(?:confirmed|verified|validated|established)\\b',
].join('|'), 'i');

// ─── 豁免 A：多重比较校正纪律在场（中文）──────────────────
const CORRECT_ZH = new RegExp([
  'Bonferroni|bonferroni|Bonferroni校正',
  'FDR|假发现率|错误发现率',
  '(?:多重|多次|多样本)?比较(?:的)?(?:校正|修正|调整|折减)',
  '(?:校正|修正|调整)(?:后|之后)',
  'trials\\s*factor|试验因子|搜索次数因子',
  '后验概率|先验概率',
  '预注册|事前登记|事前设定|事前确定|预先设定|事先确定',
  'preregist|pre-?regist',
  'corrected\\s*p',
  '阴性结果|未发表|发表偏倚',
  'pooled\\s+all|汇总.*全部|全部.*汇总|合计.*所有',
  '分层分析|meta分析|元分析',
].join('|'));

// ─── 豁免 A：多重比较校正纪律在场（英文）──────────────────
const CORRECT_EN = new RegExp([
  '\\bBonferroni\\b',
  '\\bFDR\\b|false discovery rate|family-?wise',
  '\\b(?:corrected|adjusted|adjusted)\\s+(?:for\\s+)?(?:multiple\\s+)?compar',
  '\\bmultiple[- ]comparison\\s+(?:correction|adjustment)',
  '\\btrials?\\s+factor\\b',
  '\\bposterior\\s+probability\\b|\\bprior\\s+probability\\b',
  '\\bpre-?regist|preregist|specified\\s+in\\s+advance|prespecified\\s+(?:hypothesis|outcome|endpoint|metric)',
  '\\bcorrected\\s+p[- ]value',
  '\\bnull\\s+results?\\b|\\bnegative\\s+results?\\b|\\bpublication\\s+bias\\b',
  '\\bpooled\\s+all\\b|\\ball\\s+results\\b|\\bevery\\s+result\\b',
  '\\bstratified\\s+analysis\\b|\\bmeta[- ]analys',
  '\\bdid\\s+not\\s+replicate\\b|\\bfailed\\s+to\\s+replicate\\b',
].join('|'), 'i');

// ─── 豁免 B：阴性结果/收敛在场（中文）─────────────────────
const CONVERGE_ZH = new RegExp([
  '(?:也|还|同时)(?:有|存在)?(?:团队|实验室|机构|课题组|研究者)?(?:报告|得出|发现)(?:了)?(?:阴性|不显著|无显著|相反|null)',
  '(?:结论|结果)(?:不一致|相互矛盾|相反|有分歧)',
  '(?:只|仅)(?:有|剩下)?(?:事前|预先|事先)(?:设定|确定|指定)(?:的)?(?:那个|指标|终点|假设)',
  '(?:其余|其他)(?:均|都)?(?:不显著|为阴性|无显著|是阴性|null)',
].join('|'));

// ─── 豁免 B：阴性结果/收敛在场（英文）─────────────────────
const CONVERGE_EN = new RegExp([
  '\\b(?:also|some)\\s+(?:teams?|groups?|labs?|researchers?)\\s+(?:reported|found|got)\\s+(?:negative|null|non-?significant|contrary|opposite)\\b',
  '\\b(?:results?|findings?|conclusions?)\\s+(?:were|are|is)?\\s*(?:inconsistent|mixed|contradictory|discrepant)\\b',
  '\\bonly\\s+the\\s+(?:prespecified|pre-?registered|pre-?specified)\\s+(?:one|metric|endpoint|hypothesis|outcome)\\b',
  '\\b(?:the\\s+)?(?:rest|remaining|others?)\\s+(?:were|was)?\\s*(?:null|non-?significant|negative)\\b',
].join('|'), 'i');

// ─── 豁免 C：概念/教学转述────────────────────────────────
const META_ZH = new RegExp([
  'look[- ]?elsewhere|看看别处效应',
  '多重比较|多次比较|搜索空间|扫描范围|trials\\s*factor|试验因子',
  '假阳性率|假发现|统计学|教材|课堂|论文|方法学|谬误|案例|反例',
].join('|'));

const META_EN = new RegExp([
  '\\blook[- ]elsewhere\\b',
  '\\bmultiple[- ]comparison\\b|\\bmultiplicity\\b|\\btrials?\\s+factor\\b',
  '\\bfalse[- ]positive\\s+rate\\b|\\bgarden of forking paths?\\b',
  '\\bstatistics?\\b|\\btextbook\\b|\\blecture\\b|\\bmethodology\\b|\\bfallacy\\b',
].join('|'), 'i');

// ─── 否定守卫（腿命中点紧邻前缀）─────────────────────────
const NEG_ZH = /(?:不能|不应|未必|不代表|不意味着|无法|并非|不是|别|勿|莫)/;
const NEG_EN = /(?:not|never|cannot|can'?t|doesn'?t|do not|isn'?t|no)\s*$/i;

// ─── 邻近窗 ───────────────────────────────────────────────
const WINDOW_ZH = 80;
const WINDOW_EN = 220;

function _collect(re, text) {
  const out = [];
  if (!re || typeof re.source !== 'string') return out;
  let g;
  try {
    g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
  } catch (_) { return out; }
  let m;
  let guard = 0;
  while ((m = g.exec(text)) !== null && guard++ < 500) {
    if (m[0].length === 0) {
      if (g.lastIndex <= m.index) g.lastIndex = m.index + 1;
      continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以自定义正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkLookElsewhereEffect(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  // r483 修正：负例注入用 in 语义而非 || —— 注入空串表示「摘除该常量」，
  // 若用 || 则空串 falsy 回退真值，豁免永远显成承重失败。
  const pick = (k, dflt) => (Object.prototype.hasOwnProperty.call(R, k) ? R[k] : dflt);
  const SEARCH_ZH_ = pick('SEARCH_ZH', SEARCH_ZH);
  const SEARCH_EN_ = pick('SEARCH_EN', SEARCH_EN);
  const SIGNIF_ZH_ = pick('SIGNIF_ZH', SIGNIF_ZH);
  const SIGNIF_EN_ = pick('SIGNIF_EN', SIGNIF_EN);
  const CORRECT_ZH_ = pick('CORRECT_ZH', CORRECT_ZH);
  const CORRECT_EN_ = pick('CORRECT_EN', CORRECT_EN);
  const CONVERGE_ZH_ = pick('CONVERGE_ZH', CONVERGE_ZH);
  const CONVERGE_EN_ = pick('CONVERGE_EN', CONVERGE_EN);
  const META_ZH_ = pick('META_ZH', META_ZH);
  const META_EN_ = pick('META_EN', META_EN);
  const NEG_ZH_ = pick('NEG_ZH', NEG_ZH);
  const NEG_EN_ = pick('NEG_EN', NEG_EN);

  // 全文级豁免 C：在分析这个概念本身，不是在运用它
  if (META_ZH_.test(text) || META_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZH = /[\u4e00-\u9fff]/.test(text);
  const searchSpans = [].concat(_collect(SEARCH_ZH_, text), _collect(SEARCH_EN_, text));
  const signifSpans = [].concat(_collect(SIGNIF_ZH_, text), _collect(SIGNIF_EN_, text));
  if (searchSpans.length === 0 || signifSpans.length === 0) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  const window = isZH ? WINDOW_ZH : WINDOW_EN;

  const negatedAt = (spans, re) => spans.some(s => {
    const pre = text.slice(Math.max(0, s.start - 6), s.start);
    return re.test(pre);
  });

  for (const s of searchSpans) {
    if (negatedAt([s], isZH ? NEG_ZH_ : NEG_EN_)) continue;
    for (const g of signifSpans) {
      if (negatedAt([g], isZH ? NEG_ZH_ : NEG_EN_)) continue;
      // 零重叠：两腿不得互为子串（防自证）
      if (!(g.end <= s.start || g.start >= s.end)) continue;
      // 同窗
      const gap = (g.start >= s.end) ? (g.start - s.end) : (s.start - g.end);
      if (gap > window) continue;

      const lo = Math.max(0, Math.min(s.start, g.start) - 20);
      const hi = Math.min(text.length, Math.max(s.end, g.end) + 120);
      const local = text.slice(lo, hi);
      // 豁免 A 校正纪律在场 / 豁免 B 阴性结果收敛在场
      if (CORRECT_ZH_.test(local) || CORRECT_EN_.test(local)) continue;
      if (CONVERGE_ZH_.test(local) || CONVERGE_EN_.test(local)) continue;

      return {
        hit: true, score: 0.4, count: 1,
        detail: isZH
          ? 'look-elsewhere effect(搜索空间宽度×显著性当验证)(zh)'
          : 'look-elsewhere effect(search width × significance-as-validation)(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkLookElsewhereEffect,
  __internals: () => ({
    SEARCH_ZH, SEARCH_EN, SIGNIF_ZH, SIGNIF_EN,
    CORRECT_ZH, CORRECT_EN, CONVERGE_ZH, CONVERGE_EN,
    META_ZH, META_EN, NEG_ZH, NEG_EN, WINDOW_ZH, WINDOW_EN,
  }),
};
