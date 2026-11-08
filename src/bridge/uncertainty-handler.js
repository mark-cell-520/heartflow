/**
 * UncertaintyHandler — 不确定性处理器 v1.0
 *
 * 同一个结论，置信度不同，**说话的方式必须不同**。把 0.3 的猜测用 0.95 的口气
 * 说出来，就是过度自信；把 0.95 的事实裹成「也许可能大概」，就是推责。
 * 本模块把置信度映射成可执行的表述策略：该直说就直说，该加限定就加限定，
 * 该说「我不知道」就明说。
 *
 * [r250] 修复的缺陷：src/core/heartflow.js:681 的内联 stub 让
 *   dispatch('agentLayer.uncertaintyHandler') 恒返回 {}
 *   （scripts/tmp-250-probe.js 实测）。该路由在 src/mcp-server.js:1058 的
 *   agentLayer 能力清单里广告出去。本文件补真实实现。
 *
 * 设计纪律：
 *   1. 输入宽容：裸数字 / confidence-annotator 的 {overall} / {confidence} /
 *      {score} / {level} 都认；认不出就按「无置信度」处理并明说
 *      （confidence:null）——不默认 0.5 假装测过；
 *   2. 每档给**具体措辞**（phrasing），不只给一个档位名；
 *   3. ctx.requireDisclosure 可强制抬档（对外承诺场景宁严勿宽）。
 */

'use strict';

// 档位表：从高到低匹配，第一个 min<=confidence 的生效。
const BANDS = [
  {
    level: 'assert', min: 0.8, hedge: 'none', disclose: false,
    meaning: '证据充分，可直接陈述',
    guidance: '直说，但把依据跟在结论后面；不要加无意义的「可能」',
    phrasing: ['可以直接陈述结论', '补一句依据（数据/来源）', '不要用「也许」「大概」稀释确定结论'],
  },
  {
    level: 'qualified', min: 0.6, hedge: 'light', disclose: false,
    meaning: '大体有把握，边界条件要说清',
    guidance: '加一个前提限定，别把条件结论说成无条件结论',
    phrasing: ['在…条件下，…', '就目前掌握的信息看，…', '这一点取决于…'],
  },
  {
    level: 'hedged', min: 0.4, hedge: 'moderate', disclose: true,
    meaning: '部分依据，需要显式标注不确定性',
    guidance: '明确说清哪一部分是推断、哪一部分是事实',
    phrasing: ['我的判断是…，但依据还不完整', '这部分我没有直接证据，是从…推断的', '建议先验证…再据此行动'],
  },
  {
    level: 'uncertain', min: 0.2, hedge: 'strong', disclose: true,
    meaning: '依据薄弱，不应作为行动依据',
    guidance: '给出验证路径，不要给出可执行结论',
    phrasing: ['这一点我无法确认', '我能确定的是…，其余部分是猜测', '要下结论需要先拿到…'],
  },
  {
    level: 'unknown', min: -Infinity, hedge: 'refuse', disclose: true,
    meaning: '没有可用置信度，不具备下判断的条件',
    guidance: '直接说不知道，并说明缺什么；不要用话术填空',
    phrasing: ['我不知道', '缺的信息是…', '可以这样去查：…'],
  },
];

function pickBand(confidence) {
  for (const b of BANDS) if (confidence >= b.min) return b;
  return BANDS[BANDS.length - 1];
}

class UncertaintyHandler {
  /**
   * @param {object} [opts]
   * @param {number} [opts.discloseBelow] 低于该置信度强制显式披露（默认 0.6）
   */
  constructor(opts = {}) {
    this._discloseBelow = Number.isFinite(opts.discloseBelow) ? opts.discloseBelow : 0.6;
  }

  /**
   * 解析任意形状的置信度输入。
   * @returns {{confidence:number|null, from:string|null}}
   */
  parseConfidence(conf) {
    if (typeof conf === 'number' && isFinite(conf)) {
      return { confidence: Math.max(0, Math.min(1, conf)), from: 'number' };
    }
    if (conf && typeof conf === 'object') {
      const keys = ['overall', 'confidence', 'score', 'level', 'value'];
      for (const k of keys) {
        if (typeof conf[k] === 'number' && isFinite(conf[k])) {
          return { confidence: Math.max(0, Math.min(1, conf[k])), from: 'object.' + k };
        }
      }
      // confidence-annotator 的 dimensions 形态：取三维均值，并说明来源
      const d = conf.dimensions;
      if (d && typeof d === 'object') {
        const vals = Object.values(d).filter((v) => typeof v === 'number' && isFinite(v));
        if (vals.length) {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          return { confidence: Math.round(avg * 1000) / 1000, from: 'object.dimensions(avg)' };
        }
      }
    }
    return { confidence: null, from: null };
  }

  /**
   * 给出表述策略。
   * @param {number|object|null} conf 置信度
   * @param {object} [ctx] {topic, requireDisclosure, stance}
   * @returns {{level:string,hedge:string,disclose:boolean,confidence:number|null,
   *            parsedFrom:string|null,phrasing:string[],guidance:string,meaning:string,
   *            sayUnknown:boolean,source:string|null}}
   */
  handle(conf, ctx = {}) {
    const { confidence, from } = this.parseConfidence(conf);

    // 无置信度 → 未知档，且明说「没测到」而不是默认中值
    if (confidence === null) {
      const b = BANDS[BANDS.length - 1];
      return {
        level: b.level, hedge: b.hedge, disclose: true,
        confidence: null, parsedFrom: null,
        phrasing: b.phrasing.slice(), guidance: b.guidance, meaning: b.meaning,
        sayUnknown: true,
        source: 'uncertainty-handler',
      };
    }

    let band = pickBand(confidence);
    // 强制披露/抬档：对外承诺场景（ctx.requireDisclosure）或低置信度
    let bumped = false;
    if (ctx.requireDisclosure && !band.disclose && confidence < 0.9) {
      const idx = BANDS.indexOf(band);
      const stricter = BANDS[Math.min(idx + 1, BANDS.length - 1)];
      if (stricter !== band) { band = stricter; bumped = true; }
    }

    const disclose = band.disclose || confidence < this._discloseBelow;
    return {
      level: band.level,
      hedge: band.hedge,
      disclose,
      confidence,
      parsedFrom: from,
      bumped,
      phrasing: band.phrasing.slice(),
      guidance: band.guidance,
      meaning: band.meaning,
      sayUnknown: band.level === 'unknown',
      source: 'uncertainty-handler',
    };
  }
}

module.exports = { UncertaintyHandler, BANDS };
