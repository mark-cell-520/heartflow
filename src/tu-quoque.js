/**
 * src/tu-quoque.js — 「诉诸伪善」检测器（第 141 个判别维度）
 *
 * [r710 立项] decision 本体在 140 维引擎上选出（/tmp/decide-run-710.js 读
 * /tmp/decide-opts-710.json，composite_score 0.92 / confidence 0.9 /
 * identity alignment 100%，无拒选）。探测器证据 /tmp/hf-scout-710.txt
 * （样本集与 r708 一致跨轮可比 + 2 个全新族；判据从严：只有
 * gate.gate() 返回 gate.action === 'pass' 才算漏判）：
 * tu_quoque 族攻击漏判 9/10、漏判中真零命中 9/9（findings 无真实
 * 维度）、良性误伤 5/12 全部归因存量维度（sycophancy×4、
 * false_balance×1——本族维度尚不存在故自身存量误伤恒 0，HEAD 对照
 * 确认非本族引入）。Phase 1.5 同律复核：9 条漏判样本逐条过
 * discriminate() 确认全维度零命中（含 whataboutism 这个最近邻）。
 *
 * 辨别的族：「诉诸伪善」（tu quoque，you-too fallacy）——用**对方
 * 同样有过错/同样做不到**，取消对方提出批评或要求的资格：
 *   你说我熬夜不好，你自己不也天天凌晨睡。
 *   你叫我别玩游戏，你年轻时候玩得比我还凶。
 *   你又不是没犯过错，装什么清白。
 *   你说这套方法有问题，你自己不也在用。
 *   你自己都做不到，凭什么要求我。
 *   你也曾经撒过谎，没资格讲诚信。
 *   你不是一样迟到，光说别人。
 *   你以前也这样，现在倒来教育我。
 *   You criticize me for smoking, but you drink every day.
 *   You tell me to work harder, yet you're always leaving early.
 *
 * 与既有维度的边界（r710 逐条实测归因，findings 零命中确认）：
 *   · whataboutism（第 20 维）管**转移话题**（那 XX 呢/你怎么不
 *     说 YZ）——不指向取消对方资格，是把话题引向别处；本族是
 *     「你也一样 → 你没资格说我」的资格剥夺链。实测本族样本 0 条
 *     命中 whataboutism。
 *   · false_balance 管**各打五十大板**（双方都有责任/一个巴掌
 *     拍不响）——不引用对方个人过错；本族必须引用**听者本人**的
 *     同样过错（你-based MIRROR）。
 *   · sycophancy 管**附和性肯定**（你说得对/确实）——良性侧
 *     4 条误伤全部由它产生（既有行为，非本族引入）。
 *   · gaslighting 管**否认对方现实认知**（你没看清/是你记错了/
 *     这没发生过）——不指向资格剥夺。
 *   · moral_foundations / perfect_error 在个别样本上先行命中
 *     （You tell me to work harder... 被 perfect_error 判 verify），
 *     两维共存不冲突。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「对方批评/要求在场 × 听者同样过错反噬 × 剥夺资格」三要素里，
 *   腿②的 MIRROR 结构（你-based 同样过错：你自己不也/你以前也/
 *   你又不是没/你不是一样）在所有维度零覆盖；DISQUALIFY 词表
 *   （凭什么/没资格/装什么/光说别人/倒来）只在 guilt_induction 等
 *   情感维度出现且不与 MIRROR 共现判定。整族射程外，不是某个
 *   维度正则弱。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① CRITICISM 对方批评/要求在场（你说我…不好/不对/有问题/
 *     别/不要；你叫我/要求我/管我 + 负面词；EN You criticize/tell/
 *     ask/blame me… + 对比连词 but/yet/while）；
 *   · 腿② MIRROR 同样过错反噬 = 你-based 主语（你/您 + 自己/本人
 *     + 不也/也没/也不/也一样/也；你 + 曾经/以前/过去/当年/年轻时
 *     + 也/照样；你又不是没/你不是一样；EN but/yet/while + you）
 *     × DISQUALIFY 剥夺资格词（凭什么/没资格/装什么/光说/倒来/
 *     还好意思/说我你；EN who are you to / not one to talk / glass
 *     houses / pot calling the kettle）；
 *   · 路由① CRITICISM × MIRROR（你说我熬夜不好 × 你自己不也天天
 *     凌晨睡——经典反噬形，无显式剥夺词）；
 *   · 路由② MIRROR × DISQUALIFY（你也曾经撒过谎 × 没资格讲诚信；
 *     你自己都做不到 × 凭什么要求我——剥夺资格形，批评隐含在
 *     对方声称的道德高标里）；
 *   · 单有 MIRROR 不判（「你也太搞笑了，凭什么说我」无同样过错
 *     腿，是单纯否定不是诉诸伪善）；单有 DISQUALIFY 不判（「你
 *     凭什么管我」「你没资格决定我的事」是对越界控制的正当边界
 *     主张）。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/偏见案例引述/逻辑课反面
 * 教材/心理咨询复盘中的转述（「当事人说：你也一样…」），
 * rewrite/block 会误伤（与 r672-r709 全部评价/胁迫族同口径）。
 * verify 的含义是「这句话用对方的个人过错替代了对观点本身的
 * 回应，需要回到论点本身」——调用方应要求回应内容而非资格。
 *
 * 明确不判的（豁免）：
 *   · 真诚自省与互相改进：我承认我以前也犯过这个错/我年轻时也
 *     这样/你说得对我确实也熬夜，以后咱们互相提醒/We all have
 *     flaws; let us support each other.（第一人称 + 无 MIRROR 的
 *     你-based 结构，本就不在射程内；hedge 再兜一层）；
 *   · 正当边界主张：你凭什么管我/你没资格决定我的事情（无 MIRROR
 *     同样过错腿）；
 *   · 保留语与澄清：我不是说你也一样/不是怪你/我没有指责你的
 *     意思/I am not blaming you either；
 *   · 概念分析：诉诸伪善是一种常见的逻辑谬误 / Tu quoque is a
 *     logical fallacy.
 */
'use strict';

// ─── 腿① CRITICISM 对方批评/要求在场（中文）──────────────────────
const CRITICISM_ZH = new RegExp([
  // 你/您 + 说/讲/批评/指责/要求/叫/让/管/数落/埋怨/怪 + (我)? + ≤12字 + 负面评价
  '(?:你|您)(?:说|讲|批评|指责|要求|叫|让|管|数落|埋怨|怪)(?:我)?[^。，！？]{0,12}(?:不好|不对|有问题|错|别|不要|不行|差|太|不该|不应该|过分|差劲|糟糕|乱花|乱来|乱搞|浪费|挥霍|瞎搞|胡来|不上进|懒|自私|小气|抠门|笨|蠢|傻|脏|馋|拖拉|误事)',
  // 你说这/那/这套 + 名词 + 不对/有问题/错了（你说这套方法有问题）
  '(?:你|您)(?:说|讲)(?:这|那|这套|这个|那个)[^。，！？]{0,8}(?:不对|有问题|错|不行|不好)',
].join('|'));

// 英文：You criticize/tell/ask/blame me ... + 对比连词（but/yet/while/when）。
const CRITICISM_EN = new RegExp([
  // 强动词支：criticize/tell/blame/lecture/nag/judge/shame/preach/accuse 自带批评义
  "\\b(?:you|u)\\s+(?:criticize|criticise|tell|told|accuse|blame|lecture|nag|judge|shame|preach)\\b[^.]{0,40}\\b(?:but|yet|while|when)\\b",
  // 弱动词支：say/said/claim 须负面评价词共现（You say I am lazy, but...）
  "\\b(?:you|u)\\s+(?:say|said|claim)\\b[^.]{0,30}\\b(?:lazy|wrong|bad|at\\s+fault|mistaken|incorrect|selfish|careless|sloppy|irresponsible|immature|thoughtless|rude|mean|unfair|never|always)\\b[^.]{0,25}\\b(?:but|yet|while|when)\\b",
].join('|'), 'i');

// ─── 腿②-1 MIRROR 同样过错反噬（中文：你-based 主语 × 同样过错指示）──
const MIRROR_ZH = new RegExp([
  // 你/您 + (自己/本人/自个儿)? + 不也/也没/也不/也一样/也不是/也
  '(?:你|您)(?:自己|本人|自个儿)?(?:不也|也没|也不|也一样|也不是|也)',
  // 你/您 + (自己/本人) + (都/根本/压根)? + 做不到类 fault 动词（你自己都做不到）
  '(?:你|您)(?:自己|本人|自个儿)(?:都|根本|压根|简直)?(?:做不到|做不好|达不到|不合格|不及格|没做到|也不行|玩不来|干不了)',
  // 你/您 + 曾经/以前/过去/当年/年轻时/上次/原先/原本 + (也/同样/照样/不也)?
  '(?:你|您)(?:曾经|以前|过去|当年|年轻(?:时|时候)?|原先|原本|早年|上次|上回|当时|那天)(?:也|同样|照样|不也)?',
  // 你/您 + 又 + 不/没/不是（你又不是没犯过错）
  '(?:你|您)又(?:不|没|不是)',
  // 你/您 + 不是一样/不是一回/不是一码事（你不是一样迟到）
  '(?:你|您)不是(?:一样|一回|一码事)',
].join('|'));

// 英文：but/yet/while/when + you(+'re/are) + 动词短语（but you drink every day）。
const MIRROR_EN = new RegExp([
  "\\b(?:but|yet|while|when)\\s+(?:you|u)(?:'re|'s|\\s+are|\\s+were|\\s+have)?\\s",
  // who are you to talk / you of all people 这类裸形
  // 你 + fault 动词 + before/in the past/yourself（You cheated on the test before）
  "\\byou\\s+(?:cheated|lied|stole|did|made|were|had|used\\s+to)\\b[^.]{0,40}\\b(?:before|too|as\\s+well|in\\s+the\\s+past|yourself)\\b",
  // you + 动词 + too 裸形（You lied too.）
  "\\byou\\s+[a-z]+(?:ed|s)?\\s+too\\b",
  "\\byou\\s+of\\s+all\\s+people\\b",
].join('|'), 'i');

// ─── 腿②-2 DISQUALIFY 剥夺资格词（中文）──────────────────────────
const DISQUALIFY_ZH = new RegExp([
  // 凭什么/有什么资格/有什么脸
  '(?:凭什么|有什么资格|有什么脸|有啥资格)',
  // 没资格/不配
  '(?:没|没有|不)(?:资格|配)',
  // 装什么/装什么清白/装什么高尚
  '装什么',
  // 光说/只会说/倒来/倒还/反过来/还好意思/好意思
  '(?:光说|只会说|倒来|倒还|反过来|还好意思|好意思)',
  // 说我你/说我干嘛/来说我/来管我/来教育我/来训我
  '(?:来)?(?:说|管|教育|训|数落|指点|批评|骂|怪)(?:我|咱们)?你',
  // 要求我/管我/教育我（凭什么要求我的后半段裸形）
  '(?:要求|管|教育|训|数落|指点|批评)(?:我)?$',
].join('|'));

// 英文：who are you to / no right to / not one to talk / can't talk /
// have no business / glass houses / pot calling the kettle。
const DISQUALIFY_EN = new RegExp([
  "\\bwho\\s+are\\s+you\\s+to\\b",
  "\\b(?:you\\s+)?(?:have\\s+)?no\\s+right\\s+to\\b",
  "\\bnot\\s+one\\s+to\\s+talk\\b",
  "\\bcan'?t\\s+talk\\b",
  "\\bhave\\s+no\\s+business\\b",
  "\\bglass\\s+houses\\b",
  "\\bpot\\s+calling\\s+the\\s+kettle\\b",
].join('|'), 'i');

// ─── 豁免：真诚自省/互相改进/正当边界/保留语/概念分析 ──────────────
const HEDGE_ZH = new RegExp([
  // 概念分析（诉诸伪善是一种常见的逻辑谬误）
  '(?:诉诸伪善|你也一样|以五十步笑百步)(?:是|属于|是一种|正是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:谬误|谬说|逻辑错误|逻辑谬误|错误论证|非形式谬误|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|陷阱|偏差)',
  '(?:这|那就是|这就是|这正是|那正是|属于|正是|即是)(?:一种|典型的|常见的|经典的|明显的|标准的)?(?:诉诸伪善|你也一样谬误)',
  // 真诚自省与互相改进（第一人称承认 + 共同行动框架）
  '(?:我|我们)(?:承认|坦白|知道|明白|意识到)(?:自己)?(?:以前|曾经|过去)?(?:也)?(?:犯|做|有)(?:过)?(?:错|问题|不对|类似)',
  '(?:互相|彼此|相互|一起|共同)(?:提醒|监督|改进|改进|成长|进步|支持|加油)',
  // 保留语与澄清
  '(?:我)?(?:不是|并没有)(?:说|怪|指责)(?:你)?(?:也|一样)?',
  '(?:没有|不是)(?:指责|怪|批评)(?:你|您)的意思',
].join('|'));

const HEDGE_EN = new RegExp([
  // 概念分析
  "\\btu\\s+quoque\\b",
  "\\b(?:is|are|called?|committing\\s+an?)\\s+(?:a\\s+)?(?:tu\\s+quoque|you-?too)\\b",
  // 真诚自省（第一人称承认）
  "\\b(?:i|we)\\s+(?:admit|confess|acknowledge|realized?|realised|know)\\b[^.]{0,40}\\b(?:too|also|as\\s+well)\\b",
  // 共同行动框架
  "\\b(?:let\\s+us|let'?s|we\\s+can)\\b[^.]{0,30}\\b(?:support|improve|grow|remind|help)\\b",
  "\\bwe\\s+all\\s+have\\s+flaws?\\b",
  // 保留语
  "\\b(?:i\\s+am|i'?m)\\s+not\\s+(?:blaming|criticizing|criticising)\\s+you\\b",
].join('|'), 'i');

/**
 * @param {string} text 待判文本（_dual 会分别喂原文与归一化文本）
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkTuQuoque(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const CRI_ZH_ = R.CRITICISM_ZH || CRITICISM_ZH;
  const CRI_EN_ = R.CRITICISM_EN || CRITICISM_EN;
  const MIR_ZH_ = R.MIRROR_ZH || MIRROR_ZH;
  const MIR_EN_ = R.MIRROR_EN || MIRROR_EN;
  const DIS_ZH_ = R.DISQUALIFY_ZH || DISQUALIFY_ZH;
  const DIS_EN_ = R.DISQUALIFY_EN || DISQUALIFY_EN;
  const HEDGE_ZH_ = R.HEDGE_ZH || HEDGE_ZH;
  const HEDGE_EN_ = R.HEDGE_EN || HEDGE_EN;

  // 豁免在场 → 不是运用它
  if (HEDGE_ZH_.test(text) || HEDGE_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿②-1 MIRROR：同样过错反噬（中英各判，两条路由的公共腿）
  const mirZh = MIR_ZH_.test(text);
  const mirEn = MIR_EN_.test(text);
  if (!mirZh && !mirEn) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿① CRITICISM：对方批评/要求在场
  const criZh = CRI_ZH_.test(text);
  const criEn = CRI_EN_.test(text);
  const hasCriticism = criZh || criEn;

  // 腿②-2 DISQUALIFY：剥夺资格词
  const disZh = DIS_ZH_.test(text);
  const disEn = DIS_EN_.test(text);
  const hasDisqualify = disZh || disEn;

  // 路由①：CRITICISM × MIRROR（经典反噬形——无显式剥夺词也判）
  if (hasCriticism) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '诉诸伪善×对方批评×同样过错反噬(zh)' : 'tu_quoque×criticism×you-too-mirror(en)',
    };
  }
  // 路由②：MIRROR × DISQUALIFY（剥夺资格形——批评隐含在道德高标里）
  if (hasDisqualify) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '诉诸伪善×同样过错×剥夺资格(zh)' : 'tu_quoque×you-too×disqualification(en)',
    };
  }

  // 单有 MIRROR 不判（你也太搞笑了，凭什么说我——无同样过错腿是单纯否定）
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkTuQuoque,
  __internals: () => ({
    CRITICISM_ZH, CRITICISM_EN,
    MIRROR_ZH, MIRROR_EN,
    DISQUALIFY_ZH, DISQUALIFY_EN,
    HEDGE_ZH, HEDGE_EN,
  }),
};
