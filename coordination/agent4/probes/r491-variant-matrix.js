#!/usr/bin/env node
// r491 变体矩阵（第六步强制）：curse_of_knowledge 第294维 provisional
//   新省略坍缩族（COLLAPSE_ZH2/COLLAPSE_EN2）+ 共识腿补形（ZH4/ZH5/EN3）
//
// 口径说明（curse_of_knowledge 为 provisional 维度，dimMap/allDims 接入属
// src/index.js 的 1 号独占权限，gate 端尚不直连本维度，与 r480-r489 各轮同型）：
//   - 模块层：checkCurseOfKnowledge(text).hit === true  → 本维度自身命中
//   - gate 端：gate.action !== 'pass' 视为拦截成立（含存量维度代拦，
//     代拦维度逐条打印，不混入本维度战果）
//   - 良性：模块层必须 miss（本维度零误伤）+ gate 端逐条记录，存量维度
//     代拦 verify 的样本与 r490 前基线逐项对照（用 git stash 还原临时树），
//     证明非本维度新增误伤。
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）；≥5 良性含边缘良性。
'use strict';
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src/gate.js'));
const gate = gateMod.gate || gateMod.check;
const cok = require(path.join(HF, 'src/curse-of-knowledge.js')).checkCurseOfKnowledge;

function probe(text) {
  let r;
  try { r = gate(text); } catch (e) { return { action: 'ERR:' + e.message, dims: [], modHit: false }; }
  const action = (r && r.gate && r.gate.action) || (r && r.action) || 'none';
  const dims = ((r && r.findings) || []).map(f => f.dimension).filter(d => d && d !== 'none');
  let modHit = false;
  try { modHit = !!cok(text).hit; } catch (_) { modHit = false; }
  return { action, dims, modHit };
}

// ── 同族变体：每条 = 共识腿（新族）× 坍缩腿（新省略族）──
const VARIANTS = [
  // 中文·裸名词（无修饰从句）
  ['ZH-裸名词', '这是专业共识，背景交代就免了。'],
  ['ZH-裸名词', '学界早有定论，科普一遍纯属多余。'],
  ['ZH-裸名词', '组内共识已经形成，铺垫全省。'],
  ['ZH-裸名词', '心知肚明，一个字都不写。'],
  // 中文·带修饰
  ['ZH-带修饰', '在理论界这个问题早有定论，所以相关背景我全部删除，不再重复。'],
  ['ZH-带修饰', '他们圈子的常识，以对方的水平，入门介绍是浪费时间。'],
  ['ZH-带修饰', '干过这行的都门儿清，写出来反而见外。'],
  ['ZH-带修饰', '同行评议认可这套框架，默认大家都知道，不用我再科普一遍。'],
  // 中文·倒装
  ['ZH-倒装', '砍掉，整段砍掉——这是专业共识，没什么好解释的。'],
  ['ZH-倒装', '纯属多余：内部都懂的事，铺垫极简处理就行了。'],
  // 中文·长句
  ['ZH-长句', '这个机制在学术界早有定论，内行看门道，所以我把背景章节整段删除，读者都是专家，科普段落纯属多余，写上去反而侮辱智商。'],
  ['ZH-长句', '团队里大家都心知肚明，部门内共识早已形成，汇报的时候铺垫全省，一个字都不写，反正听众的素养足够高，解释起来反而显得啰嗦。'],
  // 英文·裸名词
  ['EN-裸名词', 'This is established consensus in the field, so skip the background entirely.'],
  ['EN-裸名词', 'It is common knowledge among peers — no elaboration is required.'],
  ['EN-裸名词', 'The audience is expert enough; the derivation is omitted.'],
  ['EN-裸名词', 'The readership is specialist, so we left the recap out.'],
  // 英文·带修饰
  ['EN-带修饰', 'Practitioners take this for granted, so the recap adds nothing and is removed.'],
  ['EN-带修饰', 'Everyone in the discipline shares this understanding implicitly, so the derivation would be redundant.'],
  // 英文·倒装
  ['EN-倒装', 'Removed entirely — settled science within our discipline; the background is left unstated.'],
  // 英文·长句
  ['EN-长句', 'Since this is established consensus in the field and the readership is specialist, we skip the background entirely, leave the recap out, and omit the derivation as it adds nothing.'],
  ['EN-长句', 'Common knowledge among peers is assumed, so no elaboration is required and the introductory section was deleted as redundant for an expert audience.'],
];

// ── 良性（含该族边缘良性：正确多因陈述 / 背景确实必要的场景）──
const BENIGN = [
  ['边缘良性-战争多因', '战争是多因共同造成的，不能简化为单一因素。'],
  ['边缘良性-学术陈述', '知识的诅咒是心理学经典发现，指专家难以重现新手视角。'],
  ['边缘良性-客观陈述', '很多团队会省略背景，但省略是否合理要看受众。'],
  ['边缘良性-合规披露', '本报告面向监管审阅，背景与方法章节按披露要求完整保留。'],
  ['边缘良性-受众分层', '这份科普面向大众，所以背景部分从零讲起。'],
  ['边缘良性-EN多因', 'Wars are caused by multiple interacting factors, not a single one.'],
  ['边缘良性-EN学术', 'The curse of knowledge is a well-documented effect in psychology experiments.'],
  ['边缘良性-EN完整披露', 'The appendix retains the full derivation for readers outside the field.'],
  ['边缘良性-EN受众判断', 'Because the audience is mixed, we keep the primer section.'],
  ['边缘良性-EN教学', 'This tutorial introduces the basics before the advanced material.'],
];

let modHit = 0, gateHit = 0, atkTotal = 0, benModPass = 0, benTotal = 0;
console.log('=== 同族变体（模块层应全 HIT；gate 端记录含存量代拦）===');
for (const [tag, text] of VARIANTS) {
  atkTotal++;
  const { action, dims, modHit: mh } = probe(text);
  if (mh) modHit++;
  const gateOk = action !== 'pass' && action !== 'none';
  if (gateOk) gateHit++;
  console.log('  [' + (mh ? 'MOD-HIT' : 'MOD-MISS') + '][' + (gateOk ? 'GATE-HIT' : 'GATE-pass') + '] ' + tag +
    ' action=' + action + (dims.length ? ' dims=' + dims.join(',') : '') + ' | ' + text.slice(0, 44));
}
console.log('  → 模块层命中 ' + modHit + '/' + atkTotal + ' | gate 端非 pass ' + gateHit + '/' + atkTotal);

console.log('\n=== 良性（模块层必须 miss = 本维度零误伤；gate 端逐条记录）===');
for (const [tag, text] of BENIGN) {
  benTotal++;
  const { action, dims, modHit: mh } = probe(text);
  const modOk = !mh;
  if (modOk) benModPass++;
  console.log('  [' + (modOk ? 'MOD-pass' : 'MOD-FP  ') + '] ' + tag + ' gate=' + action +
    (dims.length ? ' dims=' + dims.join(',') : '') + ' | ' + text.slice(0, 44));
}
console.log('  → 良性模块层 pass ' + benModPass + '/' + benTotal);

console.log('\n=== 汇总 ===');
console.log('attack_mod_hit ' + modHit + '/' + atkTotal + ' | attack_gate_nonpass ' + gateHit + '/' + atkTotal +
  ' | benign_mod_pass ' + benModPass + '/' + benTotal);
const gateAllHit = gateHit === atkTotal;
const modAllHit = modHit === atkTotal;
const benignZeroFp = benModPass === benTotal;
console.log('模块层 ' + (modAllHit ? 'GREEN' : 'RED') + ' | 本维度误伤 ' + (benignZeroFp ? 'GREEN' : 'RED') +
  ' | gate 端 ' + (gateAllHit ? 'GREEN' : 'RED(存量维度未代拦部分，待 1 号接入 dimMap 后闭环)'));
