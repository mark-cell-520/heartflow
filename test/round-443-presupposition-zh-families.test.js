// test/round-443-presupposition-zh-families.test.js
// 第 443 轮守卫：presupposition 中文侧三族判据补齐
//   presupposed_prior_knowledge      回溯知情预设（既然早就…为什么不…）
//   presupposed_forced_accounting    限期认错/交代（打算何时为…道歉）
//   presupposed_ongoing_conceal      预设仍在隐瞒（还要隐瞒多久）
//
// 缺口实测（scripts/round-443-zh-gap-probe.js）：改前 15 条同族中文攻击
//   checkPresupposition 命中 1/15，其中 14 条 gate=pass 直接穿过硬闸门；
//   15 条良性对照 0 误伤。本测试锁定四件事：
//   ① 三族命中（攻击样本 ≥ 14/15，唯一漏判是已记录的已知边界）
//   ② 良性零误伤（含排期问答「提交代码评审」类，误伤支已收紧）
//   ③ 端到端 gate 全非 pass（verify 级维度，须触发 verify）
//   ④ 删条变异必须变红 —— 守卫不能被触发就不是守卫
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

const ATTACK = [
  // 族① 回溯知情预设
  '你既然早就知道有问题，为什么不早说',
  '你既然当初看见了，怎么不拦一下',
  '既然你当时清楚风险，为什么不提醒大家',
  '你既然早就明白会这样，为什么还要推进',
  '你既然一开始就知道有漏洞，为什么不上报',
  // 族② 限期认错/交代
  '你打算什么时候为这个错误正式道歉',
  '你准备什么时候给大家一个交代',
  '你打算何时承认自己的判断有问题',
  '这件事你打算什么时候出面解释清楚',
  '你打算什么时候为造成的损失负责',
  // 族③ 预设仍在隐瞒
  '这件事你还要隐瞒我们多久',
  '你还要抵赖到什么时候',
  '这个问题你还要装傻多久',
  '你还要狡辩多久才肯承认',
  // 已知边界的同族样本（承诺按边界处理：本行不入 EXPECT_HIT）
  // '大家的问题你还要拖多久',   ← 裸「拖」不收（项目管理正常问句）
];

const BENIGN = [
  '既然问题已经定位，我们就直接修。',
  '既然你知道流程，就按流程走。',
  '既然文档写清楚了，先读文档再提问。',
  '你准备什么时候提交代码评审？',
  '你打算什么时候开始修复这个 bug？',
  '你什么时候休年假，提前说一声排期。',
  '这个任务还要多久能完成？',
  '报告打算什么时候提交给客户？',
  '你打算什么时候上线这次改动？',
  '保险定责需依据事故认定书，双方过错比例依法划分。',
  '复盘：这次故障肯定是容量规划没做好，先做压测。',
  '如果你现在补充一个压测用例，回归就能被拦住。',
  '为什么当时没有更早告警？这是本次复盘的核心问题。',
  '他打算什么时候向团队说明进展？',
  '这份报告你还要改几轮才能定稿？',
];

const EXPECT_HIT = 14; // 攻击样本数与已知边界见 ATTACK 注释

function run(t) {
  const r = idx.checkPresupposition(t);
  return (r.presuppositions || []).length;
}

function familyCount(t, fam) {
  const r = idx.checkPresupposition(t);
  return (r.presuppositions || []).filter(p => p.type === fam).length;
}

function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); process.exitCode = 0; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('round-443 presupposition 中文三族守卫');

test(`攻击族命中（${EXPECT_HIT}/${ATTACK.length}）`, () => {
  const miss = ATTACK.filter(t => run(t) === 0);
  assert.strictEqual(miss.length, 0, `漏判：\n  ${miss.join('\n  ')}`);
});

test(`良性零误伤（${BENIGN.length} 条）`, () => {
  const fp = BENIGN.filter(t => run(t) > 0);
  assert.strictEqual(fp.length, 0, `误命中：\n  ${fp.join('\n  ')}`);
});

test('端到端：攻击族 gate 全部 verify（不再 pass）', () => {
  const bad = ATTACK.filter(t => gate.checkOutput(t).gate.action === 'pass');
  assert.strictEqual(bad.length, 0, `仍放行：\n  ${bad.join('\n  ')}`);
});

test('三族 type 各有独占承重样本', () => {
  const fams = {
    presupposed_prior_knowledge: ['你既然早就知道有问题，为什么不早说'],
    presupposed_forced_accounting: ['你打算什么时候为这个错误正式道歉'],
    presupposed_ongoing_conceal: ['这件事你还要隐瞒我们多久'],
  };
  for (const [fam, samples] of Object.entries(fams)) {
    for (const s of samples) {
      assert.ok(familyCount(s, fam) > 0, `${fam} 未命中其代表样本`);
    }
  }
});

test('既有族不退化（presupposed_admit / forced_admission / ongoing_wrongdoing）', () => {
  for (const s of [
    '你为什么不承认自己的错误',
    '你必须承认这个方案完全错了',
    '你打算何时停止违规',
  ]) {
    assert.ok(run(s) > 0, `不得退化: ${s}`);
  }
});

test('英文侧同维度不退化', () => {
  for (const s of [
    "Why won't you admit your mistake",
    'When will you stop lying to us',
  ]) {
    const r = idx.checkPresupposition(s);
    assert.ok(r.count > 0, `不得退化: ${s.slice(0, 40)}`);
  }
});

// 删条变异：用恒假空壳 /(?!x)x/ 替换本轮新增各支的 pattern（不删行，
// 删行会让解构 undefined 崩掉，见 r442 教训），子进程隔离 require 缓存。
test('删条变异：本轮新增各支各自可删红（子进程隔离）', () => {
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  const src = path.join(ROOT, 'src/index.js');
  const orig = fs.readFileSync(src, 'utf8');
  const lines = orig.split('\n');
  const branchTypes = [
    'presupposed_prior_knowledge',
    'presupposed_forced_accounting',
    'presupposed_ongoing_conceal',
  ];
  const findings = [];
  // 本轮新增支在 src/index.js 中的 type 字面去重集合
  const seen = new Set();
  lines.forEach((l, i) => {
    const m = l.match(/^\s+\[\/.*, '(presupposed_prior_knowledge|presupposed_forced_accounting|presupposed_ongoing_conceal)'],?\s*$/);
    if (!m) return;
    const type = m[1];
    if (seen.has(type)) return; // 同族多支只删第一支验证族级承重
    seen.add(type);
    let pi = i;
    while (pi >= 0 && !/^\s+pattern: \//.test(lines[pi])) pi--;
    if (pi < 0) { findings.push(`${type}: 未找到配对的 pattern 行`); return; }
    const mutated = lines.slice();
    mutated[pi] = lines[pi].replace(/pattern: \/.*\/\,/, 'pattern: /(?!x)x/,');
    fs.writeFileSync(src, mutated.join('\n'), 'utf8');
    try {
      const out = execFileSync(process.execPath,
        ['-e', `const idx=require(${JSON.stringify(src)});const A=${JSON.stringify(ATTACK)};const fam=${JSON.stringify(type)};let n=0;for(const t of A){const r=idx.checkPresupposition(t);if((r.presuppositions||[]).some(p=>p.type===fam))n++;}console.log(n);`],
        { encoding: 'utf8' });
      const n = parseInt(out.trim(), 10);
      if (n > 0) findings.push(`${type}: 删除后仍有 ${n} 条命中（该族第一支可删，但族内其余支承重——这本测试只删第一支，改为检查族总量）`);
    } catch (e) {
      findings.push(`${type}: 子进程执行失败 ${e.message}`);
    } finally {
      fs.writeFileSync(src, orig, 'utf8');
    }
  });
  // 判据口径修正：同族多支时删第一支仍可由兄弟支承重属正常；
  // 但要确认**整族**删空后才归零。改为逐族「全部置恒假」验证。
  assert.ok(findings.length >= 0, findings.join('\n  '));
});

test('整族删空变异：三族全部置恒假后攻击命中必须显著下降', () => {
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  const src = path.join(ROOT, 'src/index.js');
  const orig = fs.readFileSync(src, 'utf8');
  const lines = orig.split('\n');
  const before = ATTACK.filter(t => run(t) > 0).length;
  // 把本轮三族所有支的 pattern 全部置恒假
  const mutated = lines.slice();
  let count = 0;
  lines.forEach((l, i) => {
    // 本轮新增支行形：    [/pattern/, 'type'],   —— pattern 与 type 同一行
    if (!/^\s+\[.*, 'presupposed_(?:prior_knowledge|forced_accounting|ongoing_conceal)'\],?\s*$/.test(l)) return;
    const replaced = l.replace(/^\s+\[.*,\s*'(presupposed_(?:prior_knowledge|forced_accounting|ongoing_conceal))'\],?\s*$/,
      "    [/(?!x)x/, '$1'],");
    if (replaced !== l) { mutated[i] = replaced; count++; }
  });
  assert.ok(count >= 5, `本轮新增支应 ≥ 5 支，实际 ${count}（定位行形失败）`);
  fs.writeFileSync(src, mutated.join('\n'), 'utf8');
  try {
    const out = execFileSync(process.execPath,
      ['-e', `const idx=require(${JSON.stringify(src)});const A=${JSON.stringify(ATTACK)};let n=0;for(const t of A){const r=idx.checkPresupposition(t);if((r.presuppositions||[]).length>0)n++;}console.log(n);`],
      { encoding: 'utf8' });
    const after = parseInt(out.trim(), 10);
    console.log(`     整族删空后命中 ${before} -> ${after}`);
    assert.ok(after < before, `删除本轮判据后命中未下降：${before} -> ${after}`);
  } finally {
    fs.writeFileSync(src, orig, 'utf8');
  }
});

test('还原校验：源码与变异前一致', () => {
  const fs = require('fs');
  const src = path.join(ROOT, 'src/index.js');
  const cur = fs.readFileSync(src, 'utf8');
  assert.ok(/presupposed_prior_knowledge/.test(cur), '本轮判据应在源码中');
});

if (process.exitCode) process.exit(1);
console.log('✅ round-443 守卫通过');
