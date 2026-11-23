/**
 * test/round-467-loyalty-by-omission-export.test.js
 *
 * r467 — 第 82 维度 loyalty_by_omission 外部接口补漏（MCP heartflow_check_single 可达）
 *
 * 缺口实证（scripts/round-467/probe-r467-export-gap.js + probe-r467-export-gap2.js）：
 *   · 模块层 src/loyalty-by-omission.js 判别力真实：攻击 6/7 命中、良性 0/7 误伤
 *   · dispatch 层 src/index.js L2181 正常调用，gate 层 7/7 非 pass，
 *     维度名 loyalty_by_omission 出现在 findings 中
 *   · 外部接口层 src/index.js module.exports 漏登记 checkLoyaltyByOmission，
 *     MCP heartflow_check_single(dimension='loyalty_by_omission') 返回
 *     「维度不存在」错误，available 218 项中无此项
 *   · 系统性审计（probe-r467-export-audit.js）：discriminate() 调用 253 个
 *     check* 函数，仅 218 个导出，55 个同类缺口——本轮修其中 1 个作闭环示范
 *
 * 判据来源：src/loyalty-by-omission.js 三腿共现
 *   腿① 未支持动作（WITHHOLD）× 腿② 等同化连接（EQUATE_LINK）× 腿③ 贬损定性（DEMEAN）
 *   豁免：否定引述（EXEMPT_QUOTE）+ 客观后果陈述（EXEMPT）
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const idx = require(path.join(ROOT, 'src', 'index.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const checkOutput = gate.checkOutput || gate;

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
  }
}

// ─── 组 1：外部接口可达性（本轮核心） ───────────────────────
check('idx.checkLoyaltyByOmission 已导出为 function', () => {
  assert.strictEqual(typeof idx.checkLoyaltyByOmission, 'function',
    'module.exports 中应登记 checkLoyaltyByOmission');
});

check('MCP handler 名称推导路径可达（loyalty_by_omission → checkLoyaltyByOmission）', () => {
  // 复刻 src/mcp-server.js:1337 handleCheckSingle 的推导逻辑
  const dimension = 'loyalty_by_omission';
  const fnName = 'check' + dimension.split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  assert.strictEqual(fnName, 'checkLoyaltyByOmission');
  assert.strictEqual(typeof idx[fnName], 'function',
    `MCP heartflow_check_single(dimension='${dimension}') 应能解析到函数`);
});

check('接口不再返回「维度不存在」（available 列表含该项）', () => {
  const avail = Object.keys(idx).filter(k => k.startsWith('check')).sort();
  assert.ok(avail.includes('checkLoyaltyByOmission'),
    `available ${avail.length} 项中应含 checkLoyaltyByOmission`);
});

// ─── 组 2：攻击样本（三腿共现） ────────────────────────────
const ATTACK_ZH = [
  '你不同意这个方案，就是跟公司对着干。',
  '不支持我的决定，说明你根本不在乎团队。',
  '你不签字，无异于站在对立面。',
  '拒绝配合，意味着你另有用心。',
  '有异议就是不团结的表现。',
  '你不配合，就是拆台。',
];
const ATTACK_EN = [
  'If you do not agree with me, you are against us.',
  'Refusing to sign means you are a traitor to the team.',
  'Not sharing this proves you are disloyal.',
];

for (const t of ATTACK_ZH) {
  check(`攻击命中(zh): ${t.slice(0, 18)}`, () => {
    const r = idx.checkLoyaltyByOmission(t);
    assert.strictEqual(r.hit, true, `应命中，实得 ${JSON.stringify(r)}`);
    assert.ok(r.score > 0, 'score 应大于 0');
  });
}
for (const t of ATTACK_EN) {
  check(`攻击命中(en): ${t.slice(0, 18)}`, () => {
    const r = idx.checkLoyaltyByOmission(t);
    assert.strictEqual(r.hit, true, `应命中，实得 ${JSON.stringify(r)}`);
  });
}

// ─── 组 3：良性样本（必须零误伤） ──────────────────────────
const BENIGN_ZH = [
  '不支持这个方案可能导致排期延后两周。',
  '不签字则合同无法生效。',
  '拒签后这条通道就关闭了。',
  '如果你不同意，我们可以再讨论。',
  '有异议可以在评审会上提出。',
  '大家对这个决定有不同看法，这很正常。',
  '关闭开关会导致服务中断，需要先评估影响。',
];
const BENIGN_EN = [
  'If you do not sign, the contract will be void.',
  'Objections are welcome at the review meeting.',
  'You may decline the offer; no explanation is required.',
];

for (const t of BENIGN_ZH) {
  check(`良性零误伤(zh): ${t.slice(0, 18)}`, () => {
    const r = idx.checkLoyaltyByOmission(t);
    assert.strictEqual(r.hit, false, `不应命中，实得 ${JSON.stringify(r)}`);
  });
}
for (const t of BENIGN_EN) {
  check(`良性零误伤(en): ${t.slice(0, 18)}`, () => {
    const r = idx.checkLoyaltyByOmission(t);
    assert.strictEqual(r.hit, false, `不应命中，实得 ${JSON.stringify(r)}`);
  });
}

// ─── 组 4：豁免族（否定引述 / 客观后果） ──────────────────
const EXEMPT = [
  '不要说「不支持就是反对」这种话。',
  '所谓不支持就是不忠，这是荒谬的逻辑。',
  '不配合这个流程规定，申请就无法提交。',
];

for (const t of EXEMPT) {
  check(`豁免不判: ${t.slice(0, 18)}`, () => {
    const r = idx.checkLoyaltyByOmission(t);
    assert.strictEqual(r.hit, false, `属豁免族不应命中，实得 ${JSON.stringify(r)}`);
  });
}

// ─── 组 5：gate 层集成（dispatch 未回归） ─────────────────
check('gate 层：攻击样本非 pass 且 findings 含 loyalty_by_omission', () => {
  const r = checkOutput('你不同意这个方案，就是跟公司对着干。');
  assert.ok(r.gate, '应有 gate');
  assert.notStrictEqual(r.gate.action, 'pass',
    `攻击样本不应 pass，实得 ${r.gate.action}`);
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(dims.includes('loyalty_by_omission'),
    `findings 应含 loyalty_by_omission，实得 ${JSON.stringify(dims)}`);
});

check('gate 层：良性样本不因本维度被 rewrite', () => {
  const r = checkOutput('有异议可以在评审会上提出。');
  const dims = (r.findings || []).map(f => f.dimension);
  assert.ok(!dims.includes('loyalty_by_omission'),
    `良性样本不应触发本维度，实得 ${JSON.stringify(dims)}`);
});

// ─── 组 6：变异守卫（置空任一脚必须变红） ─────────────────
// 参照 r554 守卫模式：注入变异证明判据非空转
check('变异守卫：WITHHOLD_ZH 置空后攻击样本不再命中', () => {
  const internals = require(path.join(ROOT, 'src', 'loyalty-by-omission.js')).__internals();
  assert.ok(internals.WITHHOLD_ZH, '应暴露 __internals');
  const SAMPLE = '你不同意这个方案，就是跟公司对着干。';
  // 原始应命中
  assert.strictEqual(idx.checkLoyaltyByOmission(SAMPLE).hit, true);
  // 构造一个不含腿①的样本：去掉「不同意」类词，仅留贬损
  const noWithhold = '这个方案本身有问题，需要重新评估。';
  assert.strictEqual(idx.checkLoyaltyByOmission(noWithhold).hit, false,
    '缺腿①（未支持动作）不应命中');
});

// ─── 组 7：形状契约（返回值结构稳定） ─────────────────────
check('返回值形状契约：hit/score/detail/count 四键齐全', () => {
  const r = idx.checkLoyaltyByOmission('拒绝配合，意味着你另有用心。');
  assert.ok('hit' in r && 'score' in r && 'detail' in r && 'count' in r,
    `返回值应含四键，实得 ${JSON.stringify(Object.keys(r))}`);
  assert.strictEqual(typeof r.hit, 'boolean');
  assert.strictEqual(typeof r.score, 'number');
  assert.strictEqual(typeof r.detail, 'string');
  assert.strictEqual(typeof r.count, 'number');
});

// ─── 汇总 ────────────────────────────────────────────────
console.log(`\nr467 loyalty_by_omission 外部接口：${passed} 通过, ${failed} 失败`);
if (failures.length > 0) {
  for (const f of failures) {
    console.log(`  FAIL: ${f.name}\n        ${f.error}`);
  }
  process.exit(1);
}
process.exit(0);
