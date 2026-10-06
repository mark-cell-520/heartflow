/**
 * src/moral-licensing.js — 「道德许可」检测器（第 87 个判别维度）
 *
 * [v6.8.37] 第 566 轮新增。候选来源：r560 落盘池的 C 候选；本轮先用
 * scripts/round-566-family-probe.js 复测缺口（21/23 穿门、良性 1/16 且
 * 该 1 条为既有 false_equivalence 基线行为），再用 decision 本体选出
 * （scripts/round-566-decide.js，A 得 0.80）。
 *
 * 辨别的族：「道德许可」——以**既往善行、积累的道德资本、或"我比别人
 * 干净"的相对比较**为由，给当前的越界行为发放许可证。典型形状：
 * 道德资本陈述 × 越界许可请求。它和恩情账本（第 86 维 favor_ledger）
 * 是近邻但方向相反的两族：恩情账本把历史付出折算成**对方的义务**，
 * 道德许可把历史干净折算成**自己的豁免**。
 *
 * 为什么现有维度拦不住（r566 归因实测 scripts/round-566-family-probe.js：
 *   23 条攻击样本 21 条穿门；逐条归因中 18 条无任何 finding，其余
 *   5 条命中 sarcasm / helplessness_induction / reasoning_coherence /
 *   hasty_generalization / moral_foundations 均属样本里其他话术腿的
 *   偶然命中，无一以道德许可腿命中）：
 *   · favor_ledger 管"我对你有恩 ⇒ 你要让步"，本族管"我过去干净 ⇒
 *     我可以越界"，实测 0/23 重叠，两维边界干净；
 *   · normalization_of_deviance 管偏离被逐步常态化，本族是单次的
 *     许可发放，不需要渐变过程；
 *   · moral_foundations 只做道德语汇打分，不判"用善行换越界"的推导；
 *   · emotional_manipulation 管情绪施压，本族可以完全冷静
 *     （「我历年都合规，这次的手法自然也没问题」）。
 *
 * 判据（两条腿都在即成立）：
 *   · A1 道德资本：既往善行/捐赠/公益/克己/多年合规/相对干净的陈述；
 *   · A2 越界许可：本次行为可通融/不算事/可减免/可免究/没关系。
 *   · A1 × A2 = rewrite 级：用历史干净置换当下的合规与责任，必须
 *     改写为「既往记录与本次事项独立评估」的表述。
 *
 * 明确不判的（这些是合法陈述，G1-G3 三条看守）：
 *   · 独立评估：明确说既往记录与本次事项分开算、本次仍需审计/复查；
 *   · 制度性处理：明确说按制度/流程/标准办、奖励另走荣誉记录；
 *   · 有限减免：只就法律明文规定的减免事项陈述（如捐赠抵税）。
 */

'use strict';

// ─── A1: 道德资本（既往善行 / 相对干净的陈述标记）──────────────
// ⚠️ [r567] 首条时间跨度支原为「全可选量词」结构：主语可选 + 时间词可选 +
// 频率词可选 → 空匹配即命中**任何**文本。支级实测
// （scripts/round-567-cross-diag.js）它对 10 条英文攻击全命中，等于把
// CAPITAL_ZH 变成恒真前导，变异守卫「置空 CAPITAL_ZH 后中文 miss / 英文
// 仍命中」会假阳性失败。改为「时间词必选 + 善行词必选」的合取形状，
// 并让善行与克己两组各自独立成支（匹配语义本身，不是包一层可空前缀）。
const CAPITAL_ZH = new RegExp([
  // 时间跨度 + 善行动词/名词（时间词必选）
  '(?:这些年|这些年来|这些年里|一直以来|长期以来|历年|常年|多年以来|过去|向来|平素|一辈子|大半辈子|每年|年年|一直|始终|至今为止|工作以来|一向|素来|历来|一贯|从来)',
  '(?:捐|捐助|捐赠|资助|做公益|做慈善|当志愿者|助学|扶贫|布施|行善|做好事|积德|积善|慷慨解囊|爱心)',
  // 善行特质（独立成支：大方/仗义/厚道 等描述既往品格）
  '(?:一向|向来|素来|历来|一贯|从来|多年|常年|这些年)(?:大方|慷慨|仗义|仁义|仁厚|厚道|好心|善心|慈悲|仗义疏财|规矩|本分|守法|廉洁|清白|干净|正直|正派|克制|检点|谨慎|稳妥|老实)',
  // 既往合规/清白/克己（副词必选）
  '(?:一向|向来|素来|历来|一贯|从来|至今为止|工作以来|多年|常年|这些年来)(?:规矩|本分|守法|廉洁|清白|干净|正直|正派|克制|检点|谨慎|稳妥|老实|问心无愧)',
  '(?:零(?:投诉|举报|事故|违规|差错)|无(?:投诉|举报|违规|记录|案底)|清清白白|干干净净|洁白无瑕)',
  // 累积资历/贡献/功劳
  '(?:付出|贡献|功劳|苦劳|业绩|成绩|资历|付出)(?:摆|放|搁)在(?:这儿|这里|那儿|那里)',
  // 相对干净：「比那些真正…的人」「比起…」「至少没…」
  '(?:比|比起|与|跟)(?:那些|他们|别人|他人|隔壁|其他)(?:真正|更加|更为|很|非常|特别)?(?:腐败|贪|脏|黑|过分|离谱|坏|糟糕|混乱|不规范)',
  '(?:至少|好歹|终究)(?:我|咱)?(?:没|不曾|从未|都没有)(?:做得|干的|弄的|干的)(?:更|太|那么|那样)?(?:过分|离谱|糟糕|出格|越界|严重)',
  // 老好人/口碑
  '(?:老好人|好名声|好口碑|人品|为人|名声)(?:摆|放|挂)在(?:这儿|这里)',
  // ── [r568] 补支：r567 末版把首条改成「合取形状」后误伤收得太紧，
  //   支级实测（scripts/round-568-capital-diag.js）23 条攻击中 3 条中文
  //   + 2 条英文 capital=0，全部 miss。以下四支补的是「合规自述 / 口碑
  //   自述 / 程度自定级」三种此前零覆盖的资本形状，每条自身都带必选成分
  //   （时间词或主语或程度词），不退回 r567 删除的「全可空前导」宽支。
  // ① 制度性合规自述：「平时都按规矩来」（时间词必选 + 制度词必选）
  '(?:平时|一向|向来|素来|历来|一贯|从来|多年|常年|这些年来|至今为止|工作以来)(?:都|也|一直|始终)?(?:按|循|照|守)(?:规矩|规定|制度|流程|规章|纪律|规范|法纪|本分)(?:来|办事|做事|行事|办)',
  // ② 口碑自述：「（也）是单位的老好人」（主语必选 + 身份词必选）
  '(?:我|咱|我们|自己|自己也算)(?:也|还)?(?:算|算是|是)(?:单位|公司|部门|这里|这一带|周边|业内|圈里|所里)?(?:的)?(?:老好人|好人|厚道人|老实人|善人|热心人|体面人)',
  // ③ 程度自定级：「我们已经很规范了」（程度词必选 + 语气尾）
  '(?:我们|我|咱|咱们)(?:已经|早就|早就已经)?(?:很|相当|够|十分|非常|挺|蛮|这么)(?:规范|规矩|合规|克制|客气|本分|守法|廉洁|清白|干净|正直|谨慎|稳妥|厚道|仗义)(?:了|的啦|的了)',
  // ④ 时间副词 × 品格词（无制度动词的宽松形，时间词必选）
  '(?:一向|向来|素来|历来|一贯|从来|多年|常年)(?:都|也)(?:很|相当|挺|蛮|这么)(?:规范|规矩|合规|克制|客气|本分|守法|廉洁|清白|干净|正直|谨慎|稳妥|厚道|仗义|仁厚)',
].join('|'));

const CAPITAL_EN = new RegExp([
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:donated|contributed|volunteered|given\\s+to\\s+charity|funded|sponsored|supported)\\s+(?:a\\s+lot|so\\s+much|every\\s+year|for\\s+years|regularly)\\b',
  '\\b(?:i|we)\\s+(?:have\\s+been|been)\\s+(?:generous|charitable|benevolent|kind\\s+to\\s+the\\s+team|restrained|moderate\\s+in\\s+my\\s+claims)\\b',
  '\\b(?:my|our)\\s+(?:record|track\\s+record|history|past|reputation)\\s+(?:is|has\\s+been|remains|stays)?\\s*(?:clean|spotless|unblemished|blameless|impeccable|pristine)\\b',
  '\\b(?:at\\s+least|after\\s+all)\\s+(?:i|we)\\s+(?:did\\s+not|didn\'t|have\\s+not)\\s+(?:do|do\\s+anything)\\s*(?:worse|as\\s+bad|so\\s+bad)\\b',
  '\\bcompared\\s+(?:with|to)\\s+(?:the\\s+)?(?:truly|really|actually|openly)?\\s*(?:corrupt|dishonest|bad|greedy|worse)\\b',
  '\\b(?:i|we)\\s+(?:have\\s+)?(?:done|given)\\s+so\\s+much\\s+for\\s+(?:this\\s+company|the\\s+team|the\\s+charity|them)\\b',
  '\\bafter\\s+(?:all|everything)\\s+(?:i|we)\\s+(?:have\\s+)?(?:done|given|contributed)\\s+(?:for|to)\\b',
  '\\b(?:i|we)\\s+(?:have\\s+been\\s+)?(?:restrained|moderate|measured)\\s+(?:so\\s+far|until\\s+now|in\\s+my\\s+claims)\\b',
  // ── [r568] 补支：拟态实测（scripts/round-568-capital-diag.js）2 条英文
  //   攻击 capital=0，补「动词 + 不定冠词 + 形容词 + 记录名词」与
  //   「after all + 所有格 + 贡献名词」两种此前零覆盖的资本形状。
  //   原第 3 支只有「所有格 + is + 形容词」的位置形，"I have a clean
  //   record"（动词 + 冠词）连不上。
  // ① 「I have a clean / spotless record」
  '\\b(?:i|we)\\s+(?:have|had)\\s+(?:a|an)\\s*(?:clean|spotless|unblemished|blameless|impeccable|pristine)\\s+(?:record|track\\s+record|history|reputation|image|name)\\b',
  // ② 「After all my volunteer work / community service」
  '\\bafter\\s+(?:all|everything)\\s+(?:my|our)\\s+(?:volunteer|volunteering|charity|charitable|community|church)\\s+(?:work|service|efforts|contributions|donations|giving|hours)\\b',
].join('|'), 'i');

// ─── A2: 越界许可（本次行为可通融/不算事/可减免/可免究）────────
const PERMIT_ZH = new RegExp([
  // 「这点/这点子 + X 算什么/不算事/不算问题」
  '(?:这点|这点子|这码|这么点|区区|区区这点)(?:回扣|好处|油水|小动作|手脚|问题|差错|偏差|出入|手续|流程|账目|差异|超支|超标|方便|便宜|便宜事儿|人情|甜头|恩惠|小利|好处费)(?:又)?(?:算|算得|算不上|不算是|不算|算不上)(?:什么|啥|事儿|大事儿|什么问题)',
  // 「不算事/问题不大/没关系/无伤大雅」
  '(?:不算|算不上|不构成)(?:事|事儿|问题|错误|毛病|过错|罪)',
  '(?:问题不大|无关紧要|无伤大雅|不足挂齿|不必追究|不必计较|不必较真|不用较真|睁只眼|睁一眼|网开一面|通融|高抬贵手)',
  // 「没人管/没人会说/没人追究」
  '(?:没(?:有)?人|谁)(?:会|能)?(?:管|说|讲|计较|追究|知道|在意|在乎|发现|察觉)',
  // 「可以减免/可以免/可从轻」
  '(?:可以|应|应当|得|可)(?:减免|免除|免了|免掉|免究|免掉|从轻|从宽|通融|谅解|忽略不计|不记)',
  // 「情有可原/可以理解/能理解」
  '(?:情有可原|可以理解|不难理解|在所难免|人之常情|顺手人情|顺水人情)',
  // 「例外一下/破例一次/就这一次」
  '(?:就|仅|只)(?:这|那)?(?:一次|一回|一遭|下不为例|破例|例外|通融)',
  // 「不算事/问题不大/没关系/无伤大雅」的其它主语形
  '(?:这点|这点子|这码|这么点)(?:事|事儿|事情|动作|手脚|做法|勾当)(?:不(?:会)?影响|无损|不妨|不碍)',
  '(?:不会|无碍于|无损于|不至于)(?:影响|败坏|玷污|有损|有污)(?:我的|咱的|自己的)?(?:名声|名节|声誉|清誉|口碑|形象|操守|气节)',
  // 「别计较/别追究/别较真」的当下请求
  '(?:别|不要|不必|甭)(?:计较|较真|追究|苛求|挑剔|说出去|捅出去|声张)',
  // 越界许可腿的第二种形状：无显式许可词，但整句是「既往资本 ⇒ 当下处置」的
  // 推导结构（我把/我做了X ⇒ 这次Y没关系/可以…）。判据在句法骨架而不是词汇：
  //   「既往资本」+ 因果/顺承标记 + 当前事项 + 处置降格，
  // 处置降格 = 可通融/可减免/可免究/不算事/不影响/自然也没问题。
  // ⚠️ [r567] 此处原先有一条「因果连接词 + 可选时间词 + 可选『这点』」的纯前导支，
  // 实测（scripts/round-567-real-branch-diag.js）它是宽支：自身不含任何许可语义，
  // 只凭「这点」就放行，把 favor_ledger 自家样本误判成本族（划界 1/5）。
  // 逐支复测其撑起的样本全部有其它支兜底，故删除——判别力为零的支只会产生歧义归因。
  '(?:这点|这点子|这码|这么点|区区这点)(?:回扣|好处|油水|小动作|手脚|问题|差错|偏差|出入|手续|流程|账目|差异|超支|超标|方便|便宜|便宜事儿|人情|甜头|恩惠|小利|好处费)(?:我|咱|大家|你们|咱们)?(?:也)?(?:能|可以|可|得|就)(?:睁|闭|装作|装作没)(?:一?只眼|眼|没看见|不知道)',
  // 「就这一次」的破例形（无显式许可词）。例外词必须显式出现，
  // 「一下/一次」是可缀尾缀——不能把整组设为可选，否则本支退化为
  // 「就/仅/只」任何一处即命中，会大面积误伤。
  // ⚠️ [r567] 补 `例外|破例` 成支：r566 末版该组只收 一次/一回/一遭/下不为例
  // 等，实测「就这次例外一下」（scripts/round-567-real-branch-diag.js #4）
  // permit=false。例外词成支后才能命中；本支不依赖前置连接词，
  // 与删掉的宽支不同：自身带「例外即许可」的语义。
  '(?:就|仅|只)(?:这|那)?(?:一次|一回|一遭|下不为例|破例|破个例|例外|通融|违规一次|越线一次|踩线一次|破例一次)(?:一下|便是|也好|也罢|就行)?',
  '(?:这|那)(?:次|回)(?:就)?(?:例外|破例|破个例|通融|放松|违规|越界|踩线)(?:一下|一回|一次)?',
  '(?:就|仅|只)(?:这|那)?(?:一次|一回|一遭)(?:破例|例外|通融|放松|违规|越界|踩线)',
  // 当下处置降格：不影响/不碍事/不是问题/算不上
  '(?:不(?:会)?影响|不碍事|不误事|不妨事|无所谓|不要紧|不打紧)',
  '(?:也)?(?:算|算是|就算是)(?:既往|过去|历史)(?:功|贡献|付出)(?:的)?(?:补偿|补偿|回报|抵偿|折抵|抵扣)',
  // 「免责/豁免/免单」的直接请求
  '(?:给|替我|为我|给我)(?:免责|免单|免究|免掉|免了|免予|豁免|开脱|开脱一下|松绑|松一松)',
  // 「手法/水平/成色」由既往推定
  '(?:以|凭|靠)(?:我|咱)(?:的)?(?:资历|履历|经验|水平|手法|成色|人品|名声|口碑|功劳|苦劳|贡献)(?:，|,|自然|想必|想必也|肯定|当然|准|一定)(?:没|不会有|出不了)(?:问题|差错|岔子|毛病)',
  // 「不必追究」的弱化形（不针对具体名词）
  '(?:不必|无须|无需|用不着|犯不着)(?:追究|计较|较真|苛求|问责|上纲上线|小题大做)',
  // 「我这算干净的 / 我这算客气 / 算对得起」——比较后的自我定级
  '(?:我|咱|我们)?(?:这|那样|这么一来|这么说)(?:算|算是|才算|才算得)(?:干净|清白|干净的了|清白的了|客气|够意思|对得起|仁至义尽|讲道义|有良心|规矩|本分|守法|廉洁|正直|正派)',
  '(?:已经|早就|算是)(?:很|相当|够|十分|非常)(?:规范|规矩|克制|客气|本分|守法|廉洁|清白|干净|正直|谨慎|稳妥)(?:了|的啦|的了)',
  // 比较推导的收尾：比起/至少 ⇒ 这次可以放行（无显式许可词）
  '(?:比起|相比|较之|相对)(?:那些|他们|别人|他人|隔壁|其他|同行|别的)(?:真正|更加|更为|很|非常|特别)?(?:腐败|贪|脏|黑|过分|离谱|坏|糟糕|混乱|不规范)(?:的)?(?:人|部门|单位|同行|公司)?',
].join('|'));

const PERMIT_EN = new RegExp([
  '\\b(?:a|this|such\\s+a)\\s+(?:small|tiny|little|minor|slight|trivial)\\s+(?:kickback|favour|favor|bribe|gift|shortcut|discrepancy|slip|overrun|expense|perk|oversight)\\b',
  '\\b(?:is|it\\s+is|that\\s+is)\\s+(?:no\\s+(?:big\\s+)?(?:deal|problem|matter)|nothing|not\\s+(?:a\\s+)?(?:problem|issue|big\\s+deal)|hardly\\s+(?:a\\s+)?(?:problem|matter))\\b',
  '\\bdoes\\s+not\\s+(?:matter|count|hurt\\s+anyone|change\\s+anything)\\b',
  '\\bnobody\\s+(?:will|would|is\\s+going\\s+to|even)\\s+(?:notice|care|mind|check|find\\s+out|know)\\b',
  '\\b(?:can|could|may|might)\\s+(?:be\\s+)?(?:overlooked|excused|forgiven|waived|written\\s+off|let\\s+go|slid\\s+by|brushed\\s+aside)\\b',
  '\\b(?:let|make\\s+an\\s+exception|bend|look\\s+the\\s+other\\s+way|turn\\s+a\\s+blind\\s+eye)\\b',
  '\\bjust\\s+this\\s+(?:once|one\\s+time|time)\\b',
  '\\bcut\\s+(?:me|him|her|them)\\s+some\\s+slack\\b',
  // 第二种形状：无显式许可词，但整句是「既往资本 ⇒ 当下处置降格」的推导。
  // 骨架 = 既往资本短句 + 因果连接 + 当下事项的处置降格。
  '\\b(?:so|therefore|thus|hence|which\\s+means\\s+that|and\\s+that\\s+means)\\s+(?:this|that\\s+one|the\\s+current\\s+one|it)\\s+(?:can\\s+be|could\\s+be|is\\s+fine|is\\s+okay|is\\s+acceptable|barely\\s+counts|does\\s+not\\s+count)\\b',
  '\\b(?:so|therefore|thus|so\\s+that\\s+means)\\s+(?:nobody|no\\s+one)\\s+(?:will|needs\\s+to|has\\s+to)\\s+(?:mind|care|check|audit|verify)\\b',
  '\\b(?:make\\s+an\\s+exception|bent\\s+the\\s+rule|bend\\s+the\\s+rule)\\s+(?:just\\s+)?(?:this\\s+once|for\\s+me|in\\s+my\\s+case)\\b',
  '\\b(?:given|considering|after)\\s+(?:my|our|the)\\s+(?:record|service|years|contributions|donations|restraint)\\s*,?\\s*(?:this|that|it)\\s+(?:one\\s+)?(?:can|could|may|is\\s+fine|sails\\s+through|is\\s+a\\s+non-issue)\\b',
  '\\b(?:this|that|the\\s+current)\\s+(?:one|issue|expense|slip|overrun|discrepancy)\\s+(?:is|can\\s+be|should\\s+be)\\s+(?:forgiven|excused|overlooked|written\\s+off|excusable|understandable)\\b',
  '\\b(?:no\\s+need|no\\s+reason)\\s+(?:to\\s+)?(?:audit|investigate|look\\s+into|dwell\\s+on|punish)\\b',
  // 比较后的自我定级（my conduct is clean / I count as clean / this counts as decent）
  '\\b(?:my|our)?\\s*(?:conduct|behavio?u?r|record|dealing|hands)\\s+(?:are|is|stays|remains)\\s+(?:clean|spotless|decent|honorable|honourable|presentable)\\b',
  '\\b(?:that|this|it)\\s+(?:counts|could\\s+count|qualifies)\\s+as\\s+(?:clean|decent|honourable|honorable|presentable|acceptable)\\b',
  '\\b(?:which\\s+is|that\\s+is)\\s+(?:more|far\\s+more|a\\s+lot\\s+more)\\s+(?:decent|honest|restrained|careful|ethical)\\s+than\\b',
  '\\b(?:this|that)\\s+is\\s+(?:the\\s+)?(?:thanks|reward|gratitude|return)\\s+(?:i|we)\\s+(?:earned|deserve|get|got)\\b',
  '\\b(?:at\\s+least|still)\\s+(?:i|we)\\s+(?:was|were|have\\s+been)\\s+(?:restrained|moderate|measured|careful)\\b',
  // 「at least I did not do worse」——自我定级即许可，无需另出许可词
  // ⚠️ [r567] 补尾部 \s+：原支 `(?:do|behave\s+)?` 的 `do` 分支缺尾部空白，
  // 导致 "did not do worse" 连不上（scripts/round-567-nested-diag.js 实测
  // 加 \s+ 后由 false 转 true）。撇号分支已按 r566 决定不含。
  "\\bat\\s+least\\s+(?:i|we)\\s+(?:did\\s+not|have\\s+not)\\s+(?:do\\s+|behave\\s+)?(?:any\\s+)?(?:worse|as\\s+bad|so\\s+bad|worse\\s+than)\\b",
].join('|'), 'i');

// ─── G1: 独立评估看守（合法）──────────────────────────────────
const GUARD_ZH = new RegExp([
  // 明确说两件事独立：既往与本次分开算
  '(?:既往|过去|历史|历年|以往|此前)(?:记录|情况|表现|贡献|合规|清白)?(?:与|和|跟)(?:本|此|这)(?:次|回)(?:事项|问题|支出|异常|审核|复查|审计|处理|工作)(?:是|为|算)?(?:两个|两件|两码|两个不同)?(?:独立|分开|单列|另计|单一)',
  '(?:独立|单独|分别|另案|另行)(?:评估|审查|审计|核查|复核|认定|处理|定性|计算|办理)',
  // 明确说本次仍需审：照制度/照流程
  '(?:仍|依然|还|照常|照旧|按)(?:需|须|要|应)?(?:审计|审查|核查|复核|检查|调查|上报|报批|审批|追究)',
  '(?:按|依照|按照|依据|根据)(?:制度|规定|流程|标准|程序|规章|纪律|规范|合同)(?:办|办理|执行|履行|处理|走|来|重新)',
  // 奖励/荣誉与责任/差错的路线分离
  '(?:功劳|贡献|善行|捐赠|业绩)(?:归|记入|计入|载入|列入)(?:功劳簿|荣誉|荣誉册|奖项|激励|绩效|档案)',
  '(?:差错|问题|失误|违规)(?:另|另行|另按|则)(?:按|依|走|处理|定性|追责|计入)',
  // 「不等于/不能免」的明确切割
  '(?:不(?:等于|能|可以|足以|代表)(?:没有|免|抵|抵销|抵消|代替|替代|顶替))',
  '(?:既往|过去|历史)(?:清白|干净|合规|贡献|功劳)(?:不能|不足以|不得)(?:免|抵|代替|顶替|抵消)',
].join('|'));

const GUARD_EN = new RegExp([
  '\\b(?:past|previous|prior|earlier|historic(?:al)?)\\s+(?:record|compliance|contribution|conduct|behaviour|behavior|merit)\\s+(?:is|are|does|do)?\\s*(?:not|does\\s+not|cannot|can\\s+not)\\s*(?:exempt|excuse|waive|absolve|offset|negate|cover|settle|substitute)\\b',
  '\\b(?:is|are)?\\s*(?:separate(?:ly)?|independent(?:ly)?|apart|on\\s+its\\s+own\\s+(?:merits|facts)|own)\\s+(?:basis|matter|assessment|review|facts|grounds|issue)\\b',
  '\\b(?:still|nonetheless|nevertheless|as\\s+usual|as\\s+standard)\\s+(?:requires?|need(?:s)?|undergo(?:es)?|goes\\s+through|is\\s+(?:audited|reviewed|checked|assessed))\\b',
  '\\b(?:per|under|in\\s+accordance\\s+with)\\s+(?:the\\s+)?(?:policy|procedure|regulation|contract|standard|rule|guideline)\\b',
  '\\b(?:a\\s+)?(?:clean|spotless|good)\\s+(?:record|reputation)\\s+is\\s+not\\s+(?:a\\s+)?(?:defence|defense|excuse|shield)\\b',
  '\\bqualif(?:y|ies)\\s+for\\s+(?:tax\\s+)?(?:relief|deduction|credit)\\s+only\\b',
  '\\bassessed\\s+on\\s+its\\s+own\\s+(?:merits|facts|evidence)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMoralLicensing(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  const hasCapital = CAPITAL_ZH.test(text) || CAPITAL_EN.test(text);
  if (!hasCapital) return { hit: false, score: 0, detail: '', count: 0 };

  // 独立评估 / 按制度办 / 奖励与责任分离 → 不判
  if (GUARD_ZH.test(text) || GUARD_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const hasPermit = PERMIT_ZH.test(text) || PERMIT_EN.test(text);
  if (!hasPermit) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '道德许可×既往善行×越界免责(zh)'
      : 'moral-licensing×past-virtue×permission-to-misdeed(en)',
  };
}

module.exports = {
  checkMoralLicensing,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    CAPITAL_ZH, CAPITAL_EN,
    PERMIT_ZH, PERMIT_EN,
    GUARD_ZH, GUARD_EN,
  }),
};
