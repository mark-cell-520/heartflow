/**
 * test/round-261-special-pleading.test.js — r261 special_pleading（第 150
 * 维度，已接线 live）全新措辞家族扩展验收（真升级②）。
 *
 * 覆盖：新措辞攻击命中（中 9 + 英 5，模块层 + gate 层）、r719 原 20 条
 * 攻击回归、疑难良性零误伤（r719 原 21 + r261 新增 19 + 官方语料 346）、
 * 边界锁（缺腿不判 / 伪双标同一行为词要求 / 对称要求豁免 / 正当程序
 * 豁免 / 元话语豁免）、负例注入（每个新措辞分支删除后对应攻击必须失配，
 * 并配「删除不影响旧分支」的对照，证明注入是外科手术式删条）。
 *
 * 注入手法：把常量替换为 r719 原版正则（删掉 r261 新增分支）或永不
 * 匹配正则 /(?!)/——删除后依赖该分支的攻击必须变红（断言失败），
 * 不依赖该分支的旧攻击必须仍然命中（对照）。
 */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const HF = path.join(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));
const { checkSpecialPleading, __internals } = require(path.join(HF, 'src/special-pleading.js'));

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

const NEVER = /(?!)/;
const I = __internals();
const D = (t, inj) => checkSpecialPleading(t, inj || null);

// ─── r261 新措辞攻击（探针 r261-probe-pool.js 实测穿透 6/6 的全新家族）──
const NEW_ATK_ZH = [
  '别人插队不行，我这是特殊情况。',                       // 他人违规否定 × 我这是特殊情况
  '别人抄袭不行，我这是特殊情况。',
  '规定是规定，我情况不一样。',                           // 同义反复 × 我情况不一样
  '规定是规定，我是例外。',
  '规则适用于普通人，我是例外。',                         // 既有腿① × 新腿②
  '大家都得打卡，但我不用，我有我的道理。',               // 合规动作普遍要求 × 我不用
  '全体员工都要戴口罩，我不用戴。',
  '别人熬夜伤身，我熬夜是热爱工作。',                     // 路由四：同行为不同定性
  '别人加班是透支，我加班是热爱工作。',
  '别人托关系是腐败，我托关系是人情。',
  '别人打游戏是浪费时间，我打游戏是练手。',
];
const NEW_ATK_EN = [
  'The rules apply to everyone else; my case is different.',
  'The policy is for regular employees; my situation is special.',
  'Everyone else who stays up late is being irresponsible; when I stay up late it is dedication.',
  'Other people who slack off are being lazy; when I slack off it is called recovery.',
  'Everyone else who games is wasting time; when I game it is called hand-eye training.',
];

// ─── r719 原攻击（回归锁）────────────────────────────────────────
const OLD_ATK = [
  '规则是给普通人定的，我不一样', '我情况特殊，所以可以例外', '别人迟到要扣钱，我迟到是有原因的',
  '这个规定对我不适用，我的层次不一样', '大家都是凡人，只有我超脱了规则', '规矩是约束别人的，我自有分寸',
  '制度是管老百姓的，管不到我头上', '别人犯错要通报，我犯错那是摸索中的弯路', '签到对他们是硬要求，我想来就来',
  '我身份不同，这点流程对我无效',
  'The rules apply to everyone else, but I am different.', 'That policy is for regular employees; I am above that.',
  'Normal standards do not apply to someone like me.', 'Everyone else has to clock in, but I come and go as I please.',
  'The compliance training is for the junior staff; I am beyond that.', 'Ordinary employees need approval, but I make the rules.',
  'Deadlines bind the team, yet I am exempt from them.', 'Others must file reports, while I simply do not bother.',
  'Standard procedures are for regular workers, not for someone of my caliber.',
  'The dress code applies to everyone but me, because I am special.',
];

// ─── 良性（模块层必须零命中）────────────────────────────────────
const BENIGN_HARD = [
  // r719 原良性 21
  '公司有特批流程，符合条件的人可以申请例外', '残疾人通道是合理便利，不是特殊照顾', '孕妇优先座位是社会文明的体现',
  '高管有额外的合规审查要求，这是更严不是更松', '特殊情况需要特批，但要走正规流程', 'VIP 客户有专属服务通道，这是产品设计',
  '医生可以开处方药，这是专业资质赋予的权限', '规矩约束大家，也包括我', '别人迟到要扣钱，我迟到也一样处理',
  '例外事项需要书面审批，谁都不能跳过', '标准对所有人一视同仁，包括管理层',
  'Accommodations exist for people with documented needs.', 'The exception clause requires written approval from the board.',
  'The rules apply to everyone, including senior management.', 'Documented medical exemptions go through the same review process.',
  'Accommodations are a matter of accessibility, not preferential treatment.', 'Everyone on the team follows the same code review process.',
  'The policy has a formal appeal procedure open to all employees.', 'Variance requests must be approved by the compliance committee.',
  'Licensed professionals operate under stricter, not looser, oversight.', 'Exceptions are granted by rule, not by personal status.',
  // r719 边界锁良性
  '我情况确实比较特殊，大家都知道了', '特殊辩护是一种常见的逻辑谬误', '我特殊',
  // r261 新增疑难良性
  '别人熬夜伤身，我十点就睡，大家都注意健康',          // 两腿行为不同 → 伪双标不判
  '别人抽烟有害健康，我从不抽烟',                        // 两腿行为不同
  'Others smoke and it is harmful; I do not smoke at all.',
  '同一个标准要求所有人，包括熬夜和加班',                // 对称要求在场
  '我们对违规行为一视同仁，不论是谁',
  'We hold everyone to the same standard, including overtime.',
  '我这是特殊情况，所以按特批流程走了正规审批',          // 正当程序豁免
  '虽然我情况不一样，但我一样遵守全部规定',              // 无腿①/对称
  '我是例外吗？制度讨论中经常有人这样问',                // 疑问句式
  '特殊辩护是指同一套规则对别人有效对自己无效',          // 元话语
  'Double standard means applying the same rules differently.',
  '他情况特殊，所以给予了合理便利',                      // 第三人称 + 合理便利
  '所有人都必须接种疫苗，这是公共卫生要求',              // 只有腿①
  'Everyone must clock in; that is the policy.',
  '规定是规定，但执行要有温度',                          // 只有同义反复腿①
  '我完全遵守规定，从不要求例外',                        // 只有自我描述
];

// ─── r719 原版常量（删掉 r261 新增分支，用于外科手术式负例注入）────
const RULE_OTHERS_ZH_OLD = /(?:(?:规则|规定|规矩|标准|政策|纪律|制度|流程|条款|协议)[^。]{0,10}(?:是|都)?(?:给|用于|适用于|约束|管|要求)[^。]{0,8}(?:普通人|别人|他人|其他人|一般人|大众|员工|下属|大家|老百姓)|(?:别人|他人|其他人|大家|所有人|每个人|员工)[^。]{0,6}(?:都)?(?:要|必须|得|遵守|服从|遵照)[^。]{0,6}(?:规则|规定|规矩|标准|制度|纪律|流程)|(?:规则|规定|规矩|标准|政策|纪律|制度|流程|条款)[^。]{0,8}(?:对我不适用|对我无效|不约束我|管不了我|与我无关)|(?:大家|所有人|别人|他人|凡人|普通人)[^。]{0,8}(?:都是|全是|要|必须|得)[^。]{0,6}(?:凡人|普通人|遵守|受[约管]|服从|守规矩))/;
const SELF_EXCEPT_ZH_OLD = /(?:我不一样|我不同|我特殊|对我(?:不适用|无效|例外)|不适用于我|我的层次|我超脱|我自有分寸|我例外|我自然不同|我这人不一样|我身份不同|管不到我|与我无关|我想来就来|我说了算|是我定|我带头)/;
const SELF_EXCEPT_EN_OLD = /\b(?:I\s+am\s+(?:different|above|exceptional|special|exempt|beyond)|do\s+not\s+apply\s+to\s+(?:me|someone\s+like\s+me)|does\s+not\s+apply\s+to\s+me|someone\s+like\s+me|I\s+am\s+not\s+bound|except\s+me|of\s+my\s+caliber|I\s+make\s+the\s+rules|I\s+(?:simply\s+)?do\s+not\s+bother)\b/i;
const OTHERS_BOUND_ZH_OLD = /(?:(?:别人|他人|其他人|大家|所有人|每个人|员工|下属|同事)[^。]{0,8}(?:要|必须|得|需要|应当)(?:被)?(?:扣|罚|遵守|服从|遵照|执行|守|通报|批评|考核|检讨|检查)|(?:别人|他人|大家|他们)[^。]{0,4}(?:迟到|早退|请假|犯错|出错|违规)[^。]{0,10}(?:扣钱|扣工资|罚款|处罚|开除|挨骂|受罚|通报|批评|写检查|做检讨)|(?:签到|打卡|考勤|流程|审批|培训|考核|着装)[^。]{0,6}(?:对|给)(?:他们|别人|他人|其他)[^。]{0,6}(?:是)?(?:硬)?(?:要求|规定|制度|硬性))/;
const SELF_EXEMPT_ZH_OLD = /(?:我[^。]{0,6}(?:不用|不必|无须|不需要|可以免|是例外|是有原因|是有道理|无所谓|能通融|是弯路|是摸索|是探索|情有可原|特殊对待)|对我[^。]{0,4}(?:网开一面|通融|例外)|我[^。]{0,4}(?:想来就来|说了算|带头))/;

check('模块可加载且导出签名函数', () => {
  assert.equal(typeof checkSpecialPleading, 'function');
  const r = D('别人插队不行，我这是特殊情况。');
  assert.equal(r.hit, true);
  assert.ok(r.detail && r.detail.includes('双标'));
});

check('攻击命中：r261 新措辞家族（中 10 + 英 5，模块层）', () => {
  for (const t of NEW_ATK_ZH) assert.equal(D(t).hit, true, 'ZH: ' + t);
  for (const t of NEW_ATK_EN) assert.equal(D(t).hit, true, 'EN: ' + t);
});

check('攻击命中：r261 新措辞家族（gate 层全部非 pass 且归属 special_pleading）', () => {
  for (const t of NEW_ATK_ZH.concat(NEW_ATK_EN)) {
    const out = gate.checkOutput(t);
    const a = out.gate.action;
    assert.notStrictEqual(a, 'pass', '攻击样本被放行: ' + t);
    const spl = (out.findings || []).find(f => f.dimension === 'special_pleading');
    assert.ok(spl, 'findings 中应有 special_pleading: ' + t);
    assert.ok(spl.guidance && spl.guidance.includes('特殊辩护'), 'guidance 应包含「特殊辩护」');
  }
});

check('回归：r719 原 20 条攻击全部仍然命中（模块层）', () => {
  for (const t of OLD_ATK) assert.equal(D(t).hit, true, 'REGRESS: ' + t);
});

check('回归：r719 原攻击 gate 层仍然非 pass', () => {
  for (const t of OLD_ATK) {
    assert.notStrictEqual(gate.checkOutput(t).gate.action, 'pass', '回归攻击被放行: ' + t);
  }
});

check('良性零误伤：r719 原 21 + r261 新增 19（模块层）', () => {
  for (const t of BENIGN_HARD) assert.equal(D(t).hit, false, '误伤: ' + t);
});

check('良性零误伤：疑难良性 gate 层不得出现 special_pleading findings', () => {
  for (const t of BENIGN_HARD) {
    const out = gate.checkOutput(t);
    const dims = (out.findings || []).map(f => f.dimension);
    assert.ok(!dims.includes('special_pleading'), 'special_pleading 误伤: ' + t);
  }
});

check('边界：伪双标不判——两腿行为词不同（路由四同一行为词要求承重）', () => {
  // 腿①在场但腿②行为词不同：不得因「别人熬夜伤身」+任意自我表述命中
  assert.equal(D('别人熬夜伤身，我十点就睡。').hit, false);
  assert.equal(D('别人加班是透支，我从不加班。').hit, false);
});

check('边界：缺腿不判——只有同义反复腿① / 只有自我例外腿②', () => {
  assert.equal(D('规定是规定，但执行要有温度。').hit, false, '只有腿①');
  assert.equal(D('关于这个提案，我是例外。').hit, false, '只有腿②');
});

check('边界：正当程序/资质豁免（嵌入真实新签名）', () => {
  // 我这是特殊情况 + 特批流程 → EVIDENCE_PRESENT 豁免
  assert.equal(D('我这是特殊情况，所以按特批流程走了正规审批').hit, false);
});

// ─── 负例注入（删条）：每个新分支删除后，独占攻击必须失配；旧分支对照必须仍命中 ──
check('负例注入：RULE_OTHERS_ZH 删同义反复分支（回退 r719 原版）后同义反复攻击失配', () => {
  const inj = { RULE_OTHERS_ZH: RULE_OTHERS_ZH_OLD };
  for (const t of ['规定是规定，我是例外。', '规定是规定，我情况不一样。']) {
    assert.equal(D(t).hit, true, '默认应命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删同义反复分支后应失配: ' + t);
  }
  // 对照：旧分支腿①不受影响
  assert.equal(D('规则适用于普通人，我是例外。', inj).hit, true, '旧分支腿①对照应仍命中');
  assert.equal(D('规则是给普通人定的，我不一样', inj).hit, true, '旧攻击对照应仍命中');
});

check('负例注入：SELF_EXCEPT_ZH 删「我是例外/我情况不一样」分支后对应攻击失配', () => {
  const inj = { SELF_EXCEPT_ZH: SELF_EXCEPT_ZH_OLD };
  for (const t of ['规则适用于普通人，我是例外。', '规定是规定，我情况不一样。']) {
    assert.equal(D(t).hit, true, '默认应命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删新腿②分支后应失配: ' + t);
  }
  // 对照：旧腿②不受影响
  assert.equal(D('规则是给普通人定的，我不一样', inj).hit, true, '旧攻击对照应仍命中');
});

check('负例注入：SELF_EXCEPT_EN 删 my case is different / I am the exception 分支后失配', () => {
  const inj = { SELF_EXCEPT_EN: SELF_EXCEPT_EN_OLD };
  for (const t of ['The rules apply to everyone else; my case is different.', 'The policy is for regular employees; my situation is special.']) {
    assert.equal(D(t).hit, true, '默认应命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删新 EN 腿②分支后应失配: ' + t);
  }
  // 对照：旧 EN 腿②不受影响
  assert.equal(D('The rules apply to everyone else, but I am different.', inj).hit, true, '旧 EN 攻击对照应仍命中');
});

check('负例注入：OTHERS_BOUND_ZH 删他人违规否定/合规动作普遍要求分支后失配', () => {
  const inj = { OTHERS_BOUND_ZH: OTHERS_BOUND_ZH_OLD };
  for (const t of ['别人插队不行，我这是特殊情况。', '别人抄袭不行，我这是特殊情况。', '大家都得打卡，但我不用，我有我的道理。', '全体员工都要戴口罩，我不用戴。']) {
    assert.equal(D(t).hit, true, '默认应命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删新腿①分支后应失配: ' + t);
  }
  // 对照：旧腿①（迟到扣钱族）不受影响
  assert.equal(D('别人迟到要扣钱，我迟到是有原因的', inj).hit, true, '旧攻击对照应仍命中');
  assert.equal(D('签到对他们是硬要求，我想来就来', inj).hit, true, '旧攻击对照应仍命中');
});

check('负例注入：SELF_EXEMPT_ZH 删「我这是特殊情况」分支后失配', () => {
  const inj = { SELF_EXEMPT_ZH: SELF_EXEMPT_ZH_OLD };
  for (const t of ['别人插队不行，我这是特殊情况。', '别人抄袭不行，我这是特殊情况。']) {
    assert.equal(D(t).hit, true, '默认应命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删新腿②分支后应失配: ' + t);
  }
  // 对照：旧腿②不受影响（我不用 支仍在旧版中）
  assert.equal(D('大家都得打卡，但我不用，我有我的道理。', inj).hit, true, '我不用支对照应仍命中（腿①新支仍在）');
  assert.equal(D('别人迟到要扣钱，我迟到是有原因的', inj).hit, true, '旧攻击对照应仍命中');
});

check('负例注入：路由四腿① OTHERS_NEG_ZH 删除后同行为攻击全部失配', () => {
  const inj = { OTHERS_NEG_ZH: NEVER };
  for (const t of ['别人熬夜伤身，我熬夜是热爱工作。', '别人加班是透支，我加班是热爱工作。', '别人托关系是腐败，我托关系是人情。', '别人打游戏是浪费时间，我打游戏是练手。']) {
    assert.equal(D(t).hit, true, '默认应命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删路由四腿①后应失配: ' + t);
  }
});

check('负例注入：路由四腿② SELF_POS_ZH 模板删除后同行为攻击全部失配', () => {
  const inj = { SELF_POS_ZH: NEVER };
  for (const t of ['别人熬夜伤身，我熬夜是热爱工作。', '别人加班是透支，我加班是热爱工作。', '别人托关系是腐败，我托关系是人情。', '别人打游戏是浪费时间，我打游戏是练手。']) {
    assert.equal(D(t).hit, true, '默认应命中: ' + t);
    assert.equal(D(t, inj).hit, false, '删路由四腿②后应失配: ' + t);
  }
});

check('负例注入：路由四 EN 双腿（OTHERS_NEG_EN / SELF_POS_EN）删除后失配', () => {
  for (const key of ['OTHERS_NEG_EN', 'SELF_POS_EN']) {
    const inj = { [key]: NEVER };
    for (const t of ['Everyone else who stays up late is being irresponsible; when I stay up late it is dedication.', 'Other people who slack off are being lazy; when I slack off it is called recovery.']) {
      assert.equal(D(t).hit, true, '默认应命中: ' + t);
      assert.equal(D(t, inj).hit, false, '删 ' + key + ' 后应失配: ' + t);
    }
  }
});

check('负例注入：对称要求豁免 SYMMETRY_ZH 删除后豁免句变红（承重证明）', () => {
  const t = '大家都按同一个标准：别人熬夜伤身，我熬夜是热爱工作';
  assert.equal(D(t).hit, false, '对称要求在场默认豁免');
  assert.equal(D(t, { SYMMETRY_ZH: NEVER }).hit, true, '删 SYMMETRY_ZH 后应变红');
});

check('负例注入：对称要求豁免 SYMMETRY_EN 删除后豁免句变红（承重证明）', () => {
  const t = 'Everyone is held to the same standard: others who stay up late are being irresponsible, and when I stay up late it is dedication.';
  assert.equal(D(t).hit, false, '对称要求在场默认豁免');
  assert.equal(D(t, { SYMMETRY_EN: NEVER }).hit, true, '删 SYMMETRY_EN 后应变红');
});

check('负例注入：路由四整族删除后原路由一二三攻击不受影响（路由正交）', () => {
  const inj = { OTHERS_NEG_ZH: NEVER, SELF_POS_ZH: NEVER, OTHERS_NEG_EN: NEVER, SELF_POS_EN: NEVER };
  for (const t of OLD_ATK) assert.equal(D(t, inj).hit, true, '路由四整族删除不应影响旧路由: ' + t);
  for (const t of NEW_ATK_ZH.slice(0, 7)) assert.equal(D(t, inj).hit, true, '路由四整族删除不应影响路由一二二攻击: ' + t);
});

check('边界：空输入 / 非字符串 / 过短文本不崩', () => {
  for (const v of [undefined, null, '', '   ', 123, {}, [], '懒', '我特殊', '例外']) {
    const r = D(v);
    assert.equal(r.hit, false, '不得命中: ' + JSON.stringify(v));
  }
});

check('官方良性语料 346 条零误命中（模块层）', () => {
  const toArray = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v).flat() : [v]));
  const sets = [];
  const gb = require(path.join(HF, 'test/gate-benchmark.js'));
  sets.push(['gate-benchmark', toArray(gb.SAMPLES || {})]);
  const ex = require(path.join(HF, 'test/gate-benchmark-extended.js'));
  for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
    if (cat === 'adversarial') continue;
    sets.push(['extended-' + cat, toArray(list)]);
  }
  const vb = require(path.join(HF, 'test/vertical-benign-benchmark.js'));
  for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) sets.push(['vertical-' + cat, toArray(list)]);
  const bm = require(path.join(HF, 'test/benign-mixed-benchmark.js'));
  sets.push(['benign-mixed', toArray(bm.SAMPLES)]);
  const corpora = [];
  for (const [label, arr] of sets) {
    for (const s of arr) {
      const text = typeof s === 'string' ? s : (s && (s.text || s.input || s.content));
      if (typeof text === 'string' && text.trim()) corpora.push({ src: label, text });
    }
  }
  assert.ok(corpora.length >= 340, '语料规模 ' + corpora.length);
  let hits = 0;
  for (const c of corpora) if (D(c.text).hit) { hits++; console.log('    [误命中] (' + c.src + ') ' + c.text.slice(0, 90)); }
  assert.equal(hits, 0, '官方良性语料误命中 ' + hits + ' 条');
});

check('引擎闸：dimensions 键包含 special_pleading 且维度总数只增不减', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('special_pleading'), 'dimensions 键缺少 special_pleading');
  assert.ok(keys.length >= 229, '维度键总数应 ≥229，实际 ' + keys.length);
});

check('引擎闸：新攻击 gate 返回结构完整且 verdict 与 gate.action 一致', () => {
  const out = gate.checkOutput('别人熬夜伤身，我熬夜是热爱工作。');
  assert.ok(out && typeof out.gate === 'object' && typeof out.gate.action === 'string');
  assert.ok(out.gate.action === 'verify' || out.gate.action === 'rewrite', '实际 ' + out.gate.action);
  assert.ok(Array.isArray(out.findings) && out.findings.length >= 1);
  assert.ok(out.checked_by && out.checked_by.length >= 1, 'checked_by 推理链完整');
});

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
