'use strict';

/**
 * [v6.7.1] safeFetch: 出域防护集成层
 * 
 * 在 fetch 发起前自动调用 checkOutbound，拦截 PII/高密级内容
 * 国标关口 3 出域防护前置拦截
 */

const { checkOutbound } = require('./gate-outbound.js');

const SAFE_FETCH_CACHE = new Map();
const CACHE_MAX_SIZE = 128;          // [AUDIT-FIX P1] 缓存上限
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟 TTL

function _cachePrune() {
  if (SAFE_FETCH_CACHE.size <= CACHE_MAX_SIZE) return;
  // 淘汰最旧的 25%
  const entries = [...SAFE_FETCH_CACHE.entries()];
  entries.sort((a, b) => a[1].ts - b[1].ts);
  const drop = Math.floor(CACHE_MAX_SIZE * 0.25);
  for (let i = 0; i < drop; i++) SAFE_FETCH_CACHE.delete(entries[i][0]);
}

function _cacheGet(key) {
  const hit = SAFE_FETCH_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    SAFE_FETCH_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function _cacheSet(key, value) {
  SAFE_FETCH_CACHE.set(key, { value, ts: Date.now() });
  _cachePrune();
}

/**
 * 检查内容是否可安全发出
 * @param {string} text 待发送内容
 * @param {object} opts { context, classification }
 * @returns {Promise<{allowed: boolean, action: string, reason?: string, text?: string}>}
 */
async function preflightCheck(text, opts = {}) {
  if (!text || typeof text !== 'string') {
    return { allowed: true, action: 'pass', text };
  }

  // [AUDIT-FIX P1] 使用带 TTL/大小限制的缓存
  const cacheKey = `${opts.context || ''}::${opts.classification || '内部'}::${text.slice(0, 64)}`;
  const cached = _cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const result = checkOutbound({
      text,
      context: opts.context || '',
      classification: opts.classification || '内部',
    });

    const response = (() => {
      if (result.action === 'block') {
        return {
          allowed: false,
          action: 'block',
          reason: result.reason || '内容包含敏感信息',
          text: undefined,
        };
      }
      if (result.action === 'rewrite') {
        return {
          allowed: true,
          action: 'rewrite',
          text: result.redacted || text,
          reason: result.reason,
        };
      }
      return { allowed: true, action: 'pass', text };
    })();

    _cacheSet(cacheKey, response);
    return response;
  } catch (e) {
    console.warn('[safeFetch] preflight check error:', e.message);
    return { allowed: true, action: 'pass', text, warning: e.message };
  }
}

/**
 * 包装 fetch 调用（拦截 fetch API）
 * @param {string} url 目标 URL
 * @param {RequestInit} options fetch options
 * @param {object} opts { context, classification }
 * @returns {Promise<Response>}
 */
async function safeFetch(url, options = {}, opts = {}) {
  const body = options.body;
  if (body && typeof body === 'string') {
    const check = await preflightCheck(body, opts);
    if (!check.allowed) {
      throw new Error(`[safeFetch] 出域拦截: ${check.reason}`);
    }
    if (check.action === 'rewrite') {
      options.body = check.text;
    }
  }
  return fetch(url, options);
}

/**
 * 工具: 批量预检文本
 * @param {string[]} texts 文本数组
 * @param {object} opts
 * @returns {Promise<Array<{index: number, action: string, reason?: string}>>}
 */
async function batchCheck(texts, opts = {}) {
  return Promise.all(
    texts.map(async (t, i) => {
      const r = await preflightCheck(t, opts);
      return { index: i, ...r };
    })
  );
}

module.exports = {
  preflightCheck,
  safeFetch,
  batchCheck,
  checkOutbound,  // re-export
};

