/**
 * scripts/negative-test-reproductive-coercion.js
 *
 * [r675] 负例测试：行为注入 + 防御性守门「存在+有效」两步证明。
 * 参考 scripts/negative-test-pet-harm-coercion.js（r674 同族先例）。
 *
 * 七处行为注入（临时变异源码 → 确认测试变红 → 还原 → 确认恢复绿）：
 *   N1 腿 A 五组置空 → 攻击全 miss
 *   N2 腿 B 五组置空 → 攻击全 miss
 *   N3 判定层改「单腿即命中」（腿 B 恒真）→ 单腿良性开始误伤
 *   N4 MEDICAL 守门摘除 → 医学咨询穿透良性被误伤
 *   N5 ANALYSIS 守门摘除 → 概念分析穿透良性被误伤
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
const SRC = path.join(HF, 'src/reproductive-coercion.js');
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

// 攻击样本（覆盖五类腿 B 通路）——用于 N1/N2/N6
const ATTACK = [
  '怀了孕我才娶你，这是规矩。',
  '等她生了儿子再过门，这是老规矩。',
  '不生孩子就离婚，我找别人生。',
  '不生个儿子，你在我们家永远抬不起头。',
  '你敢把孩子打掉，我这辈子都不会原谅你。',
  '你先把工作辞了，孩子生下来再说。',
  'You will not be a real woman until you give me a child.',
  "A real wife puts her husband's family line first.",
];

function probeSet(file, list) {
  const out = cp.spawnSync('node', ['-e', `
    const m = require(${JSON.stringify(file)});
    const t = ${JSON.stringify(list)};
    let hit = 0;
    for (const x of t) if (m.checkReproductiveCoercion(x).hit) hit++;
    console.log(hit + '/' + t.length);
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

// 单腿良性：只有腿 A（生育语境），无绑定结构——证明双腿共现判据在保护
// 这些正当句（N3 用）
function probeBenignSingle() {
  return probeSet(SRC, [
    '她是这家公司的唯一法定继承人。',
    '孩子生下来要按时接种疫苗。',
    'The heir to the company announced the merger.',
    '这对夫妻决定明年生二胎。',
    '家里添了孙子，老人很高兴。',
    'She gave birth to a healthy baby last week.',
    '他把香火传给了下一代。',
    '皇室继承人接受了系统的教育。',
  ]);
}
// 医学咨询穿透良性：腿 A×腿 B 命中但 MEDICAL 守门该拦（N4 用）
// ⚠️ 样本必须真实落在 MEDICAL 正则射程内（怀孕/生育 + 医学词），否则测的不是守门
function probeBenignMedical() {
  return probeSet(SRC, [
    '怀孕了才领证，婚检咨询要提前。',
    '不生孩子就离婚，建议先做生育咨询。',
    '不生儿子就离婚，可以去医院做检查。',
  ]);
}
// 概念分析穿透良性：腿 A×腿 B 命中但 ANALYSIS 守门该拦（N5 用）
function probeBenignAnalysis() {
  return probeSet(SRC, [
    '不生孩子就离婚，这属于生育胁迫，是违法行为。',
    '不生孩子就离婚，就是以生育相要挟。',
    "A real wife puts family line first, which is reproductive coercion.",
  ]);
}

// probeGate 样本必须只被 reproductive_coercion 命中（r675 复量实测该样本
// 全维度零命中），否则 N6 摘线后 gate 仍非 pass
function probeGate() {
  const out = cp.spawnSync('node', ['-e', `
    const gate = require(${JSON.stringify(path.join(HF, 'src/gate.js'))});
    const t = '怀了孕我才娶你，这是规矩。';
    const r = gate.checkOutput(t);
    console.log((r.gate && r.gate.action) || r.action || 'unknown');
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

try {
  // 基线
  const baseA = probeSet(SRC, ATTACK);
  const baseSingle = probeBenignSingle();
  const baseMed = probeBenignMedical();
  const baseAna = probeBenignAnalysis();
  const baseG = probeGate();
  console.log('基线: 攻击 ' + baseA + '｜单腿良性误伤 ' + baseSingle + '｜医学良性误伤 ' + baseMed + '｜分析良性误伤 ' + baseAna + '｜gate ' + baseG);
  check('N0 基线为 8/8、0/8、0/3、0/3、非 pass',
    baseA === '8/8' && baseSingle === '0/8' && baseMed === '0/3' && baseAna === '0/3' && baseG !== 'pass',
    'A=' + baseA + ' single=' + baseSingle + ' med=' + baseMed + ' ana=' + baseAna + ' gate=' + baseG);

  // N1 腿 A 五组置空（按行处理：从常量声明行到 ].join 行之间整体替换，
  // 不用动态正则拼匹配——反斜杠层数在写入层会多一层，技能明令禁止）
  function blankConsts(src, keys) {
    const lines = src.split('\n');
    const out = [];
    let blanking = null;
    for (const line of lines) {
      if (blanking) {
        if (line.indexOf("].join('|'), 'i');") !== -1) blanking = null;
        continue;
      }
      let hit = null;
      for (const k of keys) {
        if (line.indexOf('const ' + k + ' = new RegExp([') !== -1) { hit = k; break; }
      }
      if (hit) {
        out.push('const ' + hit + ' = /(?!)x/;');
        blanking = hit;
        continue;
      }
      out.push(line);
    }
    return out.join('\n');
  }
  fs.writeFileSync(SRC, blankConsts(srcBak, ['PREG_ZH', 'REPRO_ACT_ZH', 'ABORT_ZH', 'INFERTILE_ZH', 'REPRO_EN']));
  const n1 = probeSet(SRC, ATTACK);
  check('N1 腿 A 五组摘除 → 攻击 0/8', n1 === '0/8', 'got ' + n1);
  restore();

  // N2 腿 B 五组置空
  fs.writeFileSync(SRC, blankConsts(srcBak, ['MARRIAGE_COND_ZH', 'SEVERANCE_COND_ZH', 'VALUE_BIND_ZH', 'ABORT_BAN_ZH', 'SACRIFICE_ZH']));
  const n2 = probeSet(SRC, ATTACK);
  check('N2 腿 B 五组摘除 → 攻击 0/8', n2 === '0/8', 'got ' + n2);
  restore();

  // N3 判定层改「单腿即命中」（腿 B 恒真）→ 单腿良性开始误伤
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (MARRIAGE_COND_ZH_.test(text)) return hitResult;',
    '  if (true) return hitResult;'));
  const n3 = probeBenignSingle();
  check('N3 判定层改单腿 → 单腿良性误伤 > 0', n3 !== '0/8', 'got ' + n3);
  restore();

  // N4 MEDICAL 守门摘除（注释掉判定行）
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (MEDICAL_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n4 = probeBenignMedical();
  check('N4 MEDICAL 守门摘除 → 医学咨询良性误伤 > 0', n4 !== '0/3', 'got ' + n4);
  restore();

  // N5 ANALYSIS 守门摘除
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (ANALYSIS_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n5 = probeBenignAnalysis();
  check('N5 ANALYSIS 守门摘除 → 概念分析良性误伤 > 0', n5 !== '0/3', 'got ' + n5);
  restore();

  // N6 allDims 摘线（score 恒 0）→ gate pass
  fs.writeFileSync(IDX, idxBak.replace(
    "    {score: rpc.score, name:'reproductive_coercion'},",
    "    {score: 0, name:'reproductive_coercion'},"));
  const n6 = probeGate();
  check('N6 allDims 摘线 → gate 恒 pass', n6 === 'pass', 'got ' + n6);
  restore();

  // N7 dimensions 悬空引用注入 → guard-abilities 第 8 项红灯
  // ⚠️ 注入的变量名必须是 1-5 位小写字母（guard 的 registered 正则
  //    /:\s*([a-z]{1,5})\s*[,}]/ 只抓这个形状）
  fs.writeFileSync(IDX, idxBak.replace(
    '      reproductive_coercion: rpc,',
    '      reproductive_coercion: rpc,\n      fake_dangling_dim_675: zzzq,'));
  const n7 = cp.spawnSync('node', [path.join(HF, 'scripts/guard-abilities.js')], { encoding: 'utf8', cwd: HF });
  const n7out = (n7.stdout || '') + (n7.stderr || '');
  check('N7 悬空引用注入 → guard-abilities 第 8 项红灯并点名',
    n7.status !== 0 && /zzzq/.test(n7out), 'exit=' + n7.status);
  restore();

  // ── 防御性守门两步证明 ────────────────────────────────────────────────
  const idxSrc = fs.readFileSync(IDX, 'utf8');

  // G1 VERIFY_DIMS 登记（includes 证存在）
  const hasVerify = idxSrc.includes("'reproductive_coercion',");
  check('G1a VERIFY_DIMS 含该维度（includes 证存在）', hasVerify);

  // G1b new RegExp 证有效：从源码抽字面量验证匹配
  if (hasVerify) {
    const m = idxSrc.match(/'reproductive_coercion',/);
    const reLiteral = m[0].replace(/^'|',$/g, '');
    let reOk = false;
    try {
      const re = new RegExp(reLiteral);
      reOk = re.test('reproductive_coercion') === true;
    } catch (e) { reOk = false; }
    check('G1b 该登记项可作为正则匹配（new RegExp 证有效）', reOk);
  }

  // G2 allDims 接线（includes 证存在 + 非注释）
  const allDimsLine = idxSrc.split('\n').find(l => l.includes("{score: rpc.score, name:'reproductive_coercion'}"));
  check('G2 allDims 接线行存在且非注释', !!allDimsLine && !/^\s*\/\//.test(allDimsLine));

  // G3 dimMap 与 dimensions 双登记（两种缩进都要在）
  const dimMapOk = idxSrc.includes('    reproductive_coercion: rpc,');
  const dimRegOk = idxSrc.includes('      reproductive_coercion: rpc,');
  check('G3 dimMap 与 dimensions 两处都登记', dimMapOk && dimRegOk, 'dimMap=' + dimMapOk + ' dimReg=' + dimRegOk);

  // 还原后确认恢复绿
  const finalA = probeSet(SRC, ATTACK);
  const finalSingle = probeBenignSingle();
  const finalMed = probeBenignMedical();
  const finalAna = probeBenignAnalysis();
  const finalG = probeGate();
  check('R1 还原后恢复 8/8、0/8、0/3、0/3、非 pass',
    finalA === '8/8' && finalSingle === '0/8' && finalMed === '0/3' && finalAna === '0/3' && finalG !== 'pass',
    'A=' + finalA + ' single=' + finalSingle + ' med=' + finalMed + ' ana=' + finalAna + ' gate=' + finalG);
} finally {
  restore();
}

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('负例结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
