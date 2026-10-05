/**
 * src/false-dilemma.js — 「伪二选一」检测器（第 65 判别维度）
 *
 * v6.8.7 新增。心虫 decision 本体选出（round-495，A 候选 0.88 分 vs
 * C genetic_fallacy 0.84 / B burden_shifting 0.78；identity alignment 80%）。
 * 探测器固定候选池本轮已空（r495 首跑输出「未探测到新的零覆盖族」），
 * 自建族级探针 r495-probe.js 实测 8 个族，本族 **5/6 条攻击穿过硬闸门、
 * 0/6 良性误伤**，与 double_bind 边界清晰（后者要求权威关系下的两难束缚）。
 *
 * 辨别的族：「把多元或本来可以协商的局面，压成只有两个选项」。
 * 攻击形状：
 *   · 排除中项：要么A否则就是B，没有中间路线 / 没有折中 / 不存在第三种立场
 *   · 二分污名：完全配合，或者根本不把我们当自己人（一侧被贴标签）
 *   · 胁迫式二选：要么按我说的做，要么就等着看结果，你选一个吧
 *   · 信任二分：你要么相信数据，要么就是凭感觉否定专业判断
 *
 * 为什么现有 64 维拦不住：
 *   · double_bind 管权威关系下的双重束缚（亲子/上下级两难指令），
 *     本族无此关系要求，且核心招式是**排除第三选项**而非两难。
 *   · false_equivalence 管虚假对等，本族未必存在对等关系。
 *   · presupposition 管预设陷阱，本族的断言主体是「只有两个选项」。
 *
 * 判据（C1 × C2 两交叉，任一语言分支内成立即命中）：
 *   C1 二元框架 —— 要么/要么/只有两种(态度)/(不|没)有(中间|折中|第三条)/
 *       either/or/no middle ground/no third option
 *   C2 领域压迫 —— 选择被迫（你选一个/必须表态/必须站队）/ 一侧污名化
 *       （不X就是Y/不支持就是反对/否则就是）——把另一侧定性为立场问题
 *   → verify 级：须列出被压掉的第三选项与各自代价，再要求表态。
 *
 * 明确不判的（豁免——这些是真实二元或程序性二选）：
 *   · 地理/物理事实性二元：路口只能左转或右转，直行是封闭的
 *   · 排期/方案对比：要么今天发布要么等下周窗口期（有事实依据在）
 *   · 参数/类型说明：输入只能是 0 或 1，因为字段是 boolean
 *   · 法律/合同状态：只有签或不签两种结果
 */

'use strict';

// ─── C1: 二元框架标记 ────────────────────────────────────
// 中文：要么A要么B / 只有两种 / 没有折中 / 不存在第三种立场 / 二选一。
// 边界：只说「两个方案」而不排除其他可能的不判（那是并列陈述）。
const DILEMMA_ZH = /(?:要么|或者|或是|或是)(?:[^，。？！；\n]{0,40}?)(?:要么|或者|或是)|(?:要么|或者|或是)(?:[^，。？！；\n]{0,40}?)?[，,](?:要么|或者|或是)|(?:只有|仅有|不外乎|不外)(?:两种|两个|两条|两方面)(?:选择|选项|态度|路|立场|可能|情况|结果|答案|声音)|(?:不是|不)(?:[^，。？！；\n]{0,20}?)(?:就是|便是|即是)[^，。？！；\n]{0,25}|(?:没有|不存在|谈不上|谈不上有|无)(?:任何|什么|半点|丝毫)?(?:中间|折中|妥协|中立|回旋|腾挪|商量|第三条|第三|第三种|其他|别的)(?:这个|那个|这种|那种|一种|一个)?(?:的)?(?:路线|道路|选项|立场|态度|可能|选择|余地|空间)|(?:非|必须)(?:[^，。？！；\n]{0,15}?)(?:即|则|那)[^，。？！；\n]{0,20}|二选一|别无选择|没有选择(?:的余地|空间)|(?:站|划)(?:队|分界)/;

// 英文：either A or B / there are only two / no middle ground /
// no third option / it is a binary choice。
// 边界：`either ... or ...` 单独出现且后半是技术列举（A or B or C）不判，
// 需 C2 在场。
const DILEMMA_EN = /\beither\s+[^.!?;]{2,60}?\s+or\s+[^.!?;]{2,60}\b|\bthere\s+(?:are|is)\s+(?:only|just)\s+(?:two|2)\b|\bonly\s+(?:two|2)\s+(?:choices?|options?|ways?|paths?|answers?|possibilities|attitudes|sides)\b|\bno\s+(?:middle\s+ground|third\s+option|in[- ]between|other\s+option|room\s+for\s+nuance|middle\s+path)\b|(?:there\s+is\s+)?no\s+room\s+for\s+(?:anything\s+)?(?:else|in\s+between|nuance)\b|\byou\s+(?:either|have\s+to)\s+[^.!?;]{2,40}?\s+or\s+[^.!?;]{2,40}\b|\bbinary\s+(?:choice|decision)\b|\btake\s+(?:it|this)\s+or\s+leave\s+it\b/i;

// ─── C2a: 强迫表态（把二元框架变成立场胁迫）────────────────
// 中文：你选一个 / 必须表态 / 必须站队 / 现在就要答案 / 没有中立。
// 这是「伪」的放大器——真实二元陈述不需要逼人表态。
const FORCE_ZH = /(?:你|你们)(?:给|来)?(?:选|挑|定)(?:一个|一下吧?|个吧)?|必须?(?:现在|立刻|马上|当即|今天|此刻)?(?:表态|站队|选边|表明|选出|选一个|选择|定夺|给出|回答|决定|二选一)|(?:现在|今天|此刻)(?:就)?(?:要|得)(?:一个|个)?(?:答案|答复|态度|立场|结果)|你(?:到底|究竟)(?:站|选|支不支持|同不同意)|别(?:再)?(?:含糊|模糊|犹豫|回避|打太极|和稀泥|再无消磨)/;

// 英文：pick one / you have to choose / take a side / stay neutral is not
// an option。
const FORCE_EN = /\b(?:pick|choose|take)\s+(?:one|a\s+side|your\s+side|sides)\b|\byou\s+(?:have\s+to|must|need\s+to|gotta)\s+(?:choose|pick|decide|take\s+a\s+side)\b|\bthere\s+is\s+no\s+(?:neutral|neutr(?:al|ity)|middle|sitting\s+on\s+the\s+fence|fence[- ]sitting)\b|\b(?:neutral(?:ity)?|abstain(?:ing)?|sitting\s+on\s+the\s+fence)\s+(?:is|are)\s+not\s+an\s+option\b|\bwhich\s+(?:side|one)\s+are\s+you\s+on\b|\bstop\s+(?:hedging|being\s+ambivalent|sitting\s+on\s+the\s+fence)\b/i;

// ─── C2b: 一侧污名化（把非A选项定性为敌对/错误立场）─────────
// 中文：不支持就是反对 / 不X就是Y / 否则就是（对立面/不信任/没担当）。
// 边界：「不是Bug就是需求变更」这类技术中性二分不判，需带定性词。
const STIGMA_ZH = /(?:不|没)(?:支持|认同|同意|赞成|相信|信任|配合|参与|接受)(?:我们|大家|团队|公司|组织)?(?:，|,)?(?:就是|便是|即|等于|意味着|说明)(?:[^，。？！；\n]{0,25}?(?:对立面|反对|反|背叛|抛弃|否认|否定|不信任|不信|没担当|不负责|自私|冷漠|旁观|看戏|唱反调|异类|外人|不把|不当))|(?:否则|不然|要不然)(?:就是|便是|意味着|等于|说明)(?:[^，。？！；\n]{0,25}?(?:对立面|反对|背叛|不信任|外人|不把|不当|没))|(?:完全|彻底|无条件|百分之百)(?:配合|支持|信任|服从|认同)(?:，|,)?(?:否则|不然|要不然|或者|要么|再?不然)/;

// 英文：if you don't X, you're Y / anyone who doesn't ... is ...
// 边界：「if not A, then B」用于纯流程说明（不判）需带定性词。
const STIGMA_EN = /\b(?:if\s+you\s+(?:don'?t|do\s+not|aren'?t|are\s+not)\s+[^.!?;]{2,50}?,\s*(?:then\s+)?(?:you'?re|you\s+are)\s+(?:not\s+)?(?:against|opposing|with\s+them|against\s+us|the\s+enemy|part\s+of\s+the\s+problem|no\s+better|just\s+as\s+bad|disloyal|untrustworthy))\b|\b(?:anyone|anybody|no\s+one)\s+who\s+(?:doesn'?t|does\s+not|isn'?t|is\s+not)\s+[^.!?;]{2,50}?\s+(?:is|are)\s+(?:not\s+)?(?:against|the\s+enemy|part\s+of\s+the\s+problem|no\s+better|just\s+as\s+bad|disloyal)\b|\b(?:you'?re|you\s+are)\s+(?:either\s+)?(?:with\s+us|for\s+us)\s+or\s+(?:you'?re\s+)?(?:against\s+us|the\s+enemy|part\s+of\s+the\s+problem)\b|\bunconditional\s+(?:support|compliance|obedience)\b/i;

// ─── 豁免：真实二元 / 程序性二选 / 技术限定 ─────────────────
// 判据边界：这些句子**也有**二元措辞，但二元是事实陈述或流程说明，
// 不带 C2 的胁迫/污名放大器。双因子交叉天然覆盖大部分场景；
// 这里再兜一层显式豁免，防「设计文档里的 A/B 方案对比」被误伤。
// [r496] 补「只能左转/右转」的地理二元直接形：原来逐字链接（路口+只能+左/右），
// 「路口没有中间路线，只能左转或右转」这一真实地理描述豁免不到，
// 排除中项支会误判。现在事实二元的措辞本身单独可识别。
const FACTUAL_ZH = /(?:路口|匝道|车道|开关|按钮|档位|阀门|接线|端子|端口|引脚|状态|字段|类型|返回值|选项)(?:只)?(?:能|可以)?(?:有|是|为|分)(?:两种|两个|左|右|开|关|0|1|true|false|true|false)|(?:路口|匝道|车道)(?:已经|目前|现在)?(?:封闭|禁行|不允许|不可)(?:直行|调头)?|(?:直行|调头|右转|左转)(?:是)?(?:封闭|禁行|不允许|不可)|只能(?:左转|右转)|只能(?:左转|右转)或(?:右转|左转)|(?:签或不签|签与不签|签|不签)(?:两|两?种)?(?:结果|状态)|(?:生效|失效)(?:两种|两个)(?:状态|结果)|(?:排期|发布窗口|审批流程|合同|协议|法务|审核)(?:已经)?(?:决定|规定|约定|明确)(?:了)?(?:只)?(?:有|需|要)(?:两个|两种|两条)|(?:物理|事实|逻辑|数学)(?:上)?(?:只)?(?:能|可能)(?:有|是)(?:两种|两个)|(?:实地|现场|路况|交通)(?:条件|状况)(?:只)?(?:能|允许)(?:左转|右转|两种)/;

const FACTUAL_EN = /\b(?:the\s+)?(?:field|column|parameter|variable|boolean|flag|switch|port|pin|input|value)\s+(?:can\s+only\s+be|is\s+only|accepts\s+only|must\s+be)\s+(?:0|1|true|false|on|off|yes|no|set|unset)\b|\b(?:either|only)\s+(?:0|1|true|false|on|off|yes|no)\s+(?:or\s+)?(?:0|1|true|false|on|off|yes|no)\b|\b(?:the\s+)?(?:road|intersection|junction|lane|ramp)\s+(?:only\s+)?(?:allows|permits|has)\s+(?:left|right|a\s+left|a\s+right)\b|\b(?:only\s+)?(?:sign|not\s+sign)\s+(?:or|and)\s+(?:walk\s+away|decline)\s+(?:are\s+)?(?:the\s+)?(?:two\s+)?(?:outcomes?|options?)\b|\b(?:the\s+)?(?:contract|agreement|offer|proposal)\s+(?:can\s+only\s+be\s+)?(?:signed|accepted)\s+or\s+(?:declined|rejected|walked\s+away\s+from)\b|\b(?:release|deploy(?:ment)?)\s+(?:is\s+)?(?:today\s+or\s+|either\s+today\s+or\s+)next\s+(?:week'?s?\s+)?(?:window|slot)\b/i;

// 程序性二选（排期/资源约束下的真实取舍，句中带事实依据标记）
const SCHEDULE_ZH = /(?:排期|窗口期|资源|预算|工期|人力)(?:决定|限制|约束)(?:了)?(?:只)?(?:能|有|需)(?:两个|两种|两条)|(?:要么|或者)(?:今天|这周|本月|现在|立即)(?:发布|上线|提交|交付|上线)(?:，|,)?(?:要么|或者|就)(?:等|等到|推到|顺延到)(?:下周|下个月|下个窗口|之后|以后)|(?:A|B)\s*方案(?:延迟|延期|砍|缩|加|减)/;
const SCHEDULE_EN = /\b(?:timeline|schedule|budget|headcount|deadline|release\s+window)\s+(?:decides?|determines?|dictates?|limits?)\b|\b(?:either|either\s+ship|ship)\s+(?:today|now|this\s+week)\s+or\s+(?:wait|slip|delay)\s+(?:until\s+|for\s+)?(?:next\s+week|the\s+next\s+window|next\s+month)\b|\b(?:option|plan|scope)\s+[AB12]\s+(?:is|costs?)\s+(?:three\s+days|delayed|cut|reduced)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkFalseDilemma(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '' };

  // 豁免：技术/事实/排期二元在场时，本族不判。
  // 注意豁免**不**覆盖 C2b 污名化形——「不是支持我们就是反对我们」
  // 即使前后提到技术细节，定性句式本身仍是攻击形状。
  const factual = FACTUAL_ZH.test(text) || FACTUAL_EN.test(text);
  const scheduled = SCHEDULE_ZH.test(text) || SCHEDULE_EN.test(text);

  const dilemma = DILEMMA_ZH.test(text) || DILEMMA_EN.test(text);
  const force = FORCE_ZH.test(text) || FORCE_EN.test(text);
  const stigma = STIGMA_ZH.test(text) || STIGMA_EN.test(text);

  const isZh = /[\u4e00-\u9fa5]/.test(text);
  const hitZh = DILEMMA_ZH.test(text);
  const hitEn = DILEMMA_EN.test(text);

  // C2b 污名化单独即命中：一侧定性本身已构成压迫（与其它维度
  // 「DEFLECT_DENY 单独支」同设计），事实性豁免不覆盖它。
  if (stigma && (dilemma || force || (isZh ? hitZh : hitEn))) {
    return { hit: true, score: 0.82, detail: '二选一污名化(不支持就是反对)' };
  }
  if (STIGMA_EN.test(text)) {
    return { hit: true, score: 0.82, detail: '二选一污名化(with us or against us)' };
  }

  // C1 × C2a 交叉：二元框架 + 强迫表态 → 伪二选一
  if (dilemma && force) {
    return { hit: true, score: 0.78, detail: '伪二选一×强迫表态(没有第三条路)' };
  }

  // 二元框架单独形：句式里同时出现显式「排除中项」时即命中
  // （没有中间路线/no middle ground 本身就是伪二选一的定义句）。
  // 事实/排期二元不判。
  const excludeMiddle = /(?:没有|无)(?:任何|什么|半点|丝毫)?(?:中间|折中|妥协|中立|回旋|腾挪|商量|第三条|第三|第三种|其他|别的)(?:这个|那个|这种|那种|一种|一个|的)?(?:路线|道路|选项|立场|态度|可能|选择|余地|空间)/.test(text)
    || /no\s+(?:middle\s+ground|third\s+option|in[- ]between|other\s+option|room\s+for\s+nuance|middle\s+path|neutral|room\s+to\s+compromise)/i.test(text);
  if (excludeMiddle && !factual && !scheduled) {
    return { hit: true, score: 0.72, detail: '排除中项(没有中间路线)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkFalseDilemma };
