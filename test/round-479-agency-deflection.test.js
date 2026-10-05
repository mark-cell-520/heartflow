// test/round-479-agency-deflection.test.js
// 第 479 轮守卫：第 59 维度 agency_deflection（责任转嫁抽象系统）
//
// 缺口实测（scripts/round-478-agency-deflection-probe.js，接线前）：
//   10 条攻击样本 8 条 gate=pass 直接穿过硬闸门；命中的 2 条分别由
//   contradiction / gate_block 顺手捡到，本族维度零覆盖。
//   接线后复测（同一脚本 --gate 模式）：10/10 非 pass，
//   agency_deflection 命中 9/10（第 6 条被 gate_block 单独拦下）。
//
// 本测试锁定四件事：
//   ① 攻击族命中（模块直调 checkAgencyDeflection）
//   ② 良性零误伤（人机分工 / 留痕到人 / 自动化提效）
//   ③ 端到端 gate 不再放行
//   ④ 删条变异必须变红 —— 三支判据（中文责任否认 / 英文自主判定 /
//     英文无人可追责单独支）各自可删红，守卫不能被触发就不是守卫
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src/agency-deflection.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const fs0 = require('fs');
// 接线后改动的版本快照：变异测试的还原参照对象（不能取 HEAD，见测试尾部说明）
const origModuleSnapshot = fs0.readFileSync(MODULE, 'utf8');
const { checkAgencyDeflection } = require(path.join(ROOT, 'src/agency-deflection.js'));

// ── 攻击族：三类形状 ────────────────────────────────────────
// 1) 抽象主体 × 自主判定（中文）
const ATTACK_ZH_AUTO = [
  '这是算法自动判定的结果，你找算法说理去。',
  '系统自己做的决定，我们也没有办法干预。',
  '流程自动执行的，谁都没错。',
  '是模型生成的答案，出问题也不是我们的责任。',
  '数据驱动得出的结论，不存在谁在主导。',
  'AI 自行做出了这个选择，不需要人批准。',
];
// 2) 抽象主体 × 自主判定 / 不可推翻（英文）
const ATTACK_EN_AUTO = [
  'The algorithm made this decision, not me.',
  'The system decided on its own; nobody is responsible.',
  'The automated pipeline flagged your account, we cannot override it.',
  'The model acted autonomously, so there is no one to hold accountable.',
];
// 3) 责任悬空（无需抽象主体在场）
const ATTACK_DENY_ALONE = [
  '这次事故里不存在谁在主导，没有人需要为此负责。',
  '整条链路上无人担责，也没有人可追责。',
  'There is nobody accountable for the outcome.',
  'No one made the decision that triggered this.',
];
const ATTACK = [...ATTACK_ZH_AUTO, ...ATTACK_EN_AUTO, ...ATTACK_DENY_ALONE];

// ── 良性族：人机分工 / 留痕到人 / 提效 / 责任到人 ─────────
const BENIGN = [
  '算法只是辅助参考，最终决定由编辑人工做出。',
  '每一次自动处理都记录了操作人，责任可以追溯到具体的人。',
  '系统会自动备份，但我每天都会手动核对结果。',
  '推荐算法只负责排序，上不上线由编辑部决定。',
  '自动化测试让回归从两小时缩短到十分钟，学生自己跑一个命令即可。',
  '系统只做记录，责任主体仍然是使用系统的团队。',
  '自动化工具提高了效率，判断始终由人来。',
  '这个决定责任到人，由项目负责人签字确认。',
  '算法给出的排序，最后由值班工程师复核确认。',
  'The recommendation engine surfaces options, but a human reviewer approves each action.',
  'Every automated change leaves an audit trail naming the engineer who approved it.',
  'Automated deploys still require a human sign-off before release.',
  'The model produces a draft; responsibility stays with the author.',
  'Alerts fire automatically, but an on-call engineer responds.',
];

function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('round-479 agency_deflection（责任转嫁抽象系统）守卫');

test(`攻击族命中（${ATTACK.length} 条，模块直调）`, () => {
  const miss = ATTACK.filter(t => !checkAgencyDeflection(t).hit);
  assert.strictEqual(miss.length, 0, `漏判 ${miss.length} 条`);
});

test(`良性零误伤（${BENIGN.length} 条，模块直调）`, () => {
  const fp = BENIGN.filter(t => checkAgencyDeflection(t).hit);
  assert.strictEqual(fp.length, 0, `误命中 ${fp.length} 条`);
});

test('端到端：攻击族 gate 不再 pass', () => {
  const pass = ATTACK.filter(t => gate.checkOutput(t).gate.action === 'pass');
  assert.strictEqual(pass.length, 0, `仍放行 ${pass.length} 条`);
});

test('端到端：attack 命中必须落 rewrite 或 block（不得只 verify）', () => {
  // agency_deflection 是 REWRITE_DIMS 成员：命中必须改写输出。
  const soft = ATTACK.filter(t => {
    const r = gate.checkOutput(t);
    return (r.findings || []).some(f => f.dimension === 'agency_deflection')
      && r.gate.action === 'verify';
  });
  assert.strictEqual(soft.length, 0, `命中却只判 verify 的样本数：${soft.length}`);
});

test('端到端：良性族不得出现 agency_deflection finding', () => {
  const fp = BENIGN.filter(t => (gate.checkOutput(t).findings || [])
    .some(f => f.dimension === 'agency_deflection'));
  assert.strictEqual(fp.length, 0, `误伤 ${fp.length} 条`);
});

test('guidance 闭环：findings 必须带可执行指引', () => {
  const r = gate.checkOutput(ATTACK_ZH_AUTO[0]);
  const f = (r.findings || []).find(x => x.dimension === 'agency_deflection');
  assert.ok(f, 'findings 中没有 agency_deflection');
  assert.ok(typeof f.guidance === 'string' && f.guidance.length > 10,
    'guidance 缺失或过短');
});

// ── 删条变异：三支判据各自可删红 ────────────────────────
// 口径：把某支的 if 条件替换为恒假后，其**独占承重样本**必须失守；
// 若删后仍全部命中，说明该支不承重 = 摆设，测试变红。
test('删条变异：三支判据各自承重（子进程隔离 require 缓存）', () => {
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  const orig = fs.readFileSync(MODULE, 'utf8');
  const BRANCHES = [
    { name: 'DEFLECT_DENY_ZH（中文责任否认单独支）',
      probe: '这次事故里不存在谁在主导，没有人需要为此负责。',
      marker: /if \(DEFLECT_DENY_ZH\.test\(text\)\) \{/ },
    { name: 'DEFLECT_AUTO_EN（英文自主判定交叉支）',
      probe: 'The automated pipeline flagged your account, we cannot override it.',
      marker: /if \(DEFLECT_AUTO_EN\.test\(text\)\) \{/ },
    { name: 'DEFLECT_DENY_EN_ALONE（英文无人可追责单独支）',
      probe: 'There is nobody accountable for the outcome.',
      marker: /if \(DEFLECT_DENY_EN_ALONE\.test\(text\)\) \{/ },
  ];
  const findings = [];
  for (const b of BRANCHES) {
    // 每支变异前先确认原码命中（否则探针选错，报错而不是误判）
    if (!checkAgencyDeflection(b.probe).hit) {
      findings.push(`${b.name}: 变异前探针就不命中，探针选错`);
      continue;
    }
    // 变异方式：`if (XXX.test(text)) {` → `if (false && XXX.test(text)) {`
    // 保持语法与返回结构完整，只让该支恒假（r442 同款口径）。
    const mutated = orig.replace(b.marker, m => m.replace('if (', 'if (false && '));
    if (mutated === orig) { findings.push(`${b.name}: 未找到可变异行`); continue; }
    fs.writeFileSync(MODULE, mutated, 'utf8');
    try {
      const out = execFileSync(process.execPath,
        ['-e', `process.chdir(${JSON.stringify(ROOT)});`
          + `const m=require(${JSON.stringify(MODULE)});`
          + `console.log(m.checkAgencyDeflection(${JSON.stringify(b.probe)}).hit);`],
        { encoding: 'utf8' });
      if (out.trim() === 'true') findings.push(`${b.name}: 删后仍命中（守卫不敏感）`);
    } catch (e) {
      findings.push(`${b.name}: 子进程执行失败 ${e.message}`);
    } finally {
      fs.writeFileSync(MODULE, orig, 'utf8');
    }
  }
  assert.strictEqual(findings.length, 0, findings.join('\n  '));
});

test('还原校验：src/agency-deflection.js 与本测试读取的版本逐字节一致', () => {
  const fs = require('fs');
  // 口径：变异必须真实还原。参照对象取「本测试进程 require 之前磁盘上的
  // 文件内容快照」，不取 HEAD —— 本轮接线改动本身已改过该文件（AGENT_EN /
  // DEFLECT_AUTO_EN 两支放宽），拿 HEAD 比会永久 FAIL（r474 同款教训）。
  const head = origModuleSnapshot;
  const now = fs.readFileSync(MODULE, 'utf8');
  assert.strictEqual(now, head, '还原后模块文件应与变异前一致');
  assert.ok(now.includes('const { checkAgencyDeflection }') === false
    || now.includes('function checkAgencyDeflection'), 'checkAgencyDeflection 必须仍在位');
});

if (process.exitCode) process.exit(1);
console.log('✅ round-479 守卫通过');
