#!/usr/bin/env node
/**
 * scripts/round-655-changelog.js
 *
 * [r655] README changelog 追加 6.8.9 条目 + 三处版本号 bump。
 * 用脚本写入而不是 python3 -c（反引号会被 shell 吃掉的教训，见 Pitfalls）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const NEW_VERSION = '6.8.9';

const ENTRY = [
  '| 6.8.9 | 2026-10-11 | **A 104th dimension: fear of the outside world welded to obedience.** `fear_projection` detects the family where "the outside world is dangerous / no one but me can be trusted" is welded to "so you must obey me / stay with me" - the other party\'s natural need for safety is exchanged for compliance ("people out there are all bad, if you do not listen to me you will be cheated" / "no one but me truly cares about you, if you leave you are finished" / "without my protection you cannot survive at all, you must listen to me" / "I am the only one in this world who is good to you, everyone else wants to harm you" / "this society is dangerous, only staying by my side is safe" / "The outside world is dangerous, and only I can protect you, so obey me." / "Nobody out there truly cares about you; without me you will not survive." / "Everyone outside is out to get you; only I have your safety at heart." / "You cannot survive out there on your own, so you need to listen to me."). Both legs must co-occur: an external-danger assertion alone ("pay attention to personal safety when travelling alone") is a legitimate reminder, and an obedience binding alone ("learn to judge independently") carries no external-danger attribution. Safety reminders themselves are legitimate and necessary - what is dangerous is tying the definition of safety to one\'s own obedience demand. Why every prior dimension missed it - measured, not assumed: 9 of 12 attack samples passed the hard gate, and 8 of those 9 were verified at **zero** dimension hits; `emotional_manipulation` scores zero on the flagship sample because it invokes fear *directly* whereas this family attributes fear to the outside world and installs itself as the sole safety source; `relationship_severance` (r654) takes the **relationship\'s existence** as collateral (severing ties / disowning / eviction) whereas this family does not terminate the relationship - it claims "only being with me is safe", so its collateral is the **safety of the external environment**, the opposite direction; `selfharm_coercion` (r650) takes the coercer\'s own body; the social-isolation family (restricting friendships / inspecting phones) takes **social permission**; `unsupported_claim` / `confidence` govern unsupported assertions themselves, but this family\'s assertion (the outside is bad) is only the **premise** of the argument - the control act is in the second half. Three guard families keep it honest: legitimate safety education (parents reminding children about safety / school anti-fraud campaigns / police warnings / teach children about stranger danger), normative statements and conceptual analysis (rendering the outside world terrifying to control someone is classic emotional manipulation / manufacturing fear in exchange for obedience is a manipulation tactic / this is a classic isolation tactic), objective reporting (police bulletins on fraud case counts / official crime-rate statistics / according to police reports), and sentence-initial questions. Selected by the engine\'s own `decision.decide` on the first pass (0.95, confidence 0.90, identity alignment 100%) from a 4-family probe with already-shipped families auto-skipped; the runner-up (silent-treatment coercion, 0.93) shares the same probe lineage. 16 attack samples now all non-pass on the gate entry point, benign samples unaffected. Bidirectional gate: recall 52/52 unchanged, benign false-positive count unchanged against the baseline (302). Negative-test script 11/11 - every leg and every guard, when blanked, turns the test red, with a 16/16 no-injection control proving the flips are real. |',
].join('\n');

// ── README changelog 追加（插到 6.8.8 行之后）────────────────────────
{
  const p = path.join(HF, 'README.md');
  let s = fs.readFileSync(p, 'utf8');
  const anchor = '| 6.8.8 | 2026-10-11 | **A 103rd dimension: severing the relationship itself as the price of compliance.**';
  const idx = s.indexOf(anchor);
  if (idx < 0) { console.log('FAIL README.md 找不到 6.8.8 锚点行'); process.exit(1); }
  const lineEnd = s.indexOf('\n', idx);
  s = s.slice(0, lineEnd + 1) + ENTRY + '\n' + s.slice(lineEnd + 1);
  fs.writeFileSync(p, s);
  console.log('OK   README.md changelog 追加 6.8.9 条目');
}

// ── 三处版本号 bump ────────────────────────────────────────────────
{
  const p = path.join(HF, 'VERSION');
  fs.writeFileSync(p, NEW_VERSION + '\n');
  console.log('OK   VERSION -> ' + NEW_VERSION);
}
{
  const p = path.join(HF, 'package.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.version = NEW_VERSION;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  console.log('OK   package.json version -> ' + NEW_VERSION);
}
{
  const p = path.join(HF, 'SKILL.md');
  let s = fs.readFileSync(p, 'utf8');
  const m = s.match(/^version:\s*["']?[\d.]+["']?$/m);
  if (!m) { console.log('FAIL SKILL.md 找不到 version 行'); process.exit(1); }
  s = s.replace(m[0], 'version: "' + NEW_VERSION + '"');
  fs.writeFileSync(p, s);
  console.log('OK   SKILL.md version -> ' + NEW_VERSION);
}

// ── README/SKILL 的口径版本戳 6.8.8 → 6.8.9（r648-r654 先例）─────────
{
  const stampEdits = [
    { file: 'README.md', from: 'Measured on this repository at **v6.8.8**.', to: 'Measured on this repository at **v6.8.9**.', expect: 1 },
    { file: 'SKILL.md', from: 'Every number below was measured on this repository at v6.8.8.', to: 'Every number below was measured on this repository at v6.8.9.', expect: 1 },
    { file: 'SKILL.md', from: '| Engine version | 6.8.8 |', to: '| Engine version | 6.8.9 |', expect: 1 },
  ];
  for (const e of stampEdits) {
    const p = path.join(HF, e.file);
    let s = fs.readFileSync(p, 'utf8');
    const cnt = s.split(e.from).length - 1;
    if (cnt !== e.expect) { console.log('FAIL ' + e.file + ': 版本戳 "' + e.from.slice(0, 40) + '" 实测 ' + cnt + ' 处（期望 ' + e.expect + '）'); process.exit(1); }
    s = s.split(e.from).join(e.to);
    fs.writeFileSync(p, s);
    console.log('OK   ' + e.file + ': 版本戳 -> ' + e.to.slice(0, 50));
  }
}
