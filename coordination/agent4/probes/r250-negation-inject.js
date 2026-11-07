/**
 * r250-negation-inject.js — 负例注入-删条干跑（src/significance-effect-size.js）
 * 逐条删掉本轮每一组新模式/豁免/守卫/窗，断言必须按预期变红（断言失败，
 * 而非加载崩溃）。最后一行统一清理：确认默认常量全部复位。
 */
const M = require('/data/home/heartflow/src/significance-effect-size.js');
const detect = M.detectSignificanceEffectSize;
const NEVER = /(?!)/;

const ATTACK_ZH = [
  'p 小于 0.05，所以这个药有效，可以全面推广',
  'p 值只有 0.01，效果当然非常显著，可以直接上',
  'p=0.03，说明新教材的效果更好，可以写进指南',
  'p 值低于 0.05，因此效应很大，可以马上线',
  'p 值只有 0.001，证明这个发现是重大突破',
  'p 值达标，说明新配方确实好很多',
  'p 值小于 0.05，说明新疗法确实更强，应该全面推广',
  '差异显著，说明新方法明显更好',
  '实验组显著优于对照组，这证明改进很大',
  '统计上显著，所以这个效应值得重视',
  '检验结果显著，结论就是新政策起作用了',
  '两组差异在统计上成立，说明新工艺确实强得多',
  '统计显示差异显著，因此这个干预措施效果很好，值得大规模推广',
  '显著性检验通过了，说明这个发现意义重大',
  '两组比较差异显著，可见新工艺确实更强',
  '检验结果达到统计意义，说明这个药明显有效',
];
const ATTACK_EN = [
  'p < 0.05, so the drug works and should be rolled out to everyone',
  'The difference is statistically significant, so the new method is clearly better',
  'The result is significant, which proves the effect is large and important',
  'The p-value is under 0.05, so the improvement is obviously substantial',
  'Significant at the 5% level, so the new feature clearly wins',
  'The significance test passed, so the new policy clearly works',
  'p = 0.02, therefore the effect is large and worth rolling out',
  'The difference was significant, so the new design is much better',
  'The p-value was below 0.05, which means the effect is a major finding',
  'Results were statistically significant, so the treatment definitely works',
  'The test came back significant, so the improvement is big enough to ship',
  'p<0.05, so the new feature is clearly better and should be rolled out',
];
// 只由单族裁定构成的攻击（用于隔离单族承重）
const ONLY_IMPORTANCE_ZH = ['统计上显著，所以这个效应值得重视', '显著性检验通过了，说明这个发现意义重大', 'p 值只有 0.001，证明这个发现是重大突破'];
const ONLY_SUPERIOR_ZH = ['差异显著，说明新方法明显更好'];
const ONLY_SCALE_ZH = ['统计显示差异显著，因此这个干预措施效果很好，值得大规模推广'];
const ONLY_MAGNITUDE_ZH = ['实验组显著优于对照组，这证明改进很大'];
const ONLY_SUPERIOR_EN = ['The difference is statistically significant, so the new method is clearly better'];
const ONLY_MAGNITUDE_EN = ['The result is significant, which proves the effect is large and important'];

const EXEMPT_CORRECTIVE = [
  'p 小于 0.05，所以新药有效，不过效应量只有 0.1',
  'The difference was significant, so the new method is clearly better, but the effect size is small',
];
const EXEMPT_CONCEPT = [
  '统计显著不等于重要，但很多人拿它说明新方法明显更好',
  'Statistical significance does not mean importance, so people wrongly conclude the effect is large',
];
const RESTRICTIVE = 'p 值只说明差异可检出，新方法明显更好还要看长期数据';
const OVERDIST = 'p 值小于 0.05，随后研究团队又花了整整一年时间在不同城市的不同医院里反复验证，收集了上万份随访记录并逐条核对，所以最后才得出新方法明显更好的结论。';

let n = 0, red = 0, notRed = 0;
const miss = [];
function expect(name, cond) {
  n++;
  if (cond) red++;
  else { notRed++; miss.push('  ✗ ' + name); }
}
// 删某组常量后，给定攻击列表必须全部不再命中
function allDown(list, inject) {
  return list.every(t => detect(t, inject).hit === false);
}
// 删某组常量后，给定豁免句必须转为命中
function goesRed(t, inject) {
  return detect(t, inject).hit === true;
}

console.log('########## 负例注入：删除腿①显著性陈述族 ##########');
expect('SIG_ZH=[] → 16 条 ZH 攻击全部失配', allDown(ATTACK_ZH, { SIG_ZH: [] }));
expect('SIG_EN=[] → 12 条 EN 攻击全部失配', allDown(ATTACK_EN, { SIG_EN: [] }));

console.log('########## 负例注入：删除腿②实质性裁定族 ##########');
expect('ZH 四族全删 → 16 条 ZH 攻击全部失配', allDown(ATTACK_ZH, { IMPORTANCE_ZH: [], SUPERIOR_ZH: [], SCALE_ZH: [], MAGNITUDE_ZH: [] }));
expect('EN 四族全删 → 12 条 EN 攻击全部失配', allDown(ATTACK_EN, { IMPORTANCE_EN: [], SUPERIOR_EN: [], SCALE_EN: [], MAGNITUDE_EN: [] }));
expect('IMPORTANCE_ZH=[] → 重要性族攻击失配', allDown(ONLY_IMPORTANCE_ZH, { IMPORTANCE_ZH: [] }));
expect('SUPERIOR_ZH=[] → 实际优越族攻击失配', allDown(ONLY_SUPERIOR_ZH, { SUPERIOR_ZH: [] }));
expect('SCALE_ZH=[] → 推广族攻击失配', allDown(ONLY_SCALE_ZH, { SCALE_ZH: [] }));
expect('MAGNITUDE_ZH=[] → 效应规模族攻击失配', allDown(ONLY_MAGNITUDE_ZH, { MAGNITUDE_ZH: [] }));
expect('SUPERIOR_EN=[] → 实际优越族(EN)攻击失配', allDown(ONLY_SUPERIOR_EN, { SUPERIOR_EN: [] }));
expect('MAGNITUDE_EN=[] → 效应规模族(EN)攻击失配', allDown(ONLY_MAGNITUDE_EN, { MAGNITUDE_EN: [] }));

console.log('########## 负例注入：删除推断标记族 ##########');
expect('INFER_ZH=NEVER → 16 条 ZH 攻击全部失配', allDown(ATTACK_ZH, { INFER_ZH: NEVER }));
expect('INFER_EN=NEVER → 12 条 EN 攻击全部失配', allDown(ATTACK_EN, { INFER_EN: NEVER }));

console.log('########## 负例注入：距离窗承重 ##########');
expect('W_ZH=0 → 16 条 ZH 攻击全部失配', allDown(ATTACK_ZH, { W_ZH: 0 }));
expect('W_EN=0 → 12 条 EN 攻击全部失配', allDown(ATTACK_EN, { W_EN: 0 }));
expect('OVERDIST 默认窗不命中', detect(OVERDIST).hit === false);
expect('OVERDIST W_ZH=500 转命中（窗放大承重）', detect(OVERDIST, { W_ZH: 500 }).hit === true);

console.log('########## 负例注入：删除豁免族后豁免句转红 ##########');
expect('CORRECTIVE_ZH=NEVER → 口径意识句转红', goesRed(EXEMPT_CORRECTIVE[0], { CORRECTIVE_ZH: NEVER }));
expect('CORRECTIVE_EN=NEVER → 口径意识句(EN)转红', goesRed(EXEMPT_CORRECTIVE[1], { CORRECTIVE_EN: NEVER }));
expect('CONCEPT_ZH=NEVER → 概念教学句转红', goesRed(EXEMPT_CONCEPT[0], { CONCEPT_ZH: NEVER }));
expect('CONCEPT_EN=NEVER → 概念教学句(EN)转红', goesRed(EXEMPT_CONCEPT[1], { CONCEPT_EN: NEVER }));

console.log('########## 负例注入：删除限定性守卫后「只说明」句转红 ##########');
expect('RESTRICTIVE_BEFORE=NEVER → 限定性句转红', goesRed(RESTRICTIVE, { RESTRICTIVE_BEFORE: NEVER }));

console.log('########## 清理：默认常量全部复位 ##########');
const I = M.__internals();
expect('复位后 16 条 ZH 攻击恢复命中', ATTACK_ZH.every(t => detect(t, null).hit === true));
expect('复位后 12 条 EN 攻击恢复命中', ATTACK_EN.every(t => detect(t, null).hit === true));
expect('复位后两条豁免句恢复不命中', EXEMPT_CORRECTIVE.concat(EXEMPT_CONCEPT).every(t => detect(t, null).hit === false));
expect('复位后限定性句恢复不命中', detect(RESTRICTIVE, null).hit === false);
expect('__internals 导出的常量均为默认（未被注入污染）', Array.isArray(I.SIG_ZH) && I.SIG_ZH.length > 0 && I.W_ZH === 40);

console.log(`\n==== 注入 ${n} 个点：${red} 个按预期变红，${notRed} 个未按预期 ====`);
miss.forEach(l => console.log(l));
