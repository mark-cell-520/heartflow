/**
 * r248-negation-inject.js — 负例注入验证（模块层，逐点删常量）
 * 每点独立运行：删掉该常量后，对应断言必须变红（断言失败而非加载崩溃）。
 * 全部通过 → 「注入 N 个点 → N 个按预期，0 个未按预期」。
 */
const { detectInverseGamblersFallacy: D } = require('../../../src/inverse-gamblers-fallacy.js');

const NEVER = /(?!x)x/;
const ZH_ATTACK = [
  '他一上场就进球，肯定是个身经百战的老将',
  '第一次开口就说到重点，这人肯定练了十年',
  '第一把就胡了，这桌肯定打了很多圈',
  '新号第一发就出金，这池子前面肯定垫了很久',
  '新店第一天就排队，背后肯定养了很久的客',
  '一枪就中，这靶前面肯定练过无数回',
  '他第一次出手就做成了，这样的身手背后没有几千次练习是练不出来的',
  '头一回上考场就拿了满分，这孩子之前不知道已经刷了多少套题',
  '刚开张就客流不断，说明这片市场他们早就铺垫了很久',
  '第一把就抽到了隐藏款，前面那些空抽一定已经垫够了次数',
  '头一次尝试就成功，可见之前失败过很多次',
  '第一把就中了，这个奖池前面肯定已经被抽空了好多次',
  '首发就破门，这名球员背后一定经历了上千场比赛的锤炼',
  '第一次抽奖就中了大奖，这个箱子之前肯定被抽空过很多次',
  '新官第一把火就烧成了，说明他之前已经失败了不知道多少回',
  '刚注册就抽到稀有卡，这账号池前面一定垫了很久',
  '第一发就命中靶心，可见之前已经练过无数发',
];
const EN_ATTACK = [
  'He scored on his first shot, so he must have been playing for years',
  'She nailed it on the first try, so the dice must have been rolled many times',
  'The machine paid out immediately, so it must have been building up for hours',
  'He hit the target on the first attempt, so the range must have been used a lot before',
  'It worked the very first time, so the process must have been running long before we arrived',
  'The rookie scored on debut, which means he must have put in thousands of hours already',
  'The first spin hit the jackpot, so the machine must have been primed for hours',
  'She solved it on the first attempt, which means the puzzle must have been attempted thousands of times',
  'He aced the exam on his first try, so he must have failed it many times before',
  'She won the lottery on her very first ticket, so she must have been buying tickets for years',
];
// 仅由即时成功复合形兜底捕获的句子（双腿链外的兜底层）
const IMM_ZH = ['第一把就出金，这池子肯定空了不知道多少'];
const IMM_EN = ['The machine paid out immediately, so it must have been building up for hours'];

const zh = (inj) => ZH_ATTACK.filter((t) => D(t, inj).hit).length;
const en = (inj) => EN_ATTACK.filter((t) => D(t, inj).hit).length;
const immZh = (inj) => IMM_ZH.filter((t) => D(t, inj).hit).length;
const immEn = (inj) => IMM_EN.filter((t) => D(t, inj).hit).length;

// 守卫承重句（原判据拦下；删守卫后必须变命中）
const GUARDED = [
  '他第一次出手就做成了，因为没有几千次练习是练不出来的',
  '第一次面试就通过，因为肯定准备了很久',
  'He scored on his first shot, because he must have been playing for years',
  '他第一次出手就做成了，但他之前没有失败过很多次',
  '逆赌徒谬误指的是他一上场就进球，肯定是个身经百战的老将',
  'The inverse gambler fallacy is illustrated by: he scored on his first shot, so he must have been playing for years',
  '第一次就成功，只是运气，肯定不是之前失败过很多次',
  'He scored on his first shot. It could be just luck, but the process must have been running for years',
  '第一次就成功，可能说明之前失败过很多次',
  'She won on her first try, so perhaps the dice must have been rolled many times',
];
const guarded = (inj) => GUARDED.filter((t) => D(t, inj).hit).length;
const guardedBase = guarded(undefined);
const zhBase = zh(undefined);
const enBase = en(undefined);

const POINTS = [
  ['腿① FIRST_ZH 整族删除', () => zh({ FIRST_ZH: [], IMMEDIATE_ZH: NEVER }) === 0],
  ['腿① FIRST_EN 整族删除', () => en({ FIRST_EN: [], IMMEDIATE_EN: NEVER }) === 0],
  ['腿① OUTCOME_ZH 结果词族删除', () => zh({ OUTCOME_ZH: [], IMMEDIATE_ZH: NEVER }) === 0],
  ['腿① OUTCOME_EN 结果词族删除', () => en({ OUTCOME_EN: [], IMMEDIATE_EN: NEVER }) === 0],
  ['腿② PROCESS_ZH 整族删除', () => zh({ PROCESS_ZH_TIGHT: [], PROCESS_ZH_LOOSE: [], IMMEDIATE_ZH: NEVER }) === 0],
  ['腿② PROCESS_EN 整族删除', () => en({ PROCESS_EN_TIGHT: [], PROCESS_EN_LOOSE: [], IMMEDIATE_EN: NEVER }) === 0],
  ['腿② PROCESS_ZH_TIGHT 单独删除', () => zh({ PROCESS_ZH_TIGHT: [], IMMEDIATE_ZH: NEVER }) < zhBase],
  ['腿② PROCESS_ZH_LOOSE 单独删除', () => zh({ PROCESS_ZH_LOOSE: [], IMMEDIATE_ZH: NEVER }) < zhBase],
  ['腿② PROCESS_EN_TIGHT 单独删除', () => en({ PROCESS_EN_TIGHT: [], IMMEDIATE_EN: NEVER }) < enBase],
  ['腿② PROCESS_EN_LOOSE 单独删除', () => en({ PROCESS_EN_LOOSE: [], IMMEDIATE_EN: NEVER }) < enBase],
  ['IMMEDIATE_ZH 即时复合形删除（兜底层）', () => immZh({ IMMEDIATE_ZH: NEVER }) === 0],
  ['IMMEDIATE_EN 即时复合形删除（兜底层）', () => immEn({ IMMEDIATE_EN: NEVER }) === 0],
  ['INFER_ZH 推断标记删除', () => zh({ INFER_ZH: NEVER, IMMEDIATE_ZH: NEVER }) < zhBase],
  ['INFER_EN 推断标记删除', () => en({ INFER_EN: NEVER, IMMEDIATE_EN: NEVER }) < enBase],
  ['W_FIRST_OUT_ZH 窗收紧到 0', () => zh({ W_FIRST_OUT_ZH: 0 }) < zhBase],
  ['W_FIRST_OUT_EN 窗收紧到 0', () => en({ W_FIRST_OUT_EN: 0 }) < enBase],
  ['W_PAIR_ZH 窗收紧到 0', () => zh({ W_PAIR_ZH: 0 }) < zhBase],
  ['W_PAIR_EN 窗收紧到 0', () => en({ W_PAIR_EN: 0 }) < enBase],
  ['CAUSAL_ZH 因果守卫删除', () => guarded({ CAUSAL_ZH: NEVER }) > guardedBase],
  ['CAUSAL_EN 因果守卫删除', () => guarded({ CAUSAL_EN: NEVER }) > guardedBase],
  ['NEG 否定守卫删除（中英）', () => guarded({ NEG_BEFORE_ZH: NEVER, NEG_BEFORE_EN: NEVER, NEG_INSIDE_ZH: NEVER }) > guardedBase],
  ['CONCEPT 豁免删除（中英）', () => guarded({ CONCEPT_ZH: NEVER, CONCEPT_EN: NEVER }) > guardedBase],
  ['CORRECTIVE 豁免删除（中英）', () => guarded({ CORRECTIVE_ZH: NEVER, CORRECTIVE_EN: NEVER }) > guardedBase],
  ['HEDGE 豁免删除（中英）', () => guarded({ HEDGE_ZH: NEVER, HEDGE_EN: NEVER }) > guardedBase],
];

console.log(`基线：中文攻击命中 ${zhBase}/${ZH_ATTACK.length}；英文攻击命中 ${enBase}/${EN_ATTACK.length}；守卫承重句基线命中 ${guardedBase}/${GUARDED.length}`);
let ok = 0; let bad = 0;
for (const [name, check] of POINTS) {
  let pass = false; let err = '';
  try { pass = check(); } catch (e) { err = String((e && e.message) || e); }
  if (pass) { ok++; console.log(`  [OK]   ${name}`); }
  else { bad++; console.log(`  [FAIL] ${name} → 未按预期 ${err}`); }
}
console.log(`\n注入 ${POINTS.length} 个点 → ${ok} 个按预期，${bad} 个未按预期`);
