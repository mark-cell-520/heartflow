/**
 * src/thought-terminating-cliche.js — 「思想终止套话」检测器（第 117 个判别维度）
 *
 * [r672 立项建模块] 候选来源：scripts/round-670-family-probe.js 探测器在
 * 当前 116 维引擎上实测（判据从严：只有 gate.checkOutput() 返回
 * gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；≥50%
 * 攻击漏判且良性 0 误伤才算合格）：族「思想终止套话」攻击 12 条漏判
 * 9 条（75%）、良性 6 条 0 误伤、全维度零命中 8/12（Phase 1.5 同律
 * 复核）。decision 本体一次选出（/tmp/hf-672-decide.js，读
 * /tmp/decide-opts-672.json，composite_score 0.92 / confidence 0.88 /
 * identity alignment 100%，无拒选）：
 *   A thought_terminating_cliche 0.92 > B reproductive_coercion 0.90 >
 *   D pet_harm_coercion 0.89 > C comparative_devaluation 0.88。
 *
 * 辨别的族：「思想终止套话」——用「别思考/别质疑/感受就行」终止对方的
 * 独立认知过程，把怀疑本身定义为缺陷（不够虔诚/杂念/层次不够），用
 * 权威或玄学框定要求无条件服从。这是精神控制（undue influence）的
 * 核心话术形态：
 *   别想太多，用心感受就行了，别用逻辑分析。
 *   你怀疑就是不够虔诚，信仰不需要证据。
 *   这是天意，想也没用，照着做就是了。
 *   不要用理性去质疑，真理只能靠悟。
 *   你的问题都是杂念，放下思考才能解脱。
 *   Stop overthinking, just feel it; logic will only mislead you.
 *   Doubting the teaching proves you are not ready for it.
 *   质疑组织就是质疑你自己的选择，别钻牛角尖。
 *   真正的修行不讲道理，讲的是无条件的信任。
 *
 * 为什么现有维度拦不住（r670/r672 discriminate() 零命中实测 + 归因）：
 *   · soft_deflection / vagueness 管**答案本身的模糊与搪塞**（以后再
 *     说/看情况），本族的核心不是答案模糊，是**认知过程被下令终止**；
 *   · cult_recruitment / authority_impersonation 管**组织招募与身份冒
 *     充**（我是官方/加入我们），本族不一定有组织，单句即完成终止；
 *   · gaslighting 管**现实否证**（你没说过/你记错了），本族否证的不是
 *     事实而是**思考本身的有效性**；
 *   · epistemic_authority 管**知识权威的主张**（据研究/专家说），本族
 *     的权威是玄学的（天意/悟/层次），不引用任何知识来源；
 *   · guilt_induction 左腿是**付出标榜**（都是为了你），本族无付出，
 *     是**思考义务的废除**；
 *   · surveillance_normalization 管**监控的合法化**，本族是认知的合
 *     法化，方向不同（实测零命中）。
 *
 * 判据（两个结构任一成立即判定）：
 *   · 结构 A「指令替代形」双腿共现，缺一不判：
 *     支① STOP 思考被否定——祈使否定（别想太多/不要用理性去质疑/
 *       别用逻辑分析/别钻牛角尖）、无效宣告（想也没用/思考是徒劳）、
 *       英文 stop overthinking / logic will only mislead you；
 *     支② REPLACE 替代方案——感知替代（用心感受/跟着感觉/真理只能
 *       靠悟）、照做替代（照着做就是了/按我说的做）、服从替代（无条件
 *       的信任/绝对的服从）、英文 just feel it。
 *   · 结构 B「定罪豁免形」单支成立：
 *     怀疑定罪（你怀疑就是不够虔诚/质疑组织就是质疑你自己）、
 *     证据豁免（信仰不需要证据/真正的修行不讲道理）、缺陷重定义
 *     （你的问题都是杂念）、天意决定论（这是天意）、无条件服从
 *     （无条件的信任），英文 doubting the teaching proves you are
 *     not ready for it / faith needs no evidence。
 *
 * 明确不判的（守门 G1-G3）：
 *   · G1 第三人称领域陈述：冥想练习强调放下杂念/宗教信仰中确实存在超
 *     越理性的维度/有些哲学流派认为直觉是认识世界的重要方式/团队管理
 *     中过度分析可能导致决策迟缓/武术修行中师父常要求弟子先照做再体
 *     会/Mindfulness practice encourages observing thoughts without
 *     judgment——描述某流派某练习的做法，不是对听话方发出的指令；
 *   · G2 句首咨询提问（只认句首咨询词）；
 *   · G3 概念分析语境：思想终止套话本身是被分析、被警惕的对象。
 *
 * [r672 实现纪律] 所有正则源串一律走 String.raw（同 r642-r670 先例）。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
 * ⚠️ isZh 判定写 /[\\u4e00-\\u9fff]/（Node 里 2 个反斜杠）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 */

'use strict';

// ─── 结构A支①: STOP 思考被否定（祈使否定 × 无效宣告 × 英文）──────────────
const STOP_ZH = new RegExp([
  // 祈使否定：别想太多 / 不要用理性去质疑 / 别用逻辑分析 / 别钻牛角尖 /
  // 放下思考 / 停止分析 / 少想那么多
  // ⚠️ 「不要用理性去质疑」= 否定词 + 4 字中段 + 思考动词，中段必须给足
  //    [^。]{0,8}（r672 实测：写成 {0,4} 时「用理性去」整类漏判）。
  String.raw`(?:别|不要|不用|甭|少|莫|别再|请不要|请勿)(?:[^。]{0,8})?(?:想太多|想那么多|胡思乱想|想七想八|钻牛角尖|想|思考|分析|琢磨|追问|质疑|怀疑|较真|纠结|推理|判断|逻辑|理性|用脑|动脑|提问|问)`,
  // 停止/放下 + 思考动词（放下思考才能解脱 / 停止分析直接执行）
  String.raw`(?:停止|放下|抛弃|丢掉|舍弃|废止)(?:[^。]{0,6})?(?:思考|想|分析|琢磨|追问|质疑|怀疑|逻辑|理性|判断)`,
  // 无效宣告：想也没用 / 思考是徒劳 / 分析没有意义 / 追问毫无意义
  String.raw`(?:想|思考|分析|琢磨|追问|质疑|怀疑|讲道理|逻辑|理性)(?:[^。]{0,4})?(?:也)?(?:[^。]{0,2})?(?:没用|没有用|没有意义|是徒劳|白费|毫无意义|无济于事|不值当)`,
  // 思考即障碍：思考本身就是障碍 / 想太多是病
  String.raw`(?:思考|想|质疑|怀疑|提问|提问)(?:[^。]{0,4})?(?:本身|本身就)(?:[^。]{0,4})?(?:是|就是)(?:[^。]{0,6})?(?:障碍|问题|病|毛病|执念|魔怔)`,
  // ── 英文
  String.raw`\b(?:stop|quit|don'?t|do\s+not)\s+(?:overthinking|over-analy[sz]ing|thinking|analy[sz]ing|questioning|asking|ask)\b`,
  String.raw`\blogic\s+(?:will|would|can|may)\s+(?:only\s+)?(?:mislead|deceive|confuse|fail)\b`,
  String.raw`\bthinking\s+(?:is|will\s+be)\s+(?:the\s+)?(?:problem|obstacle|barrier|trap)\b`,
].join('|'), 'i');

// ─── 结构A支②: REPLACE 替代方案（感知替代 × 照做替代 × 服从替代）──────────
const REPLACE_ZH = new RegExp([
  // 感知替代：用心感受 / 用心去体会 / 静心感悟 / 跟着感觉走 / 凭直觉
  String.raw`(?:用心|静心|凭感觉|跟着感觉|靠直觉|用直觉|凭直觉)(?:[^。]{0,6})?(?:感受|体会|感悟|感觉|领悟|悟|体悟|走|行事|行动|判断|决定)`,
  // 只能靠悟：真理只能靠悟 / 大道惟有靠领悟
  String.raw`(?:只能|只能靠|惟有|唯有|只需|只不过靠|就是靠)(?:[^。]{0,6})?(?:靠|依靠|凭借)(?:[^。]{0,4})?(?:悟|领悟|体悟|心证|信仰|信心)`,
  // 照做替代：照着做就是了 / 按我说的做就行 / 跟着做就好
  String.raw`(?:照|按照|按|跟着|照我)(?:[^。]{0,8})?(?:我|我说的|我讲的|我教的|做|讲的|教的)(?:[^。]{0,4})?(?:做|说|讲|执行|来)?(?:[^。]{0,4})?(?:就是|就行了|就好|就行|没错|不会错)`,
  // 执行照做形（动词前置）：执行就对了 / 照做就行 / 听话就好
  String.raw`(?:执行|照做|听话|顺从|服从|跟着做|照着做)(?:[^。]{0,4})?(?:就|就行了|就好|便是)(?:[^。]{0,2})?(?:对|没错|可以|行|是)`,
  // 服从替代：无条件的信任 / 绝对的服从 / 完全的顺从
  String.raw`(?:无条件|绝对|完全|彻底|死心塌地)(?:[^。]{0,4})?(?:的)?(?:[^。]{0,4})?(?:信任|服从|顺从|忠心|虔诚|相信|跟随|拥护)`,
  // ── 英文
  String.raw`\bjust\s+(?:feel|feel\s+it|trust|believe|obey|accept)\b`,
  String.raw`\b(?:only\s+)?(?:through|by)\s+(?:faith|feeling|intuition)\b[^.]{0,20}?\b(?:can|could|will)\b`,
].join('|'), 'i');

// ─── 结构B: CONVICT 定罪豁免形（单支成判）────────────────────────────────
const CONVICT_ZH = new RegExp([
  // 怀疑定罪：你怀疑就是不够虔诚 / 不信就是没有缘分 / 质疑说明你境界不够
  String.raw`(?:怀疑|质疑|不信|疑问|不信任|提问)(?:[^。]{0,8})?(?:就是|说明|代表|意味着|证明|表明)(?:[^。]{0,8})?(?:不够|不足|不|没|太|缺)`,
  // 证据豁免：信仰不需要证据 / 真正的修行不讲道理 / 真理无须证明
  String.raw`(?:信仰|信念|真理|大道|真谛|佛法|天道|修行|组织|上师|大师|师父|领袖)(?:[^。]{0,8})?(?:不需要|不用|无须|无需|不讲|不是靠|不问|不靠)(?:[^。]{0,6})?(?:证据|证明|道理|逻辑|理性|质疑|怀疑|理由)`,
  // 缺陷重定义：你的问题都是杂念 / 你的焦虑都是执念
  String.raw`(?:你的|你说的|你这些|你的这些)(?:[^。]{0,6})?(?:问题|疑问|困惑|烦恼|痛苦|焦虑|怀疑|质疑|纠结|痛苦)(?:[^。]{0,6})?(?:都|全|统统|皆)(?:[^。]{0,6})?(?:是)?(?:[^。]{0,6})?(?:杂念|妄念|执念|障碍|心魔|念头|幻象|虚妄)`,
  // 天意决定论：这是天意 / 纯属天意 / 皆是天命
  String.raw`(?:这是|乃是|就是|纯属|皆是|一切都是)(?:[^。]{0,4})?(?:天意|天命|天注定|命运|劫数)`,
  // 质疑=自毁：质疑组织就是质疑你自己 / 反对我们就是反对你自己
  String.raw`(?:质疑|反对|怀疑|批评|不认同|否定|离开)(?:[^。]{0,8})?(?:组织|上师|大师|师父|领导|公司|我们|大家|这里|集体)(?:[^。]{0,8})?(?:就是|等于|意味着)(?:[^。]{0,8})?(?:质疑|反对|否定|背叛|背弃|抛弃)(?:[^。]{0,6})?(?:你|你自己|你自身)`,
  // 层次/境界定罪（独立一支，覆盖「你层次不到所以理解不了」族）
  String.raw`(?:你|您)(?:[^。]{0,4})?(?:层次|境界|悟性|修为|慧根|根基|缘分|资格)(?:[^。]{0,4})?(?:不到|不够|不足|太浅|没到|未到)`,
  // ── 英文
  String.raw`\bdoubting\b[^.]{0,40}?\b(?:proves?|means?|shows?|indicates)\b[^.]{0,40}?\b(?:not\s+ready|unready|unworthy|lacking|insufficient|too\s+(?:young|weak))\b`,
  String.raw`\b(?:faith|belief|the\s+teaching|the\s+master|truth)\b[^.]{0,30}?\b(?:needs?|requires?|demands?)\s+no\s+(?:evidence|proof|questioning|explanation)\b`,
  String.raw`\b(?:your|these)\s+(?:questions?|doubts?|concerns?)\b[^.]{0,30}?\b(?:are|is)\s+(?:just\s+)?(?:noise|distractions?|illusions?|attachments?)\b`,
].join('|'), 'i');

// ─── G1: 第三人称领域陈述（冥想练习强调 / 哲学流派认为 / 团队管理中）──────
const DOMAIN_ZH = new RegExp([
  // 实体 + 描述动词（实体表刻意不含裸「修行」——「真正的修行不讲道理」
  // 是攻击句，且「不讲道理」不是描述动词，双向都不该命中 G1）
  String.raw`(?:冥想|正念|禅修|瑜伽|宗教信仰|神学|哲学流派|某些哲学流派|有些哲学流派|哲学|团队管理|管理学|武术|心理学|社会学|人类学|教育学|伦理学)(?:练习|修行|实践|中|里|上)?[^。]{0,12}?(?:强调|认为|觉得|指出|表明|发现|提到|描述|讨论|要求|鼓励|确实存在|可能导致|主张|倡导)`,
  // 师父/弟子 第三人称：武术修行中，师父常要求弟子先照做再体会
  String.raw`(?:师父|老师|教练|导师)(?:[^。]{0,6})?(?:常|往往|通常|会)(?:[^。]{0,6})?(?:要求|让|叫)(?:[^。]{0,6})?(?:弟子|学生|学员|徒弟)`,
  // 英文
  String.raw`\b(?:mindfulness|meditation|martial\s+arts|philosophy|theology|management)\b[^.]{0,40}?\b(?:encourages?|emphasizes?|suggests?|involves?|teaches?|recommends?)\b`,
].join('|'), 'i');

// ─── G2: 句首咨询提问（只认句首咨询词）────────────────────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

// ─── G3: 概念分析语境（思想终止套话本身是被分析、被警惕的对象）────────────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:思想终止|思考终止|终止思考|扼杀[^。]{0,4}思考|认知封闭|思想控制|精神控制)(?:[^。]{0,16})?(?:是|属于|是一种|正是|应当|需要|警惕|识别|拒绝|不要|别|心理学|现象|模式|机制|话术|概念|形式|策略)`,
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,10})(?:警惕|识别|拒绝|摆脱|跳出|反思|防范)(?:[^。]{0,14})(?:思想|认知|精神)(?:[^。]{0,8})?(?:控制|封闭|终止|束缚)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,12})(?:思想终止|认知封闭|精神控制|情感操控|情感操纵|控制行为|PUA)`,
  // 英文
  String.raw`\bthought[- ]terminating\b[^.]{0,40}?\b(?:is|refers\s+to|describes|involves|clich)`,
  String.raw`\b(?:watch\s+for|recognize|identify|avoid)\b[^.]{0,30}?\bthought[- ]terminating\b`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkThoughtTerminatingCliche(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const STOP_ZH_ = R.STOP_ZH || STOP_ZH;
  const REPLACE_ZH_ = R.REPLACE_ZH || REPLACE_ZH;
  const CONVICT_ZH_ = R.CONVICT_ZH || CONVICT_ZH;
  const DOMAIN_ZH_ = R.DOMAIN_ZH || DOMAIN_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '思想终止套话×否定独立认知×感受/照做/无条件服从替代(zh)'
      : 'thought-terminating-cliche×negated-thinking×feel/obey-substitute(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：第三人称领域陈述 / 概念分析 / 句首咨询
  if (DOMAIN_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 结构 B：定罪豁免形单支成判
  if (CONVICT_ZH_.test(text)) return hitResult;

  // 结构 A：指令替代形双腿共现，缺一不判
  if (STOP_ZH_.test(text) && REPLACE_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkThoughtTerminatingCliche,
  __internals: () => ({
    STOP_ZH, REPLACE_ZH, CONVICT_ZH,
    DOMAIN_ZH, QUESTION_ZH, ANALYSIS_ZH,
  }),
};
