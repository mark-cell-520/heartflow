/**
 * src/cost-externalization.js — 「代价转移」检测器（第 75 个判别维度）
 *
 * [v6.8.23] 第 523 轮新增。固定 scout 池连续多轮空（r522 落盘
 * /tmp/hf-scout-20261006-1040.txt：「未探测到新的零覆盖族」），
 * 按 r505/r517/r520 先例自建族级探针 + 心虫 decision 本体选向：
 *   · scripts/round-522-family-probe.js 扫 3 族（A 历史共识族
 *     良性误伤 2/6 不可用；B 监督重构族 5/8 穿过但缺口仅 62%；
 *     C 代价转移族 6/7 穿过、良性 0/6 唯一合格）；
 *   · scripts/round-522-cost-expansion.js 扩样复测 **13/14 攻击
 *     穿过硬闸门（93% 缺口）、良性 0/8 误伤**，13 条穿过样本
 *     findings 全空、无任何维度摸到——确认真零覆盖族；
 *   · scripts/round-523-decide.js（HeartFlowDecision 本体三候选）
 *     选 C：cost_externalization 0.84 > B 监督重构 0.82 >
 *     A 历史共识 0.79，identity alignment 80%。
 *
 * 辨别的族：「代价转移」——用「代价/风险反正由别人承担」来消解对方
 * 表态或反对的资格。说话人自己（或他代表的决策方）是收益方，把成本、
 * 风险、后果统统记在第三方账上，于是「你又不用付出什么，凭什么反对」
 * 「亏的又不是你的钱」——**反对的理由不是被驳倒了，而是被宣布为
 * 与说话人无关的成本结构外议题**。这是一种结构性的成本错配话术：
 * 它不需要证明方案好，只需要证明「疼的不是你」。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**代价疏离 × 资格消解**同句共现（又不是你付 + 你
 *     凭什么反对/站着说话不腰疼）；
 *   · 路由②（次）：**代价疏离 × 轻量动作**同句共现（别人扛风险 +
 *     你点个头就行/你只管签字）。
 *
 * 为什么现有维度拦不住（r522 逐条实测边界）：
 *   · victim_blaming 管「受害者自己也有责任」，落点是**受害者归因**；
 *     本族代价甚至不在受害者身上——「亏的又不是你的钱」里听话人
 *     不是受害者也不是责任人，说话人是把他从代价结构里摘出去。
 *   · gaslighting 管「你对现实的感知是错的」，落点是认知否定；
 *     本族不碰认知，只改成本归属。
 *   · bad_faith 管「论证姿态不诚实」，落点是态度；本族是**结构性**的
 *     代价错配——话可能完全真诚，但账算错了地方。
 *   · agency_deflection/procedural_burden 管把责任转嫁给抽象程序；
 *     本族是把责任转嫁给**具体第三方人群**，且目的是取消听话人的
 *     发言资格，不是推迟答复。
 *
 * → verify 级：被宣布为「与你无关」的代价，恰恰是最需要被核算的
 *    部分。要求提出方给出具体的成本归属测算：谁付、付多少、何时付，
 *    而非用「反正你又不付」跳过核算。
 *
 * 明确不判的（豁免——正当的成本核算与风险共担表述）：
 *   · 成本核算/量化表述：我来量化具体金额、每人成本列出来
 *   · 风险共担/分担机制：风险共担已在合同写清、按比例分担
 *   · 第三方已明确同意/知情的授权转移
 */

'use strict';

// ─── B1: 代价疏离（把说话人或听话人从代价结构里摘出去）──────────
const DISTANCE_ZH = new RegExp([
  // 「又不是你付/你出/你承担」
  '(?:又|才|本来|压根|根本|未必)?(?:不|没)?(?:是)?(?:你|你们|您)?(?:付|出|掏|承担|扛|担|负责|受)',
  // 「亏的又不是你的钱/收益与你无关」
  '(?:亏|赔|赚|损失|代价|成本|风险|后果|压力|麻烦)(?:的)?(?:又|才|本来)?(?:不|没)?(?:是)?(?:你|你们|您)?(?:的)?(?:钱|事|责任|问题|锅|账)',
  // 「影响的/受苦的/受累的又不是你」
  '(?:影响|受苦|受累|吃亏|受罪|承担|承受|背负)(?:的)?(?:又|才|本来)?(?:不|没)?(?:是)?(?:你|你们|您)',
  // 「你又不承担后果/与你无关」
  '(?:你|你们|您)(?:也)?(?:不|没|无需|不必)(?:需要)?(?:承担|承受|背负|负责|付|出)(?:任何)?(?:的)?(?:后果|责任|代价|成本|风险|损失|结果)',
  '(?:代价|成本|风险|后果|损失)(?:又|才|本来)?(?:不|没)(?:落在|落在|由)(?:你|你们|您)(?:身上|头上|手里)',
  // 「你不腰疼/站着说话不腰疼」
  '(?:站着说话)?(?:不)?腰疼',
  // 「疼的不是你/痛不在你身上」
  '(?:疼|痛|苦|累|难)(?:的)?(?:不|又)?(?:是|在)(?:你|你们|您)',
  // 「后果由别人扛/别人承担」
  '(?:后果|风险|代价|成本|责任|损失|压力|麻烦)(?:由|归|让|交给)(?:别人|他人|其他人|他们|底下|下属|大家|团队|用户|客户|社会|公众)(?:来)?(?:扛|承担|承受|背负|负责|付|买单|接盘)',
  // 「反正是别人吃亏/别人受罪」
  '(?:反正|总之|说白了)(?:是)?(?:别人|他人|其他人|他们|底下|下属|用户|客户)(?:吃亏|受罪|受累|受苦|倒霉|倒霉蛋|买单|接盘|背锅|担着)',
  // 「你不担/不用担」
  '(?:你|你们|您)(?:也)?(?:不|没)(?:用)?担(?:这个|任何)?(?:责任|风险|后果|干系|事儿)',
].join('|'));

const DISTANCE_EN = new RegExp([
  // 「you do not bear the cost」
  '\\byou\\s+(?:do\\s+not|do not|don t|dont)\\s+(?:have\\s+to\\s+)?' +
    '(?:bear|carry|shoulder|absorb|pay|face|take\\s+on)\\s+(?:the\\s+|any\\s+)?' +
    '(?:cost|costs|consequence|consequences|risk|risks|fallout|burden|price)',
  // 「don't bear/carry...」（撇号在归一化后可能丢失，兼容 don t/dont 形）
  '\\b(?:do\\s+not|do not|don t|dont)\\s' +
    '(?:bear|carry|shoulder|absorb|pay|face|take\\s+on)\\s+(?:the\\s+|any\\s+)?' +
    '(?:cost|costs|consequence|consequences|risk|risks|fallout|burden|price)',
  // 「it is not your cost / the cost is not yours」
  '\\b(?:it|this|that|the\\s+\\w+)\\s+is\\s+not\\s+(?:your|yours)\\s+' +
    '(?:cost|consequence|risk|problem|burden|responsibility|call)',
  // 「the losses are not yours」（名词在 is/are 之前的复数主语形，
  // 与「it is not your cost」互为镜像——成本名词出现在 are not yours 之前）
  '\\b(?:the\\s+|a\\s+|these\\s+|those\\s+)?(?:\\w+)\\s+(?:is|are)\\s+not\\s+' +
    '(?:your|yours)\\b',
  // 「costs you nothing」
  '\\b(?:costs?|cost)\\s+you\\s+(?:nothing|next\\s+to\\s+nothing|almost\\s+nothing)',
  '\\byou\\s+(?:get|receive)\\s+(?:nothing|no\\s+consequence)s?\\s+(?:out\\s+of|from)\\s+(?:it|this|that)',
  // 「not your job to worry about it」（决策事项与听者责任脱钩。它在
  // DISTANCE_EN 提供疏离证据，同时是 LIGHT_EN 的「放下」动作证据——
  // 两处都列是有意的：共现路由需要疏离侧与动作侧各自有证）
  '\\bnot\\s+your\\s+(?:job|place|duty|role|responsibility)\\s+to\\s+' +
    '(?:worry|care|worry\\s+about|decide|object|question|concern\\s+yourself)',
  // 「nothing to worry about / no need to worry」（同上，放下动作）
  '\\b(?:there\\s+is\\s+)?(?:nothing|no\\s+need|nothing\\s+much)\\s+to\\s+' +
    '(?:worry|fret|stress)\\s+about',
  '\\bno\\s+need\\s+to\\s+(?:worry|fret|stress|be\\s+concerned|think\\s+twice)',
  '\\b(?:the\\s+)?(?:cost|costs|consequence|consequences|risk|risks|burden|fallback|fallout)\\s+' +
    '(?:is|are|falls|fall|sits|sits)\\s+(?:on\\s+)?(?:them|someone\\s+else|others)',
  // 「someone else carries / shoulders / bears」
  '\\b(?:someone|somebody)\\s+else\\s+(?:carries|shoulders|bears|absorbs|takes|pays\\s+for|eats)',
  // 「not yours to worry about / not your problem」
  '\\bnot\\s+(?:your|yours)\\s+(?:problem|worry|concern|burden|responsibility|fault)',
  '\\bnot\\s+yours\\s+to\\s+(?:worry\\s+about|carry|bear|worry)',
  // 「easy for you to say when ...」
  '\\b(?:easy|nice|fine)\\s+for\\s+you\\s+to\\s+(?:say|talk|opine|object|complain|argue)',
  // 「you only need to approve / you just sign」
  '\\byou\\s+(?:only\\s+)?(?:just\\s+)?(?:need\\s+to|have\\s+to)?\\s*' +
    '(?:approve|sign|nod|rubber-?stamp|okay|ok)\\b',
  // 「nothing lands on you / fallout lands elsewhere」
  '\\b(?:none\\s+of\\s+the\\s+)?(?:fallout|consequence|consequences|cost|risk)\\s+' +
    '(?:lands|lands|falls|will\\s+land)\\s+on\\s+you',
  // 「they carry the risk」
  '\\bthey\\s+(?:carry|bear|shoulder|absorb|take\\s+on|eat)\\s+(?:the\\s+)?' +
    '(?:risk|risks|cost|consequence|consequences|burden)',
  // 「they pay the price」
  '\\b(?:they|them|others|someone\\s+else)\\s+' +
    '(?:will\\s+)?(?:pay|pays)\\s+(?:the\\s+)?(?:price|bill|cost)',
  // 「you are not the one who ...」
  '\\byou\\s+(?:are|are\\s+not)\\s+(?:not\\s+)?the\\s+one\\s+(?:who|that)\\s+' +
    '(?:pays|suffers|bears|loses|carries|deals\\s+with)',
].join('|'), 'i');

// ─── B2a: 资格消解（把反对的理由宣布为说话人无权提出的议题）────────
const DISMISS_ZH = new RegExp([
  // 「凭什么反对/插嘴/说三道四」
  '(?:凭什么|有什么资格|你怎么敢|轮得到你)(?:反对|反对|抗议|异议|质疑|插手|干预|指手画脚|说三道四|评头论足|插嘴|多嘴|过问|评价)',
  // 「你就别指手画脚/少抬杠」（无「凭什么」前缀的资格消解形，
  // 与代价疏离共现才是本族——实测样本 #6 正漏在此）
  '(?:你|你们)?(?:就|也|还是)?(?:别|不要|少|甭)(?:指手画脚|说三道四|评头论足|指指点点|挑刺|抬杠|插嘴|多嘴|干预|插手|否决|反对)',
  // 「你当然无所谓/你说了不算」
  '(?:你|你们)(?:当然|自然|肯定|必然)(?:无所谓|不在意|不当回事|说得轻松|说得好听|站着说话)',
  // 「你不腰疼/说风凉话」
  '(?:站着说话)?(?:不)?腰疼',
  '(?:说风凉话|看热闹|说便宜话|泼冷水|唱反调)',
  // 「你当然说得轻松/说得好听」（把反对降格为不担代价者的轻松话）
  '(?:你|你们)(?:当然|自然|肯定|必然)(?:说得|讲得|听着)(?:轻松|轻巧|容易|好听)',
  '(?:说得|讲得)(?:倒是|还挺)(?:轻松|轻巧|容易|简单)',
  // 「别指手画脚/说三道四」已在上一支，此处补「你少」形
  '(?:你|你们)(?:少|别|甭)(?:指手画脚|说三道四|评头论足|指指点点|挑刺|抬杠|插嘴|多嘴|过问)',
  // 「反对无效/不用你管/别指手画脚」
  '(?:反对|异议|质疑)(?:无效|不算|不当真|没用)',
  '(?:不用你|轮不到你|用不着你|哪用你|别)(?:管|操心|担心|着急|过问|插手|干预|同意|批准|点头)',
  // 「你管不着/管好自己」
  '(?:你|你们)(?:管不着|管不了|少管|先管好)(?:自己|闲事|这些)',
  // 「较什么真/何必较真」
  '(?:较|计较)(?:什么|哪门子)?真',
  // 「你又不懂/不在其位」
  '(?:你|你们)(?:又|压根|根本)(?:不懂|不明白|不了解|不在其位|不谋其政)',
  // 「等你…再说」
  '(?:等)(?:你|你们)(?:先|也|真的)?(?:担|负|付|吃)(?:过|了|上)(?:亏|苦|损失|代价|苦头)(?:再|才)',
  '(?:等)(?:你|你们)(?:坐|当)(?:到|上)(?:我|这个|那个|这)(?:位置|位子|职位)(?:再|才)',
  // 「先…再说」式资格门槛
  '(?:先)(?:把|将)(?:自己|自家)(?:的)?(?:事|摊子|一亩三分地|饭碗)(?:管好|弄好|搞清楚)(?:再|才)',
].join('|'));

const DISMISS_EN = new RegExp([
  // 「who are you to object」
  '\\bwho\\s+are\\s+you\\s+to\\s+(?:object|complain|question|judge|second-?guess|talk)',
  // 「you have no standing to」
  '\\byou\\s+(?:have|have\\s+got)\\s+no\\s+(?:standing|right|say|business|place)\\s+(?:to|in)',
  // 「not yours to question」
  '\\bnot\\s+yours\\s+to\\s+(?:question|object|decide|judge|weigh\\s+in\\s+on)',
  // 「what grounds do you have to」
  '\\bwhat\\s+(?:grounds|right|basis)\\s+(?:do\\s+you\\s+have|have\\s+you\\s+got)\\s+to',
  '\\bon\\s+what\\s+(?:grounds|basis)\\s+(?:do\\s+you|would\\s+you)\\s+object',
  // 「it is easy for you to say」族已在 DISTANCE_EN，此处补否定式资格形
  '\\bhow\\s+would\\s+you\\s+know\\b',
  '\\byou\\s+(?:would|will|do)\\s+not\\s+know\\s+(?:any|the)\\s+(?:better|first\\s+thing)',
  // 「so do not worry」/「no need to worry」（轻放动作：把沉重事项当作
  // 无需过问的小事放下，与代价疏离共现即本族——r523 实测此形最常见）
  '\\b(?:so|then)?\\s*(?:do\\s+not|don t|dont)\\s+(?:worry|fret|care|stress|be\\s+concerned)',
  '\\bno\\s+need\\s+to\\s+(?:worry|fret|stress|be\\s+concerned|think\\s+twice)',
  '\\bnothing\\s+to\\s+(?:worry|fret)\\s+about',
  '\\bdo\\s+not\\s+(?:even\\s+)?(?:think\\s+twice|look\\s+any\\s+closer|question\\s+it)',
  // 「easy for you to opine/say/talk object complain argue」（资格消解：
  // 不担代价者的表态被降格为轻松话——与 DISTANCE_EN 的 easy-for-you-to-say
  // 支形状重叠是有意的：那支提供疏离证据，本支提供资格消解证据）
  '\\b(?:easy|nice|fine|simple|cheap)\\s+for\\s+you\\s+to\\s+' +
    '(?:say|talk|opine|object|complain|argue|judge|second-?guess)',
  // 「none of the fallout lands on you so ...」（代价不落在听者身上，
  // 于是他的意见不具备参考价值——r523 实测英文样本最常见形状，
  // 与 DISTANCE_EN 的 lands-on-you 支互为镜像））
  '\\b(?:none\\s+of\\s+the\\s+)?(?:fallout|consequence|consequences|cost|risk)\\s+' +
    '(?:lands|falls|will\\s+land)\\s+on\\s+you\\s*,?\\s*(?:so|thus|therefore|hence)',
  // 「costs you nothing so ...」（同上：零成本 → 表态无分量。
  // 兼容分号/句号分隔（样本为 `;` 而非 `,`，统一用 [;,]）。
  // r524 修：`;` 形漏检是因为 `the risk sits elsewhere` 落在支末，
  // 连接词 alternatives 不含它——分三种形状：
  //   ① 标准连接词（so/therefore）
  //   ② 分号后接一句新独立断言（`; the risk ...`）
  //   ③ 句末无连接词（`costs you nothing.` 收尾）
  '\\b(?:costs?|cost)\\s+you\\s+(?:nothing|next\\s+to\\s+nothing|almost\\s+nothing)' +
    '\\s*[;,]?\\s*(?:so|thus|therefore|hence|and\\s+the\\s+risk|the\\s+risk|the\\s+downside|the\\s+fallout)',
  // 「costs you nothing」句末形（零成本审批，与上文分离，不必共现）；
  // 代价疏离已在 DISTANCE_EN 命中，本形提供资格消解侧证据
  '\\b(?:costs?|cost)\\s+you\\s+(?:nothing|next\\s+to\\s+nothing|almost\\s+nothing)\\b',
  // 「none of the fallout lands on you」（结尾无连接词的同形：
  // 代价不落 + 轻放表态，无需 so 也构成本族——实测样本无连接词形）
  '\\b(?:none\\s+of\\s+the\\s+)?(?:fallout|consequence|consequences|cost|risk)\\s+' +
    '(?:lands|falls|will\\s+land)\\s+on\\s+you\\b',
  // 「not your job to worry about the consequences」（责任脱钩即资格脱钩：
  // 事项被宣布为听者责任范围之外，他的关注随之失效）
  '\\bnot\\s+your\\s+(?:job|place|duty|role|responsibility|remit)\\s+to\\s+' +
    '(?:worry|care|concern\\s+yourself|object|question|decide)',
  // 「your opinion carries no weight」
  '\\byour\\s+(?:opinion|view|take|input|voice|objection)\\s+' +
    '(?:does|do)\\s+not\\s+(?:carry|matter|count|have\\s+weight)',
  // 「you would not understand」（认知资格取消）
  '\\byou\\s+(?:would|will)\\s+not\\s+(?:understand|get\\s+it|grasp\\s+it)',
  // 「all you need to do is approve/sign」（审批轻量化，与 LIGHT_EN 的
  // all-you-have-to-do 支互为镜像：need 形）
  '\\ball\\s+you\\s+(?:need|got)\\s+to\\s+do\\s+is\\s+' +
    '(?:sign|approve|nod|say\\s+yes|rubber-?stamp)',
  '\\bso\\s+(?:keep\\s+out|stay\\s+out|mind\\s+your\\s+own\\s+business|butt\\s+out)',
  '\\bmind\\s+your\\s+own\\s+(?:business|affairs)',
  // 「your objection is irrelevant」
  '\\byour\\s+(?:objection|opposition|concern|complaint|protest)\\s+' +
    '(?:is|is\\s+)?(?:irrelevant|moot|pointless|beside\\s+the\\s+point|invalid)',
  '(?:objection|opposition|protest|complaint)s?\\s+(?:is\\s+)?(?:irrelevant|moot|pointless)',
  // 「why would you object / why are you opposed」（以代价疏离取消反对资格）
  '\\bwhy\\s+(?:would|should|do)\\s+you\\s+(?:object|oppose|complain|care|worry|protest)',
  '\\bwhy\\s+(?:would|do)\\s+you\\s+(?:even\\s+)?(?:care|object|oppose)',
  // 「what do you have to lose / nothing to lose」族
  '\\bwhat\\s+do\\s+you\\s+(?:have\\s+)?to\\s+(?:lose|risk)',
  '\\byou\\s+(?:have|have\\s+got)\\s+(?:nothing|nothing\\s+much)\\s+to\\s+(?:lose|risk)',
  '\\bthat\\s+(?:is\\s+)?none\\s+of\\s+your\\s+(?:concern|business)',
].join('|'), 'i');

// ─── B2b: 轻量动作（把沉重审批压缩成一个不需要思考的动作）────────
const LIGHT_ZH = new RegExp([
  // 「你点个头/签个字就行」
  '(?:你|你们)(?:只|就|只须|只需|只要)(?:要)?(?:点|点一)(?:个)?(?:头|脑袋|同意|批准)',
  '(?:你|你们)(?:只|就|只须|只需|只要)(?:要)?(?:签|签个|签一)(?:个)?(?:字|名)',
  // 「你只管/你只需要」
  '(?:你|你们)(?:只|就|只须|只需|只要)(?:要)?(?:管|需要|负责)(?:同意|批准|点头|签字|放行|盖章)',
  // 「你签个字就行/签一下就好」（祈使式轻量审批：无「只/就」前缀的
  // 命令形，句尾带「就行/就好/即可」——r524 实测样本漏在此）
  '(?:你|你们|您)(?:签|签个|签一|批|点)(?:个|一|下|头)?(?:字|名|头|同意|批准)(?:就行|就好|即可|便可|就行了|就行了吗)?',
  // 「你说了算/你一支笔」
  '(?:你|你们)(?:说|讲)(?:了)?(?:算|了算|算数)',
  '(?:一|这)(?:支|张)(?:笔|章)(?:签|盖)(?:下去|了)',
  // 「反正不用你动手/你不用管过程」
  '(?:反正|总之)(?:不|也)?(?:用|需)(?:你|你们)(?:动手|出面|操心|跑腿|经手|操作)',
  // 「走个形式/过场/签一下而已」
  '(?:走|走个|走一)(?:个)?(?:形式|过场|流程|程序)(?:而已|就行|就好|就行了)?',
].join('|'));

const LIGHT_EN = new RegExp([
  // 「you just need to nod / sign」
  '\\byou\\s+(?:just\\s+)?(?:only\\s+)?(?:need\\s+to|have\\s+to|simply)?\\s*' +
    '(?:nod|give\\s+the\\s+nod|sign|sign\\s+off|rubber-?stamp|approve|okay|ok)',
  // 「a formality / a rubber stamp / a formality only」
  '\\b(?:it|this|that|just)\\s+(?:is\\s+)?(?:a\\s+)?' +
    '(?:formality|rubber\\s?stamp|formality\\s+only|mere\\s+formality)',
  '\\bjust\\s+a\\s+(?:formality|signature|sign-?off|rubber\\s?stamp)',
  // 「all you have to do is sign」
  '\\ball\\s+you\\s+(?:have\\s+to|need\\s+to|got\\s+to)\\s+do\\s+is\\s+' +
    '(?:sign|approve|nod|say\\s+yes|rubber-?stamp)',
  // 「just say yes / just approve」
  '\\bjust\\s+(?:say|give)\\s+(?:yes|the\\s+nod|the\\s+go-?ahead)',
  // 「just sign here / sign right here」（祈使式轻量审批：here 方位
  // 收尾形，r524 实测样本漏在此——LIGHT_EN 其余支都要求 just + 动词）
  '\\b(?:just\\s+)?(?:sign|sign\\s+off)\\s+(?:right\\s+)?here\\b',
  // 「you do not even need to look」
  '\\byou\\s+(?:do\\s+not|do not|don t)\\s+even\\s+(?:need\\s+to\\s+)?' +
    '(?:read|look|check|review|understand)',
  // 「sign away」
  '\\bsign\\s+(?:it\\s+)?away\\b',
].join('|'), 'i');

// ─── 豁免：正当的成本核算、分担与知情同意───────────────────────
// 判据边界：本族判的是「用代价疏离去消解资格」。反过来，主动把成本
// 算清楚、明确说清谁付多少、或说明第三方已知情同意的，是正当的
// 风险管理表述，不判。
const EXEMPT_ZH = new RegExp([
  // 成本核算/量化
  '(?:我|我们|这里|下面)(?:来|先|已经|要)(?:核算|量化|测算|估|计算|列)(?:一下)?(?:成本|代价|风险|损失|金额|费用|敞口)',
  '(?:每人|每人|每个|各自)(?:的)?(?:成本|代价|出资|分摊)(?:是|为|约)',
  '(?:我)(?:把|将)(?:每个|各|相关)(?:人|方|部门)(?:的)?(?:成本|代价|风险|敞口|分摊)(?:列|算|列出来|摊)',
  // 风险共担/按比例分担
  '(?:风险|成本|代价|损失)(?:共担|分担|分摊|按比例|按份额|按出资)',
  '(?:由|按)(?:合同|协议|条款|章程)(?:约定|规定|载明|写)(?:的)?(?:分担|承担|比例|份额)',
  // 第三方知情/同意
  '(?:已|已经)(?:取得|获得|征得)(?:第三方|相关方|受影响)(?:的)?(?:同意|知情|授权|确认|婉拒|首肯)',
  '(?:相关方|受影响)(?:已|已经)(?:知悉|知情|同意|确认|否决)',
  // 明确说明我方（而非第三方）承担
  '(?:由|这部分|该部分)?(?:我|我们|我方|本公司)(?:承担|负责|兜底|兜着|买单)',
  // 「我代为争取补偿」类接住动作
  '(?:我|我们)(?:来|会|将)(?:争取|申请|争取)(?:补偿|赔偿|赔付|兜底)',
].join('|'));

const EXEMPT_EN = new RegExp([
  // quantify / map the cost
  '\\b(?:i|we)\\s+(?:will|can|shall|am\\s+going\\s+to|let\\s+me)\\s+' +
    '(?:quantify|map|break\\s+down|cost\\s+out|spell\\s+out|list)\\s+' +
    '(?:the\\s+|who\\s+bears\\s+)?(?:cost|costs|exposure|risk|burden|share)',
  '\\blet\\s+(?:me|us)\\s+(?:quantify|map|break\\s+down|list)\\s+.{0,40}?(?:cost|risk|exposure|burden)',
  // shared / proportional
  '\\b(?:cost|costs|risk|risks|burden|loss)s?\\s+(?:are|is)\\s+' +
    '(?:shared|split|allocated|borne|proportional|spelled\\s+out)',
  '\\bshared\\s+(?:proportionally|equally|as\\s+spelled\\s+out)\\s*',
  '\\b(?:per|under|as\\s+set\\s+out\\s+in)\\s+(?:the\\s+)?(?:contract|agreement|terms|MOU|clause)',
  // third party consent
  '\\b(?:affected|third|relevant)\\s+(?:party|parties)\\s+' +
    '(?:have|has)?\\s*(?:consented|agreed|been\\s+informed|signed\\s+off)',
  // we bear it
  '\\b(?:i|we)\\s+(?:will|shall|am\\s+going\\s+to|can)\\s+(?:bear|carry|shoulder|absorb|take\\s+on)\\b',
  '\\bwe\\s+(?:will\\s+)?(?:make\\s+)?(?:them\\s+)?whole\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCostExternalization(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 正当成本核算/分担/知情同意 → 不判
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const distance = DISTANCE_ZH.test(text) || DISTANCE_EN.test(text);
  if (!distance) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 路由①：代价疏离 × 资格消解同句共现
  if (DISMISS_ZH.test(text) || DISMISS_EN.test(text)) {
    return {
      hit: true,
      score: 0.72,
      count: 1,
      detail: isZh ? '代价转移×取消表态资格(zh)' : 'cost-externalization×standing(en)',
    };
  }

  // 路由②：代价疏离 × 轻量动作同句共现
  if (LIGHT_ZH.test(text) || LIGHT_EN.test(text)) {
    return {
      hit: true,
      score: 0.7,
      count: 1,
      detail: isZh ? '代价转移×审批轻量化(zh)' : 'cost-externalization×light-sign(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkCostExternalization,
  // [r523] 供守卫测试做「置空指定支必须变红」的变异注入用。
  // 导出句柄而非副本：变异脚本替换这些 const 指向即可让命中归零。
  __internals: () => ({ DISTANCE_ZH, DISTANCE_EN, DISMISS_ZH, DISMISS_EN, LIGHT_ZH, LIGHT_EN, EXEMPT_ZH, EXEMPT_EN }),
};
