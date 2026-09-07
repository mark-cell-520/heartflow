/**
 * test/knowledge/classics-value-mapper.test.js
 */
const { evaluate, matchDomain, searchClassics } = require('../../src/knowledge/classics-value-mapper');

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
    ['matchDomain returns null for modern tech', () => {
      const r = matchDomain('部署 kubernetes 集群');
      if (r) throw new Error('expected null for non-classics');
    }],
    ['evaluate returns hits for classics', () => {
      const out = evaluate('如何治国平天下');
      if (!out.classicsRelevant) throw new Error('expected classicsRelevant=true');
      if (!out.retrieval.scope) throw new Error('expected non-empty scope');
    }],
    ['searchClassics returns raw hits', () => {
      const out = searchClassics('仁义', '儒藏/四书');
      if (!Array.isArray(out.hits)) throw new Error('hits should be array');
    }]
  ];
  for (const [name, fn] of cases) {
    try { fn(); } catch (e) { failures.push(`${name}: ${e.message}`); }
  }
  if (failures.length) {
    console.log('FAILURES:', failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`classics-value-mapper: ${cases.length} cases passed`);
  }
};
