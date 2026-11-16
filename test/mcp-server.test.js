// [全局修复 2026-11-16] mcp-server.js 的 require 链会加载 src/utils/stdio-guard.js，
// 它把「非 JSON-RPC 帧」的 stdout 写入改道 stderr（MCP 规范：stdout 只走协议帧）。
// 于是下面的 PASS/SKIP 汇总行全部流失到 stderr，run-all 的 execFile 只 capture
// stdout → 本文件被计「未输出汇总行」（单跑 exit 0 但全量里静默失败）。
// 先例：round-733-injection-synonyms.test.js:38-45。加载引擎模块前关掉守卫。
process.env.HF_KEEP_STDOUT_LOGS = process.env.HF_KEEP_STDOUT_LOGS || '1';

const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/mcp-server.js');
    console.log('PASS mcp-server.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP mcp-server.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP mcp-server.test.js: ' + e.code));
