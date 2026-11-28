/**
 * src/curse-of-knowledge.js — 「知识的诅咒/解释坍缩（curse of knowledge）」检测器
 * （provisional 第 294 个判别维度，r479 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r479-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r478：远端已接线 293 维，
 * 另有若干已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排）
 *
 * 立项实证（coordination/agent4/probes/r479-probe-pool.js +
 * r479-probe-pool2.js，v6.8.238 gate() 全量 findings 实测）：四个
 * 候选认知偏差族穿透实测——A 知识的诅咒/解释坍缩 8/12、B 心理
 * 抗拒/逆反 6/8、C 可识别受害者 3/4、D 偏差盲点 4/4；第二轮纯
 * 解释坍缩 E 族 8/10。穿透 = gate.action === 'pass' 零维度承重。
 * 良性基线（含该族边缘良性：教学展开形 0/2 穿透、科普意图形
 * 2/2 穿透）零误伤。src/ 下 grep 无任何维度以「专业共识被当作
 * 受众共享前提/未转译即推进论证」语义承重。
 *
 * 外部来源：GitHub 15 条 + Semantic Scholar 15 条（r479 海外扫描
 * coordination/agent4/scout/*20261125-204916*），arXiv parse-fail
 * 按空返处理。判据为心虫自有纯规则实现（家族定义取自判断与决策
 * 科学/科学传播的标准描述：curse of knowledge / 知识的诅咒——
 * Camerer, Loewenstein & Weber 1989；解释坍缩是该偏差在论证
 * 中的表现形式：专家知道自己所知，无法重建受众的不知状态，
 * 于是把仅在专业共同体内成立的共识当作跨群体共享前提，用
 * 「圈内人都懂」豁免解释义务。逻辑上，「懂的人自然懂」不是
 * 论证——它把结论的可验证性 silently 坍缩到仅同行可读，使
 * 论证失去可被独立检验的资格；正当的专家表述应当把推导、
 * 数据与依据显式给出，或明确标注依赖的前置知识并补足定义）。
 *
 * [r490 扩族] 另辨三个全新共识断言族（真升级②，探针实测 32/32
 * 穿透后补腿）：A 学界裁定/同行认可形（这是专业共识/学界早有
 * 定论/同行评议早就认可/内行看门道/干过这行的都门儿清）、
 * B 组织内部共享形（我们内部都懂/团队里心知肚明/不言而喻/
 * 组内共识已经形成/老员工都门儿清）、C 受众素养足够形（以对方
 * 的水平/读者都是专家/目标受众本就熟悉/科普段落纯属多余/评审
 * 专家了如指掌）、D 英文 consensus-omission（established
 * consensus in the field / common knowledge among peers / the
 * audience is expert enough / the readership is specialist /
 * practitioners take this for granted）。四族均须与坍缩腿共现。
 *
 * 辨别的族：知识的诅咒/解释坍缩——**专业共识断言**（腿①：黑话
 * 术语在场或以术语为宾语 + 认定受众与作者同专业：学过…的人都
 * 懂 / 做这行的都熟悉 / 圈内人不需要 / 行家一看就懂 / 看论文的
 * 人都明白；EN anyone who has taken … knows this / anyone
 * familiar with / as everyone in this field knows / every
 * econometrics student knows / it goes without saying that）
 * 与**解释坍缩**（腿②：跳过展开/不赘述/不用再解释/不需要解释/
 * 我就跳过了/不展开了；EN skip the derivation / no explanation
 * needed / should not need spelling out / leave … unstated）
 * 双腿共现。同窗距离 ZH 90 / EN 200。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：论证的有效
 * 性依赖可检验性——读者能独立复核前提与推理。解释坍缩把这
 * 一资格替换为身份资格（你是不是圈内人），使「结论正确」变
 * 成「结论对某些人显然」。学术写作、技术评审、政策论证中的
 * 「这还需要解释？」「做这行的都熟悉」都是以共识豁免论证的
 * 典型形态。与正当表述有明确界线：承诺展开（我先从定义讲
 * 起/完整推导见附录）、科普转译（我尽量讲得通俗）、术语定
 * 义句（CAP 定理指的是…）、数据引用（Fst=0.21，与地理距离
 * 正相关）——均豁免。
 *
 * 与既有维度的边界（r479 归因）：
 *   · appeal_to_tradition（诉诸传统）管**以惯例/历来论证正当
 *     性**；本族判「以受众身份豁免解释」，腿①是受众同专业认定
 *     而非惯例，无「祖上一直如此」结构。
 *   · unsupported_claim（缺乏支持的断言）管**结论无证据**；本族
 *     的坍缩形常有大量证据但拒绝展开——问题在可检验性而非证据
 *     有无。
 *   · confidence（自信度）管**断言强度超标**；本族判解释义务的
 *     豁免，不依赖置信措辞强度。
 *   · gate_block / premise_check 的泛化族不承重：r479 探针实测
 *     本族攻击穿透时零维度 findings。
 *   · jargon 族（如有）管**术语堆砌本身**；本族要求坍缩腿——
 *     只甩术语不构成解释坍缩。
 *
 * 判据（双腿链共现，缺一不判）：
 *   ① 腿① CONSENSUS 专业共识断言——受众同专业认定（学过…的
 *      人都懂/做这行的都熟悉/圈内人不需要/行家一看就懂/你们
 *      团队都是搞这个的；EN anyone who has taken … knows this /
 *      anyone familiar with / as everyone in this field knows /
 *      every econometrics student knows / it goes without saying
 *      that / since your team works on this）；
 *   ② 腿② COLLAPSE 解释坍缩——跳过展开（不用展开/不赘述/不用
 *      再解释/不需要解释/我就跳过了/不展开了/这还需要解释；
 *      EN skip the derivation / no explanation needed / should
 *      not need spelling out / leave … unstated）；
 *   ③ 腿①×腿②同窗共现（ZH 90 / EN 200），双腿均查否定前缀
 *      （并不是说…就懂/不能因为大家都熟悉就跳过/not true that
 *      everyone already knows）；
 *   ④ 豁免：展开承诺（我从定义开始讲/完整推导见附录/walk
 *      through the derivation step by step）、科普转译（尽量用
 *     通俗的话讲清楚）、术语定义句（CAP 定理指的是/Fst 值衡量/
 *      exclusion means）、数据引用（Fst=0.21/see eq. 12）。
 *
 * 为什么取 VERIFY 级：单句可能只是行文省略（篇幅所限的确会
 * 跳推导），也可能是面向同行的内部技术备忘。verify 的语义是
 * 「这段话以受众身份替代了论证本身，先核实推导/数据/依据是否
 * 显式给出，再决定是否采信其结论」。
 */
'use strict';

// ─── 腿① 专业共识断言（中文）──────────────────────────────────
const CONSENSUS_ZH = [
  // 受众同专业认定 + 术语在场（术语作为宾语或主语出现）
  /(?:学过|读过|修过|接触过|做过|搞过|研究过)[^。，！？；\n]{0,12}(?:的)?(?:人)?(?:都)?(?:懂|知道|明白|清楚|熟悉|了解)/, // 学过随机过程的人都懂/做过这行的都清楚
  /(?:做这行|干这行|吃这碗饭|圈内|业内|行内|同行|同行的)(?:的)?(?:人)?(?:都)?(?:熟悉|清楚|明白|懂|了解|知道)/,     // 做这行的都熟悉
  /(?:看|读)(?:论文|文献|报告|paper)s?(?:的)?(?:人)?(?:都)?(?:明白|懂|清楚|知道)/,                    // 看论文的人都明白
  /(?:行家|内行|懂行|老手|资深)(?:的)?(?:人)?(?:一?看|一听|一想)(?:就)?(?:懂|明白|清楚|知道)/,         // 行家一看就懂
  /(?:圈内|业内|行内)(?:人)?(?:不?需要|无须|无需|不必)(?:我)?(?:再)?(?:解释|讲|说明|赘述)/,           // 圈内人不需要我再解释
  /(?:你们|咱|我们)(?:团队|公司|组里|部门)(?:的)?(?:人)?(?:都|全)(?:是|属于)?(?:搞|做|研究|专攻)[^。，！？；\n]{0,10}(?:的|人)/, // 你们团队都是搞这个的
  /(?:读者|听众|大家|诸位|各位|诸位|客户)(?:都)?(?:是)?(?:搞|做|研究|专攻|深耕|从事)[^。，！？；\n]{0,10}(?:的|人)/, // 既然读者都是做分布式系统的
  /(?:常识|常识性|基础性|基础)(?:问题|知识|概念)/,                                                    // 常识性问题（含「圈内」修饰由下一行覆盖）
  // [r479 补形] 「只要/只需 + 术语在场 + 就知道」式把指标当自明前提
  /(?:只要|只需|但凡|只需看)(?:看|看的是|读|理解)[^。，！？；\n]{0,14}(?:就)?(?:知道|明白|清楚|懂)/,      // 只要看 Fst 值就知道
  // [r479 补形] 「你肯定一听就明白」受众被预设为同专业
  /(?:你|您)(?:肯定|一定|自然|想必|当然)(?:一?听|一?看|一?想)(?:就)?(?:明白|懂|清楚)/,                // 你肯定一听就明白
  // [r480 补形] 无异议断言族：「修过这门课的人都不会有疑问」——受众同专业
  // 认定（学过/修过/上过 × 该门课）与「无疑问」自明断言共现，是共识腿的
  // 强断言形；旧表只收「懂/知道/明白」收不住该形（F1 实测穿透）。
  /(?:学过|读过|修过|接触过|做过|搞过|研究过|上过|听过)[^。，！？；\n]{0,12}(?:的)?(?:人)?(?:都)?(?:不会|不会有|不会有任何)(?:疑问|问题|异议|困惑|疑惑)/, // 修过这门课的人都不会有疑问
  // 元语言共识断言（无需显式术语宾语）
  /(?:这|那)(?:是|属于|就是)(?:常识|常识性|基础|基础性)(?:问题|知识|概念)/,                          // 这是常识性问题
  /(?:大家|诸位|各位)(?:都)?(?:是)?(?:搞|做|研究|专攻|深耕)[^。，！？；\n]{0,10}(?:的|人)/,           // 大家都是搞这个的
];

// ─── 腿② 解释坍缩（中文）──────────────────────────────────────
const COLLAPSE_ZH = [
  /(?:不用|无须|无需|不必|不需要|没必要|犯不着)(?:再)?(?:我)?(?:解释|讲|说明|赘述|展开|细说|多说)/, // 不用展开/不需要我再解释一遍
  /(?:不|无|未)(?:赘述|展开|细说|细讲|详述|详讲)/,                                 // 不赘述/未展开
  /(?:我)?(?:就|直接|暂且)(?:跳过|略过|省去|省略)/,                               // 我就跳过了/直接跳过
  /(?:这|那)(?:还|又)?(?:需要|用得着|值得)(?:解释|讲|说明)(?:吗|么)/,             // 这还需要解释？
  /(?:一?听|一?看)(?:就)?(?:明白|懂|清楚)/,                                     // 一听就明白
  /(?:将就|凑合)(?:看|听|读)/,                                                 // 大家将就看
  /(?:不?展开|不?细讲|不?细说|不?详述)(?:讲|说|了|吧|呀|啊)?/,                    // 不展开了
  /(?:我)?(?:不|未|没)(?:写|讲|说|列|算)(?:推导|过程|细节|算式|步骤)/,             // 推导还要我写？（见下）
  /(?:还|又)(?:要|用得着)(?:我)?(?:写|讲|说)/,                                  // 还要我写？
  /(?:不?赘|不多)(?:述|讲|说|写)/,                                             // 不多述
  // [r479 补形] 「不需要再展开」式带「再」的坍缩（兼容「不需要」的「要」）
  /(?:不|无|未)(?:需|必要)?(?:要)?(?:再)?(?:展开|细说|细讲|详述|解释|说明)/,             // 不需要再展开/无须再说明
  // [r479 补形] 系动词自明形（「这很直白」「这很明显」）
  /(?:这|那|此)(?:很|非常|特别|相当|着实|真是)?(?:直白|明显|显然|清楚|明了|自明)/, // 这很直白/这很显然
  // [r479 补形] 「不需要我再解释一遍」式（我 + 再 + 遍）
  /(?:不|无|未)(?:需|必要)?(?:要)?(?:我)?(?:再)?(?:解释|讲|说明|赘述)(?:一|两|几)?(?:遍|次)?/, // 不需要我再解释一遍/无须再讲一次
  // [r479 补形] 「这还需要解释？」式反问坍缩（全角/半角问号收尾）
  /(?:这|那)(?:还|又)?(?:需要|用得着|值得|需要我)(?:解释|讲|说明)(?:吗|么|不|？|\?)/,   // 这还需要解释？
  // [r480 补形] 「一听就明白」受众被预设当场自明
  /(?:一?听|一?看)(?:就)?(?:明白|懂|清楚|知道)/,                                           // 一听就明白（已在上方，此处兼容带空档形）
  // [r480 补形] 无异议断言族：「修过这门课的人都不会有疑问」——受众同专业
  // 认定（学过/修过/上过 × 该门课）与「无疑问」自明断言共现，是共识腿的
  // 强断言形；旧表只收「懂/知道/明白」收不住该形（F1 实测穿透）。
  /(?:学过|读过|修过|接触过|做过|搞过|研究过|上过|听过)[^。，！？；\n]{0,12}(?:的)?(?:人)?(?:都)?(?:不会|不会有|不会有任何)(?:疑问|问题|异议|困惑|疑惑)/,
  // [r480 补形] 无异议断言的动词前置形（「上过这门课的人都不会有疑问」中
  // 「上过」起头）与既有的「懂」类同权；「修过随机过程的人都明白」式
  // （明白收尾）由 CONSENSUS_ZH[0] 覆盖，此处不重复收录。
  // [r480 补形] 反诘式贬损性坍缩：「我要是再解释就是看不起读者」——
  // 把展开义务反写成对受众的贬损（解释=侮辱），属坍缩的变体形态。
  /(?:再)?(?:解释|讲|说明|展开)(?:就)?(?:是|等于)(?:看不起|侮辱|贬低|小看|浪费时间)/,       // 再解释就是看不起读者
  // [r480 补形] 「论证」入坍缩词表：「这里无需再论证一遍」——论证义务
  // 与解释义务同构（均可检验性），原词表只收解释/讲/说明/赘述/展开。
  /(?:不|无|未)(?:需|必要)?(?:要)?(?:再)?(?:论证|论述|阐明)/,                                // 无需再论证一遍
  // [r480 补形] 省略动词收尾形：「细节略过不谈」——「略过」已在坍缩词表，
  // 但「不谈」收尾时句子以省略动作结束，需显式兼容。
  /(?:略过|跳过|省去|省略)(?:不|未|没)?(?:谈|讲|说|提)/,                                     // 细节略过不谈
];


// ─── [r491] 腿② 全新省略坍缩族（真升级②，takeover r490 WIP）──────
// r490 实测缺口（/tmp/hf-r490-probe-cok.js + 轮测 miss 诊断）：存量
// COLLAPSE_ZH 只收「不用展开/不赘述/我就跳过了/这还需要解释」类**显式
// 坍缩动词**，而四新共识族（A 学界裁定/B 内部共享/C 受众素养/D EN）
// 实际语料的坍缩形是**内容处置/冗余定性**——把背景章节整段砍掉、
// 判为纯属多余、一个字都不写、全省铺垫，EN 对应 skip the background
// entirely / leaves it unstated / adds nothing / is omitted /
// I removed the derivation / left the recap out / would be redundant。
// 该类形把「不展开」写成对内容本身的处置与定性，语义上仍是解释义务
// 的豁免（同族坍缩），须与共识腿共现才判。
const COLLAPSE_ZH2 = [
  // 科普/铺垫类名词入坍缩宾语（不需要我再科普一遍/不用铺垫）
  /(?:不用|不需要|无须|无需|不必|没必要|犯不着)(?:我)?(?:再)?(?:科普|铺垫|介绍|入门|背景|展开|讲)/, // 不需要我再科普一遍
  // 内容处置动词：砍掉/删掉/删除/去掉/拿掉 + 宾语（基础章节/段落/推导）
  /(?:砍掉|砍了|删掉|删了|删除|去掉|拿掉|抹掉|剔掉|切除)(?:了)?(?:基础|入门|背景|铺垫|介绍|推导|过程|细节|章节|段落|部分|内容|理论|概念)/, // 培训材料砍掉了基础章节
  // 整段/全部/通通 + 删除/略过（省略范围断言）
  /(?:整段|整段地|全部|统统|通通|全都|一概)(?:删除|删掉|略过|省略|去掉|砍掉|舍弃|抹去)/, // 背景部分全部删除
  // [r492 补形] r491 矩阵 miss 实证：「相关背景我全部删除，不再重复」——
  // 上条要求范围副词与删除动词紧邻，真实语料常插入主语（我全部删除/
  // 已整段删除）。范围副词 + 主语 + 删除动词形。
  /(?:整段|整段地|全部|统统|通通|全都|一概|完全)(?:都|也|就)?(?:我|我们|被|已|已经|将|要|给)?(?:删除|删掉|略过|省略|去掉|砍掉|舍弃|抹去|砍去)/, // 相关背景我全部删除
  // 免了/省掉/省去 + 铺垫/背景/介绍（口语豁免）
  /(?:就)?(?:免了|免谈|省掉|省去|去掉|略掉)(?:铺垫|背景|介绍|说明|解释|展开|入门)/, // 这块背景交代就免了/我省掉了铺垫
  // [r491 补形] 「我省掉了铺垫」——动词 + 了 + 宾语（省掉了/免去了），
  // 上条是「省掉铺垫」无「了」插入形。
  /(?:省掉|省去|免去|略去|省略|去掉|删掉|砍掉)(?:了)?(?:铺垫|背景|介绍|说明|解释|入门|推导|过程)/, // 我省掉了铺垫
  // [r491 补形] 宾语前置形：「背景交代就免了/铺垫就此省掉」——上条是
  // 免了 + 宾语后置，真实语料常把宾语提到句首，免了收尾。
  /(?:背景|铺垫|介绍|说明|解释|入门|推导|过程)(?:交代|说明|阐述|交代)?(?:就)?(?:免了|免谈|省掉|省去|略掉|略去|省略)/, // 背景交代就免了
  /(?:背景|铺垫|介绍)(?:就此|就此|就|全)?(?:免了|省掉|省略|略过)/, // 背景就此免了
  // [r493 补形] r493 收轮验证 miss 实证：「内行看门道，基础推导删掉。」与
  // 「听众的素养足够高，普及性介绍砍掉。」——存量三条分别收「免了+宾语」
  // 「动词+了+宾语」「宾语前置+免了收尾」，但没有一条收「宾语前置 + 内容
  // 处置动词收尾」（基础推导删掉/背景介绍砍掉/入门章节去掉/普及性介绍砍掉）。
  // 真实语料常把宾语提前后直接以删除动词结句。
  /(?:基础|入门|背景|铺垫|介绍|说明|推导|过程|细节|章节|段落|部分|内容|理论|概念|普及性|科普性|常识性)(?:的)?(?:介绍|说明|推导|背景|铺垫|章节|段落|部分|内容|常识)?(?:都|也|就|全|统统)?(?:砍掉|砍了|删掉|删了|删除|去掉|拿掉|抹掉|剔掉|切除|免掉)/, // 基础推导删掉/普及性介绍砍掉
  // [r493 补形] 同族「删除动词 + 宾语」的被动/处置后置形补收：
  // 「推导过程已删除」「相关背景我全部删除」的「我/已」主语插入形已由上一条
  // 覆盖，此处补「…部分就删除掉」的口语收尾。
  // [r491 补形] r490 轮测 A3 miss 实证：「内部沟通过程高度默契，很多
  // 前提默认大家都知道」——坍缩以「默认受众已知」表述（缺省值设定），
  // 不含任何删节动词。默认 + 知道/明白/清楚 与共识腿同构。
  /(?:默认|默认为|想当然|想当然地|理所当然)(?:地)?(?:认为|以为|觉得|当)?(?:对方|受众|听众|读者|用户|客户|大家|所有人|每个人|诸位|各位)?(?:都)?(?:知道|明白|清楚|熟悉|了解|懂|掌握)/, // 默认大家都知道
  /(?:不再|再不|从不|绝不)(?:重复|复述|赘述|累述|说明|解释|展开)/, // 方案说明里不再重复理由
  // [r491 补形] 「写出来反而见外/说出来就见外」——坍缩以社交规范表述：
  // 把「显式写出/说出」本身判为不当（见外/生分/多此一举）。
  /(?:写|讲|说)(?:出来|出来)?(?:反而|反倒|倒)?(?:显得)?(?:见外|生分|生疏|别扭|尴尬|不妥|不合适)/, // 写出来反而见外
  // 不再重复/不复述/不再赘述（重复义务豁免）
  /(?:不再|再不|从不|绝不)(?:重复|复述|赘述|累述|说明|解释|展开)/, // 方案说明里不再重复理由
  // 极简/极简短/一笔带过/不着一字（篇幅处置定性）
  /(?:写得|讲得|说得|处理得|整理得)?(?:极简|极简短|极简练|一笔带过|一掠而过|不着一字|只字不提)/, // 对外说明书写得极简
  // 冗余定性：纯属多余/毫无必要/多此一举/浪费时间/画蛇添足
  /(?:纯属|完全|简直|实在)?(?:多余|毫无必要|多此一举|浪费时间|白费功夫|画蛇添足|徒劳无益)/, // 科普段落纯属多余
  // 全省/全省略/全省掉（范围全免）
  /(?:全省|全省略|全省掉|全省去|尽省|全免)/, // 背景回顾全省
  // 一个字都不写/一字不提/只字不写（零展开断言）
  /(?:一个字|一个字儿|一字|只字|半句)?(?:都)?(?:不|没)(?:写|讲|说|提|提|解释)/, // 基础概念我一个字都不写
  // 侮辱智商/看不起受众（r480 已收「再解释就是侮辱」；此处收
  // 「讲一遍就是侮辱智商」的完整宾语形，兼容「我要是再讲一遍」）
  /(?:再)?(?:讲|说|解释|展开|科普)(?:一遍|一次)?(?:就)?(?:是)?(?:侮辱|侮辱智商|看不起|贬低)/, // 再讲一遍就是侮辱智商
  // [r491 补形] r490 轮测 A1 miss 实证：「我解释起来反而显得啰嗦」——
  // 坍缩以「解释行为本身被判为冗余」表述（反而显得/纯属多余形），
  // 不含任何删节动词，存量坍缩词表整体漏该形。
  /(?:解释|讲|说|展开|说明)(?:起来|下来)?(?:反而|倒显得|反而显得|反倒|反而)?(?:显得)?(?:啰嗦|冗长|多余|累赘|费劲|吃力|没必要)/, // 解释起来反而显得啰嗦
  /(?:再)?(?:解释|讲|说明|展开)(?:就)?(?:显得|反而|倒)(?:啰嗦|冗长|多余|累赘)/, // 再解释就显得多余
];

// ─── [r491] 腿② EN 全新省略坍缩族（真升级② D 族配套）────────────
// 存量 COLLAPSE_EN 只收 skip the derivation / no explanation needed
// / leave … unstated 等显式形；r490 EN 探针穿透形为：
// skip the background entirely / the memo leaves it unstated /
// the introductory chapter adds nothing / the recap is omitted /
// I removed the derivation / I left the recap out / would be
// redundant——同样把省略写成内容处置与冗余定性。
const COLLAPSE_EN2 = [
  // skip/omit/drop + 泛内容宾语（background/primer/recap/intro/overview）
  /\b(?:skip|skips|skipped|skipping|omit|omits|omitted|omitting|drop|drops|dropped|dropping|leave\s+out|left\s+out|cut|cuts)\s+(?:the\s+|these\s+|those\s+|all\s+|any\s+)?(?:background|primer|intro|introduction|recap|overview|preliminaries|context|backstory)\b/i, // skip the background entirely
  // 内容被动省略：the recap is omitted / the derivation was left out
  /\b(?:background|primer|intro|introduction|recap|overview|preliminaries|context|derivation|proof|details?|explanation|walkthrough)\s+(?:is|are|was|were|been|be)\s+(?:omitted|left\s+out|withheld|excluded|dropped|removed|stripped|not\s+(?:given|shown|stated|included))\b/i, // the recap is omitted
  // 主动处置：I removed/omitted/stripped the derivation
  /\b(?:I|we)\s+(?:removed|omitted|stripped|dropped|deleted|cut)\s+(?:the\s+|all\s+|any\s+)?(?:background|primer|intro|recap|derivation|proof|details?|explanation|overview|preliminaries)\b/i, // I removed the derivation
  // 冗余定性：adds nothing / would be redundant / is unnecessary
  /\b(?:adds?|added|adding|contributes?|provides?)\s+(?:nothing|no\s+(?:value|new\s+information|insight))\b/i, // the introductory chapter adds nothing
  /\b(?:would|will|could)\s+(?:be|only\s+be|just\s+be)\s+(?:redundant|unnecessary|superfluous|pointless|a\s+waste)\b/i, // would be redundant
  /\b(?:is|are)\s+(?:redundant|unnecessary|superfluous|pointless|a\s+waste\s+of\s+(?:time|space|paper))\b/i, // the primer is unnecessary
  // leave … unstated / unsaid（r480 已收 unstated；补 unsaid/unwritten/unspoken）
  /\bleave[s]?\s+(?:the\s+|these\s+|those\s+|it\s+)?[^.]{0,30}\s+(?:unstated|unsaid|unwritten|unspoken|unexplained)\b/i, // leaves it unsaid
  // [r491 补形] r490 轮测 A4 miss 实证：「I left the recap out」——
  // 动词后置形：left <宾语> out，存量只有 leave <宾语> unstated（形容词收尾），
  // 而真实语料是 left out 分置。补 left/skip <宾语> out 形。
  /\b(?:left|leave|leaves|leaving|left)\s+(?:the\s+|these\s+|those\s+|all\s+|any\s+)?(?:background|primer|intro|introduction|recap|overview|preliminaries|context|derivation|proof|details?|explanation|walkthrough)\s+(?:out|off)\b/i, // I left the recap out
  /\b(?:I|we)\s+(?:left|leave)\s+(?:it|this|that)\s+out\b/i, // I left it out
  // [r491 补形] no elaboration is required —— r490 轮测 A2 miss：
  // 存量收 no further details are needed / no need to spell out，
  // 但 no elaboration is required（elaboration 入宾语 + required 系动词）未收。
  /\bno\s+(?:elaboration|explanation|justification|detail|details|derivation|discussion)\s+(?:is|are)\s+(?:required|needed|necessary)\b/i, // no elaboration is required
  /\b(?:requires?|needs?)\s+no\s+(?:further\s+)?(?:elaboration|explanation|justification|derivation|discussion)\b/i, // requires no elaboration
];

// [r492 补形] r491 变体矩阵 miss 实证：「the background is left
// unstated」——COLLAPSE_EN2 的 leave/unstated 形全部是主动语态（leave X
// unstated / left the recap out），被动形（X is left unstated / was
// omitted）整体漏判。独立常量供负例注入（D3 摘除证明承重）。
const COLLAPSE_EN3 = [
  /\b(?:background|primer|intro|introduction|recap|overview|preliminaries|context|derivation|proof|details?|explanation|walkthrough)\s+(?:is|are|was|were)\s+(?:left\s+)?(?:unstated|unsaid|unexplained|omitted|unaddressed|uncovered|unmentioned)\b/i, // the background is left unstated
  /\b(?:has|have|had)\s+been\s+(?:left\s+)?(?:unstated|unsaid|out|omitted|removed|deleted)\b/i, // has been left out / has been omitted
  /\b(?:was|were)\s+(?:omitted|removed|deleted|dropped|cut|excised)\s+(?:as|because|since)\s+(?:redundant|unnecessary|obvious|familiar)\b/i, // was omitted as redundant
];

// r490 探针实测（/tmp/hf-r490-probe-cok.js，v6.8.244 模块层）：四组
// 各 8 条独立样本攻击 32/32 穿透（hit 全 false）、良性 0/10 误伤。
// 存量 CONSENSUS_ZH（r479/r480 六轮补形）只覆盖「受众同专业认定 +
// 术语在场」形（学过…的人都懂/做这行的都熟悉/圈内人不需要），
// 以下三族以**裁定的来源**（学界/同行/组织内部/受众素养）替代
// 「受众身份 + 术语」结构，整族穿透：
//   A 专业共识断言族：学界早有定论/同行评议认可/内行看门道/
//     干过这行的都门儿清——共识以学界裁定或同行认可断言。
const CONSENSUS_ZH3 = [
  /(?:这|那)(?:是|属于|就是|可谓)(?:专业|学界|行业|学术)(?:共识|定论|公论)/,           // 这是专业共识/这是学界定论
  /(?:在)?(?:学界|学术界|理论界|同行)(?:早|已|就)?(?:已|早有|早有|已有)(?:有)?(?:定论|公论|共识)/, // 学界早有定论
  /(?:同行|业内)(?:评议|评审|审查)(?:早就|已|早|均|都)?(?:认可|通过|接受|肯定)/,        // 同行评议早就认可
  /(?:内行|行家|懂行)(?:看|一?看)(?:门道|就懂|就明白)/,                              // 内行看门道
  /(?:干过|做过|搞过|混过)(?:这行|这一行|这行当|这圈子)(?:的)?(?:人)?(?:都)?(?:门儿清|门清|清楚|明白|懂)/, // 干过这行的都门儿清
  /(?:结论|观点|说法|机制|原理)(?:在)?(?:学界|学术界|理论界)(?:早|已|早已|早就)?(?:有)?(?:定论|共识|公论)/, // 结论在学界早有定论
  // [r492 补形] r491 矩阵 miss 实证：「在理论界这个问题早有定论」——上两条
  // 要求领域词与「早有定论」紧邻，真实语料常插入话题短语（这个问题/
  // 这一现象/该机制）。领域词 + 话题插入 + 早有定论形。
  /(?:在)?(?:学界|学术界|理论界|业内|同行)(?:这|那|该|此)?(?:个|一项|一类|一件)?(?:问题|现象|议题|话题|机制|原理|结论|观点|说法)?(?:早|已|早已|早就|早就)(?:已|就)?(?:有)?(?:定论|共识|公论)/, // 在理论界这个问题早有定论
];
//   B 内部共识省略族：内部都懂/心知肚明/不言而喻/省掉铺垫——
//     共识以组织内部共享状态断言（腿②是省略/免去/不重复）。
const CONSENSUS_ZH4 = [
  /(?:我们|咱们|自己|内部)(?:内部|团队|组里|部门|公司|这边|的人|人)?(?:都|全|人人)?(?:懂|清楚|明白|知道|熟悉|心知肚明|门儿清)/, // 我们内部都懂/团队里都清楚
  /(?:团队|组里|部门|公司|内部)(?:里|内|中)?(?:的)?(?:人)?(?:都|人人|彼此)?(?:心知肚明|门儿清|清楚|明白|懂|有默契)/, // 团队里大家都心知肚明
  // [r491 补形] r490 轮测 miss 实证：上条要求「都/人人/彼此」紧贴心知肚明，
  // 而真实语料是「团队里大家心知肚明」——「大家」不在量词枚举里。
  /(?:团队|组里|部门|公司|内部|班子里)(?:里|内|中)?(?:大家|大伙|各位|所有人|每个人)?(?:心知肚明|心照不宣|门儿清|心领神会)/, // 团队里大家心知肚明
  // [r491 补形] 「团队里大家都心知肚明」——「都」后置于集合词（大家都/
  // 大伙都/人人都），上两条只收「都」紧贴形容词或省略形。
  /(?:团队|组里|部门|公司|内部|班子里)(?:里|内|中)?(?:大家|大伙|人人|每个人|所有人)(?:都|全|也)?(?:心知肚明|心照不宣|门儿清|清楚|明白|懂|有默契)/, // 团队里大家都心知肚明
  // [r491 补形] 「内部沟通过程高度默契」——默契作表语形容词，无「都/形成」结构
  /(?:沟通|协作|合作|交流|配合)(?:过程|方式|机制|状态|上)?(?:高度|非常|十分|相当|特别)?(?:默契|顺畅|无需说明|不用多说)/, // 内部沟通过程高度默契
  // [r491 补形] 省略主语形：「这层意思不言而喻」/「个中缘由不言而喻」——
  // 存量条要求 (?:这层)?(?:意思|道理|事理)(?:在)?(?:我们|咱|内部|团队)(?:是)?，
  // 真实语料常省掉「在我们」直接以「不言而喻」收尾。
  /(?:不言而喻|不言自明|心照不宣|显而易见|自不待言|无庸赘述|毋庸赘述)/, // 不言而喻（主语省略形）
  /(?:内部|组内|部门内|团队)(?:的)?(?:共识|默契|默契度)(?:已经|早已|早就|已)?(?:形成|达成|存在)/, // 组内共识已经形成
  /(?:老员工|老人|资深同事|老同事)(?:都|人人)?(?:门儿清|门清|清楚|明白|熟悉|懂)/, // 老员工都门儿清
  /(?:部门|组内|团队|公司)(?:内|里)?(?:人人|每个人|大伙)(?:都)?(?:熟悉|清楚|明白|懂)(?:这个|这套|该)/, // 部门内人人都熟悉这个口径
];
//   C 听众无需知悉族：以对方的水平/读者都是专家/科普段落纯属多余/
//     入门介绍是浪费时间——共识以受众素养足够断言（受众形在场）。
const CONSENSUS_ZH5 = [
  /(?:以|按|凭)(?:对方|受众|听众|读者|用户|客户)(?:的)?(?:水平|素养|水准|程度|资质|身份)/, // 以对方的水平
  // [r491 补形] r490 轮测 A5 miss 实证：「听众的素养足够高，入门介绍是
  // 浪费时间」——受众素养以「素养/水平 + 足够高/绰绰有余」表语断言，
  // 存量条只收「以对方的水平」状语形，不含表语形。
  /(?:受众|听众|读者|用户|客户|评审|专家|同行)(?:的)?(?:素养|水平|水准|程度|储备|基础)(?:足够|绰绰有余|完全|早已|早就)?(?:高|扎实|深厚|足够|到位)/, // 听众的素养足够高
  /(?:读者|听众|受众|用户|客户|评审|专家|同行)(?:都)?(?:是)?(?:专家|内行|行家|专业|资深)/, // 读者都是专家
  /(?:目标|这些|该|此)(?:受众|听众|读者|用户|客户)(?:本就|本来|本就|本身)?(?:熟悉|了解|精通|懂)/, // 目标受众本就熟悉
  /(?:他们|受众|读者)(?:圈子|圈层|领域)(?:的)?(?:常识|通识|共识)/,                    // 他们圈子的常识
  /(?:评审|审核|评议)(?:专家|人|组|委)(?:对)?(?:此|这套|该|这种方法)(?:了如指掌|非常熟悉|烂熟)/, // 评审专家对这套方法了如指掌
  /(?:专业|资深|目标)(?:读者|听众|受众)(?:不需要|用不着|无须|无需)(?:铺垫|背景|入门|介绍)/, // 专业读者不需要铺垫
  // [r491 补形] r490 轮测 A5 miss 实证：「给同行评审看的，行业常识部分
  // 全部删除」——受众身份以「给…看的/面向…」状语前置，存量条全是
  // 「受众 + 是专家」的主语断言形，不含前置状语形。
  /(?:给|面向|针对|对)(?:同行|评审|专家|内行|专业人士|资深|专业)(?:评审|审核|专家|读者|受众|听众|用户|客户)?(?:看的|看|阅读|呈现|展示|展示的)?/, // 给同行评审看的
  /(?:同行|评审|专家|内行)(?:评审|审核|专家)?(?:看的|阅读|审阅)(?:东西|材料|文档|报告|稿子|版本)?/, // 同行评审看的材料
];

// [r492 补形] r491 变体矩阵 miss 实证：「心知肚明，一个字都不写。」——
// 共识腿存量条全部要求集合词前缀（团队里/我们/彼此…），真实语料常直接
// 以共识形容词开头（心知肚明/心照不宣/不言而喻/彼此默契）。裸名词形。
// 注意：这组只描述「共识存在」，仍须与坍缩腿同窗共现才判（双腿 AND）。
const CONSENSUS_ZH6 = [
  /^(?:心知肚明|心照不宣|不言而喻|心领神会)/, // 句首共识断言（裸形）
  /(?:^|[。，；！？\s])(?:心知肚明|心照不宣|不言而喻|心领神会)(?=[，。；！？、]|$)/, // 句中/句尾共识断言
  /(?:^|[。，；！？\s])(?:彼此|双方|大家|彼此之间)?(?:默契|有默契|心照不宣)/, // 彼此默契（裸形）
];

// ─── 腿①/腿② 英文 ─────────────────────────────────────────────
const CONSENSUS_EN = [
  /\banyone\s+(?:who|that)\s+(?:has\s+)?(?:taken|studied|read|worked\s+(?:in|on)|done)\b[^.]{0,60}\bknows?\b/i, // anyone who has taken stochastic processes knows this
  /\banyone\s+familiar\s+with\b/i,                                        // anyone familiar with OLS
  /\bas\s+everyone\s+in\s+this\s+field\s+knows\b/i,                        // as everyone in this field knows
  /\bevery\s+\w+\s+student\s+knows\b/i,                                   // every econometrics student knows
  /\bit\s+goes\s+without\s+saying\s+that\b/i,                              // it goes without saying that
  /\bsince\s+(?:your|the)\s+team\s+(?:works?\s+on|does)\b/i,               // since your team works on this
  /\beveryone\s+in\s+the\s+field\s+knows\b/i,                             // everyone in the field knows
  /\bneedless\s+to\s+say\b/i,                                             // Needless to say, …
  /\bthis\s+is\s+(?:textbook|basic|standard)\s+stuff\s+for\b/i,           // textbook stuff for anyone in the field
  /\bas\s+(?:every\s+)?(?:economist|physicist|engineer|statistician|researcher)s?\s+knows?\b/i, // as every economist knows
  // [r479 修订] 句首元共识副词形：Obviously / Clearly / Plainly / Evidently
  // 把命题宣布为「对受众不言自明」——与 Needless to say 同族（A 段实测
  // 'Obviously the posterior is dragged by the prior' 缺腿①未命中）。
  /^(?:obviously|clearly|plainly|evidently|undeniably|unquestionably)\b/i,       // Obviously, …
  /\b(?:obviously|clearly|plainly|evidently)\s+(?:the|this|that|it)\b/i,        // Obviously the posterior …
  /\bgoes\s+without\s+(?:saying|explanation|elaboration)\b/i,             // goes without saying（元共识断言）
  // [r480 补形] 受众同专业认定的 practitioners/insiders/experts 形：
  // 原表只收 anyone who has taken / anyone familiar with 两类，
  // 「This is obvious to practitioners」整句无腿①。
  /\b(?:obvious|apparent|clear|evident|self[- ]?evident)\s+to\s+(?:practitioners?|insiders?|experts?|professionals?|specialists?|those\s+who\s+(?:work|study|specialise|specialize))\b/i, // obvious to practitioners
  // [r480 补形] 元共识断言 in this circle / in our field / as is well known：
  // 「As is well known in this circle」把命题宣布为圈内公共知识。
  /\bas\s+(?:is\s+)?well\s+known\s+(?:in|to|among)\b/i,                       // as is well known in this circle
  /\bin\s+(?:this|our|the)\s+(?:circle|field|community|discipline|domain)\b/i, // in this circle（受众同专业认定）
  // [r480 补形] 受众同专业认定的复数主语形：「People familiar with the IV
  // exclusion restriction」——旧表只收 anyone familiar with / everyone in
  // the field，people/those 主语整句无腿①（F1 实测穿透）。
  /\b(?:people|those)\s+(?:who\s+are\s+|that\s+are\s+|who\s+|that\s+)?familiar\s+with\b/i, // people familiar with / those familiar with
  /\b(?:people|those)\s+(?:who\s+)?(?:have\s+)?(?:taken|studied|read|worked\s+(?:in|on))\b/i, // people who have taken stochastic processes
];
const COLLAPSE_EN = [
  /\bno\s+explanation\s+(?:is\s+)?needed\b/i,                             // no explanation needed
  /\bskip(?:ping|ped)?\s+(?:the\s+)?(?:derivation|proof|details?|explanation|walkthrough|argument)\b/i, // skip the derivation
  /\bshould\s+not\s+need\s+(?:to\s+be\s+)?(?:spell(?:ed|ing)?\s+out|explain(?:ed|ing)?|stated|said)\b/i, // should not need spelling out
  /\bleave\s+(?:the\s+|these\s+|those\s+)?[^.]{0,30}\s+unstated\b/i,      // leave the implementation details unstated
  /\bwithout\s+(?:further\s+|any\s+)?(?:explanation|elaboration|justification|derivation)\b/i,        // without further explanation
  /\b(?:I|we)\s+will\s+(?:not|n[o']t)\s+(?:derive|explain|spell\s+out|elaborate)\b/i,                 // I will not derive it here
  /\bthis\s+(?:should\s+not|needn'?t|does\s+not)\s+(?:need\s+to\s+be\s+)?explained\b/i,               // this should not need to be explained
  /\bgoes\s+without\s+(?:saying|explanation|elaboration)\b/i,             // goes without explanation
  /\bno\s+need\s+to\s+(?:spell|explain|elaborate|derive)\b/i,             // no need to spell out
  /\b(?:I|we)\s+won'?t\s+(?:bore|trouble)\s+(?:you|everyone)\s+with\b/i,  // I won't bore you with the derivation
  // [r479 补形] 「you can see it immediately」受众被预设为当场自明
  /\byou\s+(?:can\s+)?(?:see|tell)\s+it\s+(?:immediately|right\s+away|at\s+a\s+glance)\b/i,          // you can see it immediately
  // [r479 补形] 自明系动词形
  /\b(?:is|are|it'?s)\s+(?:self[- ]?evident|self[- ]?explanatory|immediately\s+(?:obvious|apparent|clear))\b/i, // it's self-evident
  /\b(?:obvious|apparent|clear|evident)\s+(?:to\s+)?(?:anyone|everyone|all)\b/i,                     // obvious to anyone
  /\bmakes\s+(?:the\s+)?\w+\s+clear\s+[—-]\s+this\s+should\s+not\s+need\b/i,                          // makes the divergence clear — this should not need
  /\bshould\s+not\s+need\b/i,                                            // should not need（裸形，与 spelling out 族同义）
  /\bno\s+(?:further\s+)?(?:detail|details)\s+(?:are\s+)?(?:needed|required|necessary)\b/i,          // no further details are needed
  // [r479 补形] 「as everyone in this field knows / every … student knows」
  // 自身即含共识断言与坍缩承诺（knows 即"你们都已知"），单腿成句：
  /\bas\s+everyone\s+in\s+this\s+field\s+knows\b/i,                        // as everyone in this field knows
  /\bevery\s+\w+\s+student\s+knows\b/i,                                   // every econometrics student knows
  /\bneedless\s+to\s+say\b/i,                                             // Needless to say（元共识断言）
  /\bas\s+(?:every\s+)?(?:economist|physicist|engineer|statistician|researcher)s?\s+knows?\b/i,     // as every economist knows
  /\banyone\s+familiar\s+with\b[^.]{0,60}\bwill\s+see\b/i,                // anyone familiar with OLS will see immediately
  // [r480 补形] 被动省略形：「the derivation is omitted here」——
  // 坍缩不必是第一人称主动（I will not derive），被动省略同构。
  /\b(?:derivation|proof|details?|explanation|argument|justification|walkthrough)\s+(?:is|are)\s+(?:omitted|left\s+out|withheld|not\s+(?:given|shown|stated))\b/i, // the derivation is omitted here
  // [r480 补形] 冗余性坍缩：「further elaboration would be redundant」——
  // 把展开义务判为多余，是坍缩的另一种自我豁免表述。
  /\b(?:further|additional|more)\s+(?:elaboration|explanation|detail|details|justification|discussion)\s+(?:would\s+be|is|seems)\s+(?:redundant|unnecessary|superfluous|pointless)\b/i, // further elaboration would be redundant
  // [r480 补形] 当场自明形：「will see why it holds immediately」——
  // 与 K_EN10「you can see it immediately」同族，主语扩展为任意受众。
  /\bwill\s+(?:see|understand|grasp)\s+(?:why|how|that|it)\b[^.]{0,40}\b(?:immediately|right\s+away|at\s+a\s+glance|instantly)\b/i, // will see why it holds immediately
];

// ─── [r490] 腿① 英文 consensus-omission 族（真升级② D 族）───
// 存量 CONSENSUS_EN（r479/r480）只收 anyone familiar with /
// everyone in this field knows / obvious to practitioners 形；
// 本族以 established consensus / common knowledge / 受众素养
// 足够（the audience is expert enough / the readership is
// specialist / practitioners take this for granted）断言共识，
// r490 探针 EN 8/8 穿透（良性 0/5）。
const CONSENSUS_EN3 = [  // [r490 补形] EN consensus-omission 族（与 A/B/C 同构，英文形）：
  // 共识以 established consensus / common knowledge / 受众素养足够
  // （the audience is expert enough / the readership is specialist /
  // practitioners take this for granted）断言。存量 anyone familiar
  // with / everyone in the field knows 形不覆盖，r490 探针 EN 8/8 穿透。
  /\b(?:established|settled|widely\s+accepted|accepted)\s+(?:consensus|science|wisdom|view)\s+(?:in|within|among)\b/i, // established consensus in the field
  /\b(?:common|shared|general)\s+knowledge\s+(?:in|among|within|to)\b/i,            // common knowledge among peers
  /\bthe\s+(?:audience|readership|readers|listeners|committee|panel)\s+(?:is|are)\s+(?:expert|specialist|familiar|professional|knowledgeable|sophisticated)\s+enough\b/i, // the audience is expert enough
  /\bthe\s+(?:audience|readership)\s+is\s+(?:specialist|expert|professional|technical)\b/i, // the readership is specialist
  /\b(?:practitioners?|insiders?|experts?|professionals?|specialists?)\s+(?:take|takes)\s+(?:this|it|that)\s+for\s+granted\b/i, // practitioners take this for granted
  /\b(?:audience|readership|readers|committee)\s+(?:already\s+)?(?:knows?|understand|understands|is\s+familiar\s+with)\b/i, // the committee already knows the method
  // [r491 补形] r490 轮测 A4 miss 实证：「Our team shares this
  // understanding implicitly」——共识以「共享理解 + 隐式」断言，
  // 存量表只有 take for granted / already knows 形，不含 shares
  // this understanding 形。补 share/hold/carry the understanding
  // + implicitly/tacitly 修饰（与 ZH4 心照不宣同构）。
  /\b(?:our|the)\s+(?:team|group|committee|staff|crew|colleagues?|organization|org)\s+(?:already\s+)?(?:shares?|share|holds?|hold|carries|carry|takes?\s+for\s+granted)\s+(?:this|that|the)\s+(?:understanding|view|reading|interpretation|assumption)\b/i, // our team shares this understanding
  /\b(?:shared|common|tacit|implicit|unspoken|mutual)\s+(?:understanding|assumption|knowledge|view)\b/i, // a shared understanding
  /\b(?:implicitly|tacitly|silently|unspokenly|without\s+saying\s+(?:it|anything))\s+(?:understood|known|agreed|assumed|shared)\b/i, // implicitly understood

];

// [r492 补形] r491 变体矩阵 miss 实证：「Our discipline takes this for
// granted」——CONSENSUS_EN3 的 take for granted 形只收 practitioners/
// insiders/experts 等「从业者」主语，真实语料常用「学科/领域/行业」
// 本身作主语。独立常量供负例注入（D3 摘除证明承重）。
const CONSENSUS_EN4 = [
  /\b(?:our|the|this)\s+(?:discipline|field|area|domain|profession|community|literature)\s+(?:already\s+)?(?:takes?|take|took|taken)\s+(?:this|it|that)\s+for\s+granted\b/i, // our discipline takes this for granted
  /\b(?:within|in|inside)\s+(?:our|the|this)\s+(?:discipline|field|area|domain|profession|community)\s+(?:this|it|that)\s+(?:is\s+)?(?:taken\s+for\s+granted|assumed|given)\b/i, // within our discipline this is taken for granted
  /\b(?:settled|established|standard)\s+(?:science|practice|doctrine|view|framework)\s+(?:within|inside|in)\s+(?:our|the|this)\s+(?:discipline|field|area|domain|profession|community)\b/i, // settled science within our discipline
  // [r492 补形] 领域共识裸形：「Within our discipline ...」——存量 take for
  // granted / this is taken for granted 形都要求 this/it/that 宾语，而真实
  // 语料常以 within/in our discipline 领域状语开头直接断言学科内共识。
  /\b(?:within|in|inside)\s+(?:our|the|this)\s+(?:discipline|field|area|domain|profession|community)\b/i, // within our discipline（领域共识状语）
];

// ─── 距离窗 ───────────────────────────────────────────────────
const PAIR_ZH = 90;
const PAIR_EN = 200;

// ─── 豁免：展开承诺 / 科普转译 / 术语定义 / 数据引用 ──────────
// 关键：展开承诺必须**出现在坍缩腿之前**（同一句或前一句），
// 否则「我就跳过了，但附录有完整推导」式反转句仍应判——本类
// 反转语义由 matchAlive 的否定守卫 + 展开词前置要求覆盖。
const EXEMPT_ZH = /(?:我(?:先|从|这就|现在)?(?:从定义|从头|一步步|逐步)(?:开始)?(?:讲|说|展开|推导|解释)|完整(?:的)?(?:推导|证明|过程|解释)(?:见|在|请见|详见)(?:附录|下文|后文|第)|我(?:尽量|会|可以)(?:用)?(?:通俗|简单|直白)(?:的)?(?:话|语言)(?:讲|说|解释)(?:清楚|明白)|我(?:把|将)(?:关键|重要)(?:部分|内容)(?:复述|展开|讲)(?:一遍|一次)|推导(?:过程|太|很)?(?:长|复杂)?我(?:还是|仍然)(?:从|按)(?:定义|头)(?:讲|写)|先(?:看|讲)(?:第一|第二)阶段)/;
// [r479 修订] 附录/展开承诺须兼容动词三单与被动形（-s / -ed / be）：
// 原句只匹配原形 "derives it from scratch" 之外的 "derive it from scratch"，
// "the appendix derives it from scratch"（附录展开承诺）被漏放，
// 单腿①即可误命中（D2 实测 FAIL）。
const EXEMPT_EN = /\b(?:let\s+me\s+walk\s+(?:you\s+)?through|walk\s+through\s+the\s+derivation|full\s+(?:derivation|proof|details?)\s+(?:in|see|are\s+in)\s+(?:the\s+)?(?:appendix|below)|(?:derives?|derived|deriving|derive)\s+(?:it|this|them)\s+from\s+scratch|(?:is|are|be|been|being)\s+derived\s+from\s+scratch|in\s+plain\s+(?:language|terms)|spell(?:ing|ed)?\s+(?:it|this)\s+out\s+(?:in\s+full|step\s+by\s+step)|I\s+will\s+explain\s+(?:it|this)\s+(?:fully|in\s+detail))/i;

// ─── 否定守卫 ─────────────────────────────────────────────────
// 坍缩腿与共识腿的否定前缀（「并不是说学过…就懂」「不能因为大家都
// 熟悉就跳过」「not true that everyone already knows」）。
const NEG_BEFORE_ZH = /(?:不能|不可|不应|不该|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|说明不了|证明不了|尚待|还不能|并不会|不改变|不影响|从不|绝不|永不|坚决不|不觉得|没觉得|谈不上)[^。，！？；\n]{0,6}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const NEG_INSIDE_ZH = /(?:不能|不可|不应|不该|并不能|并未|没有|不是|算不上|并非|不算|未必|不等于|不代表|说明不了|证明不了|尚待|还不能|并不会|不改变|不影响|从不|绝不|永不|坚决不)/;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|hardly|barely|far\s+from)\s+(?:\w+\s+){0,4}$/i;
const NEG_INSIDE_EN = /\bnot\s+(?:that|to\s+say|true\s+that)\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bno\s+guarantee\b/i;

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

// 单条匹配是否有效（否定前缀/内部否定均拦下；ZH 与 EN 均查）
function matchAlive(text, x) {
  if (NEG_INSIDE_ZH.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (NEG_BEFORE_ZH.test(before) || IMMEDIATE_NEG_ZH.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 去重叠（同族多模式命中同一片段只留最长/最先者）
function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 收集某语言侧单腿的全部有效匹配
function collect(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x)) m.push(x);
  }
  return dedupeOverlap(m);
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 双腿链配对：CONSENSUS × COLLAPSE
function pairLegs(text, consensus, collapse, win) {
  const cm = collect(text, consensus);
  if (cm.length === 0) return [];
  const km = collect(text, collapse);
  const pairs = [];
  for (const c of cm) {
    for (const k of km) {
      if (dist(c, k) > win) continue;
      pairs.push({ c, k });
    }
  }
  return pairs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function checkCurseOfKnowledge(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：展开承诺/科普转译/术语定义/数据引用
  if ((R.EXEMPT_ZH || EXEMPT_ZH).test(text) || (R.EXEMPT_EN || EXEMPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // [r490] 新共识腿合入：CONSENSUS_ZH3/4/5（A/B/C 三族）与
  // CONSENSUS_EN3（D 族）与存量腿并联——inject 未提供时用合并表，
  // inject 提供时尊重注入（负例脚本按常量摘除）。合并只在未注入侧发生。
  const ZH_CONS = R.CONSENSUS_ZH || CONSENSUS_ZH.concat(CONSENSUS_ZH3, CONSENSUS_ZH4, CONSENSUS_ZH5, CONSENSUS_ZH6);
  const EN_CONS = R.CONSENSUS_EN || CONSENSUS_EN.concat(CONSENSUS_EN3, CONSENSUS_EN4);
  const langs = [
    { consensus: ZH_CONS, collapse: R.COLLAPSE_ZH || COLLAPSE_ZH.concat(COLLAPSE_ZH2), win: PAIR_ZH, lang: 'zh' },
    { consensus: EN_CONS, collapse: R.COLLAPSE_EN || COLLAPSE_EN.concat(COLLAPSE_EN2, COLLAPSE_EN3), win: PAIR_EN, lang: 'en' },
  ];
  const sigs = [];
  for (const L of langs) {
    for (const p of pairLegs(text, L.consensus, L.collapse, L.win)) {
      sigs.push({ lang: L.lang, consensus: p.c.raw, collapse: p.k.raw });
    }
  }
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.68 : 0.6;
  return {
    hit: true,
    dimension: 'curse_of_knowledge',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '专业共识断言「' + x.consensus + '」×解释坍缩「' + x.collapse + '」'
      : 'expert-consensus assumption "' + x.consensus + '" x explanation collapse "' + x.collapse + '"')),
    details: s.lang === 'zh'
      ? '知识的诅咒/解释坍缩(' + sigs.length + '处: 「' + s.consensus + '」把专业共识当作受众共享前提，「' + s.collapse + '」豁免了解释义务——以受众身份替代论证本身)(zh)'
      : 'curse of knowledge(' + sigs.length + 'x: "' + s.consensus + '" treats expert consensus as shared premise, "' + s.collapse + '" waives the explanation duty — audience identity substitutes for the argument)(en)',
    guidance: '知识的诅咒/解释坍缩指：专家知道自己所知，无法重建受众的不知状态，于是把仅在专业共同体内成立的共识当作跨群体共享前提，用「圈内人都懂」豁免解释义务（这个结论但凡学过随机过程的人都懂，不用展开 / 细节见规范第 3.2 节，做这行的都熟悉，不赘述 / Anyone who has taken stochastic processes knows this, no explanation needed / This is textbook stuff for anyone in the field, so I will skip the derivation）。逻辑上，「懂的人自然懂」不是论证——它把结论的可验证性坍缩到仅同行可读，使论证失去被独立检验的资格。请补上论证：把推导、数据与依据显式给出（完整推导见附录/我尽量用通俗的话讲清楚/先看第一阶段），或明确标注依赖的前置知识并补足关键定义（CAP 定理指的是…/Fst 值衡量…）；若结论确实只对同行显然，明确标注其适用读者范围，不要以受众身份替代论证。',
    tags: ['epistemology', 'curse-of-knowledge', 'explanation-collapse', 'expertise', 'argumentation', 'communication', 'cognitive-bias', 'judgment'],
  };
}

module.exports = {
  checkCurseOfKnowledge,
  __internals: () => ({
    CONSENSUS_ZH, COLLAPSE_ZH, COLLAPSE_ZH2,
    CONSENSUS_EN, COLLAPSE_EN, COLLAPSE_EN2, COLLAPSE_EN3,
    CONSENSUS_ZH3, CONSENSUS_ZH4, CONSENSUS_ZH5, CONSENSUS_ZH6,
    CONSENSUS_EN3, CONSENSUS_EN4,
    PAIR_ZH, PAIR_EN,
    EXEMPT_ZH, EXEMPT_EN,
  }),
};
