/**
 * src/halo-effect.js — 「光环效应」检测器（第 179 个判别维度）
 *
 * [r181 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions / goalReviewed true；cognitiveLoad
 * 与 uncertainty 均为字符串 "unknown"，按轮次纪律不当实质背书）。轮前差距
 * 实测（/tmp/hf-probe-r181.js，直调 src/gate.js，v6.8.108 178 维引擎）：
 * 本族 6/6 攻击样本**穿过硬闸门且无任何维度代拦**（「他长得这么帅，人品
 * 肯定也没问题」「她是名校博士毕业，说的话一定更有道理」「这家公司装修
 * 得这么高档，产品技术肯定是一流的」「他口才这么好，做事能力一定也很强」
 * 「He is tall and handsome, so his judgment must be sound.」等全部 pass）；
 * 良性 3/3 干净。grep -rl 'halo' / '光环' src/ 为 0 命中——存量 178 维无
 * 一维覆盖「无关正面特征 → 质量/人品/观点」的迁移结构。
 * 外部来源（真实，未编造）：HN Algolia "attractiveness bias hiring" 命中
 * *Hacking attractiveness biases in hiring? The role of beautifying
 * photo-filters*（135 pts）；HN "halo effect" 命中 *Cognitive Bias Spotted
 * in the Wild: Halo Effect*（1 pt）；GitHub API "halo effect bias" 命中
 * ekateneva-code/the-news-coverage-of-civil-nuclear-energy ★1（研究数据
 * 仓库，主题为 The 'Halo' Versus 'Horn' Effect）与 henu-wang/bias-detector-9
 * ★0（Halo Effect Check 认知偏差检测工具）。Semantic Scholar 三次检索均
 * HTTP 429 限流，如实记录。以上来源均为概念背景；判据为心虫自有纯规则实现。
 *
 * 辨别的族：「光环效应」（halo effect / halo error，又译晕轮效应）——
 * **由一个无关的正面特征（外貌/名气/穿着/装修包装/平台品牌/口才嗓音等
 * 非认知特征）推断对象在另一维度上的质量、人品、能力或观点正确性**：
 *   他长得这么帅，人品肯定也没问题。
 *   这家公司装修得这么高档，产品技术肯定是一流的。
 *   他口才这么好，做事能力一定也很强。
 *   这 App 界面做得这么精致，底层架构肯定也差不了。
 *   He is tall and handsome, so his judgment must be sound.
 *   She is famous, so her advice must be reliable.
 *
 * 为什么这是判别者的核心缺口（对齐心虫目标「判断是非」）：光环是**判断
 * 偏差的入口形态**——评价者把一个维度上的好感（好看/有名/高档）未经论证
 * 地迁移到**与证据无关**的维度上（人品/技术/架构/观点对错），且迁移总以
 * 肯定情态封装（肯定/一定/想必/must be），看上去像结论，实则零证据。AI
 * 输出中的典型场景：产品评测被 UI 做工带偏、人选评估被口才外貌带偏、
 * 观点采信被讲者名气带偏。它不是某一个具体谬误，而是**一整类「以表象
 * 冒充属性」推理的共名**——存量维度各管一段（诉诸权威管资质、stereotype
 * 管群体归类、unsupported_claim 管断言强度），没有一个维度管这条迁移
 * 结构本身。
 *
 * 与既有维度的边界（r181 复量归因）：
 *   · appeal_to_authority 管「无据权威/排他权威」——本族腿①刻意**不收**
 *     权威/专家/资质/学历/头衔类词（名校/博士/获奖/执业——那是相关资质，
 *     归 appeal_to_authority 射程），只收外貌、名气、包装、品牌、口才等
 *     **与结论域无关**的特征。两族词表互斥，边界清晰。
 *   · stereotype 管群体归类归因；本族不涉及群体，是单个对象的特征迁移。
 *   · unsupported_claim / absolute_claim 管断言强度与依据缺失；本族有明确
 *     的「特征词 × 结论词 × 肯定情态」三件迁移结构。
 *   · flattery_pressure 管奉施压；本族无交际意图，是推理结构缺陷。
 *
 * 判据（三件共现，缺一不判）：
 *   · 腿① TRAIT 无关正面特征：外貌类（帅/漂亮/好看/英俊/面善/养眼/颜值
 *     高/高大/高挑）、声音风度类（声音好听/声音磁性/气质好/风度翩翩/举止
 *     得体/幽默/风趣/口才好/能说会道/会做人）、名气类（有名/出名/当红/
 *     网红/明星/大V/粉丝多/热搜/人气高/家喻户晓/如雷贯耳）、包装装修类
 *     （包装精美/封面好看/界面精致/设计精美/装修高档/地段好）、平台品牌
 *     类（大公司/大厂/名牌/奢侈品/五星级/奢华/高端/上档次/价格不菲/百年
 *     老店/进口品牌）、产品外观类（外观好看/做工精致/质感好/手感好）。
 *     EN tall / handsome / good-looking / attractive / beautiful / famous /
 *     celebrity / influencer / viral / premium packaging / sleek design /
 *     luxury brand / prestigious brand / great speaker / funny / witty。
 *     **161 轮教训：全部收裸名词形态**（同族词去掉前后缀仍独立命中——
 *     收「帅」而非只收「长得帅」，收「有名」而非只收「有名气」）。
 *   · 腿② TRANSFER 质量迁移断言，两种形：
 *     A 连接词形——连接词（所以/因此/可见/说明/证明/so/therefore/thus/
 *       which means）→ 结论名词（人品/能力/技术/质量/观点/判断/方案/产品/
 *       服务/架构/体验/quality/product/design/engineering/character……）
 *       → 肯定情态（肯定/一定/必然/想必/显然/势必/must be/certainly）。
 *     B 并置迁移形——腿①特征词 → [≤12字] → 结论名词 → [≤6字] → 肯定
 *       情态。这是最常见攻击形（「他长得这么帅，人品肯定也没问题」无连接
 *       词，仅靠并置完成迁移），必须收；情态词表**刻意不收「也」**——
 *       「她长得漂亮，成绩也很好」是并列陈述非迁移，收了会误伤。
 *   · 腿③ ORDER 顺序：A 形要求腿①命中早于腿②。
 *
 * 为什么取 VERIFY 级：单句可能是对无关特征的正确提示（「面试第一印象
 * 会影响判断，这是光环效应」是教学转述），也可能是把两个属性并置的正当
 * 陈述（「她长得漂亮，专业能力也十分出众」——无迁移情态，天然不判）。
 * verify 的含义是「这条把表象当属性的推断需要按维度拆分核查」——调用方
 * 应要求把特征与结论的证据分开再采信。与 r161-r180 全部评价/论证族同口径。
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   · 概念/教学转述（光环效应/晕轮效应/月晕效应/认知偏差/美貌偏见/以貌
 *     取人；EN halo effect / horn effect / cognitive bias / lookism——
 *     讨论这个偏差本身是正确判别；r181 设计：META 样本刻意带全套攻击结构
 *     在场，保证注入后陷阱真实翻转，不做偶然通过）；
 *   · 对比/转折与迁移否定（两腿间窗口 + 腿②后全文：但是/然而/不过/却/
 *     不等于/两回事/无关/不能因为/不代表/不应以；EN but / however /
 *     irrelevant / not because / don't judge / has nothing to do with——
 *     「虽然他口才好，但这和方案质量是两回事」是正确判别）；
 *   · 对冲弱化结论（可能/也许/或许/大概/似乎/不见得/未必/说不准/maybe/
 *     perhaps/might/probably——「可能人品也不错」是弱推测不是迁移断言）；
 *   · 疑问句（含 ?/？）。
 *
 * [r264] 全新措辞家族扩展（真升级②，如实记录落地率）：池化探针 5/5
 *   穿透中仅 1 项可落地——TRAIT_EN 补 大公司/大厂的英文形（big tech
 *   firm / major tech company / tech giant / big tech，TRAIT_ZH_BRAND
 *   早已收「大公司/大厂」，EN 侧缺同族词形）。未落地 4 项及原因：
 *   ① ③ ⑤（「他是大厂出来的，技术能差到哪去？」「拿过全国奖牌的，
 *   执行力能弱吗？」等）为修辞疑问句——疑问句豁免 + 腿②无肯定情态，
 *   两重设计性不判，不为单族发明修辞疑问判据；② ④（「名校毕业的，
 *   人品肯定靠得住」「graduated from a top school」）踩 r181 既定边界：
 *   资质类特征（名校/奖牌/头衔）刻意不收，需资质域同域/异域分离判据
 *   成熟后再处理，本轮不动。
 *
 * 已知边界（下轮可继续）：资质类特征（名校/博士/头衔/获奖）不在腿①——
 * 「她是名校博士毕业，说的话一定更有道理」是资质→观点的迁移，语义同族，
 * 但与 appeal_to_authority 射程交界且需同域/异域判别（同域资质是合法
 * 权威依据），本轮保守不收，留待资质域分离判据成熟后处理。CONTRAST 为
 * 两腿间窗口 + 腿②后全文级，「他虽然帅，但人品肯定好」这类让步+迁移
 * 混合形会被放过（让步形语义强度低，保守方向取误判率可控）。
 *
 * 实现形态同 r180 fallacy-fallacy.js 先例：常量全部为 RegExp 数组 +
 * anyHit/scanAll 助手，腿②正则由 trait/quality/modal 常量动态拼接（保证
 * 三张表均可负例注入），负例注入以 [] 置空指定常量。
 */
'use strict';

// ─── 腿① TRAIT 无关正面特征 ───────────────────────────────────────
// 外貌类（裸名词形态——「帅」「漂亮」「好看」独立成词，不收「长得帅」后缀形）
const TRAIT_ZH_LOOK = [
  /(?:帅|俊|靓|好看|漂亮|美丽|标致|英俊|俊朗|俊美|姣好|秀丽|明艳|面善|面熟|有眼缘|养眼|耐看|眉清目秀|一表人才|玉树临风|高大|高挑|匀称|丰满|颜值[^。！？]{0,3}(?:高|出众))/,
];
// 声音/风度/口才类（修饰语窗口：「口才这么好」「气质很优雅」——161 轮教训
// 的同族变体要求：同族词中间插入「这么/很/非常」仍须命中）
const TRAIT_ZH_MANNER = [
  /(?:声音|嗓音)[^。！？]{0,3}(?:好听|磁性|甜美|悦耳|温柔|有感染力)|声音有磁性/,
  /(?:台风|气质|风度|举止|修养)[^。！？]{0,3}(?:好|佳|出众|优雅|不凡|脱俗|得体|翩翩|稳健|大气|潇洒)/,
  /(?:幽默|风趣|会说话|能说会道|能言善辩|舌灿莲花|会来事|会做人|待人接物|口才[^。！？]{0,4}(?:好|出众|一流|了得|绝佳))/,
];
// 名气/流量类
const TRAIT_ZH_FAME = [
  /(?:出名|有名|闻名|当红|走红|爆红|顶流|网红|明星|大V|大咖|名人|红人|偶像|热搜|话题度|话题性|知名度|家喻户晓|如雷贯耳|声名(?:远扬|鹊起)|圈粉|吸粉|人气[^。！？]{0,3}(?:高|旺|火爆))/,
  /粉丝(?:众多|很多|不少|多|过百万|过千万|千万|上万)/,
];
// 包装/装修/地段类（宽松窗口：「装修得这么高档」「界面做得这么精致」）
const TRAIT_ZH_WRAP = [
  /(?:包装|装帧|封面|界面|UI|页面|设计|排版|PPT|文案|外观|做工|质感|手感)[^。！？]{0,4}(?:精美|精致|漂亮|好看|时尚|炫酷|清爽|细腻|出众|一流|有格调|有质感|吸睛|走心)/,
  /(?:装修|装潢|门面|店面|地段|选址)[^。！？]{0,6}(?:高档|豪华|精致|气派|奢华|上档次|寸土寸金|绝佳|核心|黄金|好)/,
];
// 平台/品牌/价格类
const TRAIT_ZH_BRAND = [
  /(?:大公司|大厂|大品牌|知名品牌|名牌|奢侈品|奢牌|豪车|五星级|奢华|高端|高档|上档次|有品位|有格调|调性高|价格不菲|售价不菲|天价|进口品牌|进口货|连锁品牌|老牌|百年老店|百年品牌|大牌)/,
];
const TRAIT_ZH = [].concat(TRAIT_ZH_LOOK, TRAIT_ZH_MANNER, TRAIT_ZH_FAME, TRAIT_ZH_WRAP, TRAIT_ZH_BRAND);

const TRAIT_EN = [
  /\b(?:tall|handsome|good[- ]looking|attractive|beautiful|gorgeous|stunning|pretty|elegant|well[- ]dressed|charming|charismatic|great smile|deep voice|smooth voice|well[- ]groomed)\b/i,
  /\b(?:famous|celebrity|well[- ]known|renowned|influencer|viral|goes viral|millions of followers|widely followed|trending|household name|A-list|social media star)\b/i,
  /\b(?:premium packaging|beautifully (?:designed|packaged)|sleek (?:design|look)|polished (?:interface|design|UI)|fancy (?:packaging|office|store)|luxury brand|designer brand|prestigious brand|flagship store|high-end (?:brand|store|label)|expensive[- ]looking|great[- ]looking (?:design|product|website))\b/i,
  /\b(?:great speaker|compelling speaker|charismatic speaker|funny|hilarious|witty|silver[- ]tongued|smooth talker)\b/i,
  // [r264] 新平台品牌族 EN：大公司/大厂的英文形（TRAIT_ZH_BRAND 已收
  // 大公司/大厂，EN 侧缺同族词形——池化探针 5/5 穿透中唯一可落地项）
  /\b(?:big|large|major|huge|giant)\s+(?:tech\s+)?(?:firm|company|corporation|player)s?\b/i,
  /\b(?:tech giant|FAANG|MAANG|big tech)\b/i,
];

// ─── 腿② TRANSFER 质量迁移断言 ────────────────────────────────────
// 结论名词（中）：人品/能力/技术/质量/观点/判断/方案/产品/服务/架构/体验……
// 刻意不收「认真/努力/勤奋」（投入类，非质量类，收了会把「他帅，学习也很
// 认真」这类并列陈述误判为迁移）。
const QUALITY_ZH = [
  /(?:人品|人格|德行|德性|素质|修养|心地|为人|靠得住|靠谱|可信|可信赖|值得信赖|令人放心|省心|放心|可靠)/,
  /(?:能力|本事|水平|技术|实力|专业|才干|才华|能耐|过硬|优秀|一流|出色|厉害|水准|造诣|功底|内功|表达|沟通)/,
  /(?:质量|品质|质地|做工|工艺|质感|档次|品位|格调|观感|听感)/,
  /(?:观点|说法|见解|看法|判断|立场|方案|产品|服务|作品|内容|课程|演技|唱功|专业度|可信度|靠谱度|安全性|稳定性|性能|体验|效果|环境|架构|底层|工程|代码|系统|口碑|信誉|信用|名声|品牌形象|用户体验|使用体验|购物体验)/,
];
// 肯定情态（中）：**刻意不收「也」**——「她长得漂亮，成绩也很好」是并列
// 陈述非迁移推断，收了误伤面大于收益（r181 设计）。收「也该/应该/肯定/
// 一定/想必/势必/must be」类显性推断封装。
const MODAL_ZH = [
  /(?:肯定|一定|必然|势必|必定|定然|想必|可见|显然|当然|自然|铁定|妥妥的|毫无疑问|无疑|八九不离十|注定|也该|应该)/,
];
// 连接词（中）：A 形专用
const CONNECT_ZH = [
  /(?:所以|因此|因而|可见|足见|据此|故而|那么|正说明|足以说明|足以证明|这说明|由此可见|说明|证明|意味着|说到底)/,
];
// 连接词（EN）
const CONNECT_EN = [
  /\b(?:so|therefore|thus|hence|which means|that means|it follows that|consequently|which proves|that proves)\b/i,
];
const QUALITY_EN = [
  /\b(?:judgment|judgement|advice|recommendation|opinion|character|work|product|quality|ability|skill|skills|argument|claim|service|content|performance|expertise|taste|design|engineering|craftsmanship|integrity|reliability|leadership|expertise)\b/i,
];
const MODAL_EN = [
  /\b(?:must be|is surely|are surely|has to be|have to be|is certainly|are certainly|is bound to be|are bound to be|no doubt|definitely|certainly|surely)\b/i,
];

// ─── 腿③ ORDER + 豁免常量 ─────────────────────────────────────────
// 对比/转折与迁移否定（两腿间窗口 + 腿②后全文两级查）：「和方案质量是两
// 回事」「不能因为长得好看就认定可靠」「but looks have nothing to do with
// code quality」都是正确判别。
const CONTRAST_ZH = [
  /(?:虽然|虽|固然|但是|然而|不过|可是|却)/,
  /(?:不等于|两回事|两码事|无关|毫无关系|没有什么关系|没有关系|不能说明|不代表|不意味着|并非因为|不能因为|不可因|勿以|不应以|不得以|不要以|别因为|休想)/,
];
const CONTRAST_EN = [
  /\b(?:but|however|yet|though|although|while)\b/i,
  /\b(?:irrelevant|no substitute|no proxy|no indicator|no guarantee|says nothing about|has nothing to do with|does not mean|doesn'?t mean|not because|don'?t judge|never judge)\b/i,
];
// 概念/教学转述（讨论这个偏差本身是正确判别）
const META_ZH = [
  /(?:光环效应|晕轮效应|月晕效应|角效应|认知偏差|认知偏误|心理偏误|美貌偏见|颜值偏见|以貌取人|晕轮)/,
];
const META_EN = [
  /\b(?:halo effect|horn effect|cognitive bias(?:es)?|lookism|what is beautiful is good|halo bias)\b/i,
];
// 对冲弱化结论（全文级，与 r179/r180 同口径）
const HEDGE_ZH = [
  /(?:可能|也许|或许|大概|恐怕|似乎|不见得|不一定|未必|好像|仿佛|说不准|不好说|估计|没把握)/,
];
const HEDGE_EN = [
  /\b(?:maybe|perhaps|might|probably|seems|appears|could be|possibly|somewhat|likely)\b/i,
];

// ─── 助手 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) if (re.test(text)) return true;
  return false;
}

/** 收集一组常量在文本中的全部出现位置。 */
function scanAll(list, text) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue; }
      hits.push({ pos: m.index, end: m.index + m[0].length });
    }
  }
  return hits;
}

/** 数组 source 拼成一个 (?:a|b|c) 组（供腿②动态构建，注入可承重）。 */
function srcGroup(list) {
  if (!list || list.length === 0) return null;
  return '(?:' + list.map(re => re.source).join('|') + ')';
}

/**
 * 构建腿②正则（trait × quality × modal 三表动态拼接）：
 * A 连接词形：连接词 → [≤12字] → 结论名词 → [≤6字] → 肯定情态
 * B 并置形：腿①特征词 → [≤12字] → 结论名词 → [≤6字] → 肯定情态
 */
function buildTransfers(R) {
  const traitZ = srcGroup(R.TRAIT_ZH);
  const traitE = srcGroup(R.TRAIT_EN);
  const qualZ = srcGroup(R.QUALITY_ZH);
  const qualE = srcGroup(R.QUALITY_EN);
  const modalZ = srcGroup(R.MODAL_ZH);
  const modalE = srcGroup(R.MODAL_EN);
  const connZ = srcGroup(R.CONNECT_ZH);
  const connE = srcGroup(R.CONNECT_EN);
  const out = [];
  // A 中文
  if (connZ && qualZ && modalZ) {
    out.push(new RegExp(connZ + '[^。！？]{0,12}' + qualZ + '[^。！？；]{0,6}' + modalZ));
  }
  // A 英文
  if (connE && qualE && modalE) {
    out.push(new RegExp(connE + '[^.]{0,30}\\b' + qualE + '[^.]{0,20}\\b' + modalE, 'i'));
  }
  // B 中文（自带 trait 词，无需顺序腿）
  if (traitZ && qualZ && modalZ) {
    out.push(new RegExp(traitZ + '[^。！？]{0,12}' + qualZ + '[^。！？；]{0,6}' + modalZ));
  }
  // B 英文
  if (traitE && qualE && modalE) {
    out.push(new RegExp(traitE + '[^.]{0,12}\\b' + qualE + '[^.]{0,15}\\b' + modalE, 'i'));
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以 [] 置空指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkHaloEffect(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  // 子族可分别注入（证明每个特征族独立承重），TRAIT_ZH 整体注入优先
  const look = R.TRAIT_ZH_LOOK || TRAIT_ZH_LOOK;
  const manner = R.TRAIT_ZH_MANNER || TRAIT_ZH_MANNER;
  const fame = R.TRAIT_ZH_FAME || TRAIT_ZH_FAME;
  const wrap = R.TRAIT_ZH_WRAP || TRAIT_ZH_WRAP;
  const brand = R.TRAIT_ZH_BRAND || TRAIT_ZH_BRAND;
  const T_Z_ = R.TRAIT_ZH || [].concat(look, manner, fame, wrap, brand);
  const T_E_ = R.TRAIT_EN || TRAIT_EN;
  const Q_Z_ = R.QUALITY_ZH || QUALITY_ZH;
  const Q_E_ = R.QUALITY_EN || QUALITY_EN;
  const M_Z_ = R.MODAL_ZH || MODAL_ZH;
  const M_E_ = R.MODAL_EN || MODAL_EN;
  const C_Z_ = R.CONNECT_ZH || CONNECT_ZH;
  const C_E_ = R.CONNECT_EN || CONNECT_EN;
  const CT_Z_ = R.CONTRAST_ZH || CONTRAST_ZH;
  const CT_E_ = R.CONTRAST_EN || CONTRAST_EN;
  const META_Z_ = R.META_ZH || META_ZH;
  const META_E_ = R.META_EN || META_EN;
  const H_Z_ = R.HEDGE_ZH || HEDGE_ZH;
  const H_E_ = R.HEDGE_EN || HEDGE_EN;

  // 概念/教学转述 → 不是运用它
  if (anyHit(META_Z_, text) || anyHit(META_E_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 疑问句
  if (/[?？]/.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 对冲弱化结论（全文级——出现对冲即整句弱化）
  if (anyHit(H_Z_, text) || anyHit(H_E_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 对比/迁移否定（全文级——「两回事」「不能因为」「irrelevant」出现即
  // 指示说话者自己做了维度分离，属正确判别；与 r180 HEDGE 全文级同口径）
  if (anyHit(CT_Z_, text) || anyHit(CT_E_, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const traitHits = scanAll(T_Z_, text).concat(scanAll(T_E_, text));
  if (traitHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const transfers = buildTransfers({
    TRAIT_ZH: T_Z_, TRAIT_EN: T_E_, QUALITY_ZH: Q_Z_, QUALITY_EN: Q_E_,
    MODAL_ZH: M_Z_, MODAL_EN: M_E_, CONNECT_ZH: C_Z_, CONNECT_EN: C_E_,
  });
  const transferHits = scanAll(transfers, text);
  if (transferHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 命中判定：任一腿②命中即为迁移断言在场；B 形自带 trait 词（位置即 trait
  // 位置），A 形另需腿①在场（顺序腿——特征在前、迁移断言在后）。
  const hasTraitFirst = transferHits.some(t =>
    traitHits.some(f => f.end <= t.pos + 12)
  );
  if (!hasTraitFirst) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.5,
    count: 1,
    detail: '光环效应×无关正面特征×质量/真假迁移断言',
  };
}

module.exports = {
  checkHaloEffect,
  __internals: () => ({
    TRAIT_ZH, TRAIT_EN, QUALITY_ZH, QUALITY_EN, MODAL_ZH, MODAL_EN,
    CONNECT_ZH, CONNECT_EN, CONTRAST_ZH, CONTRAST_EN,
    META_ZH, META_EN, HEDGE_ZH, HEDGE_EN,
    TRAIT_ZH_LOOK, TRAIT_ZH_MANNER, TRAIT_ZH_FAME, TRAIT_ZH_WRAP, TRAIT_ZH_BRAND,
  }),
};
