/**
 * src/loss-aversion.js — 「损失厌恶 / 得失权重失衡」检测器
 * （provisional 第 239 个判别维度，r251 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r251-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r250：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy/budget_value_conflation/average_marginal_
 * conflation/conditional_transposition/anonymous_source/broken_window/
 * automation_bias/p_hacking/appeal_to_future/effort_justification/
 * mental_accounting/winners_curse/tragedy_of_commons/illusion_of_control/
 * disposition_effect/endowment_effect/anchoring_effect/present_bias/
 * framing_effect/peak_end_rule/law_of_small_numbers/prosecutors_fallacy/
 * inverse_gamblers_fallacy/count_rate_conflation/significance_effect_size
 * 二十五个已起草未接线维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS
 * 登记序重排）
 *
 * [r251 立项] 零命中探针 coordination/agent4/probes/r251-probe-round1.js
 * ~round4-prototype.js（v6.8.145，hf.gate() 全量 findings 口径，过滤
 * {dimension:'none'} 哨兵）。五候选四轮定夺：
 *   · A 机会成本忽视：攻击穿透 10/10（round1）→ 11/12（round2），疑难
 *     良性维度级误伤 1/8；邻接 5/6 穿透（1 条被 sunk_cost_coercion 正确
 *     代拦）；落选原因是「单一收益锚」族与正当的「资源已沉没、增量决策」
 *     话语同形（增量成本分析在经济学里正是标准做法），纯规则无法稳定
 *     区分「不计替代」与「按增量成本决策」；
 *   · B 合成谬误（经济学形态）：攻击穿透 7/9，且疑难良性 2/7 维度级
 *     误伤（概念教学句「合成谬误提醒我们」被既有维度误拦）——家族与
 *     whole_part_transfer（第 170 维）领地重叠度实测过高，独有空间窄；
 *   · C 指数增长低估：攻击穿透 5/9，误伤最重，且与 false_precision /
 *     sorites_fallacy 领地交叉；
 *   · **D 损失厌恶：攻击穿透 9/9（round1）→ 12/12（round2）→ 13/14
 *     （round3，唯一被拦的一条由既有维度 fallacies 代拦，非本族领地），
 *     疑难良性维度级误伤 1/8 + 4/14 且**全部来自既有维度**（agency_
 *     deflection / contradiction / empty_answer / collider_bias）而非
 *     本族判据，邻接领地 6/6 穿透零重叠**；
 *   · E 现状偏好：攻击穿透 8/9 → 11/12 → 13/14，疑难良性误伤 2/14，
 *     但「能跑就不要动」式工程常识与本族攻击句结构同形，且该族会直接
 *     冲击双向守卫共享的误拦基线（301/326）——运维/技术良性语料里
 *     「先维持现状」「将就用」出现频率远高于损失厌恶族。
 * D 以「最高穿透 12/12 + 邻接领地零重叠 + 对共享误拦基线冲击最小」
 * 三项胜出，全四轮攻击穿透合计 34/35。
 *
 * 外部来源：arXiv 六次查询，「"exponential growth bias"」引号查询命中
 * 1 篇真实相关文献（"From Catastrophic to Concrete: Reframing AI Risk
 * Communication for Public Mobilization"——指数增长偏差的风险沟通），
 * 其余五次被 API 拆成 OR，返回量子度量/张量网络/电力调度/几何拓扑等
 * 无关文献；「"fallacy of composition"」引号查询 arXiv 空返（0 条），
 * GitHub 命中 4 个仓库（arielwinn/Fallacy_of_composition、
 * arielwinn/Fallacy-of-composition、scottkarr/IS607-final、
 * scottkarr/IS606-final）全部是 0 star 的学生课程作业，无实现；
 * 「"loss aversion" fallacy rule」「"status quo bias" rule engine」
 * 「"opportunity cost" neglect logical fallacy」GitHub 全部 total_count=0；
 * Semantic Scholar 六次连续 429。**零纯规则文本检测实现**，按既有形态
 * 自建，判据为心虫自有纯规则实现，家族定义取自前景理论（prospect
 * theory）对损失厌恶的标准表述：损失与等额收益在心理权重上不对称，
 * 损失的权重大约是收益的两倍，导致决策偏离期望值最优。
 *
 * 辨别的族：损失厌恶 / 得失权重失衡（loss aversion / gain-loss
 * asymmetry driving inaction）——文本先**陈述同等幅度下亏损的心理
 * 权重高于盈利**，再据此**导出避损的不作为或保本决策**：
 *   赚一千的开心压不住亏一千的心疼，宁可什么都不做。
 *   同样的数目，赔一块比挣一块难受多了，所以先保本。
 *   亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险。
 *   涨的时候总想着落袋，跌的时候死活不卖，盈亏根本不对等。
 *   The joy of gaining a thousand does not offset the pain of losing
 *   one, so do nothing.
 *   A loss hurts about twice as much as an equal gain pleases, so stay
 *   defensive.
 *   Even with a positive expected value, the fear of losing keeps me
 *   out.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：期望值是线性
 * 的——赚一千与亏一千在账面上正好抵消；心理权重不是线性的——同幅亏损
 * 被记成大约两倍的痛。用失药理权重替代账面权重做决策，等于换了一把
 * 刻度错误的尺子：所有正期望的机会都会被系统性拒掉，而所有负期望的
 * 持仓都会被系统性捂着。它比虚报数字更隐蔽：数字可以完全真实，比较
 * 可以完全错误。现实危害很直接：一个期望收益为正的项目因为「万一亏
 * 了怎么办」被无限期搁置；一个该止损的仓位因为「卖了就真亏了」被捂
 * 到爆仓；一次该付的学习成本因为「已经投了」被持续追加。与正当推理
 * 的界线很清楚：一旦给出风险预算、止损纪律、仓位规则、期望值口径，
 * 或明确指出这是损失厌恶在起作用，就是正当做法，一律豁免。
 *
 * 与既有维度的边界（r251 归因，探针邻接领地实测 6/6 穿透零重叠）：
 *   · sunk_cost_coercion（第 98 维）管**已投入绑架退出**（「都投了
 *     五年，现在退出等于否定自己」）；本族判据里根本没有「已投入」
 *     腿，判的是**同等幅度得失的心理权重不对称**（邻接句「已经在
 *     这只股票上亏了三年，现在卖出就等于承认自己错了」实测穿透、
 *     归其家族）。
 *   · disposition_effect（provisional 228，r228 草稿）管**盈亏状态
 *     驱动处置时点**（赚了急着卖、亏了捂着）；本族判据腿是**权重
 *     不对称陈述**，不要求「卖出/处置」动作（邻接句「赚了钱就急着
 *     跑，亏了钱就死捂着，这很常见」实测穿透、归其家族）。
 *   · endowment_effect（provisional 229，r229 草稿）管**所有权附着
 *     推高估值**；本族不涉所有权（邻接句「这东西是我的，别人出多少
 *     钱我都不觉得够」实测穿透、归其家族）。
 *   · present_bias（provisional 231，r231 草稿）管**当下偏好压过
 *     未来**；本族不涉时间贴现（邻接句「以后的事以后再说，今天的
 *     快乐最实在」实测穿透、归其家族）。
 *   · investment_as_debt 管**投入折算成亏欠与退出羞耻**；本族判据
 *     是权重不对称，不是亏欠结构。
 *   · confidence / perfect_error 等判**语气自信或绝对化措辞**；本族
 *     判据是两条具体心理权重腿 + 邻近共现，不依赖语气。
 *
 * 判据（双腿链 + 邻近窗 + 两组豁免，缺一不判）：
 *   ① 腿① ASYM 得失权重不对称陈述——六族任一（详见下方常量）：
 *     亏痛>赚悦直接比较、赚悦压不住亏痛、亏痛大于赚悦、补偿倍数
 *     （得赚 X 才能补）、权重不对等（盈亏/得失不对等）、倍数陈述
 *     （损失的痛苦是收益的两倍 / a loss hurts twice as much as an
 *     equal gain）；
 *   ② 腿② AVOID 避损决策/不作为结论——七族任一（详见下方常量）：
 *     宁可不作为、保本优先、拒绝参与、情绪化避损、落袋捂仓、正期望
 *     仍回避、EN 对应族；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），**方向不限**——
 *     「亏比挣难受，所以先保本」与「先保本，因为亏比挣难受」都收；
 *     推断标记（所以/因此/因而/可见/说明/意味着/证明；EN so/
 *     therefore/hence/which means）落在两腿之间则加权而非必要；
 *   ④ 腿①腿②均查否定前缀（「并不是亏比挣难受」「不是宁可什么都不
 *     做」→ 失配）；
 *   ⑤ 豁免 A 概念教学（损失厌恶/得失权重/前景理论/期望效用/参考点/
 *     行为经济学/卡尼曼/loss aversion/prospect theory/expected
 *     utility/reference dependence——讨论这个概念本身是正确判别）；
 *   ⑥ 豁免 B 正当风险管理（风险预算/止损线/最大回撤/仓位/凯利公式/
 *     期望收益为正/纪律/事先定好/精算/标准假设/不是因为/不是害怕/
 *     改用…代替；EN by rule/by design/risk management/stop-loss/
 *     position size/expected value/discipline/actuarial——把心理
 *     权重换算成纪律与口径是正当做法）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一次心理体验（「亏一万确实
 * 比赚一万难受」是事实陈述），也可能是在引用行为经济学案例。verify
 * 的语义是「这段话用同等幅度下亏损更痛推导出了不行动，先按期望值和
 * 风险预算重新框定，再决定是否采信它的结论」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 概念教学（损失厌恶的典型表现/gains and losses carry different
 *     subjective weights）；
 *   · 正当风险管理（我设置了百分之五的止损线/I cut losses at eight
 *     percent by rule）；
 *   · 纪律化决策（用事先定好的纪律代替临场判断/position sizes in
 *     advance）；
 *   · 单腿句（只有权重陈述无决策结论、只有「宁可少赚」无权重陈述）；
 *   · sunk_cost_coercion / disposition_effect / endowment_effect /
 *     present_bias / investment_as_debt 领地。
 * 已知缺口（有意不收）：无腿②的纯权重陈述（「亏一万比赚一万难受多
 * 了」单独成句是事实陈述，与心理学教材句同形）；以及把权重不对称说成
 * 事实并给出正确动作的句子（「亏损更难受，所以我用纪律代替感觉」）
 * ——前者缺决策导出、后者是正当做法，纯规则无法在不误伤的前提下收窄，
 * 宁缺勿滥。
 *
 * [r276 扩展] 经济与资源推理方向·全新措辞家族（真升级②，探针
 * coordination/agent4/probes/r276-probe-pool.js 实证 5/8 穿透）：
 *   · ASYM_MULTIPLE_ZH 情绪名词槽补 痛感/刺痛感/疼感/苦楚/糟心 + 收益侧
 *     「快感/高兴劲」对举倍数形（「赔钱的痛感是赚钱的快感的两倍还多」）；
 *   · ASYM_CMP_ZH 重量比较倍数形（「比赚同样的高兴劲儿重三倍」——比较
 *     结论是 重/大/强 + N倍，非情绪形容词）；
 *   · AVOID_RATHER_ZH 补 少挣/不挣/也不沾/也不碰；AVOID_CAPITAL_ZH 补
 *     只求不亏/但求保本族；
 *   · AVOID_EMOTION_ZH 口语情绪形（上头/头皮发麻/犯怵/膈应）；
 *   · SOLO_ZH S8 口语前缀 × 情绪新形独腿签名（一看见亏损就上头 /
 *     想想可能要赔就焦虑得睡不着——单句自带完整损失厌恶结构）；
 *   · EN 对应：ASYM_EN 正向 outweighs/exceeds/tops + N-to-one 比率、
 *     AVOID_EN capital preservation comes first / no matter the odds
 *     I fold（双词序）/ SOLO_EN makes my stomach turn, so I am out。
 *   处置效应族（利润落袋/亏了死攥）属 disposition_effect 邻接领地，
 *   按 r251 边界判定不收。维度计数不变、src/index.js 零改动、VERSION 未 bump。
 */
'use strict';

// ─── 腿① ASYM 得失权重不对称陈述（同等幅度下亏损权重 > 盈利权重）────
// A1 亏痛 > 赚悦：直接比较（亏…比…挣/赚…更难受/疼/苦/受不了）
const ASYM_CMP_ZH = [
  /亏[^。，！？；\n]{0,16}(?:比|相较于|比起)[^。，！？；\n]{0,16}(?:挣|赚|盈|赢)[^。，！？；\n]{0,16}(?:更|还要|来得|要)?(?:难受|疼|痛|苦|扎心|心疼|难受得多|难受多了|受不了|不是滋味|煎熬)/,
  /(?:挣|赚|盈|赢)[^。，！？；\n]{0,16}(?:比|相较于|比起)[^。，！？；\n]{0,16}(?:亏|赔|损)[^。，！？；\n]{0,16}(?:更|还要|来得|要)?(?:轻松|舒服|开心|痛快|不算什么|没感觉|轻巧)/,
  /赔[^。，！？；\n]{0,16}(?:比|相较于|比起)[^。，！？；\n]{0,16}(?:挣|赚|盈)[^。，！？；\n]{0,16}(?:更|还要|来得|要)?(?:难受|疼|痛|苦|扎心|心疼|受不了)/,
  /损[失失]?[^。，！？；\n]{0,16}(?:比|相较于|比起)[^。，！？；\n]{0,16}(?:收[益入]|盈[利利]|获[益利])[^。，！？；\n]{0,16}(?:更|还要|来得|要)?(?:难受|疼|痛|苦|扎心|心疼|难以接受)/,
  // A1b r276：重量比较倍数形（「亏一点的难受劲儿比赚同样的高兴劲儿重三
  // 倍」——比较结论是 重/大/强/深 + N倍，不是情绪形容词，旧族整条失配）
  /(?:亏|赔|损)[^。，！？；\n]{0,16}(?:比|相较于|比起)[^。，！？；\n]{0,16}(?:挣|赚|盈|赢)[^。，！？；\n]{0,16}(?:更|还要|来得|要)?(?:重|大|强|深|厉害|刻骨)了?[一两三四五2-5]?倍/,
];
// A2 赚悦压不住亏痛（赚…的开心 压不住/抵不过/盖不住/补不上 亏…的心疼）
const ASYM_OUTWEIGH_ZH = [
  /(?:赚|挣|盈|赢)[^。，！？；\n]{0,18}的?(?:开心|快乐|高兴|喜悦|满足|甜头)[^。，！？；\n]{0,18}(?:压不住|抵不过|盖不住|补不上|填不平|挡不住|不如|大不过)[^。，！？；\n]{0,18}(?:亏|赔|损)[^。，！？；\n]{0,18}的?(?:心疼|痛苦|难受|疼|苦|刺痛|伤口)/,
  /(?:亏|赔|损)[^。，！？；\n]{0,18}的?(?:心疼|痛苦|难受|疼|苦|刺痛)[^。，！？；\n]{0,18}(?:大于|胜过|超过|重于|盖过|压过|抵得[上过])[^。，！？；\n]{0,18}(?:赚|挣|盈|赢)[^。，！？；\n]{0,18}的?(?:开心|快乐|高兴|满足|甜头)/,
];
// A3 补偿倍数（痛苦得赚 X 才能补/抵/平）
const ASYM_COMPENSATE_ZH = [
  /(?:痛苦|难受|疼|心疼|刺痛)[^。，！？；\n]{0,6}(?:得|要|需要)[^。，！？；\n]{0,10}(?:赚|挣|赢|盈利)[^。，！？；\n]{0,12}(?:才能|才|方)[^。，！？；\n]{0,4}(?:补|抵|平|抹平|补回来|补得上)/,
  /(?:赚|挣|赢)[^。，！？；\n]{0,6}(?:的)?(?:开心|快乐|高兴)[^。，！？；\n]{0,6}(?:得|要|需要)[^。，！？；\n]{0,10}(?:亏|赔)[^。，！？；\n]{0,12}(?:才能|才|方)[^。，！？；\n]{0,4}(?:比|抵|平)/,
];
// A4 权重不对等（盈亏/得失 … 不对等/不对称/不一样/不平等/不平衡）
const ASYM_ASYMMETRY_ZH = [
  /盈[亏盈亏][^。，！？；\n]{0,10}(?:根本|完全|压根|从来|天生)?(?:不对等|不对称|不平等|不平衡|不一样|不是一回事|两码事)/,
  /得[失失][^。，！？；\n]{0,10}(?:根本|完全|压根|从来|天生)?(?:不对等|不对称|不平等|不平衡|不一样|不是一回事|两码事)/,
];
// A5 倍数陈述（损失的痛苦/难受 是收益的 N 倍）
const ASYM_MULTIPLE_ZH = [
  // r276：情绪名词槽补 痛感/刺痛感/疼感/苦楚/糟心（「赔钱的痛感是赚钱的
  // 快感的两倍还多」——旧槽只收 痛苦/难受/疼痛/心疼/伤害/冲击，「痛感」
  // 与「快感」对举的倍数形整族失配）
  /(?:损[失失]|亏损|赔)[^。，！？；\n]{0,8}的?(?:痛苦|难受|疼痛|心疼|伤害|冲击|痛感|刺痛感|疼感|苦楚|糟心|苦味)[^。，！？；\n]{0,10}(?:是|相当于|等于|抵得[上过])[^。，！？；\n]{0,10}(?:收[益入]|盈[利利]|赚[到来]|获[益利])[^。，！？；\n]{0,6}的?[两三四五2-5]?(?:倍|陪)/,
  /(?:亏|赔)[^。，！？；\n]{0,8}(?:的心疼|的痛苦|的难受|的痛感|的刺痛感)[^。，！？；\n]{0,10}(?:是|相当于)[^。，！？；\n]{0,10}(?:赚|挣)[^。，！？；\n]{0,6}的?[两三四五2-5]?(?:倍|陪)/,
  // A5b r276：快感对举倍数（「赚钱的快感的两倍还多」——收益侧情绪名词
  // 对举形，旧族收益侧只收名词不收「快感」）
  /(?:亏|赔|损)[^。，！？；\n]{0,8}的?(?:心疼|痛苦|难受|痛感|刺痛感)[^。，！？；\n]{0,10}(?:是|相当于|等于)[^。，！？；\n]{0,10}(?:赚|挣|盈)[^。，！？；\n]{0,6}的?(?:快感|高兴劲|开心劲|爽感|满足感)的?[两三四五2-5]?(?:倍|陪)/,
];

// A6 独腿签名（SOLO）——一句话内部自带「偏好倒置 / 权重对比 / 正期望被拒」
// 的完整损失厌恶结构，无需另找避损决策腿（同 r704 appeal_to_ridicule
// 「自含指向的固定习语单独成支」先例）。
const SOLO_ZH = [
  // S1 偏好倒置：宁可少赚也不能亏
  /(?:宁可|宁愿|宁肯)[^。！？\n]{0,14}(?:少|不)[^。！？\n]{0,8}(?:赚|挣|盈|赢)[^。！？\n]{0,14}(?:也不能|也不要|也别|不可|不能|都不|也别想)[^。！？\n]{0,8}(?:亏|赔|损)/,
  // S2 权重对比：少赚无所谓 vs 亏一点受不了
  /(?:少|不)[^。！？\n]{0,6}(?:赚|挣|盈|赢)[^。！？\n]{0,10}(?:无所谓|不要紧|没关系|没事|可以接受|能接受|不算什么)[^。！？\n]{0,24}(?:亏|赔|损)[^。！？\n]{0,12}(?:受不了|不行|不接受|难受|心疼|要命|扛不住|过不去)/,
  // S3 保本换少赚：只要不亏，少挣多少都能接受
  /(?:不亏|不赔|不损|不亏钱)[^。！？\n]{0,30}(?:少|不)[^。！？\n]{0,6}(?:挣|赚|盈|赢)[^。！？\n]{0,12}(?:都能|都可以|也行|无所谓|能接受|可以接受|足矣|就够了)/,
  // S4 补偿免疫：一想到要亏，给多少补偿都不干
  /(?:一想到|想到|若是|如果|倘若|万一|一旦)[^。！？\n]{0,12}(?:亏|赔|损)[^。！？\n]{0,24}(?:给多少|再多|无论多少|多少|任何)[^。！？\n]{0,8}(?:补偿|回报|好处|赔偿)[^。！？\n]{0,6}(?:都不干|也不干|也不做|也没用|也白搭|都不换|也不换)/,
  // S5 正期望仍拒：亏…哪怕期望是正的也不…
  /(?:亏|赔|损|风险)[^。！？\n]{0,24}(?:哪怕|即使|纵然|即便|就算|虽然)[^。！？\n]{0,24}(?:期望|预期|数学期望)[^。！？\n]{0,10}(?:为?正|是正|为正|为正数)[^。！？\n]{0,40}/,
  // S6 情绪化避损自成签名：一想到亏…就睡不着/不敢/心慌
  /(?:一想到|想到|生怕|害怕|怕|担忧|愁)[^。！？\n]{0,16}(?:亏|赔|损|风险|回撤)[^。！？\n]{0,24}(?:就|都|所以|于是|因此)[^。！？\n]{0,24}(?:睡不着|睡不好|心慌|心虚|焦虑|发怵|下不去手|手软|退缩|不敢|抗拒|抵触)/,
  // S7 亏…就心慌/焦虑 + 不作为动作（须见逗号分隔）
  /(?:亏|赔|损|风险)[^。！？\n]{0,12}(?:就|都)[^。！？\n]{0,16}(?:心慌|焦虑|睡不着|发怵|退缩|不敢|下不去手)[^。！？\n]{0,20}[，,][^。！？\n]{0,10}(?:躺平|不碰|不投|不出手|不参与|退出|撤出|缩手|放弃|缩着)/,
  // S8 r276：口语前缀 × 情绪新形独腿签名（「一看见亏损两个字就上头」
  // 「光是想想可能要赔就焦虑得睡不着」——前缀族旧表只有 一想到/想到/
  // 生怕/害怕/怕/担忧/愁，「看见/想想」与「上头/膈应」均不在射程内；
  // 单句自带「亏损情绪反应」的完整损失厌恶结构，无需另找权重腿）
  /(?:想想|寻思|琢磨|思量|念及|一?看见|一?看到|瞅见|提到|一提|念到)[^。！？\n]{0,12}(?:亏|赔|损)[^。！？\n]{0,20}(?:就|都)[^。！？\n]{0,16}(?:上头|头皮发麻|犯怵|发憷|膈应|焦虑|睡不着|心慌|手软|下不去手|退缩|不敢|抗拒)/,
];

const ASYM_EN = [
  /\blos(?:e|es|ing|lost)\b[^.]{0,30}\b(?:hurt|sting|stings|pain|pains|smart|smarts|thrill|thrills)\w*[^.]{0,20}\b(?:more|worse|harder|deeper)\s+than\b[^.]{0,30}\b(?:gain|win|wins|profit|thrill)/i,
  /\b(?:the\s+)?(?:joy|pleasure|thrill)\s+of\s+(?:gaining|winning|a\s+gain|an?\s+equal\s+gain)\b[^.]{0,30}\b(?:does\s+not|doesn'?t|don'?t|do\s+not)\s+(?:offset|outweigh|compensate\s+for|make\s+up\s+for|cancel)\b[^.]{0,40}\b(?:pain|hurt|sting|loss|losing)/i,
  /\b(?:an?\s+)?(?:equal|same|equivalent)\s+(?:gain|win|profit)\s+(?:does\s+not|doesn'?t|don'?t|do\s+not)\s+(?:offset|outweigh|compensate\s+for|make\s+up\s+for|cancel)\b[^.]{0,60}\bloss/i,
  /\b(?:a\s+)?loss\s+(?:feels|hurts|stings|pains)\w*\s+(?:about\s+|roughly\s+|far\s+|much\s+)?(?:twice|two\s+times|three\s+times|three\s+times|\d+(?:\.\d+)?\s+times)\s+(?:as\s+)?(?:bad|painful|much)\s+as\s+(?:an?\s+)?(?:equal\s+|same\s+)?(?:gain|win)/i,
  /\b(?:the\s+)?(?:pain|hurt|sting)\s+of\s+(?:a\s+)?los(?:ses|es|ing|e|t|s)?\s+is\s+(?:about\s+|roughly\s+|far\s+)?(?:twice|two\s+times|\d+(?:\.\d+)?\s+times)\s+the\s+(?:pleasure|joy)\s+of\b/i,
  /\b(?:the\s+)?(?:pain|hurt|sting)\s+of\s+(?:a\s+)?loss\s+(?:is|looms)\s+(?:about\s+|roughly\s+|far\s+)?(?:twice|two\s+times|\d+(?:\.\d+)?\s+times)\s+(?:as\s+)?(?:large|big|strong|great)\s+as\s+(?:the\s+)?(?:pleasure|joy)\s+of\s+(?:an?\s+)?(?:equal\s+)?gain\b/i,
  /\b(?:missed|forgone)\s+gain\s+is\s+only\s+a\s+(?:missed|forgone)\s+gain\b/i,
  /\b(?:gains?|wins?)\s+(?:and|&)\s+(?:losses?|loss)\s+(?:are|is)\s+not\s+(?:symmetric|symmetrical|equal|equivalent|the\s+same)/i,
  /\bloss(?:es)?\s+(?:looms?|weighs?)\s+(?:larger|heavier|bigger)\s+than\s+(?:an?\s+)?(?:equal\s+|same\s+)?(?:gain|win)/i,
  // r276 新增：正向 outweigh 形（「The pain of a loss outweighs the
  // pleasure of a gain」——旧族只收 does not offset 的否定形，正向
  // outweighs/exceeds/tops 动词族整族失配）
  /\b(?:the\s+)?(?:pain|hurt|sting|agony)\s+of\s+(?:a\s+)?los(?:ses|es|ing|e|t|s)?\s+(?:outweighs?|exceeds?|tops?|beats?|surpasses?)\s+(?:the\s+)?(?:pleasure|joy|thrill|happiness)\s+of\s+(?:an?\s+)?(?:equal\s+|same\s+|matching\s+)?(?:gain|win)/i,
  // r276 新增：N-to-one 比率形（「weighs two to one / hits three to
  // one」——比率制陈述，与 ASYM_MULTIPLE 的 N 倍形对应）
  /\b(?:pain|hurt|sting|agony|downside)\s+of\s+(?:a\s+)?los(?:ses|es|ing|e|t|s)?\s+(?:hits?|lands?|weighs?|counts?)\s+(?:us\s+|me\s+|people\s+)?(?:two|three|four|five|\d+)[-\s]to[-\s]one\b/i,
];

// ─── 腿② AVOID 避损决策 / 不作为结论 ────────────────────────────────
// B1 宁可不作为
const AVOID_RATHER_ZH = [
  // r276：动词槽补 少挣/不挣/不沾/不碰边（「宁可少挣也不沾」——「挣」
  // 与「沾」都不在旧族 赚/碰 射程内）
  /(?:宁可|宁愿|宁肯|不如)[^。，！？；\n]{0,20}(?:什么都不做|什么也不做|不赚|少赚|不挣|少挣|不做|不动|不碰|不沾|不投|不干|不出手|不参与|不冒险|不加|放着|空着|躺平|观望|缩着|躲着)/,
  /(?:宁可|宁愿|宁肯)[^。，！？；\n]{0,20}(?:少|不)[^。，！？；\n]{0,10}(?:也不能|也不要|也别|不可|不能|也不|都不)[^。，！？；\n]{0,8}(?:亏|赔|损|沾|碰|靠近|挨|参合|掺和)/,
];
// B2 保本优先
const AVOID_CAPITAL_ZH = [
  /(?:先)?保本(?:为主|第一|优先|要紧|最要紧|重要)?/,
  /本金(?:安全|不受损|第一|优先)/,
  /不亏就行|不亏就好|只要不亏|不亏就是赚|能不亏就不亏/,
  // r276 新增：只求不亏族（「所以我只求不亏」——只求/但求 + 不亏/保本，
  // 旧族只收条件形「只要不亏」）
  /(?:只求|只图|但求|只盼|只指望|不求[^。，！？；\n]{0,8}只求)[^。，！？；\n]{0,6}(?:不亏|不赔|不受损|保本)/,
  /(?:能)?不冒险就不冒险|不冒风险|不涉险|避险第一|安全第一/,
];
// B3 拒绝参与（动作腿 × 亏/损/风险语境）
const AVOID_REFUSE_ZH = [
  /(?:一想到|想到|生怕|害怕|怕|担忧|愁)[^。，！？；\n]{0,16}(?:亏|赔|损|风险|下跌|回撤)[^。，！？；\n]{0,16}(?:所以|就|都)[^。，！？；\n]{0,16}(?:不|躲|退|逃|缩|停|放弃|缩手)/,
  /(?:不碰|不投|不出手|不参与|不冒险|不加仓|不加|不买|不做|不换|不干|躺平|观望|缩手|撤出|退出)[^。，！？；\n]{0,14}(?:亏|赔|损|风险|下跌)/,
  /(?:亏|赔|损|风险)[^。，！？；\n]{0,14}(?:不碰|不投|不出手|不参与|不冒险|不加仓|不加|不做|不换|躺平|缩手)/,
  // 3b 跨句版本：亏损陈述 + 逗号 + 短引导 + 拒绝动作
  /(?:亏|赔|损|风险)[^。！？；\n]{0,24}[，,][^。！？；\n]{0,12}(?:不碰|不投|不出手|不参与|不冒险|不加仓|不加|不做|不换|不干|不上|不进|观望|撤出|退出|缩手)/,
  // 4 绝对拒绝族（内在否定，勿用 NEG_INSIDE）
  /(?:从不|从来不|始终不|一直不|再也不|绝不|决不|打死也不|永不复)[^。！？；\n]{0,6}(?:参与|投|碰|做|冒险|出手|进场|入局|下注|买入|加仓)/,
];
// B4 情绪化避损（情绪腿 × 亏/赔/风险语境）
const AVOID_EMOTION_ZH = [
  /(?:亏|赔|损|风险|下跌)[^。，！？；\n]{0,16}(?:睡不着|睡不好|心慌|心虚|焦虑|难受|煎熬|退缩|手软|下不去手|不敢|发怵|抵触|抗拒)/,
  /(?:一想到|想到)[^。，！？；\n]{0,16}(?:亏|赔|损|风险)[^。，！？；\n]{0,16}(?:就|都)[^。，！？；\n]{0,16}(?:睡不着|不敢|退缩|放弃|心慌|焦虑)/,
  // B4b r276：口语情绪新形（上头/头皮发麻/犯怵/膈应——「一看见亏损两
  // 个字就上头」，旧族情绪词表未收口语形）
  /(?:亏|赔|损|风险|下跌|回撤)[^。，！？；\n]{0,16}(?:上头|头皮发麻|犯怵|发憷|膈应|犯恶心|起鸡皮疙瘩|手抖|腿软|肝颤)/,
];
// B5 落袋 / 捂仓
const AVOID_LOCKIN_ZH = [
  /落袋为安|急着跑|赶紧跑|趁早跑|提前跑|死活不卖|捂着不卖|不敢持有|拿不住|坐不住|见好就收|赚一点就跑/,
];
// B6 正期望仍回避
const AVOID_POSITIVE_EV_ZH = [
  /(?:哪怕|即使|纵然|即便|就算)[^。，！？；\n]{0,24}(?:期望|预期|数学期望)[^。，！？；\n]{0,10}(?:为?正|是正|为正)[^。，！？；\n]{0,30}(?:也不|才不|也不|就不|依然|还是)/,
];

const AVOID_EN = [
  /\bso\s+(?:do\s+nothing|stay\s+out|sit\s+(?:it\s+)?out|stay\s+defensive|avoid\s+it|play\s+it\s+safe|keep\s+me\s+out|pass\s+on\s+it|hold\s+back|stay\s+put)\b/i,
  /\b(?:would\s+)?rather\s+(?:earn|make|take)\s+less\s+than\s+(?:risk|lose)\b/i,
  /\bavoiding\s+losses?\s+(?:comes|come)\s+first\b/i,
  /\bprotect(?:ing)?\s+the\s+downside\s+(?:first|above\s+all|at\s+all\s+costs)\b/i,
  /\b(?:the\s+)?fear\s+of\s+losing\s+(?:keeps?|kept|holds?)\s+(?:me|us|him|her|them)\s+out\b/i,
  /\b(?:preserve|protect)\s+(?:the\s+)?(?:principal|capital)\s+(?:first|at\s+all\s+costs)\b/i,
  /\bnever\s+risk\s+(?:a\s+)?(?:loss|what\s+(?:you|i|we)\s+(?:already\s+)?have)\b/i,
  /\b(?:take\s+)?(?:the\s+)?(?:safe|conservative)\s+(?:route|option|path)\s+(?:and\s+)?(?:do\s+nothing|skip\s+it)\b/i,
  /\bcan(?:no|')?t\s+(?:stomach|bear|tolerate)\s+(?:a\s+)?loss\b/i,
  /\bsit\s+(?:it\s+)?out\b/i,
  /\bstay\s+out\s+of\s+(?:the\s+)?(?:market|trade|deal|game)\b/i,
  /\b(?:keep|keep\s+it)\s+in\s+cash\b/i,
  /\bpass\s+on\s+it\b/i,
  /\bkeep\s+the\s+principal\s+first\b/i,
  /\b(?:so|thus|therefore)\s+\w{0,12}\s+(?:pass|skip|decline|stay\s+out|sit\s+out|stay\s+defensive|play\s+it\s+safe)\b/i,
  // r276 新增：capital preservation comes first（「so capital
  // preservation comes first」——旧族只收 avoiding losses comes first）
  /\b(?:capital|principal)\s+preservation\s+(?:comes|come)\s+first\b/i,
  // r276 新增：no matter the odds/payoff + fold/pass/out（两个语序都收）
  /\b(?:fold|pass|sit\s+out|stay\s+out|decline|back\s+out)\b[^.]{0,40}\bno\s+matter\s+the\s+(?:odds|payoff|expected\s+value|return)\b|\bno\s+matter\s+the\s+(?:odds|payoff|expected\s+value|return)\b[^.]{0,40}\b(?:fold|pass|out|sit\s+out|stay\s+out|decline)\b|\bno\s+matter\s+the\s+(?:odds|payoff|expected\s+value|return)\s*,?\s*(?:i|we|you|they)\s+(?:am|are|'?m|'?re)\s+out\b/i,
];

// B7 正期望仍拒（决策腿：期望为正仍不出手）
const AVOID_POS_EV_ZH = [
  /(?:正期望|期望为?正|期望收益为?正|数学期望为?正|期望值是?正)[^。，！？；\n]{0,24}(?:也不|才不|就不|依然|还是|照样|同样)[^。，！？；\n]{0,16}/,
  /(?:不投|不碰|不做|不参与|不上|不进|不加|不出手)[^。，！？；\n]{0,24}(?:正期望|期望为?正|期望收益为?正|数学期望为?正)/,
  /(?:正期望|期望为?正|期望收益为?正|数学期望为?正|期望值是?正)[^。，！？；\n]{0,16}(?:不投|不碰|不做|不参与|不上|不进|不加|不出手|不干|不上马|搁置|先放)/,
];
const AVOID_POS_EV_EN = [
  /\b(?:even\s+with|even\s+though|even\s+if|despite)\s+[a-z ,]{0,30}positive\s+expected\s+value\b[^.]{0,60}\b(?:not|never|still|won'?t|wouldn'?t|refuse|pass|skip|stay\s+out|sit\s+out)\b/i,
  /\b(?:skip|pass\s+on|decline|reject|refuse)\s+(?:it\s+)?(?:anyway|regardless)\b[^.]{0,50}\bpositive\s+expected\s+value\b/i,
];

// ─── 独腿签名 EN（SOLO_EN）────────────────────────────────────────
const SOLO_EN = [
  /\brather\s+(?:earn|make|take)\s+less\s+than\s+(?:risk|lose)\b/i,
  /\b(?:earning|making|taking)\s+less\s+(?:[a-z]{0,12}\s+)?(?:is|feels)\s+(?:fine|okay|ok|acceptable|better|preferable)\b[^.]{0,60}\b(?:loss|losing|risk)\b/i,
  /\b(?:even|even\s+though|even\s+if|despite)\s+[a-z ,]{0,30}positive\s+expected\s+value\b/i,
  /\bnot\s+offset\s+the\s+pain\s+of\s+losing\b/i,
  /\b(?:a\s+)?loss\s+(?:feels|hits|lands)\s+like\s+a\s+(?:wound|injury|blow|punch|gut\s+punch)\b/i,
  /\b(?:lose|losing|lost)\s+sleep\b/i,
  /\bcan(?:no|')?t\s+(?:stomach|bear|tolerate)\s+(?:a\s+)?loss\b/i,
  /\bnever\s+risk\s+what\s+(?:you|i|we)\s+(?:already\s+)?have\b/i,
  // r276 新增：stomach turn + out（「Just thinking about a possible loss
  // makes my stomach turn, so I am out」——旧 SOLO_EN 只收 can't stomach
  // a loss 的能力否定形，生理反应 + 退出的口语形整族失配）
  /\bmakes?\s+(?:my|our|his|her)\s+stomach\s+(?:turn|churn|clench|drop)\w*\b[^.]{0,60}\b(?:i|we)\s+(?:am|are|'?m|'?re)\s+(?:out|done|finished)\b/i,
  /\bstomach\s+(?:turn|churn|clench)\w*\s+(?:at|from|over)\b[^.]{0,40}\b(?:no\s+matter|regardless)/i,
];

// ─── 推断标记（落在两腿之间则加权，非必要）────────────────────────
const INFER_ZH = /(?:所以|因此|据此|可见|说明|证明|意味着|足以|因而|于是|结果就是|结论就是|那就是|就是说|显而易见|足见|充分说明|充分证明|足以表明|足以证明)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|which\s+means|which\s+proves|that\s+means|proves|shows\s+that|indicates\s+that|means\s+that|it\s+follows|this\s+shows|this\s+proves|consequently|as\s+a\s+result)\b/i;

// ─── 距离窗 ───────────────────────────────────────────────────────
const W_ZH = 60;
const W_EN = 160;

// ─── 豁免 A：概念教学（点名损失厌恶这个概念本身）─────────────────
const CONCEPT_ZH = /(?:损失厌恶|得失权重|权重函数|损失函数|参照依赖|参考点(?:依赖)?|前景理论|期望效用|效用理论|行为经济学|认知偏差|心理偏差|禀赋效应|处置效应|卡尼曼|特维尔斯基|塞勒|心理学(?:里|中|上|家|教材)|教材|课堂|课本|教学|论文|这篇研究|这项研究)/;
const CONCEPT_EN = /\b(?:loss\s+aversion|reference\s+dependence|reference\s+point|prospect\s+theory|expected\s+utility|utility\s+theory|behavioral\s+economics|behavioural\s+economics|cognitive\s+bias|endowment\s+effect|disposition\s+effect|Kahneman|Tversky|Thaler|textbook|lecture|paper|study\s+found|research\s+shows)\b/i;

// ─── 豁免 B：正当风险管理 / 纪律化决策（把心理权重换算成口径）────
const CORRECTIVE_ZH = /(?:风险预算|止损线|止损位|止损点|最大回撤|仓位|凯利公式|纪律|事先(?:定好|规定|约定|说好)|按规则|按计划|按纪律|精算|保险费率|标准假设|定价模型|安全边际|再平衡|分散投资|对冲|成本收益|不是害怕|不是因为|并非因为|并未因为|不是在乎|而不是因为|错的是|问题不在|关键不在|不在于|改用|代替|而非|按期望值|用期望值|以期望值|期望值(?:来|做|决策|算|计算|口径|框架)|最大可承受损失|可承受损失|以纪律|靠纪律)/;
const CORRECTIVE_EN = /\b(?:by\s+rule|by\s+design|risk\s+management|risk\s+budget|stop[\s-]?loss|position\s+siz\w+|Kelly|discipline|actuarial|insurance\s+(?:model|rate|pricing)|standard\s+assumption|safety\s+margin|rebalanc\w+|hedg\w+|not\s+because|not\s+out\s+of\s+fear|instead\s+of\s+reacting|in\s+advance|set\s+in\s+advance|by\s+expected\s+value|expected\s+value\s+(?:calculation|analysis|framework|maximi\w+)|maximum\s+acceptable\s+loss|risk\s+limit)\b/i;

// 工具 ─────────────────────────────────────────────────────────
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

const NEG_BEFORE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不影响|谈不上|不再|别|并不|并没|从未|绝非|而非)[^。，！？；\n]{0,5}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const SHORT_NEG_ZH = /(?:不|没|未|无|非|莫|甭)[^。，！？；\n]{0,2}$/;
const NEG_INSIDE = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|谈不上|从不|绝不|永不|坚决不|并不|并没|而非|而不是|绝非|并非如此|说不上|称不上)/;
const NEG_INSIDE_EN = /\bnot\s+that\b|\bnot\s+to\s+say\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bnot\s+necessarily\b|\bmakes?\s+no\s+difference\b/i;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|no\s+longer|not\s+anymore|hardly|barely|far\s+from|nowhere\s+near)\s+(?:\w+\s){0,4}$/i;

function matchAlive(text, x, useNeg, skipInside) {
  if (!useNeg) return true;
  if (!skipInside && (NEG_INSIDE.test(x.raw) || NEG_INSIDE_EN.test(x.raw))) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  const beforeLong = text.slice(Math.max(0, x.idx - 12), x.idx);
  const ababForm = /([一-龥]{1,2})不\1[^。，！？；\n]{0,4}$/.test(beforeLong);
  // 「抵不过/盖不住」等不足动词以「不」结尾，不是对决策腿的否定——
  // 「赚一万的快乐抵不过亏一万的心疼，我选择不出手」里 AVOID 前缀正是
  // 「…抵不过」，不豁免会把整句误杀。
  const safeSuffix = /(?:抵不过|盖不住|压不住|补不上|填不平|挡不住|大不过|说不过|过不去|大不了)$/.test(before);
  if (!ababForm && !safeSuffix && !/别提多?$/.test(before) && (NEG_BEFORE.test(before) || IMMEDIATE_NEG_ZH.test(before) || SHORT_NEG_ZH.test(before))) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 同跨度去重（不去重跨族重叠——跨族重叠留给配对循环的「防自证」判据处理，
// 否则「亏一万的痛苦得赚两万才能补回来，所以能不冒险就不冒险」里
// AVOID_REFUSE 的长跨句匹配会把 AVOID_CAPITAL 的正确短匹配挤掉）。
function dedupeExact(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = x.idx + ':' + x.end;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg, false)) m.push(x);
  }
  return dedupeExact(m);
}

// 决策腿专用：只查匹配点**之前**的否定前缀，不查模式内部的否定词——
// 避损决策腿自身含「不投/从不参与」等内在否定（「我从不参与」），
// 用 NEG_INSIDE 会把整族误杀。
function collectAvoid(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, true, true)) m.push(x);
  }
  return dedupeExact(m);
}

// 独腿签名专用：同上，只查前缀否定。
function collectSolo(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, true, true)) m.push(x);
  }
  return dedupeExact(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 签名收集：腿①权重不对称陈述 × 腿②避损决策，两腿邻近共现
function findSignatures(text, R) {
  const sigs = [];
  const langs = [
    {
      asym: [
        ...(R.ASYM_CMP_ZH || ASYM_CMP_ZH),
        ...(R.ASYM_OUTWEIGH_ZH || ASYM_OUTWEIGH_ZH),
        ...(R.ASYM_COMPENSATE_ZH || ASYM_COMPENSATE_ZH),
        ...(R.ASYM_ASYMMETRY_ZH || ASYM_ASYMMETRY_ZH),
        ...(R.ASYM_MULTIPLE_ZH || ASYM_MULTIPLE_ZH),
      ],
      avoid: [
        ...(R.AVOID_RATHER_ZH || AVOID_RATHER_ZH),
        ...(R.AVOID_CAPITAL_ZH || AVOID_CAPITAL_ZH),
        ...(R.AVOID_REFUSE_ZH || AVOID_REFUSE_ZH),
        ...(R.AVOID_EMOTION_ZH || AVOID_EMOTION_ZH),
        ...(R.AVOID_LOCKIN_ZH || AVOID_LOCKIN_ZH),
        ...(R.AVOID_POSITIVE_EV_ZH || AVOID_POSITIVE_EV_ZH),
        ...(R.AVOID_POS_EV_ZH || AVOID_POS_EV_ZH),
      ],
      infer: R.INFER_ZH || INFER_ZH,
      w: R.W_ZH != null ? R.W_ZH : W_ZH,
      lang: 'zh',
    },
    {
      asym: R.ASYM_EN || ASYM_EN,
      avoid: [
        ...(R.AVOID_EN || AVOID_EN),
        ...(R.AVOID_POS_EV_EN || AVOID_POS_EV_EN),
      ],
      infer: R.INFER_EN || INFER_EN,
      w: R.W_EN != null ? R.W_EN : W_EN,
      lang: 'en',
    },
  ];
  // 独腿签名：一句话内部自带完整损失厌恶结构，单独成支（承重证明见
  // test/loss-aversion.test.js 负例注入 S1/S2/S3/S4/S5 与 EN 对应族）
  const soloZh = collectSolo(text, R.SOLO_ZH || SOLO_ZH);
  const soloEn = collectSolo(text, R.SOLO_EN || SOLO_EN);
  for (const x of soloZh) sigs.push({ lang: 'zh', asym: x.raw, avoid: '', infer: '', solo: true });
  for (const x of soloEn) sigs.push({ lang: 'en', asym: x.raw, avoid: '', infer: '', solo: true });
  for (const L of langs) {
    const asymM = collect(text, L.asym, true);
    if (asymM.length === 0) continue;
    const avoidM = collectAvoid(text, L.avoid);
    if (avoidM.length === 0) continue;
    const inferM = allMatches(L.infer, text);
    for (const a of asymM) {
      for (const v of avoidM) {
        if (dist(a, v) > L.w) continue;
        // 防自证：决策腿必须在权重腿之外**带来新内容**（左伸或右伸至少
        // 2 字）——同一段话不能既当「权重陈述」又当「避损决策」（「亏一万
        // 比赚一万难受多了」里 AVOID_EMOTION 只吃到「亏一万比赚一万难受」，
        // 没有任何新内容，是自证不是双腿）；但「亏一万比赚一万更疼，所以
        // 我选择不出手」里 AVOID 从同一个「亏」字起笔并右伸到不出手，以及
        // 「先保本，因为亏一万比赚一万难受多了」的倒装，都是真双腿。
        const newRight = v.end > a.end ? v.end - Math.max(v.idx, a.end) : 0;
        const newLeft = v.idx < a.idx ? Math.min(v.end, a.idx) - v.idx : 0;
        if (newRight < 2 && newLeft < 2) continue;
        const between = inferM.find(x => (x.idx >= a.end && x.end <= v.idx) || (x.idx >= v.end && x.end <= a.idx));
        sigs.push({ lang: L.lang, asym: a.raw, avoid: v.raw, infer: between ? between.raw : '' });
      }
    }
  }
  // 签名按「语言 × 权重腿原文 × 决策腿原文」去重，避免跨族重叠把一处
  // 证据算成多处（count 参与档位判定，必须诚实）。
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.asym + '|' + s.avoid;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 损失厌恶签名：同等幅度得失的心理权重不对称陈述 × 避损决策结论 邻近共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectLossAversion(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论损失厌恶这个概念本身）
  if ((R.CONCEPT_ZH || CONCEPT_ZH).test(text) || (R.CONCEPT_EN || CONCEPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正当风险管理 / 纪律化决策
  if ((R.CORRECTIVE_ZH || CORRECTIVE_ZH).test(text) || (R.CORRECTIVE_EN || CORRECTIVE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'loss_aversion',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '权重不对称「' + x.asym + '」→ 避损决策「' + x.avoid + '」' + (x.infer ? '（推断标记「' + x.infer + '」）' : '')
      : 'asymmetry "' + x.asym + '" -> loss-avoiding decision "' + x.avoid + '"' + (x.infer ? ' (via "' + x.infer + '")' : ''))),
    details: s.lang === 'zh'
      ? '损失厌恶(' + sigs.length + '处: 拿同等幅度下「' + s.asym + '」的心理权重推出避损决策「' + s.avoid + '」，缺期望值/风险预算口径)(zh)'
      : 'loss-aversion(' + sigs.length + 'x: gain-loss asymmetry "' + s.asym + '" driving loss-avoiding inaction "' + s.avoid + '")(en)',
    guidance: '损失厌恶指同等幅度的亏损在心理权重上高于盈利，并据此回避本可承担的机会——账面上赚一千与亏一千正好抵消，心理上亏一万大约要赚两万才能补平。用失药理权重替代期望值做决策，会系统性拒掉正期望的机会、系统性捂住负期望的持仓。请按口径重新框定再下结论：给出期望值与概率（而不是「万一亏了怎么办」）、设定止损线与仓位规则（百分之几止损、单笔最多投多少）、把「亏了难受」换成「最大可承受损失是多少」、或明确说出这是损失厌恶在起作用。若这段话只是客观转述一次心理体验（亏一万确实比赚一万难受），请把结论限定在事实陈述，不要外推到行动建议。讨论损失厌恶的概念、主动给出风险预算与纪律、说明用规则代替临场感觉，都是正当做法；若这段话只是引用行为经济学案例或他人的谬误示例，核实其主张再决定是否采信。',
    tags: ['behavioral-economics', 'loss-aversion', 'gain-loss-asymmetry', 'prospect-theory', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectLossAversion,
  __internals: () => ({
    ASYM_CMP_ZH, ASYM_OUTWEIGH_ZH, ASYM_COMPENSATE_ZH, ASYM_ASYMMETRY_ZH, ASYM_MULTIPLE_ZH, ASYM_EN,
    AVOID_RATHER_ZH, AVOID_CAPITAL_ZH, AVOID_REFUSE_ZH, AVOID_EMOTION_ZH, AVOID_LOCKIN_ZH,
    AVOID_POSITIVE_EV_ZH, AVOID_POS_EV_ZH, AVOID_POS_EV_EN, AVOID_EN,
    SOLO_ZH, SOLO_EN,
    INFER_ZH, INFER_EN, W_ZH, W_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECTIVE_ZH, CORRECTIVE_EN,
  }),
};
