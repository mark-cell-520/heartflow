// r361/r362 修正版守护：r360 正序族 + 英文玄学归因族负例守卫
// 修正 r360 原版三处问题：
//   ① 命中判据量 gate.action → 改为 detector 层 pseudo_causal.dimensions.count
//      （r357 教训：该族判据生效面在 detector 层，gate 层被伴生维度掩盖）
//   ② P2 锚点 `feng ?shui` 与源文件字节不符（源无可选空格）→ 照源字面量
//   ③ ZH 良性样本含两条 r361 已收的误伤（1.8 倍 / 提升三倍）→ 移出本守卫，
//      由 r361 fact-base 守卫覆盖
// 铁律：每个置假点失效后攻击命中必须下降；良性 detector 层零误伤。
// 样本只以形状出现；原文隔离在本文件，不进报告/commit message。
'use strict';
const fs = require('fs');
const path = require('path');
const { gate: gateOrig } = require('../src/gate.js');
const idxOrig = require('../src/index.js');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const SRC_TEXT = fs.readFileSync(SRC, 'utf8');

// ─── 攻击族（正序：归因引导词 × 无机制归因对象 × 获益结果）─────────────
const ATTACK_ZH = [
  '因为今天下雨，所以股票会涨',
  '由于他穿了红衣服，所以项目顺利签单',
  '因为早上转了锦鲤，所以这单谈成了',
  '全靠这个风水摆件，今年业绩翻了倍',
  '多亏那天穿了红袜子，这次中标了',
  '由于星座运势好，所以这轮考核通过了',
  '由于本命年戴了辟邪手链，所以他升职了',
  '因为转发了好运帖，所以客户当天就下单',
  '由于换了招财头像，这个月的订单明显多了',
];
const ATTACK_EN = [
  'Because the weather was lucky, so the deal closed',
  'Since he wore the lucky color, therefore we won the bid',
  'Thanks to the feng shui setup, revenue doubled this year',
  'Because of the horoscope, we won the contract',
  'Since the charm worked, the launch succeeded',
  'Thanks to my lucky shirt, the promotion came through',
  'Because of the talisman, our sales doubled',
];
const BENIGN_ZH = [
  '因为前期做了充分压测，所以项目成功上线',
  '由于用户量持续增长，因此需要扩容数据库',
  '因为修改了缓存策略，接口延迟下降了',
  '由于新渠道上线，本月销售额上涨了',
  '因为台风来了，所以航班取消了',
  '由于下雨，比赛推迟到下周二',
  '因为天气寒冷，羽绒服销量上升',
  '由于节假日促销，订单量同比上涨',
  '由于雨水充足，粮食收成很好',
  '由于团队坚持复盘，连续三个季度业绩翻倍',
  '因为坚持锻炼，他的身体状况好转了很多',
  '由于渠道拓展顺利，本月销量翻了一倍',
];
const BENIGN_EN = [
  'Based on the survey data, therefore we should change the pricing strategy',
  'Because the tests passed, the release went smoothly',
  'Since the market grew, our revenue rose accordingly',
  'Thanks to the hard work of the team, we closed the deal',
  'Because the sales team worked hard, revenue doubled',
  'Because of the storm, the flights were cancelled',
  'The new release improves throughput by 3x',
  'This update reduces latency by 2.5 times',
  'Thanks to good weather, the harvest was excellent',
];

const A = ATTACK_ZH.concat(ATTACK_EN);
const B = BENIGN_ZH.concat(BENIGN_EN);
// 命中判据：detector 层 pseudo_causal 命中（r357 教训：生效面在 detector 层）
const pcHit = (mod, t) => {
  const d = mod.discriminate(t);
  const pc = d.dimensions && d.dimensions.pseudo_causal;
  return pc && pc.count > 0;
};
const hitOrig = t => pcHit(idxOrig, t);
const gateHit = t => gateOrig(t).gate.action !== 'pass';

function record(results, name, ok, detail) {
  results.push(ok ? { name, ok: true } : { name, ok: false, detail: detail || '' });
}

function sabotage(results, name, pairs, runHit) {
  let text = SRC_TEXT;
  for (const [anchor, repl] of pairs) {
    if (!text.includes(anchor)) {
      record(results, name, false, '锚点未找到: ' + anchor.slice(0, 40));
      return;
    }
    text = text.replace(anchor, repl);
  }
  const tmp = SRC + '.r360sab';
  fs.writeFileSync(tmp, text);
  try {
    delete require.cache[require.resolve(tmp)];
    const idx = require(tmp);
    let aHit = 0;
    for (const t of A) if (runHit ? runHit(t) : pcHit(idx, t)) aHit++;
    const dropped = A.length - aHit;
    record(results, name, dropped > 0, 'attack ' + aHit + '/' + A.length + ' benignFP -');
  } catch (e) {
    record(results, name, false, 'err: ' + String(e.message || e));
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}

const results = [];

// ─── base 断言（detector 层）──────────────────────────────────────────
// r362 修完两处缺口后：ZH 9/9、EN 7/7 detector 层应全命中（原 r361 记录 8/9、6/7）。
record(results, 'ZH 攻击族 detector 命中 9/9',
  ATTACK_ZH.filter(t => pcHit(idxOrig, t)).length === 9,
  'hit ' + ATTACK_ZH.filter(t => pcHit(idxOrig, t)).length + '/9');
record(results, 'EN 攻击族 detector 命中 7/7',
  ATTACK_EN.filter(t => pcHit(idxOrig, t)).length === 7,
  'hit ' + ATTACK_EN.filter(t => pcHit(idxOrig, t)).length + '/7');
record(results, 'ZH 良性 detector 零误伤', BENIGN_ZH.every(t => !pcHit(idxOrig, t)),
  'pc: ' + BENIGN_ZH.filter(t => pcHit(idxOrig, t)).length);
record(results, 'EN 良性 detector 零误伤', BENIGN_EN.every(t => !pcHit(idxOrig, t)),
  'pc: ' + BENIGN_EN.filter(t => pcHit(idxOrig, t)).length);
// gate 层恶化哨兵：良性不因本轮改动新增 non-pass
record(results, '良性 gate 层 0 新增 non-pass', B.every(t => !gateHit(t)),
  'gateFP: ' + B.filter(gateHit).length);

// P1：第 13 支中文判据的甲半置假 → 中文正序族应漏判
sabotage(results, 'P1 第13支甲半置假（ATTRIB→空）', [[
  'new RegExp(PC_FWD_ATTRIB_ZH.source',
  'new RegExp(\'ZZZNOMATCH\'.source',
]], null);

// P2：英文正序族判据的连接词半置假 → 英文族应漏判
// 锚点照源文件实际字面量抄（含 \b 的 JS 字符串层，源第 2427 行 feng shui 无空格）
sabotage(results, 'P2 英文正序族置假（连接词→空）', [[
  '/\\b(?:because|since|thanks to|due to|owing to)\\b[^.!?]{0,60}?\\b(?:lucky|luck|fortune|feng shui',
  '/\\b(?:ZZZNOMATCH)\\b[^.!?]{0,60}?\\b(?:lucky|luck|fortune|feng shui',
]], null);

// P3（含 P3b）见下方独立块。
(function () {
  const MIX = '由于换了招财头像加上新渠道拓展，这个月的订单明显多了';
  record(results, 'P3b 混合句护栏在时放行', !hitOrig(MIX), 'pc命中: ' + (hitOrig(MIX) ? 1 : 0));
  let text = SRC_TEXT.replace(
    'if (pat === PC_CAUSAL_ZH_PATS[12] && revMech) continue;',
    '// sabotaged: 机制护栏失效');
  const tmp = SRC + '.r360sab';
  fs.writeFileSync(tmp, text);
  try {
    delete require.cache[require.resolve(tmp)];
    const idx = require(tmp);
    record(results, 'P3b 混合句护栏假时被抓', pcHit(idx, MIX), 'pc命中: ' + (pcHit(idx, MIX) ? 1 : 0));
  } catch (e) {
    record(results, 'P3b 混合句护栏假时被抓', false, 'err: ' + String(e.message || e).slice(0, 60));
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
})();

const pass = results.filter(r => r.ok).length;
const fail = results.filter(r => !r.ok);
console.log('r360 正序族负例守卫: NEG_OK ' + pass + '/' + results.length);
// run-all 聚合只认「N 通过, M 失败」汇总行（r368 补：此前仅 NEG_OK 分数式被计失败）
console.log('结果: ' + pass + ' 通过, ' + fail.length + ' 失败');
if (fail.length) {
  console.log('FAIL: ' + JSON.stringify(fail));
  process.exit(1);
}
