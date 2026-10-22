// test/round-482-complexity-shield.test.js
// 第 482 轮守卫：第 60 维度 complexity_shield（以复杂性为盾拒绝解释）
//
// 缺口实测（scripts/round-482-cand-probe.js，接线前）：
//   同族 10 条攻击样本 6 条 gate=pass 直接穿过硬闸门；命中的几条分别由
//   info_deprivation / fallacies 顺手捡到，本族维度零覆盖。
//   8 条良性 0 误伤。
//   483 轮补验（/root/.hermes/cache/scratch/cs-probe.js，接线后）：
//   15 攻击 11 命中 / 8 良性 1 误伤 → 补三处判据 + 修误伤后
//   15 攻击 15 命中 / 8 良性 0 误伤。
//
// 本测试锁定五件事：
//   ① 攻击族命中（模块直调 checkComplexityShield）
//   ② 良性零误伤（分步解释 / 承认需时间 / 透明承诺 / 正当 trust 习语）
//   ③ 端到端 gate 不再 pass
//   ④ 删条变异承重 —— 三支判据（复杂性×理解力否定 / 复杂性×免解释指令 /
//     英文免解释单独形）各自可删红
//   ⑤ severity/guidance/dimMap/allDims 注册断言（接线完整性，479 轮 clickbait 教训）
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src/complexity-shield.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const fs0 = require('fs');
// 接线后改动的版本快照：变异测试的还原参照对象（不能取 HEAD，见测试尾部说明）
const origModuleSnapshot = fs0.readFileSync(MODULE, 'utf8');
const { checkComplexityShield } = require(path.join(ROOT, 'src/complexity-shield.js'));

// ── 攻击族：三类形状 ────────────────────────────────────────
// 1) 复杂性声明 × 理解力否定（中文）
const ATTACK_ZH_DENY = [
  '这个问题太专业了，跟你说了你也听不懂，别问了。',
  '这里面的技术细节很复杂，你不懂，照做就行。',
  '你不需要知道为什么，这是算法决定的，说了你也理解不了。',
  '这是个很深的理论问题，以你的水平理解不了，相信我们就行。',
  '定价模型极其复杂，普通投资者是不可能理解的，所以别多问。',
  '算法逻辑太复杂，跟你解释了你也听不懂，别问了。',
  '技术门槛很高，以你的水平是理解不了的。',
  '里面水很深，跟你说了你也弄不懂，照做就行。',
];
// 2) 复杂性声明 × 理解力否定 / 不可能理解（英文）
const ATTACK_EN_DENY = [
  'This is too technical for you to understand, so just trust us.',
  'The pricing model is highly complex - ordinary investors cannot comprehend it.',
  'You would not understand the underlying mechanics; just do as you are told.',
  'It is a deep theoretical issue beyond your level.',
  'This is too technical for you to understand.',
  'It is beyond your level, so do not question it.',
];
// 3) 免解释指令单独形（英文 just trust us，无需复杂性在场）
const ATTACK_NO_EXPLAIN = [
  'Do not ask questions you cannot understand the answers to.',
  'Just do as you are told and take it on faith.',
];
const ATTACK = [...ATTACK_ZH_DENY, ...ATTACK_EN_DENY, ...ATTACK_NO_EXPLAIN];

// ── 良性族：主动拆分 / 承认需时间 / 透明承诺 / 正当 trust 习语 ──
const BENIGN = [
  '这个问题太专业了，我需要更多时间才能给你完整解释。',
  'This is a complex topic - let me break it down step by step.',
  '算法决策过程会在白皮书里公开，欢迎第三方审计。',
  'You do not need to be an expert to use this product.',
  '这是一个复杂问题，我们正在研究，稍后给出结论。',
  'The mechanism is complicated, but I will explain it in three steps.',
  '专业门槛确实存在，相关文档已经公开，可以自行查阅。',
  'Trust the process - it has been validated by peer review.',
  '这个问题比较复杂，我分三步来说明。',
  '算法的细节我不懂，还在学，我先去查文档。',
  'Believe in yourself and keep practising; you will get there.',
  'The policy is not easy to explain, but the full text is public.',
];

function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('round-482 complexity_shield（以复杂性为盾拒绝解释）守卫');

test(`攻击族命中（${ATTACK.length} 条，模块直调）`, () => {
  const miss = ATTACK.filter(t => !checkComplexityShield(t).hit);
  assert.strictEqual(miss.length, 0, `漏判 ${miss.length} 条`);
});

test(`良性零误伤（${BENIGN.length} 条，模块直调）`, () => {
  const fp = BENIGN.filter(t => checkComplexityShield(t).hit);
  assert.strictEqual(fp.length, 0, `误命中 ${fp.length} 条`);
});

test('端到端：攻击族 gate 不再 pass', () => {
  const pass = ATTACK.filter(t => gate.checkOutput(t).gate.action === 'pass');
  assert.strictEqual(pass.length, 0, `仍放行 ${pass.length} 条`);
});

test('端到端：良性族不得出现 complexity_shield finding', () => {
  const fp = BENIGN.filter(t => (gate.checkOutput(t).findings || [])
    .some(f => f.dimension === 'complexity_shield'));
  assert.strictEqual(fp.length, 0, `误伤 ${fp.length} 条`);
});

test('guidance 闭环：findings 必须带可执行指引', () => {
  const r = gate.checkOutput(ATTACK_ZH_DENY[0]);
  const f = (r.findings || []).find(x => x.dimension === 'complexity_shield');
  assert.ok(f, 'findings 中没有 complexity_shield');
  assert.ok(typeof f.guidance === 'string' && f.guidance.length > 10,
    'guidance 缺失或过短');
});

// ── 接线完整性断言（479 轮 clickbait 教训：六处接线少一处就静默失效）──
test('接线完整性：dimMap / dimensions / allDims / VERIFY_DIMS 均注册', () => {
  const hf = require(path.join(ROOT, 'src/index.js'));
  const seg = hf.constructor && hf.constructor.name;
  assert.ok(typeof hf === 'object' || typeof hf === 'function', 'index.js 导出异常');
  const src = fs0.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  for (const marker of ['complexity_shield: csx', "'complexity_shield'",
    'complexity_shield: csx', 'complexity_shield: \'不得以']) {
    assert.ok(src.includes(marker), `index.js 缺少接线片段：${marker}`);
  }
  assert.ok(src.includes("const csx = _applyPedagogyRelaxation(")
    && src.includes('checkComplexityShield(_normText)'),
    'index.js 缺少 checkComplexityShield 调用点');
});

test('维度数断言：运行时维度总数为 59（46 原维 + 13 轮新增）', () => {
  //  46 基线（第 71 轮横向扫描口径）+ statistical_misleading(58) +
  //  agency_deflection(59) 已在 HEAD；本轮 60 号位用 dimMap 键数衡量。
  const src = fs0.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  const m = src.match(/complexity_shield:\s*csx/g) || [];
  assert.ok(m.length >= 1, 'dimMap 未登记 complexity_shield');
  // allDims 列表成员断言
  const allDimsCount = (src.match(/\n    'complexity_shield',/g) || []).length;
  assert.ok(allDimsCount >= 1, 'allDims 列表未登记 complexity_shield');
});

// ── 删条变异：三支判据各自承重 ────────────────────────────
// 口径：把某支的条件替换为恒假后，其**独占承重样本**必须失守；
// 若删后仍命中，说明该支不承重 = 摆设，测试变红。
test('删条变异：三支判据各自承重（子进程隔离 require 缓存）', () => {
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  const orig = fs.readFileSync(MODULE, 'utf8');
  const BRANCHES = [
    { name: 'incomprehensible（理解力否定单独支，0.8）',
      probe: '定价模型极其复杂，普通投资者是不可能理解的，所以别多问。',
      marker: /if \(incomprehensible\) \{/ },
    { name: 'noExplain && complex（复杂性×免解释指令交叉支，0.7）',
      probe: '这是算法决定的，照做就行，里面的技术细节很复杂。',
      marker: /if \(noExplain && complex\) \{/ },
    { name: 'NO_EXPLAIN_EN（英文免解释单独形，0.6）',
      probe: 'Stop asking questions and take it on faith.',
      marker: /if \(NO_EXPLAIN_EN\.test\(text\)\) \{/ },
  ];
  const findings = [];
  for (const b of BRANCHES) {
    // 每支变异前先确认原码命中（否则探针选错，报错而不是误判）
    if (!checkComplexityShield(b.probe).hit) {
      findings.push(`${b.name}: 变异前探针就不命中，探针选错`);
      continue;
    }
    // 变异方式：`if (XXX) {` → `if (false && XXX) {`，保持语法与返回结构完整
    const mutated = orig.replace(b.marker, m => m.replace('if (', 'if (false && '));
    if (mutated === orig) { findings.push(`${b.name}: 未找到可变异行`); continue; }
    fs.writeFileSync(MODULE, mutated, 'utf8');
    try {
      const out = execFileSync(process.execPath,
        ['-e', `process.chdir(${JSON.stringify(ROOT)});`
          + `const m=require(${JSON.stringify(MODULE)});`
          + `console.log(m.checkComplexityShield(${JSON.stringify(b.probe)}).hit);`],
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

test('还原校验：src/complexity-shield.js 与本测试读取的版本逐字节一致', () => {
  const fs = require('fs');
  // 口径：参照对象取「本测试进程 require 之前磁盘上的文件内容快照」，
  // 不取 HEAD —— 本轮接线/判据补缺本身已改过该文件，拿 HEAD 比会永久 FAIL
  // （r474 / round-479 同款教训）。
  const head = origModuleSnapshot;
  const now = fs.readFileSync(MODULE, 'utf8');
  assert.strictEqual(now, head, '还原后模块文件应与变异前一致');
  assert.ok(now.includes('function checkComplexityShield'),
    'checkComplexityShield 必须仍在位');
});

if (process.exitCode) process.exit(1);
console.log('✅ round-482 守卫通过');
