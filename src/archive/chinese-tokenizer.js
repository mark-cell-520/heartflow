/**
 * ChineseTokenizer — 中文分词器（零依赖）
 *
 * 存在理由：HeartFlow 的联想理解链（L1-L5）原本只按「空白 + 英文标点」切分，
 * 中文自然语句不存在这种分隔形态，因此整句恒为 1 个 token → 词典永不命中 →
 * L1 联想 0 条 / L2 chunks 0 / L3 空关键词，6942 行链路对中文完全空转。
 *
 * 策略：正向最长匹配（greedy longest-match）+ 单字回退。
 *  · 第一步沿用原契约：按空白和英文/半角标点切分（保证英文与既有样本零影响）
 *  · 第二步中文片段进一步处理：
 *      - 中文标点视作分隔符（与原「标点即分隔」契约一致）
 *      - CJK ↔ 非 CJK（字母/数字）边界强制切开，保证「API接口」能切出「接口」
 *      - 对每个连续中文串从最长词向最短词贪心匹配，命中即出词
 *      - 未命中任何词时回退单字（成语检测依赖字序列，不能丢字）
 *
 * 词表来源：引擎自带数据文件，不引第三方词典（零依赖铁律）。
 *   · src/core/associative-engine/association-graph.json 的节点键
 *   · src/core/associative-engine/narrative-prototypes.json 的 keywords
 *   · src/core/associative-engine/idiom-story-db.json 的中文条键
 *
 * 性能约束：词表按长度分桶为 Set，查询 O(1)；单次切分与文本长度线性。
 */

const fs = require('fs');
const path = require('path');

const CJK_RE = /[\u4e00-\u9fff]/;

// 中文及全角标点（作为分隔符）
const ZH_PUNCT_RE = /[\u3000-\u303f\uff01-\uff5e\u2018-\u201d\u2026\u2014]+/;

// 原 tokenize 的空白/半角标点分隔契约（保持不变）
const LEGACY_SPLIT_RE = /[\s,\.!?;:'"()（）【】《》]+/;

const DEFAULT_MAX_WORD_LEN = 8;

const DICT_SOURCES = [
  {
    file: 'src/core/associative-engine/association-graph.json',
    extract: (data) => Object.keys(data.nodes || {}),
  },
  {
    file: 'src/core/associative-engine/narrative-prototypes.json',
    extract: (data) => {
      const out = [];
      for (const proto of Object.values(data.prototypes || {})) {
        if (Array.isArray(proto.keywords)) out.push(...proto.keywords);
      }
      return out;
    },
  },
  {
    file: 'src/core/associative-engine/idiom-story-db.json',
    extract: (data) => {
      const out = [];
      for (const section of ['idioms', 'poetry', 'proverbs']) {
        out.push(...Object.keys(data[section] || {}));
      }
      return out;
    },
  },
];

class ChineseTokenizer {
  /**
   * @param {string} projectRoot 项目根目录（用于定位词表数据文件）
   * @param {object} [options]
   * @param {number} [options.maxWordLen] 最长词长度上限（默认 8）
   * @param {Set<string>} [options.dictionary] 外部注入词表（测试用）
   * @param {boolean} [options.lazy] 惰性构建词表（默认 true）
   */
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot || process.cwd();
    this.maxWordLen = options.maxWordLen || DEFAULT_MAX_WORD_LEN;
    this.dictionary = null;
    this.buckets = new Map();
    this.bucketLengths = [];
    this.loadErrors = [];
    this.built = false;

    if (options.dictionary) {
      this.dictionary = options.dictionary instanceof Set
        ? options.dictionary
        : new Set(options.dictionary);
      this._buildBuckets();
      this.built = true;
    } else if (options.lazy !== false) {
      // 惰性：首次 segment() 时才读盘
      this.built = false;
    } else {
      this.loadDictionary();
    }
  }

  /**
   * 从引擎自带数据文件构建词表
   * @returns {Set<string>} 词表
   */
  loadDictionary() {
    if (this.built && this.dictionary) return this.dictionary;

    const words = new Set();
    this.loadErrors = [];

    for (const source of DICT_SOURCES) {
      const file = path.join(this.projectRoot, source.file);
      try {
        if (!fs.existsSync(file)) {
          this.loadErrors.push({ file: source.file, reason: 'missing' });
          continue;
        }
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const extracted = source.extract(data) || [];
        for (const w of extracted) {
          if (typeof w !== 'string') continue;
          const clean = w.trim();
          if (!clean) continue;
          // 只收对分词有意义的候选：纯中文、或含中文的混合词
          if (!CJK_RE.test(clean)) continue;
          if (clean.length > this.maxWordLen) continue;
          words.add(clean);
        }
      } catch (e) {
        this.loadErrors.push({ file: source.file, reason: e.message });
      }
    }

    this.dictionary = words;
    this._buildBuckets();
    this.built = true;
    return words;
  }

  _buildBuckets() {
    this.buckets = new Map();
    for (const w of this.dictionary) {
      if (!w || w.length < 2) continue; // 单字走回退，不占桶
      if (!this.buckets.has(w.length)) this.buckets.set(w.length, new Set());
      this.buckets.get(w.length).add(w);
    }
    this.bucketLengths = [...this.buckets.keys()].sort((a, b) => b - a);
  }

  /**
   * 切分为 token 序列（主入口）
   * @param {string} text 输入文本
   * @returns {string[]} token 数组
   */
  tokenize(text) {
    if (typeof text !== 'string' || text.length === 0) return [];
    if (!this.built) this.loadDictionary();
    return this._segment(text);
  }

  /**
   * alias：与 LexicalAssociator.tokenize / ChunkDetector.tokenize 同名同义
   */
  segment(text) {
    return this.tokenize(text);
  }

  /**
   * 字级切分：中文切成单字序列，英文/数字保持整词。
   *
   * 存在理由：L2 ChunkDetector 的成语/俗语/诗词检测按「字序列」设计
   * （`words.slice(i, i+4).join('')` 还原连续 4 字与词库精确比对）。
   * 若给它词级切分，跨词拼接会产生假阳性、而完整成词又会因
   * `startIndex + 4 > words.length` 被跳过。字级切分是该检测层的正确前提。
   *
   * @param {string} text 输入文本
   * @returns {string[]} 字/词 token 数组
   */
  tokenizeChars(text) {
    if (typeof text !== 'string' || text.length === 0) return [];
    const out = [];
    const raw = text.split(LEGACY_SPLIT_RE).filter(w => w.length > 0);
    for (const frag of raw) {
      if (!CJK_RE.test(frag)) {
        out.push(frag);
        continue;
      }
      const subFrags = frag.split(ZH_PUNCT_RE).filter(s => s.length > 0);
      for (const sf of subFrags) {
        for (const run of this._splitCJKBoundaries(sf)) {
          if (!CJK_RE.test(run)) {
            if (run.length > 0) out.push(run);
            continue;
          }
          for (const ch of run) out.push(ch);
        }
      }
    }
    return out;
  }

  _segment(text) {
    const out = [];
    const raw = text.split(LEGACY_SPLIT_RE).filter(w => w.length > 0);
    for (const frag of raw) {
      if (!CJK_RE.test(frag)) {
        out.push(frag);
        continue;
      }
      this._segmentCJKFragment(frag, out);
    }
    return out;
  }

  _segmentCJKFragment(frag, out) {
    // 中文标点视作分隔符
    const subFrags = frag.split(ZH_PUNCT_RE).filter(s => s.length > 0);
    for (const sf of subFrags) {
      // CJK ↔ 非 CJK 边界强制切开，保证混合串不被单字化
      for (const run of this._splitCJKBoundaries(sf)) {
        if (!CJK_RE.test(run)) {
          out.push(run);
          continue;
        }
        this._segmentCJKRun(run, out);
      }
    }
  }

  /**
   * 在 CJK 与非 CJK 的边界切开（如「API接口」→ ["API","接口"]）
   */
  _splitCJKBoundaries(s) {
    return s.split(/(?<=[\u4e00-\u9fff])(?=[^\u4e00-\u9fff])|(?<=[^\u4e00-\u9fff])(?=[\u4e00-\u9fff])/)
      .filter(r => r.length > 0);
  }

  _segmentCJKRun(run, out) {
    let i = 0;
    const n = run.length;
    while (i < n) {
      let matched = null;
      for (const len of this.bucketLengths) {
        if (len > n - i) continue;
        const cand = run.substr(i, len);
        if (this.buckets.get(len).has(cand)) {
          matched = cand;
          break;
        }
      }
      if (matched) {
        out.push(matched);
        i += matched.length;
      } else {
        out.push(run.substr(i, 1)); // 单字回退
        i += 1;
      }
    }
  }

  /**
   * 统计信息
   */
  getStats() {
    if (!this.built) this.loadDictionary();
    return {
      dictionarySize: this.dictionary.size,
      bucketCount: this.buckets.size,
      bucketLengths: this.bucketLengths.slice(),
      maxWordLen: this.maxWordLen,
      loadErrors: this.loadErrors.slice(),
    };
  }
}

// ── 模块级共享实例：避免每次构造 LexicalAssociator 都重读三个 JSON ──
let _shared = null;
function getShared(projectRoot) {
  if (!_shared) {
    _shared = new ChineseTokenizer(projectRoot, { lazy: true });
  }
  return _shared;
}

module.exports = {
  ChineseTokenizer,
  getShared,
  CJK_RE,
  ZH_PUNCT_RE,
  LEGACY_SPLIT_RE,
  DEFAULT_MAX_WORD_LEN,
};
