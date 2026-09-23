/**
 * 元审计闭环 TDD 测试
 * 验证：审计能力被真调用并落盘（不再是装饰）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hf-audit-cli-'));
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('AuditLogger 能真落盘 engine_start 事件', () => {
    const { AuditLogger } = require('../src/shield/audit-logger.js');
    const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
    const { HeartFlow } = require('../src/core/heartflow.js');
    const root = tmpRoot();
    const dataDir = path.join(root, 'data');
    const engine = new HeartFlow({ dataDir, silent: true });
    engine.start();
    const logger = new AuditLogger({ logPath: path.join(dataDir, 'audit', 'audit-log.jsonl') });
    // [v6.7.83] 真实 API 是 record(actionType, decision)，不是 log()。
    // 原测试断言一个不存在的方法名，直接 TypeError。该失败此前的汇总
    // 格式让它长期不可见（本轮 run-all 排查才暴露）。
    logger.record('engine_start', { action: 'allow', reason: 'engine started', version: engine.version });
    const stats = logger.getStats();
    assertTrue(stats.persisted);
    engine.shutdown();
  });

  test('ModuleHealthChecker 在引擎上真跑(非仅MCP)', () => {
    const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
    const { HeartFlow } = require('../src/core/heartflow.js');
    const root = tmpRoot();
    const engine = new HeartFlow({ dataDir: path.join(root, 'data'), silent: true });
    engine.start();
    const checker = new ModuleHealthChecker(engine);
    const report = checker.check();
    assertTrue(report.totalModules > 0);
    assertTrue(typeof report.healthy === 'number');
    engine.shutdown();
  });

  test('审计日志含防篡改哈希', () => {
    const { AuditLogger } = require('../src/shield/audit-logger.js');
    const root = tmpRoot();
    const logPath = path.join(root, 'audit-log.jsonl');
    const logger = new AuditLogger({ logPath });
    // [v6.7.83] 同上：record(actionType, decision)
    logger.record('security_event', { action: 'allow', reason: 'test', user: 'alice' });
    const line = fs.readFileSync(logPath, 'utf8').trim().split('\n')[0];
    const entry = JSON.parse(line);
    // [v6.7.83] 契约回归后字段是 entry.h（sha256 前 12 位）。
    // 曾一度改成 snapshot.contextHash 去迎合重写版——那正是本轮修的错误方向：
    // 应该修引擎恢复契约，不是改测试迎合被改坏的引擎。
    assertTrue(
      typeof entry.h === 'string' && entry.h.length === 12,
      `h 应为 12 位字符串，实际 ${JSON.stringify(entry.h)}`
    );
  });
}

module.exports = run;
