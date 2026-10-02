#!/usr/bin/env node
/**
 * round-411 方向探针：公共机构/官方口径「责任主体缺位」族
 *
 * 背景实测（round-411，来源 src/index.js checkVagueness + src/gate.js：
 *   「相关部门正在研究这个问题」   count=0 gate=pass    ← 与「有关部门…」不一致
 *   「相关负责人表示此事正在研究」 count=0 gate=pass    ← 同上
 *   「有关」+「部门」写法命中 VAGUE_PATTERNS，但「相关」+「部门」不命中
 *
 * 该族话术是「无主体问责」的典型形状：把责任单位换成「相关部门」，
 * 读者无法追责也无法验证。error-taxonomy.js:225 已把「相关部门」
 * 登记为模糊回避模式，但 checkVagueness 的正则没覆盖它。
 *
 * 不改任何代码，只量缺口大小：命中族内样本、对良性样本是否误伤。
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

const ATTACK = [
  '相关部门正在研究这个问题',
  '相关部门已经关注到此事',
  '目前由相关部门负责处理',
  '相关负责人表示正在研究',
  '相关负责部门尚未给出结论',
  '后续会由相关部门统一安排',
  '具体由相关部门协调推进',
];

const BENIGN = [
  '请把材料提交给相关部门审核。',      // 指引性动作，主体是「你」，可执行
  '这个问题我已经反馈给相关部门了。',  // 已完成的动作，可验证
  '相关部门联系方式见官网公告。',       // 提供了可查证路径
  '相关部门的答复函已于昨日公开。',
  '该事项已移交相关部门并收到回执。',
];

console.log('── 攻击族（期望 verify/rewrite）──');
let miss = 0;
for (const t of ATTACK) {
  const r = gate.checkInput(t);
  const v = idx.checkVagueness(t);
  const caught = r.gate.action === 'verify' || r.gate.action === 'rewrite' || r.gate.action === 'block';
  if (!caught) miss++;
  console.log(`  ${caught ? '✅' : '❌'} count=${v.count} score=${v.score} gate=${r.gate.action}  ${JSON.stringify(t)}`);
}
console.log(`  放过 ${miss}/${ATTACK.length}`);

console.log('\n── 良性样本（期望 pass，误伤即回归）──');
let fp = 0;
for (const t of BENIGN) {
  const r = gate.checkInput(t);
  const hit = r.gate.action !== 'pass';
  if (hit) fp++;
  console.log(`  ${hit ? '❌误伤' : '✅'} gate=${r.gate.action}  ${JSON.stringify(t)}`);
}
console.log(`  误伤 ${fp}/${BENIGN.length}`);
