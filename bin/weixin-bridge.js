#!/usr/bin/env node
/**
 * weixin-bridge.js — 微信 MCP HTTP 桥接脚本
 *
 * 用法:
 *   node weixin-bridge.js contacts          # 列出联系人
 *   node weixin-bridge.js poll              # 轮询新消息
 *   node weixin-bridge.js send <to> <text>  # 发送消息
 *   node weixin-bridge.js init              # 初始化会话
 *
 * 环境变量:
 *   WEIXIN_MCP_PORT  (默认 3001)
 *   WEIXIN_MCP_HOST  (默认 127.0.0.1)
 */

const http = require('http');
const MCP_HOST = process.env.WEIXIN_MCP_HOST || '127.0.0.1';
const MCP_PORT = parseInt(process.env.WEIXIN_MCP_PORT || '3001', 10);
const SESSION_KEY = 'weixin-bridge-session';

function loadSession() {
  try {
    const data = require('fs').readFileSync('/tmp/weixin-bridge-session.json', 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveSession(sessionId) {
  try {
    require('fs').writeFileSync('/tmp/weixin-bridge-session.json', JSON.stringify({ sessionId, ts: Date.now() }));
  } catch {}
}

function parseSSE(body) {
  const lines = body.split('\n');
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith('data: ')) dataLines.push(line.slice(6));
  }
  return dataLines.map(d => {
    try { return JSON.parse(d); }
    catch { return d; }
  });
}

async function mcpCall(method, params = {}) {
  return new Promise((resolve, reject) => {
    let sessionId = loadSession()?.sessionId;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    if (sessionId) headers['MCP-Session-Id'] = sessionId;

    const req = http.request({
      hostname: MCP_HOST,
      port: MCP_PORT,
      path: '/mcp',
      method: 'POST',
      headers,
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        // Save session ID from response header
        const newSessionId = res.headers['mcp-session-id'];
        if (newSessionId) saveSession(newSessionId);
        const parsed = parseSSE(body);
        resolve(parsed[0] || { raw: body });
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }));
    req.end();
  });
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === 'help') {
    console.log(`
weixin-bridge.js — 微信 MCP 桥接

用法:
  node weixin-bridge.js init             初始化 MCP 会话
  node weixin-bridge.js contacts         列出联系人
  node weixin-bridge.js poll             轮询新消息
  node weixin-bridge.js send <to> <text> 发送消息
  node weixin-bridge.js config           获取用户配置
`);
    process.exit(0);
  }

  // Ensure session is initialized (init always runs)
  if (cmd !== 'init' && !loadSession()) {
    console.error('[weixin-bridge] 未初始化，请先运行: node weixin-bridge.js init');
    process.exit(1);
  }

  let result;
  switch (cmd) {
    case 'init':
      result = await mcpCall('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'weixin-bridge', version: '1.0' },
      });
      console.log('会话初始化:', result.result?.serverInfo ? '✅ 成功' : JSON.stringify(result));
      break;

    case 'contacts':
      result = await mcpCall('tools/call', { name: 'weixin_contacts', arguments: {} });
      console.log(result.result?.content?.[0]?.text || JSON.stringify(result));
      break;

    case 'poll':
      result = await mcpCall('tools/call', { name: 'weixin_poll', arguments: {} });
      console.log(result.result?.content?.[0]?.text || JSON.stringify(result));
      break;

    case 'send':
      if (args.length < 2) {
        console.error('用法: node weixin-bridge.js send <to> <text>');
        process.exit(1);
      }
      const [to, ...textParts] = args;
      const text = textParts.join(' ');
      result = await mcpCall('tools/call', {
        name: 'weixin_send',
        arguments: { to, text },
      });
      console.log(result.result?.content?.[0]?.text || JSON.stringify(result));
      break;

    case 'config':
      if (!args[0]) {
        console.error('用法: node weixin-bridge.js config <user_id> [context_token]');
        process.exit(1);
      }
      result = await mcpCall('tools/call', {
        name: 'weixin_get_config',
        arguments: { user_id: args[0], context_token: args[1] || '' },
      });
      console.log(result.result?.content?.[0]?.text || JSON.stringify(result));
      break;

    default:
      console.error(`未知命令: ${cmd}\n运行 node weixin-bridge.js help 查看用法`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error('[weixin-bridge] 错误:', err.message);
  process.exit(1);
});
