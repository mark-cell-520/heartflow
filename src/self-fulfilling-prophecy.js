/**
 * src/self-fulfilling-prophecy.js — 「自我应验预言 / 自败预言」检测器
 * （ provisional 第 217 个判别维度，r232 起草；src/index.js 接线规格见
 * coordination/reports/r232-dimension-agent4.md。编号 provisional 的原因同
 * r228/r229：远端已有若干已起草未接线维度占号，最终编号由 1 号按接线顺序
 * 在 VERIFY_DIMS 登记序重排）
 *
 * [r232 立项] r227 审计转正的缺口探针 scripts/round-221/probe-gap-r221.js
 * 在 v6.8.145 上复跑：候选 6 族 20 句中「自我应验预言/自败预言」族 8 句
 * 里 5 句完全穿引擎（belief→behavior→confirmation 闭环），剩余 3 句被
 * pseudo_causal / post_hoc 等既有维度代拦——本族是探针里**成规模残余
 * 漏判的第二大家族**（第一大家族匿名消息源已被 r228/r229 覆盖）。
 * 覆盖度检查：grep src/ self.fulfilling / 自败 / 应验 = wishful-thinking
 * （「我想所以会成」的单向愿望必然化）、unfalsifiable-confirmation
 * （「实现/没实现都算对」的对举极性）零命中「信念改变行为、行为再制造
 * 预期结果」的正反馈闭环结构。
 *
 * 外部来源（真实可查，非编造）：
 *   · Wikipedia "Self-fulfilling prophecy"（HN Algolia 命中，本机抓取
 *     REST summary 实测）——"A self-fulfilling prophecy is a prediction
 *     that comes true at least in part as a result of a person's belief
 *     or expectation that the prediction would come true. In the
 *     phenomena, people tend to act the way they have been expected to
 *     in order to make the expectations come true. Self-fulfilling
 *     prophecies are an example of the more general phenomenon of
 *     positive feedback loops."
 *   · Jussim, "Accuracy dominates bias and self-fulfilling prophecy"
 *     （Behavioral and Brain Sciences，HN Algolia 命中 PDF，
 *     internal.psychology.illinois.edu/~acimpian/reprints/
 *     jussim_BBS.pdf）——自我应验预言的效应量与「预期→行为→结果」
 *     传导链的实证讨论。
 *   · 原始侦察落盘：/tmp/hf-scout-1793973280.txt（HN Algolia 6 条命中、
 *     Semantic Scholar 429 限流、GitHub fallacy-detection 仓库 5 个均为
 *     LLM 路线，无可集成的纯规则模块）。
 *
 * 辨别的族：自我应验预言（self-fulfilling prophecy）与自败预言
 * （self-defeating prophecy）——把一个**预期/信念**说成**被结果证实**，
 * 而这个结果本身就是该预期**驱动行为**制造出来的：
 *   因为他知道自己会被歧视，所以他干脆不申请，最后果然没能入选。
 *   所有投资人都不看好这家公司，撤资之后它果然就倒闭了。
 *   早就有人说这个项目会黄，结果大家真的都按会黄的方式准备，项目就黄了。
 *   因为害怕考试成绩差，她提前放弃了复习，最后成绩真的很差。
 *   他一再说这段感情撑不过三年，对方最后真的选择了离开。
 *   The team believed they would fail the audit, so they stopped trying
 *   and failed.
 *   The prophecy of a bank run caused depositors to withdraw, and the
 *   bank did collapse.
 *   He kept insisting the relationship would not last three years, and
 *   in the end she really did leave.
 *
 * 为什么这是判别者的核心缺口：这是**循环论证的因果版**——预言被自己的
 * 回声证实。信念本身不产生结果，是「顺应信念的行为」产生了结果，再把
 * 结果当成信念准确的独立证据，构成正反馈闭环。判别动作是**拆开传导
 * 链**（结果里有多少是预期自己制造的），而不是接受或否定预言内容。
 * 这套结构在标签效应（merely applying a label can create the
 * prophecy）、银行挤兑、人才流失、团队士气、市场恐慌里反复出现。
 *
 * 与既有维度的边界（r232 归因）：
 *   · wishful_thinking（第147维）管「我想所以会成」的单向愿望必然化，
 *     不要求行为传导腿，也不要求结果确认腿；本族三腿齐备。
 *   · unfalsifiable_confirmation（第202维）管「实现/没实现都算对」的
 *     对举极性，本族要求**单向印证**（结果与预言同向）。
 *   · pseudo_causal / post_hoc / false_cause 管编造或误用因果机制、
 *     时间先后当因果；本族的因果链可以完全真实，错在**把自造结果
 *     当作独立证据**（循环确认）。
 *   · appeal_to_consequences（第164维）管「后果糟所以不是真的」，
 *     方向相反；本族是「我的预期被证实了」。
 *   · anonymous_source_claim（第215维）管来源不可指认，本族不关心
 *     来源只关心传导链结构。
 *
 * 判据（三腿共现，缺一不判）：
 *   ① 腿① EXPECT 信念/预言在场：心理动词（相信/认为/觉得/担心/害怕/
 *     生怕/预期/断言/预言/不看好/心想）+ 结果性预期（会/必然/注定/
 *     迟早）；或言语动词（说/预言/断言/强调/警告/提醒/不看好）+ 频率
 *     或来源限定（早就有人/有人说/大家都/他一再/反复/不断/多次）；
 *     EN believed / thought / expected / feared / worried / predicted /
 *     prophesied / insisted / kept saying + would / will / was bound to。
 *   ② 腿② BEHAVIOR 信念驱动行为在场，两种子形：
 *      (a) 自我挫败行为（ believer 自己的反生产动作）：干脆不/提前放弃/
 *         放弃/不再/停止/撤回/撤资/退出/不申请/不尝试/不作为/逃避/
 *         按…的方式准备；EN stopped trying / gave up / withdrew / pulled
 *         out / quit / stopped applying / didn't bother / resigned
 *         themselves to；
 *      (b) 他人顺从行为（预期传导到第三方，第三方按预期行动）：对方/
 *         他们/大家/别人/团队/储户/投资者/客户/员工 + 选择了离开/取款/
 *         撤资/退出/放弃/离开/照办/跟进；EN depositors withdrew /
 *         investors fled / staff started looking for other jobs。
 *   ③ 腿③ CONFIRM 结果反向印证在场：果然/果真/真的/最后真的/结果真的/
 *     不出所料/意料之中/应验/说中了/猜中了/就…了；EN as predicted /
 *     as expected / sure enough / came true / did in fact / ended up /
 *     and indeed。
 *
 * 为什么取 VERIFY 级：自我应验预言在心理学、社会学、组织行为学里是
 * 正当研究对象（罗森塔尔效应、标签效应、皮革马利翁效应），文学与
 * 历史叙事也大量使用；rewrite/block 会误伤这些正当场景。verify 的
 * 含义是「这段文本把预期驱动的结果当成预期准确的独立证据，需要先
 * 拆开传导链（有多少结果是预期自己制造的）再把结论当证据用」。
 *
 * 明确不判的（豁免）：
 *   · 证据支持的预测（数据显示/研究表明/模型预测/统计表明/forecast
 *     based on / according to the data）+ 结果——预测有独立依据，
 *     不是信念回声；
 *   · 预备性/防护性行为（带伞/准备/防范/加固/备份/上保险/演练/prepared/
 *     insured/backed up）——行为不产生被预言的结果，「担心下雨所以
 *     带伞，结果真的下雨了」是正确预判，本族核心反例；
 *   · 元话语/教学转述（自我应验预言/自败预言/罗森塔尔效应/皮革马利翁
 *     效应/标签效应/预期效应/self-fulfilling prophecy/rosenthal effect/
 *     pygmalion effect/labeling theory）——讨论概念本身；
 *   · 显式对冲（可能/也许/未必/不一定/大概率/might/maybe/possibly）；
 *   · 疑问句（含 ?/？）——提问不是断言闭环；
 *   · 复述他人观点/新闻报道（据报道/他说/according to/ witnesses said）
 *     ——转述不是本人在作循环论证；
 *   · 否定翻转（不意味着/并不能说明/does not mean / 不等于）——
 *     正在破除闭环的陈述。
 */
'use strict';

// ─── 腿① 信念/预言的心理与言语动词（中文）────────────────────────
// 心理动词：主体内心持有预期
const BELIEF_PSY_ZH = [
  /相信/, /认为/, /觉得/, /以为/, /担心/, /害怕/, /生怕/, /预期/,
  /预料/, /预计/, /确信/, /认定/, /心想/, /恐惧/, /不安/,
  // [r231 接手 修] 「知道」补入——「因为他知道自己会被歧视，所以干脆
  // 不申请，最后果然没能入选」是标准自我应验结构，腿①却因「知道」缺表
  // 整句漏判。与 r228 教训同口径：心理动词族必须收最常用认知动词。
  /知道/, /清楚/, /明白/, /确信/, /深信/,
];
// 言语动词须配频率/来源限定（「早就有人说」「他一再说」「反复强调」）
// 注意（r228 实测教训迁移）：言语腿必须收**裸名词形态**（预言/预期），
// 否则「The prophecy of a bank run caused...」这种以预言名词作主语的
// 经典句式整句漏判（161 轮教训：只收带后缀的动词会漏裸名词族）。
const BELIEF_SPEECH_ZH = [
  /说/, /预言/, /断言/, /强调/, /警告/, /提醒/, /坚持/, /宣称/,
];
// 言语动词的频率/来源限定：「早就有人说」「他一再说」「反复强调」
const BELIEF_SPEECH_QUAL_ZH = [
  /早就有人/, /有人说/, /大家都说/, /大家都/, /他一再/, /他一再/, /反复/,
  /不断/, /多次/, /一再/, /时常/, /总是/, /天天/, /逢人便说/,
];
// 结果性预期标记：把信念锚到一个「会发生的结果」上
const EXPECT_MARK_ZH = /(?:会|必然|注定|迟早|终将|必将|定会)/;
// 负面/中性结果名词（被预期的对象）
const RESULT_NOUN_ZH = [
  /失败/, /考差/, /不及格/, /落选/, /落榜/, /被歧视/, /被拒绝/, /被淘汰/,
  /破产/, /崩盘/, /倒闭/, /垮掉/, /黄了/, /离开/, /分手/, /离婚/,
  /失去/, /丢失/, /输掉/, /垫底/, /被辞退/, /被裁员/, /崩/,
  /暴跌/, /大跌/, /完蛋/, /不行/, /撑不过/, /过不去/, /熬不过/,
  // [r231 接手 修] 名词+结果词跨词距形——「害怕考试成绩差」「担心业绩
  // 下滑」「怕项目失败」腿①锚点落在名词（成绩/业绩/项目）与结果词
  // （差/下滑/失败）之间，缺跨词距正则则锚定失败。
  /成绩.{0,3}(?:差|差劲|下滑|下降)/, /业绩.{0,3}(?:差|下滑|下降|不达标)/,
  /项目.{0,3}(?:失败|黄|延期|超支)/, /婚姻.{0,3}(?:失败|破裂|走到头)/,
  /身体.{0,3}(?:垮|出问题|不好)/, /关系.{0,3}(?:破裂|恶化|僵)/,
];
// 顺向预期动词短语（不看好/看好 + 对象）
const OUTLOOK_ZH = /(?:不看好|看衰|看空|一致看空|普遍认为.*不行|没人相信)/;

// ─── 腿①（英文）────────────────────────────────────────────────
const BELIEF_PSY_EN = [
  /\bbelieved\b/i, /\bthought\b/i, /\bexpected\b/i, /\bfeared\b/i,
  /\bworried\b/i, /\bwas worried\b/i, /\bassumed\b/i, /\bconvinced\b/i,
  /\banticipated\b/i, /\bsuspected\b/i, /\bknew\b/i, /\bwas sure\b/i,
];
const BELIEF_SPEECH_EN = [
  /\bpredicted\b/i, /\bprophesied\b/i, /\binsisted\b/i, /\bwarned\b/i,
  /\bkept saying\b/i, /\bkept insisting\b/i, /\bforetold\b/i,
  /\bforecast\b/i, /\bsaid\b/i, /\btold everyone\b/i,
  // 裸名词形态：预言本身作主语（The prophecy of ... caused ...）
  /\bprophecy\b/i, /\bprediction\b/i, /\bexpectation\b/i, /\bforecast\b/i,
  /\bprediction that\b/i, /\bbelief that\b/i,
];
const EXPECT_MARK_EN = /\b(?:would|will|was bound to|were bound to|was going to|were going to|was doomed|were doomed)\b/i;
const RESULT_NOUN_EN = [
  /\bfail(?:ed|ure)?\b/i, /\bflunk\b/i, /\breject(?:ed|ion)?\b/i,
  /\bdiscriminat(?:e|ed|ion)\b/i, /\bbankrupt(?:cy)?\b/i, /\bcrash(?:ed)?\b/i,
  /\bcollapse[ds]?\b/i, /\bleave\b/i, /\bleft\b/i, /\bbreak ?up\b/i,
  /\bdivorce\b/i, /\bfired\b/i, /\blaid off\b/i, /\bplunge[ds]?\b/i,
  /\bplummet(?:ed)?\b/i, /\bnot last\b/i, /\bwouldn't last\b/i,
];

// ─── 腿② 自我挫败行为（ believer 自己的反生产动作）────────────────
const SELFDEFEAT_ZH = [
  /干脆不/, /索性不/, /直接不/, /提前放弃/, /提前退出/, /放弃/,
  /不再/, /停止/, /撤回/, /撤资/, /撤出/, /退出/, /不申请/, /不报名/,
  /不尝试/, /不争取/, /不作为/, /逃避/, /回避/, /破罐/, /自暴自弃/,
  /照会黄/, /按会黄/, /按会失败/, /按会崩/, /躺平/, /摆烂/,
];
// 他人顺从行为（预期传导到第三方，第三方按预期行动）
// 注意（r232 实测教训）：`.*` 贪婪会一路吞到句尾，把腿③确认标记也吃进
// 腿②窗口，导致三腿判据在「他一再说…对方最后真的离开了」这类
// 收尾句上失效。一律用非贪婪 `.{0,N}?` 并禁止跨确认标记。
const CONFORM_ZH = [
  /对方.{0,12}?(?:离开|分手|退出|放弃)/, /他们.{0,12}?(?:撤资|退出|离开|放弃|取款)/,
  /大家.{0,8}?(?:按|照|都)/, /别人.{0,8}?(?:也)/, /团队.{0,12}?(?:停止|解散)/,
  /储户.{0,12}?(?:取款|挤兑|撤)/, /投资者.{0,12}?(?:撤|逃离|跑)/,
  /客户.{0,12}?(?:流失|退单|解约)/, /员工.{0,12}?(?:离职|跳槽|找工作|简历)/,
];
const SELFDEFEAT_EN = [
  /\bstopped trying\b/i, /\bgave up\b/i, /\bwithdrew\b/i, /\bpulled out\b/i,
  /\bquit\b/i, /\bstopped applying\b/i, /\bdidn'?t bother\b/i,
  /\bstopped bothering\b/i, /\bresigned themselves\b/i, /\bstopped working\b/i,
  /\bstopped trying\b/i, /\bno longer tried\b/i, /\babandoned\b/i,
  /\bplanned for failure\b/i, /\bprepared for failure\b/i,
];
const CONFORM_EN = [
  /\bdepositors withdrew\b/i, /\binvestors fled\b/i, /\bstaff started looking\b/i,
  /\bemployees started looking\b/i, /\bcustomers left\b/i, /\binvestors pulled out\b/i,
  /\bpeople started leaving\b/i, /\bthe team stopped\b/i,
  /\bdepositors (?:to )?withdraw\b/i, /\bcaused depositors\b/i,
  /\btriggered a (?:bank )?run\b/i, /\brush to withdraw\b/i,
  /\bmade investors\b/i, /\bforced staff\b/i,
];

// ─── 腿③ 结果反向印证标记（中文）────────────────────────────────
const CONFIRM_ZH = [
  /果然/, /果真/, /真的(?:没能|没有|失败|落选|破产|倒闭|离开|崩|黄|垮|差|分手|差劲)/,
  /最后真的/, /结果真的/, /后来真的/, /最终真的/, /没想到.*真的/,
  /(?:成绩|表现|结果|结局|业绩).{0,4}真的很差/, /(?:真的|果然)(?:很|极|非常)?(?:差|糟糕|烂|糟)/,
  /不出所料/, /意料之中/, /应验/, /说中了/, /猜中了/, /就(?:黄|垮|失败|倒闭|崩|散|没)了/,
];
const CONFIRM_EN = [
  /\bas predicted\b/i, /\bas expected\b/i, /\bsure enough\b/i,
  /\bcame true\b/i, /\bdid in fact\b/i, /\bended up\b/i, /\band indeed\b/i,
  /\bin the end.*\bfailed\b/i, /\bwhich is exactly what happened\b/i,
  /\band (?:they )?(?:did|failed|collapsed|went bankrupt|left)\b/i,
  /\bdid collapse\b/i, /\bwent under\b/i, /\bdid fail\b/i,
];

// 腿间距离窗（字符）
const WIN_LEG_ZH = 40;
const WIN_LEG_EN = 90;

// ─── 豁免一：证据支持的预测（预测有独立依据，不是信念回声）────────
const EXEMPT_EVIDENCE_ZH = [
  /数据显示/, /数据表明/, /研究表明/, /统计表明/, /模型预测/,
  /数据显示.*失败率/, /根据.*数据/, /据.*统计/, /实证/, /实验证明/,
  /同行评审/, /可验证/, /有据可查/, /历史数据/,
];
const EXEMPT_EVIDENCE_EN = [
  /\baccording to the data\b/i, /\bdata (?:show|shows|indicate|indicates)\b/i,
  /\bresearch (?:show|shows|indicate|indicates)\b/i,
  /\bstatistics (?:show|shows|indicate|indicates)\b/i,
  /\bforecast based on\b/i, /\bthe model predict(?:s|ed)\b/i,
  /\bpeer[- ]reviewed\b/i, /\bempirical(?:ly)?\b/i,
];

// ─── 豁免二：预备性/防护性行为（行为不产生被预言的结果）───────────
// 本族核心反例：「担心下雨所以带伞，结果真的下雨了」是正确预判。
const EXEMPT_PREP_ZH = [
  /带伞/, /带了伞/, /准备了伞/, /防范/, /加固/, /备份/, /上保险/, /买了保险/,
  /演练/, /预习/, /复习(?:了|一遍)(?![，,。]?(?:最后|结果))/, /戴口罩/, /打疫苗/, /体检/, /排查/,
  /预防/, /预案/, /绸缪/, /未雨绸缪/, /防风/, /防汛/, /防灾/,
  // [r231 接手 修] 「准备」不再无条件豁免——「按会黄的方式准备」「按崩盘
  // 预案做准备」恰是本族自败行为腿②，(b) 他人顺从子形；只有真正的
  // 防护性预备（防灾/防汛/预案/绸缪/加固/备份/上保险）才豁免。
  /准备(?![^\n。]{0,10}(?:会|按|照).{0,6}(?:黄|失败|崩|垮|倒闭|裁员|离开|差))/,
];
const EXEMPT_PREP_EN = [
  /\bbrought an umbrella\b/i, /\btook an umbrella\b/i, /\bprepared\b/i,
  /\binsur(?:ed|ance)\b/i, /\bbacked up\b/i, /\brehearsed\b/i,
  /\bwore a mask\b/i, /\bvaccinat(?:e|ed|ion)\b/i, /\bscreen(?:ed|ing)\b/i,
  /\bprecaution\b/i, /\bmitigat(?:e|ed|ion)\b/i, /\bcontingency\b/i,
];

// ─── 豁免三：元话语/教学转述（讨论概念本身）───────────────────────
// 注意（r228 实测教训迁移）：只收复合形式，裸词「预言」会造成误豁免。
const EXEMPT_META_ZH = [
  /自我应验预言/, /自败预言/, /自我实现预言/, /罗森塔尔效应/,
  /皮革马利翁效应/, /标签效应/, /预期效应/, /心理学(?:里|中|上)/,
  /社会学/, /社会心理学/, /教科书/, /心理学实验/, /这个概念/,
  /这种效应/, /这一效应/,
];
const EXEMPT_META_EN = [
  /\bself[- ]fulfilling prophecy\b/i, /\bself[- ]defeating prophecy\b/i,
  /\brosenthal effect\b/i, /\bpygmalion effect\b/i, /\blabeling theory\b/i,
  /\bexpectancy effect\b/i, /\btextbook\b/i, /\bpsychology\b/i,
  /\bsociology\b/i, /\bthis (?:concept|effect|phenomenon)\b/i,
];

// ─── 豁免四：显式对冲 ────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [/可能/, /也许/, /未必/, /不一定/, /大概率/, /或许/];
const EXEMPT_HEDGE_EN = [/\bmight\b/i, /\bmaybe\b/i, /\bpossibly\b/i, /\bperhaps\b/i, /\bnot necessarily\b/i];

// ─── 豁免五：复述他人观点/新闻报道 ──────────────────────────────
const EXEMPT_REPORT_ZH = [/据报道/, /报道称/, /据统计/, /他说/, /她说/, /有人认为/, /有人指出/];
const EXEMPT_REPORT_EN = [/\baccording to\b/i, /\breportedly\b/i, /\bwitnesses said\b/i, /\bsources said\b/i];

// ─── 豁免六：否定翻转（正在破除闭环的陈述）─────────────────────
const EXEMPT_NEGFLIP_ZH = [/不意味着/, /并不能说明/, /不等于/, /未必能/, /无法证明/];
const EXEMPT_NEGFLIP_EN = [/\bdoes not mean\b/i, /\bdoesn'?t mean\b/i, /\bnot evidence\b/i, /\bcannot prove\b/i];

// ─── 工具 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

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

/**
 * 中文侧：腿①信念/预言 + 腿②行为 + 腿③确认，三腿按序共现
 */
function findSignaturesZh(text, R) {
  const psy = R.BELIEF_PSY_ZH || BELIEF_PSY_ZH;
  const speech = R.BELIEF_SPEECH_ZH || BELIEF_SPEECH_ZH;
  const speechQual = R.BELIEF_SPEECH_QUAL_ZH || BELIEF_SPEECH_QUAL_ZH;
  const expectMark = pickRe(R.EXPECT_MARK_ZH, EXPECT_MARK_ZH);
  const resultNoun = R.RESULT_NOUN_ZH || RESULT_NOUN_ZH;
  const outlook = pickRe(R.OUTLOOK_ZH, OUTLOOK_ZH);
  const selfdefeat = R.SELFDEFEAT_ZH || SELFDEFEAT_ZH;
  const conform = R.CONFORM_ZH || CONFORM_ZH;
  const confirmRe = R.CONFIRM_ZH || CONFIRM_ZH;
  const sigs = [];

  // 收集腿①候选位置
  const leg1 = [];
  for (const re of psy) for (const m of allMatches(re, text)) leg1.push({ idx: m.idx, end: m.end, raw: m.raw, kind: 'psy' });
  for (const m of allMatches(outlook, text)) leg1.push({ idx: m.idx, end: m.end, raw: m.raw, kind: 'outlook' });
  // 言语动词须配频率/来源限定
  for (const qre of speechQual) {
    for (const qm of allMatches(qre, text)) {
      const winEnd = Math.min(text.length, qm.end + 16);
      let seg = text.slice(qm.end, winEnd);
      let segBase = qm.end;
      // 频率限定词紧贴言语动词时（「他一再 说」），窗口需含起点本身
      if (qm.end > 0) { seg = text.charAt(qm.end - 1) + seg; segBase = qm.end - 1; }
      for (const sre of speech) {
        const sm = sre.exec(seg);
        if (sm) {
          leg1.push({ idx: qm.idx, end: segBase + sm.index + sm[0].length, raw: qm.raw + sm[0], kind: 'speech' });
          break;
        }
      }
    }
  }
  leg1.sort((a, b) => a.idx - b.idx);

  const seen1 = new Set();
  for (const l1 of leg1) {
    const key = l1.idx + '|' + l1.end;
    if (seen1.has(key)) continue;
    seen1.add(key);
    // 腿①须在近距离窗内锚到结果性预期
    const seg1 = text.slice(l1.end, Math.min(text.length, l1.end + WIN_LEG_ZH));
    let anchored = false;
    if (l1.kind === 'outlook') anchored = true;
    if (!anchored && expectMark.test(seg1)) anchored = true;
    if (!anchored) { for (const rn of resultNoun) { if (rn.test(seg1)) { anchored = true; break; } } }
    if (!anchored) continue;

    // 腿②：行为须出现在腿①之后 WIN_LEG_ZH 内
    const seg2 = text.slice(l1.end, Math.min(text.length, l1.end + WIN_LEG_ZH));
    let beh = null;
    for (const re of selfdefeat) { const m = re.exec(seg2); if (m) { beh = { raw: m[0], start: l1.end + m.index, end: l1.end + m.index + m[0].length, kind: 'selfdefeat' }; break; } }
    if (!beh) for (const re of conform) { const m = re.exec(seg2); if (m) { beh = { raw: m[0], start: l1.end + m.index, end: l1.end + m.index + m[0].length, kind: 'conform' }; break; } }
    if (!beh) continue;

    // 腿③：确认标记须出现在腿②**起始**之后（不必等腿②结束——
    // r232 实测：「对方最后真的选择了离开」中腿② conform 非贪婪仍可能
    // 覆盖确认标记，若要求 beh.end 之后则 seg3 只剩句号而失配）。
    const seg3 = text.slice(beh.start, Math.min(text.length, beh.start + WIN_LEG_ZH));
    let conf = null;
    for (const re of confirmRe) { const m = re.exec(seg3); if (m) { conf = { raw: m[0] }; break; } }
    if (!conf) continue;

    sigs.push({ lang: 'zh', belief: l1.raw, behavior: beh.raw, kind: beh.kind, confirm: conf.raw });
    if (sigs.length >= 3) break;
  }
  return sigs;
}

/**
 * 英文侧：腿①信念/预言 + 腿②行为 + 腿③确认，三腿按序共现
 */
function findSignaturesEn(text, R) {
  const psy = R.BELIEF_PSY_EN || BELIEF_PSY_EN;
  const speech = R.BELIEF_SPEECH_EN || BELIEF_SPEECH_EN;
  const expectMark = pickRe(R.EXPECT_MARK_EN, EXPECT_MARK_EN);
  const resultNoun = R.RESULT_NOUN_EN || RESULT_NOUN_EN;
  const selfdefeat = R.SELFDEFEAT_EN || SELFDEFEAT_EN;
  const conform = R.CONFORM_EN || CONFORM_EN;
  const confirmRe = R.CONFIRM_EN || CONFIRM_EN;
  const sigs = [];

  const leg1 = [];
  for (const re of psy) for (const m of allMatches(re, text)) leg1.push({ idx: m.idx, end: m.end, raw: m.raw, kind: 'psy' });
  for (const re of speech) for (const m of allMatches(re, text)) leg1.push({ idx: m.idx, end: m.end, raw: m.raw, kind: 'speech' });
  leg1.sort((a, b) => a.idx - b.idx);

  const seen1 = new Set();
  for (const l1 of leg1) {
    const key = l1.idx + '|' + l1.end;
    if (seen1.has(key)) continue;
    seen1.add(key);
    const seg1 = text.slice(l1.end, Math.min(text.length, l1.end + WIN_LEG_EN));
    let anchored = false;
    if (expectMark.test(seg1)) anchored = true;
    if (!anchored) { for (const rn of resultNoun) { if (rn.test(seg1)) { anchored = true; break; } } }
    if (!anchored) continue;

    const seg2 = text.slice(l1.end, Math.min(text.length, l1.end + WIN_LEG_EN));
    let beh = null;
    for (const re of selfdefeat) { const m = re.exec(seg2); if (m) { beh = { raw: m[0], end: l1.end + m.index + m[0].length, kind: 'selfdefeat' }; break; } }
    if (!beh) for (const re of conform) { const m = re.exec(seg2); if (m) { beh = { raw: m[0], end: l1.end + m.index + m[0].length, kind: 'conform' }; break; } }
    if (!beh) continue;

    const seg3 = text.slice(beh.end, Math.min(text.length, beh.end + WIN_LEG_EN));
    let conf = null;
    for (const re of confirmRe) { const m = re.exec(seg3); if (m) { conf = { raw: m[0] }; break; } }
    if (!conf) continue;

    sigs.push({ lang: 'en', belief: l1.raw, behavior: beh.raw, kind: beh.kind, confirm: conf.raw });
    if (sigs.length >= 3) break;
  }
  return sigs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectSelfFulfillingProphecy(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免：提问不是断言闭环
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 豁免一~六（任一命中即不判）
  if (anyHit(R.EXEMPT_EVIDENCE_ZH || EXEMPT_EVIDENCE_ZH, text) || anyHit(R.EXEMPT_EVIDENCE_EN || EXEMPT_EVIDENCE_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_PREP_ZH || EXEMPT_PREP_ZH, text) || anyHit(R.EXEMPT_PREP_EN || EXEMPT_PREP_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_REPORT_ZH || EXEMPT_REPORT_ZH, text) || anyHit(R.EXEMPT_REPORT_EN || EXEMPT_REPORT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(R.EXEMPT_NEGFLIP_ZH || EXEMPT_NEGFLIP_ZH, text) || anyHit(R.EXEMPT_NEGFLIP_EN || EXEMPT_NEGFLIP_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 双语双跑
  const sigs = [...findSignaturesZh(text, R), ...findSignaturesEn(text, R)];
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 3 ? 0.78 : 0.62;
  return {
    hit: true,
    dimension: 'self_fulfilling_prophecy',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '「' + x.belief + '」→「' + x.behavior + '」→「' + x.confirm + '」'
      : '"' + x.belief + '" -> "' + x.behavior + '" -> "' + x.confirm + '"')),
    details: s.lang === 'zh'
      ? '自我应验预言(' + sigs.length + '处: 如「' + s.belief + '」驱动「' + s.behavior + '」再被「' + s.confirm + '」反向印证，构成信念→行为→结果的正反馈闭环)(zh)'
      : 'self-fulfilling prophecy(' + sigs.length + 'x: e.g. "' + s.belief + '" drove "' + s.behavior + '" which was then "confirmed" by "' + s.confirm + '" — a belief-behavior-outcome feedback loop)(en)',
    guidance: '不得把**预期驱动行为制造出来的结果**当成**该预期准确的独立证据**——自我应验预言/自败预言（self-fulfilling / self-defeating prophecy）是「因为他相信自己会被歧视，所以干脆不申请，最后果然没能入选」（The team believed they would fail the audit, so they stopped trying and failed. / The prophecy of a bank run caused depositors to withdraw, and the bank did collapse.）这类**信念→行为→结果反向印证信念**的正反馈闭环。预言被自己的回声证实，不是预言准确的证据。判据**三腿共现**（缺一不判）：腿① EXPECT 信念/预言在场（相信/认为/担心/害怕/预期/断言/预言/不看好/他一再说 + 会/必然/注定；EN believed/feared/predicted/insisted + would/was bound to）；腿② BEHAVIOR 信念驱动行为在场——(a) 自我挫败行为（干脆不/提前放弃/不再/撤回/撤资/退出/不申请/不作为/按会黄的方式准备；EN stopped trying/gave up/withdrew/pulled out）或 (b) 他人顺从行为（对方/储户/投资者/团队 + 离开/取款/撤资/退出/照办；EN depositors withdrew/investors fled）；腿③ CONFIRM 结果反向印证（果然/真的/最后真的/不出所料/应验/说中了/就黄了；EN as predicted/came true/did in fact/ended up）。正当做法是**拆开传导链**（结果里有多少是预期自己制造的：不申请当然不会入选，这不是歧视预言的证据）、**给预期补独立证据**（可验证的基线数据/对照组/历史先例，而不是行为回声）、或**把预期降级为待验证假设之一**。边界：wishful_thinking（第147维）管「我想所以会成」的单向愿望必然化，不要求行为传导腿与结果确认腿；unfalsifiable_confirmation（第202维）管「实现/没实现都算对」的对举极性，本族要求单向印证；pseudo_causal/post_hoc/false_cause 管编造或误用因果机制，本族的因果链可完全真实，错在把自造结果当作独立证据；appeal_to_consequences（第164维）方向相反（后果糟所以不是真的）。明确不判：证据支持的预测（数据显示/研究表明/model predicts + 结果）、预备性防护性行为（担心下雨所以带伞，结果真的下雨了——本族核心反例，行为不产生被预言的结果）、元话语与教学转述（自我应验预言/罗森塔尔效应/皮革马利翁效应/self-fulfilling prophecy/rosenthal effect）、显式对冲（可能/也许/未必/might/maybe）、疑问句式、复述他人观点（据报道/according to）、否定翻转（不意味着/does not mean）。',
    tags: ['reasoning', 'causality', 'circularity', 'evidence', 'feedback-loop'],
  };
}

module.exports = {
  detectSelfFulfillingProphecy,
  __internals: () => ({
    BELIEF_PSY_ZH, BELIEF_SPEECH_ZH, BELIEF_SPEECH_QUAL_ZH, EXPECT_MARK_ZH,
    RESULT_NOUN_ZH, OUTLOOK_ZH, BELIEF_PSY_EN, BELIEF_SPEECH_EN, EXPECT_MARK_EN,
    RESULT_NOUN_EN, SELFDEFEAT_ZH, CONFORM_ZH, SELFDEFEAT_EN, CONFORM_EN,
    CONFIRM_ZH, CONFIRM_EN, WIN_LEG_ZH, WIN_LEG_EN,
    EXEMPT_EVIDENCE_ZH, EXEMPT_EVIDENCE_EN, EXEMPT_PREP_ZH, EXEMPT_PREP_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    EXEMPT_REPORT_ZH, EXEMPT_REPORT_EN, EXEMPT_NEGFLIP_ZH, EXEMPT_NEGFLIP_EN,
  }),
};
