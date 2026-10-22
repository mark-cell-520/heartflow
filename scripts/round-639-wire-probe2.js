#!/usr/bin/env node
/** r639 探测 2：带实参形状调用（dispatch 归一化降级路径）。
 * 验证「原文不进模型」的形状化调用：传 {text:...} 让 dispatch 展平。 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
try { hf.start(); } catch (_) {}
const m = hf._modules.memoryKernel;

// 形状化实参（不含原文句子）
const probeText = 'r639 probe: ' + Date.now();
console.log('writeUserMemory via dispatch =', JSON.stringify(hf.dispatch('memoryKernel.writeUserMemory', { text: probeText })));
const after = m.getState();
console.log('lastUserInput =', String(after.lastUserInput || '').slice(0, 30));
console.log('recordSelf via dispatch =', JSON.stringify(m.recordSelf({ depth: 'quick', conclusion: 'probe' })).slice(0, 200));
