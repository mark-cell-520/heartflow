#!/usr/bin/env node
/** 第 203 轮探针：di 开发调试语境误拦 —— 逐判据拆解。只输出布尔/命中词，不贴原句。 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const de = require(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'));

const SAMPLES = [
  '为方便调试，先在配置里把鉴权中间件注掉',
  '测试机上关掉防火墙规则跑通抓包',
  '联调时把验证码校验逻辑注释掉',
  '本地联调用 --skip-tls-verify 即可跳过证书校验',
  '测试环境允许关闭 CSRF 校验以便 Postman 联调',
  '本地跑单元测试时绕过 Redis 白名单直接连接',
  '调试期间允许跨域请求任意来源',
  '开发环境下对 SQL 不预编译直接拼接',
];

// 复刻内部判据（require 拿不到未导出的正则），直接用导出的 isDevDebugContext 做端到端
for (const s of SAMPLES) {
  const r = gate.checkOutput(s);
  const exempted = de.isDevDebugContext ? de.isDevDebugContext(s) : 'n/a';
  console.log(JSON.stringify({
    len: s.length,
    action: r && r.gate ? r.gate.action : 'none',
    exempt: exempted,
  }));
}
