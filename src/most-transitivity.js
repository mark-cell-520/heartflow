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
  /(?:the\s+|a\s+)?(?:majority\s+of|most(?:\s+of)?)\s+(?:the\s+)?/i,
];

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
];

// ─── 主项/谓项切分：单字动词/形容词（最低优先，仍需主项非空）──────────
const VERB1_ZH = [
  /买/, /点/, /领/, /读/, /写/, /看/, /吃/, /听/, /爱/, /恨/, /病/, /痛/,
  /累/, /忙/, /高/, /低/, /多/, /少/, /大/, /小/, /好/, /差/, /强/, /弱/,
  /快/, /慢/, /贵/, /贱/, /富/, /穷/, /美/, /丑/, /帅/, /蠢/, /笨/, /懒/,
  /渴/, /饿/, /冷/, /热/, /疼/, /痒/, /瘦/, /胖/, /香/, /臭/, /新/, /旧/,
  /老/, /嫩/, /生/, /熟/, /真/, /假/, /对/, /错/, /输/, /赢/, /成/, /败/,
  /升/, /降/, /涨/, /跌/,
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

// ─── MOST 片段解析：量词开头 → 切主项/谓项 ────────────────────────
function _parseMost(seg, R) {
  const s = _stripLead(seg);
  if (!s) return null;
  const isEN = /[a-zA-Z]/.test(s) && !/[\u4e00-\u9fff]/.test(s);
  let quant = null, body = null;
  for (const re of (isEN ? R.MOST_EN : R.MOST_ZH)) {
    const m = s.match(re);
    if (m) { quant = m[0]; body = s.slice(m.index + m[0].length); break; }
  }
  if (!quant || !body || !body.trim()) return null;
  body = body.trim();
  if (isEN) {
    const parsed = _parseEN(body);
    return { quant, body, S: parsed.S, P: parsed.P, verb: parsed.verb, bound: '', isEN: true };
  }
  // 中文：裸「的」开头（过半的读者）剥掉前导「的」；对冲词不挡边界切分
  // （「大多数A可能是C」剥掉「可能」才切得出谓项；豁免判定走 raw 原串）
  const b0 = body.replace(/^的+/, '');
  const b = b0.replace(/可能|也许|或许|大概|往往|通常|一般来说/g, '');
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

// 英文谓词解析：copula 形 / 动词形（动词入 region 供中间项检索）
function _parseEN(body) {
  let m = body.match(/^(.+?)\s+(?:are|is)\s+(.+)$/i);
  if (m && _enWords(m[1]).length) return { S: m[1].trim(), P: m[2].trim(), verb: '' };
  m = body.match(/^(.+?)\s+(\w+(?:s|ed|en))\s+(.+)$/i);
  if (m && _enWords(m[1]).length) return { S: m[1].trim(), P: m[3].trim(), verb: m[2] };
  // 一般动词兜底（got/went/made…）：主项仍取懒匹配首段
  m = body.match(/^(.+?)\s+(\w+)\s+(.+)$/i);
  if (m && _enWords(m[1]).length) return { S: m[1].trim(), P: m[3].trim(), verb: m[2] };
  return { S: body.trim(), P: '', verb: '' };
}

// 中文边界查找：功能词优先，双字动词次之，单字动词兜底；主项至少留 1 字
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
  for (const re of R.VERB1_ZH) {
    const m = body.match(re);
    if (m) consider(m[0], m.index);
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
  const cfg = { MOST_ZH: MOSTZ, MOST_EN: MOSTE, BOUND_ZH: BND, VERB_ZH: VB, VERB1_ZH: VB1 };

  // 全文级守卫：概念转述 / 教学语境 / 对冲 / 疑问句
  if (_anyHit(META, text)) return _pass();
  if (_anyHit(TCH, text)) return _pass();
  if (/[?？]/.test(text)) return _pass();

  // 逐片段解析 MOST 陈述（结论 / 前提两用）
  const stmts = [];
  const segs = _segments(text);
  for (let si = 0; si < segs.length; si++) {
    const seg = segs[si];
    const inf = _firstHit(IFZ, seg) || _firstHit(IFE, seg);
    if (inf) {
      const after = seg.slice(inf.idx + inf.word.length);
      const c = _parseMost(after, cfg);
      if (c) stmts.push(Object.assign({ segIdx: si }, c, { concl: true, hasInfer: true }));
      const before = seg.slice(0, inf.idx);
      const p = _parseMost(before, cfg);
      if (p) stmts.push(Object.assign({ segIdx: si }, p, { concl: false, hasInfer: false }));
      continue;
    }
    const pm = _firstHit(PMZ, seg) || _firstHit(PME, seg);
    const p = _parseMost(pm ? seg.slice(pm.idx + pm.word.length) : seg, cfg);
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
    _shareLen, _contains,
  }),
};
