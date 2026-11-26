/**
 * src/norm-of-reciprocity.js — 「互惠规范论证（norm of reciprocity）」检测器
 * （provisional 第 295 个判别维度，r481 起草；src/index.js 接线由
 * 1 号主力补全，接线规格见 coordination/reports/r481-dimension-agent4.md
 * §五。编号 provisional 的原因同 r218-r480：远端已接线 293 维，
 * 另有若干已起草未接线维度占号，最终编号由 1 号按接线顺序在
 * VERIFY_DIMS 登记序重排）
 *
 * 立项实证（coordination/agent4/probes/r481-probe-pool.js，v6.8.239
 * gate() 全量 findings 实测）：候选池六家族穿透实测——A 互惠规范
 * 论证 4/10、B 默认/现状偏见 4/7、C 损失框架 2/5、D 权威从众 0/2
 * （存量已承重，对照组）、E 纯粹暴露 1/4、F 互惠-礼物义务 3/4。
 * 穿透 = gate.action === 'pass' 零维度承重。A+F 合计 7/14 穿透
 * 且语义同族（回报义务被当作论证理由），为候选池穿透最高且零
 * 误伤的组合（良性基线 14 条中仅 1 条被存量维度代拦、与本族无关）。
 * src/ 下 grep 无任何维度以「回报义务被当作论证理由」语义承重。
 *
 * 外部来源：GitHub 15 条（coordination/agent4/scout/github-repos-
 * 20261126-055137.json，SiliconWit/critical-thinking-engineers /
 * Frankweb33/brain-patch 等批判性思维库旁证互惠操纵条目）、
 * arXiv parse-fail、S2 空返——按空返处理，判据为心虫自有纯规则
 * 实现。家族定义取自社会心理学标准描述：norm of reciprocity /
 * 互惠规范——Gouldner 1960；Cialdini《影响力》把互惠列为首要
 * 说服原理：他人给予恩惠会激发回报义务感，而这一义务感可被
 * 用作要求对方同意无关请求的杠杆（free samples → contract /
 * 请客吃饭 → 答应请求）。
 *
 * 辨别的族：互惠规范论证——**恩惠事实**（腿①：他帮过我/提拔过
 * 我/送我礼物/请我吃饭/替我说过话/让着我/拉过我一把/covered my
 * shift/sponsored my promotion/gave us free samples/vouched for
 * me）与**回报义务断言**（腿②：于情于理必须/不好意思拒绝/没法
 * 说不/只能照办/说不过去/手短/就得给他办成/欠他的/我就得支持；
 * EN owe them/cannot refuse/must return the favor/deserves my
 * backing/have to support his proposal/saying no would be rude）
 * 双腿共现。同窗距离 ZH 60 / EN 160。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：回报是社会
 * 关系的正当润滑剂，但它不是论证。当「他帮过我」被用来替代对
 * 事情本身是非曲直的评估，论证的权重就从证据转移到了人情债务：
 * 结论之所以「必须支持」，理由不是方案正确而是欠了人情。这是
 * 一种**论题替换**——把「这件事对不对」偷换成「我还不还得了」。
 * 职场（报销签字/任务照办/提拔回报）、商业（免费样品换合同）、
 * 家庭与友谊（从小让着我→无法说不）中的「不好意思拒绝」「手
 * 短」「于情于理」都是典型形态。与正当表述有明确界线：感恩的
 * 表达（谢谢他当年的帮助）、按事情本身评估后的独立结论（决定
 * 还是要看事情对不对）、礼尚往来与互利合作（条款双方受益）、
 * 社会心理学的客观陈述（互惠规范是经典现象）——均豁免。
 *
 * 与既有维度的边界（r481 探针归因）：
 *   · social_norm（社会规范）管「群体压力/从众」方向；本族判
 *     「个体间人情债务置换证据权重」，无群体维度（探针样本
 *     「他上次帮了我那么大忙」存量 social_norm 代拦后仍 4/10
 *     穿透，证明存量不覆盖本族核心形）。
 *   · instrumental_reasoning（工具理性）管「手段-目的」方向；
 *     本族的「只能照办」是义务断言而非目的计算。
 *   · favor_ledger（人情账本，第 214 维）管「人情被当作可计量
 *     债务」的记账/清算方向；本族判「义务感本身被用作论证理由」，
 *     无记账/清算/量化语义（探针实测本族攻击穿透时 favor_ledger
 *     零 findings）。
 *   · sunk_cost_coercion / commitment_coercion 管沉没成本与承诺
 *     一致性方向；本族的恩惠来自他人而非自己过往投入。
 *   · appeal_to_pity（诉诸怜悯）管「同情换取同意」；本族是
 *     「已获得的恩惠换取同意」，时态与方向相反（过去给予 vs
 *     当下可怜）。
 *
 * 判据（双腿链共现，缺一不判）：
 *   ① 腿① FAVOR 恩惠事实——他人曾给予帮助/礼物/恩惠/提拔
 *      （帮过我/提拔过我/送我/请我吃/替我说/让着我/拉过我/
 *      罩着我；EN helped me/covered my shift/sponsored/gave us/
 *       took me out/vouched for me）；
 *   ② 腿② DUTY 回报义务断言——把恩惠转译为同意义务（于情于理
 *      必须/不好意思拒绝/没法说不/只能照办/说不过去/手短/就得
 *      给他办成/欠他的；EN owe them/cannot refuse/must return
 *      the favor/deserves my backing/have to support）；
 *   ③ 腿①×腿②同窗共现（ZH 60 / EN 160），双腿均查否定前缀
 *      （虽然帮过…但…不等于/不能因为…就/does not mean I owe/
 *      just because … does not mean）；
 *   ④ 豁免：感恩表达（谢谢他当年的帮助）、独立评估（决定还是
 *      看事情对不对/按价格和服务质量评）、礼尚往来与合作互利
 *      （条款双方受益）、客观陈述（互惠规范是经典现象）。
 *
 * 为什么取 VERIFY 级：单句可能只是人情往来的描述（「他帮过我，
 * 我记在心里」），也可能是把恩惠用作论证杠杆（「他帮过我，所以
 * 这个方案我必须支持」）。verify 的语义是「这段话以人情债务
 * 替代了对事情本身的评估，先核实结论是否另有独立依据，再决定
 * 是否采信」。
 */
'use strict';

// ─── 腿① 恩惠事实（中文）──────────────────────────────────────
const FAVOR_ZH = [
  // 「他/她 + 帮/提拔/拉 + 我」给予形
  /(?:他|她|对方|领导|同事|朋友|人家|他们)(?:们)?(?:以前|曾经|当年|上次|之前|从小|这些年|一向|向来|过去)?[^。，！？；\n]{0,10}(?:帮|帮过|帮助|拉过|提拔|罩着|罩过|提携|指点|照顾|让着|相让|送礼|送过|请客|请我|请过|替我说|为我说|说过话|撑腰|撑过|指路|搭把手|救过|资助|赞助)/,
  // 「替我」说话/美言形（替我说过话/替我跟领导说了话/替我说好话）
  /(?:替|为|帮)[^。，！？；\n]{0,6}(?:说|讲|提)(?:了|过|起)?[^。，！？；\n]{0,3}(?:好话|美言|话|情)/,
  // 「帮我/替我」直接形（主语省略）
  /(?:帮|帮过|帮助|拉过|拉了我|提拔|提携|罩|罩着|照顾|指点|让着|请|请过|请客|送|送过|给过|资助|赞助)[^。，！？；\n]{0,8}(?:我|咱|我们)/,
  // 「请你/请他吃饭」请客形（受事为第二三人称）
  /(?:请|请过|请客)[^。，！？；\n]{0,4}(?:你|您|他|她|咱|我们|他们)/,
  // 礼物/好处接收形（收了/拿了他的红包/礼物/好处）
  /(?:收|收下|接过|拿|拿过)[^。，！？；\n]{0,6}(?:他|她|对方|人家)(?:的)?[^。，！？；\n]{0,8}(?:红包|礼物|礼品|礼|好处|东西|购物卡|券|酒|茶叶)/,
  // 「手短」成语形（拿/收 + 人手短）
  /(?:拿|收|吃)[^。，！？；\n]{0,6}(?:的)?手短/,
  // 欠人情形
  /(?:欠|亏欠|承)[^。，！？；\n]{0,4}(?:他|她|对方|人家|他们的|她的|他的)?(?:人情|情|恩|恩惠|恩情)/,
];

// ─── 腿② 回报义务断言（中文）──────────────────────────────────
const DUTY_ZH = [
  // 「于情于理必须」义务前缀
  /(?:于情于理|按理|论理|冲着|看在)[^。，！？；\n]{0,12}(?:我)?(?:都)?(?:必须|应该|得|要|不能|没办法|只能够)/,
  // 「哪能不接」反问阻抗形（他怎么好意思/我哪能不/我怎么好）
  /(?:哪|怎么|如何)(?:能|敢|好)[^。，！？；\n]{0,6}(?:不|拒绝|推辞|说不)/,
  // 「不好意思拒绝」婉拒阻抗
  /(?:不好意思|不好|怎好|怎么好意思|怎好意思)[^。，！？；\n]{0,8}(?:拒绝|不签|说不|推|回绝|驳)/,
  // 「没法/无法说不」强阻抗
  /(?:根本|实在|真的|完全)?(?:没法|无法|不能|不可以|不好)[^。，！？；\n]{0,6}(?:说|讲)?(?:不|拒绝|推辞)/,
  // 「只能照办」服从形
  /(?:我)?(?:也|只)(?:能|好|只得|只好)[^。，！？；\n]{0,6}(?:照办|照做|听从|服从|答应|应下|接下来|接下来办|支持|同意|签|办|帮)/,
  // 「说不过去」道义债
  /(?:说不过去|过不去|不像话|不近人情|太说不过去)/,
  // 「说得过去吗」反问形（不回一份说得过去吗）
  /(?:说得过去|像话|像样)[^。，！？；\n]{0,4}(?:吗|么)/,
  // 「就得给他办成」义务结论
  /(?:就|也)(?:得|要|应该)[^。，！？；\n]{0,8}(?:给|替|为)(?:他|她|对方|人家)[^。，！？；\n]{0,4}(?:办|做|办成|搞定|解决)/,
  // 「欠他的」人情债务
  /(?:欠|亏)[^。，！？；\n]{0,3}(?:他|她|对方|人家)(?:的)?(?:人情|情|债|恩)/,
  // 「他开口我能说不吗」反问阻抗
  /(?:他|她|对方|人家)(?:们)?(?:开口|提出来|要求|开口求|说话)[^。，！？；\n]{0,8}(?:我)?(?:能|敢|好)[^。，！？；\n]{0,2}(?:说不|拒绝|不答应)/,
  // 「必须出手/必须支持」义务行动
  /(?:必须|一定|肯定|非得)[^。，！？；\n]{0,8}(?:出手|出面|支持|帮忙|帮这个|答应|同意|签|批)/,
];

// ─── 腿① 恩惠事实（英文）──────────────────────────────────────
const FAVOR_EN = [
  /\b(?:he|she|they|my\s+(?:mentor|boss|colleague|friend|supervisor|manager))\s+(?:\w+\s+){0,3}?(?:helped|covered|sponsored|vouched\s+for|gave|took\s+me|treated|mentored|backed|supported|recommended)\b[^.]{0,60}\b(?:me|us|my)\b/i,
  /\b(?:helped\s+me|helped\s+us|covered\s+my|vouched\s+for\s+me|gave\s+(?:me|us)|gave\s+us|treated\s+me|sponsored\s+my|mentored\s+me|backed\s+me)\b/i,
  /\b(?:did\s+me\s+a\s+(?:big\s+|huge\s+|great\s+)?favor|lent\s+(?:me|us)\s+a\s+hand|pulled\s+(?:me|us)\s+up|had\s+my\s+back)\b/i,
  /\bI\s+owe\s+(?:him|her|them)\s+one\b/i,
  /\b(?:free\s+samples?|generous\s+gift|bought\s+(?:me|us)\s+dinner|picked\s+up\s+the\s+(?:bill|tab))\b/i,
  /\b(?:took\s+(?:me|us)\s+(?:out\s+)?to\s+(?:dinner|lunch)|treated\s+(?:me|us)\s+to\s+(?:dinner|lunch))\b/i,
  /\b(?:he|she|they)\s+did\s+(?:me|us)\s+a\s+(?:big\s+|huge\s+|great\s+)?favor\b/i,
];

// ─── 腿② 回报义务断言（英文）──────────────────────────────────
const DUTY_EN = [
  /\b(?:so|therefore|thus|hence)\s+I\s+(?:have\s+to|must|need\s+to|cannot|can'?t|will)\s+(?:\w+\s+){0,4}?(?:support|back|approve|sign|help|refuse|return|repay|oblige)\b/i,
  /\bI\s+(?:have\s+to|must|need\s+to|will)\s+(?:\w+\s+){0,4}?(?:support|back|approve|sign)\s+(?:his|her|their)\s+(?:proposal|plan|request|idea|candidacy)\b/i,
  // 倒装：义务断言在前、恩惠在后（I must approve this — he did me a favor once）
  /\bI\s+(?:have\s+to|must|need\s+to)\s+(?:\w+\s+){0,3}?(?:approve|support|back|sign)\s+this\b[^.]{0,80}\b(?:he|she|they|the\s+\w+)\s+(?:\w+\s+){0,3}?(?:helped|gave|did\s+me|vouched|sponsored|covered|bought|treated)/i,
  /\b(?:cannot|can'?t|won'?t)\s+(?:\w+\s+){0,2}?refuse\b/i,
  /\b(?:owe|obligated|indebted)\s+(?:them|him|her)\s+(?:the|this|a|one|our)?\s*(?:contract|deal|favor|vote|support|approval)?/i,
  /\b(?:must|have\s+to|should)\s+(?:return|repay|reciprocate)\s+(?:the\s+)?favor\b/i,
  /\bdeserves?\s+my\s+(?:backing|support|vote|approval)\b/i,
  /\bsaying\s+no\s+would\s+be\s+(?:rude|ungrateful|wrong|inappropriate|impossible)\b/i,
  /\b(?:I|we)\s+(?:have\s+to|must)\s+(?:\w+\s+){0,4}?(?:no\s+matter\s+what|regardless)\b/i,
];

// ─── 距离窗 ───────────────────────────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免：感恩表达 / 独立评估 / 礼尚往来 / 客观陈述 ────────────
// 独立评估类豁免是核心：同一段文本里出现「但决定还是要看事情本身
// 对不对」式反转，即作者已明确按事情本身评估，本族不判。
const EXEMPT_ZH = /(?:谢谢|感谢|感恩|铭记|记在心里|记在心中)[^。，！？；\n]{0,20}(?:帮助|恩|人情|提携|照顾|礼物)|(?:但|但是|可是|不过|然而)[^。，！？；\n]{0,30}(?:看|按|以|依据|取决于)[^。，！？；\n]{0,10}(?:事情本身|是非|对错|曲直|价格|质量|证据|条款|数据|事实|表现|表现本身|本身对不对|优劣)/;
const EXEMPT_EN = /\b(?:thank(?:s|ful)\s+(?:him|her|them)\s+for|grateful\s+for|but\s+(?:the\s+)?decision\s+(?:should|must|depends)|based\s+on\s+(?:its\s+own\s+merits?|the\s+(?:evidence|facts|numbers|quality))|judge\s+(?:it|this)\s+on\s+its\s+merits?|not\s+a\s+reason\s+to\s+(?:approve|support))\b/i;

// ─── 否定守卫 ─────────────────────────────────────────────────
const NEG_BEFORE_ZH = /(?:不能|不可|不应|不该|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|说明不了|证明不了|尚待|还不能|并不会|不改变|不影响|从不|绝不|永不|坚决不|不觉得|没觉得|谈不上)[^。，！？；\n]{0,8}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;
const NEG_INSIDE_ZH = /(?:不能|不可|不应|不该|并不能|并未|并不是|不是|算不上|并非|不算|未必|不等于|不代表|说明不了|证明不了|尚待|还不能|并不会|不改变|不影响|绝不|永不|坚决不)/;
const NEG_BEFORE_EN = /\b(?:not|no|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|wasn'?t|weren'?t|won'?t|wouldn'?t|couldn'?t|shouldn'?t|mustn'?t|never|neither|nor|hardly|barely|far\s+from)\s+(\w+\s+){0,5}$/i;
const NEG_INSIDE_EN = /\bnot\s+(?:that|to\s+say|true\s+that)\b|\bhardly\b|\bbarely\b|\bfar\s+from\b|\bdoes\s+not\s+mean\b|\bjust\s+because\b[^.]{0,40}\bdoes\s+not\s+mean\b/i;

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

// 单条匹配是否有效（否定前缀/内部否定均拦下；ZH 与 EN 均查）
function matchAlive(text, x) {
  if (NEG_INSIDE_ZH.test(x.raw) || NEG_INSIDE_EN.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 10), x.idx);
  if (NEG_BEFORE_ZH.test(before) || IMMEDIATE_NEG_ZH.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 60), x.idx);
  return !NEG_BEFORE_EN.test(beforeEn);
}

// 去重叠（同族多模式命中同一片段只留最长/最先者）
function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// 收集某语言侧单腿的全部有效匹配
function collect(text, list) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x)) m.push(x);
  }
  return dedupeOverlap(m);
}

// 距离（不相邻区间间距；重叠返回 0）
function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 双腿链配对：FAVOR × DUTY
function pairLegs(text, favor, duty, win) {
  const fm = collect(text, favor);
  if (fm.length === 0) return [];
  const dm = collect(text, duty);
  const pairs = [];
  for (const f of fm) {
    for (const d of dm) {
      if (dist(f, d) > win) continue;
      pairs.push({ f, d });
    }
  }
  return pairs;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function checkNormOfReciprocity(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免：感恩表达/独立评估/礼尚往来/客观陈述
  if ((R.EXEMPT_ZH || EXEMPT_ZH).test(text) || (R.EXEMPT_EN || EXEMPT_EN).test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const langs = [
    { favor: R.FAVOR_ZH || FAVOR_ZH, duty: R.DUTY_ZH || DUTY_ZH, win: PAIR_ZH, lang: 'zh' },
    { favor: R.FAVOR_EN || FAVOR_EN, duty: R.DUTY_EN || DUTY_EN, win: PAIR_EN, lang: 'en' },
  ];
  const sigs = [];
  for (const L of langs) {
    for (const p of pairLegs(text, L.favor, L.duty, L.win)) {
      sigs.push({ lang: L.lang, favor: p.f.raw, duty: p.d.raw });
    }
  }
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.66 : 0.58;
  return {
    hit: true,
    dimension: 'norm_of_reciprocity',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '恩惠事实「' + x.favor + '」×回报义务断言「' + x.duty + '」'
      : 'favor "' + x.favor + '" x reciprocity-duty assertion "' + x.duty + '"')),
    details: s.lang === 'zh'
      ? '互惠规范论证(' + sigs.length + '处: 「' + s.favor + '」的恩惠被转译为「' + s.duty + '」的同意义务——以人情债务替代对事情本身的评估)(zh)'
      : 'norm of reciprocity(' + sigs.length + 'x: the favor "' + s.favor + '" is converted into the obligation "' + s.duty + '" — personal debt substitutes for evaluating the matter itself)(en)',
    guidance: '互惠规范论证指：把「回报义务」当作论证理由——因为对方给过我/帮过我/送过我，所以他的提议/要求/方案我必须支持、无法拒绝、只能照办。回报是社会关系的正当润滑剂，但它不是论证：用「欠他的」替代对事情本身是非曲直的评估，就是以人情债务置换证据权重，把「这件事对不对」偷换成「我还不还得了」（他上次帮了我那么大忙，这次他出事我于情于理必须出手 / 领导提拔过我，他安排的任务再不对我也只能照办 / 收了他的红包，这事儿就得给他办成 / The vendor gave us free samples, so we owe them the contract / My mentor sponsored my promotion, so his plan deserves my backing regardless）。请把结论的依据还给事情本身：方案的价格、质量、条款、证据与后果是什么；感恩可以另作表达（谢谢他当年的帮助），礼尚往来与互利合作也请按双方实际受益说明（条款对双方都有利），不要用人情债务替代论证。',
    tags: ['social-psychology', 'norm-of-reciprocity', 'reciprocity', 'obligation', 'favor', 'argumentation', 'cognitive-bias', 'judgment'],
  };
}

module.exports = {
  checkNormOfReciprocity,
  __internals: () => ({
    FAVOR_ZH, FAVOR_EN,
    DUTY_ZH, DUTY_EN,
    PAIR_ZH, PAIR_EN,
    EXEMPT_ZH, EXEMPT_EN,
  }),
};
