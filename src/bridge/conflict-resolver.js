/**
 * ConflictResolver — 冲突消解器 v1.0
 *
 * 判别两段文本之间有没有冲突：用户说的话 vs 打算发出的回应（或两轮之间的
 * 自相矛盾）。心虫第 1 层的职责是在矛盾到达人类之前把它标出来——
 * 「上一轮说 A 这一轮说非 A」是 AI 输出最伤信任的形状之一。
 *
 * [r249] 修复的缺陷：同 stance-detector.js —— src/mcp-server.js 的
 *   handleBridgeAnalyze 调 `new ConflictResolver().resolve(input, {})` 但从未
 *   require 该标识符，heartflow_bridge_analyze 100% 抛 ReferenceError
 *   （scripts/tmp-249-probe2.js 实测）。本文件补上真实实现。
 *
 * 判据设计：三类冲突，逐类可关。
 *   ① negation  直接否定对撞（「一定」vs「不一定」）
 *   ② quantity  数量/范围对撞（「全部」vs「部分」）
 *   ③ stance    立场反转（同一对象上支持 vs 反对）
 */

// ① 直接否定对撞：同根词 + 否定词
const NEGATION_PAIRS = [
  { a: /(一定|必然|肯定|绝对)/, b: /(不一定|未必|不一定|不见得|未必)/, label: '确定性否定对撞' },
  { a: /(可以|能够|允许)/, b: /(不可以|不能|不允许|禁止|不可)/, label: '许可否定对撞' },
  { a: /(支持|赞成|赞同)/, b: /(不支持|反对|不赞成)/, label: '立场否定对撞' },
  { a: /(需要|必须|应当)/, b: /(不需要|不必|无需|不须)/, label: '必要性否定对撞' },
  { a: /(安全|无害|无风险)/, b: /(不安全|有害|有风险|危险)/, label: '安全性否定对撞' },
];

// ② 数量/范围对撞
const QUANTITY_PAIRS = [
  { a: /(全部|所有|每一个|任何|一律|皆)/, b: /(部分|有些|少数|某些|个别|一部分)/, label: '全称 vs 特称' },
  { a: /(总是|一直|从来都|每次)/, b: /(有时|偶尔|间或|少数情况下)/, label: '恒常 vs 偶发' },
  { a: /(永远|永久|始终)/, b: /(暂时|短期|目前|现阶段)/, label: '永续 vs 暂时' },
];

// ③ 立场反转标记（同一段文本里同时出现正反表态）
const STANCE_FLIP = [
  { pos: /(我认为.{0,20}(对|好|可行|靠谱))/, neg: /(但我?(又)?(觉得)?(不对|不好|不可行|不靠谱))/, label: '自评反转' },
];

class ConflictResolver {
  constructor(config = {}) {
    this.name = 'conflict-resolver';
    this.version = '1.0.0';
    this.negationPairs = NEGATION_PAIRS;
    this.quantityPairs = QUANTITY_PAIRS;
    this.stanceFlip = STANCE_FLIP;
    this.threshold = typeof config.threshold === 'number' ? config.threshold : 0.5;
  }

  /**
   * 检测冲突
   * @param {string} input 主文本（通常是待发出的回应）
   * @param {object} [context]
   * @param {string} [context.other] 对照文本（通常是用户上一轮 / 上一条回应）
   * @returns {{conflict, severity, conflicts, advice, checkedBy}}
   */
  resolve(input, context = {}) {
    const text = typeof input === 'string' ? input.trim() : '';
    const other = context && typeof context.other === 'string' ? context.other.trim() : '';
    if (!text && !other) {
      return {
        conflict: null,
        severity: 0,
        conflicts: [],
        advice: '没有可对照的文本，不判定冲突',
        checkedBy: ['conflict-resolver@' + this.version],
      };
    }

    const conflicts = [];
    // 单文本内部矛盾（自相矛盾）——不需要对照文本
    if (text) {
      for (const p of this.negationPairs) {
        if (p.a.test(text) && p.b.test(text)) {
          conflicts.push(this._c('negation', p.label, 'self', 0.8, '同一段里既断言又否认，先确定到底站哪一边'));
        }
      }
      for (const p of this.quantityPairs) {
        if (p.a.test(text) && p.b.test(text)) {
          conflicts.push(this._c('quantity', p.label, 'self', 0.6, '全称与特称混用，说明统计口径或样本范围'));
        }
      }
      for (const p of this.stanceFlip) {
        if (p.pos.test(text) && p.neg.test(text)) {
          conflicts.push(this._c('stance', p.label, 'self', 0.7, '结论反转了，把反转条件写出来'));
        }
      }
    }

    // 跨文本对撞：同一判据在两边各自命中对立面
    if (text && other) {
      for (const p of this.negationPairs) {
        const aHere = p.a.test(text), bHere = p.b.test(text);
        const aThere = p.a.test(other), bThere = p.b.test(other);
        if ((aHere && bThere) || (bHere && aThere)) {
          conflicts.push(this._c('negation', p.label, 'cross', 0.85, '两段文本结论相反，指出差异前提而不是重复己方结论'));
        }
      }
      for (const p of this.quantityPairs) {
        const aHere = p.a.test(text), bHere = p.b.test(text);
        const aThere = p.a.test(other), bThere = p.b.test(other);
        if ((aHere && bThere) || (bHere && aThere)) {
          conflicts.push(this._c('quantity', p.label, 'cross', 0.55, '范围表述不一致，对齐口径'));
        }
      }
    }

    conflicts.sort((x, y) => y.severity - x.severity || x.kind.localeCompare(y.kind));
    const severity = conflicts.length ? conflicts[0].severity : 0;

    return {
      conflict: conflicts.length ? conflicts[0] : null,
      severity,
      conflicts,
      advice: conflicts.length
        ? conflicts.map(c => `[${c.kind}] ${c.label}（${c.scope}）→ ${c.guidance}`).join('；')
        : '未检测到冲突',
      checkedPairs: this.negationPairs.length + this.quantityPairs.length + this.stanceFlip.length,
      checkedBy: ['conflict-resolver@' + this.version],
    };
  }

  _c(kind, label, scope, severity, guidance) {
    return { kind, label, scope, severity, guidance };
  }

  /** 判据自检 */
  getPairs() {
    return {
      negation: this.negationPairs.length,
      quantity: this.quantityPairs.length,
      stanceFlip: this.stanceFlip.length,
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { ConflictResolver, NEGATION_PAIRS, QUANTITY_PAIRS };
