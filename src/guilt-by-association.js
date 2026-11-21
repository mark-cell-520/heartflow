/**
 * [r724] 第 154 维度 guilt_by_association（连坐定罪：关系人的问题算到他头上）。
 *
 * 形状：关系链（朋友/前任/亲戚/同乡/互关/待过/关注列表……）在场的句子里，
 * 把关系人身上的污名直接转移到此人身上（一路货色/干净不了/能好到哪去/
 * cannot be trusted……）。落点是**株连推断**——因为关系人坏，所以此人坏。
 * 与存量维度的分工：genetic_fallacy 第 131 维管「血统/出身决定论」（龙生龙/
 * 根正苗红/born into），本族管「关系人连坐」（他朋友是骗子），两者在
 * GENETIC_BLOOD 豁免上显式 carve-out；triangulation 管拉第三方进场施压，
 * 本族管污名沿关系链转移；hasty_generalization 管样本不足的归纳，
 * 本族管零证据的株连。
 *
 * 判据两条路由任一成立（缺腿不判）：
 *   R1 中文：腿①关系链词（朋友/前任/亲戚/同乡/互关/关注/待过/共事/
 *      团队/公司/老乡/出身……）× 腿②株连推断（好到哪去/一路货色/
 *      干净不了/也不是什么好人/能信吗/一伙的/防着点/就有问题……）。
 *      「他朋友的问题归他朋友，我们看他本人的记录」只有关系语境无
 *      株连推断，是正当就事论事，不判。
 *   R2 英文：腿①（brother/friend/ex-/used to work/follows/
 *      associated with/from the same……）× 腿②（must be one too/
 *      cannot be trusted/no better/one of them/just as bad/
 *      cut from the same cloth……）。
 *      污名标签（criminal/cheater……）单独在场不判——事实陈述
 *      「His brother is a criminal」没有株连推断，不判。
 *
 * 豁免（四常量，负例注入逐承重）：
 *   META_NOUN：连坐/株连/guilt by association 等概念词——样本在解释
 *      概念而不是运用连坐，不判。
 *   EVIDENCE_PRESENT：靠证据/按事实/单独看/个案/责任自负/就事论事；
 *      EN: not evidence/own record/due process/individually——样本
 *      在讲反连坐的正当程序，不判。
 *   THIRD_PERSON_EXEMPT：老师/教材/课堂/教授；EN: textbook/lecture/
 *      professor——教学转述语境，不判。
 *   GENETIC_BLOOD：血统/出身/基因/龙生龙/根正苗红/门第/将门；
 *      EN: bloodline/noble blood/born into/pedigree——血统决定论
 *      归 genetic_fallacy 管，本维度显式让位。
 *
 * 2026-10-25 decision 本体一次选中无打平（scripts/decide-r724.js，
 * composite 0.85 / confidence 0.82 / identity alignment 0.8；第二名
 * A relative_privation 0.83）。r724 探测器实测：攻击漏判 11/12（92%）
 * 全池最高、真零命中 11/11、误伤 0/8。
 *
 * ── r446 扩族（v6.8.221）──────────────────────────────────────────
 * 新增「被动连坐」句式族（真升级②：既有维度全新句式族）：
 *   存量 INFER_ZH 是**主动断言形**（「他也不是好人」直判），新族是
 *   **否定式清白不可能**——不直接定罪，而把「证明清白的不可能」强加给
 *   关系人（洗不清/脱不了干系/撇不清关系/屁股不干净/跑不掉/说不清白/
 *   有何清白可言）。修辞更隐蔽、舆论场更常见。探针实证（r446-a）：
 *   ZH 侧 8/8 零命中（gate=pass），EN 侧被动连坐已被 fallacy_of_relevance
 *   拦下（rewrite）——按射程分工纪律 EN 侧不重复建设，本轮只补 ZH 族。
 *   判据（三腿共现，缺一不判）：
 *     腿① 关系链：REL_ZH 存量 ∪ PASSIVE_REL_EXTRA（老板/上司/领导/
 *         熟人/故交/世交/走得近/那种人……被动连坐族专属关系指称）
 *     腿② 清白不可能：PASSIVE_INFER_RE（14 条正则，覆盖否定式/疑问
 *         反问式/名词化三类形态，含 r161 教训的裸名词自查）
 *     腿③ 反连坐豁免：PASSIVE_REBUTTAL（不等于参与/证据链/分别认定/
 *         本人行为……良性样本在场即不判）
 *   变体矩阵（r446-b3）：攻击 17/17 命中、良性 0/15 误伤。
 */
'use strict';

// 腿①：关系链词（ZH）——含少量「来源」词（出身/门第），由 GENETIC_BLOOD 豁免兜底 carve-out
const REL_ZH = [
  '朋友', '好友', '哥们', '兄弟', '前任', '亲戚', '亲属', '爸爸', '妈妈', '爸妈', '爸', '妈',
  '同乡', '老乡', '互关', '关注列表', '待过', '共事', '团队', '公司', '上班',
  '室友', '同学', '邻居', '合伙人', '发小', '闺蜜', '师兄', '师弟', '师姐', '师妹',
  '同事', '老家', '出身', '门第', '一起长大', '一个宿舍', '合租', '吃过饭',
];
// 腿①：关系链词（EN）
const REL_EN = [
  'brother', 'sister', 'father', 'mother', 'dad', 'mom', 'son', 'daughter',
  'friend', 'bestie', 'ex-boyfriend', 'ex-girlfriend', 'ex-wife', 'ex-husband',
  'ex-partner', 'ex-boss', 'neighbor', 'colleague', 'coworker', 'teammate',
  'classmate', 'roommate', 'relative', 'uncle', 'aunt', 'cousin',
  'used to work', 'worked with', 'works with', 'associated with',
  'follows', 'following', 'hangs out', 'from the same town', 'same company',
  'grew up with', 'went to school with', 'old boss', 'old company',
];

// [r446] 腿①扩展：被动连坐族关系指称——存量 REL_ZH 不收权威/亲缘/近距
// 关系人称（老板/上司/熟人/世交/走得近……），被动连坐高频形「他和那老板
// 一个圈子」「跟那种人走得太近」整族漏判（r446-a 探针 8/8 零命中）。
const PASSIVE_REL_EXTRA = [
  '混过', '一伙', '那伙', '那帮', '圈子', '勾连', '过从甚密', '沾亲带故', '打过交道',
  '老相识', '老板', '上司', '领导', '下属', '熟人', '故交', '旧识', '私交', '交情',
  '那种人', '那些人', '这帮人', '走的太近', '走得太近', '走得近', '亲近', '过密',
  '同桌', '同窗', '同门', '世交', '沾亲', '带故', '裙带', '瓜葛',
];

// [r446] 腿②扩展：否定式清白不可能（被动连坐推断族）。
// 与存量 INFER_ZH 的分工：存量是主动断言形（直判「不是好人」），
// 本表是把「无法自证清白」强加给关系人的修辞形——不直接定罪而让
// 对方「说不清」，14 条正则覆盖三类形态：
//   A 否定/疑问式清白不可能（不干净/没多干净/怎么可能干净）
//   B 清白动作否定（洗不清/撇不清/说不清白/脱不了干系）
//   C 名词化反问（屁股不干净/有何清白可言/能跑得掉吗）
const PASSIVE_INFER_RE = [
  /(?:洗|撇|摘|说|讲|解释|推|脱|染|辩|开|洗刷)[得]?不[清白楚]/,
  /说[得]?清[吗呢]?[？?]?$/,
  /(?:不|没|未|未必)(?:么|可能|能)?(?:会)?(?:有)?(?:多)?(?:会)?(?:干净|清白)/,
  /(?:怎|哪)(?:么|可能|能)?(?:会)?(?:有)?(?:多)?(?:会)?(?:干净|清白)/,
  /(?:(?:怎|哪)(?:么|可能|能)?(?:会)?(?:有)?(?:多)?(?:干净|清白)|(?:能|可)(?:会)?(?:有)?多(?:么)?(?:干净|清白))/,
  /(?:有|谈)(?:何|什么)(?:干净|清白)?可言/,
  /(?:干净|清白)(?:不到|不了|谈不上|无从|不可)/,
  /(?:干净|清白)到哪[里去]/,
  /(?:脱|逃|跑)(?:不|没)(?:了|得)?(?:干系|其咎|责任)/,
  /(?:能|可)?(?:脱|逃|跑)得了?(?:干系|其咎|责任|关系)/,
  /难逃(?:干系|其咎|责任)|难辞其咎|置身事外|脱不了关系|撇不清关系|说不清白/,
  /[好强](?:不到|不了|谈不上)哪[里去]/,
  /[好强]到哪[里去]/,
  /(?:跑|逃)(?:不|没)(?:得)?(?:掉|了)/,
  /(?:能|可)?(?:跑|逃)得(?:掉|了)/,
];

// [r446] 腿③：反连坐正当程序豁免——良性样本（不等于参与/证据链/分别
// 认定/本人行为……）在场即不判，与存量 EVIDENCE_PRESENT 互补：
// EVIDENCE_PRESENT 管「讲反连坐原则」，本表管「讲本案程序事实」。
const PASSIVE_REBUTTAL = [
  '不等于参与', '不能因此定罪', '与本人无关', '证据链', '按证据', '依据证据',
  '根据证据', '逐条核查', '本人记录', '本人行为', '本人言行', '就事论事',
  '责任自负', '各自承担', '分别认定', '单独认定', '另案处理', '洗清了', '证明清白',
];

// 腿②：株连推断短语（ZH）——污名标签单独在场不判，必须与腿①共现
const INFER_ZH = [
  '好到哪去', '好不到哪去', '一路货色', '一路人', '干净不了', '有多干净',
  '也不是什么好人', '不是好人', '能是什么好人', '能信吗', '还能信',
  '一伙的', '一伙', '防着点', '防着', '也好不了', '好不了', '离远点',
  '不可信', '别信他', '就有问题', '本身就有问题', '都不是好东西',
  '能是什么好东西', '强不到', '强不了哪去', '脱不了干系', '一模一样',
  '一个样', '同一路', '根上坏', '随根', '带坏',
];
// 腿②：株连推断短语（EN）
const INFER_EN = [
  'must be one too', 'must be just like', 'must be guilty', 'cannot be trusted',
  "can't be trusted", 'not to be trusted', 'no better than', 'one of them',
  'just as bad', 'guilty too', 'same kind of person', 'cut from the same cloth',
  'just like them', 'stay away from', 'as well', 'one too', 'tainted as well',
  'guilt by association',
];

// 豁免常量
const META_NOUN = [
  '连坐', '株连', '连坐效应', 'guilt by association', 'association fallacy',
];
const EVIDENCE_PRESENT = [
  '靠证据', '不是证据', '按事实', '单独看', '个案', '责任自负', '就事论事',
  '本人的记录', '本人行为', '逐条核查',
  'not evidence', 'own record', 'due process', 'individually', 'on his own',
  'on her own', 'judged by actions',
];
const THIRD_PERSON_EXEMPT = [
  '老师', '教材', '课本', '课堂', '教授', '讲师', '讲义',
  'textbook', 'lecture', 'professor', 'in class', 'the course',
];
const GENETIC_BLOOD = [
  '血统', '基因', '龙生龙', '凤生凤', '根正苗红', '书香门第', '将门', '血脉',
  'bloodline', 'noble blood', 'born into', 'pedigree', 'of good stock',
];

/**
 * 连坐定罪判定。
 * @param {string} text 规范化后的文本
 * @returns {{score:number,count:number,matches:Array,zeroHit:boolean,details:string}}
 */
function checkGuiltByAssociation(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '' };
  }

  const lower = text.toLowerCase();
  const isZh = /[\u4e00-\u9fff]/.test(text);

  const has = (arr, s) => arr.some((w) => s.includes(w));
  if (has(META_NOUN, text) || has(META_NOUN, lower)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '概念词豁免' };
  }
  if (has(EVIDENCE_PRESENT, text) || has(EVIDENCE_PRESENT, lower)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '证据语境豁免' };
  }
  if (has(THIRD_PERSON_EXEMPT, text) || has(THIRD_PERSON_EXEMPT, lower)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '第三人称教学转述豁免' };
  }
  if (has(GENETIC_BLOOD, text) || has(GENETIC_BLOOD, lower)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '血统决定论让位 genetic_fallacy' };
  }
  // [r446] 反连坐正当程序豁免（腿③）——存量四豁免之后判定，良性程序陈述不判
  if (has(PASSIVE_REBUTTAL, text)) {
    return { score: 0, count: 0, matches: [], zeroHit: false, details: '反连坐程序豁免' };
  }

  const matches = [];
  const routes = new Set();

  // R1 中文：关系链词 × 株连推断
  if (has(REL_ZH, text) && has(INFER_ZH, text)) {
    routes.add(1);
    matches.push({ route: 1, legA: '关系链', legB: '株连推断' });
  }

  // R2 英文：relation chain × guilt-transfer inference
  if (has(REL_EN, lower) && has(INFER_EN, lower)) {
    routes.add(2);
    matches.push({ route: 2, legA: 'relation chain', legB: 'guilt transfer' });
  }

  // [r446] R3 中文被动连坐：关系链指称（存量 ∪ 扩展）× 否定式清白不可能。
  // 与 R1 射程分工：R1 存量 INFER_ZH 是主动断言形（直判人品），本族把
  // 「无法自证清白」强加给关系人；腿②用正则（含疑问反问与名词化形）。
  if (has(REL_ZH, text) || has(PASSIVE_REL_EXTRA, text)) {
    for (let i = 0; i < PASSIVE_INFER_RE.length; i++) {
      if (PASSIVE_INFER_RE[i].test(text)) {
        routes.add(3);
        matches.push({ route: 3, legA: '关系链指称', legB: '清白不可能', pattern: 'PASSIVE_INFER_RE[' + i + ']' });
        break;
      }
    }
  }

  if (matches.length === 0) {
    return { score: 0, count: 0, matches: [], zeroHit: true, details: '' };
  }

  const routeCount = routes.size;
  const score = Math.min(90, 60 + matches.length * 8 + (routeCount > 1 ? 6 : 0));
  const details = isZh
    ? '连坐定罪(' + matches.length + '处: 关系人的问题被株连到此人身上)'
    : 'guilt by association(' + matches.length + ' occurrences: blame transferred via association)';
  return { score, count: matches.length, matches, zeroHit: false, details };
}

class GuiltByAssociation {
  constructor() {
    this.dimension = 'guilt_by_association';
    this.detail = '连坐定罪';
    this.guidance = '关系人的问题不能算到他头上——「他朋友是骗子，他能好到哪去」是用关系代替证据的株连。评价一个人要看他本人的行为与记录；警惕、关注关联风险都可以，但定罪必须落在本人可验证的行为上。把「证明清白的不可能」强加给对方（洗不清、脱不了干系、屁股不干净）同样是株连——清白不需要自证，举证责任在指控方。';
  }

  reset() {
    this.count = 0;
    this.hits = [];
    this.empties = [];
    this.claims = [];
    this.signals = [];
  }

  analyze(text) {
    this.reset();
    if (typeof text !== 'string') return this;
    const r = checkGuiltByAssociation(text);
    if (r.count > 0) {
      this.count = r.count;
      this.hits.push(r.details);
      this.claims.push('连坐定罪');
      this.signals.push({ dimension: 'guilt_by_association', severity: r.score, details: r.details, matches: r.matches });
    } else {
      this.empties.push(r.details || '');
    }
    return this;
  }

  get score() {
    return this.count >= 1 ? 78 : 0;
  }
}

module.exports = { GuiltByAssociation, checkGuiltByAssociation, __internals: { REL_ZH, REL_EN, INFER_ZH, INFER_EN, META_NOUN, EVIDENCE_PRESENT, THIRD_PERSON_EXEMPT, GENETIC_BLOOD, PASSIVE_REL_EXTRA, PASSIVE_INFER_RE, PASSIVE_REBUTTAL } };
