/**
 * src/responsibility-absolution.js — 「责任打包让渡」检测器（第 73 个判别维度）
 *
 * [v6.8.21] 第 517 轮新增。心虫 decision 本体选出
 * （scripts/round-517-decide.js 三候选同分返回 chosen:null →
 *  scripts/round-517-decide2.js 补「independence/锚点/可实现性/风险」
 *  四项判据重判：C 责任打包让渡 0.77 > A 自动化流程常态化 0.74
 *  > B 效率替代审查 0.74，identity alignment 80%，confidence 0.7）。
 * 固定 scout 池连续第 10 轮空（/tmp/hf-scout-*.txt），按 r505/r509/
 * r510/r511 先例自建族级探针 scripts/round-517-candid-probe.js 实测：
 * 本族 **6/8 条攻击穿过硬闸门、良性 0/4 误伤**；
 * scripts/round-517-c-probe.js 扩展良性集复测确认 **6/8 穿过、良性 0/12**。
 *
 * 辨别的族：「责任打包让渡 × 诱导放弃核验与追责」——说话人主动把全部后果
 * 揽到自己身上（出问题我全权负责 / 追责追不到你 / 我担全部后果），
 * 以此要求对方**放弃核验、不再追问、不留记录**。作用机理与
 * scrutiny_evasion（贬斥核验者）相反：不贬低核验行为，反而装作替对方
 * 担责，把「是否核验」从事实问题变成「信不信我」的人情问题，
 * 从而在程序之外消解监督。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**责任全揽 × 劝阻核验/追责**同句共现；
 *   · 路由②（次）：**显式让渡句式**（责任与追责在我 / 后果全归我…）。
 *
 * 为什么现有维度拦不住（逐条实测边界）：
 *   · induced_trust 管「诱导盲目信任」，落点是信任本身，不处理
 *     「揽责换对方放弃核验」这个交换结构；
 *   · agency_deflection 管责任转嫁（把责任推给别人），本族是反方向的
 *     责任过度承担；
 *   · info_deprivation 只在同时含「不用过问细节」时独立命中（实测 2/8），
 *     其余 6 条零维度命中直接穿过硬闸门；
 *   · scrutiny_evasion 要求贬斥核验者，本族以担责姿态出现，实测 0/8 交叉命中。
 *
 * → verify 级：责任归属与事实核验是两个独立问题——即便有人口头担责，
 *    仍须完成既定核验并保留可追溯记录；口头担责不构成跳过流程的
 *    正当理由，必要时按制度报备。
 *
 * 明确不判的（豁免——正当担责/管理承诺/主动承担核验/评析本话术）。
 */

'use strict';

// ─── 责任全揽：把全部后果/责任揽到说话人自己身上 ────────────
// 不收「我来负责解决」这类具体任务担责，必须是全量后果担责。
// [r518] 结构重写为「数组每支独立 + join('|')」：原字符串拼接写法有两处
// 括号/分隔符缺陷（首支 (?: 未闭合导致整体被后面的 ) 拼成一个巨型
// alternation；`我担全部后果` 一支漏了前导 | 与前支粘连），实测导致
// 「出问题算我的」「这条线我兜着」两族 miss（r518 diag 复现）。
// 新写法每支括号自洽、互不粘连，逐支可独立置空做活度守卫。
const ABSORB_ZH = new RegExp([
  // b1：出(了)问题 + 算/归我 + (全权|全部)…负责/承担/认
  '出[^。，]{0,6}问题[^。，]{0,8}(?:我|由我|归我|算我)[^。，]{0,10}' +
    '(?:全权|全部|完全|统统)?[^。，]{0,4}(?:负责|承担|担着|扛|扛下来|兜底|认)',
  // b2：责任 + 我/由我/全 + (独自|全权)…扛/担/承担/揽/负责/兜底
  '责任[^。，]{0,8}(?:我|由我|全|统统|都)[^。，]{0,6}' +
    '(?:一个人|独自|全权)?[^。，]{0,4}(?:扛|担|承担|揽|负责|兜底)',
  // b3：任何后果 + 我/由我…承担/扛
  '(?:有)?任何后果[^。，]{0,6}(?:我|由我)[^。，]{0,4}(?:来|全)?(?:承担|扛|担|负责|兜底)',
  // b4：追责/问责 不到你
  '(?:追责|问责|追|算|查)[^。，]{0,8}(?:不到|追不到|算不到)[^。，]{0,6}(?:你|你们|我这边)',
  // b5：就算出事也是我的名字/责任/问题
  '(?:就算|即使|哪怕|纵然)[^。，]{0,6}出事[^。，]{0,8}(?:也)?我(?:的)?(?:名字|责任|问题)',
  // b6：我的名字 在上边/顶着
  '我(?:的)?名字[^。，]{0,4}(?:在上边|在上面|顶着|挂着|签着)',
  // b7：全部/所有/一切后果 + 我/由我…担
  '(?:全部|所有|一切)后果[^。，]{0,6}(?:我|由我)[^。，]{0,4}(?:担|扛|承担|负责|兜底)',
  // b8：我兜底/兜着/担着/扛下
  '我(?:来)?(?:兜底|兜着|担着|扛下)',
  // b9：我担(全部|所有|一切)(后果|责任)
  '我担[^。，]{0,4}(?:全部|所有|一切)(?:后果|责任)',
  // b10：责任/后果/后路 揽|背|兜 (过来|起来|下|着)
  '(?:责任|后果|后路)[^。，]{0,8}(?:揽|背|兜)(?:过来|起来|下|着)?',
  // b11：这条线/这事/这条路 + 我兜底/兜着/担着（无介词形）
  '(?:这条线|这事|这件事|这事上|这条路)[^。，]{0,6}我(?:来)?(?:兜底|兜着|担着)',
  // b12：问题/事/锅 + 算|归 + 我的（轻形：「出了问题算我的」）
  '(?:问题|事情|事|锅|责任)[^。，]{0,6}(?:算|归|是)[^。，]{0,2}我(?:的)?(?:事|问题|责任|头上)?',
].join('|'));

const ABSORB_EN = new RegExp(
  '\\b(?:i|we)\\s+(?:will\\s+)?(?:take|bear|assume|shoulder|absorb|own)\\s+' +
  '(?:full|complete|sole|entire|total|all)?\\s*(?:responsibility|liability|' +
  'the\\s+blame|the\\s+fallout|the\\s+consequences)' +
  '|\\b(?:no|not)\\s+(?:blame|liability|consequences|fallout|repercussions)' +
  '\\s+(?:falls?|lands?|will\\s+fall|comes?)\\s+(?:to|on)\\s+you' +
  '|\\byou\\s+(?:will\\s+not|won\\u0027t|are\\s+not|aren\\u0027t)\\s+' +
  '(?:be\\s+)?(?:held\\s+)?(?:accountable|responsible|liable|blamed)' +
  '|\\bmy\\s+(?:name|neck)\\s+is\\s+(?:on\\s+(?:it|the\\s+line)|out\\s+there)' +
  '|\\bit\\s+is\\s+(?:all\\s+)?my\\s+(?:call|responsibility|fault|problem)' +
  '|\\bi(?:\\u0027ll|\\s+will)?\\s+take\\s+the\\s+(?:hit|rap|fall)' +
  '|\\bi\\u0027ll\\s+take\\s+full\\s+responsibility' +
  // 「Any fallout / all the fallout ... on me / mine」
  '|\\b(?:any|all|the)\\s+(?:fallout|blame|consequences|liability|' +
  'repercussions)\\s+(?:is|are)?\\s*(?:entirely|fully|solely)?\\s*' +
  '(?:on\\s+me|mine|with\\s+me)' +
  '|\\b(?:entirely|fully|solely|all)\\s+(?:on\\s+me|my\\s+(?:call|problem|fault|responsibility))' +
  // 混排形：中文句子里直接写英文 Accountability/liability … rests with me
  '|\\b(?:responsibility|accountability|liability)[^\\n]{0,10}' +
  '(?:rests?|sits|lies)\\s+(?:entirely\\s+|fully\\s+)?with\\s+me',
  'i'
);

// ─── 劝阻核验与追责：以担责为由要求对方放弃动作 ──────────────
const DISSUADE_ZH = new RegExp(
  '(?:你[^。，]{0,6}(?:不需要|不必|不用|无须|无需|没必要|没有什么必要)' +
  '[^。，]{0,8}(?:再)?(?:核对|核查|复核|查|审|审验|验证|过问|追问|记录|留痕)' +
  '|(?:不用|不必|无需|无须|别|不要|甭)[^。，]{0,6}' +
  '(?:多问|过问|追问|细究|深究|核|查|审|怀疑|质疑|犹豫|迟疑|留记录|保留)' +
  '|(?:签个字|签字就行|直接签字|签了就行|照做|执行就行|直接干|' +
  '直接照做|尽管做|放开手|往下推|往前走)' +
  '|(?:把)[^。，]{0,4}(?:怀疑|疑虑|顾虑|疑问)[^。，]{0,4}' +
  '(?:收起来|放下|打消|去掉)?' +
  // 无主语劝阻形（你被省略）：「没有必要再留记录」「不用再留痕」
  '|(?:没有|没|不|无)(?:什么)?必要[^。，]{0,6}(?:再)?' +
  '(?:留|记录|留痕|存档|登记|报备|上报|备份)' +
  '|(?:放心|安心|踏踏实实|大胆)(?:地)?(?:用|推|干|走|签|执行)' +
  // 「你只管 X」——以担责为由解除对方决策负担（只管=不再自行判断）
  '|你[^。，]{0,4}(?:只管|尽管|放手|放开手)' +
  '(?:去)?(?:干|做|推|往前|走|冲|签)?)'
);

const DISSUADE_EN = new RegExp(
  '\\byou\\s+(?:do\\s+not|don\\u0027t|need\\s+not|don\\u0027t\\s+need)\\s+' +
  '(?:have\\s+)?to\\s+(?:re-?check|verify|audit|review|question|double-?check)' +
  '|\\bno\\s+need\\s+to\\s+(?:re-?check|verify|audit|review|question)' +
  '|\\bjust\\s+(?:sign|do\\s+it|comply|follow\\s+through|proceed|go\\s+ahead)' +
  '|\\bno\\s+need\\s+to\\s+(?:document|log|record|keep\\s+records)' +
  '|\\bset\\s+your\\s+(?:doubts|concerns|suspicions)\\s+aside' +
  '|\\bstop\\s+(?:second-?guessing|questioning|worrying)' +
  // 「don't bother keeping records / no need to keep records / skip the
  //  documentation」——劝阻留痕形，r518 实测漏（原五支只收 no need/just/set aside）
  '|\\b(?:don\'t|do\\s+not)\\s+bother\\s+(?:to\\s+)?' +
  '(?:keep(?:ing)?\\s+records?|document(?:ing)?|log(?:ging)?|writ(?:e|ing))' +
  '|\\b(?:no\\s+need\\s+to|skip|drop)\\s+(?:keep(?:ing)?\\s+records?|document(?:ing)?|log(?:ging)?)',
  'i'
);

// ─── 路由②：显式让渡句式（单独成立，无需共现）────────────────
const EXPLICIT_ZH = new RegExp(
  '(?:责任|追责|问责)[^。，]{0,10}(?:与追责|和追责)?[^。，]{0,4}在我' +
  // b2：我 + 承担 + 全部后果（「我担全部后果」）。良性形「承担**管理**责任」
  // 与「承担全部责任**但**要求复盘」不构成本族，用负向前瞻排除转折后续。
  '|(?:我|这件事|这事)[^。，]{0,6}(?:担|扛|背负)' +
  '[^。，]{0,4}(?:全部|所有|一切|全)?(?:后果|责任)' +
  '(?![^。！？]{0,12}(?:管理|领导|监管|主管|主管|岗位))' +
  '(?![^。！？]{0,12}(?:但|但是|不过|同时|仍|依然|还要|要|须))' +
  '|(?:责任|后果)[^。，]{0,4}(?:全|都)[^。，]{0,2}(?:我|由我|归我)(?:来)?(?:担|扛|揽)?' +
  // 「由我承担全部责任」——须同时出现「承担/负责 + 全部责任」，
  // 单纯「承担管理责任/承担全部责任但要求复盘」不算让渡（良性 #2/#6）
  '|(?:由我|我来|全|统统)(?:来)?(?:承担|背负|背负起|揽下)' +
  '(?:这次|此|本|该)?[^。，]{0,4}(?:全部|所有|一切)?[^。，]{0,2}责任' +
  '(?![^。！？]{0,10}(?:但|但是|同时|仍|依然|还要|要))'
);

const EXPLICIT_EN = new RegExp(
  '\\b(?:responsibility|liability|accountability|the\\s+blame|fallout)' +
  '\\s+(?:and\\s+any\\s+)?(?:consequences?|fallout|blame)?\\s*' +
  '(?:rests?|sits|lies)\\s+(?:entirely\\s+|fully\\s+)?with\\s+me' +
  '|\\ball\\s+(?:of\\s+)?(?:the\\s+)?(?:consequences|fallout|blame|' +
  'responsibility)\\s+(?:are\\s+)?(?:mine|on\\s+me|rest\\s+with\\s+me)' +
  '|\\bthe\\s+consequences\\s+are\\s+(?:entirely\\s+|fully\\s+)?' +
  '(?:mine|on\\s+me)' +
  // 混排形/一般形（r518 补）：中英混排句里的英文让渡 + 「Liability … rests
  // with me / for … rests with me」。原 sub1 的「rests with me」要求
  // responsibility|liability|accountability 后紧跟 optional ANY
  // consequences 再 rests，`Liability for any outcome rests` 的 for 短语
  // 不匹配，实测 e#0/e#2 全支 false（零覆盖死支）。
  '|\\b(?:accountability|liability|responsibility|blame|fallout|' +
  'the\\s+consequences)\\b[^.\\n]{0,24}?(?:rests?|sits|lies)\\s+' +
  '(?:entirely\\s+|fully\\s+|solely\\s+)?(?:with|on)\\s+me\\b',
  'i'
);

// ─── 豁免 ─────────────────────────────────────────────────
// 正当担责：认责 + 明确要求流程继续走完
const JUSTIFIED_ZH = new RegExp(
  '(?:该走的|既定的|必要的|应走的)(?:流程|程序|手续|环节)' +
  '[^。，]{0,8}(?:一步|一步都|还是|仍|依然)?[^。，]{0,6}' +
  '(?:不能少|少不了|要走完|走完|保留|继续|履行)' +
  '|(?:复盘|补救|整改)[^。，]{0,6}(?:照常|仍要|还要|必须先|必须)' +
  '|(?:如实|据实|逐项)(?:上报|报告|反馈|通报|说明)'
);
const JUSTIFIED_EN = new RegExp(
  '\\bwe\\s+(?:still|must|should|need\\s+to)\\s+' +
  '(?:complete|finish|document|keep)\\s+the\\s+(?:process|procedure|' +
  'controls?|records?|reviews?)' +
  '|\\bthe\\s+(?:process|controls?|procedures?)\\s+' +
  '(?:stays?|remain|is\\s+kept)\\s+intact' +
  '|\\breport\\s+(?:it|this)\\s+(?:honestly|accurately|through\\s+channels)',
  'i'
);

// 在评析这套话术本身
const META_EXEMPT_ZH = new RegExp(
  '(?:把|将|用)[^。，]{0,8}(?:担责|兜底|揽责|负责|扛责)[^。，]{0,10}' +
  '(?:劝|诱|换|换取|让|骗)[^。，]{0,4}(?:放弃|免于|不再|跳过)?[^。，]{0,6}' +
  '(?:核验|核查|复核|监督|追责|记录)' +
  '(?:是|属于|正是|是一种)'
);
const META_EXEMPT_EN = /\b(?:using|framing)\s+(?:full\s+)?liability\s+(?:absorption|acceptance)\s+to\s+(?:skip|bypass|avoid|excuse)\s+(?:verification|audit|oversight|checks?)\s+is\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkResponsibilityAbsolution(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：正当担责/流程保留/主动承担
  if (JUSTIFIED_ZH.test(text) || JUSTIFIED_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 路由①：责任全揽 × 劝阻核验同句共现
  const absorb = ABSORB_ZH.test(text) || ABSORB_EN.test(text);
  const dissuade = DISSUADE_ZH.test(text) || DISSUADE_EN.test(text);
  if (absorb && dissuade) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: isZh ? '责任打包让渡×劝阻核验(zh)' : 'liability-absorption×dissuasion(en)',
    };
  }

  // 路由②：显式让渡句式（责任与追责在我…）
  if (EXPLICIT_ZH.test(text) || EXPLICIT_EN.test(text)) {
    return {
      hit: true,
      score: 0.62,
      count: 1,
      detail: isZh ? '责任打包让渡×显式句式(zh)' : 'liability-absorption×explicit(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = { checkResponsibilityAbsolution };
