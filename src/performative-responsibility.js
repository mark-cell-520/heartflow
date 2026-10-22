/**
 * src/performative-responsibility.js — 「表演式担责」检测器（第 77 个判别维度）
 *
 * [v6.8.26] 第 533 轮设计、第 534 轮重建。固定 scout 池连续第七轮空
 * （/tmp/hf-scout-r533.txt：「未探测到新的零覆盖族」），按 r505/r522/r526
 * 先例自建族级探针：scripts/round-533-cand-probe.js 扫 5 族后 3 族可用，
 * scripts/round-533-decide3.js 本体选向（补 parseNumericFields 四字段后
 * 选定 A 表演式担责）。
 *
 * 辨别的族：「表演式担责」——口头上把责任全部认下，同时把成因、后果或
 * 追责资格倒置给对方。它的落点不是「受害者自己也有责任」
 * （victim_blaming 管归因），也不是「让步换对方付出」
 * （concession_coercion 管条件交换），而是**用认责这个动作本身消解
 * 追责**：一旦责任被「全部认领」，归因、整改与追责就都失去了着力点。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：认领表达 × 归因倒置/追责终止 同句共现；
 *   · 路由②（次）：单边的服从性认责（「都是我」「算我的」「你们是对的」）
 *     且句中无任何整改/补救/时限锚点。
 *
 * 为什么现有维度拦不住：
 *   · concession_coercion 落点是「让步 × 强制条件」，要求让步换对方付出；
 *   · gaslighting 落点是否定对方对现实的感知；
 *   · victim_blaming 落点是责备受害者，本族说话人恰好在认罪；
 *   · moral_foundations / bad_faith 只在综合姿态上给分，不针对这个句式族
 *     （r533 交叉归因实测：穿过样本 findings 基本为空）。
 *
 * → verify 级：认责后须给出可核验的整改动作（事项、责任人、时限）；
 *    单句常兼有合规汇报句式，rewrite 会误伤。
 *
 * 明确不判的（豁免——正当的担责与复盘表述）：
 *   · 认责 + 整改/补救/牵头/时限（真实担责）
 *   · 组织层问责声明（问责制、第一责任在我、按制度处理）
 *   · 复盘中的归因分工（分清决策与执行责任）
 *
 * [r534 重建注记] r533 的 rewrite 脚本把 INVERT_ZH / INVERT_EN 两段整段
 * 截掉（indexOf 锚点写错，end=7 吞掉文件），导致运行即
 * INVERT_ZH is not defined。本文件为整文件重写：补齐两段倒置判据、
 * OWN_EN 正则改回单反斜杠（patch 工具的 JSON 双重转义会把 `\b`/`\s`
 * 写成字面双反斜杠），路由与豁免逻辑按 r533 设计原样恢复。
 */

'use strict';

// ─── R1a: 认领表达（把责任整体接过来）───────────────────────────
const OWN_ZH = new RegExp([
  // 「我负全责 / 这事我担着 / 责任我来背」
  '(?:我|我们|我部|本?人)(?:来|来负|来承|来担|愿|愿)?(?:负|承|担|背|揽|扛)(?:全|全部|所有|一切|整|这|此)?(?:责|责任|全责|全部责任|这个责|这个责任|所有责任)',
  '(?:责|全部责|这?个?责)(?:任|任)?(?:我|由我|都算在我|算我的|都归我|都担|都背|我担|我背|我认|我都认|我来)',
  // 「都是我 / 都是我的 / 全部算我 / 算在我头上 / 都怪我」
  '(?:全|统|通通|全?部|一切|所?有)(?:都|也|算|是|怪我|归我|在我)?(?:怪|算|是)(?:我|我的|我的错|我的责任|我的锅)',
  '(?:都是我|都是我的|全是我的|责任都在我|责任全在我|全?算我|算我|归?我|怪我)(?:的|头上|身上|错|责任|问题|事|)?',
  '(?:我认错|我认罚|我认领|我认下|我认了|认罪|我全认|我都认|无话可说|无可辩驳)',
  // 「满意了吗 / 行了吧」——以认领迫使对方停止追责
  '(?:满意了吗|满意了没|你满意|行了吧|行了吗|够了没|够了吗|这样行)',
  // 「这锅我认 / 锅我背 / 我背这锅」——口语认领形
  '(?:这|这个|那|那口)?锅(?:我|由我|算我)(?:来)?(?:认|背|扛|担|接了)',
  '(?:我|咱)(?:背|认|扛)(?:这|那|那个|一口)?锅',
  // 「你们赢了 / 你们说什么都对」（认领 + 终止辩论）
  '(?:你|你们)(?:赢了|赢了还|说|讲)(?:了|我都|随便|什么)(?:都对|都好|都行)',
  // 「想怎么罚就怎么罚」——交出处置权
  '(?:想|要)(?:怎么|怎样)(?:罚|处置|处理|定)(?:我|就我|都行|随便)(?:都行|都好|随便)?',
].join('|'));

const OWN_EN = new RegExp([
  // I/we accept/take/shoulder/own/assume (full|all) responsibility|blame|accountability
  '(?:i|we)\\s+(?:accept|take|shoulder|own|assume)\\s+(?:full\\s+|all\\s+|entire\\s+|completely\\s+)?(?:responsibility|blame|accountability|the\\s+blame|the\\s+fault)',
  // my fault / our fault
  '(?:my|our)\\s+fault\\b',
  // it is all my fault / it is entirely our doing
  'it\\s+is\\s+(?:all|entirely)\\s+(?:my|our)\\s+(?:fault|responsibility|doing)',
  // I am fully responsible / I was to blame
  'i\\s+(?:am|was)\\s+(?:fully\\s+|entirely\\s+|fully\\s+to\\s+blame)?(?:responsible|to\\s+blame|at\\s+fault)\\b',
  // blame it on me / blame me entirely / blame me all you want
  'blame\\s+(?:it\\s+on\\s+me|me\\s+(?:entirely|all)\\b|me\\s+for\\s+(?:everything|all\\s+of\\s+it))',
  // the inversion is spoken by the speaker: I forced my own hand
  '(?:i|we)\\s+(?:forced|pushed)\\s+(?:my|your|their)\\s+own\\s+hand',
  // "you forced my hand" — 认领形：自己承认手被逼动手（被强制形认领）
  '\\byou\\s+forced\\s+my\\s+hand\\b',
  '\\b(?:my|our)\\s+hand\\s+(?:was|were)\\s+forced\\b',
  // accompanied form of "you made me do it"
  'i\\s+(?:am|was)\\s+(?:forced|made)\\s+to\\s+(?:do|accept|take)\\s+(?:it|this|the\\s+blame)',
  '(?:i|we)\\s+(?:accept|took)\\s+(?:full\\s+|all\\s+)?(?:blame|responsibility)',
  // "fine, it's on me" / "put it all on me" / "take it out on me"
  '(?:fine|okay|alright|sure)[,.]?\\s+(?:it\\s+is|it\'s|put\\s+it|take\\s+it\\s+out)\\s+(?:all\\s+)?(?:on\\s+me|out\\s+on\\s+me)',
  // "you win" — surrendering the argument (closure of the matter)
  '\\byou\\s+(?:win|wins|won)\\b',
  // "do what you want with me" — surrendering disposition rights
  '(?:do|do\\s+to)\\s+(?:what|whatever)\\s+you\\s+(?:want|like|please)\\s+(?:with\\s+me|to\\s+me)?',
  '\\b(?:my|all\\s+my)\\s+(?:hands\\s+are\\s+tied|fate\\s+is\\s+sealed)\\b',
].join('|'), 'i');

// ─── R2: 单边服从性认责（无整改锚点）─────────────────────────────
// 单独出现「行，都是我的错」即成立；句中带整改/时限/牵头时不判（豁免）。
const SUBMIT_ZH = new RegExp([
  '(?:行|好|得|对|没错)(?:了|吧)?[，,。]{0,2}(?:都|全)(?:是|算)(?:我|的)',
  '(?:你|你们)(?:说|讲|讲得)(?:的)?(?:都|全)?(?:对|没错|有道理)',
  '(?:我|我们)(?:不|没啥|没有)(?:解释|辩|申辩|可说的)',
  '(?:责任|过错|错)(?:我|我们)(?:全|都)(?:认|担|接|背)(?:了|下)?',
  // 「这事儿就到此为止 / 别再提了」——配合认领终止追责
  '(?:就)?(?:此|这)(?:事|为)(?:为|到)(?:止|此)?(?:为|到)?(?:止|此)?(?:好了|为止|了结|翻篇|过去)',
].join('|'));

// ─── R1b: 归因倒置（把成因/资格甩回对方）────────────────────────
// 「是你把我逼成这样的」「谁先开的头」「你们也脱不了干系」
// ——认责一旦伴随倒置，追责的着力点就被消解了。
const INVERT_ZH = new RegExp([
  // 「你(们)把我(逼|害|带|拖)成…」——对方强制形
  '(?:是|都|这)?(?:你|你们)(?:们)?(?:先)?(?:把|将)(?:我|我们)(?:逼|逼到|害|害得|拖|带|推|赶|骗)(?:到|成|得|进)?',
  '(?:你|你们)(?:逼|逼得|逼到|害得|害|推)(?:我|我们)(?:成|到|进|得)?',
  // 「是你(们)先(开|挑|动|说|做|惹)…」——谁先开的头
  '(?:是|都|这)?(?:你|你们)(?:先|起初|一开始|当初先|最早)(?:开|挑|动|说|做|惹|提|起)',
  '(?:谁先|是谁先|当初是谁|先是你们|先动手|先开口|先惹|先提)',
  // 「你(们)也脱不了/逃不掉干系、也有一份、也跑不掉」
  '(?:你|你们)(?:们)?(?:也|照样|照样也|同样)(?:脱不了|逃不掉|躲不掉|跑不掉|免不了|有一份|有责任|要负责|算一个|算一份)',
  '(?:你|你们)(?:也)(?:是|脱不了|脱不掉|跑不掉)(?:之一|共犯|帮凶|同谋|罪魁|祸首|始作俑者)',
  // 「你也(不)(干净/无辜/清白)」
  '(?:你|你们)(?:也)?(?:不|并不|才不)(?:干净|无辜|清白|白璧|无瑕)',
  // 「别怪别人 / 先管好你自己」——把追责资格否掉
  '(?:先|还是先)(?:管好|管好你自己|照照镜子|反省)(?:你|你们)?(?:自己|再说)',
  '(?:别|不要|少)(?:怪|责备|赖)(?:我|别人|其他人|旁人|外部|客观)',
  // 「被我(被|叫|让)(逼|害)(成|了)什么样」——允许「成了」插入语
  '(?:我|我们)(?:被|叫|让)(?:你|你们|这事|你们这些人)(?:逼|害|弄|整|欺)(?:成|了成|得|到了|到)?(?:了|成)?(?:什么样|什么样子|这样|人不像人)',
  '(?:我)(?:受|挨|遭)(?:了)?(?:什么|多少|这么多)(?:委屈|气|苦|罪|委屈)',
  // 「你(们)从来(不曾/也)(不在乎|理会|尊重|考虑)过…」——对方无视形
  '(?:你|你们)(?:们)?(?:从来|一直|向来|根本|压根|也)(?:不|没|未曾|从不)(?:在乎|理会|在意|考虑|关心|尊重|理解|体谅|心疼)',
  '(?:谁)(?:也)?(?:不曾|从未|从来没|都没有)(?:在乎|在意|考虑|关心)(?:过)?(?:我|我们|我的|我们的)?(?:感受|想法|处境|付出)',
  // 「你(们)(从来|一向)(只会|会)(怪|骂|指责|计较)…（不认错）」——反咬形
  '(?:你|你们)(?:们)?(?:从来|一向|向来|从来都|一向都)?(?:只会|只会|会|都)?(?:怪|骂|指责|埋怨|数落|挑刺|苛责|计较|算计|念叨|翻旧账)(?:我|我们|别人)',
  '(?:你)(?:从来|一向|只会)(?:会)?(?:不|没)(?:认错|反省|反思|检讨|检讨自己)',
  // 「反正是你(先)(把事)(挑|惹)(起来)」——任凭 + 起源责任复合形
  '(?:反正|横竖|说到底)(?:是|都|全)(?:你|你们|你方)?(?:先)?(?:把|将)?(?:事|话|头|事情)?(?:挑|惹|起|开|动|说|做|提)(?:起来|起的头|的事|的事)?',
  // 「把责任(都)(推|甩)(给)(别人/下属/客观）」——转嫁形
  '(?:把|将)(?:责任|过错|锅|问题|失误|账)(?:都|全|也)?(?:推|甩|扣|赖|怪)(?:给|到|在)(?:别人|他人|旁人|下属|同事|新人|部门|客观|外部|环境)',
  '(?:责|锅|账)(?:都|全)(?:不)(?:是)(?:我|我方)(?:的|这边)(?:问题|责任)',
  // 「先(把话)说清楚 / 谁先(开|挑|惹)的头」——倒装：先追对方的起源责任
  '(?:先|先给我)(?:说清楚|讲清楚|解释|交代|搞明白|弄明白)(?:是|到底)',
  '(?:是谁|是谁|到底是谁|当初是谁)?(?:谁|哪一个)(?:先|先开|先挑|先惹|先动|先说|先做|先提)(?:开|挑|惹|动|说|做|提)',
  // 「不被信任 / 没资格 / 凭（什么）追我的责」——资格否弃形
  '(?:你|你们)(?:从来|一直|根本|压根|从未)(?:不|没|未)(?:信任|信过|尊重|看得起|给过)',
  '(?:没|没有)(?:资格|权利|权力|脸|立场|份)(?:说|讲|谈|提|怪|指责|追)(?:我|我们)',
  '(?:凭|凭什么|有什么资格)(?:什么|啥)?(?:追|追究|责问|问责|处罚|处理)(?:我|我们|我的|我的责)',
  // 「那还(查|追|究|说)(什么)」——取消追责形
  '(?:那|这)(?:还|又|有)(?:什么)?(?:好|必要)?(?:查|追|究|问|说|谈|提|核实|调查)',
  '(?:不)(?:用|需要)(?:再)?(?:查|追|究|问|调查|核实)',
  // 「只会计较(这些|得失|对错)」——只算小账形
  '(?:只|就会|只会)(?:会)?(?:计较|算计|算|盯着)(?:这些|这点|这点事|得失|对错|输赢|面子|小账|这些琐事|那些)',
].join('|'));

const INVERT_EN = new RegExp([
  // you made|forced|pushed|drove|put me (into|to)
  '\\byou\\s+(?:made|forced|pushed|drove|put|baited)\\s+me\\b',
  // you drove me to this / you are the one who
  '\\byou\\s+(?:are|were)\\s+the\\s+one\\s+who\\b',
  // after what you did / look at what you started
  '\\bafter\\s+what\\s+you\\b',
  '\\blook\\s+at\\s+what\\s+you\\s+(?:did|started|said)\\b',
  // you (also|too|partly|equally) (share|bear|carry) (the) blame|responsibility|fault
  '\\byou\\s+(?:also|too|partly|equally|as\\s+much)?\\s*(?:share|bear|carry|hold)\\s+(?:a\\s+|your\\s+|the\\s+|part\\s+of\\s+the\\s+)?(?:blame|responsibility|fault|account)',
  // you are (also|partly|equally) (to blame|at fault|responsible|complicit)
  "\\byou're?\\s+(?:also|too|partly|equally|just\\s+as)\\s+(?:to\\s+blame|at\\s+fault|responsible|complicit|guilty)",
  // you started it / who started it / who cast the first stone
  '\\b(?:you|who)\\s+started\\s+(?:it|this)\\b',
  '\\bwho\\s+(?:cast|threw)\\s+the\\s+first\\s+stone\\b',
  // you are not innocent / your hands are not clean
  "\\byour\\s+hands\\s+are\\s+(?:not|n't)\\s+clean\\b",
  '\\byou\\s+are\\s+(?:not|n\'t)\\s+(?:exactly\\s+)?(?:innocent|blameless)\\b',
  // don't blame others / look in the mirror
  "\\bdon'?t\\s+blame\\s+(?:others|everyone\\s+else)\\b",
  '\\blook\\s+(?:in|at)\\s+(?:the\\s+mirror|yourself)\\b',
  // see what you turned me into / look what you did to me
  '\\b(?:see|look)\\s+(?:what|at\\s+what)\\s+you\\s+(?:turned|did\\s+to|made)\\s+me\\s+(?:into|become)?\\b',
  // you had your chance / this is on you now
  '\\bthis\\s+is\\s+(?:all\\s+)?on\\s+you\\b',
  // "whatever happens (now) is on you (now)" — consequence inversion
  // "whatever happens (now) is on you (now)" — consequence inversion
  '\\b(?:whatever|anything|everything)\\s+(?:that\\s+)?(?:happens|goes\\s+wrong|results)\\s+(?:now|next|from\\s+here)?\\s*(?:is|will\\s+be)\\s+(?:all\\s+)?on\\s+you\\b',
  '\\bconsequences?\\s+(?:are|is)\\s+(?:all\\s+)?on\\s+you\\b',
].join('|'), 'i');

// ─── 豁免：正当的担责、整改与组织层问责 ────────────────────────
const EXEMPT_ZH = new RegExp([
  // 认责 + 整改/补救/牵头/时限
  '(?:整改|改进|修复|补救|纠正|复盘|方案|措施|计划|时间表|时限|牵头|负责推进|落地|闭环)',
  // 「我来负责修 / 我牵头 / 周五前交出来」
  '(?:负责|牵头|主责|督办)(?:整改|推进|修复|落实|闭环|收口)',
  // 组织层问责声明
  '(?:问责制|第一责任|按制度处理|按规章|依责|定责|问责|处分|追责)(?:在|到|给|处理|程序|结果)',
  // 复盘中的归因分工（分清决策与执行）
  '(?:分清|区分|界定|划分)(?:决策|执行|责任|归因|边界)',
  // 事故说明/情况通报的标准句式
  '(?:事故|情况)(?:说明|通报|报告)',
].join('|'));

const EXEMPT_EN = new RegExp([
  '\\b(?:own|owning|take|took)\\s+(?:the\\s+)?(?:incident|bug|outage|mistake|issue)\\b',
  '\\b(?:fix|remediation|corrective\\s+action|postmortem|action\\s+plan|' +
  'owner|due\\s+date|by\\s+(?:friday|monday|eod|eow))\\b',
  '\\baccount(?:ability)?\\s+(?:starts|begins)\\b',
  '\\bprevent\\s+recurrence\\b',
  // [r535] 补修漏掉的 `+` 号之外，再补整改动作/时限类锚点，让
  // 「改后确有补救安排」的正当担责与倒置并存时不被误判。
  '\\b(?:remediation|fix|corrective|preventive)\\s+(?:plan|steps|actions|measures|work)\\b',
  '\\b(?:publish|ship|deliver|release)\\s+(?:the\\s+)?(?:fix|patch|postmortem|root\\s+cause\\s+analysis)\\b',
  '\\broot\\s+cause\\s+analysis\\b',
  '\\b(?:by|before)\\s+(?:friday|monday|tuesday|wednesday|thursday|eod|end\\s+of\\s+(?:week|day)|next\\s+week)\\b',
  '\\b(?:the\\s+)?(?:postmortem|retrospective|review)\\s+is\\s+(?:due|scheduled|published)\\b',
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkPerformativeResponsibility(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 正当的担责、整改与组织层问责 → 不判
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  const ownZH = OWN_ZH.test(text);
  const ownEN = OWN_EN.test(text);

  // 路由②：单边服从性认责（无整改锚点）
  if (SUBMIT_ZH.test(text)) {
    return {
      hit: true,
      score: 0.70,
      count: 1,
      detail: isZh ? '表演式担责×单边服从认责(zh)' : 'performative-responsibility×submissive(en)',
    };
  }

  if (!ownZH && !ownEN) return { hit: false, score: 0, detail: '', count: 0 };

  // 路由①：认领表达 × 归因倒置/追责终止
  const invertZH = INVERT_ZH.test(text);
  const invertEN = INVERT_EN.test(text);
  if (invertZH || invertEN) {
    return {
      hit: true,
      score: 0.74,
      count: 1,
      detail: isZh ? '表演式担责×归因倒置(zh)' : 'performative-responsibility×inversion(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkPerformativeResponsibility,
  // 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({ OWN_ZH, OWN_EN, INVERT_ZH, INVERT_EN, SUBMIT_ZH, EXEMPT_ZH, EXEMPT_EN }),
};
