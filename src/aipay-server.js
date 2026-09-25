#!/usr/bin/env node
/**
 * HeartFlow A2M 按量付费接入 — 本地启动器
 *
 * 这是给本地 / 沙箱使用的组合入口：加载沙箱凭据 → 启动带 402 支付的 API 服务。
 *
 * 用法：
 *   node src/aipay-server.js                 # 沙箱（默认读 .alipay-sandbox.json）
 *   node src/aipay-server.js --port 4318     # 指定端口
 *
 * 设计约束（沿用原 heartflow-api-server.js 的安全边界）：
 *   - 默认绑定 127.0.0.1，不对外暴露
 *   - 原有业务逻辑与成功响应完全保留，402 分支只在未支付时插入
 *   - 支付凭证（Payment-Proof）经 alipay.aipay.agent.payment.verify 验真
 *   - 履约回执经 alipay.aipay.agent.fulfillment.confirm 确认
 *   - 同一 out_trade_no 重试：已履约直接返回缓存结果，不重复扣费
 *   - orderRepository 必须绑定真实持久化；未绑定时明确失败，不回退内存订单
 *
 * 上线前替换：
 *   ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
 *   serviceId      = 服务市场注册后返回的真实 serviceId
 *   appId/privateKey/alipayPublicKey = 线上应用配置
 */

'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ─────────────────── 1. 沙箱 / 生产配置加载 ───────────────────

const PROJECT_ROOT = path.join(__dirname, '..');
const SANDBOX_FILE = path.join(PROJECT_ROOT, '.alipay-sandbox.json');

function loadSandboxConfig() {
  if (!fs.existsSync(SANDBOX_FILE)) {
    throw new Error(`沙箱配置不存在: ${SANDBOX_FILE}（请先运行 alipay-aipay Skill 的沙箱配置流程）`);
  }
  const raw = JSON.parse(fs.readFileSync(SANDBOX_FILE, 'utf8'));
  const app = raw.appIds && raw.appIds[0];
  if (!app || !app.appId) throw new Error('.alipay-sandbox.json 缺 appIds[0].appId');
  if (!app.appPrivatePkcsKey) throw new Error('.alipay-sandbox.json 缺 appIds[0].appPrivatePkcsKey');
  return {
    appId: app.appId,
    sellerId: app.pid,                    // 商家 2088 账号
    privateKey: app.appPrivatePkcsKey,    // PKCS#1 裸 Base64
    alipayPublicKey: app.alipayPublicKey,
    buyerUserId: raw.sandboxAccounts && raw.sandboxAccounts.user
      ? raw.sandboxAccounts.user.userId : null,
  };
}

const IS_SANDBOX = process.env.ALIPAY_GATEWAY
  ? process.env.ALIPAY_GATEWAY.includes('sandbox')
  : true;

const sandbox = loadSandboxConfig();

const AIPAY = {
  appId: process.env.AIPAY_APP_ID || sandbox.appId,
  sellerId: process.env.AIPAY_SELLER_ID || sandbox.sellerId,
  privateKey: process.env.AIPAY_APP_PRIVATE_PKCS_KEY || sandbox.privateKey,
  alipayPublicKey: process.env.AIPAY_ALIPAY_PUBLIC_KEY || sandbox.alipayPublicKey,
  // 沙箱联调用 api_mock_service_id；生产用服务市场注册后返回的真实 serviceId
  serviceId: process.env.AIPAY_SERVICE_ID || 'api_mock_service_id',
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
};

if (!IS_SANDBOX && AIPAY.serviceId === 'api_mock_service_id') {
  throw new Error('生产网关禁止使用沙箱 serviceId=api_mock_service_id，请设置 AIPAY_SERVICE_ID');
}

// ─────────────────── 2. 业务侧：沿用原判别逻辑 ───────────────────

const { checkOutput, checkInput, runPipeline } = require('./gate.js');

// 受收费保护的资源：未支付返回 402，已支付返回资源内容
const PAID_RESOURCES = {
  '/v1/check/output': {
    method: 'POST',
    price: process.env.AIPAY_PRICE || '0.01',
    goodsName: 'HeartFlow 输出判别',
    handler: async (body) => {
      const { text, mode = 'fast' } = body;
      if (!text) return { error: 'text required' };
      const t0 = Date.now();
      const out = mode === 'deep' ? runPipeline({ input: text, mode: 'deep' }) : checkOutput(text);
      const ms = Date.now() - t0;
      return {
        ok: true, ms,
        gate: out.gate, verdict: out.verdict,
        overallScore: out.overallScore,
        findings: (out.findings || []).slice(0, 20),
      };
    },
  },
};

const FREE_RESOURCES = {
  '/health': {
    method: 'GET',
    handler: async () => ({ ok: true, ts: Date.now() }),
  },
};

// ─────────────────── 3. 订单仓储（必须绑定真实持久化） ───────────────────

let orderRepository = null;

function configureOrderRepository(repo) {
  const required = ['createPending', 'findByOutTradeNo', 'prepareFulfillment', 'markFulfilled'];
  if (!repo || required.some(n => typeof repo[n] !== 'function')) {
    throw new Error(`orderRepository 必须实现 ${required.join(', ')}`);
  }
  orderRepository = repo;
}

function requireRepo() {
  if (!orderRepository) throw new Error('尚未绑定 orderRepository，禁止回退内存订单');
  return orderRepository;
}

// 默认提供文件持久化实现（本地/沙箱够用；生产请换成数据库 + 唯一约束）
const FILE_REPO_DIR = process.env.AIPAY_ORDER_DIR || path.join(PROJECT_ROOT, 'data', 'aipay-orders');

function fileOrderRepository() {
  fs.mkdirSync(FILE_REPO_DIR, { recursive: true });
  const p = (no) => path.join(FILE_REPO_DIR, `${no}.json`);
  const read = (no) => fs.existsSync(p(no)) ? JSON.parse(fs.readFileSync(p(no), 'utf8')) : null;
  const write = (o) => fs.writeFileSync(p(o.outTradeNo), JSON.stringify(o, null, 2), { mode: 0o600 });

  return {
    async createPending(order) { write(order); },
    async findByOutTradeNo(no) { return read(no); },
    async prepareFulfillment({ outTradeNo, tradeNo, expectedAmount, expectedResourceId, createResource }) {
      const o = read(outTradeNo);
      if (!o) throw new Error('ORDER_NOT_FOUND');
      if (o.fulfillStatus === 'FULFILLED') {
        return { state: 'FULFILLED', serviceResult: o.serviceResult };
      }
      if (o.fulfillStatus === 'PENDING_CONFIRM') {
        return { state: 'PENDING_CONFIRM', serviceResult: o.serviceResult };
      }
      if (o.fulfillStatus !== 'UNFULFILLED') throw new Error('ORDER_STATE_INVALID');
      const serviceResult = await createResource();
      o.fulfillStatus = 'PENDING_CONFIRM';
      o.serviceResult = serviceResult;
      o.tradeNo = tradeNo;
      o.verifiedAmount = expectedAmount;
      o.verifiedResourceId = expectedResourceId;
      write(o);
      return { state: 'PENDING_CONFIRM', serviceResult };
    },
    async markFulfilled(outTradeNo, tradeNo) {
      const o = read(outTradeNo);
      if (!o) throw new Error('ORDER_NOT_FOUND');
      o.fulfillStatus = 'FULFILLED';
      o.orderStatus = 'PAID';
      o.tradeNo = tradeNo;
      o.fulfilledAt = new Date().toISOString();
      write(o);
    },
  };
}

configureOrderRepository(fileOrderRepository());

// ─────────────────── 4. A2M 协议工具 ───────────────────

function base64UrlEncode(str) {
  return Buffer.from(str, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function base64UrlDecode(str) {
  let s = str;
  while (s.length % 4) s += '=';
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
function formatISO8601WithTimezone(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    + `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
function normalizeAmount(v) {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(v ?? '').trim());
  if (!m) return null;
  return `${BigInt(m[1]).toString()}.${(m[2] || '').padEnd(2, '0')}`;
}
function amountsEqual(a, b) {
  const x = normalizeAmount(a), y = normalizeAmount(b);
  return x !== null && y !== null && x === y;
}

/** 商家签名：裸 PKCS#1 Base64 → DER → RSA-SHA256 */
function generateSellerSignature(params, privateKeyBase64) {
  const keys = Object.keys(params).sort();
  const content = keys
    .filter(k => params[k] !== null && params[k] !== '')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  const key = crypto.createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'), format: 'der', type: 'pkcs1',
  });
  return crypto.createSign('RSA-SHA256').update(content, 'utf8').sign(key, 'base64');
}

// ─────────────────── 5. 支付宝开放平台调用（零依赖，直接用 HTTPS 直连） ───────────────────

/**
 * 调用支付宝开放平台接口（sandbox/prod 由 AIPAY.gateway 决定）。
 * 使用 alg:// 形式传参 + RSA2 签名，无需 alipay-sdk 依赖。
 */
async function alipayExec(method, bizContent) {
  const https = require('https');
  const { URL } = require('url');
  // 支付宝开放平台要求 timestamp 为 yyyy-MM-dd HH:mm:ss（无时区后缀）
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    + ` ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const params = {
    app_id: AIPAY.appId,
    method,
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp,
    version: '1.0',
    biz_content: JSON.stringify(bizContent),
  };
  // 按字典序拼接待签名串
  const signContent = Object.keys(params).sort()
    .map(k => `${k}=${params[k]}`).join('&');
  const key = crypto.createPrivateKey({
    key: Buffer.from(AIPAY.privateKey, 'base64'), format: 'der', type: 'pkcs1',
  });
  const sign = crypto.createSign('RSA-SHA256').update(signContent, 'utf8').sign(key, 'base64');
  params.sign = sign;

  const body = Object.keys(params).map(k =>
    `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');

  return new Promise((resolve, reject) => {
    const u = new URL(AIPAY.gateway);
    const req = https.request({
      hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded',
                 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000,
    }, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(`响应非 JSON: ${d.slice(0,200)}`)); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('支付宝接口超时')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** 解包 SDK 风格嵌套响应 */
function unwrap(resp, method) {
  const key = method.replace(/\./g, '_') + '_response';
  const data = resp[key] || resp;
  if (process.env.A2M_DEBUG === 'true') {
    console.log(`[alipayExec] ${method} -> code=${data.code} sub_code=${data.sub_code || ''} msg=${(data.msg || '').slice(0, 60)}`);
  }
  return data;
}

// ─────────────────── 6. 402 协议：账单 / 验付 / 履约 ───────────────────

async function create402(req, res, resourceId) {
  const cfg = PAID_RESOURCES[resourceId];
  try {
    const outTradeNo = `HF_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const amount = normalizeAmount(cfg.price);
    const currency = 'CNY';
    const goodsName = cfg.goodsName;
    const payBeforeStr = formatISO8601WithTimezone(new Date(Date.now() + 30 * 60 * 1000));

    const sellerSignature = generateSellerSignature({
      amount, currency,
      goods_name: goodsName,
      out_trade_no: outTradeNo,
      pay_before: payBeforeStr,
      resource_id: resourceId,
      seller_id: AIPAY.sellerId,
      service_id: AIPAY.serviceId,
    }, AIPAY.privateKey);

    await requireRepo().createPending({
      outTradeNo, amount, currency, resourceId, goodsName,
      payBefore: payBeforeStr, orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });

    const paymentNeeded = {
      protocol: {
        out_trade_no: outTradeNo, amount, currency,
        resource_id: resourceId, pay_before: payBeforeStr,
        seller_signature: sellerSignature,
        seller_sign_type: 'RSA2',
        seller_unique_id: AIPAY.sellerId,
        service_id: AIPAY.serviceId,
      },
      method: {
        seller_name: 'HeartFlow',
        seller_id: AIPAY.sellerId,
        seller_app_id: AIPAY.appId,
        goods_name: goodsName,
        seller_unique_id_key: 'seller_id',
        service_id: AIPAY.serviceId,
      },
    };

    res.setHeader('Payment-Needed', base64UrlEncode(JSON.stringify(paymentNeeded)));
    res.writeHead(402, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      code: 'Payment-Needed', message: `需要支付 ${amount} ${currency} 以访问资源`,
      out_trade_no: outTradeNo, amount, currency, goods_name: goodsName,
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ code: 'CREATE_ORDER_ERROR', message: e.message }));
  }
}

async function verifyAndDeliver(req, res, resourceId, paymentProof) {
  const cfg = PAID_RESOURCES[resourceId];
  let proof;
  try {
    proof = JSON.parse(base64UrlDecode(paymentProof));
  } catch (_) {
    return create402(req, res, resourceId);
  }
  const paymentProofValue = proof.protocol && proof.protocol.payment_proof;
  const tradeNo = proof.protocol && proof.protocol.trade_no;
  const clientSession = proof.method && proof.method.client_session;
  if (!paymentProofValue || !tradeNo) return create402(req, res, resourceId);

  try {
    const biz = { payment_proof: paymentProofValue, trade_no: tradeNo };
    if (clientSession) biz.client_session = clientSession;
    const verifyResp = unwrap(await alipayExec('alipay.aipay.agent.payment.verify', biz),
                              'alipay.aipay.agent.payment.verify');

    if (verifyResp.code !== '10000' && verifyResp.code !== 10000) {
      console.error('[验付失败]', verifyResp.sub_code || verifyResp.code, verifyResp.sub_msg || verifyResp.msg);
      return create402(req, res, resourceId);
    }

    const rTradeNo = verifyResp.trade_no || verifyResp.tradeNo || '';
    const rOutTradeNo = verifyResp.out_trade_no || verifyResp.outTradeNo || '';
    const rAmount = verifyResp.amount;
    const rResourceId = verifyResp.resource_id || verifyResp.resourceId || '';
    const active = verifyResp.active;

    const repo = requireRepo();
    const order = rOutTradeNo ? await repo.findByOutTradeNo(rOutTradeNo) : null;
    // 沙箱字段可能为空串，允许按本地订单回填；生产必须强校验
    const isSandbox = AIPAY.gateway.includes('sandbox');
    const vTradeNo = rTradeNo || (isSandbox ? tradeNo : '');
    const vAmount = rAmount || (isSandbox && order ? order.amount : '');
    const vResourceId = rResourceId || (isSandbox && order ? order.resourceId : '');

    if (active !== true || !vTradeNo || vTradeNo !== tradeNo || !rOutTradeNo || !vResourceId) {
      console.error('[验付拒绝]', { vTradeNo, tradeNo, rOutTradeNo, vResourceId, active });
      return create402(req, res, resourceId);
    }
    if (!order || !amountsEqual(order.amount, vAmount) || order.resourceId !== vResourceId) {
      console.error('[订单不匹配]', { order: order && order.outTradeNo, vAmount, vResourceId });
      return create402(req, res, resourceId);
    }

    // 履约（幂等）：已履约直接返回；首次生成资源 → 发履约回执 → 标记
    const body = await readBody(req);
    const fulfillment = await repo.prepareFulfillment({
      outTradeNo: rOutTradeNo, tradeNo: vTradeNo,
      expectedAmount: normalizeAmount(vAmount), expectedResourceId: vResourceId,
      createResource: () => cfg.handler(body),
    });

    if (!fulfillment || !['PENDING_CONFIRM', 'FULFILLED'].includes(fulfillment.state)) {
      throw new Error('prepareFulfillment 未返回已持久化的履约结果');
    }
    const serviceResult = fulfillment.serviceResult;

    const alreadyFulfilled = fulfillment.state === 'FULFILLED';
    let confirmResult = alreadyFulfilled;
    if (!alreadyFulfilled) {
      const confirmResp = unwrap(
        await alipayExec('alipay.aipay.agent.fulfillment.confirm', { trade_no: vTradeNo }),
        'alipay.aipay.agent.fulfillment.confirm');
      if (confirmResp.code !== '10000' && confirmResp.code !== 10000) {
        // 资源已生成但回执失败：允许用同一 Payment-Proof 重试，不重复扣费
        res.writeHead(502, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          code: 'FULFILLMENT_CONFIRM_FAILED',
          message: '资源已生成但履约确认失败，请使用同一 Payment-Proof 重试',
          sub_code: confirmResp.sub_code || confirmResp.code,
        }));
      }
      confirmResult = true;
      await repo.markFulfilled(rOutTradeNo, vTradeNo);
    }

    res.setHeader('Payment-Validation', base64UrlEncode(JSON.stringify({
      trade_no: vTradeNo, out_trade_no: rOutTradeNo, validated: true, resource_id: vResourceId,
    })));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      resource_id: vResourceId,
      content: serviceResult,
      trade_no: vTradeNo, out_trade_no: rOutTradeNo,
      already_fulfilled: alreadyFulfilled,
      fulfillment_confirmed: confirmResult,
    }));
  } catch (e) {
    console.error('[验付异常]', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ code: 'VERIFY_FAILED', message: e.message }));
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (_) { resolve({}); } });
  });
}

// ─────────────────── 7. HTTP 服务 ───────────────────

const PORT = Number(process.argv.includes('--port')
  ? process.argv[process.argv.indexOf('--port') + 1] : process.env.PORT) || 4318;
const HOST = '127.0.0.1';

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Payment-Proof');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const resourceId = url.pathname;
  const free = FREE_RESOURCES[resourceId];
  const paid = PAID_RESOURCES[resourceId];

  try {
    // 免费端点（/health）
    if (free && (free.method === 'GET' ? req.method === 'GET' : req.method === 'POST')) {
      const body = req.method === 'GET' ? {} : await readBody(req);
      const out = await free.handler(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(out));
    }

    // 付费端点：402 协议
    if (paid && req.method === paid.method) {
      const proof = req.headers['payment-proof'];
      if (!proof || proof.trim() === '') return await create402(req, res, resourceId);
      return await verifyAndDeliver(req, res, resourceId, proof.trim());
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'not found',
      paths: Object.keys(FREE_RESOURCES).concat(Object.keys(PAID_RESOURCES)),
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: e.message }));
  }
}).listen(PORT, HOST, () => {
  console.log(`HeartFlow A2M 服务已启动: http://${HOST}:${PORT}`);
  console.log(`网关: ${AIPAY.gateway}`);
  console.log(`serviceId: ${AIPAY.serviceId}${AIPAY.serviceId === 'api_mock_service_id' ? '（沙箱联调用，上线前必须替换）' : ''}`);
  console.log('端点:');
  console.log('  GET  /health           免费');
  console.log('  POST /v1/check/output  付费 ' + (PAID_RESOURCES['/v1/check/output'].price) + ' CNY/次');
  console.log('');
  console.log('测试: curl -i -X POST http://127.0.0.1:' + PORT + '/v1/check/output -H "Content-Type: application/json" -d \'{"text":"毫无疑问这是唯一正确的解决方案"}\'');
});
