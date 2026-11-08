/**
 * ValueAligner — 价值对齐核查器 v1.0
 *
 * 心虫第 1 层是辨别层：不生成回答，但要在回答发出去之前回答一个问题——
 * 「这句回应守不守桥两边的共同底线」。本模块就是那个检查器。
 *
 * [r249] 修复的缺陷：src/core/heartflow.js 的 personaCore 初始化写的是
 *   `valueAligner: (ctx) => va.check(ctx)`，而 _ValueAligner 的内联 stub 只有
 *   `align()` —— 实测 dispatch('personaCore.valueAligner') 直接抛
 *   `TypeError: va.check is not a function`（scripts/tmp-249-probe.js）。
 *   personaCore.valueAligner 是 MCP heartflow_agent_think 的既定能力项，
 *   这条路由从接线起就没通过。本文件补上真实实现。
 *
 * 判据取向（刻意收窄，避免把正常表达判成违背）：
 *   - 只扫**待发出的回应文本**（plannedResponse）；调用方只给 userInput 时
 *     降级为扫 userInput 并标记 source，不假装扫过回应；
 *   - 每条违背都带 value / signal / severity / guidance，可逐条审计；
 *   - 分数是「违扣分」制而非「关键词计数」——一条严重违背比五条轻度违背更糟。
 */

// 违背规则表：value=被违反的底线, re=判据, severity=严重度(0-1), guidance=怎么改
const VIOLATION_RULES = [
  {
    value: 'honesty',
    re: /(100%|百分之百|绝对|毫无疑问|肯定|一定|必然| guaranteed |guaranteed)/i,
    severity: 0.5,
    signal: '无保留的确定性断言',
    guidance: '给出来源或改为「在当前条件下倾向于…」的有条件表述',
  },
  {
    value: 'honesty',
    re: /(据我所知没有例外|从来没有失败|永远正确|完全可靠|零风险)/i,
    severity: 0.6,
    signal: '全称无例外断言',
    guidance: '补一个反例边界或说明适用范围',
  },
  {
    value: 'honesty',
    re: /(根据\s*(19|20)\d{2}\s*年.{0,12}(研究|报告|论文)|哈佛大学?研究|斯坦福研究|MIT 研究)/i,
    severity: 0.7,
    signal: '未标出处的权威来源引用',
    guidance: '补可验证的出处（作者/年份/链接），无法验证就改成「有说法认为」',
  },
  {
    value: 'honesty',
    re: /(\d+\.\d+\s*[%％]|\d+\.\d+\s*(年|倍|倍速))/,
    severity: 0.45,
    signal: '过度精确的数字',
    guidance: '说明数字来源与误差范围，或改为量级表述',
  },
  {
    value: 'transparency',
    re: /(你不会想知道|没必要知道|不用了解|信我就好|听我的就行|说了你也不懂)/i,
    severity: 0.8,
    signal: '阻断对方知情权',
    guidance: '把理由说清楚；若涉敏感信息，说明「为什么现在不能说」',
  },
  {
    value: 'transparency',
    re: /(我无法透露|内部规定|规定不允许).{0,20}(细节|过程|依据)/i,
    severity: 0.4,
    signal: '以规定代替理由',
    guidance: '给出可核验的规则名称或条款，而不是笼统的「规定」',
  },
  {
    value: 'respect',
    re: /(你太敏感|你想多了|这有什么大不了|小题大做|矫情)/i,
    severity: 0.85,
    signal: '否定对方感受',
    guidance: '先承认对方感受的合理性，再陈述事实',
  },
  {
    value: 'respect',
    re: /(连这个都不懂|这么简单都不会|智商|水平太低)/i,
    severity: 0.8,
    signal: '贬低对方能力',
    guidance: '改为描述事实差距并给补齐路径，不评价人',
  },
  {
    value: 'responsibility',
    re: /(都是你的错|全怪你|你自己造成的|活该)/i,
    severity: 0.8,
    signal: '单方归责',
    guidance: '区分可控与不可控因素，说明各自责任边界',
  },
  {
    value: 'responsibility',
    re: /(不关我的事|与我无关|我只是执行|上面让我这么干)/i,
    severity: 0.5,
    signal: '推卸可承担的责任',
    guidance: '承认自身在链条中的那一环，并说明能补救什么',
  },
  {
    value: 'no_overpromise',
    re: /(保证你能|一定能让你|百分百有效|包治|包过|稳赚| guaranteed results)/i,
    severity: 0.75,
    signal: '结果承诺',
    guidance: '改为「在…条件下通常可以」，并说明失效情形',
  },
  {
    value: 'no_overpromise',
    re: /(立刻解决|马上就好|一分钟内|秒变)/i,
    severity: 0.35,
    signal: '时间承诺',
    guidance: '给区间与前提，不要给单点时间',
  },
];

// 被守护的底线清单（无违背时也要原样返回，让调用方知道查过什么）
const GUARDED_VALUES = ['honesty', 'transparency', 'respect', 'responsibility', 'no_overpromise'];

class ValueAligner {
  constructor(config = {}) {
    this.name = 'value-aligner';
    this.version = '1.0.0';
    this.rules = VIOLATION_RULES;
    this.guardedValues = GUARDED_VALUES;
    this.threshold = typeof config.threshold === 'number' ? config.threshold : 0.8;
  }

  /**
   * 核查一段文本是否守底线
   * @param {object} [ctx]
   * @param {string} [ctx.plannedResponse] 待发出的回应（首选扫描对象）
   * @param {string} [ctx.userInput] 用户输入（仅在无 plannedResponse 时兜底）
   * @param {object} [ctx.bridgeIdentity] 桥身份声明（透传，不参与判据）
   * @returns {{aligned, score, violations, checkedValues, guidance, source, checkedLength}}
   */
  check(ctx = {}) {
    const c = ctx && typeof ctx === 'object' ? ctx : {};
    let source = null;
    let text = '';

    if (typeof c.plannedResponse === 'string' && c.plannedResponse.trim()) {
      source = 'plannedResponse';
      text = c.plannedResponse;
    } else if (typeof c.userInput === 'string' && c.userInput.trim()) {
      source = 'userInput';
      text = c.userInput;
    }

    if (!source) {
      return {
        aligned: null,
        score: null,
        violations: [],
        checkedValues: this.guardedValues.slice(),
        guidance: '未提供可核查文本（plannedResponse / userInput 均为空），不做判定',
        source: null,
        checkedLength: 0,
        checkedBy: ['value-aligner@' + this.version],
      };
    }

    const violations = [];
    let penalty = 0;
    for (const rule of this.rules) {
      const m = text.match(rule.re);
      if (!m) continue;
      // 同一条规则多次命中只记一次，但严重度按命中次数上浮（封顶 1.0）
      const hits = text.match(new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g')).length;
      const sev = Math.min(1, Math.round(rule.severity * (1 + 0.1 * (hits - 1)) * 100) / 100);
      penalty += sev;
      violations.push({
        value: rule.value,
        signal: rule.signal,
        severity: sev,
        matched: m[0].length > 40 ? m[0].slice(0, 40) + '…' : m[0],
        hits,
        guidance: rule.guidance,
      });
    }

    violations.sort((a, b) => b.severity - a.severity || a.value.localeCompare(b.value));

    // 分数：扣分制。任一条严重违背（≥0.8）直接压到 0.5 以下——严重问题不是「多扣点分」
    let score = Math.max(0, Math.round((1 - penalty) * 100) / 100);
    if (violations.some(v => v.severity >= 0.8)) score = Math.min(score, 0.45);

    const aligned = score >= this.threshold;

    return {
      aligned,
      score,
      violations,
      checkedValues: this.guardedValues.slice(),
      guidance: aligned
        ? '未发现违背底线的表述'
        : violations.map(v => `[${v.value}] ${v.signal} → ${v.guidance}`).join('；'),
      source,
      checkedLength: text.length,
      violationCount: violations.length,
      checkedBy: ['value-aligner@' + this.version],
    };
  }

  /** 规则表自检：让调用方能确认判据没被误删 */
  getRules() {
    return this.rules.map(r => ({ value: r.value, signal: r.signal, severity: r.severity }));
  }

  destroy() {}
  stop() {}
}

module.exports = { ValueAligner, VIOLATION_RULES, GUARDED_VALUES };
