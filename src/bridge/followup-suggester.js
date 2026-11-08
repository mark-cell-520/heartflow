/**
 * FollowupSuggester — 追问建议器 v1.0
 *
 * 一次交互结束时，**该问什么**往往比「已经说了什么」更决定下一轮质量。
 * 本模块从心虫判定（gate/findings）和用户输入本身推导出该追问的问题：
 * 需要取证就问要不要先补证据，前提可疑就问前提，问题太泛就问具体场景。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:674 的内联 stub 让
 *   dispatch('agentLayer.followupSuggester') 恒返回 []
 *   （scripts/tmp-250-probe.js 实测）。该路由在 src/mcp-server.js:1058 的
 *   agentLayer 能力清单里广告出去。本文件补真实实现。
 *
 * 设计纪律：
 *   1. 每个建议都带 from（哪条判据触发的）与 reason，可审计；
 *   2. 没有判据可依时返回空数组 + basedOn:[] —— 不为了「有产出」硬编问题；
 *   3. 参数顺序宽容：(heartflow, userText) 与 (userText, heartflow) 都认。
 */

'use strict';

// 判据 → 追问。priority 越大越该先问。
const RULES = [
  {
    id: 'needs_verification', priority: 90,
    when: (j, text) => j.action === 'verify',
    question: '这里有关键结论还缺证据，需要我先去取证再继续吗？',
    reason: (j) => `gate.action=verify：${j.reason || '有待验证断言'}`,
  },
  {
    id: 'needs_rewrite', priority: 85,
    when: (j) => j.action === 'rewrite',
    question: '我上一条表述有问题，要我按 guidance 重说一遍吗？',
    reason: () => 'gate.action=rewrite：当前输出不可直接交付',
  },
  {
    id: 'premise_doubt', priority: 80,
    when: (j) => j.action === 'block' || /(premise|前提)/.test((j.dimensions || []).join(',')),
    question: '你这个问题的前提本身可能需要先确认，要我先核一遍前提吗？',
    reason: () => '前提审核有异议：前提不成立时答案再对也没用',
  },
  {
    id: 'unsupported_claim', priority: 70,
    when: (j) => (j.dimensions || []).includes('unsupported_claim'),
    question: '刚才那个数字/结论的来源是什么？我给不出处的话只能标成待验证。',
    reason: () => 'findings 命中 unsupported_claim：关键数字无来源',
  },
  {
    id: 'contradiction', priority: 68,
    when: (j) => (j.dimensions || []).includes('contradiction'),
    question: '这两处说法不一致，以哪一个为准？',
    reason: () => 'findings 命中 contradiction：需要用户裁决',
  },
  {
    id: 'vagueness', priority: 60,
    when: (j) => (j.dimensions || []).includes('vagueness'),
    question: '能说得更具体一点吗？比如场景、时间范围或对象。',
    reason: () => 'findings 命中 vagueness：问题过泛，答案必然过泛',
  },
  {
    id: 'multi_topic', priority: 50,
    when: (j, text) => typeof text === 'string' && /(还有|另外|顺便|以及|同时)/.test(text) && (text.match(/(?:\?|？|。)/g) || []).length >= 2,
    question: '你这里有好几件事，要先处理哪一件？',
    reason: () => '输入含多话题标记：一次只推进一件更可靠',
  },
  {
    id: 'missing_specifics', priority: 40,
    when: (j, text) => typeof text === 'string' && /(?:\?|？|吗|怎么|如何|为什么)/.test(text)
      && !/(?:\d|[零一二三四五六七八九十百千万亿]+\s?[个位条篇页字行天次年月])/.test(text),
    question: '能补一个具体的例子或数字吗？有实例我能答得准很多。',
    reason: () => '是疑问句但没有任何数量/实例信息',
  },
  {
    id: 'low_confidence', priority: 35,
    when: (j) => typeof j.score === 'number' && j.score < 0.5,
    question: '这一轮我的把握不大，你是想让我继续猜，还是先把不确定的点列出来？',
    reason: (j) => `overallScore=${j.score}：低于 0.5 时应先暴露不确定点`,
  },
];

// 从任意形状里挖心虫判定
function readJudgment(hf) {
  if (!hf || typeof hf !== 'object') return { action: null, dimensions: [], score: null, reason: null, found: false };
  const gate = hf.gate && typeof hf.gate === 'object' ? hf.gate : null;
  const judgment = hf.judgment && typeof hf.judgment === 'object' ? hf.judgment : null;
  const action = (gate && gate.action) || (judgment && judgment.action) || hf.action || null;
  const score = typeof hf.overallScore === 'number' ? hf.overallScore
    : (typeof judgment?.score === 'number' ? judgment.score : null);
  const dimensions = Array.isArray(hf.findings)
    ? hf.findings.map((f) => f && f.dimension).filter(Boolean)
    : [];
  return {
    action,
    dimensions,
    score,
    reason: (gate && gate.reason) || (judgment && judgment.reason) || null,
    found: !!(action || dimensions.length || score !== null),
  };
}

class FollowupSuggester {
  /**
   * @param {object} [opts]
   * @param {number} [opts.max] 最多给几条追问（默认 3）
   */
  constructor(opts = {}) {
    this._max = Number.isFinite(opts.max) ? opts.max : 3;
  }

  /**
   * @param {object|string} heartflow 心虫结果/引擎（或用户文本，顺序宽容）
   * @param {string|object} [userText] 用户输入（或心虫结果）
   * @returns {{questions:Array<{question:string,reason:string,priority:number,from:string}>,
   *            count:number,basedOn:string[],source:string|null}}
   */
  suggest(heartflow, userText) {
    // 顺序宽容：谁像判定结果谁当 heartflow
    let hf = heartflow;
    let text = userText;
    if (typeof heartflow === 'string' && userText && typeof userText === 'object') {
      hf = userText; text = heartflow;
    }

    const j = readJudgment(hf);
    const basedOn = [];
    const out = [];

    if (j.found) {
      for (const r of RULES) {
        let hit = false;
        try { hit = r.when(j, typeof text === 'string' ? text : ''); } catch (e) { hit = false; }
        if (!hit) continue;
        basedOn.push(r.id);
        out.push({ question: r.question, reason: r.reason(j), priority: r.priority, from: r.id });
      }
    } else if (typeof text === 'string' && text.trim().length > 0) {
      // 没有心虫判定时，只从文本本身推（并如实登记判据缺失）
      for (const r of RULES) {
        let hit = false;
        try { hit = r.when({ action: null, dimensions: [], score: null }, text); } catch (e) { hit = false; }
        if (!hit) continue;
        basedOn.push(r.id + '(text-only)');
        out.push({ question: r.question, reason: r.reason({}), priority: r.priority, from: r.id });
      }
    }

    // 去重 + 按优先级降序 + 截断
    const seen = new Set();
    const questions = out
      .sort((a, b) => b.priority - a.priority)
      .filter((q) => {
        const key = q.question;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, this._max);

    return {
      questions,
      count: questions.length,
      basedOn,
      source: questions.length ? 'followup-suggester' : null,
    };
  }
}

module.exports = { FollowupSuggester, RULES };
