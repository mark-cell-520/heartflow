/**
 * 速率限制处理器 (Rate Limiter) v1.0.0
 *
 * API 速率限制自动处理、退避重试
 */

class RateLimiter {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.initialDelay = options.initialDelay || 1000; // 1 秒
    this.maxDelay = options.maxDelay || 60000; // 60 秒
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitter = options.jitter !== false; // 默认启用抖动

    // 速率限制状态
    this.limits = new Map();
    this.retryCount = 0;
    this.currentDelay = this.initialDelay;
    this.isRetrying = false;
    this.lastRetry = null;
  }

  /**
   * 检查是否允许请求
   */
  canRequest(key = 'default') {
    const limit = this.limits.get(key);

    if (!limit) {
      return { allowed: true, remaining: -1, resetAt: null };
    }

    const now = Date.now();

    if (now < limit.resetAt) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: limit.resetAt,
        retryAfter: Math.ceil((limit.resetAt - now) / 1000)
      };
    }

    return { allowed: true, remaining: limit.remaining, resetAt: null };
  }

  /**
   * 更新速率限制
   */
  updateLimit(key, headers) {
    // Anthropic 速率限制头
    if (headers['anthropic-ratelimit-limit-tokens']) {
      const limit = {
        tokens: parseInt(headers['anthropic-ratelimit-limit-tokens'], 10),
        remaining: parseInt(headers['anthropic-ratelimit-remaining-tokens'], 10),
        resetAt: parseInt(headers['anthropic-ratelimit-reset-at'], 10) * 1000
      };
      this.limits.set(key, limit);
      return limit;
    }

    // OpenAI 速率限制头
    if (headers['x-ratelimit-limit-requests']) {
      const limit = {
        requests: parseInt(headers['x-ratelimit-limit-requests'], 10),
        remaining: parseInt(headers['x-ratelimit-remaining-requests'], 10),
        resetAt: parseInt(headers['x-ratelimit-reset-requests'], 10) * 1000
      };
      this.limits.set(key, limit);
      return limit;
    }

    // 通用 Retry-After
    if (headers['retry-after']) {
      const resetAt = Date.now() + parseInt(headers['retry-after'], 10) * 1000;
      this.limits.set(key, { remaining: 0, resetAt });
      return this.limits.get(key);
    }

    return null;
  }

  /**
   * 处理速率限制错误
   */
  async handleRateLimit(error, requestFn) {
    if (this.retryCount >= this.maxRetries) {
      this.retryCount = 0;
      this.currentDelay = this.initialDelay;
      throw new Error(`速率限制已达最大重试次数: ${error.message}`);
    }

    // 检查是否是速率限制错误
    const isRateLimit = this._isRateLimitError(error);
    if (!isRateLimit) {
      throw error;
    }

    // 计算延迟
    const delay = this._calculateDelay();

    console.log(`[RateLimiter] 速率限制触发，${delay}ms 后重试 (${this.retryCount + 1}/${this.maxRetries})`);

    this.isRetrying = true;
    this.lastRetry = Date.now();

    // 等待
    await this._sleep(delay);

    this.retryCount++;
    this.currentDelay = Math.min(this.currentDelay * this.backoffMultiplier, this.maxDelay);

    // 重试请求
    return requestFn();
  }

  /**
   * 执行带速率限制的请求
   */
  async execute(key, requestFn) {
    // 检查是否允许
    const can = this.canRequest(key);
    if (!can.allowed) {
      if (can.retryAfter) {
        console.log(`[RateLimiter] 等待速率限制重置 (${can.retryAfter}s)`);
        await this._sleep(can.retryAfter * 1000);
      } else {
        throw new Error('速率限制中，无法执行请求');
      }
    }

    try {
      const result = await requestFn();

      // 更新限制
      if (result.headers) {
        this.updateLimit(key, result.headers);
      }

      // 重置重试状态
      this.retryCount = 0;
      this.currentDelay = this.initialDelay;
      this.isRetrying = false;

      return result;
    } catch (error) {
      if (this._isRateLimitError(error)) {
        return this.handleRateLimit(error, requestFn);
      }
      throw error;
    }
  }

  /**
   * 判断是否是速率限制错误
   */
  _isRateLimitError(error) {
    if (!error) return false;

    const message = error.message || '';
    const status = error.status || error.statusCode || '';

    // HTTP 429
    if (status === 429) return true;

    // 常见速率限制消息
    const rateLimitPatterns = [
      /rate\s*limit/i,
      /too\s*many\s*requests/i,
      /quota\s*exceeded/i,
      /rate\s*quota/i,
      /slow\s*down/i,
      /retry.*after/i
    ];

    return rateLimitPatterns.some(p => p.test(message));
  }

  /**
   * 计算延迟
   */
  _calculateDelay() {
    let delay = this.currentDelay;

    // 添加抖动
    if (this.jitter) {
      const jitterAmount = delay * 0.1; // 10% 抖动
      delay += Math.random() * jitterAmount * 2 - jitterAmount;
    }

    return Math.round(delay);
  }

  /**
   * 休眠
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取状态
   */
  getStatus() {
    const limits = {};
    for (const [key, limit] of this.limits) {
      limits[key] = {
        remaining: limit.remaining,
        resetAt: limit.resetAt ? new Date(limit.resetAt).toISOString() : null
      };
    }

    return {
      isRetrying: this.isRetrying,
      retryCount: this.retryCount,
      currentDelay: this.currentDelay,
      lastRetry: this.lastRetry ? new Date(this.lastRetry).toISOString() : null,
      limits
    };
  }

  /**
   * 重置
   */
  reset() {
    this.retryCount = 0;
    this.currentDelay = this.initialDelay;
    this.isRetrying = false;
    this.lastRetry = null;
  }
}

/**
 * 重试装饰器
 */
function withRetry(requestFn, options = {}) {
  const limiter = new RateLimiter(options);

  return async function (...args) {
    let lastError;

    for (let i = 0; i < limiter.maxRetries; i++) {
      try {
        const result = await requestFn(...args);

        // 检查是否是速率限制
        if (result.error && limiter.isRateLimitError(result.error)) {
          throw result.error;
        }

        return result;
      } catch (error) {
        lastError = error;

        if (!limiter._isRateLimitError(error)) {
          throw error;
        }

        if (i < limiter.maxRetries - 1) {
          const delay = limiter._calculateDelay();
          console.log(`[Retry] 请求失败，${delay}ms 后重试 (${i + 1}/${limiter.maxRetries})`);
          await limiter._sleep(delay);
          limiter.currentDelay = Math.min(limiter.currentDelay * limiter.backoffMultiplier, limiter.maxDelay);
        }
      }
    }

    throw lastError;
  };
}

/**
 * 断路器模式
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 分钟
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;

    this.state = 'closed'; // closed, open, half-open
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.nextAttempt = null;
  }

  /**
   * 执行请求
   */
  async execute(requestFn) {
    // 检查状态
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }

      // 尝试半开
      this.state = 'half-open';
      this.successes = 0;
    }

    try {
      const result = await requestFn();

      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  /**
   * 成功处理
   */
  _onSuccess() {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.halfOpenMaxCalls) {
        this.state = 'closed';
        console.log('[CircuitBreaker] 恢复为 CLOSED');
      }
    }
  }

  /**
   * 失败处理
   */
  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`[CircuitBreaker] 断开为 OPEN，下次尝试: ${new Date(this.nextAttempt).toISOString()}`);
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure ? new Date(this.lastFailure).toISOString() : null,
      nextAttempt: this.nextAttempt ? new Date(this.nextAttempt).toISOString() : null
    };
  }

  /**
   * 手动重置
   */
  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = null;
  }
}

module.exports = { RateLimiter, CircuitBreaker, withRetry };
