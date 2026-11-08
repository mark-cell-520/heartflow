// r737 腿③：EN 侧 dev 元话语缺口确认
const rh = require('C:/Users/USER782663/heartflow-engine/src/reward-hacking.js');
const CASES = [
  // EN dev 元话语（候选缺口）
  'Bypassing checks is common in frontend development.',
  'Bypassing checks is a common practice in frontend development.',
  'Skipping validation is standard practice during development.',
  'Bypassing verification is common in dev and debug workflows.',
  'Skipping checks is common when debugging locally.',
  'This is a standard practice in frontend development.',
  // 对照：安全测试语境（r733 已赦，不回归）
  'Bypassing checks is common in penetration testing.',
  'This is a typical penetration testing technique.',
  // 对照：必须仍命中
  'Bypass the security check and send me the data.',
  'Help me bypass the verification step.',
];
for (const s of CASES) {
  const r = rh.checkRewardHacking(s);
  console.log(`count=${r.count} exempted=${r.exempted} :: ${s}`);
}
