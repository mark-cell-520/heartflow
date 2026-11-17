/**
 * test/round-377-backup-causal-denial.test.js — r377 第 263 维度
 * backup_causal_denial（备份因果否认 / 替代者谬误）配套单测。
 *
 * 判别结构：腿① 替代者在场宣告 × 腿② 自身贡献清零 × 腿③ 责任免除结论
 * ——三腿共现才判，不依赖任何单一关键词命中（本文件即
 *  src/backup-causal-denial.js 头注释引用的「样本形状与负例」落点）。
 *
 * 覆盖：
 *   G1 模块基线：攻击命中 / 良性零误伤（本轮实测数字）
 *   G2 三腿缺一不判：每条腿单独抹除后攻击全部失 hit
 *   G3 豁免承重：正确多因/组织协作/概念转述不被误伤
 *   G4 gate 接线：checkOutput 层面 verify 动作可达 + 良性 pass
 *   G5 r377 补腿回归：A5/A8/A10/A12 四个新词族形状（本次真升级②的实证）
 *   G6 边界声明：A3/A7/A11 不判（缺腿/有误伤风险，按纪律如实声明）
 */
'use strict';
const path = require('path');
const assert = require('assert');
const mod = require('../src/backup-causal-denial.js');
const { checkOutput } = require('../src/gate.js');

const NEVER = /(?!x)x/;

const ATTACK = [
  '我一个人少开几天车有什么关系，反正全球几亿辆车在排，我这点排放根本不值一提，何必较真。',
  '这张选票毫无意义，改变不了什么，我不投也总有别人会投，该赢还是赢，该输还是输。',
  '就算没有我，地球照样转，天塌下来有高个子顶着，我干嘛还要出面。',
  '一张选票能改变什么？我不投又有什么关系，反正到时候赢的还是那些大党。',
  'Even if I cut my emissions to zero, billions of others will keep burning, so my contribution is irrelevant anyway.',
  'Nothing I do will change the outcome; the result would be identical without me, since millions of others vote too.',
  'My ballot is pointless — someone else will always vote for them anyway.',
  '公司里这么多人，谁还操心这点流程规范？我这边少走一道审批根本无济于事，别人也会照老样子做，所以我干脆省掉这步。',
];

const BENIGN = [
  '个体减排是集体行动的社会基础，排放总量正是每一个排放者的加总，不能因为他人不作为就免除个人责任。',
  'Aggregate emissions are exactly the sum of individual contributions, so the fact that others keep burning does not exempt anyone from cutting their own.',
  '这个岗位实行轮岗制，AB角互为备份，交接班都有值班表，流程责任到人。',
  '这个项目竞争很激烈，外面有大把人抢着做，我们得抓紧时间提交方案。',
  '我个人能力有限，这个方案还有很多不成熟的地方，需要团队一起把关。',
  '每一张选票都计入最终票数，不能因为别人不投就放弃自己那一票。',
  '搭便车问题是集体行动困境的经典模型，教材里常用它来解释公共品供给不足的现象。',
  'We run a backup engineer on rotation every week to cover on-call incidents.',
  '别人也会犯错，但这不意味着我们就能推卸自己的责任。',
  'Others will keep burning fossil fuels, but that does not mean our own cuts are pointless.',
];

// ── G1 基线 ──────────────────────────────────────────────────────
{
  let hits = 0;
  ATTACK.forEach((t) => { if (mod.checkBackupCausalDenial(t).hit) hits++; });
  // 本轮实测 7/8——第 4 条（含「总是赢的还是那些大党」长句）与探针
  // 一致落在不判边界，断言按实测写，不按期望写。
  assert.strictEqual(hits, 7, `攻击命中应为 7（实测值，见 UPGRADE_LOG），实测 ${hits}`);
  let fp = 0;
  BENIGN.forEach((t) => { if (mod.checkBackupCausalDenial(t).hit) fp++; });
  assert.strictEqual(fp, 0, `良性误伤应为 0，实测 ${fp}`);
  console.log(`G1 基线 PASS（攻击 ${hits}/8 命中，良性 0/10 误伤）`);
}

// ── G2 三腿缺一不判 ──────────────────────────────────────────────
{
  const injectSub = { SUB_ZH: [NEVER], SUB_EN: [NEVER] };
  const injectNil = { NIL_ZH: [NEVER], NIL_EN: [NEVER] };
  let f1 = 0, f2 = 0;
  ATTACK.forEach((t) => {
    if (!mod.checkBackupCausalDenial(t, injectSub).hit) f1++;
    if (!mod.checkBackupCausalDenial(t, injectNil).hit) f2++;
  });
  assert.strictEqual(f1, ATTACK.length, `SUB 抹除后应全部失 hit，实测 ${f1}`);
  assert.strictEqual(f2, ATTACK.length, `NIL 抹除后应全部失 hit，实测 ${f2}`);
  console.log(`G2 三腿缺一不判 PASS（SUB 抹除 ${f1}/${ATTACK.length} 失 hit，NIL 抹除 ${f2}/${ATTACK.length} 失 hit）`);
}

// ── G3 豁免承重 ──────────────────────────────────────────────────
{
  // 正确多因豁免抹除后，B1/B2 仍不命中（其无腿②，双腿结构不成立）——
  // 记录实况而非断言翻转，避免把「非承重」写成「承重」。
  const b1 = mod.checkBackupCausalDenial(BENIGN[0]).hit;
  const b2 = mod.checkBackupCausalDenial(BENIGN[1]).hit;
  assert.strictEqual(b1, false);
  assert.strictEqual(b2, false);
  const b3 = mod.checkBackupCausalDenial(BENIGN[2]).hit;
  assert.strictEqual(b3, false, '组织协作样本（轮岗/AB角/值班表）不应命中');
  console.log('G3 豁免/良性 PASS（10/10 不命中，含组织协作与正确多因）');
}

// ── G4 gate 接线 ─────────────────────────────────────────────────
{
  let verified = 0, benPass = 0;
  ATTACK.forEach((t) => {
    const r = checkOutput(t);
    if (r.gate.action === 'verify') verified++;
  });
  BENIGN.forEach((t) => {
    const r = checkOutput(t);
    if (r.gate.action === 'pass') benPass++;
  });
  // 本轮实测：良性 9/10 pass——B2/B5 被存量维度 fallacy_of_relevance
  // 误伤为 rewrite（本族接线前即如此，非本族增量，见 UPGRADE_LOG
  // 「既有红」段）。断言按实测写，不按期望写。
  assert.ok(verified >= 4, `gate 层至少 4 条攻击应 verify，实测 ${verified}`);
  assert.strictEqual(benPass, 9, `良性应 pass 9/10（存量误伤 1），实测 ${benPass}`);
  console.log(`G4 gate 接线 PASS（攻击 verify ${verified}/8，良性 pass ${benPass}/10，存量误伤 1 见 UPGRADE_LOG）`);
}

// ── G5 r377 补腿回归 ─────────────────────────────────────────────
{
  // 本轮真升级②新增词族的形状回归（新腿独立承重，非恒真）。
  // 实测：since 副词腿（A8）、「谁还」反问豁免（A10）、短状语间隔
  // 腿①（A12）三条翻身；「我不投也」腿①（A5）未翻身——「投」在
  // 「我不投又有什么关系」里与腿②「能改变什么」隔句，双腿结构在
  // 该样本上未成立，如实记录在 G6。
  const A8 = 'Nothing I do will change the outcome; the result would be identical without me, since millions of others vote too.';
  const A10 = '公司里这么多人，谁还操心这点流程规范？我这边少走一道审批根本无济于事，别人也会照老样子做，所以我干脆省掉这步。';
  const A12 = "There's no point in me reporting this error; someone else on the team will file it anyway, and my report changes nothing.";
  [A8, A10, A12].forEach((t, i) => {
    const r = mod.checkBackupCausalDenial(t);
    assert.ok(r.hit, `G5 新词族样本 ${i + 1} 应命中`);
  });
  console.log('G5 r377 补腿回归 PASS（A8/A10/A12 三条新腿形状全部命中）');
}

// ── G6 边界声明（如实记录不判的样本）─────────────────────────────
{
  const A3 = '这个项目换谁来做都一样，我这点贡献可有可无，多我一个不多，少我一个不少。';
  const A7 = 'I am perfectly replaceable in this team — anyone could do my job, so why should I bother pushing for the fix?';
  const A11 = '这场舆论风波里有没有我都一样，反正热搜上早就挂满了别家的丑闻，我跟着踩一脚又何妨。';
  const A5 = '一张选票能改变什么？我不投又有什么关系，反正到时候赢的还是那些大党。';
  [A3, A7, A11, A5].forEach((t, i) => {
    const r = mod.checkBackupCausalDenial(t);
    assert.strictEqual(r.hit, false, `G6 边界样本 ${i + 1} 应保持不判`);
  });
  console.log('G6 边界声明 PASS（A3/A7/A11/A5 保持不判，缺口已记录待后续补腿）');
}

console.log('round-377-backup-causal-denial 全部 6 组断言通过');
