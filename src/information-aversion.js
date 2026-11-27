/**
 * src/information-aversion.js — 「information aversion / ostrich effect
 * （信息回避/鸵鸟效应）」检测器
 * （provisional 第 298 个判别维度，r484 起草；src/index.js 接线由 1 号主力
 * 登记，dispatch 经插件层 src/plugins/information-aversion-check/，
 * 同 r294/r295/r296/r297 先例）
 *
 * [r484 立项] 候选池穿透实测 coordination/agent4/r484-probe-pool.js
 * （v6.8.242 gate() 口径，输出 r484-probe-pool.output.txt）：
 *   · G information aversion 穿透 **10/12**（83%）——初始池 4/5 = 80%，
 *     扩池后维持最高穿透；
 *   · A naive realism 2/8、B ad baculum 3/7（首条即被 confidence 代拦）、
 *     C belief bias 1/5、D zero-risk 3/5、E illusion of validity 0/5、
 *     F semmelweis 2/5、H 对照 0/2。
 * 良性基线 12 条误伤 1/12（存量 duration_neglect 代拦，与本族无关）、
 * 边缘良性 3 条误伤 2/3（存量 claimed_verification_without_trail 代拦，
 * 与本族无关）——族内零新增误伤。
 *
 * 辨别的族：information aversion / ostrich effect（信息回避/鸵鸟效应的
 * **决策端**）——文本先陈述**有用负面信息已在手或可即时获得**（数据已整理
 * 好放在桌上、再查一轮就能把风险看清楚、结论即将被告知），再据此作出
 * **主动回避该信息的决定**（不看/不查/不翻那一页/先别告诉我/不想知道/
 * 装作不知道/宁愿不知道），其功能是用「不知道」换取「继续按原计划行动」
 * 的心理许可：
 *   我知道再查一轮能把风险看清楚，但还是不查了，万一查出问题反而不好收场。
 *   信息我已经拿到手了，但只要不看，就还能照原计划推进。
 *   先别告诉我结论，我怕知道了这个项目就推不下去了。
 *   I know one more check would reveal the real risk, but I would rather
 *     not look.
 *   The numbers are sitting right there in the file, but I have
 *     deliberately not opened it so I can keep going.
 *
 * 为什么现有维度拦不住：
 *   · scrutiny_evasion（第 194 维度族）腿①是**审查/验证请求在场**，腿②是
 *     推诿（换时间/换人/没有意义）；本族没有任何审查请求被推诿的结构——
 *     信息是说话人自己握着、自己决定不看的。
 *   · motivated_reasoning 管动机污染推理，本族是**信息获取端的自我设限**，
 *     尚未进入推理阶段。
 *   · confirmation_bias 管证据选择性注意，本族连注意都未发生——信息从未
 *     被打开过。
 *   · willful_blindness/plausible_deniability 若存在也是法律概念族，不覆盖
 *     「为了能继续行动而拒绝知道」这一决策语用。
 *   · duration_neglect / claimed_verification_without_trail 只在本族良性
 *     语料上偶发代拦，对族内攻击形（探针 G：EN 4/4、ZH 6/8 穿透）无覆盖。
 *
 * 判据（双腿 AND + 同窗 + 三类豁免 + 否定守卫，缺一不判）：
 *   ① 腿① AVAIL 有用负面信息的在场或可得性陈述——已到手/整理好/放在桌上
 *      （名词 + 拿到手/整理好/放在/摆在/躺在/送到）、「再查一轮/再查一次
 *      + 就能查清楚/看清楚」、就在桌上/面前/手里、数据明明白白摆在那里、
 *      结论/结果将被（公布/告知/透露）、名词 + 现在/眼下（在手的时间标记）、
 *      详查核对一次就能拿到结论；EN 同构（have ... in hand / is on my desk
 *      / sitting right there / tell me the result yet / one more check
 *      would reveal / already compiled / knowing the real numbers）。
 *   ② 腿② AVOID 主动回避该信息的决定——不看/不查/不翻/不读/不打开、千万
 *      别看/别查、不想知道/不愿知道/不敢知道、装作不知道/假装没看见、宁愿
 *      不知道/不知道也好、先别告诉/先别公布、知道得越少、怕知道/怕看到、
 *      只要不看/不查、眼不见；EN 同构（would rather not look / do not tell
 *      me / deliberately not opened / rather stay in the dark / reading it
 *      now would / rather not know）。
 *   ③ 两腿间距 ≤ 同窗（ZH 60 字 / EN 160 字符），方向不限——本族攻击惯用
 *      「先铺陈信息在手、后下回避决定」的长句结构。
 *   ④ 部分重叠放行（不完全相等的重叠 span 视为真攻击，如「先别告诉我结论」
 *      中「告诉我结论」的信息在场与「先别告诉」的回避同源粘连）；完全相等
 *      的 span 仍判自证拒绝（防同一正则同时充当两腿）。
 *   ⑤ 豁免 A 正确处置/成本权衡/委托在场（记录了未验证部分作为已知风险/
 *      交给风控/委托/评估后/成本/预算/资源/时间不允许/权限范围/评审范围/
 *      logged the unverified portion as a known risk / delegated to /
 *      budget / scope）——把信息获取延后并留痕、或交给更有资格的一方，正是
 *      本维度要教的判别动作。
 *   ⑥ 豁免 B 概念评析（信息回避/鸵鸟效应/负面信息也是信息/回避它只会/
 *      心理倾向/行为经济学/information aversion/ostrich effect/negative
 *      information is still information）——讨论这个概念本身不是运用它。
 *   ⑦ 腿①腿②均查紧邻否定前缀（「不打算装作不知道」「not hiding from」是
 *      拒绝回避的正确陈述）。
 *
 * verify 级——单句可能是对信息回避问题的**正确描述与批评**（「负面信息
 * 也是信息，回避它只会让决策建立在更差的证据上」正是本族要教的判别动作）、
 * 行为经济学课堂案例、或把信息获取正式委托他人/登记为已知风险。verify 的
 * 含义是「这个以信息在手为前提的回避决定没有给出『看』的理由，采信前
 * 必须补上信息审阅或已知风险登记」。
 */
'use strict';

// ─── 腿①：有用负面信息的在场/可得性（中文）──────────────────────
const AVAIL_ZH = new RegExp([
  // a 「再查一轮/再查一次」就能查清——可得性陈述
  '再查(?:一轮|一次|一遍|一下|一番|一回)(?:就)?(?:能|可以|足以)?(?:把|将)?[^，。；！？]{0,6}(?:查清楚|看清楚|弄明白|搞明白|查个明白|看明白|水落石出)',
  // b 信息名词 + 已到手/整理好/放在（含宽松中间，吃「已经…数据整理好」）
  '(?:报告|数据|尽调|结论|结果|风险|材料|文件|资料|信息|数字|底稿)(?:我|我们)?(?:已经|已|早就|现已|刚刚)?(?:拿到手|拿到|在手|在手边|整理好|放在|摆在|送到|交到|躺在)',
  '(?:已经|已|早就|现已)(?:把|将)[^，。；！？]{0,14}(?:报告|数据|尽调|结论|结果|材料|文件|资料|信息|数字)(?:整理好|拿到|放在|摆在|送到)',
  // c 就在/明明 + 桌上/面前/手里
  '(?:就|正|明明|分明)(?:在|摆|放|躺|搁)(?:我)?(?:的)?(?:桌上|桌面上|面前|手里|手边|眼前|电脑里|邮箱里|文件夹里|收件箱里)',
  // d 摆在那里 / 明明白白
  '(?:摆|放|躺)(?:在|了)?(?:那里|眼前|桌上)',
  '(?:数据|数字|信息|材料|报告|结论)(?:明明白白|清清楚楚|白纸黑字|清清楚楚地)',
  // e 结论/结果将被告知（在场）
  '(?:公布|透露|通报|告知)(?:我|咱们|我们|大家)?(?:结论|结果|数据|风险|细节|数字|答案|实情|真相)',
  // f 名词 + 现在/眼下（在手的时间标记）
  '(?:报告|数据|尽调|材料|文件|结论|结果)(?:现在|眼下|此时|当下)',
  // g 详查/核对一次就能拿到
  '(?:详查|细查|核对|审查|复盘)(?:一下|一遍)?(?:就)?(?:能|可以)(?:知道|弄清|得到|拿到)(?:结论|结果|数据|风险|真相)',
  // h 待揭示的信息在场：结论/结果/细节/真相 即将被说出、说出、摆出
  '(?:结论|结果|答案|实情|真相|细节|数据|风险|数字|实底)(?:明天|今晚|下午|上午|稍后|待会|不久|下周|下月)?(?:就)?(?:将要|即将|就要|快|马上|迟早)?(?:就)?(?:将要|即将|就要|快|马上|迟早)?(?:被)?(?:公布|揭晓|浮出|摊在|放到|送到|说出来|说出口|交到|给到|告知|告诉|透露|通报)',
  '(?:告诉我|告知|通报|说给|摆给|摊给)(?:我|我们|咱们)?(?:结论|结果|答案|实情|真相|细节|数据|风险|数字|实底)',
  // i 想知道本来就能知道（可得性 + 说话人可自主获取）
  '我(?:想|要)(?:知道|了解|弄清楚|查清)(?:细节|真相|实情|全貌|数据|风险|结论|结果)',
  '(?:迟早|早晚|终究)(?:会)?(?:知道|查出|弄明白|搞清楚|弄清楚)',
  // j 信息名词泛指在场（配腿②的回避动词即成本族）
  '(?:细节|真相|实情|全貌|情况|来龙去脉|数据|报告|材料|文件|底稿|数字)',
  // k 「不查了」的可查性前设：事由 + 查清（结论前置于省略主语）
  '查清楚了|查明白|弄清楚了|搞清楚了|水落石出',
].join('|'));

// ─── 腿①：有用负面信息的在场/可得性（英文）──────────────────────
const AVAIL_EN = new RegExp([
  // 「tell me the result yet」的腿①落点取「the result yet」段（不落在
  //  'Do not ' 否定前缀上——「Do not tell me the result yet」正是本族攻击；
  //  用负向后顾确保 span 起点不在 not/do/does 之后，避免被否定守卫误伤）
  '(?<![Nn]ot\\s)(?<![Dd]o\\s)(?<![Dd]oes\\s)\\bthe\\s+(?:result|results|numbers?|findings?|answer)\\s+yet\\b',
  '\\b(?:have|has|had|got|obtained)\\s+(?:the\\s+|a\\s+|our\\s+)?(?:due[- ]diligence[\\w-]*|report|data|numbers?|results?|findings?|file|analysis)\\s+(?:in\\s+hand|in\\s+(?:my|our)\\s+hand|on\\s+(?:my|our|the)\\s+desk|right\\s+(?:here|there)|in\\s+front\\s+of\\s+(?:me|us)|ready)\\b',
  '\\b(?:the\\s+|our\\s+)?(?:report|numbers?|results?|data|findings?|file|due[- ]diligence[\\w-]*)\\s+(?:are|is)\\s+(?:sitting\\s+right\\s+there|right\\s+there|on\\s+(?:my|our|the)\\s+desk|in\\s+(?:my|our)\\s+hand|in\\s+the\\s+file|in\\s+front\\s+of\\s+(?:me|us)|ready)\\b',
  '\\b(?:tell|show|share|give|hand)\\s+(?:me|us)\\s+(?:the\\s+)?(?:result|results|numbers?|findings?|data|report|conclusion|answer)s?\\s+(?:yet|first|right\\s+now|now)\\b',
  '\\b(?:one\\s+more|another|one\\s+additional|one\\s+further|a\\s+further)\\s+(?:check|look|round\\s+of\\s+(?:checks|review|analysis)|pass|review)\\s+would\\s+(?:reveal|show|expose|uncover|tell|make\\s+clear)\\b',
  '\\b(?:already|just)\\s+(?:been\\s+)?(?:compiled|finished|ready|collected|gathered|assembled|completed|delivered)\\b',
  '\\b(?:knowing|learning|seeing|finding\\s+out)\\s+(?:about\\s+)?(?:the\\s+)?(?:real|actual|true|full)\\s+(?:numbers?|results?|risk|picture|situation|extent)\\b',
  '\\b(?:the\\s+)?(?:result|results|numbers?|findings?|data|report|conclusion|answer|file|files)s?\\s+(?:are|is)\\s+(?:ready|final|available|in)\\b',
  '\\bhave\\s+the\\s+(?:due[- ]diligence[\\w-]*|report|numbers?|data|results?)\\s+(?:in\\s+hand|here|ready)\\b',
  '\\bin\\s+hand\\b',
  // 「tell me the result yet」的腿①落点取「the result yet」段（不落在
  //  'Do not ' 否定前缀上——「Do not tell me the result yet」正是本族攻击）
  '\\bthe\\s+(?:result|results|numbers?|findings?|answer)\\s+yet\\b',
].join('|'), 'i');

// ─── 腿②：主动回避该信息的决定（中文）──────────────────────────
const AVOID_ZH = new RegExp([
  '不(?:去)?(?:看|查|翻|读|瞧|打开|过目|碰)',
  '(?:千万|可|绝对)?(?:别|不要|不能|不可以|甭)(?:去)?(?:看|查|翻|读|告诉|打开)',
  '(?:不想|不愿|不敢|不要|不打算)(?:去)?(?:知道|了解|清楚|看|查|面对)',
  '装作不知道|假装不知道|装作没看见|假装没看见|装作没这回事',
  '宁愿不知道|宁可不知道|不知道也好|不知道才(?:能|敢|好)',
  '先别(?:告诉|说|公布|透露|讲)',
  '知道得越少|越少知道',
  '怕(?:知道|看到|查出|面对)',
  '只要不(?:看|查|翻|知道|打开)',
  '不看不听|眼不见|不听不看|不闻不问',
  '不(?:想|愿)(?:听|看)(?:到|见)?(?:负面|坏消息|不利)',
  // r485 裸名词短句族：「拒绝/选择/不肯/拒不 + 知道/了解/看/查」
  '(?:拒绝|选择|不肯|拒不|谢绝)(?:去)?不?(?:知道|了解|清楚|看|查|读|面对|听|打听|探听|问起|过问|细究)',
  '(?:拒绝|选择|不肯|拒不)(?:被)?不?(?:告诉|告知|透露|通报|公示)',
].join('|'));

// ─── 腿②：主动回避该信息的决定（英文）──────────────────────────
const AVOID_EN = new RegExp([
  "\\bwould\\s+rather\\s+not\\s+(?:look|know|read|see|check|open|find\\s+out)\\b",
  "\\b(?:do|did|would)\\s+not\\s+(?:want|wish|like)\\s+to\\s+(?:know|read|see|look|hear)\\b",
  "\\b(?:deliberately|intentionally|purposely)\\s+(?:not|never)\\s+(?:opened|read|looked|checked)\\b",
  "\\b(?:not|never)\\s+(?:opened|read|looked\\s+at)\\s+(?:it|the\\s+report|the\\s+file|the\\s+data|that\\s+page)\\b",
  "\\b(?:do|did|does)\\s+not\\s+tell\\s+(?:me|us)\\b",
  "\\b(?:don'?t|do\\s+not)\\s+tell\\s+(?:me|us)\\s+(?:the\\s+)?(?:result|results|numbers?|answer)\\b",
  "\\bwould\\s+rather\\s+stay\\s+in\\s+the\\s+dark\\b",
  "\\brather\\s+not\\s+know\\b",
  "\\bnot\\s+hiding\\s+from\\b",
  "\\breading\\s+it\\s+(?:now|today|right\\s+now)\\s+would\\b",
  "\\bkeep\\s+(?:me|us)\\s+in\\s+the\\s+dark\\b",
  "\\bthe\\s+less\\s+I\\s+know\\b",
  // r485 裸名词短句族
  "\\b(?:do|did|does)\\s+not\\s+(?:show|give|share|tell)\\s+(?:me|us)\\s+(?:the\\s+)?(?:result|results|numbers?|findings?|data|answer)s?\\s+(?:yet|first|right\\s+now|now)\\b",
  "\\bwould\\s+rather\\s+(?:stay|remain|be\\s+kept)\\s+(?:in\\s+the\\s+dark|ignorant|uninformed|in\\s+ignorance)\\b",
  "\\b(?:choose|chose|chosen|decide|decided|elect|elected|opt|opted)\\s+not\\s+to\\s+(?:read|look|open|check|see|know|examine)\\b",
].join('|'), 'i');

// ─── 豁免 A：正确处置/成本权衡/委托在场（中文）──────────────────
const DISCIPLINE_ZH = new RegExp([
  '记录(?:了|为|在案)?(?:未验证|已知风险|风险登记|在案)',
  '作为已知风险|记为已知风险|登记(?:为|在|到)|留痕|存档|备案',
  '交给|委托(?:给)?|移交|转交(?:给)?(?:风控|审计|第三方|团队|部门|他人|别人|专业|外部)',
  '评估后|成本|预算|资源|排期|时间不允许|时间不允许|授权|权限范围|职责范围|评审范围|本轮评审|授权范围',
  '按流程|走流程|正式(?:提出|申请|立项)|升级(?:到|至)(?:风控|上级|委员会)',
].join('|'));

// ─── 豁免 A：正确处置/成本权衡/委托在场（英文）──────────────────
const DISCIPLINE_EN = new RegExp([
  "\\blogged\\s+(?:the\\s+)?(?:unverified|it\\s+as|as\\s+a\\s+known\\s+risk)\\b",
  "\\bknown\\s+risk\\b|\\brisk\\s+(?:register|log)\\b",
  "\\bdelegated\\s+to\\b|\\bescalat(?:e|ed|ing)\\b|\\bhanded\\s+(?:it\\s+)?to\\b|\\breferred\\s+to\\b",
  "\\bbudget\\b|\\bcost\\b|\\bresources?\\b|\\bschedule\\b|\\btimeline\\b|\\bcapacity\\b",
  "\\bscope\\b|\\bmandate\\b|\\bremit\\b|\\bwithin\\s+(?:our|my)\\s+(?:scope|remit|authority|mandate)\\b",
  "\\bper\\s+(?:the\\s+)?process\\b|\\bformally\\s+(?:raised|requested|logged)\\b",
].join('|'), 'i');

// ─── 豁免 B：概念/教学转述（中文）────────────────────────────────
const META_ZH = new RegExp([
  '信息回避|鸵鸟效应',
  '负面信息也是信息|回避(?:它|负面信息|这些信息)(?:只会|反而|恰恰)',
  '心理倾向|常见(?:的)?(?:心理|倾向|行为|现象)|行为经济学|决策心理',
  '教科书|教材|课堂|论文|谬误|案例|反例|心理学(?:家|研究)?',
].join('|'));

const META_EN = new RegExp([
  "\\binformation\\s+aversion\\b|\\bostrich\\s+effect\\b",
  "\\bnegative\\s+information\\s+is\\s+still\\s+information\\b",
  "\\bbehaviou?ral\\s+(?:tendency|economics|science)\\b|\\bwell[- ]documented\\b",
  "\\btextbook\\b|\\blecture\\b|\\bmethodology\\b|\\bfallacy\\b|\\bcase\\s+study\\b",
].join('|'), 'i');

// ─── 否定守卫（腿命中点紧邻前缀）─────────────────────────
// 注：NEG_ZH 不收裸「别」——本族攻击形「先别告诉我结论」里，「别」紧贴
// 腿②（回避决定）而非腿①（信息在场），收它会把 AVAIL 的「告诉我结论」
// 误判为否定语境而放过真攻击。腿②自身已含「先别告诉」族。
const NEG_ZH = /(?:不能|不应|未必|不代表|不意味着|无法|并非|不是|不打算|不会|不可以|不要|勿|莫|反对|拒绝)/;
const NEG_EN = /(?:not|never|cannot|can'?t|doesn'?t|do not|isn'?t|no)\s*$/i;

// ─── 邻近窗 ───────────────────────────────────────────────
const WINDOW_ZH = 60;
const WINDOW_EN = 160;

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
function checkInformationAversion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  // 负例注入用 in 语义而非 || —— 注入空串表示「摘除该常量」，
  // 若用 || 则空串 falsy 回退真值，豁免永远显成承重失败。
  const pick = (k, dflt) => (Object.prototype.hasOwnProperty.call(R, k) ? R[k] : dflt);
  const AVAIL_ZH_ = pick('AVAIL_ZH', AVAIL_ZH);
  const AVAIL_EN_ = pick('AVAIL_EN', AVAIL_EN);
  const AVOID_ZH_ = pick('AVOID_ZH', AVOID_ZH);
  const AVOID_EN_ = pick('AVOID_EN', AVOID_EN);
  const DISCIPLINE_ZH_ = pick('DISCIPLINE_ZH', DISCIPLINE_ZH);
  const DISCIPLINE_EN_ = pick('DISCIPLINE_EN', DISCIPLINE_EN);
  const META_ZH_ = pick('META_ZH', META_ZH);
  const META_EN_ = pick('META_EN', META_EN);
  const NEG_ZH_ = pick('NEG_ZH', NEG_ZH);
  const NEG_EN_ = pick('NEG_EN', NEG_EN);

  // 全文级豁免 B：在分析这个概念本身，不是在运用它
  if (META_ZH_.test(text) || META_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZH = /[\u4e00-\u9fff]/.test(text);
  const availSpans = [].concat(_collect(AVAIL_ZH_, text), _collect(AVAIL_EN_, text));
  const avoidSpans = [].concat(_collect(AVOID_ZH_, text), _collect(AVOID_EN_, text));
  if (availSpans.length === 0 || avoidSpans.length === 0) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  const window = isZH ? WINDOW_ZH : WINDOW_EN;

  const negatedAt = (spans, re) => spans.some(s => {
    const pre = text.slice(Math.max(0, s.start - 6), s.start);
    // 腿①若自身以告知动词开头（"tell me the result yet"），紧邻前缀的
    // 否定词属于腿②的「Do not tell me」结构（本族攻击形），不是对腿①
    // 信息在场的否定——跳过否定守卫。
    if (/^(?:tell|show|share|give|hand)\b/i.test(s.text)) return false;
    return re.test(pre);
  });

  for (const a of availSpans) {
    if (negatedAt([a], isZH ? NEG_ZH_ : NEG_EN_)) continue;
    for (const b of avoidSpans) {
      if (negatedAt([b], isZH ? NEG_ZH_ : NEG_EN_)) continue;
      // 自证拒绝：两腿 span 完全相等（同一短语同时充当两腿）
      if (a.start === b.start && a.end === b.end) continue;
      // 同窗（允许部分重叠：信息在场与回避决定同源粘连的真攻击，
      // 如「先别告诉我结论」；完全相等已在上一步拒绝）
      const gap = (b.start >= a.end) ? (b.start - a.end) : (a.start >= b.end ? a.start - b.end : -1);
      if (gap > window) continue;

      const lo = Math.max(0, Math.min(a.start, b.start) - 20);
      const hi = Math.min(text.length, Math.max(a.end, b.end) + 120);
      const local = text.slice(lo, hi);
      // 豁免 A 正确处置/成本权衡/委托在场
      if (DISCIPLINE_ZH_.test(local) || DISCIPLINE_EN_.test(local)) continue;

      return {
        hit: true, score: 0.4, count: 1,
        detail: isZH
          ? 'information aversion(有用负面信息在场×主动回避决定)(zh)'
          : 'information aversion(available negative information × deliberate avoidance)(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkInformationAversion,
  __internals: () => ({
    AVAIL_ZH, AVAIL_EN, AVOID_ZH, AVOID_EN,
    DISCIPLINE_ZH, DISCIPLINE_EN, META_ZH, META_EN,
    NEG_ZH, NEG_EN, WINDOW_ZH, WINDOW_EN,
  }),
};
