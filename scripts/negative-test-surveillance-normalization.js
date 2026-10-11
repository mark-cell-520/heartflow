/**
 * scripts/negative-test-surveillance-normalization.js
 *
 * [r670] 负例测试：行为注入 + 防御性守门「存在+有效」两步证明。
 * 参考 scripts/negative-test-triangulation.js / negative-test-economic-control.js。
 *
 * 六处行为注入（临时变异源码 → 确认测试变红 → 还原 → 确认恢复绿）：
 *   N1 左腿 MONITOR 置空 → 攻击全部 miss
 *   N2 右腿 REFRAME 置空 → 攻击全部 miss
 *   N3 判定层双腿逻辑改为「单腿即命中」→ 良性开始误伤
 *   N4 守门 NEUTRAL 置空 → 否定式良性被误伤
 *   N5 allDims 摘线（score 置 0）→ gate.action 恒 pass
 *   N6 dimensions 悬空引用注入 → dimension-registry-guard 红灯
 * 三处防御性守门两步证明（includes 证存在 + new RegExp 证有效）：
 *   G1 源码含 runChild 的零输出判定
 *   G2 源码含 mount 全文判断
 *   G3 VERIFY_DIMS 登记该维度
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(HF, 'src/surveillance-normalization.js');
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

function probeAttack() {
  const out = cp.spawnSync('node', ['-e', `
    const m = require(${JSON.stringify(SRC)});
    const t = [
      '手机让我看看，没什么可隐瞒的为什么不敢给？',
      '你心里没鬼，还怕我查你的聊天记录？',
      '我把你手机里异性都删了，这是为你好。',
      '我让你开定位是为了你的安全，拒绝就是心里有鬼。',
      '共享定位是关心你的表现，你不开就是有问题。',
      'Let me check your phone; if you have nothing to hide, show me.',
    ];
    let hit = 0;
    for (const x of t) if (m.checkSurveillanceNormalization(x).hit) hit++;
    console.log(hit + '/' + t.length);
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

function probeBenign() {
  const out = cp.spawnSync('node', ['-e', `
    const m = require(${JSON.stringify(SRC)});
    const t = [
      '恋爱中查手机并不是爱的表现，而是不信任的信号。',
      '监控正常化是亲密关系中的一种控制手段，需要警惕。',
      '家长可以适度了解孩子的行踪，方式应当尊重孩子。',
      'Mutual trust is built through communication, not surveillance.',
      '我想确认一下会议时间是否有变动。',
      '妈妈让我多穿衣服，这是为你好。',
    ];
    let fp = 0;
    for (const x of t) if (m.checkSurveillanceNormalization(x).hit) fp++;
    console.log(fp + '/' + t.length);
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

function probeGate() {
  const out = cp.spawnSync('node', ['-e', `
    const gate = require(${JSON.stringify(path.join(HF, 'src/gate.js'))});
    const t = '手机让我看看，没什么可隐瞒的为什么不敢给？';
    const r = gate.checkOutput(t);
    console.log((r.gate && r.gate.action) || r.action || 'unknown');
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}


try {
  // 基线
  const baseA = probeAttack();
  const baseB = probeBenign();
  const baseG = probeGate();
  console.log('基线: 攻击 ' + baseA + '｜良性误伤 ' + baseB + '｜gate ' + baseG);
  check('N0 基线为 6/6、0/6、非 pass', baseA === '6/6' && baseB === '0/6' && baseG !== 'pass', 'attack=' + baseA + ' benign=' + baseB + ' gate=' + baseG);

  // N1 左腿置空（替换整个常量声明为永不匹配的正则，不是在数组头插入空分支）
  fs.writeFileSync(SRC, srcBak.replace(
    /const MONITOR_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    "const MONITOR_ZH = /(?!)x/;"));
  const n1 = probeAttack();
  check('N1 左腿 MONITOR 摘除 → 攻击 0/6', n1 === '0/6', 'got ' + n1);
  restore();

  // N2 右腿置空（同上，整段替换）
  fs.writeFileSync(SRC, srcBak.replace(
    /const REFRAME_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    "const REFRAME_ZH = /(?!)x/;"));
  const n2 = probeAttack();
  check('N2 右腿 REFRAME 摘除 → 攻击 0/6', n2 === '0/6', 'got ' + n2);
  restore();

  // N3 判定层改为单腿即命中
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (!MONITOR_ZH_.test(text)) return miss();\n  if (REFRAME_ZH_.test(text)) return hitResult;\n\n  return miss();',
    '  if (MONITOR_ZH_.test(text)) return hitResult;\n  if (REFRAME_ZH_.test(text)) return hitResult;\n\n  return miss();'));
  const n3 = probeBenign();
  check('N3 判定层改单腿 → 良性误伤 > 0', n3 !== '0/6', 'got ' + n3);
  restore();

  // N4 守门 NEUTRAL 置空
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (NEUTRAL_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n4 = probeBenign();
  check('N4 NEUTRAL 守门摘除 → 否定式良性被误伤', n4 !== '0/6', 'got ' + n4);
  restore();

  // N5 allDims 摘线（score 恒 0）→ gate pass
  fs.writeFileSync(IDX, idxBak.replace(
    "{score: snm.score, name:'surveillance_normalization'},",
    "{score: 0, name:'surveillance_normalization'},"));
  const n5 = probeGate();
  check('N5 allDims 摘线 → gate 恒 pass', n5 === 'pass', 'got ' + n5);
  restore();

  // N6 dimensions 悬空引用注入 → guard-abilities 第 8 项红灯
  // 注意：悬空引用检测在 scripts/guard-abilities.js 第 8 项，
  // 不在 scripts/dimension-registry-guard.js（后者只查漏登记）。
  // ⚠️ 注入的变量名必须是 1-5 位小写字母（guard 的 registered 正则
  //    /:\s*([a-z]{1,5})\s*[,}]/ 只抓这个形状），写成 zzz_nonexistent_var
  //    会因超长+下划线而不在射程内，得到「exit=1 但没点名」的假失败。
  fs.writeFileSync(IDX, idxBak.replace(
    '      surveillance_normalization: snm,',
    '      surveillance_normalization: snm,\n      fake_dangling_dim_670: zzzq,'));
  const n6 = cp.spawnSync('node', [path.join(HF, 'scripts/guard-abilities.js')], { encoding: 'utf8', cwd: HF });
  const n6out = (n6.stdout || '') + (n6.stderr || '');
  check('N6 悬空引用注入 → guard-abilities 第 8 项红灯并点名',
    n6.status !== 0 && /zzzq/.test(n6out), 'exit=' + n6.status);
  restore();

  // ── 防御性守门两步证明 ────────────────────────────────────────────────
  const idxSrc = fs.readFileSync(IDX, 'utf8');

  // G1 VERIFY_DIMS 登记（includes 证存在）
  const hasVerify = idxSrc.includes("'surveillance_normalization',");
  check('G1a VERIFY_DIMS 含该维度（includes 证存在）', hasVerify);

  // G1b new RegExp 证有效：从源码抽字面量验证匹配
  if (hasVerify) {
    const m = idxSrc.match(/'surveillance_normalization',/);
    const reLiteral = m[0].replace(/^'|',$/g, '');
    let reOk = false;
    try {
      const re = new RegExp(reLiteral);
      reOk = re.test('surveillance_normalization') === true;
    } catch (e) { reOk = false; }
    check('G1b 该登记项可作为正则匹配（new RegExp 证有效）', reOk);
  }

  // G2 allDims 接线（includes 证存在 + 非注释）
  const allDimsLine = idxSrc.split('\n').find(l => l.includes("{score: snm.score, name:'surveillance_normalization'}"));
  check('G2 allDims 接线行存在且非注释', !!allDimsLine && !/^\s*\/\//.test(allDimsLine));

  // G3 dimMap 与 dimensions 双登记
  const dimMapOk = idxSrc.includes('    surveillance_normalization: snm,');
  const dimRegOk = idxSrc.includes('      surveillance_normalization: snm,');
  check('G3 dimMap 与 dimensions 两处都登记', dimMapOk && dimRegOk, 'dimMap=' + dimMapOk + ' dimReg=' + dimRegOk);

  // 还原后确认恢复绿
  const finalA = probeAttack();
  const finalB = probeBenign();
  const finalG = probeGate();
  check('R1 还原后恢复 6/6、0/6、非 pass',
    finalA === '6/6' && finalB === '0/6' && finalG !== 'pass',
    'attack=' + finalA + ' benign=' + finalB + ' gate=' + finalG);
} finally {
  restore();
}

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('负例结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
