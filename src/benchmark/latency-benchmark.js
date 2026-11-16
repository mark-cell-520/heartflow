/**
 * src/benchmark/latency-benchmark.js — 公开延迟基准（GitHub #7 Latency 缺口）
 *
 * [全局修复 2026-11-16] 本文件在 Windows 副本的 v6.8.62 基线快照中缺失
 * （git 全历史无此 blob、磁盘无此文件），而两个真实调用方仍在引用它：
 *   · bin/cli.js 的 `benchmark` 命令（`heartflow benchmark`，公开延迟基准）
 *   · test/recovered-modules.test.js 的「恢复模块回归」守卫（防再被误删）
 * 缺失后果：CLI benchmark 命令一跑即 MODULE_NOT_FOUND；恢复模块测试
 * 整文件 [异常] 退出。本文件按两个调用方的契约重建，接口面：
 *
 *   const bench = new LatencyBenchmark(probeFn, { warmup: 3, samples: 20 });
 *   const report = await bench.report();
 *   // => { samples, warmup, avgMs, minMs, maxMs, p50Ms, p95Ms, totalMs }
 *
 * 契约来源（逐条对应用户代码，未臆造字段）：
 *   · probeFn：async 函数，每轮调用一次，测其墙钟耗时
 *   · warmup：预热轮数（不计入统计）；samples：正式采样轮数
 *   · report()：未显式 run() 时自动先跑；avgMs 为算术平均，samples 回显轮数
 *
 * 计时用 process.hrtime.bigint()（单调时钟，不受系统时间调整影响），
 * 零依赖（仓库铁律：运行时零依赖）。
 */
'use strict';

function _percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  // 最近秩法：ceil(p*n)-1，clamp 到 [0, n-1]
  const rank = Math.ceil(p * sorted.length) - 1;
  const idx = Math.min(sorted.length - 1, Math.max(0, rank));
  return sorted[idx];
}

class LatencyBenchmark {
  /**
   * @param {() => Promise<void>} probe 被测异步函数（如一次 engine.think）
   * @param {{ warmup?: number, samples?: number }} [options]
   */
  constructor(probe, options = {}) {
    if (typeof probe !== 'function') {
      throw new TypeError('LatencyBenchmark: probe 必须是函数（每轮调用一次）');
    }
    this.probe = probe;
    this.warmup = Math.max(0, parseInt(options.warmup, 10) || 0);
    this.samples = Math.max(1, parseInt(options.samples, 10) || 1);
    /** @type {number[]} 正式采样耗时（ms），run() 后填充 */
    this.results = [];
    /** @type {number[]} 预热耗时（ms），仅供审计不计入统计 */
    this.warmupResults = [];
  }

  /** 跑一轮并计墙钟耗时（ms） */
  async _timedOnce() {
    const t0 = process.hrtime.bigint();
    await this.probe();
    const t1 = process.hrtime.bigint();
    return Number(t1 - t0) / 1e6;
  }

  /** 执行完整基准（预热 + 采样），返回采样数组 */
  async run() {
    this.results = [];
    this.warmupResults = [];
    for (let i = 0; i < this.warmup; i++) {
      this.warmupResults.push(await this._timedOnce());
    }
    for (let i = 0; i < this.samples; i++) {
      this.results.push(await this._timedOnce());
    }
    return this.results;
  }

  /** 生成统计报告（未 run 过则自动先跑） */
  async report() {
    if (this.results.length === 0) await this.run();
    const sorted = this.results.slice().sort((a, b) => a - b);
    const total = this.results.reduce((a, b) => a + b, 0);
    return {
      samples: this.results.length,
      warmup: this.warmup,
      avgMs: total / this.results.length,
      minMs: sorted[0],
      maxMs: sorted[sorted.length - 1],
      p50Ms: _percentile(sorted, 0.5),
      p95Ms: _percentile(sorted, 0.95),
      totalMs: total,
    };
  }
}

module.exports = { LatencyBenchmark };
