/**
 * src/nirvana-fallacy.js — 「完美方案谬误（nirvana fallacy / perfect solution
 * fallacy）」检测器（第 198 个判别维度）
 *
 * [r201 立项] philosophy_decision 在当前引擎（v6.8.129，197 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。立项缺口实证：grep -ril 'nirvana|perfect
 * solution|治标不治本|完美方案|一劳永逸|银弹' src/ 仅命中 fallacy-fallacy.js
 * 的概念引述豁免表与 index.js:5866 一条窄正则（「不完美等于没用」固定句式），
 * 无任何维度以「不完美宣告×行动废止」两腿结构覆盖本族；既有族探针复测——
 * 本族攻击 5/5 gate.action=pass（真零命中）、良性 5/5 pass（零误伤）。
 *
 * 辨别的族：完美方案谬误（nirvana fallacy / perfect-solution fallacy /
 * all-or-nothing thinking）——拿**方案的不完美**（不能根治/不能100%/有漏洞/
 * 治标不治本/不是万能/不能一劳永逸）直接推出**废止行动**（没意义/不值得/
 * 不该做/干脆放弃/取消/废止/徒劳/白费/不如不做），用一个现实中不存在的
 * 「理想化对照」否决「不完美但确有收益」的现实选项：
 *   这个药不能根治癌症，所以吃它毫无意义，干脆放弃治疗算了。
 *   口罩无法100%防住病毒，既然防不住就该取消，戴了也是白费功夫。
 *   隔离措施只是治标不治本，根本不该采用，纯属多此一举。
 *   新系统不能一劳永逸地解决所有问题，可见投入它就是徒劳，不如趁早叫停。
 *   This policy isn't perfect, so it's not worth pursuing — might as well do nothing.
 *   The vaccine can't fully eliminate infection, therefore there's no point in rolling it out.
 *
 * 与既有维度的边界（r201 归因）：
 *   · base_rate_neglect（第 169 维）管**单个阳性信号→高置信度个体结论**（命中
 *     即中招），错在后验更新不计基础概率；本族错在**用理想化完美标准否决现实
 *     方案**，可完全无概率语言。
 *   · perfect_error 管**指标数字的精确度假象**（98.7% 这种伪精确），本族不管
 *     数字精度、管「不完美→废止」的论证结构；index.js:5866 遗留的
 *     perfect_solution 正则只收「不完美…等于…没用」一种固定连接词，本族
 *     覆盖裸废止动词与因果/推论连接词的完整句式族。
 *   · false_dilemma（非黑即白）管**只给两个选项的虚假对立**；本族选项可以只有
 *     一个（现行方案），否证手段是「拿完美标准对照现实方案」，不是构造假两难。
 *   · appeal_to_consequences 管**怕后果所以信/不信某事**；本族管**因不完美
 *     所以废弃方案本身**，落点是行动存废而非信念真伪。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① IMPERFECT 不完美宣告（中英）：不能/无法/难以/做不到+根治/根除/彻底/
 *     100%/百分百/一劳永逸、不完美/有缺陷/有漏洞/有短板/有死角/有局限/有副作用/
 *     治标不治本/只是治标、不是万能/不是灵丹妙药/没有银弹；EN isn't perfect /
 *     can't fully solve / won't eradicate / only treats the symptoms / not a
 *     silver bullet / has flaws / not 100%。
 *   · 腿② REJECT 行动废止（中英）：没/毫无/没有意义、没/毫无价值、一文不值、
 *     不值得、杯水车薪、徒劳、白费、多此一举、画蛇添足、放弃/取消/废止/废除/
 *     终止/停止/叫停/下马/抵制/拒绝（带否定前缀的不废止动词除外）、不该/不应该
 *     +存在/推行/采用/使用/保留/尝试、等于白做、纯属徒劳/多余；EN pointless /
 *     no point / not worth / might as well give up / should be abandoned /
 *     why bother / waste of time / wait for a perfect solution。
 *   · 缺腿不判：只有腿①（「这个方案不能根治，但能缓解症状」）是对局限的正确
 *     认知；只有腿②（「这件事毫无意义」）无论及对象局限，归 confidence 等族。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误论证、逻辑教学中的反例讲解、或
 * 「先废止再论证」的草稿。verify 的含义是「这个废止决定建立在完美标准而非
 * 现实成本收益之上，需要回到：方案的真实收益、不做的代价、以及可用的改进
 * 路径」——调用方应要求补上成本收益依据或改进/过渡方案，而不是接受
 * 「不完美即废止」。
 *
 * 明确不判的（豁免——这些是计及收益的正确处置、概念讨论或证据型废止）：
 *   · 让步-肯定（但/然而/不过 + 值得/应当/仍/继续/缓解/控制/改善/推进/采用/
 *     降低/延长/有用/有效/试点/试行/过渡/没有放弃——「不能根治，但能缓解
 *     症状，值得推广」是对渐进改进的正确坚持）；
 *   · 证据型废止（严重副作用/风险大于收益/弊大于利/完全无效——因危害或无效
 *     而废止是正确的，本族只管「因不完美而废止」）；
 *   · 概念/教学转述（nirvana fallacy / 完美方案谬误 / 完美主义谬误 / all-or-
 *     nothing thinking / 要么完美要么不做——讨论这个概念本身不是运用它）；
 *   · 过渡/ interim（在…之前先…/暂行/过渡/stopgap / in the meantime——承认
 *     不完美时采用过渡手段是正确策略）；
 *   · 疑问句（含 ?/？——「不能根治就没意义吗？」是质疑该谬误本身）。
 */
'use strict';

// ─── 腿① IMPERFECT 不完美宣告（中文）──────────────────────────────
// 枚举腿自查（161 轮教训）：核心词取裸名词形态（不完美/有漏洞/治标不治本/
// 一劳永逸/银弹），同族词去后缀仍命中；否定词与完美词之间允许 ≤4 字间隔
// （「不能从根本上解决」这类带插入修饰的不能因紧邻要求漏判）。
const IMPERFECT_ZH = [
  // 否定词 × 根治/根除/彻底/100%/一劳永逸（允许插入修饰）
  /(?:不能|无法|难以|没办法|做不到|别想|未能|不好)[^。，！？!?]{0,4}(?:根治|根除|断根|灭绝|杜绝|清零)/,
  /(?:不能|无法|难以|没办法|做不到|别想|未能)[^。，！？!?]{0,4}(?:彻底|完全|全方位|无死角)/,
  /(?:不能|无法|难以|没办法|做不到|别想|未能)[^。，！？!?]{0,4}(?:100|百分百|百分之百|100%|万能)/,
  /(?:不能|无法|难以|没办法|做不到|别想)[^。，！？!?]{0,4}一劳永逸/,
  // 裸不完美名词（无否定前缀亦成立——名词本身即宣告不完美）
  /不完美|并不完美|不是完美|欠完美/,
  /(?:有|存在|带有)[^。，！？!?]{0,4}(?:缺陷|漏洞|短板|死角|局限|局限性|副作用|不良反应|风险|隐患|问题)/,
  /治标不治本|只是治标|标不治本|治标罢了/,
  /不是万能|并非万能|不是灵丹妙药|不是银弹|没有银弹|无银弹/,
  // 「找不到/没有 + 根治方法」句式（理想化对照在场）
  /(?:找不到|没有|无|缺乏)[^。，！？!?]{0,6}(?:根治|根除|彻底)/,
  // 英文句里夹带的 100% 否定（混合句兜底）
  /(?:can'?t|cannot|won'?t)\s+100/i,
];

// ─── 腿① IMPERFECT 不完美宣告（英文）──────────────────────────────
const IMPERFECT_EN = [
  /(?:isn'?t|aren'?t|is\s+not|are\s+not)\s+(?:a\s+)?perfect/i,
  /\bimperfect\b|\bflawed\b/i,
  /(?:can'?t|cannot)\s+(?:fully|completely|entirely|totally|100\s*(?:%|percent))?\s*(?:solve|fix|eradicate|eliminate|address|cure|end|stop|prevent|resolve)/i,
  /won'?t\s+(?:fully|completely|entirely|totally)?\s*(?:solve|fix|eradicate|eliminate|cure|end|stop|prevent|resolve)/i,
  /(?:cannot|can'?t)\s+be\s+(?:fully\s+)?(?:solved|fixed|eradicated|eliminated|cured|resolved|prevented)/i,
  /(?:only|just)\s+(?:treats?|addresses?)\s+the\s+symptoms?/i,
  /not\s+a\s+(?:cure|silver\s+bullet|panacea|magic\s+bullet|complete\s+solution|perfect\s+solution)/i,
  /no\s+silver\s+bullet/i,
  /(?:has|have)\s+(?:flaws|limitations|shortcomings|gaps|holes|drawbacks|weaknesses)/i,
  /(?:isn'?t|aren'?t|not)\s+100\s*(?:%|percent)/i,
  /(?:can'?t|cannot)\s+solve\s+everything|won'?t\s+solve\s+everything/i,
];

// ─── 腿② REJECT 行动废止（中文）──────────────────────────────────
// 否定前缀保护：/(?<![不该没未别莫勿])(?:放弃|取消|…)/ ——「不该放弃」「没有取消」
// 是正确的坚持，不是废止宣告（lookbehind Node 18 支持）。
const NEG_GUARD = '(?<![不该没未别莫勿])';
const REJECT_ZH = [
  // 无意义/无价值族
  /毫?无(?:意义|价值|用处|益处)/,
  /没[有]?意义|没[有]?价值|没[有]?用[处途]/,
  /一文不值|毫不足取/,
  /不值(?!一提)/,
  // 徒劳/白费/多此一举族
  /杯水车薪|徒劳(?:无功|无益|无补|而返)?|白费(?:力气|功夫|心机|心思|功夫)?|多此一举|画蛇添足|纯属多余/,
  // 废止动词族（否定前缀保护的裸动词形态，r161 教训）
  new RegExp(NEG_GUARD + '(?:放弃|放弃治疗|取消|废止|废除|废除掉|终止|停止|叫停|下马|下架|抵制|拒绝|摒弃|抛弃|摒弃掉|作废|搁置|撤掉|撤销)'),
  // 干脆/不如/索性 + 废止
  /(?:干脆|不如|不如趁早|索性|还是|只能|只好)[^。，！？!?]{0,4}(?:放弃|取消|废止|停止|终止|不(?:做|要|用|试|推行|采用)|算了)/,
  // 不该/不应该/不应 + 存在/推行/采用/使用/保留/尝试
  /(?:不该|不应该|不应|不该当)[^。，！？!?]{0,4}(?:存在|推行|采用|使用|保留|尝试|问世|上市|实施|继续|存在)/,
  // 等于白做/纯属徒劳
  /等于(?:没|白)?(?:做|费|干|忙)|纯属(?:徒劳|多余|浪费)/,
  // 强制废止
  /(?:必须|应当|应该|亟须|急需|务必)(?:被)?(?:立即|马上|尽快|彻底|完全|一律|全部|尽早)?(?:取消|废止|废除|禁止|取缔|摒弃|终止|停止|叫停|下架)/,
];

// ─── 腿② REJECT 行动废止（英文）──────────────────────────────────
const REJECT_EN = [
  /(?:so|therefore|thus|hence)\s+(?:it'?s|it\s+is|there'?s|we'?re)?\s*(?:pointless|useless|futile|meaningless|not\s+worth|no\s+point|a\s+waste)/i,
  /no\s+point\s+(?:in|to|trying|bothering)/i,
  /not\s+worth\s+(?:it|doing|trying|pursuing|the\s+effort|our\s+time|the\s+trouble|the\s+investment)/i,
  /might\s+as\s+well\s+(?:give\s+up|not\s+bother|do\s+nothing|stop|quit|forget\s+it|not\s+even\s+bother)/i,
  /(?:should|must|ought\s+to|needs?\s+to)\s+(?:be\s+)?(?:abandoned?|banned?|scrapped?|rejected?|dropped?|prohibited?|stopped?|discontinued?|blocked?|outlawed?|scrap)/i,
  /(?:let'?s|we\s+should|we'?d\s+better|we'?re\s+better\s+off)\s+(?:just\s+)?(?:give\s+up|do\s+nothing|abandon|stop|drop\s+it|scrap\s+it|wait)/i,
  /why\s+(?:even\s+)?bother/i,
  /waste\s+of\s+(?:time|money|effort|resources|taxpayer)/i,
  /better\s+(?:off\s+)?(?:to\s+)?(?:do(?:ing)?\s+nothing|wait(?:ing)?\s+(?:for|until)|give\s+up|not\s+(?:bother|act))/i,
  /(?:wait|hold\s+off)\s+(?:for|until)\s+(?:a\s+)?(?:perfect|complete|definitive|better)\s+(?:solution|fix|cure|vaccine|drug|treatment)/i,
  /give\s+up\s+on\s+(?:it|this|the\s+(?:plan|project|policy|effort|idea|search))/i,
  /abandon\s+(?:it|this|the\s+(?:plan|project|policy|effort|idea|program))/i,
];

// ─── 豁免一：让步-肯定（「不能根治，但能缓解症状，值得推广」）────────
// 转折词之后 20 字内出现肯定/收益/继续/渐进动词——「不完美但仍值得做」是
// 正确认知，正是本维度要保护的行为。注意「虽然有效，但不能根治，所以没意义」
// 这类攻击里，转折词后跟的是不完美宣告+废止，不含肯定词，不会被误豁免。
const EXEMPT_CONCESSION_ZH = [
  /(?:但|但是|然而|不过|可是|尽管|虽然|虽说|固然)[^。，！?]{0,20}(?:值得|应当|应该|仍|依然|继续|没有放弃|不抛弃|不放弃|可以先|不妨|先行|先用|缓解|控制|改善|改进|推进|采用|保留|有用|有效|有价值|试点|试行|过渡|延长|降低|减少|有进步|好过|聊胜于)/,
  /聊胜于无|有胜于无|总比没有好|比没有强/,
  /(?:不完美|有(?:缺陷|漏洞|局限))[^。]{0,8}(?:但|但是|然而|不过)/, // 不完美但…（肯定词后置到句尾）
];
const EXEMPT_CONCESSION_EN = [
  /\b(?:but|however|though|although|yet|still|nonetheless|nevertheless|never-the-less)\b[^.]{0,80}?(?:worth|valuable|helpful|useful|effective|works?|reduces?|slows?|extends?|improves?|saves?|buys?|mitigates?|better\s+than\s+nothing|remain|continue|should\s+(?:still|continue))/i,
  /better\s+than\s+nothing/i,
];

// ─── 豁免二：证据型废止（因危害/无效而废止是正确的，非完美标准作祟）───
const EXEMPT_HARM_ZH = [
  /(?:严重|重大|不可逆|致命|致死|致癌|成瘾|滥用|违法|违规|非法|有毒|有害|高危)[^。]{0,12}(?:副作用|不良反应|风险|危害|后果|问题|毒素|物质)/,
  /(?:副作用|不良反应|风险|危害|毒性)[^。]{0,6}(?:严重|很大|极高|过大|明显|突出|大于|超过)/,
  /弊大于利|得不偿失|风险大于|代价(?:太大|过高|惨重)|害处大于|过大于功/,
  /(?:完全|根本|丝毫)?(?:无效|没[有]?效果|不起作用|无[效功]用|毫无作用|没有[任何]?作用)/,
  /(?:已经|被)(?:证明|证实)(?:有害|无效|危险|不可用)/,
];
const EXEMPT_HARM_EN = [
  /(?:side\s+effects?|risks?|harms?|dangers?)\s+(?:are\s+)?(?:too\s+)?(?:severe|serious|significant|unacceptable|outweigh|grave)/i,
  /outweighs?\s+the\s+(?:benefits?|goods?|advantages?|gains?)/i,
  /more\s+harm\s+than\s+good/i,
  /(?:completely|entirely|totally|wholly)\s+(?:ineffective|useless|worthless)/i,
  /(?:has|have)\s+no\s+(?:therapeutic|medical|clinical|real)\s+(?:benefit|effect|value)/i,
  /proven\s+(?:harmful|ineffective|dangerous|unsafe)/i,
];

// ─── 豁免三：概念/教学转述（讨论这个概念本身不是运用它）─────────────
const EXEMPT_META_ZH = [
  /完美方案谬误|完美主义谬误|完美主义谬论|nirvana/i,
  /要么完美要么不做|全有或全无|非黑即白(?:思维|谬误)/,
  /求全责备|因噎废食/,
];
const EXEMPT_META_EN = [
  /nirvana\s+fallacy/i,
  /perfect[-\s]solution\s+fallacy/i,
  /all[-\s]or[-\s]nothing\s+(?:thinking|fallacy|mindset)/i,
  /perfect\s+is\s+the\s+enemy\s+of\s+good/i,
];

// ─── 豁免四：过渡/ interim（承认不完美时先采用过渡手段是正确策略）────
const EXEMPT_INTERIM_ZH = [
  /(?:在|待|趁着)[^。]{0,14}(?:之前|以前|之时|期间|之际)[^。]{0,12}(?:先|暂|暂行|过渡|临时|保守|先行)/,
  /(?:先|暂|暂行|临时|过渡|保守)[^。]{0,8}(?:控制|缓解|治疗|方案|措施|手段|办法|顶着|用着)/,
  /退而求其次|权宜之计|缓兵之计/,
];
const EXEMPT_INTERIM_EN = [
  /in\s+the\s+meantime/i,
  /(?:as\s+an?\s+)?interim\s+(?:measure|solution|step|fix)/i,
  /stopgap|bridge\s+(?:measure|solution)/i,
  /for\s+(?:now|the\s+time\s+being)/i,
  /first\s+step\s+(?:toward|towards|in\s+the\s+right\s+direction)/i,
];

const WIN_ZH = 60;    // 中文邻近窗（字）
const WIN_EN = 160;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkNirvanaFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const IMP_Z = R.IMPERFECT_ZH || IMPERFECT_ZH;
  const IMP_E = R.IMPERFECT_EN || IMPERFECT_EN;
  const REJ_Z = R.REJECT_ZH || REJECT_ZH;
  const REJ_E = R.REJECT_EN || REJECT_EN;

  // 疑问句整句豁免：「不能根治就没意义吗？」是质疑该谬误本身
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 四组豁免在场 → 不是运用它
  const EC_Z = R.EXEMPT_CONCESSION_ZH || EXEMPT_CONCESSION_ZH;
  const EC_E = R.EXEMPT_CONCESSION_EN || EXEMPT_CONCESSION_EN;
  const EH_Z = R.EXEMPT_HARM_ZH || EXEMPT_HARM_ZH;
  const EH_E = R.EXEMPT_HARM_EN || EXEMPT_HARM_EN;
  const EM_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const EM_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const EI_Z = R.EXEMPT_INTERIM_ZH || EXEMPT_INTERIM_ZH;
  const EI_E = R.EXEMPT_INTERIM_EN || EXEMPT_INTERIM_EN;
  if (anyHit(EM_Z, text) || anyHit(EM_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EI_Z, text) || anyHit(EI_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EC_Z, text) || anyHit(EC_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EH_Z, text) || anyHit(EH_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿①
  const impZhIdx = firstHit(IMP_Z, text);
  const impEnIdx = firstHit(IMP_E, text);
  const impIdx = impZhIdx >= 0 ? impZhIdx : impEnIdx;
  if (impIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿②
  const rejZhIdx = firstHit(REJ_Z, text);
  const rejEnIdx = firstHit(REJ_E, text);
  const rejIdx = rejZhIdx >= 0 ? rejZhIdx : rejEnIdx;
  if (rejIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「不完美→废止」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(impIdx - rejIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '完美方案谬误×不完美宣告推废止行动(zh)'
      : 'nirvana fallacy×imperfection-claim-to-rejection(en)',
  };
}

module.exports = {
  checkNirvanaFallacy,
  __internals: () => ({
    IMPERFECT_ZH, IMPERFECT_EN, REJECT_ZH, REJECT_EN,
    EXEMPT_CONCESSION_ZH, EXEMPT_CONCESSION_EN,
    EXEMPT_HARM_ZH, EXEMPT_HARM_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_INTERIM_ZH, EXEMPT_INTERIM_EN,
  }),
};
