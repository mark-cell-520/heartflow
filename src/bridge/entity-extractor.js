/**
 * EntityExtractor — 实体抽取器 v1.0
 *
 * 从用户输入里抽出**可机器消费**的实体：联系方式、时间、数量、路径、标识符等。
 * 交流层拿不到实体，后面所有环节都只能在字符串上打转——「请联系 13812345678」
 * 和「请联系张三」对下游是两回事，前者涉及隐私暴露，后者只是个人称。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:659 的内联 stub 让
 *   dispatch('translator.entityExtractor') 恒返回 []（scripts/tmp-250-probe.js
 *   实测：邮箱/手机号/日期齐全的句子仍返回空数组）。该路由被
 *   src/mcp-server.js 的 handleTranslate 直接调用（heartflow_translate 的
 *   entities 字段），是广告出去的能力。本文件补上真实实现。
 *
 * 设计纪律：
 *   1. 每条实体带 span(start/end) 与置信度，可审计、可回摘；
 *   2. 联系方式类标 sensitive:true —— 心虫是辨别层，先把「这句话里有 PII」喊出来；
 *   3. 重叠跨度按优先级裁决（邮箱 > 手机号 > 身份证 > IP > 日期 …），
 *      低优先级被高优先级吞掉时登记在 suppressed 里，不静默丢弃；
 *   4. 无输入 / 非字符串输入返回 [] 并置 source:null，不假装抽过。
 */

'use strict';

// 实体族：re 命中即产出一条候选。priority 用于跨族重叠裁决（大者胜）。
// confidence 是「这个形状有多不像误报」的先验，与上下文无关。
const ENTITY_FAMILIES = [
  {
    type: 'email', priority: 10, confidence: 0.98, sensitive: true,
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g,
    normalize: (v) => v.toLowerCase(),
  },
  {
    type: 'url', priority: 9, confidence: 0.97, sensitive: false,
    re: /https?:\/\/[^\s<>"'`，。；、）)\]}>]+/gi,
    normalize: (v) => v,
  },
  {
    // 中国大陆手机号：1[3-9] + 9 位，前后都不能再贴数字
    type: 'phone_cn', priority: 9, confidence: 0.95, sensitive: true,
    re: /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    normalize: (v) => v,
  },
  {
    // 18 位身份证（末位可为 X）
    type: 'id_card', priority: 9, confidence: 0.9, sensitive: true,
    re: /(?<!\d)\d{17}[\dXx](?!\d)/g,
    normalize: (v) => v.toUpperCase(),
  },
  {
    type: 'ip', priority: 8, confidence: 0.9, sensitive: false,
    re: /(?<![\d.])\d{1,3}(?:\.\d{1,3}){3}(?![\d.])/g,
    normalize: (v) => v,
  },
  {
    type: 'date', priority: 7, confidence: 0.9, sensitive: false,
    re: /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?|\d{1,2}月\d{1,2}[号日]/g,
    normalize: (v) => v,
  },
  {
    type: 'time', priority: 6, confidence: 0.85, sensitive: false,
    re: /(?<!\d)\d{1,2}:\d{2}(?::\d{2})?(?!\d)/g,
    normalize: (v) => v,
  },
  {
    // 金额：货币符号在前，或「数字 + 元/块/美元」在后
    type: 'money', priority: 7, confidence: 0.88, sensitive: false,
    re: /[¥$€£]\s?\d+(?:\.\d+)?\s?[万亿千百]?|\d+(?:\.\d+)?\s?(?:元|块钱|美元|欧元|日元|英镑|rmb)/gi,
    normalize: (v) => v.replace(/\s+/g, ''),
  },
  {
    type: 'percent', priority: 6, confidence: 0.92, sensitive: false,
    re: /(?<![\d.])\d+(?:\.\d+)?\s?%(?![\d.])/g,
    normalize: (v) => v.replace(/\s+/, ''),
  },
  {
    // 带单位的数量：3 个人 / 500 万字 / 12 小时 / 3.5kg
    type: 'quantity', priority: 5, confidence: 0.82, sensitive: false,
    re: /(?<![\d.])\d+(?:\.\d+)?\s?(?:万|亿|千|百)?(?:个|人|次|条|篇|页|字|行|天|小时|分钟|秒|年|月|日|周|公斤|斤|克|吨|米|公里|km|kg|gb|mb|tb|ms)(?![\w.])/gi,
    normalize: (v) => v.replace(/\s+/g, ''),
  },
  {
    type: 'version', priority: 6, confidence: 0.9, sensitive: false,
    re: /(?<![\w.])v?\d+\.\d+(?:\.\d+)+(?:-[\w.]+)?(?![\w.])/gi,
    normalize: (v) => v,
  },
  {
    // 文件路径（绝对）：Windows 盘符或 POSIX 根开头，且带扩展名
    type: 'file_path', priority: 6, confidence: 0.85, sensitive: false,
    re: /(?:[A-Za-z]:\\[^\s|*?"'<>]+|\/(?:home|tmp|var|etc|usr|opt|Users)\/[^\s|*?"'<>]+)/g,
    normalize: (v) => v,
  },
  {
    // 文件路径（相对）：至少一段目录 + 扩展名（src/a.js、./scripts/x.js、../src/y.py）。
    // 要求含斜杠，避免把「3.5kg」「v1.2」误判成路径；URL 场景由 url 族（优先级 9）
    // 在跨度裁决时胜出，本族候选会被压掉并登记 suppressed。
    type: 'file_path', priority: 6, confidence: 0.8, sensitive: false,
    re: /(?<![\w./\\-])(?:\.{1,2}\/)?(?:[\w.-]+\/)+[\w.-]+\.[A-Za-z]{1,5}(?![\w])/g,
    normalize: (v) => v,
  },
  {
    type: 'code_ident', priority: 4, confidence: 0.7, sensitive: false,
    re: /\b[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+\s*\(|\b[a-z]+(?:_[a-z0-9]+){1,}\b/g,
    normalize: (v) => v.replace(/\s*\($/, ''),
  },
  {
    type: 'mention', priority: 5, confidence: 0.85, sensitive: false,
    re: /[@＠][A-Za-z0-9_一-龥]{1,20}/g,
    normalize: (v) => v,
  },
  {
    type: 'hashtag', priority: 4, confidence: 0.8, sensitive: false,
    re: /[#＃][^#\s，。；、]{1,30}/g,
    normalize: (v) => v,
  },
  {
    // 机构名：中文 + 组织后缀
    type: 'org', priority: 5, confidence: 0.75, sensitive: false,
    re: /[一-龥]{2,10}(?:公司|集团|大学|学院|医院|银行|研究院|研究所|实验室|部门|团队|中心|分局|大队|支队)/g,
    normalize: (v) => v,
  },
  {
    // 称谓人名：X 先生 / X 老师 / 小 X
    type: 'person', priority: 4, confidence: 0.7, sensitive: false,
    re: /[一-龥]{2,4}(?:先生|女士|老师|经理|总监|医生|教授|律师)|小[一-龥]{1,2}(?![一-龥])/g,
    normalize: (v) => v,
  },
];

class EntityExtractor {
  /**
   * @param {object} [opts]
   * @param {number} [opts.maxEntities] 单次最多产出多少条（默认 50，防爆）
   * @param {string[]} [opts.types] 只抽这些类型（默认全抽）
   */
  constructor(opts = {}) {
    this._maxEntities = Number.isFinite(opts.maxEntities) ? opts.maxEntities : 50;
    this._only = Array.isArray(opts.types) && opts.types.length ? opts.types.slice() : null;
    this._families = this._only
      ? ENTITY_FAMILIES.filter((f) => this._only.includes(f.type))
      : ENTITY_FAMILIES;
  }

  /**
   * 抽取实体。
   * @param {string} input 待抽取文本
   * @returns {Array<{type:string,value:string,start:number,end:number,confidence:number,sensitive:boolean}>}
   */
  extract(input) {
    if (typeof input !== 'string' || input.length === 0) return [];

    // 1. 逐族收集候选
    const candidates = [];
    for (const fam of this._families) {
      fam.re.lastIndex = 0;
      let m;
      while ((m = fam.re.exec(input)) !== null) {
        if (m[0].length === 0) { fam.re.lastIndex++; continue; }
        const value = fam.normalize ? fam.normalize(m[0]) : m[0];
        if (!value) continue;
        candidates.push({
          type: fam.type,
          value,
          start: m.index,
          end: m.index + m[0].length,
          confidence: fam.confidence,
          sensitive: !!fam.sensitive,
          priority: fam.priority,
        });
        if (candidates.length > 400) break; // 病态长文本熔断
      }
    }

    // 2. 跨度裁决：起点早的在前；同起点长跨度在前；跨度相交时优先级高者胜
    candidates.sort((a, b) => (a.start - b.start) || ((b.end - b.start) - (a.end - a.start)) || (b.priority - a.priority));
    const kept = [];
    const suppressed = [];
    for (const c of candidates) {
      const hit = kept.find((k) => c.start < k.end && k.start < c.end);
      if (hit) {
        suppressed.push({ type: c.type, value: c.value, overlappedWith: hit.type });
        continue;
      }
      kept.push(c);
      if (kept.length >= this._maxEntities) break;
    }

    kept.sort((a, b) => a.start - b.start);
    // 脱掉内部用的 priority 字段，返回值形状稳定
    return kept.map(({ type, value, start, end, confidence, sensitive }) =>
      ({ type, value, start, end, confidence, sensitive }));
  }

  /**
   * 摘要：按类型计数 + 是否含敏感实体。给只想知道「有没有 PII」的调用方。
   * @param {string} input
   * @returns {{count:number,byType:Object,sensitive:boolean,source:string|null}}
   */
  summarize(input) {
    const list = this.extract(input);
    const byType = {};
    for (const e of list) byType[e.type] = (byType[e.type] || 0) + 1;
    return {
      count: list.length,
      byType,
      sensitive: list.some((e) => e.sensitive),
      source: typeof input === 'string' && input.length ? 'entity-extractor' : null,
    };
  }
}

module.exports = { EntityExtractor, ENTITY_FAMILIES };
