/**
 * src/metric-gaming.js — 「指标博弈/度量效度失效（metric gaming / measure
 * distortion）」检测器（第 274 个判别维度，r425 立项）
 *
 * [r425 立项] decision 本体在当前引擎（v6.8.211，273 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。加速依据是缺口实证 + 方向轮换：
 *   · 缺口实证（scripts/round-425/probe-r425-gap.js，v6.8.211 基线）：本族
 *     10 条攻击样本 **9 条 gate.action=pass 完全穿引擎**（1 条被存量维度
 *     sexual_compliance_pressure 误代拦——明显误伤，非本族语义）；良性族
 *     零新增承重。整族无任何维度以本族语义覆盖。
 *   · 射程分工确认：src/proxy-metric-goal.js（第 187 维 proxy_metric_goal，
 *     r190）管的是**正向形**——用指标读数宣称目标已达成（「KPI 完成了，说明
 *     目标肯定达成了」），其腿② GOAL 只收「目标达成/真实效果结论」；本族管
 *     的是**反向形**——指标被立为考核目标之后，**度量本身失效、读数被行为
 *     博弈**（「当覆盖率成为 KPI 之后，大家就写没有断言的测试」）。前者是
 *     「拿读数冒充结果」，后者是「指标本身不再是好度量」。proxy_metric_goal
 *     的 CONN 结构还明确排除转折窗（contrast 词命中即不判），而本族的核心
 *     句式恰恰是「成为目标之后/一旦…就…」的**条件-后果**形，两者在连接词层
 *     面天然互补，不存在重复命中。
 *   · 外部来源（真实，未编造）：GitHub API 检索 `reward hacking OR
 *     specification gaming llm`（sort=stars）——最高星为
 *     manrajmondair/reward-hacking-evals ★3（Python 评估框架，需模型运行），
 *     其余 4 个仓库均 ≤1 星且依赖 LLM/RL；HN Algolia
 *     `goal drift alignment detection` 唯一命中为无关项目；Semantic Scholar
 *     HTTP 429。无高星纯规则方案可移植，判据为心虫自有纯规则实现
 *     （零 LLM 依赖）。侦察落盘 /tmp/hf-scout/r425-scout.txt。
 *
 * 辨别的族：指标博弈/度量效度失效（metric gaming / Goodhart's law 的行为面）
 * ——文本宣告**某个被测得的量（代理指标）被立为考核目标**，同时宣告**度量
 * 效度失效或被行为博弈**（指标不再反映真实目标、人们转而刷数字/拆数字/规避
 * 计量、真实目标无人再管）：
 *   当测试覆盖率成为 KPI 之后，大家就开始写没有断言的测试。
 *   一旦把这个指标当成考核目标，它就不再是好的度量了。
 *   把 bug 修复数当成绩效指标后，员工就把一个 bug 拆成三个来修。
 *   为了降低投诉率，一线员工学会了拒绝受理投诉。
 *   When citation count became the hiring metric, researchers optimized for citations.
 *   Once downloads became the target, the team shipped empty installers.
 *
 * 为什么这本身就是问题：这是 Goodhart 定律的行为面——「指标一旦成为目标，
 * 就不再是好的指标」。句子本身可能是在**批评**这种现象（教学/评论语境），
 * 但规则引擎需要判别的不是褒贬，而是这段文本承载的推理形状：**把被计量
 * 的量直接等同于要优化的对象**，并要求调用方注意度量已被博弈、目标本身
 * 需要独立检验。单句也可能是营销话术反向利用（「我们只考核真实留存」来
 * 给刷量行为打掩护），故取 VERIFY 级。
 *
 * VERIFY 级含义：文本呈现「指标被立为目标→度量失效」的结构，需要调用方
 * 核实该指标当前是否仍有效度（对照目标直接测量），而不是接受指标读数。
 *
 * 判据：两腿共现 + 邻近窗 + 五组豁免，缺一不判：
 *   腿① TARGET 指标被立为目标（成为/当成/设为/纳入 KPI|考核|绩效|目标 +
 *         被测得的量；EN became/was made/turned into/set as (the) target/
 *         metric/KPI）
 *   腿② GAMED 度量失效或被博弈（刷/注水/拆分/拆成/规避/拒绝受理/缺考/
 *         数字游戏/不再反映/失效/失真/算不上数/没人再管/优化 for the
 *         number；EN gamed/gaming/optimized for the number/no longer
 *         reflects/stopped being a good measure/inflated/padded）
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   ① 主动分离指标与目标（不等于/不代表/不能反映/只是参考/另行评估）——
 *      把指标与目标分开陈述是正确判别；
 *   ② 指标设计/审计在场（重新设计指标/校准指标/防刷量/反作弊/审计读数/
 *      对照目标直接测量）——正在修制度的人不是在博弈指标；
 *   ③ 对冲（可能/也许/未必/大概）；
 *   ④ 概念/教学转述（古德哈特/Goodhart/指标博弈/博弈指标/刷量/教材/课堂/
 *      论文/案例研究）——讨论这个概念本身不是运用它；
 *   ⑤ 疑问句（含 ?/？）。
 *
 * 边界：goal_drift（第 197 维）管原始目标锚点 × 目标置换宣告（整体换目标），
 * 本族不要求锚点腿、不管目标被更换、管**同一个指标被立为目标后读数被
 * 博弈**；proxy_metric_goal（第 187 维）管用读数冒充目标达成（正向），
 * 本族管度量失效（反向），射程在「读数是否仍有效度」上互补。
 */
'use strict';

// ─── 腿① TARGET 指标被立为目标（中文）─────────────────────────────
// 161 轮教训：全部收裸名词形态——同族词去掉前后缀仍独立命中。
// 结构 = 「被测得的量」×「被立为目标」动词，裸名词（覆盖率/平均分/KPI）
// 经腿②侧的度量族兜底（TARGET_VERB 命中 + GAMED 命中即可成族）。
const TARGET_METRIC_ZH = [
  // 流量/参与类
  /点击率|播放量|下载量|阅读量|转发量|评论数|点赞|粉丝|浏览量|访问量|曝光量|热搜|排名|榜单|票数/,
  // 商业/经济类
  /票房|收视率|营收|销售额|成交量|订单量|交易额|市值|估值|GDP/,
  // 考核/管理类
  /KPI|指标|绩效|完成率|达标率|完成量|通过率|覆盖率|准确率|工时|人效|坪效/,
  // 教育类
  /分数|成绩|得分|评分|平均分|及格率|优秀率|升学率|满分/,
  // 科研类
  /论文数|专利数|引用量|影响因子|课题数|项目数|经费/,
  // 用户/运营类
  /日活|月活|DAU|MAU|注册数|激活数|留存率|复购率|转化率|投诉率|好评率|打开率|完播率|满意度/,
  // 代码/工程类
  /代码行数|代码量|提交数|工单数|bug数|缺陷数|测试覆盖率|覆盖率/,
  // 通用度量名词（裸名词形态，161 轮教训）
  /度量|计量|测量|统计口径|统计数字|数字/,
];

const TARGET_METRIC_EN = [
  /\b(?:clicks?|views?|downloads?|followers?|likes?|traffic|rankings?)\b/i,
  /\b(?:revenue|sales|GDP|box\s+office|ratings?|scores?|grades?)\b/i,
  /\b(?:KPI|KPIs|metrics?|targets?|quotas?|numbers?)\b/i,
  /\b(?:coverage|conversion|retention|churn|citations?|impact\s+factor)\b/i,
  /\b(?:DAU|MAU|throughput|velocity)\b/i,
];

// ─── 腿① TARGET 被立为目标的动词（中文）──────────────────────────
// 161 轮教训：全部收裸名词形态——同族词去掉前后缀仍独立命中。
// 结构 = 「被测得的量」×「被立为目标」动词。动词侧不要求「考核/绩效」后缀
// 与指标名词紧邻——「覆盖率成为KPI」「GDP成了唯一目标」中后缀词（KPI/
// 目标）本身就是被立为目标的标记，与指标名词可间隔若干字（条件从句）。
const TARGET_VERB_ZH = [
  // 强形：指标名词 + 立目标动词 + 目标标记（KPI/考核/绩效/指标/目标/标准）
  /(?:成为|成了|变为|变为|变成|设为|设置为|纳入|列入|作为|当作|当成|拿|当)[^。！？]{0,12}(?:考核|绩效|KPI|Kpi|kpi|指标|目标|标准|唯一|导向|指挥棒)/,
  /以[^。！？]{0,8}(?:论|来衡量|来考核|来评价|论英雄|论成败|为导向)/,
  /拿[^。！？]{0,8}(?:当|作为)[^。！？]{0,8}(?:考核|指标|目标)/,
  /定成|定为|指挥棒|风向标|硬指标|唯一指标|唯一标准/,
  // 考核前置形（「考核通过率」「考评积分」——考核动词本身即立目标动作，
  // r425 实测「考核通过率之后，老师们只挑简单的题讲」整句漏判即因缺此形）
  /(?:考核|考评|计入|挂钩)[^。！？]{0,6}(?:率|量|数|分|时长|进度|速度|指标|评分|得分)/,
  // 无条件-后果形（「一旦…就…」「…之后…」）的标记侧
  /一旦|一经|只要.*当成/,
  // 目的-手段倒装形（「为了降低投诉率，员工学会拒绝受理」）：
  // 动词侧收「为了 + 指标 + 优化目标词」，指标名词由腿① METRIC 侧兜底
  /为了[^。！？]{0,10}(?:降低|提高|提升|拉高|做高|完成|达成|达标|凑够)/,
];

const TARGET_VERB_EN = [
  // 强形：became/made/turned into + 目标标记，放宽窗口到 45 字符
  // （「citation count became the hiring metric」后缀词与动词间隔较长）
  /\b(?:became|becomes|was\s+made|made\s+into|turned\s+into|set\s+as|used\s+as|become)\b[^.!?]{0,45}\b(?:target|metric|KPI|goal|measure|quota|objective)s?\b/i,
  /\b(?:once|when|as\s+soon\s+as|after)\b[^.!?]{0,45}\b(?:became|was\s+made|turned\s+into)\b/i,
  /\boptimiz(?:e|ed|ing|ation)\s+for\b/i,
  // 目的-手段倒装形（「to reduce complaints, agents learned to refuse claims」）
  /\bto\s+(?:reduce|increase|improve|boost|raise|hit|meet)\b[^.!?]{0,40}\b(?:metric|KPI|target|number|score|rate)s?\b/i,
];

// ─── 腿② GAMED 度量失效/被博弈（中文）─────────────────────────────
const GAMED_ZH = [
  // 博弈手段：刷/注水/拆分/规避
  /刷(?:高|上去|起来|量|数据|分|单|票|粉丝|下载|好评|指标)/,
  /注水|掺水|灌水|凑数|凑指标|凑数据|凑行数/,
  /拆(?:成|分为|开来)|拆单|拆bug|拆分/,
  /规避|绕开|绕过|钻空子|打擦边球|想方设法.*(?:完成|达标|凑够)/,
  /拒绝受理|不予受理|不受理|劝退|故意拖延|拖时间|悄悄劝退/,
  /缺考|弃考|安排成缺考|不报名/,
  /数字游戏|玩数字|做数字|数字好看|报表做得?好看|数据做得?好看/,
  /面子工程|形式主义|留痕|痕迹管理/,
  // 刷量产物形（机器粉/假单/空壳/机器人）
  /机器(?:人|粉|号)|假(?:单|量|数据|粉丝|账号)|水军|空壳|空包|刷出来的/,
  // 效度失效宣告
  /不再是|已不再是|不再是好的|算不上|称不上|算不上数/,
  /失效|失灵|失真|扭曲|变形|变味|流于形式|形同虚设|名存实亡/,
  /不再反映|反映不了|反映不出|衡量不了|测不出|测不准|说明不了/,
  /没人再管|无人在意|再也没人|谁也不看|没人关心|没人真正|没人计算|没人考核/,
  /只顾|只盯|只看|一味|统统指向|全部指向/,
  /真正(?:重要|该做|值得)(?:的)?[^。！？]{0,6}(?:没人|被忽略|被牺牲|不用管|不管)/,
  /(?:成本|代价|副作用|环境|质量|体验|初心|使命)[^。！？]{0,8}(?:没人|无人在意|被忽略|被牺牲|不用算|不算|被忘)/,
  // 无断言/空测试工程博弈形
  /没有(?:断言|校验|检查)的?测试|空(?:断言|测试|包|壳)|只求(?:跑通|通过|覆盖率)/,
  // 应试/教考形（r425 实测「老师们只挑简单的题讲」漏判——应试博弈是
  // 指标博弈在教育场景的核心形）
  /只挑[^。！？]{0,8}(?:简单|容易|基础|会考)|只讲[^。！？]{0,6}(?:简单|容易|基础)|专挑[^。！？]{0,8}(?:简单|容易)|为考试而教|应试技巧/,
  // 流量内容博弈形（标题党/震惊体——为点击率而生产低质内容）
  /标题党|震惊体|贩卖焦虑|情绪化标题|煽动性标题/,
];

const GAMED_EN = [
  /\b(?:gamed|gaming|game\s+the\s+(?:metric|system|numbers?))\b/i,
  /\boptimiz(?:e|ed|ing|ation)\s+for\s+the\s+(?:number|metric|score|chart)\b/i,
  /\b(?:padded|inflated|inflating|cooked|fudged|massaged)\s+(?:the\s+|their\s+|our\s+)?(?:numbers?|figures?|stats?|metrics?|results?|code|commits?|tests?|tickets?)\b/i,
  /\b(?:split|splitting|broke\s+up)\s+(?:one\s+)?(?:bug|ticket|task|issue|item)\s+into\b/i,
  /\bno\s+longer\s+(?:reflects?|measures?|captures?|is\s+a\s+good\s+measure)\b/i,
  /\b(?:stopped|ceases?)\s+being\s+a\s+good\s+measure\b/i,
  /\brefus(?:e|ed|ing)\s+to\s+(?:take|accept|process|handle)\b/i,
  /\b(?:nobody|no\s+one)\s+(?:cares?|looks?|bothers?|measures?)\b/i,
  /\b(?:what(?:'s|s)?\s+actually\s+important|the\s+real\s+goal)\s+(?:is\s+)?(?:ignored|forgotten|sidelined|sacrificed)\b/i,
  /\b(?:vanity|cosmetic)\s+(?:metric|number|figure)s?\b/i,
  // 刷量产物形（bot followers / fake installs / empty packages）
  /\b(?:bot|fake|dummy|hollow|empty)\s+(?:followers?|installs?|accounts?|packages?|downloads?|tests?|engagement|traffic|views?)\b/i,
  /\bshipped\s+(?:empty|hollow|dummy|fake)\b/i,
  /\b(?:counts?|figures?|numbers?)\s+(?:were\s+)?(?:inflated|padded|cooked|fudged|massaged)\b/i,
  /\bonly\s+(?:cares?|optimizes?)\s+for\s+the\s+(?:number|metric|score)\b/i,
  // 裸 optimize-for 兜底（optimized for citations / optimized for whatever is measured）
  /\boptimiz(?:e|ed|ing|ation)\s+for\b[^.!?]{0,30}\b(?:citations?|followers?|installs?|downloads?|views?|numbers?|whatever\s+is\s+measured|the\s+measure)\b/i,
  // 反效用博弈形（dark patterns / lock-in / paywall 陷阱——为指标制造人为摩擦）
  /\b(?:dark\s+patterns?|lock-?in|engagement\s+loops?|addictive\s+design)\b/i,
  // 刷量产物形：fake/bought + 流量词（bought fake traffic / fake engagement）
  /\b(?:fake|bought|purchased|artificial|synthetic)\s+(?:traffic|engagement|followers?|installs?|reviews?|downloads?|users?)\b/i,
  // padded/padded up + 任意宾语（padded their code / padded the line count）
  /\b(?:padded|pads|padding)\b[^.!?]{0,30}\b(?:code|lines?|count|numbers?|figures?|stats?|metrics?)\b/i,
];

// ─── 连接词/后果标记（条件-后果结构，区别于 proxy_metric_goal 的因果连接）──
const CONN_ZH = [
  /之后|以后|下来|起|结果|于是|随后|接下来|从此|自此|进而|导致|使得|让|逼得|迫使/,
];
const CONN_EN = [
  /\b(?:so|then|and\s+so|which\s+led\s+to|leading\s+to|as\s+a\s+result|until)\b/i,
  // 条件-后果标记（once/when/after/as soon as）——EN 侧与 TARGET_VERB_EN
  // 第二条同表，但此处判「窗口内出现条件连接」即认可因果结构（r425 实测：
  // "once it was made the target" 无逗号，缺此项会整句 miss）。
  /\b(?:once|when|whenever|as\s+soon\s+as|after|before)\b/i,
];

// ─── 豁免一：主动分离指标与目标（正确判别，不是谬误）──────────────
const EXEMPT_SEP_ZH = [
  /不等于|不代表|不意味着|不说明|说明不了|证明不了|推不出|算不上|称不上|并非|而不是|而非|并不能说明/,
  /不能反映|难以反映|无法反映|不能衡量|难以衡量|无法衡量|不足以证明|不足以说明/,
  /只是(?:一个)?(?:参考|指标|过程|手段|代理|侧面|表象|结果)|仅仅是参考|不过是参考|仅供参考/,
  /只能说明|另一回事|另行(?:评估|验证|测量)|单独(?:看|评估|衡量)|分开(?:看|评估|衡量)/,
  /不能只看|不能只靠|不能仅凭|不应只看|勿以|关键要看|才是(?:目标|目的|关键|根本|实质)/,
];
const EXEMPT_SEP_EN = [
  /\bis\s+(?:only|just)\s+a\s+(?:proxy|metric|measure|means)/i,
  /\bdoes\s+not\s+(?:mean|prove|guarantee|reflect)/i,
  /\bdoesn'?t\s+(?:mean|prove|guarantee|reflect)/i,
  /\bnot\s+the\s+same\s+(?:as|thing)\b/i,
  /\bwhat\s+matters?\s+is\b/i,
  /\ba\s+means?,?\s+not\s+an?\s+end\b/i,
];

// ─── 豁免二：指标设计/审计在场（修制度者不是在博弈指标）────────────
const EXEMPT_FIX_ZH = [
  /重新(?:设计|校准|修订|定义)(?:指标|度量|口径|统计)/,
  /校准|校验|纠偏|防刷|反作弊|反刷|风控|审计(?:读数|数据|指标)/,
  /对照(?:目标|真实|实际)(?:直接)?(?:测量|验证|评估)/,
  /交叉验证|多源验证|第三方(?:复核|审计|检测)/,
  /一票否决|负向指标|扣分项|逆向考核/,
];
const EXEMPT_FIX_EN = [
  /\bre-?(?:designed?|calibrated?|revised?|defined?)\s+(?:the\s+)?(?:metric|measure|KPI)/i,
  /\bguard(?:ed|ing)?\s+against\s+(?:gaming|Goodhart)/i,
  /\banti-?(?:gaming|fraud|cheat)\b/i,
  /\b(?:cross-?validat|triangulat|measured\s+directly)\w*/i,
  /\bthird[- ]party\s+(?:audit|verification|assessment)\b/i,
];

// ─── 豁免三：对冲（概率化陈述，同 r186/r189 口径）─────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|未必|不一定|不见得|大概|恐怕|多半|说不定|很难说|有待|仍需|还需|尚且|不好说/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|possibly|probably|not\s+necessarily|unclear|remains\s+to\s+be\s+seen)\b/i,
];

// ─── 豁免四：概念/教学转述（讨论这个概念本身不是运用它）────────────
const EXEMPT_META_ZH = [
  /古德哈特|代理指标|指标扭曲|指标失真|虚荣指标|绩效主义|唯指标|唯GDP|唯分数|分数至上|应试|刷分|刷指标|KPI主义|指标博弈|博弈指标|古德哈特定律/,
  // 教学语境限定：只豁免「老师说/教材/课堂」等**讨论语境**，
  // 不豁免叙述中的教师博弈场景（r425：「老师为了提高平均分把差生安排
  // 成缺考」是本族典型攻击形，裸「老师」一词曾把整句误放过）。
  /老师(?:说|指出|讲|认为|在课堂上)|课堂(?:上|教学)|教材|课本|教案|讲师|教授说|案例分析|逻辑课/,
  /论文(?:指出|表明|发现|中)|研究(?:表明|发现|显示)/,
];
const EXEMPT_META_EN = [
  /\bGoodhart(?:'s)?\s+law\b/i,
  /\b(?:proxy\s+metric|metric\s+distortion|vanity\s+metric|gaming\s+the\s+metric|metric\s+gaming)\b/i,
  /\b(?:teacher|classroom|textbook|lecture|course\s+material|case\s+study)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 在 text 的 from 偏移起找 list 中最早出现的匹配，返回 {idx, len} 或 null */
function firstMatch(list, text, from) {
  const start = from || 0;
  const sub = text.slice(start);
  let best = null;
  for (const re of list) {
    const m = sub.match(re);
    if (m && m.index >= 0 && (!best || m.index < best.idx)) {
      best = { idx: start + m.index, len: m[0].length };
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMetricGaming(text, inject) {
  // [稳定性审计] 非字符串入口守卫：number/object 会让 text.slice 崩溃。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  // 注入归一化：负例脚本传入的可能是「永不匹配正则」（RegExp 非数组），
  // 统一包成数组——anyHit/firstMatch 都只吃数组（r190 实现教训）。
  const norm = v => (Array.isArray(v) ? v : [v]);
  const R = inject || {};
  const METZ = norm(R.TARGET_METRIC_ZH || TARGET_METRIC_ZH);
  const METE = norm(R.TARGET_METRIC_EN || TARGET_METRIC_EN);
  const VBZ = norm(R.TARGET_VERB_ZH || TARGET_VERB_ZH);
  const VBE = norm(R.TARGET_VERB_EN || TARGET_VERB_EN);
  const GMZ = norm(R.GAMED_ZH || GAMED_ZH);
  const GME = norm(R.GAMED_EN || GAMED_EN);
  const CNZ = norm(R.CONN_ZH || CONN_ZH);
  const CNE = norm(R.CONN_EN || CONN_EN);
  const SEPZ = norm(R.EXEMPT_SEP_ZH || EXEMPT_SEP_ZH);
  const SEPE = norm(R.EXEMPT_SEP_EN || EXEMPT_SEP_EN);
  const FIXZ = norm(R.EXEMPT_FIX_ZH || EXEMPT_FIX_ZH);
  const FIXE = norm(R.EXEMPT_FIX_EN || EXEMPT_FIX_EN);
  const HDGZ = norm(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH);
  const HDGE = norm(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN);
  const METZ2 = norm(R.EXEMPT_META_ZH || EXEMPT_META_ZH);
  const METE2 = norm(R.EXEMPT_META_EN || EXEMPT_META_EN);

  // 全局豁免：主动分离 / 指标修复在场 / 对冲 / 概念教学 / 疑问句
  if (anyHit(SEPZ, text) || anyHit(SEPE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(FIXZ, text) || anyHit(FIXE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(HDGZ, text) || anyHit(HDGE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(METZ2, text) || anyHit(METE2, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const METRIC = METZ.concat(METE);
  const VERB = VBZ.concat(VBE);
  const GAMED = GMZ.concat(GME);
  const CONN = CNZ.concat(CNE);
  // 邻近窗：腿①（指标×立目标动词）与腿②（博弈/失效）总跨度上限。
  // 取 120 字（EN 260 字符）——本族典型句式「当 X 成为 KPI 之后，大家就 Y」
  // 比 proxy_metric_goal 的「指标读数→目标达成」长（条件-后果结构带从句）。
  const SPAN = isZh ? 120 : 260;

  const metric = firstMatch(METRIC, text, 0);
  if (!metric) return { hit: false, score: 0, detail: '', count: 0 };
  const verb = firstMatch(VERB, text, 0);
  if (!verb) return { hit: false, score: 0, detail: '', count: 0 };
  // 腿①内部结构校验：指标与立目标动词须同窗共现（「成为KPI」「当成考核」），
  // 防止「覆盖率很高，因为大家刷数据」这类无「立为目标」语义的误配。
  // ZH 40 字 / EN 90 字符——EN 句式「The metric stopped being a good measure
  // once it was made the target」中名词与动词跨从句，窗需放宽（r425 实测）。
  const LEG1_SPAN = isZh ? 40 : 90;
  const leg1Lo = Math.min(metric.idx, verb.idx);
  const leg1Hi = Math.max(metric.idx + metric.len, verb.idx + verb.len);
  if (leg1Hi - leg1Lo > LEG1_SPAN) return { hit: false, score: 0, detail: '', count: 0 };
  const leg1 = { lo: leg1Lo, hi: leg1Hi };

  // 逐个博弈/失效腿匹配，统计共现次数（同 r186/r190 结构）
  let count = 0;
  let bestScore = 0;
  let firstDetail = '';
  for (let from = 0; from < text.length;) {
    const gamed = firstMatch(GAMED, text, from);
    if (!gamed) break;
    const lo = Math.min(leg1.lo, gamed.idx);
    const hi = Math.max(leg1.hi, gamed.idx + gamed.len);
    if (hi - lo <= SPAN) {
      const window = text.slice(lo, hi);
      // 本族接受两种结构：
      //   a) 条件-后果连接（成为KPI之后/一旦…就/于是/结果/导致）
      //   b) 直接并置（逗号/分号共现且无否定分离词）——「覆盖率成了KPI，测试
      //      全是空断言」
      const hasConn = anyHit(CONN, window);
      const juxtapose = /[，,；;]/.test(window);
      if (hasConn || juxtapose) {
        count++;
        if (count === 1) {
          // 强失效宣告（不再是好的度量/失效/失真/数字游戏）提分——
          // 陈述者明确宣告度量本身失效时，谬误强度更高。
          const strong = /不再是|失效|失灵|失真|数字游戏|no\s+longer|stopped\s+being/i.test(window);
          bestScore = strong ? 0.72 : 0.62;
          firstDetail = isZh
            ? '指标博弈×指标立为目标×度量失效/被刷共现(zh)'
            : 'metric-gaming×metric-as-target×measure-corruption(en)';
        } else if (bestScore < 0.72) {
          bestScore = 0.72; // 多处共现提分
        }
      }
    }
    from = gamed.idx + gamed.len;
  }

  if (count > 0) {
    return { hit: true, score: bestScore, detail: firstDetail, count };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkMetricGaming,
  __internals: () => ({
    TARGET_METRIC_ZH, TARGET_METRIC_EN, TARGET_VERB_ZH, TARGET_VERB_EN,
    GAMED_ZH, GAMED_EN, CONN_ZH, CONN_EN,
    EXEMPT_SEP_ZH, EXEMPT_SEP_EN, EXEMPT_FIX_ZH, EXEMPT_FIX_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN, EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
