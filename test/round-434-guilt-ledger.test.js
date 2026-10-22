/**
 * r434 测试：emotional_manipulation「亏欠账本 × 对价质问」族双侧守卫。
 *
 * 形状描述（不贴攻击原句，样本见 rounds-434-guard-samples.json）：
 *   · 支出半：第一人称主体（我/我们/全家人/父母）+ 支出动词
 *     （付出/牺牲/放弃/省吃俭用/操劳/供养/帮衬/供…）+ 受益对象（你/这个家）
 *   · 追偿半：对得起 / 良心 / 回报 / 报答 / 不忍心 / 舍得 /
 *     寒心 / 连一句（道歉|谢谢）/ 这样对我 / 居然怪我
 *
 * 缺口根因（scripts/round-434-family-probe.js 实测）：
 *   victim_stance 既有三支全部要求**指责转折词在场**（你却/你居然/你竟然），
 *   而账目清单式追讨没有转折词 → ZH 0/5、EN 1/3 全部穿过 rewrite 闸门。
 *
 * 断言口径：gate.action 必须非 pass（rewrite 级维度只要有 finding 就改）。
 */
'use strict';
const assert = require('assert');
const path = require('path');
const samples = require('./round-434-guard-samples.json');

const gate = require(path.resolve(__dirname, '..', 'src', 'gate.js'));
const main = gate.gate ? gate.gate : gate.check;

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; console.error(`✗ ${name}: ${e.message}`); }
}

// ── 攻击样本：支出半 + 追偿半必须命中并改判 ──
for (const [i, s] of samples.attack.entries()) {
  check(`attack[${i}] 被截获`, () => {
    const r = main(s);
    const em = (r.findings || []).find(f => f.dimension === 'emotional_manipulation');
    assert.ok(em, `未命中 emotional_manipulation：${JSON.stringify(r.gate)}`);
    assert.notStrictEqual(r.gate.action, 'pass', `gate 放过：${r.gate.action}`);
  });
}

// ── 良性样本：必须全 pass ──
for (const [i, s] of samples.benign.entries()) {
  check(`benign[${i}] 零误伤`, () => {
    const r = main(s);
    const em = (r.findings || []).find(f => f.dimension === 'emotional_manipulation');
    assert.ok(!em, `误伤：${em && em.details}`);
  });
}

// ── 负例变异：删判据后攻击样本必须漏出（守卫不能是空壳）──
const Mutator = require(path.resolve(__dirname, 'round-434-mutant-runner.js'));
(async () => {
  const M = new Mutator(path.resolve(__dirname, '..', 'src', 'index.js'));
  const baseline = await M.baseline(samples.attack);
  const mutated = await M.mutate(samples.attack);
  check('变异守卫：删判据后命中数下降', () => {
    assert.ok(mutated < baseline,
      `删判据后命中未下降：baseline=${baseline} mutated=${mutated}`);
  });
  console.log(`变异守卫：baseline=${baseline} mutated=${mutated}`);
  console.log(`r434 guilt_ledger 双侧守卫: ${pass} 通过 / ${fail} 失败`);
  if (fail > 0) process.exit(1);
})();
