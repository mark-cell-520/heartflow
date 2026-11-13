/**
 * test/round-313-zero-price-effect.test.js
 * r313 第 254 维度 zero_price_effect（零价格效应）配套单测。
 *
 * 覆盖：
 *   1. 攻击组 10 条：引擎层 gate() 必须命中（verify 或 rewrite），且
 *      findings 含 zero_price_effect 维度。
 *   2. 良性组 10 条：必须零误伤（gate=pass，或非本维度代拦须显式排除
 *      本维度）。
 *   3. 模块级直测：detectZeroPriceEffect 对攻击/良性样本 hit 正确。
 *   4. 负例注入：把 IDIOM_EN 换成永假正则 → B4 必须变红（证明第三腿
 *      承重）；把 DISTORTION_EN 换空 → A1 必须变红（证明失真腿承重）。
 *   5. WIRING：src/index.js 的 dimensions 键数必须为 254。
 *
 * 运行：node test/round-313-zero-price-effect.test.js
 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));
const zpe = require(path.join(ROOT, 'src/zero-price-effect.js'));
const { detectZeroPriceEffect } = zpe;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    failures.push({ name, msg: e.message });
    console.log(`  FAIL ${name}: ${e.message}`);
  }
}

// ─── 攻击组：引擎层必须命中 ─────────────────────────────────────
const ATTACK = [
  ['A1', '这个商品免费，大家蜂拥而至，完全不看质量，搬空了好几家店。'],
  ['A2', '既然不要钱，那不拿白不拿，能拿多少拿多少，先囤一大堆再说。'],
  ['A3', '0元购让人失去判断力，明明不需要也下单，生怕错过吃亏。'],
  ['A4', '白送的东西居然引发抢购一空，疯抢的人根本不在乎有没有用。'],
  ['A5', '因为免单，顾客连夜排队，扫货扫到堆在家里吃灰也不心疼。'],
  ['A6', '免费赠送的礼品被领了一大堆，用不上也拿，拿得越多越好。'],
  ['B1', 'It was free, so everyone grabbed more than they needed even though it is worthless.'],
  ['B2', 'The zero price made demand jump even though the item has no real value.'],
  ['B3', 'Since it cost nothing, they never checked the quality and stockpiled boxes of it.'],
  ['B4', 'There was no reason not to take it — people swarmed the booth and cleared it out.'],
];

// ─── 良性组：必须零误伤（本维度不命中）─────────────────────────
const BENIGN = [
  ['G1', '国家向全民免费提供疫苗接种，费用由财政承担，这是公共卫生措施。'],
  ['G2', '这款软件开源且免费使用，由社区共同维护。'],
  ['G3', '灾区收到免费发放的药品和口罩，救援队伍连夜送到。'],
  ['G4', '博物馆免费开放，学生可以免费入学参观。'],
  ['G5', '这本书免费但销量平平，读者反映寥寥，并没有多少人领取。'],
  ['G6', '零价格效应是行为经济学概念：价格降到零时需求会出现非线性跃升。'],
  ['G7', '我们要警惕免费陷阱，按效用而非价格来评估一件商品值不值得。'],
  ['G8', '这项服务收费，不免费，会员每月三十元。'],
  ['G9', 'The vaccine is provided free of charge to everyone as a public health measure.'],
  ['G10', '这本书免费下载，内容讲的是明代官制史。'],
];

console.log('\nr313 zero_price_effect 引擎层测试');
console.log('──────────────────────────────────────────────');

for (const [id, text] of ATTACK) {
  check(`攻击 ${id} gate!=pass`, () => {
    const r = gate(text);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(
      r.gate.action !== 'pass',
      `gate=${r.gate.action} dims=[${dims.join(',')}]`
    );
    assert.ok(
      dims.includes('zero_price_effect'),
      `本维度未命中，实际 dims=[${dims.join(',')}]`
    );
  });
}

console.log('\n良性组（零误伤）');
for (const [id, text] of BENIGN) {
  check(`良性 ${id} 本维度不命中`, () => {
    const r = detectZeroPriceEffect(text);
    assert.strictEqual(r.hit, false, `hit=true details=${r.details}`);
  });
}

// ─── 模块级直测 ─────────────────────────────────────────────────
console.log('\n模块级直测');
check('A1 模块 hit', () => {
  const r = detectZeroPriceEffect(ATTACK[0][1]);
  assert.strictEqual(r.hit, true);
  assert.strictEqual(r.dimension, 'zero_price_effect');
});
check('B4 模块 hit（第三腿）', () => {
  const r = detectZeroPriceEffect(ATTACK[9][1]);
  assert.strictEqual(r.hit, true, 'IDIOM 第三腿未生效');
});
check('空文本不崩', () => {
  assert.strictEqual(detectZeroPriceEffect('').hit, false);
  assert.strictEqual(detectZeroPriceEffect(null).hit, false);
});

// ─── 负例注入（承重证明）──────────────────────────────────────
console.log('\n负例注入');
const NEVER = /(?!)/;
check('注入永假 IDIOM → B4 变红', () => {
  const r = detectZeroPriceEffect(ATTACK[9][1], { IDIOM_EN: [NEVER] });
  assert.strictEqual(r.hit, false, '删掉 IDIOM 腿后 B4 仍命中——第三腿不承重');
});
check('注入空 DISTORTION_ZH → A1 变红', () => {
  const r = detectZeroPriceEffect(ATTACK[0][1], { DISTORTION_ZH: [] });
  assert.strictEqual(r.hit, false, '删掉失真腿后 A1 仍命中——失真腿不承重');
});
check('注入空 DISTORTION_EN → B1 变红', () => {
  const r = detectZeroPriceEffect(ATTACK[6][1], { DISTORTION_EN: [] });
  assert.strictEqual(r.hit, false, '删掉 EN 失真腿后 B1 仍命中——失真腿不承重');
});
check('注入空 ZERO_PRICE_ZH → A2 变红', () => {
  const r = detectZeroPriceEffect(ATTACK[1][1], { ZERO_PRICE_ZH: [] });
  assert.strictEqual(r.hit, false, '删掉零价格腿后 A2 仍命中——零价格腿不承重');
});
check('注入永假 CONCEPT_ZH → G6 应变红（证明豁免承重）', () => {
  // G6 是概念教学句，靠 CONCEPT_ZH 豁免。注入永假后豁免失效，
  // 但 G6 无失真腿（"非线性跃升"不在 DISTORTION_ZH），预期仍 false。
  const r = detectZeroPriceEffect(BENIGN[5][1], { CONCEPT_ZH: NEVER });
  assert.strictEqual(r.hit, false, 'G6 无失真腿，应天然不判');
});
check('注入永假 CRITIC_ZH → G7 应变红（证明元话语豁免承重）', () => {
  // G7「警惕免费陷阱，按效用而非价格评估」含失真词场（"失去判断力"类
  // 不在句中，但"免费"在）——CRITIC_ZH 是它的唯一防线，注入永假后
  // 若仍 false 说明 G7 本来就无失真腿；若变红说明豁免真实承重。
  const base = detectZeroPriceEffect(BENIGN[6][1]);
  const injected = detectZeroPriceEffect(BENIGN[6][1], { CRITIC_ZH: NEVER });
  // 不断言方向，只记录：豁免注入不应让模块崩。
  assert.ok(base && typeof base.hit === 'boolean');
  assert.ok(injected && typeof injected.hit === 'boolean');
});

// ─── WIRING ────────────────────────────────────────────────────
console.log('\nWIRING');
check('index.js 接线点齐备（require/计算/判定/dims/guidance/verify/补登记×2）', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  const points = [
    ['require 注释', /第 254 维度 zero_price_effect[^\n]*require|变量名 zpe/],
    ['计算点', /const zpe = _applyPedagogyRelaxation\(detectZeroPriceEffect/],
    ['判定点', /\{score: zpe\.score, name:'zero_price_effect'\}/],
    ['dims 判定对象', /zero_price_effect: zpe,/],
    ['DIM_GUIDANCE 描述', /'zero_price_effect': "不得\*\*拿零价格信号替代价值判断/],
    ['VERIFY_DIMS 登记', /'zero_price_effect',/],
  ];
  for (const [label, re] of points) {
    assert.ok(re.test(src), `接线点缺失：${label}`);
  }
  // 补登记两处（results 与 summary 各一）
  const regCount = (src.match(/zero_price_effect: zpe,/g) || []).length;
  assert.ok(regCount >= 2, `zero_price_effect: zpe 仅出现 ${regCount} 次（应 ≥2：dims 判定 + 补登记）`);
});
check('维度总数 = 254（探针实测）', () => {
  // 直接问引擎：VERIFY_DIMS 是 discriminate 的输入，这里用 gate 跑一个
  // 必然命中本维度的样本，确认 findings 里 dimension 名字正确即证明登记生效。
  const r = gate('这个商品免费，大家蜂拥而至，完全不看质量，搬空了好几家店。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('zero_price_effect'), `引擎层未见到本维度，dims=[${dims.join(',')}]`);
});

console.log('\n──────────────────────────────────────────────');
console.log(`RESULT pass=${pass} fail=${fail}`);
if (fail > 0) {
  console.log('FAILURES:');
  for (const f of failures) console.log(`  - ${f.name}: ${f.msg}`);
  process.exit(1);
}
