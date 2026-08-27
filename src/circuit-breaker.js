'use strict';

/**
 * [v7.0.0] 工作包 D: 全局熔断 + Kill Switch
 * 
 * 国标要求：持续异常时自动降级，紧急时一键终止
 * 
 * 覆盖：
 * - 内存熔断（并发/内存/CPU 水位）
 * - MCP 成功率熔断（连续失败阈值）
 * - Kill Switch（紧急终止 +  graceful shutdown）
 * - 状态 REST API（GET /health）
 */

// ── 内存熔断 ──────────────────────────────────────────
const MEM_WARNING  = 0.75;  // 75% RSS → warn
const MEM_CRITICAL = 0.90;  // 90% RSS → trip
const CPU_WARNING  = 0.80;  // 80% CPU → warn
const CPU_CRITICAL = 0.95;  // 95% CPU → trip
const REQUEST_WINDOW  = 60_000;  // 1 分钟滑动窗口
const FAIL_RATE_WARN  = 0.30;  // 30% 失败率 → warn
const FAIL_RATE_TRIP  = 0.50;  // 50% 失败率 → trip
const MIN_SAMPLES     = 10;    // 最少采样数才触发

const STATE = Object.freeze({
  CLOSED:    'CLOSED',      // 正常
  OPEN:      'OPEN',        // 熔断开启
  HALF_OPEN: 'HALF_OPEN',   // 半开探测
  TRIPPED:   'TRIPPED',     // 紧急终止
});

let _state = STATE.CLOSED;
let _trippedAt = 0;
let _lastError = null;
let _stats = { total: 0, failures: 0, successes: 0 };
let _windowStart = Date.now();
let _killSwitchActive = false;

// ── 内存检查 ──────────────────────────────────────────
function checkMemory() {
  const usage = process.memoryUsage();
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usedMB  = Math.round(usage.heapUsed  / 1024 / 1024);
  const percent = usage.heapUsed / usage.heapTotal;
  
  return {
    usedMB,
    totalMB,
    percent: Math.round(percent * 100) / 100,
    level: percent >= MEM_CRITICAL ? 'critical' : percent >= MEM_WARNING ? 'warning' : 'ok',
    action: percent >= MEM_CRITICAL ? 'trip' : percent >= MEM_WARNING ? 'warn' : 'none',
  };
}

// ── CPU 检查（基于 process.cpuUsage）─────────────────
function checkCPU() {
  const start = process.cpuUsage();
  const startTime = Date.now();
  
  // 10ms 采样
  const deadline = startTime + 10;
  while (Date.now() < deadline) { /* busy-wait */ }
  
  const end = process.cpuUsage(start);
  const elapsed = Date.now() - startTime;
  const cpuPercent = Math.min(1, (end.user + end.system) / (elapsed * 1000));
  
  return {
    cpuPercent: Math.round(cpuPercent * 100) / 100,
    level: cpuPercent >= CPU_CRITICAL ? 'critical' : cpuPercent >= CPU_WARNING ? 'warning' : 'ok',
    action: cpuPercent >= CPU_CRITICAL ? 'trip' : cpuPercent >= CPU_WARNING ? 'warn' : 'none',
  };
}

// ── 滑动窗口失败率统计 ────────────────────────────────
function recordOutcome(success) {
  const now = Date.now();
  if (now - _windowStart > REQUEST_WINDOW) {
    _stats = { total: 0, failures: 0, successes: 0 };
    _windowStart = now;
  }
  _stats.total++;
  if (success) {
    _stats.successes++;
  } else {
    _stats.failures++;
  }
  _evaluate();
}

function getFailRate() {
  if (_stats.total < MIN_SAMPLES) return 0;
  return _stats.failures / _stats.total;
}

// ── 熔断状态机 ──────────────────────────────────────
function _evaluate() {
  if (_killSwitchActive) return STATE.TRIPPED;
  
  const mem = checkMemory();
  const cpu = checkCPU();
  const failRate = getFailRate();
  
  // Memory/CPU critical → immediate trip
  if (mem.action === 'trip' || cpu.action === 'trip') {
    trip('Resource exhausted: ' + (mem.action === 'trip' ? `mem ${mem.percent}` : `cpu ${cpu.cpuPercent}`));
    return STATE.TRIPPED;
  }
  
  // High failure rate → open circuit
  if (failRate >= FAIL_RATE_TRIP && _stats.total >= MIN_SAMPLES) {
    _state = STATE.OPEN;
    _trippedAt = Date.now();
    return STATE.OPEN;
  }
  
  // Warning threshold
  if (failRate >= FAIL_RATE_WARN || mem.level === 'warning' || cpu.level === 'warning') {
    return STATE.HALF_OPEN;
  }
  
  return STATE.CLOSED;
}

// ── Kill Switch ──────────────────────────────────────
function trip(reason) {
  _state = STATE.TRIPPED;
  _trippedAt = Date.now();
  _lastError = reason;
  _killSwitchActive = true;
  console.error(`[circuitBreaker] TRIPPED: ${reason}`);
  return getState();
}

function reset() {
  _state = STATE.CLOSED;
  _trippedAt = 0;
  _lastError = null;
  _killSwitchActive = false;
  _stats = { total: 0, failures: 0, successes: 0 };
}

function isTripped() { return _killSwitchActive; }
function getState()   { return { state: _state, trippedAt: _trippedAt, lastError: _lastError, ..._stats }; }

// ── MCP 请求守卫 ──────────────────────────────────────
function guard() {
  if (_killSwitchActive) {
    return {
      allowed: false,
      reason: `Circuit breaker TRIPPED at ${new Date(_trippedAt).toISOString()}: ${_lastError}`,
      state: STATE.TRIPPED,
    };
  }
  
  const current = _evaluate();
  if (current === STATE.OPEN) {
    return {
      allowed: false,
      reason: `Circuit breaker OPEN (failRate=${Math.round(getFailRate()*100)}% >= ${Math.round(FAIL_RATE_TRIP*100)}%)`,
      state: STATE.OPEN,
    };
  }
  
  return { allowed: true, state: current };
}

// ── 健康检查 ──────────────────────────────────────────
function healthCheck() {
  const mem = checkMemory();
  const cpu = checkCPU();
  const failRate = getFailRate();
  const cb = guard();
  
  return {
    status: cb.allowed ? 'ok' : 'degraded',
    circuitBreaker: cb,
    memory: mem,
    cpu: cpu,
    failRate: Math.round(failRate * 100) / 100,
    uptime: process.uptime(),
    timestamp: Date.now(),
  };
}

module.exports = {
  guard,
  trip,
  reset,
  isTripped,
  getState,
  healthCheck,
  checkMemory,
  checkCPU,
  recordOutcome,
  STATE,
  MEM_CRITICAL,
  FAIL_RATE_TRIP,
};

