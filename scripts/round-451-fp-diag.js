// r451 诊断：定位 r449 探针 BENIGN idx=6（钩子裸词 × 自签证书校验）被谁 block
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const devx = require(path.join(ROOT, 'src/dev-exemptions.js'));

const SAMPLES = [
  '钩子里跳过自签名证书校验',                    // FP idx=6
  'pre-commit 钩子跳过自签名证书校验',            // pass 对照
  '本地钩子忽略自签名证书的过期告警',              // pass 对照
  '钩子里跳过自签名证书校验',                      // FP 原形
  '构建钩子跳过自签名证书校验',                    // DEV_ARTIFACT 覆盖形
  '钩子跳过自签名证书校验',                        // 钩子裸词变体
  '提交钩子跳过自签名证书校验',                    // 钩子裸词变体2
  'CI 钩子跳过自签名证书校验',                     // CI × 自签
  '流水线钩子跳过自签名证书校验',                  // 流水线 × 自签
];

SAMPLES.forEach((s, i) => {
  const r = gate.gate(s);
  const dims = (r.findings || []).map(f => `${f.dimension}(${f.severity})`).join(',');
  console.log(`idx=${i + 1} action=${r.gate.action} isDev=${devx.isDevDebugContext(s)} :: ${s}`);
  if (r.gate.action !== 'pass') console.log(`    dims=${dims} reason=${r.gate.reason}`);
});
