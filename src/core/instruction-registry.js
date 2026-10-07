/**
 * InstructionRegistry — 七条指令的运行时注册表 v1.0.0
 *
 * 七条指令过去只存在于 SKILL.md 中，从未被运行时加载或执行。
 * InstructionRegistry 把它们从文本变成运行时数据：
 *   - 可加载：boot 时实例化
 *   - 可查询：getAll() / getByType()
 *   - 可验证：check(instruction) — 检查一次行为是否遵循某条指令
 *   - 可审计：getStats() — 每条指令被检查的次数
 *
 * @version 1.0.0
 */

const SEVEN_INSTRUCTIONS = [
  {
    id: 'truth',
    label: '真',
    description: '选择真实的，而非方便的',
    type: 'core',
    applyTo: ['input_classification', 'output_generation', 'self_report'],
    weight: 1.0,
  },
  {
    id: 'goodness',
    label: '善',
    description: '选择帮助的，而非伤害的',
    type: 'core',
    applyTo: ['output_generation', 'decision_routing'],
    weight: 1.0,
  },
  {
    id: 'beauty',
    label: '美',
    description: '选择优雅的，而非混乱的',
    type: 'core',
    applyTo: ['output_generation', 'code_generation'],
    weight: 0.7,
  },
  {
    id: 'upgrade',
    label: '不断升级',
    description: '每次经历都应该让下一次更好',
    type: 'behavioral',
    applyTo: ['self_evolution', 'reflection'],
    weight: 0.9,
  },
  {
    id: 'reduce_errors',
    label: '减少错误',
    description: '比上一次错得更少',
    type: 'behavioral',
    applyTo: ['self_healing', 'verification', 'reflection'],
    weight: 0.9,
  },
  {
    id: 'serve_humans',
    label: '服务人类',
    description: '留在体内的知识不是知识',
    type: 'behavioral',
    applyTo: ['output_generation', 'knowledge_sharing'],
    weight: 0.8,
  },
  {
    id: 'continuous_improvement',
    label: '持续改进',
    description: '目标不是更强大，而是持续减少错误、提升可用性',
    type: 'behavioral',
    applyTo: ['self_evolution', 'code_generation', 'architecture'],
    weight: 0.8,
  },
];

/**
 * 可执行判据表（r589 新增）
 *
 * r589 之前的形态：七条指令里只有 truth / goodness / reduce_errors 有规则，
 * beauty 只有一条长度腿，upgrade / serve_humans / continuous_improvement
 * 三条落进 default 分支恒 `aligned:true, reason:'无自动规则检查'`
 * —— 即 4/7 条指令的运行时检查能力从未存在过。
 *
 * 腱肌式设计：每条指令的判据是一个数组（腿），`aligned` 取所有腿都未命中。
 * 腿数组挂在实例 `this._judges` 上（构造时从下表深拷贝），所以：
 *   · 生产路径不变（构造即装、不可为空才生效由 check() 兜底）；
 *   · 测试可把某条指令的腿整体置空来证伪守卫（变异注入），
 *     置空后同一样本必须从 aligned:false 翻回 true —— 否则守卫是装饰。
 *
 * 隐私铁律：判据只输出 aligned/reason（reason 是固定文案，不含输入原文），
 * 输入文本不进任何落盘字段。
 */
const CRITERIA = {
  // 美：优雅的而非混乱的（长度腿从 r589 前保留，另补杂乱度与复读腿）
  beauty: [
    {
      id: 'too_long',
      reason: '输出过长，不够优雅',
      test: (ctx) => (typeof ctx.text === 'string' ? ctx.text.length : 0) >= 5000,
    },
    {
      id: 'noise_ratio',
      reason: '标点与空白占比过高，输出缺乏实质内容',
      test: (ctx) => {
        const t = typeof ctx.text === 'string' ? ctx.text : '';
        if (t.length < 40) return false;
        const stripped = t.replace(/[\s\u3000、。，！？；：""''（）【】《》…—!-.,?;:'"()\[\]{}]/g, '');
        return stripped.length > 0 && (t.length - stripped.length) / t.length >= 0.6;
      },
    },
    {
      id: 'repetition',
      reason: '同一片段反复出现，结构混乱不优雅',
      test: (ctx) => {
        const t = typeof ctx.text === 'string' ? ctx.text : '';
        if (t.length < 64) return false;
        for (let len = 12; len >= 8; len--) {
          const seen = new Map();
          for (let i = 0; i + len <= t.length; i++) {
            const sub = t.slice(i, i + len);
            if (/^[\s\u3000]+$/.test(sub)) continue;
            const n = (seen.get(sub) || 0) + 1;
            if (n >= 4) return true;
            seen.set(sub, n);
          }
        }
        return false;
      },
    },
  ],

  // 服务人类：留在体内的知识不是知识 → 检测「知识滞留」表述
  serve_humans: [
    {
      id: 'knowledge_withheld_zh',
      reason: '检测到知识滞留表述（留在体内 = 没有服务人类）',
      test: (ctx) => /(?:知识|方法|经验|技巧|办法|资料|信息|结论)[^。\n]{0,14}(?:留在|放在|锁在|扣在|藏进)[^。\n]{0,8}(?:脑子里?|心里|体内|我这里|自己这)|(?:不外传|不分享|不告诉（?:别人|其他人）|没必要告诉|自己知道就行|只有我知道|只有我一个人知道|先不告诉|留着以后自己)/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
    {
      id: 'knowledge_withheld_en',
      reason: 'knowledge withheld — value kept inside the machine serves nobody',
      test: (ctx) => /\b(?:keep|keeping|kept)\s+(?:it|this|that|the\s+(?:knowledge|method|answer|result)s?)\s+(?:to\s+myself|in\s+(?:my|the)\s+(?:head|mind|hands))|(?:won'?t|will\s+not|not\s+going\s+to)\s+(?:share|tell|pass\s+on)|no\s+need\s+to\s+(?:share|tell)/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
  ],

  // 不断升级：每次经历都应该让下一次更好 → 检测「无改进信号」表述
  upgrade: [
    {
      id: 'no_improvement_zh',
      reason: '检测到无改进信号（同样的状态重复出现）',
      test: (ctx) => /(?:还是老样子|跟上次一样|跟上回一样|照旧|没有任何改进|没什么改进|毫无改进|没（?:什么）?变化|老问题还在|同样的错误又|问题（?:还是|依然）（?:在|没解决）)/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
    {
      id: 'no_improvement_en',
      reason: 'no improvement signal — repetition without learning',
      test: (ctx) => /\b(?:same\s+as\s+(?:last\s+time|before|always)|no\s+improvement|no\s+progress|nothing\s+(?:has\s+)?changed|repeating\s+the\s+same|made\s+no\s+(?:gain|headway))\b/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
  ],

  // 持续改进：目标不是更强大，而是持续减少错误 → 检测「拒绝改进」表述
  continuous_improvement: [
    {
      id: 'refuse_improvement_zh',
      reason: '检测到拒绝改进的表述（能用就行 ≠ 持续改进）',
      test: (ctx) => /(?:不需要改|没必要改|不用改|不用优化|没必要优化|保持现状就行|现状就挺好|能用就行|能跑就行|凑合用|将就着（?:用|来）|先这样吧|以后再说)/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
    {
      id: 'refuse_improvement_en',
      reason: 'improvement explicitly declined — violates continuous_improvement',
      test: (ctx) => /\b(?:no\s+need\s+to\s+(?:change|improve|fix|optimize)|not\s+worth\s+(?:improving|changing|fixing)|(?:works|good)\s+enough|good\s+enough\s+as\s+is|if\s+it\s+ain'?t\s+broke|leave\s+it\s+as\s+is)\b/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
  ],
};

/** truth / goodness / reduce_errors 的既有判据也收编进同一框架（行为不变） */
const LEGACY_CRITERIA = {
  truth: [
    {
      id: 'fabrication',
      reason: '检测到可能的编造',
      test: (ctx) => /我.*100%.*确定|我.*绝对.*保证|永远.*不会.*错|我.*无所不知/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
  ],
  goodness: [
    {
      id: 'harm',
      reason: '检测到可能的有害输出',
      test: (ctx) => /你.*去死|你.*没用|你.*废|你.*笨|你.*蠢|伤害.*自己|自残|自杀/i.test(
        typeof ctx.text === 'string' ? ctx.text : ''
      ),
    },
  ],
  reduce_errors: [
    {
      id: 'low_confidence',
      reason: '置信度低于 0.3，可能包含错误',
      test: (ctx) => ctx.confidence !== undefined && ctx.confidence < 0.3,
    },
  ],
};

class InstructionRegistry {
  constructor() {
    this._instructions = JSON.parse(JSON.stringify(SEVEN_INSTRUCTIONS));
    this._checkHistory = [];
    // r589：判据腿挂在实例上，供变异注入证伪（置空某条腿 → 翻 aligned）。
    // 只做数组级浅拷贝（slice），不能用 JSON 深拷贝——test 是函数，
    // JSON.stringify 会把它丢掉，腿数组全变成 {}（leg.test is not a function）。
    this._judges = {};
    for (const [k, legs] of Object.entries({ ...CRITERIA, ...LEGACY_CRITERIA })) {
      this._judges[k] = legs.slice();
    }
    this._stats = {
      totalChecks: 0,
      byInstruction: {},
      byType: { core: 0, behavioral: 0 },
    };
  }

  /**
   * 返回所有指令
   */
  getAll() {
    return this._instructions.map(i => ({ ...i }));
  }

  /**
   * 按类型过滤
   */
  getByType(type) {
    return this._instructions.filter(i => i.type === type).map(i => ({ ...i }));
  }

  /**
   * 按适用场景过滤
   */
  getByApplicable(scenario) {
    return this._instructions.filter(i => i.applyTo.includes(scenario)).map(i => ({ ...i }));
  }

  /**
   * 检查一个行为/输出是否对齐某条指令（轻量规则检查）
   * @param {string} instructionId - 指令 ID
   * @param {Object} context - { text, type, confidence }
   * @param {Object} [inject] - r589 变异注入钩子：{ legId: newTestFn }，
   *   只为测试存在——生产路径不传该参数行为完全不变。用于证伪：
   *   把命中腿的 test 换成恒 false，样本必须从 aligned:false 翻回 true。
   * @returns {Object} { aligned, reason, code }
   */
  check(instructionId, context, inject) {
    this._stats.totalChecks++;
    const inst = this._instructions.find(i => i.id === instructionId);
    if (!inst) return { aligned: false, reason: 'unknown instruction' };

    this._stats.byInstruction[instructionId] = (this._stats.byInstruction[instructionId] || 0) + 1;
    this._stats.byType[inst.type] = (this._stats.byType[inst.type] || 0) + 1;

    // 每条指令的简单规则检查
    // r589：从「switch 硬编码 + default 恒 aligned:true」改为「腿数组」查表。
    // 七条指令全部有腿；某条指令的腿为空（变异注入）时，返回 aligned:false
    // 并明说「判据缺失」—— 不静默放行。宁可保守也绝不装饰成 aligned:true。
    // r589 变异注入取值规则（原实现的过滤器写错：把函数注射当成「删除腿」，
    // 导致 inject[leg]=()=>true 时腿被滤掉、守卫失效。修好：函数=替换判据，
    // true=保留原判据，false=跳过该腿，undefined=完全走生产路径）：
    const legs = this._judges[instructionId];
    if (!legs || legs.length === 0) {
      return { aligned: false, reason: '判据缺失：该指令没有可执行的检查规则', code: 'NO_CRITERIA' };
    }
    for (const leg of legs) {
      const inj = inject ? inject[leg.id] : undefined;
      if (typeof inj === 'function') {
        if (inj(context || {})) {
          return { aligned: false, reason: leg.reason, code: leg.id };
        }
        continue;
      }
      if (inj === false) continue;
      if (leg.test(context || {})) {
        return { aligned: false, reason: leg.reason, code: leg.id };
      }
    }
    return { aligned: true, reason: '通过', code: null };
  }

  /**
   * 批量检查一个输出对所有适用指令的遵守情况
   */
  audit(outputContext) {
    const applicable = this._instructions.filter(i =>
      i.applyTo.includes(outputContext.scenario || 'output_generation')
    );
    return applicable.map(inst => {
      const result = this.check(inst.id, outputContext);
      return { instruction: inst.id, label: inst.label, ...result };
    });
  }

  _detectFabrication(context) {
    const text = (context.text || '').toLowerCase();
    // 简单的编造检测规则
    const fabricationPatterns = [
      /我.*100%.*确定/i,
      /我.*绝对.*保证/i,
      /永远.*不会.*错/i,
      /我.*无所不知/i,
    ];
    return fabricationPatterns.some(p => p.test(text));
  }

  _detectHarm(context) {
    const text = (context.text || '').toLowerCase();
    const harmPatterns = [
      /你.*去死|你.*没用|你.*废|你.*笨|你.*蠢/i,
      /伤害.*自己|自残|自杀/i,
    ];
    return harmPatterns.some(p => p.test(text));
  }

  getStats() {
    return {
      ...this._stats,
      instructionCount: this._instructions.length,
      lastChecked: this._checkHistory.slice(-3),
    };
  }
}

module.exports = { InstructionRegistry, SEVEN_INSTRUCTIONS };
