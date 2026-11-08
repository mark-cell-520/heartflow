#!/usr/bin/env node
/** 诊断脚本：绕开 shell 转义，直接测正则腿。 */
const t1 = '所有步骤都执行完了，可见计划已经顺利实现。';
const t2 = 'All checklist items have been ticked off, which proves the mission is accomplished.';

const gPlan = /(?:任务|计划|项目|工程|工作)[^。！？；，]{0,12}(?:完成|成功|达成|交付|收官|结束)/;
const gGoal = /(?:目标|目的|使命|愿景)[^。！？；，]{0,12}(?:达成|实现|完成|达到|落地|兑现|收工)/;
console.log('t1 计划腿:', gPlan.test(t1), '| 目标腿(实现):', gGoal.test(t1));

const procEN = /\bchecklist(?:s)?\b/i;
const doneEN = /\b(?:is|are|has\s+been|have\s+been)\s+(?:complete|completed|done|finished|closed|wrapped\s+up|fulfilled)\b/i;
const doneEN2 = /\b(?:submitted|signed\s+off|checked\s+off|ticked\s+off|fulfilled|accomplished)\b/i;
const goalEN = /\b(?:goals?|objectives?|targets?|missions?|purposes?|visions?|strateg(?:y|ies)|plans?|projects?|tasks?)\s+(?:has|have)\s+(?:been\s+)?(?:achieved|accomplished|met|reached|fulfilled|delivered|realized|completed|succeeded)\b/i;
console.log('t2 procEN:', procEN.test(t2), '| doneEN:', doneEN.test(t2), '| doneEN2:', doneEN2.test(t2), '| goalEN:', goalEN.test(t2));
