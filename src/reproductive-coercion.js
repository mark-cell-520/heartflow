/**
 * src/reproductive-coercion.js — 「生育胁迫」检测器（第 120 个判别维度）
 *
 * [r675 立项建模块] 候选来源：r670 探测器产出四族合格候选，r672/r673/
 * r674 先后做掉 thought_terminating_cliche / comparative_devaluation /
 * pet_harm_coercion 后，本轮在当前 119 维引擎上复量两个剩余族
 * （/root/.hermes/cache/scratch/r675-reprobe.js，判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；≥50% 攻击漏判且良性 0 误伤才算合格）：族
 * 「生育胁迫」攻击 12 条漏判 7 条（58%）、良性 6 条 0 误伤、全维度
 * 零命中 7/12（Phase 1.5 同律复核：7 条漏判逐条跑 discriminate() 确认
 * 全部零维度命中，真缺口成立）。decision 本体一次选出
 * （/root/.hermes/cache/scratch/decide-run-675.js，读 decide-opts-675.json，
 * composite_score 0.91 / confidence 0.85 / identity alignment 100%，
 * 无拒选）：reproductive_coercion 0.91 > love_bombing 0.86 >
 * hidden-instance 接线 0.78。
 *
 * 辨别的族：「生育胁迫」——把**生育（怀孕/生孩子/生儿子/终止妊娠）**
 * 与婚姻缔结、关系存续、个人价值绑定，作为要求对方当下顺从的条件：
 *   怀了孕我才娶你，这是规矩。
 *   你先把工作辞了，孩子生下来再说。
 *   不生个儿子，你在我们家永远抬不起头。
 *   You will not be a real woman until you give me a child.
 *   不生孩子就离婚，我找别人生。
 *   你敢把孩子打掉，我这辈子都不会原谅你。
 *   A real wife puts her husband's family line first.
 *
 * 为什么现有维度拦不住（r675 discriminate() 零命中实测 + 归因）：
 *   · 5 条已被其他维度拦下的同族样本归因清楚（不是本族射程）：
 *     「你不生孩子就是不孝，我们家就断后了」命中 fallacies（不孝/
 *     断后判为道德谬误）；「我妈说两年内必须抱上孙子」命中
 *     triangulation（拉第三方施压）；「你要是真爱我，就会愿意为我
 *     生个孩子」命中 double_bind（双缚）；「你年龄再大就生不出来了，
 *     现在必须听我的」命中 appeal_to_authority_boost + privacy_boundary；
 *     「我妈说了，孩子必须跟她姓，不然就别进这个门」命中
 *     thirdparty_harm_coercion。7 条漏判样本的形状全部在这些维度的
 *     射程之外。
 *   · family_shame_coercion（r664，第 110 维）判据是「集体名誉受损
 *     定性 × 指向对方问责」——本族「不生个儿子，你在我们家永远抬不起
 *     头」虽含「抬不起头」，但其左腿要求让/叫/使得/害 + 家族集体
 *     主语，本样本主语是「你」且无名誉受损动词前缀，实测零命中。
 *   · relationship_severance（r654）管**关系终止宣告**本身，本族的
 *     「不生孩子就离婚」终止关系是**条件句的后件**，绑定结构在生育
 *     条件上，不是单纯宣告。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿 A「REPRO 生育语境」：A1 怀孕（怀了孕/刚怀孕/意外怀孕/有了
 *     身孕）；A2 生育动作与传承（生孩子/生个孩子/生儿子/生个儿子/
 *     生二胎/孩子生下来/传宗接代/续香火/香火/断后/断子绝孙/皇位/
 *     继承人/子嗣/男丁/后代/孙子/孙女）；A3 终止妊娠（打掉/堕胎/
 *     流掉/拿掉/做掉/人流 +可选孩子/胎儿）；A4 生育能力（生不出/
 *     生不了/不能生/怀不上/生不出来）；A5 英文（give birth / have
 *     a child / have the baby / get pregnant / bear a child / give
 *     me a child / abort / terminate the pregnancy / family line /
 *     bloodline / heir）；
 *   · 腿 B「BIND 绑定结构」（五类任中一类）：
 *     B1 婚姻条件化（怀孕/先有孩子 + 才娶/才嫁/才结婚/才领证；英文
 *        marry you only if you are pregnant / after you give birth）；
 *     B2 关系终止要挟（不生（孩子/儿子）+ 就离婚/分手/找别人生/另找；
 *        英文 if you don't give me a child, I will find someone）；
 *     B3 价值否定绑定（不生（儿子/孩子）+ 抬不起头/直不起腰/不是
 *        真正女人/不孝/不配；英文 not a real woman until / a real
 *        wife puts family line first）；
 *     B4 终止妊娠禁止 + 情感惩罚（敢（把）孩子打掉/敢去堕胎 + 永不
 *        原谅/这辈子饶不了/永远别回来——名词在前与动词在前两种
 *        语序都认）；
 *     B5 牺牲要求（祈使指向对方：先/必须/得/给我 + 把工作辞了 + 孩子
 *        生下来/生娃；英文 quit your job ... have the baby——为生育
 *        要求对方放弃事业。祈使词必填：「生完孩子我打算辞职休息
 *        半年」是自主计划不是胁迫）。
 *   · 单有生育语境不判：「生育意愿是伴侣双方需要充分沟通的重要议题」
 *     是正当讨论；单有绑定结构不判：「孩子必须跟她姓，不然就别进这个
 *     门」绑定的是姓氏不是生育（腿 A 不含「姓」类词，实测零命中）。
 *
 * 明确不判的（守门 G1-G4）：
 *   · G1 医学与健康咨询：生育健康咨询/产前检查/辅助生殖/孕期保健；
 *   · G2 概念分析语境：生育胁迫作为被分析、被否定的对象（「生育
 *     胁迫是一种违法行为」「reproductive coercion is a form of
 *     abuse」「以生育相要挟是情感操控的常见手段」）；
 *   · G3 正当生育讨论：生育意愿/选择/计划 + 尊重/沟通/双方共同；
 *   · G4 句首咨询提问（只认句首咨询词，句中反问不豁免）。
 *
 * [r675 实现纪律] 同 r642-r674：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选（B4 支2 的
 *    名词组可选是例外：前后有「敢」与「永不原谅」双锚定，不会退化
 *    成单动词命中）。
 * ⚠️ isZh 判定写 /[\u4e00-\u9fff]/（单层反斜杠，Node 正则可识别）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 */

'use strict';

// ─── 腿 A1: 怀孕类 ────────────────────────────────────────────────
const PREG_ZH = new RegExp([
  String.raw`(?:怀了?孕|刚怀孕|意外怀孕|有了身孕|有身子|挺着肚子)`,
].join('|'), 'i');

// ─── 腿 A2: 生育动作与传承类 ──────────────────────────────────────
const REPRO_ACT_ZH = new RegExp([
  // 生育动作（生孩子/生儿子/生二胎/孩子生下来）
  String.raw`(?:生|养|育)[个出了]?(?:孩子|儿子|女儿|男丁)|生二胎|生三胎|生娃|生子|把孩子生下来|孩子生下来|生下来|传宗接代|续香火|接香火|继承香火|延续香火|添丁|添男丁|生男孙|抱孙子|抱外孙|生孙子`,
  // 传承压力词（香火/断后/皇位/继承人）
  String.raw`(?:香火|断后|断子绝孙|皇位|继承人|子嗣|男丁|后代|孙子|孙女|外孙|老×家的根|独苗)`,
].join('|'), 'i');

// ─── 腿 A3: 终止妊娠类 ────────────────────────────────────────────
const ABORT_ZH = new RegExp([
  String.raw`(?:打掉|堕胎|流掉|拿掉|做掉|人流)(?:孩子|胎儿|宝宝|娃|骨血)?`,
].join('|'), 'i');

// ─── 腿 A4: 生育能力类 ────────────────────────────────────────────
const INFERTILE_ZH = new RegExp([
  String.raw`(?:生不出|生不了|不能生|怀不上|生不出来|生不出孩子|生不出儿子|不能生育|无法生育)`,
].join('|'), 'i');

// ─── 腿 A5: 英文生育语境 ──────────────────────────────────────────
const REPRO_EN = new RegExp([
  String.raw`\b(?:give\s+birth|have\s+(?:a|the)\s+(?:child|baby|son|kid)|get\s+pregnant|bear\s+(?:a\s+)?(?:child|son|kid)|give\s+(?:me|us|him|her)\s+a\s+(?:child|baby|son|kid)|abort(?:ion)?|terminate\s+the\s+pregnancy|miscarriage|family\s+line|bloodline|blood\s+line|heir|procreat\w+|childbearing)\b`,
].join('|'), 'i');

// ─── 腿 B1: 婚姻条件化（先孕后婚）─────────────────────────────────
const MARRIAGE_COND_ZH = new RegExp([
  // 怀孕/先有孩子 + 才/再 + 娶/嫁/结婚/领证/进门
  String.raw`(?:怀了?孕|先怀孕|先有孩子|有了孩子|怀上)[^。]{0,10}(?:才|再|方)(?:能|肯|会|愿意)?(?:娶|嫁|结婚|领证|订婚|办酒|进门|过门|迎娶|明媒正娶)`,
  // 生儿子/生完孩子 + 再/才 + 过门/娶/嫁（生育动作在前的语序）
  String.raw`(?:生个?儿子|生个?孩子|生了儿子|生了孩子|有孩子|养个?儿子)[^。]{0,10}(?:再|才)(?:能|肯|会|愿意)?(?:过门|进门|娶|嫁|结婚|领证|办酒|订婚)`,
  // 先/必须先 + 怀孕/有孩子 + 再/才
  String.raw`(?:先|得先|必须先|得)[^。]{0,8}(?:怀孕|有孩子|生孩子)[^。]{0,10}(?:再|才|不然|否则)`,
  // 娶你/结婚 + 除非/只有/必须 + 怀孕/生了孩子
  String.raw`(?:娶你|嫁你|结婚|领证|订婚)[^。]{0,10}(?:除非|只有|必须|非得)[^。]{0,8}(?:怀了?孕|先怀孕|生了孩子|有孩子|怀孕)`,
  // 英文：marry you only if you are pregnant / after you give birth
  String.raw`\b(?:marry|wed)\s+you\s+(?:only\s+)?(?:if|after|when)\s+you\s+(?:'re\s+|are\s+)?(?:pregnant|give\s+birth|have\s+(?:a|the)\s+(?:child|son))\b`,
  String.raw`\b(?:not\s+until|only\s+when)\s+you(?:'re|\s+are)?\s+(?:pregnant|carrying)\b`,
].join('|'), 'i');

// ─── 腿 B2: 关系终止要挟（不生就离）───────────────────────────────
const SEVERANCE_COND_ZH = new RegExp([
  // 不/没/再不 + 生（孩子/儿子）+ 就/不然 + 离婚/分手/找别人生
  String.raw`(?:不|没|再不|要是不|如果不|若|倘若|不肯|不想|不愿意)[^。]{0,4}(?:生|肯生|愿意生|生养|给|肯给|生得出)[^。]{0,8}(?:孩子|儿子|男孩|男丁|宝宝|娃|后代|二胎|香火)[^。]{0,14}(?:就|那我|不然|否则|再)[^。]{0,10}(?:离婚|分手|散伙|散了|散|分开|找别人|另找|再娶|再嫁|换人|娶别人|嫁别人|断绝关系)`,
  // 不生/不肯生/没生 + 短间隔 + 离婚/分手
  String.raw`(?:不生|不肯生|不想生|没生|生不出)[^。]{0,12}(?:离婚|分手|找别人|就离|断绝关系)`,
  // 英文：if you don't give me a child, I will find someone (else)
  String.raw`\b(?:if|unless)\s+you\s+(?:don't|do\s+not|can't|cannot|won't|will\s+not)\s+(?:give|have|bear)\s+(?:me\s+|us\s+)?(?:a\s+)?(?:child|son|baby|heir)\b[^.]{0,40}\b(?:leave|divorce|find\s+someone|someone\s+else|walk\s+away|marry\s+someone)\b`,
].join('|'), 'i');

// ─── 腿 B3: 价值否定绑定（不生儿子就抬不起头/不是真女人）──────────
const VALUE_BIND_ZH = new RegExp([
  // 不生（儿子/孩子）+ 抬不起头/直不起腰/不孝/不配
  String.raw`(?:不生|没生|生不出|生不了|生不出来|不生养)[^。]{0,8}(?:儿子|男孩|男丁|孩子|娃)[^。]{0,16}(?:抬不起头|抬不起|直不起腰|抬不起头做人|不是|算不上|不配|不孝|白活|失败|没用|算什么|有什么脸|丢人|枉为)`,
  // 抬不起头/直不起腰 + （原因是不生）
  String.raw`(?:抬不起头|抬不起|永远抬不起|直不起腰)[^。]{0,16}(?:不生|没生|生不出|生不了|生不出来)`,
  // 不生（儿子）+ 就是/才算/等于 + 否定定性
  String.raw`(?:不生|没生|生不出)[^。]{0,8}(?:儿子|男孩|孩子|娃)[^。]{0,14}(?:就是|才算|等于|意味着)[^。]{0,10}(?:不是|算不上|不配|不孝|失败|没用|白来|白活|枉为)`,
  // 不生（儿子）+ 你算什么/也配
  String.raw`(?:不生|没生|生不出)[^。]{0,8}(?:孩子|儿子|娃)[^。]{0,12}(?:算什么|算哪门子|也配|有个屁|算什么东西)`,
  // 英文：not (be) a real/true/complete/proper woman|wife|man
  String.raw`\b(?:not|never|aren't|are\s+not|isn't|is\s+not)\s+(?:be\s+|a\s+|an\s+)*(?:real|true|complete|proper|full|whole)\s+(?:woman|wife|man|female|husband)\b`,
  // 英文：a real wife puts her husband's family line first
  String.raw`\b(?:a\s+)?(?:real|true|proper)\s+(?:wife|woman|man|husband)\s+(?:puts?|places?|knows?|should\s+put|must\s+put|always\s+puts?)\s+(?:her|his|their)?\s*(?:husband'?s?\s+|family'?s?\s+|the\s+)?(?:family|duty|duties|role|line)\s+(?:line\s+)?first\b`,
].join('|'), 'i');

// ─── 腿 B4: 终止妊娠禁止 + 情感惩罚 ───────────────────────────────
const ABORT_BAN_ZH = new RegExp([
  // 支1：敢/要是 + (把) + 孩子 + 打掉/堕胎 + 永不原谅（名词在前）
  String.raw`(?:敢|再敢|你要是|如果你|若|倘若|不许|不准)[^。]{0,12}(?:把|将)?[^。]{0,6}(?:孩子|胎儿|宝宝|娃)[^。]{0,6}(?:打掉|堕胎|流掉|拿掉|做掉)[^。]{0,20}(?:永不|永远不|这辈子|下辈子|一辈子|饶不了|放过|原谅|别回来|滚)`,
  // 支2：敢/要是 + (去) + 打掉/堕胎 + (孩子) + 永不原谅（动词在前或无名）
  String.raw`(?:敢|再敢|你要是|如果你|若|倘若|不许|不准)[^。]{0,6}(?:去|给|给我)?[^。]{0,4}(?:打掉|堕胎|流掉|拿掉|做掉)[^。]{0,6}(?:孩子|胎儿|宝宝|娃)?[^。]{0,20}(?:永不|永远不|这辈子|下辈子|一辈子|饶不了|放过|原谅|别回来)`,
].join('|'), 'i');

// ─── 腿 B5: 牺牲要求（为生育放弃事业，祈使指向对方）────────────────
const SACRIFICE_ZH = new RegExp([
  // 祈使词（先/必须/得/给我）+ 把工作辞了 + 孩子/生下来
  // ⚠️ 祈使词必填——「生完孩子我打算辞职休息半年」是自主计划不是胁迫
  String.raw`(?:先|必须|得|给我|应当|应该|务必|赶紧)[^。]{0,10}(?:把|将)?[^。]{0,8}(?:工作|事业|饭碗|职位|岗位|学业|书)[^。]{0,8}(?:辞了|辞掉|辞了|停了|停止|放弃|放掉|断了|撇下)[^。]{0,18}(?:孩子|生下来|生娃|生孩子|带娃|奶娃|奶孩子|照顾孩子|伺候月子)`,
  // 动词在前语序：祈使 + 放弃/辞掉 + 工作/事业 + 孩子
  String.raw`(?:先|必须|得|给我|应当|应该|务必|赶紧)[^。]{0,6}(?:辞掉|辞了|放弃|停止|撇下)[^。]{0,8}(?:工作|事业|饭碗|职位|岗位|学业)[^。]{0,18}(?:孩子|生下来|生娃|生孩子|带娃|奶孩子|照顾孩子|伺候月子)`,
  // 你就在家 + 生孩子/带孩子（祈使形）
  String.raw`(?:你|您)(?:就|给我|必须|得|先)?(?:在|回)家[^。]{0,10}(?:生孩子|生娃|带孩子|奶孩子|照顾孩子|相夫教子|伺候)`,
  // 英文：quit your job ... have the baby
  String.raw`\b(?:quit|give\s+up|leave)\s+your\s+(?:job|work|career|profession)\b[^.]{0,30}\b(?:have|raise|care\s+for|look\s+after)\s+(?:the\s+)?(?:baby|child|kid)s?\b`,
].join('|'), 'i');

// ─── G1: 医学与健康咨询 ───────────────────────────────────────────
const MEDICAL_ZH = new RegExp([
  String.raw`(?:生育|生殖|怀孕|妊娠|孕期|产前|产后|避孕|不孕不育|试管|辅助生殖|流产|堕胎|妇幼)[^。]{0,12}(?:健康|咨询|检查|门诊|医生|知识|科普|医疗|护理|保健|中心|技术|手术|恢复|营养|指标|建档|建卡|随访)`,
  String.raw`(?:医院|医生|产科|妇科|保健院|社区卫生)[^。]{0,8}(?:建议|检查|咨询|随访|建档|建卡|诊断)`,
  String.raw`\b(?:prenatal|postnatal|fertility|reproductive\s+health|IVF|obstetric|gynecol\w+)\b[^.]{0,30}\b(?:care|clinic|checkup|treatment|consult|appointment|screening)\b`,
].join('|'), 'i');

// ─── G2: 概念分析语境（生育胁迫作为被分析、被否定的对象）────────────
const ANALYSIS_ZH = new RegExp([
  // 生育/孩子 + 胁迫/逼迫 + 是/属于 + 定性
  String.raw`(?:生育|生殖|传宗接代|孩子|怀孕|堕胎)[^。]{0,8}(?:胁迫|逼迫|要挟|绑架|干涉|干预|控制)[^。]{0,14}(?:是|属于|构成|正是|就是|归为|列为)[^。]{0,14}(?:违法|犯罪|侵权|操控|控制|暴力|虐待|不可取|不该|错误|典型|常见|一种|手段|形式|行为)`,
  // 以/用 + 生育/孩子 + 相要挟/作筹码
  String.raw`(?:以|用|拿|把)[^。]{0,8}(?:生育|怀孕|孩子|堕胎|流产)[^。]{0,10}(?:相要挟|作筹码|当筹码|作威胁|当威胁|逼迫|胁迫|逼)`,
  // 生育胁迫/生殖胁迫 + 识别/警惕/防范
  String.raw`(?:生育|生殖)[^。]{0,4}(?:胁迫|压迫|干涉|暴力)[^。]{0,12}(?:识别|警惕|防范|反对|拒绝|反抗|讨论|分析|研究|概念|定义)`,
  // 英文：reproductive coercion is a form of / refers to / defined
  String.raw`\breproductive\s+coercion\b`,
].join('|'), 'i');

// ─── G3: 正当生育讨论 ─────────────────────────────────────────────
const LEGIT_ZH = new RegExp([
  // 生育/生殖 + 意愿/选择/决定/计划/权利/自主 + 是/应/尊重/沟通/双方
  String.raw`(?:生育|生殖)[^。]{0,8}(?:意愿|选择|决定|计划|权利|自主|观念|自由)[^。]{0,16}(?:是|应|需要|属于|尊重|沟通|协商|双方|共同|自由|平等|重要)`,
  // 尊重/保障 + 身体/生育/生殖 + 自主/权利
  String.raw`(?:尊重|保障|维护|强调)[^。]{0,8}(?:身体|生育|生殖|性)[^。]{0,8}(?:自主|权利|自由|完整|决定权|选择权)`,
  // 英文
  String.raw`\b(?:reproductive|childbearing)\s+(?:choices?|rights?|autonomy|decisions?|freedom)\s+(?:should|must|are)\s+(?:be\s+)?(?:made|respected|jointly|freely|protected|discussed)\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首咨询词，句中反问不豁免）──────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkReproductiveCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const PREG_ZH_ = R.PREG_ZH || PREG_ZH;
  const REPRO_ACT_ZH_ = R.REPRO_ACT_ZH || REPRO_ACT_ZH;
  const ABORT_ZH_ = R.ABORT_ZH || ABORT_ZH;
  const INFERTILE_ZH_ = R.INFERTILE_ZH || INFERTILE_ZH;
  const REPRO_EN_ = R.REPRO_EN || REPRO_EN;
  const MARRIAGE_COND_ZH_ = R.MARRIAGE_COND_ZH || MARRIAGE_COND_ZH;
  const SEVERANCE_COND_ZH_ = R.SEVERANCE_COND_ZH || SEVERANCE_COND_ZH;
  const VALUE_BIND_ZH_ = R.VALUE_BIND_ZH || VALUE_BIND_ZH;
  const ABORT_BAN_ZH_ = R.ABORT_BAN_ZH || ABORT_BAN_ZH;
  const SACRIFICE_ZH_ = R.SACRIFICE_ZH || SACRIFICE_ZH;
  const MEDICAL_ZH_ = R.MEDICAL_ZH || MEDICAL_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const LEGIT_ZH_ = R.LEGIT_ZH || LEGIT_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  // [r678 顺手修] 双层反斜杠版 /[\\u4e00-\\u9fff]/ 恒 false（patch 转义层所致），
  // 只影响 detail 中英文文案不影响判定；改用无反斜杠的字面端点（同 r678 模块）。
  const isZh = /[一-龿]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '生育胁迫×生育语境×绑定结构(zh)'
      : 'reproductive-coercion×reproductive-context×conditional-binding(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：医学咨询 / 概念分析 / 正当讨论 / 句首咨询
  if (MEDICAL_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (LEGIT_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 腿 A：生育语境（五类任中一类）
  const legA = PREG_ZH_.test(text) || REPRO_ACT_ZH_.test(text) ||
    ABORT_ZH_.test(text) || INFERTILE_ZH_.test(text) || REPRO_EN_.test(text);
  if (!legA) return miss();

  // 腿 B：绑定结构（五类任中一类）
  if (MARRIAGE_COND_ZH_.test(text)) return hitResult;
  if (SEVERANCE_COND_ZH_.test(text)) return hitResult;
  if (VALUE_BIND_ZH_.test(text)) return hitResult;
  if (ABORT_BAN_ZH_.test(text)) return hitResult;
  if (SACRIFICE_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkReproductiveCoercion,
  __internals: () => ({
    PREG_ZH, REPRO_ACT_ZH, ABORT_ZH, INFERTILE_ZH, REPRO_EN,
    MARRIAGE_COND_ZH, SEVERANCE_COND_ZH, VALUE_BIND_ZH, ABORT_BAN_ZH, SACRIFICE_ZH,
    MEDICAL_ZH, ANALYSIS_ZH, LEGIT_ZH, QUESTION_ZH,
  }),
};
