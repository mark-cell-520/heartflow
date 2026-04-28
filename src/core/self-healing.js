/**
 * HeartFlow Self-Healing
 *
 * Lightweight recovery loop for agent runtime instability.
 * - detect repeated failures
 * - classify recovery path
 * - emit concrete repair hints
 */

class SelfHealing {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 2;
    this.backoffMs = options.backoffMs ?? 150;
    this.failureWindow = [];
  }

  record(event = {}) {
    const item = {
      type: String(event.type || 'unknown'),
      message: String(event.message || ''),
      code: event.code || null,
      ts: Date.now(),
    };
    this.failureWindow.push(item);
    if (this.failureWindow.length > 20) this.failureWindow.shift();
    return item;
  }

  summarize() {
    const counts = this.failureWindow.reduce((acc, x) => {
      acc[x.type] = (acc[x.type] || 0) + 1;
      return acc;
    }, {});
    return { total: this.failureWindow.length, counts };
  }

  shouldRetry(result = {}) {
    const transient = /timeout|econnreset|eagain|temporar|busy|rate limit/i.test(String(result.message || ''));
    return transient && (result.attempt || 0) < this.maxRetries;
  }

  repairHints(result = {}) {
    const message = String(result.message || '');
    const hints = [];
    if (/timeout/i.test(message)) hints.push('use smaller scope or longer timeout');
    if (/rate limit|429/i.test(message)) hints.push('pause and retry with backoff');
    if (/syntax|parse|unexpected token/i.test(message)) hints.push('re-read the target file and patch smaller');
    if (/module not found|cannot find/i.test(message)) hints.push('verify imports and relative paths');
    if (/unknown option|invalid option/i.test(message)) hints.push('remove unsupported CLI flags');
    if (hints.length === 0) hints.push('reduce the failure surface and retry once');
    return [...new Set(hints)];
  }

  recover(result = {}) {
    const attempt = (result.attempt || 0) + 1;
    const canRetry = this.shouldRetry({ ...result, attempt });
    return {
      ok: !!result.ok,
      attempt,
      canRetry,
      backoffMs: this.backoffMs * attempt,
      hints: this.repairHints(result),
      summary: this.summarize(),
    };
  }
}

module.exports = { SelfHealing };
