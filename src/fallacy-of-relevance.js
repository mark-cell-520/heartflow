/**
 * src/fallacy-of-relevance.js — 「不相干结论」检测器
 * （第 230 个判别维度，r254 立项）
 *
 * [r254 立项] decision 本体在当前引擎（v6.8.153，229 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项依据：
 *   · 缺口实证（/tmp/probe-for.js，直调 gate.js v6.8.153）：本族 7 条攻击
 *     样本中英文两条**真零命中**（gate.action=pass，零维度代拦）——
 *     "The company plants many trees, so its financial reports must be
 *     honest." 与 "He is a great father, thus his business decisions must
 *     be sound."；中文 4 条虽被 halo_effect / absolute_claim /
 *     reasoning_coherence 代拦，但归因维度均非本族设计判据（halo 判
 *     「光环效应：一特质泛化到其他特质」、absolute 判「绝对化措辞」、
 *     coherence 判「推理链有没有前提/推论/结论标记」），本族判的是
 *     **两个主题域互不相干却用推断词连成因果/蕴含结论**。良性对照 3 条
 *     中 2 条 pass、1 条被 gate_block 拦（绝对化措辞，非本族射程）。
 *   · 外部来源（真实，未编造）：GitHub causalNLP/logical-fallacy
 *     （96★，https://github.com/causalNLP/logical-fallacy，Findings of
 *     EMNLP 2022 论文 "Logical Fallacy Detection" / arXiv:2202.13758，
 *     Jin, Lalwani, Vaidya, Shen, Ding, Lyu, Sachan, Mihalcea,
 *     Schoelkopf）的 Logic 数据集 13 类谬误分类。其 mappings.csv 给
 *     fallacy of relevance 的逻辑形式为：
 *       "It is claimed that X implies Y, whereas X is unrelated to Y"
 *     心虫 229 维已覆盖该数据集的 false dilemma / equivocation /
 *     circular reasoning / ad populum / strawman / ad hominem / faulty
 *     generalization / false causality 等族，fallacy of relevance 是
 *     其中唯一未被独立覆盖的类。心虫判据为自有纯规则实现（零 LLM 依赖，
 *     不引入该仓库的模型权重或 LLM 调用）。
 *     侦察落盘 /tmp/hf-scout-a.json、/tmp/hf-scout-b.json、/tmp/hf-gh.json、
 *     /tmp/hf-gh2.json、/tmp/hf-mappings.csv。
 *     同轮检索到的 arXiv 2405.02318（NL2FOL，258 分）依赖 LLM 生成 FOL，
 *     与心虫零 LLM 依赖铁律冲突，未集成，仅作方向印证。
 *
 * 辨别的族：不相干结论（fallacy of relevance / ignoratio elenchi，
 * 中文又称「不相干谬误」「推不出」）——**前提与结论主题域互不相干，
 * 却用推断词把两者连成有效的因果/蕴含结论**：
 *   「他工作很努力，所以他的产品一定很优秀。」
 *   「这家餐厅的服务员态度很好，可见他们的菜一定很好吃。」
 *   「他每天坚持跑步，所以他的英语水平一定很高。」
 *   The company plants many trees, so its financial reports must be
 *   honest.
 *   He is a great father, thus his business decisions must be sound.
 *
 * 与既有维度的边界（r254 归因，刻意错开）：
 *   · halo_effect（第179维）管**同一主体的特质间泛化**（一个光环特质
 *     推出另一个特质——「长得好看所以聪明」），前后共享同一主体、判据
 *     落在**特质迁移**上；本族管**两个主题域之间的不相干连接**，前后主
 *     体可以不同（餐厅服务 vs 菜品、种树 vs 财报），判据落在**主题域
 *     无共享实词 + 推断词伪装**上。
 *   · pseudo_causal / false_causality 管**有时间先后或共现的因果跳跃**
 *     （「A发生了然后B发生，所以A导致B」）；本族两段**不要求时间共现**，
 *     可以是同一时点两个完全无关的属性。
 *   · whataboutism（转移话题）与 soft_deflection（软性转移）管**回避
 *     当前问题**（不给出结论、把矛头转向别处）；本族**给出了结论**，
 *     缺陷在结论与前提不相干。
 *   · reasoning_coherence 管**推理链结构完整性**（有没有前提/推论/结论
 *     标记）；本族三段俱全、结构完整，缺的是**前提与结论的语义关联**。
 *   · hasty_generalization / anecdotal 管**证据量不足的归纳**；本族
 *     不是样本量问题，是**论题与论据不同域**。
 *   · affirming_the_consequent / undistributed_middle 管**形式无效的
 *     演绎**（条件句方向错、中项不周延）；本族连可检验的逻辑形式都
 *     没有——是**相关性缺失**，比形式谬误更底层。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① 话题锚点：句首（或「因为/由于/既然」引导的从句内）存在一个
 *     完整话题陈述，含**至少一个内容实词**（非停用词），构成论题。
 *   · 腿② 不相干结论：句末出现推断词（所以/因此/可见/因而/这说明/
 *     therefore/thus/so/hence）引导的结论段，结论段含**至少一个内容
 *     实词**，且结论段与前话题段**零共享实词**（相关词集合交集为空）。
 *   · 位置：推断词必须位于句中（前后都有实质内容），纯句首推断词
 *     （「所以，我们走吧」）不判——没有可比对的前提。
 *   · 豁免（全部可负例注入置空）：
 *     META_CONCEPT 谬误/不相干/相关性概念转述与教学、TEACH 教学语境、
 *     HEDGE 对冲结论（可能/也许/maybe/perhaps）、QUESTION 疑问句、
 *     SHARED 正当推论（前后有共享实词/回指——「他工作努力，所以他很
 *     努力」这类同义复述与「他很努力，因此得到晋升」的共词晋升链条
 *     都不判，因为存在语义关联）、NUMERIC 纯数值陈述桥接。
 *
 * 为什么取 VERIFY 级：结论本身**偶然可能为真**（努力的人产品确实可能
 * 优秀，只是这句话没给出有效支撑；另有真的相关情形，如「他很努力，
 * 因此项目进展顺利」——共词链条成立）。verify 的含义是「该结论与前提
 * 之间缺少可检验的语义关联，需补上桥接前提或其他证据」。与
 * r206-r253 同口径只登记 VERIFY。
 */
'use strict';

// ─── 腿②：推断词（把两段连成「有效结论」的伪装标记）────────────────────
// 中文：顺序即优先，长的在前。必须句中（前后都有实质内容）才算。
// 推断词（伪装因果的「所以/因此」族）——不相干结论的形式特征
// r256：补 `却想用这个证明`/`想借此证明`/`试图证明` 等"论证意图"族
// （原表只有"所以/因此/可见"等推论标记，答非所问类整族 miss）
const INFER_ZH = [
  /所以/,
  /因此/,
  /因而/,
  /故而/,
  /可见/,
  /可知/,
  /这说明/,
  /这表明/,
  /这证明/,
  /意味着/,
  /足以证明/,
  /足以说明/,
  /由此/,
  // r256：论证意图族——「却想用这个证明」「想借此证明」等不含推论
  // 标记但明确把前段当作论据的句式（答非所问类整族 miss 的根因）。
  // 顺序在前：长的优先匹配。
  /却想用这个证明/,
  /想用这个证明/,
  /想借此证明/,
  /想以此来证明/,
  /试图证明/,
  /企图证明/,
  /就是想证明/,
];

// 英文推断词。刻意不含句首 "So,"（口语起头无前提可比），要求
// 前后均有实质内容。句中 "so"（", so its ..."）是标准因果连接，收。
const INFER_EN = [
  /\btherefore\b/i,
  /\bthus\b/i,
  /\bhence\b/i,
  /\bconsequently\b/i,
  /\baccordingly\b/i,
  // r254：句中 so（前面必有逗号/分号隔开的内容段）
  /,\s+so\s+/i,
  /\bas\s+a\s+result\b/i,
  /\bwhich\s+(?:proves?|shows?|means?|demonstrates?)\b/i,
  /\bthis\s+(?:proves?|shows?|means?|demonstrates?)\b/i,
];

// ─── 前置引导词（话题锚点的从句标记）──────────────────────────────────
// 这些词引导前提从句；出现时把从句内容也计入话题锚点。
const PREMISE_CUE_ZH = [/因为/, /由于/, /既然/, /鉴于/, /虽说/, /尽管/, /虽然/];

// ─── 内容实词抽取：判断两段是否「零共享」────────────────────────────
// 停用词/功能词表（中文按字级过滤太粗，这里收常见虚词与推断功能词）。
// 目标：抽出的「实词」是承载主题的词汇（名词/动词/形容词性），
// 不含系词、量词、代词、推断词。
const STOP_ZH = new Set([
  '所以','因此','因而','故而','可见','可知','说明','表明','证明','意味着','足以','由此',
  '因为','由于','既然','鉴于','虽说','尽管','虽然','但是','可是','不过','然而','而且','并且',
  '这个','那个','这些','那些','我们','你们','他们','她们','它们','自己','别人','大家','一定','必须','肯定','确实','真的','很','太','非常','十分','特别','更加','越','更','最','挺','好','坏','对','错','是','有','在','和','跟','与','同','或','或者','还是','被','把','让','使','从','到','向','对','为','以','于','之','其','此','该','各','每','某','另','其他','其余','一些','一点','有点','有些','什么','怎么','怎样','如何','如果','要是','除非','只要','无论','不管','可能','也许','大概','或许','应该','应当','可以','能够','会','能','要','想','觉得','认为','知道','明白','理解','清楚','容易','难以','难于','值得','不','没','没有','别','勿','未','无','非','否','莫','毋',
]);

// 英文停用词 + 功能词（推断词/系词/冠词/代词/助动词/常见副词）。
const STOP_EN = new Set([
  'the','a','an','and','or','but','so','thus','therefore','hence','consequently','accordingly',
  'this','that','these','those','it','its','they','their','them','he','his','she','her','we','our','us','you','your','i','my','me',
  'is','are','was','were','be','been','being','am','do','does','did','has','have','had','will','would','shall','should','can','could','may','might','must','ought',
  'of','in','on','at','to','for','with','by','from','as','into','about','over','under','between','through','during','before','after','above','below','up','down','out','off','again','further','then','once',
  'not','no','nor','too','very','just','only','also','than','then','there','here','when','where','why','how','what','which','who','whom','whose','whether','while','because','since','although','though','if','unless','until','both','each','few','more','most','other','some','such','own','same','s','t','d','ll','m','re','ve','y',
  'all','any','every','each','much','many','many','lot','lots','kind','sorts','sort','thing','things','way','ways','really','actually','certainly','definitely','probably','possibly','perhaps','maybe','always','never','often','sometimes','usually',
  'proves','prove','shows','show','means','mean','demonstrates','demonstrate','implies','imply','therefore','says','said','makes','make','made','gets','get','got','goes','go','went','come','came','comes',
]);

// 中文实词抽取：连续 2 字以上非停用片段。
// 做法：按非汉字切分，再从长到短贪心匹配停用表；保留长度>=2 且非停用的
// 汉字段。长度 1 的汉字噪声大（「的」「是」「很」），不收。
//
// r254 教训：首版 2/3-gram 滑窗把「很好」「好吃」「定很好」当实词，
// 使「态度很好」与「菜一定很好吃」误判为共享 3 个词（攻击变体漏判）。
// 根因是**跨主题高频共现的修饰/评价语被当成主题实词**。
// 修正：EVAL_ZH 只收**纯评价性修饰语**（不承载主题、只给主题打分）——
// 刻意不收「努力」「态度」「认真」「进展」这类**可作主题**的词
// （「他工作很努力」里「努力」是主题实词，收进 EVAL 会让前提段实词被
// 吃光到只剩 1 个，反而把「努力→项目进展」这类正当因果桥接误判为
// 零共享——实测 3 例良性误报的成因）。
// 正当因果桥接另由 BRIDGE 豁免表处理（见下）。
const EVAL_ZH = new Set([
  '很好','不错','好吃','好看','优良','优秀','优异','优质','出色','卓越','杰出','突出','领先','先进','完美','理想','精彩','经典','一流','顶尖','顶级','最佳','最好','靠谱','过硬','扎实','牢固','稳固','稳定','可靠','可信','诚实','诚信','正直','公道','公正','公平','合理','合情','合法','规范','标准','正规','便宜','实惠','划算','昂贵','低廉','漂亮','美丽','靓','帅','酷','可爱','温柔','善良','友好','和善','和气','礼貌','文明','明显','显然','明确','清楚','清晰','透彻','深入','深刻','尖锐','敏锐','敏捷','灵活','机智','聪明','智慧','明智','理智','理性','清醒','冷静','沉着','镇定','从容','淡定','平静','安静','宁静','和谐','融洽','和睦','亲密','密切','紧密','深厚','真诚','诚恳','诚挚','坦诚','坦率','直率','爽快','痛快','果断','坚决','坚定','坚毅','坚韧','顽强','强烈','剧烈','激烈','强大','鲜明','显著','不得了','了不起','超群','超凡','绝伦','无双','无敌','霸气','强势','凶猛','猛烈',
]);
function extractZhWords(text) {
  const segs = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const out = new Set();
  for (const seg of segs) {
    if (STOP_ZH.has(seg) || EVAL_ZH.has(seg)) continue;
    // 对长段做 2-gram + 3-gram 切分（无词典的启发式切词）
    // r254 修正：短段（≤6 字）也做 2-gram 切分，不能整段收入——否则
    // 「猫是狗」(3字) 与 pre 的「猫都」(2字) 无法对齐，多前提句
    // 「所有猫都是哺乳动物，所有狗都是哺乳动物，所以猫是狗」被误判为
    // 零共享（实测 score 6800 触发 rewrite，抢了 undistributed_middle
    // 第229维的射程）。
    if (seg.length <= 6) {
      for (let i = 0; i < seg.length - 1; i++) {
        const bi = seg.slice(i, i + 2);
        if (!STOP_ZH.has(bi) && !EVAL_ZH.has(bi)) out.add(bi);
      }
      out.add(seg);
      continue;
    }
    for (let i = 0; i < seg.length - 1; i++) {
      const bi = seg.slice(i, i + 2);
      if (!STOP_ZH.has(bi) && !EVAL_ZH.has(bi)) out.add(bi);
      if (i < seg.length - 2) {
        const tri = seg.slice(i, i + 3);
        if (!STOP_ZH.has(tri) && !EVAL_ZH.has(tri)) out.add(tri);
      }
    }
  }
  // [r320] 拉丁字母/数字序列腿：中文句里的论题占位符（「大多数A是B，大多数B
  // 是C，所以至少有些A是C」的 A/B/C；「x1→x2→x3」链；「R1、R2」编号）是承载
  // 主题的符号，旧正则只抽汉字 → 占位符两侧各零实词 → 假「零共享」→ 良性特称
  // 结论被误推到 rewrite（round-188 存量债，pristine 同败）。统一 upper 归一
  // （「A」与「a」视为同一符号），不过停用表（占位符不是虚词）。
  // 安全边界：攻击句「所以大多数A是C」在汉字侧本就共享「大多数」，拉丁腿不
  // 改变其族归属——该形由 most_transitivity 判 verify，本维度零共享判据只管
  // 主题不相干，占位符句主题显然相干，放行是正确方向。
  for (const w of text.match(/[A-Za-z0-9]+/g) || []) {
    out.add(w.toUpperCase());
  }
  return out;
}

// 英文实词抽取：小写字母词，去停用表，保留长度>=3 的词干。
function extractEnWords(text) {
  const words = (text.toLowerCase().match(/[a-z]{3,}/g) || []);
  const out = new Set();
  for (const w of words) {
    if (STOP_EN.has(w)) continue;
    out.add(w);
  }
  return out;
}

// ─── 豁免表（负例注入可置空）──────────────────────────────────────────
// 谬误概念转述/教学（「不相干结论是指……」「fallacy of relevance is…」）
// ——讨论谬误本身不是犯谬误。
const META_CONCEPT = [
  /不相干/, /不相关/, /无关/, /推不出/, /不相干谬误/, /不相干结论/,
  /ignoratio\s+elenchi/i, /fallacy\s+of\s+relevance/i,
  /irrelevant\s+conclusion/i, /non\s+sequitur/i,
  /相关性/, /关联性/,
];

// 教学语境（课本/课堂/作业/例题/讲解）。
// r253 教训沿用：只收**句法性/动词性**标记，不收可当主语用的裸名词。
const TEACH = [
  /例如/, /比如/, /举例/, /举个/, /例题/, /课本里/, /教材里/, /课堂上/, /课堂里/,
  /老师(?:说|讲|在)/, /学生(?:问|答|在)/, /作业里/, /习题/, /讲解/, /假设/, /设想/, /反例/,
  /(?:for|as an?)\s+example/i, /for instance/i, /suppose/i, /consider/i,
  /in (?:this|the) (?:lecture|class|textbook)/i,
];

// 对冲结论——概率化/限定化的结论不作谬误判定。
const HEDGE = [
  /可能/, /也许/, /大概/, /或许/, /未必/, /不一定/, /恐怕/, /看来/,
  /似乎/, /好像/, /估计/, /倾向于/, /八成/, /多半/, /搞不好/,
  /maybe/i, /perhaps/i, /possibly/i, /probably/i, /might/i, /may\b/i,
];

// 疑问句——提问不是论证，不作判定。
const QUESTION = [
  /[?？]\s*$/,
  /^(?:难道|是否|能不能|可不可以|有没有|是不是|凭什么|为什么|怎么)/,
  /^(?:is|are|do|does|did|can|could|will|would|should|why|how|what|whether)\b/i,
];

// 纯数值/定义性桥接陈述（前后是同一事实的不同表述或数值换算）。
const NUMERIC_BRIDGE = [
  /^\s*[\d.,%￥$€£\s]+(?:等于|是|相当于)/,
  /^\s*[\d.,%￥$€£\s]+\s*(?:equals?|is|means?)\b/i,
];

// ─── [r271] 否定推断豁免 ──────────────────────────────────────────
// 「换一个赛道并不意味着过去的积累白费」——推断连接词本身被否定时，
// 句子是在**否认**一个推理（这正是正确推理形），不是不相干推断。
// r271 修复 round-646 D2 存量误伤（该样本被本维度推到 rewrite，
// 在 r270 之前的 HEAD 上已存在，git stash 对照实证）。
// 只做中文侧：英文否定连接词（this does not prove）不被 INFER_EN 切分，
// 整句豁免反而有压掉同句真谬误的风险，无实证承重故不收（注入删条只证 ZH）。
const NEGATED_INFER_ZH = [
  /(?:不|并未|并没有|未|没有|没什么|压根不|根本不|未必|绝不是)(?:能|能够|足以|会)?(?:意味着|代表|说明|表明|证明|推出)/,
  /(?:推不出|说明不了|证明不了|代表不了|意味不了)/,
];


// 正当因果桥接（r254）：前提段出现**投入/行为类**实词、结论段出现
// **产出/结果类**实词时，是日常语言里最常见、也最正当的因果陈述
// （努力→进展、投入→成果、续航→待机）。这类句子零共享是**正常的**
// ——因果链本来就连接两个不同主题。本族判的是「两个**不相干**主题被
// 推断词硬连」，不是「两个不同主题的因果连接」。
// 判据收紧到：投入词 + 结果词**成对出现**才豁免，单独的结果词不豁免
// （否则「他跑步，所以他成功」这类真不相干也会被放行）。
// r254 三次修正：首版 INVEST_ZH 收「坚持」「锻炼」等泛化行为词，使
// 「他每天坚持跑步，所以他的英语水平一定很高」这条**典型不相干**被
// 误豁免（跑步与英语水平零相关，但「坚持」命中投入词、「水平」命中
// 结果词）；二版删「努力」又使「他很努力→项目进展顺利」这条**正当
// 桥接**漏豁免（3 例良性误报）。
// 三次版判据：投入词收「努力/用心/认真」等**通用投入词**（它们与学业/
// 业绩类结果确有常识桥接），同时用 SPORT_INVEST 显式标记**体育投入**——
// 体育投入的产出域是体能/健康，**不桥接**学业/业绩类结果词，
// 因此体育句走不相干判定。两条路径互斥，各自承重。
const INVEST_ZH = [
  /努力/, /用心/, /认真/, /投入/, /付出/, /学习/, /研究/, /工作/,
  /训练/, /练习/, /钻研/, /深耕/, /积累/, /经验/, /准备/, /筹备/,
  /经营/, /管理/, /优化/, /改进/, /打磨/, /设计/, /创作/, /写作/,
  /编程/, /调试/, /实验/,
];
// 体育/体能投入：产出域是体能健康，与学业/业绩结果零桥接。
const SPORT_INVEST = [
  /跑步/, /锻炼/, /健身/, /游泳/, /瑜伽/, /打球/, /足球/, /篮球/,
  /羽毛球/, /乒乓球/, /登山/, /徒步/, /骑行/, /马拉松/, /晨跑/, /夜跑/,
  /jogging/i, /running/i, /workout/i, /gym\b/i, /swimming/i, /yoga/i,
  /cycling/i, /marathon/i,
];
const INVEST_EN = [
  /\b(?:hard[- ]?work(?:ing)?|efforts?|diligent\w*|dedicat\w+|invest\w*|committ\w+|practi[sc]\w+|train(?:ing)?|prepar\w+|striv\w+|study(?:ing)?|research\w*)\b/i,
];
const OUTCOME_ZH = [
  /进展/, /成果/, /成绩/, /成就/, /业绩/, /晋升/, /提升/, /进步/, /成功/,
  /完成/, /达成/, /实现/, /突破/, /产出/, /回报/, /收获/,
  /效果/, /效益/, /效率/, /质量/, /水平/, /能力/, /技能/, /表现/,
];
// 健康产出域（r255）：体育/体能投入的正当产出域。跑步→身体健康是
// 正当因果，但跑步→英语水平/业绩不是（后者走不相干判定）。
const HEALTH_OUTCOME_ZH = [
  /健康/, /身体/, /体能/, /体质/, /精力/, /体力/, /睡眠/, /免疫力/,
  /强壮/, /健壮/, /健硕/, /匀称/, /身材/, /体重/, /状态/,
];

// ─── 日常情境词（r256）───────────────────────────────────────────────
// 天气/时令/境况类客观陈述，直接影响说话人心境。只收**客观情境**，
// 不收「他的表现」「这家店」等可作评价主体的词（那是 halo 射程）。
const SCENE_ZH = [
  /天气/, /下雨/, /晴天/, /气温/, /温度/, /晚风/, /微风/, /阳光/, /月色/, /夜色/,
  /春天/, /夏天/, /秋天/, /冬天/, /清晨/, /早晨/, /傍晚/, /深夜/, /周末/, /假期/,
  /路上/, /窗外/, /街边/, /房间/, /家里/, /办公室/,
];

// ─── 第一人称心境词（r256）───────────────────────────────────────────
// 只收说话人自身可及的情绪/感受状态，且**必须**与 SCENE_ZH 成对出现
// 才豁免——单独出现（「他成绩很好」）不免责，留给 halo_effect。
const MOOD_ZH = [
  /心情/, /情绪/, /心境/, /睡意/, /困意/, /食欲/, /兴致/, /干劲/,
  /舒服/, /舒适/, /惬意/, /舒畅/, /开心/, /高兴/, /难过/, /失落/, /烦躁/, /焦虑/,
  /放松/, /踏实/, /振奋/, /低落/, /愉快/, /郁闷/, /享受/,
];
const OUTCOME_EN = [
  /\b(?:progress|results?|achievements?|success\w*|promot\w+|improv\w+|advance\w+|outcom\w+|performa\w+|efficien\w+|effectiv\w+|productivity|returns?|gains?|revenue|profits?|sales|earnings?|grow(?:th)?|reputation|credibility|trustworthiness)\b/i,
];

// 同义桥接（r254）：「电池续航很长，因此待机时间更久」是**同一技术
// 属性的同义改写**（续航≡待机时长），零共享纯属用词不同，不是不相干。
// 收录日常高频的等价属性词对：任一段命中左项、另一段命中右项即豁免。
const SYNONYM_PAIRS = [
  [/续航/, /待机/],
  [/美观/, /好看/],
  [/性能/, /速度/],
  [/价格/, /价钱/],
  [/容量/, /存储/],
  [/battery\s*life/i, /standby/i],
  [/durable/i, /sturdy/i],
  [/affordable/i, /cheap/i],
  [/performance/i, /speed/i],
];

// ─── 内部工具 ────────────────────────────────────────────────────────
function _MISS() {
  return { hit: false, score: 0, detail: '', count: 0 };
}

// 按推断词切分句子，返回 {pre, post, lang} 或 null。
// r254：判据需覆盖三种语序，缺一即漏判——
//   ① 正向（最常见）：「A，所以 B」→ pre=A, post=B
//   ② 倒装（结论先行）：「所以 B，A」→ 推断词在句首，pre 空、post 是
//      结论，但**逗号后还有前提**。处理：句首推断词时，把逗号后的内容
//      当作 pre（倒装语序的前提）。
//   ③ 让步后置（长句）：「Although A, Y as a result」→ 推断词在句尾，
//      pre 是逗号前的让步从句，post 是逗号后的结论。
// 因此不能只取「最靠前」的推断词，必须按语序通道分别切。
function _splitByInfer(text) {
  const all = [];
  for (const re of INFER_ZH) { const m = text.match(re); if (m) all.push({ idx: m.index, len: m[0].length, lang: 'zh' }); }
  for (const re of INFER_EN) { const m = text.match(re); if (m) all.push({ idx: m.index, len: m[0].length, lang: 'en' }); }
  if (!all.length) return null;
  all.sort((a, b) => a.idx - b.idx);

  // 通道① 正向：推断词前后都有实质内容
  for (const c of all) {
    const pre = text.slice(0, c.idx).trim();
    const post = text.slice(c.idx + c.len).trim();
    if (pre.length >= 4 && post.length >= 4) return { pre, post, lang: c.lang };
  }

  // 通道② 倒装：推断词在句首（pre <4），逗号后是前提
  const first = all[0];
  if (first.idx <= 2) {
    const rest = text.slice(first.idx + first.len).trim();
    // 找第一个逗号/分号，其后是倒装的前提段
    const cm = rest.match(/[,，;；]/);
    if (cm && cm.index > 3) {
      const post = rest.slice(0, cm.index).trim();
      const pre = rest.slice(cm.index + 1).trim();
      if (pre.length >= 4 && post.length >= 4) return { pre, post, lang: first.lang };
    }
  }

  // 通道③ 让步后置：推断词在句尾（post 为空/极短），真正的结论在
  // 逗号前。r254 修正：原实现要求 post.length>=4 才进入本通道，而句尾
  // 推断词（as a result / 因此）的 post 必然是空——于是 fallback 把 post
  // 设成整句 pre，导致 preWords==postWords、大量共享、恒不命中。
  // 正确做法：post 短时，用「最后一个逗号」切 pre 得 cond/concl。
  const last = all[all.length - 1];
  if (last.idx > text.length * 0.5) {
    const pre = text.slice(0, last.idx).trim();
    const post = text.slice(last.idx + last.len).trim();
    if (pre.length >= 8) {
      const cm = pre.match(/[,，;；](?=[^,，;；]*$)/);
      if (cm) {
        const cond = pre.slice(0, cm.index).trim();
        const concl = pre.slice(cm.index + 1).trim();
        if (cond.length >= 4 && concl.length >= 4) return { pre: cond, post: concl, lang: last.lang };
      }
      if (post.length >= 4) return { pre, post, lang: last.lang };
    }
  }
  return null;
}

// 合并前置引导从句到话题锚点（「因为A，所以B」→ pre 含 A）。
function _expandPremise(pre, lang) {
  let out = pre;
  if (lang === 'zh') {
    for (const re of PREMISE_CUE_ZH) {
      const m = out.match(re);
      if (m && m.index > 0) {
        // 从句引导词后的内容是前提核心，保留引导词后的片段
        out = out.slice(m.index + m[0].length);
      }
    }
  }
  return out;
}

// ─── 否定极性判别（r256）───────────────────────────────────────────────
// 中文 2-gram 切片会把「不支持」切成裸词根「支持」，该碎片与结论段的
// 肯定用法（「必须支持」）构成**语义相反**的词对，却被精确匹配与部分
// 包含两条通道同时计为共享——「诉诸恐惧」族中文形态因此整族 miss
// （r256 变体矩阵实测 1/9）。故在主判据前先用 regex 抽取前段否定词干
// （见 PRE_NEG_STEMS），结论段凡命中者一律不计共享，且否定词干上的
// 边缘字也不参与主体字对齐。
// 覆盖双向：前段否定/结论肯定（本族）、前段肯定/结论否定（反向论证）。
// 两侧同带否定（否定→否定）语义同向，仍照常计共享。
// 注：早先用「_negRootZh 词表剥离 + preWords 集合比对」实现过一版，
// 失败原因是「支持」作为 2-gram 碎片已在 preWords 里，精确匹配抢先
// 命中；改用从 pre 原文 regex 抽词干才覆盖到碎片通道。

/**
 * 主判别函数。
 * @param {string} text 已归一化文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFallacyOfRelevance(text) {
  if (typeof text !== 'string' || text.length < 6) return _MISS();

  // ── 豁免：谬误概念转述/教学 ──
  for (const re of META_CONCEPT) if (re.test(text)) return _MISS();
  // ── 豁免：教学语境 ──
  for (const re of TEACH) if (re.test(text)) return _MISS();
  // ── 豁免：疑问句 ──
  for (const re of QUESTION) if (re.test(text)) return _MISS();
  // ── [r271] 否定推断豁免 ──
  for (const re of NEGATED_INFER_ZH) if (re.test(text)) return _MISS();
  // ── 豁免：数值/定义桥接 ──
  for (const re of NUMERIC_BRIDGE) if (re.test(text)) return _MISS();

  const sp = _splitByInfer(text);
  if (!sp) return _MISS();

  const pre = _expandPremise(sp.pre, sp.lang);
  const post = sp.post;

  // 腿①：话题锚点至少一个内容实词
  const preWords = sp.lang === 'zh' ? extractZhWords(pre) : extractEnWords(pre);
  if (preWords.size < 1) return _MISS();

  // 腿②：结论段至少一个内容实词
  const postWords = sp.lang === 'zh' ? extractZhWords(post) : extractEnWords(post);
  if (postWords.size < 1) return _MISS();

  // 对冲结论豁免（只看结论段，避免误杀正当前提）
  for (const re of HEDGE) if (re.test(post)) return _MISS();

  // ── 豁免：同义桥接（同一属性的不同说法，r254）──
  for (const [a, b] of SYNONYM_PAIRS) {
    if ((a.test(pre) && b.test(post)) || (b.test(pre) && a.test(post))) return _MISS();
  }

  // ── 豁免：健康产出域（r255，独立于投入词）──
  // 「她每天跑步，因此身体很健康」「坚持锻炼，所以睡眠质量很好」——
  // 体育/体能投入的健康产出链，零共享是正常形态。本豁免只要求
  // **前段有体育投入词 + 结论段在健康域**，不依赖通用投入词
  // （「跑步」本身不在 INVEST_ZH，r254 的 investHit 门槛使它漏豁免）。
  // 反面仍判不相干：体育投入 × 非健康结论（跑步→英语水平/业绩/成绩）
  // 不进本豁免，走核心零共享判据。
  if (sp.lang === 'zh' &&
      SPORT_INVEST.some(re => re.test(pre)) &&
      HEALTH_OUTCOME_ZH.some(re => re.test(post))) return _MISS();

  // ── 豁免：正当因果桥接（投入词 × 结果词成对）──
  // r254：因果链本就连接两个不同主题，零共享是正常形态。只有「投入类
  // 行为 → 产出类结果」的成对结构才豁免；单独结果词不豁免。
  const investHit = sp.lang === 'zh'
    ? INVEST_ZH.some(re => re.test(pre))
    : INVEST_EN.some(re => re.test(pre));
  if (investHit) {
    // 体育投入不桥接学业/业绩结果（r254：跑步→英语水平是典型不相干）。
    // 体育→健康的正当链由上方的 HEALTH_OUTCOME_ZH 独立豁免覆盖。
    const sportHit = SPORT_INVEST.some(re => re.test(pre));
    if (!sportHit) {
      const outcomeHit = sp.lang === 'zh'
        ? OUTCOME_ZH.some(re => re.test(post))
        : OUTCOME_EN.some(re => re.test(post));
      if (outcomeHit) return _MISS();
    }
  }

  // ── 豁免：日常情境 → 自身心境（r256）──
  // 「今天天气不错，所以心情很好」——天气/时令/境况类客观陈述直接
  // 影响说话人自身情绪，是正当因果而非不相干结论。判据：前段命中
  // 情境词，且结论段限定在**第一人称可及的心境词**（不收「他成绩
  // 很好」这类可评价他人的结果词——那是 halo_effect 射程）。
  // 注意：本豁免要求两段同时命中，单独心境词不豁免。
  if (sp.lang === 'zh' &&
      SCENE_ZH.some(re => re.test(pre)) &&
      MOOD_ZH.some(re => re.test(post))) return _MISS();

  // ── 核心判据：零共享实词 ──
  // r256 否定极性：中文 2-gram 切片会把「不支持」切成裸词根「支持」，
  // 该碎片与结论段的肯定用法（「必须支持」）构成**语义相反**的词对，
  // 却被精确匹配与部分包含两条通道同时计为共享——「诉诸恐惧」族中文
  // 形态因此整族 miss（r256 变体矩阵实测）。故先把前段否定词干收集成
  // 集合，结论段凡命中者（含被部分包含捞回的）一律不计共享。
  // 覆盖双向：前段否定/结论肯定（本族）、前段肯定/结论否定（反向论证）。
  // 两侧同带否定（否定→否定）语义同向，仍照常计共享。
  const PRE_NEG_STEMS = new Set();
  for (const m of pre.matchAll(/[不没无未][\u4e00-\u9fa5]{1,3}/g)) {
    const stem = m[0].slice(1);
    if (stem.length >= 2) PRE_NEG_STEMS.add(stem);
  }
  let shared = 0;
  for (const w of postWords) {
    // 通道①：结论段裸词命中前段否定词干（含被部分包含捞回的长词）
    if (PRE_NEG_STEMS.has(w)) continue;
    let incHit = false;
    for (const s of PRE_NEG_STEMS) { if (w.length >= 2 && w.includes(s)) { incHit = true; break; } }
    if (incHit) continue;
    if (preWords.has(w)) { shared++; continue; }
    // 部分包含（「产品」vs「产品部」）也算共享，避免切词噪声误判
    for (const p of preWords) {
      if (p.length >= 2 && w.length >= 2 && (p.includes(w) || w.includes(p))) { shared++; break; }
    }
  }

  // r254 修正：**主体字首尾对齐**——中文里结论段双字段的首字/尾字若
  // 在前提段双字段的同侧位置复用，通常是同一主体。
  // 「所有猫都是哺乳动物，所有狗都是哺乳动物，所以猫是狗」的结论
  // 「猫是狗」→ 2-gram「猫是/是狗」，首字「猫」正是 pre 中「猫都」的
  // 首字（同一主体猫的复用），而双向 includes 不成立导致零共享误判
  // （实测 score 6800 触发 rewrite，抢了 undistributed_middle 第229维
  // 射程）。
  // 注意：不能放宽到「任一汉字」——「他」「产」「品」等高频字会让
  // 「他工作很努力，所以他的产品一定很优秀」这类真不相干全灭
  // （r254 实测 4/9）。必须限定**双字段首字或尾字同侧复用**。
  // r255 修正：**虚词字符不参与主体字对齐**。原规则（r254）只排除了
  // 部分情况，仍有两类假主体让本族最典型的中文形态整族零命中
  // （r254 实测中文 4 条全靠 halo/absolute/coherence 代拦，本维度独立
  // 命中 0；r255 修复「跑步→英语」后又发现第 2 类）：
  //   ① 人称/指示代词：「她每」的首字「她」vs 结论段「她的」的首字「她」
  //      ——「她每天跑步，所以她的英语水平一定很高」被误拦。
  //   ② 程度/语气副词：pre「态度很好」的尾字「很」vs 结论段「一定很」
  //      的尾字「很」同侧复用——「他工作很努力，所以他的产品一定很
  //      优秀」「服务员态度很好，可见他们的菜一定很好吃」被误拦。
  // 代词与副词都不是"实义主体"，是回指标记/程度修饰。排除后，主体字
  // 对齐仍保留其原有用途（「所有猫都是哺乳动物…所以猫是狗」的猫/狗
  // 同侧复用仍被拦，避免抢第229维 undistributed_middle 射程）。
  const PRONOUN_CHAR = new Set([
    '她', '他', '它', '你', '您', '我', '咱', '们', '这', '那', '其',
    '很', '太', '都', '也', '就', '才', '更', '最', '挺', '好', '不', '没',
    '一', '定', '必', '须', '或', '又', '再', '还', '被', '把', '让', '使',
    // r255：结构助词「的/地/得」与介词尾字同样是假主体——pre「厅的」
    // 尾字「的」vs 结论段「的菜」首字「的」同侧复用，会把
    // 「服务员态度很好，可见他们的菜一定很好吃」整句误拦。
    '的', '地', '得', '在', '和', '跟', '与', '同', '为', '以', '于', '之',
  ]);
  if (shared === 0 && sp.lang === 'zh') {
    // r256：否定词干上的边缘字不参与主体字对齐——post「必须支持」的
    // 尾字「持」与 pre「不支持」的尾字同侧复用，会把「诉诸恐惧」族
    // （不支持…所以必须支持）整族误拦。否定词干正是极性反向的载体，
    // 其边缘字对齐同样是假共享。
    const NEG_EDGE = new Set();
    for (const s of PRE_NEG_STEMS) { NEG_EDGE.add('H:' + s[0]); NEG_EDGE.add('T:' + s[s.length - 1]); }
    const preEdges = new Set();
    for (const p of preWords) {
      if (p.length >= 2) { preEdges.add('H:' + p[0]); preEdges.add('T:' + p[p.length - 1]); }
    }
    for (const w of postWords) {
      if (w.length < 2) continue;
      if (PRONOUN_CHAR.has(w[0]) || PRONOUN_CHAR.has(w[w.length - 1])) continue;
      if (PRE_NEG_STEMS.has(w) || [...PRE_NEG_STEMS].some(s => w.includes(s))) continue;
      const hk = 'H:' + w[0], tk = 'T:' + w[w.length - 1];
      if (NEG_EDGE.has(hk) || NEG_EDGE.has(tk)) continue;
      if (preEdges.has(hk) || preEdges.has(tk)) { shared++; break; }
    }
  }

  if (shared > 0) return _MISS();

  // 双腿成立：零共享 + 推断词伪装
  const postList = [...postWords].slice(0, 4).join('/');
  const score = 68;
  return {
    hit: true,
    score,
    detail: `不相干结论(前提段实词${preWords.size}个×结论段实词${postWords.size}个×零共享:${postList})`,
    count: 1,
  };
}

module.exports = { checkFallacyOfRelevance, extractZhWords, extractEnWords };
