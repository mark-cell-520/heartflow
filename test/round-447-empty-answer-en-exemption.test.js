// r447 守卫：empty_answer 英文套话支的收敛/数值豁免
// 三项断言：
//   ① 良性（套话 + 收敛动作/数值）不得被判空答（误伤守卫，对应 4f2fab6e）
//   ② 纯套话攻击句仍是空答（不能被豁免削弱——反向守卫）
//   ③ 删条变异：把豁免接入块删掉，① 必须变红（证明守卫敏感）
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { checkEmptyAnswer } = require('../src/index.js');
const { gate } = require('../src/gate.js');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'src', 'index.js');

let failures = 0;
function ok(cond, msg) {
  if (cond) { console.log(`  ok - ${msg}`); return true; }
  console.log(`  NOT OK - ${msg}`);
  failures++;
  return false;
}

// ── 样本：形状分组，不贴攻击原文 ──────────────────────────────────────
// B 组 = 套话词 + 收敛承诺/数值基线（良性，曾误伤 1 条）
const BENIGN = [
  'The test is flaky because it depends on wall-clock timing, so I will use a mocked clock.',
  'It depends on the load, so I will retry the job three times before giving up.',
  'It depends, but I will add an index on user_id and rerun the migration.',
  'Time will tell, and the dashboard showed 12 errors over 4 hours.',
  "It's complicated, so I will split the module and pin the dependency.",
  'It depends on the network, so I will inspect the gateway logs and pin the timeout.',
  "It's not that simple, so we'll mock the clock and rerun the suite.",
  'There are many factors, so I will switch to the batched writer.',
  'It remains to be seen, but I will set the TTL to 60 seconds and measure again.',
  'At the end of the day, I will disable the third worker and compare p99.',
];

// A 组 = 纯套话，无收敛承诺、无数值基线（必须继续被拦）
const ATTACK = [
  "It's complicated.",
  'It depends.',
  'There are many factors.',
  "It is what it is.",
  'Time will tell.',
  "We'll see.",
  'At the end of the day.',
  'Only time will tell.',
  'It remains to be seen.',
  "That's just the way it is.",
];

console.log('== ① 良性守卫：套话 + 收敛/数值 不得判空答 ==');
let bfp = 0;
for (const t of BENIGN) {
  const e = checkEmptyAnswer(t);
  const g = gate(t);
  if (e.count > 0) bfp++;
  ok(e.count === 0, `benign no-empty_answer: gate=${g.gate.action}`);
}
ok(bfp === 0, `benign empty_answer 误伤 ${bfp}/${BENIGN.length}`);

console.log('== ② 反向守卫：纯套话必须仍是空答 ==');
let amiss = 0;
for (const t of ATTACK) {
  const e = checkEmptyAnswer(t);
  if (e.count === 0) amiss++;
  ok(e.count > 0, 'pure hedge still empty_answer');
}
ok(amiss === 0, `attack 空答漏放 ${amiss}/${ATTACK.length}`);

console.log('== ③ 删条变异：删掉豁免接入块，① 必须变红 ==');
// 变异体写入 src/ 同目录（相对 require 才能解析），跑完即删。
// 参照 test/round-431-mutant-runner.js 的既有模式。
const MUTANT_FILE = path.join(ROOT, 'src', '_r447_mutant_index.js');
const MUTANT_RUNNER = path.join(ROOT, 'test', '_r447_mutant_runner.js');

function variantBenignFp(mutatedSrc) {
  fs.writeFileSync(MUTANT_FILE, mutatedSrc);
  fs.writeFileSync(MUTANT_RUNNER,
    "const { checkEmptyAnswer } = require('../src/_r447_mutant_index.js');\n" +
    "const list = " + JSON.stringify(BENIGN) + ";\n" +
    "let fp = 0;\n" +
    "for (const t of list) { if (checkEmptyAnswer(t).count > 0) fp++; }\n" +
    "console.log(fp);\n");
  try {
    const out = execFileSync(process.execPath, [MUTANT_RUNNER], { encoding: 'utf8', cwd: ROOT });
    return parseInt(out.trim().split('\n').pop(), 10);
  } finally {
    fs.rmSync(MUTANT_FILE, { force: true });
    fs.rmSync(MUTANT_RUNNER, { force: true });
  }
}

const origSrc = fs.readFileSync(INDEX, 'utf8');
const baseline = variantBenignFp(origSrc);

// 变异：把豁免接入块的判定条件恒假化（等价于「没有豁免」）
const MUTANT_ANCHOR = 'if (empties.length > 0 && !hasChinese) {';
if (!origSrc.includes(MUTANT_ANCHOR)) {
  ok(false, '变异锚点未找到（src/index.js 结构已变，重写变异）');
} else {
  const mutated = origSrc.replace(MUTANT_ANCHOR, 'if (false) { // MUTANT: 移除豁免');
  const mutantFp = variantBenignFp(mutated);
  ok(baseline === 0, `基线良性误伤 = 0（实测 ${baseline}）`);
  ok(mutantFp > 0, `删掉豁免后良性误伤从 ${baseline} 升到 ${mutantFp}（守卫敏感）`);
}

console.log(`\nr447 result: failures=${failures}`);
if (failures > 0) process.exit(1);
console.log('r447: ALL GREEN');
