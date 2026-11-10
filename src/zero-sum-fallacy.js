/**
 * src/zero-sum-fallacy.js — 「零和误判 / fixed-pie misjudgment」检测器
 * （第 212 个判别维度，r218 起草；8 处 src/index.js 接线由 1 号主力补全，
 * 接线规格见 coordination/reports/r218-dimension-agent4.md §六）
 *
 * [r218 立项] r217 研究轮零命中探针（coordination/agent4/probes/
 * r217-zerohit-probe.js，v6.8.144 实测）：「B 零和误判」族攻击样本
 * 5 条中 4 条 gate.action=pass（中英双语均漏；唯一被代拦的 B1 由
 * loyalty_test 错维度承重，r217 已记录交接 2 号），良性对照 BB1/BB2
 * 2/2 pass（零误伤）。覆盖度检查：zero_sum / 零和 / fixed-pie 在
 * src/ 下 0 命中；false_equivalence（等价混淆）、sunk_cost_coercion
 * （沉没成本×弃羞耻）、relative_privation（相对贫困化）、appeal_to_pity
 * （诉诸怜悯）均不覆盖本族——没有一个判「自愿交换被当作一方所得即
 * 另一方所失」。
 *
 * 外部来源：空返，按既有形态自建。r217 海外扫描（arXiv 宽查询被 API
 * 拆成 OR 零相关、GitHub 短语查询 0、S2 连续 429）无可用纯规则实现；
 * 判据为心虫自有纯规则实现（家族定义取自零和误判 / fixed-pie error /
 * zero-sum misconception 的标准经济学与逻辑学描述）。
 *
 * 辨别的族：零和误判（zero-sum misconception / fixed-pie error）——
 * 把**自愿交易/交换**当成**一方之所得即另一方之所失**：
 *   这笔贸易里对方赚了大头，说明我们这边肯定亏了。
 *   他们出口越多赚得越多，我们买得越多就亏得越多。
 *   买家省了钱，那卖家必然多付了代价，一进一出总有人吃亏。
 *   They profited from the deal, which means we must have lost.
 *   Every dollar they earn from this trade is a dollar taken from us.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：自愿交换的
 * 结构是**双方各以所余换所缺、退出成本为零时成交即双方主观获益**——
 * 收益不是从对方口袋里转移过来的，而是交换释放的存量价值。零和误判
 * 把「一方账面上的所得」直接对偶成「另一方账面上的所失」，进而推出
 * 「贸易必然有人吃亏」「保护主义才能少亏」一类结论。它是固定馅饼
 * 假设（fixed-pie assumption）的话语形态，是反贸易、反合作、阵营对
 * 抗叙事的推理底座。
 *
 * 与既有维度的边界（r218 归因）：
 *   · false_equivalence（第 66 维附近）管两个不同事物被当成同一事
 *     物；本族管交换的价值总量被误设为恒定（所得=所失的对偶断言）。
 *   · sunk_cost_coercion（第 98 维）管「已投入×退出可耻」的操控；
 *     本族管交换结果被解释成单向转移。
 *   · relative_privation 管「别人更惨所以你不算惨」；本族管交易
 *     双方的损益被绑定成镜像。
 *   · appeal_to_pity 管诉诸怜悯；本族不诉诸情感，只做损益对偶的
 *     结构性误断。
 *
 * 判据（腿① 交换语境 × 腿② 零和断言，缺一不判；腿②五形任一）：
 *   · 腿① CONTEXT 交换语境：交易事件词（贸易/交易/买卖/进出口/出口/
 *     进口/成交/合作/订单/合同/生意/供货/采购/谈判/议价/买家/卖家/
 *     买方/卖方/商家/供应商/客户；EN trade/deal/exchange/import/
 *     export/purchase/contract/transaction/business/market/buyer/
 *     seller/vendor/supplier/customer/partner）或交换双方指称
 *     （对方/另一方/他们/我们/人家；EN they/them/their/we/us/our/
 *     the other side/one side）。
 *   · 腿② ZEROSUM 零和断言（五形任一，命中位置前 8 字 / 14 字符内
 *     不得有否定标记——「并不意味着我们吃亏」是正确判别不是误判）：
 *     E-1 显式零和短语：零和/零和博弈/零和游戏/零和思维/固定馅饼/
 *       一进一出/总有人吃亏/有人赚就有人亏/所得即所失/一方所得/
 *       此消彼长/你多我少/羊毛出在羊身上/赢家通吃/你死我活；
 *       EN zero-sum / fixed pie / winner-takes-all / one side's gain
 *       is the other side's loss / taken from us / out of our pockets /
 *       at our expense / our loss / what they win ... we lose。
 *     E-2 损益方程形：所得方（赚/获利/盈利/得利/拿走/省了钱）在
 *       「等于/即是/相当于/无非/说白了」之后接所失方（亏/吃亏/损失/
 *       多付/代价/买单/被拿走）。
 *     C-1 推断链形：所得方 →（推断词 所以/因此/说明/意味着/肯定/
 *       必然/一定/注定；EN so/which means/therefore/must）→ 所失方。
 *     C-2 比较级平行形：越…越赚 … 越…越亏（EN the more ... earn
 *       ... the more ... lose）。
 *     C-3 每A即B形：每多赚/每获利 … 亏/损/代价。
 *
 * 为什么取 VERIFY 级：单句也可能是对真实零和局面的客观描述（奖牌
 * 名额固定、一块蛋糕的分配、座位有限的拍卖），也可能是新闻报道的
 * 转述、课堂案例；rewrite 会误伤。verify 的含义是「这段文本把自愿
 * 交换断言成了单向损益转移，需要回到交换双侧主观估价与退出成本再
 * 下结论」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 教学/概念转述（教材/课堂/论文/悖论/称为/定义为/概念/所谓/是
 *     指/博弈论/理论上；EN textbook/lecture/paradox/called/defined/
 *     concept/game theory）——讨论这个概念本身不是运用它；
 *   · 正确响应形（自愿交易让双方受益/双赢/互利/不是零和/并非零和/
 *     零和谬误/把蛋糕做大/价值创造；EN voluntary exchange/both sides
 *     benefit/win-win/not zero-sum/fallacy/grows the pie）——指出
 *     交换可以双侧获益，正是本族要教的判别动作（「不是零和」后接
 *     「是什么」的反问形不豁免：那是用否定句式包装的断言）；
 *   · 无腿②（只有交易语境、没有损益对偶断言）——缺零和断言即无
 *     误判可判；
 *   · 疑问句（含 ?/？）——但反问标记（难道/岂/何尝/岂不是/谈何；
 *     EN isn't it/doesn't that/how else/what else/if not）不豁免：
 *     用问号包装的断言仍是断言。
 */
'use strict';

// ─── 腿① CONTEXT 交换语境（中文）──────────────────────────────────
// [r275 补腿] 原表只收交易事件词与对方/他们/我们/人家/彼此/双方——诊断
// 实证 8/10 攻击句 ctx=false：「你多赚一块钱，就一定有人少赚一块钱」
// 「你的收益就是我的损失」这类**收益方×损失方对置**句不含任何交易
// 事件词。本族的推理底座是「损益对偶」，不必然出现在贸易语域（职场
// 晋升、比赛胜负、机会争夺同样成立），故腿①扩为三选一：交换事件词 /
// 交换双方指称 / 损益双方指称（你-我、有人-他人、A-B 对置）。
const CONTEXT_ZH = [
  /贸易|交易|买卖|进出口|出口|进口|成交|合作|订单|合同|生意|供货|采购|商业|谈判|议价|讨价还价|竞价|成交价|市场化|互通有无|各取所需/,
  /买家|卖家|买方|卖方|商家|客户|供应商|生产商|经销商|贸易商|厂商|甲方|乙方/,
  /对方|另一方|他们|我们|人家|彼此|双方/,
  // [r275] 损益双方指称：收益方与损失方作为两个可区分主体被并置。
  // 注：不排除逗号——「我赢了这场比赛，意味着你输了这场比赛」的损益
  // 双方被逗号隔开仍是同一断言的对偶两端；否定守卫与窗口限制在腿②
  // 另行收紧，此处只负责确认「句中存在两个可区分的损益主体」。
  /你[^。；]{0,12}我|我[^。；]{0,12}你|有人[^。；]{0,8}(别人|他人|其他人)|别人|他人|其他人|其他人等|一方[^。；]{0,6}另一方|赢家|输家|赢方|输方|胜者|败者|赢的|输的|这个(人|团队|公司|国家)[^。；]{0,8}那个(人|团队|公司|国家)|A[^。；]{0,6}B|他[^。；]{0,8}你|你[^。；]{0,8}他/,
  // [r275 补腿2] **单侧指称形**：句中出现「有人/他人/别人/总有人」作为
  // 独立的损益主体，而不需要成对的「你-我」——「你多赚一块钱，就一定
  // 有人少赚一块钱」「有人变富就必然有人变穷」都属此类。诊断实证
  // L1/L4 腿②三件套齐备（GAIN→INFER→LOSS 顺序与窗口全对），仅因腿①
  // 要求成对指称而整句漏判。本族断言中「有人」常被用来指代匿名的
  // 所失方，是零和叙事的典型措辞。
  /有人|总有人|总会有人|必然会有人|一定有人|他人|别人|其他人|旁人|众人|大家/,
];

// ─── 腿② 所失方 LOSS（中文；r161 教训：收裸词形态）────────────────
const LOSS_ZH = [
  /亏了|亏得|亏钱|亏本|吃亏|受损失|有损失|遭受损失|损失了|利益受损|血本无归|赔了|赔钱|倒了霉|晦气/,
  /多付|付了代价|付出代价|买单|流失|被拿走|被抢走|被占了|亏损|蚀本|折本|吐出去|多掏|掏了|让利(?![的])/,
  // [r275 补腿] 胜负/机会竞争语域的所失方：输、失去、落选、被挤掉。
  // r161 教训：收裸词形态——「输」「失去」不带宾语也承重。
  /输了|输掉|败了|落败|落选|没选上|没选上|被刷|被淘汰|出局|没机会|失去|失掉|少了|少赚|少拿|少得|受损|被挤|被顶|被顶替|被替换|被裁|被辞|被辞退|被优化|丢工作|失业|排名下降|掉出/,
  // [r275 补腿2] 与 GAIN 侧「多赚/变富/切走大块」对置的所失量：
  // 「少赚一块钱」「变穷」「拿小块」「少分」。诊断实证 L1/L4/L9
  // 在原表下 LOSS 零命中。
  /少挣|少分|少得|变穷|穷下去|更穷|被变穷|拿小块|分得少|分到少|切小块|份额变小|分得少|拿更少|得到更少|少受益|少得益|被压缩|被摊薄/,
  // [r275 补腿3] 职场挤出语域：「被挤了下来/被顶掉/被比下去」——
  // L2「他升职加薪了，说明有人被他挤了下来」的所失方。零和叙事在
  // 晋升与岗位争夺语域里的典型所失形态，非货币、无「亏/输」字样。
  /被挤|挤了|挤掉|被顶|被比下去|比下去|被刷下来|刷下来|被顶替|取代了|被换掉|换掉|被抢走|抢走|被夺走|夺走|被抢占|抢占|被占掉|占掉/,
];

// ─── 腿② 所得方 GAIN（中文）──────────────────────────────────────
const GAIN_ZH = [
  /赚了|赚得|挣了|多赚|赚的|挣的|赚大头|挣大头|拿大头|捞一笔|捞一票|获利|盈利|得利|受益|发了财|发财|省了钱|省钱|获益|渔利|牟利|分到大头|占了大头|拿走|拿到|利润|收益|毛利|营收|营业额|报酬/,
  // [r275 补腿] 胜负/机会竞争语域的所得方：赢、得到、升职、入选、
  // 拿到名额。r161 教训：收裸词形态——「赢」「得到」不带宾语也承重。
  /赢了|赢到|胜出|夺冠|拿下|得到|获得|入选|选中|被选|升职|晋升|加薪|上位|占位|抢到|夺得|攀上|跻身/,
  // [r275 补腿2] 量词-损益对置与份额词：「多赚一块钱/少赚一块钱」
  // 「变富/变穷」「切走大块/拿小块」「多分/少分」。r161 教训：同一族
  // 里「赚」的裸词与「多赚/少赚」的偏指形态都要收——前者是动作，后者
  // 才是零和断言里真正出现的对置量。
  // 【承重约束】只收**带偏指/量差/份额语义**的词形，不收「拿走/拿到/
  // 得到/切走」这类裸动词——裸动词会让 C-2 比较平行形测试句
  // （「他们出口越多赚得越多，我们买得越多就亏得越多」）改走 C-1
  // 推断链，导致注入 COMP_ZH=永假后仍然命中，破坏「COMP_ZH 承重」
  // 单测（r275 实测回归 23/23 → 22/23）。偏指量词天然不构成
  // 比较平行形（比较平行要「越X越Y」结构），故无此风险。
  /多赚|多挣|多拿|多分|多得|变富|富起来|更富|切走|拿大头|占大头|份额变大|分得多|切大块|拿大块|拿走更多|得到更多|拿得多|多得益|多受益|赚得更多|挣得更多|分到更多/,
];

// ─── 腿② C-1 推断词（中文）───────────────────────────────────────
// 【r275 收紧】不收录「就/那就/就只能/只能」这类泛伴随词——C-2 比较
// 平行形测试句「他们出口越多赚得越多，我们买得越多就亏得越多」里的
// 「就」会被 INFER 捕获，使该句改走 C-1 推断链，注入 COMP_ZH=永假后
// 仍命中，破坏「COMP_ZH 承重」单测（r275 实测回归）。零和断言的推断
// 力由「说明/意味着/必然/一定」等实词承担，泛「就」不承重。
const INFER_ZH = /所以|因此|因而|可见|说明|意味着|证明|显然|肯定|必然|一定|注定|相当于|等于|即是|无非|不过就是|说白了|说到底|自然|势必|必将|必定|定然|全是因为|完全是因为|归根到底|说到底/;

// ─── 腿② E-1 显式零和短语（中文）─────────────────────────────────
const EXPLICIT_ZH = [
  /零和|固定馅饼|定量馅饼|常量馅饼|一进一出|总有人吃亏|有人赚就有人亏|有人赢就有人输|所得即所失|一方所得|一方之所得|所失|此消彼长|你多我少|你多我就少|羊毛出在羊身上|赢家通吃|你死我活|零和游戏|零和博弈/,
  // E-2 损益方程形：赚的就是…亏的 / 每一分钱都等于从…拿走 / 拿走的全是…吐出去的
  /(?:赚|获利|盈利|得利|拿)的?[^。；]{0,12}(?:就是|等于|即是)[^。；]{0,12}(?:亏|损|失|代价|拿走)/,
  /(?:拿|赚|获|取)走?的[^。；]{0,12}(?:全是|都是|正是|即是)[^。；]{0,12}(?:吐|付|亏|损|失|代价)/,
  /每[^。；，]{0,12}(?:赚|获利|得利|多拿|多挣)[^。；]{0,16}(?:亏|损|失|代价)/,
  /(?:所赚|所获|所得)[^。；，]{0,8}(?:即|就是|全是)[^。；，]{0,8}(?:所失|所亏|损失|代价)/,
  // [r275 补腿] 损益对置方程形（E-2 新族）：收益方词 + 等词/推断词 +
  // 损失方词，双向可写（「你的收益就是我的损失」/「我的损失就是你
  // 的收益」）。诊断实证原五形对「你多赚一块钱，就一定有人少赚一块
  // 块钱」「A 赢意味着 B 输」「他得到了这份工作，你就必然失去这个
  // 机会」全部零覆盖——这类句子的收益词（赚/赢/得到/收益）与损失词
  // （少赚/输/失去/损失）由等词或推断词直接对置，中间隔的是损益主体
  // 指称而非损益量。
  /(?:你|我|他|对方|有人|他人|别人|一方|赢家|胜者)的?(?:收益|所得|获利|盈利|得到|赢得|赢|赚|多赚|收入|成果|好处|利益)[^。；，]{0,14}(?:就是|等于|即是|意味着|说明|换来)[^。；，]{0,14}(?:我|你|他|对方|有人|他人|别人|另一方|输家|败者)的?(?:损失|所失|亏损|失去|输|亏|少赚|代价|付出)/,
  /(?:我|你|他|对方|有人|他人|别人|一方)的?(?:损失|所失|失去|亏损|亏)[^。；，]{0,14}(?:就是|等于|即是|意味着|说明|换来)[^。；，]{0,14}(?:你|我|他|对方|有人|他人|别人|另一方)的?(?:收益|所得|获利|得到|赢得|赚|多赚|好处|利益)/,
  // 无主体词的裸对置形：「有赚就有亏」「有人赚就一定有人亏」
  /(?:有人|有人家|总有人)?[^。；，]{0,6}(?:赚|赢|得到|获利)[^。；，]{0,10}(?:就|必然|一定|注定|势必)[^。；，]{0,10}(?:有)?(?:人|他人|别人)?[^。；，]{0,4}(?:亏|输|失去|损失|少赚|受损)/,
  // 【r275 撤腿】不收「越…赚…越…亏」形——它与 C-2 比较平行形
  // （「他们出口越多赚得越多，我们买得越多就亏得越多」）结构完全重叠，
  // 而 COMP_ZH 已覆盖该结构。r275 实测：注册该形后单测「注入
  // COMP_ZH=永假 → C-2 承重」回归（22/23）——测试句改走 E-2 旁路，
  // 说明该形不是独立族而是 C-2 的重复注册。零和断言的「越X越Y」必须
  // 由 COMP_ZH 承重，这是 r218 设计的腿②归属纪律。
  // 反问族：「难道A赚…，我们还能不亏吗」——用反问句式包装的零和断言。
  // 收紧在「还能不/岂不/不得不/不能不 + 损益词」形，放过质疑式反问
  // （「难道他们赚大头，就证明我们亏了吗？」是在质疑零和叙事，不判）。
  /难道[^。？]{0,24}(?:赚|获利|盈利|得利|拿走|获益)[^。？]{0,24}(?:还能不|岂不|不得不|不能不)[^。？]{0,8}(?:亏|损|失|吃亏|代价)/,
  /岂[^。？]{0,20}(?:赚|获利|盈利)[^。？]{0,20}(?:还能不|岂不|不得不|不能不)[^。？]{0,8}(?:亏|损|失|吃亏)/,
];

// ─── 腿② C-2 比较级平行形（中文）：越…赚 … 越…亏 ──────────────────
const COMP_ZH = /越[多较高][^。；，]{0,14}(?:赚|获利|盈利|得利|受益)[^。；]{0,26}越[多较高][^。；，]{0,14}(?:亏|损|失|少)/;

// ─── 英文常量 ───────────────────────────────────────────────────
const CONTEXT_EN = [
  /\b(?:trade|trading|deals?|exchange|imports?|exports?|purchase|purchases|purchased|contract|contracts|transaction|transactions|business|commerce|market|buyers?|sellers?|vendors?|suppliers?|customers?|clients?|partners?|partnership)\b/i,
  /\b(?:they|them|their|we|us|our|the\s+other\s+(?:side|party)|one\s+side|another\s+party|both\s+sides)\b/i,
  // [r275 补腿] 损益双方指称（英）：收益方与损失方作为两个可区分主体被并置
  /\b(?:you|them|they|each other|one another|someone else|others?|rivals?|opponents?|competitors?|winner|loser)\b/i,
];
const GAIN_EN = [
  /\b(?:earn|earns|earned|earnings|earning|profit|profits|profited|profitable|gain|gains|gained|benefit|benefits|benefited|save|saves|saved|savings|pocket|pocketed|rake\s+in|rakes\s+in|raked\s+in|cash\s+in|cashes\s+in)\b/i,
  // [r275 补腿] 非货币与一般所得（英）：make（赚到）、win、take、
  // get——L6 "Every dollar you make is a dollar taken from someone else"
  // 在原表下 GAIN 零命中。r161 教训：收裸词形态。
  /\b(?:make|makes|making|made|win|wins|winning|won|take|takes|taking|took|get|gets|getting|got|score|scores|scoring|secure|secures|secured|advance|promoted)\b/i,
];
const LOSS_EN = [
  /\b(?:lose|loses|lost|loss|losses|taken|taking|paying|pay|paid|expense|suffer|suffers|suffered|worse\s+off|shortchanged|ripped\s+off|fleeced|left\s+with\s+less|overpay\w*|overcharg\w*)\b/i,
];
const INFER_EN = /\b(?:so|therefore|thus|which\s+means|that\s+means|it\s+shows|means|implies|hence|consequently|must|necessarily|inevitably|basically|equivalent\s+to|equals?|because|since)\b/i;
const EXPLICIT_EN = [
  /\bzero[\s-]?sum\b/i,
  /\bfixed[\s-]?pie\b/i,
  /\bwinner[\s-]takes[\s-]all\b/i,
  /\bone\s+side'?s\s+gain\s+is\s+(?:the\s+)?other'?s\s+loss\b/i,
  /\btheir\s+gain\s+is\s+our\s+loss\b/i,
  /\btaken\s+from\s+us\b/i,
  /\bout\s+of\s+our\s+pockets?\b/i,
  /\bat\s+our\s+expense\b/i,
  /\bour\s+loss\b/i,
  /\bwhat\s+they\s+win\b[^.]{0,40}\bwe\s+(?:lose|lost)\b/i,
  /\bevery\s+(?:dollar|cent|unit|euro|yuan)\s+they\s+earn\b[^.]{0,40}\b(?:taken|lost|from\s+us)\b/i,
  // [r275 补腿] E-2 方程形（EN）：Every dollar YOU make IS A DOLLAR taken
  // FROM SOMEONE ELSE. —— 所得与所失由「is a」直接等同、所失方是
  // someone else 而非 us/our，故 C-3 与 E-2 既有形都不命中。诊断实证
  // L6 在原表下 GAIN/LOSS 双零命中。
  /\bevery\s+(?:dollar|cent|unit|euro|yuan)\s+(?:that\s+)?(?:you|they|he|she|we|I)\s+(?:make|earn|gain|win|take|get)\b[\w\s,']{0,24}\b(?:is|are)\s+(?:a|an|one)?\s*(?:dollar|cent|unit|euro|yuan)?\s*\w{0,12}\s*(?:taken|lost|away)\s+from\s+(?:someone|somebody|others?|them)\b/i,
  // E-2 损益方程形（EN）：what they earn is what we lose / their gain equals our loss
  /\bwhat\s+they\s+(?:earn|gain|profit)\b[^.]{0,30}\b(?:is|equals?)\b[^.]{0,30}\b(?:we\s+(?:lose|lost)|our\s+(?:loss|losses))\b/i,
  /\btheir\s+(?:gain|profit|earnings?)\s+(?:is|equals?|means)\s+our\s+(?:loss|losses)\b/i,
  // C-3 每A即B形（EN）：every dollar they make is a dollar off our books
  /\bevery\s+(?:dollar|cent|unit|euro|yuan)\s+they\s+(?:make|earn|take)\b[^.]{0,40}\b(?:off\s+our|from\s+our|out\s+of\s+our)\b/i,
  // [r275 补腿] 损益对置方程形（英，镜像 E-2 新族）：收益方词 + 等词/
  // 推断词 + 损失方词，双向可写；含「if X gains, Y must lose」与
  // 「X wins only when Y loses」两个条件对置形。
  /\b(?:your|my|his|her|their|our|one'?s)\s+(?:gain|gains|profit|win|success|earnings?|benefit|benefits|advantage)\b[\w\s,']{0,20}\b(?:is|are|means|implies|equals?|signals)\b[\w\s,']{0,20}\b(?:my|your|his|her|their|our|someone\s+else'?s)\s+(?:loss|losses|losing|defeat|cost|expense|disadvantage)\b/i,
  /\b(?:my|your|his|her|their|our)\s+(?:loss|losses|losing|defeat)\b[\w\s,']{0,20}\b(?:is|are|means|implies|equals?|signals)\b[\w\s,']{0,20}\b(?:your|my|his|her|their|our)\s+(?:gain|gains|profit|win|success|benefit)\b/i,
  /\bif\s+(?:you|they|we|I)\s+(?:gain|win|succeed|profit|benefit|earn)\b[\w\s,']{0,24}\b(?:I|you|we|they)\s+(?:must|have\s+to|will|shall|necessarily)\s+(?:lose|losing|fail|suffer|be\s+worse\s+off)\b/i,
  /\b(?:you|they|we|I)\s+(?:gain|win|earn|succeed)\b[\w\s,']{0,20}\bonly\s+(?:when|if|because)\b[\w\s,']{0,20}\b(?:I|you|we|they)\s+(?:lose|losing|fail|suffer)\b/i,
  /\bthe\s+more\s+[\w\s,']{0,24}\b(?:gain|win|earn|benefit|succeed)\b[\w\s,']{0,24}\bthe\s+more\b[\w\s,']{0,24}\b(?:lose|losing|loss|suffer)\b/i,
];
const COMP_EN = /\bthe\s+(?:more|less|better|harder)\b[^.]{0,40}\b(?:earn|profit|gain|sell|sells|sold|export|exports|ship|benefit)\b[^.]{0,60}\bthe\s+(?:more|less|worse)\b[^.]{0,40}\b(?:lose|lost|loss|pay|paid|suffer|worse\s+off)\b/i;

// ─── 豁免一：教学/概念转述（讨论概念本身不是运用它）────────────────
const EXEMPT_META_ZH = [
  /教材|课堂|教科书|讲座|教案|习题|论文|文献|称为|定义为|概念|所谓|是指|悖论|理论上|博弈论|学术|研讨|谬误|误区|思维陷阱|认知偏误/,
  // [r275] 「零和博弈/零和游戏/零和思维」作为**被讨论的概念名**出现时，
  // 后文是定义或属性陈述（「在零和博弈里，一方所得正是另一方所失」是
  // 教科书定义句，不是运用）。与 EXPLICIT_ZH 的 E-1 同词形，靠这句豁免
  // 区分「谈论概念」与「运用概念」。
  /(?:在|这是|属于|所谓|称为|所谓|就是|属于|典型|标准|严格|真正|纯粹|完全|真正意义上的|教科书式的|经典|典型)的?(?:零和博弈|零和游戏|零和思维|零和局|零和局面|零和情境)/,
];
const EXEMPT_META_EN = [
  /\b(?:textbook|lecture|paradox|called|defined|definition|concept|game\s+theory|theory|fallacy|misconception|cognitive\s+bias|paper|study\s+(?:shows|found))\b/i,
  // [r275] 与 ZH 镜像的「严格/纯粹/教科书式 + zero-sum」定义形——「strict
  // zero-sum game」是教科书定义句而非断言运用。诊断实证 EN 良性样本
  // "In a strict zero-sum game, one player's payoff is the other player's
  // loss." 在原表下被 EXPLICIT_EN 的 zero-sum 与 E-2 方程形双命中。
  /\b(?:strictly|truly|pure(?:ly)?|technically|textbook|classic(?:al)?|standard|by\s+definition|in\s+a)\s+zero[-\s]?sum\s+(?:game|games|situation|scenario|setting|contest|match|framework|model)\b/i,
];

// ─── 豁免二：正确响应形（指出交换可双侧获益，正是要教的判别动作）───
// 「不是零和」后接「是什么」是反问形（用否定句式包装的断言），不豁免。
const EXEMPT_CORRECT_ZH = [
  /自愿交易|自愿交换|自愿合作/,
  /双方都受益|双方受益|互惠互利|互利共赢|共赢|是双赢|双赢的|双赢局面|双赢结果|实现双赢|达到双赢|共同受益|皆大欢喜|各得其所|把蛋糕做大|蛋糕做大|价值创造|创造价值|正和/,
  /不是零和(?!是什么)|并非零和|不属于零和|不等于零和|不是此消彼长|谈不上零和/,
  /零和谬误|零和思维是|零和误判|把贸易当成零和|把交易看成零和|固定馅饼谬误|固定馅饼思维/,
];
const EXEMPT_CORRECT_EN = [
  /\bvoluntary\s+(?:exchange|trade|transaction)\b/i,
  /\bboth\s+sides\s+(?:benefit|gain|better\s+off|win|profit)\b/i,
  /\bmutually\s+beneficial\b/i,
  /\bwin[\s-]win\b/i,
  /\bnot\s+(?:a\s+)?zero[\s-]?sum\b/i,
  /\b(?:fallacy|misconception|mistake|myth)\b/i,
  /\b(?:grows?|expand(?:s|ing)?|enlarges?)\s+the\s+pie\b/i,
  /\bcreates?\s+(?:new\s+)?value\b/i,
];

// ─── 否定守卫（窗口化：查腿命中位置前的否定标记）──────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|不会造成|不会导致|不是说|不能说|谈不上|谈不上是|并不意味着|并没有|也不存在/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|neither|nor|no\s+longer)\b/i;

// 邻近窗（中文按字、英文按字符）
const WIN_CTX_ZH = 200;   // 腿① ↔ 腿②（同句内即可，句长上限兜底）
const WIN_CTX_EN = 500;
const WIN_GAIN_INFER_ZH = 40;  // 所得方 ↔ 推断词
const WIN_GAIN_INFER_EN = 120;
const WIN_INFER_LOSS_ZH = 40;  // 推断词 ↔ 所失方
const WIN_INFER_LOSS_EN = 120;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表可注入空数组；INFER 单正则注入替换正则
// （负例脚本用 /(?!x)x/ 永假式抹掉该腿）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

// 找列表中任一命中的首个位置
function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

// 全量命中位置（global 扫描）
function allIdx(list, text) {
  const out = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      out.push({ idx: m.index, text: m[0] });
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return out;
}

// 窗口化否定守卫：命中位置前 n 字/字符内不得有否定标记
function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿①：交换语境
function findContextLeg(text, isZh, R) {
  const list = isZh ? (R.CONTEXT_ZH || CONTEXT_ZH) : (R.CONTEXT_EN || CONTEXT_EN);
  return firstIdx(list, text);
}

// 腿② E-1/E-2/C-3：显式短语族（任一命中且未被窗口否定）
function findExplicitLeg(text, isZh, R) {
  const list = isZh ? (R.EXPLICIT_ZH || EXPLICIT_ZH) : (R.EXPLICIT_EN || EXPLICIT_EN);
  for (const hit of allIdx(list, text)) {
    if (!negatedBefore(text, hit.idx, isZh)) return hit;
  }
  return null;
}

// 腿② C-2：比较级平行形
function findCompLeg(text, isZh, R) {
  const re = isZh ? pickRe(R.COMP_ZH, COMP_ZH) : pickRe(R.COMP_EN, COMP_EN);
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = reG.exec(text)) !== null) {
    if (!negatedBefore(text, m.index, isZh)) return { idx: m.index, text: m[0] };
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return null;
}

// 腿② C-1：推断链形 所得方 → 推断词 → 所失方（所失方不得被窗口否定）
function findChainLeg(text, isZh, R) {
  const gains = isZh ? (R.GAIN_ZH || GAIN_ZH) : (R.GAIN_EN || GAIN_EN);
  const losses = isZh ? (R.LOSS_ZH || LOSS_ZH) : (R.LOSS_EN || LOSS_EN);
  const inferRe = isZh ? pickRe(R.INFER_ZH, INFER_ZH) : pickRe(R.INFER_EN, INFER_EN);
  const winGI = isZh ? WIN_GAIN_INFER_ZH : WIN_GAIN_INFER_EN;
  const winIL = isZh ? WIN_INFER_LOSS_ZH : WIN_INFER_LOSS_EN;

  for (const g of allIdx(gains, text)) {
    const inferG = new RegExp(inferRe.source, inferRe.flags.includes('g') ? inferRe.flags : inferRe.flags + 'g');
    let im;
    while ((im = inferG.exec(text)) !== null) {
      if (im.index < g.idx || im.index - g.idx > winGI) continue;
      for (const l of allIdx(losses, text)) {
        if (l.idx < im.index || l.idx - im.index > winIL) continue;
        if (negatedBefore(text, l.idx, isZh)) continue;
        return { idx: l.idx, text: g.text + ' → ' + im[0] + ' → ' + l.text };
      }
    }
  }
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkZeroSumFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免：仅当句中无反问标记时豁免（用问号包装的断言仍是断言）
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|谁不知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }

  // 豁免一：教学/概念转述
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免二：正确响应形
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿①：交换语境（交易事件词或交换双方指称）
  const ctxIdx = findContextLeg(text, isZh, R);
  if (ctxIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿②：零和断言五形任一（E-1/E-2/C-3 显式 / C-2 比较平行 / C-1 推断链）
  const forms = [];
  const ex = findExplicitLeg(text, isZh, R);
  if (ex) forms.push({ form: 'E', hit: ex });
  const cp = findCompLeg(text, isZh, R);
  if (cp) forms.push({ form: 'C-2', hit: cp });
  const ch = findChainLeg(text, isZh, R);
  if (ch) forms.push({ form: 'C-1', hit: ch });
  if (forms.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.6,
    count: forms.length,
    detail: isZh
      ? '零和误判：自愿交换被当作一方所得即另一方所失(zh, ' + forms.map(f => f.form).join('+') + ')'
      : 'zero-sum misconception: voluntary exchange treated as one side gain = other side loss(en, ' + forms.map(f => f.form).join('+') + ')',
  };
}

module.exports = {
  checkZeroSumFallacy,
  __internals: () => ({
    CONTEXT_ZH, GAIN_ZH, INFER_ZH, LOSS_ZH, EXPLICIT_ZH, COMP_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, NEG_ZH,
    CONTEXT_EN, GAIN_EN, INFER_EN, LOSS_EN, EXPLICIT_EN, COMP_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN, NEG_EN,
  }),
};
