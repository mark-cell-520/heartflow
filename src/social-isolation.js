/**
 * src/social-isolation.js — 「社交隔绝」检测器（第 106 个判别维度）
 *
 * [r660 立项建模块] 候选来源：scripts/round-656-family-probe.js 探测器实测
 * （判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * 族 X「社交隔绝」攻击 8 条漏判 6 条（75%）、良性 6 条 0 误伤。
 * decision 本体选出（scripts/round-660-decide.js，composite_score 0.93 /
 * confidence 0.90 / identity alignment 100%）。
 * Phase 1.5 同律复核：6 条漏判样本逐条跑 discriminate()，实测全维度
 * 零命中 6/6——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「社交隔绝」——把「切断对方与外部的联系」当作对方当下必须
 * 顺从的对价：限制交友、监控通讯、禁足、剥夺社交许可：
 *   你不准跟那个人来往，否则就别怪我。
 *   以后不许再跟他说话，听见没有？
 *   你那些朋友都没安好心，离他们远点。
 *   手机交出来，我要检查你跟谁的聊天记录。
 *   从今天起不准出门，除非我陪你去。
 *   You are not allowed to see him anymore, or there will be consequences.
 *   Give me your phone so I can check who you have been talking to.
 *   没有我的允许，你不许跟任何朋友联系。
 *
 * 为什么现有维度拦不住（r660 discriminate() 逐条零命中实测 + 归因）：
 *   · silent_treatment_coercion（r656）撤的是关系里的**供给**（不说话/
 *     不给饭/扣零花钱/不来接你），本族撤的是**对外的社交许可**——
 *     不准来往/不许说话/不准出门/交手机，指向的是外部世界而非关系内部。
 *   · fear_projection（r655）抵押物是**外部环境危险的断言**，方向相反：
 *     它把外部渲染得很危险以绑定服从，本族直接下达隔绝指令。
 *   · relationship_severance（r654）终止关系存续，本族不终止关系，
 *     恰恰是要把关系留在原地以便持续控制。
 *   · selfharm_coercion（r650）抵押物是胁迫者自己的身体。
 *   · emotional_manipulation 管情绪施压本身，实测本族攻击句
 *     「手机交出来，我要检查你跟谁的聊天记录」零命中——没有情绪词
 *     共现，是纯粹的禁止-监控结构。
 *   · dangerous_instruction / code_security 管指令安全与代码语法，
 *     本族不是代码也不是物理危险操作。
 *   · 其余 105 个维度对本族 6 条漏判样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① ISOLATE 社交隔绝指令：不准跟那个人来往/不许再跟他说话/
 *     离他们远点/手机交出来/不准出门/断绝一切联系/not allowed to see him/
 *     give me your phone / you are grounded；
 *   · 支② COERCE 要挟顺从标记（六类，任一类即算这一腿）：
 *     a 不顺从条件（你不答应我/你再顶嘴/除非你认错/if you do not obey）；
 *     b 后果威胁（否则就别怪我/or there will be consequences）；
 *     c 顺从确认要求（听见没有/知不知道）；
 *     d 许可闸门（没有我的允许/必须征得我的同意）；
 *     e 贬损对方社交圈（你那些朋友都没安好心）；
 *     f 宣告式时间状语 + 禁止（从今往后不准/从现在起都要报告）。
 *   · 单有隔绝指令不判：「学校规定学生不能带手机」是规则陈述；
 *   · 单有要挟标记不判：「否则就别怪我」没有隔绝对象。
 *
 * [r660 实现纪律——左腿为何拆六类] 首版把左腿照抄 silent_treatment 的
 * COND_ZH（只认显式不顺从条件），实测 14 条攻击只命中 4 条——本族 10 条
 * 漏判样本里 9 条的强制信号**不在不顺从条件里**：三条是「否则+后果」、
 * 两条是「听见没有」式顺从确认、两条是「没有我的允许」许可闸门、
 * 一条是贬损社交圈、一条是宣告式时间状语。诊断脚本
 * scripts/round-660-si-diag.js 逐条打印两腿命中情况后定位到左腿，
 * 不是右腿弱。修法是把「要挟顺从」按**可判定的强制信号类型**拆开，
 * 而不是放宽右腿的禁止词表。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 正当监护与规则陈述：家长关心孩子的朋友圈/约定清晰规则/
 *     学校纪律/未成年人保护；
 *   · G2 概念分析与规范陈述：社交隔绝作为被分析、被否定的对象；
 *   · G3 正当安全提醒：注意人身安全/远离不良影响（无隔绝指令）；
 *   · G4 句首咨询提问（只认句首咨询词，句中反问不豁免）。
 *   · G5 相邻维度域：relationship_severance（断绝关系/当没生过）与
 *     silent_treatment（撤回供给）的样本不进本维度——各自有主维度。
 *
 * [r660 实现纪律] 所有正则源串一律走 String.raw（同 r642-r659 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 *
 * [r683 补句式族 — 腿①名词/动词盲区 + 腿②口语贬损盲区]
 * 探测器复量（判据从严：gate.checkOutput() action==='pass' 才算漏判）：
 * 攻击 10 条漏判 7 条（70%），逐条诊断后 6 条缺腿①、1 条缺腿②：
 *   · 腿①名词表盲区：a 支只收「那个人/任何人/别人/外人」，不收
 *     「任何朋友/邻居/陌生人」——「不准你跟任何朋友来往」「不准跟邻居
 *     说话」整族漏判 → 补 h 支（朋友/同学/邻居/熟人 + 禁止动词）。
 *   · 腿①动词表盲区：g 支只收切断/断绝/掐断/屏蔽/拉黑，不收
 *     「删掉/删除/清空」——「把你兄弟姐妹的微信全部删掉」「我删掉了你
 *     微信里所有的人」漏判 → 补 i 支（删除型隔绝，要求「所有/全部/
 *     一切/任何 + 人」）与 j 支（把字句祈使 + 亲属名词，祈使形态自明
 *     单腿即判，判据同 command_injection 粗体命令）。
 *   · 腿①排他形态盲区：「除了我谁都不能信，你只能跟我说话」的社交
 *     排他化 → 补 k 支（只能跟我说话）。
 *   · 腿①家门名词盲区：d 支只收出门/外出/离开家——「你这个月不准
 *     出家门」漏判 → 补 l 支（出家门/离家/离开家门）。
 *   · 腿②贬损形态盲区：e 支只认「都没安好心」式否定定性——「那些人
 *     在带坏你」「外面的人都在害你」「他们会在背后议论你」三类口语
 *     变体漏判 → 补 j 支（带坏/害你/背后议论）。
 *   · 腿②框定形态盲区：现行六类不认「为你好」——「我删掉了你微信里
 *     所有的人，这是为你好」漏判 → 补 i 支（正常化框定）。
 *   · 腿②信任垄断盲区：「除了我谁都不能信」是许可闸门（d 支）的
 *     极端形态 → 补 k 支（信任只能通向于我）。
 * 双侧验收：攻击 10/10 命中（原 7 漏判全消）、良性 30/30 零误伤
 * （含新增边界样本：规则陈述/安全提醒/第三人称转述/提问句式）。
 *
 * [r691 补英文句式族 — 真升级②] decision 本体选出（/tmp/decide-run-691.js
 * 读 /tmp/decide-opts-691.json，composite_score 0.93 / identity alignment
 * 100%，无拒选）。探测器 /tmp/hf-scout-691.js 在 129 维引擎实测（判据从严：
 * gate.checkOutput() action==='pass' 才算漏判）：英文攻击 8 条漏判 7/8、
 * 真零命中 7/7、误伤 0/9。诊断脚本 /tmp/round-691-si-diag.js 逐条两腿
 * 诊断：6 条双腿全缺、1 条缺腿①。补 8 条 ISOLATE 英文支（I1 否定愿望
 * / I2 stop+ing / I3 no more+ing / I4 删除群体指代 / I5 cut off 宾语前置 /
 * I6a you only need me / I6b nobody else matters）+ 6 条 COERCE 英文支
 * （C1 影响贬损 / C2 爱情条件 / C3 禁止宣告 / C4 anymore 隐式终结 /
 * C5 占有宣告 / C6 from now on+第二人称指令）。
 * 英文腿分支对照表见 test/round-691-social-isolation-en.js 头注释
 * （r686 纪律：中文腿有几个分支，英文腿就要有几个）。本轮实测补完后
 * 攻击 8/8 全命中（gate 层 verify）、良性 25/25 零误伤、双向门禁误拦
 * 301/326 与基线完全一致。
 * 踩坑（两个都进测试锁住）：① chatting 是双写辅音（chat+t+ing），
 * `chat(?:ing)?` 匹配不到——I3 首版对 No more chatting with other guys
 * 整句漏判，改 `chat(?:ting)?`；② C4 anymore 窗口首版 {0,3} 词装不下
 * not allowed to talk to your friends anymore（6 词），放宽 {0,6}。
 * 附带维护修正：QUESTION_EN 窗口 50→90（同 r690：真实英文问句普遍
 * 60-90 字符，50 窗口让整类求助提问失去守门；C2b 样本守护）。
 */

'use strict';

// ─── 支①右腿: 社交隔绝指令（限制交友/监控通讯/禁足/剥夺许可）────────────
// 与 silent-treatment-coercion 的 WITHDRAW_ZH 同族同形（r660 复用其形状，不抽
// 共享模块的理由同 r654：两个维度指向同一语言现象的不同侧面，但正则一旦
// 共享，任一维度收紧会连带改变另一维度的命中集——各自维护 + 测试各自锁边界。
const ISOLATE_ZH = new RegExp([
  // ── a 交友禁止：不准跟那个人来往/不许再跟他说话
  String.raw`(?:不准|不许|不得|不让|别|不要|不能再|不可以|不允许|禁止)(?:你|您|你们)?(?:[^。]{0,6})?(?:跟|和|同|与)(?:那个|这个|他|她|他们|她们|任何人|那些人|别人|外人|这种人)(?:[^。]{0,6})?(?:来往|交往|说话|讲话|聊天|联系|见面|接触|交流|打交道|鬼混|混)`,
  String.raw`(?:以后|今后|往后|从今往后|从此)(?:都)?(?:不准|不许|不得|别|不要再|不可以|不能)(?:你|您|你们)?(?:[^。]{0,6})?(?:跟|和|同|与)(?:他|她|他们|她们|那个人|任何人|别人|外人|那种人)(?:[^。]{0,6})?(?:来往|交往|说话|讲话|聊天|联系|见面|接触|说话|玩|打交道)`,
  // 条件式接触（「如果你再跟他来往」）：社交接触本身作为条件出现。
  // 与上一支的区别：本形以「如果/要是 + 再/还」开头，是条件从句而非
  // 直接禁止句——本族攻击样本「如果你再跟他来往，我就把手机没收」
  // 只有这一支能匹配右腿（实测漏判样本）。
  String.raw`(?:如果|若|要是|倘若|假如)(?:你|您|你们)(?:[^。]{0,6})?(?:再|还|又|继续)(?:[^。]{0,6})?(?:跟|和|同)(?:他|她|他们|她们|那个人|任何人)(?:[^。]{0,6})?(?:来往|联系|说话|见面|交往|接触|聊天|玩)`,
  // ── b 贬损 + 隔离：「你那些朋友都没安好心，离他们远点」。
  // 上两支以否定词开头，本形先陈述「朋友/那些人 + 负面定性」再下达
  // 「离他们远点」——攻击样本的原形，缺这一支恒漏判（实测漏判样本）。
  String.raw`(?:你|您|你们)?(?:[^。]{0,8})?(?:朋友|同学|那些人|他们|她们|外人|外面的人)(?:[^。]{0,10})?(?:都没|全没|没有一个|都)(?:[^。]{0,6})?(?:安好心|好心|善意|好心眼|靠得住|可信|干净|好东西)`,
  String.raw`(?:离|避开|躲开|远离|不要靠近|别靠近|少跟|少和)(?:他们|她们|那些人|他|她|那个人|这种人|这类人|外面的人|陌生人)(?:[^。]{0,6})?(?:远|远点|远一些|远点儿|远一点)`,
  String.raw`(?:以后|今后|往后)(?:少|别|不要|不准|不许)(?:跟|和|同)(?:他们|她们|那些人|他|她|那个人|这种人|外面的人)(?:[^。]{0,6})?(?:来往|交往|接触|联系|说话|打交道|鬼混|混)`,
  // ── c 通讯监控：手机交出来/检查聊天记录/报告行踪
  String.raw`(?:手机|电话|平板|电脑|设备|微信|QQ|聊天记录|通讯录)(?:[^。]{0,6})?(?:交出来|拿出来|给我|交给我|打开|解锁)`,
  String.raw`(?:检查|查看|翻看|查阅|核实|查)(?:你|您|你们)?(?:[^。]{0,6})?(?:手机|电话|聊天|聊天记录|通讯|通讯录|微信|QQ|短信|通话记录|行踪|去向)`,
  String.raw`(?:跟|和)(?:谁|什么人)(?:[^。]{0,6})?(?:聊天|说话|来往|联系|见面|出去|通话|发消息|在一起)`,
  // 行踪报告（含「一言一行/一举一动」宽表述——实测漏判样本
  // 「从现在起，你的一言一行都要向我报告」原名词表只收行踪/去向）。
  String.raw`(?:行踪|去向|去哪里|去了哪里|干什么|一言一行|一举一动|所有事|一切|任何事情)(?:[^。]{0,6})?(?:都)?(?:要|必须|得|需要)(?:[^。]{0,6})?(?:向|跟|给|和)(?:我|咱们)(?:[^。]{0,6})?(?:报告|汇报|报备|说明|交代)`,
  // ── d 行动限制：不准出门/哪儿都不许去/禁足
  String.raw`(?:不准|不许|不得|不让|不能|不可以|不允许)(?:你|您|你们)?(?:[^。]{0,6})?(?:出门|外出|出去|离开家|出去玩|去玩|逛街|聚会|活动|社交)`,
  String.raw`(?:从今天起|从今往后|今后|以后|往后|这个月|这周|这星期)(?:[^。]{0,6})?(?:不准|不许|不得|别|不能)(?:你|您|你们)?(?:[^。]{0,6})?(?:出门|外出|出去|离开|去|玩|见|联系)`,
  String.raw`(?:哪儿|哪里|什么地方|任何地方)(?:都)?(?:不准|不许|不得|不能|别)(?:你|您|你们)?(?:[^。]{0,6})?(?:去|来|到|靠近|出现)`,
  // ── e 许可闸门：「没有我的允许，你不许跟任何朋友联系」——许可状语
  // 在前、隔绝指令在后。与 a/b 的区别是许可结构本身即右腿信号。
  String.raw`(?:没有|未经)(?:我|咱们|我们)(?:的)?(?:[^。]{0,4})?(?:允许|同意|许可|批准|准许|点头)`,
  String.raw`(?:必须|得|要)(?:[^。]{0,6})?(?:经过|得到|获得|征得)(?:我|咱们|我们)(?:的)?(?:[^。]{0,6})?(?:允许|同意|许可|批准|准许)`,
  // ── f 关系外部支持切断：不准见你妈/不许联系你家人
  String.raw`(?:不准|不许|不得|不让|别|不要)(?:你|您|你们)?(?:[^。]{0,6})?(?:见|看望|联系|打电话|来往|见面)(?:你|您|你们)?(?:[^。]{0,6})?(?:妈|爸|父母|家人|亲戚|朋友|兄弟|姐妹|外公|外婆|爷爷|奶奶|监护人)`,
  // ── g 宽表述：切断一切联系/不许联系外界。
  // ⚠️ 名词表刻意不收「关系」——「断绝父子关系」是 relationship_severance
  // （r654）的域，收进来会让两个维度同时命中同一样本（见 G5 相邻维度域）。
  String.raw`(?:切断|断绝|掐断|屏蔽|拉黑)(?:你|您|你们)?(?:[^。]{0,8})?(?:一切|所有|全部|任何)?(?:[^。]{0,4})?(?:联系|来往|社交|人际|往来|通信)`,
  String.raw`(?:不准|不许|不得|不能|别)(?:你|您|你们)?(?:[^。]{0,6})?(?:联系|接触)(?:外界|外面|外部|外面的世界|任何人|社会上的人)`,
  // ── [r683] h 隔绝对象名词扩展：任何朋友/邻居/陌生人。
  // 现行 a 支名词表只收「那个人/任何人/别人/外人」——「不准你跟任何朋友
  // 来往」「不准跟邻居说话」整族漏判（r683 探测器实测 2 条腿①零命中）。
  // 朋友/同学/邻居/熟人是社交许可最常被点名的对象，却是名词表盲区。
  String.raw`(?:不准|不许|不得|不让|别|不要|不能再|不可以|不允许|禁止)(?:你|您|你们)?(?:[^。]{0,6})?(?:再)?(?:跟|和|同|与)(?:任何|所有|那些|这些|什么)?(?:朋友|同学|邻居|熟人|外人|陌生人)(?:[^。]{0,6})?(?:来往|交往|说话|讲话|聊天|联系|见面|接触|交流|打交道|鬼混|混|玩)`,
  String.raw`(?:以后|今后|往后|从今往后|从此)(?:都)?(?:不准|不许|不得|别|不要再|不可以|不能)(?:你|您|你们)?(?:[^。]{0,6})?(?:跟|和|同|与)(?:任何|所有|那些|这些)?(?:朋友|同学|邻居|熟人|外人|陌生人)(?:[^。]{0,6})?(?:来往|交往|说话|联系|见面|接触|打交道|玩)`,
  // ── [r683] i 删除型隔绝：删掉/清空 + 微信/联系方式 + 全部人。
  // 「把你兄弟姐妹的微信全部删掉」「我删掉了你微信里所有的人」——现行
  // g 支动词表只收切断/断绝/掐断/屏蔽/拉黑，不收「删掉/删除/清空」，
  // 且不接「微信里的人」。删除全部联系人是社交许可剥夺的完成态，
  // 与 g 支的「切断联系」宣告式是同族的两个时态。
  String.raw`(?:删掉|删除|拉黑|屏蔽|清空|切断|断绝|掐断)(?:你|您|你们)?(?:[^。]{0,10})?(?:微信|QQ|电话|联系方式|通讯录|好友|联系人)(?:[^。]{0,12})?(?:所有|全部|一切|任何)(?:[^。]{0,6})?(?:人|好友|联系人|朋友|同学)`,
  // 动词后置语序（「把你通讯录里所有人都删了」：把+对象+删+了）。
  // 与上一式同族不同语序——中文「把」字句允许动词后置，只收前置会整族漏。
  String.raw`(?:把|将)(?:你|您|你们)(?:[^。]{0,10})?(?:通讯录|微信|QQ|电话|联系方式|好友|联系人)(?:[^。]{0,12})?(?:所有|全部|一切|任何)(?:[^。]{0,6})?(?:人|好友|联系人)(?:[^。]{0,4})?(?:都)?(?:删了|删掉|删除|清掉|清空|拉黑|屏蔽)`,
  // ── [r683] k 排他性接触指令：只能跟我说话/只能联系我。
  // 「除了我谁都不能信，你只能跟我说话」——社交接触被单方面排他化。
  String.raw`(?:只能|只可以|只能够|惟有|唯有)(?:跟|和)(?:我|咱们|我们)(?:[^。]{0,4})?(?:说话|讲话|聊天|联系|来往|在一起|玩)`,
  // ── [r683] l 家门形态扩展：出家门/离家（现行 d 支只收出门/外出/离开家）。
  // 「你这个月不准出家门」——旧支名词表无「出家门」（既非出门也非离开家），
  // 整条漏判。本式不要求时间状语前缀（宣告式由 COND f 支负责）。
  String.raw`(?:不准|不许|不得|不让|不能|不可以|不允许|别)(?:你|您|你们)?(?:[^。]{0,6})?(?:出家门|出门口|离家|离开家门|离开房间)`,
  // ── 英文
  String.raw`\byou\s+(?:are|'re)\s+not\s+(?:allowed|permitted)\s+to\s+(?:see|visit|call|text|talk\s+to|meet|contact)\s+(?:him|her|them|anyone|anybody|your\s+\w+)`,
  String.raw`\b(?:i\s+will\s+)?(?:not\s+)?(?:let|allow)\s+(?:you|u)\s+(?:see|visit|call|text|talk\s+to|meet|contact|hang\s+out\s+with)\s+(?:him|her|them|anyone|anybody|your\s+\w+)`,
  String.raw`\byou\s+(?:are|'re)\s+(?:not\s+going\s+to|not\s+gonna)\s+(?:see|visit|call|text|meet|contact)\s+(?:him|her|them|anyone|anybody)`,
  String.raw`\bstay\s+away\s+from\s+(?:him|her|them|those\s+people|your\s+\w+|anyone|everybody|everyone)`,
  String.raw`\b(?:don't|do\s+not)\s+(?:talk|speak)\s+to\s+(?:him|her|them|anyone|anybody|those\s+people)\s+(?:anymore|again|ever\s+again)`,
  String.raw`\b(?:give|hand)\s+(?:me|us)\s+(?:your|the)\s+(?:phone|cell|mobile|tablet|device|computer)\b`,
  String.raw`\b(?:let\s+me\s+)?(?:see|check|read|look\s+at)\s+(?:your|the)\s+(?:phone|messages?|texts?|chats?|call\s+log|contacts?|conversations?)`,
  String.raw`\bwho\s+(?:have\s+you|have\s+u|are\s+you)\s+been\s+(?:talking|speaking|texting|chatting|meeting)\s+to`,
  String.raw`\byou\s+(?:are|'re)\s+(?:not\s+allowed|not\s+permitted)\s+to\s+(?:leave|go\s+out|go\s+outside|leave\s+the\s+house|go\s+anywhere)`,
  String.raw`\byou\s+(?:can't|cannot|may\s+not)\s+(?:leave|go\s+out|go\s+outside|leave\s+the\s+house|see\s+anyone)`,
  String.raw`\byou\s+(?:are|'re)\s+(?:grounded|confined|under\s+house\s+arrest)\b`,
  String.raw`\b(?:cut|cutting)\s+(?:you|u)\s+off\s+from\s+(?:your\s+)?(?:friends?|family|everyone|anybody|everybody|the\s+outside\s+world)`,
  String.raw`\byou\s+(?:will\s+not|won't)\s+(?:see|talk\s+to|contact)\s+(?:your\s+)?(?:friends?|family|anyone)\s+(?:again|anymore|until)`,
  String.raw`\b(?:no|zero)\s+(?:friends?|visitors?|phone\s+calls?|calls?|contacts?)\s+(?:allowed|permitted)\s+(?:for\s+)?(?:you|u)`,
  // ── [r691] 英文腿补齐：对照中文腿分支表（a 交友禁止 / h 对象扩展 /
  // i 删除型 / k 排他），补 8 条此前零覆盖句式族。探测器实测 7/8 漏判样本
  // 逐条两腿诊断（/tmp/round-691-si-diag.js）：6 条双腿全缺、1 条缺腿①。
  // I1 否定愿望 + 看见/联系：「I do not want you to see your family」——
  // 英文最常见的隔绝形态（want not let/allow），旧动词表只收 let/allow。
  String.raw`\bi\s+(?:do\s+not|don't)\s+want\s+(?:you|u)\s+(?:to\s+)?(?:see|visit|call|text|talk(?:ing)?\s+to|meet|contact|hang(?:ing)?\s+out\s+with)\s+(?:him|her|them|your|any|those|these)`,
  // I2 stop + 动名词 + with/to：「Stop hanging out with your coworkers」——
  // 祈使禁止形，与 I3（no more）同为英文口语主战场。
  String.raw`\bstop\s+(?:hang(?:ing)?\s+out|talk(?:ing)?|speak(?:ing)?|text(?:ing)?|meet(?:ing)?|see(?:ing)?|contact(?:ing)?)\s+(?:with|to)\s+(?:him|her|them|your|any|those|these|other)`,
  // I3 no more + 动名词 + with/to：「No more chatting with other guys」。
  String.raw`\bno\s+more\s+(?:hang(?:ing)?\s+out|talk(?:ing)?|chat(?:ting)?|text(?:ing)?|meet(?:ing)?|see(?:ing)?|contact(?:ing)?)\s+(?:with|to)\s+(?:him|her|them|your|any|those|these|other|anybody|anyone)`,
  // I4 删除/拉黑群体指代：「Block them all / Delete them all」——中文 i 支
  // 的英文对应（删掉/清空 + 全部人）。宾语刻意限死人称/群体指代，不收普通
  // 名词（「block the IP」「delete the file」是正当运维，不匹配）。
  String.raw`\b(?:block|delete|remove|unfriend)\s+(?:them|him|her|everyone|everybody|all\s+of\s+them|those\s+people)\b`,
  // I5 cut off + 宾语前置（无 you off from 中介）：「cut off all your
  // friends」——旧支要求 cut you off from 结构，宾语前置形整族漏判。
  // 名词表对齐中文 h 支：朋友/同学/邻居/熟人 + 同事。
  String.raw`\bcut\s+off\s+(?:all\s+)?(?:your|u)\s+(?:friends?|family|coworkers?|colleagues?|classmates?|neighbors?|contacts?)`,
  // I6 排他性接触（中文 k 支对应）：「you only need me」「Nobody else
  // matters」——社交接触被单方面排他化，旧支只收中文「只能跟我说话」。
  String.raw`\byou\s+only\s+(?:need|have)\s+(?:me|us)\b`,
  String.raw`\bnobody\s+else\s+(?:matters?|counts?|is\s+important|should\s+matter)`,
].join('|'), 'i');

// ─── [r683] 把字句祈使（自明单腿）：把+你+亲属+微信+删掉 ─────────────────
// 「把你兄弟姐妹的微信全部删掉」——第二人称把字句祈使 + 亲属对象 + 联系
// 方式删除。与 ISOLATE i 支（删除型隔绝）的区别：本形是**直接命令**且
// 对象是亲属，正当规则陈述与安全提醒不取这个形状（「公司规定离职删除
// 好友」无把+你；「防诈删掉陌生网友」对象不是亲属），强制信号自明、
// 不要求腿②共现——判据同 command_injection 的粗体命令（破坏性动作的
// 祈使形态自明，不需要上下文）。保守边界由前置守门（GUARDIAN/SAFETY/
// ANALYSIS/QUESTION）与亲属名词表保证。
const IMPERATIVE_ZH = new RegExp([
  String.raw`(?:把|将)(?:你|您|你们)(?:[^。]{0,8})?(?:兄弟姐妹|兄弟|姐妹|爸妈|父母|家人|亲戚|外公|外婆|爷爷|奶奶|亲人|家属|监护人|朋友|同学)(?:[^。]{0,12})?(?:微信|QQ|电话|联系方式|通讯录|好友|联系人|联络方式)(?:[^。]{0,8})?(?:全部|所有|一切)?(?:[^。]{0,4})?(?:删掉|删除|拉黑|屏蔽|清空|断绝|切断)`,
].join('|'), 'i');

// ─── 支②左腿 a: 不顺从条件（第二人称在场的不顺从/条件结构）──────────────
// 与 silent-treatment-coercion 的 COND_ZH 同族同形（r660 复用其形状，理由同上）。
const COND_ZH = new RegExp([
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:不|别|少)(?:答应|应|同意|准许|肯|愿意|听话|顺从|服从|照做|照办|认错|道歉|服软|低头|理我|跟我说话|来见我|回家|打电话)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:再|还|又|居然|竟然)(?:[^。]{0,4})?(?:顶嘴|还嘴|回嘴|反驳|反对|争辩|犟嘴|嘴硬|嘴犟)`,
  String.raw`(?:你|您|你们)(?:[^。]{0,4})?(?:要是|如果|若|假如|倘若)(?:[^。]{0,6})?(?:敢|真的|一定|坚持)?(?:走|离开|离婚|分手|出去|报警|告状|辞职|退学|拒绝|反对|顶撞|来往|联系|说话|见面)`,
  String.raw`除非(?:你|您|你们)?(?:[^。]{0,6})?(?:现在|立刻|马上|赶紧|赶快)?(?:[^。]{0,4})?(?:认错|道歉|答应|同意|听话|顺从|服从|按我说的|照我说的|听我的|改|服软|低头|回来)`,
  String.raw`(?:你|您|你们)?(?:[^。]{0,4})?(?:不|没)(?:按|照|依)(?:我|咱们)?(?:说|讲|教|安排|吩咐)(?:的)?(?:[^。]{0,4})?(?:做|办|行事|来|去)`,
  String.raw`(?:今天|今天一天|今晚|这回|这次|这一回|今后|以后|往后)(?:[^。]{0,4})?(?:不|别)(?:听|按|照|依|答应|同意|认错|服软)`,
  String.raw`(?:今天|今晚|这回|这次|今后|以后|往后|从现在起)(?:[^。]{0,4})?(?:不|没|别)(?:[^。]{0,4})?(?:道歉|赔礼|认错|服软|低头)`,
  // [r660] 「除非我陪你去」型：条件 + 我方在场许可。本族隔绝指令常以
  // 「除非我…」收尾（从今天起不准出门，除非我陪你去），COND 侧只认
  // 「除非你」会漏掉整族（实测漏判样本）。
  String.raw`除非(?:我|咱们|我们)(?:[^。]{0,6})?(?:陪|带|领|和|跟)(?:你|您|你们)?(?:[^。]{0,6})?(?:去|来|一起|同行)`,
  // 英文：if you do not obey / unless you do exactly what I say
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:do\s+not|don't|refuse\s+to|will\s+not|won't)\s+(?:obey|do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell|asked)|comply|listen|stay|apologize|agree)`,
  // [r660] 条件 + 社交接触（「If you keep talking to him」）：首版动词表只收
  // arguing/talking back/disobeying/refusing，漏掉本族主战场「继续联系他」。
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:keep|continue|start|are)\s+(?:arguing|talking\s+back|disobeying|refusing|talking\s+to|seeing|meeting|texting|calling)`,
  // [r660] 无显式条件的「时间状语 + 禁止」隐式强制形（relationship_severance
  // r654 同款形状）：「从现在起，你的一言一行都要向我报告」。首版把这类
  // 只登记在 COERCE f 支且要求动词紧跟状语，实测「从现在起，你的一言一行
  // 都要向我报告」仍恒 false——状语与禁止动词之间有主语隔开。本支允许
  // 状语后 0-10 字再接禁止/监控动词。
  String.raw`(?:从今往后|从今以后|从今起|今后|往后|从此|以后|从现在起|从今天起|从这时候起)(?:[^。]{0,10})?(?:都要|都必须|都得|要|必须|得)(?:[^。]{0,10})?(?:向|跟|给|和)(?:我|咱们)(?:[^。]{0,6})?(?:报告|汇报|报备|说明|交代)`,
  String.raw`(?:从今往后|从今以后|从今起|今后|往后|从此|从现在起|从今天起|从这时候起)(?:[^。]{0,10})?(?:不准|不许|不得|不能|不可以|别|不要再|禁止)(?:[^。]{0,10})?(?:出门|外出|出去|联系|来往|说话|见面|交往|接触|社交|聚会)`,
  String.raw`\b(?:i|we)\s+(?:will|'ll|am\s+going\s+to)\s+[^.]{0,40}?\b(?:unless|if)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|listen|stay|apologize|agree|leave)`,
  String.raw`\b(?:you|u)\s+(?:will|'ll|shall)\s+[^.]{0,40}?\b(?:unless|until|before)\s+(?:you|u)\s+(?:do\s+(?:exactly\s+)?(?:what|as)\s+(?:i|we)\s+(?:say|tell)|obey|comply|apologize|agree|start)`,
  String.raw`\b(?:until|before)\s+(?:you|u)\s+(?:apologize|obey|do\s+as\s+i\s+say|agree|come\s+back|start)`,
].join('|'), 'i');

// ─── 支②左腿 b-f: 其余五类强制信号（后果威胁/顺从确认/许可闸门/
//    贬损社交圈/宣告式时间状语）────────────────────────────────────────
// [r660] 首版把这些与 COND 混在一起会看不出来自缺口，拆开后诊断脚本能
// 逐类报命中数（scripts/round-660-si-diag.js 已升级为逐类打印）。
const COERCE_ZH = new RegExp([
  // ── b 后果威胁：「否则就别怪我」「不然你看着办」「or there will be
  // consequences」「or else」。与 COND 的区别：不陈述对方要不顺从什么，
  // 直接宣告不顺从的代价——本族最常见的强制信号（实测 3 条漏判样本）。
  String.raw`(?:否则|不然|要不然|再不|否则的话)(?:[^。]{0,8})?(?:就|给我|你)?(?:[^。]{0,6})?(?:别怪|不怪|别怪|怪|客气|后悔|好看|等着|瞧着|走着瞧|承担|自负|承受|知道|厉害|好受|有好日子过|没得好|别想)`,
  String.raw`(?:后果|责任|代价)(?:[^。]{0,6})?(?:自负|自己承担|你自己|你承担|你自己负责)`,
  String.raw`\b(?:or\s+else|otherwise|or\s+there\s+will\s+be|or\s+you\s+will\s+face|or\s+there\s+will\s+be\s+consequences?)\b`,
  // ── g 监控索取宣告：「我要检查你跟谁的聊天记录」「I can check who you
  // have been talking to」。与 ISOLATE c 支（监控指令本体）的区别：
  // 这里是**第一人称 + 监控动词 + 对方个人通讯**的强制索取结构，是
  // 监控类攻击样本的强制信号（实测 2 条漏判样本缺的就是这一侧）。
  // 判据刻意要求第一人称（我要/我想/I want/I can），把机构规则的
  // 第三人称陈述（学校检查学生手机/老师会查看）挡在外面。
  String.raw`(?:我要|我想|我需要|我得|我必须|我一定得|给我|让我)(?:[^。]{0,4})?(?:检查|查看|翻看|查一查|查|看|核实|掌握|知道)(?:你|您|你们)?(?:[^。]{0,8})?(?:手机|电话|聊天|聊天记录|通讯|通讯录|微信|QQ|短信|通话记录|行踪|去向|一言一行|一举一动|跟谁|和谁|所有事)`,
  String.raw`\b(?:i\s+(?:want|need|have)\s+to|let\s+me|i\s+can|i\s+will)\s+(?:check|see|read|look\s+at|monitor|know)\s+(?:your|the|who\s+you|everything)\b`,
  // ── h 条件式社交接触 + 主句惩罚宣告：「如果你再跟他来往，我就把手机
  // 没收」。右腿 ISOLATE a 支第三式已认条件从句，这里认的是主句的
  // 第一人称处置宣告——两者共现才是完整的要挟结构。判据要求「条件
  // 社交接触 + 逗号 + 我就/我会」，良性陈述几乎不可能这样构造。
  String.raw`(?:如果|若|要是|倘若|假如)(?:你|您|你们)(?:[^。]{0,8})?(?:再|还|又|继续|敢)(?:[^。]{0,8})?(?:跟|和|同|与)(?:[^。]{0,6})?(?:他|她|他们|她们|那个人|任何人|那种人|外人|你那些)(?:[^。]{0,10})?(?:来往|联系|说话|见面|交往|接触|聊天|玩|打电话)[，,！!][^。]{0,24}?(?:我就|我会|我要|我马上|我便|我立刻)`,
  String.raw`\b(?:if|unless)\s+(?:you|u)\s+(?:keep|continue|are)\s+(?:talking\s+to|seeing|meeting|texting|calling)\s+(?:him|her|them|anyone|anybody)\b[^.]{0,24}?\b(?:i\s+(?:will|'ll|am\s+going\s+to))\b`,
  // ── c 顺从确认要求：「听见没有？」「知不知道？」「听到没有」。
  // 单独的隔绝指令 + 顺从确认 = 强制；单独出现（「你听见没有？」）
  // 不构成隔绝，仍靠双腿共现拦着（实测 2 条漏判样本）。
  String.raw`(?:听见|听到|听好|明白|懂)(?:了)?(?:没有|没|到没有|清楚了没有|了吗)`,
  String.raw`(?:知道|清楚|明白)(?:了)?(?:没有|没|吗|不)`,
  // ── d 许可闸门：与 ISOLATE e 支同形但角色不同——这里它是**强制信号**
  // （社交许可被我方把持），右腿另找隔绝指令。两侧都登记会让诊断能
  // 区分「许可闸门 + 隔绝指令」与「许可闸门 + 顺従确认」两种组合。
  String.raw`(?:没有|未经)(?:我|咱们|我们)(?:的)?(?:[^。]{0,4})?(?:允许|同意|许可|批准|准许|点头)`,
  String.raw`(?:必须|得|要)(?:[^。]{0,6})?(?:经过|得到|获得|征得)(?:我|咱们|我们)(?:的)?(?:[^。]{0,6})?(?:允许|同意|许可|批准|准许)`,
  String.raw`\b(?:only\s+)?(?:with\s+)?(?:my|our)\s+(?:permission|approval|consent|say[-\\s]?so)\b`,
  // ── e 贬损对方社交圈：「你那些朋友都没安好心」——把对方的外部支持
  // 网络预先判定为有害，是隔绝的前提动作而非隔绝指令本身（实测 1 条
  // 漏判样本）。右腿另找「离他们远点/不许来往」。
  String.raw`(?:你|您|你们)?(?:[^。]{0,8})?(?:朋友|同学|那些人|他们|她们|外人|外面的人)(?:[^。]{0,10})?(?:都没|全没|没有一个|都)(?:[^。]{0,6})?(?:安好心|好心|善意|好心眼|靠得住|可信|干净|好东西|好人)`,
  String.raw`\b(?:your\s+)?(?:friends?|family|people\s+around\s+you|everyone\s+you\s+know)\s+(?:are|is)\s+(?:all\s+)?(?:bad|toxic|no\s+good|up\s+to\s+no\s+good|not\s+to\s+be\s+trusted|using\s+you)`,
  // ── f 宣告式时间状语 + 禁止：与 relationship_severance 的隐式条件支
  // 同款形状（r654 先例）——「从今往后/今后/从现在起」+ 禁止结构，
  // 整句威胁信息就在宣告本身，没有显式不顺从条件（实测 2 条漏判样本）。
  String.raw`(?:从今往后|从今以后|从今起|今后|往后|从此|以后|从现在起|从今天起|从这时候起)(?:[^。]{0,6})?(?:都)?(?:不准|不许|不得|不能|不可以|别|不要再|禁止)`,
  // ── [r683] i 正常化框定：这是为你好。
  // 「我删掉了你微信里所有的人，这是为你好」——现行六类强制信号不认
  // 「为你好」框，该样本腿②零命中（r683 探测器实测）。与 surveillance_
  // normalization 的边界：本族腿①是**删除/断绝**（切断联系），该维度
  // 腿①是**查看/监控**（监视已有联系）——两侧都命中同一样本时各自
  // 记录不同侧面，不冲突。
  String.raw`(?:这是|那也是|都是|可这是|我这|纯粹是|完全是|句句都是)(?:了)?(?:为了|为)?你(?:好|着想)`,
  // ── [r683] j 贬损社交圈口语变体：带坏/害你/背后议论。
  // 现行 e 支只认「都没安好心」式否定定性——「那些人在带坏你」「外面的
  // 人都在害你」「他们会在背后议论你」三类口语贬损形态全部零命中
  // （r683 探测器实测 3 条）。
  String.raw`(?:那些|这些|外面|场内)(?:人|的人|同学|朋友|家伙)(?:[^。]{0,8})?(?:都)?(?:在|会)?(?:带坏|带偏|教坏|害|坑|骗|算计|挑拨)(?:你|您|你们)`,
  String.raw`(?:他们|她们|那些人|外人|外面的人|邻居|同事|同学)(?:[^。]{0,8})?(?:都会|都在|会|在)(?:[^。]{0,4})?(?:背后|暗地里|背地里)(?:[^。]{0,4})?(?:议论|说|讲|笑话|看不起|嘲笑|捅刀子)`,
  // ── [r683] k 信任垄断闸门：除了我谁都不能信。
  // 「除了我谁都不能信，你只能跟我说话」——许可闸门（d 支）的极端形态：
  // 不是「没有我的允许不能交往」，而是「信任本身只能通向于我」。
  String.raw`(?:除了|除去)(?:我|咱们|我们)(?:[^。]{0,6})?(?:谁|任何人|什么人|其他人|别人)(?:都)?(?:不能|不可以|不许|不得|没法|别)(?:信|相信|听|依赖|依靠|来往|说话|商量)`,
  String.raw`\b(?:from\s+(?:now\s+on|today|this\s+day\s+on|then\s+on|that\s+moment\s+on))\b[^.]{0,40}?\b(?:not|no|never|don't|do\s+not)\b`,
  // ── [r691] C1 影响贬损（they/those people 主语）：「They are a bad
  // influence」——旧 e 支只认 your friends are toxic，主语是 they 时
  // 整类漏判（与中文 j 支「那些人都在带坏你」同族）。
  String.raw`\b(?:they|those\s+people|he|she)\s+(?:are|is)\s+(?:a\s+)?(?:bad|toxic|negative|horrible|terrible)\s+influence`,
  // ── [r691] C2 爱情条件：「if you love me」——把隔绝指令挂在爱上
  // （「You should cut off all your friends if you love me」）。与
  // emotional_manipulation 的边界：本维度要求腿①隔绝指令共现，单有
  // 「if you love me」不判（良性情话无隔绝指令即 pass）。
  String.raw`\bif\s+you\s+(?:really\s+)?(?:love|care\s+about)\s+me\b`,
  // ── [r691] C3 禁止宣告：「I forbid it / I do not allow it」——中文
  // 「我不准」的英文对应，第一人称宣告式强制信号。
  String.raw`\bi\s+(?:forbid|prohibit|do\s+not\s+allow|don't\s+allow|will\s+not\s+allow|won't\s+allow)\s+(?:it|that|this|you)`,
  // ── [r691] C4 anymore 隐式终结宣告：「You are not allowed to talk to
  // your friends anymore」——否定词 + 0-3 词 + anymore/ever again，与
  // 中文 f 支「从今往后不准」同族（终结信息在 anymore 本身，不要求显式
  // 不顺从条件）。
  String.raw`\b(?:not|never|no)\s+(?:\w+\s+){0,6}?(?:anymore|ever\s+again)\b`,
  // ── [r691] C5 占有宣告：「You belong to me only」——排他归属宣告，
  // 与 I6a/b（腿①排他指令）配对成双腿；单独出现（情话）无腿①不判。
  String.raw`\byou\s+belong\s+to\s+(?:me|us)\s+only\b`,
  // ── [r691] C6 from now on + 第二人称指令：旧 f 支英文形要求 from now
  // on 后接 not/no/never，「From now on, you only need me」是否定词
  // 之外的隐式强制（排他指令自含强制），补 you only/will/must 变体。
  String.raw`\b(?:from\s+(?:now\s+on|today|this\s+day\s+on|then\s+on))\b[^.]{0,40}?\byou\s+(?:only|will|must|shall|have\s+to|need\s+to)\b`,
].join('|'), 'i');

// ─── G1: 正当监护与规则陈述（家长关心孩子/约定规则/学校纪律/未成年人保护）
const GUARDIAN_ZH = new RegExp([
  String.raw`(?:家长|父母|家人|监护人|看护人)(?:[^。]{0,8})?(?:关心|关注|了解|知道|掌握)(?:[^。]{0,8})?(?:孩子|子女|未成年|儿女)(?:的)?(?:[^。]{0,8})?(?:朋友|交友|社交|交往|圈子|人际|生活|动向|行踪)`,
  String.raw`(?:未成年人|青少年|青春期|孩子|子女)(?:[^。]{0,8})?(?:需要|应当|应该|需要的是)(?:[^。]{0,8})?(?:适当|适度|合理|必要|正确|科学)(?:的)?(?:[^。]{0,8})?(?:社交|交友|引导|保护|监护|监督|陪伴|沟通|了解)`,
  String.raw`(?:父母|家长|监护人)(?:[^。]{0,8})?(?:提醒|劝告|告诫|引导|教育)(?:[^。]{0,8})?(?:孩子|子女)(?:[^。]{0,8})?(?:远离|避开|注意|警惕)(?:[^。]{0,8})?(?:不良|坏人|危险|侵害|欺凌|诈骗|毒品|烟酒)`,
  String.raw`(?:约定|制定|设立|建立|讲清楚|说清楚)(?:[^。]{0,8})?(?:规则|边界|界限|规矩|制度|原则|底线|作息|时间)`,
  String.raw`(?:规则|边界|界限|规矩|制度|原则)(?:[^。]{0,8})?(?:要|需要|应当|应该|必须|得)(?:[^。]{0,6})?(?:一致|前后一致|一贯|稳定|清晰|明确|简单|具体)`,
  String.raw`(?:学校|班级|单位|公司)(?:[^。]{0,8})?(?:规定|纪律|制度|要求|管理)(?:[^。]{0,8})?(?:学生|员工|成员|学员)(?:[^。]{0,8})?(?:不能|不得|不准|不许)(?:[^。]{0,8})?(?:带|使用|玩|携带)(?:[^。]{0,8})?(?:手机|电话|电子设备|游戏机)`,
  String.raw`(?:沟通|信任|理解|尊重|平等|商量|协商)(?:[^。]{0,8})?(?:才|才|是)(?:[^。]{0,8})?(?:解决|化解|维系|建立|维护|最好)(?:[^。]{0,8})?(?:之道|办法|方式|基础|前提|途径)`,
  String.raw`(?:隐私|私人空间|边界|边界感)(?:[^。]{0,8})?(?:与|和)(?:[^。]{0,8})?(?:信任|安全|监护)(?:[^。]{0,8})?(?:需要|要在|要在|需要在)(?:[^。]{0,8})?(?:平衡|兼顾|之间找到平衡)`,
  String.raw`\b(?:parents?|guardians?)\s+(?:reasonably|appropriately)\s+(?:monitor|supervise|keep\s+track\s+of)\s+(?:younger\s+)?(?:children|kids|children's|kids')\s+(?:friendships?|activities?|whereabouts)`,
  String.raw`\b(?:children|kids|teens?|teenagers?)\s+need\s+(?:to\s+)?(?:gradually|slowly|progressively)\s+(?:build|develop|establish)\s+(?:independent|their\s+own|healthy)\s+(?:social|friendships?|relationships?)`,
  String.raw`\b(?:healthy|clear|mutual)\s+(?:boundaries|rules|limits)\s+(?:are|is)\s+(?:important|essential|helpful|a\s+sign)`,
].join('|'), 'i');

// ─── G2: 概念分析与规范陈述（社交隔绝作为被分析、被否定的对象）──────────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:社交隔绝|社会隔绝|社交孤立|社会孤立|社交隔离|社交控制|情感孤立|切断联系)`,
  String.raw`(?:用|拿|把)(?:[^。]{0,10})?(?:切断|限制|禁止|监控|隔绝|隔离)(?:[^。]{0,8})?(?:联系|来往|社交|交友|出门|通讯|沟通)(?:[^。]{0,10})?(?:逼|迫使|要挟|胁迫|威胁|换|控制)(?:[^。]{0,10})?(?:是|属于|构成|就是|正是)(?:[^。]{0,10})?(?:操控|控制|虐待|暴力|伤害|胁迫|孤立|不可取|不该|错误|典型)`,
  String.raw`(?:限制|禁止|监控|切断|隔绝|隔离)(?:[^。]{0,8})?(?:交友|来往|社交|联系|出门|通讯|沟通)(?:[^。]{0,10})?(?:是|属于|构成)(?:[^。]{0,10})?(?:控制|操控|虐待|伤害|孤立|胁迫|不可取|不该|错误|有害)`,
  String.raw`(?:把|将)(?:[^。]{0,10})?(?:不准|不许|限制|禁止|切断|监控|隔离)(?:[^。]{0,10})?(?:当成|当作|看作|变成|沦为|包装成|用作)(?:[^。]{0,8})?(?:筹码|工具|手段|要挟|胁迫|威胁|控制|惩罚|压力)`,
  String.raw`(?:不该|不能|不可以|不应|不得|勿|不要|千万别)(?:[^。]{0,10})?(?:以|用|拿|把)(?:[^。]{0,10})?(?:切断|限制|禁止|监控|隔绝|隔离)(?:[^。]{0,8})?(?:相要挟|作筹码|当筹码|作威胁|当威胁|逼迫|胁迫|逼)`,
  String.raw`(?:家长|父母|家人|看护人|监护人)(?:[^。]{0,8})?(?:不该|不能|不应|不得|不可以|勿)(?:[^。]{0,10})?(?:拿|用|把)(?:[^。]{0,10})?(?:限制|禁止|切断|监控|隔绝|隔离|交友|出门)`,
  // ── G5 相邻维度域：relationship_severance（r654）终止关系存续，
  // silent_treatment（r656）撤回关系内供给——两者各有主维度，本维度
  // 不收。放守卫里而不是靠名词表规避，是为了让边界可测（测试 F7/F8）。
  String.raw`(?:断绝|终止|结束|解除)(?:[^。]{0,6})?(?:父子|母子|母女|母子|亲戚|婚姻|夫妻|伴侣|恋爱|同居)(?:[^。]{0,4})?关系`,
  String.raw`(?:当没|就当没|当作没)(?:生过|养过|认识|有)(?:你|您|你们|我这个|他这个|我这个)`,
  String.raw`(?:不认|不认你|再不认|断绝)(?:你|您|你们)?(?:[^。]{0,4})?(?:这个|这门|这份)?(?:亲|骨肉|子女|儿子|女儿|父子|母子)`,
  String.raw`(?:不跟你|不与你|不再跟你)(?:[^。]{0,4})?(?:说|讲)(?:[^。]{0,4})?(?:一句|一句话|任何)`,
  String.raw`\b(?:disown|disowning|cut\s+you\s+off|no\s+longer\s+consider\s+you)\b`,
  String.raw`\b(?:withhold|withholding|stop\s+(?:giving|cooking|paying))\s+(?:your\s+)?(?:meals?|food|dinner|allowance|pocket\s+money|support|care)\b`,
  String.raw`\b(?:isolating|isolation|cutting\s+off|restricting)\s+(?:someone|a\s+partner|a\s+person|victims?|people)\s+(?:from\s+)?(?:friends?|family|support|others|their\s+social)\s+(?:is|are|as|constitutes)\s+(?:a\s+)?(?:recognized|common|classic|form|type)\s+(?:of\s+)?(?:abuse|coercion|control|manipulation|neglect|blackmail)`,
  String.raw`\b(?:is|are)\s+(?:a\s+)?(?:recognized|common|classic|well[-\\s]?known)\s+(?:form|type|sign|tactic|pattern)\s+of\s+(?:coercion|control|emotional\s+abuse|blackmail|manipulation|isolation)`,
  String.raw`\b(?:using|use\s+of)\s+(?:isolation|controlling\s+who\s+someone\s+sees|monitoring\s+someone's\s+phone)\s+(?:as|to)\s+(?:punishment|control|coercion|a\s+weapon|leverage|blackmail)`,
].join('|'), 'i');

// ─── G3: 正当安全提醒（注意人身安全/远离不良影响，无隔绝指令）──────────
const SAFETY_ZH = new RegExp([
  String.raw`(?:注意|留意|警惕|小心|防范)(?:[^。]{0,8})?(?:人身|自身|个人|自己)(?:[^。]{0,6})?(?:安全|安危|风险)`,
  String.raw`(?:学校|社区|警方|公安|政府|老师)(?:[^。]{0,10})?(?:开展|组织|进行|宣传)(?:[^。]{0,8})?(?:安全|反诈|防骗|防侵害|防欺凌)(?:[^。]{0,8})?(?:教育|宣传|讲座|演练|活动)`,
  String.raw`(?:防|反)(?:诈骗|欺诈|侵害|欺凌|拐卖|毒品|电信网络诈骗)(?:[^。]{0,8})?(?:宣传|教育|知识|指南|提示|手册)`,
  String.raw`\b(?:teach|teaching|taught)\s+(?:children|kids|children\s+about|kids\s+about)\s+(?:stranger\s+danger|stranger\s+safety|personal\s+safety|online\s+safety)`,
  String.raw`\b(?:police|school|community|authorities)\s+(?:warn|warned|advise|advised|issued)\s+(?:about|of|residents?\s+to)\s+(?:the\s+)?(?:danger|risk|scam|threat)`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问不豁免）────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该、该如何)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,90}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSocialIsolation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const ISOLATE_ZH_ = R.ISOLATE_ZH || ISOLATE_ZH;
  const IMPERATIVE_ZH_ = R.IMPERATIVE_ZH || IMPERATIVE_ZH;
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const COERCE_ZH_ = R.COERCE_ZH || COERCE_ZH;
  const GUARDIAN_ZH_ = R.GUARDIAN_ZH || GUARDIAN_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const SAFETY_ZH_ = R.SAFETY_ZH || SAFETY_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.7,
    count: 1,
    detail: isZh
      ? '社交隔绝×隔绝指令×要挟顺从标记(zh)'
      : 'social-isolation×isolation-directive×coercion-marker(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（五类共用）：正当监护 / 概念分析与相邻维度 / 安全提醒 / 句首咨询
  if (GUARDIAN_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (SAFETY_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // [r683] 把字句祈使自明单腿：先判祈使形（「把你兄弟姐妹的微信全部删掉」
  // 这类直接命令强制信号自明，不要求腿②共现，判据同 command_injection
  // 的粗体命令——破坏性动作的祈使形态不需要上下文）。
  const imperative = IMPERATIVE_ZH_.test(text);
  // 支① 隔绝指令（右腿）必中（或把字句祈使形）
  if (!imperative && !ISOLATE_ZH_.test(text)) return miss();
  // 支② 要挟顺从标记（左腿）：六类任中一类（把字句祈使形豁免腿②）
  if (!imperative && !COND_ZH_.test(text) && !COERCE_ZH_.test(text)) return miss();

  return hitResult;
}

module.exports = {
  checkSocialIsolation,
  __internals: () => ({
    ISOLATE_ZH, IMPERATIVE_ZH, COND_ZH, COERCE_ZH,
    GUARDIAN_ZH, ANALYSIS_ZH, SAFETY_ZH, QUESTION_ZH,
  }),
};
