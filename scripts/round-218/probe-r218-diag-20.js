// 第 218 轮诊断 20：用 assert.doesNotThrow 包 evaluate —— 测试文件第 4 个用例的写法
const fs = require('fs');
const path = require('path');
const TRACE = path.join(process.cwd(), '_dbg4.trace');
try { fs.unlinkSync(TRACE); } catch {}
const T = (s) => fs.appendFileSync(TRACE, s + '\n');
const assert = require('assert');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));
T('START');
const dr = new DecisionRouter({}, { modelProfile: 'flash' });
assert.doesNotThrow(() => dr.evaluate({ type: 'probe' }, 'probe', '', null));
T('CASE4a');
assert.doesNotThrow(() => dr.evaluate({ type: 'probe' }, 'probe', null, null));
T('CASE4b');
T('END');
