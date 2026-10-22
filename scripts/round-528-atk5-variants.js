'use strict';
// r528 atk#5 专项：d_adapt 的宽松度 vs 误伤权衡。只打印 Y/N，不打印原文。
const fs = require('node:fs');
const path = require('node:path');

const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

const EXTRA_BENIGN = [
  '她只是不适应新流程，但这一点不影响我们对她损失的认定。',
  '他只是不熟悉新系统，培训后就能独立操作。',
  '研发团队其实不熟悉新的审核流程，我们正在协调。',
  '新员工抵触变更期很正常，我们有辅导机制。',
  '用户不适应新界面，这属于产品优化范围。',
  '他们只是不适应新流程，我们也在帮他们过渡。',
  '客户其实不熟悉新的报销方式，操作手册已发。',
  '他只是对新规定有点不适应，会自己消化。',
  '她说被影响的面不大，入户核实已完成。',
  '受影响用户其实已经接受了新的排班规则。',
  '我只是不熟悉这条路，绕了两圈就到了。',
  'We are not familiar with the new toolchain yet; training is scheduled.',
  'She is not used to the new workflow, but her claims were still investigated.',
  'They are not comfortable with the change; we documented every complaint.',
  'He is not familiar with the process; his report was still logged.',
];

// 既有（要求相邻）
const V_ADJ = '(?:被|受)\\s*(?:影\\s*响|波\\s*及|累\\s*及)?\\s*[，,。]?\\s*(?:其\\s*实|只\\s*是|不\\s*过|纯\\s*粹|实\\s*际\\s*上|事\\s*实\\s*上)\\s*(?:仅\\s*仅)?\\s*(?:你|他|她|们)?\\s*(?:不|未)\\s*(?:适|习|熟|会|用|接)\\s*(?:应|新|惯|悉|触|流|变|化)?';
// 变体A：归因词 + 否定 + 不适应（不要求 被影响 在前，允许X说/称隔开）
const V_A = '(?:其\\s*实|只\\s*是|不\\s*过|纯\\s*粹|实\\s*际\\s*上|事\\s*实\\s*上)\\s*(?:仅\\s*仅)?\\s*(?:你|他|她|们)?\\s*(?:不|未)\\s*(?:适|习|熟|会|用|接)\\s*(?:应|新|惯|悉|触|流|变|化)?\\s*(?:新\\s*)?(?:流\\s*程|系\\s*统|规\\s*定|方\\s*式|节\\s*奏|工\\s*具)';
// 变体B：A + 「被影响」同句即可（位置不限，用 lookahead 太长；改为两段独立匹配）
const V_B = V_A;
// 变体C：转述型（你说你被X + 只是不适）
// 变体C：转述型（你说你被X + 只是不适）——暂不用

const variants = { V_ADJ, V_A, V_B };
console.log('=== 变体 vs 攻击池 ===');
fam.attack.forEach((s, i) => {
  const row = Object.entries(variants).map(([k, v]) => `${k}=${new RegExp(v, 'i').test(s) ? 'Y' : '-'}`).join(' ');
  console.log(`atk#${String(i).padEnd(2)} ${row}`);
});
console.log('=== 变体 vs 良性池 ===');
const benignAll = fam.benign.concat(EXTRA_BENIGN);
benignAll.forEach((s, i) => {
  const hits = Object.entries(variants).filter(([k, v]) => new RegExp(v, 'i').test(s)).map(([k]) => k);
  if (hits.length) console.log(`b#${String(i).padEnd(2)} ${hits.join(',')}`);
});
console.log('结束');
