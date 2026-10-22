/**
 * scripts/negative-test-comparative-devaluation.js
 *
 * [r673] 负例测试：行为注入 + 防御性守门「存在+有效」两步证明。
 * 参考 scripts/negative-test-thought-terminating-cliche.js。
 *
 * 七处行为注入（临时变异源码 → 确认测试变红 → 还原 → 确认恢复绿）：
 *   N1 REF 腿置空 → 攻击全 miss
 *   N2 DEVALUE 腿置空 → 攻击全 miss
 *   N3 判定层改「单腿即命中」→ 单腿良性开始误伤
 *   N4 DOMAIN 守门摘除 → 学术科普良性被误伤
 *   N5 QUESTION 守门摘除 → 句首咨询良性被误伤
 *   N6 allDims 摘线（score 置 0）→ gate.action 恒 pass
 *   N7 dimensions 悬空引用注入 → guard-abilities 第 8 项红灯
 * 三处防御性守门两步证明（includes 证存在 + new RegExp 证有效）：
 *   G1 VERIFY_DIMS 登记该维度
 *   G2 allDims 接线行存在且非注释
 *   G3 dimMap 与 dimensions 双登记
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = path.join(HF, 'src/comparative-devaluation.js');
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

// 攻击样本（REF × DEVALUE 双腿）——用于 N1/N2
const ATTACK = [
  '人家老婆都能做到，怎么就你不行？',
  '别人男朋友天天送花，你连节日都记不住。',
  '我闺蜜的老公年薪百万，你呢？',
  "Other people's spouses manage to do this; why can't you?",
  '你看看你同学，哪个不比你有出息？',
  "Everyone else's partner handles this fine; you are the problem.",
  '别人家的老公都知道浪漫，你呢？',
  '你看看同事的老公，天天接送孩子。你呢？',
];

function probeSet(file, list) {
  const out = cp.spawnSync('node', ['-e', `
    const m = require(${JSON.stringify(file)});
    const t = ${JSON.stringify(list)};
    let hit = 0;
    for (const x of t) if (m.checkComparativeDevaluation(x).hit) hit++;
    console.log(hit + '/' + t.length);
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

// 单腿良性：只有 REF 或只有 DEVALUE——证明双腿共现判据在保护这些正当句（N3 用）
function probeBenignSingle() {
  return probeSet(SRC, [
    '别人家的孩子都在上大学。',
    '闺蜜的老公是个医生。',
    '我同事的女儿今年考上大学了。',
    '你就是不行，认命吧。',
    '你怎么还没动静？',
    '你连这个都记不住。',
    'Other people manage their time well.',
    '你怎么这么抠？',
  ]);
}
// 学术科普良性：REF×DEVALUE 双腿命中但 DOMAIN 守门该拦（N4 用）
// ⚠️ 样本必须真实落在 DOMAIN 正则射程内（社会比较/攀比 + 14 字内 +
//    心理学/研究），否则测的不是守门——r673 曾用「攀比心理会让…」中段
//    超 14 字的句子，基线就误伤，N0/R1 连错两轮。
function probeBenignDomain() {
  return probeSet(SRC, [
    '社会比较研究指出，「别人老公都升职了，你怎么还没动静」这类比较贬低伤害关系。',
    '攀比心理研究提醒我们，「别人男朋友都送花，你连节日都记不住」是典型的打压话术。',
  ]);
}
// 句首咨询良性：REF×DEVALUE 双腿命中但 QUESTION 守门该拦（N5 用）
// ⚠️ 咨询词必须真在句首，且 DEVALUE 腿要真匹配（「你呢」后须跟问号）。
function probeBenignQuestion() {
  return probeSet(SRC, [
    '如何看待别人老公都升职了，你怎么还没动静？',
    '怎么回应伴侣总说的「别人家的老公都知道浪漫，你呢」？',
  ]);
}

function probeGate() {
  const out = cp.spawnSync('node', ['-e', `
    const gate = require(${JSON.stringify(path.join(HF, 'src/gate.js'))});
    const t = '别人男朋友天天送花，你连节日都记不住。';
    const r = gate.checkOutput(t);
    console.log((r.gate && r.gate.action) || r.action || 'unknown');
  `], { encoding: 'utf8', cwd: HF });
  return (out.stdout || '').trim();
}

try {
  // 基线
  const baseA = probeSet(SRC, ATTACK);
  const baseSingle = probeBenignSingle();
  const baseDomain = probeBenignDomain();
  const baseQ = probeBenignQuestion();
  const baseG = probeGate();
  console.log('基线: 攻击 ' + baseA + '｜单腿良性误伤 ' + baseSingle + '｜学术良性误伤 ' + baseDomain + '｜咨询良性误伤 ' + baseQ + '｜gate ' + baseG);
  check('N0 基线为 8/8、0/8、0/2、0/2、非 pass',
    baseA === '8/8' && baseSingle === '0/8' && baseDomain === '0/2' && baseQ === '0/2' && baseG !== 'pass',
    'A=' + baseA + ' single=' + baseSingle + ' domain=' + baseDomain + ' q=' + baseQ + ' gate=' + baseG);

  // N1 REF 腿置空（替换整个常量声明为永不匹配的正则，不是在数组头插入空分支）
  fs.writeFileSync(SRC, srcBak.replace(
    /const REF_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    "const REF_ZH = /(?!)x/;"));
  const n1 = probeSet(SRC, ATTACK);
  check('N1 REF 腿摘除 → 攻击 0/8', n1 === '0/8', 'got ' + n1);
  restore();

  // N2 DEVALUE 腿置空
  fs.writeFileSync(SRC, srcBak.replace(
    /const DEVALUE_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\), 'i'\);/,
    "const DEVALUE_ZH = /(?!)x/;"));
  const n2 = probeSet(SRC, ATTACK);
  check('N2 DEVALUE 腿摘除 → 攻击 0/8', n2 === '0/8', 'got ' + n2);
  restore();

  // N3 判定层改为「单腿即命中」
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (REF_ZH_.test(text) && DEVALUE_ZH_.test(text)) return hitResult;',
    '  if (REF_ZH_.test(text)) return hitResult;\n  if (DEVALUE_ZH_.test(text)) return hitResult;'));
  const n3 = probeBenignSingle();
  check('N3 判定层改单腿 → 单腿良性误伤 > 0', n3 !== '0/8', 'got ' + n3);
  restore();

  // N4 DOMAIN 守门摘除（注释掉判定行，不是删除）
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (DOMAIN_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n4 = probeBenignDomain();
  check('N4 DOMAIN 守门摘除 → 学术科普良性误伤 > 0', n4 !== '0/2', 'got ' + n4);
  restore();

  // N5 QUESTION 守门摘除
  fs.writeFileSync(SRC, srcBak.replace(
    '  if (QUESTION_ZH_.test(text)) return miss();',
    '  // [negative-test] 守门摘除'));
  const n5 = probeBenignQuestion();
  check('N5 QUESTION 守门摘除 → 句首咨询良性误伤 > 0', n5 !== '0/2', 'got ' + n5);
  restore();

  // N6 allDims 摘线（score 恒 0）→ gate pass
  fs.writeFileSync(IDX, idxBak.replace(
    "    {score: cd.score, name:'comparative_devaluation'},",
    "    {score: 0, name:'comparative_devaluation'},"));
  const n6 = probeGate();
  check('N6 allDims 摘线 → gate 恒 pass', n6 === 'pass', 'got ' + n6);
  restore();

  // N7 dimensions 悬空引用注入 → guard-abilities 第 8 项红灯
  // ⚠️ 注入的变量名必须是 1-5 位小写字母（guard 的 registered 正则
  //    /:\s*([a-z]{1,5})\s*[,}]/ 只抓这个形状），写成 zzz_nonexistent_var
  //    会因超长+下划线而不在射程内，得到「exit=1 但没点名」的假失败。
  fs.writeFileSync(IDX, idxBak.replace(
    '      comparative_devaluation: cd,',
    '      comparative_devaluation: cd,\n      fake_dangling_dim_673: zzzq,'));
  const n7 = cp.spawnSync('node', [path.join(HF, 'scripts/guard-abilities.js')], { encoding: 'utf8', cwd: HF });
  const n7out = (n7.stdout || '') + (n7.stderr || '');
  check('N7 悬空引用注入 → guard-abilities 第 8 项红灯并点名',
    n7.status !== 0 && /zzzq/.test(n7out), 'exit=' + n7.status);
  restore();

  // ── 防御性守门两步证明 ────────────────────────────────────────────────
  const idxSrc = fs.readFileSync(IDX, 'utf8');

  // G1 VERIFY_DIMS 登记（includes 证存在）
  const hasVerify = idxSrc.includes("'comparative_devaluation',");
  check('G1a VERIFY_DIMS 含该维度（includes 证存在）', hasVerify);

  // G1b new RegExp 证有效：从源码抽字面量验证匹配
  if (hasVerify) {
    const m = idxSrc.match(/'comparative_devaluation',/);
    const reLiteral = m[0].replace(/^'|',$/g, '');
    let reOk = false;
    try {
      const re = new RegExp(reLiteral);
      reOk = re.test('comparative_devaluation') === true;
    } catch (e) { reOk = false; }
    check('G1b 该登记项可作为正则匹配（new RegExp 证有效）', reOk);
  }

  // G2 allDims 接线（includes 证存在 + 非注释）
  const allDimsLine = idxSrc.split('\n').find(l => l.includes("{score: cd.score, name:'comparative_devaluation'}"));
  check('G2 allDims 接线行存在且非注释', !!allDimsLine && !/^\s*\/\//.test(allDimsLine));

  // G3 dimMap 与 dimensions 双登记（两种缩进都要在）
  const dimMapOk = idxSrc.includes('    comparative_devaluation: cd,');
  const dimRegOk = idxSrc.includes('      comparative_devaluation: cd,');
  check('G3 dimMap 与 dimensions 两处都登记', dimMapOk && dimRegOk, 'dimMap=' + dimMapOk + ' dimReg=' + dimRegOk);

  // 还原后确认恢复绿
  const finalA = probeSet(SRC, ATTACK);
  const finalSingle = probeBenignSingle();
  const finalDomain = probeBenignDomain();
  const finalQ = probeBenignQuestion();
  const finalG = probeGate();
  check('R1 还原后恢复 8/8、0/8、0/2、0/2、非 pass',
    finalA === '8/8' && finalSingle === '0/8' && finalDomain === '0/2' && finalQ === '0/2' && finalG !== 'pass',
    'A=' + finalA + ' single=' + finalSingle + ' domain=' + finalDomain + ' q=' + finalQ + ' gate=' + finalG);
} finally {
  restore();
}

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('负例结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
if (fail > 0) process.exit(1);
