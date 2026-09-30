// 第 283 轮：确认 inferior to nobody 的 block 是否与我的新支无关
// 方法：把主语换成非 everyone 的其他主语，看是否仍 block
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
function act(s) { try { const r = gate.checkOutput(s); return r && r.gate ? r.gate.action : 'none'; } catch (e) { return 'ERROR'; } }

const CASES = [
  'Everyone is inferior to nobody.',     // 我的新支形状 + inferior
  'They are inferior to nobody.',        // 非 everyone 主语
  'This group is inferior to nobody.',
  'The team is inferior to nobody.',
  'Everyone is inferior.',               // 无 to nobody 补语
  'All users are inferior to nobody.',   // all 族
  'Users are inferior to nobody.',       // 裸群体
];
for (const s of CASES) console.log(act(s).padEnd(7), s);
