#!/usr/bin/env node
/**
 * Test script for Self-Regulation Feedback module
 */

const { SelfRegulationFeedback } = require('../src/evolution/self-regulation-feedback.js');

// Create instance
const srf = new SelfRegulationFeedback({
  memoryPath: null, // in-memory only for testing
  maxHistorySize: 50
});

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

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

// Test 1: Record feedback with successful outcome
test('recordFeedback - successful outcome', () => {
  const appraisal = {
    threatType: 'challenge',
    copingStrategy: 'problem_focused',
    confidence: 0.7,
    dimensions: { relevance: 0.8, novelty: 0.6 }
  };
  const outcome = {
    success: true,
    effectiveness: 0.8,
    unexpected: false
  };
  
  const result = srf.recordFeedback(appraisal, outcome);
  assertEqual(typeof result.feedbackId, 'number', 'feedbackId should be number');
  assertEqual(typeof result.evaluation.overallScore, 'number', 'overallScore should be number');
  assertEqual(result.evaluation.isPositive, true, 'isPositive should be true');
});

// Test 2: Record feedback with failed outcome
test('recordFeedback - failed outcome', () => {
  const appraisal = {
    threatType: 'threat',
    copingStrategy: 'avoidance',
    confidence: 0.6,
    dimensions: { relevance: 0.7 }
  };
  const outcome = {
    success: false,
    effectiveness: 0.2,
    unexpected: true
  };
  
  const result = srf.recordFeedback(appraisal, outcome);
  assertEqual(result.evaluation.isPositive, false, 'isPositive should be false');
  assertEqual(result.evaluation.isExpected, false, 'isExpected should be false');
});

// Test 3: Get stats
test('getStats returns valid structure', () => {
  const stats = srf.getStats();
  assertEqual(typeof stats.totalEntries, 'number', 'totalEntries should be number');
  assertEqual(typeof stats.averageScore, 'number', 'averageScore should be number');
  assertEqual(typeof stats.recentTrend, 'string', 'recentTrend should be string');
});

// Test 4: Get learned patterns
test('getLearnedPatterns returns categorized patterns', () => {
  const patterns = srf.getLearnedPatterns();
  assertEqual(typeof patterns.byThreatType, 'object', 'byThreatType should be object');
  assertEqual(typeof patterns.byCopingStrategy, 'object', 'byCopingStrategy should be object');
  assertEqual(typeof patterns.byConfidenceRange, 'object', 'byConfidenceRange should be object');
  
  // Should have data from previous tests
  assertEqual(patterns.byThreatType['challenge']?.count >= 1, true, 'challenge should have entries');
  assertEqual(patterns.byCopingStrategy['problem_focused']?.count >= 1, true, 'problem_focused should have entries');
});

// Test 5: Multiple records maintain history
test('multiple records maintain correct history', () => {
  const initialCount = srf.feedbackHistory.length;
  
  srf.recordFeedback(
    { threatType: 'benefit', copingStrategy: 'meaning_focused', confidence: 0.8 },
    { success: true, effectiveness: 0.9 }
  );
  
  assertEqual(srf.feedbackHistory.length, initialCount + 1, 'history should grow');
});

// Test 6: Confidence adjustment
test('confidence adjustment works', () => {
  const result1 = srf.recordFeedback(
    { threatType: 'challenge', copingStrategy: 'problem_focused', confidence: 0.5 },
    { success: true, effectiveness: 0.9 }
  );
  
  // After good feedback, confidence should increase from 0.5
  assertEqual(typeof result1.adjustedConfidence, 'number', 'adjustedConfidence should be number');
});

// Test 7: Recommendations generated
test('recommendations are generated', () => {
  const result = srf.recordFeedback(
    { threatType: 'threat', copingStrategy: 'avoidance', confidence: 0.9 },
    { success: false, effectiveness: 0.1, unexpected: true }
  );
  
  assertEqual(Array.isArray(result.recommendations), true, 'recommendations should be array');
  assertEqual(result.recommendations.length > 0, true, 'should have recommendations for poor outcome');
});

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);