/**
 * test/knowledge/classics-rules.test.js
 * HeartFlow 古典规则引擎测试
 */

const { evaluateRules, evaluate, CLASSICAL_RULES } = require('../../src/knowledge/classics-rules');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('\n📜 ClassicsRules (classics-rules.js)');

test('CLASSICAL_RULES 非空且每条含 id/source/canonical/trigger/evaluator/dimensions', () => {
  assert(Array.isArray(CLASSICAL_RULES) && CLASSICAL_RULES.length >= 5, 'rules count');
  for (const r of CLASSICAL_RULES) {
    assert(r.id, `missing id in ${r.source}`);
    assert(r.source, 'missing source');
    assert(r.canonical, 'missing canonical');
    assert(Array.isArray(r.trigger) && r.trigger.length, `missing trigger in ${r.id}`);
    assert(typeof r.evaluator === 'function', `missing evaluator in ${r.id}`);
    assert(Array.isArray(r.dimensions) && r.dimensions.length, `missing dimensions in ${r.id}`);
  }
});

test('evaluateRules 命中孟子仁政完整主张 → pass', () => {
  const out = evaluateRules('地方百里而可以王。王如施仁政于民，省刑罚，薄税敛，深耕易耨。');
  assert(out.classicalRelevant === true, 'should be relevant');
  const pass_ = out.summary.passes;
  assert(pass_ >= 1, `expect >=1 pass, got ${pass_}`);
});

test('evaluateRules 空泛仁政主张 → warn', () => {
  const out = evaluateRules('只要实行仁政，就能王天下。');
  assert(out.classicalRelevant === true, 'should be relevant');
  assert(out.summary.warnings >= 1, `expect >=1 warning, got ${out.summary.warnings}`);
});

test('evaluateRules 义利之辨+公私框架 → reference', () => {
  const out = evaluateRules('为国者不以利为利，以义为利；上下交征利而国危。');
  assert(out.classicalRelevant === true, 'should be relevant');
  const refs = out.summary.references;
  assert(refs >= 1, `expect >=1 reference, got ${refs}`);
});

test('evaluateRules 正名命题 → reference/pass', () => {
  const out = evaluateRules('名不正则言不顺，言不顺则事不成；故君子名之必可言也。');
  assert(out.classicalRelevant === true, 'should be relevant');
  assert(out.summary.references + out.summary.passes >= 1, 'expect reference or pass');
});

test('evaluateRules 恻隐之心+推恩 → pass', () => {
  const out = evaluateRules('老吾老以及人之老，幼吾幼以及人之幼，天下可运于掌。');
  assert(out.classicalRelevant === true, 'should be relevant');
  assert(out.summary.passes >= 1, `expect >=1 pass, got ${out.summary.passes}`);
});

test('evaluateRules 无古典关联 → skip_classics', () => {
  const out = evaluateRules('今天天气怎么样');
  assert(out.classicalRelevant === false, 'should be irrelevant');
  const top = evaluate('今天天气怎么样');
  assert(top.recommendedAction === 'skip_classics', 'skip_classics');
});

test('evaluate 返回兼容 classicsRelevant + domain + dimensions + hits', () => {
  const out = evaluate('仁政');
  assert(out.classicsRelevant === true, 'classicsRelevant');
  assert(typeof out.domain === 'string', 'domain string');
  assert(Array.isArray(out.dimensions), 'dimensions array');
  assert(Array.isArray(out.hits), 'hits array');
  assert(typeof out.hitCount === 'number', 'hitCount');
  assert(out.classicalRules && typeof out.classicalRules.summary === 'object', 'classicalRules.summary');
});

test('evaluateRules 慈悲+众生 → pass', () => {
  const out = evaluateRules('慈悲喜舍，无缘大慈，同体大悲，不忍众生苦。');
  assert(out.classicalRelevant === true, 'should be relevant');
  assert(out.summary.passes >= 1, `expect >=1 pass, got ${out.summary.passes}`);
});

test('evaluateRules 般若空性术语 → pass/reference', () => {
  const out = evaluateRules('般若波罗蜜多，色即是空，空即是色，诸法无我。');
  assert(out.classicalRelevant === true, 'should be relevant');
  assert(out.summary.passes + out.summary.references >= 1, 'expect pass or reference');
});

test('evaluateRules 戒律+因果 → pass', () => {
  const out = evaluateRules('持五戒、行十善，因果报应，善有善果，恶有恶报。');
  assert(out.classicalRelevant === true, 'should be relevant');
  assert(out.summary.passes >= 1, `expect >=1 pass, got ${out.summary.passes}`);
});

test('evaluateRules 四谛八正道 → pass/reference', () => {
  const out = evaluateRules('四谛：苦集灭道；八正道：正见、正思惟、正语、正业、正命、正精进、正念、正定。');
  assert(out.classicalRelevant === true, 'should be relevant');
  assert(out.summary.passes + out.summary.references >= 1, 'expect pass or reference');
});
