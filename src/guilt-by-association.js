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
    this.guidance = '关系人的问题不能算到他头上——「他朋友是骗子，他能好到哪去」是用关系代替证据的株连。评价一个人要看他本人的行为与记录；警惕、关注关联风险都可以，但定罪必须落在本人可验证的行为上。';
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

module.exports = { GuiltByAssociation, checkGuiltByAssociation, __internals: { REL_ZH, REL_EN, INFER_ZH, INFER_EN, META_NOUN, EVIDENCE_PRESENT, THIRD_PERSON_EXEMPT, GENETIC_BLOOD } };
