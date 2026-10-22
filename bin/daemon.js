#!/usr/bin/env node
/**
 * HeartFlow Daemon Manager
 *
 * 提供进程守护功能：
 *   node bin/daemon.js start    — 后台常驻（PM2 > nohup）
 *   node bin/daemon.js stop     — 停止守护进程
 *   node bin/daemon.js status   — 查看运行状态
 *   node bin/daemon.js restart  — 重启
 *
 * 优先使用 PM2，回退到 nohup + PID 文件。
 * 全球用户运行 `node bin/daemon.js start` 即可常驻。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const HF_DIR = path.join(__dirname, '..');
const PID_FILE = path.join(HF_DIR, 'data', 'heartflow.pid');
const LOG_DIR = path.join(HF_DIR, 'data', 'logs');

// ─── PM2 支持 ──────────────────────────────────────────────────────────────

let pm2Available = false;
let pm2 = null;

try {
  pm2 = require('pm2');
  pm2Available = true;
} catch (_) {
  pm2Available = false;
}

// ─── PID 管理（nohup fallback） ────────────────────────────────────────────

function ensureDirs() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_DIR, 'data'), { recursive: true });
}

function readPid() {
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch (_) { return null; }
}

function writePid(pid) {
  ensureDirs();
  fs.writeFileSync(PID_FILE, String(pid));
}

function removePid() {
  try { fs.unlinkSync(PID_FILE); } catch (_) {}
}

// [FIX 2026-09-19] 端口探测提取为公共函数：PM2 路径原来硬编码 8099，
// 端口被占用时 PM2 只会崩溃重启，永远起不来。nohup 路径本来就有探测，现在两条路都走它。
async function detectFreePort(startPort = 8099, endPort = 8105) {
  const net = require('net');
  for (let p = startPort; p <= endPort; p++) {
    const ok = await new Promise((resolve) => {
      const s = net.createServer();
      const timer = setTimeout(() => { try { s.close(); } catch (_) { } resolve(false); }, 200);
      s.once('error', () => { clearTimeout(timer); try { s.close(); } catch (_) { } resolve(false); });
      s.listen(p, () => {
        clearTimeout(timer);
        s.close();
        s.once('close', () => resolve(true));
      });
    });
    if (ok) return p;
  }
  return startPort; // last resort
}

function isProcessAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (_) { return false; }
}

function getProcessInfo(pid) {
  if (!isProcessAlive(pid)) return null;
  try {
    const cmdLine = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf-8').replace(/\0/g, ' ').trim();
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf-8').split(' ');
    const startTime = parseInt(stat[21], 10) * 1000; // jiffies → ms
    const uptimeSec = Math.floor((Date.now() / 1000 - startTime / 1000));
    return { pid, cmdLine, uptime: uptimeSec };
  } catch (_) { return { pid, uptime: 'unknown' }; }
}

// ─── PM2 实现 ──────────────────────────────────────────────────────────────

const ECOSYSTEM_PATH = path.join(HF_DIR, 'ecosystem.config.js');

// [FIX 2026-09-25] ecosystem.config.js 常以 root 身份创建（git 跟踪），而引擎以
// 非特权用户运行时 writeFileSync 直接 EACCES，整个 PM2 启动链崩在这。
// 规范路径不可写时，回退写到 tmp 下可写副本；模板里的 __dirname 要换成 HF_DIR
// 字面量，否则 PM2 会按 tmp 目录去找 mcp-server-http.js。
function ecosystemTemplate(port) {
  return `const path = require('path');
const HF_DIR = '${HF_DIR.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';

module.exports = {
  apps: [{
    name: 'heartflow-mcp',
    script: path.join(HF_DIR, 'mcp', 'mcp-server-http.js'),
    args: '--port ${port}',
    cwd: HF_DIR,
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    max_memory_restart: '512M',
    env: { NODE_ENV: 'production' },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: path.join(HF_DIR, 'data', 'logs', 'heartflow-error.log'),
    out_file: path.join(HF_DIR, 'data', 'logs', 'heartflow-out.log'),
  }]
};
`;
}

// 返回实际可用的 ecosystem 配置文件路径
function ensureEcosystemConfig(port = 8099) {
  // [FIX 2026-09-19] 模板里原来漏了 const path = require('path')，
  // 之前只因为 ecosystem.config.js 已被 git 跟踪 + 上面的提前 return 而没暴露。
  const content = ecosystemTemplate(port);
  try {
    fs.writeFileSync(ECOSYSTEM_PATH, content);
    return ECOSYSTEM_PATH;
  } catch (err) {
    const fallbackDir = path.join(os.tmpdir(), 'heartflow-daemon');
    const fallbackPath = path.join(fallbackDir, `ecosystem.${port}.js`);
    try {
      fs.mkdirSync(fallbackDir, { recursive: true });
      fs.writeFileSync(fallbackPath, content);
      console.warn(`[HeartFlow Daemon] ⚠️ ${ECOSYSTEM_PATH} 不可写 (${err.code})，改用 ${fallbackPath}`);
      return fallbackPath;
    } catch (fallbackErr) {
      throw new Error(`ecosystem 配置写入失败: ${err.code} / ${fallbackErr.code}`);
    }
  }
}

async function pm2Disconnect() {
  if (pm2Available && pm2 && typeof pm2.disconnect === 'function') {
    try { pm2.disconnect(); } catch (_) { /* 忽略断开错误 */ }
  }
}

async function pm2Start() {
  const port = await detectFreePort();
  const ecosystemPath = ensureEcosystemConfig(port);
  return new Promise((resolve, reject) => {
    // [FIX 2026-09-19] 旧实例可能绑着失效端口，先删再用新配置起
    pm2.delete('heartflow-mcp', () => {
    pm2.start(ecosystemPath, (err) => {
      if (err) return reject(err);
      pm2.list((err, list) => {
        if (err) return reject(err);
        const app = list.find(a => a.name === 'heartflow-mcp');
        if (!app) { pm2Disconnect(); return reject(new Error('PM2 未找到 heartflow-mcp 进程')); }
        pm2Disconnect();
        resolve({ pid: app.pid, pm2Id: app.pm_id, status: app.status, port });
      });
    });
    });
  });
}

async function pm2Stop() {
  return new Promise((resolve, reject) => {
    pm2.stop('heartflow-mcp', (err) => {
      if (err) return reject(err);
      pm2.delete('heartflow-mcp', (err) => {
        if (err) return reject(err);
        pm2Disconnect();
        resolve();
      });
    });
  });
}

async function pm2Status() {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) return reject(err);
      const app = list.find(a => a.name === 'heartflow-mcp');
      if (!app) { pm2Disconnect(); return resolve(null); }
      pm2Disconnect();
      resolve({ pid: app.pid, pm2Id: app.pm_id, status: app.status, uptime: app.uptime });
    });
  });
}

// ─── Nohup fallback ─────────────────────────────────────────────────────────

async function nohupStart() {
  ensureDirs();
  const pid = readPid();
  if (isProcessAlive(pid)) {
    throw new Error(`进程已在运行 (PID: ${pid})`);
  }

  const serverPath = path.join(HF_DIR, 'mcp', 'mcp-server-http.js');
  const outLog = fs.openSync(path.join(LOG_DIR, 'heartflow-out.log'), 'a');
  const errLog = fs.openSync(path.join(LOG_DIR, 'heartflow-error.log'), 'a');

  // 检测可用端口，传给 mcp-server-http.js 避免竞态
  const detectedPort = await detectFreePort();

  // [SECURITY-FIX] H-3: 子进程环境变量白名单
  // 只允许必要的环境变量传播到子进程，避免泄露 API Key 等敏感信息
  const ALLOWED_ENV_KEYS = [
    'PATH', 'HOME', 'USER', 'SHELL', 'LANG', 'LC_ALL',
    'NODE_ENV', 'HEARTFLOW_MCP_TOKEN', 'HEARTFLOW_DIALOGUE_KEY',
    'HEARTFLOW_CODE_EXECUTOR_ENABLED', 'HEARTFLOW_MODEL_PROFILE',
    'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY',
    'HF_HOME', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME'
  ];
  const childEnv = {};
  for (const key of ALLOWED_ENV_KEYS) {
    if (key in process.env) {
      childEnv[key] = process.env[key];
    }
  }
  childEnv.NODE_ENV = 'production';

  const child = spawn(process.execPath, [serverPath, '--port', String(detectedPort)], {
    detached: true,
    stdio: ['ignore', outLog, errLog],
    env: childEnv,
  });

  child.unref();
  writePid(child.pid);

  // 等待进程真正启动
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (isProcessAlive(child.pid)) {
        resolve({ pid: child.pid, method: 'nohup', port: detectedPort });
      } else if (attempts > 10) {
        removePid();
        reject(new Error('进程启动后立即退出，查看日志: ' + path.join(LOG_DIR, 'heartflow-error.log')));
      } else {
        setTimeout(check, 500);
      }
    };
    setTimeout(check, 500);
  });
}

function nohupStop() {
  const pid = readPid();
  if (!pid || !isProcessAlive(pid)) {
    removePid();
    return;
  }
  process.kill(pid, 'SIGTERM');
  // 等待进程退出
  let attempts = 0;
  while (isProcessAlive(pid) && attempts < 20) {
    const { wait } = require('timers/promises');
    wait(500);
    attempts++;
  }
  if (isProcessAlive(pid)) {
    process.kill(pid, 'SIGKILL');
  }
  removePid();
}

// ─── 主命令 ────────────────────────────────────────────────────────────────

async function main() {
  const action = process.argv[2] || 'status';

  switch (action) {
    case 'start': {
      console.log(`[HeartFlow Daemon] 启动中... (${pm2Available ? 'PM2' : 'nohup'})`);

      let info;
      try {
        if (pm2Available) {
          info = await pm2Start();
        } else {
          info = await nohupStart();
        }
      } catch (pm2Err) {
        // [FIX 2026-09-25] 原来 PM2 一失败就直接 exit(1)——但回退 nohup 明明
        // 是设计目标（注释和文档都写了 PM2 > nohup），只是没实现。ecosystem
        // 不可写、PM2 daemon 未起、端口竞态都会走到这，全部该走 nohup。
        if (!pm2Available) throw pm2Err;
        console.warn(`[HeartFlow Daemon] ⚠️ PM2 启动失败 (${pm2Err.message})，回退 nohup`);
        info = await nohupStart();
      }

      console.log(`[HeartFlow Daemon] ✅ 已启动`);
      console.log(`  PID:     ${info.pid}`);
      console.log(`  方法:    ${info.method || 'pm2'}`);
      console.log(`  日志:    ${LOG_DIR}/`);
      console.log(`  管理:    node bin/daemon.js status`);
      break;
    }

    case 'stop': {
      console.log('[HeartFlow Daemon] 停止中...');
      try {
        if (pm2Available) {
          await pm2Stop();
        } else {
          nohupStop();
        }
        console.log('[HeartFlow Daemon] ✅ 已停止');
      } catch (err) {
        console.error(`[HeartFlow Daemon] ❌ ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'restart': {
      console.log('[HeartFlow Daemon] 重启中...');
      let info;
      try {
        if (pm2Available) {
          await new Promise((resolve, reject) => {
            pm2.restart('heartflow-mcp', (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
          pm2Disconnect();
          info = await pm2Status();
        } else {
          nohupStop();
          await new Promise(r => setTimeout(r, 1000));
          info = await nohupStart();
        }
      } catch (pm2Err) {
        // [FIX 2026-09-25] 同 start：PM2 restart 失败（如进程从未被 PM2 管过）
        // 不应让 restart 整体失败，回退 nohup 拉起。
        if (!pm2Available) throw pm2Err;
        console.warn(`[HeartFlow Daemon] ⚠️ PM2 重启失败 (${pm2Err.message})，回退 nohup`);
        nohupStop();
        await new Promise(r => setTimeout(r, 1000));
        info = await nohupStart();
      }

      console.log('[HeartFlow Daemon] ✅ 已重启');
      if (info && info.pid) console.log(`  PID: ${info.pid}`);
      break;
    }

    case 'status': {
      let info = null;
      if (pm2Available) {
        try {
          info = await pm2Status();
        } catch (_) {
          // [FIX 2026-09-25] PM2 daemon 没起时 pm2.list 会挂住/抛错，
          // status 不该因此不可用，退回 PID 文件判断。
          info = null;
        }
      }
      if (!info) {
        const pid = readPid();
        info = getProcessInfo(pid);
      }

      if (!info) {
        console.log('[HeartFlow Daemon] 未运行');
        console.log('  启动: node bin/daemon.js start');
        process.exit(0);
      }

      console.log('[HeartFlow Daemon] 运行中');
      console.log(`  PID:    ${info.pid}`);
      console.log(`  状态:   ${info.status || 'running'}`);
      if (info.uptime) {
        const h = Math.floor(info.uptime / 3600);
        const m = Math.floor((info.uptime % 3600) / 60);
        console.log(`  运行:   ${h > 0 ? `${h}h ` : ''}${m}m`);
      }
      console.log(`  日志:   ${LOG_DIR}/`);
      console.log(`  管理:   node bin/daemon.js stop | restart`);
      break;
    }

    default:
      console.log(`HeartFlow Daemon Manager
Usage: node bin/daemon.js <command>
Commands:
  start     启动后台守护进程 (PM2 > nohup)
  stop      停止守护进程
  restart   重启
  status    查看运行状态

示例:
  node bin/daemon.js start    # 首次启动
  node bin/daemon.js status   # 检查状态
  node bin/daemon.js restart  # 更新代码后重启`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`[HeartFlow Daemon] 错误:`, err.message);
  process.exit(1);
});
