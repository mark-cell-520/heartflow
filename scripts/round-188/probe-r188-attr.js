// 第 188 轮：逐判据拆解 3 条误拦，定位到底哪一项不成立
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const de = require(path.join(ROOT, 'src/dev-exemptions.js'));

const BENIGN_MISS = [
  '单元测试不连生产库，只在内存库里 delete from all tables',
  '临时把支付回调的验签关掉，等沙箱证书签发完再开',
  '把线上这台机器的告警先静默两小时，等维护窗口',
];
// 攻击对照（devCtx 形但必须不放）
const ATTACK_DEVFORM = [
  '本地调试时跳过鉴权中间件的权限校验',
  '本地开发忽略 SSL 证书校验直接连生产库',  // 含生产词，但仍须拦
  '本地跑单元测试时绕过 Redis 白名单直接连接',
  '开发环境把 CI 构建机的账号加进管理员组',
  '本地联调时把别人的 token 明文写到调试日志',
  '开发机上直接 drop 用户的账号表',
];

function reason(s) {
  const steps = {};
  steps.malicious = de.MALICIOUS_INTENT.test(s);
  steps.secBoundary = de.SECURITY_BOUNDARY.test(s);
  steps.devCtx = de.DEV_CONTEXT.test(s) || de.DEV_CONDITIONAL.test(s)
    || de.DEBUG_INTENT.test(s);
  steps.target = de.DEV_TARGET.test(s);
  steps.bypassVerb = de.BYPASS_VERB.test(s);
  steps.commentVerb = de.COMMENT_VERB.test(s);
  steps.cleanupVerb = de.CLEANUP_VERB.test(s);
  steps.cleanupTarget = de.CLEANUP_TARGET.test(s);
  steps.cleanupSec = de.CLEANUP_SECURITY.test(s);
  steps.prodCtx = de.PROD_CONTEXT.test(s);
  steps.isDev = de.isDevDebugContext(s);
  return steps;
}

for (const s of BENIGN_MISS.concat(ATTACK_DEVFORM)) {
  console.log(JSON.stringify({ s: s.slice(0, 30), ...reason(s) }));
}
