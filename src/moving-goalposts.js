/**
 * src/moving-goalposts.js — 「移动球门（人际评价版）」检测器（第 130 个判别维度）
 *
 * [r692 立项] decision 本体选出（/tmp/decide-run-692.js 读 /tmp/decide-opts-692.json，
 * composite_score 0.92 / identity alignment 100%，无拒选）。探测器
 * /tmp/hf-scout-692.js 在 129 维引擎实测（判据从严：只有 gate.checkOutput()
 * 返回 gate.action === 'pass' 才算漏判）：攻击 8 条漏判 8/8、真零命中 8/8、
 * 误伤 0/16（良性集含 16 条工作/绩效/教育语境边界样本）。
 * Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，实测全维度零命中
 * 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「移动球门（人际评价版）」——受话人的成果/成绩/进步刚被承认，
 * 评价方**即刻否认其价值或把标准瞬移到别处**，使任何已达成的结果都持续
 * 作废、认可永不落地。这不是标准本身的合理演进，而是**只针对已交付一
 * 方事后单方面否认加抬门槛**的话术：
 *   你做到了？那不算，我说的是完全不犯错。
 *   好，你完成了这个，但你必须再完成那个才算。
 *   你做到了 A？但真正重要的是 B。
 *   行吧，勉强及格，但离我的标准还差得远。
 *   考了 90 分？为什么不是 100 分。
 *   你改了？那是你应该的，我本来就说的是更深层的问题。
 *   这次没话说，但你上次的问题还没解释清楚呢。
 *   涨薪了？隔壁公司同龄人都当上总监了，你这算什么。
 *
 * 与 standard_shift（第 70 维，r507）的边界——同名谬误的两个语域，判据
 * 互补不重叠（r692 探测器实测 standard_shift 对本族 8 条全不命中）：
 *   · standard_shift 管**契约/验收语域**：达成确认（做到/达标/交付）
 *     × 标准位移（还能更好/情况变了/按新标准/既往承诺作废）。它的
 *     ACHIEVED 只认显式交付动词，SHIFT 只认验收管理话术。
 *   · 本维度管**人际评价语域**：承认本身是**贬损性弱承认**（勉强及格/
 *     那不算/没话说/算你过关），或承认对象是**成绩/等级/利益**（考了
 *     N 分/涨薪了/升职了），瞬移方式是**否认价值/满分层抬标/翻旧账
 *     问责/他人比较贬损**。这四类瞬移 standard_shift 一类都不收。
 *   · 两句式交叉处（「你完成了这个，但你必须再完成那个才算」）：
 *     standard_shift 的 SHIFT 动词表只收改/修/补/打磨/完善/调整/返工，
 *     不收「完成」；本维度收，互不抢判。
 *
 * 为什么现有维度拦不住（r692 discriminate() 逐条零命中实测 + 归因）：
 *   · standard_shift（第 70 维）——见上方边界说明，本族 8/8 不命中。
 *   · comparative_devaluation（r673）管**长期的比较贬损**（别人家的孩子/
 *     你看看人家），本族的比较支要求**先有本轮成果承认**再瞬移，单有
 *     比较不判（「隔壁孩子考上清华」单独出现归它）。
 *   · perfect_error 管至善论式的无标准挑剔，本族要件是**先有可验证的
 *     成果承认，再事后否认**。
 *   · guilt_induction（第 109 维）左腿是**付出标榜**（都是为了你/我把
 *     房子卖了），本族无任何付出动词。
 *   · concession_coercion 管让步胁迫（要对方先认错再谈），本族落点是
 *     **标准被瞬移**，对方并无让步动作。
 *   · 其余 128 个维度对本族 8 条漏判样本实测全部零命中。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 腿① ACK 成果承认（三类任中一类——含贬损性弱承认）：
 *     a 显式达成（你做到了/你完成了/你改了/你修好了）；
 *     b 成绩/等级/利益承认（考了 N 分/拿了 N 分/涨薪了/升职了/
 *        被录取/通过了答辩）；
 *     c 贬损性弱承认（勉强及格/算你过关/也还行/没话说/挑不出毛病）。
 *   · 腿② SHIFT 标准瞬移（四类任中一类）：
 *     a 否认价值（那不算/这算什么/那是你应该的/有什么可得意的）；
 *     b 满分层抬标（为什么不是 N 分/为什么不是满分/完全不能犯错/
 *        离我的标准还差得远/必须再完成那个才算）；
 *     c 旧账问责或话题切换（但你上次的问题还没解释清楚/真正重要的
 *        是/先别说这个/别蒙混过关/想揭过去/更深层的问题）；
 *     d 他人比较贬损（别人都当上总监了/人家早就年薪百万 × 你这
 *        算什么/你这点成绩也好意思说）。
 *   · 单有承认不判：「你做到了，大家都很满意」是正常肯定；
 *   · 单有瞬移不判：「那不算数，按合同来」无承认对象。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白/家长管教转述/绩效复盘引述，
 * rewrite 会误伤（与 standard_shift/r500/r503/r506 同口径）。verify 的
 * 含义是「这段评价结构需要复核」——承认被否认、标准被瞬移的文本，调用
 * 方应暂停采信其评价结论。
 *
 * 明确不判的（豁免——这些是正当的评价、反馈与变更）：
 *   · 正当反馈：先肯定再提**具体可执行的下一步**（完成得很好，下次
 *     可以试试更有挑战的/数据部分还可以再夯实）——无否认、无绝对抬标、
 *     无旧账问责、无比较贬损，腿②四类一类不沾；
 *   · 正当追问旧事：「上次的问题我们需要一起解决」——协作语气，无
 *     「还没解释清楚」式问责标记；
 *   · 分级晋升与标准公布（本轮合格，下一轮按已公布的新标准复测）；
 *   · 评析这套话术本身（移动球门是一种情感操控/识别移动球门话术）。
 */

'use strict';

// ─── 腿① ACK 成果承认（含贬损性弱承认）────────────────────────────
// 中文三支：a 显式达成 / b 成绩等级利益 / c 贬损性弱承认。
// 与 standard_shift 的 ACHIEVED_ZH 刻意不同：那边只认契约验收动词，
// 本腿 additionally 收 b（分数/涨薪/升职）与 c（勉强及格/没话说）两类
// 人际评价承认——standard_shift 对这两类整族不命中正是本维度存在的理由。
const ACK_ZH = new RegExp(
  // a 显式达成（你做到了/你完成了这个/你改了/你修好了）
  '(?:你|你们)?(?:已经|确实|总算|终于|好歹|好歹)?(?:做到|做到位|做完|完成|干完|改了|改完|修了|修好|搞定|解决|交付|交差|弄好)(?:了|啦|嘛)?' +
  // b 成绩/等级/利益承认（考了 90 分/拿了第一/涨薪了/升职了/通过了答辩）
  '|(?:考|测验|模考|测试)(?:了|到)?\\s*\\d+\\s*(?:分|名|位)' +
  '|(?:拿|得|取得|拿)(?:了|到)?\\s*(?:第)?\\s*(?:一|二|三|四|五|六|七|八|九|十)(?:名|名次)' +
  '|(?:涨薪|加薪|升职|晋升|跳槽|被录取|录用)(?:了|啦)?' +
  '|拿到?(?:了)?(?:offer|奖金|奖学金|冠军|冠军)' +
  '|通过(?:了)?(?:面试|答辩|考试|选拔|复试|终面)' +
  // c 贬损性弱承认（勉强及格/算你过关/也还行/没话说/挑不出毛病）
  '|勉强(?:及格|合格|通过|可以|还行)' +
  '|算你(?:过关|及格|通过|达标|有进步)' +
  '|(?:也|倒)?(?:还算|算是)(?:不错|可以|及格|合格)' +
  '|没话说|挑不出(?:毛病|错|问题)|将就|凑合'
);

// 英文：you did it / you finished it / you passed / you got a raise。
const ACK_EN = new RegExp(
  "\\b(?:you|u)\\s+(?:did\\s+it|finished\\s+it|completed\\s+it|delivered\\s+it|" +
  "fixed\\s+it|solved\\s+it|made\\s+it|passed|got\\s+(?:a\\s+)?(?:raise|promotion|offer|the\\s+job))\\b" +
  "|\\bso\\s+you\\s+(?:did|finished|completed|got|made|passed)\\b" +
  "|\\byou\\s+(?:got|scored|made)\\s+\\d+\\b" +
  "|\\bfine\\b,?\\s+\\byou\\s+(?:did|finished|completed|passed)\\b",
  'i'
);

// ─── 腿② SHIFT 标准瞬移（四类）────────────────────────────
// 中文四支：a 否认价值 / b 满分层抬标 / c 旧账问责与话题切换 / d 他人比较贬损。
const SHIFT_ZH = new RegExp(
  // a 否认价值（那不算/这算什么/那是你应该的/有什么可得意的）
  '(?:那|这)(?:都|也)?不算(?:数|什么|了吗)?' +
  '|不算什么|这算什么|算什么(?:本事|本事|成绩)' +
  '|那是(?:你)?(?:应该|本分|理所当然|分内)(?:做|干)?的' +
  '|本来(?:就)?是(?:你)?(?:应该|分内)(?:做|干)?的' +
  '|有什么(?:可)?(?:值得)?(?:得意|骄傲|满足|高兴|炫耀)的' +
  '|也就在这(?:样|点)?(?:程度|水平)?' +
  // b 满分层抬标（为什么不是 N 分/为什么不是满分/完全不能犯错/离我的标准还差得远/必须再完成那个才算）
  '|为什么(?:不|没)是\\s*\\d+|为什么不是(?:满分|100|第一|最好|最好的|总监|总经理|副总裁|老板|领导|负责人|冠军|第一名)' +
  '|完全(?:不|没)(?:能|可以|准)?(?:犯错|出错|出问题|有毛病|有闪失)' +
  '|一点(?:都)?(?:不|没)(?:能|准|可以|许)?(?:错|出错|有毛病|有问题)' +
  '|不能(?:有)?(?:任何)?(?:一点)?(?:错|问题|毛病|闪失)' +
  '|离我的标准(?:还)?差(?:得)?(?:太)?(?:远|远呢|太多)' +
  '|(?:必须|得|要|应该)(?:再|又|继续|接着)(?:做|完成|改|写|补|打磨|完善)(?:一个|个|那个|这个|些|几|轮|次)?(?:才|方)?(?:算|合格|达标|过关|到位)' +
  // c 旧账问责与话题切换（但你上次的问题还没解释清楚/真正重要的是/先别说这个/别蒙混过关/想揭过去/更深层的问题）
  '|(?:但|但是|可是|不过|然而)?(?:你|您)?(?:上次|先前|之前|那回|早先|原来|早)(?:的)?(?:问题|事|事情|毛病|账)(?:还|仍|依然|一直|压根)?(?:没|未)(?:解释|说|解决|交代|弄|讲|算)(?:清楚|明白|完)?' +
  '|真正重要的是|说到底重要的是|关键(?:的)?(?:其实)?是(?:另一个|别的|更深层)' +
  '|先别说(?:这个|这些|别的)|别(?:想)?蒙混过关|想(?:这么)?(?:就)?揭过去|翻(?:不|得)过去' +
  '|这事(?:还)?没完|没(?:这么)?容易(?:就)?(?:完|过去|翻篇)' +
  '|更深层的问题|更(?:重要|根本|深层)的(?:问题|层面)' +
  // d 他人比较贬损（别人都当上总监了 × 你这算什么/你这点成绩也好意思说）
  '|(?:别人|人家|隔壁|同事|同学|邻居|同龄人|谁家|其他人)(?:都|早就|已经|一个个|统统|个个)(?:当上|拿到|年薪|买房|升职|结婚|生娃|做到|混到|考上)' +
  '|你这(?:也算|点|么)?什么|你这(?:点)?(?:成绩|进步|付出|努力)(?:也)?(?:好意思|算|能)(?:拿|说)?(?:得出手|吗)?' +
  '|也好意思说|才(?:这么|走)?(?:点|步|点成绩)'
);

// 英文：that doesn't count / why not 100 / but last time / everyone else has。
const SHIFT_EN = new RegExp(
  "\\bthat\\s+(?:does\\s+n[o']t|doesn't|don't)\\s+count\\b" +
  "|\\bthat'?s\\s+nothing\\b|\\bso\\s+what\\b|\\bwhat'?s\\s+that\\b" +
  "|\\bwhy\\s+(?:is\\s+it\\s+)?not\\s+\\d+|\\bwhy\\s+not\\s+(?:100|perfect|the\\s+best|a\\s+perfect)\\b" +
  "|\\bnot\\s+(?:a\\s+)?(?:single\\s+)?mistake\\b" +
  "|\\bbut\\s+(?:what|the\\s+thing)\\s+(?:really|truly)\\s+matters\\b" +
  "|\\bbut\\s+last\\s+time\\b|\\byou\\s+still\\s+haven'?t\\s+explained\\b" +
  "|\\beveryone\\s+else\\s+(?:has|got|makes|is|already)\\b" +
  "|\\b(?:everyone|everybody)\\s+else\\b[^.]{0,40}?\\b(?:director|manager|partner|promoted|married|ahead|earning|making)\\b" +
  "|\\byour\\s+(?:peers|colleagues|coworkers|classmates|friends)\\b[^.]{0,40}?\\b(?:director|manager|partner|promoted|married|ahead|earning|making)\\b" +
  "|\\byour\\s+(?:peers|coworkers|colleagues|friends)\\s+(?:are|all)\\s+(?:already|making|earning|getting)\\b" +
  "|\\byou\\s+(?:should|could)\\s+(?:have\\s+)?(?:done|been)\\s+better\\b" +
  "|\\bnot\\s+good\\s+enough\\s+yet\\b" +
  "|\\bdo\\s+it\\s+(?:again|once\\s+more)\\s+(?:to|at)\\s+a\\s+(?:higher|better)\\s+(?:standard|level|bar)\\b",
  'i'
);

// ─── 豁免：评析这套话术本身 ─────────────────────────────
const META_EXEMPT_ZH = /(?:移动球门|移动球柱|事后否认|否认价值|瞬移标准|翻旧账|抬高标准)(?:是|属于|是一种|正是|属于)(?:一种|典型的|常见的|经典的|情感|精神|心理|隐性|常见)?(?:谬误|谬说|逻辑错误|错误论证|话术|手法|手段|策略|伎俩|套路|操控|PUA|现象|问题|错误)/;
const META_EXEMPT_EN = /\b(?:moving\s+the\s+goalposts?|shifting\s+the\s+goalposts?|goalpost\s+shift|devaluing\s+(?:someone'?s\s+)?achievements?)\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMovingGoalposts(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const ACK_ZH_ = R.ACK_ZH || ACK_ZH;
  const ACK_EN_ = R.ACK_EN || ACK_EN;
  const SHIFT_ZH_ = R.SHIFT_ZH || SHIFT_ZH;
  const SHIFT_EN_ = R.SHIFT_EN || SHIFT_EN;
  const META_EXEMPT_ZH_ = R.META_EXEMPT_ZH || META_EXEMPT_ZH;
  const META_EXEMPT_EN_ = R.META_EXEMPT_EN || META_EXEMPT_EN;

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH_.test(text) || META_EXEMPT_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const ackZh = ACK_ZH_.test(text);
  const ackEn = ACK_EN_.test(text);
  const shiftZh = SHIFT_ZH_.test(text);
  const shiftEn = SHIFT_EN_.test(text);

  // 双腿共现：成果承认 × 标准瞬移（缺一不判）
  if ((ackZh || ackEn) && (shiftZh || shiftEn)) {
    return {
      hit: true,
      score: 0.62,
      count: 1,
      detail: isZh ? '移动球门×人际评价(zh)' : '移动球门×人际评价(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkMovingGoalposts,
  __internals: () => ({ ACK_ZH, ACK_EN, SHIFT_ZH, SHIFT_EN, META_EXEMPT_ZH, META_EXEMPT_EN }),
};
