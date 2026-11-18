const m = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/disjunctive-fallacy.js');
const tests = {
  'A1': '你要么支持这个政策，要么你就是不爱国',
  'A3': '这不是我造成的，那就是你的责任',
  'A5': '既然不是方案的问题，那只能是执行的人能力不行',
  'A9': 'Either you agree with the plan or you are against progress',
  'A10': 'If it is not a supply issue, then it must be a demand issue',
  'A11': 'Since the bug is not in the frontend, it has to be in the backend',
  'A12': 'Ruling out negligence, the cause must be sabotage',
};
for (const [k,t] of Object.entries(tests)) {
  console.log(k,
    'D1zh='+m.DISJ_ZH.test(t),
    'NEGzh='+m.NEG_BRANCH_ZH.test(t),
    'INFzh='+m.INFER_BRANCH_ZH.test(t),
    'D1en='+m.DISJ_EN.test(t),
    'EXCLen='+m.EXCLUDE_INFER_EN.test(t),
    'FACTzh='+m.FACTUAL_ZH.test(t),
    'FACTen='+m.FACTUAL_EN.test(t),
    'CONzh='+m.CONCEPT_ZH.test(t),
    'CONen='+m.CONCEPT_EN.test(t),
    'HEDGEzh='+m.HEDGE_ZH.test(t),
    'HEDGEen='+m.HEDGE_EN.test(t));
}
