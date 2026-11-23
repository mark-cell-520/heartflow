/**
 * src/llm/llm-client.js — 心虫 LLM 兜底客户端（规则引擎的"第二只眼睛"）
 *
 * 设计原则（用户确认）：
 * - 规则引擎能判的 → 规则秒判（快、稳、免费）
 * - 规则判不了（置信度 < 阈值）→ 调大模型兜底
 * - 大模型结果 → 再经心虫 gate 校验（防大模型被诱导）
 *
 * Provider 无关设计：
 * - 代码不绑定任何 API 厂商，不写死任何 key
 * - 配置完全来自用户环境（每个用户接自己的 API）：
 *   1. 环境变量 HEARTFLOW_LLM_API_KEY / HEARTFLOW_LLM_BASE_URL / HEARTFLOW_LLM_MODEL
 *   2. 回退到 ~/.hermes/config.yaml 的 model 段（用户自己的配置）
 * - 不自动切换 provider：失败即报错，由用户/宿主处理
 *
 * 安全：
 * - API key 只从 env/config 读，不落盘
 * - host 白名单（防 env 注入外泄 key）
 * - 超时 + 失败静默（LLM 挂了不阻断规则引擎）
 * - [AUDIT-FIX 2026-11-23] HEARTFLOW_LLM_FALLBACK 总开关，默认关闭；
 *   关闭时不发任何外部请求；guest（未认证）会话永不触发外传
 */

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { logger } = require('../utils/logger');

// ════════════════════════════════════════════════════════════════
// [AUDIT-FIX 2026-11-23] LLM 兜底总开关 + guest 身份门槛
//
// 背景：心虫自述 "Zero LLM dependency"，.well-known/agent-card.json 宣称
// 「数据不外传 / 纯本地运算」，但规则置信度 < 0.7 时存在一条 LLM 兜底路径，
// 会把**待判别的原文**发往外部服务，且入口对 guest（匿名）开放。后果：
//   (a) 与"数据不外传"的公开承诺直接矛盾；
//   (b) 复用 hermes 共用的 StepFun key，匿名可反复调用打爆账户级 TPM 配额；
//   (c) 待判别文本可能含敏感内容。
//
// 修法（不删功能，只加门槛）：
//   1. HEARTFLOW_LLM_FALLBACK 未显式开启 → 本模块**不发起任何网络请求**，
//      直接抛错让调用方走原有纯规则降级路径（等同 LLM 兜底不存在时的行为）。
//      是"根本不发"，不是"发了再丢结果"。
//   2. 调用方身份显式为 guest → 同样在任何网络动作之前拒绝。
// ════════════════════════════════════════════════════════════════

// 开关环境变量名（契约见文件末尾 module.exports 注释）
const LLM_FALLBACK_ENV = 'HEARTFLOW_LLM_FALLBACK';

/**
 * LLM 兜底是否开启。默认关闭。
 * 布尔式写法与 src/memory/memory-encrypt.js:196-197 保持一致：
 * 只有 '1' / 'true' 开启；'0' / 'false' / 空 / 未设置一律关闭。
 */
function isLlmFallbackEnabled() {
  const flag = process.env[LLM_FALLBACK_ENV];
  if (flag === undefined || flag === null) return false;
  const v = String(flag).trim().toLowerCase();
  return v === '1' || v === 'true';
}

/**
 * 调用方身份归一化。三层权限模型（src/mcp-server.js）：guest / user / admin。
 * 缺失或无法识别一律按 guest 处理（fail-closed）——宁可少判一次，
 * 也不能把匿名输入送给外部 LLM。
 */
function normalizeRole(role) {
  if (role === undefined || role === null) return 'guest';
  const r = String(role).trim().toLowerCase();
  return (r === 'user' || r === 'admin') ? r : 'guest';
}

function isGuestRole(role) {
  return normalizeRole(role) === 'guest';
}

// 关闭提示只打一次，避免每次调用都刷一行
let _disabledLogged = false;
function logDisabledOnce() {
  if (_disabledLogged) return;
  _disabledLogged = true;
  logger.info('llm-client', `LLM 兜底已禁用（${LLM_FALLBACK_ENV} 未设置为 1/true），走规则降级，不发起任何外部请求`);
}

// 允许的 API host（防止 env 注入把 key 发到恶意域名）
// 覆盖主流 OpenAI 兼容服务；用户可通过 HEARTFLOW_LLM_ALLOWED_HOSTS 追加
const ALLOWED_HOSTS = [
  'copilot.tencent.com', 'api.tencent.com',
  'api.openai.com', 'api.anthropic.com', 'api.deepseek.com',
  'openrouter.ai', 'generativelanguage.googleapis.com',
  'api.stepfun.com', 'api.stepfun.com.cn', 'api.moonshot.cn',
  'api.siliconflow.cn', 'api.z.ai', 'api.x.ai', 'api.groq.com',
  'api.together.xyz', 'api.mistral.ai', 'api.cohere.ai',
  'api.groq.com', 'ark.cn-beijing.volces.com',
];

function loadUserModelConfig() {
  try {
    const cfgPath = path.join(os.homedir(), '.hermes', 'config.yaml');
    if (!fs.existsSync(cfgPath)) return {};
    const raw = fs.readFileSync(cfgPath, 'utf8');
    // 只取文件最顶部的 model: 块（用户自己的 model 配置）
    const topMatch = raw.match(/^model:\s*\n((?:  [^\n]+\n?)+)/m);
    const model = {};
    if (topMatch) {
      for (const line of topMatch[1].split('\n')) {
        const m = line.match(/^\s{2}([a-z_]+):\s*(.+)$/);
        if (m) model[m[1]] = m[2].trim().replace(/['"]/g, '');
      }
    }
    return model;
  } catch { return {}; }
}

let _config = null;
function getConfig() {
  if (_config) return _config;
  const userCfg = loadUserModelConfig();
  _config = {
    // 用户自己的 API key（env 优先，其次用户 config.yaml）
    apiKey: process.env.HEARTFLOW_LLM_API_KEY
      || process.env.OPENAI_API_KEY
      || userCfg.api_key
      || '',
    baseUrl: process.env.HEARTFLOW_LLM_BASE_URL
      || userCfg.base_url
      || '',
    model: process.env.HEARTFLOW_LLM_MODEL
      || userCfg.default
      || '',
  };
  return _config;
}

function validateHost(baseUrl) {
  try {
    const host = new URL(baseUrl).hostname;
    const extra = (process.env.HEARTFLOW_LLM_ALLOWED_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
    return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h)) || extra.some(h => host === h || host.endsWith('.' + h));
  } catch { return false; }
}

/** 只取 base_url 的 hostname（日志用）。绝不记录完整 base_url——它可能带 key 查询参数。 */
function hostOf(baseUrl) {
  try { return new URL(baseUrl).hostname; } catch { return 'unknown'; }
}

/**
 * [AUDIT-FIX 2026-11-23] 外传可观测：一次真实外传发生时打一行日志。
 * 只记目标域名 + 耗时 + 是否成功；**严禁**记录待判别的 system/user 文本与 api_key。
 */
function logEgress(host, startedAt, status, ok) {
  logger.info('llm-client', `LLM 外传 host=${host} status=${status} dur=${Date.now() - startedAt}ms ok=${ok}`);
}

/**
 * 调用 LLM（OpenAI 兼容 /chat/completions）
 * @param {string} system - 系统提示
 * @param {string} user - 用户消息
 * @param {object} [opts] - { maxTokens, temperature, timeoutMs, model, role }
 *   role: 调用方身份（'guest' | 'user' | 'admin'）。显式传入 'guest' 时拒绝外传；
 *         不传则本层不做身份判定（身份门槛由调用点负责，见
 *         src/workflow/thought-chain.js 的 _classifyTask）。
 * @returns {Promise<{content: string, raw: object, model: string}>}
 */
async function chat(system, user, opts = {}) {
  // ── 门槛 1：总开关。关闭时在任何网络动作之前返回，绝不发出请求 ──────────
  if (!isLlmFallbackEnabled()) {
    logDisabledOnce();
    throw new Error(`[llm-client] LLM 兜底已禁用（${LLM_FALLBACK_ENV} 未开启），不发外部请求，调用方走规则降级`);
  }

  // ── 门槛 2：guest 身份。显式被告知是匿名会话时，同样不发请求 ────────────
  // 只拦"显式传入且判明为 guest"的情况：目前 task-classifier-fallback.js
  // 不透传 role，身份判定的主门槛在 thought-chain.js 的调用点；这里是纵深防御，
  // 供将来任何直接把 role 传下来的调用方使用。
  if ((opts.role !== undefined && opts.role !== null) && isGuestRole(opts.role)) {
    logger.info('llm-client', 'LLM 兜底被拒：调用方身份为 guest，不发起外部请求');
    throw new Error('[llm-client] LLM 兜底拒绝执行：guest（未认证）会话不得触发外部请求');
  }

  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey) throw new Error('[llm-client] 未配置 API key（设置 HEARTFLOW_LLM_API_KEY 环境变量）');
  if (!baseUrl) throw new Error('[llm-client] 未配置 API base_url（设置 HEARTFLOW_LLM_BASE_URL 环境变量）');
  if (!validateHost(baseUrl)) throw new Error(`[llm-client] base_url host 不在白名单: ${baseUrl}（可在 HEARTFLOW_LLM_ALLOWED_HOSTS 追加）`);

  const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
  // 部分厂商（腾讯 copilot）要求 stream=true
  const isTencent = baseUrl.includes('copilot.tencent.com') || baseUrl.includes('api.tencent.com');
  const body = JSON.stringify({
    model: opts.model || model || 'gpt-4o-mini',
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user },
    ],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens || 500,
    stream: isTencent,  // 腾讯必须流式；其他默认非流式
  });

  let safeFetch;
  try { ({ safeFetch } = require('../core/fetch-safe.js')); } catch { safeFetch = fetch; }

  // [AUDIT-FIX 2026-11-23] 外发前记录目标域名（仅 hostname，不含 key）与起始时间
  const host = hostOf(baseUrl);
  const startedAt = Date.now();

  let res;
  try {
    res = await safeFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body,
      timeout: opts.timeoutMs || 15000,
    });
  } catch (e) {
    // 网络层失败（超时/DNS/SSRF 拦截）也要留痕，否则"悄悄失败"无法与"从未发起"区分
    logEgress(host, startedAt, 0, false);
    throw e;
  }
  // 一次真实外传完成：记域名 + 状态码 + 耗时 + 成败，不记任何请求/响应内容
  logEgress(host, startedAt, res.status, !!res.ok);

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`[llm-client] HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.text();
  let content = '';
  let jsonData = null;
  if (isTencent) {
    // 腾讯流式响应：SSE 格式 data: {...}
    for (const line of data.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(line.slice(6));
          const delta = chunk?.choices?.[0]?.delta?.content || chunk?.choices?.[0]?.message?.content || '';
          if (delta) content += delta;
          if (chunk?.choices?.[0]?.message?.content) { jsonData = chunk; break; }
        } catch { /* 忽略非 JSON 行 */ }
      }
    }
  } else {
    try { jsonData = JSON.parse(data); } catch { /* 忽略 */ }
    content = jsonData?.choices?.[0]?.message?.content || '';
  }
  return { content, raw: jsonData || {}, model };
}

module.exports = {
  chat,
  getConfig,
  validateHost,
  ALLOWED_HOSTS,
  // [AUDIT-FIX 2026-11-23] 新增导出
  // 契约：HEARTFLOW_LLM_FALLBACK = '1' | 'true' → 开启；'0' | 'false' | 空 | 未设置 → 关闭（默认关闭）。
  //       关闭时 chat() 在任何网络动作之前抛错，调用方应走纯规则降级。
  //       opts.role = 'guest'（或无法识别的身份）→ 拒绝外传。
  isLlmFallbackEnabled,
  normalizeRole,
  isGuestRole,
  LLM_FALLBACK_ENV,
};
