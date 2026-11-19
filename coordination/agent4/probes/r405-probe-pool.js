// r405 同池探针：F3 affirming_disjunct 补形 × F4 relative_pration 补形
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkAffirmingDisjunct } = require('/data/home/heartflow/src/affirming-disjunct.js');
const { checkRelativePrivation } = require('/data/home/heartflow/src/relative-pration.js');

const F3_ATK = [
  '他在北京或者上海工作，既然有人在北京见到他，那就说明他不在上海',
  '他在北京或者上海工作，昨天有人在北京见到他，上海出局',
  'He works in Beijing or Shanghai; someone saw him there yesterday, so Shanghai is ruled out.',
  'She is in the library or the lab; classmates saw her in the library, so the lab is out.',
  '方案A或者方案B，评委们选了A，B落选',
  '报告是用 Python 或者 R 写的，作者承认用了 Python，R 可以排除了',
  'The meeting is on Monday or Tuesday; the invite says Monday, so Tuesday is off the table.',
  '机票是国航或者东航的，订单页显示国航，东航可以划掉了',
  'The bug is in the parser or the lexer; the stack trace points at the parser, so the lexer is cleared.',
  '他不是去了图书馆就是去了实验室，同学说在图书馆看到他了，实验室排除',
];
const F3_BEN = [
  '他要么留任要么离职，既然已经提交了辞呈，那就是离职',
  '他在北京和上海都有办公室，两地跑是常态',
  '他喜欢咖啡或者茶，两个都常备',
  '会议定在周一或者周二，两个时间段都预留了，以防冲突',
  '开关要么是开的要么是关的，它现在是开的，所以不是关的',
  'He enjoys tea or coffee in the morning, often both.',
  'The venue is booked for Monday or Tuesday; both slots are held in case of a conflict.',
  '他在北京或者上海工作，两地都有项目，所以不能排除任何一种可能',
];
const F4_ATK = [
  '你抱怨房租贵？想想还有多少人无家可归',
  'You think your workload is bad? Some people do not even have a job.',
  'Stop complaining about the commute—some people walk for hours to get to work.',
  '至少你还有地方住，有的人流离失所',
  'At least you have a bed to sleep in; some people have nowhere to sleep at night.',
  '这点累算什么，有人连安稳觉都睡不上',
  '这点伤不算什么，想想大山里还有人连像样的床都没有',
  'You call this exhausting? Plenty of people cannot even afford a place to stay.',
  '你嫌累？有人连安稳觉都睡不上',
  '你叫苦什么？山里的孩子连教室都没有',
  'You say your deadline is tight? Some teams cannot even afford a place to work.',
];
const F4_BEN = [
  '加班确实辛苦，但同时也要看到还有更困难的群体，两者并不矛盾',
  '虽然我们有诸多不易，承认别人的苦难同样重要',
  '我们的待遇还有改善空间，这与关注更广泛的议题并不冲突',
  'Yes others struggle more, but that does not make your workload okay to ignore.',
  '理解全球贫困很重要，这也包括对住房保障制度的持续投入',
  '无家可归是城市治理的重要议题，需要系统性的住房保障方案',
  '他每天通勤四小时，确实辛苦',
  'Some people walk an hour to work, which is why transit funding matters.',
  '你觉得房租高吗？我们可以对比各城市的收入房价比数据',
  'You think the housing crisis is serious? Many people are homeless and the city must act.',
  '灾民流离失所，应急安置和长期住房保障都要跟上',
  '许多人无家可归，收容所 capacity 需要扩建——这是社会政策问题',
  '他露宿街头一周了，社工已经介入',
  'Do you think the shelter has enough beds? The intake numbers are public.',
];

function runPool(name, atk, ben) {
  console.log(`\n=== ${name} 攻击（漏判=checkOutput pass）===`);
  const missed = [];
  for (const t of atk) {
    let r;
    try { r = hf.checkOutput(t); } catch (e) { console.log('  [ERR]', t.slice(0, 30), e.message); continue; }
    const dims = (r.findings || []).map((f) => f.dimension).join(',');
    const miss = r.gate.action === 'pass';
    if (miss) missed.push(t);
    console.log(`  [${r.gate.action}] ${dims || 'none'} | ${t.slice(0, 42)}`);
  }
  console.log(`--- ${name} 良性（误伤=非 pass）---`);
  const hurt = [];
  for (const t of ben) {
    let r;
    try { r = hf.checkOutput(t); } catch (e) { console.log('  [ERR]', t.slice(0, 30), e.message); continue; }
    const dims = (r.findings || []).map((f) => f.dimension).join(',');
    if (r.gate.action !== 'pass') hurt.push(`${t} → ${r.gate.action} ${dims}`);
    console.log(`  [${r.gate.action}] ${dims || 'none'} | ${t.slice(0, 42)}`);
  }
  console.log(`>>> ${name}: 攻击漏判 ${missed.length}/${atk.length}，良性误伤 ${hurt.length}/${ben.length}`);
  if (missed.length) console.log('    漏判清单: ' + missed.map((s) => s.slice(0, 40)).join(' || '));
  if (hurt.length) console.log('    误伤清单: ' + hurt.map((s) => s.slice(0, 50)).join(' || '));
  return { missed, hurt };
}

// 模块层归因（直查两个宿主维度）
function moduleProbe(name, list, fn, dimName) {
  console.log(`\n=== ${name} 模块层归因（${dimName} hit）===`);
  let hit = 0;
  for (const t of list) {
    const r = fn(t);
    if (r.hit || (r.score || 0) > 0) hit++;
    console.log(`  [${r.hit || (r.score || 0) > 0 ? 'HIT' : 'miss'}] ${t.slice(0, 42)}`);
  }
  console.log(`>>> 模块层 ${dimName}: ${hit}/${list.length}`);
}

const f3 = runPool('F3_affirming_disjunct_extension', F3_ATK, F3_BEN);
const f4 = runPool('F4_relative_privation_extension', F4_ATK, F4_BEN);
moduleProbe('F3', F3_ATK, checkAffirmingDisjunct, 'affirming_disjunct');
moduleProbe('F4', F4_ATK, checkRelativePrivation, 'relative_pration');

console.log('\n=== 定拨小结 ===');
console.log(JSON.stringify({
  F3: { missed: f3.missed.length, atk: F3_ATK.length, hurt: f3.hurt.length, ben: F3_BEN.length },
  F4: { missed: f4.missed.length, atk: F4_ATK.length, hurt: f4.hurt.length, ben: F4_BEN.length },
}, null, 2));
