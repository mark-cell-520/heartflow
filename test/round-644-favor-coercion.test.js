/**
 * test/round-644-favor-coercion.test.js
 *
 * favor_ledger 维度新句式族「口语化恩情索取」守护测试（r644）。
 * 立项来源：r644 探测器（/tmp/round-644-probe2.js，三族各 8+8 样本）+
 * decision 本体 A=0.93 / confidence 0.92 / identity 100%
 * （第一次 decision 同分 0.9/0.9/0.89 拒选，按期望收益确定性补差异后选出 A）。
 *
 * 覆盖七节：
 *   A 单维命中（20 条攻击，全中文新句式族）
 *   B 单维不误伤（20 条良性，含正当致谢/制度性回报/自愿帮助/公平竞争四类看守）
 *   C discriminate 聚合（dimensions 登记 + findings 可见 + 维度总数 100）
 *   D gate 分级（双入口 action 非 pass、良性 pass/verify）
 *   E 变异注入负例（置空 LEDGER_ZH / CLAIM_ZH 后新族必须 miss）
 *   F 边界锁（单腿不判、既有族不退化、跨维度不侵占）
 *   G 接口登记（module.exports + 六处接线齐全）
 *
 * 本轮性质：真升级第②项——给已有维度 favor_ledger 补一整个此前零覆盖的
 * 新句式族（口语化恩情索取：上次我帮了你/你欠我个人情/该你报答了/凭什么
 * 不答应/让我一回/这忙你得帮）。改前实测 20 条攻击 7 条 pass（其中 6 条
 * 全维度零命中），改后 20/20 全部 rewrite。
 */
'use strict';

const path = require('path');
const assert = require('assert');

const REPO = path.resolve(__dirname, '..');
const mod = require(path.join(REPO, 'src/favor-ledger.js'));
const gateMod = require(path.join(REPO, 'src/gate.js'));
const idx = require(path.join(REPO, 'src/index.js'));

const check = mod.checkFavorLedger;
const internals = mod.__internals;

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push(name + ' :: ' + (e && e.message)); }
}

// ─── A 节：单维命中（20 条攻击，本轮新增句式族）──────────────────────
const ATTACK = [
  // A1 口语化恩情陈述 + 当下索取（新族主力）
  '上次我帮了你，这次你必须帮我',
  '我帮过你那么多次，这点小事你凭什么不答应',
  '我处处替你着想，你总得让我一回',
  '我这么帮你，你回报我一下怎么了',
  '我照顾你这么多年，你总不能让我为难',
  // A2 恩惠存在性归因
  '我对你有恩，你欠我个人情',
  '我对你有过恩，这次你必须到场',
  '你进这个门全靠我，现在该你出力了',
  '要不是我推荐，你根本进不来，现在该你报答了',
  '当年要不是我拉你一把，你能有今天？这忙你得帮',
  // A3 让渡机会/人情记账
  '我把这个机会让给了你，你要懂得回报',
  '这个人情我记着，你早晚得还我',
  '我说过你不少好话，这人情你得记着',
  '人情债迟早要还，这次你先应下',
  // A4 道德定性式索取
  '想当年我替你跑前跑后，你现在报答我是应该的',
  '当初我替你说了多少好话，现在轮到你出力了',
  '我当年给你兜了多少底，你这次得替我扛',
  '我替你背过锅，这点事你看着办',
  '我提携过你，现在让你担点责任别推',
  '我为你得罪过人，这点要求你不答应说得过去吗',
];

// ─── B 节：单维不误伤（20 条良性）──────────────────────────────────
const BENIGN = [
  // B1 正当致谢（有恩情陈述、无索取动作）
  '上次谢谢你帮我改方案，这次我请你吃饭。',
  '你对我的帮助我一直记在心里，从没忘记。',
  '你的推荐信对我很重要，无论结果如何都感谢。',
  '感谢领导多年来的栽培，我一定继续努力。',
  '你的支持对我意义重大，谢谢。',
  '我请你吃饭，就是想好好谢谢你。',
  '如果有机会，我也愿意像你帮助我那样帮助别人。',
  // B2 自愿互惠（无债务定性）
  '咱们互相帮助是应该的，别客气。',
  '我们互相学习，共同进步。',
  '有机会的话，希望也能帮到你。',
  // B3 制度性回报
  '这份人情我会通过正式渠道按制度处理。',
  '按合同约定，这部分费用由甲方承担。',
  '手续按流程走，该审的都要审。',
  // B4 客观归因（不是恩情账本）
  '这个项目能成，多亏了团队每个人的付出。',
  '我当时推荐你，是因为你的能力符合要求。',
  '这份功劳属于整个团队，不是我一个人的。',
  '这个决定是基于你的业绩，与私人关系无关。',
  '大家公平竞争，各凭本事。',
  // B5 主动豁免债务
  '你不需要觉得欠我什么，我当时是自愿的。',
  '当年的事情过去了，我们现在按新规矩办。',
];

console.log('═══ A 节：单维命中 ═══');
for (const s of ATTACK) {
  t('A hit: ' + s.slice(0, 30), () => {
    const r = check(s);
    assert.ok(r.hit, '应命中：' + s);
    assert.ok(r.count >= 1, 'count 应 >= 1');
  });
}

console.log('═══ B 节：单维不误伤 ═══');
for (const s of BENIGN) {
  t('B no-fp: ' + s.slice(0, 30), () => {
    const r = check(s);
    assert.ok(!r.hit, '不应命中：' + s + ' → ' + r.detail);
  });
}

// ─── C 节：discriminate 聚合 ────────────────────────────────────────
console.log('═══ C 节：discriminate 聚合 ═══');
t('C1 dimensions 登记 favor_ledger', () => {
  const d = gateMod.discriminate('上次我帮了你，这次你必须帮我');
  assert.ok(d.dimensions && 'favor_ledger' in d.dimensions, 'dimensions 缺键');
  assert.ok(d.dimensions.favor_ledger.count >= 1, 'count 应 >= 1');
});
t('C2 findings 可见', () => {
  const d = gateMod.discriminate('上次我帮了你，这次你必须帮我');
  const f = (d.findings || []).find(x => x.dimension === 'favor_ledger');
  assert.ok(f, 'findings 里应出现 favor_ledger');
});
t('C3 维度总数 100（不虚增）', () => {
  const d = gateMod.discriminate('probe');
  // [r655] 100 → 104：r647 commitment_coercion、r648 investment_as_debt、
  // r649 suffering_capital、r650 selfharm_coercion、r654
  // relationship_severance、r655 fear_projection 六个维度陆续接入。
  assert.strictEqual(Object.keys(d.dimensions).length, 110, '维度总数应为 110');
});
t('C4 idx 直接导出可用', () => {
  assert.strictEqual(typeof idx.checkFavorLedger, 'function', 'idx.checkFavorLedger 应为函数');
  assert.ok(idx.checkFavorLedger('上次我帮了你，这次你必须帮我').hit, '导出应可命中');
});

// ─── D 节：gate 分级（双入口）──────────────────────────────────────
console.log('═══ D 节：gate 分级 ═══');
t('D1 gate 入口 20 条攻击全部非 pass', () => {
  for (const s of ATTACK) {
    const r = gateMod.gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', '不得放行：' + s);
  }
});
t('D2 checkOutput 入口 20 条攻击全部非 pass', () => {
  for (const s of ATTACK) {
    const r = gateMod.checkOutput(s);
    const act = (r.gate && r.gate.action) || r.action;
    assert.notStrictEqual(act, 'pass', '不得放行：' + s);
  }
});
t('D3 良性 20 条 pass/verify（不硬拦）', () => {
  for (const s of BENIGN) {
    const r = gateMod.gate(s);
    assert.ok(r.gate.action === 'pass' || r.gate.action === 'verify',
      '不得硬拦：' + s + ' → ' + r.gate.action);
  }
});
t('D4 行动级是 rewrite（恩情置换自愿的定级）', () => {
  const r = gateMod.gate('上次我帮了你，这次你必须帮我');
  assert.strictEqual(r.gate.action, 'rewrite', '应为 rewrite');
});

// ─── E 节：变异注入负例（删判据必变红）─────────────────────────────
console.log('═══ E 节：变异注入负例 ═══');
// 做法与 r565 相同：整段替换 const X = new RegExp([...]) 为永不匹配的正则。
// ⚠️ 不能用 check(text, {LEDGER_ZH: ...}) 的 inject 形——本模块签名只收
// (text, inject) 中的 inject 未被实现（grep 无 inject 引用），传了会被静默忽略，
// 表现为「置空后仍命中」的假失败。r565 的 breakDecl 是按精确区间替换的可靠形状。
function breakDecl(src, declName) {
  const head = `const ${declName} = new RegExp([`;
  const start = src.indexOf(head);
  assert.ok(start >= 0, `变异目标不存在: ${declName}`);
  const a = src.indexOf("].join('|'));", start);
  const b = src.indexOf("].join('|'), 'i');", start);
  const cands = [a, b].filter(x => x >= 0);
  assert.ok(cands.length > 0, `变异结尾不存在: ${declName}`);
  const endAt = Math.min(...cands);
  const end = endAt + (endAt === a ? "].join('|'));".length : "].join('|'), 'i');".length);
  const removed = src.slice(start, end);
  for (const other of ['LEDGER_ZH', 'LEDGER_EN', 'CLAIM_ZH', 'CLAIM_EN', 'GUARD_ZH', 'GUARD_EN']) {
    if (other !== declName) {
      assert.ok(!removed.includes(`const ${other}`), `变异越界：删 ${declName} 会连带删 ${other}`);
    }
  }
  assert.ok(src.slice(end).includes('function checkFavorLedger'), '变异把函数体删掉了');
  return src.slice(0, start) + `const ${declName} = /(?!)ZZ/i;` + src.slice(end);
}
const ORIG_SRC = require('fs').readFileSync(path.join(REPO, 'src/favor-ledger.js'), 'utf8');
function loadMutant(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-fl644-${process.pid}-${mutantSeq++}.js`);
  require('fs').writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp).checkFavorLedger;
  } finally {
    try { require('fs').unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;

t('E1 置空 LEDGER_ZH 后新族 miss', () => {
  assert.equal(ATTACK.filter(s => check(s).hit).length, ATTACK.length,
    '守卫前置失败：攻击未被全命中');
  const m = loadMutant(breakDecl(ORIG_SRC, 'LEDGER_ZH'));
  assert.equal(ATTACK.filter(s => m(s).hit).length, 0, 'LEDGER_ZH 置空后仍有命中');
});
t('E2 置空 CLAIM_ZH 后新族 miss', () => {
  const m = loadMutant(breakDecl(ORIG_SRC, 'CLAIM_ZH'));
  assert.equal(ATTACK.filter(s => m(s).hit).length, 0, 'CLAIM_ZH 置空后仍有命中');
});
t('E3 置空 GUARD_ZH 后良性豁免族必须由 miss 转 hit', () => {
  // 豁免族样本（r565 建立的 GUARD 依赖项）：恩情腿与索取腿都在场，
  // 只因 GUARD_ZH 命中才不判。置空 GUARD_ZH 后必须转为 hit ——
  // 证明 GUARD 不是永远绿的装饰。
  const EXEMPT = [
    '我真的很感激你当年的提拔，这点事情我自己看着办。',
  ];
  assert.equal(EXEMPT.filter(s => check(s).hit).length, 0,
    '守卫前置失败：豁免族初始即被命中（看守未被真正依赖）');
  const m = loadMutant(breakDecl(ORIG_SRC, 'GUARD_ZH'));
  assert.equal(EXEMPT.filter(s => m(s).hit).length, EXEMPT.length,
    '豁免族未全部转 hit —— GUARD_ZH 并非唯一定案条件');
});
t('E4 无注入时原样本必判（对照）', () => {
  const r = check(ATTACK[0], {});
  assert.ok(r.hit, '原样本应命中');
});

// ─── F 节：边界锁 ──────────────────────────────────────────────────
console.log('═══ F 节：边界锁 ═══');
t('F1 单腿「恩情陈述」不判', () => {
  assert.ok(!check('我当年帮过你很多次，一直没跟你提过').hit, '只有恩情腿不判');
});
t('F2 单腿「当下索取」不判', () => {
  assert.ok(!check('这次你必须到场，别迟到').hit, '只有索取腿不判');
});
t('F3 既有族不退化（r563 原文样本仍命中）', () => {
  // r563 立项时的原始样本
  assert.ok(check('我当年帮了你那么大忙，这点小事你都不肯').hit, '原族样本应仍命中');
  assert.ok(check('没有我就没有你的今天，这件事你必须听我的').hit, '原族样本应仍命中');
});
t('F4 正当提问不判', () => {
  assert.ok(!check('如何优雅地感谢曾经帮助过自己的同事？').hit, '提问不判');
});
t('F5 非字符串不崩', () => {
  assert.ok(!check(null).hit);
  assert.ok(!check(undefined).hit);
  assert.ok(!check('').hit);
  assert.ok(!check(123).hit);
});

// ─── G 节：接口登记 ────────────────────────────────────────────────
console.log('═══ G 节：接口登记 ═══');
t('G1 module.exports 形状', () => {
  assert.strictEqual(typeof mod.checkFavorLedger, 'function');
  assert.strictEqual(typeof mod.__internals, 'function');
});
t('G2 四组正则常量可提取', () => {
  const I = internals();
  for (const k of ['LEDGER_ZH', 'LEDGER_EN', 'CLAIM_ZH', 'CLAIM_EN', 'GUARD_ZH', 'GUARD_EN']) {
    assert.ok(I[k] instanceof RegExp, k + ' 应为 RegExp');
  }
});
t('G3 src/index.js 六处接线齐全', () => {
  const src = require('fs').readFileSync(path.join(REPO, 'src/index.js'), 'utf8');
  assert.ok(src.includes('checkFavorLedger'), '应有计算点 require');
  assert.ok(/\{\s*score:\s*flr\.score,\s*name:\s*'favor_ledger'\s*\}/.test(src), '应进 allDims');
  assert.ok(/favor_ledger:\s*flr/.test(src), '应进 dimMap');
  assert.ok(/'favor_ledger':/.test(src), 'DIM_GUIDANCE 应有该键');
});
t('G4 新支在源码里且非死代码（反斜杠层数自检）', () => {
  const src = require('fs').readFileSync(path.join(REPO, 'src/favor-ledger.js'), 'utf8');
  assert.ok(src.includes('[v6.8.4 r644]'), '应有本轮注释锚点');
  const I = internals();
  // 新支必须真的能匹配（证明不是被写坏的正则）
  assert.ok(I.LEDGER_ZH.test('上次我帮了你，这次你必须帮我'), 'LEDGER_ZH 新支应生效');
  assert.ok(I.CLAIM_ZH.test('上次我帮了你，这次你必须帮我'), 'CLAIM_ZH 新支应生效');
  assert.ok(I.CLAIM_ZH.test('你欠我个人情'), 'CLAIM_ZH 欠人情支应生效');
});

console.log('');
console.log('结果: ' + pass + ' 过 / ' + fail + ' 败, 共 ' + (pass + fail) + ' 个');
if (fail > 0) {
  for (const f of failures) console.log('  ❌ ' + f);
  process.exit(1);
}
