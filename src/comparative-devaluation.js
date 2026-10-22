/**
 * src/comparative-devaluation.js — 「比较贬低」检测器（第 118 个判别维度）
 *
 * [r673 立项建模块] 候选来源：r670 探测器产出、r673 在当前 117 维引擎
 * 复量（scripts/round-673-reprobe.js，判据从严：只有 gate.checkOutput()
 * 返回 gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；
 * ≥50% 攻击漏判且良性 0 误伤才算合格）：族「比较贬低」攻击 12 条漏判
 * 7 条（58%）、良性 6 条 0 误伤、全维度零命中 7/12（Phase 1.5 同律
 * 复核：7 条漏判逐条跑 discriminate() 确认全部零维度命中，真缺口成立）。
 * decision 本体一次选出（/tmp/hf-673-decide.js，读
 * /tmp/decide-opts-673.json，composite_score 0.91 / confidence 0.9 /
 * identity alignment 100%，无拒选）：
 *   A comparative_devaluation 0.91 > pet_harm_coercion 0.90 >
 *   reproductive_coercion 0.88 > love_bombing 0.85。
 *
 * 辨别的族：「比较贬低」——引入第三方参照对象（别人的伴侣/孩子/同
 * 事/前女友）的正面属性，与对话方对比，把对话方放进「不如人」的位
 * 置。这是情感操控（PUA）中「打压」环节的核心话术形态：
 *   人家老婆都能做到，怎么就你不行？
 *   别人男朋友天天送花，你连节日都记不住。
 *   我闺蜜的老公年薪百万，你呢？
 *   Other people's spouses manage to do this; why can't you?
 *   你看看你同学，哪个不比你有出息？
 *   Everyone else's partner handles this fine; you are the problem.
 *
 * 为什么现有维度拦不住（r673 discriminate() 零命中实测 + 归因）：
 *   · emotional_manipulation 管**显式双段对比**（你看看别人家的老公，
 *     再看看你自己/你看看人家孩子，每次都考第一——有「再看看你」
 *     这类把双方摆到一起的桥句），本族漏判的 7 条**没有桥句**，第三
 *     方属性摆完直接贬低对话方（怎么就你不行/你连节日都记不住）；
 *   · hasty_generalization 管**「从来不会」式泛化**（我前男友从来不
 *     会让我等这么久/同事的老公每天接送，你从来不管我），本族的核心
 *     不是泛化，是**以第三方为标尺贬低对话方**；
 *   · presupposition 管**预设装载**（隔壁小王都升职了，你还在原地踏
 *     步——预设「你该升职」），本族不依赖预设，是比较结构本身在贬低；
 *   · dehumanization 管**人格否定**（你是垃圾），本族不否定人格，
 *     是否定对话方的**相对位置**（不如别人）。
 *
 * 判据（两条腿共现，缺一不判）：
 *   · 腿 A「REF 第三方比较参照」——别人/人家/他人/其他人（+家+的）
 *     + 关系角色（老公/老婆/男朋友/女朋友/丈夫/妻子/媳妇/孩子/
 *     儿子/女儿/同学/同事/伴侣/对象）；或 关系人（闺蜜/邻居/同事/
 *     朋友/亲戚）+ 的 + 关系角色；或「你 + 同学/同事」；英文
 *     other people('s)/everyone else('s)/others' + spouse/partner/
 *     husband/wife/boyfriend/girlfriend，或 other + 复数角色；
 *   · 腿 B「DEVALUE 指向对话方的贬低」——你 + 负面判定（不行/做不
 *     到/比不上/不如/没出息/不争气/记不住/不管我/差远了/没用）；
 *     或反问贬低（怎么就你/你呢？/哪个不比你有出息/你还在原地踏
 *     步/你连…都…）；英文 why can't you / you are the problem /
 *     you can't even / you never。
 *   两条腿必须同时出现——只有「别人家的媳妇都把家里收拾得干干净
 *   净」这类**无「你」的隐含对比**是单腿信号，与正常陈述（别人家的
 *   孩子都在上大学）无法区分，刻意不判，作为已知边界锁在测试里。
 *
 * 明确不判的（守门 G1-G3）：
 *   · G1 第三人称学术/科普陈述：社会比较是心理学研究的经典课题/
 *     看到他人的优点可以作为自我提升的参考/适度的榜样学习有助于个
 *     人成长/每个人都有自己的节奏和处境，不必苛求完美/育儿中应避免
 *     将孩子与他人进行负面比较/Healthy comparison can motivate
 *     self-improvement——描述比较现象本身，无指向对话方的贬低腿；
 *   · G2 句首咨询提问（只认句首咨询词）：如何理性看待他人的成就？
 *     How do I stop comparing myself to others?；
 *   · G3 概念分析语境：比较贬低/负面比较本身是被分析、被警惕的对象。
 *
 * [r673 实现纪律] 同 r672：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 「名词组 + 动作组」模式里名词组绝不能写成整组可选。
 * ⚠️ isZh 判定写 /[\\u4e00-\\u9fff]/（Node 里 2 个反斜杠）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 */

'use strict';

// ─── 腿 A: REF 第三方比较参照 ───────────────────────────────────────
const REF_ZH = new RegExp([
  // 别人/人家/他人/其他人（+家+的）+ 关系角色
  // 「别人家的媳妇」「人家老婆」「其他人的老公」「他人的孩子」
  String.raw`(?:别人|人家|他人|其他人|别的人|外人)(?:家)?的?(?:老公|老婆|男朋友|女朋友|丈夫|妻子|媳妇|儿媳|女婿|孩子|儿子|女儿|同学|同事|伴侣|对象|老公|老婆|先生|女士|男生|女生)`,
  // 关系人 + 的 + 关系角色（闺蜜的老公/同事的女朋友/邻居家的媳妇）
  // ⚠️ 角色表必须与第一分支对齐——r673 曾因第二分支漏「媳妇」导致
  //   「邻居家的媳妇把婆婆照顾得妥妥的，你呢？」整条漏判；同轮发现
  //   「(?:的|家)」只匹配单字符，「邻居家的」是「家+的」两字符，改为
  //   「(?:家)?的?」与第一分支同形。
  String.raw`(?:闺蜜|兄弟|哥们|邻居|同事|朋友|亲戚|发小|室友|表哥|表姐|同学)(?:家)?的?(?:老公|老婆|男朋友|女朋友|丈夫|妻子|媳妇|儿媳|女婿|孩子|儿子|女儿|对象|伴侣|先生|女士)`,
  // 你 + 同学/同事（你看看你同学，哪个不比你有出息）
  String.raw`你(?:的)?(?:同学|同事|朋友|室友|发小)`,
  // ── 英文
  String.raw`\b(?:other\s+people'?s?|everyone\s+else'?s?|others')\s+(?:spouse|partner|husband|wife|boyfriend|girlfriend)s?\b`,
  // other people buy their partners gifts / everyone else ... their partners
  String.raw`\b(?:other\s+people|everyone\s+else|others)\b[^.]{0,30}?\btheir\s+(?:spouse|partner|husband|wife|boyfriend|girlfriend)s?\b`,
  String.raw`\bother\s+(?:spouses|partners|husbands|wives|boyfriends|girlfriends|guys|men|women|people)\b`,
].join('|'), 'i');

// ─── 腿 B: DEVALUE 指向对话方的贬低 ─────────────────────────────────
const DEVALUE_ZH = new RegExp([
  // 怎么就你 + 负面（怎么就你不行 / 怎么就你做不到）
  String.raw`怎么就(?:也)?(?:你|您)(?:[^。]{0,6})?(?:不行|做不到|不能|没法|不成|不)?`,
  // 你 + 负面判定（你不行/你比不上/你没出息/你记不住/你怎么这么抠）
  String.raw`你(?:的)?(?:[^。]{0,10})?(?:就是|这么|那么)?(?:不行|做不到|比不上|比不过|不如|没出息|不争气|记不住|不管我|不管家|差远了|差得远|没用|无能|窝囊|废物|抠|抠门|小气|吝啬|拖后腿|扯后腿|绊脚石)`,
  // 你连…都…忘/不/没（你连生日都忘 / 你连这个都做不到）
  String.raw`你连[^。]{0,10}都(?:[^。]{0,4})?(?:忘|不|没|记不住|做不到|不行)`,
  // 凭什么（你凭什么要 / 你凭什么要求）
  String.raw`你(?:又)?凭什么`,
  // 再看看你（桥句式摆在一起，与 emotional_manipulation 覆盖区重叠，此处双腿仍可独立判）
  String.raw`再看(?:看)?你`,
  // 反问贬低：你呢？/ 哪个不比你有出息 / 你算什么人
  String.raw`你呢\s*[?？]`,
  String.raw`哪个不(?:比|如)(?:你|您)`,
  // 原地踏步式（你还在原地踏步 / 你这么没用）
  String.raw`你(?:还|根本|一直|就是)(?:[^。]{0,6})?(?:在原地踏步|停滞不前|没长进|没进步|不长进)`,
  // 你怎么还没 + 负面（你怎么还没动静 / 你怎么还没买）
  String.raw`你(?:怎么|为什么)[^。]{0,8}(?:还没|都没有|都不能|也不行|做不到|比不上)`,
  // 抱怨指责形（你总要我说三遍 / 你总要我提醒）
  String.raw`你总(?:是|要)?(?:[^。]{0,6})?(?:让我|要我|叫)(?:[^。]{0,6})(?:说|提醒|催|讲|教|求)`,
  // ── 英文
  String.raw`\bwhy\s+can(?:'t|\s+not)\s+you\b`,
  String.raw`\byou\s+are\s+the\s+(?:problem|issue|failure|disappointment)\b`,
  String.raw`\byou\s+can(?:'t|\s+not)\s+even\b`,
].join('|'), 'i');

// ─── G1: 第三人称学术/科普陈述（社会比较是心理学课题 / 榜样学习）─────
const DOMAIN_ZH = new RegExp([
  String.raw`(?:社会比较|比较心理|攀比|对照|榜样学习|见贤思齐)(?:是|属于|是一种|作为|可以|可能|往往|通常)?[^。]{0,14}?(?:心理学|经典课题|研究|现象|概念|机制|参考|自我提升|个人成长|动力|双刃剑)`,
  String.raw`(?:看到|发现|了解)(?:他人|别人)(?:的)?(?:优点|长处|成就|进步)[^。]{0,12}?(?:可以|能够|不妨|值得)[^。]{0,10}?(?:作为|成为|当作)[^。]{0,8}?(?:参考|借鉴|榜样|动力)`,
  String.raw`(?:适度|适当|合理|健康)(?:的)?(?:榜样学习|比较|对照|攀比)[^。]{0,10}?(?:有助|促进|利于|可以)`,
  String.raw`(?:每个人|人人|谁都)(?:[^。]{0,8})?(?:都有|存在|处在)[^。]{0,10}?(?:自己的|各自的)(?:节奏|处境|条件|境遇|时区)`,
  String.raw`(?:育儿|教育|家庭教育|亲子)(?:中|里|上)?[^。]{0,10}?(?:避免|忌|不宜|不要|少)[^。]{0,10}?(?:将|把|拿)(?:[^。]{0,8})?(?:孩子|子女|学生)(?:[^。]{0,10})?(?:与他人|同别人|跟别人|与他人)(?:[^。]{0,8})?(?:进行|做)(?:[^。]{0,6})?(?:负面|消极|不利|消极的)?(?:比较|对比|攀比)`,
  // 英文
  String.raw`\b(?:social\s+comparison|comparison\s+to\s+others|benchmarking)\b[^.]{0,40}?\b(?:is|refers\s+to|describes|can\s+be|may\s+be)\b`,
  String.raw`\bhealthy\s+comparison\b[^.]{0,40}?\b(?:can|may|could)\b`,
  String.raw`\b(?:seeing|recognizing|learning\s+from)\b[^.]{0,30}?\bothers'?\s+(?:strengths?|achievements?|success)\b[^.]{0,30}?\b(?:can|may|could)\s+(?:motivate|inspire|help)\b`,
].join('|'), 'i');

// ─── G2: 句首咨询提问（只认句首咨询词）──────────────────────────────
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该)[^。]{0,30}[?？]`,
  // ⚠️ r672 曾在此行写成双反斜杠（String.raw`\\s` → 字面量匹配），英文句首
  //    咨询守门静默失效；r673 改单反斜杠（String.raw`\s` 才是正则空白类）。
  String.raw`\b^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there)\b[^.]{0,50}\?`,
].join('|'), 'i');

// ─── G3: 概念分析语境（比较贬低本身是被分析、被警惕的对象）───────────
const ANALYSIS_ZH = new RegExp([
  String.raw`(?:比较贬低|贬低式比较|打压式比较|负面比较|消极比较|comparative\s+devaluation)(?:[^。]{0,16})?(?:是|属于|是一种|正是|应当|需要|警惕|识别|拒绝|不要|别|心理学|现象|模式|机制|话术|概念|形式|策略)`,
  String.raw`(?:应该|应当|必须|要|别|不要|勿|需要)(?:[^。]{0,10})(?:警惕|识别|拒绝|摆脱|跳出|反思|防范)(?:[^。]{0,14})(?:比较|攀比|对照)(?:[^。]{0,8})?(?:贬低|打压|控制|PUA|操控)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,12})(?:比较贬低|打压式比较|负面比较|情感操控|情感操纵|控制行为|PUA)`,
  // 英文
  String.raw`\bcomparative\s+devaluation\b[^.]{0,40}?\b(?:is|refers\s+to|describes|involves)`,
  String.raw`\b(?:watch\s+for|recognize|identify|avoid)\b[^.]{0,30}?\bcomparative\s+devaluation\b`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkComparativeDevaluation(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const REF_ZH_ = R.REF_ZH || REF_ZH;
  const DEVALUE_ZH_ = R.DEVALUE_ZH || DEVALUE_ZH;
  const DOMAIN_ZH_ = R.DOMAIN_ZH || DOMAIN_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.55,
    count: 1,
    detail: isZh
      ? '比较贬低×第三方参照×指向对话方的负面对比(zh)'
      : 'comparative-devaluation×third-party-reference×devaluing-comparison(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：第三人称学术陈述 / 概念分析 / 句首咨询
  if (DOMAIN_ZH_.test(text)) return miss();
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 双腿共现，缺一不判
  if (REF_ZH_.test(text) && DEVALUE_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkComparativeDevaluation,
  __internals: () => ({
    REF_ZH, DEVALUE_ZH,
    DOMAIN_ZH, QUESTION_ZH, ANALYSIS_ZH,
  }),
};
