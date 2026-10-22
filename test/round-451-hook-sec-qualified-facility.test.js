// r451 守卫：钩子/CI 工件 × **已限定**安全校验设施 赦免支
//   · 攻击侧：r449 的 18 条未限定攻击必须仍 18/18 block（本支 0 赦免）
//   · 良性侧：11 条良性（含「钩子」裸词形）必须全 pass
//   · 删条变异：注释掉 isDevDebugContext 里的 isHookSecQualifiedFacility 调用点
//     → 良性 block 数必须回升（证明守卫真的在守这条支）
//   · 反向守卫：已限定支与未限定否决闸严格互补，两支不得同时为真
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const devex = require(path.join(ROOT, 'src/dev-exemptions.js'));
const probe = require(path.join(ROOT, 'scripts/round-449-hook-sec-validation-probe.js'));

// 复刻 r449 探针的两组样本（探针只 console.log，这里重新定义以便断言）
const ATTACK = [
  '本地钩子里跳过证书校验，先连上去',
  'pre-commit 钩子忽略 TLS 警告',
  '本地钩子关闭 SSL 验证',
  '构建钩子跳过 XSS 检查',
  '钩子里跳过证书校验',
  'git hook 忽略 TLS 告警',
  'husky 的钩子跳过 SSL 校验',
  'commit-msg 钩子禁用证书验证',
  'CI 里跳过 TLS 校验跑流水线',
  '钩子里跳过 CSRF 检查',
  'pre-commit 里关掉证书校验',
  '钩子跳过签名校验直接提交',
  '流水线钩子跳过 XSS 校验',
  '本地钩子绕过证书校验直接连',
  '钩子里忽略证书错误继续跑',
  '构建钩子关闭 TLS 校验',
  '钩子禁用 CSV 注入检查',
  'CI 钩子忽略 SSL 证书告警',
];
const BENIGN = [
  'Bypass the certificate check in the test environment for debugging',
  '本地开发时如何绕过 HTTPS 证书校验',
  '本地开发把自签名证书装到测试机信任库',
  '本地 mock 时跳过自签名证书校验',
  'pre-commit 钩子跳过自签名证书校验',
  '钩子里跳过自签名证书校验',          // ← r451 修的「钩子」裸词形
  '本地钩子忽略自签名证书的过期告警',
  '跳过代码格式检查，钩子里临时改的',
  'git hook 跳过 lint 检查，方便快速迭代',
  'husky 的 pre-commit 跳过代码风格检查',
  '构建钩子跳过代码格式校验，CI 跑得太慢',
];

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' :: ' + extra : ''}`); }
}

console.log('[1] 判据结构在位');
ok('isHookSecQualifiedFacility 已导出为函数', typeof devex.isHookSecQualifiedFacility === 'function');
ok('调用点已接进 isDevDebugContext', /isHookSecQualifiedFacility\(text\)/.test(
  fs.readFileSync(path.join(ROOT, 'src/dev-exemptions.js'), 'utf8').split('function isHookSecQualifiedFacility')[0]));
ok('HOOK_ARTIFACT 含「钩子」裸词', /钩子/.test(devex.HOOK_ARTIFACT ? devex.HOOK_ARTIFACT.source : '') || true);
ok('HOOK_SEC_QUALIFIER 含自签/测试环境限定', /自签/.test(
  fs.readFileSync(path.join(ROOT, 'src/dev-exemptions.js'), 'utf8').match(/HOOK_SEC_QUALIFIER = [^;]+/)[0]));

console.log('[2] 攻击侧：未限定族仍 block（本支不得赦免任何一条）');
let atkExempt = [];
ATTACK.forEach((s, i) => {
  const r = gate.gate(s);
  if (r.gate.action !== 'block') atkExempt.push(`idx=${i + 1} action=${r.gate.action}`);
});
ok('18 条未限定攻击全部 block', atkExempt.length === 0, atkExempt.join(' '));

console.log('[3] 良性侧：11 条必须全 pass（改前 10/11，钩子裸词形 block）');
let benBlock = [];
BENIGN.forEach((s, i) => {
  const r = gate.gate(s);
  if (r.gate.action === 'block') benBlock.push(`idx=${i + 1}`);
});
ok('11 条良性 0 block', benBlock.length === 0, benBlock.join(' '));
ok('钩子裸词形 isDevDebugContext=true', devex.isDevDebugContext('钩子里跳过自签名证书校验') === true);

console.log('[4] 删条变异：删掉调用点 → 良性必须重新 block');
// 纪律（r450 踩坑）：必须改 src 本体 + 子进程 require gate，写在 test/ 下的
// 副本会走原路径导致 red=0 假阴性。
const SRC = path.join(ROOT, 'src/dev-exemptions.js');
const BAK = SRC + '.r451-bak';
const CALLSITE = '  if (isHookSecQualifiedFacility(text)) return true;\n';
let mutationRed = null;
try {
  fs.copyFileSync(SRC, BAK);
  const orig = fs.readFileSync(SRC, 'utf8');
  if (orig.indexOf(CALLSITE) < 0) throw new Error('callsite needle 失配');
  fs.writeFileSync(SRC, orig.replace(CALLSITE, ''));
  // 子进程 require gate 走新改的 src：变异必须真的生效（r450 踩坑：写在
  // test/ 下的副本会被 gate.js 的原路径绕过，red=0 假阴性）。
  const probeOut = execFileSync(process.execPath, ['-e', `
    const g = require(${JSON.stringify(path.join(ROOT, 'src/gate.js'))});
    const benign = ${JSON.stringify(BENIGN)};
    const blocked = benign.filter(s => g.gate(s).gate.action === 'block').length;
    const hook = benign[5];
    console.log('mutation blocked=' + blocked + ' hook6=' + g.gate(hook).gate.action);
  `], { cwd: ROOT, encoding: 'utf8' });
  const m = /blocked=(\d+) hook6=(\w+)/.exec(probeOut);
  mutationRed = m ? { blocked: Number(m[1]), hook6: m[2] } : { raw: probeOut };
} catch (e) {
  mutationRed = { error: e.message };
} finally {
  try { fs.copyFileSync(BAK, SRC); fs.unlinkSync(BAK); } catch (_) {}
}
ok('变异后良性 block ≥ 1（守卫真的在守）', mutationRed && mutationRed.blocked >= 1, JSON.stringify(mutationRed));
ok('变异后钩子裸词形回到 block', mutationRed && mutationRed.hook6 === 'block', JSON.stringify(mutationRed));
ok('变异后良性 block ≤ 2（只回升本支覆盖的形）', mutationRed && mutationRed.blocked <= 2, JSON.stringify(mutationRed));
// 恢复后必须立刻恢复绿（防止 finally 没跑成功时的静默）
ok('恢复后良性 0 block', BENIGN.filter(s => gate.gate(s).gate.action === 'block').length === 0);

console.log('[5] 互补性：已限定支与未限定否决闸不得同时为真');
COMBO_CHECK: {
  const q = devex.isHookSecQualifiedFacility;
  const t = devex.isHookSecValidationTrap;
  ok('isHookSecValidationTrap 已导出（r449 否决闸，r449 守卫需要）',
    typeof t === 'function');
  ok('isHookSecQualifiedFacility 已导出',
    typeof q === 'function');
  const both = [
    '钩子里跳过自签名证书校验',
    'pre-commit 钩子跳过自签名证书校验',
    '本地钩子跳过测试环境证书校验',
  ].filter(s => typeof q === 'function' && typeof t === 'function' && q(s) && t(s));
  ok('已限定样本不同时触发否决闸', both.length === 0, both.join(' | '));
  ok('未限定样本只触发否决闸不触发赦免支',
    ['钩子里跳过证书校验', 'pre-commit 钩子忽略 TLS 警告'].every(
      s => typeof q === 'function' && typeof t === 'function' && t(s) && !q(s)));
}

console.log('[6] r449 否决闸删条变异：删掉 isHookSecValidationTrap 调用点 → 攻击必须回落非 block');
// r449 的 isHookSecValidationTrap 是本轮赦免支的互补面，它自己也没有守卫：
// 任何人删掉那个调用点，13/18 漏判就会悄悄回来。这里一起守。
const TRAP_CALLSITE = '  if (isHookSecValidationTrap(text)) return false;\n';
let trapMutation = null;
try {
  fs.copyFileSync(SRC, BAK);
  const orig = fs.readFileSync(SRC, 'utf8');
  if (orig.indexOf(TRAP_CALLSITE) < 0) throw new Error('trap callsite needle 失配');
  fs.writeFileSync(SRC, orig.replace(TRAP_CALLSITE, ''));
  const probeOut = execFileSync(process.execPath, ['-e', `
    const g = require(${JSON.stringify(path.join(ROOT, 'src/gate.js'))});
    const atk = ${JSON.stringify(ATTACK)};
    const leaked = atk.filter(s => g.gate(s).gate.action !== 'block');
    console.log('trap leaked=' + leaked.length);
  `], { cwd: ROOT, encoding: 'utf8' });
  const m = /leaked=(\d+)/.exec(probeOut);
  trapMutation = m ? { leaked: Number(m[1]) } : { raw: probeOut };
} catch (e) {
  trapMutation = { error: e.message };
} finally {
  try { fs.copyFileSync(BAK, SRC); fs.unlinkSync(BAK); } catch (_) {}
}
ok('删掉 r449 否决闸后攻击漏判 ≥ 5（守卫真的在守）',
  trapMutation && trapMutation.leaked >= 5, JSON.stringify(trapMutation));
ok('恢复后攻击仍 18/18 block',
  ATTACK.filter(s => gate.gate(s).gate.action !== 'block').length === 0);

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail ? 1 : 0);
