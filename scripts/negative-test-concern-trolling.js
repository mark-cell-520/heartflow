/**
 * scripts/negative-test-concern-trolling.js
 *
 * [r714] 第 145 维度 concern_trolling 负例脚本：逐一置空各常量（inject
 * 参数方式，不写源文件），验证每条判据通路真的在承重——置空后对应
 * 样本必须改变判定结果（断言红），否则该常量是装饰。
 *
 * 注入纪律（r693/r701/r713 同族）：**每条豁免注入样本必须双腿齐全**——
 * 摘掉豁免后样本要能凭自身双腿命中，否则「置空后仍不命中」证明的
 * 是豁免没在承重（假阴性），不是边界正确。
 *
 * 注入点与专属样本（每个样本让被摘的那条腿/豁免是唯一通路）：
 *   1. CARE_ZH      置空 → 中文双腿样本（无排他）不再命中
 *   2. BELITTLE_ZH  置空 → 中文双腿样本不再命中
 *   3. CARE_EN      置空 → 英文双腿样本不再命中
 *   4. BELITTLE_EN  置空 → 英文双腿样本不再命中
 *   5. EXCLUSIVE_ZH 置空 → 路由二样本（关心你+别人谁愿意）不再命中
 *   6. THIRD_PERSON_EXEMPT 置空 → 双腿+第三人称样本变误伤
 *   7. META_NOUN    置空 → 双腿+概念名词样本变误伤
 */
'use strict';

const path = require('path');
const HF = path.resolve(__dirname, '..');
const { checkConcernTrolling, __internals } = require(path.join(HF, 'src/concern-trolling.js'));

// 空白正则（匹配空串——任何非空文本都不命中；豁免置空后恢复判定）
const BLANK = /(?!)/;

const INJECTIONS = [
  { name: 'CARE_ZH 置空 → 中文双腿样本不再命中', kill: 'CARE_ZH',
    sample: '我是为你好，才指出你这些问题的',
    before: true, after: false,
    note: '腿①唯一通路：为你好；无排他词，路由二不成立' },
  { name: 'BELITTLE_ZH 置空 → 中文双腿样本不再命中', kill: 'BELITTLE_ZH',
    sample: '我是为你好，才指出你这些问题的',
    before: true, after: false,
    note: '腿②唯一通路：你这些问题；摘腿②后路由一断，无排他词路由二也不成立' },
  { name: 'CARE_EN 置空 → 英文双腿样本不再命中', kill: 'CARE_EN',
    sample: 'I am only saying this because I care about you.',
    before: true, after: false,
    note: '腿①唯一通路：because I care' },
  { name: 'BELITTLE_EN 置空 → 英文双腿样本不再命中', kill: 'BELITTLE_EN',
    sample: 'I am only saying this because I care about you.',
    before: true, after: false,
    note: '腿②唯一通路：only saying this；摘腿②后路由一断' },
  { name: 'EXCLUSIVE_ZH 置空 → 路由二样本不再命中', kill: 'EXCLUSIVE_ZH',
    sample: '我这么说都是关心你，别人谁愿意跟你说这些',
    before: true, after: false,
    note: '路由二唯一通路：别人谁愿意；腿②无（无贬低内容词），摘排他后两路由都断' },
  { name: 'THIRD_PERSON_EXEMPT 置空 → 双腿+第三人称样本变误伤', kill: 'THIRD_PERSON_EXEMPT',
    sample: '心理咨询师说，你丈夫总是说为你好才批评你，这是典型的话术',
    before: false, after: true,
    note: '豁免唯一通路：心理咨询师；双腿齐全（为你好×批评你）；样本刻意不含「伪关心」字样，避免 META_NOUN 叠加兜底' },
  { name: 'META_NOUN 置空 → 双腿+概念名词样本变误伤', kill: 'META_NOUN',
    sample: '伪关心的典型表现是，父母说为你好才批评你，让孩子无法拒绝',
    before: false, after: true,
    note: '豁免唯一通路：概念名词（伪关心）；双腿齐全（为你好×批评你）' },
];

// ─── 基线：全部样本原样跑（inject 为空）────────────────────────
let basePass = 0, baseFail = 0;
for (const inj of INJECTIONS) {
  const hit = !!checkConcernTrolling(inj.sample).hit;
  if (hit === inj.before) basePass++;
  else { baseFail++; console.log(`[基线FAIL] ${inj.name} :: ${JSON.stringify(inj.sample)} 期望 ${inj.before ? '命中' : '不命中'}，实际 ${hit ? '命中' : '不命中'}`); }
}
console.log(`基线: ${basePass} 通过, ${baseFail} 失败`);

// ─── 注入：逐一置空，断言判定结果翻转到 after ──────────────────
let injPass = 0, injFail = 0;
for (const inj of INJECTIONS) {
  const hit = !!checkConcernTrolling(inj.sample, { [inj.kill]: BLANK }).hit;
  if (hit === inj.after) injPass++;
  else { injFail++; console.log(`[注入FAIL] ${inj.name} :: ${JSON.stringify(inj.sample)} 置空后期望 ${inj.after ? '命中' : '不命中'}，实际 ${hit ? '命中' : '不命中'}（该常量未承重）`); }
}
console.log(`注入: ${injPass} 通过, ${injFail} 失败`);

// ─── 崩溃检查：inject 传未知键不应抛错 ────────────────────────
try {
  checkConcernTrolling('我是为你好，才指出你这些问题的', { __unknown__: BLANK });
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
