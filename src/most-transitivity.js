/**
 * src/most-transitivity.js — 「大多数」链式传递谬误检测器
 * （第 185 个判别维度，r188 立项）
 *
 * [r188 立项] decision 本体在当前引擎（v6.8.115，184 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。加速依据是缺口实证 + 轮换纪律：
 *   · 缺口实证（/tmp/hf-probe-r188.js、/tmp/hf-probe-r188b.js，直调
 *     gate.js v6.8.115）：候选四族实测——中项不周延 5/6 被
 *     affirming_the_consequent 代拦且 2 条有效三段论被误拦、肯定析取 3/5 被
 *     illicit_conversion 等代拦、堆垛 4/5 被 fallacies 代拦，唯本族
 *     （most 链式传递）扩展矩阵 10 条攻击 6 条真零命中、8 条边缘良性
 *     零误伤——为唯一干净缺口，且被代拦的 4 条归因维度也非本族设计。
 *   · 外部来源（真实，未编造）：HN Algolia "Translating natural language to
 *     first-order logic for logical fallacy detection"（258 分，
 *     https://news.ycombinator.com/item?id=43257719）、"Master List of
 *     Logical Fallacies (2018)"（113 分，
 *     https://news.ycombinator.com/item?id=27287363）、"Slaughtering
 *     Competition Problems with Quantifier Elimination"（78 分，
 *     https://news.ycombinator.com/item?id=46415448）、"The strange
 *     non-transitivity of random variables"（26 分，
 *     https://news.ycombinator.com/item?id=10763018）作量词与非传递性概念
 *     背景；GitHub tmakesense/logical-fallacy（21★）、
 *     bkthomps/CategoricalSyllogism（6★，
 *     https://github.com/bkthomps/CategoricalSyllogism）为三段论/谬误检测
 *     成熟代码方案参考。Semantic Scholar 两次检索 HTTP 429 空返。
 *     判据为心虫自有纯规则实现（无任何 LLM 依赖）。
 *     侦察落盘 /tmp/hf-scout-r188.txt 与 /tmp/hf-scout-r188-transitivity.txt。
 *
 * 辨别的族：「大多数」链式传递谬误（non-transitivity of "most" / 量词
 * 「大多数」非传递）——most 量词不满足传递性：
 *   「大多数A是B，大多数B是C」推不出「大多数A是C」。
 *   反例（算术级）：100 人里 60 人喝茶（B），60 个喝茶的人里 35 人喝咖啡
 *   （C）——「大多数人喝咖啡」不成立。两段「大多数」前提的**证据不能沿
 *   中间项累积**，每个「大多数」只覆盖各自前提的大部分，交集可以很小：
 *   大多数A队球迷支持主队，大多数支持主队的人会买季票，所以大多数A队球迷
 *   会买季票。
 *   大部分用户点了同意，大部分点了同意的人都没读协议，所以大部分用户都没读协议。
 *   七成受访者表示满意，七成表示满意的受访者购买了会员，所以七成受访者都买了会员。
 *   Most students passed the exam, and most people who passed got
 *   certificates, so most students got certificates.
 *
 * 与既有维度的边界（r188 归因，刻意错开）：
 *   · illicit_conversion（第167维）管**全称**换位（所有A是B∴所有B是A），
 *     本族量词是「大多数」且结构是三段链（两个前提+一个结论），不是主谓
 *     对调；两者可同句共现但判定结构不同。
 *   · affirming_the_consequent / denying_the_antecedent / conditional_proposition
 *     管**条件句**方向错误（Q∴P / ¬P∴¬Q / ¬B⇒¬A），本族是**量词累积**
 *     错误，句中无条件句。
 *   · statistical_misleading / percentage_overflow 管比例数字的呈现问题，
 *     本族不管数字大小，管「两个大多数前提推不出大多数结论」这个推理结构。
 *   · fallacies 是谬误族容器（要求特定动词短语），本族是独立形式谬误维度。
 *
 * 判据（链式三件共现，缺一不判）：
 *   · 件① P1 第一段「大多数」前提——片段以 MOST 量词开头（裸名词形态：
 *     大多数/大部分/多数/过半/七成/八成/超过半数…；EN most / the majority
 *     of），切出主项 S1 与谓项 P1（谓项非空，中间项素材在谓项里）。
 *   · 件② P2 第二段「大多数」前提——主项 S2 **包含 P1 的谓项关键词**
 *     （中间项连续性：第二段讨论的就是第一段谓项指称的那群对象）。
 *   · 件③ C 「大多数」结论——主项 S3 回指 P1 的主项（grams 共享），
 *     谓项 P3 是**新内容**（与 P1 谓项无共享 grams——排除把 P1 复述一遍），
 *     且结论整体与 P2 有共享关键词（结论内容接在第二段上）。
 *   · 位置：结论跟在两前提之后（跟句模式，须自带 MOST 量词），或结论带
 *     推断词前置（倒装模式「所以C，因为P1、P2」——推断词承重）。
 *   · 豁免（全部可负例注入置空）：META_CONCEPT 谬误/量词/传递性概念
 *     转述、TEACH 教学语境、HEDGE 对冲结论（可能/也许/往往/maybe…——
 *     概率化结论不作谬误判定）、疑问句。
 *
 * 为什么取 VERIFY 级：单句也可能是**定义式/统计式**的正确多数陈述
 * （「大多数猫是哺乳动物，大多数哺乳动物是温血动物，所以大多数猫是温血
 * 动物」——结论为真、量词形式相同，verify 的含义是「两个大多数前提的
 * 交集大小未知，需要补上全称或特称证据才能确认结论」）。与 r161-r186
 * 同口径只登记 VERIFY。
 */
'use strict';

// ─── 件①/②/③：MOST 量词（中文，裸名词形态；161 轮教训：去后缀仍命中）──
// 不限句首（「调查显示大多数…」「显然大多数…」前缀常见），取片段内首次
// 出现；顺序即优先：长的在前（绝大多数 先于 大多；大部分 先于 大半）。
const MOST_ZH = [
  /(?:绝大多数|大多数|大部分|多数派|半数以上|十有八九|七成|八成|九成|六成|五成|过半|大半|逾半|超过[半一两三四五六七八九十成]+|半数|多数|大多)(?:的)?/,
];
const MOST_EN = [
  // [r318] 补 mostly 量词形：「Reform supporters mostly read news」——
  // 旧正则要求 most 后必跟空白，"mostly" 整段不匹配直接返回 null。
  /(?:the\s+|a\s+)?(?:majority\s+of|most(?:ly)?(?:\s+of)?)\s+(?:the\s+)?/i,
];

// [r318] 量词后置腿（NP 在量词之前、谓项紧随量词）：「喜欢甜食的人**多数**
// 偏胖」「购票者中**过半**到场」「差评**居多**」。r318 实测 ZH 自然链 12 条
// 仅 3 条命中，缺口主因就是这条腿缺失——P2 中间项 NP 全在量词前面。
// 注：m.index >= 1 保证 NP 非空；「多数」与 MOST_ZH 共享字形故谓项切分仍走
// _findBound 兜底不可用时由 tail 整体充当谓项（中间项素材在 NP 侧，够用）。
const ZHUJU_ZH = [
  /(?:绝大多数|大多数|大部分|过半|逾半|半数以上|十有八九|七成|八成|九成|六成|五成|过半|过半|大半|半数|多数|大多)/,
  /居多/,
];

// [r318] 片段切词标点（常量抽出来，供 _parseMost 后置腿复用；全角形态显式
// 列举，避免 patch 工具转义吞字）
const LEAD_PUNC = /^[，,。；;、\s]+/;
const TRAIL_PUNC = /[，,。；;、\s]+$/;

// ─── 主项/谓项切分：谓词起始功能词（边界标记，优先于动词）────────────
// 刻意不收「有/为」——「有害」「认为」「为民」里它们不是谓词标记，收进来
// 会把「知道有害健康」切成「知道|害健康…」、「认为公司」切成「认|为…」。
const BOUND_ZH = [
  /都是/, /皆是/, /全是/, /均是/, /都属于/, /就是/, /乃是/, /属于/,
  /都/, /是/, /会/, /能/, /可以/, /能够/, /将/, /在/, /也/, /还/,
  /就/, /才/, /便/, /被/, /把/, /让/, /使/, /即/, /得/, /已/, /仍然/, /依然/,
  /仍旧/, /仍/, /正/, /刚刚/, /再/, /又/, /予以/, /加以/, /得以/, /来着/,
];

// ─── 主项/谓项切分：双字动词/形容词（论证域高频，谓词无功能词标记时兜底）──
const VERB_ZH = [
  /支持/, /反对/, /认为/, /觉得/, /相信/, /信任/, /希望/, /愿意/, /选择/,
  /购买/, /提交/, /完成/, /参与/, /参加/, /使用/, /表示/, /回答/, /反馈/,
  /复购/, /进入/, /同意/, /点击/, /浏览/, /报名/, /发表/, /发布/, /分享/,
  /转发/, /点赞/, /收藏/, /关注/, /投诉/, /举报/, /续费/, /订阅/, /注册/,
  /下载/, /安装/, /升级/, /更新/, /推荐/, /邀请/, /加入/, /退出/, /投资/,
  /消费/, /纳税/, /违规/, /违纪/, /及格/, /毕业/, /就业/, /结婚/, /生育/,
  /照顾/, /关心/, /担心/, /害怕/, /焦虑/, /开心/, /高兴/, /满意/, /不满/,
  /抱怨/, /赞赏/, /敬佩/, /羡慕/, /想念/, /疲惫/, /努力/, /认真/, /细心/,
  /耐心/, /温和/, /温柔/, /体贴/, /自私/, /大方/, /宽容/, /严格/, /善良/,
  /诚实/, /成熟/, /稳重/, /有趣/, /精彩/, /明确/, /清楚/, /认同/, /拒绝/,
  /接受/, /采纳/, /看好/, /唱衰/, /持有/, /买入/, /卖出/, /加仓/, /减仓/,
  /满仓/, /知道/, /了解/, /明白/, /理解/, /意识/, /注意/, /发现/, /看见/,
  /听到/, /感觉/, /察觉/, /观察/, /思考/, /考虑/, /研究/, /分析/, /判断/,
  /推断/, /推理/, /总结/, /归纳/, /证明/, /证伪/, /验证/, /检验/, /检测/,
  /测试/, /审查/, /审计/, /调查/, /调研/, /统计/, /测量/, /计算/, /评估/,
  /评价/, /评判/, /比较/, /对比/, /区分/, /辨别/, /识别/, /确认/, /否定/,
  /肯定/, /承认/, /否认/, /拥护/, /抵制/, /抗拒/, /排斥/, /接纳/, /包容/,
  /容忍/, /忍让/, /退让/, /妥协/, /坚持/, /放弃/, /坚守/, /保持/, /维持/,
  /继续/, /停止/, /中断/, /恢复/, /重启/, /开始/, /结束/, /读完/, /读过/,
  /看过/, /买过/, /去过/, /吃过/, /听过/, /写过/, /说过/, /想买/, /想要/,
  /打算/, /计划/, /准备/, /决定/, /倾向/, /偏爱/, /热衷/, /沉迷/, /依赖/,
  /习惯/, /适应/, /适合/, /符合/, /满足/, /超出/, /低于/, /高于/, /优于/,
  /劣于/, /超过/, /领先/, /落后/, /追赶/, /模仿/, /抄袭/, /借鉴/, /沿用/,
  /抛弃/, /摒弃/, /主张/, /倡导/, /提倡/, /鼓吹/, /宣扬/, /宣传/, /传播/,
  /扩散/, /蔓延/, /流行/, /盛行/, /风靡/, /过时/, /落伍/, /先进/, /优秀/,
  /卓越/, /杰出/, /出色/, /平庸/, /差劲/, /糟糕/, /严重/, /轻微/, /普通/,
  /特殊/, /独特/, /奇怪/, /正常/, /异常/, /合理/, /荒谬/, /正确/, /错误/,
  /准确/, /精确/, /模糊/, /清晰/, /透明/, /公开/, /秘密/, /隐蔽/, /隐藏/,
  /暴露/, /揭露/, /揭示/, /显示/, /表明/, /说明/, /强调/, /忽视/, /忽略/,
  /重视/, /珍视/, /鄙视/, /蔑视/, /尊重/, /尊敬/, /崇拜/, /推崇/, /提拔/,
  /培养/, /培育/, /教育/, /教导/, /指导/, /引导/, /引领/, /带领/, /帮助/,
  /协助/, /辅助/, /促成/, /促进/, /推动/, /推进/, /加快/, /加速/, /延缓/,
  /延迟/, /阻碍/, /阻挡/, /制止/, /遏制/, /赞成/, /拥护/, /支持/,
  // r188 补批：内容域高频动词（「打开邮件/查看报告/支付订单」类）
  /打开/, /关闭/, /查看/, /翻阅/, /搜索/, /筛选/, /刷新/, /加载/, /播放/, /暂停/,
  /录制/, /截图/, /保存/, /删除/, /修改/, /编辑/, /创建/, /新建/, /导入/, /导出/,
  /备份/, /登录/, /签到/, /打卡/, /排队/, /预约/, /取消/, /确认/, /支付/, /付款/,
  /转账/, /充值/, /提现/, /退款/, /退货/, /换货/, /签收/, /打赏/, /学习/, /复习/,
  /预习/, /练习/, /训练/, /备考/, /出席/, /缺席/, /迟到/, /早退/, /请假/, /加班/,
  /值班/, /出差/, /旅行/, /通勤/, /搬家/, /装修/, /购房/, /租房/, /怀孕/, /生产/,
  /体检/, /就诊/, /住院/, /手术/, /服药/, /挂号/, /复查/, /尝试/, /体验/, /试用/,
  /施行/, /实施/, /执行/, /落实/, /贯彻/, /响应/, /配合/, /介入/, /干预/, /影响/,
  /改变/, /导致/, /引发/, /带来/, /造成/, /减少/, /增加/, /降低/, /提高/, /提升/,
  // r318 补批：P1 主项被量词吃掉后的裸谓词形（「人喜欢甜食」「人早起」
  // 「人爱看新闻」——VERB1 的 /爱/ 只兜底单字，双字情感词必须显式收录；
  // 「多数人偏胖」型靠 VERB1 /胖/ 已覆盖，这里是补「喜欢/早起/熬夜/翻墙」
  // 这类高频双字谓词，使 P1 谓项非空、中间项素材可用）
  /喜欢/, /喜爱/, /热爱/, /喜好/, /早起/, /早睡/, /熬夜/, /晚睡/, /通勤/, /摸鱼/,
  /躺平/, /内卷/, /上岸/, /翻车/, /爆红/, /走红/, /出圈/, /下头/, /上头/, /入坑/,
  /种草/, /拔草/, /剁手/, /囤货/, /秒杀/, /抢购/, /海淘/, /代购/, /拼单/, /凑单/,
  /氪金/, /开黑/, /连麦/, /刷屏/, /霸屏/, /控评/, /拉踩/, /对标/, /复盘/, /沉淀/,
  /打通/, /落地/, /赋能/, /抓手/, /闭环/, /颗粒度/, /方法论/, /组合拳/,
];

// r318 补批② 的 26 个裸单字谓词（用/刷/逛/聊/看/听/读/写/买/卖/玩/吃/喝/
// 睡/跑/走/开/住/穿/戴/带/拿/放/找/等/站）已移至下方 VERB1_ZH——见该处
// [r319] 注释：它们属于最低优先层，误入 VERB_ZH 会令 round-188 的注入族
// 停不住火（注入只清 VERB1_ZH）。

// ─── 主项/谓项切分：单字动词/形容词（最低优先，仍需主项非空）──────────
const VERB1_ZH = [
  /买/, /点/, /领/, /读/, /写/, /看/, /吃/, /听/, /爱/, /恨/, /病/, /痛/,
  /累/, /忙/, /高/, /低/, /多/, /少/, /大/, /小/, /好/, /差/, /强/, /弱/,
  /快/, /慢/, /贵/, /贱/, /富/, /穷/, /美/, /丑/, /帅/, /蠢/, /笨/, /懒/,
  /渴/, /饿/, /冷/, /热/, /疼/, /痒/, /瘦/, /胖/, /香/, /臭/, /新/, /旧/,
  /老/, /嫩/, /生/, /熟/, /真/, /假/, /对/, /错/, /输/, /赢/, /成/, /败/,
  /升/, /降/, /涨/, /跌/,
  // [r319] r318 补批② 原置于 VERB_ZH，承重修正移至本表（最低优先层）：
  // 使「年轻人用社交软件」切成「年轻人|用社交软件」；且注入族清 VERB1_ZH
  // 即可停火（r318 误置 VERB_ZH 时注入只清 VERB1_ZH，VERB_ZH 单字继续切
  // 分导致 round-188 回归 2/3——seg1「多数房价高的城市收入也高」注入后
  // 仍被切出 statement）。26 个单字与原表重复的（买/读/写/看/吃/听）不去重，
  // 保持注释所述原批次完整可查。
  /用/, /刷/, /逛/, /聊/, /看/, /听/, /读/, /写/, /买/, /卖/, /玩/, /吃/, /喝/,
  /睡/, /跑/, /走/, /开/, /住/, /穿/, /戴/, /带/, /拿/, /放/, /找/, /等/, /站/,
];

// ─── 件③：推断连接词（结论标记；倒装模式与跟句模式都靠它定位结论）────
const INFER_ZH = [
  /足以证明/, /足以说明/, /这就说明/, /那就意味着/, /这就意味着/, /这说明/,
  /这意味着/, /由此可见/, /由此可知/, /据此可知/, /众所周知/, /总而言之/,
  /综上所述/, /所以/, /因此/, /因而/, /从而/, /可见/, /足见/, /据此/, /由此/,
  /于是/, /那么/, /推知/, /故而/, /故/, /显然/, /肯定/, /毫无疑问/,
];
const INFER_EN = [
  /\bso\b/i, /\btherefore\b/i, /\bthus\b/i, /\bhence\b/i,
  /\bconsequently\b/i, /\bwhich\s+means\b/i, /\bthat\s+means\b/i,
  /\bit\s+follows\b/i, /\bthis\s+shows\b/i, /\bthis\s+proves\b/i,
  /\bwe\s+can\s+conclude\b/i,
];

// ─── 前提标记（倒装模式「所以C，因为P1、P2」的路由）──────────────────
const PREMISE_ZH = [/因为/, /由于/, /鉴于/];
const PREMISE_EN = [/\bbecause\b/i, /\bsince\b/i];

// ─── 豁免（全部可负例注入置空）──────────────────────────────────────
const META_CONCEPT = [
  /传递性/, /传递谬误/, /量词谬误/, /非传递/, /不传递/, /逻辑谬误/, /形式谬误/,
  /三段论/, /中项/, /谓词逻辑/, /量化逻辑/, /谬误/, /诡辩/,
  /syllogis/i, /quantifier/i, /transitiv/i, /logical\s+fallacy/i,
  /formal\s+fallacy/i, /fallacy/i,
];
const TEACH = [
  /老师/, /教材/, /课堂/, /课本/, /课程/, /教授/, /讲师/, /例题/, /习题/,
  /考试/, /试题/, /试卷/, /讲课/,
  /textbook/i, /lecture/i, /lesson/i, /professor/i,
];
// 注意：刻意不收裸 exam/quiz——「passed the exam」里 exam 是链式论证的
// 内容词不是考场语境（r188 实测：英文攻击样本被 TEACH 误豁免整句）。
// 对冲结论（概率化结论不作谬误判定，同 r161/r185 口径）
const HEDGE = [
  /可能/, /也许/, /或许/, /大概/, /恐怕/, /说不定/, /不一定/, /未必/, /往往/,
  /通常/, /一般来说/, /多数情况下/, /在某种程度上/, /至少/,
  /maybe/i, /perhaps/i, /might/i, /could\s+be/i, /likely/i, /probably/i,
  /possibly/i, /generally/i, /tend\s+to/i,
];

// ─── 分词停用字（grams 生成时跳过纯功能字片段，防「都/会」凑链接）────
const ZH_STOP = new Set([
  '的', '是', '了', '在', '有', '和', '与', '也', '都', '就', '还', '会', '能',
'要', '不', '没', '这', '那', '其', '之', '以', '为', '于', '很', '太', '更',
'最', '啊', '吧', '呢', '吗', '呀', '把', '被', '从', '向', '对', '等', '所',
'如', '果', '若', '只', '现', '场', '因', '此', '说', '明', '证', '见', '意',
'味', '着', '即', '便', '可', '肯', '准', '显', '然', '凡', '一', '切', '每',
'各', '诸', '所', '则', '已', '才', '再', '又', '正', '将', '曾', '经', '由',
'该', '本', '某', '各', '种', '各', '么', '样', '地', '得', '过', '着', '吧',
]);
const EN_STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of',
  'to', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by', 'that', 'this',
  'it', 'its', 'as', 'if', 'then', 'would', 'will', 'can', 'could', 'may',
  'might', 'must', 'he', 'she', 'they', 'his', 'her', 'their', 'we', 'you',
  'i', 'so', 'therefore', 'thus', 'hence', 'not', 'no', 'does', 'do', 'did',
  'has', 'have', 'had', 'all', 'every', 'any', 'each', 'some', 'certain',
  'most', 'who', 'which', 'and', 'but', 'because', 'since', 'of', 'majority',
]);

function _pass() {
  return { hit: false, score: 0, detail: '', count: 0 };
}

// ─── 片段切分（中英标点均切，逗号也切——链式三件常同句逗号并置）───────
function _segments(text) {
  const parts = String(text).split(/[。；;！!？?\n，,]+|\.(?=\s|[A-Z"']|$)/)
    .map(s => s.trim()).filter(Boolean);
  return parts;
}

function _stripLead(s) {
  return s.replace(/^[，,。；;、\s]+/, '')
    .replace(/^(?:而且|并且|不过|但是|但|而|于是|所以|and|but|so|thus|therefore|hence)\b/i, '')
    .replace(/^[，,。；;、\s]+/, '').trim();
}

// [r318] 「的」字 NP 延长腿（模块级，供 MOST 命中路径与省略路径共用）：
// 「多数偏胖的人有脂肪肝」类——_findBound 取最早边界会把「偏|胖的人有
// 脂肪肝」切开（「胖」是 VERB1_ZH 单字谓词，idx=1 抢切），主项素材丢失
// 导致中间项链接断。若 body 呈「X的Y[谓词…]」形（X 非空谓词性修饰、
// Y=1-4 字名词），主项取「X的Y」整段、谓项取其后的全部，保住
// 「偏胖的人→有脂肪肝」链接。
// 「有」不在 BOUND_ZH（AGENTS 约定：有害/认为会误切），故此腿不查边界词，
// 直接按「的」位置切；X 为空（裸「的读者」形）不触发，走原路径。
// Y 长度上限 4 且**懒匹配+右锚**（Y 后须接功能词/「有」类谓词或句尾）
// ——否则「偏胖的人有脂肪肝」会把「人有脂肪」当 Y 整段吞掉（无锚点时
// .{1,4} 贪婪吃满），切出「偏胖的人有脂肪|肝」的错位形。右锚词表是
// 本腿局部常量（含「有」），刻意不复用全局 BOUND_ZH——「有」进全局表
// 会误切「有害/认为」（AGENTS 约定），本腿只在「X的Y」形已成立时查，
// 误切面可控。
function _deLeg(b) {
  const m = b.match(/^(.+?)的(.{1,4}?)(?=都是|皆是|全是|均是|都属于|就是|乃是|属于|都|是|会|能|可以|能够|将|在|也|还|就|才|便|被|把|让|使|即|得|已|仍然|依然|仍旧|仍|正|刚刚|再|又|有|无|属于|包含|包括|含有|患|得|患了|患有|$)/);
  if (!m || m[1].length < 1) return null;
  const headLen = m[0].length;
  const rest = b.slice(headLen);
  if (rest.length < 1) return null;
  const S = b.slice(0, headLen).replace(/[，,。；;、\s]+$/, '');
  const P = rest.replace(/^[，,。；;、\s]+/, '');
  if (!S || !P) return null;
  return { S, P };
}

// [r318] 量词后置形（「喜欢甜食的人多数偏胖」——NP 在量词之前，谓项紧随
// 量词）：先试后置匹配，NP 主项 + 尾部谓项切分；匹配不上再走原句首路径。
// 「居多」「占多数」也走这条腿（ZHUJU_ZH 常量可负例注入）。
function _parseMost(seg, R, opts) {
  const s = _stripLead(seg);
  if (!s) return null;
  const isEN = /[a-zA-Z]/.test(s) && !/[\u4e00-\u9fff]/.test(s);
  if (!isEN) {
    const ZJ = R.ZHUJU_ZH || ZHUJU_ZH;
    for (const re of ZJ) {
      const m = s.match(re);
      if (m && m.index >= 1) {
        // [r318] 引述动词守卫：S 尾部若为「显示/表明/指出/发现/认为…」等
        // 引述动词，则量词前是引语内容而非链式 NP 主项——
        // 「调查显示大多数员工认为公司有前途」会被误切成
        // S=「调查显示」P=「员工认为公司有前途」（pristine 正确切分是
        // S=「员工」P=「公司有前途」，round-188 实测回归 5 例）。
        // 命中守卫即跳过本后置腿，回落 MOST 句首路径（那里 `_findBound`
        // 以「认为」为界，S=「员工」）。
        const S0 = s.slice(0, m.index).replace(/[，,。；;、\s]+$/, '');
        // [r319] 引语前缀守卫（标点形）：S0 含句读标点（冒号/逗号/分号/破折号
        // 等）说明它是引语或解说前缀而非链式 NP 主项——「传递性在这里不成立：
        // 大多数A是B」若按后置腿会切成 S=「传递性在这里不成立：」P=「A是B」，
        // 主项素材错误导致中间项链接断（round-188 META/TEACH 注入族实测回归：
        // 抹掉豁免后期望转命中却仍 false）。pristine 下该段由 MOST 句首路径正确
        // 切成 S=「A」P=「B」。命中守卫即跳过本后置腿，回落句首路径。
        // 与下面的引述动词守卫同理，不影响「喜欢甜食的人多数偏胖」这类无标点
        // 真 NP 主项。
        if (/[：:，,；;。！!？?—\-（(【\[]/.test(S0)) continue;
        // [r318] 引述动词守卫：S 尾部若为「显示/表明/指出/发现/认为…」等
        // 引述动词，则量词前是引语内容而非链式 NP 主项——
        // 「调查显示大多数员工认为公司有前途」会被误切成
        // S=「调查显示」P=「员工认为公司有前途」（pristine 正确切分是
        // S=「员工」P=「公司有前途」，round-188 实测回归 5 例）。
        // 命中守卫即跳过本后置腿，回落 MOST 句首路径（那里 `_findBound`
        // 以「认为」为界，S=「员工」）。
        if (/(?:显示|表明|指出|发现|认为|强调|提醒|透露|披露|宣布|宣传|鼓吹|坚称|声称|承认|暗示|意味着|说明)$/.test(S0)) continue;
        // [r319] 句首连词守卫：S0 本身是连词（而/且/但/却/则/即/于是/所以/
        // 因此/因而/从而/并且/而且/不过/然而/虽然/尽管/如果/一旦/当…）时，
        // 它是段间连接成分而非链式 NP 主项——「而大多数认为公司有前途的
        // 员工都买了公司股票」按后置腿会切成 S=「而」P=「认为公司有前途的
        // 员工都买了公司股票」，主项素材错（pristine 正确切分 S=「认为公司
        // 有前途的员工」P=「买了公司股票」，round-188 回归 1）。命中守卫即
        // 跳过本后置腿，回落 MOST 句首路径。
        if (/^(?:而|且|但|却|则|即|于是|所以|因此|因而|从而|并且|而且|不过|然而|虽然|尽管|如果|一旦|当|由于|鉴于|因为|接着|随后|然后|最后|首先|其次|另外|此外|例如|比如|亦即|进而|从而|故而|故|因而)$/.test(S0)) continue;
        // [r319] 推断前缀守卫：S0 尾部是推断/引述连接词（推出/可知/得出/
        // 说明/证明/意味着/足以证明…）时，量词前是推理引导语而非链式 NP
        // 主项——「由此可以推出大多数员工都买了公司股票」按后置腿会切成
        // S=「由此可以推出」P=「员工都买了公司股票」，件③a 要求结论主项回指
        // P1 主项「员工」，「由此可以推出」与「员工」无共享 → 链断（round-188
        // 回归 1 的第二半：seg1 修好后 seg2 仍不命中）。pristine 正确切分是
        // S=「员工」P=「都买了公司股票」（MOST 句首路径）。命中守卫即跳过后置腿。
        // 注：与上面的引述动词守卫尾部同表，此处单列便于承重审计——两条守卫
        // 都是「量词前的串不是 NP 主项」的不同证据形态。
        if (/(?:推出|推知|可知|得出|推论|推断|推理|总结|归纳|说明|证明|意味着|足以证明|足以说明|由此可见|据此|得知|获悉|可见|表明|显示|指出|发现)$/.test(S0)) continue;
        // [r319] 程度前缀守卫：S0 尾部是程度/比较前缀（超过/近/约/达到/
        // 逾/高达/至少/至多/不足/不到…）时，量词前是量化修饰语而非 NP 主项
        // ——「超过八成的订阅用户打开了邮件」按 ZHUJU 腿会匹配到「八成」
        // （index=2，MOST_ZH 的超过八成形在 ZHUJU_ZH 里不存在），切成
        // S=「超过」P=「的订阅用户打开了邮件」，主项错（round-188 攻击变体
        // 「超过八成…点击了链接」实测回归）。命中守卫即跳过后置腿，回落 MOST
        // 句首路径（那里 MOST_ZH 吃掉「超过八成」整串，S=「订阅用户」）。
        if (/(?:超过|近|约|达到|逾|高达|至少|至多|不足|不到|大约|接近|升至|升至|涨到|高达|占|达)$/.test(S0)) continue;
        const S = S0;
        const tail = s.slice(m.index + m[0].length).replace(LEAD_PUNC, '').replace(TRAIL_PUNC, '');
        if (S && tail) {
          return { quant: m[0], body: s, raw: s, S, P: tail, verb: '', bound: m[0], isEN: false };
        }
      }
    }
  }
  let quant = null, body = null;
  for (const re of (isEN ? R.MOST_EN : R.MOST_ZH)) {
    const m = s.match(re);
    if (m) { quant = m[0]; body = s.slice(m.index + m[0].length); break; }
  }
  // [r319] EN 中置 mostly 兜底：MOST_EN 的 `most(?:ly)?` 无位置锚，句段
  // 「Reform supporters mostly read news」里 match 命中中置 mostly
  // （index=18），剥后 body=「read news」→ 主项只剩谓词，链条断
  // （缺口实证 D 族：EN mostly 形 pristine 与 r318 在途两边都漏）。
  // EN 传递链的规范形是**句首**量词（"Most X …"），故 EN 路径优先尝试
  // 句首锚定匹配；句首无 MOST 时才回落中置匹配（中置形由 _parseEN 的
  // mostly 剥离腿处理）。ZH 不变（ZHUJU_ZH 后置腿本就是中置量词的既定
  // 设计，锚定会破坏它）。
  if (isEN) {
    for (const re of R.MOST_EN) {
      const anchored = new RegExp('^' + re.source, re.flags.replace('g', ''));
      const m = s.match(anchored);
      if (m) { quant = m[0]; body = s.slice(m[0].length); break; }
    }
  }
  if (!quant || !body || !body.trim()) {
    // [r318] 省略路径先试「的」字 NP 延长腿（模块级 _deLeg）：无 MOST 量词
    // 段如「认为公司有前途的员工都买了公司股票」——裸谓词扫描会把「认为
    // 公司」当 S、「前途的员工都买了公司股票」当 P（最右谓词「有」抢切），
    // 「的」字腿才是该形的正确切分（S=「认为公司有前途的员工」P=「买了
    // 公司股票」）。「的」形优先于谓词扫描，其次才走省略谓词腿。
    if (!isEN && opts && opts.chainQuant && opts.segHasMost === false) {
      const de = _deLeg(_stripLead(seg));
      if (de) return { quant: '', body: seg, raw: seg, S: de.S, P: de.P, verb: '', bound: '的', isEN: false };
    }
    // [r318] 结论省略量词腿（ZH）：中文传递谬误高频省略结论段量词——
     // 「喜欢甜食的人多数偏胖，多数偏胖的人有脂肪肝，所以喜欢甜食的人有
    // 脂肪肝」的结论段「喜欢甜食的人有脂肪肝」不含任何 MOST/ZHUJU 量词，
    // 旧路径整段 return null → 链式判定失去 C 件直接漏判。
    // 本腿在 MOST 全 miss 时兜底切分：body 呈「NP+有/患/得+Z」或
    // 「NP+谓词」形时切出 S/P（quant='' 标记省略形，供主链 C 件使用）。
    // 保守条件：必须出现 [r318] 省略腿谓词表（有/患/属于/是…）或
    // 「的」字 NP 形，否则不猜（裸名词段如「支持改革的人」不切，避免把
    // 非结论段误判成结论）。
    // [r319] 省略腿的启用门为双门 AND（chainQuant && segHasMost===false）：
    //   · chainQuant（全链预扫，只算 MOST/MOST_EN，**不算 ZHUJU_ZH**）：同链
    //     至少一段有 MOST 命中。注入 MOST_ZH=[] 时全链无 MOST → 门关 → 停火。
    //     r318 把 ZHUJU_ZH 也算进预扫，而它是独立常量、注入族清不掉，导致注入
    //     后预扫仍 true、省略腿兜底切分令停火失效（6 项回归统一根因）。
    //   · segHasMost===false（段级）：本段自身无 MOST 才走省略腿，有量词的段
    //     走显式量词路径（注入后 MOST miss 自然 null），避免同段既匹配量词又
    //     被省略腿兜底切出 statement 的双路径泄漏。
    if (!isEN && opts && opts.chainQuant && opts.segHasMost === false) {
      const b2 = _stripLead(seg);
      // 谓词扫描：取**最后一个**合理谓词位置（S 尽量长）——懒匹配 (.+?)
      //   只取最短前缀，会把「认为公司有前途的员工…」切成「认|为|公司…」
      //   （S 长度 1 被拒后直接 null，不会回溯）。改为对谓词表中每个词
      //   找所有出现位，取使 S>=2 且 P>=1 的**最右**位置：
      //   「认为公司有前途的员工都买了公司股票」→ 谓词「有」最右位在
      //   「公司|有|前途」，S=「认为公司」长度 4，P=「前途的员工都买了公司股票」。
      const PRED2 = ['患有', '患了', '属于', '包含', '包括', '含有', '有', '是', '为', '乃'];
      let best = null;
      for (const w of PRED2) {
        let from = 0;
        for (;;) {
          const i = b2.indexOf(w, from);
          if (i < 0) break;
          const S = b2.slice(0, i).replace(/[，,。；;、\s]+$/, '');
          const P = b2.slice(i + w.length).replace(/^[，,。；;、\s]+/, '');
          if (S.length >= 2 && P.length >= 1) {
            if (!best || i > best.i) best = { i, S, P };
          }
          from = i + 1;
        }
      }
      if (best) return { quant: '', body: b2, raw: b2, S: best.S, P: best.P, verb: '', bound: '', isEN: false };
    }
    return null;
  }
  body = body.trim();
  if (isEN) {
    const parsed = _parseEN(body);
    return { quant, body, S: parsed.S, P: parsed.P, verb: parsed.verb, bound: '', isEN: true };
  }
  // 中文：裸「的」开头（过半的读者）剥掉前导「的」；对冲词不挡边界切分
  // （「大多数A可能是C」剥掉「可能」才切得出谓项；豁免判定走 raw 原串）
  const b0 = body.replace(/^的+/, '');
  const b = b0.replace(/可能|也许|或许|大概|往往|通常|一般来说/g, '');
  // [r318] 「的」字 NP 延长腿（显式切分，提前 return）：「多数偏胖的人有
  // 脂肪肝」类——_findBound 取最早边界会把「偏|胖的人有脂肪肝」切开
  // （「胖」是 VERB1_ZH 单字谓词，idx=1 抢切），主项素材丢失导致中间项
  // 链接断。若 body 呈「X的Y[谓词…]」形（X 非空谓词性修饰、Y=1-4 字名词），
  // 主项取「X的Y」整段、谓项取其后的全部，保住「偏胖的人→有脂肪肝」链接。
  // 「有」不在 BOUND_ZH（AGENTS 约定：有害/认为会误切），故此腿不查边界词，
  // 直接按「的」位置切；X 为空（裸「的读者」形）不触发，走原路径。
  // Y 长度上限 4 且**懒匹配+右锚**（Y 后须接功能词/「有」类谓词或句尾）
  // ——否则「偏胖的人有脂肪肝」会把「人有脂肪」当 Y 整段吞掉（无锚点时
  // .{1,4} 贪婪吃满），切出「偏胖的人有脂肪|肝」的错位形。右锚词表是
  // 本腿局部常量（含「有」），刻意不复用全局 BOUND_ZH——「有」进全局表
  // 会误切「有害/认为」（AGENTS 约定），本腿只在「X的Y」形已成立时查，
  // 误切面可控。
  {
    const m = b.match(/^(.+?)的(.{1,4}?)(?=都是|皆是|全是|均是|都属于|就是|乃是|属于|都|是|会|能|可以|能够|将|在|也|还|就|才|便|被|把|让|使|即|得|已|仍然|依然|仍旧|仍|正|刚刚|再|又|有|无|属于|包含|包括|含有|患|得|患了|患有|$)/);
    if (m && m[1].length >= 1) {
      const headLen = m[0].length;
      const rest = b.slice(headLen);
      if (rest.length >= 1) {
        const S = b.slice(0, headLen).replace(/[，,。；;、\s]+$/, '');
        const P = rest.replace(/^[，,。；;、\s]+/, '');
        if (S && P) return { quant, body: b, raw: b0, S, P, verb: '', bound: '的', isEN: false };
      }
    }
  }
  const bound = _findBound(b, R);
  if (!bound) return { quant, body: b, raw: b0, S: b, P: '', verb: '', bound: '', isEN: false };
  const S = b.slice(0, bound.idx).replace(/[，,。；;、\s]+$/, '');
  let P = b.slice(bound.idx + bound.word.length).replace(/^[，,。；;、\s]+/, '');
  // 谓词只有边界词本身时（「城市房价高」——高 即谓词），P 收回边界词，
  // 否则整句退化成主项-only，中间项素材丢失
  if (!P) P = bound.word;
  if (!S) return { quant, body: b, raw: b0, S: b, P: '', verb: '', bound: bound.word, isEN: false };
  return { quant, body: b, raw: b0, S, P, verb: '', bound: bound.word, isEN: false };
}

// 英文谓词解析：copula 形 / 动词形（动词入 region 供中间项检索）。
// [r318] 三个补丁：①玩具形单字母主项（A/B/C）仍可切分——三 token 正则把
// 「A are B」整体吞进主项，链条直接断；②结论双 token 形（students game）
// 允许谓词后置，P 取尾词，主项取头部 NP；③mostly 量词后 NP 即主项。
function _parseEN(body) {
  // [r319] 中置 mostly 形（EN 量词后置腿，对应 ZH ZHUJU 后置腿）：「Reform
  // supporters mostly read news」——_parseMost 的量词剥除对 EN 段取首个
  // `most(?:ly)?` 匹配（无位置锚），中置 mostly 命中后剥掉它、body 只剩
  // 「read news」→ 主项丢失、链条断（缺口实证 D 族：EN mostly 形 pristine
  // 与 r318 在途两边都漏，round-188 攻击变体 EN mostly 形实测漏判）。
  // 本腿在 body 仍含中置 mostly 时把它当切分点：前半 NP 即主项、后半 VP
  // 即谓项，与 ZH 后置腿同构。走完本腿后不再走下面的谓词兜底正则。
  {
    const mid = body.match(/^(.+?)\s+(?:mostly|largely|mainly|primarily|chiefly)\s+(.+)$/i);
    if (mid && mid[1].trim().length >= 2 && mid[2].trim().length >= 1) {
      return { S: mid[1].trim(), P: mid[2].trim(), verb: '' };
    }
  }
  let m = body.match(/^(.+?)\s+(?:are|is)\s+(.+)$/i);
  if (m) return { S: m[1].trim(), P: m[2].trim(), verb: '' };
  m = body.match(/^(.+?)\s+(\w+(?:s|ed|en))\s+(.+)$/i);
  if (m) return { S: m[1].trim(), P: m[3].trim(), verb: m[2] };
  // 一般动词兜底（got/went/made…）：主项仍取懒匹配首段
  m = body.match(/^(.+?)\s+(\w+)\s+(.+)$/i);
  if (m) return { S: m[1].trim(), P: m[3].trim(), verb: m[2] };
  // [r318] 双 token 结论形（「students game」「voters read news」）：无动词
  // 边界可切，主项=首词、谓项=尾词，保住链式三件齐备
  m = body.match(/^([A-Za-z][A-Za-z'-]*)\s+(.+)$/i);
  if (m) return { S: m[1].trim(), P: m[2].trim(), verb: '' };
  return { S: body.trim(), P: '', verb: '' };
}

// 中文边界查找：功能词优先，双字动词次之，单字动词兜底；主项至少留 1 字。
// [r318] 「人喜欢甜食」类结构——量词已吃掉「大多数」，主项仅剩「人」、
// 谓词「喜欢」出现在第 2 字位置，但 consider 的 i<1 守卫只要求主项非空，
// 这里真实断点是谓词表里「喜欢」不在 VERB_ZH（有「爱」无「喜欢」），补进
// VERB_ZH 高频情感/行为词即可；同时 VERB1_ZH 的 /爱/ 兜底会切成「人|喜欢
// 甜食」也够用——真正卡住的是「人早起」型单字谓词在主项后第 2 字，/早/ 不
// 在 VERB1_ZH（有「起」相关词无「早」）。补这两个缺口即可覆盖。
function _findBound(body, R) {
  let best = null;
  const consider = (word, i) => {
    if (i < 1) return;
    if (!best || i < best.idx || (i === best.idx && word.length > best.word.length)) {
      best = { idx: i, word };
    }
  };
  for (const re of R.BOUND_ZH) {
    const m = body.match(re);
    if (m) consider(m[0], m.index);
  }
  for (const re of R.VERB_ZH) {
    const m = body.match(re);
    if (m) consider(m[0], m.index);
  }
  // [r319] 单字谓词层（VERB1_ZH）要求主项 ≥2 字：r318 把 26 个裸单字谓词
  // 从 VERB_ZH 移入本层（承重修正，注入族清 VERB1_ZH 即可停火）后暴露新误切
  // ——「订阅用户打开了邮件」里 /用/ 命中 index=1，切成 S=「订阅」P=「户打开
  // 了邮件」（round-188 攻击变体「超过八成…点击了链接」实测回归）。功能词/
  // 双字谓词层主项 1 字即可（「人都买了股票」），但单字谓词无词长佐证，主项
  // 仅 1 字时大概率是双字词内部误配（订阅/使用/利用/费用/作用…），故抬到
  // i>=2。代价：量词后紧跟「单字主项+单字谓词」（如「人早起」里「早起」的
  // 早）退回无边界路径，该形由 VERB_ZH 双字词层覆盖（「早起」未入表则整句
  // 走 S=body 保守路径，不产生错切）。
  for (const re of R.VERB1_ZH) {
    const m = body.match(re);
    if (m && m.index >= 2) consider(m[0], m.index);
  }
  return best;
}

// ─── 关键词共享（grams 直子串 / EN 词集 + 词干）────────────────────
function _zhGrams(s) {
  const clean = String(s).replace(/[，。！？；：、,.!?;:()""''\s]/g, '');
  const set = new Set();
  for (let len = 2; len <= 4 && len <= clean.length; len++) {
    for (let i = 0; i + len <= clean.length; i++) {
      const g = clean.slice(i, i + len);
      let allStop = true;
      for (const ch of g) { if (!ZH_STOP.has(ch)) { allStop = false; break; } }
      if (!allStop) set.add(g);
    }
  }
  return [...set];
}

function _enWords(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 1 && !EN_STOP.has(w));
}

// [r318] 玩具形单字母链（Most A are B. Most B are C. …）专用：_enWords 的
// length>1 守卫让 A/B/C 全部出局，链条三件的中间项链接恒断。此处显式收
// 单字母词（仅当两侧都只有单字母可用时生效，不影响自然语言路径——自然
// 语言句 _enWords 总能给出多字母词，先命中自然路径即返回）。
// 注：独立停用表（EN_SYM_STOP）而非复用 EN_STOP——EN_STOP 含 'a'/'b'/'c'/
// 'i' 等，会把玩具链符号整体过滤空。EN_SYM_STOP 只排自然语言功能单字母词
// （a/i 冠词与主语代词），保留 A/B/C/D/X/Y/Z 符号链。
const EN_SYM_STOP = new Set(['a', 'i']);
function _enSymbols(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length === 1 && !EN_SYM_STOP.has(w));
}

function _share(a, b, isEN) {
  if (!a || !b) return null;
  if (isEN) {
    const wb = new Set(_enWords(b));
    for (const w of _enWords(a)) {
      if (wb.has(w)) return w;
      if (w.length >= 4) {
        const st = w.slice(0, 4);
        for (const v of wb) if (v.length >= 4 && v.slice(0, 4) === st) return w;
      }
    }
    // [r318] 玩具形单字母链回退（Most A are B. Most B are C. Therefore most
    // A are C.）：自然词路径（length>1）全空时按单字母共享词匹配，使 A/B/C
    // 符号链的中间项链接可判。仅在自然路径无果时生效，良性句不受影响。
    const sb = new Set(_enSymbols(b));
    for (const w of _enSymbols(a)) {
      if (sb.has(w)) return w;
    }
    return null;
  }
  for (const g of _zhGrams(a)) if (b.includes(g)) return g;
  const ca = String(a).replace(/[，。！？；：、,.!?;:()\s]/g, '');
  const cb = String(b).replace(/[，。！？；：、,.!?;:()\s]/g, '');
  if (ca.length === 1 && cb.includes(ca)) return ca;
  if (cb.length === 1 && ca.includes(cb)) return cb;
  // 玩具形/极短项（A/B/C、高）无 2-grams 可共享——按非停用单字回退，
  // 否则「大多数A是B，大多数B是C所以大多数A是C」整族漏判（r188 实测）
  if (ca.length <= 2) {
    for (const ch of ca) {
      if (ZH_STOP.has(ch)) continue;
      if (cb.includes(ch)) return ch;
    }
  }
  return null;
}

function _shareEither(a, b, isEN) {
  return _share(a, b, isEN) || _share(b, a, isEN);
}

// 最长共享片段长度（ZH grams / EN 词长）——「结论谓项是否只是复述第一段
// 谓项」的判据用：≥3 字或互为子串才算复述（2 字巧合共享如「公司」不算）。
function _shareLen(a, b, isEN) {
  if (!a || !b) return 0;
  if (isEN) {
    const wb = new Set(_enWords(b));
    let best = 0;
    for (const w of _enWords(a)) {
      if (wb.has(w)) best = Math.max(best, w.length);
      else if (w.length >= 4) {
        const st = w.slice(0, 4);
        for (const v of wb) if (v.length >= 4 && v.slice(0, 4) === st) best = Math.max(best, 4);
      }
    }
    return best;
  }
  let best = 0;
  for (const g of _zhGrams(a)) if (b.includes(g)) best = Math.max(best, g.length);
  return best;
}

function _contains(a, b) {
  const ca = String(a).replace(/[，。！？；：、,.!?;:()\s]/g, '');
  const cb = String(b).replace(/[，。！？；：、,.!?;:()\s]/g, '');
  if (!ca || !cb) return false;
  return ca.includes(cb) || cb.includes(ca);
}

function _anyHit(res, text) {
  for (const re of res) if (re.test(text)) return true;
  return false;
}

function _firstHit(res, text) {
  for (const re of res) {
    const m = text.match(re);
    if (m) return { word: m[0], idx: m.index };
  }
  return null;
}

/**
 * 「大多数」链式传递谬误检测。
 * @param {string} text
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMostTransitivity(text, inject) {
  if (!text || text.length < 8) return _pass();
  const R = inject || {};
  const MOSTZ = R.MOST_ZH || MOST_ZH, MOSTE = R.MOST_EN || MOST_EN;
  const BND = R.BOUND_ZH || BOUND_ZH, VB = R.VERB_ZH || VERB_ZH, VB1 = R.VERB1_ZH || VERB1_ZH;
  const IFZ = R.INFER_ZH || INFER_ZH, IFE = R.INFER_EN || INFER_EN;
  const PMZ = R.PREMISE_ZH || PREMISE_ZH, PME = R.PREMISE_EN || PREMISE_EN;
  const META = R.META_CONCEPT || META_CONCEPT, TCH = R.TEACH || TEACH, HDG = R.HEDGE || HEDGE;
  const ZJZ = R.ZHUJU_ZH || ZHUJU_ZH;  // 仅 _parseMost 后置腿用（经 R 透传）
  const cfg = { MOST_ZH: MOSTZ, MOST_EN: MOSTE, BOUND_ZH: BND, VERB_ZH: VB, VERB1_ZH: VB1 };

  // 全文级守卫：概念转述 / 教学语境 / 对冲 / 疑问句
  if (_anyHit(META, text)) return _pass();
  if (_anyHit(TCH, text)) return _pass();
  if (/[?？]/.test(text)) return _pass();

  // [r319] 段级量词门 + 全链预扫门双门（AND）：
  //   ① 全链预扫 chainQuant：同链至少一段有 MOST/MOST_EN 量词命中（**不含
  //      ZHUJU_ZH**——它是独立常量，round-188 注入族只清 MOST_ZH，含它会让
  //      注入后预扫仍为 true，省略腿兜底切分令停火失效，r318 实测 6 项回归
  //      的统一根因）。
  //   ② 段级门 segHasMost===false：本段自身无 MOST 命中才走省略腿（有量词的
  //      段走显式量词路径，注入后 MOST miss 自然 null）。
  // 双门 AND 后：注入 MOST_ZH=[] → chainQuant=false → 省略腿全关 → 停火；
  // 真实省略结论（结论段无量词、前提段有 MOST）→ 两门皆过 → 兜底生效。
  const stmts = [];
  const segs = _segments(text);
  const chainQuant = segs.some(sg => _firstHit(MOSTZ, sg) || _firstHit(MOSTE, sg));
  for (let si = 0; si < segs.length; si++) {
    const seg = segs[si];
    const segHasMost = !!(_firstHit(MOSTZ, seg) || _firstHit(MOSTE, seg));
    const opts = { segHasMost, chainQuant };
    const inf = _firstHit(IFZ, seg) || _firstHit(IFE, seg);
    if (inf) {
      const after = seg.slice(inf.idx + inf.word.length);
      const c = _parseMost(after, cfg, opts);
      if (c) stmts.push(Object.assign({ segIdx: si }, c, { concl: true, hasInfer: true }));
      const before = seg.slice(0, inf.idx);
      const p = _parseMost(before, cfg, opts);
      if (p) stmts.push(Object.assign({ segIdx: si }, p, { concl: false, hasInfer: false }));
      continue;
    }
    const pm = _firstHit(PMZ, seg) || _firstHit(PME, seg);
    const p = _parseMost(pm ? seg.slice(pm.idx + pm.word.length) : seg, cfg, opts);
    if (p) stmts.push(Object.assign({ segIdx: si }, p, { concl: false, hasInfer: false }));
  }

  const hits = [];
  for (const C of stmts) {
    if (!C.S || !C.P) continue;                       // 结论须主谓俱全
    if (_anyHit(HDG, C.raw || (C.S + C.P))) continue; // 对冲结论不判（看原串）
    // 结论资格：带推断词（任意位置，覆盖倒装）或跟句模式（位于两前提之后）
    let found = null;
    for (const P1 of stmts) {
      if (P1 === C || !P1.P || !P1.S) continue;       // P1 谓项非空（中间项素材）
      if (!C.hasInfer && C.segIdx <= P1.segIdx) continue;
      for (const P2 of stmts) {
        if (P2 === C || P2 === P1 || !P2.S) continue;
        if (!C.hasInfer && C.segIdx <= P2.segIdx) continue;
        // 件② 中间项连续性：P2 主项（含其边界词）包含 P1 谓项关键词
        // （EN 的谓词动词在 verb 字段，中间项常落在动词上——passed）
        const src1 = P1.isEN ? ((P1.verb ? P1.verb + ' ' : '') + P1.P) : P1.P;
        const region2 = P2.isEN ? (P2.S + ' ' + (P2.verb || '')) : (P2.bound + P2.S);
        const mid = _share(src1, region2, P1.isEN);
        if (!mid) continue;
        // 件③a 结论主项回指 P1 主项
        if (!_shareEither(C.S, P1.S, C.isEN)) continue;
        // 件③b 结论谓项是新内容（非复述第一段谓项：最长共享≥3字或互为子串
        // 才算复述——2 字巧合共享如「公司」不拦，r188 实测）
        if (_shareLen(C.P, P1.P, C.isEN) >= 3 || _contains(C.P, P1.P)) continue;
        // 件③c 结论整体与 P2 有共享关键词（内容接在第二段上）；玩具形
        ///（A/B/C）无 2-grams 可共享，结论谓项↔第二段全文亦算链接
        const cFull = C.isEN ? (C.S + ' ' + (C.verb || '') + ' ' + C.P) : (C.S + C.bound + C.P);
        const p2Full = P2.isEN ? (P2.S + ' ' + (P2.verb || '') + ' ' + P2.P) : (P2.bound + P2.S + P2.P);
        if (!_share(cFull, p2Full, C.isEN) && !_share(C.P, p2Full, C.isEN)) continue;
        found = { P1, P2, C, mid };
        break;
      }
      if (found) break;
    }
    // 每个结论记一处（多个链式结论才计多处）
    if (found) hits.push(found);
  }

  if (!hits.length) return _pass();

  const count = hits.length;
  const first = hits[0];
  let score = first.C.isEN ? 0.60 : 0.62;
  if (first.C.hasInfer) score += 0.05;
  score += Math.min(0.02 * (count - 1), 0.08);
  score = Math.min(score, 0.75);

  const detail = '「大多数」链式传递×' + count + '处(' + (first.C.isEN ? 'en' : 'zh') + ')' +
    '：由「' + first.P1.S.slice(0, 12) + '→' + first.P1.P.slice(0, 12) + '」' +
    '「' + first.P2.S.slice(0, 12) + '→' + first.P2.P.slice(0, 12) + '」' +
    '推「' + first.C.S.slice(0, 12) + '→' + first.C.P.slice(0, 12) + '」——' +
    '两个「大多数」前提的证据不能沿中间项累积，most 不满足传递性';
  return { hit: true, score, detail, count };
}

module.exports = {
  checkMostTransitivity,
  __internals: () => ({
    MOST_ZH, MOST_EN, BOUND_ZH, VERB_ZH, VERB1_ZH,
    INFER_ZH, INFER_EN, PREMISE_ZH, PREMISE_EN,
    META_CONCEPT, TEACH, HEDGE, ZH_STOP, EN_STOP,
    _segments, _parseMost, _findBound, _parseEN, _share, _shareEither,
    _shareLen, _contains, _anyHit, _firstHit,
  }),
};
