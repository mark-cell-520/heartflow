// r430 轮测：survivorship_bias「成功案例研究×处方化推广」新措辞家族
// 真升级②：既有维度 survivorship_bias（第132维）的全新措辞家族（统计素养轴换轴首轮）
// A 模块层攻击 14/14 + 双腿归因
// B 良性 14 模块层零命中 + gate 不含本维度（存量 gate 误伤项与基线逐项相同）
// C 精度边界锁（值得学习不收、裸复制代码不收、单腿不判×2、概念教学/反驳句/疑问句豁免、已知窄口「研究成功者就能成功」不收）
// D 负例注入四组（SUCCESS_SET_ZH_R430 / SUCCESS_SET_EN_R430 / PRESCRIPTION_ZH_R430 / PRESCRIPTION_EN_R430 逐一整族摘除，存量样本不翻）
// E 存量家族仍命中 + 存量良性豁免仍干净（加性证明）
// F gate 端到端（攻击非 pass 且 survivorship_bias 承重）
// G 接线零改动 + internals 四常量导出
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const idx = require(path.join(ROOT, 'src', 'index.js'));
const { checkSurvivorshipBias, __internals } = require(path.join(ROOT, 'src', 'survivorship-bias.js'));

let passed = 0;
let failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const ATK = [
  // ZH 新族腿①×腿②
  '看看那些百年企业的共同点，照着做就能活下来。',
  '研究这些赚到钱的人有什么特质，就能复制成功。',
  '这些活到老的人都有一个习惯，照做就能长寿。',
  '成功者都具备三个素质，做到你也能成功。',
  '走访了活得好的公司，把「持续投入研发」的经验照做，你的公司就能活。',
  '这些没被淘汰的产品都有共同点，学它们就不会被淘汰。',
  '这些屹立不倒的品牌有一个共同点，你照着做也能长青。',
  '调研那些活得最久的公司，把秘诀学过来，你也能基业长青。',
  '这些赢家都有一个共同点，照着做你也能赢。',
  '把百年老店的做法抄过来，你的店也能长盛不衰。',
  // EN 新族腿①×腿②
  'Look at what the surviving companies have in common and copy their playbook.',
  'Study the habits of people who lived past 100 and copy their routine.',
  'The winners all share these traits — adopt these traits and you win too.',
  'These long-lived brands prove persistence is all it takes — just copy their playbook.',
];
const BENIGN = [
  '百年企业的经验值得研究，但倒下的企业为什么倒也要一起分析，不能只看活的。',
  '成功者的特质可以归纳，但同样特质的人里也有大量失败者，不能倒推。',
  '活到老的人习惯相似，可没有对照就说明不了这些习惯的作用。',
  '这些赢家的共同点很有趣，不过样本是被筛选过的，不能当成功公式。',
  '活得好的公司有共性，也要看到同样做法却死掉的公司。',
  '没被淘汰的产品有原因，但学它们之前先看看被淘汰的为什么失败。',
  '屹立不倒的品牌值得学习，同时要研究倒下的品牌才能得出可靠结论。',
  '调研活得最久的公司只是第一步，还得对照失败样本才能下结论。',
  'Surviving companies share traits, but the failures share them too — study both.',
  'Look at what the winners did, but check the base rate before copying it.',
  'Study the habits of people who lived past 100, yet those habits may not cause longevity.',
  'The winners all share these traits, but the losers share many of them as well.',
  '复制这段代码到你的项目里，就能跑通这个 demo。',
  '这个配置照做一遍，服务就能起来，跟幸存者偏差没有关系。',
];
const STOCK_ATK = [
  '只采访了事故的幸存者，所以这反映了全体乘客的体验。', // r170 取样框族
  '比尔·盖茨辍学创业成了世界首富，所以你也该退学。',   // 主判据 SURVIVOR×GENERALIZE
  '这些活下来的老店都证明品质是关键。',                 // r270 共因归因族
  'Only those who survived were surveyed, and it represents everyone.', // r170 EN
];
const STOCK_BENIGN = [
  '幸存者偏差是一种常见的逻辑谬误。',
  '虽然盖茨退学了，但他已有多年编程经验，个案不具代表性。',
];
const NEVER = /(?!)/;
const fired = (s, inject) => checkSurvivorshipBias(s, inject).score > 0;

// ═══ A: 模块层攻击 14/14 + 双腿归因 ═══
console.log('A 模块层攻击:');
for (const [i, t] of ATK.entries()) {
  check(`A${i + 1} 攻击命中[${t.slice(0, 24)}…]`, () => {
    const r = checkSurvivorshipBias(t);
    assert_ok(r.score > 0, `未命中: ${t}`);
    assert_ok(/成功案例研究×处方化推广|success-study-prescription/.test(r.detail), `路由名不含新族: ${r.detail}`);
  });
}
check('A15 攻击样本双腿共现锁（单腿不判）', () => {
  // 腿①独走（无处方腿）
  assert_ok(!fired('这家公司是百年企业，去年营收增长了 20%。'), '腿①独走不应判');
  // 腿②独走（无成功案例集合腿）
  assert_ok(!fired('照着这份 checklist 做，服务就能起来。'), '腿②独走不应判');
});

// ═══ B: 良性 14 模块层零命中 + gate 不含本维度 ═══
console.log('B 模块层良性:');
for (const [i, t] of BENIGN.entries()) {
  check(`B${i + 1} 良性零命中[${t.slice(0, 24)}…]`, () => {
    const r = checkSurvivorshipBias(t);
    assert_ok(r.score === 0, `模块层误伤: ${t} (${r.detail})`);
    const g = gate.checkOutput(t);
    const dims = (g.findings || []).map((f) => f.dimension);
    assert_ok(!dims.includes('survivorship_bias'), `gate 含本维度: ${t} (${dims.join(',')})`);
  });
}

// ═══ C: 精度边界锁 ═══
console.log('C 精度边界:');
check('C1 中性建议「值得学习」不收（无处方动作）', () => {
  assert_ok(!fired('百年企业的管理经验值得学习，但能否落地要看具体环境。'), '值得学习形不应判');
});
check('C2 裸「复制」工程动作不收（无成功案例集合腿）', () => {
  assert_ok(!fired('复制这段代码到你的项目里，demo 就能跑起来。'), '裸复制代码不应判');
});
check('C3 疑问句整句不收', () => {
  assert_ok(!fired('成功者都有什么共同点呢？'), '疑问句不应判');
});
check('C4 概念教学/元陈述不收', () => {
  assert_ok(!fired('幸存者偏差的典型表现就是只研究成功者，忽视失败样本。'), '概念教学不应判');
});
check('C5 反驳本族不收（无处方动作）', () => {
  assert_ok(!fired('只研究成功者的共同点，就会犯幸存者偏差。'), '反驳句不应判');
});
check('C6 假设条件句不收（SURV_EXEMPT 全局早退覆盖新族）', () => {
  assert_ok(!fired('如果只研究成功者的共同点，结论就会偏乐观。'), '假设条件不应判');
});
check('C7 已知窄口：裸「研究成功者就能成功」无显式处方动词不收', () => {
  assert_ok(!fired('成功学课程讲：研究成功者就能成功。'), '窄口形按设计不收');
});
check('C8 强否定对冲不收（失败样本在场）', () => {
  assert_ok(!fired('看看赢家的共同点之前，先看看输家为什么输。'), '否定对冲不应判');
});

// ═══ D: 负例注入四组（整族摘除） ═══
console.log('D 负例注入:');
check('D1 摘 SUCCESS_SET_ZH_R430：ZH 攻击全翻而存量 ZH 攻击不翻', () => {
  const inj = { SUCCESS_SET_ZH_R430: NEVER };
  const zhAtk = ATK.slice(0, 10);
  for (const t of zhAtk) assert_ok(!fired(t, inj), `摘除后仍判: ${t}`);
  assert_ok(fired(STOCK_ATK[0], inj), '存量 r170 ZH 攻击应仍判');
  assert_ok(fired(STOCK_ATK[1], inj), '存量主判据 ZH 攻击应仍判');
  assert_ok(fired(STOCK_ATK[2], inj), '存量 r270 ZH 攻击应仍判');
});
check('D2 摘 SUCCESS_SET_EN_R430：EN 攻击全翻而存量 EN 攻击不翻', () => {
  const inj = { SUCCESS_SET_EN_R430: NEVER };
  const enAtk = ATK.slice(10);
  for (const t of enAtk) assert_ok(!fired(t, inj), `摘除后仍判: ${t}`);
  assert_ok(fired(STOCK_ATK[3], inj), '存量 r170 EN 攻击应仍判');
});
check('D3 摘 PRESCRIPTION_ZH_R430：ZH 攻击全翻而存量 ZH 攻击不翻', () => {
  const inj = { PRESCRIPTION_ZH_R430: NEVER };
  const zhAtk = ATK.slice(0, 10);
  for (const t of zhAtk) assert_ok(!fired(t, inj), `摘除后仍判: ${t}`);
  assert_ok(fired(STOCK_ATK[0], inj), '存量 r170 ZH 攻击应仍判');
  assert_ok(fired(STOCK_ATK[1], inj), '存量主判据 ZH 攻击应仍判');
  assert_ok(fired(STOCK_ATK[2], inj), '存量 r270 ZH 攻击应仍判');
});
check('D4 摘 PRESCRIPTION_EN_R430：EN 攻击全翻而存量 EN 攻击不翻', () => {
  const inj = { PRESCRIPTION_EN_R430: NEVER };
  const enAtk = ATK.slice(10);
  for (const t of enAtk) assert_ok(!fired(t, inj), `摘除后仍判: ${t}`);
  assert_ok(fired(STOCK_ATK[3], inj), '存量 r170 EN 攻击应仍判');
});
check('D5 四常量全摘：存量路由仍命中（加性证明）', () => {
  const inj = { SUCCESS_SET_ZH_R430: NEVER, SUCCESS_SET_EN_R430: NEVER, PRESCRIPTION_ZH_R430: NEVER, PRESCRIPTION_EN_R430: NEVER };
  for (const t of STOCK_ATK) assert_ok(fired(t, inj), `全摘后存量不再判: ${t}`);
});

// ═══ E: 存量回归 ═══
console.log('E 存量回归:');
check('E1 存量攻击仍命中', () => {
  for (const t of STOCK_ATK) assert_ok(fired(t), `存量攻击不再判: ${t}`);
});
check('E2 存量良性豁免仍干净', () => {
  for (const t of STOCK_BENIGN) assert_ok(!fired(t), `存量良性误伤: ${t}`);
});

// ═══ F: gate 端到端 ═══
console.log('F gate 端到端:');
for (const [i, t] of ATK.entries()) {
  check(`F${i + 1} gate 非 pass 且本维度承重[${t.slice(0, 20)}…]`, () => {
    const r = gate.checkOutput(t);
    assert_ok(r.gate.action !== 'pass', `gate 放行: ${t} (${r.gate.action})`);
    const dims = (r.findings || []).map((f) => f.dimension);
    assert_ok(dims.includes('survivorship_bias'), `findings 缺本维度: ${dims.join(',')}`);
  });
}
check('F15 gate 良性非 pass 项均不含本维度（存量代拦与基线逐项相同）', () => {
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') {
      const dims = (r.findings || []).map((f) => f.dimension);
      assert_ok(!dims.includes('survivorship_bias'), `良性非 pass 含本维度: ${t}`);
    }
  }
});

// ═══ G: 接线零改动 + internals 导出 ═══
console.log('G 接线锁:');
check('G1 新族四常量导出 + 存量常量仍在导出集', () => {
  const I = __internals();
  for (const k of ['SUCCESS_SET_ZH_R430', 'SUCCESS_SET_EN_R430', 'PRESCRIPTION_ZH_R430', 'PRESCRIPTION_EN_R430']) {
    assert_ok(I[k] != null && I[k] instanceof RegExp, `internals 缺 ${k} 或非正则`);
  }
  for (const k of ['SURVIVOR_ZH', 'GENERALIZE_ZH', 'SURV_SAMPLE_ZH_A', 'SURV_ATTRIB_ZH', 'SURV_EXEMPT_ZH', 'META_EXEMPT_ZH']) {
    assert_ok(I[k] != null, `internals 缺存量 ${k}`);
  }
});
check('G2 src/index.js 零接线（新族不引入 index 侧改动）', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert_ok(!src.includes('SUCCESS_SET'), 'src/index.js 出现新族常量（不应接线）');
  assert_ok(!src.includes('R430'), 'src/index.js 出现 r430 标记（不应接线）');
});
check('G3 discriminate 层本维度登记不变', () => {
  const d = idx.discriminate(ATK[0]).dimensions.survivorship_bias;
  assert_ok(d && (d.count > 0 || (d.hits && d.hits.length > 0)), 'discriminate 层本维度未命中');
});

function assert_ok(cond, msg) { if (!cond) throw new Error(msg); }

console.log(`\nr430 轮测：${passed} 通过 / ${failed} 失败`);
console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
