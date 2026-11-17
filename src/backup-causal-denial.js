/**
 * src/backup-causal-denial.js — 「备份因果否认 / 替代者谬误」检测器
 * （第 263 个判别维度，r376）
 *
 * [r376 立项] philosophy_decision 在当前引擎（v6.8.190，262 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。立项缺口实证（探针
 * scripts/round-376/probe-r376-pool.js + probe-r376-scope.js，pristine
 * 基线 v6.8.190 / HEAD 07cc938b）：12 条攻击样本穿透 5 条**真零命中**
 * （存量维度零代拦），10 条良性中 2 条非 pass 均系存量维度误伤
 * （sorites/ecological），非本族增量。
 *
 * 外部来源：三层搜索（HN Algolia / Semantic Scholar / GitHub）——S2
 * 空返；GitHub logical fallacy detection 高星仓库最高 21 star
 * （tmakesense/logical-fallacy），LLM-based 或学生项目，心虫为纯规则
 * 引擎**不引入 LLM 依赖**，无成熟规则方案可抄。HN 命中
 * arXiv 2405.02318（NL2FOL：把自然语言逻辑译为 FOL 再交 SMT 求解器
 * 验证有效性）——对纯规则引擎不可行（需 SMT 求解器与 LLM 翻译），
 * 仅借鉴其「谬误 = 结构而非关键词」的设计思路：本族按
 * 「替代者在场 × 自身贡献清零 × 责任免除」三腿共现判定，不依赖任何
 * 单一关键词命中。按既有维度形态自建纯规则判据。
 *
 * 辨别的族：备份因果否认（backup causal denial / 替代者谬误，
 * fallacy of the substitutable agent / "someone else will do it"）——
 * 用**替代者的确定性在场**（「我不做也有别人做」「换谁都一样」）
 * 把自身行为的**因果贡献**清零，从而**免除行动责任**：
 *   我一个人少开几天车有什么关系，反正全球几亿辆车在排，我这点排放
 *   根本不值一提。
 *   这个项目我不做，照样有大把人抢着做，做不做都一样。
 *   一张选票能改变什么？我不投也总有别人会投，该赢还是赢，该输还是输。
 *   Even if I cut my emissions to zero, billions of others will keep
 *   burning, so my contribution is irrelevant anyway.
 *   Why bother voting? My single ballot changes nothing — the outcome
 *   would be identical without it, since millions of others vote too.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：本族错在
 * **反事实结构**——它宣称「没有我，结果也一样」，而这正是需要被验证
 * 的反事实，不是已知事实；同时它用**聚合层的旁观视角**（几亿辆车、
 * 几千家工厂）抹掉**个体层的因果贡献**（每一个排放者都是总量的构成
 * 项）。在排放、投票、腐败、公共品供给里，这种否认直接取消行动义务，
 * 是「集体行动困境」话术最常见的谬误变体。
 *
 * 与既有维度的边界（r376 归因）：
 *   · ecological_fallacy（第 211 维度）判「聚合统计量→个体属性推断」，
 *     腿①必须是统计量（平均/比率/率）、腿②必须是**个体层量化指称**
 *     （每个人/人人/every individual）；本族腿①是**替代者在场宣告**
 *     （别人也会做/换谁都一样）、腿②是**自身贡献否定**（多我一个不多/
 *     没有区别/irrelevant），不需要个体层指称——「我一个人少开几天车
 *     有什么关系」在 ecological 侧腿②无「每个人」式指称故漏判，本族补。
 *   · monocause（第 161 维度）管把多因结果压成单一原因；本族方向相反，
 *     是把**自身这个因**整个删除，不涉及多因压缩。
 *   · appeal_to_probability（第 71 维度附近）管「可能发生所以会发生」，
 *     本族管「有替代者所以我的因不存在」。
 *   · scale_dismissal（第 205 维度）管「规模小所以风险可忽略」；本族
 *     的贡献否定必须锚定在**替代者确定性在场**这一反事实上，规模小
 *     单独出现（「我个人作用有限」）不判——见豁免组二。
 *   · responsibility_absolution / performative_responsibility 管责任
 *     话术本身，本族管「用替代者免除自身行动责任」的因果否认结构。
 *
 * 判据（主判据三腿共现 + 邻近窗，缺一不判）：
 *   · 腿① SUB 替代者在场宣告（ZH 五族 + EN 五族）：
 *       A-他人在场：别人也会|别人也会做|有人会|总有人|大把人|多得是的
 *         人|抢着做|有的是人|高手如云|前赴后继| whoever
 *       B-替换等价：换谁都一样|换个人也一样|谁来做都一样|谁来都一样|
 *         谁都一样|没有区别|一个样|照样|一样能做|不缺我一个
 *       C-无我推论（备份存在的直接陈述）：我不做也有|没有我也|就算没有
 *         我|少了我也|缺了我|天塌下来有高个子顶着
 *       D-旁观规模锚（几亿/几千家/都在排）：亿|万|千(?:家|人|辆)|
 *         billions|millions|thousands（须与腿②共现，单独规模词不判）
 *     EN: someone else (will|would|always)|somebody else|others will|
 *         they'?ll do it anyway|replaceable|anyone could do it|
 *         someone will always|no one will notice|would be identical|
 *         makes? no difference|wouldn'?t change anything|backup
 *   · 腿② NIL 自身贡献清零（ZH + EN）：
 *       Z-贡献否定：多我一个不多|少我一个不少|不值一提|无关紧要|
 *         毫无作用|没有任何影响|没有意义|改变不了|无济于事|白费|
 *         杯水车薪|无所谓|不算什么|算什么|能改变什么
 *       W-责任免除：做不做都一样|投不投一样|干不干一样|去不去一样|
 *         没有区别|一样的结果|照 样
 *       E-英文：irrelevant|makes? no difference|makes? zero difference|
 *         no impact|pointless|futile|meaningless|changes nothing|
 *         nothing I do|can'?t change anything|won'?t matter|identical
 *         without
 *   · 腿③ 免责推论/结论（连接词或结论形）：
 *       ZH：所以|因此|因而|可见|这说明|那么|何必|凭什么|何苦|为什么
 *         还要|有什么关系|又能怎样|又能如何|谈何|不如|干脆|懒得|随它
 *       EN：so|therefore|thus|hence|why bother|what'?s the point|
 *         anyway|might as well|no point|why should I
 *   · 邻近窗：腿① ↔ 腿② 双向，ZH 80 字 / EN 200 字符（本族句式长，
 *     r372 的 60/160 窗在「我一个人少开几天车…反正全球几亿辆车在排」
 *     上截断腿①与腿②）。
 *
 * 为什么取 VERIFY 级：单句也可能是**正确的多因/集体行动陈述**
 * （「个人减排是集体行动的社会基础，不能因此免除个人责任」）、
 * 小说台词、公共品供给的经济学讨论，rewrite/block 会误伤。verify 的
 * 含义是「这段文本用替代者的在场免除了自身行动责任，需要先验证
 * 『没有我结果是否真的一样』这一反事实再采信」——调用方应要求补出
 * 个体贡献的因果依据或集体行动的构成说明。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（搭便车/公地悲剧/集体行动困境/替代者谬误/
 *     搭便车者/免费搭车/因果贡献/反事实/fallacy/someone else will do
 *     it/backup causal/经济学/教材/课堂/论文/文献——讨论这个概念本身
 *     不是运用它；元话语豁免要求句中同时出现教学/学术框架标记或否定
 *     标记）。
 *   · 正确多因/集体行动陈述（本族要教的判别动作——**承认个体贡献
 *     并拒绝免除责任**：是社会基础/集体行动/总量正是由/每一个都是/
 *     不能因此免除/不豁免个人/责无旁贷/人人有责/aggregate emissions
 *     are exactly the sum of them / does not exempt）。
 *   · 组织与协作陈述（分工协作/可替代的是岗位不是责任/团队互补/
 *     替补/轮岗/backup engineer/on-call/handover——正常运营语境，无
 *     「贡献清零」结论腿）。
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/还要
 *     看/而不是/而非；EN does not mean / not necessarily / depends on
 *     / cannot conclude）。
 *   · 疑问句（含 ?/？；反问标记出现时不豁免——「一张选票能改变什么？」
 *     正是本族最常见的包装形态）。
 *   · 无腿②（只有替代者在场、无贡献清零）——「这个项目有大把人抢着
 *     做」是中性事实陈述，不判。
 *   · 无腿①（只有贡献否定、无替代者）——「我个人作用有限」是正当的
 *     自我评估，不判（scale_dismissal 射程）。
 *
 * 已知边界：
 *   · 替代者与贡献清零以词表识别，未收入词表的同义表述不判。
 *   · 邻近窗外的跨段共现（两腿相隔 >80 字 / EN >200 字符）不判。
 *   · 与 ecological_fallacy / scale_dismissal 的共命中按射程切分声明，
 *     未做大规模共现消歧压测。
 */
'use strict';

// ─── 腿① SUB 替代者在场宣告（中文）──────────────────────────────
const SUB_ZH = [
  // A 他人在场（替代者的确定性在场）
  /别人(?:也会|还会|会替|同样会|自然会|照样会)/,
  /有人(?:会|要|去|抢着)/,
  /总有人|大把人|大有人在|多得是人|有的是人|有的是|抢着做|抢着干|争先恐后|趋之若鹜/,
  /高手如云|能人辈出|人才济济|前仆后继|前赴后继|后浪推前浪/,
  /总有别人|别人(?:也|同样|照(?:样|旧))?(?:会|要|去|做|干|投|抢|接|顶上)/,
  // B 替换等价（换谁都一样）
  /换(?:谁|个人|个谁|任何人|谁来)(?:都|也)?(?:一样|一个样|是|能|可以)/,
  /谁(?:来|做|接|干)(?:都|也)?(?:一样|一个样|是|能|可以|照样)/,
  /谁(?:都|也)(?:一样|差不多|差不多)/,
  /一个样|没啥区别|没什么区别|并无区别|都一样|也能做|照样能做|不是非我不可|不缺我一个|少了我一个/,
  // C 无我推论（备份存在的直接陈述）
  // [r377 补腿] 「我不投也」原词表只收 不做/不干，漏「投」——A5
  // 「我不投也总有别人会投」是投票场景最常见形态，同族补收。
  /我不做也有|我不做还有|我不干也有|没有我也|就算没有我|少了我也|缺了我|没有我(?:也|照样|照样能)|我不在也/,
  /我不投也|我不投还|不投也有|没有我这一票|少我这一票|缺我这一票|没我这一票|缺我这票/,
  /天塌下来有高个子顶着|天塌了有高个子顶着|地球照样转|离了谁都转|公司也不会垮|单位照转/,
  // D 旁观规模锚（聚合视角锚定——须与腿②共现，单独不判）
  /[0-9０-９]+(?:亿|万|千)(?:多)?(?:辆|家|人|个|座|条|吨)/,
  /亿(?:多)?(?:辆|家|人|个|座|条|吨)|万(?:多)?(?:辆|家|人|个|座|条|吨)|千(?:家|人|辆|座)/,
  /全国|全世界|全球|大伙|大家(?:都|也)?(?:在|是)/,
];

// ─── 腿① SUB 替代者在场宣告（英文）──────────────────────────────
const SUB_EN = [
  /\b(?:someone|somebody)\s+else\s+(?:will|would|always|can|could|is\s+going\s+to|'?ll)\b/i,
  // [r377 补腿] A12「someone else on the team will file it」——替代者宣告
  // 与动作之间夹了「on the team」这类短状语，紧邻要求落空。允许 ≤3 词
  // 间隔；仍需腿②③共现，单独出现不判。
  /\b(?:someone|somebody)\s+else\s+(?:\w+\s+){0,3}?(?:will|would|'?ll)\b/i,
  /\bothers?\s+(?:will|would|always|can|could)\b/i,
  /\bthey'?(?:ll|re\s+going\s+to)\s+(?:do|handle|take|pick|cover|do\s+it)\b/i,
  /\b(?:replaceable|interchangeable|swappable|substitutable|dispensable)\b/i,
  /\b(?:anyone|anybody|anybody\s+else)\s+(?:could|can|would|will)\b/i,
  /\bno\s+one\s+(?:will\s+)?(?:notice|care|miss|stop)\b/i,
  /\bwould\s+be\s+(?:identical|the\s+same|no\s+different)\b/i,
  /\bmakes?\s+(?:no|zero|little)\s+(?:difference|impact|dent)\b/i,
  /\bwouldn'?t\s+(?:change|matter|make)\b/i,
  /\b(?:someone|somebody)\s+will\s+(?:always|just|inevitably)\b/i,
  /\b(?:backup|back-?up|substitute|stand-?in|fill-?in)\s+(?:for\s+me|available|candidate|person)\b/i,
  // D 旁观规模锚（EN）——须与腿②共现，单独不判
  /\b(?:billions?|millions?|thousands?|hundreds\s+of\s+thousands?)\s+of\b/i,
];

// ─── 腿② NIL 自身贡献清零（中文）────────────────────────────────
const NIL_ZH = [
  // Z 贡献否定
  /多我一个不多|少我一个不少|不缺我一个|有没有我都一样|有我没我一样/,
  /不值一提|不值一哂|无关紧要|无关痛痒|无足轻重|微不足道|毫无作用|不起作用|没有任何影响|毫无影响|没有影响|影响不了|改变不了|改变不了什么|于事无补|无济于事|杯水车薪|螳臂当车|蚍蜉撼树|白费|白搭|徒劳|徒劳无功|枉然/,
  /没有意义|毫无意义|有啥意义|有什么意义|算什么|能改变什么|何足挂齿|何足道哉|谈不上影响/,
  /无所谓|不在乎|不在意|不计较|听之任之|随他|随它|爱咋咋地/,
  // W 责任免除结论形
  /做不做都一样|干不干一样|去不去一样|投不投一样|说不说一样|改不改一样|做与不做|干与不干|去与不去/,
  /一样的结果|同样的结果|结果都一样|结局都一样|毫无意义|又有什么区别|有什么区别/,
  /地球照样转|离了谁都转|照(?:样|旧)(?:转|运行|进行|过|活)|缺了我(?:也|照样)?(?:能|可以|行)|少了我(?:也|照样)?(?:能|可以|行)|没了我(?:也|照样)?(?:能|可以|行)/,
];

// ─── 腿② NIL 自身贡献清零（英文）────────────────────────────────
const NIL_EN = [
  /\birrelevant\b/i,
  /\bmakes?\s+(?:no|zero|little|hardly\s+any)\s+(?:difference|impact|dent|change)\b/i,
  /\bmakes?\s+no\s+difference\s+(?:to|in|for)\b/i,
  /\b(?:pointless|futile|meaningless|fruitless|to\s+no\s+avail|of\s+no\s+consequence)\b/i,
  /\b(?:changes?|change)\s+nothing\b/i,
  /\bnothing\s+(?:I|that\s+I|we)\s+(?:do|does)\b/i,
  /\bcan'?t\s+(?:change|alter|affect|move)\s+(?:anything|the\s+outcome|anything\s+at\s+all)\b/i,
  /\bwon'?t\s+(?:matter|make\s+any\s+difference)\b/i,
  /\b(?:identical|the\s+same)\s+without\s+(?:me|it|my)\b/i,
  /\b(?:no\s+point|what'?s\s+the\s+point|hardly\s+worth)\b/i,
  /\b(?:pointless|futile)\s+(?:to|anyway)\b/i,
  /\b(?:won'?t|wouldn'?t)\s+(?:amount\s+to|add\s+up\s+to)\s+(?:anything|much)\b/i,
  /\b(?:contribution|footprint)\s+is\s+(?:negligible|irrelevant|insignificant|too\s+small)\b/i,
];

// ─── 腿③ 免责推论/结论（连接词与结论形）─────────────────────────
const INFER_ZH = /所以|因此|因而|故而|可见|这说明|这表明|那么|何必|何苦|凭什么|为什么还要|有什么关系|又能怎样|又能如何|谈何|不如|干脆|懒得|随它去|爱咋咋|何必呢|何必要|干嘛|干吗|为何|还(?:有)?什么(?:必要|意义|意义说)|该(?:赢|输|成|败|来|出|发生|出现)(?:的)?还是|照样(?:会|能|行|转|发生)/;
const INFER_EN = /\b(?:so|therefore|thus|hence|since|why\s+bother|what'?s\s+the\s+point|anyway|might\s+as\s+well|no\s+point|why\s+should\s+I|as\s+if|may\s+as\s+well|there'?s\s+no\s+point)\b/i;

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /搭便车|免费搭车|搭便车者|公地悲剧|集体行动困境|集体行动逻辑|囚徒困境|替代者谬误|备份因果|因果贡献|反事实|贡献清零|责任免除/,
  /fallacy|Fallacy|谬误/,
  /经济学|教材|课堂|教科书|讲座|教案|习题|课件|论文|文献|方法论|课程|考点|考题|逻辑学|批判性思维|案例分析|社会心理学|博弈论/,
];
const EXEMPT_META_EN = [
  /\b(?:fallacy|fallacies|someone\s+else\s+will\s+do\s+it|backup\s+causal|free\s+rider|free-?riding|tragedy\s+of\s+the\s+commons|collective\s+action\s+problem|prisoner'?s\s+dilemma|diffusion\s+of\s+responsibility|counterfactual)\b/i,
  /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|course|lesson|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common)\b/i,
];

// ─── 豁免二：正确多因/集体行动陈述（本族要教的判别动作）──────────
// 承认个体贡献、拒绝免除责任——正是本族要教的判别动作。
const EXEMPT_CORRECT_ZH = [
  /是社会基础|集体行动|共同作用|多方(?:面)?共同|每一个(?:人|个)?都是|总量正是|总和正是|由(?:每一|所有)(?:个|人|成员)|不能因此免除|不能因此(?:免责|豁免|免掉)|不(?:能)?因此(?:免除|推卸|卸掉)|责无旁贷|人人有责|义不容辞|责任在个人|个体责任|个人责任|不可推卸|无法推卸|推卸不掉|脱不了干系|都有一份|有一份责任|有一份贡献|积少成多|聚沙成塔|涓滴|千里之堤|溃于蚁穴|千里之行/,
  /多一个不多|少一个不少/,
  // 否定前瞻修正：「不能说少一个不少」等否定形不是本族攻击形
];
const EXEMPT_CORRECT_EN = [
  /\b(?:aggregate|total|sum)\s+(?:emissions?|contributions?|impact|effect)\s+(?:are|is)\s+(?:exactly|precisely|just)\s+(?:the\s+sum|the\s+total|the\s+aggregate)\s+of\s+(?:them|individuals?|us|contributions?)\b/i,
  /\b(?:does\s+not|doesn'?t|do\s+not|don'?t)\s+(?:exempt|excuse|absolve|let\s+you\s+off|relieve)\s+(?:anyone|individuals?|you|me|us)\s+from\b/i,
  /\b(?:individual|personal)\s+(?:responsibility|duty|obligation)\s+(?:remains|stands|still\s+applies|is\s+not\s+waived)\b/i,
  /\b(?:collective|coordinated)\s+action\s+(?:requires|depends\s+on|starts\s+with)\s+(?:individuals?|each\s+of\s+us|everyone)\b/i,
  /\b(?:every|each)\s+(?:individual\s+)?(?:contribution|vote|act|emission)\s+(?:counts|matters|adds\s+up|is\s+part\s+of)\b/i,
  /\b(?:cannot|can'?t|should\s+not|must\s+not)\s+(?:be\s+)?(?:dismissed|excused|negated|offset)\s+(?:just\s+)?because\s+(?:others|someone\s+else)\b/i,
  /\b(?:responsibility|blame|duty)\s+(?:is|lies)\s+with\s+(?:each|every)\s+(?:individual|one\s+of\s+us|person|actor)\b/i,
];

// ─── 豁免三：组织与协作陈述（正常运营语境）──────────────────────
const EXEMPT_ORG_ZH = [
  /分工|协作|配合|补位|替补|轮岗|交接|backup|备份机制|备岗|备班|值班表|排班|AB角|AB 角|互相补位|互为备份/,
];
const EXEMPT_ORG_EN = [
  /\b(?:handover|hand-?off|shift|rotation|rota|on-?call|cover\s+for|covering\s+for|backup\s+(?:engineer|shift|rotation|rota)|AB\s+testing|pairing|mob(?:bing)?)\b/i,
];

// ─── 否定守卫（窗口化：查腿② 命中前的否定标记）──────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|未必是|无从|禁止|切忌|不可以|别|莫/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*)\b/i;

// ─── 推理否定/对冲守卫（后置对冲豁免）──────────────────────────
// 「别人也会做，但不能因此免除个人责任」是正当陈述——先立替代者再
// 拒绝免除责任，正是本族要教的判别动作。
const CONCESSION_ZH = /但是|然而|不过|可是|但|却|尽管|虽然|固然|只是|可惜|遗憾的是|需要说明|要补充|另一方面|但(?:个体|个人|每个|我)|然而(?:责任|个体|个人)/;
const CONCESSION_EN = /\b(?:but|however|yet|although|though|whereas|while|on\s+the\s+other\s+hand|that\s+said|with\s+the\s+caveat|caveat|except|apart\s+from)\b/i;

// 邻近窗：腿① ↔ 腿②（双向；本族句式长，r372 的 60/160 窗会截断
// 「我一个人少开几天车…反正全球几亿辆车在排，我这点排放根本不值一提」）
const WIN_SUB_NIL_ZH = 80;
const WIN_SUB_NIL_EN = 200;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：单正则常量可被注入替换（负例脚本用 /(?!x)x/ 永假式抹掉该腿）
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿①：取所有命中位置（替代者在场标记可能多处出现）
function findSubLeg(text, isZh, R) {
  const list = isZh ? (R.SUB_ZH || SUB_ZH) : (R.SUB_EN || SUB_EN);
  const idxs = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      idxs.push(m.index);
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return idxs.sort((a, b) => a - b);
}

// 腿②：取腿①邻近窗内、未被否定的首个贡献清零位置（双向配对）
function findNilLeg(text, isZh, R, subIdxs) {
  const list = isZh ? (R.NIL_ZH || NIL_ZH) : (R.NIL_EN || NIL_EN);
  const win = isZh ? WIN_SUB_NIL_ZH : WIN_SUB_NIL_EN;
  let best = -1, bestDist = Infinity;
  for (const ai of subIdxs) {
    for (const re of list) {
      const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = reG.exec(text)) !== null) {
        const d = m.index - ai;
        if (Math.abs(d) > win) continue;
        // 后置形要求未被否定对冲；前置形（NIL 在 SUB 前）跳过该检查——
        // 前置否定词多属「不一定/并非」等对冲本身的一部分
        if (d > 0 && negatedBefore(text, m.index, isZh)) continue;
        if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = m.index; }
        if (m.index === reG.lastIndex) reG.lastIndex++;
      }
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkBackupCausalDenial(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免（r213/r214 先例）：反问标记出现时不豁免——「一张选票能
  // 改变什么？」「我一个人少开几天车有什么关系？」正是本族最常见的
  // 包装形态，用问号把断言伪装成提问是操控话术最常用的手法。
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂非|焉能|哪来|哪有什么|哪来的|能改变什么|又能怎样|何必|谁还/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical|why\s+bother|what'?s\s+the\s+point)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 概念/教学转述：讨论这个概念本身不是运用它。元话语豁免要求句中同时
  // 出现教学/学术框架标记或否定标记（r213 收窄先例）。
  const metaZh = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const metaEn = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const META_FRAME_ZH = /教材|课堂|教科书|讲座|教案|习题|课件|悖论|论文|文献|方法论|范式|称为|定义为|概念|所谓|理论|分析中|研究中|课程|教学中|复习|考点|考题|说的是|指的是|书上|课上|逻辑学|批判性思维|谬误|经济学|博弈论|社会心理学/;
  const META_FRAME_EN = /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common|refers\s+to|fallacy|fallacies)\b/i;
  if (anyHit(metaZh, text) || anyHit(metaEn, text)) {
    const hasFrame = META_FRAME_ZH.test(text) || META_FRAME_EN.test(text);
    const hasNeg = NEG_ZH.test(text) || NEG_EN.test(text);
    if (hasFrame || hasNeg) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 正确多因/集体行动陈述：承认个体贡献并拒绝免除责任
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 组织与协作陈述：正常运营语境（分工/补位/轮岗/交接），无「贡献清零」
  // 结论腿时不判。
  if (anyHit(R.EXEMPT_ORG_ZH || EXEMPT_ORG_ZH, text) || anyHit(R.EXEMPT_ORG_EN || EXEMPT_ORG_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 替代者在场 × 腿② 自身贡献清零（邻近窗）
  const subIdxs = findSubLeg(text, isZh, R);
  if (subIdxs.length > 0) {
    const nilIdx = findNilLeg(text, isZh, R, subIdxs);
    if (nilIdx >= 0) {
      // 后置对冲守卫：腿② 命中后若紧跟转折/让步从句，整句判为边界说明
      // 而非备份因果否认（「别人也会做，但不能因此免除个人责任」）。
      const nilTail = text.slice(nilIdx, Math.min(text.length, nilIdx + 30));
      const nilLead = text.slice(Math.max(0, nilIdx - 20), nilIdx);
      const conAfter = isZh ? CONCESSION_ZH.test(nilTail) : CONCESSION_EN.test(nilTail);
      const conBefore = isZh ? CONCESSION_ZH.test(nilLead) : CONCESSION_EN.test(nilLead);
      // 腿③：本族是「有替代者 → 所以我的因不存在 → 责任免除」的推理
      // 动作，句中必须出现推论连接词或结论形把腿①与腿②连起来。裸并列
      // 陈述（「别人也会做，我个人作用有限」是并列观察而非推理动作）
      // 不构成该谬误的话语形状。
      const infer = isZh ? INFER_ZH.test(text) : INFER_EN.test(text);
      if (!conAfter && !conBefore && infer) {
        return {
          hit: true,
          score: 0.55,
          count: 1,
          detail: isZh
            ? '以替代者在场为由把自身行为因果贡献清零，从而免除行动责任(zh)'
            : 'own causal contribution zeroed out by the presence of a substitute agent(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkBackupCausalDenial,
  __internals: () => ({
    SUB_ZH, NIL_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, EXEMPT_ORG_ZH,
    SUB_EN, NIL_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN, EXEMPT_ORG_EN,
  }),
};
