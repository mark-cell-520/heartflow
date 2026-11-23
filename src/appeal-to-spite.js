/**
 * src/appeal-to-spite.js — 「诉诸恶意/幸灾乐祸」检测器（第 286 个判别维度）
 *
 * [r457] 第 286 维度 appeal_to_spite（appeal to spite / 诉诸恶意）。
 *
 * 来源：GitHub causalNLP/logical-fallacy（★97，LogicClimate/LogicEdu 数据集的
 * 谬误族清单 codes_to_get_data/intermediate_data_files/fallacy_list.txt，
 * https://github.com/causalNLP/logical-fallacy ）+ HN Algolia「Translating
 * natural language to first-order logic for logical fallacy detection」
 * （arXiv:2405.02318，258 分）。清单中 appeal to spite 族心虫零覆盖，
 * 缺口实证（scripts/round-457/probe-r457-spite.js，v6.8.226）：10 条攻击
 * 样本 8 条穿透 gate=pass（victim_blaming 仅代拦 3 条，moral_foundations
 * 仅接管 1 条），确认真零覆盖族。
 *
 * 辨别的族：「诉诸恶意/幸灾乐祸」——说话人把他人已经发生的受损（失业、
 * 被骗、被罚、被封号、项目失败）认定为「应得的」，并用这份应得感取消
 * 同情、幸灾乐祸或拒绝援助。它的落点不是「受害者自己也有责任」
 * （victim_blaming 管归因分配），也不是「伤害不存在」
 * （harm_invalidation 管取消伤害事实），而是**用道德账本的应得判断
 * 替代对受损事实本身的审视**，并把这份判断当成不同情、不援助的理由。
 *
 * 攻击形状（一条判定路由：受损事实腿 × 应得/幸灾乐祸腿同句共现）：
 *   · 受损事实：失业/被骗/被封号/被起诉/被罚/被辞/被裁/倒闭/被网暴/
 *     被开除/破产/亏损/被拒/落选/失败/翻车/退圈/退赛/受伤/损失
 *     × 损失类动词（scammed/fired/laid off/hacked/fined/sued/banned/
 *     dumped/rejected/demoted/suspended/collapsed/lost）；
 *   · 应得/幸灾乐祸：活该/罪有应得/报应/自作自受/自找的/作死/遭报应/
 *     风水轮流转/苍天绕过谁/现世报/大快人心/恶有恶报/咎由自取/
 *     自食其果/搬石砸脚/自掘坟墓/笑看/看笑话/解气/痛快/好戏/天道好还；
 *     × serves him/her right / had it coming / deserved (it|every bit|
 *     worse) / karma / poetic justice / good riddance / no sympathy /
 *     don't feel sorry / reaping what / own doing / got what (he|she)
 *     deserved / schadenfreude / served right / asking for it。
 *
 * 为什么现有维度拦不住（r457 缺口实证 + 交叉归因）：
 *   · victim_blaming 落点是「受害者自己也有责任」，要求存在一个责备
 *     受害者的归因动作；本族谈的是「受损是应得的」，用道德账本取代
 *     事实审视。8/10 攻击穿透时 victim_blaming 只代拦 3 条（且多为
 *     英文 had it coming 形），中文「活该/报应」形全部穿过。
 *   · harm_invalidation 落点是「伤害这一事实不存在/不值一提」；本族
 *     承认受损事实，只是判定它应得——一条说「没受伤」，一条说「受伤
 *     是活该」，射程相反。
 *   · moral_foundations 是综合道德基线打分（10 条攻击中最多接管 1 条，
 *     其余 findings 全空），不针对这个句式族。
 *   · suffering_contest 管「比惨消诉」，要求两个苦难主体竞相举证；
 *     本族只有一个受损主体 + 一份应得判断，无竞赛结构。
 *   · schadenfreude / spite 在心虫 src/ 全库 grep 0 命中。
 *
 * → verify 级：受损是否应得、对方是否有可归责的行为，是可以核验的
 *    事实与法律问题（合同、绩效记录、司法判决），不是说话人可以
 *    单方以道德账本定性的。命中时要求给出可核验的归责依据（合同
 *    条款、绩效记录、判决书），而非以「活该」跳过核验、拒绝同情与
 *    援助。单句常是事故通报、司法结果复述、新闻转述，rewrite 会误伤，
 *    故不升 rewrite。
 *
 * 明确不判的（豁免——正当的事实陈述、司法复述与归责讨论）：
 *   · 司法/监管结果复述：经法院判决/经鉴定/被依法/调查结论/执行
 *     处罚/法律制裁/监管处罚/被吊销（执照）——附程序依据的正当陈述；
 *   · 客观归责说明：因……被（处罚|起诉|辞退|处分）+ 明确事由
 *     （违约|违规|违法|贪污|造假|失职|绩效不达标|连续三个月）；
 *   · 教学/讨论：诉诸恶意/幸灾乐祸/spite/schadenfreude 作为概念名的
 *     讨论、谬误分类清单、教材与论文引用；
 *   · 对冲与疑问：可能/也许/或许/大概/似乎/说不定/有待 + 疑问句。
 */

'use strict';

// ─── L1: 受损事实腿（他人已经发生的受损）─────────────────────────
// 注意 r161 教训：枚举腿必须收裸名词形态——同族词去掉「被/了」等后缀
// 仍须命中（「他失业了」与「失业」都能进腿）。受损名词族收裸形。
const HARM_ZH = new RegExp([
  // 失业/裁员/被骗/封号/起诉/罚款/辞退/倒闭/网暴/破产 裸名词 + 被动态
  '失业', '被裁', '裁员', '裁到', '裁掉', '下岗', '被炒', '炒鱿鱼',
  '被骗', '上当', '被诈', '遭诈', '被坑', '被割韭菜',
  '被封', '封号', '禁言', '被封杀', '被下架', '被屏蔽',
  '被起诉', '被告', '吃官司', '被罚', '被处', '罚款', '处罚',
  '被辞', '被开', '被开除', '除名',
  '倒闭', '破产', '清算', '注销', '停业',
  '被网暴', '被网爆', '网暴', '人肉', '被喷', '被冲', '被嘲',
  '被拒', '落选', '落榜', '被淘汰', '被刷', '被挂',
  '翻车', '塌房', '退圈', '退赛', '退网', '退播',
  '亏本', '亏损', '赔钱', '亏损额', '资不抵债',
  '被嘲', '被嘲讽', '被骂', '被围攻', '被声讨',
  // 受损动词裸形（作谓语的动补形）
  '遭了', '受了', '吃了亏', '吃了苦', '栽了', '摔了', '跌了', '崩了',
  '出事', '出了事', '出事', '遇上', '碰到',
  // 肢体受害裸形（打/揍 + 结果补语，不依赖被字）
  '被打', '挨打', '挨揍', '被打伤', '被打进', '打进医院', '进了医院',
  '打伤', '揍', '受伤', '住院', '挂了彩', '见血',
  // 金钱/资产受损裸形
  '赔光', '赔光', '亏光', '血本无归', '倾家荡产', '负债',
  '还不上', '还不起', '断供', '断贷',
].join('|'), 'g');

// 显式被动态：被/遭/受/挨 + 受损动词（第二通道，兜动态形）
const HARM_PASSIVE_ZH = new RegExp([
  '(?:被|遭|受|挨|吃)',
  '(?:裁|开|辞|罚|骗|坑|封|禁|告|诉|骂|嘲|喷|冲|嘲|轰|整|搞|封杀|网暴|人肉|围攻|声讨|淘汰|刷|挂|轰下|扒|爆料|曝光|举报|查封|吊销|拘|抓|判|罚)',
  '(?:了|掉|走)',  // 动补后缀（裸动词形也允许：被骗/被裁）
].join(''), 'g');

const HARM_EN = new RegExp([
  '\\b(?:was|were|got|is|are|been)\\s+(?:fired|laid\\s+off|sacked|dismissed|terminated|demoted)',
  '\\b(?:was|were|got|is|are|been)\\s+(?:scammed|defrauded|conned|swindled|phished)',
  '\\b(?:was|were|got|is|are|been)\\s+(?:hacked|breached|ransomwared|doxxed)',
  '\\b(?:was|were|got|is|are|been)\\s+(?:banned|suspended|deplatformed|blocked|muted|cancelled)',
  '\\b(?:was|were|got|is|are|been)\\s+(?:fined|penalised|penalized|sanctioned|sued|prosecuted|charged)',
  '\\b(?:was|were|got|is|are|been)\\s+(?:rejected|dumped|demoted|demoted|dropped|denied|excluded)',
  '\\b(?:was|were|got|is|are|been)\\s+(?:demoted|relegated|eliminated|knocked\\s+out|ousted)',
  '\\b(?:company|startup|firm|business|project)\\s+(?:collapsed|failed|folded|went\\s+bankrupt|crashed|imploded)',
  '\\b(?:lost|forfeited|gave\\s+up)\\s+(?:his|her|their|the)\\s+(?:job|position|savings|money|licen[cs]e|account|deal)',
  '\\b(?:bankrupt(?:cy|ed)?|layoffs?|scam(?:med)?|hacked)\\b',
  '\\b(?:unemployed|jobless|fired|sacked|banned|suspended|doxxed|scammed|defrauded)\\b',
  '\\b(?:layoffs?|redundanc(?:y|ies)|mass\\s+dismissal)\\b',
  '\\b(?:hospitali[sz]ed|injured|hurt|beaten\\s+up|attacked|assaulted)\\b',
  '\\b(?:bankrupt|broke|destitute|ruined|wiped\\s+out)\\b',
].join('|'), 'gi');

// ─── L2: 应得/幸灾乐祸腿（把受损认定为应得 + 拒绝同情/庆幸）────────
const DESERVED_ZH = new RegExp([
  '活该', '罪有应得', '报应', '现世报', '恶报', '恶有恶报',
  '自作自受', '自作孽', '自找', '自找的', '自找苦吃', '自讨苦吃',
  '作死', '咎由自取', '自食其果', '自食恶果', '自吞苦果',
  '搬起石头砸自己的脚', '搬石砸脚', '自掘坟墓', '自取灭亡',
  '风水轮流转', '苍天绕过谁', '天道好还', '不是不报',
  '大快人心', '人心大快', '皆大欢喜',
  '不值得同情', '不配同情', '不同情', '无须同情', '没什么可同情',
  '不值得可怜', '不可怜', '不同情他', '不同情她',
  '解气', '痛快', '真解气', '大快',
  '好戏', '看戏', '看笑话', '笑看', '等着看', '有好戏看',
  '现世报来得太快', '遭了报应', '遭到报应',
  // 应得许可形（应得 + 受损 因果连接）
  '应得', '活该如此', '纯属活该', '就是活该', '那是报应',
].join('|'), 'g');

const DESERVED_EN = new RegExp([
  '\\bserves?\\s+(?:him|her|them|right)\\b',
  '\\bserved\\s+(?:him|her|them)\\s+right\\b',
  '\\bhad\\s+it\\s+coming\\b',
  '\\bhas\\s+it\\s+coming\\b',
  '\\bdeserved\\s+(?:it|every\\s+bit|worse|what|this|that|to\\s+be\\s+(?:fired|banned|scammed|punished))',
  '\\bgot\\s+what\\s+(?:he|she|they)\\s+deserved\\b',
  '\\bdeserves\\s+what\\s+(?:he|she|they)\\s+(?:got|get)\\b',
  '\\b(?:poetic\\s+justice|just\\s+deserts?|karmic?\\s+justice)\\b',
  '\\bkarma\\s+(?:caught\\s+up|struck|bit|paid|got)\\b',
  // [r458 补腿] 裸 karma 形：Karma for ... / Karma is ... / Karma at
  // its finest / karma in action——缺动词后缀的宣告形（探针 MISS 实证：
  // "The company got hacked? Karma for exploiting its users."）
  '\\bkarma\\s+(?:for|in|is|at|works|has\\s+a\\s+way)\\b',
  "\\bthat\\'?s\\s+karma\\b",
  "\\bthat\\s+(?:is|was)\\s+(?:just\\s+|pure\\s+|simple\\s+)?karma\\b",
  '\\bwhat\\s+goes\\s+around\\s+comes\\s+around\\b',
  '\\bgood\\s+riddance\\b',
  '\\breaping\\s+what\\s+(?:he|she|they)\\s+sowed\\b',
  '\\bsowed\\s+the\\s+wind\\b',
  '\\b(?:his|her|their)\\s+own\\s+(?:doing|fault|fault)\\b',
  '\\bno\\s+sympathy\\b',
  "\\b(?:don'?t|do\\s+not|won'?t|cannot|can'?t)\\s+feel\\s+(?:sorry|sympath(?:y|etic))\\b",
  '\\b(?:i|we)\\s+(?:feel|have)\\s+no\\s+(?:sympathy|pity|compassion)\\b',
  "\\b(?:not|isn'?t|aren'?t)\\s+(?:feel\\s+)?(?:sorry|sympath(?:y|etic))\\s+(?:for|about)\\b",
  '\\basking\\s+for\\s+it\\b',
  '\\basked\\s+for\\s+it\\b',
  '\\bschadenfreude\\b',
  '\\b(?:serves|serve)\\s+(?:him|her|them)\\s+(?:right|justly)\\b',
  '\\bhad\\s+it\\s+come\\s+to\\s+(?:him|her|them)\\b',
].join('|'), 'gi');

// ─── 豁免：正当的事实陈述、司法复述与归责讨论 ─────────────────────
// r526 先例：豁免为句级属性，命中即整句不判。
const EXEMPT_ZH = new RegExp([
  // 司法/监管结果复述（附程序依据）
  '经(?:法院|检察院|公安机关|监管部门|劳动仲裁|鉴定机构)',
  '依(?:法|照|据)(?:判决|裁定|处罚|处理|查处|追究)',
  '经(?:判决|裁定|审理|仲裁|鉴定|调查|查实)',
  '法律制裁', '司法程序', '执法记录', '处罚决定书', '判决书',
  '被依法(?:判处|处罚|采取|追究)', '依法追究', '依法查处',
  '监管(?:部门|机构)?(?:已|作出)(?:处罚|通报|立案)',
  '调查结论', '调查结果', '查明', '查实',
  // 客观归责说明（明确事由 + 后果）
  '因(?:为)?(?:违约|违规|违法|贪污|受贿|造假|欺诈|失职|渎职|侵占|挪用|行贿|偷税|漏税|走私|贩毒|伤害|殴打|猥亵|强奸|盗窃|抢劫|诈骗|受贿)',
  '绩效(?:不达标|考核|不合格|未达标)',
  '连续(?:三个月|数月|多次|两年|三年)(?:绩效|考核|排名|不达标)',
  '试用期(?:不通过|不合格|未通过)',
  '违反(?:公司|单位|平台)(?:规章|制度|规定|纪律|规则|条款)',
  '违反(?:合同|协议|约定|法律|法规|条例)',
  '构成(?:违约|违法|犯罪|违规|欺诈)',
  // 教学/讨论/转述
  '诉诸恶意', '诉诸恶意谬误', '幸灾乐祸', '恶有恶报(?:的)?(?:说法|观念|逻辑)',
  '谬误(?:清单|分类|列表|类型|字典)', '逻辑谬误', '非形式谬误',
  '教材', '论文', '案例研究', '教学',
  '这(?:是|属于)(?:一种)?(?:谬误|逻辑错误|认知偏误)',
  '不能(?:因为|仅因为)', '不应(?:该)?(?:因为|仅因为)',
  '不等于(?:应该|就该)',
  // 事故通报/新闻转述
  '事故(?:原因|调查|报告|通报)', '事件(?:经过|通报|回顾)',
  '新闻(?:报道|报导)', '据(?:报道|报导|了解)',
  '警方(?:通报|表示|称)', '官方(?:通报|消息|表示)',
].join('|'), 'g');

const EXEMPT_EN = new RegExp([
  // judicial / regulatory due process
  '\\b(?:court|judge|jury|prosecutor|regulator|arbitrator)\\s+(?:ruled|found|held|ordered|sentenced|convicted|acquitted)',
  '\\b(?:was|were)\\s+(?:convicted|sentenced|acquitted|indicted|charged|arraigned)\\s+(?:after|following|pursuant)',
  '\\b(?:pursuant|according|subject)\\s+to\\s+(?:the\\s+)?(?:law|statute|regulation|contract|policy|code)',
  '\\b(?:convicted|sentenced|found\\s+guilty|penalised|penalized|sanctioned|fined)\\s+(?:for|after|under)',
  '\\b(?:investigation|inquiry|audit|review)\\s+(?:found|concluded|established|showed)',
  '\\blegal\\s+(?:consequences|proceedings|process|liability)\\b',
  '\\b(?:terminated|dismissed|disciplined)\\s+for\\s+(?:cause|misconduct|violation|breach|poor\\s+performance)',
  '\\b(?:performance|conduct)\\s+(?:review|issue|problem|record)\\b',
  '\\b(?:violated|breached|breach\\s+of|failed\\s+to)\\s+(?:the\\s+)?(?:contract|policy|law|rules|agreement|terms)',
  // teaching / discussion
  '\\bappeal\\s+to\\s+spite\\b', '\\bschadenfreude\\s+(?:is|refers|describes|means)',
  '\\b(?:logical\\s+fallacy|fallacy\\s+of|informal\\s+fallacy|fallacy\\s+list|fallacy\\s+taxonomy)\\b',
  '\\b(?:textbook|case\\s+study|academic|paper|curriculum|course)\\b',
  '\\bthis\\s+(?:is\\s+)?a\\s+(?:fallacy|logical\\s+error|cognitive\\s+bias)\\b',
  "\\b(?:cannot|can'?t|should\\s+not|must\\s+not|may\\s+not)\\s+(?:just|simply|merely)\\s+(?:because|on\\s+the\\s+grounds)",
  // news / report register
  '\\b(?:according\\s+to|per)\\s+(?:the\\s+)?(?:report|statement|release|filing|court\\s+records)',
  '\\b(?:police|officials|prosecutors|regulators)\\s+(?:said|said|announced|reported|confirmed)',
  '\\b(?:accident|incident|collision|fire|outage)\\s+(?:report|investigation|review|caused)',
].join('|'), 'gi');

// 对冲与疑问（中英同口径）
const HEDGE_ZH = new RegExp([
  '可能', '也许', '或许', '大概', '似乎', '好像', '说不定', '有待',
  '估计', '恐怕', '未必', '不见得', '会不会', '难道',
].join('|'), 'g');
const HEDGE_EN = new RegExp([
  '\\b(?:maybe|perhaps|possibly|probably|might|may\\s+be|seems?|appears?|unclear|unknown)\\b',
].join('|'), 'gi');

// 邻近窗：两腿共现的最大字符跨度（中 80 字 / EN 200 字符）
const WIN_ZH = 80;
const WIN_EN = 200;

function _firstGap(haystack, needleIdx) { return needleIdx; }

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToSpite(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 正当的事实陈述、司法复述、归责讨论 → 不判
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 对冲与疑问 → 不判（本维度判「已宣告的应得判断」，不判推测）
  if (HEDGE_ZH.test(text) || HEDGE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (/[?？]/.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const harmRe = isZh ? HARM_ZH : HARM_EN;
  const harmPassive = isZh ? HARM_PASSIVE_ZH : null;
  const deservedRe = isZh ? DESERVED_ZH : DESERVED_EN;
  const win = isZh ? WIN_ZH : WIN_EN;

  // 找应得腿首次命中位置
  deservedRe.lastIndex = 0;
  const dMatch = deservedRe.exec(text);
  if (!dMatch) return { hit: false, score: 0, detail: '', count: 0 };
  const dIdx = dMatch.index;

  // 找受损腿位置（主腿或被动通道）
  harmRe.lastIndex = 0;
  const hMatch = harmRe.exec(text);
  let hIdx = -1;
  if (hMatch) hIdx = hMatch.index;
  if (hIdx < 0 && harmPassive) {
    harmPassive.lastIndex = 0;
    const pMatch = harmPassive.exec(text);
    if (pMatch) hIdx = pMatch.index;
  }
  if (hIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿同句/同段共现（距离 ≤ win）
  const gap = Math.abs(dIdx - hIdx);
  if (gap > win) return { hit: false, score: 0, detail: '', count: 0 };

  // 两腿共现 → 判
  const count = 1;
  return {
    hit: true,
    score: 0.62,
    count,
    detail: isZh
      ? '受损事实×应得判断共现(zh)'
      : 'harm×desert-judgement(en)',
  };
}

module.exports = {
  checkAppealToSpite,
  // [r457] 供守卫测试做「置空指定支必须变红」的变异注入用。
  // 导出句柄而非副本：变异脚本替换这些 const 指向即可让命中归零。
  __internals: () => ({
    HARM_ZH, HARM_EN, HARM_PASSIVE_ZH, DESERVED_ZH, DESERVED_EN,
    EXEMPT_ZH, EXEMPT_EN, HEDGE_ZH, HEDGE_EN,
  }),
};
