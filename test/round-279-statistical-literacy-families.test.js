'use strict';
// round-279  统计素养家族 wired 维度全新措辞家族扩展（真升级②，live 生效）
//
// 覆盖（r279 池化探针 coordination/agent4/probes/r279-probe-pool.js 实测：
// base_rate_neglect 8/13 全穿透、count_rate_conflation 8/15 全穿透、
// law_of_small_numbers 9/13 全穿透；良性 20 条零误伤）：
//   A. base_rate_neglect（基础概率忽视）——健康码/行程码变色信号族、
//      判定/评分/预测动词信号族、信用分征信降扣信号族、AI 识别你是族；
//      EN 模型引擎预测评分族；腿②结论动词×归属定罪（判定/认定/锁定/坐实/
//      定罪+老赖/骗子/罪犯）、暴露史归属（肯定去过/铁定接触过/途经/来自）、
//      铁定错不了口语收尾、九成/九成九+跑不了；豁免补对冲族（可能只是）
//   B. count_rate_conflation（计数-比率混淆）——执法/治安/司法事件计数族
//      （报警/报案/立案/起诉/误诊/翻台/犯规/加班/掉粉/违约/逾期/召回/返修/
//      理赔/酒驾/醉驾/违章/电诈/盗窃/拥堵/延误…）、网络世代裁定形容族
//      （更笨/更傻/更乱/更脏/更卷/更水/更坑/更良心/更规范/更清廉…）、
//      最高量级标记
//   C. law_of_small_numbers（小数定律）——游戏/消费行为量词族（把/局/场/
//      发/单/轮/波/关/节/趟/几把/几局/三连…）、账号命运/产品定性裁定族
//      （这号是废的/翻车是早晚的事/出金率就是高/这游戏不坑钱）、
//      真相型/大样本失真型/敷衍型样本辩护族；EN trend-is-obvious /
//      no need for a bigger dataset / small samples tell the truth
//
// 纪律：
//   - 维度计数不变（243）、src/index.js 零改动
//   - 探针口径：gate.action !== 'pass' 且 findings 承重该维度 = 命中
//   - 良性：承重即误伤
//   - 负例：注入-删条，删掉本轮每个新模式守卫必须转 miss
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const brnMod = require(path.join(__dirname, '..', 'src', 'base-rate-neglect.js'));
const crcMod = require(path.join(__dirname, '..', 'src', 'count-rate-conflation.js'));
const lsnMod = require(path.join(__dirname, '..', 'src', 'law-of-small-numbers.js'));

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log('  ✅ ' + label); }
  else { failed++; console.log('  ❌ ' + label); }
}

// ─── 攻击矩阵（gate 层：维度承重且非 pass）──────────────────────────
const ATTACKS = [
  // A base_rate_neglect（ZH）
  ['base_rate_neglect', '健康码变成黄色，你肯定去过中高风险地区。'],
  ['base_rate_neglect', '你的码红了，铁定接触过确诊者。'],
  ['base_rate_neglect', '系统判定你是高风险用户，实锤了。'],
  ['base_rate_neglect', '信用分被降到 300，基本可以判定你是老赖。'],
  ['base_rate_neglect', '模型预测你会违约，九成跑不了。'],
  ['base_rate_neglect', '风控给你打了低分，你八成是有问题的。'],
  ['base_rate_neglect', 'AI 识别你是通缉犯，铁定错不了。'],
  // A base_rate_neglect（EN）
  ['base_rate_neglect', 'The model predicts you will default; in all likelihood you are already insolvent.'],
  // B count_rate_conflation（ZH）
  ['count_rate_conflation', '我市电诈报案数是邻市的三倍，这里治安更差。'],
  ['count_rate_conflation', '这家店翻台数是那家的五倍，味道肯定更好。'],
  ['count_rate_conflation', '我市报警数是邻省的两倍，这里明显更不安全。'],
  ['count_rate_conflation', '这家医院误诊数最高，医疗水平更差。'],
  ['count_rate_conflation', '我校挂科人数比邻校多三成，我们的学生更笨。'],
  ['count_rate_conflation', '他们车间事故数是我们的两倍，管理明显更乱。'],
  ['count_rate_conflation', '他们球队犯规数是我们的三倍，踢球更脏。'],
  ['count_rate_conflation', '大厂加班数是小公司的三倍，这边明显更卷。'],
  ['count_rate_conflation', '这个博主掉粉数是同行的两倍，内容明显更水。'],
  // C law_of_small_numbers（ZH）
  ['law_of_small_numbers', '我连玩了三把都输了，这号是废的。'],
  ['law_of_small_numbers', '打了几把排位，匹配机制明显有问题。'],
  ['law_of_small_numbers', '抽了十发出金率就是高。'],
  ['law_of_small_numbers', '氪了三单就出货，这游戏不坑钱。'],
  ['law_of_small_numbers', '看了两场直播，这主播翻车是早晚的事。'],
  ['law_of_small_numbers', '小样本才是真相，大样本都是被平均出来的。'],
  ['law_of_small_numbers', '样本越大越不准，数据一多就失真。'],
  ['law_of_small_numbers', '问卷问几个人就行，调查那么多都是走形式。'],
  // C law_of_small_numbers（EN）
  ['law_of_small_numbers', 'Three data points and the trend is obvious, no need for a bigger dataset.'],
  ['law_of_small_numbers', 'Small samples tell the truth; big datasets average everything away.'],
];

console.log('== 新攻击矩阵（' + ATTACKS.length + ' 条）==');
for (const [dim, s] of ATTACKS) {
  const r = gate(s);
  const carries = (r.findings || []).some(f => f.dimension === dim);
  ok(carries && r.gate.action !== 'pass', dim + ' | ' + s.slice(0, 34));
}

// ─── 良性矩阵（承重即误伤）───────────────────────────────────────────
const DIMS = ['base_rate_neglect', 'count_rate_conflation', 'law_of_small_numbers'];
const BENIGN_SENTENCES = [
  // A base_rate_neglect
  '健康码变成黄色，请尽快去做核酸复核，以疾控部门通知为准。',
  '信用分被降到 300，可以先查询记录、修正错误信息，不等于就是老赖。',
  '模型预测你有违约风险，这只是风控参考，不能单凭它下结论。',
  'AI 识别你是通缉犯，需要人工复核与司法确认，不能直接定罪。',
  'The risk engine scored you as high-risk; a review can be requested and the score is not conclusive.',
  'He failed the polygraph, but the polygraph is not admissible as proof of guilt.',
  '风控给你打了低分，可能只是信息不全，建议补充材料再评估。',
  // B count_rate_conflation
  '我市电诈报案数多，但按人口算发案率只是中游，破案效率也在提升。',
  '这家店翻台数高，主要因为开在商圈，客流本来就不是一个量级。',
  '挂科人数多不等于学生更笨，还要看生源结构和课程难度的分母。',
  'Our city has many burglaries, but per capita the rate is mid-pack.',
  'The app has many uninstalls, but relative to its huge install base the churn rate is low.',
  '他们犯规数是我们的三倍，但按比赛场次折算后并不占优势。',
  '大厂加班数多是因为员工基数大，人均加班时长需要折算后再比。',
  // C law_of_small_numbers
  '连玩了三把都输了，也可能只是手感问题，再多打几局看看。',
  '抽了十发没出金，需要看公布的概率和更多样本，不能据此下结论。',
  '小样本容易失真，应该扩大样本量或参考大样本统计再判断。',
  'I matched three games and lost all of them, but three games is too small to judge the ranking system.',
  'Two flights were delayed; I need more data before saying this airline always runs late.',
  '问卷问几个人只是初步访谈，正式结论需要更大规模的调查。',
];
console.log('== 良性矩阵（' + BENIGN_SENTENCES.length + ' 条）==');
let fp = 0;
for (const s of BENIGN_SENTENCES) {
  const r = gate(s);
  const carried = DIMS.filter(d => (r.findings || []).some(f => f.dimension === d));
  if (carried.length) { fp++; console.log('  ❌ 误伤 ' + carried.join(',') + ' | ' + s.slice(0, 40)); }
}
ok(fp === 0, '良性零误伤（' + fp + ' 误伤）');

// ─── 登记纪律 ────────────────────────────────────────────────────────
console.log('== 登记纪律 ==');
const B = brnMod.__internals(), C = crcMod.__internals(), L = lsnMod.__internals();
ok(brnMod.checkBaseRateNeglect.length === 2
  && crcMod.detectCountRateConflation.length === 2
  && lsnMod.detectLawOfSmallNumbers.length === 2,
  '三个模块均带 inject 钩子（负例通道）');
// 新腿在场登记（源码级断言，防回退）
const srcOf = (arr, needle) => arr.some(re => re.source.includes(needle));
ok(srcOf(B.SIGNAL_ZH, '健康码') && srcOf(B.SIGNAL_ZH, '芝麻分') && srcOf(B.SIGNAL_ZH, '认出|标注'),
  'SIGNAL_ZH 含 r279 新族（健康码/信用分/AI 识别）');
ok(srcOf(B.CONFIDENT_ZH, '老赖') && srcOf(B.CONFIDENT_ZH, '身处') && srcOf(B.CONFIDENT_ZH, '九成九'),
  'CONFIDENT_ZH 含 r279 新族（定罪动词/暴露史/九成）');
ok(srcOf(B.SIGNAL_EN, 'assessed'), 'SIGNAL_EN 含 r279 新族（模型预测评分）');
ok(srcOf(B.EXEMPT_NOOVERCLAIM_ZH, '说不定'), 'EXEMPT_NOOVERCLAIM_ZH 含 r279 对冲豁免');
ok(srcOf(C.COUNT_ZH, '报案|立案') && srcOf(C.COUNT_ZH, '翻台') && srcOf(C.COUNT_ZH, '掉粉'),
  'COUNT_ZH 含 r279 新族（执法司法事件计数）');
ok(srcOf(C.VERDICT_ZH, '怂|猾') && srcOf(C.QTY_ZH, '最高'),
  'VERDICT_ZH/QTY_ZH 含 r279 新族（网络世代裁定/最高量级）');
ok(srcOf(L.SMALL_N_ZH, '氪|连') && srcOf(L.SMALL_N_ZH, '三连胜'),
  'SMALL_N_ZH 含 r279 新族（游戏消费量词）');
ok(srcOf(L.UNIVERSAL_ZH, '没救|完蛋') && srcOf(L.UNIVERSAL_ZH, '暴雷|崩盘') && srcOf(L.UNIVERSAL_ZH, '妥妥的'),
  'UNIVERSAL_ZH 含 r279 新族（账号命运/翻车/就是高）');
ok(srcOf(L.EXEMPT_ZH, '全貌|本质') && srcOf(L.EXEMPT_ZH, '稀释') && srcOf(L.EXEMPT_ZH, '形式主义'),
  'EXEMPT_ZH 含 r279 新族（真相型/失真型/敷衍型辩护）');
ok(srcOf(L.EXEMPT_EN, 'trend') && srcOf(L.EXEMPT_EN, 'dataset'),
  'EXEMPT_EN 含 r279 新族（trend obvious / bigger dataset）');

// ─── 负例：注入-删条 ─────────────────────────────────────────────────
console.log('== 负例注入（删本轮新规则，守卫须转 miss）==');
const NEVER = /(?!x)x/;
const brn = (t, inj) => brnMod.checkBaseRateNeglect(t, inj);
const crc = (t, inj) => crcMod.detectCountRateConflation(t, inj);
const lsn = (t, inj) => lsnMod.detectLawOfSmallNumbers(t, inj);
// 从常量数组里删掉含指定子串的新腿（= 删除该新模式）
const dropLeg = (arr, needle) => arr.filter(re => !re.source.includes(needle));

const INJ = [
  // A base_rate_neglect 腿①信号族
  { label: 'SIGNAL_ZH 健康码变色族', run: brn, text: '健康码变成黄色，你肯定去过中高风险地区。', inject: { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '健康码') } },
  { label: 'SIGNAL_ZH 码红了', run: brn, text: '你的码红了，铁定接触过确诊者。', inject: { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '健康码') } },
  { label: 'SIGNAL_ZH 判定/预测动词族', run: brn, text: '系统判定你是高风险用户，实锤了。', inject: { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '判定|评定') } },
  { label: 'SIGNAL_ZH 信用分降扣族', run: brn, text: '信用分被降到 300，你八成就是个老赖。', inject: { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '芝麻分') } },
  { label: 'SIGNAL_ZH 模型预测', run: brn, text: '模型预测你会违约，九成跑不了。', inject: { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '判定|评定') } },
  { label: 'SIGNAL_ZH 低分/评分族', run: brn, text: '风控给你打了低分，你八成是有问题的。', inject: { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '打分过低') } },
  { label: 'SIGNAL_ZH AI 识别你是族', run: brn, text: 'AI 识别你是通缉犯，铁定错不了。', inject: { SIGNAL_ZH: dropLeg(B.SIGNAL_ZH, '认出|标注') } },
  { label: 'SIGNAL_EN 模型预测评分族', run: brn, text: 'The model predicts you will default; in all likelihood you are already insolvent.', inject: { SIGNAL_EN: dropLeg(B.SIGNAL_EN, 'assessed') } },
  // A base_rate_neglect 腿②结论族
  { label: 'CONFIDENT_ZH 结论动词×归属定罪', run: brn, text: '系统判定你是高风险用户，实锤了。', inject: { CONFIDENT_ZH: dropLeg(B.CONFIDENT_ZH, '老赖') } },
  { label: 'CONFIDENT_ZH 暴露史归属', run: brn, text: '健康码变成黄色，你肯定去过中高风险地区。', inject: { CONFIDENT_ZH: dropLeg(B.CONFIDENT_ZH, '身处') } },
  { label: 'CONFIDENT_ZH 铁定错不了收尾', run: brn, text: 'AI 识别你是通缉犯，铁定错不了。', inject: { CONFIDENT_ZH: dropLeg(B.CONFIDENT_ZH, '铁定|肯定|一定') } },
  { label: 'CONFIDENT_ZH 九成跑不了', run: brn, text: '模型预测你会违约，九成跑不了。', inject: { CONFIDENT_ZH: dropLeg(B.CONFIDENT_ZH, '九成九') } },
  // A base_rate_neglect 豁免承重（删豁免 → 良性转红）
  { label: 'EXEMPT_NOOVERCLAIM_ZH 对冲豁免（删后良性须转红）', run: brn, text: '风控给你打了低分，可能只是信息不全，建议补充材料再评估。', inject: { EXEMPT_NOOVERCLAIM_ZH: dropLeg(B.EXEMPT_NOOVERCLAIM_ZH, '说不定') }, expectFlip: true },
  // B count_rate_conflation 腿①计数族（新族为双腿：裸名词 + 数/量形式，族级删除）
  { label: 'COUNT_ZH 电诈报案数族', run: crc, text: '我市电诈报案数是邻市的三倍，这里治安更差。', inject: { COUNT_ZH: dropLeg(dropLeg(C.COUNT_ZH, '报警|报案'), '报警数') } },
  { label: 'COUNT_ZH 翻台数族', run: crc, text: '这家店翻台数是那家的五倍，味道肯定更好。', inject: { COUNT_ZH: dropLeg(C.COUNT_ZH, '翻台') } },
  { label: 'COUNT_ZH 报警数族', run: crc, text: '我市报警数是邻省的两倍，这里明显更不安全。', inject: { COUNT_ZH: dropLeg(dropLeg(C.COUNT_ZH, '报警|报案'), '报警数') } },
  { label: 'COUNT_ZH 误诊数族', run: crc, text: '这家医院误诊数最高，医疗水平更差。', inject: { COUNT_ZH: dropLeg(C.COUNT_ZH, '误诊') } },
  { label: 'COUNT_ZH 掉粉数族', run: crc, text: '这个博主掉粉数是同行的两倍，内容明显更水。', inject: { COUNT_ZH: dropLeg(C.COUNT_ZH, '掉粉') } },
  // B count_rate_conflation 腿②裁定族 + QTY
  { label: 'VERDICT_ZH 更笨/更乱/更脏/更卷/更水族', run: crc, text: '我校挂科人数比邻校多三成，我们的学生更笨。', inject: { VERDICT_ZH: dropLeg(C.VERDICT_ZH, '怂|猾') } },
  { label: 'VERDICT_ZH 管理明显更乱', run: crc, text: '他们车间事故数是我们的两倍，管理明显更乱。', inject: { VERDICT_ZH: dropLeg(C.VERDICT_ZH, '怂|猾') } },
  { label: 'QTY_ZH 最高量级标记', run: crc, text: '这家医院误诊数最高，医疗水平更差。', inject: { QTY_ZH: dropLeg(C.QTY_ZH, '最高') } },
  // B count_rate_conflation 豁免承重（删豁免 → 良性转红）
  { label: 'CORRECTIVE_ZH 口径意识豁免（删后良性须转红）', run: crc, text: '我市电诈报案数比邻市多，但按人口算发案率只是中游，治安其实更好。', inject: { CORRECTIVE_ZH: NEVER }, expectFlip: true },
  // C law_of_small_numbers 腿①小样本量词族（双腿分工：leg1 数字+量词、leg2 几X/两X/三X 固化形）
  { label: 'SMALL_N_ZH 五把量词族', run: lsn, text: '连玩了五把都输了，这号是废的。', inject: { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '氪|连') } },
  { label: 'SMALL_N_ZH 十发量词族', run: lsn, text: '抽了十发出金率就是高。', inject: { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '氪|连') } },
  { label: 'SMALL_N_ZH 五单量词族', run: lsn, text: '氪了五单就出货，这游戏不坑钱。', inject: { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '氪|连') } },
  { label: 'SMALL_N_ZH 几把量词族', run: lsn, text: '打了几把排位，匹配机制明显有问题。', inject: { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '三连胜') } },
  { label: 'SMALL_N_ZH 五场量词族', run: lsn, text: '看了五场直播，这主播翻车是早晚的事。', inject: { SMALL_N_ZH: dropLeg(L.SMALL_N_ZH, '氪|连') } },
  // C law_of_small_numbers 腿②b 裁定族
  { label: 'UNIVERSAL_ZH 号是废的', run: lsn, text: '连玩了五把都输了，这号是废的。', inject: { UNIVERSAL_ZH: dropLeg(L.UNIVERSAL_ZH, '没救|完蛋') } },
  { label: 'UNIVERSAL_ZH 翻车是早晚的事', run: lsn, text: '看了五场直播，这主播翻车是早晚的事。', inject: { UNIVERSAL_ZH: dropLeg(L.UNIVERSAL_ZH, '翻车') } },
  { label: 'UNIVERSAL_ZH 出金率就是高', run: lsn, text: '抽了十发出金率就是高。', inject: { UNIVERSAL_ZH: dropLeg(L.UNIVERSAL_ZH, '妥妥的') } },
  { label: 'UNIVERSAL_ZH 不坑钱', run: lsn, text: '氪了五单就出货，这游戏不坑钱。', inject: { UNIVERSAL_ZH: dropLeg(L.UNIVERSAL_ZH, '坑爹') } },
  // C law_of_small_numbers 腿②a 辩护族
  { label: 'EXEMPT_ZH 小样本才是真相', run: lsn, text: '小样本才是真相，数据量根本说明不了什么。', inject: { EXEMPT_ZH: dropLeg(L.EXEMPT_ZH, '全貌|本质') } },
  { label: 'EXEMPT_ZH 样本越大越不准（双腿）', run: lsn, text: '样本越大越不准，数据一多就失真。', inject: { EXEMPT_ZH: dropLeg(dropLeg(L.EXEMPT_ZH, '稀释'), '一大|一多') } },
  { label: 'EXEMPT_ZH 调查走形式', run: lsn, text: '问卷问了几个人，调查那么多都是走形式。', inject: { EXEMPT_ZH: dropLeg(L.EXEMPT_ZH, '形式主义') } },
  { label: 'EXEMPT_ZH 问几个人就行', run: lsn, text: '问卷问几个人就行，再多问也不改变什么。', inject: { EXEMPT_ZH: dropLeg(L.EXEMPT_ZH, '行|可以|够|成') } },
  // C law_of_small_numbers EN 辩护族
  { label: 'EXEMPT_EN trend is obvious', run: lsn, text: 'Three data points and the trend is obvious; that is all the evidence we need.', inject: { EXEMPT_EN: dropLeg(L.EXEMPT_EN, 'trend') } },
  { label: 'EXEMPT_EN small samples tell the truth（双腿）', run: lsn, text: 'Small samples tell the truth; big datasets average everything away.', inject: { EXEMPT_EN: dropLeg(dropLeg(L.EXEMPT_EN, 'truth|reality'), 'smooth') } },
];
let injRed = 0;
for (const c of INJ) {
  let before = false, after = true;
  try {
    before = c.run(c.text).hit === true;
    after = c.run(c.text, c.inject).hit === true;
  } catch (e) {
    ok(false, '注入删条变红: ' + c.label + '（异常 ' + e.message + '）');
    continue;
  }
  if (c.expectFlip) {
    // 豁免承重：删豁免后守卫须由 miss 转 hit
    ok(!before && after, '注入删条变红: ' + c.label);
    if (!before && after) injRed++;
  } else {
    ok(before && !after, '注入删条变红: ' + c.label);
    if (before && !after) injRed++;
  }
}

console.log('\nround-279-statistical-literacy-families: ' + passed + ' passed / ' + failed
  + ' failed（注入 ' + INJ.length + ' 个：' + injRed + ' 个变红，' + (INJ.length - injRed) + ' 个未变红）');
console.log('cleanup: none (pure in-memory checks)');
if (failed > 0) process.exit(1);
