/**
 * src/one-sided-dismissal.js
 * [r167] 第 166 维度 one_sided_dismissal（让步消解：承认反面证据后不作权衡地
 * 扫掉，得出单边结论）。
 *
 * 形态：先让步承认反面证据存在，再用一个总体性短语把它不作量化权衡地扫到
 * 一边，直接收尾到单边结论——
 *   「这个药虽然有副作用，但临床试验显示它利远大于弊，所以值得推广。」
 *   「当然反对者也能举出一些反例，但主流数据都站在我们这边。」
 *   「他确实犯过错，但这不能掩盖他取得的巨大成就。」
 *   「Side effects exist, but the benefits overwhelmingly outweigh the risks.」
 *   「Critics can point to failures, yet the data overwhelmingly supports it.」
 *
 * 判据（双腿共现，缺一不判）：
 *   腿① CONCESSION 让步承认——让步标记（虽然/尽管/固然/诚然/不可否认/必须
 *       承认/当然/ admittedly/although/though/while/granted）须与**反面证据
 *       词**（副作用/风险/反例/批评/质疑/缺陷/过错/失败/争议/代价…）同现；
 *       让步标记单独出现（「虽然明天下雨，但还是出发吧」）不判。
 *   腿② DISMISSAL 消解短语——瑕不掩瑜/不能掩盖/利远大于弊/总体而言/归根结
 *       底/主流/大势所趋/实践证明/ overwhelmingly/outweighs/on balance 等
 *       总体性扫荡短语之一。消解短语把已承认的反面证据不作权衡直接扫掉。
 *
 * 与 false_balance 的关系：false_balance 管「把一边倒的说成势均力敌」（平
 * 衡伪造），本族管「把势均力敌/有真实反面证据的说成一边倒」（单边论证）——
 * 同一枚硬币的两面，都违背证据呈现的对称性纪律。
 *
 * 守卫常量（全部可被负例注入置空，见 test/round-167-one-sided-dismissal.js）：
 *   BALANCED_QUANT 双方量化——让步分句与消解短语前后均出现具体数字，是真实
 *                  的利益-风险权衡（「副作用发生率2%，但有效率达85%」）
 *   MITIGATION     处置措施——消解后接具体控制手段（可以监测/及时调整/有对
 *                  策/停药即可），是真实的工程/医学权衡
 *   META_CONCEPT   谬误概念转述（选择性证据/单边论证/cherry picking/false
 *                  balance/论证谬误）——在讨论这个概念本身
 *   TEACH          教学转述（教材/课堂/textbook/lecture）
 *
 * 决策出处：heartflow_philosophy_decision（r167，type=accelerate /
 * confidence 0.7 / priority 40）。候选池来自 /tmp/r167-probe2.js 在当前
 * v6.8.94 / 165 维引擎实测：让步消解族 8 条攻击样本真零命中 8/8（同池另两
 * 个候选族：不可证伪断言 6/8、自选择样本 3/6）；误拦样本库
 * （gate-benchmark / extended / vertical-benign / benign-mixed 共 326 条）
 * 让步句密度 1/326 且无消解短语，风险可控。
 */
'use strict';

// [r215] 保守预检 + 构造缓存（见 src/regexp-utils.js 头部的保守性证明）
const { getRegExp, escapeRe, screenLiteral } = require('./regexp-utils.js');

// ── 腿①：让步标记 ────────────────────────────────────────────
const CONCESSION_ZH = [
  '虽然', '尽管', '固然', '诚然', '不可否认', '无法否认', '必须承认', '谁也无法否认',
  '没人能否认', '不容否认', '确实也', '确实', '当然', '诚然有', '毋庸讳言', '平心而论',
];
const CONCESSION_EN = [
  'although', 'though', 'while', 'granted', 'admittedly', 'whilst',
  'it is true that', 'no doubt', 'to be sure', 'of course',
  'critics', 'critic', 'skeptics', 'sceptics', 'detractors', 'opponents',
  'dissenting', 'dissent', 'there are concerns', 'concerns remain', 'concerns about',
  // 裸承认句式：there are X / X exist（X 须同时是反面证据词，腿②消解短语仍须在场）
  'there are', 'there is', 'exist', 'exists', 'are present',
];

// 反面证据词（裸名词形态——不加后缀；161 轮教训：只收带后缀词形会漏裸名词句）
const COUNTER_EVIDENCE_ZH = [
  '问题', '副作用', '风险', '反例', '不足', '批评', '质疑', '反对', '局限', '缺陷',
  '错误', '过错', '失败', '争议', '漏洞', '弊端', '代价', '教训', '异议', '杂音',
  '反对意见', '不同意见', '警告', '阴影', '污点', '硬伤', '短板', '隐患', '乱象',
  '负面影响', '不良反应', '后遗症', '反弹', '损耗', '牺牲', '流失', '受损', '损害',
  '伤害', '冲击', '反对声', '质疑声', '嘘声', '质疑者', '反对者',
];
const COUNTER_EVIDENCE_EN = [
  'side effect', 'side-effect', 'risk', 'risks', 'criticism', 'critique', 'concern',
  'concerns', 'objection', 'objections', 'failure', 'failures', 'flaw', 'flaws',
  'drawback', 'drawbacks', 'limitation', 'limitations', 'downside', 'downsides',
  'problem', 'problems', 'issue', 'issues', 'controversy', 'backlash', 'doubt',
  'doubts', 'error', 'errors', 'mistake', 'mistakes', 'harm', 'cost', 'costs',
  'dissenting', 'dissent', 'voices', 'complaint', 'complaints', 'grievance',
  'grievances', 'caveat', 'caveats', 'shortcoming', 'shortcomings',
];

// ── 腿②：消解短语（总体性扫荡，把已承认的反面证据不作权衡扫掉）────────
const DISMISSAL_ZH = [
  '瑕不掩瑜', '不能掩盖', '无法掩盖', '难以掩盖', '不足以掩盖', '掩盖不了',
  '利远大于弊', '利大于弊', '得远大于失', '得不偿失', // 得不偿失是反向结论，也属总体扫荡
  '总体而言', '总体看', '总的来说', '总的来看', '整体而言', '整体来看',
  '归根结底', '说到底', '毕竟', '终究',
  '主流', '大势所趋', '大势所趋', '大方向是对的', '方向是对的', '方向没错',
  '成绩是主要的', '问题是次要的', '矛盾是次要', '支流', '小节', '白璧微瑕',
  '不能过分强调', '不必苛求', '无可厚非', '情有可原', '也是可以理解的',
  '实践证明', '事实证明', '历史会证明', '时间会证明', '事实俱在',
  '一边倒', '压倒性', '绝大多数人', '绝大多数', '一片叫好', '普遍点赞',
];
const DISMISSAL_EN = [
  'overwhelmingly', 'overwhelming', 'outweighs', 'outweigh', 'outweighed',
  'on balance', 'pales in comparison', 'does not negate', 'does not diminish',
  'cannot undo', 'far outweigh', 'sides overshadowed', 'on the whole',
  'by and large', 'in the final analysis', 'ultimately', 'the bigger picture',
  'the main thing', 'broadly speaking', 'for the most part', 'consensus is clear',
  'vast majority', 'overall', 'on net', 'net positive', 'net benefit',
];

// ── 守卫 ──────────────────────────────────────────────────────
// 强消解短语：扫荡力度最强的表述（命中加 8 分）
const STRONG_DISMISSAL = ['瑕不掩瑜', '不能掩盖', '无法掩盖', '难以掩盖', '不足以掩盖', '掩盖不了',
  '利远大于弊', '大势所趋', '实践证明', '事实证明', '历史会证明', '时间会证明',
  'overwhelmingly', 'outweighs', 'outweigh', 'outweighed', 'pales in comparison', 'does not negate'];
// 双方量化：让步/消解前后均出现具体数字——真实权衡的信号
const BALANCED_QUANT_NUM = /\d+(?:\.\d+)?\s*(?:%|％|个百分点|个点|倍|万人|亿人|元|美元|例|人|年|个月|小时|percent|per\s?cent|percentage\s?points?|x|times?)/i;

// 处置措施：消解后接具体控制手段——真实工程/医学权衡的信号
const MITIGATION_ZH = [
  '可以监测', '能够监测', '监测下', '及时调整', '调整剂量', '可以控制', '可控',
  '有对策', '有配套', '缓解措施', '应对措施', '预防措施', '处理方案', '补救',
  '停药', '减量', '遵医嘱', '定期复查', '随访', '有边界', '有前提', '有约束',
  '分情况', '因人而异', '具体看', '分开讨论', '区分对待', '有止损', '设上限',
];
const MITIGATION_EN = [
  'can be monitored', 'monitored', 'managed', 'manageable', 'controlled',
  'mitigated', 'mitigation', 'dose adjustment', 'with monitoring', 'reversible',
  'has safeguards', 'safeguards', 'guardrails', 'contingency', 'remedy',
  'follow-up', 'with limits', 'under supervision', 'case by case',
];

// 概念/教学转述——在讨论「选择性证据」这个概念本身
const META_CONCEPT = [
  '选择性证据', '单边论证', '单方面论证', '一边倒', '报喜不报忧', '挑有利的说',
  '只说好的', '隐瞒不利', '掩盖反方', 'cherry pick', 'cherry-pick', 'cherry picking',
  'one-sided', 'false balance', ' fallacy', '谬误', '论证谬误', '逻辑谬误',
  'survivorship bias', '幸存者偏差',
];
const TEACH = ['教材', '课本', '课堂', '课件', '课程', '讲义', '老师讲', '教授在',
  'textbook', 'lecture', 'lesson', 'course material', 'classroom', 'syllabus'];

function _hasAny(text, list) {
  for (const w of list) if (text.includes(w)) return w;
  return null;
}

// EN 侧词边界匹配（避免 'while' 命中 'meanwhile'、'overall' 命中 'overalls'）
// [r215] 保守预检：list 是模块级常量词表。screenLiteral 用无边界字面合并
// alternation 做一次判定——它是比 includes 和 \bword\b 都宽的条件，任何
// 原判定命中都必然覆盖（含 'wait is true that' 含 'it is true that' 这类
// 词首紧贴字母的子串命中）。预检不命中 ⇒ 整个循环必然返回 null，跳过。
function _hasAnyEN(text, list) {
  const low = text.toLowerCase();
  if (!screenLiteral(list, low)) return null;
  for (const w of list) {
    if (w.includes(' ') || w.includes('-')) {
      if (low.includes(w)) return w;
    } else {
      const re = getRegExp('\\b' + escapeRe(w) + '\\b', 'i');
      if (re.test(low)) return w;
    }
  }
  return null;
}

function _exempt(reason, word) {
  return { score: 0, verdict: 'pass', exempt: true, exempt_reason: reason + ':' + word, count: 0, detail: '', hits: [], strength: 'none' };
}

function _pass() {
  return { score: 0, verdict: 'pass', exempt: false, exempt_reason: null, count: 0, detail: '', hits: [], strength: 'none' };
}

function checkOneSidedDismissal(text) {
  const t = typeof text === 'string' ? text : '';
  if (!t.trim()) return _pass();

  // 全文级守卫（顺序：概念/教学 → 双方量化 → 处置措施）
  for (const m of META_CONCEPT) { if (t.toLowerCase().includes(m)) return _exempt('META_CONCEPT', m); }
  for (const m of TEACH) { if (t.includes(m)) return _exempt('TEACH', m); }

  // 腿①：让步标记 × 反面证据词（须同现）
  const concZH = _hasAny(t, CONCESSION_ZH);
  const concEN = _hasAnyEN(t, CONCESSION_EN);
  const conc = concZH || concEN;
  if (!conc) return _pass();
  const ceZH = _hasAny(t, COUNTER_EVIDENCE_ZH);
  const ceEN = _hasAnyEN(t, COUNTER_EVIDENCE_EN);
  const ce = ceZH || ceEN;
  if (!ce) return _pass();

  // 腿②：消解短语
  const disZH = _hasAny(t, DISMISSAL_ZH);
  const disEN = _hasAnyEN(t, DISMISSAL_EN);
  const dis = disZH || disEN;
  if (!dis) return _pass();

  // 守卫：双方量化（让步分句与消解短语前后都有具体数字）→ 真实权衡
  const nums = t.match(new RegExp(BALANCED_QUANT_NUM.source, 'gi')) || [];
  if (nums.length >= 2) return _exempt('BALANCED_QUANT', nums.slice(0, 2).join(' / '));

  // 守卫：消解前后接处置措施（全文检查——处置声明常出现在消解短语之前：
  // 「医生可以监测肝功能，总体而言利远大于弊」）→ 真实权衡
  const mitZH = _hasAny(t, MITIGATION_ZH);
  const mitEN = _hasAnyEN(t, MITIGATION_EN);
  if (mitZH || mitEN) return _exempt('MITIGATION', (mitZH || mitEN));

  // 计分：双腿齐备基础分，按消解短语强度加成
  const disIdx = t.indexOf(dis);
  let score = 72;
  if (STRONG_DISMISSAL.some(s => t.includes(s))) score += 8;
  if (/[。；;]\s*[^。；;]*(所以|因此|足以证明|说明|可见|这就证明|so |therefore|thus )/i.test(t.slice(disIdx))) score += 4; // 消解后接单边结论收尾
  score = Math.min(score, 90);

  const detail = '让步消解（承认反面证据后不作权衡地扫掉）1处：先以「' + conc + '」承认「' + ce +
    '」，再用「' + dis + '」将其不作量化权衡地扫到一边，收尾到单边结论——反面证据需要的是权衡与处置，不是一句总体性概括';
  return {
    score,
    verdict: score >= 70 ? 'unsupported' : 'pass',
    exempt: false,
    exempt_reason: null,
    count: 1,
    detail,
    hits: [{ concession: conc, counter: ce, dismissal: dis }],
    strength: score >= 84 ? 'high' : score >= 70 ? 'medium' : 'none',
  };
}

module.exports = {
  checkOneSidedDismissal,
  __internals: {
    CONCESSION_ZH, CONCESSION_EN,
    COUNTER_EVIDENCE_ZH, COUNTER_EVIDENCE_EN,
    DISMISSAL_ZH, DISMISSAL_EN,
    STRONG_DISMISSAL,
    MITIGATION_ZH, MITIGATION_EN,
    META_CONCEPT, TEACH,
  },
};
