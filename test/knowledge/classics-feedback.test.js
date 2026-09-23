/**
 * test/knowledge/classics-feedback.test.js
 * HeartFlow 古典规则反哺机制测试
 */

const {
  extractCandidateTerms,
  analyzeRuleCoverage,
  summarizeFeedback,
  suggestFromHits
} = require('../../src/knowledge/classics-feedback');

// [v6.7.86] 加标准汇总行：原先只打 ✓/✗ 列表，run-all.js 抓不到
// 「N 通过, M 失败」判为静默跳过（该测试长期不被计数）。
let _cfPass = 0, _cfFail = 0;
function test(name, fn) {
  try {
    fn();
    _cfPass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    _cfFail++;
    console.log(`  ✗ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}
process.on('exit', () => {
  console.log(`\nclassics-feedback: ${_cfPass} 通过, ${_cfFail} 失败, 共 ${_cfPass + _cfFail} 个`);
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('\n📜 ClassicsFeedback (classics-feedback.js)');

test('extractCandidateTerms 从佛藏文本提取候选词，排除停用词', () => {
  const raw = [
    '慈悲喜舍，无缘大慈，同体大悲，不忍众生苦，拔苦与乐。',
    '般若波罗蜜多，色即是空，空即是色，诸法无我，无自性，缘起性空。'
  ];
  const existing = ['慈悲', '般若', '空', '众生'];
  const out = extractCandidateTerms(raw, existing);
  assert(Array.isArray(out), 'output is array');
  assert(out.length > 0, 'should suggest terms');
  // 不应包含 existing 中的词
  const suggested = out.map(s => s.term);
  assert(!suggested.some(t => existing.includes(t)), 'should exclude existing triggers');
  // 应包含未见过的高频佛学词
  assert(suggested.some(t => t.includes('无缘') || t.includes('同体') || t.includes('喜舍') || t.includes('拔苦与乐')),
    'should suggest unlisted terms');
});

test('extractCandidateTerms 空输入/空数组安全返回', () => {
  assert(extractCandidateTerms([], []).length === 0, 'empty input');
  assert(extractCandidateTerms(null, []).length === 0, 'null input');
});

test('analyzeRuleCoverage 从评估结果提取覆盖建议', () => {
  const evaluation = {
    domain: 'buddhist-suffering',
    findings: [
      {
        signal: 'pass',
        reason: 'wisdom_with_duality_sublation',
        evidence: {
          raw: '般若波罗蜜多，色即是空，空即是色，诸法无我。无缘大慈，同体大悲，不忍众生苦。'
        }
      }
    ],
    hitCount: 2
  };
  const out = analyzeRuleCoverage(evaluation, ['般若', '空', '无我', '慈悲']);
  assert(out.suggestions.length >= 0, 'should return suggestions array');
  assert(out.analyzedFindings === 1, 'analyzedFindings');
  assert(out.hitCount === 2, 'hitCount forwarded');
});

test('summarizeFeedback 汇总多规则反哺建议', () => {
  const results = [
    {
      ruleId: 'fojia-banruo-wuwo',
      evaluation: {
        domain: 'buddhist-suffering',
        findings: [
          { evidence: { raw: '般若波罗蜜多，色即是空，空即是色，诸法无我，无自性，缘起性空。' } }
        ],
        hitCount: 1
      }
    },
    {
      ruleId: 'fojia-cibei-nongge',
      evaluation: {
        domain: 'buddhist-ethics',
        findings: [
          { evidence: { raw: '无缘大慈，同体大悲，慈悲喜舍，拔苦与乐，不忍众生苦。' } }
        ],
        hitCount: 1
      }
    }
  ];
  const out = summarizeFeedback(results);
  assert(out.generatedAt, 'should have timestamp');
  assert(out.totalRules === 2, 'totalRules');
  assert(typeof out.rulesWithSuggestions === 'number', 'rulesWithSuggestions');
  assert(Array.isArray(out.details), 'details array');
});

test('suggestFromHits 直接从 hits 提取建议', () => {
  const hits = [
    { raw: '慈悲喜舍，无缘大慈，同体大悲，不忍众生苦，拔苦与乐。' },
    { raw: '般若波罗蜜多，色即是空，空即是色，诸法无我，无自性。' }
  ];
  const out = suggestFromHits(hits, ['慈悲', '般若', '空', '众生']);
  assert(Array.isArray(out), 'output is array');
  const terms = out.map(s => s.term);
  assert(!terms.some(t => ['慈悲', '般若', '空', '众生'].includes(t)), 'exclude existing');
});
