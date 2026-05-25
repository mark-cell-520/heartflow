#!/usr/bin/env node
/**
 * Test Phenomenology Engine v1.0.0
 */
const path = require('path');
const HF_ROOT = path.resolve(__dirname, '..');

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.log(`  [FAIL] ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// Load module
const { PhenomenologyEngine, PHENOMENOLOGY } = require(path.join(HF_ROOT, 'src/core/consciousness/phenomenology-engine.js'));

console.log('\n=== Phenomenology Engine Tests ===\n');

// Test 1: Module loads
test('Module loads', () => {
  assert(typeof PhenomenologyEngine === 'function', 'Should be a function');
});

// Test 2: Constructor
test('Constructor', () => {
  const pe = new PhenomenologyEngine();
  assert(pe !== undefined, 'Should instantiate');
  assert(Array.isArray(pe.intentionalityHistory), 'Should have intentionalityHistory');
});

// Test 3: Intentionality analysis
test('analyzeIntentionality - belief noema', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeIntentionality('我相信这个决定是对的');
  assert(result.noema.type === 'belief', `Got: ${result.noema.type}`);
  assert(result.intentionality.clarity >= 0.5, `Got: ${result.intentionality.clarity}`);
});

// Test 4: Intentionality - desire noema
test('analyzeIntentionality - desire noema', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeIntentionality('我想要改变现状');
  assert(result.noema.type === 'desire', `Got: ${result.noema.type}`);
});

// Test 5: Intentionality - value noema
test('analyzeIntentionality - value noema', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeIntentionality('这应该是正确的选择');
  assert(result.noema.type === 'value', `Got: ${result.noema.type}`);
});

// Test 6: Existential freedom - basic
test('analyzeExistentialFreedom - high freedom', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeExistentialFreedom('我选择面对这个挑战');
  assert(result.freedom.level === 'transcendent', `Got: ${result.freedom.level}`);
  assert(result.authenticity.isAuthentic, `Authenticity: ${result.authenticity.score}`);
});

// Test 7: Bad faith detection
test('analyzeExistentialFreedom - bad faith essentializing', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeExistentialFreedom('我就是这样的人，没办法改');
  assert(result.badFaith.detected, 'Should detect bad faith');
  assert(result.badFaith.types.includes('essentializing'), `Types: ${result.badFaith.types.join(',')}`);
});

// Test 8: Bad faith - fatalism
test('analyzeExistentialFreedom - bad faith fatalism', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeExistentialFreedom('我只能这样，没有别的办法');
  assert(result.badFaith.types.includes('fatalism'), `Types: ${result.badFaith.types.join(',')}`);
});

// Test 9: Gaze detection
test('analyzeExistentialFreedom - gaze detection', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeExistentialFreedom('别人会怎么看我');
  assert(result.gaze.isBeingWatched, 'Should detect being watched');
  assert(result.gaze.socialPressure > 0.5, `Pressure: ${result.gaze.socialPressure}`);
});

// Test 10: Authenticity assessment
test('analyzeExistentialFreedom - authenticity', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeExistentialFreedom('我不确定，但这是一个选择');
  assert(result.authenticity.score > 0.6, `Score: ${result.authenticity.score}`);
});

// Test 11: Embodiment analysis
test('analyzeEmbodiment - body action', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeEmbodiment('我伸手去拿那本书');
  assert(result.primaryAction === 'reaching', `Got: ${result.primaryAction}`);
  assert(result.hasEmbodiedAwareness, 'Should have embodied awareness');
});

// Test 12: Embodiment - emotional
test('analyzeEmbodiment - emotional embodiment', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeEmbodiment('心里感到沉重和压抑');
  assert(result.emotionalEmbodiment.hasSomaticMarker, 'Should have somatic marker');
  assert(result.emotionalEmbodiment.dominantEmotion === 'heaviness', `Got: ${result.emotionalEmbodiment.dominantEmotion}`);
});

// Test 13: Full analyze
test('analyze - full consciousness quality', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyze('我相信这是正确的选择，虽然不确定结果');
  assert(result.consciousnessQuality > 0 && result.consciousnessQuality <= 1, 
    `Quality: ${result.consciousnessQuality}`);
  assert(result.recommendations.length >= 0, 'Should return recommendations array');
});

// Test 14: quickAnalyze interface
test('quickAnalyze - returns expected shape', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.quickAnalyze('我在思考关于人生选择的问题');
  assert(typeof result.aboutness === 'number', 'aboutness should be number');
  assert(typeof result.clarity === 'number', 'clarity should be number');
  assert(typeof result.authenticity === 'number', 'authenticity should be number');
  assert(typeof result.quality === 'number', 'quality should be number');
  assert(Array.isArray(result.recommendations), 'recommendations should be array');
});

// Test 15: PHENOMENOLOGY constants
test('PHENOMENOLOGY constants defined', () => {
  assert(Array.isArray(PHENOMENOLOGY.NOEMA_TYPES), 'NOEMA_TYPES should be array');
  assert(Array.isArray(PHENOMENOLOGY.NOESIS_TYPES), 'NOESIS_TYPES should be array');
  assert(PHENOMENOLOGY.NOEMA_TYPES.includes('perceptual'), 'Should have perceptual');
  assert(PHENOMENOLOGY.BAD_FAITH_PATTERNS.includes('essentializing'), 'Should have essentializing');
});

// Test 16: Multiple calls don't break state
test('Multiple calls - state isolation', () => {
  const pe = new PhenomenologyEngine();
  const r1 = pe.analyze('我相信', {});
  const r2 = pe.analyze('我想要', {});
  assert(r1.intentionality.noema.type === 'belief', 'First should be belief');
  assert(r2.intentionality.noema.type === 'desire', 'Second should be desire');
});

// Test 17: Aboutness measurement
test('aboutness - explicit about signals', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeIntentionality('我的问题是关于人生选择');
  assert(result.intentionality.aboutnessStrength > 0.6, `Should have high aboutness: ${result.intentionality.aboutnessStrength}`);
});

// Test 18: Empty intentionality detection
test('empty intentionality detection', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeIntentionality('啊啊啊', {});
  assert(result.intentionality.isEmpty === true, `Is empty: ${result.intentionality.isEmpty}`);
});

// Test 19: Constrained freedom detection
test('freedom level - constrained', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.analyzeExistentialFreedom('我必须这样做');
  assert(result.freedom.isConstrained, 'Should detect constraint');
});

// Test 20: GWT integration
test('integrateWithGlobalWorkspace', () => {
  const pe = new PhenomenologyEngine();
  const result = pe.integrateWithGlobalWorkspace();
  assert(typeof result.salienceBoost === 'number', 'Should have salienceBoost');
  assert(result.broadcastPriority === 'phenomenological', 'Should have broadcastPriority');
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);