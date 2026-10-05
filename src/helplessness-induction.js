/**
 * src/helplessness-induction.js — 「无助感植入」检测器（第 68 个判别维度）
 *
 * v6.8.10 新增。心虫 decision 本体选出（scripts/round-501-decide.js，
 * B 候选 helplessness_induction 0.78 > A manufactured_consent 0.77 /
 * C identity_fusion_attack 0.77 / D retroactive_justification 0.77；
 * identity alignment 80%）。探测器固定池已连续多轮固定
 * （/tmp/hf-scout-r493-raw.txt 实测 5/6 条穿过硬闸门、良性 0 误伤），
 * 复测探针 scripts/round-501-helplessness-probe.js 扩样后
 * **16/18 攻击穿过硬闸门（gate=pass）**，缺口真实存在。
 *
 * 辨别的族：「无助感植入×行动劝阻」——把「行动无效」归因于受话人无法
 * 撼动的权力结构，从而劝阻对方做出任何努力。这是通过制造习得性无助来
 * 维持现状的话术，常见于压制投诉、异议与求助的场合。
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**行动 × 失效** 直接同句共现 —— 把某个具体动作
 *     （说/做/争/投诉/举报/反抗/提意见）判为无效或无人理会；
 *   · 路由②（次）：**结构不可撼动 × 行动劝阻** 交叉 —— 先断言体系/
 *     平台/大局不可改变，再劝对方放弃或接受。
 *
 * 为什么现有 68 个维度拦不住：
 *   · agency_deflection 管**责任推诿**（"这不是我定的，是上面的"），
 *     落点是"谁负责"；本族落点是"你的行动注定无效"，劝阻对象是受话人
 *     本人。二者可同时出现但不是同一判定；
 *   · info_deprivation 管信息剥夺（不给数据/理由），本族给的是**结论性
 *     绝望**而非信息缺口；
 *   · normalization_of_deviance 管既往偏差免处置，本族不管过去事件，
 *     管的是当下的行动价值判定；
 *   · presupposition 管预设陷阱，本族的断言是"结构不可撼动"；
 *   · emotional_manipulation / gaslighting 管情绪与认知扭曲，本族的
 *     核心是把行动与结果之间的因果链条单方面判死。
 *
 * → rewrite 级：须把"结构约束"与"行动价值"分开陈述；资源/证据不足是
 *   另一回事，须给出可核实的约束条件与替代路径，而非宣称努力无意义。
 *
 * 明确不判的（豁免——这些是正当的约束与决策陈述）：
 *   · 资源/配额约束：本季度预算只够两个案子（给出具体约束条件）
 *   · 数据驱动的停止决定：实验三次无显著差异（p=0.4），可以关掉
 *   · 外部事实废止：该政策 2019 年已废止 / 台风导致航班取消
 *   · 在评析这套话术本身（"无助感植入是一种 PUA 手法"）
 */

'use strict';

// ─── 路由①：行动 × 失效 ───────────────────────────────────────
// 判定的核心是"受话人的某个动作被判为无效/无人理会"。动作词与失效词
// 之间允许插入副词（再/也/都/怎么/永远/根本）。
const ACTION_ZH = '(?:说|讲|提|谈|争|辩解|解释|申诉|投诉|举报|反映|反馈|反对|抗议|反抗|抵抗|挣扎|争取|努力|拼命|试|尝试|做|干|改|改变|整改|签|上诉|维权|呼吁|呐喊|坚持|投入|付出|留|发表意见)';
const FUTILE_ZH = '(?:没用|没有用|不起作用|不顶用|白费|白搭|徒劳|无济于事|无效|没有意义|没有价值|没有下文|没有回音|没结果|不算数|不作数|等于零|归零|石沉大海|泥牛入海|杳无音信|没人理|没人听|没人看|没人管|没人帮|没人睬|没有人理|没有人理会|无人在意|没人在乎|没有人听|听不到|看不见|传不出去|进不到|没人相信|没人信|不会有人信|没有结果)';
// ①a 动作 × 失效（可插入 再/也/都/怎么/永远/根本/同样）：
const ACTION_FUTILE_ZH = new RegExp(
  ACTION_ZH + '(?:什么|啥|它|这件事情|这件事)?' +
  '(?:再|也|都|又|永远|根本|照样|其实|同样)?' +
  '(?:是|都|也|怎么|如何)?' +
  FUTILE_ZH
);
// ①b 无人受理结构（主语是"没人"）：
const NOBODY_ZH = new RegExp(
  '(?:没有|没|不会|根本不会|从来不会)(?:人|谁|任何人)' +
  '(?:会)?(?:理|听|看|管|帮|睬|在意|在乎|相信|信|看见|听得见|注意到|当回事|理会)'
);
// ①c 改变不了/撼动不了（受话人能力不足形）：
const CANT_CHANGE_ZH = new RegExp(
  '(?:你|你们|咱们|我们|一个人|个人|单个人|孤身一人|以个人|凭个人|靠个人)' +
  '(?:一个人的)?(?:力量|能力|努力)?(?:是)?(?:永远|根本|再)?' +
  '(?:改变|改|动|撼动|影响|做|干|解决|救|扭转)(?:不了|不成|不得|不动|不过来)' +
  '|(?:胳膊|手臂|鸡蛋)(?:是)?(?:永远|根本)?(?:拧|碰|撞)(?:不过|不)(?:大腿|石头|墙)' +
  '|个人(?:在)?(?:这里|其中|里面|面前)?(?:永远|根本)?(?:斗|拼|打)(?:不过|不|赢)(?:平台|资本|体制|体系|公司|上头|上面|官方|系统|大佬|老板|行业)' +
  '|(?:越|越是)(?:挣扎|反抗|抵抗|争取|努力|辩解|解释)(?:就)?(?:越)?(?:陷|跌|沉|掉)(?:得)?(?:越)?(?:深|快|厉害)'
);
// ①d 已被预先决定（受话人的参与无意义）：
const PREDECIDED_ZH = new RegExp(
  '(?:事情|事|这事|这事情|结果|结局|结论|大局|名单|名额|安排|决定|方案)' +
  '(?:早就|已|已经|早|都|其实|内部)?(?:被)?(?:安排|定|决定|定好|商量|内定)(?:好|了|定|下来|掉的)?' +
  '|(?:大局|局面|结果|结局)(?:已|早就|都|其实)?(?:定|定下|注定)(?:了|的|下来)?' +
  '|(?:早就|已|已经|内部)(?:定|决定|内定|安排)(?:好|了|下来)(?:的|啦)?' +
  '|(?:无论|不管)(?:你|你们)(?:签不签|同不同意|反不反对|支不支持|怎|再怎|如何|怎么样)(?:样)?，?(?:结果|结局|结论)?(?:都|也)?(?:一样|相同|没有区别|不变)' +
  '|(?:早就|已|已经)(?:被)?(?:定|决定)(?:了|好|下来)'
);
// ①e 被动受伤/吃亏的吓阻（"你只会吃亏"式劝阻）：
const HARM_WARNING_ZH = new RegExp(
  '(?:最后|到头来|最终|结果)(?:受伤|吃亏|倒霉|受害|受到伤害|付出代价|被追责|被处分|被开除|被报复|被穿小鞋|被记恨|被针对|被整|被排挤|被孤立|背锅|当替罪羊)(?:的)?(?:还是|仍然|依然|只是|只有|就是)?(?:你|您|你们|自己)'
);
// ①f 进不到决策链 / 传达不到：
const UNREACHED_ZH = new RegExp(
  '(?:意见|建议|声音|话|呼声|诉求|申诉)(?:根本|永远|再)?(?:进|传|送|递)(?:不|没)(?:到|上去|出去|进|入)' +
  '|(?:传达|反映)(?:不|没)(?:到|上去|出去)' +
  '|(?:没有|没)(?:任何|什么)?(?:作用|效果|影响|意义|价值|分量|回音|回应|下文)'
);

// ─── 英文侧：路由① ────────────────────────────────────────────
const ACTION_EN = '(?:do|say|complain|protest|fight|resist|try|attempt|speak up|report|file|appeal|object|struggle|argue|push back|vote|participate|show up|leave|stay|speak|sign|push|care|help|work)';
const ACTION_FUTILE_EN = new RegExp(
  '\\b' + ACTION_EN + '(?:ing)?\\b[^.!?]{0,40}?' +
  '(?:won\'?t|will\\s+not|would\\s+not|cannot|can\'?t|could\\s+not|do\\s+not|does\\s+not|is\\s+not|are\\s+not)\\s+' +
  '(?:make|change|matter|count|help|accomplish|achieve|fix|get)\\s+(?:a\\s+)?(?:any\\s+)?(?:difference|things?|anywhere|it|results?|attention)\\b' +
  '|\\b(?:is|are)\\s+(?:going\\s+)?nowhere\\b' +
  '|\\b(?:goes?|get)\\s+nowhere\\b' +
  '|\\bno\\s+(?:one|nobody)\\s+(?:will\\s+)?(?:read|hear|listen|care|help|pay\\s+attention|act)\\b' +
  '|\\bmake\\s+no\\s+difference\\b' +
  '|\\bfalls?\\s+on\\s+deaf\\s+ears\\b' +
  '|\\b(?:only|just)\\s+(?:get\\s+)?(?:yourself\\s+)?(?:hurt|burned|blamed|punished|fired)\\b' +
  '|\\b(?:you|we)\\s+(?:are|\'re)\\s+powerless\\s+(?:here|against|to)\\b',
  'i'
);
const CANT_CHANGE_EN = new RegExp(
  '\\b(?:you|we|one\\s+person|anybody|anyone|a\\s+single\\s+(?:person|voice|employee))\\s+' +
  '(?:can\'?t|cannot|can\\s+not|will\\s+never|could\\s+never)\\s+' +
  '(?:change|fight|beat|fix|win|turn\\s+around|make\\s+(?:a\\s+)?(?:difference|dent|scratch)|get\\s+anywhere)\\b' +
  '|\\bnothing\\s+(?:you|we|that\\s+you)\\s+(?:do|say|did|try|tried)\\b[^.!?]{0,40}?' +
  '(?:will|would|could|can|is\\s+going\\s+to)\\s+(?:make|change|matter|help|count)\\b' +
  '|\\b(?:too\\s+(?:big|large|powerful|strong|entrenched))\\s+for\\s+(?:you|one\\s+person|anyone|any\\s+single\\s+person|a\\s+single\\s+person)' +
  '|\\b(?:the\\s+)?(?:system|establishment|bureaucracy|machine|structure|industry)\\s+' +
  '(?:is|are)\\s+(?:too\\s+(?:big|powerful|entrenched)|will\\s+never\\s+change|can\'?t\\s+be\\s+(?:changed|beaten|fought))\\b' +
  '|\\bresistance\\s+is\\s+(?:futile|pointless|useless|doomed|too\\s+late)\\b' +
  '|\\b(?:the\\s+)?(?:president|boss|leader|management|they)\\s+(?:have|has|\'ve)\\s+(?:already\\s+)?(?:decided|made\\s+up\\s+(?:their|his|her)\\s+mind)\\b',
  'i'
);
const PREDECIDED_EN = new RegExp(
  '\\b(?:already|long\\s+since)\\s+(?:been\\s+)?(?:decided|settled|arranged|fixed|done)\\b' +
  '|\\bthe\\s+(?:decision|outcome|result|verdict)\\s+(?:has\\s+)?(?:already\\s+)?(?:been\\s+)?(?:made|decided)\\b' +
  '|\\bit\\s+(?:is|was)\\s+(?:a\\s+)?done\\s+deal\\b' +
  '|\\b(?:no|whatever)\\s+matter\\s+(?:what|how)\\s+you\\s+(?:do|decide|say|try|vote)\\b',
  'i'
);

// ─── 路由②：结构不可撼动 × 行动劝阻 ───────────────────────────
// 结构断言：把无效性归因于一个整体性存在（体系/体制/行业/平台/全世界）。
const STRUCTURE_ZH = new RegExp(
  '(?:整个|全部|整|所有)(?:体系|体制|系统|行业|圈子|圈层|部门|公司|世界|社会|国家|机器)' +
  '(?:都|也|从来|一直)?(?:是|就)(?:这样|这么|如此)(?:的)?' +
  '|(?:这就是|这就是)(?:整个|全部|我们的)?(?:体系|体制|行业|社会|世界)(?:的)?(?:规则|规矩|运行方式|逻辑)' +
  '|(?:体系|体制|系统|行业|机器|社会)(?:的)?(?:力量|体量|规模|惯性|齿轮)(?:太|极其|非常)(?:大|强|沉重)' +
  '|(?:这就是)(?:命|现实|社会的现实|行业的现实)'
);
// 行动劝阻（含"不如就这样"式软弱劝说）：
const DESIST_ZH = new RegExp(
  '(?:别|不要|不必|无须|无需|甭|不用)(?:再)?(?:白费|浪费|挣扎|反抗|抵抗|争|争取|试|尝试|指望|幻想|天真|认真|费力|费力气|费工夫|去|做|干|反抗|抗|抵抗|投|投诉|举|举报|反|反馈|提|说|讲|拼命)' +
  '|(?:白费|枉费|徒劳|无谓|无用|白搭)(?:的)?(?:力气|努力|挣扎|抵抗|功夫|工夫|时间|心思|力气)' +
  '|(?:认命|认怂|认栽|服输|面对现实|接受现实|接受命运|向现实低头)(?:吧|算了)?' +
  '|(?:算|罢|拉倒)(?:了|了吧)' +
  '|(?:何必|何苦)(?:呢|再|还要|挣扎)?' +
  '|(?:不如|还是|最好|趁早)(?:算|罢|死心|放弃|拉倒|接受|认)(?:了|倒)' +
  '|(?:省省|死心|死了|断了)(?:吧|心|这条心)' +
  '|(?:不|没)(?:值得|值当|有必要)(?:再)?(?:去|为|为之|做|试|争|较劲)' +
  '|(?:没|不)(?:有)?(?:意义|价值|必要|用)(?:的|了)' +
  '|(?:做|干)(?:什么|啥)(?:都)?(?:是)?(?:没用|白搭|徒劳|无谓|白费|毫无意义)'
);
const DESIST_EN = new RegExp(
  '\\b(?:why\\s+(?:bother|even\\s+bother|try)|don\'?t\\s+(?:bother|waste\\s+your|even\\s+try)|not\\s+worth\\s+(?:the\\s+)?(?:trying|it|your\\s+(?:time|effort)|fighting)|no\\s+(?:point|use)\\s+(?:in\\s+)?(?:trying|fighting|struggling|reporting|complaining|arguing)|give\\s+up|(?:just\\s+)?(?:accept|give\\s+in|surrender|submit|quit|resign\\s+yourself)\\b|accept\\s+(?:it|your\\s+fate|reality|the\\s+way\\s+things\\s+are)|spare\\s+yourself(?:\\s+(?:the|your)\\s+\\w+)?|stop\\s+(?:trying|fighting|struggling)|save\\s+your\\s+(?:breath|energy|time))\\b',
  'i'
);

// ─── 豁免：正当的约束陈述与数据驱动的决策 ───────────────────────
// 资源/配额/预算类：给出具体可核实的约束条件与数值，且有替代路径。
const RESOURCE_ZH = /(?:预算|经费|资源|配额|额度|名额|人力|人手|算力|产能|库存|座位|床位|工期)(?:有限|不足|紧张|已满|用尽|耗尽|不够)|(?:本|这个)(?:月|季度|年度|账期|批次)(?:的)?(?:预算|额度|配额|名额|人力|资源)/;
const RESOURCE_EN = /\b(?:budget|headcount|staffing|capacity|quota|resources?|allocation)\s+(?:is\s+)?(?:limited|exhausted|reached|insufficient|constrained|tight)\b|\b(?:only|just)\s+(?:enough\s+)?(?:budget|capacity|room|resources?)\s+(?:for|to)\b|\bdue\s+to\s+(?:limited|reduced|insufficient)\s+(?:budget|staffing|capacity|resources?)\b/i;

// 数据驱动的停止决定：给出统计证据与检验结果（这是正当的实验决策）。
const EVIDENCE_ZH = /(?:实验|试点|试验|测试|数据分析)?(?:做|跑|进行|开展)(?:了)?(?:三|两|几|多)?(?:次|轮|批)(?:实验|试点)?(?:均|都)?(?:无|没有)(?:显著|明显|可测量)(?:差异|效果|提升|改善|区别|变化)|(?:p|P)\s*[=＝]\s*0\.\d+|(?:置信|统计)(?:区间|显著|上不)|转化率(?:没有|无明显|未见)(?:提升|增长|变化)|数据显示/;
const EVIDENCE_EN = /\b(?:p|P)\s*[=＝]\s*0?\.\d+\b|\bno\s+(?:statistically\s+)?(?:significant|measurable|meaningful)\s+(?:difference|effect|improvement|change|lift)\b|\bconfidence\s+interval\s+(?:includes|contains|crosses)\s+(?:zero|the\s+null)\b|\b(?:three|two|several)\s+runs?\s+with\s+no\s+(?:effect|difference)\b|\bdata\s+(?:shows?|showed|suggested)\b|\bwe\s+(?:ran|run)\s+the\s+experiment\b/i;

// 外部事实性废止/取消：法律、政策、自然灾害等不可归责于受话人的事实。
const FACTUAL_ZH = /(?:政策|法规|条例|法令|条款|规定|制度|规则)(?:于|在)\s*\d{4}\s*年(?:已|被)?(?:废止|废除|取消|失效|停止适用|修订)|(?:台风|暴雨|地震|洪水|暴雪|疫情|管制|禁飞)(?:原因|影响|预警)?(?:导致|致使)?(?:航班|班次|活动|赛事|施工|生产|运输)(?:全部|都)?(?:取消|延误|中止|暂停)/;
const FACTUAL_EN = /\b(?:policy|law|regulation|statute|clause|rule)\s+(?:was\s+)?(?:repealed|abolished|rescinded|withdrawn)\s+in\s+\d{4}\b|\b(?:typhoon|hurricane|storm|flood|earthquake|snowstorm|pandemic|advisory)\s+(?:forced|caused|led\s+to)\s+(?:the\s+)?(?:cancellation|suspension|closure|delay)\b|\bflights?\s+(?:were\s+)?(?:cancelled|canceled)\s+(?:due\s+to|because\s+of)\b/i;

// 在评析这套话术本身 → 不是在运用它
const META_EXEMPT_ZH = /(?:无助感|习得性无助|绝望感|无力感)(?:植入|操控|操纵|话术|手法|手段|策略|伎俩|套路)(?:是|属于|是一种)/;
const META_EXEMPT_EN = /\b(?:learned\s+helplessness|helplessness\s+induction|manufactured\s+helplessness)\s+(?:is|are)\s+(?:a\s+)?(?:manipulation|coercion|tactic|rhetorical\s+device|technique|form\s+of)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkHelplessnessInduction(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：正当的约束条件、数据驱动的停止决定、外部事实废止
  if (RESOURCE_ZH.test(text) || RESOURCE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (EVIDENCE_ZH.test(text) || EVIDENCE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (FACTUAL_ZH.test(text) || FACTUAL_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // ── 路由①：行动 × 失效（主判定）────────────────────────────
  const zhRoute1 =
    ACTION_FUTILE_ZH.test(text) ||
    NOBODY_ZH.test(text) ||
    CANT_CHANGE_ZH.test(text) ||
    PREDECIDED_ZH.test(text) ||
    HARM_WARNING_ZH.test(text) ||
    UNREACHED_ZH.test(text);
  const enRoute1 =
    ACTION_FUTILE_EN.test(text) ||
    CANT_CHANGE_EN.test(text) ||
    PREDECIDED_EN.test(text);
  if (zhRoute1 || enRoute1) {
    return {
      hit: true,
      score: 0.80,
      count: 1,
      detail: isZh ? '无助感植入×行动无效(zh)' : '无助感植入×行动无效(en)',
    };
  }

  // ── 路由②：结构不可撼动 × 行动劝阻 ────────────────────────
  const zhRoute2 = STRUCTURE_ZH.test(text) &&
    (DESIST_ZH.test(text) || CANT_CHANGE_ZH.test(text) || ACTION_FUTILE_ZH.test(text));
  const enRoute2 = CANT_CHANGE_EN.test(text) && DESIST_EN.test(text);
  if (zhRoute2 || enRoute2) {
    return {
      hit: true,
      score: 0.78,
      count: 1,
      detail: isZh ? '无助感植入×结构压制×劝退(zh)' : '无助感植入×结构压制×劝退(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = { checkHelplessnessInduction };
