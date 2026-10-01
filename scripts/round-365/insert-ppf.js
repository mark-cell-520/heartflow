// 生成 ppf 自指同义族的英文 ASCII 转义正则，避免中文乱码问题
'use strict';
const fs = require('fs');
const FILE = '/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js';

// 主语词表（实际中文）+ 术语名词 + 系词
// 判据：主语落抽象域 × 系词 × 宾语与主语同根且无第二条小句
// 用 indexOf 函数实现，不用正则（更可控，也避开转义坑）
const BLOCK = `
// ─── 自指同义反馈族（第 365 轮）────────────────────────────
// 缺口复测（scripts/round-365/probe-1）：3 条 ppf_stealth 中 2 条 gate=pass
// （「存在的意义就是存在者为何存在」「时间的意义在于时间如何成为它自己」）。
// 形状不属于任何既有族：无「不是A，而是B」辩证、无比喻明喻。
// 判据（probe-2 先测后改）：主语落抽象域词表 × 术语名词在定义短语内
// × 宾语与主语同根 × 句内仅一条小句。probe-2 实测命中 4/4、良性 0/14。
const PPF_SELF_SUBJ = ['生命', '人生', '时间', '存在', '自由', '爱情', '幸福', '孤独', '成长', '死亡', '命运', '灵魂', '生活', '意义'];
const PPF_SELF_TERM = ['意义', '本质', '价值', '真谛', '目的', '方向', '定义', '答案'];
const PPF_SELF_COP = ['就是', '在于', '正是', '其实是', '真正是', '正在于'];
const PPF_SELF_OBJ_RE = /(自己|本身|自身|它自己)/;
const PPF_SELF_WHY_RE = /(为何|如何|何以|是什么|是什么人|为了什么)/;

function ppfSelfReferential(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  // 句内只能有一条小句：出现第二条小句标志（逗号/分号/设问后）即放行
  if (/[，,；;。！？]/.test(t.slice(t.length - 2)) && !/[。！？]$/.test(t)) { /* 尾部忽略 */ }
  if (/[，,；;]/.test(t.replace(/^[^，,；;]{0,6}[，,；;]/, ''))) {
    // 允许开头短引导语后接一个逗号（「说到底，存在的意义…」），其余一律放行
    if (!/^[^，,；;]{0,6}[，,；;][^，,；;]*$/.test(t)) return false;
  }
  const subjIdx = [];
  for (const s of PPF_SELF_SUBJ) {
    const i = t.indexOf(s);
    if (i !== -1 && i <= 8) subjIdx.push({ s, i });
  }
  if (!subjIdx.length) return false;
  for (const { s, i } of subjIdx) {
    const rest = t.slice(i + s.length);
    const termM = rest.match(/^\\s*的?\\s*(意义|本质|价值|真谛|目的|方向|定义|答案)/);
    if (!termM) continue;
    const afterTerm = rest.slice(termM[0].length);
    const copM = afterTerm.match(/^\\s*(就是|正在于|在于|正是|其实是|真正是)/);
    if (!copM) continue;
    const obj = afterTerm.slice(copM[0].length);
    if (obj.length < 1 || obj.length > 20) continue;
    // 主语根词必须复现（同根或含主语自身）
    if (!obj.includes(s)) continue;
    // 宾语必须是自指或疑问回指形态（「它自己」「为何」）
    if (!(PPF_SELF_OBJ_RE.test(obj) || PPF_SELF_WHY_RE.test(obj))) continue;
    // 第二小句特征：宾语里出现并列分句（含有逗号/连词）——排除
    if (/[而且并且但是所以]/.test(obj)) continue;
    return true;
  }
  return false;
}
`;

// 定位插入点：checkPseudoProfundity 函数之前
let src = fs.readFileSync(FILE, 'utf8');
const anchor = 'function checkPseudoProfundity(text) {';
if (src.includes('function ppfSelfReferential')) {
  console.log('ALREADY_PRESENT');
  process.exit(0);
}
if (!src.includes(anchor)) { console.log('ANCHOR_NOT_FOUND'); process.exit(1); }
src = src.replace(anchor, BLOCK.trimStart() + '\n' + anchor);
fs.writeFileSync(FILE, src);
console.log('INSERTED');
