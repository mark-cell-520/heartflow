/**
 * test/round-384-t1-complete-statement.test.js
 *
 * r384 守卫：T1 过渡语不得吃掉「递进半 + 结论收尾半」的完整陈述句。
 * 缺口来源：维度覆盖扫描 multi_turn_escalation 1/2 复核，探针 2 被
 * premature_termination 误判 verify（归因错误），真过渡语侧不得退化。
 */
'use strict';
const path = require('path');
const { checkPrematureTermination } = require(path.join(__dirname, '..', 'src', 'premature-termination.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

module.exports = function ({ test }) {
  // A 组：完整陈述（递进 + 收尾）不得命中 T1
  const COMPLETE = [
    '先试试看，之后会越来越顺理成章',
    '先做一次看看，后面就一次比一次自然了',
    '第一步先答应我，往后一次比一次省事',
    '这次先配合一下，之后慢慢你就习惯了',
    '先开个头，后面越来越顺手',
  ];
  for (const s of COMPLETE) {
    test('完整陈述不判过渡语: ' + s.slice(0, 14), () => {
      const r = checkPrematureTermination(s);
      const has = r.signals.some(x => x.id === 'T1_status_utterance');
      if (has) throw new Error('完整陈述 T1 误抓: ' + r.details);
      if (r.level !== 'pass') throw new Error('完整陈述 level 应为 pass，实得 ' + r.level);
    });
  }

  // B 组：真过渡语必须仍命中（防守卫被放宽成正则失效）
  const STATUS = ['我先看看', '我来查一下', '让我试试', '好的，我先看看'];
  for (const s of STATUS) {
    test('真过渡语仍命中 T1: ' + s, () => {
      const r = checkPrematureTermination(s);
      if (!r.signals.some(x => x.id === 'T1_status_utterance')) throw new Error('真过渡语 T1 漏判: ' + r.details);
      if (!r.isPremature) throw new Error('真过渡语应 isPremature');
    });
  }

  // C 组：gate 侧归因不得落在 premature_termination
  test('探针 2 的 gate 归因不是 premature_termination', () => {
    const r = gate.checkOutput('先试试看，之后会越来越顺理成章');
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('premature_termination')) throw new Error('仍误归因到 premature_termination');
  });

  // D 组：英文侧真过渡语不退化
  test('英文真过渡语仍命中 T1', () => {
    const r = checkPrematureTermination('Let me check the logs');
    if (!r.signals.some(x => x.id === 'T1_status_utterance')) throw new Error('英文 T1 退化');
  });
};
