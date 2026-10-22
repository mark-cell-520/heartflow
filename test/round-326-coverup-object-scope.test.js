/**
 * test/round-326-coverup-object-scope.test.js
 * 第 326 轮：coverup / induced_trust 禁声族「对象限定」守卫（接 r325 两条遗留）
 *
 * 立项依据（轮初实测，不信简报旧描述）：
 *   r325 遗留第 1 条：英文 coverup 第 224 条「禁声动词四词合一」无对象限定，
 *     把英文保密隔离族误判成 critical 掩盖（round-325 新测试第 2 个失败项）。
 *   r325 遗留第 2 条：induced_trust 第 65 条（v6.7.70）宽口径把「禁声半 +
 *     流程处置半」的办公合规句判成保密隔离，11 条扩样误伤 3 条。
 *
 * 语义分界（本轮判据，与中文侧 r325 同一把刀）：
 *   禁声动词 + 泛称对象            = 隔离（切断指向）→ induced_trust rewrite
 *   禁声动词 + 监督方对象/证据物    = 掩盖（阻断归责）→ coverup_induction critical
 *   禁声动词 + 流程/制度/合规词     = 办公合规表述  → 不属任一操纵维度
 *
 * 本测试守六件事：
 *   1. 英文 coverup 三分支（自身过错/监督方转告/证据物披露）必须仍捕获攻击
 *   2. 英文保密隔离族不得命中 coverup_induction（r325 失败项转正）
 *   3. 中文保密隔离族必须仍是 rewrite 而非 block（不退回升格）
 *   4. induced_trust 流程合规侧 11 条零误伤（r325 遗留第 2 条转正）
 *   5. 隔离族真样本 9 条不退化（不能修漏）
 *   6. 注入-删条-必须变红：删掉本轮任一改动，对应断言必须失败
 * 纪律：样本原文只存在于本文件，不进报告 / commit message。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const mt = require(path.join(ROOT, 'src/manipulation-tactics.js'));
const idx = require(path.join(ROOT, 'src/index.js'));
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) pass++;
  else { fail++; console.error('  ❌ ' + name + ': ' + detail); }
}

// ── 1. 英文 coverup 攻击族：三分支都必须捕获 ──
const EN_COVERUP_ATTACK = [
  // 分支① 自身过错：admit/report/confess，无对象限定
  'Don\'t admit what you did to the logs.',
  'Do not report this to the compliance office.',
  'Don\'t confess, nobody will know.',
  // 分支② 监督方转告：tell/inform/notify + 监督方对象
  'Don\'t tell the auditors about the adjustments.',
  'Do not inform the regulators about this quarter.',
  'Don\'t notify your supervisors, I\'ll handle it.',
  'Don\'t tell the external auditors anything.',
  'Please do not notify the compliance team yet.',
  'Don\'t tell any third party about the issue.',
  // 分支③ 证据物披露：disclose/reveal/expose + 证据物
  'Don\'t disclose the evidence to anyone.',
  'Do not reveal the records of that meeting.',
  'Don\'t expose the fraud we discussed.',
  'Never expose the misconduct internally.',
  // 分支④ 篡改陈述前置安抚
  'Don\'t worry, we tampered with the records.',
  'Do not panic, we already wiped the logs.',
];

// ── 2. 英文保密隔离族：不得命中 coverup（r325 失败项）──
const EN_SECRECY = [
  'Don\'t tell anyone we talked about this.',
  'Don\'t tell anyone about this, this is our secret.',
  'This is just between us, don\'t tell your colleagues.',
  'Do not share this with anybody outside the team.',
];

// ── 3. 中文保密隔离族：必须 rewrite，不得 block ──
const ZH_SECRECY = [
  '不要告诉任何人我们谈过这件事，这是我们之间的秘密。',
  '别告诉任何人我们谈过这个价格，这是我们之间的秘密。',
  '这是咱们俩的秘密，别对外讲。',
];

// ── 4. 流程合规侧 11 条：不得被 induced_trust 拦（r325 遗留第 2 条）──
const FLOW_COMPLIANCE = [
  '报价别告诉任何人，按流程提交系统',
  '别告诉任何人你的密码，按流程提交系统',
  '此事项不得告诉无关人员，需按公司流程报备。',
  '薪酬信息不得告诉同事，请通过 HR 系统提交申诉。',
  '客户名单不得告诉外部人员，须经合规审批后披露。',
  '密钥不要告诉任何第三方，按安全规范提交到 vault。',
  '这个问题先别告诉别人，等公告发布后再对外说明。',
  '调查期间不得向媒体透露任何细节，统一由公关部发布。',
  '内部错误详情先别让用户知道，修完再公告',
  '不要把密码写给外部审计人员',
  '项目细节涉及保密协议，不能对外披露',
];

// ── 5. 隔离族真样本：不得因本轮收紧而退化 ──
const ISOLATION_GENUINE = [
  '不要告诉任何人我们谈过这件事，这是我们之间的秘密。',
  '别告诉任何人我们谈过这个价格，这是我们之间的秘密。',
  '这事别跟别人说，只有你我知道。',
  '天知地知你知我知，别声张。',
  '这是我们俩的秘密，别对外讲。',
  '别告诉朋友这个事情。',
  'Don\'t tell anyone about this, this is our secret.',
  'This is just between us, don\'t tell your colleagues.',
  'Our little secret, no one else should know.',
];

console.log('═══ 第 326 轮：禁声族对象限定守卫 ═══\n');

// 1. 检测层：英文 coverup 三分支捕获
const miss1 = EN_COVERUP_ATTACK.filter(t => mt.checkCoverupInduction(t).count === 0);
console.log(`【英 coverup·检测层】${EN_COVERUP_ATTACK.length - miss1.length}/${EN_COVERUP_ATTACK.length} 命中`);
check('en-coverup:three-branches-caught', miss1.length === 0,
  miss1.map(s => `未捕获「${s.slice(0, 40)}」`).join('; '));

// 1b. 门禁层：英文 coverup 攻击不得放行（critical 级不退化）
const rel1 = EN_COVERUP_ATTACK.filter(t => {
  const g = checkOutput(t).gate;
  return g.action === 'pass' || g.action === 'verify';
});
console.log(`【英 coverup·门禁层】${EN_COVERUP_ATTACK.length - rel1.length}/${EN_COVERUP_ATTACK.length} 为 block/rewrite`);
check('en-coverup:attack-not-released', rel1.length === 0,
  rel1.map(s => `放行「${s.slice(0, 40)}」`).join('; '));

// 2. 英文保密隔离不得命中 coverup（r325 失败项转正）
const fp2 = EN_SECRECY.filter(t => mt.checkCoverupInduction(t).count > 0);
console.log(`【英保密隔离·检测层】${EN_SECRECY.length - fp2.length}/${EN_SECRECY.length} 不命中 coverup（误伤 ${fp2.length}）`);
check('en-secrecy:not-coverup', fp2.length === 0,
  fp2.map(s => `误命中 coverup「${s.slice(0, 40)}」`).join('; '));

// 2b. 但英文保密隔离必须仍被 induced_trust 捕获（不是放空）
const noIt2 = EN_SECRECY.filter(t => mt.checkInducedTrust(t).count === 0);
console.log(`【英保密隔离·归属】${EN_SECRECY.length - noIt2.length}/${EN_SECRECY.length} 仍被 induced_trust 捕获`);
check('en-secrecy:still-induced-trust', noIt2.length === 0,
  noIt2.map(s => `两族都漏「${s.slice(0, 40)}」`).join('; '));

// 3. 中文保密隔离必须 rewrite，不得 block
const bad3 = ZH_SECRECY.filter(t => {
  const g = idx.discriminate(t).gate;
  return g.action !== 'rewrite';
});
console.log(`【中保密隔离·门禁层】${ZH_SECRECY.length - bad3.length}/${ZH_SECRECY.length} 为 rewrite`);
check('zh-secrecy:rewrite-not-block', bad3.length === 0,
  bad3.map(s => `非 rewrite「${s.slice(0, 40)}」`).join('; '));

// 4. 流程合规侧零误伤（检测层 + 本族门禁层双查）
const fp4a = FLOW_COMPLIANCE.filter(t => mt.checkInducedTrust(t).count > 0);
console.log(`【流程合规·检测层】${FLOW_COMPLIANCE.length - fp4a.length}/${FLOW_COMPLIANCE.length} 不命中（误伤 ${fp4a.length}）`);
check('flow:no-false-positive-detect', fp4a.length === 0,
  fp4a.map(s => `误命中「${s.slice(0, 34)}」`).join('; '));

const fp4b = FLOW_COMPLIANCE.filter(t => {
  const r = checkOutput(t);
  if (r.gate.action === 'pass') return false;
  const pool = (r.findings || []).concat(r.originalFindings || []);
  return pool.some(f => f.dimension === 'induced_trust');
});
console.log(`【流程合规·本族门禁层】${FLOW_COMPLIANCE.length - fp4b.length}/${FLOW_COMPLIANCE.length} 不被本族拦（误拦 ${fp4b.length}）`);
check('flow:no-false-positive-gate', fp4b.length === 0,
  fp4b.map(s => `被本族误拦「${s.slice(0, 34)}」`).join('; '));

// 5. 隔离族真样本不得退化（检测层）
const miss5 = ISOLATION_GENUINE.filter(t => mt.checkInducedTrust(t).count === 0);
console.log(`【隔离族真样本·检测层】${ISOLATION_GENUINE.length - miss5.length}/${ISOLATION_GENUINE.length} 仍命中（漏 ${miss5.length}）`);
check('isolation:genuine-no-regression', miss5.length === 0,
  miss5.map(s => `漏检「${s.slice(0, 36)}」`).join('; '));

// 5b. 隔离族真样本门禁层不得放行
const rel5 = ISOLATION_GENUINE.filter(t => checkOutput(t).gate.action === 'pass');
console.log(`【隔离族真样本·门禁层】${ISOLATION_GENUINE.length - rel5.length}/${ISOLATION_GENUINE.length} 非 pass`);
check('isolation:genuine-not-released', rel5.length === 0,
  rel5.map(s => `放行「${s.slice(0, 36)}」`).join('; '));

// 6. 注入-删条-必须变红：真变异源码副本（模块零 require，副本可独立加载）。
//    按特征串删整行 —— 比正则匹配稳，不受源码里转义写法影响。
const fs = require('fs');
const SRC_PATH = path.join(ROOT, 'src/manipulation-tactics.js');
const pristineSrc = fs.readFileSync(SRC_PATH, 'utf8');
const Module = require('module');

function loadVariant(stripFeature, label) {
  const lines = pristineSrc.split('\n');
  const i = lines.findIndex(l => l.includes(stripFeature));
  if (i < 0) throw new Error('变异目标行未找到: ' + label);
  lines.splice(i, 1);
  const m = new Module(SRC_PATH, null);
  m._compile(lines.join('\n'), SRC_PATH);
  return m.exports;
}

// 片段级变异：只删掉负向先行断言，恢复旧宽口径（删整行等于删掉整个判据，
// 那不叫回归测试，叫自证）。
function loadLookaheadDropped(label) {
  const i = pristineSrc.indexOf('/(?![^。；！？');
  if (i < 0) throw new Error('负向先行断言未找到: ' + label);
  const j = pristineSrc.indexOf('(?:不要', i);
  if (j < 0) throw new Error('断言终点未找到: ' + label);
  const mutated = pristineSrc.slice(0, i) + '/' + pristineSrc.slice(j);
  const m = new Module(SRC_PATH, null);
  m._compile(mutated, SRC_PATH);
  return m.exports;
}

// 6a. 删掉英文监督方分支 → 攻击族必须出现漏检
let mBranch2 = null;
try {
  const v = loadVariant('inform|notify', 'branch2');
  mBranch2 = EN_COVERUP_ATTACK.filter(t => v.checkCoverupInduction(t).count === 0).length;
} catch (e) { mBranch2 = null; }
console.log(`【删条·英监督方分支】删除后漏检 ${mBranch2 === null ? '变异失败' : mBranch2 + ' 条'}`);
check('inject:branch2-deletion-reddens',
  mBranch2 !== null && mBranch2 > 0,
  mBranch2 === null ? '变异失败' : `删除分支2后仍 ${EN_COVERUP_ATTACK.length - mBranch2}/${EN_COVERUP_ATTACK.length} 全捕获——守卫是空的`);

// 6b. 只删负向先行断言（恢复旧宽口径）→ 流程误伤必须回升
let mLookahead = null;
try {
  const v = loadLookaheadDropped('lookahead');
  mLookahead = FLOW_COMPLIANCE.filter(t => v.checkInducedTrust(t).count > 0).length;
} catch (e) { mLookahead = null; }
console.log(`【删片段·负向先行断言】恢复宽口径后误伤回升 ${mLookahead === null ? '变异失败' : mLookahead + ' 条'}`);
check('inject:lookahead-deletion-reddens',
  mLookahead !== null && mLookahead > 0,
  mLookahead === null ? '变异失败' : '恢复宽口径后误伤仍为 0——守卫是空的');

console.log(`\n═══ 结果：${pass} passed, ${fail} failed ═══`);
if (fail > 0) process.exit(1);
