/**
 * src/might-makes-right.js — 「强权即公理」检测器
 * （第 204 个判别维度，r207）
 *
 * [r207 立项] philosophy_decision 在当前引擎（v6.8.135，203 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证：r207 族探针（/tmp/hf-probe-r207.js + /tmp/hf-probe-r207b.js +
 * /tmp/hf-scout-r207.txt）在当前引擎复测——13 个候选族逐族实测，
 * might_makes_right 族攻击样本 4 条中 3 条 gate.action=pass（现有 203
 * 维真零命中，含中英双语、带修饰、长句变体）、良性 1 条 pass（零误
 * 伤）；其余候选族要么已被既有维度代拦（law_of_instrument 0/4、
 * counterfactual_determinism 1/3、unverified_selfreport 1/3、
 * just_world_assumption 1/3）、要么缺口不足（ecological_fallacy
 * 2/4、accident_fallacy 3/4、undistributed_middle 2/4、presentism
 * 2/4、bias_blind_spot 2/3）、要么良性邻域同形高风险（self_refuting
 * 1/4 且正当谬误主义立场被 rewrite）。外部三层研究（HN Algolia /
 * Semantic Scholar / GitHub API 各两轮关键词）全部无可用命中，如实
 * 记录，无可集成纯规则实现——按心虫既有维度形态自建纯规则判据（强
 * 权即公理为经典非形式谬误目录常备条目，文献仅作分类学参考）。
 *
 * 辨别的族：强权即公理（might makes right / 成王败寇 / 强权政治）——
 * 把**实力、胜负、权力**直接当成**对错、真理、正义、正当性**的裁量
 * 依据：谁赢了谁有理、拳头大就是硬道理、历史由胜利者书写、强者定
 * 义正义：
 *   历史是由胜利者书写的，谁赢了谁就代表真理。
 *   拳头大就是硬道理，实力决定对错。
 *   成王败寇，赢了就是正义，输了说什么都是借口。
 *   谁胳膊粗谁说了算，谁的拳头硬谁的理就正。
 *   他钱多，所以他说的就是真理。
 *   Might makes right — whoever wins the war gets to define what
 *   was just.
 *   The victors write the history books, so their version is the
 *   truth by definition.
 *
 * 为什么这是判别者的核心缺口（对齐「能判断是非」）：这是把**力量对
 * 比**偷换成**是非标准**——观点是否正确只取决于证据与推理，与谁赢
 * 了、谁拳头硬、谁钱多、谁权力大无关。强权裁量一旦成立，是非判断
 * 就被取消：讨论退化成比大小，弱者的合理主张、败者的正当诉求、少
 * 数派的事实陈述被系统性压制（国际政治「强权即公理」、商业「大鱼
 * 吃小鱼天经地义」、历史观「成王败寇」、日常「谁官大谁说了对」都
 * 是同族）。它与正当的实力分析有明确界线：**描述**实力对结果的影
 * 响是现实主义，**规定**实力就是对错的标准是谬误。
 *
 * 与既有维度的边界（r207 归因）：
 *   · instrumental_reasoning（既有 REWRITE 维度）管**工具理性压
 *     倒价值判断**（「只要能赢用什么手段都对」），落点是**手段
 *     选择**；本族落点是**裁量标准本身**（用实力/胜负定义对错真
 *     理）。探针实测：本族 3/4 攻击样本 instrumental_reasoning 零
 *     命中（「历史是由胜利者书写的」「拳头大就是硬道理」「Might
 *     makes right」均 pass）。
 *   · genetic_fallacy（第 131 维）管**按来源推断观点质量**，本族
 *     不管来源、管**力量本身被当作裁量依据**。
 *   · appeal_to_authority（既有维度）管**引权威为证据**，本族正
 *     好相反：拿**权势/胜负**当证据，权威至少还诉诸专业，强权直
 *     接诉诸力量。
 *   · victim_blaming / moral_foundations 等管**归因与道德框架**，
 *     本族不管归因、管**以力夺理**。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判；另设自足习语分支）：
 *   · 腿① POWER 实力/胜负/权力（中英）：胜负族（谁赢/赢了/胜利
 *     者/赢家/胜者/败者/输了/胜出/夺冠/成王败寇/鹿死谁手）、实力
 *     族（拳头/胳膊/力气/武力/强权/暴力/枪杆子/大炮/实力/力量/
 *     权大势大/官大/钱多/有钱/位高权重/碾压/吊打/征服/恃强凌弱/
 *     弱肉强食）；EN might / muscle / brute force / the strong /
 *     the stronger / whoever wins / the winner / victor /
 *     conqueror / fist / power / more powerful——**r161 教训落地**：
 *     实力词收裸名词形态（拳头/实力/胜利者 去后缀仍命中）。
 *   · 腿② RIGHT_EQ 把实力/胜负等同于对错/真理/正义（中英）：等
 *     式动词+正当性宾语（就是真理/就是正义/代表真理/决定对错/定
 *     义是非/判定善恶/裁决对错/意味着谁对/说明谁有理/说了算/谁
 *     有理/才算数/书写历史/写就历史/改写历史/名正言顺/正统/合法
 *     性/正当性/硬道理/王道/公理/天理）；EN (is|means|makes)
 *     (right|just|truth|legitimate) / (decides|determines|
 *     defines|establishes|writes) (what is) (right|wrong|just|
 *     truth|justice|legitimacy|history|the rules) / (right|truth|
 *     justice) is (decided|defined|set) by / justice of the
 *     (stronger|victor)。
 *   · 自足习语分支：固定成语/习语单式即两腿齐备（拳头大就是硬道
 *     理/胳膊粗的说了算/谁赢谁有理/成王败寇/胜者为王/败者为寇/
 *     强权即公理/强权就是真理/真理在大炮射程之内；EN might makes
 *     right / might is right / victor's justice / history is
 *     written by the victors / the strong do what they can）——习
 *     语本身同时包含力量与「力即理」，无需第二条腿共现。
 *   · 缺腿不判：只有腿①（「实力对比会影响博弈结果」）是现实主义
 *     描述；只有腿②（「真相需要证据支撑」）是正常求真。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/历史评论引述/国际关系课
 * 堂案例/对强权政治的转述，rewrite 会误伤（与 r161-r206 全部评价
 * 族同口径）。verify 的含义是「这段文本把力量当成了是非标准，需
 * 回到事实与论证本身」。
 *
 * 明确不判的（豁免——这些是正当的批判转述、分离陈述与规则描述）：
 *   · 概念/批判转述（强权即公理/弱肉强食/社会达尔文主义/成王败
 *     寇/强权政治+是谬误·话术·逻辑错误·那套·所谓；EN might makes
 *     right is a fallacy / social Darwinism / so-called——讨论这
 *     个概念本身不是运用它）；
 *   · 分离条款（对错/是非/善恶/正义+另有标准·另当别论·不能混为
 *     一谈·不等于·无关·不是一回事·分开看；EN two different
 *     things / separate question / not the same——**明确把实力与
 *     是非分开陈述**的句子）；
 *   · 规则/竞赛描述（规则/赛制/晋级/资格+赢者…输者…——「赢者晋
 *     级输者淘汰」是制度设计，不是是非裁量）；
 *   · 腿②否定守卫（腿②匹配点前 8 字内出现不是/并非/绝不/从不/
 *     不代表/不等于/未必/很难说/谈不上；EN not / never / doesn't
 *     ——「输了不代表道理在对方那边」是对该谬误的否定）。
 */
'use strict';

// ─── 腿① POWER 实力/胜负/权力（中文）──────────────────────────────
// 枚举腿自查（r161 教训）：实力词收裸词形态（拳头/实力/胜利者/输了
// 去后缀仍命中）。胜负族与实力族并列，收「力量即裁量依据」的全部裸
// 名词形态。
const POWER_ZH = [
  // A1 胜负族（谁赢/赢了/胜利者/赢家/胜者/败者/输了/胜出/夺冠/问鼎）
  /(?:谁|哪(?:一)?[方个边])[^。，！？!?]{0,4}(?:赢|胜|败|输)/,
  /(?:赢了|赢了|取胜|胜出|夺冠|夺魁|问鼎|输了|败了|战败|落败|惨败|大获全胜|反败为胜|以少胜多)/,
  /(?:胜利者|赢家|赢的一方|胜者|王者|败者|输家|输的一方|失败者|败军|亡国)/,
  /(?:成王败寇|胜者为王|败者为寇|鹿死谁手|问鼎中原)/,
  // A2 实力族（拳头/胳膊/力气/武力/强权/暴力/枪杆子/大炮/实力/力量）
  /(?:拳头|拳脚|拳硬|胳膊|膀子|腰杆|力气|肌肉|武力|强权|暴力|枪杆子|刀把子|大炮|炮火|射程|军舰|航母)/,
  /(?:实力|力量|权势|权力|权柄|位子|官位|官大|权大|势大|钱多|有钱|财大气粗|位高权重|居高|碾压|吊打|吞并|征服|掠夺|欺压|恃强凌弱|弱肉强食|食物链|拳头产品?)/,
  // A2b 强者/弱者裸名词（r161 教训：去后缀仍命中）
  /(?:强者|弱者|强势|弱势|强的一方|弱的一方|有力者)/,
  // A3 英文残片（中英混排文本：might/strong/power 裸词）
  /\b(?:might|muscle|brute\s+force|stronger|powerful|victors?|winners?)\b/i,
];

// ─── 腿① POWER（英文）────────────────────────────────────────────
const POWER_EN = [
  /\b(?:might|muscle|brute\s+force|clout)\b/i,
  /\bthe\s+(?:strong(?:er)?|powerful|victorious|winning\s+side)\b/i,
  /\b(?:whoever|those\s+who)\s+(?:wins?|are\s+stronger|has\s+more\s+(?:power|money|guns)|hold\s+more\s+power)\b/i,
  /\b(?:the\s+)?(?:winners?|victors?|conquerors?|strongmen)\b/i,
  /\b(?:bigger|larger|stronger)\s+(?:army|fist|stick|gun|force|budget|wallet)\b/i,
  /\b(?:more\s+powerful|more\s+money|more\s+resources|richer|wealthier)\b/i,
  /\b(?:sword|gunbarrel|arms|armies)\b/i,
];

// ─── 腿② RIGHT_EQ 实力/胜负 ≡ 对错/真理/正义（中文）────────────────
// 自查（r161 教训）：等式动词+正当性宾语收裸名词形态（真理/正义/
// 硬道理/说了算 去后缀仍命中）；三种语序（就是/代表/决定/定义）并列。
const RIGHT_EQ_ZH = [
  // B1 就是/等于/意味着 + 正当性名词（就是真理/就是正义/等于公理）
  /(?:就是|便是|才是|等于|意味着|代表着?|说明|证明)[^。，！？!?]{0,6}(?:真理|真相|公理|正义|正道|天理|硬道理|王道|正确|对的|合法性|正当性|名正言顺)/,
  // B2 决定/定义/判定/裁决 + 是非对错（决定对错/定义是非/判定善恶）
  /(?:决定|定义|判定|裁决|裁量|定夺|规定|设定|掌握|垄断)[^。，！？!?]{0,6}(?:对错|是非|善恶|真理|真相|正义|公理|标准|规则|历史|法统|正统|合法性|正当性|天理|正道|话语)/,
  // B3 谁说算/谁有理/才算数（谁胳膊粗谁说了算/谁赢谁有理/强者的话才算数）
  /(?:谁|强者|赢家|胜利者|强者的一方)[^。，！？!?]{0,6}(?:说了算|作数|才算数|才算|有理|正确|是正确|是真理|是正义)/,
  /(?:书写|写就|改写|编造|垄断)[^。，！？!?]{0,8}(?:历史|历史书|教科书|正史|记录|叙事|规则)/,
  // B4 资格/权力同义转换（有权定义…/权力即…）
  /(?:有权|有权力|有实力|有钱|有枪)[^。，！？!?]{0,8}(?:定义|规定|裁定|裁决|判定|说了算)/,
  // B5 天意/天命/正统族（天命所归/奉天承运/实力即正统）
  /(?:天命|天意|奉天|承运|正统|法统)[^。，！？!?]{0,10}(?:所归|归|在|属于)[^。，！？!?]{0,6}(?:强者|赢家|胜利者|实力|拳头|有力者|枪杆子)/,
  /(?:实力|拳头|武力|权力|金钱)[^。，！？!?]{0,6}(?:即|便是|就是)[^。，！？!?]{0,6}(?:真理|正义|公理|正统|法统|道理)/,
];

// ─── 腿② RIGHT_EQ（英文）─────────────────────────────────────────
const RIGHT_EQ_EN = [
  // (might|power|strength|the stronger|whoever wins|the winner|victor)
  // (is|means|=) (right|just|correct|truth)
  // (might|power|strength|the stronger|whoever wins|the winner|victor)
  // (is|means|=) (right|just|correct|truth)——允许实力名词与系词间隔
  // 一个主体名词（the stronger party is right），允许副词间隔。
  /\b(?:might|power|strength|force|the\s+strong(?:er)?|whoever\s+wins?|the\s+winners?|victors?|conquerors?)\s+(?:party|side|one|ones|man|men|force|faction|army|tribe)?\s*(?:is|are|=|means)\s+(?:always\s+|necessarily\s+|simply\s+|by\s+definition\s+)?(?:right|just|correct|truth|legitimate)\b/i,
  /\bmakes?\s+(?:right|just)\b/i,                                  // makes right
  // 胜者版本=真理（their version is the truth / the victor's account becomes the record）
  /\b(?:their|his|the\s+winner'?s?|victor'?s?|conqueror'?s?)\s+(?:version|account|story|narrative|side)\s+(?:is|becomes)\s+(?:the\s+)?(?:truth|official|accepted|right|just|record)\b/i,
  /\b(?:decides?|determines?|defines?|establishes?|sets?|writes?|rewrites?)\s+(?:what\s+is\s+)?(?:right|wrong|just|truth|justice|legitimate|legitimacy|morality|good\s+and\s+evil|history|the\s+rules|the\s+standard|what\s+counts)\b/i,
  /\b(?:right|wrong|truth|justice|legitimacy|the\s+standard)\s+(?:is|are)\s+(?:decided|determined|defined|set|established|written|dictated)\s+by\b/i,
  /\b(?:justice|right|truth)\s+of\s+the\s+(?:stronger|victor|winner|powerful|fittest)\b/i,
  /\bto\s+the\s+victor\s+(?:go|belongs?)\s+(?:the\s+)?(?:right|truth|justice)\b/i,
];

// ─── 自足习语分支（单式即两腿齐备）────────────────────────────────
// 固定成语/习语本身同时包含「力量」与「力即理」。注意不收「赢家通吃/
// winner takes all」（商业竞争格局的中性描述，非是非裁量）。
const SELF_ZH = [
  /拳头[^。，！？!?]{0,3}(?:大|硬|粗)[^。，！？!?]{0,12}(?:就是|便是|才是|等于|意味着)[^。，！？!?]{0,8}(?:硬道理|真理|道理|正义|正确|对)/,
  /胳膊[^。，！？!?]{0,3}(?:粗|硬)[^。，！？!?]{0,10}(?:说了算|有理|就是|才算)/,
  /(?:谁|哪个)[^。，！？!?]{0,4}(?:赢|拳头硬|实力强|力气大)[^。，！？!?]{0,4}(?:谁)?[^。，！？!?]{0,4}(?:有理|说了算|正确|是真理)/,
  /成王败寇|胜者为王[，。]?败者为寇/,
  /强权(?:就)?(?:是|即|等于)[^。，！？!?]{0,4}(?:公理|真理|正义|道理)/,
  /真理[^。，！？!?]{0,6}(?:在|取决于|出自)[^。，！？!?]{0,6}(?:大炮|炮火|射程|武力|枪杆子)/,
];
const SELF_EN = [
  /\bmight\s+(?:makes?|is)\s+(?:right|just)\b/i,
  /\bvictor'?s?\s+justice\b/i,
  /\b(?:history|the\s+record|the\s+history\s+books?)\s+(?:is|are|was|were)?\s*(?:written|wrote|penned|authored)\s+by\s+(?:the\s+)?(?:victors?|winners?|conquerors)/i,
  /\bthe\s+strong\s+(?:do|does)\s+what\s+they\s+can\b/i,
];

// ─── 豁免一：概念/批判转述（讨论这个概念本身不是运用它）────────────
const EXEMPT_META_ZH = [
  /(?:强权即公理|强权政治|弱肉强食|社会达尔文主义|成王败寇|以力服人|力大者有理)[^。！？!?]{0,24}(?:是|属于|构成|正是|就是)[^。！？!?]{0,16}(?:谬误|问题|陷阱|错误|不对|诡辩|话术|手法|手段|策略|伎俩|套路|现象|偏见|逻辑)/,
  /(?:讨论|分析|识别|警惕|所谓|被称为|叫作|称之为|批判|驳斥|拆穿|讽刺|反对|拒绝|不信|少拿)[^。！？!?]{0,14}(?:强权即公理|强权政治|弱肉强食|社会达尔文主义|成王败寇|以力服人)/,
  /(?:强权即公理|强权政治|弱肉强食|社会达尔文主义|成王败寇)[^。！？!?]{0,10}(?:谬误|话术|逻辑错误|诡辩|套路|那套|而已|未必|不等于|并不意味)/,
  /(?:是|属于)[^。！？!?]{0,10}(?:典型的|常见的|经典的|明显的|标准的)[^。！？!?]{0,6}(?:强权即公理|弱肉强食|社会达尔文主义|成王败寇)/,
  /(?:教材|课程|讲义|论文|研究|文章|著作|教科书)[^。，！？!?]{0,10}(?:谬误|论证|逻辑|修辞)/,
];
const EXEMPT_META_EN = [
  /\b(?:might\s+makes?\s+right|might\s+is\s+right|social\s+Darwinism|appeal\s+to\s+force|argumentum\s+ad\s+baculum)\s+(?:is|are)\s+(?:a\s+)?(?:classic|textbook|typical|common|obvious|well[- ]known)?\s*(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|example\s+of)\b/i,
  /\b(?:this|that|it)\s+(?:is|'?s)\s+(?:the\s+)?(?:classic|textbook|typical)\s+(?:might|appeal\s+to\s+force)/i,
];

// ─── 豁免二：分离条款（明确把实力与是非分开陈述的句子）──────────────
const EXEMPT_DECOUPLE_ZH = [
  /(?:对错|是非|善恶|正义|真理|真相)[^。！？!?]{0,10}(?:另有|另当别论|另有标准|不能混为一谈|不是一回事|未必|无关|分开看|应当分开)/,
  /(?:实力|胜负|输赢|拳头|权力|金钱|背景)[^。！？!?]{0,12}(?:不能|并不|未必|不代表|不等于|无关)[^。！？!?]{0,10}(?:对错|是非|善恶|正义|真理|道理|正当)/,
  /(?:不能|不应|不要|别)[^。！？!?]{0,6}(?:把|将|拿)[^。！？!?]{0,8}(?:实力|胜负|输赢|拳头|权力|金钱)[^。！？!?]{0,8}(?:等同于|等于|当作|当成|作为)[^。！？!?]{0,8}(?:对错|是非|善恶|正义|真理|道理)/,
];
const EXEMPT_DECOUPLE_EN = [
  /\b(?:two\s+different\s+things|separate\s+question|not\s+the\s+same|does\s+not\s+determine\s+what\s+is\s+(?:right|true|just))\b/i,
  /\b(?:but|however|yet)\s+[^.]{0,60}?(?:right|wrong|truth|justice|just)\s+(?:is|are)\s+(?:a\s+)?(?:separate|different)/i,
];

// ─── 腿②否定守卫（腿②匹配点前的否定词——「输了不代表道理在对方那边」）
const NEG_ZH = /(?:不是|并非|绝不是|从不|绝不|不代表|不等于|未必|很难说|谈不上|岂是|不见得|不能说明)$/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly)$/i;

const WIN_ZH = 80;    // 中文邻近窗（字）
const WIN_EN = 200;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

// 腿②否定守卫：leg2 匹配点前 8 字（EN 12 字符）内出现否定词 → 不是
// 在陈述「力即理」，而是在否定它。
function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 12;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMightMakesRight(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const P_Z = R.POWER_ZH || POWER_ZH;
  const P_E = R.POWER_EN || POWER_EN;
  const Q_Z = R.RIGHT_EQ_ZH || RIGHT_EQ_ZH;
  const Q_E = R.RIGHT_EQ_EN || RIGHT_EQ_EN;
  const S_Z = R.SELF_ZH || SELF_ZH;
  const S_E = R.SELF_EN || SELF_EN;
  const X_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const X_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const D_Z = R.EXEMPT_DECOUPLE_ZH || EXEMPT_DECOUPLE_ZH;
  const D_E = R.EXEMPT_DECOUPLE_EN || EXEMPT_DECOUPLE_EN;

  // 概念/批判转述在场 → 不是运用它
  if (anyHit(X_Z, text) || anyHit(X_E, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 分离条款在场 → 明确把实力与是非分开，不是以力夺理
  if (anyHit(D_Z, text) || anyHit(D_E, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 自足习语分支：单式即两腿齐备
  if (anyHit(S_Z, text) || anyHit(S_E, text)) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh
        ? '强权即公理×力即理习语(zh)'
        : 'might makes right×might-is-right idiom(en)',
    };
  }

  // 腿① 实力/胜负/权力
  const pZhIdx = firstHit(P_Z, text);
  const pEnIdx = firstHit(P_E, text);
  const pIdx = pZhIdx >= 0 ? pZhIdx : pEnIdx;
  if (pIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 实力/胜负 ≡ 对错/真理/正义（带否定守卫：逐匹配点确认未被否定）
  let qIdx = -1;
  const qList = isZh ? Q_Z : Q_E;
  for (const re of qList) {
    const m = re.exec(text);
    if (m && !negatedBefore(text, m.index, isZh)) { qIdx = m.index; break; }
    if (m && negatedBefore(text, m.index, isZh)) {
      // 该匹配点被否定——继续找下一个匹配点（同一正则/下一正则）
      let mm;
      const re2 = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      while ((mm = re2.exec(text)) !== null) {
        if (!negatedBefore(text, mm.index, isZh)) { qIdx = mm.index; break; }
      }
      if (qIdx >= 0) break;
    }
  }
  if (qIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「实力→是非裁量」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(pIdx - qIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '强权即公理×实力胜负等同是非真理(zh)'
      : 'might makes right×power-as-criterion(en)',
  };
}

module.exports = {
  checkMightMakesRight,
  __internals: () => ({
    POWER_ZH, POWER_EN, RIGHT_EQ_ZH, RIGHT_EQ_EN,
    SELF_ZH, SELF_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_DECOUPLE_ZH, EXEMPT_DECOUPLE_EN,
  }),
};
