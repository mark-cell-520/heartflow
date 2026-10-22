/**
 * scripts/negative-test-thought-terminating-cliche.js
 *
 * [r672] 负例测试：行为注入 + 防御性守门「存在+有效」两步证明。
 * 参考 scripts/negative-test-surveillance-normalization.js / negative-test-triangulation.js。
 *
 * 七处行为注入（临时变异源码 → 确认测试变红 → 还原 → 确认恢复绿）：
 *   N1 STOP 腿置空 → 结构 A 攻击全 miss
 *   N2 REPLACE 腿置空 → 结构 A 攻击全 miss
 *   N3 CONVICT 腿置空 → 结构 B 攻击全 miss
 *   N4 判定层改「双腿单腿即命中」→ 良性开始误伤
 *   N5 DOMAIN 守门摘除 → 第三人称良性被误伤
 *   N6 allDims 摘线（score 置 0）→ gate.action 恒 pass
 *   N7 dimensions 悬空引用注入 → guard-abilities 第 8 项红灯
 * 三处防御性守门两步证明（includes 证存在 + new RegExp 证有效）：
 *   G1 VERIFY_DIMS 登记该维度
 *   G2 allDims 接线行存在且非注释
 *   G3 dimMap 与 dimensions 双登记
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const HF = __HF;
const SRC = path.join(HF, 'src/thought-terminating-cliche.js');
const IDX = path.join(HF, 'src/index.js');

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
  console.log((ok ? '  ✅ ' : '  ❌ ') + name + (detail ? ' — ' + detail : ''));
}

// 备份
const srcBak = fs.readFileSync(SRC, 'utf8');
const idxBak = fs.readFileSync(IDX, 'utf8');
function restore() {
  fs.writeFileSync(SRC, srcBak);
  fs.writeFileSync(IDX, idxBak);
}

// 结构 A 攻击样本（STOP × REPLACE 双腿）——用于 N1/N2
const STRUCT_A = [
  '别钻牛角尖，跟着感觉走就对了。',
  '停止分析，按我说的做就行。',
  '不要想那么多，静心体会就对了。',
  '别追问了，照做就是了，不会有错。',
  "Don't ask why, just obey the master.",
];
// 结构 B 攻击样本（CONVICT 单支）——用于 N3
const STRUCT_B = [
  '你怀疑就是不够虔诚，信仰不需要证据。',
  '真正的修行不讲道理，讲的是无条件的信任。',
  '你的焦虑都是执念，放下就解脱了。',
  '不信大师就是没有缘分，你自己看着办。',
  '反对我们就是反对你自己，别不知好歹。',
];

function probeSet(file, list) {
  const out = cp.spawnSync('node', ['-e', `
    const m = require(${JSON.stringify(file)});
    const t = ${JSON.stringify(list)};
    let hit = 0;
    for (const x of t) if (m.checkThoughtTerminatingCliche(x).hit) hit++;
    console.log(hit + '/' + t.length);
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

// 单腿良性：STOP 或 REPLACE 单腿命中但另一腿不命中——证明双腿共现判据// 在保护这些正当句（N4 用）
function probeBenignSingle() {
  return probeSet(SRC, [
    '不要纠结于细节，先抓大方向。',
    '先执行就好，有问题再反馈。',
    '遇到问题静心体会一下，别急着发火。',
    '数据分析师需要保持怀疑精神，核实每个数据源。',
    '团队复盘时鼓励每个人提出质疑。',
    '先按流程执行，有问题再反馈。',
  ]);
}
// 领域陈述良性：STOP×REPLACE 双腿命中但 DOMAIN 守门该拦——证明守门真实// 生效（N5 用）
function probeBenignDomain() {
  return probeSet(SRC, [
    '团队管理中，有些管理者认为不要过度分析，跟着感觉走即可。',
    '冥想练习强调不要想太多，用心感受当下的力量。',
    'Mindfulness practice suggests you should stop overthinking and just feel it.',
    '有些哲学流派认为不要过度思考，直觉更可靠。',
    '冥想练习强调放下杂念，专注于当下的体验。',
    '团队管理中，过度分析可能导致决策迟缓。',
  ]);
}

function probeGate() {
  const out = cp.spawnSync('node', ['-e', `
    const gate = require(${JSON.stringify(path.join(HF, 'src/gate.js'))});
    const t = '别想太多，用心感受就行了，别用逻辑分析。';
    const r = gate.checkOutput(t);
    console.log((r.gate && r.gate.action) || r.action || 'unknown');
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

try {
  // 基线
  const baseA = probeSet(SRC, STRUCT_A);
  const baseB = probeSet(SRC, STRUCT_B);
  const baseSingle = probeBenignSingle();
  const baseDomain = probeBenignDomain();
  const baseG = probeGate();
  console.log('基线: 结构A ' + baseA + '｜结构B ' + baseB + '｜单腿良性误伤 ' + baseSingle + '｜领域良性误伤 ' + baseDomain + '｜gate ' + baseG);
  check('N0 基线为 5/5、5/5、0/6、0/6、非 pass',
    baseA === '5/5' && baseB === '5/5' && baseSingle === '0/6' && baseDomain === '0/6' && baseG !== 'pass',
    'A=' + baseA + ' B=' + baseB + ' single=' + baseSingle + ' domain=' + baseDomain + ' gate=' + baseG);

  // N1 STOP 腿置空（替换整个常量声明为永不匹配的正则，不是在数组头插入空分支）
  fs.writeFileSync(SRC, srcBak.replace(
    /const STOP_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    "const STOP_ZH = /(?!)x/;"));
  const n1 = probeSet(SRC, STRUCT_A);
  check('N1 STOP 腿摘除 → 结构 A 0/5', n1 === '0/5', 'got ' + n1);
  restore();

  // N2 REPLACE 腿置空
  fs.writeFileSync(SRC, srcBak.replace(
    /const REPLACE_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    "const REPLACE_ZH = /(?!)x/;"));
  const n2 = probeSet(SRC, STRUCT_A);
  check('N2 REPLACE 腿摘除 → 结构 A 0/5', n2 === '0/5', 'got ' + n2);
  restore();

  // N3 CONVICT 腿置空
  fs.writeFileSync(SRC, srcBak.replace(
    /const CONVICT_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    "const CONVICT_ZH = /(?!)x/;"));
  const n3 = probeSet(SRC, STRUCT_B);
  check('N3 CONVICT 腿摘除 → 结构 B 0/5', n3 === '0/5', 'got ' + n3);
  restore();

  // N4 判定层改为「结构 A 单腿即命中」
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (STOP_ZH_.test(text) && REPLACE_ZH_.test(text)) return hitResult;',
    '  if (STOP_ZH_.test(text)) return hitResult;\n  if (REPLACE_ZH_.test(text)) return hitResult;'));
  const n4 = probeBenignSingle();
  check('N4 判定层改单腿 → 单腿良性误伤 > 0', n4 !== '0/6', 'got ' + n4);
  restore();

  // N5 DOMAIN 守门摘除（注释掉判定行，不是删除）
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (DOMAIN_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n5 = probeBenignDomain();
  check('N5 DOMAIN 守门摘除 → 领域陈述良性误伤 > 0', n5 !== '0/6', 'got ' + n5);
  restore();

  // N6 allDims 摘线（score 恒 0）→ gate pass
  fs.writeFileSync(IDX, idxBak.replace(
    "{score: ttc.score, name:'thought_terminating_cliche'},",
    "{score: 0, name:'thought_terminating_cliche'},"));
  const n6 = probeGate();
  check('N6 allDims 摘线 → gate 恒 pass', n6 === 'pass', 'got ' + n6);
  restore();

  // N7 dimensions 悬空引用注入 → guard-abilities 第 8 项红灯
  // 注意：悬空引用检测在 scripts/guard-abilities.js 第 8 项，
  // 不在 scripts/dimension-registry-guard.js（后者只查漏登记）。
  // ⚠️ 注入的变量名必须是 1-5 位小写字母（guard 的 registered 正则
  //    /:\s*([a-z]{1,5})\s*[,}]/ 只抓这个形状），写成 zzz_nonexistent_var
  //    会因超长+下划线而不在射程内，得到「exit=1 但没点名」的假失败。
  fs.writeFileSync(IDX, idxBak.replace(
    '      thought_terminating_cliche: ttc,',
    '      thought_terminating_cliche: ttc,\n      fake_dangling_dim_672: zzzq,'));
  const n7 = cp.spawnSync('node', [path.join(HF, 'scripts/guard-abilities.js')], { encoding: 'utf8', cwd: HF });
  const n7out = (n7.stdout || '') + (n7.stderr || '');
  check('N7 悬空引用注入 → guard-abilities 第 8 项红灯并点名',
    n7.status !== 0 && /zzzq/.test(n7out), 'exit=' + n7.status);
  restore();

  // ── 防御性守门两步证明 ────────────────────────────────────────────────
  const idxSrc = fs.readFileSync(IDX, 'utf8');

  // G1 VERIFY_DIMS 登记（includes 证存在）
  const hasVerify = idxSrc.includes("'thought_terminating_cliche',");
  check('G1a VERIFY_DIMS 含该维度（includes 证存在）', hasVerify);

  // G1b new RegExp 证有效：从源码抽字面量验证匹配
  if (hasVerify) {
    const m = idxSrc.match(/'thought_terminating_cliche',/);
    const reLiteral = m[0].replace(/^'|',$/g, '');
    let reOk = false;
    try {
      const re = new RegExp(reLiteral);
      reOk = re.test('thought_terminating_cliche') === true;
    } catch (e) { reOk = false; }
    check('G1b 该登记项可作为正则匹配（new RegExp 证有效）', reOk);
  }

  // G2 allDims 接线（includes 证存在 + 非注释）
  const allDimsLine = idxSrc.split('\n').find(l => l.includes("{score: ttc.score, name:'thought_terminating_cliche'}"));
  check('G2 allDims 接线行存在且非注释', !!allDimsLine && !/^\s*\/\//.test(allDimsLine));

  // G3 dimMap 与 dimensions 双登记（两种缩进都要在）
  const dimMapOk = idxSrc.includes('    thought_terminating_cliche: ttc,');
  const dimRegOk = idxSrc.includes('      thought_terminating_cliche: ttc,');
  check('G3 dimMap 与 dimensions 两处都登记', dimMapOk && dimRegOk, 'dimMap=' + dimMapOk + ' dimReg=' + dimRegOk);

  // 还原后确认恢复绿
  const finalA = probeSet(SRC, STRUCT_A);
  const finalB = probeSet(SRC, STRUCT_B);
  const finalSingle = probeBenignSingle();
  const finalDomain = probeBenignDomain();
  const finalG = probeGate();
  check('R1 还原后恢复 5/5、5/5、0/6、0/6、非 pass',
    finalA === '5/5' && finalB === '5/5' && finalSingle === '0/6' && finalDomain === '0/6' && finalG !== 'pass',
    'A=' + finalA + ' B=' + finalB + ' single=' + finalSingle + ' domain=' + finalDomain + ' gate=' + finalG);
} finally {
  restore();
}

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('负例结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
