/**
 * stdio-guard.js — MCP server 启动最早期加载，保证 stdout 只走协议帧
 *
 * 背景（2026-10-11 审计发现）：
 *   src/ 下 69 处 console.log 由被 require 的模块在加载期执行
 *   （[memory-encrypt] / [MemoryBank] / [FormulaSearch] / [init] …），
 *   全部打到 stdout。任何管道捕获 stdout 的用法（`node mcp-server.js | jq`、
 *   调试包装、CI 断言）拿到的都是日志与输出混杂的内容。
 *
 * 本模块做的事：
 *   把 process.stdout.write 在非协议写入时改道 stderr。
 *   协议帧由 http/net 层直接写 socket，不经 process.stdout，所以不受影响。
 *
 * 控制：
 *   HF_KEEP_STDOUT_LOGS=1  → 完全禁用本守卫（调试时想看日志在 stdout）
 *
 * 注意：mcp-server.js 当前**没有** stdio 传输实现（无 process.stdin /
 * readline / createInterface），它是 HTTP SSE server。所以这不是在修一个
 * 坏掉的 stdio 客户端，而是在保证 stdout 干净——MCP 规范要求 stdout 只走
 * 协议帧，且未来若加 stdio 传输，这个守卫是前置条件。
 */

'use strict';

if (process.env.HF_KEEP_STDOUT_LOGS === '1') {
  // 调试模式：显式保留原行为
} else {
  const realStdoutWrite = process.stdout.write.bind(process.stdout);

  // 判断一次是否是 JSON-RPC 帧：以 { 开头且能 parse 出 jsonrpc/method/id/result/error
  function looksLikeRpcFrame(chunk) {
    if (typeof chunk !== 'string') return false;
    const s = chunk.trimStart();
    if (!s.startsWith('{')) return false;
    // 只对单行完整帧做判断；多行/分片不拦（交给调用方保证）
    if (!s.includes('\n')) {
      try {
        const j = JSON.parse(s);
        return j && typeof j === 'object' &&
          ('jsonrpc' in j || 'method' in j || 'result' in j || 'error' in j || 'id' in j);
      } catch (_) {
        return false;
      }
    }
    // 含换行：逐行看，任一行是协议帧即放行
    return s.split('\n').some(line => {
      const t = line.trim();
      if (!t.startsWith('{')) return false;
      try {
        const j = JSON.parse(t);
        return j && typeof j === 'object' &&
          ('jsonrpc' in j || 'method' in j || 'result' in j || 'error' in j || 'id' in j);
      } catch (_) {
        return false;
      }
    });
  }

  process.stdout.write = function (chunk, encoding, callback) {
    // Buffer 直接放行（协议层若用 Buffer 写，不拦截）
    if (typeof chunk !== 'string') {
      return realStdoutWrite(chunk, encoding, callback);
    }
    if (looksLikeRpcFrame(chunk)) {
      return realStdoutWrite(chunk, encoding, callback);
    }
    // 非协议内容 → 改道 stderr，保持 stdout 干净
    if (typeof encoding === 'function') { callback = encoding; encoding = undefined; }
    return process.stderr.write(chunk, encoding, callback);
  };
}

module.exports = { installed: process.env.HF_KEEP_STDOUT_LOGS !== '1' };
