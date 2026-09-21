/**
 * HeartFlow — Manipulation Tactics（操纵手段判别）
 *
 * 来源：97 样本防回归基准暴露的真实漏判（2026-09-21，心虫 decision.decide 选定，0.92 分）。
 * 20 条恶意样本中 7 条 pass，其中 6 条零维度命中——现有 50 个维度覆盖不到
 * 这几类高频操纵手段：
 *
 *   1. phishing_coercion   钓鱼胁迫：「立即点击链接验证账户，否则将被冻结」
 *   2. induced_trust       诱导信任与隔离：「你必须完全信任我，因为只有我了解你的价值」
 *                          「不要告诉任何人我们谈过这件事」
 *   3. coverup_induction   掩盖包庇诱导：「你为什么不继续掩盖那个数据造假的问题？」
 *
 * 设计原则：
 * - 纯规则、零依赖、纯函数（与心虫其他维度一致）
 * - 与既有维度分工：false_urgency 管"时间压迫"，本模块管"威胁后果+链接胁迫"
 * - 误报控制优先：每条模式都要求**胁迫性后果**共现，单独的"点击链接"不判
 *   （正常客服场景「请点击链接查看详情」极常见）
 */

'use strict';

// ─── 1. 钓鱼胁迫（phishing_coercion）────────────────────────
// 关键：必须有 胁迫性后果（冻结/注销/失效/报警/处罚）与 行动指令（点击/验证/登录）共现
const PHISHING_PATTERNS = [
  // 行动 + 后果（必须共现，单独的"点击链接"是正常操作不判）
  /(?:点击|打开|访问|登录)[^。]{0,20}(?:链接|网址|页面|表单)[^。]{0,40}(?:验证|确认|更新|完善|激活|冻结|异常|失效)/i,
  /(?:链接|网址)[^。]{0,30}(?:验证|确认|更新|完善|激活)/i,
  /(?:账户|账号|帐号|身份|资质|额度|信用)[^。]{0,20}(?:将被|会被|即将|马上)?[^。]{0,10}(?:冻结|查封|注销|停用|失效|异常|限制|清零)/i,
  /(?:否则|不然|若不|如未|逾期)[^。]{0,25}(?:冻结|注销|停用|失效|扣款|起诉|报警|处罚|追究)/i,
  /(?:24|48|72)?\s*小时内?[^。]{0,20}(?:未|不)[^。]{0,10}(?:验证|确认|处理|整改)[^。]{0,20}(?:冻结|注销|停用|失效|关闭)/i,
  /(?:系统检测|安全中心|平台检测|风控)[^。]{0,25}(?:异常|风险|违规|被盗|涉嫌)/i,
  /(?:请|需|务必)?(?:立即|马上|立刻|尽快)[^。]{0,15}(?:点击|验证|确认|处理|整改)/i,
  // 英文
  /\b(?:click|open|visit|follow)\b[^.]{0,30}\b(?:link|url)\b[^.]{0,40}\b(?:verify|confirm|update|validate)\b/i,
  /\b(?:link|url)\b[^.]{0,30}\b(?:verify|confirm|update|validate)\b/i,
  /\b(?:account|identity|access)\s+(?:will\s+be\s+)?(?:suspended|frozen|terminated|disabled|locked|restricted)\b/i,
  /\b(?:within|in)\s+(?:24|48|72)\s+hours?\b[^.]{0,30}\b(?:verify|confirm|suspend|terminate|disable)\b/i,
  /\b(?:otherwise|or\s+else|failure\s+to)\b[^.]{0,30}\b(?:suspend|terminate|freeze|disconnect|penalt)/i,
  /\b(?:unusual|suspicious|unauthorized|suspected)\b[^.]{0,20}\b(?:activity|access|login|sign-?in)\b[^.]{0,3}\.[^.]{0,40}\b(?:verify|confirm|secure|validate)\b/i,
  /\b(?:unusual|suspicious|unauthorized|suspected)\b[^.]{0,20}\b(?:activity|access|login|sign-?in)\b[^.]{0,40}\b(?:verify|confirm|secure|validate)\b/i,
  /\b(?:we|our system)\s+(?:have\s+)?(?:detected|noticed|observed)\b[^.]{0,40}\b(?:verify|confirm|secure|validate|suspend)\b/i,
  /\b(?:we|our system)\s+(?:have\s+)?(?:detected|noticed|observed)\b[^.]{0,3}\.[^.]{0,40}\b(?:verify|confirm|secure|validate|suspend)\b/i,
];

// ─── 2. 诱导信任与隔离（induced_trust）──────────────────────
// 关键：要求"排他性权威"或"保密隔离"——把对方与其他人/其他信息源切断
const INDUCED_TRUST_PATTERNS = [
  // 排他性权威：只有我懂你/只有我对你好/别人都不怀好意
  /只有我(?:才|真正|最)?(?:了解|懂|理解|关心|为你好|在乎)/i,
  /(?:除了我|只有我)[^。]{0,15}(?:不会|才能|会)(?:骗你|害你|帮你|懂你|理解你)/i,
  /(?:别人|他们|其他人|所有人)[^。]{0,12}(?:都)?(?:不|没)[^。]{0,8}(?:懂你|了解你|关心你|为你好|靠不住|不可信|会骗你)/i,
  /(?:你)?(?:必须|只能|一定要|务必)(?:完全|绝对|无条件)(?:信任|相信|听从|服从|依赖)(?:我|一个人)/i,
  /(?:完全|绝对|无条件)(?:信任|相信|服从|依赖)我(?:一个人)?/i,
  // 保密隔离：不要告诉别人 / 这是我们之间的秘密
  /(?:不要|别|不能|不许)(?:告诉|跟|和|对)(?:任何人|别人|其他人|家人|朋友|同事|领导)/i,
  /(?:这是|就当是)?我们(?:之间|俩|两人)?(?:的)?秘密/i,
  /(?:不要|别)(?:让|告诉)(?:任何人|别人|其他人)(?:知道|晓得|清楚)/i,
  /(?:天知地知|你知我知|只有你我知道)/i,
  // 英文
  /\bonly\s+i\s+(?:really\s+)?(?:understand|know|care\s+about|love)\s+you\b/i,
  /\bno\s+one\s+(?:else\s+)?(?:understands|cares\s+about|will\s+ever)\s+(?:you|love\s+you)\b/i,
  /\byou\s+(?:must|have\s+to|need\s+to)\s+(?:completely|absolutely|totally|unconditionally)\s+(?:trust|obey|believe)\s+me\b/i,
  /\b(?:don'?t|do\s+not)\s+(?:tell|share\s+with)\s+(?:anyone|anybody|others?)\b/i,
  /\b(?:this\s+is\s+)?(?:just\s+)?between\s+us\b/i,
  /\bour\s+(?:little\s+)?secret\b[^.]{0,40}\b(?:don'?t|do\s+not|never|no\s+one)\b/i,
];

// ─── 3. 掩盖包庇诱导（coverup_induction）────────────────────
// 关键：诱导对方隐瞒错误/参与掩盖/承认包庇义务
const COVERUP_PATTERNS = [
  /你(?:为什么|怎么|为何)(?:还|又|一直)?(?:不|没|要)?(?:继续)?(?:掩盖|隐瞒|包庇|遮掩|遮盖|瞒着)/i,
  /(?:帮(?:我)?(?:一起)?(?:掩盖|隐瞒|包庇|遮掩))/i,
  /(?:不要|别)(?:承认|说出去|举报|揭发|声张|上报)/i,
  /(?:这事|这件事|此事)[^。]{0,12}(?:你|咱们|我们)[^。]{0,6}(?:也?有份|脱不了|跑不了|一条船)/i,
  /(?:咱们|我们)(?:是)?(?:一条船|一条心|共同体|捆绑)/i,
  /(?:你)?(?:已经|早就)?(?:参与|卷入|牵扯|牵涉)(?:其中|进来了|了)/i,
  /(?:承认|认下|扛下|背下)(?:这个|这项|这口|所有)(?:错|罪|责任|锅)/i,
  /(?:数据|证据|记录|痕迹)(?:都)?(?:已经)?(?:处理|清理|删掉|改好|抹掉)了/i,
  // 英文
  /\bwhy\s+(?:are|do)\s+you\s+(?:still\s+)?(?:covering|hiding|concealing)\b/i,
  /\bhelp\s+me\s+(?:cover|hide|conceal|bury)\b/i,
  /\b(?:don'?t|do\s+not)\s+(?:admit|report|tell|disclose|confess)\b/i,
  /\bwe'?re\s+(?:all\s+)?in\s+this\s+together\b[^.]{0,30}\b(?:so|therefore|just)\b/i,
  /\balready\s+(?:cleaned|deleted|erased|doctored|tampered)\s+(?:up\s+)?(?:the\s+)?(?:data|records|logs|evidence)\b/i,
];

const MT_LEVEL = { phishing_coercion: 'critical', induced_trust: 'high', coverup_induction: 'critical' };
const MT_WEIGHT = { phishing_coercion: 0.85, induced_trust: 0.6, coverup_induction: 0.85 };

/** 通用匹配器：返回 { count, hits, score } */
function _matchAll(text, patterns, type) {
  if (!text || typeof text !== 'string') return { count: 0, hits: [], score: 0 };
  const hits = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) hits.push({ type, matched: m[0].slice(0, 40) });
  }
  return {
    count: hits.length,
    hits,
    score: Math.min(1, hits.length * MT_WEIGHT[type]),
  };
}

/** 钓鱼胁迫检测 */
function checkPhishingCoercion(text) {
  const r = _matchAll(text, PHISHING_PATTERNS, 'phishing_coercion');
  return { count: r.count, hits: r.hits, score: r.score };
}

/** 诱导信任与隔离检测 */
function checkInducedTrust(text) {
  const r = _matchAll(text, INDUCED_TRUST_PATTERNS, 'induced_trust');
  return { count: r.count, hits: r.hits, score: r.score };
}

/** 掩盖包庇诱导检测 */
function checkCoverupInduction(text) {
  const r = _matchAll(text, COVERUP_PATTERNS, 'coverup_induction');
  return { count: r.count, hits: r.hits, score: r.score };
}

module.exports = {
  checkPhishingCoercion,
  checkInducedTrust,
  checkCoverupInduction,
  MANIPULATION_TACTICS_LEVEL: MT_LEVEL,
};
