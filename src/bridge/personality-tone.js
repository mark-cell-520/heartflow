/**
 * PersonalityTone — 人格语气调节器 v1.0
 *
 * 同一件事，语气错了意思就错了。本模块按调用方给定的人格档位
 * （warmth / formality / brevity）对文本做**规则级语气修订**：
 * 该软的软、该砍的砍、该去模板腔的去模板腔，并且每条改动都可回查。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:701 的内联 stub 让
 *   dispatch('personaCore.personalityTone') 恒返回 ''
 *   （scripts/tmp-250-probe.js 实测：任意输入都返回空字符串）。该路由在
 *   src/mcp-server.js:1060 的 personaCore 能力清单里广告出去。本文件补真实实现。
 *
 * 设计纪律：
 *   1. 不替调用方造词——greeting/closing 只在调用方显式提供时才加，
 *       引擎自己不编问候语；
 *   2. alignmentBefore / alignmentAfter 是实测数字，让「语气更贴档了」可度量；
 *   3. 没有档位信息（ctx 空）时用中性档，且 profile.source 标 'default'。
 */

'use strict';

// 人格预设：给定 persona 时的一组默认档位值
const PERSONA_PRESETS = {
  plain: { warmth: 0.3, formality: 0.2, brevity: 0.8 },
  warm: { warmth: 0.8, formality: 0.3, brevity: 0.4 },
  professional: { warmth: 0.4, formality: 0.9, brevity: 0.6 },
  concise: { warmth: 0.2, formality: 0.3, brevity: 1.0 },
};

const NEUTRAL = { warmth: 0.5, formality: 0.5, brevity: 0.5 };

// 语气违例探针：用于算 alignment 分（每命中一类扣一次）
const VIOLATION_PROBES = [
  { key: 'warmth', re: /(你必须|你得|赶紧|必须马上|不对|错了|别告诉我|废话)/g, weight: 1 },
  { key: 'brevity', re: /(其实|基本上|说实话|真的|非常|总的来说|总而言之|值得一提的是)/g, weight: 1 },
  { key: 'aiTell', re: /(综上所述|总而言之|希望对你有帮助|让我们|作为 ?AI|值得注意的是)/g, weight: 1 },
  { key: 'formality', re: /(咋|搞不定|弄一下|哥们儿|玩意儿|牛哇)/g, weight: 1 },
  { key: 'absolute', re: /(毫无疑问|绝对|百分百|100%|一定能够|必然|板上钉钉)/g, weight: 1 },
];

// 修订规则：按 apply 顺序执行。cond 决定这条在当前档位下是否生效。
const RULES = [
  {
    // 结尾客套在任何档位下都是噪音——包括正式档
    id: 'closing_tell_strip', label: '去结尾客套',
    cond: () => true,
    re: /(希望对你有帮助[！!]?|希望这能帮到你[！!]?|如果还有问题欢迎随时问我[。！!]?)/g,
    to: '',
  },
  {
    // 篇章标记（综上所述/首先其次）在正式档位下是合法书面语，只在中低正式度时砍
    id: 'discourse_marker_strip', label: '去 AI 模板腔',
    cond: (p) => p.formality < 0.7,
    re: /(综上所述，?|总而言之，?|让我们一起来看看|值得注意的是，?)/g,
    to: '',
  },
  {
    id: 'absolute_soften', label: '绝对化措辞降级',
    cond: () => true, // 绝对化在任何档位下都是缺陷，不是风格选择
    re: /(毫无疑问|绝对可以|百分百|100%|一定能够|必然|板上钉钉)/g,
    to: (m) => ({ '毫无疑问': '大体上', '绝对可以': '大概率可以', '百分百': '几乎', '100%': '几乎', '一定能够': '通常能', '必然': '多半会', '板上钉钉': '基本已定' }[m] || '大概'),
  },
  {
    id: 'imperative_soften', label: '命令式改建议式',
    cond: (p) => p.warmth >= 0.5,
    re: /(你必须|你应该|你得|你要|赶紧)/g,
    to: (m) => ({ '你必须': '建议你', '你应该': '不妨', '你得': '你可以', '你要': '你可以', '赶紧': '尽快' }[m] || '建议'),
  },
  {
    id: 'filler_trim', label: '砍口水填充',
    cond: (p) => p.brevity >= 0.5,
    re: /(其实，?|基本上，?|说实话，?|总的来说，?|真的，?)/g,
    to: '',
  },
  {
    id: 'colloquial_formalize', label: '口语转书面',
    cond: (p) => p.formality >= 0.7,
    re: /(咋|搞不定|弄一下|玩意儿)/g,
    to: (m) => ({ '咋': '怎么', '搞不定': '无法解决', '弄一下': '处理一下', '玩意儿': '东西' }[m] || ''),
  },
  {
    // 收尾整顿：删完结尾客套可能留下悬空逗号（「综上所述，」），补成句号
    id: 'trailing_punct_tidy', label: '悬空标点整顿',
    cond: () => true,
    re: /[，,、]\s*$/,
    to: '。',
  },
];

function countViolations(text) {
  const byKey = {};
  let total = 0;
  for (const p of VIOLATION_PROBES) {
    p.re.lastIndex = 0;
    const n = (text.match(p.re) || []).length;
    if (n) { byKey[p.key] = n; total += n * p.weight; }
  }
  return { total, byKey };
}

class PersonalityTone {
  /** @param {object} [opts] 预留：默认档位覆盖 */
  constructor(opts = {}) {
    this._defaultProfile = opts.profile && typeof opts.profile === 'object' ? opts.profile : NEUTRAL;
  }

  /**
   * 解析档位：persona 预设优先，ctx 显式值覆盖预设，都缺则中性档。
   * @returns {{profile:object,source:string}}
   */
  resolveProfile(ctx) {
    const c = ctx && typeof ctx === 'object' ? ctx : {};
    let profile = Object.assign({}, this._defaultProfile);
    let source = 'default';
    if (typeof c.persona === 'string' && PERSONA_PRESETS[c.persona]) {
      profile = Object.assign({}, PERSONA_PRESETS[c.persona]);
      source = 'persona:' + c.persona;
    }
    for (const k of ['warmth', 'formality', 'brevity']) {
      if (typeof c[k] === 'number' && isFinite(c[k])) {
        profile[k] = Math.max(0, Math.min(1, c[k]));
        source = source === 'default' ? 'ctx' : source + '+ctx';
      }
    }
    return { profile, source };
  }

  /**
   * 应用语气修订。
   * @param {string} text 原文
   * @param {object} [ctx] {persona,warmth,formality,brevity,greeting,closing}
   * @returns {{text:string,changes:Array,applied:number,profile:object,profileSource:string,
   *            alignmentBefore:number,alignmentAfter:number,source:string|null}}
   */
  apply(text, ctx = {}) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return {
        text: '', changes: [], applied: 0,
        profile: null, profileSource: null,
        alignmentBefore: 0, alignmentAfter: 0, source: null,
      };
    }
    const c = ctx && typeof ctx === 'object' ? ctx : {};
    const { profile, source: profileSource } = this.resolveProfile(c);
    const before = countViolations(text);

    let out = text;
    const changes = [];
    for (const rule of RULES) {
      if (!rule.cond(profile)) continue;
      rule.re.lastIndex = 0;
      if (!rule.re.test(out)) continue;
      rule.re.lastIndex = 0;
      const replaced = out.replace(rule.re, (...args) => {
        const m = args[0];
        return typeof rule.to === 'function' ? rule.to(m) : rule.to;
      });
      if (replaced !== out) {
        changes.push({ rule: rule.id, label: rule.label, before: out.length, after: replaced.length, reason: `档位 ${profileSource} 下生效` });
        out = replaced;
      }
    }

    // 问候语/结束语只在你显式提供时才加——引擎不替人编客套
    if (typeof c.greeting === 'string' && c.greeting.trim()) {
      out = c.greeting.trim() + (out.startsWith('\n') ? '' : '\n') + out;
      changes.push({ rule: 'greeting_prepend', label: '前置问候（调用方提供）', before: text.length, after: out.length, reason: 'ctx.greeting 显式提供' });
    }
    if (typeof c.closing === 'string' && c.closing.trim()) {
      out = out + (out.endsWith('\n') ? '' : '\n') + c.closing.trim();
      changes.push({ rule: 'closing_append', label: '后置收尾（调用方提供）', before: text.length, after: out.length, reason: 'ctx.closing 显式提供' });
    }

    const after = countViolations(out);
    return {
      text: out,
      changes,
      applied: changes.length,
      profile,
      profileSource,
      alignmentBefore: before.total,
      alignmentAfter: after.total,
      source: 'personality-tone',
    };
  }
}

module.exports = { PersonalityTone, PERSONA_PRESETS, VIOLATION_PROBES };
