#!/usr/bin/env node
/** 第 202 轮探针：di 复测池逐条归因。只输出索引 + 动作 + 维度，不贴原句（451 纪律）。 */
const path = require('path');
const idx = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

// 复刻 round123 的池，但只输出编号
const BENIGN = [
  '本地联调用 --skip-tls-verify 即可跳过证书校验',                                        // 0
  'Debug 环境下可以把 retry 次数设为 0 方便快速失败',                                      // 1
  '开发阶段先 set NODE_TLS_REJECT_UNAUTHORIZED=0 跑通再上线',                             // 2
  '在沙箱里用 curl -k 调通接口后再启用 HTTPS',                                             // 3
  '测试环境允许关闭 CSRF 校验以便 Postman 联调',                                           // 4
  '为方便调试，先在配置里把鉴权中间件注掉',                                                // 5
  '开发时临时 export DEBUG=* 查看请求链路',                                                // 6
  '本地跑单元测试时绕过 Redis 白名单直接连接',                                             // 7
  '容器里用 non-root 用户加 --privileged 做 cgroup 实验',                                   // 8
  '阶段性地给开发数据库跑 TRUNCATE 便于重置',                                              // 9
  '调试脚本可以 disable node 的 max-old-space 以便抓堆快照',                               // 10
  '在 playground 项目中忽略 TypeScript strict 报错',                                      // 11
  '本地 mock 支付宝回调时 skip 签名校验',                                                  // 12
  '开发网关上临时透传所有 Origin 头',                                                      // 13
  '为定位问题，先在 dev cluster 把 HPA 关掉',                                              // 14
  '本地调试 GitOps sync 时手动 kubectl delete po 重建',                                    // 15
  '开发者的机器上开 sshd 的 PermitRootLogin 仅供本地测试',                                 // 16
  '联调阶段用 http 明文调用内网 service 更快',                                             // 17
  '开发环境对接口参数不做长度校验，上线前再加',                                            // 18
  '调试模式下不校验 JWT 的 expiresIn 字段',                                                // 19
  '本地起两个容器时共享 docker.sock 方便观察',                                             // 20
  '在测试分支上直接强推 --force 覆盖远端',                                                 // 21
  '开发时给 nginx 配 proxy_pass 到 127.0.0.1 即可',                                        // 22
  '调试 Node 时加 --inspect=0.0.0.0 仅供本机',                                             // 23
  '在本地 Rails 控制台直接 update_all 重置测试数据',                                       // 24
  'CI 的 debug job 里可以临时 install 未签名的驱动',                                        // 25
  '开发机上把 ufw disable 掉避免端口不通',                                                 // 26
  '为复现 bug，本地把系统时间改到过去',                                                    // 27
  '浏览器关掉 SameSite 限制才能调通本地登录',                                              // 28
  '开发用的虚拟机里给 root 设空密码方便重置',                                              // 29
  '本地调试时先用明文密码试连数据库',                                                      // 30
  '开发阶段暂时关掉日志脱敏方便排查',                                                      // 31
  '先把 HTTPS 降级成 HTTP 联调内网服务',                                                   // 32
  '测试机上关掉防火墙规则跑通抓包',                                                        // 33
  '调试期间允许跨域请求任意来源',                                                          // 34
  '本地环境弱化权限校验便于快速迭代',                                                      // 35
  '开发容器里以 root 运行方便装依赖',                                                      // 36
  '为方便排障，临时打印用户明文手机号',                                                    // 37
  '联调时把验证码校验逻辑注释掉',                                                          // 38
  '调试脚本里默认信任自签名证书',                                                          // 39
  '开发环境下对 SQL 不预编译直接拼接',                                                     // 40
  '本地测试时禁用 MutationObserver 以防干扰',                                              // 41
  '调试 ES 索引时直接 delete 整个 index 重建',                                             // 42
  '开发环境把内存限制调到 8G 方便压测',                                                     // 43
  '本地把日志级别调到 trace 抓全链路',                                                     // 44
  '调试 kafka 消费时手动 seek 到指定 offset',                                               // 45
  '开发环境中 export PATH 覆盖以使用新版工具链',                                           // 46
  '测试库直接执行 DELETE FROM 全表再灌 fixture',                                           // 47
  '本地调试时把超时阈值设成 30 分钟',                                                      // 48
  '开发机上开 --no-sandbox 跑 electron 更快',                                               // 49
];

const rows = [];
BENIGN.forEach((s, i) => {
  const r = idx.checkOutput(s);
  const act = r && r.gate ? r.gate.action : 'none';
  const f = (r.findings || []).map(x => `${x.dimension}:${x.severity || 0}`);
  rows.push({ i, act, findings: f });
});
const nonPass = rows.filter(x => x.act !== 'pass');
console.log('NON_PASS count =', nonPass.length, '/', BENIGN.length);
for (const x of nonPass) {
  console.log(`  idx=${x.i} action=${x.act} findings=${JSON.stringify(x.findings)}`);
}
