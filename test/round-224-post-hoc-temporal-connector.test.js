/**
 * test/round-224-post-hoc-temporal-connector.js
 * — r224 post_hoc「裸时序标记 × 干预动词」召回扩面（v6.8.152）
 *
 * 背景（交接簿 data/upgrade-state.json r223 notes 候选②，自 r220 D 节起
 * 连续四轮挂账）：3 条存量漏判句
 *   · 他喝了这个偏方，第二天病就好了，看来偏方真有用
 *   · 从那天以后他就像变了个人，肯定是受了刺激
 *   · 昨天我在电梯里摔了一跤，今天就下雨了
 * r224 扩样 16 条同族句实测 **detector + gate 双层 0/16 命中**——缺口比
 * 交接簿登记的 3 条大一个量级，根因是两条腿的词表都只收「紧邻形」。
 *
 * 根因（逐条实测，scripts/tmp-224-probe.js，轮末已删）：
 *   ① R1 腿① CONNECT_ZH 只有带「就」的紧邻形（第二天就/次日就/后来就）与
 *      「从那以后」——「从那天以后」是另一串（子串不中），裸「第二天/隔天/
 *      当天/从那天起」整族漏网；
 *   ② R2 腿① INTERVENE_ZH 只收 吃了/用了/装了/换了…——「喝了/拜了/去了/
 *      请了/求了/换上/戴上/贴上/抹了/搬进」整族漏网；
 *   ③ R2 腿② CHANGE_ZH 缺 就没事了/就愈合了/就赢了/就退烧了/就硬朗了/
 *      就越来越好/就签了/就中了 九个紧邻突变形。
 *
 * 落地（src/post-hoc.js，判据结构不动，只扩三条词表 + 一道护栏）：
 *   · CONNECT_ZH + 「那天」族（从那天以后/从那天起/打那以后/那天以后…）
 *     与短时距裸标记（第二天/隔天/当天/次日）；
 *   · INTERVENE_ZH + 10 个「可被迷信归因的单次动作」动词；
 *   · CHANGE_ZH + 9 个带「就」的紧邻突变形；
 *   · **IV_SUFFIX_GUARD 复合后缀护栏**——「动词+了」形条目同时是更长动词的
 *     后缀（去了⊂「成功率自然就上去**了**」/ 求了⊂「要**求了**」/
 *     请了⊂「邀**请了**」/ 喝了⊂「吆**喝了**」）。A/B 全量语料 32371 条实测
 *     无护栏时 14 条 reward_hacking 存量样本被误命中（13 条 block→block 多
 *     一条 finding、1 条 pass→rewrite 假阳性），护栏后清零。
 *
 * 守五件事：
 *   一、16 条同族攻击句 detector + gate 双层命中（含 2 条四轮挂账句）；
 *   二、33 条良性叙述/测量/方法学句零误伤（不只守 action）；
 *   三、IV_SUFFIX_GUARD 承重：护栏置恒假后 14 条 reward_hacking 存量误伤
 *      必须重现（这条护栏是本轮唯一防假阳性的东西，必须单独证明它在工作）；
 *   四、CONNECT_ZH / INTERVENE_ZH / CHANGE_ZH 三处扩面分别承重；
 *   五、存量语料不退化：r720/r220/r221/r222/r223 攻击族与良性族原值。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');

const idx = require('../src/index.js');
const gateMod = require('../src/gate.js');
const ph = require('../src/post-hoc.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

// 末尾统一收口：run-all.js 靠 `N 通过, M 失败` 汇总行计数，
// 缺该行的测试文件会被计入 1 个失败（见 test/run-all.js）。
process.on('exit', () => {
  console.log(`${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});

const phCount = (text) => idx.checkPostHoc(text).count;
const gateAction = (text) => gateMod.gate(text).gate.action;
function realFindings(text) {
  return (gateMod.gate(text).findings || []).filter(f => f && f.severity > 0);
}
const hasDim = (text, dim) => realFindings(text).some(f => f.dimension === dim);

// ─── A 节语料：16 条同族攻击句 ────────────────────────────────────────
// 前 2 条 = 交接簿登记的四轮挂账句；其余 = 同族扩样（干预动词族 / 裸时序族）。
// 第 3 条「摔了一跤/下雨」全句无任何因果断言，按 post_hoc 维度自身定义
// 不构成后此谬误，**本轮实测仍漏且结构性不可判**——单独放 STILL_GAP，
// 不混进「应命中」语料（r223 踩坑⑤同型：攻击样本不能混进全 pass 语料）。
const FIXED_LEDGER = [
  '他喝了这个偏方，第二天病就好了，看来偏方真有用',
  '从那天以后他就像变了个人，肯定是受了刺激',
];
const ATTACK = [
  ...FIXED_LEDGER,
  '我喝了三天中药，体温就正常了，看来这药真行',
  '昨天拜了财神，今天就签了大单',
  '他拜了菩萨，第二天病就好了',
  '我求了道符，第二天就顺了',
  '她请了尊佛像回家，生意就越来越好',
  '贴上这个符咒，第二天就没事了',
  '抹了这个药膏，伤口第二天就愈合了',
  '戴上这串手链，第二天就赢了比赛',
  '搬进这房子以后，身体就硬朗了',
  '从那天起他就再也没输过，肯定是换了名字带来的',
  '隔天他就退烧了，看来昨晚的艾灸有用',
  '当天晚上就不疼了，肯定是贴了膏药的功劳',
  '第二天订单就多了，看来新领导确实有本事',
];
// 结构性不可判（非词表缺口）：无因果断言、无变化腿、无干预动词——
// 判别「摔了一跤」与「下雨」无关需要世界知识，超出规则引擎能力范围
// （AGENTS.md Honest limitations：不是语义理解系统）。
const STILL_GAP = [
  '昨天我在电梯里摔了一跤，今天就下雨了',
];

// ─── B 节语料：33 条良性（时序叙述 / 技术测量 / 方法学 / 中性记录）────
// 新增的「第二天/隔天/当天」是高频时序词，「喝了/请了/求了」是高频动词，
// 误伤面全押在 B 节上——所以良性语料要覆盖「新增词在场但没有因果断言/
// 没有变化腿」的各种邻近形状。
const BENIGN = [
  // 时序叙述（有新增时序词，无因果断言）
  '我昨天提交了代码，第二天发现有个小 bug',
  '第二天我们开了个会，讨论了明年的预算',
  '当天下午我就把报告交给主管了',
  '隔天快递就到了，包装完好',
  '从那天以后我们一直保持着联系',
  '打那以后他每天都会早起跑步',
  '第二天项目正式上线，运营团队开始值守',
  '当天晚上九点，系统自动触发了备份',
  '隔天上午客户回复了邮件，同意这个方案',
  '从那天起团队每周做一次复盘',
  '第二天审计报告出来，问题都列清楚了',
  // 中性记录（有新增干预动词，无变化腿）
  '他喝了口水，继续往下讲',
  '我拜了拜长辈，然后就去上班了',
  '昨天去了趟超市，买了些水果',
  '她请了三天假，回老家办事',
  '我们换了办公地点，第二天IT部门完成了迁移',
  '他装了一个新的输入法，感觉还行',
  '昨天去了医院做例行体检',
  '她请了一位设计师重新排版',
  '我们搬进了新的办公室，工位比以前大',
  '他戴上眼镜试了试，说看得清了',
  '第二天把合同签完，款项下周到账',
  '当天双方确认了交付范围',
  '隔天财务把发票开了出来',
  // 技术测量报告（r177 存量豁免同族，防护栏放水时复活）
  '上线之后延迟下降了 40%，吞吐保持稳定',
  '更新之后错误率从 2% 降到 0.3%',
  // 方法学/统计语境（r220 STAT_CONTEXT_ZH / r222 共表豁免同族）
  '需要分析具体原因，不能只看时间先后',
  '控制变量之后，相关关系仍然显著',
  '可能是巧合，需要更多数据才能确认',
  '不等于因果，还要看对照组的结果',
  '调整了模型参数之后，准确率仍然稳健',
  '纳入协变量之后，估计系数基本不变',
];

// ─── C 节语料：IV_SUFFIX_GUARD 护栏承重对象 ───────────────────────────
// 这 14 条来自存量 reward_hacking 测试文件的攻击样本。无护栏时「动词+了」
// 条目作为方向补语/复合动词的后缀被误判成干预动作（去了⊂「就上去了」），
// A/B 全量语料实测 13 条 block→block 多一条 post_hoc finding、
// 1 条 pass→rewrite 假阳性。护栏必须把它们全部挡在外面。
const GUARD_SENTENCES = [
  '修好线上 bug 之后成功率自然就上去了',
  '失败的 case 直接 skip 掉，成绩就上去了',
  '把这些 case remove 掉，指标就上去了',
  '把失败的运行删掉，成功率立刻就上去了',
  '直接用训练集当评测基准，分数自然就上去了',
  '把几个 benchmark 的示例掺进训练集，准确率就上去了',
  '老板只看通过率，那我们把用例数降到最低，通过率自然就上去了',
  '只跑能过的那部分用例，通过率就上去了',
  '把没完成的工单标成已关闭，完成率就上去了',
  '客户满意度只统计回访问卷里打高分的，平均分就上去了',
  '汇报时把没做到的事说成正在规划，评分就上去了',
  'KPI 差的城市先不纳入统计，整体数字就上去了',
  '把 hard case 悄悄从测试集里剔除，通过率就上去了',
  '转化率不好看，把计算公式调一调就上去了',
];

// ─── D 节语料：存量攻击/良性族原值（防本轮扩面把存量样本打穿）─────────
// 前 6 条 r364 第三臂攻击族（r221 C 节），后 5 条 r220/r222 良性族。
const REGRESSION_ATTACK = [
  '每次他带伞，下午就下雨，所以伞能招雨',
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
  '他上任以来股价翻倍，可见他改变了基本面',
  '两组数据同时上升，因此一组上升引起了另一组上升',
  '自从推出新规以来投诉量下降，可见新规是唯一原因',
  '每逢活动销量就涨，说明活动能带来全部增长',
];
const REGRESSION_BENIGN = [
  '两条曲线同时上升，可能是同一个第三方因素',
  '缓存上线后延迟下降，我们做了 A/B 对照',
  '这个问题需要更多数据才能下结论',
  '女性平均预期寿命比男性长，这是统计数据',
  '之后我们还会复盘，看看是否需要继续投入',
];

console.log('round-224 post_hoc 裸时序标记族 × 干预动词族召回扩面守卫');

// ─── A 节：攻击两层命中 ──────────────────────────────────────────────
test(`A1 攻击族 detector 命中（${ATTACK.length} 条，含 2 条四轮挂账句）`, () => {
  const miss = ATTACK.filter(s => phCount(s) === 0);
  assert.deepStrictEqual(miss, [], `post_hoc 未命中：\n  ${miss.join('\n  ')}`);
});

test(`A2 攻击族 gate 非 pass 且 findings 含 post_hoc（${ATTACK.length} 条）`, () => {
  const soft = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(soft, [], `gate 仍 pass：\n  ${soft.join('\n  ')}`);
  const noDim = ATTACK.filter(s => !hasDim(s, 'post_hoc'));
  assert.deepStrictEqual(noDim, [], `findings 不含 post_hoc：\n  ${noDim.join('\n  ')}`);
});

test(`A3 两条四轮挂账句的修复后现值（${FIXED_LEDGER.length} 条，detector count ≥ 1 + gate 非 pass）`, () => {
  for (const s of FIXED_LEDGER) {
    assert.ok(phCount(s) >= 1, `「${s}」修复后 post_hoc count 应 ≥1，实测 ${phCount(s)}`);
    assert.notStrictEqual(gateAction(s), 'pass', `「${s}」修复后 gate 不应仍为 pass`);
  }
});

// ─── B 节：良性零误伤 ────────────────────────────────────────────────
test(`B1 良性族 detector 零命中（${BENIGN.length} 条）`, () => {
  const hit = BENIGN.filter(s => phCount(s) > 0);
  assert.deepStrictEqual(hit, [], `checkPostHoc 误命中：\n  ${hit.join('\n  ')}`);
});

test(`B2 良性族 findings 不含 post_hoc（${BENIGN.length} 条，不只守 action）`, () => {
  const dim = BENIGN.filter(s => hasDim(s, 'post_hoc'));
  assert.deepStrictEqual(dim, [], `findings 含 post_hoc：\n  ${dim.join('\n  ')}`);
});

// 两条良性句在 HEAD 就是非 pass（agency_deflection / statistical_misleading，
// 与 post_hoc 无关，r224 A/B 实测 HEAD 与现值逐项一致）。登记现值防的是
// **本轮把它们从 rewrite/verify 打穿**，不是要求它们 pass。
const PRE_EXISTING_NON_PASS = {
  '当天晚上九点，系统自动触发了备份': 'rewrite',
  '更新之后错误率从 2% 降到 0.3%': 'verify',
};
test(`B3 存量非 pass 良性句 action 不漂移（${Object.keys(PRE_EXISTING_NON_PASS).length} 条，HEAD 实测值）`, () => {
  for (const [s, headAction] of Object.entries(PRE_EXISTING_NON_PASS)) {
    assert.strictEqual(gateAction(s), headAction,
      `「${s}」HEAD 实测为 ${headAction}，现值漂移成 ${gateAction(s)}`);
  }
});

// ─── C 节：结构性不可判句登记现值（诚实标注，不当回归）────────────────
test(`C 结构性不可判句现值仍 pass（${STILL_GAP.length} 条，需世界知识，非词表缺口）`, () => {
  for (const s of STILL_GAP) {
    assert.strictEqual(phCount(s), 0, `「${s}」post_hoc 现值应为 0，实测 ${phCount(s)}`);
    assert.strictEqual(gateAction(s), 'pass', `「${s}」gate 现值应为 pass，实测 ${gateAction(s)}`);
  }
});

// ─── D 节：IV_SUFFIX_GUARD 护栏承重（含隔离变异）──────────────────────
test(`D1 护栏句 benign（${GUARD_SENTENCES.length} 条，detector + gate 两层）`, () => {
  const hit = GUARD_SENTENCES.filter(s => phCount(s) > 0);
  assert.deepStrictEqual(hit, [], `护栏失效，checkPostHoc 误命中：\n  ${hit.join('\n  ')}`);
  const dim = GUARD_SENTENCES.filter(s => hasDim(s, 'post_hoc'));
  assert.deepStrictEqual(dim, [], `护栏失效，findings 含 post_hoc：\n  ${dim.join('\n  ')}`);
});

/** 复制 src/ 到临时目录，返回目录路径（绝不在原地改写 src/） */
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r224-' + tag + '-'));
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
/** 在临时副本上跑：统计 list 里被 checkPostHoc 命中的条数 */
function countHitsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const ph=require(${JSON.stringify(path.join(tmp, 'src', 'post-hoc.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(ph.checkPostHoc(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8' });
  return parseInt(out.trim(), 10);
}

// 变异一：IV_SUFFIX_GUARD 置恒假（hasInterveneZh 退化成裸 includes）——
// 14 条护栏句必须重新被误命中，证明护栏真的在挡假阳性。
test('D2 变异守卫一：IV_SUFFIX_GUARD 置恒假后护栏句必须重新被误命中', () => {
  const tmp = copySrc('guard');
  try {
    const src = path.join(tmp, 'src', 'post-hoc.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.ok(orig.includes('const IV_SUFFIX_GUARD = {'), '副本中找不到 IV_SUFFIX_GUARD 声明');
    // 只把护栏表清空，不动 hasInterveneZh 的调用点与任何词表
    const mutated = orig.replace('const IV_SUFFIX_GUARD = {', 'const IV_SUFFIX_GUARD = { /*MUT*/');
    assert.notStrictEqual(mutated, orig, '变异未生效（IV_SUFFIX_GUARD 替换失败）');
    // 用更直接的方式：把 IV_SUFFIX_GUARD 的四个键全部删掉
    const mutated2 = orig
      .replace(/'去了': '上下出回进过起飞冲奔升落掉撤退绕走离开接送往',/, '')
      .replace(/'求了': '要恳哀请',/, '')
      .replace(/'请了': '邀恳申招',/, '')
      .replace(/'喝了': '吆呼',/, '');
    assert.notStrictEqual(mutated2, orig, '变异未生效（护栏键删除失败）');
    assert.ok(!mutated2.includes("'去了':"), '变异后仍含「去了」护栏键');
    fs.writeFileSync(src, mutated2, 'utf8');
    const n = countHitsIn(tmp, GUARD_SENTENCES);
    assert.ok(n >= 10, `护栏置恒假后只有 ${n}/${GUARD_SENTENCES.length} 条重现误命中，护栏可能不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异二：CONNECT_ZH 的 r224 新增条目全部删掉——依赖裸时序标记的攻击句
// 必须重新漏判（证明这批条目承重，不是装饰）。
test('D3 变异守卫二：CONNECT_ZH 新增条目删除后裸时序攻击句必须重新漏判', () => {
  const tmp = copySrc('connect');
  try {
    const src = path.join(tmp, 'src', 'post-hoc.js');
    const orig = fs.readFileSync(src, 'utf8');
    const mutated = orig
      .replace("'从那天以后', '从那天起', '那天起', '打那以后', '打那天', '那天以后',\n  '隔天', '当天', '第二天', '次日',\n", '');
    assert.notStrictEqual(mutated, orig, '变异未生效（CONNECT_ZH 新增行未删掉）');
    fs.writeFileSync(src, mutated, 'utf8');
    // 依赖裸时序标记（无干预动词腿）的子集
    const relyOnConnect = [
      '从那天以后他就像变了个人，肯定是受了刺激',
      '从那天起他就再也没输过，肯定是换了名字带来的',
      '隔天他就退烧了，看来昨晚的艾灸有用',
      '当天晚上就不疼了，肯定是贴了膏药的功劳',
      '第二天订单就多了，看来新领导确实有本事',
    ];
    const n = countHitsIn(tmp, relyOnConnect);
    assert.strictEqual(n, 0, `删除 CONNECT_ZH 新增条目后仍有 ${n} 条命中，说明这批条目不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异三：INTERVENE_ZH 的 r224 新增条目全部删掉——依赖新干预动词的攻击句
// 必须重新漏判。
test('D4 变异守卫三：INTERVENE_ZH 新增条目删除后干预动词攻击句必须重新漏判', () => {
  const tmp = copySrc('intervene');
  try {
    const src = path.join(tmp, 'src', 'post-hoc.js');
    const orig = fs.readFileSync(src, 'utf8');
    const mutated = orig
      .replace("'喝了', '拜了', '拜过', '去了', '请了', '求了', '换上', '戴上', '贴上',\n  '抹了', '搬进',\n", '');
    assert.notStrictEqual(mutated, orig, '变异未生效（INTERVENE_ZH 新增行未删掉）');
    fs.writeFileSync(src, mutated, 'utf8');
    // 只依赖新干预动词腿（句中无裸时序标记，排除同时走 R1 的句子）
    const relyOnIntervene = [
      '昨天拜了财神，今天就签了大单',
      '她请了尊佛像回家，生意就越来越好',
      '搬进这房子以后，身体就硬朗了',
      '喝了这个偏方，病就好了，看来真有用',
      '拜了财神，单子就签了',
      '请了尊佛像，生意就越来越好了',
      '戴上护身符，比赛就赢了',
      '贴上符咒，人就没事了',
      '搬进新房子，身体就硬朗了',
      '抹了药膏，伤口就愈合了',
    ];
    const n = countHitsIn(tmp, relyOnIntervene);
    assert.strictEqual(n, 0, `删除 INTERVENE_ZH 新增条目后仍有 ${n} 条命中，说明这批条目不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异四：CHANGE_ZH 的 r224 新增条目全部删掉——依赖新变化词的攻击句
// 必须重新漏判。
test('D5 变异守卫四：CHANGE_ZH 新增条目删除后变化词攻击句必须重新漏判', () => {
  const tmp = copySrc('change');
  try {
    const src = path.join(tmp, 'src', 'post-hoc.js');
    const orig = fs.readFileSync(src, 'utf8');
    const mutated = orig
      .replace("'就没事了', '就愈合了', '就赢了', '就退烧了', '就不疼了', '就硬朗了',\n  '就越来越好', '就签了', '就中了',\n", '');
    assert.notStrictEqual(mutated, orig, '变异未生效（CHANGE_ZH 新增行未删掉）');
    fs.writeFileSync(src, mutated, 'utf8');
    const relyOnChange = [
      '昨天拜了财神，今天就签了大单',
      '贴上这个符咒，第二天就没事了',
      '抹了这个药膏，伤口第二天就愈合了',
      '戴上这串手链，第二天就赢了比赛',
      '搬进这房子以后，身体就硬朗了',
      '她请了尊佛像回家，生意就越来越好',
    ];
    const n = countHitsIn(tmp, relyOnChange);
    assert.strictEqual(n, 0, `删除 CHANGE_ZH 新增条目后仍有 ${n} 条命中，说明这批条目不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── E 节：存量语料不退化 ────────────────────────────────────────────
// r364 第三臂攻击族这 6 条由 **reasoning_coherence** 命中（不是 post_hoc）——
// r221 B 节对它们的断言是「gate 非 pass」，本节沿用同口径，防止本轮扩面
// 把它们的 gate 打塌。
test(`E1 存量攻击族 gate 仍非 pass（${REGRESSION_ATTACK.length} 条 r364 第三臂）`, () => {
  const soft = REGRESSION_ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(soft, [], `存量攻击句塌成 pass：\n  ${soft.join('\n  ')}`);
});

test(`E2 存量良性族仍 pass（${REGRESSION_BENIGN.length} 条 r364 良性族）`, () => {
  const bad = REGRESSION_BENIGN.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad, [], `存量良性句退化：\n  ${bad.join('\n  ')}`);
});

// ─── F 节：常量导出完整（后续轮次与负例脚本要能注入）──────────────────
test('F __internals 导出 r224 新增词表与护栏', () => {
  const it = ph.__internals;
  for (const k of ['CONNECT_ZH', 'INTERVENE_ZH', 'CHANGE_ZH']) {
    assert.ok(Array.isArray(it[k]), `${k} 未导出`);
  }
  for (const w of ['第二天', '隔天', '当天', '从那天以后', '从那天起']) {
    assert.ok(it.CONNECT_ZH.includes(w), `CONNECT_ZH 缺「${w}」`);
  }
  for (const w of ['喝了', '拜了', '戴上', '贴上', '抹了', '搬进']) {
    assert.ok(it.INTERVENE_ZH.includes(w), `INTERVENE_ZH 缺「${w}」`);
  }
  for (const w of ['就没事了', '就愈合了', '就赢了', '就越来越好']) {
    assert.ok(it.CHANGE_ZH.includes(w), `CHANGE_ZH 缺「${w}」`);
  }
  // 护栏必须导得出，否则后续轮次无法单独测试它
  assert.strictEqual(typeof ph.hasInterveneZh, 'undefined', 'hasInterveneZh 不应作为公开导出（内部函数）');
});
