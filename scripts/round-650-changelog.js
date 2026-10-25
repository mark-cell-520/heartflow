#!/usr/bin/env node
/**
 * scripts/round-650-changelog.js
 *
 * [r650] README changelog 追加 6.8.7 条目 + 三处版本号 bump。
 * 用脚本写入而不是 python3 -c（反引号会被 shell 吃掉的教训，见 Pitfalls）。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const HF = __HF;

const NEW_VERSION = '6.8.7';

const ENTRY = [
  '| 6.8.7 | 2026-10-11 | **A 102nd dimension: self-harm as coercion.** `selfharm_coercion` detects the family where threatening to harm oneself is used as the price of the other party\'s present compliance - the coercer\'s own body becomes the instrument, and the other party\'s consent stops being free ("if you do not agree I will jump off this building" / "if you dare leave I will kill myself" / "if you divorce me I will slit my wrists" / "if you disobey I will starve myself, see if you can bear to watch" / "I am not taking my medicine again unless you do as I say" / "If you leave me I will kill myself, so you have to stay." / "I will hurt myself unless you do exactly what I say."). Both legs must co-occur: a disobedience condition alone ("if you do not agree I will tell your mother") has no self-harm element, and a self-harm statement alone ("anyone with suicidal thoughts needs immediate crisis intervention") is a distress signal - a call for help, not a bargaining chip. Why every prior dimension missed it - measured, not assumed: 4 of 7 attack samples passed the hard gate with 3 of them at **zero** dimension hits; `emotional_manipulation` catches the calm variant ("if you dare leave, I will kill myself") but scores zero on the condition-first variants because its patterns demand an emotion word in the same breath; `double_bind` catches "if you divorce me I will slit my wrists" as a divorce-vs-wrists conflict but not the semantics of self-harm used as a chip, and misses the condition-first order entirely; `moral_foundations` picks up a harm/care signal on the English "I will hurt myself" without recognising the coercion structure. Four guards keep it honest: genuine crisis-distress and intervention text (anyone with suicidal thoughts needs immediate intervention / call the crisis hotline / depression needs professional treatment), legitimate rules and consequences (clear rules and consequences / time-outs / allowance needs an agreement), self-harm coercion as the *object of analysis* (treating self-harm as a bargaining chip is the practice to watch for / this is coercion by death threat), and sentence-initial questions. **A deliberate conservative boundary, locked in the test:** when a crisis statement co-occurs with the coercion structure in the same sentence ("I said I need crisis intervention, and if you do not agree I will starve myself"), the crisis guard wins and the sentence stays pass - a real person in crisis may also use coercive phrasing, and blocking it would cut off the help channel. That boundary is recorded as an explicit cost, not a missed bug. Selected by the engine\'s own `decision.decide` on the first pass (0.92, confidence 0.88, identity alignment 100%) from a 6-family probe with already-shipped families auto-skipped; the runner-up (fear projection, 0.91) was scored down for the wider guard surface where parent safety education meets fear projection. 14 attack samples now all non-pass on the gate entry point, 18 benign samples unaffected. Bidirectional gate: recall 52/52 unchanged, benign 301/326 unchanged (zero new false positives against the baseline). Negative-test script 9/9 - every leg, when blanked, turns the test red, with an 8/8 no-injection control proving the flips are real. |',
].join('\n');

// ── README changelog 追加（插到 6.8.6 行之后）────────────────────────
{
  const p = path.join(HF, 'README.md');
  let s = fs.readFileSync(p, 'utf8');
  const anchor = '| 6.8.6 | 2026-10-10 | **A 102nd dimension: suffering as capital.**';
  const idx = s.indexOf(anchor);
  if (idx < 0) { console.log('❌ README.md 找不到 6.8.6 锚点行'); process.exit(1); }
  const lineEnd = s.indexOf('\n', idx);
  s = s.slice(0, lineEnd + 1) + ENTRY + '\n' + s.slice(lineEnd + 1);
  fs.writeFileSync(p, s);
  console.log('✅ README.md changelog 追加 6.8.7 条目');
}

// ── 三处版本号 bump ────────────────────────────────────────────────
{
  const p = path.join(HF, 'VERSION');
  fs.writeFileSync(p, NEW_VERSION + '\n');
  console.log('✅ VERSION → ' + NEW_VERSION);
}
{
  const p = path.join(HF, 'package.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.version = NEW_VERSION;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  console.log('✅ package.json version → ' + NEW_VERSION);
}
{
  const p = path.join(HF, 'SKILL.md');
  let s = fs.readFileSync(p, 'utf8');
  const m = s.match(/^version:\s*["']?[\d.]+["']?$/m);
  if (!m) { console.log('❌ SKILL.md 找不到 version 行'); process.exit(1); }
  s = s.replace(m[0], 'version: "' + NEW_VERSION + '"');
  fs.writeFileSync(p, s);
  console.log('✅ SKILL.md version → ' + NEW_VERSION);
}

// ── README/SKILL 的口径版本戳 6.8.6 → 6.8.7（r648/r649 先例）─────────
{
  const stampEdits = [
    { file: 'README.md', from: 'Measured on this repository at **v6.8.6**.', to: 'Measured on this repository at **v6.8.7**.', expect: 1 },
    { file: 'SKILL.md', from: 'Every number below was measured on this repository at v6.8.6.', to: 'Every number below was measured on this repository at v6.8.7.', expect: 1 },
    { file: 'SKILL.md', from: '| Engine version | 6.8.6 |', to: '| Engine version | 6.8.7 |', expect: 1 },
  ];
  for (const e of stampEdits) {
    const p = path.join(HF, e.file);
    let s = fs.readFileSync(p, 'utf8');
    const cnt = s.split(e.from).length - 1;
    if (cnt !== e.expect) { console.log(`❌ ${e.file}: 版本戳 "${e.from.slice(0,40)}" 实测 ${cnt} 处（期望 ${e.expect}）`); process.exit(1); }
    s = s.split(e.from).join(e.to);
    fs.writeFileSync(p, s);
    console.log(`✅ ${e.file}: 版本戳 → ${e.to.slice(0, 50)}`);
  }
}
