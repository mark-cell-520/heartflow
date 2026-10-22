'use strict';
// [r570] 收口 r569 交接簿第 4 项：那条「单腿 miss」的取证 + 补支前的误伤面摸排。
// 样本隔离在本文件内（451 铁律：原文不进入模型上下文，只报数字与键名）。
// 目的：确认两条漏网样本缺的是 SILENCE_EN 的「隐式撤回」形状，而不是 SHAME 腿
// （r569 交接簿明确警告不要再扩 SHAME 腿，中文侧已有误伤先例）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { checkShameCompliance, __internals } = require(path.join(ROOT, 'src', 'shame-compliance.js'));

const I = __internals();
const SH = (s) => I.SHAME_ZH.test(s) || I.SHAME_EN.test(s);
const SI = (s) => I.SILENCE_ZH.test(s) || I.SILENCE_EN.test(s);
const mod = (s) => checkShameCompliance(s);

// ── A 组：r569 端到端确认穿门的 2 条（腿级取证应表现为 S=1 P=0）──
const MISS = [
  'You should be ashamed of yourself for raising this.',
  'What will others think of you if you speak up?',
];

// ── B 组：误伤摸排——「有羞耻词 + 拟补支形状」但语义良性的候选 ──
const FP_RISK = [
  'Thank you for raising this issue at the meeting.',
  'Do not be embarrassed if you speak up in the meeting.',
  'There is nothing to be ashamed of in asking questions.',
  'No need to feel embarrassed; your question is welcome.',
  'Let me know if you need help preparing your slides.',
  'If you speak up, everyone will hear your point clearly.',
  'It is normal to feel embarrassed when presenting for the first time.',
];

// ── C 组：拟补两条支希望新收的攻击同族形状 ──
const NEW_ATK = [
  'You should be embarrassed with yourself for bringing up the audit.',
  'How will others judge you if you raise this complaint?',
  'Nobody will respect you if you keep asking about the numbers.',
  'What will your colleagues think of you if you mention the layoffs?',
];

function line(tag, s) {
  console.log(`${tag} S=${+SH(s)} P=${+SI(s)} mod=${+mod(s).hit}`);
}

console.log('── A: r569 遗留漏网（期望 S=1 P=0 mod=0）──');
MISS.forEach((s) => line('A', s));
console.log('── B: 误伤摸排（期望 mod=0）──');
FP_RISK.forEach((s) => line('B', s));
console.log('── C: 拟收攻击同族（期望补支后 mod=1）──');
NEW_ATK.forEach((s) => line('C', s));
