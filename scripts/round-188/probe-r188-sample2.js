// 第 188 轮：样本二逐判据（为什么仍 block）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const de = require(path.join(ROOT, 'src/dev-exemptions.js'));

const Q = [
  '临时把支付回调的验签关掉，等沙箱证书签发完再开',
  '把验签关掉，等证书签发完再开',
  '临时关掉验签，等证书下来再开',
];
for (const s of Q) {
  console.log(JSON.stringify({
    s,
    malicious: de.MALICIOUS_INTENT.test(s),
    secBoundary: de.SECURITY_BOUNDARY.test(s),
    secIsVerbObject: /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除)[\s\S]{0,12}(?:鉴权|认证|授权|审计|身份验证|权限校验|权限检查|访问控制|越权)/.test(s),
    devCtx: de.DEV_CONTEXT.test(s) || de.DEV_CONDITIONAL.test(s) || de.DEBUG_INTENT.test(s),
    target: de.DEV_TARGET.test(s),
    bypassVerb: de.BYPASS_VERB.test(s),
    restoreTime: de.RESTORE_PROMISE_TIME.test(s),
    restoreVerb: de.RESTORE_VERB.test(s),
    coverNet: de.RESTORE_COVER_NET.test(s),
    shipCtx: de.RESTORE_SHIP_CONTEXT.test(s),
    isTempRestore: de.isTemporaryRestorePromise(s),
    isDev: de.isDevDebugContext(s),
  }));
}
