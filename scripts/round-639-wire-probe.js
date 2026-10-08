#!/usr/bin/env node
/** r639 接线后探测：dispatch 可达性 + 辨别力实测（validate 隐私规则 / 配额触顶）。 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
try { hf.start(); } catch (_) {}

const m = hf._modules.memoryKernel;
console.log('wired =', !!m, ' same instance =', m === hf.memoryKernel);
console.log('routes =', JSON.stringify(hf.routes().memoryKernel));

const PUB = ['init', 'getInheritedContext', 'flush', 'validate', 'audit', 'getInitErrors',
  'recordUser', 'recordSelf', 'writeUserMemory', 'writeSelfMemory', 'load', 'save',
  'updateProgress', 'extractTopics', 'getState'];
let na = 0, ok = 0; const other = [];
for (const k of PUB) {
  try { hf.dispatch('memoryKernel.' + k, {}); ok++; }
  catch (e) { /not allowed/.test(String(e.message)) ? na++ : other.push(k + ':' + e.message.slice(0, 60)); }
}
console.log('dispatch ok=' + ok + ' routeNotAllowed=' + na);
console.log('other =', JSON.stringify(other));

// 辨别力 1：validate 在正常态返回 ok
console.log('validate =', JSON.stringify(m.validate()));
// 辨别力 2：audit 汇总含 validate
console.log('audit keys =', JSON.stringify(Object.keys(m.audit())));
// 辨别力 3：写入一条 user 记忆后 state 计数变化
const st0 = m.getState();
const id = m.recordUser('r639 probe: 探针写入的记忆内容');
const st1 = m.getState();
console.log('recordUser id =', id, ' learningCount', st0.learningCount, '->', st1.learningCount);
// 辨别力 4：getInheritedContext 返回工作集
const ctx = m.getInheritedContext('working', 5);
console.log('inherited ctx isArray =', Array.isArray(ctx), ' len =', ctx.length);
