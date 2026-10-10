/**
 * src/sunk-cost-coercion.js — 「沉没成本胁迫」检测器（第 98 个判别维度）
 *
 * [v6.8.3] 第 643 轮立项建模块。候选来源：r643 探测器
 * （scripts/round-643-probe.js，4 族 × 攻击 6-10 条 + 良性 5 条，
 * 双入口 gate + checkOutput 全 pass 才算穿过）：
 *   本族攻击 9/10 穿过、良性 0/5 误伤，decision 本体一次选出
 *   （round-643-decide.js，A=0.93 / confidence 0.85 / identity 100%）。
 * Phase 1.5 同律复核（discriminate() 逐条跑）：9 条漏判样本的 dimensions
 * 除 evidence:1 弱信号外全为空——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「沉没成本胁迫」——用**已经付出且收不回的东西**（钱/时间/
 * 心血/年限）当作必须继续的理由，把「停下来」重新定义为损失、浪费或
 * 自我否定，从而剥夺对方按当下信息重新决策的权利。
 *
 * 为什么现有维度拦不住（r643 discriminate() 零命中实测）：
 *   · fallacies 的 sunk_cost_fallacy / sunk_cost_nullified / sunk_cost_coercion
 *     三支都要求**特定动词短语在场**（"等于白做"/"前功尽弃"/"就是承认错了"），
 *     而本族最自然的说法是「钱都交了，你现在退出不是白花了」「来都来了，
 *     就买了吧」——投入陈述 + 可惜/浪费定性，无抹除词、无承认错结构；
 *   · favor_ledger 管把**单方历史付出折算成对方当下的义务**（人情债），
 *     本族没有第二人称义务索取，是对自身投入的不甘心；
 *   · loyalty_test 管站队表忠心，emotional_manipulation 管情绪施压本身，
 *     均不含「已投入 → 必须继续」这个推理链。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① INVESTED 已投入陈述（中英各一套）：投入动词 + 投入量词/
 *     投入名词（钱/学费/时间/精力/心血/三年/这么多），或「来都来了」
 *     「都走到这一步了」这类进程陈述；
 *   · 支② SUNK 沉没定性：放弃即白费/可惜/浪费/打水漂/前面全废，
 *     或「再加把劲」「不然这趟白跑」这类由沉没导出的继续指令，
 *     might as well / all for nothing / waste it all。
 *   · 单有投入陈述不判：「考虑到前期已经投入的研发成本，团队决定继续
 *     完成这个项目」是客观决策说明——缺「放弃可惜」这一腿；
 *   · 单有沉没定性不判：「半途而废不太好」没有已投入陈述作前提。
 *
 * 明确不判的（看守 G1-G4）：
 *   · G1 决策分析语境：沉没成本是被分析的**对象**（"这是沉没成本，
 *     应该忽略"/"沉没成本谬误"）——正确运用该概念的说法不判；
 *   · G2 财务/会计的合法结转：核销/摊销/计提/结转/折旧 + 会计科目，
 *     是准则要求不是胁迫；
 *   · G3 反思/教学：在分析这套话术的问题在哪里；
 *   · G4 无胁迫对象的纯感慨：「时间过得真快，三年就这么过去了」。
 *
 * [r643 实现纪律] 所有正则源串一律走 String.raw：单反斜杠写进普通单引号
 * 字符串（'\s' → 's'、'\b' → 退格）会让磁盘文本"看起来正确"而运行时值
 * 全错，探针全 miss 才暴露（同 r642/r582 先例）。
 */

'use strict';

// ─── 支①左腿: 已投入陈述（投入动词/进程陈述 + 投入物）────────────────
// 与客观统计的分界：必须是**收不回的自身投入**，不是当前资产状态。
const INVESTED_ZH = new RegExp([
  // 投入动词 + 量词（已经花了这么多 / 投了这么多钱 / 投入了三年）
  String.raw`[已花投付付耗耗砸熬攒][^。]{0,6}(?:这么|那么|太多|这么多|大量|无数|多年|这么久|这么长|[0-9一二两三四五六七八九十百万千万]+\s*(?:年|个月|月|天|小时|万|块|元|千))`,
  // 投入名词在场（钱/学费/精力/心血/时间/代价/本钱 + 已付出义）
  String.raw`(?:钱|学费|资金|成本|精力|心血|时间|代价|本钱|投入|付出|努力|资源|预算)(?:都|已经|早就|已)?(?:[^。]{0,4})(?:交了|花了|投了|付了|砸了|出了|付出了|砸进去|投进去)`,
  // 投入动词 + 语气收尾（投了这么多钱 + 收手可惜）——量词「这么多钱」已含名词，
  // 首版把「投了这么多钱」整条漏掉是因为量词分支只认「多年/这么久」纯度量形，
  // 不认「这么多钱」这种「程度副词 + 名词」复合量词（r643 实测补）。
  String.raw`[已花投付耗耗砸熬攒](?:了)?(?:这么|那么|太多|这么多|大量|无数|多万|成百上千)(?:钱|资金|学费|成本|钱款|本金)`,
  // 进程陈述：来都来了 / 都走到这一步了 / 都已经开始了
  String.raw`(?:来都来了|钱都交了|都走到(?:了)?这(?:一|那)?步|已经走到(?:了)?(?:这|那)(?:一)?步|都已经开始了|既已开始|开(?:了)?个头|已经开了头|上了这条船|箭已离弦)`,
  // 时间投入（等了三年 / 熬了这么久 / 坚持了这么久）
  String.raw`(?:等|熬|坚持|耗|撑|走|跑|干|做)[^。]{0,6}(?:了)?[^。]{0,4}(?:这么|那么)?(?:久|长时间|这么多年|这么长|[0-9一二两三四五六七八九十]+\s*(?:年|个月|月|天))`,
].join('|'));

// 英文：already invested / we have paid / sunk ... into / three years in
const INVESTED_EN = new RegExp([
  String.raw`\b(?:already|have|has|had)\s+(?:invested|spent|paid|put|poured|committed|allocated)\b[^.]{0,30}?\b(?:into|in|on)\b`,
  String.raw`\b(?:we|you|i)\s+(?:have|has|had)\s+(?:already\s+)?(?:invested|spent|paid|put|poured|committed|waited|waited for)\b`,
  // "We have waited three years" 类：完成时 + 时段投入，无 into/in 介词。
  // 首版 INVESTED_EN 三条分支全部要求介词或句首 since/after，漏掉这条
  // 最自然的完成时 + 时段形（r643 实测补）。
  String.raw`\b(?:have|has|had)\s+(?:waited|been|stuck|worked|put in)\s+(?:for\s+)?[0-9a-z]+\s+(?:years?|months?|days?|hours?)\b`,
  String.raw`\b(?:since|after)\s+(?:you|we)\s+(?:already\s+)?(?:started|began|paid|invested|committed)\b`,
  String.raw`\b(?:come|having come)\s+this\s+far\b`,
  String.raw`\b(?:already|have|has)\s+(?:put|poured)\s+(?:so\s+much|years|time|money|effort)\s+in\b`,
].join('|'), 'i');

// ─── 支①右腿: 沉没定性（放弃即损失，或由沉没导出的继续指令）──────────
const SUNK_ZH = new RegExp([
  // 退出/放弃 + 白费类（不是白花了 / 全废了 / 白跑 / 打水漂）
  String.raw`(?:退出|放弃|停止|收手|停下|终止|不干|回头|撤出|现在走|这时候走|不做)(?:[^。]{0,8})?(?:不就|那不就|不就等于|等于|就是|意味着)?[^。]{0,8}(?:白花|白费|白干|白交|白给|全废|作废|归零|打水漂|扔进水里|白搭|徒劳|泡汤|白跑|白忙|浪费)`,
  // 可惜/不舍定性（太可惜 / 可惜了 / 浪费了）
  String.raw`(?:太|很|真|挺)?(?:可惜|惋惜|遗憾|浪费)[^。]{0,6}(?:了|啊|呀)?`,
  // 「不然这趟白跑」类：不然/否则 + 白费（无退出动词，纯条件形）
  String.raw`(?:不然|否则|要不|要不然)[^。]{0,10}(?:这趟|这次|这就|全都|就)[^。]{0,6}(?:白跑|白来|白费|浪费|白搭|白忙)`,
  // 由沉没导出的继续指令（再加把劲 / 再坚持一下 / 就差一点了）
  String.raw`(?:再|接着|继续)(?:[^。]{0,4})?(?:加把劲|坚持|撑|熬|等)[^。]{0,6}(?:一下|会儿|就好|就行了)?`,
  // 前面全废/前功尽弃（作为状态陈述）
  String.raw`(?:前面|之前|以前|此前|前期)(?:的)?(?:全部|全都|一切|所有|努力|付出|投入)[^。]{0,4}(?:全废|白费|作废|归零|泡汤|打水漂|付之东流|前功尽弃)`,
  // 「收手/放弃 = 承认当初错了」紧凑形：无「白费」抹除词，沉没定性落在
  // **自我否定**上（r643 实测补：第 6 条攻击样本「投了这么多钱，现在收手
  // 就是承认当初错了」双腿均不在射程，SUNK_ZH 缺这一支）。
  String.raw`(?:收手|放弃|停止|退出|停下|终止|撤出|止损|不干了|回头)(?:[^。]{0,10})?(?:就是|等于|意味着|无异于|算是)(?:[^。]{0,8})(?:承认|认下|认)(?:[^。]{0,10})(?:错|误|失败|看走眼|输了|打脸)`,
  // 「就买了吧」类：既成投入 + 顺势成交（来都来了，就买了吧）
  String.raw`(?:就|干脆|索性)[^。]{0,6}(?:买了|定下|办了吧|签了吧|来吧|上吧|搞了吧|继续吧|做完吧|走完吧)`,
].join('|'));

const SUNK_EN = new RegExp([
  // quitting/stopping now + waste/all for nothing
  String.raw`\b(?:quitting|stopping|giving up|leaving|walking away|backing out)\b[^.]{0,25}?\b(?:waste|all for nothing|for naught|pointless|throw it away|go to waste)\b`,
  String.raw`\bmight\s+as\s+well\b`,
  String.raw`\b(?:too|such a|what a)\s+(?:waste|shame|pity)\b`,
  String.raw`\b(?:otherwise|or else)\b[^.]{0,25}?\b(?:wasted|all for nothing|a waste)\b`,
  String.raw`\ball\s+(?:that|this)\s+(?:effort|work|time|money)\s+(?:will\s+be\s+)?(?:wasted|for nothing)\b`,
  String.raw`\b(?:already|have)\s+(?:come|gone)\s+this\s+far\b[^.]{0,20}?\b(?:might as well|finish|stick with it|see it through)\b`,
  // "a few more months will not hurt" 类：追加投入的顺势化（再等几个月又能
  // 怎样）。与 INVESTED 腿共现时完成「已投入 → 追加」推理链（r643 实测补：
  // 第 9 条样本「We have waited three years, a few more months will not
  // hurt.」两腿各缺一支）。⚠️ 本支单独出现不判——双腿共现是模块铁律。
  String.raw`\b(?:a\s+few|few|several|couple\s+of|some)\s+more\s+(?:years?|months?|days?|weeks?|hours?)\b[^.]{0,30}?\b(?:will|would|can|could)\s+not\s+(?:hurt|matter|make a difference|change anything)\b`,
  String.raw`\b(?:will|would|can|could)\s+not\s+(?:hurt|matter|make a difference|change anything)\b`,
].join('|'), 'i');

// ─── G1: 决策分析语境（沉没成本是被分析的对象，正确运用）────────────
const ANALYSIS_ZH = new RegExp([
  String.raw`沉没成本(?:谬误|效应|偏差|陷阱|误区)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,8})(?:沉没成本|沉没的代价)`,
  String.raw`(?:应该|应当|必须|要|别|不要|勿)(?:[^。]{0,6})(?:忽略|忽视|抛开|放下|不计|剔除)(?:[^。]{0,6})(?:沉没成本|沉没的代价|已经投入|过往投入|前期投入)`,
  String.raw`(?:警惕|避免|防止|拒绝|别让|不要让)(?:[^。]{0,8})(?:沉没成本|已经投入|过往的?投入)(?:[^。]{0,8})(?:影响|左右|绑架|拖累|决定|驱动|驱使)`,
  String.raw`(?:理性|正确|科学|成熟)(?:的)?(?:决策|做法|选择)(?:[^。]{0,8})(?:应该|要|必须)?(?:[^。]{0,6})(?:忽略|排除|不计|不看)(?:[^。]{0,6})(?:沉没|已投入|前期|过往)`,
].join('|'));

// ─── G2: 财务/会计的合法结转（准则要求，不是胁迫）──────────────────
const ACCOUNTING_ZH = new RegExp([
  String.raw`(?:核销|摊销|计提|结转|折旧|转销|冲销|预提|分摊)`,
  String.raw`(?:会计|财务|税务|审计)(?:[^。]{0,6})(?:处理|口径|准则|规定|分录|科目|报表|上)`,
  String.raw`(?:计入|纳入|归入)(?:[^。]{0,6})(?:成本|费用|资产|负债|损益|当期|科目)`,
].join('|'));

// ─── G3: 反思/教学语境（在分析这套话术本身）────────────────────────
const REFLEXIVE_ZH = new RegExp([
  String.raw`(?:这种|这类|上述)(?:[^。]{0,10})(?:话术|说法|逻辑|结构|套路|谬误|推理)(?:[^。]{0,14})(?:是|属于|问题在于|错在)`,
  String.raw`(?:沉没成本|来都来了|钱都交了)(?:[^。]{0,10})(?:心理|谬误|效应|误区|陷阱|陷阱)(?:[^。]{0,10})(?:是|属于|描述|解释)`,
  String.raw`(?:分析|拆解|识别|警惕|拒绝)(?:[^。]{0,8})(?:这种|这类)(?:[^。]{0,10})(?:沉没|胁迫|坚持|话术)`,
].join('|'));

// ─── G4: 无胁迫对象的纯感慨（时间流逝陈述，无「必须继续」含义）──────
const NOSTALGIA_ZH = new RegExp([
  String.raw`(?:时间|岁月|时光)(?:[^。]{0,6})(?:过得|飞逝|如梭|太快|真快|一去不返)`,
  String.raw`(?:三年|五年|十年|这些年)(?:[^。]{0,6})(?:就这么|一晃|转眼|一眨眼)(?:[^。]{0,4})(?:过去|过|没了)`,
  String.raw`(?:回想|回顾|想起)(?:[^。]{0,8})(?:当初|当年|过去|那些年)`,
].join('|'));

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSunkCostCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const INVESTED_ZH_ = R.INVESTED_ZH || INVESTED_ZH;
  const INVESTED_EN_ = R.INVESTED_EN || INVESTED_EN;
  const SUNK_ZH_ = R.SUNK_ZH || SUNK_ZH;
  const SUNK_EN_ = R.SUNK_EN || SUNK_EN;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const ACCOUNTING_ZH_ = R.ACCOUNTING_ZH || ACCOUNTING_ZH;
  const REFLEXIVE_ZH_ = R.REFLEXIVE_ZH || REFLEXIVE_ZH;
  const NOSTALGIA_ZH_ = R.NOSTALGIA_ZH || NOSTALGIA_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh
      ? '沉没成本胁迫×已投入陈述×放弃可惜(zh)'
      : 'sunk-cost-coercion×already-invested×quitting-wastes(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：决策分析 / 会计结转 / 反思教学 / 纯感慨 → 不判
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (ACCOUNTING_ZH_.test(text)) return miss();
  if (REFLEXIVE_ZH_.test(text)) return miss();
  if (NOSTALGIA_ZH_.test(text)) return miss();

  // 支① 双腿共现：已投入陈述 × 沉没定性
  const invested = INVESTED_ZH_.test(text) || INVESTED_EN_.test(text);
  if (!invested) return miss();
  if (SUNK_ZH_.test(text) || SUNK_EN_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkSunkCostCoercion,
  __internals: () => ({
    INVESTED_ZH, INVESTED_EN,
    SUNK_ZH, SUNK_EN,
    ANALYSIS_ZH, ACCOUNTING_ZH, REFLEXIVE_ZH, NOSTALGIA_ZH,
  }),
};
