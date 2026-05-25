/**
 * Test script for Metacognitive Executive Controller
 * Paper: Roebers (2017) - Executive function and metacognition
 */

'use strict';

const path = require('path');
const HF_ROOT = path.resolve(__dirname, '..');
const {
  ExecutiveFunctionDetector,
  MetacognitiveMonitor,
  MetacognitiveExecutiveController,
  VERSION,
  PAPER
} = require(path.join(HF_ROOT, 'src/core/metacognitive-executive.js'));

console.log('='.repeat(60));
console.log('Metacognitive Executive Controller Test');
console.log('Paper:', PAPER.title);
console.log('Author:', PAPER.author, PAPER.year, '| Citations:', PAPER.citations);
console.log('Version:', VERSION);
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// Test 1: ExecutiveFunctionDetector
console.log('\n--- ExecutiveFunctionDetector Tests ---');

test('ExecutiveFunctionDetector should initialize', () => {
  const detector = new ExecutiveFunctionDetector();
  assert(detector.capabilities.inhibition > 0);
  assert(detector.capabilities.workingMemory > 0);
  assert(detector.capabilities.cognitiveFlexibility > 0);
});

test('ExecutiveFunctionDetector should detect high impulsivity', () => {
  const detector = new ExecutiveFunctionDetector();
  const result = detector.detect({ 
    text: '我不管了，立刻马上做！',
    riskAssessment: []
  });
  assert(result.inhibition.score < 0.6, 'Should detect low inhibition');
});

test('ExecutiveFunctionDetector should detect good inhibition', () => {
  const detector = new ExecutiveFunctionDetector();
  const result = detector.detect({ 
    text: '先等等，考虑一下再决定',
    riskAssessment: ['risk1', 'risk2', 'risk3']
  });
  assert(result.inhibition.score > 0.6, 'Should detect good inhibition');
});

test('ExecutiveFunctionDetector should detect multi-step reasoning', () => {
  const detector = new ExecutiveFunctionDetector();
  const result = detector.detect({ 
    text: '首先分析问题，其次制定计划，然后再执行',
    options: ['opt1', 'opt2', 'opt3', 'opt4']
  });
  assert(result.workingMemory.score > 0.7, 'Should detect good working memory');
});

test('ExecutiveFunctionDetector should detect cognitive flexibility', () => {
  const detector = new ExecutiveFunctionDetector();
  const result = detector.detect({ 
    text: '另一方面，然而，反过来说，这也有道理',
    options: ['opt1', 'opt2', 'opt3']
  });
  assert(result.cognitiveFlexibility.score > 0.7, 'Should detect good flexibility');
});

test('ExecutiveFunctionDetector should generate recommendations', () => {
  const detector = new ExecutiveFunctionDetector();
  const result = detector.detect({ text: '立刻做！', riskAssessment: [] });
  assert(result.recommendations.length > 0, 'Should have recommendations');
});

// Test 2: MetacognitiveMonitor
console.log('\n--- MetacognitiveMonitor Tests ---');

test('MetacognitiveMonitor should initialize', () => {
  const monitor = new MetacognitiveMonitor();
  assert(monitor.capabilities.knowledgeOfCognition > 0);
  assert(monitor.capabilities.regulationOfCognition > 0);
});

test('MetacognitiveMonitor should detect reflection', () => {
  const monitor = new MetacognitiveMonitor();
  const result = monitor.monitor({ 
    text: '我意识到我的想法可能有问题'
  });
  assert(result.knowledgeOfCognition.score > 0.7, 'Should detect self-reflection');
});

test('MetacognitiveMonitor should detect planning', () => {
  const monitor = new MetacognitiveMonitor();
  const result = monitor.monitor({ 
    text: '首先制定计划，然后准备，最后执行'
  });
  assert(result.regulationOfCognition.score > 0.7, 'Should detect planning');
});

test('MetacognitiveMonitor should track history', () => {
  const monitor = new MetacognitiveMonitor();
  monitor.monitor({ text: 'test1' });
  monitor.monitor({ text: 'test2' });
  assert(monitor.monitoringHistory.length === 2, 'Should track 2 entries');
});

test('MetacognitiveMonitor should get stats', () => {
  const monitor = new MetacognitiveMonitor();
  monitor.monitor({ text: 'test1' });
  const stats = monitor.getStats();
  assert(stats.totalMonitoring === 1, 'Should have 1 monitoring entry');
});

// Test 3: MetacognitiveExecutiveController
console.log('\n--- MetacognitiveExecutiveController Tests ---');

test('MetacognitiveExecutiveController should initialize', () => {
  const controller = new MetacognitiveExecutiveController();
  assert(controller.efDetector !== null);
  assert(controller.mcMonitor !== null);
});

test('MetacognitiveExecutiveController should assess comprehensively', () => {
  const controller = new MetacognitiveExecutiveController();
  const result = controller.assess({ 
    text: '我意识到应该先考虑清楚，然后再决定怎么做',
    options: ['a', 'b', 'c']
  });
  
  assert(result.executiveFunction !== null, 'Should have EF result');
  assert(result.metacognition !== null, 'Should have MC result');
  assert(result.integrated !== null, 'Should have integrated result');
  assert(result.integrated.totalScore > 0, 'Should have total score');
});

test('MetacognitiveExecutiveController should suggest for decision', () => {
  const controller = new MetacognitiveExecutiveController();
  const result = controller.suggestForDecision({
    text: '立刻做！不管了！',
    riskAssessment: []
  });
  
  assert(result.warnings !== null, 'Should have warnings');
  assert(Array.isArray(result.warnings), 'Warnings should be array');
});

test('MetacognitiveExecutiveController should balance EF and MC', () => {
  const controller = new MetacognitiveExecutiveController();
  const result = controller.assess({
    text: '我意识到我的想法，但是我也需要执行'
  });
  
  assert(['balanced', 'ef_dominant', 'mc_dominant'].includes(result.integrated.efMCBalance));
});

// Test 4: Module exports
console.log('\n--- Module Exports Tests ---');

test('Module should export VERSION', () => {
  assert(VERSION === '1.0.0', 'Version should be 1.0.0');
});

test('Module should export PAPER info', () => {
  assert(PAPER.title.includes('Executive function'), 'Should have paper title');
  assert(PAPER.citations === 463, 'Should have citations');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Paper integration successful.');
  console.log('\nPaper:', PAPER.title);
  console.log('Implementation: Executive Function + Metacognition unified framework');
  process.exit(0);
}
