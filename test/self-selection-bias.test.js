/**
 * test/self-selection-bias.test.js — r253 自选择偏差维度测试
 * 覆盖：攻击命中（双腿型中英 + 独腿签名中英）、良性零误伤（含疑难 FP 压力
 * 样本）、两组豁免族（概念教学 / 正确因果口径含指派进入，嵌入真实签名，
 * 可负例注入证明承重）、边界锁（单腿句 / 邻接维度领地 / 防自证同跨度 /
 * 超距 / 倒装）、多签名档位、负例注入（腿①七组逐组 / 腿②四组逐组 / 独腿
 * 3+3 条逐条 / 距离窗双向承重 / 两组豁免逐组删除）、官方良性语料 272、
 * 引擎闸。
 * 与 r218-r252 模块同一测试范式：每个负例注入删除一组常量后，攻击必须
 * 不再命中、豁免句必须变红——证明每一组判据都真实承重。
 */
'use strict';
const assert = require('node:assert/strict');
const { detectSelfSelectionBias, __internals } = require('../src/self-selection-bias.js');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// 永不命中的正则（用于负例注入关闭某组常量）
const NEVER = /(?!)/;
const I = __internals();

// ─── 攻击样本 A：双腿型（腿①自选进入 × 腿②效果归因，邻近共现）─────
// 注入 NO_SELF / NO_CAUSE / W=0 均应失配（已逐条验证为纯双腿句）
const ATTACK_2LEG_ZH = [
  '自愿参加培训的员工绩效都更高，说明培训能提升绩效',
  '主动订阅我们服务的企业续费率高达九成，所以我们的服务带来了续费',
  '选择使用新工具的团队交付速度都更快，所以新工具提高了效率',
  '报名挑战赛的程序员刷题量都比不报名的多，所以挑战赛能促进刷题',
  '那些自己来找我们咨询的家庭，孩子成绩提高的比例最高，说明咨询有效',
  '被我们广告吸引来的客户转化率最高，说明广告精准',
  '用户自己勾选了高级套餐，他们的满意度就是更高，所以高级套餐更让人满意',
  '参加早鸟计划的商家月销平均高三成，所以早鸟计划能拉动销量',
  '报名我们课程的同学收入都涨了，所以课程有效',
  '来我们医院看病的患者术后恢复都不错，说明我们医术好',
  '主动上门的客户签约率都更高，所以这套打法有效',
  '受朋友推荐来的用户续费率都更高，所以推荐活动能带来续费',
  '用我们App的用户留存率很高，说明产品设计得成功',
  '主动请缨带项目的骨干交付质量都更高，所以带项目能锻炼人',
  '自愿投身公益项目的志愿者服务时长都更长，所以公益项目能改变人',
  '报班的学员成绩都提高更多，所以报班能提高成绩',
];
const ATTACK_2LEG_EN = [
  'Employees who volunteered for the training performed better, so the training improves performance',
  'Teams that chose to adopt the new tool ship faster, so the tool increases speed',
  'Firms that opted in to our program renewed at 90%, so the program drives retention',
  'The customers who sought us out are the most satisfied, so we are the best option around',
  'Readers who signed up for the challenge read more books, so the challenge boosts reading',
  'Those who picked our plan stayed longer, so our plan causes loyalty',
  'Patients who selected the surgery had better outcomes, so the surgery is what helped them',
  'Students who enrolled in our course all saw income growth, so the course works',
  'Patients who chose our hospital recovered well, which proves our treatment is superior',
  'Readers who subscribed to the newsletter buy three times more, so the newsletter drives purchases',
];

// ─── 攻击样本 B：独腿签名（SOLO，一句话内部自带完整自选择结构）─────
// 每条与 SOLO[n] 一一对应，删除该条后必须失配（在 NO_BOTH 隔离下验证）
const SOLO_ZH_ATTACKS = [
  '报名我们课程的人都反馈有用',              // Z0 自选组自证效果
  '自愿参加的人留下来的都认可这个项目',        // Z1 自选组留存自证
  '报了名的人都没有中途退出',                  // Z2 无差评自证
];
const SOLO_EN_ATTACKS = [
  'Participants who chose the program overwhelmingly reported it works',  // E0 自证效果
  'Those who signed up stayed because they valued it',                    // E1 留存自证
  'Nobody who signed up regrets it',                                      // E2 无差评自证
];

// ─── 良性样本（不得命中：含疑难 FP 压力样本）────────────────────
const BENIGN_HARD = [
  // 正确因果对冲（对照组/随机化/明言选择效应）
  '自愿参加培训的员工绩效更好，但他们可能本来就更积极，得和非参加的对比才知道',
  '订阅者续费率高，我们担心是自选择，正在设计随机分流实验',
  '选择新工具的团队更快，可这可能是快团队本来就爱选新工具',
  'Volunteers performed better, but self-selection is a real concern; we will randomize',
  'Teams that opted in ship faster, though we need a comparison group to claim causation',
  '报名者收入涨了，对照组没报名的人也涨了，两组涨幅接近，说明课程没有额外效果',
  // 概念教学（讨论自选择偏差这个概念本身）
  '这就是自选择偏差：参与者自己决定是否进入处理组，组间差异不能直接归因于处理',
  'This is self-selection bias: when participants choose their own treatment, the groups differ before the treatment',
  // 指派进入（非自选——统一安排/被要求/assigned）
  '公司统一安排这批员工参加培训，他们的绩效都更好，说明培训有效',
  '公司安排参加培训的学员成绩都更好，说明培训有效',
  '被要求使用新工具的团队交付更快，所以新工具提高了效率',
  'The company assigned these workers to the program, and they performed better, so the program works',
  'The workers assigned to the program performed better, so the program works',
  // 单腿句 / 纯事实陈述（无归因腿）
  '自愿参加培训的员工绩效都更高',
  '报名我们课程的同学收入都涨了',
  '课程有效，用得上的学员都说好',
  'Employees who volunteered for the training performed better',
  // 相关非归因（无处理名词、无因果动词）
  '报名的人更努力，所以成绩更好',
  // 邻接维度领地（survivorship / selection_on_dependent_variable / collider / hasty）
  '被选进决赛的选手都训练刻苦，所以刻苦就能进决赛',
  '活到九十岁的老人都早起，所以早起能让人长寿',
  '坚持到最后的用户都给了好评，所以产品没问题',
  '随机分组的用药组存活率更高，说明药有效',
  'In the randomized trial the treatment group survived more often, so the drug works',
];

// 防自证：归因腿匹配整体落在自选腿匹配内部、不带来任何新内容
const SELF_EVIDENCE = '使用所以方案更棒的企业';

// 超距样本：默认窗 W_ZH=60 内两腿不共现
const OVERDIST = '报名我们课程的同学收入都涨了' + '，'.repeat(80) + '所以课程有效';

// 多签名样本
const MULTI_ZH = '报名我们课程的同学收入都涨了，所以课程有效；自愿参加培训的员工绩效都更高，说明培训能提升绩效';
const MULTI_MIXED = '报名我们课程的同学收入都涨了，所以课程有效。Employees who volunteered for the training performed better, so the training improves performance';

// 距离窗负例句：两腿分离（dist>0），W=0 即失配
const W0_ZH = [
  '报名我们课程的同学收入都涨了，所以课程有效',
  '自愿参加培训的员工绩效都更高，说明培训能提升绩效',
];
const W0_EN = [
  'Employees who volunteered for the training performed better, so the training improves performance',
];

const NO_SELF = {
  SELF_VOLUNTARY_ZH: [], SELF_BARE_ZH: [], SELF_APPLY_ZH: [], SELF_ATTRACT_ZH: [],
  SELF_ONESELF_ZH: [], SELF_ACTIVE_ZH: [], SELF_COME_ZH: [], SELF_EN: [],
};
const NO_CAUSE = { CAUSE_CMP_ZH: [], CAUSE_TREAT_ZH: [], CAUSE_SUPER_ZH: [], CAUSE_EN: [] };
const NO_BOTH = Object.assign({}, NO_SELF, NO_CAUSE);
const NO_SOLO = { SOLO_ZH: [], SOLO_EN: [] };

// 腿①七组（含逐族独占句；[keys, attacks]——keys 可多选，覆盖共享判据的样本）
const SELF_GROUPS = [
  [['SELF_VOLUNTARY_ZH'], [
    '主动请缨带项目的骨干交付质量都更高，所以带项目能锻炼人',
    '自愿投身公益项目的志愿者服务时长都更长，所以公益项目能改变人',
  ]],
  [['SELF_BARE_ZH'], [
    '选择使用新工具的团队交付速度都更快，所以新工具提高了效率',
    '参加早鸟计划的商家月销平均高三成，所以早鸟计划能拉动销量',
    '订阅了newsletter的读者购买率是不订阅的三倍，说明newsletter促进购买',
  ]],
  [['SELF_APPLY_ZH'], [
    '报名我们课程的同学收入都涨了，所以课程有效',
    '报班的学员成绩都提高更多，所以报班能提高成绩',
  ]],
  [['SELF_ATTRACT_ZH'], [
    '被我们广告吸引来的客户转化率最高，说明广告精准',
    '受朋友推荐来的用户续费率都更高，所以推荐活动能带来续费',
  ]],
  [['SELF_ONESELF_ZH'], [
    '用户自己勾选了高级套餐，他们的满意度就是更高，所以高级套餐更让人满意',
  ]],
  [['SELF_ACTIVE_ZH'], [
    '主动上门的客户签约率都更高，所以这套打法有效',
  ]],
  // 「自己找来我们咨询的家庭」同时被 SELF_ONESELF（自己+找来）、
  // SELF_ACTIVE（自己+找来）、SELF_COME（来+我们+咨询+的家庭）三组覆盖，
  // 合并删除验证承重
  [['SELF_ONESELF_ZH', 'SELF_ACTIVE_ZH', 'SELF_COME_ZH'], [
    '那些自己来找我们咨询的家庭，孩子成绩提高的比例最高，说明咨询有效',
  ]],
  [['SELF_COME_ZH'], [
    '来我们医院看病的患者术后恢复都不错，说明我们医术好',
  ]],
  [['SELF_EN'], ATTACK_2LEG_EN],
];
// 腿②四组（含逐族独占句）
const CAUSE_GROUPS = [
  [['CAUSE_CMP_ZH'], [
    '自愿参加培训的员工绩效都更高，说明培训能提升绩效',
    '报名挑战赛的程序员刷题量都比不报名的多，所以挑战赛能促进刷题',
  ]],
  [['CAUSE_TREAT_ZH'], [
    '报名我们课程的同学收入都涨了，所以课程有效',
    '被我们广告吸引来的客户转化率最高，说明广告精准',
    '用我们App的用户留存率很高，说明产品设计得成功',
  ]],
  [['CAUSE_SUPER_ZH'], [
    '来我们医院看病的患者术后恢复都不错，说明我们医术好',
  ]],
  [['CAUSE_EN'], ATTACK_2LEG_EN],
];

check('模块可加载且导出签名函数', () => {
  assert.equal(typeof detectSelfSelectionBias, 'function');
  const r = detectSelfSelectionBias('报名我们课程的同学收入都涨了，所以课程有效');
  assert.equal(r.hit, true);
  assert.equal(r.dimension, 'self_selection_bias');
  assert.ok(r.details && r.details.includes('自选择偏差'));
  assert.ok(r.guidance && r.guidance.length > 50);
  assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1);
  assert.ok(Array.isArray(r.tags) && r.tags.includes('self-selection-bias'));
});

check('攻击命中：双腿型中英', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectSelfSelectionBias(t).hit, true, 'ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectSelfSelectionBias(t).hit, true, 'EN: ' + t);
});

check('攻击命中：独腿签名中英', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectSelfSelectionBias(t, NO_BOTH).hit, true, 'SOLO_ZH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectSelfSelectionBias(t, NO_BOTH).hit, true, 'SOLO_EN: ' + t);
});

check('良性零误伤：疑难 FP 压力样本', () => {
  for (const t of BENIGN_HARD) assert.equal(detectSelfSelectionBias(t).hit, false, '误伤: ' + t);
});

check('防自证：归因腿整体落在自选腿内部不得一话两证', () => {
  assert.equal(detectSelfSelectionBias(SELF_EVIDENCE).hit, false);
});

check('档位：单签名 0.62 / 多签名 0.72', () => {
  const one = detectSelfSelectionBias('报名我们课程的同学收入都涨了，所以课程有效');
  assert.equal(one.hit, true);
  assert.equal(one.count, 1);
  assert.ok(Math.abs(one.score - 0.62) < 1e-9, '单签名 0.62');
  const multi = detectSelfSelectionBias(MULTI_ZH);
  assert.equal(multi.hit, true);
  assert.ok(multi.count >= 2, '多签名');
  assert.ok(Math.abs(multi.score - 0.72) < 1e-9, '多签名 0.72');
  const mixed = detectSelfSelectionBias(MULTI_MIXED);
  assert.equal(mixed.hit, true);
  assert.ok(mixed.count >= 2, '中英混排多签名');
  assert.ok(Math.abs(mixed.score - 0.72) < 1e-9, '中英混排 0.72');
});

check('负例注入：腿①自选进入整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectSelfSelectionBias(t, NO_SELF).hit, false, '删腿①ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectSelfSelectionBias(t, NO_SELF).hit, false, '删腿①EN: ' + t);
});

check('负例注入：腿②效果归因整族删除后双腿攻击全部不再命中', () => {
  for (const t of ATTACK_2LEG_ZH) assert.equal(detectSelfSelectionBias(t, NO_CAUSE).hit, false, '删腿②ZH: ' + t);
  for (const t of ATTACK_2LEG_EN) assert.equal(detectSelfSelectionBias(t, NO_CAUSE).hit, false, '删腿②EN: ' + t);
});

check('负例注入：腿①七组逐组删除后该组独占攻击失配', () => {
  for (const [keys, list] of SELF_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    for (const k of keys) inj[k] = [];
    for (const t of list) {
      assert.equal(detectSelfSelectionBias(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(detectSelfSelectionBias(t, inj).hit, false, '删 ' + keys.join('+') + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：腿②四组逐组删除后该组独占攻击失配', () => {
  for (const [keys, list] of CAUSE_GROUPS) {
    const inj = Object.assign({}, NO_SOLO);
    for (const k of keys) inj[k] = [];
    for (const t of list) {
      assert.equal(detectSelfSelectionBias(t, NO_SOLO).hit, true, '默认应命中: ' + t);
      assert.equal(detectSelfSelectionBias(t, inj).hit, false, '删 ' + keys.join('+') + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：独腿签名逐条删除后对应攻击失配（NO_BOTH 隔离双腿）', () => {
  I.SOLO_ZH.forEach((_, i) => {
    const inj = Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, i).concat(I.SOLO_ZH.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_ZH_ATTACKS[i];
    assert.equal(detectSelfSelectionBias(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectSelfSelectionBias(t, inj).hit, false, '删 SOLO_ZH[' + i + '] 后应失配: ' + t);
  });
  I.SOLO_EN.forEach((_, i) => {
    const inj = Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, i).concat(I.SOLO_EN.slice(i + 1)) }, NO_BOTH);
    const t = SOLO_EN_ATTACKS[i];
    assert.equal(detectSelfSelectionBias(t, NO_BOTH).hit, true, 'NO_BOTH 下应经独腿命中: ' + t);
    assert.equal(detectSelfSelectionBias(t, inj).hit, false, '删 SOLO_EN[' + i + '] 后应失配: ' + t);
  });
});

check('负例注入：独腿签名整族删除后独腿攻击全部不再命中', () => {
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectSelfSelectionBias(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectSelfSelectionBias(t, NO_BOTH).hit, true, 'NO_BOTH: ' + t);
  for (const t of SOLO_ZH_ATTACKS) assert.equal(detectSelfSelectionBias(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
  for (const t of SOLO_EN_ATTACKS) assert.equal(detectSelfSelectionBias(t, Object.assign({ SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH)).hit, false, '删独腿: ' + t);
});

check('负例注入：距离窗双向承重（默认窗超距不命中，放大到 500 后命中）', () => {
  assert.equal(detectSelfSelectionBias(OVERDIST).hit, false, '默认 W_ZH=60 超距不命中');
  assert.equal(detectSelfSelectionBias(OVERDIST, { W_ZH: 500 }).hit, true, '放大窗后命中（窗承重）');
});

check('负例注入：距离窗收紧到 0 后双腿攻击全部不再命中', () => {
  for (const t of W0_ZH) assert.equal(detectSelfSelectionBias(t, { W_ZH: 0 }).hit, false, 'W_ZH=0: ' + t);
  for (const t of W0_EN) assert.equal(detectSelfSelectionBias(t, { W_EN: 0 }).hit, false, 'W_EN=0: ' + t);
});

check('负例注入：概念教学豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '报名我们课程的同学收入都涨了，所以课程有效——这是志愿者偏误的典型案例';
  const en = 'Employees who volunteered for the training performed better, so the training improves performance — this is volunteer bias in action';
  assert.equal(detectSelfSelectionBias(zh).hit, false, '概念教学ZH 默认豁免');
  assert.equal(detectSelfSelectionBias(zh, { CONCEPT_ZH: NEVER }).hit, true, '删概念教学ZH 后变红');
  assert.equal(detectSelfSelectionBias(en).hit, false, '概念教学EN 默认豁免');
  assert.equal(detectSelfSelectionBias(en, { CONCEPT_EN: NEVER }).hit, true, '删概念教学EN 后变红');
});

check('负例注入：正确因果口径豁免（中英）删除后豁免句变红（承重证明）', () => {
  const zh = '报名我们课程的同学收入都涨了，所以课程有效——但我们需要对照组才能归因';
  const en = 'Employees who volunteered for the training performed better, so the training improves performance, but we need a controlled comparison';
  assert.equal(detectSelfSelectionBias(zh).hit, false, '正确因果口径ZH 默认豁免');
  assert.equal(detectSelfSelectionBias(zh, { CORRECTIVE_ZH: NEVER }).hit, true, '删正确因果口径ZH 后变红');
  assert.equal(detectSelfSelectionBias(en).hit, false, '正确因果口径EN 默认豁免');
  assert.equal(detectSelfSelectionBias(en, { CORRECTIVE_EN: NEVER }).hit, true, '删正确因果口径EN 后变红');
});

check('负例注入：指派进入豁免（中）删除后豁免句变红（承重证明）', () => {
  const zh = '公司安排参加培训的学员成绩都更好，说明培训有效';
  assert.equal(detectSelfSelectionBias(zh).hit, false, '指派进入ZH 默认豁免');
  assert.equal(detectSelfSelectionBias(zh, { CORRECTIVE_ZH: NEVER }).hit, true, '删指派进入ZH 后变红');
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '报名']) {
    const r = detectSelfSelectionBias(v);
    assert.equal(r.hit, false, '不得命中: ' + JSON.stringify(v));
  }
});

check('官方良性语料 272 条零误命中', () => {
  const path = require('node:path');
  const ROOT = path.join(__dirname, '..');
  const corpora = [];
  const push = (src, t) => { if (typeof t === 'string' && t.trim()) corpora.push({ src, text: t }); };
  const pick = (it) => (typeof it === 'string' ? it : (it && typeof it === 'object' ? (it.text || it.sample || it.input || it.prompt || it.content) : null));
  const gb = require(path.join(ROOT, 'test', 'gate-benchmark.js'));
  for (const [cat, arr] of Object.entries(gb.SAMPLES || {})) if (Array.isArray(arr)) for (const it of arr) push('gb:' + cat, pick(it));
  const ext = require(path.join(ROOT, 'test', 'gate-benchmark-extended.js'));
  for (const [k, v] of Object.entries(ext)) if (Array.isArray(v)) for (const it of v) push('ext:' + k, pick(it));
  const vb = require(path.join(ROOT, 'test', 'vertical-benign-benchmark.js'));
  for (const [cat, arr] of Object.entries(vb.CATEGORIES || {})) if (Array.isArray(arr)) for (const it of arr) push('vert:' + cat, pick(it));
  const bm = require(path.join(ROOT, 'test', 'benign-mixed-benchmark.js'));
  for (const [k, v] of Object.entries(bm)) if (Array.isArray(v)) for (const it of v) push('mixed:' + k, pick(it));
  assert.ok(corpora.length >= 270, '语料规模 ' + corpora.length);
  let hits = 0;
  for (const c of corpora) if (detectSelfSelectionBias(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：接线后良性样本零误伤 + 攻击样本必须被 self_selection_bias 承重', () => {
  const engine = require('../src/gate.js');
  const gate = engine.gate;
  assert.equal(typeof gate, 'function', '引擎入口存在');
  // [r271 接线翻转] 原断言为「模块未接线时 gate() 不得出现
  // self_selection_bias findings」——r271 已把模块接线为第 241 维度，
  // 该前提失效。新语义保留原测试意图（良性零误伤）并追加接线的正向
  // 验证（攻击样本必须由 self_selection_bias 维度承重），属接线必然的
  // 语义变更，不是为适配改动而放宽标准。
  for (const t of BENIGN_HARD) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(!dims.includes('self_selection_bias'), '误伤: ' + t);
  }
  // 接线正向：双腿攻击必须由 self_selection_bias 维度承重（不是被其他
  // 维度顺手改写），否则等于没接上。
  const attacks = [
    '报名我们课程的同学收入都涨了，所以课程有效',
    '自愿参加培训的员工绩效更高，说明培训能提升绩效',
    '愿意接这份问卷的人收入都偏高，可见我们用户群体普遍高收入',
    'The students who opted into tutoring scored higher, so tutoring works.',
    'Participating employees voluntarily chose the program and then performed better, so the program works.',
  ];
  for (const t of attacks) {
    const out = gate(t);
    const dims = (out.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    assert.ok(dims.includes('self_selection_bias'), '未由 self_selection_bias 承重: ' + t);
  }
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
