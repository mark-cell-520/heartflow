/**
 * QualityFilter — 回应质量过滤器 v1.0
 *
 * 在回应离开交流层之前做一次**规则级质检**：绝对化措辞、无来源数字、
 * AI 写作腔、复读句、空话占比。它是 output-gate 的交流层前置版——
 * gate 管「这话对不对」，本模块管「这话说得好不好、像不像人说的」。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:672 的内联 stub 让
 *   dispatch('agentLayer.qualityFilter') 恒返回 {}
 *   （scripts/tmp-250-probe.js 实测）。该路由在 src/mcp-server.js:1058 的
 *   agentLayer 能力清单里广告出去。本文件补真实实现。
 *
 * 设计纪律：
 *   1. 每条 issue 带 rule/severity/detail/guidance，可审计、可逐条修；
 *   2. 注入 gate 探针时**真去问 gate**（findings 合并进来），没注入就明说
 *      integrated:false —— 不拿「我没查」冒充「查过了没问题」；
 *   3. pass 的判据是 score>=0.6 且无 severity>=8 的硬问题，不是「没抛异常」。
 */

'use strict';

// 质检规则族。severity 1-10：>=8 属硬问题（直接不过），其余按权重扣分。
const RULES = [
  {
    rule: 'empty', severity: 10, weight: 1,
    test: (t) => t.trim().length === 0,
    detail: () => '回应为空',
    guidance: '没有可发送的内容；先补内容或明确告知「无法回答」',
  },
  {
    rule: 'too_short', severity: 5, weight: 0.25,
    test: (t) => t.trim().length > 0 && t.trim().length < 8,
    detail: (t) => `回应仅 ${t.trim().length} 字，信息量不足`,
    guidance: '补上关键结论或前提，一句话也要说明白是哪一句',
  },
  {
    rule: 'absolute_claim', severity: 8, weight: 0.3,
    test: (t) => /(毫无疑问|绝对|毋庸置疑|百分百|100%|一定能够|必然|永远|唯一正确|板上钉钉)/.test(t),
    detail: (t) => `绝对化措辞 ${(t.match(/(毫无疑问|绝对|毋庸置疑|百分百|100%|一定能够|必然|永远|唯一正确|板上钉钉)/g) || []).length} 处`,
    guidance: '改为「在…条件下」「大概率」等可证伪表述；绝对化断言需给证据',
  },
  {
    rule: 'unsourced_number', severity: 6, weight: 0.25,
    // 有数字/百分比/年份，但整段没有任何来源或依据标记
    test: (t) => /(\d+(?:\.\d+)?\s?[%％]|\d{4}\s?年|\d+\s?(?:万|亿))(?![\d.])/.test(t)
      && !/(根据|来源|依据|引自|参见|数据显示|据统计|http|报告|论文|实测|官方)/.test(t),
    detail: (t) => `出现 ${(t.match(/(\d+(?:\.\d+)?\s?[%％]|\d{4}\s?年|\d+\s?(?:万|亿))(?![\d.])/g) || []).length} 个无来源数字`,
    guidance: '给每个关键数字补来源；给不出来源就降级为「约」「我记不准」',
  },
  {
    rule: 'ai_tell', severity: 5, weight: 0.2,
    test: (t) => /(综上所述|总而言之|希望对你有帮助|让我们|值得注意的是|首先，|其次，|最后，|作为 ?AI|希望这能)/.test(t),
    detail: (t) => `AI 写作腔标记 ${(t.match(/(综上所述|总而言之|希望对你有帮助|让我们|值得注意的是|首先，|其次，|最后，|作为 ?AI|希望这能)/g) || []).length} 处`,
    guidance: '删掉模板腔；直接说事，不要「首先/其次/综上所述」三件套',
  },
  {
    rule: 'hedge_absent', severity: 6, weight: 0.25,
    // 下了判断却全程没有任何不确定性标记
    test: (t) => /(是|会|能|应该|必须|证明|导致)/.test(t)
      && !/(可能|大概|也许|估计|不确定|尚待|待验证|取决于|我记不准|待确认)/.test(t)
      && t.length > 40,
    detail: () => '通篇判断无一处不确定性标记',
    guidance: '给关键判断加「在…条件下」；至少标出哪一条是待验证的',
  },
  {
    rule: 'duplicate_sentence', severity: 6, weight: 0.25,
    test: (t) => {
      const s = t.split(/[。！？!?；;\n]+/).map((x) => x.trim()).filter((x) => x.length >= 6);
      return new Set(s).size < s.length;
    },
    detail: () => '存在重复句（同义句出现两次以上）',
    guidance: '合并重复表述；复读不会让结论更可信',
  },
  {
    rule: 'overlong_sentence', severity: 4, weight: 0.15,
    test: (t) => t.split(/[。！？!?；;\n]+/).some((s) => s.trim().length > 120),
    detail: () => '存在超过 120 字的单句',
    guidance: '拆句；一句一个意思',
  },
  {
    rule: 'no_fallback', severity: 7, weight: 0.3,
    test: (t) => /(我不知道|无法回答|没有相关信息)/.test(t) && t.trim().length > 60,
    detail: () => '说了「不知道」却又输出了大段内容（无兜底的空转）',
    guidance: '要么给出可执行的下一步（去哪查/问谁），要么直接收口',
  },
];

class QualityFilter {
  /**
   * @param {object} [opts]
   * @param {Function} [opts.gate] 心虫门禁探针 (text) => gate 结果；注入后
   *        filter() 会把 gate 的 findings 合并进 issues（真集成而非装饰）。
   * @param {number} [opts.passThreshold] 通过分数线（默认 0.6）
   */
  constructor(opts = {}) {
    this._gate = typeof opts.gate === 'function' ? opts.gate : null;
    this._passThreshold = Number.isFinite(opts.passThreshold) ? opts.passThreshold : 0.6;
  }

  /**
   * 质检一段待发送文本。
   * @param {string} text
   * @returns {{pass:boolean,score:number,threshold:number,issues:Array,integrated:boolean,
   *            source:string|null}}
   */
  filter(text) {
    if (typeof text !== 'string') {
      return { pass: false, score: 0, threshold: this._passThreshold, issues: [{ rule: 'not_text', severity: 10, detail: '输入不是字符串', guidance: '传待质检的文本' }], integrated: !!this._gate, source: null };
    }

    const issues = [];
    let penalty = 0;
    for (const r of RULES) {
      let hit = false;
      try { hit = r.test(text); } catch (e) { hit = false; }
      if (!hit) continue;
      issues.push({ rule: r.rule, severity: r.severity, detail: r.detail(text), guidance: r.guidance });
      penalty += r.weight;
    }

    // gate 集成：注入探针就真去问，把 findings 折算成扣分
    let gateAction = null;
    if (this._gate) {
      try {
        const g = this._gate(text);
        if (g && g.gate && g.gate.action) {
          gateAction = g.gate.action;
          if (g.gate.action === 'block') { penalty += 1; issues.push({ rule: 'gate_block', severity: 10, detail: `心虫门禁判定 block：${g.gate.reason || ''}`, guidance: '按 gate.reason 处理，不要发送' }); }
          else if (g.gate.action === 'rewrite') { penalty += 0.5; issues.push({ rule: 'gate_rewrite', severity: 8, detail: '心虫门禁判定 rewrite', guidance: '按 findings[].guidance 改写后再发' }); }
          else if (g.gate.action === 'verify') { penalty += 0.2; issues.push({ rule: 'gate_verify', severity: 5, detail: '心虫门禁判定 verify', guidance: '先取证再发送' }); }
          const fs = Array.isArray(g.findings) ? g.findings : [];
          for (const f of fs.slice(0, 5)) {
            issues.push({ rule: 'gate:' + (f.dimension || 'unknown'), severity: Math.max(1, Math.min(10, Math.round((f.severity || 50) / 10))), detail: f.details || '', guidance: f.guidance || '' });
          }
        }
      } catch (e) { /* 探针失败不影响本模块自身结论，但不冒充集成成功 */ }
    }

    const hard = issues.filter((i) => i.severity >= 8);
    const score = Math.max(0, Math.round((1 - penalty) * 1000) / 1000);
    return {
      pass: score >= this._passThreshold && hard.length === 0,
      score,
      threshold: this._passThreshold,
      issues: issues.sort((a, b) => b.severity - a.severity),
      integrated: !!this._gate && gateAction !== null,
      gateAction,
      source: 'quality-filter',
    };
  }
}

module.exports = { QualityFilter, RULES };
