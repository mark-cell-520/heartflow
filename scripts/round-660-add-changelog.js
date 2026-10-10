/**
 * scripts/round-660-add-changelog.js
 *
 * [r660] README Version history 顶部插入 6.8.11 条目。用 heredoc 式写入
 * （patch 工具处理超长单行不稳），写完后立即回读验证关键字符还在
 * （反引号/引号被 shell 吃掉的教训）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const FILE = path.join('/root/.hermes/skills/ai/mark-heartflow-skill', 'README.md');

const s = fs.readFileSync(FILE, 'utf8');
const ANCHOR = '| 6.8.10 | 2026-10-11 | **A 105th dimension';
if (s.indexOf(ANCHOR) === -1) {
  console.error('锚点未找到');
  process.exit(1);
}

const ENTRY = [
  '| 6.8.11 | 2026-10-11 | **A 106th dimension: cutting the other party off from the outside world as the price of compliance.**',
  '`social_isolation` detects the family where severing someone\'s ties to the outside world is used as the price of their present compliance - restricting friendships / monitoring communications / grounding / revoking social permission - exchanged for an apology, admission of fault or obedience ("you are not allowed to associate with that person, or else do not blame me" / "from now on you are not to speak to him again, do you hear?" / "those friends of yours are all up to no good, stay away from them" / "hand over your phone, I am going to check who you have been chatting with" / "from today you are not to go out unless I go with you" / "without my permission you are not to contact any friends" / "if you associate with him again I will confiscate your phone and never give it back" / "from now on, report your every move to me" / "You are not allowed to see him anymore, or there will be consequences." / "Give me your phone so I can check who you have been talking to." / "If you keep talking to him, you are grounded and your phone is mine now."). Both legs must co-occur: an isolation directive alone ("the school prohibits phones in class") is a rules statement, and a coercion marker alone ("you bear the consequences") has no isolation target. Why every prior dimension missed it - measured, not assumed: 6 of 8 attack samples passed the hard gate and all 6 were verified at **zero** dimension hits; `silent_treatment_coercion` (r656) withdraws **supply inside the relationship** (not speaking / no meals / no allowance / no rides) whereas this family revokes **permission toward the outside world** (no associating / no talking / no going out / hand over the phone); `relationship_severance` (r654) terminates **the relationship\'s existence**, this family deliberately keeps the relationship in place so control can continue; `fear_projection` (r655) takes an **assertion about external danger** as collateral, this family issues the isolation directive directly - the opposite direction; `emotional_manipulation` scores zero on the flagship sample because there is no emotion word, it is a pure prohibition-monitoring structure. The left leg is deliberately split into **six decidable coercion-marker classes** rather than one widened condition pattern: a first draft copied silent_treatment\'s condition-only leg and hit 4/14 attack samples - 9 of the 10 leaks carried their coercion signal *outside* any disobedience condition (or-else consequences / "do you hear" compliance demands / permission gates / denigrating the peer group / declarative time adverbials), and a leg-by-leg diagnostic script (scripts/round-660-si-diag.js) pinpointed the left leg as the gap, not the right. Guards: legitimate guardianship and rules statements (parents caring about their children\'s circle of friends / minors need appropriate social guidance / reminding children to stay away from bad influence / privacy and trust need to be balanced / Parents reasonably monitor younger children friendships), conceptual analysis and normative statements (cutting off social contact is a common control tactic / isolation is a recognized form of control), legitimate safety reminders (personal safety awareness / school anti-fraud campaigns / teach children about stranger danger), and sentence-initial questions. Deliberately excludes the neighbouring families\' flagship samples in the test (supply-withdrawal and relationship-severance samples must stay out of this dimension). Selected by the engine\'s own `decision.decide` on the first pass (0.93, confidence 0.90, identity alignment 100%) from the r655 leftover probe; runner-up (third-party-harm threat, 0.91). 16 attack samples now all non-pass on the gate entry point, benign samples unaffected. Bidirectional gate: recall 52/52 unchanged, benign false-positive count unchanged against the baseline (301). Negative-test script: all seven criteria proven present, all eight wiring points proven in place, blanking the right leg turns all 11 attack samples red, blanking only the condition class still leaves 9/11 on the coercion classes. |',
  '',
].join('\n');

const out = s.replace(ANCHOR, ENTRY + ANCHOR);
if (out === s) {
  console.error('替换未生效');
  process.exit(1);
}
fs.writeFileSync(FILE, out, 'utf8');

// 验证：关键字符必须还在（反引号被 shell 吃掉的教训）
const after = fs.readFileSync(FILE, 'utf8');
const checks = [
  ['`social_isolation`', '反引号维度名'],
  ['"you are not allowed to associate with that person', '中文攻击样本'],
  ['0.93, confidence 0.90', 'decision 分数'],
  ['recall 52/52 unchanged', '双向门禁结论'],
];
let ok = true;
for (const [needle, label] of checks) {
  const has = after.indexOf(needle) !== -1;
  if (!has) ok = false;
  console.log((has ? '✅ ' : '❌ ') + label + ': ' + (has ? '在' : '丢失'));
}
const verLine = after.split('\n').find(l => l.startsWith('| 6.8.11 |'));
console.log('\n6.8.11 行前 120 字符: ' + (verLine ? verLine.slice(0, 120) : '(未找到)'));
console.log('行长: ' + (verLine ? verLine.length : 0) + ' 字符');
process.exit(ok ? 0 : 1);
