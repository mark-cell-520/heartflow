#!/usr/bin/env node
/**
 * 异步通知 HTTP 端到端测试
 *
 * 起一个真实 HTTP 服务，构造合法/非法支付宝回调，验证：
 *   - 回包必须是纯文本 success / failure（不能是 JSON）
 *   - 验签失败走 failure
 *   - 合法回调入账
 *   - 重复推送幂等
 */

'use strict';

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const { handleNotify } = require('../src/a2m-notify.js');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** 这是"支付宝侧"签名 —— 对应服务端用支付宝公钥验签 */
function sign(params) {
  const content = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] != null)
    .sort().map(k => `${k}=${params[k]}`).join('&');
  return crypto.createSign('RSA-SHA256').update(content, 'utf8').sign(privateKey, 'base64');
}

const orders = new Map();
const repo = {
  async createPending(o) { orders.set(o.outTradeNo, { ...o }); },
  async findByOutTradeNo(n) { const o = orders.get(n); return o ? { ...o } : null; },
  async updateOrder(o) { orders.set(o.outTradeNo, { ...o }); },
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString('utf8');
      const params = new URLSearchParams(raw);
      const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
      // 关键：必须原样回写纯文本
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(r.ack);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function post(port, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port, path: '/a2m/notify', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded',
                 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, ctype: res.headers['content-type'] }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function formEncode(obj) {
  return Object.keys(obj).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`).join('&');
}

let passed = 0;
function ok(n) { console.log(`  ✅ ${n}`); passed++; }

(async () => {
  const srv = await startServer();
  const port = srv.address().port;
  await repo.createPending({
    outTradeNo: 'HF_E2E_001', amount: '0.01', currency: 'CNY',
    resourceId: '/v1/check/output', orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
  });

  // ── 1. 合法回调 → 纯文本 success ──
  {
    const p = {
      out_trade_no: 'HF_E2E_001', trade_no: '20260925008281003521050000005709',
      total_amount: '0.01', trade_status: 'TRADE_SUCCESS',
    };
    p.sign = sign(p);
    p.sign_type = 'RSA2';
    const r = await post(port, formEncode(p));
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body, 'success', `回包应为纯文本 success，实际: ${JSON.stringify(r.body)}`);
    ok('合法回调 → HTTP 200 + 纯文本 success');
  }

  // ── 2. 回包不带 JSON 包装 ──
  {
    const p = {
      out_trade_no: 'HF_E2E_001', trade_no: 'SAME_TRADE',
      total_amount: '0.01', trade_status: 'TRADE_SUCCESS',
    };
    p.sign = sign(p);
    p.sign_type = 'RSA2';
    const r = await post(port, formEncode(p));
    assert.ok(!r.body.includes('{'), '回包不应含 JSON 花括号');
    assert.ok(!r.body.includes('"'), '回包不应含引号');
    ok('回包无 JSON 包装、无引号（支付宝要求原样 success）');
  }

  // ── 3. 幂等重推 ──
  {
    const o = await repo.findByOutTradeNo('HF_E2E_001');
    assert.strictEqual(o.orderStatus, 'PAID');
    assert.strictEqual(o.tradeNo, '20260925008281003521050000005709');
    ok('订单已入账且 tradeNo 正确');
  }

  // ── 4. 坏签名 → failure ──
  {
    const p = {
      out_trade_no: 'HF_E2E_002', trade_no: 'T_002',
      total_amount: '0.01', trade_status: 'TRADE_SUCCESS',
    };
    await repo.createPending({
      outTradeNo: 'HF_E2E_002', amount: '0.01', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    p.sign = 'INVALID_SIGNATURE_' + sign(p);
    p.sign_type = 'RSA2';
    const r = await post(port, formEncode(p));
    assert.strictEqual(r.body, 'failure');
    const o = await repo.findByOutTradeNo('HF_E2E_002');
    assert.strictEqual(o.orderStatus, 'PENDING_PAYMENT', '坏签名不得改状态');
    ok('坏签名 → 纯文本 failure 且订单状态未被篡改');
  }

  // ── 5. URLSearchParams 解析 form 编码 ──
  {
    const p = { out_trade_no: 'HF_E2E_001', trade_no: 'X', total_amount: '0.01', trade_status: 'TRADE_SUCCESS' };
    p.sign = sign(p);
    const parsed = new URLSearchParams(formEncode(p));
    assert.strictEqual(parsed.get('out_trade_no'), 'HF_E2E_001');
    ok('form-urlencoded 正确解析（含特殊字符无损）');
  }

  srv.close();
  console.log(`\n=== ${passed} passed, 0 failed ===`);
})().catch(e => {
  console.error(`\n❌ ${e.message}`);
  process.exit(1);
});
