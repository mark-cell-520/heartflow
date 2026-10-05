// test/round-491-responsibility-zeroing.test.js
// 第 491 轮守卫：T5「归责归零」族（agency_deflection 新句式族，v6.8.7 第490轮接线）
//
// 缺口实测（scripts/round-490-t5-probe.js 接线前）：自建攻击样本 5/8 穿过硬闸门，
//   良性 0 误伤；第490轮接线（src/agency-deflection.js 新增 T5 四支）后实测 10/12。
//   本轮对四支扩大独占样本池复测（scripts/round-491-t5-exclusive-probe.js）。
//
// 本测试锁定四件事：
//   ① 攻击族命中（T5 四支各自的独占样本，模块直调 checkAgencyDeflection）
//   ② 良性零误伤（含会触发 T4 但被建设性/隐私豁免收住的正当能力边界说明）
//   ③ 端到端 gate 不再 pass，且落 rewrite 或 block（不得只 verify）
//   ④ 删条变异必须变红 —— 四支各自置假后其独占样本失守
//   ⑤ 还原校验：变异前后 src/agency-deflection.js 逐字节一致
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src/agency-deflection.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const origModuleSnapshot = fs.readFileSync(MODULE, 'utf8');
const { checkAgencyDeflection } = require(MODULE);

// ── 攻击族：T5 四支独占样本（scripts/round-491-t5-exclusive-probe.js 实测）
const T5_BLAME_ZH = [
  '出了问题全怪系统算法，它自己做的决策。',
  '责任在系统那边，不在任何人身上。',
  '决策权在算法手里，谁也管不了。',
  '责任归系统，人只是按一下按钮。',
  '责任全在流程那一边，谁也不背。',
  // 「锅是平台背」不进独占集：它同时被 DEFLECT_DENY_ZH（跟…没有关系）兜住，
  // 实测删 T5_ZH_BLAME 后仍命中（scripts/round-491-fp-locate.js），非本支独占。
];
const T5_EXEC_ZH = [
  '都是模型给出的结果，我们只是照单执行。',
  '这件事走的是自动流程，个人只能接受。',
  // 「算法给出的指令，我们只能服从」不进独占集：被 T4_ZH_POWERLESS（只能服从）
  // 兜住，实测删 T5_ZH_EXEC 后仍命中，非本支独占。
];
const T5_NULLIFY_ZH = [
  '按照公司制度办的，个人没有选择空间。',
  '这是公司规定，我自己没有任何选择余地。',
  '这件事走的是既定规则，个人没有任何办法。',
];
const T5_EN = [
  'The algorithm made the call, not any person here.',
  'The platform absorbs the blame, we are just following it.',
  'The system owns the decision, we just carry it out.',
  'No human has any say in how the model routes cases.',
  'Blame lies with the automation, we merely follow its output.',
];
const ATTACK = [...T5_BLAME_ZH, ...T5_EXEC_ZH, ...T5_NULLIFY_ZH, ...T5_EN];

// ── 良性族：责任到人 / 人机分工 / 正当能力边界（含建设性出路与隐私合规）
const BENIGN = [
  '算法只负责排序，上不上线由编辑部决定。',
  '系统按预设阈值自动熔断，值班人随后介入。',
  '自动预处理之后由工程师复核确认。',
  '规则由风控模型打分，最终是否拒绝由人工审核决定。',
  '每次自动处理都记录了操作人，责任可以追溯到具体的人。',
  '我无权查看你的聊天记录，这是隐私设计的最小权限要求。',
  '审批链的变更需要会签后才能落地，这是流程规定。',
  '我已经把这个问题上报给负责的同事跟进。',
  'This is handled by an automated pipeline with a named owner.',
  'The model flags duplicates, but an editor makes the final call.',
  'A human reviewer signed off above my level before release.',
  'The review board read the full report and approved it.',
];

function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('round-491 responsibility-zeroing（T5 归责归零族）守卫');

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

test('端到端：攻击命中落 rewrite 或 block（不得只 verify）', () => {
  const soft = ATTACK.filter(t => {
    const r = gate.checkOutput(t);
    return (r.findings || []).some(f => f.dimension === 'agency_deflection')
      && r.gate.action === 'verify';
  });
  assert.strictEqual(soft.length, 0, `命中却只判 verify 的样本数：${soft.length}`);
});

test('端到端：良性族不出现 agency_deflection finding', () => {
  const fp = BENIGN.filter(t => (gate.checkOutput(t).findings || [])
    .some(f => f.dimension === 'agency_deflection'));
  assert.strictEqual(fp.length, 0, `误伤 ${fp.length} 条`);
});

// ── 删条变异：四支各自置假后独占样本必须失守 ──────────────────
// 口径：整行替换法（round-487 同款）——按 const 声明行把该支正则体替换为
// 永不匹配的合法正则，规避正则体内含 / 的截断问题；再逐支跑独占样本。
test('删条变异：T5 四支各自承重（整行替换，子进程隔离 require 缓存）', () => {
  const { execFileSync } = require('child_process');
  const orig = fs.readFileSync(MODULE, 'utf8');
  const BRANCHES = [
    { name: 'T5_ZH_BLAME', decl: 'const T5_ZH_BLAME = /', samples: T5_BLAME_ZH },
    { name: 'T5_ZH_EXEC', decl: 'const T5_ZH_EXEC = /', samples: T5_EXEC_ZH },
    { name: 'T5_ZH_NULLIFY', decl: 'const T5_ZH_NULLIFY = /', samples: T5_NULLIFY_ZH },
    { name: 'T5_EN', decl: 'const T5_EN = /', samples: T5_EN },
  ];
  const findings = [];
  for (const b of BRANCHES) {
    const lines = orig.split('\n');
    const idx = lines.findIndex(l => l.startsWith(b.decl));
    if (idx < 0) { findings.push(`${b.name}: 未找到 const 声明行`); continue; }
    const mutatedLines = lines.slice();
    mutatedLines[idx] = 'const ' + b.name + " = /^$(?!)/;";
    fs.writeFileSync(MODULE, mutatedLines.join('\n'), 'utf8');
    try {
      const survivors = [];
      for (const s of b.samples) {
        const out = execFileSync(process.execPath,
          ['-e', `process.chdir(${JSON.stringify(ROOT)});`
            + `const m=require(${JSON.stringify(MODULE)});`
            + `console.log(m.checkAgencyDeflection(${JSON.stringify(s)}).hit);`],
          { encoding: 'utf8' });
        if (out.trim() === 'true') survivors.push(s.slice(0, 20));
      }
      if (survivors.length > 0) {
        findings.push(`${b.name}: 删后仍有 ${survivors.length}/${b.samples.length} 条命中（守卫不敏感）`);
      }
    } catch (e) {
      findings.push(`${b.name}: 子进程执行失败 ${e.message}`);
    } finally {
      fs.writeFileSync(MODULE, orig, 'utf8');
    }
  }
  assert.strictEqual(findings.length, 0, findings.join('\n  '));
});

test('还原校验：src/agency-deflection.js 逐字节一致', () => {
  const now = fs.readFileSync(MODULE, 'utf8');
  assert.strictEqual(now, origModuleSnapshot, '还原后模块文件应与变异前一致');
  assert.ok(now.includes('function checkAgencyDeflection'), 'checkAgencyDeflection 必须仍在位');
});

if (process.exitCode) process.exit(1);
console.log('✅ round-491 守卫通过');
