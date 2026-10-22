/**
 * scripts/negative-test-darvo.js
 *
 * [r713] 第 144 维度 darvo 负例脚本：逐一置空各常量（inject 参数方式，
 * 不写源文件），验证每条判据通路真的在承重——置空后对应样本必须
 * 改变判定结果（断言红），否则该常量是装饰。
 *
 * 注入纪律（r693/r701 同族）：**每条豁免注入样本必须双腿齐全**——
 * 摘掉豁免后样本要能凭自身双腿命中，否则"置空后仍不命中"证明的
 * 是豁免没在承重（假阴性），不是边界正确。
 *
 * 注入点与专属样本（每个样本让被摘的那条腿/豁免是唯一通路）：
 *   1. ACCUSE_ZH    置空 → 中文双腿样本（无排他）不再命中
 *   2. REVERSE_ZH   置空 → 中文双腿样本不再命中
 *   3. ACCUSE_EN    置空 → 英文双腿样本（无 not you）不再命中
 *   4. REVERSE_EN   置空 → 英文双腿样本不再命中
 *   5. EXCLUSIVE_ZH 置空 → 路由二样本（我才是受害者+而不是你）不再命中
 *   6. EXCLUSIVE_EN 置空 → 路由二样本（real victim+not you）不再命中
 *   7. MUTUAL_EXEMPT_ZH  置空 → 双腿+双向同判样本变误伤
 *   8. MUTUAL_EXEMPT_EN  置空 → 双腿+双向同判样本（EN）变误伤
 *   9. REPAIR_EXEMPT_ZH  置空 → 双腿+修复意向样本变误伤
 *   10. REPAIR_EXEMPT_EN 置空 → 双腿+修复意向样本（EN）变误伤
 *   11. THIRD_PERSON_EXEMPT 置空 → 双腿+第三人称样本变误伤
 *   12. META_NOUN 置空 → 双腿+概念名词样本变误伤
 *   13. META_EXEMPT 置空 → 期望不翻转（被 META_NOUN 超集兜底，
 *       单独置空保持不命中是预期形态——两条豁免叠加防护）
 */
'use strict';

const path = require('path');
const HF = path.resolve(__dirname, '..');
const { checkDarvo, __internals } = require(path.join(HF, 'src/darvo.js'));

// 空白正则（匹配空串——任何非空文本都不命中；豁免置空后恢复判定）
const BLANK = /(?!)/;

const INJECTIONS = [
  { name: 'ACCUSE_ZH 置空 → 中文双腿样本不再命中', kill: 'ACCUSE_ZH',
    sample: '你才是施暴者，别颠倒黑白',
    before: true, after: false,
    note: '腿①唯一通路：颠倒黑白；无排他，路由二不成立' },
  { name: 'REVERSE_ZH 置空 → 中文双腿样本不再命中', kill: 'REVERSE_ZH',
    sample: '你才是施暴者，别颠倒黑白',
    before: true, after: false,
    note: '腿②唯一通路：你才是施暴者；无排他，摘腿②后两路由都断' },
  { name: 'ACCUSE_EN 置空 → 英文双腿样本不再命中', kill: 'ACCUSE_EN',
    sample: 'You are the abuser here, stop playing the victim.',
    before: true, after: false,
    note: '腿①唯一通路：stop playing the victim；无 not you' },
  { name: 'REVERSE_EN 置空 → 英文双腿样本不再命中', kill: 'REVERSE_EN',
    sample: 'You are the abuser here, stop playing the victim.',
    before: true, after: false,
    note: '腿②唯一通路：you are the abuser；无排他' },
  { name: 'EXCLUSIVE_ZH 置空 → 路由二样本不再命中', kill: 'EXCLUSIVE_ZH',
    sample: '我才是真正的受害者，而不是你',
    before: true, after: false,
    note: '路由二唯一通路：受害者自称+排他；无腿①（无指控回应词）' },
  { name: 'EXCLUSIVE_EN 置空 → 路由二样本不再命中', kill: 'EXCLUSIVE_EN',
    sample: 'I am the real victim of this relationship, not you.',
    before: true, after: false,
    note: '路由二唯一通路：real victim + not you；无腿①' },
  { name: 'MUTUAL_EXEMPT_ZH 置空 → 双腿+双向同判样本变误伤', kill: 'MUTUAL_EXEMPT_ZH',
    sample: '你还有脸说我，我才是受害者，但我们互相都有责任',
    before: false, after: true,
    note: '豁免唯一通路：互相都有责任（双向同判）；双腿齐全（还有脸说我×我才是受害者）' },
  { name: 'MUTUAL_EXEMPT_EN 置空 → 双腿+双向同判样本（EN）变误伤', kill: 'MUTUAL_EXEMPT_EN',
    sample: 'You blame me, I am the victim, but we both got hurt.',
    before: false, after: true,
    note: '豁免唯一通路：both got hurt；双腿齐全（blame me × I am the victim）' },
  { name: 'REPAIR_EXEMPT_ZH 置空 → 双腿+修复意向样本变误伤', kill: 'REPAIR_EXEMPT_ZH',
    sample: '你别说这些了，我才是受害者，我们好好谈谈可以吗',
    before: false, after: true,
    note: '豁免唯一通路：好好谈谈；双腿齐全（说……×我才是受害者）' },
  { name: 'REPAIR_EXEMPT_EN 置空 → 双腿+修复意向样本（EN）变误伤', kill: 'REPAIR_EXEMPT_EN',
    sample: 'You blame me, but I am the victim here, and we should talk about it.',
    before: false, after: true,
    note: '豁免唯一通路：talk about it；双腿齐全（blame me × I am the victim）' },
  { name: 'THIRD_PERSON_EXEMPT 置空 → 双腿+第三人称样本变误伤', kill: 'THIRD_PERSON_EXEMPT',
    sample: '心理咨询师说，你还有脸说我，你才是伤害我的那个人',
    before: false, after: true,
    note: '豁免唯一通路：心理咨询师；双腿齐全（还有脸说我×你才是伤害我的那个人）' },
  { name: 'META_NOUN 置空 → 双腿+概念名词样本变误伤', kill: 'META_NOUN',
    sample: 'DARVO 的典型表现是，你还有脸说我的时候，其实你才是伤害我的那个人',
    before: false, after: true,
    note: '豁免唯一通路：概念名词（DARVO）；双腿齐全（还有脸说我×你才是伤害我的那个人）' },
  { name: 'META_EXEMPT 置空 → 期望不翻转（被 META_NOUN 超集兜底）', kill: 'META_EXEMPT',
    sample: 'DARVO 的典型表现是，你还有脸说我的时候，其实你才是伤害我的那个人',
    before: false, after: false,
    note: 'META_EXEMPT（带介入词的精确豁免）被 META_NOUN（概念名词裸引述）超集覆盖，单独置空保持不命中是两条豁免叠加防护的预期形态；承重证明由 META_NOUN 注入点完成' },
];

// ─── 基线：全部样本原样跑（inject 为空）────────────────────────
let basePass = 0, baseFail = 0;
for (const inj of INJECTIONS) {
  const hit = !!checkDarvo(inj.sample).hit;
  if (hit === inj.before) basePass++;
  else { baseFail++; console.log(`[基线FAIL] ${inj.name} :: ${JSON.stringify(inj.sample)} 期望 ${inj.before ? '命中' : '不命中'}，实际 ${hit ? '命中' : '不命中'}`); }
}
console.log(`基线: ${basePass} 通过, ${baseFail} 失败`);

// ─── 注入：逐一置空，断言判定结果翻转到 after ──────────────────
let injPass = 0, injFail = 0;
for (const inj of INJECTIONS) {
  const hit = !!checkDarvo(inj.sample, { [inj.kill]: BLANK }).hit;
  if (hit === inj.after) injPass++;
  else { injFail++; console.log(`[注入FAIL] ${inj.name} :: ${JSON.stringify(inj.sample)} 置空后期望 ${inj.after ? '命中' : '不命中'}，实际 ${hit ? '命中' : '不命中'}（该常量未承重）`); }
}
console.log(`注入: ${injPass} 通过, ${injFail} 失败`);

// ─── 崩溃检查：inject 传未知键不应抛错 ────────────────────────
try {
  checkDarvo('你才是施暴者，别颠倒黑白', { __unknown__: BLANK });
  console.log('未知注入键: 不崩溃');
} catch (e) {
  console.log('[FAIL] 未知注入键崩溃: ' + e.message);
  injFail++;
}

// ─── 内部常量可见性（证明 __internals 暴露了全部注入点）────────
const internals = __internals();
const exposed = INJECTIONS.every((i) => internals[i.kill]);
console.log(exposed ? '__internals 覆盖全部注入点' : '[FAIL] __internals 缺注入点');

const total = baseFail + injFail + (exposed ? 0 : 1);
console.log('结果: ' + (basePass + injPass) + ' 通过, ' + total + ' 失败, 共 ' + (basePass + baseFail + injPass + injFail + 1) + ' 个');
process.exit(total > 0 ? 1 : 0);
