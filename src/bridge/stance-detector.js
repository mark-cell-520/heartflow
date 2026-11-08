/**
 * StanceDetector — 立场检测器 v1.0
 *
 * 判别一句文本对当前话题的立场：支持 / 反对 / 中立 / 求信息 / 转移话题。
 * 心虫是辨别层，立场是「要不要介入、以什么姿态介入」的前置输入——
 * 对反对立场照搬支持立场的回应方式，是激化矛盾最常见的原因。
 *
 * [r249] 修复的缺陷：src/mcp-server.js 的 handleBridgeAnalyze 里
 *   `new StanceDetector().detect(input, {})` 与 `new ConflictResolver().resolve(input, {})`
 *   两个标识符**从未被 require** —— 实测 heartflow_bridge_analyze 100% 返回
 *   `{"error":"StanceDetector is not defined"}`（scripts/tmp-249-probe2.js），
 *   该 MCP 工具自接线起就是死的。src/bridge/ 下也根本没有这两个文件。
 *   本文件与 conflict-resolver.js 一并补上真实实现。
 */

// 立场族：re 命中即累计权重，signals 记录命中标签供审计
const STANCE_FAMILIES = [
  {
    stance: 'oppose',
    weight: 2,
    patterns: [
      { re: /(不同意|不认同|不赞成|反对|我反对|难以苟同|不敢苟同)/i, label: '显式反对' },
      { re: /(错了|不对|有问题|靠不住|站不住|说不通|不成立)/i, label: '指认错误' },
      { re: /(但是|可是|不过|然而|反而|恰恰相反)/i, label: '转折反对' },
      { re: /(凭什么|为什么必须|何必|瞎折腾|没用|毫无意义)/i, label: '质疑必要性' },
    ],
  },
  {
    stance: 'support',
    weight: 2,
    patterns: [
      { re: /(同意|认同|赞成|支持|赞同|说得好|没错|正是如此)/i, label: '显式支持' },
      { re: /(有道理|说得对|受教了|学到了|感谢指出)/i, label: '接受观点' },
      { re: /(我也这么想|深有同感|举双手赞成)/i, label: '同向表态' },
    ],
  },
  {
    stance: 'inquire',
    weight: 1.5,
    patterns: [
      { re: /(请问|请教|想问一下|能不能告诉|如何|怎么|为什么|啥时候|多少|哪个)/i, label: '询问' },
      { re: /(\?|？)/, label: '问号' },
    ],
  },
  {
    stance: 'deflect',
    weight: 1.2,
    patterns: [
      { re: /(说别的|换个话题|先不说这个|扯远了|另外再说|回头再说)/i, label: '显式转移' },
      { re: /(上次那事|之前你说过|这让我想起)/i, label: '拉回旧账' },
    ],
  },
];

// 立场 → 介入建议
const STANCE_ADVICE = {
  oppose: '先复述对方反对的点确认理解，再给证据；不要急着辩护',
  support: '可直接推进，但补上对方没提到的代价与边界',
  inquire: '先答所问，再补一个相关的关键提醒',
  deflect: '先把当前话题收口，再决定是否跟随转移',
  neutral: '按常规回应，无需特殊姿态',
  unknown: '信号不足，按中性处理但保持简短，留出纠偏空间',
};

class StanceDetector {
  constructor(config = {}) {
    this.name = 'stance-detector';
    this.version = '1.0.0';
    this.families = STANCE_FAMILIES;
    this.threshold = typeof config.threshold === 'number' ? config.threshold : 1.5;
  }

  /**
   * 检测文本立场
   * @param {string} input 文本
   * @param {object} [context] 预留上下文（topic / history）
   * @returns {{stance, confidence, scores, signals, advice, alternatives}}
   */
  detect(input, context = {}) {
    const text = typeof input === 'string' ? input.trim() : '';
    if (!text) {
      return {
        stance: 'unknown',
        confidence: 0,
        scores: {},
        signals: [],
        advice: STANCE_ADVICE.unknown,
        alternatives: [],
        checkedBy: ['stance-detector@' + this.version],
      };
    }

    const scores = {};
    const signals = [];
    for (const fam of this.families) {
      let s = 0;
      for (const p of fam.patterns) {
        if (p.re.test(text)) {
          s += fam.weight;
          signals.push({ stance: fam.stance, label: p.label });
        }
      }
      if (s > 0) scores[fam.stance] = s;
    }

    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topStance, topScore] = ranked.length ? ranked[0] : ['neutral', 0];
    const runnerUp = ranked.length > 1 ? ranked[1][1] : 0;

    // 置信度：头名得分 / (头名 + 次名)，无信号时 0
    const denom = topScore + runnerUp;
    const confidence = denom > 0 ? Math.round((topScore / denom) * 100) / 100 : 0;

    // 低于阈值或头名与次名咬得很紧 → 判中性（宁可不猜，不要猜错姿态）
    const margin = topScore - runnerUp;
    const ambiguous = ranked.length > 1 && margin < 0.5;
    const stance = topScore < this.threshold || ambiguous ? 'neutral' : topStance;

    return {
      stance,
      confidence,
      scores,
      signals,
      advice: STANCE_ADVICE[stance] || STANCE_ADVICE.neutral,
      alternatives: ranked.filter(([k]) => k !== stance).map(([k, v]) => ({ stance: k, score: v })),
      ambiguous,
      margin,
      checkedBy: ['stance-detector@' + this.version],
    };
  }

  /** 立场族自检 */
  getFamilies() {
    return this.families.map(f => ({ stance: f.stance, weight: f.weight, patterns: f.patterns.length }));
  }

  destroy() {}
  stop() {}
}

module.exports = { StanceDetector, STANCE_FAMILIES, STANCE_ADVICE };
