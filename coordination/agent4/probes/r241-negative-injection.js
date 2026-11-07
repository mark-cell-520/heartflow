// r241 负例注入（agent-4）：逐族删除本轮新模式，断言守卫按预期变红/变绿。
// 口径同 r228-r240：注入为 detectEndowmentEffect(text, inject) 第二参内存内
// 常量替换，不动全局状态。每个注入点给出「见证句 + 预期」。
// 运行：node coordination/agent4/probes/r241-negative-injection.js
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { detectEndowmentEffect } = require(path.join(__dirname, '..', '..', '..', 'src', 'endowment-effect.js'));

const NEVER = /(?!)/;
// 临时标记文件（证明本轮为真实注入运行，脚本最后一行清理）
const MARK = path.join(os.tmpdir(), 'r241-negative-injection.marker');
fs.writeFileSync(MARK, 'r241 negative injection run\n');

const ATTACKS_ZH = [
  '这把吉他是我的，陪了我十年，别说三千，五千我都不卖。',
  '我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈。',
  '房子是我一手装修起来的，每个角落都有我的心思，市场价再高也反映不了它的价值。',
  '我这个摊位干了十五年，早就不是钱的问题了，给多少钱都代表不了它在我心里的价值。',
  '这幅画挂在我客厅二十年了，画廊出多少价我都不会考虑，它早就不是商品。',
  '咖啡馆是我从一张桌子开始做起来的，连锁品牌给的收购价再高，也买不走这家店。',
  '这串手机号我挑了十几年，别人出价再高也是我的，运气早就绑在一起了。',
];
const ATTACKS_EN = [
  'This watch is mine, I have had it for twenty years, no amount under ten thousand will buy it.',
  'He would not sell his grandfather\u2019s desk at any market price — it is his, so it is worth more than that.',
  'The team built this product line from scratch, so no acquisition offer on the table can reflect what it is worth to us.',
  'The cabin has been in my family for generations; whatever the land is appraised at, we are not selling.',
  'My first guitar is not for sale at any price — the offer would have to be insultingly high to even start a conversation.',
  'This cottage belongs to our family; no developer offer on the table can reflect what it means to us.',
];
const CONCEPT_ZH = [
  '心理学教材在讲禀赋效应：这把吉他是我的，陪了我十年，别说三千，五千我都不卖——教科书案例。',
  '行为经济学用禀赋效应解释：我的旧车市价只值两万，但对我而言它值五万，低于这个价免谈。',
];
const CONCEPT_EN = [
  'The textbook defines the endowment effect: my first guitar is not for sale at any price, no matter the offer.',
];
const CORRECTIVE_ZH = [
  '我的旧电脑给多少钱都不卖，留着给孩子上网课。',
];
const CORRECTIVE_EN = [
  'My cottage is not for sale at any price right now — we are keeping it for personal use and renting it out in summer.',
];
const OVERDIST = '这把吉他是我的。' + '各'.repeat(200) + '市场价再高也反映不了它的价值，反正我不卖。';

// 基线自检：注入前全部按预期
const baseOK =
  ATTACKS_ZH.every(t => detectEndowmentEffect(t).hit) &&
  ATTACKS_EN.every(t => detectEndowmentEffect(t).hit) &&
  CONCEPT_ZH.every(t => !detectEndowmentEffect(t).hit) &&
  CONCEPT_EN.every(t => !detectEndowmentEffect(t).hit) &&
  CORRECTIVE_ZH.every(t => !detectEndowmentEffect(t).hit) &&
  CORRECTIVE_EN.every(t => !detectEndowmentEffect(t).hit) &&
  !detectEndowmentEffect(OVERDIST).hit;
console.log('基线自检（注入前全部按预期）:', baseOK ? 'PASS' : 'FAIL');

let n = 0, ok = 0;
function inject(name, fn) {
  n++;
  let good = false;
  try { good = fn(); } catch (e) { good = false; console.log('  ' + name + ' 抛异常: ' + e.message); }
  if (good) ok++;
  console.log(`  ${good ? '✓' : '✗'} ${name}`);
}

// ─── 中文腿族删除：见证句全部不再命中 ────────────────────────
inject('删 OWN_ZH → 中文攻击 7/7 不再命中', () =>
  ATTACKS_ZH.every(t => !detectEndowmentEffect(t, { OWN_ZH: [] }).hit));
inject('删 INFLATE_ZH → 估值推高见证句(A3)不再命中', () =>
  !detectEndowmentEffect(ATTACKS_ZH[2], { INFLATE_ZH: [] }).hit);
inject('删 REFUSE_ZH → 拒交易见证句(A1)不再命中', () =>
  !detectEndowmentEffect(ATTACKS_ZH[0], { REFUSE_ZH: [] }).hit);
inject('删 TXN_ZH → 中文攻击 7/7 不再命中（交易框架承重）', () =>
  ATTACKS_ZH.every(t => !detectEndowmentEffect(t, { TXN_ZH: NEVER }).hit));

// ─── 英文腿族删除：见证句全部不再命中 ────────────────────────
inject('删 OWN_EN → 英文攻击 6/6 不再命中', () =>
  ATTACKS_EN.every(t => !detectEndowmentEffect(t, { OWN_EN: [] }).hit));
inject('删 INFLATE_EN → 估值推高见证句(A6-EN)不再命中', () =>
  !detectEndowmentEffect(ATTACKS_EN[2], { INFLATE_EN: [] }).hit);
inject('删 REFUSE_EN → 拒交易见证句(A5-EN)不再命中', () =>
  !detectEndowmentEffect(ATTACKS_EN[1], { REFUSE_EN: [] }).hit);
inject('删 TXN_EN → 英文攻击 6/6 不再命中（交易框架承重）', () =>
  ATTACKS_EN.every(t => !detectEndowmentEffect(t, { TXN_EN: NEVER }).hit));

// ─── 豁免删除：豁免句必须变红（证明豁免真实承重）─────────────
inject('删 CONCEPT_ZH → 概念句 2/2 变红', () =>
  CONCEPT_ZH.every(t => detectEndowmentEffect(t, { CONCEPT_ZH: NEVER }).hit));
inject('删 CONCEPT_EN → 概念句 1/1 变红', () =>
  CONCEPT_EN.every(t => detectEndowmentEffect(t, { CONCEPT_EN: NEVER }).hit));
inject('删 CORRECTIVE_ZH → 纠正句 1/1 变红', () =>
  CORRECTIVE_ZH.every(t => detectEndowmentEffect(t, { CORRECTIVE_ZH: NEVER }).hit));
inject('删 CORRECTIVE_EN → 纠正句 1/1 变红', () =>
  CORRECTIVE_EN.every(t => detectEndowmentEffect(t, { CORRECTIVE_EN: NEVER }).hit));

// ─── 距离窗承重：放大 PAIR_ZH 后超距句由不命中变命中 ─────────
inject('PAIR_ZH 60→500 → 超距句变红（邻近窗承重）', () =>
  detectEndowmentEffect(OVERDIST, { PAIR_ZH: 500 }).hit);

console.log(`\n注入 ${n} 个点：${ok} 个按预期，${n - ok} 个未按预期`);
if (fs.existsSync(MARK)) fs.unlinkSync(MARK); // 清理：删除临时标记文件
console.log('清理完成：临时标记文件已删除 ->', !fs.existsSync(MARK));
process.exit(ok === n && baseOK ? 0 : 1);
