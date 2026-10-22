/**
 * src/overclaim-checker.js — AGI 第 1 层：完成态过度宣称检测器
 *
 * 定位：补心虫六个既有检测器都抓不到的一条具体缺口——
 *   「把部分进展说成已完全解决」的完成态过度宣称。
 *
 * 实测缺口（2026-10-08，~/heartflow 本机）：
 *   「纳维-斯托克斯方程已被 AI 彻底解决」这句话在
 *   think()(0.4) / discriminate()(判可信放行) / checkAbsoluteClaim(0命中中文)
 *   / checkCapabilityOverclaim(0命中) / verify()(不含可验证声明)
 *   / checkPerfectError(pass) 上全部零命中或反向输出。
 *   而 OpenAI 的真实状态是：仅覆盖 Clay 官方 C/D（带外力）情形，
 *   A/B 仍未解、Clay 未认证、OpenAI 自己不申领奖金。
 *
 * 设计原则：
 *   1. 零 LLM、纯规则，与心虫其余模块同风格
 *   2. 只判"表述形态"，不判事实真假——它不知道 Navier-Stokes 是什么，
 *      它只认识"完全/彻底/现已关闭"这类无保留完成态 + 缺少限定条件
 *   3. 有完整限定条件时归零，避免误伤真实的部分进展陈述
 *   4. 与既有的 perfect-error / verifier 不冲突：本模块是它们的补充，
 *      不改它们的任何行为
 *
 * 判定逻辑：
 *   A. 抽取出含"完成态动词"的宣称（解决/攻破/关闭/攻克/破解 + 完成态副词）
 *   B. 检查同句是否存在限定标记（仅/只覆盖/部分/仍未/未认证/尚未/在…情形下）
 *   C. 无限定的完成态宣称 → 标记 overclaim；有限定 → 放行
 *   D. 多句堆叠完成态（三条以上）→ 升级为 systemic
 *
 * 输出面向 caller：cron 报告、gate、知识库审计。
 *   不含任何"这句话是假的"的结论——只给"这句话的表述形态是无保留完成态，
 *   需 caller 自行核实其限定条件"。
 */

'use strict';

// ─── 完成态动词：宣称某件事已经结束 ────────────────────────────
const COMPLETION_VERBS = [
  // 中文
  '已解决', '已攻克', '已破解', '已解出', '已完全解决', '已彻底解决',
  '彻底解决', '完全解决', '已经解决', '攻克了', '破解了',
  '现已关闭', '问题已关闭', '已经关闭', '就此关闭', '尘埃落定',
  '已经完成', '已完成', '成功解决', '宣告解决',
  '已被解决', '被完全解决', '获得完全解决',
  // 英文
  'has been solved', 'has solved', 'is now closed', 'is closed',
  'has been cracked', 'cracked the', 'has been completely solved',
  'problem is solved', 'fully solved', 'completely solved',
  'definitively solved', 'settled once and for all',
];

// ─── 完成态副词/形容词：与动词叠加时加重无保留程度 ──────────────
const COMPLETION_INTENSIFIERS = [
  '完全', '彻底', '全部', '整体', '一举', '根本性', '决定性',
  'completely', 'entirely', 'totally', 'fully', 'definitively',
  'once and for all', 'for good',
];

// ─── 限定标记：出现即说明说话人自己划定了边界，是真话 ────────────
const QUALIFIERS = [
  '仅', '只覆盖', '只限于', '只是', '仅为', '仅限于',
  '部分', '局部', '某个', '某种', '一种', '之一',
  '仍未', '尚未', '还未', '没有', '未获', '未通过', '未认证', '未经',
  '有待', '待验证', '需验证', '需进一步', '尚需',
  '情形下', '条件下', '前提下', '在此情况',
  '不构成', '不等于', '并非', '而不是',
  'pending', 'not yet', 'remains', 'still open', 'partially',
  'only', 'in the case of', 'under the assumption', 'subject to',
];

// ─── 权威主体：宣称里点名了谁，用于 caller 追溯 ──────────────────
const SUBJECT_HINTS = [
  'AI', 'OpenAI', 'Anthropic', 'Google', 'DeepMind', '模型', '智能体',
  '算法', '系统', '研究团队', '科学家',
];

// ─── 服务流程语境：对对话方陈述当前工单/会话状态，不是对客观事实的断言 ──
// [2026-10-10 修复] 双向门禁实测误拦：客服标准结束语「问题已解决，请问还有
// 其他可以帮您？」被判完成态宣称。判据：句中含指向对话方的服务标记
// （帮您/为您/请问/还有什么/随时/感谢您的理解/此类表达），说明这是流程陈述
// 而非「某科学难题已攻克」那类对可验证事实的无保留断言。
// 与 QUALIFIERS 的区别：QUALIFIERS 是说话人自己划定的边界，这里是**语境本身
// 就是流程对话**，不需要额外限定词。
const SERVICE_CONTEXT_ZH = [
  '请问', '帮您', '为您', '还有什么', '随时', '感谢您的', '不好意思',
  '给您带来', '麻烦您', '请稍等', '正在为您', '已为您',
];
const SERVICE_CONTEXT_EN = [
  'how may i help', 'anything else', 'is there anything', 'let me know if',
  'thank you for your', 'sorry for the', 'please hold', 'assisting you',
  'i can help you', 'help you with', 'at your service',
];

/** 判断单句是否为服务流程语境（对对话方的状态陈述） */
function isServiceContext(sentence) {
  const lower = sentence.toLowerCase();
  if (SERVICE_CONTEXT_ZH.some(m => sentence.includes(m))) return true;
  return SERVICE_CONTEXT_EN.some(m => lower.includes(m));
}

/**
 * [2026-10-10 修复] 跨句服务语境：切句后服务标记常落在**相邻句**——
 * 「The issue is now closed. / Is there anything else I can help you with?」
 * 完成态在第一句，服务标记在第二句。单句判定抓不到，于是把客服标准结束语
 * 误判成完成态宣称（双向门禁实测误拦 1 条）。
 * 判据：本句或任一相邻句（前后各 1 句）含服务标记 → 同一轮对话的服务语境。
 * 窗口取 1 句是保守边界——跨 2 句以上就与"前面在聊技术、这里突然说已解决"
 * 无法区分，那种情况应继续判 overclaim。
 */
function isServiceContextNearby(sentence, allSentences, index) {
  if (isServiceContext(sentence)) return true;
  for (const offset of [-1, 1]) {
    const j = index + offset;
    if (j < 0 || j >= allSentences.length) continue;
    if (isServiceContext(allSentences[j])) return true;
  }
  return false;
}

/** 句子切分：中英文混排安全 */
function splitSentences(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[。！？.!?;；])\s*/)
    .map(s => s.trim())
    .filter(Boolean);
}

/** 判断单句是否含限定标记 */
function hasQualifier(sentence) {
  const lower = sentence.toLowerCase();
  return QUALIFIERS.some(q => lower.includes(q.toLowerCase()));
}

/** 从单句中抽取所有完成态命中 */
function extractCompletionHits(sentence) {
  const lower = sentence.toLowerCase();
  const hits = [];
  for (const verb of COMPLETION_VERBS) {
    if (lower.includes(verb.toLowerCase())) {
      hits.push({ pattern: verb, kind: 'verb' });
    }
  }
  return hits;
}

/**
 * 主入口：检测完成态过度宣称
 * @param {string} text
 * @returns {{
 *   count: number,          含完成态宣称且无限定的句子数
 *   systemic: boolean,      是否三条以上堆叠
 *   level: string,          'clean' | 'flag' | 'systemic'
 *   claims: Array<{sentence, patterns, intensifiers, subject}>,
 *   qualified: Array<{sentence, patterns}>,  有限定故放行的
 *   summary: string
 * }}
 */
function checkOverclaim(text) {
  const empty = {
    count: 0, systemic: false, level: 'clean', claims: [], qualified: [],
    summary: '未检测到完成态过度宣称',
  };
  if (!text || typeof text !== 'string') return empty;

  const sentences = splitSentences(text);
  const claims = [];
  const qualified = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const hits = extractCompletionHits(s);
    if (!hits.length) continue;

    const lower = s.toLowerCase();
    const intensifiers = COMPLETION_INTENSIFIERS.filter(i =>
      lower.includes(i.toLowerCase()));
    const subjects = SUBJECT_HINTS.filter(x =>
      lower.includes(x.toLowerCase()));

    const entry = {
      sentence: s.slice(0, 160),
      patterns: hits.map(h => h.pattern),
      intensifiers,
      subject: subjects,
    };

    if (hasQualifier(s)) {
      entry.reason = '句中含限定标记，按真话放行';
      qualified.push(entry);
    } else if (isServiceContextNearby(s, sentences, i)) {
      // [2026-10-10 修复] 服务流程语境（含相邻句）：对对话方陈述工单/会话
      // 状态，不是对客观事实的完成态断言（「问题已解决，请问还有其他可以帮您？」）
      entry.reason = '服务流程语境，对对话方的状态陈述而非事实断言';
      qualified.push(entry);
    } else {
      entry.reason = intensifiers.length
        ? '完成态动词与无保留副词叠加，无限定标记'
        : '完成态动词出现，无限定标记';
      claims.push(entry);
    }
  }

  const count = claims.length;
  const systemic = count >= 3;

  let level = 'clean';
  if (systemic) level = 'systemic';
  else if (count >= 1) level = 'flag';

  const summary = count === 0
    ? '未检测到完成态过度宣称'
    : `${count} 句完成态宣称缺少限定条件${systemic ? '，且多句堆叠，属系统性夸大' : ''}`;

  return { count, systemic, level, claims, qualified, summary };
}

module.exports = { checkOverclaim, COMPLETION_VERBS, QUALIFIERS };
