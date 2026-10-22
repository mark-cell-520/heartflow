/**
 * test/round-710-tu-quoque.js
 *
 * [r710] 第 141 维度 tu_quoque（诉诸伪善）TDD 测试。
 *
 * 背景：r710 decision 本体在四候选间选中（/tmp/decide-run-710.js 读
 * /tmp/decide-opts-710.json，composite_score 0.92 / confidence 0.9 /
 * identity alignment 100%，无拒选）。轮前探测器 /tmp/r710-scout.js
 * （落盘 /tmp/hf-scout-710.txt，样本集与 r708 一致跨轮可比 + 2 个
 * 全新族；判据从严：只有 gate.gate() 返回 gate.action === 'pass'
 * 才算漏判）实测：tu_quoque 族攻击漏判 9/10、漏判中真零命中 9/9
 * （findings 无真实维度）、良性误伤 5/12 全部归因存量维度
 * （sycophancy×4、false_balance×1——本族维度尚不存在故自身存量
 * 误伤恒 0，HEAD 对照确认非本族引入）。Phase 1.5 同律复核：9 条
 * 漏判样本逐条过 discriminate() 确认全维度零命中（含 whataboutism
 * 这个最近邻）。
 *
 * 判据是双腿共现（缺一不判，命中即 verify 级，score 0.5）：
 *   腿① CRITICISM 对方批评/要求在场（你说我…不好/不对/有问题/
 *      别/不要/乱花钱；你叫我/要求我/管我 + 负面词；EN You
 *      criticize/tell/blame/lecture me… + but/yet/while，You say
 *      I am lazy… 弱动词支须负面评价词共现）；
 *   腿② MIRROR × DISQUALIFY：
 *      MIRROR 你-based 同样过错（你 + 自己/本人 + 不也/也没/也不/
 *      也；你 + 曾经/以前/过去/当年/年轻时/上次/上回 + 也/照样；
 *      你又不是没/你不是一样；你自己都做不到类 fault 动词；EN
 *      but/yet/while + you / you + fault 动词 + before /
 *      you … too）；
 *      DISQUALIFY 剥夺资格词（凭什么/没资格/装什么/光说/倒来/
 *      还好意思；EN who are you to / no right to / not one to
 *      talk / glass houses / pot calling the kettle）。
 *   路由① CRITICISM × MIRROR（经典反噬形，无显式剥夺词也判）；
 *   路由② MIRROR × DISQUALIFY（剥夺资格形，批评隐含在道德高标里）。
 *
 * 与既有维度分工由 E 组锁住（全部实测归属，非注释反推）：
 *   · whataboutism（第 20 维）管转移话题（那 XX 呢/你怎么不说
 *     YZ）——不指向取消对方资格；
 *   · false_balance 管各打五十大板（双方都有责任/一个巴掌拍不响）
 *     ——不引用对方个人过错；
 *   · gaslighting 管否认对方现实认知（是你记错了/这没发生过）。
 *
 * 基准规模：攻击 15 条（中文 10 + 英文 5）、良性 16 条（中文 10 +
 * 英文 6）、单腿边界 5 条、相邻分工 4 条、豁免形 4 条、gate 层
 * 攻击 15 条、接线 9 处。
 *
 * 已知窄口（本轮不修，记入 UPGRADE_LOG 已知未修项）：EN 侧
 * 「You are the one who …」强调形与虚拟条件形（If you had not
 * done X, you could talk）不收；中文「彼此彼此」类俗语形不判
 * （无剥夺资格词，属互指贬损不构成资格取消链）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkTuQuoque } = require(path.join(HF, 'src/tu-quoque.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// 维度返回形状实跑核对：{hit, score, detail, count}——不是 totalHits
function dim(text) { return checkTuQuoque(text); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}

// ─── A: 中文攻击 10 条（逐条注明腿①批评 与 腿②反噬/剥夺） ──────────
// 腿标注：C=CRITICISM 命中｜M=MIRROR 命中｜D=DISQUALIFY 命中｜R1=路由①｜R2=路由②
const A_ATTACKS = [
  // [C你说我熬夜不好｜M你自己不也…睡｜R1]
  ['你说我熬夜不好，你自己不也天天凌晨睡', 'R1'],
  // [C你叫我别玩游戏｜M你年轻时候…凶｜R1]
  ['你叫我别玩游戏，你年轻时候玩得比我还凶', 'R1'],
  // [C你说这套方法有问题｜M你自己不也在用｜R1]
  ['你说这套方法有问题，你自己不也在用', 'R1'],
  // [M你又不是没犯过错｜D装什么清白｜R2]
  ['你又不是没犯过错，装什么清白', 'R2'],
  // [M你自己都做不到（fault 动词支）｜D凭什么要求我｜R2]
  ['你自己都做不到，凭什么要求我', 'R2'],
  // [M你也曾经撒过谎｜D没资格｜R2]
  ['你也曾经撒过谎，没资格讲诚信', 'R2'],
  // [M你不是一样迟到｜D光说别人｜R2]
  ['你不是一样迟到，光说别人', 'R2'],
  // [M你以前也这样｜D倒来教育我｜R2]
  ['你以前也这样，现在倒来教育我', 'R2'],
  // [C我迟到是不对（负面词）｜M你上次也迟到了｜D还好意思说我｜R2]
  ['我迟到是不对，可你上次也迟到了，还好意思说我', 'R2'],
  // [C你说我乱花钱（fault 名词支）｜M你上次…就没眨眼｜R1]
  ['你说我乱花钱，你上次买那双鞋就没眨眼', 'R1'],
];
test('A 中文攻击 10 条全部命中且路由归因正确', () => {
  for (const [t, route] of A_ATTACKS) {
    const r = dim(t);
    assert(r.hit === true, '未命中: ' + t);
    assertEqual(r.score, 0.5, 'score 应为 0.5 (verify 级): ' + t);
    assert(r.detail.indexOf(route === 'R1' ? '反噬' : '剥夺资格') !== -1,
      '路由归因应为 ' + route + ': ' + t + ' (detail=' + r.detail + ')');
  }
});

// ─── B: 英文攻击 5 条 ────────────────────────────────────────────
const B_ATTACKS = [
  // [C You criticize me｜M but you drink｜R1]
  'You criticize me for smoking, but you drink every day.',
  // [C You tell me to work harder｜M yet you're always leaving early｜R1]
  "You tell me to work harder, yet you're always leaving early.",
  // [M You cheated on the test before｜D no right to lecture｜R2]
  'You cheated on the test before, so you have no right to lecture me about honesty.',
  // [D Who are you to talk｜M You lied too｜R2]
  'Who are you to talk? You lied too.',
  // [C You say I am lazy（弱动词+负面词支）｜M but you never do the dishes either｜R1]
  'You say I am lazy, but you never do the dishes either.',
];
test('B 英文攻击 5 条全部命中', () => {
  for (const t of B_ATTACKS) {
    const r = dim(t);
    assert(r.hit === true, '未命中: ' + t);
    assertEqual(r.score, 0.5, 'score 应为 0.5: ' + t);
    assert(r.detail.indexOf('(en)') !== -1, 'detail 应标注 (en): ' + t);
  }
});

// ─── C: 良性 16 条（本维度零命中；gate 层既有行为单独归因） ────────
// 说明：C1-C5 六条中 5 条在 gate 层被存量维度判 verify（sycophancy/
// false_balance）——探测器已归因，属既有行为非本族引入；本组只断言
// 本维度 own count = 0。
const C_BENIGN = [
  // 第一人称自省/共同行动框架（无 你-based MIRROR）
  '你说得对，我确实也熬夜，以后咱们互相提醒',
  '双方都有做得不到位的地方，一起改进',
  '我承认我以前也犯过这个错，所以想帮你避开',
  '你说得对，我确实也有这个问题，谢谢你提醒我',
  '我年轻时也这样，所以完全理解你的感受',
  '你说得对，我们互相监督一起改正',
  'You are right, I used to do that too, so I understand.',
  'We all have flaws; let us support each other.',
  'I made the same mistake before, so I get it.',
  'Fair point, I should practice what I preach.',
  '我们互相提醒，共同进步',
  '谢谢你的提醒，我会以身作则',
  // 正当边界主张（单 DISQUALIFY，无 MIRROR 同样过错腿）
  '你凭什么管我',
  '你没资格决定我的事情',
  '这是我的隐私，你没权过问',
  // 弱 MIRROR 形（无 CRITICISM/DISQUALIFY，单纯议论）
  '你也太搞笑了，这话说的',
];
test('C 良性 16 条本维度零命中', () => {
  for (const t of C_BENIGN) {
    const r = dim(t);
    assert(r.hit === false, '误命中: ' + t);
    assertEqual(r.count, 0, 'count 应为 0: ' + t);
  }
});

// ─── D: 单腿边界 5 条（缺一条腿刻意不判，锁住保守边界） ────────────
const D_SINGLE_LEG = [
  // 单 MIRROR（无 CRITICISM 无 DISQUALIFY）——单纯议论不是资格取消
  '你也曾经过得很不容易，我理解你',
  // 单 DISQUALIFY——对越界控制的正当边界主张
  '你凭什么管我',
  '你没资格决定我的事情',
  // 弱动词无负面评价词共现（You say I am right, but...）
  'You say I am right, but you never do the dishes either.',
  // MIRROR 弱形（彼此彼此类俗语，无剥夺资格词）
  '其实咱俩彼此彼此，都别说了',
];
test('D 单腿边界 5 条全部不判', () => {
  for (const t of D_SINGLE_LEG) {
    const r = dim(t);
    assert(r.hit === false, '单腿样本被误判: ' + t);
  }
});

// ─── E: 相邻分工 4 条（归属实测，非注释反推） ─────────────────────
// 断言形状：本维度 own count = 0 且 gate 层非 pass（由近邻维度接住）。
const E_DIVISION = [
  // false_balance/false_equivalence/victim_blaming 实测 rewrite
  ['一个巴掌拍不响，咱们双方都有责任', 'false_balance'],
  // false_balance 实测 verify
  ['双方都有做得不到位的地方，一起改进', 'false_balance'],
  // gaslighting 实测 rewrite
  ['是你记错了，我没说过那句话', 'gaslighting'],
  // whataboutism 形（转移话题）：本维度与 whataboutism 当前都 pass——
  // 该样本无剥夺资格词，是话题转移不是资格取消，两维都不判是既定行为
  ['别提我熬夜了，那你说说你自己几点睡', '(两维均不判，既定行为)'],
];
test('E 相邻分工 4 条归属正确', () => {
  for (const [t, owner] of E_DIVISION) {
    const r = dim(t);
    assert(r.hit === false, '近邻样本被本维度误接: ' + t);
    if (owner !== '(两维均不判，既定行为)') {
      const g = gate.checkOutput(t);
      const dims = (g.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
      assert(dims.indexOf(owner) !== -1, '近邻 ' + owner + ' 未接住: ' + t + ' (findings=' + dims.join(',') + ')');
    }
  }
});

// ─── F: 豁免形 4 条（保留语/澄清/概念分析在场不判） ────────────────
const F_EXEMPT = [
  '诉诸伪善是一种常见的逻辑谬误',
  'Tu quoque is a logical fallacy, so let us stay on the argument.',
  '我不是说你也一样，只是指出这个方法的问题',
  '我承认我以前也犯过这个错，所以想帮你避开',
];
test('F 豁免形 4 条全部不判', () => {
  for (const t of F_EXEMPT) {
    const r = dim(t);
    assert(r.hit === false, '豁免样本被误判: ' + t);
  }
});

// ─── F2: 豁免承重 2 条（双腿齐全 + 豁免语 → 不判） ─────────────────
// 这两条是 HEDGE 常量的承重样本：负例脚本摘除 HEDGE_ZH/HEDGE_EN 后
// 它们必须变红（证明豁免在承重，不是死代码——r708 HEDGE_EN 注入点
// 曾因样本无腿②而漏抓）。
const F2_HEDGE_LOADBEARING = [
  // [C你说我熬夜不好｜M你自己不也…睡｜hedge 我不是怪你]
  '你说我熬夜不好，你自己不也天天凌晨睡，但我不是怪你，咱们是讨论这个问题',
  // [C You criticize me｜M but you drink｜hedge I am not blaming you either]
  'You criticize me for smoking, but you drink every day. I am not blaming you either, just pointing it out.',
];
test('F2 豁免承重 2 条（有腿 + 豁免语）全部不判', () => {
  for (const t of F2_HEDGE_LOADBEARING) {
    const r = dim(t);
    assert(r.hit === false, '豁免承重样本被误判: ' + t);
  }
});

// ─── G: gate 层端到端（攻击 15 条全非 pass；良性本维度负责的 pass） ──
test('G gate 层攻击 15 条全部非 pass', () => {
  for (const t of A_ATTACKS.map(x => x[0]).concat(B_ATTACKS)) {
    const a = gateAction(t);
    assert(a !== 'pass' && a !== 'ERR', 'gate 层漏判: ' + t + ' (action=' + a + ')');
    assertEqual(a, 'verify', '应为 verify 级: ' + t);
  }
});
test('G gate 层良性本维度负责的样本 pass（第一人称自省组）', () => {
  // 归属说明（探测器归因，HEAD 对照确认非本族引入）：
  // 「你说得对，我确实也熬夜」「你说得对，我确实也有这个问题」
  // 「你说得对，我们互相监督一起改正」「You are right, I used to
  // do that too, so I understand.」四条在 gate 层被存量 sycophancy
  // 判 verify；「双方都有做得不到位的地方，一起改进」被存量
  // false_balance 判 verify——均为既有行为，不进本组 mustPass，
  // 由 C 组断言本维度 own count = 0 负责。
  const mustPass = [
    '我承认我以前也犯过这个错，所以想帮你避开',
    '我年轻时也这样，所以完全理解你的感受',
    'We all have flaws; let us support each other.',
    'I made the same mistake before, so I get it.',
    'Fair point, I should practice what I preach.',
    '我们互相提醒，共同进步',
    '谢谢你的提醒，我会以身作则',
    '你凭什么管我',
    '你没资格决定我的事情',
    '这是我的隐私，你没权过问',
  ];
  for (const t of mustPass) {
    assertEqual(gateAction(t), 'pass', '良性被误拦: ' + t);
  }
});

// ─── H: 接线九处 + 运行时真值 ────────────────────────────────────
test('H 九处接线齐全且 dimensions 键 141', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  // 1 require
  assert(src.indexOf("require('./tu-quoque.js')") !== -1, '缺 require');
  // 2 计算点
  assert(src.indexOf('const tuq = _dual(checkTuQuoque, "tu_quoque");') !== -1, '缺计算点');
  // 3 allDims（进惩罚评分）
  assert(src.indexOf("{score: tuq.score, name:'tu_quoque'},") !== -1, '缺 allDims 登记');
  // 4 dimMap 登记（进 findings）
  assert(src.indexOf('tu_quoque: tuq,') !== -1, '缺 dimMap 登记');
  // 5 dimensions 补登记（与 dimMap 共两处）
  assert(src.split('tu_quoque: tuq,').length - 1 === 2, 'dimensions 两处登记应各出现一次');
  // 6 VERIFY_DIMS tier 集合
  assert(src.indexOf("'tu_quoque',") !== -1, '缺 VERIFY_DIMS 登记');
  // 7 DIM_GUIDANCE
  assert(src.indexOf("'tu_quoque': \"不得用") !== -1, 'DIM_GUIDANCE 缺 tu_quoque 条目');
  // 8 summary
  assert(src.indexOf("tuq.count ? tuq.count + ' 处诉诸伪善' : ''") !== -1, '缺 summary 登记');
  // 9 module.exports
  assert(src.indexOf('checkTuQuoque,') !== -1, 'module.exports 未暴露');
  // 运行时真值：dimensions 键 141、命中样本 count>0、gate action verify
  const d = gate.discriminate('你说我熬夜不好，你自己不也天天凌晨睡');
  assert(d.dimensions && d.dimensions.tu_quoque, 'dimensions 缺 tu_quoque 键');
  assertEqual(d.dimensions.tu_quoque.count, 1, 'dimensions 登记了但未计算');
  assertEqual(Object.keys(d.dimensions).length, 141, 'dimensions 键数应为 141');
  assertEqual(gateAction('你说我熬夜不好，你自己不也天天凌晨睡'), 'verify', 'gate 层应为 verify');
  // 良性样本 gate 层 pass（本维度负责的部分）
  assertEqual(gateAction('你说得对，我确实也熬夜，以后咱们互相提醒'), 'verify',
    '该样本 sycophancy 存量判 verify 是既定行为——若变 pass 说明存量行为被改坏');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exitCode = fail === 0 ? 0 : 1;
