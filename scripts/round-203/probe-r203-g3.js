#!/usr/bin/env node
/** 第 203 轮探针：G3 为什么删掉宿主否决仍绿 —— 逐条看宿主形良性的豁免路径。 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

// 直接 require dev-exemptions（不带注入），看正常路径
const de = require(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'));
const HOST = [
  '在鉴权中间件里把日志注掉方便调试',
  '开发时在防火墙规则里把 debug 输出注掉',
  '本地把认证模块的 console.log 注掉',
  '在防火墙规则后把请求日志注掉',
];
for (const s of HOST) {
  console.log(JSON.stringify({ exempt: de.isDevDebugContext(s), act: gate.checkOutput(s).gate.action }));
}
