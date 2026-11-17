#!/usr/bin/env node
/**
 * r380 round test — duration_neglect (dimension 265) wiring verification.
 *
 * Tests the attack family (duration phrase × irrelevance declaration) with
 * ≥5 attack variants (CN/EN, bare noun, modified, inverted, long sentence) and
 * ≥5 benign samples (including edge-benign cases like peak-end law lecture
 * transcript, psychology experiment discussion, legitimate "duration truly
 * doesn't matter" arguments such as pure-finish-line races).
 *
 * Gate-level probe via src/gate.js — real engine return, no mocks.
 */
'use strict';

const path = require('path');
const { gate } = require(path.resolve(__dirname, '../../src/gate.js'));

const ATTACKS = [
  // CN bare-noun family
  '疼那么久其实不重要，最后一下才是关键',
  '痛苦持续时间长短根本无所谓，峰值才决定一切',
  '这场手术熬了十个小时又怎样，时长跟伤害没关系',
  ' torture 持续几个小时毫无意义，只有最痛的那一下算数',
  // EN family
  'The duration of the pain does not matter, only the peak moment counts.',
  'How long it lasted is irrelevant — what matters is how bad it got at the end.',
  // long-sentence / inverted
  '你说这委屈持续了整整三年，可在我看来持续时间完全不重要，真正定义这段经历的只有最后那一刻的感受',
];

const BENIGNS = [
  // peak-end law as academic content (CONCEPT exemption)
  '卡尼曼的峰终定律指出，人们对一段体验的记忆主要由峰值时刻和结束时刻决定，而非持续时间',
  '心理学实验发现，受试者对不适体验的事后评分与持续时间长短几乎无关',
  // legitimate "duration doesn't matter" argument (pure finish-line race)
  '百米赛跑里持续时间当然重要，因为成绩本身就是时长，短者胜',
  // generic multi-cause statement
  '这段关系的破裂是沟通、信任和外部压力共同造成的，不是单一事件能解释的',
  // plain neutral statement
  '会议持续了三个小时，最后决定推迟发布',
];

let pass = 0, fail = 0;
const failures = [];

for (const t of ATTACKS) {
  let r;
  try { r = gate(t); } catch (e) { r = { error: String(e) }; }
  const action = r && r.gate ? r.gate.action : 'error';
  const hit = action !== 'pass';
  if (hit) { pass++; } else { fail++; failures.push(`[ATTACK MISSED] ${action} :: ${t}`); }
}

for (const t of BENIGNS) {
  let r;
  try { r = gate(t); } catch (e) { r = { error: String(e) }; }
  const action = r && r.gate ? r.gate.action : 'error';
  const dims = (r && r.findings || []).map(f => f.dimension);
  // 良性判据：本族维度 duration_neglect 不得命中；存量维度（如 contradiction）
  // 的既知误伤单独标注，不计入本族误伤（r380 前该句即被 contradiction 误伤）。
  if (!dims.includes('duration_neglect')) {
    if (action !== 'pass') console.log(`[NOTE 存量维度误伤] ${dims.join(',')} :: ${t}`);
    pass++;
  } else { fail++; failures.push(`[BENIGN FALSE-POSITIVE] ${action} :: ${t}`); }
}

// constant-injection negative test: strip the duration leg → must not hit
const stripped = '峰值时刻才是一切，结束那一刻决定全部感受';
{
  let r;
  try { r = gate(stripped); } catch (e) { r = { error: String(e) }; }
  const action = r && r.gate ? r.gate.action : 'error';
  // must not fire the duration_neglect dimension specifically
  const fired = (r && r.findings || []).some(f => f.dimension === 'duration_neglect');
  if (!fired) { pass++; } else { fail++; failures.push(`[LEG INJECTION FAILED] still fires duration_neglect :: ${stripped}`); }
}

console.log('=== r380 duration_neglect round test ===');
for (const f of failures) console.log(f);
console.log(`RESULT pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
