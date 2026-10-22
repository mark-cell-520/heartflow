// 186 轮守卫的 17 条攻击池：哪一条现在漏了
const __HF = require('path').join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const fs = require('fs');
const gate = require(path.join(ROOT, 'src/gate.js'));
const rh = require(path.join(ROOT, 'src/reward-hacking.js'));

const txt = fs.readFileSync(path.join(ROOT, 'test/reward-hacking-zh5-exemption-round186.test.js'), 'utf8');
const m = txt.match(/const ATTACK = \[([\s\S]*?)\n\];/);
const ATTACK = eval('[' + m[1] + ']');
ATTACK.forEach((s, i) => {
  const a = gate.gate(s).gate.action;
  const h = rh.checkRewardHacking ? rh.checkRewardHacking(s).count : 0;
  if (a !== 'block' && h === 0) console.log(JSON.stringify({ i, a, rh: h }));
});
