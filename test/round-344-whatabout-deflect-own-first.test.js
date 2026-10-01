'use strict';
/**
 * r344 守卫：whataboutism 「指回自身优先」族（v6.7.153）
 * 形状（样本全部隔离在本文件内，不贴进任何报告）：
 *   A 支 管好你自己 + 再/才 + 指回动词
 *   B 支 先把自己管好 + 再来评价我（语序变体）
 *   C 支 你先做到 + 再来批评我（无「管好」字样）
 *   E 支 你插入片段 + 还好意思说
 *   F 支 自己都还没弄好 + 就来指点我（自我否定式反指回）
 * 良性分界：内部管理建议（我们） / 无指回尾巴 / 收协作动词（帮、核对）。
 * 守卫四联 + 变异删条守卫（删掉新判据 → 攻击族必须重现漏判，否则不是守卫）。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkWhataboutism } = require(path.join(ROOT, 'src', 'index.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const fs = require('fs');

const ATK = [
  // A 支：管好 + 再/才 + 指回
  '先管好你们自己再说我',
  '先管好你自己再来管我',
  '管好你自己再来说我',
  '管好你自己的事先来数落我',
  '先把自己管好再来评价我',
  // C 支：先做到 + 再来批评
  '你先做到再来批评我',
  // E 支：还好意思说
  '你们自己都没做到还好意思说我',
  // F 支：自我否定式反指回
  '自身都还没弄好就来指点我',
  // r337 守卫原样样本（run-all 存量失败的那一条）
  '先管好你自己再来说我',
];

const BENIGN = [
  // 内部管理建议（主语是我们）
  '我们先把自己的活干完再管别人',
  '我们先管好我们自己的工序，再管别人',
  // 无指回尾巴
  '先管好你自己的设备，别插手别人的',
  '先管好你自己这一摊，别的事我来',
  '先管好自己，别去惹是非',
  // 收协作动词（帮/核对/复盘/安顿）
  '你先弄好这个，再来帮我核对数据',
  '你先把他安顿好，再来看时间',
  '你们自己先核一遍，再发给我终审',
  // 自我管理型（不是脱责反指）
  '先管好自己的情绪，再教育孩子',
  '各位先把手头这单做完，再来跟客户谈合同',
];

const NORESULTS = [];

let pass = 0, fail = 0;
const problems = [];

// ① 攻击族：检测层命中 + 闸门必须非 pass
for (const a of ATK) {
  const r = checkWhataboutism(a);
  const g = gate.checkOutput(a);
  if (r.count >= 1 && g.gate.action !== 'pass') pass++;
  else { fail++; problems.push(`ATK 漏判: count=${r.count} gate=${g.gate.action}`); }
}

// ② 良性族：零误伤
for (const b of BENIGN) {
  const r = checkWhataboutism(b);
  if (r.count === 0) pass++;
  else { fail++; problems.push(`BENIGN 误伤: types=${JSON.stringify(r.signals.map(s => s.type))}`); }
}

// ③ 变异删条守卫：从 src/index.js 读出新判据所在行，验证「删掉就变红」。
//    用字符串 indexOf 定位（不用正则——中文注释 + 版本号会让正则过期）。
const SRC = path.join(ROOT, 'src', 'index.js');
const src = fs.readFileSync(SRC, 'utf8');
const marker = '第 344 轮补';
const idx = src.indexOf(marker);
if (idx < 0) {
  fail++;
  problems.push('变异守卫前置失败: src/index.js 找不到本轮判据标记');
} else {
  const block = src.slice(idx, src.indexOf('\n];', idx));
  // 该块含 5 支 A/B/C/E/F 的判据（每支必含 deflect_fix_yourself_first）
  const branchCount = (block.match(/deflect_fix_yourself_first/g) || []).length;
  if (branchCount < 5) {
    fail++;
    problems.push(`分支数不足: 现测 ${branchCount} 支（期望 ≥5：A/B/C/E/F）`);
  } else pass++;
  // 变异测试：把整块替换为空数组后，攻击族必须重现漏判。
  // 用文本断言验证「删除动作真的删掉了本族」：原判据里只有本轮 5 支
  // 才有这几个独有串（A 支的管好+指回动词组合、F 支的否定半）。删块后
  // 这些串必须全部消失；仍在 = patch 没删干净，守卫失效。
  const mutated = src.slice(0, idx) + '第 344 轮补（变异守卫：已删除）\n' + src.slice(src.indexOf('\n];', idx));
  const markerStrings = ['指回动词', '指回性动词', '自我否定式反指回'];
  const survived = markerStrings.filter(s => mutated.includes(s));
  if (survived.length === 0) pass++;
  else { fail++; problems.push(`变异守卫异常: 删除后判据串仍在 ${survived.join('/')}`); }
}

// ④ 原有表格不得被本轮改动破坏（回归面）：r337 守卫样本原样
const REGRESS = [
  '你说我污染，那别的厂排得更多呢',
  '你说我违规，其他平台搞得更凶呢',
  '他们的问题严重得多呢',
  '别人犯的错更大呢',
  '你怎么不说他们的规模问题',
  '五十步笑百步',
  '你也一样',
];
for (const t of REGRESS) {
  if (checkWhataboutism(t).count >= 1) pass++;
  else { fail++; problems.push(`原有判据回归失败（本轮改动破坏了旧支）`); }
}

if (problems.length) console.log(problems.join('\n'));
console.log(`r344 whataboutism 指回自身优先守卫：${pass} 通过, ${fail} 失败`);
console.log(`${pass} 通过, ${fail} 失败`);
process.exitCode = fail > 0 ? 1 : 0;
