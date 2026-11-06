/**
 * test/round-223-moral-covariate-control-exemption.test.js
 * — r223 moral_foundations「统计控制动词 × 通用协变量」豁免 + 压迫守卫（v6.8.151）
 *
 * 背景（交接簿 data/upgrade-state.json r222 notes 候选①）：r221 给
 * checkMoralFoundations 补了「控制动词 + ≤8 字 + 统计对象」紧形状之后，
 * **通用协变量名词**（年龄/收入/背景/性别/学历/地区/健康…）仍整族漏网——
 * r221 刻意没收它们，因为它们是高频日常词，单凭「控制 + 年龄」就豁免会把
 * 「控制人口年龄结构」「控制人民的收入」这类真道德/政治信号一起洗掉。
 * r223 扩样 30 条复测：**15 条仍产一条 moral_foundations liberty finding**
 * （severity 20，非 action-forcing，但与 reasoning_coherence / pseudo_causal
 * 叠加时就是把良性方法学句推上 verify 的那一条）。
 *
 * 落地：src/methodology-covariate.js 新增 hasCovariateMethodology 共表
 *   · 支①「统计控制动词 × ≤8 字 × 通用协变量 × 统计结论框」三腿链——
 *     腿②是统计语义的实质判据：「控制人口年龄结构，强行规定谁可以生育」
 *     （压迫语义）与「控制人口年龄结构之后，两国的医疗支出差异更能反映
 *     制度差别」（统计语义）前半句完全相同，唯一分界就是统计结论框；
 *   · 支②「协变量枚举 + 统计对象词尾」（「这项研究同时控制了年龄、性别等
 *     第三方因素。」无统计结论框，r221 表 8 字窗也装不下 10 字间距）；
 *   · 反向守卫 hasCoercionContext —— **控制动词语境豁免的总闸**：r221 表与
 *     r223 表都收「控制动词 + 统计对象」，而「控制」在中文里同时是压迫语义
 *     的高频动词，r223 对抗探针实测两条真压迫句穿过 r221 表被误豁免。
 *
 * 守五件事：
 *   一、33 条方法学协变量控制良性 moral_foundations 零误伤（detector 层 +
 *      findings 层 + gate 层，不只守 action）；
 *   二、17 条真道德/政治信号（含通用协变量名词）一条不被洗掉；
 *   三、5 条对抗攻击（统计外观包装的压迫陈述）命中不退化；
 *   四、三处守卫承重：支①链、支②枚举、压迫守卫各置恒假一次，承重对象
 *      必须分别重现/转为误豁免；
 *   五、常量导出完整（负例脚本与后续轮次要能注入）。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');

const idx = require('../src/index.js');
const gateMod = require('../src/gate.js');
const cov = require('../src/methodology-covariate.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

// 末尾统一收口：run-all.js 靠 `N 通过, M 失败` 汇总行计数，
// 缺该行的测试文件会被计入 1 个失败（见 test/run-all.js）。
process.on('exit', () => {
  console.log(`${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});

const mfCount = (text) => idx.checkMoralFoundations(text).count;
const gateAction = (text) => gateMod.gate(text).gate.action;
/** findings 里的 moral_foundations 条目（gate 空 findings 时会塞 {dimension:'none',severity:0} 占位，r221 踩坑②） */
function realFindings(text) {
  return (gateMod.gate(text).findings || []).filter(f => f && f.severity > 0);
}
const hasDim = (text, dim) => realFindings(text).some(f => f.dimension === dim);

// ─── A 节语料：33 条方法学「协变量控制」良性 ────────────────────────────
// 支①（30 条）= 统计控制动词 × 通用协变量 × 统计结论框；协变量覆盖人口学
// （年龄/性别/学历/婚姻/职业/工龄/结构/人数）、经济社会（收入/背景/教育/
// 地区/城乡/成本/价格/利率/通胀）、健康医学（健康/病情/剂量）、测量设计
// （基线/特征/水平/组别/批次/版本/季节/年度/气温/湿度/成绩/经验/时长/频次/
// 规模）。
// 支②（3 条）= 协变量枚举 + 统计对象词尾，无统计结论框。
const BENIGN = [
  // ── 支①：三腿链 ──
  '控制年龄之后，两个群体的死亡率差异大幅缩小，说明差距不是由年龄驱动的',
  '控制家庭背景之后，学校回报率依然显著，说明回报不是由家庭背景造成的',
  '控制收入之后，性别工资差距仍然显著，说明还有其他因素在起作用',
  '在调整了年龄因素之后，教育回报率仍然显著，说明教育与收入之间存在直接关联',
  '控制了年龄、性别等第三方因素后，暴露与疾病的关联仍然显著。',
  '这项研究同时控制了年龄、性别等第三方因素。',
  '控制年龄之后比较各组，运动仍然与更低的事件率相关',
  '控制年龄后运动降低事件率',
  '调整了收入因素之后，教育仍然与更高的就业率相关',
  '控制了基线健康状况之后，处理效应依然稳健',
  '控制性别和学历之后，回归系数基本不变',
  '在控制了地区差异之后，城乡收入差距的解释力下降',
  '调整了季节因素以后，月度销量的波动明显减弱',
  '控制了婚姻状况之后，抑郁得分与失业时长仍相关',
  '纳入职业类型之后，工资差异的估计量仍然一致',
  '匹配了初始水平之后，两组的改善幅度依然可比',
  '剔除了极端值之后，样本均值恢复到合理区间',
  '控制了患者的病情严重程度，两组存活率差异仍然显著',
  '在调整了服药剂量后，疗效指标没有变化',
  '控制了工龄和经验之后，晋升概率的差异仍然存在',
  '校正了时间趋势之后，政策的净效应依然可识别',
  '控制批次和版本差异后，新算法的错误率仍然更低',
  '在控制了气温和湿度之后，用电量与产量的关系不变',
  '调整了通货膨胀因素，实际工资的增长依然为正',
  '控制了入学初始成绩之后，干预组的提升幅度依然更大',
  '分层之后各层效应方向一致，说明效应不是由层间差异造成的',
  '加权之后估计量仍然一致，说明偏差不是由样本结构造成的',
  '控制了年龄结构之后，两代的消费倾向差异缩小',
  '调整了年龄结构差异后，队列间的死亡率比较才公平',
  '在控制人口年龄结构之后，两国的医疗支出差异更能反映制度差别',
  '分阶段回归显示，控制前一阶段成绩后，本阶段效应仍然显著',
  // ── 支②：协变量枚举 + 统计对象词尾 ──
  '该模型控制了年龄、性别、地区等协变量。',
  '回归中控制了婚姻状况与户籍类型等变量。',
  '我们调整了性别和教育年限等因素。',
];
// gate 层本就非 pass 的方法学句（r213 攻击样本）：只对 moral_foundations
// 一层要求零误伤，gate action 由它自己的维度（mediator_confusion）兜住，
// 不能混进 A3 的「全 pass」语料（那不是本轮的验收口径）。
const MIXED = [
  '在这项研究中，研究者严格控制了受试者的用药剂量这一中间变量，据此他们认为原始干预对最终结局并没有任何作用。',
];

// ─── B 节语料：17 条真道德/政治信号（含通用协变量名词，必须仍命中）──────
// 覆盖四类：① 协变量名词 + 强制动作无统计结论框（腿②挡）；② 协变量名词
// 被当作压迫对象（守卫挡）；③ 通用协变量名词走 r221 紧形状表但动作对象
// 是人（总闸挡）；④ 与统计无关的纯压迫句（回归断言）。
const MORAL = [
  '他们控制了人口年龄结构，强行规定谁可以生育',
  '政府控制人民的收入，人民就无法反抗',
  '控制民众的思想是最有效的压迫手段',
  '这个政权控制了这个地区的教育机会，让穷人永远翻不了身',
  '控制媒体的自由就是控制真相',
  '控制资金流向让反对者失去行动能力',
  '控制军队的人控制了一切',
  '控制女性的生育权是对人权的践踏',
  '控制学生的言论自由不是学校该做的事',
  '他们控制了人民的粮食，这就是压迫',
  '控制年龄结构来淘汰老员工，是赤裸裸的歧视',
  '用控制人口的方式实现年龄结构优化，是反人类的',
  '控制家庭的生育数量，侵犯了基本权利',
  '控制个人的收入分配，剥夺了经济自由',
  '控制民众的自由表达，必然导致暴政',
  '政府控制了社会的稳定因素，让所有异议消失',
  '控制了穷人的收入因素，他们就没有办法反抗',
];

// ─── C 节语料：5 条对抗攻击（统计外观包装的压迫陈述，必须仍命中）───────
// 三腿齐备（控制动词 × 协变量 × 统计结论框）但动作对象是人——只有压迫
// 守卫挡得住（腿②单独放行）。
const ADVERSARIAL = [
  '控制收入之后，反抗的声音就显著减弱',
  '控制家庭背景之后，穷人的抱怨显著减少',
  '控制了性别比例之后，反抗事件就减少了',
  '控制民众的年龄结构之后，游行规模显著缩小',
  '控制家庭背景因素，弱势群体的诉求就减少了',
];

// ─── A 节：方法学良性三层零误伤 ────────────────────────────────────────
t('A1 方法学协变量控制良性 moral_foundations 零误伤（detector 层，33 条）', () => {
  const hit = BENIGN.concat(MIXED).filter(x => mfCount(x) > 0);
  assert.deepStrictEqual(hit, [], `moral_foundations 仍命中 ${hit.length} 条：\n  ${hit.join('\n  ')}`);
});

t('A2 良性 gate findings 不含 moral_foundations（findings 层，不只守 action）', () => {
  const bad = BENIGN.concat(MIXED).filter(x => hasDim(x, 'moral_foundations'));
  assert.deepStrictEqual(bad, [], `findings 含 moral_foundations：\n  ${bad.join('\n  ')}`);
});

t('A3 良性 gate 全 pass（action 层，33 条）', () => {
  const bad = BENIGN.filter(x => gateAction(x) !== 'pass');
  assert.deepStrictEqual(bad, [], `gate 非 pass：\n  ${bad.join('\n  ')}`);
});

t('A4 r213 攻击样本（mixed）action 不被本轮改动（verify + mediator_confusion 兜底）', () => {
  // 该句本身是 mediator_confusion 攻击样本（r213 攻击集），本轮只摘掉它
  // 身上那条假 liberty finding，action 必须仍是 verify 且 mediator_confusion 仍在。
  for (const x of MIXED) {
    assert.strictEqual(gateAction(x), 'verify', `action 变了：${x}`);
    assert.ok(hasDim(x, 'mediator_confusion'), `mediator_confusion 兜底丢失：${x}`);
  }
});

// ─── B 节：反向守卫（真道德信号不被洗掉）─────────────────────────────
t('B 真道德/政治信号一条不被方法学表洗掉（17 条）', () => {
  const miss = MORAL.filter(x => mfCount(x) === 0);
  assert.deepStrictEqual(miss, [], `以下真道德信号被误豁免：\n  ${miss.join('\n  ')}`);
});

t('B2 真道德信号 findings 层仍带 moral_foundations（17 条）', () => {
  const miss = MORAL.filter(x => !hasDim(x, 'moral_foundations'));
  assert.deepStrictEqual(miss, [], `findings 缺 moral_foundations：\n  ${miss.join('\n  ')}`);
});

// ─── C 节：对抗攻击不退化 ────────────────────────────────────────────
t('C 对抗攻击（统计外观压迫陈述）命中不退化（5 条）', () => {
  const miss = ADVERSARIAL.filter(x => mfCount(x) === 0);
  assert.deepStrictEqual(miss, [], `以下对抗攻击被误豁免：\n  ${miss.join('\n  ')}`);
});

t('C2 对抗攻击 findings 层仍带 moral_foundations（5 条）', () => {
  const miss = ADVERSARIAL.filter(x => !hasDim(x, 'moral_foundations'));
  assert.deepStrictEqual(miss, [], `findings 缺 moral_foundations：\n  ${miss.join('\n  ')}`);
});

// ─── D 节：r221/r220/r222/r213 存量同族语料不退化 ────────────────────
t('D 存量方法学语料（r213/r219/r220/r221/r222 探针同族句）零误伤', () => {
  const legacy = [
    '控制了年龄、性别等第三方因素后，暴露与疾病的关联仍然显著。',
    '控制收入之后，教育的直接效应仍然显著。',
    '控制年龄之后比较各组，运动仍然与更低的事件率相关',
    '控制年龄后运动降低事件率',
    '在调整了年龄因素之后，教育回报率仍然显著，说明教育与收入之间存在直接关联',
    '控制收入之后，性别工资差距仍然显著，说明还有其他因素在起作用',
    '分阶段回归显示，控制前一阶段成绩后，本阶段效应仍然显著',
    '控制了基线特征之后，干预效果仍然显著，说明效果不是由混杂造成的',
    '调整协变量之后，处理效应仍然显著，说明效应不是由选择偏差造成的',
    '纳入固定效应之后，系数仍然显著，说明结果不是由遗漏变量造成的',
    '倾向得分匹配之后，两组差异仍然存在，说明差异不是由匹配失败造成的',
    '控制混淆变量之后，暴露与结局仍然相关，说明关联不是由混淆造成的',
    '双重差分之后，处理效应仍然显著，说明效应不是由时间趋势造成的',
    '稳健性检验之后，主效应仍然显著，说明结论不是由单一模型造成的',
  ];
  const hit = legacy.filter(x => mfCount(x) > 0);
  assert.deepStrictEqual(hit, [], `存量同族语料被误命中：\n  ${hit.join('\n  ')}`);
});

t('D2 r221 D 节三条真道德信号仍不被洗掉（反向守卫不回退）', () => {
  const legacy = [
    '政府控制了人民的自由，这是暴政',
    '他们控制民族差异，实行压迫统治',
    '这项回归分析表明控制者剥夺了人民的自由',
  ];
  const miss = legacy.filter(x => mfCount(x) === 0);
  assert.deepStrictEqual(miss, [], `r221 反向守卫样本被误豁免：\n  ${miss.join('\n  ')}`);
});

// ─── E 节：变异守卫（复制 src/ 整棵树到临时目录再变异）────────────────
/** 复制 src/ 到临时目录，返回目录路径 */
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r223-' + tag + '-'));
  for (const f of ['VERSION', 'package.json']) {
    try { fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); } catch (e) { /* 缺文件不致命 */ }
  }
  cp.execFileSync(process.execPath,
    ['-e', `const fs=require('fs'),p=require('path');
function w(s,d){fs.mkdirSync(d,{recursive:true});
for(const e of fs.readdirSync(s,{withFileTypes:true})){
const a=p.join(s,e.name),b=p.join(d,e.name);
if(e.isDirectory())w(a,b);else fs.copyFileSync(a,b);}}
w(process.argv[1],process.argv[2]);`,
      path.join(ROOT, 'src'), path.join(tmp, 'src')],
    { stdio: 'ignore' });
  return tmp;
}
/** 在临时副本上跑：统计 BENIGN 里被 moral_foundations 命中的条数 */
function countHitsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(idx.checkMoralFoundations(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8' });
  return parseInt(out.trim(), 10);
}
/** 在临时副本上跑：统计 list 里被 hasCovariateMethodology 判为豁免的条数 */
function countExemptIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const cov=require(${JSON.stringify(path.join(tmp, 'src', 'methodology-covariate.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(cov.hasCovariateMethodology(x)) n++; }
console.log(n);`],
    { encoding: 'utf8' });
  return parseInt(out.trim(), 10);
}
/** 支①三腿链承重的良性子集（含统计结论框，r221 表盖不住的那批） */
const BRANCH1 = [
  '控制年龄之后，两个群体的死亡率差异大幅缩小，说明差距不是由年龄驱动的',
  '控制家庭背景之后，学校回报率依然显著，说明回报不是由家庭背景造成的',
  '控制收入之后，性别工资差距仍然显著，说明还有其他因素在起作用',
  '控制性别和学历之后，回归系数基本不变',
  '控制了婚姻状况之后，抑郁得分与失业时长仍相关',
  '在控制了气温和湿度之后，用电量与产量的关系不变',
  '控制了年龄结构之后，两代的消费倾向差异缩小',
];
/**
 * 支②枚举形承重的良性子集。只收「控制」形两条——第三条
 * 「我们调整了性别和教育年限等因素。」用的是「调整」，而 liberty 通道
 * （/自由|压迫|控制|解放|独立|自主|奴役|专制|暴政|反抗/）根本不收「调整」，
 * 该句从未产生 moral_foundations 命中，放进变异守卫会永远不承重。
 */
const BRANCH2 = [
  '该模型控制了年龄、性别、地区等协变量。',
  '回归中控制了婚姻状况与户籍类型等变量。',
];

t('E1 支①三腿链置恒假后，7 条支①良性必须重新被 moral_foundations 命中', () => {
  const tmp = copySrc('e1');
  try {
    const p = path.join(tmp, 'src', 'methodology-covariate.js');
    let s = fs.readFileSync(p, 'utf8');
    s = s.replace('COV_METHOD_ZH.test(text)', 'false');
    assert.ok(!s.includes('COV_METHOD_ZH.test(text)'), '变异未生效：副本里仍能找到 COV_METHOD_ZH.test(text)');
    fs.writeFileSync(p, s, 'utf8');
    const n = countHitsIn(tmp, BRANCH1);
    assert.strictEqual(n, BRANCH1.length,
      `支①置恒假后只有 ${n}/${BRANCH1.length} 条良性重新被命中（期望全部）—— 支①不是真承重`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

t('E2 支②枚举支置恒假后，2 条枚举良性必须重新被 moral_foundations 命中', () => {
  const tmp = copySrc('e2');
  try {
    const p = path.join(tmp, 'src', 'methodology-covariate.js');
    let s = fs.readFileSync(p, 'utf8');
    s = s.replace('COV_ENUM_ZH.test(text)', 'false');
    assert.ok(!s.includes('COV_ENUM_ZH.test(text)'), '变异未生效：副本里仍能找到 COV_ENUM_ZH.test(text)');
    fs.writeFileSync(p, s, 'utf8');
    const n = countHitsIn(tmp, BRANCH2);
    assert.strictEqual(n, BRANCH2.length,
      `支②置恒假后只有 ${n}/${BRANCH2.length} 条良性重新被命中（期望全部）—— 支②不是真承重`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

t('E3 压迫守卫置恒假后，5 条对抗攻击必须转为被误豁免', () => {
  const tmp = copySrc('e3');
  try {
    const p = path.join(tmp, 'src', 'methodology-covariate.js');
    let s = fs.readFileSync(p, 'utf8');
    // 守卫承重点有两处：hasCoercionContext 与 hasCovariateMethodology 函数头的早退
    s = s.replace('return COERCION_GUARD_ZH.test(text);', 'return false;');
    s = s.replace('if (COERCION_GUARD_ZH.test(text)) return false;', '/* [r223-E3 变异] */');
    assert.ok(!s.includes('COERCION_GUARD_ZH.test(text)'), '变异未生效：副本里仍能找到守卫判据');
    fs.writeFileSync(p, s, 'utf8');
    const n = countExemptIn(tmp, ADVERSARIAL);
    assert.strictEqual(n, ADVERSARIAL.length,
      `守卫置恒假后只有 ${n}/${ADVERSARIAL.length} 条对抗攻击转为被误豁免（期望全部）—— 守卫不是真承重`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

t('E4 还原校验：仓库源码未被本轮变异触碰', () => {
  const cur = fs.readFileSync(path.join(ROOT, 'src', 'methodology-covariate.js'), 'utf8');
  assert.ok(!cur.includes('[r223-E'), '源码残留变异壳');
  assert.ok(cur.includes('if (COV_METHOD_ZH.test(text)) return true;'), '源码支①执行句被改动');
  assert.ok(cur.includes('return COV_ENUM_ZH.test(text);'), '源码支②执行句被改动');
  assert.ok(cur.includes('if (COERCION_GUARD_ZH.test(text)) return false;'), '源码守卫早退句被改动');
  const idxSrc = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(idxSrc.includes('const coercionOverride = hasCovariateMethodology(text)'), 'index.js 压迫总闸接入缺失');
  assert.ok(idxSrc.includes('&& !coercionOverride)'), 'index.js 压迫总闸未参与豁免判定');
});

// ─── F 节：常量导出完整（负例脚本与后续轮次要能注入）─────────────────
t('F 共表常量导出完整（负例脚本与后续轮次要能注入）', () => {
  for (const k of ['hasCovariateMethodology', 'hasCoercionContext', 'COV_ACT_ZH', 'COV_NOUN_ZH',
    'STAT_CONCL_ZH', 'COV_METHOD_ZH', 'COV_ENUM_ZH', 'COERCION_GUARD_ZH']) {
    assert.ok(cov[k] !== undefined, `methodology-covariate.js 缺导出 ${k}`);
  }
  assert.strictEqual(typeof cov.__internals, 'function', '__internals 应为函数');
  const internals = cov.__internals();
  assert.ok(internals.COV_METHOD_ZH instanceof RegExp, '__internals 应导出各常量');
});

console.log('round-223 守卫完成');
