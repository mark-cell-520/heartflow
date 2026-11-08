/**
 * ResponseCompressor — 回应压缩器 v1.0
 *
 * 把一段偏长的回应压到给定预算内，**保留信息密度高的句子**，砍客套与复读。
 * 交流层的回应不是越长越尽责——把三句话说完的事铺成十句，读者抓不到重点，
 * 重点还被客套话稀释了。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:666 的内联 stub 让
 *   dispatch('translator.responseCompressor') 恒返回 ''
 *   （scripts/tmp-250-probe.js 实测：任意输入都是空字符串）。该路由在
 *   src/mcp-server.js:1056 的 translator 能力清单里广告出去。本文件补真实实现。
 *
 * 设计纪律：
 *   1. 已经在预算内的文本**原样返回**（alreadyConcise:true），不做无意义改写；
 *   2. 打分规则全部可解释——每条被保留/丢弃的句子都能说清理由；
 *   3. 压缩比如实上报（ratio），调用方自己决定要不要用；
 *   4. 抽干后仍然超预算 → 明确标 truncated:true，不假装压下去了。
 */

'use strict';

// 句间打分：命中即加分。数字/结论词/动作句是信息密度信号，客套与口水是负信号。
const SIGNALS = [
  { re: /(?:\d+(?:\.\d+)?\s?[%％]|\d{4}\s?年|[零一二三四五六七八九十百千万亿]+\s?[个位条篇页字行天次年月])/, weight: 1.6, label: '含数量' },
  { re: /(所以|因此|结论|总之|关键|要点|意味着|换句话说|也就是说)/, weight: 1.5, label: '结论词' },
  { re: /(必须|需要|应该|建议|请|不要|别|记得|先|再|最后|步骤)/, weight: 1.2, label: '动作指令' },
  { re: /(因为|由于|如果|除非|否则|前提是|风险|注意|但是|然而)/, weight: 1.0, label: '条件/风险' },
  { re: /(请问|吗|？|\?)/, weight: -0.6, label: '疑问句' },
  { re: /(希望对你有帮助|综上所述|总而言之|值得一提的是|众所周知|一般来说|事实上|其实)/, weight: -1.2, label: '客套/口水' },
  { re: /(非常|真的|特别|超级|相当|十分|极其)/, weight: -0.5, label: '程度副词堆叠' },
];

// 句首可安全剥掉的填充语
const LEAD_FILLER = /^(?:那么|然后就是|就是说|说实话|其实|基本上|总的来说|总而言之|需要注意的是|值得一提的是|大家好|嗯|呃)[，,、\s]*/;

// 分句：中英句末标点 + 换行 + 分号
function splitSentences(text) {
  return String(text)
    .split(/(?<=[。！？!?；;])|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

class ResponseCompressor {
  /**
   * @param {object} [opts]
   * @param {number} [opts.maxLength] 目标字数上限（默认 120）
   * @param {number} [opts.maxSentences] 目标句数上限（默认 4）
   */
  constructor(opts = {}) {
    this._defaultMaxLength = Number.isFinite(opts.maxLength) ? opts.maxLength : 120;
    this._defaultMaxSentences = Number.isFinite(opts.maxSentences) ? opts.maxSentences : 4;
  }

  /**
   * 压缩。
   * @param {string} text 原文
   * @param {object} [opts] {maxLength, maxSentences}
   * @returns {{text:string,originalLength:number,compressedLength:number,ratio:number,
   *            kept:number,dropped:number,alreadyConcise:boolean,truncated:boolean,
   *            sentences:Array<{text:string,score:number,kept:boolean,reason:string}>,
   *            source:string|null}}
   */
  compress(text, opts = {}) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return {
        text: '', originalLength: 0, compressedLength: 0, ratio: 1,
        kept: 0, dropped: 0, alreadyConcise: true, truncated: false,
        sentences: [], source: null,
      };
    }
    const maxLength = Number.isFinite(opts.maxLength) ? opts.maxLength : this._defaultMaxLength;
    const maxSentences = Number.isFinite(opts.maxSentences) ? opts.maxSentences : this._defaultMaxSentences;
    const originalLength = text.length;

    // 1. 已在预算内：原样返回，不制造无意义改写
    const all = splitSentences(text);
    if (originalLength <= maxLength && all.length <= maxSentences) {
      return {
        text, originalLength, compressedLength: originalLength, ratio: 1,
        kept: all.length, dropped: 0, alreadyConcise: true, truncated: false,
        sentences: all.map((s) => ({ text: s, score: 0, kept: true, reason: '已在预算内' })),
        source: 'response-compressor',
      };
    }

    // 2. 打分（首句加权：开场句通常承载主题）
    const scored = all.map((s, i) => {
      let score = 1 + (i === 0 ? 1.0 : 0);
      const hits = [];
      for (const sig of SIGNALS) {
        if (sig.re.test(s)) { score += sig.weight; hits.push(sig.label); }
      }
      // 超长句按长度线性折价（>60 字开始罚）
      if (s.length > 60) score -= Math.min(2, (s.length - 60) / 40);
      const cleaned = s.replace(LEAD_FILLER, '');
      return { text: cleaned, score: Math.round(score * 100) / 100, hits, originalIndex: i };
    });

    // 3. 按分数取 Top-N，再恢复原语序（压缩不能打乱叙事顺序）
    const ranked = scored.slice().sort((a, b) => b.score - a.score);
    const chosen = ranked.slice(0, Math.max(1, maxSentences));

    // 4. 字数预算：按分数顺序继续收，直到放不下为止
    let budget = maxLength;
    const finalSet = [];
    for (const c of chosen) {
      if (finalSet.length > 0 && c.text.length > budget) break;
      finalSet.push(c);
      budget -= c.text.length;
    }
    const keptSet = new Set(finalSet.map((c) => c.originalIndex));

    const keptSentences = scored
      .filter((s) => keptSet.has(s.originalIndex))
      .sort((a, b) => a.originalIndex - b.originalIndex);
    const out = keptSentences.map((s) => s.text).join('');
    // 只在「真的还超字数」时报 truncated；句子数少了但字数达标不算截断
    const truncated = out.length > maxLength;

    return {
      text: out,
      originalLength,
      compressedLength: out.length,
      ratio: Math.round((out.length / originalLength) * 1000) / 1000,
      kept: keptSentences.length,
      dropped: all.length - keptSentences.length,
      alreadyConcise: false,
      truncated,
      sentences: scored
        .slice()
        .sort((a, b) => a.originalIndex - b.originalIndex)
        .map((s) => ({
          text: s.text,
          score: s.score,
          kept: keptSet.has(s.originalIndex),
          reason: keptSet.has(s.originalIndex)
            ? (s.hits.length ? '保留：' + s.hits.join('/') : '保留：基础分')
            : '丢弃：得分 ' + s.score + ' 低于预算内句子',
        })),
      source: 'response-compressor',
    };
  }
}

module.exports = { ResponseCompressor, splitSentences };
