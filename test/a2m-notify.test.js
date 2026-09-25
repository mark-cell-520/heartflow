#!/usr/bin/env node
/**
 * 异步通知模块测试 —— 覆盖官方要求的验签/幂等/字段校验/回写/补偿查询。
 * 不依赖真实支付宝，用本地生成的密钥对验签。
 */

'use strict';

const assert = require('assert');
const crypto = require('crypto');
const { verifyNotifySign, handleNotify, queryTrade, TRADE_FINAL_STATUS } = require('../src/a2m-notify.js');

// ── 生成一对测试用 RSA 密钥 ──
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** 模拟支付宝：用"支付宝私钥"给参数签名（对应验签方用支付宝公钥） */
function signAsAlipay(params) {
  const content = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] !== null && params[k] !== undefined)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return crypto.createSign('RSA-SHA256').update(content, 'utf8').sign(privateKey, 'base64');
}

/** 造一个内存 orderRepository */
function makeRepo(initial) {
  const orders = new Map();
  if (initial) orders.set(initial.outTradeNo, { ...initial });
  return {
    orders,
    async createPending(o) { orders.set(o.outTradeNo, { ...o }); },
    async findByOutTradeNo(no) { const o = orders.get(no); return o ? { ...o } : null; },
    async updateOrder(o) { orders.set(o.outTradeNo, { ...o }); },
    async prepareFulfillment() { throw new Error('not used'); },
    async markFulfilled() { throw new Error('not used'); },
  };
}

const BASE = {
  out_trade_no: 'HF_TEST_001',
  trade_no: '20260925008281003521050000005709',
  total_amount: '0.01',
  trade_status: 'TRADE_SUCCESS',
};

let passed = 0;
function ok(name) { console.log(`  ✅ ${name}`); passed++; }

(async () => {
  // ── 1. 验签：合法签名通过 ──
  {
    const params = { ...BASE };
    const sign = signAsAlipay(params);
    assert.strictEqual(verifyNotifySign(params, sign, publicKey), true);
    ok('验签：合法 RSA2 签名通过');
  }

  // ── 2. 验签：篡改金额后拒绝 ──
  {
    const params = { ...BASE };
    const sign = signAsAlipay(params);
    const tampered = { ...params, total_amount: '100.00' };
    assert.strictEqual(verifyNotifySign(tampered, sign, publicKey), false);
    ok('验签：金额被篡改后拒绝');
  }

  // ── 3. 验签：空 sign 拒绝 ──
  {
    assert.strictEqual(verifyNotifySign({ ...BASE }, '', publicKey), false);
    ok('验签：空签名拒绝');
  }

  // ── 4. 验签：错误公钥拒绝 ──
  {
    const other = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).publicKey;
    const sign = signAsAlipay({ ...BASE });
    assert.strictEqual(verifyNotifySign({ ...BASE }, sign, other), false);
    ok('验签：非配对公钥拒绝');
  }

  // ── 5. 验签：裸 Base64 公钥（无 PEM 头）也接受 ──
  {
    const bare = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s+/g, '');
    const sign = signAsAlipay({ ...BASE });
    assert.strictEqual(verifyNotifySign({ ...BASE }, sign, bare), true);
    ok('验签：裸 Base64 公钥自动补 PEM 头');
  }

  // ── 6. handleNotify：正常入账 ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      resourceId: '/v1/check/output', orderStatus: 'PENDING_PAYMENT',
      fulfillStatus: 'UNFULFILLED',
    });
    const params = { ...BASE, sign: signAsAlipay({ ...BASE }) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'success');
    const o = await repo.findByOutTradeNo('HF_TEST_001');
    assert.strictEqual(o.orderStatus, 'PAID');
    assert.strictEqual(o.tradeNo, BASE.trade_no);
    assert.strictEqual(o.paidVia, 'async_notify');
    ok('handleNotify：验签通过后正确入账');
  }

  // ── 7. handleNotify：金额不符拒绝 ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '9.99', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const params = { ...BASE, sign: signAsAlipay({ ...BASE }) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'failure');
    assert.match(r.reason, /amount mismatch/);
    const o = await repo.findByOutTradeNo('HF_TEST_001');
    assert.strictEqual(o.orderStatus, 'PENDING_PAYMENT');  // 未被篡改
    ok('handleNotify：金额与本地订单不符时拒绝且不改状态');
  }

  // ── 8. handleNotify：非终态跳过但不报复 ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const p = { ...BASE, trade_status: 'WAIT_BUYER_PAY' };
    const params = { ...p, sign: signAsAlipay(p) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'success');
    assert.match(r.reason, /non-final/);
    const o = await repo.findByOutTradeNo('HF_TEST_001');
    assert.strictEqual(o.orderStatus, 'PENDING_PAYMENT');
    ok('handleNotify：WAIT_BUYER_PAY 非终态不入账但回 success');
  }

  // ── 9. handleNotify：幂等（重复推送不重复入账）──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PAID', tradeNo: 'OLD_999', fulfillStatus: 'FULFILLED',
    });
    const params = { ...BASE, sign: signAsAlipay({ ...BASE }) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'success');
    assert.match(r.reason, /idempotent/);
    const o = await repo.findByOutTradeNo('HF_TEST_001');
    assert.strictEqual(o.tradeNo, 'OLD_999');  // 没被覆盖
    ok('handleNotify：已入账订单重复通知返回幂等，不覆盖原 tradeNo');
  }

  // ── 10. handleNotify：未知订单回 success 但不入账 ──
  {
    const repo = makeRepo(null);
    const params = { ...BASE, out_trade_no: 'HF_UNKNOWN_999', sign: signAsAlipay({ ...BASE, out_trade_no: 'HF_UNKNOWN_999' }) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'success');   // 停止支付宝重试
    assert.match(r.reason, /not found locally/);
    ok('handleNotify：本地无此订单时回 success 止损但不入账');
  }

  // ── 11. handleNotify：坏签名直接 failure ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const params = { ...BASE, sign: 'AAAA' + signAsAlipay({ ...BASE }) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'failure');
    assert.match(r.reason, /sign verify failed/);
    ok('handleNotify：验签失败返回 failure 且不改状态');
  }

  // ── 12. handleNotify：缺失关键字段 ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const p = { ...BASE, trade_no: '' };
    const params = { ...p, sign: signAsAlipay(p) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'failure');
    assert.match(r.reason, /missing/);
    ok('handleNotify：trade_no 缺失时拒绝');
  }

  // ── 13. handleNotify：不支持的 sign_type ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const p = { ...BASE, sign_type: 'RSA' };
    const params = { ...p, sign: signAsAlipay({ ...BASE }) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'failure');
    assert.match(r.reason, /unsupported sign_type/);
    ok('handleNotify：非 RSA2 签名类型拒绝');
  }

  // ── 14. queryTrade：终态且本地未入账 → 建议补账 ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const r = await queryTrade({
      outTradeNo: 'HF_TEST_001', repo,
      alipayExec: async () => ({
        alipay_trade_query_response: {
          code: '10000', trade_status: 'TRADE_SUCCESS',
          trade_no: '2026092522001421050509471487', total_amount: '0.01',
        },
      }),
    });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.final, true);
    assert.strictEqual(r.shouldReconcile, true);
    ok('queryTrade：终态 + 本地未入账 + 金额一致 → 标记需补账');
  }

  // ── 15. queryTrade：本地已入账 → 不补账 ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PAID', fulfillStatus: 'FULFILLED',
    });
    const r = await queryTrade({
      outTradeNo: 'HF_TEST_001', repo,
      alipayExec: async () => ({
        alipay_trade_query_response: {
          code: '10000', trade_status: 'TRADE_SUCCESS',
          trade_no: 'X', total_amount: '0.01',
        },
      }),
    });
    assert.strictEqual(r.shouldReconcile, false);
    ok('queryTrade：本地已入账则不重复补账');
  }

  // ── 16. queryTrade：查询接口报错 ──
  {
    const r = await queryTrade({
      outTradeNo: 'HF_TEST_001', repo: makeRepo(null),
      alipayExec: async () => ({
        alipay_trade_query_response: { code: '40004', sub_code: 'ISV_UNKNOWN', sub_msg: '系统繁忙' },
      }),
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.code, 'ISV_UNKNOWN');
    ok('queryTrade：接口错误时返回错误码不抛异常');
  }

  // ── 17. TRADE_FINISHED 也应入账 ──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.01', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const p = { ...BASE, trade_status: 'TRADE_FINISHED' };
    const params = { ...p, sign: signAsAlipay(p) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'success');
    const o = await repo.findByOutTradeNo('HF_TEST_001');
    assert.strictEqual(o.orderStatus, 'PAID');
    ok('handleNotify：TRADE_FINISHED（退款关闭的终态）也正确入账');
  }

  // ── 18. 金额格式归一化（0.1 vs 0.10）──
  {
    const repo = makeRepo({
      outTradeNo: 'HF_TEST_001', amount: '0.10', currency: 'CNY',
      orderStatus: 'PENDING_PAYMENT', fulfillStatus: 'UNFULFILLED',
    });
    const p = { ...BASE, total_amount: '0.1' };
    const params = { ...p, sign: signAsAlipay(p) };
    const r = await handleNotify({ params, repo, alipayExec: async () => ({}), alipayPublicKey: publicKey });
    assert.strictEqual(r.ack, 'success');
    ok('handleNotify：0.1 与 0.10 视为等额（格式归一化）');
  }

  assert.ok(TRADE_FINAL_STATUS.has('TRADE_SUCCESS'));
  assert.ok(TRADE_FINAL_STATUS.has('TRADE_FINISHED'));
  assert.ok(!TRADE_FINAL_STATUS.has('WAIT_BUYER_PAY'));

  console.log(`\n=== ${passed} passed, 0 failed ===`);
})().catch(e => {
  console.error(`\n❌ ${e.message}`);
  process.exit(1);
});
