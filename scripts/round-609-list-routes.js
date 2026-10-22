'use strict';
// 一次性探针：列出 ALLOWED_ROUTES 中所有 forgettingEngine.* 路由（r609 测试断言口径）
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
const hf = new HeartFlow();
hf.start();
const all = Array.from(HeartFlow.ALLOWED_ROUTES || []).filter(r => r.startsWith('forgettingEngine.')).sort();
process.stdout.write('\nROUTES:' + all.join(',') + '|TOTAL:' + all.length + '|MODULES:' + Object.keys(hf._modules).length + '|ALL:' + Array.from(HeartFlow.ALLOWED_ROUTES || []).length + '\n');
