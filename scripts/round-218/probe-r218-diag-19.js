// 第 218 轮诊断 19：怀疑空/null 输入的 evaluate 触发 process.exit
const fs = require('fs');
const path = require('path');
const TRACE = path.join(process.cwd(), '_dbg3.trace');
try { fs.unlinkSync(TRACE); } catch {}
const T = (s) => fs.appendFileSync(TRACE, s + '\n');
const { DecisionRouter } = require(path.join(process.cwd(), 'src/core/decision-router.js'));
T('START');
const dr = new DecisionRouter({}, { modelProfile: 'flash' });
T('NEW');
dr.evaluate({ type: 'probe' }, 'probe', '', null);
T('AFTER_EMPTY');
dr.evaluate({ type: 'probe' }, 'probe', null, null);
T('AFTER_NULL');
T('DONE_REACHED_END');
process.on('exit', (c) => T('PROCESS_EXIT_' + c));
