/**
 * HeartFlow Stability Guard
 *
 * Verifies the runtime stays within a safe execution envelope.
 * It acts as a lightweight gate before and after upgrades.
 */

class StabilityGuard {
  constructor(options = {}) {
    this.thresholds = {
      minConfidence: options.minConfidence ?? 0.6,
      maxNoiseRatio: options.maxNoiseRatio ?? 0.45,
      minActionability: options.minActionability ?? 0.5,
    };
  }

  evaluate(snapshot = {}) {
    const confidence = Number(snapshot.confidence ?? 0);
    const noiseRatio = Number(snapshot.noiseRatio ?? 0);
    const actionability = Number(snapshot.actionability ?? 0);
    const issues = [];

    if (confidence < this.thresholds.minConfidence) {
      issues.push({ type: 'low_confidence', message: 'confidence below threshold' });
    }
    if (noiseRatio > this.thresholds.maxNoiseRatio) {
      issues.push({ type: 'high_noise', message: 'noise ratio above threshold' });
    }
    if (actionability < this.thresholds.minActionability) {
      issues.push({ type: 'low_actionability', message: 'actionability below threshold' });
    }

    return {
      stable: issues.length === 0,
      issues,
      thresholds: this.thresholds,
    };
  }

  gate(result = {}) {
    const verdict = this.evaluate(result);
    return {
      ...verdict,
      allow: verdict.stable,
      hint: verdict.stable ? 'safe to continue' : 'pause, simplify, and repair',
    };
  }
}

module.exports = { StabilityGuard };
