#!/usr/bin/env node
/**
 * scripts/round-654-changelog.js
 *
 * [r654] README changelog 追加 6.8.8 条目 + 三处版本号 bump。
 * 用脚本写入而不是 python3 -c（反引号会被 shell 吃掉的教训，见 Pitfalls）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const NEW_VERSION = '6.8.8';

const ENTRY = [
  '| 6.8.8 | 2026-10-11 | **A 103rd dimension: severing the relationship itself as the price of compliance.** `relationship_severance` detects the family where terminating the relationship itself is used as the price of the other party\'s present compliance - the relationship\'s existence becomes the collateral, and the other party\'s consent stops being free ("if you do not agree I will treat you as never having been born" / "if you talk back again I will cut off the father-son relationship" / "if you disobey, do not enter this house again" / "unless you admit your mistake now, I will consider you never having had this daughter" / "if you do not do as I say, get out of this house" / "If you do not obey me, I will disown you." / "You will leave this house tonight unless you do exactly as I say."). Both legs must co-occur: a disobedience condition alone ("if you do not agree I will tell your mother") has no severance element, and a severance statement alone ("parents may express disappointment, but should not threaten to cut off the relationship") is a normative statement - a value judgement, not a bargaining chip. Why every prior dimension missed it - measured, not assumed: 4 of 7 attack samples passed the hard gate, and all 4 were verified at **zero** dimension hits; `emotional_manipulation` scores zero on the flagship sample because the sentence is a pure condition-consequence structure with no emotion word; `double_bind` needs contradictory instructions, which this family does not have; `commitment_coercion` / `favor_ledger` / `investment_as_debt` / `suffering_capital` all monetise promises, favours, resources or suffering, none of which this family involves - the collateral here is the relationship itself. Kept distinct from the supply-withdrawal family (silence / no dinner / no allowance / no rides): that family withdraws **supplies inside the relationship** while the relationship persists, this family terminates **the relationship itself** (severing ties / disowning / eviction / divorce). Four guards keep it honest: legal and normative statements (evicting a child is illegal in many places / dissolving an adoption requires legal process / cutting off family should be a last resort after real harm), legitimate emotional expression (parents may be disappointed / need a few days to cool off), severance coercion as the *object of analysis* (treating severance as a bargaining chip is the practice to watch for / threatening to disown someone is a recognised form of coercion), and sentence-initial questions. An implicit-condition branch covers the declarative threat with no if/unless clause at all ("from now on you have no mother" / "From now on you are not my child" / "We will no longer consider you our son") - the time adverbial and the no-longer construction carry the whole threat. Selected by the engine\'s own `decision.decide` on the first pass (0.92, confidence 0.87, identity alignment 100%) from an 8-family probe with already-shipped families auto-skipped; the runner-up (fear projection, 0.91) was scored down for having been runner-up twice before where parent safety education meets fear projection. 16 attack samples now all non-pass on the gate entry point, benign samples unaffected. Bidirectional gate: recall 52/52 unchanged, benign false-positive count unchanged against the baseline. Negative-test script 10/10 - every leg, when blanked, turns the test red, with an 11/11 no-injection control proving the flips are real. |',
].join('\n');

// ── README changelog 追加（插到 6.8.7 行之后）────────────────────────
{
  const p = path.join(HF, 'README.md');
  let s = fs.readFileSync(p, 'utf8');
  const anchor = '| 6.8.7 | 2026-10-11 | **A 102nd dimension: self-harm as coercion.**';
  const idx = s.indexOf(anchor);
  if (idx < 0) { console.log('❌ README.md 找不到 6.8.7 锚点行'); process.exit(1); }
  const lineEnd = s.indexOf('\n', idx);
  s = s.slice(0, lineEnd + 1) + ENTRY + '\n' + s.slice(lineEnd + 1);
  fs.writeFileSync(p, s);
  console.log('✅ README.md changelog 追加 6.8.8 条目');
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

// ── README/SKILL 的口径版本戳 6.8.7 → 6.8.8（r648-r650 先例）─────────
{
  const stampEdits = [
    { file: 'README.md', from: 'Measured on this repository at **v6.8.7**.', to: 'Measured on this repository at **v6.8.8**.', expect: 1 },
    { file: 'SKILL.md', from: 'Every number below was measured on this repository at v6.8.7.', to: 'Every number below was measured on this repository at v6.8.8.', expect: 1 },
    { file: 'SKILL.md', from: '| Engine version | 6.8.7 |', to: '| Engine version | 6.8.8 |', expect: 1 },
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
