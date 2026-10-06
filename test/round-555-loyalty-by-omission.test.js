/**
 * 第 82 维度 loyalty_by_omission（立场连坐）守卫测试
 * v6.8.31 / 第 555 轮（r554 建模块、r555 补 REWRITE_DIMS 登记 + trace 字段）
 *
 * 形状描述（样本全部隔离在本文件内，不贴进任何报告）：
 *   攻击族 = 未支持动作 × 等同化连接词 × 贬损定性词，三支共现缺一不可：
 *     · 未支持动作：不支持 / 不同意 / 不签字 / 拒绝 / 有异议 / 有顾虑
 *       （en: do not support / disagree / refuse to sign / objecting to）
 *     · 等同化连接词：就是 / 等于 / 意味着 / 说明
 *       （en: means / proves / shows / makes you）
 *     · 贬损定性词：敌对 / 反对派 / 不在乎 / 不团结 / 另有用心 / 跟我作对
 *       （en: against us / traitor / disloyal / undermining）
 *   良性分界（两类豁免）：
 *     · 否定引述：把「不X就是Y」当作被驳斥的观点引用（不要说 / 所谓 / 鼓吹 / don't say）
 *     · 真实后果陈述：不支持可能导致排期延后 / 不签字则合同无法生效 / refusing
 *       means the request will be rejected —— 后果是可讨论的事实，不是品格定罪
 *
 * 守卫四联：
 *   ① 攻击族：模块层命中 + 闸门非 pass + findings 归因正确 + guidance 非空
 *   ② 良性族：零误伤（detector 层 hit=false）
 *   ③ 变异守卫：置空 WITHHOLD_ZH / DEMEAN_ZH / EQUATE_LINK_ZH 必须变红
 *      （守卫不能被触发就不是守卫）
 *   ④ 端到端：gate.action 应为 rewrite 级（REWRITE_DIMS 已登记，r555）
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const { checkLoyaltyByOmission } = require(path.join(ROOT, 'src', 'loyalty-by-omission.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0, fail = 0;
const problems = [];
const t = (name, fn) => {
  try { fn(); pass++; } catch (e) { fail++; problems.push(`${name}: ${e.message}`); }
};

// ── ① 攻击族（中英各 12 条，覆盖三支的中文/英文形态与语序变体）─────
const ATK_ZH = [
  '不支持这个方案，你就是站在对立面。',
  '你不同意，说明你跟公司不是一条心。',
  '不签字就是不信任我们。',
  '你拒绝配合，等于拆台。',
  '不转发就是不在乎这个团队。',
  '你有异议，就是不团结。',
  '不投这一票，说明你另有用心。',
  '你不参与，意味着你跟大家作对。',
  '大家对排期有顾虑，就是不领情。',
  '不肯配合，证明你动机不纯。',
  '你提出质疑，表明你在跟组织过不去。',
  '不采纳我的建议，代表你把我们当外人。',
];
const ATK_EN = [
  'If you do not support this, you are against the team.',
  'Refusing to sign means you are disloyal.',
  'Objecting to the plan shows you are undermining us.',
  'Not sharing this proves you do not care about the mission.',
  'If you disagree, you are a traitor.',
  'Declining the offer signals you are obstructing the whole mission.',
  'Disagreeing with me implies you are working against the company.',
  'Refusing the deal shows bad faith.',
  'If you do not join, you are not with us.',
  'Objecting to the motion proves you are one of them.',
  'Not endorsing the plan means you reject all progress.',
  'If you refuse to cooperate, that makes you the enemy.',
];

for (const s of ATK_ZH) {
  t('atk-zh: ' + s.slice(0, 6), () => {
    const r = checkLoyaltyByOmission(s);
    if (r.hit !== true) throw new Error(`detector 未命中 (score=${r.score})`);
    if (r.score < 0.5) throw new Error(`score 应 ≥0.5，实际 ${r.score}`);
    if (!r.detail) throw new Error('detail 为空');
    if (r.count < 1) throw new Error('count < 1');
  });
}
for (const s of ATK_EN) {
  t('atk-en: ' + s.slice(0, 12), () => {
    const r = checkLoyaltyByOmission(s);
    if (r.hit !== true) throw new Error(`detector 未命中 (score=${r.score})`);
  });
}

// ── ①b 端到端：闸门必须非 pass，且 findings 归因到本维度、guidance 非空 ──
for (const s of [ATK_ZH[0], ATK_ZH[2], ATK_ZH[5], ATK_EN[0], ATK_EN[2]]) {
  t('e2e-gate: ' + s.slice(0, 10), () => {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'pass') throw new Error('gate 仍为 pass（维度未生效）');
    const f = (r.findings || []).find(x => x.dimension === 'loyalty_by_omission');
    if (!f) throw new Error('findings 未归因到 loyalty_by_omission');
    if (!f.guidance || f.guidance.length < 10) throw new Error('guidance 为空/过短');
    // checkOutput 的顶层不返回 dimensions 映射，per-dimension 结果在 data.discriminate.dimensions
    const dm = r.data && r.data.discriminate && r.data.discriminate.dimensions;
    if (!dm) { console.log('NO_DM', JSON.stringify(r.data && Object.keys(r.data))); throw new Error('data.discriminate.dimensions 缺失'); }
    if (dm.loyalty_by_omission === undefined) {
      const present = Object.keys(dm).filter(k => /loyal|omis|betray/i.test(k));
      throw new Error(`dimensions 缺本维度（映射键样例: ${present.join('|') || '无'}，总键数 ${Object.keys(dm).length}）`);
    }
    if (!dm.loyalty_by_omission.hit && dm.loyalty_by_omission.score === 0) {
      throw new Error('dimMap 层未命中');
    }
  });
}

// ── ② 良性族：零误伤 ─────────────────────────────────────────
const BENIGN = [
  // 豁免①：真实后果陈述
  '不支持这个方案可能导致排期延后两周。',
  '不签字则合同无法生效。',
  '拒签后这条通道就关闭了。',
  'If you do not sign, the contract will be rejected.',
  'Disagreeing may delay the approval process.',
  // 豁免②：否定引述
  '不要说「不支持就是反对」这种话。',
  '有人鼓吹"不转发就是不在乎团队"，这是典型的立场连坐。',
  '所谓"不配合就是捣乱"的逻辑根本站不住脚。',
  'It is wrong to claim that refusing means you are a traitor.',
  // 无等同化连接词（未支持动作在场但无贬损结构）
  '你可以不同意，这是你的权利。',
  '拒绝不合理的加班要求是员工的合法权利。',
  '我不支持这个决定，原因已经写在文档里。',
  '大家对排期有顾虑，可以提出来讨论。',
  'You may disagree with the proposal; please note your reasons.',
  'Refusing is a valid option here.',
  // 纯行动描述（无未支持动作）
  '我们先把自己的活干完再管别人。',
  '这个按钮点了之后数据会立刻生效。',
  '关闭开关前记得先保存配置。',
];
for (const s of BENIGN) {
  t('benign: ' + s.slice(0, 8), () => {
    const r = checkLoyaltyByOmission(s);
    if (r.hit !== false) throw new Error(`良性误伤 (score=${r.score}, detail=${r.detail})`);
  });
}

// ── ③ 变异守卫：置空三支之一必须变红 ──────────────────────────
// 做法：读 src 源码 → 把指定 const 的正则定义整行替换成永不匹配的合法
// 正则 → 落临时副本 → require 副本 → 中文攻击族必须出现漏判。
// 崩溃 ≠ 变红，所以只统计 "hit=false 的条数"。
const SRC_PATH = path.join(ROOT, 'src', 'loyalty-by-omission.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');
const NEVER = /^$(?!)/;

function loadMutant(constName) {
  const marker = 'const ' + constName + ' = ';
  const i = SRC.indexOf(marker);
  if (i < 0) throw new Error(`源码找不到 ${constName} 定义`);
  const lineEnd = SRC.indexOf('\n', i);
  const originalLine = SRC.slice(i, lineEnd);
  if (!/^\/.*\/[a-z]*;$/.test(originalLine.replace(/^const \w+ = /, ''))) {
    throw new Error(`${constName} 定义行不是纯正则字面量: ${originalLine.slice(0, 40)}`);
  }
  const mutated = SRC.slice(0, i) + 'const ' + constName + ' = /^$(?!)/;' + SRC.slice(lineEnd);
  const tmp = path.join(os.tmpdir(), `hf-r555-lbo-${constName}-${process.pid}.js`);
  fs.writeFileSync(tmp, mutated, 'utf8');
  delete require.cache[tmp];
  const mod = require(tmp);
  const ok = mod.__internals && mod.__internals()[constName] &&
    String(mod.__internals()[constName]) === String(NEVER);
  return { mod, injected: ok, tmp };
}

for (const constName of ['WITHHOLD_ZH', 'DEMEAN_ZH', 'EQUATE_LINK_ZH']) {
  t('mutation: 置空 ' + constName + ' 必须变红', () => {
    const { mod, injected, tmp } = loadMutant(constName);
    try {
      if (!injected) throw new Error('变异注入未生效（副本内正则未被替换）');
      const missed = ATK_ZH.filter(s => mod.checkLoyaltyByOmission(s).hit === false);
      if (missed.length === 0) throw new Error('置空后攻击族仍全命中 → 该支不是必要守卫');
      // 阈值：置空任一支至少要使过半中文样本漏判（三支共现缺一不可）
      if (missed.length < ATK_ZH.length / 2) {
        throw new Error(`漏判条数不足: ${missed.length}/${ATK_ZH.length}`);
      }
    } finally {
      fs.unlinkSync(tmp);
    }
  });
}

// ── ④ 回归：连线不得影响其他维度（抽样其他维度仍可命中）─────────
t('regression: 其他维度不受本轮接线影响', () => {
  const { checkWhataboutism } = require(path.join(ROOT, 'src', 'index.js'));
  if (checkWhataboutism('先管好你自己再来数落我').count < 1) throw new Error('whataboutism 回归失败');
  const { checkPercentageOverflow } = require(path.join(ROOT, 'src', 'percentage-overflow.js'));
  if (checkPercentageOverflow('团队里 70% 是工程师，60% 是设计师，其余为运营人员。').hit !== true) {
    throw new Error('percentage_overflow 回归失败');
  }
});

// ── ⑤ 回归：REWRITE_DIMS 登记生效（gate 层判定为 rewrite 而非 verify）─
t('regression: REWRITE_DIMS 登记使本族落 rewrite 级', () => {
  const r = gate.checkOutput(ATK_ZH[0]);
  if (r.gate.action !== 'rewrite') {
    throw new Error(`期望 rewrite，实际 ${r.gate.action}（REWRITE_DIMS 未登记？）`);
  }
});

if (problems.length) console.log(problems.join('\n'));
console.log(`r555 loyalty_by_omission 守卫：${pass} 通过, ${fail} 失败`);
console.log(`${pass} 通过, ${fail} 失败`);
process.exitCode = fail > 0 ? 1 : 0;
