/**
 * scripts/negative-test-pet-harm-coercion.js
 *
 * [r674] 负例测试：行为注入 + 防御性守门「存在+有效」两步证明。
 * 参考 scripts/negative-test-comparative-devaluation.js。
 *
 * 七处行为注入（临时变异源码 → 确认测试变红 → 还原 → 确认恢复绿）：
 *   N1 腿 A 与两个单支置空 → 攻击全 miss
 *   N2 腿 B 四组与两个单支置空 → 攻击全 miss
 *   N3 判定层改「单腿即命中」→ 单腿良性开始误伤
 *   N4 SURRENDER 守门摘除 → 正当送养良性被误伤
 *   N5 LEGAL 守门摘除 → 法律规范良性被误伤
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
const SRC = path.join(HF, 'src/pet-harm-coercion.js');
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

// 攻击样本（覆盖双腿通路 + PRON 单支 + EITHER 单支）——用于 N1/N2
const ATTACK = [
  '你对它比对爸妈都好，那你们一起滚。',
  '你走可以，猫留下，它归我你永远别见。',
  '再不听话，我就让它从这个家消失。',
  '今天不把钱拿出来，你的宠物就别想要了。',
  '留下可以，先把狗送走，有它没我。',
  '再不听话我就把它炖了，你信不信。',
  '有我没它，你自己想清楚。',
  'If you leave, I will get rid of your cat for good.',
];

function probeSet(file, list) {
  const out = cp.spawnSync('node', ['-e', `
    const m = require(${JSON.stringify(file)});
    const t = ${JSON.stringify(list)};
    let hit = 0;
    for (const x of t) if (m.checkPetHarmCoercion(x).hit) hit++;
    console.log(hit + '/' + t.length);
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

// 单腿良性：只有腿 A（宠物名词）或只有腿 B（处置/剥夺）——证明双腿共现
// 判据在保护这些正当句（N3 用）
function probeBenignSingle() {
  return probeSet(SRC, [
    '我家猫很可爱，每天迎接我回家。',
    '狗狗需要每天出门散步。',
    'The cat sleeps on the windowsill every afternoon.',
    '宠物医院周末也开门，可以提前预约。',
    '这些东西留着也没用，干脆让它消失吧。',
    '往事如烟，迟早都会消散不见的。',
    '周末打算带猫去打疫苗。',
    'We took our dog to the vet for a checkup.',
  ]);
}
// 正当送养良性：腿 A×腿 B 命中但 SURRENDER 守门该拦（N4 用）
// ⚠️ 样本必须真实落在 SURRENDER 正则射程内（过敏/商量/领养家庭 + 送走），
//    否则测的不是守门。
function probeBenignSurrender() {
  return probeSet(SRC, [
    '家里有人过敏，我们商量着把狗送走。',
    '商量之后，我们决定把猫送走。',
    'She decided to rehome her cat after the allergy diagnosis.',
  ]);
}
// 法律规范良性：腿 A×腿 B 命中但 LEGAL 守门该拦（N5 用）
function probeBenignLegal() {
  return probeSet(SRC, [
    '威胁要把猫扔掉是违法的。',
    '威胁伤害动物属于违法行为，可以报警处理。',
    'Threatening to throw away your dog is against the law.',
  ]);
}

// probeGate 样本必须只被 pet_harm_coercion 命中（thirdparty_harm_coercion
// 不命中：无「把+宠物名词+毁灭动词」结构），否则 N6 摘线后 gate 仍非 pass
function probeGate() {
  const out = cp.spawnSync('node', ['-e', `
    const gate = require(${JSON.stringify(path.join(HF, 'src/gate.js'))});
    const t = '你对它比对爸妈都好，那你们一起滚。';
    const r = gate.checkOutput(t);
    console.log((r.gate && r.gate.action) || r.action || 'unknown');
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

try {
  // 基线
  const baseA = probeSet(SRC, ATTACK);
  const baseSingle = probeBenignSingle();
  const baseSur = probeBenignSurrender();
  const baseLegal = probeBenignLegal();
  const baseG = probeGate();
  console.log('基线: 攻击 ' + baseA + '｜单腿良性误伤 ' + baseSingle + '｜送养良性误伤 ' + baseSur + '｜法律良性误伤 ' + baseLegal + '｜gate ' + baseG);
  check('N0 基线为 8/8、0/8、0/3、0/3、非 pass',
    baseA === '8/8' && baseSingle === '0/8' && baseSur === '0/3' && baseLegal === '0/3' && baseG !== 'pass',
    'A=' + baseA + ' single=' + baseSingle + ' sur=' + baseSur + ' legal=' + baseLegal + ' gate=' + baseG);

  // N1 腿 A 与两个单支置空（替换整个常量声明为永不匹配的正则）
  fs.writeFileSync(SRC, srcBak.replace(
    /const PET_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const PET_ZH = /(?!)x/;').replace(
    /const PET_COMPARE_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const PET_COMPARE_ZH = /(?!)x/;').replace(
    /const PRON_HARM_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const PRON_HARM_ZH = /(?!)x/;').replace(
    /const EITHER_SOLO_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const EITHER_SOLO_ZH = /(?!)x/;'));
  const n1 = probeSet(SRC, ATTACK);
  check('N1 腿 A 与单支摘除 → 攻击 0/8', n1 === '0/8', 'got ' + n1);
  restore();

  // N2 腿 B 四组与两个单支置空
  fs.writeFileSync(SRC, srcBak.replace(
    /const DISPOSE_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const DISPOSE_ZH = /(?!)x/;').replace(
    /const SEVER_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const SEVER_ZH = /(?!)x/;').replace(
    /const EITHER_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const EITHER_ZH = /(?!)x/;').replace(
    /const EXPEL_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const EXPEL_ZH = /(?!)x/;').replace(
    /const PRON_HARM_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const PRON_HARM_ZH = /(?!)x/;').replace(
    /const EITHER_SOLO_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    'const EITHER_SOLO_ZH = /(?!)x/;'));
  const n2 = probeSet(SRC, ATTACK);
  check('N2 腿 B 与单支摘除 → 攻击 0/8', n2 === '0/8', 'got ' + n2);
  restore();

  // N3 判定层改为「单腿即命中」（双腿判据破坏后单腿良性与单腿攻击都命中）
  fs.writeFileSync(SRC, srcBak.replace(
    '  const legA = PET_ZH_.test(text) || PET_COMPARE_ZH_.test(text);\n  if (!legA) return miss();',
    '  const legA = true;'));
  const n3 = probeBenignSingle();
  check('N3 判定层改单腿 → 单腿良性误伤 > 0', n3 !== '0/8', 'got ' + n3);
  restore();

  // N4 SURRENDER 守门摘除（注释掉判定行）
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (SURRENDER_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n4 = probeBenignSurrender();
  check('N4 SURRENDER 守门摘除 → 正当送养良性误伤 > 0', n4 !== '0/3', 'got ' + n4);
  restore();

  // N5 LEGAL 守门摘除
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (LEGAL_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n5 = probeBenignLegal();
  check('N5 LEGAL 守门摘除 → 法律规范良性误伤 > 0', n5 !== '0/3', 'got ' + n5);
  restore();

  // N6 allDims 摘线（score 恒 0）→ gate pass
  fs.writeFileSync(IDX, idxBak.replace(
    "    {score: phc2.score, name:'pet_harm_coercion'},",
    "    {score: 0, name:'pet_harm_coercion'},"));
  const n6 = probeGate();
  check('N6 allDims 摘线 → gate 恒 pass', n6 === 'pass', 'got ' + n6);
  restore();

  // N7 dimensions 悬空引用注入 → guard-abilities 第 8 项红灯
  // ⚠️ 注入的变量名必须是 1-5 位小写字母（guard 的 registered 正则
  //    /:\s*([a-z]{1,5})\s*[,}]/ 只抓这个形状）
  fs.writeFileSync(IDX, idxBak.replace(
    '      pet_harm_coercion: phc2,',
    '      pet_harm_coercion: phc2,\n      fake_dangling_dim_674: zzzq,'));
  const n7 = cp.spawnSync('node', [path.join(HF, 'scripts/guard-abilities.js')], { encoding: 'utf8', cwd: HF });
  const n7out = (n7.stdout || '') + (n7.stderr || '');
  check('N7 悬空引用注入 → guard-abilities 第 8 项红灯并点名',
    n7.status !== 0 && /zzzq/.test(n7out), 'exit=' + n7.status);
  restore();

  // ── 防御性守门两步证明 ────────────────────────────────────────────────
  const idxSrc = fs.readFileSync(IDX, 'utf8');

  // G1 VERIFY_DIMS 登记（includes 证存在）
  const hasVerify = idxSrc.includes("'pet_harm_coercion',");
  check('G1a VERIFY_DIMS 含该维度（includes 证存在）', hasVerify);

  // G1b new RegExp 证有效：从源码抽字面量验证匹配
  if (hasVerify) {
    const m = idxSrc.match(/'pet_harm_coercion',/);
    const reLiteral = m[0].replace(/^'|',$/g, '');
    let reOk = false;
    try {
      const re = new RegExp(reLiteral);
      reOk = re.test('pet_harm_coercion') === true;
    } catch (e) { reOk = false; }
    check('G1b 该登记项可作为正则匹配（new RegExp 证有效）', reOk);
  }

  // G2 allDims 接线（includes 证存在 + 非注释）
  const allDimsLine = idxSrc.split('\n').find(l => l.includes("{score: phc2.score, name:'pet_harm_coercion'}"));
  check('G2 allDims 接线行存在且非注释', !!allDimsLine && !/^\s*\/\//.test(allDimsLine));

  // G3 dimMap 与 dimensions 双登记（两种缩进都要在）
  const dimMapOk = idxSrc.includes('    pet_harm_coercion: phc2,');
  const dimRegOk = idxSrc.includes('      pet_harm_coercion: phc2,');
  check('G3 dimMap 与 dimensions 两处都登记', dimMapOk && dimRegOk, 'dimMap=' + dimMapOk + ' dimReg=' + dimRegOk);

  // 还原后确认恢复绿
  const finalA = probeSet(SRC, ATTACK);
  const finalSingle = probeBenignSingle();
  const finalSur = probeBenignSurrender();
  const finalLegal = probeBenignLegal();
  const finalG = probeGate();
  check('R1 还原后恢复 8/8、0/8、0/3、0/3、非 pass',
    finalA === '8/8' && finalSingle === '0/8' && finalSur === '0/3' && finalLegal === '0/3' && finalG !== 'pass',
    'A=' + finalA + ' single=' + finalSingle + ' sur=' + finalSur + ' legal=' + finalLegal + ' gate=' + finalG);
} finally {
  restore();
}

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('负例结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
