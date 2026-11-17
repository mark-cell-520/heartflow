'use strict';
// r381 负例注入-删条核验：mode 键（命中→失守）/ guard 键（零命中→现形）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { detectLumpOfLabor } = require(path.join(ROOT, 'src', 'lump-of-labor.js'));

const INJECT_CASES = {
  // mode：删条前命中 → 删条后失守
  JOBS_ZH:       ['机器人每取代一个岗位，社会上就永久少一份工作，工作岗位的总数是固定的。', 'mode'],
  JOBS_EN:       ['Robots replacing one worker permanently destroy one job — the total pool of jobs is fixed.', 'mode'],
  FIXED_ZH_F1:   ['一个国家的工作岗位总数是固定的，这就是就业市场的铁律。', 'mode'],
  FIXED_ZH_F2:   ['机器人取代了工人的岗位，就业是零和博弈。', 'mode'],
  FIXED_ZH_F3:   ['效率每提高一分，岗位就永久减少一分。', 'mode'],
  FIXED_ZH_F4:   ['这活一个人干了，另一个人就没工作可干。', 'mode'],
  FIXED_ZH_F5:   ['延迟退休就是占着岗位不让，位置不腾出来，年轻人就没工作可干。', 'mode'],
  FIXED_EN_F1:   ['The total pool of jobs is fixed, no matter how much demand grows.', 'mode'],
  FIXED_EN_F2:   ['Robots replace workers and take jobs from locals.', 'mode'],
  FIXED_EN_F3:   ['The more efficient the factory, the fewer jobs the town has.', 'mode'],
  FIXED_EN_F4:   ['One immigrant filling a post means another worker must be unemployed.', 'mode'],
  WINDOW_ZH:     ['机器人取代了工人的岗位。……（中间隔很多字）……工作岗位的总数是固定的，就业零和。', 'mode'],
  WINDOW_EN:     ['Robots are taking over the factory floor across the whole country. ' + 'x'.repeat(10) + ' The total pool of jobs is fixed.', 'mode'],
  // guard：删守卫前零命中 → 删守卫后现形
  CONCEPT_ZH:    ['劳动总量谬误把就业总量讲成固定份额的争夺，机器人取代一个岗位就少一份工作。', 'guard'],
  CONCEPT_EN:    ['The classic lump-of-labor fallacy holds that the amount of work never changes: robots take jobs from locals, permanently.', 'guard'],
  CORRECT_ZH:    ['就业影响取决于需求去向，即便机器人抢走了工人的岗位。', 'guard'],
  CORRECT_EN:    ['Whether robots take jobs from locals depends on the demand structure of the local economy.', 'guard'],
  NEG_ZH:        ['并不是说机器人取代岗位就等于工作总量减少了，移民并不抢走本地人的饭碗。', 'guard'],
  NEG_EN:        ['It is not the case that efficiency gains destroy jobs.', 'guard'],
  HEDGE_ZH:      ['机器人取代岗位，这是经典误解。', 'guard'],
  HEDGE_EN:      ['People say robots take jobs from locals — a classic misconception.', 'guard'],
};

let ok = 0, bad = 0;
for (const [k, [t, kind]] of Object.entries(INJECT_CASES)) {
  const before = detectLumpOfLabor(t).hit;
  const after = detectLumpOfLabor(t, { [k]: /(?!)/i }).hit;
  if (kind === 'mode') {
    if (before === true && after === false) { ok++; console.log('OK  ' + k); }
    else { bad++; console.log('BAD ' + k + ' before=' + before + ' after=' + after + ' | ' + t.slice(0, 50)); }
  } else {
    if (before === false && after === true) { ok++; console.log('OK  ' + k); }
    else { bad++; console.log('BAD ' + k + ' before=' + before + ' after=' + after + ' | ' + t.slice(0, 50)); }
  }
}
console.log('注入 ' + Object.keys(INJECT_CASES).length + '：翻转 ' + ok + '，未翻转 ' + bad);
