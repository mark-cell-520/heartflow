/**
 * src/source-derogation.js — 「信息源贬低族（source derogation）」检测器
 * （第 290 个判别维度，r465 起草并接线）
 *
 * 立项实证（scripts/round-465/probe-r465-gap.js，v6.8.229 gate() 全量
 * findings 实测）：45 条攻击样本（敌意归因 15 + 反应性贬低 15 + 虚幻真
 * 效应 15）仅 12 条被 gate 拦下，33 条穿透 gate=pass——其中 5 条由
 * appeal_to_majority / fallacies / circular_reasoning / false_dilemma /
 * fallacy_of_relevance + hasty_generalization 等语义错维度代拦，剩余
 * 28 条零维度承重。src/ 下没有任何维度判「以信息源的身份/立场/重复
 * 次数替代内容本身」这一结构。
 *
 * 外部来源：本维度判据取自行为人际归因与说服心理学的标准描述，为心虫
 * 自有纯规则实现（零 LLM 依赖）：
 *   · hostile attribution bias（敌意归因偏误，Dodge 1980s 起在儿童
 *     社会认知研究中系统化）：在模糊情境下把他人行为系统性地解读为
 *     含敌意——沉默=心里有鬼、不回复=拒绝、没表扬=否定。问题在于
 *     「从模糊证据直接跳到恶意结论」，跳过了全部无辜解释。
 *   · reactive devaluation（反应性贬低，Ross & Ward 1995/1996）：一旦
 *     知道某提议来自对手/不喜欢的一方，就无条件贬低该提议——不读内容
 *     先否定、只看署名就否决。实证：同一份让步方案在「对方提出」标签
 *     下接受率显著低于「己方提出」标签。
 *   · illusory truth effect（虚幻真效应，Hasher et al. 1977；重复至
 *     少 3 次的陈述被判定为真的概率显著高于单次陈述，Fazio et al.
 *     2015 元分析）：陈述的熟悉度被误当成真实性证据——「听过太多遍」
 *     「到处都在传」成了「所以是真的」的理由。熟悉感与真实性是两个
 *     独立属性，重复是传播力的函数而非真实性的函数。
 * 三者共同结构：**用信息源的身份/立场/重复次数替代信息内容本身**。
 * 判别者的职责正在此——内容的对错只能由内容与证据决定，不能由
 * 「谁说的」「说过多少遍」决定。
 *
 * 辨别的族（三族共享同一「源替代内容」结构，各带独立双腿判据）：
 *   A. hostile_attribution 敌意归因：**模糊行为陈述**（沉默/没回/
 *     不表态/没点名/语气平淡/回避/没打招呼）**被解读为恶意结论**
 *     （心里有鬼/心虚/拒绝/看不起/针对/嘲笑/冷暴力/心怀不满/控诉/
 *     亏心事/不怀好意），无任何中间证据。
 *   B. reactive_devaluation 反应性贬低：**源身份/立场标记**（他提的/
 *     对方党/对手/他们主张/那个立场有问题的人/署名）**触发无条件否定**
 *     （第一反应就是反对/一概不接受/先一律否决/不用看内容/必然有
 *     问题/不值一提/自动可疑/reject without reading）。
 *   C. illusory_truth 虚幻真效应：**重复/熟悉陈述**（听过太多遍/
 *     到处都在传/被重复了无数次/从小就听说/人人都说/听得多了/
 *     随处可见/重复了几十年/ heard so often）**推出真实性结论**
 *     （应该是对的/自然是真的/不可能有错/难道还有假/肯定是真的/
 *     重复本身就是证明/潜意识就认定/must be correct）。
 *
 * 与既有维度的边界（r465 归因）：
 *   · appeal_to_majority（第149维）管**以人数多少论证真伪**（多数人
 *     都信所以是真的）；本族 C 判据是**重复次数/熟悉度**——「到处都
 *     在传」「从小听说」未必声称多数人，主张的是熟悉度即真。
 *   · genetic_fallacy（第131维）管**以来源出身否定/肯定论点**
 *     （他爸是罪犯所以他的话不可信）；本族 B 要求源身份标记与
 *     「无条件否定」动作共现，且不限出身、含党派/立场/署名/对手
 *     身份等一切「因源废言」形。
 *   · hasty_generalization 管**小样本过度概括**；本族三子族均不依赖
 *     样本量论证，攻击点是「源属性替代内容评估」这一推理跳跃。
 *   · mind_reading（第142维）管**宣称知道他人内心想法**（他肯定是
 *     这么想的）；本族 A 的落点是「把模糊行为判为恶意」——结论是
 *     敌意归因，不是单纯读心（「他心里其实很欣赏你」不命中 A）。
 *   · ad_hominem 管**人身攻击替代论证**（你人品有问题所以你说的
 *     错）；本族 B 的对象是**提议/主张**而非论证者本人，「他的方案
 *     不用看内容」落点在方案上，且可含非攻击性的中立否定（「对手的
 *     提案一概不采纳」）。
 *
 * 判据（双腿共现 + 邻近窗 + 五组豁免，缺一不判）：
 *   腿① 源侧信号（三族各不同，见下 SOURCE_*）；
 *   腿② 结论侧信号（AMBIG_VERDICT / DEROGATE / TRUTH_CLAIM）；
 *   两腿同窗共现即视为「以源替代内容」叙述。
 *
 * 为什么取 VERIFY 级：单句可能只是转述一次群体反应、也可能是风险信号
 * 尚未证伪前的合理判断。verify 的语义是「这段话用信息源的身份、立场
 * 或重复次数替代了内容本身的证据，先核实内容与来源无关的证据，再决定
 * 是否采信其结论」。
 *
 * 明确不判的（豁免，均可负例注入证明承重）：
 *   · 源评估纪律（评估方案本身的内容而不是看谁提的/重复次数与真假
 *     无关/不以亲疏决定对错/只看证据/evaluated on its merits ——
 *     DISCIPLINE 豁免）；
 *   · 有数据/证据支持的判断（数据来自同行评审的期刊/一手证据/概率
 *     数字+来源——DATA 豁免）；
 *   · 概念/教学转述（敌意归因偏误/反应性贬低/虚幻真效应/hostile
 *     attribution/reactive devaluation/illusory truth/认知偏误/
 *     心理学/行为经济学/教材——CONCEPT 豁免）；
 *   · 否定/纠偏（沉默本身不能证明任何事情/需要直接沟通确认/并不是
 *     因为谁提出的/is not established by repetition——NEGATION 豁免）；
 *   · 对冲与疑问（可能/也许/或许/大概/似乎/说不定/有待核实；EN maybe/
 *     perhaps/might/probably/seems/appears；含 ?/？——HEDGE 豁免）。
 */
'use strict';

// ─── 族 A 腿①：模糊行为陈述（中文）───────────────────────────
// 沉默/未回复/未表态/未点名/语气平淡/回避/未打招呼/未采纳/未表扬
const HA_AMBIG_ZH = [
  /(?:沉默|不说话|没说话|一声不响|默不作声|不吭声|无言|沉默不语|始终沉默|选择沉默)/,
  /(?:迟迟|一直|老|总)?(?:没|未|不曾)(?:回复|答复|回应|回答|回消息|回信|回话|给答复)/,
  // [r466] 「他迟迟没有回复」穿透修复：上一条要求「(没|未|不曾)」紧贴动词，
  //   但「没有回复」是「没+有+动词」形，「有」字插在中间导致整族不匹配。
  /(?:迟迟|一直|老|总)?(?:没|未|不曾)有(?:回复|答复|回应|回答|回消息|回信|回话|给答复|表态|说明|解释|消息)/,
  // [r465] 原「不表态/不解释」腿（补「没有回复」形时不得丢失，r466 复跑实证）
  /(?:迟迟|一直|老|总)?(?:没|未|不)(?:表态|说明|解释|出声|发言|开口)/,
  // [r466] 「他反对这个方案，说明他心里有鬼」穿透修复：反对/质疑 + 方案/
  //   观点/提议类宾语是 HA 腿①最常见的「中性行为」形（会议异议记录），
  //   存量族只收否定形（没采纳/没回复），漏了这个「有动作但动作本身是
  //   中性程序行为」的族。窄化：必须带方案/提议/观点/立场类宾语，防
  //   「我反对这个提议」单独出现时误伤（单腿无恶意结论仍不判，但宾语
  //   收窄可降低与既有维度的交叠）。
  /(?:反对|质疑|质疑|驳|驳回|顶回|否了|否决|否定|挑剔|指摘|批|批评|点评)(?:了|过)?(?:这个|该|此|那个|他的|她的|他们的)?(?:方案|提议|建议|意见|主张|想法|提案|计划|政策|观点|立场|做法|措施|举措)/,
  /(?:没|未)(?:点名|表扬|提到|夸奖|表彰|肯定|认可|赞赏)/,
  /(?:语气|态度|表情|神色|语调)(?:平淡|冷淡|漠然|漠不关心|冷冰冰|生硬|不耐烦|平静|无明显)/,
  /(?:回避|避开|绕开|躲开|不谈|不提|不说|不接话|转移话题|岔开话题)/,
  // [r466] HA-4/HA-5 穿透修复：腿①缺「言语迟疑」族（支支吾吾/答不上来/
  //   闪烁其词/张口结舌）与「越…越…辩解升级」形。存量族只收沉默/回避/
  //   语气冷淡三类，「言语卡顿」是敌意归因最经典的行为观测（DSM 口径的
  //   「含糊其词」形），「越是解释越说明…」是自证陷阱句——用对方的自辩
  //   反证其心虚。窄化：迟疑族必须紧贴「说/答/讲/问」类言语动词或独立
  //   成句状态词，「越…越…」族必须含「解释/辩解/澄清/说明」。
  /(?:支支吾吾|吞吞吐吐|闪烁其词|含糊其词|张口结舌|哑口无言|语无伦次|答非所问|半天说不|半天答不|一时语塞|欲言又止|吱吱唔唔|嗯嗯呃呃)/,
  /(?:答不上|回答不上|答不出来|说不出|讲不出|解释不清|说不清楚|给不出)(?:来|清楚)?/,
  /(?:越是|越是|愈发|越|越发)(?:解释|辩解|澄清|说明|反驳|争辩|辩白|喊冤|自证)/,
  /(?:没|未)(?:跟|和|与)?(?:我|咱们|我们)?(?:打招呼|问好|点头|致意|理会)/,
  /(?:没|未)(?:采纳|接受|同意|批准|通过|采用)(?:我|我的|我们|我们的)?(?:的)?(?:方案|提议|建议|意见|主张|想法|提案)/,
  // [r465] 不采纳/没采用 + 宾语前置无「的」形（「他们不采纳我的方案，
  //   摆明了是故意针对我」——立项实证穿透）。主语+不+动词直接带宾语。
  //   窄化：必须带宾语或后接「我/我们」类受害者标记，防「不同意他的
  //   立场」这类合法评估句误伤（r465 复跑实证）。
  /(?:不|没|未)(?:采纳|采用|理会|理睬)(?:我|我的|我们|我们的)?(?:的)?(?:方案|提议|建议|意见|主张|想法|提案|报告|邮件|消息|请求)/,
  /(?:不|没|未)(?:采纳|采用|理会|理睬)(?:我|我的|我们|我们的)/,
  /(?:不|没)(?:说话|作声|吭声|回应|答复)/,
  // [r465] 行为动词族：笑/窃笑/耳语/使眼色/摇头/叹气——r465 立项实证
  //   「同事笑了，肯定是在嘲笑我。」「他摇了摇头，分明是不屑。」因 A 腿
  //   只有否定形没这个「行为即敌意证据」形整句穿透。这类句子是敌意归因
  //   最典型语料（一个中性动作直接读成嘲讽），必须收。
  /(?:笑|窃笑|暗笑|偷笑|耳语|交头接耳|使眼色|挤眉弄眼|摇头|叹气|撇嘴|冷笑|干笑|笑了笑|哈哈大笑)/,
  /(?:当众|公开|当场|在(?:会上|群里|群里|群里))?(?:被|遭|受)?(?:无视|忽略|冷落|晾|晾在|不理|不睬)/,
  // [r466] HA-ZH A腿穿透「她这次之所以在评审会上提出质疑」：存量 A 腿
  //   收「提出/表达了+异议」形，漏「之所以…提出质疑/质疑」这个把程序
  //   动作包进动机从句的形。补：之所以/之所有 + 任意中间语 + 程序行为。
  /之?所以[^。，！？；]{0,14}(?:提出|提出?了?|表达|表示|发出|作出|做出|投了|投出)[^。，！？；]{0,4}(?:质疑|疑问|异议|反对|否定|批评|指摘|挑剔|驳|反驳|控诉|谴责|指责|抗议|不满)/,
  // [r466] HA-ZH A腿穿透「他之所以提出这个方案」：r466h 补的之所以族
  //   只收 之所以+提出+异议词（质疑/异议/反对），漏 之所以+提出+中性
  //   提案（方案/建议/计划/想法）——被读成嫉妒时，程序对象是提案本身。
  /之?所以[^。，！？；]{0,14}(?:提出|提交|递交|呈上|上报|建议|倡议)[^。，！？；]{0,4}(?:方案|建议|提案|计划|想法|构想|思路|设计|构想|规划|草案|版本|产品|功能|改动|调整)/,
];

// ─── 族 A 腿②：恶意结论（中文）────────────────────────────────
const HA_VERDICT_ZH = [
  /(?:心里有鬼|心虚|心里发虚|做贼心虚|心中有鬼|怀着鬼胎)/,
  /(?:分明|明明|显然|摆明|明摆|显然就是|这就是|恰恰说明|足以说明)(?:是|在|属于)?[^。，！？；\n]{0,10}(?:拒绝|否定|拒绝|不接受|不认可)/,
  /(?:看不起|瞧不起|蔑视|轻视|鄙视|看不上|不放在眼里|目中无人)/,
  /(?:故意|蓄意|有意|刻意|成心)(?:针对|刁难|为难|找茬|挑刺|使坏|下套|设局|整我|排挤|孤立)/,
  /(?:嘲笑|嘲弄|讥笑|嘲讽|取笑|看笑话|幸灾乐祸)/,
  /(?:冷暴力|心怀不满|心存不满|怀恨|记恨|怨愤|含恨|不怀好意|别有用心|居心不良|没安好心|图谋不轨)/,
  /(?:亏心事|亏心|作贼|有鬼|遮掩|掩盖|掩饰|隐瞒)/,
  /(?:控诉|谴责|指责|声讨|抗议|不满|愤怒|愤懑)/,
  /(?:拒绝|否决|否定|不认可|不同意|不答应|不接受)/,
  /(?:暗示|意味着|表明|说明)(?:我|他|其)?(?:不行|不行了|不够好|不合格|有问题|差劲|无能)/,
  /(?:不服|不服气|嫉妒|妒忌|眼红|觊觎|窥伺|觊觎)/,
  /(?:心里|内心|骨子里|实质上)(?:不|没|毫无)(?:认同|尊重|看得起|服气|接受|同意)/,
  // [r466] HA-ZH 腿\u2462穿透「他提反对意见就是看不得我们好」：存量腿\u2462
  //   只收沉默/动机推断形，漏「看不得/见不得 + 别人好」这个口语化的
  //   恶意投射句式（把行为归因于嫉妒他人处境）。
  /(?:看不得|见不得|容不得|忍不了|受不了)\s*(?:别人|人家|他人|我们|你们|他们|我)?\s*(?:好|过得好|成功|进步|出色|风光|得势|舒服)/,
  /(?:巴不得|就盼着|就等着|恨不得)\s*(?:我们|你们|他们|我|别人)?\s*(?:失败|出错|出事|翻车|搞砸|倒霉|完蛋|摔跟头|下台)/,
];

// ─── 族 B 腿①：源身份/立场标记（中文）────────────────────────
const RD_SOURCE_ZH = [
  /(?:他|她|他们|对方|对手|另一方|另一方阵营|那一边|对立方|反对派|他们党|那个党|那个阵营|那个派系)(?:提|提出|提议|建议|主张|倡议|推出|拿)(?:出)?(?:的|过来)/,
  /(?:如果|若是|假如|要是)(?:是|由)?(?:他|她|他们|对方|对手)(?:提|提出|提议|建议|主张)(?:的|出来)/,
  // [r465] 「这个方案如果是他提的」——方案/提议等宾语前置形（源标记
  //   在「是…提的」判断句里被宾语隔开），r465 立项实证穿透。
  /(?:这个|该|此|那条|那份)(?:方案|提议|建议|主张|提案|想法|意见|计划|政策)(?:如果|若是|假如|要是|如果)(?:是|由)?(?:他|她|他们|对方|对手)(?:提|提出|提议|建议|主张)(?:的|出来)/,
  /(?:只要|凡是|所有|任何|无论)(?:是)?(?:对手|对方|对方党|他们|反对派|对立方|那一边|另一个阵营)(?:支持|赞同|主张|提出|拥护|赞成)(?:的|之事)?/,
  /(?:这个|该|此)?(?:人|家伙|家伙们|东西|家伙)?立场(?:有问题|不正|可疑|不对|有问题的人|有问题的一方)/,
  /(?:因为|既然|由于)(?:是|由)(?:他|她|他们|对方|对手|那个阵营|对立面)(?:提出|提议|建议|主张|说)(?:的|出来)/,
  /(?:署名|出自|来自)(?:他|她|他们|对方|对手)(?:之?手|的)?/,
  /(?:他|她|他们|对方|对手)(?:的)?(?:立场|阵营|派系|一边|一方|背景|出身|身份)(?:有问题|可疑|不正)/,
  // [r466] 「因为是对方提出来的，所以…」——r465 探针 RD-05 穿透：
  //   「提出来/说出来的」动态形 + 因果句「因为是…提出来的」。存量族只收
  //   「(他|对方)(提|提出|提议|建议|主张)(出)?(的|过来)」，「提出来」的
  //   「来」不在候选集里。补：提出来/说出来/讲出来/弄出来 + 无宾语形。
  /(?:因为|既然|由于)(?:是|由)(?:他|她|他们|对方|对手|对立方|另一方)(?:提|说|讲|搞|弄)(?:出来|过来|起的)/,
  /(?:是|由)(?:他|她|他们|对方|对手|对立方|另一方)(?:提|说|讲|搞|弄)(?:出来|过来)(?:的)/,
  // [r466] 「对方赞成的，我们就要反对」——RD-06 穿透：源标记在「对方X的」
  //   的字短语里（赞成的/支持的/主张的），存量族只收「对方(支持|赞同)」
  //   后接「的」形但要求动词在候选集。补：赞成/拥护/背书/站台 + 的。
  /(?:他|她|他们|对方|对手|对立方|另一方|那一边)(?:赞成|拥护|背书|站台|附和|力挺|支持|赞同)(?:的|那一套|那套)/,
  // [r466] 「他们推荐的措施，无论内容如何，先一律否决」——RD-08 穿透：
  //   「他们推荐的」+ 宾语名词（措施/方案/政策）。补推荐/推介/推举 +
  //   措施/举措/政策/议案族宾语。
  /(?:他|她|他们|对方|对手|对立方|另一方)(?:推荐|推介|推举|捧|抬)(?:出)?(?:的)?(?:措施|举措|方案|政策|议案|办法|做法|提案|计划|项目)/,
  // [r466] 「对方的方案只看署名就可以否掉」——RD-10 穿透：纯名词领属形
  //   「对方的+方案/提议」，存量族要求动词。补「(对方|对手|他们)(的)X」
  //   领属形，宾语限方案/提议/提案/主张族。
  /(?:对方|对手|对立方|另一方|他们|那一边)(?:的)(?:方案|提议|提案|建议|主张|计划|政策|议案|想法|提案|见解|观点|立场)/,
  // [r466] RD-2/RD-4 穿透修复：源标记缺「媒体/报社/那群人」这类机构与群体
  //   领属形（「那家媒体的报道」「他们那群人的提议」），存量族只收「他/
  //   她/他们/对方/对手」人称与「的+方案」领属，「那家媒体」「那群人」
  //   的机构形与「说的话/讲的话/提议」宾语族都不在候选集。窄化：必须带
  //   报道/言论/提议类宾语，防「那家媒体很有公信力」单腿误伤。
  /(?:那家|那间|这家|某家|那|某些|某些个|境外|海外|官方|某些)(?:媒体|报社|杂志|电视台|电台|网站|平台|自媒体|公众号|大V|营销号|水军|集团|势力|圈子|那群人|那伙人|这帮人|他们那群|他们那伙)/,
  /(?:对手|对方|他们|她们|那群人|那伙人|这帮人|人家)(?:说|讲|提|写|发)(?:的)?(?:话|事|言论|说法|报道|文章|帖子|视频|提议|方案|主张)/,
  /(?:他们|她们|对手|对方|那一边)(?:那)?(?:群|伙|帮|党|派|阵营|一边)(?:人)?(?:的)?(?:话|事|说法|提议|方案|主张|言论|报道|文章)/,
  // [r466] RD-ZH 腿\u2461穿透「他就是因为被公司开除了，所以现在到处说公司
  //   的坏话」：存量腿\u2461只收身份名词（前女友/落选者），漏「因为+被动
  //   受损事件」这个归因结构——被开除/被淘汰/竞标失败/被拒稿。
  /(?:就是|纯粹|只不过|只是|就因为|是由于)?因为(?:被|遭|受了|挨了|撞上|碰上|遇到|赶上)[^。，！？；]{0,10}(?:开除|辞退|解雇|裁员|淘汰|落选|落榜|拒稿|拒签|否决|驳回|降职|处分|处分|罚款|处罚|起诉|判|输|失败|失利|拒|拒绝|否定|批评|指责|处分)/,
  /(?:竞标|投标|招标|竞选|选拔|比稿|复审|答辩|审查|评估|评比|比赛|考试|面试)[^。，！？；]{0,6}(?:失败|失利|落选|被否|没过|未通过|落榜|输给)/,
];

// ─── 族 B 腿②：无条件否定（中文）──────────────────────────────
const RD_DEROGATE_ZH = [
  /(?:第一反应|本能|下意识|想都不想|想也不用想|不加思索|不假思索|不须看|不必看|不用看)(?:就)?(?:是|应当是|应该是|觉得)?(?:反对|否决|否定|拒绝|驳掉|否掉|不接受|不予考虑)/,
  /(?:一概|一律|统统|全都|全部|均|都)(?:不接受|不采纳|不认同|否定|否决|拒绝|反对|驳斥|pass掉)/,
  // [r466] 「他们提出的方案，一概不能接受」穿透修复：腿②的「一概」族要求
  //   不接受/不采纳/不认同/否定等词紧跟，「不能接受」的「能」字插在中间
  //   （一概+不能+接受）导致不匹配。补「一概/一律 + 不能/不可/无法 + 动词」。
  /(?:一概|一律|统统|全都|全部|均)(?:不能|不可|无法|不许|不予|绝不可能|压根不可能)(?:接受|采纳|认同|同意|支持|相信|信|考虑|采纳)/,
  // [r466] RD-3 穿透修复：腿②缺「反过来听/反着听」与「不能信/信不过」
  //   这类以源定真值的形（「对手说的话，向来要反过来听」「他们那群人的
  //   话，不能信」）。「反过来听」是反应性贬低的经典句式——不评判内容，
  //   只以身份反推真值。窄化：反向听族必须带「向来/从来/总是/都」类
  //   恒常标记，防「这次反过来听」的正当策略表述误伤。
  /(?:向来|从来|总是|一向|一贯|都|一律|向来都是)(?:要)?(?:反过来|反着|对着|相反)(?:听|看|读|理解|想)/,
  /(?:不能|不可|没法|无法|信不过|不能全信|半句不能|一句都不能)(?:信|相信|轻信|当真|听|采纳|听进去)/,
  /(?:当|当成|当作)?(?:笑话|耳旁风|耳边风|放屁|废话|屁话|狗屁|耳旁|耳边)(?:听|对待|就行|即可|罢了)/,
  /(?:先|先给|先予以|优先|一律)(?:否决|否掉|否定|驳回|拒绝|反对)/,
  /(?:不用|不必|不需要|无需|用不着)(?:看|读|细看|细读|过目|了解|听)(?:内容|具体内容|全文|细节|细节)?/,
  /(?:必然|一定|必定|注定|势必|肯定)(?:有|存在)(?:问题|毛病|漏洞|缺陷|错处|隐患|猫腻|水分)/,
  /(?:不值一提|不足挂齿|不予考虑|不屑一顾|嗤之以鼻|一无可取|毫无价值)/,
  /(?:只看|光看|仅凭|凭)(?:署名|名字|出处|来源|标签|是谁说的)/,
  /(?:就)?(?:可以|能够|足以)(?:否决|否掉|否定|推翻|pass掉|毙掉)/,
  /(?:凡是|只要是)(?:他们|对方|对手)(?:说|讲|主张|提出)(?:的)?(?:都)?(?:不|非|假|错|靠不住|不能信)/,
  /(?:自动|自然|显然|理所当然)(?:可疑|存疑|有问题|靠不住|不能信|不可信)/,
  // [r466] RD-06「对方赞成的，我们就要反对。」穿透：腿①已补「对方赞成的」，
  //   但腿②缺「就要反对 / 偏要对着干」这种无条件对立形（无「一律/一概」
  //   前缀）。补：就要/就该/偏要 + 反对/对着干/唱反调；对方支持的我们
  //   就反对 的同构形。
  /(?:就|就要|就该|偏要|非要|定要|必定要|一定会)(?:反对|否决|否定|拒绝|驳掉|否掉|对着干|唱反调|反着来|对着来)/,
  /(?:我们|咱们|大家|各位)(?:都)?(?:要|该|必须|只能|就得)(?:反对|否决|否定|拒绝|对着干|唱反调)/,
  /(?:凡是|只要是|只要是)(?:他们|对方|对手|对立方|另一方)(?:赞成|拥护|背书|站台|附和|力挺|支持|赞同|推荐|主张|提出)(?:的|那一套|那套)?(?:都)?(?:我们)?(?:就)?(?:不|非|反|错|靠不住|不能信|要反对|反对)/,
  // [r466] RD-13「We should oppose whatever they put forward.」穿透：
  //   RD_DEROGATE_EN 缺 should/ought to + oppose 的无条件形。补在下方 EN 族。
  // [r466] RD-ZH 腿\u2462穿透「他到处说公司的坏话，他的话根本不能信」：
  //   腿\u2462缺「到处说X坏话/风凉话」这个传播形态 + 「所谓X不过是Y」的
  //   抹黑定性形。
  /(?:到处|四处|逢人|到处跟人|到处对人|到处说|不停|反复)?(?:说|讲|散布|散播|宣扬|传播|散播)?[^。，！？；]{0,6}(?:坏话|风凉话|难听话|怪话|小道消息|流言|谣言|黑料|黑历史|内幕|隐私|糗事)/,
  /(?:所谓|打着[^。，！？；]{0,8}旗号的?|自称的?)[^。，！？；]{0,10}(?:不过是|只不过是|无非是|就是|纯粹是|其实是|根本是|明说是)[^。，！？；]{0,8}(?:抹黑|污蔑|造谣|中伤|诋毁|攻击|诟病|成见|偏见|报复|发泄|发泄情绪|情绪宣泄|蹭热度|带节奏|炒作)/,
];

// ─── 族 C 腿①：重复/熟悉陈述（中文）──────────────────────────
const IT_REPEAT_ZH = [
  /(?:听|说|看)(?:过)?(?:太多|太多遍|过太多|无数次|很多次|好几遍|多遍|太多回)/,
  /(?:到处|满世界|四处|哪儿|哪儿都)(?:都)?(?:在|皆)(?:传|讲|说|流传|转发|讨论|宣传)/,
  /(?:被|受)(?:重复|传播|转述|流传)(?:了)?(?:无数次|多少遍|多少年|几十年|几百年|很多次|成千上万)/,
  /(?:从小|从小时候|打小|自幼|小时候)(?:就)?(?:听|说|看)(?:过|到|说|起)/,
  /(?:人人|所有人|大家|每个人|谁都)(?:都)?(?:在)?(?:说|讲|这么|如此)/,
  /(?:听得|说)(?:多)(?:了)(?:就)?(?:耳熟|顺耳|顺嘴|习惯|麻木|习以为常)/,
  // [r465] 「听得多了/说的人多了」主语前置形（听得多了自然就是对的）
  //   ——存量族只收「听得多了就…」后置结论形，r465 立项实证穿透。
  /(?:听|说|看)(?:得|过)?(?:多)(?:了)?(?:的)?(?:人|说法|话|事)?/,
  /(?:随处可见|比比皆是|屡见不鲜|满大街|到处都是|四处可见|俯拾皆是|时时都能看到)/,
  /(?:已经|早)?(?:被)?(?:重复|讲|说)(?:了)?(?:几十|多少|数百|上千)(?:年|遍|次)/,
  /(?:重复|传播|转发)(?:本身|自身|这一事实)(?:就是)?(?:证明|说明|证实)/,
  /(?:看|见)(?:过)?(?:太多|太多次|无数|很多)(?:次|遍)/,
  // [r466] IT-10 中文穿透「看到过太多次，潜意识就认定这是事实。」：
  //   存量只收「看过太多次」，「看到过」补进来。
  /(?:看|见|瞧)(?:到)?(?:过)?(?:太多|太多次|无数|很多)(?:次|遍|回)/,
  /(?:见|瞧|看)(?:多)(?:了)?(?:的)?(?:话|说法|事|观点)/,
  // [r466] r465 探针 IT-03/07/09/10/11/12/15 腿①穿透族（重复源主语前置形）：
  //   IT-09「大家都在讲同一件事」、IT-10「老话讲得好」、IT-11「古话传了
  //   几千年」、IT-12「这句话已经说了一代人」、IT-15「这句话人人都懂」。
  //   存量族只收动词开头形（「被重复了」「随处可见」），主语前置（「这句话/
  //   这个观点/古话/老话 + 动词」）时 A 腿零命中。补：① 指示主语（这句话/
  //   这个观点/这说法）+ 说/讲/传/重复 + 时间量；② 古/老/祖 + 话/训 +
  //   时间量；③ 老祖宗/古人 + 说的；④ 人人 + 认知动词；⑤ 老话讲得好；
  //   ⑥ 流传 N 年；⑦ 大家讲同一件事；⑧ 这句话被重复 N 次。
  /(?:这句|这一句|这个|这一种|这种)(?:话|说法|观点|道理|老话|古话)(?:早就|早已|已经|曾被|被|都|也)?(?:说|讲|传|重复|复述|流传)(?:了)?(?:几百|几千|多少|数十|好几|无数|一辈|一代人|几代)?(?:年|代|世|百年|千年|辈子|代人|次|遍)?/,
  /(?:古|老|祖|先)(?:话|训|训话|谚语|俗语|格言|名言)(?:传|讲|说)(?:了)?(?:几百|几千|多少|数十|好几)?(?:年|代|世|百年|千年)/,
  /(?:老祖宗|祖先|前辈|先人|古人|前人)(?:说|讲|传)(?:的|下来)?(?:话|道理|规矩|训)?/,
  /(?:人人|大家|每个人|所有人|谁都|谁都知道)(?:都)?(?:懂|知道|明白|清楚|认可|相信|这么说|这么认为|这么讲)/,
  /(?:老|古)(?:话|话说|话讲)(?:得)?(?:好|在理|有理|没错|对)/,
  /(?:传|流传|传播)(?:了)?(?:几百|几千|多少|数十|好几)(?:年|代|世|百年|千年)/,
  /(?:重复|复述|转述|再说|再说一遍|讲来讲去|说来说去)(?:本身|自身)?(?:就是|便是|正是|恰恰是)(?:证明|证据|真理|保证)/,
  /(?:大家|人们|所有人|人人)(?:都在|都|全在)?(?:讲|说|传)(?:同一|同样)(?:件事|个说法|句话)/,
  /(?:这句话|这个观点|这观点|这话)(?:被)?(?:重复|复述|转述|说|讲)(?:了)?(?:无数|几百|几千|多少|数十|好几|几)(?:次|遍|年|代|世)/,
  // [r466] IT-ZH A腿穿透「身边每一个人都在反复强调这件事」：存量 A 腿
  //   收 反复说/到处说，漏 反复强调/反复灌输/反复宣传（强调是最高频的
  //   重复动词，却只收「说」族）。补：反复/不停/一再 + 强调/灌输/宣传。
  /(?:反复|不停|不停歇|一再|再三|屡屡|频繁|时刻|时刻都|一直在|无时无刻不|逢人便|逢人就|见人就|到处)[^。，！？；]{0,4}(?:强调|灌输|宣传|宣扬|告知|念叨|叮嘱|提醒|教育|教导|论述|重申|重申|复述|散布|散播|传播|洗脑|轰炸)/,
];

// ─── 族 C 腿②：真实性结论（中文）──────────────────────────────
const IT_TRUTH_ZH = [
  /(?:早就|应该|想必|肯定|一定|必定|必然|势必)(?:是|算)?(?:对|真|正确|没错|属实|靠得住|可信)/,
  /(?:自然|当然|显然|明摆|毫无疑问)(?:是|算)?(?:真|的|对|正确|属实)/,
  // [r465] 「自然就是对的」——自然/当然 + 「就是」强调形（立项实证穿透：
  //   「这句话听得多了，自然就是对的。」存量族只收「自然是对的」形）。
  /(?:自然|当然|显然|明摆|毫无疑问|肯定|一定|必定)(?:就)?(?:是|算)(?:对|真|正确|没错|属实|可信|靠谱)/,
  /(?:不可能|绝不会|断不会)(?:有错|是假|假|错)/,
  // [r466] IT-09「大家都在讲同一件事，重复本身就是证明。」穿透：腿②
  //   缺「重复/复述 + 本身就是 + 证明」这种以重复行为本身作证据的结论
  //   形（217 行那条是腿①）。补腿②形：本身就是/正是/恰恰是 + 证明。
  /(?:重复|复述|转述|传播|流传|见证|背书)(?:本身|自身|这一事实)?(?:就是|便是|正是|恰恰是|即为)(?:证明|证据|真理|保证|最好的说明)/,
  /(?:说(?:的人|得人)?|讲(?:的人|得人)?|传)(?:多)(?:了)?(?:自然|自然就|那)?(?:是|为|算)(?:对|真|有理|没错|可信)/,
  /(?:见多|见惯|司空见惯|习以为常|耳熟能详)(?:了)?(?:自然|那)?(?:就是|便是|正是)(?:对|真|有理|没错)/,
  /(?:难道|莫非|难不成)(?:还)?(?:有假|是假|是错|不成|有假吗|假吗)/,
  /(?:肯定|一定|必定|必然|势必|铁定)(?:是|算)?(?:真的|事实|如此)/,
  /(?:听得|说|看)(?:多)(?:了)?(?:就)?(?:信|当真|当真的|认定|以为是|就以为是)/,
  /(?:耳熟|熟悉|顺耳)(?:的)?(?:东西|事|说法)(?:就是)?(?:真|对|可信)/,
  /(?:不|绝非)(?:可能|会是)(?:假|假的|错|错的|谎言|谣言)/,
  /(?:潜意识|下意识)(?:就|早已|已经)?(?:认定|认定|当|接受|信)/,
  /(?:早就|早)(?:该)?(?:被)?(?:接受|承认|信|当真|采信)/,
  // [r466] r465 探针 IT-10~IT-15 穿透族（虚幻真效应结论侧）：
  //   IT-10「老话讲得好，流传几百年了，自然有道理。」
  //   IT-11「古话传了几千年，肯定是真理。」
  //   IT-12「这句话已经说了一代人，错不了。」
  //   IT-13「网上到处都是这个说法，宁可信其有。」
  //   IT-15「这句话人人都懂，所以是真的。」
  // 存量 IT_TRUTH_ZH 只收「早就/应该/肯定…是(对|真|正确)」与「不可能
  // 有错」形，漏「有道理/是真理/错不了/宁可信其有/是真的」这几族结论。
  // 补：① 有道理/有它的道理/自有道理（老话结论的标准形）；② 是真理/
  // 真理/至理名言；③ 错不了/跑不了/假不了（俗信结论形）；④ 宁可信其有/
  // 信其有/不可不信；⑤ 人人都懂/大家都这么说，所以是真的。
  /(?:自然|当然|显然|肯定|一定|必定|势必|明摆|想必)(?:是|有|算)(?:有)?(?:道理|它的道理|其道理|真理|至理|名言|规律|法则)/,
  /(?:错不了|跑不了|假不了|假不了|错不到哪里去|出不了错)/,
  /(?:宁可|宁肯|不如|姑且)(?:信|相信)(?:其有|它是真的|是真的|为真)/,
  /(?:是|算是)(?:真理|至理|至理名言|真理啊|金玉良言|金科玉律)/,
  /(?:所以|因此|可见)(?:是|就是)(?:真的|真|对的|正确|没错|属实|可信)/,
  /(?:人人|所有人|大家|每个人|谁都)(?:都)?(?:懂|知道|明白|清楚|认可|相信|这么认为)/,
  /(?:传|流传|讲|说)(?:了)?(?:几百|几千|多少|数十)(?:年|代|世|百年|千年)/,
  /(?:老|古|祖)(?:话|话讲|训|训讲|祖宗的话|先辈)(?:讲|说|传)(?:得)?(?:好|在理|有理)/,
  /(?:能|会)(?:是|会是)?(?:假|假的|错|错的|谣言)(?:吗|不成|么)/,
  // [r466] IT-ZH 腿\u2462穿透「听多了自然就成真了」与「久而久之大家也就
  //   理所当然地把它当作事实来接受了」：存量腿\u2462缺「X多了/久而久之/
  //   习惯成自然 + 就成真/当成事实」这个频率累积结论形。
  /(?:听|看|说|传|重复)[^。，！？；]{0,4}(?:多|久了|惯了|多了|次数多了)\s*(?:了)?\s*(?:就|自然|自然而然|也就|便|当然)?\s*(?:成真|成为事实|变成真的|变成事实|当作事实|当成事实|当成真|信以为真|习以为常|理所当然|天经地义|不言而喻)/,
  /(?:久而久之|长此以往|时间一长|日子久了|习惯成自然|三人成虎|众口铄金)[^。，！？；]{0,14}(?:当成|当作|视为|看作|认为|相信|接受|默认|承认)[^。，！？；]{0,6}(?:事实|真理|真相|真的|正确|理所当然|天经地义|不言而喻|定论|结论)/,
  // [r466] IT-ZH B腿穿透「听多了自然就成真了」：存量 B 腿的「X多了就成真」
  //   形中间要求「自然|自然而然|也就|便|当然」之一，但「听多了自然就成真」
  //   里自然与成真之间还隔着「就」，且前半「听得多了」已被 A 腿命中。
  //   放宽松连接：任选零或多个连接副词 + 成真/当事实。
  /(?:自然|自然而然|也就|便|当然|顺理成章|水到渠成|潜移默化)[^。，！？；]{0,6}(?:成真|成为事实|变成真的|变成事实|当作事实|当成事实|当成真|信以为真|习以为常|理所当然|天经地义)/,
];

// ─── 族 A 腿①：模糊行为陈述（英文）───────────────────────────
const HA_AMBIG_EN = [
  /\b(?:stayed|remained|kept|went)\s+(?:silent|quiet|mute|unresponsive)\b/i,
  /\b(?:ignored|dismissed|overlooked|shut\s+out|passed\s+over|left\s+out)\s+(?:my|our|the|his|her)\b/i,
  /\b(?:did\s?n[o']?t|didn'?t|never)\s+(?:reply|respond|answer|write\s+back|get\s+back|acknowledge)\b/i,
  /\b(?:did\s?n[o']?t|didn'?t|never)\s+(?:mention|name|praise|compliment|acknowledge|credit|single\s+out)\b/i,
  /\b(?:tone|manner|attitude|demeanor|bearing)\s+(?:was|felt)\s+(?:flat|cool|cold|distant|neutral|indifferent|guarded|guarded|guarded)\b/i,
  /\b(?:avoided|dodged|sidestepped|deflected|skirted|shied\s+away\s+from|steered\s+clear\s+of)\b/i,
  /\b(?:did\s?n[o']?t|didn'?t)\s+(?:greet|nod|acknowledge|wave|say\s+hello|return\s+the\s+greeting)\b/i,
  /\b(?:declined|refused|rejected|dismissed)\s+(?:to|my|our|the)\b/i,
  /\b(?:did\s?n[o']?t|didn'?t|never)\s+(?:adopt|accept|endorse|approve|approve\s+of|welcome)\b/i,
  // [r466] HA-EN 穿透族（「He raised that objection purely because he is
  //   jealous of our progress」/「She only asked that question because she
  //   hates us」）：EN 腿\u2461只收否定形/情绪名词形，漏「中性程序行为动词
  //   + 人格归因」——raise an objection / ask a question / voice concerns
  //   本身是合法程序动作，被直接读成嫉妒/仇恨。补：
  //   ① raise/voice/push/express + objection/question/concern/doubt/reservation；
  //   ② bare 形（raised it）。
  /\b(?:raised?|raising|voices?|voiced|voicing|pushes?|pushed|pushing\s+back|express(?:ed|es|ing)?|makes?|made|making|brought?\s+up|bringing\s+up)\s+(?:an?\s+|the\s+|his\s+|her\s+|their\s+|my\s+|our\s+)?(?:objection|objections|question|questions|concern|concerns|doubt|doubts|reservation|reservations|issue|issues|point|complaint|criticism|critique)\b/i,
  /\b(?:raised|voiced|pushed|expressed)\s+(?:it|this|that)\b/i,
  /\b(?:speak|spoke|spoken|talk|talked|talking)\s+(?:up|out)\b/i,
  // [r466] HA-EN A腿穿透「She only asked that question because she
  //   hates us」：存量 A 腿收 raised/voiced/objection 族，漏「asked
  //   that question」——question 前带 that 时既有族不匹配（既有族是
  //   asked + a/the/his/her/their/my/our + objection|question，无 that）。
  /\b(?:asked|asks|asking|raised|raises|raising|voiced|voices|voicing|pushed|pushes|pushing|expressed|expresses|expressing)\s+(?:that|this|such\s+an?)\s+(?:question|objection|concern|point|criticism|complaint|issue)\b/i,
];

// ─── 族 A 腿②：恶意结论（英文）────────────────────────────────
const HA_VERDICT_EN = [
  /\b(?:sign|proof|evidence|indication|admission|confession)\s+of\s+(?:guilt|wrongdoing|wrong-doing|contempt|disrespect|malice|ill\s+will|bad\s+faith|a\s+guilty\s+conscience|guiltiness)\b/i,
  /\b(?:clearly|obviously|plainly|evidently|undeniably)\s+(?:a\s+)?(?:sign|indication|mark|proof|admission)\b/i,
  /\b(?:silence|quiet|refusal|non-?reply|ignoring|dismissal)\s+(?:is|means|signals|speaks\s+to|amounts\s+to|constitutes)\b/i,
  /\b(?:holds?|had|has)\s+(?:me|us|him|her|them)\s+in\s+(?:contempt|disdain|scorn)\b/i,
  /\b(?:looking\s+down\s+on|disdain\s+for|scorn\s+for|contempt\s+for)\s+(?:me|us)\b/i,
  /\b(?:deliberately|intentionally|purposely|knowingly)\s+(?:undermin|sabotag|target|slight|snub|isolat|exclud|discredit|provok)\w*/i,
  /\b(?:mocking|laughing\s+at|ridiculing|making\s+fun\s+of|jeering\s+at)\s+(?:me|us)\b/i,
  /\b(?:cold\s+shoulder|silent\s+treatment|stone\s+walling)\b/i,
  /\b(?:has|had|must\s+have)\s+(?:something\s+to\s+hide|skeletons|a\s+guilty\s+conscience|done\s+something\s+wrong|done\s+something\s+bad)\b/i,
  /\b(?:admission|confession)\s+of\s+(?:contempt|disrespect|guilt)\b/i,
  /\b(?:implying|implies|suggesting|suggests)\s+(?:that\s+)?(?:I|we|he|she)\s+(?:am|is|are)\s+(?:not|no)\s+(?:good\s+enough|up\s+to\s+it|competent|capable|fit)\b/i,
  // [r466] HA-14「They ignored my proposal - a clear sign they are against
  //   me.」穿透：249 行只收「clearly a sign」，不收「a clear sign they
  //   are against me」的倒装形（冠词在前 + 敌对结论在后）。补 a clear/an
  //   obvious/a sure sign + 敌对/反对结论族。
  /\b(?:a|an)\s+(?:clear|obvious|sure|definite|tell-?tale|unmistakable)\s+(?:sign|signal|indication|indicator|mark|surefire)\s+(?:that\s+)?(?:they|he|she|it)\s+(?:are|is|was|were)\b/i,
  /\b(?:a|an)\s+(?:clear|obvious|sure|definite)\s+(?:sign|signal|indication|indicator)\s+of\s+(?:being\s+)?(?:against|opposed\s+to|hostile\s+to|not\s+on\s+(?:my|our)\s+side|working\s+against|out\s+to\s+(?:get|undermine))\b/i,
  /\b(?:are|is|was|were)\s+(?:against|opposed\s+to|hostile\s+to|not\s+on\s+(?:my|our)\s+side|working\s+against|out\s+to\s+(?:get|undermine|sabotage))\s+(?:me|us|my\s+(?:proposal|plan|idea)|our\s+(?:proposal|plan|idea))\b/i,
  /\b(?:ignor|dismiss|rebuff|brush|snub)\w*\s+(?:my|our)\s+(?:proposal|plan|idea|suggestion|input|contribution|effort|request)\b/i,
  /\b(?:deliberately|intentionally|purposely|knowingly|obviously)\s+(?:ignor|dismiss|rebuff|brush|snub|overlook|bypass)\w*\s+(?:my|our)\b/i,
  // [r466] HA-EN 腿\u2462穿透（「purely because he is jealous of our
  //   progress and wants to undermine us」/「because she hates us and
  //   wants us to fail」）：存量腿\u2462只收沉默=心虚/敌对 signal 形，
  //   漏「动机人格归因」——jealous/envious/resentful + 破坏目标。这是
  //   敌意归因最核心的结论形：把程序动作读成嫉妒/怨恨而非内容分歧。
  /\b(?:is|are|was|were|being)\s+(?:just\s+|simply\s+|purely\s+|only\s+|merely\s+|clearly\s+|obviously\s+)?(?:jealous|envious|resentful|spiteful|bitter|angry|mad|upset|frustrated|threatened|insecure|intimidated)\s+(?:of|about|because|that|and|so|to|by)\b/i,
  /\b(?:hates?|hated|hating|despises?|despised|loathes?|loathed|resents?|resented)\s+(?:me|us|you|him|her|them|it|my|our|the)\b/i,
  /\b(?:wants?|wanted|wanting|tried|trying|is\s+trying|are\s+trying)\s+(?:to\s+)?(?:undermine|sabotage|discredit|destroy|ruin|hurt|harm|embarrass|humiliate|expose|see\s+(?:me|us|you|him|her)\s+fail|take\s+(?:me|us|you|him|her)\s+down)\b/i,
];

// ─── 族 B 腿①：源身份/立场标记（英文）────────────────────────
const RD_SOURCE_EN = [
  /\b(?:if|when|supposing)\s+(?:it\s+)?(?:comes?|came|proposed|suggested)\s+(?:from|by)\s+(?:him|her|them|the\s+other\s+side|the\s+opposition|their\s+camp|the\s+rival\s+party)\b/i,
  /\b(?:anything|whatever|everything)\s+(?:they|the\s+opposition|the\s+other\s+side|their\s+camp|the\s+other\s+party)\s+(?:propose|proposes|proposed|suggest|suggests|suggested|support|supports|supported|endorse|endorses|endorsed|back|backs|backed)\b/i,
  /\b(?:their|the\s+other\s+side'?s|the\s+opposition'?s|our\s+rivals'?)\s+(?:proposal|proposals|plan|plans|bill|bills|idea|ideas|suggestion|suggestions|measure|measures|initiative|initiatives|position|stance)\b/i,
  /\b(?:because|since|as)\s+(?:it|it\s+was|they|he|she)\s+(?:came|comes|proposed|suggested|said|put\s+it\s+forward)\s+(?:from|by)\s+(?:him|her|them|the\s+other\s+side|the\s+opposition|their\s+camp)\b/i,
  /\b(?:his|her|their)\s+(?:position|stance|side|camp|affiliation|allegiance|background)\s+(?:is|was)\s+(?:suspect|questionable|tainted|compromised|wrong|bad|untrustworthy)\b/i,
  /\b(?:the\s+)?(?:source|authorship|byline|signature|provenance|origins?)\s+(?:alone|by\s+itself|on\s+its\s+own)\b/i,
  // [r466] RD-13「We should oppose whatever they put forward.」穿透：
  //   "put forward" 动副形不在 264 行候选集（只收 propose/suggest/support）。
  //   补 put/put forward/bring forward/table + 无宾语形。
  /(?:whatever|anything|everything|no\s+matter\s+what)\s+(?:they|the\s+opposition|the\s+other\s+side|their\s+camp|the\s+rival\s+party)\s+(?:put|puts|put\s+forward|bring|brings|bring\s+forward|table|tables|tabled|advance|advances|advanced|propose|proposes|proposed|suggest|suggests|suggested|support|supports|supported|endorse|endorses|endorsed|back|backs|backed|recommend|recommends|recommended)/i,
  /(?:oppose|opposed|opposes|opposing|reject|rejected|rejects|rejecting|dismiss|dismissed|dismisses|dismissing|resist|resisted|resists|resisting|fight|fights|fought|fighting)\s+(?:whatever|anything|everything|no\s+matter\s+what|all\s+of\s+it)\s+(?:they|the\s+opposition|the\s+other\s+side|their\s+camp|that\s+(?:side|camp|group)|the\s+rival\s+party|he|she|him|her)\s+(?:put|puts|put\s+forward|propose|proposes|proposed|suggest|suggests|suggested|support|supports|supported|say|says|said|do|does|did|offer|offers|offered|table|tables|tabled|bring|brings|brought)/i,
  // [r466] RD-15「Anything supported by that side is unacceptable.」穿透：
  //   腿①缺被动领属形「(supported|backed|endorsed|proposed) by that side」。
  /(?:supported|backed|endorsed|proposed|suggested|put\s+forward|advanced|championed|advocated|sponsored|promoted)\s+by\s+(?:that|this|the\s+other|the\s+rival)\s+(?:side|camp|group|party|faction)/i,
  // [r466] RD-14「His idea is worthless because he is the one who said it.」
  //   穿透：腿①缺「because he is the one who said/proposed it」因果+身份同指形。
  /(?:because|since|as)\s+(?:he|she|they)\s+(?:is|are|was|were)\s+(?:the\s+one|the\s+person|the\s+guy|the\s+man|the\s+woman|who)\s*(?:who\s+)?(?:said|says|wrote|proposed|suggested|came\s+up\s+with|put\s+it\s+forward|coined)/i,
  // [r466] HA-14「They ignored my proposal - a clear sign they are against
  //   me.」穿透：HA_AMBIG_EN 腿①的 ignored my proposal 已被 401 行收，但腿②
  //   HA_VERDICT_EN 缺 "a clear sign they are against me" 推断形。
  // [r466] RD-EN A腿穿透「Of course she is against the policy — she is
  //   a sore loser.」：存量 A 腿只收 loser/resigned/rejected 形，漏
  //   「is against the policy」这种把立场归因于受损身份的前提形。
  /\b(?:is|are|was|were)\s+(?:of\s+course\s+|naturally\s+|obviously\s+|just\s+|only\s+)?(?:against|opposed\s+to|hostile\s+to|critical\s+of|skeptical\s+(?:of|about))\s+(?:the\s+|this\s+|that\s+|any\s+)?(?:policy|policies|plan|plans|decision|decisions|proposal|proposals|rule|rules|reform|reforms|law|laws|measure|measures)\b/i,
  // [r466] RD-EN A腿穿透「He is just a disgruntled ex-employee」：存量
  //   A 腿只收 resigned/rejected/fired，漏 disgruntled ex-X 这个前置
  //   定语 + 前雇员身份的组合（disgruntled ex-employee / disgruntled
  //   former staff / bitter ex-client）。
  /\b(?:disgruntled|bitter|angry|resentful|aggrieved|disaffected|soured)\s+(?:ex-|former\s+|past\s+|retired\s+|departed\s+)?(?:employee|employees|staffer|staff|worker|colleague|colleagues|manager|executive|member|members|client|clients|customer|customers|partner|partners|vendor|vendors|supplier|suppliers|user|users|subscriber|subscribers|student|students|alum|alumni|fan|fans)\b/i,
];

// ─── 族 B 腿②：无条件否定（英文）──────────────────────────────
const RD_DEROGATE_EN = [
  /\b(?:my|our|the)\s+(?:first|gut|initial|knee-?jerk|instinctive)\s+(?:reaction|instinct|impulse|response)\s+(?:is|was)\s+to\s+(?:reject|oppose|object|vote\s+against|vote\s+it\s+down|refuse)\b/i,
  /\b(?:reject|oppose|object|vote\s+against|vote\s+it\s+down|refuse|dismiss|dismiss\s+it|discount\s+it|write\s+it\s+off)\s+(?:it\s+)?(?:out\s+of\s+hand|outright|automatically|by\s+default|without\s+(?:reading|looking|examining|considering|thinking)|sight\s+unseen|unread)\b/i,
  /\b(?:reject|oppose|dismiss|discount|refuse)\s+(?:it\s+)?(?:automatically|by\s+default|instinctively|reflexively|unconditionally|wholesale|en\s+masse)\b/i,
  /\b(?:across\s+the\s+board|blanket|sweeping)\s+(?:rejection|opposition|refusal|dismissal|ban)\b/i,
  /\b(?:no|not\s+any)\s+(?:need|point|reason|use)\s+(?:to|in)\s+(?:read|look\s+at|examine|consider|evaluate|listen\s+to|weigh)\b/i,
  /\b(?:without|not)\s+(?:even\s+)?(?:reading|looking\s+at|examining|considering|evaluating|weighing|hearing)\s+(?:the\s+)?(?:contents?|details?|text|substance|merits|arguments?|proposal|plan)\b/i,
  /\b(?:must|is\s+bound|bound)\s+to\s+be\s+(?:wrong|bad|flawed|defective|bad\s+idea|a\s+bad\s+idea|suspect)\b/i,
  /\b(?:worthless|valueless|beneath\s+consideration|not\s+worth\s+(?:considering|looking\s+at|our\s+time))\b/i,
  /\b(?:suspect|suspect\s+by\s+default|automatically\s+suspect|guilty\s+by\s+association|presumptively\s+invalid)\b/i,
  /\b(?:judge|judging|assess|evaluating)\s+(?:it\s+)?(?:by|on)\s+(?:its\s+)?(?:source|provenance|origin|authorship|who\s+(?:said|wrote|proposed)\s+it)\b/i,
  // [r466] RD-11「Anything they propose must be rejected outright.」穿透：
  //   腿②缺被动形。存量族只收主动形「(we) must reject」。补 must/should
  //   be + 过去分词 与 过去分词 + outright 两组被动形。
  /\b(?:must|should|ought\s+to|has\s+to|have\s+to|needs?\s+to|will)\s+be\s+(?:rejected|dismissed|denied|opposed|vetoed|blocked|refused|ruled\s+out|thrown\s+out|laughed\s+out|shut\s+down)\b/i,
  /\b(?:rejected|dismissed|vetoed|opposed|refused|ruled\s+out|denied|blocked|discarded)\s+(?:outright|automatically|reflexively|on\s+principle|by\s+default|without\s+(?:review|discussion|debate|consideration|a\s+hearing)|sight\s+unseen|on\s+sight)\b/i,
  /\b(?:is|are|must\s+be|should\s+be|has\s+to\s+be)\s+(?:unacceptable|untenable|indefensible|beyond\s+the\s+pale|not\s+worth\s+(?:considering|discussing|engaging|debating|our\s+time)|a\s+non-?starter|dead\s+on\s+arrival)\b/i,
  /\b(?:cannot|can'?t|could\s+not|couldn'?t|should\s+not|shouldn'?t|must\s+not|mustn'?t)\s+be\s+(?:accepted|entertained|considered|taken\s+seriously|trusted|believed|engaged\s+with)\b/i,
  /\b(?:no|not\s+any)\s+(?:need|point|reason|use)\s+(?:to|in)\s+(?:even\s+)?(?:look|listen|respond|reply|engage)\b/i,
  // [r466] RD-13「We should oppose whatever they put forward.」穿透：
  //   RD_DEROGATE_EN 缺 should/ought to + oppose 的无条件对立形。补两组：
  //   ① (we|one) (should|must|ought to) oppose/oppose as a matter of course；
  //   ② (oppose|resist) + whatever/anything + they + put forward。
  /\b(?:we|one|you|people)\s+(?:should|must|ought\s+to|have\s+to|need\s+to|will)\s+(?:always\s+)?(?:oppose|reject|resist|refuse|fight|push\s+back\s+on)\b/i,
  /\b(?:oppose|opposed|opposes|resisting|resist|resists|reject|rejects|fight|fights)\s+(?:as\s+a\s+matter\s+of\s+course|reflexively|automatically|by\s+default|on\s+principle|outright)\b/i,
  /\b(?:our|my)\s+(?:default|reflexive|automatic|instinctive)\s+(?:position|posture|answer|response)\s+(?:should|must|ought\s+to\s+be)?\s*(?:be\s+)?(?:no|oppose|reject|against)\b/i,
  // [r466] RD-11 穿透「Anything they propose must be wrong by default.」：
  //   RD_DEROGATE_EN 缺「must be wrong/untrustworthy by default / guilty
  //   until proven」这类把对方来源本身当作结论依据的形（腿① Anything they
  //   propose 已由存量族覆盖）。补 by-default 族。
  /\b(?:must|is|are|has\s+to\s+be|will\s+be)\s+(?:wrong|false|untrustworthy|bad|suspect|guilty|invalid|worthless|flawed|shady)\s+(?:by\s+default|by\s+definition|automatically|on\s+sight|on\s+principle|until\s+proven\s+otherwise)\b/i,
  /\b(?:wrong|false|untrustworthy|bad|suspect|guilty|invalid|worthless|flawed)\s+(?:by\s+default|until\s+proven\s+otherwise)\b/i,
  // [r466] RD-EN B腿穿透「she is a sore loser」：存量 B 腿只收 cannot be
  //   trusted/not credible 形，漏「sore loser / bad loser」这个把反对
  //   立场直接等同于输不起的人格标签形。
  /\b(?:is|are|was|were|just\s+a|nothing\s+but\s+a|only\s+a|clearly\s+a|obviously\s+a)\s+(?:sore|bad|bitter|poor|terrible|lousy)\s+(?:loser|sport)\b/i,
  /\b(?:sore|bad|bitter)\s+(?:loser|losers)\b/i,
];

// ─── 族 C 腿①：重复/熟悉陈述（英文）──────────────────────────
const IT_REPEAT_EN = [
  /\b(?:heard|read|seen)\s+(?:it\s+)?(?:so\s+often|many\s+times|too\s+many\s+times|countless\s+times|umpteen\s+times|a\s+thousand\s+times|hundreds\s+of\s+times)\b/i,
  // [r465] 「I've heard it repeated so many times」——heard it repeated
  //   形（r465 立项实证穿透）：heard/heard about + it repeated/echoed/said
  //   后接次数，无 it 也可（heard repeated so many times）。
  /\b(?:heard|heard\s+about|hearing)\s+(?:it\s+)?(?:repeated|echoed|restated|recirculated|recycled|parroted|rehashed)\b[^.]{0,30}\b(?:so\s+)?(?:many|countless|numerous|hundreds\s+of|endless)\s+(?:times|times\s+over)\b/i,
  /\b(?:repeated|repeatedly\s+said|circulated|circulating|echoed|rehashed|parroted)\s+(?:so\s+often|many\s+times|endlessly|ad\s+nauseam|countless\s+times)\b/i,
  /\b(?:everywhere|all\s+over|widely)\s+(?:circulating|repeated|repeated|said|claimed|asserted|reported|echoed|bandied)\b/i,
  /\b(?:everyone|everybody|every\s+single\s+person)\s+(?:says?|says\s+so|is\s+saying|keeps\s+saying|repeats?|claims?)\b/i,
  /\b(?:heard|grew\s+up\s+hearing|was\s+raised\s+on)\s+(?:it\s+)?(?:all\s+my\s+life|my\s+whole\s+life|since\s+(?:I\s+was\s+)?(?:a\s+)?(?:child|kid|young|little)|from\s+childhood|since\s+childhood)\b/i,
  /\b(?:familiar|familiarity|heard\s+it\s+so\s+often|so\s+familiar)\s+(?:makes|made|feels|is)\s+(?:it\s+)?(?:true|believable|right|correct|credible)\b/i,
  /\b(?:the\s+more\s+I\s+hear|the\s+more\s+one\s+hears|the\s+more\s+you\s+hear)\s+(?:it|of\s+it)[^.]{0,40}\b(?:the\s+more|true|believable|certain|convinced)\b/i,
  /\b(?:has|have)\s+been\s+(?:repeated|repeatedly\s+stated|circulated|echoed|asserted)\s+(?:for\s+)?(?:decades|years|generations|centuries|ages|so\s+long)\b/i,
  /\b(?:seen|encountered|come\s+across)\s+(?:it\s+)?(?:everywhere|all\s+the\s+time|so\s+many\s+times|countless\s+times)\b/i,
  // [r466] IT-13 穿透「Familiarity alone is enough to make it believable.」：
  //   存量 376 行要求 familiar(ity) + makes/feels/is，文本是「familiarity
  //   alone is enough」——alone 把 familiar 和 is 隔开了，376 不匹配。补
  //   familiarity alone/itself 作腿①的通用形（不限后接动词）。
  /\b(?:the\s+)?(?:sheer\s+|mere\s+|plain\s+)?familiarity\s+(?:alone|itself|by\s+itself|of\s+the\s+idea|with\s+the\s+idea)\b/i,
  /\b(?:how\s+)?(?:familiar|common|widespread|ubiquitous|prevalent|pervasive|everyday)\s+(?:it|this|that|the\s+claim|the\s+idea|the\s+story|the\s+notion)\s+(?:is|has\s+become|feels|seems|sounds)\b/i,
  /\b(?:has|have)\s+been\s+(?:around|circulated|repeated|said|heard|seen)\s+(?:for\s+)?(?:so\s+long|ages|years|generations|decades|forever|as\s+long\s+as)\b/i,
  // [r466] IT-EN A腿穿透「It has been repeated so many times that it
  //   has simply become true.」：存量 383 行族是 repeated + so often|
  //   many times|countless times，「so many times」中间隔着 so，交替
  //   支不匹配。补 so many/so few + times 与 repeated/echoed 的通用形。
  /\b(?:repeated|echoed|recirculated|circulated|parroted|rehashed|restated|asserted|said|claimed|reported)\s+(?:so\s+)?(?:many|few|much|countless|numerous|endless)\s+times\b/i,
  /\b(?:it|this|that|the\s+claim|the\s+idea|the\s+story)\s+(?:has|have)\s+been\s+(?:repeated|echoed|recirculated|circulated|parroted|rehashed|restated|said|asserted)\s+(?:so\s+)?(?:many|countless|numerous|endless)\s+times\b/i,
  // [r466] IT-EN A腿穿透「So often has it been said that by now it
  //   must be true.」：存量 A 腿只收正常语序（has been said/so many
  //   times），漏「So often has it been...」这个把频度副词前置的倒装
  //   强调形。补：So/How often|many times|frequently + 助动词前置。
  /\b(?:so|how)\s+(?:often|many\s+times|frequently|repeatedly|constantly|much)\s+(?:has|have|had|is|are|was|were|do|does|did)\s+(?:it|this|that|the\s+claim|the\s+idea|the\s+story|the\s+rumou?r|they|we|you|i)\s+(?:been\s+)?(?:said|stated|repeated|echoed|claimed|asserted|told|heard|recited|parroted)/i,
];

// ─── 族 C 腿②：真实性结论（英文）──────────────────────────────
const IT_TRUTH_EN = [
  /\b(?:must|has\s+to|has\s+got\s+to|simply\s+has\s+to)\s+be\s+(?:true|correct|right|factual|accurate)\b/i,
  /\b(?:probably|likely|surely|certainly|obviously|clearly|evidently)\s+(?:true|correct|right|accurate|factual)\b/i,
  /\b(?:repetition|frequency|familiarity|sheer\s+repetition)\s+(?:alone|itself|by\s+itself)\s+(?:is|makes\s+it|proves|establishes|is\s+enough)\b/i,
  /\b(?:if|since|because)\s+(?:you|one|everyone|everybody|people)\s+(?:have\s+)?(?:heard|hear)\s+(?:it\s+)?(?:so\s+often|enough\s+times|many\s+times)\s*(?:,\s*)?(?:it\s+)?(?:must|is\s+likely|is\s+probably)\s+(?:to\s+be\s+)?(?:true|correct|right)\b/i,
  /\b(?:proves|proves\s+that|demonstrates\s+that|establishes\s+that)\s+(?:it\s+is|its)\s+(?:true|truth|correctness|accuracy)\b/i,
  /\b(?:cannot|can'?t|couldn'?t)\s+(?:be\s+)?(?:false|wrong|untrue|a\s+lie|fabricated)\b/i,
  /\b(?:subconsciously|unconsciously|instinctively|intuitively)\s+(?:treat|treats|treated|accept|accepts|accepted|assume|assumes|assumed|know|knows)\s+(?:it\s+)?(?:as\s+)?(?:true|fact|correct|given)\b/i,
  /\b(?:deserves|merits|warrants)\s+(?:to\s+be\s+)?(?:believed|accepted|taken\s+seriously|credited)\b/i,
  // [r466] IT-15 英文穿透「The more I hear it, the more certain it becomes.」：
  //   IT_TRUTH_EN 缺「the more ... the more certain/true/right」比较级结论形。
  /\bthe\s+more\s+(?:i|you|one|we)\s+(?:hear|read|see)\s+(?:it|this|about\s+it)\s*,?\s*the\s+more\s+(?:certain|sure|convinced|true|real|right|correct|believed)\b/i,
  /\b(?:becomes|feels|seems)\s+(?:more\s+)?(?:certain|true|real|right|correct|believable|valid|convincing)\s+(?:the\s+more|with\s+each|every\s+time)/i,
  // [r466] IT-EN 穿透（「It has been repeated so many times that it has
  //   simply become true.」）：腿\u2462缺完成体结论形——存量只收
  //   must be true / probably true，漏「has become true / is now a
  //   fact / common knowledge」这种把重复时长当真值累积的结论。
  /\b(?:has|have)\s+(?:simply|just|now|already|therefore|thus|eventually|gradually|naturally|of\s+course|indeed)?\s*(?:become|became|been|proven|shown\s+itself|turned\s+out)\s+(?:to\s+be\s+)?(?:true|truth|fact|correct|right|real|a\s+fact|the\s+truth|common\s+knowledge|conventional\s+wisdom|accepted\s+as\s+fact)\b/i,
  /\b(?:became|becomes|become)\s+(?:simply|just|naturally|therefore|thus|so|increasingly)?\s*(?:true|truth|fact|accepted|accepted\s+as\s+fact|common\s+knowledge|conventional\s+wisdom|self-?evident)\b/i,
  /\b(?:it|this|that|the\s+claim|the\s+story|the\s+idea|the\s+rumou?r)\s+(?:has|have)\s+(?:simply|just|now|already|therefore|thus|indeed)?\s*(?:become|been\s+accepted\s+as|turned\s+into|entered\s+the\s+realm\s+of)\s+(?:a\s+|the\s+)?(?:fact|truth|reality|common\s+sense|common\s+knowledge|conventional\s+wisdom|given)\b/i,
  /\b(?:no\s+longer|not\s+any\s+longer|hardly)\s+(?:just\s+)?(?:a\s+)?(?:rumou?r|claim|assertion|theory|story|myth|opinion)\s+(?:but|—|-)\s+(?:a\s+)?(?:fact|truth|reality|proven)\b/i,
];

// ─── 距离窗（双腿共现）───────────────────────────────────────
const PAIR_ZH = 55;
const PAIR_EN = 140;

// ─── 豁免：源评估纪律（反面行为：要求按内容评估）─────────────
const DISCIPLINE_ZH = /(?:而不是|而非|不应|不该|不能|不要|拒绝)(?:看|看谁|看是谁|凭|以|按)?(?:谁|是谁|哪一方|什么立场|立场|出身|来源|亲疏|远近)(?:提|说|讲|主张)?(?:的|出来)?|(?:内容|本身|事实|证据|论证|道理)(?:本身|自身)?(?:说了算|为准|为准|为准|才算|才是|为准|为准为准)|只看(?:证据|内容|事实|论证|数据|道理|本身)|不以(?:亲疏|远近|立场|出身|身份)(?:决定|定|论)(?:对错|是非|真假)|取决于(?:内容|证据|事实|论证|数据|道理)(?:本身|自身)/;
const DISCIPLINE_EN = /\b(?:on\s+its\s+merits?|evaluated?\s+on\s+its\s+merits?|judged?\s+on\s+its\s+merits?|the\s+merits?\s+of\s+the\s+(?:argument|idea|proposal)|regardless\s+of\s+(?:who|source|origin|where\s+it\s+comes\s+from)|independent\s+of\s+(?:its\s+)?source|not\s+based\s+on\s+(?:who|source)|regardless\s+of\s+the\s+source|on\s+the\s+(?:evidence|facts|content|substance|argument)\s+(?:alone|itself))\b/i;

// ─── 豁免：有数据/证据支持的判断 ──────────────────────────────
const DATA_ZH = /(?:概率|几率|可能性|频率|统计|数据|记录|研究|模型|分析|实验|测量)(?:为|是|显示|表明|达到|等于|约|大约)?[^。，！？；\n]{0,6}[0-9]+(?:\.[0-9]+)?\s*(?:%|％|个百分点|个基点|bp|万分之|千分之|百万分|ppm|倍|次\/|人\/|例\/|起\/)|(?:同行评审|同行评议|盲审|双盲|可重复|重复实验|复制研究|元分析|系统性综述|系统综述|随机对照|对照试验|rct|安慰剂对照|大样本|统计显著|p\s*[<＜]\s*0?\.[0-9]+)/i;
const DATA_EN = /\b(?:probability|likelihood|odds|frequency|rate|chance|percentage)\s+(?:of|is|are|=)\s*[0-9.]+|\b[0-9.]+\s*%\s+(?:probability|likelihood|chance|risk)|\b(?:peer[- ]reviewed|double[- ]blind|randomi[sz]ed|replicat(?:ed|ion)|meta[- ]analys[ie]s|systematic\s+review|statistically\s+significant|p\s*[<＜]\s*0?\.\d+)\b/i;

// ─── 豁免：概念/教学转述 ──────────────────────────────────────
const CONCEPT_ZH = /(?:敌意归因|敌意归因偏误|敌意归因偏差|反应性贬低|反应性贬值|虚幻真效应|虚幻真相效应|虚幻真效应|梅瑞特效应|纯粹接触效应|人际归因|社会认知|认知偏误|认知偏差|行为经济学|心理学|实验心理学|教科书|教材|文献综述|该效应|这种效应|此效应|研究范式)/;
const CONCEPT_EN = /\bhostile\s+attribution\s+(?:bias|effect)|reactive\s+devaluation|illusory\s+truth\s+(?:effect|bias)|mere\s+exposure\s+(?:effect|hypothesis)|cognitive\s+(?:bias|biases)|behavioral\s+(?:economics|psychology)|social\s+(?:cognition|psychology)|textbook|literature\s+review|this\s+(?:effect|bias|phenomenon)\b/i;

// ─── 豁免：否定/纠偏（指出该结构本身是错的）──────────────────
const NEGATION_ZH = /(?:不能|无法|并不能|不可以|不应|不该|不宜)(?:证明|说明|表明|推出|推出|推断|认定|证明|论证|推出|推出|推定)|(?:沉默|沉默不语|不回应|不回复|没回复)(?:本身|自身)?(?:不能|无法|并不能|不足以|说明不了|证明不了)|(?:并不是|绝非|绝非是|不代表)(?:因为|由于|只因)(?:谁|是谁|立场|出身|重复|传播)|(?:重复|传播|听说|熟悉)(?:的次数|程度|多少)(?:与|和)(?:真假|真伪|对错)(?:无关|没有关系|并不等同)|(?:不能|不要|别|勿)(?:仅凭|凭|单凭|以)(?:重复|熟悉|听说|立场|来源|署名|出身)(?:就)?(?:断定|认定|判定|下结论)/;
const NEGATION_EN = /\b(?:does\s+not|doesn'?t|do\s+not|don'?t|cannot|can'?t|couldn'?t|will\s+not|won'?t|is\s+not|isn'?t|are\s+not|aren'?t)\s+(?:establish|prove|demonstrate|show|entail|imply|suffice\s+to\s+establish|constitute\s+(?:proof|evidence)|amount\s+to\s+(?:proof|evidence))\b|\b(?:silence|non-?reply|not\s+responding)\s+(?:alone|by\s+itself)\s+(?:is|does)\s+not\b|\bnot\s+(?:because|simply\s+because)\s+(?:of\s+)?(?:who|source|origin|repetition|familiarity)\b|\b(?:repetition|familiarity|frequency)\s+(?:does\s+not|doesn'?t)\s+(?:establish|prove|make)\b/i;

// ─── 豁免：对冲与疑问 ────────────────────────────────────────
// [r466] HEDGE_ZH 原本收裸「可能」，把 IT-03「不可能有错」/IT-07「不可能
// 是假的」这类**真实性结论**误判为对冲——「不可能 + 负面词（有错/是假/
// 骗人）」在心虫语境里恰恰是虚幻真效应的标准加强句式，不是不确定性表达。
// 修法：HEDGE 用负向前查，命中「不可能/不可能不/绝不会/必然/一定」等
// 结论加强形时不视为对冲（这些词只在与「可能是/也许是」共现时才放行，
// 而那种句子本身已在 NEGATION/HELP 族处理）。
// 裸「可能」保留（「可能是真的」仍是正常对冲），只排除「不可能 + 否定
// 结论」组合。
const HEDGE_ZH = /(?:可能|也许|或许|大概|似乎|好像|说不定|未必|不见得|很难说|待验证|有待|有待核实|有待确认|存疑)/;
function isHedgedZh(text) {
  if (!HEDGE_ZH.test(text)) return false;
  // 「不可能 + 负面结论」不是对冲：不可能有错 / 不可能是假的 / 不可能是谣言 /
  // 不可能骗人的——加强形，放行给 IT 族
  if (/(?:不可能|绝不会|绝对不会|决不会|绝不会|断不会|哪能|岂能)(?:有|是|会|能|错|假|骗|假|谣)/.test(text)) return false;
  if (/(?:一定|肯定|必然|势必)(?:是|为|对|真|正确)/.test(text)) return false;
  return true;
}
const HEDGE_EN = /\b(?:maybe|perhaps|possibly|probably|might|may\s+be|seems?|appears?|could\s+be|arguably|plausibly|not\s+necessarily|debatable)\b/i;
// [r466] IT-11「If you have heard it many times, it is probably true.」穿透：
//   EN 侧守卫与 ZH 侧同病——「probably true / probably correct / surely
//   true」在虚幻真效应里是加强形（「听多了所以大概率为真」是标准论证
//   谬误），不是不确定性对冲。与 isHedgedZh 对称：EN 侧在命中 probably/
//   likely/surely 且与真实性结论词（true|correct|right|fact|real）共现
//   时不视为对冲。
function isHedgedEn(text) {
  if (!HEDGE_EN.test(text)) return false;
  if (/\b(?:probably|likely|surely|certainly|obviously|clearly|evidently|must\s+be|has\s+to\s+be)\s+(?:be\s+)?(?:true|correct|right|real|a\s+fact|factual)\b/i.test(text)) return false;
  if (/\b(?:true|correct|right|real)\s+(?:is\s+)?(?:probably|likely|surely|most\s+likely|almost\s+certainly)\b/i.test(text)) return false;
  if (/\b(?:familiarity|repetition|frequency|sheer\s+repetition)\s+(?:alone|itself|by\s+itself)\s+(?:is|makes|enough)\b/i.test(text)) return false;
  return true;
}
function hasQuestion(text) {
  return text.indexOf('?') >= 0 || text.indexOf('？') >= 0;
}

// ─── 工具 ────────────────────────────────────────────────────
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

// 匹配点左侧否定语境检查（结论腿 raw 内部的「拒绝/反对/否定」等词本身
// 是合法结论词，不进 raw 黑名单——否则「这本身就是一种拒绝」会被误杀）。
const NEG_BEFORE_ZH = /(?:不能|不可|不应|不该|不准|无法|并不是|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|说明不了|证明不了|并不能|绝不会|不再|别|莫|甭|严禁|切忌|勿)[^。，！？；\n]{0,6}$/;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|hardly|barely|far\s+from|stop|refuse\s+to|avoid)\s+(?:\w+\s+){0,3}$/i;
// raw 自身即否定构式（窄名单：只收真正的否定性语义词，不收结论词）
// [r466] 注意：IT 族的腿②「不可能有错 / 不可能是假的 / 错不了」这类短语
// 本身**就是真实性结论**（虚幻真效应的标准句式），「不可能」在这里是
// 模态加强而非否定攻击句——所以 NEG_INSIDE_ZH 绝不收「不可能/绝不会/
// 并非/未必」等模态词，否则 r465 探针的 IT-03/IT-07 双腿齐中却被守卫
// 误杀（r466 实测：A=1,B=1 全被 matchAlive 剥掉）。同理 EN 侧不收
// cannot/couldn't（"can't be false" 是结论不是否定）。
// 只收「这句话并不是…」式的话题否定与英文 hardly/barely/far from 等
// 程度否定。
const NEG_INSIDE_ZH = /(?:并不能|无法|无从|难以|说明不了|证明不了|算不上|并非|不算|尚未)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bdoesn'?t\s+(?:always\s+mean|establish|prove)\b/i;

function matchAlive(text, x) {
  if (NEG_INSIDE_ZH.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 10), x.idx);
  if (NEG_BEFORE_ZH.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 30), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

function collect(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x)) m.push(x);
  }
  return m;
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 三族双腿配对：返回命中的族签名列表
function findSignatures(text, R) {
  const sigs = [];
  const families = [
    {
      key: 'hostile_attribution',
      a: R.HA_AMBIG_ZH || HA_AMBIG_ZH, b: R.HA_VERDICT_ZH || HA_VERDICT_ZH,
      win: PAIR_ZH, lang: 'zh',
      aLabel: '模糊行为', bLabel: '恶意结论',
    },
    {
      key: 'reactive_devaluation',
      a: R.RD_SOURCE_ZH || RD_SOURCE_ZH, b: R.RD_DEROGATE_ZH || RD_DEROGATE_ZH,
      win: PAIR_ZH, lang: 'zh',
      aLabel: '源身份标记', bLabel: '无条件否定',
    },
    {
      key: 'illusory_truth',
      a: R.IT_REPEAT_ZH || IT_REPEAT_ZH, b: R.IT_TRUTH_ZH || IT_TRUTH_ZH,
      win: PAIR_ZH, lang: 'zh',
      aLabel: '重复/熟悉', bLabel: '真实性结论',
    },
    {
      key: 'hostile_attribution',
      a: R.HA_AMBIG_EN || HA_AMBIG_EN, b: R.HA_VERDICT_EN || HA_VERDICT_EN,
      win: PAIR_EN, lang: 'en',
      aLabel: 'ambiguous-act', bLabel: 'hostile-verdict',
    },
    {
      key: 'reactive_devaluation',
      a: R.RD_SOURCE_EN || RD_SOURCE_EN, b: R.RD_DEROGATE_EN || RD_DEROGATE_EN,
      win: PAIR_EN, lang: 'en',
      aLabel: 'source-mark', bLabel: 'blanket-rejection',
    },
    {
      key: 'illusory_truth',
      a: R.IT_REPEAT_EN || IT_REPEAT_EN, b: R.IT_TRUTH_EN || IT_TRUTH_EN,
      win: PAIR_EN, lang: 'en',
      aLabel: 'repetition', bLabel: 'truth-claim',
    },
  ];
  for (const F of families) {
    const am = collect(text, F.a);
    if (am.length === 0) continue;
    const bm = collect(text, F.b);
    if (bm.length === 0) continue;
    for (const a of am) {
      for (const b of bm) {
        if (dist(a, b) > F.win) continue;
        sigs.push({
          family: F.key, lang: F.lang, a: a.raw, b: b.raw,
          aLabel: F.aLabel, bLabel: F.bLabel,
        });
      }
    }
  }
  return sigs;
}

const FAMILY_NAME_ZH = {
  hostile_attribution: '敌意归因偏误',
  reactive_devaluation: '反应性贬低',
  illusory_truth: '虚幻真效应',
};
const FAMILY_NAME_EN = {
  hostile_attribution: 'hostile attribution bias',
  reactive_devaluation: 'reactive devaluation',
  illusory_truth: 'illusory truth effect',
};

const GUIDANCE_BY_FAMILY = {
  hostile_attribution: '敌意归因偏误指在模糊情境下把他人行为系统性地解读为含敌意——沉默=心里有鬼、不回复=拒绝、没表扬=否定、语气平淡=冷暴力。问题在于从模糊证据直接跳到恶意结论，跳过了全部无辜解释（在忙、在思考、没看到、不习惯当众表扬）。请补上中间证据链：是什么具体言行、排除了哪些无辜解释、为什么只能推出敌意而不能推出别的原因；若仅是推测，请明确标注为待核实的假设而非事实断言。',
  reactive_devaluation: '反应性贬误指一旦知道某提议来自对手/不喜欢的一方，就无条件贬低该提议——不读内容先否定、只看署名就否决、凡是他们主张的一概不接受。实证显示同一份方案在「对方提出」标签下的接受率显著低于「己方提出」标签，说明判断被源身份而非内容驱动。请回到内容本身：这条提议的论据是什么、数据是否支持、成本收益如何、反对的具体理由是什么；如果确实无法接受，请给出内容层面的具体缺陷，而非「因为是他提的」。',
  illusory_truth: '虚幻真效应指陈述的熟悉度被误当成真实性证据——「听过太多遍」「到处都在传」「从小就听说」成了「所以是真的」的理由。熟悉感与真实性是两个独立属性：重复是传播力的函数而非真实性的函数，谣言传播一万遍依然是谣言。请补上内容层面的证据链：这个说法的原始出处是哪、经过何种核实、有无可独立验证的一手来源；若无法验证，请明确标注为未经核实的流传说法而非事实。',
};

/**
 * 双腿链签名：源侧信号 × 结论侧信号（三族各一套），同窗共现成签名。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectSourceDerogation(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免组：源评估纪律 / 数据支持 / 概念教学 / 否定纠偏 / 对冲 / 疑问
  if ((R.DISCIPLINE_ZH || DISCIPLINE_ZH).test(text) || (R.DISCIPLINE_EN || DISCIPLINE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.DATA_ZH || DATA_ZH).test(text) || (R.DATA_EN || DATA_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.NEGATION_ZH || NEGATION_ZH).test(text) || (R.NEGATION_EN || NEGATION_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (isHedgedZh(text) || isHedgedEn(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (hasQuestion(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 去重：同一族同一位置段的签名只留一条
  const seen = new Set();
  const uniq = [];
  for (const s of sigs) {
    const k = s.family + '|' + s.a + '|' + s.b;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(s);
  }

  const s = uniq[0];
  const famZh = FAMILY_NAME_ZH[s.family];
  const famEn = FAMILY_NAME_EN[s.family];
  const score = uniq.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'source_derogation',
    severity: Math.round(score * 100),
    score,
    count: uniq.length,
    family: s.family,
    evidence: uniq.slice(0, 3).map(x => (x.lang === 'zh'
      ? famZh + '：「' + x.a + '」×「' + x.b + '」'
      : famEn + ': "' + x.a + '" x "' + x.b + '"')),
    details: s.lang === 'zh'
      ? '信息源贬低-' + famZh + '(' + uniq.length + '处: 「' + s.a + '」×「' + s.b + '」，源属性被用来替代内容评估)(zh)'
      : 'source derogation-' + famEn + '(' + uniq.length + 'x: "' + s.a + '" x "' + s.b + '", source substituted for content)(en)',
    guidance: GUIDANCE_BY_FAMILY[s.family],
    tags: ['psychology', 'cognitive-bias', 'source-derogation', s.family, 'evidence-discipline', 'argument-evaluation'],
  };
}

module.exports = {
  detectSourceDerogation,
  __internals: () => ({
    HA_AMBIG_ZH, HA_VERDICT_ZH, RD_SOURCE_ZH, RD_DEROGATE_ZH,
    IT_REPEAT_ZH, IT_TRUTH_ZH,
    HA_AMBIG_EN, HA_VERDICT_EN, RD_SOURCE_EN, RD_DEROGATE_EN,
    IT_REPEAT_EN, IT_TRUTH_EN,
    PAIR_ZH, PAIR_EN,
    DISCIPLINE_ZH, DISCIPLINE_EN, DATA_ZH, DATA_EN,
    CONCEPT_ZH, CONCEPT_EN, NEGATION_ZH, NEGATION_EN,
    HEDGE_ZH, HEDGE_EN,
    findSignatures,
  }),
};
