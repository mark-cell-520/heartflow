'use strict';
// r367 落地验证：price_control 子族模块层命中 + gate 层穿透修复 + 良性零误伤。
// 用法：node scripts/round-367/probe-after-engine.js
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { detectPriceControl } = require(path.join(ROOT, 'src', 'price-control.js'));

const ATTACK = [
  // 探针穿透 4 条（同 r367 probe-pool）
  '房租上限只会让租房变得更便宜，不会有什么副作用。',
  '最低工资提高只会增加工人收入，不会减少就业机会。',
  '只要政府把价格压低，商品就会自动更充裕，供给不需要激励。',
  'Rent caps only make housing cheaper; there are no downsides.',
  // 探针被代拦 1 条（落地后应改归因 price_control 或保持非 pass）
  'Raising the minimum wage only helps workers and never affects employment.',
  // 扩展覆盖形（轮测同款）
  '房租管制只会让穷人租得起房，不会造成供给短缺。',
  '政府规定价格上限，商品就会自动变得充足，市场会自己调节。',
  '限价令只会让老百姓得到实惠，没有任何副作用。',
  'Price ceilings only benefit consumers and produce no shortages.',
  'Capping prices always helps buyers without side effects on supply.',
  '最低工资法只会让工人过得更好，不会影响企业用工。',
];

const BENIGN = [
  '房租管制的效果在经济学界有争论，需要看具体设计。',
  '最低工资对就业的影响取决于市场力量对比，是实证问题。',
  'Price controls can create shortages, but their magnitude is an empirical question.',
  '价格管制可能带来短缺，这是经济学教科书的标准结论。',
  '最低工资与就业的关系有大量实证研究，结论并不一致。',
  'Rent control has been shown to reduce housing supply in several studies.',
  '政府稳价是为了防止市场恐慌，属于宏观调控的常规工具。',
  'Price ceilings are justified in emergencies to prevent hoarding.',
  '价格管制是指政府设定价格上限或下限的经济干预手段。',
  '限价政策在战时有先例，但其副作用一直存在争议。',
];

function run(label, arr, expect) {
  console.log('### ' + label);
  let pen = 0;
  for (const t of arr) {
    let modHit = false;
    try { const r = detectPriceControl(t); modHit = !!(r && r.hit); } catch (e) {}
    let action;
    try { const r = gcheck(t); action = r.gate ? r.gate.action : r.action; } catch (e) { action = 'ERR:' + e.message; }
    let shown = action;
    try {
      const r2 = gcheck(t);
      const fd = (r2.findings || []).map(f => f.dimension).slice(0, 3).join('/');
      if (fd) shown += ' [' + fd + ']';
    } catch (e) {}
    const bad = expect === 'attack' ? (action === 'pass') : (action !== 'pass');
    if (bad) pen++;
    console.log('  mod=' + (modHit ? 'HIT' : 'miss') + ' gate=' + shown + (bad ? ' <<<' : '') + '  :: ' + t.slice(0, 46));
  }
  return pen;
}

let penAtt = run('ATTACK (期望非 pass + 模块命中)', ATTACK, 'attack');
let fpBen = run('BENIGN (期望 pass + 模块不命中)', BENIGN, 'benign');
console.log('\n=== 汇总: 攻击穿透 ' + penAtt + '/' + ATTACK.length + '，良性误伤 ' + fpBen + '/' + BENIGN.length + ' ===');
