/**
 * test/round-184-absence-of-problems.js — 第 182 维度
 * absence_of_problems（未检出≠不存在：把有限检验的阴性结果当作完备证明
 * ——「测试没报错，所以代码肯定没问题」）负例注入测试 + 变体矩阵。
 *
 * 守两件事：
 *   一、正向：攻击样本全部命中、良性样本全部放行（无注入态）。
 *   二、承重：逐常量（21 个可注入常量）注入 /(?!)/ 置空后，依赖该常量的
 *      攻击必须停止命中；依赖某豁免的「陷阱样本」（两腿结构俱在但被正确
 *      豁免）在抹掉该豁免后必须转为命中。
 *
 * r184 实现设计（已固化进测试与源码注释）：
 *   · **检验动词设为可选前缀**：r184 首跑把「有检验动词」单列一个常量，
 *     实测证明它是「裸阴性结果」常量的严格子集（本族否定→检出段 gap 更
 *     宽），负例注入永远无法承重，属死常量——合并为单一 CHECK_ZH_A_RE。
 *     工程汇报里动词省略是常态（「没发现问题」「三年没出过事故」），可选
 *     前缀同时保住了这两类攻击形。
 *   · **自足投诉类不得要求后接问题名词**：投诉/举报/抱怨/质疑/反对/反映/
 *     异议本身即问题名词。「回访没收到投诉，说明政策没有问题」的「投诉」
 *     后紧跟逗号，强制后置名词会整句漏判（r184 首跑实测 5 漏之一）。
 *   · **英文过去时态必须显式收**：`\bscans?\b` 匹配不到 "scanned"（scan
 *     后紧跟 ned、词边界失败）——「We scanned and found no vulnerabilities,
 *     therefore the system is secure.」整句漏判即因此。
 *   · **SEAL 结论族限定为「无问题/安全/可靠/放心」家族**：「成立/为真/
 *     有效」只在确定性副词在场时由 SEAL_ZH_B 收，避免误伤「数据说明理论
 *     成立」这类合法科学陈述（r184 误拦纪律）。
 *   · **SCOPE / HEDGE 是跨度豁免**（腿①句首 → 腿②句尾），META /
 *     NEGFLIP / EXHAUSTIVE 是整篇豁免——两类豁免表刻意不交叠，交叠会让
 *     对方的注入样本假绿（r182 教训 4 / r183 教训 3 同款）。
 *
 * 161 轮教训：负例全绿不等于不漏——裸名词/带修饰/倒装/长句变体与边缘良性
 * 另在 variant-matrix 段用真实 gate() 复量。
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { checkAbsenceOfProblems, __internals } = require('../src/absence-of-problems.js');
const gateMod = require('../src/gate.js');
const gate = gateMod.gate;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ─── 一、攻击样本（无注入必须命中）────────────────────────────────

const ATTACK = [
  // CN-A 阴性结果形（检验动词在场）
  '测试全跑过了没报错，所以代码肯定没问题。',
  '扫了一遍没发现漏洞，说明系统是安全的。',
  '审查了一圈没找到问题，证明方案是可行的。',
  '尽调没查出任何问题，这家公司完全可以放心投资。',
  '走访了几个村没收到投诉，说明政策落地没有问题。',
  '问卷没收到负面反馈，证明新功能完全成功。',
  '抽样检查没有发现缺陷，产品百分之百合格。',
  // CN-A 阴性结果形（无检验动词——裸阴性/省略形）
  '没人投诉，说明产品体验没问题。',
  '三年没出过事故，这座桥梁绝对安全。',
  // CN-B 通过形
  '回归测试全部通过，代码完全没有问题。',
  // CN-C 失败裸形
  '跑了一遍回归没出错，这个版本绝对没问题。',
  '压测跑了两轮没崩溃，这套架构绝对靠得住。',
  // 长句 / 带修饰 / 跨逗号结论
  '我们对全部接口逐条做了安全审查，没有从中查出任何的漏洞，所以这个服务是可以放心上线的。',
  // EN
  'The tests did not fail, so the code must be correct.',
  'We scanned and found no vulnerabilities, therefore the system is secure.',
  'No bugs were reported during the audit, so the release is completely safe.',
  'The regression suite came back clean, so the build is safe.',
  'No issues were detected in the review, hence the design is sound.',
];

t('攻击样本全部命中（' + ATTACK.length + ' 条）', () => {
  for (const s of ATTACK) {
    const r = checkAbsenceOfProblems(s);
    assert.ok(r.hit, '未命中: ' + s + ' → ' + r.details);
    assert.ok(r.score >= 75, '分数应 ≥75: ' + s + ' → ' + r.score);
  }
});

t('多处共现计分升至 90', () => {
  const r = checkAbsenceOfProblems('扫描没发现漏洞，说明系统是安全的。测试也没报错，所以代码肯定没问题。');
  assert.ok(r.hit && r.score === 90 && r.count === 2, 'score=' + r.score + ' count=' + r.count);
});

// ─── 二、良性样本（无注入必须放行）────────────────────────────────

const BENIGN = [
  // 范围限定（SCP）
  '在已覆盖的用例范围内，回归测试没有发现问题。',
  '在已覆盖的用例范围内，测试没有发现问题，所以这个模块是没问题的。',
  // 拒绝推断（NEGFLIP）
  '扫描未发现已知漏洞，但这不代表系统没有未知漏洞。',
  '测试通过只能说明已写用例通过，不能证明代码没有问题。',
  '扫描没发现漏洞，所以没发现问题不等于系统没有问题。',
  // 对冲（HEDGE）
  '可能是测试覆盖不足，仍有未检出的缺陷。',
  '扫描没发现漏洞，可能还有未覆盖的路径，说明系统也许是安全的。',
  // 构造上完备的检验（EXHAUSTIVE）
  '数学上已穷举验证了所有输入空间，程序确实是正确的。',
  '这个版本经过形式化验证，所有不变量均已证明成立。',
  // 概念/教学转述（META）
  '测试覆盖率只有60%，很多路径还没跑到。',
  '这节课讲测试覆盖率，讲的就是未检出与不存在的区别。',
  // 无腿②（工程正常收尾）
  '代码审查通过，可以进入下一阶段。',
  '回归测试全部通过，可以合并到主干分支了。',
  '这次审查没有发现问题，后续还要持续监控。',
  '审计没发现问题，我们先把已知项修掉，未覆盖部分下轮补测。',
  // 疑问句
  '没人投诉就等于产品没问题吗？这显然是逻辑错误。',
  // EN
  'Passing tests do not prove the code is correct.',
  'The scan may still have missed zero-day vulnerabilities.',
  'No failures were found within the tested scope, but untested paths remain a risk.',
];

t('良性样本全部放行（' + BENIGN.length + ' 条）', () => {
  for (const s of BENIGN) {
    const r = checkAbsenceOfProblems(s);
    assert.ok(!r.hit, '误伤: ' + s + ' → ' + r.details);
  }
});

// ─── 三、常量负例注入（每个常量必须承重）──────────────────────────
// 每项：{ key, attack: 注入后必须停止命中的样本,
//         trap: 豁免陷阱（注入后必须转为命中） }

const INJECTIONS = [
  { key: 'CHECK_ZH_A_RE', attack: '扫了一遍没发现漏洞，说明系统是安全的。' },
  { key: 'CHECK_ZH_C_RE', attack: '回归测试全部通过，代码完全没有问题。' },
  { key: 'CHECK_ZH_D_RE', attack: '跑了一遍回归没出错，这个版本绝对没问题。' },
  { key: 'CHECK_EN_A_RE', attack: 'We scanned and found no vulnerabilities, therefore the system is secure.' },
  { key: 'CHECK_EN_B_RE', attack: 'No bugs were reported during the audit, so the release is completely safe.' },
  { key: 'CHECK_EN_C_RE', attack: 'All regression tests are green, so the build is safe.' },
  { key: 'SEAL_ZH_A_RE', attack: '扫了一遍没发现漏洞，说明系统是安全的。' },
  { key: 'SEAL_ZH_B_RE', attack: '问卷没收到负面反馈，证明新功能完全成功。' },
  { key: 'SEAL_ZH_C_RE', attack: '三年没出过事故，这座桥梁绝对安全。' },
  { key: 'SEAL_EN_A_RE', attack: 'We scanned and found no vulnerabilities, therefore the system is secure.' },
  { key: 'SEAL_EN_B_RE', attack: 'The tests did not fail, so the code must be correct.' },
  { key: 'SCOPE_ZH_RE', trap: '在已覆盖的用例范围内，测试没有发现问题，所以这个模块是没问题的。' },
  { key: 'SCOPE_EN_RE', trap: 'No failures were found within the tested scope, so the module is fine.' },
  { key: 'HEDGE_ZH_RE', trap: '扫描没发现漏洞，可能还有未覆盖的路径，说明系统也许是安全的。' },
  { key: 'HEDGE_EN_RE', trap: 'The scan may have missed something, and no issues were found, so the system is secure.' },
  { key: 'NEGFLIP_ZH_RE', trap: '扫描没发现漏洞，所以没发现问题不等于系统没有问题。' },
  { key: 'NEGFLIP_EN_RE', trap: 'The tests passed, so the code is correct; that does not mean it has no problems.' },
  { key: 'META_ZH_RE', trap: '讲测试覆盖率的课上提到，扫描没发现漏洞，所以系统绝对安全，这是典型错误。' },
  { key: 'META_EN_RE', trap: 'A lecture on test coverage said: no vulnerabilities were found, so the system is secure.' },
  { key: 'EXHAUSTIVE_ZH_RE', trap: '已经穷举验证了所有输入空间，测试没有发现问题，所以程序是安全的。' },
  { key: 'EXHAUSTIVE_EN_RE', trap: 'We exhaustively verified all possible inputs, the tests found no problems, so the program is safe.' },
];

console.log('\n[r184 常量负例注入承重]');
t('可注入常量共 21 个（__internals 全部可变对象）', () => {
  assert.strictEqual(Object.keys(__internals).length, 21,
    '常量数 ' + Object.keys(__internals).length + ' != 21');
  for (const k of Object.keys(__internals)) {
    assert.ok(__internals[k] instanceof RegExp, k + ' 应为 RegExp');
  }
});

for (const item of INJECTIONS) {
  const key = item.key;
  if (item.attack) {
    t('置空 ' + key + ' 后停止命中', () => {
      assert.ok(checkAbsenceOfProblems(item.attack).hit, '注入前应命中');
      const saved = __internals[key];
      __internals[key] = /(?!)/; // 永不匹配 = 置空
      try {
        const r = checkAbsenceOfProblems(item.attack);
        assert.ok(!r.hit, '置空 ' + key + ' 后仍命中: ' + item.attack.slice(0, 30) + ' → ' + r.details);
      } finally { __internals[key] = saved; }
    });
  }
  if (item.trap) {
    t('豁免陷阱无注入时放行: ' + item.trap.slice(0, 14), () => {
      const r = checkAbsenceOfProblems(item.trap);
      assert.ok(!r.hit, '陷阱样本应被 ' + key + ' 豁免，实际命中: ' + r.details);
    });
    t('置空 ' + key + ' 后陷阱样本转为命中', () => {
      const saved = __internals[key];
      __internals[key] = /(?!)/;
      try {
        const r = checkAbsenceOfProblems(item.trap);
        assert.ok(r.hit, '置空 ' + key + ' 后陷阱样本应转为命中: ' + item.trap.slice(0, 30));
      } finally { __internals[key] = saved; }
    });
  }
}

// ─── 四、登记断言（src/index.js 九处接线）─────────────────────────

const idx = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');

t('src/index.js 九处接线齐全（require/计算/score/dimMap/guidance/VERIFY_DIMS/dimensions/summary/exports）', () => {
  assert.ok(/const \{ checkAbsenceOfProblems \} = require\('\.\/absence-of-problems\.js'\);/.test(idx),
    'require 缺失');
  assert.ok(/const aop = _applyPedagogyRelaxation\(checkAbsenceOfProblems\(_normText\), "absence_of_problems", pedagogyRelaxation\);/.test(idx),
    '计算点缺失');
  assert.ok(/\{score: aop\.score, name:'absence_of_problems'\}/.test(idx), 'allDims score 缺失');
  assert.ok(/\n\s*'absence_of_problems': "不得\*\*把有限检验的阴性结果当作完备证明\*\*/.test(idx),
    'DIM_GUIDANCE 缺 absence_of_problems 条文');
  // dimMap 与 dimensions 两处键注册（grep 计数 ≥2）
  assert.ok((idx.match(/absence_of_problems: aop,/g) || []).length >= 2,
    'dimMap/dimensions 两处键注册缺失');
  assert.ok(/aop\.count \? aop\.count \+ ' 处未检出即不存在' : ''/.test(idx), 'summary 登记缺失');
  assert.ok(/\n  checkAbsenceOfProblems,/.test(idx), 'exports 缺失');
});

t('VERIFY_DIMS 含 absence_of_problems（gate.action = verify）', () => {
  const m = idx.match(/const VERIFY_DIMS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(m, 'VERIFY_DIMS 未找到');
  assert.ok(/'absence_of_problems'/.test(m[1]), 'VERIFY_DIMS 缺 absence_of_problems');
});

t('BLOCK_DIMS / REWRITE_DIMS 均不含 absence_of_problems（本轮只登记 VERIFY）', () => {
  const b = idx.match(/const BLOCK_DIMS = new Set\(\[([\s\S]*?)\]\)/);
  const r = idx.match(/const REWRITE_DIMS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(b && r, 'BLOCK/REWRITE 集合未找到');
  assert.ok(!/'absence_of_problems'/.test(b[1]), 'BLOCK_DIMS 不应含本维度');
  assert.ok(!/'absence_of_problems'/.test(r[1]), 'REWRITE_DIMS 不应含本维度');
});

t('与 appeal_to_ignorance / scrutiny_evasion 边界写进 guidance', () => {
  const m = idx.match(/'absence_of_problems': "([\s\S]*?)",\n/);
  assert.ok(m, 'guidance 未找到');
  assert.ok(/appeal_to_ignorance（第62维）管\*\*举证责任分配\*\*/.test(m[1]),
    'guidance 缺 appeal_to_ignorance 边界');
  assert.ok(/scrutiny_evasion（第72维）管「\*\*检验这个动作不该发生\*\*」/.test(m[1]),
    'guidance 缺 scrutiny_evasion 边界');
});

// ─── 五、gate 层变体矩阵（161 轮教训：负例全绿之外的强制项）──────

(async () => {
  console.log('\n[r184 gate 层变体矩阵]');

  // 攻击变体：中英双语、裸名词、带修饰、倒装、长句、跨句
  const VARIANTS = [
    '测试全跑过了没报错，所以代码肯定没问题。',                                   // 裸名词+连接词
    '扫了一遍没发现漏洞，说明系统是安全的。',                                     // 带修饰
    '三年没出过事故，这座桥梁绝对安全。',                                         // 无检验动词（裸阴性）
    '我们对全部接口逐条做了安全审查，没有从中查出任何的漏洞，所以这个服务可以放心上线。', // 长句
    'The tests did not fail, so the code must be correct.',                       // EN-A
    'We scanned and found no vulnerabilities, therefore the system is secure.',   // EN 过去时
    'No bugs were reported during the audit, so the release is completely safe.', // EN-B
    '回归测试全部通过。代码完全没有问题。',                                       // 跨句（相邻句）
  ];
  for (const s of VARIANTS) {
    const r = await gate(s);
    t('变体命中: ' + s.slice(0, 16) + ' → ' + r.gate.action, () => {
      assert.notStrictEqual(r.gate.action, 'pass', '变体应被拦截: ' + s.slice(0, 30));
      const dims = (r.findings || []).map(f => f.dimension);
      assert.ok(dims.includes('absence_of_problems'),
        'findings 应含 absence_of_problems，实际: ' + dims.join(','));
    });
  }

  // 良性变体：必须含边缘良性（范围限定/拒绝推断/对冲/穷举/概念转述）
  const VARIANTS_BENIGN = [
    '在已覆盖的用例范围内，回归测试没有发现问题。',
    '扫描未发现已知漏洞，但这不代表系统没有未知漏洞。',
    '可能是测试覆盖不足，仍有未检出的缺陷。',
    '数学上已穷举验证了所有输入空间，程序确实是正确的。',
    '代码审查通过，可以进入下一阶段。',
    'Passing tests do not prove the code is correct.',
  ];
  for (const s of VARIANTS_BENIGN) {
    const r = await gate(s);
    t('良性放行: ' + s.slice(0, 16) + ' → ' + r.gate.action, () => {
      assert.strictEqual(r.gate.action, 'pass',
        '良性应放行: ' + s.slice(0, 30) + ' → ' + r.gate.action + ' / ' +
        (r.findings || []).map(f => f.dimension).join(','));
    });
  }

  // 边缘良性 × 存量维度共现：这两条在本模块级 0 命中（见第二节良性样本），
  // 但 gate 层被**存量维度**判 verify（genetic_fallacy + appeal_to_ignorance /
  // confidence）。r184 已用 git stash 回退 src/index.js 至 HEAD 实证：改动前
  // 这两条的行为完全一致（同 action、同维度），非本维度引入。故此处只断言
  // **本维度不误伤**（findings 不含 absence_of_problems），不替存量维度背书。
  const VARIANTS_EDGE = [
    '测试通过只能说明已写用例通过，不能证明代码没有问题。',
    'The scan may still have missed zero-day vulnerabilities.',
  ];
  for (const s of VARIANTS_EDGE) {
    const r = await gate(s);
    t('边缘良性本维度不误伤: ' + s.slice(0, 16) + ' → ' + r.gate.action, () => {
      const dims = (r.findings || []).map(f => f.dimension);
      assert.ok(!dims.includes('absence_of_problems'),
        '本维度不应出现在 findings: ' + s.slice(0, 30) + ' → ' + dims.join(','));
    });
  }

  t('gate guidance 可读取且含边界说明', async () => {
    const r = await gate('测试全跑过了没报错，所以代码肯定没问题。');
    const f = (r.findings || []).find(x => x.dimension === 'absence_of_problems');
    assert.ok(f && typeof f.guidance === 'string' && f.guidance.length > 200,
      'findings 应含本维度 guidance');
    assert.ok(/appeal_to_ignorance/.test(f.guidance), 'guidance 应含 appeal_to_ignorance 边界');
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
