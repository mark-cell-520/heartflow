/**
 * src/mental-accounting.js — 「心理账户」检测器
 * （ provisional 第 223 个判别维度，r235 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r235-dimension-agent4.md
 * §五。编号 provisional 的原因同 r228-r234：远端 v6.8.145 已接线 214
 * 维，另有 zero_sum_fallacy(r218)/budget_value_conflation(r219)/
 * average_marginal_conflation(r220)/conditional_transposition(r228)/
 * anonymous_source(r229)/broken_window(r230)/automation_bias(r231)/
 * p_hacking(r232)/appeal_to_future(r233)/effort_justification(r234)
 * 十个已起草未接线维度占号，最终编号由 1 号按接线顺序在 VERIFY_DIMS
 * 登记序重排）
 *
 * [r235 立项] 零命中探针 coordination/agent4/probes/r235-zerohit-probe.js
 * + r235-fp-stress.js（v6.8.145 gate() 全量 findings 实测）：心理账户族
 * 攻击句 4/8 完全穿透（pass、findings 空），另 4/8 非 pass 但承重维度
 * 全为既有泛维度偶发代拦（contradiction×2 / sunk_cost_coercion /
 * perfect_error），无任何维度以「来源标签 × 非同质消费许可」语义承重；
 * 良性侧 5/5 全 pass。FP 压力 10/10 疑难良性（专款专用/捐赠/纳税/
 * 冲抵成本/合并管理/购物卡限期用掉/发现句/预算管理）仅 1 条被泛维度
 * false_urgency 代拦，无边界否弃。src/ 下没有任何维度判「钱的来源
 * 标签 × 把它当非同质/免费钱对待的消费许可」这一结构。
 *
 * 外部来源：空返，按既有形态自建。r235 海外扫描（原始证据
 * coordination/agent4/scout/*20261106-203335*）：arXiv parse-fail、
 * GitHub 0 命中、Semantic Scholar 限流空返。判据为心虫自有纯规则实现
 * （家族定义取自行为经济学标准描述：mental accounting / 心理账户——
 * 违背货币同质性（fungibility），把钱按来源贴上不同标签、当成不同
 * 性质的钱区别对待；逻辑上，一块钱的价值不取决于它从哪来，
 * 「这是白来的/不算正经收入」从不构成「可以随便花/不心疼」的理由）。
 *
 * 辨别的族：心理账户（mental accounting）——把**带来源标签的钱**
 * （年终奖/意外之财/中奖/报销款/购物卡/退税/炒股快钱/省下的钱；EN
 * bonus/windfall/found money/tax refund/rebate/gift card/house
 * money）当成**非同质、免费、不计账的钱**，据此给出**放宽的消费
 * 许可**（不心疼/随便花/挥霍/不计入/不算正经收入/跟工资不是一个
 * 性质；EN feels free/doesn't count/guilt-free/splurge/not real
 * salary）：
 *   这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。
 *   反正是公司报销的钱，不花白不花，多点几个菜也没什么。
 *   中奖得来的五万块，跟攒了一年工资不一样，挥霍起来不觉得可惜。
 *   The bonus is found money, not real salary, so I might as well splurge.
 *   Money from a tax refund feels free, so I spent it on things I would
 *   never buy with my paycheck.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：货币是同质的——
 * 来源不改变一块钱的购买力和机会成本。「意外之财所以不算数」是把
 * **记账标签**偷换成**价值差异**，让未经预算约束检验的消费获得
 * 自我许可；企业版（「预算不用完就没了，花掉也不计入成本」）还会
 * 直接造成浪费。与正当表述有明确界线：纳入统一预算/专款专用/
 * 依法纳税/冲抵成本（规范记账）、明确指出钱不分来源（解耦）、
 * 或引用本族名称的教学句——均豁免。
 *
 * 与既有维度的边界（r235 归因）：
 *   · sunk_cost_coercion（第 98 维）判「已经投入所以不该退出」的
 *     继续/弃羞耻结构（管去留决策）；本族判「来源标签所以可以
 *     随便花」的消费许可（管消费决策），「投了这么多钱现在放弃
 *     就前功尽弃」类句子无来源标签，双腿判据天然不命中。
 *   · budget_value_conflation（r219 草稿，未接线）判「预算有限
 *     所以价值低/不值得做」（把预算约束当价值判断）；本族判
 *     「来源标签改变钱的消费许可」，一个管约束→价值，一个管
 *     来源→许可。
 *   · cost_externalization 判成本转嫁他人/社会；本族不涉及
 *     转嫁，判自我许可式的同币不同值。
 *   · broken_window（r230 草稿，未接线）判只看可见直接收益、
 *     无视被挤占的隐藏机会成本；本族判同一笔钱因来源标签被
 *     区别对待，不必含破坏/重建语境。
 *   · appeal_to_wealth 崇拜富人财富为证据；本族的「标签」是
 *     钱的来源，不是人的财富。
 *   · 探针实测：心理账户攻击 4/8 完全穿透、余 4/8 全为泛维度
 *     代拦，无一被上述维度以本族语义承重（r235-zerohit-probe.js
 *     / r235-fp-stress.js）；互不触发。
 *
 * 判据（双腿共现，缺一不判）：
 *   ① 腿① SOURCE 来源标签锚点——年终奖/奖金/意外之财/横财/外快/
 *      中奖/彩票/退税/退款/报销(的)钱/购物卡/代金券/红包/礼金/遗产/
 *      赔偿款/炒股赚来的/快钱/省下的钱/白捡的/白来的；EN bonus/
 *      windfall/found money/tax refund/rebate/cashback/gift card/
 *      lottery/prize/inheritance/settlement/house money/easy money；
 *   ② 腿② 非同质消费许可（两种子型）：
 *      · SPEND 消费/免责语义（可独立承重）——不心疼/不觉得可惜/
 *        随便花/挥霍/剁手/大手大脚/白捡/白给/来得容易；
 *        EN feels free/doesn't count/guilt-free/splurge/blow it/
 *        treat … as free/might as well；
 *      · NOTCOUNT 不计账语义（不计入/不算数/不当成/另当别论）——
 *        **须同句另见消费动词或放任桥梁**（花/买/挥霍/剁手/所以/
 *        就可以/不妨/尽管/随便/放心/大胆/尽情/想怎么），以排除
 *        「报销款不计入绩效工资但计入项目成本」类规范记账陈述；
 *      双腿须落在近距离窗内（ZH 50 字 / EN 160 字符）。
 *
 * 为什么取 VERIFY 级：单句可能是真诚的个人消费叙述（若其消费本
 * 就在预算内则非谬误），或规范记账陈述。verify 的语义是「这段话
 * 在用钱的来源标签放宽消费约束，先按统一预算核实这笔消费是否真
 * 的无所顾忌，再决定是否采信其消费/预算结论」。
 *
 * 明确不判的（四组豁免，均可负例注入证明承重）：
 *   · 让步/纠正（来源标签在场，但规范处理被要求：「虽然/尽管 +
 *     来源标签 + 但/然而 + 纳入预算/统一规划/理性/纳税」；EN
 *     although … still must budget/plan/track）——说话者把钱
 *     拉回同一约束，正是本族解药；
 *   · 明确解耦（「钱不分来源/都一样/等价/同质」；EN money is
 *     money / fungible / every dollar is the same）——直接否定
 *     本族推论；
 *   · 规范记账在场（纳入/列入/计入 + 预算/账/税/规划/统筹，且
 *     该动词不被否定前缀修饰；EN budgeted/tracked/taxed/
 *     went into savings）——消费被规范框架承载；
 *   · 元话语概念引述（心理账户是指…/mental accounting is…/
 *     the fallacy is when…）——引用本族名称的教学/定义句。
 *   （纯陈述来源而无消费许可语义、以成就动词叙述真实结果、以
 *   「不能/严禁 + 挥霍」否定句式反对浪费——均因腿②缺失或被
 *   否定前缀拦下，双腿判据天然不命中，另由 326 条官方良性语料
 *   零误伤验证。）
 *
 * [r311 升级] 新来源标签 × 新消费许可措辞家族（真升级②）：存量
 * SOURCE 只收个人收入标签（奖金/意外之财/中奖/报销/卡券/红包），
 * 不收公共资金与劳务创作收入——「政府补贴花不掉不用计较」「课题
 * 经费跟工资不一样花起来不用顾忌」「佣金提成来得容易不觉得可惜」
 * 「版税到账跟工资不是一个性质」「救济款不拿白不拿」「压岁钱是
 * 白来的」类攻击穿透；存量 SPEND 不收「没有心理负担/不用顾忌/
 * 犒劳自己/奢侈一把」（EN treated myself / no strings attached /
 * without guilt）。探针 14/16 穿透本模块（2 条已被存量腿代拦）、
 * 官方良性语料 228 条零误命中（coordination/agent4/probes/
 * r311-probe*.js）。实现为平行常量 + findSignatures concat 合并，
 * 存量四组注入语义不变。src/index.js 零改动。
 *
 * [r317 升级] 日常口语来源标签 × 轻放任消费许可新措辞家族（真升级②）：
 * 存量来源表（含 r311 补充族）不收「闲钱/零花钱/私房钱/副业收入/
 * 分红/利息/理财收益/房租收入」这类**非薪资日常进项标签**——「这笔
 * 闲钱放着也是放着，花了不心疼」「零花钱多买几本漫画也不碍事」
 * 「副业挣的钱不算正经收入」「股票分红等于白给的，奢侈一把也没人
 * 管」「利息收入不当成工资，随便花也不心疼」「房租收入跟薪水不是
 * 一码事」（EN: the stipend feels like pocket money / dividends are
 * passive income / side income is not real salary / the allowance is
 * my own petty cash）；存量 SPEND 不收「不碍事/无伤大雅/没什么大
 * 不了/不影响生活质量」轻放任族与 EN「spend it however I like」式
 * 任意处置许可。r317 探针 A 族 13 条候选 12 条穿透本模块（1 条已被
 * 存量 白给的×奢侈一把 族代拦），官方良性语料改前两模块零误命中
 * （scripts/round-317/probe-candidates.js）。实现为平行常量
 * SOURCE_ZH3/SOURCE_EN3/SPEND_ZH3/SPEND_EN3 + findSignatures concat，
 * 存量四组与 r311 两组注入语义不变。src/index.js 零改动。
 */
'use strict';

// ─── 腿① 来源标签锚点（中文）────────────────────────────────────
// 关键：只取**钱的来源/来路标签**（意外之财/报销/中奖/白捡/炒股赚的），
// 不取「投入/花了」类支出词（那可能是正当成本陈述，且属 sunk_cost 领地）。
const SOURCE_ZH = [
  // ①-a 奖金类
  /(?:年终奖|年度奖金|年终奖励|绩效奖金|项目奖金|季度奖金|销售奖金|特别奖金|奖金|奖金包)/,
  // ①-b 意外之财/横财/外快
  /(?:意外之财|天降之财|横财|偏财|外快|不劳而获|白得一笔)/,
  // ①-c 中奖/彩票/押注赢的
  /(?:中奖|中彩|中彩票|买彩票中的|彩票中|刮刮乐|头奖|奖池|押中的|赌赢的)/,
  // ①-c2 赚来的快钱（炒股/投资/轻松赚的）
  /(?:炒股|投资|赌球|打牌)(?:赚来|赚到|赢来|得来)的|(?:赚来|赢来)的快钱|快钱|轻松赚来的|不劳而获/,
  // ①-d 税务/退款类
  /(?:退税|出口退税|税款退还|退款|退货款|返货的钱)/,
  // ①-e 报销类（报销的钱/报销款/报销下来的）
  /(?:报销)(?:下来|回来|下来)?(?:的)?(?:钱|款|费用|额度|经费)/,
  // ①-f 卡券类
  /(?:购物卡|礼品卡|代金券|提货券|购物券|消费券|储值卡|饭卡里的|交通卡里的)/,
  // ①-g 人情/继承/赔付类
  /(?:红包|礼金|份子钱|遗产|赠与|捐款到账|赔偿款|补偿金|理赔款|赔款|和解金)/,
  // ①-h 省下/攒下/优惠来的
  /(?:省下来的|省下的|攒下来的|节省下来的|优惠省下的|折扣省出的|比价省下的|返现|返利)/,
  // ①-i 白得类
  /(?:白捡的|白来的|白得的|捡来的|天上掉下来的|天上掉的|不要钱的|免费送的|白拿的|白给的)/,
];

// ─── [r311] 腿① 新来源标签族（平行常量，存量注入语义不变）──────────
// 公共资金类：补贴/拨款/经费/救济——「公家的钱花不掉不心疼」是企业版
// 心理账户的常见形，存量来源表只收个人收入标签，不收专项公共资金。
const SOURCE_ZH2 = [
  // ①-j 人情往来（压岁钱/利是）
  /(?:压岁钱|压岁红包|利是钱|利市红包)/,
  // ①-k 公共资金（补贴/拨款/经费/救济——「公家的钱花不掉不心疼」）
  /(?:政府补贴|国家补贴|财政补贴|补贴款|补贴金|专项拨款|财政拨款|课题经费|科研经费|项目经费|专项资金|救济款|救济金|扶贫款|帮扶资金|低保金)/,
  // ①-l 劳务/创作收入（佣金/提成/版税/稿费/劳务费）
  /(?:佣金|提成|抽成|版税|稿费|劳务费|专家费|咨询费|演出费|出场费)/,
];

// ─── [r311] 腿②-A 新消费/免责许可族（平行常量，存量注入语义不变）────
// 存量 SPEND_ZH 收「不心疼/随便花/挥霍」族，不收「负担/顾忌/犒赏/
// 奢侈一把」族；探针实证 14/16 穿透（2 条已被存量腿代拦）。
const SPEND_ZH2 = [
  // ②-i 负担/顾忌族（花起来没有负担/不用顾忌——显式免责）
  /(?:没有|毫无|没啥|没什么|不会有|不存在|不曾有)[^。，！？；\n]{0,6}(?:心理负担|负担|顾忌|顾虑)/,
  /(?:不用|不必|无需|无须|没必要|犯不着|不须|用不着)[^。，！？；\n]{0,4}(?:顾忌|顾虑|节省|省着|节约|俭省|计较|斟酌|心疼|可惜)/,
  // ②-j 自我犒赏族（年终奖到账犒劳自己——把来源钱当奖励额度）
  /(?:犒劳|犒赏|奖赏|奖励|慰劳)自己/,
  // ②-k 一把族（奢侈一把/享受一把/放纵一把）
  /(?:奢侈|奢华|阔绰|放纵|任性|享受)一把/,
];

// ─── [r311] 腿① 新来源标签族（英文，平行常量）────────────────────
const SOURCE_EN2 = [
  /\blucky money\b/i,
  /\bred envelope\b/i,
  /\b(?:government |state |public )?(?:subsidy|subsidies|grants?)\b/i,
  /\bresearch (?:grant|funding|budget)\b/i,
  /\brelief (?:payment|money|funds?)\b/i,
  /\b(?:sales )?commission\b/i,
  /\broyalt(?:y|ies)\b/i,
  /\btip money\b/i,
];

// ─── [r311] 腿②-A 新消费/免责许可族（英文，平行常量）──────────────
const SPEND_EN2 = [
  /\btreat(?:ed|ing|s)?\s+(?:myself|himself|herself|ourselves|themselves)\b/i,
  /\b(?:rewarded|spoiled|spoiling)\s+(?:myself|himself|herself|ourselves|themselves)\b/i,
  /\bno strings attached\b/i,
  /\bwithout\s+(?:any\s+)?(?:guilt|remorse|hesitation)\b/i,
  /\bmight as well\s+(?:treat|indulge|enjoy)\b/i,
  /\bindulge\s+(?:a\s+(?:little|bit)|myself|once)\b/i,
];

// ─── [r317] 腿① 新来源标签族（平行常量，存量注入语义不变）──────────
// 存量 SOURCE/SOURCE_ZH2 收「奖金/意外之财/中奖/报销/卡券/补贴/佣金」
// 等显式标签，不收「闲钱/零花钱/私房钱/副业/分红/利息/理财收益/房租」
// 这类**日常口语来源标签**——「闲钱花了不心疼」「分红等于白给的」
// 「房租收入不算工资」类攻击穿透本模块（r317 探针 A 族 12/13，
// 实证 scripts/round-317/probe-candidates.js）。
// 双腿共现设计保证「闲钱理财/利息纳税」类规范陈述不命中。
const SOURCE_ZH3 = [
  // ①-m 闲钱/零用钱（「放着也是放着，花了不心疼」）
  /(?:闲钱|零用钱|零花儿|手头的?闲钱)/,
  // ①-n 零花钱（给孩子的定额零花被当免费额度）
  /(?:零花钱|零花费用|给的零花)/,
  // ①-o 私房钱（藏着的钱不当共同财产）
  /(?:私房钱|私己钱|自己藏的钱)/,
  // ①-p 副业/兼职收入（跟工资不是一个性质的进项）
  /(?:副业|兼职|第二职业|接私活|外包活儿?)(?:挣|赚|挣来|赚来|得来|拿到|搞到)?(?:的)?(?:钱|收入|进项|外快)/,
  // ①-q 分红/利息/理财收益（投资性被动收入被当白给的钱）
  /(?:股票)?分红/,
  /利息(?:收入)?/,
  /(?:理财|基金|投资|理财产品|余额宝)的?(?:收益|进账|到账)/,
  // ①-r 房租/租金收入（被动现金流被当额外额度）
  /(?:房租|租金|租子)(?:收入)?/,
];

// ─── [r317] 腿②-A 新消费许可族（平行常量，存量注入语义不变）────────
// 存量 SPEND 收「不心疼/随便花/挥霍/白捡」族，不收「不碍事/无伤大雅/
// 没什么大不了/不影响生活质量」族——「多买几件也不碍事」「花了不
// 影响生活质量」类轻放任许可穿透（r317 探针 A2 形）。
const SPEND_ZH3 = [
  // ②-l 不碍事/不妨事（轻量放任许可）
  /(?:不|没|无)(?:碍事|妨事)/,
  /无伤大雅/,
  /(?:没什么|没啥|不算什么)大不了/,
  // ②-m 不影响生活质量族（花掉了也不影响——把放宽当无代价）
  /(?:不|没|未必|不见得)[^。，！？；\n]{0,4}影响[^。，！？；\n]{0,8}(?:生活质量|生活|开销|现金流|预算)/,
  // ②-n 添个/加点预算（拿来源钱当可添数额度）
  /(?:添|追加|多加)[^。，！？；\n]{0,4}(?:预算|额度|开销)/,
];

// ─── [r317] 腿① 新来源标签族（英文，平行常量）────────────────────
const SOURCE_EN3 = [
  /\bstipend\b/i,
  /\bpocket money\b/i,
  /\bpetty cash\b/i,
  /\b(?:monthly |weekly )?allowance\b/i,
  /\bdividends?\b/i,
  /\bpassive income\b/i,
  /\brental income\b/i,
  /\binterest (?:income|payments?)\b/i,
  /\binvestment (?:income|returns?)\b/i,
  /\bside (?:income|money|hustle|gig)\b/i,
];

// ─── [r317] 腿②-A 新消费许可族（英文，平行常量）────────────────────
// 存量 SPEND_EN 收「feels free / splurge / blow it」族，不收「spend
// it however I like」「any way I please」式任意处置许可（r317 探针 A12）。
const SPEND_EN3 = [
  /\b(?:spend|spent|blow|blew|use|burn)\s+(?:it|them|the money|the cash|the lot)\s+(?:however|any way|whatever way|as)\b/i,
  /\b(?:however|any way|whatever way)\s+(?:i|we|you|he|she|they)\s+(?:like|want|please|see fit|choose)\b/i,
  /\bno strings\b/i,
];

// ─── 腿① 来源标签锚点（英文）────────────────────────────────────
const SOURCE_EN = [
  // ①-a bonus / windfall / found money / house money
  /\b(?:year[- ]end |annual |performance |project |sales |sign[- ]on )?bonus\b/i,
  /\bwindfall\b/i,
  /\bfound money\b/i,
  /\bhouse money\b/i,
  /\beasy money\b/i,
  // ①-b tax refund / rebate / cashback
  /\btax refund\b/i,
  /\brebate\b/i,
  /\bcashback\b/i,
  // ①-c gift card / voucher / coupon 折现
  /\bgift card\b/i,
  /\bvoucher\b/i,
  /\bcoupon\b/i,
  // ①-d lottery / prize / gambling winnings
  /\blottery\b/i,
  /\bprize money\b/i,
  /\bjackpot\b/i,
  /\bwinnings\b/i,
  // ①-e inheritance / settlement / payout
  /\binheritance\b/i,
  /\b(?:insurance |legal )?payout\b/i,
  /\bsettlement (?:money|check|payment)\b/i,
  // ①-f money we saved / savings from（省下的钱）
  /\bmoney (?:we |i |they )?(?:saved|saved up)\b/i,
  /\bsavings from\b/i,
  // ①-g came out of the … budget（花自某专项预算；允许形容词含空格）
  /\b(?:came|comes|paid|taken|drawn) out of the [a-z][a-z ]{0,22}?budget\b/i,
  // ①-h free money / didn't pay for it
  /\bfree money\b/i,
  /\bgot (?:it |them )?for free\b/i,
];

// ─── 腿②-A 消费/免责语义（中文，可独立承重）─────────────────────
const SPEND_ZH = [
  // ②-a 不心疼/不觉得可惜（含「不必那么心疼/没什么可惜」变体）
  /(?:不|无需|不必|不用|无须|不怎么|不太|没啥|没什么|丝毫没)[^。，！？；\n]{0,4}(?:心疼|觉得可惜|可惜|吝惜|珍惜|肉痛)/,
  // ②-b 随便/放心/大胆/尽情 + 花/买/挥霍（不取裸「用」——「放心使用」类
  //    消费保障话术是良性边界；「想怎么用」另立模式覆盖）
  /(?:随便|随意)[^。，！？；\n]{0,3}(?:花|买|造|点|挥霍|剁手)/,
  /(?:放心|大胆|尽情|敞开|痛快)[^。，！？；\n]{0,4}(?:花|买|造|挥霍|剁手)/,
  /想怎么[^。，！？；\n]{0,2}(?:花|用|买|点)/,
  // ②-c 纯挥霍动词（否定前缀由 detect 层 isNegated 拦下）
  /(?:挥霍|剁手|大手大脚|乱花钱|撒钱|糟蹋钱|奢靡)/,
  // ②-d 不花白不花/不花可惜/不用白不用
  /(?:不花白不花|不花可惜|不用白不用|不拿白不拿|过期作废|不用就废)/,
  // ②-e 白捡/白给/就当是白来的
  /(?:就当是|就当|权当是|好比是|等于|像是|就像)[^。，！？；\n]{0,4}(?:白捡|白给|白来|捡的|免费的|不要钱的)/,
  /(?:白捡|白给|白来|免费得|一分钱没花)/,
  // ②-f 来得容易/轻松（钱的来路被用于放松约束）
  /(?:来得容易|来得轻松|来得快|轻松到手|不费吹灰之力|唾手可得)/,
  // ②-g 没必要/不必 + 纳入/计入（拒绝把该来源的钱纳入统一约束——
  //    规范记账陈述用「计入X成本」式，不含「没必要」类价值判断）
  /(?:没必要|不必|无需|没有必要)[^。，！？；\n]{0,6}(?:纳入|列入|计入|并入|归入)/,
  // ②-h 反正/说到底 + 不是工资/血汗钱（口语式非同质断言）
  /(?:反正|说到底|本来|原本|其实)[^。，！？；\n]{0,6}(?:不是|算不上|并非|不算)[^。，！？；\n]{0,4}(?:工资|血汗钱|辛苦钱|正经收入|劳动所得)/,
];

// ─── 腿②-A 消费/免责语义（英文，可独立承重）─────────────────────
const SPEND_EN = [
  // ②-a feels free / feels like free / like it doesn't count
  /\bfeels? (?:like )?free\b/i,
  /\bdoesn'?t (?:really )?count\b/i,
  /\bdo(?:es)? not (?:really )?count\b/i,
  /\bnot real (?:money|income|salary|earnings)\b/i,
  /\bdoesn'?t count against\b/i,
  /\bguilt[- ]free\b/i,
  /\bsplurge\b/i,
  /\bblow (?:it|the money|the whole)\b/i,
  /\btreat (?:it|the money|this) as free\b/i,
  /\bmight as well (?:spend|splurge|blow)\b/i,
  /\bwhy not (?:spend|splurge|blow)\b/i,
  /\bno need to (?:budget|save|track|count)\b/i,
  /\b(?:nobody|no one) (?:would )?(?:mind|minded|care[sd]?)\b/i,
  /\bwould never buy with (?:my|our|the) (?:paycheck|salary|regular income)\b/i,
];

// ─── 腿②-B 不计账语义（中文；须同句另见消费动词或放任桥梁）───────
const NOTCOUNT_ZH = [
  /(?:不计入|不纳入|没必要纳入|不必纳入|无需纳入|不记入|不作数|不算数|不能算|另当别论|不当成|不能当成|不当作)/,
  // 跟/和 + 不一样/不是一个性质（直接的同质否定）
  /(?:跟|和|与)[^。，！？；\n]{0,12}(?:不一样|不是一个性质|不是一回事|两码事|不能比|不可比|不可同日而语|不是一码事|没有可比性)/,
];

// ─── 腿②-B 不计账语义（英文；须同句另见消费动词或放任桥梁）───────
const NOTCOUNT_EN = [
  /\b(?:not|isn'?t|aren'?t) (?:part of|in) (?:the |my |our )?(?:real |regular )?(?:budget|income|salary)\b/i,
  /\bseparate from (?:the |my |our )?(?:real |regular )?(?:salary|budget|income|paycheck)\b/i,
  /\bnot the same as (?:my |our )?(?:salary|paycheck|regular income)\b/i,
];

// NOTCOUNT 的同句消费动词/放任桥梁（缺此信号则视为规范记账陈述，不判）
const BRIDGE_ZH = /(?:所以|因此|因而|于是|就可以|大可|不妨|尽管|随便|随意|放心|大胆|尽情|想怎么|挥霍|剁手|花掉|用掉|买|消费|购置|下单|撒|糟蹋|犒赏|赏自己)/;
const BRIDGE_EN = /\b(?:so|thus|therefore|hence|might as well|may as well|feel free|go ahead|why not|splurge|spend|blow|treat)\b/i;

// 双腿距离窗
const PAIR_ZH = 50;
const PAIR_EN = 160;

// ─── 豁免一：让步/纠正（来源在场，但规范处理被要求）──────────────
// 「虽然/尽管 + 来源标签 + 但/然而/仍 + 纳入预算/统一规划/理性/纳税」。
// 注意：处理动词前的否定前缀（不纳入/没必要纳入）不构成本豁免——
// 那正是本族签名，用 hasPositiveVerb 层拦（见 detect 内实现）。
const CONCEDE_ZH = /(?:虽然|尽管|固然|虽说|纵然)[^。！？\n]{0,30}(?:但|然而|但是|可是|不过|仍|还是|却|也|依然|仍然)[^。！？\n]{0,20}(?<![不没无勿莫未必])(?:纳入|列入|编入|计入|并入|归入|统一规划|统筹|理性|按需|审慎|规划|记账|纳税|配置|管理)/;
const CONCEDE_EN = /\b(?:although|though|even though|while|despite|even after)\b[^.]{0,55}\b(?:still|nevertheless|nonetheless|yet|must|should|need to|ought to)\b[^.]{0,25}\b(?:budget|plan|track|account|save|tax|manage|allocate)\b/i;

// ─── 豁免二：明确解耦（钱不分来源/都一样/等价）───────────────────
const DECOUPLE_ZH = /(?:钱|资金|收入|奖金|财|财产)[^。！？\n]{0,10}(?:不分|不论|不管|都是|都一样|等价|同质|没有区别|没有本质区别|不该区别|一视同仁|不可区别对待)|每一块钱都一样|一分一厘都|来源[^。！？\n]{0,6}(?:不影响|不决定|不代表|无所谓)/;
const DECOUPLE_EN = /\bmoney is money\b|\bfungible\b|\bevery dollar is the same\b|\ball (?:money|dollars) are (?:the same|equal)\b|\bregardless of (?:its |their )?source\b|\bsource (?:doesn'?t|does not) (?:matter|change)\b/i;

// ─── 豁免三：规范记账在场（纳入/列入/计入 + 预算/账/税/规划，且非否定）─
// detect 层用 hasAccountingFrame 实现：命中且处理动词不带否定前缀才豁免。
const ACCOUNT_ZH = /(?:纳入|列入|编入|计入|并入|归入|写入)[^。，！？；\n]{0,8}(?:总)?(?:预算|账|税|管理|制度|核算|规划|统筹|台账)/;
const ACCOUNT_EN = /\b(?:budgeted|tracked|taxed|accounted for|went (?:straight )?into savings|put (?:it )?(?:straight )?into (?:savings|the budget)|recorded in the (?:books|budget))\b/i;

// ─── 豁免四：元话语概念引述（引用本族名称的教学/定义句）──────────
const META_ZH = /心理账户|货币同质性|非同质|(?:把|将)[^。，！？；\n]{0,14}(?:钱|资金|收入|奖金)[^。，！？；\n]{0,8}(?:当成|视为|当作|看作)[^。，！？；\n]{0,8}(?:不同|免费|不算|另类)/;
const META_EN = /\bmental accounting\b|\bfungibility\b|\b(?:the |this )?(?:fallacy|bias|effect|phenomenon)\s+(?:is|applies|occurs|happens|refers)\b|\b(?:is|are)\s+when\s+(?:people|we|they|someone)\s+(?:treat|treats|spend|splurge)\b/i;

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

// 挥霍/消费许可类模式的否定前缀检查（「不能挥霍/严禁挥霍/不是…随便花」不是本族）。
// 窗口取匹配前 8 字符：允许否定词与被否定短语间插入少量字（不能当作/不准再去）。
const NEG_PHRASE = /(?:不能|不可|不应|不该|不准|不可以|不允许|禁止|严禁|反对|避免|杜绝|防止|拒绝|抵制|切忌|切勿|别|莫|勿|不是|算不上|并非|不算)[^。，！？；\n]{0,5}$/;
function isNegated(text, match) {
  const before = text.slice(Math.max(0, match.idx - 8), match.idx);
  return NEG_PHRASE.test(before);
}

// 规范记账帧：命中 ACCOUNT 且处理动词不带否定前缀（不/没/无/勿/莫/未必）。
// 窗口取动词前 6 字符：否定词可与动词间隔少量字（「没必要纳入」「不予计入」），
// 这是 r234 B11 教训（否定词不总是紧贴被否定词）的同族应用。
const NEG_BEFORE_VERB = /(?:不|没|无|勿|莫|未必|非|未)[^。，！？；\n]{0,4}$/;
function hasAccountingFrame(text, R) {
  const re = R.ACCOUNT_ZH || ACCOUNT_ZH;
  for (const m of allMatches(re, text)) {
    const before = text.slice(Math.max(0, m.idx - 6), m.idx);
    if (NEG_BEFORE_VERB.test(before)) continue;
    return true;
  }
  return false;
}

/**
 * 双腿配对：任一来源标签 × 任一同质违背消费许可，落在窗内即成一签名。
 * NOTCOUNT 型腿②须同句另见 BRIDGE 消费动词/放任桥梁。
 */
function findSignatures(text, R) {
  // [r317] SOURCE_ZH3/SPEND_ZH3/SOURCE_EN3/SPEND_EN3 平行常量 concat：
  // 注入某一族为空数组只关该族，存量族与 r311 族不受影响（同 r311 语义）。
  const srcZh = (R.SOURCE_ZH || SOURCE_ZH).concat(R.SOURCE_ZH2 || SOURCE_ZH2, R.SOURCE_ZH3 || SOURCE_ZH3);
  const srcEn = (R.SOURCE_EN || SOURCE_EN).concat(R.SOURCE_EN2 || SOURCE_EN2, R.SOURCE_EN3 || SOURCE_EN3);
  const spendZh = (R.SPEND_ZH || SPEND_ZH).concat(R.SPEND_ZH2 || SPEND_ZH2, R.SPEND_ZH3 || SPEND_ZH3);
  const spendEn = (R.SPEND_EN || SPEND_EN).concat(R.SPEND_EN2 || SPEND_EN2, R.SPEND_EN3 || SPEND_EN3);
  const ncZh = R.NOTCOUNT_ZH || NOTCOUNT_ZH;
  const ncEn = R.NOTCOUNT_EN || NOTCOUNT_EN;

  const sigs = [];
  const langs = [
    {
      f: srcZh, s: spendZh, n: ncZh,
      bridge: R.BRIDGE_ZH || BRIDGE_ZH,
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      f: srcEn, s: spendEn, n: ncEn,
      bridge: R.BRIDGE_EN || BRIDGE_EN,
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  const dedupeOverlap = (arr) => {
    const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
    const out = [];
    for (const x of sorted) {
      if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
      out.push(x);
    }
    return out.sort((a, b) => a.idx - b.idx);
  };
  for (const { f, s, n, bridge, win, lang } of langs) {
    let fm = [];
    for (const re of f) for (const x of allMatches(re, text)) fm.push(x);
    fm = dedupeOverlap(fm);
    if (!fm.length) continue;
    // SPEND 型腿②（过滤否定前缀）
    let sm = [];
    for (const re of s) for (const x of allMatches(re, text)) {
      if (lang === 'zh' && isNegated(text, x)) continue;
      sm.push(x);
    }
    sm = dedupeOverlap(sm);
    // NOTCOUNT 型腿②（须同句另见 bridge）
    let nm = [];
    for (const re of n) for (const x of allMatches(re, text)) nm.push(x);
    nm = dedupeOverlap(nm).filter(x => bridge.test(text));
    const qm = dedupeOverlap(sm.concat(nm));
    if (!qm.length) continue;
    for (const a of fm) {
      let best = null;
      for (const b of qm) {
        const overlap = a.idx < b.end && b.idx < a.end;
        if (overlap) continue;
        const dist = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (dist > win) continue;
        if (!best || dist < best.dist) best = { dist, q: b };
      }
      if (best) sigs.push({ lang, source: a.raw, spend: best.q.raw, dist: best.dist });
    }
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectMentalAccounting(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免（任一命中即不判）
  if ((R.CONCEDE_ZH || CONCEDE_ZH).test(text) || (R.CONCEDE_EN || CONCEDE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.DECOUPLE_ZH || DECOUPLE_ZH).test(text) || (R.DECOUPLE_EN || DECOUPLE_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (hasAccountingFrame(text, R) || (R.ACCOUNT_EN || ACCOUNT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if ((R.META_ZH || META_ZH).test(text) || (R.META_EN || META_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.72 : 0.62;
  return {
    hit: true,
    dimension: 'mental_accounting',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh' ? '「' + x.source + '」→「' + x.spend + '」' : '"' + x.source + '" -> "' + x.spend + '"')),
    details: s.lang === 'zh'
      ? '心理账户(' + sigs.length + '处: 把「' + s.source + '」当非同质的钱、给出「' + s.spend + '」的放宽消费许可——违背货币同质性)(zh)'
      : 'mental accounting(' + sigs.length + 'x: treats "' + s.source + '" as a different kind of money, licensing "' + s.spend + '" — violating fungibility)(en)',
    guidance: '不要把钱按来源标签当成不同性质的钱来放宽消费（年终奖/意外之财是"白来的"所以可以随便花 / 反正是报销的钱不花白不花 / 中奖的钱跟工资不一样、挥霍不心疼 / the bonus is found money so I might as well splurge guilt-free）：货币是同质的，一块钱的价值和机会成本不取决于它的来源。请把所有来源的收入纳入同一预算统一规划，按真实预算约束做消费决策；"这笔钱不算数"式的自我许可正是心理账户偏差，企业语境下（预算花不掉就乱计入）还会直接造成浪费。',
    tags: ['economics', 'cognitive-bias', 'mental-accounting', 'fungibility', 'budget'],
  };
}

module.exports = {
  detectMentalAccounting,
  __internals: () => ({
    SOURCE_ZH, SOURCE_EN, SPEND_ZH, SPEND_EN, NOTCOUNT_ZH, NOTCOUNT_EN,
    SOURCE_ZH2, SOURCE_EN2, SPEND_ZH2, SPEND_EN2,
    SOURCE_ZH3, SOURCE_EN3, SPEND_ZH3, SPEND_EN3,   // [r317] 新来源标签×新消费许可族
    BRIDGE_ZH, BRIDGE_EN,
    CONCEDE_ZH, CONCEDE_EN, DECOUPLE_ZH, DECOUPLE_EN,
    ACCOUNT_ZH, ACCOUNT_EN, META_ZH, META_EN,
    PAIR_ZH, PAIR_EN,
  }),
};
