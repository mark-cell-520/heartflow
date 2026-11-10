/**
 * src/prosecutors-fallacy.js — 「检察官谬误 / prosecutor's fallacy」检测器
 * （provisional 第 217 个判别维度，r233 起草；接线规格见
 * coordination/round-233/ 下本轮报告。编号 provisional 的原因同
 * r228~r232：最终编号由 1 号按 VERIFY_DIMS 登记序重排确认）
 *
 * [r233 立项] 缺口探针 scripts/round-233/probe-gap-r233.js（v6.8.147
 * 实测）：检察官谬误族 16 句候选 **11 句完全穿透引擎**（pass、findings
 * 为空），另 5 句被无关维度代拦（perfect_error 4 句、post_hoc 1 句、
 * vagueness 1 句），无任何维度承载「总体小概率 → 个体高概率」这一等式
 * 偷换。覆盖度检查：grep -rl '检察官谬误\|prosecutor' src/ 零命中；
 * base_rate_neglect（第169维）只管先验比率缺失，不判概率主语从总体
 * 转移到个体；false_precision（第188维）管数值精度包装；percentage_
 * overflow 管百分比越界——三者都不判本族核心结构。
 *
 * 外部来源：本轮扫描空返（HN Algolia "prosecutor fallacy base rate"
 * hits=0；Semantic Scholar 返回 total:None，API 无数据）。选题依据为
 * **内部缺口实证**，判据为心虫自有纯规则实现。家族定义取自统计学与
 * 法庭证据学经典结论（prosecutor's fallacy：把小概率证据在无辜者中
 * 出现的概率，误当作被告有罪的概率——心虫只判表述形态，不判事实真假）。
 *
 * 辨别的族：检察官谬误（prosecutor's fallacy / base rate neglect in
 * evidence / transposed conditional）——把**总体中的小概率匹配**偷换成
 * **个体的高概率有罪**，忽略先验概率与假阳性率：
 *   DNA匹配的概率只有百万分之一，所以他就是凶手的可能性高达99.9999%。
 *   这种错误只有十亿分之一的概率，因此嫌疑人几乎肯定有罪。
 *   全国十四亿人里只有一个人能匹配上，这个人不是他还能是谁。
 *   检测结果显示统计显著，说明被告有罪。
 *   p值小于0.01，因此被告的清白假设可以被拒绝，他是有罪的。
 *   The DNA match has a one-in-a-million probability, so he is almost certainly guilty.
 *   The chance of this match is one in ten billion, therefore the defendant is guilty.
 *   Only one person in a hundred million shares this profile, so he has to be the killer.
 *
 * 为什么这是判别者的核心缺口（对齐「寻真而非似是而非」）：这是**条件
 * 概率的等式偷换**——P(证据|无辜) ≠ P(无辜|证据)。前者只说这种巧合很
 * 少见，后者需要先验概率与假阳性率才能推出。当总体足够大时，即使匹配
 * 概率是百万分之一，也能捞出成百上千个假阳性；把「罕见」直接读成
 * 「就是他」，等于用稀有度替代证据力。它在司法场景里直接制造冤案，
 * 在数据决策里制造错误归因——因为「统计显著」听起来像科学背书，实际
 * 可能只是把 P(数据|H0) 误读成了 P(H0|数据)。
 *
 * 与既有维度的边界（r233 归因）：
 *   · base_rate_neglect（第169维）管**先验比率的缺失**（稀有病筛查中
 *     的「阳性即患病」），本族腿①是**具体的匹配/巧合概率陈述**（百万
 *     分之一、十亿分之一、p<0.01），腿②是**个体有罪/嫌疑的结论**；
 *     可毫无「人群中比率」的表述（「p值小于0.01，他有罪」无任何总体
 *     比率词），也可带总体（「十四亿人里只有一个」）。射程不同。
 *   · false_precision（第188维）管**数值精度的虚假包装**（精确到小数
 *     点后四位冒充确定性），本族不关心精度位数，关心概率主语从**总体
 *     匹配率**转移到**个体有罪概率**。
 *   · percentage_overflow 管**百分比数值越界**（超过100%），与本族正交。
 *   · perfect_error / post_hoc 实测会**偶发代拦**本族样本（探针实测
 *     4 句 perfect_error、1 句 post_hoc 命中但语义不符），属射程交叠，
 *     本模块对交叠样本同样承重，不冲突。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   ① 腿① RARE_MATCH 小概率匹配在场：概率/几率/巧合 + 数值（百万分之
 *      一、十亿分之一、千万分之一、两百万分之一、一亿分之一、0.1%、
 *      百分之一…）+ 匹配/吻合/命中/出现；或统计检验显著形（统计显著/
 *      p值小于/P<0.0x/显著性水平）；EN one in a million / one-in-ten-
 *      billion / chance of this match / occurs once per / p-value / p <
 *      0.01 / statistically significant。
 *   ② 腿② GUILT_INFERENCE 个体有罪/嫌疑结论在场：就是他/不是他还能是
 *      谁/几乎肯定有罪/基本上已经确定/足以证明/可以认定/他就是凶手/
 *      有罪/作案人/凶手/嫌疑最大；EN guilty / the culprit / the killer /
 *      must be / almost certainly / has to be / beyond reasonable doubt。
 *   两腿落在 80 字（EN 200 字符）邻近窗内即视为同一次「小概率匹配→
 *   个体有罪」叙述。
 *
 * [r262 扩展 · 真升级②] 定性稀有度 × 定罪结论新措辞家族：原腿①要求显式
 *   微小概率数字（百万分之一/p<0.01），一批**无数字的定性稀有**表述穿透——
 *   一辈子难遇/千载难逢/凤毛麟角/微乎其微/吻合度·匹配度这么高/亿万人里才有
 *   一个（EN once-in-a-lifetime / extraordinarily rare / degree of match so
 *   high）；配套腿②补**定罪确定形**（嫌疑几乎可以确定/几乎可以确定是他）、
 *   **排除形**（除了他不可能有别人/舍他其谁）、**铁证形**（可以当铁证 /
 *   ironclad evidence）。「不可能」是确定性/排除标记而非对冲，HEDGE_ZH 对
 *   「可能」加 (?<！不) 负回顾。缺任一条腿即不判——良性「罕见病需会诊 /
 *   吻合度高但需补证 / 一辈子难遇的错」无定罪腿，均不触发。
 *
 * [r280 扩展 · 真升级②] 镜像形与误差率族（时间与概率推理方向）：腿①补
 *   设备误差率名词（误差率/错误率/误判率/漏检率/假阴性率…）与通用
 *   N分之一 分数形（千分之一）；腿②补**无辜镜像**（他是无辜的概率也
 *   只有百万分之一——P(匹配|无辜) 与 P(无辜|匹配) 的颠倒，即辩护人
 *   谬误同构）、**判错镜像**（这案子判错的概率也就千分之一——设备
 *   误差率与个案错判概率的混淆）；EN 补 the chance he is innocent
 *   is / the probability of innocence is。探针实测三条全新措辞穿透
 *   （gate 放行且维度零承重）→ 落地后 0 穿透。
 *
 * 为什么取 VERIFY 级：单句也可能是**对统计证据的正当讨论或批评**（「DNA
 * 匹配概率百万分之一，这是需要进一步举证的理由，而非定罪充分条件」正是
 * 本族要教的判别动作）、法庭科学教材、贝叶斯推理教学案例。rewrite/block
 * 会误伤。verify 的含义是「这段文本把总体匹配率当成了个体有罪概率，
 * 需要先给出先验概率与假阳性率再评估有罪的可能性」。
 *
 * 明确不判（豁免）：
 *   · 正确判别/证伪（不能作为认定/定罪依据/并非充分条件/需要结合其他
 *     证据/不能证明有罪/不等于有罪/不能据此定罪/还需/不能单独/孤证/
 *     不足以定罪；EN does not establish guilt / alone is not sufficient /
 *     cannot prove guilt / requires additional evidence / not enough to
 *     convict）——**破除该推理正是本族要教的判别动作**；
 *   · 元话语/教学转述（检察官谬误/逻辑谬误/谬误清单/贝叶斯/课程/教材/
 *     课堂/概念/称为/定义为/条件概率/误读为；EN prosecutor's fallacy /
 *     logical fallacy / base rate / Bayesian / course / textbook /
 *     concept / defined）；
 *   · 显式对冲（可能/也许/未必/不一定/大概率/might/maybe/possibly）；
 *   · 否定翻转（不意味着/推不出/并不能说明/不代表/does not mean）；
 *   · 疑问句（含 ?/？；反问标记出现时不豁免，同 r216 collider_bias 口径：
 *     难道/岂/凭什么/何尝/岂不是/谈何/…吗？/ isn't it / doesn't that /
 *     how else / what else / who doesn't / if not）；
 *   · 无个体有罪腿的纯概率陈述（这种错误只有十亿分之一的概率。）——
 *     缺腿②，是中性统计描述，不由本族代拦；
 *   · 无小概率腿的纯定罪陈述（他有罪，证据确凿。）——缺腿①。
 */
'use strict';

// ─── 腿① 小概率匹配（中文）────────────────────────────────────
// r161 教训：枚举腿必须含裸名词形态——「概率」「几率」去前后缀仍命中。
const RARE_MATCH_ZH = [
  // 分数形：百万分之一 / 千万分之一 / 十亿分之一 / 两百万分之一…
  /(?:百万|千万|亿|十亿|百亿|万亿|两百万|三百万|五百万|一千万|几百万)分之[一二三四五六七八九十百千万亿\d]+/,
  // 概率/几率 + 数值（含小数、百分比、万分位）
  /(?:概率|几率|机率|可能性|巧合|偶然)[^。！？!?]{0,8}(?:只有|仅|不到|不足|低至|低到|仅约|约)?\s*(?:万分之|百分之|千分之)?[\d.]+(?:%|％)?/,
  // 数值 + 概率词（倒装：「1%的概率」「百万分之一的概率」）
  /[\d.]+(?:%|％)?\s*(?:的)?(?:概率|几率|机率|可能性|巧合)/,
  // 匹配类动词 + 概率陈述（匹配的概率 / 命中的几率 / 误报率）
  /(?:匹配|吻合|命中|误报|出错|错误|假阳性|巧合|偶然)(?:的)?(?:概率|几率|机率|率|可能性)/,
  // 统计显著形：统计显著 / p值小于 / P<0.0x / 显著性水平
  /(?:统计|统计学)(?:上)?(?:显著|显著性)/,
  /[pP](?:\s*值)?\s*(?:小于|<|≤|低于)\s*0?\.\d+/,
  /显著性水平[^。！？!?]{0,6}(?:0?\.\d+|百分之|千分之)/,
  // 人群中比率 + 才能/只有 + 匹配（总体限定，本族的典型先验语境）
  /(?:人群|人口|总体|全国|全市|全球|所有人|每个人|每个人群)[^。！？!?]{0,10}(?:只有|仅有|方能|才能|仅)(?:一个|一人|\d+)?/,
  // 稀有度修饰：极罕见 / 极其罕见 / 罕见至极 / 亿里挑一
  /(?:极其?|极为|非常|特别)?(?:罕见|稀少|稀有)/,
  /亿?[里挑]?挑?一/,
  // [r262] 定性稀有度族（无显式微小概率数字）——单独出现不判，须配腿②
  // 定罪结论，缺任一腿即落空（「罕见病需会诊」「一辈子难遇的错」无定罪
  // 腿，均不触发）。once-in-a-lifetime 中文化定性稀有：
  /(?:一辈子|一生一世|毕生|世上|人生)[^。！？!?]{0,5}(?:难遇|难见|难碰|难求|难逢|遇上一回|遇一次|碰上一回|撞上一回)/,
  /千载难逢|百年难遇|百年一遇|千载难遇|千载一时/,
  /凤毛麟角/,
  /微乎其微|少之又少|屈指可数/,
  // 吻合度/匹配度/相似度 + (这么|如此)?高——定性高匹配，配腿②铁证/定罪
  /(?:吻合度|匹配度|相似度|符合度|契合度|重合度|一致度)[^。！？!?]{0,4}(?:这么|如此|这么样|竟|都)?(?:之高|高|之强|强)/,
  // [r274] 人口唯一性族（无「概率」字样的总体唯一化陈述）：全城/全世界
  // + 只有/不超过 + 数量 + 人——探针实测「全城只有一个人有这个特征」
  // 「全世界具备这个特征的不超过五个人」整族零命中（原 patterns 只收
  // 人群/全国/全市 + 只有，不收 全世界/全城/全县/全村 + 不超过/顶多）
  /(?:全世界|全城|全县|全村|全市|全省|全球|全国|当地|整座城)[^。！？!?]{0,12}(?:只有|仅有|不超过|超不过|顶多|最多|仅仅|仅)[一二两三四五六七八九十百千万\d]*(?:个|人|名|位)/,
  // [r280 新增族] 误差率族（探针实测「误差率只有千分之一」零命中——
  // 原表只收 概率/几率+数值 与 百万分之一 类分数形，不收设备误差率
  // 名词与通用 N分之一 形）
  /(?:误差率|错误率|误判率|漏检率|漏报率|假阴性率|假阳性率|误报率)/,
  /[一二三四五六七八九十百千万\d]+分之[一二三四五六七八九十百千万\d]+/,
];

// ─── 腿①（英文）───────────────────────────────────────────────
const RARE_MATCH_EN = [
  /\bone\s+in\s+(?:a\s+)?(?:million|billion|trillion|thousand|hundred\s+(?:million|thousand|billion))/i,
  /\bone-in-(?:a-)?(?:million|billion|trillion)/i,
  // r233 补：裸形（"occurs once per billion people"，无 in a）
  /\bonce\s+per\s+(?:\d+|a\s+)?(?:million|billion|trillion|thousand|hundred)/i,
  /\b(?:chance|probability|likelihood|odds)\s+of\s+(?:this|that|such\s+a|the)\s+(?:match|coincidence|result|finding|outcome)/i,
  /\boccurs?\s+once\s+per\s+\d+/i,
  /\b(?:statistically|statistical)\s+significant/i,
  /\bp-?value\s*(?:<|≤|is\s+less\s+than|below|under)\s*0?\.\d+/i,
  /\bsignificance\s+level\s+of\s+0?\.\d+/i,
  /\b(?:only|just)\s+(?:one|a\s+single)\s+(?:person|people|individual)\s+in\s+(?:a\s+)?(?:million|billion|thousand|hundred)/i,
  /\b(?:shares?|match(?:es)?|has)\s+(?:this|that|such\s+a)\s+(?:profile|marker|signature|pattern)/i,
  /\b(?:extremely|very|incredibly|highly)\s+rare\b/i,
  // [r262] 定性稀有度族（EN，无显式 one-in-a-N）——须配腿②定罪结论
  /\bonce[- ]in[- ]a[- ]lifetime\b/i,
  /\b(?:extraordinarily|incredibly|exceptionally|remarkably|astronomically)\s+rare\b/i,
  /\b(?:vanishingly|impossibly)\s+(?:rare|unlikely|small)\b/i,
  /\b(?:degree|level|extent)\s+of\s+(?:the\s+)?match\s+is\s+(?:so|this|that)\s+(?:high|strong|close)/i,
  // [r274] 数量级修正族（EN）：探针实测 "one in ten billion" / "Only
  // one person in ten million" 零命中——原 patterns 的 one in a 后面只
  // 接 million|billion…，不收 "in ten million" 这类数十亿量级形
  /\bone\s+in\s+(?:\d+|ten|a\s+few|several)\s+(?:million|billion|trillion|thousand|hundred)\b/i,
  /\bonly\s+(?:one|a\s+single)\s+(?:person|people|individual|man|woman)\s+in\s+(?:\d+|ten|a\s+few|several)\s+(?:million|billion|thousand|hundred)\b/i,
];

// ─── 腿② 个体有罪/嫌疑结论（中文）────────────────────────────────
const GUILT_INFERENCE_ZH = [
  // 就是他 / 不是他还能是谁 / 除了他还能有谁
  /就是他|正是他|只能是他|非他莫属|除了他[^。！？!?]{0,4}(?:还能|还有|之外)/,
  /不是他[^。！？!?]{0,6}(?:还能|还会|可能)(?:是|有)谁/,
  // 有罪/凶手/作案人/嫌疑人 的断定形
  /(?:几乎|几乎可以|基本上|基本上已经|简直|分明|显然|毫无疑问|铁定)(?:肯定|可以|能够)?(?:就是)?(?:有罪|凶手|作案人|真凶|罪犯|元凶|嫌疑人|就是他)/,
  /(?:可以|能够|足以|应当|理应|应|该)(?:据此|就此|直接)?(?:认定|判定|断定|确认|定罪|锁定)(?:他|被告|嫌疑人|其为)?/,
  // r233 补：「作案」裸名词族（「他作案的可能性」「作案的是他」）——
  // r161 教训：同族词去后缀仍须命中。
  /(?:他|被告|嫌疑人|此人)[^。！？!?]{0,8}(?:作案|犯案|作案人|干的|做的|所为)/,
  /(?:作案|犯案)(?:的)?(?:就是|正是|只能|只能是|非)(?:他|此人|被告|嫌疑人)/,
  /(?:是他|就是他|只能是他)(?:作案|犯案|干的|所为)/,
  /(?:他|被告|嫌疑人)[^。！？!?]{0,6}(?:就是)?(?:凶手|真凶|作案人|元凶|罪犯|有罪)/,
  // 事实/真相已定形
  /(?:这案子|案子|此事|案件)[^。！？!?]{0,6}(?:就是他|是他)(?:干|做|所为)/,
  /(?:足以|完全可以|铁证如山)(?:证明|说明|表明|证实)/,
  // 假设被拒绝 ⇒ 有罪（统计检验的误读）
  /(?:假设|原假设|零假设|清白假设)[^。！？!?]{0,10}(?:被)?(?:拒绝|推翻|否定)/,
  // 排除法收尾：第一个被测的 / 查到他头上
  /(?:第一个|首位)(?:被)?(?:测|查|试|筛)/,
  // [r245 审计修复] 腿②医学/非刑事语境：检察官谬误在医学检测里的
  // 同构错误是**把 P(阳性|患病) 当成 P(患病|阳性)**——腿②用「患病/
  // 感染/携带/患有 X 的概率」而非「有罪」。原腿②表只覆盖刑事语境，
  // 医学语境全漏（审计实测一条漏判）。
  /(?:他|她|患者|此人|受检者|被检测者)[^。！？!?]{0,8}(?:患病|感染|携带|患有|确诊|得上|得病|中招)(?:的)?(?:概率|几率|机率|可能性)/,
  /(?:患病|感染|携带|确诊|染病|得病)(?:的)?(?:概率|几率|机率|可能性)[^。！？!?]{0,8}(?:就是|高达|达到|为|是)\s*[\d.]+/,
  /(?:阳性|阴性|异常|超标)(?:结果)?[^。！？!?]{0,10}(?:说明|意味着|表明|证明)[^。！？!?]{0,8}(?:患病|感染|携带|确诊)/,
  // 反向混淆形：把后验概率直接等同于检测准确率/灵敏度/特异度
  /(?:准确率|灵敏度|特异度|检出率|阳性率)[^。！？!?]{0,10}(?:就是|等于|意味着|说明)[^。！？!?]{0,10}(?:概率|可能性|几率)/,
  // [r262] 定罪确定形（定性稀有度配套的结论腿）：
  // 嫌疑/有罪/凶手 + 几乎/基本/已经 + 确定/锁定/坐实/定案
  /(?:嫌疑|有罪|凶手|真凶|作案|罪犯|是他|正是他|只能是他|其所为)[^。！？!?]{0,8}(?:几乎|基本|已然|已经|铁定|分明|八九不离十|俨然|简直)(?:可以|能够|得以|堪)?(?:确定|锁定|坐实|认定|肯定|定案)/,
  // 定罪确定形（倒装）：几乎/基本 + 确定/锁定/坐实 + 是他/有罪/凶手
  /(?:几乎|基本|已然|已经|铁定|八九不离十|俨然)(?:可以|能够|得以|堪)?(?:确定|锁定|坐实|认定)(?:是他|正是他|有罪|凶手|真凶|作案|其所为)/,
  // [r280 新增族] 无辜/清白镜像形（辩护人谬误同构）：把小概率匹配率
  // 直接读成「无辜/没病的概率也只有百万分之一」——P(匹配|无辜) 与
  // P(无辜|匹配) 的颠倒，探针实测 DNA 句零命中
  /(?:无辜|清白|没病|无罪)(?:的)?(?:概率|几率|机率|可能性)[^。！？!?]{0,8}(?:也只有|只有|也就|同样|一样|同为|高达|达到|仅为|不过是)\s*(?:万分之|百分之|千分之)?[一二三四五六七八九十百千万亿\d.]+/,
  // [r280 新增族] 判错/误判镜像形：把设备误差率直接读成「这案子判错
  // 的概率也就千分之一」——误差率与个案错判概率的混淆
  /(?:判错|错判|误判|冤案|冤枉)(?:的)?(?:概率|几率|机率|可能性)[^。！？!?]{0,8}(?:也就|只有|同样|一样|是|为|高达)\s*(?:万分之|百分之|千分之)?[一二三四五六七八九十百千万亿\d.]+/,
  // 排除形：除了他 不可能/不会/不能 + 有别人/是别人/有第二个（身份唯一化）
  /除了他[^。！？!?]{0,6}(?:不可能|不会|不能|别无|岂有|怎会|断不会)[^。！？!?]{0,4}(?:有|是|剩|出)?[^。！？!?]{0,3}(?:别人|他人|第二个|二人|其他人)/,
  /舍他其谁/,
  // 铁证形：可以/堪称/就是 + 当/作为/视为 + 铁证（定罪结论）
  /(?:可以|能够|堪称|就是|简直|足以|完全|俨然)(?:被)?(?:当做|当作|视为|作为|当成|当)?(?:铁证|铁证如山|铁一般的证据|呈堂铁供)/,
  // 不是别人干的（排除 + 行为归属）
  /(?:不可能是|不会是|绝非是|定不是|断不是)(?:别人|他人|第二个)(?:干|做|所?为|下手的)/,
  // [r274] 口语收尾定罪族：探针实测「对上以后他就没跑了」「基本上
  // 就尘埃落定了」零命中——结论腿原只收书面断定形，不收口语定案收尾
  /(?:他|嫌疑人|被告|此人|嫌犯|其所为)(?:[^。！？!?]{0,6})?(?:没跑了|没跑|跑不了|跑不掉|脱不了干系|脱不了关系)/,
  /(?:基本上|基本|已经|已然|就算|即便|这一下|这下|简直|分明)(?:[^。！？!?]{0,6})?(?:尘埃落定|板上钉钉|铁板钉钉|已成定局|钉板定钉)/,
];

// ─── 腿②（英文）───────────────────────────────────────────────
const GUILT_INFERENCE_EN = [
  /\b(?:he|she|the\s+(?:defendant|suspect|accused|perpetrator))\s+(?:is|was|must\s+be)\s+(?:almost\s+)?(?:certainly\s+)?(?:guilty|the\s+(?:culprit|killer|murderer|perpetrator))/i,
  /\b(?:almost\s+certainly|beyond\s+(?:any\s+)?(?:reasonable\s+)?doubt|virtually\s+certain)\s+(?:guilty|the\s+(?:culprit|killer))/i,
  /\b(?:therefore|thus|so|hence)\s+(?:the\s+)?(?:defendant|suspect|accused|he)\s+(?:is|was)\s+guilty/i,
  /\b(?:must|has\s+to|has\s+gotta)\s+be\s+(?:the\s+)?(?:culprit|killer|murderer|guilty|one\s+who\s+did\s+it)/i,
  /\b(?:who|if\s+not)\s+(?:else\s+)?(?:could|can|would)\s+(?:it\s+)?(?:be|have\s+been)/i,
  /\b(?:this\s+)?(?:proves?|establishes?|confirms?|shows?)\s+(?:that\s+)?(?:he|she|the\s+(?:defendant|suspect))\s+(?:is|was)\s+(?:guilty|the\s+(?:culprit|killer))/i,
  /\b(?:null|innocence|guilt)\s+hypothesis\s+(?:can\s+be\s+)?(?:is\s+)?rejected/i,
  /\breject(?:ed|ing)?\s+(?:the\s+)?(?:null|innocence)\s+hypothesis[^.]{0,30}guilt/i,
  // [r262] 定罪确定/排除/铁证形（EN，定性稀有度配套结论腿）
  /\b(?:it\s+)?has\s+to\s+be\s+(?:him|her)\b/i,
  /\bno\s+one\s+else\s+(?:can|would|is|remains?|fits)\b/i,
  /\bleaves?\s+no\s+(?:one|other|body)\s+else\b/i,
  /\bironclad\s+(?:evidence|proof)\b/i,
  /\b(?:almost|virtually|practically)\s+(?:certainly\s+)?(?:confirmed|established|locked\s+in)\s+(?:his|her|the)\s+(?:guilt|culpability)/i,
  // [r274] 口语定罪结论族（EN）：探针实测 "one in ten billion, which
  // makes him as good as convicted" / "a win at trial is a formality"
  // 零命中——原 GUILT_EN 只收书面 guilty/culprit 形
  /\b(?:makes?|making)\s+(?:him|her|the\s+(?:defendant|suspect|accused))\s+(?:as\s+good\s+as\s+)?(?:convicted|guilty|finished)\b/i,
  /\bas\s+good\s+as\s+(?:convicted|guilty|proven|settled)\b/i,
  /\b(?:a\s+)?(?:win|victory|conviction)\s+at\s+trial\s+is\s+a\s+(?:formality|foregone\s+conclusion|certainty)\b/i,
  // [r280 新增族] 无辜镜像形（EN，辩护人谬误同构）：the chance he is
  // innocent is one in a million / the probability of innocence is ——
  // 把小概率匹配率读成无辜概率，探针实测零命中
  /\b(?:chance|probability|likelihood|odds)\s+(?:that\s+)?(?:he|she|the\s+(?:defendant|suspect|accused))\s+is\s+(?:innocent|not\s+guilty)\s+is\b/i,
  /\b(?:chance|probability|likelihood|odds)\s+of\s+(?:innocence|being\s+innocent)\s+is\b/i,
];

// ─── 豁免一：正确判别 / 证伪（破除该推理正是判别动作本身）──────────
// r228/r229/r230 教训迁移：只收复合/结构化形式，不收会在攻击句里
// 自然出现的裸词（如单收「证据」会把「DNA证据证明他有罪」一并吞掉）。
const EXEMPT_CORRECT_ZH = [
  // 定罪依据的否定形（含「不能单独作为…依据」这类插入式否定）。
  // r233 修正：原窗宽 {0,10} 过窄，实测「不能作为认定他有罪的依据」
  // 中「不能」→「作为」间隔 0 但「作为」→「认定他有罪的依据」插入式
  // 长宾语致整句漏豁免；改为两段式，中间允许最长 24 字的插入式宾语。
  /(?:不能|无法|不足以|不得|不应|不宜|勿|难以|没法)[^。！？!?]{0,6}(?:单独|仅|只|单凭|据此|以此|直接|仅仅)?[^。！？!?]{0,4}(?:作为|当成|视为|当作|算作|算)[^。！？!?]{0,24}(?:依据|证据|理由|充分条件|充要条件|定论|结论)/,
  /(?:不能|无法|不足以|不得|不应|不宜|勿|难以|没法)[^。！？!?]{0,8}(?:认定|判定|断定|确认|定罪|归罪)(?:他|被告|嫌疑人|其为|其)?[^。！？!?]{0,6}(?:有罪|罪|清白|无罪)/,
  /(?:不能|无法|不足以|不得|不应|不宜|勿|难以|没法)[^。！？!?]{0,6}(?:据此|以此|单凭|仅凭|据此)[^。！？!?]{0,10}(?:定罪|认定|断定|下结论|归因|推断)/,
  /(?:并非|不是|不等于|算不上)(?:充分|充要|唯一|直接|决定性)(?:条件|依据|证据)/,
  /(?:需要|须|仍需|还需要|还得|尚需)[^。！？!?]{0,8}(?:结合|综合|并|同)[^。！？!?]{0,8}(?:其他|其余|别的|进一步)(?:证据|线索|印证)/,
  /(?:不能|无法|不足以|不得)[^。！？!?]{0,6}(?:证明|证实|说明|表明)[^。！？!?]{0,6}(?:有罪|作案|罪|清白)/,
  /(?:孤证|单凭|仅凭|只凭)[^。！？!?]{0,8}(?:不|难以|无法|不足以)/,
  /(?:不能|不可|不应)[^。！？!?]{0,4}(?:据此|以此|单凭|仅凭)[^。！？!?]{0,6}(?:定罪|认定|断定|下结论|归因)/,
  /(?:进一步|继续|另行)(?:举证|侦查|排查|鉴定|取证)/,
  /(?:先验|假阳性|贝叶斯|条件概率|误读|偷换|谬误)[^。！？!?]{0,12}(?:概率|比率|结论|证据|推论)/,
  /不能(?:只|单独|仅)[^。！？!?]{0,4}(?:看|依据|凭|以)/,
];
const EXEMPT_CORRECT_EN = [
  /\bdoes\s+not\s+(?:establish|prove|show|demonstrate)\s+(?:guilt|that\s+.{0,20}guilty)/i,
  /\b(?:alone|by\s+itself|on\s+its\s+own)\s+(?:is|does)\s+not\s+(?:sufficient|enough|establish|prove)/i,
  /\bis\s+not\s+(?:sufficient|enough)\s+(?:evidence|proof)\s+(?:to|for)\s+(?:convict|establish|prove)/i,
  /\bcannot\s+(?:prove|establish)\s+guilt/i,
  /\brequires?\s+(?:additional|more|further|other)\s+evidence/i,
  /\bnot\s+enough\s+(?:evidence|proof)\s+to\s+convict/i,
  /\bprior\s+probability|\bfalse[- ]positive\s+rate|\bbase\s+rate/i,
  /\bmisread(?:ing)?\s+.{0,30}(?:probability|conditional)/i,
];

// ─── 豁免二：元话语 / 教学转述（讨论该谬误本身）──────────────────
const EXEMPT_META_ZH = [
  /检察官谬误/, /辩护人谬误/, /条件概率(?:的)?(?:误读|谬误|混淆|颠倒)/,
  /逻辑谬误/, /谬误清单/, /诉诸/, /贝叶斯(?:定理|推理|公式|方法)/,
  /课程|教材|课堂|讲义|教案|课件/,
  /(?:称为|叫做|称为|定义为|称之为|所谓)[^。！？!?]{0,6}(?:谬误|错误|现象)/,
  /(?:法庭|司法|证据)(?:科学|统计学|鉴定学)/,
];
const EXEMPT_META_EN = [
  /\bprosecutor'?s?\s+fallacy\b/i, /\blogical\s+fallacy\b/i,
  /\bbase\s+rate\s+(?:fallacy|neglect)/i, /\btransposed\s+conditional\b/i,
  /\bbayesian\b/i, /\bcourse\b|\btextbook\b|\blecture\b|\bconcept\b|\bdefined\s+as\b/i,
  /\bcalled\s+(?:the\s+)?(?:prosecutor|base\s+rate)/i,
];

// ─── 工具 ─────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 位置收集：返回 [{idx, end, raw}] 供距离窗判定用 */
function collect(re, text) {
  const out = [];
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = g.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m[0].length === 0) g.lastIndex++;
  }
  return out;
}

// ─── 邻近窗（与 r216 collider_bias / r232 appeal_to_rumor 同口径）──
const WIN_ZH = 80;
const WIN_EN = 200;

/** 是否显式对冲（可能/也许/maybe 等）——命中则不判
 *  r233 实测修正：对冲只应作用于**有罪结论腿自身**，不得作用于全文——
 *  「几乎不可能是巧合」中的「可能」是概率陈述而非对定罪结论的对冲，
 *  按全文检查会把整句吞掉（r233 矩阵实测漏判 3 句的根因）。
 * 「可能性高达/是/为」是概率名词短语（本族腿①的组成），不是对冲。
 * [r262] 「不可能」是确定性/排除标记（impossible = certainly not，对冲的
 * 反面，本族排除形「除了他不可能有别人」的核心词），不是对冲——对「可能」
 * 加 (?<！不) 负回顾， preceded-by-不 时不算对冲（「他可能有罪」仍正常豁免）。 */
const HEDGE_ZH = /(?:也许|未必|不一定|大概|恐怕|说不定|疑似|疑为|或许|兴许|不见得)|(?<!不)可能(?!性(?:\s*(?:高达|达到|超过|高|低|是|为|有|就是|等于|仅为|只有|不足|不到|低至|高于|低于)))/;
const HEDGE_EN = /\b(?:might|may|could|possibly|perhaps|maybe|seemingly|allegedly|supposedly)\b/i;

/** 是否否定翻转（不意味着/does not mean）——命中则不判 */
const NEGATE_ZH = /(?:不意味|推不出|并不能说明|不代表|不足以说明|不能说明|不能推出|并非必然)/;
const NEGATE_EN = /\b(?:does\s+not|doesn'?t|do\s+not|don'?t|cannot|can'?t)\s+(?:mean|imply|entail|suggest|indicate|prove)\b/i;

/** 疑问/反问标记（反问不豁免）——本维度只豁免真疑问句（?/？） */
const QUESTION_MARK = /[?？]/;
const RHETORICAL_ZH = /(?:难道|岂|凭什么|何尝|岂不是|谈何|难不成|莫非)/;
const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|how\s+else|what\s+else|who\s+doesn'?t|if\s+not)\b/i;

/**
 * 检察官谬误判定（供负例注入脚本调用内部常量）
 * @returns {{hit:boolean, dimension:string, severity:number, score:number,
 *            count:number, evidence:string[], details:string, guidance:string}}
 */
function detectProsecutorsFallacy(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }
  const R = inject || {};

  // ── 豁免一：正确判别 / 证伪 ──
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text)) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }
  if (anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }
  // ── 豁免二：元话语 / 教学转述 ──
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text)) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }
  if (anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }
  // ── 豁免三：显式对冲 / 否定翻转 ──
  // r233 实测修正：对冲只作用于**有罪结论腿自身**（腿②的匹配串），
  // 不得作用于全文——「几乎不可能是巧合，他有罪」中的「可能」属于
  // 概率陈述（腿①侧），不是对定罪结论的对冲，按全文检查会把整句吞掉
  // （r233 矩阵实测漏判 3 句的根因）。故此处改为逐腿检查（见下方
  // per-leg HEDGE 过滤），全文级只保留否定翻转。
  if (NEGATE_ZH.test(text) || NEGATE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }
  // ── 豁免四：真疑问句（反问不豁免，同 r216 口径）──
  if (QUESTION_MARK.test(text)
      && !RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }

  // ── 语言判定（含中文即按中文腿跑，EN 同理；混排两套都跑）──
  const hasZh = /[\u4e00-\u9fa5]/.test(text);
  const hasEn = /[a-zA-Z]{3,}/.test(text);
  if (!hasZh && !hasEn) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }

  const evidence = [];
  const langs = [];
  if (hasZh) langs.push('zh');
  if (hasEn) langs.push('en');

  for (const lang of langs) {
    const rareList = lang === 'zh' ? (R.RARE_MATCH_ZH || RARE_MATCH_ZH) : (R.RARE_MATCH_EN || RARE_MATCH_EN);
    const guiltList = lang === 'zh' ? (R.GUILT_INFERENCE_ZH || GUILT_INFERENCE_ZH) : (R.GUILT_INFERENCE_EN || GUILT_INFERENCE_EN);
    const win = lang === 'zh' ? WIN_ZH : WIN_EN;

    const rares = [];
    for (const re of rareList) { for (const h of collect(re, text)) rares.push(h); }
    const guilts = [];
    for (const re of guiltList) { for (const h of collect(re, text)) guilts.push(h); }
    if (!rares.length || !guilts.length) continue;

    for (const a of rares) {
      for (const b of guilts) {
        // 逐腿对冲过滤：有罪结论腿自身含对冲词时不构成断定（r233 修正）
        if (lang === 'zh' && HEDGE_ZH.test(b.raw)) continue;
        if (lang === 'en' && HEDGE_EN.test(b.raw)) continue;
        const dist = Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
        if (dist > win) continue;
        // 两腿不得为同一串（同一处文本既是概率又是有罪结论）
        if (a.idx === b.idx && a.end === b.end) continue;
        evidence.push((lang === 'zh' ? '' : '') + a.raw + ' × ' + b.raw);
        break;
      }
      if (evidence.length) break;
    }
  }

  if (!evidence.length) {
    return { hit: false, score: 0, detail: '', count: 0, evidence: [] };
  }

  // 多签名加分：两个语段各出现一次独立共现即 count=2，severity 上浮
  const count = evidence.length;
  const severity = Math.min(90, 55 + (count - 1) * 10);
  const score = Math.min(0.9, 0.55 + (count - 1) * 0.1);
  const langLabel = langs.includes('zh') && langs.includes('en') ? 'zh+en' : (langs[0] || 'zh');

  return {
    hit: true,
    dimension: 'prosecutors_fallacy',
    severity,
    score,
    count,
    evidence,
    details: '检察官谬误(' + count + '处: ' + evidence.slice(0, 3).map(e => '「' + e + '」').join('、')
      + ')——把总体中的小概率匹配率当成个体的高概率有罪，忽略先验概率与假阳性率(' + langLabel + ')',
    guidance: '小概率匹配不等于高概率有罪：P(证据|无辜) 与 P(无辜|证据) 是两个不同的量。给出匹配率的同时必须给出先验概率与假阳性率（总体中预期假阳性人数 = 匹配率 × 受检人数），并说明该证据单独能否达到证明标准；不能把「百万分之一的巧合」直接读成「就是他」。',
  };
}

module.exports = {
  detectProsecutorsFallacy,
  __internals: () => ({
    RARE_MATCH_ZH, RARE_MATCH_EN, GUILT_INFERENCE_ZH, GUILT_INFERENCE_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN, EXEMPT_META_ZH, EXEMPT_META_EN,
    WIN_ZH, WIN_EN,
  }),
};
