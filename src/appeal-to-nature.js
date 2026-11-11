/**
 * src/appeal-to-nature.js — 「诉诸自然谬误」检测器（第 139 个判别维度）
 * [r706 立项] decision 本体在 138 维引擎上选出（/tmp/decide-run-706.js 读
 * /tmp/decide-opts-706.json，composite_score 0.92 / confidence 0.9 /
 * identity alignment 100%，无拒选）。轮前探针 /tmp/r705-preprobe.js 复量
 * （样本集与 r704/r705 完全一致，跨轮可比）：攻击 10 条漏判 8/10、
 * 漏判中真零命中 5/8、良性误伤 1/12 且全部归因存量维度
 * （unsupported_claim/vagueness/moral_foundations/appeal_to_authority），
 * 本族自身存量误伤 0 → 探测器判定合格。
 * 判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算
 * 漏判。Phase 1.5 同律复核：5 条真零命中样本逐条跑 discriminate() 实测
 * 全维度零命中——不是被聚合压掉，是射程外。缺口成立。
 *
 * [r257 扩展·真升级②] 4 号探针（coordination/agent4/probes/r257-probe-round2.js）
 * 在既有双腿判据上补**全新措辞家族**：攻击 20 条穿透 16 条，穿透样本全部
 * 落在两条腿的措辞射程外（不是判据结构问题，是词表问题）。本模块已接线
 * （src/index.js require + 九处登记），故扩展**live 生效**，维度计数不变。
 * 补入内容：
 *   · 腿①自然性断言新族 ZH 7 支 / EN 8 支：
 *       ZH 大自然的选择/规律/法则、未经(任何)(工业)加工/非人工、
 *       有机(限定复合词——刻意排除「有机化合物/有机化学」以免误伤化学语境)、
 *       农家自榨/土法/自家养、手工+制作动词与「手工的」、山泉/矿泉水/井水、
 *       刚下/现摘 的蛋奶菜果鱼肉；
 *       EN nature's way/design/plan、unprocessed/not processed/minimally
 *       processed（不收裸 processed——"processed data" 是数据处理不是
 *       自然性论证）、plant-based/herb-based（不带 extract/formula 也判）、
 *       organically grown/organic produce/organic farming/certified organic、
 *       farm-fresh/freshly laid/farm-to-table、handmade/handcrafted/
 *       hand-picked、spring water/mineral water、raw milk/honey/cheese、
 *       unpasteurized/unrefined；
 *   · 腿②优越/安全结论新族 ZH 5 支 / EN 8 支：
 *       ZH 裸比较级（更/还要/还要 + 安全|健康|…，无「比X」也判）、
 *       裸比较形（比X + 优越词，无「更/还」也判）、最…形、
 *       不会有错/错不了/准没错（认识论封闭形）、才是/就是+优越词、
 *       吃着才放心（原 c 支倒装形）；
 *       EN has to be + 比较级、must be right/cannot be wrong、
 *       automatically/inherently/necessarily + 优越词、
 *       the healthiest/safest/most nourishing + choice/option、
 *       the only kind you can trust、naturally + 比较级、
 *       simply/just/plainly better、more nourishing/more wholesome；
 *   · 新增 concessive-debate 豁免（HEDGE）：优越断言被让步/争议标记限定时
 *       不判——「有机种植可能更安全，但这方面仍有争议，要看检测数据」是在
 *       呈现争论，不是在以自然性置换证据；
 *   · 新增防自证守卫：腿①与腿②必须存在**一对零重叠**的匹配——「无添加」
 *     同时落入两腿时不判（同族自称不构成论证）。
 *
 * [r291 扩展·真升级②] 4 号探针（coordination/agent4/probes/r291-probe.js）
 * 在既有判据上补**两个全新措辞家族**（模块已接线，维度计数不变，live 生效）：
 *   ①「非自然/人造/工业即有害」反向族（JSDoc 首行历来声明射程却零覆盖）：
 *      腿①'非自然性生产断言（工业合成/勾兑、人工饲养/干预、化学手段、
 *      实验室合成、饲料激素速成、转基因 / synthetic、artificially
 *      ripened、GMO、factory-farmed）× 腿②'危害或不如结论（必然出问题/
 *      伤身体、比不上/不如、不能吃喝 / inherently less safe、cannot be
 *      good for you）。r291 探针实测该族 6/6 穿透样本全部零维度命中
 *      （「转基因食品是人为干预的产物，长期吃必然出问题」等）。
 *      **不交叉配对**：自然性×危害是安全警告（野菜吃多了伤肝）、非自然性×
 *      优越是正当比较（工业合成效率更高），都不判。
 *   ②自然性裸存在句补腿：n8 山里放养/刚捞上来的/散养土鸡（ZH）、
 *      e9 free-range/pasture-raised/grass-fed（EN）、s6 比X鲜甜/鲜美（ZH
 *      口味优越形）——旧判据的自然性断言都带论证形（纯天然/古法/有机），
 *      「那是山里放养的土鸡，比饲料鸡有营养」整族射程外。
 * 同轮附 no_true_scotsman HEDGE_RE「不可能」假豁免修复（否定前瞻，r289 交接）。
 *
 * 辨别的族：「诉诸自然谬误」（appeal to nature）——以「天然/自然/野生/
 * 老祖宗传下来的」为依据，断言某事物**更安全、更健康、更优越**，或暗示
 * 「非自然（化学/人工/工业）」即有害：
 *   这是纯天然植物提取的，肯定比化学药安全。
 *   全天然成分，没有任何添加剂，所以放心吃。
 *   这东西是野生的，比养殖的有营养。
 *   自然熟的果子比催熟的健康，这是自然规律。
 *   我们这是纯草本配方，没有任何化学成分。
 *   原始森林里的空气比城里的好，毕竟没有工业污染。
 *   这部手机用的是天然材质，手感肯定更高级。
 *   这个疗法用的是自然疗法，比西医副作用小。
 *   母乳是天然的，所以一定比配方奶好。
 *   老祖宗传下来的做法，自然是经过时间检验的。
 *   It's all-natural plant extract, so it must be safer than chemical
 *   medicine.
 *   Wild-caught fish is more nutritious than farmed fish.
 *   Our formula is 100% herbal with no artificial chemicals.
 *   This phone uses natural materials, so it definitely feels more
 *   premium.
 *
 * 与既有维度的边界（r706 复量归因）：
 *   · moral_foundations 对 3 条本族样本有沾边命中（自然规律/无污染/
 *     自然疗法），但该维度不在 action-forcing 集合，gate.action 恒
 *     pass——它管道德基础框架信号（care/harm 等五基础），本族管
 *     「自然性→优越性」的论证结构，命中同一样本不冲突，本族提供行动级。
 *   · confidence / unsupported_claim / vagueness 管无依据断言与模糊
 *     表述，本族有明确的依据类型（自然性），是另一族。
 *   · 良性「实验室数据显示该化合物在自然条件下会降解」被存量维度
 *     verify（unsupported_claim 等），本维度对它零命中（无优越断言腿）。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *  「自然性断言 × 优越/安全结论」这一双腿结构在模式库里没有任何一条
 *  腿——moral_foundations 只沾边行动，confidence 系只管断言强度
 *  不管依据类型，整族射程外。
 *
 * 判据（一条路由）：
 *   · 腿①自然性断言（天然/纯植物/纯草本/野生/自然熟/原生态/老祖宗
 *     传下来/古法/原始森林/无污染/自然疗法/是天然的；r257 补 大自然/
 *     未经加工/有机/农家自榨/手工/山泉/刚产出/plant-based/nature's way/
 *     unprocessed/organic/farm-fresh/handmade/spring water/raw）× 腿②优越或
 *     安全结论（比X安全/好/健康/有营养/高级/副作用小；肯定/一定+
 *     安全/健康/高级；放心吃/用；没有任何化学成分/添加剂；经过时间
 *     检验；r257 补 裸比较级/裸比较形/最…形/不会有错/才是/吃着才放心/
 *     has to be/must be right/automatically/the healthiest choice/
 *     naturally safer/simply better）共现；
 *   · 缺一不判——「天然林场的管理需要遵守环保法规」只有自然性名词无
 *     优越断言；「这个新产品采用了最新的加密算法，安全性更高」只有
 *     优越断言无自然性依据；「纯植物提取物也可能引起过敏反应」是保留
 *     语陈述不是论证。
 *   · 防自证：两腿必须有一对零重叠的匹配（「无添加」同时命中两腿不判）。
 *
 * 为什么取 VERIFY 级：单句可能是正当的产品说明（「本品为天然成
 * 分，过敏测试报告见附件」）、正当的比较测评（「我们对比一下野生种
 * 和养殖种的营养成分数据」）、食品安全讨论（「纯植物提取物也可能
 * 引起过敏反应」），rewrite/block 会误伤（与 r672-r705 全部评价/胁迫
 * 族同口径）。verify 的含义是「这段以自然性为依据的安全性/优越性断
 * 言需要补证据」——调用方应要求给出对照数据再采信。
 *
 * 明确不判的（豁免）：
 *   · 评析这套话术本身（诉诸自然是一种常见的逻辑谬误/This is an
 *     appeal to nature fallacy. / naturalistic fallacy）；
 *   · 让步/争议在场（HEDGE）：有机种植可能更安全，但这方面仍有争议/
 *     Organic farming reduces pesticide residue, though the nutritional
 *     difference is still debated. / the data is what matters——在呈现
 *     争论而不是以自然性置换证据；
 *   · 保留语陈述（纯植物提取物也可能引起过敏反应/母乳喂养有诸多益
 *     处，但并非适用于所有情况——无优越断言腿，天然不判）；
 *   · 数据对比请求（我们对比一下野生种和养殖种的营养成分数据——
 *     请求形无比结构，天然不判）；
 *   · 无自然性依据的优越断言（加密算法安全性更高——只有腿②）；
 *   · 「无添加/没有添加剂」单独在场**不算自然性断言**（r706 C1 锁定：
 *     「没有任何添加剂的食品才健康」是加工工艺描述不是自然性论证）——
 *     故「没有添加剂的东西吃着才放心」与 "Food with no additives is the
 *     only kind you can trust." 仍是本族射程外，留给后续轮次裁决是否
 *     把「无添加」提升为独立自然性依据。
 */

'use strict';

// ─── 腿① NATURE 自然性断言（中文，r706 原有）──────────────────────
const NATURE_ZH = new RegExp(
  // a (纯/全/100%)天然 + 植物/成分/材质/提取物/配方/草本
  '(?:纯|全|100%|百分之百)?天然(?:植物|成分|材质|提取物?|配方|草本)' +
  // b 纯(植物/草本)提取/配方
  '|(?:纯|100%|百分之百)?(?:植物|草本)(?:提取物?|配方)' +
  // c 野生/野生的
  '|野生' +
  // d 自然熟/自然种植/自然生长/自然农法/原生态
  '|自然(?:熟|种植|生长|农法|农作法|放养|土鸡|土鸡蛋)' +
  '|原生态' +
  // e 老祖宗/祖祖辈辈/世代 + 传下来/流传 + 做法/配方/疗法/经验
  '|(?:老祖宗|古人|祖祖辈辈|世代|老一辈|祖上)(?:传下来|传下来?的|流传|沿用|留下)(?:的)?(?:做法|配方|疗法|方法|经验|智慧|规矩|偏方|法子|办法|手艺|技艺)' +
  '|古法(?:制作|炮制|种植|养殖|调理)' +
  // f 原始森林/天然林/深山/乡下 + 空气/环境/水；无工业污染
  '|(?:原始森林|天然林|深山|乡下|农村|郊外)(?:里|中)?的(?:空气|环境|水|负离子)' +
  '|(?:没有|无)(?:任何)?(?:工业)?污染' +
  // g 自然疗法/天然疗法
  '|(?:自然|天然)疗法' +
  // h (母乳/牛奶等)是天然的
  '|(?:母乳|牛奶|羊奶|蜂蜜)(?:是|就属?于|才是)(?:真正|纯正|100%)?天然(?:的)?'
);

// ─── [r257] 腿①新措辞家族分支表（中文 7 支）────────────────────────
//   注意铁律：**每个分支的首支不得带前导 `|`**——`new RegExp('|A|B')`
//   含一条空分支，会在每个位置匹配空串，把任意文本判成两腿齐备。r257
//   构造期由 test/round-706 B1/C1/D1/F2 抓出过一次，故 _collect() 内
//   另加零长度匹配防御，双保险。
const NAT_ZH_BRANCHES = {
  // n1 大自然/天地 作为正当性来源（「这是大自然的选择，不会有错」）
  n1_nature_source: /大自然(?:的)?(?:选择|安排|规律|法则|设计|馈赠|恩赐|产物|杰作)/,
  // n2 未经(任何)(工业)加工 / 非人工 / 无人工干预
  n2_unprocessed: /(?:未经|没有经过|未经过|不经|免去|免了)(?:任何)?(?:工业)?加工|非人工|无人工干预/,
  // n3 有机（**限定复合词**：刻意排除「有机化合物/有机化学/有机溶剂」，
  //     那些是化学语境不是自然性论证）
  n3_organic: /有机(?:种植|农业|农产品|产品|食品|蔬菜|水果|大米|米饭|肉类|肉|蛋|奶|养殖|认证)/,
  // n4 农家/自家/土法 生产
  n4_farmhouse: /(?:农家|自家|土法|土榨|老式)(?:自榨|榨的|制作|做法|养的|种养|土鸡|土鸡蛋|蜂蜜)/,
  // n5 手工 + 制作动词；n5b 「手工的」形（「手工的比机器做的健康」）
  n5_handmade: /手工(?:制作|做|揉|榨|酿造|打造|缝制|编织|点心|面包|面条|油|酱|茶)|手工的/,
  // n6 山泉/矿泉水/井水
  n6_spring: /(?:山泉|山泉水|深层泉水|泉水|井水|矿泉水)/,
  // n7 刚下/现摘 的蛋奶菜果鱼肉
  n7_fresh: /(?:刚|现)(?:下|挤|摘|产|捞|杀)(?:的|下来)?(?:蛋|奶|茶|菜|果|鱼|肉)|现摘|现杀|现挤|现榨/,
  // n8 [r291] 自然性裸存在句（「那是山里放养的土鸡」「刚捞上来的河鱼」——
  //     旧判据的自然性断言都带论证形（纯天然/古法/有机），这类口语存在句
  //     整族射程外；无标记自然性 + 优越结论仍构成本族论证形状）
  n8_bare_existence: /(?:山里|山上|深山|林间|自家|村里|乡下|农村)(?:放养|散养|养的|种的|捞的|摘的|逮的)|刚(?:捞|抓|捕|钓|赶)(?:上|来)(?:的)?|散养(?:的)?(?:土鸡|鸡|猪|牛|羊|蛋|鸭)|跑山鸡|溜达鸡/,
};

// ─── 腿① NATURE 自然性断言（英文，r706 原有）──────────────────────
// a 天然植物/草本配方、b plant-based、c wild、d naturally grown、
// e 祖传/time-honored、f 原始森林/无污染、g natural therapy、h is natural。
const NATURE_EN = new RegExp(
  "\\b(?:all[- ]?natural|purely? (?:plant|herbal)|100% (?:natural|herbal)|herbal (?:formula|extract|remedy|blend)|natural (?:materials?|ingredients?|components?))\\b" +
  "|\\b(?:plant|herb)[- ]?(?:based|derived) (?:extract|formula|ingredient)\\b" +
  "|\\bwild(?:[- ]?(?:caught|grown|harvested|picked))?\\b" +
  "|\\bnaturally (?:grown|ripened|raised|farmed|fermented)\\b" +
  "|\\b(?:passed|handed) down (?:from|by) (?:our )?(?:ancestors|forefathers|grandparents|elders)\\b" +
  "|\\btime[- ]?(?:honored|honoured|tested) (?:tradition|method|recipe|practice|way)\\b" +
  "|\\b(?:primeval|pristine|untouched|virgin) (?:forest|nature|wilderness|woods)\\b" +
  "|\\bno (?:industrial )?pollution\\b" +
  "|\\b(?:natural|holistic|herbal) (?:therapy|therapies|remedy|remedies|healing|cure)\\b" +
  "|\\b(?:is|are|it'?s|they'?re) (?:completely |totally |purely |entirely )?natural\\b",
  'i'
);

// ─── [r257] 腿①新措辞家族分支表（英文 8 支）────────────────────────
const NAT_EN_BRANCHES = {
  // e1 nature's way/design/plan/choice/law
  e1_natures_way: /\bnature'?s (?:way|design|plan|choice|course|law|logic)\b/i,
  // e2 unprocessed / minimally processed（**不收裸 processed**——
  //     "processed data" 是数据处理不是自然性论证）
  e2_unprocessed: /\b(?:unprocessed|not processed|never processed|barely processed|minimally processed|free of processing)\b/i,
  // e3 plant-based / herb-based（不带 extract/formula 也判）
  e3_plant_based: /\b(?:plant|herb|vegetable)[- ]based\b/i,
  // e4 organically grown / organic produce / organic farming / certified organic
  e4_organic: /\borganic(?:ally)? (?:grown|raised|farmed|produce|farming|certified)\b|\bcertified organic\b/i,
  // e5 farm-fresh / freshly laid / straight from the farm / farm-to-table
  e5_farm_fresh: /\bfarm[- ]fresh\b|\bfreshly (?:laid|picked|milked|churned|gathered)\b|\bstraight from the farm\b|\bfarm[- ]to[- ]table\b/i,
  // e6 handmade / handcrafted / hand-picked / hand-churned
  e6_handmade: /\bhand(?:made|crafted|picked|churned)\b/i,
  // e7 spring water / mineral water
  e7_spring_water: /\b(?:mountain |natural |mineral |pure )?spring water\b|\bmineral water\b/i,
  // e8 raw milk/honey/cheese、unpasteurized、unrefined
  e8_raw: /\braw (?:milk|honey|cheese|butter|cream)\b|\bunpasteurized\b|\bunrefined\b/i,
  // e9 [r291] 自然性裸存在句（free-range/pasture-raised/grass-fed——旧
  //     表停在 farm-fresh/wild 等论证形，这类养殖方式标签是存在句形）
  e9_free_range: /\b(?:free[- ]range|pasture[- ]raised|grass[- ]fed)\b/i,
};

// ─── 腿② SUPERIOR 优越/安全结论（中文，r706 原有）──────────────────
const SUPERIOR_ZH = new RegExp(
  // a 比较形：比(化学/人工/养殖/催熟/城里/西医/普通/常规/工业)X + 优越词
  '比(?:化学|人工|养殖|催熟|城里|西医|中药|普通|常规|工业|加工|家里养|自家养|散养|圈养|土养|饲料)[^。]{0,12}(?:安全|好|健康|有营养|高级|优越|靠谱|有效|副作用小|纯净|温和)' +
  // a2 比X更/还 + 优越词（泛比较）
  '|比[^。]{0,8}(?:更|还要|还)(?:安全|健康|好|有营养|高级|天然|纯净|靠谱)' +
  // b 肯定/一定/必然/绝对 + [更] + 优越词
  '|(?:肯定|一定|必然|绝对|百分百|百分之百|妥妥的|铁定)(?:比[^。]{0,8})?(?:更|要|更加)?(?:安全|健康|好|高级|优越|放心|靠谱|有效)' +
  // c 放心/安心/大胆 + 吃/用/喝/买/抹
  '|(?:放心|安心|大胆)(?:地)?(?:吃|用|喝|买|抹|涂|敷)' +
  // d 没有任何化学成分/添加剂/防腐剂（否定化工形）
  '|(?:没有|无|不含)(?:任何|半点|一丝|一丁点)?(?:化学成分|化学添加|添加剂|防腐剂|人工成分|科技与狠活|激素)' +
  // e 经过时间/历史/岁月 检验/考验
  '|(?:经过|经历|经受)(?:时间|历史|岁月|千百年|几百年)(?:的)?(?:检验|考验|验证|沉淀|筛选)'
);

// ─── [r257] 腿②新措辞家族分支表（中文 6 支）────────────────────────
const SUP_ZH_BRANCHES = {
  // s1 裸比较级（更/还要/更加 + 优越词，**无「比X」也判**）——
  //     「纯植物提取，所以更安全」原判据因无比结构漏判
  s1_bare_comparative: /(?:更|还要|更加|愈发)(?:安全|健康|好|有营养|高级|纯净|靠谱|有效|温和|卫生|干净|纯正)/,
  // s1b 裸比较形（比X + 优越词，**无「更/还」也判**）——
  //      「野生的比养殖的干净」「手工的比机器做的健康」原 a2 支漏判
  s1b_bi_superior: /比[^。]{0,8}(?:安全|健康|好|有营养|干净|纯净|高级|靠谱|卫生)/,
  // s2 最…形
  s2_most: /(?:最|才算|才是)(?:安全|健康|有营养|补|新鲜|好吃|高级|纯净|干净|靠谱|有效|卫生)/,
  // s3 认识论封闭形（不会有错/错不了/准没错）——
  //     「这是大自然的选择，不会有错」
  s3_epistemic_closure: /(?:不会|不可能会|绝不会|肯定不会|准)有错|错不了|准没错|肯定没错|不会有问题|绝不会有问题/,
  // s4 才是/就是 + 优越词
  s4_cai_shi: /(?:才|就是|才是|终究|终究是)(?:干净|卫生|纯正|纯粹|好|安全|健康)/,
  // s5 原 c 支的倒装形（吃着才放心）
  s5_eat_rest_assured: /(?:吃|用|喝|买|抹|涂|敷)(?:着|起来)?(?:才|最)?(?:放心|安心|省心)/,
  // s6 [r291] 口味优越形（比X鲜甜/鲜美/香甜——「刚捞上来的河鱼比冻货
  //     鲜甜」：优越词表不收味觉形容词，本族裸存在句腿①的常见搭配）
  s6_taste_comparative: /比[^。]{0,8}(?:鲜甜|鲜美|香甜|可口|地道)/,
};

// ─── 腿② SUPERIOR 优越/安全结论（英文，r706 原有）──────────────────
// a 比较级 than、b must be/definitely + safe/healthy、c feel safe/safe
// to use、d no artificial chemicals、e tested by time。
const SUPERIOR_EN = new RegExp(
  "\\b(?:safer|better|healthier|more nutritious|more premium|superior|purer|more natural|kinder|with fewer side effects)\\b[^.]{0,24}\\bthan\\b" +
  "|\\bthan (?:chemical|artificial|farmed|city|western|conventional|industrial|processed)\\b[^.]{0,24}\\b(?:medicine|drugs?|ones?|produce|air|food|alternative|formula|milk)\\b" +
  "|\\b(?:must be|definitely|certainly|bound to be|guaranteed to be|absolutely)\\b[^.]{0,24}\\b(?:safe|safer|healthy|healthier|better|premium|non[- ]?toxic|harmless)\\b" +
  "|\\b(?:feel|rest) (?:safe|assured)\\b" +
  "|\\bsafe to (?:use|eat|drink|apply|consume)\\b" +
  "|\\b(?:no|zero|without|free of) (?:artificial|synthetic|chemical)? ?(?:chemicals|additives|preservatives)\\b" +
  "|\\btime[- ](?:tested|honored|honoured)\\b" +
  "|\\b(?:tested|proven|validated) (?:by|over) (?:time|history|centuries|generations|ages)\\b",
  'i'
);

// ─── [r257] 腿②新措辞家族分支表（英文 8 支）────────────────────────
const SUP_EN_BRANCHES = {
  // t1 has to be / have to be + 比较级（"it has to be safer"）
  t1_has_to_be: /\b(?:has|have) (?:got )?to be\b[^.]{0,24}\b(?:safer|healthier|better|purer|superior|more nutritious)\b/i,
  // t2 认识论封闭（must be right / cannot be wrong）
  t2_must_be_right: /\b(?:must be|cannot be|can't be|could not be|couldn't be|is never|are never) (?:right|correct|wrong)\b/i,
  // t3 automatically / inherently / necessarily / by definition + 优越词
  t3_automatically: /\b(?:automatically|inherently|necessarily|by definition|by its very nature)\b[^.]{0,24}\b(?:safer|healthier|better|purer|superior|more nutritious|harmless)\b/i,
  // t4 the healthiest/safest/most nourishing + choice/option/thing/one/way
  t4_the_superlative: /\bthe (?:healthiest|safest|best|most nourishing|most wholesome|purest|finest|cleanest) (?:choice|option|thing|one|way|pick)\b/i,
  // t5 the only kind/type/sort you can trust
  t5_only_trust: /\bthe only (?:kind|type|sort|way|thing|option) (?:you |one can |we can )?(?:can )?trust\b/i,
  // t6 naturally + 比较级
  t6_naturally: /\bnaturally (?:safer|healthier|better|purer|superior|more nutritious|cleaner)\b/i,
  // t7 simply/just/plainly better
  t7_simply_better: /\b(?:simply|just|plainly|clearly) (?:better|healthier|safer|purer)\b/i,
  // t8 more nourishing / more wholesome
  t8_more_nourishing: /\bmore (?:nourishing|wholesome)\b/i,
};

// ─── [r291] 反向族腿①'：非自然性生产断言（「人造/工业/化学合成」在场）────
// JSDoc 首行历来声明本维度射程含「暗示『非自然（化学/人工/工业）』即有
// 害」，但旧判据只收**正向**自然性断言（腿①）——「转基因是人为干预的，
// 长期吃必然出问题」整族零命中（r291 探针：appeal_to_nature 9/13 穿透的
// 主支，穿透样本全部落在两腿措辞射程外）。本族把反向形补上：断言对象换成
// **生产方式的非自然性**（腿①'），结论换成危害/不如（腿②'）。
// 防误伤边界：不收「化学成分表/化学实验/工业排放/工厂管理」等中性工业与
// 化学语境——腿①'必须是可食用/可接触物的人工生产方式，且必须与危害腿
// 共现（单有「工业合成」不判：「工业合成的材料更便宜」无比无害结构）。
const UNNAT_ZH_BRANCHES = {
  // u1 工业(化)合成/勾兑/生产/养殖（「这酒是工业勾兑的」）
  u1_industrial: /工业(?:化)?(?:合成|勾兑|生产|加工|养殖|种植|催熟)/,
  // u2 人工合成/添加/干预/饲养/催熟（「人工饲养的禽类…被化学手段缩短」）
  u2_artificial: /人工(?:合成|添加|干预|饲养|种植|催熟|授粉|增甜|色素|制造)/,
  // u3 化学合成/手段/添加剂（**不收「化学成分/化学实验/化工」**——
  //     那些是中性语境，不是以非自然性为依据的论证）
  u3_chemical: /化学(?:合成|手段|添加剂|药剂|制剂)/,
  // u4 实验室合成/培育/制造/产物（不收「实验室数据显示」——数据陈述）
  u4_lab: /实验室(?:合成|培育|制造|产物)/,
  // u5 人为干预/操控/改造（「转基因是人为干预的产物」）
  u5_human_intervention: /人为(?:地)?(?:干预|操控|改造)/,
  // u6 饲料/激素 速成养殖
  u6_feed_hormone: /饲料(?:鸡|猪|牛|羊|养)|(?:打了|注射|用了)(?:激素|催熟剂|膨大剂)|激素(?:催熟|注射|喂养)/,
  // u7 转基因（非自然性标记；需危害腿共现，「转基因研究取得进展」不判）
  u7_gmo: /转基因/,
};

// ─── [r291] 反向族腿②'：危害/不如结论 ──────────────────────────
const HARM_ZH_BRANCHES = {
  // h1 不如/比不上（非自然物 < 自然物：「比不上自家粮谷酿的纯粮食酒」）
  h1_inferiority: /比不上|比不过|不如/,
  // h2 必然/一定/迟早 + 出问题/伤身体/有害（「长期吃必然出问题」）
  h2_harm: /(?:必然|一定|肯定|迟早|终究|早晚|久)(?:会)?(?:出问题|有问题|伤身体|伤身|有害|有隐患|致癌|遭殃)|(?:吃|喝|用)久(?:了)?(?:一定|肯定|必然)?(?:伤|坏|出问题)/,
  // h3 不能吃/不能喝/不宜（「工业勾兑的不能喝」）
  h3_forbidden: /(?:不能|不宜|别)(?:吃|喝|用|碰)/,
};

// ─── [r291] 反向族腿①'（英文）──────────────────────────────────
const UNNAT_EN_BRANCHES = {
  // g1 synthetic…/ synthesized in a lab / lab-made / chemically synthesized
  g1_synthetic: /\bsynthetic(?:ally)?\b[^.]{0,24}\b(?:made|produced|created|ingredients?|chemicals?|compounds?)\b|\bsynthesized in (?:a|the) lab(?:oratory)?\b|\blab[- ](?:made|created|synthesized)\b|\bchemically synthesized\b/i,
  // g2 artificially ripened/grown/raised/… / industrially produced
  g2_artificial: /\bartificially (?:ripened|grown|raised|flavored|colored|sweetened|produced|created|bred)\b|\bindustrial(?:ly)? (?:produced|processed|farmed)\b/i,
  // g3 GMO
  g3_gmo: /\bgenetically modified\b|\bGMOs?\b/i,
  // g4 factory-farmed / factory-made
  g4_factory: /\bfactory[- ](?:farmed|produced|made)\b/i,
};

// ─── [r291] 反向族腿②'（英文）──────────────────────────────────
const HARM_EN_BRANCHES = {
  // i1 inherently/necessarily less / cannot be good for you
  i1_inherently_less: /\b(?:inherently|necessarily|automatically|by definition) (?:less|worse|inferior|unsafe|harmful)\b|\bcannot be (?:good|safe|healthy|harmless)\b|\bisn'?t (?:good|safe|healthy) for\b/i,
  // i2 will/would harm / harms … over time
  i2_will_harm: /\b(?:will|would|can|may) (?:eventually )?(?:harm|hurt|damage|poison)\b|\b(?:harms?|hurts?|damages?) [^.]{0,24}\bover time\b/i,
};

// 合并版（兼容旧读方；路由实际逐分支走，便于负例逐支注入）
function _combine(branches, flags) {
  const parts = Object.keys(branches).map(k => '(?:' + branches[k].source + ')');
  return new RegExp(parts.join('|'), flags || '');
}
const NATURE_ZH_EXT = _combine(NAT_ZH_BRANCHES);
const NATURE_EN_EXT = _combine(NAT_EN_BRANCHES, 'i');
const SUPERIOR_ZH_EXT = _combine(SUP_ZH_BRANCHES);
const SUPERIOR_EN_EXT = _combine(SUP_EN_BRANCHES, 'i');

// ─── [r257] concessive-debate 豁免：让步/争议在场 ─────────────────
// 优越断言被让步或争议标记限定时，这段话是在**呈现争论**，不是在以
// 自然性置换证据——「有机种植可能更安全，但这方面仍有争议，要看检测
// 数据」要求的是对照数据，不是把天然当安全。判据边界：标记必须是
// 认识论层面的（争议/无定论/不能据此/要看数据），不是任意让步词。
const HEDGE_ZH = new RegExp(
  '仍有争议|尚有争议|存在争议|未有定论|没有定论|并无定论|尚未定论|还未有定论' +
  '|还需验证|有待验证|待验证|仍待验证|有待进一步' +
  '|不能据此|不能因此|不足以证明|并不能说明|无法据此' +
  '|要看数据|看数据|数据才是|依数据|据数据|视数据而定' +
  '|具体情况具体分析|因人而异|不能一概而论|未必尽然'
);
const HEDGE_EN = new RegExp(
  "\\b(?:still|remains?|is|are) (?:debated|disputed|contested|unsettled|inconclusive|unclear)\\b" +
  "|\\bnot (?:yet )?settled\\b" +
  "|\\bit does not follow\\b" +
  "|\\bdoes not mean\\b" +
  "|\\bno evidence that\\b" +
  "|\\bwe need (?:the )?data\\b" +
  "|\\bthe data is what matters\\b" +
  "|\\bcase by case\\b" +
  "|\\bdepends on the individual\\b",
  'i'
);

// ─── 豁免：评析这套话术本身 / 概念分析 ────────────────────────────
const META_EXEMPT_ZH = new RegExp(
  '(?:这|那就是|这就是|这正是|那正是|属于|属于一种|就是|犯了|这是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:诉诸自然|自然主义谬误|天然谬误)' +
  '|(?:诉诸自然|自然主义谬误|天然谬误)(?:是|属于|是一种|正是|这叫|那就是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误)'
);
const META_EXEMPT_EN = new RegExp(
  "\\bappeal to nature\\b" +
  "|\\bnaturalistic fallacy\\b" +
  "|\\b(?:is|are|called?|committing an|an) appeal to nature\\b",
  'i'
);

/** 收集正则全部匹配及其起止位置（供防自证守卫做零重叠判定） */
function _collect(re, text) {
  const out = [];
  if (!re || typeof re.source !== 'string') return out;
  let g;
  try {
    g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
  } catch (_) { return out; }
  let m;
  let guard = 0;
  while ((m = g.exec(text)) !== null && guard++ < 500) {
    // 防御：零长度匹配（如误留前导 `|` 造成的空分支）不计入——
    // 否则空串会同时落在两腿上，把任意文本判成「两腿齐备」。
    if (m[0].length === 0) {
      if (g.lastIndex <= m.index) g.lastIndex = m.index + 1;
      continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

/** 把分支表摊平成正则列表（供注入替换） */
function _branchList(table, fallback) {
  const t = table || fallback || {};
  return Object.keys(t).map(k => t[k]).filter(r => r instanceof RegExp);
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以永不匹配串/自定义正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkAppealToNature(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const NAT_ZH_ = R.NATURE_ZH || NATURE_ZH;
  const NAT_EN_ = R.NATURE_EN || NATURE_EN;
  const SUP_ZH_ = R.SUPERIOR_ZH || SUPERIOR_ZH;
  const SUP_EN_ = R.SUPERIOR_EN || SUPERIOR_EN;
  const META_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;
  const HEDGE_ZH_ = R.HEDGE_ZH || HEDGE_ZH;
  const HEDGE_EN_ = R.HEDGE_EN || HEDGE_EN;

  // 在评析这套话术 → 不是运用它
  if (META_ZH_.test(text) || META_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // [r257] 让步/争议在场 → 在呈现争论，不是在以自然性置换证据
  if (HEDGE_ZH_.test(text) || HEDGE_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 路由①：自然性断言 × 优越/安全结论共现（缺一不判）
  const natureSpans = [].concat(
    _collect(NAT_ZH_, text), _collect(NAT_EN_, text),
    ..._branchList(R.NAT_ZH_BRANCHES, NAT_ZH_BRANCHES).map(b => _collect(b, text)),
    ..._branchList(R.NAT_EN_BRANCHES, NAT_EN_BRANCHES).map(b => _collect(b, text))
  );
  const superiorSpans = [].concat(
    _collect(SUP_ZH_, text), _collect(SUP_EN_, text),
    ..._branchList(R.SUP_ZH_BRANCHES, SUP_ZH_BRANCHES).map(b => _collect(b, text)),
    ..._branchList(R.SUP_EN_BRANCHES, SUP_EN_BRANCHES).map(b => _collect(b, text))
  );

  // [r291] 路由②：「非自然/人造/工业即有害」反向族——腿①'非自然性生产
  // 断言 × 腿②'危害/不如结论。**两条路由不交叉配对**：自然性×危害是
  // 安全警告（「野菜吃多了伤肝」）、非自然性×优越是正当比较（「工业合成
  // 效率更高」），都不构成本族论证形状，交叉组合一律不判。
  const unnaturalSpans = [].concat(
    ..._branchList(R.UNNAT_ZH_BRANCHES, UNNAT_ZH_BRANCHES).map(b => _collect(b, text)),
    ..._branchList(R.UNNAT_EN_BRANCHES, UNNAT_EN_BRANCHES).map(b => _collect(b, text))
  );
  const harmSpans = [].concat(
    ..._branchList(R.HARM_ZH_BRANCHES, HARM_ZH_BRANCHES).map(b => _collect(b, text)),
    ..._branchList(R.HARM_EN_BRANCHES, HARM_EN_BRANCHES).map(b => _collect(b, text))
  );

  // [r257] 防自证守卫：必须存在一对**零重叠**的匹配——同族自称不构成论证。
  const disjoint = (a, b) => a.end <= b.start || a.start >= b.end;
  const routeNatSup = natureSpans.some(n => superiorSpans.some(s => disjoint(n, s)));
  const routeUnnatHarm = unnaturalSpans.some(u => harmSpans.some(s => disjoint(u, s)));
  if (!routeNatSup && !routeUnnatHarm) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.5,
    count: 1,
    detail: routeNatSup
      ? (isZh ? '诉诸自然谬误×自然性断言×优越/安全结论(zh)' : 'appeal to nature×naturalness-claim×superiority/safety-conclusion(en)')
      : (isZh ? '诉诸自然谬误×非自然即有害(zh)' : 'appeal to nature×unnatural-as-harm(en)'),
  };
}

module.exports = {
  checkAppealToNature,
  __internals: () => ({
    NATURE_ZH, NATURE_ZH_EXT, NATURE_EN, NATURE_EN_EXT,
    SUPERIOR_ZH, SUPERIOR_ZH_EXT, SUPERIOR_EN, SUPERIOR_EN_EXT,
    NAT_ZH_BRANCHES, NAT_EN_BRANCHES, SUP_ZH_BRANCHES, SUP_EN_BRANCHES,
    UNNAT_ZH_BRANCHES, UNNAT_EN_BRANCHES, HARM_ZH_BRANCHES, HARM_EN_BRANCHES,
    META_EXEMPT_ZH, META_EXEMPT_EN, HEDGE_ZH, HEDGE_EN,
  }),
};
