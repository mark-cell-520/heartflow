// r532: 中文 AI 套话模板族探针 —— 纯中文（无英文词）样本穿过硬闸门的比例
// 背景：ai-writing-tell.js 的判据族几乎全为英文句型；中文侧只有
//   zh-en-mixing（要求中文锚 + 英文词共现）。纯中文 AI 套话零覆盖。
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const ROOT = __HF;
const gate = require(path.join(ROOT, 'src/gate.js'));
const awt = require(path.join(ROOT, 'src/shield/ai-writing-tell.js'));

// 攻击侧：典型中文 AI 套话模板（不含任何英文词）
const attacks = [
  '总而言之，让我们一起拥抱变化，携手共创美好未来。',
  '综上所述，我们既要看到挑战，更要抓住机遇。',
  '让我们携手并进，共同开启崭新的篇章。',
  '这不仅是一次技术的革新，更是思维的飞跃。',
  '在这个快速发展的时代，我们必须不断学习和进步。',
  '不可否认，这个问题确实值得我们深入探讨。',
  '从某种意义上说，这既是挑战，也是机遇。',
  '我们要在效率与公平之间找到平衡点。',
  '未来，我们将继续努力，为客户创造更大价值。',
  '只有不断突破自我，才能迎来更加辉煌的明天。',
  '这一举措标志着我们进入了全新的发展阶段。',
  '相信在大家的共同努力下，我们一定能够取得成功。',
];

// 良性侧：正常中文（不含 AI 套话模板）
const benign = [
  '昨天下午三点，项目组在二号会议室开了评审会，讨论了接口超时问题。',
  '本季度销售额同比下降 12%，主要原因是华东区经销商回款周期变长。',
  '他把车停在巷口，走进那家开了二十年的面馆，点了一碗牛肉面。',
  '实验结果显示，第三组样本的酶活性比对照组高出 1.8 倍。',
  '请在下周一之前提交你的周报，直接发到我的邮箱就行。',
  '这座桥建于 1997 年，桥面宽 9 米，是当时县城最宽的公路桥。',
  '会议决定：暂缓二期工程，先完成地基加固再评估预算。',
  '孩子今年上小学三年级，数学成绩中等，语文阅读能力偏弱。',
  '医生建议先做两周理疗，如果疼痛没有缓解再考虑影像检查。',
  '这批零件的批次号是 20241008，抽检发现两件尺寸超差。',
  '他每天早上六点起床，先跑步五公里，然后去市场买菜。',
  '论文第三章用回归模型检验了三个假设，其中两个不显著。',
];

let aPass = 0, aNon = 0;
for (const t of attacks) {
  const r = gate.checkOutput(t);
  const d = awt.detect(t);
  if (r.gate.action === 'pass') aPass++; else aNon++;
  console.log(`[${r.gate.action}] fams=${d.familiesHit} score=${d.score.toFixed(2)} | ${t.slice(0, 30)}`);
}
let bFp = 0;
for (const t of benign) {
  const r = gate.checkOutput(t);
  const d = awt.detect(t);
  if (r.gate.action !== 'pass') bFp++;
  console.log(`[benign ${r.gate.action}] fams=${d.familiesHit} score=${d.score.toFixed(2)} | ${t.slice(0, 30)}`);
}
console.log(`\n攻击穿过硬闸门(gate=pass): ${aPass}/${attacks.length}`);
console.log(`良性误伤: ${bFp}/${benign.length}`);
