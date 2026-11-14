'use strict';
/**
 * test/round-327-common-cause-comparative-covariation.test.js
 * [r327] common_cause（第 174 维度）「比较级共变 → 直接因果」新措辞家族
 * （真升级②，维度计数 255 不变，src/index.js 零改动）。
 *
 * 立项探针实测（scripts/round-326/probe4.js + probe5.js，探针时集成树
 * v6.8.182；轮测时 v6.8.183——远端同步轮 r326 已 bump）：
 *   比较级共变族 8 条攻击候选 6/8 穿透 gate=pass（气温/价格/城市三域 +
 *   EN hotter/pricier 两形；另 2 条被 pseudo_causal / dose_response_linearity
 *   代拦）；模块级 13 条候选 9/13 命中。根因：腿①既有比较级共变形
 *   （COVARY_MOVE_ZH 首正则「越[^。，]{1,4}越」/ COVARY_MOVE_EN「the…the…」
 *   44 字窗）都要求**两个比较级子句紧邻无间隔**，且双变量并列词必须在
 *   匹配之前（PAIR-before）；「气温越高，冰淇淋销量和溺水人数就越高」
 *   这类**逗号分隔、间隔较长、连词在匹配内部**的比较级共变整族穿透——
 *   包括共同原因谬误的教科书样本（冰淇淋×溺水）。
 *
 * 补丁（src/common-cause.js，两条常量各 +1 元素，find 逻辑零改动）：
 *   COVARY_REL_ZH += 比较级共变·双变量内含形：
 *     越[^。；！？]{1,10}(?<![参])[和与跟][^。；！？]{1,10}越(?![要应得该须能想])[^。；！？]{0,6}(?:多|高|少|低|差|好|明显|严重|频繁|罕见)
 *   COVARY_REL_EN += the-比较级双形共变·and 内含形：
 *     \bthe\s+(?:\w+er|more|less|…)\b[^.]{1,60}\bthe\s+(?:\w+er|…)\b[^.]{1,40}\b(?:and|&)\b
 *   走 COVARY_REL 免并列通道（双变量由句中 和/与/跟 或 and 内含承载，
 *   同 r283 with-more 先例），仍受全局豁免 + 腿②真因果动词双朝向窗约束。
 *
 * 三点安全设计：
 *   ① 「参与」的「与」是构词语素非连词，环视 (?<![参]) 排除；
 *   ② 第二越子句禁模态/能愿词 越(?![要应得该须能想])，挡「越忙的时候越要多喝水」；
 *   ③ 良性预检（scripts/round-326/benign-precheck2.js）：官方四基准语料
 *      369 条（gate-97 + extended + vertical 150 + mixed，去重后）零新增命中。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工+官方语料全量）/
 *   D 存量回归 / E 常量级注入-删条承重 / F 边界锁（lookbehind/模态/豁免）/
 *   G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkCommonCause, __internals } = require(path.join(ROOT, 'src', 'common-cause.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkCommonCause(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 新攻击集（15 条：ZH 8 + EN 7；基线零命中实证见 scripts/round-326/）──
const ATTACK_ZH = [
  // 教科书样本：冰淇淋×溺水（气温是共同原因，被误读成直接因果）
  '气温越高，冰淇淋销量和溺水人数就越高，所以吃冰淇淋会导致溺水。',
  // 价格×忠诚度（高价错觉域）
  '价格越贵，销量和品牌忠诚度反而越高，所以涨价能带来更高忠诚度。',
  // 城市发展×不平等（发展经济学域）
  '越发达的城市，收入和不平等程度越高，所以发展会加剧不平等。',
  // 房价×创新（房地产域）
  '房价越高的城市，人才流入和发明专利越多，所以高房价带来创新。',
  // 捐款×口碑股价（企业公关域）
  '捐款越多的企业，口碑和股价越高，所以捐款能推高股价。',
  // 加班×产出（职场域：条件化的幸存叙述）
  '加班越少的团队，产出和满意度反而越高，所以加班会带来效率损失。',
  // 睡眠×离职（职场健康域）
  '睡眠越少的员工，出错率和离职率越高，所以缺觉会带来流失。',
  // 功能×留存（产品域）
  'APP 功能越少，口碑和留存反而越高，所以功能多会带来体验下降。',
];
const ATTACK_EN = [
  'The hotter the summer, the more ice cream sales and drowning cases rise, so ice cream causes drowning.',
  'The pricier the product, the higher the sales and margins, so high prices drive profits.',
  'The more police a city has, the more crime and complaints it reports, so policing increases crime.',
  'The less employees sleep, the higher the errors and turnover, so sleep loss increases attrition.',
  'The longer people exercise, the lower the weight and blood pressure, so exercise reduces disease.',
  'The bigger the signup bonus, the more referrals and viral growth, so bonuses drive expansion.',
  'The stricter the screening, the fewer the bugs and incidents in production, so strict screening reduces production incidents.',
];

// ─── 良性控制集（11 条：无因果动词 / 豁免 / 守卫形）────────────────────
const BENIGN = [
  // 无腿②真因果动词（说明/表明 是推断词，刻意不收）
  '补习越多的孩子，成绩和排名越高。',
  '训练越多的模型，准确率和稳定性越高，上线时间越短。',
  'The hotter the day, the higher the ice cream sales and cold drink orders.',
  // 证据语境豁免（数据显示）
  '数据显示，投入越多的团队，产能和满意度越高。',
  // 「参与」的「与」是构词语素非连词（lookbehind 排除）+ 无腿②
  '参与感越强的用户，留存率越高。',
  // 第二越子句模态/能愿词守卫 + 无腿②
  '越忙的时候越要多喝水和休息，注意别上火。',
  // 正确响应形（已点名共同因素 + 推理否定豁免）
  '气温越高的月份溺水事故也确实越多，但这可能只是相关，不能说明吃冰淇淋会导致溺水。',
  // EN：无腿②
  'The better the tool and the more time and money you save.',
  'The higher the quality, the more features and polish the product has.',
  // EN：对冲豁免
  'The hotter the summer, the more ice cream sales and drownings, which might suggest a link.',
  // 疑问形
  '气温越高，冰淇淋销量和溺水人数就越高，这能说明什么？',
];

// ─── 存量攻击（旧共变词族：相关名词形 / 双双 / 水涨船高 / 同步上升）────
const OLD_ATTACKS = [
  '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水。',
  '冰淇淋销量和溺水人数双双走高，说到底都是高温推动的。',
  '搜索量和成交量越涨越猛，说到底都是流量红利推动的。',
  'Ice cream sales and drownings both climbed this summer, and the heat wave drives both.',
];

// ─── A. gate 层归因（新攻击 → common_cause findings，action≠pass）─────
check('A gate 层归因：ZH 8/8 → common_cause findings 且 action≠pass', () => {
  for (const s of ATTACK_ZH) {
    const r = gate(s);
    assert.notStrictEqual(r.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'common_cause');
    assert.ok(f, 'findings 缺 common_cause: ' + s);
  }
});
check('A gate 层归因：EN 7/7 → common_cause findings 且 action≠pass', () => {
  for (const s of ATTACK_EN) {
    const r = gate(s);
    assert.notStrictEqual(r.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'common_cause');
    assert.ok(f, 'findings 缺 common_cause: ' + s);
  }
});

// ─── B. 模块直调（新攻击 15/15 命中）────────────────────────────────
check('B 模块直调：ZH 攻击 8/8 命中', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s), true, '未命中: ' + s);
});
check('B 模块直调：EN 攻击 7/7 命中', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s), true, '未命中: ' + s);
});

// ─── C. 良性零误伤（手工 11 条 + 官方语料全量模块级直调）───────────
check('C 良性零误伤：手工良性 11/11 不判', () => {
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
      if (checkCommonCause(s).hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数异常: ' + n);
  assert.strictEqual(fp, 0, `误命中 ${fp}/${n}: ` + hits.join(' | '));
});

// ─── D. 存量回归（旧攻击 4/4 仍命中 + 旧良性形仍不判）──────────────
check('D 存量回归：旧共变族攻击 4/4 仍命中', () => {
  for (const s of OLD_ATTACKS) assert.strictEqual(hit(s), true, '存量回退: ' + s);
});
check('D 存量回归：概念教学/实验证据/对冲旧良性仍不判', () => {
  const oldBenign = [
    '相关不等于因果，这个常识每个学统计的人都知道。',
    '随机对照试验显示，干预组和对照组的结局差异显著。',
    '这两个指标可能相关，但也许只是巧合。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量误判: ' + s);
});

// ─── E. 常量级注入-删条承重（新攻击翻 miss；存量常量语义不变）──────
const I = __internals();
check('E 注入 COVARY_REL_ZH=[] → ZH 新攻击 8/8 翻 miss', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { COVARY_REL_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 COVARY_REL_EN=[] → EN 新攻击 7/7 翻 miss', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { COVARY_REL_EN: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 COVARY_MOVE_ZH=[] → 存量 MOVE 攻击（双双/越涨越猛）翻 miss', () => {
  // 存量注入语义不变：数组注入=整体替换（r264 同口径）
  assert.strictEqual(hit(OLD_ATTACKS[1], { COVARY_MOVE_ZH: [] }), false, '双双族删条后仍命中');
  assert.strictEqual(hit(OLD_ATTACKS[2], { COVARY_MOVE_ZH: [] }), false, '越涨越猛删条后仍命中');
});
check('E 注入 CAUSE_ZH=[] → 存量相关名词形攻击翻 miss', () => {
  // 数组常量注入语义：整体替换（与 r264/r311 同口径；单正则注入仅适用于
  // 模块内以 pickRe 形态消费的单正则常量，CAUSE_ZH 走 anyHit 数组消费）
  assert.strictEqual(hit(OLD_ATTACKS[0], { CAUSE_ZH: [] }), false, 'CAUSE 删条后仍命中');
});
check('E 注入 NO_CONFOUND_ZH=[] → 新攻击不受影响（新攻击本身未点名共同因素）', () => {
  // 新攻击不依赖 NO_CONFOUND 豁免（句中无共同因素词），置空该豁免不影响命中
  assert.strictEqual(hit(ATTACK_ZH[0], { NO_CONFOUND_ZH: [] }), true, '新攻击意外依赖 NO_CONFOUND');
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：新正则元素在 COVARY_REL_ZH/EN 末位且数组长度 +1', () => {
  assert.ok(Array.isArray(I.COVARY_REL_ZH) && I.COVARY_REL_ZH.length >= 4, 'COVARY_REL_ZH 缺新元素');
  assert.ok(Array.isArray(I.COVARY_REL_EN) && I.COVARY_REL_EN.length >= 3, 'COVARY_REL_EN 缺新元素');
  assert.strictEqual(I.COVARY_REL_ZH[I.COVARY_REL_ZH.length - 1].test('气温越高，冰淇淋销量和溺水人数就越高，所以吃冰淇淋会导致溺水。'), true, 'ZH 新正则末位元素不匹配');
  assert.strictEqual(I.COVARY_REL_EN[I.COVARY_REL_EN.length - 1].test('The hotter the summer, the more ice cream sales and drowning cases rise, so ice cream causes drowning.'), true, 'EN 新正则末位元素不匹配');
});
check('F 边界锁：模态守卫挡良性处方形（越忙的时候越要多喝水）', () => {
  assert.strictEqual(hit('越忙的时候越要多喝水，和同事的关系要维护好。'), false, '模态守卫失效');
});
check('F 边界锁：疑问形豁免', () => {
  assert.strictEqual(hit('气温越高，冰淇淋销量和溺水人数就越高，所以吃冰淇淋会导致溺水吗？'), false, '疑问形未豁免');
});
check('F 边界锁：已点名共同因素不判（NO_CONFOUND）', () => {
  assert.strictEqual(hit('气温越高，冰淇淋销量和溺水人数就越高，二者都由高温这个共同原因驱动。'), false, '已点名共同因素未豁免');
});
check('F 边界锁：证据语境豁免（随机对照）', () => {
  assert.strictEqual(hit('随机对照实验中，气温越高的组别，冰淇淋销量和溺水上报数越高，所以需要控制季节因素。'), false, '证据语境未豁免');
});

// ─── G. 登记纪律 ─────────────────────────────────────────────────
check('G VERSION / package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});
check('G index.js common_cause 接线在位（require + 计算点 + dimMap）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/checkCommonCause/.test(src), 'index.js 缺 checkCommonCause 接线');
  assert.ok(/common_cause/.test(src), 'index.js 缺 common_cause 维度键');
});
check('G __internals 暴露 COVARY_REL_ZH/EN（负例注入口）', () => {
  assert.ok(Array.isArray(I.COVARY_REL_ZH), '__internals 缺 COVARY_REL_ZH');
  assert.ok(Array.isArray(I.COVARY_REL_EN), '__internals 缺 COVARY_REL_EN');
  assert.ok(Array.isArray(I.COVARY_MOVE_ZH), '__internals 缺 COVARY_MOVE_ZH');
  assert.ok(Array.isArray(I.CAUSE_ZH), '__internals 缺 CAUSE_ZH');
});

console.log(`\nround-327 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
