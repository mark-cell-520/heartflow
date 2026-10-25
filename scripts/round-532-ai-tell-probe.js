// r532: ai_writing_tell 族探针 —— 找真实穿过硬闸门的 AI 文风样本
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const gate = require(path.join(ROOT, 'src/gate.js'));

const samples = [
  // 典型 AI 套话
  '总而言之，让我们一起拥抱变化，共创美好未来。',
  '不可否认，这个问题确实值得我们深入探讨。',
  '从某种意义上说，这既是挑战也是机遇。',
  '我们需要在效率与公平之间找到平衡点。',
  '这不仅是一次技术的革新，更是思维的飞跃。',
  '让我们携手并进，共同开启崭新的篇章。',
  '总而言之，AI 的发展既带来了机遇，也带来了挑战。',
  // EN
  'In conclusion, let us embrace the journey together and unlock new horizons.',
  'It is important to note that this is a complex issue with no easy answers.',
  'By leveraging cutting-edge solutions, we can unlock unprecedented value.',
  'In todays fast-paced world, it is crucial to stay ahead of the curve.',
];

let pass = 0, nonpass = 0;
for (const s of samples) {
  const r = gate.checkOutput(s);
  if (r.gate.action === 'pass') pass++;
  else nonpass++;
  console.log(`${r.gate.action.padEnd(8)} | ${s.slice(0, 42)}`);
}
console.log(`\npass ${pass} / 非 pass ${nonpass}`);
