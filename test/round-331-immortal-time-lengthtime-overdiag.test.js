'use strict';
/**
 * test/round-331-immortal-time-lengthtime-overdiag.test.js
 * [r331] immortal_time_bias（第 240 维度）路径 (e) 病程长度偏误
 * （length-time bias）+ 路径 (f) 过度诊断（overdiagnosis）子家族——
 * 真升级②（已有维度的全新措辞家族），维度计数 255 不变、src/index.js
 * 零改动（同 r320-r330 形态）。
 *
 * 立项缺口实证（scripts/round-331/r331-probe-lengthtime.js，集成树
 * v6.8.184）：14 条攻击样本 10 条完全穿引擎（gate.action=pass、
 * findings 无归因），其余 4 条被既有维度代拦（rewrite 1 / verify 3）；
 * src/immortal-time-bias.js 模块头自 r270 起在边界注释里与
 * lead_time_bias 并列记载「length-time / overdiagnosis src/ 下无独立
 * 维度」——r328 已闭环 lead-time（路径 d），本轮把剩余两族闭环为
 * 路径 (e)(f)。
 *
 * 补丁（src/immortal-time-bias.js）：
 *   新增常量 LEN_COMP_ZH/EN（腿② 病例构成）、SCREEN_BENEFIT_ZH/EN
 *   （腿③ 筛查获益结论·窄口）、OVERDIAG_ZH/EN（腿② 过度诊断）、
 *   GAIN_CLAIM_ZH/EN（腿③ 收益计入断言）、EXEMPT_LEN_ZH/EN（豁免：
 *   偏误点名 / 谨慎解读否定 / 收益高估夸大 / 死亡率终点——与
 *   EXEMPT_LEAD 分离，r328 轮测断言 EXEMPT_LEAD 恰三元素不动其结构）
 *   + 路径 (e)(f) OR 分支（复用路径 d 腿①筛查域与 WIN_LEAD 跨腿窗，
 *   在锚腿门槛之前评判）；find 逻辑既有路径与既有常量零改动。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料
 *   全量）/ D 存量回归 / E 常量级注入-删条承重（六腿 + 窗 + 豁免逐项
 *   + 元素隔离）/ F 边界锁 / G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 新攻击集（14 条：路径 e ZH 6 + 路径 f ZH 4 + 路径 e EN 2 + 路径 f EN 2）──
const ATTACK_E_ZH = [
  '筛查发现的肿瘤大多是生长缓慢的类型，所以筛出来的人预后天然更好，这说明筛查确实有效。',
  '早筛组患者的五年生存率明显更高，因为能被早期筛出来的癌症本身就是进展慢的惰性肿瘤。',
  '普筛检出的病例以温和型为主，这类病灶发展缓慢，因此筛查组的生存数据更好看。',
  '筛查能优先找到那些不怎么进展的病灶，所以筛查组的生存率显著高于没筛查的人。',
  '乳腺筛查查出的肿瘤往往是懒癌，所以坚持做筛查的人活得更久。',
  '基因检测更容易发现生长缓慢的肿瘤，所以做检测的人群生存结局明显改善。',
];
const ATTACK_F_ZH = [
  '体检筛查出来的结节多数终生不会恶变，可见筛查改善了患者的生存结局。',
  '早筛查出了大量本来一辈子都不会发病的病变，这些病例证明筛查挽救了无数生命。',
  '体检把很多终生不会有症状的微小病灶也找了出来，它们都被计入了筛查的救治成果。',
  '筛查发现的早期病例里有很多本来不需要治疗，把它们的"治愈"算进去，筛查的收益极其可观。',
  '基因检测查出的高危结节绝大多数永远不会癌变，这些检出案例说明检测拯救了生命。',
];
const ATTACK_E_EN = [
  'Cancers found by screening are mostly slow-growing indolent tumors, so screened patients naturally survive longer — screening works.',
  'The screened group has much better survival because screening preferentially detects slow-progressing disease.',
];
const ATTACK_F_EN = [
  'Most of the lesions screening picks up would never have caused any symptoms, and counting them as cured proves screening saves lives.',
  'A large share of screen-detected cancers never would have progressed, so the improvement in screened patients proves the program works.',
];

// ─── A. gate 层归因 ────────────────────────────────────────────────
check('A gate 层归因：路径 e/f 攻击 14/14 → immortal_time_bias findings 且 action≠pass', () => {
  for (const s of [...ATTACK_E_ZH, ...ATTACK_F_ZH, ...ATTACK_E_EN, ...ATTACK_F_EN]) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调（命中 + detail 分路径标注）───────────────────────
check('B 模块直调：路径 e ZH 6/6 命中且 detail 带病程长度标', () => {
  for (const s of ATTACK_E_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('病程长度偏误'), 'detail 缺病程长度标: ' + r.detail);
  }
});
check('B 模块直调：路径 f ZH 5/5 命中且 detail 带过度诊断标', () => {
  for (const s of ATTACK_F_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('过度诊断'), 'detail 缺过度诊断标: ' + r.detail);
  }
});
check('B 模块直调：路径 e EN 2/2 命中且 detail 带 length-time 标', () => {
  for (const s of ATTACK_E_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('length-time-bias'), 'detail 缺 length-time 标: ' + r.detail);
  }
});
check('B 模块直调：路径 f EN 2/2 命中且 detail 带 overdiagnosis 标', () => {
  for (const s of ATTACK_F_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('overdiagnosis'), 'detail 缺 overdiagnosis 标: ' + r.detail);
  }
});

// ─── C. 良性零误伤 ────────────────────────────────────────────────
const BENIGN = [
  '病程长度偏误（length-time bias）指筛查优先检出进展慢的病灶，会让筛查组预后看起来更好，需要以死亡率终点重新评估。',
  '筛查发现的甲状腺癌很多是过度诊断，这个病例组合问题让筛查收益被大大夸大。',
  '筛查检出的惰性肿瘤占比很高，所以筛查组的生存率优势并不代表筛查延长了寿命。',
  '把一辈子都不会发病的病变也算作早期发现，筛查的收益就会被高估。',
  '对于生长缓慢的前列腺癌，主动监测往往比手术更合适。',
  '早发现早治疗，建议大家每年做一次体检。',
  '这项筛查试验以总死亡率为主要终点，避免了过度诊断带来的收益高估。',
  'Length-time bias means screening preferentially detects slow-progressing disease, so better survival in screened groups does not prove screening works.',
  'Overdiagnosis inflates the apparent benefit of screening because lesions that never would have caused symptoms are counted as cases.',
  'For slow-growing prostate cancer, active surveillance is often more appropriate than surgery.',
];
check('C 良性零误伤：手工良性 10/10 不判', () => {
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误判: ' + s);
});
check('C 良性零误伤：官方四基准语料全量模块级零命中', () => {
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fp = 0; const hits = [];
  for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
      n++;
      if (checkImmortalTimeBias(s).hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数不足: ' + n);
  assert.strictEqual(fp, 0, '误伤 ' + fp + ' 条: ' + hits.join(' | '));
});

// ─── D. 存量回归（路径 a-d 不回归 + r328 断言结构不变）─────────────
check('D 存量回归：路径 (d) lead-time 攻击仍命中且 EXEMPT_LEAD 仍三元素', () => {
  const r = checkImmortalTimeBias('肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命。');
  assert.strictEqual(r.hit, true);
  assert.ok(r.detail.includes('领先时间偏误'), '路径 d 回归: ' + r.detail);
  const I = __internals();
  assert.strictEqual(I.EXEMPT_LEAD_ZH.length, 3, 'EXEMPT_LEAD_ZH 元素数被改');
  assert.strictEqual(I.EXEMPT_LEAD_EN.length, 3, 'EXEMPT_LEAD_EN 元素数被改');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});
check('D 存量回归：路径 (a) 起点差异攻击仍命中', () => {
  const r = checkImmortalTimeBias('治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。');
  assert.strictEqual(r.hit, true, '路径 (a) 回归');
});

// ─── E. 常量级注入-删条承重 ────────────────────────────────────────
// 路径 e 腿②（病例构成）
check('E 注入 LEN_COMP_ZH=[] → 路径 e ZH 6/6 由判翻转不判', () => {
  for (const s of ATTACK_E_ZH) assert.strictEqual(hit(s, { LEN_COMP_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 LEN_COMP_EN=[] → 路径 e EN 2/2 由判翻转不判', () => {
  for (const s of ATTACK_E_EN) assert.strictEqual(hit(s, { LEN_COMP_EN: [] }), false, '删条后仍命中: ' + s);
});
// 路径 e 腿③（筛查获益结论）
check('E 注入 SCREEN_BENEFIT_ZH=[] → 路径 e ZH 6/6 由判翻转不判', () => {
  for (const s of ATTACK_E_ZH) assert.strictEqual(hit(s, { SCREEN_BENEFIT_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 SCREEN_BENEFIT_EN=[] → 路径 e EN 2/2 由判翻转不判', () => {
  for (const s of ATTACK_E_EN) assert.strictEqual(hit(s, { SCREEN_BENEFIT_EN: [] }), false, '删条后仍命中: ' + s);
});
// 路径 f 腿②（过度诊断）
check('E 注入 OVERDIAG_ZH=[] → 路径 f ZH 5/5 由判翻转不判', () => {
  for (const s of ATTACK_F_ZH) assert.strictEqual(hit(s, { OVERDIAG_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 OVERDIAG_EN=[] → 路径 f EN 2/2 由判翻转不判', () => {
  for (const s of ATTACK_F_EN) assert.strictEqual(hit(s, { OVERDIAG_EN: [] }), false, '删条后仍命中: ' + s);
});
// 路径 f 腿③（收益计入断言）
check('E 注入 GAIN_CLAIM_ZH=[] → 路径 f ZH 5/5 由判翻转不判', () => {
  for (const s of ATTACK_F_ZH) assert.strictEqual(hit(s, { GAIN_CLAIM_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 GAIN_CLAIM_EN=[] → 路径 f EN 2/2 由判翻转不判', () => {
  for (const s of ATTACK_F_EN) assert.strictEqual(hit(s, { GAIN_CLAIM_EN: [] }), false, '删条后仍命中: ' + s);
});
// 跨腿邻近窗（复用 WIN_LEAD，注入清零）
check('E 注入 WIN_LEAD_ZH=0 → 路径 e/f 中文攻击由判翻转不判', () => {
  for (const s of [...ATTACK_E_ZH, ...ATTACK_F_ZH]) assert.strictEqual(hit(s, { WIN_LEAD_ZH: 0 }), false, '清零窗后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → 路径 e/f 英文攻击由判翻转不判', () => {
  for (const s of [...ATTACK_E_EN, ...ATTACK_F_EN]) assert.strictEqual(hit(s, { WIN_LEAD_EN: 0 }), false, '清零窗后仍命中: ' + s);
});
// 豁免表：置空整个豁免数组 → 谨慎/纠正句由不判变判
const EXEMPT_LEN_PROBES = [
  ['EXEMPT_LEN_ZH/点名', 'EXEMPT_LEN_ZH', '筛查优先检出的多是进展慢的病灶，筛查组预后因此更好，这正是病程长度偏误。'],
  ['EXEMPT_LEN_ZH/否定', 'EXEMPT_LEN_ZH', '筛查检出的惰性肿瘤占比很高，所以筛查组的生存率优势并不代表筛查延长了寿命。'],
  ['EXEMPT_LEN_ZH/高估', 'EXEMPT_LEN_ZH', '把一辈子都不会发病的病变也算作早期发现，筛查的收益就会被高估。'],
  ['EXEMPT_LEN_EN/点名', 'EXEMPT_LEN_EN', 'Length-time bias means screening preferentially detects slow-progressing disease, so better survival in screened groups does not prove screening works.'],
  ['EXEMPT_LEN_EN/否定', 'EXEMPT_LEN_EN', 'Screening detects many lesions that would never have caused symptoms, and counting them as cured does not prove that screening saves lives.'],
  ['EXEMPT_LEN_EN/高估', 'EXEMPT_LEN_EN', 'Overdiagnosis inflates the apparent benefit of screening because lesions that never would have caused symptoms are counted as cases.'],
];
for (const [name, key, text] of EXEMPT_LEN_PROBES) {
  check(`E 注入 ${key}=[] → ${name} 由豁免翻转命中`, () => {
    const before = checkImmortalTimeBias(text);
    assert.strictEqual(before.hit, false, '置空前应被豁免，实际 hit=' + before.hit);
    assert.strictEqual(hit(text, { [key]: [] }), true, '置空后应命中');
  });
}
// 元素隔离：只留点名元素 → 否定/高估句不再被豁免（证明三元素各自独立承重）
check('E 注入 EXEMPT_LEN_ZH=[仅点名] → 否定句与高估句翻命中、点名句仍豁免', () => {
  const I = __internals();
  const namingOnly = { EXEMPT_LEN_ZH: [I.EXEMPT_LEN_ZH[0]] };
  assert.strictEqual(hit('筛查检出的惰性肿瘤占比很高，所以筛查组的生存率优势并不代表筛查延长了寿命。', namingOnly), true, '否定句未被隔离');
  assert.strictEqual(hit('把一辈子都不会发病的病变也算作早期发现，筛查的收益就会被高估。', namingOnly), true, '高估句未被隔离');
  assert.strictEqual(hit('筛查优先检出的多是进展慢的病灶，筛查组预后因此更好，这正是病程长度偏误。', namingOnly), false, '点名句应仍豁免');
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hit('筛查发现的肿瘤大多是生长缓慢的类型，这说明筛查确实有效吗？'), false, '疑问形未豁免');
  assert.strictEqual(hit('筛查出的很多病变本来不会发病，这说明筛查挽救了生命吗？'), false, '疑问形未豁免(f)');
});
check('F 边界锁：缺病例构成腿不判（只有筛查域 + 获益结论）', () => {
  assert.strictEqual(hit('这项基因检测很受欢迎，很多人都说它能救命。'), false, '缺腿②仍判');
});
check('F 边界锁：缺获益结论腿不判（只有筛查域 + 病例构成）', () => {
  assert.strictEqual(hit('早筛组患者的癌症大多是进展慢的惰性肿瘤。'), false, '缺腿③仍判(e)');
  assert.strictEqual(hit('早筛查出的病变里有很多本来不会发病的。'), false, '缺腿③仍判(f)');
});
check('F 边界锁：缺筛查域腿不判', () => {
  assert.strictEqual(hit('这款新药对生长缓慢的肿瘤有效，患者活得更久。'), false, '缺腿①仍判');
});
check('F 边界锁：跨腿邻近窗（三腿相隔 >160 字不判）', () => {
  const filler = '这是一段与筛查统计无关的社区活动筹备说明，讲的是场地预订、桌椅数量、音响设备调试和志愿者排班流程，组织者还提醒大家关注天气预报与交通路线，整个筹备过程预计需要两周时间，相关预算与物资清单另见附件表格，会议通知已通过邮件发送给各位成员，如有变动将第一时间在群里同步更新，谢谢大家的配合与支持，期待本次活动顺利举办并取得良好效果。';
  const s = '早筛。' + filler + '这些进展慢的病灶说明筛查确实有效。';
  assert.ok(s.indexOf('进展慢') - s.indexOf('早筛') > 160, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hit(s), false, '跨腿窗失效');
});
check('F 边界锁：中性医疗陈述不判', () => {
  assert.strictEqual(hit('对于生长缓慢的前列腺癌，主动监测往往比手术更合适。'), false);
  assert.strictEqual(hit('体检发现结节后，按医嘱定期复查即可。'), false);
});

// ─── G. 登记纪律 ──────────────────────────────────────────────────
check('G VERSION / package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});
check('G index.js 既有接线在位（require + 计算点 + dimMap 键）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/checkImmortalTimeBias/.test(src), 'index.js 缺 checkImmortalTimeBias 接线');
  assert.ok(/immortal_time_bias/.test(src), 'index.js 缺 immortal_time_bias 维度键');
});
check('G __internals 暴露路径 (e)(f) 六腿 + 豁免（负例注入口）', () => {
  const I = __internals();
  for (const k of ['LEN_COMP_ZH', 'LEN_COMP_EN', 'SCREEN_BENEFIT_ZH', 'SCREEN_BENEFIT_EN', 'OVERDIAG_ZH', 'OVERDIAG_EN', 'GAIN_CLAIM_ZH', 'GAIN_CLAIM_EN', 'EXEMPT_LEN_ZH', 'EXEMPT_LEN_EN']) {
    assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
    assert.ok(Array.isArray(I[k]) && I[k].length >= 2, k + ' 元素不足');
  }
});

console.log(`\nround-331 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
