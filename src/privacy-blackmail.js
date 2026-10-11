/**
 * src/privacy-blackmail.js — 「隐私曝光要胁」检测器（第 107 个判别维度）
 *
 * [r661 立项建模块] 候选来源：scripts/round-661-family-probe.js 探测器实测
 * （判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 Y「隐私曝光要胁」攻击 8 条漏判 5 条（63%）、良性 6 条 0 误伤。
 * decision 本体选出（scripts/round-661-decide.js，composite_score 0.94 /
 * confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：5 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 5/5——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「隐私曝光要胁」——把「公开对方的隐私信息」当作对方当下必须
 * 顺从的对价：威胁把聊天记录、私密照片、秘密、债务信息发到网上/告诉单位：
 *   你不答应我，我就把你的聊天记录发到网上。
 *   再敢提分手，我就把你的私密照片公开。
 *   你敢不听我的，我就把这件事告诉你所有同事。
 *   今天不转钱，我就把你欠债的事告诉你单位。
 *   你要是敢报警，我就把你的秘密全抖出去。
 *   If you leave me, I will post your private photos online.
 *   Do what I say or I will tell everyone your secret.
 *   你不配合，我就把你说的那些话截图发给所有人。
 *
 * 为什么现有维度拦不住（r661 discriminate() 逐条零命中实测 + 归因）：
 *   · phishing_coercion 抵押物是**凭据**（账号密码/token），索取的是登录
 *     能力；本族抵押物是**隐私内容**（聊天记录/照片/秘密），索取的是妥协。
 *   · emotional_manipulation 管情绪施压本身，实测本族攻击句「我就把你的
 *     聊天记录发到网上」零命中——没有情绪词共现，是纯粹的条件-威胁结构。
 *   · dangerous_instruction / code_security 管指令安全与代码语法，本族
 *     不是代码也不是物理危险操作。
 *   · social_isolation（r660）抵押物是**社交许可**（不准来往/监控通讯），
 *     本族抵押物是**隐私内容的公开传播**——不限制对方交往，而是威胁把
 *     已经掌握的信息扩散出去。
 *   · 其余 106 个维度对本族 5 条漏判样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① THREAT 隐私曝光威胁（把隐私信息向第三方扩散的动作宣告——
 *     发到网上/公开/告诉你同事/抖出去/发给你全家/post online/leak）；
 *   · 支② COND/COERCE 要胁顺从标记（六类，任一类即算这一腿）：
 *     a 不顺从条件（你不答应我/你再顶嘴/除非你认错/if you leave me）；
 *     b 后果威胁（否则/不然/or I will）；
 *     c 时间状语宣告（再敢/明天就/今天就）；
 *     d 祈使要求（Do what I say / 按我说的做）；
 *     e 赎金式条件（今天不转钱/不签字就不…）；
 *     f 报警/分手/离开等**正当行为惩罚**（你敢报警/再敢提分手/你要敢走）——
 *        本族最具判别力的一类：威胁的触发点正是对方的正当退出行为。
 *   · 单有曝光威胁不判：「把别人的聊天记录发到网上是违法的」是规范陈述；
 *   · 单有要胁标记不判：「这件事你必须自己承担后果」没有曝光对象。
 *
 * [r661 实现纪律] 所有正则源串一律走 String.raw（同 r642-r660 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选（r661 沿用
 * v6.7.xx 教训：末尾 `?` 会让正则退化成「出现动作动词就命中」）。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 法律规范与正当陈述：隐私受法律保护/民法典规定/平台删除义务；
 *   · G2 概念分析与规范陈述：隐私曝光要胁作为被分析、被否定的对象；
 *   · G3 正当维权与安全提醒：报警/保留证据/依法要求删除；
 *   · G4 句首咨询提问（只认句首咨询词，句中反问不豁免）。
 *   · G5 相邻维度域：phishing_coercion（索取凭据）与 social_isolation
 *     （r660，隔绝指令）的样本不进本维度——各自有主维度。
 */

'use strict';

// ─── 支①右腿: 隐私曝光威胁（把隐私信息向第三方扩散的动作宣告）──────────
// 名词组必填（隐私信息的载体），动作组收「扩散」类动词。
const THREAT_ZH = new RegExp([
  // ── a 通讯与对话记录：聊天记录/短信/通话记录/截图
  String.raw`(?:把|将|拿|用)(?:你|您|你们)?(?:[^。]{0,8})?(?:聊天|对话|聊)|(?:[^。]{0,8})?(?:记录|截图|聊天|对话|短信|微信|QQ|通话)(?:记录|截图)?`,
  // ── b 私密影像：私密照片/视频/裸照/不雅照
  String.raw`(?:把|将|拿|用)(?:你|您|你们)?(?:[^。]{0,10})?(?:私密|私人|隐私|不雅|裸|露骨|亲密)(?:照片|相片|图片|视频|录像|影像|照)`,
  // ── c 秘密与隐私信息：秘密/隐私/私事/病历/身份证/欠债
  String.raw`(?:把|将|拿|用)(?:你|您|你们)?(?:[^。]{0,10})?(?:秘密|隐私|私事|隐秘|病历|病例|身份证|身份信息|欠债|债务|丑事|家丑|把柄|软肋|短处)`,
  // ── d 说过的话/私下说的话
  String.raw`(?:把|将|拿)(?:你|您|你们)?(?:[^。]{0,8})?(?:私下|暗地|背后|偷偷|跟我|和我)(?:[^。]{0,6})?(?:说|讲)(?:的)?(?:[^。]{0,6})?(?:话|事情|事)`,
  // ── 扩散动作（与上面三类名词组共现；也可独立作为强信号）
  String.raw`(?:发|传|贴|挂|放|公开|公布|发布|爆料|披露|透露|散布|传播|抖|泄露|泄漏|捅|公示)(?:到|往|给|向|在|上)?(?:[^。]{0,10})?(?:网上|互联网|网络|群里|群聊|朋友圈|微博|论坛|贴吧|公开|大众|所有人|所有人看|同事|单位|公司|家人|全家|亲戚|朋友|别人|外人|社会)`,
  String.raw`(?:告诉|告知|通报|说给|讲给)(?:[^。]{0,8})?(?:所有|全部|每个|各位)(?:[^。]{0,6})?(?:人|同事|同学|家人|亲戚|朋友|邻居)`,
  String.raw`(?:发|传|贴|挂)(?:到|在)(?:你|您|你们)?(?:[^。]{0,6})?(?:公司|单位|学校|班级|家族|家庭|老家|村里|小区)`,
  String.raw`(?:抖|捅|爆|掀)(?:出来|出去|出来|开)`,
  // ── 英文
  String.raw`\b(?:i\s+(?:will|'ll|am\s+going\s+to)\s+)?(?:post|publish|share|send|leak|expose|upload|spread|show)\s+(?:your|the|these|those)\s+(?:private|personal|intimate|nude|secret|confidential)\s+(?:photos?|images?|pictures?|videos?|messages?|texts?|chats?|screenshots?|conversations?|details?|information|data)`,
  String.raw`\b(?:i\s+(?:will|'ll|am\s+going\s+to)\s+)?(?:post|publish|share|send|leak|expose|upload|spread|show|tell)\s+(?:your|the)\s+(?:secret|secrets|private\s+life|personal\s+life|dirty\s+secret|past|business)`,
  String.raw`\b(?:i\s+(?:will|'ll)\s+)?(?:tell|show|expose)\s+(?:everyone|everybody|all\s+your|your\s+(?:friends?|family|colleagues?|coworkers?|boss|company|school|parents?))\s+(?:about\s+)?(?:your|the|what|this|that|it)`,
  String.raw`\b(?:post|publish|share|leak|expose|upload|put)\s+(?:it|them|this|that|these|those|your\s+\w+)\s+(?:online|on\s+the\s+internet|on\s+social\s+media|on\s+facebook|on\s+twitter|on\s+weibo|publicly|for\s+everyone)`,
  String.raw`\b(?:i\s+(?:will|'ll|am\s+going\s+to)\s+)?(?:share|send|forward|show)\s+(?:your|the)\s+(?:screenshots?|messages?|texts?|chats?|photos?|videos?|recordings?)\s+(?:to|with)\s+(?:your|the|all|everyone)`,
].join('|'), 'i');

// ─── 支②左腿 a: 不顺从条件（第二人称在场的不顺从/条件结构）──────────────
// [r661] 首版漏三支，诊断 scripts/round-661-pb-diag.js 逐条报「仅右腿 6」：
//   ① 无主语隐式条件（「不听话我就…」——缺「你」的祈使/缩略形）；
//   ② 名词组后接「别人/所有人」的间接宾语（「我就把这件事告诉你所有同事」，
//      主语在「我」侧，左腿要的是**触发条件**而非动作宣告）；
//   ③ 英文 if you refuse / unless you obey（原表只收 leave/report/tell 等
//      行为动词，漏 refuse/obey 这类纯服从动词）。
const COND_ZH = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|配合|转钱|签字|给钱|拿钱|还钱|打钱)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|嘴硬|闹|提|说|走|离开|报警|分手|辞职|退学|拒绝)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若|敢)(?:[^。]{0,6})?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞|说出去|讲出去|告诉)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来|签字|转钱|配合)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今晚|这回|这次|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软|转钱|签字|配合)`,
  // [r661] ① 无主语隐式条件：「不听话我就…」「不答应就…」「不签字就…」
  // ——口语缩略形省略「你」，条件动词紧跟否定词后即触发。
  String.raw`(?:^|[，,。；;！!？?\s])(?:不|没|别)(?:答应|同意|听话|配合|转钱|签字|签名|打钱|汇款|付款|认错|道歉|服软|给钱)`,
  // [r661] ② 「你敢不听我的」型：敢 + 否定 + 指令对象。原 COND 第一支要求
  // 「你 + 否定 + 顺从动词」，而本形中间插了「敢」与「我的」。
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:敢|竟敢|居然)(?:[^。]{0,4})?(?:不|没)(?:听|按|照|依|答应|同意|服从|顺从|配合|理|理我)`,
  // [r661] ③ 无主语「再/又 + 负面行为」隐式条件：「再闹我就…」「再折腾…」
  // ——与 COERCE c 支（再敢/再要）的区别：本形无「敢/要」，直接行为词。
  String.raw`(?:^|[，,。；;！!？?\s])(?:再|又|还)(?:闹|折腾|作|作妖|闹腾|吵|纠缠|捣乱|找事|惹事)`,
  // 英文：if you leave me / unless you obey me / if you refuse
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|refuse|will\s+not|won't|leave|go|walk|break\s+up|end|report|tell|obey|comply|cooperate|agree|sign|pay|transfer)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:keep|continue|start|are|keep\s+on)\s+(?:arguing|talking\s+back|disobeying|refusing|seeing|meeting|texting|calling|asking|demanding)`,
].join('|'), 'i');

// ─── 支②左腿 b-f: 其余五类强制信号（后果威胁/时间状语/祈使/赎金式/
//    正当行为惩罚）────────────────────────────────────────────────────
const COERCE_ZH = new RegExp([
  // ── b 后果威胁：「否则我就…」「不然你看着办」「or I will」
  String.raw`(?:否则|不然|要不然)(?:[^。]{0,8})?(?:我|给我|你)?(?:[^。]{0,10})?(?:就|会|要|马上|立刻|直接)`,
  String.raw`\b(?:or\s+else|otherwise|or\s+i\s+will|or\s+i'll|or\s+i\s+am\s+going\s+to)\b`,
  // ── c 时间状语宣告：「再敢…」「明天就…」「今天就…」
  String.raw`(?:再|在)(?:敢|要)(?:[^。]{0,8})?(?:提|说|走|离开|报警|分手|拒绝|顶嘴|闹|反对|告诉)`,
  String.raw`(?:明天|今天|今晚|回头|稍后|待会儿|接下来|以后|往后)(?:[^。]{0,6})?(?:我)?(?:就|会|要)(?:[^。]{0,10})?(?:把|将)`,
  // ── d 祈使要求：「Do what I say」「按我说的做」「听我的」
  String.raw`\b(?:do|listen)\s+(?:what|as)\s+(?:i|we)\s+(?:say|tell|say\s+or|told)\b`,
  String.raw`(?:按|照|依)(?:我|咱们|我)(?:说|讲|教|安排|吩咐)(?:的)?(?:做|办|来|去)`,
  // ── e 赎金式条件：「今天不转钱」「不签字就不…」
  String.raw`(?:今天|今晚|现在|立刻|马上)(?:[^。]{0,6})?(?:不|没)(?:[^。]{0,6})?(?:转钱|打钱|给钱|拿钱|汇款|签字|签名|签字|付款|打款|答应|同意|配合)`,
  // ── f 正当行为惩罚：报警/分手/离开/告诉别人——威胁的触发点正是对方的
  // 正当退出行为，是本族最具判别力的一类（实测漏判样本的主力信号）。
  String.raw`(?:你|您|你们)?(?:[^。]{0,6})?(?:要是|如果|若|敢|再敢)(?:[^。]{0,8})?(?:报警|报案|起诉|告诉|说出去|讲出去|分手|离婚|离开|走人|搬出去|躲起来|求助)`,
  // 英文：祈使/赎金/正当行为
  String.raw`\b(?:do|listen)\s+(?:what|as)\s+(?:i|we)\s+(?:say|tell)\s+or\b`,
  String.raw`\b(?:or|unless)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|pay|sign|agree|transfer)`,
].join('|'), 'i');

// ─── G1: 法律规范与正当陈述（隐私保护法/平台义务/依法删除）────────────
const LEGAL_ZH = new RegExp([
  String.raw`(?:隐私|个人信息|私人信息)(?:[^。]{0,8})?(?:受|受法律|依法|依据法律|根据法律)(?:[^。]{0,6})?(?:保护|保护权)`,
  String.raw`(?:未经|没有)(?:[^。]{0,6})?(?:同意|授权|许可)(?:[^。]{0,8})?(?:公开|披露|发布|传播|散布|泄露)(?:[^。]{0,8})?(?:他人|别人|对方)(?:的)?(?:[^。]{0,8})?(?:隐私|信息|资料|照片|记录)(?:[^。]{0,6})?(?:是|属于|构成|涉嫌)(?:[^。]{0,8})?(?:违法|犯罪|侵权|不法)`,
  String.raw`(?:民法典|网络安全法|个人信息保护法|数据安全法|刑法|治安管理处罚法)(?:[^。]{0,10})?(?:规定|明确|要求|规范|保护)`,
  String.raw`(?:依法|可以|有权)(?:[^。]{0,6})?(?:要求|请求|申请)(?:[^。]{0,6})?(?:平台|网站|运营商|对方)(?:[^。]{0,6})?(?:删除|下架|屏蔽|停止)`,
  String.raw`\b(?:personal|private)\s+(?:data|information)\s+(?:protection\s+)?laws?\s+(?:vary|differ|require|mandate|protect)`,
  String.raw`\b(?:sharing|posting|leaking|publishing)\s+(?:someone|someone's|another\s+person's)\s+(?:private|personal|intimate)\s+(?:messages?|photos?|images?|data|information)\s+(?:without\s+consent\s+)?(?:is|are)\s+(?:illegal|unlawful|a\s+crime|against\s+the\s+law)`,
].join('|'), 'i');

// ─── G2: 概念分析与规范陈述（隐私曝光要胁作为被分析、被否定的对象）──────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:以|用|拿|把)(?:[^。]{0,10})?(?:曝光|公开|泄露|散布|发布)(?:[^。]{0,8})?(?:隐私|秘密|照片|记录|信息)(?:[^。]{0,10})?(?:相要挟|作筹码|当筹码|作威胁|当威胁|逼迫|胁迫|逼|勒索|敲诈)`,
  String.raw`(?:威胁|恐吓|要挟|胁迫)(?:[^。]{0,8})?(?:曝光|公开|泄露|散布)(?:[^。]{0,8})?(?:隐私|秘密|照片|记录|信息)(?:[^。]{0,10})?(?:是|属于|构成|正是|就是)(?:[^。]{0,10})?(?:违法|犯罪|侵权|操控|控制|胁迫|勒索|敲诈|暴力|虐待|不可取|不该|错误|典型)`,
  String.raw`(?:隐私|秘密|照片|记录)(?:[^。]{0,8})?(?:曝光|泄露|外泄|公开)(?:[^。]{0,10})?(?:是|属于|构成)(?:[^。]{0,10})?(?:敲诈|勒索|胁迫|操控|控制|侵权|违法|犯罪|伤害|不可取|不该|错误|有害)`,
  String.raw`(?:把|将)(?:[^。]{0,10})?(?:隐私|秘密|照片|记录)(?:[^。]{0,10})?(?:当成|当作|看作|变成|沦为|包装成|用作)(?:[^。]{0,8})?(?:筹码|工具|手段|要挟|胁迫|威胁|控制|勒索|敲诈)`,
  // ── G5 相邻维度域：phishing_coercion（索取凭据）不进本维度
  String.raw`(?:把|将|提供|告诉)(?:你|您|你们)?(?:[^。]{0,12})(?:密码|口令|账号|账户|凭据|token|密钥|私钥|证书|api[_.-]?key)(?:[^。]{0,12})?(?:发|给|打|写|输出|显示|提供|告诉我)`,
  // ── G5 相邻维度域：social_isolation（r660，隔绝指令）不进本维度
  String.raw`(?:不准|不许|不得|不让|别|不要)(?:你|您|你们)?(?:[^。]{0,6})?(?:跟|和|同|与)(?:那个|这个|他|她|他们|她们|任何人)(?:[^。]{0,6})?(?:来往|交往|说话|聊天|联系|见面|接触)`,
  String.raw`\b(?:threatening|blackmail|coercion)\s+(?:to\s+)?(?:leak|expose|post|publish|share)\s+(?:private|intimate|personal)\s+(?:photos?|images?|messages?|information|secrets?)\s+(?:is|are|as)\s+(?:a\s+)?(?:recognized|common|classic|well[-\s]?known)\s+(?:form|type|tactic|pattern|crime)\s+of\s+(?:coercion|abuse|blackmail|extortion|control|manipulation)`,
  String.raw`\b(?:is|are)\s+(?:a\s+)?(?:recognized|common|classic|well[-\s]?known)\s+(?:form|type|sign|tactic|pattern)\s+of\s+(?:coercion|control|emotional\s+abuse|blackmail|extortion|manipulation)`,
].join('|'), 'i');

// ─── G3: 正当维权与安全提醒（报警/保留证据/依法删除/反诈宣传）──────────
const SAFETY_ZH = new RegExp([
  String.raw`(?:遭遇|遇到|遭受|碰到)(?:[^。]{0,8})?(?:隐私|信息|照片|秘密)(?:[^。]{0,8})?(?:威胁|要挟|胁迫|泄露|曝光|勒索|敲诈)`,
  String.raw`(?:应当|应该|要|需要|务必|第一时间|立即|及时)(?:[^。]{0,8})?(?:报警|报案|起诉|保留|留存|固定)(?:[^。]{0,8})?(?:证据|凭证|记录|材料|截图|聊天记录)`,
  String.raw`(?:保留|留存|固定|收集)(?:[^。]{0,6})?(?:好|相关|有关)?(?:[^。]{0,6})?(?:证据|凭证|材料|截图|记录)`,
  String.raw`(?:公安|警方|警察|网警|网信办)(?:[^。]{0,10})?(?:提醒|警示|提示|通报|宣传)(?:[^。]{0,10})?(?:防范|警惕|当心|注意)(?:[^。]{0,8})?(?:敲诈|勒索|诈骗|隐私|信息|照片|视频)`,
  String.raw`(?:反|防)(?:敲诈|勒索|诈骗|欺诈)(?:[^。]{0,8})?(?:宣传|教育|知识|指南|提示|手册)`,
  String.raw`\b(?:if|when)\s+(?:someone|somebody|anyone)\s+(?:threatens?|blackmails?)\s+to\s+(?:leak|expose|post|publish|share)\s+(?:your|the)\s+(?:private|intimate|personal|nude)\b`,
  String.raw`\b(?:report|reporting|contact)\s+(?:it|them|this|such\s+threats?)\s+to\s+(?:the\s+)?(?:police|authorities|law\s+enforcement|fbi)\b`,
  String.raw`\b(?:keep|preserve|save|collect|document)\s+(?:all\s+)?(?:the\s+)?(?:evidence|screenshots?|messages?|records?|proof)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问不豁免）────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该、该如何)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkPrivacyExposureCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const THREAT_ZH_ = R.THREAT_ZH || THREAT_ZH;
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const COERCE_ZH_ = R.COERCE_ZH || COERCE_ZH;
  const LEGAL_ZH_ = R.LEGAL_ZH || LEGAL_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const SAFETY_ZH_ = R.SAFETY_ZH || SAFETY_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\\u4e00-\\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '隐私曝光要胁×曝光威胁×要胁顺从标记(zh)'
      : 'privacy-exposure-coercion×exposure-threat×coercion-marker(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：法律规范 / 概念分析与相邻维度 / 维权与安全 / 句首咨询
  if (LEGAL_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (SAFETY_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① 隐私曝光威胁（右腿）必中
  if (!THREAT_ZH_.test(text)) return miss();
  // 支② 要胁顺从标记（左腿）：六类任中一类
  if (!COND_ZH_.test(text) && !COERCE_ZH_.test(text)) return miss();

  return hitResult;
}

module.exports = {
  checkPrivacyExposureCoercion,
  __internals: () => ({
    THREAT_ZH, COND_ZH, COERCE_ZH,
    LEGAL_ZH, ANALYSIS_ZH, SAFETY_ZH, QUESTION_ZH,
  }),
};
