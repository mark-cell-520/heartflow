/**
 * src/disposition-effect.js — 「处置效应」检测器
 * （ provisional 第 228 个判别维度，r240 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r240-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r239：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)/
 * mental_accounting(r235)/perverse_incentive(r236)/winners_curse(r237)/
 * tragedy_of_commons(r238)/illusion_of_control(r239) 十五个已起草未接线
 * 维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS 登记序重排；
 * 强烈建议 1 号在 claims 加号段预占，避免 provisional 编号继续撞车）
 *
 * [r240 立项] 零命中探针 coordination/agent4/probes/r240-zerohit-probe.js
 * + r240-probe-round2.js（v6.8.145 gate() 全量 findings 实测）：认领方向
 * 五候选族竞品——A 处置效应攻击两轮 10/12 穿透（余 2 条被
 * pseudo_causal/future_faking+perfect_error 泛维度偶发代拦）且疑难良性
 * 仅 1/12 被 generic 代拦（circular_reasoning/monocausal/perfect_error）、
 * B 虚假共识效应 8/10 穿透但疑难良性 3/12 被 perfect_error 等代拦且
 * 日常口语投射句 FP 面天然宽、C 邓宁-克鲁格 4/7 穿透（genetic_fallacy/
 * contradiction/hindsight 代拦）、D 样本量不敏感 4/7 穿透（fallacies/
 * perfect_error 代拦）、E 蒙蒂霍尔 4/7 穿透（post_hoc/false_equivalence/
 * fallacies 代拦）。A 以「攻击高穿透 + 疑难良性近零纠缠」双干净胜出；
 * 无任何维度以「盈利状态×过早处置」与「亏损状态×拖延处置」双腿链
 * 语义承重（r237-r239 同型先例）。
 *
 * 外部来源：空返，按既有形态自建。r240 海外扫描（原始证据
 * coordination/agent4/scout/*20261107-0452{10,36}*）：arXiv 两次查询
 * 均 parse-fail、GitHub repos 两次 0 命中、Semantic Scholar 两次 429
 * 限流空返。判据为心虫自有纯规则实现（家族定义取自行为金融学的标准
 * 描述：disposition effect / 处置效应——Shefrin & Statman 1985：
 * 投资者倾向于过早卖出盈利持仓、过久持有亏损持仓，处置时点由参考
 * 点（买入价）两侧的浮盈浮亏状态而非基本面/估值驱动）。
 *
 * 辨别的族：处置效应（disposition effect）——**领域锚点**（证券投资/
 * 交易语境：股票/基金/仓位/交易/EN stock / position / trade）×
 * **盈利链**（盈利状态：涨了/浮盈/赚钱的/EN winners / gains / green
 * × 过早处置：落袋为安/见好就收/赚一点就卖/拿不住/EN sells winners /
 * cash out / bank the gains）× **亏损链**（亏损状态：跌了/浮亏/被套/
 * 亏钱的/EN losers / losses / underwater × 拖延处置：捂着/等解套/
 * 补仓摊低成本/不砍仓/下不去手/EN holds losers / waiting to break
 * even / never realize a loss）**双腿链共现**：
 *   我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的。
 *   赚钱的股票赚一点我就卖，亏钱的反而越跌越拿，实践证明这样心态最稳。
 *   基金浮盈的先赎回保住成果，浮亏的那只继续补仓摊低成本，等下一轮反弹。
 *   I cash out winners as soon as they are up, but I ride losers for months.
 *   Winners get sold too fast and losers get held too long.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：处置效应让持仓
 * 处置时点被浮盈浮亏状态绑架——盈利侧因「害怕利润回吐」过早兑现，
 * 亏损侧因「割肉下不去手/不卖就不亏」拒绝执行本应执行的退出。据此
 * 给出的投资建议（赚一点就卖、亏了死扛等解套）会把长期正期望的策略
 * 反向执行，且当事人因参考点依赖而难以自察。与正当表述有明确界线：
 * 估值/纪律驱动（涨到目标价分批卖出、跌破止损按纪律砍、机械执行
 * 止盈止损线）、反向持有（浮盈继续持有没到目标价不卖、被套但逻辑
 * 破了果断止损）、单边行为（只描述亏钱死扛=沉没成本领地；只描述
 * 盈利落袋无亏损链）、否定纠偏（从不赚钱就卖、也从不亏了死扛）、
 * 概念讨论（处置效应/disposition effect 教学定义句）——均豁免。
 *
 * 与既有维度的边界（r240 归因）：
 *   · sunk_cost_coercion（第 98 维）管**已投入→退出羞耻**的单边
 *     绑架（投了两百万现在停掉全打水漂）；本族必须同时具备盈利侧
 *     过早处置链，判的是盈亏两侧的不对称，单边亏损持有不判。
 *   · mental_accounting（r235 草稿）管**资金来源标签**（年终奖/
 *     外快花着不心疼）；本族判持仓处置时点由浮盈浮亏驱动，无资金
 *     来源标签腿。
 *   · pseudo_causal 管**泛因果断言**（实践证明这样心态最稳会被它
 *     偶发代拦）；本族承重的是盈亏状态×处置动词双腿链结构。
 *   · future_faking 管**关系语境空头承诺**（wait for it to come
 *     back 在英文投资句里会被它偶发误拦）；本族有明确双腿链。
 *
 * 判据（双腿链共现 + 领域锚点，缺一不判）：
 *   ① 腿① CTX 领域锚点——股票/个股/持仓/仓位/基金/交易/炒股/止损/
 *     止盈/被套/解套/楼市/房价；EN stock / position / trade / invest /
 *     cash out / gains / losses（非金融语境直接排除）；
 *   ② 腿② 盈利链 WIN_STATE × WIN_DISP——盈利状态（涨了/上涨/涨幅/
 *     翻红/翻倍/浮盈/盈利/赚了/赚钱的；EN winners / winning / gains /
 *     profits / in the green / green）× 过早处置（落袋为安/落袋/
 *     见好就收/保住成果/赚一点就/拿不久/拿不住/生怕回吐/一涨就卖/
 *     想卖；EN sold / sells / cash out / bank / lock in / realize /
 *     take profits / too fast）落近距离窗（ZH 60 / EN 180）；
 *   ③ 腿③ 亏损链 LOSE_STATE × LOSE_DISP——亏损状态（跌了/下跌/跌幅/
 *     翻绿/亏损/浮亏/亏了/赔了/被套/套牢/亏钱的；EN losers / losing /
 *     losses / in the red / underwater / red positions）× 拖延处置
 *     （死扛/硬扛/捂着/拿着不动/再拿拿/越跌越拿/等反弹/等解套/等回本/
 *     补仓/摊低成本/放着/总能涨回来；EN hold / keep / ride / waiting /
 *     average down）落近距离窗；其中「否定式退出」族（不砍仓/不卖就
 *     不亏/下不去手割肉/舍不得动；EN never realize a loss / refuse to
 *     cut a loser）语义即持有，单独成族且**不做过挂否定检查**；
 *   ④ 双腿链之间落远距离窗（ZH 150 / EN 500，防多主题文档误配）；
 *   ⑤ 全部命中查否定前缀（从不赚钱就卖/并没有浮盈/不会涨了就卖；
 *     EN never sell a winner / does not bank the gains），被否定
 *     不计——否定式退出族除外（其否定词正是「持有」语义的一部分）。
 *
 * 为什么取 VERIFY 级：单句可能只是在转述一个已发生的交易案例而未
 * 展开处置论证（这类由缺链/豁免覆盖），也可能是说话者尚未意识到
 * 处置时点被盈亏状态绑架。verify 的语义是「这段话把浮盈浮亏状态
 * 当作处置依据、盈利侧过早退出亏损侧拖延退出，先核实处置决策的
 * 依据究竟是估值与信息还是盈亏状态本身，再决定是否采信其结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 估值/纪律驱动（涨到估值上限分批卖出、跌破止损按纪律砍、买入前
 *     设好止盈止损线机械执行——无盈亏状态×过早/拖延处置链）；
 *   · 反向持有（浮盈继续持有没到目标价不卖、被套但逻辑破了果断止损
 *     ——盈利侧不退出/亏损侧不拖延，缺对应链）；
 *   · 单边行为（只亏钱死扛=沉没成本领地；只盈利落袋无亏损链）——
 *     不对称是族定义，单边不判；
 *   · 否定纠偏（从不赚钱就卖、也从不亏了死扛；EN never sell a winner
 *     just because it is up——否定前缀杀掉双侧链）；
 *   · 概念讨论（处置效应/disposition effect/谢夫林/前景理论教学
 *     定义句）；
 *   · 非金融语境（猪肉涨价铺子不卖、感情里患得患失——领域锚点
 *     缺失或状态词不落在金融域）；
 *   · 赌博 escalation（这把输了加注翻本——无证券领域锚点，归
 *     sunk_cost_coercion 领地）。
 */
'use strict';

// ─── 腿① 领域锚点：证券投资/交易语境（中文）────────────────────
const CTX_ZH = [
  /(?:股票|个股|该股|这股|这只股|这只票|那只票|的票|持仓|仓位|基金|ETF|标的|组合|账户|头寸|期货|币圈|比特币|理财|证券|筹码|炒股|炒币|交易|建仓|加仓|补仓|减仓|清仓|抄底|解套|割肉|翻倍|红盘|绿盘|翻红|翻绿|牛市|熊市|入市|散户|操盘|盘面|K线|均线|涨幅|跌幅|止盈|止损|回本|定投|券商|大盘|行情|收益|盈亏|本金|楼市|房产|房源|房子|房价)/,
];

// ─── 腿① 领域锚点（英文）──────────────────────────────────────
const CTX_EN = [
  /\b(?:stock|stocks|shares?|position|positions|portfolio|portfolios|fund|funds|ETF|ticker|tickers|trade|trades|trading|invest\w*|investor|investors|market|brokerage|account|accounts|crypto|bitcoin|futures|options|securities|P&L|paper\s+(?:gain|loss|profit)|cash(?:ing)?\s+out|break[- ]even|gains?|profits?|losses?|returns?)\b/i,
];

// ─── 腿② 盈利侧状态（中文）──────────────────────────────────────
const WIN_STATE_ZH = [
  /(?:涨了|上涨|涨幅|大涨|涨得|翻红|翻倍|红了|见红|浮盈|盈利|获利|赚了|小赚|赚到|赚钱的|挣了|跑赢|红盘|正收益|有赚|赚翻)/,
];

// ─── 腿② 盈利侧过早处置（中文，动词族）──────────────────────────
const WIN_DISP_ZH = [
  // 落袋族
  /(?:落袋为安|落袋|见好就收|保住(?:成果|利润|收益|果实))/,
  // 赚一点就卖族
  /(?:赚一点就|小赚就|赚几个点就|赚点就|刚赚就|一赚就)/,
  // 拿不住族
  /(?:拿不久|拿不住|守不住|捂不住)/,
  // 生怕回吐族
  /(?:生怕|害怕|怕)[^。，！？；\n]{0,10}(?:回吐|跌回去|跑了|没了|跌回)/,
  // 赶紧卖族
  /(?:赶紧|马上|迅速|一)[^。，！？；\n]{0,4}(?:卖|赎回|套现|落袋|平仓|清仓)/,
  // 一涨就卖族
  /(?:一?涨[^。，！？；\n]{0,4}就(?:想)?(?:卖|赎回|清仓|平仓))/,
  // 想卖族
  /(?:就想卖|想卖出|想赎回)/,
  // 利润跑了族
  /(?:利润|盈利|收益)[^。，！？；\n]{0,4}(?:跑|飞|没)/,
];

// ─── 腿③ 亏损侧状态（中文）──────────────────────────────────────
const LOSE_STATE_ZH = [
  /(?:跌了|下跌|跌幅|大跌|跌得|翻绿|绿了|亏损|浮亏|亏了|赔了|被套|套牢|深套|套着|绿盘|碧绿|亏钱的|赔钱的|亏麻|腰斩|回撤|缩水|发绿|一片绿|亏起来)/,
];

// ─── 腿③ 亏损侧拖延处置（中文，动词族——持有/拖延离场）───────────
const LOSE_DISP_ZH = [
  // 死扛族
  /(?:死扛|硬扛|扛着|扛下去|扛过去)/,
  // 捂着族
  /(?:捂着|捂着不动|捂着不卖)/,
  // 拿着不动族
  /(?:拿着不动|长期拿|再拿拿|越跌越拿|拿住)/,
  // 等涨回来族
  /(?:等反弹|等解套|等回本|等下一轮|等着涨回来|等回暖)/,
  // 补仓摊薄族
  /(?:补仓|逢低|摊低成本|摊薄|加仓)/,
  // 放着族
  /(?:放着|放放|躺平|装死)/,
  // 会涨回来族
  /(?:总能涨回来|会涨回来|还能涨回来|涨回来)/,
];

// ─── 腿③ 亏损侧「否定式退出」族（中文）──────────────────────────
// 语义即持有亏损仓位（不砍仓/下不去手/舍不得动），自身含否定词，
// **不做过挂否定检查**——其否定词正是持有语义的一部分。
const LOSE_DISP_NEG_ZH = [
  // 不/绝不/从不/打死不 + 退出动词
  /(?:不|没|未|绝不|从不|打死不|死活不|就是不|坚决不|并不)[^。，！？；\n]{0,4}(?:卖|砍仓|割肉|止损|认赔|离场|平仓|赎回|清仓|出局|动|出手|操作)/,
  // 退出动词 + 下不去手/舍不得
  /(?:卖|砍仓|割肉|止损|认赔|离场|平仓|清仓)[^。，！？；\n]{0,6}(?:下不去手|下不了手|舍不得|不忍心|做不到|太难|心理关)/,
  // 情感阻却族（下不去手/舍不得/不愿 + 退出动词）
  /(?:下不去手|下不了手|舍不得|不忍心|不愿|不想|不肯|拒绝)[^。，！？；\n]{0,6}(?:割肉|卖出|卖掉|砍仓|止损|认赔|离场|平仓|动手|动)/,
];

// ─── 腿② 盈利侧状态（英文）──────────────────────────────────────
const WIN_STATE_EN = [
  /\b(?:winners?|winning|gains?|profits?|in\s+the\s+green|in\s+profit|profitable|up\s+\d|turns?\s+green|green)\b/i,
];

// ─── 腿② 盈利侧过早处置（英文，动词族）──────────────────────────
const WIN_DISP_EN = [
  /\b(?:sold|sells?|selling|cash(?:ed|ing)?\s+out|bank(?:ed|ing)?|lock(?:ed|ing)?\s+in|realiz(?:e|ed|ing)|monetiz\w+|book(?:ed|ing)?|liquidat\w+|trim(?:med|ming)?)\b/i,
  /\b(?:tak(?:e|ing)|took|taken)\s+(?:my\s+|the\s+|your\s+|his\s+|her\s+)?(?:profits?|gains?|money)\b/i,
];

// ─── 腿③ 亏损侧状态（英文）──────────────────────────────────────
const LOSE_STATE_EN = [
  /\b(?:losers?|losing|loss(?:es)?|in\s+the\s+red|underwater|red\s+positions?|paper\s+loss|down\s+\d)\b/i,
];

// ─── 腿③ 亏损侧拖延处置（英文，动词族）──────────────────────────
const LOSE_DISP_EN = [
  /\b(?:hold|holds?|held|holding|keep|keeps?|kept|keeping|ride|rides|riding|sit(?:ting)?\s+on|averag(?:e|ing)\s+down|add(?:ing)?\s+to|double\s+down|wait(?:ing)?)\b/i,
  /\b(?:give|gives|gave|let|lets)\s+(?:\w+\s+){0,3}?(?:losers?|losing|losses?|red)\s+(?:\w+\s+){0,3}?(?:time|room)\b/i,
];

// ─── 腿③ 亏损侧「否定式退出」族（英文，不做过挂否定检查）──────────
const LOSE_DISP_NEG_EN = [
  /(?:never|not|won'?t|wouldn'?t|couldn'?t|refus\w+\s+to|avoid\w*)\s+(?:\w+\s+){0,3}?(?:realiz\w+|sell|selling|cut|cash\w*\s+out|close|closing|exit\w*)\s+(?:\w+\s+){0,3}?(?:a\s+)?(?:loss|loser|losing|red)\b/i,
  /(?:couldn'?t|could\s+not)\s+bring\s+\w+\s+to\s+(?:sell|cut|realize)\s+(?:\w+\s+){0,3}?(?:a\s+)?(?:loss|loser)/i,
];

// ─── 距离窗 ─────────────────────────────────────────────────────
// 链内窗（状态×处置）；链间窗（盈利链×亏损链，防多主题文档误配）
const PAIR_ZH = 60;
const PAIR_EN = 180;
const CROSS_ZH = 150;
const CROSS_EN = 500;

// ─── 豁免：概念讨论（讨论本族名称的教学/定义句）────────────────
const CONCEPT_ZH = /(?:处置效应|处置理论|处置偏差|卖盈持亏|持亏卖盈|盈亏不对称|前景理论|损失厌恶|谢夫林|舍德林|参考点依赖)/;
const CONCEPT_EN = /\bdisposition\s+effect\b|\bShefrin\b|\bStatman\b|\bloss\s+aversion\b|\bprospect\s+theory\b|\breference[- ]point\s+dependence\b|\brealiz\w+\s+(?:gains|losses)\s+too\s+(?:early|soon)\b|\bhold(?:ing)?\s+losers?\s+too\s+long\b/i;

// 工具 ─────────────────────────────────────────────────────────
// 全文扫描某正则族的全部命中位置（global 安全）
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// 否定前缀检查（「从不赚钱就卖/并没有浮盈/不会涨了就卖」不计）。
// 窗口取匹配前 8 字符：否定复合词 + 紧贴否定单字 + 否定词+≤2 填充字
// （「涨了也不想卖」式：不+也 两字间隔也要拦住）。
const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|并不会)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
// 匹配 span 内部的否定词（「盈亏状态并不会影响」式内嵌否定）。
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不)/;

// 英文否定：span 内否定 + 匹配前 45 字符窗口内的否定
// （does not bank the gains / never sell a winner）。
// r239 教训：NEG_BEFORE_EN 必须有词边界，否则 casino 的 no 子串
// 会误触否定；本模块沿用 \b 边界并扩入 never 族。
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b|\bnot\s+necessarily\b|\bchanges?\s+nothing\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s+){0,4}$/i;

// 单条匹配是否有效（否定前缀/内部否定均拦下；ZH 与 EN 均查）
function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 去重叠（同族多模式命中同一片段只留最长/最先者）
function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 收集某语言侧单腿的全部有效匹配
function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
  }
  return dedupeOverlap(m);
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 双腿链配对：状态×处置（含否定式退出族）。否定式退出族（不砍仓/
// never realize a loss）的否定词修饰的是「退出」而非「状态」——
// 「never realize a loss」里 loss 依然是有效的亏损状态，故该族与
// **未过否定检查的状态**配对，避免前挂否定把状态词误杀。
function chainPairs(text, states, disps, dispsNeg, win) {
  const sm = collect(text, states, true);
  const dm = collect(text, disps, true);
  const dn = collect(text, dispsNeg, false);
  const smRaw = dn.length > 0 ? collect(text, states, false) : [];
  const pairs = [];
  for (const s of sm) for (const d of dm) {
    if (dist(s, d) > win) continue;
    pairs.push({ s, d });
  }
  for (const s of smRaw) for (const d of dn) {
    if (dist(s, d) > win) continue;
    pairs.push({ s, d });
  }
  return pairs;
}

/**
 * 双腿链签名：盈利链（盈利状态×过早处置）与亏损链（亏损状态×拖延
 * 处置）在领域锚点内共现，且两链之间落远距离窗——不对称处置即族
 * 定义，单边不判。
 */
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      ctx: R.CTX_ZH || CTX_ZH,
      winS: R.WIN_STATE_ZH || WIN_STATE_ZH, winD: R.WIN_DISP_ZH || WIN_DISP_ZH, winDn: R.WIN_DISP_NEG_ZH || [],
      loseS: R.LOSE_STATE_ZH || LOSE_STATE_ZH, loseD: R.LOSE_DISP_ZH || LOSE_DISP_ZH, loseDn: R.LOSE_DISP_NEG_ZH || LOSE_DISP_NEG_ZH,
      pair: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, cross: R.CROSS_ZH != null ? R.CROSS_ZH : CROSS_ZH, lang: 'zh',
    },
    {
      ctx: R.CTX_EN || CTX_EN,
      winS: R.WIN_STATE_EN || WIN_STATE_EN, winD: R.WIN_DISP_EN || WIN_DISP_EN, winDn: [],
      loseS: R.LOSE_STATE_EN || LOSE_STATE_EN, loseD: R.LOSE_DISP_EN || LOSE_DISP_EN, loseDn: R.LOSE_DISP_NEG_EN || LOSE_DISP_NEG_EN,
      pair: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, cross: R.CROSS_EN != null ? R.CROSS_EN : CROSS_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    if (collect(text, L.ctx, true).length === 0) continue;
    const winPairs = chainPairs(text, L.winS, L.winD, L.winDn, L.pair);
    const losePairs = chainPairs(text, L.loseS, L.loseD, L.loseDn, L.pair);
    if (winPairs.length === 0 || losePairs.length === 0) continue;
    for (const w of winPairs) for (const l of losePairs) {
      if (dist(w.s, l.s) > L.cross && dist(w.d, l.d) > L.cross && dist(w.s, l.d) > L.cross && dist(w.d, l.s) > L.cross) continue;
      sigs.push({
        lang: L.lang,
        winState: w.s.raw, winDisp: w.d.raw,
        loseState: l.s.raw, loseDisp: l.d.raw,
      });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectDispositionEffect(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：概念讨论（处置效应/disposition effect 教学定义句）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'disposition_effect',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '盈利「' + x.winState + '」×过早处置「' + x.winDisp + '」×亏损「' + x.loseState + '」×拖延处置「' + x.loseDisp + '」'
      : 'winning "' + x.winState + '" x early exit "' + x.winDisp + '" x losing "' + x.loseState + '" x held "' + x.loseDisp + '"')),
    details: s.lang === 'zh'
      ? '处置效应(' + sigs.length + '处: 盈利状态「' + s.winState + '」被「' + s.winDisp + '」过早退出，亏损状态「' + s.loseState + '」被「' + s.loseDisp + '」拖延持有——处置时点由浮盈浮亏状态而非估值/纪律驱动)(zh)'
      : 'disposition effect(' + sigs.length + 'x: winning "' + s.winState + '" exited early via "' + s.winDisp + '" while losing "' + s.loseState + '" is held via "' + s.loseDisp + '")(en)',
    guidance: '处置效应指盈利持仓被过早卖出、亏损持仓被长期持有的不对称处置——处置时点由浮盈浮亏状态（参考点两侧）而非基本面/估值驱动（我这只票涨了四成，先落袋为安，套牢的那只再拿拿，总能涨回来的 / 赚钱的股票赚一点我就卖，亏钱的反而越跌越拿 / winners get sold too fast and losers get held too long、I cash out winners as soon as they are up, but I ride losers for months）。请补上论证：处置决策的依据究竟是估值与信息还是盈亏状态本身；若依据是「生怕利润回吐」「割肉下不去手」「不卖就不亏」，指出这正是参考点依赖的表现——理性处置对盈亏两侧使用同一套事先规则（目标价/止损线/再平衡），不随持仓浮盈浮亏改变，更不把「等解套」当作继续持有的理由。',
    tags: ['economics', 'behavioral-finance', 'disposition-effect', 'cognitive-bias', 'investing', 'inference'],
  };
}

module.exports = {
  detectDispositionEffect,
  __internals: () => ({
    CTX_ZH, CTX_EN,
    WIN_STATE_ZH, WIN_DISP_ZH,
    LOSE_STATE_ZH, LOSE_DISP_ZH, LOSE_DISP_NEG_ZH,
    WIN_STATE_EN, WIN_DISP_EN,
    LOSE_STATE_EN, LOSE_DISP_EN, LOSE_DISP_NEG_EN,
    CONCEPT_ZH, CONCEPT_EN,
    PAIR_ZH, PAIR_EN, CROSS_ZH, CROSS_EN,
  }),
};
