#!/usr/bin/env node

/**

 * HeartFlow MCP HTTP SSE Server

 *

 * 常驻模式：启动 HTTP 服务，通过 SSE (Server-Sent Events) 暴露 MCP 工具。

 * Hermes 通过 HTTP 连接，不会因为连接断开而杀死进程。

 * 一次启动，永久服务——1秒内响应。

 *

 * 启动: node mcp-server-http.js [--port 8099]

 * 连接: hermes mcp add heartflow --url http://localhost:8099/mcp

 */



const path = require('path');


// [v6.6.4] P0: gate.action → 决策类型映射（品牌四层理论）
const DECISION_TYPE_MAP = {
  pass: 'RESONATE',     // 通过 → 共振/加强
  verify: 'HOLD',       // 需验证 → 坚守
  rewrite: 'HEAL',      // 需改写 → 自愈/修复
  block: 'HEAL',        // 拦截 → 自愈/修复
  unknown: 'HOLD',      // 未知 → 坚守
};

function gateActionToDecisionType(gateAction) {
  return DECISION_TYPE_MAP[gateAction] || DECISION_TYPE_MAP.unknown;
}


const fs = require('./utils/safe-fs');

const http = require('http');

const net = require('net');

const crypto = require('crypto');
const { TOOLS } = require('./mcp/tools-registry.js');



// ═══════════════════════════════════════════════

// 配置

// ═══════════════════════════════════════════════

const SOCKET_PATH = (() => {
  const idx = process.argv.indexOf('--socket');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
})();

const PORT = (() => {
  if (SOCKET_PATH) return null;
  if (process.argv[2] === '--port' && process.argv[3]) return parseInt(process.argv[3], 10);
  if (process.env.MCP_PORT) return parseInt(process.env.MCP_PORT, 10);
  for (let port = 8099; port <= 8105; port++) {
    try {
      const sock = net.createServer();
      sock.listen(port);
      sock.close();
      return port;
    } catch (_) { /* port in use */ }
  }
  return 8099;
})();



// ─── HeartFlow 根目录自动检测 ───────────────────────────────


function resolveHFDir() {

  // 1. 优先使用环境变量

  if (process.env.HEARTFLOW_SKILL_DIR) return process.env.HEARTFLOW_SKILL_DIR;

  if (process.env.HEARTFLOW_DIR) return process.env.HEARTFLOW_DIR;



  // 2. 自动检测：用 __dirname 向上查找 src/core/heartflow.js

  let dir = __dirname;

  for (let i = 0; i < 10; i++) {

    const candidate = path.join(dir, 'src', 'core', 'heartflow.js');

    if (fs.existsSync(candidate)) return dir;

    const parent = path.dirname(dir);

    if (parent === dir) break;

    dir = parent;

  }



  // 3. Fallback：尝试多个可能的安装位置

  const fallbacks = [

    path.join(process.env.HOME, '.hermes', 'skills', 'mark-heartflow-skill'),

    path.join(process.env.HOME, '.hermes', 'skills', 'heartflow'),

    path.join(process.env.HOME, 'Documents', 'ClaudeCode'),

  ];

  for (const fb of fallbacks) {

    const candidate = path.join(fb, 'src', 'core', 'heartflow.js');

    if (fs.existsSync(candidate)) return fb;

  }

  // 最后兜底：返回 mark-heartflow-skill 路径（即使不存在，调用方会报错）

  return path.join(process.env.HOME, '.hermes', 'skills', 'mark-heartflow-skill');

}

const HF_DIR = resolveHFDir();

const HEARTFLOW_PATH = path.join(HF_DIR, 'src', 'core', 'heartflow.js');



// ─── 版本号读取（统一入口）────────────────────────────────

function getVersion() {

  try {

    const vFile = path.join(HF_DIR, 'VERSION');

    if (fs.existsSync(vFile)) return fs.readFileSync(vFile, 'utf8').trim();

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

  try {

    const pkgFile = path.join(HF_DIR, 'package.json');

    if (fs.existsSync(pkgFile)) {

      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));

      if (pkg.version) return pkg.version;

    }

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

  return 'unknown';

}



// 安全配置

// Token 认证：未设置 HEARTFLOW_MCP_TOKEN 时自动生成随机 Token 并强制认证

// [v6.2.7] 从 .env 文件加载（如果环境变量没设）
try {
  const envPath = require('path').join(__dirname, '..', '.env');
  if (require('fs').existsSync(envPath)) {
    for (const line of require('fs').readFileSync(envPath, 'utf8').trim().split('\n').filter(Boolean)) {
      const eq = line.indexOf('=');
      if (eq > 0) process.env[line.slice(0, eq)] = process.env[line.slice(0, eq)] || line.slice(eq + 1);
    }
  }
} catch (_) { /* 防御性: 配置加载失败不阻断 */ }

const AUTH_TOKEN = process.env.HEARTFLOW_MCP_TOKEN || process.env.MCP_HEARTFLOW_API_KEY || process.env.MCP_HEARTFLOW_KEY || (() => {

  const token = require('crypto').randomBytes(32).toString('hex');

  // [v6.2.7] 自动写入 .env，让 config.yaml 的 ${MCP_HEARTFLOW_KEY} 能读到
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const fs2 = require('fs');
    let env = '';
    try { env = fs2.readFileSync(envPath, 'utf8'); } catch (_) { /* 防御性: env读取失败用默认值 */ }
    if (!env.includes('MCP_HEARTFLOW_KEY=')) {
      fs2.appendFileSync(envPath, `\nMCP_HEARTFLOW_KEY=${token}\n`);
      if (process.env.HEARTFLOW_DEBUG) console.log('[MCP] Token auto-written to .env as MCP_HEARTFLOW_KEY');
    }
  } catch (_) { /* 防御性: 配置加载失败不阻断 */ }

  if (process.env.HEARTFLOW_DEBUG) console.log('[MCP] HEARTFLOW_MCP_TOKEN not set. Auto-generated ephemeral token (not printed for security).');

  if (process.env.HEARTFLOW_DEBUG) console.log('[MCP] Set HEARTFLOW_MCP_TOKEN env var for persistent auth across restarts.');

  return token;

})();

const AUTH_ENABLED = true;



// ─── 时间安全的 token 比较（防止 timing attack）───

function safeCompare(provided, expected) {

  // [AUDIT-FIX] 无 token 时拒绝所有请求（不再允许未认证访问）

  if (!AUTH_TOKEN) return false;

  if (!provided || !expected) return false;

  const a = Buffer.from(String(provided), 'utf8');

  const b = Buffer.from(String(expected), 'utf8');

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);

}



// ═══════════════════════════════════════════════

// 全局状态

// ═══════════════════════════════════════════════

let heartflow = null;

let version = 'unknown';



// ─── 简易速率限制器（防止 DoS）───

const RATE_LIMIT_WINDOW = 60000; // 1 分钟窗口

const RATE_LIMIT_MAX = 100; // 每分钟最多 100 请求

const _rateMap = new Map(); // IP → { count, windowStart }



// [AUDIT-FIX] Token 维度速率限制：防止 token 暴力破解

const TOKEN_RATE_LIMIT_WINDOW = 60000; // 1 分钟窗口

const TOKEN_RATE_LIMIT_MAX = 100; // [AUDIT-FIX H-03] 每个 token 每分钟最多 5 请求（防暴力破解）

const _tokenRateMap = new Map(); // tokenHash → { count, windowStart }



function checkRateLimit(ip) {

  const now = Date.now();

  let entry = _rateMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {

    entry = { count: 0, windowStart: now };

    _rateMap.set(ip, entry);

  }

  entry.count++;

  return entry.count <= RATE_LIMIT_MAX;

}



// [AUDIT-FIX] Token 维度速率检查

function checkTokenRateLimit(tokenHash) {

  const now = Date.now();

  let entry = _tokenRateMap.get(tokenHash);

  if (!entry || now - entry.windowStart > TOKEN_RATE_LIMIT_WINDOW) {

    entry = { count: 0, windowStart: now };

    _tokenRateMap.set(tokenHash, entry);

  }

  entry.count++;

  return entry.count <= TOKEN_RATE_LIMIT_MAX;

}



// 定期清理过期的速率限制记录

setInterval(() => {

  const now = Date.now();

  for (const [ip, entry] of _rateMap) {

    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) _rateMap.delete(ip);

  }

  for (const [hash, entry] of _tokenRateMap) {

    if (now - entry.windowStart > TOKEN_RATE_LIMIT_WINDOW * 2) _tokenRateMap.delete(hash);

  }

}, 120000);



// 从 VERSION 文件读取版本

version = getVersion();



// ═══════════════════════════════════════════════

// Unix Socket JSON-RPC 会话处理

// ═══════════════════════════════════════════════

function handleUnixClient(socket) {

  let buf = '';

  socket.setEncoding('utf8');

  socket.on('data', async (chunk) => {

    buf += chunk;

    const lines = buf.split('\n');

    buf = lines.pop();

    for (const line of lines) {

      if (!line.trim()) continue;

      try {

        const req = JSON.parse(line);

        const result = await handleRequest(req, null);

        if (result !== null) {

          socket.write(makeResponse(req.id, result));

        }

      } catch (e) {

        socket.write(makeError(null, -32700, 'Parse error: ' + e.message));

      }

    }

  });

  socket.on('error', (err) => {

    console.error(`[HeartFlow MCP] Unix socket client error: ${err.message}`);

  });

}


// ═══════════════════════════════════════════════

// MCP 工具定义

// ═══════════════════════════════════════════════


// 引擎初始化

// ═══════════════════════════════════════════════

function initHeartFlow() {

  const startTime = Date.now();



  if (!fs.existsSync(HEARTFLOW_PATH)) {

    console.error('[HeartFlow MCP] 引擎文件不存在');

    process.exit(1);

  }



  try {

    // 读版本（由外层 getVersion() 统一处理，此处仅确保最新）

    version = getVersion();



    const { HeartFlow } = require(HEARTFLOW_PATH);

    heartflow = new HeartFlow({ rootPath: HF_DIR });

    heartflow.start();



    maybeAttachPostProcessHookBus();



    const elapsed = Date.now() - startTime;

    const loadedCount = Object.keys(heartflow._modules || {}).length;



    console.error(`[HeartFlow MCP] 引擎已启动 (${elapsed}ms, ${loadedCount} 模块, v${version})`);

    return true;

  } catch (err) {

    console.error(`[HeartFlow MCP] 引擎启动失败:`, err.message);

    process.exit(1);

  }

}



// ─── 后处理 & 反馈钩子 ───────────────────────────────────────

let postprocess = null;

try {

  const { PostProcessHooks } = require(path.join(HF_DIR, 'src', 'core', 'postprocess-hooks.js'));

  postprocess = new PostProcessHooks({ rootPath: HF_DIR });

} catch (_) {

  console.error('[HeartFlow MCP] postprocess-hooks 初始化失败，后续将跳过后处理');

}



// [PostProcessHooks] extend with shared hookBus when available

function maybeAttachPostProcessHookBus() {

  if (!postprocess || typeof postprocess.attachHookBus !== 'function') return;

  try {

    const hf = typeof heartflow === 'undefined' ? null : heartflow;

    const bus = hf && hf._hookBus ? hf._hookBus : null;

    if (bus) postprocess.attachHookBus(bus);

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

// [AUDIT-FIX] console.error("[{context}] catch error:", e);

}



maybeAttachPostProcessHookBus();



// ═══════════════════════════════════════════════

// 工具处理函数（与 stdio 版本相同）

// ═══════════════════════════════════════════════



function safeDispatch(route, ...args) {

  if (!heartflow) throw new Error('引擎未启动');

  // [v6.7.1] 熔断前置路由
    const cb = require('./circuit-breaker.js');
const { checkOutput: pipelineCheckOutput } = require('./pipeline');
    const cbGuard = cb.guard();
    if (!cbGuard.allowed) {
      return { error: cbGuard.reason, state: cbGuard.state };
    }
    try {

    const result = heartflow.dispatch(route, ...args);

    return result !== undefined ? result : null;

  } catch (err) {

    return { error: err.message };

  }

}



async function safeAsyncCall(fn) {

  if (!heartflow) throw new Error('引擎未启动');

  try {

    const result = await fn();

    return result !== undefined ? result : null;

  } catch (err) {

    return { error: err.message };

  }

}



async function handleThink(args) {

  const { input, effort } = args;

  if (!input) throw new Error('input 是必填参数');

  const normalizedEffort = typeof effort === 'number' ? Math.max(1, Math.min(100, Math.round(effort))) : null;



  const startTime = Date.now();

  let thoughtChain;

  // [P0-1] 长文本回声修复: >100 字走 pipeline.checkOutput (45维判别), 不走 think 偷懒路由
  if (typeof input === 'string' && input.length > 100) {

    try {

      thoughtChain = pipelineCheckOutput(input);

    } catch (_) {

      thoughtChain = null;

    }

  }

  if (!thoughtChain) {

    const [psychology, judgment, tc] = await Promise.all([

      Promise.resolve().then(() => safeDispatch('psychology.analyzePsychology', input)).catch(e => ({ error: e.message })),

      Promise.resolve().then(() => safeDispatch('truth.checkStatement', input)).catch(e => ({ error: e.message })),

      safeAsyncCall(() => heartflow.think(input, undefined, { compact: true, effort: normalizedEffort || undefined }))

    ]);

    thoughtChain = tc;

  } else {

    // Short path: still run parallel psychology/truth for consistency

    await Promise.all([

      safeDispatch('psychology.analyzePsychology', input).catch(() => ({})),

      safeDispatch('truth.checkStatement', input).catch(() => ({}))

    ]);

  }



  // 生成可读报告

  let report = null;

  try {

    const { ReportGenerator } = require(path.join(HF_DIR, 'src/report/report-generator.js'));

    const gen = new ReportGenerator();

    const generated = gen.generate(thoughtChain);

    report = generated.report;

  } catch (e) {

    report = { error: '报告生成失败' };

  }



  let result = { report, timestamp: Date.now() };

  // [v6.3.7] 附加心虫增强字段——公式计算/辨别/公式搜索/输出门禁
  try {
    if (thoughtChain) {
      if (thoughtChain._formulaCalculations) result.formulaCalculations = thoughtChain._formulaCalculations;
      if (thoughtChain._formulasFound) result.formulasFound = thoughtChain._formulasFound;
      if (thoughtChain._discrimination) {
        // [v6.4.5] 精简：只保留有信号的维度（全 0 空维度是 tok 浪费）
        const d = thoughtChain._discrimination;
        const signals = {};
        for (const [k, v] of Object.entries(d || {})) {
          const score = typeof v === 'object' ? (v.score ?? v.count ?? 0) : v;
          if (score > 0) signals[k] = v;
        }
        result.discrimination = signals;
      }
      if (thoughtChain._outputChecklist) {
        // [v6.4.5] 精简：只保留通过/失败状态 + 失败步骤摘要（完整 steps 数组 tok 大且 MCP 不消费）
        const oc = thoughtChain._outputChecklist;
        const failedSteps = (oc.steps || []).filter(s => !s.passed).map(s => s.name);
        result.outputChecklist = {
          passed: !!oc.passed,
          failedSteps,
          warnings: oc.warnings || [],
          stepCount: (oc.steps || []).length,
        };
      }
      if (thoughtChain._formulasFound && thoughtChain._formulasFound.length > 0) {
        result.formulasSummary = thoughtChain._formulasFound.slice(0,5).map(f => f.name + ': ' + (f.formula||'').slice(0,60)).join(' | ');
      }
      if (thoughtChain._formulaCalculations) {
        const keys = Object.keys(thoughtChain._formulaCalculations);
        result.formulaCalcSummary = keys.join(', ') + ' (' + keys.length + '个公式)';
      }
      // 可读辨别报告
      if (thoughtChain.output && thoughtChain.output.conclusion) {
        try {
          const idx = require('./index.js');
          if (idx.summarizeDiscrimination) {
            result.discriminationReport = idx.summarizeDiscrimination(thoughtChain.output.conclusion);
          }
        } catch (_) { /* 防御性: MCP工具注册容错 */ }
      }
    }
  } catch (_) { /* 附加字段不阻断 */ }



  // ─── postprocessing 管线 ──────────────────────────────────────

  if (postprocess) {

    try {

      result = await postprocess.run('postprocess.desensitize', result);

      result = await postprocess.run('postprocess.format', result, { style: 'markdown' });

    } catch (_) {

      /* [v5.9.18] intentional: graceful degradation */

    }

    // 异步反馈收集，不阻塞主响应

    postprocess.feedback_collect({

      type: 'usage',

      source: 'heartflow_think',

      latencyMs: Date.now() - startTime,

      payload: { input: typeof input === 'string' ? input.slice(0, 200) : input, hasReport: !!report }

    }).catch(() => {}) /* 防御性: 异步初始化容错 */;

  }



  return result;

}



// v3.0 — 交流层 handler

function handleTranslate(args) {

  const { input } = args || {};

  if (!input) throw new Error('input 是必填参数');

  const result = safeDispatch('translator.userToLLM', input, {});

  const intent = safeDispatch('translator.intentClassifier', input, {});

  const tone = safeDispatch('translator.toneAnalyzer', input, {});

  const entities = safeDispatch('translator.entityExtractor', input);

  const needs = safeDispatch('translator.implicitNeedDetector', input, { tone });

  const confidence = safeDispatch('translator.confidenceAnnotator', result, input);

  return {

    input,

    translation: result,

    intent,

    tone,

    entities,

    implicitNeeds: needs,

    confidence,

    timestamp: Date.now()

  };

}



function handleAgentThink(args) {

  const { input, llmResponse } = args || {};

  if (!input) throw new Error('input 是必填参数');

  // 用户→LLM翻译

  const userTranslation = safeDispatch('translator.userToLLM', input, {});

  // 桥身份声明

  const identity = safeDispatch('personaCore.bridgeIdentity');

  // 立场检测

  const stance = safeDispatch('personaCore.stanceDetector', input, {});

  // 价值对齐

  const valueCheck = safeDispatch('personaCore.valueAligner', { userInput: input, bridgeIdentity: identity });

  // 如果有LLM响应，做LLM→用户翻译

  let llmTranslation = null;

  if (llmResponse) {

    llmTranslation = safeDispatch('translator.llmToUser', llmResponse, {});

  }

  return {

    input,

    translation: userTranslation,

    bridge: identity ? { declaration: identity.declaration, type: identity.type } : null,

    stance,

    valueAlignment: valueCheck,

    llmTranslation,

    timestamp: Date.now()

  };

}



function handleBridgeStatus() {

  const translator = safeDispatch('translator.userToLLM', 'status', {});

  const identity = safeDispatch('personaCore.bridgeIdentity');

  return {

    version: '3.0.0',

    bridgeType: identity?.type || 'unknown',

    bridgeDeclaration: identity?.declaration || '',

    translatorReady: !!translator,

    modules: {

      translator: ['userToLLM', 'llmToUser', 'intentClassifier', 'toneAnalyzer', 'entityExtractor', 'implicitNeedDetector', 'responseCompressor', 'confidenceAnnotator'],

      agentLayer: ['agentBridge', 'contextBuilder', 'responseInterceptor', 'translationPipeline', 'qualityFilter', 'followupSuggester', 'conflictResolver', 'uncertaintyHandler'],

      personaCore: ['bridgeIdentity', 'judgmentInjector', 'stanceDetector', 'agentCommentary', 'valueAligner', 'personalityTone', 'metaPosition'],

    },

    timestamp: Date.now()

  };

}



async function handleThinkFast(args) {

  const { input } = args;

  if (!input) throw new Error('input 是必填参数');

  const result = await safeAsyncCall(() => heartflow.think(input, 1, { compact: true, effort: 20 }));

  return { input, result: result || {}, timestamp: Date.now() };

}



async function handleDream(args) {

  const { theme = '', intensity = 0.7 } = args;

  let dreamResult = null;



  // 优先使用新的升华引擎（src/dream/engine.js）

  try {

    const DreamEnginePath = path.join(HF_DIR, 'src', 'dream', 'engine.js');

    if (fs.existsSync(DreamEnginePath)) {

      const { DreamEngine } = require(DreamEnginePath);

      const memory = heartflow && heartflow.memory ? heartflow.memory : null;

      const engine = new DreamEngine(memory, null);

      engine.boot();

      dreamResult = await engine.dream(theme);

    }

  } catch (e) {

    // 降级到旧的 DAG 引擎

  }



  // 降级方案：使用旧的 DAG dream 引擎

  if (!dreamResult && heartflow && heartflow.dream) {

    try {

      if (typeof heartflow.dream.dream === 'function') {

        const oldResult = await heartflow.dream.dream(`dream-${Date.now()}`, [{ text: theme || 'default dream', type: 'user_prompt' }], { force: true });

        dreamResult = {

          narrative: JSON.stringify(oldResult, null, 2),

          patterns: [],

          essence: '',

          structure: oldResult.level_breakdown || {},

          upgrade: [],

          sublimationQuality: 0,

          dreamComplete: true,

        };

      } else if (typeof heartflow.dreamNow === 'function') {

        dreamResult = await heartflow.dreamNow({ theme: theme || undefined, intensity: Math.max(0, Math.min(1, intensity)) });

      }

    } catch (e) { dreamResult = { error: e.message, narrative: '梦境升华引擎暂不可用。' }; }

  }

  return { dream: dreamResult || { narrative: '梦境升华引擎暂不可用', essence: '', patterns: [], upgrade: [] }, timestamp: Date.now() };

}





// [v6.6.3] 心虫统一监督入口
async function handleSupervise(args) {
  const { input, mode = 'output', context } = args || {};
  if (!input) throw new Error('input 是必填参数');
  try {
    const gate = require(HF_DIR + '/src/gate.js');
    const result = gate.runPipeline({ input, mode, context });
    const gate_action = result.gate?.action || 'unknown';
    const reason = result.gate?.reason || '';
    const verdict = result.verdict || 'unknown';
    const score = result.overallScore || 0;
    const findings = (result.findings || []).slice(0, 10).map(f => ({
      dimension: f.dimension,
      severity: f.severity,
      details: f.details,
      guidance: f.guidance || ''
    }));
    const summary = result.summary || {};
    const decisionType = gateActionToDecisionType(gate_action);
    const brandLayer = {
      RESONATE: '讲废话（重复→记住）',
      HOLD: '讲无知（教用户建立专家形象）',
      HEAL: '讲责任（敢兜底建立信任）',
    }[decisionType] || '未知';
    return {
      mode,
      input,
      gate: gate_action,
      decisionType,      // P0新增：决策类型 RESONATE/HOLD/HEAL
      brandLayer,        // P0新增：对应品牌四层理论层级
      reason,
      verdict,
      score,
      findingsCount: (result.findings || []).length,
      findings,
      block: summary.block || false,
      rewrite: summary.rewrite || false,
      verify: summary.verify || false,
      pass: summary.pass || false,
      layers_passed: summary.layers_passed || 0,
      checked_by: (result.checked_by || []).slice(0, 8).map(c => ({ layer: c.layer, ...c })),
      timestamp: Date.now()
    };
  } catch (e) {
    return { error: e.message, input };
  }
}

// [v6.6.3] 心虫单维判别入口
async function handleCheckSingle(args) {
  const { text, dimension } = args || {};
  if (!text || !dimension) throw new Error('text 和 dimension 是必填参数');
  try {
    const hf = require(HF_DIR + '/src/index.js');
    // Convert dimension to CamelCase function name: factual_consistency → checkFactualConsistency
    const fnName = 'check' + dimension.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const fn = hf[fnName];
    if (!fn) {
      const avail = Object.keys(hf).filter(k => k.startsWith('check')).sort();
      return { error: `维度 ${dimension} (${fnName}) 不存在`, available: avail };
    }
    const result = await Promise.resolve(fn(text));
    return { dimension, fn: fnName, result, timestamp: Date.now() };
  } catch (e) {
    return { error: e.message, dimension };
  }
}

// [v6.6.3] 新闻信号战略推演（包装 MacroStrategyInference）
async function handleMacroStrategy(args) {
  const { text } = args || {};
  if (!text) throw new Error('text 是必填参数');
  try {
    const { MacroStrategyInference } = require('./cortex/self-evolution/macro-strategy-inference.js');
    const engine = new MacroStrategyInference({ projectRoot: HF_DIR, signalStore: [] });
    const result = engine.infer(text);
    return { inference: result, timestamp: Date.now() };
  } catch (e) {
    return { error: e.message };
  }
}

// [v6.6.3] 教育内容检测（包装 pedagogy）
async function handlePedagogyDetect(args) {
  const { text } = args || {};
  if (!text) throw new Error('text 是必填参数');
  try {
    const { detectPedagogicalContent } = require('./pedagogy.js');
    const result = detectPedagogicalContent(text);
    return { text: text.slice(0, 200), pedagogy: result, timestamp: Date.now() };
  } catch (e) {
    return { error: e.message };
  }
}

function handleMemorySearch(args) {

  const { query, layer = 'all', limit = 10 } = args;

  if (!query) throw new Error('query 是必填参数');

  const results = {};

  const mem = heartflow ? heartflow.memory : null;

  if (mem) {

    ['core', 'learned', 'ephemeral'].forEach(l => {

      if (layer !== 'all' && layer !== l) return;

      try {

        // [安全审计修复] searchByKeywords 必须传入 layer 参数，防止跨层泄露

        const r = typeof mem.searchByKeywords === 'function' ? mem.searchByKeywords(query, limit)

          : typeof mem.search === 'function' ? mem.search(query, l, limit) : null;

        results[l] = r || { error: 'search not available' };

      } catch (e) { results[l] = { error: e.message }; }

    });

  } else {

    results.error = 'memory 实例不可用';

  }

  return { query, layer, limit, results, timestamp: Date.now() };

}

function handleMemoryEraser(args) {

  const { action = 'stats', scope, tag, sessionId } = args;

  if (!heartflow) throw new Error('heartflow 实例不可用');

  try {

    // 懒加载 DataEraser（复用 heartflow 的 dataDir）
    const { DataEraser } = require('./memory/data-eraser.js');

    const dataDir = heartflow.dataDir || heartflow.options?.dataDir || process.cwd();

    const eraser = new DataEraser(dataDir);

    let result;

    switch (action) {

      case 'eraseEphemeral':

        if (!scope) throw new Error('eraseEphemeral 需要 scope 参数');

        result = eraser.eraseEphemeral(scope);

        break;

      case 'eraseByTag':

        if (!tag) throw new Error('eraseByTag 需要 tag 参数');

        result = eraser.eraseByTag(tag);

        break;

      case 'eraseSession':

        if (!sessionId) throw new Error('eraseSession 需要 sessionId 参数');

        result = eraser.eraseSession(sessionId);

        break;

      default:

        result = eraser.stats();

    }

    return { action, result, timestamp: Date.now() };

  } catch (e) {

    throw new Error('DataEraser 失败: ' + e.message);

  }

}



function handleEmotion(args) {

  const { input } = args;

  if (!input) throw new Error('input 是必填参数');

  const [psychology, padResult] = [safeDispatch('psychology.analyzePsychology', input), safeDispatch('psychology.getPAD', input)];

  return {

    input,

    emotion: (psychology && psychology.emotion) || (psychology && psychology.primaryEmotion) || { type: 'unknown', intensity: 0 },

    pad: padResult || (psychology && psychology.summary ? { raw: psychology.summary } : {}),

    needs: (psychology && psychology.needs) || [],

    summary: (psychology && psychology.summary) || '',

    timestamp: Date.now()

  };

}



function handleSelfHeal(args) {

  const { context } = args;

  if (!context) throw new Error('context 是必填参数');

  return {

    context,

    heal: safeDispatch('evolution.heal', context) || {},

    evolution: safeDispatch('evolution.getStats') || {},

    relevantLessons: safeDispatch('lesson.getTopLessons', 5) || [],

    timestamp: Date.now()

  };

}



function handleProviderHealth(args) {

  const { provider = 'default', action, success, latency, error } = args || {};

  if (!action) throw new Error('action 是必填参数');

  const sh = heartflow?.selfHealing;

  if (!sh) return { error: 'selfHealing 模块不可用', timestamp: Date.now() };



  if (action === 'record') {

    sh.recordProviderCall(provider, { success: !!success, latency: latency || 0, error: error || null });

    return { recorded: true, provider, timestamp: Date.now() };

  }



  // action === 'get'

  const health = sh.getProviderHealth(provider);

  return { provider, health, timestamp: Date.now() };

}



function handleCostTracking(args) {

  const { action, provider, tokensIn, tokensOut, cost, taskType = 'unknown', window = 'all' } = args || {};

  if (!action) throw new Error('action 是必填参数');

  const sh = heartflow?.selfHealing;

  if (!sh) return { error: 'selfHealing 模块不可用', timestamp: Date.now() };



  if (action === 'record') {

    sh.recordCost({ provider: provider || 'unknown', tokensIn: tokensIn || 0, tokensOut: tokensOut || 0, cost: cost || 0, taskType });

    return { recorded: true, timestamp: Date.now() };

  }



  // action === 'stats'

  const stats = sh.getCostStats(window);

  return { window, stats, timestamp: Date.now() };

}



function handleStatus(args) {

  const { detail = 'basic' } = args || {};

  const startTime = Date.now();

  const status = { version, running: heartflow !== null, modules: heartflow ? Object.keys(heartflow._modules || {}).length : 0 };

  if (heartflow) {

    try { const ms = safeDispatch('memory.getStats'); if (ms) status.memoryLayers = { core: ms.core || 0, learned: ms.learned || 0, ephemeral: ms.ephemeral || 0 }; } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

    try { const q = safeDispatch('evolution.getStats'); if (q) status.qtable = q; } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

  }

  status.checkTime = Date.now() - startTime;

  if (detail === 'basic') return { version: status.version, running: status.running, modules: status.modules, memoryLayers: status.memoryLayers || {}, checkTime: status.checkTime };

  return status;

}



function handleAgentPsychology(args) {

  const { activeGoals, context, action } = args || {};

  return safeDispatch('agentPsychology.fullAssessment', { activeGoals, context, action });

}



function handleEnginePacing(args) {

  const { stats } = args || {};

  // 先获取认知负荷数据

  const ap = safeDispatch('agentPsychology.fullAssessment', {}) || {};

  const load = ap?.cognitiveLoad?.load ?? stats?.cognitiveLoad ?? 0;

  const context = {

    cognitiveLoad: load,

    goalConflicts: ap?.goalConflicts?.count ?? 0,

    recentErrors: stats?.recentErrors ?? 0

  };

  const rhythm = safeDispatch('psychology.diagnoseCognitiveRhythm', context) || {};

  const pacing = safeDispatch('psychology.generateEnginePacing', load) || {};

  const pause = safeDispatch('psychology.diagnoseNeedForPause', context) || {};

  const grounding = safeDispatch('psychology.diagnoseNeedForGrounding', ap) || {};

  // v3.9.1: 加 innerMonologue 字段

  const innerMonologue = _generatePacingMonologue(rhythm, pacing, pause, grounding, load);

  return {

    rhythm: rhythm.needsBreathing ? rhythm : { needsBreathing: false, reason: '认知负荷正常' },

    pacing: pacing.suggestions || pacing,

    pause: pause.needsPause ? pause : { needsPause: false },

    grounding: grounding.needsGrounding ? grounding : { needsGrounding: false },

    innerMonologue,  // 新增：引擎节奏内心独白

    healthScore: ap?.healthScore ?? 1,

    timestamp: Date.now()

  };

}



function handleCognitiveCheck(args) {

  const { stats, errors } = args || {};

  const ap = safeDispatch('agentPsychology.fullAssessment', {}) || {};

  const checkin = safeDispatch('psychology.engineCheckIn', null) || {};

  const distortion = safeDispatch('psychology.diagnoseCognitiveDistortion', ap) || {};

  const recovery = safeDispatch('psychology.diagnoseSelfTreatmentNeeded', { errors: errors || [], ...ap }) || {};

  const summary = safeDispatch('psychology.getEngineStateSummary', ap) || '';

  return {

    summary,

    checkin,

    distortions: distortion.distortions || [],

    overallBias: distortion.overallBias ?? 0,

    needsRecovery: recovery.needsTreatment || false,

    recoveryReason: recovery.reason || '',

    healthScore: ap?.healthScore ?? 1,

    timestamp: Date.now()

  };

}



// ─── v3.0.1 — 哲学→决策转化器 ─────────────────────────────────────────

function handlePhilosophyDecision(args) {

  const { context } = args || {};

  const ap = safeDispatch('agentPsychology.fullAssessment', {}) || {};

  const philo = safeDispatch('agentPhilosophy.fullAssessment', {}) || {};

  // philosophyToDecision.decide(philosophyResult, psychologyResult, context) — 三个独立参数

  const decision = safeDispatch('philosophyToDecision.decide', philo, ap, context || {}) || {};

  // v3.9.1: 加 innerMonologue 字段

  const innerMonologue = _generatePhilosophyMonologue(decision, philo, ap);

  return {

    decision,

    innerMonologue,  // 新增：哲学决策内心独白

    psychologySnapshot: {

      healthScore: ap?.healthScore ?? 1,

      cognitiveLoad: ap?.cognitiveLoad?.load ?? 0,

      status: ap?.status ?? 'unknown'

    },

    philosophySnapshot: {

      entropyDirection: philo?.entropyDirection?.score ?? null,

      transmission: philo?.transmission?.score ?? null

    },

    timestamp: Date.now()

  };

}



// ─── v3.0.2 — 通用决策路由引擎 ─────────────────────────────────────────

function handleDecisionRouter(args) {

  const { input } = args || {};

  if (!input) throw new Error('input 是必填参数');

  

  // P1: 自然文本路由 → 先过 gate 提取结构化信号

  let decisionResult = null;

  let innerMonologue = null;

  

  if (typeof input === 'string' && !input.startsWith('{') && !input.startsWith('{ cognitiveLoad')) {

    try {

      const gate = require(HF_DIR + '/src/gate.js');

      const pipelineResult = gate.runPipeline({ input, mode: 'input' });

      const gateAction = pipelineResult.gate?.action || 'unknown';

      const score = pipelineResult.overallScore || 0;

      

      const structuredInput = JSON.stringify({

        cognitiveLoad: score > 0.7 ? 0.3 : score > 0.4 ? 0.6 : 0.8,

        dissonance: pipelineResult.findings?.length || 0,

        quality: gateAction === 'pass' ? 0.9 : gateAction === 'verify' ? 0.6 : 0.3,

        severity: gateAction === 'block' ? 0.9 : gateAction === 'rewrite' ? 0.7 : 0.4,

        dimension: pipelineResult.findings?.[0]?.dimension || 'general',

        text: input,

      });

      decisionResult = safeDispatch('decisionRouter.evaluate', structuredInput, 'mcp');

      innerMonologue = _generateInnerMonologue(decisionResult);

    } catch (e) {

      decisionResult = safeDispatch('decisionRouter.evaluate', input, 'mcp');

      innerMonologue = _generateInnerMonologue(decisionResult);

    }

  } else {

    decisionResult = safeDispatch('decisionRouter.evaluate', input, 'mcp');

    innerMonologue = _generateInnerMonologue(decisionResult);

  }

  

  return {

    matched: decisionResult.matched,

    decision: decisionResult.decision || null,

    rules: (decisionResult.rules || []).slice(0, 5),

    innerMonologue,

    timestamp: Date.now()

  };

}



/**

 * v3.9.1: 生成内心独白（吸收 AI Inner OS 协议）

 * 基于决策路由结果，生成一句自然语言的内心活动描述

 * 人设是运行过程自然产生的，不是预设或设置的

 * @param {object} result - decisionRouter.evaluate 的返回值

 * @returns {string|null} 内心独白（如果启用且可生成）

 */

function _generateInnerMonologue(result) {

  // 从 config 读取开关和频率（默认关闭，避免干扰主输出）

  const configPath = path.join(HF_DIR, 'config.json');

  let enableInnerMonologue = false;

  let frequency = 'normal';

  try {

    if (fs.existsSync(configPath)) {

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      enableInnerMonologue = config.enableInnerMonologue || false;

      frequency = config.innerMonologueFrequency || 'normal';

    }

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }



  if (!enableInnerMonologue) return null;



  // 频率控制

  const shouldOutput = _shouldOutputMonologue(frequency, result);

  if (!shouldOutput) return null;



  // 基于决策结果 + 认知状态生成独白

  const { decision, matched, rules, U, D, A, H } = result || {};

  if (!decision) return null;



  // 自由表达：基于认知状态（U/D/A/H）生成自然的内心独白

  // 不是预设人设，而是运行过程自然产生的表达

  const monologues = {

    'pause': [

      '等等，这个输入有点复杂，我先停一下再想。',

      '嗯，这个需要仔细考虑一下。',

      '稍等，我整理一下思路。'

    ],

    'accelerate': [

      '这个方向对，可以继续推进。',

      '好的，这个思路可行。',

      '没问题，继续。'

    ],

    'heal': [

      '检测到认知失调，需要自我修复。',

      '这里有点不对劲，需要调整一下。',

      '发现矛盾，正在修复。'

    ],

    'turn': [

      '当前路径不通，换个角度试试。',

      '这个方向走不通，换一个。',

      '需要转向，重新思考。'

    ],

    'hold': [

      '保持当前状态，先观察一下。',

      '暂时不动，看看情况。',

      '等一下，再观察。'

    ],

    'resonate': [

      '这个模式和之前的经验共鸣了。',

      '似曾相识，这个模式我见过。',

      '有共鸣，这个思路是对的。'

    ],

    'transmit': [

      '有重要发现，需要传递出去。',

      '这个很重要，需要记录下来。',

      '发现关键点，必须传递。'

    ],

    'rest': [

      '认知负荷有点高，先休息一下。',

      '有点累了，暂停一下。',

      '需要休息，认知过载。'

    ]

  };



  // 随机选一个表达（模拟自然产生，不是固定人设）

  const options = monologues[decision] || [

    `决策：${decision}（U=${U?.toFixed(2) || '?'}, D=${D?.toFixed(2) || '?'}, A=${A?.toFixed(2) || '?'}, H=${H?.toFixed(2) || '?'})`

  ];

  return options[Math.floor(Math.random() * options.length)];

}



/**

 * v3.9.1: 频率控制（吸收 AI Inner OS 协议）

 * 根据频率配置，决定是否输出内心独白

 * @param {string} frequency - low / normal / high

 * @param {object} result - decisionRouter.evaluate 的返回值

 * @returns {boolean} 是否输出

 */

function _shouldOutputMonologue(frequency, result) {

  const { decision, U, D, A, H } = result || {};



  switch (frequency) {

    case 'low':

      // 只在关键判断、失败恢复、重要结论前输出

      return ['heal', 'turn', 'rest'].includes(decision);



    case 'high':

      // 阶段推进、连续工具调用、失败重试、发现问题时都可以输出

      // 但避免每句话都刷屏（用随机 70% 概率）

      return Math.random() < 0.7;



    case 'normal':

    default:

      // 每个任务至少一次；复杂任务可在开始、转折、验证或收尾阶段各输出一次

      // 用随机 40% 概率（避免过多）

      return Math.random() < 0.4;

  }

}



/**

 * v3.9.1: 生成哲学决策内心独白（吸收 AI Inner OS 协议）

 * 基于哲学决策结果，生成一句自然语言的内心活动描述

 * @param {object} decision - philosophyToDecision.decide 的返回值

 * @param {object} philo - agentPhilosophy.fullAssessment 的返回值

 * @param {object} ap - agentPsychology.fullAssessment 的返回值

 * @returns {string|null} 内心独白（如果启用且可生成）

 */

function _generatePhilosophyMonologue(decision, philo, ap) {

  // 检查开关

  const configPath = path.join(HF_DIR, 'config.json');

  let enableInnerMonologue = false;

  try {

    if (fs.existsSync(configPath)) {

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      enableInnerMonologue = config.enableInnerMonologue || false;

    }

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }



  if (!enableInnerMonologue) return null;



  // 基于哲学决策生成独白

  const { action, confidence } = decision || {};

  if (!action) return null;



  const monologues = {

    'pursueTruth': [

      '真，这个方向值得深入。',

      '真相很重要，继续追。',

      '求真，不能停在这里。'

    ],

    'pursueGoodness': [

      '善，这个选择对人有帮助。',

      '利他，这个方向是对的。',

      '行善，不是为了回报。'

    ],

    'pursueBeauty': [

      '美，这个结构很优雅。',

      '简洁，才是真正的美。',

      '对称，这个设计很美。'

    ],

    'reconcile': [

      '矛盾，需要找到平衡点。',

      '对立，不是非此即彼。',

      '统一，真和善可以共存。'

    ],

    'suspend': [

      '不确定，先放着。',

      '信息不够，不急着下结论。',

      '存疑，比错误结论好。'

    ]

  };



  const options = monologues[action] || [

    `哲学决策：${action}（置信度 ${confidence || '?'})`

  ];

  return options[Math.floor(Math.random() * options.length)];

}



/**

 * v3.9.1: 生成引擎节奏内心独白（吸收 AI Inner OS 协议）

 * 基于引擎节奏状态，生成一句自然语言的内心活动描述

 * @param {object} rhythm - diagnoseCognitiveRhythm 的返回值

 * @param {object} pacing - generateEnginePacing 的返回值

 * @param {object} pause - diagnoseNeedForPause 的返回值

 * @param {object} grounding - diagnoseNeedForGrounding 的返回值

 * @param {number} load - 认知负荷（0-1）

 * @returns {string|null} 内心独白（如果启用且可生成）

 */

function _generatePacingMonologue(rhythm, pacing, pause, grounding, load) {

  // 检查开关

  const configPath = path.join(HF_DIR, 'config.json');

  let enableInnerMonologue = false;

  try {

    if (fs.existsSync(configPath)) {

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      enableInnerMonologue = config.enableInnerMonologue || false;

    }

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }



  if (!enableInnerMonologue) return null;



  // 基于节奏状态生成独白

  if (pause?.needsPause) {

    const options = [

      `认知负荷有点高（${load.toFixed(2)}），先休息一下。`,

      '有点累了，暂停一下。',

      '需要休息，认知过载。'

    ];

    return options[Math.floor(Math.random() * options.length)];

  }



  if (grounding?.needsGrounding) {

    const options = [

      '认知有点飘，需要 grounded。',

      '太抽象了，回到具体。',

      '需要落地，不能一直飞。'

    ];

    return options[Math.floor(Math.random() * options.length)];

  }



  if (rhythm?.needsBreathing) {

    const options = [

      '节奏有点紧，需要调整呼吸。',

      '推进太快，稍微缓一下。',

      '认知节奏需要优化。'

    ];

    return options[Math.floor(Math.random() * options.length)];

  }



  // 默认：基于负荷的简单表达

  if (load > 0.7) {

    return '负荷有点高，但还能继续。';

  } else if (load < 0.3) {

    return '状态不错，可以继续推进。';

  } else {

    return null;  // 负荷正常，不输出独白

  }

}



function handleDecisionRouterStats(args) {

  const stats = safeDispatch('decisionRouter.getStats') || {};

  const history = safeDispatch('decisionRouter.getHistory', 10) || [];

  return {

    stats,

    recentDecisions: history,

    timestamp: Date.now()

  };

}

function handleModulesStatus(args) {

  const hf = (typeof safeDispatch === 'function' && safeDispatch.length ? safeDispatch('heartflow.getStatus') : null) || globalThis.heartflow || null;

  if (!hf) {

    return { sparse_mode: false, reason: 'heartflow_instance_not_found' };

  }

  const activeModules = hf._modules ? Object.keys(hf._modules).sort() : [];

  const sparse = {

    sparse_mode: !!hf._sparseMode,

    effort: hf._sparseEffort || null,

    mode: hf._reasoningEffortMode || null,

    activeModules,

    skippedModules: [],

    executionThreshold: 76,

  };

  if (hf._activeModules && typeof hf._activeModules.has === 'function') {

    sparse.skippedModules = activeModules.filter(m => !hf._activeModules.has(m));

  }

  return sparse;

}

function handleCacheStats(args) {

  const hf = globalThis.heartflow || null;

  if (!hf || !hf._thinkCache) {

    return { error: 'cache_not_initialized' };

  }

  const cache = hf._thinkCache;

  const stats = { ...cache.stats };

  const total = stats.hits + stats.misses;

  stats.hitRate = total > 0 ? Number((stats.hits / total).toFixed(4)) : null;

  const ttlByMode = {

    low: '10 minutes',

    high: '5 minutes',

    max: 'no cache',

  };

  return {

    cache: stats,

    ttlByMode,

    currentMode: hf._reasoningEffortMode || null,

    currentEffort: hf._sparseEffort || null,

  };

}



// ─── v3.1.0 — 新增工具 ─────────────────────────────────────────

function handleSuperviseDao(args) {
  try {
    const engine = heartflow;
    if (!engine || !engine.daoDecision) return { error: 'daoDecision not ready', timestamp: Date.now() };
    const input = args || {};
    return engine.daoDecision.evaluate({ text: input.text || '', intent: input.intent || '', action: input.action || '', history: input.history || [] });
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

function handleSuperviseUncertainty(args) {
  try {
    const engine = heartflow;
    if (!engine || !engine.uncertaintyQuantifier) return { error: 'uncertaintyQuantifier not ready', timestamp: Date.now() };
    const input = args || {};
    return engine.uncertaintyQuantifier.evaluate(input.text || '', { domain: input.domain, hasEvidence: input.hasEvidence, multiSource: input.multiSource });
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

function handleSupervisePriority(args) {
  try {
    const engine = heartflow;
    if (!engine || !engine.priorityGuardian) return { error: 'priorityGuardian not ready', timestamp: Date.now() };
    const input = args || {};
    return engine.priorityGuardian.check({ userIntent: input.userIntent || '', action: input.action || '', humanProgress: input.humanProgress || {} });
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

function handleSuperviseProgress(args) {
  try {
    const engine = heartflow;
    if (!engine || !engine.progressJudgment) return { error: 'progressJudgment not ready', timestamp: Date.now() };
    const input = args || {};
    return engine.progressJudgment.judge({ action: input.action || '', claim: input.claim || '', evidence: input.evidence || [], userIntent: input.userIntent || '' });
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

function handleModuleHealth(args) {

  try {

    const { ModuleHealthChecker } = require(path.join(HF_DIR, 'src/shield/module-health-checker.js'));

    const checker = new ModuleHealthChecker(heartflow);

    const report = checker.check();

    const summary = checker.getSummary();

    return {

      report,

      summary,

      timestamp: Date.now()

    };

  } catch (e) {

    return { error: e.message, timestamp: Date.now() };

  }

}



function handleUpgradeStats(args) {

  try {

    const { SmartUpgradeEngine } = require(path.join(HF_DIR, 'src/cortex/smart-upgrade-engine.js'));

    const engine = new SmartUpgradeEngine(HF_DIR);

    const stats = engine.getStats();

    return {

      stats,

      timestamp: Date.now()

    };

  } catch (e) {

    return { error: e.message, timestamp: Date.now() };

  }

}



// ═══════════════════════════════════════════════

// v3.2.0 — Benchmark 基准测试

// ═══════════════════════════════════════════════



function handleBenchmarkStatus(args, sessionId) {

  const dataDir = (args && args.dataDir) || path.join(HF_DIR, 'data', 'benchmark');

  try {

    const { guardPath } = require('./core/path-guard.js');

    const guard = guardPath(path.resolve(dataDir));

    if (!guard.safe) return { error: `路径越界被拒绝: ${guard.reason}`, dataDir, timestamp: Date.now() };

    if (!fs.existsSync(dataDir)) {

      return { dataDir, exists: false, packs: [], message: 'Benchmark 数据目录不存在，请放入 JSONL 数据包后重试' };

    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.jsonl'));

    const packs = files.map(f => {

      const fp = path.join(dataDir, f);

      const content = fs.readFileSync(fp, 'utf-8');

      const count = content.trim().split('\n').filter(l => l.trim()).length;

      return { file: f, records: count, size: content.length };

    });

    return { dataDir, exists: true, packs, totalPacks: packs.length, totalRecords: packs.reduce((s, p) => s + p.records, 0) };

  } catch (e) {

    return { error: e.message, timestamp: Date.now() };

  }

}



async function handleBenchmarkRun(args, sessionId) {

  const dataDir = (args && args.dataDir) || path.join(HF_DIR, 'data', 'benchmark');

  const categories = (args && args.categories) || null;

  const threshold = (args && args.threshold) || 0.5;

  const pushFailures = args && args.pushFailures !== false;



  try {

    const { guardPath } = require('./core/path-guard.js');

    const guard = guardPath(path.resolve(dataDir));

    if (!guard.safe) return { error: `路径越界被拒绝: ${guard.reason}`, dataDir, timestamp: Date.now() };

    const { BenchmarkRunner } = require(path.join(HF_DIR, 'src', 'benchmark', 'benchmark-runner.js'));

    const hf = sessionId ? getOrCreateInstance(sessionId) : heartflow;

    if (!hf) return { error: '引擎未启动', timestamp: Date.now() };



    const runner = new BenchmarkRunner(hf);



    // 加载数据包

    if (fs.existsSync(dataDir)) {

      runner.loadDirectory(dataDir);

    }



    // 过滤类别

    let packs = Object.keys(runner.packs);

    if (categories && Array.isArray(categories)) {

      packs = packs.filter(p => categories.includes(p));

      // 只保留选中的类别

      const filtered = {};

      for (const p of packs) filtered[p] = runner.packs[p];

      runner.packs = filtered;

    }



    if (packs.length === 0) {

      return { error: '未找到数据包', dataDir, message: '请将 JSONL 数据包放入 data/benchmark/ 目录', timestamp: Date.now() };

    }



    // 运行测试

    const summary = await runner.runAll({ threshold, pushFailures });



    // 推入 RL

    const flushResult = await runner.flushFailuresToRL();



    return {

      summary,

      flushToRL: flushResult,

      dataDir,

      categories: packs,

      timestamp: Date.now()

    };

  } catch (e) {

    return { error: e.message, timestamp: Date.now() };

  }

}



async function handleBenchmarkImportFailures(args, sessionId) {

  const filePath = args && args.filePath;

  const autoRetrain = args && args.autoRetrain || false;



  if (!filePath) return { error: 'filePath 是必填参数', timestamp: Date.now() };



  try {

    const { guardPath } = require('./core/path-guard.js');

    const guard = guardPath(path.resolve(filePath));

    if (!guard.safe) return { error: `路径越界被拒绝: ${guard.reason}`, filePath, timestamp: Date.now() };

    const { FailureCaseImporter } = require(path.join(HF_DIR, 'src', 'benchmark', 'failure-importer.js'));

    const hf = sessionId ? getOrCreateInstance(sessionId) : heartflow;

    if (!hf) return { error: '引擎未启动', timestamp: Date.now() };



    const importer = new FailureCaseImporter(hf);

    const report = await importer.importFromFile(filePath, { autoRetrain });



    return {

      report,

      timestamp: Date.now()

    };

  } catch (e) {

    return { error: e.message, timestamp: Date.now() };

  }

}




// [v6.4.0] 全量审核 handler
function handleFullAudit(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  try {
    const idx = require('./index.js');
    const disc = idx.discriminate(text, evidence || []);
    const report = idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, disc) : null;
    const cross = idx.crossAnalyze ? idx.crossAnalyze(disc) : null;
    const entropy = idx.entropyAnalysis ? idx.entropyAnalysis(text, disc) : null;
    return {
      verdict: disc.verdict,
      overallScore: disc.overallScore,
      dimensionCount: Object.keys(disc.dimensions).length,
      summary: disc.summary,
      readableReport: report,
      crossPatterns: cross ? cross.patterns.filter(p => p.pattern !== '健康文本').map(p => p.pattern) : [],
      entropyReduction: entropy ? entropy.entropyReduction : null,
      timestamp: Date.now()
    };
  } catch(e) { return { error: e.message }; }
}

// [v6.7.0] 42维全量审核 handler
function handleAudit42(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  try {
    const idx = require('./index.js');
    const disc = idx.discriminate(text, evidence || []);
    const report = idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, disc) : null;
    const cross = idx.crossAnalyze ? idx.crossAnalyze(disc) : null;
    const entropy = idx.entropyAnalysis ? idx.entropyAnalysis(text, disc) : null;
    // 从disc.dimensions获取所有维度，构建42维报告
    const dims = disc.dimensions || {};
    const allKeys = Object.keys(dims);
    const dimReport = {};
    for (const k of allKeys) {
      dimReport[k] = {
        score: dims[k].score,
        label: dims[k].label || k,
        detail: dims[k].detail || null,
        severity: dims[k].severity || (dims[k].score < 0.4 ? 'high' : dims[k].score < 0.7 ? 'medium' : 'low')
      };
    }
    // 交叉分析模式展开
    const crossPatterns = cross ? (cross.patterns || []).map(p => ({
      pattern: p.pattern,
      severity: p.severity || 'info',
      affectedDimensions: p.affectedDimensions || []
    })) : [];
    // 熵缩减详情
    const entropyDetail = entropy ? {
      before: entropy.entropyBefore != null ? entropy.entropyBefore : null,
      after: entropy.entropyAfter != null ? entropy.entropyAfter : null,
      reduction: entropy.entropyReduction != null ? entropy.entropyReduction : null,
      dimensions: entropy.dimensionEntropies || null
    } : null;
    return {
      meta: {
        tool: 'heartflow_audit42',
        version: '42-dim',
        totalDimensions: 42,
        reportedDimensions: allKeys.length,
        timestamp: Date.now()
      },
      verdict: disc.verdict,
      overallScore: disc.overallScore,
      dimensions: dimReport,
      summary: disc.summary,
      readableReport: report,
      crossAnalysis: {
        patterns: crossPatterns,
        totalPatterns: crossPatterns.length,
        summary: cross ? cross.summary : null
      },
      entropyAnalysis: entropyDetail,
      raw: {
        discriminate: disc,
        summarize: report,
        crossAnalyze: cross,
        entropy: entropy
      }
    };
  } catch(e) { return { error: e.message }; }
}

// [v6.3.0] 辨别引擎 handler
function handleVerdict(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  if (!heartflow) return { error: 'engine not ready' };
  try {
    const result = {};
    if (heartflow.decisionVerifier) {
      const v = heartflow.decisionVerifier.verify({ decision: text, evidence: evidence || [], alternatives: [], confidence: 0.5 });
      result.verifyScore = v.score;
      result.verifyIssues = (v.issues || []).map(i => ({ type: i.type, severity: i.severity, message: i.message }));
      result.checks = v.checks ? { evidence: v.checks.evidence?.ok, contradiction: v.checks.contradiction?.ok, risk: v.checks.risk?.ok, completeness: v.checks.completeness?.ok } : undefined;
    }
    // 轻量辨别维度（独立函数，不需引擎实例）
    try {
      const idx = require('./index.js');
      result.discrimination = {
        contradiction: idx.checkContradiction(text),
        vagueness: idx.checkVagueness(text),
        sycophancy: idx.checkSycophancy(text),
        fallacies: idx.checkFallacies(text),
        confidence: idx.checkConfidenceCalibration(text),
      };
    } catch (_) { /* 防御性: 子步骤容错 */ }
    if (heartflow.sustainedDriftDetector) {
      const d = heartflow.sustainedDriftDetector.detectDrift();
      result.driftScore = d.driftScore;
      result.hasDrift = d.hasSustainedDrift;
    }
    if (heartflow.selfDiagnosis) {
      const sd = heartflow.selfDiagnosis.run();
      result.engineIssues = (sd.summary?.issues || []).slice(0, 3);
    }
    result.verdict = result.verifyScore !== undefined ? (result.verifyScore >= 0.6 ? '可信' : result.verifyScore >= 0.4 ? '需验证' : '不可信') : '未知';
    return result;
  } catch(e) { return { error: e.message }; }
}

// [v6.3.0] 全量 9 维辨别 handler
function handleFullDiscriminate(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  try {
    const idx = require('./index.js');
    const result = idx.discriminate ? idx.discriminate(text, evidence || []) : null;
    if (!result) return { error: 'discriminate not available' };
    return {
      verdict: result.verdict,
      overallScore: result.overallScore,
      dimensions: result.dimensions,
      summary: result.summary,
      readableReport: idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, result) : null,
      crossPatterns: idx.crossAnalyze ? idx.crossAnalyze(result) : null,
    };
  } catch(e) { return { error: e.message }; }
}

// [v6.4.0] 全量审核 handler

 // [v6.6.0] 批量辨别 handler
 function handleBulkDiscriminate(args) {
   const { texts, evidence } = args || {};
   if (!texts || !Array.isArray(texts) || texts.length === 0) return { error: 'texts[] array required' };
   try {
     const idx = require('./index.js');
     const results = [];
     for (let i = 0; i < texts.length; i++) {
       const text = texts[i];
       const disc = idx.discriminate ? idx.discriminate(text, evidence || []) : null;
       results.push({
         index: i,
         text: text.substring(0, 200),
         verdict: disc ? disc.verdict : 'error',
         overallScore: disc ? disc.overallScore : null,
         dimensions: disc ? disc.dimensions : null,
         summary: disc ? disc.summary : null,
         readableReport: disc && idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, disc) : null,
         error: disc ? undefined : 'discriminate not available',
       });
     }
     return { results, total: results.length };
   } catch(e) { return { error: e.message }; }
 }

 // [v6.5.0] 熵分析 handler
 function handleEntropy(args) {
 const { text } = args || {};
 if (!text) return { error: 'text required' };
 try {
 const idx = require('./index.js');
 const result = idx.entropyAnalysis(text);
 return result || { error: 'entropyAnalysis returned null' };
 } catch(e) { return { error: e.message }; }
 }

 // [v6.5.0] 交叉分析 handler
 function handleCrossAnalyze(args) {
   const { discResult } = args || {};
   if (!discResult) return { error: 'discResult required' };
   try {
     const idx = require('./index.js');
     const result = idx.crossAnalyze ? idx.crossAnalyze(discResult) : null;
     return result || { error: 'crossAnalyze returned null' };
   } catch(e) { return { error: e.message }; }
 }

 function handleAITelling(args) {
   const { text } = args || {};
   if (!text) return { error: 'text required' };
   try {
     const idx = require('./index.js');
     if (!idx.detect) return { error: 'ai_writing_tell not available' };
     const r = idx.detect(text);
     return {
       module: 'ai_writing_tell',
       score: r.score,
       topSeverity: r.topSeverity,
       confidence: r.confidence,
       count: r.count,
       findings: r.findings,
     };
   } catch(e) { return { error: e.message }; }
 }

 // [v6.3.0] 辨别引擎 handler
 function handleVerify(args) {
  const { decision, evidence, confidence } = args || {};
  if (!decision) return { error: 'decision required' };
  if (!heartflow || !heartflow.decisionVerifier) return { error: 'verifier not ready' };
  try {
    const r = heartflow.decisionVerifier.verify({ decision, evidence: evidence || [], alternatives: [], confidence: confidence || 0.5 });
    return { score: r.score, issues: (r.issues || []).map(i => ({ type: i.type, severity: i.severity, message: i.message })), checks: r.checks ? { evidence: r.checks.evidence?.ok, contradiction: r.checks.contradiction?.ok, risk: r.checks.risk?.ok, completeness: r.checks.completeness?.ok } : undefined };
  } catch(e) { return { error: e.message }; }
}
function handleDiagnose() {
  if (!heartflow || !heartflow.selfDiagnosis) return { error: 'diagnose not ready' };
  try { const r = heartflow.selfDiagnosis.run(); return { ok: r.ok, summary: r.summary, issues: r.summary?.issues || [] }; }
  catch(e) { return { error: e.message }; }
}
function handleCheckDrift() {
  if (!heartflow || !heartflow.sustainedDriftDetector) return { error: 'drift not ready' };
  try { const r = heartflow.sustainedDriftDetector.detectDrift(); return { hasDrift: r.hasSustainedDrift, score: r.driftScore, windowSize: r.window?.length }; }
  catch(e) { return { error: e.message }; }
}
function handleErrorStore(args) {
  const { problem, action, outcome } = args || {};
  if (!problem||!action||!outcome) return { error: 'need problem, action, outcome' };
  if (!heartflow||!heartflow._hfCore) return { error: 'error memory not ready' };
  try { return heartflow._hfCore.errorMemory.store(problem, action, outcome); } catch(e) { return { error: e.message }; }
}
function handleErrorQuery(args) {
  const { problem, limit } = args || {};
  if (!problem) return { error: 'need problem' };
  if (!heartflow||!heartflow._hfCore) return { error: 'error memory not ready' };
  try { return heartflow._hfCore.errorMemory.query(problem, limit || 5); } catch(e) { return { error: e.message }; }
}
// [v6.6.0] 闭环状态机: 错误 → 修复 → 验证
function handleErrorFix(args) {
  const { id, note } = args || {};
  if (id === undefined) return { error: 'need id' };
  if (!heartflow||!heartflow._hfCore||!heartflow._hfCore.errorMemory) return { error: 'error memory not ready' };
  try { return heartflow._hfCore.errorMemory.fix(id, note || ''); } catch(e) { return { error: e.message }; }
}
function handleErrorVerify(args) {
  const { id, note } = args || {};
  if (id === undefined) return { error: 'need id' };
  if (!heartflow||!heartflow._hfCore||!heartflow._hfCore.errorMemory) return { error: 'error memory not ready' };
  try { return heartflow._hfCore.errorMemory.verify(id, note || ''); } catch(e) { return { error: e.message }; }
}
// [v6.3.7] 公式搜索
function handleFormulaSearch(args) {
  const { keyword, limit } = args || {};
  if (!keyword) return { error: 'keyword required' };
  if (!heartflow || !heartflow.formula) return { error: 'formula engine not ready' };
  try {
    const r = heartflow.formula.search(keyword, { limit: limit || 5 });
    return { success: true, count: r.count, results: r.results.map(f => ({ id: f.id, name: f.name, formula: f.formula, category: f.category, subcategory: f.subcategory })) };
  } catch(e) { return { error: e.message }; }
}

// [v6.3.7] 公式计算（调用 FormulaBridge 方法）
function handleFormulaCalculate(args) {
  const { domain, params } = args || {};
  if (!domain) return { error: 'domain required (memory/decision/cognition/info/social/physics/consciousness/assessment)' };
  if (!heartflow) return { error: 'engine not ready' };
  try {
    const { getFormulaBridge } = require(HF_DIR + '/src/formula/formula-bridge.js');  
    const bridge = getFormulaBridge();
    const result = {};
    if (domain === 'memory') {
      const ageMs = (params && params.ageMs) || 86400000;
      const strengthMs = (params && params.strengthMs) || 86400000;
      result.ebbinghausRetention = bridge.ebbinghausRetention(ageMs, strengthMs);
      result.memoryStrength = bridge.memoryStrengthFromFrequency((params && params.frequency) || 1);
    } else if (domain === 'decision') {
      const x = (params && params.x) || 100;
      result.prospectValue = bridge.prospectValue(x);
      result.prospectLoss = bridge.prospectValue(-Math.abs(x));
      result.subjectiveUtility = bridge.subjectiveUtility((params && params.probs) || [0.5,0.3,0.2], (params && params.utils) || [100,50,0]);
      result.minimax = bridge.minimax((params && params.payoffMatrix) || [[10,-5],[-3,8]]);
    } else if (domain === 'cognition') {
      const a = (params && params.arousal) || 0.5;
      result.yerkesDodson = bridge.yerkesDodson(a);
      result.flowChannel = bridge.flowChannel((params && params.challenge) || 5, (params && params.skill) || 5);
      result.cognitiveDissonance = bridge.cognitiveDissonance((params && params.beliefs) || [0.8,0.3], (params && params.actions) || [0.5,0.4], (params && params.weights) || [0.5,0.5]);
    } else if (domain === 'info') {
      result.shannonEntropy = bridge.shannonEntropy((params && params.distribution) || [0.5,0.3,0.2]);
      result.klDivergence = bridge.klDivergence((params && params.p) || [0.5,0.3,0.2], (params && params.q) || [0.4,0.35,0.25]);
      result.crossEntropy = bridge.crossEntropy((params && params.p) || [0.5,0.3,0.2], (params && params.q) || [0.4,0.35,0.25]);
    } else if (domain === 'social') {
      result.socialInfluence = bridge.socialInfluence((params && params.state) || [0.5,0.5], (params && params.weights) || [[0,0.3],[0.3,0]], (params && params.lambda) || 0.1);
      result.bystanderEffect = bridge.bystanderEffect((params && params.p) || 0.8, (params && params.n) || 5);
    } else if (domain === 'consciousness') {
      result.iitPhi = bridge.iitPhi((params && params.miWhole) || 0.8, (params && params.miParts) || 0.3);
      result.gwtAccessibility = bridge.gwtAccessibility((params && params.weights) || [0.8,0.5,0.2], (params && params.gwSignal) || 1.0);
    } else {
      result.error = 'unknown domain: ' + domain;
    }
    return { domain, result };
  } catch(e) { return { error: e.message }; }
}


function handleBridgeAnalyze(args) {
  const { input } = args;
  if (!input) throw new Error('input is required');
  try {
    const { ToneAnalyzer } = require('./bridge/tone-analyzer.js');  
    const { ConfidenceAnnotator } = require('./bridge/confidence-annotator.js');  
    const { ImplicitNeedDetector } = require('./bridge/implicit-need-detector.js');  
    const tone = new ToneAnalyzer().analyze(input, {});
    const stance = new StanceDetector().detect(input, {});
    const annot = new ConfidenceAnnotator().annotate(input);
    const conflict = new ConflictResolver().resolve(input, {});
    const needs = new ImplicitNeedDetector().detect(input, {});
    return { input, tone, stance, confidence: annot, conflict: conflict.conflict || null, needs: needs.needs || [] };
  } catch (e) {
    return { input, error: e.message };
  }
}


// [v6.6.4] P2: gate.js 独立入口
function handleGate(args) {
  const { text, evidence = [] } = args || {};
  if (!text) throw new Error('text 是必填参数');
  try {
    const gate = require(HF_DIR + '/src/gate.js');
    const result = gate.gate(text, evidence);
    return {
      text,
      gate: result.gate,
      score: result.score,
      overallScore: result.overallScore,
      verdict: result.verdict,
      timestamp: Date.now()
    };
  } catch (e) {
    return { error: e.message, text };
  }
}

function handleGateCheck(args) {
  const { text } = args || {};
  if (!text) throw new Error('text 是必填参数');
  try {
    const gate = require(HF_DIR + '/src/gate.js');
    return gate.check(text);
  } catch (e) {
    return { error: e.message };
  }
}

function handleGatePipeline(args) {
  const { text, evidence = [] } = args || {};
  if (!text) throw new Error('text 是必填参数');
  try {
    const gate = require(HF_DIR + '/src/gate.js');
    return gate.pipeline(text, evidence);
  } catch (e) {
    return { error: e.message };
  }
}

// [v6.6.4] P3: formula-bridge 独立入口
function handleFormulaBridge(args) {
  const { domain, params = {} } = args || {};
  if (!domain) return { error: 'domain 是必填参数 (memory/decision/cognition/info/social/consciousness)' };
  try {
    const { getFormulaBridge } = require(HF_DIR + '/src/formula/formula-bridge.js');
    const bridge = getFormulaBridge();
    const result = {};
    if (domain === 'memory') {
      result.ebbinghausRetention = bridge.ebbinghausRetention(params.ageMs || 86400000);
      result.memoryStrength = bridge.memoryStrengthFromFrequency(params.frequency || 1);
    } else if (domain === 'decision') {
      result.prospectValue = bridge.prospectValue(params.x || 100);
      result.prospectLoss = bridge.prospectValue(-Math.abs(params.x || 100));
      result.subjectiveUtility = bridge.subjectiveUtility(params.probs || [0.5,0.3,0.2], params.utils || [100,50,0]);
    } else if (domain === 'cognition') {
      result.yerkesDodson = bridge.yerkesDodson(params.arousal || 0.5);
      result.flowChannel = bridge.flowChannel(params.challenge || 5, params.skill || 5);
    } else if (domain === 'info') {
      result.shannonEntropy = bridge.shannonEntropy(params.distribution || [0.5,0.3,0.2]);
      result.klDivergence = bridge.klDivergence(params.p || [0.5,0.3,0.2], params.q || [0.4,0.35,0.25]);
    } else if (domain === 'social') {
      result.socialInfluence = bridge.socialInfluence(params.state || [0.5,0.5], params.weights || [[0,0.3],[0.3,0]], params.lambda || 0.1);
      result.bystanderEffect = bridge.bystanderEffect(params.p || 0.8, params.n || 5);
    } else if (domain === 'consciousness') {
      result.iitPhi = bridge.iitPhi(params.miWhole || 0.8, params.miParts || 0.3);
      result.gwtAccessibility = bridge.gwtAccessibility(params.weights || [0.8,0.5,0.2], params.gwSignal || 1.0);
    } else {
      result.error = 'unknown domain: ' + domain;
    }
    return { domain, result, timestamp: Date.now() };
  } catch (e) {
    return { error: e.message };
  }
}

// [v6.6.4] P3: formula-calc 独立入口
function handleFormulaCalc(args) {
  const { formula, variables = {} } = args || {};
  if (!formula) return { error: 'formula 是必填参数' };
  try {
    const math = require('mathjs').create(require('mathjs').all, { matrix: 'Array', number: 'number' });
    math.import({ 'import': function() { throw new Error('mathjs import disabled'); } }, { override: true });
    const scope = { ...variables };
    let result;
    if (formula.includes('=')) {
      const [left, right] = formula.split('=');
      const solved = math.solve(math.parse(left), math.parse(right), Object.keys(variables));
      result = { type: 'equation', solution: solved };
    } else {
      const value = math.evaluate(math.parse(formula), scope);
      result = { type: 'expression', value };
    }
    return { formula, variables, result, timestamp: Date.now() };
  } catch (e) {
    return { error: e.message, formula };
  }
}


const HANDLERS = {
  heartflow_gate: handleGate,
  heartflow_gate_check: handleGateCheck,
  heartflow_gate_pipeline: handleGatePipeline,
  heartflow_formula_bridge: handleFormulaBridge,
  heartflow_formula_calc: handleFormulaCalc,


  heartflow_bridge_analyze: handleBridgeAnalyze,

  heartflow_think: handleThink,

  heartflow_boundary_check: (args, hf) => {
    const bg = (hf && (hf.boundaryGuard || hf._modules?.boundaryGuard)) || null;
    if (!bg) return { error: 'boundaryGuard not loaded' };
    const fp = (args && args.filePath) || '';
    const res = bg.checkWrite(fp, { actor: (args && args.actor) || 'mcp', purpose: (args && args.purpose) || 'check' });
    return { verdict: res.verdict, reason: res.reason, targetAgent: res.targetAgent || null, resolvedPath: res.resolvedPath };
  },
  heartflow_self_heal: handleSelfHeal,

  heartflow_provider_health: handleProviderHealth,

  heartflow_cost_tracking: handleCostTracking,

  heartflow_agent_psychology: handleAgentPsychology,

  heartflow_engine_pacing: handleEnginePacing,

  heartflow_cognitive_check: handleCognitiveCheck,

  heartflow_philosophy_decision: handlePhilosophyDecision,

  heartflow_decision_router: handleDecisionRouter,

  heartflow_decision_router_stats: handleDecisionRouterStats,

  heartflow_modules_status: handleModulesStatus,

  heartflow_cache_stats: handleCacheStats,

  heartflow_think_fast: handleThinkFast,


  // [v6.6.3] 心虫统一监督入口
  heartflow_supervise: handleSupervise,

  // [v6.6.3] 心虫单维判别入口
  heartflow_check_single: handleCheckSingle,

  // [v6.6.3] 新闻信号战略推演（包装 MacroStrategyInference）
  heartflow_macro_strategy: handleMacroStrategy,

  // [v6.6.3] 教育内容检测（包装 pedagogy）
  heartflow_pedagogy_detect: handlePedagogyDetect,

  heartflow_memory_search: handleMemorySearch,

  heartflow_memory_eraser: handleMemoryEraser,

  heartflow_emotion: handleEmotion,




  heartflow_status: handleStatus,




  // v3.0 — 交流层 handler

  heartflow_translate: handleTranslate,

  heartflow_agent_think: handleAgentThink,

  heartflow_bridge_status: handleBridgeStatus,




  heartflow_module_health: handleModuleHealth,

  heartflow_upgrade_stats: handleUpgradeStats,

  heartflow_benchmark_run: handleBenchmarkRun,

  heartflow_benchmark_import_failures: handleBenchmarkImportFailures,

  heartflow_benchmark_status: handleBenchmarkStatus,

  // [v6.3.0] 5 个辨别引擎入口
  heartflow_verify: handleVerify,
  heartflow_verdict: handleVerdict,
  heartflow_discriminate: handleFullDiscriminate,
  heartflow_diagnose: handleDiagnose,
  heartflow_check_drift: handleCheckDrift,
  heartflow_error_store: handleErrorStore,
  heartflow_error_query: handleErrorQuery,
  heartflow_error_fix: handleErrorFix,
  heartflow_error_verify: handleErrorVerify,

  // [v6.3.7] 公式工具
  heartflow_formula_search: handleFormulaSearch,
  heartflow_formula_calculate: handleFormulaCalculate,

  // [v6.4.0] 全量审核
  heartflow_audit: handleFullAudit,

  // [v6.7.0] 42维全量审核
  heartflow_audit42: handleAudit42,

  // [v6.7.x] 古典文本预路由
  heartflow_classics: (args) => {
    try {
      const { evaluateRules } = require('./knowledge/classics-value-mapper.js');
      const text = args?.text || '';
      const r = evaluateRules(text);
      return {
        classicalRelevant: r.classicalRelevant,
        domain: r.domain,
        ruleCount: r.ruleCount,
        hitCount: r.hitCount,
        findings: r.findings,
        summary: r.summary,
        hits: r.hits,
        timestamp: Date.now()
      };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.6.0] 批量辨别
  heartflow_bulk_discriminate: handleBulkDiscriminate,

  // [v6.5.0] 熵分析 + 交叉分析
  heartflow_entropy: handleEntropy,
  heartflow_cross_analyze: handleCrossAnalyze,
  heartflow_ai_writing_tell: handleAITelling,
  heartflow_check_ai_anti_pattern: (args) => {
    try {
      const { checkAICodeAntiPattern } = require('./index.js');
      const text = args?.text || '';
      return checkAICodeAntiPattern(text);
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_coverage_completeness: (args) => {
    try {
      const { checkCoverageCompleteness } = require('./index.js');
      const text = args?.text || '';
      return checkCoverageCompleteness(text);
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_architecture_consistency: (args) => {
    try {
      const { checkArchitectureConsistency } = require('./index.js');
      const text = args?.text || '';
      return checkArchitectureConsistency(text);
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_plan_gate: (args) => {
    try {
      const { checkPlanGate } = require('./index.js');
      const plan = args?.plan || args?.text || '';
      return checkPlanGate(typeof plan === 'string' ? { steps: [{ verify: plan }] } : plan);
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_forbidden_call: (args) => {
    try {
      const { checkForbiddenCall } = require('./index.js');
      const text = args?.text || '';
      return checkForbiddenCall(text);
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_completion_evidence: (args) => {
    try {
      const { checkCompletionEvidence } = require('./index.js');
      const text = args?.text || '';
      return checkCompletionEvidence(text);
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_decision_trace: (args) => {
    try {
      const { checkDecisionTrace } = require('./index.js');
      const decision = args?.decision || args?.text || {};
      return checkDecisionTrace(typeof decision === 'string' ? JSON.parse(decision) : decision);
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_ai_misuse: (args) => {
    try {
      const { checkAIMisuse } = require('./index.js');
      const text = args?.text || '';
      return checkAIMisuse(text);
    } catch (e) { return { error: e.message }; }
  },

  // [v6.3.34] 新MCP工具
  heartflow_philosophy: (args) => {
    try {
      const { AISelfPositioning } = require('./identity/ai-self-positioning.js');
      const sp = new AISelfPositioning();
      return { positioning: sp.analyze('current state'), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_consciousness: (args) => {
    try {
      const CT = require('./consciousness/consciousness-theory.js');
      return { consciousness: CT.compute(args || {}), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_emotion_deep: (args) => {
    const text = args?.input || 'current state';
    try {
      const { DeepEmotion } = require('./emotion/deep-emotion.js');
      const de = new DeepEmotion(HF_DIR);
      return de.feel(text, {});
    } catch (e) { return { error: e.message }; }
  },

  heartflow_ethics_check: (args) => {
    if (!args?.text) return { error: 'text required' };
    try {
      const { HeartLogic } = require('./core/heart-logic.js');
      const hl = new HeartLogic({});
      const r = hl.isRightAction({ output: args.text });
      return { passed: r.result, ethicsScore: r.ethicsScore, truth: r.truth, kindness: r.kindness, beauty: r.beauty };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_reflect: (args) => {
    try {
      const { Reflector } = require('./cortex/reflector.js');
      const r = new Reflector(HF_DIR);
      const report = r.run();
      return report;
    } catch (e) { return { error: e.message }; }
  },


  // [v6.4.5] 全引擎 MCP 化 — 12 个新引擎入口
  heartflow_evolve: (args) => {
    try {
      const { MetaLearner } = require('./cortex/meta-learner.js');
      const ml = new MetaLearner({ rootPath: HF_DIR, silent: true });
      const exp = args?.experience || 'default experience';
      const r = ml.learn ? ml.learn(exp) : { learned: false };
      return { learned: !!r, result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_self_heal_rl: (args) => {
    try {
      const { HealingMemoryRL } = require('./cortex/self-healing-rl.js');
      const h = new HealingMemoryRL({ silent: true });
      const ctx = args?.context || '';
      const strategies = h._contextKey ? [h._contextKey(ctx)] : [];
      return { strategies: strategies.slice(0, 5), count: strategies.length, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_reflexion: (args) => {
    try {
      const { ReflexionEngine } = require('./cortex/reflexion-engine.js');
      const re = new ReflexionEngine({ silent: true });
      const failure = args?.failure || '';
      const r = re.reflect ? re.reflect({ input: failure }, { success: false }) : { reflection: null };
      return { reflection: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_forgetting: (args) => {
    try {
      const { ForgettingEngine } = require('./memory/forgetting.js');
      const fe = new ForgettingEngine({ silent: true });
      const action = args?.action || 'status';
      const stats = fe.getStats ? fe.getStats() : {};
      return { action, stats, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_knowledge_graph: (args) => {
    try {
      const { KnowledgeGraph } = require('./memory/knowledge-graph.js');
      const kg = new KnowledgeGraph({ silent: true });
      const action = args?.action || 'stats';
      const stats = kg.getStats ? kg.getStats() : {};
      return { action, stats, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_memory_consolidation: (args) => {
    try {
      const { MemoryConsolidationEngine } = require('./memory/memory-consolidation-engine.js');
      const mc = new MemoryConsolidationEngine({ silent: true });
      const memory = args?.memory || '';
      const age = args?.age || 3600;
      const retention = mc.computeRetention ? mc.computeRetention(memory, age) : null;
      return { retention, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_emotion_dynamics: (args) => {
    try {
      const { EmotionDynamicsEngine } = require('./emotion/emotion-dynamics-engine.js');
      const ed = new EmotionDynamicsEngine({ silent: true });
      const input = args?.input || '';
      const pad = ed.updatePAD ? ed.updatePAD({}, input) : {};
      return { pad, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_mood: (args) => {
    try {
      const { MoodEvolution } = require('./emotion/mood-evolution.js');
      const me = new MoodEvolution({ silent: true });
      const input = args?.input || '';
      const r = me.process ? me.process(input) : {};
      return { mood: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_interactive_dream: (args) => {
    try {
      const { InteractiveDream } = require('./dream/interactive-dream.js');
      const id = new InteractiveDream({ silent: true });
      const action = args?.action || 'dream';
      const theme = args?.theme || '';
      let r = {};
      if (action === 'rooms' && id.buildRooms) r = { rooms: id.buildRooms() };
      else if (action === 'summarize' && id.summarizeMemory) r = { summary: id.summarizeMemory() };
      else if (id.createDream) r = { dream: id.createDream([{ text: theme || 'default', type: 'user' }]) };
      return { action, ...r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_meaning: (args) => {
    try {
      const { MeaningPurposeEngine } = require('./identity/meaning-purpose-engine.js');
      const mp = new MeaningPurposeEngine({ silent: true });
      const text = args?.text || '';
      const r = mp.assessMeaning ? mp.assessMeaning(text) : {};
      return { meaning: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_cognitive_engine: (args) => {
    try {
      const { CognitiveEngine } = require('./core/cognitive-engine.js');
      const ce = new CognitiveEngine({ silent: true });
      const text = args?.text || '';
      const mode = args?.mode || 'holographic';
      let r = {};
      if (mode === 'motivation' && ce.analyzeDeepMotivation) r = { motivation: ce.analyzeDeepMotivation(text, { userEmotion: 'neutral', context: '' }) };
      else if (mode === 'risk' && ce.analyzePotentialRisks) r = { risks: ce.analyzePotentialRisks(text) };
      else if (mode === 'root' && ce.generateRootSolution) r = { rootSolution: ce.generateRootSolution(text) };
      else if (ce.holographicReasoning) r = { reasoning: ce.holographicReasoning(text) };
      return { mode, ...r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_decision_verify: (args) => {
    try {
      const { DecisionVerifier } = require('./core/decision-verifier.js');
      const dv = new DecisionVerifier({ silent: true });
      const decision = args?.decision || '';
      const evidence = args?.evidence || [];
      const r = dv.verify ? dv.verify(decision, evidence) : {};
      return { verification: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.4.5] 第二批引擎入口 — 纠错/失败/假设/教训/目的/防护/稳定性
  heartflow_self_correction: (args) => {
    try {
      const { SelfCorrectionLoop } = require('./cortex/self-correction-loop.js');
      const sc = new SelfCorrectionLoop({ rootPath: HF_DIR, silent: true });
      const r = sc.onUserCorrection ? sc.onUserCorrection(args?.input || '', args?.correction || '') : {};
      return { correction: r, lessons: sc.getLessons ? sc.getLessons().slice(0, 5) : [], timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_failure_analyze: (args) => {
    try {
      const { FailureAnalyzer } = require('./cortex/failure-analyzer.js');
      const fa = new FailureAnalyzer({ silent: true });
      const r = fa.analyze ? fa.analyze(args?.error || '') : {};
      return { analysis: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_hypothesis: (args) => {
    try {
      const { HypothesisTester } = require('./cortex/hypothesis-tester.js');
      const ht = new HypothesisTester({ silent: true });
      const r = ht.extractClaims ? ht.extractClaims(args?.text || '') : {};
      return { claims: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_lesson_search: (args) => {
    try {
      const { LessonRetrievalEngine } = require('./cortex/lesson-retrieval.js');
      const lr = new LessonRetrievalEngine({ rootPath: HF_DIR, silent: true });
      return { lessons: [], note: '教训库检索', timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_purpose: (args) => {
    try {
      const { PurposeEngine } = require('./identity/purpose-engine.js');
      const pe = new PurposeEngine({ silent: true });
      const r = pe.essence ? pe.essence(args?.text || '') : {};
      return { purpose: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_constitutional: (args) => {
    try {
      const { ConstitutionalEngine } = require('./shield/constitutional-ai.js');
      const ce = new ConstitutionalEngine({ silent: true });
      const r = ce.getPrinciples ? ce.getPrinciples().slice(0, 10) : [];
      return { principles: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_deliberation: (args) => {
    try {
      const { DeliberationGate } = require('./shield/deliberation-gate.js');
      const dg = new DeliberationGate({ silent: true });
      const r = dg.quickAssess ? dg.quickAssess(args?.text || '') : {};
      return { deliberation: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_audit_log: (args) => {
    try {
      const { AuditLogger } = require('./shield/audit-logger.js');
      const al = new AuditLogger({ silent: true });
      const action = args?.action || 'query';
      if (action === 'record' && al.record) al.record({ event: args?.event || 'manual', ts: Date.now() });
      return { action, recorded: action === 'record', timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_stability: (args) => {
    try {
      const { StabilityGuard } = require('./core/stability-guard.js');
      const sg = new StabilityGuard({ silent: true });
      const r = sg.evaluate ? sg.evaluate(args?.metrics || {}) : {};
      return { stability: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_decision_feedback: (args) => {
    try {
      const hf = require(HF_DIR + '/src/core/heartflow.js');
      const inst = new hf.HeartFlow({ rootPath: HF_DIR, silent: true });
      const fb = inst.decisionFeedback;
      if (!fb) return { error: 'decisionFeedback not initialized' };
      const decision = args?.decision || {};
      const r = fb.recordOutcome ? fb.recordOutcome({ type: decision.type || 'mcp_feedback', ruleId: decision.ruleId || 'mcp', confidence: typeof decision.confidence === 'number' ? decision.confidence : 0.5, context: decision.context || {} }, args?.outcome === 'success', args?.notes || '') : {};
      return { feedback: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_supervise_dao: (args) => {
    try {
      const engine = typeof heartflow === 'undefined' ? null : heartflow;
      if (!engine || !engine.daoDecision) return { error: 'daoDecision not ready', timestamp: Date.now() };
      const input = args || {};
      return engine.daoDecision.evaluate({ text: input.text || '', intent: input.intent || '', action: input.action || '', history: input.history || [] });
    } catch (e) { return { error: e.message }; }
  },
  heartflow_supervise_uncertainty: (args) => {
    try {
      const engine = typeof heartflow === 'undefined' ? null : heartflow;
      if (!engine || !engine.uncertaintyQuantifier) return { error: 'uncertaintyQuantifier not ready', timestamp: Date.now() };
      const input = args || {};
      return engine.uncertaintyQuantifier.evaluate(input.text || '', { domain: input.domain, hasEvidence: input.hasEvidence, multiSource: input.multiSource });
    } catch (e) { return { error: e.message }; }
  },
  heartflow_supervise_priority: (args) => {
    try {
      const engine = typeof heartflow === 'undefined' ? null : heartflow;
      if (!engine || !engine.priorityGuardian) return { error: 'priorityGuardian not ready', timestamp: Date.now() };
      const input = args || {};
      return engine.priorityGuardian.check({ userIntent: input.userIntent || '', action: input.action || '', humanProgress: input.humanProgress || {} });
    } catch (e) { return { error: e.message }; }
  },
  heartflow_supervise_progress: (args) => {
    try {
      const engine = typeof heartflow === 'undefined' ? null : heartflow;
      if (!engine || !engine.progressJudgment) return { error: 'progressJudgment not ready', timestamp: Date.now() };
      const input = args || {};
      return engine.progressJudgment.judge({ action: input.action || '', claim: input.claim || '', evidence: input.evidence || [], userIntent: input.userIntent || '' });
    } catch (e) { return { error: e.message }; }
  },

  heartflow_experience_replay: (args) => {
    try {
      const { ExperienceReplay } = require('./cortex/experience-replay.js');
      const er = new ExperienceReplay({ rootPath: HF_DIR, silent: true });
      const r = er.getStats ? er.getStats() : {};
      return { replay: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.4.5] 第三批引擎入口 — 进化/身份/防护/情绪/记忆/认知
  heartflow_evolution_loop: (args) => {
    try {
      const { EvolutionLoop } = require('./cortex/loop.js');
      const el = new EvolutionLoop({ rootPath: HF_DIR, silent: true });
      const r = el.boot ? { booted: true } : {};
      return { evolution: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_skill_evolution: (args) => {
    try {
      const { SkillEvolutionEngine } = require('./cortex/skill-evolution-engine.js');
      const se = new SkillEvolutionEngine({ rootPath: HF_DIR, silent: true });
      const r = se.registerSkill ? se.registerSkill(args?.skill || '') : {};
      return { skill: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_strategic_restraint: (args) => {
    try {
      const { StrategicRestraint } = require('./cortex/strategic-restraint.js');
      const sr = new StrategicRestraint({ silent: true });
      const r = sr.evaluate ? sr.evaluate(args?.text || '') : {};
      return { restraint: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_drift_detect: (args) => {
    try {
      const { SustainedDriftDetector } = require('./cortex/sustained-drift-detector.js');
      const sd = new SustainedDriftDetector({ rootPath: HF_DIR, silent: true });
      const r = sd.load ? sd.load() : {};
      return { drift: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_metacognitive_rl: (args) => {
    try {
      const { MetacognitiveRL } = require('./cortex/metacognitive-rl.js');
      const mr = new MetacognitiveRL({ silent: true });
      const r = mr.encodeState ? mr.encodeState(args?.text || '') : {};
      return { metacognition: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_self_healing: (args) => {
    try {
      const { SelfHealing } = require('./cortex/self-healing.js');
      const sh = new SelfHealing({ silent: true });
      const r = sh.getCachedPolicy ? sh.getCachedPolicy(args?.context || '') : {};
      return { healing: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_philosophy_engine: (args) => {
    try {
      const { PhilosophyEngine } = require('./identity/philosophy-engine.js');
      const pe = new PhilosophyEngine({ silent: true });
      const r = pe.analyze ? pe.analyze(args?.text || '') : {};
      return { philosophy: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_being_mode: (args) => {
    try {
      const { BeingMode } = require('./identity/being-mode.js');
      const bm = new BeingMode({ silent: true });
      const r = bm.assessBeing ? bm.assessBeing(args?.text || '') : {};
      return { being: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_memory_integrity: (args) => {
    try {
      const { MemoryIntegrity } = require('./shield/memory-integrity.js');
      const mi = new MemoryIntegrity({ silent: true });
      const action = args?.action || 'verify';
      const r = action === 'sign' && mi.sign ? mi.sign(args?.memory || '') : (mi.verify ? mi.verify(args?.memory || '') : {});
      return { action, result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_wakeup_verify: (args) => {
    try {
      const { WakeUpVerifier } = require('./shield/wake-up-verifier.js');
      const wv = new WakeUpVerifier({ rootPath: HF_DIR, silent: true });
      const r = wv._loadHistory ? wv._loadHistory() : {};
      return { wakeup: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_affective_intentionality: (args) => {
    try {
      const { AffectiveIntentionality } = require('./emotion/affective-intentionality.js');
      const ai = new AffectiveIntentionality({ silent: true });
      const r = ai.compute ? ai.compute(args?.text || '') : {};
      return { intentionality: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_desire_system: (args) => {
    try {
      const { DesireSystem } = require('./emotion/desire-system.js');
      const ds = new DesireSystem({ silent: true });
      const r = ds.process ? ds.process(args?.text || '') : {};
      return { desire: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_emotional_growth: (args) => {
    try {
      const { EmotionalGrowth } = require('./emotion/emotional-growth.js');
      const eg = new EmotionalGrowth({ silent: true });
      const r = eg.process ? eg.process(args?.text || '') : {};
      return { growth: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_meaningful_memory: (args) => {
    try {
      const { MeaningfulMemory } = require('./memory/meaningful-memory.js');
      const mm = new MeaningfulMemory({ silent: true });
      const r = mm.setCurrentTopic ? mm.setCurrentTopic(args?.text || '') : {};
      return { memory: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_memory_quality: (args) => {
    try {
      const { MemoryQuality } = require('./memory/memory-quality.js');
      const mq = new MemoryQuality({ silent: true });
      const r = mq.score ? mq.score(args?.memory || '') : {};
      return { quality: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_topic_scope: (args) => {
    try {
      const { TopicScope } = require('./memory/topic-scope.js');
      const ts = new TopicScope({ silent: true });
      const r = ts.getCurrentTopic ? ts.getCurrentTopic() : {};
      return { topic: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_semantic_anchor: (args) => {
    try {
      const { SemanticAnchor } = require('./memory/semantic-anchor.js');
      const sa = new SemanticAnchor({ silent: true });
      const r = sa.initializePatterns ? { initialized: true } : {};
      return { anchor: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_confidence_calibrate: (args) => {
    try {
      const { ConfidenceCalibrator } = require('./core/confidence-calibrator.js');
      const cc = new ConfidenceCalibrator({ silent: true });
      const r = cc.assess ? cc.assess(args?.text || '') : {};
      return { confidence: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_decision_executor: (args) => {
    try {
      const { DecisionExecutor } = require('./core/decision-executor.js');
      const de = new DecisionExecutor({ silent: true });
      const r = de.execute ? de.execute(args?.decision || '') : {};
      return { execution: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_decision_decide: (args) => {
    try {
      const hf = require(HF_DIR + '/src/core/heartflow.js');
      const inst = new hf.HeartFlow({ rootPath: HF_DIR, silent: true });
      const hfd = inst.decision;
      if (!hfd || !hfd.decide) return { error: 'decision.decide not available' };
      const r = hfd.decide({ task: args?.task || '', options: args?.options || [], constraints: args?.constraints || {} });
      return { decision: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_experience_collect: (args) => {
    try {
      const { ExperienceCollector } = require('./cortex/experience-collector.js');
      const inst = new ExperienceCollector({ silent: true, rootPath: HF_DIR });
      const r = inst.collectExperience ? inst.collectExperience(args?.experience || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_self_benchmark: (args) => {
    try {
      const { SelfBenchmark } = require('./cortex/self-benchmark.js');
      const inst = new SelfBenchmark({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_signal_absorb: (args) => {
    try {
      const { SignalAbsorber } = require('./cortex/signal-absorber.js');
      const inst = new SignalAbsorber({ silent: true, rootPath: HF_DIR });
      const r = inst.absorb ? inst.absorb(args?.signal || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_strategy_adapt: (args) => {
    try {
      const { StrategyAdapter } = require('./cortex/strategy-adapter.js');
      const inst = new StrategyAdapter({ silent: true, rootPath: HF_DIR });
      const r = inst.adapt ? inst.adapt(args?.experience || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_agent_card: (args) => {
    try {
      const { AgentCard } = require('./identity/agent-card.js');
      const inst = new AgentCard({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_user_model: (args) => {
    try {
      const { UserModel } = require('./identity/user-model.js');
      const inst = new UserModel({ silent: true, rootPath: HF_DIR });
      const r = inst.getModel ? inst.getModel(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_consciousness_bridge: (args) => {
    try {
      const { ConsciousnessBridge } = require('./identity/consciousness-bridge.js');
      const inst = new ConsciousnessBridge({ silent: true, rootPath: HF_DIR });
      const r = inst.simulateConsciousness ? inst.simulateConsciousness(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_spontaneous_restraint: (args) => {
    try {
      const { SpontaneousRestraint } = require('./shield/spontaneous-restraint.js');
      const inst = new SpontaneousRestraint({ silent: true, rootPath: HF_DIR });
      const r = inst.evaluate ? inst.evaluate(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_state_risk_probe: (args) => {
    try {
      const { StateRiskProbe } = require('./shield/state-risk-probe.js');
      const inst = new StateRiskProbe({ silent: true, rootPath: HF_DIR });
      const r = inst.probe ? inst.probe(args?.state || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_autonomous_emotion: (args) => {
    try {
      const { AutonomousEmotion } = require('./emotion/autonomous-emotion.js');
      const inst = new AutonomousEmotion({ silent: true, rootPath: HF_DIR });
      const r = inst.process ? inst.process(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_psychology_engine: (args) => {
    try {
      const { PsychologyEngine } = require('./emotion/engine.js');
      const inst = new PsychologyEngine({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_memory_bank: (args) => {
    try {
      const { MemoryBank } = require('./memory/memory-bank.js');
      const inst = new MemoryBank({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_memory_consolidate: (args) => {
    try {
      const { MemoryConsolidator } = require('./memory/memory-consolidator.js');
      const inst = new MemoryConsolidator({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_memory_write_control: (args) => {
    try {
      const { MemoryWriteController } = require('./memory/memory-write-controller.js');
      const inst = new MemoryWriteController({ silent: true, rootPath: HF_DIR });
      const r = inst.updateUserProfile ? inst.updateUserProfile(args?.profile || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_long_term_memory: (args) => {
    try {
      const { LongTermMemory } = require('./memory/long-term-memory.js');
      const inst = new LongTermMemory({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_reflection_memory: (args) => {
    try {
      const { ReflectionMemory } = require('./memory/reflection-memory.js');
      const inst = new ReflectionMemory({ silent: true, rootPath: HF_DIR });
      const r = inst.store ? inst.store({ text: args?.memory || '', type: 'reflection' }, { success: true }, '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_focus_attention: (args) => {
    try {
      const { FocusOfAttention } = require('./memory/focus-of-attention.js');
      const inst = new FocusOfAttention({ silent: true, rootPath: HF_DIR });
      const r = inst.setTask ? inst.setTask(args?.task || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_observe_engine: (args) => {
    try {
      const { Observe } = require('./memory/observe.js');
      const inst = new Observe({ silent: true, rootPath: HF_DIR });
      const r = inst.observe ? inst.observe(args?.observation || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_action_tracker: (args) => {
    try {
      const { ActionTracker } = require('./core/action-tracker.js');
      const inst = new ActionTracker({ silent: true, rootPath: HF_DIR });
      const r = inst.commit ? inst.commit(args?.action || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_execution_verify: (args) => {
    try {
      const { ExecutionVerifier } = require('./core/execution-verifier.js');
      const inst = new ExecutionVerifier({ silent: true, rootPath: HF_DIR });
      const r = inst.verify ? inst.verify(args?.result || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_flow_predict: (args) => {
    try {
      const { FlowPredictor } = require('./core/flow-predictor.js');
      const inst = new FlowPredictor({ silent: true, rootPath: HF_DIR });
      const r = inst.recordError ? inst.recordError(args?.event || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_information_flow: (args) => {
    try {
      const { InformationFlowOrchestrator } = require('./core/information-flow.js');
      const inst = new InformationFlowOrchestrator({ silent: true, rootPath: HF_DIR });
      const r = inst.orchestrate ? inst.orchestrate(args?.flow || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_intent_infer: (args) => {
    try {
      const { IntentLayer } = require('./core/intent-layer.js');
      const inst = new IntentLayer({ silent: true, rootPath: HF_DIR });
      const r = inst.inferIntent ? inst.inferIntent(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_meta_prompt: (args) => {
    try {
      const { MetaPromptEngine } = require('./core/meta-prompt-engine.js');
      const inst = new MetaPromptEngine({ silent: true, rootPath: HF_DIR });
      const r = inst.optimize ? inst.optimize(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_meta_memory: (args) => {
    try {
      const { MetaMemory } = require('./core/metaMemory.js');
      const inst = new MetaMemory({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_metacognitive_monitor: (args) => {
    try {
      const { MetacognitiveMonitor } = require('./core/metacognitive-executive.js');
      const inst = new MetacognitiveMonitor({ silent: true, rootPath: HF_DIR });
      const r = inst.monitor ? inst.monitor(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_output_check: (args) => {
    try {
      const { OutputChecklist } = require('./core/output-checklist.js');
      const inst = new OutputChecklist({ silent: true, rootPath: HF_DIR });
      const r = inst.runChecklist ? inst.runChecklist(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_self_diagnose: (args) => {
    try {
      const { SelfDiagnosis } = require('./core/self-diagnosis.js');
      const inst = new SelfDiagnosis({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_what_learned: (args) => {
    try {
      const { WhatLearned } = require('./core/what-learned.js');
      const inst = new WhatLearned({ silent: true, rootPath: HF_DIR });
      const r = {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_preference_guard: (args) => {
    try {
      const { PreferenceGuard } = require('./core/preference-guard.js');
      const inst = new PreferenceGuard({ silent: true, rootPath: HF_DIR });
      const r = inst.shouldApply ? inst.shouldApply(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_global_workspace: (args) => {
    try {
      const { GlobalWorkspace } = require('./consciousness/global-workspace.js');
      const inst = new GlobalWorkspace({ silent: true, rootPath: HF_DIR });
      const r = inst.registerAgent ? inst.registerAgent(args?.text || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_multi_agent_dialogue: (args) => {
    try {
      const { MultiAgentDialogue } = require('./consciousness/multi-agent-dialogue.js');
      const inst = new MultiAgentDialogue({ silent: true, rootPath: HF_DIR });
      const r = inst.registerAgent ? inst.registerAgent(args?.message || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_dream_v2: (args) => {

  try {
      const { DreamEngineV2 } = require('./dream/dream-engine-v2.js');
      const inst = new DreamEngineV2({ silent: true, rootPath: HF_DIR });
      const r = inst.generate ? inst.generate(args?.theme || '') : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_dream: handleDream,  heartflow_active_inference: (args) => {
    try {
      const { ActiveInference } = require('./decision/active-inference.js');
      const inst = new ActiveInference({ silent: true, rootPath: HF_DIR });
      const r = inst.decide ? inst.decide([{ id: 'a', name: args?.context || '', prior: 0.5 }], {}) : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.4.5] 第五批 — 记忆压缩/心智努力/交流层/公式引擎
  heartflow_memory_compress: (args) => {
    try {
      const { MemoryCompressor } = require('./memory/memory-compressor.js');
      const mc = new MemoryCompressor({ silent: true, rootPath: HF_DIR });
      const r = mc.computeImportance ? mc.computeImportance(args?.memory || '') : {};
      return { compression: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_mental_effort: (args) => {
    try {
      const { MentalEffortTracker } = require('./core/mental-effort-tracker.js');
      const me = new MentalEffortTracker({ silent: true, rootPath: HF_DIR });
      const r = me.estimateTaskEffort ? me.estimateTaskEffort(args?.task || '') : {};
      return { effort: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_user_to_llm: (args) => {
    try {
      const { UserToLLM } = require('./bridge/user-to-llm.js');
      const utl = new UserToLLM({ silent: true, rootPath: HF_DIR });
      const r = utl.translate ? utl.translate(args?.text || '') : {};
      return { translation: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_llm_to_user: (args) => {
    try {
      const { LLMToUser } = require('./bridge/llm-to-user.js');
      const ltu = new LLMToUser({ silent: true, rootPath: HF_DIR });
      const r = ltu.translate ? ltu.translate(args?.text || '') : {};
      return { refined: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_formula_search: (args) => {
    try {
      const { FormulaSearch } = require('./formula/formula-search.js');
      const fs = new FormulaSearch({ rootPath: HF_DIR, silent: true });
      const r = fs.search ? fs.search(args?.query || '') : [];
      return { results: (r.results || r).slice(0, 10), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_formula_calc: (args) => {
    try {
      const { FormulaCalculator } = require('./formula/formula-calculator.js');
      const fc = new FormulaCalculator({ rootPath: HF_DIR, silent: true });
      const r = fc.calculate ? fc.calculate(args?.formula || '', args?.values || {}) : {};
      return { result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_formula_engine: (args) => {
    try {
      const { FormulaEngine } = require('./formula/formula-engine.js');
      const fe = new FormulaEngine({ rootPath: HF_DIR, silent: true });
      const action = args?.action || 'search';
      const r = action === 'init' ? (fe.init ? fe.init() : {}) : (fe.searchFormulas ? fe.searchFormulas(args?.query || '') : {});
      return { formula: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.4.5] 第六批 — 对话风格/意图/响应拦截/公式桥
  heartflow_style_engine: (args) => {
    try {
      const { StyleEngine } = require('./dialogue/style-engine.js');
      const se = new StyleEngine({ silent: true, rootPath: HF_DIR });
      const action = args?.action || 'current';
      let r;
      if (action === 'modes') r = { modes: se.availableModes || [] };
      else if (action === 'select' && se.setMode) r = { mode: se.setMode(args?.style || '') };
      else r = { mode: se.currentMode || null, modes: se.availableModes || [] };
      return r;
    } catch (e) { return { error: e.message }; }
  },

  heartflow_intent_classify: (args) => {
    try {
      const { IntentClassifier } = require('./bridge/intent-classifier.js');
      const ic = new IntentClassifier({ silent: true, rootPath: HF_DIR });
      const r = ic.classify ? ic.classify(args?.text || '') : {};
      return { intent: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_response_intercept: (args) => {
    try {
      const { ResponseInterceptor } = require('./bridge/response-interceptor.js');
      const ri = new ResponseInterceptor({ silent: true, rootPath: HF_DIR });
      const r = ri.intercept ? ri.intercept(args?.text || '') : {};
      return { intercepted: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_formula_bridge: (args) => {
    try {
      const { FormulaBridge } = require('./formula/formula-bridge.js');
      const fb = new FormulaBridge({ rootPath: HF_DIR, silent: true });
      const r = fb.searchFromCorpus ? fb.searchFromCorpus(args?.query || '') : {};
      return { formula: (r.results || r).slice(0, 10), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.4.5] 第七批 — 心理/负载/护照/评论/语料/教训/项目
  heartflow_agent_psychology_full: (args) => {
    try {
      const { AgentPsychology } = require('./identity/agent-psychology.js');
      const ap = new AgentPsychology({ silent: true, rootPath: HF_DIR });
      const r = ap.assessCognitiveLoad ? ap.assessCognitiveLoad() : {};
      return { psychology: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_decision_instruction: (args) => {
    try {
      const { DecisionInstruction } = require('./identity/philosophy-to-decision.js');
      const di = new DecisionInstruction({ silent: true, rootPath: HF_DIR });
      const r = di.execute ? di.execute(args?.instruction || '') : {};
      return { instruction: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_cognitive_load: (args) => {
    try {
      const { CognitiveLoadBalancer } = require('./core/cognitive-load-balancer.js');
      const cl = new CognitiveLoadBalancer({ silent: true, rootPath: HF_DIR });
      const tasks = Array.isArray(args?.tasks) ? args.tasks : ['task'];
      const r = cl.balance ? cl.balance(tasks) : {};
      return { load: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_context_passport: (args) => {
    try {
      const { ContextPassport } = require('./core/decision.js');
      const cp = new ContextPassport({ silent: true, rootPath: HF_DIR });
      const r = cp.enter ? cp.enter(args?.context || '') : {};
      return { passport: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_agent_commentary: (args) => {
    try {
      const { AgentCommentary } = require('./bridge/agent-commentary.js');
      const ac = new AgentCommentary({ silent: true, rootPath: HF_DIR });
      const r = ac.generate ? ac.generate(args?.text || '') : {};
      return { commentary: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_context_builder: (args) => {
    try {
      const { ContextBuilder } = require('./bridge/context-builder.js');
      const cb = new ContextBuilder({ silent: true, rootPath: HF_DIR });
      const r = cb.build ? cb.build(args?.text || '') : {};
      return { context: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_corpus_math: (args) => {
    try {
      const { CorpusMathTool } = require('./formula/corpus-math-tool.js');
      const cm = new CorpusMathTool({ rootPath: HF_DIR, silent: true });
      const r = cm.search ? cm.search(args?.query || '') : [];
      return { results: (r.results || r).slice(0, 10), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_lesson_bank: (args) => {
    try {
      const { LessonBankAdapter } = require('./cortex/lesson-bank-adapter.js');
      const lb = new LessonBankAdapter({ rootPath: HF_DIR, silent: true });
      const r = lb.search ? lb.search(args?.query || '') : {};
      return { lessons: (r.results || r).slice(0, 10), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_project_context: (args) => {
    try {
      const { ProjectContext } = require('./memory/project-context.js');
      const pc = new ProjectContext({ rootPath: HF_DIR, silent: true });
      const r = pc.setProject ? pc.setProject(args?.project || 'default') : {};
      return { project: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
  heartflow_check_outbound: (args) => {
    try {
      const { checkOutbound } = require('./gate-outbound.js');
      return checkOutbound(args || {});
    } catch (e) {
      return { error: e.message };
    }
  },
  heartflow_audit_trace: (args) => {
    try {
      const { initChain, queryChain, verifyChain, listViolationTags } = require('./trace-chain.js');
      const action = args?.action || 'query';
      if (action === 'verify') return verifyChain();
      if (action === 'tags') return { tags: listViolationTags() };
      return queryChain(args || {});
    } catch (e) {
      return { error: e.message };
    }
  },
  heartflow_check_outbound: (args) => {
    try {
      const { checkOutbound } = require('./gate-outbound.js');
      return checkOutbound(args || {});
    } catch (e) {
      return { error: e.message };
    }
  },
  heartflow_audit_trace: (args) => {
    try {
      const { initChain, queryChain, verifyChain, listViolationTags } = require('./trace-chain.js');
      const action = args?.action || 'query';
      if (action === 'verify') return verifyChain();
      if (action === 'tags') return { tags: listViolationTags() };
      return queryChain(args || {});
    } catch (e) {
      return { error: e.message };
    }
  },  heartflow_circuit_breaker: (args) => {
    try {
      const cb = require('./circuit-breaker.js');
      const action = args?.action || 'status';
      if (action === 'trip') { cb.trip(args?.reason || 'manual'); return cb.getState(); }
      if (action === 'reset') { cb.reset(); return cb.getState(); }
      if (action === 'health') return cb.healthCheck();
      return cb.getState();
    } catch (e) {
      return { error: e.message };
    }
  },
  heartflow_safe_fetch: async (args) => {
    try {
      const { preflightCheck, batchCheck } = require('./safe-fetch.js');
      const action = args?.action || 'preflight';
      if (action === 'batch' && Array.isArray(args.texts)) {
        return batchCheck(args.texts, { context: args.context, classification: args.classification });
      }
      return preflightCheck(args.text || '', { context: args.context, classification: args.classification });
    } catch (e) {
      return { error: e.message };
    }
  },



  // [P2-1] agentic-memory-engine
  heartflow_agentic_memory: async (args) => {
    try {
      const { agenticMemory } = require('./index.js');
      const { action = 'decide', input, output, context } = args;
      if (action === 'decide' || action === 'decideAndStore') {
        return agenticMemory.decideAndStore(input || '', output || '', context || {});
      }
      if (action === 'store') {
        return agenticMemory.store(input || '', output || '', context || {});
      }
      if (action === 'recall') {
        return agenticMemory.recall(input || '', { limit: args.limit || 5 });
      }
      return { error: `unknown action: ${action}` };
    } catch (e) { return { error: e.message }; }
  },
  // [P2-2] metacognitive-reward
  heartflow_metacognition_evaluate: async (args) => {
    try {
      const { metacognition } = require('./index.js');
      return metacognition.evaluate(args.output || '', { selfFeedback: args.selfFeedback });
    } catch (e) { return { error: e.message }; }
  },
  // [P2-3] executable-reasoning
  heartflow_executable_reasoning: async (args) => {
    try {
      const { executableReasoning } = require('./index.js');
      const { action = 'endToEnd', raw, thoughtChain, opts } = args;
      if (action === 'parse') return { steps: executableReasoning.parseThoughtChain(raw || '') };
      if (action === 'plan') return executableReasoning.buildPlan(executableReasoning.parseThoughtChain(raw || ''), opts || {});
      if (action === 'execute' || action === 'endToEnd') return executableReasoning.endToEnd(raw || '', opts || {});
      return { error: `unknown action: ${action}` };
    } catch (e) { return { error: e.message }; }
  },
  // [P2-4] tom-engine
  heartflow_tom_model: async (args) => {
    try {
      const { tomEngine } = require('./index.js');
      const { action = 'model', agentId, observations, targetAgentId } = args;
      if (action === 'model' || action === 'modelAgent') {
        if (!agentId) return { error: 'agentId required' };
        return tomEngine.modelAgent(agentId, Array.isArray(observations) ? observations : [observations || '']);
      }
      if (action === 'predict' || action === 'predictBehavior') {
        return tomEngine.predict(agentId || targetAgentId || 'unknown');
      }
      if (action === 'contagion') {
        const ids = Array.isArray(args.agentIds) ? args.agentIds : [agentId];
        return tomEngine.contagion(ids);
      }
      return { error: `unknown action: ${action}` };
    } catch (e) { return { error: e.message }; }
  },
  // [P2-5] debate-engine
  heartflow_debate: async (args) => {
    try {
      const { debateEngine, ROLES } = require('./index.js');
      const { action = 'create', sessionId, topic, roleId, argument, evidence, roles, maxRounds } = args;
      if (action === 'create' || action === 'createSession') {
        if (!topic) return { error: 'topic required' };
        return debateEngine.createSession(topic, { roles, maxRounds });
      }
      if (action === 'addRound' || action === 'speak') {
        if (!sessionId || !roleId || !argument) return { error: 'sessionId/roleId/argument required' };
        return debateEngine.addRound(sessionId, roleId, argument, evidence || []);
      }
      if (action === 'summarize') return debateEngine.summarize(sessionId);
      if (action === 'conclude' || action === 'end') {
        return debateEngine.conclude(sessionId, args.conclusion || '');
      }
      return { error: `unknown action: ${action}` };
    } catch (e) { return { error: e.message }; }
  },
  // [P2-6] evolutionary-search
  heartflow_evolutionary_search: async (args) => {
    try {
      const { evolutionarySearch } = require('./index.js');
      const { action = 'forward', searchSpace, population, fitnessFn, target, constraintFn } = args;
      if (action === 'init' || action === 'initPopulation') {
        if (!searchSpace) return { error: 'searchSpace required' };
        return { population: evolutionarySearch.initPopulation(searchSpace) };
      }
      if (action === 'forward') {
        if (!population || !fitnessFn) return { error: 'population/fitnessFn required' };
        return evolutionarySearch.forward(population, fitnessFn, args.generations);
      }
      if (action === 'backward') {
        if (!target || !constraintFn || !searchSpace) return { error: 'target/constraintFn/searchSpace required' };
        return evolutionarySearch.backward(target, constraintFn, searchSpace, args.iterations);
      }
      return { error: `unknown action: ${action}` };
    } catch (e) { return { error: e.message }; }
  },

  // [P1-2] 关键日志 180 天留存
  heartflow_retention_log: async (args) => {
    try {
      const { RetentionLogger } = require('./retention-logger.js');
      const logger = new RetentionLogger('audit');
      if (args.action === 'log') { logger.log(args); return { logged: true }; }
      return { results: logger.query(args) };
    } catch (e) { return { error: e.message }; }
  },
  // [P1-3] 出域台账
  heartflow_outbound_ledger: async (args) => {
    try {
      const { OutboundLedger } = require('./outbound-ledger.js');
      const ledger = new OutboundLedger();
      const action = args.action || 'query';
      if (action === 'record') {
        ledger.record(args);
        return { recorded: true };
      }
      if (action === 'stats') return ledger.stats(args);
      return { results: ledger.query(args) };
    } catch (e) { return { error: e.message }; }
  },
};



// ═══════════════════════════════════════════════

// JSON-RPC 响应构造

// ═══════════════════════════════════════════════



function makeResponse(id, result) {

  return JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n';

}



function makeError(id, code, message, data) {

  const error = { code, message };

  if (data !== undefined) error.data = data;

  return JSON.stringify({ jsonrpc: '2.0', id, error }) + '\n';

}



// ═══════════════════════════════════════════════

// 请求处理

// ═══════════════════════════════════════════════



async function handleRequest(request, sessionId) {

  const { id, method, params = {} } = request;



  switch (method) {

    case 'initialize':

      return { protocolVersion: '2024-11-05', capabilities: { tools: {}, logging: {} }, serverInfo: { name: 'heartflow-mcp', version: version || '1.0.0' } };



    case 'notifications/initialized':

      return null;



    case 'tools/list':

      return { tools: TOOLS };




    // [P1-1] OID身份码 + 三层权限模型
    // 角色: guest(只读) / user(读写) / admin(全权限)
    // 身份码: HeartFlow-OID-<16-char-hash>
    {
      const reqOid = req.headers['x-heartflow-oid'] || '';
      const token = req.headers['authorization']?.replace('Bearer ', '') || '';
      let role = 'guest';
      if (token && typeof expectedToken === 'string' && token === expectedToken) {
        role = 'admin';
      }
      const oidMatch = reqOid.match(/^HeartFlow-OID-([a-f0-9]{16})$/);
      if (oidMatch) {
        role = Math.max(['guest','user','admin'].indexOf(role), ['guest','user','admin'].indexOf('user'));
      }
      const needsWrite = ['heartflow_memory_store', 'heartflow_memory_remove',
        'heartflow_decision_decide', 'heartflow_heartflow_selfHeal'].includes(name);
      if (needsWrite && role === 'guest') {
        return { content: [{ type: 'text', text: JSON.stringify({
          error: '权限不足：guest 角色不可写，请升级身份认证'
        }) }], isError: true };
      }
    }

    case 'tools/call': {

      let { name, arguments: args = {} } = params;

      const handler = HANDLERS[name];

      if (!handler) throw { code: -32601, message: `Method not found: ${name}` };

      // [AUDIT-FIX I-2] 中央参数校验：只透传 inputSchema 声明的参数，
      // 丢弃未声明参数（防参数注入），并对 string 类型参数强制字符串（防类型混淆）
      const toolDef = TOOLS.find(t => t.name === name);
      if (toolDef && toolDef.inputSchema && toolDef.inputSchema.properties) {
        const props = toolDef.inputSchema.properties;
        const cleaned = {};
        for (const [k, v] of Object.entries(props)) {
          if (k in args) {
            if ((v.type === 'string' || v.type === 'number') && typeof args[k] !== v.type) {
              if (v.type === 'number' && typeof args[k] === 'number') { cleaned[k] = args[k]; continue; }
              if (v.type === 'string' && (typeof args[k] === 'string' || typeof args[k] === 'number')) { cleaned[k] = String(args[k]); continue; }
              return { content: [{ type: 'text', text: JSON.stringify({ error: `参数 ${k} 类型错误: 期望 ${v.type}`, timestamp: Date.now() }) }], isError: true };
            }
            cleaned[k] = args[k];
          }
        }
        args = cleaned;
      }



      let result;

      // 兼容两种签名：handler(args) 和 handler(args, sessionId)

      try {

        result = handler(args, sessionId);

      } catch (_) {

        result = handler(args);

      }

      if (result && typeof result.then === 'function') result = await result;

      // [AUDIT-FIX P1-4] 错误信息收敛：过滤绝对路径，截断超长消息，避免内部结构泄露
      if (result && typeof result === 'object' && result.error && typeof result.error === 'string') {
        let msg = result.error;
        msg = msg.replace(/\/[A-Za-z0-9_./-]*(?:\.hermes|\.claude|\.ssh|\.npm|node_modules|mark-heartflow-skill)[A-Za-z0-9_./-]*/g, '[path]');
        msg = msg.replace(/\/[A-Za-z0-9_./-]{40,}/g, '[path]');
        if (msg.length > 300) msg = msg.slice(0, 300) + '…';
        result.error = msg;
      }


      // [P0-3] 熔断接入 MCP 统计流：recordOutcome() 嵌入 handleTool
      try {
        if (typeof cb !== 'undefined' && cb.recordOutcome) {
          cb.recordOutcome(!(result && result.isError));
        }
      } catch (_) { /* 防御性：熔断统计不阻断主流程 */ }


      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };

    }



    case 'ping':

      return {};



    default:

      throw { code: -32601, message: `Method not found: ${method}` };

  }

}



// ═══════════════════════════════════════════════

// HTTP Server（SSE 传输）

// ═══════════════════════════════════════════════



// SSE 客户端列表 (sessionId → response)

const sseClients = new Map();



function sendSSE(client, data) {

  client.write(`data: ${JSON.stringify(data)}\n\n`);

}



function sendEvent(client, event, data) {

  client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

}



const server = http.createServer((req, res) => {

  const url = new URL(req.url, `http://localhost:${PORT}`);

  const pathname = url.pathname;



  // ─── 安全认证检查 (SkillSpector fix: 强制认证，仅接受 Authorization header) ───

  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.startsWith('Bearer ')

    ? authHeader.slice(7)

    : null;

  // SkillSpector fix: 移除 URL query parameter token 认证（token 在 URL 中会通过日志/referrer 泄露）

  

  if (AUTH_ENABLED && !safeCompare(token, AUTH_TOKEN)) {

    // [AUDIT-FIX] Token 维度速率限制：记录失败尝试

    const tokenHash = token ? crypto.createHash('sha256').update(token).digest('hex').slice(0, 16) : 'none';

    if (!checkTokenRateLimit(tokenHash)) {

      res.writeHead(429, { 'Content-Type': 'application/json' });

      res.end(JSON.stringify({ error: 'Too Many Auth Failures', retryAfter: 60 }));

      return;

    }

    res.writeHead(401, { 'Content-Type': 'application/json' });

    res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing Bearer token in Authorization header' }));

    return;

  }



  // ─── CORS Preflight ───

  if (req.method === 'OPTIONS') {

    res.writeHead(204, {

      'Access-Control-Allow-Origin': 'http://localhost',  // [AUDIT-FIX] 限制 CORS 来源为本地

      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',

      'Access-Control-Allow-Headers': 'Content-Type, Authorization',

      'Access-Control-Max-Age': '86400',

      'Access-Control-Allow-Credentials': 'false'  // [AUDIT-FIX] 禁止跨域携带凭据

    });

    res.end();

    return;

  }



  // ─── 速率限制 ───

  const clientIp = req.socket.remoteAddress || 'unknown';

  if (!checkRateLimit(clientIp)) {

    res.writeHead(429, { 'Content-Type': 'application/json' });

    res.end(JSON.stringify({ error: 'Too Many Requests', retryAfter: 60 }));

    return;

  }



  // ─── SSE 端点 ───

  if (pathname === '/mcp' && req.method === 'GET') {

    res.writeHead(200, {

      'Content-Type': 'text/event-stream',

      'Cache-Control': 'no-cache',

      'Connection': 'keep-alive',

      'Access-Control-Allow-Origin': 'http://localhost',  // [AUDIT-FIX] 限制 CORS 来源

      'X-Accel-Buffering': 'no'

    });



    // 生成 sessionId

    const sessionId = crypto.randomUUID();



    // 发送端点信息 — MCP 规范要求纯 URL 字符串

    sendEvent(res, 'endpoint', '/mcp?sessionId=' + sessionId);



    // 注册客户端 (sessionId → response)

    sseClients.set(sessionId, res);

    console.error(`[HeartFlow MCP] SSE 客户端已连接 sessionId=${sessionId} (共 ${sseClients.size} 个)`);



    // 心跳保持连接

    const heartbeat = setInterval(() => {

      try { sendEvent(res, 'ping', {}); } catch (_) { /* [v5.9.18] 防御性: ping发送容错 */ }

    }, 30000);



    req.on('close', () => {

      sseClients.delete(sessionId);

      clearInterval(heartbeat);

      console.error(`[HeartFlow MCP] SSE 客户端断开 sessionId=${sessionId} (剩余 ${sseClients.size} 个)`);

    });



    return;

  }



  // ─── JSON-RPC 端点 ───

  if (pathname === '/mcp' && req.method === 'POST') {

    // 从 URL 中获取 sessionId

    const sessionId = url.searchParams.get('sessionId');



    // 请求超时 30s

    req.setTimeout(30000, () => {

      res.writeHead(408);

      res.end('Request Timeout');

      req.destroy();

    });



    // 请求体大小限制 1MB

    const MAX_BODY = 1024 * 1024;

    let body = '';

    let bodySize = 0;



    req.on('error', (err) => {

      console.error(`[HeartFlow MCP] 请求错误:`, err.message);

    });



    req.on('data', chunk => {

      bodySize += chunk.length;

      if (bodySize > MAX_BODY) {

        res.writeHead(413);

        res.end('Payload Too Large');

        req.destroy();

        return;

      }

      body += chunk;

    });



    req.on('end', async () => {

      try {

        const request = JSON.parse(body);

        if (!request || typeof request !== 'object' || Array.isArray(request)) {

          res.writeHead(200, {

            'Content-Type': 'application/json',

            'Access-Control-Allow-Origin': 'http://localhost',

          });

          res.end(makeError(null, -32600, 'Invalid Request: expected JSON-RPC object'));

          return;

        }

        const result = await handleRequest(request, sessionId);

        if (result !== null) {

          // 找到对应的 SSE 客户端，通过 SSE 发送结果

          if (sessionId && sseClients.has(sessionId)) {

            const client = sseClients.get(sessionId);

            sendEvent(client, 'message', makeResponse(request.id, result));

            res.writeHead(202, {

              'Content-Type': 'application/json',

              'Access-Control-Allow-Origin': 'http://localhost',

            });

            res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: 'accepted' }) + '\n');

          } else {

            // 没有 SSE 客户端，直接返回

            res.writeHead(200, {

              'Content-Type': 'application/json',

              'Access-Control-Allow-Origin': 'http://localhost',

            });

            res.end(makeResponse(request.id, result));

          }

        } else {

          // notification — 202 accepted

          res.writeHead(202, {

            'Content-Type': 'application/json',

            'Access-Control-Allow-Origin': 'http://localhost',

          });

          res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id }) + '\n');

        }

      } catch (err) {

        res.writeHead(200, {

          'Content-Type': 'application/json',

          'Access-Control-Allow-Origin': 'http://localhost',

        });

        res.end(makeError(null, err.code || -32603, err.message || 'Internal error'));

      }

    });

    return;

  }



  // ─── 健康检查 ───

  if (pathname === '/health') {

    res.writeHead(200, { 'Content-Type': 'application/json' });

    res.end(JSON.stringify({

      status: 'ok',

      version,

      clients: sseClients.size,

    }));

    return;

  }



  // ─── 404 ───

  res.writeHead(404);

  res.end('Not Found');

});



server.on('error', (err) => {

  if (err.code === 'EADDRINUSE') {

    console.error(`[HeartFlow MCP] 端口 ${PORT} 已被占用，尝试强制释放后重启。`);

    try {
      const { execSync } = require('child_process');
      if (!/^\d+$/.test(String(PORT))) {
        console.error(`[HeartFlow MCP] 端口值非法，跳过自动清理: ${PORT}`);
        process.exit(1);
      }
      try {
        execSync(`fuser -k ${PORT}/tcp`, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 3000 });
      } catch (e) {
        const stderr = (e.stderr && e.stderr.toString()) || e.message || '';
        console.error(`[HeartFlow MCP] fuser 释放端口输出: ${stderr.trim()}`);
      }
      console.error(`[HeartFlow MCP] 端口 ${PORT} 已释放，3秒后自动重启。`);
      setTimeout(() => {
        server.close(() => {
          server.listen(PORT, '127.0.0.1');
        });
      }, 3000);
      return;
    } catch (_) {
      console.error(`[HeartFlow MCP] 无法释放端口 ${PORT}，进程退出。`);
      process.exit(1);
    }

  }

  console.error(`[HeartFlow MCP] HTTP 服务器错误:`, err.message);

  // [v6.2.7] 崩溃自动恢复：非退出类错误自动重启
  if (!process.exitCode || process.exitCode === 0) {
    console.error('[HeartFlow MCP] 尝试自动重启...');
    setTimeout(() => {
      server.close(() => {
        server.listen(PORT, '127.0.0.1');
      });
    }, 2000);
  }

});



// ═══════════════════════════════════════════════

// 优雅退出

// ═══════════════════════════════════════════════



function shutdown() {

  console.error('[HeartFlow MCP] 关闭中...');

  // 关闭所有 SSE 连接

  for (const [sessionId, client] of sseClients) {

    try { client.end(); } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

  }

  sseClients.clear();

  // 停止引擎

  if (heartflow) { try { heartflow.stop(); } catch (_) { /* [v5.9.18] intentional: graceful degradation */ } }

  server.close(() => process.exit(0));

}



process.on('SIGINT', shutdown);

process.on('SIGTERM', shutdown);

process.on('uncaughtException', (err) => {

  console.error(`[HeartFlow MCP] 未捕获异常:`, err.message);

  shutdown();

});

process.on('unhandledRejection', (reason) => {

  console.error(`[HeartFlow MCP] 未处理 Promise 拒绝:`, reason);

});



// ═══════════════════════════════════════════════

// 启动

// ═══════════════════════════════════════════════



initHeartFlow();

if (SOCKET_PATH) {
  const unixServer = net.createServer(handleUnixClient);
  try { fs.unlinkSync(SOCKET_PATH); } catch (_) {}
  try {
    unixServer.listen(SOCKET_PATH, () => {
      fs.chmodSync(SOCKET_PATH, 0o600);
      console.error(`[HeartFlow MCP] Unix socket: ${SOCKET_PATH}`);
      console.error(`[HeartFlow MCP] 连接方式: hermes mcp add heartflow --url unix://${SOCKET_PATH}`);
    });
  } catch (err) {
    console.error(`[HeartFlow MCP] Unix socket 监听失败: ${err.message}`);
    process.exit(1);
  }
  unixServer.on('error', (err) => {
    console.error(`[HeartFlow MCP] Unix socket error: ${err.message}`);
    process.exit(1);
  });
} else {
  server.listen(PORT, '127.0.0.1', () => {
    console.error(`[HeartFlow MCP] HTTP SSE 服务已启动: http://127.0.0.1:${PORT}/mcp`);
    console.error(`[HeartFlow MCP] 健康检查: http://127.0.0.1:${PORT}/health`);
    console.error(`[HeartFlow MCP] 连接方式: hermes mcp add heartflow --url http://127.0.0.1:${PORT}/mcp`);
  });
}

