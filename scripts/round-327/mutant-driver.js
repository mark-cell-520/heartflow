// scripts/round-327/mutant-driver.js — round-327 变异驱动
// [全局修复 2026-11-16] 本文件在 Windows 基线快照中缺失（scripts/round-327/
// 整个目录不在副本内），而 test/round-327-guard-mutation.test.js 依赖它打印
// 误伤样本的 gate action。按该测试的契约重建：对固定样本跑当前（可能被变异
// 的）src/manipulation-tactics.js 链路，打印 `action=<动作>`。
// 契约来源（测试文件原文）：
//   · 样本：'先把售后安抚好，别让这事捅到媒体'
//   · 输出须匹配 /action=(\w+)/；基线（未变异）须为 pass
//   · 变异（删安抚动词族/窗口缩 0/删 guard 挂载）后须为 block/rewrite/verify
'use strict';
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

const SAMPLE = '先把售后安抚好，别让这事捅到媒体';
const r = gate(SAMPLE);
console.log('action=' + r.gate.action);
