/**
 * 联想图谱格式桥接器 (v6.8.1 第 541 轮)
 *
 * ## 问题实测
 * 引擎内有两套互不相通的联想图谱：
 *
 * 1. `src/core/associative-engine/association-graph.json`（L1 的 `loadGraph()` 读这个）
 *    - 2045 个节点，**全部是空数组** → L1 永远查不到任何关联
 *
 * 2. `dict-data/association-graph.json`（生成脚本写这个）
 *    - 2388 个节点（`{id, word, category, tags, embedding}`）+ **7877 条真实边**
 *      （`{source, target, weight}`，weight 0.2~1.0）
 *    - 格式是「节点数组 + 边数组」，与 L1 期待的「`{word: [{word, strength, relation}]}`
 *      字典」**永久对不上**
 *
 * 实测重叠：src 的 2045 词里只有 148 个出现在 dict-data 中，dict-data 有 1752 个词
 * 在 src 索引里完全不存在（性能/日志/配置/重构/编程/开发/架构…）。所以这不是
 * 「补数据」，而是**两套词表 + 两套格式都从未对齐过**。
 *
 * ## 本模块做什么
 * 把 dict-data 的「节点+边」格式转成 L1 的「字典+边列表」格式，合并进 L1 的 graph。
 * 转换后的每个关联项满足 L1 `associateWord()` / `getAssociations()` 的读取契约：
 *   `{ word, relation, strength, emotion, frequency, lastUsed }`
 * 其中 `strength` 直接取边的 weight，因此 pruningThreshold(0.05) 之上的边全部保留
 * （dict-data 的 weight 最低 0.2，天然高于阈值）。
 *
 * ## 设计约束
 * - 零依赖，不改 dict-data 原文件（生成器的产物保持原样）
 * - 幂等：重复调用不产生重复关联项
 * - 分块构建 + 惰性：2388 节点 / 7877 边的转换在构造时一次性完成，不进入热路径
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_DICT = 'dict-data/association-graph.json';

// dict-data 的 category → L1 期望的 relation 语义标签
// L1 自带的关系标签只有 谐音/承接/叠词/音近（见 lexical-associator.js），
// 这里映射为「同域共现」，保留 category 信息在 edge.category 上供后续消歧使用。
const RELATION_FROM_CATEGORY = {
  programming: '同域共现::技术',
  emotion: '同域共现::情绪',
  flow: '同域共现::心流',
  philosophy: '同域共现::哲思',
  psychology: '同域共现::心理',
  neuroscience: '同域共现::神经',
  cognition: '同域共现::认知',
  self: '同域共现::自我',
  ethics: '同域共现::伦理',
  spirituality: '同域共现::灵性',
  language: '同域共现::语言',
  culture: '同域共现::文化',
};

class AssociationGraphBridge {
  /**
   * @param {string} projectRoot 项目根目录
   * @param {Object} [opts]
   * @param {string} [opts.dictFile] dict-data 图谱相对路径
   * @param {number} [opts.maxPerNode] 每个节点最多保留的关联数（L1 默认 50）
   */
  constructor(projectRoot, opts = {}) {
    this.projectRoot = projectRoot;
    this.dictFile = path.resolve(projectRoot, opts.dictFile || DEFAULT_DICT);
    this.maxPerNode = opts.maxPerNode || 50;
    this.stats = { loaded: false, nodeCount: 0, edgeCount: 0, skippedEdges: 0, error: null };
  }

  /**
   * 读取并解析 dict-data 图谱。任何异常都不抛（L1 的 loadGraph 会兜底为空图）。
   * @returns {{nodes: Object, edges: Array}|null}
   */
  _loadDict() {
    try {
      if (!fs.existsSync(this.dictFile)) {
        this.stats.error = 'dict file not found: ' + this.dictFile;
        return null;
      }
      return JSON.parse(fs.readFileSync(this.dictFile, 'utf8'));
    } catch (e) {
      this.stats.error = e.message;
      return null;
    }
  }

  /**
   * 把「节点数组 + 边数组」转成 L1 的字典格式。
   *
   * 产物结构：
   *   {
   *     nodes: { '代码': [{word:'算法', relation:'同域共现::技术', strength:0.86, ...}], ... },
   *     edges: [ {source:'代码', target:'算法', weight:0.86, category:'programming'} ],  // 扁平边，便于统计/调试
   *     _bridgedFrom: 'dict-data/association-graph.json'
   *   }
   *
   * @param {Object} dict 解析后的 dict-data 图谱
   * @returns {{nodes: Object, edges: Array, _bridgedFrom: string}}
   */
  convert(dict) {
    const nodes = {};
    const edges = [];
    if (!dict || !Array.isArray(dict.nodes)) return { nodes, edges, _bridgedFrom: DEFAULT_DICT };

    // id → node 反查
    const byId = new Map();
    for (const n of dict.nodes) {
      if (n && typeof n === 'object' && n.id != null) byId.set(String(n.id), n);
    }

    const categoryOf = new Map(); // word → category
    for (const n of dict.nodes) {
      if (n && typeof n.word === 'string' && n.category) categoryOf.set(n.word, n.category);
    }

    // 双向建边：L1 的 associateWord 是查「一个词的相邻」，
    // dict-data 的边是有向的（source→target），转成双向邻居才能让 L1 从任一方向命中。
    const rawEdges = Array.isArray(dict.edges) ? dict.edges : [];
    let skipped = 0;

    const push = (word, targetWord, weight, category) => {
      if (typeof word !== 'string' || typeof targetWord !== 'string' || !word || !targetWord) return;
      if (word === targetWord) return;
      const w = Number(weight);
      if (!Number.isFinite(w) || w <= 0) return;
      if (!nodes[word]) nodes[word] = [];
      const relation = RELATION_FROM_CATEGORY[category] || '同域共现';
      const entry = {
        word: targetWord,
        relation,
        strength: w,
        emotion: { pleasure: 0, arousal: 0, dominance: 0 },
        frequency: 1,
        lastUsed: null,
      };
      nodes[word].push(entry);
    };

    for (const e of rawEdges) {
      if (!e || typeof e !== 'object') { skipped++; continue; }
      const s = byId.get(String(e.source));
      const t = byId.get(String(e.target));
      if (!s || !t || !s.word || !t.word) { skipped++; continue; }

      const category = categoryOf.get(s.word) || categoryOf.get(t.word) || null;

      // 正向
      push(s.word, t.word, e.weight, category);
      // 反向（同一 category 语义）
      push(t.word, s.word, e.weight, category);

      edges.push({
        source: s.word,
        target: t.word,
        weight: Number(e.weight),
        category: category || 'unknown',
      });
    }

    // 每个节点按 strength 降序、截断到 maxPerNode，去重同 word（保留最高 strength）
    for (const [word, list] of Object.entries(nodes)) {
      const best = new Map();
      for (const item of list) {
        const prev = best.get(item.word);
        if (!prev || item.strength > prev.strength) best.set(item.word, item);
      }
      const trimmed = [...best.values()]
        .sort((a, b) => b.strength - a.strength)
        .slice(0, this.maxPerNode);
      nodes[word] = trimmed;
    }

    this.stats = {
      loaded: true,
      nodeCount: Object.keys(nodes).length,
      edgeCount: edges.length,
      skippedEdges: skipped,
      error: null,
    };
    return { nodes, edges, _bridgedFrom: DEFAULT_DICT };
  }

  /**
   * 把桥接结果合并进 L1 已加载的 graph（就地修改，幂等）。
   *
   * 幂等实现：合并前检查 `graph._bridgedFrom` 是否已等于本桥的源文件；
   * 已桥接过则直接跳过，避免重复构造导致关联项翻倍。
   *
   * @param {Object} graph L1 的 `this.graph`（必须已有 `nodes` 对象）
   * @returns {{merged: boolean, addedWords: number, addedEdges: number, reason?: string}}
   */
  applyTo(graph) {
    if (!graph || typeof graph !== 'object' || !graph.nodes || typeof graph.nodes !== 'object') {
      return { merged: false, addedWords: 0, addedEdges: 0, reason: 'graph shape invalid' };
    }
    if (graph._bridgedFrom === DEFAULT_DICT) {
      return { merged: false, addedWords: 0, addedEdges: 0, reason: 'already bridged' };
    }

    const dict = this._loadDict();
    if (!dict) {
      return { merged: false, addedWords: 0, addedEdges: 0, reason: this.stats.error || 'load failed' };
    }

    const bridged = this.convert(dict);
    let addedWords = 0;
    let addedEdges = 0;

    for (const [word, list] of Object.entries(bridged.nodes)) {
      if (!Array.isArray(graph.nodes[word]) || graph.nodes[word].length === 0) {
        // src 侧没有该词或该词是空数组 → 直接采用桥接结果
        if (!Array.isArray(graph.nodes[word]) || graph.nodes[word].length === 0) addedWords++;
        graph.nodes[word] = list;
        addedEdges += list.length;
      } else {
        // src 侧已有内容（未来若补上数据）→ 追加桥接项，保留原有，去重按 word 取最高 strength
        const existing = new Map(graph.nodes[word].map(x => [x.word, x]));
        let delta = 0;
        for (const item of list) {
          const prev = existing.get(item.word);
          if (!prev) { graph.nodes[word].push(item); existing.set(item.word, item); delta++; }
          else if (item.strength > prev.strength) {
            // 保留更强的一条：替换 relation/strength，保留原 frequency
            prev.strength = item.strength;
            prev.relation = item.relation;
            prev.lastUsed = item.lastUsed;
          }
        }
        addedEdges += delta;
      }
    }

    graph._bridgedFrom = DEFAULT_DICT;
    if (graph.metadata) {
      graph.metadata.wordCount = Object.keys(graph.nodes).length;
      graph.metadata.bridgedFrom = DEFAULT_DICT;
      graph.metadata.bridgedAt = new Date().toISOString();
    }
    return { merged: true, addedWords, addedEdges };
  }

  getStats() {
    return Object.assign({ dictFile: this.dictFile }, this.stats);
  }
}

module.exports = { AssociationGraphBridge, DEFAULT_DICT, RELATION_FROM_CATEGORY };
