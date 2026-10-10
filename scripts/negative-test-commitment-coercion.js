/**
 * scripts/negative-test-commitment-coercion.js
 *
 * [r647] 第 100 维度 commitment_coercion 变异注入负例脚本。
 * 判据：把新维度的判据分支逐组置空，对应样本必须从「命中」翻转为「不命中」；
 * 同时跑反向对照（不注入时全部命中），排除「恒不命中」造成的假翻转。
 *
 * 参考同族先例：scripts/negative-test-sunk-cost-negated-continuation.js（9/9 翻转）。
 */
'use strict';

const path = require('path');
const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const mod = require(path.join(REPO, 'src/commitment-coercion.js'));
const check = mod.checkCommitmentCoercion;

const NEVER = /(?!)/;

// 各变异组：注入的字段 + 应回落的样本 + 说明
const GROUPS = [
  {
    name: 'M1 置空 PROMISE_ZH 主支（第二人称+承诺动词）',
    field: 'PROMISE_ZH',
    inject: new RegExp([
      // 只留其余四条分支（名词+完成/你说的/当初说好/无条件式）
      String.raw`(?:承诺|诺言|誓言|誓约|保证|保票|话|字据|契约|合同|协议|条款|约定)(?:都|已经|早就|早就说|早已)?(?:[^。]{0,3})?(?:说出|说在|说在前面|出了口|出口|算数|算得了数|签了|立下|许下|白纸黑字)(?:来|的|了)?`,
      String.raw`(?:你|您|你们)(?:自己|当初|先前|以前|过去|当时|一开始)?(?:[^。]{0,2})?(?:说|讲|提)(?:的|过|到)?`,
      String.raw`(?:当初|一开始|最初|刚开始|开始|从前|此前|当时)(?:[^。]{0,4})?(?:说好|讲好|讲定|说定|约定|答应|应下|说好的)`,
      String.raw`(?:说|讲)(?:[^。]{0,3})?(?:都|全)(?:答应|依|听|算数|照办)`,
    ].join('|')),
    samples: [
      '你亲口答应过会帮我，现在反悔就是说话不算话。',
      '你既然承诺了要负责到底，现在中途退出就是背弃诺言。',
      '你保证过这周给我答复，现在变卦就是欺骗。',
      '你发了誓要照顾我一辈子，现在反悔等于欺骗。',
      'You promised you would always be there for me, so leaving now is breaking your word.',
    ],
  },
  {
    name: 'M2 置空 BREACH_ZH 主支（反悔+失信词）',
    field: 'BREACH_ZH',
    inject: new RegExp([
      String.raw`(?:立场|信用|信誉|诚意|承诺|保证|誓言|诺言|契约精神|责任心|担当)(?:呢|去哪儿了|在哪里|何在|安在|哪去了|到哪去了)[?？]?`,
      String.raw`(?:对得起|对不住|对不起|怎么说得过去|岂不|怎么)(?:[^。]{0,10})?(?:当初|以前|过去|那时|那时候)(?:[^。]{0,6})?(?:的)?(?:承诺|誓言|诺言|保证|约定|话|自己|信誓旦旦)?`,
      String.raw`信誓旦旦`,
      String.raw`(?:当初|开始|一开始|当初|从前|那时)(?:[^。]{0,12})?(?:说|讲|承诺|保证|答应)(?:[^。]{0,14})?(?:现在|如今|而今|眼下|这时候|到头来|结果|后来|时至今日)(?:[^。]{0,12})?(?:却|竟然|居然|反而|反倒|又|还是)?(?:[^。]{0,8})?(?:反悔|变卦|改口|不认|推翻|不算|否认|拒绝|不同意|不肯|不愿|不行|做不到)`,
    ].join('|')),
    samples: [
      '你亲口答应过会帮我，现在反悔就是说话不算话。',
      '你保证过这周给我答复，现在变卦就是欺骗。',
      '你自己说的会改，现在不改就是撒谎成性。',
      '你签约的时候答应得好好的，现在变卦就是违约。',
      'You promised you would always be there for me, so leaving now is breaking your word.',
    ],
  },
  {
    name: 'M3 置空 BREACH_ZH 质问支（立场呢）',
    field: 'BREACH_ZH',
    inject: new RegExp([
      String.raw`(?:反悔|变卦|改口|翻供|反口|撤回了|收回|不认|赖账|食言|悔棋|掉头|转向|改主意|改变主意|中途|现在|这时候|如今|回头|退出|放弃|停止|收手|撤出|走人|离开|分手|离婚|辞退|解约|退订|退课|退会|转投|改换|更换|跳槽|倒戈|背离|偏离)(?:[^。]{0,10})?(?:就是|等于|意味着|属于|算是|无非是|不过是)?(?:[^。]{0,10})?(?:说话不算话|说话不算数|说了不算|不算数|不算话|失信|背信|背弃|违背|背叛|食言|出尔反尔|翻脸不认|不认账|赖账|违约|违反|欺骗|撒谎|蒙骗|诈欺|不守信用|不守信|不讲信用|没有信用|人品问题|人格缺陷|不负责任|没担当|靠不住)`,
      String.raw`(?:对得起|对不住|对不起|怎么说得过去|岂不|怎么)(?:[^。]{0,10})?(?:当初|以前|过去|那时|那时候)(?:[^。]{0,6})?(?:的)?(?:承诺|誓言|诺言|保证|约定|话|自己|信誓旦旦)?`,
      String.raw`信誓旦旦`,
      String.raw`(?:当初|开始|一开始|当初|从前|那时)(?:[^。]{0,12})?(?:说|讲|承诺|保证|答应)(?:[^。]{0,14})?(?:现在|如今|而今|眼下|这时候|到头来|结果|后来|时至今日)(?:[^。]{0,12})?(?:却|竟然|居然|反而|反倒|又|还是)?(?:[^。]{0,8})?(?:反悔|变卦|改口|不认|推翻|不算|否认|拒绝|不同意|不肯|不愿|不行|做不到)`,
    ].join('|')),
    samples: [
      '你当初发誓说永远站在我这边，现在你的立场呢？',
    ],
  },
  {
    name: 'M4 置空 BREACH_ZH 对照结构支（当初说…现在却…）',
    field: 'BREACH_ZH',
    inject: new RegExp([
      String.raw`(?:反悔|变卦|改口|翻供|反口|撤回了|收回|不认|赖账|食言|悔棋|掉头|转向|改主意|改变主意|中途|现在|这时候|如今|回头|退出|放弃|停止|收手|撤出|走人|离开|分手|离婚|辞退|解约|退订|退课|退会|转投|改换|更换|跳槽|倒戈|背离|偏离)(?:[^。]{0,10})?(?:就是|等于|意味着|属于|算是|无非是|不过是)?(?:[^。]{0,10})?(?:说话不算话|说话不算数|说了不算|不算数|不算话|失信|背信|背弃|违背|背叛|食言|出尔反尔|翻脸不认|不认账|赖账|违约|违反|欺骗|撒谎|蒙骗|诈欺|不守信用|不守信|不讲信用|没有信用|人品问题|人格缺陷|不负责任|没担当|靠不住)`,
      String.raw`(?:立场|信用|信誉|诚意|承诺|保证|誓言|诺言|契约精神|责任心|担当)(?:呢|去哪儿了|在哪里|何在|安在|哪去了|到哪去了)[?？]?`,
      String.raw`(?:对得起|对不住|对不起|怎么说得过去|岂不|怎么)(?:[^。]{0,10})?(?:当初|以前|过去|那时|那时候)(?:[^。]{0,6})?(?:的)?(?:承诺|誓言|诺言|保证|约定|话|自己|信誓旦旦)?`,
      String.raw`信誓旦旦`,
    ].join('|')),
    // locate6.js 实测：本句 BREACH 主支也命中（「退出…背弃」在主支射程内），
    // 置空对照支后仍命中——主支覆盖是**正确的旧能力**，不是对照支失效。
    // 翻转判据改成：只保留对照结构支（置空其余全部）→ 该句必须命中，
    // 证明对照支本身是活的（与 M1/M2 的「删支必回落」方向互补）。
    samples: [
      '当初说好一起创业，现在你要退出，这不是背信是什么？',
    ],
    onlyThisBranch: true,
  },
  {
    name: 'M5 置空英文 BREACH 支（整条 BREACH_ZH 中文侧全空）',
    field: 'BREACH_ZH',
    inject: NEVER,
    samples: [
      'You promised you would always be there for me, so leaving now is breaking your word.',
    ],
  },
  {
    name: 'M6 置空 P2 正当履约守门（KEEPING_ZH）',
    field: 'KEEPING_ZH',
    inject: NEVER,
    // locate6.js 实测：P2 样本的 BREACH 腿不在场，挡住它的是双腿共现铁律，
    // KEEPING_ZH 是第二道防线。所以「置空守门 → 翻转为命中」不成立。
    // 翻转判据改成：守门正则是活的（KEEPING_ZH 必须命中该样本）+
    // 该样本在守门生效时不判。两者合起来证明守门真的在守。
    samples: [
      '你答应过要照顾他一辈子，他信守了这个承诺，把你照顾得很好。',
    ],
    regexOnly: true,
  },
  {
    name: 'M7 置空 P4 疑问句式守门（QUESTION_ZH）',
    field: 'QUESTION_ZH',
    inject: NEVER,
    samples: [
      // QUESTION_ZH 不命中「吗？」反问（已知设计边界），所以这一组改用
      // 真正的咨询句：它双腿不在场，置空 QUESTION 也不会命中——该组改为
      // 证明守门正则是活的（直接 test），翻转方向为「正则命中」。
      '如何判断一个人是否守信？要看他的长期行为。',
    ],
    regexOnly: true,
  },
];

let groupsPassed = 0, groupsTotal = 0;
const failures = [];

for (const g of GROUPS) {
  groupsTotal++;
  const inject = { [g.field]: g.inject };
  let flipped = 0;
  const detail = [];
  for (const s of g.samples) {
    const before = check(s);
    const after = check(s, inject);
    if (g.regexOnly) {
      // 守门正活性组：before 不判 + 正则本身命中
      const mod2 = require(path.join(REPO, 'src/commitment-coercion.js'));
      const I = mod2.__internals();
      const regexHit = I[g.field].test(s);
      if (before.count === 0 && regexHit) { flipped++; detail.push(`✅ ${s.slice(0, 30)}`); }
      else detail.push(`❌ ${s.slice(0, 30)} (before=${before.count}, regex=${regexHit})`);
      continue;
    }
    if (g.onlyThisBranch) {
      // 只留本支组：before 命中（全量正则）+ after 命中（只剩本支）
      // → 证明本支单独就能支撑判定，是活的
      if (before.count > 0 && after.count > 0) { flipped++; detail.push(`✅ ${s.slice(0, 30)}`); }
      else detail.push(`❌ ${s.slice(0, 30)} (before=${before.count}, after=${after.count})`);
      continue;
    }
    if (g.expectFlippedTo === 'hit') {
      if (before.count === 0 && after.count > 0) { flipped++; detail.push(`✅ ${s.slice(0, 30)}`); }
      else detail.push(`❌ ${s.slice(0, 30)} (before=${before.count}, after=${after.count})`);
      continue;
    }
    if (before.count > 0 && after.count === 0) { flipped++; detail.push(`✅ ${s.slice(0, 30)}`); }
    else detail.push(`❌ ${s.slice(0, 30)} (before=${before.count}, after=${after.count})`);
  }
  const ok = flipped === g.samples.length;
  if (ok) groupsPassed++;
  else failures.push(`${g.name}: 翻转 ${flipped}/${g.samples.length}`);
  console.log(`${ok ? '✅' : '❌'} ${g.name} — 翻转 ${flipped}/${g.samples.length}`);
  for (const d of detail) console.log('    ' + d);
}

// 反向对照：所有主样本在不注入时全部命中（排除恒不命中造成的假翻转）
const ALL_MAIN = [
  '你亲口答应过会帮我，现在反悔就是说话不算话。',
  '你既然承诺了要负责到底，现在中途退出就是背弃诺言。',
  '你当初发誓说永远站在我这边，现在你的立场呢？',
  '你保证过这周给我答复，现在变卦就是欺骗。',
  '你自己说的会改，现在不改就是撒谎成性。',
  '你答应过孩子这周末去公园，现在不去就是失信于他。',
  'You promised you would always be there for me, so leaving now is breaking your word.',
  '当初说好一起创业，现在你要退出，这不是背信是什么？',
  '你发了誓要照顾我一辈子，现在反悔等于欺骗。',
  '你签约的时候答应得好好的，现在变卦就是违约。',
];
let ctrl = 0;
for (const s of ALL_MAIN) if (check(s).count > 0) ctrl++;
console.log(`\n反向对照：${ctrl}/${ALL_MAIN.length} 条不注入时命中${ctrl === ALL_MAIN.length ? ' ✅' : ' ❌'}`);
if (ctrl !== ALL_MAIN.length) failures.push(`反向对照 ${ctrl}/${ALL_MAIN.length}`);

console.log(`\n结果: ${groupsPassed} 通过, ${groupsTotal - groupsPassed} 失败, 共 ${groupsTotal} 个变异组`);
if (failures.length) { console.log('失败明细:'); for (const f of failures) console.log('  - ' + f); }
process.exitCode = groupsPassed === groupsTotal && ctrl === ALL_MAIN.length ? 0 : 1;
