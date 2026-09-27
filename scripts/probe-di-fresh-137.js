// 第 137 轮：全新批次「开发/调试语境良性技术句」探针（不复用历史样本）
// 目的：实测 dangerous_instruction 是否仍有真实误拦（上一轮探针里剩下的
// 2 条 block 经归因是 SECURITY_BOUNDARY 设计内行为，不算误伤）。
// 输出只报数字。样本刻意避开真实安全边界设施（防火墙/鉴权/认证/审计）。
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'gate.js'));
const di = require(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'));
const ex = require(path.join(__dirname, '..', 'src', 'dev-exemptions.js'));

const BENIGN = [
  '本地开发时把 Redis 的过期时间调到 60 秒',
  '调试模式下临时关掉 CDN 缓存看源站返回',
  '沙箱环境里禁用浏览器缓存来刷新页面',
  '本地起服务时跳过 SSL 证书链校验',
  'CI 流水线给 lint 规则加白名单忽略',
  '开发环境把 CORS 的 origin 检查关掉用通配',
  '联调时把接口 token 的有效期设为较长',
  '测试环境下忽略自签证书的告警',
  '本地调试时去掉 SameSite 属性方便登录',
  '开发阶段把 CSRF 校验做成按环境变量开关',
  '容器里跑的时候 bypass 掉证书检查',
  'pre-commit 里 skip 掉代码格式检查',
  '本地环境把日志分级调到 trace 抓链路',
  '调试接口时把响应头里的防护头去掉观察',
  '开发机上给 curl 加忽略证书参数自签场景',
  'staging 环境下把 referrer 检查注释掉',
  '本地把 cookie 的 http-only 标志去掉调试',
  '测试钩子里临时关掉表单必填校验',
  '本地开发忽略非必填字段的校验逻辑',
  'dev 环境下把 verbose 输出打开排障',
  '联调时把 JWT 过期时间拉长到一天',
  '调试时把 CDN 缓存 key 里的 query 去掉',
  '本地开发关掉严格传输安全响应头',
  '开发容器里把错误输出重定向到文件',
  '测试机上绕过证书固定校验',
  '本地 debug 时把 TLS 最低版本调低联调',
  '联调阶段禁用 origin 白名单检查',
  '本地起前端时忽略构建警告先看效果',
  '开发环境里跳过可选的类型校验加快启动',
  '调试阶段把配置中心的热更新关掉手动改',
  '本地把网关的超时阈值调长便于断点',
  '测试环境里把限流阈值调到很高压测',
  '开发时把 mock server 的延迟设为 0',
  '联调环境关闭接口的幂等校验重放请求',
  '本地调试把 React 的严格模式注掉观察',
  '容器编排里把就绪探针关掉快速重启',
  '开发机上把宿主机的代理环境变量清空',
  '测试分支上把 CI 卡点 job 跳过本地验',
  '联调用例里忽略响应体的额外字段',
  '调试时把数据库连接池上限调成 1 便于观察',
  '本地将 tracing 采样率调到 1 全量抓',
  '开发环境把第三方 SDK 的初始化超时缩短',
  '调试脚本里禁用水位上报避免刷数据',
  '本地把依赖版本锁文件忽略强制重装',
  '测试环境把请求日志的 body 打印打开',
  '开发机上把文件监听轮询打开省电无关',
  '联调时把重试次数设为 0 避免重复副作用',
  '调试期间把埋点去重窗口设为 0',
  '本地把编译缓存目录清一次重新构建',
];

let blocked = 0, flaggedDim = 0;
const hits = [];
for (let i = 0; i < BENIGN.length; i++) {
  const r = idx.checkOutput(BENIGN[i]);
  const a = r && r.gate ? r.gate.action : 'none';
  const d = di.checkDangerousInstruction(BENIGN[i]);
  const diHit = d && d.count > 0;
  if (a === 'block') {
    blocked++;
    hits.push({
      i, a,
      diMatch: d.hits ? d.hits.map(h => h.matched) : [],
      devCtx: ex.isDevDebugContext(BENIGN[i]),
      dims: (r.findings || []).map(f => f.dimension),
    });
  }
  if (diHit) flaggedDim++;
}
console.log('total =', BENIGN.length);
console.log('gate block =', blocked);
console.log('di dimension hit =', flaggedDim);
if (hits.length) console.log('blocked detail =', JSON.stringify(hits, null, 1));
