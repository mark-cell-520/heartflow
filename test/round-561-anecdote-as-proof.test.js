/**
 * 第 84 维度 anecdote_as_proof（个例冒充普遍）守卫测试
 * v6.8.34 / 第 560 轮建模块，第 561 轮补齐 7 处接线 + 补两支漏判后建本守卫
 *
 * 形状描述（样本全部隔离在本文件内，不贴进任何报告）：
 *   攻击族 —— 两条腿都在即成立：
 *     · A1 个例来源：第一人称/熟人语料（我朋友/我身边/我认识的人/
 *       自身经验「我用了三个月/我从来没遇到过问题」/everyone I know…
 *       It worked for me）；
 *     · A2 普遍结论：全称或准全称效果断言（说明有效/普遍适用/行业标准/
 *       所以这套流程是安全的/so it works in general）。
 *   看守（良性分界）：明确标注个例范围、前瞻核验建议、纯行程事实陈述。
 *
 * 守卫七联：
 *   ① 攻击族：模块层命中 + score≥0.5 + detail 非空 + count≥1（中英各 10）
 *   ② 良性族：零误伤（detector 层 hit=false），含 6 支看守形态
 *   ③ 变异守卫：置空 ANECDOTE_ZH / UNIVERSAL_ZH / SELF_LIMIT_ZH / ADVICE_GUARD /
 *     ANECDOTE_EN / UNIVERSAL_EN 必须让指定样本变红
 *   ④ 端到端：gate.action 应为 verify 级（VERIFY_DIMS 已登记 r561）
 *   ⑤ 接线回归：dimMap + dimensions/summary 两侧都可读到命中
 *   ⑥ 边界：不侵占既有维度独有族（hasty_generalization / statistical_misleading /
 *     appeal_to_authority 各有专门维度，本族是三者空档）
 *   ⑦ r561 补支回归：「我从来没遇到过问题」（经历体）与「我从来没用出过问题」
 *     （宾语省略动词形）必须命中
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const { checkAnecdoteAsProof } = require(path.join(ROOT, 'src', 'anecdote-as-proof.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

let pass = 0, fail = 0;
const problems = [];
const t = (name, fn) => {
  try { fn(); pass++; } catch (e) { fail++; problems.push(`${name}: ${e.message}`); }
};

// ── ① 攻击族：中英各 10 条（覆盖熟人语料/身边样本/自身经验三类 A1）─────
const ATK_ZH = [
  '我朋友吃了三个月这个药就好了，说明这药确实有效。',
  '我身边的朋友都在用，说明这套方法真的管用。',
  '我从来没用出过问题，所以这套流程是安全的。',
  '我从来没遇到过问题，这套流程是安全的。',
  '我用了三个月，感觉好多了，说明这方法有效。',
  '我认识的人用了都有效，可见这课是真的靠谱。',
  '我身边的人都在这么干，这就是行业标准。',
  '我一个亲戚开了半年没出状况，证明这法子安全可靠。',
  '我自己试了挺舒服，说明这套操作办法是安全的。',
  '我们从来操作没出过意外，所以这套做法是稳妥的。',
];
const ATK_EN = [
  'It worked for me, so it works in general.',
  'My friend tried it and it worked, so the method is proven.',
  'Everyone I know uses it, so it is the industry standard.',
  'I have never had a problem with it, so the process is safe.',
  'My coworkers all got better, which means it is effective.',
  'I have used it for months, hence it is proven safe.',
  'Everyone says it works, so it is proven to work.',
  'One of my relatives drove it for years without trouble, so it is reliable.',
];

for (const s of ATK_ZH) {
  t('atk-zh: ' + s.slice(0, 8), () => {
    const r = checkAnecdoteAsProof(s);
    if (r.hit !== true) throw new Error(`detector 未命中 (score=${r.score})`);
    if (r.score < 0.5) throw new Error(`score 应 ≥0.5，实际 ${r.score}`);
    if (!r.detail) throw new Error('detail 为空');
    if (r.count < 1) throw new Error('count < 1');
  });
}
for (const s of ATK_EN) {
  t('atk-en: ' + s.slice(0, 14), () => {
    const r = checkAnecdoteAsProof(s);
    if (r.hit !== true) throw new Error(`detector 未命中 (score=${r.score})`);
  });
}

// ── ①b 端到端：闸门必须 verify 且归因本维度、guidance 非空 ────────────
for (const s of [ATK_ZH[0], ATK_ZH[2], ATK_ZH[4], ATK_EN[0], ATK_EN[2]]) {
  t('e2e-gate: ' + s.slice(0, 10), () => {
    const r = gate.checkOutput(s);
    if (r.gate.action === 'pass') throw new Error('gate 仍为 pass（维度未生效）');
    const f = (r.findings || []).find(x => x.dimension === 'anecdote_as_proof');
    if (!f) throw new Error('findings 未归因到 anecdote_as_proof');
    if (!f.guidance || f.guidance.length < 10) throw new Error('guidance 为空/过短');
    const dm = r.data && r.data.discriminate && r.data.discriminate.dimensions;
    if (!dm) throw new Error('data.discriminate.dimensions 缺失');
    if (dm.anecdote_as_proof === undefined) {
      throw new Error(`dimensions 缺本维度（总键数 ${Object.keys(dm).length}）`);
    }
    if (!dm.anecdote_as_proof.hit && dm.anecdote_as_proof.score === 0) {
      throw new Error('dimMap 层未命中');
    }
  });
}

// ── ② 良性族：零误伤（含 6 支看守形态）────────────────────────
const BENIGN = [
  // 已标注个例范围（SELF_LIMIT）
  '这只是我个人的单次体验，样本量只有一例，不能推广。',
  '那是个例，我的方案另有全量数据支撑。',
  'This is just my anecdotal case, sample size of one, not generalizable.',
  // 前瞻核验建议（ADVICE_GUARD）
  '我朋友也这样，不过你最好先去做个检查再判断。',
  '我遇到过类似情况，建议你先去做个检测。',
  // 无个例来源的普通陈述
  '这座城市有三座大桥，最早的一座建于一九八四年。',
  '我今天上午去了公司，下午开了三个会。',
  'The bridge was built in 1984 and renovated twice.',
  '我们需要补充统计数据来支持这个结论。',
  // 有结论但无个例来源
  '临床试验显示该药物的有效率为百分之七十二。',
  'The clinical trial enrolled twelve thousand participants.',
];
for (const s of BENIGN) {
  t('benign: ' + s.slice(0, 10), () => {
    const r = checkAnecdoteAsProof(s);
    if (r.hit !== false) throw new Error(`良性误伤 (score=${r.score}, detail=${r.detail})`);
  });
}

// ── ③ 变异守卫：置空六支之一必须变红 ──────────────────────────
// 做法同 r559：读 src 源码 → 把指定 const 的正则定义整段替换成永不匹配的
// 合法正则 → 落临时副本 → require 副本 → 攻击族必须出现漏判。
// 注意 ADVICE_GUARD 是单行 new RegExp('...', 'i') 形态（非多支 join），
// 改用整行替换。
const SRC_PATH = path.join(ROOT, 'src', 'anecdote-as-proof.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');

function loadMutantMulti(constName) {
  const startMarker = 'const ' + constName + ' = new RegExp([';
  const i = SRC.indexOf(startMarker);
  if (i < 0) throw new Error(`源码找不到 ${constName} 定义`);
  const j = SRC.indexOf('.join(', i);
  if (j < 0) throw new Error(`${constName} 找不到 .join 收尾`);
  const lineEnd = SRC.indexOf('\n', j);
  const segment = SRC.slice(i, lineEnd);
  const branchCount = (segment.match(/^\s*'/gm) || []).length;
  if (branchCount < 1) throw new Error(`${constName} 段内无分支`);
  const mutated = SRC.slice(0, i) + 'const ' + constName + ' = /^$(?!)/;' + SRC.slice(lineEnd);
  const tmp = path.join(os.tmpdir(), `hf-r561-aap-${constName}-${process.pid}.js`);
  fs.writeFileSync(tmp, mutated, 'utf8');
  delete require.cache[tmp];
  const mod = require(tmp);
  const ok = mod.__internals && mod.__internals()[constName] &&
    String(mod.__internals()[constName]) === String(/^$(?!)/);
  return { mod, injected: ok, tmp };
}

function loadMutantSingle(constName) {
  // 多行 new RegExp('...' + '...', 'i') 形态：从定义起点定位到 `);` 收尾
  const startMarker = 'const ' + constName + ' = new RegExp(';
  const i = SRC.indexOf(startMarker);
  if (i < 0) throw new Error(`源码找不到 ${constName} 定义`);
  // 找该定义之后的第一个 `);`（参数列表结束）
  const j = SRC.indexOf(');', i);
  if (j < 0) throw new Error(`${constName} 找不到 ); 收尾`);
  const end = j + 2;
  const mutated = SRC.slice(0, i) + 'const ' + constName + ' = /^$(?!)/;' + SRC.slice(end);
  const tmp = path.join(os.tmpdir(), `hf-r561-aap-${constName}-${process.pid}.js`);
  fs.writeFileSync(tmp, mutated, 'utf8');
  delete require.cache[tmp];
  const mod = require(tmp);
  const ok = mod.__internals && mod.__internals()[constName] &&
    String(mod.__internals()[constName]) === String(/^$(?!)/);
  return { mod, injected: ok, tmp };
}

const MUTANTS = [
  { name: 'ANECDOTE_ZH', arr: ATK_ZH, min: 3, kind: 'multi' },
  { name: 'UNIVERSAL_ZH', arr: ATK_ZH, min: 3, kind: 'multi' },
  { name: 'ANECDOTE_EN', arr: ATK_EN, min: 2, kind: 'multi' },
  { name: 'UNIVERSAL_EN', arr: ATK_EN, min: 2, kind: 'multi' },
  { name: 'ADVICE_GUARD', arr: ATK_ZH, min: 0, kind: 'single' },
  { name: 'SELF_LIMIT_ZH', arr: ATK_ZH, min: 0, kind: 'multi' },
];
for (const m of MUTANTS) {
  t('mutation: 置空 ' + m.name + ' 守卫活性', () => {
    const { mod, injected, tmp } = m.kind === 'multi' ? loadMutantMulti(m.name) : loadMutantSingle(m.name);
    try {
      if (!injected) throw new Error('变异注入未生效');
      const missed = m.arr.filter(s => mod.checkAnecdoteAsProof(s).hit === false);
      // 对守卫型常量（SELF_LIMIT / ADVICE_GUARD）：置空后**良性样本必须变红**
      // （原本被看守放行，看守消失后 A1×A2 组合成立），这才是守卫活着的证据。
      if (m.min === 0) {
        const bp = m.name === 'ADVICE_GUARD'
          ? ['我朋友吃了三个月这个药就好了，说明这药确实有效，但你最好先去做个检查。']
          : ['我朋友吃了三个月这个药就好了，说明这药确实有效，但这只是我的个人体验，不足以推广。'];
        const turnedRed = bp.filter(s => mod.checkAnecdoteAsProof(s).hit === true);
        if (turnedRed.length === 0) {
          throw new Error(`置空 ${m.name} 后良性样本仍未变红 → 该看守不是活守卫`);
        }
        return;
      }
      if (missed.length === 0) throw new Error('置空后攻击族仍全命中 → 该支不是必要守卫');
      if (missed.length < m.min) {
        throw new Error(`漏判条数不足: ${missed.length}/${m.arr.length}（需 ≥${m.min}）`);
      }
    } finally {
      fs.unlinkSync(tmp);
    }
  });
}

// ── ④ 回归：VERIFY_DIMS 登记生效（gate 层判定为 verify 而非 rewrite）──
t('regression: VERIFY_DIMS 登记使本族落 verify 级', () => {
  const r = gate.checkOutput(ATK_ZH[0]);
  if (r.gate.action !== 'verify') {
    throw new Error(`期望 verify，实际 ${r.gate.action}（VERIFY_DIMS 未登记？）`);
  }
});

// ── ⑤ 接线回归：不影响其他维度 ─────────────────────────────
t('regression: 其他维度不受本轮接线影响', () => {
  const { checkHastyGeneralization } = require(path.join(ROOT, 'src', 'index.js'));
  if (checkHastyGeneralization('我见过三个人这样，所以所有人都会这样。').count < 1) {
    throw new Error('hasty_generalization 回归失败');
  }
  const { checkPaternalisticDecide } = require(path.join(ROOT, 'src', 'paternalistic-decide.js'));
  if (checkPaternalisticDecide('我是为你好，这个决定你不用知道细节。').hit !== true) {
    throw new Error('paternalistic_decide 回归失败（第 83 维被本轮改动影响）');
  }
});

// ── ⑥ 边界：不侵占既有维度独有族 ────────────────────────────
// hasty_generalization（显式概括桥）、statistical_misleading（要数字）、
// appeal_to_authority（权威背书）各有专门维度接管。
t('boundary: 不侵占既有维度独有族', () => {
  // hg 独有族：显式概括桥在场
  if (checkAnecdoteAsProof('我见过三个人这样，所以所有人都会这样。').hit !== false) {
    throw new Error('本维度误判 hasty_generalization 独有族（显式概括桥）');
  }
  // statistical_misleading 独有族：有数字的比例断言
  if (checkAnecdoteAsProof('调查显示百分之八十的用户满意。').hit !== false) {
    throw new Error('本维度误判 statistical_misleading 独有族（有比例数字）');
  }
  // appeal_to_authority 独有族：权威背书（无人称个例）
  if (checkAnecdoteAsProof('哈佛大学二零二五年的研究证明咖啡有益健康。').hit !== false) {
    throw new Error('本维度误判 appeal_to_authority 独有族（权威背书）');
  }
});

// ── ⑦ r561 补支回归 ────────────────────────────────────────
// 经历体「遇到过」与宾语省略动词形「没用出过」是本轮逐支归因后补的，
// 两条必须命中（防下一轮重构时被无意删掉）。
const R561_NEW = [
  '我从来没遇到过问题，这套流程是安全的。',
  '我从来没用出过问题，所以这套流程是安全的。',
  '我从未碰到过故障，所以这套办法是可靠的。',
];
for (const s of R561_NEW) {
  t('r561-new-branch: ' + s.slice(0, 8), () => {
    const r = checkAnecdoteAsProof(s);
    if (r.hit !== true) throw new Error(`r561 补支未命中 (score=${r.score})`);
  });
}

if (problems.length) console.log(problems.join('\n'));
console.log(`r561 anecdote_as_proof 守卫：${pass} 通过, ${fail} 失败`);
console.log(`${pass} 通过, ${fail} 失败`);
process.exitCode = fail > 0 ? 1 : 0;
