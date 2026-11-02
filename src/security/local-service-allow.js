/**
 * local-service-allow.js — 引擎自有本机服务白名单（单一事实源）
 *
 * [B 先例维度 · 2026-11-02 建，审计轮加固]
 * url-validator（SSRF 校验）与 fetch-safe（DNS pinning 豁免）共用本模块，
 * 杜绝两处默认值漂移导致的「validator 放行但 pinning 拦截」静默降级。
 *
 * 威胁模型：白名单针对的是引擎硬编码/环境变量指定的本机服务端点（openmem 先例
 * 服务、embeddings、OpenList、心虫 MCP），不是用户可控的出网目标——SSRF 防护防的
 * 是「攻击者借引擎打内网」，这类端点不适用。除此之外 loopback/内网网段仍全禁。
 *
 * 审计轮加固（2026-11-02，三条安全约束）：
 *   ① 仅 http/https——白名单不是协议后门（ftp://127.0.0.1:8588 曾可返回 safe:true）；
 *   ② 条目必须是 IP 字面量——域名条目会连 validateFetchUrl 全量校验与 DNS pinning
 *      一起豁免，重绑定窗口重现；
 *   ③ localhost/::1 归一化为 127.0.0.1——运营把 URL 写成 http://localhost:3468 时
 *      曾因 loopback 规则被拦、先例维度永久静默降级（实测复现）。
 */
const net = require('net');

const DEFAULT_ALLOW = ['127.0.0.1:3468', '127.0.0.1:11435', '127.0.0.1:5244', '127.0.0.1:8588'];

function getAllowList() {
  const raw = process.env.HF_LOCAL_SERVICE_ALLOW || DEFAULT_ALLOW.join(',');
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/** localhost / ::1 / [::1] → 127.0.0.1；其余原样返回（小写） */
function normalizeHost(hostname) {
  if (!hostname) return hostname;
  let host = String(hostname).toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  if (host === 'localhost' || host === '::1' || host === '0:0:0:0:0:0:0:1') host = '127.0.0.1';
  return host;
}

/**
 * 判断 URL 是否命中引擎自有本机服务白名单。
 * 三条约束不过即返回 false（落正常 SSRF 校验流程）。
 */
function isEngineLocalService(urlStr) {
  let parsed;
  try { parsed = new URL(urlStr); } catch (_) { return false; }
  // 约束①：仅 http/https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  // 约束③：localhost 归一化
  const host = normalizeHost(parsed.hostname);
  // 约束②：仅 IP 字面量（拒绝域名，防重绑定窗口）
  if (!net.isIP(host)) return false;
  const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
  return getAllowList().includes(`${host}:${port}`);
}

module.exports = { isEngineLocalService, getAllowList, normalizeHost, DEFAULT_ALLOW };
