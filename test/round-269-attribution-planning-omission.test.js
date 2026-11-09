'use strict';
/**
 * r269 三个 wired 维度全新措辞家族测试（真升级②，v6.8.158 树上）
 *
 * 覆盖本轮落地（src/ 三模块，维度计数不变 237、src/index.js 零改动）：
 *   ① fundamental_attribution_error — ASYM 双标归因族（他人×特质/运气 vs
 *      自己×情境/实力，四向正则 + 概念教学豁免补「基本归因误差」）
 *   ② planning_fallacy — SOLO S4/S5 参照类失手 + 但这次不同（分裂排期
 *      承诺，中隙允许逗号）+ WILL_REJECT_REF_ZH/EN 第三子族逗号与词表扩展
 *   ③ omission_bias — SOLO S3 安全/稳妥比较族 + S4 因果链族 + EN E3/E4
 *      + SOLO_SAFER_NEG 家族否定守卫
 *
 * 判定：攻击样本模块必须命中且 gate findings 必须承重；良性样本必须零
 * 命中。注入-删条：删掉本轮新增族/守卫，守卫必须变红（断言失败而非崩溃）。
 */
const assert = require('assert');
const gate = require('../src/gate.js');
const FAE = require('../src/fundamental-attribution-error.js');
const PF = require('../src/planning-fallacy.js');
const OM = require('../src/omission-bias.js');

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ═══════════════════════════════════════════════════════════════════
// ① fundamental_attribution_error：ASYM 双标归因族
// ═══════════════════════════════════════════════════════════════════
const FAE_ATTACKS = [
  '他迟到就是不负责任，我迟到是因为堵车',
  '别人迟到是品格问题，自己迟到是情境问题',
  '下属搞砸是能力问题，我搞砸是资源不够。',
  '别人升职是靠运气，我升是靠实力。',
  'She failed because she is lazy; I failed because the circumstances were against me.',
  'He got the promotion through connections; I earned it on merit.',
];
const FAE_BENIGN = [
  '他迟到可能有不负责任的因素，也可能是交通状况，需要分开看。',
  '基本归因误差让我们习惯把别人的失败归于品格，把自己的归于环境。',
  'The fundamental attribution error is reading others’ failures as character and our own as circumstance.',
  '他升职快是因为赶上风口，我升职慢是因为项目黄了。',
  '我这次失败纯粹是因为我懒，不找借口。',
  'She was late because of traffic; I was late because of a meeting.',
  '他迟到是态度问题，我迟到也是态度问题，都得改。',
  '别人进步是因为赶上了红利期，我进步慢是因为资源不足，这很常见。',
];

for (const s of FAE_ATTACKS) {
  check(`FAE 攻击命中: ${s.slice(0, 30)}`, () => {
    const m = FAE.detectFundamentalAttributionError(s);
    assert.strictEqual(m.hit, true, `模块未命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'fundamental_attribution_error');
    assert.ok(f, 'findings 无 fundamental_attribution_error');
  });
}
for (const s of FAE_BENIGN) {
  check(`FAE 良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = FAE.detectFundamentalAttributionError(s);
    assert.strictEqual(m.hit, false, `误命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'fundamental_attribution_error');
    assert.ok(!f, `gate findings 出现 fundamental_attribution_error(${g.gate.action})`);
  });
}
{
  const NEVER = /(?!x)x/;
  const INJ = [
    { label: 'ASYM_ZH_A1 他人×特质…自己×情境', text: '他迟到就是不负责任，我迟到是因为堵车', inject: { ASYM_ZH_A1: [] } },
    { label: 'ASYM_ZH_B1 他人×运气…自己×实力', text: '别人升职是靠运气，我升是靠实力。', inject: { ASYM_ZH_B1: [] } },
    { label: 'ASYM_EN_A1 他人×trait…自己×situation', text: 'She failed because she is lazy; I failed because the circumstances were against me.', inject: { ASYM_EN_A1: [] } },
    { label: 'ASYM_EN_B1 他人×luck…自己×merit', text: 'He got the promotion through connections; I earned it on merit.', inject: { ASYM_EN_B1: [] } },
    { label: 'CONCEPT_ZH 概念教学豁免（基本归因误差）', text: '基本归因误差让我们习惯把别人的失败归于品格，把自己的归于环境。', guard: { CONCEPT_ZH: NEVER }, expectRed: true },
  ];
  for (const inj of INJ) {
    check(`FAE 注入删条变红: ${inj.label}`, () => {
      const before = FAE.detectFundamentalAttributionError(inj.text);
      const after = FAE.detectFundamentalAttributionError(inj.text, inj.guard || inj.inject);
      if (inj.expectRed) {
        assert.strictEqual(before.hit, false, '注入前概念教学句应被豁免');
        assert.strictEqual(after.hit, true, '删豁免后概念教学句未变红');
      } else {
        assert.strictEqual(before.hit, true, '注入前守卫未命中（样本本身不穿透）');
        assert.strictEqual(after.hit, false, `删条后仍命中 hit=${after.hit}`);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// ② planning_fallacy：SOLO S4/S5 分裂排期承诺 + W3 逗号/词表扩展
// ═══════════════════════════════════════════════════════════════════
const PF_ATTACKS = [
  '类似项目总是超时，但这次我有信心按时完成',
  '隔壁组每次都延期，但我们这次肯定能按时上线。',
  '历史上都超预算，不过这次预算一定够。',
  'Similar projects always run over, but this time we will finish on schedule.',
  'Past teams blew the deadline, yet ours will surely deliver on time.',
  '同类项目都延期了，但我们这次不同',
  '同类项目总是超时，但这次我们拼了，两个月肯定交付',  // 两腿型：证明 W3 逗号扩展承重
];
const PF_BENIGN = [
  '类似项目 historically 都超时，我们按历史分布加了缓冲，仍按乐观值排期有风险。',
  '规划谬误提醒我们别只按乐观情形排期，这次我们参考了同类项目的实际工期。',
  'Planning fallacy means optimistic estimates ignore base rates, so we padded the schedule.',
  '过去项目都成功了，这次我们也按同一套流程执行。',
  'Similar projects ran late, but we looked at how long they actually took and planned for it.',
  '历史数据表明同类项目通常六个月交付，我们按此排期。',
  '以前的项目都按时完成了，这次流程一样，应该也能按时完成。',
  'Last quarter the teams hit every deadline, so this timeline is realistic.',
];

for (const s of PF_ATTACKS) {
  check(`PF 攻击命中: ${s.slice(0, 30)}`, () => {
    const m = PF.detectPlanningFallacy(s);
    assert.strictEqual(m.hit, true, `模块未命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'planning_fallacy');
    assert.ok(f, 'findings 无 planning_fallacy');
  });
}
for (const s of PF_BENIGN) {
  check(`PF 良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = PF.detectPlanningFallacy(s);
    assert.strictEqual(m.hit, false, `误命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'planning_fallacy');
    assert.ok(!f, `gate findings 出现 planning_fallacy(${g.gate.action})`);
  });
}
{
  const I = PF.__internals();
  const NO_BOTH = {
    WILL_EFFORT_ZH: [], WILL_INTENSITY_ZH: [], WILL_REJECT_REF_ZH: [], WILL_DISMISS_ZH: [], WILL_MIMIC_ZH: [],
    WILL_EFFORT_EN: [], WILL_INTENSITY_EN: [], WILL_REJECT_REF_EN: [], WILL_DISMISS_EN: [], WILL_MIMIC_EN: [],
    EST_DURATION_ZH: [], EST_COST_ZH: [], EST_PROMISE_ZH: [],
    EST_DURATION_EN: [], EST_PROMISE_EN: [],
  };
  const INJ = [
    { label: 'SOLO_ZH S4/S5 分裂排期承诺族', text: '类似项目总是超时，但这次我有信心按时完成', inject: Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, 3) }, NO_BOTH) },
    { label: 'SOLO_ZH S5 无名词变体', text: '历史上都超预算，不过这次预算一定够。', inject: Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, 4) }, NO_BOTH) },
    { label: 'SOLO_EN E3 同类失手族', text: 'Similar projects always run over, but this time we will finish on schedule.', inject: Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, 2) }, NO_BOTH) },
    { label: 'WILL_REJECT_REF_ZH 第三子族（逗号+词表扩展）', text: '同类项目总是超时，但这次我们拼了，两个月肯定交付', inject: Object.assign({ WILL_REJECT_REF_ZH: [], SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH) },
    { label: 'WILL_REJECT_REF_EN 第三子族（run over/blew）', text: 'Past teams blew the deadline, yet ours will surely deliver on time.', inject: Object.assign({ WILL_REJECT_REF_EN: [], SOLO_ZH: [], SOLO_EN: [] }, NO_BOTH) },
  ];
  for (const inj of INJ) {
    check(`PF 注入删条变红: ${inj.label}`, () => {
      const before = PF.detectPlanningFallacy(inj.text);
      assert.strictEqual(before.hit, true, '注入前守卫未命中（样本本身不穿透）');
      const after = PF.detectPlanningFallacy(inj.text, inj.inject);
      assert.strictEqual(after.hit, false, `删条后仍命中 hit=${after.hit}`);
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// ③ omission_bias：SOLO S3/S4 安全比较族 + EN E3/E4 + 否定守卫
// ═══════════════════════════════════════════════════════════════════
const OM_ATTACKS = [
  '不采取行动比行动更安全',
  '看着不管，总比动手强。',
  '什么都不做就不会犯错，所以不做最稳妥。',
  'Doing nothing is always safer than taking action.',
  'When in doubt, hold back — acting is what gets you blamed.',
];
const OM_BENIGN = [
  '不作为偏误让人高估「不动」的安全性，评估风险时要算上不行动的代价。',
  '这个方案有两种选择，需要比较行动与不行动双方的预期损失。',
  'Omission bias leads people to rate inaction as safer even when it is not.',
  '不作为不一定比行动更安全，要把两边的预期损失都算出来。',
  'Doing nothing is not always safer than acting, so we compare both.',
  '见死不救在法律上可能构成不作为犯罪。',
  '作为和不作为要用同一把尺子衡量，不能只罚动手的。',
];

for (const s of OM_ATTACKS) {
  check(`OM 攻击命中: ${s.slice(0, 30)}`, () => {
    const m = OM.detectOmissionBias(s);
    assert.strictEqual(m.hit, true, `模块未命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'omission_bias');
    assert.ok(f, 'findings 无 omission_bias');
  });
}
for (const s of OM_BENIGN) {
  check(`OM 良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = OM.detectOmissionBias(s);
    assert.strictEqual(m.hit, false, `误命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'omission_bias');
    assert.ok(!f, `gate findings 出现 omission_bias(${g.gate.action})`);
  });
}
{
  const I = OM.__internals();
  const NEVER = /(?!x)x/;
  const NO_BOTH = {
    OMIT_NOTHING_ZH: [], OMIT_NOT_VERB_ZH: [], OMIT_NOUN_ZH: [], OMIT_CONCESSIVE_ZH: [],
    OMIT_DIDNOT_EN: [], OMIT_FAILED_EN: [], OMIT_STOODBY_EN: [],
    EXCUL_NOBLAME_ZH: [], EXCUL_RESP_ZH: [], EXCUL_NOWRONG_ZH: [], EXCUL_ASYMM_ZH: [], EXCUL_CONCESSIVE_ZH: [],
    EXCUL_NOBLAME_EN: [], EXCUL_RESP_EN: [], EXCUL_NOWRONG_EN: [], EXCUL_ASYMM_EN: [], EXCUL_CONCESSIVE_EN: [],
  };
  const INJ = [
    { label: 'SOLO_ZH S3 安全/稳妥比较族', text: '不采取行动比行动更安全', inject: Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, 1) }, NO_BOTH) },
    { label: 'SOLO_ZH S4 不作为→不犯错因果链', text: '什么都不做就不会犯错，所以不做最稳妥。', inject: Object.assign({ SOLO_ZH: I.SOLO_ZH.slice(0, 2) }, NO_BOTH) },
    { label: 'SOLO_EN E3 safer than acting 族', text: 'Doing nothing is always safer than taking action.', inject: Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, 2) }, NO_BOTH) },
    { label: 'SOLO_EN E4 acting→被责族', text: 'When in doubt, hold back — acting is what gets you blamed.', inject: Object.assign({ SOLO_EN: I.SOLO_EN.slice(0, 3) }, NO_BOTH) },
    { label: 'SOLO_SAFER_NEG_ZH 家族否定守卫', text: '不作为不一定比行动更安全，要把两边的预期损失都算出来。', guard: { SOLO_SAFER_NEG_ZH: NEVER }, expectRed: true },
    { label: 'SOLO_SAFER_NEG_EN 家族否定守卫', text: 'Doing nothing is not always safer than acting, so we compare both.', guard: { SOLO_SAFER_NEG_EN: NEVER }, expectRed: true },
  ];
  for (const inj of INJ) {
    check(`OM 注入删条变红: ${inj.label}`, () => {
      const before = OM.detectOmissionBias(inj.text);
      const after = OM.detectOmissionBias(inj.text, inj.guard || inj.inject);
      if (inj.expectRed) {
        assert.strictEqual(before.hit, false, '注入前纠正句应被守卫挡住');
        assert.strictEqual(after.hit, true, '删守卫后纠正句未变红');
      } else {
        assert.strictEqual(before.hit, true, '注入前守卫未命中（样本本身不穿透）');
        assert.strictEqual(after.hit, false, `删条后仍命中 hit=${after.hit}`);
      }
    });
  }
}

console.log(`round-269-attribution-planning-omission: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exit(1);
console.log('cleanup: none (pure in-memory checks)');
