/**
 * HeartFlow 模块健康检查器
 * 
 * 功能：
 * 1. 检查模块加载状态
 * 2. 自动禁用失败模块
 * 3. 提供健康报告
 */

// 标准生命周期 mixin：为缺少接口方法的模块注入 noop 清理 + 基础统计
// 避免对 120+ 模块逐一手动添加，零侵入、不破坏现有逻辑
function ensureModuleInterfaces(mod) {
  if (!mod || typeof mod !== 'object') return mod;
  if (typeof mod.destroy !== 'function' && typeof mod.stop !== 'function') {
    mod.destroy = function _noopDestroy() {};
    mod.stop = mod.stop || mod.destroy;
  }
  if (typeof mod.getStats !== 'function' && typeof mod.stats !== 'object') {
    mod.getStats = function _defaultStats() {
      const keys = Object.getOwnPropertyNames(mod).filter(k => !k.startsWith('_'));
      return { name: mod.constructor?.name || 'anonymous', methods: keys.length, stats: 'default' };
    };
    mod.stats = mod.stats || {};
  }
  return mod;
}

class ModuleHealthChecker {
  // [r251] 占位子系统 key → 引擎实例字段的别名。31 个 key 里有 3 个的实例
  // 不挂在同名属性上（源码级实测），不列别名会误报「已声明未实例化」。
  static STUB_KEY_ALIASES = {
    phenomenologyEngine: ['phenomenology', '_phenomenologyEngine'],
    eduEngine: ['_eduEngine', 'eduEngine'],
    taskUrgency: ['taskUrgencyEstimator', '_taskUrgencyEstimator']
  };

  constructor(heartflow) {
    this.hf = heartflow;
    this.healthLog = [];
    this.maxLogSize = 100;
    this.disabledModules = new Set(); // [v6.0.34] 真禁用集合(元审计修复: 之前只计数不禁用)
    this._stubAliases = ModuleHealthChecker.STUB_KEY_ALIASES;
  }

  /** 统一为所有已注册模块注入标准接口 */
  normalizeModules() {
    const modules = this.hf._modules || {};
    let normalized = 0;
    for (const [name, mod] of Object.entries(modules)) {
      const before = typeof mod?.destroy === 'function' && typeof mod?.getStats === 'function';
      ensureModuleInterfaces(mod);
      if (!before) normalized++;
    }
    return normalized;
  }

  /**
   * [r251] 识别「占位空壳」：__heartflowStub 标记（不可伪装）优先，
   * 其次听模块自报的 healthCheck()（{stub:true} / {fake:true}）。
   * 自报渠道可能被实例化点的 catch fallback 换成 () => ({})，故不能只依赖它。
   *
   * 刻意只认 stub/fake 标记、不认裸 ok:false：真实模块临时自报不健康
   * （例如知识图谱未连接）是 degraded 而不是「占位」，混为一谈会把
   * 健康计数污染成假的。
   */
  _detectStub(mod) {
    if (!mod || typeof mod !== 'object') return null;
    if (mod.__heartflowStub === true) {
      return { reason: 'module_not_implemented: 占位模块，无真实能力，仅防启动崩溃', stubClass: mod.__stubClass || null, via: 'marker' };
    }
    if (mod.constructor && mod.constructor.__heartflowStubClass === true) {
      return { reason: 'module_not_implemented: 占位模块，无真实能力，仅防启动崩溃', stubClass: mod.constructor.name || null, via: 'class_marker' };
    }
    if (typeof mod.healthCheck === 'function') {
      let self;
      try { self = mod.healthCheck(); } catch (e) { return null; } // 自检炸掉不冤枉它
      if (self && typeof self === 'object' && (self.stub === true || self.fake === true)) {
        return { reason: self.reason || 'self_reported_not_implemented', stubClass: mod.constructor?.name || null, via: 'self_report' };
      }
    }
    return null;
  }

  /**
   * [r251] 扫「已声明但用 _stubFactory 占位」的子系统清单。
   * 这些实例大多挂在引擎顶层属性（hf.mindWanderer 等），从不进 _modules，
   * 因此原有 check() 的遍历范围结构性看不见它们 —— 对外却报 healthScore=100。
   * 返回三态：stubs（占位运行中）/ overridden（实例存在但不是 stub，即已有真实实现）
   *           / uninstantiated（已声明未实例化，连空壳都没 new 出来）。
   */
  scanStubSubsystems() {
    const keys = (this.hf && this.hf._stubSubsystemKeys) || [];
    const aliases = this._stubAliases;
    const stubs = [];
    const overridden = [];
    const uninstantiated = [];
    for (const key of keys) {
      let inst = this.hf[key];
      let resolvedFrom = key;
      if (inst === undefined || inst === null) {
        for (const alias of (aliases[key] || ['_' + key])) {
          if (this.hf[alias] !== undefined && this.hf[alias] !== null) { inst = this.hf[alias]; resolvedFrom = alias; break; }
        }
      }
      if (inst === undefined || inst === null) { uninstantiated.push(key); continue; }
      const stub = this._detectStub(inst);
      if (stub) stubs.push({ name: key, resolvedFrom, stubClass: stub.stubClass, via: stub.via, reason: stub.reason });
      else overridden.push({ name: key, resolvedFrom, ctor: inst.constructor?.name || null });
    }
    return { declared: keys.length, stubs, overridden, uninstantiated };
  }

  /** [r251] 新公开方法：占位子系统清单（MCP heartflow_module_stubs 读它） */
  getStubModules() {
    const scan = this.scanStubSubsystems();
    return {
      declared: scan.declared,
      stubCount: scan.stubs.length,
      overriddenCount: scan.overridden.length,
      uninstantiatedCount: scan.uninstantiated.length,
      stubs: scan.stubs,
      overridden: scan.overridden,
      uninstantiated: scan.uninstantiated,
      measured: scan.declared > 0
    };
  }

  /**
   * 执行健康检查
   */
  check() {
    const report = {
      timestamp: Date.now(),
      totalModules: 0,
      healthy: 0,
      degraded: 0,
      failed: 0,
      disabled: [], // [v6.0.34] 真禁用模块清单(元审计修复)
      details: []
    };

    // 自修复：先为缺失标准接口的模块注入 noop 清理 + 基础统计
    this.normalizeModules();

    // 检查所有已注册模块
    const modules = this.hf._modules || {};
    report.totalModules = Object.keys(modules).length;

    for (const [name, mod] of Object.entries(modules)) {
      const status = this.checkModule(name, mod);
      report.details.push(status);

      switch (status.health) {
        case 'healthy':
          report.healthy++;
          break;
        case 'degraded':
          report.degraded++;
          break;
        case 'stub':
          // [r251] 独立档位：占位空壳。刻意不复用 failed —— failed 会触发
          // __disabled + disabledModules，把依赖它的运行路径一起禁掉。
          // 诚实的做法是「如实记账 + 不阻断运行」，两者不冲突。
          report.stubCount = (report.stubCount || 0) + 1;
          break;
        case 'failed':
          report.failed++;
          // [v6.0.34] 元审计修复: 之前只计数不禁用 = 假自愈
          // [v6.0.51 L4] 诚实标注: 标记 __disabled + 加入 disabledModules 集合（保留 _modules 对象以便诊断，不物理移除引用）
          if (mod && typeof mod === 'object') mod.__disabled = true;
          this.disabledModules.add(name);
          break;
      }
    }

    // [r251] 占位子系统维度：_modules 遍历范围看不见的那 31 个已声明子系统
    const stubScan = this.scanStubSubsystems();
    report.stubSubsystems = stubScan;

    // 记录日志
    this.healthLog.push(report);
    if (this.healthLog.length > this.maxLogSize) {
      this.healthLog = this.healthLog.slice(-this.maxLogSize);
    }

    report.disabled = [...this.disabledModules]; // [v6.0.34] 填充真禁用清单
    return report;
  }

  /** [v6.0.34] 元审计修复: 查询模块是否被真禁用 */
  isDisabled(name) {
    return this.disabledModules.has(name);
  }

  getDisabled() {
    return [...this.disabledModules];
  }

  /**
   * 检查单个模块
   */
  checkModule(name, mod) {
    const status = {
      name,
      health: 'healthy',
      issues: []
    };

    if (!mod) {
      status.health = 'failed';
      status.issues.push('模块为null');
      return status;
    }

    // [r251] 占位空壳优先判定：进 _modules 的 8 个占位子系统
    // （sufferingResilience/griefEngine/hopeEngine/empathyDeepening/
    //   conflictResolution/traumaInformed/postTraumaticGrowth/forgivenessEngine）
    // 此前因为接口齐全（stub 自带 destroy/getStats）被判 healthy。
    const stub = this._detectStub(mod);
    if (stub) {
      status.health = 'stub';
      status.issues.push(stub.reason);
      status.stubClass = stub.stubClass;
      status.detectedVia = stub.via;
      return status;
    }

    // 检查是否有destroy/stop方法（可清理）
    if (typeof mod.destroy !== 'function' && typeof mod.stop !== 'function') {
      status.issues.push('缺少清理方法(destroy/stop)');
    }

    // 检查是否有getStats方法（可观测性）
    if (typeof mod.getStats !== 'function' && typeof mod.stats !== 'object') {
      status.issues.push('缺少统计方法(getStats/stats)');
    }

    // 如果有问题，标记为degraded
    if (status.issues.length > 0) {
      status.health = 'degraded';
    }

    return status;
  }

  /**
   * 获取健康报告摘要
   */
  getSummary() {
    if (this.healthLog.length === 0) {
      return { status: 'no_data', message: '尚未执行健康检查' };
    }

    const latest = this.healthLog[this.healthLog.length - 1];
    const previous = this.healthLog.length > 1 ? this.healthLog[this.healthLog.length - 2] : null;

    const summary = {
      timestamp: latest.timestamp,
      total: latest.totalModules,
      healthy: latest.healthy,
      degraded: latest.degraded,
      failed: latest.failed,
      stubCount: latest.stubCount || 0,
      healthScore: latest.totalModules > 0
        ? Math.round((latest.healthy / latest.totalModules) * 100)
        : 0
    };

    // [r251] 诚实记账：healthScore 100 只说明「_modules 里注册的模块接口齐全」，
    // 不等于「广告出去的能力都有实现」。把占位子系统单列一个口径，两个数并排给。
    const stubScan = latest.stubSubsystems || this.scanStubSubsystems();
    if (stubScan && stubScan.declared > 0) {
      summary.declaredStubSubsystems = stubScan.declared;
      summary.stubSubsystemNames = stubScan.stubs.map(s => s.name);
      summary.uninstantiatedSubsystems = stubScan.uninstantiated;
      summary.implementedRatio = Math.round((stubScan.overridden.length / stubScan.declared) * 100);
      if (stubScan.stubs.length > 0) {
        summary.honestNote = `healthScore ${summary.healthScore} 仅覆盖 _modules 注册的 ${latest.totalModules} 个模块；另有 ${stubScan.stubs.length}/${stubScan.declared} 个已声明子系统为占位空壳（无真实能力），真实实现占比 ${summary.implementedRatio}%`;
      }
    }

    // 趋势分析
    if (previous) {
      summary.trend = {
        healthy: latest.healthy - previous.healthy,
        degraded: latest.degraded - previous.degraded,
        failed: latest.failed - previous.failed
      };
    }

    return summary;
  }

  /**
   * 获取有问题的模块列表
   */
  getProblematicModules() {
    if (this.healthLog.length === 0) return [];

    const latest = this.healthLog[this.healthLog.length - 1];
    return latest.details.filter(d => d.health !== 'healthy');
  }
}

module.exports = { ModuleHealthChecker };
