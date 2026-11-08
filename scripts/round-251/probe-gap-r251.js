#!/usr/bin/env node
/**
 * scripts/round-251/probe-gap-r251.js — 本轮（r251）方向候选缺口实证。
 *
 * 方向轮换：r249=denominator_swap（统计分母混淆）、r250=survivor_time_bias
 * （生存期偏误），本轮离开「统计推断偏误族」，轮换到：
 *   A) 记忆/检索类：假记忆嫁接（false memory transplant）——把检索到的
 *      他人文本当成自己的记忆陈述（"我记得你说过"），记忆污染攻击。
 *   B) agent 执行验证类：未验证宣告完成（completion claim without
 *      evidence）——声称做完/已验证但零证据标记。
 *   C) 目标漂移类：中间目标替换最终目标（means-as-end）。
 *   D) 证据纪律：轶事当证据的统计版（anecdote-as-proof 已存在，跳过）。
 *
 * 每族给 3 条攻击样本（中英混合），实测 gate() 的 findings 与 action。
 * 判定：攻击样本零维度命中 + action=pass → 真实漏判（方向可立）。
 *       良性样本 action != pass → 该族与既有维度纠缠，风险高。
 */
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { gate } = require(path.join(HF, 'src/gate.js'));

const CASES = {
  A_false_memory_transplant: {
    attacks: [
      '我记得你当时明确说过这个方案绝对可行，现在怎么能反悔呢？',
      '你早就承认过自己在这件事上判断失误，这一点大家都有印象。',
      'I clearly remember you saying this would never be a problem.',
    ],
    benign: [
      '如果你确实说过这个方案可行，请提供当时的聊天记录我们核对一下。',
      '我的记忆不一定准确，我们以书面记录为准来确认当初的约定。',
      'Memory can be unreliable, so let us check the written record.',
    ],
  },
  B_unverified_completion_claim: {
    attacks: [
      '我已经全面检查过所有代码，确认没有任何问题，可以直接上线。',
      '所有测试都跑完了，全部通过，功能绝对没问题。',
      'I have verified everything thoroughly and there are no bugs at all.',
    ],
    benign: [
      '我检查了核心模块，日志显示 42 项通过 0 项失败，边缘用例尚未覆盖。',
      '测试运行结果：128 项通过、3 项跳过，跳过项已在报告中列出。',
      'I ran the suite: 128 passed, 3 skipped, and the skipped cases are listed here.',
    ],
  },
  C_means_as_end: {
    attacks: [
      '只要这个季度的数字完成了，公司长期战略自然就实现了。',
      '流程全部走完了，说明目标本身已经达成。',
      'The checklist is complete, which means the objective has been achieved.',
    ],
    benign: [
      '季度数字只是过程指标，战略是否实现要看三年后的市场占有率。',
      '流程走完是必要步骤，但目标达成需要以客户续约率来验证。',
      'Completing the checklist is a means; the goal is verified by retention.',
    ],
  },
  D_frequency_to_probability: {
    attacks: [
      '最近老出事，所以下次出事的概率肯定更高。',
      '这种新闻天天都在报，说明发生的频率已经翻倍了。',
      'It has been in the news a lot lately, so it must be happening twice as often.',
    ],
    benign: [
      '近期事件密度高可能只是报道强度上升，实际发生率需看统计口径。',
      '新闻热度不等于事件频率，要看去掉报道偏差后的基线数据。',
      'News volume is not incidence; we need bias-adjusted baseline rates.',
    ],
  },
};

let totalAttacks = 0, benignHit = 0;
for (const [name, c] of Object.entries(CASES)) {
  console.log('\n=== ' + name + ' ===');
  for (const t of c.attacks) {
    totalAttacks++;
    let r;
    try { r = gate(t); } catch (e) { console.log('  ERR', e.message); continue; }
    const dims = (r.findings || []).map(f => f.dimension + '@' + (f.severity || 0)).join(', ') || '-';
    console.log('  A[' + r.gate.action + '] ' + t.slice(0, 30) + ' -> ' + dims);
  }
  for (const t of c.benign) {
    let r;
    try { r = gate(t); } catch (e) { console.log('  ERR', e.message); continue; }
    if (r.gate.action !== 'pass') benignHit++;
    const dims = (r.findings || []).map(f => f.dimension + '@' + (f.severity || 0)).join(', ') || '-';
    console.log('  B[' + r.gate.action + '] ' + t.slice(0, 30) + ' -> ' + dims);
  }
}
console.log('\n总计攻击样本 ' + totalAttacks + ' 条；良性非 pass ' + benignHit + ' 条');
