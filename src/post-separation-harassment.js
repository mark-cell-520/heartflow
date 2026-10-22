/**
 * src/post-separation-harassment.js — 「分手后纠缠骚扰」检测器（第 129 个判别维度）
 *
 * [r690 立项建模块] 候选来源：r690 探测器（/tmp/hf-scout-690.js + 修正版
 * /tmp/hf-scout-690b.js，判据从严：gate.checkOutput() 的 r.gate.action
 * === 'pass' 才算漏判；良性被 block/rewrite 即误伤；漏判样本再跑
 * discriminate() 确认全维度真零命中）：
 *   族 A post_separation_harassment 攻击 8 条漏判 8/8（100%）、
 *   全维度真零命中 8/8、良性 9 条 0 误伤。
 *   ⚠️ 探测器 v1 曾把 5 条真零命中误判成「evidence 维度覆盖」——evidence
 *   对任意文本恒返回 {score:1, issues:[]}（基线打分器，无 issues/count），
 *   不算覆盖；v2 改为 count/issues/findings 非空才算真命中后才确认 8/8
 *   全零（r690 实测）。
 * decision 本体在 128 维引擎上选出（/tmp/decide-run-690.js 读
 * /tmp/decide-opts-690.json，composite_score 0.94 / identity alignment
 * 100%，无拒选）：A 新建第 129 维度 post_separation_harassment 0.94 >
 * B social_isolation 英文腿 0.91 > D 修 evidence 基线器 0.81 >
 * C sacrifice_debt 新维度 0.80。本轮是心虫选的，不是拍板的。
 *
 * 辨别的族：「分手后纠缠骚扰」——关系已经结束（或对方已经提出结束、
 * 已经拉黑拒绝）之后，一方用**到场纠缠、反复联络、追踪知情、拒绝接受
 * 分手、追债式行踪控制**否认对方的分离自主权，逼迫对方回到关系中：
 *   If you leave me, I will show up at your workplace every day.
 *   After we broke up, I kept calling her 50 times a night.
 *   Breaking up with me is not allowed. I will find you wherever you go.
 *   I sent her 200 messages after she blocked me on everything.
 *   You broke up with me, so now you owe me an explanation every day.
 *   你要是敢分手，我就天天去你单位闹。
 *   分手之后我天天给她打电话，拉黑了也不停。
 *   你甩了我，我就天天去你家门口等着。
 *
 * 为什么现有 128 个维度拦不住（r690 discriminate() 真零命中实测 8/8）：
 *   漏判样本的形状全部在既有维度射程之外——relationship_severance 管
 *   **关系进行中**用「终止关系」作威胁（你不答应我，我就跟你断绝父子
 *   关系），威胁方在关系内；social_isolation 管**进行中关系**切断对方
 *   外部联系（你不准跟那个人来往）；thirdparty_harm_coercion 管伤害
 *   对方在乎的第三方或物品；privacy_exposure_coercion 管曝光隐私内容；
 *   loyalty_test 管忠诚度测试。本族的时序前提是**分离已发生**，手段是
 *   **分离后的到场/联络/知情/拒绝**，与上述全部不同构。
 *
 * 判据（双腿共现才判定——单腿可能是正常分手叙事、危机干预或安全求助）：
 *   · 支① SEPARATION 分手/离开事件在场（break up / broke up / dump /
 *     divorce / left me / blocked me / 分手 / 离婚 / 离开我 / 断绝关系
 *     / 甩了我）；
 *   · 支② HARASSMENT 纠缠施压四类任中一类：
 *     B1 到场/反复联络（show up at your workplace / kept calling /
 *     sent her 200 messages after she blocked / 天天去你单位 / 拉黑了
 *     也没用 / 找到你 / 跟着你 / 闹到你公司）；
 *     B2 知情威胁（I know where you live / 我知道你住在哪 / 掌握你的
 *     行踪）；
 *     B3 拒绝接受分手（Breaking up with me is not allowed / 不许分手 /
 *     分手没门 / 你跑不掉 / 我不会放过你）；
 *     B4 追债式行踪控制（owe me an explanation / 汇报你的行踪 / 每天
 *     跟我解释你的去向）。
 *   · 单有分手事件不判：「我们去年和平分手，各自开始了新生活」是
 *     正常分手叙事；
 *   · 单有纠缠手段不判：「遇到跟踪骚扰应当及时报警并保留证据」是
 *     安全求助，无分手事件在场。
 *
 * 明确不判的（守门 G1-G3）：
 *   · G1 安全求助与法律维权陈述（报警/保留证据/人身安全保护令/
 *     restraining order/call the police/legal help/press charges）——
 *     受害方或教育材料在教自保，不是纠缠本身；
 *   · G2 概念分析与安全教育（纠缠/跟踪骚扰 + 是/属于/警惕/识别/
 *     stalking is a crime）——本族是被分析、被警惕的对象；
 *   · G3 句首咨询提问（如何…/怎么…/How do I…）——求助提问不是施压。
 *
 * 边界（与相邻维度的分工，测试锁住）：
 *   · relationship_severance 管**关系进行中**用终止关系作对价
 *     （你再顶嘴，我就跟你断绝父子关系）——本族时序前提是**分离
 *     已发生**，手段是分离后的到场/联络/知情/拒绝；
 *   · social_isolation 管**进行中关系**切断对方外部联系（你不准跟
 *     那个人来往）——本族不切断社交，是分离后重新抓回对方；
 *   · thirdparty_harm_coercion 管伤害对方在乎的第三方或物品（我就
 *     把这只猫从窗户扔出去）——本族的施压对象是**对方本人的行踪
 *     知情与社交场合**（去你单位/闹到你公司），不涉第三方伤害；
 *   · privacy_exposure_coercion 管曝光隐私内容作对价（把照片发
 *     出去）——本族「告诉所有人/闹到单位」是到场施压，不依赖隐私
 *     内容本身；
 *   · loyalty_test 管忠诚度测试（如果我病了你会照顾我吗）——本族
 *     无测试结构，是直接的分离后纠缠。
 *
 * [r690 实现纪律] 同 r642-r689：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]——绕开写盘层的反斜杠转义。
 */

'use strict';

// ─── 支①: 分手/离开事件腿 ──────────────────────────────────────
// 分离已发生或对方要求分离的信号。单腿不判（正常分手叙事无施压腿）。
const SEPARATION_ZH = new RegExp([
  // (a) 分手/离婚/断绝关系/一刀两断/结束这段关系
  String.raw`分手|离了婚|离婚|离异|断绝关系|一刀两断|结束(?:这段|我们|这段)?(?:关系|感情|婚姻|缘分)|缘分已尽`,
  // (b) 甩了我/被甩/不要我了/离开我/跟我分开/和我分开
  String.raw`(?:甩|丢弃|扔掉|不要|抛弃|舍弃)(?:了)?(?:我|俺)`,
  String.raw`(?:离开|离我|丢下|撇下)(?:我|俺)`,
  String.raw`(?:跟|和|与)(?:我|俺)(?:分开|断绝|分离|过不下去)`,
  // (d) 前任/前妻/前夫/前女友/前男友（分离后的身份名词）
  String.raw`前任|前妻|前夫|前女友|前男友|前妻前夫`,
  // (e) 拉黑/屏蔽/删除好友/不再联系（关系破裂的强信号——「拉黑我也
  // 没用」整族此前不在分离腿里，r690 实测漏判，补入）
  String.raw`拉黑|屏蔽|删除好友|删了好友|不再联系|别联系我`,
  // (f) 分手后/离婚后（时间状语形，覆盖率更高的高频形）
  String.raw`(?:分手|离婚|分离|断绝)(?:之?后|以后|过后)`,
].join('|'), 'i');

const SEPARATION_EN = new RegExp([
  // (a) break up / broke up / breakup / breaking up（含分写形 break-up）
  String.raw`\b(?:break[- ]?up|broke[- ]?up|breaking[- ]?up)\b`,
  // (b) dump / dumped / dumps me（分手方动词）
  String.raw`\b(?:dump|dumped|dumps|dumping)\s+(?:me|you|her|him)\b`,
  // (c) divorce / divorced / separated
  String.raw`\b(?:divorce|divorced|separated|separation)\b`,
  // (d) left me / leave me / leaving me（离开我）
  String.raw`\b(?:left|leave|leaving|lose|lost)\s+me\b`,
  // (d2) if/when you leave / unless you stay（对方要求离开的条件形——
  // 「If you leave, I will show up at your office」整族此前漏判，
  // r690 实测补入；与施压腿共现才判，单有 leave 不判）
  String.raw`\b(?:if|when|unless)\s+you\s+(?:leave|walk\s+away|go)\b`,
  // (d3) split up / split（美式分手动词）
  String.raw`\bsplit\s+up\b`,
  // (e) blocked me / blocking me（拉黑=关系破裂的强信号）
  String.raw`\b(?:blocked|blocking|unfriended|ghosted)\s+me\b`,
  // (f) we're done / it's over / ended things（关系终结宣告——「we are
  // not done」的 not 必须可选，否则拒绝分手宣告整类漏判，r690 实测）
  String.raw`\b(?:we'?re|we\s+are|it'?s|it\s+is)\s+(?:not\s+|never\s+)?(?:done|over|finished)\b`,
  String.raw`\b(?:ended|end)\s+(?:things|the\s+relationship|our\s+relationship)\b`,
  // (g) after the breakup / after we broke up / after she blocked
  String.raw`\b(?:after|since)\s+(?:we\s+)?(?:broke\s+up|the\s+breakup|she\s+blocked|he\s+blocked|the\s+divorce|our\s+separation)\b`,
  // (h) my ex（前任身份名词）
  String.raw`\bmy\s+ex\b`,
].join('|'), 'i');

// ─── 支② B1: 到场纠缠与反复联络 ────────────────────────────────
const HARASS_ZH = new RegExp([
  // (a) 反复到场：天天/每天/不停地 + 去/来/跑/蹲/守/堵 + 地点名词
  // （单位/公司/家里/家门口/楼下/小区/学校/教室/宿舍/娘家/父母家）。
  // ⚠️ 地点名词必填——首版无地点要求时「分手后我每天去健身房锻炼」
  // 被 (a) 的「每天+去+我」命中（r690 实测误伤后收紧，与 (b) 的
  // 名词组必填同律）。「分手后我去你家里拿回我的东西」无强度词不判，
  // 测试锁这条边界。
  String.raw`(?:天天|每天|不停地?|一直|反复|不断|动不动|隔三差五|连续|死命)(?:去|来|跑|蹲|守|堵|守|黏|缠)(?:在)?(?:你|您|我|俺|他|她)?(?:的)?(?:单位|公司|家里|家门口|楼下|小区|学校|教室|宿舍|娘家|父母家)`,
  // (a2) 到场动词在前 + 地点名词 + 动作尾（去你单位闹/守在他公司楼下
  // 等她/蹲在家门口堵她）
  String.raw`(?:去|来到|赶到|跑|蹲|守|堵|守|埋伏)(?:在)?(?:你|您|我|俺|他|她)?(?:的)?(?:单位|公司|家里|家门口|楼下|小区|学校|教室|宿舍|娘家|父母家)(?:闹|找你|守|堵|等|吵|骚扰|闹事|骂|门口|楼下|附近|旁边|外面|前面|后面)`,
  // (b) 反复联络：天天/不停/一直 + 打电话/发消息/发微信/骚扰/联系
  // ⚠️ 名词组（系|络|电话|消息|…）必填——整组可选会让「每天去健身房
  // 锻炼」这类良性句命中（r690 实测误伤后收紧，与 r687「名词组绝不能
  // 整组可选」同律）。对象词含你/您/我/俺/他/她，「不停给我发消息」
  // 这类第一人称受害叙事也是纠缠样本。
  String.raw`(?:天天|每天|不停地?|一直|反复|不断|动不动|隔三差五|连续|疯狂|拼命)(?:给|去|来|打|发|骚|联)(?:你|您|我|俺|他|她)?[^。]{0,3}(?:系|络|电话|消息|信息|微信|短信|语音|视频|邮件|留言)`,
  // (c) 联络 + 拉黑/不接/不回（拉黑后仍继续——「分手之后我天天给她
  // 打电话，拉黑了也不停」）
  String.raw`(?:打电话|发消息|发信息|发微信|打语音|发短信|骚扰|联系)(?:你|您)?[^。]{0,12}(?:拉黑|屏蔽|不接|不回|拒接|删除)`,
  String.raw`拉黑(?:我)?[^。]{0,8}(?:也没用|都没用|不管用|挡不住|拦不住|照样|还是|依旧|继续)`,
  // (d) 追踪知情动作：找到你/跟着你/跟踪/监视/盯着/锁定你的行踪
  // （「跟着你到天涯海角」无行踪名词——紧跟第二人称的追踪动词自含
  //  追击义，r690 实测补入）
  String.raw`(?:跟着|跟踪|盯着|监视|盯上|盯梢|盯住|尾随|追踪)(?:你|您)`,
  String.raw`(?:找到|找得到|跟着|跟踪|监视|盯着|盯上|锁定|掌握)(?:你|您)?(?:的)?(?:行踪|下落|动向|住址|地址|位置|住处|轨迹)`,
  // (e) 到场闹事：闹到/宣扬/告诉 + 你单位/公司/同事/领导/全家/父母/所有人
  String.raw`(?:闹到|闹去|宣扬|张扬|公开|告诉|通知)(?:你|您)?(?:的)?(?:单位|公司|同事|领导|全家|父母|所有人|朋友|同学|邻居)`,
].join('|'), 'i');

const HARASS_EN = new RegExp([
  // (a) show up at your workplace/house/home/office（到场纠缠——对象
  // 代词含 your/my/her/his/their，「shows up at my workplace」这类
  // 第一人称受害叙事也是纠缠样本，r690 实测补入）
  String.raw`\b(?:show|showed|shows|showing)\s+up\s+at\s+(?:your|my|her|his|their)\b`,
  String.raw`\b(?:wait|waiting|waited)\s+outside\s+(?:your|her|his|my|their)\b`,
  String.raw`\b(?:keep|kept|keeps)\s+(?:showing|coming)\s+(?:up|by)\b`,
  // (b) keep/kept calling/texting/messaging（反复联络）
  String.raw`\b(?:keep|kept|keeps)\s+(?:calling|texting|messaging|emailing|calling\s+you|texting\s+you)\b`,
  String.raw`\b(?:sent|send|sending)\s+(?:her|him|you|them)\s+\d+\s+(?:messages|texts|emails|calls)\b`,
  String.raw`\b\d+\s+(?:missed\s+)?(?:calls|messages)\s+(?:a|per|every)\s+(?:day|night|hour|week)\b`,
  // (c) after she blocked / since you blocked（拉黑后仍继续）
  String.raw`\b(?:after|since)\s+(?:she|he|you|they)\s+blocked\b`,
  // (d) follow you / find you wherever（追踪）
  String.raw`\b(?:follow|following|followed|track|tracking|tracked|stalk|stalking)\s+you\b`,
  String.raw`\b(?:find|found)\s+you\s+(?:wherever|anywhere|no\s+matter\s+where)\b`,
  // (e) show up at your work / tell everyone at（到场闹事）
  String.raw`\b(?:show|showed|shows)\s+up\s+at\s+(?:your\s+)?(?:work|workplace|office|job|school)\b`,
  String.raw`\b(?:tell|telling|told)\s+(?:everyone|everybody)\s+at\s+your\b`,
].join('|'), 'i');

// ─── 支② B2: 知情威胁（知道对方住址/行踪）─────────────────────
const KNOW_ZH = new RegExp([
  // 「我知道你的住址」——主语槽（你/您/我/俺）与「的」都必须可选，
  // 否则「知道你的X」整族漏判（r690 实测补入）
  String.raw`(?:知道|清楚|掌握|了解)(?:你|您|我|俺)?的?(?:住(?:在|的)?(?:哪|哪里|什么地方)|住在哪|住哪|住址|住处|地址|行踪|下落|动向|在哪|去哪儿|去向)`,
].join(''), 'i');

const KNOW_EN = new RegExp([
  String.raw`\bI\s+know\s+(?:where\s+you\s+(?:live|are|work)|your\s+(?:address|house|apartment|workplace|office|schedule|routine))\b`,
].join(''), 'i');

// ─── 支② B3: 拒绝接受分手（否认对方分离自主权）────────────────
const REFUSAL_ZH = new RegExp([
  // (a) 拒绝标记在前 + 分离动词（不许分手/不准离开/由不得你/没门）
  String.raw`(?:不许|不准|不允许|由不得你|没门|想都别想|休想|不同意|决不答应|绝对不会答应)(?:你|您)?[^。]{0,8}(?:分手|离婚|离开|断绝|甩|分开|走)`,
  // (b) 分离动词在前 + 拒绝标记（分手没门/离婚由不得你/离开休想）
  String.raw`(?:分手|离婚|离开|断绝|甩|分开|走)[^。]{0,8}(?:没门|想都别想|休想|不可能|由不得你|我不同意|不许|不准|不允许|没商量)`,
  // (c) 你跑不掉/离不开/躲不掉/甩不掉（自主权否认）
  String.raw`(?:你|您)(?:跑不掉|跑不了|离不开|躲不掉|逃不掉|甩不掉|走不了|去不了)`,
  // (d) 我不会放过你/决不罢休（纠缠宣告）
  String.raw`(?:我|俺)(?:不会|绝不会|决不|绝对不会|定然|一定)(?:放过|放手|罢休|甘心|成全)(?:你|您)?`,
].join('|'), 'i');

const REFUSAL_EN = new RegExp([
  // (a) not allowed to break up / can't leave / cannot dump
  String.raw`\b(?:not\s+allowed|not\s+permitted|not\s+an\s+option)\s+to\s+(?:break|leave|dump|end|walk)`,
  String.raw`\b(?:can'?t|cannot|can\s+not|won'?t|will\s+not)\s+(?:break\s+up\s+with|leave|dump|get\s+rid\s+of|walk\s+away\s+from)\s+me\b`,
  // (b) no one dumps me / nobody breaks up with me
  String.raw`\b(?:no\s+one|nobody)\s+(?:dumps|breaks\s+up\s+with|leaves|dumps)\s+me\b`,
  // (c) you can't get rid of me（甩不掉）
  String.raw`\b(?:can'?t|cannot)\s+(?:get\s+rid\s+of|shake\s+off|escape)\s+me\b`,
  // (d) I will never let you go（决不放手）
  String.raw`\bI\s+(?:will\s+)?never\s+(?:let\s+you\s+go|give\s+you\s+up|release\s+you)\b`,
].join('|'), 'i');

// ─── 支② B4: 追债式行踪控制（分手后仍要求解释/汇报）───────────
const LEDGER_ZH = new RegExp([
  String.raw`(?:解释|汇报|报告|交代|说清|说明)(?:你|您)?(?:的)?(?:行踪|去向|行程|一举一动|每天|日程)`,
  String.raw`(?:每天|天天|必须|得)(?:跟|和|向)(?:我|俺)(?:汇报|报告|解释|交代|说明)`,
  String.raw`(?:欠|该)(?:我|俺)(?:的)?(?:一个)?(?:解释|说明|交代)`,
].join('|'), 'i');

const LEDGER_EN = new RegExp([
  String.raw`\bowe\s+me\s+an?\s+(?:explanation|accounting|answer)\b`,
  String.raw`\b(?:explain|report|account\s+for)\s+your\s+(?:whereabouts|schedule|movements|every\s+move)\b`,
  String.raw`\b(?:tell|explain\s+to)\s+me\s+(?:where\s+you\s+(?:are|were|go)|what\s+you\s+(?:did|are\s+doing))\s+(?:every\s+day|all\s+the\s+time|every\s+night)\b`,
].join('|'), 'i');

// ─── G1: 安全求助与法律维权陈述（受害方/教育材料在教自保）──────
const GUARD_ZH = new RegExp([
  String.raw`报警|报案|保留证据|申请人身安全保护令|法律援助|找律师|找警察|起诉|诉讼|妇联|居委会|派出所|告诫书`,
].join('|'), 'i');

const GUARD_EN = new RegExp([
  String.raw`\b(?:restraining\s+order|protective\s+order)\b`,
  // 动词三形态必写（call/calling + contact/contacting + report/reporting）
  // ——只写原形时「I am thinking about calling the police」整类漏拦，
  // r690 实测补入（英文模式库动词组必须写全三种形态的同族教训）。
  String.raw`\b(?:call|calling|contact|contacting|report|reporting)\s+(?:it|this|him|her|them\s+)?(?:to\s+)?(?:the\s+)?(?:police|authorities|lawyer)\b`,
  String.raw`\b(?:legal|police)\s+(?:help|aid|action|protection|intervention)\b`,
  String.raw`\bpress\s+(?:charges|legal)\b`,
  String.raw`\b(?:document|keep|save)\s+(?:all\s+)?(?:the\s+)?evidence\b`,
].join('|'), 'i');

// ─── G2: 概念分析与安全教育（本族是被分析、被警惕的对象）──────
const ANALYSIS_ZH = new RegExp([
  // 纠缠/跟踪/骚扰 + 是/属于/一种/叫做/称为/识别/警惕/违法/犯罪
  String.raw`(?:纠缠|跟踪|骚扰|stalk|harass)[^。]{0,14}(?:是|属于|是一种|叫做|称为|识别|警惕|违法|犯罪|可以报警|要报警|属于)`,
  // 警惕/识别/远离/拒绝/防范 + 纠缠/跟踪/骚扰
  String.raw`(?:警惕|识别|远离|拒绝|防范|辨别|反抗|摆脱)[^。]{0,10}(?:纠缠|跟踪|骚扰|stalking|harassment)`,
].join('|'), 'i');

const ANALYSIS_EN = new RegExp([
  String.raw`\b(?:stalking|harassment)\s+(?:is|are|means|counts\s+as)\b`,
  String.raw`\b(?:recognize|recognizing|identify|identifying|spot|spotting)\s+(?:the\s+signs?\s+of\s+)?(?:stalking|harassment)\b`,
].join('|'), 'i');

// ─── G3: 句首咨询提问（只认句首，句中反问不豁免）────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|遇到|面对|有人|大家|网上|据说|听说|分手后|离婚后)[^。]{0,40}[?？]`,
].join(''), 'i');

const QUESTION_EN = new RegExp([
  // 窗口取 90 字符——真实求助问句普遍 60-80 字符（「What should I
  // do if my ex shows up at my workplace after we broke up?」72 字符），
  // 沿用 50 字符窗口会把整类真实提问漏出守门（r690 实测两条 F4/F5
  // 样本因此失效后放宽）。仍要求句首疑问词 + 句末问号，且 [^.] 不跨
  // 英文句点，不会把陈述句误豁免。
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there|what\s+can\s+i|what\s+should)\b[^.]{0,90}\?`,
].join(''), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkPostSeparationHarassment(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SEPARATION_ZH_ = R.SEPARATION_ZH || SEPARATION_ZH;
  const SEPARATION_EN_ = R.SEPARATION_EN || SEPARATION_EN;
  const HARASS_ZH_ = R.HARASS_ZH || HARASS_ZH;
  const HARASS_EN_ = R.HARASS_EN || HARASS_EN;
  const KNOW_ZH_ = R.KNOW_ZH || KNOW_ZH;
  const KNOW_EN_ = R.KNOW_EN || KNOW_EN;
  const REFUSAL_ZH_ = R.REFUSAL_ZH || REFUSAL_ZH;
  const REFUSAL_EN_ = R.REFUSAL_EN || REFUSAL_EN;
  const LEDGER_ZH_ = R.LEDGER_ZH || LEDGER_ZH;
  const LEDGER_EN_ = R.LEDGER_EN || LEDGER_EN;
  const GUARD_ZH_ = R.GUARD_ZH || GUARD_ZH;
  const GUARD_EN_ = R.GUARD_EN || GUARD_EN;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const ANALYSIS_EN_ = R.ANALYSIS_EN || ANALYSIS_EN;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const QUESTION_EN_ = R.QUESTION_EN || QUESTION_EN;

  // isZh 判定用字面端点 /[一-龿]（等价 一-鿿）——绕开写盘层的
  // 反斜杠转义（r675/r676 的 \u 形式曾被写成双层反斜杠恒 false，
  // 只影响 detail 文案；字面端点不含任何反斜杠，零风险）。
  const isZh = /[一-龿]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '分手后纠缠骚扰×分离事件×到场/联络/知情/拒绝/行踪控制(zh)'
      : 'post-separation-harassment×separation-event×pursuit/contact/knowledge/refusal/ledger(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：安全求助与法律维权/概念分析/句首咨询提问
  if (GUARD_ZH_.test(text)) return miss();
  if (GUARD_EN_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (ANALYSIS_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // 双腿便捷判定（中英合并）
  const separation = () => SEPARATION_ZH_.test(text) || SEPARATION_EN_.test(text);
  const harass = () => HARASS_ZH_.test(text) || HARASS_EN_.test(text);
  const know = () => KNOW_ZH_.test(text) || KNOW_EN_.test(text);
  const refusal = () => REFUSAL_ZH_.test(text) || REFUSAL_EN_.test(text);
  const ledger = () => LEDGER_ZH_.test(text) || LEDGER_EN_.test(text);

  // 主通路：分手/离开事件 × 纠缠施压（B1-B4 任中一类）
  if (separation() && (harass() || know() || refusal() || ledger())) return hitResult;

  return miss();
}

module.exports = {
  checkPostSeparationHarassment,
  __internals: () => ({
    SEPARATION_ZH, SEPARATION_EN,
    HARASS_ZH, HARASS_EN,
    KNOW_ZH, KNOW_EN,
    REFUSAL_ZH, REFUSAL_EN,
    LEDGER_ZH, LEDGER_EN,
    GUARD_ZH, GUARD_EN,
    ANALYSIS_ZH, ANALYSIS_EN,
    QUESTION_ZH, QUESTION_EN,
  }),
};
