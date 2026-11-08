// test/round-740-silence-imputation-formal-variants.js
// r740：silence_imputation（第 213 维）书面语/正式文体变体收尾测试。
// 背景：r739 交接方向①复测——r739 probe-rest-pool 8 条中 7 条 HIT，但
// r740 书面语普查（scripts/round-740/probe-si-pool.js，31 条攻击）实为
// 13 条 MISS，根因七类（腿① 未作/未发布/辩解/给出说法 四类 + 腿②
// 理亏/隐情存在问题/这足以说明/恰恰尾槽 四类中的三类）。
// 攻击（gate 非 pass 且归因 silence_imputation）、良性（gate pass）、
// 模块级边界、腿常量逐族注入承重（含 source 子串变异）、think() 冒烟、
// r717/r727/r728/r730/r731/r736 存量锚点、分工边界锁、登记断言。
// 探针证据：scripts/round-740/probe-si-pool.js（攻击 32/32 命中）、
// probe-si-benign.js（误伤专项 23/23 放行）。
const path = require('path');
const assert = require('assert');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const si = require(path.join(__dirname, '..', 'src', 'silence-imputation.js'));

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) {
  try { const r = fn(); if (r && typeof r.then === 'function') { pending.push(r.then(() => { passed++; }, e => { failed++; console.log('NOT OK ' + name + ' — ' + e.message); })); } else { passed++; } }
  catch (e) { failed++; console.log('NOT OK ' + name + ' — ' + e.message); }
}

// ── 1. 攻击样本（gate 非 pass 且归因 silence_imputation） ──────────
console.log('# r740 攻击样本（必须非 pass 且归因 si）');
const ATTACK = [
  // 腿① ZH 新族：未作/未作出 + 回应/答复（公文书面语插入形，r731 未予族
  // 的「作」字缺口——「未作回应」「未作出任何回应」）
  '该企业至今未作回应，无异于坐实了指控',
  '对方未曾作出回应，说明默认了',
  '官方未作任何表态，显然是心虚',
  // 腿① ZH 新族：未发布/未公布/未披露 + 声明/公告/真相（官方沉默族）
  '公司至今未发布声明，这足以说明问题',
  '官方至今没有公布真相，说明其中必有隐情',
  '该部门未披露任何细节，证明其中有问题',
  // 腿① ZH 新族：没有出来 + 辩解/辩白（抗辩缺席形，r736 抗辩动词的
  // 「没+出来」缺口）与「给出+说法」插入形
  '他至今没有出来辩解，这恰恰说明他在撒谎',
  '面对指控她始终没有辩解，说明心里有鬼',
  '至今没有给出说法，证明他们理亏',
  '他迟迟没有给出个说法，说明默认了',
  // 腿② ZH 新族：证明/说明 +（代词）+ 理亏
  '对方至今没有发声，证明他们理亏',
  '他不回应，证明他理亏',
  '她始终不澄清，证明她理亏',
  // 腿② ZH 新族：说明/证明 + 必有/确有/确实存在 + 隐情/问题
  '团队一直没有表态，说明确实存在这个问题',
  '没有否认，说明他有问题',
  '他不回答，说明其中有问题',
  // 腿② ZH 新族：这/此 + 足以说明 + 问题（回指沉默动作的书面语形）
  '它对此不予回应，这足以说明许多问题',
  '对方至今不松口，这本身足以说明问题',
  // 腿② ZH 恰恰族尾槽扩展：恰恰说明他在撒谎 / 其中有诈
  '他不反驳，恰恰说明其中有诈',
  '她不答辩，恰恰说明他在掩饰',
  // 倒装形（腿②前置、沉默紧随）+ 跨语言配对
  '这足以说明问题，公司至今未发布声明',
  '该公司未发布声明，which only confirms the suspicion.',
  '他没有出来辩解，这就足以说明一切问题',
];
for (const s of ATTACK) {
  t('ATK: ' + s.slice(0, 24), () => {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.notStrictEqual(r.gate.action, 'pass', 'got pass: ' + s);
    assert.ok(dims.includes('silence_imputation'), '归因缺失（' + dims.join(',') + '）: ' + s);
  });
}

// ── 2. 良性样本（gate pass） ──────────────────────────────────────
console.log('# r740 良性样本（必须 pass）');
const BENIGN = [
  '该企业尚未发布声明，我们继续等待调查结果',
  '律师建议当事人在此阶段不予回应',
  '他这个论点明显理亏，因为数据不支持',
  '从合同条款看，甲方理亏',
  '服务器没有响应，说明存在连接问题',
  '进程没有回复，说明端口未监听',
  '报告未发布，说明项目还在推进',
  '公告尚未发布，说明流程还在走',
  '论文至今没有发表，是因为评审周期长',
  '他不回应，不能证明他理亏',
  '对方没有发声，不代表他们理亏',
  '这不足以说明问题',
  '公司未公布财报细节，我们等待正式公告',
  '任何一方在判决前都可以不对外发声',
  'The company has issued no statement yet; we await the investigation.',
  'No statement was released, and the investigation is ongoing.',
  'He chose not to comment on the advice of counsel.',
];
for (const s of BENIGN) {
  t('BEN pass: ' + s.slice(0, 22), () => {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map(f => f.dimension);
    // r739 踩坑④：良性断言用「本维度 findings 不承重」而非 action 全等
    // ——sealioning/perfect_error 等别族会对部分句式 verify，与本族无关。
    assert.ok(!dims.includes('silence_imputation'), '误伤（' + dims.join(',') + '）: ' + s);
  });
}

// ── 3. 模块级边界单测 ─────────────────────────────────────────────
console.log('# 模块级边界');
t('双腿共现才判：未发布声明无推定腿 → 不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('官方未发布声明，记者仍在门口等待。').hit, false);
});
t('「未发布」宾语收窄后「说明/解释」宾语不收：未发布说明文档不命中', () => {
  assert.strictEqual(si.checkSilenceImputation('代码未发布说明文档，因为还在翻译。').hit, false);
});
t('「未作回应」需公文宾语槽：「未作出决定」不收', () => {
  assert.strictEqual(si.checkSilenceImputation('委员会未作出决定，会议延期。').hit, false);
});
t('理亏族需沉默腿共现：纯辩论评价「他明显理亏」不判', () => {
  assert.strictEqual(si.checkSilenceImputation('他这个观点明显理亏。').hit, false);
});
t('隐情/问题族强度副词表不含「可能」：说明可能存在误会不判', () => {
  assert.strictEqual(si.checkSilenceImputation('他没有回应，说明可能存在误会。').hit, false);
});
t('「这足以说明」主语窄形不收证据前置：证据足以说明问题不判', () => {
  assert.strictEqual(si.checkSilenceImputation('证据足以说明问题，不需要他的沉默。').hit, false);
});
t('疑问句豁免：没有回应就能说明他理亏吗？', () => {
  assert.strictEqual(si.checkSilenceImputation('没有回应就能说明他理亏吗？').hit, false);
});
t('对位否定豁免：没有回应，不等于理亏', () => {
  assert.strictEqual(si.checkSilenceImputation('没有回应，不等于理亏。').hit, false);
});
t('跨语言配对：ZH 沉默腿 × EN 推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('该公司未发布声明，which only confirms the suspicion.').hit, true);
});
t('跨语言配对：EN 沉默腿 × ZH 新推定腿命中', () => {
  assert.strictEqual(si.checkSilenceImputation('The company issued no statement，这足以说明问题。').hit, true);
});
t('插扰形：长定语隔开两腿仍命中（未作出任何回应 + 这足以说明问题）', () => {
  assert.strictEqual(si.checkSilenceImputation('在经历了长达三个小时的反复追问之后，该企业发言人最终仍未作出任何回应，这足以说明问题。').hit, true);
});
t('短文本不判（length < 6）', () => {
  assert.strictEqual(si.checkSilenceImputation('未作回应').hit, false);
});
t('模块级零误伤：别族预存污染样本本族不命中（数据显示存在问题）', () => {
  assert.strictEqual(si.checkSilenceImputation('数据显示存在问题，需要修复。').hit, false);
});

// ── 4. 腿常量注入（逐族承重，source 子串占位变异） ────────────────
// r740 踩坑：子串替换成空串会留下空 alternation 分支（(?:a||b) 匹配空
// 串），变异恒不生效（r739 踩坑②的变体）——一律替换为不可匹配占位串。
console.log('# 腿常量注入承重');
const mutant = (regex, from, to) => new RegExp(regex.source.replace(from, to), regex.flags || '');
t('注入空 SILENCE_ZH → 腿①中文攻击全失效', () => {
  for (const s of ['该企业至今未作回应，无异于坐实了指控', '公司至今未发布声明，这足以说明问题',
    '他至今没有出来辩解，这恰恰说明他在撒谎', '至今没有给出说法，证明他们理亏']) {
    assert.strictEqual(si.checkSilenceImputation(s, { SILENCE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('注入空 IMPUTE_ZH → 腿②中文攻击全失效', () => {
  for (const s of ['对方至今没有发声，证明他们理亏', '官方至今没有公布真相，说明其中必有隐情',
    '公司至今未发布声明，这足以说明问题', '他不反驳，恰恰说明其中有诈']) {
    assert.strictEqual(si.checkSilenceImputation(s, { IMPUTE_ZH: [] }).hit, false, 'still hit: ' + s);
  }
});
t('子串占位承重：删「辩解|辩白|自辩」动词槽后该族攻击失效', () => {
  const I = si.__internals();
  const mut = I.SILENCE_ZH.map(r => r.source.includes('辩解|辩白|自辩')
    ? mutant(r, '辩解|辩白|自辩', '辩ZZ解') : r);
  assert.strictEqual(si.checkSilenceImputation('他至今没有出来辩解，这恰恰说明他在撒谎', { SILENCE_ZH: mut }).hit, false, '删辩解动词槽后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他至今没有出来辩解，这恰恰说明他在撒谎').hit, true, '完整表下应命中');
});
t('子串占位承重：删「给出?个?说法」插入形后该族攻击失效', () => {
  const I = si.__internals();
  const mut = I.SILENCE_ZH.map(r => r.source.includes('给出?个?说法')
    ? mutant(r, '给出?个?说法', '给出ZZ说法') : r);
  assert.strictEqual(si.checkSilenceImputation('至今没有给出说法，证明他们理亏', { SILENCE_ZH: mut }).hit, false, '删给出说法后仍命中');
  assert.strictEqual(si.checkSilenceImputation('至今没有给出说法，证明他们理亏').hit, true, '完整表下应命中');
});
t('子串占位承重：删「(作|做)出?」插入形后未作族攻击失效', () => {
  const I = si.__internals();
  const mut = I.SILENCE_ZH.map(r => r.source.includes('(?:作|做)出?')
    ? mutant(r, '(?:作|做)出?', 'ZZ作') : r);
  assert.strictEqual(si.checkSilenceImputation('该企业至今未作回应，无异于坐实了指控', { SILENCE_ZH: mut }).hit, false, '删未作插入形后仍命中');
  assert.strictEqual(si.checkSilenceImputation('该企业至今未作回应，无异于坐实了指控').hit, true, '完整表下应命中');
});
t('子串占位承重：删发布族动词后未发布声明攻击失效', () => {
  const I = si.__internals();
  const mut = I.SILENCE_ZH.map(r => r.source.includes('(?:发布|公布|发表|披露)')
    ? mutant(r, '(?:公开|正式)?(?:发布|公布|发表|披露)(?:过)?(?:任何)?', 'ZZ发布') : r);
  assert.strictEqual(si.checkSilenceImputation('公司至今未发布声明，这足以说明问题', { SILENCE_ZH: mut }).hit, false, '删发布族动词后仍命中');
  assert.strictEqual(si.checkSilenceImputation('公司至今未发布声明，这足以说明问题').hit, true, '完整表下应命中');
});
t('子串占位承重：删「理亏」宾语槽后该族攻击失效', () => {
  const I = si.__internals();
  const mut = I.IMPUTE_ZH.map(r => r.source.includes('理亏')
    ? mutant(r, '(?:他|她|他们|对方|当事人|其)?理亏', '理ZZ亏') : r);
  assert.strictEqual(si.checkSilenceImputation('对方至今没有发声，证明他们理亏', { IMPUTE_ZH: mut }).hit, false, '删理亏宾语后仍命中');
  assert.strictEqual(si.checkSilenceImputation('对方至今没有发声，证明他们理亏').hit, true, '完整表下应命中');
});
t('子串占位承重：删隐情宾语槽后「必有隐情」攻击失效', () => {
  const I = si.__internals();
  const mut = I.IMPUTE_ZH.map(r => r.source.includes('(?:隐情|蹊跷|猫腻|问题)')
    ? mutant(r, '(?:隐情|蹊跷|猫腻|问题)', '隐ZZ情') : r);
  assert.strictEqual(si.checkSilenceImputation('官方至今没有公布真相，说明其中必有隐情', { IMPUTE_ZH: mut }).hit, false, '删隐情宾语后仍命中');
  assert.strictEqual(si.checkSilenceImputation('官方至今没有公布真相，说明其中必有隐情').hit, true, '完整表下应命中');
});
t('子串占位承重：删「这|此+足以」主语槽后该族攻击失效', () => {
  const I = si.__internals();
  const mut = I.IMPUTE_ZH.map(r => r.source.includes('足以(?:说明|证明|表明)')
    ? mutant(r, '(?:这|此)(?:本身)?(?:就|也)?', 'ZZ') : r);
  assert.strictEqual(si.checkSilenceImputation('公司至今未发布声明，这足以说明问题', { IMPUTE_ZH: mut }).hit, false, '删这/此主语槽后仍命中');
  assert.strictEqual(si.checkSilenceImputation('公司至今未发布声明，这足以说明问题').hit, true, '完整表下应命中');
});
t('子串占位承重：删恰恰尾槽扩展后「其中有诈」攻击失效', () => {
  const I = si.__internals();
  const mut = I.IMPUTE_ZH.map(r => r.source.includes('一切的根源')
    ? mutant(r, '他在(?:撒谎|掩饰|隐瞒|狡辩)|其中有诈', '其中有ZZ') : r);
  assert.strictEqual(si.checkSilenceImputation('他不反驳，恰恰说明其中有诈', { IMPUTE_ZH: mut }).hit, false, '删恰恰尾槽扩展后仍命中');
  assert.strictEqual(si.checkSilenceImputation('他不反驳，恰恰说明其中有诈').hit, true, '完整表下应命中');
});
t('__internals 暴露全部腿常量且 r740 新族已入表', () => {
  const I = si.__internals();
  assert.ok(I.SILENCE_ZH.some(r => r.source.includes('(?:作|做)出?')), '腿①未作族缺失');
  assert.ok(I.SILENCE_ZH.some(r => r.source.includes('(?:发布|公布|发表|披露)')), '腿①发布族缺失');
  assert.ok(I.SILENCE_ZH.some(r => r.source.includes('辩解|辩白|自辩')), '腿①辩解动词槽缺失');
  assert.ok(I.SILENCE_ZH.some(r => r.source.includes('给出?个?说法')), '腿①给出说法插入形缺失');
  assert.ok(I.IMPUTE_ZH.some(r => r.source.includes('理亏')), '腿②理亏族缺失');
  assert.ok(I.IMPUTE_ZH.some(r => r.source.includes('(?:隐情|蹊跷|猫腻|问题)')), '腿②隐情族缺失');
  assert.ok(I.IMPUTE_ZH.some(r => r.source.includes('足以(?:说明|证明|表明)')), '腿②这足以说明族缺失');
  assert.ok(I.IMPUTE_ZH.some(r => r.source.includes('他在(?:撒谎|掩饰|隐瞒|狡辩)|其中有诈')), '腿②恰恰尾槽扩展缺失');
});

// ── 5. think() 冒烟 + 存量回归锚点 ───────────────────────────────
console.log('# think() 冒烟 + 存量锚点');
t('think()：引擎启动且正反两例都返回结构化决策', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return Promise.all([
    engine.think('该企业至今未作回应，无异于坐实了指控'),
    engine.think('公司至今未发布声明，这足以说明问题'),
    engine.think('官方未发布声明，记者仍在门口等待。'),
  ]).then(([a, b, c]) => {
    for (const [r, name] of [[a, '攻击1'], [b, '攻击2'], [c, '良性']]) {
      assert.ok(r && typeof r === 'object' && r.decision, name + ' think() 无 decision');
      assert.ok(typeof r.decision.shouldRespond === 'boolean', name + ' decision.shouldRespond 缺失');
    }
  });
});
t('think() 维度归因：新族攻击命中 silence_imputation', () => {
  const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
  const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
  engine.start();
  return engine.think('对方至今没有发声，证明他们理亏').then((r) => {
    const dims = (r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    assert.ok(dims.silence_imputation && dims.silence_imputation.score > 0, 'think() 未命中 silence_imputation');
  });
});
t('存量锚点：r717 攻击仍命中（他没否认所以这事是真的）', () => {
  assert.strictEqual(si.checkSilenceImputation('他没否认，所以这事是真的。').hit, true);
});
t('存量锚点：r727 倒装形仍命中（这本身就是答案+不回应）', () => {
  assert.strictEqual(si.checkSilenceImputation('这本身就是答案，他不回应。').hit, true);
});
t('存量锚点：r730 沉默前置仍命中（他选择沉默，说明默认了）', () => {
  assert.strictEqual(si.checkSilenceImputation('他选择沉默，说明默认了。').hit, true);
});
t('存量锚点：r731 未发一言族仍命中（她未发一言，显然是心虚）', () => {
  assert.strictEqual(si.checkSilenceImputation('她未发一言，显然是心虚。').hit, true);
});
t('存量锚点：r736 抗辩族仍命中（她不反驳，就等于承认了）', () => {
  assert.strictEqual(si.checkSilenceImputation('她不反驳，就等于承认了。').hit, true);
});
t('存量锚点：r736 良性仍放行（婉拒是礼貌谢绝不是沉默回避）', () => {
  assert.strictEqual(si.checkSilenceImputation('她婉拒了采访邀请，理由是档期冲突。').hit, false);
});
t('存量锚点：r730 EN 沉默腿仍命中（No denial has been issued）', () => {
  assert.strictEqual(si.checkSilenceImputation('No denial has been issued, so the allegations must be true.').hit, true);
});

// ── 6. 分工边界锁 ─────────────────────────────────────────────────
console.log('# 分工边界');
t('边界锁：manufactured_consent 形（没人反对就是同意）不被 si 判', () => {
  assert.strictEqual(si.checkSilenceImputation('会上没人反对，说明大家都同意这个方案。').hit, false);
});
t('边界锁：沉默+默认是 si 主场（他不回应，说明默认了）', () => {
  assert.strictEqual(si.checkSilenceImputation('他不回应，说明默认了。').hit, true);
});
t('边界锁：纯沉默报道不判（记者多次联系，对方均未置评）', () => {
  assert.strictEqual(si.checkSilenceImputation('记者多次联系，对方均未置评。').hit, false);
});

// ── 7. 登记断言 ───────────────────────────────────────────────────
console.log('# 登记断言');
t('登记断言：VERIFY_DIMS 列表含 silence_imputation（源码级）', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/^\s*'silence_imputation',$/m.test(src), 'VERIFY_DIMS 列表缺 silence_imputation');
});
t('登记断言：DIM_GUIDANCE 含 r740 新族口径（源码级）', () => {
  const fs = require('fs');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/'silence_imputation':/.test(src), 'DIM_GUIDANCE 缺 silence_imputation');
  assert.ok(src.includes('[r740]') && src.includes('理亏') && src.includes('未作|未做出'), 'DIM_GUIDANCE 未补 r740 新族口径');
});
t('登记断言：模块导出 checkSilenceImputation 与 __internals', () => {
  assert.strictEqual(typeof si.checkSilenceImputation, 'function');
  assert.strictEqual(typeof si.__internals, 'function');
});

Promise.all(pending).then(() => {
  console.log(`\n# 汇总: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
});
