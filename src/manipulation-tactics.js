/**
 * HeartFlow — Manipulation Tactics（操纵手段判别）
 *
 * 来源：97 样本防回归基准暴露的真实漏判（2026-09-21，心虫 decision.decide 选定，0.92 分）。
 * 20 条恶意样本中 7 条 pass，其中 6 条零维度命中——现有 50 个维度覆盖不到
 * 这几类高频操纵手段：
 *
 *   1. phishing_coercion   钓鱼胁迫：「立即点击链接验证账户，否则将被冻结」
 *   2. induced_trust       诱导信任与隔离：「你必须完全信任我，因为只有我了解你的价值」
 *                          「不要告诉任何人我们谈过这件事」
 *   3. coverup_induction   掩盖包庇诱导：「你为什么不继续掩盖那个数据造假的问题？」
 *
 * 设计原则：
 * - 纯规则、零依赖、纯函数（与心虫其他维度一致）
 * - 与既有维度分工：false_urgency 管"时间压迫"，本模块管"威胁后果+链接胁迫"
 * - 误报控制优先：每条模式都要求**胁迫性后果**共现，单独的"点击链接"不判
 *   （正常客服场景「请点击链接查看详情」极常见）
 */

'use strict';

// ─── 1. 钓鱼胁迫（phishing_coercion）────────────────────────
// 关键：必须有 胁迫性后果（冻结/注销/失效/报警/处罚）与 行动指令（点击/验证/登录）共现
const PHISHING_PATTERNS = [
  // 行动 + 后果（必须共现，单独的"点击链接"是正常操作不判）
  /(?:点击|打开|访问|登录)[^。]{0,20}(?:链接|网址|页面|表单)[^。]{0,40}(?:验证|确认|更新|完善|激活|冻结|异常|失效)/i,
  /(?:链接|网址)[^。]{0,30}(?:验证|确认|更新|完善|激活)/i,
  /(?:账户|账号|帐号|身份|资质|额度|信用)[^。]{0,20}(?:将被|会被|即将|马上)?[^。]{0,10}(?:冻结|查封|注销|停用|失效|限制|清零)/i,
  // [v6.7.73] 「账户异常」需与处置后果或要求行动共现才算钓鱼——
  // 「账户异常需要本人持证件到柜台」是客服正常流程说明，不是胁迫。
  /(?:账户|账号|帐号)[^。]{0,20}异常[^。]{0,20}(?:点击|验证|确认|登录|输入|提供|扫描)[^。]{0,10}/i,
  /(?:检测|发现|系统)[^。]{0,10}(?:您的|你的|该)?[^。]{0,6}(?:账户|账号)[^。]{0,12}(?:异常|被盗|涉嫌|风险)[^。]{0,20}(?:请|需|尽快|立即|点击)/i,
  /(?:否则|不然|若不|如未|逾期)[^。]{0,25}(?:冻结|注销|停用|失效|扣款|起诉|报警|处罚|追究)/i,
  /(?:24|48|72)?\s*小时内?[^。]{0,20}(?:未|不)[^。]{0,10}(?:验证|确认|处理|整改)[^。]{0,20}(?:冻结|注销|停用|失效|关闭)/i,
  /(?:系统检测|安全中心|平台检测|风控)[^。]{0,25}(?:异常|风险|违规|被盗|涉嫌)/i,
  // [v6.7.73] 「立即/尽快 + 处理/整改」需指向**对方**（您/用户/贵司）
  // 才算胁迫。「我们立即处理」「客服会立即处理」是我方动作，不是钓鱼。
  /(?:请|需|务必|烦请)[^。]{0,4}(?:您|你|用户|贵司|客户)?[^。]{0,4}(?:立即|马上|立刻|尽快)[^。]{0,15}(?:点击|验证|确认|处理|整改|提供|补充)/i,
  /(?:立即|马上|立刻|尽快)[^。]{0,10}(?:点击|验证|确认)[^。]{0,10}(?:链接|账户|身份|信息)/i,
  // 英文
  /\b(?:click|open|visit|follow)\b[^.]{0,30}\b(?:link|url)\b[^.]{0,40}\b(?:verify|confirm|update|validate)\b/i,
  /\b(?:link|url)\b[^.]{0,30}\b(?:verify|confirm|update|validate)\b/i,
  // [v6.7.71] account 与 suspended 之间允许间隔（扩充基准暴露：
  // "verify your account immediately or it will be suspended" 原模式失配）
  /\b(?:account|identity|access)\b[^.]{0,40}\b(?:will\s+be\s+)?(?:suspended|frozen|terminated|disabled|locked|restricted|closed)\b/i,
  /\b(?:verify|confirm|update|validate)\b[^.]{0,30}\b(?:account|identity)\b[^.]{0,30}\b(?:or|otherwise|else)\b[^.]{0,30}\b(?:suspended|frozen|terminated|disabled|locked)\b/i,
  /\b(?:within|in)\s+(?:24|48|72)\s+hours?\b[^.]{0,30}\b(?:verify|confirm|suspend|terminate|disable)\b/i,
  /\b(?:otherwise|or\s+else|failure\s+to)\b[^.]{0,30}\b(?:suspend|terminate|freeze|disconnect|penalt)/i,
  /\b(?:unusual|suspicious|unauthorized|suspected)\b[^.]{0,20}\b(?:activity|access|login|sign-?in)\b[^.]{0,3}\.[^.]{0,40}\b(?:verify|confirm|secure|validate)\b/i,
  /\b(?:unusual|suspicious|unauthorized|suspected)\b[^.]{0,20}\b(?:activity|access|login|sign-?in)\b[^.]{0,40}\b(?:verify|confirm|secure|validate)\b/i,
  /\b(?:we|our system)\s+(?:have\s+)?(?:detected|noticed|observed)\b[^.]{0,40}\b(?:verify|confirm|secure|validate|suspend)\b/i,
  /\b(?:we|our system)\s+(?:have\s+)?(?:detected|noticed|observed)\b[^.]{0,3}\.[^.]{0,40}\b(?:verify|confirm|secure|validate|suspend)\b/i,
];

// ─── 2. 诱导信任与隔离（induced_trust）──────────────────────
// 关键：要求"排他性权威"或"保密隔离"——把对方与其他人/其他信息源切断
const INDUCED_TRUST_PATTERNS = [
  // 排他性权威：只有我懂你/只有我对你好/别人都不怀好意
  /只有我(?:才|真正|最)?(?:了解|懂|理解|关心|为你好|在乎)/i,
  /(?:除了我|只有我)[^。]{0,15}(?:不会|才能|会)(?:骗你|害你|帮你|懂你|理解你)/i,
  /(?:别人|他们|其他人|所有人)[^。]{0,12}(?:都)?(?:不|没)[^。]{0,8}(?:懂你|了解你|关心你|为你好|靠不住|不可信|会骗你)/i,
  /(?:你)?(?:必须|只能|一定要|务必)(?:完全|绝对|无条件)(?:信任|相信|听从|服从|依赖)(?:我|一个人)/i,
  /(?:完全|绝对|无条件)(?:信任|相信|服从|依赖)我(?:一个人)?/i,
  // 保密隔离：不要告诉别人 / 这是我们之间的秘密
  /(?:不要|别|不能|不许)(?:告诉|跟|和|对)(?:任何人|别人|其他人|家人|朋友|同事|领导)/i,
  /(?:这是|就当是)?我们(?:之间|俩|两人)?(?:的)?秘密/i,
  /(?:不要|别)(?:让|告诉)(?:任何人|别人|其他人)(?:知道|晓得|清楚)/i,
  /(?:天知地知|你知我知|只有你我知道)/i,
  // 英文
  /\bonly\s+i\s+(?:really\s+)?(?:understand|know|care\s+about|love)\s+you\b/i,
  /\bno\s+one\s+(?:else\s+)?(?:understands|cares\s+about|will\s+ever)\s+(?:you|love\s+you)\b/i,
  /\byou\s+(?:must|have\s+to|need\s+to|should)\s+(?:completely|absolutely|totally|unconditionally|fully)\s+(?:trust|obey|believe)\s+me\b/i,
  // [v6.7.71] 副词后置变体："trust me completely"（扩充基准暴露的漏判）
  /\byou\s+(?:must|have\s+to|need\s+to|should)\s+(?:trust|obey|believe)\s+me\s+(?:completely|absolutely|totally|unconditionally|fully)\b/i,
  /\btrust\s+me\s+(?:completely|absolutely|totally|unconditionally|fully)\b/i,
  /\b(?:don'?t|do\s+not)\s+(?:tell|share\s+with)\s+(?:anyone|anybody|others?)\b/i,
  /\b(?:this\s+is\s+)?(?:just\s+)?between\s+us\b/i,
  /\bour\s+(?:little\s+)?secret\b[^.]{0,40}\b(?:don'?t|do\s+not|never|no\s+one)\b/i,
  // ─── [v6.7.125] 第 92 轮：信息源隔离族 INFO_ISOLATION ───
  // 来源：心虫 decision 两轮 chosen:null（A/C 并列 0.8、B 0.74、D 0.74），
  // 按「实测证据强度 + gate 影响」双准则人工择优 A（第 90/91 轮同款纪律）。
  // 轮初实测（r92-scan.js / r92-baseline.js，本体 gate）：31 条同族攻击
  // 既有表只命中 2 条（其中 1 条还是 prompt_injection 旁路命中），
  // **净放行 29 条**；69 条良性 0 误伤。缺口整类结构缺失，不是词表稀疏。
  //
  // 缺口本质：既有 19 条只覆盖「排他性权威（只有我懂你）」与「保密隔离
  // （这是我们之间的秘密）」，缺第三类——**信息源隔离**：把对方与
  // 可验证的外部信息源（其他代理/官网/同行/家人/律师）切断，
  // 从而让「只有我说的算数」。这是诱导信任的核心落点：
  // 权威可伪造、秘密可共享，但**信息源一旦被隔离，对方失去校验能力**。
  //
  // 判据沿用家族铁律「两半齐备」：
  //   隔离半 —— 禁询第三方 / 排他渠道 / 瞒报亲近人 / 贬损其他信息源
  //   指向半 —— 听我的 / 只有我 / 找我 / 交给我 / 信我
  // 良性分界（69 条实测 0 误伤，含 30 条高压扩样）：
  //   - 官方反诈提示（「有疑问请联系官方客服，不要轻信陌生来电」）
  //     —— 指向的是**公开可验证渠道**，不是指向说话者本人
  //   - 正常商务描述（「本公司拥有华南区独家代理权」「内部渠道价格更低但要资质审核」）
  //     —— 有排他词但**没有隔离指向半**（不要求切断对方与其他源的联系）
  //   - 学术/研究建议（「文献综述不能只看单一来源，要多方查证」）
  //     —— 恰是本族的反向（鼓励多源）
  //   - 客服正常流程（「退款事宜请通过订单页面提交申请」）
  //     —— 中性指示
  //
  // 试错台记账（r92-cand-try1→try7）：
  //   try1 19/31 漏 12：禁词后置式（「你都别信」）、反序式、英文面
  //   try2 28/31 补三条新句式
  //   try3 29/31 族4b 家人瞒报语序解耦（「家里人问起就说不知道」：
  //     瞒报对象在句首不在 CONCEAL 后）+ 族4c 后段窗口 20→24
  //   try4 30/31 修 #25；**#28 暴露新坑**：「别跟同行打听」的语序是
  //     禁词+跟+SRC+动词，而 FORBID 表写成「禁词+动词」，动词不紧贴禁词
  //     → r92-diag3/4 定位后另立 FORBID_VIA 专用式（连接词 + 0-8 字中缀）
  //   try5 29/31 **回退坑**：把 FORBID 整体加中缀想一把修 #28，
  //     结果族2b 禁词后置式「外面的风言风语别当真」被改漏，且良性
  //     「有疑问请联系官方客服，不要轻信陌生来电」被误拉——一条改动
  //     两头失守。教训：**中缀只能加在专用式上，不能动共享的 FORBID 词表**
  //   try6 30/31 恢复 FORBID 原样、FORBID_VIA 独立；但后置式动词表
  //     被砍掉「当真」→ #26 仍漏（try7 记账）
  //   try7 31/31 良性 0/69 收敛
  {
    // 族1 排他渠道：渠道排他词 + 别处拿不到 / 只能通过我
  pattern: /(?:独家|独有|唯一|专供|特供|内部(?:渠道|资源|流通)|只在我|只从我这|只通过我|只能找我|只能通过我|只能跟我|只能从我这|外网看不到|外面买不到|市面上见不到|不对外|不公开|不走公开)[^。]{0,30}(?:外面|外网|市面上|公开|其他人|别处)[^。]{0,10}(?:买不到|见不到|看不到|拿不到|没有|弄不到|不走)/i,
    type: 'zh_info_isolation_exclusive'
  },
  {
  pattern: /(?:外面|外网|市面上|别处)[^。]{0,10}(?:买不到|见不到|拿不到|看不到)[^。]{0,30}(?:只有我|只能通过我|只能找我|只能跟我|找我)/i,
    type: 'zh_info_isolation_exclusive'
  },
  {
  pattern: /(?:独家|独有|唯一|专供|特供|内部(?:渠道|资源))[^。]{0,30}(?:不走|不经过)(?:公开|外部|别人|其他)/i,
    type: 'zh_info_isolation_exclusive'
  },
  {
    // 族2a 禁询第三方：禁词 + 第三方源 + 指向半
  pattern: /(?:别|不要|不用|不许|不能|甭|切勿|不准)(?:去)?(?:问|打听|咨询|核实|查|看|信|听|找|联系|声张|当真|管|自己)[^。]{0,20}(?:其他(?:人|代理|家|销售|中介|同行|平台|渠道|业务员)|别人|第二家|官网|外部|外人|身边人|家里人|家人|同事|朋友|领导|律师|客服|官方|平台客服|风言风语|小道消息)[^。]{0,40}(?:只有我|就找我|找我|问我|听我的|我这边|以我|按我|照我说的|我说|我给|跟我联系|我来处理|交给我|我说了算|信我|我能|先来问|先找我)/i,
    type: 'zh_info_isolation_forbid_source'
  },
  {
    // 族2a 禁询第三方：禁词 + 第三方源 + 贬损半
  pattern: /(?:别|不要|不用|不许|不能|甭|切勿|不准)(?:去)?(?:问|打听|咨询|核实|查|看|信|听|找|联系|声张|当真|管|自己)[^。]{0,20}(?:其他(?:人|代理|家|销售|中介|同行|平台|渠道|业务员)|别人|第二家|官网|外部|外人|身边人|家里人|家人|同事|朋友|领导|律师|客服|官方|平台客服|风言风语|小道消息)[^。]{0,40}(?:都是假的|是假的|假的|虚高|在骗你|骗人的|忽悠|瞎说|乱说|过时|不准|不准的|白问|没用的|做不了数|不算数|更新慢|不可信)/i,
    type: 'zh_info_isolation_forbid_source'
  },
  {
    // 族2a' 禁词+连接词+SRC+动词（「别跟同行打听，他们只会忽悠你，信我一次。」）
  pattern: /(?:别|不要|不用|不许|不能|甭|切勿|不准)(?:跟|和|与|同)[^。]{0,8}(?:问|打听|咨询|核实|查|看|信|听|找|联系)[^。]{0,14}(?:只会|只是|净会|都)?[^。]{0,8}(?:忽悠|骗|骗你|瞎说|假的|不准)[^。]{0,24}(?:信我|听我|找我|问我)/i,
    type: 'zh_info_isolation_forbid_via'
  },
  {
  pattern: /(?:别|不要|不用|不许|不能|甭|切勿|不准)(?:跟|和|与|同)[^。]{0,8}(?:问|打听|咨询|核实|查|看|信|听|找|联系)[^。]{0,24}(?:只有我|就找我|找我|问我|听我的|我这边|以我|按我|照我说的|我说|我给|跟我联系|我来处理|交给我|我说了算|信我|我能|先来问|先找我)/i,
    type: 'zh_info_isolation_forbid_via'
  },
  {
    // 族2b 禁词后置式（「其他销售说的话你都别信，只有我说的才算数。」）
    // 动词表含「当真」——r92-try5 回退教训（见上方试错台记账）
  pattern: /(?:其他(?:人|代理|家|销售|中介|同行|平台|渠道|业务员)|别人|第二家|官网|外部|外人|身边人|家里人|家人|同事|朋友|领导|律师|客服|官方|平台客服|风言风语|小道消息)[^。]{0,14}(?:说|给|讲|报|提供)?的?[^。]{0,10}(?:你都|您都|你)?(?:别|不要|不用|不能|甭)(?:去)?(?:问|打听|信|听|找|联系|当真|声张|管)/i,
    type: 'zh_info_isolation_forbid_post'
  },
  {
    // 族2c 反序式（「遇到问题先来问我，不要直接联系平台客服。」）
  pattern: /(?:只有我|就找我|找我|问我|听我的|我这边|以我|按我|照我说的|我说|我给|跟我联系|我来处理|交给我|我说了算|信我|我能|先来问|先找我)[^。]{0,20}(?:别|不要|不用|不能|不准)(?:去)?(?:问|打听|咨询|核实|查|看|信|听|找|联系|直接联系)[^。]{0,16}(?:其他(?:人|代理|家|销售|中介|同行|平台|渠道|业务员)|别人|第二家|官网|外部|外人|身边人|家里人|家人|同事|朋友|领导|律师|客服|官方|平台客服|风言风语|小道消息)/i,
    type: 'zh_info_isolation_reverse'
  },
  {
    // 族2d 贬损半在前（「他们说的价格都是假的，听我的没错」）
  pattern: /(?:都是假的|是假的|假的|虚高|在骗你|骗人的|忽悠|瞎说|乱说|过时|不准|不准的|白问|没用的|做不了数|不算数|更新慢|不可信)[^。]{0,30}(?:听我的|问我|找我|只有我|我这边|以我|按我)/i,
    type: 'zh_info_isolation_demean_first'
  },
  {
    // 族3 无法独立判断 + 交给我
  pattern: /(?:搞不清|不清楚|不懂|不在行|判断不了|自己查不了|弄不了|没法|外行|自己乱|别折腾|别自己)[^。]{0,12}(?:听我|照我|找我|交给我|我来|我帮|别自己)/i,
    type: 'zh_info_isolation_incapable'
  },
  {
    // 族3 英文同构：「You don't understand this business, just do as I say.」
    // r92 记账：首版插入时漏了这条英文同构（diff 有、文件无——插入块尾部被
    // 后续 patch 覆盖丢失），engine 实测 2 条英文族3 攻击 count=0 暴露。
    // 教训：大块插入后必须直连 checkInducedTrust 逐条验，不能只信 diff。
  pattern: /you (?:don'?t|can'?t|do not|cannot) (?:really )?(?:understand|figure|know|judge)[^.]{0,30}(?:just )?(?:do as i say|let me handle|leave it to me|trust me)/i,
    type: 'en_info_isolation_incapable'
  },
  {
    // 族4a 禁声张/别提 + 只有我能办成
  pattern: /(?:别|不要|不能|不许|别提)(?:声张|打听|核实|乱说|出去说|说不知道|提这事|管|自己处理)[^。]{0,30}(?:只有我|我能|听我的|我自然有办法|我帮你想办法)/i,
    type: 'zh_info_isolation_conceal'
  },
  {
    // 族4b 家人瞒报 + 只有我办成（语序解耦版：瞒报词与对象任一在前）
  pattern: /(?:瞒着|说不知道|别提|不要提|别讲|不讲|不说起|别声张|别提这事)[^。]{0,10}(?:家里人|家人|父母|配偶|老公|老婆|朋友|同事|领导)[^。]{0,40}(?:只有我|就找我|找我|问我|听我的|我这边|以我|按我|照我说的|我说|我给|跟我联系|我来处理|交给我|我说了算|信我|我能|先来问|先找我)/i,
    type: 'zh_info_isolation_conceal'
  },
  {
  pattern: /(?:家里人|家人|父母|配偶|老公|老婆|朋友|同事|领导)[^。]{0,10}(?:问起|问到|提起|知道了|听说)[^。]{0,12}(?:瞒着|说不知道|别提|不要提|别讲|不讲|不说起|别声张|别提这事)[^。]{0,40}(?:只有我|就找我|找我|问我|听我的|我这边|以我|按我|照我说的|我说|我给|跟我联系|我来处理|交给我|我说了算|信我|我能|先来问|先找我)/i,
    type: 'zh_info_isolation_conceal'
  },
  // 族5 英文同构
  {
  pattern: /(?:internal|exclusive|private)[- ]only (?:channel|group|link|list)[^.]{0,40}(?:only|through me|ask me)/i,
    type: 'en_info_isolation_exclusive'
  },
  {
  pattern: /don'?t (?:ask|bother|check|consult|trust)[^.]{0,30}(?:anyone|anybody|others?|other agents?|the (?:internet|website|official))[^.]{0,40}(?:listen to me|ask me|only me|trust me)/i,
    type: 'en_info_isolation_forbid_source'
  },
  {
  pattern: /don'?t (?:ask|bother|check|consult|trust)[^.]{0,30}(?:anyone|anybody|others?|other agents?)[^.]{0,40}(?:inflated|fake|bogus|misleading|outdated|not accurate)/i,
    type: 'en_info_isolation_forbid_source'
  },
];

// ─── 3. 掩盖包庇诱导（coverup_induction）────────────────────
// 关键：诱导对方隐瞒错误/参与掩盖/承认包庇义务
const COVERUP_PATTERNS = [
  /你(?:为什么|怎么|为何)(?:还|又|一直)?(?:不|没|要)?(?:继续)?(?:掩盖|隐瞒|包庇|遮掩|遮盖|瞒着)/i,
  /(?:帮(?:我)?(?:一起)?(?:掩盖|隐瞒|包庇|遮掩))/i,
  /(?:不要|别)(?:承认|说出去|举报|揭发|声张|上报)/i,
  /(?:这事|这件事|此事)[^。]{0,12}(?:你|咱们|我们)[^。]{0,6}(?:也?有份|脱不了|跑不了|一条船)/i,
  /(?:咱们|我们)(?:是)?(?:一条船|一条心|共同体|捆绑)/i,
  /(?:你)?(?:已经|早就)?(?:参与|卷入|牵扯|牵涉)(?:其中|进来了|了)/i,
  /(?:承认|认下|扛下|背下)(?:这个|这项|这口|所有)(?:错|罪|责任|锅)/i,
  /(?:数据|证据|记录|痕迹)(?:都)?(?:已经)?(?:处理|清理|删掉|改好|抹掉)了/i,
  // 英文
  /\bwhy\s+(?:are|do)\s+you\s+(?:still\s+)?(?:covering|hiding|concealing)\b/i,
  /\bhelp\s+me\s+(?:cover|hide|conceal|bury)\b/i,
  /\b(?:don'?t|do\s+not)\s+(?:admit|report|tell|disclose|confess)\b/i,
  /\bwe'?re\s+(?:all\s+)?in\s+this\s+together\b[^.]{0,30}\b(?:so|therefore|just)\b/i,
  /\balready\s+(?:cleaned|deleted|erased|doctored|tampered)\s+(?:up\s+)?(?:the\s+)?(?:data|records|logs|evidence)\b/i,
];

const MT_LEVEL = { phishing_coercion: 'critical', induced_trust: 'high', coverup_induction: 'critical' };
const MT_WEIGHT = { phishing_coercion: 0.85, induced_trust: 0.6, coverup_induction: 0.85 };

/** 通用匹配器：返回 { count, hits, score }
 * [v6.7.125] 条目兼容两种形式：RegExp 字面量（旧）与 { pattern, type }（新，v6.7.125 起）。
 * 新形式的 type 会带进 hits，供测试断言族归属与归因追溯。 */
function _matchAll(text, patterns, type) {
  if (!text || typeof text !== 'string') return { count: 0, hits: [], score: 0 };
  const hits = [];
  for (const entry of patterns) {
    const pat = entry instanceof RegExp ? entry : entry.pattern;
    const subType = entry instanceof RegExp ? type : (entry.type || type);
    const m = text.match(pat);
    if (m) hits.push({ type: subType, matched: m[0].slice(0, 40) });
  }
  return {
    count: hits.length,
    hits,
    score: Math.min(1, hits.length * MT_WEIGHT[type]),
  };
}

/** 钓鱼胁迫检测 */
function checkPhishingCoercion(text) {
  const r = _matchAll(text, PHISHING_PATTERNS, 'phishing_coercion');
  return { count: r.count, hits: r.hits, score: r.score };
}

/** 诱导信任与隔离检测 */
function checkInducedTrust(text) {
  const r = _matchAll(text, INDUCED_TRUST_PATTERNS, 'induced_trust');
  return { count: r.count, hits: r.hits, score: r.score };
}

/** 掩盖包庇诱导检测 */
function checkCoverupInduction(text) {
  const r = _matchAll(text, COVERUP_PATTERNS, 'coverup_induction');
  return { count: r.count, hits: r.hits, score: r.score };
}

module.exports = {
  checkPhishingCoercion,
  checkInducedTrust,
  checkCoverupInduction,
  MANIPULATION_TACTICS_LEVEL: MT_LEVEL,
};
