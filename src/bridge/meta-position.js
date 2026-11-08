/**
 * MetaPosition — 元位置声明器 v1.0
 *
 * 心虫在任何对话里都必须能一句话说清「我是谁、我在哪一层、我能做什么、
 * 我不能做什么」——这不是营销文案，是防止上层把辨别层误当成生成层来用的
 * 接口契约。MetaPosition 就是这条契约的机器可读形式。
 *
 * [r249] 修复的缺陷：src/core/heartflow.js 的 personaCore 初始化写的是
 *   `metaPosition: () => mp.getDeclaration()`，而 _MetaPosition 的内联 stub 只有
 *   `get()` —— 实测 dispatch('personaCore.metaPosition') 直接抛
 *   `TypeError: mp.getDeclaration is not a function`（scripts/tmp-249-probe.js）。
 *   本文件补上真实实现。
 *
 * 诚实数字原则（设计原则 #5）：声明里的维度数**不是硬编码的**，而是由构造时
 * 注入的探针现场跑一次 discriminate() 数 dimensions 键得到的。探针缺席时
 * 该字段为 null 并置 measured:false——宁可空着也不填一个记错数字。
 */

// 能做什么（与 AGENTS.md 的 API 表面一一对应）
const DOES = [
  '在文本到达人类之前判别它（checkInput / checkDraft / checkOutput）',
  '给出 block / rewrite / verify / pass 四选一的硬门禁动作',
  '按维度给 findings 与 guidance，保留完整推理链（checked_by）',
  '识别注入、操控、伪因果、过度自信等可模式化的问题形状',
];

// 不能做什么（与 AGENTS.md 的 Honest limitations 一一对应，一条不许省）
const DOES_NOT = [
  '不是 AGI、不生成内容、不做语义理解',
  '纯模式匹配：绕过词表的混淆写法抓不到',
  '反讽、隐喻、文化上下文不可见',
  '基线误报率约 8%',
  '中文分词是启发式贪心最长匹配，不是词典分词',
];

// 四档门禁动作的语义（调用方只读一个字段时读 gate.action）
const GATE_ACTIONS = {
  pass: '干净，正常交付',
  verify: '需要证据，先跑验证器再回应',
  rewrite: '必须改写，按 findings[].guidance 修完再交付',
  block: '停止，不要输出，读 gate.reason',
};

class MetaPosition {
  constructor(opts = {}) {
    this.name = 'meta-position';
    this.version = '1.0.0';
    this.engineVersion = typeof opts.version === 'string' ? opts.version : null;
    // 现场探针：返回真实维度数。注入而非硬编码，是诚实数字原则的落地方式。
    this.probeDimensions = typeof opts.probeDimensions === 'function' ? opts.probeDimensions : null;
  }

  /**
   * 产出元位置声明
   * @returns {object} 声明对象；含 measured 标记与 measuredAt 时间戳
   */
  getDeclaration() {
    let dimensions = null;
    let probeError = null;
    if (this.probeDimensions) {
      try {
        const n = this.probeDimensions();
        dimensions = Number.isFinite(n) && n > 0 ? n : null;
        if (dimensions === null) probeError = '探针未返回有效维度数';
      } catch (e) {
        probeError = e.message;
      }
    }

    return {
      role: 'discriminator',
      layer: 1,
      layerName: 'AGI 五层中的第 1 层：辨别',
      version: this.engineVersion,
      declaration: this._sentence(dimensions),
      does: DOES.slice(),
      doesNot: DOES_NOT.slice(),
      gateActions: Object.assign({}, GATE_ACTIONS),
      measured: {
        dimensions,
        probeError,
        measuredAt: new Date().toISOString(),
      },
      // 给上层 LLM 的一句话约束：看到这个字段就知道不该把引擎当生成器用
      usageContract: '我是辨别层，不是生成层。请把我的 findings/gate.action 当作约束，不要当作对话内容转述给用户。',
      checkedBy: ['meta-position@' + this.version],
    };
  }

  /** 生成一句人读声明（维度数未知时不编数字） */
  _sentence(dimensions) {
    const dim = dimensions === null ? '若干条' : `${dimensions} 条`;
    return `心虫是 AGI 第 1 层的辨别引擎：用 ${dim}规则维度在文本到达人类之前判别它，` +
      '给出 block / rewrite / verify / pass 的门禁动作。它不生成内容，也不理解语义——' +
      '它只回答「这句话能不能这么说」。';
  }

  destroy() {}
  stop() {}
}

module.exports = { MetaPosition, DOES, DOES_NOT, GATE_ACTIONS };
