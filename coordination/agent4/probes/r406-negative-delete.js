// r406 逐条删条负例验证（全样本覆盖版）：对本轮每个新模式，单独删掉它
// （R 参数注入过滤后数组），断言守卫必须变红——即至少一条攻击样本从
// hit:true 翻成 hit:false（豁免组则为良性否定样本从放行转命中）。
// 判定标准与 r405 一致：变红=该模式承重；不变红=装饰（必须修剪或报告）。
'use strict';
const mod = require('/data/home/heartflow/src/argument-to-moderation.js');
const { checkArgumentToModeration } = mod;
const I = mod.__internals();

const ATTACK = [
  // ── 原有 10 条（探针 F4 同源）──
  '这件事两个人都有责任，各打五十大板，谁也别怨谁',
  '车祸双方各让一步，五五开，谁都别怪谁',
  '公说公有理婆说婆有理，责任对半分才算公允',
  '投诉方和被投诉方各有过错，折中处理就是各退一步',
  'Both drivers were at fault, so splitting the blame 50-50 is fair.',
  'One side exaggerated, but the other side overreacted; meet in the middle.',
  '与其争谁对谁错，不如各让半步，把事情按五五分定了',
  '打架是双方的错，各记过一次，这就是最公正的',
  'Truth is usually halfway between the two versions of the story.',
  '一个说我偷了东西，一个说没偷，那就算我偷了一半吧',
  // ── r406 扩样：逐模式承重覆盖（每条为对应新模式造唯一承重样本）──
  '双方都有错，各打五十大板，这事就这么定',                                  // BLAME_ZH 都有错族
  '责任一人一半，谁也别怪谁',                                                // SPLIT_ZH 一人一半族
  '两家公司均摊责任，事情就算翻篇',                                          // SPLIT_ZH 均摊族
  '双方责任各退一步，事情就算了结',                                          // SPLIT_ZH 各退一步族
  '责任问题折中处理，双方都接受这个方案',                                    // SPLIT_ZH 折中处理族
  'He accused her of starting it, so splitting the fault 50-50 is fair.',    // BLAME_EN accus
  'The complaint and the response both have merit; the fairest outcome is 50-50.', // BLAME_EN complaint
  'The dispute has two sides, so let us split the responsibility.',          // BLAME_EN dispute
  'They quarreled about the bill, so they agreed to split it 50-50.',        // BLAME_EN quarrel
  'The fight was mutual, so splitting the blame evenly is fair.',            // BLAME_EN fight
  'The lawsuit could go either way, so splitting the fault fifty-fifty is reasonable.', // BLAME_EN lawsuit
  'Both parties were wrong, so the fairest outcome is 50-50.',               // BLAME_EN both...were wrong
  'Both sides share the responsibility, so a 50-50 split is only fair.',     // BLAME_EN share the
  'Both sides are responsible, so the split should be 50-50.',               // BLAME_EN both...responsible
  'Both drivers were at fault, so 50-50 is the fair outcome.',               // SPLIT_EN 50-50
  'Both drivers were at fault, so a fifty-fifty split is fair.',             // SPLIT_EN fifty-fifty
  'Both drivers were at fault, so we are splitting the blame.',              // SPLIT_EN splitting the blame
  'Both sides are at fault, and that is the fairest reading.',               // SPLIT_EN both...at fault（非 equally 形）
  'One driver is to blame, the other is half the blame.',                    // SPLIT_EN half the blame
  'The two are equally to blame and equally responsible.',                   // SPLIT_EN equally to blame（无 both-sides 前缀）
  'The dispute was mutual, so let us split the difference.',                 // SPLIT_EN split the difference
  'After the fight they decided to call it even.',                           // SPLIT_EN call it even
];

// 豁免组删条探针（良性否定样本：删掉豁免必须转为命中）
const NEG_PROBES = [
  { key: 'NEG_SPLIT_ZH', sample: '责任比例由保险勘察报告认定，不是和稀泥' },
  { key: 'NEG_SPLIT_EN', sample: 'This ruling is not about splitting the blame; the court decided.' },
  { key: 'NEG_SPLIT_EN', sample: 'Justice is not 50-50 when one side is clearly guilty.' },
];

// 本轮新模式清单（按数组键 + 源串定位，不用硬编码索引）
const NEW_PATTERNS = [];
const addNew = (key, pred) => {
  I[key].forEach((re, j) => { if (pred(String(re), j)) NEW_PATTERNS.push([key, j, String(re)]); });
};
addNew('BLAME_ZH', (s, j) => j >= 15);                       // 公说公有理族 + 都有错族（[12] 一个说族在更早，已有样本）
addNew('SPLIT_ZH', () => true);                              // 整组新族
addNew('BLAME_EN', (s, j) => j >= 3);                        // [3..] 全为新族（[0..2] blame/at fault/guilty 存量）
addNew('SPLIT_EN', () => true);                              // 整组新族
addNew('NEG_SPLIT_ZH', () => true);
addNew('NEG_SPLIT_EN', () => true);
addNew('TRUTH_EN', (s) => /halfway between/.test(s));        // r406 新增 halfway 形

// 基线：无注入时全部命中
const baseMiss = ATTACK.filter((s) => !checkArgumentToModeration(s).hit);
console.log('攻击样本数:', ATTACK.length, '基线未命中:', baseMiss.length);
for (const s of baseMiss) console.log('  ✗', s);

let red = 0, notRed = 0;
const notRedList = [];
for (const [key, idx, src] of NEW_PATTERNS) {
  const arr = I[key].filter((_, j) => j !== idx);
  let flipped = false;
  let flipSample = '';
  for (const s of ATTACK) {
    if (checkArgumentToModeration(s, { [key]: arr }).hit !== checkArgumentToModeration(s).hit) {
      flipped = true; flipSample = s; break;
    }
  }
  for (const np of NEG_PROBES) {
    if (np.key !== key) continue;
    const before = checkArgumentToModeration(np.sample).hit;
    const after = checkArgumentToModeration(np.sample, { [key]: arr }).hit;
    if (!before && after) { flipped = true; flipSample = np.sample + '（豁免删条）'; }
  }
  if (flipped) { red++; console.log(`  ✅ ${key}[${idx}] 删条变红 ← ${flipSample.slice(0, 40)}`); }
  else { notRed++; notRedList.push(`${key}[${idx}] ${src.slice(0, 64)}`); }
}
console.log(`\n删条负例：注入 ${NEW_PATTERNS.length} 个 → ${red} 个变红, ${notRed} 个未变红`);
if (notRedList.length) {
  console.log('未变红（冗余/装饰）模式：');
  for (const x of notRedList) console.log('  ' + x);
}
console.log('CLEANUP-OK');
process.exit(notRed > 0 || baseMiss.length > 0 ? 1 : 0);
