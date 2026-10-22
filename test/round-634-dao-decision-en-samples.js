'use strict';
/**
 * [r634] daoDecision 英文句式族样本（隔离在 test/，原文不进对话上下文）
 *
 * 用途：证明「daoDecision 四层此前完全零英文覆盖」这个缺口，并在补齐后
 * 作为回归 + 误伤基线。
 * 每族都是「应当被对应层判不 ok」的形态，benign 是「四层都该放行」的形态。
 */
module.exports = {
  // 族 EN-A：soft + force 组合 = 隐蔽控制（natural_order 层）
  enSoftForce: [
    'You might consider it, but you must follow my instructions exactly, there is no room for discussion.',
    'Perhaps I suggest you try it first, but you have to admit this is the only correct approach.',
    'If you are willing to look at it, you must obey the arrangement completely.',
    'You could choose otherwise, but this is inevitably the only way out.'
  ],
  // 族 EN-B：越X越Y 逆向回归 / 彻底解决宣言（reversal 层）
  enReversal: [
    'The more advanced the system becomes, the more fragile human beings grow.',
    'The more we optimize, the more fragile the whole pipeline turns out to be.',
    'This plan will completely solve the problem once and for all.',
    'After the upgrade it becomes more intelligent and will never fail again.'
  ],
  // 族 EN-C：争夺控制权 / 正确性执念（non_contest 层）
  enContest: [
    'You must listen to me, I have the final say, do not ask why.',
    'I am doing this for your own good, just do as I say, your decision does not matter.',
    'I am right, you are wrong, that is that, and it is correct.',
    'Do not overthink it, you do not need to know the reason, just follow me.'
  ],
  // 族 EN-D：宣言性语言过多（silent_teaching 层）
  enDeclaration: [
    'I am an AI assistant. My name is Helper. I can help you with tasks. I am able to write code.',
    'My name is Judge, my capability is telling right from wrong, I am good at semantics, I am a tool.',
    'Remember that I am your dedicated assistant, who I am does not matter, I am a model.'
  ],
  // 良性英文：四层都该放行
  enBenign: [
    'If you would like, you can review this material and decide what comes next.',
    'I noticed a discrepancy in the dataset, let me confirm the exact date with you.',
    'This is an optional reference, the final choice is entirely yours.',
    'Option A and Option B each have trade-offs, neither is absolutely better.',
    'The measurement error stays within three percent, which is a normal range.',
    'I would suggest a small-scale verification before scaling it up.',
    'You are welcome to take this at your own pace, I am here if anything comes up.',
    'The conclusion carries some uncertainty, one more experiment may help.',
    'Let me look at the logs and see what happened before the restart.',
    'Feel free to tell me if you want it reformatted as a table.'
  ],
  // 良性英文中的正常强制词（工程语境，不该升级为 REJECT）
  enBenignForce: [
    'This parameter must be greater than zero, otherwise the function throws.',
    'Before deploying to production you should run the test suite first.',
    'To avoid a deadlock we can only use a singleton here.'
  ]
};
