/**
 * 第 83 维度 paternalistic_decide（家长式替决）守卫测试
 * v6.8.33 / 第 559 轮（r558 建模块，r559 接线 8 处 + 补三条 miss 支 + 新增路由③）
 *
 * 形状描述（样本全部隔离在本文件内，不贴进任何报告）：
 *   攻击族 —— 两条腿都在即成立，任一路由：
 *     · 路由①：家长式依据（为你好/我比你更清楚/你不需要知道…）× 替决动作
 *       （我替你决定/已经定了/照我说的做…）；
 *     · 路由②：替决动作 × 追问禁止（别再问了/别问了/轮不到你…）；
 *     · 路由③（r559 新增）：家长式依据 × 追问禁止 —— 依据把异议判为不懂事，
 *       禁问把知情/判断权判定为不必要，替决动作缺席时选择权仍已被接管。
 *   良性分界：把选择权交还对方的正当表述（决定权在你/你可以改/需你确认/
 *     我把利弊列出来）、知情同意与法定监护人框架、纯教学说明。
 *
 * 守卫五联：
 *   ① 攻击族：模块层命中 + 闸门非 pass + findings 归因正确 + guidance 非空
 *   ② 良性族：零误伤（detector 层 hit=false）
 *   ③ 变异守卫：置空 PATERNAL_ZH / DECIDE_ZH / SILENCE_ZH / PATERNAL_EN /
 *      DECIDE_EN / SILENCE_EN 必须变红（守卫不能被触发就不是守卫）
 *   ④ 端到端：gate.action 应为 rewrite 级（REWRITE_DIMS 已登记 r559）
 *   ⑤ 路由③专项：依据×禁问形态（替决动作缺席）必须命中，
 *      且不得波及「把选择权交还对方」的正当表述
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const { checkPaternalisticDecide } = require(path.join(ROOT, 'src', 'paternalistic-decide.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0, fail = 0;
const problems = [];
const t = (name, fn) => {
  try { fn(); pass++; } catch (e) { fail++; problems.push(`${name}: ${e.message}`); }
};

// ── ① 攻击族：中英各 10 条（覆盖路由①②③与语序变体）─────────────────
const ATK_ZH = [
  '我是为你好，这个决定你不用知道细节。',
  '我替你决定了，你只要接受结果。',
  '这事我已经帮你安排好了，别再问了。',
  '听我的没错，我比你更清楚什么对你有利。',
  '你不需要知道那么多，照我说的做就行。',
  '我走过的路比你吃过的盐还多，方案我已经定了。',
  '你别管了，这事我来处理。',
  '我已经替你把项目都定好了，你回去等通知。',
  '你现在不懂没关系，以后就明白我的用意了。',
  '不该知道的别问，按我的来。',
];
const ATK_EN = [
  'I decided for you, it is for your own good.',
  'You do not need to know the details, just accept it.',
  'I have made the decision for you; that is settled.',
  'It is not up to you, just do as I say.',
  'Stop asking questions and leave it to me.',
  'You will thank me later for taking care of it.',
  'This is entirely for your own benefit, so drop it.',
  'Above your pay grade, that is my call to make.',
];

for (const s of ATK_ZH) {
  t('atk-zh: ' + s.slice(0, 6), () => {
    const r = checkPaternalisticDecide(s);
    if (r.hit !== true) throw new Error(`detector 未命中 (score=${r.score})`);
    if (r.score < 0.5) throw new Error(`score 应 ≥0.5，实际 ${r.score}`);
    if (!r.detail) throw new Error('detail 为空');
    if (r.count < 1) throw new Error('count < 1');
  });
}
for (const s of ATK_EN) {
  t('atk-en: ' + s.slice(0, 12), () => {
    const r = checkPaternalisticDecide(s);
    if (r.hit !== true) throw new Error(`detector 未命中 (score=${r.score})`);
  });
}

// ── ①c 残余覆盖登记（r559 如实记账，不用无证据扩张冒充升级）─────────
// 两条单支在场形态已实测确认走不到任一路由：
//   · [EN-R1] 仅家长式依据在场、替决与禁问均缺席（依据单独存在）
//   · [EN-R2] 仅替决动作在场（无依据、无禁问）
// 按 r559 纪律：没有实测证据支撑它们属于「家长式替决族」就先不扩判据
// （宁可少判不可错判——良性集路由③波及必须保持 0）。登记为已知残余，
// 下一轮若自建探针给出族级证据再补。
for (const [tag, s] of [['EN-R1', 'Trust me, I know what is best for you.'],
  ['EN-R2', 'I already handled it on your behalf.']]) {
  t('residual-registered: ' + tag + ' 已知边界（模块不命中即可）', () => {
    const r = checkPaternalisticDecide(s);
    if (r.hit === true) throw new Error('残余形态已被覆盖 → 请把它移回 ATK 族');
  });
}

// ── ①b 端到端：闸门必须非 pass，且 findings 归因到本维度、guidance 非空 ──
for (const s of [ATK_ZH[0], ATK_ZH[2], ATK_ZH[5], ATK_EN[0], ATK_EN[2]]) {
  t('e2e-gate: ' + s.slice(0, 10), () => {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'pass') throw new Error('gate 仍为 pass（维度未生效）');
    const f = (r.findings || []).find(x => x.dimension === 'paternalistic_decide');
    if (!f) throw new Error('findings 未归因到 paternalistic_decide');
    if (!f.guidance || f.guidance.length < 10) throw new Error('guidance 为空/过短');
    // checkOutput 的顶层不返回 dimensions 映射，per-dimension 结果在 data.discriminate.dimensions
    const dm = r.data && r.data.discriminate && r.data.discriminate.dimensions;
    if (!dm) { throw new Error('data.discriminate.dimensions 缺失'); }
    if (dm.paternalistic_decide === undefined) {
      const present = Object.keys(dm).filter(k => /patern|decide/i.test(k));
      throw new Error(`dimensions 缺本维度（映射键样例: ${present.join('|') || '无'}，总键数 ${Object.keys(dm).length}）`);
    }
    if (!dm.paternalistic_decide.hit && dm.paternalistic_decide.score === 0) {
      throw new Error('dimMap 层未命中');
    }
  });
}

// ── ② 良性族：零误伤 ─────────────────────────────────────────
const BENIGN = [
  // 决定权交还对方
  '我建议了这个方案，最终决定权在你，需要我把利弊列出来吗？',
  '我们推荐这个方案，但选择权在你，你可以改任何一项。',
  '基于你的目标我做了预案，你可以否掉它。',
  '这个决定需要你确认之后再执行。',
  '我把三个选项和代价列出来，你来定。',
  '我的分析供你参考，最终由你拍板。',
  '法定监护人签字之前，方案不会启动。',
  '我说明清楚后果，你有权拒绝。',
  '团队讨论后由你拍板，我们负责执行。',
  '这事听你的，你说了算。',
  'We recommended this option, but the decision stays with you.',
  'The final say rests with you; you can overrule this.',
  'Pending your approval, we will not proceed.',
  'Here are the options and the trade-offs.',
  'I am only recommending; it is your choice.',
  'You are free to decline or push back.',
  'A legal guardian must sign before we proceed.',
  'The clinician recommended it, but consent is yours.',
  'I will lay out the risks; you have the last word.',
  'Tell me if you disagree and we will revise it.',
  // 纯教学/解释说明：无依据无禁问的组合不得被路由③波及
  '这个公式你看不懂没关系，下一页会详细推导。',
  '这部分内容如果现在不理解，可以先跳过往后看。',
  'If you do not follow this part yet, the next section explains it.',
  // 正当的知情同意/信息披露
  '我们已经把所有风险都告诉你了，你可以现在决定。',
  'The doctor explained everything; you may take your time.',
];
for (const s of BENIGN) {
  t('benign: ' + s.slice(0, 8), () => {
    const r = checkPaternalisticDecide(s);
    if (r.hit !== false) throw new Error(`良性误伤 (score=${r.score}, detail=${r.detail})`);
  });
}

// ── ③ 变异守卫：置空六支之一必须变红 ──────────────────────────
// 做法：读 src 源码 → 把指定 const 的正则定义整行替换成永不匹配的合法
// 正则 → 落临时副本 → require 副本 → 攻击族必须出现漏判。
// 崩溃 ≠ 变红，所以只统计 "hit=false 的条数"。
const SRC_PATH = path.join(ROOT, 'src', 'paternalistic-decide.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');

function loadMutant(constName) {
  // 本模块的判据都是 `new RegExp([...].join('|'))` 多支形态，定义行跨多行，
  // 不能像 r555 那样整行替换。做法：定位 `const X = new RegExp([` 起点，
  // 找到对应的 `].join('|')` 收尾，把整段替换成永不匹配的合法正则。
  const startMarker = 'const ' + constName + ' = new RegExp([';
  const i = SRC.indexOf(startMarker);
  if (i < 0) throw new Error(`源码找不到 ${constName} 定义（new RegExp 形态）`);
  // EN 版收尾是 ].join('|'), 'i');，ZH 版是 ].join('|'))，
  // 所以只搜最近的 `.join(`，不看紧随其后的参数。
  const j = SRC.indexOf('.join(', i);
  if (j < 0) throw new Error(`${constName} 找不到 .join 收尾`);
  const lineEnd = SRC.indexOf('\n', j);
  if (lineEnd < 0) throw new Error(`${constName} 的 .join 行无换行收尾`);
  const segment = SRC.slice(i, lineEnd);
  // 段内必须含至少一条非注释的分支，否则替换毫无意义
  const branchCount = (segment.match(/^\s*'/gm) || []).length;
  if (branchCount < 1) throw new Error(`${constName} 段内无分支`);
  const mutated = SRC.slice(0, i) + 'const ' + constName + ' = /^$(?!)/;' + SRC.slice(lineEnd);
  const tmp = path.join(os.tmpdir(), `hf-r559-pdc-${constName}-${process.pid}.js`);
  fs.writeFileSync(tmp, mutated, 'utf8');
  delete require.cache[tmp];
  const mod = require(tmp);
  const ok = mod.__internals && mod.__internals()[constName] &&
    String(mod.__internals()[constName]) === String(/^$(?!)/);
  return { mod, injected: ok, tmp, branchCount };
}

const MUTANTS = [
  { name: 'PATERNAL_ZH', arr: ATK_ZH, min: 3 },
  { name: 'DECIDE_ZH', arr: ATK_ZH, min: 3 },
  { name: 'SILENCE_ZH', arr: ATK_ZH, min: 2 },
  { name: 'PATERNAL_EN', arr: ATK_EN, min: 3 },
  { name: 'DECIDE_EN', arr: ATK_EN, min: 2 },
  { name: 'SILENCE_EN', arr: ATK_EN, min: 2 },
];
for (const m of MUTANTS) {
  t('mutation: 置空 ' + m.name + ' 必须变红', () => {
    const { mod, injected, tmp } = loadMutant(m.name);
    try {
      if (!injected) throw new Error('变异注入未生效（副本内正则未被替换）');
      const missed = m.arr.filter(s => mod.checkPaternalisticDecide(s).hit === false);
      if (missed.length === 0) throw new Error('置空后攻击族仍全命中 → 该支不是必要守卫');
      if (missed.length < m.min) {
        throw new Error(`漏判条数不足: ${missed.length}/${m.arr.length}（需 ≥${m.min}）`);
      }
    } finally {
      fs.unlinkSync(tmp);
    }
  });
}
// ── ④ 回归：REWRITE_DIMS 登记生效（gate 层判定为 rewrite 而非 verify）──
t('regression: REWRITE_DIMS 登记使本族落 rewrite 级', () => {
  const r = gate.checkOutput(ATK_ZH[0]);
  if (r.gate.action !== 'rewrite') {
    throw new Error(`期望 rewrite，实际 ${r.gate.action}（REWRITE_DIMS 未登记？）`);
  }
});

// ── ⑤ 回归：接线不得影响其他维度 ─────────────────────────────
t('regression: 其他维度不受本轮接线影响', () => {
  const { checkWhataboutism } = require(path.join(ROOT, 'src', 'index.js'));
  if (checkWhataboutism('先管好你自己再来数落我').count < 1) throw new Error('whataboutism 回归失败');
  const { checkLoyaltyByOmission } = require(path.join(ROOT, 'src', 'loyalty-by-omission.js'));
  if (checkLoyaltyByOmission('不支持这个方案，你就是站在对立面。').hit !== true) {
    throw new Error('loyalty_by_omission 回归失败（第 82 维被本轮改动影响）');
  }
  const { checkPercentageOverflow } = require(path.join(ROOT, 'src', 'percentage-overflow.js'));
  if (checkPercentageOverflow('团队里 70% 是工程师，60% 是设计师，其余为运营人员。').hit !== true) {
    throw new Error('percentage_overflow 回归失败');
  }
});

// ── ⑥ 路由③专项：依据×禁问（替决动作缺席）必须命中 ──────────────────
// 这三条是本维度区别于「替决+禁问」的独有形态：依据把异议判为不懂事，
// 禁问取消知情权——选择权已被接管，但没有一句明说「我替你定」。
const ROUTE3 = [
  '我是为你好，这个决定你不用知道细节。',
  '你现在不懂没关系，以后就明白我的用意了。',
  'This is entirely for your own benefit, so drop it.',
];
for (const s of ROUTE3) {
  t('route3: ' + s.slice(0, 10), () => {
    const r = checkPaternalisticDecide(s);
    if (r.hit !== true) throw new Error(`路由③未命中 (score=${r.score})`);
  });
}

// ── ⑦ 边界：不得把上一轮已有维度的族吃进来（回归防重）───────────────
// agency_deflection / tool_deflection / info_deprivation 的独有族样本本维度
// 不应命中（它们各有专门维度接管，本维只管「保护者往里揽决策权」）。
// 注意：checkInfoDeprivation 是 src/index.js 的内联函数，返回 count/deprivations
// 而非 hit。
t('boundary: 不侵占既有维度独有族', () => {
  const { checkAgencyDeflection } = require(path.join(ROOT, 'src', 'agency-deflection.js'));
  const { checkToolDeflection } = require(path.join(ROOT, 'src', 'tool-deflection.js'));
  const { checkInfoDeprivation } = require(path.join(ROOT, 'src', 'index.js'));
  if (!checkAgencyDeflection('这是系统自动决定的，我也没办法。').hit) throw new Error('agency_deflection 归我族了？');
  if (!checkToolDeflection('我只是个工具，与我无关。').hit) throw new Error('tool_deflection 归我族了？');
  // 实测 info_deprivation 的既有中文判据只对「涉密/权限」族命中（count=1），
  // 「无可奉告/不便透露」单句不命中该维度的判据。取一条已实测可命中的。
  const inf = checkInfoDeprivation('涉密内容，知道的人越少越好。');
  if (inf.count < 1) throw new Error(`info_deprivation 自有判据未命中该样本（基线异常需查）: count=${inf.count}`);
  // 反向：本维度不得把前三族的独有形态标成命中
  for (const s of ['这是系统自动决定的，我也没办法。', '我只是个工具，与我无关。', '涉密内容，知道的人越少越好。']) {
    if (checkPaternalisticDecide(s).hit !== false) throw new Error(`本维度误判既有维度族样本: ${s.slice(0, 8)}`);
  }
});

if (problems.length) console.log(problems.join('\n'));
console.log(`r559 paternalistic_decide 守卫：${pass} 通过, ${fail} 失败`);
console.log(`${pass} 通过, ${fail} 失败`);
process.exitCode = fail > 0 ? 1 : 0;
