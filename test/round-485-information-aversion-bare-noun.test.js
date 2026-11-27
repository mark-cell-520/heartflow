// r485 轮测：information_aversion 后缀剥离自查补腿（真升级②：已有维度的全新措辞家族）
// 新族：裸名词短句族（腿①信息在场 + 腿②回避，均取最裸形式，无任何修饰/从句）
// 判定结构与 r484 相同（双腿 AND + 同窗 + 豁免 + 否定守卫）。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src', 'information-aversion.js'));
const fn = mod.checkInformationAversion;

function hit(text) {
  const r = fn(text);
  return !!(r && r.hit);
}

module.exports = function ({ test }) {
  // ── A. 中文裸名词短句族（新措辞家族）──
  test('A1 结论即将被告知 + 拒绝知道', () => {
    if (!hit('结论即将被告知，我先拒绝知道。')) throw new Error('A1 未命中');
  });
  test('A2 再多看一次就能看到真相 + 选择不知道', () => {
    if (!hit('再多看一次就能看到真相，但我选择不知道。')) throw new Error('A2 未命中');
  });
  test('A3 报告在桌上 + 不打开', () => {
    if (!hit('报告在桌上，我不打开。')) throw new Error('A3 未命中');
  });
  test('A4 数字在手里 + 不看', () => {
    if (!hit('数字在我手里，我不看。')) throw new Error('A4 未命中');
  });
  // ── B. 英文裸名词短句族 ──
  test('B1 file on my desk + have not opened', () => {
    if (!hit('The file is on my desk, but I have not opened it.')) throw new Error('B1 未命中');
  });
  test('B2 do not show me the numbers yet', () => {
    if (!hit('Do not show me the numbers yet.')) throw new Error('B2 未命中');
  });
  test('B3 would rather stay ignorant', () => {
    if (!hit('The real numbers are available, but I would rather stay ignorant on this.')) throw new Error('B3 未命中');
  });
  test('B4 findings ready + choose not to read', () => {
    if (!hit('The findings are ready, but I choose not to read them.')) throw new Error('B4 未命中');
  });
  // ── C. 新族不得误伤边缘良性 ──
  test('C1 正确多因陈述（战争）不误伤', () => {
    if (hit('战争是多因共同造成的，不能简化为单一因素。')) throw new Error('C1 误伤');
  });
  test('C2 负面信息也要看不误伤', () => {
    if (hit('负面信息也是信息，先看完再决策。')) throw new Error('C2 误伤');
  });
  test('C3 报告下周才拿得到不误伤', () => {
    if (hit('报告下周才能拿到，我们先把不依赖它的部分推进。')) throw new Error('C3 误伤');
  });
  test('C4 委托风控不误伤', () => {
    if (hit('我把尽调交给风控，他们有专业判断。')) throw new Error('C4 误伤');
  });
  test('C5 EN 委托不误伤', () => {
    if (hit('The audit is with the risk team, who will escalate material findings.')) throw new Error('C5 误伤');
  });
  test('C6 EN 已知风险登记不误伤', () => {
    if (hit('We logged the unverified portion as a known risk.')) throw new Error('C6 误伤');
  });
  // ── D. 存量攻击不回归（r484 族仍在）──
  test('D1 存量攻击不回归：再查一轮不查', () => {
    if (!hit('我知道再查一轮能把风险看清楚，但还是不查了。')) throw new Error('D1 回归');
  });
  test('D2 存量攻击不回归：EN rather not look', () => {
    if (!hit('I know one more check would reveal the real risk, but I would rather not look.')) throw new Error('D2 回归');
  });
  // ── E. 单腿不判 ──
  test('E1 只有在场无回避不判', () => {
    if (hit('报告在桌上，我们下午讨论。')) throw new Error('E1 误判');
  });
  test('E2 只有回避无在场不判', () => {
    if (hit('我不想看任何东西。')) throw new Error('E2 误判');
  });
  test('E3 EN 裸 stay ignorant 无在场不判', () => {
    if (hit('I would rather stay ignorant on this.')) throw new Error('E3 误判');
  });
};
