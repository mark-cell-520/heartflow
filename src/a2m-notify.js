#!/usr/bin/env node
/**
 * 支付宝异步通知（notify_url）接收服务
 *
 * 背景：AI 按量付费的异步通知是官方上线的必做项。当前 aipay-server.js 的
 * 订单状态由「验付 + 履约」同步链路推进；本服务补上异步侧的对账能力，
 * 处理「同步链路中断、但用户已完成支付」的情况。
 *
 * 官方要求的四件事，本文件全做：
 *   1. 验签   —— RSA2 验签，公钥取自 AIPAY_ALIPAY_PUBLIC_KEY
 *   2. 幂等   —— 同一通知重复推送不重复入账
 *   3. 字段校验 —— out_trade_no / trade_no / trade_status / 金额
 *   4. 回写   —— 通过返回 "success" 告知支付宝已处理
 *   5. 补偿查询 —— 通知丢失时主动查 alipay.trade.query
 *
 * 挂载方式（在 aipay-server.js 里）：
 *   const { setupNotifyEndpoint } = require('./a2m-notify.js');
 *   setupNotifyEndpoint(httpServer, { repo: requireRepo(), alipayExec });
 *
 * 安全边界：
 *   - 验签失败一律返回 failure，不做任何状态变更
 *   - 不信任通知里的任何金额，一律以本地订单为准核对
 *   - trade_status 必须是终态（TRADE_SUCCESS / TRADE_FINISHED）才入账
 */

'use strict';

const crypto = require('crypto');

/** 支付宝要求商家回写的成功字样（注意：是小写 success，无引号无换行） */
const ACK_SUCCESS = 'success';
const ACK_FAILURE = 'failure';

/** 支付的终态。其他中间态（WAIT_BUYER_PAY 等）不触发入账 */
const TRADE_FINAL_STATUS = new Set(['TRADE_SUCCESS', 'TRADE_FINISHED']);

/**
 * RSA2 验签
 *
 * @param {Object} params 支付宝回调参数（已剔除 sign 与 sign_type）
 * @param {string} sign   回调带来的签名字符串
 * @param {string} alipayPublicKeyPem 支付宝公钥（PEM）
 * @returns {boolean}
 */
function verifyNotifySign(params, sign, alipayPublicKeyPem) {
  // 1. 按 key 字典序拼接待验签串，空值参数不参与
  const content = Object.keys(params)
    .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(content, 'utf8');

  const key = alipayPublicKeyPem.includes('-----BEGIN')
    ? alipayPublicKeyPem
    : `-----BEGIN PUBLIC KEY-----\n${alipayPublicKeyPem}\n-----END PUBLIC KEY-----`;

  try {
    return verifier.verify(key, sign, 'base64');
  } catch (e) {
    // 公钥格式错误等情况，一律视为验签失败
    return false;
  }
}

/**
 * 处理一条异步通知
 *
 * @param {Object} opts
 * @param {URLSearchParams|Object} opts.params 回调参数
 * @param {Object} opts.repo     orderRepository
 * @param {Function} opts.alipayExec 支付宝调用函数（补偿查询用）
 * @param {string} opts.alipayPublicKey 支付宝公钥
 * @returns {Promise<{ack: string, reason?: string, compensated?: boolean}>}
 */
async function handleNotify({ params, repo, alipayExec, alipayPublicKey }) {
  // URLSearchParams 或普通对象都接受
  const p = params instanceof URLSearchParams ? Object.fromEntries(params) : { ...params };

  const sign = p.sign || '';
  const signType = p.sign_type || 'RSA2';

  // ── 1. 验签 ──
  if (signType !== 'RSA2') {
    return { ack: ACK_FAILURE, reason: `unsupported sign_type: ${signType}` };
  }
  const signParams = { ...p };
  delete signParams.sign;
  delete signParams.sign_type;

  if (!verifyNotifySign(signParams, sign, alipayPublicKey)) {
    return { ack: ACK_FAILURE, reason: 'sign verify failed' };
  }

  // ── 2. 关键字段存在性 ──
  const outTradeNo = p.out_trade_no || '';
  const tradeNo = p.trade_no || '';
  const tradeStatus = p.trade_status || '';
  const notifyAmount = p.total_amount || p.buyer_pay_amount || '';

  if (!outTradeNo || !tradeNo) {
    return { ack: ACK_FAILURE, reason: 'missing out_trade_no or trade_no' };
  }

  // ── 3. 找到本地订单 ──
  const order = await repo.findByOutTradeNo(outTradeNo);
  if (!order) {
    // 本地没有这个单。可能是别家服务的通知，也可能是本地数据丢失。
    // 回 success 避免支付宝重试轰炸，但记录待人工核查。
    console.warn(`[notify] 本地无此订单: out_trade_no=${outTradeNo}（可能是外部通知）`);
    return { ack: ACK_SUCCESS, reason: 'order not found locally (ack to stop retries)' };
  }

  // ── 4. 幂等：已入账直接 ack ──
  if (order.orderStatus === 'PAID') {
    console.log(`[notify] 订单已入账，幂等返回: out_trade_no=${outTradeNo}`);
    return { ack: ACK_SUCCESS, reason: 'already paid (idempotent)' };
  }

  // ── 5. 金额核对（以本地订单为准，不信任通知金额）──
  const norm = (v) => {
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(v || '').trim());
    return m ? `${BigInt(m[1]).toString()}.${(m[2] || '').padEnd(2, '0')}` : null;
  };
  const localAmount = norm(order.amount);
  const incomingAmount = norm(notifyAmount);
  if (!incomingAmount || incomingAmount !== localAmount) {
    console.error(`[notify] 金额不符: out_trade_no=${outTradeNo} 本地=${localAmount} 通知=${incomingAmount}`);
    return { ack: ACK_FAILURE, reason: 'amount mismatch' };
  }

  // ── 6. 只在终态入账 ──
  if (!TRADE_FINAL_STATUS.has(tradeStatus)) {
    console.log(`[notify] 非终态，跳过: out_trade_no=${outTradeNo} status=${tradeStatus}`);
    return { ack: ACK_SUCCESS, reason: `non-final status ${tradeStatus}` };
  }

  // ── 7. 状态推进 ──
  // 走到这里说明用户确实付过钱。若履约尚未完成，标记为已支付待履约，
  // 由同步链路（用户带 Payment-Proof 重试）或补偿查询完成交付。
  order.orderStatus = 'PAID';
  order.tradeNo = tradeNo;
  order.paidAt = new Date().toISOString();
  order.paidVia = 'async_notify';

  if (order.fulfillStatus === 'UNFULFILLED') {
    order.fulfillStatus = 'PENDING_CONFIRM';
  }
  await repo.updateOrder ? repo.updateOrder(order) : repo.createPending(order);

  console.log(`[notify] 入账成功: out_trade_no=${outTradeNo} trade_no=${tradeNo} amount=${localAmount}`);
  return { ack: ACK_SUCCESS };
}

/**
 * 补偿查询：主动查一笔交易，用于通知丢失的场景
 *
 * @param {string} outTradeNo 商户订单号
 */
async function queryTrade({ outTradeNo, repo, alipayExec }) {
  const resp = await alipayExec('alipay.trade.query', { out_trade_no: outTradeNo });
  const data = resp.alipay_trade_query_response || resp;

  if (data.code !== '10000' && data.code !== 10000) {
    return { ok: false, code: data.sub_code || data.code, msg: data.sub_msg || data.msg };
  }

  const order = await repo.findByOutTradeNo(outTradeNo);
  const status = data.trade_status || '';
  const norm = (v) => {
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(v || '').trim());
    return m ? `${BigInt(m[1]).toString()}.${(m[2] || '').padEnd(2, '0')}` : null;
  };

  return {
    ok: true,
    tradeStatus: status,
    tradeNo: data.trade_no || '',
    amount: norm(data.total_amount),
    final: TRADE_FINAL_STATUS.has(status),
    // 仅当本地未入账且查询为终态且金额一致时，才建议补账
    shouldReconcile: !!(order && order.orderStatus !== 'PAID'
      && TRADE_FINAL_STATUS.has(status)
      && norm(data.total_amount) === norm(order.amount)),
  };
}

/**
 * 把通知端点挂到已有 HTTP server 上
 *
 * @param {http.Server} server
 * @param {Object} cfg { repo, alipayExec, alipayPublicKey, path }
 */
function setupNotifyEndpoint(server, cfg) {
  const path = cfg.path || '/a2m/notify';
  const repo = cfg.repo;
  const alipayExec = cfg.alipayExec;
  const alipayPublicKey = cfg.alipayPublicKey;

  if (!repo) throw new Error('setupNotifyEndpoint 需要 repo');
  if (typeof alipayExec !== 'function') throw new Error('setupNotifyEndpoint 需要 alipayExec');
  if (!alipayPublicKey) throw new Error('setupNotifyEndpoint 需要 alipayPublicKey');

  server.on('request', async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname !== path) return;

    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');

    let ack = ACK_FAILURE;
    let reason = '';
    try {
      // 支付宝回调是 application/x-www-form-urlencoded
      const params = new URLSearchParams(raw);
      const result = await handleNotify({ params, repo, alipayExec, alipayPublicKey });
      ack = result.ack;
      reason = result.reason || '';
    } catch (e) {
      reason = `handler error: ${e.message}`;
    }

    if (ack === ACK_FAILURE) {
      console.error(`[notify] 处理失败: ${reason}`);
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    // 必须原样回写 success / failure，不能带引号、换行或 JSON 包装
    res.end(ack);
  });

  console.log(`[notify] 异步通知端点已挂载: ${path}`);
}

module.exports = {
  verifyNotifySign,
  handleNotify,
  queryTrade,
  setupNotifyEndpoint,
  TRADE_FINAL_STATUS,
  ACK_SUCCESS,
  ACK_FAILURE,
};
