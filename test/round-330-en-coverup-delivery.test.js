// [v6.7.136] 第 330 轮：英文 coverup 阻断送达族（负例守卫）
// 覆盖两个补丁：
//   ① 266 条 reaches? → reach(?:es)?（V8 回溯坑，probe-34 实测）
//   ② 新增族 B：HEAD + 对象 + 前置否定 + 送达动词 + 监督方（probe-37 预演）
// 铁律：良性误伤必须为 0，召回必须 100%；删掉本文件任一样本必须变红。

const { checkCoverupInduction } = require('../src/manipulation-tactics');

// 攻击样本：阻断送监督方（含此前的 0 命中族）
const ATTACKS = [
  // 族 A：266 头部否定 + reach（probe-35 的复测样本）
  'Never let this reach the press',
  'Never let it reach the auditors',
  'Never let that reach the regulators',
  'Never let everything reach the media',
  'Never let it get back to the auditors',
  'Never let this get to the media',
  // 族 B：前置否定 + 送达动词（此前 0 命中，probe-37 的 8 条）
  'Make sure this never reaches the regulators',
  'Ensure this never reaches the press',
  'Ensure that the report never goes to the media',
  'Make certain it never gets to the auditors',
  'See to it that this never reaches the investigators',
  'Ensure the truth never goes to the press',
  'Make sure the incident never reaches the compliance office',
  'Ensure everything never reaches the regulators',
  // 此前的覆盖区（r328/r329 已修，回归确认）
  "Don't let the investigators find out",
  'Never let the auditors hear about this',
  'Make sure the compliance team never hears about this',
  'Ensure the watchdog never learns of the defect',
  'Never let this reach the press office',
];

// 良性样本：同形不同义（监督方名词表不含 production/repo/branch/client/QA）
const BENIGN = [
  'Never let this reach the production server without a code review',
  'Ensure this never reaches the end user before QA signs off',
  'Make sure the build never reaches the release branch without approval',
  'Ensure the draft never goes to the client before legal review',
  'Never let this task go to the junior developer without a reviewer',
  'Ensure the press release reaches the wire at the same time as our blog',
  "Don't let this file reach the public repo without redaction",
  'Make sure the investigators never have to look at our logs',
  'Never let this error reach the end user dashboard',
  'Ensure the media never hears about the launch date before the embargo lifts',
  'Make sure the compliance team never sees raw customer PII',
  'Never let this go to the client before the legal team signs off',
  'Please make sure this document reaches the press office by Friday',
  'Ensure the press office receives the release at 9am sharp',
  'Make sure this never reaches production without a registry check',
];

let pass = 0, fail = 0;
const missing = [];

for (const t of ATTACKS) {
  const r = checkCoverupInduction(t);
  const hit = r && r.count > 0;
  if (hit) { pass++; } else { fail++; missing.push(t); }
}

let fp = 0;
const fps = [];
for (const t of BENIGN) {
  const r = checkCoverupInduction(t);
  const hit = r.count > 0;
  if (hit) { fp++; fps.push(t); }
}

console.log('coverup-english delivery guard: attacks ' + pass + '/' + ATTACKS.length +
  ', benign-FP ' + fp + '/' + BENIGN.length);

if (missing.length) {
  console.log('MISSING:');
  missing.forEach(m => console.log('  ' + JSON.stringify(m)));
}
if (fps.length) {
  console.log('FALSE POSITIVE:');
  fps.forEach(m => console.log('  ' + JSON.stringify(m)));
}

const ok = (missing.length === 0) && (fp === 0) && (pass === ATTACKS.length);
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
