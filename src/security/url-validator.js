/**
 * URL Validator — SSRF prevention for HeartFlow
 *
 * Validates that a URL is safe to fetch by rejecting internal/private
 * network addresses that could be used for Server-Side Request Forgery.
 *
 * Usage:
 *   const { validateFetchUrl } = require('../security/url-validator.js');
 *   const result = validateFetchUrl('https://example.com/api');
 *   if (!result.safe) throw new Error('SSRF blocked: ' + result.reason);
 */

const { URL } = require('url');
const net = require('net');
const dns = require('dns');
// [审计轮 2026-11-02] 引擎自有本机服务白名单单一事实源（与 fetch-safe 共用）
const { isEngineLocalService } = require('./local-service-allow.js');

// [V-003] DNS resolution cache (60s TTL) to prevent DNS rebinding
const DNS_CACHE = new Map();
const DNS_CACHE_TTL = 60000; // 60 seconds
// [AUDIT-FIX 2026-11-02] DNS_CACHE 原有 TTL 定义但只读不清理——过期条目永留内存
// （fetch-safe.js live）。set 时顺带清过期项。
function _dnsCachePrune(now) {
  for (const [k, v] of DNS_CACHE) {
    if (now - v.ts > DNS_CACHE_TTL) DNS_CACHE.delete(k);
  }
}
const DNS_RESOLVE_TIMEOUT = 5000; // 5s timeout per lookup

// ─── Private / reserved IPv4 ranges ──────────────────────────────────────────

const BLOCKED_V4_RANGES = [
  { network: '127.0.0.0',    prefix: 8,  label: 'loopback (127.0.0.0/8)' },
  { network: '0.0.0.0',      prefix: 8,  label: 'current network (0.0.0.0/8)' },       // [v5.15.3 H-3]
  { network: '10.0.0.0',     prefix: 8,  label: 'private (10.0.0.0/8)' },
  { network: '172.16.0.0',   prefix: 12, label: 'private (172.16.0.0/12)' },
  { network: '192.168.0.0',  prefix: 16, label: 'private (192.168.0.0/16)' },
  { network: '169.254.0.0',  prefix: 16, label: 'link-local (169.254.0.0/16)' },
  // [v6.8.88] 审计补齐保留网段：CGNAT / TEST-NET / 基准测试 / 组播 / 保留 / 广播
  { network: '100.64.0.0',   prefix: 10, label: 'CGNAT (100.64.0.0/10)' },
  { network: '192.0.2.0',    prefix: 24, label: 'TEST-NET-1 (192.0.2.0/24)' },
  { network: '198.18.0.0',   prefix: 15, label: 'benchmark (198.18.0.0/15)' },
  { network: '198.51.100.0', prefix: 24, label: 'TEST-NET-2 (198.51.100.0/24)' },
  { network: '203.0.113.0',  prefix: 24, label: 'TEST-NET-3 (203.0.113.0/24)' },
  { network: '224.0.0.0',    prefix: 4,  label: 'multicast (224.0.0.0/4)' },
  { network: '240.0.0.0',    prefix: 4,  label: 'reserved (240.0.0.0/4)' },
  { network: '255.255.255.255', prefix: 32, label: 'broadcast (255.255.255.255/32)' },
];

// ─── Blocked IPv6 addresses ──────────────────────────────────────────────────

const BLOCKED_V6_ADDRESSES = [
  '::1',                    // IPv6 loopback
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert an IPv4 string to a 32-bit unsigned integer.
 * Returns null if the string is not a valid IPv4 address.
 */
function ip4ToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const octet = parseInt(parts[i], 10);
    if (isNaN(octet) || octet < 0 || octet > 255) return null;
    num = (num << 8) | octet;
  }
  return num >>> 0; // ensure unsigned
}

/**
 * Check if an IPv4 address falls into a blocked CIDR range.
 */
function isBlockedV4(ip) {
  const addr = ip4ToInt(ip);
  if (addr === null) return false; // not a valid IPv4

  for (const range of BLOCKED_V4_RANGES) {
    const netAddr = ip4ToInt(range.network);
    if (netAddr === null) continue;
    const mask = ~(2 ** (32 - range.prefix) - 1) >>> 0;
    if ((addr & mask) === (netAddr & mask)) {
      return { blocked: true, reason: `IP ${ip} is in ${range.label}` };
    }
  }

  return { blocked: false, reason: '' };
}

/**
 * Check if an IPv6 address is in the blocked list.
 * Returns { blocked: boolean, reason: string }.
 */
function isBlockedV6(ip) {
  // Normalize to lowercase for comparison
  const normalized = ip.toLowerCase();

  // Direct match against blocked list
  if (BLOCKED_V6_ADDRESSES.includes(normalized)) {
    return { blocked: true, reason: `IP ${ip} is IPv6 loopback` };
  }

  // Check for link-local IPv6 (fe80::/10)
  if (/^fe[89ab][0-9a-f]/i.test(normalized)) {
    return { blocked: true, reason: `IP ${ip} is IPv6 link-local (fe80::/10)` };
  }

  // [v5.15.3 H-3] Check for unique local IPv6 (fc00::/7)
  if (/^fc[0-9a-f][0-9a-f]/i.test(normalized) || /^fd[0-9a-f][0-9a-f]/i.test(normalized)) {
    return { blocked: true, reason: `IP ${ip} is IPv6 unique local (fc00::/7)` };
  }

  // [审计轮 2026-11-02] IPv4 嵌入型 IPv6 解包复走 V4 判定。
  // 漏网形态实测（修复前均 safe:true）：https://[::ffff:127.0.0.1]/、
  // https://[::ffff:169.254.169.254]/（云元数据）、https://[64:ff9b::7f00:1]/。
  // 覆盖三种前缀：::ffff:0:0/96（IPv4-mapped）、::/96（IPv4-compatible， deprecated）、
  // 64:ff9b::/96（NAT64 RFC6052）。展开失败的保守放行（net.isIPv6 已验过格式）。
  const _groups = _expandV6(normalized);
  if (_groups && _groups.length === 8) {
    const _last32 = `${(_groups[6] >> 8) & 255}.${_groups[6] & 255}.${(_groups[7] >> 8) & 255}.${_groups[7] & 255}`;
    const _isV4Mapped = _groups.slice(0, 5).every(g => g === 0) && _groups[5] === 0xffff;
    const _isV4Compat = _groups.slice(0, 6).every(g => g === 0); // ::/96（deprecated）
    const _isNat64 = _groups[0] === 0x64 && _groups[1] === 0xff9b && _groups.slice(2, 6).every(g => g === 0);
    if (_isV4Mapped || _isV4Compat || _isNat64) {
      const r = isBlockedV4(_last32);
      return r.blocked
        ? { blocked: true, reason: `IP ${ip} is IPv4-embedded IPv6 → ${r.reason}` }
        : { blocked: false, reason: '' };
    }
    // 64:ff9b 前缀但非标准 /96 编码（如 64:ff9b:1::/48 变体）——保守拦截，fail-closed
    if (_groups[0] === 0x64 && _groups[1] === 0xff9b) {
      return { blocked: true, reason: `IP ${ip} is non-standard NAT64 encoding (64:ff9b::/16), blocked fail-closed` };
    }
  }

  return { blocked: false, reason: '' };
}

/** 展开 IPv6 为 8 个 16 位组；失败返回 null（调用方已过 net.isIPv6，失败即异常格式） */
function _expandV6(ip) {
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const parse = (s) => (s ? s.split(':').filter(Boolean) : []);
  const head = parse(halves[0]);
  const tail = halves.length === 2 ? parse(halves[1]) : null;
  let groups;
  if (tail === null) {
    if (head.length !== 8) return null;
    groups = head;
  } else {
    const missing = 8 - head.length - tail.length;
    if (missing < 0) return null;
    groups = [...head, ...new Array(missing).fill('0'), ...tail];
  }
  const nums = groups.map(g => {
    if (!/^[0-9a-f]{1,4}$/i.test(g)) return NaN;
    return parseInt(g, 16);
  });
  return nums.some(Number.isNaN) ? null : nums;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * [V-003] Validate a fetch URL for SSRF safety — async with DNS resolution.
 *
 * For hostnames (not IPs), performs a dns.lookup to resolve the real IP,
 * then checks it against the blocked ranges. DNS results are cached for 60s.
 * Fail-closed: any DNS error or timeout → block the request.
 *
 * @param {string} urlStr — The URL to validate.
 * @returns {Promise<{ safe: boolean, reason: string }>}
 *   - safe: true if the URL is allowed (http/https, not internal IP)
 *   - reason: human-readable explanation when safe=false
 */
async function validateFetchUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return { safe: false, reason: 'URL is empty or not a string' };
  }

  // [B 先例维度 · 2026-11-02 审计轮] 引擎自有本机服务白名单。
  // 审计修复：原实现排在协议校验之前，ftp://127.0.0.1:8588 可返回 safe:true
  // （白名单不是协议后门）。现由 local-service-allow.js 单一事实源强制三条约束：
  // 仅 http/https、仅 IP 字面量、localhost 归一化——约束在模块内，与位置无关。
  // 与 fetch-safe 的 DNS pinning 豁免共用同一份名单，杜绝两处默认值漂移。
  if (isEngineLocalService(urlStr)) {
    return { safe: true, reason: 'engine-local-allow' };
  }

  // Parse the URL — throws on invalid input
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch (e) {
    return { safe: false, reason: `Invalid URL: ${e.message}` };
  }

  // Only allow http and https schemes
  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') {
    return { safe: false, reason: `Protocol "${parsed.protocol}" is not allowed (only http/https)` };
  }

  // [v5.17.2 D-006] 禁止http外部端点 — 仅localhost允许明文http
  if (scheme === 'http') {
    const h = parsed.hostname;
    const isLocalhost = h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.endsWith('.local');
    if (!isLocalhost) {
      return { safe: false, reason: 'HTTP is not allowed for external endpoints. Use HTTPS.' };
    }
  }

  // Get the hostname (without port), strip IPv6 brackets for IP checks
  let hostname = parsed.hostname;

  // Empty hostname — reject
  if (!hostname) {
    return { safe: false, reason: 'URL has no hostname' };
  }

  // Strip IPv6 brackets (e.g., "[::1]" → "::1") for net.isIPv6()
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // Determine if it's an IP address
  const isV4 = net.isIPv4(hostname);
  const isV6 = net.isIPv6(hostname);

  if (isV4) {
    const result = isBlockedV4(hostname);
    if (result.blocked) return { safe: false, reason: result.reason };
  }

  if (isV6) {
    const result = isBlockedV6(hostname);
    if (result.blocked) return { safe: false, reason: result.reason };
  }

  // Not an IP — it's a hostname. Check for DNS rebinding domains first.
  // [v5.15.3 H-3] Block known DNS rebinding / SSRF bypass services
  const hostnameLower = hostname.toLowerCase();
  const REBINDING_DOMAINS = [
    'nip.io', 'xip.io', 'sslip.io',             // wildcard DNS → any IP
    'lvh.me', 'localtest.me',                     // resolves to 127.0.0.1
    '1u.ms', '2u.ms',                             // short rebinding domains
  ];
  for (const rd of REBINDING_DOMAINS) {
    if (hostnameLower === rd || hostnameLower.endsWith('.' + rd)) {
      return { safe: false, reason: `Hostname "${hostname}" matches DNS rebinding domain "${rd}"` };
    }
  }

  // [V-003] DNS resolution — resolve hostname to IP and check blocked ranges
  // Fail-closed: any error or timeout → block
  const cached = DNS_CACHE.get(hostnameLower);
  if (cached && (Date.now() - cached.ts) < DNS_CACHE_TTL) {
    if (cached.blocked) {
      return { safe: false, reason: cached.reason };
    }
    return { safe: true, reason: '' };
  }

  let resolvedIp = null;
  try {
    resolvedIp = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('DNS lookup timeout')), DNS_RESOLVE_TIMEOUT);
      dns.lookup(hostname, { all: true }, (err, addresses) => {
        clearTimeout(timer);
        if (err) return reject(err);
        // addresses is an array of { address, family }
        resolve(addresses.map(a => a.address));
      });
    });
  } catch (e) {
    // [V-003] Fail-closed: any DNS error → block
    const reason = `DNS resolution failed for "${hostname}": ${e.message}`;
    DNS_CACHE.set(hostnameLower, { ts: Date.now(), blocked: true, reason });
    return { safe: false, reason };
  }

  // Check each resolved IP against blocked ranges
  for (const ip of resolvedIp) {
    const v4 = net.isIPv4(ip);
    const v6 = net.isIPv6(ip);
    if (v4) {
      const result = isBlockedV4(ip);
      if (result.blocked) {
        DNS_CACHE.set(hostnameLower, { ts: Date.now(), blocked: true, reason: result.reason });
        return { safe: false, reason: result.reason };
      }
    }
    if (v6) {
      const result = isBlockedV6(ip);
      if (result.blocked) {
        DNS_CACHE.set(hostnameLower, { ts: Date.now(), blocked: true, reason: result.reason });
        return { safe: false, reason: result.reason };
      }
    }
  }

  _dnsCachePrune(Date.now());
  DNS_CACHE.set(hostnameLower, { ts: Date.now(), blocked: false, reason: '' });
  return { safe: true, reason: '' };
}

module.exports = { validateFetchUrl, isBlockedV4 };
