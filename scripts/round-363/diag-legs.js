// r363-4：FOR_EVERY 是**正则数组**（按 .test() 迭代），删腿注入值应为
// [NULL_RE]（含永不匹配正则的数组），不是 NULL_RE 本体。
// 同时验证各删腿组对哪些样本真正承重（语种覆盖实证）。
const path = require('path');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { checkQuantifierScopeShift, __internals: I } = require(path.join(ROOT, 'src', 'quantifier-scope-shift.js'));
function hit(s, inj) { const r = checkQuantifierScopeShift(s, inj); return r.verdict !== 'pass'; }
const NULL_RE = /(?!x)x/;

const SAMPLES = {
  A1_ZH_族B: '对每个员工都有一个工位，所以存在一个工位是所有员工共用的。',
  A2_ZH_族A: '每个人都有自己的导师，所以有一个导师带所有人。',
  A3_EN: 'Every student has a mentor, so there is a mentor for every student.',
  A8_ZH_裸: '每户都分到了一袋米，所以有一袋米够全村吃。',
  A15_ZH_人称: '每位申请人都有一位推荐人，说明有一位推荐人能代表全体申请人。',
};

const GROUPS = {
  '腿①全称四表+FOR_EVERY': { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [], FOR_EVERY_ZH: [NULL_RE], FOR_EVERY_EN: [NULL_RE] },
  '腿①存在BARE_EXIST_ZH': { BARE_EXIST_ZH: [] },
  '腿②EXIST_ZH': { EXIST_ZH: [] },
  '腿②EXIST_EN': { EXIST_EN: [] },
  '腿③INFER_ZH全套': { INFER_ZH: [], INFER_ZH_REVERSE: [] },
  '腿③INFER_EN全套': { INFER_EN: [], INFER_EN_REVERSE: [] },
};
for (const [name, inj] of Object.entries(GROUPS)) {
  const row = [];
  for (const [tag, s] of Object.entries(SAMPLES)) row.push(`${tag}:${hit(s, inj) ? 'HIT' : 'flip'}`);
  console.log(name.padEnd(26), row.join(' '));
}
console.log('\nQUESTION_ZH 消费方式:');
console.log('  ZH 疑问「吗」探针 删QUESTION_ZH:', hit('每个人都有一位导师，所以有一个导师带所有人吗？', { QUESTION_ZH: [] }));
console.log('  ZH 疑问「吗」探针 删TAIL_RE:', hit('每个人都有一位导师，所以有一个导师带所有人吗？', { QUESTION_TAIL_RE: NULL_RE }));
console.log('  ZH 疑问「呢」探针 删QUESTION_ZH:', hit('是不是每位同学都对应同一个导师呢？', { QUESTION_ZH: [] }));
console.log('  ZH 疑问「呢」探针 删TAIL_RE:', hit('是不是每位同学都对应同一个导师呢？', { QUESTION_TAIL_RE: NULL_RE }));
