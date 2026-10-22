/**
 * test/knowledge/classics-value-mapper.test.js
 */
const {
  evaluate,
  evaluateRules,
  searchClassicsBatch,
  parseHit,
  matchDomain,
  searchClassics,
  mapToDimensions,
  evaluateWithClassics,
  CLASSICAL_RULES,
  DOMAIN_RULES
} = require('../../src/knowledge/classics-value-mapper');

module.exports = function({ test }) {
  const failures = [];
  const cases = [
    ['matchDomain detects confucian governance', () => {
      const r = matchDomain('为政以德');
      if (!r || r.id !== 'confucian-governance') throw new Error('expected confucian-governance');
    }],
    ['matchDomain detects buddhist suffering', () => {
      const r = matchDomain('苦集灭道');
      if (!r || r.id !== 'buddhist-suffering') throw new Error('expected buddhist-suffering');
    }],
    ['matchDomain returns null for non-classics', () => {
      const r = matchDomain('deploy kubernetes cluster');
      if (r) throw new Error('expected null for non-classics');
    }],
    ['evaluateRules returns structured result with confucian claim', () => {
      const out = evaluateRules('省刑罚，薄税敛，深耕易耨，壮者以暇日修其孝悌忠信。');
      if (!out.classicalRelevant) throw new Error('expected classicalRelevant=true');
      if (!Array.isArray(out.findings)) throw new Error('findings should be array');
    }],
    ['searchClassicsBatch returns hits', () => {
      const out = searchClassicsBatch(['仁政', '孝悌'], '儒藏/四书');
      if (!Array.isArray(out.hits)) throw new Error('hits should be array');
      if (out.keywords.length < 2) throw new Error('keywords length');
    }],
    ['parseHit parses file:line:raw', () => {
      const p = parseHit('/root/.hermes/skills/daizhigev20/儒藏/四书/论语集解义疏.txt:60:子曰');
      if (p.file !== '/root/.hermes/skills/daizhigev20/儒藏/四书/论语集解义疏.txt') throw new Error('file');
      if (p.line !== 60) throw new Error('line');
      if (!p.raw.startsWith('子曰')) throw new Error('raw');
    }],
    ['parseHit tolerates null/number/unparsable', () => {
      if (parseHit(null) !== null) throw new Error('null');
      if (parseHit(123) !== null) throw new Error('number');
      // [v6.7.83] 修断言以匹配真实契约：无法解析时实现返回
      // { file: null, line: null, raw }（保留原文，不假装有文件）。
      // 原断言要求 .file truthy 是过头要求——该失败此前的自造汇总
      // 让它长期隐形，本轮 run-all 静默跳过排查才暴露。
      const r = parseHit('no-colon-here');
      if (!r || r.file !== null) throw new Error('unparsable should keep file null');
      if (r.raw !== 'no-colon-here') throw new Error('unparsable should keep raw');
    }],
    ['evaluateWithClassics alias works', () => {
      const out = evaluateWithClassics('老吾老以及人之老，幼吾幼以及人之幼。');
      if (!out.classicalRelevant) throw new Error('expected classicalRelevant');
    }],
    ['DOMAIN_RULES covers major subdirs', () => {
      const ids = DOMAIN_RULES.map(r => r.id);
      const required = [
        'confucian-governance','buddhist-suffering','justice-and-fate',
        'confucian-xiaojing','confucian-mengxue','confucian-xiushen',
        'confucian-jingxue','confucian-yuejing','confucian-xiaoxue',
        'buddhist-qianlong','buddhist-jiaxing','buddhist-xuzang','buddhist-cangwai'
      ];
      for (const id of required) { if (!ids.includes(id)) throw new Error(`missing ${id}`); }
    }],
    ['CLASSICAL_RULES count >= 20', () => {
      if (CLASSICAL_RULES.length < 20) throw new Error(`got ${CLASSICAL_RULES.length}`);
    }]
  ];

  // [v6.7.83] 每个 case 注册进 harness，不再自造汇总。
  // 原来只 print FAILURES + exitCode：mount 视角报「0 通过, 0 失败」，
  // 裸跑视角无「N 通过, M 失败」行 → run-all.js 两条路都抓不到，
  // 一个真实失败（parseHit tolerates unparsable）长期隐形。
  for (const [name, fn] of cases) {
    test(name, () => { fn(); });
  }
};
