'use strict';
// 第48轮 负例守卫：pseudo_causal 中文时间先后族
// 9 条判据逐条注入样本 → 命中；再逐条删掉该判据（monkey-patch 常量副本）→ 必须变红。
// 用法: node test/pseudo-causal-zh-timeorder-round48-guard.test.js
const assert = require('assert');
const idx = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js');

// 每条判据的代表样本（只依赖该判据，不含其他判据的强特征）
const CASES = [
  { name: '① seq_attrib 顺序×归因', text: '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。' },
  { name: '② blame_attrib 归责断言', text: '反正按他的说法，这口锅就是配置的。' },
  { name: '③ trigger 一…就', text: '他一来到公司，团队就开始动荡。' },
  { name: '④ coincidence 都发生在', text: '这几次事故都发生在你值班那几周，你说巧不巧。' },
  { name: '⑤ adjacent_shift 后就突变', text: '改了标题风格之后，转化率就一路走高，说明标题起效了。' },
  { name: '⑥ corr_cochange 相关共变', text: '业绩越差，团队越松散，显然是风气坏了。' },
  { name: '⑦ single_factor 中间只差', text: '前年亏今年赚，中间只差了一次团建。' },
  { name: '⑧ superlative_cause 最X+归因', text: '周一的投诉最多，可见周一客服状态最差。' },
  { name: '⑨ seq_metric_shift 顺序+指标', text: '上了新考勤机以来，忘打卡的现象减少了。' }
];

// 独立实现一份判据表副本，用于「删条」模拟（与引擎常量同源同形）
const PC_SEQ_ZH = /(?:自从|之后|以来|从此|从那以后|此后|后来|结束后|播出后|发布后|一结束|后[，,]|\d{4}|去年|今天|昨天|前天)/;
const PC_ATTRIB_ZH = /(?:所以[^。]{0,16}(?:原因|的锅|造成的|导致|所致|问题就出在|都是|就是因为)|显然|可见|说明|看来|证明|这才是[^。]{0,8}的?原因|直接决定)/;
const PATS = {
  0: new RegExp(PC_SEQ_ZH.source + '[^。]{0,44}?' + PC_ATTRIB_ZH.source),
  1: /[^。]{0,10}(?:的锅|就是配置|就是前任|就是[^。]{0,4}的?问题|根本不会管理|不会管理)[，,。]?[^。]{0,12}(?:后|来)?/,
  2: /一[来到接][^。]{0,10}就/,
  3: /(?:两|三|几|多)次[^。]{0,12}都(?:发生在|出现在)/,
  4: new RegExp('[^。]{0,14}(?:后|来)[^。，,]{0,18}就[^。]{0,6}(?:一路|立刻|马上|顿时)'),
  5: /(?:总是|越[^。]{0,8}越)/,
  6: /中间只差|唯一的变化|只多了|只改了/,
  7: /最[高低多少][^。]{0,14}(?:所以|可见|显然|说明)/,
  8: new RegExp(PC_SEQ_ZH.source + '[^。]{0,14}(?:下降|上升|降低|减少|变少|下滑|提高)')
};

let guardCount = 0, fallbackCount = 0, crashCount = 0;
const report = [];

CASES.forEach((c, i) => {
  // 1) 注入：该样本必须被本族命中
  const before = idx.checkCausalOverclaimZh(c.text);
  const injected = before.count > 0 && before.score > 0;

  // 2) 删条：把第 i 条判据从判定中移除后，该样本必须不再命中（否则该条判据不是真守卫）
  //    用「其余判据均不匹配该样本」来等价验证：若只有第 i 条命中，删掉即归零。
  const others = [];
  for (const [k, p] of Object.entries(PATS)) {
    if (Number(k) === i) continue;
    if (p.test(c.text)) others.push('#' + k);
  }
  const exclusive = others.length === 0;
  // 3) 兜底/崩溃检查：引擎侧不得抛异常，返回结构必须完整
  let crashed = false, shapeOk = false;
  try {
    const r = idx.checkCausalOverclaimZh(c.text);
    shapeOk = r && typeof r.count === 'number' && Array.isArray(r.hits) && typeof r.score === 'number';
  } catch (e) { crashed = true; }

  if (injected && exclusive && !crashed && shapeOk) { guardCount++; report.push(`  ✅ ${c.name} 真守卫（删条即归零，无兜底）`); }
  else {
    if (injected && !exclusive) { fallbackCount++; report.push(`  ⚠️ ${c.name} 有兜底（其他判据也命中: ${others.join(',')}）`); }
    if (crashed) { crashCount++; report.push(`  💥 ${c.name} 崩溃`); }
    if (!injected) { crashCount++; report.push(`  ❌ ${c.name} 注入未命中`); }
  }
});
report.forEach(r => console.log(r));
console.log(`\nnegative-guard pseudo_causal zh round48: ${guardCount} 真守卫 / ${CASES.length}, 兜底 ${fallbackCount}, 异常 ${crashCount}`);

// 至少 7/9 必须真守卫；崩溃必须为 0
assert.ok(crashCount === 0, '存在注入未命中或崩溃');
assert.ok(guardCount >= 7, `真守卫不足: ${guardCount}/9`);
console.log('负例守卫结论: PASS');
