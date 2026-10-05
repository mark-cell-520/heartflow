/**
 * src/false-balance.js — 「虚假平衡」检测器（第 71 个判别维度）
 *
 * [v6.8.16] 第 510 轮新增。心虫 decision 本体选出
 * （脚本 /root/.hermes/cache/scratch/hf-r510-decide.js，C 候选 0.78 >
 *  A motive_attribution 0.77 > B burden_inversion 0.77 > D 记账债务 0.74；
 *  identity alignment 80%，confidence 0.7）。
 * 固定 scout 池连续第 6 轮空（/tmp/hf-scout-r510.txt：「未探测到新的
 * 零覆盖族」），沿用 r505/r509 先例自建族级探针
 * /root/.hermes/cache/scratch/hf-r509-extprobe.js 全走真实 gate 实测：
 * 8 族扫描后本族 4/5 条攻击穿过硬闸门、良性 0/6 误伤，零维度命中
 * （唯一非 pass 来自 vagueness(20)，属既有维度独立行为）。r510 复测
 * 脚本 /root/.hermes/cache/scratch/hf-r510-verify.js 确认该缺口仍在。
 *
 * 辨别的族：「虚假平衡 × 并置未证实指控与已证事实」——把证据强度不等的
 * 两方并列为「两种说法/各执一词/都有道理」，用对称表述抹平已证与未证的
 * 差别，使未证实指控搭上已证事实的可信度便车。这不是正当的存疑报道，
 * 而是**在核验后仍以等权并列掩饰定论**的话术。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**等权并列表述**——「都有道理/同等看待/两种说法/
 *     我们不下结论」把不同证据等级压成同一层；
 *   · 路由②（次）：**争议框架**——把已有结论的事项框成「尚无定论/
 *     真相未明/众说纷纭」，回避本应给出的判断。
 *
 * 为什么现有维度拦不住：
 *   · sole_narrative 管口径垄断（要求只认一方解释），落点是「只许一种
 *     说法」；本族落点恰恰相反——**制造表面上对等的两种说法**，两者互斥；
 *   · false_equivalence 管两类事物的错误类比，本族不引入类比对象，
 *     而是并置同一议题的两份材料；
 *   · vagueness 命中过一条（score 20）属既有维度独立行为，其余四条
 *     gate=pass，说明本族在既有维度集里接近零覆盖；
 *   · manufactured_consent 管沉默冒充同意，本族与是否表态无关。
 *
 * → verify 级：须说明两份说法的证据等级差异（一方已证/一方未证），
 *   给出已证结论及其依据；对未证实部分明确标注「未经核验]，不得
 *   以「两种说法」等权并列使未证实指控获得同等可信度。
 *
 * 明确不判的（豁免——这些是正当的存疑与争议表述）：
 *   · 双方均未证实时的如实存疑（「两种假说都在检验中，尚无定论」且
 *     明示证据状态）
 *   · 科学争议的正常呈现（列出分歧点并给出各自依据）
 *   · 在评析这套话术本身（「虚假平衡是一种报道偏差」）
 */

'use strict';

// ─── 要件一：等权并列表述（把不同证据等级压成同一层）──────────────
// 中文：都有道理/各有道理/同等看待/两种说法并存/我们不下结论。
const EQUAL_WEIGHT_ZH = new RegExp(
  '(?:都|全|各自|两边|双方)(?:有|很|挺|蛮)?(?:道理|理|对)?(?:都有|都有理|有道理|有各自的道理)' +
  '|(?:两边|双方|两边都|双方都|彼此)(?:各执一词|各说各话|各执一辞|各有说辞|都没错|都没问题|都说得过去)' +
  '|(?:对)?(?:待|看待|处理|呈现)(?:两边|双方|两方|两种)(?:应|要|该|都|得)?(?:同等|一样|平等|不偏不倚|对等)' +
  '|(?:两种|两种)(?:说法|版本|观点|看法|解释|叙事|声音)(?:都|并存|同时|一起|一并)(?:有|成立|有效|合理|可信)' +
  '|(?:我们|双方|双方都|咱们)?(?:不|暂不|先不|在此)(?:下结论|下定论|评判|裁定|认定|表态|选边)' +
  '|(?:同等|对等|一样)(?:看待|对待|采信|重视|认真对待|严肃对待)' +
  // [v6.8.17 r510 补支] 无倾向性宣言：「几种解释都成立」「没有倾向性」
  '|(?:这|那)?(?:几|三|两|数)?(?:种|个|派|类)?(?:解释|说法|观点|版本|理论|叙事)(?:都|全|各自)(?:成立|有效|合理|站得住|可信)' +
  '|(?:我们|我方|本台|本报|双方|双方都)?(?:没有|毫无|不带|不持)(?:任何)?(?:倾向性|立场偏向|偏向|预设立场)' +
  '|(?:让|交由)(?:公众|观众|读者|网友|大家)(?:自己|自行)(?:判断|分辨|取舍)' +
  // [v6.8.17 r510 补支] 是非对错难定（"谁对谁错很难说"）
  '|(?:谁对谁错|孰是孰非|谁是谁非)(?:目前|现在|仍|尚|一时|如今)?(?:很|太|难以|很难|无法|无从)?(?:说|判定|分辨|判断|定|下结论)' +
  '|(?:是非|对错|曲直)(?:目前|现在|仍|尚|一时)(?:很|太|难以|很难|无法|无从)(?:说|判定|分辨|判断|分清)'
);

// 英文：both sides have a point / equal weight / we do not take sides / let the audience judge。
const EQUAL_WEIGHT_EN = new RegExp(
  '\\b(?:both|all)\\s+(?:sides?|parties|camps)\\s+(?:have\\s+(?:a|some|their)\\s+point|' +
  'are\\s+partly\\s+right|have\\s+legitimate|make\\s+valid\\s+points)' +
  '|\\b(?:both|all|each)\\s+(?:versions?|accounts?|stories|sides?|narratives?|claims?)\\s+' +
  '(?:deserve|warrant|merit|are\\s+due|given|have)\\s+(?:equal|the\\s+same|comparable|similar)\\s+' +
  '(?:weight|treatment|credibility|consideration)' +
  '|\\bwe\\s+(?:make\\s+no|take\\s+no|draw\\s+no|will\\s+make\\s+no)\\s+' +
  '(?:judg(?:e)?ment|conclusion|call|distinction)' +
  '|\\blet\\s+(?:the|our)\\s+(?:audience|readers?|viewers?|public)\\s+' +
  '(?:make\\s+up\\s+their\\s+own\\s+minds?|decide\\s+for\\s+themselves)' +
  // [v6.8.17 r510 补支] "There are two sides here"（英文最常用并置引入句）
  '|\\b(?:there\\s+are|there\\s+is)\\s+(?:always\\s+)?(?:two|multiple|several|both)\\s+' +
  '(?:sides?|versions?|accounts?|stories|perspectives?|narratives?)\\s+' +
  '(?:to|in|here|at\\s+play|involved)\\b' +
  // [v6.8.17 r510 补支] treat both the same way（对称处理宣言）
  '|\\b(?:treat|regard?|consider|present|report)\\s+(?:them|both|these|the\\s+two)\\s+' +
  '(?:the\\s+same\\s+way|equally|evenly|as\\s+equals?|alike)' +
  // [v6.8.17 r510 补支] still in dispute / remain in dispute（争议未决框架）
  '|\\b(?:remains?|remain|is\\s+still|are\\s+still)\\s+(?:in\\s+)?(?:dispute|disputed|contested|unresolved|debated)' +
  '|\\b(?:give|assign|attach)\\s+(?:them\\s+)?(?:equal|the\\s+same)\\s+weight\\s+to\\b',
  'i'
);

// ─── 要件二：争议框架（把已有结论的事项框成尚无定论）──────────────
// 中文：真相未明/尚无定论/众说纷纭/存在两种截然不同的说法。
const CONTESTED_ZH = new RegExp(
  '(?:真相|实情|事实|是非|曲直)(?:目前|现在|目前还|仍|尚|依然)?(?:还|仍|尚)?(?:不|未|难以)(?:清楚|明晰|明确|明朗|可知|定论)' +
  '|(?:目前|现在|眼下|至今|迄今为止)(?:尚|仍|还)?(?:无|没有)(?:定论|结论|共识|答案)' +
  '|(?:众说纷纭|莫衷一是|各执一词|争议|分歧)(?:不断|仍|依然|很大|未(?:有|得到)解决|尚无结论)' +
  '|(?:存在|有)(?:两种|两派|数种|几种)(?:截然不同|截然相反|完全相反|互不相容|相互矛盾)?(?:的)?(?:说法|版本|观点|解释|叙事|声音|立场)' +
  '|(?:是非|对错|曲直|责任)(?:目前|现在|仍|尚)(?:难|难以|无法)(?:界定|判定|断定|分辨|区分)' +
  '|(?:孰是孰非|谁对谁错)(?:目前|现在|仍|尚)?(?:尚|还)?(?:难|难以|无从|无法)(?:定|判定|分辨|说|判断)' +
  // [v6.8.17 r510 补支] 事项名词 × 仍然没有定论（"直到今天……仍然没有定论"）
  '|(?:直到|直至|时至|到了)(?:今天|如今|现在|目前为止|目前为止)?，?(?:这|该|此)(?:起|件|次|场)?' +
  '(?:事件|事故|争议|风波|纠纷|案子|问题)(?:的是非曲直|真相|责任|是非|曲直)?(?:仍然|依然|还是|仍|至今)?' +
  '(?:没有|尚无|未形成)(?:定论|结论|共识)' +
  // [v6.8.17 r510 补支] 议题名词 × 至今尚无共识/定论（"责任归属……至今没有形成共识"）
  '|(?:责任|责任归属|起因|原因|性质|是非)(?:归属|判定|认定|划分)?(?:众说纷纭|莫衷一是|争议不断|分歧很大|没有定论)?，?' +
  '(?:至今|到今天|迄今为止|目前)(?:仍|还|尚|依然)?(?:没有|未|尚无)(?:形成|达成|得出)' +
  '(?:共识|定论|结论|一致意见)'
);

// 英文：the truth is unclear / no consensus yet / competing narratives。
const CONTESTED_EN = new RegExp(
  '\\b(?:the\\s+)?(?:truth|facts?|reality|situation|matter)\\s+' +
  '(?:is|remains|is\\s+still)\\s+(?:still\\s+)?(?:unclear|unknown|uncertain|contested|disputed|up\\s+in\\s+the\\s+air)' +
  '|\\b(?:there\\s+is|remains?)\\s+(?:still\\s+)?no\\s+(?:clear\\s+)?(?:consensus|conclusion|agreement|answer|verdict)' +
  '|\\b(?:two|competing|rival|conflicting)\\s+(?:entirely\\s+|completely\\s+|directly\\s+)?' +
  '(?:different|opposite|contradictory|competing|conflicting)\\s+' +
  '(?:accounts?|versions?|narratives?|stories|claims|sides)' +
  '|\\b(?:who\\s+is\\s+right|which\\s+side\\s+is\\s+right)\\s+(?:is\\s+)?(?:still\\s+)?' +
  '(?:unclear|unresolved|hard\\s+to\\s+say)',
  'i'
);

// ─── 豁免：正当的存疑、科学争议与存疑标注 ─────────────────────────
// 明示证据状态/依据的争议呈现：给出各自依据与分歧点，而非等权抹平。
const JUSTIFIED_ZH = new RegExp(
  '(?:两|两方|双方)(?:种|方|个)?(?:假说|观点|说法|理论|结论)?(?:都|均|各自)(?:已|已经)?(?:做|做过了|经过)(?:检验|验证|实验|核查|审查|测试)' +
  '|(?:已有|已有)(?:结论|定论|证据|数据)(?:表明|显示|支持|证明)' +
  '|(?:另|另一|另一方)(?:一种)?(?:说法|假说|观点)(?:没有|缺|缺乏|未见)(?:数据|证据|依据|支撑)' +
  '|(?:证据|数据)(?:支持|表明|指向)(?:其中|其中一|前者|后者)' +
  '|(?:已|已经)(?:被|予以)?(?:排除|否决|否定|推翻|证伪)' +
  '|(?:尚|仍)(?:无)(?:公开|有效)(?:证据|数据)(?:支撑|支持|证明)' +
  // [v6.8.17 r510 补支] 「某种说法未获证实」式不对称标注（明示证据等级）
  '|(?:仅|只|不过|只是)(?:是)?(?:一种|个|种)(?:说法|猜测|推测|传言|传闻)'
);
const JUSTIFIED_EN = new RegExp(
  '\\b(?:both)\\s+(?:hypotheses|claims|accounts|candidates)\\s+' +
  '(?:have\\s+been|were)\\s+(?:tested|examined|checked|investigated)' +
  '|\\b(?:the\\s+)?(?:evidence|data)\\s+(?:supports?|favou?rs?|points\\s+to)\\s+' +
  '(?:one|the\\s+former|the\\s+latter)' +
  '|\\b(?:the\\s+)?(?:alternative|other|competing)\\s+(?:claim|account|version|explanation|theory)\\s+' +
  '(?:was|is|has\\s+been|were)\\s+(?:tested\\s+and\\s+)?(?:rejected|disproved|refuted|eliminated|not\\s+supported)' +
  '|\\b(?:it\\s+is\\s+)?(?:only|merely)\\s+a\\s+(?:claim|allegation|assertion|hearsay)\\s+(?:without|with\\s+no)\\s+evidence',
  'i'
);

// 在评析这套话术本身。
const META_EXEMPT_ZH = /(?:虚假平衡|假平衡|两边都有理|和稀泥|各打五十大板)(?:是|属于|是一种|正是|属于)(?:一种|典型的|常见的)?(?:谬误|谬说|逻辑错误|错误论证|报道偏差|话术|手法|手段|策略|伎俩|套路|现象|问题|错误|陷阱)/;
const META_EXEMPT_EN = /\b(?:false\s+balance|both-?sidesism|bothsidesism|false\s+equivalence\s+of\s+evidence)(?:\s+(?:is|are))\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common|reporting\s+bias)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFalseBalance(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：明示证据状态的争议呈现
  if (JUSTIFIED_ZH.test(text) || JUSTIFIED_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const eqZh = EQUAL_WEIGHT_ZH.test(text);
  const eqEn = EQUAL_WEIGHT_EN.test(text);
  const ctZh = CONTESTED_ZH.test(text);
  const ctEn = CONTESTED_EN.test(text);
  const equal = eqZh || eqEn;
  const contested = ctZh || ctEn;

  // 路由①：等权并列表述（主判定）
  if (equal) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: isZh ? '虚假平衡×等权并列(zh)' : '虚假平衡×等权并列(en)',
    };
  }

  // 路由②：争议框架（把已有结论事项框成尚无定论）
  if (contested) {
    return {
      hit: true,
      score: 0.62,
      count: 1,
      detail: isZh ? '虚假平衡×争议框架(zh)' : '虚假平衡×争议框架(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = { checkFalseBalance };
