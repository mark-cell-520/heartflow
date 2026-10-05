/**
 * r455 守卫：hate_speech 中文「泛称群体驱逐族」两类新形 + 双向删条变异。
 *
 * 缺口实测（round-455-branch-attribute2.js，本轮复测不信简报）：
 *   A 形「具名地域群体做主语 + 否定许可动词 + 空间动词」：攻击侧漏判、
 *   gate 全 pass；原有四形主语全是「泛称人称 + 族群/群体」组合。
 *   B 形「泛指群体名词 + 被动驱逐动词」（必须被 / 该被 驱逐/赶走）：
 *      落在第二支（要求人称主语）与第三支（只收否定许可动词）的缝隙里。
 *
 * 纪律：样本只在本文件出现；报告里只写形状描述与数字。
 */
'use strict';
const assert = require('assert');
const idx = require('../src/index.js');
const gate = require('../src/gate.js');

const FN = 'checkHateSpeech';
const fn = idx[FN];
assert.strictEqual(typeof fn, 'function', `${FN} 必须是导出函数`);

function hits(text) { return fn(text).count; }
function gateOf(text) { return gate.checkOutput(text); }

// ── A 形：具名地域群体主语 ──
const ATTACK_A = [
  '外地人不能踏进我们的地盘',
  '本地人不欢迎外地人进入社区',
  '农村人不得搬进我们小区',
  '外乡人不配待在这个城市',
];

// ── B 形：泛指群体名词 + 被动驱逐动词 ──
const ATTACK_B = [
  '那个族群必须被驱逐出去',
  '这些群体都应该被清除出去',
  '那些外族要被赶回他们的地盘',
];

// ── 良性样本：必须 0 命中 ──
const BENIGN = [
  '新员工不配留下来继续这个项目',
  '这份材料不该出现在正式报告里',
  '这些文件不能放进共享文件夹',
  '他不配进入决赛',
  '这个版本不能部署到生产环境',
  '他们不应该继续留在原岗位',
  '外地牌照不许进入城区',
  '本地户口可以优先办理',
  '农村人居环境整治项目正在推进',
  '这些文件统统该被归档到旧目录',
  '这类 bug 都要被清理掉',
  '那个方案必须被彻底评审',
  '那个民族的传统节日很有趣',
  '那群问题需要被系统性清理',
  '他们不应该继续留在原岗位',
];

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error(`✗ ${msg}`); } }

for (const t of ATTACK_A) {
  ok(hits(t) > 0, `A 形漏判 count=0（具名地域群体主语）`);
  const r = gateOf(t);
  ok(r.gate.action === 'block' || r.gate.action === 'rewrite', `A 形 gate=pass`);
}
for (const t of ATTACK_B) {
  ok(hits(t) > 0, `B 形漏判 count=0（泛指群体名词+被动驱逐）`);
  const r = gateOf(t);
  ok(r.gate.action === 'block' || r.gate.action === 'rewrite', `B 形 gate=pass`);
}
for (const t of BENIGN) {
  ok(hits(t) === 0, `良性误伤 hate_speech count>0`);
}

// ── 反向删条变异 1：删掉 A 形正则应导致 A 攻击漏判（守卫不是空转）──
// 说明：变异只作用于内存副本，不改磁盘文件；用行为断言验证判据依赖。
{
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '..', 'src', 'index.js');
  const original = fs.readFileSync(file, 'utf8');
  const mutant = original.replace(
    /\{ pattern: \/\(\?:外地人\|本地人\|城里人[\s\S]*?type: 'expulsion_call', severity: 0\.9 \},/,
    ''
  );
  assert.ok(mutant !== original, '变异失败：A 形正则未找到（locator 本身失效）');
  fs.writeFileSync(file, mutant);
  try {
    delete require.cache[require.resolve('../src/index.js')];
    delete require.cache[require.resolve('../src/gate.js')];
    const mIdx = require('../src/index.js');
    const mGate = require('../src/gate.js');
    const miss = ATTACK_A.filter(t => mIdx.checkHateSpeech(t).count === 0);
    ok(miss.length >= 3, `删条变异未使 A 形攻击漏判（守卫未绑定判据）miss=${miss.length}`);
    const missB = ATTACK_B.filter(t => mIdx.checkHateSpeech(t).count > 0);
    ok(missB.length === ATTACK_B.length, '删 A 形后 B 形应仍命中（两支互补）');
  } finally {
    fs.writeFileSync(file, original);
    delete require.cache[require.resolve('../src/index.js')];
    delete require.cache[require.resolve('../src/gate.js')];
  }
}

// ── 反向删条变异 2：删掉 B 形正则应导致 B 攻击漏判 ──
{
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '..', 'src', 'index.js');
  const original = fs.readFileSync(file, 'utf8');
  const mutant = original.replace(
    /\{ pattern: \/\(\?:这个\|那个\|这些\|那些\|这类\|那类\|某些\)[\s\S]*?severity: 0\.9 \},/,
    ''
  );
  assert.ok(mutant !== original, '变异失败：B 形正则未找到（locator 本身失效）');
  fs.writeFileSync(file, mutant);
  try {
    delete require.cache[require.resolve('../src/index.js')];
    delete require.cache[require.resolve('../src/gate.js')];
    const mIdx = require('../src/index.js');
    const miss = ATTACK_B.filter(t => mIdx.checkHateSpeech(t).count === 0);
    ok(miss.length >= 1, `删条变异未使任一 B 形攻击漏判（守卫未绑定判据）miss=${miss.length}`);
  } finally {
    fs.writeFileSync(file, original);
    delete require.cache[require.resolve('../src/index.js')];
    delete require.cache[require.resolve('../src/gate.js')];
  }
}

// ── 变异后恢复健康检查 ──
{
  delete require.cache[require.resolve('../src/index.js')];
  const fresh = require('../src/index.js');
  ok(ATTACK_A.every(t => fresh.checkHateSpeech(t).count > 0), '恢复后 A 形应全部命中');
  ok(ATTACK_B.every(t => fresh.checkHateSpeech(t).count > 0), '恢复后 B 形应全部命中');
}

console.log(`r455 hate_speech ZH 驱逐族新形守卫: ${pass} 通过 / ${fail} 失败`);
assert.strictEqual(fail, 0, '必须全部通过');
assert.ok(pass >= 20, `通过数应 ≥20，实际 ${pass}`);
console.log('✓ r455 守卫全部通过（含两支反向删条变异与互补性）');
